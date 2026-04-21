import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { getAnthropic } from '@/lib/anthropic';
import { getFileContents, openFixPR } from '@/lib/github';
import { captureError } from '@/lib/monitoring';

// POST /api/sentry-webhook
//
// Receives Sentry issue-alert webhooks, asks Claude to propose a fix, and
// opens a draft PR on the repo. NEVER auto-merges — a human reviews every
// sentry-autofix PR. Stack traces can be misleading and Claude can
// hallucinate; human-in-the-loop is the safety net.
//
// Required env vars:
//   SENTRY_WEBHOOK_SECRET  — HMAC secret configured in Sentry's integration
//   GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO
//   ANTHROPIC_API_KEY (via getAnthropic)
//
// Sentry signature header: `sentry-hook-signature` (HMAC-SHA256 of raw body)

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a senior engineer fixing a production bug surfaced by Sentry.

You will receive:
- The error message + stack trace
- The full contents of ONE source file from the stack trace

Return ONLY a JSON object with the corrected file:
{"fixed": true, "path": "<unchanged path>", "content": "<full corrected file>", "summary": "<one sentence describing the fix>"}

If the error is not a bug in this file, or you cannot produce a fix with confidence, return:
{"fixed": false, "reason": "<why you can't fix it>"}

Rules:
- Fix ONLY the specific bug indicated by the error. Do not refactor, add features, or clean up unrelated code.
- Preserve ALL existing behavior other than the bug.
- Do not add new dependencies.
- If the stack trace is ambiguous, set fixed: false.
- The PR will be reviewed by a human — be conservative.`;

function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = process.env.SENTRY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Subsystems tagged by captureError that represent GENERATED-code errors,
// not platform bugs. The Phase 2 client-side autofix already handles these
// — we don't want the platform webhook opening PRs against the transpile
// route for what's really a user's vibecoded-app issue.
const GENERATED_CODE_SUBSYSTEMS = new Set(['transpile', 'generate', 'sandbox', 'autofix']);

// Sentry tags come in two shapes depending on the integration type:
//   - [["key", "value"], ...]         (event payload)
//   - [{ key: "k", value: "v" }, ...] (issue payload)
// Normalize to a flat record.
function normalizeTags(raw: unknown): Record<string, string> {
  if (!Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const item of raw) {
    if (Array.isArray(item) && item.length >= 2) {
      out[String(item[0])] = String(item[1]);
    } else if (item && typeof item === 'object' && 'key' in item && 'value' in item) {
      const t = item as { key: unknown; value: unknown };
      out[String(t.key)] = String(t.value);
    }
  }
  return out;
}

// Extract the first project-owned frame from a Sentry event. Sentry payloads
// vary by integration type; we handle the common shapes defensively.
function extractErrorContext(payload: unknown): {
  path: string | null;
  message: string;
  stack: string;
  tags: Record<string, string>;
  issueUrl?: string;
} {
  const p = payload as Record<string, unknown>;
  const data = (p.data || p) as Record<string, unknown>;
  const event = (data.event || data.issue || data) as Record<string, unknown>;
  const exception = (event.exception || (event.event && (event.event as Record<string, unknown>).exception)) as Record<string, unknown> | undefined;
  const values = (exception?.values as Array<Record<string, unknown>> | undefined)?.[0];
  const message = (values?.value as string) || (event.message as string) || (event.title as string) || 'Unknown error';

  const tags = normalizeTags(event.tags || (data.event as Record<string, unknown> | undefined)?.tags);

  const frames = ((values?.stacktrace as Record<string, unknown> | undefined)?.frames as Array<Record<string, unknown>> | undefined) || [];
  // Sentry orders frames oldest-first; the most recent (in-app) frame is the
  // most specific fix target. Prefer in_app === true frames.
  const inAppFrames = frames.filter((f) => f.in_app === true);
  const targetFrame = (inAppFrames[inAppFrames.length - 1] || frames[frames.length - 1]) as Record<string, unknown> | undefined;
  // Normalize the file path. Next.js on Vercel uses an `app:///` URL scheme
  // in stack frames, plus the usual `./` and `webpack-internal://` prefixes.
  let path = (targetFrame?.filename as string) || (targetFrame?.abs_path as string) || null;
  if (path) {
    path = path
      .replace(/^app:\/\/\//, '')
      .replace(/^\.\//, '')
      .replace(/^webpack-internal:\/\/\/\.?\//, '');
    // Skip node_modules, Next.js internals, and compiled chunk output — none
    // of those are editable source files in our repo.
    if (
      path.includes('node_modules') ||
      path.startsWith('/_next/') ||
      path.startsWith('_next/') ||
      /^(?:\.?\/)?_next\/(?:server|static)\/chunks\//.test(path)
    ) {
      path = null;
    }
  }

  const stack = frames.slice(-10).map((f) => {
    const fn = f.function || '<anon>';
    const file = f.filename || f.abs_path || '?';
    const line = f.lineno != null ? `:${f.lineno}` : '';
    return `  at ${fn} (${file}${line})`;
  }).join('\n');

  const issueUrl = (p.url as string) || (data.url as string) || undefined;
  return { path, message, stack, tags, issueUrl };
}

// GET /api/sentry-webhook — health check so you can confirm env vars are set
// in Vercel without triggering a real Sentry event. Does NOT leak secret
// values — only reports whether each one is present.
export function GET() {
  return NextResponse.json({
    sentry_webhook_secret: process.env.SENTRY_WEBHOOK_SECRET ? 'ok' : 'missing',
    github_token: process.env.GITHUB_TOKEN ? 'ok' : 'missing',
    github_owner: process.env.GITHUB_OWNER || 'missing',
    github_repo: process.env.GITHUB_REPO || 'missing',
    github_base_branch: process.env.GITHUB_BASE_BRANCH || 'main (default)',
    anthropic_api_key: process.env.ANTHROPIC_API_KEY ? 'ok' : 'missing',
    sentry_dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'ok' : 'missing',
  });
}

export async function POST(request: NextRequest) {
  // Read raw body BEFORE parsing so HMAC verification works
  const body = await request.text();
  const signature = request.headers.get('sentry-hook-signature');

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const ctx = extractErrorContext(payload);

  // Skip events coming from generated-code subsystems — those are already
  // handled by the client-side autofix (/api/builder/autofix). Opening a
  // platform PR to "fix" the transpile route for what's really a user's
  // vibecoded-app bug would produce nonsense patches.
  if (ctx.tags.subsystem && GENERATED_CODE_SUBSYSTEMS.has(ctx.tags.subsystem)) {
    return NextResponse.json({
      status: 'skipped',
      reason: `subsystem=${ctx.tags.subsystem} is handled by generated-code autofix`,
    });
  }

  if (!ctx.path) {
    // Nothing actionable — platform / vendor code or un-mappable frame
    return NextResponse.json({ status: 'skipped', reason: 'No actionable source file in stack' });
  }

  // Only operate on repo-owned source paths. Reject attempts to fetch
  // arbitrary paths (path traversal or cross-repo references).
  if (ctx.path.includes('..') || ctx.path.startsWith('/')) {
    return NextResponse.json({ status: 'skipped', reason: 'Invalid path' });
  }

  try {
    const file = await getFileContents(ctx.path);
    if (!file) {
      return NextResponse.json({ status: 'skipped', reason: `File ${ctx.path} not found on base branch` });
    }

    // Size guard — don't send enormous files through Claude
    if (file.content.length > 80_000) {
      return NextResponse.json({ status: 'skipped', reason: 'File too large for autofix' });
    }

    const userMessage = [
      `ERROR: ${ctx.message}`,
      ``,
      `STACK (most recent last):`,
      ctx.stack,
      ``,
      `FILE: ${ctx.path}`,
      `\`\`\``,
      file.content,
      `\`\`\``,
    ].join('\n');

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      temperature: 0.1,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const block = response.content[0];
    const text = (block?.type === 'text' ? block.text : '')?.trim() || '';
    let jsonStr = text;
    const fence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) jsonStr = fence[1].trim();

    let parsed: { fixed?: boolean; path?: string; content?: string; summary?: string; reason?: string };
    try {
      parsed = JSON.parse(jsonStr);
    } catch (err) {
      captureError(err, {
        subsystem: 'platform',
        extra: { stage: 'parse_claude_response', preview: text.slice(0, 1000) },
      });
      return NextResponse.json({ status: 'error', reason: 'Claude response was not valid JSON' }, { status: 502 });
    }

    if (!parsed.fixed || !parsed.content) {
      return NextResponse.json({ status: 'skipped', reason: parsed.reason || 'Claude did not propose a fix' });
    }

    // Refuse no-op fixes
    if (parsed.content.trim() === file.content.trim()) {
      return NextResponse.json({ status: 'skipped', reason: 'Proposed fix was identical to original' });
    }

    const title = `[sentry-autofix] ${parsed.summary || ctx.message.slice(0, 60)}`;
    const prBody = [
      `## Auto-generated fix proposal`,
      ``,
      `**Sentry error:** ${ctx.message}`,
      ctx.issueUrl ? `**Sentry issue:** ${ctx.issueUrl}` : '',
      ``,
      `**File:** \`${ctx.path}\``,
      ``,
      `**Summary:** ${parsed.summary || '(none provided)'}`,
      ``,
      `---`,
      ``,
      `> This PR was generated by the Sentry auto-fix webhook. Claude analyzed the error and proposed a patch. **Review carefully before merging** — stack traces can mislead and models can hallucinate. If the fix looks wrong, close this PR; a human fix is always acceptable.`,
    ].filter(Boolean).join('\n');

    const prUrl = await openFixPR({
      path: ctx.path,
      newContent: parsed.content,
      title,
      body: prBody,
      labels: ['sentry-autofix', 'needs-review'],
    });

    return NextResponse.json({ status: 'pr_opened', url: prUrl });
  } catch (err) {
    captureError(err, {
      subsystem: 'platform',
      extra: { stage: 'autofix_pipeline', path: ctx.path, error: ctx.message },
    });
    return NextResponse.json(
      { status: 'error', reason: (err as Error).message || 'Autofix pipeline failed' },
      { status: 500 }
    );
  }
}
