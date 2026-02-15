import { useRef, useEffect, useCallback, useState } from 'react';
import {
  drawGrid, drawWalls, drawSnake, drawFood, drawVirus,
  drawCorruption, drawHUD, drawStartScreen, drawGameOver,
  drawSpeedUp, drawGlitchEffect,
} from './renderer.js';
import { GRID, SNAKE, SPEED, FOOD, GLITCH, GAME, COLORS } from './constants.js';

const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const OPPOSITES = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };

function randomGridPos(cols, rows, occupied) {
  let pos;
  let attempts = 0;
  do {
    pos = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
    };
    attempts++;
  } while (
    attempts < 500 &&
    occupied.some(o => o.x === pos.x && o.y === pos.y)
  );
  return pos;
}

export default function useSnakeEngine(prefersReducedMotion = false) {
  const canvasRef = useRef(null);
  const [gamePhase, setGamePhase] = useState('start');
  const [displayScore, setDisplayScore] = useState(0);
  const [displayLength, setDisplayLength] = useState(SNAKE.INITIAL_LENGTH);
  const [displaySpeed, setDisplaySpeed] = useState(1);

  const state = useRef({
    phase: 'start',
    snake: [],
    direction: SNAKE.INITIAL_DIRECTION,
    nextDirection: SNAKE.INITIAL_DIRECTION,
    food: null,
    virus: null,
    score: 0,
    length: SNAKE.INITIAL_LENGTH,
    speedTier: 1,
    foodEaten: 0,
    tickAccumulator: 0,
    currentTick: SPEED.BASE_TICK,
    glitchTimer: 0,
    glitchMaxDuration: GAME.SCREEN_SHAKE_DURATION,
    shakeTimer: 0,
    corruptedCells: [],
    corruptionTimer: 0,
    speedUpTimer: 0,
    speedUpTier: 1,
    virusSpawnTimer: FOOD.BONUS_SPAWN_INTERVAL,
    virusDespawnTimer: 0,
    ambientCorruption: [],
    gridCols: 0,
    gridRows: 0,
    width: 0,
    height: 0,
    keys: {},
    time: 0,
  });

  const resetGame = useCallback((width, height) => {
    const s = state.current;
    const cellSize = GRID.CELL_SIZE;
    const cols = Math.floor(width / cellSize);
    const rows = Math.floor((height - GRID.HUD_HEIGHT) / cellSize);
    s.gridCols = cols;
    s.gridRows = rows;

    // Build initial snake in center
    const startX = Math.floor(cols / 2);
    const startY = Math.floor(rows / 2);
    s.snake = [];
    for (let i = 0; i < SNAKE.INITIAL_LENGTH; i++) {
      s.snake.push({ x: startX - i, y: startY });
    }

    s.direction = SNAKE.INITIAL_DIRECTION;
    s.nextDirection = SNAKE.INITIAL_DIRECTION;
    s.score = 0;
    s.length = SNAKE.INITIAL_LENGTH;
    s.speedTier = 1;
    s.foodEaten = 0;
    s.tickAccumulator = 0;
    s.currentTick = SPEED.BASE_TICK;
    s.glitchTimer = 0;
    s.shakeTimer = 0;
    s.corruptedCells = [];
    s.corruptionTimer = 0;
    s.speedUpTimer = 0;
    s.virusSpawnTimer = FOOD.BONUS_SPAWN_INTERVAL;
    s.virusDespawnTimer = 0;
    s.virus = null;
    s.ambientCorruption = [];
    s.phase = 'playing';

    s.food = randomGridPos(cols, rows, s.snake);

    setGamePhase('playing');
    setDisplayScore(0);
    setDisplayLength(SNAKE.INITIAL_LENGTH);
    setDisplaySpeed(1);
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

      // Recompute grid dimensions
      const cols = Math.floor(rect.width / GRID.CELL_SIZE);
      const rows = Math.floor((rect.height - GRID.HUD_HEIGHT) / GRID.CELL_SIZE);
      state.current.gridCols = cols;
      state.current.gridRows = rows;
    }
    resize();
    window.addEventListener('resize', resize);

    function onKeyDown(e) {
      state.current.keys[e.code] = true;

      if (e.code === 'Enter') {
        const s = state.current;
        if (s.phase === 'start' || s.phase === 'gameOver') {
          resetGame(s.width, s.height);
        }
      }

      // Direction changes
      const s = state.current;
      if (s.phase === 'playing') {
        let newDir = null;
        if (e.code === 'ArrowUp' || e.code === 'KeyW') newDir = 'UP';
        else if (e.code === 'ArrowDown' || e.code === 'KeyS') newDir = 'DOWN';
        else if (e.code === 'ArrowLeft' || e.code === 'KeyA') newDir = 'LEFT';
        else if (e.code === 'ArrowRight' || e.code === 'KeyD') newDir = 'RIGHT';

        if (newDir && OPPOSITES[newDir] !== s.direction) {
          s.nextDirection = newDir;
        }
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    }

    function onKeyUp(e) {
      state.current.keys[e.code] = false;
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

      const cellSize = GRID.CELL_SIZE;
      const cols = s.gridCols;
      const rows = s.gridRows;
      const offsetY = GRID.HUD_HEIGHT;

      ctx.clearRect(0, 0, width, height);

      // ── Start screen ──
      if (s.phase === 'start') {
        drawStartScreen(ctx, width, height);
        return;
      }

      // ── Game Over ──
      if (s.phase === 'gameOver') {
        drawGrid(ctx, cols, rows, cellSize, offsetY);
        drawWalls(ctx, cols, rows, cellSize, offsetY);
        drawSnake(ctx, s.snake, cellSize, offsetY);
        drawGameOver(ctx, s.score, width, height);
        return;
      }

      // ── Playing ──

      // Movement tick
      s.tickAccumulator += dtMs;
      if (s.tickAccumulator >= s.currentTick) {
        s.tickAccumulator -= s.currentTick;
        s.direction = s.nextDirection;

        const dir = DIRECTIONS[s.direction];
        const head = s.snake[0];
        const newHead = { x: head.x + dir.x, y: head.y + dir.y };

        // Wall collision
        if (newHead.x < 0 || newHead.x >= cols || newHead.y < 0 || newHead.y >= rows) {
          handleDeath(s);
          return;
        }

        // Self collision
        for (let i = 0; i < s.snake.length; i++) {
          if (s.snake[i].x === newHead.x && s.snake[i].y === newHead.y) {
            handleDeath(s);
            return;
          }
        }

        s.snake.unshift(newHead);

        // Food collision
        let grew = false;
        if (s.food && newHead.x === s.food.x && newHead.y === s.food.y) {
          s.score += FOOD.POINTS;
          s.length++;
          s.foodEaten++;
          grew = true;
          setDisplayScore(s.score);
          setDisplayLength(s.length);

          s.food = randomGridPos(cols, rows, s.snake);

          // Speed tier check
          if (s.foodEaten % SPEED.SPEED_UP_EVERY === 0) {
            const newTick = Math.max(SPEED.MIN_TICK, s.currentTick - SPEED.TICK_REDUCTION);
            if (newTick < s.currentTick) {
              s.currentTick = newTick;
              s.speedTier++;
              s.speedUpTimer = GAME.SPEED_UP_FLASH_DURATION;
              s.speedUpTier = s.speedTier;
              setDisplaySpeed(s.speedTier);
            }
          }

          if (!prefersReducedMotion) {
            s.glitchTimer = GLITCH.FOOD_EAT.duration;
            s.glitchMaxDuration = GLITCH.FOOD_EAT.duration;
            window.dispatchEvent(new CustomEvent('snakeGlitch', {
              detail: { intensity: GLITCH.FOOD_EAT.intensity, type: 'food' },
            }));
          }
        }

        // Virus collision
        if (s.virus && newHead.x === s.virus.x && newHead.y === s.virus.y) {
          s.score += FOOD.BONUS_POINTS;
          s.length++;
          grew = true;
          setDisplayScore(s.score);
          setDisplayLength(s.length);
          s.virus = null;
          s.virusDespawnTimer = 0;
          s.virusSpawnTimer = FOOD.BONUS_SPAWN_INTERVAL;

          // Trigger corruption
          s.corruptionTimer = GLITCH.CORRUPTION_DURATION;
          s.corruptedCells = [];
          const numCorrupt = 8 + Math.floor(Math.random() * 8);
          for (let i = 0; i < numCorrupt; i++) {
            s.corruptedCells.push({
              x: Math.floor(Math.random() * cols),
              y: Math.floor(Math.random() * rows),
            });
          }

          if (!prefersReducedMotion) {
            s.glitchTimer = GLITCH.VIRUS_EAT.duration;
            s.glitchMaxDuration = GLITCH.VIRUS_EAT.duration;
            s.shakeTimer = GAME.SCREEN_SHAKE_DURATION;
            window.dispatchEvent(new CustomEvent('snakeGlitch', {
              detail: { intensity: GLITCH.VIRUS_EAT.intensity, type: 'virus' },
            }));
          }
        }

        if (!grew) {
          s.snake.pop();
        }
      }

      // Virus spawn/despawn timers
      if (!s.virus) {
        s.virusSpawnTimer -= dtMs;
        if (s.virusSpawnTimer <= 0) {
          const occupied = [...s.snake];
          if (s.food) occupied.push(s.food);
          s.virus = randomGridPos(cols, rows, occupied);
          s.virusDespawnTimer = FOOD.BONUS_DESPAWN_TIME;
        }
      } else {
        s.virusDespawnTimer -= dtMs;
        if (s.virusDespawnTimer <= 0) {
          s.virus = null;
          s.virusSpawnTimer = FOOD.BONUS_SPAWN_INTERVAL;
        }
      }

      // Corruption timer
      if (s.corruptionTimer > 0) {
        s.corruptionTimer -= dtMs;
        if (s.corruptionTimer <= 0) {
          s.corruptedCells = [];
          s.corruptionTimer = 0;
        }
      }

      // Speed up flash timer
      if (s.speedUpTimer > 0) {
        s.speedUpTimer -= dt;
      }

      // Glitch/shake timers
      if (s.glitchTimer > 0) s.glitchTimer -= dt;
      if (s.shakeTimer > 0) s.shakeTimer -= dt;

      // Ambient corruption (scales with speed tier)
      s.ambientCorruption = [];
      if (!prefersReducedMotion && s.speedTier > 2) {
        const chance = GLITCH.AMBIENT_BASE_CHANCE * (s.speedTier - 2);
        for (let i = 0; i < cols * rows * chance * 0.1; i++) {
          if (Math.random() < chance) {
            s.ambientCorruption.push({
              x: Math.floor(Math.random() * cols),
              y: Math.floor(Math.random() * rows),
            });
          }
        }
      }

      // ── Render ──
      let shakeX = 0, shakeY = 0;
      if (s.shakeTimer > 0 && !prefersReducedMotion) {
        const intensity = (s.shakeTimer / GAME.SCREEN_SHAKE_DURATION) * GAME.SCREEN_SHAKE_INTENSITY;
        shakeX = (Math.random() - 0.5) * intensity * 2;
        shakeY = (Math.random() - 0.5) * intensity * 2;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      drawGrid(ctx, cols, rows, cellSize, offsetY);
      drawWalls(ctx, cols, rows, cellSize, offsetY);

      if (s.ambientCorruption.length > 0) {
        drawCorruption(ctx, s.ambientCorruption, cellSize, offsetY);
      }
      if (s.corruptedCells.length > 0) {
        drawCorruption(ctx, s.corruptedCells, cellSize, offsetY);
      }

      drawFood(ctx, s.food, cellSize, offsetY, s.time);
      drawVirus(ctx, s.virus, cellSize, offsetY, s.time);
      drawSnake(ctx, s.snake, cellSize, offsetY);

      ctx.restore();

      drawHUD(ctx, s.score, s.length, s.speedTier, width);

      if (s.speedUpTimer > 0) {
        const alpha = s.speedUpTimer / GAME.SPEED_UP_FLASH_DURATION;
        drawSpeedUp(ctx, s.speedUpTier, width, height, alpha);
      }

      if (s.glitchTimer > 0 && !prefersReducedMotion) {
        const intensity = s.glitchTimer / s.glitchMaxDuration;
        drawGlitchEffect(ctx, width, height, intensity);
      }
    }

    function handleDeath(s) {
      s.phase = 'gameOver';
      setGamePhase('gameOver');

      if (!prefersReducedMotion) {
        s.glitchTimer = GLITCH.DEATH.duration;
        s.glitchMaxDuration = GLITCH.DEATH.duration;
        s.shakeTimer = GAME.SCREEN_SHAKE_DURATION;
        window.dispatchEvent(new CustomEvent('snakeGlitch', {
          detail: { intensity: GLITCH.DEATH.intensity, type: 'death' },
        }));
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

  return { canvasRef, gamePhase, score: displayScore, length: displayLength, speed: displaySpeed };
}
