import { createAdminClient } from '@/lib/supabase/admin';
import { decrypt } from '@/lib/crypto';
import type { EncryptedSecret } from '@/types';

// Server-side function for template API routes to call external APIs.
// Decrypts the tenant's stored API key and makes the call directly.
// This is the server-side equivalent of useIntegration.
export async function callIntegration(
  tenantId: string,
  serviceKey: string,
  endpoint: string,
  options?: { method?: string; body?: unknown; headers?: Record<string, string> }
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const admin = createAdminClient();

  // Find the integration
  const { data: integration } = await admin
    .from('tenant_integrations')
    .select('id, status, definition:integration_definitions!inner(service_key)')
    .eq('tenant_id', tenantId)
    .eq('definition.service_key', serviceKey)
    .single() as { data: { id: string; status: string; definition: { service_key: string } } | null };

  if (!integration || integration.status !== 'connected') {
    return { ok: false, status: 400, data: { error: `Integration "${serviceKey}" not connected` } };
  }

  // Decrypt secrets
  const { data: secrets } = await admin
    .from('encrypted_secrets')
    .select('*')
    .eq('tenant_integration_id', integration.id);

  const decrypted: Record<string, string> = {};
  for (const s of (secrets || []) as EncryptedSecret[]) {
    decrypted[s.field_name] = decrypt({
      encrypted_value: s.encrypted_value,
      iv: s.iv,
      auth_tag: s.auth_tag,
    });
  }

  // Build request
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };
  if (decrypted.api_key) {
    headers['Authorization'] = `Bearer ${decrypted.api_key}`;
  }

  const method = options?.method || 'POST';
  const res = await fetch(endpoint, {
    method,
    headers,
    body: method !== 'GET' ? JSON.stringify(options?.body) : undefined,
  });

  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}
