import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DeleteAppButton } from '@/components/platform/delete-app-button';
import type { AppInstance, AppTemplate } from '@/types';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Fetch vibecoded apps (generated templates owned by user)
  const { data: myApps } = await supabase
    .from('app_templates')
    .select('*')
    .eq('creator_id', user.id)
    .eq('source_type', 'generated')
    .order('updated_at', { ascending: false });

  // Fetch cloned app instances with tenant info
  const { data: instances } = await supabase
    .from('app_instances')
    .select(`
      *,
      tenant:tenants(*),
      template:app_templates(id, name, slug, icon_url, source_type, preview_url)
    `)
    .order('created_at', { ascending: false });

  // Fetch published templates (for marketplace, not generated drafts)
  const { data: templates } = await supabase
    .from('app_templates')
    .select('*')
    .eq('creator_id', user.id)
    .eq('source_type', 'static')
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link href="/dashboard/analytics" className="flex-1 sm:flex-none">
            <Button variant="secondary" className="w-full sm:w-auto">Analytics</Button>
          </Link>
          <Link href="/dashboard/payments" className="flex-1 sm:flex-none">
            <Button variant="secondary" className="w-full sm:w-auto">Payments</Button>
          </Link>
          <Link href="/dashboard/earnings" className="flex-1 sm:flex-none">
            <Button variant="secondary" className="w-full sm:w-auto">Earnings</Button>
          </Link>
          <Link href="/builder" className="flex-1 sm:flex-none">
            <Button className="w-full sm:w-auto">Build an App</Button>
          </Link>
        </div>
      </div>

      {/* My Apps — vibecoded apps + cloned instances */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">My Apps</h2>
        {!myApps?.length && !instances?.length ? (
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <p className="text-4xl">🚀</p>
            <p className="mt-3 text-gray-500">No apps yet. Build one or clone from the marketplace.</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link href="/builder">
                <Button>Build an App</Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="secondary">Browse Marketplace</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Vibecoded apps */}
            {(myApps as AppTemplate[])?.map((app) => (
              <div key={app.id} className="relative rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
                <div className="absolute top-3 right-3 z-10">
                  <DeleteAppButton templateId={app.id} appName={app.name} />
                </div>
                <Link href={`/dashboard/apps/${app.id}`} className="block">
                  {/* Preview thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center">
                    {app.preview_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={app.preview_url} alt={app.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl text-purple-200">{app.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="min-w-0 pr-6">
                      <h3 className="font-semibold truncate">{app.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{app.description || 'Vibecoded app'}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        app.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {app.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(app.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}

            {/* Cloned instances */}
            {(instances as (AppInstance & { tenant: { slug: string }; template: AppTemplate })[])?.map((inst) => (
              <Link key={inst.id} href={`/dashboard/projects/${inst.id}`} className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow block">
                {/* Preview thumbnail from the parent template */}
                <div className="aspect-video bg-gradient-to-br from-indigo-50 to-sky-50 flex items-center justify-center">
                  {inst.template?.preview_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={inst.template.preview_url} alt={inst.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl text-indigo-200">{inst.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="p-5">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{inst.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{inst.tenant.slug}.clonebase.app</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      inst.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {inst.status}
                    </span>
                    <span className="text-xs text-gray-400 truncate max-w-[150px]">
                      Cloned from {inst.template?.name}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* My Templates — static/published templates for marketplace */}
      {templates && templates.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-gray-900">My Templates</h2>
          <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {(templates as AppTemplate[]).map((tpl) => (
              <Link
                key={tpl.id}
                href={`/templates/${tpl.id}`}
                className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow block"
              >
                {/* Preview thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
                  {tpl.preview_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tpl.preview_url} alt={tpl.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl text-slate-300">{tpl.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold">{tpl.name}</h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{tpl.description}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                    <span className={`rounded-full px-2 py-0.5 font-medium ${
                      tpl.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tpl.status}
                    </span>
                    <span>{tpl.clone_count} clones</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
