'use client';

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { captureError } from '@/lib/monitoring';

export interface ElementEditEvent {
  kind: 'text' | 'image';
  editId: string;
  oldValue?: string;
  newValue?: string;
  file?: File;
}

export interface ElementSelectedEvent {
  editId: string;
  tag: string;
  text: string;
}

export interface LivePreviewHandle {
  /**
   * Captures a screenshot of the current preview via html2canvas running inside
   * the sandbox iframe. Resolves with a base64 PNG data URL, or null on failure.
   * Used by the publish flow to generate the template's preview_url.
   */
  capturePreview(): Promise<string | null>;
}

interface LivePreviewProps {
  transpiledCode: string | null;
  componentName: string;
  initialSandboxData?: Record<string, unknown[]>;
  initialSandboxAuth?: unknown;
  onElementEdited?: (event: ElementEditEvent) => void;
  onElementSelected?: (event: ElementSelectedEvent) => void;
  // Fired when generated code crashes at runtime inside the iframe (React
  // render error, unhandled promise, etc). Caller uses this to trigger the
  // Phase 2 autofix on runtime failures, not just transpile failures.
  onPreviewError?: (error: { message: string; stack: string | null; code: string | null }) => void;
}

export const LivePreview = forwardRef<LivePreviewHandle, LivePreviewProps>(function LivePreview(
  { transpiledCode, componentName, initialSandboxData, initialSandboxAuth, onElementEdited, onElementSelected, onPreviewError },
  forwardedRef
) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [sandboxReady, setSandboxReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Pending capture requests — resolved when the matching capture-result arrives
  const captureResolvers = useRef(new Map<string, (dataUrl: string | null) => void>());

  useImperativeHandle(forwardedRef, () => ({
    async capturePreview() {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow || !sandboxReady) return null;

      return new Promise<string | null>((resolve) => {
        const requestId = `cap-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        captureResolvers.current.set(requestId, resolve);

        iframe.contentWindow!.postMessage({ type: 'capture', requestId }, '*');

        // Safety timeout: html2canvas usually takes 1-3s on typical apps.
        // After 10s, assume it failed and resolve null.
        setTimeout(() => {
          if (captureResolvers.current.has(requestId)) {
            captureResolvers.current.delete(requestId);
            resolve(null);
          }
        }, 10_000);
      });
    },
  }), [sandboxReady]);

  const handleMessage = useCallback((event: MessageEvent) => {
    const previewWindow = iframeRef.current?.contentWindow;
    if (!previewWindow || event.source !== previewWindow) return;

    const data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'sandbox-ready') {
      setSandboxReady(true);
      previewWindow.postMessage({
        type: 'hydrate-sandbox',
        collections: initialSandboxData || {},
        auth: initialSandboxAuth || null,
      }, '*');
    } else if (data.type === 'preview-ready') {
      setError(null);
    } else if (data.type === 'preview-error') {
      setError(data.error);
      // Forward generated-code runtime errors (evaluated inside the iframe
      // via new Function) to Sentry. The iframe posts message + optional
      // stack — we reconstruct an Error so Sentry gets proper grouping.
      const err = new Error(data.error || 'Sandbox runtime error');
      if (data.stack) err.stack = data.stack;
      captureError(err, {
        subsystem: 'sandbox',
        extra: { preview_code: data.code?.slice?.(0, 4000) },
      });
      onPreviewError?.({
        message: data.error || 'Sandbox runtime error',
        stack: data.stack || null,
        code: data.code || null,
      });
    } else if (data.type === 'capture-result') {
      const resolver = captureResolvers.current.get(data.requestId);
      if (resolver) {
        captureResolvers.current.delete(data.requestId);
        if (data.error) {
          // Surface the sandbox-side error to the parent console for debugging
          console.warn('[live-preview] capture failed:', data.error, data.stack || '');
          resolver(null);
        } else {
          resolver(data.dataUrl || null);
        }
      }
    } else if (data.type === 'element-edited') {
      onElementEdited?.({
        kind: data.kind,
        editId: data.editId,
        oldValue: data.oldValue,
        newValue: data.newValue,
        file: data.file,
      });
    } else if (data.type === 'element-selected') {
      onElementSelected?.({
        editId: data.editId,
        tag: data.tag,
        text: data.text,
      });
    }
  }, [initialSandboxAuth, initialSandboxData, onElementEdited, onElementSelected, onPreviewError]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  // Send code to iframe when ready
  useEffect(() => {
    if (sandboxReady && transpiledCode && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'render',
        code: transpiledCode,
        componentName,
      }, '*');
    }
  }, [sandboxReady, transpiledCode, componentName]);

  // Sync edit mode to iframe
  useEffect(() => {
    if (sandboxReady && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'set-edit-mode',
        enabled: editMode,
      }, '*');
    }
  }, [sandboxReady, editMode]);

  return (
    <div className="relative h-full w-full">
      {!transpiledCode && (
        <div className="flex h-full items-center justify-center bg-gray-50 text-gray-400">
          <div className="text-center">
            <p className="text-lg font-medium">Preview</p>
            <p className="mt-1 text-sm">Your app will appear here once generated.</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-700 font-mono">
          {error}
        </div>
      )}
      {transpiledCode && (
        <button
          type="button"
          onClick={() => setEditMode((m) => !m)}
          className={`absolute top-3 right-3 z-20 rounded-lg px-3 py-1.5 text-xs font-medium shadow-md transition-colors ${
            editMode
              ? 'bg-indigo-600 text-white hover:bg-indigo-500'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
          title={editMode ? 'Exit edit mode' : 'Edit text and images'}
        >
          {editMode ? '✓ Editing' : '✏️ Edit'}
        </button>
      )}
      {editMode && (
        <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 z-20 rounded-full bg-indigo-600 px-4 py-1 text-xs font-medium text-white shadow-md">
          Click text/images to edit · Shift+click any element to ask AI
        </div>
      )}
      <iframe
        ref={iframeRef}
        src="/sandbox/preview"
        sandbox="allow-scripts"
        className={`h-full w-full border-0 ${!transpiledCode ? 'hidden' : ''} ${editMode ? 'ring-4 ring-inset ring-indigo-500' : ''}`}
        title="App Preview"
      />
    </div>
  );
});
