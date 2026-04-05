import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(168,85,247,0.1),transparent_50%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
              <span className="mr-2">✨</span> Describe it. Build it. Ship it.
            </div>

            <h1 className="mt-6 text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Build software{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                with words.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-400">
              Describe the app you want in plain English. Our AI builds it in seconds — complete with
              real data, authentication, file uploads, and a live URL. No coding required.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
              <Link href="/builder">
                <Button size="lg" className="text-base px-8 py-4 bg-indigo-600 hover:bg-indigo-500">
                  Start Building — It&apos;s Free
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button size="lg" variant="secondary" className="text-base px-8 py-4 border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-800">
                  Browse Apps
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><span className="text-green-500">●</span> No credit card</span>
              <span className="flex items-center gap-1.5"><span className="text-green-500">●</span> Ships instantly</span>
              <span className="flex items-center gap-1.5"><span className="text-green-500">●</span> Free subdomain</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              From idea to live app in 3 steps
            </h2>
            <p className="mt-4 text-lg text-gray-600">No coding, no design skills, no deployment headaches.</p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="relative rounded-2xl bg-gradient-to-b from-gray-50 to-white p-8 border border-gray-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white text-lg font-bold">1</div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">Describe your app</h3>
              <p className="mt-3 text-gray-600 leading-relaxed">
                Tell the AI what you want in plain English. &quot;Build me a restaurant website with a full menu and online ordering.&quot; Be as specific or vague as you want.
              </p>
            </div>

            <div className="relative rounded-2xl bg-gradient-to-b from-gray-50 to-white p-8 border border-gray-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white text-lg font-bold">2</div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">Watch it build</h3>
              <p className="mt-3 text-gray-600 leading-relaxed">
                AI generates your app in real-time — code, design, data, and all. Preview it live, then iterate: &quot;Make the header dark&quot; or &quot;Add user accounts.&quot;
              </p>
            </div>

            <div className="relative rounded-2xl bg-gradient-to-b from-gray-50 to-white p-8 border border-gray-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-600 text-white text-lg font-bold">3</div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">Ship it live</h3>
              <p className="mt-3 text-gray-600 leading-relaxed">
                Publish with one click. Your app gets a live URL instantly. Share it, let others clone it, or connect your own domain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What you can build */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Build anything you can describe
            </h2>
            <p className="mt-4 text-lg text-gray-600">Real apps, not toy demos. Here&apos;s what people are building.</p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { emoji: '🍕', title: 'Restaurant Websites', desc: 'Full menu, locations, hours, reviews — pulled from real data.', color: 'orange' },
              { emoji: '📝', title: 'Blog Platforms', desc: 'User accounts, rich text posts, comments, likes.', color: 'sky' },
              { emoji: '💪', title: 'Fitness Trackers', desc: 'Log workouts, track progress, view stats and history.', color: 'emerald' },
              { emoji: '🎮', title: 'Games', desc: '2D virtual worlds, quiz games, card games — playable in the browser.', color: 'violet' },
              { emoji: '🛍️', title: 'E-Commerce Stores', desc: 'Product catalogs, shopping carts, checkout flows.', color: 'amber' },
              { emoji: '📊', title: 'Dashboards', desc: 'Data visualization, analytics, admin panels with real stats.', color: 'slate' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl bg-white p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <span className="text-3xl">{item.emoji}</span>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Everything a real app needs.<br />Built in.
              </h2>
              <dl className="mt-10 space-y-6">
                {[
                  { icon: '🔐', title: 'User Authentication', desc: 'Sign up, login, password reset — real auth, not a mock.' },
                  { icon: '📁', title: 'File Uploads', desc: 'Images, documents, media — stored securely, accessible anywhere.' },
                  { icon: '🗄️', title: 'Database', desc: 'Your app gets its own data store. View and edit everything in the Data tab.' },
                  { icon: '🌐', title: 'Instant Deployment', desc: 'Every app gets a live URL. Share it immediately.' },
                  { icon: '🔑', title: 'API Integrations', desc: 'Connect OpenAI, Stripe, or any API. Keys encrypted and secure.' },
                  { icon: '🔍', title: 'Web Research', desc: 'AI looks up real businesses and data to populate your app.' },
                ].map((feature) => (
                  <div key={feature.title} className="flex gap-4">
                    <span className="text-2xl shrink-0">{feature.icon}</span>
                    <div>
                      <dt className="font-semibold text-gray-900">{feature.title}</dt>
                      <dd className="mt-1 text-gray-600">{feature.desc}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <span>builder</span>
              </div>
              <div className="space-y-2 font-mono text-sm">
                <p><span className="text-purple-400">you:</span> build me a pizza ordering app</p>
                <p className="text-gray-500">// AI is building your app...</p>
                <p><span className="text-green-400">ai:</span> Built a pizza ordering app with menu, cart, and checkout.</p>
                <p className="mt-4"><span className="text-purple-400">you:</span> add user accounts and order history</p>
                <p><span className="text-green-400">ai:</span> Added authentication and order tracking.</p>
                <p className="mt-4"><span className="text-purple-400">you:</span> make it dark mode</p>
                <p><span className="text-green-400">ai:</span> Done, switched to dark theme.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Your app is one sentence away.
          </h2>
          <p className="mt-4 text-lg text-indigo-100">
            Join thousands of people building software without writing code.
          </p>
          <div className="mt-8">
            <Link href="/builder">
              <Button size="lg" className="text-base px-8 py-4 bg-gray-900 text-white hover:bg-gray-800 border border-gray-700">
                Start Building for Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-lg font-bold text-white">Clonebase</span>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
              <Link href="/builder" className="hover:text-white transition-colors">Builder</Link>
            </div>
            <p className="text-sm text-gray-600">&copy; {new Date().getFullYear()} Clonebase</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
