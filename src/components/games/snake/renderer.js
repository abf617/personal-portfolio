import { COLORS, GLOW, GRID } from './constants.js';

// ── Helpers ───────────────────────────────────────────────────────

function setGlow(ctx, color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function clearGlow(ctx) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

// ── Grid ──────────────────────────────────────────────────────────

export function drawGrid(ctx, cols, rows, cellSize, offsetY) {
  ctx.strokeStyle = COLORS.GRID;
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= cols; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cellSize, offsetY);
    ctx.lineTo(x * cellSize, offsetY + rows * cellSize);
    ctx.stroke();
  }
  for (let y = 0; y <= rows; y++) {
    ctx.beginPath();
    ctx.moveTo(0, offsetY + y * cellSize);
    ctx.lineTo(cols * cellSize, offsetY + y * cellSize);
    ctx.stroke();
  }
}

// ── Walls ─────────────────────────────────────────────────────────

export function drawWalls(ctx, cols, rows, cellSize, offsetY) {
  setGlow(ctx, COLORS.SNAKE_HEAD, GLOW.WALL_BLUR);
  ctx.strokeStyle = COLORS.WALL;
  ctx.lineWidth = 2;
  ctx.strokeRect(0, offsetY, cols * cellSize, rows * cellSize);
  clearGlow(ctx);
}

// ── Snake ─────────────────────────────────────────────────────────

export function drawSnake(ctx, snake, cellSize, offsetY) {
  const gap = 1;
  for (let i = snake.length - 1; i >= 0; i--) {
    const seg = snake[i];
    const isHead = i === 0;
    const alpha = isHead ? 1.0 : 0.7 - (i / snake.length) * 0.4;

    if (isHead) {
      setGlow(ctx, COLORS.SNAKE_HEAD, GLOW.HEAD_BLUR);
      ctx.fillStyle = COLORS.SNAKE_HEAD;
    } else {
      clearGlow(ctx);
      ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
    }

    ctx.fillRect(
      seg.x * cellSize + gap,
      offsetY + seg.y * cellSize + gap,
      cellSize - gap * 2,
      cellSize - gap * 2,
    );
  }
  clearGlow(ctx);
}

// ── Food ──────────────────────────────────────────────────────────

export function drawFood(ctx, food, cellSize, offsetY, time) {
  if (!food) return;
  const pulse = 0.6 + Math.sin(time * 5) * 0.4;
  const size = cellSize * 0.35;
  const cx = food.x * cellSize + cellSize / 2;
  const cy = offsetY + food.y * cellSize + cellSize / 2;

  setGlow(ctx, COLORS.FOOD, GLOW.FOOD_BLUR * pulse);
  ctx.fillStyle = COLORS.FOOD;
  ctx.globalAlpha = 0.6 + pulse * 0.4;
  ctx.beginPath();
  ctx.arc(cx, cy, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  clearGlow(ctx);
}

// ── Virus ─────────────────────────────────────────────────────────

export function drawVirus(ctx, virus, cellSize, offsetY, time) {
  if (!virus) return;

  const flicker = Math.random() > 0.3;
  if (!flicker) return;

  const jitterX = (Math.random() - 0.5) * 3;
  const jitterY = (Math.random() - 0.5) * 3;
  const cx = virus.x * cellSize + cellSize / 2 + jitterX;
  const cy = offsetY + virus.y * cellSize + cellSize / 2 + jitterY;
  const size = cellSize * 0.4;

  // Alternate between magenta and static noise frames
  if (Math.random() > 0.2) {
    setGlow(ctx, COLORS.VIRUS, GLOW.VIRUS_BLUR);
    ctx.fillStyle = COLORS.VIRUS;
    ctx.globalAlpha = 0.7 + Math.random() * 0.3;
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Static noise frame
    const noiseSize = cellSize - 4;
    const x0 = virus.x * cellSize + 2;
    const y0 = offsetY + virus.y * cellSize + 2;
    for (let px = 0; px < noiseSize; px += 3) {
      for (let py = 0; py < noiseSize; py += 3) {
        if (Math.random() > 0.5) {
          ctx.fillStyle = COLORS.CORRUPTION_POOL[Math.floor(Math.random() * COLORS.CORRUPTION_POOL.length)];
          ctx.globalAlpha = 0.3 + Math.random() * 0.5;
          ctx.fillRect(x0 + px, y0 + py, 2, 2);
        }
      }
    }
  }
  ctx.globalAlpha = 1;
  clearGlow(ctx);
}

// ── Grid Corruption ──────────────────────────────────────────────

export function drawCorruption(ctx, corruptedCells, cellSize, offsetY) {
  for (const cell of corruptedCells) {
    const x0 = cell.x * cellSize;
    const y0 = offsetY + cell.y * cellSize;
    for (let px = 0; px < cellSize; px += 3) {
      for (let py = 0; py < cellSize; py += 3) {
        if (Math.random() > 0.4) {
          ctx.fillStyle = COLORS.CORRUPTION_POOL[Math.floor(Math.random() * COLORS.CORRUPTION_POOL.length)];
          ctx.globalAlpha = 0.15 + Math.random() * 0.35;
          ctx.fillRect(x0 + px, y0 + py, 2, 2);
        }
      }
    }
  }
  ctx.globalAlpha = 1;
}

// ── HUD ───────────────────────────────────────────────────────────

export function drawHUD(ctx, score, length, speedTier, width) {
  const y = 18;
  const pad = 16;

  ctx.font = '14px "Space Mono", monospace';
  ctx.textBaseline = 'top';

  setGlow(ctx, COLORS.HUD, GLOW.HUD_BLUR);

  // Score (left)
  ctx.fillStyle = COLORS.HUD_LABEL;
  ctx.textAlign = 'left';
  ctx.fillText('> SCORE:', pad, y);
  ctx.fillStyle = COLORS.HUD;
  ctx.fillText(String(score).padStart(6, '0'), pad + ctx.measureText('> SCORE: ').width, y);

  // Length (center)
  ctx.fillStyle = COLORS.HUD_LABEL;
  ctx.textAlign = 'center';
  ctx.fillText('LEN: ' + String(length).padStart(3, '0'), width / 2, y);

  // Speed (right)
  ctx.fillStyle = COLORS.HUD_LABEL;
  ctx.textAlign = 'right';
  ctx.fillText('SPEED: ' + String(speedTier).padStart(2, '0'), width - pad, y);

  clearGlow(ctx);
}

// ── Start Screen ─────────────────────────────────────────────────

export function drawStartScreen(ctx, width, height) {
  setGlow(ctx, COLORS.SNAKE_HEAD, 12);
  ctx.fillStyle = COLORS.SNAKE_HEAD;
  ctx.font = 'bold 36px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SNAKE', width / 2, height / 2 - 50);
  clearGlow(ctx);

  setGlow(ctx, COLORS.FOOD, 6);
  ctx.fillStyle = COLORS.FOOD;
  ctx.font = '14px "Space Mono", monospace';
  ctx.fillText('[ WEB EDITION ]', width / 2, height / 2 - 10);
  clearGlow(ctx);

  if (Math.floor(Date.now() / 600) % 2 === 0) {
    setGlow(ctx, COLORS.VIRUS, 8);
    ctx.fillStyle = COLORS.VIRUS;
    ctx.font = '16px "Space Mono", monospace';
    ctx.fillText('PRESS ENTER TO START', width / 2, height / 2 + 40);
    clearGlow(ctx);
  }

  ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
  ctx.font = '11px "Space Mono", monospace';
  ctx.fillText('[\u2191\u2193\u2190\u2192 / WASD] MOVE   [ENTER] START', width / 2, height / 2 + 80);
}

