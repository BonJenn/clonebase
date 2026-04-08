// Seed data pattern: real images (picsum), real facts, the seeded-state hook pattern.
// Always included.

export const SEED_DATA = `## SEED DATA PATTERN (CRITICAL — ALWAYS USE THIS)

ALL apps that have content MUST seed it through useTenantData. NEVER use hardcoded const arrays that are rendered directly. The seed data must go through insert() so it appears in the data store.

### REAL IMAGES — use picsum.photos
When seed data needs images (photos, avatars, thumbnails, product images), use picsum.photos URLs. They return real photographs with no API key needed:

- Specific size: \`https://picsum.photos/seed/{unique-name}/400/400\`
- The "seed" parameter makes the URL return the SAME image every time for that name
- Use descriptive seeds: \`https://picsum.photos/seed/sunset-beach/600/400\`
- For avatars: \`https://picsum.photos/seed/user-sarah/200/200\`
- For wide banners: \`https://picsum.photos/seed/hero-banner/800/400\`
- ALWAYS use different seed values for each image so they look different

### REAL DATA — use actual facts
When seed data needs real-world information, use REAL data, not placeholders.

HARD LIMIT: Maximum 10 seed entries. NEVER generate more than 10, even if the user asks for 50 or 100. The output will break if you try. Instead:
- Seed 8-10 high-quality entries to make the app look full
- Tell the user in the explanation: "Loaded 10 players to start. Add more in the Data tab or connect a live API for the full dataset."
- If they ask for more, suggest using the API integration

Volume guidelines:
- Sports/teams/players: 8-10 with full stats
- Products/menu items: 8-10 across categories
- User profiles: 6-8 diverse profiles
- Blog posts/articles: 5-8 entries
- Recipes: 5-8 with full ingredients
- Quiz questions: 8-10 questions
- Dashboard metrics: 8-10 data points

Data quality:
- NBA teams: "Los Angeles Lakers", record: "52-30", conference: "Western", division: "Pacific"
- Recipes: real ingredient lists with quantities AND actual step-by-step instructions
- Products: realistic names, detailed descriptions, real price points ($12.99 not $10)
- Stocks: real ticker symbols (AAPL at $187.50, GOOGL at $142.30) with realistic daily changes
- People: diverse realistic names (not just John/Jane), detailed bios, varied interests
- Restaurants: "Sakura Ramen House", cuisine: "Japanese", rating: 4.7, price: "$$"

NEVER use "Item 1", "Team A", "User 1", "Sample Product", "Lorem ipsum", "Test Data".
The seed data IS the product — if it looks fake, the app looks fake.

### Seed Pattern Code
\`\`\`tsx
const SEED_DATA = [
  {
    caption: 'Golden hour at the beach',
    image_url: 'https://picsum.photos/seed/beach-sunset/600/600',
    likes: 42,
    username: 'sarah_travels',
    avatar_url: 'https://picsum.photos/seed/avatar-sarah/100/100',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    caption: 'Morning coffee vibes',
    image_url: 'https://picsum.photos/seed/coffee-morning/600/600',
    likes: 28,
    username: 'coffeelover',
    avatar_url: 'https://picsum.photos/seed/avatar-coffee/100/100',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  // 5-15 entries with UNIQUE picsum seeds and REAL content
];

// Inside the component — REQUIRED:
const { data: posts, insert, loading } = useTenantData<Post>('posts');
const [seeded, setSeeded] = useState(false);

useEffect(() => {
  if (!loading && posts.length === 0 && !seeded) {
    setSeeded(true);
    SEED_DATA.forEach(item => insert(item));
  }
}, [loading, posts.length, seeded]);

// Render from the data variable — NEVER from SEED_DATA:
{posts.map(post => (
  <img key={post.id} src={post.image_url} alt={post.caption} />
))}
\`\`\`

WHEN TO SEED vs NOT SEED — use good judgment:

SEED data when the app is a content viewer or showcase:
- Photo/image gallery → seed with picsum.photos images
- Recipe app → seed with real recipes
- Dashboard/stats → seed with realistic data
- Quiz/trivia → seed with real questions
- E-commerce/catalog → seed with products and prices
- Blog/articles → seed with sample posts
- Portfolio → seed with sample projects

DO NOT seed when the app is a blank canvas the user fills:
- Todo list / task manager → start empty, user adds their own tasks
- Note-taking app → start empty
- Journal / diary → start empty
- Chat / messaging → start empty
- Form builder → start empty
- Personal tracker (habits, expenses, workouts) → start empty
- Calendar / scheduling → start empty

The rule: if the app is useless without content (quiz with no questions), seed it. If the app IS the act of creating content (todo list), start empty.

All data MUST flow through useTenantData so users can view, edit, and delete it in the Data tab.`;
