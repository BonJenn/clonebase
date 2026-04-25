import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createCheckoutSession } from '@/lib/stripe-connect';

type ServerLineItem = Parameters<typeof createCheckoutSession>[0]['lineItems'][number];
type QueryResult<T> = { data: T | null; error: { message: string } | null };
type TenantDataCheckoutRow = { id: string; data: Record<string, unknown> };

interface TenantDataCheckoutQuery extends PromiseLike<QueryResult<TenantDataCheckoutRow[]>> {
  eq(column: string, value: string): TenantDataCheckoutQuery;
  in(column: string, values: string[]): TenantDataCheckoutQuery;
}

interface TenantDataCheckoutTable {
  select(columns: 'id, data'): TenantDataCheckoutQuery;
}

function tenantDataCheckoutTable(admin: ReturnType<typeof createAdminClient>): TenantDataCheckoutTable {
  return admin.from('tenant_data') as unknown as TenantDataCheckoutTable;
}

// POST /api/stripe/connect/checkout
//
// Called by generated apps (via the useStripeCheckout SDK hook) to start a
// payment. Looks up the tenant's owner, finds their Connect account, creates
// a destination-charge Checkout session with the 3% platform fee, and returns
// the hosted Stripe Checkout URL.
//
// Body: {
//   tenant_id: string,
//   app_instance_id: string,
//   line_items: Array<{ id, quantity }>,
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

  const { tenant_id, app_instance_id, line_items, success_url, cancel_url, customer_email, metadata } = body;

  // Basic validation
  if (!tenant_id || typeof tenant_id !== 'string') {
    return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 });
  }
  if (!app_instance_id || typeof app_instance_id !== 'string') {
    return NextResponse.json({ error: 'app_instance_id is required' }, { status: 400 });
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

  // Validate URLs and shape of line_items. Redirects must stay on the calling
  // origin so a generated app cannot create open redirects through Checkout.
  try {
    const requestOrigin = new URL(request.url).origin;
    const success = new URL(success_url);
    const cancel = new URL(cancel_url);
    if (success.origin !== requestOrigin || cancel.origin !== requestOrigin) {
      return NextResponse.json({ error: 'success_url and cancel_url must stay on this app origin' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'success_url and cancel_url must be valid URLs' }, { status: 400 });
  }

  for (const item of line_items) {
    if (!item || typeof item.id !== 'string' || !item.id.trim()) {
      return NextResponse.json({ error: 'Each line item needs a tenant data id' }, { status: 400 });
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) {
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

  const { data: instance } = await admin
    .from('app_instances')
    .select('id')
    .eq('id', app_instance_id)
    .eq('tenant_id', tenant_id)
    .eq('status', 'active')
    .single() as { data: { id: string } | null };

  if (!instance) {
    return NextResponse.json({ error: 'App instance not found' }, { status: 404 });
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

  const rowIds = line_items.map((item: { id: string }) => item.id);
  const { data: rows } = await tenantDataCheckoutTable(admin)
    .select('id, data')
    .eq('tenant_id', tenant_id)
    .eq('app_instance_id', app_instance_id)
    .in('id', rowIds);

  const rowsById = new Map((rows || []).map((row) => [row.id, row.data]));
  const serverLineItems: ServerLineItem[] = [];
  for (const item of line_items as Array<{ id: string; quantity: number }>) {
    const row = rowsById.get(item.id);
    if (!row) {
      return NextResponse.json({ error: 'One or more line items were not found' }, { status: 400 });
    }

    const amount = Number(row.price_cents ?? row.amount_cents);
    if (!Number.isInteger(amount) || amount < 50) {
      return NextResponse.json({ error: 'One or more line items are missing a valid server-side price' }, { status: 400 });
    }

    const name = typeof row.name === 'string' && row.name.trim()
      ? row.name.trim()
      : typeof row.title === 'string' && row.title.trim()
        ? row.title.trim()
        : 'Item';

    serverLineItems.push({
      name,
      description: typeof row.description === 'string' ? row.description : undefined,
      amount_cents: amount,
      quantity: Math.floor(item.quantity),
      image_url: typeof row.image_url === 'string'
        ? row.image_url
        : typeof row.image === 'string'
          ? row.image
          : undefined,
      currency: typeof row.currency === 'string' ? row.currency : undefined,
    });
  }

  try {
    const session = await createCheckoutSession({
      connectAccountId: profile.stripe_connect_account_id,
      lineItems: serverLineItems,
      successUrl: success_url,
      cancelUrl: cancel_url,
      customerEmail: typeof customer_email === 'string' ? customer_email : undefined,
      metadata: {
        tenant_id,
        app_instance_id,
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
