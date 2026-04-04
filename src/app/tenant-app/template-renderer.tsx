'use client';

import { getTemplate } from '@/templates/registry';

interface TemplateRendererProps {
  templateSlug: string;
  routePath: string;
  tenantId: string;
  instanceId: string;
}

// Client component that renders the correct template page.
// Templates self-register via static imports in registry.ts.
export function TemplateRenderer({ templateSlug, routePath, tenantId, instanceId }: TemplateRendererProps) {
  const template = getTemplate(templateSlug);

  if (!template) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">App Not Available</h1>
          <p className="mt-2 text-gray-500">Template &quot;{templateSlug}&quot; not found.</p>
        </div>
      </div>
    );
  }

  const Page = template.pages[routePath];

  if (!Page) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
          <p className="mt-2 text-gray-500">Route &quot;{routePath}&quot; not found in this app.</p>
        </div>
      </div>
    );
  }

  return <Page tenantId={tenantId} instanceId={instanceId} />;
}
