'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TIERS, getPrice, formatPrice } from '@/lib/plans';

const TIER_ORDER = ['free', 'starter', 'pro', 'business'] as const;

const TIER_COLORS: Record<string, string> = {
  free: 'border-gray-200',
  starter: 'border-gray-200',
  pro: 'border-indigo-500 ring-1 ring-indigo-500',
  business: 'border-gray-200',
};

export default function PricingPage() {
  const [selectedCredits, setSelectedCredits] = useState<Record<string, number>>({
    starter: 100,
    pro: 100,
    business: 100,
  });
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe(tierId: string) {
    setLoading(tierId);
    setError(null);
    try {
      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier_id: tierId,
          credits: selectedCredits[tierId],
        }),
      });
      const data = await res.json().catch(() => ({ error: `Server error (${res.status})` }));
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoading(null);
        if (data.error === 'Unauthorized') {
          window.location.href = '/auth/signup?redirect=/pricing';
        } else {
          setError(data.error || 'Something went wrong');
        }
      }
    } catch (err) {
      setLoading(null);
      setError((err as Error).message || 'Network error');
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
          Pick a plan for the features you need. Scale credits up or down anytime.
          Every plan includes hosting, database, and a live URL.
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 max-w-xl mx-auto">
          {error}
        </div>
      )}

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {TIER_ORDER.map((tierId) => {
          const tier = TIERS[tierId];
          const isFree = tierId === 'free';
          const isPro = tierId === 'pro';
          const credits = isFree ? 30 : selectedCredits[tierId];
          const price = isFree ? 0 : getPrice(tierId, credits);

          return (
            <div
              key={tierId}
              className={`relative rounded-2xl border bg-white p-6 flex flex-col ${TIER_COLORS[tierId]}`}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-medium text-white">
                  Most popular
                </div>
              )}

              {/* Tier name + description — fixed height so prices align */}
              <div className="min-h-[72px]">
                <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{tier.description}</p>
              </div>

              {/* Price — always same vertical position */}
              <div className="mt-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    {isFree ? '$0' : formatPrice(price)}
                  </span>
                  <span className="text-sm text-gray-500">/month</span>
                </div>
              </div>

              {/* Credit selector — fixed height container so button aligns even on Free tier */}
              <div className="mt-4 h-[62px]">
                {!isFree ? (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Credits per month</label>
                    <select
                      value={credits}
                      onChange={(e) => setSelectedCredits((s) => ({ ...s, [tierId]: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {tier.creditOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt} credits / month — {formatPrice(getPrice(tierId, opt))}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 pt-2">30 credits included</p>
                )}
              </div>

              {/* CTA — always same vertical position */}
              <div className="mt-4">
                {isFree ? (
                  <Link href="/auth/signup">
                    <Button variant="secondary" className="w-full">Get started free</Button>
                  </Link>
                ) : (
                  <Button
                    onClick={() => handleSubscribe(tierId)}
                    loading={loading === tierId}
                    className={`w-full ${isPro ? 'bg-indigo-600 hover:bg-indigo-500' : ''}`}
                  >
                    Upgrade to {tier.name}
                  </Button>
                )}
              </div>

              {/* Features list — flex-1 fills remaining space */}
              <ul className="mt-6 space-y-2.5 text-sm text-gray-600 flex-1">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">&#10003;</span>
                  {isFree ? '30' : `${credits}`} credits / month
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">&#10003;</span>
                  {tier.maxApps === null ? 'Unlimited' : tier.maxApps} apps
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">&#10003;</span>
                  .clonebase.app subdomain
                </li>
                {tier.features.customDomain && (
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">&#10003;</span>
                    Custom domains
                  </li>
                )}
                {tier.features.stripeConnect && (
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">&#10003;</span>
                    Accept payments (Stripe Connect)
                  </li>
                )}
                {tier.features.removeBranding && (
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">&#10003;</span>
                    Remove Clonebase branding
                  </li>
                )}
                {tier.features.passwordProtected && (
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">&#10003;</span>
                    Password-protected apps
                  </li>
                )}
                {tier.features.priorityGeneration && (
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">&#10003;</span>
                    Priority generation
                  </li>
                )}
                {tier.features.marketplace && (
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">&#10003;</span>
                    Marketplace listing
                  </li>
                )}
                {tier.features.teamAccess && (
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">&#10003;</span>
                    Team access
                  </li>
                )}
                {tier.features.apiAccess && (
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">&#10003;</span>
                    API access
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center text-sm text-gray-500">
        <p>All plans include hosting, database, and a live URL. Cancel anytime.</p>
        <p className="mt-1">1 credit = 1 generation or follow-up message.</p>
      </div>
    </div>
  );
}
