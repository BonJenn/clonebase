'use client';

import { useTenant } from '@/sdk/tenant-context';
import { useTenantData } from '@/sdk/use-tenant-data';

interface WaitlistEntry {
  [key: string]: unknown;
  id?: string;
  email: string;
  name: string;
  referral_source: string;
  signed_up_at: string;
}

export function AdminPage({ tenantId, instanceId }: { tenantId: string; instanceId: string }) {
  const { tenantName } = useTenant();
  const { data: entries, loading, remove } = useTenantData<WaitlistEntry>('waitlist');

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Waitlist Dashboard</h1>
      <p className="mt-1 text-gray-600">{tenantName} — {entries.length} signups</p>

      {loading ? (
        <p className="mt-8 text-gray-500">Loading...</p>
      ) : entries.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">No signups yet. Share your waitlist page to start collecting emails.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3 text-sm font-medium">{entry.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{entry.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{entry.referral_source}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(entry.signed_up_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => entry.id && remove(entry.id)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
