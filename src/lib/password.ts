// Password hashing for tenant access control.
//
// Uses Node's built-in crypto.scrypt — no third-party deps. scrypt is the
// right choice for password hashing (memory-hard, resistant to GPU attacks),
// and it's in the Node standard library.
//
// Storage format: separate hash and salt columns on the tenants table. On
// verify, we re-derive the hash from the supplied password + stored salt in
// constant time and compare.

import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'crypto';

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

/** Hash a password for storage. Returns { hash, salt } as base64 strings. */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(SALT_BYTES);
  const derived = scryptSync(password, salt, KEY_LENGTH);
  return {
    hash: derived.toString('base64'),
    salt: salt.toString('base64'),
  };
}

/** Verify a password against a stored hash + salt. Constant-time comparison. */
export function verifyPassword(password: string, storedHash: string, storedSalt: string): boolean {
  try {
    const salt = Buffer.from(storedSalt, 'base64');
    const expected = Buffer.from(storedHash, 'base64');
    const derived = scryptSync(password, salt, expected.length);
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/**
 * Create a signed unlock token for a tenant. Set as an httpOnly cookie after
 * successful password entry; the tenant layout checks it on every request to
 * decide whether to show the app or the password form.
 *
 * Token format: {tenant_id}.{hmac_of_tenant_id}
 * Signed with ENCRYPTION_KEY so it can't be forged.
 */
export function createUnlockToken(tenantId: string): string {
  const secret = process.env.ENCRYPTION_KEY || '';
  const signature = createHmac('sha256', secret).update(tenantId).digest('base64url');
  return `${tenantId}.${signature}`;
}

/** Verify an unlock token. Returns true if the token belongs to the tenant. */
export function verifyUnlockToken(token: string, tenantId: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const [tokenTenantId, signature] = token.split('.');
  if (tokenTenantId !== tenantId || !signature) return false;

  const secret = process.env.ENCRYPTION_KEY || '';
  const expected = createHmac('sha256', secret).update(tenantId).digest('base64url');
  // Constant-time compare
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}

/** Cookie name for a tenant's unlock token. Scoped per-tenant. */
export function unlockCookieName(tenantId: string): string {
  return `cb_unlock_${tenantId}`;
}
