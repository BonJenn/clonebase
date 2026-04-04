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

  // Load existing generated code if any
  const { data: generated } = await supabase
    .from('generated_templates')
    .select('page_code, admin_code, api_handler_code, conversation_history')
    .eq('template_id', templateId)
    .eq('is_current', true)
    .single();

  return (
    <BuilderWorkspace
      templateId={templateId}
      templateName={template.name}
      initialPrompt={prompt || null}
      existingCode={generated ? {
        page_code: generated.page_code,
        admin_code: generated.admin_code,
        api_handler_code: generated.api_handler_code,
      } : null}
      existingMessages={(generated?.conversation_history as { role: string; content: string }[]) || []}
    />
  );
}
