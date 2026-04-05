'use client';

import { useState, useMemo } from 'react';

interface CodePreviewProps {
  pageCode: string | null;
  adminCode: string | null;
  apiHandlerCode: string | null;
}

interface FileEntry {
  path: string;
  code: string;
  language: string;
}

// Parse a source file into virtual files by extracting component definitions,
// interfaces, and constants into separate "files" for a codebase-like view.
function parseIntoFiles(source: string, baseName: string): FileEntry[] {
  const files: FileEntry[] = [];
  const lines = source.split('\n');

  // Collect imports, interfaces, constants, and components
  const imports: string[] = [];
  const interfaces: { name: string; code: string }[] = [];
  const constants: { name: string; code: string }[] = [];
  const components: { name: string; code: string; isMain: boolean }[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Skip 'use client'
    if (line.trim().startsWith("'use client'") || line.trim().startsWith('"use client"')) {
      i++;
      continue;
    }

    // Imports
    if (line.trim().startsWith('import ')) {
      imports.push(line);
      i++;
      continue;
    }

    // Interfaces
    if (line.trim().startsWith('interface ') || line.trim().startsWith('type ')) {
      const match = line.match(/(?:interface|type)\s+(\w+)/);
      const name = match?.[1] || 'Unknown';
      let block = line + '\n';
      let braces = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      i++;
      while (i < lines.length && braces > 0) {
        block += lines[i] + '\n';
        braces += (lines[i].match(/{/g) || []).length - (lines[i].match(/}/g) || []).length;
        i++;
      }
      interfaces.push({ name, code: block.trimEnd() });
      continue;
    }

    // Constants (const SEED_DATA, const CATEGORIES, etc.)
    if (/^(?:export\s+)?const\s+[A-Z_][A-Z_0-9]*\s*[=:]/.test(line.trim())) {
      const match = line.match(/const\s+(\w+)/);
      const name = match?.[1] || 'CONSTANT';
      let block = line + '\n';
      let brackets = 0;
      // Track brackets for arrays/objects
      for (const ch of line) {
        if (ch === '[' || ch === '{' || ch === '(') brackets++;
        if (ch === ']' || ch === '}' || ch === ')') brackets--;
      }
      i++;
      while (i < lines.length && brackets > 0) {
        const l = lines[i];
        for (const ch of l) {
          if (ch === '[' || ch === '{' || ch === '(') brackets++;
          if (ch === ']' || ch === '}' || ch === ')') brackets--;
        }
        block += l + '\n';
        i++;
      }
      constants.push({ name, code: block.trimEnd() });
      continue;
    }

    // Function components (export function Foo or function Foo)
    if (/^(?:export\s+)?function\s+[A-Z]/.test(line.trim())) {
      const match = line.match(/function\s+(\w+)/);
      const name = match?.[1] || 'Component';
      const isExported = line.trim().startsWith('export');
      let block = line + '\n';
      let braces = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      i++;
      while (i < lines.length && braces > 0) {
        block += lines[i] + '\n';
        braces += (lines[i].match(/{/g) || []).length - (lines[i].match(/}/g) || []).length;
        i++;
      }
      components.push({ name, code: block.trimEnd(), isMain: isExported });
      continue;
    }

    i++;
  }

  // Build types file if there are interfaces
  if (interfaces.length > 0) {
    files.push({
      path: `types.ts`,
      code: interfaces.map(i => i.code).join('\n\n'),
      language: 'typescript',
    });
  }

  // Build constants/config file
  if (constants.length > 0) {
    files.push({
      path: `constants.ts`,
      code: constants.map(c => c.code).join('\n\n'),
      language: 'typescript',
    });
  }

  // Helper components as separate files
  const helpers = components.filter(c => !c.isMain);
  for (const helper of helpers) {
    files.push({
      path: `components/${helper.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}.tsx`,
      code: `'use client';\n\n${helper.code}`,
      language: 'tsx',
    });
  }

  // Main component file
  const main = components.find(c => c.isMain);
  if (main) {
    const mainImports = imports.length > 0 ? imports.join('\n') + '\n\n' : '';
    files.push({
      path: baseName,
      code: `'use client';\n\n${mainImports}${main.code}`,
      language: 'tsx',
    });
  } else {
    // No parsing worked, show the raw file
    files.push({ path: baseName, code: source, language: 'tsx' });
  }

  return files;
}

export function CodePreview({ pageCode, adminCode, apiHandlerCode }: CodePreviewProps) {
  const allFiles = useMemo(() => {
    const files: FileEntry[] = [];

    if (pageCode) {
      files.push(...parseIntoFiles(pageCode, 'page.tsx'));
    }
    if (adminCode) {
      files.push(...parseIntoFiles(adminCode, 'admin.tsx'));
    }
    if (apiHandlerCode) {
      files.push({ path: 'api/handler.ts', code: apiHandlerCode, language: 'typescript' });
    }

    // Deduplicate types.ts if both page and admin produced one
    const typeFiles = files.filter(f => f.path === 'types.ts');
    if (typeFiles.length > 1) {
      const merged = typeFiles.map(f => f.code).join('\n\n');
      const otherFiles = files.filter(f => f.path !== 'types.ts');
      return [{ path: 'types.ts', code: merged, language: 'typescript' }, ...otherFiles];
    }

    return files;
  }, [pageCode, adminCode, apiHandlerCode]);

  const [activeFile, setActiveFile] = useState(0);

  if (allFiles.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-900 text-gray-500">
        <p className="text-sm">Code will appear here once generated.</p>
      </div>
    );
  }

  const current = allFiles[activeFile] || allFiles[0];

  return (
    <div className="flex h-full bg-gray-900">
      {/* File tree sidebar */}
      <div className="w-48 shrink-0 border-r border-gray-800 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
          Files
        </div>
        {allFiles.map((file, idx) => (
          <button
            key={file.path}
            onClick={() => setActiveFile(idx)}
            className={`w-full text-left px-3 py-1.5 text-xs font-mono truncate transition-colors ${
              idx === activeFile
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <span className="mr-1.5">
              {file.path.endsWith('.ts') ? '📄' : file.path.includes('components/') ? '🧩' : '📝'}
            </span>
            {file.path}
          </button>
        ))}
      </div>

      {/* Code viewer */}
      <div className="flex-1 overflow-auto">
        <div className="sticky top-0 bg-gray-800 px-4 py-1.5 text-xs text-gray-400 font-mono border-b border-gray-700">
          {current.path}
        </div>
        <pre className="p-4 text-xs leading-relaxed text-gray-300">
          <code>{current.code}</code>
        </pre>
      </div>
    </div>
  );
}
