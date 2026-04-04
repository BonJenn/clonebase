import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limiter';

const RESERVED = new Set(['www','app','api','admin','dashboard','mail','cdn','docs','help','support','status','blog']);

// Cache custom domain → tenant slug mappings (refreshed on miss)
const domainCache = new Map<string, { slug: string; expiry: number }>();

function extractTenantSlug(hostname: string): string | null {
  const host = hostname.split(':')[0];
  if (host === 'localhost' || host === '127.0.0.1') return null;
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000').split(':')[0];
  if (!host.endsWith(`.${rootDomain}`)) return null;
  const subdomain = host.slice(0, -(rootDomain.length + 1));
  if (subdomain.includes('.') || RESERVED.has(subdomain)) return null;
  return subdomain || null;
}

async function resolveCustomDomain(hostname: string): Promise<string | null> {
  const host = hostname.split(':')[0];

  // Check cache first
  const cached = domainCache.get(host);
  if (cached && cached.expiry > Date.now()) return cached.slug;

  // Look up custom domain in Supabase via REST API (proxy can't use full client)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/custom_domains?domain=eq.${encodeURIComponent(host)}&status=eq.verified&select=tenant_id,tenants(slug)`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    );
    const data = await res.json();
    const slug = data?.[0]?.tenants?.slug;
    if (slug) {
      domainCache.set(host, { slug, expiry: Date.now() + 300_000 }); // 5 min cache
      return slug;
    }
  } catch {
    // Fall through
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || 'localhost:3000';
  const url = request.nextUrl.clone();

  // Check for tenant subdomain, ?tenant= param in dev, or custom domain
  let tenantSlug = extractTenantSlug(hostname);
  if (!tenantSlug && url.searchParams.has('tenant')) {
    tenantSlug = url.searchParams.get('tenant');
  }
  if (!tenantSlug) {
    tenantSlug = await resolveCustomDomain(hostname);
  }

  if (tenantSlug) {
    // Rate limit tenant requests (per tenant, 60 req/min for pages, 120 for API)
    const isApi = url.pathname.startsWith('/api/');
    const limit = rateLimit(`tenant:${tenantSlug}:${isApi ? 'api' : 'page'}`, isApi ? 120 : 60);
    if (!limit.allowed) {
      return new NextResponse('Too many requests', {
        status: 429,
        headers: { 'Retry-After': '60' },
      });
    }

    // Inject tenant slug into request headers for server components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-slug', tenantSlug);

    // Don't rewrite API routes — they live under src/app/api/, not tenant-app/
    if (isApi) {
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }

    // Rewrite to tenant route group, preserving non-tenant query params
    const rewriteUrl = new URL(`/tenant-app${url.pathname}`, request.url);
    url.searchParams.forEach((value, key) => {
      if (key !== 'tenant') rewriteUrl.searchParams.set(key, value);
    });

    const response = NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    });

    // Security headers for tenant apps
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-Tenant', tenantSlug);

    return response;
  }

  // Rate limit platform API routes
  if (url.pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const limit = rateLimit(`ip:${ip}:api`, 60);
    if (!limit.allowed) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
