'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface StorageFile {
  name: string;
  url: string;
  size: number;
  type: string;
  created_at: string;
}

interface StorageBrowserProps {
  files: StorageFile[];
  tenantId: string;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function isImage(type: string): boolean {
  return type.startsWith('image/');
}

function getFileEmoji(type: string): string {
  if (type.startsWith('image/')) return '🖼️';
  if (type === 'application/pdf') return '📄';
  if (type.includes('spreadsheet') || type === 'text/csv') return '📊';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.startsWith('text/')) return '📃';
  return '📎';
}

export function StorageBrowser({ files, tenantId }: StorageBrowserProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selected, setSelected] = useState<StorageFile | null>(null);
  const [filter, setFilter] = useState<'all' | 'images' | 'documents'>('all');

  const filtered = files.filter(f => {
    if (filter === 'images') return isImage(f.type);
    if (filter === 'documents') return !isImage(f.type);
    return true;
  });

  const imageCount = files.filter(f => isImage(f.type)).length;
  const docCount = files.filter(f => !isImage(f.type)).length;
  const totalSize = files.reduce((s, f) => s + f.size, 0);

  if (files.length === 0) {
    return (
      <div className="mt-12 text-center">
        <p className="text-sm font-medium text-gray-400">No files yet</p>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">No files uploaded yet</h3>
        <p className="mt-1 text-sm text-gray-500">Files will appear here as users upload them through your app.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-500">Total Files</p>
          <p className="mt-1 text-lg sm:text-xl font-bold">{files.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-500">Storage Used</p>
          <p className="mt-1 text-lg sm:text-xl font-bold">{formatSize(totalSize)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-500">Images / Docs</p>
          <p className="mt-1 text-lg sm:text-xl font-bold">{imageCount} / {docCount}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(['all', 'images', 'documents'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-gray-200 text-xs">
          <button
            onClick={() => setView('grid')}
            className={`px-3 py-1.5 ${view === 'grid' ? 'bg-gray-100 font-medium' : 'text-gray-500'}`}
          >
            Grid
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 ${view === 'list' ? 'bg-gray-100 font-medium' : 'text-gray-500'}`}
          >
            List
          </button>
        </div>
      </div>

      {/* Grid view */}
      {view === 'grid' ? (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((file) => (
            <button
              key={file.name}
              onClick={() => setSelected(file)}
              className="group rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-lg transition-all text-left"
            >
              <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                {isImage(file.type) ? (
                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">{getFileEmoji(file.type)}</span>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-gray-900 truncate">{file.name.split('-').slice(1).join('-') || file.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{formatSize(file.size)}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">File</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filtered.map((file) => (
                <tr key={file.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {isImage(file.type) ? (
                        <img src={file.url} alt="" className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <span className="text-lg">{getFileEmoji(file.type)}</span>
                      )}
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {file.name.split('-').slice(1).join('-') || file.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{file.type.split('/')[1]}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatSize(file.size)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {file.created_at ? new Date(file.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelected(file)}
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* File preview modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-2xl rounded-t-xl sm:rounded-xl bg-white p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{selected.name.split('-').slice(1).join('-') || selected.name}</h3>
                <p className="text-sm text-gray-500">{selected.type} · {formatSize(selected.size)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="mt-4">
              {isImage(selected.type) ? (
                <img src={selected.url} alt={selected.name} className="w-full rounded-lg" />
              ) : selected.type === 'application/pdf' ? (
                <iframe src={selected.url} className="w-full h-96 rounded-lg border" />
              ) : (
                <div className="flex flex-col items-center py-12">
                  <span className="text-6xl">{getFileEmoji(selected.type)}</span>
                  <p className="mt-4 text-gray-600">Preview not available for this file type.</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <a href={selected.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button className="w-full">Download</Button>
              </a>
              <Button variant="secondary" className="w-full sm:w-auto" onClick={() => {
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
