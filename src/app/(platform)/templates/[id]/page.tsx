import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { CloneButton } from './clone-button';
import { ReviewSection } from '@/components/platform/review-section';
import type { AppTemplate } from '@/types';

interface TemplateDetailProps {
  params: Promise<{ id: string }>;
}

export default async function TemplateDetailPage({ params }: TemplateDetailProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: template } = await supabase
    .from('app_templates')
    .select(`
      *,
      creator:profiles(display_name, avatar_url),
      pricing:template_pricing(*),
      integration_definitions(*)
    `)
    .eq('id', id)
    .single();

  if (!template) notFound();

  const tpl = template as AppTemplate & { creator: { display_name: string; avatar_url: string | null } };
  // Supabase returns pricing as either an object or array — normalize to object
  const priceRaw = tpl.pricing as unknown;
  const price = (Array.isArray(priceRaw) ? priceRaw[0] : priceRaw) as { pricing_type: string; price_cents: number } | undefined;
  const isFree = !price || price.pricing_type === 'free';
  const integrations = tpl.integration_definitions || [];

  // Check if current user has purchased or owns this template
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === tpl.creator_id;
  let hasPurchased = false;
  if (user && !isFree && !isOwner) {
    const { data: purchase } = await supabase
      .from('template_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('template_id', tpl.id)
      .single();
    hasPurchased = !!purchase;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{tpl.name}</h1>
          <p className="mt-1 text-gray-600">
            by {tpl.creator?.display_name || 'Unknown'}
          </p>
          {tpl.category && (
            <span className="mt-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
              {tpl.category}
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-2xl font-bold">
            {isFree ? 'Free' : `$${(price!.price_cents / 100).toFixed(2)}`}
          </span>
          <CloneButton
            templateId={tpl.id}
            templateName={tpl.name}
            isFree={isFree}
            hasPurchased={hasPurchased}
            isOwner={isOwner}
            priceCents={price?.price_cents}
          />
        </div>
      </div>

      {/* Preview */}
      <div className="mt-8 aspect-video rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center overflow-hidden">
        {tpl.preview_url ? (
          <img src={tpl.preview_url} alt={tpl.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-6xl text-indigo-200">{tpl.name.charAt(0).toUpperCase()}</span>
        )}
      </div>

      {/* Description */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold">About this template</h2>
        <p className="mt-2 text-gray-600 whitespace-pre-wrap">
          {tpl.long_description || tpl.description || 'No description provided.'}
        </p>
      </div>

      {/* Required Integrations */}
      {integrations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Required Integrations</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {integrations.map((integ) => (
              <div key={integ.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{integ.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium
                    ${integ.integration_type === 'optional' ? 'bg-gray-100 text-gray-600' : 'bg-amber-50 text-amber-700'}`}>
                    {integ.integration_type === 'optional' ? 'Optional' : 'Required'}
                  </span>
                </div>
                {integ.description && (
                  <p className="mt-1 text-sm text-gray-500">{integ.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 flex gap-6 text-sm text-gray-500">
        <span>{tpl.clone_count} clones</span>
        {tpl.review_count > 0 && (
          <span className="flex items-center gap-1">
            <span className="text-yellow-500">&#9733;</span> {tpl.average_rating} ({tpl.review_count} reviews)
          </span>
        )}
        <span>{tpl.tags?.length ? tpl.tags.join(', ') : 'No tags'}</span>
      </div>

      {/* Reviews */}
      <ReviewSection templateId={tpl.id} isOwner={isOwner} />
    </div>
  );
}
