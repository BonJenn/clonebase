import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createConnectAccount, createOnboardingLink } from '@/lib/stripe-connect';
import { checkFeature } from '@/lib/tier-gate';

// POST /api/stripe/connect/onboard
//
// Starts (or resumes) Stripe Connect Express onboarding for the current user.
// Creates a Connect account if the user doesn't have one yet, then returns a
// hosted onboarding URL. The user is redirected to Stripe, fills in their KYC
// info, and is sent back to /dashboard/payments?onboarding=complete.
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const gate = await checkFeature(user.id, 'stripeConnect', 'Accepting payments');
  if (gate) return NextResponse.json({ error: gate }, { status: 403 });

  const { country } = await request.json().catch(() => ({}));

  // Look up the user's profile to see if they already have a Connect account
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_connect_account_id, email')
    .eq('id', user.id)
    .single() as { data: { stripe_connect_account_id: string | null; email: string } | null };

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  let accountId = profile.stripe_connect_account_id;

  // Create a new account if needed
  if (!accountId) {
    const account = await createConnectAccount({
      email: profile.email || user.email || '',
      country: typeof country === 'string' ? country : 'US',
    });
    accountId = account.id;

    // Persist the account id (admin client to bypass RLS write restrictions)
    const admin = createAdminClient();
    await (admin.from('profiles') as any)
      .update({
        stripe_connect_account_id: accountId,
        stripe_connect_country: account.country || country || 'US',
      })
      .eq('id', user.id);
  }

  // Build absolute return/refresh URLs from the request origin
  const origin = request.headers.get('origin') || new URL(request.url).origin;
  const link = await createOnboardingLink({
    accountId,
    returnUrl: `${origin}/dashboard/payments?onboarding=complete`,
    refreshUrl: `${origin}/dashboard/payments?onboarding=refresh`,
  });

  return NextResponse.json({ url: link.url, account_id: accountId });
}
