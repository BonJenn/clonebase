'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { TIERS, formatPrice } from '@/lib/plans';

interface Subscription {
  tier_id: string;
  credits_per_month: number;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
}

interface Usage {
  credits_used: number;
  credits_limit: number;
}

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }: { data: { user: { id: string } | null } }) => {
      if (!user) { setLoading(false); return; }

      // Fetch subscription
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('tier_id, credits_per_month, status, current_period_start, current_period_end')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      setSub(subData as Subscription | null);

      // Fetch current period usage
      const now = new Date();
      let periodStart: string;
      if (subData?.current_period_start) {
        periodStart = subData.current_period_start;
      } else {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      }
      const { data: usageData } = await supabase
        .from('credit_usage')
        .select('credits_used, credits_limit')
        .eq('user_id', user.id)
        .eq('period_start', periodStart)
        .maybeSingle();
      setUsage(usageData as Usage | null);

      setLoading(false);
    });
  }, []);

  async function handleOpenPortal() {
    setPortalLoading(true);
    const res = await fetch('/api/billing/portal', { method: 'POST' });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
    setPortalLoading(false);
  }

  const tier = TIERS[sub?.tier_id || 'free'];
  const creditsUsed = usage?.credits_used || 0;
  const creditsLimit = sub?.credits_per_month || 30;
  const creditsRemaining = Math.max(0, creditsLimit - creditsUsed);
  const usagePct = creditsLimit > 0 ? Math.min(100, Math.round((creditsUsed / creditsLimit) * 100)) : 0;

  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
      <nav className="mb-4 sm:mb-6 text-xs sm:text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Billing</span>
      </nav>

      <h1 className="text-xl sm:text-2xl font-bold">Billing & Usage</h1>

      {loading ? (
        <div className="mt-8 space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
      ) : (
        <>
          {/* Current plan */}
          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{tier.name}</h2>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    sub?.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {sub?.status === 'active' ? 'Active' : 'Free'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{tier.description}</p>
                {sub && (
                  <p className="mt-1 text-xs text-gray-500">
                    {creditsLimit} credits/month · Renews {periodEnd}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {sub ? (
                  <Button onClick={handleOpenPortal} loading={portalLoading} variant="secondary" className="w-full sm:w-auto">
                    Manage Subscription
                  </Button>
                ) : (
                  <Link href="/pricing" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto">Upgrade</Button>
                  </Link>
                )}
              </div>
            </div>
          </section>

          {/* Credit usage */}
          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Credit Usage</h2>
            <p className="mt-1 text-sm text-gray-600">
              {creditsUsed} of {creditsLimit} credits used this period
            </p>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">{creditsRemaining} remaining</span>
                <span className="text-gray-500">{usagePct}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    usagePct >= 90 ? 'bg-red-500' : usagePct >= 70 ? 'bg-amber-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${usagePct}%` }}
                />
              </div>
            </div>
            {creditsRemaining === 0 && (
              <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                You&apos;ve used all your credits this period.{' '}
                <Link href="/pricing" className="font-medium text-amber-900 underline">
                  Upgrade your plan
                </Link>{' '}
                to keep building.
              </div>
            )}
            <p className="mt-4 text-xs text-gray-500">
              1 credit = 1 AI generation or follow-up. Credits reset each billing period.
            </p>
          </section>

          {/* Plan features */}
          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Plan Features</h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Apps', value: tier.maxApps === null ? 'Unlimited' : String(tier.maxApps), enabled: true },
                { label: 'Custom domains', value: tier.features.customDomain ? 'Yes' : 'Pro+', enabled: tier.features.customDomain },
                { label: 'Stripe Connect', value: tier.features.stripeConnect ? 'Yes' : 'Pro+', enabled: tier.features.stripeConnect },
                { label: 'Remove branding', value: tier.features.removeBranding ? 'Yes' : 'Starter+', enabled: tier.features.removeBranding },
                { label: 'Password-protected apps', value: tier.features.passwordProtected ? 'Yes' : 'Starter+', enabled: tier.features.passwordProtected },
                { label: 'Priority generation', value: tier.features.priorityGeneration ? 'Yes' : 'Pro+', enabled: tier.features.priorityGeneration },
                { label: 'Team access', value: tier.features.teamAccess ? 'Yes' : 'Business', enabled: tier.features.teamAccess },
                { label: 'API access', value: tier.features.apiAccess ? 'Yes' : 'Business', enabled: tier.features.apiAccess },
              ].map((feature) => (
                <div key={feature.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700">{feature.label}</span>
                  <span className={`text-sm font-medium ${feature.enabled ? 'text-green-700' : 'text-gray-400'}`}>
                    {feature.value}
                  </span>
                </div>
              ))}
            </div>
            {!sub && (
              <div className="mt-4">
                <Link href="/pricing">
                  <Button variant="secondary" className="w-full sm:w-auto">See all plans</Button>
                </Link>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
