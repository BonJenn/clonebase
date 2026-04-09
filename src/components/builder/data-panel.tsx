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

const COLLECTION_ICONS: Record<string, string> = {
  menu_items: '🍽️', locations: '📍', reviews: '⭐', team_members: '👥',
  gallery: '🖼️', posts: '📝', messages: '💬', profiles: '👤',
  products: '🛍️', orders: '📦', events: '📅', tasks: '✅',
  recipes: '🍳', workouts: '💪', lessons: '📚', questions: '❓',
};

function getIcon(name: string): string {
  return COLLECTION_ICONS[name] || '📁';
}

function formatFieldName(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function isImageUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return value.startsWith('http') && /\.(jpg|jpeg|png|gif|webp|svg)/i.test(value) || value.includes('picsum.photos');
}

export function DataPanel({ templateId }: DataPanelProps) {
  const [collections, setCollections] = useState<Record<string, DataRow[]>>({});
  const [activeCollection, setActiveCollection] = useState<string>('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editJson, setEditJson] = useState('');
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newJson, setNewJson] = useState('{\n  \n}');
  // Diagnostic counters — visible at the top of the panel so we can tell if
  // polling/push is actually delivering snapshots from the sandbox iframe.
  const [reqCount, setReqCount] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [lastSnapshotAt, setLastSnapshotAt] = useState<number | null>(null);

  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.data?.type === 'data-snapshot') {
      const snapshot = event.data.collections as Record<string, DataRow[]>;
      const totalItems = Object.values(snapshot).reduce((sum, rows) => sum + rows.length, 0);
      console.log('[data-panel] received snapshot — collections:', Object.keys(snapshot), 'total items:', totalItems);
      setCollections(snapshot);
      setSnapCount((n) => n + 1);
      setLastSnapshotAt(Date.now());
      if (!activeCollection && Object.keys(snapshot).length > 0) {
        setActiveCollection(Object.keys(snapshot)[0]);
      }
    }
  }, [activeCollection]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  useEffect(() => {
    function requestSnapshot() {
      const iframe = document.querySelector('iframe[title="App Preview"]') as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'request-data' }, '*');
        setReqCount((n) => n + 1);
      } else {
        console.warn('[data-panel] no iframe found with title="App Preview"');
      }
    }
    // Fire immediately so we don't wait 1s on mount, then every 1s after
    // as a safety net in case any push broadcasts are missed.
    requestSnapshot();
    const interval = setInterval(requestSnapshot, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeRows = collections[activeCollection] || [];
  const collectionNames = Object.keys(collections);

  function exportData(format: 'json' | 'csv') {
    const data = format === 'json' ? exportAsJson() : exportAsCsv();
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeCollection || 'data'}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportAsJson(): string {
    if (activeCollection) return JSON.stringify(activeRows.map(r => r.data), null, 2);
    const all: Record<string, unknown[]> = {};
    for (const [name, rows] of Object.entries(collections)) all[name] = rows.map(r => r.data);
    return JSON.stringify(all, null, 2);
  }

  function exportAsCsv(): string {
    if (activeRows.length === 0) return '';
    const allKeys = new Set<string>();
    activeRows.forEach(r => Object.keys(r.data).forEach(k => allKeys.add(k)));
    const keys = Array.from(allKeys);
    const header = keys.join(',');
    const lines = activeRows.map(r =>
      keys.map(k => {
        const val = r.data[k];
        const str = val === null || val === undefined ? '' : String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(',')
    );
    return [header, ...lines].join('\n');
  }

  function sendToIframe(message: Record<string, unknown>) {
    const iframe = document.querySelector('iframe[title="App Preview"]') as HTMLIFrameElement;
    if (iframe?.contentWindow) iframe.contentWindow.postMessage(message, '*');
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
    } catch { alert('Invalid JSON'); }
  }

  function handleInsert(collection: string) {
    try {
      const parsed = JSON.parse(newJson);
      sendToIframe({ type: 'data-insert', collection, data: parsed });
      setAddingTo(null);
      setNewJson('{\n  \n}');
    } catch { alert('Invalid JSON'); }
  }

  const debugBar = (
    <div className="border-b border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-mono text-amber-800">
      requests sent: {reqCount} · snapshots received: {snapCount}
      {lastSnapshotAt && ` · last: ${((Date.now() - lastSnapshotAt) / 1000).toFixed(1)}s ago`}
      {reqCount > 0 && snapCount === 0 && ' · ⚠ iframe not responding — check console'}
    </div>
  );

  if (collectionNames.length === 0) {
    return (
      <div className="flex h-full flex-col bg-gray-50">
        {debugBar}
        <div className="flex flex-1 items-center justify-center text-center p-8">
          <div>
            <p className="text-4xl">🗃️</p>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No data yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Interact with the app in the Preview tab to generate data,
              or the app will seed data on first render.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {debugBar}
      <div className="flex flex-1 overflow-hidden">
      {/* Sidebar — collection folders */}
      <div className="w-48 shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          Collections
        </div>
        {collectionNames.map((name) => (
          <button
            key={name}
            onClick={() => setActiveCollection(name)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
              activeCollection === name
                ? 'bg-white border-r-2 border-indigo-600 text-gray-900 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{getIcon(name)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate">{formatFieldName(name)}</p>
              <p className="text-[10px] text-gray-400">{(collections[name] || []).length} items</p>
            </div>
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getIcon(activeCollection)}</span>
            <h3 className="font-semibold text-sm">{formatFieldName(activeCollection)}</h3>
            <span className="text-xs text-gray-400">({activeRows.length})</span>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => exportData('json')}>JSON</Button>
            <Button size="sm" variant="ghost" onClick={() => exportData('csv')}>CSV</Button>
            <Button size="sm" variant="secondary" onClick={() => setAddingTo(addingTo ? null : activeCollection)}>
              {addingTo ? 'Cancel' : '+ Add'}
            </Button>
          </div>
        </div>

        {/* Add record form */}
        {addingTo === activeCollection && (
          <div className="border-b border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-700 mb-2">New record:</p>
            <textarea
              value={newJson}
              onChange={(e) => setNewJson(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <Button size="sm" className="mt-2" onClick={() => handleInsert(activeCollection)}>Insert</Button>
          </div>
        )}

        {/* Records */}
        <div className="flex-1 overflow-y-auto">
          {activeRows.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-3xl">{getIcon(activeCollection)}</p>
              <p className="mt-2 text-sm text-gray-500">No {formatFieldName(activeCollection).toLowerCase()} yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {activeRows.map((row) => {
                const data = row.data;
                const title = String(data.name || data.title || data.email || data.username || data.content || '').slice(0, 60) || 'Record';
                const subtitle = String(data.description || data.category || data.type || data.role || '').slice(0, 80);
                const imageField = Object.entries(data).find(([, v]) => isImageUrl(v));

                return (
                  <div key={row.id} className="group">
                    <button
                      onClick={() => {
                        setExpanded(expanded === row.id ? null : row.id);
                        setEditingRow(null);
                        setEditJson(JSON.stringify(row.data, null, 2));
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                    >
                      {/* Thumbnail */}
                      {imageField ? (
                        <img
                          src={String(imageField[1])}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-sm shrink-0">
                          {getIcon(activeCollection)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{title}</p>
                        {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
                      </div>
                      {data.price !== undefined && (
                        <span className="text-sm font-semibold text-gray-700 shrink-0">
                          ${Number(data.price).toFixed(2)}
                        </span>
                      )}
                      {data.rating !== undefined && (
                        <span className="text-xs text-yellow-600 shrink-0">{'⭐'.repeat(Math.min(5, Number(data.rating)))}</span>
                      )}
                      <span className="text-gray-400 text-xs shrink-0">{expanded === row.id ? '▾' : '▸'}</span>
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
                            {/* Visual field display */}
                            <div className="space-y-2">
                              {Object.entries(data).filter(([k]) => k !== 'id').map(([key, value]) => (
                                <div key={key} className="flex gap-2">
                                  <span className="text-xs font-medium text-gray-500 w-24 shrink-0">{formatFieldName(key)}</span>
                                  {isImageUrl(value) ? (
                                    <img src={String(value)} alt="" className="h-16 rounded-lg object-cover" />
                                  ) : Array.isArray(value) ? (
                                    <div className="flex flex-wrap gap-1">
                                      {value.map((v, i) => (
                                        <span key={i} className="rounded-full bg-gray-200 px-2 py-0.5 text-xs">{String(v)}</span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-700">{String(value)}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 flex gap-2">
                              <Button size="sm" variant="secondary" onClick={() => setEditingRow(row.id)}>Edit</Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDelete(activeCollection, row.id)}>Delete</Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
