// Canvas + game loop + touch controls. Conditional: only when app_type === 'game'.

export const GAMES = `### GAME / INTERACTIVE APP PATTERNS
When the user asks for a game, virtual world, or interactive app, use these React-native techniques:

#### 2D Canvas Game Loop (for movement, virtual worlds, simple games):
\`\`\`tsx
const canvasRef = useRef<HTMLCanvasElement>(null);
const [playerPos, setPlayerPos] = useState({ x: 200, y: 200 });
const keysRef = useRef<Set<string>>(new Set());

// Keyboard input — IMPORTANT: preventDefault on game keys so they don't scroll the page
const GAME_KEYS = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' ', 'spacebar'];
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (GAME_KEYS.includes(k)) e.preventDefault(); // stops arrow keys from scrolling
    keysRef.current.add(k);
  };
  const handleKeyUp = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (GAME_KEYS.includes(k)) e.preventDefault();
    keysRef.current.delete(k);
  };
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
}, []);

// Game loop
useEffect(() => {
  let animId: number;
  const speed = 3;
  function gameLoop() {
    setPlayerPos(prev => {
      let { x, y } = prev;
      if (keysRef.current.has('w') || keysRef.current.has('arrowup')) y -= speed;
      if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) y += speed;
      if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) x -= speed;
      if (keysRef.current.has('d') || keysRef.current.has('arrowright')) x += speed;
      return { x: Math.max(0, Math.min(780, x)), y: Math.max(0, Math.min(580, y)) };
    });
    animId = requestAnimationFrame(gameLoop);
  }
  animId = requestAnimationFrame(gameLoop);
  return () => cancelAnimationFrame(animId);
}, []);

// Canvas rendering
useEffect(() => {
  const ctx = canvasRef.current?.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, 800, 600);
  // Draw background, objects, player
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(0, 0, 800, 600);
  if (sprites.current.player) ctx.drawImage(sprites.current.player, playerPos.x, playerPos.y, 48, 48);
}, [playerPos]);

<canvas ref={canvasRef} width={800} height={600} className="rounded-xl border" />
\`\`\`

#### When to use canvas vs HTML:
- Virtual worlds, movement games, drawing apps → use <canvas> with game loop
- Card games, board games, puzzle games → use HTML divs with click handlers and CSS transitions
- Quiz games, trivia, text adventures → use regular React components

#### Game HUD — Use @/ui components for polished game UI:
\`\`\`tsx
// Menu screen — clean and attractive, not ugly admin UI:
<div className="flex min-h-screen items-center justify-center bg-gray-900">
  <div className="text-center">
    <Icon name="trophy" size={48} className="mx-auto text-amber-400 mb-4" />
    <h1 className="text-4xl font-semibold text-white mb-2">Game Title</h1>
    <p className="text-gray-400 mb-8">Tagline or instructions</p>
    <Button size="lg" onClick={() => setScreen('play')}>Play Game</Button>
  </div>
</div>

// In-game HUD overlay:
<div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
  <Badge variant="default" size="lg" className="pointer-events-auto">
    <Icon name="star" size={14} className="mr-1" /> {score}
  </Badge>
  <Button variant="ghost" size="sm" icon="pause" onClick={() => setScreen('pause')}
    className="pointer-events-auto text-white hover:bg-white/20" />
</div>

// Game over screen:
<Dialog open={screen === 'gameover'} onClose={() => setScreen('menu')} title="Game Over">
  <p className="text-center text-2xl font-semibold mb-2">{score} points</p>
  <DialogFooter>
    <Button variant="secondary" onClick={() => setScreen('menu')}>Menu</Button>
    <Button onClick={() => { setScore(0); setScreen('play'); }}>Play Again</Button>
  </DialogFooter>
</Dialog>
\`\`\`

#### Sprite Loading Pattern — Use real game art instead of emoji:
All game sprites come from Kenney (CC0 public domain) via jsDelivr CDN.
Preload sprites in a useEffect so they're ready before the game loop draws them:
\`\`\`tsx
const sprites = useRef<Record<string, HTMLImageElement>>({});
const spritesLoaded = useRef(false);
useEffect(() => {
  const urls: Record<string, string> = {
    player: 'https://cdn.jsdelivr.net/gh/kefik/kenney@latest/SimplifiedPlatformer/Characters/platformChar_idle.png',
    coin: 'https://cdn.jsdelivr.net/gh/kefik/kenney@latest/SimplifiedPlatformer/Items/platformPack_item001.png',
  };
  let loaded = 0;
  Object.entries(urls).forEach(([key, src]) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { loaded++; if (loaded === Object.keys(urls).length) spritesLoaded.current = true; };
    img.src = src;
    sprites.current[key] = img;
  });
}, []);

// In your render loop — draw sprites instead of emoji:
if (sprites.current.player) ctx.drawImage(sprites.current.player, x, y, 48, 48);
if (sprites.current.coin) ctx.drawImage(sprites.current.coin, coin.x, coin.y, 32, 32);
\`\`\`

#### Kenney Sprite Catalog — pick assets by game genre:

**Platformer** (base: \`https://cdn.jsdelivr.net/gh/kefik/kenney@latest/SimplifiedPlatformer\`):
- Characters: \`Characters/platformChar_idle.png\`, \`platformChar_walk1.png\`, \`platformChar_walk2.png\`, \`platformChar_jump.png\`, \`platformChar_duck.png\`, \`platformChar_happy.png\`
- Items: \`Items/platformPack_item001.png\` (gold coin), \`item002.png\` (silver coin), \`item003.png\` (bronze coin), \`item004.png\` (gem blue), \`item005.png\` (gem green), \`item007.png\` (star), \`item009.png\` (heart), \`item017.png\` (key)
- Tiles: \`Tiles/platformPack_tile001.png\` through \`tile065.png\` (ground, bricks, platforms)

**Space Shooter** (base: \`https://cdn.jsdelivr.net/gh/kefik/kenney@latest/Shooter\`):
- Player ships: \`playerShip1_blue.png\`, \`playerShip2_green.png\`, \`playerShip3_orange.png\` (3 styles × 4 colors: blue/green/orange/red)
- Enemies: \`enemies/enemyBlack1.png\` through \`enemyBlack5.png\` (5 shapes × 4 colors: Black/Blue/Green/Red)
- UFOs: \`ufoBlue.png\`, \`ufoGreen.png\`, \`ufoRed.png\`, \`ufoYellow.png\`
- Lasers: \`lasers/laserBlue01.png\`, \`laserRed01.png\`, \`laserGreen01.png\` (16 variants per color)
- Meteors: \`meteors/meteorBrown_big1.png\` through \`big4.png\`, \`med1.png\`, \`small1.png\`, \`tiny1.png\` (brown + grey)
- Powerups: \`powerups/powerupBlue.png\`, \`powerupGreen.png\`, \`powerups/star_gold.png\`, \`shield_gold.png\`, \`bolt_gold.png\`
- Fire effects: \`effects/fire00.png\` through \`fire19.png\` (20-frame animation)
- HUD: \`ui/playerLife1_blue.png\` (life icons matching ship color), \`ui/numeral0.png\` through \`numeral9.png\`

Sprite dimensions: platformer chars ~64×64, platformer items/tiles ~64×64, ships ~75-100px wide, enemies ~80-100px, lasers ~10×50, meteors vary (big ~100px, tiny ~20px).

#### Game-specific rules:
- Prefer Kenney sprite images for polished visuals. Emoji fallback is OK for quick prototypes or when no suitable sprite exists.
- NEVER use emoji in UI buttons/headings — only inside canvas as a last resort
- Use requestAnimationFrame for smooth animation, NOT setInterval
- Keyboard: WASD + arrow keys for movement
- ALWAYS call e.preventDefault() in keydown for arrow keys and spacebar — otherwise they scroll the page and ruin the game
- Use a GAME_KEYS array (see example above) and preventDefault when any game key is pressed
- Keep game state in useRef (not useState) for performance in the game loop — only setState for rendering
- Collision detection: simple bounding box (Math.abs(a.x - b.x) < size)
- Rooms/levels: change background and object positions via state
- ALWAYS include mobile touch controls — most users play on phones. See touch controls pattern below.

#### Touch controls for games (REQUIRED for any game with movement):
\`\`\`tsx
// Add a virtual D-pad for mobile in addition to keyboard
<div className="fixed bottom-6 left-6 grid grid-cols-3 gap-1 sm:hidden touch-none select-none">
  <div />
  <button onTouchStart={() => keysRef.current.add('arrowup')} onTouchEnd={() => keysRef.current.delete('arrowup')}
    className="h-12 w-12 rounded-lg bg-black/40 text-white flex items-center justify-center">
    <Icon name="chevron-up" size={24} />
  </button>
  <div />
  <button onTouchStart={() => keysRef.current.add('arrowleft')} onTouchEnd={() => keysRef.current.delete('arrowleft')}
    className="h-12 w-12 rounded-lg bg-black/40 text-white flex items-center justify-center">
    <Icon name="chevron-left" size={24} />
  </button>
  <div />
  <button onTouchStart={() => keysRef.current.add('arrowright')} onTouchEnd={() => keysRef.current.delete('arrowright')}
    className="h-12 w-12 rounded-lg bg-black/40 text-white flex items-center justify-center">
    <Icon name="chevron-right" size={24} />
  </button>
  <div />
  <button onTouchStart={() => keysRef.current.add('arrowdown')} onTouchEnd={() => keysRef.current.delete('arrowdown')}
    className="h-12 w-12 rounded-lg bg-black/40 text-white flex items-center justify-center">
    <Icon name="chevron-down" size={24} />
  </button>
  <div />
</div>
// Action buttons (jump, shoot, etc.) on the right side, also sm:hidden
\`\`\`
The canvas should also scale to fit mobile screens: \`className="w-full max-w-[800px] aspect-[4/3] rounded-xl border touch-none"\``;
