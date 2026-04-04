import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/analytics?tenant_id=xxx&days=30 — Get analytics for a tenant
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = request.nextUrl.searchParams.get('tenant_id');
  const days = parseInt(request.nextUrl.searchParams.get('days') || '30', 10);

  if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  const { data: events } = await supabase
    .from('analytics_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('event_date', sinceDate.toISOString().split('T')[0])
    .order('event_date', { ascending: true });

  // Aggregate by event type
  const summary: Record<string, number> = {};
  const daily: Record<string, Record<string, number>> = {};

  for (const event of events || []) {
    summary[event.event_type] = (summary[event.event_type] || 0) + event.count;
    if (!daily[event.event_date]) daily[event.event_date] = {};
    daily[event.event_date][event.event_type] = event.count;
  }

  return NextResponse.json({ summary, daily, days });
}
