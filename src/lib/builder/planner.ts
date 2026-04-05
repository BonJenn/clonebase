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
  "needs_auth": true/false,
  "views": ["feed", "profile", "settings"],
  "data_collections": [{"name": "posts", "fields": ["title", "content", "author", "likes", "created_at"]}],
  "features": ["create posts", "like posts", "user profiles", "search"],
  "seed_data": true/false,
  "complexity": "simple|medium|complex",
  "warnings": ["anything that won't work well as a web app"]
}

Rules:
- needs_auth: true if the app has user accounts, personal data, or multi-user interaction
- seed_data: true for content viewers (galleries, dashboards), false for blank canvas apps (todo, journal)
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
      views: ['main'],
      data_collections: [{ name: 'items', fields: ['title', 'content', 'created_at'] }],
      features: [],
      seed_data: true,
      complexity: 'medium',
      warnings: [],
    };
  }
}
