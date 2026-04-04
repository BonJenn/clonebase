import { registerTemplate } from '../registry-core';
import { WaitlistPage } from './page';
import { AdminPage } from './admin';

registerTemplate('saas-waitlist', {
  pages: {
    '/': WaitlistPage,
    '/admin': AdminPage,
  },
  meta: {
    name: 'SaaS Waitlist',
    description: 'Beautiful dark-themed waitlist landing page with email collection and admin dashboard.',
    files: [
      'index.ts',
      'page.tsx',
      'admin.tsx',
    ],
  },
});
