import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const maxDuration = 30;

// POST /api/builder/edit — Apply a direct text or image edit to the current
// generated template by data-edit-id. No AI call.
//
// Body: { template_id, edit_id, kind: 'text' | 'image', new_value }
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const { template_id, edit_id, kind, new_value } = body as {
    template_id?: string;
    edit_id?: string;
    kind?: 'text' | 'image';
    new_value?: string;
  };

  if (!template_id || !edit_id || !kind || typeof new_value !== 'string') {
    return NextResponse.json(
      { error: 'template_id, edit_id, kind, and new_value are required' },
      { status: 400 }
    );
  }
  if (kind !== 'text' && kind !== 'image') {
    return NextResponse.json({ error: 'kind must be "text" or "image"' }, { status: 400 });
  }
  if (new_value.length > 5000) {
    return NextResponse.json({ error: 'new_value too long' }, { status: 400 });
  }

  // Verify ownership
  const { data: template } = await supabase
    .from('app_templates')
    .select('id, creator_id')
    .eq('id', template_id)
    .single();

  if (!template || template.creator_id !== user.id) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  // Load current generated row
  const { data: rows } = await supabase
    .from('generated_templates')
    .select('id, page_code')
    .eq('template_id', template_id)
    .eq('is_current', true)
    .order('created_at', { ascending: false })
    .limit(1);

  const current = rows?.[0];
  if (!current) {
    return NextResponse.json({ error: 'No generated code found' }, { status: 404 });
  }

  const pageCode: string = current.page_code;
  const updatedCode =
    kind === 'text'
      ? replaceTextByEditId(pageCode, edit_id, new_value)
      : replaceImageSrcByEditId(pageCode, edit_id, new_value);

  if (updatedCode === null) {
    return NextResponse.json(
      { error: `Could not locate element with data-edit-id="${edit_id}"` },
      { status: 422 }
    );
  }
  if (updatedCode === pageCode) {
    return NextResponse.json({ ok: true, page_code: pageCode, unchanged: true });
  }

  const { error: updateError } = await supabase
    .from('generated_templates')
    .update({ page_code: updatedCode, updated_at: new Date().toISOString() })
    .eq('id', current.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, page_code: updatedCode });
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeJsxText(s: string): string {
  // JSX text nodes treat `{` and `}` as expressions and `<` as a tag delimiter.
  // Escape them by wrapping in JSX expressions with string literals.
  // For simplicity we replace them with their HTML entity equivalents which JSX
  // renders identically.
  return s
    .replace(/\\/g, '\\\\')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Replace the literal text content of a JSX element marked with data-edit-id.
// Returns the updated source, or null if no matching element was found.
// Handles only text-only children (no nested elements or expressions).
function replaceTextByEditId(code: string, editId: string, newText: string): string | null {
  const id = escapeRegex(editId);
  // Match: opening tag with data-edit-id, capture tag name, then text-only children, then closing tag.
  const re = new RegExp(
    `(<(\\w+)[^>]*\\bdata-edit-id="${id}"[^>]*>)([^<{}]*)(<\\/\\2>)`,
    's'
  );
  if (!re.test(code)) return null;
  return code.replace(re, (_, opening: string, _tag: string, _oldText: string, closing: string) => {
    return `${opening}${escapeJsxText(newText)}${closing}`;
  });
}

// Replace the src attribute of an <img> element marked with data-edit-id.
// Returns the updated source, or null if no matching element was found.
function replaceImageSrcByEditId(code: string, editId: string, newSrc: string): string | null {
  const id = escapeRegex(editId);
  // Find any <img ... /> tag containing the data-edit-id.
  const tagRe = new RegExp(`<img\\b[^>]*\\bdata-edit-id="${id}"[^>]*\\/?>`, 'g');
  let found = false;
  const updated = code.replace(tagRe, (tag) => {
    found = true;
    // Only replace literal string srcs (src="..."). JSX-expression srcs (src={...}) are left alone.
    if (/\bsrc="[^"]*"/.test(tag)) {
      return tag.replace(/\bsrc="[^"]*"/, `src="${newSrc.replace(/"/g, '&quot;')}"`);
    }
    return tag;
  });
  if (!found) return null;
  return updated;
}
