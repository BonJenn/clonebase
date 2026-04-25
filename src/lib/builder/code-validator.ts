export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const DANGEROUS_PATTERNS = [
  { pattern: /\beval\s*\(/, message: 'eval() is not allowed' },
  { pattern: /\bnew\s+Function\s*\(/, message: 'new Function() is not allowed' },
  { pattern: /\bdocument\.cookie\b/, message: 'document.cookie access is not allowed' },
  { pattern: /\bwindow\.opener\b/, message: 'window.opener access is not allowed' },
  { pattern: /\blocalStorage\b/, message: 'localStorage is not allowed (use useTenantData instead)' },
  { pattern: /\bsessionStorage\b/, message: 'sessionStorage is not allowed' },
  { pattern: /<script[\s>]/i, message: 'Inline <script> tags are not allowed' },
  { pattern: /\bdangerouslySetInnerHTML\b/, message: 'dangerouslySetInnerHTML is not allowed' },
];

const CLIENT_FORBIDDEN_IMPORTS = [
  { pattern: /from\s*['"]crypto['"]/, message: 'Cannot import crypto in client code' },
  { pattern: /from\s*['"]fs['"]/, message: 'Cannot import fs in client code' },
  { pattern: /from\s*['"]path['"]/, message: 'Cannot import path in client code' },
  { pattern: /from\s*['"]child_process['"]/, message: 'Cannot import child_process in client code' },
  { pattern: /\brequire\s*\(/, message: 'require() is not allowed' },
];

function validateClientCode(code: string, label: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check dangerous patterns
  for (const { pattern, message } of DANGEROUS_PATTERNS) {
    if (pattern.test(code)) errors.push(`[${label}] ${message}`);
  }

  // Check forbidden imports
  for (const { pattern, message } of CLIENT_FORBIDDEN_IMPORTS) {
    if (pattern.test(code)) errors.push(`[${label}] ${message}`);
  }

  // Must be a client component
  if (!code.trimStart().startsWith("'use client'") && !code.trimStart().startsWith('"use client"')) {
    errors.push(`[${label}] Must start with 'use client'`);
  }

  // Must export a function component
  if (!/export\s+function\s+\w+/.test(code)) {
    errors.push(`[${label}] Must export a named function component`);
  }

  // Size check
  if (code.length > 50_000) {
    errors.push(`[${label}] File too large (${Math.round(code.length / 1000)}KB, max 50KB)`);
  }

  // Warn about direct fetch
  if (/\bfetch\s*\(/.test(code)) {
    warnings.push(`[${label}] Direct fetch() detected — consider using useIntegration() for external APIs`);
  }

  return { errors, warnings };
}

export function validateTemplateCode(code: {
  page_code: string;
  admin_code?: string | null;
  api_handler_code?: string | null;
}): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Validate page code
  const page = validateClientCode(code.page_code, 'page');
  allErrors.push(...page.errors);
  allWarnings.push(...page.warnings);

  // Validate admin code
  if (code.admin_code) {
    const admin = validateClientCode(code.admin_code, 'admin');
    allErrors.push(...admin.errors);
    allWarnings.push(...admin.warnings);
  }

  if (code.api_handler_code) {
    allErrors.push('[api_handler] Generated server-side API handlers are disabled for security. Return api_handler_code: null.');
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}
