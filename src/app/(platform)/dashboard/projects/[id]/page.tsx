import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { AppInstance, AppTemplate, Tenant, TenantIntegration, IntegrationDefinition } from '@/types';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Fetch the app instance with tenant and template info
  const { data: instance } = await supabase
    .from('app_instances')
    .select(`
      *,
      tenant:tenants(*),
      template:app_templates(id, name, slug, icon_url, description)
    `)
    .eq('id', id)
    .single();

  if (!instance) notFound();

  const inst = instance as AppInstance & { tenant: Tenant; template: AppTemplate };

  // Verify ownership via tenant
  if (inst.tenant.owner_id !== user.id) notFound();

  // Fetch integrations for this tenant
  const { data: integrations } = await supabase
    .from('tenant_integrations')
    .select(`
      *,
      definition:integration_definitions(*)
    `)
    .eq('tenant_id', inst.tenant_id);

  const typedIntegrations = (integrations || []) as (TenantIntegration & { definition: IntegrationDefinition })[];

  const prodOrigin = `https://${inst.tenant.slug}.clonebase.app`;
  const isProd = process.env.NODE_ENV === 'production';
  const appUrl = isProd
    ? prodOrigin
    : `/?tenant=${inst.tenant.slug}`;

  const pendingIntegrations = typedIntegrations.filter(i => i.status === 'not_connected');
  const connectedIntegrations = typedIntegrations.filter(i => i.status === 'connected');

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-4 sm:mb-6 text-xs sm:text-sm text-gray-500 flex flex-wrap items-center">
        <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 truncate max-w-[200px]">{inst.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 text-lg sm:text-xl font-bold shrink-0">
            {inst.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{inst.name}</h1>
            <p className="text-xs sm:text-sm text-gray-500 truncate">{inst.tenant.slug}.clonebase.app</p>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
            ${inst.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
            {inst.status}
          </span>
          <a href={appUrl} target="_blank" rel="noopener noreferrer">
            <Button>Open App</Button>
          </a>
        </div>
      </div>

      {/* Info Cards */}
      <div className="mt-6 sm:mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2">
        {/* Template Source */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-medium text-gray-500">Template</h3>
          <p className="mt-1 font-semibold">{inst.template?.name || 'Unknown'}</p>
          {inst.template?.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{inst.template.description}</p>
          )}
          {inst.template?.id && (
            <Link href={`/templates/${inst.template.id}`} className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-500">
              View template
            </Link>
          )}
        </div>

        {/* App URL */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-medium text-gray-500">App URL</h3>
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block font-semibold text-indigo-600 hover:text-indigo-500 truncate"
          >
            {inst.tenant.slug}.clonebase.app
          </a>
          <p className="mt-2 text-xs text-gray-400">
            Created {new Date(inst.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Integrations */}
      {typedIntegrations.length > 0 && (
        <section className="mt-6 sm:mt-8">
          <h2 className="text-lg font-semibold">Integrations</h2>
          <div className="mt-4 space-y-3">
            {typedIntegrations.map((integration) => (
              <div key={integration.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${
                    integration.status === 'connected' ? 'bg-green-500' :
                    integration.status === 'error' ? 'bg-red-500' : 'bg-gray-300'
                  }`} />
                  <div className="min-w-0">
                    <p className="font-medium">{integration.definition?.name}</p>
                    {integration.definition?.description && (
                      <p className="text-sm text-gray-500">{integration.definition.description}</p>
                    )}
                  </div>
                </div>
                <span className={`text-xs font-medium shrink-0 ${
                  integration.status === 'connected' ? 'text-green-700' :
                  integration.status === 'error' ? 'text-red-700' : 'text-gray-500'
                }`}>
                  {integration.status === 'not_connected' ? 'Not connected' : integration.status}
                </span>
              </div>
            ))}
          </div>

          {pendingIntegrations.length > 0 && (
            <div className="mt-4">
              <a href={isProd
                ? `${prodOrigin}/setup?tenant_id=${inst.tenant_id}`
                : `/setup?tenant=${inst.tenant.slug}&tenant_id=${inst.tenant_id}`
              } className="inline-block w-full sm:w-auto">
                <Button variant="secondary" className="w-full sm:w-auto">Configure Integrations</Button>
              </a>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
