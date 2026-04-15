import { transform } from 'sucrase';

// Rewrites SDK and UI imports to window globals for iframe preview,
// or to direct references for production runtime.
function rewriteImports(source: string, mode: 'preview' | 'production'): string {
  const sdkPrefix = mode === 'preview' ? 'window.__SDK__' : '__SDK__';
  const uiPrefix = mode === 'preview' ? 'window.__UI__' : '__UI__';

  return source
    // Remove 'use client' directive
    .replace(/^['"]use client['"];?\s*/m, '')
    // Rewrite any @/sdk/* imports — map each imported name to the flat shim
    .replace(
      /import\s*\{([^}]+)\}\s*from\s*['"]@\/sdk[^'"]*['"];?/g,
      (_, names: string) => {
        return names.split(',').map(n => {
          const name = n.trim();
          return `var ${name} = ${sdkPrefix}.${name};`;
        }).join('\n');
      }
    )
    // Rewrite @/ui imports — map each imported name to the UI kit
    .replace(
      /import\s*\{([^}]+)\}\s*from\s*['"]@\/ui[^'"]*['"];?/g,
      (_, names: string) => {
        return names.split(',').map(n => {
          const name = n.trim();
          return `var ${name} = ${uiPrefix}.${name};`;
        }).join('\n');
      }
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
    // export default function Foo(...) → module.exports.Foo = function Foo(...)
    // Also assign to module.exports.default for the fallback lookup.
    .replace(
      /export\s+default\s+function\s+(\w+)/g,
      'module.exports.$1 = module.exports.default = function $1'
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
