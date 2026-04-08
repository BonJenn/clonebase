'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface ConnectStatus {
  connected: boolean;
  account_id: string | null;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  country: string | null;
}

interface Payment {
  id: string;
  amount_cents: number;
  platform_fee_cents: number;
  currency: string;
  customer_email: string | null;
  customer_name: string | null;
  status: string;
  created_at: string;
}

function formatMoney(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function PaymentsContent() {
  const searchParams = useSearchParams();
  const onboardingState = searchParams.get('onboarding'); // 'complete' | 'refresh' | null

  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch Connect status (refreshes from Stripe each time)
  useEffect(() => {
    fetch('/api/stripe/connect/status')
      .then((r) => r.json())
      .then((data) => {
        setStatus(data);
        setStatusLoading(false);
      })
      .catch(() => setStatusLoading(false));
  }, [onboardingState]); // re-fetch when returning from Stripe onboarding

  // Fetch recent payments for tenants this user owns
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }: { data: { user: { id: string } | null } }) => {
      if (!user) {
        setPaymentsLoading(false);
        return;
      }
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id')
        .eq('owner_id', user.id);
      const tenantIds = ((tenants as { id: string }[] | null) || []).map((t) => t.id);
      if (tenantIds.length === 0) {
        setPaymentsLoading(false);
        return;
      }
      const { data: pays } = await supabase
        .from('tenant_payments')
        .select('id, amount_cents, platform_fee_cents, currency, customer_email, customer_name, status, created_at')
        .in('tenant_id', tenantIds)
        .order('created_at', { ascending: false })
        .limit(50);
      setPayments((pays as Payment[]) || []);
      setPaymentsLoading(false);
    });
  }, []);

  async function handleConnect() {
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || 'Failed to start onboarding');
        setActionLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setError((err as Error).message);
      setActionLoading(false);
    }
  }

  async function handleOpenDashboard() {
    setActionLoading(true);
    try {
      const res = await fetch('/api/stripe/connect/dashboard-link', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.open(data.url, '_blank');
    } finally {
      setActionLoading(false);
    }
  }

  const totalRevenue = payments.reduce((sum, p) => sum + (p.status === 'paid' ? p.amount_cents : 0), 0);
  const totalFees = payments.reduce((sum, p) => sum + (p.status === 'paid' ? p.platform_fee_cents : 0), 0);
  const paidCount = payments.filter((p) => p.status === 'paid').length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
      <nav className="mb-4 sm:mb-6 text-xs sm:text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Payments</span>
      </nav>

      <h1 className="text-xl sm:text-2xl font-bold">Payments</h1>
      <p className="mt-1 text-sm sm:text-base text-gray-600">
        Accept payments from your end-users via Stripe Connect. Clonebase takes a 3% platform fee; the rest goes directly to your Stripe account.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {onboardingState === 'complete' && (
        <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          Onboarding complete! Refresh status to verify.
        </div>
      )}

      {/* Connection status card */}
      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        {statusLoading ? (
          <div className="h-20 animate-pulse rounded bg-gray-100" />
        ) : !status?.account_id ? (
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
              <h2 className="font-semibold">No Stripe account connected</h2>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Connect a Stripe account to start accepting payments. Stripe will handle KYC and compliance — you just need a few minutes to fill in your business info.
            </p>
            <Button onClick={handleConnect} loading={actionLoading} className="mt-4">
              Connect Stripe Account
            </Button>
          </div>
        ) : !status.charges_enabled ? (
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <h2 className="font-semibold">Onboarding incomplete</h2>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Your Stripe account exists but you haven&apos;t finished onboarding yet. Resume to start accepting payments.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Button onClick={handleConnect} loading={actionLoading} className="w-full sm:w-auto">
                Resume Onboarding
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <h2 className="font-semibold">Stripe connected</h2>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              You&apos;re ready to accept payments. {status.country && `Account country: ${status.country}.`} Payouts {status.payouts_enabled ? 'enabled' : 'pending'}.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Button onClick={handleOpenDashboard} loading={actionLoading} variant="secondary" className="w-full sm:w-auto">
                Open Stripe Dashboard
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Stats */}
      {status?.charges_enabled && (
        <section className="mt-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="mt-1 text-2xl font-bold">{formatMoney(totalRevenue)}</p>
            <p className="mt-1 text-xs text-gray-400">Last 50 payments</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Platform Fees</p>
            <p className="mt-1 text-2xl font-bold">{formatMoney(totalFees)}</p>
            <p className="mt-1 text-xs text-gray-400">3% of total</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Successful Payments</p>
            <p className="mt-1 text-2xl font-bold">{paidCount}</p>
          </div>
        </section>
      )}

      {/* Recent payments */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Recent payments</h2>
        {paymentsLoading ? (
          <div className="mt-4 h-32 animate-pulse rounded-xl bg-gray-100" />
        ) : payments.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <p className="text-4xl">💸</p>
            <p className="mt-3 text-sm text-gray-500">
              No payments yet. Once you publish an app and a customer pays, it will show up here.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-sm">
                      {p.customer_name || p.customer_email || 'Anonymous'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {formatMoney(p.amount_cents, p.currency)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatMoney(p.platform_fee_cents, p.currency)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === 'paid' ? 'bg-green-50 text-green-700' :
                        p.status === 'refunded' ? 'bg-gray-100 text-gray-600' :
                        'bg-yellow-50 text-yellow-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-8">Loading...</div>}>
      <PaymentsContent />
    </Suspense>
  );
}
