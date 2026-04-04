export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  instanceId: string;
  templateSlug: string;
  config: Record<string, unknown>;
}

export interface Collection<T = Record<string, unknown>> {
  data: T[];
  loading: boolean;
  error: string | null;
  insert: (item: Partial<T>) => Promise<T | null>;
  update: (id: string, changes: Partial<T>) => Promise<T | null>;
  remove: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export interface IntegrationCall {
  service_key: string;
  endpoint: string;
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}
