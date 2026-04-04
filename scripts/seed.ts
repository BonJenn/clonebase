import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const SEED_EMAIL = 'seed@clonebase.com';
const SEED_PASSWORD = 'seedpassword123';

const templates = [
  {
    name: 'AI Customer Support Bot',
    slug: 'ai-support-bot',
    description: 'An AI-powered customer support chatbot that handles FAQs, routes tickets, and learns from your docs.',
    long_description: 'Deploy your own AI support agent in minutes. Upload your knowledge base and it handles customer questions 24/7. Includes ticket routing, conversation history, and analytics dashboard.',
    category: 'AI Tools',
    tags: ['ai', 'chatbot', 'support', 'openai'],
    integrations: [
      { name: 'OpenAI', service_key: 'openai', description: 'Powers the AI chat responses', integration_type: 'user_provided' as const, required_fields: ['api_key'] },
    ],
    pricing: { pricing_type: 'free' as const, price_cents: 0 },
  },
  {
    name: 'SaaS Waitlist & Landing Page',
    slug: 'saas-waitlist',
    description: 'Beautiful landing page with email capture, waitlist management, and referral tracking.',
    long_description: 'Launch your SaaS idea with a polished landing page. Collect emails, track referrals, and manage your waitlist from a built-in admin dashboard. Includes email notifications and analytics.',
    category: 'Marketing',
    tags: ['landing-page', 'waitlist', 'email', 'marketing'],
    integrations: [
      { name: 'SendGrid', service_key: 'sendgrid', description: 'Sends confirmation and notification emails', integration_type: 'user_provided' as const, required_fields: ['api_key'] },
    ],
    pricing: { pricing_type: 'free' as const, price_cents: 0 },
  },
  {
    name: 'AI Content Writer',
    slug: 'ai-content-writer',
    description: 'Generate blog posts, social media copy, and marketing emails with AI. Built-in editor and scheduling.',
    long_description: 'A full content creation suite powered by AI. Write blog posts, tweets, LinkedIn posts, and email campaigns. Includes a rich text editor, content calendar, and one-click publishing.',
    category: 'AI Tools',
    tags: ['ai', 'writing', 'content', 'blog', 'openai'],
    integrations: [
      { name: 'OpenAI', service_key: 'openai', description: 'Generates content drafts and rewrites', integration_type: 'user_provided' as const, required_fields: ['api_key'] },
      { name: 'Twitter/X', service_key: 'twitter', description: 'Publish directly to Twitter', integration_type: 'optional' as const, required_fields: ['api_key', 'api_secret'] },
    ],
    pricing: { pricing_type: 'one_time' as const, price_cents: 1999 },
  },
  {
    name: 'Mini E-Commerce Store',
    slug: 'mini-ecommerce',
    description: 'A simple storefront with product listings, cart, and Stripe checkout. Perfect for small shops.',
    long_description: 'Sell physical or digital products with a clean, fast storefront. Includes product management, image uploads, shopping cart, Stripe payments, and order tracking. No code needed.',
    category: 'E-Commerce',
    tags: ['ecommerce', 'store', 'stripe', 'payments'],
    integrations: [
      { name: 'Stripe', service_key: 'stripe', description: 'Processes customer payments', integration_type: 'user_provided' as const, required_fields: ['api_key'] },
    ],
    pricing: { pricing_type: 'one_time' as const, price_cents: 2999 },
  },
  {
    name: 'Team Standup Tracker',
    slug: 'standup-tracker',
    description: 'Async standups for remote teams. Daily check-ins, blockers board, and weekly summaries.',
    long_description: 'Replace your daily standup meetings with async updates. Team members post what they did, what they plan to do, and any blockers. Automatic weekly digest emails and a Slack integration.',
    category: 'Productivity',
    tags: ['team', 'standup', 'productivity', 'remote'],
    integrations: [
      { name: 'Slack', service_key: 'slack', description: 'Posts standup summaries to a Slack channel', integration_type: 'optional' as const, required_fields: ['webhook_url'] },
    ],
    pricing: { pricing_type: 'free' as const, price_cents: 0 },
  },
  {
    name: 'Personal Portfolio',
    slug: 'personal-portfolio',
    description: 'A sleek developer portfolio with project showcase, blog, and contact form.',
    long_description: 'Stand out with a beautiful portfolio site. Showcase your projects with screenshots and live links, write blog posts in markdown, and collect messages via a contact form. Fully responsive.',
    category: 'Portfolio',
    tags: ['portfolio', 'developer', 'personal', 'blog'],
    integrations: [],
    pricing: { pricing_type: 'free' as const, price_cents: 0 },
  },
  {
    name: 'AI Image Generator',
    slug: 'ai-image-gen',
    description: 'Generate and edit images with DALL-E and Stable Diffusion. Gallery, history, and sharing built in.',
    long_description: 'Create stunning images with AI. Type a prompt and get results in seconds. Supports DALL-E 3 and Stable Diffusion. Includes a personal gallery, generation history, and public sharing links.',
    category: 'AI Tools',
    tags: ['ai', 'images', 'dall-e', 'stable-diffusion'],
    integrations: [
      { name: 'OpenAI', service_key: 'openai', description: 'DALL-E image generation', integration_type: 'user_provided' as const, required_fields: ['api_key'] },
      { name: 'Replicate', service_key: 'replicate', description: 'Stable Diffusion models', integration_type: 'optional' as const, required_fields: ['api_key'] },
    ],
    pricing: { pricing_type: 'one_time' as const, price_cents: 1499 },
  },
  {
    name: 'Link-in-Bio Page',
    slug: 'link-in-bio',
    description: 'A customizable link-in-bio page with analytics. Like Linktree, but yours.',
    long_description: 'Create a beautiful link page for your social profiles. Add links, customize colors and layout, and track clicks with built-in analytics. Perfect for creators and influencers.',
    category: 'Social',
    tags: ['links', 'bio', 'social', 'creator'],
    integrations: [],
    pricing: { pricing_type: 'free' as const, price_cents: 0 },
  },
  {
    name: 'Metrics Dashboard',
    slug: 'metrics-dashboard',
    description: 'Connect your data sources and build real-time dashboards with charts, tables, and KPIs.',
    long_description: 'A flexible analytics dashboard. Pull data from APIs, databases, or CSV uploads. Build dashboards with line charts, bar charts, pie charts, and KPI cards. Auto-refreshes and supports sharing.',
    category: 'Dashboard',
    tags: ['analytics', 'dashboard', 'charts', 'data'],
    integrations: [
      { name: 'Database', service_key: 'database', description: 'Connect to an external Postgres or MySQL database', integration_type: 'optional' as const, required_fields: ['connection_string'] },
    ],
    pricing: { pricing_type: 'one_time' as const, price_cents: 3999 },
  },
];

