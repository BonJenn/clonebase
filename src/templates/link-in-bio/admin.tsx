'use client';

import { useState } from 'react';
import { useTenant } from '@/sdk/tenant-context';
import { useTenantData } from '@/sdk/use-tenant-data';

interface BioLink {
  id?: string;
  title: string;
  url: string;
  emoji: string;
  sort_order: number;
}

export function AdminPage({ tenantId, instanceId }: { tenantId: string; instanceId: string }) {
  const { tenantName } = useTenant();
  const { data: links, loading, insert, remove, update } = useTenantData<BioLink>('links');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [emoji, setEmoji] = useState('🔗');

  const sorted = [...links].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await insert({
      title,
      url: url.startsWith('http') ? url : `https://${url}`,
      emoji,
      sort_order: links.length,
    });
    setTitle('');
    setUrl('');
    setEmoji('🔗');
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Manage Links</h1>
      <p className="mt-1 text-gray-600">{tenantName} — {links.length} links</p>

      {/* Add link form */}
      <form onSubmit={handleAdd} className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="font-semibold">Add a link</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-[auto_1fr_1fr]">
          <input
            type="text"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-16 rounded-lg border border-gray-300 px-3 py-2 text-center text-lg"
            maxLength={2}
          />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Link title"
            required
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            required
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add Link
        </button>
      </form>

      {/* Link list */}
      {loading ? (
        <p className="mt-6 text-gray-500">Loading...</p>
      ) : sorted.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">No links yet. Add your first link above.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {sorted.map((link, idx) => (
            <div key={link.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
              <span className="text-lg">{link.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{link.title}</p>
                <p className="text-xs text-gray-500 truncate">{link.url}</p>
              </div>
              <div className="flex items-center gap-1">
                {idx > 0 && (
                  <button
                    onClick={() => link.id && update(link.id, { sort_order: idx - 1 }).then(() => {
                      const prev = sorted[idx - 1];
                      if (prev?.id) update(prev.id, { sort_order: idx });
                    })}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Move up"
                  >
                    ↑
                  </button>
                )}
                {idx < sorted.length - 1 && (
                  <button
                    onClick={() => link.id && update(link.id, { sort_order: idx + 1 }).then(() => {
                      const next = sorted[idx + 1];
                      if (next?.id) update(next.id, { sort_order: idx });
                    })}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Move down"
                  >
                    ↓
                  </button>
                )}
                <button
                  onClick={() => link.id && remove(link.id)}
                  className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                  title="Delete"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
