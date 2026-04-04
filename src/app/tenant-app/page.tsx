import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import { TemplateRenderer } from './template-renderer';
import { DynamicRenderer } from './dynamic-renderer';
import { transpileForProduction } from '@/lib/builder/transpiler';

// The tenant home page. Resolves which template to render.
// For static templates: uses TemplateRenderer (client-side registry).
// For generated templates: fetches code from DB and uses DynamicRenderer.
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
    .select('id, template:app_templates(slug, source_type)')
    .eq('tenant_id', tenant.id)
    .eq('status', 'active')
    .single();

  if (!instance) notFound();

  const tpl = instance.template as unknown as { slug: string; source_type: string };

  // Generated templates: load code from DB and render dynamically
  if (tpl.source_type === 'generated') {
    const { data: generated } = await supabase
      .from('generated_templates')
      .select('page_code')
      .eq('template_id', (instance as unknown as { template_id: string }).template_id || instance.id)
      .eq('is_current', true)
      .single();

    // Need the template_id — fetch it
    const { data: inst } = await supabase
      .from('app_instances')
      .select('template_id')
      .eq('id', instance.id)
      .single();

    if (!generated && inst) {
      const { data: gen } = await supabase
        .from('generated_templates')
        .select('page_code')
        .eq('template_id', inst.template_id)
        .eq('is_current', true)
        .single();

      if (!gen) notFound();

      const transpiled = transpileForProduction(gen.page_code);
      const match = gen.page_code.match(/export\s+function\s+(\w+)/);
      return (
        <DynamicRenderer
          transpiledCode={transpiled}
          componentName={match?.[1] || 'Page'}
          tenantId={tenant.id}
          instanceId={instance.id}
        />
      );
    }

    if (generated) {
      const transpiled = transpileForProduction(generated.page_code);
      const match = generated.page_code.match(/export\s+function\s+(\w+)/);
      return (
        <DynamicRenderer
          transpiledCode={transpiled}
          componentName={match?.[1] || 'Page'}
          tenantId={tenant.id}
          instanceId={instance.id}
        />
      );
    }
  }

  // Static templates: use the registry
  return (
    <TemplateRenderer
      templateSlug={tpl.slug}
      routePath="/"
      tenantId={tenant.id}
      instanceId={instance.id}
    />
  );
}
