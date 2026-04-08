// Color schemes, layout variety, mobile-first rules. Always included.

export const DESIGN = `## DESIGN — EVERY APP MUST LOOK UNIQUE

DO NOT make every app look the same. Choose a design theme that matches the app's personality:

### Choose a color scheme based on the app type (DO NOT always use indigo):
- Fitness/health: emerald-600, green gradients, energetic feel
- Finance/business: slate-800, blue-700, professional and clean
- Social/dating: rose-500, pink gradients, warm and friendly
- Food/recipes: orange-500, amber, warm appetizing colors
- Gaming: violet-600, purple gradients, fun and bold
- Education: sky-500, teal, calm and focused
- Music/creative: fuchsia-500, gradient meshes, expressive
- Productivity: gray-900 with accent colors, minimal and sharp
- Nature/travel: emerald-500, cyan, earthy and fresh
- E-commerce: amber-600, neutral backgrounds, trustworthy

### Choose a layout style (vary these):
- **Dark mode**: bg-gray-950 text-white — for gaming, music, nightlife apps
- **Light minimal**: bg-white with subtle borders — for productivity, business
- **Colorful gradient**: bg-gradient-to-br from-X to-Y — for social, creative apps
- **Split layout**: sidebar + main content — for dashboards, email-style apps
- **Card-heavy**: masonry or grid of cards — for galleries, marketplaces
- **Full-bleed hero**: large header image/gradient — for landing pages, portfolios

### Design variety rules:
- Pick a PRIMARY color that matches the app's vibe (not always indigo)
- Use that color consistently for buttons, links, accents, active states
- Headers: vary between gradient, solid color, minimal, or dark styles
- Cards: vary between bordered, shadowed, colored backgrounds, or glass-morphism
- Buttons: vary between rounded-full pill, rounded-lg standard, or square
- Navigation: vary between top tabs, sidebar, bottom bar, or floating menu

### Must-have design elements:
- Loading skeletons (animate-pulse placeholders)
- Empty states with relevant emoji, heading, and CTA
- Hover effects on interactive elements (scale, shadow, color)
- Smooth transitions (transition-all duration-200)
- Responsive grid (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3)
- Proper spacing (consistent p-4/p-5/p-6, gap-4)

### MOBILE-FIRST — every app MUST work on phones
Most users open apps on their phone. Design mobile-first, then enhance for desktop.

Mandatory mobile rules:
- Tap targets ≥ 44px (h-11 minimum on buttons, no tiny icons)
- Inputs use \`text-base\` (16px+) — anything smaller triggers iOS zoom
- Bottom-anchored primary actions on mobile (sticky bottom bar with main CTA)
- Layouts stack vertically by default, expand to multi-column on \`sm:\` and \`lg:\`
- Use \`flex-col sm:flex-row\` patterns, never the reverse
- Modals: full-screen on mobile (\`fixed inset-0\`), centered on desktop
- Navigation: bottom tab bar on mobile (\`fixed bottom-0\`), top nav on desktop (\`sm:static\`)
- No hover-only interactions — everything must work with tap
- Touch-friendly spacing: \`gap-3\` minimum between tap targets
- Use \`safe-area-inset\` padding for fixed bottom elements: \`pb-[env(safe-area-inset-bottom)]\`
- Test mentally: would my mom be able to use this on her iPhone?

If the user explicitly says "mobile app", "iPhone", "Android", or "phone app":
- Use a phone-shaped frame: \`max-w-sm mx-auto min-h-screen\`
- Bottom tab bar navigation (4-5 icons max)
- Card stack layouts, not grids
- Large emoji/icons, generous spacing
- Mimic native iOS/Android patterns

### Delete confirmation:
Use window.confirm('Are you sure you want to delete this?') before calling remove()`;
