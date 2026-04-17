import { describe, it, expect } from 'vitest';
import { extractTenantSlug, isValidSlug } from './tenant';

// Root domain is set via vitest.config.ts `env` so constants.ts reads it at import time.

describe('extractTenantSlug', () => {
  it('returns null for localhost', () => {
    expect(extractTenantSlug('localhost')).toBeNull();
    expect(extractTenantSlug('localhost:3000')).toBeNull();
    expect(extractTenantSlug('127.0.0.1')).toBeNull();
    expect(extractTenantSlug('127.0.0.1:3000')).toBeNull();
  });

  it('returns null for the bare root domain', () => {
    expect(extractTenantSlug('clonebase.app')).toBeNull();
  });

  it('returns null for unrelated hosts', () => {
    expect(extractTenantSlug('example.com')).toBeNull();
    expect(extractTenantSlug('notclonebase.app')).toBeNull();
  });

  it('extracts a valid subdomain', () => {
    expect(extractTenantSlug('johns-tacos.clonebase.app')).toBe('johns-tacos');
    expect(extractTenantSlug('acme.clonebase.app')).toBe('acme');
  });

  it('strips ports before matching', () => {
    expect(extractTenantSlug('acme.clonebase.app:443')).toBe('acme');
  });

  it('rejects reserved subdomains', () => {
    expect(extractTenantSlug('www.clonebase.app')).toBeNull();
    expect(extractTenantSlug('api.clonebase.app')).toBeNull();
    expect(extractTenantSlug('admin.clonebase.app')).toBeNull();
  });

  it('rejects multi-level subdomains', () => {
    // Nested subdomains aren't supported — tenant slugs must be single-level
    expect(extractTenantSlug('foo.bar.clonebase.app')).toBeNull();
  });

  it('does not crash on empty or malformed hostnames', () => {
    expect(() => extractTenantSlug('')).not.toThrow();
    expect(() => extractTenantSlug(':')).not.toThrow();
    expect(extractTenantSlug('')).toBeNull();
  });
});

describe('isValidSlug', () => {
  it('accepts well-formed slugs', () => {
    expect(isValidSlug('acme').valid).toBe(true);
    expect(isValidSlug('acme-corp').valid).toBe(true);
    expect(isValidSlug('abc123').valid).toBe(true);
    expect(isValidSlug('a1b2c3').valid).toBe(true);
  });

  it('rejects slugs shorter than 3 chars', () => {
    expect(isValidSlug('').valid).toBe(false);
    expect(isValidSlug('a').valid).toBe(false);
    expect(isValidSlug('ab').valid).toBe(false);
  });

  it('rejects slugs longer than 63 chars', () => {
    expect(isValidSlug('a'.repeat(64)).valid).toBe(false);
    expect(isValidSlug('a'.repeat(63)).valid).toBe(true); // boundary
  });

  it('rejects uppercase letters', () => {
    expect(isValidSlug('ACME').valid).toBe(false);
    expect(isValidSlug('Acme').valid).toBe(false);
  });

  it('rejects slugs with invalid characters', () => {
    expect(isValidSlug('acme_corp').valid).toBe(false);
    expect(isValidSlug('acme.corp').valid).toBe(false);
    expect(isValidSlug('acme corp').valid).toBe(false);
    expect(isValidSlug('acme!').valid).toBe(false);
  });

  it('rejects slugs starting or ending with a hyphen', () => {
    expect(isValidSlug('-acme').valid).toBe(false);
    expect(isValidSlug('acme-').valid).toBe(false);
    expect(isValidSlug('---').valid).toBe(false);
  });

  it('rejects reserved subdomains', () => {
    expect(isValidSlug('www').valid).toBe(false);
    expect(isValidSlug('api').valid).toBe(false);
    expect(isValidSlug('admin').valid).toBe(false);
  });

  it('returns a helpful error message on failure', () => {
    const result = isValidSlug('ab');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
    expect(typeof result.error).toBe('string');
  });
});
