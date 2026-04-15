import { NextRequest, NextResponse } from 'next/server';
import { getAnthropic } from '@/lib/anthropic';

// POST /api/builder/name — Generate a short app name from a prompt.
// Best-effort: always returns 200 with a name (falls back to truncated prompt).
export async function POST(request: NextRequest) {
  let prompt: string;
  try {
    const body = await request.json();
    prompt = body?.prompt;
  } catch {
    return NextResponse.json({ name: 'New App' });
  }

  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ name: 'New App' });
  }

  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      temperature: 0.7,
      system: 'Generate a short app name (2-4 words max) from the user\'s description. Just return the name, nothing else. Examples: "Recipe Manager", "Fitness Tracker", "Chat App", "Budget Planner", "Photo Gallery"',
      messages: [{ role: 'user', content: prompt }],
    });

    const block = response.content[0];
    const name = (block?.type === 'text' ? block.text : '')?.trim().replace(/['"]/g, '');
    return NextResponse.json({ name: name || prompt.slice(0, 40) });
  } catch {
    return NextResponse.json({ name: prompt.slice(0, 40) });
  }
}
