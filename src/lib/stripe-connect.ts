// Stripe Connect Express helpers.
//
// Architecture: one Connect Express account per Clonebase user (stored on the
// profile). All tenants owned by that user share the same account. Customers pay
// the cloner directly through Stripe; the platform takes 3% via application_fee.
//
// Money flow: customer → Stripe → cloner's connected account, with PLATFORM_FEE_BPS
// of the total transferred to the platform automatically.

import { getStripe } from './stripe';
import type Stripe from 'stripe';

/**
 * Platform fee in basis points (300 = 3%).
 * Applied to every checkout session created via createCheckoutSession().
 */
export const PLATFORM_FEE_BPS = 300;

/**
 * Calculate the platform fee in cents for a given total amount.
 * Floors to avoid charging a fractional cent.
 */
export function calculatePlatformFee(amountCents: number): number {
  return Math.floor((amountCents * PLATFORM_FEE_BPS) / 10_000);
}

/**
 * Create a new Stripe Connect Express account for a cloner.
 * Express accounts are Stripe-hosted: Stripe handles KYC, dashboard, and
 * compliance. The cloner only needs to provide their info via the onboarding
 * link returned by createOnboardingLink().
 */
export async function createConnectAccount(params: {
  email: string;
  country?: string; // ISO 2-letter; defaults to US if not provided
}): Promise<Stripe.Account> {
  return getStripe().accounts.create({
    type: 'express',
    email: params.email,
    country: params.country || 'US',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      platform: 'clonebase',
    },
  });
}

/**
 * Create a hosted onboarding URL for the user to complete their Connect account.
 * The user is redirected to Stripe, fills in their info, then sent back to
 * returnUrl. If they abandon and come back later, refreshUrl is used to
 * regenerate this link.
 */
export async function createOnboardingLink(params: {
  accountId: string;
  returnUrl: string;
  refreshUrl: string;
}): Promise<Stripe.AccountLink> {
  return getStripe().accountLinks.create({
    account: params.accountId,
    return_url: params.returnUrl,
    refresh_url: params.refreshUrl,
    type: 'account_onboarding',
  });
}

/**
 * Fetch the current state of a Connect account.
 * Used to refresh the cached fields on the user's profile (charges_enabled etc).
 */
export async function getAccountStatus(accountId: string): Promise<{
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  country: string | null;
  account: Stripe.Account;
}> {
  const account = await getStripe().accounts.retrieve(accountId);
  return {
    charges_enabled: account.charges_enabled ?? false,
    payouts_enabled: account.payouts_enabled ?? false,
    details_submitted: account.details_submitted ?? false,
    country: account.country ?? null,
    account,
  };
}

/**
 * Generate a one-time login link to the cloner's Stripe Express dashboard.
 * Lets them view payments, manage payouts, and update their info without
 * leaving Clonebase.
 */
export async function createDashboardLink(accountId: string): Promise<string> {
  const link = await getStripe().accounts.createLoginLink(accountId);
  return link.url;
}

/**
 * Create a checkout session that pays the connected account, with the platform
 * fee deducted automatically. This is the destination-charge pattern: the
 * platform's Stripe key creates the session, but the funds (minus fee) go
 * directly to the connected account.
 *
 * The connected account sees the charge in their dashboard. The platform sees
 * the application_fee in its dashboard.
 */
export async function createCheckoutSession(params: {
  connectAccountId: string;
  lineItems: Array<{
    name: string;
    description?: string;
    amount_cents: number;
    quantity: number;
    image_url?: string;
    currency?: string;
  }>;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
  // Build Stripe line items — let TS infer the type from the SDK call
  const stripeLineItems = params.lineItems.map((item) => ({
    price_data: {
      currency: item.currency || 'usd',
      product_data: {
        name: item.name,
        ...(item.description ? { description: item.description } : {}),
        ...(item.image_url ? { images: [item.image_url] } : {}),
      },
      unit_amount: item.amount_cents,
    },
    quantity: item.quantity,
  }));

  // Compute the application fee from the total
  const total = params.lineItems.reduce(
    (sum, item) => sum + item.amount_cents * item.quantity,
    0
  );
  const applicationFee = calculatePlatformFee(total);

  return getStripe().checkout.sessions.create({
    mode: 'payment',
    line_items: stripeLineItems,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    ...(params.customerEmail ? { customer_email: params.customerEmail } : {}),
    payment_intent_data: {
      application_fee_amount: applicationFee,
      transfer_data: {
        destination: params.connectAccountId,
      },
    },
    metadata: {
      platform: 'clonebase',
      ...(params.metadata || {}),
    },
  });
}
