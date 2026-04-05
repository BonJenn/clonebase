import OpenAI from 'openai';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI();
  return _openai;
}

export interface ResearchResult {
  summary: string;
  facts: string[];
  images: string[];
}

// Researches a topic using OpenAI's web search to get current information.
// Used when the user mentions a real business, person, or topic that needs live data.
export async function researchTopic(query: string): Promise<ResearchResult> {
  try {
    const response = await getOpenAI().responses.create({
      model: 'gpt-4.1-mini',
      tools: [{ type: 'web_search_preview' }],
      input: `Research this and provide factual information that would be useful for building a website or app about it. Include specific details like business name, location, hours, menu items, services, descriptions, reviews, etc. Be specific and detailed.

Topic: ${query}

Return your findings as a structured summary.`,
    });

    // Extract text from the response
    let text = '';
    for (const item of response.output) {
      if (item.type === 'message') {
        for (const content of item.content) {
          if (content.type === 'output_text') {
            text += content.text;
          }
        }
      }
    }

    // Parse into structured data
    const facts = text.split('\n').filter((line: string) => line.trim().length > 10).slice(0, 20);

    return {
      summary: text.slice(0, 2000),
      facts,
      images: [],
    };
  } catch (err) {
    console.error('Research failed:', err);
    return {
      summary: '',
      facts: [],
      images: [],
    };
  }
}

// Search for relevant images using Unsplash (free, no API key needed for small usage)
export async function searchImages(query: string, count: number = 5): Promise<string[]> {
  try {
    // Use picsum with descriptive seeds based on the query
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    return Array.from({ length: count }, (_, i) => {
      const seed = words.slice(0, 3).join('-') + '-' + i;
      return `https://picsum.photos/seed/${seed}/800/600`;
    });
  } catch {
    return [];
  }
}
