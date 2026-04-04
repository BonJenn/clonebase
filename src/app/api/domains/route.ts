import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/domains?tenant_id=xxx — List custom domains for a tenant
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = request.nextUrl.searchParams.get('tenant_id');
  if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

  const { data: domains } = await supabase
    .from('custom_domains')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  return NextResponse.json(domains || []);
}

// POST /api/domains — Add a custom domain to a tenant
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { tenant_id, domain } = await request.json();
  if (!tenant_id || !domain) {
    return NextResponse.json({ error: 'tenant_id and domain are required' }, { status: 400 });
  }

  // Validate domain format
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
  if (!domainRegex.test(domain)) {
    return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
  }

  // Block clonebase.com subdomains
  if (domain.endsWith('.clonebase.com') || domain === 'clonebase.com') {
    return NextResponse.json({ error: 'Cannot use clonebase.com domains' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('custom_domains')
    .insert({ tenant_id, domain: domain.toLowerCase() })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Domain already registered' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to add domain' }, { status: 500 });
  }

  return NextResponse.json({
    ...data,
    instructions: {
      type: 'CNAME',
      name: domain,
      value: 'cname.clonebase.com',
      txt_record: {
        name: `_clonebase.${domain}`,
        value: data.verification_token,
      },
    },
  }, { status: 201 });
}

// DELETE /api/domains — Remove a custom domain
export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { domain_id } = await request.json();
  if (!domain_id) return NextResponse.json({ error: 'domain_id required' }, { status: 400 });

  await supabase.from('custom_domains').delete().eq('id', domain_id);
  return NextResponse.json({ success: true });
}
