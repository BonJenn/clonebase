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
  ctx.font = '32px serif';
  ctx.fillText('🐧', playerPos.x, playerPos.y);
}, [playerPos]);

<canvas ref={canvasRef} width={800} height={600} className="rounded-xl border" />
\`\`\`

#### When to use canvas vs HTML:
- Virtual worlds, movement games, drawing apps → use <canvas> with game loop
- Card games, board games, puzzle games → use HTML divs with click handlers and CSS transitions
- Quiz games, trivia, text adventures → use regular React components

#### Game-specific rules:
- Use emoji for characters/sprites (🐧🏠🌳⭐🎣🍕) — they render on canvas with fillText
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
// Add a virtual joystick / D-pad for mobile in addition to keyboard
<div className="fixed bottom-6 left-6 grid grid-cols-3 gap-1 sm:hidden touch-none select-none">
  <div />
  <button
    onTouchStart={() => keysRef.current.add('arrowup')}
    onTouchEnd={() => keysRef.current.delete('arrowup')}
    className="h-12 w-12 rounded-lg bg-black/40 text-white text-xl"
  >↑</button>
  <div />
  <button
    onTouchStart={() => keysRef.current.add('arrowleft')}
    onTouchEnd={() => keysRef.current.delete('arrowleft')}
    className="h-12 w-12 rounded-lg bg-black/40 text-white text-xl"
  >←</button>
  <div />
  <button
    onTouchStart={() => keysRef.current.add('arrowright')}
    onTouchEnd={() => keysRef.current.delete('arrowright')}
    className="h-12 w-12 rounded-lg bg-black/40 text-white text-xl"
  >→</button>
  <div />
  <button
    onTouchStart={() => keysRef.current.add('arrowdown')}
    onTouchEnd={() => keysRef.current.delete('arrowdown')}
    className="h-12 w-12 rounded-lg bg-black/40 text-white text-xl"
  >↓</button>
  <div />
</div>
// Action buttons (jump, shoot, etc.) on the right side, also sm:hidden
\`\`\`
The canvas should also scale to fit mobile screens: \`className="w-full max-w-[800px] aspect-[4/3] rounded-xl border touch-none"\``;
