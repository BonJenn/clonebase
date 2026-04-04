import { registerTemplate } from '../registry-core';
import { BioPage } from './page';
import { AdminPage } from './admin';

registerTemplate('link-in-bio', {
  pages: {
    '/': BioPage,
    '/admin': AdminPage,
  },
  meta: {
    name: 'Link in Bio',
    description: 'Clean, customizable link-in-bio page with admin panel for managing links.',
    files: [
      'index.ts',
      'page.tsx',
      'admin.tsx',
    ],
  },
});
