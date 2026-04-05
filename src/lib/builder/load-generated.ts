import { createAdminClient } from '@/lib/supabase/admin';
import { transpileForProduction } from '@/lib/builder/transpiler';

interface GeneratedCode {
  page_code: string;
  admin_code: string | null;
  api_handler_code: string | null;
}

interface TranspiledResult {
  transpiledCode: string;
  componentName: string;
}

// Fetches the current generated template code for a given template_id.
// Returns null if not found.
export async function loadGeneratedCode(templateId: string): Promise<GeneratedCode | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('generated_templates')
    .select('page_code, admin_code, api_handler_code')
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
