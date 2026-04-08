// Imports, hooks API, navigation rules, styling, image URLs, constraints.
// Always included — every generated app depends on this contract.

export const TECHNICAL_CONTRACT = `## TECHNICAL CONTRACT

Components MUST start with \`'use client';\` and export a named function.
Main page export: descriptive name (e.g., RecipePage, BudgetPage). Admin: AdminPage.
Props: { tenantId: string; instanceId: string }

### Available imports (ONLY these — no npm packages):
\`\`\`
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTenant } from '@/sdk/tenant-context';
import { useTenantData } from '@/sdk/use-tenant-data';
import { useFileUpload } from '@/sdk/use-file-upload';
import { useTenantAuth } from '@/sdk/use-tenant-auth';
import { useStripeCheckout } from '@/sdk/use-stripe-checkout';
\`\`\`

### useTenant() → { tenantId, tenantSlug, tenantName, instanceId, templateSlug, config }
### useTenantData<T>(collection) → { data: T[], loading, error, insert(item), update(id, changes), remove(id), refresh() }
### useFileUpload() → { upload(file: File): Promise<{ url, path, filename } | null>, uploading, error }
### useTenantAuth() → { user, loading, error, signUp(email, password, metadata?), signIn(email, password), signOut(), resetPassword(email), updatePassword(newPassword), updateProfile(metadata) }
### useStripeCheckout() → { checkout(lineItems, options?), loading, error }
Use ONLY for apps that need to accept real money (ecom stores, paid services, bookings, digital goods).
- lineItems: \`[{ name, amount_cents, quantity, description?, image_url? }]\` — amount_cents ≥ 50
- Calling \`checkout()\` redirects the customer to Stripe Checkout. After payment they come back to the app and the order appears in the \`orders\` collection (write-through handled by the platform webhook).
- The tenant owner must have connected their Stripe account at /dashboard/payments; if not, checkout() returns an error string in \`error\`. Show that error to the user with "Store owner needs to connect Stripe".
- Clonebase takes a 3% platform fee automatically.

You can use MULTIPLE collections for richer data (e.g., "profiles" + "matches" + "messages").

### NAVIGATION RULES — NO URL ROUTING
The app runs in a single-page iframe. There is NO router. NEVER use:
- window.location.href
- window.location.pathname
- Next.js Link or useRouter
- Any URL-based navigation

For multiple views (feed, profile, settings), use STATE-BASED navigation:
\`\`\`tsx
const [currentView, setCurrentView] = useState<'feed' | 'profile' | 'settings'>('feed');

// Navigation buttons:
<button onClick={() => setCurrentView('settings')}>Settings</button>

// Render based on state:
{currentView === 'feed' && <FeedView />}
{currentView === 'profile' && <ProfileView />}
{currentView === 'settings' && <SettingsView />}
\`\`\`
This is the ONLY way to navigate between views. URL routing will show 404.

### Styling: Tailwind CSS only. Use emoji for icons (no icon libraries).

### Image URLs: ONLY use https://picsum.photos for any image URLs. NEVER use placeholder.com, placekitten.com, placehold.co, unsplash.com/photos, or local /images/ paths. They are all broken. The ONLY working image service is:
- https://picsum.photos/seed/{unique-name}/{width}/{height}
- Example: https://picsum.photos/seed/sunset-beach/600/600

### Constraints: No fetch(), no localStorage, no Node.js modules, no external imports. NEVER hardcode data as const arrays — always use useTenantData + seed pattern.`;
