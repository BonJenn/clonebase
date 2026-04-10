'use client';

import { useMemo } from 'react';
import Script from 'next/script';
import { useTenant } from '@/sdk/tenant-context';
import { useTenantData } from '@/sdk/use-tenant-data';
import { useFileUpload } from '@/sdk/use-file-upload';
import { useTenantAuth } from '@/sdk/use-tenant-auth';
import { useStripeCheckout } from '@/sdk/use-stripe-checkout';
import { Chart } from '@/sdk/chart';
import { createProductionUIKit } from '@/lib/builder/ui-kit-production';

interface DynamicRendererProps {
  transpiledCode: string;
  componentName: string;
  tenantId: string;
  instanceId: string;
}

// Renders AI-generated template code in production.
// Evaluates transpiled JS with real SDK hooks in scope.
export function DynamicRenderer({ transpiledCode, componentName, tenantId, instanceId }: DynamicRendererProps) {
  const Component = useMemo(() => {
    try {
      // Provide SDK hooks via flat __SDK__ scope
      const __SDK__ = {
        useTenant,
        useTenantData,
        useFileUpload,
        useTenantAuth,
        useStripeCheckout,
        Chart,
        useIntegration: () => ({ call: async () => ({ ok: true, data: {} }), loading: false, error: null }),
      };

      // Provide UI kit for generated code
      const __UI__ = createProductionUIKit();

      // eslint-disable-next-line no-new-func
      const module = { exports: {} as Record<string, unknown> };
      const fn = new Function('React', '__SDK__', '__UI__', 'module', 'exports', transpiledCode);

      // Import React for the generated code
      const React = require('react');
      fn(React, __SDK__, __UI__, module, module.exports);

      // Find the component
      const comp = module.exports[componentName]
        || Object.values(module.exports).find((v) => typeof v === 'function')
        || module.exports.default;

      return comp as React.ComponentType<{ tenantId: string; instanceId: string }> | null;
    } catch (err) {
      console.error('Failed to evaluate generated template:', err);
      return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transpiledCode, componentName]);

  if (!Component) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">App Error</h1>
          <p className="mt-2 text-gray-500">This app could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ApexCharts loaded from CDN once per page for any generated code that
          uses the Chart component. strategy="afterInteractive" lets the page
          render first, then the script loads in parallel. */}
      <Script
        src="https://cdn.jsdelivr.net/npm/apexcharts@3.53.0/dist/apexcharts.min.js"
        strategy="afterInteractive"
      />
      <Component tenantId={tenantId} instanceId={instanceId} />
    </>
  );
}
