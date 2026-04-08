// Measures the composed system prompt size for various request scenarios.
// Run with: npx tsx scripts/measure-prompt.ts

import { composePrompt } from '../src/lib/builder/prompts';

const scenarios: Array<{ name: string; opts: Parameters<typeof composePrompt>[0] }> = [
  { name: 'basic (no flags)', opts: {} },
  { name: 'todo app (simple, no auth)', opts: { plan: { needs_auth: false, needs_research: false } as any } },
  { name: 'social app (auth)', opts: { plan: { needs_auth: true, needs_research: false } as any } },
  { name: 'real business website', opts: { plan: { needs_auth: false, needs_research: true } as any } },
  { name: 'game', opts: { plan: { needs_auth: false, needs_research: false, app_type: 'game' } as any } },
  { name: 'game + auth', opts: { plan: { needs_auth: true, needs_research: false, app_type: 'game' } as any } },
  { name: 'bug fix follow-up', opts: { isBugFix: true, currentCode: { page_code: '// 4 KB of existing code...'.repeat(150) } } },
  { name: 'everything', opts: { plan: { needs_auth: true, needs_research: true, app_type: 'game' } as any, isBugFix: true } },
];

const OLD_PROMPT_SIZE = 38403; // chars in HEAD's system-prompt.ts (before code context)

console.log(`Baseline (old monolithic prompt): ${OLD_PROMPT_SIZE} chars (~${Math.round(OLD_PROMPT_SIZE / 4)} tokens)\n`);

for (const { name, opts } of scenarios) {
  const composed = composePrompt(opts);
  const chars = composed.length;
  const tokens = Math.round(chars / 4);
  const delta = chars - OLD_PROMPT_SIZE;
  const pct = ((delta / OLD_PROMPT_SIZE) * 100).toFixed(1);
  const sign = delta >= 0 ? '+' : '';
  console.log(`${name.padEnd(32)} ${chars.toString().padStart(6)} chars (~${tokens.toString().padStart(5)} tok)  ${sign}${pct}%`);
}
