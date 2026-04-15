import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { validateTemplateCode } from '@/lib/builder/code-validator';
import { isValidSlug } from '@/lib/tenant';
import { ROOT_DOMAIN } from '@/lib/constants';
import { hashPassword } from '@/lib/password';
import { checkFeature } from '@/lib/tier-gate';

// POST /api/builder/publish — Validate, publish, and/or deploy a generated template
//
// Three independent destinations (at least one required):
//   - deploy_to_url: creates (or updates) a tenant + app_instance at {slug}.clonebase.app
//   - list_on_marketplace: makes the template discoverable in the marketplace
//
// When deploying, app_visibility can be 'public' or 'private'. Private apps
// require an access_password that gates the live URL via a server-rendered
// password form in the tenant layout.
//
// Re-publishing reuses the existing tenant so the URL is stable across
// iterations.
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reqBody: any;
  try {
    reqBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const {
    template_id,
    name,
    description,
    category,
    pricing_type,
    price_cents,
    preview_url,
    slug: requestedSlug,
    deploy_to_url = true,
    list_on_marketplace = false,
    app_visibility = 'public', // 'public' | 'private'
    access_password,
    seed_data, // optional: Record<string, unknown[]> from sandbox
  } = reqBody;

  if (!template_id) return NextResponse.json({ error: 'template_id is required' }, { status: 400 });

  // At least one destination must be selected
  if (!deploy_to_url && !list_on_marketplace) {
    return NextResponse.json({
      error: 'Pick at least one: deploy to a URL or list on the marketplace.',
    }, { status: 400 });
  }

  // Feature gates: check tier before allowing premium features
  if (deploy_to_url && app_visibility === 'private') {
    const gate = await checkFeature(user.id, 'passwordProtected', 'Password-protected apps');
    if (gate) return NextResponse.json({ error: gate }, { status: 403 });

    if (typeof access_password !== 'string' || access_password.trim().length < 4) {
      return NextResponse.json({
        error: 'Private apps require a password of at least 4 characters.',
      }, { status: 400 });
    }
  }

  // Verify ownership
  const { data: template } = await supabase
    .from('app_templates')
    .select('id, creator_id, slug')
    .eq('id', template_id)
    .single();

  if (!template || template.creator_id !== user.id) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  // Fetch current generated code (and its version — we'll pin the creator's
  // instance to this version so their live URL serves what they just published).
  const { data: generated } = await supabase
    .from('generated_templates')
    .select('page_code, admin_code, api_handler_code, version')
    .eq('template_id', template_id)
    .eq('is_current', true)
    .single() as { data: { page_code: string; admin_code: string | null; api_handler_code: string | null; version: number } | null };

  if (!generated) {
    return NextResponse.json({ error: 'No generated code found' }, { status: 400 });
  }
  const currentVersion = generated.version;

  // Validate the code
  const validation = validateTemplateCode({
    page_code: generated.page_code,
    admin_code: generated.admin_code,
    api_handler_code: generated.api_handler_code,
  });

  if (!validation.valid) {
    return NextResponse.json({
      error: 'Code validation failed',
      validation_errors: validation.errors,
      warnings: validation.warnings,
    }, { status: 400 });
  }

  // Update template metadata. visibility on the TEMPLATE controls marketplace
  // visibility (public = listed, private = not listed). The tenant's password
  // protection is a separate concept, stored on the tenant row.
  const updates: Record<string, unknown> = {
    status: 'published',
    visibility: list_on_marketplace ? 'public' : 'private',
    source_type: 'generated',
  };
  if (name) updates.name = name.trim();
  if (description) updates.description = description.trim();
  if (list_on_marketplace && category) updates.category = category;
  if (typeof preview_url === 'string' && preview_url) {
    updates.preview_url = preview_url;
  }

  await supabase
    .from('app_templates')
    .update(updates)
    .eq('id', template_id);

  // Pricing only matters when marketplace-listed
  if (list_on_marketplace && pricing_type) {
    const validType = pricing_type === 'one_time' ? 'one_time' : 'free';
    const priceCents = validType === 'one_time' ? Math.max(100, Math.round(price_cents || 0)) : 0;

    const { data: existingPricing } = await supabase
      .from('template_pricing')
      .select('id')
      .eq('template_id', template_id)
      .limit(1);

    if (existingPricing?.length) {
      await (supabase.from('template_pricing') as any)
        .update({ pricing_type: validType, price_cents: priceCents })
        .eq('template_id', template_id);
    } else {
      await (supabase.from('template_pricing') as any).insert({
        template_id,
        pricing_type: validType,
        price_cents: priceCents,
      });
    }
  }

  // --- Deploy: find or create a tenant + app_instance for the creator ---
  let deployedSlug: string | null = null;
  let instanceId: string | null = null;
  let liveUrl: string | null = null;
  const isPrivate = deploy_to_url && app_visibility === 'private';

  if (deploy_to_url) {
    const { data: existingInstanceRow } = await supabase
      .from('app_instances')
      .select('id, tenant_id, tenant:tenants!inner(id, slug, owner_id)')
      .eq('template_id', template_id)
      .single() as { data: { id: string; tenant_id: string; tenant: { id: string; slug: string; owner_id: string } } | null };

    const reusableInstance =
      existingInstanceRow && existingInstanceRow.tenant?.owner_id === user.id
        ? existingInstanceRow
        : null;

    let tenantId: string;

    if (reusableInstance) {
      // Re-publishing: keep the existing tenant/slug. Ignore any slug the client
      // sent — the URL is stable.
      deployedSlug = reusableInstance.tenant.slug;
      instanceId = reusableInstance.id;
      tenantId = reusableInstance.tenant_id;

      // Refresh the tenant name if the template was renamed
      if (name) {
        await (supabase.from('tenants') as any)
          .update({ name: name.trim() })
          .eq('id', tenantId);
      }

      // Auto-upgrade the creator's own instance to the version they just
      // published. Other owners' clones stay pinned to whatever version they
      // were on until they explicitly upgrade.
      await (supabase.from('app_instances') as any)
        .update({ template_version: currentVersion })
        .eq('id', reusableInstance.id);
    } else {
      // First-time deploy: we need a valid, unique slug
      const rawSlug = (typeof requestedSlug === 'string' && requestedSlug.trim()) || '';
      if (!rawSlug) {
        return NextResponse.json({
          error: 'slug is required to deploy the app for the first time',
        }, { status: 400 });
      }
      const slugCheck = isValidSlug(rawSlug);
      if (!slugCheck.valid) {
        return NextResponse.json({ error: slugCheck.error }, { status: 400 });
      }

      const { data: slugCollision } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', rawSlug.toLowerCase())
        .maybeSingle() as { data: { id: string } | null };

      if (slugCollision) {
        return NextResponse.json({
          error: 'That subdomain is already taken. Try another.',
        }, { status: 409 });
      }

      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          owner_id: user.id,
          name: name?.trim() || 'My App',
          slug: rawSlug.toLowerCase(),
        })
        .select('id, slug')
        .single() as { data: { id: string; slug: string } | null; error: { message: string } | null };

      if (tenantError || !tenant) {
        return NextResponse.json({
          error: 'Failed to create deployment: ' + (tenantError?.message || 'unknown error'),
        }, { status: 500 });
      }
      tenantId = tenant.id;

      const { data: instance, error: instanceError } = await supabase
        .from('app_instances')
        .insert({
          tenant_id: tenant.id,
          template_id,
          name: name?.trim() || 'My App',
          status: 'active',
          config_snapshot: {},
          template_version: currentVersion,
          original_clone_version: currentVersion,
        })
        .select('id')
        .single() as { data: { id: string } | null; error: { message: string } | null };

      if (instanceError || !instance) {
        await supabase.from('tenants').delete().eq('id', tenant.id);
        return NextResponse.json({
          error: 'Failed to create app instance: ' + (instanceError?.message || 'unknown error'),
        }, { status: 500 });
      }

      deployedSlug = tenant.slug;
      instanceId = instance.id;
    }

    // Update password-protection state on the tenant.
    // - Private: hash the password and save
    // - Public: clear any previous password
    if (isPrivate) {
      const { hash, salt } = hashPassword(access_password.trim());
      await (supabase.from('tenants') as any)
        .update({
          access_password_hash: hash,
          access_password_salt: salt,
        })
        .eq('id', tenantId);
    } else {
      await (supabase.from('tenants') as any)
        .update({
          access_password_hash: null,
          access_password_salt: null,
        })
        .eq('id', tenantId);
    }

    // Seed sandbox data into tenant_data if provided
    if (seed_data && typeof seed_data === 'object' && instanceId) {
      try {
        // Clean slate for re-publishes — remove old seeded rows
        await supabase
          .from('tenant_data')
          .delete()
          .eq('app_instance_id', instanceId);

        // Build rows for bulk insert
        const rows: { tenant_id: string; app_instance_id: string; collection: string; data: unknown }[] = [];
        for (const [collection, items] of Object.entries(seed_data)) {
          if (!Array.isArray(items)) continue;
          for (const item of items) {
            rows.push({
              tenant_id: tenantId,
              app_instance_id: instanceId,
              collection,
              data: item,
            });
          }
        }

        if (rows.length > 0) {
          const { error: seedError } = await (supabase.from('tenant_data') as any).insert(rows);
          if (seedError) console.error('[publish] seed data insert failed:', seedError.message);
        }
      } catch (err) {
        console.error('[publish] seed data failed:', (err as Error).message);
        // Non-fatal: app is still published, just without seed data
      }
    }

    // Build live URL
    const origin = request.headers.get('origin') || '';
    const isLocalDev = /localhost|127\.0\.0\.1/.test(origin);
    liveUrl = isLocalDev
      ? `${origin}/?tenant=${deployedSlug}`
      : `https://${deployedSlug}.${ROOT_DOMAIN}`;
  }

  return NextResponse.json({
    published: true,
    template_id,
    instance_id: instanceId,
    slug: deployedSlug,
    live_url: liveUrl,
    deployed: !!deploy_to_url,
    is_private: isPrivate,
    version: currentVersion,
    marketplace_url: list_on_marketplace ? `/templates/${template_id}` : null,
    listed_on_marketplace: !!list_on_marketplace,
    warnings: validation.warnings,
  });
}
