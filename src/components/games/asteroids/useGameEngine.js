import { useRef, useEffect, useCallback, useState } from 'react';
import {
  Ship, AsteroidEntity, BulletEntity,
  createExplosion, createThrustParticle,
} from './entities.js';
import {
  drawShip, drawAsteroid, drawBullet, drawParticles,
  drawHUD, drawStartScreen, drawGameOver,
  drawLevelTransition, drawGlitchEffect,
} from './renderer.js';
import {
  SHIP, BULLET, GAME, LEVELS, ASTEROID_SIZES, PARTICLE, HIT_GLITCH,
} from './constants.js';

// ── Collision detection (circle vs circle) ────────────────────────

function circlesCollide(a, ar, b, br) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy < (ar + br) * (ar + br);
}

// ── Spawn asteroids for a level ───────────────────────────────────

function spawnAsteroids(level, width, height, shipX, shipY) {
  const count = Math.min(
    LEVELS.BASE_ASTEROIDS + (level - 1) * LEVELS.ASTEROIDS_PER_LEVEL,
    LEVELS.MAX_ASTEROIDS,
  );
  const asteroids = [];
  for (let i = 0; i < count; i++) {
    let x, y;
    // Keep away from ship
    do {
      x = Math.random() * width;
      y = Math.random() * height;
    } while (
      Math.sqrt((x - shipX) ** 2 + (y - shipY) ** 2) < 150
    );
    const a = new AsteroidEntity(x, y, 'LARGE', width, height);
    // Scale speed with level
    const speedMult = 1 + (level - 1) * LEVELS.SPEED_SCALE_PER_LEVEL;
    a.vx *= speedMult;
    a.vy *= speedMult;
    asteroids.push(a);
  }
  return asteroids;
}

// ── The hook ──────────────────────────────────────────────────────

