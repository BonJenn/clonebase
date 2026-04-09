import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/instances/[id]/versions
//
// Lists all template versions available to this instance's owner. Versions
// are filtered to >= original_clone_version so owners can only revert within
// the timeline they've actually seen — versions that existed before they
// cloned may have been a completely different app.
//
// Response:
//   {
//     current_version: number,     // pinned version
//     original_version: number,    // floor
//     latest_version: number,      // newest available
//     update_available: boolean,   // latest > current
//     versions: [{ version, created_at, generation_prompt }]
//   }
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify the user owns the tenant this instance belongs to
  const { data: instance } = await supabase
    .from('app_instances')
    .select('id, template_id, template_version, original_clone_version, tenant:tenants!inner(owner_id)')
    .eq('id', id)
    .single() as { data: {
      id: string;
      template_id: string;
      template_version: number | null;
      original_clone_version: number | null;
      tenant: { owner_id: string };
    } | null };

  if (!instance || instance.tenant.owner_id !== user.id) {
    return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
  }

  // Floor: never go below the version the clone was originally created on
  const floor = instance.original_clone_version || 1;

  const { data: versions } = await supabase
    .from('generated_templates')
    .select('version, created_at, generation_prompt')
    .eq('template_id', instance.template_id)
    .gte('version', floor)
    .order('version', { ascending: false });

  const versionRows = (versions as Array<{ version: number; created_at: string; generation_prompt: string | null }>) || [];
  const latestVersion = versionRows[0]?.version || instance.template_version || floor;

  return NextResponse.json({
    current_version: instance.template_version,
    original_version: floor,
    latest_version: latestVersion,
    update_available: typeof instance.template_version === 'number' && latestVersion > instance.template_version,
    versions: versionRows.map((v) => ({
      version: v.version,
      created_at: v.created_at,
      // Trim the prompt to a short description for display
      description: v.generation_prompt
        ? v.generation_prompt.length > 120
          ? v.generation_prompt.slice(0, 117) + '...'
          : v.generation_prompt
        : null,
    })),
  });
}
