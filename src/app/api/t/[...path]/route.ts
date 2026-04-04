import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiHandler as aiSupportBotHandler } from '@/templates/ai-support-bot/api/handler';

// Catch-all API route for template backends.
// Handlers are imported directly (server-only) to avoid pulling server code
// into the client-side template registry.
//
// Usage from template client code:
//   fetch('/api/t/chat', { method: 'POST', body: ... })
//
// Uses admin client for tenant resolution since this is a public-facing API
// (visitors of the tenant app aren't necessarily the tenant owner).

const apiHandlers: Record<string, (req: Request, context: { tenantId: string; params: string[] }) => Promise<Response>> = {
  'ai-support-bot': aiSupportBotHandler,
};

async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  // Get tenant identifier from header (set by proxy) or query param — may be a slug or UUID
  const tenantIdentifier = request.headers.get('x-tenant-slug') || request.nextUrl.searchParams.get('tenant');

  if (!tenantIdentifier) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
  }

  // Resolve tenant by slug or id (admin client — tenant resolution is public)
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

  // Get the template slug for this tenant
  const { data: instance } = await supabase
    .from('app_instances')
    .select('template:app_templates(slug)')
    .eq('tenant_id', tenant.id)
    .eq('status', 'active')
    .single();

  if (!instance) {
    return NextResponse.json({ error: 'No active app instance' }, { status: 404 });
  }

  const templateSlug = (instance.template as unknown as { slug: string })?.slug;

  // Dispatch to template handler
  const handler = apiHandlers[templateSlug];
  if (!handler) {
    return NextResponse.json({ error: 'Template has no API handler' }, { status: 404 });
  }

  return handler(request, { tenantId: tenant.id, params: path });
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
export const PATCH = handleRequest;