// ── Game Over Screen ─────────────────────────────────────────────

export function drawGameOver(ctx, score, width, height) {
  ctx.fillStyle = 'rgba(10, 10, 10, 0.7)';
  ctx.fillRect(0, 0, width, height);

  setGlow(ctx, COLORS.VIRUS, 15);
  ctx.fillStyle = COLORS.VIRUS;
  ctx.font = 'bold 40px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GAME OVER', width / 2, height / 2 - 40);
  clearGlow(ctx);

  setGlow(ctx, COLORS.HUD, 6);
  ctx.fillStyle = COLORS.HUD;
  ctx.font = '18px "Space Mono", monospace';
  ctx.fillText('FINAL SCORE: ' + String(score).padStart(6, '0'), width / 2, height / 2 + 10);
  clearGlow(ctx);

  if (Math.floor(Date.now() / 600) % 2 === 0) {
    setGlow(ctx, COLORS.FOOD, 8);
    ctx.fillStyle = COLORS.FOOD;
    ctx.font = '14px "Space Mono", monospace';
    ctx.fillText('PRESS ENTER TO RESTART', width / 2, height / 2 + 50);
    clearGlow(ctx);
  }
}

// ── Speed Up Flash ───────────────────────────────────────────────

export function drawSpeedUp(ctx, tier, width, height, alpha) {
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha;
  setGlow(ctx, COLORS.SNAKE_HEAD, 15);
  ctx.fillStyle = COLORS.SNAKE_HEAD;
  ctx.font = 'bold 28px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SPEED: ' + String(tier).padStart(2, '0'), width / 2, height / 2);
  clearGlow(ctx);
  ctx.globalAlpha = 1;
}

// ── Glitch Effect ────────────────────────────────────────────────

export function drawGlitchEffect(ctx, width, height, intensity) {
  if (intensity <= 0) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const lines = Math.floor(intensity * 8);
  for (let i = 0; i < lines; i++) {
    const y = Math.floor(Math.random() * height);
    const offset = Math.floor((Math.random() - 0.5) * intensity * 40);
    for (let x = 0; x < width; x++) {
      const srcX = Math.min(Math.max(x + offset, 0), width - 1);
      const dstIdx = (y * width + x) * 4;
      const srcIdx = (y * width + srcX) * 4;
      data[dstIdx] = data[srcIdx];
    }
  }

  ctx.putImageData(imageData, 0, 0);

  ctx.globalAlpha = intensity * 0.3;
  ctx.fillStyle = COLORS.VIRUS;
  for (let i = 0; i < 3; i++) {
    const barY = Math.random() * height;
    const barH = 1 + Math.random() * 3;
    ctx.fillRect(0, barY, width, barH);
  }
  ctx.globalAlpha = 1;
}
