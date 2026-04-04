import { NextResponse } from 'next/server';
import { callIntegration } from '@/sdk/call-integration';
import { createAdminClient } from '@/lib/supabase/admin';

// Server-side API handler for the AI Support Bot template.
// Routes: POST /api/t/chat — sends messages to OpenAI with knowledge base context.

export async function apiHandler(
  req: Request,
  context: { tenantId: string; params: string[] }
): Promise<Response> {
  const route = context.params[0];

  switch (route) {
    case 'chat':
      return handleChat(req, context.tenantId);
    default:
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

async function handleChat(req: Request, tenantId: string): Promise<Response> {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { messages } = await req.json();

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
  }

  // Fetch knowledge base entries to use as context
  const admin = createAdminClient();
  const { data: knowledgeRows } = await admin
    .from('tenant_data')
    .select('data')
    .eq('tenant_id', tenantId)
    .eq('collection', 'knowledge_base')
    .limit(20);

  const knowledgeContext = (knowledgeRows || [])
    .map((r) => `## ${(r.data as Record<string, string>).title}\n${(r.data as Record<string, string>).content}`)
    .join('\n\n');

  // Build the system prompt with knowledge base
  const systemPrompt = `You are a helpful, friendly customer support assistant. Be concise and clear in your responses.

${knowledgeContext ? `Use the following knowledge base to answer questions. If the answer isn't in the knowledge base, say so honestly and offer to help in other ways.

--- KNOWLEDGE BASE ---
${knowledgeContext}
--- END KNOWLEDGE BASE ---` : 'You don\'t have a knowledge base configured yet. Answer general questions helpfully and suggest the user add knowledge base entries via the /admin page.'}`;

  // Call OpenAI via the integration proxy (decrypts the tenant's API key server-side)
  const result = await callIntegration(
    tenantId,
    'openai',
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      body: {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-10), // Last 10 messages for context window management
        ],
        max_tokens: 1000,
        temperature: 0.7,
      },
    }
  );

  if (!result.ok) {
    const errorData = result.data as Record<string, unknown>;
    return NextResponse.json(
      { error: errorData?.error || 'Failed to get AI response. Is OpenAI connected?' },
      { status: 502 }
    );
  }

  const data = result.data as { choices: { message: { content: string } }[] };
  const content = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

  return NextResponse.json({ content });
}
