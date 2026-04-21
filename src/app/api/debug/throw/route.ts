import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/monitoring';

// POST /api/debug/throw
//
// Deliberately throws a platform-level error from this specific file so we
// can verify the Sentry webhook + auto-fix PR pipeline end-to-end. Auth-gated
// (signed-in users only) so randos can't use it to spam Sentry.
//
// The thrown error is tagged subsystem: 'platform' — this is the one case
// where that tag is used by product code, and the Sentry webhook WILL try
// to open a fix PR for this file. That's the whole point of the route.
//
// Usage: POST /api/debug/throw   (as a signed-in user)

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized — sign in first' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const message = typeof body?.message === 'string'
    ? body.message
    : 'Intentional platform error from /api/debug/throw';

  const err = new Error(message);
  captureError(err, {
    subsystem: 'platform',
    userId: user.id,
    extra: { source: 'debug_throw_route', intentional: true },
  });

  return NextResponse.json({
    ok: true,
    note: 'Error captured. Check Sentry → look for subsystem=platform. The webhook should open a PR against this file within ~30s.',
  });
}
