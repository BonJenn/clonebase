import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { encrypt } from '@/lib/crypto';

// GET /api/integrations?tenant_id=xxx — List integrations for a tenant (status only, no secrets)
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = request.nextUrl.searchParams.get('tenant_id');
  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 });
  }

  // RLS ensures only the tenant owner can see this
  const { data: integrations, error } = await supabase
    .from('tenant_integrations')
    .select(`
      *,
      definition:integration_definitions(*)
    `)
    .eq('tenant_id', tenantId);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
  }

  return NextResponse.json(integrations);
}

// POST /api/integrations — Connect an integration (store encrypted API key)
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { tenant_integration_id, secrets } = body;

  if (!tenant_integration_id || !secrets || typeof secrets !== 'object') {
    return NextResponse.json(
      { error: 'tenant_integration_id and secrets object are required' },
      { status: 400 }
    );
  }

  // Verify the user owns the tenant for this integration
  const { data: integration } = await supabase
    .from('tenant_integrations')
    .select('id, tenant_id')
    .eq('id', tenant_integration_id)
    .single();

  if (!integration) {
    return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
  }

  // Encrypt and store each secret field using admin client (secrets table blocks client access via RLS)
  const adminClient = createAdminClient();
  const secretEntries = Object.entries(secrets as Record<string, string>);

  for (const [fieldName, value] of secretEntries) {
    if (typeof value !== 'string' || !value.trim()) continue;

    const encrypted = encrypt(value);

    // Upsert: update if this field already exists for this integration
    const { error } = await adminClient
      .from('encrypted_secrets')
      .upsert(
        {
          tenant_integration_id,
          field_name: fieldName,
          ...encrypted,
        },
        { onConflict: 'tenant_integration_id,field_name' }
      );

    if (error) {
      return NextResponse.json({ error: `Failed to store secret: ${fieldName}` }, { status: 500 });
    }
  }

  // Update integration status to connected
  await supabase
    .from('tenant_integrations')
    .update({ status: 'connected', connected_at: new Date().toISOString() })
    .eq('id', tenant_integration_id);

  return NextResponse.json({ success: true });
}
