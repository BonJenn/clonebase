// Platform domain config
// In production, NEXT_PUBLIC_ROOT_DOMAIN should be "clonebase.com"
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
export const PROTOCOL = process.env.NODE_ENV === 'production' ? 'https' : 'http';

// Reserved subdomains that cannot be used as tenant slugs
export const RESERVED_SUBDOMAINS = new Set([
  'www',
  'app',
  'api',
  'admin',
  'dashboard',
  'mail',
  'smtp',
  'ftp',
  'cdn',
  'static',
  'assets',
  'docs',
  'help',
  'support',
  'status',
  'blog',
]);

// Template categories for marketplace
export const TEMPLATE_CATEGORIES = [
  'AI Tools',
  'E-Commerce',
  'SaaS',
  'Marketing',
  'Portfolio',
  'Blog',
  'Dashboard',
  'Social',
  'Productivity',
  'Other',
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];
