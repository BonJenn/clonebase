import { registerTemplate } from '../registry-core';
import { ChatPage } from './page';
import { AdminPage } from './admin';

registerTemplate('ai-support-bot', {
  pages: {
    '/': ChatPage,
    '/admin': AdminPage,
  },
  meta: {
    name: 'AI Customer Support Bot',
    description: 'AI-powered customer support chatbot with knowledge base and conversation history.',
    files: [
      'index.ts',
      'page.tsx',
      'admin.tsx',
      'api/handler.ts',
      'components/chat-message.tsx',
      'components/chat-input.tsx',
    ],
  },
});
