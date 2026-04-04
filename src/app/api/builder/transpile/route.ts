import { NextRequest, NextResponse } from 'next/server';
import { transpileForPreview } from '@/lib/builder/transpiler';

// POST /api/builder/transpile — Transpile TSX to JS for preview iframe
export async function POST(request: NextRequest) {
  const { code, filename } = await request.json();

  if (!code) {
    return NextResponse.json({ error: 'code is required' }, { status: 400 });
  }

  try {
    const transpiled = transpileForPreview(code, filename || 'component.tsx');
    return NextResponse.json({ transpiled });
  } catch (err) {
    return NextResponse.json({
      error: 'Transpilation failed',
      details: (err as Error).message,
    }, { status: 400 });
  }
}
