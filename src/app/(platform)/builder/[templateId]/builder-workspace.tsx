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
  const [upgradePrompt, setUpgradePrompt] = useState<string | null>(null);
  // Pre-flight: show design/auth pickers in chat before first generation
  const [preFlightPrompt, setPreFlightPrompt] = useState<string | null>(initialPrompt);
  const [designPreset, setDesignPreset] = useState<string | null>(null);
  const [authPref, setAuthPref] = useState<'auto' | 'yes' | 'no'>('auto');
  const [seedDataPref, setSeedDataPref] = useState<'yes' | 'no'>('yes');
  const livePreviewRef = useRef<LivePreviewHandle>(null);
  const autoCaptureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Instance tracks the creator's own deployment. Once they've published
  // once, the primary button flips from "Publish" to "Update" for one-click
  // redeploys without reopening the full dialog.
  const [instance, setInstance] = useState<ExistingInstance | null>(existingInstance);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateToast, setUpdateToast] = useState<string | null>(null);

  // Draggable split between chat and preview so users can shrink the app
  // pane to see mobile/tablet/desktop widths. Chat width is clamped to
  // [320, container - 320] so neither panel becomes unusable.
  const [chatWidth, setChatWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const splitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isResizing) return;
    function handleMouseMove(e: MouseEvent) {
      const container = splitRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      const min = 320;
      const max = Math.max(min, rect.width - 320);
      setChatWidth(Math.min(Math.max(newWidth, min), max));
    }
    function handleMouseUp() {
      setIsResizing(false);
    }
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Persist sandbox data + auth to localStorage so they survive page refresh.
  // The sandbox iframe stores data on window.__sandboxData and auth on
  // window.__sandboxAuth — we hydrate from localStorage on mount and save
  // whenever a snapshot message arrives.
  const sandboxDataKey = `clonebase-sandbox-data-${templateId}`;
  const sandboxAuthKey = `clonebase-sandbox-auth-${templateId}`;

  useEffect(() => {
    // Hydrate: restore data + auth from localStorage before iframe initializes
    try {
      const saved = localStorage.getItem(sandboxDataKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          (window as unknown as Record<string, unknown>).__sandboxData = parsed;
        }
      }
    } catch {
      // Corrupted data — start fresh
    }
    try {
      const savedAuth = localStorage.getItem(sandboxAuthKey);
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed && typeof parsed === 'object') {
          (window as unknown as Record<string, unknown>).__sandboxAuth = parsed;
        }
      }
    } catch {
      // Corrupted auth — start fresh
    }

    // Save: listen for snapshot messages from the sandbox and persist
    function handleSnapshot(event: MessageEvent) {
      if (event.data?.type === 'data-snapshot') {
        const sandboxData = (window as unknown as { __sandboxData?: Record<string, unknown[]> }).__sandboxData;
        if (sandboxData) {
          try {
            localStorage.setItem(sandboxDataKey, JSON.stringify(sandboxData));
          } catch {
            // localStorage full or unavailable — non-fatal
          }
        }
      } else if (event.data?.type === 'auth-snapshot') {
        const sandboxAuth = (window as unknown as { __sandboxAuth?: unknown }).__sandboxAuth;
        if (sandboxAuth) {
          try {
            localStorage.setItem(sandboxAuthKey, JSON.stringify(sandboxAuth));
          } catch {
            // localStorage full or unavailable — non-fatal
          }
        }
      }
    }

    window.addEventListener('message', handleSnapshot);
    return () => window.removeEventListener('message', handleSnapshot);
  }, [sandboxDataKey, sandboxAuthKey]);

  // Transpile code for preview whenever it changes.
  // Retries up to 3 times to handle cold-start latency and transient errors.
  // Returns { ok: true } on success or { ok: false, error } after all retries
  // fail — callers must surface the error to the user instead of leaving the
  // preview blank.
  const transpile = useCallback(async (pageCode: string): Promise<{ ok: true } | { ok: false; error: string }> => {
    let lastError = 'Transpilation failed after 3 attempts';
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch('/api/builder/transpile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: pageCode }),
        });
        const data = await res.json();
        if (data.transpiled) {
          setTranspiledCode(data.transpiled);
          const match = pageCode.match(/export\s+function\s+(\w+)/);
          if (match) setComponentName(match[1]);
          return { ok: true };
        }
        lastError = data.details || data.error || lastError;
        console.warn(`[builder] transpile attempt ${attempt + 1}: no result`, data.error);
      } catch (err) {
        lastError = (err as Error)?.message || lastError;
        console.warn(`[builder] transpile attempt ${attempt + 1} failed:`, err);
      }
      if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
    }
    return { ok: false, error: lastError };
  }, []);

  // Auto-capture a preview screenshot after code generation so that even
  // draft (unpublished) apps have thumbnails on the dashboard.
  const scheduleAutoCapture = useCallback(() => {
    if (autoCaptureTimer.current) clearTimeout(autoCaptureTimer.current);
    autoCaptureTimer.current = setTimeout(async () => {
      try {
        const dataUrl = await livePreviewRef.current?.capturePreview();
        if (!dataUrl) return;
        const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) return;
        const binary = atob(match[2]);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const file = new File([bytes], `${templateId}.png`, { type: match[1] });
        const formData = new FormData();
        formData.append('file', file);
        formData.append('template_id', templateId);
        await fetch('/api/builder/upload-preview', { method: 'POST', body: formData });
      } catch {
        // Silent — auto-capture is best-effort
      }
    }, 3000); // Wait 3s for iframe to render the new code
  }, [templateId]);

  // Transpile existing code on mount
  useEffect(() => {
    if (existingCode?.page_code) {
      transpile(existingCode.page_code);
    }
  }, [existingCode, transpile]);

  // Clean the URL on mount so a refresh doesn't re-enter pre-flight mode
  useEffect(() => {
    if (initialPrompt) {
      window.history.replaceState({}, '', `/builder/${templateId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Called from the ChatPanel pre-flight UI when user clicks "Generate"
  function handleStartGenerate() {
    if (!preFlightPrompt) return;
    const prompt = preFlightPrompt;
    setPreFlightPrompt(null);
    handleSend(prompt);
  }

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

    // Optimistically decrement the credits badge immediately
    window.dispatchEvent(new CustomEvent('credits-updated', { detail: { delta: -1 } }));

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

      // Include design/auth preferences on the first generation only
      const isFirstGen = messages.length === 0;
      const extraParams: Record<string, string> = {};
      if (isFirstGen && designPreset) extraParams.design_preset = designPreset;
      if (isFirstGen && authPref !== 'auto') extraParams.auth_preference = authPref;
      if (isFirstGen && seedDataPref === 'no') extraParams.seed_data_preference = 'no';

      const res = await fetch('/api/builder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
          messages: finalMessages,
          element_context: elementContext
            ? { editId: elementContext.editId, tag: elementContext.tag, text: elementContext.text }
            : undefined,
          ...extraParams,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Credit/limit errors (402 = out of credits, 403 = app limit or feature gate)
        // → show a prominent upgrade prompt in the preview pane
        if (res.status === 402 || res.status === 403) {
          setUpgradePrompt(data.error || 'Upgrade your plan to continue building.');
          setMessages([...updatedMessages, {
            role: 'assistant',
            content: data.error || 'You need to upgrade your plan to continue.',
          }]);
        } else {
          setMessages([...updatedMessages, {
            role: 'assistant',
            content: `Something went wrong: ${data.error || 'Generation failed'}. Tap "Retry" or rephrase your request.`,
          }]);
          setLastFailedMessage(content);
        }
        // Revert optimistic credit decrement on failure
        window.dispatchEvent(new CustomEvent('credits-updated', { detail: { delta: 1 } }));
        setGenerating(false);
        setShowAnimation(false);
        return;
      }

      // Clear any previous upgrade prompt on success
      setUpgradePrompt(null);

      setLastFailedMessage(null);

      // Update code
      const newCode: GeneratedCode = {
        page_code: data.page_code,
        admin_code: data.admin_code,
        api_handler_code: data.api_handler_code,
      };
      setCode(newCode);

      const explanation = data.explanation;
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: explanation,
      }]);

      // Transpile for preview. If this fails after all retries, surface the
      // error — otherwise the animation dismisses and the user is left with
      // a blank preview (the "white screen" bug).
      const transpileResult = await transpile(data.page_code);
      setShowAnimation(false);
      if (!transpileResult.ok) {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: `I generated your app but couldn't prepare the preview: ${transpileResult.error}. Tap "Retry" to regenerate.`,
        }]);
        setLastFailedMessage(content);
      }

      // Auto-capture a preview thumbnail so the dashboard shows it
      scheduleAutoCapture();

      // Confirm the credits badge with the real remaining count from the API
      if (typeof data.credits_remaining === 'number') {
        window.dispatchEvent(new CustomEvent('credits-updated', { detail: { remaining: data.credits_remaining } }));
      }
    } catch {
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: 'Network error — the request timed out or failed. Tap "Retry" or try a simpler request.',
      }]);
      setLastFailedMessage(content);
      setShowAnimation(false);
      // Revert optimistic credit decrement on network error
      window.dispatchEvent(new CustomEvent('credits-updated', { detail: { delta: 1 } }));
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
    const sandboxData = (window as unknown as { __sandboxData?: Record<string, unknown[]> }).__sandboxData;
    const res = await fetch('/api/builder/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: templateId,
        name: templateName,
        ...(previewUrl ? { preview_url: previewUrl } : {}),
        deploy_to_url: true,
        seed_data: sandboxData && Object.keys(sandboxData).length > 0 ? sandboxData : undefined,
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
      preFlightPrompt={preFlightPrompt}
      designPreset={designPreset}
      onDesignPresetChange={setDesignPreset}
      authPref={authPref}
      onAuthPrefChange={setAuthPref}
      seedDataPref={seedDataPref}
      onSeedDataPrefChange={setSeedDataPref}
      onStartGenerate={handleStartGenerate}
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
      <div ref={splitRef} className="flex flex-1 overflow-hidden">
        {/* Chat panel */}
        <div className="bg-white flex-shrink-0" style={{ width: chatWidth }}>
          <ChatPanel
            messages={messages}
            onSend={handleSend}
            generating={generating}
            canRetry={!!lastFailedMessage}
            onRetry={() => lastFailedMessage && handleSend(lastFailedMessage)}
            selectedElement={selectedElement}
            onClearSelectedElement={() => setSelectedElement(null)}
            preFlightPrompt={preFlightPrompt}
            designPreset={designPreset}
            onDesignPresetChange={setDesignPreset}
            authPref={authPref}
            onAuthPrefChange={setAuthPref}
            seedDataPref={seedDataPref}
            onSeedDataPrefChange={setSeedDataPref}
            onStartGenerate={handleStartGenerate}
          />
        </div>

        {/* Drag handle — resize preview to test responsive widths. pointer-events
            on the preview pane is disabled during drag so iframe doesn't eat mouse events. */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
          className={`w-1 flex-shrink-0 cursor-col-resize transition-colors ${
            isResizing ? 'bg-indigo-500' : 'bg-gray-200 hover:bg-indigo-400'
          }`}
          title="Drag to resize the preview (desktop / tablet / mobile)"
        />

        {/* Preview / Code / Data panel — iframe always mounted so Data tab can communicate */}
        <div
          className="flex-1 overflow-hidden relative"
          style={{ pointerEvents: isResizing ? 'none' : undefined }}
        >
          <div className={activeView === 'preview' ? 'h-full relative' : 'h-0 overflow-hidden'}>
            {/* Animation overlays the preview — iframe stays mounted to preserve state */}
            {showAnimation && (
              <div className="absolute inset-0 z-10">
                <GeneratingAnimation />
              </div>
            )}

            {/* Upgrade prompt — overlays the preview when user hits limits */}
            {upgradePrompt && activeView === 'preview' && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/95 backdrop-blur-sm">
                <div className="max-w-md text-center px-6">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 text-indigo-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-gray-900">Upgrade to keep building</h2>
                  <p className="mt-2 text-sm text-gray-600">{upgradePrompt}</p>
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a href="/pricing">
                      <Button className="bg-indigo-600 hover:bg-indigo-500 px-6">
                        View Plans
                      </Button>
                    </a>
                    <button
                      onClick={() => setUpgradePrompt(null)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
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
          sandboxData={(window as unknown as { __sandboxData?: Record<string, unknown[]> }).__sandboxData}
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
