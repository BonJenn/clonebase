'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DesignPicker } from '@/components/builder/design-picker';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';

type AuthPref = 'auto' | 'yes' | 'no';

interface DraftApp {
  id: string;
  name: string;
  description: string | null;
  updated_at: string;
}

export default function BuilderLandingPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [drafts, setDrafts] = useState<DraftApp[]>([]);
  const [prompt, setPrompt] = useState('');
  const [designPreset, setDesignPreset] = useState<string | null>(null);
  const [authPref, setAuthPref] = useState<AuthPref>('auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from('app_templates')
      .select('id, name, description, updated_at')
      .eq('creator_id', user.id)
      .eq('source_type', 'generated')
      .order('updated_at', { ascending: false })
      .limit(10)
      .then(({ data }: { data: DraftApp[] | null }) => setDrafts(data || []));
  }, [user]);

  if (userLoading) return null;
  if (!user) {
    router.push('/auth/login?redirect=/builder');
    return null;
  }

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setError('');
    setLoading(true);

    // Generate a short app name from the prompt
    let appName = prompt.trim().slice(0, 60);
    try {
      const nameRes = await fetch('/api/builder/name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      if (nameRes.ok) {
        const nameData = await nameRes.json();
        if (nameData.name) appName = nameData.name;
      }
    } catch {
      // Fall back to truncated prompt
    }

    const slug = 'app-' + Date.now().toString(36);
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: appName,
        slug,
        description: prompt.trim(),
        source_type: 'generated',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to create project');
      setLoading(false);
      return;
    }

    // Navigate to builder workspace with the initial prompt + preferences
    const params = new URLSearchParams({ prompt: prompt.trim() });
    if (designPreset) params.set('design', designPreset);
    if (authPref !== 'auto') params.set('auth', authPref);
    router.push(`/builder/${data.id}?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          What do you want to build?
        </h1>
        <p className="mt-4 text-base sm:text-lg text-gray-500 px-2">
          Describe your app, website, or tool. Be as specific as you want.
        </p>
      </div>

      <form onSubmit={handleStart} className="mt-8 sm:mt-10">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Build me a restaurant website for Tony's Pizza with the full menu, locations, hours, and customer reviews..."
            rows={4}
            className="block w-full border-0 px-4 sm:px-6 py-4 sm:py-5 text-gray-900 text-base sm:text-lg placeholder:text-gray-400 focus:ring-0 resize-none"
            required
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-50 px-4 sm:px-6 py-3">
            <p className="text-xs text-gray-400 order-2 sm:order-1">Tip: Paste a Figma URL to build from a design, or describe what you want</p>
            <Button type="submit" loading={loading} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 order-1 sm:order-2">
              {loading ? 'Creating...' : 'Generate App →'}
            </Button>
          </div>
        </div>
      </form>

      {/* Design direction + Auth toggle */}
      <div className="mt-6 space-y-5">
        <DesignPicker selected={designPreset} onSelect={setDesignPreset} />

        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-gray-700">Include user accounts?</p>
          <div className="flex rounded-lg border border-gray-200 text-xs">
            {(['auto', 'yes', 'no'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setAuthPref(option)}
                className={`px-3 py-1.5 capitalize transition-colors ${
                  authPref === option
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                } ${option === 'auto' ? 'rounded-l-md' : ''} ${option === 'no' ? 'rounded-r-md' : ''}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Try these */}
      <div className="mt-10 sm:mt-12">
        <p className="text-center text-sm font-medium text-gray-400 mb-4">TRY THESE</p>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'Restaurant Website', prompt: 'Look up a popular pizza restaurant near me and build a beautiful website with the full menu, all locations, hours, and reviews' },
            { title: 'Blogging Platform', prompt: 'Build me a blogging platform where users can sign up, write posts with rich text, and comment on each other\'s posts' },
            { title: 'Fitness Tracker', prompt: 'Build me a fitness tracker where I can log workouts, track my progress over time, and see stats about my training' },
            { title: 'Virtual World', prompt: 'Build me a Club Penguin-style virtual world where I can walk around rooms, chat, and customize my character' },
            { title: 'Startup Dashboard', prompt: 'Build me a dashboard tracking AI startup funding rounds with company details, valuations, and investor info' },
            { title: 'Recipe App', prompt: 'Build me a recipe sharing app with categories, ingredients, step-by-step instructions, and beautiful food photos' },
          ].map((example) => (
            <button
              key={example.title}
              onClick={() => setPrompt(example.prompt)}
              className="rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:shadow-sm hover:border-gray-300"
            >
              <p className="text-sm font-medium text-gray-900">{example.title}</p>
              <p className="mt-1 text-xs text-gray-500 line-clamp-2">{example.prompt}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent drafts */}
      {drafts.length > 0 && (
        <div className="mt-12 sm:mt-16">
          <h2 className="text-lg font-semibold text-gray-900">Continue working on</h2>
          <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {drafts.map((draft) => (
              <Link
                key={draft.id}
                href={`/builder/${draft.id}`}
                className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow block"
              >
                <h3 className="font-medium text-gray-900 truncate">{draft.name}</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Last edited {new Date(draft.updated_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
