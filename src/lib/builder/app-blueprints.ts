// App blueprints — curated specs for popular apps and games people commonly clone.
// When a user's prompt matches one of these, the blueprint is injected into the
// generator's context as a REFERENCE BLUEPRINT, giving the AI a strong starting point
// so the generated clone is high-quality from the first prompt.

export interface AppBlueprint {
  id: string;
  name: string;
  category:
    | 'social'
    | 'messaging'
    | 'dating'
    | 'entertainment'
    | 'ecommerce'
    | 'productivity'
    | 'food'
    | 'travel'
    | 'finance'
    | 'reading'
    | 'health'
    | 'game';
  /** Lowercased phrases that, if found in the user's prompt, match this blueprint. */
  aliases: string[];
  /** One-line summary of what the app is. */
  tagline: string;
  /** App display name to suggest. */
  app_name: string;
  /** Light/dark/colorful/minimal — overrides planner default. */
  design_theme: 'dark' | 'light' | 'colorful' | 'minimal';
  /** Tailwind color name (no -500 suffix), e.g. 'rose', 'sky'. */
  primary_color: string;
  mobile_first: boolean;
  needs_auth: boolean;
  /** State-based views the app should have. */
  views: string[];
  /** Data collections to seed via useTenantData. */
  data_collections: { name: string; fields: string[] }[];
  /** Critical features the AI must implement. */
  must_have_features: string[];
  /** Visual style notes — colors, typography, vibe. */
  design_notes: string;
  /** Rich code hints / patterns / snippets for the tricky parts. */
  key_patterns: string;
  /** Description of the seed data shape and tone. */
  seed_data_hint: string;
  /** Specific things to avoid. */
  pitfalls: string;
}

// ─── BLUEPRINTS ─────────────────────────────────────────────────────────────

