// Composes the system prompt for the code generator from topical sections.
//
// Ordering principle: stable sections first (cacheable by Anthropic prompt caching),
// then conditional add-ons in fixed order, then dynamic per-request context last.
// Anthropic caches the longest matching prefix of system prompts ≥ 1024 tokens, so
// putting variable content (current code, plan, element selection) at the END
// maximizes cache hits across iterations on the same template.

import { CORE } from './core';
import { OUTPUT_FORMAT } from './output-format';
import { TECHNICAL_CONTRACT } from './technical-contract';
import { COMPONENTS } from './components';
import { EDITABLE_IDS } from './editable-ids';
import { QUALITY_PATTERNS } from './quality-patterns';
import { DESIGN } from './design';
import { LAYOUTS } from './layouts';
import { PATTERNS } from './patterns';
import { FILE_UPLOAD } from './file-upload';
import { SEED_DATA } from './seed-data';
import { RESPONSE_RULES } from './response-rules';
import { FOLLOW_UP } from './follow-up';
import { GAMES } from './games';
import { AUTH } from './auth';
import { BUSINESS_DESIGN } from './business-design';
import { BUG_FIX } from './bug-fix';
import type { AppPlan } from '../planner';
import { selectPreset, formatPresetForPrompt, PRESETS } from '../design-presets';

export interface ComposeOptions {
  plan?: AppPlan | null;
  isBugFix?: boolean;
  currentCode?: { page_code?: string; admin_code?: string; api_handler_code?: string } | null;
  elementContext?: { editId?: string; tag?: string; text?: string } | null;
  planContext?: string;
  presetId?: string;
}

// ALWAYS included — core rules the model needs for every call (first gen + follow-ups).
// QUALITY_PATTERNS is in here because follow-ups need the quality bar just as much.
const ALWAYS_PREFIX = [
  CORE,
  OUTPUT_FORMAT,
  TECHNICAL_CONTRACT,
  COMPONENTS,
  EDITABLE_IDS,
  QUALITY_PATTERNS,
  DESIGN,
  RESPONSE_RULES,
].join('\n\n');

// Only included on FIRST GENERATION — full reference material for building new apps.
const FIRST_GEN_ONLY = [
  LAYOUTS,
  PATTERNS,
  FILE_UPLOAD,
  SEED_DATA,
].join('\n\n');

// Only included on FOLLOW-UPS — layout reference + seed data pattern + extension rules.
// Follow-ups need LAYOUTS so the model maintains the existing navigation and design
// when adding new views. SEED_DATA is needed when adding features with new data.
// FOLLOW_UP teaches the model how to extend without breaking.
const FOLLOW_UP_SECTIONS = [
  LAYOUTS,
  SEED_DATA,
  FOLLOW_UP,
].join('\n\n');

export interface ComposedPrompt {
  /** Stable + conditional sections — cacheable across requests. */
  stable: string;
  /** Dynamic per-request context (plan, current code, element). Changes every call. */
  dynamic: string;
  /** Combined string for backward compat. */
  full: string;
}

export function composePrompt(opts: ComposeOptions = {}): ComposedPrompt {
  const { plan, isBugFix, currentCode, elementContext, planContext, presetId } = opts;
  const planAny = plan as unknown as Record<string, unknown> | undefined;
  const appType = (planAny?.app_type as string | undefined) ?? 'standard';
  const designTheme = (planAny?.design_theme as string | undefined) ?? 'light';

  // Determine if this is a first generation or a follow-up edit.
  const isFollowUp = !!currentCode?.page_code;

  // Stable sections — same across requests with the same flags. Cacheable.
  const stableSections: string[] = isFollowUp
    ? [ALWAYS_PREFIX, FOLLOW_UP_SECTIONS]
    : [ALWAYS_PREFIX, FIRST_GEN_ONLY];

  // Conditional sections — only included when the planner indicates they're needed.
  // Order is fixed (games → auth → business → bug-fix → preset) so that requests
  // with the same flag combination produce identical prompts and benefit from
  // prompt caching.
  if (appType === 'game') stableSections.push(GAMES);
  if (plan?.needs_auth) stableSections.push(AUTH);
  if (plan?.needs_research) stableSections.push(BUSINESS_DESIGN);
  if (isBugFix) stableSections.push(BUG_FIX);

  // Design preset — selected from app_type + design_theme (or explicit presetId).
  if (plan) {
    const preset = presetId
      ? (PRESETS[presetId] ?? selectPreset(appType, designTheme))
      : selectPreset(appType, designTheme);
    stableSections.push(formatPresetForPrompt(preset));
  }

  const stable = stableSections.join('\n\n');

  // Dynamic per-request context — changes every call. NOT cached.
  const dynamicSections: string[] = [];
  if (planContext) dynamicSections.push(planContext);

  // For follow-ups, prepend a structured summary of the current app so the model
  // understands the architecture before seeing the raw code.
  if (isFollowUp && currentCode?.page_code) {
    dynamicSections.push(analyzeCurrentCode(currentCode.page_code));
  }

  if (currentCode?.page_code) dynamicSections.push(formatCurrentCode(currentCode));
  if (elementContext?.editId) dynamicSections.push(formatElementContext(elementContext));

  const dynamic = dynamicSections.join('\n\n');
  const full = dynamic ? `${stable}\n\n${dynamic}` : stable;

  return { stable, dynamic, full };
}

