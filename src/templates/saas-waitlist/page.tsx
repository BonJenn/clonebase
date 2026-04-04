'use client';

import { useState } from 'react';
import { useTenant } from '@/sdk/tenant-context';
import { useTenantData } from '@/sdk/use-tenant-data';

interface WaitlistEntry {
  id?: string;
  email: string;
  name: string;
  referral_source: string;
  signed_up_at: string;
}

export function WaitlistPage({ tenantId, instanceId }: { tenantId: string; instanceId: string }) {
  const { tenantName, config } = useTenant();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { insert } = useTenantData<WaitlistEntry>('waitlist');

  const headline = (config?.headline as string) || `${tenantName} is coming soon`;
  const subtitle = (config?.subtitle as string) || 'Be the first to know when we launch. Join the waitlist.';
  const accentColor = (config?.accent_color as string) || 'indigo';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const result = await insert({
      email,
      name,
      referral_source: typeof window !== 'undefined' ? document.referrer || 'direct' : 'direct',
      signed_up_at: new Date().toISOString(),
    });

    if (result) {
      setSubmitted(true);
    } else {
      setError('Something went wrong. Please try again.');
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-white">You&apos;re on the list!</h2>
          <p className="mt-2 text-gray-400">We&apos;ll notify you at <strong className="text-white">{email}</strong> when we launch.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
      <div className="w-full max-w-lg text-center">
        <div className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-${accentColor}-500/20`}>
          <span className={`text-2xl font-bold text-${accentColor}-400`}>{tenantName.charAt(0)}</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{headline}</h1>
        <p className="mt-4 text-lg text-gray-400">{subtitle}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-3">
          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
          )}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className={`w-full rounded-lg bg-${accentColor}-600 px-4 py-3 font-semibold text-white hover:bg-${accentColor}-500 transition-colors`}
          >
            Join the Waitlist
          </button>
        </form>

        <p className="mt-6 text-xs text-gray-500">No spam. We&apos;ll only email you when we launch.</p>
      </div>
    </div>
  );
}