export const BLUEPRINTS: AppBlueprint[] = [
  // ─── SOCIAL (10) ─────────────────────────────────────────────────────────
  {
    id: 'twitter',
    name: 'Twitter / X',
    category: 'social',
    aliases: ['twitter', 'x clone', 'twitter clone', 'microblog', 'microblogging', 'tweets', 'tweet app'],
    tagline: 'Microblogging feed where users post short updates, like, retweet, reply, and follow each other.',
    app_name: 'Chirp',
    design_theme: 'dark',
    primary_color: 'sky',
    mobile_first: false,
    needs_auth: true,
    views: ['feed', 'profile', 'compose', 'notifications'],
    data_collections: [
      { name: 'tweets', fields: ['author_id', 'author_name', 'author_handle', 'avatar_url', 'content', 'image_url', 'likes', 'retweets', 'replies', 'created_at'] },
      { name: 'profiles', fields: ['user_id', 'name', 'handle', 'bio', 'avatar_url', 'banner_url', 'followers', 'following', 'verified'] },
      { name: 'follows', fields: ['follower_id', 'following_id', 'created_at'] },
    ],
    must_have_features: [
      'Compose tweet (max 280 chars, character counter, image upload)',
      'Feed of tweets reverse-chronological with avatar, name, @handle, time-ago, content',
      'Like button (heart icon, count updates instantly, optimistic UI)',
      'Retweet button (green arrows, count updates)',
      'Reply button shows reply composer',
      'Profile page with banner, avatar, bio, follower/following counts, user\'s tweets',
      'Follow/Unfollow button on profiles',
      'Verified blue checkmark for some accounts',
    ],
    design_notes: 'Dark theme (#15202B background, white text). Sky-blue accent (#1D9BF0) for buttons, links, hover states. Sans-serif (system font is fine). Round avatars. Hover states should darken background slightly. Icons: ❤️ 🔁 💬 📤. Use border-b separators between tweets, no card backgrounds.',
    key_patterns: `
- Use 280-char limit with live counter that turns yellow at 240, red at 270
- Time-ago format: "2m", "5h", "1d", "Mar 5"
- Optimistic UI for likes: increment count immediately, then call update()
- Composer should auto-focus when opened, Cmd+Enter to submit
- Tweet card layout: avatar (left, 48px round), then content column with header (name + @handle + · + time-ago), body, then row of icons with counts
- Use lucide-style icons rendered as emoji or unicode (💬 🔁 ❤️ 📤)
- Empty feed: show "Welcome to Chirp 👋 Follow people to see tweets here"
`,
    seed_data_hint: 'Seed 15+ tweets from 6-8 different fictional users with realistic handles (@elonmusk-style format). Mix tech, news, jokes, replies, and photo posts. Include verified accounts.',
    pitfalls: 'Do NOT use indigo. Do NOT make it light mode. Do NOT use card backgrounds for tweets — use border separators. Do NOT call it "Twitter" or "X" in the UI (use Chirp/the app_name).',
  },

  {
    id: 'instagram',
    name: 'Instagram',
    category: 'social',
    aliases: ['instagram', 'instagram clone', 'ig clone', 'ig-style', 'photo sharing app', 'photo feed app', 'ig app', 'insta clone'],
    tagline: 'Photo and short-video sharing with feed, stories, reels, profile grid, likes, and comments.',
    app_name: 'Snapgram',
    design_theme: 'light',
    primary_color: 'rose',
    mobile_first: true,
    needs_auth: true,
    views: ['feed', 'explore', 'create', 'profile', 'stories'],
    data_collections: [
      { name: 'posts', fields: ['author_id', 'author_name', 'avatar_url', 'image_url', 'caption', 'likes', 'comments_count', 'created_at'] },
      { name: 'comments', fields: ['post_id', 'author_name', 'avatar_url', 'content', 'created_at'] },
      { name: 'profiles', fields: ['user_id', 'name', 'username', 'bio', 'avatar_url', 'followers', 'following', 'posts_count'] },
      { name: 'stories', fields: ['author_id', 'author_name', 'avatar_url', 'image_url', 'created_at'] },
    ],
    must_have_features: [
      'Stories bar at top (horizontal scrolling avatars with gradient ring for unwatched)',
      'Feed with square image posts, double-tap to like, heart animation',
      'Like button (heart fills red), comment button, share, bookmark',
      'Caption with @ mentions and #hashtags styled differently',
      'Comment count shows "View all 42 comments" → tap to expand',
      'Profile page with grid layout (3 columns) of square thumbnails',
      'Bio header with stats: posts, followers, following',
      'Image upload for new posts using useFileUpload',
      'Explore tab with 3-column grid of all posts',
    ],
    design_notes: 'White background, black text. Use a gradient logo (from-yellow-500 via-pink-500 to-purple-600) for the header brand text. Avatars are perfectly round. Posts are squares (aspect-square). Use rose/pink for the heart-like animation but neutral icons otherwise. Bottom tab bar on mobile with 5 icons: home, search, +, reels, profile.',
    key_patterns: `
- Stories ring: \`p-[3px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600\` wrapping a white-bg circle wrapping the avatar
- Double-tap detect: track last tap timestamp, if < 300ms ago, trigger like + animate a big white heart over the image
- Profile grid: \`grid grid-cols-3 gap-1\` of \`aspect-square object-cover\` images
- Heart animation: scale from 0 → 1.5 → 1 with opacity fade, position absolute center
- Image upload: useFileUpload, then insert post with image_url
- Format follower counts: 1500 → "1,500", 12500 → "12.5K", 1200000 → "1.2M"
- Stories at top: horizontal flex with overflow-x-auto, hide scrollbar
`,
    seed_data_hint: 'Seed 12+ posts with high-quality lifestyle/food/travel images from Unsplash, varied users, realistic captions with emojis. Seed 6-8 stories from different users.',
    pitfalls: 'Do NOT make posts rectangular — they MUST be square. Do NOT skip the gradient logo. Do NOT use cards with shadows — use clean minimal layout with border separators only.',
  },

  {
    id: 'tiktok',
    name: 'TikTok',
    category: 'social',
    aliases: ['tiktok', 'tiktok clone', 'short video app', 'vertical video feed', 'video swipe app'],
    tagline: 'Vertical full-screen video feed with swipe-up navigation, likes, comments, and creator profiles.',
    app_name: 'Vibe',
    design_theme: 'dark',
    primary_color: 'fuchsia',
    mobile_first: true,
    needs_auth: true,
    views: ['feed', 'discover', 'create', 'inbox', 'profile'],
    data_collections: [
      { name: 'videos', fields: ['author_id', 'author_name', 'avatar_url', 'thumbnail_url', 'caption', 'sound_name', 'likes', 'comments_count', 'shares', 'created_at'] },
      { name: 'comments', fields: ['video_id', 'author_name', 'avatar_url', 'content', 'likes', 'created_at'] },
      { name: 'profiles', fields: ['user_id', 'name', 'username', 'bio', 'avatar_url', 'followers', 'following', 'likes_count'] },
    ],
    must_have_features: [
      'Full-screen vertical video cards (one per viewport)',
      'Swipe up/down (or scroll wheel) to switch videos with snap-scroll',
      'Right side action bar: avatar, ❤️ like with count, 💬 comment with count, 🔁 share',
      'Bottom overlay: @username, caption, sound name with rotating disc icon',
      'Tap video to pause/resume (use a play emoji overlay)',
      'Comments slide-up modal',
      'Profile page with grid of video thumbnails (3 columns)',
    ],
    design_notes: 'Pure black background. White text. Fuchsia accents for the active state. Use snap-scroll: \`snap-y snap-mandatory overflow-y-scroll h-screen\`. Each video div is \`snap-start h-screen\`. Use placeholder gradient images instead of real videos. The right action bar has icons stacked vertically with counts below each.',
    key_patterns: `
- Snap scroll container: \`<div className="h-[100dvh] snap-y snap-mandatory overflow-y-scroll">\`
- Each video: \`<div className="h-[100dvh] snap-start relative">\`
- Use a placeholder image (Unsplash) inside an aspect-[9/16] container for the video
- Bottom overlay: \`absolute bottom-20 left-4 right-20\` with @username (bold) and caption
- Right action bar: \`absolute right-3 bottom-24 flex flex-col items-center gap-5\`
- Sound disc: rotating circle with \`animate-spin\` (slow it down with custom CSS or animation-duration)
- Heart pulse animation when liked
`,
    seed_data_hint: 'Seed 8-10 videos with vertical aspect ratio thumbnails from Unsplash. Use trendy captions like "POV: when you finally finish a project 😭✨" with hashtags. Realistic creator usernames.',
    pitfalls: 'Do NOT use horizontal layout. Do NOT show multiple videos on screen at once. Do NOT use light mode. Snap scroll is REQUIRED — don\'t use a normal scrollable list.',
  },

  {
    id: 'reddit',
    name: 'Reddit',
    category: 'social',
    aliases: ['reddit', 'reddit clone', 'subreddit', 'forum app', 'discussion board', 'community forum'],
    tagline: 'Topic-based community forum with subreddits, upvoted posts, and threaded comments.',
    app_name: 'Threadit',
    design_theme: 'light',
    primary_color: 'orange',
    mobile_first: false,
    needs_auth: true,
    views: ['feed', 'subreddit', 'post', 'submit'],
    data_collections: [
      { name: 'subreddits', fields: ['name', 'description', 'icon', 'subscribers', 'created_at'] },
      { name: 'posts', fields: ['subreddit', 'author_name', 'title', 'content', 'image_url', 'upvotes', 'downvotes', 'comment_count', 'created_at'] },
      { name: 'comments', fields: ['post_id', 'parent_id', 'author_name', 'content', 'upvotes', 'depth', 'created_at'] },
    ],
    must_have_features: [
      'Sidebar with list of subreddits, click to filter feed',
      'Posts show: vote arrows (left), title, subreddit, author, time, comment count',
      'Upvote/Downvote arrows change color when active (orange up, blue down)',
      'Score = upvotes - downvotes, displayed between arrows',
      'Click post to open detail view with full content and comments',
      'Threaded/nested comments with indentation per depth level',
      'Reply button on each comment opens inline composer',
      'Submit new post: title, content, subreddit picker',
    ],
    design_notes: 'White background, off-white card backgrounds (#F6F7F8). Orange (#FF4500) for upvote and brand. Comment threads use a left border line per depth level (border-l-2 border-gray-200). Round subreddit icons. Sans-serif. Compact, info-dense layout — Reddit is NOT minimal.',
    key_patterns: `
- Vote arrows: ▲ ▼ stacked vertically with score in middle. Use color-orange-500 when upvoted, blue-500 when downvoted, gray when neutral
- Score formatting: 1500 → "1.5k"
- Comment threading: render comments recursively with marginLeft based on depth (max depth 6)
- Each nested comment: \`<div className="border-l-2 border-gray-200 pl-3 ml-2">\`
- Time-ago: "5 minutes ago", "3 hours ago", "1 day ago"
- Post card: vote column (w-10) | content column with title (lg font-medium), then meta line, then preview
- Subreddit names prefixed with "r/", users with "u/"
`,
    seed_data_hint: 'Seed 6-8 subreddits (r/technology, r/aww, r/funny, r/AskReddit, r/programming, r/movies). Seed 15+ posts with mix of text and image, realistic Reddit-style titles. Seed nested comment threads.',
    pitfalls: 'Do NOT make it minimal — Reddit is dense with info. Do NOT skip the sidebar. Do NOT use indigo. Comment nesting is essential.',
  },

  {
    id: 'linkedin',
    name: 'LinkedIn',
    category: 'social',
    aliases: ['linkedin', 'linkedin clone', 'professional network', 'professional networking app', 'job network'],
    tagline: 'Professional networking with profiles, work experience, feed, connections, and job listings.',
    app_name: 'Workly',
    design_theme: 'light',
    primary_color: 'sky',
    mobile_first: false,
    needs_auth: true,
    views: ['feed', 'profile', 'network', 'jobs', 'messaging'],
    data_collections: [
      { name: 'profiles', fields: ['user_id', 'name', 'headline', 'avatar_url', 'banner_url', 'location', 'about', 'connections_count'] },
      { name: 'experience', fields: ['user_id', 'title', 'company', 'logo_url', 'start_date', 'end_date', 'description'] },
      { name: 'posts', fields: ['author_id', 'author_name', 'author_headline', 'avatar_url', 'content', 'image_url', 'reactions', 'comments_count', 'created_at'] },
      { name: 'jobs', fields: ['title', 'company', 'logo_url', 'location', 'remote', 'salary_range', 'posted_at', 'applicants'] },
    ],
    must_have_features: [
      'Profile with banner, round avatar, name, headline, location, about, experience timeline',
      'Feed of professional posts with reactions (👍 ❤️ 💡 🎉) and comment counts',
      'My Network page with suggested connections and pending invites',
      'Jobs board with title, company, location, salary, remote tag',
      '"Connect" button on profiles, "Easy Apply" on jobs',
      'Messaging panel (slide-up or sidebar)',
    ],
    design_notes: 'White background, off-white sections (#F3F2EF). LinkedIn blue (#0A66C2) for buttons and links. Serif-ish or clean sans-serif. Corporate, professional. Banner gradient or photo. Round avatars with subtle border. Cards with subtle shadow.',
    key_patterns: `
- Reactions row: shows count and 3 most-used emojis stacked
- Experience entry: company logo (square 48px), title (bold), company, dates, description
- Connection button states: "Connect" → "Pending" → "Connected"
- Job card: logo + title + company + location + remote tag + posted-time + applicants count
- Headline below name in smaller gray text
- "1st", "2nd", "3rd" connection degree badges next to names
`,
    seed_data_hint: 'Seed 6-8 professional profiles with realistic job titles (Senior Engineer, PM, Designer). Seed 10+ thoughtful career-related posts. Seed 8+ jobs at well-known companies with realistic salary ranges.',
    pitfalls: 'Do NOT use bright colors. Do NOT make it casual. Keep it corporate and clean. Do NOT skip the experience timeline.',
  },

  {
    id: 'pinterest',
    name: 'Pinterest',
    category: 'social',
    aliases: ['pinterest', 'pinterest clone', 'pinboard', 'mood board', 'idea board', 'image bookmark'],
    tagline: 'Visual discovery board where users save and organize images into themed collections.',
    app_name: 'Pinly',
    design_theme: 'light',
    primary_color: 'rose',
    mobile_first: false,
    needs_auth: true,
    views: ['feed', 'board', 'pin_detail', 'profile'],
    data_collections: [
      { name: 'pins', fields: ['author_id', 'author_name', 'image_url', 'title', 'description', 'source_url', 'saves', 'created_at'] },
      { name: 'boards', fields: ['user_id', 'name', 'description', 'cover_image', 'pin_count', 'created_at'] },
      { name: 'saves', fields: ['user_id', 'pin_id', 'board_id', 'created_at'] },
    ],
    must_have_features: [
      'Masonry grid feed (variable image heights)',
      'Hover over pin → save button appears in top-right',
      'Click pin → detail view with full image, description, source, save button',
      'Boards page: grid of board covers with pin count',
      'Create pin: image upload + title + description + board picker',
      'Save pin to a board action',
    ],
    design_notes: 'Off-white background (#FFFFFF or #F9F9F9). Pinterest red (#E60023) for buttons. Rounded image cards. NO uniform aspect ratios — let images keep their natural aspect (use CSS columns for masonry). Clean, photo-focused.',
    key_patterns: `
- Masonry layout: \`columns-2 sm:columns-3 lg:columns-5 gap-4\` with each pin \`<div className="break-inside-avoid mb-4">\`
- Pin card: image with rounded corners, title appears below on hover
- Save button: red rounded-full, top-right of pin, appears on hover
- Image-first design — no text on images themselves
`,
    seed_data_hint: 'Seed 30+ pins with varied images from Unsplash (recipes, fashion, home decor, travel, art). Mix portrait and landscape. Seed 5-6 boards.',
    pitfalls: 'Do NOT force a uniform grid — masonry is essential. Do NOT use cards with heavy borders. Do NOT skip hover save buttons.',
  },

  {
    id: 'snapchat',
    name: 'Snapchat',
    category: 'social',
    aliases: ['snapchat', 'snapchat clone', 'snap clone', 'disappearing photos', 'ephemeral messaging'],
    tagline: 'Ephemeral photo messaging with stories, snaps, and a friends map.',
    app_name: 'Flash',
    design_theme: 'light',
    primary_color: 'amber',
    mobile_first: true,
    needs_auth: true,
    views: ['camera', 'chat', 'stories', 'map', 'profile'],
    data_collections: [
      { name: 'snaps', fields: ['sender_id', 'sender_name', 'recipient_id', 'image_url', 'caption', 'opened', 'created_at'] },
      { name: 'stories', fields: ['author_id', 'author_name', 'avatar_url', 'image_url', 'caption', 'views', 'created_at'] },
      { name: 'friends', fields: ['user_id', 'friend_id', 'friend_name', 'avatar_url', 'streak', 'last_snap_at'] },
    ],
    must_have_features: [
      'Camera-first landing (big rounded square placeholder with capture button)',
      'Chat list with friend avatars, last activity, snap streak (🔥 + number)',
      'Stories tray of horizontally scrolling friend stories',
      'Tap story → full-screen viewer with auto-advance',
      'Bottom nav: Map, Chat, Camera (center, big), Stories, Spotlight',
    ],
    design_notes: 'Yellow brand (#FFFC00) for the logo and capture button. White background, dark text. Rounded everything. Playful, fun. Big bold capture button at center bottom.',
    key_patterns: `
- Capture button: large yellow circle with inner ring, scales on tap
- Streak: 🔥 emoji + number next to friend name
- Story circles in a row at top, stroked when unwatched
- Auto-advance stories: progress bars at top, 5 seconds each
`,
    seed_data_hint: 'Seed 8+ friends with avatars, streaks 1-300. Seed 6+ stories from different friends.',
    pitfalls: 'Do NOT skip the camera-first landing. Do NOT use a serious/corporate color scheme.',
  },

  {
    id: 'bereal',
    name: 'BeReal',
    category: 'social',
    aliases: ['bereal', 'bereal clone', 'be real', 'authentic photo', 'daily photo app'],
    tagline: 'Once-a-day dual photo (front + back camera) social network with no filters.',
    app_name: 'Genuine',
    design_theme: 'dark',
    primary_color: 'slate',
    mobile_first: true,
    needs_auth: true,
    views: ['feed', 'memories', 'friends', 'profile'],
    data_collections: [
      { name: 'posts', fields: ['author_id', 'author_name', 'avatar_url', 'main_image_url', 'selfie_image_url', 'caption', 'late_minutes', 'reactions', 'created_at'] },
      { name: 'reactions', fields: ['post_id', 'user_id', 'emoji', 'created_at'] },
    ],
    must_have_features: [
      'Daily countdown banner: "⚠️ Time to BeReal! 1h 24m left"',
      'Post card: large back-camera image with small selfie overlay in top-left',
      'Late warning: "⏰ 12 minutes late"',
      'Reactions: 4 default emojis (😍 😂 😮 ❤️) + custom selfie reactions',
      'Memories: calendar view of past posts',
    ],
    design_notes: 'Black background. White text. Very minimal — the photos are the focus. Use white outlines and rounded corners.',
    key_patterns: `
- Selfie overlay: \`absolute top-2 left-2 w-24 h-32 rounded-xl border-2 border-white\` over the main image
- Reactions row at bottom with rounded pill buttons
- Posts limited to one per user per day
`,
    seed_data_hint: 'Seed 8+ posts with realistic everyday scenes (desk, food, outdoors). Mix of on-time and late.',
    pitfalls: 'Do NOT add filters. Do NOT make it pretty/curated — the whole point is realness.',
  },

  {
    id: 'threads',
    name: 'Threads',
    category: 'social',
    aliases: ['threads', 'threads clone', 'meta threads', 'thread app', 'instagram threads'],
    tagline: 'Text-based conversation app from Meta. Like Twitter but tied to Instagram identity.',
    app_name: 'Strands',
    design_theme: 'dark',
    primary_color: 'slate',
    mobile_first: true,
    needs_auth: true,
    views: ['feed', 'search', 'create', 'activity', 'profile'],
    data_collections: [
      { name: 'threads', fields: ['author_id', 'author_name', 'author_handle', 'avatar_url', 'content', 'image_url', 'likes', 'replies_count', 'reposts', 'created_at'] },
      { name: 'profiles', fields: ['user_id', 'name', 'handle', 'bio', 'avatar_url', 'followers', 'verified'] },
    ],
    must_have_features: [
      'Vertical feed of text posts with avatar on left',
      'Reply, repost, like, share buttons under each post',
      'Compose with character limit 500',
      'Reply threading: indented avatar lines connecting parent to children',
    ],
    design_notes: 'Pure black background. Off-white text. NO accent color — extremely minimal. The Threads logo is a stylized "@". Round avatars. Thin avatar-line connectors for threads.',
    key_patterns: `
- Avatar line connector: vertical line from parent avatar down to next avatar (use absolute positioning with a w-px bg-gray-700 div)
- Repost icon: ↻ retweet-style
- Like: heart that fills red
`,
    seed_data_hint: 'Seed 12+ short text posts with casual, conversational tone. Some with replies forming threads.',
    pitfalls: 'Do NOT add card backgrounds. Use border-b separators only. Stay extremely minimal.',
  },

  {
    id: 'mastodon',
    name: 'Mastodon',
    category: 'social',
    aliases: ['mastodon', 'mastodon clone', 'fediverse', 'decentralized social'],
    tagline: 'Decentralized microblogging with multiple timelines (home, local, federated).',
    app_name: 'Federate',
    design_theme: 'dark',
    primary_color: 'violet',
    mobile_first: false,
    needs_auth: true,
    views: ['home', 'local', 'federated', 'profile', 'compose'],
    data_collections: [
      { name: 'toots', fields: ['author_id', 'author_name', 'author_handle', 'avatar_url', 'content', 'image_url', 'boosts', 'favorites', 'replies', 'instance', 'created_at'] },
      { name: 'profiles', fields: ['user_id', 'name', 'handle', 'instance', 'bio', 'avatar_url', 'followers', 'following'] },
    ],
    must_have_features: [
      '3 timeline tabs: Home, Local, Federated',
      'Posts called "toots" (or "posts") with boost (♻) and favorite (⭐) instead of retweet/like',
      'User handles include instance: @user@mastodon.social',
      'Content warnings (CW) toggle',
      'Image upload with alt text',
    ],
    design_notes: 'Dark theme, violet/purple brand color. Multi-column layout on desktop (timeline | sidebar). Profile cards show instance.',
    key_patterns: `
- Boost icon: ♻ (recycle), favorite: ⭐
- Handle format: @{user}@{instance}
- Content warning: hide content behind a "Show more" button if cw is set
`,
    seed_data_hint: 'Seed 15+ toots from varied instances (mastodon.social, fosstodon.org, etc). Mix tech, art, news.',
    pitfalls: 'Do NOT call posts "tweets". Do NOT skip the multi-column timeline structure.',
  },

  // ─── MESSAGING (5) ───────────────────────────────────────────────────────
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    category: 'messaging',
    aliases: ['whatsapp', 'whatsapp clone', 'chat app', 'messaging app', 'message app', 'imessage clone', 'sms app'],
    tagline: 'Encrypted messaging with one-on-one chats, group chats, status, and voice/video buttons.',
    app_name: 'Chatter',
    design_theme: 'light',
    primary_color: 'emerald',
    mobile_first: true,
    needs_auth: true,
    views: ['chats', 'chat_thread', 'status', 'calls', 'profile'],
    data_collections: [
      { name: 'chats', fields: ['user_id', 'contact_id', 'contact_name', 'contact_avatar', 'last_message', 'last_message_time', 'unread_count', 'is_group'] },
      { name: 'messages', fields: ['chat_id', 'sender_id', 'sender_name', 'content', 'image_url', 'status', 'created_at'] },
      { name: 'contacts', fields: ['user_id', 'name', 'phone', 'avatar_url', 'about', 'last_seen'] },
    ],
    must_have_features: [
      'Chats list: avatar | name + last message + time + unread badge',
      'Chat thread: bubbles aligned right (you, green) and left (them, white)',
      'Bubble metadata: time + delivery status (✓, ✓✓, ✓✓ blue)',
      'Input bar at bottom: 😊 + text input + 📎 + 🎤 / send button',
      'Top bar of thread: back arrow + avatar + name + last seen + 📞 📹',
      'Status (stories) tab',
    ],
    design_notes: 'WhatsApp green (#25D366 / #075E54). Light theme (cream/white) with green header. Chat background has subtle pattern (use CSS texture or just light gray). Round avatars. Bubbles have rounded corners with one corner squared (top-left for them, top-right for you).',
    key_patterns: `
- Your bubble: \`bg-emerald-100 self-end rounded-2xl rounded-tr-sm\`
- Their bubble: \`bg-white self-start rounded-2xl rounded-tl-sm shadow-sm\`
- Delivery ticks: ✓ sent, ✓✓ delivered, ✓✓ blue read (use color-blue-500)
- Input bar always at bottom with safe-area padding
- Last message time format: "12:45", "Yesterday", "Mon", or date for older
- Unread count: small green circle with number
`,
    seed_data_hint: 'Seed 8+ contacts with realistic names. Seed 10+ chats with last messages. Seed 30+ messages in 3-4 chat threads with realistic conversations.',
    pitfalls: 'Do NOT use blue/dark theme. Bubbles MUST be aligned correctly (you=right=green). Input bar MUST stick to bottom.',
  },

  {
    id: 'discord',
    name: 'Discord',
    category: 'messaging',
    aliases: ['discord', 'discord clone', 'gaming chat', 'voice chat app', 'community chat', 'server chat'],
    tagline: 'Community chat with servers, channels, voice/text rooms, roles, and rich embeds.',
    app_name: 'Hangout',
    design_theme: 'dark',
    primary_color: 'violet',
    mobile_first: false,
    needs_auth: true,
    views: ['main'],
    data_collections: [
      { name: 'servers', fields: ['name', 'icon_url', 'owner_id', 'member_count'] },
      { name: 'channels', fields: ['server_id', 'name', 'type', 'description'] },
      { name: 'messages', fields: ['channel_id', 'author_id', 'author_name', 'avatar_url', 'role_color', 'content', 'image_url', 'created_at'] },
      { name: 'members', fields: ['server_id', 'user_id', 'username', 'avatar_url', 'role', 'role_color', 'status'] },
    ],
    must_have_features: [
      '3-column layout: server list (left, narrow) | channel list (middle) | chat (right)',
      'Server list: round/squircle icons, hover shows pill indicator on left',
      'Channel list: # text channels and 🔊 voice channels grouped under categories',
      'Message: avatar | username (colored by role) + time | message content',
      'Member list (right sidebar) grouped by role with online/offline status',
      'Message input with placeholder "Message #channel-name"',
    ],
    design_notes: 'Dark theme with the iconic Discord palette: server bar (#202225), channel bar (#2F3136), chat (#36393F), input (#40444B). Blurple accent (#5865F2). Rounded server icons that become squircles on hover. Roles show as colored usernames.',
    key_patterns: `
- Server icon: 48px round, hover transforms to rounded-2xl (squircle) with transition
- Active server: white pill on left side, height 40px
- Username color from role: \`<span style={{ color: msg.role_color }}>\`
- Channel hover: light gray background, # icon
- Status dot: green (online), yellow (idle), red (DND), gray (offline)
`,
    seed_data_hint: 'Seed 4-5 servers (Gaming, Coding, Art, Music). Each with 5-8 channels. Seed 30+ messages in #general with mixed users, roles, embeds, mentions.',
    pitfalls: 'Do NOT collapse the 3-column layout on desktop. Do NOT skip the server pill indicator. Use Blurple, NOT indigo.',
  },

  {
    id: 'slack',
    name: 'Slack',
    category: 'messaging',
    aliases: ['slack', 'slack clone', 'team chat', 'workspace chat', 'business chat', 'team messaging'],
    tagline: 'Team communication with channels, threads, DMs, and integrations.',
    app_name: 'Convo',
    design_theme: 'light',
    primary_color: 'violet',
    mobile_first: false,
    needs_auth: true,
    views: ['main'],
    data_collections: [
      { name: 'channels', fields: ['name', 'description', 'is_private', 'member_count', 'topic'] },
      { name: 'messages', fields: ['channel_id', 'thread_id', 'author_id', 'author_name', 'avatar_url', 'content', 'reactions', 'created_at'] },
      { name: 'users', fields: ['name', 'username', 'avatar_url', 'status', 'title'] },
      { name: 'dms', fields: ['user_id', 'other_user_id', 'last_message', 'last_message_time'] },
    ],
    must_have_features: [
      '2-column layout: sidebar (channels + DMs) | main chat',
      'Channels prefixed with # or 🔒 (private)',
      'Messages grouped by author (consecutive messages don\'t repeat avatar)',
      'Reactions (thumbs up, etc.) shown as pills with counts under messages',
      'Threads: "X replies" link opens side panel',
      'Workspace switcher in top-left corner',
    ],
    design_notes: 'Sidebar: dark aubergine purple (#3F0E40). Main chat area: white. Slack purple (#611F69) for accents. Avatars are rounded squares (rounded-md, NOT round). Sans-serif Lato-style.',
    key_patterns: `
- Sidebar: dark purple bg with white-ish text, indented channel list
- Avatars: \`rounded-md\` (squircle), 36px
- Reaction pills: \`bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5 text-xs\`
- Message grouping: only show avatar+name on first message of a streak from same author
- Thread reply link: small blue text with reply count
`,
    seed_data_hint: 'Seed 8+ channels (#general, #random, #design, #engineering). Seed 30+ messages with reactions and threads. Seed 6+ users with status emojis.',
    pitfalls: 'Do NOT use round avatars — they should be rounded squares. Do NOT use light sidebar. Sidebar MUST be dark aubergine.',
  },

  {
    id: 'telegram',
    name: 'Telegram',
    category: 'messaging',
    aliases: ['telegram', 'telegram clone', 'tg clone', 'channel chat'],
    tagline: 'Cloud messaging with chats, channels, bots, and large group chats.',
    app_name: 'Beam',
    design_theme: 'light',
    primary_color: 'sky',
    mobile_first: true,
    needs_auth: true,
    views: ['chats', 'chat_thread', 'channels', 'profile'],
    data_collections: [
      { name: 'chats', fields: ['user_id', 'contact_name', 'contact_avatar', 'is_channel', 'is_group', 'last_message', 'last_message_time', 'unread_count'] },
      { name: 'messages', fields: ['chat_id', 'sender_id', 'sender_name', 'content', 'image_url', 'reactions', 'created_at'] },
    ],
    must_have_features: [
      'Chat list with avatar, name, preview, time, unread badge',
      'Chat thread with bubbles (right=you, left=them)',
      'Telegram blue (lighter than WhatsApp green)',
      'Channels with subscriber count instead of last seen',
    ],
    design_notes: 'Telegram blue (#0088CC). Lighter and cleaner than WhatsApp. Round avatars. Bubble corners more uniform than WhatsApp.',
    key_patterns: `
- Your bubble: \`bg-sky-100 self-end\`
- Their bubble: \`bg-white border\`
- Channel badge: 📢 emoji prefix
`,
    seed_data_hint: 'Seed 8+ chats including 2-3 channels and 2-3 group chats.',
    pitfalls: 'Do NOT confuse with WhatsApp green — use blue.',
  },

  {
    id: 'zoom',
    name: 'Zoom',
    category: 'messaging',
    aliases: ['zoom', 'zoom clone', 'video conferencing', 'video meeting app', 'video call app'],
    tagline: 'Video conferencing app with meeting rooms, participant grid, and chat.',
    app_name: 'Meetly',
    design_theme: 'dark',
    primary_color: 'sky',
    mobile_first: false,
    needs_auth: true,
    views: ['home', 'meeting', 'schedule', 'contacts'],
    data_collections: [
      { name: 'meetings', fields: ['host_id', 'title', 'meeting_id', 'scheduled_at', 'duration', 'participants_count', 'recording_url'] },
      { name: 'participants', fields: ['meeting_id', 'user_id', 'name', 'avatar_url', 'is_muted', 'is_video_on', 'is_host'] },
    ],
    must_have_features: [
      'Home page: big buttons "New Meeting", "Join", "Schedule", "Share Screen"',
      'Meeting room: grid of participant tiles (each shows name + mute icon)',
      'Bottom toolbar: 🎤 Mute | 📹 Stop Video | 🖥 Share | 💬 Chat | 👥 Participants | 🛑 End',
      'Use placeholder gradients or avatars for "video"',
    ],
    design_notes: 'Dark gray background (#1C1C1E). Sky blue accents. Participant tiles are rounded with hover border highlight.',
    key_patterns: `
- Participant grid: \`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2\` of \`aspect-video\` cards
- Each tile: gradient background or avatar-large with name overlay and mute indicator
- Toolbar: fixed bottom bar with rounded buttons
`,
    seed_data_hint: 'Seed 6+ scheduled meetings with realistic titles ("Daily Standup", "Q1 Review"). Seed 8+ participants for the active meeting.',
    pitfalls: 'Do NOT try to actually capture video. Use placeholder gradients/avatars.',
  },

  // ─── DATING (3) ──────────────────────────────────────────────────────────
  {
    id: 'tinder',
    name: 'Tinder',
    category: 'dating',
    aliases: ['tinder', 'tinder clone', 'swipe dating', 'dating app', 'swipe app', 'hookup app', 'match app'],
    tagline: 'Swipe-based dating app where users see profile cards, swipe right to like or left to pass, and chat after matching.',
    app_name: 'Spark',
    design_theme: 'light',
    primary_color: 'rose',
    mobile_first: true,
    needs_auth: true,
    views: ['discover', 'matches', 'chats', 'profile'],
    data_collections: [
      { name: 'profiles', fields: ['user_id', 'name', 'age', 'bio', 'photos', 'occupation', 'location', 'distance_miles', 'interests'] },
      { name: 'swipes', fields: ['swiper_id', 'swiped_id', 'direction', 'created_at'] },
      { name: 'matches', fields: ['user_a_id', 'user_b_id', 'matched_at', 'last_message', 'last_message_at'] },
      { name: 'messages', fields: ['match_id', 'sender_id', 'content', 'created_at'] },
    ],
    must_have_features: [
      'Card stack: full-bleed photo + name, age, distance overlay',
      'Drag card left/right with rotation, swipe gestures',
      'Buttons below: undo (yellow ↩), nope (red ✕), super-like (blue ★), like (green ♥), boost (purple ⚡)',
      'Match modal: full screen "It\'s a Match!" with both photos and "Send Message" button',
      'Matches view: row of new matches at top + list of conversations',
      'Profile detail: scrollable photos, bio, interests, distance, occupation',
      'Chat view: standard message bubbles after matching',
    ],
    design_notes: 'White background. Tinder gradient (orange-to-pink: from-orange-500 to-rose-500). Cards have heavy rounded corners (rounded-3xl) and shadow. Photos take up 70% of the card. Action buttons are large round circles with colored icons.',
    key_patterns: `
- Card stack: render top 3 cards stacked, only top is draggable
- Drag with React state: track dragX, dragY, compute rotation = dragX * 0.05
- Tinder card style: \`absolute inset-0 rounded-3xl shadow-xl overflow-hidden\` with photo background and gradient overlay at bottom for text
- Like indicator: when dragX > 50, show big green "LIKE" stamp rotated -20deg in top-left
- Nope indicator: when dragX < -50, show big red "NOPE" stamp rotated 20deg in top-right
- On release: if |dragX| > 100, animate off-screen and trigger match check
- Match check: 30% chance of match for demo (or always match for the most attractive seed profile)
- Match modal: full-screen dark overlay, two profile photos side by side with hearts between, "It's a Match!" text in pink gradient
- Touch events: onTouchStart/Move/End for mobile, onMouseDown/Move/Up for desktop
\`\`\`tsx
const [dragX, setDragX] = useState(0);
const [dragging, setDragging] = useState(false);
const startX = useRef(0);
function onStart(e) { setDragging(true); startX.current = e.clientX || e.touches[0].clientX; }
function onMove(e) {
  if (!dragging) return;
  const x = e.clientX || e.touches[0].clientX;
  setDragX(x - startX.current);
}
function onEnd() {
  setDragging(false);
  if (dragX > 100) handleSwipe('right');
  else if (dragX < -100) handleSwipe('left');
  setDragX(0);
}
\`\`\`
`,
    seed_data_hint: 'Seed 15+ realistic profiles with diverse names, ages 22-35, interesting bios, occupations, and Unsplash portrait photos. Mix of interests (hiking, cooking, music, travel). Some should auto-match for demo magic.',
    pitfalls: 'Do NOT skip the drag gesture — the swipe IS the app. Do NOT use a grid of profiles. Do NOT skip the match modal — it\'s the dopamine hit. The card MUST rotate as you drag.',
  },

  {
    id: 'bumble',
    name: 'Bumble',
    category: 'dating',
    aliases: ['bumble', 'bumble clone', 'women first dating', 'feminist dating app'],
    tagline: 'Swipe-based dating where women message first within 24 hours of matching.',
    app_name: 'Buzz',
    design_theme: 'light',
    primary_color: 'amber',
    mobile_first: true,
    needs_auth: true,
    views: ['discover', 'matches', 'chats', 'profile'],
    data_collections: [
      { name: 'profiles', fields: ['user_id', 'name', 'age', 'bio', 'photos', 'occupation', 'gender', 'distance_miles'] },
      { name: 'matches', fields: ['user_a_id', 'user_b_id', 'matched_at', 'expires_at', 'first_message_sent'] },
      { name: 'messages', fields: ['match_id', 'sender_id', 'content', 'created_at'] },
    ],
    must_have_features: [
      'Same swipe deck as Tinder',
      'Honeycomb hexagonal profile elements (use rotated squares or SVG)',
      'After match: 24-hour countdown until match expires',
      'Only women can send the first message',
    ],
    design_notes: 'Bumble yellow (#FFC629). White background. Hexagonal motifs. Honeycomb avatar borders.',
    key_patterns: `
- Hexagon avatar: use clip-path \`clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)\`
- Match countdown: format remaining time as "23h 45m"
`,
    seed_data_hint: 'Seed 12+ profiles with the Bumble vibe (more polished/professional than Tinder).',
    pitfalls: 'Do NOT skip the yellow color or hexagonal motif — these define Bumble visually.',
  },

  {
    id: 'hinge',
    name: 'Hinge',
    category: 'dating',
    aliases: ['hinge', 'hinge clone', 'serious dating app', 'relationship dating'],
    tagline: 'Dating app designed to be deleted — focus on prompts, photos, and meaningful matches.',
    app_name: 'Anchor',
    design_theme: 'light',
    primary_color: 'violet',
    mobile_first: true,
    needs_auth: true,
    views: ['discover', 'standouts', 'likes_you', 'matches', 'profile'],
    data_collections: [
      { name: 'profiles', fields: ['user_id', 'name', 'age', 'photos', 'prompts', 'job', 'school', 'height', 'distance_miles'] },
      { name: 'likes', fields: ['liker_id', 'liked_id', 'comment', 'target_type', 'target_id', 'created_at'] },
      { name: 'matches', fields: ['user_a_id', 'user_b_id', 'matched_at'] },
      { name: 'messages', fields: ['match_id', 'sender_id', 'content', 'created_at'] },
    ],
    must_have_features: [
      'Vertical scroll profile (NOT a card stack) — photos and prompts stacked',
      'Like a SPECIFIC photo or prompt (not the whole profile) by tapping a heart icon next to it',
      'Add a comment when liking',
      '"Likes You" tab shows who liked you',
      'Prompts: "My ideal Sunday is..." with the user\'s answer below',
    ],
    design_notes: 'Light theme, off-white background. Hinge purple/wine accent. Serif headline font (or stylized sans). Tall, scrollable cards.',
    key_patterns: `
- Profile is a scroll, not a swipe — use a vertical column with photos and prompts interleaved
- Each photo/prompt has a small heart button in the bottom-right corner to like that specific item
- Tap heart → modal appears asking for a comment, then sends the like
`,
    seed_data_hint: 'Seed 10+ profiles with thoughtful prompts and 4-6 photos each. Prompts like "Two truths and a lie", "My most controversial opinion".',
    pitfalls: 'Do NOT make this a swipe deck — it MUST be vertical scroll. Likes target specific photos/prompts, not whole profiles.',
  },

  // ─── ENTERTAINMENT (5) ────────────────────────────────────────────────────
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'entertainment',
    aliases: ['youtube', 'youtube clone', 'video sharing', 'video platform', 'video streaming site'],
    tagline: 'Video sharing platform with feed, watch page, channels, and comments.',
    app_name: 'Watchly',
    design_theme: 'light',
    primary_color: 'rose',
    mobile_first: false,
    needs_auth: true,
    views: ['home', 'watch', 'channel', 'subscriptions', 'library'],
    data_collections: [
      { name: 'videos', fields: ['channel_id', 'channel_name', 'channel_avatar', 'title', 'thumbnail_url', 'duration', 'views', 'likes', 'created_at', 'description'] },
      { name: 'channels', fields: ['name', 'avatar_url', 'banner_url', 'subscribers', 'verified'] },
      { name: 'comments', fields: ['video_id', 'author_name', 'avatar_url', 'content', 'likes', 'created_at'] },
    ],
    must_have_features: [
      'Home: grid of video cards with thumbnail, title, channel, views, time-ago',
      'Sidebar: Home, Shorts, Subscriptions, Library, History + Subscriptions list',
      'Watch page: large video placeholder, title, channel info with Subscribe button, like/dislike, description, comments',
      'Channel page: banner, avatar, subscriber count, video grid',
      'Search bar in top header',
    ],
    design_notes: 'White background, dark text. YouTube red (#FF0000) for play button and brand. Round channel avatars. Thumbnails are 16:9 with rounded corners (rounded-xl). Duration badge in bottom-right of thumbnail.',
    key_patterns: `
- Video card: \`<div className="aspect-video rounded-xl overflow-hidden">\` with image, then row with avatar (left) + title (bold) + channel + views · time
- Duration: \`<span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 rounded">10:42</span>\`
- View count format: 1234 → "1.2K views", 1500000 → "1.5M views"
- Time-ago: "3 days ago", "2 weeks ago"
- Subscribe button: red, becomes gray "Subscribed" when clicked
`,
    seed_data_hint: 'Seed 20+ videos with realistic titles ("How I Built X in 24 Hours", "TOP 10 ..."). Seed 6-8 channels with varied subscriber counts. Use Unsplash for thumbnails.',
    pitfalls: 'Do NOT skip the sidebar. Video cards MUST have duration overlays. Use red, NOT indigo.',
  },

  {
    id: 'netflix',
    name: 'Netflix',
    category: 'entertainment',
    aliases: ['netflix', 'netflix clone', 'streaming service', 'movie streaming', 'tv streaming app', 'movies app'],
    tagline: 'Movie/TV streaming with browse rows, hero billboard, watch detail, and "My List".',
    app_name: 'Streamly',
    design_theme: 'dark',
    primary_color: 'rose',
    mobile_first: false,
    needs_auth: true,
    views: ['browse', 'detail', 'search', 'my_list', 'profiles'],
    data_collections: [
      { name: 'titles', fields: ['title', 'description', 'poster_url', 'backdrop_url', 'year', 'rating', 'genres', 'duration', 'is_series', 'episodes_count'] },
      { name: 'my_list', fields: ['user_id', 'title_id', 'added_at'] },
      { name: 'profiles', fields: ['user_id', 'name', 'avatar_url', 'is_kid'] },
    ],
    must_have_features: [
      'Hero billboard: huge backdrop image with title, description, ▶ Play, + My List buttons',
      'Multiple horizontal rows: "Trending Now", "New Releases", "Top 10 in Your Country", "Because You Watched X", etc.',
      'Each row scrolls horizontally with poster cards',
      'Hover poster → expand with details and play button',
      'Detail modal: backdrop + title + description + cast + episode list (for series)',
      'Profile picker on initial load',
    ],
    design_notes: 'Pure black background. White text. Netflix red (#E50914). Bold sans-serif (Helvetica-style). Posters are 2:3 aspect ratio. Headers above rows in white. Smooth horizontal scroll.',
    key_patterns: `
- Hero: \`relative h-[80vh]\` with backdrop image as background and gradient overlay (\`from-black via-transparent to-transparent\`)
- Row: \`<div className="flex gap-2 overflow-x-auto pb-4">\` with each poster \`flex-shrink-0 w-48\`
- Poster card: \`aspect-[2/3] rounded\` with image + hover scale-110 transition
- Top 10 row: large numbers (1-10) overlaid behind each poster
- Genre pills below title in detail view
`,
    seed_data_hint: 'Seed 30+ titles across rows. Use Unsplash for movie posters. Mix movies and series. Use real-feeling titles like "The Last Frontier", "Echoes of Tomorrow". Genres: Drama, Comedy, Sci-Fi, Documentary, Action.',
    pitfalls: 'Do NOT use light theme. Hero billboard is REQUIRED. Rows MUST scroll horizontally. Use red, never indigo.',
  },

  {
    id: 'spotify',
    name: 'Spotify',
    category: 'entertainment',
    aliases: ['spotify', 'spotify clone', 'music streaming', 'music app', 'music player', 'playlist app', 'songs app'],
    tagline: 'Music streaming with playlists, albums, artists, search, and a sticky now-playing bar.',
    app_name: 'Tunely',
    design_theme: 'dark',
    primary_color: 'emerald',
    mobile_first: false,
    needs_auth: true,
    views: ['home', 'search', 'library', 'playlist', 'album'],
    data_collections: [
      { name: 'tracks', fields: ['title', 'artist', 'album', 'cover_url', 'duration_seconds', 'plays', 'preview_url'] },
      { name: 'playlists', fields: ['name', 'description', 'cover_url', 'creator', 'track_count', 'created_at'] },
      { name: 'albums', fields: ['title', 'artist', 'cover_url', 'year', 'track_count'] },
      { name: 'artists', fields: ['name', 'image_url', 'monthly_listeners', 'genres'] },
    ],
    must_have_features: [
      '3-column layout: sidebar | main content | now-playing (or fixed bottom bar)',
      'Sidebar: Home, Search, Library + your playlists list',
      'Home: rows of "Made For You", "Recently Played", "Your Top Mixes"',
      'Playlist view: large cover + name + creator + track list with #, title, artist, album, duration',
      'Now-playing bar: cover + title + artist on left, play controls in center, volume on right',
      'Play button: green circle with ▶ that turns to ⏸ when playing',
    ],
    design_notes: 'Pure black background (#000) with off-black sidebars (#121212). White text. Spotify green (#1DB954). Round cards become squares for albums/playlists. Rounded buttons. Sans-serif. NEVER use indigo.',
    key_patterns: `
- Now playing bar: \`fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 h-20 flex items-center px-4\`
- Play button: \`bg-emerald-500 rounded-full w-12 h-12 flex items-center justify-center hover:scale-105\`
- Track row: hover bg-white/10, # on left changes to play icon on hover
- Duration format: "3:42"
- Use real Unsplash music/album cover images
- Playlist card: square cover, title bold, description gray small text
`,
    seed_data_hint: 'Seed 30+ tracks with realistic song/artist names. Seed 8+ playlists ("Discover Weekly", "Liked Songs", "Chill Vibes"). Seed 6+ albums.',
    pitfalls: 'Do NOT use indigo or sky blue. The accent MUST be Spotify green. Sidebar MUST be present on desktop. Now-playing bar MUST be sticky at bottom.',
  },

  {
    id: 'twitch',
    name: 'Twitch',
    category: 'entertainment',
    aliases: ['twitch', 'twitch clone', 'live streaming', 'game streaming', 'streamer app'],
    tagline: 'Live game streaming with channels, chat, categories, and follower system.',
    app_name: 'Streamr',
    design_theme: 'dark',
    primary_color: 'violet',
    mobile_first: false,
    needs_auth: true,
    views: ['browse', 'stream', 'category', 'following', 'profile'],
    data_collections: [
      { name: 'streams', fields: ['streamer_id', 'streamer_name', 'avatar_url', 'title', 'category', 'thumbnail_url', 'viewer_count', 'is_live', 'started_at'] },
      { name: 'categories', fields: ['name', 'box_art_url', 'viewer_count', 'tags'] },
      { name: 'chat_messages', fields: ['stream_id', 'username', 'username_color', 'content', 'created_at'] },
    ],
    must_have_features: [
      '3-column layout: sidebar (followed channels) | main content | (chat on stream pages)',
      'Browse page: featured carousel + live channels grid with thumbnails',
      'Stream page: video placeholder | live chat (right sidebar)',
      'Live indicator: red dot + "LIVE" + viewer count',
      'Channel cards show thumbnail, streamer avatar overlay, title, game, viewers',
      'Chat bubbles with colored usernames',
    ],
    design_notes: 'Twitch purple (#9146FF). Dark theme (#0E0E10 background). Sidebar #18181B. Bold sans-serif. Live indicators are bright red.',
    key_patterns: `
- LIVE badge: \`bg-red-600 text-white text-xs px-1.5 py-0.5 rounded font-bold\`
- Viewer count with red dot: 🔴 1.2K viewers
- Stream card: \`aspect-video rounded\` thumbnail with live badge top-left and viewers bottom-left
- Chat colors: random bright colors per user (use a hash of username)
`,
    seed_data_hint: 'Seed 15+ live streams across categories (Just Chatting, Valorant, League of Legends, Art, Music). Seed 8+ categories with viewer counts.',
    pitfalls: 'Do NOT use indigo. Use Twitch purple. Live indicators MUST be visually prominent.',
  },

  {
    id: 'soundcloud',
    name: 'SoundCloud',
    category: 'entertainment',
    aliases: ['soundcloud', 'soundcloud clone', 'audio sharing', 'podcast app', 'audio uploader'],
    tagline: 'Audio sharing platform with waveforms, comments at timestamps, and creator profiles.',
    app_name: 'Wavely',
    design_theme: 'light',
    primary_color: 'orange',
    mobile_first: false,
    needs_auth: true,
    views: ['feed', 'discover', 'upload', 'profile', 'track'],
    data_collections: [
      { name: 'tracks', fields: ['user_id', 'user_name', 'title', 'genre', 'cover_url', 'duration_seconds', 'plays', 'likes', 'created_at'] },
      { name: 'comments', fields: ['track_id', 'user_name', 'content', 'timestamp_seconds', 'created_at'] },
      { name: 'profiles', fields: ['user_id', 'name', 'bio', 'avatar_url', 'followers'] },
    ],
    must_have_features: [
      'Track card: cover (left, square) + title/artist + waveform + play button',
      'Waveform: SVG bars or div blocks with varying heights',
      'Comments at timestamps shown on waveform as small avatars',
      'Like, repost, share, comment buttons',
    ],
    design_notes: 'White background. SoundCloud orange (#FF5500). Sans-serif. Waveforms are central to the experience.',
    key_patterns: `
- Waveform: render 80 bars with random heights between 20%-100%, color the played portion orange
\`\`\`tsx
<div className="flex items-end gap-px h-12">
  {Array.from({ length: 80 }).map((_, i) => (
    <div key={i} className={\`w-1 \${i < playedBars ? 'bg-orange-500' : 'bg-gray-300'}\`} style={{ height: \`\${20 + (Math.sin(i) + 1) * 40}%\` }} />
  ))}
</div>
\`\`\`
`,
    seed_data_hint: 'Seed 15+ tracks across genres (Hip Hop, Electronic, Indie, Lo-Fi, Podcast).',
    pitfalls: 'Do NOT skip the waveform — it\'s the visual signature of SoundCloud.',
  },

  // ─── E-COMMERCE (5) ──────────────────────────────────────────────────────
  {
    id: 'amazon',
    name: 'Amazon',
    category: 'ecommerce',
    aliases: ['amazon', 'amazon clone', 'online store', 'ecommerce site', 'shopping site', 'web store'],
    tagline: 'General-purpose online store with product grid, search, cart, and checkout.',
    app_name: 'Shoply',
    design_theme: 'light',
    primary_color: 'amber',
    mobile_first: false,
    needs_auth: false,
    views: ['home', 'category', 'product', 'cart', 'checkout'],
    data_collections: [
      { name: 'products', fields: ['name', 'description', 'price', 'image_url', 'category', 'rating', 'reviews_count', 'stock', 'is_prime'] },
      { name: 'cart_items', fields: ['user_id', 'product_id', 'quantity', 'added_at'] },
      { name: 'orders', fields: ['user_id', 'items', 'total', 'status', 'created_at'] },
    ],
    must_have_features: [
      'Top header: logo, search bar, location, account, cart icon with count',
      'Category sidebar or top nav',
      'Product grid: image, title, rating stars + count, price, prime badge',
      'Product detail: large image, title, rating, price, "Add to Cart", "Buy Now", description',
      'Cart: list of items with quantity adjusters, subtotal, "Proceed to Checkout"',
      'Star ratings (★★★★☆) with review count',
    ],
    design_notes: 'White background. Amazon dark navy header (#131921) with orange accents. Yellow/orange "Add to Cart" buttons. Information-dense layout. NOT minimal.',
    key_patterns: `
- Star rating: render 5 stars, fill yellow based on rating
- Price: large bold "$24.99" with smaller "Free shipping" text below
- Add to Cart: \`bg-amber-400 hover:bg-amber-500 rounded-lg\`
- Cart count badge: small orange circle on cart icon
`,
    seed_data_hint: 'Seed 40+ products across categories (Electronics, Books, Home, Fashion, Toys). Use Unsplash product photos. Realistic prices and ratings.',
    pitfalls: 'Do NOT make it minimal. Amazon is dense. Header MUST be dark navy.',
  },

  {
    id: 'etsy',
    name: 'Etsy',
    category: 'ecommerce',
    aliases: ['etsy', 'etsy clone', 'handmade marketplace', 'craft marketplace', 'vintage shop'],
    tagline: 'Marketplace for handmade and vintage goods with sellers, shops, and reviews.',
    app_name: 'Crafty',
    design_theme: 'light',
    primary_color: 'orange',
    mobile_first: false,
    needs_auth: false,
    views: ['home', 'category', 'product', 'shop', 'cart'],
    data_collections: [
      { name: 'products', fields: ['name', 'shop_name', 'shop_id', 'price', 'image_url', 'category', 'is_handmade', 'is_vintage', 'rating', 'reviews_count'] },
      { name: 'shops', fields: ['name', 'description', 'banner_url', 'avatar_url', 'location', 'sales_count', 'rating'] },
    ],
    must_have_features: [
      'Warm, crafty visual style',
      'Featured shops section',
      'Category browsing (Jewelry, Home Decor, Art, Clothing)',
      'Shop pages with banner and product list',
      '"Handmade" and "Vintage" badges',
    ],
    design_notes: 'Cream/beige background. Etsy orange (#F45800). Serif headlines, friendly sans body. Warm tones. Round shop avatars.',
    key_patterns: `
- Product card with shop name as small text below price
- Heart icon on product cards for favoriting
`,
    seed_data_hint: 'Seed 30+ handmade products: jewelry, candles, ceramics, art prints. 6-8 shop names with personalities.',
    pitfalls: 'Do NOT use Amazon\'s dense layout. Etsy is warmer and more curated.',
  },

  {
    id: 'ebay',
    name: 'eBay',
    category: 'ecommerce',
    aliases: ['ebay', 'ebay clone', 'auction site', 'bid app', 'auction marketplace'],
    tagline: 'Auction-based marketplace with bids, "Buy It Now", time-remaining counters, and seller ratings.',
    app_name: 'Bidly',
    design_theme: 'light',
    primary_color: 'sky',
    mobile_first: false,
    needs_auth: true,
    views: ['home', 'listing', 'sell', 'my_bids', 'cart'],
    data_collections: [
      { name: 'listings', fields: ['title', 'description', 'image_url', 'current_bid', 'buy_it_now_price', 'bid_count', 'ends_at', 'seller_name', 'seller_rating', 'condition'] },
      { name: 'bids', fields: ['listing_id', 'bidder_name', 'amount', 'created_at'] },
    ],
    must_have_features: [
      'Listing card: image, title, current bid, time remaining, bid count',
      'Detail page: full image gallery, current bid, "Place Bid" + "Buy It Now"',
      'Bid history',
      'Time remaining countdown (live ticking down)',
      'Seller info with rating and feedback %',
    ],
    design_notes: 'White background. eBay multi-color logo. Sky blue accents. Clean, slightly dated.',
    key_patterns: `
- Time remaining: format as "2d 4h", "3h 15m", "45m 12s", red when < 1h
- Bid input: validate that new bid > current bid
- "Buy It Now" button is green
`,
    seed_data_hint: 'Seed 20+ varied listings (collectibles, electronics, vintage). Mix of auction-only and BIN.',
    pitfalls: 'Do NOT skip the countdown timers — auctions are about urgency.',
  },

  {
    id: 'shopify',
    name: 'Shopify Storefront',
    category: 'ecommerce',
    aliases: ['shopify', 'shopify store', 'online boutique', 'ecommerce storefront', 'product store'],
    tagline: 'Branded storefront for a single shop with product grid, cart, and checkout.',
    app_name: 'Storefront',
    design_theme: 'minimal',
    primary_color: 'slate',
    mobile_first: false,
    needs_auth: false,
    views: ['home', 'shop', 'product', 'cart', 'checkout'],
    data_collections: [
      { name: 'products', fields: ['name', 'description', 'price', 'image_url', 'images', 'collection', 'in_stock', 'variants'] },
      { name: 'collections', fields: ['name', 'description', 'cover_image'] },
      { name: 'cart_items', fields: ['user_id', 'product_id', 'variant', 'quantity'] },
    ],
    must_have_features: [
      'Hero with brand statement and shop CTA',
      'Featured collection grid',
      'Product grid with hover state',
      'Product detail with variant selectors (size, color), quantity, "Add to Cart"',
      'Slide-out cart panel from right',
      'Clean, brand-forward design',
    ],
    design_notes: 'Minimal, fashion-mag aesthetic. Lots of white space. Big photography. Clean serif or geometric sans. No clutter.',
    key_patterns: `
- Hero: full-bleed image with overlay text and CTA button
- Cart drawer: \`fixed right-0 top-0 bottom-0 w-96 bg-white shadow-xl\` slides in
- Variant pills: color swatches and size buttons
`,
    seed_data_hint: 'Pick a niche (clothing, skincare, coffee). Seed 12+ products with editorial photos and minimal copy.',
    pitfalls: 'Do NOT make it dense. Shopify storefronts are minimal and brand-forward.',
  },

  {
    id: 'depop',
    name: 'Depop',
    category: 'ecommerce',
    aliases: ['depop', 'depop clone', 'thrift app', 'secondhand fashion', 'used clothing app'],
    tagline: 'Secondhand fashion marketplace with social-feed-style browsing and seller profiles.',
    app_name: 'Threadly',
    design_theme: 'light',
    primary_color: 'rose',
    mobile_first: true,
    needs_auth: true,
    views: ['feed', 'item', 'seller', 'sell', 'profile'],
    data_collections: [
      { name: 'items', fields: ['seller_id', 'seller_name', 'title', 'description', 'price', 'image_url', 'size', 'brand', 'condition', 'likes', 'created_at'] },
      { name: 'sellers', fields: ['user_id', 'name', 'username', 'avatar_url', 'rating', 'sales_count'] },
    ],
    must_have_features: [
      '2 or 3 column grid of square product photos (Instagram-style)',
      'Heart to favorite, share, message seller',
      'Seller profile with bio + grid of their items',
      'Item detail with carousel of photos, price, description, size, condition, "Buy Now" + "Make Offer"',
    ],
    design_notes: 'White background. Bright pink Depop accents. Square photos, mobile-first. Gen Z aesthetic.',
    key_patterns: `
- Square grid: \`grid grid-cols-2 sm:grid-cols-3 gap-1\`
- Heart in top-right of each product, fills red when liked
`,
    seed_data_hint: 'Seed 30+ vintage/streetwear items with edgy photos. Realistic Gen Z usernames.',
    pitfalls: 'Do NOT use a corporate/Amazon look. This is mobile-first and youth-focused.',
  },

  // ─── PRODUCTIVITY (5) ────────────────────────────────────────────────────
  {
    id: 'notion',
    name: 'Notion',
    category: 'productivity',
    aliases: ['notion', 'notion clone', 'wiki app', 'docs and database', 'workspace app', 'notes and database'],
    tagline: 'Block-based workspace for docs, wikis, and databases with nested pages.',
    app_name: 'Workspace',
    design_theme: 'light',
    primary_color: 'slate',
    mobile_first: false,
    needs_auth: true,
    views: ['main'],
    data_collections: [
      { name: 'pages', fields: ['parent_id', 'title', 'icon', 'cover_url', 'content', 'created_at', 'updated_at'] },
      { name: 'blocks', fields: ['page_id', 'type', 'content', 'order'] },
    ],
    must_have_features: [
      '2-column layout: sidebar (page tree) | editor',
      'Nested pages (drill in/out)',
      'Block-based editor: text, headings, bullet lists, todo, callout, code',
      'Page header with optional cover image and emoji icon',
      '"+ Add a page" in sidebar',
      'Slash command menu (/ to insert blocks)',
    ],
    design_notes: 'White background, very minimal. Off-white sidebar. Black/dark gray text. Subtle gray hover states. Sans-serif (system or Inter). Lots of whitespace.',
    key_patterns: `
- Page tree: indent nested pages by depth, ▶ collapse arrow
- Block hover: ⋮⋮ drag handle appears on left
- Slash command: textbox with "/" detection that opens a dropdown of block types
- Cover image: full-width banner above title
- Emoji icon: large emoji above title, click to change
`,
    seed_data_hint: 'Seed a workspace with 5-8 pages: "Welcome", "Roadmap", "Meeting Notes", "Personal Goals". Each with mixed block content.',
    pitfalls: 'Do NOT use heavy borders or shadows. Notion is extremely minimal.',
  },

  {
    id: 'trello',
    name: 'Trello',
    category: 'productivity',
    aliases: ['trello', 'trello clone', 'kanban', 'kanban board', 'task board', 'card board', 'kanban app'],
    tagline: 'Kanban boards with lists and draggable cards.',
    app_name: 'Boardly',
    design_theme: 'colorful',
    primary_color: 'sky',
    mobile_first: false,
    needs_auth: true,
    views: ['boards', 'board'],
    data_collections: [
      { name: 'boards', fields: ['name', 'background_color', 'created_at'] },
      { name: 'lists', fields: ['board_id', 'name', 'order'] },
      { name: 'cards', fields: ['list_id', 'title', 'description', 'labels', 'due_date', 'order', 'created_at'] },
    ],
    must_have_features: [
      'Boards page: grid of board thumbnails with colored backgrounds',
      'Board view: horizontal scrolling lists',
      'Each list contains stacked cards',
      'Drag-and-drop cards between lists',
      'Card click → modal with description, labels, due date',
      '+ Add card / + Add list',
    ],
    design_notes: 'Colorful board backgrounds (gradient or solid). Each list is a translucent white card. Card text is clean. Trello blue brand.',
    key_patterns: `
- Board background: full-screen gradient or color
- List: \`bg-gray-100 rounded-xl w-72 p-2 flex-shrink-0\`
- Card: \`bg-white rounded-md p-3 shadow-sm cursor-grab\`
- Drag-and-drop: use HTML5 draggable={true} with onDragStart/onDrop handlers
- Add card: inline textarea that appears below the list when "+ Add a card" is clicked
`,
    seed_data_hint: 'Seed a "Project Roadmap" board with lists: To Do, In Progress, Review, Done. 8-12 cards distributed.',
    pitfalls: 'Drag-and-drop is essential. Lists MUST scroll horizontally on overflow.',
  },

  {
    id: 'linear',
    name: 'Linear',
    category: 'productivity',
    aliases: ['linear', 'linear clone', 'issue tracker', 'bug tracker', 'project management tool', 'engineering tickets'],
    tagline: 'Sleek issue tracker with keyboard-first design, projects, and cycles.',
    app_name: 'Tracker',
    design_theme: 'dark',
    primary_color: 'violet',
    mobile_first: false,
    needs_auth: true,
    views: ['inbox', 'my_issues', 'all_issues', 'project', 'issue'],
    data_collections: [
      { name: 'issues', fields: ['identifier', 'title', 'description', 'status', 'priority', 'assignee_id', 'assignee_name', 'project_id', 'labels', 'created_at'] },
      { name: 'projects', fields: ['name', 'description', 'icon', 'color', 'lead', 'progress'] },
      { name: 'users', fields: ['name', 'avatar_url'] },
    ],
    must_have_features: [
      '3-column layout: sidebar | issue list | (issue detail panel optional)',
      'Issue rows: ID (LIN-123) + status icon + priority + title + assignee avatar + due date',
      'Status icons: backlog, todo, in progress (pie), done, canceled',
      'Keyboard shortcuts hint: "C to create, / to search"',
      'Filter by status, priority, assignee, project',
    ],
    design_notes: 'Pure black or near-black background. Minimal. Very tight spacing. Sans-serif Inter-like. Linear violet (#5E6AD2). Subtle borders only. Monospace for issue IDs.',
    key_patterns: `
- Status icons as colored circles or pie charts
- Priority: 0-4 with icons (urgent=red, high=orange, etc.)
- Issue ID: monospace, format like "LIN-123"
- Hover row: subtle bg-white/5
`,
    seed_data_hint: 'Seed 25+ realistic issues with engineering titles. 4-5 projects. 6+ users.',
    pitfalls: 'Do NOT make it heavy. Linear is the most minimal possible UI.',
  },

  {
    id: 'calendly',
    name: 'Calendly',
    category: 'productivity',
    aliases: ['calendly', 'calendly clone', 'meeting scheduler', 'booking link', 'appointment scheduler'],
    tagline: 'Meeting scheduling with personal booking links and time-slot pickers.',
    app_name: 'Schedly',
    design_theme: 'light',
    primary_color: 'sky',
    mobile_first: false,
    needs_auth: true,
    views: ['dashboard', 'event_types', 'booking_page', 'bookings'],
    data_collections: [
      { name: 'event_types', fields: ['user_id', 'name', 'duration', 'color', 'description', 'slug'] },
      { name: 'bookings', fields: ['event_type_id', 'invitee_name', 'invitee_email', 'starts_at', 'duration', 'notes', 'status'] },
    ],
    must_have_features: [
      'Event Types: "30-min meeting", "60-min consultation"',
      'Public booking page: select event → calendar grid → time slots → form',
      'Bookings list with upcoming and past',
      'Calendar grid with available days highlighted',
    ],
    design_notes: 'Calendly blue (#006BFF). Clean, professional. Calendar grid is central. Use light blue highlights.',
    key_patterns: `
- Calendar grid: 7-column grid of day buttons, available days highlighted with sky-100 bg
- Time slots: vertical list of clickable buttons "9:00 AM", "9:30 AM"
- Booking form: name, email, notes, "Schedule Event" button
`,
    seed_data_hint: 'Seed 3-4 event types and 8+ existing bookings.',
    pitfalls: 'Do NOT skip the calendar grid — it\'s the heart of the app.',
  },

  {
    id: 'todoist',
    name: 'Todoist',
    category: 'productivity',
    aliases: ['todoist', 'todoist clone', 'todo app', 'task manager', 'task list app', 'gtd app'],
    tagline: 'Task manager with projects, due dates, priorities, and labels.',
    app_name: 'Tasks',
    design_theme: 'light',
    primary_color: 'rose',
    mobile_first: false,
    needs_auth: true,
    views: ['inbox', 'today', 'upcoming', 'project'],
    data_collections: [
      { name: 'tasks', fields: ['user_id', 'project_id', 'title', 'description', 'priority', 'due_date', 'completed', 'labels', 'created_at'] },
      { name: 'projects', fields: ['user_id', 'name', 'color', 'order'] },
    ],
    must_have_features: [
      'Sidebar: Inbox, Today, Upcoming + projects list',
      'Task rows: checkbox + title + due date + priority flag + project',
      'Add task: "+ Add task" inline form with quick-add (#project @label p1-4)',
      'Strikethrough completed tasks',
      'Today view shows tasks with due_date = today',
    ],
    design_notes: 'White background. Todoist red (#E44332). Minimal, list-focused. Each task is a row, not a card.',
    key_patterns: `
- Priority flag colors: p1=red, p2=orange, p3=blue, p4=gray
- Checkbox: round, fills with check on completion
- Due date format: "Today", "Tomorrow", "Mon", "Mar 15"
`,
    seed_data_hint: 'Seed 5+ projects (Personal, Work, Shopping). Seed 20+ tasks with realistic varied due dates and priorities.',
    pitfalls: 'Do NOT use cards for tasks — they should be compact rows.',
  },

  // ─── FOOD / LOCAL (3) ────────────────────────────────────────────────────
  {
    id: 'doordash',
    name: 'DoorDash',
    category: 'food',
    aliases: ['doordash', 'doordash clone', 'food delivery', 'food ordering app', 'restaurant delivery', 'ubereats', 'uber eats'],
    tagline: 'Food delivery from local restaurants with menu browsing, cart, and order tracking.',
    app_name: 'Munch',
    design_theme: 'light',
    primary_color: 'rose',
    mobile_first: true,
    needs_auth: true,
    views: ['home', 'restaurant', 'cart', 'orders', 'profile'],
    data_collections: [
      { name: 'restaurants', fields: ['name', 'cuisine', 'image_url', 'rating', 'delivery_time', 'delivery_fee', 'is_open', 'distance'] },
      { name: 'menu_items', fields: ['restaurant_id', 'name', 'description', 'price', 'image_url', 'category'] },
      { name: 'orders', fields: ['user_id', 'restaurant_id', 'items', 'subtotal', 'delivery_fee', 'tip', 'total', 'status', 'created_at'] },
    ],
    must_have_features: [
      'Home: filter chips (Pickup/Delivery), category icons, restaurant cards',
      'Restaurant card: cover image, name, rating + reviews, cuisine, delivery time, fee',
      'Restaurant page: header image, menu sections, items with photos and prices',
      'Tap item → bottom sheet with quantity + add to cart',
      'Cart with item list, subtotal, delivery fee, tip selector, total, "Place Order"',
      'Order tracking: "Restaurant preparing → Driver picking up → On the way → Delivered"',
    ],
    design_notes: 'White background. DoorDash red (#FF3008) for primary actions. Mobile-first. Big food photos. Bottom sheet patterns.',
    key_patterns: `
- Restaurant card: \`<div className="rounded-xl overflow-hidden">\` with image and meta below
- Tip selector: 3 buttons "15% / 18% / 20% / Other"
- Order status: 4-step progress bar
`,
    seed_data_hint: 'Seed 12+ restaurants with varied cuisines (Italian, Mexican, Thai, Japanese, Burgers). Each with 8-12 menu items. Use food photos from Unsplash.',
    pitfalls: 'Do NOT skip food photos — visual food appeal is critical. Use red, NOT indigo.',
  },

  {
    id: 'yelp',
    name: 'Yelp',
    category: 'food',
    aliases: ['yelp', 'yelp clone', 'restaurant reviews', 'business reviews', 'local reviews', 'review site'],
    tagline: 'Local business discovery and reviews with ratings, photos, and tips.',
    app_name: 'Reviewly',
    design_theme: 'light',
    primary_color: 'rose',
    mobile_first: false,
    needs_auth: true,
    views: ['home', 'search_results', 'business', 'write_review'],
    data_collections: [
      { name: 'businesses', fields: ['name', 'category', 'rating', 'review_count', 'price_level', 'address', 'phone', 'image_url', 'photos', 'hours'] },
      { name: 'reviews', fields: ['business_id', 'user_name', 'avatar_url', 'rating', 'content', 'photos', 'created_at', 'helpful_count'] },
    ],
    must_have_features: [
      'Search bar with location',
      'Business cards: photo, name, rating with review count, price level ($, $$, $$$), category, address',
      'Business detail: photo gallery, info, reviews',
      'Star rating selector (1-5) for writing reviews',
      'Filter by category, rating, price',
    ],
    design_notes: 'White background. Yelp red/maroon (#D32323). 5-star ratings throughout. Sans-serif.',
    key_patterns: `
- Star rating: 5 stars, 4.5 = 4 full + 1 half, use SVG or text stars
- Price level: $ to $$$$
- Review card: avatar + name + stars + date, then content
`,
    seed_data_hint: 'Seed 15+ local businesses (restaurants, cafes, salons, gyms). Each with 5+ reviews of varied ratings.',
    pitfalls: 'Star ratings MUST be visually prominent. Do NOT skip the price level indicator.',
  },

  {
    id: 'opentable',
    name: 'OpenTable',
    category: 'food',
    aliases: ['opentable', 'opentable clone', 'restaurant booking', 'table reservation', 'restaurant reservation app'],
    tagline: 'Restaurant reservation system with availability search and booking confirmation.',
    app_name: 'TableTime',
    design_theme: 'light',
    primary_color: 'rose',
    mobile_first: false,
    needs_auth: true,
    views: ['search', 'restaurant', 'reservation', 'my_reservations'],
    data_collections: [
      { name: 'restaurants', fields: ['name', 'cuisine', 'address', 'image_url', 'rating', 'price_level', 'description'] },
      { name: 'reservations', fields: ['restaurant_id', 'user_name', 'party_size', 'date', 'time', 'status', 'special_request'] },
    ],
    must_have_features: [
      'Search: date picker + time picker + party size + location',
      'Restaurant results with available time slot buttons (e.g., "6:30 PM", "7:00 PM")',
      'Tap a time → booking confirmation form',
      'My Reservations list',
    ],
    design_notes: 'White background. OpenTable red (#DA3743). Restaurant photos prominent.',
    key_patterns: `
- Time slot pills: rounded buttons in a row
- Available times highlighted, unavailable grayed out
`,
    seed_data_hint: 'Seed 12+ restaurants with available time slots.',
    pitfalls: 'Do NOT skip the time-slot picker — it\'s the core interaction.',
  },

  // ─── TRAVEL (3) ──────────────────────────────────────────────────────────
  {
    id: 'airbnb',
    name: 'Airbnb',
    category: 'travel',
    aliases: ['airbnb', 'airbnb clone', 'vacation rental', 'short term rental', 'home rental', 'lodging app'],
    tagline: 'Home rental marketplace with search, listings, photos, reviews, and booking.',
    app_name: 'Stayly',
    design_theme: 'light',
    primary_color: 'rose',
    mobile_first: false,
    needs_auth: true,
    views: ['search', 'listing', 'wishlists', 'trips', 'host'],
    data_collections: [
      { name: 'listings', fields: ['title', 'host_name', 'host_avatar', 'location', 'images', 'price_per_night', 'rating', 'reviews_count', 'beds', 'baths', 'guests', 'amenities', 'is_superhost'] },
      { name: 'reviews', fields: ['listing_id', 'guest_name', 'avatar_url', 'rating', 'content', 'created_at'] },
      { name: 'bookings', fields: ['listing_id', 'guest_id', 'check_in', 'check_out', 'guests', 'total_price'] },
      { name: 'wishlists', fields: ['user_id', 'listing_id', 'created_at'] },
    ],
    must_have_features: [
      'Top search bar: location + dates + guests',
      'Category icons row: Beach, Cabins, Tiny homes, Castles, etc.',
      'Listing grid (2-3-4 columns) with image carousel, heart, title, location, dates, price/night',
      'Listing detail: photo gallery, host info, description, amenities, reviews, booking widget on right',
      'Booking widget: dates, guests, total price calculation',
    ],
    design_notes: 'White background. Airbnb pink/red (#FF385C). Round photos with carousel dots. Lots of white space. Sans-serif Cereal-style. Hearts are top-right of each card.',
    key_patterns: `
- Listing card: aspect-square image with overlay heart top-right and carousel dots bottom
- Image carousel: arrows on hover (left/right) with snap-x
- Category icons: horizontal scrollable row with icon + label + active underline
- Booking widget: \`sticky top-24 border rounded-2xl shadow-lg p-6\`
- "Superhost" badge on host avatar
`,
    seed_data_hint: 'Seed 20+ varied listings (cabins, beach houses, lofts, treehouses) with high-quality interior photos. Realistic prices ($75-$500/night).',
    pitfalls: 'Do NOT skip the category icons row at top. Listings MUST have hearts. Image carousel is essential.',
  },

  {
    id: 'uber',
    name: 'Uber / Lyft',
    category: 'travel',
    aliases: ['uber', 'lyft', 'uber clone', 'lyft clone', 'rideshare', 'ride sharing', 'taxi app', 'ride hailing'],
    tagline: 'Ride-hailing app with map, pickup/dropoff, ride options, and driver tracking.',
    app_name: 'Hailr',
    design_theme: 'light',
    primary_color: 'slate',
    mobile_first: true,
    needs_auth: true,
    views: ['home', 'select_ride', 'tracking', 'rides_history'],
    data_collections: [
      { name: 'rides', fields: ['user_id', 'pickup', 'dropoff', 'driver_name', 'driver_avatar', 'car_model', 'plate', 'price', 'distance', 'duration', 'status', 'created_at'] },
      { name: 'ride_options', fields: ['name', 'description', 'eta_minutes', 'price', 'icon'] },
    ],
    must_have_features: [
      'Map placeholder (gradient or static image) with pickup pin',
      '"Where to?" search input → list of suggested addresses',
      'Bottom sheet with ride options: UberX, Comfort, XL, Black with prices and ETAs',
      'Confirm pickup → driver-incoming sheet with car details and ETA countdown',
      '5-star rating after ride',
    ],
    design_notes: 'Black/white minimal aesthetic for Uber. Map fills the background. Bottom sheet UI is the primary interface.',
    key_patterns: `
- Bottom sheet: \`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-6\`
- Ride option row: icon + name (bold) + ETA + description, then price on right
- Map: use a stylized SVG or gradient placeholder
- Pin: red drop pin at center
`,
    seed_data_hint: 'Seed 4-5 ride options. Seed 6+ past rides.',
    pitfalls: 'Bottom sheet is the main UI — do NOT make this a normal page layout.',
  },

  {
    id: 'maps',
    name: 'Google Maps (lite)',
    category: 'travel',
    aliases: ['google maps', 'maps app', 'navigation app', 'map clone', 'directions app'],
    tagline: 'Map browser with search, place details, directions, and saved places.',
    app_name: 'Mapr',
    design_theme: 'light',
    primary_color: 'sky',
    mobile_first: false,
    needs_auth: false,
    views: ['main'],
    data_collections: [
      { name: 'places', fields: ['name', 'category', 'address', 'rating', 'image_url', 'lat', 'lng'] },
      { name: 'saved_places', fields: ['user_id', 'place_id', 'list_name'] },
    ],
    must_have_features: [
      'Search bar at top-left over the map',
      'Map placeholder background',
      'Search results panel slide out from left',
      'Place detail card with photo, rating, address, hours, save/share/directions',
    ],
    design_notes: 'Map fills the screen. Search panel is white card on left. Google blue accents.',
    key_patterns: `
- Map: use a stylized SVG or muted gradient with pins
- Search panel: \`absolute left-4 top-4 w-96 bg-white rounded-xl shadow-lg\`
`,
    seed_data_hint: 'Seed 12+ places (restaurants, parks, shops) with addresses.',
    pitfalls: 'Do NOT try to render an actual interactive map.',
  },

  // ─── FINANCE (3) ─────────────────────────────────────────────────────────
  {
    id: 'venmo',
    name: 'Venmo / Cash App',
    category: 'finance',
    aliases: ['venmo', 'venmo clone', 'cash app', 'cashapp', 'p2p payment', 'send money app', 'payment app'],
    tagline: 'Peer-to-peer payment app with social feed of transactions, balance, and request/pay.',
    app_name: 'Sendly',
    design_theme: 'light',
    primary_color: 'sky',
    mobile_first: true,
    needs_auth: true,
    views: ['feed', 'pay', 'request', 'profile', 'card'],
    data_collections: [
      { name: 'transactions', fields: ['from_user_id', 'from_user_name', 'from_avatar', 'to_user_id', 'to_user_name', 'to_avatar', 'amount', 'note', 'is_public', 'likes', 'comments_count', 'created_at'] },
      { name: 'profiles', fields: ['user_id', 'name', 'username', 'avatar_url', 'balance'] },
      { name: 'friends', fields: ['user_id', 'friend_id', 'friend_name', 'friend_avatar'] },
    ],
    must_have_features: [
      'Public feed of friend transactions: "Alex paid Sarah for 🍕 pizza"',
      'Notes with emojis are central',
      'Like and comment on transactions',
      'Pay/Request screen: select friend → amount → note → button',
      'Balance display at top',
    ],
    design_notes: 'Venmo blue (#3D95CE). White background. Light, friendly. Round avatars. Social feed is the main view.',
    key_patterns: `
- Transaction row: avatar | "X paid Y" + note + 💬 + ❤️ + amount on right
- Pay button: blue, full-width
- Amount input: huge centered "$0" that grows as you type
`,
    seed_data_hint: 'Seed 20+ transactions with funny emoji-rich notes ("🌮 dinner", "🚗 uber", "🎂 birthday gift").',
    pitfalls: 'Do NOT skip the social feed — it\'s what makes Venmo unique vs Cash App.',
  },

  {
    id: 'robinhood',
    name: 'Robinhood',
    category: 'finance',
    aliases: ['robinhood', 'robinhood clone', 'stock trading app', 'stock app', 'investing app', 'crypto trading'],
    tagline: 'Commission-free stock trading with portfolio, watchlist, and real-time-feel charts.',
    app_name: 'Stox',
    design_theme: 'light',
    primary_color: 'emerald',
    mobile_first: true,
    needs_auth: true,
    views: ['portfolio', 'browse', 'stock_detail', 'transactions'],
    data_collections: [
      { name: 'stocks', fields: ['symbol', 'name', 'price', 'change_pct', 'logo_url', 'market_cap', 'volume'] },
      { name: 'holdings', fields: ['user_id', 'symbol', 'shares', 'avg_cost', 'current_value'] },
      { name: 'watchlist', fields: ['user_id', 'symbol'] },
      { name: 'transactions', fields: ['user_id', 'symbol', 'type', 'shares', 'price', 'created_at'] },
    ],
    must_have_features: [
      'Portfolio total value at top with day change ($ and %)',
      'Big SVG line chart of portfolio over time',
      'Holdings list with logo, symbol, shares, current value, change %',
      'Watchlist below holdings',
      'Stock detail: chart, key stats (open, high, low, P/E), Buy/Sell buttons',
      'Buy modal: shares input, market/limit, total cost, "Review Order"',
    ],
    design_notes: 'White background. Robinhood green (#00C805) for gains, red (#FF5000) for losses. Minimal, chart-focused. Sans-serif. Big numbers.',
    key_patterns: `
- Line chart: SVG path with random walk data, gradient fill below
- Stock row: symbol (bold) + name + sparkline + current price + change %
- Change %: green up arrow / red down arrow + percentage
- Buy button: green. Sell button: red.
\`\`\`tsx
// Sparkline mini-chart
function Sparkline({ data, color }) {
  const max = Math.max(...data), min = Math.min(...data);
  const points = data.map((v, i) => \`\${(i / (data.length - 1)) * 80},\${30 - ((v - min) / (max - min)) * 30}\`).join(' ');
  return <svg viewBox="0 0 80 30" className="w-20 h-8"><polyline points={points} fill="none" stroke={color} strokeWidth="1.5" /></svg>;
}
\`\`\`
`,
    seed_data_hint: 'Seed 20+ realistic stocks (AAPL, TSLA, NVDA, etc.) with random recent prices and changes. Seed 5+ holdings.',
    pitfalls: 'Charts MUST be present — they are central to the experience. Use green/red, not just one color.',
  },

  {
    id: 'mint',
    name: 'Mint (budgeting)',
    category: 'finance',
    aliases: ['mint', 'mint clone', 'budgeting app', 'expense tracker', 'budget tracker', 'personal finance app', 'ynab'],
    tagline: 'Personal budgeting app with categorized transactions, budget bars, and spending charts.',
    app_name: 'Budgety',
    design_theme: 'light',
    primary_color: 'emerald',
    mobile_first: false,
    needs_auth: true,
    views: ['overview', 'transactions', 'budgets', 'goals'],
    data_collections: [
      { name: 'transactions', fields: ['user_id', 'amount', 'description', 'category', 'date', 'account'] },
      { name: 'budgets', fields: ['user_id', 'category', 'limit', 'spent', 'period'] },
      { name: 'accounts', fields: ['user_id', 'name', 'type', 'balance'] },
    ],
    must_have_features: [
      'Overview: total balance, monthly spending, recent transactions',
      'Pie chart of spending by category',
      'Budget bars (spent vs limit) with red over-budget warnings',
      'Transaction list with category icons',
      'Goal tracking',
    ],
    design_notes: 'Light theme. Green/emerald for positive, red for over-budget. Clean financial dashboard look.',
    key_patterns: `
- Budget bar: \`<div className="h-2 bg-gray-200 rounded-full"><div className="h-full bg-emerald-500 rounded-full" style={{ width: \`\${pct}%\` }} /></div>\`
- Pie chart: SVG with arcs by category percentage
- Categories: 🛒 Groceries, 🍔 Food, 🏠 Housing, 🚗 Transport, 🎮 Entertainment, 💊 Health
`,
    seed_data_hint: 'Seed 30+ transactions across categories with realistic amounts. Seed 5+ budgets.',
    pitfalls: 'Do NOT skip the visualizations — charts and bars ARE the app.',
  },

  // ─── READING / NEWS (3) ──────────────────────────────────────────────────
  {
    id: 'medium',
    name: 'Medium / Substack',
    category: 'reading',
    aliases: ['medium', 'medium clone', 'substack', 'substack clone', 'blog platform', 'newsletter app', 'writing platform'],
    tagline: 'Long-form publishing platform with reading feed, writer profiles, and article reading view.',
    app_name: 'Read',
    design_theme: 'light',
    primary_color: 'emerald',
    mobile_first: false,
    needs_auth: true,
    views: ['feed', 'article', 'write', 'profile'],
    data_collections: [
      { name: 'articles', fields: ['author_id', 'author_name', 'avatar_url', 'title', 'subtitle', 'cover_image_url', 'content', 'reading_time', 'claps', 'comments_count', 'published_at', 'tags'] },
      { name: 'profiles', fields: ['user_id', 'name', 'bio', 'avatar_url', 'followers', 'following'] },
      { name: 'comments', fields: ['article_id', 'author_name', 'content', 'created_at'] },
    ],
    must_have_features: [
      'Feed of article cards: cover image right, title + subtitle + author + reading time + claps on left',
      'Article reading view: large title, subtitle, author byline, cover image, then content with serif typography',
      '"X min read" estimate',
      'Clap button (👏 with count) instead of like',
      'Tag-based topics in sidebar',
      'Comment section at bottom of article',
    ],
    design_notes: 'White background. Black serif (Charter, Georgia, or system serif) for article body. Sans-serif for UI. Lots of whitespace. Reading-first design. Medium green (#1A8917).',
    key_patterns: `
- Article body: \`prose prose-lg max-w-3xl mx-auto\` with serif font
- Reading time: count words / 200 → "5 min read"
- Article card: image (right, 200x130) + content (left, title + subtitle + meta)
- Claps: 👏 + count, each click increments
`,
    seed_data_hint: 'Seed 15+ thoughtful articles with realistic titles ("How I Built X", "What I Learned From Y"). Use Unsplash for covers.',
    pitfalls: 'Body text MUST be serif. Do NOT make it dense. Reading experience is the priority.',
  },

  {
    id: 'hackernews',
    name: 'Hacker News',
    category: 'reading',
    aliases: ['hacker news', 'hackernews', 'hn clone', 'hacker news clone', 'tech news aggregator'],
    tagline: 'Minimalist link aggregator with upvoted submissions and threaded comments.',
    app_name: 'Hacker',
    design_theme: 'light',
    primary_color: 'orange',
    mobile_first: false,
    needs_auth: true,
    views: ['top', 'new', 'ask', 'show', 'item'],
    data_collections: [
      { name: 'submissions', fields: ['title', 'url', 'domain', 'author', 'points', 'comments_count', 'created_at', 'type'] },
      { name: 'comments', fields: ['submission_id', 'parent_id', 'author', 'content', 'depth', 'created_at'] },
    ],
    must_have_features: [
      'Numbered list of submissions: # ▲ Title (domain) + meta line below',
      'Header bar: HN-style orange (#FF6600)',
      'Tabs: top | new | past | comments | ask | show | jobs | submit',
      'Click title → open URL, click comments → comment view',
      'Threaded comments with indentation',
    ],
    design_notes: 'Beige (#F6F6EF) background. Orange (#FF6600) header bar with white text. Verdana sans-serif. Minimal, info-dense, intentionally retro.',
    key_patterns: `
- Header: \`bg-orange-600 px-2 py-1 text-white\`
- Submissions: \`<ol>\` with index, ▲ vote arrow, title link, then small "X points by user N comments ago" meta
- Comment threading: indent by depth * 30px
- Use serif or Verdana font, not modern sans
`,
    seed_data_hint: 'Seed 25+ submissions with techy titles and realistic point counts (12-500).',
    pitfalls: 'Do NOT modernize the design — HN is intentionally retro.',
  },

  {
    id: 'goodreads',
    name: 'Goodreads',
    category: 'reading',
    aliases: ['goodreads', 'goodreads clone', 'book tracker', 'book reviews', 'reading list app', 'library tracker'],
    tagline: 'Book discovery and tracking with shelves, ratings, reviews, and reading challenge.',
    app_name: 'Bookly',
    design_theme: 'light',
    primary_color: 'amber',
    mobile_first: false,
    needs_auth: true,
    views: ['home', 'my_books', 'browse', 'book_detail', 'profile'],
    data_collections: [
      { name: 'books', fields: ['title', 'author', 'cover_url', 'description', 'pages', 'genre', 'avg_rating', 'ratings_count', 'published_year'] },
      { name: 'shelves', fields: ['user_id', 'name', 'is_default'] },
      { name: 'shelf_books', fields: ['user_id', 'book_id', 'shelf', 'rating', 'review', 'date_added'] },
    ],
    must_have_features: [
      'My Books with shelves: Want to Read | Currently Reading | Read',
      'Book card: cover (left, 80px), title + author + rating + add to shelf',
      'Book detail: large cover, author, description, ratings, reviews, "Want to read" button',
      '5-star rating system',
      'Reading challenge progress bar',
    ],
    design_notes: 'Cream/beige (#F4F1EA) background. Goodreads brown (#382110). Book covers are central. Serif headlines.',
    key_patterns: `
- Book cover: \`aspect-[2/3] w-20 shadow-md\`
- Star rating: 5-star clickable selector
- Shelf badges: pill-shaped with shelf color
`,
    seed_data_hint: 'Seed 25+ books from varied genres with cover images. Realistic title/author/rating combinations.',
    pitfalls: 'Do NOT skip book covers — visual appeal is key.',
  },

  // ─── GAMES (5) ───────────────────────────────────────────────────────────
  {
    id: 'wordle',
    name: 'Wordle',
    category: 'game',
    aliases: ['wordle', 'wordle clone', 'word guessing game', '5 letter word game', 'word puzzle daily'],
    tagline: 'Guess a 5-letter word in 6 tries with green/yellow/gray feedback.',
    app_name: 'Wordly',
    design_theme: 'light',
    primary_color: 'emerald',
    mobile_first: true,
    needs_auth: false,
    views: ['game'],
    data_collections: [
      { name: 'games', fields: ['user_id', 'word', 'guesses', 'won', 'attempts', 'created_at'] },
    ],
    must_have_features: [
      '6x5 grid of letter tiles',
      'On-screen keyboard with QWERTY layout',
      'Validate guesses against word list',
      'Color feedback: green (right letter, right spot), yellow (right letter, wrong spot), gray (not in word)',
      'Animation when guesses are submitted (flip tiles)',
      'Win/lose modal with stats',
    ],
    design_notes: 'White background, black tiles when filled. Bold colors: green #6AAA64, yellow #C9B458, gray #787C7E. Sans-serif. Big letters.',
    key_patterns: `
- Word list: hard-code a list of ~200 common 5-letter words for the answer pool and ~5000 for valid guesses
- Game state: \`{ word: 'CRANE', guesses: ['HOUSE', 'CRATE'], current: 'CR', attempt: 2 }\`
- Tile color logic: for each letter in guess, check if it matches the same position in answer (green) or appears elsewhere (yellow)
- Keyboard: 3 rows (QWERTYUIOP / ASDFGHJKL / Enter ZXCVBNM Backspace), color keys based on best feedback so far
- Tile flip animation: rotateX from 0 to 90 to 0 with color change at midpoint
\`\`\`tsx
function evaluateGuess(guess: string, answer: string) {
  const result = Array(5).fill('gray');
  const answerArr = answer.split('');
  // First pass: greens
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) { result[i] = 'green'; answerArr[i] = ''; }
  }
  // Second pass: yellows
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'gray' && answerArr.includes(guess[i])) {
      result[i] = 'yellow';
      answerArr[answerArr.indexOf(guess[i])] = '';
    }
  }
  return result;
}
\`\`\`
`,
    seed_data_hint: 'Pick a random word from the word list each game. No need for user-content.',
    pitfalls: 'Yellow logic is tricky — handle duplicate letters correctly with the 2-pass algorithm above.',
  },

  {
    id: '2048',
    name: '2048',
    category: 'game',
    aliases: ['2048', '2048 clone', '2048 game', 'merge tiles game', 'powers of 2 game'],
    tagline: '4x4 grid puzzle: swipe to merge matching tiles and reach 2048.',
    app_name: '2048',
    design_theme: 'light',
    primary_color: 'amber',
    mobile_first: true,
    needs_auth: false,
    views: ['game'],
    data_collections: [
      { name: 'scores', fields: ['user_id', 'score', 'highest_tile', 'created_at'] },
    ],
    must_have_features: [
      '4x4 grid with tiles',
      'Arrow keys + swipe gestures to move tiles',
      'Tiles slide and merge when they collide',
      'Random new tile (2 or 4) appears each turn',
      'Score (sum of merged values) and best score',
      'Game over when no moves possible',
      'Tile colors by value: 2 (cream), 4, 8 (orange), 16, 32, 64, 128, 256, 512, 1024, 2048 (gold)',
    ],
    design_notes: 'Beige background (#FAF8EF). Each tile color escalates from cream → orange → red. Bold tile numbers. Game grid is centered with rounded corners.',
    key_patterns: `
- Grid state: \`number[][]\` 4x4
- Move logic: for each row (or column for vertical moves), filter zeros, merge adjacent equal pairs, pad with zeros
- Tile colors: \`{ 2: 'bg-amber-50', 4: 'bg-amber-100', 8: 'bg-orange-300', 16: 'bg-orange-400', 32: 'bg-orange-500', 64: 'bg-red-500', 128: 'bg-yellow-300', 256: 'bg-yellow-400', 512: 'bg-yellow-500', 1024: 'bg-amber-500', 2048: 'bg-amber-600' }\`
- Touch swipe: track touchstart and touchend, compute dx/dy to determine direction
\`\`\`tsx
function moveLeft(grid: number[][]) {
  let scoreGain = 0;
  const newGrid = grid.map(row => {
    const filtered = row.filter(v => v !== 0);
    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i] === filtered[i + 1]) {
        filtered[i] *= 2;
        scoreGain += filtered[i];
        filtered.splice(i + 1, 1);
      }
    }
    while (filtered.length < 4) filtered.push(0);
    return filtered;
  });
  return { grid: newGrid, scoreGain };
}
\`\`\`
`,
    seed_data_hint: 'Start with 2 random tiles on an empty grid.',
    pitfalls: 'Touch controls AND keyboard controls both required. Tile colors must scale with value.',
  },

  {
    id: 'flappy',
    name: 'Flappy Bird',
    category: 'game',
    aliases: ['flappy bird', 'flappy bird clone', 'flappy clone', 'tap bird game'],
    tagline: 'Tap-to-flap bird that must dodge pipes scrolling left.',
    app_name: 'Flappy',
    design_theme: 'colorful',
    primary_color: 'sky',
    mobile_first: true,
    needs_auth: false,
    views: ['game'],
    data_collections: [
      { name: 'scores', fields: ['user_id', 'score', 'created_at'] },
    ],
    must_have_features: [
      'Canvas with bird (emoji 🐦) and scrolling pipes',
      'Tap/click/spacebar to flap (negative velocity)',
      'Gravity pulls bird down',
      'Pipes scroll left, randomly generated gaps',
      'Collision detection with pipes and ground',
      'Score increases for each pipe passed',
      'Restart on game over',
    ],
    design_notes: 'Sky blue background. Green pipes. Yellow bird. Retro pixel feel.',
    key_patterns: `
- Use canvas with requestAnimationFrame
- Bird state: \`{ y: 200, velocity: 0 }\`
- Gravity: \`velocity += 0.5\` per frame, \`y += velocity\`
- Flap: \`velocity = -8\`
- Pipes: \`{ x: 800, gapY: random(100, 400), gapHeight: 150 }\`
- Pipe scroll: \`pipe.x -= 2\` per frame
- Collision: bird.y + birdSize > pipe.gapY + gapHeight OR bird.y < pipe.gapY (when bird.x is in pipe.x range)
- Touch + spacebar both flap
`,
    seed_data_hint: 'No seed data needed.',
    pitfalls: 'Use a game loop with useRef for state to avoid re-renders. ALWAYS include touch tap controls.',
  },

  {
    id: 'snake',
    name: 'Snake',
    category: 'game',
    aliases: ['snake', 'snake clone', 'snake game', 'classic snake'],
    tagline: 'Classic snake game: grow longer by eating food, don\'t hit walls or yourself.',
    app_name: 'Snake',
    design_theme: 'dark',
    primary_color: 'emerald',
    mobile_first: true,
    needs_auth: false,
    views: ['game'],
    data_collections: [
      { name: 'scores', fields: ['user_id', 'score', 'created_at'] },
    ],
    must_have_features: [
      'Grid of cells (e.g., 20x20)',
      'Snake as array of {x,y} cells',
      'Arrow keys / WASD / on-screen D-pad to change direction',
      'Random food appears, eating it grows the snake',
      'Game over on wall or self collision',
      'Score = food eaten',
    ],
    design_notes: 'Dark grid with green snake and red food. Retro arcade.',
    key_patterns: `
- Snake state: \`{ body: [{x:10,y:10}], direction: 'right', food: {x:5,y:5} }\`
- Game tick: every 100ms, move head in direction, if hits food → grow + spawn new food, else pop tail
- Direction can't reverse (right → left blocked)
- ALWAYS include touch D-pad (see system prompt for pattern)
`,
    seed_data_hint: 'No seed data.',
    pitfalls: 'Use setInterval or requestAnimationFrame with throttling for movement, NOT every frame.',
  },

  {
    id: 'chess',
    name: 'Chess',
    category: 'game',
    aliases: ['chess', 'chess clone', 'chess game', 'play chess'],
    tagline: '2-player chess on an 8x8 board with all standard pieces and movement rules.',
    app_name: 'Chess',
    design_theme: 'light',
    primary_color: 'amber',
    mobile_first: false,
    needs_auth: false,
    views: ['game'],
    data_collections: [
      { name: 'games', fields: ['user_id', 'moves', 'winner', 'created_at'] },
    ],
    must_have_features: [
      '8x8 board with alternating light/dark squares',
      'Standard piece setup using emoji or unicode (♔♕♖♗♘♙ ♚♛♜♝♞♟)',
      'Click piece → highlight legal moves → click destination to move',
      'Turn indicator (white/black to move)',
      'Captured pieces tray',
      'Move history in algebraic notation',
    ],
    design_notes: 'Wood-toned light/dark squares. Large piece emojis. Centered board.',
    key_patterns: `
- Board: 8x8 array of pieces or null
- Pieces: use unicode chess symbols (♔ ♕ etc.)
- Legal moves: simplified — pawn forward, rook lines, bishop diagonals, knight L-shape, king/queen any 1, queen anywhere
- Don't implement check/checkmate/castling/en passant — too complex for MVP
- Highlight legal squares with green tint
\`\`\`tsx
const PIECES = {
  'white-king': '♔', 'white-queen': '♕', 'white-rook': '♖', 'white-bishop': '♗', 'white-knight': '♘', 'white-pawn': '♙',
  'black-king': '♚', 'black-queen': '♛', 'black-rook': '♜', 'black-bishop': '♝', 'black-knight': '♞', 'black-pawn': '♟',
};
\`\`\`
`,
    seed_data_hint: 'Start with standard chess setup.',
    pitfalls: 'Do NOT try to implement full chess rules. Allow basic movement only. Skip check/mate detection.',
  },
];

