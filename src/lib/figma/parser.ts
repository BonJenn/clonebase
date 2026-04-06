// Parses a Figma file/frame into a structured text description
// that the AI can use to generate matching code.

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  backgroundColor?: { r: number; g: number; b: number; a: number };
  fills?: Array<{ type: string; color?: { r: number; g: number; b: number; a: number }; imageRef?: string }>;
  strokes?: Array<{ type: string; color?: { r: number; g: number; b: number; a: number } }>;
  strokeWeight?: number;
  cornerRadius?: number;
  characters?: string;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    textAlignHorizontal?: string;
    lineHeightPx?: number;
  };
  layoutMode?: string;
  itemSpacing?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  effects?: Array<{ type: string; radius?: number; offset?: { x: number; y: number }; color?: { r: number; g: number; b: number; a: number } }>;
  constraints?: { horizontal: string; vertical: string };
  visible?: boolean;
}

function rgbaToHex(color: { r: number; g: number; b: number; a?: number }): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function describeNode(node: FigmaNode, depth: number = 0): string {
  if (node.visible === false) return '';

  const indent = '  '.repeat(depth);
  const parts: string[] = [];

  // Size
  const box = node.absoluteBoundingBox;
  const size = box ? `${Math.round(box.width)}x${Math.round(box.height)}` : '';

  // Background/fill color
  let bgColor = '';
  if (node.fills?.length) {
    const solidFill = node.fills.find(f => f.type === 'SOLID' && f.color);
    if (solidFill?.color) bgColor = `bg: ${rgbaToHex(solidFill.color)}`;
    const imgFill = node.fills.find(f => f.type === 'IMAGE');
    if (imgFill) bgColor = 'bg: image';
  }
  if (node.backgroundColor && !bgColor) {
    bgColor = `bg: ${rgbaToHex(node.backgroundColor)}`;
  }

  // Corner radius
  const radius = node.cornerRadius ? `rounded-${node.cornerRadius}` : '';

  // Shadows
  const shadow = node.effects?.find(e => e.type === 'DROP_SHADOW') ? 'shadow' : '';

  // Layout
  let layout = '';
  if (node.layoutMode === 'HORIZONTAL') layout = 'flex-row';
  if (node.layoutMode === 'VERTICAL') layout = 'flex-col';
  const gap = node.itemSpacing ? `gap-${node.itemSpacing}` : '';
  const padding = node.paddingLeft || node.paddingTop
    ? `p-${node.paddingLeft || 0}/${node.paddingTop || 0}`
    : '';

  // Build description based on node type
  switch (node.type) {
    case 'FRAME':
    case 'COMPONENT':
    case 'INSTANCE':
    case 'GROUP': {
      const props = [size, bgColor, layout, gap, padding, radius, shadow].filter(Boolean).join(', ');
      parts.push(`${indent}Frame "${node.name}" (${props})`);
      break;
    }
    case 'TEXT': {
      const text = node.characters || '';
      const fontSize = node.style?.fontSize ? `${node.style.fontSize}px` : '';
      const weight = node.style?.fontWeight && node.style.fontWeight >= 600 ? 'bold' : '';
      const align = node.style?.textAlignHorizontal?.toLowerCase() || '';
      const color = node.fills?.[0]?.color ? rgbaToHex(node.fills[0].color) : '';
      const props = [fontSize, weight, color, align].filter(Boolean).join(', ');
      parts.push(`${indent}Text "${text.slice(0, 80)}" (${props})`);
      break;
    }
    case 'RECTANGLE': {
      const props = [size, bgColor, radius, shadow].filter(Boolean).join(', ');
      parts.push(`${indent}Rectangle (${props})`);
      break;
    }
    case 'ELLIPSE': {
      parts.push(`${indent}Circle (${size}, ${bgColor})`);
      break;
    }
    case 'VECTOR': {
      parts.push(`${indent}Icon/Vector "${node.name}"`);
      break;
    }
    default: {
      const props = [size, bgColor].filter(Boolean).join(', ');
      if (props) parts.push(`${indent}${node.type} "${node.name}" (${props})`);
    }
  }

  // Recurse into children (limit depth to avoid token explosion)
  if (node.children && depth < 6) {
    for (const child of node.children) {
      const desc = describeNode(child, depth + 1);
      if (desc) parts.push(desc);
    }
  }

  return parts.join('\n');
}

// Parse a Figma file response into a text description for the AI
export function parseFigmaDesign(fileData: { document?: FigmaNode; nodes?: Record<string, { document: FigmaNode }> }): string {
  const descriptions: string[] = [];

  if (fileData.nodes) {
    // Frame-specific fetch
    for (const [, nodeData] of Object.entries(fileData.nodes)) {
      descriptions.push(describeNode(nodeData.document));
    }
  } else if (fileData.document) {
    // Full file — only describe the first page's children
    const firstPage = fileData.document.children?.[0];
    if (firstPage?.children) {
      for (const frame of firstPage.children.slice(0, 10)) {
        descriptions.push(describeNode(frame));
      }
    }
  }

  return descriptions.filter(Boolean).join('\n\n');
}

// Extract the file key and node IDs from a Figma URL
export function parseFigmaUrl(url: string): { fileKey: string; nodeId?: string } | null {
  // https://www.figma.com/file/ABC123/name?node-id=1-2
  // https://www.figma.com/design/ABC123/name?node-id=1-2
  const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
  if (!match) return null;

  const fileKey = match[1];
  const nodeMatch = url.match(/node-id=([^&]+)/);
  const nodeId = nodeMatch ? decodeURIComponent(nodeMatch[1]) : undefined;

  return { fileKey, nodeId };
}
