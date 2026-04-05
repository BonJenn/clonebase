'use client';

import { useTenant } from '@/sdk/tenant-context';
import { useTenantData } from '@/sdk/use-tenant-data';

interface BioLink {
  [key: string]: unknown;
  id?: string;
  title: string;
  url: string;
  emoji: string;
  sort_order: number;
}

export function BioPage({ tenantId, instanceId }: { tenantId: string; instanceId: string }) {
  const { tenantName, config } = useTenant();
  const { data: links, loading } = useTenantData<BioLink>('links');

  const bio = (config?.bio as string) || '';
  const avatarEmoji = (config?.avatar_emoji as string) || tenantName.charAt(0).toUpperCase();
  const theme = (config?.theme as string) || 'light';

  const isDark = theme === 'dark';
  const sorted = [...links].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <div className={`flex min-h-screen items-start justify-center px-4 py-12 ${isDark ? 'bg-gray-900' : 'bg-gradient-to-b from-indigo-50 to-white'}`}>
      <div className="w-full max-w-md text-center">
        <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-3xl ${isDark ? 'bg-gray-800' : 'bg-white shadow-lg'}`}>
          {avatarEmoji}
        </div>

        <h1 className={`mt-4 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{tenantName}</h1>
        {bio && <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{bio}</p>}

        {loading ? (
          <p className={`mt-8 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading...</p>
        ) : sorted.length === 0 ? (
          <p className={`mt-8 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            No links yet. Add some from the /admin page.
          </p>
        ) : (
          <div className="mt-8 space-y-3">
            {sorted.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 rounded-xl border px-5 py-4 transition-all hover:scale-[1.02] ${
                  isDark
                    ? 'border-gray-700 bg-gray-800 text-white hover:bg-gray-750'
                    : 'border-gray-200 bg-white text-gray-900 hover:shadow-md'
                }`}
              >
                <span className="text-lg">{link.emoji || '🔗'}</span>
                <span className="flex-1 font-medium">{link.title}</span>
                <svg className={`h-4 w-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ))}
          </div>
        )}

        <p className={`mt-10 text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
          Powered by Clonebase
        </p>
      </div>
    </div>
  );
}