// ─── DETECTION ──────────────────────────────────────────────────────────────

/**
 * Detect which blueprint (if any) matches a user prompt.
 * Uses word-boundary alias matching and prefers the longest matching alias
 * (most specific match wins, e.g. "instagram clone" beats "ig").
 */
export function detectBlueprint(prompt: string): AppBlueprint | null {
  const lower = ` ${prompt.toLowerCase()} `;
  let best: { blueprint: AppBlueprint; matchLength: number } | null = null;

  for (const blueprint of BLUEPRINTS) {
    for (const alias of blueprint.aliases) {
      const a = alias.toLowerCase();
      // Word-boundary check: alias must be surrounded by non-alphanumeric chars
      const idx = lower.indexOf(a);
      if (idx === -1) continue;
      const before = lower[idx - 1];
      const after = lower[idx + a.length];
      const isWordBoundaryBefore = !before || !/[a-z0-9]/.test(before);
      const isWordBoundaryAfter = !after || !/[a-z0-9]/.test(after);
      if (!isWordBoundaryBefore || !isWordBoundaryAfter) continue;

      if (!best || a.length > best.matchLength) {
        best = { blueprint, matchLength: a.length };
      }
    }
  }
  return best?.blueprint || null;
}

/**
 * Format a blueprint as a system-prompt section the model can follow.
 * This is injected into the generator's context when a blueprint matches.
 */
