import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { buildSystemPrompt } from '@/lib/builder/system-prompt';
import { planApp } from '@/lib/builder/planner';

export const maxDuration = 120;

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

  // Load existing generated code
  const { data: existingRows } = await supabase
    .from('generated_templates')
    .select('page_code, admin_code, api_handler_code')
    .eq('template_id', template_id)
    .eq('is_current', true)
    .order('created_at', { ascending: false })
    .limit(1);

  const existing = existingRows?.[0] || null;
  const isFirstGeneration = !existing && messages.length <= 1;

  // PASS 1: Plan the app (first generation only)
  let planContext = '';
  let plan = null;
  if (isFirstGeneration) {
    plan = await planApp(messages[0].content);
    planContext = `
## APP PLAN (follow this exactly)
App Name: ${plan.app_name}
Complexity: ${plan.complexity}
Authentication: ${plan.needs_auth ? 'YES — use useTenantAuth()' : 'NO — do not add auth'}
Seed Data: ${plan.seed_data ? 'YES — seed with realistic data' : 'NO — start empty'}
Views: ${plan.views.join(', ')} (use state-based navigation, max ${plan.views.length} views)
Data Collections: ${plan.data_collections.map(c => `${c.name}(${c.fields.join(', ')})`).join('; ')}
Features: ${plan.features.join(', ')}
${plan.warnings.length > 0 ? `WARNINGS: ${plan.warnings.join('. ')}` : ''}

IMPORTANT CONSTRAINTS FROM PLAN:
- Maximum ${plan.views.length} views/tabs. Do NOT add more.
- Maximum ${plan.data_collections.length} data collections. Do NOT add more.
- Keep code under 400 lines. If the plan is "complex", focus on core features and make them work perfectly rather than building everything half-broken.
- NEVER use non-null assertions (!)  — always check for null/undefined with optional chaining (?.) or guard clauses.
- Every click handler must check if the required data exists before acting.
`;
  }

  // PASS 2: Generate the code
  const systemPrompt = buildSystemPrompt(existing || undefined);
  const model = isFirstGeneration ? 'gpt-4.1' : 'gpt-4.1-mini';

  // For follow-ups, only send the last few messages to stay within token limits
  // The existing code is already in the system prompt via buildSystemPrompt
  const conversationMessages = isFirstGeneration
    ? messages
    : messages.slice(-6); // Last 3 exchanges max

  const response = await getOpenAI().chat.completions.create({
    model,
    max_tokens: 16384,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt + planContext },
      ...conversationMessages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ],
  });

  const textContent = response.choices[0]?.message?.content;
  if (!textContent) {
    return NextResponse.json({ error: 'No response from model' }, { status: 500 });
  }

  // Parse the JSON response — handle truncated output
  let generated;
  try {
    let jsonStr = textContent.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();

    try {
      generated = JSON.parse(jsonStr);
    } catch {
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
        return NextResponse.json({ error: 'Failed to parse generated code. Try a simpler request.' }, { status: 500 });
      }
    }
  } catch {
    return NextResponse.json({ error: 'Failed to parse generated code. Try again.' }, { status: 500 });
  }

  if (!generated.page_code) {
    return NextResponse.json({ error: 'Generated code missing page_code' }, { status: 500 });
  }

  // Persist to database
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
    model_used: model,
    version: nextVersion,
    is_current: true,
  });

  // Auto-create integration definitions if suggested
  const integrations = generated.suggested_integrations || [];
  if (integrations.length > 0) {
    for (const integ of integrations) {
      const { data: existingInteg } = await supabase
        .from('integration_definitions')
        .select('id')
        .eq('template_id', template_id)
        .eq('service_key', integ.service_key)
        .limit(1);

      if (!existingInteg?.length) {
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
    plan: plan || undefined,
    version: nextVersion,
  });
}