/**
 * Auto-detect the architecture of the current app from the source code.
 * This gives the model structured context so it understands the app's
 * views, data collections, navigation, and theme before making changes.
 */
function analyzeCurrentCode(pageCode: string): string {
  const lines: string[] = ['## APP CONTEXT (auto-detected from current code)'];

  // Extract views from conditional rendering patterns
  const viewPatterns = [
    ...pageCode.matchAll(/\{(?:view|tab|screen|section|activeView|activeTab|page|currentView)\s*===\s*['"]([^'"]+)['"]/g),
  ];
  if (viewPatterns.length > 0) {
    const views = [...new Set(viewPatterns.map(m => m[1]))];
    lines.push(`- Views/tabs: ${views.join(', ')} (${views.length} total)`);
  }

  // Extract data collections from useTenantData calls
  const collections = [...pageCode.matchAll(/useTenantData<(\w+)>\(['"]([^'"]+)['"]\)/g)];
  if (collections.length > 0) {
    const items = [...new Set(collections.map(m => `${m[2]} (${m[1]})`))];
    lines.push(`- Data collections: ${items.join(', ')}`);
  }

  // Detect primary color from setupTheme
  const themeMatch = pageCode.match(/setupTheme\(\{\s*primaryColor:\s*['"](\w+)['"]/);
  if (themeMatch) {
    lines.push(`- Primary color: ${themeMatch[1]}`);
  }

  // Detect auth usage
  if (pageCode.includes('useTenantAuth')) {
    lines.push('- Authentication: YES (useTenantAuth)');
  }

  // Detect navigation pattern
  if (pageCode.includes('AppShell') && pageCode.includes('Sidebar')) {
    lines.push('- Navigation: Sidebar (AppShell + Sidebar component)');
  } else if (/fixed\s+bottom|bottom-0/.test(pageCode) && /nav|tab/i.test(pageCode)) {
    lines.push('- Navigation: Bottom tab bar (mobile-first)');
  } else if (/<header|<nav/.test(pageCode)) {
    lines.push('- Navigation: Top nav bar');
  }

  // Detect seed data
  if (/SEED_DATA|seed_data|seedData/.test(pageCode)) {
    lines.push('- Seed data: YES (app has sample content)');
  }

  // Line count
  const lineCount = pageCode.split('\n').length;
  lines.push(`- Code size: ~${lineCount} lines`);

  lines.push('');
  lines.push('When extending this app, maintain the navigation pattern, reuse existing collections where possible, and match the design style.');

  return lines.join('\n');
}

function formatCurrentCode(code: { page_code?: string; admin_code?: string; api_handler_code?: string }): string {
  const parts = ['## CURRENT CODE (modify this based on the user\'s request)', '', '### page_code:', '```tsx', code.page_code || '', '```'];
  if (code.admin_code) {
    parts.push('', '### admin_code:', '```tsx', code.admin_code, '```');
  }
  if (code.api_handler_code) {
    parts.push('', '### api_handler_code:', '```tsx', code.api_handler_code, '```');
  }
  return parts.join('\n');
}

function formatElementContext(ctx: { editId?: string; tag?: string; text?: string }): string {
  const safeEditId = String(ctx.editId || '').slice(0, 100);
  const safeTag = String(ctx.tag || 'element').slice(0, 30);
  const safeText = String(ctx.text || '').slice(0, 200);
  return `## TARGETED ELEMENT EDIT
The user has selected a specific element in the preview. They want to modify ONLY this element:
- data-edit-id: "${safeEditId}"
- tag: <${safeTag}>
- current text: "${safeText}"

CRITICAL: Locate the element with data-edit-id="${safeEditId}" in the current page_code and apply the user's request to ONLY that element. Do NOT regenerate or restructure other parts of the page. Return the FULL updated page_code with only the targeted change applied. Preserve all existing data-edit-id attributes.`;
}
