// Runtime UI component library for generated apps.
// Exported as a JS string that gets embedded in the sandbox iframe HTML
// and provided via window.__UI__ for generated code to use.
//
// Components are written in vanilla React.createElement calls because
// the sandbox has no JSX transpilation at runtime. Generated code
// DOES get transpiled by sucrase, so it writes JSX that becomes
// React.createElement calls which reference these components.
//
// The transpiler rewrites: import { Button } from '@/ui' → var { Button } = window.__UI__;

export const UI_KIT_SCRIPT = `
// ─────────────────────────────────────────────────────────────────────────────
// Clonebase UI Kit — embedded component library for generated apps
// ─────────────────────────────────────────────────────────────────────────────

(function() {
  'use strict';

  var h = React.createElement;

  // ── Tailwind Color Palette ──────────────────────────────────────────────────
  var COLORS = {
    slate:   { 50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',800:'#1e293b',900:'#0f172a' },
    gray:    { 50:'#f9fafb',100:'#f3f4f6',200:'#e5e7eb',300:'#d1d5db',400:'#9ca3af',500:'#6b7280',600:'#4b5563',700:'#374151',800:'#1f2937',900:'#111827' },
    red:     { 50:'#fef2f2',100:'#fee2e2',200:'#fecaca',300:'#fca5a5',400:'#f87171',500:'#ef4444',600:'#dc2626',700:'#b91c1c',800:'#991b1b',900:'#7f1d1d' },
    orange:  { 50:'#fff7ed',100:'#ffedd5',200:'#fed7aa',300:'#fdba74',400:'#fb923c',500:'#f97316',600:'#ea580c',700:'#c2410c',800:'#9a3412',900:'#7c2d12' },
    amber:   { 50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706',700:'#b45309',800:'#92400e',900:'#78350f' },
    emerald: { 50:'#ecfdf5',100:'#d1fae5',200:'#a7f3d0',300:'#6ee7b7',400:'#34d399',500:'#10b981',600:'#059669',700:'#047857',800:'#065f46',900:'#064e3b' },
    teal:    { 50:'#f0fdfa',100:'#ccfbf1',200:'#99f6e4',300:'#5eead4',400:'#2dd4bf',500:'#14b8a6',600:'#0d9488',700:'#0f766e',800:'#115e59',900:'#134e4a' },
    sky:     { 50:'#f0f9ff',100:'#e0f2fe',200:'#bae6fd',300:'#7dd3fc',400:'#38bdf8',500:'#0ea5e9',600:'#0284c7',700:'#0369a1',800:'#075985',900:'#0c4a6e' },
    blue:    { 50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',300:'#93c5fd',400:'#60a5fa',500:'#3b82f6',600:'#2563eb',700:'#1d4ed8',800:'#1e40af',900:'#1e3a8a' },
    indigo:  { 50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81' },
    violet:  { 50:'#f5f3ff',100:'#ede9fe',200:'#ddd6fe',300:'#c4b5fd',400:'#a78bfa',500:'#8b5cf6',600:'#7c3aed',700:'#6d28d9',800:'#5b21b6',900:'#4c1d95' },
    purple:  { 50:'#faf5ff',100:'#f3e8ff',200:'#e9d5ff',300:'#d8b4fe',400:'#c084fc',500:'#a855f7',600:'#9333ea',700:'#7e22ce',800:'#6b21a8',900:'#581c87' },
    fuchsia: { 50:'#fdf4ff',100:'#fae8ff',200:'#f5d0fe',300:'#f0abfc',400:'#e879f9',500:'#d946ef',600:'#c026d3',700:'#a21caf',800:'#86198f',900:'#701a75' },
    rose:    { 50:'#fff1f2',100:'#ffe4e6',200:'#fecdd3',300:'#fda4af',400:'#fb7185',500:'#f43f5e',600:'#e11d48',700:'#be123c',800:'#9f1239',900:'#881337' },
    cyan:    { 50:'#ecfeff',100:'#cffafe',200:'#a5f3fc',300:'#67e8f9',400:'#22d3ee',500:'#06b6d4',600:'#0891b2',700:'#0e7490',800:'#155e75',900:'#164e63' },
    lime:    { 50:'#f7fee7',100:'#ecfccb',200:'#d9f99d',300:'#bef264',400:'#a3e635',500:'#84cc16',600:'#65a30d',700:'#4d7c0f',800:'#3f6212',900:'#365314' },
    zinc:    { 50:'#fafafa',100:'#f4f4f5',200:'#e4e4e7',300:'#d4d4d8',400:'#a1a1aa',500:'#71717a',600:'#52525b',700:'#3f3f46',800:'#27272a',900:'#18181b' },
  };

  // ── Theme State ─────────────────────────────────────────────────────────────
  var _primaryName = 'indigo';
  var _primary = COLORS.indigo;
  var _darkMode = false;

  function setupTheme(opts) {
    if (!opts) return;
    if (opts.primaryColor && COLORS[opts.primaryColor]) {
      _primaryName = opts.primaryColor;
      _primary = COLORS[opts.primaryColor];
    }
    if (opts.darkMode !== undefined) _darkMode = !!opts.darkMode;
    injectThemeCSS();
  }

  function injectThemeCSS() {
    var id = '__ui-theme-css';
    var existing = document.getElementById(id);
    if (existing) existing.remove();
    var p = _primary;
    var style = document.createElement('style');
    style.id = id;
    style.textContent = [
      ':root {',
      '  --ui-primary-50:' + p[50] + ';',
      '  --ui-primary-100:' + p[100] + ';',
      '  --ui-primary-200:' + p[200] + ';',
      '  --ui-primary-500:' + p[500] + ';',
      '  --ui-primary-600:' + p[600] + ';',
      '  --ui-primary-700:' + p[700] + ';',
      '  --ui-primary-900:' + p[900] + ';',
      '}',
      // We use data attributes for dark mode on the html element
      _darkMode ? 'html { color-scheme: dark; }' : '',
    ].join('\\n');
    document.head.appendChild(style);
  }

  function pc(shade) { return _primary[shade] || _primary[600]; }

  // ── Utility: merge classNames ───────────────────────────────────────────────
  function cn() {
    var result = '';
    for (var i = 0; i < arguments.length; i++) {
      var arg = arguments[i];
      if (arg && typeof arg === 'string') {
        if (result) result += ' ';
        result += arg;
      }
    }
    return result;
  }

  // ── Icon System (Lucide-compatible SVG paths) ──────────────────────────────
  // Each entry: [strokeWidth, ...svgElements] where svgElements are strings
  // of SVG markup (paths, circles, lines, etc.)
  var ICONS = {
    'search':          ['<circle cx="11" cy="11" r="8"/>', '<path d="m21 21-4.3-4.3"/>'],
    'plus':            ['<path d="M5 12h14"/>', '<path d="M12 5v14"/>'],
    'x':               ['<path d="M18 6 6 18"/>', '<path d="m6 6 12 12"/>'],
    'check':           ['<path d="M20 6 9 17l-5-5"/>'],
    'chevron-down':    ['<path d="m6 9 6 6 6-6"/>'],
    'chevron-up':      ['<path d="m18 15-6-6-6 6"/>'],
    'chevron-right':   ['<path d="m9 18 6-6-6-6"/>'],
    'chevron-left':    ['<path d="m15 18-6-6 6-6"/>'],
    'arrow-left':      ['<path d="m12 19-7-7 7-7"/>', '<path d="M19 12H5"/>'],
    'arrow-right':     ['<path d="M5 12h14"/>', '<path d="m12 5 7 7-7 7"/>'],
    'menu':            ['<line x1="4" x2="20" y1="12" y2="12"/>', '<line x1="4" x2="20" y1="6" y2="6"/>', '<line x1="4" x2="20" y1="18" y2="18"/>'],
    'settings':        ['<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>', '<circle cx="12" cy="12" r="3"/>'],
    'user':            ['<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>', '<circle cx="12" cy="7" r="4"/>'],
    'users':           ['<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>', '<circle cx="9" cy="7" r="4"/>', '<path d="M22 21v-2a4 4 0 0 0-3-3.87"/>', '<path d="M16 3.13a4 4 0 0 1 0 7.75"/>'],
    'mail':            ['<rect width="20" height="16" x="2" y="4" rx="2"/>', '<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>'],
    'phone':           ['<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'],
    'calendar':        ['<path d="M8 2v4"/>', '<path d="M16 2v4"/>', '<rect width="18" height="18" x="3" y="4" rx="2"/>', '<path d="M3 10h18"/>'],
    'clock':           ['<circle cx="12" cy="12" r="10"/>', '<polyline points="12 6 12 12 16 14"/>'],
    'star':            ['<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'],
    'heart':           ['<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>'],
    'trash':           ['<path d="M3 6h18"/>', '<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>', '<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>'],
    'edit':            ['<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>'],
    'eye':             ['<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>', '<circle cx="12" cy="12" r="3"/>'],
    'eye-off':         ['<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/>', '<path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/>', '<path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/>', '<path d="m2 2 20 20"/>'],
    'download':        ['<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>', '<polyline points="7 10 12 15 17 10"/>', '<line x1="12" x2="12" y1="15" y2="3"/>'],
    'upload':          ['<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>', '<polyline points="17 8 12 3 7 8"/>', '<line x1="12" x2="12" y1="3" y2="15"/>'],
    'filter':          ['<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>'],
    'home':            ['<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>', '<path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'],
    'bell':            ['<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>', '<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'],
    'bookmark':        ['<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>'],
    'share':           ['<circle cx="18" cy="5" r="3"/>', '<circle cx="6" cy="12" r="3"/>', '<circle cx="18" cy="19" r="3"/>', '<line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/>', '<line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>'],
    'link':            ['<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>', '<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'],
    'image':           ['<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>', '<circle cx="9" cy="9" r="2"/>', '<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>'],
    'folder':          ['<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>'],
    'file':            ['<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>', '<path d="M14 2v4a2 2 0 0 0 2 2h4"/>'],
    'grid':            ['<rect width="7" height="7" x="3" y="3" rx="1"/>', '<rect width="7" height="7" x="14" y="3" rx="1"/>', '<rect width="7" height="7" x="14" y="14" rx="1"/>', '<rect width="7" height="7" x="3" y="14" rx="1"/>'],
    'list':            ['<line x1="8" x2="21" y1="6" y2="6"/>', '<line x1="8" x2="21" y1="12" y2="12"/>', '<line x1="8" x2="21" y1="18" y2="18"/>', '<line x1="3" x2="3.01" y1="6" y2="6"/>', '<line x1="3" x2="3.01" y1="12" y2="12"/>', '<line x1="3" x2="3.01" y1="18" y2="18"/>'],
    'bar-chart':       ['<line x1="12" x2="12" y1="20" y2="10"/>', '<line x1="18" x2="18" y1="20" y2="4"/>', '<line x1="6" x2="6" y1="20" y2="14"/>'],
    'trending-up':     ['<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>', '<polyline points="16 7 22 7 22 13"/>'],
    'trending-down':   ['<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/>', '<polyline points="16 17 22 17 22 11"/>'],
    'dollar-sign':     ['<line x1="12" x2="12" y1="2" y2="22"/>', '<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'],
    'credit-card':     ['<rect width="20" height="14" x="2" y="5" rx="2"/>', '<line x1="2" x2="22" y1="10" y2="10"/>'],
    'shopping-cart':   ['<circle cx="8" cy="21" r="1"/>', '<circle cx="19" cy="21" r="1"/>', '<path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>'],
    'package':         ['<path d="m7.5 4.27 9 5.15"/>', '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>', '<path d="m3.3 7 8.7 5 8.7-5"/>', '<path d="M12 22V12"/>'],
    'map-pin':         ['<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>', '<circle cx="12" cy="10" r="3"/>'],
    'globe':           ['<circle cx="12" cy="12" r="10"/>', '<path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>', '<path d="M2 12h20"/>'],
    'sun':             ['<circle cx="12" cy="12" r="4"/>', '<path d="M12 2v2"/>', '<path d="M12 20v2"/>', '<path d="m4.93 4.93 1.41 1.41"/>', '<path d="m17.66 17.66 1.41 1.41"/>', '<path d="M2 12h2"/>', '<path d="M20 12h2"/>', '<path d="m6.34 17.66-1.41 1.41"/>', '<path d="m19.07 4.93-1.41 1.41"/>'],
    'moon':            ['<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'],
    'loader':          ['<path d="M12 2v4"/>', '<path d="m16.2 7.8 2.9-2.9"/>', '<path d="M18 12h4"/>', '<path d="m16.2 16.2 2.9 2.9"/>', '<path d="M12 18v4"/>', '<path d="m4.9 19.1 2.9-2.9"/>', '<path d="M2 12h4"/>', '<path d="m4.9 4.9 2.9 2.9"/>'],
    'alert-circle':    ['<circle cx="12" cy="12" r="10"/>', '<line x1="12" x2="12" y1="8" y2="12"/>', '<line x1="12" x2="12.01" y1="16" y2="16"/>'],
    'alert-triangle':  ['<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>', '<path d="M12 9v4"/>', '<path d="M12 17h.01"/>'],
    'info':            ['<circle cx="12" cy="12" r="10"/>', '<path d="M12 16v-4"/>', '<path d="M12 8h.01"/>'],
    'check-circle':    ['<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>', '<path d="m9 11 3 3L22 4"/>'],
    'x-circle':        ['<circle cx="12" cy="12" r="10"/>', '<path d="m15 9-6 6"/>', '<path d="m9 9 6 6"/>'],
    'inbox':           ['<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>', '<path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>'],
    'send':            ['<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/>', '<path d="m21.854 2.147-10.94 10.939"/>'],
    'refresh-cw':      ['<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>', '<path d="M21 3v5h-5"/>', '<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>', '<path d="M8 16H3v5"/>'],
    'copy':            ['<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>', '<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'],
    'external-link':   ['<path d="M15 3h6v6"/>', '<path d="M10 14 21 3"/>', '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'],
    'more-horizontal': ['<circle cx="12" cy="12" r="1"/>', '<circle cx="19" cy="12" r="1"/>', '<circle cx="5" cy="12" r="1"/>'],
    'more-vertical':   ['<circle cx="12" cy="12" r="1"/>', '<circle cx="12" cy="5" r="1"/>', '<circle cx="12" cy="19" r="1"/>'],
    'log-out':         ['<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>', '<polyline points="16 17 21 12 16 7"/>', '<line x1="21" x2="9" y1="12" y2="12"/>'],
    'log-in':          ['<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>', '<polyline points="10 17 15 12 10 7"/>', '<line x1="15" x2="3" y1="12" y2="12"/>'],
    'shield':          ['<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>'],
    'lock':            ['<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>', '<path d="M7 11V7a5 5 0 0 1 10 0v4"/>'],
    'unlock':          ['<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>', '<path d="M7 11V7a5 5 0 0 1 9.9-1"/>'],
    'zap':             ['<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>'],
    'activity':        ['<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>'],
    'building':        ['<rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>', '<path d="M9 22v-4h6v4"/>', '<path d="M8 6h.01"/>', '<path d="M16 6h.01"/>', '<path d="M12 6h.01"/>', '<path d="M12 10h.01"/>', '<path d="M12 14h.01"/>', '<path d="M16 10h.01"/>', '<path d="M16 14h.01"/>', '<path d="M8 10h.01"/>', '<path d="M8 14h.01"/>'],
    'tag':             ['<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/>', '<circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>'],
    'hash':            ['<line x1="4" x2="20" y1="9" y2="9"/>', '<line x1="4" x2="20" y1="15" y2="15"/>', '<line x1="10" x2="8" y1="3" y2="21"/>', '<line x1="16" x2="14" y1="3" y2="21"/>'],
    'at-sign':         ['<circle cx="12" cy="12" r="4"/>', '<path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>'],
    'play':            ['<polygon points="6 3 20 12 6 21 6 3"/>'],
    'pause':           ['<rect width="4" height="16" x="6" y="4"/>', '<rect width="4" height="16" x="14" y="4"/>'],
    'square':          ['<rect width="18" height="18" x="3" y="3" rx="2"/>'],
    'circle':          ['<circle cx="12" cy="12" r="10"/>'],
    'layout-dashboard':['<rect width="7" height="9" x="3" y="3" rx="1"/>', '<rect width="7" height="5" x="14" y="3" rx="1"/>', '<rect width="7" height="9" x="14" y="12" rx="1"/>', '<rect width="7" height="5" x="3" y="16" rx="1"/>'],
    'layout-list':     ['<rect width="7" height="7" x="3" y="3" rx="1"/>', '<rect width="7" height="7" x="3" y="14" rx="1"/>', '<path d="M14 4h7"/>', '<path d="M14 9h7"/>', '<path d="M14 15h7"/>', '<path d="M14 20h7"/>'],
    'palette':         ['<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>', '<circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>', '<circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>', '<circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>', '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>'],
    'sparkles':        ['<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>', '<path d="M20 3v4"/>', '<path d="M22 5h-4"/>'],
    'trophy':          ['<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>', '<path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>', '<path d="M4 22h16"/>', '<path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>', '<path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>', '<path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>'],
    'target':          ['<circle cx="12" cy="12" r="10"/>', '<circle cx="12" cy="12" r="6"/>', '<circle cx="12" cy="12" r="2"/>'],
    'layers':          ['<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/>', '<path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/>', '<path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>'],
    'grip-vertical':   ['<circle cx="9" cy="12" r="1"/>', '<circle cx="9" cy="5" r="1"/>', '<circle cx="9" cy="19" r="1"/>', '<circle cx="15" cy="12" r="1"/>', '<circle cx="15" cy="5" r="1"/>', '<circle cx="15" cy="19" r="1"/>'],
    'message-square':  ['<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'],
    'sliders':         ['<line x1="4" x2="4" y1="21" y2="14"/>', '<line x1="4" x2="4" y1="10" y2="3"/>', '<line x1="12" x2="12" y1="21" y2="12"/>', '<line x1="12" x2="12" y1="8" y2="3"/>', '<line x1="20" x2="20" y1="21" y2="16"/>', '<line x1="20" x2="20" y1="12" y2="3"/>', '<line x1="2" x2="6" y1="14" y2="14"/>', '<line x1="10" x2="14" y1="8" y2="8"/>', '<line x1="18" x2="22" y1="16" y2="16"/>'],
    'save':            ['<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>', '<path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/>', '<path d="M7 3v4a1 1 0 0 0 1 1h7"/>'],
    'printer':         ['<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>', '<path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/>', '<rect x="6" y="14" width="12" height="8" rx="1"/>'],
  };

  // ── Icon Component ──────────────────────────────────────────────────────────
  function Icon(props) {
    var name = props.name || 'circle';
    var size = props.size || 20;
    var className = props.className || '';
    var strokeWidth = props.strokeWidth || 2;
    var paths = ICONS[name];
    if (!paths) {
      // Fallback: render a simple circle for unknown icons
      paths = ICONS['circle'];
    }
    var children = paths.map(function(svg, i) {
      // Parse the SVG element string into a React element
      // We use dangerouslySetInnerHTML on a <g> wrapper
      return h('g', { key: i, dangerouslySetInnerHTML: { __html: svg } });
    });
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: strokeWidth,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className: cn('shrink-0', className),
    }, children);
  }

  // ── Button ──────────────────────────────────────────────────────────────────
  function Button(props) {
    var variant = props.variant || 'primary';
    var size = props.size || 'md';
    var loading = props.loading;
    var disabled = props.disabled || loading;
    var children = props.children;
    var icon = props.icon; // icon name string
    var className = props.className || '';
    var type = props.type || 'button';

    var baseClass = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    var sizeClass = {
      sm: 'rounded-md px-3 py-1.5 text-xs gap-1.5',
      md: 'rounded-lg px-4 py-2 text-sm gap-2',
      lg: 'rounded-lg px-6 py-2.5 text-base gap-2',
    }[size] || 'rounded-lg px-4 py-2 text-sm gap-2';

    var variantStyle = {};
    var variantClass = '';

    if (variant === 'primary') {
      variantStyle = { backgroundColor: pc(600), color: '#fff' };
      variantClass = 'hover:opacity-90 focus:ring-2';
    } else if (variant === 'secondary') {
      variantClass = 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50';
    } else if (variant === 'ghost') {
      variantClass = 'text-gray-700 hover:bg-gray-100';
    } else if (variant === 'danger') {
      variantClass = 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
    } else if (variant === 'link') {
      variantStyle = { color: pc(600) };
      variantClass = 'underline-offset-4 hover:underline p-0 h-auto';
    }

    var iconEl = null;
    if (loading) {
      iconEl = h(Icon, { name: 'loader', size: size === 'sm' ? 14 : 16, className: 'animate-spin' });
    } else if (icon) {
      iconEl = h(Icon, { name: icon, size: size === 'sm' ? 14 : 16 });
    }

    var rest = {};
    if (props.onClick) rest.onClick = props.onClick;
    if (props.id) rest.id = props.id;

    return h('button', Object.assign({
      type: type,
      disabled: disabled,
      className: cn(baseClass, sizeClass, variantClass, className),
      style: variantStyle,
    }, rest), iconEl, loading ? 'Loading...' : children);
  }

  // ── Input ───────────────────────────────────────────────────────────────────
  function Input(props) {
    var label = props.label;
    var error = props.error;
    var className = props.className || '';
    var id = props.id || (label ? label.toLowerCase().replace(/\\s+/g, '-') : undefined);

    var inputClass = cn(
      'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 transition-colors',
      error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
    );

    var inputProps = {
      id: id,
      type: props.type || 'text',
      value: props.value,
      onChange: props.onChange,
      placeholder: props.placeholder,
      disabled: props.disabled,
      className: cn(inputClass, className),
      autoComplete: props.autoComplete,
      name: props.name,
      min: props.min,
      max: props.max,
      step: props.step,
    };
    // Apply primary focus color
    inputProps.style = error ? {} : { '--tw-ring-color': pc(500) };
    inputProps.onFocus = function(e) {
      if (!error) e.target.style.borderColor = pc(500);
      if (props.onFocus) props.onFocus(e);
    };
    inputProps.onBlur = function(e) {
      if (!error) e.target.style.borderColor = '';
      if (props.onBlur) props.onBlur(e);
    };

    var els = [];
    if (label) {
      els.push(h('label', { htmlFor: id, className: 'block text-sm font-medium text-gray-700 mb-1', key: 'l' }, label));
    }
    els.push(h('input', Object.assign({ key: 'i' }, inputProps)));
    if (error) {
      els.push(h('p', { className: 'mt-1 text-xs text-red-600', key: 'e' }, error));
    }
    return h('div', null, els);
  }

  // ── Textarea ────────────────────────────────────────────────────────────────
  function Textarea(props) {
    var label = props.label;
    var error = props.error;
    var id = props.id || (label ? label.toLowerCase().replace(/\\s+/g, '-') : undefined);

    var taProps = {
      id: id,
      value: props.value,
      onChange: props.onChange,
      placeholder: props.placeholder,
      disabled: props.disabled,
      rows: props.rows || 3,
      className: cn(
        'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 transition-colors',
        error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300',
        props.className || ''
      ),
    };
    taProps.onFocus = function(e) {
      if (!error) e.target.style.borderColor = pc(500);
    };
    taProps.onBlur = function(e) {
      if (!error) e.target.style.borderColor = '';
    };

    var els = [];
    if (label) {
      els.push(h('label', { htmlFor: id, className: 'block text-sm font-medium text-gray-700 mb-1', key: 'l' }, label));
    }
    els.push(h('textarea', Object.assign({ key: 't' }, taProps)));
    if (error) {
      els.push(h('p', { className: 'mt-1 text-xs text-red-600', key: 'e' }, error));
    }
    return h('div', null, els);
  }

  // ── Select ──────────────────────────────────────────────────────────────────
  function Select(props) {
    var label = props.label;
    var error = props.error;
    var options = props.options || []; // [{value, label}]
    var placeholder = props.placeholder;
    var id = props.id || (label ? label.toLowerCase().replace(/\\s+/g, '-') : undefined);

    var selectProps = {
      id: id,
      value: props.value,
      onChange: props.onChange,
      disabled: props.disabled,
      className: cn(
        'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 transition-colors appearance-none bg-white',
        error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300',
        props.className || ''
      ),
      style: {
        backgroundImage: "url(\\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.75rem center',
        paddingRight: '2.5rem',
      },
    };
    selectProps.onFocus = function(e) {
      if (!error) e.target.style.borderColor = pc(500);
    };
    selectProps.onBlur = function(e) {
      if (!error) e.target.style.borderColor = '';
    };

    var optionEls = [];
    if (placeholder) {
      optionEls.push(h('option', { value: '', key: '__ph' }, placeholder));
    }
    options.forEach(function(opt, i) {
      optionEls.push(h('option', { value: opt.value, key: i }, opt.label || opt.value));
    });

    var els = [];
    if (label) {
      els.push(h('label', { htmlFor: id, className: 'block text-sm font-medium text-gray-700 mb-1', key: 'l' }, label));
    }
    els.push(h('select', Object.assign({ key: 's' }, selectProps), optionEls));
    if (error) {
      els.push(h('p', { className: 'mt-1 text-xs text-red-600', key: 'e' }, error));
    }
    return h('div', null, els);
  }

  // ── Switch ──────────────────────────────────────────────────────────────────
  function Switch(props) {
    var checked = !!props.checked;
    var onChange = props.onChange;
    var label = props.label;
    var disabled = props.disabled;

    var track = h('button', {
      type: 'button',
      role: 'switch',
      'aria-checked': checked,
      disabled: disabled,
      onClick: function() { if (onChange) onChange(!checked); },
      className: cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
      ),
      style: { backgroundColor: checked ? pc(600) : '#d1d5db' },
    }, h('span', {
      className: cn('pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform duration-200', checked ? 'translate-x-5' : 'translate-x-0'),
    }));

    if (label) {
      return h('label', { className: 'inline-flex items-center gap-3 cursor-pointer' }, track, h('span', { className: 'text-sm text-gray-700' }, label));
    }
    return track;
  }

  // ── Card / CardHeader / CardTitle / CardDescription / CardContent / CardFooter
  function Card(props) {
    return h('div', {
      className: cn('rounded-xl border border-gray-200 bg-white shadow-sm', props.className),
      style: props.style,
      onClick: props.onClick,
    }, props.children);
  }
  function CardHeader(props) {
    return h('div', { className: cn('p-4 pb-0', props.className) }, props.children);
  }
  function CardTitle(props) {
    return h('h3', { className: cn('text-base font-medium text-gray-900', props.className) }, props.children);
  }
  function CardDescription(props) {
    return h('p', { className: cn('mt-1 text-sm text-gray-600', props.className) }, props.children);
  }
  function CardContent(props) {
    return h('div', { className: cn('p-4', props.className) }, props.children);
  }
  function CardFooter(props) {
    return h('div', { className: cn('flex items-center p-4 pt-0', props.className) }, props.children);
  }

  // ── Badge ───────────────────────────────────────────────────────────────────
  function Badge(props) {
    var variant = props.variant || 'default';
    var size = props.size || 'sm';
    var dot = props.dot;

    var variantClass = {
      default: 'bg-gray-100 text-gray-700',
      success: 'bg-green-50 text-green-700',
      warning: 'bg-amber-50 text-amber-700',
      error: 'bg-red-50 text-red-700',
      info: 'bg-blue-50 text-blue-700',
      outline: 'border border-gray-300 text-gray-700',
    }[variant] || 'bg-gray-100 text-gray-700';

    // Primary variant using the theme color
    if (variant === 'primary') {
      variantClass = '';
    }

    var sizeClass = size === 'lg' ? 'px-3 py-1 text-xs' : 'px-2.5 py-0.5 text-xs';

    var style = variant === 'primary' ? { backgroundColor: pc(50), color: pc(700) } : {};

    var children = [];
    if (dot) {
      var dotColor = { success: '#22c55e', warning: '#f59e0b', error: '#ef4444', info: '#3b82f6' }[variant] || pc(600);
      children.push(h('span', {
        key: 'd',
        className: 'mr-1.5 inline-block h-1.5 w-1.5 rounded-full',
        style: { backgroundColor: dotColor },
      }));
    }
    children.push(props.children);

    return h('span', {
      className: cn('inline-flex items-center rounded-full font-medium', variantClass, sizeClass, props.className),
      style: style,
    }, children);
  }

  // ── Avatar ──────────────────────────────────────────────────────────────────
  function Avatar(props) {
    var size = props.size || 'md';
    var src = props.src;
    var fallback = props.fallback || '?';
    var alt = props.alt || '';

    var sizeClass = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-lg',
    }[size] || 'h-10 w-10 text-sm';

    if (src) {
      return h('img', {
        src: src,
        alt: alt,
        className: cn('rounded-full object-cover', sizeClass, props.className),
      });
    }
    return h('div', {
      className: cn('rounded-full flex items-center justify-center font-medium text-white', sizeClass, props.className),
      style: { backgroundColor: pc(600) },
    }, fallback);
  }

  // ── StatCard ────────────────────────────────────────────────────────────────
  function StatCard(props) {
    var title = props.title;
    var value = props.value;
    var change = props.change;
    var trend = props.trend; // 'up' | 'down' | 'neutral'
    var icon = props.icon;

    var trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500';
    var trendIcon = trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : null;

    return h('div', {
      className: cn('rounded-xl border border-gray-200 bg-white p-4 shadow-sm', props.className),
    },
      h('div', { className: 'flex items-center justify-between' },
        h('p', { className: 'text-sm text-gray-600' }, title),
        icon ? h('div', { className: 'rounded-lg p-2', style: { backgroundColor: pc(50) } },
          h(Icon, { name: icon, size: 18, className: '', style: { color: pc(600) } })
        ) : null
      ),
      h('p', { className: 'mt-2 text-2xl font-semibold text-gray-900' }, value),
      change ? h('div', { className: 'mt-1 flex items-center gap-1 ' + trendColor },
        trendIcon ? h(Icon, { name: trendIcon, size: 14 }) : null,
        h('span', { className: 'text-xs font-medium' }, change)
      ) : null
    );
  }

  // ── EmptyState ──────────────────────────────────────────────────────────────
  function EmptyState(props) {
    var icon = props.icon || 'inbox';
    var title = props.title || 'No items yet';
    var description = props.description;
    var action = props.action; // React element (e.g., a Button)

    return h('div', { className: cn('flex flex-col items-center justify-center py-12 text-center', props.className) },
      h('div', { className: 'rounded-full p-3 mb-4', style: { backgroundColor: pc(50) } },
        h(Icon, { name: icon, size: 24, style: { color: pc(400) } })
      ),
      h('h3', { className: 'text-base font-medium text-gray-900' }, title),
      description ? h('p', { className: 'mt-1 text-sm text-gray-500 max-w-sm' }, description) : null,
      action ? h('div', { className: 'mt-4' }, action) : null
    );
  }

  // ── LoadingState ────────────────────────────────────────────────────────────
  function LoadingState(props) {
    var text = props.text || 'Loading...';
    return h('div', { className: cn('flex flex-col items-center justify-center py-12', props.className) },
      h(Icon, { name: 'loader', size: 24, className: 'animate-spin mb-3', style: { color: pc(600) } }),
      h('p', { className: 'text-sm text-gray-500' }, text)
    );
  }

  // ── Tabs ────────────────────────────────────────────────────────────────────
  function Tabs(props) {
    var tabs = props.tabs || []; // [{key, label, icon?}]
    var active = props.active;
    var onChange = props.onChange;

    return h('div', { className: cn('border-b border-gray-200', props.className) },
      h('nav', { className: 'flex gap-0 -mb-px' },
        tabs.map(function(tab) {
          var isActive = tab.key === active;
          return h('button', {
            key: tab.key,
            type: 'button',
            onClick: function() { if (onChange) onChange(tab.key); },
            className: cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              isActive ? 'border-current text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ),
            style: isActive ? { borderColor: pc(600), color: pc(600) } : {},
          },
            tab.icon ? h(Icon, { name: tab.icon, size: 16, className: 'mr-1.5 inline-block' }) : null,
            tab.label
          );
        })
      )
    );
  }

  // ── Dialog ──────────────────────────────────────────────────────────────────
  function Dialog(props) {
    var open = props.open;
    var onClose = props.onClose;
    var title = props.title;
    var description = props.description;
    var children = props.children;
    var size = props.size || 'md'; // sm, md, lg

    if (!open) return null;

    var sizeClass = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
    }[size] || 'max-w-md';

    return h('div', {
      className: 'fixed inset-0 z-50 flex items-center justify-center p-4',
      onClick: function(e) { if (e.target === e.currentTarget && onClose) onClose(); },
    },
      // Backdrop
      h('div', { className: 'fixed inset-0 bg-black/50', onClick: onClose }),
      // Panel
      h('div', {
        className: cn('relative w-full rounded-xl bg-white shadow-xl', sizeClass),
        onClick: function(e) { e.stopPropagation(); },
      },
        // Header
        (title || onClose) ? h('div', { className: 'flex items-start justify-between p-4 pb-0' },
          h('div', null,
            title ? h('h2', { className: 'text-lg font-semibold text-gray-900' }, title) : null,
            description ? h('p', { className: 'mt-1 text-sm text-gray-500' }, description) : null
          ),
          onClose ? h('button', {
            type: 'button',
            onClick: onClose,
            className: 'rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors',
          }, h(Icon, { name: 'x', size: 18 })) : null
        ) : null,
        // Content
        h('div', { className: 'p-4' }, children)
      )
    );
  }

  function DialogFooter(props) {
    return h('div', { className: cn('flex items-center justify-end gap-3 pt-4', props.className) }, props.children);
  }

  // ── Alert ───────────────────────────────────────────────────────────────────
  function Alert(props) {
    var variant = props.variant || 'info';
    var title = props.title;
    var children = props.children;

    var config = {
      info: { icon: 'info', bg: 'bg-blue-50', border: 'border-blue-200', title: 'text-blue-800', text: 'text-blue-700' },
      success: { icon: 'check-circle', bg: 'bg-green-50', border: 'border-green-200', title: 'text-green-800', text: 'text-green-700' },
      warning: { icon: 'alert-triangle', bg: 'bg-amber-50', border: 'border-amber-200', title: 'text-amber-800', text: 'text-amber-700' },
      error: { icon: 'alert-circle', bg: 'bg-red-50', border: 'border-red-200', title: 'text-red-800', text: 'text-red-700' },
    }[variant] || { icon: 'info', bg: 'bg-blue-50', border: 'border-blue-200', title: 'text-blue-800', text: 'text-blue-700' };

    return h('div', {
      className: cn('flex gap-3 rounded-lg border p-4', config.bg, config.border, props.className),
      role: 'alert',
    },
      h(Icon, { name: config.icon, size: 18, className: cn('shrink-0 mt-0.5', config.title) }),
      h('div', null,
        title ? h('p', { className: cn('text-sm font-medium', config.title) }, title) : null,
        children ? h('p', { className: cn('text-sm', title ? 'mt-1' : '', config.text) }, children) : null
      )
    );
  }

  // ── Separator ───────────────────────────────────────────────────────────────
  function Separator(props) {
    var orientation = props.orientation || 'horizontal';
    if (orientation === 'vertical') {
      return h('div', { className: cn('w-px bg-gray-200 self-stretch', props.className) });
    }
    return h('div', { className: cn('h-px w-full bg-gray-200', props.className) });
  }

  // ── Skeleton ────────────────────────────────────────────────────────────────
  function Skeleton(props) {
    return h('div', {
      className: cn('animate-pulse rounded-md bg-gray-200', props.className),
      style: props.style,
    });
  }

  // ── PageHeader ──────────────────────────────────────────────────────────────
  function PageHeader(props) {
    var title = props.title;
    var subtitle = props.subtitle;
    var actions = props.actions;
    var backAction = props.backAction;

    return h('div', { className: cn('flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between', props.className) },
      h('div', { className: 'flex items-center gap-3' },
        backAction ? h('button', {
          type: 'button',
          onClick: backAction,
          className: 'rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors',
        }, h(Icon, { name: 'arrow-left', size: 20 })) : null,
        h('div', null,
          h('h1', { className: 'text-2xl font-semibold tracking-tight text-gray-900' }, title),
          subtitle ? h('p', { className: 'mt-0.5 text-sm text-gray-500' }, subtitle) : null
        )
      ),
      actions ? h('div', { className: 'flex items-center gap-3 mt-3 sm:mt-0' }, actions) : null
    );
  }

  // ── SectionHeader ───────────────────────────────────────────────────────────
  function SectionHeader(props) {
    return h('div', { className: cn('flex items-center justify-between', props.className) },
      h('div', null,
        h('h2', { className: 'text-lg font-semibold text-gray-900' }, props.title),
        props.subtitle ? h('p', { className: 'mt-0.5 text-sm text-gray-500' }, props.subtitle) : null
      ),
      props.actions ? h('div', { className: 'flex items-center gap-2' }, props.actions) : null
    );
  }

  // ── DataTable ───────────────────────────────────────────────────────────────
  function DataTable(props) {
    var columns = props.columns || []; // [{key, label, render?, className?}]
    var data = props.data || [];
    var onRowClick = props.onRowClick;
    var emptyMessage = props.emptyMessage || 'No data';
    var emptyIcon = props.emptyIcon || 'inbox';

    if (data.length === 0) {
      return h(EmptyState, { icon: emptyIcon, title: emptyMessage });
    }

    return h('div', { className: cn('overflow-x-auto rounded-xl border border-gray-200', props.className) },
      h('table', { className: 'w-full text-sm' },
        h('thead', null,
          h('tr', { className: 'border-b border-gray-200 bg-gray-50' },
            columns.map(function(col) {
              return h('th', {
                key: col.key,
                className: cn('px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500', col.className),
              }, col.label);
            })
          )
        ),
        h('tbody', null,
          data.map(function(row, i) {
            return h('tr', {
              key: row.id || i,
              className: cn('border-b border-gray-100 last:border-0', onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''),
              onClick: onRowClick ? function() { onRowClick(row); } : undefined,
            },
              columns.map(function(col) {
                var val = col.render ? col.render(row[col.key], row) : row[col.key];
                return h('td', {
                  key: col.key,
                  className: cn('px-4 py-3 text-gray-900', col.className),
                }, val != null ? val : '—');
              })
            );
          })
        )
      )
    );
  }

  // ── Sidebar ─────────────────────────────────────────────────────────────────
  function Sidebar(props) {
    var items = props.items || []; // [{key, label, icon?}]
    var active = props.active;
    var onChange = props.onChange;
    var header = props.header; // React element for logo/title
    var footer = props.footer;

    return h('div', { className: cn('flex h-full w-56 flex-col border-r border-gray-200 bg-white', props.className) },
      header ? h('div', { className: 'p-4 border-b border-gray-200' }, header) : null,
      h('nav', { className: 'flex-1 overflow-y-auto p-3 space-y-1' },
        items.map(function(item) {
          var isActive = item.key === active;
          return h('button', {
            key: item.key,
            type: 'button',
            onClick: function() { if (onChange) onChange(item.key); },
            className: cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            ),
            style: isActive ? { backgroundColor: pc(50), color: pc(700) } : {},
          },
            item.icon ? h(Icon, { name: item.icon, size: 18 }) : null,
            item.label,
            item.badge ? h('span', { className: 'ml-auto text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5' }, item.badge) : null
          );
        })
      ),
      footer ? h('div', { className: 'p-3 border-t border-gray-200' }, footer) : null
    );
  }

  // ── AppShell ────────────────────────────────────────────────────────────────
  function AppShell(props) {
    var sidebar = props.sidebar; // Sidebar element
    var topbar = props.topbar;  // Top bar element
    var children = props.children;

    // Sidebar layout
    if (sidebar) {
      return h('div', { className: cn('flex h-screen bg-gray-50', props.className) },
        sidebar,
        h('div', { className: 'flex flex-1 flex-col overflow-hidden' },
          topbar || null,
          h('main', { className: 'flex-1 overflow-y-auto p-6' }, children)
        )
      );
    }

    // Top bar only layout
    if (topbar) {
      return h('div', { className: cn('flex h-screen flex-col bg-gray-50', props.className) },
        topbar,
        h('main', { className: 'flex-1 overflow-y-auto p-6' }, children)
      );
    }

    // Simple layout
    return h('div', { className: cn('min-h-screen bg-gray-50', props.className) },
      h('main', { className: 'mx-auto max-w-6xl px-6 py-8' }, children)
    );
  }

  // ── TopBar ──────────────────────────────────────────────────────────────────
  function TopBar(props) {
    var title = props.title;
    var logo = props.logo;
    var actions = props.actions;
    var children = props.children; // for custom content

    return h('header', {
      className: cn('flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6', props.className),
    },
      h('div', { className: 'flex items-center gap-3' },
        logo || null,
        title ? h('span', { className: 'text-base font-semibold text-gray-900' }, title) : null,
        children || null
      ),
      actions ? h('div', { className: 'flex items-center gap-2' }, actions) : null
    );
  }

  // ── FilterBar ───────────────────────────────────────────────────────────────
  function FilterBar(props) {
    var children = props.children; // Filter elements
    var searchValue = props.searchValue;
    var onSearchChange = props.onSearchChange;
    var searchPlaceholder = props.searchPlaceholder || 'Search...';

    return h('div', { className: cn('flex flex-col gap-3 sm:flex-row sm:items-center', props.className) },
      onSearchChange ? h('div', { className: 'relative flex-1 max-w-xs' },
        h('div', { className: 'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3' },
          h(Icon, { name: 'search', size: 16, className: 'text-gray-400' })
        ),
        h('input', {
          type: 'text',
          value: searchValue || '',
          onChange: onSearchChange,
          placeholder: searchPlaceholder,
          className: 'w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1',
          style: { '--tw-ring-color': pc(500) },
          onFocus: function(e) { e.target.style.borderColor = pc(500); },
          onBlur: function(e) { e.target.style.borderColor = ''; },
        })
      ) : null,
      children
    );
  }

  // ── ConfirmDialog ───────────────────────────────────────────────────────────
  function ConfirmDialog(props) {
    var open = props.open;
    var onClose = props.onClose;
    var onConfirm = props.onConfirm;
    var title = props.title || 'Are you sure?';
    var description = props.description;
    var confirmLabel = props.confirmLabel || 'Confirm';
    var cancelLabel = props.cancelLabel || 'Cancel';
    var variant = props.variant || 'danger'; // 'danger' | 'primary'
    var loading = props.loading;

    return h(Dialog, { open: open, onClose: onClose, title: title, description: description, size: 'sm' },
      h(DialogFooter, null,
        h(Button, { variant: 'secondary', onClick: onClose }, cancelLabel),
        h(Button, { variant: variant, onClick: onConfirm, loading: loading }, confirmLabel)
      )
    );
  }

  // ── Toast (imperative) ──────────────────────────────────────────────────────
  var _toastContainer = null;
  var _toasts = [];
  var _toastCounter = 0;

  function renderToasts() {
    if (!_toastContainer) {
      _toastContainer = document.createElement('div');
      _toastContainer.className = 'fixed bottom-4 right-4 z-[9999] flex flex-col gap-2';
      document.body.appendChild(_toastContainer);
    }
    // Simple render via innerHTML
    _toastContainer.innerHTML = _toasts.map(function(t) {
      var bgClass = { success: 'bg-green-600', error: 'bg-red-600', warning: 'bg-amber-600', info: 'bg-gray-800' }[t.variant] || 'bg-gray-800';
      return '<div class="' + bgClass + ' text-white text-sm px-4 py-2.5 rounded-lg shadow-lg max-w-xs animate-fade-in">' + t.message + '</div>';
    }).join('');
  }

  function toast(message, variant) {
    var id = ++_toastCounter;
    _toasts.push({ id: id, message: message, variant: variant || 'success' });
    renderToasts();
    setTimeout(function() {
      _toasts = _toasts.filter(function(t) { return t.id !== id; });
      renderToasts();
    }, 3000);
  }

  // ── Tooltip (simple CSS-based) ──────────────────────────────────────────────
  function Tooltip(props) {
    var content = props.content;
    var children = props.children;
    if (!content) return children;

    return h('div', { className: 'group relative inline-flex' },
      children,
      h('div', {
        className: 'pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50',
      },
        h('div', { className: 'rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white whitespace-nowrap shadow-lg' }, content)
      )
    );
  }

  // ── ScrollArea (simple styled wrapper) ──────────────────────────────────────
  function ScrollArea(props) {
    return h('div', {
      className: cn('overflow-y-auto', props.className),
      style: Object.assign({ maxHeight: props.maxHeight || '100%' }, props.style || {}),
    }, props.children);
  }

  // ── Progress ────────────────────────────────────────────────────────────────
  function Progress(props) {
    var value = Math.min(100, Math.max(0, props.value || 0));
    return h('div', { className: cn('h-2 w-full overflow-hidden rounded-full bg-gray-200', props.className) },
      h('div', {
        className: 'h-full rounded-full transition-all duration-300',
        style: { width: value + '%', backgroundColor: pc(600) },
      })
    );
  }

  // ── KPIGrid ─────────────────────────────────────────────────────────────────
  function KPIGrid(props) {
    var items = props.items || []; // [{title, value, change?, trend?, icon?}]
    return h('div', {
      className: cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-' + Math.min(items.length, 4) + ' gap-4', props.className),
    },
      items.map(function(item, i) {
        return h(StatCard, Object.assign({ key: i }, item));
      })
    );
  }

  // ── FormSection ─────────────────────────────────────────────────────────────
  function FormSection(props) {
    var title = props.title;
    var description = props.description;
    var children = props.children;

    return h('div', { className: cn('', props.className) },
      (title || description) ? h('div', { className: 'mb-4' },
        title ? h('h3', { className: 'text-base font-medium text-gray-900' }, title) : null,
        description ? h('p', { className: 'mt-1 text-sm text-gray-500' }, description) : null
      ) : null,
      h('div', { className: 'space-y-4' }, children)
    );
  }

  // ── SettingsSection ─────────────────────────────────────────────────────────
  function SettingsSection(props) {
    return h('div', { className: cn('rounded-xl border border-gray-200 bg-white', props.className) },
      h('div', { className: 'border-b border-gray-200 px-6 py-4' },
        h('h3', { className: 'text-base font-medium text-gray-900' }, props.title),
        props.description ? h('p', { className: 'mt-1 text-sm text-gray-500' }, props.description) : null
      ),
      h('div', { className: 'px-6 py-4 space-y-4' }, props.children),
      props.footer ? h('div', { className: 'flex items-center justify-end border-t border-gray-200 px-6 py-3 bg-gray-50 rounded-b-xl' }, props.footer) : null
    );
  }

  // ── Inject animation keyframes ──────────────────────────────────────────────
  var animStyle = document.createElement('style');
  animStyle.textContent = [
    '@keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }',
    '.animate-fade-in { animation: fade-in 0.2s ease-out; }',
  ].join('\\n');
  document.head.appendChild(animStyle);

  // ── Export to window.__UI__ ─────────────────────────────────────────────────
  window.__UI__ = {
    // Theme
    setupTheme: setupTheme,
    cn: cn,

    // Icons
    Icon: Icon,

    // Layout
    AppShell: AppShell,
    TopBar: TopBar,
    Sidebar: Sidebar,
    PageHeader: PageHeader,
    SectionHeader: SectionHeader,
    FilterBar: FilterBar,
    ScrollArea: ScrollArea,

    // Data Display
    Card: Card,
    CardHeader: CardHeader,
    CardTitle: CardTitle,
    CardDescription: CardDescription,
    CardContent: CardContent,
    CardFooter: CardFooter,
    Badge: Badge,
    Avatar: Avatar,
    StatCard: StatCard,
    KPIGrid: KPIGrid,
    DataTable: DataTable,
    Progress: Progress,
    Skeleton: Skeleton,
    Separator: Separator,

    // Forms
    Button: Button,
    Input: Input,
    Textarea: Textarea,
    Select: Select,
    Switch: Switch,

    // Feedback
    Alert: Alert,
    Dialog: Dialog,
    DialogFooter: DialogFooter,
    ConfirmDialog: ConfirmDialog,
    EmptyState: EmptyState,
    LoadingState: LoadingState,
    Tooltip: Tooltip,
    toast: toast,

    // Patterns
    FormSection: FormSection,
    SettingsSection: SettingsSection,
  };
})();
`;
