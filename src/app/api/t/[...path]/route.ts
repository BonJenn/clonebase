import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiHandler as aiSupportBotHandler } from '@/templates/ai-support-bot/api/handler';
import { loadGeneratedCode } from '@/lib/builder/load-generated';

// Static template API handlers
const staticHandlers: Record<string, (req: Request, context: { tenantId: string; params: string[] }) => Promise<Response>> = {
  'ai-support-bot': aiSupportBotHandler,
};

async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  const tenantIdentifier = request.headers.get('x-tenant-slug') || request.nextUrl.searchParams.get('tenant');
  if (!tenantIdentifier) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantIdentifier);
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq(isUUID ? 'id' : 'slug', tenantIdentifier)
    .single() as { data: { id: string } | null };

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  const { data: instance } = await supabase
    .from('app_instances')
    .select('template_id, template_version, template:app_templates(slug, source_type)')
    .eq('tenant_id', tenant.id)
    .eq('status', 'active')
    .single() as { data: { template_id: string; template_version: number | null; template: { slug: string; source_type: string } } | null };

  if (!instance) {
    return NextResponse.json({ error: 'No active app instance' }, { status: 404 });
  }

  const tpl = instance.template as unknown as { slug: string; source_type: string };

  // Track API usage
  const incrementAnalytics = supabase.rpc as unknown as (
    fn: 'increment_analytics',
    args: { p_tenant_id: string; p_event_type: string }
  ) => Promise<unknown>;
  void incrementAnalytics('increment_analytics', {
    p_tenant_id: tenant.id,
    p_event_type: `api:${path[0] || 'unknown'}`,
  });

  // Static templates: use hardcoded handlers
  const staticHandler = staticHandlers[tpl.slug];
  if (staticHandler) {
    return staticHandler(request, { tenantId: tenant.id, params: path });
  }

  // Generated API handlers are intentionally not executed in-process. Running
  // tenant-controlled JavaScript on the server would expose process globals and
  // service-role data. Static handlers above remain available.
  if (tpl.source_type === 'generated') {
    const generated = await loadGeneratedCode(instance.template_id, instance.template_version);
    if (generated?.api_handler_code) {
      return NextResponse.json(
        { error: 'Generated API handlers are disabled for security.' },
        { status: 501 }
      );
    }
  }

  return NextResponse.json({ error: 'Template has no API handler' }, { status: 404 });
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
export const PATCH = handleRequest;
