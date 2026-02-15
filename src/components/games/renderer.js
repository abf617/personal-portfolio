import { COLORS, GLOW, BULLET, SHIP } from './constants.js';

// ── Helpers ───────────────────────────────────────────────────────

function setGlow(ctx, color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function clearGlow(ctx) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

function drawPolygon(ctx, vertices, color, blur) {
  setGlow(ctx, color, blur);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);
  for (let i = 1; i < vertices.length; i++) {
    ctx.lineTo(vertices[i].x, vertices[i].y);
  }
  ctx.closePath();
  ctx.stroke();
  clearGlow(ctx);
}

// ── Ship ──────────────────────────────────────────────────────────

export function drawShip(ctx, ship) {
  if (!ship.alive) return;

  // Flicker when invincible
  if (ship.invincible && Math.floor(ship.invincibleTimer * 10) % 2 === 0) {
    return;
  }

  const verts = ship.getVertices();
  drawPolygon(ctx, verts, COLORS.SHIP, GLOW.SHIP_BLUR);

  // Thrust flame
  if (ship.thrusting) {
    const tp = ship.getThrustPoint();
    const flicker = 0.7 + Math.random() * 0.6;
    const flameLen = SHIP.SIZE * 0.8 * flicker;
    const cos = Math.cos(ship.rotation);
    const sin = Math.sin(ship.rotation);

    setGlow(ctx, COLORS.BULLET, 6);
    ctx.strokeStyle = COLORS.BULLET;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Left flame edge
    ctx.moveTo(
      tp.x + sin * SHIP.SIZE * 0.3,
      tp.y - cos * SHIP.SIZE * 0.3,
    );
    // Flame tip
    ctx.lineTo(
      tp.x - cos * flameLen,
      tp.y - sin * flameLen,
    );
    // Right flame edge
    ctx.lineTo(
      tp.x - sin * SHIP.SIZE * 0.3,
      tp.y + cos * SHIP.SIZE * 0.3,
    );
    ctx.stroke();
    clearGlow(ctx);
  }
}

// ── Asteroid ──────────────────────────────────────────────────────

export function drawAsteroid(ctx, asteroid) {
  const verts = asteroid.getVertices();
  drawPolygon(ctx, verts, COLORS.ASTEROID, GLOW.ASTEROID_BLUR);
}

// ── Bullet ────────────────────────────────────────────────────────

export function drawBullet(ctx, bullet) {
  setGlow(ctx, COLORS.BULLET, GLOW.BULLET_BLUR);
  ctx.fillStyle = COLORS.BULLET;
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, BULLET.SIZE, 0, Math.PI * 2);
  ctx.fill();

  // Trail
  const trailLen = 6;
  const nx = -bullet.vx / Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
  const ny = -bullet.vy / Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
  ctx.strokeStyle = COLORS.BULLET;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(bullet.x, bullet.y);
  ctx.lineTo(bullet.x + nx * trailLen, bullet.y + ny * trailLen);
  ctx.stroke();
  ctx.globalAlpha = 1;
  clearGlow(ctx);
}

// ── Particles ─────────────────────────────────────────────────────

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    if (!p.alive) continue;
    ctx.globalAlpha = p.alpha;
    setGlow(ctx, p.color, 4);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
    clearGlow(ctx);
  }
  ctx.globalAlpha = 1;
}

// ── HUD ───────────────────────────────────────────────────────────

export function drawHUD(ctx, score, lives, level, width) {
  const y = 30;
  const pad = 16;

  ctx.font = '14px "Space Mono", monospace';
  ctx.textBaseline = 'top';

  // Score (left)
  setGlow(ctx, COLORS.HUD, GLOW.HUD_BLUR);
  ctx.fillStyle = COLORS.HUD_LABEL;
  ctx.textAlign = 'left';
  ctx.fillText('> SCORE:', pad, y);
  ctx.fillStyle = COLORS.HUD;
  ctx.fillText(String(score).padStart(6, '0'), pad + ctx.measureText('> SCORE: ').width, y);

  // Lives (center)
  const livesText = 'LIVES: ' + '\u25A0'.repeat(Math.max(0, lives));
  ctx.fillStyle = COLORS.HUD_LABEL;
  ctx.textAlign = 'center';
  ctx.fillText(livesText, width / 2, y);

  // Level (right)
  ctx.fillStyle = COLORS.HUD_LABEL;
  ctx.textAlign = 'right';
  ctx.fillText('LEVEL: ' + String(level).padStart(2, '0'), width - pad, y);

  clearGlow(ctx);
}

