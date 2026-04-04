import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Clone any web app.
            <br />
            <span className="text-indigo-600">Make it yours.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Browse hundreds of ready-made web app templates. Clone one in seconds
            and get your own hosted version with a custom subdomain — no setup required.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/marketplace">
              <Button size="lg">Browse Templates</Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="secondary" size="lg">Start Building</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 text-xl font-bold">
              1
            </div>
            <h3 className="mt-4 text-lg font-semibold">Browse & Choose</h3>
            <p className="mt-2 text-gray-600">
              Explore our marketplace of AI tools, SaaS apps, e-commerce stores, and more.
              Every template is production-ready.
            </p>
          </div>
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 text-xl font-bold">
              2
            </div>
            <h3 className="mt-4 text-lg font-semibold">Clone Instantly</h3>
            <p className="mt-2 text-gray-600">
              One click to clone. You get your own isolated instance with a unique subdomain.
              Your data, your config, your app.
            </p>
          </div>
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 text-xl font-bold">
              3
            </div>
            <h3 className="mt-4 text-lg font-semibold">Customize & Launch</h3>
            <p className="mt-2 text-gray-600">
              Connect your API keys, tweak the config, and you are live. Share your app
              or keep it private — it is your call.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
