import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { TemplatePurchase, AppTemplate } from '@/types';

export default async function EarningsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Fetch all templates owned by this user
  const { data: templates } = await supabase
    .from('app_templates')
    .select('id, name, slug')
    .eq('creator_id', user.id);

  const templateIds = (templates || []).map((t) => t.id);

  // Fetch all purchases for those templates
  let purchases: (TemplatePurchase & { template: Pick<AppTemplate, 'name'> })[] = [];
  let totalEarnings = 0;

  if (templateIds.length > 0) {
    const { data } = await supabase
      .from('template_purchases')
      .select('*, template:app_templates(name)')
      .in('template_id', templateIds)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    purchases = (data || []) as typeof purchases;
    totalEarnings = purchases.reduce((sum, p) => sum + p.amount_cents, 0);
  }

  const creatorShare = Math.round(totalEarnings * 0.85);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Earnings</span>
      </nav>

      <h1 className="text-2xl font-bold">Earnings</h1>

      {/* Summary cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Total Sales</p>
          <p className="mt-1 text-2xl font-bold">{purchases.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Gross Revenue</p>
          <p className="mt-1 text-2xl font-bold">${(totalEarnings / 100).toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Your Earnings (85%)</p>
          <p className="mt-1 text-2xl font-bold text-green-700">${(creatorShare / 100).toFixed(2)}</p>
        </div>
      </div>

      {/* Transactions */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Recent Transactions</h2>
        {purchases.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">No sales yet. Publish a paid template to start earning.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Template</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Your Share</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {purchases.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-sm font-medium">{p.template?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">${(p.amount_cents / 100).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-green-700">${(Math.round(p.amount_cents * 0.85) / 100).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
