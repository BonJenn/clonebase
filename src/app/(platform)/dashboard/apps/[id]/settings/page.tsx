'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export default function AppSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('app_templates')
      .select('name, description, category')
      .eq('id', id)
      .single()
      .then(({ data }: { data: { name: string; description: string | null; category: string | null } | null }) => {
        if (data) {
          setName(data.name);
          setDescription(data.description || '');
          setCategory(data.category || '');
        }
        setLoading(false);
      });
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    setSuccess(false);

    const supabase = createClient();
    const { error: err } = await supabase
      .from('app_templates')
      .update({
        name: name.trim(),
        description: description.trim() || null,
        category: category || null,
      })
      .eq('id', id);

    if (err) {
      setError('Failed to save settings');
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
        <span className="mx-2">/</span>
        <Link href={`/dashboard/apps/${id}`} className="hover:text-gray-700">App</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Settings</span>
      </nav>

      <h1 className="text-2xl font-bold">App Settings</h1>
      <p className="mt-1 text-gray-600">Update your app&apos;s name, description, and category.</p>

      <form onSubmit={handleSave} className="mt-8 space-y-6">
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">Settings saved successfully!</div>}

        <Input
          label="App Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this app do?"
            rows={3}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">None</option>
            {['AI Tools', 'E-Commerce', 'SaaS', 'Marketing', 'Portfolio', 'Blog', 'Dashboard', 'Social', 'Productivity', 'Other'].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={saving} disabled={!name.trim()}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push(`/dashboard/apps/${id}`)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
