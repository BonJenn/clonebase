// Starter pattern selection guide. Always included.
// Tells the model which combination of @/ui components to use for each app type.
// These are NOT full code — they're structural blueprints the model expands.

export const PATTERNS = `## APP PATTERN SELECTION

When you identify the type of app, use the matching pattern below as your structural starting point. Expand it with real data, state management, and interactivity.

### Pattern: SaaS Dashboard
**When:** analytics, metrics, dashboard, monitoring, admin panel
**Shell:** AppShell + Sidebar
**Components:** KPIGrid, Chart (area/bar), DataTable, Badge, Tabs
**Views:** dashboard (stats + charts), list (DataTable), detail (Card), settings (SettingsSection)
**Color:** quiet primary (slate, sky, indigo, violet)

### Pattern: CRM / List-Detail
**When:** contacts, customers, leads, inventory, records
**Shell:** AppShell + Sidebar
**Components:** DataTable, FilterBar, Dialog (create/edit), Badge, Avatar, Tabs
**Views:** list (table + filters), detail (sidebar or full view), create (dialog)
**Color:** professional (sky, slate, teal)

### Pattern: Project Manager / Kanban
**When:** tasks, projects, kanban, workflow, board
**Shell:** AppShell + Sidebar
**Components:** Card (draggable), Badge (status), FilterBar, Dialog (edit task), Progress
**Views:** board (column grid), list (DataTable), detail (dialog/side panel)
**Layout:** Kanban columns use \`flex gap-4 overflow-x-auto\` with \`min-w-[280px]\` columns
**Color:** clean primary (indigo, violet, sky)

### Pattern: E-Commerce / Store
**When:** shop, store, products, cart, checkout
**Shell:** TopBar + simple layout
**Components:** Card (product), FilterBar, Badge (price/category), Button (add to cart), Dialog (cart)
**Views:** catalog (card grid), product detail, cart (sidebar/dialog), checkout (form)
**Color:** commercial (emerald, orange, rose)

### Pattern: Business Landing Page
**When:** restaurant, agency, salon, real business, portfolio
**Shell:** No AppShell — full-width sections with sticky nav
**Components:** Button (CTA), Card (services/team), Badge, Icon
**Sections:** Hero (full-width image + overlay text), Services/Menu (card grid), About, Testimonials, Contact, Footer
**Layout:** Full-width, alternating bg-white/bg-gray-50 sections, max-w-6xl content
**Color:** professional (rose, emerald, amber, slate)

### Pattern: Social Feed / Community
**When:** social, feed, posts, timeline, community, forum
**Shell:** TopBar or mobile bottom tabs
**Components:** Card (post), Avatar, Badge, Button (like/share), Textarea (compose)
**Views:** feed (card stack), profile, compose (dialog), notifications
**Color:** social (blue, sky, rose)

### Pattern: Content / Blog
**When:** blog, articles, content, magazine, documentation
**Shell:** TopBar + max-w-3xl reading layout
**Components:** Card (article preview), Badge (category), Avatar (author)
**Views:** list, article detail (prose layout), categories
**Layout:** max-w-3xl for reading, max-w-5xl for grid
**Color:** editorial (slate, gray, emerald)

### Pattern: Settings / Account
**When:** settings, profile, preferences, account, configuration
**Shell:** AppShell + Sidebar (or tabs)
**Components:** SettingsSection, Input, Switch, Select, Button, Avatar
**Views:** profile, notifications, security, billing, danger zone
**Layout:** max-w-2xl stacked sections
**Color:** neutral (slate, gray)

### Pattern: Onboarding / Wizard
**When:** setup, onboarding, wizard, getting started, walkthrough
**Shell:** Centered max-w-lg
**Components:** Progress, Button (next/back), Input/Select (form steps), Icon
**Layout:** Centered card with step indicator, max-w-lg
**Color:** welcoming primary (sky, emerald, violet)

### Pattern: Marketplace / Catalog
**When:** marketplace, catalog, directory, listings, browse
**Shell:** TopBar + simple layout
**Components:** Card (listing), FilterBar, Badge, DataTable, Select (sort)
**Views:** browse (card grid + filters), detail, post listing (dialog)
**Color:** marketplace (indigo, teal, orange)

### Pattern: Pricing / Checkout
**When:** pricing, plans, subscription, checkout
**Shell:** Centered max-w-5xl
**Components:** Card (pricing tier), Badge (popular), Button (subscribe), Icon (feature check)
**Layout:** 3-column grid for pricing cards, centered
**Color:** commercial (indigo, emerald, sky)

### Pattern: Portfolio / Creator Page
**When:** portfolio, resume, personal site, creator, gallery
**Shell:** No AppShell — full-width with header
**Components:** Card (project), Badge (tech), Avatar, Icon
**Sections:** Hero (name + tagline), Projects (card grid), Skills (badge list), Contact
**Color:** personal (violet, rose, slate, amber)

### Pattern: Internal Tool / CRUD
**When:** admin, management, internal, backoffice, CRUD operations
**Shell:** AppShell + Sidebar
**Components:** DataTable, FilterBar, Dialog (create/edit), ConfirmDialog (delete), Badge, toast
**Views:** list (table), create (dialog), edit (dialog)
**Color:** professional (slate, gray, sky)

### Pattern: Game / Interactive
**When:** game, simulation, interactive, virtual world, puzzle
**Shell:** Full-screen, dark background
**Components:** Icon (HUD), Badge (score), Button (menu), Dialog (pause/gameover)
**Special:** Canvas for movement games, HTML for card/board games
**Menu screen:** Centered layout with title, Icon decoration, Play button
**HUD:** Absolute-positioned top bar with score/health badges
**Color:** game-appropriate (emerald for nature, sky for water, rose for action, amber for adventure)

### Pattern: Mobile Feed
**When:** mobile app, phone app, iPhone, feed-style
**Shell:** max-w-sm + bottom tab bar
**Components:** Card (feed item), Avatar, Badge, Icon (tab icons)
**Layout:** Card stack, bottom fixed nav, tight padding
**Color:** app-appropriate

### FINAL RULE: If the app doesn't match any pattern above, default to:
- AppShell (simple, no sidebar) for utility apps
- Card-based entity display
- PageHeader + content structure
- Primary color from plan`;