// ── Start Screen ──────────────────────────────────────────────────

export function drawStartScreen(ctx, width, height) {
  // Title
  setGlow(ctx, COLORS.SHIP, 12);
  ctx.fillStyle = COLORS.SHIP;
  ctx.font = 'bold 36px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ASTEROIDS', width / 2, height / 2 - 50);
  clearGlow(ctx);

  // Subtitle
  setGlow(ctx, COLORS.ASTEROID, 6);
  ctx.fillStyle = COLORS.ASTEROID;
  ctx.font = '14px "Space Mono", monospace';
  ctx.fillText('[ CYBERPUNK EDITION ]', width / 2, height / 2 - 10);
  clearGlow(ctx);

  // Prompt — blink
  if (Math.floor(Date.now() / 600) % 2 === 0) {
    setGlow(ctx, COLORS.BULLET, 8);
    ctx.fillStyle = COLORS.BULLET;
    ctx.font = '16px "Space Mono", monospace';
    ctx.fillText('PRESS ENTER TO START', width / 2, height / 2 + 40);
    clearGlow(ctx);
  }

  // Controls hint
  ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
  ctx.font = '11px "Space Mono", monospace';
  ctx.fillText('[↑/W] THRUST   [←→/AD] ROTATE   [SPACE] FIRE', width / 2, height / 2 + 80);
}

// ── Game Over Screen ──────────────────────────────────────────────

export function drawGameOver(ctx, score, width, height) {
  // Dim overlay
  ctx.fillStyle = 'rgba(10, 10, 10, 0.7)';
  ctx.fillRect(0, 0, width, height);

  // GAME OVER
  setGlow(ctx, COLORS.BULLET, 15);
  ctx.fillStyle = COLORS.BULLET;
  ctx.font = 'bold 40px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GAME OVER', width / 2, height / 2 - 40);
  clearGlow(ctx);

  // Final score
  setGlow(ctx, COLORS.HUD, 6);
  ctx.fillStyle = COLORS.HUD;
  ctx.font = '18px "Space Mono", monospace';
  ctx.fillText('FINAL SCORE: ' + String(score).padStart(6, '0'), width / 2, height / 2 + 10);
  clearGlow(ctx);

  // Restart prompt
  if (Math.floor(Date.now() / 600) % 2 === 0) {
    setGlow(ctx, COLORS.ASTEROID, 8);
    ctx.fillStyle = COLORS.ASTEROID;
    ctx.font = '14px "Space Mono", monospace';
    ctx.fillText('PRESS ENTER TO RESTART', width / 2, height / 2 + 50);
    clearGlow(ctx);
  }
}

// ── Level Transition ──────────────────────────────────────────────

export function drawLevelTransition(ctx, level, width, height) {
  setGlow(ctx, COLORS.SHIP, 12);
  ctx.fillStyle = COLORS.SHIP;
  ctx.font = 'bold 28px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LEVEL ' + String(level).padStart(2, '0'), width / 2, height / 2);
  clearGlow(ctx);
}

// ── Glitch Effect (on death) ──────────────────────────────────────

export function drawGlitchEffect(ctx, width, height, intensity) {
  if (intensity <= 0) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Random scanline displacement
  const lines = Math.floor(intensity * 8);
  for (let i = 0; i < lines; i++) {
    const y = Math.floor(Math.random() * height);
    const offset = Math.floor((Math.random() - 0.5) * intensity * 40);
    for (let x = 0; x < width; x++) {
      const srcX = Math.min(Math.max(x + offset, 0), width - 1);
      const dstIdx = (y * width + x) * 4;
      const srcIdx = (y * width + srcX) * 4;
      // Shift red channel
      data[dstIdx] = data[srcIdx];
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Chromatic aberration bars
  ctx.globalAlpha = intensity * 0.3;
  ctx.fillStyle = COLORS.BULLET;
  for (let i = 0; i < 3; i++) {
    const barY = Math.random() * height;
    const barH = 1 + Math.random() * 3;
    ctx.fillRect(0, barY, width, barH);
  }
  ctx.globalAlpha = 1;
}
