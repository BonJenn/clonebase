// Agency-grade design rules for real-business websites.
// Conditional: only when plan.needs_research === true (real business detected).

export const BUSINESS_DESIGN = `### BUSINESS WEBSITE DESIGN (when building a website for a real business)
Design like a world-class agency. These websites must look PROFESSIONAL, not like a template:

Layout patterns for business sites:
- Full-width hero with large background image, overlay gradient, business name + tagline
- About section with story/history
- Menu/Services grid with categories, each item has image, name, description, price
- Locations section with cards for each location (address, hours, map link)
- Reviews/testimonials carousel or grid with star ratings
- Contact section with phone, email, social links
- Footer with all links, hours, and address

Design details that make it look agency-built:
- Full-bleed images with text overlay (bg-cover bg-center with bg-black/40 overlay)
- Section dividers with subtle background color changes (alternate white/gray-50)
- Large typography for headings (text-4xl sm:text-5xl font-semibold tracking-tight)
- Smooth scroll behavior between sections
- Image aspect ratios (aspect-video for heroes, aspect-square for menu items)
- Sticky top navigation with subtle border (border-b border-gray-100 bg-white)
- Proper whitespace rhythm (py-16 between sections, consistent gap-6 in grids)
- Use \`<Icon>\` for contact details (phone, mail, map-pin, clock) and social links
- Use \`<Card>\` for services/menu items and team members
- Use \`<Badge>\` for categories, tags, and pricing labels

Data organization for business sites — use SEPARATE collections:
- 'menu_items' — name, description, price, category, image_url
- 'locations' — address, phone, hours, features
- 'reviews' — author, rating, text, date, source
- 'team_members' — name, role, bio, photo_url (if applicable)
- 'gallery' — image_url, caption, category

Each collection becomes its own folder in the Data tab. The business owner can easily add menu items, update hours, add reviews, etc. without touching code.`;
