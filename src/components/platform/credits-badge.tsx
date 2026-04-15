'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Small badge showing remaining credits. Fetches on mount and updates
 * when the custom 'credits-updated' event fires (dispatched by the
 * builder after each generation).
 */
export function CreditsBadge() {
  const [credits, setCredits] = useState<{ remaining: number; limit: number; tier: string } | null>(null);

  function fetchCredits() {
    fetch('/api/billing/credits')
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.creditsRemaining === 'number') {
          setCredits({
            remaining: data.creditsRemaining,
            limit: data.creditsLimit,
            tier: data.tier,
          });
        }
      })
      .catch(() => {});
  }

  useEffect(() => {
    fetchCredits();

    // Listen for credit updates from the builder workspace.
    // Supports three modes via CustomEvent detail:
    //   { delta: -1 }       → optimistic adjustment (instant feedback)
    //   { remaining: 25 }   → confirmed value from API response
    //   (no detail)         → re-fetch from server (legacy fallback)
    function handleUpdate(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.delta !== undefined && typeof detail.delta === 'number') {
        setCredits((prev) => prev ? { ...prev, remaining: Math.max(0, prev.remaining + detail.delta) } : prev);
      } else if (detail?.remaining !== undefined && typeof detail.remaining === 'number') {
        setCredits((prev) => prev ? { ...prev, remaining: detail.remaining } : prev);
      } else {
        fetchCredits();
      }
    }
    window.addEventListener('credits-updated', handleUpdate);
    return () => window.removeEventListener('credits-updated', handleUpdate);
  }, []);

  if (!credits) return null;

  const pct = credits.limit > 0 ? Math.round((credits.remaining / credits.limit) * 100) : 0;
  const color = pct <= 10 ? 'text-red-600' : pct <= 25 ? 'text-amber-600' : 'text-gray-500';

  return (
    <Link
      href="/dashboard/billing"
      className={`flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium ${color} hover:bg-gray-50 transition-colors`}
      title={`${credits.remaining} of ${credits.limit} credits remaining this period`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M1 10V5.236a.5.5 0 0 1 .276-.447l6.5-3.25a.5.5 0 0 1 .448 0l6.5 3.25A.5.5 0 0 1 15 5.236V10a.5.5 0 0 1-.276.447l-6.5 3.25a.5.5 0 0 1-.448 0l-6.5-3.25A.5.5 0 0 1 1 10Z" />
      </svg>
      {credits.remaining}
    </Link>
  );
}
