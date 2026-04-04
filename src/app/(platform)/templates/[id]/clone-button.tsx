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
}

export function CloneButton({ templateId, templateName, isFree }: CloneButtonProps) {
  const { user } = useUser();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [slug, setSlug] = useState('');
  const [appName, setAppName] = useState(templateName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleClone(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: templateId, slug, name: appName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to clone template');
        setLoading(false);
        return;
      }

      // Redirect to dashboard or setup wizard
      router.push(`/dashboard`);
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

  if (!isFree) {
    // TODO: Integrate Stripe checkout for paid templates
    return <Button disabled>Purchase & Clone (Coming Soon)</Button>;
  }

  return (
    <>
      <Button onClick={() => setShowModal(true)}>Clone This App</Button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold">Clone &quot;{templateName}&quot;</h2>
            <p className="mt-1 text-sm text-gray-600">
              Choose a name and subdomain for your new app.
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

              <div>
                <Input
                  label="Subdomain"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="my-app"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Your app will be at <strong>{slug || 'my-app'}.clonebase.com</strong>
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" loading={loading}>
                  Clone
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
