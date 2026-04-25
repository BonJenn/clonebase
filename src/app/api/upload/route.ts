import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'text/plain', 'text/csv', 'text/markdown',
  'application/json',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

async function canUploadToTenant(tenantId: string, appInstanceId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from('tenants')
    .select('id, owner_id')
    .eq('id', tenantId)
    .single() as { data: { id: string; owner_id: string; access_password_hash: string | null } | null };

  if (!tenant) return false;

  const { data: instance } = await admin
    .from('app_instances')
    .select('id')
    .eq('id', appInstanceId)
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .single() as { data: { id: string } | null };

  if (!instance) return false;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id === tenant.owner_id;
}

async function canUploadToBuilderTemplate(templateId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: template } = await supabase
    .from('app_templates')
    .select('id, creator_id')
    .eq('id', templateId)
    .single();

  return !!template && template.creator_id === user.id;
}

// POST /api/upload — Upload a file to tenant-scoped storage
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const tenantId = formData.get('tenant_id') as string | null;
  const appInstanceId = formData.get('app_instance_id') as string | null;

  if (!file || !tenantId) {
    return NextResponse.json({ error: 'file and tenant_id are required' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: `File type ${file.type} not allowed` }, { status: 400 });
  }

  let pathPrefix: string;
  if (tenantId.startsWith('builder-')) {
    const templateId = tenantId.slice('builder-'.length);
    if (!templateId || !await canUploadToBuilderTemplate(templateId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    pathPrefix = `builder/${templateId}`;
  } else {
    if (!appInstanceId || !await canUploadToTenant(tenantId, appInstanceId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    pathPrefix = tenantId;
  }

  // Generate a unique path scoped to the tenant
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
  const path = `${pathPrefix}/${Date.now()}-${safeName}`;

  const supabase = createAdminClient();

  const { error } = await supabase.storage
    .from('tenant-uploads')
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from('tenant-uploads')
    .getPublicUrl(path);

  return NextResponse.json({
    url: urlData.publicUrl,
    path,
    filename: file.name,
  });
}
