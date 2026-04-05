import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { StorageBrowser } from './storage-browser';

export default async function StoragePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: template } = await supabase
    .from('app_templates')
    .select('id, name, creator_id')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single();

  if (!template) notFound();

  // Find tenant_id for this template
  const admin = createAdminClient();
  const { data: instance } = await admin
    .from('app_instances')
    .select('id, tenant_id')
    .eq('template_id', id)
    .limit(1)
    .single() as { data: { id: string; tenant_id: string } | null };

  // List files in the tenant's storage folder
  let files: { name: string; url: string; size: number; type: string; created_at: string }[] = [];

  if (instance) {
    const { data: fileList } = await admin.storage
      .from('tenant-uploads')
      .list(instance.tenant_id, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

    if (fileList) {
      const { data: urlData } = admin.storage.from('tenant-uploads').getPublicUrl('');
      const baseUrl = urlData.publicUrl;

      files = fileList
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .map(f => ({
          name: f.name,
          url: `${baseUrl}/${instance.tenant_id}/${f.name}`,
          size: f.metadata?.size || 0,
          type: f.metadata?.mimetype || 'unknown',
          created_at: f.created_at || '',
        }));
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
        <span className="mx-2">/</span>
        <Link href={`/dashboard/apps/${id}`} className="hover:text-gray-700">{template.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Storage</span>
      </nav>

      <h1 className="text-2xl font-bold">Storage</h1>
      <p className="mt-1 text-gray-600">Files and media uploaded by your app&apos;s users.</p>

      {!instance ? (
        <div className="mt-12 text-center">
          <p className="text-4xl">📁</p>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No storage yet</h3>
          <p className="mt-1 text-sm text-gray-500">Deploy your app first. Files will appear here as users upload them.</p>
        </div>
      ) : (
        <StorageBrowser files={files} tenantId={instance.tenant_id} />
      )}
    </div>
  );
}
