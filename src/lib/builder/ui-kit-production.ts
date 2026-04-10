// Production-side UI kit for DynamicRenderer.
// In production, generated code runs in the Next.js context (not a sandbox iframe).
// We evaluate the same UI kit IIFE at module load time and capture the result.
//
// This avoids duplicating component definitions — the sandbox uses the string
// directly in HTML, and production evaluates the same string here.

import React from 'react';

// Make React available globally for the UI kit IIFE (it references `React` directly)
const globalAny = globalThis as Record<string, unknown>;

export function createProductionUIKit(): Record<string, unknown> {
  // The UI kit IIFE sets window.__UI__, but in Node/SSR there's no window.
  // We create a minimal shim and evaluate the kit.
  const fakeWindow: Record<string, unknown> = {};
  const fakeDocument = {
    createElement: (tag: string) => ({
      id: '',
      className: '',
      textContent: '',
      innerHTML: '',
      style: {} as Record<string, string>,
      remove: () => {},
      appendChild: () => {},
    }),
    getElementById: () => null,
    head: { appendChild: () => {} },
    body: { appendChild: () => {}, classList: { contains: () => false, add: () => {}, remove: () => {} } },
  };

  // Import the UI kit source and evaluate it
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { UI_KIT_SCRIPT } = require('./ui-kit');

  try {
    // Create a function that evaluates the UI kit with our shims
    const evalFn = new Function(
      'React', 'window', 'document',
      UI_KIT_SCRIPT + '\nreturn window.__UI__;'
    );
    const uiKit = evalFn(React, fakeWindow, fakeDocument);
    return uiKit || {};
  } catch (err) {
    console.error('[ui-kit-production] Failed to initialize UI kit:', err);
    return {};
  }
}
