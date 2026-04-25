import { NextRequest, NextResponse } from 'next/server';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { decrypt } from '@/lib/crypto';
import type { EncryptedSecret } from '@/types';

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const BLOCKED_HEADER_NAMES = new Set([
  'authorization',
  'proxy-authorization',
  'cookie',
  'host',
  'connection',
  'content-length',
  'transfer-encoding',
  'upgrade',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
]);

function isPrivateAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    const [a, b] = address.split('.').map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }

  if (version === 6) {
    const normalized = address.toLowerCase();
    if (normalized.startsWith('::ffff:')) {
      return isPrivateAddress(normalized.slice('::ffff:'.length));
    }
    return (
      normalized === '::1' ||
      normalized === '::' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:') ||
      normalized.startsWith('ff')
    );
  }

  return true;
}

function hostnameAllowed(hostname: string, allowedHosts: string[]): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, '');
  return allowedHosts.some((host) => {
    const allowed = host.toLowerCase().replace(/\.$/, '');
    return normalized === allowed || normalized.endsWith(`.${allowed}`);
  });
}

async function validateEndpoint(endpoint: string, allowedHosts: string[]): Promise<URL | null> {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;
  if (!allowedHosts.length || !hostnameAllowed(url.hostname, allowedHosts)) return null;

  const records = await lookup(url.hostname, { all: true, verbatim: true });
  if (!records.length || records.some((record) => isPrivateAddress(record.address))) return null;

  return url;
}

function sanitizeHeaders(headers: unknown): Record<string, string> {
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) return {};

  const safe: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
    const name = key.toLowerCase();
    if (BLOCKED_HEADER_NAMES.has(name)) continue;
    if (typeof value !== 'string') continue;
    safe[key] = value;
  }
  return safe;
}

// POST /api/proxy — Proxy API calls using stored encrypted keys.
// This is how tenant apps call external APIs without exposing keys to the client.
//
// Body: { tenant_id, service_key, endpoint, method?, body?, headers? }
//
// Flow:
// 1. Verify user owns the tenant
// 2. Look up the integration + encrypted secrets (admin client)
// 3. Decrypt the API key server-side
// 4. Make the external API call
// 5. Return the response to the client (without exposing the key)
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { tenant_id, service_key, endpoint, method = 'POST', body: requestBody, headers: customHeaders } = body;
  const httpMethod = typeof method === 'string' ? method.toUpperCase() : 'POST';

  if (!tenant_id || !service_key || !endpoint) {
    return NextResponse.json(
      { error: 'tenant_id, service_key, and endpoint are required' },
      { status: 400 }
    );
  }
  if (!ALLOWED_METHODS.has(httpMethod)) {
    return NextResponse.json({ error: 'Unsupported HTTP method' }, { status: 400 });
  }

  // Verify user owns this tenant (RLS check)
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('id', tenant_id)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  // Find the integration for this service
  const { data: integration } = await supabase
    .from('tenant_integrations')
    .select('id, status, definition:integration_definitions!inner(service_key, allowed_hosts)')
    .eq('tenant_id', tenant_id)
    .eq('definition.service_key', service_key)
    .single();

  if (!integration || integration.status !== 'connected') {
    return NextResponse.json({ error: 'Integration not connected' }, { status: 400 });
  }

  const definition = Array.isArray(integration.definition)
    ? integration.definition[0]
    : integration.definition;
  const allowedHosts = Array.isArray(definition?.allowed_hosts)
    ? definition.allowed_hosts.filter((host: unknown): host is string => typeof host === 'string' && !!host.trim())
    : [];
  const validatedUrl = await validateEndpoint(endpoint, allowedHosts);
  if (!validatedUrl) {
    return NextResponse.json({ error: 'Endpoint is not allowed for this integration' }, { status: 400 });
  }

  // Fetch encrypted secrets (admin client — secrets table blocks client reads)
  const adminClient = createAdminClient();
  const { data: secrets } = await adminClient
    .from('encrypted_secrets')
    .select('*')
    .eq('tenant_integration_id', integration.id);

  if (!secrets?.length) {
    return NextResponse.json({ error: 'No API keys configured' }, { status: 400 });
  }

  // Decrypt secrets into a map
  const decryptedSecrets: Record<string, string> = {};
  for (const secret of secrets as EncryptedSecret[]) {
    decryptedSecrets[secret.field_name] = decrypt({
      encrypted_value: secret.encrypted_value,
      iv: secret.iv,
      auth_tag: secret.auth_tag,
    });
  }

  // Build headers for the external API call
  const externalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...sanitizeHeaders(customHeaders),
  };

  // Inject API key into Authorization header (common pattern)
  if (decryptedSecrets.api_key) {
    externalHeaders['Authorization'] = `Bearer ${decryptedSecrets.api_key}`;
  }

  // Make the external API call
  try {
    const externalResponse = await fetch(validatedUrl.toString(), {
      method: httpMethod,
      headers: externalHeaders,
      body: httpMethod !== 'GET' ? JSON.stringify(requestBody) : undefined,
    });

    const responseData = await externalResponse.json().catch(() => null);

    return NextResponse.json(
      { status: externalResponse.status, data: responseData },
      { status: externalResponse.ok ? 200 : 502 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to reach external API', details: (err as Error).message },
      { status: 502 }
    );
  }
}