export default function useGameEngine(prefersReducedMotion = false) {
  const canvasRef = useRef(null);
  const [gamePhase, setGamePhase] = useState('start'); // 'start' | 'playing' | 'gameOver'
  const [displayScore, setDisplayScore] = useState(0);
  const [displayLives, setDisplayLives] = useState(GAME.STARTING_LIVES);
  const [displayLevel, setDisplayLevel] = useState(1);

  // All mutable game state lives in a ref to avoid re-render churn
  const state = useRef({
    phase: 'start',
    score: 0,
    lives: GAME.STARTING_LIVES,
    level: 1,
    nextExtraLife: GAME.EXTRA_LIFE_SCORE,
    ship: null,
    asteroids: [],
    bullets: [],
    particles: [],
    glitchTimer: 0,
    glitchMaxDuration: GAME.GLITCH_DURATION, // tracks which duration to normalize against
    shakeTimer: 0,
    levelTransitionTimer: 0,
    respawnTimer: 0,
    keys: {},
    width: 0,
    height: 0,
  });

  const resetGame = useCallback((width, height) => {
    const s = state.current;
    s.phase = 'playing';
    s.score = 0;
    s.lives = GAME.STARTING_LIVES;
    s.level = 1;
    s.nextExtraLife = GAME.EXTRA_LIFE_SCORE;
    s.ship = new Ship(width / 2, height / 2);
    s.asteroids = spawnAsteroids(1, width, height, width / 2, height / 2);
    s.bullets = [];
    s.particles = [];
    s.glitchTimer = 0;
    s.glitchMaxDuration = GAME.GLITCH_DURATION;
    s.shakeTimer = 0;
    s.levelTransitionTimer = 0;
    s.respawnTimer = 0;
    setGamePhase('playing');
    setDisplayScore(0);
    setDisplayLives(GAME.STARTING_LIVES);
    setDisplayLevel(1);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Sizing
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

    // Input
    function onKeyDown(e) {
      state.current.keys[e.code] = true;

      if (e.code === 'Enter') {
        const s = state.current;
        if (s.phase === 'start') {
          resetGame(s.width, s.height);
        } else if (s.phase === 'gameOver') {
          resetGame(s.width, s.height);
        }
      }

      // Prevent page scroll on game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    }

    function onKeyUp(e) {
      state.current.keys[e.code] = false;
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Game loop
    let lastTime = 0;
    let rafId;

    function loop(timestamp) {
      rafId = requestAnimationFrame(loop);

      const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0.016;
      lastTime = timestamp;

      const s = state.current;
      const { width, height } = s;
      if (width === 0 || height === 0) return;

      // Clear
      ctx.clearRect(0, 0, width, height);

      // ── Start screen ──
      if (s.phase === 'start') {
        drawStartScreen(ctx, width, height);
        return;
      }

      // ── Game Over screen ──
      if (s.phase === 'gameOver') {
        // Still draw remaining particles
        for (const p of s.particles) p.update(dt);
        s.particles = s.particles.filter(p => p.alive);
        // Draw asteroids drifting
        for (const a of s.asteroids) a.update(dt);
        for (const a of s.asteroids) drawAsteroid(ctx, a);
        drawParticles(ctx, s.particles);
        drawGameOver(ctx, s.score, width, height);
        return;
      }

      // ── Playing ──
      const keys = s.keys;
      const ship = s.ship;

      // Ship input
      if (ship.alive) {
        if (keys['ArrowLeft'] || keys['KeyA']) {
          ship.rotation -= SHIP.ROTATION_SPEED * dt;
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
          ship.rotation += SHIP.ROTATION_SPEED * dt;
        }
        ship.thrusting = !!(keys['ArrowUp'] || keys['KeyW']);

        // Fire
        if (keys['Space'] && ship.fireCooldown <= 0 && s.bullets.length < BULLET.MAX_ON_SCREEN) {
          const nose = ship.getVertices()[0];
          s.bullets.push(new BulletEntity(nose.x, nose.y, ship.rotation));
          ship.fireCooldown = SHIP.FIRE_RATE;
        }

        // Thrust particles
        if (ship.thrusting && Math.random() > 0.5) {
          const tp = ship.getThrustPoint();
          s.particles.push(createThrustParticle(tp.x, tp.y));
        }
      }

      // Respawn logic
      if (!ship.alive) {
        s.respawnTimer -= dt;
        if (s.respawnTimer <= 0 && s.lives > 0) {
          ship.x = width / 2;
          ship.y = height / 2;
          ship.vx = 0;
          ship.vy = 0;
          ship.rotation = -Math.PI / 2;
          ship.alive = true;
          ship.invincibleTimer = SHIP.INVINCIBILITY_TIME;
        }
      }

      // Update entities
      ship.update(dt, width, height);
      for (const b of s.bullets) b.update(dt, width, height);
      for (const a of s.asteroids) a.update(dt);
      for (const p of s.particles) p.update(dt);

      // Remove dead bullets/particles
      s.bullets = s.bullets.filter(b => b.alive);
      s.particles = s.particles.filter(p => p.alive);

      // ── Collisions ──

      // Bullet ↔ Asteroid
      const newAsteroids = [];
      for (let ai = s.asteroids.length - 1; ai >= 0; ai--) {
        const a = s.asteroids[ai];
        let hit = false;
        for (let bi = s.bullets.length - 1; bi >= 0; bi--) {
          const b = s.bullets[bi];
          if (circlesCollide(a, a.radius, b, BULLET.SIZE)) {
            b.alive = false;
            hit = true;
            break;
          }
        }
        if (hit) {
          // Score
          s.score += a.points;
          setDisplayScore(s.score);

          // Extra life check
          if (s.score >= s.nextExtraLife) {
            s.lives++;
            s.nextExtraLife += GAME.EXTRA_LIFE_SCORE;
            setDisplayLives(s.lives);
          }

          // Explosion particles
          s.particles.push(...createExplosion(a.x, a.y));

          // Split
          const children = a.split();
          newAsteroids.push(...children);

          // Screen shake
          if (!prefersReducedMotion) {
            s.shakeTimer = GAME.SCREEN_SHAKE_DURATION;
          }

          // Hit glitch — scaled by asteroid size, probabilistic
          if (!prefersReducedMotion) {
            const glitchCfg = HIT_GLITCH[a.size];
            if (glitchCfg && Math.random() < glitchCfg.chance) {
              // Only override if this hit is stronger than current glitch
              if (glitchCfg.duration > s.glitchTimer) {
                s.glitchTimer = glitchCfg.duration;
                s.glitchMaxDuration = glitchCfg.duration;
              }
              // Notify page-level CRT effects
              window.dispatchEvent(new CustomEvent('asteroidGlitch', {
                detail: { intensity: glitchCfg.intensity, size: a.size },
              }));
            }
          }

          // Remove destroyed asteroid
          s.asteroids.splice(ai, 1);
        }
      }
      s.asteroids.push(...newAsteroids);

      // Clean dead bullets after collision pass
      s.bullets = s.bullets.filter(b => b.alive);

      // Ship ↔ Asteroid
      if (ship.alive && !ship.invincible) {
        for (const a of s.asteroids) {
          if (circlesCollide(ship, SHIP.SIZE, a, a.radius)) {
            // Ship destroyed
            ship.alive = false;
            s.lives--;
            setDisplayLives(s.lives);
            s.respawnTimer = GAME.RESPAWN_DELAY;
            s.particles.push(...createExplosion(ship.x, ship.y, PARTICLE.COUNT_PER_EXPLOSION * 2));

            if (!prefersReducedMotion) {
              s.glitchTimer = GAME.GLITCH_DURATION;
              s.glitchMaxDuration = GAME.GLITCH_DURATION;
              s.shakeTimer = GAME.SCREEN_SHAKE_DURATION;
              window.dispatchEvent(new CustomEvent('asteroidGlitch', {
                detail: { intensity: 1.0, size: 'DEATH' },
              }));
            }

            if (s.lives <= 0) {
              s.phase = 'gameOver';
              setGamePhase('gameOver');
            }
            break;
          }
        }
      }

      // ── Level complete ──
      if (s.asteroids.length === 0 && s.levelTransitionTimer <= 0) {
        s.level++;
        setDisplayLevel(s.level);
        s.levelTransitionTimer = LEVELS.TRANSITION_DURATION;
        s.asteroids = spawnAsteroids(s.level, width, height, ship.x, ship.y);
      }

      // ── Timers ──
      if (s.glitchTimer > 0) s.glitchTimer -= dt;
      if (s.shakeTimer > 0) s.shakeTimer -= dt;
      if (s.levelTransitionTimer > 0) s.levelTransitionTimer -= dt;

      // ── Render ──

      // Screen shake offset
      let shakeX = 0, shakeY = 0;
      if (s.shakeTimer > 0 && !prefersReducedMotion) {
        const intensity = (s.shakeTimer / GAME.SCREEN_SHAKE_DURATION) * GAME.SCREEN_SHAKE_INTENSITY;
        shakeX = (Math.random() - 0.5) * intensity * 2;
        shakeY = (Math.random() - 0.5) * intensity * 2;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // Draw everything
      for (const a of s.asteroids) drawAsteroid(ctx, a);
      for (const b of s.bullets) drawBullet(ctx, b);
      drawParticles(ctx, s.particles);
      drawShip(ctx, ship);

      ctx.restore();

      // HUD (not affected by shake)
      drawHUD(ctx, s.score, s.lives, s.level, width);

      // Level transition overlay
      if (s.levelTransitionTimer > LEVELS.TRANSITION_DURATION * 0.5) {
        drawLevelTransition(ctx, s.level, width, height);
      }

      // Glitch effect (scales to whichever duration is active)
      if (s.glitchTimer > 0 && !prefersReducedMotion) {
        const intensity = s.glitchTimer / s.glitchMaxDuration;
        drawGlitchEffect(ctx, width, height, intensity);
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

  return { canvasRef, gamePhase, score: displayScore, lives: displayLives, level: displayLevel };
}
