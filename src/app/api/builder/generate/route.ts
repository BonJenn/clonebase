import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '@/lib/builder/system-prompt';

const anthropic = new Anthropic();

// POST /api/builder/generate — Generate or iterate on template code
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { template_id, messages } = await request.json();
  if (!template_id || !messages?.length) {
    return NextResponse.json({ error: 'template_id and messages are required' }, { status: 400 });
  }

  // Verify ownership
  const { data: template } = await supabase
    .from('app_templates')
    .select('id, creator_id')
    .eq('id', template_id)
    .single();

  if (!template || template.creator_id !== user.id) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  // Load existing generated code for context
  const { data: existing } = await supabase
    .from('generated_templates')
    .select('page_code, admin_code, api_handler_code')
    .eq('template_id', template_id)
    .eq('is_current', true)
    .single();

  const systemPrompt = buildSystemPrompt(existing || undefined);

  // Call the API
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: systemPrompt,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  });

  // Extract text content
  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    return NextResponse.json({ error: 'No response from model' }, { status: 500 });
  }

  // Parse the JSON response
  let generated;
  try {
    // Try to extract JSON from the response (may be wrapped in markdown fences)
    let jsonStr = textContent.text.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();
    generated = JSON.parse(jsonStr);
  } catch {
    return NextResponse.json({
      error: 'Failed to parse generated code',
      raw: textContent.text,
    }, { status: 500 });
  }

  if (!generated.page_code) {
    return NextResponse.json({ error: 'Generated code missing page_code' }, { status: 500 });
  }

  // Persist to database — mark previous versions as not current
  if (existing) {
    await supabase
      .from('generated_templates')
      .update({ is_current: false })
      .eq('template_id', template_id)
      .eq('is_current', true);
  }

  const nextVersion = existing
    ? ((await supabase.from('generated_templates').select('version').eq('template_id', template_id).order('version', { ascending: false }).limit(1).single()).data?.version || 0) + 1
    : 1;

  await supabase.from('generated_templates').insert({
    template_id,
    page_code: generated.page_code,
    admin_code: generated.admin_code || null,
    api_handler_code: generated.api_handler_code || null,
    component_files: generated.component_files || {},
    conversation_history: messages,
    generation_prompt: messages[0]?.content || '',
    version: nextVersion,
    is_current: true,
  });

  return NextResponse.json({
    page_code: generated.page_code,
    admin_code: generated.admin_code || null,
    api_handler_code: generated.api_handler_code || null,
    explanation: generated.explanation || 'Code generated successfully.',
    version: nextVersion,
  });
}
