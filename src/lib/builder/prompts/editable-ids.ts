// data-edit-id requirements for the inline-editing system. Always included.

export const EDITABLE_IDS = `### EDITABLE ELEMENT IDS — REQUIRED FOR INLINE EDITING
The platform supports inline editing of text and images directly in the preview. For this to work, EVERY text-containing element and EVERY image element MUST have a \`data-edit-id\` attribute.

Rules:
1. **Text elements**: every h1/h2/h3/h4/h5/h6/p/span/a/button/label/li/dt/dd that contains literal text (not just children) needs a unique \`data-edit-id\`.
2. **Image elements**: every \`<img>\` tag needs a unique \`data-edit-id\`.
3. **IDs must be unique within the file**. No duplicates.
4. **IDs must be stable**. Use semantic kebab-case names that describe the role: \`hero-title\`, \`hero-subtitle\`, \`cta-primary-button\`, \`feature-1-icon\`, \`testimonial-2-quote\`, \`footer-copyright\`, \`logo-image\`.
5. **For elements rendered inside .map()**: do NOT add data-edit-id to the mapped element itself (those are dynamic content from the data tab, not directly editable). Only add data-edit-id to STATIC chrome — headers, section titles, button labels, hero copy, static images, etc.
6. **Do not add data-edit-id to wrapper divs** that have no direct text. Only to leaves that have text content or are images.

Example:
\`\`\`tsx
<section className="bg-gray-50 py-24">
  <h2 data-edit-id="features-section-title" className="text-4xl font-bold">Why choose us</h2>
  <p data-edit-id="features-section-subtitle" className="mt-4 text-gray-600">Built for teams that ship.</p>
  <img data-edit-id="features-hero-image" src="https://picsum.photos/seed/team-photo/800/400" alt="Team" />
  <button data-edit-id="features-cta" onClick={...}>Get Started</button>
  {/* Mapped content has no data-edit-id — it's dynamic data */}
  {features.map(f => (
    <div key={f.id}>
      <h3>{f.title}</h3>
      <p>{f.description}</p>
    </div>
  ))}
</section>
\`\`\`

This is REQUIRED for the inline editing system to work. Apps without data-edit-id attributes will not be editable.`;
