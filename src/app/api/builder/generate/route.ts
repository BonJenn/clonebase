import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAnthropic } from '@/lib/anthropic';
import { checkCredits, useCredit } from '@/lib/credits';
import { getUserTier, checkAppLimit } from '@/lib/tier-gate';
import { composePrompt } from '@/lib/builder/prompts';
import { planApp } from '@/lib/builder/planner';
import { researchTopic, searchImages } from '@/lib/builder/researcher';
import { detectBlueprint, formatBlueprintForPrompt } from '@/lib/builder/app-blueprints';
import { lintDesign } from '@/lib/builder/design-linter';

export const maxDuration = 300;

// Per-request timeouts. These are strictly less than maxDuration so that
// a hanging API call errors cleanly instead of starving the function budget.
const PRIMARY_CALL_TIMEOUT_MS = 200_000;
const RETRY_CALL_TIMEOUT_MS = 90_000;

// When bug-fix retry is about to fire, we only proceed if there's enough budget
// left to realistically complete a second call + db writes.
const RETRY_MIN_BUDGET_MS = 100_000;

// Claude models:
// - Sonnet 4.6 for first-generation (quality matters for the initial build)
// - Haiku 4.5 for follow-ups (simple edits like "make the button blue" don't
//   need Sonnet's reasoning — Haiku is ~10x cheaper and fast)
const MODEL_SONNET = 'claude-sonnet-4-6';
const MODEL_HAIKU = 'claude-haiku-4-5-20251001';

/**
 * Call Claude with prompt caching. The stable portion of the system prompt
 * is marked with cache_control so Anthropic caches it for 5 minutes — subsequent
 * requests sharing the same prefix pay only 10% of the input token cost.
 *
 * @param stableSystem - Cacheable system prompt (design lock, technical contract, etc.)
 * @param dynamicSystem - Per-request context (plan, current code, element selection)
 */
