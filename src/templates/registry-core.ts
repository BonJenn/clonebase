import { ComponentType } from 'react';

// Core registry — no template imports here to avoid circular dependencies.
// Templates import registerTemplate from this file via registry.ts.

export interface TemplateEntry {
  // Page components keyed by route path (e.g., "/" for home, "/settings" for settings)
  pages: Record<string, ComponentType<{ tenantId: string; instanceId: string }>>;
  // Template metadata for export
  meta: {
    name: string;
    description: string;
    files: string[]; // relative file paths for export
  };
}

const registry: Record<string, TemplateEntry> = {};

export function registerTemplate(slug: string, entry: TemplateEntry) {
  registry[slug] = entry;
}

export function getTemplate(slug: string): TemplateEntry | null {
  return registry[slug] || null;
}

export function getAllTemplateSlugs(): string[] {
  return Object.keys(registry);
}
