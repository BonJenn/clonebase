'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/hooks/use-user';

interface CloneButtonProps {
  templateId: string;
  templateName: string;
  isFree: boolean;
  hasPurchased?: boolean;
  isOwner?: boolean;
  priceCents?: number;
  isGenerated?: boolean;
}

export function CloneButton({ templateId, templateName, isFree, hasPurchased, isOwner, priceCents, isGenerated }: CloneButtonProps) {
  const { user } = useUser();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [slug, setSlug] = useState('');
  const [appName, setAppName] = useState(templateName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  const canClone = isFree || hasPurchased || isOwner;

  async function handlePurchase() {
    setPurchasing(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: templateId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to start checkout');
        setPurchasing(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Network error. Please try again.');
      setPurchasing(false);
    }
  }

  async function handleClone(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: Record<string, string> = { template_id: templateId, name: appName };
      if (!isGenerated) {
        payload.slug = slug;
      }

      const res = await fetch('/api/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to clone template');
        setLoading(false);
        return;
      }

      if (isGenerated && data.redirect) {
        router.push(data.redirect);
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <Button onClick={() => router.push(`/auth/login?redirect=/templates/${templateId}`)}>
        Log in to Clone
      </Button>
    );
  }

  if (!canClone) {
    const priceLabel = priceCents ? `$${(priceCents / 100).toFixed(2)}` : 'Paid';
    return (
      <div>
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        <Button onClick={handlePurchase} loading={purchasing}>
          Purchase for {priceLabel}
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button onClick={() => setShowModal(true)}>Clone This App</Button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold">Clone &quot;{templateName}&quot;</h2>
            <p className="mt-1 text-sm text-gray-600">
              {isGenerated
                ? 'Give your forked app a name. You can customize it in the builder.'
                : 'Choose a name and subdomain for your new app.'}
            </p>

            <form onSubmit={handleClone} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}

              <Input
                label="App Name"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="My Awesome App"
                required
              />

              {!isGenerated && (
                <div>
                  <Input
                    label="Subdomain"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="my-app"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Your app will be at <strong>{slug || 'my-app'}.clonebase.app</strong>
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" loading={loading}>
                  {isGenerated ? 'Fork to Builder' : 'Clone'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
