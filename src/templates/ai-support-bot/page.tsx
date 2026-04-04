'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTenant } from '@/sdk/tenant-context';
import { useTenantData } from '@/sdk/use-tenant-data';
import { ChatMessage } from './components/chat-message';
import { ChatInput } from './components/chat-input';

interface Message {
  [key: string]: unknown;
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  conversation_id: string;
  created_at: string;
}

// Main chat page for the AI Support Bot template.
// Users type questions → sent to /api/t/chat → OpenAI generates a response.
// All messages are persisted in tenant_data for conversation history.
export function ChatPage() {
  const { tenantId, tenantName } = useTenant();
  const messages = useTenantData<Message>('messages');
  const [conversationId] = useState(() => crypto.randomUUID());
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter messages for current conversation (or show recent if no conversation yet)
  useEffect(() => {
    if (!messages.loading) {
      const convoMsgs = messages.data.filter((m) => m.conversation_id === conversationId);
      setCurrentMessages(convoMsgs.reverse());
    }
  }, [messages.data, messages.loading, conversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [currentMessages, streaming]);

  const handleSend = useCallback(async (content: string) => {
    const userMsg: Message = {
      role: 'user',
      content,
      conversation_id: conversationId,
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    setCurrentMessages((prev) => [...prev, userMsg]);
    // Persist user message
    await messages.insert({
      role: 'user',
      content,
      conversation_id: conversationId,
      created_at: new Date().toISOString(),
    });

    // Call the template's backend API
    setStreaming(true);
    try {
      const res = await fetch(`/api/t/chat?tenant=${encodeURIComponent(tenantId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...currentMessages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok && data.content) {
        const assistantMsg: Message = {
          role: 'assistant',
          content: data.content,
          conversation_id: conversationId,
          created_at: new Date().toISOString(),
        };
        setCurrentMessages((prev) => [...prev, assistantMsg]);
        await messages.insert({
          role: 'assistant',
          content: data.content,
          conversation_id: conversationId,
          created_at: new Date().toISOString(),
        });
      } else {
        setCurrentMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.error || 'Sorry, I could not process your request. Please check that OpenAI is connected in settings.',
            conversation_id: conversationId,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setCurrentMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Network error. Please try again.',
          conversation_id: conversationId,
          created_at: new Date().toISOString(),
        },
      ]);
    }
    setStreaming(false);
  }, [conversationId, currentMessages, messages, tenantId]);

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100">
            <span className="text-sm font-bold text-indigo-600">AI</span>
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">{tenantName}</h1>
            <p className="text-xs text-gray-500">AI Support Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Online
          </span>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Welcome message */}
        {currentMessages.length === 0 && !messages.loading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 mb-4">
              <span className="text-2xl font-bold text-indigo-600">AI</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Welcome to {tenantName}</h2>
            <p className="mt-2 max-w-sm text-sm text-gray-500">
              I&apos;m your AI support assistant. Ask me anything and I&apos;ll help you out!
            </p>
          </div>
        )}

        {messages.loading && (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        )}

        {currentMessages.map((msg, i) => (
          <ChatMessage
            key={msg.id || i}
            role={msg.role}
            content={msg.content}
            timestamp={msg.created_at}
          />
        ))}

        {streaming && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={streaming} />
    </div>
  );
}
