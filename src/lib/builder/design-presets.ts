// Curated design presets that map to coherent visual identities.
// The planner outputs app_type + design_theme → selectPreset() picks the best match.
// The preset's tokens + rules get injected into the generation prompt.

import { DesignTokens, formatTokensForPrompt } from './design-tokens';

export interface DesignPreset {
  id: string;
  name: string;
  description: string;
  tokens: DesignTokens;
  // Which app_type values this preset fits best
  appTypes: string[];
  // Which design_theme values map to this preset
  designThemes: string[];
  // Extra prompt rules specific to this preset
  rules: string[];
}

// ── Linear Minimal ──────────────────────────────────────────────────────────
// Ultra-clean, monochrome, tight spacing. Productivity/tools/dashboards.
const LINEAR_MINIMAL: DesignPreset = {
  id: 'linear-minimal',
  name: 'Linear Minimal',
  description: 'Ultra-clean monochrome interface with tight spacing',
  appTypes: ['standard'],
  designThemes: ['minimal'],
  tokens: {
    spacing: {
      page: 'px-6 py-8',
      section: 'mt-6',
      card: 'p-4',
      grid: 'gap-3',
      stack: 'space-y-3',
    },
    typography: {
      pageTitle: 'text-2xl font-semibold tracking-tight text-gray-900',
      sectionTitle: 'text-sm font-medium uppercase tracking-wide text-gray-500',
      cardTitle: 'text-sm font-medium text-gray-900',
      body: 'text-sm text-gray-600',
      label: 'text-xs text-gray-400',
    },
    colors: {
      background: 'bg-white',
      surface: 'bg-white',
      surfaceAlt: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      textMuted: 'text-gray-400',
    },
    radius: {
      card: 'rounded-lg',
      button: 'rounded-md',
      input: 'rounded-md',
      badge: 'rounded-full',
    },
    shadows: {
      card: 'shadow-none',
      cardHover: 'shadow-sm',
      elevated: 'shadow-lg',
    },
    borders: {
      card: 'border border-gray-200',
      input: 'border border-gray-200',
      divider: 'border-gray-100',
    },
  },
  rules: [
    'Minimal chrome. Borders define structure, not shadows.',
    'Section headers use uppercase tracking-wide text-xs — not large bold text.',
    'Sidebar uses border-r, not shadow. Navigation items are compact (py-1.5 px-3).',
    'Tables are the primary display format. Use DataTable over card grids when showing structured data.',
    'Icons are monochrome gray-400, only primary color on active/selected states.',
    'No decorative elements. No hero sections. Content density is high.',
    'Hover states are subtle: bg-gray-50 or bg-gray-100.',
  ],
};

// ── Stripe Professional ─────────────────────────────────────────────────────
// Business-grade, lots of whitespace, sophisticated card system.
const STRIPE_PROFESSIONAL: DesignPreset = {
  id: 'stripe-professional',
  name: 'Stripe Professional',
  description: 'Business-grade interface with generous whitespace',
  appTypes: ['standard'],
  designThemes: ['light'],
  tokens: {
    spacing: {
      page: 'px-6 py-12',
      section: 'mt-8',
      card: 'p-6',
      grid: 'gap-4',
      stack: 'space-y-4',
    },
    typography: {
      pageTitle: 'text-3xl font-semibold tracking-tight text-gray-900',
      sectionTitle: 'text-xl font-semibold text-gray-900',
      cardTitle: 'text-base font-medium text-gray-900',
      body: 'text-sm text-gray-600',
      label: 'text-xs text-gray-500',
    },
    colors: {
      background: 'bg-gray-50',
      surface: 'bg-white',
      surfaceAlt: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      textMuted: 'text-gray-500',
    },
    radius: {
      card: 'rounded-xl',
      button: 'rounded-lg',
      input: 'rounded-lg',
      badge: 'rounded-full',
    },
    shadows: {
      card: 'shadow-sm',
      cardHover: 'shadow-md',
      elevated: 'shadow-xl',
    },
    borders: {
      card: 'border border-gray-200',
      input: 'border border-gray-300',
      divider: 'border-gray-200',
    },
  },
  rules: [
    'Page background is bg-gray-50, cards float on bg-white with shadow-sm + border.',
    'Generous whitespace. Sections separated by mt-8 minimum.',
    'KPI cards at the top of dashboards. Charts inside Cards with proper padding.',
    'Form inputs have visible labels above them. Group related fields in FormSection.',
    'Primary buttons have a subtle shadow: shadow-sm on hover.',
    'DataTable rows have hover:bg-gray-50 for scanability.',
    'Professional tone: no playful icons, no casual language in UI labels.',
  ],
};

