'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DesignPicker } from '@/components/builder/design-picker';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SelectedElement {
  editId: string;
  tag: string;
  text: string;
}

interface ChatPanelProps {
  messages: Message[];
  onSend: (message: string) => void;
  generating: boolean;
  onRetry?: () => void;
  canRetry?: boolean;
  selectedElement?: SelectedElement | null;
  onClearSelectedElement?: () => void;
  preFlightPrompt?: string | null;
  designPreset?: string | null;
  onDesignPresetChange?: (id: string | null) => void;
  authPref?: 'auto' | 'yes' | 'no';
  onAuthPrefChange?: (pref: 'auto' | 'yes' | 'no') => void;
  seedDataPref?: 'yes' | 'no';
  onSeedDataPrefChange?: (pref: 'yes' | 'no') => void;
  onStartGenerate?: () => void;
}

export function ChatPanel({ messages, onSend, generating, onRetry, canRetry, selectedElement, onClearSelectedElement, preFlightPrompt, designPreset, onDesignPresetChange, authPref = 'auto', onAuthPrefChange, seedDataPref = 'yes', onSeedDataPrefChange, onStartGenerate }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(messages.length);

  // Scroll to top on mount so pre-flight content starts visible
  useEffect(() => {
    scrollContainerRef.current?.scrollTo(0, 0);
  }, []);

  // When generation starts (first message added), reset scroll so the user
  // sees the "Building your app..." indicator instead of a stale scroll offset
  // left over from the pre-flight view. For follow-ups (messages > 1), scroll
  // to the bottom to show the latest exchange.
  useEffect(() => {
    if (generating) {
      if (messages.length <= 1) {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [generating, messages.length]);

  // Scroll to bottom only when a NEW message is added during this session,
  // not when loading existing messages on mount (which would scroll past the top).
  useEffect(() => {
    if (messages.length > prevMessagesLength.current && messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || generating) return;
    onSend(input.trim());
    setInput('');
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && preFlightPrompt && (
          <div className="px-1 py-2 space-y-4">
            {/* User prompt bubble */}
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-xl bg-indigo-600 px-4 py-2.5 text-sm text-white">
                <p className="whitespace-pre-wrap">{preFlightPrompt}</p>
              </div>
            </div>

            {/* Pre-flight options */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
              <DesignPicker selected={designPreset ?? null} onSelect={onDesignPresetChange ?? (() => {})} />

              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-gray-700">User accounts?</p>
                <div className="flex rounded-lg border border-gray-200 bg-white text-xs">
                  {(['auto', 'yes', 'no'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onAuthPrefChange?.(option)}
                      className={`px-3 py-1.5 capitalize transition-colors ${
                        authPref === option
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-500 hover:text-gray-700'
                      } ${option === 'auto' ? 'rounded-l-md' : ''} ${option === 'no' ? 'rounded-r-md' : ''}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-gray-700">Sample data?</p>
                <div className="flex rounded-lg border border-gray-200 bg-white text-xs">
                  {(['yes', 'no'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onSeedDataPrefChange?.(option)}
                      className={`px-3 py-1.5 capitalize transition-colors ${
                        seedDataPref === option
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-500 hover:text-gray-700'
                      } ${option === 'yes' ? 'rounded-l-md' : 'rounded-r-md'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={onStartGenerate}
                className="w-full bg-indigo-600 hover:bg-indigo-500"
              >
                Generate App
              </Button>
            </div>
          </div>
        )}
        {messages.length === 0 && !preFlightPrompt && (
          <div className="flex h-full items-center justify-center text-center text-gray-400">
            <div>
              <p className="text-lg font-medium">Describe your app</p>
              <p className="mt-1 text-sm">Tell me what you want to build and I&apos;ll generate it.</p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {generating && (
          <div className="flex justify-start">
            <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 px-4 py-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="relative">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                </div>
                <div>
                  <p className="font-medium text-indigo-900">Building your app...</p>
                  <p className="text-xs text-indigo-500 mt-0.5">This may take 15-30 seconds</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {canRetry && !generating && (
          <div className="flex justify-start">
            <button
              onClick={onRetry}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              🔄 Retry
            </button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        {selectedElement && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-pink-200 bg-pink-50 px-3 py-1.5 text-xs">
            <span className="font-medium text-pink-700">Editing:</span>
            <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-pink-700">{`<${selectedElement.tag}>`}</span>
            {selectedElement.text && (
              <span className="truncate text-pink-900">&ldquo;{selectedElement.text}&rdquo;</span>
            )}
            <button
              type="button"
              onClick={onClearSelectedElement}
              className="ml-auto text-pink-500 hover:text-pink-700"
              aria-label="Clear selection"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selectedElement
                ? 'e.g., make this red and bigger...'
                : messages.length === 0 ? 'e.g., Build me a recipe sharing app...' : 'e.g., Add a dark mode toggle...'
            }
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            disabled={generating}
          />
          <Button type="submit" loading={generating} disabled={!input.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