async function callClaude(opts: {
  stableSystem: string;
  dynamicSystem?: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}): Promise<string | null> {
  const systemBlocks: Array<{ type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }> = [
    {
      type: 'text' as const,
      text: opts.stableSystem,
      cache_control: { type: 'ephemeral' as const },
    },
  ];
  if (opts.dynamicSystem) {
    systemBlocks.push({ type: 'text' as const, text: opts.dynamicSystem });
  }

  const response = await getAnthropic().messages.create(
    {
      model: opts.model ?? MODEL_SONNET,
      max_tokens: opts.maxTokens ?? 16384,
      temperature: opts.temperature ?? 0.7,
      system: systemBlocks,
      messages: opts.messages,
    },
    { signal: AbortSignal.timeout(opts.timeoutMs ?? PRIMARY_CALL_TIMEOUT_MS) }
  );
  const block = response.content[0];
  return block?.type === 'text' ? block.text : null;
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
  const startTime = Date.now();
  const elapsed = () => Date.now() - startTime;
  const remaining = () => (maxDuration * 1000) - elapsed();

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Credit gate: check before doing any expensive work
  const creditStatus = await checkCredits(user.id);
  if (!creditStatus.allowed) {
    return NextResponse.json({
      error: creditStatus.error,
      credits_remaining: 0,
      credits_limit: creditStatus.creditsLimit,
      tier: creditStatus.tier,
    }, { status: 402 });
  }

  // Get the user's tier for model selection + app limit checks
  const userTier = await getUserTier(user.id);

  let template_id: string, messages: Array<{ role: string; content: string }>;
  let element_context: { editId?: string; tag?: string; text?: string } | undefined;
  let design_preset: string | undefined, auth_preference: string | undefined, seed_data_preference: string | undefined;
  try {
    const body = await request.json();
    template_id = body.template_id;
    messages = body.messages;
    element_context = body.element_context;
    design_preset = body.design_preset;
    auth_preference = body.auth_preference;
    seed_data_preference = body.seed_data_preference;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
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

  // App limit check on first generation (creating a new app)
  if (isFirstGeneration) {
    const limitError = await checkAppLimit(user.id);
    if (limitError) {
      return NextResponse.json({ error: limitError }, { status: 403 });
    }
  }

  // PASS 1: Plan the app (first generation only)
  let planContext = '';
  let plan = null;

  // First, see if the prompt matches a known app blueprint (Tinder, Instagram, etc).
  // Blueprints are pre-curated specs that produce higher-quality clones than the
  // generic planner can. When matched, we skip the planner OpenAI call and synthesize
  // a plan from the blueprint so composePrompt enables the right conditional sections
  // (games, auth, etc).
  const blueprint = isFirstGeneration ? detectBlueprint(messages[0].content) : null;

  if (isFirstGeneration && blueprint) {
    planContext = formatBlueprintForPrompt(blueprint);
    plan = {
      app_name: blueprint.app_name,
      description: blueprint.tagline,
      needs_auth: blueprint.needs_auth,
      mobile_first: blueprint.mobile_first,
      needs_research: false,
      research_query: '',
      views: blueprint.views,
      data_collections: blueprint.data_collections,
      features: blueprint.must_have_features,
      seed_data: true,
      complexity: 'medium',
      warnings: [],
    } as Awaited<ReturnType<typeof planApp>>;
    // app_type is read by composePrompt to enable the GAMES section
    (plan as unknown as Record<string, unknown>).app_type = blueprint.category === 'game' ? 'game' : 'standard';
  } else if (isFirstGeneration) {
    plan = await planApp(messages[0].content);
    const planAny = plan as unknown as Record<string, unknown>;
    const appType = (planAny.app_type as string) || 'standard';

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

  // Apply user overrides from the pre-flight controls
  if (plan && auth_preference === 'yes') {
    plan.needs_auth = true;
  } else if (plan && auth_preference === 'no') {
    plan.needs_auth = false;
  }
  if (plan && seed_data_preference === 'no') {
    plan.seed_data = false;
  }
  // Update planContext to reflect the overrides so the model sees the correct instructions
  if (plan && auth_preference && auth_preference !== 'auto' && planContext) {
    planContext = planContext.replace(
      /Authentication: (YES — use useTenantAuth\(\)|NO — do not add auth)/,
      `Authentication: ${plan.needs_auth ? 'YES — use useTenantAuth()' : 'NO — do not add auth'}`
    );
  }
  if (plan && seed_data_preference === 'no' && planContext) {
    planContext = planContext.replace(
      /Seed Data: YES — seed with realistic data/,
      'Seed Data: NO — start with empty collections, no sample content'
    );
  }

  // PASS 2: Generate the code

  // For follow-ups, only send the last few messages to stay within token limits.
  // The existing code is already in the system prompt via composePrompt.
  const conversationMessages = isFirstGeneration
    ? messages
    : messages.slice(-6); // Last 3 exchanges max

  // Detect bug fix mode from the latest user message
  const latestUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user')?.content || '';
  const bugFixKeywords = /\b(bug|broken|doesn'?t work|isn'?t working|not working|fix|error|crash|crashes|wrong|fails?|can'?t|won'?t|nothing happens|stopped working)\b/i;
  const isBugFix = bugFixKeywords.test(latestUserMessage);

  // Compose the system prompt — split into stable (cacheable) + dynamic parts.
  const prompt = composePrompt({
    plan,
    isBugFix,
    currentCode: existing,
    elementContext: element_context,
    planContext,
    presetId: design_preset || undefined,
  });

  // Priority generation: paid users get Sonnet for first gen (higher quality).
  // Free users get Haiku for everything. Follow-ups always use Haiku.
  const model = (isFirstGeneration && userTier.isPaid) ? MODEL_SONNET : MODEL_HAIKU;

  const approxTokens = Math.round(prompt.full.length / 4);
  console.log(`[builder] t+${elapsed()}ms system prompt: ${prompt.full.length} chars / ~${approxTokens} tokens (model=${model}, cached=${prompt.stable.length} chars, dynamic=${prompt.dynamic.length} chars, game=${(plan as unknown as { app_type?: string } | null)?.app_type === 'game'}, auth=${plan?.needs_auth === true}, bugfix=${isBugFix}, blueprint=${blueprint?.id || 'none'})`);

  let textContent: string | null;
  try {
    textContent = await callClaude({
      stableSystem: prompt.stable,
      dynamicSystem: prompt.dynamic || undefined,
      model,
      messages: conversationMessages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      temperature: isBugFix ? 0.1 : 0.7,
      timeoutMs: PRIMARY_CALL_TIMEOUT_MS,
    });
  } catch (err) {
    const message = (err as Error).message || 'Claude call failed';
    console.log(`[builder] t+${elapsed()}ms primary call FAILED: ${message}`);
    return NextResponse.json(
      { error: message.includes('timeout') || message.includes('aborted')
        ? 'The generation took too long. Try a simpler request or break it into smaller steps.'
        : `Generation failed: ${message}` },
      { status: 504 }
    );
  }
  console.log(`[builder] t+${elapsed()}ms primary call complete`);

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
      // Budget check: only retry if we have enough time left to realistically
      // complete the second call + db writes. Otherwise we'd just 504 anyway.
      if (remaining() < RETRY_MIN_BUDGET_MS) {
        console.log(`[builder] t+${elapsed()}ms SKIPPING retry — only ${remaining()}ms left (need ${RETRY_MIN_BUDGET_MS}ms). Drift was ${Math.round(drift.ratio * 100)}%.`);
      } else {
        console.log(`[builder] t+${elapsed()}ms triggering retry (drift=${Math.round(drift.ratio * 100)}%, ${drift.changed}/${drift.total} lines changed)`);

        const feedbackMessage = `STOP. Your previous response changed ${Math.round(drift.ratio * 100)}% of page_code (${drift.changed} of ${drift.total} lines are new or modified). The user reported ONE specific bug. A correct bug fix changes 1-15 lines, not ${drift.changed}.

Look at the current code in the system prompt above. Find the EXACT lines that cause the reported bug. Output the WHOLE file again, but BYTE-FOR-BYTE identical to the current code EXCEPT for those few lines.

Do not refactor. Do not rename. Do not restyle. Do not "improve" anything. Do not regenerate admin_code or api_handler_code if they aren't related to the bug — copy them verbatim from the current code.

Return the JSON now.`;

        try {
          const retryContent = await callClaude({
            stableSystem: prompt.stable,
            dynamicSystem: prompt.dynamic || undefined,
            model,
            messages: [
              ...conversationMessages.map((m: { role: string; content: string }) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
              })),
              { role: 'assistant', content: textContent },
              { role: 'user', content: feedbackMessage },
            ],
            temperature: 0,
            timeoutMs: Math.min(RETRY_CALL_TIMEOUT_MS, Math.max(20_000, remaining() - 20_000)),
          });

          if (retryContent) {
            const retryParsed = parseGenerated(retryContent);
            if (retryParsed?.page_code) {
              const retryDrift = calculateDrift(existing.page_code, retryParsed.page_code);
              // Only accept retry if it actually drifted less
              if (retryDrift.ratio < drift.ratio) {
                console.log(`[builder] t+${elapsed()}ms retry accepted (drift ${Math.round(drift.ratio * 100)}% → ${Math.round(retryDrift.ratio * 100)}%)`);
                generated = retryParsed;
              } else {
                console.log(`[builder] t+${elapsed()}ms retry rejected (drift did not improve: ${Math.round(retryDrift.ratio * 100)}%)`);
              }
            }
          }
        } catch (retryErr) {
          // Retry failure is non-fatal — keep the original response and continue
          console.log(`[builder] t+${elapsed()}ms retry failed, keeping original: ${(retryErr as Error).message}`);
        }
      }
    }
  }

  // DESIGN LINT PASS: scan for common design violations on first generation.
  // If the score is below threshold and we have time budget, retry with feedback.
  if (isFirstGeneration && generated.page_code && !isBugFix) {
    const lint = lintDesign(generated.page_code);
    console.log(`[builder] t+${elapsed()}ms design lint: score=${lint.score}/100, violations=${lint.violations.length}, pass=${lint.passesThreshold}`);

    if (!lint.passesThreshold && remaining() >= RETRY_MIN_BUDGET_MS) {
      console.log(`[builder] t+${elapsed()}ms triggering design lint retry (${lint.violations.length} violations)`);
      try {
        const lintRetryContent = await callClaude({
          stableSystem: prompt.stable,
          dynamicSystem: prompt.dynamic || undefined,
          model,
          messages: [
            ...conversationMessages.map((m: { role: string; content: string }) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
            { role: 'assistant', content: textContent },
            { role: 'user', content: lint.feedback },
          ],
          temperature: 0.4,
          timeoutMs: Math.min(RETRY_CALL_TIMEOUT_MS, Math.max(20_000, remaining() - 20_000)),
        });
        if (lintRetryContent) {
          const lintRetryParsed = parseGenerated(lintRetryContent);
          if (lintRetryParsed?.page_code) {
            const reLint = lintDesign(lintRetryParsed.page_code);
            if (reLint.score > lint.score) {
              console.log(`[builder] t+${elapsed()}ms lint retry accepted (score ${lint.score} → ${reLint.score})`);
              generated = lintRetryParsed;
            } else {
              console.log(`[builder] t+${elapsed()}ms lint retry rejected (score did not improve: ${reLint.score})`);
            }
          }
        }
      } catch (lintErr) {
        console.log(`[builder] t+${elapsed()}ms lint retry failed, keeping original: ${(lintErr as Error).message}`);
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
  const integrations = (generated.suggested_integrations || []).filter(
    (integ): integ is Record<string, unknown> & { name: string; service_key: string } =>
      !!integ && typeof (integ as Record<string, unknown>).name === 'string' && typeof (integ as Record<string, unknown>).service_key === 'string' &&
      !!(integ as Record<string, unknown>).name && !!(integ as Record<string, unknown>).service_key
  );
  for (const integ of integrations) {
    try {
      const { data: existingInteg } = await supabase
        .from('integration_definitions')
        .select('id')
        .eq('template_id', template_id)
        .eq('service_key', integ.service_key)
        .limit(1);

      if (!existingInteg?.length) {
        await (supabase.from('integration_definitions') as any).insert({
          template_id: template_id,
          name: integ.name.trim(),
          service_key: integ.service_key.trim(),
          description: (integ.description as string) || '',
          integration_type: 'user_provided',
          required_fields: integ.required_fields || ['api_key'],
        });
      }
    } catch {
      // Non-fatal: integration suggestion was malformed
    }
  }

  // Deduct 1 credit for successful generation (awaited so the DB is updated
  // before the response — the credits badge re-fetches on 'credits-updated')
  try {
    await useCredit(user.id);
  } catch (err) {
    console.error('[builder] credit deduction failed:', (err as Error).message);
  }

  // Send a "credits running low" email at 20% remaining (fire-and-forget)
  const creditsLeft = creditStatus.creditsRemaining - 1;
  const lowThreshold = Math.ceil(creditStatus.creditsLimit * 0.2);
  if (creditsLeft > 0 && creditsLeft === lowThreshold) {
    import('@/lib/email').then(({ sendCreditsLowEmail }) => {
      sendCreditsLowEmail(user.email || '', creditsLeft, creditStatus.creditsLimit).catch(() => {});
    }).catch(() => {});
  }

  return NextResponse.json({
    page_code: generated.page_code,
    admin_code: generated.admin_code || null,
    api_handler_code: generated.api_handler_code || null,
    explanation: generated.explanation || 'Code generated successfully.',
    suggested_integrations: integrations,
    plan: plan || undefined,
    version: nextVersion,
    credits_remaining: creditStatus.creditsRemaining - 1,
  });
}
