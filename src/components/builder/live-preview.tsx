'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface LivePreviewProps {
  transpiledCode: string | null;
  componentName: string;
}

export function LivePreview({ transpiledCode, componentName }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [sandboxReady, setSandboxReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.data?.type === 'sandbox-ready') {
      setSandboxReady(true);
    } else if (event.data?.type === 'preview-ready') {
      setError(null);
    } else if (event.data?.type === 'preview-error') {
      setError(event.data.error);
    }
  }, []);

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
      <iframe
        ref={iframeRef}
        src="/sandbox/preview"
        sandbox="allow-scripts"
        className={`h-full w-full border-0 ${!transpiledCode ? 'hidden' : ''}`}
        title="App Preview"
      />
    </div>
  );
}
