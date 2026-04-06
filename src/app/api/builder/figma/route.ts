import { NextRequest, NextResponse } from 'next/server';
import { parseFigmaDesign, parseFigmaUrl } from '@/lib/figma/parser';

// POST /api/builder/figma — Fetch and parse a Figma design into a text description
export async function POST(request: NextRequest) {
  const { figma_url, figma_token } = await request.json();

  if (!figma_url) {
    return NextResponse.json({ error: 'figma_url is required' }, { status: 400 });
  }

  // Use user's token or platform token
  const token = figma_token || process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({
      error: 'Figma access token required. Add yours in the prompt or set FIGMA_ACCESS_TOKEN.',
      needs_token: true,
    }, { status: 400 });
  }

  const parsed = parseFigmaUrl(figma_url);
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid Figma URL. Paste a link to a Figma file or frame.' }, { status: 400 });
  }

  try {
    let apiUrl: string;
    if (parsed.nodeId) {
      // Fetch specific node
      apiUrl = `https://api.figma.com/v1/files/${parsed.fileKey}/nodes?ids=${encodeURIComponent(parsed.nodeId)}`;
    } else {
      // Fetch full file
      apiUrl = `https://api.figma.com/v1/files/${parsed.fileKey}`;
    }

    const res = await fetch(apiUrl, {
      headers: { 'X-FIGMA-TOKEN': token },
    });

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 403) {
        return NextResponse.json({ error: 'Figma access denied. Check your token and file permissions.', needs_token: true }, { status: 403 });
      }
      return NextResponse.json({ error: `Figma API error: ${errText}` }, { status: res.status });
    }

    const data = await res.json();
    const description = parseFigmaDesign(data);

    if (!description.trim()) {
      return NextResponse.json({ error: 'Could not parse the Figma design. Make sure the URL points to a frame with content.' }, { status: 400 });
    }

    // Also try to get images for the main frames
    let imageUrls: Record<string, string> = {};
    try {
      const nodeIds = parsed.nodeId ? [parsed.nodeId] : [];
      if (!parsed.nodeId && data.document?.children?.[0]?.children) {
        nodeIds.push(...data.document.children[0].children.slice(0, 5).map((n: { id: string }) => n.id));
      }

      if (nodeIds.length > 0) {
        const imgRes = await fetch(
          `https://api.figma.com/v1/images/${parsed.fileKey}?ids=${nodeIds.join(',')}&format=png&scale=2`,
          { headers: { 'X-FIGMA-TOKEN': token } }
        );
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          imageUrls = imgData.images || {};
        }
      }
    } catch {
      // Images are optional, continue without them
    }

    return NextResponse.json({
      description,
      images: imageUrls,
      file_key: parsed.fileKey,
      node_id: parsed.nodeId,
    });
  } catch (err) {
    return NextResponse.json({ error: `Failed to fetch Figma design: ${(err as Error).message}` }, { status: 500 });
  }
}