async function seed() {
  console.log('Seeding Clonebase...\n');

  // 1. Create a seed user via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: SEED_EMAIL,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: 'Clonebase Team' },
  });

  if (authError && !authError.message.includes('already been registered')) {
    console.error('Failed to create seed user:', authError.message);
    process.exit(1);
  }

  // Get the user ID (either just created or already exists)
  let userId: string;
  if (authData?.user) {
    userId = authData.user.id;
  } else {
    const { data } = await supabase.from('profiles').select('id').eq('email', SEED_EMAIL).single();
    userId = data!.id;
  }

  console.log(`Seed user: ${SEED_EMAIL} (${userId})\n`);

  // 2. Insert templates
  for (const tpl of templates) {
    const { data: template, error } = await supabase
      .from('app_templates')
      .upsert({
        creator_id: userId,
        name: tpl.name,
        slug: tpl.slug,
        description: tpl.description,
        long_description: tpl.long_description,
        category: tpl.category,
        tags: tpl.tags,
        status: 'published',
        visibility: 'public',
        clone_count: Math.floor(Math.random() * 200),
      }, { onConflict: 'slug' })
      .select()
      .single();

    if (error) {
      console.error(`  FAIL  ${tpl.name}: ${error.message}`);
      continue;
    }

    // Pricing
    await supabase
      .from('template_pricing')
      .upsert({
        template_id: template.id,
        pricing_type: tpl.pricing.pricing_type,
        price_cents: tpl.pricing.price_cents,
      }, { onConflict: 'template_id' });

    // Integration definitions
    for (const integ of tpl.integrations) {
      await supabase
        .from('integration_definitions')
        .insert({
          template_id: template.id,
          name: integ.name,
          service_key: integ.service_key,
          description: integ.description,
          integration_type: integ.integration_type,
          required_fields: integ.required_fields,
        });
    }

    const price = tpl.pricing.price_cents === 0 ? 'Free' : `$${(tpl.pricing.price_cents / 100).toFixed(2)}`;
    console.log(`  OK  ${tpl.name} [${tpl.category}] ${price}`);
  }

  console.log('\nDone! Visit http://localhost:3000/marketplace');
}

seed();
