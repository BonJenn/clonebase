'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TEMPLATE_CATEGORIES } from '@/lib/constants';

interface PublishDialogProps {
  templateId: string;
  templateName: string;
  onClose: () => void;
  /**
   * Captures a screenshot of the live preview iframe. Called before publishing
   * so the resulting PNG can be uploaded and saved as the template's preview_url.
   * Returns a base64 PNG data URL, or null if capture failed.
   */
  capturePreview?: () => Promise<string | null>;
  /**
   * Fired when the publish API returns success. Used by the builder workspace
   * to flip its primary button from "Publish" to "Update" once an instance
   * exists.
   */
  onPublished?: (info: { instance_id: string | null; slug: string | null }) => void;
}

interface PublishResult {
  live_url: string | null;
  slug: string | null;
  marketplace_url: string | null;
  listed_on_marketplace: boolean;
  deployed: boolean;
  is_private: boolean;
}

/** Convert a data URL to a File for uploading via FormData. */
function dataUrlToFile(dataUrl: string, filename: string): File | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mime = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

/** Slugify a free-text name for use as a tenant subdomain. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

export function PublishDialog({ templateId, templateName, onClose, capturePreview, onPublished }: PublishDialogProps) {
  const router = useRouter();
  const [name, setName] = useState(templateName);
  const [description, setDescription] = useState('');

  // Publish destination toggles (at least one must be on)
  const [deployToUrl, setDeployToUrl] = useState(true);
  const [listOnMarketplace, setListOnMarketplace] = useState(false);

  // Deploy options
  const [slug, setSlug] = useState(() => slugify(templateName));
  const [slugTouched, setSlugTouched] = useState(false);
  const [appVisibility, setAppVisibility] = useState<'public' | 'private'>('public');
  const [accessPassword, setAccessPassword] = useState('');

  // Marketplace options
  const [category, setCategory] = useState('');
  const [pricingType, setPricingType] = useState<'free' | 'one_time'>('free');
  const [priceAmount, setPriceAmount] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<PublishResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Keep slug in sync with name unless the user has typed in the slug field
  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  }

  async function handleCopyUrl() {
    if (!result?.live_url) return;
    try {
      await navigator.clipboard.writeText(result.live_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // noop
    }
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Client-side validation — at least one publish destination required
    if (!deployToUrl && !listOnMarketplace) {
      setError('Pick at least one: deploy to a URL or list on the marketplace.');
      return;
    }
    if (deployToUrl && appVisibility === 'private' && !accessPassword.trim()) {
      setError('Password required for private apps.');
      return;
    }
    if (deployToUrl && appVisibility === 'private' && accessPassword.trim().length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);

    // Capture + upload a preview screenshot before publishing. Non-fatal.
    let previewUrl: string | null = null;
    if (capturePreview) {
      try {
        setStatus('Capturing preview...');
        const dataUrl = await capturePreview();
        if (!dataUrl) {
          console.warn('[publish] preview capture returned null — see iframe console');
        } else {
          setStatus('Uploading preview...');
          const file = dataUrlToFile(dataUrl, `${templateId}.png`);
          if (file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('template_id', templateId);
            const uploadRes = await fetch('/api/builder/upload-preview', {
              method: 'POST',
              body: formData,
            });
            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              previewUrl = uploadData.url || null;
              console.log('[publish] preview uploaded:', previewUrl);
            } else {
              const errText = await uploadRes.text().catch(() => '');
              console.warn('[publish] preview upload failed:', uploadRes.status, errText);
            }
          }
        }
      } catch (err) {
        console.warn('[publish] preview capture/upload error (non-fatal):', err);
      }
    }

    setStatus(
      deployToUrl && listOnMarketplace
        ? 'Publishing & deploying...'
        : deployToUrl
        ? 'Deploying...'
        : 'Listing on marketplace...'
    );

    const res = await fetch('/api/builder/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: templateId,
        name,
        description,
        preview_url: previewUrl,
        deploy_to_url: deployToUrl,
        list_on_marketplace: listOnMarketplace,
        slug: deployToUrl ? slug : undefined,
        app_visibility: deployToUrl ? appVisibility : undefined,
        access_password: deployToUrl && appVisibility === 'private' ? accessPassword : undefined,
        category: listOnMarketplace ? category : undefined,
        pricing_type: listOnMarketplace ? pricingType : undefined,
        price_cents: listOnMarketplace && pricingType === 'one_time' ? Math.round(parseFloat(priceAmount || '0') * 100) : 0,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.validation_errors?.join('\n') || data.error || 'Failed to publish');
      setStatus('');
      setLoading(false);
      return;
    }

    setStatus('');
    setLoading(false);
    setResult({
      live_url: data.live_url || null,
      slug: data.slug || null,
      marketplace_url: data.marketplace_url || null,
      listed_on_marketplace: !!data.listed_on_marketplace,
      deployed: !!data.deployed,
      is_private: !!data.is_private,
    });
    // Notify parent so it can flip its primary button from Publish → Update
    onPublished?.({ instance_id: data.instance_id || null, slug: data.slug || null });
    router.refresh();
  }

  // Success state — shown after a successful publish
  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {result.deployed && result.listed_on_marketplace
                  ? 'Published & deployed'
                  : result.deployed
                  ? 'Your app is live'
                  : 'Listed on marketplace'}
              </h2>
              <p className="text-sm text-gray-600">
                {result.deployed && result.listed_on_marketplace
                  ? 'Live at your URL and visible in the marketplace.'
                  : result.deployed
                  ? 'Deployed and ready to share.'
                  : 'Others can now clone your template.'}
              </p>
            </div>
          </div>

          {result.deployed && result.live_url && (
            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Live URL</p>
                {result.is_private && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                    🔒 Password protected
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <a
                  href={result.live_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate text-sm font-mono text-indigo-600 hover:text-indigo-500"
                >
                  {result.live_url}
                </a>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="rounded-lg bg-white border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              {result.is_private && (
                <p className="mt-2 text-xs text-gray-500">
                  Share the link along with the password you set. Visitors will be asked to enter it before seeing the app.
                </p>
              )}
            </div>
          )}

          {result.listed_on_marketplace && result.marketplace_url && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Marketplace</p>
              <a
                href={result.marketplace_url}
                className="mt-2 block text-sm text-indigo-600 hover:text-indigo-500"
              >
                View your marketplace listing →
              </a>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            {result.deployed && result.live_url && (
              <a href={result.live_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="secondary" className="w-full">Open App</Button>
              </a>
            )}
            <Button type="button" className="flex-1" onClick={onClose}>Done</Button>
          </div>
        </div>
      </div>
    );
  }

  // Form state — initial publish flow
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold">Publish Your App</h2>
        <p className="mt-1 text-sm text-gray-600">Deploy to a URL, list on the marketplace, or both.</p>

        <form onSubmit={handlePublish} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 whitespace-pre-wrap">{error}</div>
          )}

          <Input label="App Name" value={name} onChange={(e) => handleNameChange(e.target.value)} required />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this app do?"
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {/* Destination 1: Deploy to URL */}
          <div className="rounded-xl border border-gray-200 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={deployToUrl}
                onChange={(e) => setDeployToUrl(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">🌐 Deploy to a URL</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Get a live link at {slug ? `${slug}.clonebase.app` : '{your-slug}.clonebase.app'} you can share.
                </p>
              </div>
            </label>

            {deployToUrl && (
              <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                {/* URL slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="my-app"
                      minLength={3}
                      maxLength={63}
                      required={deployToUrl}
                      className="flex-1 min-w-0 px-3 py-2 text-sm focus:outline-none"
                    />
                    <span className="px-3 py-2 text-sm text-gray-500 bg-gray-50 border-l border-gray-300 whitespace-nowrap">
                      .clonebase.app
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Lowercase letters, numbers, and hyphens.</p>
                </div>

                {/* Public / Private */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Who can access it?</label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        checked={appVisibility === 'public'}
                        onChange={() => setAppVisibility('public')}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm text-gray-900">🌍 Public — anyone with the link</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="visibility"
                        value="private"
                        checked={appVisibility === 'private'}
                        onChange={() => setAppVisibility('private')}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm text-gray-900">🔒 Private — password required</p>
                      </div>
                    </label>
                  </div>

                  {appVisibility === 'private' && (
                    <div className="mt-3">
                      <Input
                        label="Access password"
                        type="password"
                        value={accessPassword}
                        onChange={(e) => setAccessPassword(e.target.value)}
                        placeholder="Set a password"
                        minLength={4}
                        required={appVisibility === 'private'}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Visitors will need this password to see your app. Share it separately.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Destination 2: Marketplace */}
          <div className="rounded-xl border border-gray-200 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={listOnMarketplace}
                onChange={(e) => setListOnMarketplace(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">🛒 List on the marketplace</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Let others discover and clone your app. You can earn from paid clones.
                </p>
              </div>
            </label>

            {listOnMarketplace && (
              <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">Select a category</option>
                    {TEMPLATE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pricing</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={pricingType === 'free'} onChange={() => setPricingType('free')} />
                      <span className="text-sm">Free</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={pricingType === 'one_time'} onChange={() => setPricingType('one_time')} />
                      <span className="text-sm">One-time purchase</span>
                    </label>
                  </div>
                  {pricingType === 'one_time' && (
                    <Input
                      label="Price (USD)"
                      type="number"
                      min="1"
                      step="0.01"
                      value={priceAmount}
                      onChange={(e) => setPriceAmount(e.target.value)}
                      placeholder="9.99"
                      required
                      className="mt-2"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {loading && status && (
            <p className="text-xs text-gray-500">{status}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={loading}>
              {deployToUrl && listOnMarketplace
                ? 'Publish & Deploy'
                : deployToUrl
                ? 'Deploy'
                : listOnMarketplace
                ? 'List on Marketplace'
                : 'Publish'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
