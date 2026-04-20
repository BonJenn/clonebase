// Thin wrapper over Sentry so we have one place to:
//  - consistently tag errors by subsystem (builder/sandbox/platform)
//  - keep Sentry out of the hot path via dynamic import
//  - degrade gracefully if @sentry/nextjs isn't installed/initialized
//
// Prefer this over calling Sentry.captureException directly in feature code —
// it means every error carries the context a human (or the auto-fix bot)
// needs to act on it.

interface CaptureContext {
  subsystem: 'builder' | 'sandbox' | 'transpile' | 'generate' | 'autofix' | 'platform';
  templateId?: string;
  userId?: string;
  attempt?: number;
  // Free-form extra data — stack traces, failing snippets, request bodies, etc.
  extra?: Record<string, unknown>;
}

// Captured on both server and client. Safe to call from anywhere.
// Always returns immediately; Sentry reporting happens in the background.
export function captureError(err: unknown, ctx: CaptureContext): void {
  // Normalize into an Error so Sentry gets a real stack trace
  const error = err instanceof Error ? err : new Error(typeof err === 'string' ? err : JSON.stringify(err));

  // Dynamic import keeps Sentry off the client bundle's hot path and makes
  // this a no-op if the package isn't installed (e.g. local dev w/o DSN).
  import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.captureException(error, {
        tags: {
          subsystem: ctx.subsystem,
          ...(ctx.templateId && { template_id: ctx.templateId }),
        },
        extra: {
          ...(ctx.attempt !== undefined && { attempt: ctx.attempt }),
          ...(ctx.userId && { user_id: ctx.userId }),
          ...ctx.extra,
        },
      });
    })
    .catch(() => {
      // Sentry not available — fall back to console so the error isn't silent
      // in local dev. Production should have Sentry configured.
      // eslint-disable-next-line no-console
      console.error(`[${ctx.subsystem}]`, error.message, ctx.extra);
    });
}
