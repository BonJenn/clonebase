import { NextRequest, NextResponse } from 'next/server';
import { transpileForPreview } from '@/lib/builder/transpiler';
import { captureError } from '@/lib/monitoring';

// POST /api/builder/transpile — Transpile TSX to JS for preview iframe.
// Always returns 200 — transpilation errors are returned in the body so
// the browser console stays clean (the preview iframe handles the error).
export async function POST(request: NextRequest) {
  let code: string;
  let filename: string | undefined;
  try {
    const body = await request.json();
    code = body?.code;
    filename = body?.filename;
  } catch {
    return NextResponse.json({ transpiled: null, error: 'Invalid request body' });
  }

  if (!code) {
    return NextResponse.json({ transpiled: null, error: 'code is required' });
  }

  try {
    const transpiled = transpileForPreview(code, filename || 'component.tsx');
    return NextResponse.json({ transpiled });
  } catch (err) {
    captureError(err, {
      subsystem: 'transpile',
      extra: { code_preview: code.slice(0, 4000) },
    });
    return NextResponse.json({
      transpiled: null,
      error: 'Transpilation failed',
      details: (err as Error).message,
    });
  }
}
