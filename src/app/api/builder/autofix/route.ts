import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAnthropic } from '@/lib/anthropic';
import { captureError } from '@/lib/monitoring';

// POST /api/builder/autofix
// Called when transpile or the sandbox iframe fails to render generated code.
// We send the failing code + error to Claude and ask for a patched version.
//
// Scoped to GENERATED code (user's vibecoded app), not platform code. One-shot:
// the caller only retries autofix once per generation to avoid credit burn
// and infinite loops.

export const maxDuration = 90;

interface AutofixRequest {
  code: string;
  error: string;
  stack?: string;
  // Optional: helps Claude understand what to preserve
  component_name?: string;
}

const SYSTEM_PROMPT = `You are a code-fixing assistant for a vibecoded app platform.

The user's app crashed or failed to transpile. You will receive:
- The failing React/TSX code (a single file, "use client" component)
- The error message
- Optionally a stack trace

Return the corrected code as a single JSON object:
{"page_code": "<full corrected TSX here>"}

Rules:
- Return ONLY the JSON object, no prose, no markdown fences
- Preserve the original component's intent — fix the bug, don't rewrite it
- Keep the "use client" directive and export signature
- Do not add new features the user didn't ask for
- Do not import anything from node_modules other than @/sdk/* and @/ui/* and react
- If the error is a syntax error, fix the syntax
- If the error is a runtime error (undefined property, etc), add the missing guard or fix the reference
- If the error suggests the code is unrecoverable, return the code unchanged and the caller will surface the original error`;

export async function POST(request: NextRequest) {
  // Auth — only signed-in users can invoke autofix
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: AutofixRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.code || !body.error) {
    return NextResponse.json({ error: 'code and error are required' }, { status: 400 });
  }

  // Size guard — don't send huge payloads to Claude
  if (body.code.length > 50_000) {
    return NextResponse.json({ error: 'Code too large to autofix' }, { status: 400 });
  }

  const userMessage = [
    `ERROR MESSAGE:\n${body.error}`,
    body.stack ? `STACK:\n${body.stack}` : null,
    body.component_name ? `COMPONENT NAME: ${body.component_name}` : null,
    `\nFAILING CODE:\n\`\`\`tsx\n${body.code}\n\`\`\``,
  ].filter(Boolean).join('\n\n');

  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      temperature: 0.1,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const block = response.content[0];
    const text = (block?.type === 'text' ? block.text : '')?.trim() || '';

    // Extract JSON — Claude sometimes wraps in markdown despite instructions
    let jsonStr = text;
    const fence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) jsonStr = fence[1].trim();

    let parsed: { page_code?: string };
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      captureError(parseErr, {
        subsystem: 'autofix',
        userId: user.id,
        extra: { response_preview: text.slice(0, 1000) },
      });
      return NextResponse.json({ error: 'Autofix response was not valid JSON' }, { status: 502 });
    }

    if (!parsed.page_code) {
      return NextResponse.json({ error: 'Autofix returned no code' }, { status: 502 });
    }

    // Sanity: refuse to return identical code (autofix had nothing to offer)
    if (parsed.page_code.trim() === body.code.trim()) {
      return NextResponse.json({ error: 'Autofix returned unchanged code — error is likely unrecoverable' }, { status: 422 });
    }

    return NextResponse.json({ page_code: parsed.page_code });
  } catch (err) {
    captureError(err, {
      subsystem: 'autofix',
      userId: user.id,
      extra: { code_preview: body.code.slice(0, 2000), original_error: body.error },
    });
    return NextResponse.json({ error: (err as Error).message || 'Autofix failed' }, { status: 500 });
  }
}
