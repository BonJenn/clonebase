import { transform } from 'sucrase';

// Rewrites SDK imports to window.__SDK__ references for iframe preview,
// or to direct references for production runtime.
function rewriteImports(source: string, mode: 'preview' | 'production'): string {
  const sdkPrefix = mode === 'preview' ? 'window.__SDK__' : '__SDK__';

  return source
    // Remove 'use client' directive
    .replace(/^['"]use client['"];?\s*/m, '')
    // Rewrite SDK imports
    .replace(
      /import\s*\{([^}]+)\}\s*from\s*['"]@\/sdk\/tenant-context['"];?/g,
      `const {$1} = ${sdkPrefix}.tenantContext;`
    )
    .replace(
      /import\s*\{([^}]+)\}\s*from\s*['"]@\/sdk\/use-tenant-data['"];?/g,
      `const {$1} = ${sdkPrefix}.useTenantData;`
    )
    .replace(
      /import\s*\{([^}]+)\}\s*from\s*['"]@\/sdk\/use-integration['"];?/g,
      `const {$1} = ${sdkPrefix}.useIntegration;`
    )
    // Rewrite React imports to use global
    .replace(
      /import\s*\{([^}]+)\}\s*from\s*['"]react['"];?/g,
      `const {$1} = React;`
    )
    .replace(
      /import\s+React\s+from\s*['"]react['"];?/g,
      ''
    );
}

export function transpileForPreview(source: string, filename: string = 'component.tsx'): string {
  const rewritten = rewriteImports(source, 'preview');
  const result = transform(rewritten, {
    transforms: ['typescript', 'jsx'],
    jsxRuntime: 'classic',
    production: true,
    filePath: filename,
  });
  return result.code;
}

export function transpileForProduction(source: string, filename: string = 'component.tsx'): string {
  const rewritten = rewriteImports(source, 'production');
  const result = transform(rewritten, {
    transforms: ['typescript', 'jsx'],
    jsxRuntime: 'classic',
    production: true,
    filePath: filename,
  });
  return result.code;
}
