import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import { TIERS, getPrice } from '@/lib/plans';

// POST /api/billing/subscribe
//
// Creates a Stripe Checkout session for a subscription. The user picks a
// tier (starter/pro/business) and a credit amount (100-1000). Stripe handles
// payment collection; the webhook handler provisions the subscription after
// checkout completes.
//
// Body: { tier_id: string, credits: number }
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { tier_id, credits } = await request.json();

  // Validate tier + credits combo
  const tier = TIERS[tier_id];
  if (!tier || tier.id === 'free') {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
  }
  if (!tier.creditOptions.includes(credits)) {
    return NextResponse.json({ error: 'Invalid credit amount for this tier' }, { status: 400 });
  }

  const priceCents = getPrice(tier_id, credits);
  const stripe = getStripe();

  // Find or create a Stripe customer for this user
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .single() as { data: { stripe_customer_id: string | null; email: string } | null };

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    try {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email || '',
        metadata: { clonebase_user_id: user.id },
      });
      customerId = customer.id;

      // Save customer ID to profile (admin client to bypass RLS)
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const admin = createAdminClient();
      await (admin.from('profiles') as any)
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    } catch (err) {
      console.error('[billing] customer creation failed:', (err as Error).message);
      return NextResponse.json({ error: 'Failed to create billing account' }, { status: 500 });
    }
  }

  // Create a Checkout session for a recurring subscription
  const origin = request.headers.get('origin') || 'https://clonebase.app';

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Clonebase ${tier.name}`,
              description: `${credits} credits/month — ${tier.description}`,
            },
            unit_amount: priceCents,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard?subscription=success`,
      cancel_url: `${origin}/pricing?subscription=canceled`,
      metadata: {
        clonebase_user_id: user.id,
        tier_id,
        credits: String(credits),
      },
      subscription_data: {
        metadata: {
          clonebase_user_id: user.id,
          tier_id,
          credits: String(credits),
        },
      },
    } as Parameters<typeof stripe.checkout.sessions.create>[0]);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = (err as Error).message || 'Stripe error';
    console.error('[billing] checkout session creation failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
