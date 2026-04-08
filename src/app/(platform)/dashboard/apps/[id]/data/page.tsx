import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { DataBrowser } from './data-browser';

export default async function DataPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Verify ownership
  const { data: template } = await supabase
    .from('app_templates')
    .select('id, name, creator_id')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single();

  if (!template) notFound();

  // Find the tenant/instance for this template (if deployed)
  const admin = createAdminClient();
  const { data: instance } = await admin
    .from('app_instances')
    .select('id, tenant_id')
    .eq('template_id', id)
    .limit(1)
    .single() as { data: { id: string; tenant_id: string } | null };

  // Fetch collections and their row counts
  let collections: { collection: string; count: number }[] = [];
  if (instance) {
    const { data: rows } = await admin
      .from('tenant_data')
      .select('collection')
      .eq('tenant_id', instance.tenant_id) as { data: { collection: string }[] | null };

    if (rows) {
      const counts: Record<string, number> = {};
      for (const row of rows) {
        counts[row.collection] = (counts[row.collection] || 0) + 1;
      }
      collections = Object.entries(counts)
        .map(([collection, count]) => ({ collection, count }))
        .sort((a, b) => b.count - a.count);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
      <nav className="mb-4 sm:mb-6 text-xs sm:text-sm text-gray-500 flex flex-wrap items-center">
        <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
        <span className="mx-2">/</span>
        <Link href={`/dashboard/apps/${id}`} className="hover:text-gray-700 truncate max-w-[150px]">{template.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Data</span>
      </nav>

      <h1 className="text-xl sm:text-2xl font-bold">Data Browser</h1>
      <p className="mt-1 text-sm sm:text-base text-gray-600">View and manage your app&apos;s data collections.</p>

      {!instance ? (
        <div className="mt-12 text-center">
          <p className="text-4xl">📦</p>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No data yet</h3>
          <p className="mt-1 text-sm text-gray-500">Deploy your app first, then data will appear here as users interact with it.</p>
        </div>
      ) : collections.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-4xl">🗃️</p>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No data yet</h3>
          <p className="mt-1 text-sm text-gray-500">Data will appear here as users interact with your app.</p>
        </div>
      ) : (
        <DataBrowser
          tenantId={instance.tenant_id}
          collections={collections}
        />
      )}
    </div>
  );
}
