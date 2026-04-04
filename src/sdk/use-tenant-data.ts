'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
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

  const supabase = createClient();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: rows, error: err } = await supabase
      .from('tenant_data')
      .select('id, data')
      .eq('tenant_id', tenantId)
      .eq('app_instance_id', instanceId)
      .eq('collection', collectionName)
      .order('created_at', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setData((rows || []).map((r) => ({ ...r.data, id: r.id } as T)));
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, instanceId, collectionName]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const insert = useCallback(async (item: Partial<T>): Promise<T | null> => {
    const { data: row, error: err } = await supabase
      .from('tenant_data')
      .insert({
        tenant_id: tenantId,
        app_instance_id: instanceId,
        collection: collectionName,
        data: item,
      })
      .select('id, data')
      .single();

    if (err) {
      setError(err.message);
      return null;
    }
    const newItem = { ...row.data, id: row.id } as T;
    setData((prev) => [newItem, ...prev]);
    return newItem;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, instanceId, collectionName]);

  const update = useCallback(async (id: string, changes: Partial<T>): Promise<T | null> => {
    // Fetch current data first, then merge
    const { data: existing } = await supabase
      .from('tenant_data')
      .select('data')
      .eq('id', id)
      .single();

    if (!existing) return null;

    const merged = { ...existing.data, ...changes };
    const { data: row, error: err } = await supabase
      .from('tenant_data')
      .update({ data: merged })
      .eq('id', id)
      .select('id, data')
      .single();

    if (err) {
      setError(err.message);
      return null;
    }
    const updated = { ...row.data, id: row.id } as T;
    setData((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    const { error: err } = await supabase
      .from('tenant_data')
      .delete()
      .eq('id', id);

    if (err) {
      setError(err.message);
      return false;
    }
    setData((prev) => prev.filter((item) => item.id !== id));
    return true;
  }, []);

  return { data, loading, error, insert, update, remove, refresh };
}
