import { describe, it, expect } from 'vitest';
import { transpileForPreview, transpileForProduction } from './transpiler';

describe('transpileForPreview', () => {
  it('rewrites @/sdk imports to window.__SDK__ destructuring', () => {
    const src = `import { useTenantData, useTenantAuth } from '@/sdk/hooks';
export function Page() { return null; }`;
    const out = transpileForPreview(src);
    expect(out).toContain('var useTenantData = window.__SDK__.useTenantData;');
    expect(out).toContain('var useTenantAuth = window.__SDK__.useTenantAuth;');
  });

  it('rewrites @/ui imports to window.__UI__', () => {
    const src = `import { Button, Card } from '@/ui/kit';
export function Page() { return null; }`;
    const out = transpileForPreview(src);
    expect(out).toContain('var Button = window.__UI__.Button;');
    expect(out).toContain('var Card = window.__UI__.Card;');
  });

  it('rewrites named React imports to const { ... } = React', () => {
    const src = `import { useState, useEffect } from 'react';
export function Page() { return null; }`;
    const out = transpileForPreview(src);
    // sucrase preserves whitespace inside the destructure; match loosely
    expect(out).toMatch(/const\s*\{\s*useState,\s*useEffect\s*\}\s*=\s*React/);
  });

  it('strips default React import entirely', () => {
    const src = `import React from 'react';
export function Page() { return null; }`;
    const out = transpileForPreview(src);
    expect(out).not.toMatch(/import\s+React/);
  });

  it("strips the 'use client' directive", () => {
    const src = `'use client';
import { useState } from 'react';
export function Page() { return null; }`;
    const out = transpileForPreview(src);
    expect(out).not.toContain("'use client'");
    expect(out).not.toContain('"use client"');
  });

  it('converts export default function to module.exports', () => {
    const src = `export default function Home() { return null; }`;
    const out = transpileForPreview(src);
    expect(out).toContain('module.exports.Home');
    expect(out).toContain('module.exports.default');
  });

  it('converts named export function to module.exports.Name', () => {
    const src = `export function Page() { return null; }`;
    const out = transpileForPreview(src);
    expect(out).toContain('module.exports.Page');
  });

  it('transpiles TSX to JS (strips type annotations)', () => {
    const src = `export function Page(props: { title: string }) {
  const x: number = 1;
  return <div>{props.title}</div>;
}`;
    const out = transpileForPreview(src);
    // TypeScript annotations should be gone
    expect(out).not.toMatch(/:\s*string/);
    expect(out).not.toMatch(/:\s*number/);
    // JSX compiled to React.createElement
    expect(out).toContain('React.createElement');
  });

  it('throws on malformed JSX rather than silently producing junk', () => {
    // sucrase surfaces parse errors — we want those to bubble up so the
    // generate route can catch them and retry, not produce broken code.
    const src = `export function Page() { return <div><span</div>; }`;
    expect(() => transpileForPreview(src)).toThrow();
  });

  it('produces different prefixes for preview vs production', () => {
    const src = `import { useTenantData } from '@/sdk/hooks';
export function Page() { return null; }`;
    const preview = transpileForPreview(src);
    const production = transpileForProduction(src);
    expect(preview).toContain('window.__SDK__.useTenantData');
    expect(production).toContain('__SDK__.useTenantData');
    expect(production).not.toContain('window.__SDK__');
  });

  it('handles multiple imports on separate lines', () => {
    const src = `'use client';
import { useState } from 'react';
import { useTenantData } from '@/sdk/data';
import { Button } from '@/ui/button';
export function Page() { return null; }`;
    const out = transpileForPreview(src);
    expect(out).toMatch(/const\s*\{\s*useState\s*\}\s*=\s*React/);
    expect(out).toContain('var useTenantData = window.__SDK__.useTenantData');
    expect(out).toContain('var Button = window.__UI__.Button');
  });

  it('handles an empty module without throwing', () => {
    expect(() => transpileForPreview('')).not.toThrow();
  });

  it('handles imports with whitespace in destructuring', () => {
    const src = `import {   useState,    useEffect   } from 'react';
export function Page() { return null; }`;
    const out = transpileForPreview(src);
    expect(out).toContain('useState');
    expect(out).toContain('useEffect');
  });
});

describe('transpileForProduction', () => {
  it('rewrites SDK imports without window prefix', () => {
    const src = `import { useTenantData } from '@/sdk/hooks';
export function Page() { return null; }`;
    const out = transpileForProduction(src);
    expect(out).toContain('var useTenantData = __SDK__.useTenantData;');
  });

  it('rewrites UI imports without window prefix', () => {
    const src = `import { Card } from '@/ui/kit';
export function Page() { return null; }`;
    const out = transpileForProduction(src);
    expect(out).toContain('var Card = __UI__.Card;');
  });
});
