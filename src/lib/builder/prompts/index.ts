// Composes the system prompt for the code generator from topical sections.
//
// Ordering principle: stable sections first (cacheable by OpenAI prompt caching),
// then conditional add-ons in fixed order, then dynamic per-request context last.
// OpenAI caches the longest matching prefix of system prompts ≥ 1024 tokens, so
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
import { GAMES } from './games';
import { AUTH } from './auth';
import { BUSINESS_DESIGN } from './business-design';
import { BUG_FIX } from './bug-fix';
import type { AppPlan } from '../planner';

export interface ComposeOptions {
  plan?: AppPlan | null;
  isBugFix?: boolean;
  currentCode?: { page_code?: string; admin_code?: string; api_handler_code?: string } | null;
  elementContext?: { editId?: string; tag?: string; text?: string } | null;
  planContext?: string;
}

// Stable prefix that does not depend on the current request.
// This is what OpenAI's prompt cache will match against.
// Order: core rules → output format → technical contract → UI kit docs →
// design lock → layout/pattern guides → file upload → seed data → response rules
const STABLE_PREFIX = [
  CORE,
  OUTPUT_FORMAT,
  TECHNICAL_CONTRACT,
  COMPONENTS,
  EDITABLE_IDS,
  QUALITY_PATTERNS,
  DESIGN,
  LAYOUTS,
  PATTERNS,
  FILE_UPLOAD,
  SEED_DATA,
  RESPONSE_RULES,
].join('\n\n');

export function composePrompt(opts: ComposeOptions = {}): string {
  const { plan, isBugFix, currentCode, elementContext, planContext } = opts;
  const planAny = plan as unknown as Record<string, unknown> | undefined;
  const appType = (planAny?.app_type as string | undefined) ?? 'standard';

  const sections: string[] = [STABLE_PREFIX];

  // Conditional sections — only included when the planner indicates they're needed.
  // Order is fixed (games → auth → business → bug-fix) so that requests with the
  // same flag combination produce identical prompts and benefit from prompt caching.
  if (appType === 'game') sections.push(GAMES);
  if (plan?.needs_auth) sections.push(AUTH);
  if (plan?.needs_research) sections.push(BUSINESS_DESIGN);
  if (isBugFix) sections.push(BUG_FIX);

  // Dynamic per-request context goes LAST so the prefix above can be cached.
  if (planContext) sections.push(planContext);
  if (currentCode?.page_code) sections.push(formatCurrentCode(currentCode));
  if (elementContext?.editId) sections.push(formatElementContext(elementContext));

  return sections.join('\n\n');
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
