'use client';

import { useCallback, useState } from 'react';
import { useTenant } from './tenant-context';

export interface CheckoutLineItem {
  /** ID returned by useTenantData for the product/service being purchased. */
  id: string;
  /** Number of units. 1-999. */
  quantity: number;
}

export interface CheckoutOptions {
  /**
   * Where to redirect the customer after a successful payment.
   * Defaults to the current URL with `?checkout=success`.
   */
  success_url?: string;
  /**
   * Where to redirect if the customer cancels.
   * Defaults to the current URL with `?checkout=canceled`.
   */
  cancel_url?: string;
  /** Pre-fill the customer's email on the Stripe Checkout page. */
  customer_email?: string;
  /** Optional metadata stored on the Stripe session. */
  metadata?: Record<string, string>;
}

/**
 * Hook for generated apps to start a Stripe Checkout session.
 *
 * Money flows directly to the cloner's connected Stripe account; Clonebase
 * takes a 3% platform fee automatically. The cloner must complete Stripe
 * Connect onboarding from /dashboard/payments before this works.
 *
 * @example
 * const { checkout, loading, error } = useStripeCheckout();
 *
 * async function handleBuyNow() {
 *   await checkout([
 *     { id: shirt.id, quantity: 1 },
 *   ]);
 *   // The user is redirected to Stripe Checkout. After payment, they come back
 *   // to success_url and the order is recorded in the `orders` collection.
 * }
 */
export function useStripeCheckout() {
  const { tenantId, instanceId } = useTenant();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = useCallback(
    async (lineItems: CheckoutLineItem[], options: CheckoutOptions = {}) => {
      setLoading(true);
      setError(null);

      try {
        const currentUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';
        const successUrl = options.success_url || `${currentUrl}?checkout=success`;
        const cancelUrl = options.cancel_url || `${currentUrl}?checkout=canceled`;

        const res = await fetch('/api/stripe/connect/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: tenantId,
            app_instance_id: instanceId,
            line_items: lineItems,
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: options.customer_email,
            metadata: options.metadata,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.url) {
          setError(data.error || 'Checkout failed');
          setLoading(false);
          return null;
        }

        // Redirect to Stripe Checkout
        if (typeof window !== 'undefined') {
          window.location.href = data.url;
        }

        return { url: data.url, session_id: data.session_id };
      } catch (err) {
        setError((err as Error).message);
        setLoading(false);
        return null;
      }
    },
    [tenantId, instanceId]
  );

  return { checkout, loading, error };
}
