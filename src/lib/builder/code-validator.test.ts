import { describe, it, expect } from 'vitest';
import { validateTemplateCode } from './code-validator';

const VALID_PAGE = `'use client';
export function Page() { return null; }`;

describe('validateTemplateCode — page code', () => {
  it('accepts minimal valid code', () => {
    const res = validateTemplateCode({ page_code: VALID_PAGE });
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it("rejects code missing 'use client'", () => {
    const res = validateTemplateCode({
      page_code: `export function Page() { return null; }`,
    });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes("'use client'"))).toBe(true);
  });

  it('rejects code with no named function export', () => {
    const res = validateTemplateCode({
      page_code: `'use client';
const Page = () => null;`,
    });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('named function'))).toBe(true);
  });

  it('rejects eval()', () => {
    const res = validateTemplateCode({
      page_code: `'use client';
export function Page() { eval('alert(1)'); return null; }`,
    });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('eval'))).toBe(true);
  });

  it('rejects new Function()', () => {
    const res = validateTemplateCode({
      page_code: `'use client';
export function Page() { new Function('alert(1)')(); return null; }`,
    });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('new Function'))).toBe(true);
  });

  it('rejects document.cookie access', () => {
    const res = validateTemplateCode({
      page_code: `'use client';
export function Page() { const c = document.cookie; return null; }`,
    });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('document.cookie'))).toBe(true);
  });

  it('rejects localStorage', () => {
    const res = validateTemplateCode({
      page_code: `'use client';
export function Page() { localStorage.setItem('x', '1'); return null; }`,
    });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('localStorage'))).toBe(true);
  });

  it('rejects sessionStorage', () => {
    const res = validateTemplateCode({
      page_code: `'use client';
export function Page() { sessionStorage.clear(); return null; }`,
    });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('sessionStorage'))).toBe(true);
  });

  it('rejects dangerouslySetInnerHTML', () => {
    const res = validateTemplateCode({
      page_code: `'use client';
export function Page() { return <div dangerouslySetInnerHTML={{__html: ''}} />; }`,
    });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('dangerouslySetInnerHTML'))).toBe(true);
  });

  it('rejects inline <script> tags', () => {
    const res = validateTemplateCode({
      page_code: `'use client';
export function Page() { return <script>alert(1)</script>; }`,
    });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.toLowerCase().includes('script'))).toBe(true);
  });

  it('rejects forbidden node imports (crypto/fs/path/child_process)', () => {
    for (const mod of ['crypto', 'fs', 'path', 'child_process']) {
      const res = validateTemplateCode({
        page_code: `'use client';
import { x } from '${mod}';
export function Page() { return null; }`,
      });
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes(mod))).toBe(true);
    }
  });

  it('rejects require()', () => {
    const res = validateTemplateCode({
      page_code: `'use client';
const x = require('foo');
export function Page() { return null; }`,
    });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('require'))).toBe(true);
  });

  it('rejects files over 50KB', () => {
    const huge = `'use client';
export function Page() { return null; /* ${'x'.repeat(50_001)} */ }`;
    const res = validateTemplateCode({ page_code: huge });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.toLowerCase().includes('too large'))).toBe(true);
  });

  it('warns (not errors) on direct fetch()', () => {
    const res = validateTemplateCode({
      page_code: `'use client';
export function Page() { fetch('/api'); return null; }`,
    });
    expect(res.valid).toBe(true); // warnings don't fail validation
    expect(res.warnings.some((w) => w.toLowerCase().includes('fetch'))).toBe(true);
  });

  it('collects multiple violations in one result', () => {
    const res = validateTemplateCode({
      page_code: `export function Page() { eval('x'); localStorage; return null; }`,
    });
    expect(res.errors.length).toBeGreaterThanOrEqual(3); // missing use client + eval + localStorage
  });
});

describe('validateTemplateCode — admin code', () => {
  it('validates admin code with the same rules as page', () => {
    const res = validateTemplateCode({
      page_code: VALID_PAGE,
      admin_code: `export function Admin() { return null; }`, // missing use client
    });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.startsWith('[admin]'))).toBe(true);
  });

  it('skips admin validation when admin_code is null or undefined', () => {
    const res1 = validateTemplateCode({ page_code: VALID_PAGE, admin_code: null });
    const res2 = validateTemplateCode({ page_code: VALID_PAGE });
    expect(res1.valid).toBe(true);
    expect(res2.valid).toBe(true);
  });
});

describe('validateTemplateCode — api handler', () => {
  it('requires apiHandler function name', () => {
    const res = validateTemplateCode({
      page_code: VALID_PAGE,
      api_handler_code: `export function somethingElse() {}`,
    });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('apiHandler'))).toBe(true);
  });

  it('accepts a valid apiHandler', () => {
    const res = validateTemplateCode({
      page_code: VALID_PAGE,
      api_handler_code: `export async function apiHandler(req) { return { ok: true }; }`,
    });
    expect(res.valid).toBe(true);
  });

  it('rejects eval in api handler', () => {
    const res = validateTemplateCode({
      page_code: VALID_PAGE,
      api_handler_code: `export async function apiHandler() { eval('1'); }`,
    });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.startsWith('[api_handler]'))).toBe(true);
  });

  it('does NOT require "use client" for api handler (server code)', () => {
    const res = validateTemplateCode({
      page_code: VALID_PAGE,
      api_handler_code: `export function apiHandler() { return {}; }`,
    });
    expect(res.valid).toBe(true);
  });
});
