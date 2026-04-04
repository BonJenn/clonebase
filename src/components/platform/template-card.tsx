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
      <div className="aspect-video bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        {template.preview_url ? (
          <img
            src={template.preview_url}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-4xl text-indigo-200">
            {template.icon_url ? (
              <img src={template.icon_url} alt="" className="h-12 w-12" />
            ) : (
              <span className="text-5xl">{template.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
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
          <span>{template.clone_count} clones</span>
        </div>
      </div>
    </Link>
  );
}
