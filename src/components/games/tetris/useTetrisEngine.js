import { useRef, useEffect, useCallback, useState } from 'react';
import {
  computeLayout, drawPlayfield, drawWalls, drawPiece, drawGhostPiece,
  drawSidePanel, drawHUD, drawIntegrityMeter, drawStartScreen,
  drawGameOver, drawLineClearEffect, drawClearFlash, drawGlitchEffect,
  drawCorruption,
} from './renderer.js';
import {
  GRID, PIECES, COLORS, SPEED, SCORING, LEVELS, GLITCH, GAME, getWallKicks,
} from './constants.js';

const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

function shuffleBag() {
  const bag = [...PIECE_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function createEmptyGrid() {
  return Array.from({ length: GRID.ROWS }, () => Array(GRID.COLS).fill(null));
}

function getDropInterval(level) {
  return SPEED[Math.min(level - 1, SPEED.length - 1)];
}

function collides(grid, type, rotation, x, y) {
  const shape = PIECES[type][rotation];
  for (const [r, c] of shape) {
    const nr = y + r;
    const nc = x + c;
    if (nc < 0 || nc >= GRID.COLS || nr >= GRID.ROWS) return true;
    if (nr < 0) continue;
    if (grid[nr][nc]) return true;
  }
  return false;
}

function computeGhostY(grid, type, rotation, x, y) {
  let gy = y;
  while (!collides(grid, type, rotation, x, gy + 1)) {
    gy++;
  }
  return gy;
}

function computeIntegrity(grid) {
  let highestOccupied = GRID.ROWS;
  for (let r = 0; r < GRID.ROWS; r++) {
    for (let c = 0; c < GRID.COLS; c++) {
      if (grid[r][c]) {
        highestOccupied = r;
        r = GRID.ROWS; // break outer
        break;
      }
    }
  }
  const stackHeight = GRID.ROWS - highestOccupied;
  return Math.max(0, Math.round((1 - stackHeight / GRID.ROWS) * 100));
}

export default function useTetrisEngine(prefersReducedMotion = false) {
  const canvasRef = useRef(null);
  const [gamePhase, setGamePhase] = useState('start');

  const state = useRef({
    phase: 'start',
    grid: createEmptyGrid(),
    current: null,
    next: null,
    held: null,
    holdUsed: false,
    bag: [],
    score: 0,
    level: 1,
    lines: 0,
    dropTimer: 0,
    dropInterval: getDropInterval(1),
    lockTimer: 0,
    softDropping: false,
    dasTimer: 0,
    dasDirection: null,
    dasActive: false,
    arrTimer: 0,
    glitchTimer: 0,
    glitchMaxDuration: 0,
    shakeTimer: 0,
    clearingRows: [],
    clearAnimTimer: 0,
    clearFlashTimer: 0,
    clearFlashLabel: null,
    integrity: 100,
    ambientCorruption: [],
    time: 0,
    keys: {},
    keysJustPressed: {},
    width: 0,
    height: 0,
  });

  function nextFromBag(s) {
    if (s.bag.length === 0) s.bag = shuffleBag();
    return s.bag.pop();
  }

  function spawnPiece(s) {
    const type = s.next || nextFromBag(s);
    s.next = nextFromBag(s);
    const x = Math.floor((GRID.COLS - 4) / 2);
    const y = type === 'I' ? -1 : -1;
    s.current = { type, rotation: 0, x, y };
    s.holdUsed = false;
    s.lockTimer = 0;
    s.dropTimer = 0;

    if (collides(s.grid, type, 0, x, y)) {
      // Try one row down
      if (collides(s.grid, type, 0, x, y + 1)) {
        handleDeath(s);
        return false;
      }
      s.current.y = y + 1;
    }
    return true;
  }

  function lockPiece(s) {
    const { type, rotation, x, y } = s.current;
    const shape = PIECES[type][rotation];
    const color = COLORS[type];

    for (const [r, c] of shape) {
      const nr = y + r;
      const nc = x + c;
      if (nr >= 0 && nr < GRID.ROWS && nc >= 0 && nc < GRID.COLS) {
        s.grid[nr][nc] = { color };
      }
    }

    // Check for completed lines
    const fullRows = [];
    for (let r = 0; r < GRID.ROWS; r++) {
      if (s.grid[r].every(cell => cell !== null)) {
        fullRows.push(r);
      }
    }

    if (fullRows.length > 0) {
      s.clearingRows = fullRows;
      s.clearAnimTimer = GLITCH.LINE_CLEAR_ANIM;
      s.phase = 'clearing';
      s.current = null;

      // Score
      const scoreNames = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS'];
      const scoreName = scoreNames[Math.min(fullRows.length, 4)];
      s.score += SCORING[scoreName] * s.level;
      s.lines += fullRows.length;

      // Level up
      const newLevel = Math.floor(s.lines / LEVELS.LINES_PER_LEVEL) + 1;
      if (newLevel !== s.level) {
        s.level = newLevel;
        s.dropInterval = getDropInterval(newLevel);
      }

      // Flash label for doubles+
      if (fullRows.length >= 2) {
        s.clearFlashLabel = scoreName + '!';
        s.clearFlashTimer = GAME.FLASH_DURATION;
      }

      // Glitch effect
      if (!prefersReducedMotion) {
        const glitchKey = scoreName;
        const cfg = GLITCH[glitchKey];
        if (cfg) {
          s.glitchTimer = cfg.duration;
          s.glitchMaxDuration = cfg.duration;
          if (fullRows.length >= 2) {
            s.shakeTimer = GAME.SHAKE_DURATION;
          }
          window.dispatchEvent(new CustomEvent('tetrisGlitch', {
            detail: {
              intensity: cfg.intensity,
              type: scoreName.toLowerCase(),
            },
          }));
        }
      }
    } else {
      spawnPiece(s);
    }

    s.integrity = computeIntegrity(s.grid);
  }

  function handleDeath(s) {
    s.phase = 'gameOver';
    s.current = null;
    setGamePhase('gameOver');

    if (!prefersReducedMotion) {
      s.glitchTimer = GLITCH.DEATH.duration;
      s.glitchMaxDuration = GLITCH.DEATH.duration;
      s.shakeTimer = GAME.SHAKE_DURATION;
      window.dispatchEvent(new CustomEvent('tetrisGlitch', {
        detail: { intensity: GLITCH.DEATH.intensity, type: 'death' },
      }));
    }
  }

  function tryRotate(s, direction) {
    if (!s.current || s.current.type === 'O') return;
    const { type, rotation, x, y } = s.current;
    const newRot = (rotation + direction + 4) % 4;
    const kicks = getWallKicks(type, rotation, newRot);

    for (const [kx, ky] of kicks) {
      if (!collides(s.grid, type, newRot, x + kx, y - ky)) {
        s.current.rotation = newRot;
        s.current.x = x + kx;
        s.current.y = y - ky;
        s.lockTimer = 0;
        return;
      }
    }
  }

  function tryMove(s, dx) {
    if (!s.current) return false;
    const { type, rotation, x, y } = s.current;
    if (!collides(s.grid, type, rotation, x + dx, y)) {
      s.current.x += dx;
      s.lockTimer = 0;
      return true;
    }
    return false;
  }

  function hardDrop(s) {
    if (!s.current) return;
    const ghostY = computeGhostY(s.grid, s.current.type, s.current.rotation, s.current.x, s.current.y);
    const cellsDropped = ghostY - s.current.y;
    s.score += cellsDropped * SCORING.HARD_DROP;
    s.current.y = ghostY;
    lockPiece(s);
  }

  function holdPiece(s) {
    if (!s.current || s.holdUsed) return;
    const currentType = s.current.type;
    if (s.held) {
      const heldType = s.held;
      s.held = currentType;
      const x = Math.floor((GRID.COLS - 4) / 2);
      s.current = { type: heldType, rotation: 0, x, y: -1 };
    } else {
      s.held = currentType;
      spawnPiece(s);
    }
    s.holdUsed = true;
    s.lockTimer = 0;
    s.dropTimer = 0;
  }

  const resetGame = useCallback(() => {
    const s = state.current;
    s.grid = createEmptyGrid();
    s.current = null;
    s.next = null;
    s.held = null;
    s.holdUsed = false;
    s.bag = shuffleBag();
    s.score = 0;
    s.level = 1;
    s.lines = 0;
    s.dropTimer = 0;
    s.dropInterval = getDropInterval(1);
    s.lockTimer = 0;
    s.softDropping = false;
    s.dasTimer = 0;
    s.dasDirection = null;
    s.dasActive = false;
    s.arrTimer = 0;
    s.glitchTimer = 0;
    s.shakeTimer = 0;
    s.clearingRows = [];
    s.clearAnimTimer = 0;
    s.clearFlashTimer = 0;
    s.clearFlashLabel = null;
    s.integrity = 100;
    s.ambientCorruption = [];
    s.keysJustPressed = {};

    spawnPiece(s);
    s.phase = 'playing';
    setGamePhase('playing');
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      state.current.width = rect.width;
      state.current.height = rect.height;
    }
    resize();
    window.addEventListener('resize', resize);

    const GAME_KEYS = [
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyZ', 'KeyC',
      'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight',
    ];

    function onKeyDown(e) {
      const s = state.current;
      s.keys[e.code] = true;

      if (e.code === 'Enter') {
        if (s.phase === 'start' || s.phase === 'gameOver') {
          resetGame();
        }
        return;
      }

      if (s.phase !== 'playing' || !s.current) return;

      if (!s.keysJustPressed[e.code]) {
        s.keysJustPressed[e.code] = true;

        if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          tryRotate(s, 1);
        } else if (e.code === 'KeyZ' || e.code === 'ControlLeft' || e.code === 'ControlRight') {
          tryRotate(s, -1);
        } else if (e.code === 'Space') {
          hardDrop(s);
        } else if (e.code === 'KeyC' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
          holdPiece(s);
        } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          tryMove(s, -1);
          s.dasDirection = -1;
          s.dasTimer = 0;
          s.dasActive = false;
          s.arrTimer = 0;
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          tryMove(s, 1);
          s.dasDirection = 1;
          s.dasTimer = 0;
          s.dasActive = false;
          s.arrTimer = 0;
        }
      }

      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        s.softDropping = true;
      }

      if (GAME_KEYS.includes(e.code)) {
        e.preventDefault();
      }
    }

    function onKeyUp(e) {
      const s = state.current;
      s.keys[e.code] = false;
      s.keysJustPressed[e.code] = false;

      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        s.softDropping = false;
      }

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        if (s.dasDirection === -1) s.dasDirection = null;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        if (s.dasDirection === 1) s.dasDirection = null;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let lastTime = 0;
    let rafId;

    function loop(timestamp) {
      rafId = requestAnimationFrame(loop);

      const dtMs = lastTime ? Math.min(timestamp - lastTime, 50) : 16;
      const dt = dtMs / 1000;
      lastTime = timestamp;

      const s = state.current;
      const { width, height } = s;
      if (width === 0 || height === 0) return;

      s.time += dt;

      ctx.clearRect(0, 0, width, height);

      if (s.phase === 'start') {
        drawStartScreen(ctx, width, height);
        return;
      }

      const layout = computeLayout(width, height);

      // ── Clearing phase ──
      if (s.phase === 'clearing') {
        s.clearAnimTimer -= dt;
        const progress = 1 - Math.max(0, s.clearAnimTimer / GLITCH.LINE_CLEAR_ANIM);

        // Render frozen playfield
        let shakeX = 0, shakeY = 0;
        if (s.shakeTimer > 0 && !prefersReducedMotion) {
          const intensity = (s.shakeTimer / GAME.SHAKE_DURATION) * GAME.SHAKE_INTENSITY;
          shakeX = (Math.random() - 0.5) * intensity * 2;
          shakeY = (Math.random() - 0.5) * intensity * 2;
        }
        ctx.save();
        ctx.translate(shakeX, shakeY);
        drawPlayfield(ctx, s.grid, layout);
        drawWalls(ctx, layout);
        if (!prefersReducedMotion) {
          drawLineClearEffect(ctx, s.clearingRows, progress, layout);
        }
        ctx.restore();

        drawHUD(ctx, s.score, s.level, s.lines, width);
        drawSidePanel(ctx, 'NEXT', s.next, layout.rightPanelX, layout.offsetY, layout.cellSize);
        drawSidePanel(ctx, 'HOLD', s.held, layout.leftPanelX, layout.offsetY, layout.cellSize);
        drawIntegrityMeter(ctx, s.integrity, layout.leftPanelX, layout.offsetY + 5.5 * layout.cellSize);

        // Timers
        if (s.glitchTimer > 0) s.glitchTimer -= dt;
        if (s.shakeTimer > 0) s.shakeTimer -= dt;
        if (s.clearFlashTimer > 0) {
          const alpha = s.clearFlashTimer / GAME.FLASH_DURATION;
          drawClearFlash(ctx, s.clearFlashLabel, width, height, alpha);
          s.clearFlashTimer -= dt;
        }

        if (s.glitchTimer > 0 && !prefersReducedMotion) {
          drawGlitchEffect(ctx, width, height, s.glitchTimer / s.glitchMaxDuration);
        }

        if (s.clearAnimTimer <= 0) {
          // Remove cleared rows and shift down
          for (const row of s.clearingRows.sort((a, b) => a - b)) {
            s.grid.splice(row, 1);
            s.grid.unshift(Array(GRID.COLS).fill(null));
          }
          s.clearingRows = [];
          s.integrity = computeIntegrity(s.grid);
          s.phase = 'playing';
          spawnPiece(s);
        }
        return;
      }

      // ── Game Over ──
      if (s.phase === 'gameOver') {
        ctx.save();
        drawPlayfield(ctx, s.grid, layout);
        drawWalls(ctx, layout);
        ctx.restore();
        drawGameOver(ctx, s.score, width, height);

        if (s.glitchTimer > 0 && !prefersReducedMotion) {
          drawGlitchEffect(ctx, width, height, s.glitchTimer / s.glitchMaxDuration);
          s.glitchTimer -= dt;
        }
        return;
      }

      // ── Playing ──

      // DAS (Delayed Auto Shift)
      if (s.dasDirection !== null && s.current) {
        s.dasTimer += dtMs;
        if (!s.dasActive && s.dasTimer >= GAME.DAS) {
          s.dasActive = true;
          s.arrTimer = 0;
          tryMove(s, s.dasDirection);
        } else if (s.dasActive) {
          s.arrTimer += dtMs;
          while (s.arrTimer >= GAME.ARR) {
            s.arrTimer -= GAME.ARR;
            if (!tryMove(s, s.dasDirection)) break;
          }
        }
      }

      // Gravity
      if (s.current) {
        const effectiveInterval = s.softDropping ? Math.min(s.dropInterval, 50) : s.dropInterval;
        s.dropTimer += dtMs;

        while (s.dropTimer >= effectiveInterval) {
          s.dropTimer -= effectiveInterval;

          if (!collides(s.grid, s.current.type, s.current.rotation, s.current.x, s.current.y + 1)) {
            s.current.y++;
            s.lockTimer = 0;
            if (s.softDropping) {
              s.score += SCORING.SOFT_DROP;
            }
          } else {
            // On surface - accumulate lock timer
            s.dropTimer = 0;
            break;
          }
        }

        // Lock delay
        if (collides(s.grid, s.current.type, s.current.rotation, s.current.x, s.current.y + 1)) {
          s.lockTimer += dtMs;
          if (s.lockTimer >= GAME.LOCK_DELAY) {
            lockPiece(s);
          }
        }
      }

      // Timers
      if (s.glitchTimer > 0) s.glitchTimer -= dt;
      if (s.shakeTimer > 0) s.shakeTimer -= dt;
      if (s.clearFlashTimer > 0) s.clearFlashTimer -= dt;

      // Ambient corruption
      s.ambientCorruption = [];
      if (!prefersReducedMotion && s.integrity < 50) {
        const factor = (50 - s.integrity) / 50;
        const chance = GLITCH.AMBIENT_BASE_CHANCE * factor * 3;
        const numCells = Math.floor(GRID.COLS * GRID.ROWS * chance * 0.15);
        for (let i = 0; i < numCells; i++) {
          if (Math.random() < chance) {
            s.ambientCorruption.push({
              x: Math.floor(Math.random() * GRID.COLS),
              y: Math.floor(Math.random() * GRID.ROWS),
            });
          }
        }
      }

      // ── Render ──
      let shakeX = 0, shakeY = 0;
      if (s.shakeTimer > 0 && !prefersReducedMotion) {
        const intensity = (s.shakeTimer / GAME.SHAKE_DURATION) * GAME.SHAKE_INTENSITY;
        shakeX = (Math.random() - 0.5) * intensity * 2;
        shakeY = (Math.random() - 0.5) * intensity * 2;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      drawPlayfield(ctx, s.grid, layout);
      drawWalls(ctx, layout);

      if (s.ambientCorruption.length > 0) {
        drawCorruption(ctx, s.ambientCorruption, layout);
      }

      if (s.current) {
        const ghostY = computeGhostY(s.grid, s.current.type, s.current.rotation, s.current.x, s.current.y);
        drawGhostPiece(ctx, s.current, ghostY, layout);

        // Visual corruption on piece at low integrity
        if (!prefersReducedMotion && s.integrity < 25 && Math.random() < 0.05) {
          drawPiece(ctx, { ...s.current, type: PIECE_TYPES[Math.floor(Math.random() * 7)] }, layout, 0.3);
        } else {
          drawPiece(ctx, s.current, layout);
        }
      }

      ctx.restore();

      drawHUD(ctx, s.score, s.level, s.lines, width);
      drawSidePanel(ctx, 'NEXT', s.next, layout.rightPanelX, layout.offsetY, layout.cellSize);
      drawSidePanel(ctx, 'HOLD', s.held, layout.leftPanelX, layout.offsetY, layout.cellSize);
      drawIntegrityMeter(ctx, s.integrity, layout.leftPanelX, layout.offsetY + 5.5 * layout.cellSize);

      if (s.clearFlashTimer > 0) {
        const alpha = s.clearFlashTimer / GAME.FLASH_DURATION;
        drawClearFlash(ctx, s.clearFlashLabel, width, height, alpha);
      }

      if (s.glitchTimer > 0 && !prefersReducedMotion) {
        drawGlitchEffect(ctx, width, height, s.glitchTimer / s.glitchMaxDuration);
      }
    }

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [resetGame, prefersReducedMotion]);

  return { canvasRef, gamePhase };
}
