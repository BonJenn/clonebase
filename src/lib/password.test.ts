import { describe, it, expect, beforeAll } from 'vitest';
import { randomBytes } from 'crypto';

beforeAll(() => {
  process.env.ENCRYPTION_KEY = randomBytes(32).toString('hex');
});

// eslint-disable-next-line import/first
import {
  hashPassword,
  verifyPassword,
  createUnlockToken,
  verifyUnlockToken,
  unlockCookieName,
} from './password';

describe('hashPassword / verifyPassword', () => {
  it('round-trips the correct password', () => {
    const { hash, salt } = hashPassword('correct horse battery staple');
    expect(verifyPassword('correct horse battery staple', hash, salt)).toBe(true);
  });

  it('rejects an incorrect password', () => {
    const { hash, salt } = hashPassword('right-password');
    expect(verifyPassword('wrong-password', hash, salt)).toBe(false);
  });

  it('produces different salts for the same password', () => {
    const a = hashPassword('same');
    const b = hashPassword('same');
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
  });

  it('returns base64 strings', () => {
    const { hash, salt } = hashPassword('test');
    expect(hash).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(salt).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it('returns false (does not throw) on malformed stored values', () => {
    expect(verifyPassword('pw', 'not-base64-at-all!@#', 'also-bad!@#')).toBe(false);
  });

  it('returns false when hash length does not match', () => {
    const { salt } = hashPassword('pw');
    // Deliberately truncated hash shouldn't match anything
    expect(verifyPassword('pw', 'YWJj', salt)).toBe(false);
  });

  it('handles empty password', () => {
    const { hash, salt } = hashPassword('');
    expect(verifyPassword('', hash, salt)).toBe(true);
    expect(verifyPassword('nonempty', hash, salt)).toBe(false);
  });

  it('handles unicode passwords', () => {
    const pw = 'pässwörd-🔐-世界';
    const { hash, salt } = hashPassword(pw);
    expect(verifyPassword(pw, hash, salt)).toBe(true);
  });
});

describe('createUnlockToken / verifyUnlockToken', () => {
  it('round-trips a valid token', () => {
    const token = createUnlockToken('tenant-abc');
    expect(verifyUnlockToken(token, 'tenant-abc')).toBe(true);
  });

  it('rejects a token signed for a different tenant', () => {
    const token = createUnlockToken('tenant-a');
    expect(verifyUnlockToken(token, 'tenant-b')).toBe(false);
  });

  it('rejects a tampered signature', () => {
    const token = createUnlockToken('tenant-abc');
    const [id, sig] = token.split('.');
    const tampered = `${id}.${sig}XYZ`;
    expect(verifyUnlockToken(tampered, 'tenant-abc')).toBe(false);
  });

  it('rejects an empty token', () => {
    expect(verifyUnlockToken('', 'tenant-abc')).toBe(false);
  });

  it('rejects a token with no dot separator', () => {
    expect(verifyUnlockToken('just-a-single-string', 'tenant-abc')).toBe(false);
  });

  it('rejects a token with an empty signature segment', () => {
    expect(verifyUnlockToken('tenant-abc.', 'tenant-abc')).toBe(false);
  });

  it('returns false for non-string inputs without throwing', () => {
    // @ts-expect-error — testing runtime safety against callers passing junk
    expect(verifyUnlockToken(null, 'tenant-abc')).toBe(false);
    // @ts-expect-error
    expect(verifyUnlockToken(undefined, 'tenant-abc')).toBe(false);
  });

  it('produces deterministic tokens for the same tenant id', () => {
    // createUnlockToken is an HMAC, so given the same secret + input it's stable.
    // This matters because we need tokens to survive round-trips through cookies.
    const a = createUnlockToken('tenant-xyz');
    const b = createUnlockToken('tenant-xyz');
    expect(a).toBe(b);
  });
});

describe('unlockCookieName', () => {
  it('scopes cookie name per tenant', () => {
    expect(unlockCookieName('abc')).toBe('cb_unlock_abc');
    expect(unlockCookieName('abc')).not.toBe(unlockCookieName('xyz'));
  });
});
