'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TenantUnlockFormProps {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
}

/**
 * Password form shown in place of the tenant app when a visitor hasn't yet
 * unlocked a password-protected tenant. On successful submit, the server sets
 * an httpOnly cookie and we reload the page so the tenant layout renders
 * the real app.
 */
export function TenantUnlockForm({ tenantId, tenantName }: TenantUnlockFormProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setError('');
    setLoading(true);

    const res = await fetch('/api/t/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Incorrect password');
      setPassword('');
      setLoading(false);
      return;
    }

    // Reload to hit the layout again — this time the cookie is set so the app
    // renders directly.
    window.location.reload();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mx-auto">
          <span className="text-2xl">🔒</span>
        </div>
        <h1 className="mt-4 text-xl font-semibold text-center">{tenantName}</h1>
        <p className="mt-1 text-sm text-center text-gray-600">
          This app is password protected. Enter the password to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
            required
          />

          <Button type="submit" className="w-full" loading={loading}>
            Unlock
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Powered by Clonebase
        </p>
      </div>
    </div>
  );
}
