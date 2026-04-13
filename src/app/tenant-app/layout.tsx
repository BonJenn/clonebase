import { headers, cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import { TenantProvider } from '@/sdk/tenant-context';
import type { TenantContext } from '@/sdk/types';
import { verifyUnlockToken, unlockCookieName } from '@/lib/password';
import { TenantUnlockForm } from '@/components/platform/tenant-unlock-form';
import { getUserTier } from '@/lib/tier-gate';

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
    .select('id, slug, name, owner_id, access_password_hash')
    .eq('slug', tenantSlug)
    .single() as { data: { id: string; slug: string; name: string; owner_id: string; access_password_hash: string | null } | null };

  if (!tenant) notFound();

  // Password gate: if the tenant has an access password set, require a valid
  // unlock cookie before rendering the app. The cookie is set by
  // /api/t/unlock after the visitor submits the correct password.
  if (tenant.access_password_hash) {
    const cookieStore = await cookies();
    const unlockToken = cookieStore.get(unlockCookieName(tenant.id))?.value;
    const unlocked = unlockToken ? verifyUnlockToken(unlockToken, tenant.id) : false;

    if (!unlocked) {
      return (
        <TenantUnlockForm
          tenantId={tenant.id}
          tenantName={tenant.name}
          tenantSlug={tenant.slug}
        />
      );
    }
  }

  const { data: instance } = await supabase
    .from('app_instances')
    .select('id, config_snapshot, custom_config, template:app_templates(slug)')
    .eq('tenant_id', tenant.id)
    .eq('status', 'active')
    .single() as { data: { id: string; config_snapshot: Record<string, unknown>; custom_config: Record<string, unknown>; template: { slug: string } } | null };

  if (!instance) notFound();

  // Track page view (fire-and-forget)
  (supabase.rpc as Function)('increment_analytics', {
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

  // Check if the tenant owner's plan includes branding removal
  const ownerTier = await getUserTier(tenant.owner_id);
  const showBranding = !ownerTier.tier.features.removeBranding;

  return (
    <TenantProvider value={ctx}>
      <div className="min-h-full" data-tenant={tenantSlug}>
        {children}
        {showBranding && (
          <a
            href="https://clonebase.app"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-3 right-3 z-50 rounded-full bg-gray-900/80 px-3 py-1.5 text-[11px] font-medium text-white shadow-lg backdrop-blur-sm hover:bg-gray-900 transition-colors"
          >
            Built with Clonebase
          </a>
        )}
      </div>
    </TenantProvider>
  );
}
