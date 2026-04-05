import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// DELETE /api/apps — Delete a vibecoded app (template + generated code)
export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { template_id } = await request.json();
  if (!template_id) return NextResponse.json({ error: 'template_id required' }, { status: 400 });

  // Verify ownership
  const { data: template } = await supabase
    .from('app_templates')
    .select('id, creator_id')
    .eq('id', template_id)
    .eq('creator_id', user.id)
    .single();

  if (!template) return NextResponse.json({ error: 'App not found' }, { status: 404 });

  const admin = createAdminClient();

  // Delete generated code
  await (admin.from('generated_templates') as any).delete().eq('template_id', template_id);

  // Delete pricing
  await (admin.from('template_pricing') as any).delete().eq('template_id', template_id);

  // Delete integration definitions
  await (admin.from('integration_definitions') as any).delete().eq('template_id', template_id);

  // Delete app instances and their tenants
  const { data: instances } = await admin
    .from('app_instances')
    .select('id, tenant_id')
    .eq('template_id', template_id) as { data: { id: string; tenant_id: string }[] | null };

  if (instances) {
    for (const inst of instances) {
      await (admin.from('tenant_integrations') as any).delete().eq('tenant_id', inst.tenant_id);
      await (admin.from('tenant_data') as any).delete().eq('tenant_id', inst.tenant_id);
      await (admin.from('analytics_events') as any).delete().eq('tenant_id', inst.tenant_id);
      await (admin.from('app_instances') as any).delete().eq('id', inst.id);
      await (admin.from('tenants') as any).delete().eq('id', inst.tenant_id);
    }
  }

  // Delete the template itself
  await (admin.from('app_templates') as any).delete().eq('id', template_id);

  return NextResponse.json({ deleted: true });
}
