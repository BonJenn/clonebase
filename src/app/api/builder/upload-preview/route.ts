import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB — screenshots are usually well under 1MB

// POST /api/builder/upload-preview
//
// Receives a PNG screenshot of a template's preview iframe (captured via
// html2canvas from inside the sandbox) and uploads it to Supabase storage.
// Returns the public URL, which the publish dialog then passes to the publish
// API so it lands in app_templates.preview_url.
//
// Only the template's creator can upload a preview for it.
//
// Body: multipart form with:
//   - file: the PNG blob
//   - template_id: the template being published
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const templateId = formData.get('template_id') as string | null;

  if (!file || !templateId) {
    return NextResponse.json({ error: 'file and template_id are required' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Preview too large (max 5MB)' }, { status: 400 });
  }
  if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
    return NextResponse.json({ error: 'Preview must be PNG or JPEG' }, { status: 400 });
  }

  // Verify the user owns this template
  const { data: template } = await supabase
    .from('app_templates')
    .select('id, creator_id')
    .eq('id', templateId)
    .single() as { data: { id: string; creator_id: string } | null };

  if (!template || template.creator_id !== user.id) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  // Stable path per template so re-publishing overwrites the old preview
  const ext = file.type === 'image/jpeg' ? 'jpg' : 'png';
  const path = `template-previews/${templateId}.${ext}`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from('tenant-uploads')
    .upload(path, file, {
      contentType: file.type,
      upsert: true, // overwrite any previous preview
      cacheControl: '3600',
    });

  if (uploadError) {
    return NextResponse.json({ error: 'Upload failed: ' + uploadError.message }, { status: 500 });
  }

  const { data: urlData } = admin.storage.from('tenant-uploads').getPublicUrl(path);

  // Cache-bust by appending a query param since we upserted in place
  const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  return NextResponse.json({ url: publicUrl, path });
}
