'use client';

import { useState, useEffect } from 'react';
import { ChatPanel } from '@/components/builder/chat-panel';
import { LivePreview } from '@/components/builder/live-preview';
import { GeneratingAnimation } from '@/components/builder/generating-animation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface MobileBuilderProps {
  templateName: string;
  messages: Message[];
  onSend: (message: string) => void;
  generating: boolean;
  showAnimation: boolean;
  transpiledCode: string | null;
  componentName: string;
  canRetry: boolean;
  onRetry: () => void;
  preFlightPrompt?: string | null;
  designPreset?: string | null;
  onDesignPresetChange?: (id: string | null) => void;
  authPref?: 'auto' | 'yes' | 'no';
  onAuthPrefChange?: (pref: 'auto' | 'yes' | 'no') => void;
  seedDataPref?: 'yes' | 'no';
  onSeedDataPrefChange?: (pref: 'yes' | 'no') => void;
  onStartGenerate?: () => void;
}

// Simplified mobile builder — toggle between Chat and Preview views.
// Removes the side-by-side layout and Code/Data/Media tabs.
export function MobileBuilder({
  templateName,
  messages,
  onSend,
  generating,
  showAnimation,
  transpiledCode,
  componentName,
  canRetry,
  onRetry,
  preFlightPrompt,
  designPreset,
  onDesignPresetChange,
  authPref,
  onAuthPrefChange,
  seedDataPref,
  onSeedDataPrefChange,
  onStartGenerate,
}: MobileBuilderProps) {
  const [activeView, setActiveView] = useState<'chat' | 'preview'>('chat');

  // Auto-switch to preview when generation completes
  useEffect(() => {
    if (transpiledCode && !generating) {
      setActiveView('preview');
    }
  }, [transpiledCode, generating]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col sm:hidden">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-3 py-2">
        <h2 className="text-sm font-medium text-gray-700 truncate">{templateName}</h2>
        <div className="flex rounded-lg border border-gray-200 text-xs shrink-0">
          <button
            onClick={() => setActiveView('chat')}
            className={`px-3 py-1.5 ${activeView === 'chat' ? 'bg-gray-100 font-medium' : 'text-gray-500'}`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveView('preview')}
            className={`px-3 py-1.5 ${activeView === 'preview' ? 'bg-gray-100 font-medium' : 'text-gray-500'}`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Content — keep both mounted so iframe state persists */}
      <div className="flex-1 overflow-hidden relative">
        <div className={activeView === 'chat' ? 'h-full' : 'h-0 overflow-hidden'}>
          <ChatPanel
            messages={messages}
            onSend={onSend}
            generating={generating}
            canRetry={canRetry}
            onRetry={onRetry}
            preFlightPrompt={preFlightPrompt}
            designPreset={designPreset}
            onDesignPresetChange={onDesignPresetChange}
            authPref={authPref}
            onAuthPrefChange={onAuthPrefChange}
            seedDataPref={seedDataPref}
            onSeedDataPrefChange={onSeedDataPrefChange}
            onStartGenerate={onStartGenerate}
          />
        </div>
        <div className={activeView === 'preview' ? 'h-full relative' : 'h-0 overflow-hidden'}>
          {showAnimation && (
            <div className="absolute inset-0 z-10">
              <GeneratingAnimation />
            </div>
          )}
          <LivePreview transpiledCode={transpiledCode} componentName={componentName} />
        </div>
      </div>
    </div>
  );
}
