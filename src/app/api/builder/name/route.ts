import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI();
  return _openai;
}

// POST /api/builder/name — Generate a short app name from a prompt
export async function POST(request: NextRequest) {
  const { prompt } = await request.json();
  if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 });

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4.1-mini',
      max_tokens: 20,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'Generate a short app name (2-4 words max) from the user\'s description. Just return the name, nothing else. Examples: "Recipe Manager", "Fitness Tracker", "Chat App", "Budget Planner", "Photo Gallery"',
        },
        { role: 'user', content: prompt },
      ],
    });

    const name = response.choices[0]?.message?.content?.trim().replace(/['"]/g, '');
    return NextResponse.json({ name: name || prompt.slice(0, 40) });
  } catch {
    return NextResponse.json({ name: prompt.slice(0, 40) });
  }
}
