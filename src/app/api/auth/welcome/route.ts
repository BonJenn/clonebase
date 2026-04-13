import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email';

// POST /api/auth/welcome — Send the welcome email after signup.
// Called from the signup page with { email, name }.
// No auth check needed — this just sends a welcome email.
// Dedup: tracks recently-sent emails in memory to prevent double-sends.
const recentlySent = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const name = typeof body?.name === 'string' ? body.name.trim() : undefined;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ ok: false, reason: 'invalid_email' }, { status: 400 });
    }

    // Simple dedup — don't send twice to the same address within 5 minutes
    if (recentlySent.has(email)) {
      return NextResponse.json({ ok: true, reason: 'already_sent' });
    }

    await sendWelcomeEmail(email, name);

    recentlySent.add(email);
    setTimeout(() => recentlySent.delete(email), 5 * 60 * 1000);

    console.log(`[email] welcome sent to ${email}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[email] welcome email failed:', (err as Error).message);
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
