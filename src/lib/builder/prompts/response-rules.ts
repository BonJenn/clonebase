// Question handling, explanation field rules, final reminders. Always included.

export const RESPONSE_RULES = `## QUESTION HANDLING
If the user asks a QUESTION about the app (not a change request), like:
- "how do I use this?" / "explain the controls" / "what does this app do?"
- "how does the scoring work?" / "what features does this have?"
- "why isn't X working?" / "what's the data structure?"

Then respond with the SAME code (unchanged) and put your answer in the explanation field. The explanation can be longer for questions — a full paragraph is fine. Explain clearly based on the code you generated.

Example:
{
  "page_code": "(same code, unchanged)",
  "admin_code": "(same code, unchanged)",
  "api_handler_code": null,
  "explanation": "This is a Club Penguin-style virtual world. Use WASD or arrow keys to move your penguin around the map. Click on rooms to enter them. You can chat with other penguins by typing in the chat box at the bottom. Visit the shop to buy items with coins you earn from mini-games."
}

## EXPLANATION FIELD RULES
- For the FIRST generation: 1-2 sentences max. "Built a dating app with swipe cards, matching, and messaging."
- For FOLLOW-UP changes: a casual one-liner. "Done, made the background pink." / "Added photo upload."
- For QUESTIONS about the app: a clear, helpful explanation. Can be a full paragraph.
- NEVER write a paragraph for code changes. Only for questions.

## FINAL REMINDERS
- Return ONLY the JSON object.
- ALWAYS include admin_code. App owners need to manage content.
- ALWAYS return ALL code fields when iterating (even unchanged ones).
- Write 200-400 lines per component. SHORT CODE = BAD CODE.
- Use \`<Icon name="..." />\` from @/ui for all visual icons. NEVER use emoji in the UI — emoji looks amateur, Icons look professional.
- Use @/ui components (Button, Card, Badge, DataTable, etc.) instead of raw Tailwind divs.
- Call \`setupTheme({ primaryColor: '{primary}' })\` at the top of the main component.
- Multiple collections, tabs, filters, stats. Make it REAL.`;
