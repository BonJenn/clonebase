import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import { TenantProvider } from '@/sdk/tenant-context';
import type { TenantContext } from '@/sdk/types';

// Resolves the tenant from the x-tenant-slug header (injected by proxy.ts),
// fetches the app instance + template, and wraps children in TenantProvider
// so all template code can access tenant context via useTenant().
//
// Uses admin client because tenant resolution is a public operation —
// anyone visiting a subdomain needs the tenant to resolve, not just the owner.
export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const tenantSlug = headersList.get('x-tenant-slug');

  if (!tenantSlug) notFound();

  const supabase = createAdminClient();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, slug, name, owner_id')
    .eq('slug', tenantSlug)
    .single();

  if (!tenant) notFound();

  const { data: instance } = await supabase
    .from('app_instances')
    .select('id, config_snapshot, custom_config, template:app_templates(slug)')
    .eq('tenant_id', tenant.id)
    .eq('status', 'active')
    .single();

  if (!instance) notFound();

  // Track page view (fire-and-forget)
  supabase.rpc('increment_analytics', {
    p_tenant_id: tenant.id,
    p_event_type: 'page_view',
  }).then(() => {}, () => {});

  const templateSlug = (instance.template as unknown as { slug: string })?.slug;
  if (!templateSlug) notFound();

  const ctx: TenantContext = {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
    instanceId: instance.id,
    templateSlug,
    config: {
      ...((instance.config_snapshot as Record<string, unknown>) || {}),
      ...((instance.custom_config as Record<string, unknown>) || {}),
    },
  };

  return (
    <TenantProvider value={ctx}>
      <div className="min-h-full" data-tenant={tenantSlug}>
        {children}
      </div>
    </TenantProvider>
  );
}
