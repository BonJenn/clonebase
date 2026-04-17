import { describe, it, expect } from 'vitest';
import { rateLimit } from './rate-limiter';

function uniqueKey(label: string): string {
  // Isolate each test's rate-limit state by using unique keys.
  // The limiter holds a module-level Map, so tests must not share keys.
  return `${label}-${Date.now()}-${Math.random()}`;
}

describe('rateLimit', () => {
  it('allows requests under the limit', () => {
    const key = uniqueKey('allow');
    for (let i = 0; i < 5; i++) {
      const res = rateLimit(key, 10);
      expect(res.allowed).toBe(true);
    }
  });

  it('denies once the limit is reached', () => {
    const key = uniqueKey('deny');
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, 3).allowed).toBe(true);
    }
    const over = rateLimit(key, 3);
    expect(over.allowed).toBe(false);
    expect(over.remaining).toBe(0);
  });

  it('reports decreasing remaining count', () => {
    const key = uniqueKey('remaining');
    const first = rateLimit(key, 5);
    const second = rateLimit(key, 5);
    expect(first.remaining).toBeGreaterThan(second.remaining);
  });

  it('tracks separate keys independently', () => {
    const a = uniqueKey('separate-a');
    const b = uniqueKey('separate-b');
    for (let i = 0; i < 3; i++) rateLimit(a, 3);
    // key a is at the limit, key b has full budget
    expect(rateLimit(a, 3).allowed).toBe(false);
    expect(rateLimit(b, 3).allowed).toBe(true);
  });

  it('expires timestamps outside the window', async () => {
    const key = uniqueKey('window');
    rateLimit(key, 2, 30);
    rateLimit(key, 2, 30);
    expect(rateLimit(key, 2, 30).allowed).toBe(false);
    // Wait past the 30ms window
    await new Promise((r) => setTimeout(r, 60));
    expect(rateLimit(key, 2, 30).allowed).toBe(true);
  });

  it('returns remaining === maxRequests - 1 on first call', () => {
    const res = rateLimit(uniqueKey('first'), 10);
    expect(res.remaining).toBe(9);
  });

  it('handles maxRequests of 1 (immediate lockout after one call)', () => {
    const key = uniqueKey('single');
    expect(rateLimit(key, 1).allowed).toBe(true);
    expect(rateLimit(key, 1).allowed).toBe(false);
  });
});
