'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface DataRow {
  id: string;
  collection: string;
  data: Record<string, unknown>;
  created_at: string;
}

interface DataPanelProps {
  templateId: string;
}

// Communicates with the preview iframe to read/write sandbox data.
// The iframe holds all data in-memory via the SDK shims.
export function DataPanel({ templateId }: DataPanelProps) {
  const [collections, setCollections] = useState<Record<string, DataRow[]>>({});
  const [activeCollection, setActiveCollection] = useState<string>('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editJson, setEditJson] = useState('');
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newJson, setNewJson] = useState('{\n  \n}');

  // Listen for data updates from the preview iframe
  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.data?.type === 'data-snapshot') {
      const snapshot = event.data.collections as Record<string, DataRow[]>;
      setCollections(snapshot);
      if (!activeCollection && Object.keys(snapshot).length > 0) {
        setActiveCollection(Object.keys(snapshot)[0]);
      }
    }
  }, [activeCollection]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  // Request data snapshot from iframe
  useEffect(() => {
    const interval = setInterval(() => {
      const iframe = document.querySelector('iframe[title="App Preview"]') as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'request-data' }, '*');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeRows = collections[activeCollection] || [];
  const collectionNames = Object.keys(collections);

  function sendToIframe(message: Record<string, unknown>) {
    const iframe = document.querySelector('iframe[title="App Preview"]') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(message, '*');
    }
  }

  function handleDelete(collection: string, rowId: string) {
    if (!window.confirm('Delete this record?')) return;
    sendToIframe({ type: 'data-delete', collection, id: rowId });
  }

  function handleUpdate(collection: string, rowId: string) {
    try {
      const parsed = JSON.parse(editJson);
      sendToIframe({ type: 'data-update', collection, id: rowId, data: parsed });
      setEditingRow(null);
    } catch {
      alert('Invalid JSON');
    }
  }

  function handleInsert(collection: string) {
    try {
      const parsed = JSON.parse(newJson);
      sendToIframe({ type: 'data-insert', collection, data: parsed });
      setAddingTo(null);
      setNewJson('{\n  \n}');
    } catch {
      alert('Invalid JSON');
    }
  }

  if (collectionNames.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 text-center p-8">
        <div>
          <p className="text-4xl">🗃️</p>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No data yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Interact with the app in the Preview tab to generate data,
            or the app will seed data on first render.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Collection tabs + add button */}
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-2 overflow-x-auto">
        {collectionNames.map((name) => (
          <button
            key={name}
            onClick={() => setActiveCollection(name)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              activeCollection === name
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {name} ({(collections[name] || []).length})
          </button>
        ))}
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <span className="text-xs text-gray-500">{activeRows.length} records</span>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setAddingTo(addingTo === activeCollection ? null : activeCollection)}
        >
          {addingTo === activeCollection ? 'Cancel' : '+ Add Record'}
        </Button>
      </div>

      {/* Add record form */}
      {addingTo === activeCollection && (
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-medium text-gray-700 mb-2">New record JSON:</p>
          <textarea
            value={newJson}
            onChange={(e) => setNewJson(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <Button size="sm" className="mt-2" onClick={() => handleInsert(activeCollection)}>
            Insert
          </Button>
        </div>
      )}

      {/* Data rows */}
      <div className="flex-1 overflow-y-auto">
        {activeRows.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">No records in &quot;{activeCollection}&quot;</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {activeRows.map((row) => (
              <div key={row.id} className="group">
                <button
                  onClick={() => {
                    setExpanded(expanded === row.id ? null : row.id);
                    setEditingRow(null);
                    setEditJson(JSON.stringify(row.data, null, 2));
                  }}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[10px] font-mono text-gray-400">{row.id.slice(0, 8)}</span>
                    <span className="text-sm truncate">
                      {String(row.data.name || row.data.title || row.data.email || row.data.text || row.data.content || '').slice(0, 50) || 'Record'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{expanded === row.id ? '▾' : '▸'}</span>
                </button>

                {expanded === row.id && (
                  <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
                    {editingRow === row.id ? (
                      <>
                        <textarea
                          value={editJson}
                          onChange={(e) => setEditJson(e.target.value)}
                          rows={8}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" onClick={() => handleUpdate(activeCollection, row.id)}>Save</Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditingRow(null)}>Cancel</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <pre className="text-xs text-gray-700 bg-white rounded-lg p-3 overflow-x-auto whitespace-pre-wrap border border-gray-200">
                          {JSON.stringify(row.data, null, 2)}
                        </pre>
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => setEditingRow(row.id)}>Edit</Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(activeCollection, row.id)}>Delete</Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
