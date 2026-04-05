import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { buildSystemPrompt } from '@/lib/builder/system-prompt';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI();
  return _openai;
}

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

  // Load existing generated code for context (use limit+order instead of single to handle duplicates)
  const { data: existingRows } = await supabase
    .from('generated_templates')
    .select('page_code, admin_code, api_handler_code')
    .eq('template_id', template_id)
    .eq('is_current', true)
    .order('created_at', { ascending: false })
    .limit(1);

  const existing = existingRows?.[0] || null;

  const systemPrompt = buildSystemPrompt(existing || undefined);

  // Use o3 for initial generation (quality), gpt-4o for follow-up edits (speed)
  const isFirstGeneration = !existing && messages.length <= 1;
  const model = isFirstGeneration ? 'o3' : 'gpt-4o';

  const response = await getOpenAI().chat.completions.create({
    model,
    max_tokens: 16384,
    temperature: model === 'o3' ? 1 : 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ],
  });

  const textContent = response.choices[0]?.message?.content;
  if (!textContent) {
    return NextResponse.json({ error: 'No response from model' }, { status: 500 });
  }

  // Parse the JSON response — handle truncated output from large generations
  let generated;
  try {
    let jsonStr = textContent.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();

    try {
      generated = JSON.parse(jsonStr);
    } catch {
      // Try to recover truncated JSON by extracting individual fields
      const pageMatch = jsonStr.match(/"page_code"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const adminMatch = jsonStr.match(/"admin_code"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const explanationMatch = jsonStr.match(/"explanation"\s*:\s*"((?:[^"\\]|\\.)*)"/);


      if (pageMatch) {
        generated = {
          page_code: pageMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\'),
          admin_code: adminMatch ? adminMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\') : null,
          api_handler_code: null,
          explanation: explanationMatch ? explanationMatch[1] : 'Code generated.',
        };
      } else {
        return NextResponse.json({
          error: 'Failed to parse generated code. Try a simpler request.',
        }, { status: 500 });
      }
    }
  } catch {
    return NextResponse.json({
      error: 'Failed to parse generated code. Try again.',
    }, { status: 500 });
  }

  if (!generated.page_code) {
    return NextResponse.json({ error: 'Generated code missing page_code' }, { status: 500 });
  }

  // Always mark ALL previous versions as not current before inserting
  await supabase
    .from('generated_templates')
    .update({ is_current: false })
    .eq('template_id', template_id)
    .eq('is_current', true);

  const { data: maxRow } = await supabase
    .from('generated_templates')
    .select('version')
    .eq('template_id', template_id)
    .order('version', { ascending: false })
    .limit(1);

  const nextVersion = (maxRow?.[0]?.version || 0) + 1;

  await supabase.from('generated_templates').insert({
    template_id,
    page_code: generated.page_code,
    admin_code: generated.admin_code || null,
    api_handler_code: generated.api_handler_code || null,
    component_files: generated.component_files || {},
    conversation_history: messages,
    generation_prompt: messages[0]?.content || '',
    model_used: 'gpt-4o',
    version: nextVersion,
    is_current: true,
  });

  // Auto-create integration definitions if the AI suggested any
  const integrations = generated.suggested_integrations || [];
  if (integrations.length > 0) {
    for (const integ of integrations) {
      // Check if this integration already exists for this template
      const { data: existing } = await supabase
        .from('integration_definitions')
        .select('id')
        .eq('template_id', template_id)
        .eq('service_key', integ.service_key)
        .limit(1);

      if (!existing?.length) {
        await (supabase.from('integration_definitions') as any).insert({
          template_id: template_id,
          name: integ.name,
          service_key: integ.service_key,
          description: integ.description || '',
          integration_type: 'user_provided',
          required_fields: integ.required_fields || ['api_key'],
        });
      }
    }
  }

  return NextResponse.json({
    page_code: generated.page_code,
    admin_code: generated.admin_code || null,
    api_handler_code: generated.api_handler_code || null,
    explanation: generated.explanation || 'Code generated successfully.',
    suggested_integrations: integrations,
    version: nextVersion,
  });
}
