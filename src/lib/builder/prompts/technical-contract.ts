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
import { Chart } from '@/sdk/chart';
// UI component kit — see COMPONENT KIT section for full API:
import { setupTheme, Icon, Button, Input, Textarea, Select, Switch,
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Badge, Avatar, StatCard, KPIGrid, DataTable, Progress, Skeleton, Separator,
  AppShell, TopBar, Sidebar, PageHeader, SectionHeader, FilterBar, ScrollArea,
  Alert, Dialog, DialogFooter, ConfirmDialog, EmptyState, LoadingState,
  Tooltip, toast, FormSection, SettingsSection } from '@/ui';
\`\`\`

### useTenant() → { tenantId, tenantSlug, tenantName, instanceId, templateSlug, config }
### useTenantData<T>(collection) → { data: T[], loading, error, insert(item), update(id, changes), remove(id), refresh() }
### useFileUpload() → { upload(file: File): Promise<{ url, path, filename } | null>, uploading, error }
Use file uploads only for owner/admin workflows. Do not create public visitor upload forms; production uploads require Clonebase owner authorization.
### useTenantAuth() → { user, loading, error, signUp(email, password, metadata?), signIn(email, password), signOut(), resetPassword(email), updatePassword(newPassword), updateProfile(metadata) }
### useStripeCheckout() → { checkout(lineItems, options?), loading, error }
Use ONLY for apps that need to accept real money (ecom stores, paid services, bookings, digital goods).
- lineItems: \`[{ id, quantity }]\` where id is the product/service record id returned from useTenantData. The server reads name, price_cents/amount_cents, description, image_url, and currency from that stored record.
- Products/services that can be purchased MUST be stored in a collection with a server-side price field named \`price_cents\` or \`amount_cents\` (minimum 50).
- Calling \`checkout()\` redirects the customer to Stripe Checkout. After payment they come back to the app and the order appears in the \`orders\` collection (write-through handled by the platform webhook).
- The tenant owner must have connected their Stripe account at /dashboard/payments; if not, checkout() returns an error string in \`error\`. Show that error to the user with "Store owner needs to connect Stripe".
- Clonebase takes a 3% platform fee automatically.

### <Chart /> — beautiful charts (ApexCharts under the hood)
**USE REAL CHARTS.** Whenever the user asks for a dashboard, analytics, stats, metrics, sales, trends, breakdowns, progress, or ANY numerical data — use the <Chart /> component. NEVER fake charts with colored div bars, CSS gradients, or text-based visualizations. Fake charts look amateur; real charts look professional.

Props:
- \`type\`: 'line' | 'area' | 'bar' | 'pie' | 'donut' | 'radialBar' | 'scatter' | 'heatmap' | 'radar' | 'polarArea' | 'treemap'
- \`series\`: data (shape varies by type — see examples below)
- \`categories\`: string[] — X-axis labels for line/bar/area/scatter/radar
- \`labels\`: string[] — segment labels for pie/donut/radialBar/polarArea
- \`height\`: number (px), default 300
- \`colors\`: string[] — hex color array; first color must match the app's primary color from the plan (e.g. \`['#10B981']\` for emerald)
- \`title\`: optional string shown above
- \`stacked\`: boolean — for bar/area
- \`curve\`: 'smooth' | 'straight' | 'stepline' — for line charts, default 'smooth'
- \`horizontal\`: boolean — horizontal bar chart

**Line chart** (trends over time):
\`\`\`tsx
<Chart
  type="line"
  series={[{ name: 'Revenue', data: [1200, 1800, 2400, 2100, 3200, 4100] }]}
  categories={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']}
  colors={['#10B981']}
  height={280}
/>
\`\`\`

**Area chart** (filled line, nicer for single-metric dashboards):
\`\`\`tsx
<Chart type="area" series={[{ name: 'Users', data: [...] }]} categories={[...]} colors={['#6366F1']} height={240} />
\`\`\`

**Bar chart** (compare categories):
\`\`\`tsx
<Chart
  type="bar"
  series={[{ name: 'Sales', data: [44, 55, 57, 56, 61, 58] }]}
  categories={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
  colors={['#F59E0B']}
  height={260}
/>
\`\`\`

**Pie/Donut chart** (show proportions):
\`\`\`tsx
<Chart
  type="donut"
  series={[44, 55, 13, 43, 22]}
  labels={['Groceries', 'Rent', 'Transport', 'Food', 'Other']}
  colors={['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981']}
  height={280}
/>
\`\`\`

**Multi-series bar** (grouped or stacked):
\`\`\`tsx
<Chart
  type="bar"
  series={[
    { name: 'Revenue', data: [44, 55, 57, 56, 61] },
    { name: 'Profit', data: [10, 15, 20, 18, 25] },
  ]}
  categories={['Q1', 'Q2', 'Q3', 'Q4', 'Q5']}
  colors={['#6366F1', '#10B981']}
  stacked={false}
  height={300}
/>
\`\`\`

Rules:
- Wrap Chart in a Card: \`<Card><CardHeader><CardTitle>Title</CardTitle></CardHeader><CardContent><Chart ... /></CardContent></Card>\`
- ALWAYS pass \`colors\` explicitly — use the app's primary color. NEVER let Chart default to the multi-rainbow palette for single-metric charts.
- For pie/donut: 3-6 segments max, use a gradient of shades from the primary color (e.g. \`['#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE']\`) or complementary neutrals.
- Data passed to series must be plain numbers (convert strings with \`Number(x)\`).
- Data arrays must be fresh references on re-render — do NOT mutate in place, or the chart won't update. Always create a new array: \`setData([...existing, newPoint])\`.
- For dashboards: show 2-4 charts max in a grid (\`grid-cols-1 md:grid-cols-2 gap-4\`), not 10.

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

### Styling: Tailwind CSS + @/ui components. Use \`<Icon name="..." />\` from @/ui for all icons. NEVER use emoji for icons.

### Image URLs: ONLY use these two sources for image URLs. NEVER use placeholder.com, placekitten.com, placehold.co, unsplash.com/photos, or local /images/ paths. They are all broken.
- **Photos/placeholders:** https://picsum.photos/seed/{unique-name}/{width}/{height} — Example: https://picsum.photos/seed/sunset-beach/600/600
- **Game sprites (canvas games only):** https://cdn.jsdelivr.net/gh/kefik/kenney@latest/ — Kenney CC0 game art. See GAME PATTERNS section for the full sprite catalog.

### Constraints: No fetch(), no localStorage, no Node.js modules, no external imports. NEVER hardcode data as const arrays — always use useTenantData + seed pattern.`;
