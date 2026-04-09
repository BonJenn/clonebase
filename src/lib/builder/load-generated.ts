import { createAdminClient } from '@/lib/supabase/admin';
import { transpileForProduction } from '@/lib/builder/transpiler';

interface GeneratedCode {
  page_code: string;
  admin_code: string | null;
  api_handler_code: string | null;
  version?: number;
}

interface TranspiledResult {
  transpiledCode: string;
  componentName: string;
}

/**
 * Fetches generated code for a template.
 *
 * If `version` is provided, loads that exact version (used when an
 * app_instance is pinned to a specific version). If omitted, falls back to
 * whatever row has is_current = true — used by the builder's own preview
 * and by legacy instances that predate version pinning.
 *
 * Returns null if no matching row exists.
 */
export async function loadGeneratedCode(templateId: string, version?: number | null): Promise<GeneratedCode | null> {
  const supabase = createAdminClient();

  // Pinned version lookup — instances created after version pinning landed
  if (typeof version === 'number' && version > 0) {
    const { data } = await supabase
      .from('generated_templates')
      .select('page_code, admin_code, api_handler_code, version')
      .eq('template_id', templateId)
      .eq('version', version)
      .limit(1);

    if (data?.[0]) return data[0];
    // If the pinned version doesn't exist (e.g. it was deleted), fall through
    // to is_current so the app at least renders something.
  }

  const { data } = await supabase
    .from('generated_templates')
    .select('page_code, admin_code, api_handler_code, version')
    .eq('template_id', templateId)
    .eq('is_current', true)
    .order('created_at', { ascending: false })
    .limit(1);

  return data?.[0] || null;
}

// Transpiles page_code or admin_code for production rendering.
export function transpileComponent(code: string): TranspiledResult {
  const transpiled = transpileForProduction(code);
  const match = code.match(/export\s+function\s+(\w+)/);
  return {
    transpiledCode: transpiled,
    componentName: match?.[1] || 'Page',
  };
}
