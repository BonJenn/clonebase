import OpenAI from 'openai';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI();
  return _openai;
}

export interface AppPlan {
  app_name: string;
  description: string;
  needs_auth: boolean;
  mobile_first?: boolean;
  needs_research: boolean;
  research_query: string;
  views: string[];
  data_collections: { name: string; fields: string[] }[];
  features: string[];
  seed_data: boolean;
  complexity: 'simple' | 'medium' | 'complex';
  warnings: string[];
}

// Pass 1: Analyze the user's prompt and create a structured plan.
// This runs fast (gpt-4.1-mini) and constrains what the code generator builds.
export async function planApp(prompt: string): Promise<AppPlan> {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4.1-mini',
    max_tokens: 1000,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content: `You are an app architect. Analyze the user's app description and return a JSON plan. Be realistic about what can be built as a single-page React app with in-memory data.

Return ONLY valid JSON:
{
  "app_name": "Short App Name (2-4 words)",
  "description": "One sentence description",
  "app_type": "standard|game|interactive",
  "design_theme": "dark|light|colorful|minimal",
  "primary_color": "emerald|rose|violet|sky|amber|slate|fuchsia|orange|teal|cyan",
  "needs_auth": true/false,
  "mobile_first": true/false,
  "views": ["feed", "profile", "settings"],
  "data_collections": [{"name": "posts", "fields": ["title", "content", "author", "likes", "created_at"]}],
  "features": ["create posts", "like posts", "user profiles", "search"],
  "seed_data": true/false,
  "needs_research": true/false,
  "research_query": "what to search for online",
  "complexity": "simple|medium|complex",
  "warnings": ["anything that won't work well as a web app"]
}

Design rules:
- design_theme: "dark" for gaming/music/nightlife, "light" for business/productivity, "colorful" for social/creative, "minimal" for tools/utilities
- primary_color: pick a color that matches the app's personality. Fitness=emerald, Social=rose, Gaming=violet, Finance=slate, Food=orange, Education=sky. NEVER default to indigo — be creative.

Rules:
- app_type: "game" for games/virtual worlds/interactive simulations (use canvas + game loop), "interactive" for drawing/animation apps, "standard" for everything else
- mobile_first: TRUE if the user mentions "mobile", "phone", "iPhone", "Android", "mobile app", "swipe", "tap" — design as a phone app with bottom nav, card stacks, full-bleed mobile layout. FALSE for normal websites that just need to be responsive.
- needs_auth — be smart about this:
  TRUE: social apps, apps where "users" post/share/interact, blogs with authors, messaging, dating, any app where people have accounts or profiles, games with save progress, apps with "my" data (my recipes, my workouts)
  FALSE: single-user tools (calculator, timer, converter), public content viewers (dashboard, gallery with no user posting), simple utilities, games without accounts, anonymous apps
  When in doubt: if the prompt mentions "users", "accounts", "profiles", "sign up", "personal", or implies multiple people using it → TRUE
- seed_data: true for content viewers (galleries, dashboards), false for blank canvas apps (todo, journal)
- needs_research: true if the user mentions a SPECIFIC real business, person, place, or topic that needs current factual information to build properly. Examples: "my pizza restaurant Tony's Pizza", "a website for Dr. Smith's dental practice", "a fan page for Taylor Swift". FALSE for generic apps like "a todo list" or "a fitness tracker".
- research_query: what to search for online to get the real information. e.g., "Tony's Pizza restaurant menu hours location reviews"
- For games: describe the game mechanics in features (movement, collision, scoring, rooms/levels)
- For virtual worlds (Club Penguin, Habbo, etc.): use 2D top-down canvas with WASD movement, rooms, and emoji sprites. NOT 3D. NOT just chat rooms with buttons.
- Real-time multiplayer is NOT possible — simulate with NPC characters instead
- complexity: simple (1-2 views, 1 collection), medium (3-4 views, 2-3 collections), complex (5+ views, 4+ collections)
- warnings: flag things like "real-time multiplayer requires WebSocket which isn't supported", "3D graphics not possible in this environment"
- Keep views to maximum 5. If the user asks for too much, simplify.
- Maximum 4 data collections. Combine related data if needed.`
      },
      { role: 'user', content: prompt },
    ],
  });

  const text = response.choices[0]?.message?.content?.trim() || '';
  try {
    let jsonStr = text;
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();
    return JSON.parse(jsonStr);
  } catch {
    return {
      app_name: prompt.slice(0, 40),
      description: prompt,
      needs_auth: false,
      needs_research: false,
      research_query: '',
      views: ['main'],
      data_collections: [{ name: 'items', fields: ['title', 'content', 'created_at'] }],
      features: [],
      seed_data: true,
      complexity: 'medium',
      warnings: [],
    };
  }
}
