import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant_id?: string }>;
}) {
  const { tenant_id } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Fetch user's tenants for the selector
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  const selectedTenantId = tenant_id || tenants?.[0]?.id;
  const selectedTenant = tenants?.find((t) => t.id === selectedTenantId);

  // Fetch last 30 days of analytics
  let summary: Record<string, number> = {};
  let dailyData: { date: string; views: number; api: number }[] = [];

  if (selectedTenantId) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 30);

    const { data: events } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('tenant_id', selectedTenantId)
      .gte('event_date', sinceDate.toISOString().split('T')[0])
      .order('event_date', { ascending: true });

    for (const event of events || []) {
      summary[event.event_type] = (summary[event.event_type] || 0) + event.count;
    }

    // Build daily chart data
    const byDate: Record<string, { views: number; api: number }> = {};
    for (const event of events || []) {
      if (!byDate[event.event_date]) byDate[event.event_date] = { views: 0, api: 0 };
      if (event.event_type === 'page_view') {
        byDate[event.event_date].views += event.count;
      } else if (event.event_type.startsWith('api:')) {
        byDate[event.event_date].api += event.count;
      }
    }
    dailyData = Object.entries(byDate).map(([date, d]) => ({ date, ...d }));
  }

  const totalViews = summary['page_view'] || 0;
  const totalApiCalls = Object.entries(summary)
    .filter(([k]) => k.startsWith('api:'))
    .reduce((sum, [, v]) => sum + v, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Analytics</span>
      </nav>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        {tenants && tenants.length > 1 && (
          <form>
            <select
              name="tenant_id"
              defaultValue={selectedTenantId}
              onChange={(e) => {
                const form = e.target.closest('form');
                if (form) form.submit();
              }}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.slug})</option>
              ))}
            </select>
          </form>
        )}
      </div>

      {!selectedTenant ? (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">No apps yet. Clone a template to start tracking analytics.</p>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-gray-500">
            {selectedTenant.name} ({selectedTenant.slug}.clonebase.app) — Last 30 days
          </p>

          {/* Summary cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">Page Views</p>
              <p className="mt-1 text-2xl font-bold">{totalViews.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">API Calls</p>
              <p className="mt-1 text-2xl font-bold">{totalApiCalls.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">Avg Daily Views</p>
              <p className="mt-1 text-2xl font-bold">{dailyData.length > 0 ? Math.round(totalViews / dailyData.length) : 0}</p>
            </div>
          </div>

          {/* Daily breakdown */}
          {dailyData.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">Daily Activity</h2>
              <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page Views</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">API Calls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {dailyData.slice(-14).reverse().map((day) => (
                      <tr key={day.date}>
                        <td className="px-4 py-3 text-sm">{new Date(day.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{day.views}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{day.api}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-500">No activity recorded yet. Analytics will appear once your app gets traffic.</p>
            </div>
          )}

          {/* Event breakdown */}
          {Object.keys(summary).length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">Event Breakdown</h2>
              <div className="mt-4 space-y-2">
                {Object.entries(summary).sort(([,a], [,b]) => b - a).map(([event, count]) => (
                  <div key={event} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
                    <span className="text-sm font-medium">{event}</span>
                    <span className="text-sm text-gray-600">{count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
