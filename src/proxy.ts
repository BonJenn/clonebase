import { NextRequest, NextResponse } from 'next/server';

const RESERVED = new Set(['www','app','api','admin','dashboard','mail','cdn','docs','help','support','status','blog']);

function extractTenantSlug(hostname: string): string | null {
  const host = hostname.split(':')[0];
  if (host === 'localhost' || host === '127.0.0.1') return null;
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000').split(':')[0];
  if (!host.endsWith(`.${rootDomain}`)) return null;
  const subdomain = host.slice(0, -(rootDomain.length + 1));
  if (subdomain.includes('.') || RESERVED.has(subdomain)) return null;
  return subdomain || null;
}

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || 'localhost:3000';
  const url = request.nextUrl.clone();

  // Check for tenant subdomain, or ?tenant= param in dev
  let tenantSlug = extractTenantSlug(hostname);
  if (!tenantSlug && url.searchParams.has('tenant')) {
    tenantSlug = url.searchParams.get('tenant');
  }

  if (tenantSlug) {
    // Inject tenant slug into request headers for server components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-slug', tenantSlug);

    // Don't rewrite API routes — they live under src/app/api/, not tenant-app/
    if (url.pathname.startsWith('/api/')) {
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }

    // Rewrite to tenant route group, preserving non-tenant query params
    const rewriteUrl = new URL(`/tenant-app${url.pathname}`, request.url);
    url.searchParams.forEach((value, key) => {
      if (key !== 'tenant') rewriteUrl.searchParams.set(key, value);
    });

    return NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
