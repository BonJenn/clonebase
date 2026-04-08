import { createServerSupabaseClient } from '@/lib/supabase/server';
import { TemplateCard } from '@/components/platform/template-card';
import { TEMPLATE_CATEGORIES } from '@/lib/constants';
import type { AppTemplate } from '@/types';

type SortOption = 'popular' | 'newest' | 'top-rated';

interface MarketplacePageProps {
  searchParams: Promise<{ category?: string; q?: string; sort?: SortOption }>;
}

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const { category, q, sort } = await searchParams;
  const supabase = await createServerSupabaseClient();

  const sortField = sort === 'newest' ? 'created_at'
    : sort === 'top-rated' ? 'average_rating'
    : 'clone_count';

  let query = supabase
    .from('app_templates')
    .select('*, pricing:template_pricing(*)')
    .eq('status', 'published')
    .eq('visibility', 'public')
    .order(sortField, { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  if (q) {
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data: templates } = await query;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold">Template Marketplace</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600 px-4">Production-ready apps you can clone in one click</p>
      </div>

      {/* Search */}
      <form className="mt-6 sm:mt-8 flex justify-center">
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search templates..."
          className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </form>

      {/* Sort options */}
      <div className="mt-6 flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm">
        {([['popular', 'Most Popular'], ['newest', 'Newest'], ['top-rated', 'Top Rated']] as const).map(([key, label]) => (
          <a
            key={key}
            href={`/marketplace?${new URLSearchParams({ ...(category ? { category } : {}), ...(q ? { q } : {}), sort: key }).toString()}`}
            className={`font-medium transition-colors ${(!sort && key === 'popular') || sort === key ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Category filters */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <a
          href="/marketplace"
          className={`rounded-full px-3 py-1 text-sm transition-colors
            ${!category ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          All
        </a>
        {TEMPLATE_CATEGORIES.map((cat) => (
          <a
            key={cat}
            href={`/marketplace?category=${encodeURIComponent(cat)}`}
            className={`rounded-full px-3 py-1 text-sm transition-colors
              ${category === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {cat}
          </a>
        ))}
      </div>

      {/* Template grid */}
      {!templates?.length ? (
        <div className="mt-16 text-center text-gray-500">
          <p className="text-lg">No templates found</p>
          <p className="mt-1 text-sm">Try a different search or category</p>
        </div>
      ) : (
        <div className="mt-8 sm:mt-10 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {(templates as AppTemplate[]).map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}
