import Link from 'next/link';
import type { AppTemplate } from '@/types';

interface TemplateCardProps {
  template: AppTemplate;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const price = template.pricing;
  const isFree = !price || price.pricing_type === 'free';

  return (
    <Link
      href={`/templates/${template.id}`}
      className="group block rounded-xl border border-gray-200 bg-white overflow-hidden transition-shadow hover:shadow-lg"
    >
      {/* Preview image */}
      <div className="aspect-video bg-gray-100 flex items-center justify-center">
        {template.preview_url ? (
          <img
            src={template.preview_url}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl font-semibold text-gray-300">
            {template.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
            {template.name}
          </h3>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
            ${isFree ? 'bg-green-50 text-green-700' : 'bg-indigo-50 text-indigo-700'}`}>
            {isFree ? 'Free' : `$${(price!.price_cents / 100).toFixed(2)}`}
          </span>
        </div>

        {template.description && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{template.description}</p>
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
          <span>{template.category || 'Uncategorized'}</span>
          <div className="flex items-center gap-3">
            {template.review_count > 0 && (
              <span className="flex items-center gap-1">
                <span className="text-yellow-500">&#9733;</span>
                {template.average_rating}
                <span className="text-gray-300">({template.review_count})</span>
              </span>
            )}
            <span>{template.clone_count} clones</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
