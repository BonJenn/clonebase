import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiHandler as aiSupportBotHandler } from '@/templates/ai-support-bot/api/handler';
import { loadGeneratedCode } from '@/lib/builder/load-generated';
import { transpileForProduction } from '@/lib/builder/transpiler';
import { callIntegration } from '@/sdk/call-integration';

// Static template API handlers
const staticHandlers: Record<string, (req: Request, context: { tenantId: string; params: string[] }) => Promise<Response>> = {
  'ai-support-bot': aiSupportBotHandler,
};

// Execute a generated API handler from transpiled code
async function executeGeneratedHandler(
  code: string,
  request: Request,
  context: { tenantId: string; params: string[] }
): Promise<Response> {
  const transpiled = transpileForProduction(code);

  // Provide server-side SDK in scope
  const __SDK__ = {
    callIntegration,
    createAdminClient,
  };

  const module = { exports: {} as Record<string, unknown> };
  const fn = new Function('require', 'module', 'exports', '__SDK__', 'NextResponse', transpiled);

  // Minimal require shim for server-side imports
  const requireShim = (mod: string) => {
    if (mod === 'next/server' || mod === '@/lib/supabase/admin') return { NextResponse, createAdminClient };
    if (mod === '@/sdk/call-integration') return { callIntegration };
    return {};
  };

  fn(requireShim, module, module.exports, __SDK__, NextResponse);

  const handler = module.exports.apiHandler as typeof aiSupportBotHandler | undefined;
  if (!handler) {
    return NextResponse.json({ error: 'Generated API handler missing apiHandler export' }, { status: 500 });
  }

  return handler(request, context);
}

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
    .single();

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  const { data: instance } = await supabase
    .from('app_instances')
    .select('template_id, template:app_templates(slug, source_type)')
    .eq('tenant_id', tenant.id)
    .eq('status', 'active')
    .single();

  if (!instance) {
    return NextResponse.json({ error: 'No active app instance' }, { status: 404 });
  }

  const tpl = instance.template as unknown as { slug: string; source_type: string };

  // Track API usage
  supabase.rpc('increment_analytics', {
    p_tenant_id: tenant.id,
    p_event_type: `api:${path[0] || 'unknown'}`,
  }).then(() => {}, () => {});

  // Static templates: use hardcoded handlers
  const staticHandler = staticHandlers[tpl.slug];
  if (staticHandler) {
    return staticHandler(request, { tenantId: tenant.id, params: path });
  }

  // Generated templates: load and execute API handler from DB
  if (tpl.source_type === 'generated') {
    const generated = await loadGeneratedCode(instance.template_id);
    if (generated?.api_handler_code) {
      try {
        return await executeGeneratedHandler(generated.api_handler_code, request, {
          tenantId: tenant.id,
          params: path,
        });
      } catch (err) {
        return NextResponse.json({
          error: 'API handler error',
          details: (err as Error).message,
        }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ error: 'Template has no API handler' }, { status: 404 });
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
export const PATCH = handleRequest;
