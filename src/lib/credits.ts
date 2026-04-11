// Credit tracking and gate checks for generation requests.
//
// Each generation (first gen or follow-up) costs 1 credit. Before the AI
// call runs, we check the user's remaining credits for the current billing
// period. After a successful generation, we increment the usage count.
//
// Free users get 30 credits/month with a fixed period (calendar month).
// Paid users' periods are set by Stripe (current_period_start/end).

import { createAdminClient } from '@/lib/supabase/admin';

export interface CreditStatus {
  allowed: boolean;
  creditsUsed: number;
  creditsLimit: number;
  creditsRemaining: number;
  tier: string;
  /** Error message to show if not allowed. */
  error?: string;
}

/**
 * Check if a user has credits remaining in their current billing period.
 * Returns the current status including remaining credits.
 */
export async function checkCredits(userId: string): Promise<CreditStatus> {
  const admin = createAdminClient();

  // Get active subscription (or null for free tier)
  const { data: sub } = await admin
    .from('user_subscriptions')
    .select('tier_id, credits_per_month, current_period_start, current_period_end, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle() as { data: {
      tier_id: string;
      credits_per_month: number;
      current_period_start: string | null;
      current_period_end: string | null;
      status: string;
    } | null };

  const tier = sub?.tier_id || 'free';
  const creditsLimit = sub?.credits_per_month || 30;

  // Determine billing period
  const now = new Date();
  let periodStart: Date;
  let periodEnd: Date;

  if (sub?.current_period_start && sub?.current_period_end) {
    // Paid: use Stripe's billing period
    periodStart = new Date(sub.current_period_start);
    periodEnd = new Date(sub.current_period_end);
  } else {
    // Free: use calendar month
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  // Find or create the usage row for this period
  const { data: usage } = await admin
    .from('credit_usage')
    .select('id, credits_used, credits_limit')
    .eq('user_id', userId)
    .eq('period_start', periodStart.toISOString())
    .maybeSingle() as { data: { id: string; credits_used: number; credits_limit: number } | null };

  const creditsUsed = usage?.credits_used || 0;
  const creditsRemaining = Math.max(0, creditsLimit - creditsUsed);

  if (creditsRemaining <= 0) {
    return {
      allowed: false,
      creditsUsed,
      creditsLimit,
      creditsRemaining: 0,
      tier,
      error: tier === 'free'
        ? 'You\'ve used all 30 free credits this month. Upgrade to keep building.'
        : 'You\'ve used all your credits this month. Upgrade your plan or wait for your next billing period.',
    };
  }

  return {
    allowed: true,
    creditsUsed,
    creditsLimit,
    creditsRemaining,
    tier,
  };
}

/**
 * Increment the credit usage for a user after a successful generation.
 * Creates the usage row if it doesn't exist for this period.
 */
export async function useCredit(userId: string): Promise<void> {
  const admin = createAdminClient();

  // Get subscription to determine period
  const { data: sub } = await admin
    .from('user_subscriptions')
    .select('credits_per_month, current_period_start, current_period_end')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle() as { data: {
      credits_per_month: number;
      current_period_start: string | null;
      current_period_end: string | null;
    } | null };

  const creditsLimit = sub?.credits_per_month || 30;
  const now = new Date();
  let periodStart: Date;
  let periodEnd: Date;

  if (sub?.current_period_start && sub?.current_period_end) {
    periodStart = new Date(sub.current_period_start);
    periodEnd = new Date(sub.current_period_end);
  } else {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  // Upsert: create if not exists, increment if exists
  const { data: existing } = await admin
    .from('credit_usage')
    .select('id, credits_used')
    .eq('user_id', userId)
    .eq('period_start', periodStart.toISOString())
    .maybeSingle() as { data: { id: string; credits_used: number } | null };

  if (existing) {
    await (admin.from('credit_usage') as any)
      .update({
        credits_used: existing.credits_used + 1,
        updated_at: now.toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await (admin.from('credit_usage') as any).insert({
      user_id: userId,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      credits_used: 1,
      credits_limit: creditsLimit,
    });
  }
}
