import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import { TemplateRenderer } from './template-renderer';
import { DynamicRenderer } from './dynamic-renderer';
import { loadGeneratedCode, transpileComponent } from '@/lib/builder/load-generated';

export default async function TenantHomePage() {
  const headersList = await headers();
  const tenantSlug = headersList.get('x-tenant-slug');
  if (!tenantSlug) notFound();

  const supabase = createAdminClient();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .eq('slug', tenantSlug)
    .single();

  if (!tenant) notFound();

  const { data: instance } = await supabase
    .from('app_instances')
    .select('id, template_id, template:app_templates(slug, source_type)')
    .eq('tenant_id', tenant.id)
    .eq('status', 'active')
    .single();

  if (!instance) notFound();

  const tpl = instance.template as unknown as { slug: string; source_type: string };

  if (tpl.source_type === 'generated') {
    const generated = await loadGeneratedCode(instance.template_id);
    if (!generated) notFound();

    const { transpiledCode, componentName } = transpileComponent(generated.page_code);
    return (
      <DynamicRenderer
        transpiledCode={transpiledCode}
        componentName={componentName}
        tenantId={tenant.id}
        instanceId={instance.id}
      />
    );
  }

  return (
    <TemplateRenderer
      templateSlug={tpl.slug}
      routePath="/"
      tenantId={tenant.id}
      instanceId={instance.id}
    />
  );
}
