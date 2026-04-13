import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkCredits } from '@/lib/credits';

// GET /api/billing/credits — returns current credit status for the logged-in user
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const status = await checkCredits(user.id);
  return NextResponse.json(status);
}
