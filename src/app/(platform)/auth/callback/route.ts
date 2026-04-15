import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /auth/callback — Supabase OAuth callback handler.
// After the user authenticates with Google/Apple/GitHub, Supabase redirects
// here with a code. We exchange the code for a session, send the welcome
// email, then redirect to the dashboard (or wherever `next` points).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Send welcome email for new OAuth users (fire-and-forget)
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const origin = new URL(request.url).origin;
        fetch(`${origin}/api/auth/welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || undefined,
          }),
        }).catch(() => {});
      }

      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Something went wrong — redirect to login with error
  return NextResponse.redirect(new URL('/auth/login?error=oauth_failed', request.url));
}
