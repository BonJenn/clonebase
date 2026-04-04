'use client';

import { useMemo } from 'react';
import { useTenant } from '@/sdk/tenant-context';
import { useTenantData } from '@/sdk/use-tenant-data';

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
      // Provide SDK hooks via __SDK__ scope
      const __SDK__ = {
        tenantContext: { useTenant },
        useTenantData: { useTenantData },
        useIntegration: { useIntegration: () => ({ call: async () => ({ ok: true, data: {} }), loading: false, error: null }) },
      };

      // eslint-disable-next-line no-new-func
      const module = { exports: {} as Record<string, unknown> };
      const fn = new Function('React', '__SDK__', 'module', 'exports', transpiledCode);

      // Import React for the generated code
      const React = require('react');
      fn(React, __SDK__, module, module.exports);

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

  return <Component tenantId={tenantId} instanceId={instanceId} />;
}
