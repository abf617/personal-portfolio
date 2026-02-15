import { useRef, useEffect, useCallback, useState } from 'react';
import {
  COLORS, TUBE, LEVEL_SHAPES, PLAYER, BULLET, ENEMIES, LEVELS,
  SUPERZAPPER, GLOW, PARTICLE, GAME, HIT_GLITCH,
} from './constants.js';
import {
  computeTubeState, getEntityScreenPos,
  drawTube, drawPlayer, drawBullet,
  drawFlipper, drawTanker, drawSpiker, drawSpikeTrail, drawPulsar, drawPulsarLaneEffect,
  drawParticles, drawHUD, drawStartScreen, drawGameOver,
  drawLevelComplete, drawWarpEffect, drawSuperzapperFlash, drawGlitchEffect,
} from './renderer.js';

function createExplosion(x, y, count = PARTICLE.COUNT_PER_EXPLOSION) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = PARTICLE.SPEED_MIN + Math.random() * (PARTICLE.SPEED_MAX - PARTICLE.SPEED_MIN);
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      lifetime: PARTICLE.LIFETIME,
      age: 0,
      alpha: 1,
      color: COLORS.PARTICLE_POOL[Math.floor(Math.random() * COLORS.PARTICLE_POOL.length)],
      alive: true,
    });
  }
  return particles;
}

function buildSpawnQueue(level) {
  const queue = [];
  const cycleIndex = (level - 1) % 16;
  const totalEnemies = LEVELS.ENEMY_COUNTS[cycleIndex];

  const types = [];
  types.push('FLIPPER');
  if (level >= LEVELS.TANKER_START) types.push('TANKER');
  if (level >= LEVELS.SPIKER_START) types.push('SPIKER');
  if (level >= LEVELS.PULSAR_START) types.push('PULSAR');

  for (let i = 0; i < totalEnemies; i++) {
    queue.push(types[Math.floor(Math.random() * types.length)]);
  }
  return queue;
}

function getSpawnInterval(level) {
  return Math.max(
    LEVELS.MIN_SPAWN_INTERVAL,
    LEVELS.BASE_SPAWN_INTERVAL - (level - 1) * LEVELS.SPAWN_INTERVAL_DECAY
  );
}

function getSpeedScale(level) {
  const cycle = Math.floor((level - 1) / 16);
  return 1 + cycle * LEVELS.SPEED_SCALE_PER_CYCLE;
}

