import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTemplate } from '@/templates/registry';
import { readFileSync } from 'fs';
import { join } from 'path';

// GET /api/export?template_id=xxx — Export a template as a standalone Next.js project.
// Returns a JSON manifest of all files needed to recreate the app independently.
// The frontend can use this to generate a downloadable zip.
//
// Security: Only the template creator or a user who purchased the template can export.
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const templateId = request.nextUrl.searchParams.get('template_id');
  if (!templateId) {
    return NextResponse.json({ error: 'template_id is required' }, { status: 400 });
  }

  // Fetch template
  const { data: template } = await supabase
    .from('app_templates')
    .select('*, pricing:template_pricing(*)')
    .eq('id', templateId)
    .single();

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  // Authorization: creator can always export; others need a purchase for paid templates
  const isCreator = template.creator_id === user.id;
  if (!isCreator) {
    const pricing = template.pricing as { pricing_type: string } | null;
    if (pricing && pricing.pricing_type !== 'free') {
      const { data: purchase } = await supabase
        .from('template_purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('template_id', templateId)
        .single();

      if (!purchase) {
        return NextResponse.json({ error: 'Purchase required to export this template' }, { status: 403 });
      }
    }
  }

  const tpl = getTemplate(template.slug);

  if (!tpl) {
    return NextResponse.json({ error: 'Template code not found in registry' }, { status: 404 });
  }

  // Read all template source files
  const files: Record<string, string> = {};
  const templateDir = join(process.cwd(), 'src', 'templates', template.slug);

  for (const filePath of tpl.meta.files) {
    try {
      const content = readFileSync(join(templateDir, filePath), 'utf-8');
      files[`src/templates/${template.slug}/${filePath}`] = content;
    } catch {
      // File might not exist, skip
    }
  }

  // Include SDK files that the template depends on
  const sdkDir = join(process.cwd(), 'src', 'sdk');
  const sdkFiles = ['index.ts', 'types.ts', 'tenant-context.tsx', 'use-tenant-data.ts', 'use-integration.ts', 'call-integration.ts'];
  for (const f of sdkFiles) {
    try {
      files[`src/sdk/${f}`] = readFileSync(join(sdkDir, f), 'utf-8');
    } catch {
      // skip
    }
  }

  // Generate a standalone package.json
  files['package.json'] = JSON.stringify({
    name: `clonebase-${template.slug}`,
    version: '1.0.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
    },
    dependencies: {
      'next': '^15.0.0',
      'react': '^19.0.0',
      'react-dom': '^19.0.0',
      '@supabase/supabase-js': '^2.0.0',
      '@supabase/ssr': '^0.5.0',
    },
    devDependencies: {
      'typescript': '^5.0.0',
      '@types/react': '^19.0.0',
      'tailwindcss': '^4.0.0',
      '@tailwindcss/postcss': '^4.0.0',
    },
  }, null, 2);

  // Generate a README
  files['README.md'] = `# ${template.name}

${template.description || ''}

Exported from [Clonebase](https://clonebase.com).

## Setup

1. \`npm install\`
2. Copy \`.env.local.example\` to \`.env.local\` and fill in your keys
3. \`npm run dev\`

## Required Integrations

This app may require API keys for external services. Check the integration definitions in the source code.
`;

  files['.env.local.example'] = `NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENCRYPTION_KEY=generate-with-openssl-rand-hex-32
`;

  return NextResponse.json({
    template: {
      name: template.name,
      slug: template.slug,
      description: template.description,
    },
    files,
    file_count: Object.keys(files).length,
  });
}
