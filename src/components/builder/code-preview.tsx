'use client';

import { useState } from 'react';

interface CodePreviewProps {
  pageCode: string | null;
  adminCode: string | null;
  apiHandlerCode: string | null;
}

export function CodePreview({ pageCode, adminCode, apiHandlerCode }: CodePreviewProps) {
  const tabs = [
    { key: 'page', label: 'page.tsx', code: pageCode },
    ...(adminCode ? [{ key: 'admin', label: 'admin.tsx', code: adminCode }] : []),
    ...(apiHandlerCode ? [{ key: 'api', label: 'api/handler.ts', code: apiHandlerCode }] : []),
  ];

  const [activeTab, setActiveTab] = useState('page');
  const activeCode = tabs.find((t) => t.key === activeTab)?.code;

  if (!pageCode) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-900 text-gray-500">
        <p className="text-sm">Code will appear here once generated.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gray-900">
      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-gray-800 text-white border-b-2 border-indigo-500'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Code */}
      <pre className="flex-1 overflow-auto p-4 text-xs leading-relaxed text-gray-300">
        <code>{activeCode}</code>
      </pre>
    </div>
  );
}
