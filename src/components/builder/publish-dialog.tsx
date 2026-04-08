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

export function PublishDialog({ templateId, templateName, onClose, capturePreview }: PublishDialogProps) {
  const router = useRouter();
  const [name, setName] = useState(templateName);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [pricingType, setPricingType] = useState<'free' | 'one_time'>('free');
  const [priceAmount, setPriceAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Capture + upload a preview screenshot before publishing. Non-fatal: if
    // either step fails we still publish (without a preview_url) but we log
    // the reason so it's visible in the console.
    let previewUrl: string | null = null;
    if (capturePreview) {
      try {
        setStatus('Capturing preview...');
        const dataUrl = await capturePreview();
        if (!dataUrl) {
          console.warn('[publish] preview capture returned null — see iframe console for details');
        } else {
          setStatus('Uploading preview...');
          const file = dataUrlToFile(dataUrl, `${templateId}.png`);
          if (!file) {
            console.warn('[publish] could not convert dataUrl to File');
          } else {
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

    setStatus('Publishing...');
    const res = await fetch('/api/builder/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: templateId,
        name,
        description,
        category,
        pricing_type: pricingType,
        price_cents: pricingType === 'one_time' ? Math.round(parseFloat(priceAmount || '0') * 100) : 0,
        preview_url: previewUrl,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.validation_errors?.join('\n') || data.error || 'Failed to publish');
      setStatus('');
      setLoading(false);
      return;
    }

    router.push(`/templates/${templateId}`);
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold">Publish to Marketplace</h2>
        <p className="mt-1 text-sm text-gray-600">Make your app available for others to clone.</p>

        <form onSubmit={handlePublish} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 whitespace-pre-wrap">{error}</div>
          )}

          <Input label="App Name" value={name} onChange={(e) => setName(e.target.value)} required />

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

          {loading && status && (
            <p className="text-xs text-gray-500">{status}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={loading}>Publish</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
