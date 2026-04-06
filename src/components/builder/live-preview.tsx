'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

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

interface LivePreviewProps {
  transpiledCode: string | null;
  componentName: string;
  onElementEdited?: (event: ElementEditEvent) => void;
  onElementSelected?: (event: ElementSelectedEvent) => void;
}

export function LivePreview({ transpiledCode, componentName, onElementEdited, onElementSelected }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [sandboxReady, setSandboxReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const handleMessage = useCallback((event: MessageEvent) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'sandbox-ready') {
      setSandboxReady(true);
    } else if (data.type === 'preview-ready') {
      setError(null);
    } else if (data.type === 'preview-error') {
      setError(data.error);
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
  }, [onElementEdited, onElementSelected]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  // Send code to iframe when ready
  useEffect(() => {
    if (sandboxReady && transpiledCode && iframeRef.current?.contentWindow) {
      setError(null);
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
}
