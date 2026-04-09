import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { BuilderWorkspace } from './builder-workspace';

export default async function BuilderPage({
  params,
  searchParams,
}: {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ prompt?: string }>;
}) {
  const { templateId } = await params;
  const { prompt } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: template } = await supabase
    .from('app_templates')
    .select('id, name, slug, creator_id')
    .eq('id', templateId)
    .single();

  if (!template || template.creator_id !== user.id) notFound();

  // Load existing generated code if any (use limit+order to handle duplicate is_current rows)
  const { data: generatedRows } = await supabase
    .from('generated_templates')
    .select('page_code, admin_code, api_handler_code, conversation_history')
    .eq('template_id', templateId)
    .eq('is_current', true)
    .order('created_at', { ascending: false })
    .limit(1);

  const generated = generatedRows?.[0] || null;

  // Look up the existing deployment (if any) so the builder can show
  // "Update" instead of "Publish" and the workspace knows the live URL.
  const { data: existingInstance } = await supabase
    .from('app_instances')
    .select('id, tenant:tenants!inner(slug, owner_id)')
    .eq('template_id', templateId)
    .maybeSingle() as { data: { id: string; tenant: { slug: string; owner_id: string } } | null };

  const ownedInstance = existingInstance && existingInstance.tenant.owner_id === user.id
    ? { id: existingInstance.id, slug: existingInstance.tenant.slug }
    : null;

  return (
    <BuilderWorkspace
      templateId={templateId}
      templateName={template.name}
      initialPrompt={generated ? null : (prompt || null)}
      existingCode={generated ? {
        page_code: generated.page_code,
        admin_code: generated.admin_code,
        api_handler_code: generated.api_handler_code,
      } : null}
      existingMessages={((generated?.conversation_history || []) as Array<{ role: string; content: string }>).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))}
      existingInstance={ownedInstance}
    />
  );
}
