'use client';

import { useState, useEffect, useRef } from 'react';

const CODE_LINES = [
  "import { useState, useEffect } from 'react';",
  "import { useTenant } from '@/sdk/tenant-context';",
  "import { useTenantData } from '@/sdk/use-tenant-data';",
  "",
  "interface AppData {",
  "  id?: string;",
  "  title: string;",
  "  content: string;",
  "  created_at: string;",
  "}",
  "",
  "export function App({ tenantId }) {",
  "  const { tenantName } = useTenant();",
  "  const { data, insert, loading } = useTenantData('items');",
  "  const [input, setInput] = useState('');",
  "",
  "  const handleSubmit = async (e) => {",
  "    e.preventDefault();",
  "    await insert({ title: input });",
  "    setInput('');",
  "  };",
  "",
  "  return (",
  "    <div className=\"container\">",
  "      <h1>{tenantName}</h1>",
  "      <form onSubmit={handleSubmit}>",
  "        <input value={input} onChange={...} />",
  "        <button type=\"submit\">Add</button>",
  "      </form>",
  "      {data.map(item => (",
  "        <div key={item.id}>",
  "          <span>{item.title}</span>",
  "        </div>",
  "      ))}",
  "    </div>",
  "  );",
  "}",
];

const PHASES = [
  { label: 'Designing architecture', icon: '🏗️', duration: 3000 },
  { label: 'Building components', icon: '🧩', duration: 4000 },
  { label: 'Adding features', icon: '✨', duration: 4000 },
  { label: 'Styling interface', icon: '🎨', duration: 3000 },
  { label: 'Loading data', icon: '📦', duration: 3000 },
  { label: 'Final polish', icon: '💎', duration: 3000 },
];

// Animated code generation display shown in the preview pane while generating
export function GeneratingAnimation() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Typewriter effect for code lines
  useEffect(() => {
    if (visibleLines >= CODE_LINES.length) {
      // Reset and loop
      const timeout = setTimeout(() => {
        setVisibleLines(0);
        setCharIndex(0);
      }, 2000);
      return () => clearTimeout(timeout);
    }

    const currentLine = CODE_LINES[visibleLines];
    if (charIndex >= currentLine.length) {
      const timeout = setTimeout(() => {
        setVisibleLines(v => v + 1);
        setCharIndex(0);
      }, currentLine === '' ? 50 : 100);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      setCharIndex(c => c + 1);
    }, 15 + Math.random() * 25);
    return () => clearTimeout(timeout);
  }, [visibleLines, charIndex]);

  // Phase cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseIndex(i => (i + 1) % PHASES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleLines, charIndex]);

  const currentPhase = PHASES[phaseIndex];

  return (
    <div className="flex h-full flex-col bg-gray-950 text-white overflow-hidden">
      {/* Progress header */}
      <div className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-lg">
              {currentPhase.icon}
            </div>
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-indigo-500 animate-ping" />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-indigo-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{currentPhase.label}</p>
            <p className="text-xs text-gray-500">Building your app with AI</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 transition-all duration-[3500ms] ease-linear"
            style={{ width: `${((phaseIndex + 1) / PHASES.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Code display */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-6">
        {CODE_LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i} className="flex">
            <span className="w-8 shrink-0 text-right text-gray-600 select-none pr-3">{i + 1}</span>
            <span className={colorize(line)}>{line}</span>
          </div>
        ))}
        {visibleLines < CODE_LINES.length && (
          <div className="flex">
            <span className="w-8 shrink-0 text-right text-gray-600 select-none pr-3">{visibleLines + 1}</span>
            <span className={colorize(CODE_LINES[visibleLines])}>
              {CODE_LINES[visibleLines].slice(0, charIndex)}
            </span>
            <span className="inline-block w-2 h-4 bg-indigo-400 animate-pulse ml-px" />
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="h-1.5 w-1.5 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs text-gray-500">This may take 15-30 seconds</span>
        </div>
        <span className="text-xs text-gray-600">powered by AI</span>
      </div>
    </div>
  );
}

function colorize(line: string): string {
  if (line.startsWith('import') || line.startsWith('export') || line.includes('const ') || line.includes('return')) return 'text-purple-400';
  if (line.startsWith('interface') || line.includes('function')) return 'text-blue-400';
  if (line.includes('//')) return 'text-gray-600';
  if (line.includes("'") || line.includes('"')) return 'text-green-400';
  if (line.includes('{') || line.includes('}') || line.includes('<') || line.includes('>')) return 'text-yellow-300';
  return 'text-gray-300';
}
