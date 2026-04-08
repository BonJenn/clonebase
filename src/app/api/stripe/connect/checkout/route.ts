import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createCheckoutSession } from '@/lib/stripe-connect';

// POST /api/stripe/connect/checkout
//
// Called by generated apps (via the useStripeCheckout SDK hook) to start a
// payment. Looks up the tenant's owner, finds their Connect account, creates
// a destination-charge Checkout session with the 3% platform fee, and returns
// the hosted Stripe Checkout URL.
//
// Body: {
//   tenant_id: string,
//   line_items: Array<{ name, amount_cents, quantity, description?, image_url?, currency? }>,
//   success_url: string,
//   cancel_url: string,
//   customer_email?: string,
//   metadata?: Record<string, string>
// }
//
// Auth: this endpoint is callable by anyone (the customer doing the checkout
// is not necessarily logged into Clonebase). Trust comes from validating that
// the tenant exists and has a connected Stripe account.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const { tenant_id, line_items, success_url, cancel_url, customer_email, metadata } = body;

  // Basic validation
  if (!tenant_id || typeof tenant_id !== 'string') {
    return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 });
  }
  if (!Array.isArray(line_items) || line_items.length === 0) {
    return NextResponse.json({ error: 'line_items must be a non-empty array' }, { status: 400 });
  }
  if (line_items.length > 50) {
    return NextResponse.json({ error: 'Too many line items (max 50)' }, { status: 400 });
  }
  if (!success_url || !cancel_url) {
    return NextResponse.json({ error: 'success_url and cancel_url are required' }, { status: 400 });
  }

  // Validate URLs and shape of line_items
  try {
    new URL(success_url);
    new URL(cancel_url);
  } catch {
    return NextResponse.json({ error: 'success_url and cancel_url must be valid URLs' }, { status: 400 });
  }

  for (const item of line_items) {
    if (!item || typeof item.name !== 'string' || !item.name.trim()) {
      return NextResponse.json({ error: 'Each line item needs a name' }, { status: 400 });
    }
    if (typeof item.amount_cents !== 'number' || item.amount_cents < 50 || !Number.isFinite(item.amount_cents)) {
      return NextResponse.json({ error: 'Each line item needs amount_cents ≥ 50' }, { status: 400 });
    }
    if (typeof item.quantity !== 'number' || item.quantity < 1 || item.quantity > 999) {
      return NextResponse.json({ error: 'Each line item needs quantity 1-999' }, { status: 400 });
    }
  }

  // Look up the tenant and its owner's Connect account.
  // Use the admin client because the caller may be an unauthenticated customer.
  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from('tenants')
    .select('id, owner_id, slug, name')
    .eq('id', tenant_id)
    .single() as { data: { id: string; owner_id: string; slug: string; name: string } | null };

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_connect_account_id, stripe_connect_charges_enabled')
    .eq('id', tenant.owner_id)
    .single() as { data: { stripe_connect_account_id: string | null; stripe_connect_charges_enabled: boolean } | null };

  if (!profile?.stripe_connect_account_id) {
    return NextResponse.json(
      { error: 'This app has not connected a payment account yet.' },
      { status: 400 }
    );
  }
  if (!profile.stripe_connect_charges_enabled) {
    return NextResponse.json(
      { error: 'Payment account onboarding is incomplete.' },
      { status: 400 }
    );
  }

  // Optionally let the caller authenticate via the platform session — if so,
  // require that they own the tenant (useful for testing your own checkout flow).
  // We don't enforce this because real customers won't have a Clonebase session.
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    const session = await createCheckoutSession({
      connectAccountId: profile.stripe_connect_account_id,
      lineItems: line_items,
      successUrl: success_url,
      cancelUrl: cancel_url,
      customerEmail: typeof customer_email === 'string' ? customer_email : undefined,
      metadata: {
        tenant_id,
        tenant_slug: tenant.slug,
        ...(user?.id ? { clonebase_user_id: user.id } : {}),
        ...(metadata && typeof metadata === 'object' ? metadata as Record<string, string> : {}),
      },
    });

    return NextResponse.json({
      url: session.url,
      session_id: session.id,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
