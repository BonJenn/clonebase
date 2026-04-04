import { ROOT_DOMAIN, RESERVED_SUBDOMAINS } from './constants';

// Extract the subdomain (tenant slug) from a hostname.
// Returns null if the request is for the platform root domain.
export function extractTenantSlug(hostname: string): string | null {
  // Strip port for local development
  const host = hostname.split(':')[0];

  // Local development: use query param ?tenant=slug or subdomain of localhost
  if (host === 'localhost' || host === '127.0.0.1') {
    return null; // handled via search params in dev
  }

  const rootDomain = ROOT_DOMAIN.split(':')[0];

  // Check if this is a subdomain of the root domain
  if (!host.endsWith(`.${rootDomain}`)) {
    return null;
  }

  // Extract subdomain
  const subdomain = host.slice(0, -(rootDomain.length + 1));

  // Ignore multi-level subdomains and reserved names
  if (subdomain.includes('.') || RESERVED_SUBDOMAINS.has(subdomain)) {
    return null;
  }

  return subdomain || null;
}

// Validate a proposed tenant slug
export function isValidSlug(slug: string): { valid: boolean; error?: string } {
  if (slug.length < 3) return { valid: false, error: 'Slug must be at least 3 characters' };
  if (slug.length > 63) return { valid: false, error: 'Slug must be 63 characters or less' };
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) {
    return { valid: false, error: 'Slug must be lowercase alphanumeric with hyphens, not starting/ending with hyphen' };
  }
  if (RESERVED_SUBDOMAINS.has(slug)) {
    return { valid: false, error: 'This subdomain is reserved' };
  }
  return { valid: true };
}
