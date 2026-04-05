'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface DataRow {
  id: string;
  collection: string;
  data: Record<string, unknown>;
}

interface MediaItem {
  url: string;
  field: string;
  collection: string;
  rowId: string;
  rowTitle: string;
}

function isImageUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return (value.startsWith('http') && /\.(jpg|jpeg|png|gif|webp|svg)/i.test(value)) || value.includes('picsum.photos') || value.startsWith('data:image');
}

export function MediaPanel() {
  const [collections, setCollections] = useState<Record<string, DataRow[]>>({});
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.data?.type === 'data-snapshot') {
      setCollections(event.data.collections as Record<string, DataRow[]>);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  useEffect(() => {
    const interval = setInterval(() => {
      const iframe = document.querySelector('iframe[title="App Preview"]') as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'request-data' }, '*');
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Extract all image URLs from all collections
  const allMedia: MediaItem[] = [];
  for (const [collection, rows] of Object.entries(collections)) {
    for (const row of rows) {
      for (const [field, value] of Object.entries(row.data)) {
        if (isImageUrl(value)) {
          allMedia.push({
            url: String(value),
            field,
            collection,
            rowId: row.id,
            rowTitle: String(row.data.name || row.data.title || row.data.caption || '').slice(0, 40) || 'Untitled',
          });
        }
      }
    }
  }

  const collectionNames = [...new Set(allMedia.map(m => m.collection))];
  const filtered = filter === 'all' ? allMedia : allMedia.filter(m => m.collection === filter);

  if (allMedia.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 text-center p-8">
        <div>
          <p className="text-4xl">🖼️</p>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No media yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Images will appear here once the app has data with image URLs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-lg">🖼️</span>
          <h3 className="font-semibold text-sm">Media</h3>
          <span className="text-xs text-gray-400">({allMedia.length} images)</span>
        </div>
      </div>

      {/* Filter by collection */}
      {collectionNames.length > 1 && (
        <div className="flex gap-2 px-4 py-2 border-b border-gray-100 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({allMedia.length})
          </button>
          {collectionNames.map(name => {
            const count = allMedia.filter(m => m.collection === name).length;
            return (
              <button
                key={name}
                onClick={() => setFilter(name)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  filter === name ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {name.replace(/_/g, ' ')} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Image grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((item, i) => (
            <button
              key={`${item.rowId}-${item.field}-${i}`}
              onClick={() => setSelected(item)}
              className="group rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all text-left"
            >
              <div className="aspect-square bg-gray-100 overflow-hidden">
                <img
                  src={item.url}
                  alt={item.rowTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="p-2">
                <p className="text-xs font-medium truncate">{item.rowTitle}</p>
                <p className="text-[10px] text-gray-400">{item.collection.replace(/_/g, ' ')}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Preview modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelected(null)}>
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold">{selected.rowTitle}</h3>
                <p className="text-sm text-gray-500">{selected.collection.replace(/_/g, ' ')} → {selected.field.replace(/_/g, ' ')}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <img src={selected.url} alt={selected.rowTitle} className="w-full rounded-lg" />
            <div className="mt-4 flex gap-3">
              <a href={selected.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button className="w-full">Open Full Size</Button>
              </a>
              <Button variant="secondary" onClick={() => {
                navigator.clipboard.writeText(selected.url);
              }}>
                Copy URL
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
