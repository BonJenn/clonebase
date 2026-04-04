import { ComponentType } from 'react';
import { registerTemplate, getTemplate, getAllTemplateSlugs } from './registry-core';

export type { TemplateEntry } from './registry-core';
export { registerTemplate, getTemplate, getAllTemplateSlugs };

// Import all templates so they self-register via registerTemplate().
// Add new templates here as they're built:
import './ai-support-bot';
import './saas-waitlist';
import './link-in-bio';
