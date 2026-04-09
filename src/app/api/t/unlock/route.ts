import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyPassword, createUnlockToken, unlockCookieName } from '@/lib/password';

// POST /api/t/unlock
//
// Verifies a visitor's password for a password-protected tenant. On success,
// sets an httpOnly cookie containing a signed unlock token; the tenant layout
// checks that cookie on every subsequent request to decide whether to render
// the app or the password form.
//
// This endpoint is unauthenticated — the password IS the authentication.
// We use the admin client to read the tenant's hash + salt since visitors
// may not be logged into Clonebase.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { tenant_id, password } = body;
  if (!tenant_id || typeof tenant_id !== 'string') {
    return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 });
  }
  if (!password || typeof password !== 'string') {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from('tenants')
    .select('id, access_password_hash, access_password_salt')
    .eq('id', tenant_id)
    .single() as { data: { id: string; access_password_hash: string | null; access_password_salt: string | null } | null };

  if (!tenant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // No password set? The tenant is public — no need to unlock anything.
  if (!tenant.access_password_hash || !tenant.access_password_salt) {
    return NextResponse.json({ ok: true, already_public: true });
  }

  const ok = verifyPassword(password, tenant.access_password_hash, tenant.access_password_salt);
  if (!ok) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  // Sign an unlock token and set it as an httpOnly cookie scoped to the tenant
  const token = createUnlockToken(tenant.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(unlockCookieName(tenant.id), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
