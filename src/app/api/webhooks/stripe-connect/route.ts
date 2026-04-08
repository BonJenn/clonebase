import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculatePlatformFee } from '@/lib/stripe-connect';
import Stripe from 'stripe';

// POST /api/webhooks/stripe-connect
//
// Handles webhook events for Stripe Connect (connected accounts).
// These events come on a SEPARATE webhook endpoint from the platform's main
// webhook, with a different signing secret (STRIPE_CONNECT_WEBHOOK_SECRET).
//
// Events handled:
// - checkout.session.completed → record the payment in tenant_payments,
//   write a row into tenant_data.orders so the generated app sees it
// - account.updated → refresh the user's cached Connect status
//
// Stripe sends Connect events with `event.account` set to the connected
// account id, which we use to look up the owning user.
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_CONNECT_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const tenantId = session.metadata?.tenant_id;
      const connectAccountId = event.account as string | undefined;

      if (!tenantId || !connectAccountId) break;

      // Pull line items from the session
      let lineItems: Stripe.LineItem[] = [];
      try {
        const items = await getStripe().checkout.sessions.listLineItems(session.id, {
          limit: 100,
        }, { stripeAccount: connectAccountId });
        lineItems = items.data;
      } catch {
        // Non-fatal: still record the payment
      }

      const amountTotal = session.amount_total || 0;
      const platformFee = calculatePlatformFee(amountTotal);

      // Record the payment
      await (admin.from('tenant_payments') as any).insert({
        tenant_id: tenantId,
        stripe_account_id: connectAccountId,
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string | null,
        amount_cents: amountTotal,
        platform_fee_cents: platformFee,
        currency: session.currency || 'usd',
        customer_email: session.customer_details?.email || session.customer_email || null,
        customer_name: session.customer_details?.name || null,
        line_items: lineItems.map((li) => ({
          name: li.description,
          quantity: li.quantity,
          amount_cents: li.amount_total,
        })),
        status: 'paid',
        metadata: session.metadata || {},
        paid_at: new Date().toISOString(),
      });

      // Also write into tenant_data.orders so the generated app's admin
      // dashboard can list orders without a separate query.
      await (admin.from('tenant_data') as any).insert({
        tenant_id: tenantId,
        collection: 'orders',
        data: {
          stripe_session_id: session.id,
          amount_cents: amountTotal,
          currency: session.currency || 'usd',
          customer_email: session.customer_details?.email || session.customer_email,
          customer_name: session.customer_details?.name,
          items: lineItems.map((li) => ({
            name: li.description,
            quantity: li.quantity,
            amount_cents: li.amount_total,
          })),
          status: 'paid',
          paid_at: new Date().toISOString(),
        },
      });

      break;
    }

    case 'account.updated': {
      const account = event.data.object as Stripe.Account;
      // Refresh the cached Connect state on whichever profile owns this account
      await (admin.from('profiles') as any)
        .update({
          stripe_connect_charges_enabled: account.charges_enabled ?? false,
          stripe_connect_payouts_enabled: account.payouts_enabled ?? false,
          stripe_connect_details_submitted: account.details_submitted ?? false,
          stripe_connect_country: account.country ?? null,
        })
        .eq('stripe_connect_account_id', account.id);
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      // Mark matching payment as refunded if we have the session id
      if (charge.payment_intent) {
        await (admin.from('tenant_payments') as any)
          .update({ status: 'refunded' })
          .eq('stripe_payment_intent_id', charge.payment_intent);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
