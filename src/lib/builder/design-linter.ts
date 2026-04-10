// Post-generation design quality linter.
// Scans generated page_code for common design violations and produces
// actionable feedback the generator can use in a retry pass.
//
// This is NOT security validation (that's code-validator.ts). This checks
// for spacing inconsistencies, color misuse, missing components, etc.

export interface LintViolation {
  rule: string;
  severity: 'error' | 'warning';
  message: string;
  // Optional line hint (1-based) — not guaranteed to be exact
  line?: number;
}

export interface LintResult {
  violations: LintViolation[];
  score: number;          // 0-100, higher is better
  passesThreshold: boolean;
  feedback: string;       // Formatted feedback string for the AI retry prompt
}

// Minimum score to pass without retry. Tuned to catch obvious violations
// but not block every minor imperfection (which would waste API calls).
const PASS_THRESHOLD = 60;

type LintRule = (code: string, lines: string[]) => LintViolation[];

// ── Lint Rules ──────────────────────────────────────────────────────────────

const checkArbitrarySpacing: LintRule = (code) => {
  const violations: LintViolation[] = [];
  // Match p-[Npx], m-[Npx], gap-[Npx], etc. but allow common exceptions
  // like w-[280px] for kanban columns or max-w-[800px] for canvas
  const matches = code.matchAll(/(?:^|[\s"'])(?:p|m|gap|space)-(?:x|y|t|b|l|r|)?\[(\d+)px\]/g);
  for (const m of matches) {
    const px = parseInt(m[1]);
    // Allow common intentional values
    if ([280, 300, 320, 400, 600, 800].includes(px)) continue;
    violations.push({
      rule: 'arbitrary-spacing',
      severity: 'warning',
      message: `Arbitrary spacing value "${m[0].trim()}" — use Tailwind scale (p-1 through p-12) instead`,
    });
  }
  return violations;
};

const checkArbitraryTextSize: LintRule = (code) => {
  const violations: LintViolation[] = [];
  const matches = code.matchAll(/text-\[(\d+)px\]/g);
  for (const m of matches) {
    violations.push({
      rule: 'arbitrary-text-size',
      severity: 'warning',
      message: `Arbitrary text size "text-[${m[1]}px]" — use text-xs through text-4xl`,
    });
  }
  return violations;
};

const checkEmojiInUI: LintRule = (code) => {
  const violations: LintViolation[] = [];
  // Match emoji in JSX (not inside canvas fillText or string literals for data)
  // Look for emoji in className, in JSX text content, or in component props
  // Unicode emoji ranges — common ones used in UI
  const emojiPattern = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip canvas fillText lines — emoji is OK there
    if (line.includes('fillText') || line.includes('ctx.')) continue;
    // Skip string data (seed data, descriptions)
    if (line.match(/^\s*(name|title|description|label|content|bio|text|message):/)) continue;
    // Check for emoji in JSX headings, buttons, or component text
    if (emojiPattern.test(line) && (line.includes('<') || line.includes('className'))) {
      violations.push({
        rule: 'emoji-in-ui',
        severity: 'error',
        message: `Emoji found in UI (line ~${i + 1}) — use <Icon name="..." /> instead`,
        line: i + 1,
      });
    }
  }
  return violations;
};

const checkRawButton: LintRule = (code) => {
  const violations: LintViolation[] = [];
  // Detect raw <button with Tailwind classes (not <Button from @/ui)
  const matches = code.matchAll(/<button\s[^>]*className=/g);
  let count = 0;
  for (const _ of matches) {
    count++;
  }
  // Allow a few raw buttons (e.g. tab bars, custom game controls)
  if (count > 3) {
    violations.push({
      rule: 'raw-button',
      severity: 'warning',
      message: `${count} raw <button> elements with className found — use <Button> from @/ui instead`,
    });
  }
  return violations;
};

const checkRawInput: LintRule = (code) => {
  const violations: LintViolation[] = [];
  const matches = code.matchAll(/<input\s[^>]*className=/g);
  let count = 0;
  for (const _ of matches) {
    count++;
  }
  if (count > 0) {
    violations.push({
      rule: 'raw-input',
      severity: 'warning',
      message: `${count} raw <input> elements — use <Input> from @/ui instead`,
    });
  }
  return violations;
};

const checkRawTable: LintRule = (code) => {
  const violations: LintViolation[] = [];
  if (code.includes('<table') && code.includes('<th') && !code.includes('DataTable')) {
    violations.push({
      rule: 'raw-table',
      severity: 'warning',
      message: 'Raw <table> with <th> found — use <DataTable> from @/ui instead',
    });
  }
  return violations;
};

const checkWindowConfirm: LintRule = (code) => {
  const violations: LintViolation[] = [];
  if (code.includes('window.confirm(') || code.includes('confirm(\'') || code.includes('confirm("')) {
    violations.push({
      rule: 'window-confirm',
      severity: 'error',
      message: 'window.confirm() used — use <ConfirmDialog> from @/ui instead',
    });
  }
  return violations;
};

const checkWindowAlert: LintRule = (code) => {
  const violations: LintViolation[] = [];
  if (code.includes('window.alert(') || /(?<!\w)alert\(["']/.test(code)) {
    violations.push({
      rule: 'window-alert',
      severity: 'error',
      message: 'alert() used — use toast() from @/ui instead',
    });
  }
  return violations;
};

const checkHeavyShadows: LintRule = (code) => {
  const violations: LintViolation[] = [];
  const heavyShadowCount = (code.match(/shadow-2xl/g) || []).length;
  if (heavyShadowCount > 2) {
    violations.push({
      rule: 'heavy-shadows',
      severity: 'warning',
      message: `${heavyShadowCount} uses of shadow-2xl — use shadow-sm or shadow-md for cards, shadow-xl only for modals`,
    });
  }
  return violations;
};

const checkFontWeight: LintRule = (code) => {
  const violations: LintViolation[] = [];
  if (code.includes('font-black') || code.includes('font-extrabold')) {
    violations.push({
      rule: 'font-weight',
      severity: 'warning',
      message: 'font-black or font-extrabold used — use font-medium or font-semibold only',
    });
  }
  return violations;
};

const checkMissingSetupTheme: LintRule = (code) => {
  const violations: LintViolation[] = [];
  if (!code.includes('setupTheme')) {
    violations.push({
      rule: 'missing-setup-theme',
      severity: 'error',
      message: 'setupTheme() not called — must call setupTheme({ primaryColor: ... }) at the top of the main component',
    });
  }
  return violations;
};

const checkColorSprawl: LintRule = (code) => {
  const violations: LintViolation[] = [];
  // Count distinct Tailwind color families used (excluding gray/white/black/red/green/yellow which are semantic)
  const colorFamilies = new Set<string>();
  const colorMatches = code.matchAll(/(?:bg|text|border|ring)-(?!gray|white|black|red|green|yellow|transparent|current|inherit)([\w]+)-\d/g);
  for (const m of colorMatches) {
    colorFamilies.add(m[1]);
  }
  if (colorFamilies.size > 3) {
    violations.push({
      rule: 'color-sprawl',
      severity: 'warning',
      message: `${colorFamilies.size} color families used (${[...colorFamilies].join(', ')}) — stick to 1 primary + 1 neutral + 1 semantic accent`,
    });
  }
  return violations;
};

const checkMissingEmptyState: LintRule = (code) => {
  const violations: LintViolation[] = [];
  // If there's filtering/searching, there should be an empty state
  const hasFiltering = code.includes('filter(') || code.includes('.filter(');
  const hasSearch = /search/i.test(code);
  const hasEmptyState = code.includes('EmptyState') || code.includes('No ') || code.includes('no ');
  if ((hasFiltering || hasSearch) && !hasEmptyState) {
    violations.push({
      rule: 'missing-empty-state',
      severity: 'warning',
      message: 'Filtering/searching without empty state — use <EmptyState> from @/ui when results are empty',
    });
  }
  return violations;
};

const checkGradientAbuse: LintRule = (code) => {
  const violations: LintViolation[] = [];
  const gradientCount = (code.match(/bg-gradient-to-/g) || []).length;
  if (gradientCount > 2) {
    violations.push({
      rule: 'gradient-abuse',
      severity: 'warning',
      message: `${gradientCount} gradient backgrounds — max 1-2 gradients per app (hero only). Use solid colors.`,
    });
  }
  return violations;
};

const checkCodeLength: LintRule = (_, lines) => {
  const violations: LintViolation[] = [];
  if (lines.length < 80) {
    violations.push({
      rule: 'too-short',
      severity: 'warning',
      message: `Only ${lines.length} lines — apps under 80 lines are usually too simple. Add more features, views, and data.`,
    });
  }
  return violations;
};

// ── All rules ───────────────────────────────────────────────────────────────

const ALL_RULES: LintRule[] = [
  checkArbitrarySpacing,
  checkArbitraryTextSize,
  checkEmojiInUI,
  checkRawButton,
  checkRawInput,
  checkRawTable,
  checkWindowConfirm,
  checkWindowAlert,
  checkHeavyShadows,
  checkFontWeight,
  checkMissingSetupTheme,
  checkColorSprawl,
  checkMissingEmptyState,
  checkGradientAbuse,
  checkCodeLength,
];

// ── Main linter function ────────────────────────────────────────────────────

export function lintDesign(pageCode: string): LintResult {
  const lines = pageCode.split('\n');
  const violations: LintViolation[] = [];

  for (const rule of ALL_RULES) {
    violations.push(...rule(pageCode, lines));
  }

  // Score: start at 100, deduct per violation
  const errorDeduction = 15;
  const warningDeduction = 5;
  const errors = violations.filter(v => v.severity === 'error').length;
  const warnings = violations.filter(v => v.severity === 'warning').length;
  const score = Math.max(0, 100 - (errors * errorDeduction) - (warnings * warningDeduction));

  const passesThreshold = score >= PASS_THRESHOLD;

  // Format feedback for AI retry
  const feedback = violations.length > 0
    ? `## DESIGN LINTER FEEDBACK — FIX THESE ISSUES

Score: ${score}/100 (threshold: ${PASS_THRESHOLD})

${violations.map(v => `- [${v.severity.toUpperCase()}] ${v.message}`).join('\n')}

Fix ALL errors and as many warnings as practical. Return the corrected code.`
    : '';

  return { violations, score, passesThreshold, feedback };
}
