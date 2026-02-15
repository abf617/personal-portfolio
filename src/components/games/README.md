# Games Arcade - Technical Documentation

Canvas-based arcade games with a cyberpunk/terminal aesthetic. Each game runs entirely client-side using HTML5 Canvas and React hooks, rendered as Astro islands via `client:only="react"`.

## Architecture Overview

```
src/components/games/
  ArcadeSelect.jsx              # Hub: game list, preview panel, keyboard/click launch
  asteroids/
    constants.js                # Ship, asteroid, bullet, particle, level tuning
    entities.js                 # Physics classes: Ship, AsteroidEntity, BulletEntity, ParticleEntity
    renderer.js                 # Canvas draw functions for all game objects and screens
    useGameEngine.js            # Game loop hook: physics, collision, spawning, levels
    AsteroidsGame.jsx           # React wrapper: canvas, touch controls, CRT glitch bridge
  snake/
    constants.js                # Grid, speed tiers, food/virus, corruption tuning
    renderer.js                 # Canvas draw functions for snake, food, virus, corruption
    useSnakeEngine.js           # Game loop hook: movement ticks, collision, speed scaling
    SnakeGame.jsx               # React wrapper: canvas, D-pad touch controls, CRT glitch bridge
  tetris/
    constants.js                # Pieces, SRS wall kicks, speed curve, scoring, glitch configs
    renderer.js                 # Canvas draw functions for playfield, pieces, panels, effects
    useTetrisEngine.js          # Game loop hook: gravity, rotation, line clears, DAS/ARR
    TetrisGame.jsx              # React wrapper: canvas, touch controls, CRT glitch bridge

src/pages/games/
  index.astro                   # Arcade hub page (renders ArcadeSelect)
  asteroids.astro               # Asteroids game page
  snake.astro                   # Snake game page
  tetris.astro                  # Tetris game page
```

### Four-Layer Pattern

Every game follows the same four-layer structure:

1. **`constants.js`** -- Pure data. All tuning knobs (speeds, sizes, colors, timing, scoring) exported as named constants. No logic, no imports beyond other constants. Change gameplay feel by editing numbers here.

2. **`renderer.js`** -- Pure canvas drawing functions. Each function takes a `ctx` (CanvasRenderingContext2D) and data, draws something, returns nothing. Imports only from `constants.js`. Functions are stateless -- no side effects, no mutation.

3. **`use*Engine.js`** -- A React hook that owns the game loop. Returns `{ canvasRef, gamePhase, ... }`. Internally:
   - Stores all mutable game state in a single `useRef` object (avoids re-renders on every frame)
   - Sets up `requestAnimationFrame` loop inside a `useEffect`
   - Handles keyboard input via `keydown`/`keyup` listeners on `window`
   - Handles canvas resize via `ResizeObserver` pattern
   - Calls renderer functions each frame
   - Dispatches `CustomEvent` on `window` for page-level glitch effects
   - Accepts `prefersReducedMotion` flag to skip visual effects

4. **`*Game.jsx`** -- Thin React component. Responsibilities:
   - Calls the engine hook
   - Renders the `<canvas>` element inside a styled container
   - Listens for the game's `CustomEvent` and toggles CSS classes (`crt-hit-glitch`) on wrapper/page elements
   - Renders touch controls (visible only on touch devices, only during `playing` phase)
   - Renders tap-to-start overlay for mobile when not in `playing` phase

### Page Integration

Each `.astro` page follows an identical template:

```
Layout > TopNav > GlitchTransition > terminal-window (heading + back link) > GameComponent (client:only="react") > controls footer > Footer
```

`client:only="react"` is used because games depend on browser APIs (canvas, keyboard, RAF) and cannot be server-rendered.

---

## Game Loop Mechanics

All three games use the same RAF loop pattern:

