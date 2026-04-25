import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { unlockCookieName, verifyUnlockToken } from '@/lib/password';

const MAX_COLLECTION_LENGTH = 80;
const MAX_DATA_BYTES = 100_000;

interface TenantAccess {
  tenantId: string;
  instanceId: string;
}

type AccessResult = { ok: true; isOwner: boolean } | { ok: false; status: number; error: string };
type TenantDataJson = Record<string, unknown>;
type DbError = { message: string };
type QueryResult<T> = { data: T | null; error: DbError | null };
type TenantDataRow = { id: string; data: TenantDataJson; created_at: string | null };
type TenantDataInsert = {
  tenant_id: string;
  app_instance_id: string;
  collection: string;
  data: TenantDataJson;
};

interface TenantDataQuery<T> extends PromiseLike<QueryResult<T>> {
  eq(column: string, value: string): TenantDataQuery<T>;
  order(column: string, options: { ascending: boolean }): TenantDataQuery<T>;
  single(): PromiseLike<QueryResult<T extends Array<infer Row> ? Row : T>>;
}

interface TenantDataMutationQuery extends PromiseLike<QueryResult<null>> {
  eq(column: string, value: string): TenantDataMutationQuery;
  select(columns: 'id, data, created_at'): {
    single(): PromiseLike<QueryResult<TenantDataRow>>;
  };
}

interface TenantDataTable {
  select(columns: 'id, data, created_at'): TenantDataQuery<TenantDataRow[]>;
  select(columns: 'data'): TenantDataQuery<{ data: TenantDataJson }>;
  insert(values: TenantDataInsert): {
    select(columns: 'id, data, created_at'): {
      single(): PromiseLike<QueryResult<TenantDataRow>>;
    };
  };
  update(values: { data: TenantDataJson }): TenantDataMutationQuery;
  delete(): TenantDataMutationQuery;
}

function tenantDataTable(admin: ReturnType<typeof createAdminClient>): TenantDataTable {
  return admin.from('tenant_data') as unknown as TenantDataTable;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function jsonSize(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

function validateCollection(collection: unknown): string | null {
  if (typeof collection !== 'string') return null;
  const trimmed = collection.trim();
  if (!trimmed || trimmed.length > MAX_COLLECTION_LENGTH) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return null;
  return trimmed;
}

function hasPriceFields(data: Record<string, unknown>): boolean {
  return data.price_cents !== undefined || data.amount_cents !== undefined;
}

async function authorizeTenantAccess(request: NextRequest, access: TenantAccess): Promise<AccessResult> {
  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from('tenants')
    .select('id, owner_id, access_password_hash')
    .eq('id', access.tenantId)
    .single() as { data: { id: string; owner_id: string; access_password_hash: string | null } | null };

  if (!tenant) return { ok: false, status: 404, error: 'Tenant not found' };

  const { data: instance } = await admin
    .from('app_instances')
    .select('id')
    .eq('id', access.instanceId)
    .eq('tenant_id', access.tenantId)
    .eq('status', 'active')
    .single() as { data: { id: string } | null };

  if (!instance) return { ok: false, status: 404, error: 'App instance not found' };

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === tenant.owner_id) return { ok: true, isOwner: true };

  if (!tenant.access_password_hash) return { ok: true, isOwner: false };

  const token = request.cookies.get(unlockCookieName(access.tenantId))?.value;
  if (token && verifyUnlockToken(token, access.tenantId)) return { ok: true, isOwner: false };

  return { ok: false, status: 403, error: 'Tenant is locked' };
}

function errorResponse(result: { ok: false; status: number; error: string }) {
  return NextResponse.json({ error: result.error }, { status: result.status });
}

export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get('tenant_id');
  const instanceId = request.nextUrl.searchParams.get('app_instance_id');
  const collection = validateCollection(request.nextUrl.searchParams.get('collection'));

  if (!tenantId || !instanceId || !collection) {
    return NextResponse.json({ error: 'tenant_id, app_instance_id, and collection are required' }, { status: 400 });
  }

  const access = await authorizeTenantAccess(request, { tenantId, instanceId });
  if (!access.ok) return errorResponse(access);

  const admin = createAdminClient();
  const { data, error } = await tenantDataTable(admin)
    .select('id, data, created_at')
    .eq('tenant_id', tenantId)
    .eq('app_instance_id', instanceId)
    .eq('collection', collection)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data || [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!isRecord(body)) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const tenantId = typeof body.tenant_id === 'string' ? body.tenant_id : '';
  const instanceId = typeof body.app_instance_id === 'string' ? body.app_instance_id : '';
  const collection = validateCollection(body.collection);
  const data = body.data;

  if (!tenantId || !instanceId || !collection || !isRecord(data)) {
    return NextResponse.json({ error: 'tenant_id, app_instance_id, collection, and data are required' }, { status: 400 });
  }
  if (jsonSize(data) > MAX_DATA_BYTES) {
    return NextResponse.json({ error: 'Data payload too large' }, { status: 413 });
  }

  const access = await authorizeTenantAccess(request, { tenantId, instanceId });
  if (!access.ok) return errorResponse(access);
  if (!access.isOwner && hasPriceFields(data)) {
    return NextResponse.json({ error: 'Only the app owner can write priced records' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: row, error } = await tenantDataTable(admin)
    .insert({
      tenant_id: tenantId,
      app_instance_id: instanceId,
      collection,
      data,
    })
    .select('id, data, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(row, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!isRecord(body)) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const id = typeof body.id === 'string' ? body.id : '';
  const tenantId = typeof body.tenant_id === 'string' ? body.tenant_id : '';
  const instanceId = typeof body.app_instance_id === 'string' ? body.app_instance_id : '';
  const collection = validateCollection(body.collection);
  const changes = body.changes;

  if (!id || !tenantId || !instanceId || !collection || !isRecord(changes)) {
    return NextResponse.json({ error: 'id, tenant_id, app_instance_id, collection, and changes are required' }, { status: 400 });
  }
  if (jsonSize(changes) > MAX_DATA_BYTES) {
    return NextResponse.json({ error: 'Data payload too large' }, { status: 413 });
  }

  const access = await authorizeTenantAccess(request, { tenantId, instanceId });
  if (!access.ok) return errorResponse(access);
  if (!access.isOwner) {
    return NextResponse.json({ error: 'Only the app owner can modify records' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: existing } = await tenantDataTable(admin)
    .select('data')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .eq('app_instance_id', instanceId)
    .eq('collection', collection)
    .single();

  if (!existing) return NextResponse.json({ error: 'Row not found' }, { status: 404 });

  const merged = { ...existing.data, ...changes };
  const { data: row, error } = await tenantDataTable(admin)
    .update({ data: merged })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .eq('app_instance_id', instanceId)
    .eq('collection', collection)
    .select('id, data, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(row);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!isRecord(body)) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const id = typeof body.id === 'string' ? body.id : '';
  const tenantId = typeof body.tenant_id === 'string' ? body.tenant_id : '';
  const instanceId = typeof body.app_instance_id === 'string' ? body.app_instance_id : '';
  const collection = validateCollection(body.collection);

  if (!id || !tenantId || !instanceId || !collection) {
    return NextResponse.json({ error: 'id, tenant_id, app_instance_id, and collection are required' }, { status: 400 });
  }

  const access = await authorizeTenantAccess(request, { tenantId, instanceId });
  if (!access.ok) return errorResponse(access);
  if (!access.isOwner) {
    return NextResponse.json({ error: 'Only the app owner can delete records' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await tenantDataTable(admin)
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .eq('app_instance_id', instanceId)
    .eq('collection', collection);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
