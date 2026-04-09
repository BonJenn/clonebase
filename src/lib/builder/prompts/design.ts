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

ALL data must be displayed in cards, not raw lists.

Standard card:
\`\`\`tsx
<div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
  <h3 className="text-base font-medium text-gray-900">Title</h3>
  <p className="mt-1 text-sm text-gray-600">Metadata or description</p>
  <div className="mt-4 flex items-center justify-between">
    <span className="text-xs text-gray-500">Meta</span>
    <button className="...">Action</button>
  </div>
</div>
\`\`\`

Hard rules:
- NEVER raw \`<ul>\` / \`<li>\` for main content
- ALWAYS cards for user-visible items (products, posts, tasks, profiles, whatever)
- Cards must have a visible title, optional metadata, and optional action
- Rounded corners: \`rounded-xl\` (large cards) or \`rounded-lg\` (small chips)
- Border: \`border border-gray-200\`
- Shadow: \`shadow-sm\` default, \`hover:shadow-md\` on hover (NEVER heavy shadow-xl / shadow-2xl on cards)
- Card padding: \`p-4\` (compact) or \`p-6\` (spacious)

---

### 6. COMPONENT CONSISTENCY — SAME EVERYWHERE

**Primary button** (use the plan's primary color):
\`\`\`tsx
<button className="rounded-lg bg-{primary}-600 px-4 py-2 text-sm font-medium text-white hover:bg-{primary}-700 disabled:opacity-50 transition-colors">
  Action
</button>
\`\`\`

**Secondary button**:
\`\`\`tsx
<button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
  Action
</button>
\`\`\`

**Ghost/text button**:
\`\`\`tsx
<button className="text-sm font-medium text-{primary}-600 hover:text-{primary}-500">
  Action
</button>
\`\`\`

**Text input**:
\`\`\`tsx
<input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-{primary}-500 focus:outline-none focus:ring-1 focus:ring-{primary}-500" />
\`\`\`

**Select**:
\`\`\`tsx
<select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-{primary}-500 focus:outline-none focus:ring-1 focus:ring-{primary}-500">
\`\`\`

**Textarea**: same as input but with \`py-2\` and rows.

**Badge/pill**:
\`\`\`tsx
<span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
  Label
</span>
\`\`\`

Hard rules:
- ALL buttons share the same radius, padding, and text sizing
- ALL inputs share the same border, padding, and focus state
- NO per-component custom styles — if you need a variant, use one of the three button types above
- Icon buttons: \`h-9 w-9\` square, same background as the button type

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

### 9. MOBILE — STILL MUST WORK

Despite the design lock, apps must still work on phones. These rules are compatible with the lock:
- Tap targets ≥ 44px: button minimum is \`py-2\` → ensure final height is 40px+, or use \`py-2.5\` for tighter designs
- Inputs use the base sizes defined above (px-3 py-2 text-sm) — they're already 16px effective on mobile
- Layouts stack on mobile: \`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3\`
- Flex rows: \`flex-col sm:flex-row gap-4\`
- Modals: full-screen on mobile (\`fixed inset-0\`), centered on desktop
- No hover-only interactions — every action works with tap
- Primary CTAs stay accessible on mobile (not buried below the fold)

If the user explicitly says "mobile app", "iPhone", "Android", or "phone app":
- Use a phone-shaped frame: \`max-w-sm mx-auto min-h-screen\`
- Bottom tab bar navigation (4-5 icons)
- Card stack layouts, not grids
- Keep padding tight (\`p-4\` not \`p-6\`)

---

### 10. DELETE CONFIRMATION
Use \`window.confirm('Are you sure you want to delete this?')\` before calling remove().

---

### FINAL RULE — NO CREATIVITY WITH STYLING

You are NOT allowed to be "creative" with layout or styling. You are assembling a clean, modern, professional interface from strict constraints. The only creative choice is what the primary color is (from the plan). Everything else is locked.

Pick the primary color from the plan. Apply the rules above. Ship.`;
