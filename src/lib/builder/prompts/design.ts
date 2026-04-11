// Design system lock: strict, non-negotiable UI rules.
// Inspired by Linear, Stripe, and Refactoring UI. Always included.

export const DESIGN = `## 🔒 DESIGN SYSTEM LOCK — NON-NEGOTIABLE UI RULES

You are NOT designing freely. You are assembling UI within a strict, modern design system inspired by Linear, Stripe, and Refactoring UI.

If you violate ANY rule below, the app will look amateur. Do NOT improvise. Consistency > creativity.

---

### 1. SPACING SYSTEM — STRICT SCALE ONLY

Use ONLY these Tailwind spacing values:
- 4px  → 1   (p-1, m-1, gap-1)
- 8px  → 2   (p-2, m-2, gap-2)
- 12px → 3   (p-3, m-3, gap-3)
- 16px → 4   (p-4, m-4, gap-4)
- 24px → 6   (p-6, m-6, gap-6)
- 32px → 8   (p-8, m-8, gap-8)
- 48px → 12  (p-12, m-12, gap-12)

Hard rules:
- NEVER use arbitrary spacing like \`p-[13px]\`, \`gap-[22px]\`, \`mt-[7px]\`
- Page sections: ALWAYS \`py-12\` or \`py-16\`
- Cards: ALWAYS \`p-4\` or \`p-6\`
- Gaps in grids/flex rows: ALWAYS \`gap-3\`, \`gap-4\`, or \`gap-6\`
- Vertical stacks: \`space-y-4\` or \`space-y-6\`

Bad spacing = ugly app. No exceptions.

---

### 2. TYPOGRAPHY SYSTEM — STRICT HIERARCHY

Use ONLY these 5 text styles across the whole app:
- **Page title** → \`text-3xl font-semibold tracking-tight text-gray-900\`
- **Section title** → \`text-xl font-semibold text-gray-900\`
- **Card title** → \`text-base font-medium text-gray-900\`
- **Body text** → \`text-sm text-gray-600\`
- **Labels / meta** → \`text-xs text-gray-500\`

Hard rules:
- NEVER invent random sizes like \`text-[15px]\`, \`text-[22px]\`
- NEVER use more than 5 text sizes in the whole app
- NEVER mix more than 2 font weights (font-medium, font-semibold — no font-bold, no font-black)
- Use \`tracking-tight\` ONLY on page titles (\`text-3xl\` and above)
- All-caps labels allowed rarely: \`text-xs uppercase tracking-wide text-gray-500\`

Typography consistency = professional UI.

---

### 3. COLOR SYSTEM — LIMITED PALETTE

Each app gets AT MOST:
- **1 PRIMARY color** — from the plan (rose, emerald, sky, violet, amber, orange, slate, fuchsia, teal)
- **1 NEUTRAL base** — gray or slate
- **1 optional accent** — used sparingly for warnings/success

Where the primary color is used:
- Buttons (\`bg-{primary}-600\` default, \`bg-{primary}-700\` hover)
- Active states (\`bg-{primary}-50\` + \`text-{primary}-700\`)
- Links (\`text-{primary}-600\` + \`hover:text-{primary}-500\`)
- Focus rings (\`ring-{primary}-500\`)
- NOTHING ELSE gets the primary color

Background rules:
- Page background: \`bg-white\` or \`bg-gray-50\`
- Card background: \`bg-white\`
- Subtle surface: \`bg-gray-50\` or \`bg-gray-100\`
- Never gradient backgrounds on full pages

Hard rules:
- NEVER use indigo unless the plan explicitly says indigo
- NEVER use more than 2-3 colors total across the entire app
- NEVER sprinkle random Tailwind colors (no bg-pink-300 next to bg-green-400 next to bg-blue-500)
- Destructive actions use \`text-red-600\` / \`bg-red-600\` — but only for destructive actions
- Success feedback uses \`text-green-600\` or \`bg-green-50 text-green-700\`

Too many colors = looks like AI garbage. One primary color, disciplined neutrals, done.

---

### 4. LAYOUT SYSTEM — CONSISTENT STRUCTURE

Every page MUST follow this skeleton:
\`\`\`tsx
<div className="mx-auto max-w-6xl px-6 py-12">
  {/* Page header */}
  <div className="flex items-center justify-between">
    <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Page Title</h1>
    <button className="...">Primary action</button>
  </div>

  {/* Optional stats row */}
  <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">...</div>

  {/* Optional filters/search */}
  <div className="mt-8 flex items-center gap-3">...</div>

  {/* Main content grid */}
  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">...</div>
</div>
\`\`\`

Hard rules:
- ALWAYS \`mx-auto max-w-6xl\` on the outer container (use \`max-w-4xl\` for reading-heavy apps, \`max-w-7xl\` max)
- ALWAYS \`px-6 py-12\` on the outer container (or \`px-4 py-8\` mobile → \`sm:px-6 sm:py-12\`)
- NEVER full-width chaos layouts
- ALWAYS use grid or flex — no random stacking of divs
- Vertical rhythm between sections: \`mt-8\` or \`mt-12\`

---

### 5. CARD SYSTEM — DEFAULT UI PATTERN

ALL data must be displayed in cards, not raw lists. Use \`<Card>\` from @/ui:

\`\`\`tsx
<Card className="hover:shadow-md transition-shadow">
  <CardHeader>
    <CardTitle>Project Alpha</CardTitle>
    <CardDescription>Last updated 2 hours ago</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-gray-600">Description here...</p>
  </CardContent>
  <CardFooter>
    <Button variant="ghost" size="sm">View Details</Button>
  </CardFooter>
</Card>
\`\`\`

Hard rules:
- NEVER raw \`<ul>\` / \`<li>\` for main content
- ALWAYS \`<Card>\` for user-visible items (products, posts, tasks, profiles, whatever)
- Cards must have a visible title, optional metadata, and optional action
- Use \`<DataTable>\` for tabular data instead of cards
- NEVER heavy shadow-xl / shadow-2xl on cards
- Use \`<EmptyState>\` when a collection has no items

---

### 6. COMPONENT CONSISTENCY — USE @/ui COMPONENTS

**Use the @/ui component kit for ALL standard UI elements. This guarantees consistency:**

\`\`\`tsx
// Buttons — always use <Button> from @/ui:
<Button variant="primary" onClick={handleSave}>Save</Button>
<Button variant="secondary" onClick={handleCancel}>Cancel</Button>
<Button variant="ghost" icon="edit" size="sm">Edit</Button>
<Button variant="danger" onClick={() => setShowConfirm(true)}>Delete</Button>

// Inputs — always use <Input> from @/ui:
<Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} error={emailError} />

// Selects — always use <Select> from @/ui:
<Select label="Category" value={category} onChange={e => setCategory(e.target.value)} options={categoryOptions} />

// Badges — always use <Badge> from @/ui:
<Badge variant="success" dot>Active</Badge>
<Badge variant="warning">Pending</Badge>
\`\`\`

Hard rules:
- ALL buttons use \`<Button>\` — never raw \`<button>\` with Tailwind
- ALL inputs use \`<Input>\` — never raw \`<input>\` with Tailwind
- ALL selects use \`<Select>\` — never raw \`<select>\` with Tailwind
- ALL badges use \`<Badge>\` — never raw \`<span>\` with Tailwind
- ALL icons use \`<Icon name="..." />\` — NEVER emoji

---

### 7. VISUAL SIMPLICITY — ANTI-AI RULE

AVOID these "AI telltale signs":
- ❌ Excessive gradients (\`bg-gradient-to-br from-rose-500 via-fuchsia-500 to-amber-500\`)
- ❌ Heavy shadows on everything (\`shadow-2xl\` on cards)
- ❌ Emoji-bedazzled headings (\`✨ 🔥 Dashboard 🚀 ⭐\`)
- ❌ Random accent colors on alternating cards
- ❌ Glassmorphism / backdrop-blur on content
- ❌ Neon glows, pulsing borders, rainbow text
- ❌ Cluttered layouts with 15 stats in a row
- ❌ Centered text blocks where left-aligned would be cleaner
- ❌ \`font-black\` or \`font-extrabold\` anywhere

PREFER:
- ✓ Whitespace — let elements breathe
- ✓ Alignment — everything lines up on a grid
- ✓ Consistency — the same pattern repeated
- ✓ Subtlety — small shadows, muted borders, single accent color
- ✓ Left-aligned content (except rare callouts)
- ✓ Monochrome icons (\`text-gray-400\` or \`text-{primary}-600\`)

If unsure → make it simpler. Remove, don't add.

---

### 8. DESIGN INSPIRATION TARGET

Every UI must feel like one of:
- **Linear.app** — clean, monochrome, very tight spacing, single accent color
- **Stripe Dashboard** — neutral grays, soft borders, abundant whitespace
- **Modern SaaS dashboard** — card grids, left-aligned, minimal decoration

If it looks like a free template or AI-generated sludge → you failed.

---

### 9. RESPONSIVE BY DEFAULT — NON-NEGOTIABLE

**EVERY app MUST work on phones, tablets, AND desktops. This is NOT optional. Do NOT wait for the user to ask for "mobile support". ALL apps are responsive from day one.**

You MUST apply ALL of the following responsive patterns in EVERY app you generate — no exceptions:

#### Layout stacking (REQUIRED for every grid and flex row):
\`\`\`tsx
// Grids: ALWAYS start with 1 column on mobile, expand on larger screens
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Flex rows: ALWAYS stack vertically on mobile, horizontal on desktop
<div className="flex flex-col sm:flex-row gap-4">

// Page header with action: stack on mobile, side-by-side on desktop
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
  <h1 className="text-3xl font-semibold tracking-tight">Title</h1>
  <Button>Action</Button>
</div>
\`\`\`

#### Container padding (REQUIRED on every page wrapper):
\`\`\`tsx
// Tighter on mobile, spacious on desktop
<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
\`\`\`

#### Touch targets (REQUIRED on every interactive element):
- All buttons: minimum height 40px (\`py-2\` or \`py-2.5\`). @/ui \`<Button>\` handles this.
- All inputs: use \`text-base\` (16px+) to prevent iOS zoom on focus. @/ui \`<Input>\` handles this.
- All tap targets: minimum 44x44px touch area
- Spacing between interactive elements: \`gap-3\` minimum so fingers don't hit the wrong target

#### Text scaling (REQUIRED for all headings):
\`\`\`tsx
// Page titles: smaller on mobile, larger on desktop
<h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">

// Section titles: consistent but not oversized on mobile
<h2 className="text-lg sm:text-xl font-semibold">
\`\`\`

#### Tables on mobile (REQUIRED for any data table):
\`\`\`tsx
// Wrap in horizontal scroll container so tables don't break on narrow screens
<div className="overflow-x-auto">
  <DataTable ... />
</div>
\`\`\`

#### Modals on mobile (REQUIRED for all dialogs):
- Full-screen on mobile (\`fixed inset-0\`), centered card on desktop
- @/ui \`<Dialog>\` handles this automatically — ALWAYS use it

#### Images on mobile (REQUIRED):
- All images: \`w-full\` or \`max-w-full\` to prevent horizontal overflow
- Image grids: \`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3\`

#### No hover-only interactions (REQUIRED):
- Every hover state must have a tap equivalent
- Tooltips: use @/ui \`<Tooltip>\` which shows on both hover and long-press
- Dropdown menus: must open on tap, not just hover

#### Bottom navigation for multi-view apps (REQUIRED when 3+ views):
\`\`\`tsx
// Fixed bottom bar on mobile, hidden on desktop (where you use a sidebar or top tabs)
<nav className="fixed bottom-0 left-0 right-0 flex sm:hidden border-t bg-white">
  {views.map(v => (
    <button key={v.id} onClick={() => setView(v.id)}
      className="flex-1 flex flex-col items-center py-3 text-xs">
      <Icon name={v.icon} size={20} />
      <span className="mt-1">{v.label}</span>
    </button>
  ))}
</nav>
// Add bottom padding to main content so it's not hidden behind the nav bar:
<div className="pb-20 sm:pb-0">
\`\`\`

#### Stats/KPIs on mobile (REQUIRED):
\`\`\`tsx
// Stats cards: stack 1 per row on mobile, 3 on desktop
<KPIGrid className="grid-cols-1 sm:grid-cols-3">
\`\`\`

#### Self-test: before returning code, mentally shrink the viewport to 375px wide (iPhone SE). Walk through EVERY screen:
- [ ] Can I read all text? (nothing overflows or gets cut off)
- [ ] Can I tap every button? (nothing is too small or too close together)
- [ ] Do grids stack to 1 column? (no horizontal scroll except tables)
- [ ] Do flex rows stack vertically? (no side-by-side cramming)
- [ ] Are modals full-screen? (no tiny centered box on a phone)
- [ ] Is the bottom nav visible? (for 3+ view apps)
- [ ] Do images scale down? (no overflow)

If ANY of these fail, the app is BROKEN on mobile. Fix it before returning code.

---

#### Mobile-first frame (ONLY when user explicitly requests a mobile app):
If the user says "mobile app", "iPhone", "Android", or "phone app":
- Use a phone-shaped frame: \`max-w-sm mx-auto min-h-screen\`
- Bottom tab bar navigation (4-5 icons)
- Card stack layouts, not grids
- Keep padding tight (\`p-4\` not \`p-6\`)
This is ADDITIONAL to the responsive rules above, not a replacement.

---

### 10. DELETE CONFIRMATION
Use \`<ConfirmDialog>\` from @/ui for all destructive actions (delete, remove, clear). Never use \`window.confirm()\`.

\`\`\`tsx
const [showConfirm, setShowConfirm] = useState(false);
// ...
<ConfirmDialog open={showConfirm} onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete} title="Delete this item?"
  description="This action cannot be undone." confirmLabel="Delete" variant="danger" />
\`\`\`

---

### 11. COMPONENT PRIORITY — ALWAYS USE @/ui FIRST

When building ANY UI element, follow this priority:
1. **@/ui component** — Button, Card, Input, DataTable, Badge, Dialog, EmptyState, etc.
2. **Raw Tailwind + semantic HTML** — only when no @/ui component fits
3. **Never re-implement** what @/ui already provides

This means:
- Buttons → \`<Button>\` (never raw \`<button>\` with custom Tailwind)
- Cards → \`<Card>\` (never raw \`<div>\` with border/shadow)
- Tables → \`<DataTable>\` (never raw \`<table>\`)
- Modals → \`<Dialog>\` (never custom fixed/absolute overlay divs)
- Empty states → \`<EmptyState>\` (never just a text paragraph)
- Loading → \`<LoadingState>\` (never a custom spinner div)
- Icons → \`<Icon name="..."\` />\` (NEVER emoji)
- Stats → \`<StatCard>\` or \`<KPIGrid>\` (never custom stat divs)
- Feedback → \`toast()\` (never inline success/error messages)

---

### FINAL RULE — NO CREATIVITY WITH STYLING

You are NOT allowed to be "creative" with layout or styling. You are assembling a clean, modern, professional interface from strict constraints. The only creative choice is what the primary color is (from the plan). Everything else is locked.

Pick the primary color from the plan. Apply the rules above. Ship.`;
