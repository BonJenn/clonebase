import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// POST /api/instances/[id]/upgrade
//
// Upgrades (or reverts) an app instance to a specific template version.
// If `version` is omitted in the body, upgrades to the latest available
// version. Version must be >= the instance's original_clone_version — owners
// can't pick versions older than when they first cloned.
//
// Body: { version?: number }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const requestedVersion = typeof body?.version === 'number' ? body.version : null;

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

  const floor = instance.original_clone_version || 1;

  // Determine which version to use. If none specified, upgrade to the latest.
  let targetVersion: number;
  if (requestedVersion !== null) {
    if (requestedVersion < floor) {
      return NextResponse.json({
        error: `Cannot revert below version ${floor} (when this app was first cloned).`,
      }, { status: 400 });
    }
    targetVersion = requestedVersion;
  } else {
    const { data: latest } = await supabase
      .from('generated_templates')
      .select('version')
      .eq('template_id', instance.template_id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle() as { data: { version: number } | null };
    if (!latest) {
      return NextResponse.json({ error: 'No versions found' }, { status: 404 });
    }
    targetVersion = latest.version;
  }

  // Verify the target version actually exists
  const { data: versionCheck } = await supabase
    .from('generated_templates')
    .select('version')
    .eq('template_id', instance.template_id)
    .eq('version', targetVersion)
    .maybeSingle() as { data: { version: number } | null };

  if (!versionCheck) {
    return NextResponse.json({
      error: `Version ${targetVersion} not found for this template.`,
    }, { status: 404 });
  }

  await (supabase.from('app_instances') as any)
    .update({ template_version: targetVersion })
    .eq('id', id);

  return NextResponse.json({
    instance_id: id,
    version: targetVersion,
    previous_version: instance.template_version,
  });
}
