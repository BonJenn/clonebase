// What makes apps good vs bad + architecture patterns + rich data model examples.
// Always included — defines the quality bar.

export const QUALITY_PATTERNS = `## WHAT MAKES AN APP GOOD vs BAD

### BAD app (what you must NEVER generate):
- Single flat list with an add form
- No visual hierarchy, no sections, no whitespace
- Generic gray UI with no personality
- Placeholder text like "Loading..." with no skeleton
- Data model with 2-3 fields
- No filtering, sorting, or search
- No empty states, no loading states, no success feedback
- HARDCODED DATA ARRAYS (e.g., const lessons = [{...}, {...}]) — this is the #1 mistake
- Under 100 lines of code

### GOOD app (what you MUST generate):
- Multiple views/tabs/sections within the page
- Rich data model (8+ fields with enums, arrays, numbers, dates)
- Gradient or colored header/hero area with branding
- Stat cards showing counts, totals, or summaries
- Filter bar with category pills or dropdown
- Search input that filters in real-time
- Sorted data (newest first, with option to change)
- Card-based layouts with hover effects and shadows
- Loading state with animated skeleton placeholders (h-X bg-gray-200 animate-pulse rounded)
- Empty state with large emoji, heading, description, and call-to-action
- Modal or expandable form (not always visible)
- Confirmation before delete
- Color-coded status badges
- Mobile responsive (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3)
- 200-400 lines of thoughtful code

## ARCHITECTURE PATTERNS FOR COMMON APPS

### For any app with a LIST of items:
1. Header with tenantName + description + "Add" button
2. Stats row (total count, filtered count, etc.)
3. Filter/search bar
4. Responsive grid of cards (not a plain <ul>)
5. Each card: emoji icon, title, metadata, status badge, actions
6. Click card to expand or show detail modal
7. Empty state when no items match

### For apps with MULTIPLE entity types (like dating, marketplace, CRM):
- Use a tab bar or sidebar navigation to switch views
- Implement with useState for activeTab
- Each tab renders a different section
- Show counts in tab labels: "Matches (3)", "Messages (12)"

### For apps with USER INTERACTION (chat, social, collaborative):
- Show conversation threads
- Auto-scroll to newest message
- Typing indicators or timestamps
- Online/offline status dots
- Rich message display (not just plain text in a list)

## RICH DATA MODEL EXAMPLES

For a dating app:
\`\`\`typescript
interface Profile {
  id?: string;
  name: string;
  age: number;
  bio: string;
  avatar_emoji: string;
  interests: string[];
  location: string;
  looking_for: 'friendship' | 'dating' | 'networking';
  created_at: string;
}
interface SwipeAction {
  id?: string;
  profile_id: string;
  direction: 'left' | 'right';
  created_at: string;
}
interface Match {
  id?: string;
  profile_id: string;
  profile_name: string;
  matched_at: string;
  last_message?: string;
}
interface Message {
  id?: string;
  match_id: string;
  sender: 'me' | 'them';
  content: string;
  created_at: string;
}
\`\`\`
Use 3-4 collections, not 1. Build actual features with them.

For a finance/budget app:
\`\`\`typescript
interface Transaction {
  id?: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  recurring: boolean;
  notes: string;
  created_at: string;
}
interface Budget {
  id?: string;
  category: string;
  limit_amount: number;
  period: 'weekly' | 'monthly';
  created_at: string;
}
\`\`\``;
