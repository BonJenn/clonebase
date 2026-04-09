'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatPanel } from '@/components/builder/chat-panel';
import { LivePreview, type ElementEditEvent, type ElementSelectedEvent, type LivePreviewHandle } from '@/components/builder/live-preview';
import { CodePreview } from '@/components/builder/code-preview';
import { DataPanel } from '@/components/builder/data-panel';
import { MediaPanel } from '@/components/builder/media-panel';
import { GeneratingAnimation } from '@/components/builder/generating-animation';
import { MobileBuilder } from '@/components/builder/mobile-builder';
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

interface ExistingInstance {
  id: string;
  slug: string;
}

interface BuilderWorkspaceProps {
  templateId: string;
  templateName: string;
  initialPrompt: string | null;
  existingCode: GeneratedCode | null;
  existingMessages: Message[];
  existingInstance: ExistingInstance | null;
}

export function BuilderWorkspace({
  templateId,
  templateName,
  initialPrompt,
  existingCode,
  existingMessages,
  existingInstance,
}: BuilderWorkspaceProps) {
  const [messages, setMessages] = useState<Message[]>(existingMessages);
  const [code, setCode] = useState<GeneratedCode | null>(existingCode);
  const [transpiledCode, setTranspiledCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [activeView, setActiveView] = useState<'preview' | 'code' | 'data' | 'media'>('preview');
  const [showPublish, setShowPublish] = useState(false);
  const [componentName, setComponentName] = useState('Page');
  const [showAnimation, setShowAnimation] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<ElementSelectedEvent | null>(null);
  const livePreviewRef = useRef<LivePreviewHandle>(null);

  // Instance tracks the creator's own deployment. Once they've published
  // once, the primary button flips from "Publish" to "Update" for one-click
  // redeploys without reopening the full dialog.
  const [instance, setInstance] = useState<ExistingInstance | null>(existingInstance);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateToast, setUpdateToast] = useState<string | null>(null);

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

  // Handle inline text/image edits from the preview iframe.
  const handleElementEdited = useCallback(async (event: ElementEditEvent) => {
    if (!code) return;

    let newValue: string | undefined;

    if (event.kind === 'text') {
      newValue = event.newValue;
      if (newValue === undefined || newValue === event.oldValue) return;
    } else if (event.kind === 'image' && event.file) {
      // Upload the file first to get a public URL
      const formData = new FormData();
      formData.append('file', event.file);
      formData.append('tenant_id', `builder-${templateId}`);
      try {
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.url) {
          console.error('Upload failed:', uploadData.error);
          return;
        }
        newValue = uploadData.url;
      } catch (err) {
        console.error('Upload error:', err);
        return;
      }
    } else {
      return;
    }

    // Patch the source code via the edit endpoint
    try {
      const res = await fetch('/api/builder/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
          edit_id: event.editId,
          kind: event.kind,
          new_value: newValue,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Edit failed:', data.error);
        return;
      }
      if (data.page_code && data.page_code !== code.page_code) {
        const updatedCode = { ...code, page_code: data.page_code };
        setCode(updatedCode);
        await transpile(data.page_code);
      }
    } catch (err) {
      console.error('Edit error:', err);
    }
  }, [code, templateId, transpile]);

  const handleElementSelected = useCallback((event: ElementSelectedEvent) => {
    setSelectedElement(event);
  }, []);

  async function handleSend(content: string) {
    const userMessage: Message = { role: 'user', content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setGenerating(true);
    setShowAnimation(true);
    setActiveView('preview');

    // Snapshot the selected element so it survives clearing
    const elementContext = selectedElement;
    setSelectedElement(null);

    try {
      // Detect Figma URLs and fetch the design first
      let figmaContext = '';
      const figmaMatch = content.match(/figma\.com\/(?:file|design)\/[a-zA-Z0-9]+[^\s]*/);
      if (figmaMatch) {
        try {
          const figmaRes = await fetch('/api/builder/figma', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ figma_url: figmaMatch[0] }),
          });
          const figmaData = await figmaRes.json();
          if (figmaData.description) {
            figmaContext = `\n\n[FIGMA DESIGN DETECTED - Build the app to match this design exactly]\n${figmaData.description}`;
          }
        } catch {
          // Continue without Figma data
        }
      }

      const finalMessages = figmaContext
        ? [...updatedMessages.slice(0, -1), { role: 'user' as const, content: content + figmaContext }]
        : updatedMessages;

      const res = await fetch('/api/builder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
          messages: finalMessages,
          element_context: elementContext
            ? { editId: elementContext.editId, tag: elementContext.tag, text: elementContext.text }
            : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages([...updatedMessages, {
          role: 'assistant',
          content: `Something went wrong: ${data.error || 'Generation failed'}. Tap "Retry" or rephrase your request.`,
        }]);
        setLastFailedMessage(content);
        setGenerating(false);
        setShowAnimation(false);
        return;
      }

      setLastFailedMessage(null);

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
      setShowAnimation(false);
    } catch {
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: 'Network error — the request timed out or failed. Tap "Retry" or try a simpler request.',
      }]);
      setLastFailedMessage(content);
      setShowAnimation(false);
    }

    setGenerating(false);
  }

  // One-click update: push the latest draft to the existing deployment
  // without reopening the publish dialog. Used for "Update" button after
  // the first publish. Skips the preview capture for speed — the screenshot
  // can be refreshed by clicking "Edit publish settings" later if needed.
  async function handleQuickUpdate() {
    if (!instance) return;
    setUpdating(true);
    setUpdateToast(null);

    // Capture a fresh preview screenshot (non-fatal on failure)
    let previewUrl: string | null = null;
    try {
      const dataUrl = await livePreviewRef.current?.capturePreview();
      if (dataUrl) {
        const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          const binary = atob(match[2]);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const file = new File([bytes], `${templateId}.png`, { type: match[1] });
          const formData = new FormData();
          formData.append('file', file);
          formData.append('template_id', templateId);
          const uploadRes = await fetch('/api/builder/upload-preview', {
            method: 'POST',
            body: formData,
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            previewUrl = uploadData.url || null;
          }
        }
      }
    } catch (err) {
      console.warn('[builder] quick-update preview capture failed (non-fatal):', err);
    }

    // Re-publish with minimal fields — the server reuses the existing tenant
    // so slug, password, marketplace settings are untouched.
    const res = await fetch('/api/builder/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: templateId,
        name: templateName,
        preview_url: previewUrl,
        deploy_to_url: true,
        // Re-publish keeps existing marketplace + private state unchanged by
        // sending undefined for those fields; the server's reuse-instance
        // path doesn't touch visibility/password unless explicitly set.
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setUpdateToast(`⚠️ ${data.error || 'Update failed'}`);
      setUpdating(false);
      setTimeout(() => setUpdateToast(null), 4000);
      return;
    }

    setUpdateToast(`✓ Updated to v${data.version}`);
    setUpdating(false);
    setTimeout(() => setUpdateToast(null), 3000);
  }

  function handleDialogClose() {
    setShowPublish(false);
    // After closing the publish dialog, assume an instance now exists if
    // the user hit the success screen. We can't easily detect this from
    // here, so trust the server state via a refresh.
  }

  return (
    <>
    {/* Mobile builder — simplified chat + preview toggle */}
    <MobileBuilder
      templateName={templateName}
      messages={messages}
      onSend={handleSend}
      generating={generating}
      showAnimation={showAnimation}
      transpiledCode={transpiledCode}
      componentName={componentName}
      canRetry={!!lastFailedMessage}
      onRetry={() => lastFailedMessage && handleSend(lastFailedMessage)}
    />
    <div className="hidden sm:flex h-[calc(100vh-4rem)] flex-col">
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
            <button
              onClick={() => setActiveView('media')}
              className={`px-3 py-1.5 ${activeView === 'media' ? 'bg-gray-100 font-medium' : 'text-gray-500'}`}
            >
              Media
            </button>
          </div>
          <Button
            onClick={() => {
              if (!code) return;
              const exportData = {
                page_code: code.page_code,
                admin_code: code.admin_code,
                api_handler_code: code.api_handler_code,
              };
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${templateName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-code.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            disabled={!code}
            variant="ghost"
          >
            Export
          </Button>
          {instance ? (
            // Already published once — primary action is a one-click update
            <div className="relative flex items-center">
              <Button
                onClick={handleQuickUpdate}
                disabled={!code || updating}
                loading={updating}
                variant="secondary"
                className="rounded-r-none border-r-0"
              >
                Update
              </Button>
              <button
                type="button"
                onClick={() => setSettingsMenuOpen((v) => !v)}
                disabled={!code || updating}
                aria-label="Publish settings"
                className="rounded-lg rounded-l-none border border-l-0 border-gray-300 bg-white px-2 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {settingsMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setSettingsMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-40 mt-1 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
                    <button
                      type="button"
                      onClick={() => { setSettingsMenuOpen(false); setShowPublish(true); }}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Edit publish settings
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setSettingsMenuOpen(false);
                        const url = `https://${instance.slug}.clonebase.app`;
                        try {
                          await navigator.clipboard.writeText(url);
                          setUpdateToast('✓ Link copied');
                          setTimeout(() => setUpdateToast(null), 2000);
                        } catch {
                          // noop
                        }
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Copy live URL
                    </button>
                    <a
                      href={`https://${instance.slug}.clonebase.app`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setSettingsMenuOpen(false)}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Open live app ↗
                    </a>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Button
              onClick={() => setShowPublish(true)}
              disabled={!code}
              variant="secondary"
            >
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* Update toast */}
      {updateToast && (
        <div className="fixed right-4 top-20 z-50 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
          {updateToast}
        </div>
      )}

      {/* Split pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat panel */}
        <div className="w-[400px] min-w-[320px] border-r border-gray-200 bg-white">
          <ChatPanel
            messages={messages}
            onSend={handleSend}
            generating={generating}
            canRetry={!!lastFailedMessage}
            onRetry={() => lastFailedMessage && handleSend(lastFailedMessage)}
            selectedElement={selectedElement}
            onClearSelectedElement={() => setSelectedElement(null)}
          />
        </div>

        {/* Preview / Code / Data panel — iframe always mounted so Data tab can communicate */}
        <div className="flex-1 overflow-hidden relative">
          <div className={activeView === 'preview' ? 'h-full relative' : 'h-0 overflow-hidden'}>
            {/* Animation overlays the preview — iframe stays mounted to preserve state */}
            {showAnimation && (
              <div className="absolute inset-0 z-10">
                <GeneratingAnimation />
              </div>
            )}
            <LivePreview
              ref={livePreviewRef}
              transpiledCode={transpiledCode}
              componentName={componentName}
              onElementEdited={handleElementEdited}
              onElementSelected={handleElementSelected}
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
          {activeView === 'media' && (
            <MediaPanel />
          )}
        </div>
      </div>

      {/* Publish dialog */}
      {showPublish && (
        <PublishDialog
          templateId={templateId}
          templateName={templateName}
          onClose={handleDialogClose}
          capturePreview={() => livePreviewRef.current?.capturePreview() ?? Promise.resolve(null)}
          onPublished={(info) => {
            if (info.instance_id && info.slug) {
              setInstance({ id: info.instance_id, slug: info.slug });
            }
          }}
        />
      )}
    </div>
    </>
  );
}
