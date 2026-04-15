import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

// POST /api/webhooks/stripe-billing
//
// Handles subscription lifecycle events from Stripe Billing. Provisions,
// updates, and cancels user_subscriptions rows based on Stripe events.
//
// Events handled:
//   checkout.session.completed — initial subscription provisioning
//   customer.subscription.updated — plan changes, renewals
//   customer.subscription.deleted — cancellation
//   invoice.paid — period renewal (refresh credits)
//
// Uses STRIPE_BILLING_WEBHOOK_SECRET (separate from the platform and
// Connect webhook secrets).
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
      process.env.STRIPE_BILLING_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook verification failed: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  switch (event.type) {
    // ── New subscription from Checkout ─────────────────────────────────
    case 'checkout.session.completed': {
      try {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== 'subscription') break;

      const userId = session.metadata?.clonebase_user_id;
      const tierId = session.metadata?.tier_id;
      const credits = parseInt(session.metadata?.credits || '0', 10);
      const subscriptionId = session.subscription as string;

      if (!userId || !tierId || !subscriptionId || !credits) break;

      // Fetch the subscription to get period dates
      const sub = await getStripe().subscriptions.retrieve(subscriptionId) as unknown as Record<string, unknown>;
      const periodStart = typeof sub.current_period_start === 'number' ? sub.current_period_start : Date.now() / 1000;
      const periodEnd = typeof sub.current_period_end === 'number' ? sub.current_period_end : (Date.now() / 1000) + 30 * 86400;

      // Deactivate any existing subscription for this user
      await (admin.from('user_subscriptions') as any)
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('status', 'active');

      // Create new subscription record
      await (admin.from('user_subscriptions') as any).insert({
        user_id: userId,
        tier_id: tierId,
        credits_per_month: credits,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: session.customer as string,
        status: 'active',
        current_period_start: new Date(periodStart * 1000).toISOString(),
        current_period_end: new Date(periodEnd * 1000).toISOString(),
      });
      } catch (err) {
        console.error('[billing webhook] checkout.session.completed failed:', (err as Error).message);
        return NextResponse.json({ error: 'Subscription provisioning failed' }, { status: 500 });
      }

      break;
    }

    // ── Subscription updated (plan change, renewal) ───────────────────
    case 'customer.subscription.updated': {
      try {
        const sub = event.data.object as unknown as Record<string, unknown> & { id: string; metadata?: Record<string, string>; status: string };
        const tierId = sub.metadata?.tier_id;
        const credits = parseInt(sub.metadata?.credits || '0', 10) || 100;
        const pStart = typeof sub.current_period_start === 'number' ? sub.current_period_start : Date.now() / 1000;
        const pEnd = typeof sub.current_period_end === 'number' ? sub.current_period_end : (Date.now() / 1000) + 30 * 86400;

        await (admin.from('user_subscriptions') as any)
          .update({
            tier_id: tierId || undefined,
            credits_per_month: credits,
            status: sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : sub.status,
            current_period_start: new Date(pStart * 1000).toISOString(),
            current_period_end: new Date(pEnd * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);
      } catch (err) {
        console.error('[billing webhook] subscription.updated failed:', (err as Error).message);
        return NextResponse.json({ error: 'Subscription update failed' }, { status: 500 });
      }

      break;
    }

    // ── Subscription canceled ─────────────────────────────────────────
    case 'customer.subscription.deleted': {
      try {
        const sub = event.data.object as Stripe.Subscription;

        await (admin.from('user_subscriptions') as any)
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);
      } catch (err) {
        console.error('[billing webhook] subscription.deleted failed:', (err as Error).message);
        return NextResponse.json({ error: 'Subscription cancellation failed' }, { status: 500 });
      }

      break;
    }

    // ── Invoice paid ──────────────────────────────────────────────────
    case 'invoice.paid': {
      // Credit usage resets automatically because checkCredits() looks
      // at the current period — old periods' usage rows are ignored.
      break;
    }
  }

  return NextResponse.json({ received: true });
}
