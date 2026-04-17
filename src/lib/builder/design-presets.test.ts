import { describe, it, expect } from 'vitest';
import { selectPreset, selectPresetByPattern, PRESETS, formatPresetForPrompt } from './design-presets';

describe('selectPreset', () => {
  it('returns gaming-neon for game app type', () => {
    const p = selectPreset('game', 'light');
    expect(p.id).toBe('gaming-neon');
  });

  it('returns gaming-neon for interactive app type', () => {
    const p = selectPreset('interactive', 'light');
    expect(p.id).toBe('gaming-neon');
  });

  it('returns gaming-neon for dark theme', () => {
    const p = selectPreset('standard', 'dark');
    expect(p.id).toBe('gaming-neon');
  });

  it('returns linear-minimal for minimal theme', () => {
    const p = selectPreset('standard', 'minimal');
    expect(p.id).toBe('linear-minimal');
  });

  it('returns apple-clean for colorful theme', () => {
    const p = selectPreset('standard', 'colorful');
    expect(p.id).toBe('apple-clean');
  });

  it('defaults to stripe-professional for light theme', () => {
    const p = selectPreset('standard', 'light');
    expect(p.id).toBe('stripe-professional');
  });

  it('defaults to stripe-professional for unknown theme', () => {
    const p = selectPreset('standard', 'nonexistent-theme');
    expect(p.id).toBe('stripe-professional');
  });

  it('does not throw on empty string inputs', () => {
    expect(() => selectPreset('', '')).not.toThrow();
  });

  it('game type takes priority over dark theme', () => {
    // Both "game" and "dark" map to gaming-neon, but game should win first
    const p = selectPreset('game', 'dark');
    expect(p.id).toBe('gaming-neon');
  });
});

describe('selectPresetByPattern', () => {
  it('maps known patterns to their preset', () => {
    expect(selectPresetByPattern('SaaS Dashboard').id).toBe('stripe-professional');
    expect(selectPresetByPattern('project manager / kanban').id).toBe('linear-minimal');
    expect(selectPresetByPattern('game / interactive').id).toBe('gaming-neon');
    expect(selectPresetByPattern('e-commerce / store').id).toBe('marketplace-modern');
  });

  it('is case-insensitive', () => {
    expect(selectPresetByPattern('SAAS DASHBOARD').id).toBe('stripe-professional');
    expect(selectPresetByPattern('saas dashboard').id).toBe('stripe-professional');
  });

  it('falls back to stripe-professional for unknown patterns', () => {
    expect(selectPresetByPattern('zzz-unknown-pattern').id).toBe('stripe-professional');
  });

  it('does not throw on empty input', () => {
    expect(() => selectPresetByPattern('')).not.toThrow();
  });

  it('matches on substrings (pattern included in input)', () => {
    // "some saas dashboard wrapper" contains "saas dashboard"
    const p = selectPresetByPattern('some saas dashboard wrapper');
    expect(p.id).toBe('stripe-professional');
  });
});

describe('PRESETS', () => {
  it('every preset has the expected shape', () => {
    for (const [id, preset] of Object.entries(PRESETS)) {
      expect(preset.id).toBe(id);
      expect(typeof preset.name).toBe('string');
      expect(preset.tokens).toBeTruthy();
      expect(Array.isArray(preset.rules)).toBe(true);
    }
  });

  it('contains the 6 known curated presets', () => {
    const ids = Object.keys(PRESETS).sort();
    expect(ids).toContain('linear-minimal');
    expect(ids).toContain('stripe-professional');
    expect(ids).toContain('apple-clean');
    expect(ids).toContain('notion-soft');
    expect(ids).toContain('gaming-neon');
    expect(ids).toContain('marketplace-modern');
  });
});

describe('formatPresetForPrompt', () => {
  it('returns a non-empty string containing the preset name', () => {
    const preset = PRESETS['stripe-professional'];
    const prompt = formatPresetForPrompt(preset);
    expect(prompt.length).toBeGreaterThan(0);
    expect(prompt.toUpperCase()).toContain(preset.name.toUpperCase());
  });

  it('does not throw for any preset', () => {
    for (const preset of Object.values(PRESETS)) {
      expect(() => formatPresetForPrompt(preset)).not.toThrow();
    }
  });
});
