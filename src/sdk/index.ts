// Clonebase Template SDK
// This is the public API that template code imports.
// Re-exports all hooks and utilities for template authors.

export { TenantProvider, useTenant } from './tenant-context';
export { useTenantData } from './use-tenant-data';
export { useIntegration } from './use-integration';
export { useFileUpload } from './use-file-upload';
export { callIntegration } from './call-integration';
export type { TenantContext, Collection, IntegrationCall } from './types';
