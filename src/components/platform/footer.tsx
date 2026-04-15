import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Product</p>
            <ul className="mt-3 space-y-2">
              <li><Link href="/builder" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Builder</Link></li>
              <li><Link href="/marketplace" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Marketplace</Link></li>
              <li><Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Account</p>
            <ul className="mt-3 space-y-2">
              <li><Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Dashboard</Link></li>
              <li><Link href="/dashboard/billing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Billing</Link></li>
              <li><Link href="/dashboard/payments" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Payments</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Resources</p>
            <ul className="mt-3 space-y-2">
              <li><Link href="/auth/signup" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Sign up</Link></li>
              <li><Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Log in</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Legal</p>
            <ul className="mt-3 space-y-2">
              <li><span className="text-sm text-gray-400">Privacy (coming soon)</span></li>
              <li><span className="text-sm text-gray-400">Terms (coming soon)</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-gray-100 pt-6">
          <span className="text-sm font-semibold text-gray-900">Clonebase</span>
          <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Clonebase. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
