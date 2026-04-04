import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

// POST /api/checkout — Create a Stripe Checkout session for a paid template
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { template_id } = await request.json();
  if (!template_id) {
    return NextResponse.json({ error: 'template_id is required' }, { status: 400 });
  }

  // Fetch template with pricing
  const { data: template } = await supabase
    .from('app_templates')
    .select('id, name, slug, status, creator_id, pricing:template_pricing(*)')
    .eq('id', template_id)
    .single();

  if (!template || template.status !== 'published') {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const pricing = (template.pricing as { pricing_type: string; price_cents: number }[])?.[0];
  if (!pricing || pricing.pricing_type === 'free') {
    return NextResponse.json({ error: 'This template is free — clone it directly' }, { status: 400 });
  }

  // Check if user already purchased
  const { data: existing } = await supabase
    .from('template_purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('template_id', template_id)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Already purchased', purchased: true }, { status: 400 });
  }

  // Creators don't need to buy their own templates
  if (template.creator_id === user.id) {
    return NextResponse.json({ error: 'You own this template — clone it directly', owned: true }, { status: 400 });
  }

  const stripe = getStripe();
  const origin = request.headers.get('origin') || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: template.name,
          description: `Clonebase template: ${template.slug}`,
        },
        unit_amount: pricing.price_cents,
      },
      quantity: 1,
    }],
    metadata: {
      user_id: user.id,
      template_id: template.id,
    },
    success_url: `${origin}/templates/${template.id}?purchased=true`,
    cancel_url: `${origin}/templates/${template.id}`,
  });

  return NextResponse.json({ url: session.url });
}
