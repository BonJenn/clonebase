import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function AppManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Fetch the template (vibecoded app)
  const { data: template } = await supabase
    .from('app_templates')
    .select('*')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single();

  if (!template) notFound();

  // Fetch latest generated code info
  const { data: generated } = await supabase
    .from('generated_templates')
    .select('version, updated_at, generation_prompt')
    .eq('template_id', id)
    .eq('is_current', true)
    .single();

  // Check if there's a cloned instance (app is deployed)
  const { data: instances } = await supabase
    .from('app_instances')
    .select('id, status, tenant:tenants(slug)')
    .eq('template_id', id)
    .limit(5);

  const hasCode = !!generated;
  const isPublished = template.status === 'published';
  const deployedInstances = instances || [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{template.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 text-xl font-bold">
            {template.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{template.name}</h1>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isPublished ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
              }`}>
                {isPublished ? 'Published' : 'Draft'}
              </span>
              {generated && (
                <span className="text-xs text-gray-400">v{generated.version}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/builder/${id}`}>
            <Button>Edit App</Button>
          </Link>
        </div>
      </div>

      {template.description && (
        <p className="mt-4 text-gray-600">{template.description}</p>
      )}

      {/* Quick actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          href={`/builder/${id}`}
          className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow"
        >
          <span className="text-2xl">🛠️</span>
          <h3 className="mt-3 font-semibold">Edit App</h3>
          <p className="mt-1 text-sm text-gray-500">Continue building in the sandbox</p>
        </Link>

        <Link
          href={`/dashboard/apps/${id}/integrations`}
          className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow"
        >
          <span className="text-2xl">🔑</span>
          <h3 className="mt-3 font-semibold">Integrations</h3>
          <p className="mt-1 text-sm text-gray-500">Manage API keys and connections</p>
        </Link>

        <Link
          href={`/dashboard/apps/${id}/data`}
          className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow"
        >
          <span className="text-2xl">🗄️</span>
          <h3 className="mt-3 font-semibold">Data</h3>
          <p className="mt-1 text-sm text-gray-500">Browse and manage app data</p>
        </Link>
      </div>

      {/* Publishing */}
      {!isPublished && hasCode && (
        <section className="mt-8 rounded-xl border border-indigo-200 bg-indigo-50 p-6">
          <h2 className="font-semibold text-indigo-900">Ready to share?</h2>
          <p className="mt-1 text-sm text-indigo-700">
            Publish your app to the marketplace so others can clone it.
          </p>
          <Link href={`/builder/${id}`}>
            <Button className="mt-4">Open Builder to Publish</Button>
          </Link>
        </section>
      )}

      {/* Deployed instances */}
      {deployedInstances.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Deployed Instances</h2>
          <div className="mt-4 space-y-3">
            {deployedInstances.map((inst) => {
              const tenant = inst.tenant as unknown as { slug: string };
              return (
                <div key={inst.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                  <div>
                    <p className="font-medium">{tenant?.slug}.clonebase.com</p>
                    <span className={`text-xs font-medium ${inst.status === 'active' ? 'text-green-700' : 'text-gray-500'}`}>
                      {inst.status}
                    </span>
                  </div>
                  <Link href={`/dashboard/projects/${inst.id}`}>
                    <Button variant="secondary" size="sm">Manage</Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Info */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Details</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <dt className="text-sm text-gray-500">Created</dt>
            <dd className="mt-1 font-medium">{new Date(template.created_at).toLocaleDateString()}</dd>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <dt className="text-sm text-gray-500">Last edited</dt>
            <dd className="mt-1 font-medium">
              {generated ? new Date(generated.updated_at).toLocaleDateString() : 'Never'}
            </dd>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <dt className="text-sm text-gray-500">Category</dt>
            <dd className="mt-1 font-medium">{template.category || 'Uncategorized'}</dd>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <dt className="text-sm text-gray-500">Clones</dt>
            <dd className="mt-1 font-medium">{template.clone_count}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
