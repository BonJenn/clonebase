import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-gray-950">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <p className="text-sm font-medium text-indigo-400 tracking-wide">
            The app builder for everyone
          </p>

          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Describe what you want.<br />
            <span className="text-gray-400">We build it.</span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-gray-400 sm:text-lg sm:leading-8">
            Turn a sentence into a working app with its own URL, database,
            auth, and payments. No code. No deploy. Just ship.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link href="/builder">
              <Button size="lg" className="w-full sm:w-auto px-8 py-3.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500">
                Start building — free
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto px-8 py-3.5 text-sm font-medium border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800">
                See pricing
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-6 text-xs text-gray-500">
            <span>30 free credits</span>
            <span className="h-3 w-px bg-gray-700" />
            <span>No credit card</span>
            <span className="h-3 w-px bg-gray-700" />
            <span>Live in seconds</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-gray-200 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-medium text-indigo-600">How it works</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            Idea to live app in minutes
          </h2>

          <div className="mt-12 grid gap-px bg-gray-200 sm:grid-cols-3 rounded-xl overflow-hidden border border-gray-200">
            {[
              {
                step: '01',
                title: 'Describe',
                body: 'Tell the AI what to build in plain English. "A fitness tracker with workout logging and progress charts." Be specific or vague — it adapts.',
              },
              {
                step: '02',
                title: 'Iterate',
                body: 'Preview your app in real-time. Refine it conversationally: "add dark mode", "make the cards bigger", "connect Stripe for payments."',
              },
              {
                step: '03',
                title: 'Ship',
                body: 'One click to deploy. Your app gets a live URL, a real database, and optional marketplace listing. Share it or sell it.',
              },
            ].map((item) => (
              <div key={item.step} className="bg-white p-8">
                <span className="text-xs font-mono text-gray-400">{item.step}</span>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="border-t border-gray-200 bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-medium text-indigo-600">Everything included</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            Not a prototype. A real product.
          </h2>
          <p className="mt-3 max-w-lg text-sm text-gray-600">
            Every app comes with infrastructure that would take weeks to set up manually.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Live URL', body: 'Deployed instantly at yourapp.clonebase.app. Connect your own domain on Pro.' },
              { title: 'Database', body: 'Postgres-backed data store. View, edit, and export all data from the dashboard.' },
              { title: 'Authentication', body: 'Sign up, login, password reset. Real auth with encrypted credentials.' },
              { title: 'File uploads', body: 'Images, documents, media. Stored securely, served via CDN.' },
              { title: 'Payments', body: 'Accept real payments via Stripe Connect. 3% platform fee, rest goes to you.' },
              { title: 'API integrations', body: 'Connect OpenAI, weather APIs, or any REST endpoint. Keys encrypted at rest.' },
            ].map((feature) => (
              <div key={feature.title} className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="text-sm font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace */}
      <section className="border-t border-gray-200 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-start">
            <div>
              <p className="text-sm font-medium text-indigo-600">Marketplace</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                Clone any app. Sell yours.
              </h2>
              <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                Every published app can be cloned in one click. Cloners get their own copy with a
                unique URL, fresh data, and full customization. Set a price and earn from every clone,
                or share for free.
              </p>

              <dl className="mt-8 space-y-4">
                {[
                  { term: 'One-click cloning', desc: 'Buyers get an instant copy with their own subdomain and isolated data.' },
                  { term: 'Version updates', desc: 'Push updates to your app. Clone owners choose when to upgrade.' },
                  { term: 'Earn revenue', desc: 'Set a one-time price. You keep 85% of every sale.' },
                ].map((item) => (
                  <div key={item.term} className="border-l-2 border-gray-200 pl-4">
                    <dt className="text-sm font-medium text-gray-900">{item.term}</dt>
                    <dd className="mt-0.5 text-sm text-gray-600">{item.desc}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8">
                <Link href="/marketplace">
                  <Button variant="secondary" className="text-sm">Browse the marketplace</Button>
                </Link>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 space-y-3">
                {[
                  { name: 'Restaurant Website', creator: 'sarah', clones: 234, price: 'Free' },
                  { name: 'SaaS Dashboard', creator: 'mike', clones: 89, price: '$9.99' },
                  { name: 'Fitness Tracker', creator: 'alex', clones: 412, price: 'Free' },
                  { name: 'E-Commerce Store', creator: 'jen', clones: 156, price: '$14.99' },
                ].map((app) => (
                  <div key={app.name} className="flex items-center justify-between rounded-lg bg-white border border-gray-200 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{app.name}</p>
                      <p className="text-xs text-gray-500">@{app.creator} · {app.clones} clones</p>
                    </div>
                    <span className={`text-xs font-medium ${app.price === 'Free' ? 'text-gray-500' : 'text-gray-900'}`}>
                      {app.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-200 bg-gray-950 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Your next app is one sentence away
          </h2>
          <p className="mt-3 text-sm text-gray-400">
            30 free credits. No credit card. Build something real today.
          </p>
          <div className="mt-8">
            <Link href="/builder">
              <Button size="lg" className="px-8 py-3.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500">
                Start building
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-950 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <span className="text-sm font-semibold text-white">Clonebase</span>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-400">
              <Link href="/builder" className="hover:text-white transition-colors">Builder</Link>
              <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            </div>
            <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} Clonebase</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
