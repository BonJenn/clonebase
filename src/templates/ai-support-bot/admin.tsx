'use client';

import { useState } from 'react';
import { useTenant } from '@/sdk/tenant-context';
import { useTenantData } from '@/sdk/use-tenant-data';

interface KnowledgeEntry {
  [key: string]: unknown;
  id?: string;
  title: string;
  content: string;
  created_at: string;
}

// Admin page: manage knowledge base entries that the AI uses to answer questions.
// Only the tenant owner should access this (protected by RLS on tenant_data).
export function AdminPage() {
  const { tenantName } = useTenant();
  const knowledge = useTenantData<KnowledgeEntry>('knowledge_base');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    await knowledge.insert({
      title: title.trim(),
      content: content.trim(),
      created_at: new Date().toISOString(),
    });
    setTitle('');
    setContent('');
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{tenantName} — Admin</h1>
            <p className="text-sm text-gray-500">Manage your AI support bot&apos;s knowledge base</p>
          </div>
          <a href="/" className="text-sm text-indigo-600 hover:text-indigo-500">Back to Chat</a>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Add knowledge entry */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900">Add Knowledge</h2>
          <p className="mt-1 text-sm text-gray-500">
            Add information that the AI will use to answer customer questions.
          </p>

          <form onSubmit={handleAdd} className="mt-4 space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Topic (e.g., Refund Policy)"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter the information the AI should know about this topic..."
              rows={4}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add Entry'}
            </button>
          </form>
        </div>

        {/* Knowledge base list */}
        <div className="mt-8">
          <h2 className="font-semibold text-gray-900">
            Knowledge Base ({knowledge.data.length} entries)
          </h2>

          {knowledge.loading ? (
            <div className="mt-4 text-center text-gray-500">Loading...</div>
          ) : knowledge.data.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
              No knowledge entries yet. Add some above to train your AI.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {knowledge.data.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-gray-900">{entry.title}</h3>
                    <button
                      onClick={() => entry.id && knowledge.remove(entry.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{entry.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
