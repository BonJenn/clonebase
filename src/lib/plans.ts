// Subscription plan definitions for Clonebase.
//
// Pricing model: pick a tier (features), pick a credit amount (usage).
// Price scales linearly with credits per tier — no bulk discounts (yet).
// Credits = messages (1 generation or follow-up = 1 credit).

export interface PlanTier {
  id: string;
  name: string;
  description: string;
  /** Base price per 100 credits in cents. */
  basePricePer100: number;
  /** Available credit amounts. */
  creditOptions: number[];
  /** Max number of apps the user can create. null = unlimited. */
  maxApps: number | null;
  /** Feature flags. */
  features: {
    customDomain: boolean;
    stripeConnect: boolean;
    removeBranding: boolean;
    passwordProtected: boolean;
    priorityGeneration: boolean;
    marketplace: boolean;
    teamAccess: boolean;
    apiAccess: boolean;
  };
}

export interface PlanVariant {
  tierId: string;
  credits: number;
  /** Monthly price in cents. */
  priceCents: number;
  /** Stripe Price ID — set after creating prices in Stripe. */
  stripePriceId: string | null;
}

// ─── Tiers ──────────────────────────────────────────────────────────────────

export const TIERS: Record<string, PlanTier> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Try Clonebase. Build up to 3 apps.',
    basePricePer100: 0,
    creditOptions: [30],
    maxApps: 3,
    features: {
      customDomain: false,
      stripeConnect: false,
      removeBranding: false,
      passwordProtected: false,
      priorityGeneration: false,
      marketplace: true,
      teamAccess: false,
      apiAccess: false,
    },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'For hobbyists and side projects.',
    basePricePer100: 2000, // $20 per 100 credits
    creditOptions: [100, 200, 300, 500, 1000],
    maxApps: 10,
    features: {
      customDomain: false,
      stripeConnect: false,
      removeBranding: true,
      passwordProtected: true,
      priorityGeneration: false,
      marketplace: true,
      teamAccess: false,
      apiAccess: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For indie builders shipping real products.',
    basePricePer100: 4000, // $40 per 100 credits
    creditOptions: [100, 200, 300, 500, 1000],
    maxApps: 50,
    features: {
      customDomain: true,
      stripeConnect: true,
      removeBranding: true,
      passwordProtected: true,
      priorityGeneration: true,
      marketplace: true,
      teamAccess: false,
      apiAccess: false,
    },
  },
  business: {
    id: 'business',
    name: 'Business',
    description: 'For agencies and teams building at scale.',
    basePricePer100: 8000, // $80 per 100 credits
    creditOptions: [100, 200, 300, 500, 1000],
    maxApps: null, // unlimited
    features: {
      customDomain: true,
      stripeConnect: true,
      removeBranding: true,
      passwordProtected: true,
      priorityGeneration: true,
      marketplace: true,
      teamAccess: true,
      apiAccess: true,
    },
  },
};

// ─── Price table ────────────────────────────────────────────────────────────

/** Generate all plan variants with prices. */
export function getAllVariants(): PlanVariant[] {
  const variants: PlanVariant[] = [];
  for (const tier of Object.values(TIERS)) {
    if (tier.id === 'free') continue; // Free has no Stripe price
    for (const credits of tier.creditOptions) {
      variants.push({
        tierId: tier.id,
        credits,
        priceCents: Math.round((credits / 100) * tier.basePricePer100),
        stripePriceId: null, // Set after Stripe price creation
      });
    }
  }
  return variants;
}

/**
 * Get the price for a specific tier + credit combo.
 * Linear pricing: (credits / 100) × basePricePer100.
 */
export function getPrice(tierId: string, credits: number): number {
  const tier = TIERS[tierId];
  if (!tier) return 0;
  return Math.round((credits / 100) * tier.basePricePer100);
}

/**
 * Format a price in cents as a dollar string.
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

/**
 * Get the user's effective plan. Returns 'free' if no active subscription.
 */
export function getEffectiveTier(subscription: { tier_id: string; status: string } | null): PlanTier {
  if (!subscription || subscription.status !== 'active') return TIERS.free;
  return TIERS[subscription.tier_id] || TIERS.free;
}
