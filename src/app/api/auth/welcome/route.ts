import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWelcomeEmail } from '@/lib/email';

// POST /api/auth/welcome — Send the welcome email after signup.
// Called client-side from the signup page with { email, name }.
// We verify the email belongs to a recently-created profile to prevent abuse.
export async function POST(request: NextRequest) {
  const { email, name } = await request.json().catch(() => ({ email: null, name: null }));
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Verify this email belongs to a profile created in the last 5 minutes
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, created_at')
    .eq('email', email)
    .limit(1)
    .maybeSingle() as { data: { id: string; created_at: string } | null };

  if (!profile) return NextResponse.json({ ok: false });

  const created = new Date(profile.created_at);
  if (Date.now() - created.getTime() > 5 * 60 * 1000) {
    // Account is older than 5 minutes — don't re-send welcome
    return NextResponse.json({ ok: false, reason: 'not_new' });
  }

  try {
    await sendWelcomeEmail(email, name || undefined);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[email] welcome email failed:', (err as Error).message);
    return NextResponse.json({ ok: false });
  }
}
