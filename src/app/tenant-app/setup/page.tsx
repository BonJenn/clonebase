'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TenantIntegration, IntegrationDefinition } from '@/types';

// Setup wizard: walks users through connecting integrations after cloning.
// API keys are sent to the server and encrypted — never stored in browser.
export default function SetupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-gray-500">Loading...</p></div>}>
      <SetupWizard />
    </Suspense>
  );
}

function SetupWizard() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenant_id') || '';

  const [integrations, setIntegrations] = useState<(TenantIntegration & { definition: IntegrationDefinition })[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    fetch(`/api/integrations?tenant_id=${tenantId}`)
      .then((res) => res.json())
      .then((data) => {
        // Show only integrations that need connecting
        const pending = data.filter(
          (i: TenantIntegration) => i.status === 'not_connected'
        );
        setIntegrations(pending);
        setFetchLoading(false);
      })
      .catch(() => setFetchLoading(false));
  }, [tenantId]);

  const current = integrations[currentIdx];
  const isLast = currentIdx === integrations.length - 1;

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!current) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_integration_id: current.id,
          secrets,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to connect');
        setLoading(false);
        return;
      }

      // Move to next integration or finish
      setSecrets({});
      if (isLast) {
        window.location.href = '/';
      } else {
        setCurrentIdx((i) => i + 1);
      }
      setLoading(false);
    } catch {
      setError('Network error');
      setLoading(false);
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading setup wizard...</p>
      </div>
    );
  }

  if (!integrations.length) {
    return (
      <div className="flex min-h-screen items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-bold">All Set!</h1>
          <p className="mt-2 text-gray-600">All integrations are connected. Your app is ready.</p>
          <a href="/" className="mt-4 inline-block text-indigo-600 hover:text-indigo-500">
            Go to your app
          </a>
        </div>
      </div>
    );
  }

  const requiredFields = current?.definition?.required_fields || ['api_key'];

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Step {currentIdx + 1} of {integrations.length}
          </p>
          <h1 className="mt-2 text-2xl font-bold">Connect {current?.definition?.name}</h1>
          {current?.definition?.description && (
            <p className="mt-1 text-sm text-gray-600">{current.definition.description}</p>
          )}
        </div>

        <form onSubmit={handleConnect} className="mt-8 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {requiredFields.map((field: string) => (
            <Input
              key={field}
              label={field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              type="password"
              value={secrets[field] || ''}
              onChange={(e) => setSecrets({ ...secrets, [field]: e.target.value })}
              placeholder={`Enter your ${field.replace(/_/g, ' ')}`}
              required
              autoComplete="off"
            />
          ))}

          <p className="text-xs text-gray-400">
            Your keys are encrypted and stored securely. They are never exposed to the browser.
          </p>

          <div className="flex gap-3 pt-2">
            {current?.definition?.integration_type === 'optional' && (
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => isLast ? (window.location.href = '/') : setCurrentIdx((i) => i + 1)}
              >
                Skip
              </Button>
            )}
            <Button type="submit" className="flex-1" loading={loading}>
              {isLast ? 'Finish Setup' : 'Connect & Continue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
