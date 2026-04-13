import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendWelcomeEmail } from '@/lib/email';

// POST /api/auth/welcome — Send the welcome email after signup.
// Called client-side from the signup page after Supabase auth succeeds.
// Fire-and-forget: if the email fails, the user still signed up fine.
export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const name = user.user_metadata?.display_name || undefined;
    await sendWelcomeEmail(user.email, name);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[email] welcome email failed:', (err as Error).message);
    return NextResponse.json({ ok: false });
  }
}