// ── Apple Clean ─────────────────────────────────────────────────────────────
// SF-inspired, generous rounding, white space. Consumer/personal/health apps.
const APPLE_CLEAN: DesignPreset = {
  id: 'apple-clean',
  name: 'Apple Clean',
  description: 'Consumer-friendly design with generous rounding and space',
  appTypes: ['standard'],
  designThemes: ['light', 'colorful'],
  tokens: {
    spacing: {
      page: 'px-6 py-10',
      section: 'mt-8',
      card: 'p-5',
      grid: 'gap-4',
      stack: 'space-y-4',
    },
    typography: {
      pageTitle: 'text-3xl font-semibold tracking-tight text-gray-900',
      sectionTitle: 'text-lg font-semibold text-gray-900',
      cardTitle: 'text-base font-medium text-gray-900',
      body: 'text-sm text-gray-500',
      label: 'text-xs text-gray-400',
    },
    colors: {
      background: 'bg-white',
      surface: 'bg-white',
      surfaceAlt: 'bg-gray-50/80',
      border: 'border-gray-200/60',
      text: 'text-gray-900',
      textSecondary: 'text-gray-500',
      textMuted: 'text-gray-400',
    },
    radius: {
      card: 'rounded-2xl',
      button: 'rounded-xl',
      input: 'rounded-xl',
      badge: 'rounded-full',
    },
    shadows: {
      card: 'shadow-sm',
      cardHover: 'shadow-md',
      elevated: 'shadow-2xl',
    },
    borders: {
      card: 'border border-gray-200/60',
      input: 'border border-gray-200',
      divider: 'border-gray-100',
    },
  },
  rules: [
    'Rounded-2xl on cards gives the iOS/Apple feel. Buttons are rounded-xl.',
    'White background with very subtle gray-50 alternate sections.',
    'Borders are semi-transparent (border-gray-200/60) for softness.',
    'Use Avatar components liberally for personal/social features.',
    'Stat cards should feel like iOS widgets: rounded-2xl, p-5, clean type.',
    'Primary color used sparingly — mostly on buttons and active states.',
    'Transitions on everything interactive: transition-all duration-200.',
  ],
};

// ── Notion Soft ─────────────────────────────────────────────────────────────
// Warm, slightly rounded, good for content/notes/wiki apps.
const NOTION_SOFT: DesignPreset = {
  id: 'notion-soft',
  name: 'Notion Soft',
  description: 'Warm and readable for content-heavy apps',
  appTypes: ['standard'],
  designThemes: ['light', 'minimal'],
  tokens: {
    spacing: {
      page: 'px-6 py-8',
      section: 'mt-6',
      card: 'p-4',
      grid: 'gap-3',
      stack: 'space-y-3',
    },
    typography: {
      pageTitle: 'text-2xl font-semibold text-gray-800',
      sectionTitle: 'text-lg font-medium text-gray-800',
      cardTitle: 'text-base font-medium text-gray-800',
      body: 'text-sm text-gray-600 leading-relaxed',
      label: 'text-xs text-gray-400',
    },
    colors: {
      background: 'bg-white',
      surface: 'bg-white',
      surfaceAlt: 'bg-stone-50',
      border: 'border-gray-200',
      text: 'text-gray-800',
      textSecondary: 'text-gray-600',
      textMuted: 'text-gray-400',
    },
    radius: {
      card: 'rounded-lg',
      button: 'rounded-md',
      input: 'rounded-md',
      badge: 'rounded-md',
    },
    shadows: {
      card: 'shadow-none',
      cardHover: 'shadow-sm',
      elevated: 'shadow-lg',
    },
    borders: {
      card: 'border border-gray-200',
      input: 'border border-gray-200',
      divider: 'border-gray-100',
    },
  },
  rules: [
    'Content-first design. Body text uses leading-relaxed for readability.',
    'Badges use rounded-md (not rounded-full) for a softer, Notion-like feel.',
    'Hover states use bg-stone-50 or bg-gray-50 — warm undertone.',
    'Sidebar items are tall and spacious (py-2 px-3) for a content-app feel.',
    'No aggressive shadows. Structure comes from borders and whitespace.',
    'Prefer card layouts for content blocks. Each card is a self-contained unit.',
    'Inline editing patterns encouraged: click to edit, blur to save.',
  ],
};

