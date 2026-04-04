import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { decrypt } from '@/lib/crypto';
import type { EncryptedSecret } from '@/types';

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

  if (!tenant_id || !service_key || !endpoint) {
    return NextResponse.json(
      { error: 'tenant_id, service_key, and endpoint are required' },
      { status: 400 }
    );
  }

  // Validate endpoint is a proper URL (prevent SSRF with basic check)
  try {
    const url = new URL(endpoint);
    // Block requests to internal/private networks
    const hostname = url.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('172.') ||
      hostname.endsWith('.internal')
    ) {
      return NextResponse.json({ error: 'Internal endpoints not allowed' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid endpoint URL' }, { status: 400 });
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
    .select('id, status, definition:integration_definitions(service_key)')
    .eq('tenant_id', tenant_id)
    .single();

  if (!integration || integration.status !== 'connected') {
    return NextResponse.json({ error: 'Integration not connected' }, { status: 400 });
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
    ...customHeaders,
  };

  // Inject API key into Authorization header (common pattern)
  if (decryptedSecrets.api_key) {
    externalHeaders['Authorization'] = `Bearer ${decryptedSecrets.api_key}`;
  }

  // Make the external API call
  try {
    const externalResponse = await fetch(endpoint, {
      method,
      headers: externalHeaders,
      body: method !== 'GET' ? JSON.stringify(requestBody) : undefined,
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