```javascript
let lastTime = 0;
function loop(timestamp) {
  rafId = requestAnimationFrame(loop);
  const dtMs = lastTime ? Math.min(timestamp - lastTime, 50) : 16; // capped delta
  const dt = dtMs / 1000;
  lastTime = timestamp;
  // ... update state, then render
}
```

Delta time is capped at 50ms to prevent physics explosions on tab-switch or lag spikes. All physics use `dt` (seconds) for time-based movement; tick-based systems (snake movement, tetris gravity) accumulate `dtMs` against interval thresholds.

### State Management

Game state lives in a `useRef` object, not `useState`. This avoids React re-renders on every frame (60fps). A few values are mirrored to `useState` for the component layer (e.g., `gamePhase` for conditional touch control rendering), updated only on phase transitions.

### Input Handling

Keyboard events are captured on `window` via `keydown`/`keyup` and stored in a `keys` map (`{ [code]: boolean }`). Games read this map during the update step. Game-relevant keys (arrows, space, WASD) have `preventDefault()` called to suppress page scrolling.

Touch controls work by synthesizing `KeyboardEvent` objects dispatched to `window`, so the same input handling code processes both keyboard and touch input.

### Canvas Sizing

Canvas dimensions track the parent container via a `resize` function that:
1. Reads `parentElement.getBoundingClientRect()`
2. Sets `canvas.width/height` to physical pixels (`rect * devicePixelRatio`)
3. Sets `canvas.style.width/height` to CSS pixels
4. Applies `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` so all drawing uses CSS pixel coordinates

This ensures crisp rendering on high-DPI displays.

---

## Rendering

### Visual Style