// ── Gaming Neon ─────────────────────────────────────────────────────────────
// Dark mode, vibrant accents. Games/entertainment.
const GAMING_NEON: DesignPreset = {
  id: 'gaming-neon',
  name: 'Gaming Neon',
  description: 'Dark interface with vibrant accents for games',
  appTypes: ['game', 'interactive'],
  designThemes: ['dark'],
  tokens: {
    spacing: {
      page: 'px-4 py-6',
      section: 'mt-6',
      card: 'p-4',
      grid: 'gap-3',
      stack: 'space-y-3',
    },
    typography: {
      pageTitle: 'text-3xl font-semibold tracking-tight text-white',
      sectionTitle: 'text-lg font-semibold text-gray-200',
      cardTitle: 'text-base font-medium text-white',
      body: 'text-sm text-gray-400',
      label: 'text-xs text-gray-500',
    },
    colors: {
      background: 'bg-gray-900',
      surface: 'bg-gray-800',
      surfaceAlt: 'bg-gray-800/50',
      border: 'border-gray-700',
      text: 'text-white',
      textSecondary: 'text-gray-400',
      textMuted: 'text-gray-500',
    },
    radius: {
      card: 'rounded-xl',
      button: 'rounded-lg',
      input: 'rounded-lg',
      badge: 'rounded-full',
    },
    shadows: {
      card: 'shadow-none',
      cardHover: 'shadow-lg',
      elevated: 'shadow-2xl',
    },
    borders: {
      card: 'border border-gray-700',
      input: 'border border-gray-600',
      divider: 'border-gray-700',
    },
  },
  rules: [
    'Dark backgrounds (gray-900 page, gray-800 cards). NEVER use white backgrounds.',
    'Primary color is vibrant: use shades 400-500 for accents, not muted shades.',
    'Game HUD uses absolute positioning with semi-transparent backgrounds (bg-black/40).',
    'Menu screens are centered with large title text and prominent Play button.',
    'Score/health displays use Badge components with size="lg".',
    'Buttons on dark backgrounds: primary variant stays colorful, ghost uses text-white hover:bg-white/10.',
    'Canvas games: dark border (border-gray-700), rounded-xl. Full-width on mobile.',
  ],
};

// ── Marketplace Modern ──────────────────────────────────────────────────────
// Image-heavy, card grids. E-commerce/marketplace/catalog.
const MARKETPLACE_MODERN: DesignPreset = {
  id: 'marketplace-modern',
  name: 'Marketplace Modern',
  description: 'Image-forward card grids for commerce and catalogs',
  appTypes: ['standard'],
  designThemes: ['light', 'colorful'],
  tokens: {
    spacing: {
      page: 'px-6 py-8',
      section: 'mt-6',
      card: 'p-0',
      grid: 'gap-4',
      stack: 'space-y-4',
    },
    typography: {
      pageTitle: 'text-2xl font-semibold tracking-tight text-gray-900',
      sectionTitle: 'text-lg font-semibold text-gray-900',
      cardTitle: 'text-base font-medium text-gray-900',
      body: 'text-sm text-gray-600',
      label: 'text-xs text-gray-500',
    },
    colors: {
      background: 'bg-gray-50',
      surface: 'bg-white',
      surfaceAlt: 'bg-white',
      border: 'border-gray-200',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      textMuted: 'text-gray-500',
    },
    radius: {
      card: 'rounded-xl',
      button: 'rounded-lg',
      input: 'rounded-lg',
      badge: 'rounded-full',
    },
    shadows: {
      card: 'shadow-sm',
      cardHover: 'shadow-lg',
      elevated: 'shadow-xl',
    },
    borders: {
      card: 'border border-gray-100',
      input: 'border border-gray-300',
      divider: 'border-gray-200',
    },
  },
  rules: [
    'Card padding is p-0 because images go edge-to-edge at the top (rounded-t-xl on img).',
    'Card content area uses px-4 pb-4 pt-3 for text below images.',
    'Image aspect ratios: h-48 object-cover for product cards, h-64 for featured.',
    'Price display: text-lg font-semibold for main price, text-sm text-gray-400 line-through for original.',
    'Category badges positioned over images: absolute top-3 left-3.',
    'FilterBar at the top with category pills and sort dropdown.',
    'Card hover effect is prominent: hover:shadow-lg transition-shadow.',
    'Grid uses sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 for dense product layouts.',
  ],
};

