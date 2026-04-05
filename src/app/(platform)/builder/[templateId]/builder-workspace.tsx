'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChatPanel } from '@/components/builder/chat-panel';
import { LivePreview } from '@/components/builder/live-preview';
import { CodePreview } from '@/components/builder/code-preview';
import { DataPanel } from '@/components/builder/data-panel';
import { PublishDialog } from '@/components/builder/publish-dialog';
import { Button } from '@/components/ui/button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface GeneratedCode {
  page_code: string;
  admin_code: string | null;
  api_handler_code: string | null;
}

interface BuilderWorkspaceProps {
  templateId: string;
  templateName: string;
  initialPrompt: string | null;
  existingCode: GeneratedCode | null;
  existingMessages: Message[];
}

export function BuilderWorkspace({
  templateId,
  templateName,
  initialPrompt,
  existingCode,
  existingMessages,
}: BuilderWorkspaceProps) {
  const [messages, setMessages] = useState<Message[]>(existingMessages);
  const [code, setCode] = useState<GeneratedCode | null>(existingCode);
  const [transpiledCode, setTranspiledCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [activeView, setActiveView] = useState<'preview' | 'code' | 'data'>('preview');
  const [showPublish, setShowPublish] = useState(false);
  const [componentName, setComponentName] = useState('Page');

  // Transpile code for preview whenever it changes
  const transpile = useCallback(async (pageCode: string) => {
    try {
      const res = await fetch('/api/builder/transpile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: pageCode }),
      });
      const data = await res.json();
      if (data.transpiled) {
        setTranspiledCode(data.transpiled);
        // Extract component name from export
        const match = pageCode.match(/export\s+function\s+(\w+)/);
        if (match) setComponentName(match[1]);
      }
    } catch {
      // Transpilation error — preview will show error state
    }
  }, []);

  // Transpile existing code on mount
  useEffect(() => {
    if (existingCode?.page_code) {
      transpile(existingCode.page_code);
    }
  }, [existingCode, transpile]);

  // Auto-generate on first load if we have an initial prompt and no existing work
  useEffect(() => {
    if (initialPrompt && messages.length === 0 && !code) {
      handleSend(initialPrompt);
      // Clear prompt from URL so refresh doesn't re-trigger
      window.history.replaceState({}, '', `/builder/${templateId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSend(content: string) {
    const userMessage: Message = { role: 'user', content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setGenerating(true);

    try {
      const res = await fetch('/api/builder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
          messages: updatedMessages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages([...updatedMessages, {
          role: 'assistant',
          content: `Error: ${data.error || 'Generation failed'}`,
        }]);
        setGenerating(false);
        return;
      }

      // Update code
      const newCode: GeneratedCode = {
        page_code: data.page_code,
        admin_code: data.admin_code,
        api_handler_code: data.api_handler_code,
      };
      setCode(newCode);

      // Add assistant message with integration suggestions if any
      let explanation = data.explanation;
      if (data.suggested_integrations?.length) {
        const suggestions = data.suggested_integrations
          .map((i: { name: string; description: string }) => `${i.name} — ${i.description}`)
          .join('\n');
        explanation += `\n\nWant live data? Add your API key in the Integrations tab:\n${suggestions}`;
      }
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: explanation,
      }]);

      // Transpile for preview
      await transpile(data.page_code);
    } catch {
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: 'Network error. Please try again.',
      }]);
    }

    setGenerating(false);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
        <h2 className="text-sm font-medium text-gray-700 truncate">{templateName}</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 text-xs">
            <button
              onClick={() => setActiveView('preview')}
              className={`px-3 py-1.5 ${activeView === 'preview' ? 'bg-gray-100 font-medium' : 'text-gray-500'}`}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveView('code')}
              className={`px-3 py-1.5 ${activeView === 'code' ? 'bg-gray-100 font-medium' : 'text-gray-500'}`}
            >
              Code
            </button>
            <button
              onClick={() => setActiveView('data')}
              className={`px-3 py-1.5 ${activeView === 'data' ? 'bg-gray-100 font-medium' : 'text-gray-500'}`}
            >
              Data
            </button>
          </div>
          <Button
            onClick={() => setShowPublish(true)}
            disabled={!code}
            variant="secondary"
          >
            Publish
          </Button>
        </div>
      </div>

      {/* Split pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat panel */}
        <div className="w-[400px] min-w-[320px] border-r border-gray-200 bg-white">
          <ChatPanel
            messages={messages}
            onSend={handleSend}
            generating={generating}
          />
        </div>

        {/* Preview / Code / Data panel — iframe always mounted so Data tab can communicate */}
        <div className="flex-1 overflow-hidden relative">
          <div className={activeView === 'preview' ? 'h-full' : 'h-0 overflow-hidden'}>
            <LivePreview
              transpiledCode={transpiledCode}
              componentName={componentName}
            />
          </div>
          {activeView === 'code' && (
            <CodePreview
              pageCode={code?.page_code || null}
              adminCode={code?.admin_code || null}
              apiHandlerCode={code?.api_handler_code || null}
            />
          )}
          {activeView === 'data' && (
            <DataPanel templateId={templateId} />
          )}
        </div>
      </div>

      {/* Publish dialog */}
      {showPublish && (
        <PublishDialog
          templateId={templateId}
          templateName={templateName}
          onClose={() => setShowPublish(false)}
        />
      )}
    </div>
  );
}
