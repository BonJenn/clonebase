'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.refresh();
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav className={`sticky top-0 z-50 isolate transform-gpu ${isHome ? 'bg-gray-950/80 border-gray-800' : 'bg-white/80 border-gray-200'} border-b backdrop-blur-sm`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/" className={`text-xl font-bold ${isHome ? 'text-white' : 'text-indigo-600'}`}>
              Clonebase
            </Link>
            <div className="hidden sm:flex items-center gap-6">
              <Link href="/marketplace" className={`text-sm ${isHome ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
                Marketplace
              </Link>
              <Link href="/pricing" className={`text-sm ${isHome ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
                Pricing
              </Link>
              {user && (
                <Link href="/dashboard" className={`text-sm ${isHome ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Desktop / tablet actions */}
          <div className="hidden sm:flex items-center gap-3">
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

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            className={`sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg ${isHome ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className={`sm:hidden border-t ${isHome ? 'border-gray-800 bg-gray-950/95' : 'border-gray-200 bg-white/95'} backdrop-blur-sm`}>
          <div className="space-y-1 px-4 py-3">
            <Link
              href="/marketplace"
              onClick={closeMenu}
              className={`block rounded-lg px-3 py-3 text-base font-medium ${isHome ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              Marketplace
            </Link>
            <Link
              href="/pricing"
              onClick={closeMenu}
              className={`block rounded-lg px-3 py-3 text-base font-medium ${isHome ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              Pricing
            </Link>
            {user && (
              <Link
                href="/dashboard"
                onClick={closeMenu}
                className={`block rounded-lg px-3 py-3 text-base font-medium ${isHome ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Dashboard
              </Link>
            )}
            <div className={`mt-2 border-t pt-3 ${isHome ? 'border-gray-800' : 'border-gray-200'}`}>
              {loading ? (
                <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200/20" />
              ) : user ? (
                <div className="space-y-2">
                  <Link href="/builder" onClick={closeMenu} className="block">
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-500">Build an App</Button>
                  </Link>
                  <Button
                    variant="secondary"
                    onClick={handleSignOut}
                    className="w-full"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link href="/auth/login" onClick={closeMenu} className="block">
                    <Button variant="secondary" className="w-full">Log In</Button>
                  </Link>
                  <Link href="/auth/signup" onClick={closeMenu} className="block">
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-500">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
