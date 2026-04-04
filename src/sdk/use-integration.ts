'use client';

import { useCallback, useState } from 'react';
import { useTenant } from './tenant-context';

// Hook for template code to call external APIs through the secure proxy.
// API keys are NEVER exposed to the client — the proxy decrypts them server-side.
export function useIntegration(serviceKey: string) {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(async (
    endpoint: string,
    options?: { method?: string; body?: unknown; headers?: Record<string, string> }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          service_key: serviceKey,
          endpoint,
          method: options?.method || 'POST',
          body: options?.body,
          headers: options?.headers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Integration call failed');
        setLoading(false);
        return null;
      }

      setLoading(false);
      return data.data;
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
      return null;
    }
  }, [tenantId, serviceKey]);

  return { call, loading, error };
}
