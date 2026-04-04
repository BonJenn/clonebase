'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';

export default function BuilderLandingPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    // Create a draft template
    const slug = 'app-' + Date.now().toString(36);
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: prompt.trim().slice(0, 60),
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

    // Navigate to builder workspace with the initial prompt
    router.push(`/builder/${data.id}?prompt=${encodeURIComponent(prompt.trim())}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Build an app with words
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Describe what you want and watch it come to life. No coding required.
        </p>
      </div>

      <form onSubmit={handleStart} className="mt-12">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Build me a recipe sharing app where users can post recipes with ingredients, instructions, and photos. Include categories like breakfast, lunch, dinner, and dessert..."
          rows={5}
          className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          required
        />
        <div className="mt-4 flex justify-center">
          <Button type="submit" size="lg" loading={loading}>
            Generate My App
          </Button>
        </div>
      </form>

      <div className="mt-16 grid gap-4 sm:grid-cols-3">
        {[
          { title: 'Todo App', desc: 'A task manager with categories and priorities' },
          { title: 'Event RSVP', desc: 'Collect RSVPs with guest names and dietary preferences' },
          { title: 'Feedback Board', desc: 'Users submit and upvote feature requests' },
        ].map((example) => (
          <button
            key={example.title}
            onClick={() => setPrompt(`Build me a ${example.desc.toLowerCase()}`)}
            className="rounded-xl border border-gray-200 p-4 text-left transition-shadow hover:shadow-md"
          >
            <p className="font-medium text-gray-900">{example.title}</p>
            <p className="mt-1 text-sm text-gray-500">{example.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
