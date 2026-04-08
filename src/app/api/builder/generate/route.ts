import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { buildSystemPrompt } from '@/lib/builder/system-prompt';
import { planApp } from '@/lib/builder/planner';
import { researchTopic, searchImages } from '@/lib/builder/researcher';
import { detectBlueprint, formatBlueprintForPrompt } from '@/lib/builder/app-blueprints';

export const maxDuration = 120;

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI();
  return _openai;
}

interface GeneratedCode {
  page_code: string;
  admin_code?: string | null;
  api_handler_code?: string | null;
  component_files?: Record<string, string>;
  explanation?: string;
  suggested_integrations?: Array<Record<string, unknown>>;
}

// Parse the model's JSON response, with a regex fallback for truncated output.
function parseGenerated(textContent: string): GeneratedCode | null {
  let jsonStr = textContent.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    const pageMatch = jsonStr.match(/"page_code"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const adminMatch = jsonStr.match(/"admin_code"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const explanationMatch = jsonStr.match(/"explanation"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (pageMatch) {
      return {
        page_code: pageMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\'),
        admin_code: adminMatch ? adminMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\') : null,
        api_handler_code: null,
        explanation: explanationMatch ? explanationMatch[1] : 'Code generated.',
      };
    }
    return null;
  }
}

// Compute the fraction of lines in newCode that don't appear in oldCode.
// Used in bug-fix mode as a soft signal that the model rewrote unrelated code.
function calculateDrift(oldCode: string, newCode: string): { ratio: number; changed: number; total: number } {
  if (!oldCode || !newCode) return { ratio: 0, changed: 0, total: 0 };
  const oldLines = new Set(oldCode.split('\n').map(l => l.trim()).filter(Boolean));
  const newLines = newCode.split('\n').map(l => l.trim()).filter(Boolean);
  if (newLines.length === 0) return { ratio: 1, changed: 0, total: 0 };
  let changed = 0;
  for (const line of newLines) {
    if (!oldLines.has(line)) changed++;
  }
  return { ratio: changed / newLines.length, changed, total: newLines.length };
}

// POST /api/builder/generate — Generate or iterate on template code
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { template_id, messages, element_context } = await request.json();
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

  // First, see if the prompt matches a known app blueprint (Tinder, Instagram, etc).
  // Blueprints are pre-curated specs that produce higher-quality clones than the
  // generic planner can. When matched, we skip the planner and use the blueprint
  // as the plan context.
  const blueprint = isFirstGeneration ? detectBlueprint(messages[0].content) : null;

  if (isFirstGeneration && blueprint) {
    planContext = formatBlueprintForPrompt(blueprint);
  } else if (isFirstGeneration) {
    plan = await planApp(messages[0].content);
    const planAny = plan as unknown as Record<string, unknown>;
    const appType = planAny.app_type || 'standard';

    // Research step: if the planner detected a real business/topic, look it up
    let researchContext = '';
    if (plan.needs_research && plan.research_query) {
      const [research, images] = await Promise.all([
        researchTopic(plan.research_query),
        searchImages(plan.research_query, 10),
      ]);

      // Combine found image URLs with generated ones
      const allImages = [...research.images, ...images].slice(0, 12);

      if (research.summary) {
        researchContext = `
## REAL-WORLD RESEARCH RESULTS — USE ALL OF THIS DATA
${research.summary}

## IMAGES TO USE IN THE APP (assign these to seed data):
- Hero/banner: ${allImages[0] || images[0]}
- Interior/ambiance: ${allImages[1] || images[1]}
- Food/product 1: ${allImages[2] || images[2]}
- Food/product 2: ${allImages[3] || images[3]}
- Food/product 3: ${allImages[4] || images[4]}
- Food/product 4: ${allImages[5] || images[5]}
- Team/staff: ${allImages[6] || images[6]}
- Exterior: ${allImages[7] || images[7]}
${allImages.slice(8).map((url, i) => `- Extra ${i + 1}: ${url}`).join('\n')}

CRITICAL INSTRUCTIONS FOR BUSINESS WEBSITES:
- Seed EVERY menu item, location, and review found in the research into separate useTenantData collections
- Use the image URLs above in the seed data (hero_image, item images, etc.)
- The owner must be able to edit everything in the Data tab
- Don't summarize or skip items — include the FULL menu, ALL locations, ALL reviews found
- Make it look like a real agency-built website, not a template
`;
      }
    }
    const designTheme = planAny.design_theme || 'light';
    const primaryColor = planAny.primary_color || 'indigo';
    const mobileFirst = planAny.mobile_first === true;
    const gameInstructions = appType === 'game' ? `
APP TYPE: GAME — Use <canvas> with requestAnimationFrame game loop.
- Render characters as emoji on canvas (fillText)
- WASD/arrow keys for movement (preventDefault to stop scrolling)
- ALSO include touch controls (D-pad buttons visible only on mobile via sm:hidden)
- Use useRef for game state (position, velocity) — only useState for UI state
- Collision detection with bounding boxes
- This is a 2D game, NOT a form-based app. The main view should be a canvas.
- Canvas must be responsive: w-full max-w-[800px] aspect-[4/3]
` : '';

    const mobileInstructions = mobileFirst ? `
MOBILE-FIRST APP REQUESTED:
- Wrap in max-w-sm mx-auto for phone-shaped layout
- Bottom tab bar navigation (fixed bottom-0) with 4-5 icons
- Use card stack layouts, NOT grids
- All buttons h-12+ for tap targets
- Inputs use text-base (16px) to prevent iOS zoom
- Mimic native mobile patterns (swipe-to-dismiss, pull-to-refresh feel)
- pb-[env(safe-area-inset-bottom)] on fixed bottom elements
` : '';

    planContext = `
## APP PLAN (follow this exactly)
App Name: ${plan.app_name}
App Type: ${appType}
Design Theme: ${designTheme} (use this layout style)
Primary Color: ${primaryColor} (use ${primaryColor}-600 for buttons, ${primaryColor}-500 for accents, ${primaryColor}-100 for backgrounds. DO NOT use indigo unless the plan says indigo.)
Complexity: ${plan.complexity}
Authentication: ${plan.needs_auth ? 'YES — use useTenantAuth()' : 'NO — do not add auth'}
Seed Data: ${plan.seed_data ? 'YES — seed with realistic data' : 'NO — start empty'}
Views: ${plan.views.join(', ')} (use state-based navigation, max ${plan.views.length} views)
Data Collections: ${plan.data_collections.map(c => `${c.name}(${c.fields.join(', ')})`).join('; ')}
Features: ${plan.features.join(', ')}
${plan.warnings.length > 0 ? `WARNINGS: ${plan.warnings.join('. ')}` : ''}
${gameInstructions}
${mobileInstructions}
${researchContext}
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

  // If the user has selected a specific element via click-to-prompt, instruct
  // the model to modify only that element.
  let elementContextPrompt = '';
  if (element_context && typeof element_context === 'object' && element_context.editId) {
    const safeEditId = String(element_context.editId).slice(0, 100);
    const safeTag = String(element_context.tag || 'element').slice(0, 30);
    const safeText = String(element_context.text || '').slice(0, 200);
    elementContextPrompt = `

## TARGETED ELEMENT EDIT
The user has selected a specific element in the preview. They want to modify ONLY this element:
- data-edit-id: "${safeEditId}"
- tag: <${safeTag}>
- current text: "${safeText}"

CRITICAL: Locate the element with data-edit-id="${safeEditId}" in the current page_code and apply the user's request to ONLY that element. Do NOT regenerate or restructure other parts of the page. Return the FULL updated page_code with only the targeted change applied. Preserve all existing data-edit-id attributes.`;
  }

  // For follow-ups, only send the last few messages to stay within token limits
  // The existing code is already in the system prompt via buildSystemPrompt
  const conversationMessages = isFirstGeneration
    ? messages
    : messages.slice(-6); // Last 3 exchanges max

  // Detect bug fix mode from the latest user message
  const latestUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user')?.content || '';
  const bugFixKeywords = /\b(bug|broken|doesn'?t work|isn'?t working|not working|fix|error|crash|crashes|wrong|fails?|can'?t|won'?t|nothing happens|stopped working)\b/i;
  const isBugFix = bugFixKeywords.test(latestUserMessage);

  const bugFixContext = isBugFix ? `

## ⚠️ BUG FIX MODE ACTIVE — MAXIMUM CODE PRESERVATION ⚠️
The user is reporting a bug. The current code is in your context above under "## CURRENT CODE".

You MUST:
1. **READ the current code carefully.** Find the EXACT function or handler the user is complaining about.
2. **TRACE the bug.** Walk through the code path: what does the user do, what handler fires, what state changes, where does it break?
3. **IDENTIFY the minimum fix.** What is the smallest possible diff that fixes this specific bug? Most fixes are 1-15 lines.
4. **OUTPUT the WHOLE files but keep them BYTE-FOR-BYTE identical except for the minimum fix:**
   - Same imports in the same order
   - Same component, function, and variable names
   - Same JSX structure, same className strings, same children
   - Same helper functions (do not rename, refactor, or extract)
   - Same comments and whitespace
   - Same state shapes
5. **If admin_code or api_handler_code are NOT related to the bug**, output them EXACTLY as they appear in the current code above. Copy them verbatim. Do not regenerate, do not "improve", do not reformat.
6. **VERIFY your fix mentally** by replaying the broken path with the fix applied.
7. **EXPLAIN the fix precisely**: name the function and the change. Example: "handleSave was missing await on insert(). Added await on line 47. Nothing else changed."

⛔ FORBIDDEN in bug fix mode:
- Refactoring code that wasn't broken
- Renaming variables, functions, or components
- Restyling, recoloring, or rearranging the layout
- Reordering imports or consolidating them
- Adding features the user didn't ask for
- Rewriting unrelated files when only one file has the bug

If you change MORE than ~30 lines for a single reported bug, you are doing it wrong. Go back, find the actual minimum fix, and output that instead.

The user reported ONE specific problem. Fix THAT problem. Nothing else.
` : '';

  const response = await getOpenAI().chat.completions.create({
    model,
    max_tokens: 16384,
    temperature: isBugFix ? 0.1 : 0.7, // Near-deterministic for bug fixes — minimum drift
    messages: [
      { role: 'system', content: systemPrompt + planContext + elementContextPrompt + bugFixContext },
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

  let generated = parseGenerated(textContent);
  if (!generated) {
    return NextResponse.json({ error: 'Failed to parse generated code. Try a simpler request.' }, { status: 500 });
  }
  if (!generated.page_code) {
    return NextResponse.json({ error: 'Generated code missing page_code' }, { status: 500 });
  }

  // BUG FIX MODE diff guard: if the model rewrote a large fraction of the file
  // for what should be a small bug fix, retry once with explicit feedback.
  // Threshold is intentionally lenient (35%) so legitimate medium fixes pass through.
  const DRIFT_THRESHOLD = 0.35;
  const MIN_FILE_LINES = 30; // Don't bother on tiny files
  if (isBugFix && existing?.page_code && generated.page_code) {
    const drift = calculateDrift(existing.page_code, generated.page_code);
    if (drift.total >= MIN_FILE_LINES && drift.ratio > DRIFT_THRESHOLD) {
      const feedbackMessage = `STOP. Your previous response changed ${Math.round(drift.ratio * 100)}% of page_code (${drift.changed} of ${drift.total} lines are new or modified). The user reported ONE specific bug. A correct bug fix changes 1-15 lines, not ${drift.changed}.

Look at the current code in the system prompt above. Find the EXACT lines that cause the reported bug. Output the WHOLE file again, but BYTE-FOR-BYTE identical to the current code EXCEPT for those few lines.

Do not refactor. Do not rename. Do not restyle. Do not "improve" anything. Do not regenerate admin_code or api_handler_code if they aren't related to the bug — copy them verbatim from the current code.

Return the JSON now.`;

      const retryResponse = await getOpenAI().chat.completions.create({
        model,
        max_tokens: 16384,
        temperature: 0,
        messages: [
          { role: 'system', content: systemPrompt + planContext + elementContextPrompt + bugFixContext },
          ...conversationMessages.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          { role: 'assistant', content: textContent },
          { role: 'user', content: feedbackMessage },
        ],
      });

      const retryContent = retryResponse.choices[0]?.message?.content;
      if (retryContent) {
        const retryParsed = parseGenerated(retryContent);
        if (retryParsed?.page_code) {
          const retryDrift = calculateDrift(existing.page_code, retryParsed.page_code);
          // Only accept retry if it actually drifted less
          if (retryDrift.ratio < drift.ratio) {
            generated = retryParsed;
          }
        }
      }
    }
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