export default function useTempestEngine(prefersReducedMotion = false) {
  const canvasRef = useRef(null);
  const [gamePhase, setGamePhase] = useState('start');
  const [displayScore, setDisplayScore] = useState(0);
  const [displayLives, setDisplayLives] = useState(GAME.STARTING_LIVES);
  const [displayLevel, setDisplayLevel] = useState(1);

  const state = useRef({
    phase: 'start',
    score: 0,
    lives: GAME.STARTING_LIVES,
    level: 1,
    nextExtraLife: GAME.EXTRA_LIFE_SCORE,
    playerLane: 0,
    moveCooldown: 0,
    fireCooldown: 0,
    bullets: [],
    enemies: [],
    particles: [],
    spikes: {},
    spawnQueue: [],
    spawnTimer: 0,
    zapperCharges: SUPERZAPPER.CHARGES_PER_LEVEL,
    zapperFlash: 0,
    glitchTimer: 0,
    glitchMaxDuration: GAME.GLITCH_DURATION,
    shakeTimer: 0,
    levelCompleteTimer: 0,
    warpProgress: 0,
    deathTimer: 0,
    keys: {},
    width: 0,
    height: 0,
    time: 0,
  });

  const resetGame = useCallback((width, height) => {
    const s = state.current;
    s.phase = 'playing';
    s.score = 0;
    s.lives = GAME.STARTING_LIVES;
    s.level = 1;
    s.nextExtraLife = GAME.EXTRA_LIFE_SCORE;
    s.playerLane = 0;
    s.moveCooldown = 0;
    s.fireCooldown = 0;
    s.bullets = [];
    s.enemies = [];
    s.particles = [];
    s.spikes = {};
    s.spawnQueue = buildSpawnQueue(1);
    s.spawnTimer = 1.0;
    s.zapperCharges = SUPERZAPPER.CHARGES_PER_LEVEL;
    s.zapperFlash = 0;
    s.glitchTimer = 0;
    s.glitchMaxDuration = GAME.GLITCH_DURATION;
    s.shakeTimer = 0;
    s.levelCompleteTimer = 0;
    s.warpProgress = 0;
    s.deathTimer = 0;
    s.time = 0;
    setGamePhase('playing');
    setDisplayScore(0);
    setDisplayLives(GAME.STARTING_LIVES);
    setDisplayLevel(1);
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
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas.parentElement);

    function onKeyDown(e) {
      state.current.keys[e.code] = true;

      if (e.code === 'Enter') {
        const s = state.current;
        if (s.phase === 'start' || s.phase === 'gameOver') {
          resetGame(s.width, s.height);
        }
      }

      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyA', 'KeyD', 'KeyW', 'KeyZ', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
        e.preventDefault();
      }
    }

    function onKeyUp(e) {
      state.current.keys[e.code] = false;
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    function doKillPlayer(s, tubeState) {
      if (s.deathTimer > 0) return;
      const pos = getEntityScreenPos(tubeState, s.playerLane, 0);
      s.particles.push(...createExplosion(pos.x, pos.y, PARTICLE.COUNT_PER_EXPLOSION * 2));
      s.lives--;
      setDisplayLives(s.lives);
      s.deathTimer = PLAYER.DEATH_ANIM_DURATION;

      if (!prefersReducedMotion) {
        s.glitchTimer = HIT_GLITCH.DEATH.duration;
        s.glitchMaxDuration = HIT_GLITCH.DEATH.duration;
        s.shakeTimer = GAME.SCREEN_SHAKE_DURATION;
        window.dispatchEvent(new CustomEvent('tempestGlitch', {
          detail: { intensity: HIT_GLITCH.DEATH.intensity, type: 'DEATH' },
        }));
      }
    }

    let lastTime = 0;
    let rafId;

    function loop(timestamp) {
      rafId = requestAnimationFrame(loop);

      const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0.016;
      lastTime = timestamp;

      const s = state.current;
      const { width, height } = s;
      if (width === 0 || height === 0) return;
      s.time += dt;

      ctx.clearRect(0, 0, width, height);

      const shapeIndex = (s.level - 1) % LEVEL_SHAPES.length;
      const shape = LEVEL_SHAPES[shapeIndex];
      const cx = width / 2;
      const cy = height / 2;
      const outerRadius = Math.min(width, height) * TUBE.OUTER_RADIUS_FACTOR;
      const tubeState = computeTubeState(shape, cx, cy, outerRadius, s.time);
      const laneCount = tubeState.laneCount;

      // -- Start screen --
      if (s.phase === 'start') {
        drawTube(ctx, tubeState, s.time, 1);
        drawStartScreen(ctx, width, height);
        return;
      }

      // -- Game over --
      if (s.phase === 'gameOver') {
        for (const p of s.particles) updateParticle(p, dt);
        s.particles = s.particles.filter(p => p.alive);
        drawTube(ctx, tubeState, s.time, s.level);
        drawParticles(ctx, s.particles);
        drawGameOver(ctx, s.score, width, height);
        return;
      }

      // -- Level complete --
      if (s.phase === 'levelComplete') {
        s.levelCompleteTimer -= dt;
        const alpha = Math.min(1, s.levelCompleteTimer / (LEVELS.TRANSITION_DURATION * 0.5));
        drawTube(ctx, tubeState, s.time, s.level);
        drawPlayer(ctx, tubeState, s.playerLane);
        drawLevelComplete(ctx, s.level, width, height, Math.max(0, alpha));

        if (s.levelCompleteTimer <= 0) {
          s.phase = 'warping';
          s.warpProgress = 0;
        }
        return;
      }

      // -- Warping --
      if (s.phase === 'warping') {
        s.warpProgress += dt / LEVELS.WARP_DURATION;
        drawTube(ctx, tubeState, s.time, s.level);

        if (!prefersReducedMotion) {
          drawWarpEffect(ctx, tubeState, Math.min(1, s.warpProgress), width, height);
        }

        if (s.warpProgress >= 1) {
          s.level++;
          setDisplayLevel(s.level);
          s.phase = 'playing';
          s.spawnQueue = buildSpawnQueue(s.level);
          s.spawnTimer = 1.0;
          s.enemies = [];
          s.bullets = [];
          s.spikes = {};
          s.zapperCharges = SUPERZAPPER.CHARGES_PER_LEVEL;
          s.warpProgress = 0;

          if (!prefersReducedMotion) {
            window.dispatchEvent(new CustomEvent('tempestGlitch', {
              detail: { intensity: HIT_GLITCH.WARP.intensity, type: 'WARP' },
            }));
          }
        }
        return;
      }

      // -- Playing --
      const keys = s.keys;

      // Player movement (lane-based, with cooldown)
      if (s.moveCooldown > 0) s.moveCooldown -= dt;
      if (s.deathTimer > 0) {
        s.deathTimer -= dt;
        if (s.deathTimer <= 0) {
          if (s.lives <= 0) {
            s.phase = 'gameOver';
            setGamePhase('gameOver');
          }
        }
      }

      const playerAlive = s.deathTimer <= 0;

      if (playerAlive && s.moveCooldown <= 0) {
        if (keys['ArrowLeft'] || keys['KeyA']) {
          if (shape.closed) {
            s.playerLane = ((s.playerLane - 1) + laneCount) % laneCount;
          } else {
            s.playerLane = Math.max(0, s.playerLane - 1);
          }
          s.moveCooldown = PLAYER.MOVE_COOLDOWN;
        } else if (keys['ArrowRight'] || keys['KeyD']) {
          if (shape.closed) {
            s.playerLane = (s.playerLane + 1) % laneCount;
          } else {
            s.playerLane = Math.min(laneCount - 1, s.playerLane + 1);
          }
          s.moveCooldown = PLAYER.MOVE_COOLDOWN;
        }
      }

      // Fire
      if (s.fireCooldown > 0) s.fireCooldown -= dt;
      if (playerAlive && (keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && s.fireCooldown <= 0 && s.bullets.length < BULLET.MAX_ON_SCREEN) {
        s.bullets.push({ lane: s.playerLane, depth: 0 });
        s.fireCooldown = PLAYER.FIRE_RATE;
      }

      // Superzapper
      if (playerAlive && (keys['KeyZ'] || keys['ShiftLeft'] || keys['ShiftRight'])) {
        if (s.zapperCharges > 0 && !s._zapperUsed) {
          s._zapperUsed = true;
          const isFirst = s.zapperCharges === SUPERZAPPER.CHARGES_PER_LEVEL;
          s.zapperCharges--;
          s.zapperFlash = 0.3;

          if (isFirst && s.enemies.length > 0) {
            // First use: kill all
            for (const en of s.enemies) {
              s.score += getEnemyPoints(en.type);
              const pos = getEntityScreenPos(tubeState, en.lane, en.depth);
              s.particles.push(...createExplosion(pos.x, pos.y, 6));
            }
            s.enemies = [];
          } else if (s.enemies.length > 0) {
            // Second use: kill one random
            const idx = Math.floor(Math.random() * s.enemies.length);
            const en = s.enemies[idx];
            s.score += getEnemyPoints(en.type);
            const pos = getEntityScreenPos(tubeState, en.lane, en.depth);
            s.particles.push(...createExplosion(pos.x, pos.y, 6));
            s.enemies.splice(idx, 1);
          }

          setDisplayScore(s.score);

          if (!prefersReducedMotion) {
            s.glitchTimer = HIT_GLITCH.SUPERZAPPER.duration;
            s.glitchMaxDuration = HIT_GLITCH.SUPERZAPPER.duration;
            window.dispatchEvent(new CustomEvent('tempestGlitch', {
              detail: { intensity: HIT_GLITCH.SUPERZAPPER.intensity, type: 'SUPERZAPPER' },
            }));
          }
        }
      } else {
        s._zapperUsed = false;
      }

      // Update bullets
      const speedScale = getSpeedScale(s.level);
      for (const b of s.bullets) {
        b.depth += BULLET.SPEED * dt;
      }
      s.bullets = s.bullets.filter(b => b.depth <= 1.05);

      // Spawn enemies
      if (s.spawnQueue.length > 0) {
        s.spawnTimer -= dt;
        if (s.spawnTimer <= 0) {
          const type = s.spawnQueue.shift();
          const lane = Math.floor(Math.random() * laneCount);
          s.enemies.push(createEnemy(type, lane));
          s.spawnTimer = getSpawnInterval(s.level);
        }
      }

      // Update enemies
      for (const en of s.enemies) {
        const baseSpeed = ENEMIES[en.type].speed * speedScale;

        if (en.type === 'FLIPPER') {
          // Flippers can change lanes
          if (en.flipTimer > 0) {
            en.flipTimer -= dt;
            en.flipProgress += dt / (1 / ENEMIES.FLIPPER.flipSpeed);
            if (en.flipTimer <= 0) {
              en.lane = en.flipTarget;
              en.flipProgress = 0;
            }
          } else if (en.depth < 0.7 && Math.random() < ENEMIES.FLIPPER.flipChance) {
            const dir = Math.random() < 0.5 ? -1 : 1;
            en.flipTarget = shape.closed
              ? ((en.lane + dir) + laneCount) % laneCount
              : Math.max(0, Math.min(laneCount - 1, en.lane + dir));
            en.flipTimer = 1 / ENEMIES.FLIPPER.flipSpeed;
            en.flipProgress = 0;
          }
          en.depth -= baseSpeed * dt;
        } else if (en.type === 'TANKER') {
          en.depth -= baseSpeed * dt;
        } else if (en.type === 'SPIKER') {
          en.depth -= ENEMIES.SPIKER.speed * speedScale * dt;
          en.trailTimer -= dt;
          if (en.trailTimer <= 0 && en.depth > 0.05) {
            if (!s.spikes[en.lane]) s.spikes[en.lane] = [];
            s.spikes[en.lane].push(en.depth);
            en.trailTimer = ENEMIES.SPIKER.trailInterval;
          }
        } else if (en.type === 'PULSAR') {
          en.depth -= ENEMIES.PULSAR.speed * speedScale * dt;
          en.pulseTimer -= dt;
          if (en.pulseTimer <= 0) {
            en.isActive = !en.isActive;
            en.pulseTimer = en.isActive ? ENEMIES.PULSAR.pulseDuration : ENEMIES.PULSAR.pulseInterval;
          }
        }
      }

      // Check enemies reaching rim (depth <= 0)
      for (let i = s.enemies.length - 1; i >= 0; i--) {
        const en = s.enemies[i];
        if (en.depth <= 0) {
          if (en.type === 'TANKER') {
            for (let c = 0; c < ENEMIES.TANKER.childCount; c++) {
              const childLane = shape.closed
                ? ((en.lane + (c === 0 ? -1 : 1)) + laneCount) % laneCount
                : Math.max(0, Math.min(laneCount - 1, en.lane + (c === 0 ? -1 : 1)));
              const child = createEnemy('FLIPPER', childLane);
              child.depth = 0.05;
              s.enemies.push(child);
            }
          }

          if (playerAlive && en.lane === s.playerLane) {
            doKillPlayer(s, tubeState);
          }
          s.enemies.splice(i, 1);
        }
      }

      // Pulsar lane electrification check
      if (playerAlive) {
        for (const en of s.enemies) {
          if (en.type === 'PULSAR' && en.isActive && en.lane === s.playerLane) {
            doKillPlayer(s, tubeState);
            break;
          }
        }
      }

      // Spike collision (player at rim, spike depth near 0)
      if (playerAlive && s.spikes[s.playerLane]) {
        const laneSp = s.spikes[s.playerLane];
        for (let i = laneSp.length - 1; i >= 0; i--) {
          if (laneSp[i] <= 0.03) {
            doKillPlayer(s, tubeState);
            laneSp.splice(i, 1);
            break;
          }
        }
      }

      // Bullet-enemy collisions (same lane + depth proximity)
      for (let bi = s.bullets.length - 1; bi >= 0; bi--) {
        const b = s.bullets[bi];
        let bulletHit = false;

        // Check against spike trails first
        if (s.spikes[b.lane]) {
          const laneSp = s.spikes[b.lane];
          for (let si = laneSp.length - 1; si >= 0; si--) {
            if (Math.abs(b.depth - laneSp[si]) < 0.05) {
              laneSp.splice(si, 1);
              bulletHit = true;
              break;
            }
          }
        }

        if (!bulletHit) {
          for (let ei = s.enemies.length - 1; ei >= 0; ei--) {
            const en = s.enemies[ei];
            if (en.lane === b.lane && Math.abs(b.depth - en.depth) < 0.06) {
              s.score += getEnemyPoints(en.type);
              setDisplayScore(s.score);

              if (s.score >= s.nextExtraLife) {
                s.lives++;
                s.nextExtraLife += GAME.EXTRA_LIFE_SCORE;
                setDisplayLives(s.lives);
              }

              const pos = getEntityScreenPos(tubeState, en.lane, en.depth);
              s.particles.push(...createExplosion(pos.x, pos.y));

              if (en.type === 'TANKER') {
                for (let c = 0; c < ENEMIES.TANKER.childCount; c++) {
                  const childLane = shape.closed
                    ? ((en.lane + (c === 0 ? -1 : 1)) + laneCount) % laneCount
                    : Math.max(0, Math.min(laneCount - 1, en.lane + (c === 0 ? -1 : 1)));
                  const child = createEnemy('FLIPPER', childLane);
                  child.depth = en.depth;
                  s.enemies.push(child);
                }
              }

              s.enemies.splice(ei, 1);
              bulletHit = true;

              if (!prefersReducedMotion) {
                s.shakeTimer = GAME.SCREEN_SHAKE_DURATION;
                if (Math.random() < HIT_GLITCH.KILL.chance) {
                  s.glitchTimer = HIT_GLITCH.KILL.duration;
                  s.glitchMaxDuration = HIT_GLITCH.KILL.duration;
                  window.dispatchEvent(new CustomEvent('tempestGlitch', {
                    detail: { intensity: HIT_GLITCH.KILL.intensity, type: 'KILL' },
                  }));
                }
              }
              break;
            }
          }
        }

        if (bulletHit) {
          s.bullets.splice(bi, 1);
        }
      }

      // Level complete check
      if (s.spawnQueue.length === 0 && s.enemies.length === 0 && s.phase === 'playing') {
        s.phase = 'levelComplete';
        s.levelCompleteTimer = LEVELS.TRANSITION_DURATION;

        if (!prefersReducedMotion) {
          window.dispatchEvent(new CustomEvent('tempestGlitch', {
            detail: { intensity: HIT_GLITCH.LEVEL_CLEAR.intensity, type: 'LEVEL_CLEAR' },
          }));
        }
      }

      // Update particles
      for (const p of s.particles) updateParticle(p, dt);
      s.particles = s.particles.filter(p => p.alive);

      // Timers
      if (s.glitchTimer > 0) s.glitchTimer -= dt;
      if (s.shakeTimer > 0) s.shakeTimer -= dt;
      if (s.zapperFlash > 0) s.zapperFlash -= dt;

      // -- Render --
      let shakeX = 0, shakeY = 0;
      if (s.shakeTimer > 0 && !prefersReducedMotion) {
        const intensity = (s.shakeTimer / GAME.SCREEN_SHAKE_DURATION) * GAME.SCREEN_SHAKE_INTENSITY;
        shakeX = (Math.random() - 0.5) * intensity * 2;
        shakeY = (Math.random() - 0.5) * intensity * 2;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      drawTube(ctx, tubeState, s.time, s.level);

      // Spike trails
      for (const lane in s.spikes) {
        if (s.spikes[lane].length > 0) {
          drawSpikeTrail(ctx, tubeState, parseInt(lane), s.spikes[lane]);
        }
      }

      // Enemies
      for (const en of s.enemies) {
        if (en.type === 'FLIPPER') {
          drawFlipper(ctx, tubeState, en.lane, en.depth, en.flipProgress || 0);
        } else if (en.type === 'TANKER') {
          drawTanker(ctx, tubeState, en.lane, en.depth);
        } else if (en.type === 'SPIKER') {
          drawSpiker(ctx, tubeState, en.lane, en.depth);
        } else if (en.type === 'PULSAR') {
          drawPulsar(ctx, tubeState, en.lane, en.depth, en.isActive);
          if (en.isActive) {
            drawPulsarLaneEffect(ctx, tubeState, en.lane, en.depth);
          }
        }
      }

      // Bullets
      for (const b of s.bullets) {
        drawBullet(ctx, tubeState, b.lane, b.depth);
      }

      // Player
      if (playerAlive) {
        drawPlayer(ctx, tubeState, s.playerLane);
      }

      drawParticles(ctx, s.particles);

      ctx.restore();

      // HUD (not shaken)
      drawHUD(ctx, s.score, s.lives, s.level, s.zapperCharges, width);

      // Superzapper flash
      if (s.zapperFlash > 0 && !prefersReducedMotion) {
        drawSuperzapperFlash(ctx, width, height, s.zapperFlash / 0.3);
      }

      // Glitch
      if (s.glitchTimer > 0 && !prefersReducedMotion) {
        const intensity = s.glitchTimer / s.glitchMaxDuration;
        drawGlitchEffect(ctx, width, height, intensity);
      }
    }

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [resetGame, prefersReducedMotion]);

  return { canvasRef, gamePhase, score: displayScore, lives: displayLives, level: displayLevel };
}

function createEnemy(type, lane) {
  const base = { type, lane, depth: 1.0 };
  if (type === 'FLIPPER') {
    return { ...base, flipTimer: 0, flipTarget: lane, flipProgress: 0 };
  }
  if (type === 'SPIKER') {
    return { ...base, trailTimer: ENEMIES.SPIKER.trailInterval };
  }
  if (type === 'PULSAR') {
    return { ...base, pulseTimer: ENEMIES.PULSAR.pulseInterval, isActive: false };
  }
  return base;
}

function getEnemyPoints(type) {
  return ENEMIES[type] ? ENEMIES[type].points : 0;
}

function updateParticle(p, dt) {
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.age += dt;
  p.alpha = Math.max(0, 1 - p.age / p.lifetime);
  if (p.age >= p.lifetime) p.alive = false;
}

