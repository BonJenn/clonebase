import { describe, it, expect } from 'vitest';
import { lintDesign } from './design-linter';

describe('lintDesign', () => {
  it('returns a passing result on clean code', () => {
    const clean = `'use client';
import { setupTheme } from '@/ui/theme';
setupTheme({ primaryColor: 'emerald' });
export function Page() {
  return <div className="p-4 text-gray-900">Hello</div>;
}`;
    const result = lintDesign(clean);
    expect(result.passesThreshold).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(60);
  });

  it('score stays within [0, 100]', () => {
    // A worst-case file that trips every rule should still score >= 0
    const awful = 'eval(1); '.repeat(500);
    const result = lintDesign(awful);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('never throws on empty or null-ish code', () => {
    expect(() => lintDesign('')).not.toThrow();
    expect(() => lintDesign(' ')).not.toThrow();
  });

  it('flags arbitrary spacing values', () => {
    const code = `<div className="p-[13px]">x</div>`;
    const result = lintDesign(code);
    expect(result.violations.some((v) => v.rule === 'arbitrary-spacing')).toBe(true);
  });

  it('does NOT flag allowlisted arbitrary widths', () => {
    // 280, 300, 320, 400, 600, 800 are intentional exceptions
    // Note: the rule matches p/m/gap/space, not w-. But this code shouldn't trip arbitrary-spacing.
    const code = `<div className="p-[280px]">x</div>`;
    const result = lintDesign(code);
    expect(result.violations.some((v) => v.rule === 'arbitrary-spacing')).toBe(false);
  });

  it('flags arbitrary text sizes', () => {
    const code = `<div className="text-[17px]">x</div>`;
    const result = lintDesign(code);
    expect(result.violations.some((v) => v.rule === 'arbitrary-text-size')).toBe(true);
  });

  it('flags emoji used as UI elements (as an error)', () => {
    const code = `<button className="btn">🚀 Launch</button>`;
    const result = lintDesign(code);
    const emojiViolation = result.violations.find((v) => v.rule === 'emoji-in-ui');
    expect(emojiViolation).toBeTruthy();
    expect(emojiViolation?.severity).toBe('error');
  });

  it('does NOT flag emoji inside canvas fillText calls', () => {
    const code = `ctx.fillText('🚀', 10, 10);`;
    const result = lintDesign(code);
    expect(result.violations.some((v) => v.rule === 'emoji-in-ui')).toBe(false);
  });

  it('produces a formatted feedback string when violations exist', () => {
    const result = lintDesign(`<div className="p-[13px] text-[17px]">x</div>`);
    expect(result.feedback).toContain('DESIGN LINTER FEEDBACK');
    expect(result.feedback).toContain(`${result.score}/100`);
  });

  it('returns empty feedback when there are no violations', () => {
    const clean = `'use client';
import { setupTheme } from '@/ui/theme';
setupTheme({ primaryColor: 'emerald' });
export function Page() {
  return <div className="p-4 text-gray-900">Hello</div>;
}`;
    const result = lintDesign(clean);
    if (result.violations.length === 0) {
      expect(result.feedback).toBe('');
    }
  });

  it('violation objects always include rule + severity + message', () => {
    const result = lintDesign(`<div className="p-[13px]">x</div>`);
    for (const v of result.violations) {
      expect(typeof v.rule).toBe('string');
      expect(['error', 'warning']).toContain(v.severity);
      expect(typeof v.message).toBe('string');
    }
  });
});