All games share the cyberpunk wireframe aesthetic:
- **Transparent background** -- Matrix rain animation shows through from the page
- **Neon wireframe outlines** -- Objects drawn as stroked shapes, not filled
- **Glow effects** -- `ctx.shadowColor` + `ctx.shadowBlur` for neon bloom
- **Space Mono** font for HUD text, **Orbitron** for titles
- **Color palette**: cyan (#00F0FF), magenta (#FF006E), green (#00FF41), gold (#FFD700)

### Glow Helper Pattern

Every renderer uses the same glow helper pair:

```javascript
function setGlow(ctx, color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}
function clearGlow(ctx) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}
```

Always call `clearGlow` after drawing to prevent glow bleeding into subsequent draw calls.

### Screen Shake

Applied via `ctx.save()` / `ctx.translate(shakeX, shakeY)` / `ctx.restore()` wrapping the main render pass. Shake intensity decays linearly over `SHAKE_DURATION`. HUD elements are drawn outside the shake transform so they remain stable.

### Glitch Effect

Canvas-level glitch (`drawGlitchEffect`) uses `getImageData`/`putImageData` to displace horizontal scanlines by random pixel offsets, then overlays colored bars. Intensity controls both the number of displaced lines and the offset magnitude. This is the same algorithm across all three games.

---

## CRT Glitch Bridge

Games communicate visual events to the page via `CustomEvent`:

```javascript
window.dispatchEvent(new CustomEvent('asteroidGlitch', {
  detail: { intensity: 0.35, size: 'LARGE' }
}));
```

Each game uses its own event name: `asteroidGlitch`, `snakeGlitch`, `tetrisGlitch`.

The `*Game.jsx` component listens for this event and:
1. Adds `crt-hit-glitch` CSS class to its wrapper div (triggers CSS-based CRT interference)
2. For high-intensity events (large asteroid hits, virus consumption, triple/tetris clears, death), also adds the class to the page-level `.crt-wrapper` element
3. Removes the class after a duration proportional to the event intensity

The `crt-hit-glitch` class is defined in `src/styles/crt-effects.css` and applies scanline distortion, chromatic aberration, and brightness pulsing via CSS animations.

---

## Accessibility

All games respect `prefers-reduced-motion`:
- The engine hook accepts a `prefersReducedMotion` parameter
- When true: screen shake, glitch effects, ambient corruption, and CRT interference are all skipped
- Gameplay mechanics are unchanged -- only visual effects are disabled
- The `usePrefersReducedMotion()` hook from `src/utils/detectMotionPreference.ts` handles detection

---

## Arcade Select Hub

`ArcadeSelect.jsx` renders the game selection screen at `/games`. It is a keyboard-navigable menu with:

- **Left panel**: Game list with status badges (`READY` / `INCOMING`)
- **Right panel**: ASCII art preview with animated scanline sweep, game metadata
- **Launch sequence**: On selection, shows an animated progress bar before navigating

### Game Registry

Games are defined in a `GAMES` array at the top of the file:

```javascript
{ id, title, path, status, description, controls, ascii }
```

- `status: 'ready'` -- game is playable, shows green READY badge, can be launched
- `status: 'coming_soon'` -- shows magenta INCOMING badge, launch disabled

To add a new game: add an entry to `GAMES`, set `status: 'ready'` and `path` to the game page route.

### Navigation

- Arrow keys or number keys (1-N) to select
- Enter to launch
- Mouse hover to select, click to launch
- Touch: tap to select and launch

---

## Game-Specific Details

### Asteroids

**Entities**: Physics-based with velocity, acceleration, and angular rotation. Ship has thrust/friction model. Asteroids have jagged polygon shapes generated from `JAGGED_VERTICES` + `JAGGEDNESS` randomization. Bullets have a lifetime timer.

**Collision**: Circle-circle detection (`distance < r1 + r2`). Ship has post-death invincibility period with visual flicker.

**Asteroid splitting**: Large -> 2 Medium -> 2 Small -> destroyed. Each split inherits parent velocity with randomized offset.

**Levels**: When all asteroids are destroyed, a level transition screen shows briefly, then the next wave spawns with `BASE_ASTEROIDS + level * ASTEROIDS_PER_LEVEL` asteroids (capped at `MAX_ASTEROIDS`). Speed scales with level.

**Wrapping**: All entities wrap around screen edges (toroidal topology).

**Glitch scaling**: Destroying larger asteroids triggers proportionally bigger glitch effects. Death triggers maximum intensity.

**Particles**: Explosion particles on asteroid destruction, thrust particles behind ship. Both fade over `LIFETIME`.

### Snake

**Movement**: Tick-based on a grid. Snake moves one cell per tick. Tick interval starts at `BASE_TICK` (200ms) and decreases by `TICK_REDUCTION` (15ms) every `SPEED_UP_EVERY` (5) food eaten, down to `MIN_TICK` (80ms).

**Direction queuing**: `nextDirection` is set on keydown but only applied at the next tick, preventing 180-degree reversals within a single tick.

**Food**: Regular food (green circle, pulsing glow) spawns at random unoccupied cell. Worth `FOOD.POINTS` (10).

**Virus**: Magenta bonus item. Spawns after `BONUS_SPAWN_INTERVAL` (15s), despawns after `BONUS_DESPAWN_TIME` (6s). Worth `FOOD.BONUS_POINTS` (50). Eating it triggers grid corruption (random cells display static noise for `CORRUPTION_DURATION`).

**Ambient corruption**: Scales with speed tier. Above tier 2, random cells flicker with static noise each frame. Intensity increases with tier.

**Collision**: Wall collision (grid boundary) or self collision (head overlaps body segment) triggers death.

### Tetris

**Piece system**: Standard 7 tetrominos (I, O, T, S, Z, J, L) with the 7-bag randomizer (shuffle all 7, deal in order, reshuffle when empty). Each piece has 4 rotation states stored as arrays of `[row, col]` offsets.

**SRS rotation**: Super Rotation System with wall kick tables. On rotation attempt, tries the base position first, then up to 4 wall kick offsets from the SRS table. Separate kick tables for I-piece and JLSTZ pieces. If all kicks fail, rotation is rejected.

**Movement**: DAS (Delayed Auto Shift) at 167ms initial delay, then ARR (Auto Repeat Rate) at 33ms for held left/right keys. This matches modern Tetris guidelines for responsive piece control.

**Gravity**: Level-based drop interval from 800ms (level 1) down to 50ms (level 15+). Soft drop overrides interval to 50ms and awards 1 point per cell. Hard drop instantly moves piece to ghost position and awards 2 points per cell.

**Lock delay**: When a piece lands on a surface, a 500ms lock timer starts. Moving or rotating the piece resets the timer. When the timer expires, the piece locks in place.

**Line clearing**: Completed rows enter a `clearing` phase with a 300ms animation (white flash -> static pixel dissolution). During this phase, the playfield is frozen. After animation, rows are removed and above rows shift down.

**Scoring**: Single (100), Double (300), Triple (500), Tetris (800), all multiplied by current level. Level increases every 10 lines.

**Hold system**: Press C/Shift to store the current piece and retrieve the held piece (or the next piece if hold is empty). Hold can only be used once per piece placement.

**System Integrity**: A percentage reflecting stack height. `integrity = (1 - stackHeight / totalRows) * 100`. Visual effects tied to integrity:
- Below 50%: ambient static corruption cells flicker across the playfield
- Below 25%: active piece occasionally renders with a random wrong color for one frame
- 0% (top-out): "SYSTEM CRASH" death sequence with maximum glitch intensity

**Adaptive layout**: `computeLayout()` dynamically scales cell size (12px-28px) to fit the playfield, side panels, and HUD within the available canvas dimensions. This ensures the full game is visible on smaller viewports.

**Glitch escalation per clear type**:
| Clear  | Duration | Intensity | Shake | Flash Label | Page CRT |
|--------|----------|-----------|-------|-------------|----------|
| Single | 60ms     | 0.08      | No    | No          | No       |
| Double | 120ms    | 0.18      | Yes   | "DOUBLE!"   | No       |
| Triple | 200ms    | 0.30      | Yes   | "TRIPLE!"   | Yes      |
| Tetris | 350ms    | 0.50      | Yes   | "TETRIS!"   | Yes      |
| Death  | 500ms    | 1.00      | Yes   | No          | Yes      |

---

## Adding a New Game

1. Create a subfolder: `src/components/games/newgame/`
2. Create the four files following the pattern:
   - `constants.js` -- all tuning values
   - `renderer.js` -- canvas drawing functions, import from `constants.js`
   - `useNewGameEngine.js` -- game loop hook, import from both above
   - `NewGame.jsx` -- React wrapper, import engine hook + `usePrefersReducedMotion`
3. Create `src/pages/games/newgame.astro` following the existing page template
4. Add an entry to the `GAMES` array in `ArcadeSelect.jsx` with `status: 'ready'`
5. The game's `CustomEvent` name should follow the pattern: `newgameGlitch`

### Checklist for the engine hook

- [ ] Single `useRef` for all mutable state
- [ ] `requestAnimationFrame` loop with capped delta time
- [ ] Canvas resize handler tracking parent dimensions and DPR
- [ ] `keydown`/`keyup` listeners on `window` with `preventDefault` for game keys
- [ ] `prefersReducedMotion` flag disabling all visual-only effects
- [ ] `CustomEvent` dispatch for page-level glitch integration
- [ ] Cleanup function returning from `useEffect` (cancel RAF, remove listeners)

### Checklist for the React component

- [ ] `usePrefersReducedMotion()` hook passed to engine
- [ ] `wrapperRef` for CRT glitch class toggling
- [ ] `CustomEvent` listener with timeout-based class removal
- [ ] Page-level `.crt-wrapper` pulse for high-intensity events
- [ ] Touch detection via `ontouchstart` / `maxTouchPoints`
- [ ] Touch controls rendered only during `playing` phase
- [ ] Tap-to-start overlay for non-playing phases on touch devices
- [ ] `touchAction: 'none'` on canvas to prevent browser gestures
