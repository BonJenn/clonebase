'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === '/';

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <nav className={`sticky top-0 z-50 ${isHome ? 'bg-gray-950/80 border-gray-800' : 'bg-white/80 border-gray-200'} border-b backdrop-blur-sm`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className={`text-xl font-bold ${isHome ? 'text-white' : 'text-indigo-600'}`}>
              Clonebase
            </Link>
            <div className="hidden sm:flex items-center gap-6">
              <Link href="/marketplace" className={`text-sm ${isHome ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
                Marketplace
              </Link>
              {user && (
                <Link href="/dashboard" className={`text-sm ${isHome ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-200/20" />
            ) : user ? (
              <>
                <Link href="/builder">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500">Build an App</Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className={isHome ? 'text-gray-400 hover:text-white' : ''}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className={isHome ? 'text-gray-400 hover:text-white' : ''}>Log In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