// ── All presets ──────────────────────────────────────────────────────────────

export const PRESETS: Record<string, DesignPreset> = {
  'linear-minimal': LINEAR_MINIMAL,
  'stripe-professional': STRIPE_PROFESSIONAL,
  'apple-clean': APPLE_CLEAN,
  'notion-soft': NOTION_SOFT,
  'gaming-neon': GAMING_NEON,
  'marketplace-modern': MARKETPLACE_MODERN,
};

// Pattern-to-preset mapping. Maps the pattern names from patterns.ts to the
// best preset. Falls back to stripe-professional for unmatched patterns.
const PATTERN_PRESET_MAP: Record<string, string> = {
  'saas dashboard': 'stripe-professional',
  'crm / list-detail': 'stripe-professional',
  'project manager / kanban': 'linear-minimal',
  'e-commerce / store': 'marketplace-modern',
  'business landing page': 'apple-clean',
  'social feed / community': 'apple-clean',
  'content / blog': 'notion-soft',
  'settings / account': 'stripe-professional',
  'onboarding / wizard': 'apple-clean',
  'marketplace / catalog': 'marketplace-modern',
  'pricing / checkout': 'stripe-professional',
  'portfolio / creator page': 'apple-clean',
  'internal tool / crud': 'linear-minimal',
  'game / interactive': 'gaming-neon',
  'mobile feed': 'apple-clean',
};

// Select the best preset based on app type and design theme from the planner.
export function selectPreset(appType: string, designTheme: string): DesignPreset {
  // Game/interactive apps always get the gaming preset
  if (appType === 'game' || appType === 'interactive') {
    return GAMING_NEON;
  }

  // Dark theme gets gaming neon
  if (designTheme === 'dark') {
    return GAMING_NEON;
  }

  // Minimal theme → Linear
  if (designTheme === 'minimal') {
    return LINEAR_MINIMAL;
  }

  // Colorful → Apple Clean (friendly, consumer-oriented)
  if (designTheme === 'colorful') {
    return APPLE_CLEAN;
  }

  // Light theme (default) → Stripe Professional
  return STRIPE_PROFESSIONAL;
}

// Select preset by pattern name (from the PATTERNS prompt section).
export function selectPresetByPattern(patternName: string): DesignPreset {
  const key = patternName.toLowerCase();
  for (const [pattern, presetId] of Object.entries(PATTERN_PRESET_MAP)) {
    if (key.includes(pattern) || pattern.includes(key)) {
      return PRESETS[presetId];
    }
  }
  return STRIPE_PROFESSIONAL;
}

// Format a preset into a prompt section for the AI.
export function formatPresetForPrompt(preset: DesignPreset): string {
  const tokenSection = formatTokensForPrompt(preset.tokens, preset.name);
  const rulesSection = preset.rules.map((r, i) => `${i + 1}. ${r}`).join('\n');

  return `${tokenSection}

### PRESET RULES — ${preset.name.toUpperCase()}
${rulesSection}

CRITICAL: Follow the token values and preset rules above. Do NOT mix values from different presets or invent arbitrary spacing/colors/radii.`;
}
