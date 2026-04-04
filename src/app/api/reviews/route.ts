import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/reviews?template_id=xxx — List reviews for a template
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const templateId = request.nextUrl.searchParams.get('template_id');

  if (!templateId) {
    return NextResponse.json({ error: 'template_id is required' }, { status: 400 });
  }

  const { data: reviews } = await supabase
    .from('template_reviews')
    .select('*, reviewer:profiles(display_name, avatar_url)')
    .eq('template_id', templateId)
    .order('created_at', { ascending: false });

  return NextResponse.json(reviews || []);
}

// POST /api/reviews — Create or update a review
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { template_id, rating, review_text } = await request.json();

  if (!template_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'template_id and rating (1-5) are required' }, { status: 400 });
  }

  // Don't allow reviewing your own template
  const { data: template } = await supabase
    .from('app_templates')
    .select('creator_id')
    .eq('id', template_id)
    .single();

  if (template?.creator_id === user.id) {
    return NextResponse.json({ error: 'Cannot review your own template' }, { status: 400 });
  }

  // Upsert: one review per user per template
  const { data: review, error } = await supabase
    .from('template_reviews')
    .upsert({
      template_id,
      user_id: user.id,
      rating: Math.round(rating),
      review_text: review_text?.trim() || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'template_id,user_id' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to save review' }, { status: 500 });
  }

  return NextResponse.json(review, { status: 201 });
}
