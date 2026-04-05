import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidSlug } from '@/lib/tenant';

// POST /api/clone — Clone a template into a new app instance
// This is the core operation: template → tenant + app_instance + integration stubs
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { template_id, slug, name } = body;

  if (!template_id || !slug || !name?.trim()) {
    return NextResponse.json({ error: 'template_id, slug, and name are required' }, { status: 400 });
  }

  // Validate slug
  const slugCheck = isValidSlug(slug);
  if (!slugCheck.valid) {
    return NextResponse.json({ error: slugCheck.error }, { status: 400 });
  }

  // Fetch the template (RLS ensures user can see it)
  const { data: template, error: tplError } = await supabase
    .from('app_templates')
    .select(`
      *,
      integration_definitions(*)
    `)
    .eq('id', template_id)
    .single();

  if (tplError || !template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  // Check if template is published (or user is the creator)
  if (template.status !== 'published' && template.creator_id !== user.id) {
    return NextResponse.json({ error: 'Template not available for cloning' }, { status: 403 });
  }

  // For paid templates, verify purchase before allowing clone
  if (template.creator_id !== user.id) {
    const { data: pricing } = await supabase
      .from('template_pricing')
      .select('pricing_type')
      .eq('template_id', template_id)
      .single();

    if (pricing && pricing.pricing_type !== 'free') {
      const { data: purchase } = await supabase
        .from('template_purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('template_id', template_id)
        .single();

      if (!purchase) {
        return NextResponse.json({ error: 'Purchase required for this template' }, { status: 403 });
      }
    }
  }

  // Check slug availability
  const { data: existingTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existingTenant) {
    return NextResponse.json({ error: 'This subdomain is already taken' }, { status: 409 });
  }

  // --- Begin clone transaction ---
  // We use the user's client for tenant/instance creation (RLS enforces ownership),
  // and admin client for increment_clone_count (needs elevated access).

  // 1. Create tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      owner_id: user.id,
      name: name.trim(),
      slug: slug.toLowerCase(),
    })
    .select()
    .single();

  if (tenantError) {
    return NextResponse.json({ error: 'Failed to create tenant: ' + tenantError.message }, { status: 500 });
  }

  // 2. Create app instance with a snapshot of the template config
  const { data: instance, error: instanceError } = await supabase
    .from('app_instances')
    .insert({
      tenant_id: tenant.id,
      template_id: template.id,
      name: name.trim(),
      status: 'active',
      config_snapshot: {
        ui_config: template.ui_config,
        api_config: template.api_config,
        db_schema: template.db_schema,
      },
    })
    .select()
    .single();

  if (instanceError) {
    // Rollback: delete the tenant we just created
    await supabase.from('tenants').delete().eq('id', tenant.id);
    return NextResponse.json({ error: 'Failed to create app instance' }, { status: 500 });
  }

  // 3. Create integration stubs (all marked "not_connected")
  // NEVER copy secrets or API keys from the original template
  const integrations = template.integration_definitions || [];
  if (integrations.length > 0) {
    const integrationRows = integrations.map((def: { id: string }) => ({
      tenant_id: tenant.id,
      integration_def_id: def.id,
      status: 'not_connected' as const,
    }));

    await supabase.from('tenant_integrations').insert(integrationRows);
  }

  // 4. Increment clone count (admin client bypasses RLS for this function)
  const adminClient = createAdminClient();
  await (adminClient.rpc as Function)('increment_clone_count', { template_uuid: template.id });

  return NextResponse.json({
    tenant,
    instance,
    subdomain: `${tenant.slug}.clonebase.app`,
    setup_required: integrations.length > 0,
  }, { status: 201 });
}
