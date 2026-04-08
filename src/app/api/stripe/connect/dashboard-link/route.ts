import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createDashboardLink } from '@/lib/stripe-connect';

// POST /api/stripe/connect/dashboard-link
//
// Returns a one-time login URL to the cloner's Stripe Express dashboard.
// Express dashboards are read-mostly: payments, payouts, account info.
export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_connect_account_id')
    .eq('id', user.id)
    .single() as { data: { stripe_connect_account_id: string | null } | null };

  if (!profile?.stripe_connect_account_id) {
    return NextResponse.json({ error: 'No Stripe account connected' }, { status: 400 });
  }

  try {
    const url = await createDashboardLink(profile.stripe_connect_account_id);
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to create dashboard link' },
      { status: 500 }
    );
  }
}
