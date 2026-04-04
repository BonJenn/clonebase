import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import { TemplateRenderer } from '../template-renderer';

// Catch-all route for tenant sub-pages (e.g., /settings, /admin).
// Uses admin client — tenant resolution is public.
export default async function TenantCatchAllPage({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const routePath = '/' + path.join('/');

  const headersList = await headers();
  const tenantSlug = headersList.get('x-tenant-slug');
  if (!tenantSlug) notFound();

  const supabase = createAdminClient();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single();

  if (!tenant) notFound();

  const { data: instance } = await supabase
    .from('app_instances')
    .select('id, template:app_templates(slug)')
    .eq('tenant_id', tenant.id)
    .eq('status', 'active')
    .single();

  if (!instance) notFound();

  const templateSlug = (instance.template as unknown as { slug: string })?.slug;

  return (
    <TemplateRenderer
      templateSlug={templateSlug}
      routePath={routePath}
      tenantId={tenant.id}
      instanceId={instance.id}
    />
  );
}
