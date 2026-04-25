'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTenant } from './tenant-context';
import type { Collection } from './types';

// Hook for template code to read/write tenant-scoped data.
// Each "collection" is a logical table (e.g., "messages", "orders").
// Data is stored as JSONB in the tenant_data table, fully isolated by tenant_id.
export function useTenantData<T extends { id?: string; [key: string]: unknown }>(
  collectionName: string
): Collection<T> {
  const { tenantId, instanceId } = useTenant();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      tenant_id: tenantId,
      app_instance_id: instanceId,
      collection: collectionName,
    });
    const res = await fetch(`/api/tenant-data?${params.toString()}`);
    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(payload.error || 'Failed to load data');
      setLoading(false);
      return;
    }

    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    setData(rows.map((r: { id: string; data: Record<string, unknown> }) => ({ ...r.data, id: r.id } as T)));
    setLoading(false);
  }, [tenantId, instanceId, collectionName]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [refresh]);

  const insert = useCallback(async (item: Partial<T>): Promise<T | null> => {
    const res = await fetch('/api/tenant-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: tenantId,
        app_instance_id: instanceId,
        collection: collectionName,
        data: item,
      }),
    });
    const row = await res.json().catch(() => null);

    if (!res.ok || !row) {
      setError(row?.error || 'Failed to insert data');
      return null;
    }
    const newItem = { ...row.data, id: row.id } as T;
    setData((prev) => [newItem, ...prev]);
    return newItem;
  }, [tenantId, instanceId, collectionName]);

  const update = useCallback(async (id: string, changes: Partial<T>): Promise<T | null> => {
    const res = await fetch('/api/tenant-data', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        tenant_id: tenantId,
        app_instance_id: instanceId,
        collection: collectionName,
        changes,
      }),
    });
    const row = await res.json().catch(() => null);

    if (!res.ok || !row) {
      setError(row?.error || 'Failed to update data');
      return null;
    }
    const updated = { ...row.data, id: row.id } as T;
    setData((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, [tenantId, instanceId, collectionName]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    const res = await fetch('/api/tenant-data', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        tenant_id: tenantId,
        app_instance_id: instanceId,
        collection: collectionName,
      }),
    });
    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(payload.error || 'Failed to delete data');
      return false;
    }
    setData((prev) => prev.filter((item) => item.id !== id));
    return true;
  }, [tenantId, instanceId, collectionName]);

  return { data, loading, error, insert, update, remove, refresh };
}
