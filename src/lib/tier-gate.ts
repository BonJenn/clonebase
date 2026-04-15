// Tier gate: shared helper for checking a user's subscription tier and
// enforcing feature access. Used by API routes to block premium features
// for users on lower tiers.

import { createAdminClient } from '@/lib/supabase/admin';
import { TIERS, type PlanTier } from '@/lib/plans';

export interface UserTier {
  tier: PlanTier;
  tierId: string;
  isPaid: boolean;
}

/**
 * Get the effective tier for a user. Returns the free tier if no active
 * subscription exists.
 */
export async function getUserTier(userId: string): Promise<UserTier> {
  const admin = createAdminClient();
  const { data: sub } = await admin
    .from('user_subscriptions')
    .select('tier_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle() as { data: { tier_id: string } | null };

  const tierId = sub?.tier_id || 'free';
  const tier = TIERS[tierId] || TIERS.free;

  return {
    tier,
    tierId,
    isPaid: tierId !== 'free',
  };
}

/**
 * Check if a user's tier allows a specific feature. Returns an error
 * message string if blocked, or null if allowed.
 */
export async function checkFeature(
  userId: string,
  feature: keyof PlanTier['features'],
  featureLabel: string
): Promise<string | null> {
  const { tier } = await getUserTier(userId);
  if (tier.features[feature]) return null;

  // Find the cheapest tier that has this feature
  const requiredTier = Object.values(TIERS).find((t) => t.features[feature]);
  const upgradeLabel = requiredTier ? requiredTier.name : 'a paid plan';

  return `${featureLabel} requires the ${upgradeLabel} plan or higher. Upgrade at /pricing to unlock this feature.`;
}

/**
 * Check if a user has hit their app creation limit.
 * Returns an error message if at the limit, null if OK.
 */
export async function checkAppLimit(userId: string): Promise<string | null> {
  const { tier } = await getUserTier(userId);
  if (tier.maxApps === null) return null; // unlimited

  // Count only templates that have actual generated code — empty drafts
  // (created when the user clicks "Build an App" but hasn't generated yet)
  // don't count against the limit.
  const admin = createAdminClient();
  const { data: templateIds } = await admin
    .from('app_templates')
    .select('id')
    .eq('creator_id', userId)
    .eq('source_type', 'generated') as { data: { id: string }[] | null };

  if (!templateIds || templateIds.length === 0) return null;

  // Check which of these templates actually have generated code
  const { count } = await admin
    .from('generated_templates')
    .select('template_id', { count: 'exact', head: true })
    .in('template_id', templateIds.map(t => t.id))
    .eq('is_current', true);

  const currentCount = count || 0;
  if (currentCount >= tier.maxApps) {
    return `You've reached the ${tier.maxApps}-app limit on the ${tier.name} plan. Upgrade at /pricing to create more apps.`;
  }

  return null;
}
