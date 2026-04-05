'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface DataBrowserProps {
  tenantId: string;
  collections: { collection: string; count: number }[];
}

interface DataRow {
  id: string;
  collection: string;
  data: Record<string, unknown>;
  created_at: string;
}

export function DataBrowser({ tenantId, collections }: DataBrowserProps) {
  const [activeCollection, setActiveCollection] = useState(collections[0]?.collection || '');
  const [rows, setRows] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!activeCollection) return;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from('tenant_data')
      .select('id, collection, data, created_at')
      .eq('tenant_id', tenantId)
      .eq('collection', activeCollection)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setRows((data as DataRow[]) || []);
        setLoading(false);
      });
  }, [activeCollection, tenantId]);

  async function handleDelete(rowId: string) {
    if (!window.confirm('Delete this record?')) return;
    const supabase = createClient();
    await supabase.from('tenant_data').delete().eq('id', rowId);
    setRows(rows.filter(r => r.id !== rowId));
  }

  return (
    <div className="mt-6">
      {/* Collection tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {collections.map(({ collection, count }) => (
          <button
            key={collection}
            onClick={() => setActiveCollection(collection)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              activeCollection === collection
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {collection} ({count})
          </button>
        ))}
      </div>

      {/* Data rows */}
      {loading ? (
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">No records in this collection.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-gray-200 bg-white">
              <button
                onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono text-gray-400">{row.id.slice(0, 8)}...</span>
                  <span className="text-sm font-medium truncate">
                    {String((row.data as Record<string, unknown>).name || (row.data as Record<string, unknown>).title || (row.data as Record<string, unknown>).email || (row.data as Record<string, unknown>).content || '').slice(0, 60) || 'Record'}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-400">{new Date(row.created_at).toLocaleDateString()}</span>
                  <span className="text-gray-400">{expanded === row.id ? '▾' : '▸'}</span>
                </div>
              </button>

              {expanded === row.id && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <pre className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(row.data, null, 2)}
                  </pre>
                  <div className="mt-3 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}>
                      Delete Record
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
