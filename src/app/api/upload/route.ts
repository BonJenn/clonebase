import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'text/plain', 'text/csv', 'text/markdown',
  'application/json',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// POST /api/upload — Upload a file to tenant-scoped storage
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const tenantId = formData.get('tenant_id') as string | null;

  if (!file || !tenantId) {
    return NextResponse.json({ error: 'file and tenant_id are required' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: `File type ${file.type} not allowed` }, { status: 400 });
  }

  // Generate a unique path scoped to the tenant
  const ext = file.name.split('.').pop() || 'bin';
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
  const path = `${tenantId}/${Date.now()}-${safeName}`;

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
