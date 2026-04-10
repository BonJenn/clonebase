// Centralized design token definitions.
// These tokens constrain what the AI generator produces — they're prompt-level
// instructions, not runtime CSS. The UI kit handles runtime rendering.

export interface DesignTokens {
  spacing: {
    page: string;         // outer container padding (e.g. "px-6 py-12")
    section: string;      // vertical space between sections (e.g. "mt-8")
    card: string;         // card internal padding (e.g. "p-4" or "p-6")
    grid: string;         // grid gap (e.g. "gap-4" or "gap-6")
    stack: string;        // vertical stack spacing (e.g. "space-y-4")
  };
  typography: {
    pageTitle: string;
    sectionTitle: string;
    cardTitle: string;
    body: string;
    label: string;
  };
  colors: {
    background: string;       // page background
    surface: string;          // card/panel background
    surfaceAlt: string;       // alternate surface (section bgs)
    border: string;           // default border color
    text: string;             // primary text
    textSecondary: string;    // secondary/body text
    textMuted: string;        // muted labels
  };
  radius: {
    card: string;
    button: string;
    input: string;
    badge: string;
  };
  shadows: {
    card: string;
    cardHover: string;
    elevated: string;         // modals, dropdowns
  };
  borders: {
    card: string;
    input: string;
    divider: string;
  };
}

// Format tokens into a prompt section the AI can follow.
export function formatTokensForPrompt(tokens: DesignTokens, presetName: string): string {
  return `## DESIGN TOKENS — ${presetName.toUpperCase()}

Follow these EXACT values. Do NOT improvise spacing, colors, or radii.

### Spacing
- Page container: \`${tokens.spacing.page}\`
- Section gaps: \`${tokens.spacing.section}\`
- Card padding: \`${tokens.spacing.card}\`
- Grid gap: \`${tokens.spacing.grid}\`
- Vertical stack: \`${tokens.spacing.stack}\`

### Typography
- Page title: \`${tokens.typography.pageTitle}\`
- Section title: \`${tokens.typography.sectionTitle}\`
- Card title: \`${tokens.typography.cardTitle}\`
- Body text: \`${tokens.typography.body}\`
- Labels: \`${tokens.typography.label}\`

### Colors
- Page background: \`${tokens.colors.background}\`
- Card/surface background: \`${tokens.colors.surface}\`
- Alternate surface: \`${tokens.colors.surfaceAlt}\`
- Borders: \`${tokens.colors.border}\`
- Primary text: \`${tokens.colors.text}\`
- Secondary text: \`${tokens.colors.textSecondary}\`
- Muted/label text: \`${tokens.colors.textMuted}\`

### Border Radius
- Cards: \`${tokens.radius.card}\`
- Buttons: \`${tokens.radius.button}\`
- Inputs: \`${tokens.radius.input}\`
- Badges: \`${tokens.radius.badge}\`

### Shadows
- Card default: \`${tokens.shadows.card}\`
- Card hover: \`${tokens.shadows.cardHover}\`
- Elevated (modals): \`${tokens.shadows.elevated}\`

### Borders
- Cards: \`${tokens.borders.card}\`
- Inputs: \`${tokens.borders.input}\`
- Dividers: \`${tokens.borders.divider}\``;
}
