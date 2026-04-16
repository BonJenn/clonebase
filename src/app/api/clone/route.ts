import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidSlug } from '@/lib/tenant';

// POST /api/clone — Clone a template
// For static templates: tenant + app_instance + integration stubs (existing flow)
// For generated templates: fork as a new draft template + copy generated code
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { template_id, slug, name } = body;

  if (!template_id || !name?.trim()) {
    return NextResponse.json({ error: 'template_id and name are required' }, { status: 400 });
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

  // Branch: generated templates use fork flow, static templates use tenant flow
  if (template.source_type === 'generated') {
    return handleGeneratedFork(supabase, user, template, name.trim());
  }

  // --- Static template: existing clone flow ---
  if (!slug) {
    return NextResponse.json({ error: 'slug is required for static templates' }, { status: 400 });
  }

  const slugCheck = isValidSlug(slug);
  if (!slugCheck.valid) {
    return NextResponse.json({ error: slugCheck.error }, { status: 400 });
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

  // Look up the current template version so we can pin the clone to it.
  // The clone stays on this version until the owner explicitly upgrades,
  // even if the original creator publishes newer versions.
  const { data: currentVersionRow } = await supabase
    .from('generated_templates')
    .select('version')
    .eq('template_id', template.id)
    .eq('is_current', true)
    .limit(1)
    .maybeSingle() as { data: { version: number } | null };
  const pinnedVersion = currentVersionRow?.version || null;

  // 2. Create app instance with a snapshot of the template config
  const { data: instance, error: instanceError } = await supabase
    .from('app_instances')
    .insert({
      tenant_id: tenant.id,
      template_id: template.id,
      name: name.trim(),
      status: 'active',
      template_version: pinnedVersion,
      original_clone_version: pinnedVersion,
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

    const { error: integError } = await supabase.from('tenant_integrations').insert(integrationRows);
    if (integError) {
      // Rollback: delete the instance and tenant
      await supabase.from('app_instances').delete().eq('id', instance.id);
      await supabase.from('tenants').delete().eq('id', tenant.id);
      return NextResponse.json({ error: 'Failed to create integrations' }, { status: 500 });
    }
  }

  // 4. Increment clone count (admin client bypasses RLS for this function)
  const adminClient = createAdminClient();
  await (adminClient.rpc as Function)('increment_clone_count', { template_uuid: template.id }).catch(() => {});

  return NextResponse.json({
    tenant,
    instance,
    subdomain: `${tenant.slug}.clonebase.app`,
    setup_required: integrations.length > 0,
  }, { status: 201 });
}

// Fork a generated template: copy template row + generated code as a new draft
async function handleGeneratedFork(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  user: { id: string },
  template: Record<string, unknown>,
  name: string,
) {
  // 1. Create a new app_templates row (fork)
  const { data: newTemplate, error: tplInsertError } = await supabase
    .from('app_templates')
    .insert({
      creator_id: user.id,
      name,
      slug: 'fork-' + Date.now().toString(36),
      description: template.description,
      long_description: template.long_description,
      category: template.category,
      tags: template.tags,
      icon_url: template.icon_url,
      preview_url: template.preview_url,
      status: 'draft',
      visibility: 'private',
      source_type: 'generated',
    })
    .select()
    .single();

  if (tplInsertError || !newTemplate) {
    return NextResponse.json({ error: 'Failed to fork template' }, { status: 500 });
  }

  // 2. Copy the latest generated_templates row (the actual code)
  const { data: sourceCode } = await supabase
    .from('generated_templates')
    .select('*')
    .eq('template_id', template.id)
    .eq('is_current', true)
    .limit(1)
    .maybeSingle();

  if (sourceCode) {
    await supabase.from('generated_templates').insert({
      template_id: newTemplate.id,
      page_code: sourceCode.page_code,
      admin_code: sourceCode.admin_code,
      api_handler_code: sourceCode.api_handler_code,
      component_files: sourceCode.component_files || {},
      generation_prompt: sourceCode.generation_prompt,
      conversation_history: sourceCode.conversation_history,
      model_used: sourceCode.model_used,
      version: 1,
      is_current: true,
    });
  }

  // 3. Increment clone count on the original
  const adminClient = createAdminClient();
  await (adminClient.rpc as Function)('increment_clone_count', { template_uuid: template.id }).catch(() => {});

  return NextResponse.json({
    template: newTemplate,
    redirect: `/builder/${newTemplate.id}`,
  }, { status: 201 });
}
