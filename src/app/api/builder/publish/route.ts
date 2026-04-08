import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { validateTemplateCode } from '@/lib/builder/code-validator';

// POST /api/builder/publish — Validate and publish a generated template
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { template_id, name, description, category, pricing_type, price_cents, preview_url } = await request.json();
  if (!template_id) return NextResponse.json({ error: 'template_id is required' }, { status: 400 });

  // Verify ownership
  const { data: template } = await supabase
    .from('app_templates')
    .select('id, creator_id, slug')
    .eq('id', template_id)
    .single();

  if (!template || template.creator_id !== user.id) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  // Fetch current generated code
  const { data: generated } = await supabase
    .from('generated_templates')
    .select('page_code, admin_code, api_handler_code')
    .eq('template_id', template_id)
    .eq('is_current', true)
    .single();

  if (!generated) {
    return NextResponse.json({ error: 'No generated code found' }, { status: 400 });
  }

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

  // Update template metadata and publish
  const updates: Record<string, unknown> = {
    status: 'published',
    visibility: 'public',
    source_type: 'generated',
  };
  if (name) updates.name = name.trim();
  if (description) updates.description = description.trim();
  if (category) updates.category = category;
  // preview_url is uploaded ahead of the publish call via /api/builder/upload-preview.
  // Allow explicit null to clear an existing preview.
  if (typeof preview_url === 'string' || preview_url === null) {
    updates.preview_url = preview_url;
  }

  await supabase
    .from('app_templates')
    .update(updates)
    .eq('id', template_id);

  // Update pricing if provided — explicit update or insert since template_pricing
  // doesn't have a unique constraint on template_id
  if (pricing_type) {
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

  return NextResponse.json({
    published: true,
    template_id,
    slug: template.slug,
    warnings: validation.warnings,
  });
}