export function formatBlueprintForPrompt(blueprint: AppBlueprint): string {
  return `
## REFERENCE BLUEPRINT — "${blueprint.name}"
The user is asking for a ${blueprint.name} clone. Use this blueprint as your starting point. Follow it closely — it represents the canonical version of this app type.

**Tagline:** ${blueprint.tagline}

**Suggested app name:** ${blueprint.app_name}

**Design theme:** ${blueprint.design_theme}
**Primary color:** ${blueprint.primary_color} (use ${blueprint.primary_color}-600 for buttons, ${blueprint.primary_color}-500 for accents, ${blueprint.primary_color}-100 for backgrounds. NEVER use indigo.)
**Mobile-first:** ${blueprint.mobile_first ? 'YES — design as a phone app first' : 'NO — desktop-friendly responsive design'}
**Needs auth:** ${blueprint.needs_auth ? 'YES — use useTenantAuth()' : 'NO'}

**Views (state-based, max 5):**
${blueprint.views.map(v => `- ${v}`).join('\n')}

**Data collections (use these exactly):**
${blueprint.data_collections.map(c => `- ${c.name}: { ${c.fields.join(', ')} }`).join('\n')}

**Must-have features (implement ALL of these):**
${blueprint.must_have_features.map(f => `- ${f}`).join('\n')}

**Design notes:**
${blueprint.design_notes}

**Key patterns and code hints:**
${blueprint.key_patterns}

**Seed data:**
${blueprint.seed_data_hint}

**Pitfalls to avoid:**
${blueprint.pitfalls}

⚠️ This blueprint is the gold standard for this app. Do not deviate from the design theme, primary color, or core interactions. The user expects a recognizable clone of ${blueprint.name}.
`;
}
