import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAccountStatus } from '@/lib/stripe-connect';

// GET /api/stripe/connect/status
//
// Refreshes the user's Connect account state from Stripe and persists it to
// the profile. Returns the current state so the dashboard can render the
// onboarding/connected/incomplete UI.
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_connect_account_id, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, stripe_connect_details_submitted, stripe_connect_country, stripe_connect_onboarded_at')
    .eq('id', user.id)
    .single() as { data: {
      stripe_connect_account_id: string | null;
      stripe_connect_charges_enabled: boolean;
      stripe_connect_payouts_enabled: boolean;
      stripe_connect_details_submitted: boolean;
      stripe_connect_country: string | null;
      stripe_connect_onboarded_at: string | null;
    } | null };

  if (!profile?.stripe_connect_account_id) {
    return NextResponse.json({
      connected: false,
      account_id: null,
      charges_enabled: false,
      payouts_enabled: false,
      details_submitted: false,
      country: null,
    });
  }

  // Live-fetch from Stripe so the dashboard reflects post-onboarding state
  // immediately (the webhook may not have fired yet).
  try {
    const status = await getAccountStatus(profile.stripe_connect_account_id);

    // Persist the refreshed state to the profile
    const admin = createAdminClient();
    const updates: Record<string, unknown> = {
      stripe_connect_charges_enabled: status.charges_enabled,
      stripe_connect_payouts_enabled: status.payouts_enabled,
      stripe_connect_details_submitted: status.details_submitted,
      stripe_connect_country: status.country,
    };
    if (status.details_submitted && !profile.stripe_connect_onboarded_at) {
      updates.stripe_connect_onboarded_at = new Date().toISOString();
    }
    await (admin.from('profiles') as any).update(updates).eq('id', user.id);

    return NextResponse.json({
      connected: status.charges_enabled,
      account_id: profile.stripe_connect_account_id,
      charges_enabled: status.charges_enabled,
      payouts_enabled: status.payouts_enabled,
      details_submitted: status.details_submitted,
      country: status.country,
    });
  } catch {
    // If Stripe lookup fails, fall back to the cached profile state
    return NextResponse.json({
      connected: profile.stripe_connect_charges_enabled,
      account_id: profile.stripe_connect_account_id,
      charges_enabled: profile.stripe_connect_charges_enabled,
      payouts_enabled: profile.stripe_connect_payouts_enabled,
      details_submitted: profile.stripe_connect_details_submitted,
      country: profile.stripe_connect_country,
    });
  }
}
