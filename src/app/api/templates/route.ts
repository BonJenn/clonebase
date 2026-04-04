import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// POST /api/templates — Create a new template
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, slug, description, category, pricing_type, price_cents, source_type } = body;

  // Validate required fields
  if (!name?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
  }

  // Validate slug format
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) || slug.length < 3) {
    return NextResponse.json({ error: 'Invalid slug format' }, { status: 400 });
  }

  // Create the template
  const { data: template, error } = await supabase
    .from('app_templates')
    .insert({
      creator_id: user.id,
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description?.trim() || null,
      category: category || null,
      status: 'draft',
      visibility: 'private',
      source_type: source_type === 'generated' ? 'generated' : 'static',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A template with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }

  // Create pricing record
  const validPricingType = pricing_type === 'one_time' ? 'one_time' : 'free';
  await supabase.from('template_pricing').insert({
    template_id: template.id,
    pricing_type: validPricingType,
    price_cents: validPricingType === 'one_time' ? Math.max(100, Math.round(price_cents || 0)) : 0,
  });

  return NextResponse.json(template, { status: 201 });
}
