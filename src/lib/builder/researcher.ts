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

// Deep research for businesses and real-world topics.
// Pulls comprehensive data: full menus, all locations, hours, reviews, photos.
export async function researchTopic(query: string): Promise<ResearchResult> {
  try {
    const response = await getOpenAI().responses.create({
      model: 'gpt-4.1-mini',
      tools: [{ type: 'web_search_preview' }],
      input: `You are researching a real business or topic to build a professional website. Find EVERYTHING available. Be exhaustive.

Search for: ${query}

Return ALL of the following that you can find (in a structured format):

## BUSINESS INFO
- Full official name
- Tagline or slogan
- Description / About Us (2-3 sentences)
- Year established
- Type of business

## LOCATIONS (list ALL locations)
For each location:
- Full address
- Phone number
- Hours of operation (every day)
- Special notes (drive-thru, dine-in, etc.)

## MENU / SERVICES / PRODUCTS (list EVERYTHING)
For each item:
- Name
- Description
- Price (if available)
- Category (e.g., Appetizers, Entrees, Desserts, Drinks)

## REVIEWS & RATINGS
- Google rating and review count
- Yelp rating and review count
- 3-5 notable customer reviews (with star rating)

## SOCIAL MEDIA & LINKS
- Website URL
- Instagram, Facebook, Twitter handles
- Any notable press or features

## PHOTOS
- List any image URLs you find (logo, food photos, interior, exterior)
- If no direct URLs, describe what photos should show

Be THOROUGH. A real website needs real content. Don't summarize — list everything.`,
    });

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

    const facts = text.split('\n').filter((line: string) => line.trim().length > 10);

    // Try to extract any image URLs from the research
    const imageUrls: string[] = [];
    const urlRegex = /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|gif)/gi;
    const matches = text.match(urlRegex);
    if (matches) imageUrls.push(...matches.slice(0, 10));

    return {
      summary: text.slice(0, 4000),
      facts,
      images: imageUrls,
    };
  } catch (err) {
    console.error('Research failed:', err);
    return { summary: '', facts: [], images: [] };
  }
}

// Generate themed image URLs for a business/topic
export async function searchImages(query: string, count: number = 8): Promise<string[]> {
  const words = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  const base = words.slice(0, 3).join('-');

  // Generate diverse image seeds for different sections of a business site
  const sections = ['hero', 'interior', 'food-1', 'food-2', 'food-3', 'team', 'exterior', 'ambiance', 'detail', 'feature'];
  return sections.slice(0, count).map(section => `https://picsum.photos/seed/${base}-${section}/1200/800`);
}
