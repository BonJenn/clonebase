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

// Convert ES module exports to module.exports assignments
// so the code can run inside new Function() / eval.
function rewriteExports(source: string): string {
  return source
    // export default function Foo(...) → function Foo(...) ... module.exports.default = Foo;
    .replace(
      /export\s+default\s+function\s+(\w+)/g,
      'function $1'
    )
    // export function Foo(...) → function Foo(...) ... (we'll assign below)
    .replace(
      /export\s+function\s+(\w+)/g,
      'module.exports.$1 = function $1'
    )
    // export const Foo = ... → module.exports.Foo = ...
    .replace(
      /export\s+const\s+(\w+)/g,
      'module.exports.$1'
    )
    // export { Foo, Bar } — collect and assign
    .replace(
      /export\s*\{([^}]+)\}/g,
      (_, names: string) => {
        return names.split(',').map((n) => {
          const name = n.trim();
          return `module.exports.${name} = ${name};`;
        }).join('\n');
      }
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
  return rewriteExports(result.code);
}

export function transpileForProduction(source: string, filename: string = 'component.tsx'): string {
  const rewritten = rewriteImports(source, 'production');
  const result = transform(rewritten, {
    transforms: ['typescript', 'jsx'],
    jsxRuntime: 'classic',
    production: true,
    filePath: filename,
  });
  return rewriteExports(result.code);
}
