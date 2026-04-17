import { describe, it, expect, beforeAll } from 'vitest';
import { randomBytes } from 'crypto';

// Set a valid 32-byte hex key before importing the module under test
beforeAll(() => {
  process.env.ENCRYPTION_KEY = randomBytes(32).toString('hex');
});

// eslint-disable-next-line import/first
import { encrypt, decrypt } from './crypto';

describe('encrypt / decrypt', () => {
  it('round-trips plaintext', () => {
    const secret = 'sk-1234567890-super-secret';
    const encrypted = encrypt(secret);
    expect(decrypt(encrypted)).toBe(secret);
  });

  it('produces different ciphertexts for the same plaintext (random IV)', () => {
    const plaintext = 'hello';
    const a = encrypt(plaintext);
    const b = encrypt(plaintext);
    expect(a.encrypted_value).not.toBe(b.encrypted_value);
    expect(a.iv).not.toBe(b.iv);
  });

  it('returns base64 strings for all fields', () => {
    const { encrypted_value, iv, auth_tag } = encrypt('test');
    // Base64: alphanumerics, +, /, = padding
    expect(encrypted_value).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(iv).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(auth_tag).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it('handles empty string', () => {
    const encrypted = encrypt('');
    expect(decrypt(encrypted)).toBe('');
  });

  it('handles unicode and emoji', () => {
    const secret = '🔐 héllo wörld 世界';
    const encrypted = encrypt(secret);
    expect(decrypt(encrypted)).toBe(secret);
  });

  it('throws when ciphertext is tampered with', () => {
    const encrypted = encrypt('plaintext');
    // Flip a bit in the encrypted value
    const tamperedBytes = Buffer.from(encrypted.encrypted_value, 'base64');
    tamperedBytes[0] ^= 0xff;
    const tampered = { ...encrypted, encrypted_value: tamperedBytes.toString('base64') };
    expect(() => decrypt(tampered)).toThrow();
  });

  it('throws when auth tag is tampered with', () => {
    const encrypted = encrypt('plaintext');
    const tagBytes = Buffer.from(encrypted.auth_tag, 'base64');
    tagBytes[0] ^= 0xff;
    const tampered = { ...encrypted, auth_tag: tagBytes.toString('base64') };
    expect(() => decrypt(tampered)).toThrow();
  });

  it('throws when IV is swapped', () => {
    const a = encrypt('plaintext-a');
    const b = encrypt('plaintext-b');
    // Using b's IV with a's ciphertext should fail auth
    const swapped = { ...a, iv: b.iv };
    expect(() => decrypt(swapped)).toThrow();
  });

  it('throws when ENCRYPTION_KEY is the wrong length', async () => {
    const original = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = 'shortkey';
    // Need to reset modules so crypto.ts re-reads the env on next call
    // But our implementation reads env lazily per-call via getEncryptionKey, so we just call it.
    expect(() => encrypt('x')).toThrow(/32 bytes|64 hex/i);
    process.env.ENCRYPTION_KEY = original;
  });

  it('throws when ENCRYPTION_KEY is missing', async () => {
    const original = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt('x')).toThrow(/ENCRYPTION_KEY/);
    process.env.ENCRYPTION_KEY = original;
  });

  it('throws on malformed base64 in IV', () => {
    const encrypted = encrypt('plaintext');
    expect(() => decrypt({ ...encrypted, iv: '!!!not base64!!!' })).toThrow();
  });
});
