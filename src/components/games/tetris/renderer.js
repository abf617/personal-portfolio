import { COLORS, GLOW, GRID, PIECES } from './constants.js';

function setGlow(ctx, color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function clearGlow(ctx) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

// ── Layout helpers ──────────────────────────────────────────────

export function computeLayout(canvasWidth, canvasHeight) {
  const pad = 8;
  const maxCellH = Math.floor((canvasHeight - GRID.HUD_HEIGHT - pad) / GRID.ROWS);
  const maxCellW = Math.floor((canvasWidth - pad) / (GRID.COLS + GRID.SIDE_PANEL_CELLS * 2));
  const cellSize = Math.max(12, Math.min(GRID.CELL_SIZE, maxCellH, maxCellW));

  const fieldW = GRID.COLS * cellSize;
  const fieldH = GRID.ROWS * cellSize;
  const sideW = GRID.SIDE_PANEL_CELLS * cellSize;
  const totalW = sideW + fieldW + sideW;

  const offsetX = Math.floor((canvasWidth - totalW) / 2) + sideW;
  const offsetY = GRID.HUD_HEIGHT + Math.floor((canvasHeight - GRID.HUD_HEIGHT - fieldH) / 2);

  return {
    cellSize,
    fieldW,
    fieldH,
    sideW,
    offsetX: Math.max(sideW, offsetX),
    offsetY: Math.max(GRID.HUD_HEIGHT, offsetY),
    leftPanelX: Math.max(sideW, offsetX) - sideW,
    rightPanelX: Math.max(sideW, offsetX) + fieldW,
  };
}

// ── Playfield grid ──────────────────────────────────────────────

export function drawPlayfield(ctx, grid, layout) {
  const { cellSize, offsetX, offsetY } = layout;

  ctx.strokeStyle = COLORS.GRID;
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= GRID.COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(offsetX + x * cellSize, offsetY);
    ctx.lineTo(offsetX + x * cellSize, offsetY + GRID.ROWS * cellSize);
    ctx.stroke();
  }
  for (let y = 0; y <= GRID.ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY + y * cellSize);
    ctx.lineTo(offsetX + GRID.COLS * cellSize, offsetY + y * cellSize);
    ctx.stroke();
  }

  // Locked blocks
  for (let r = 0; r < GRID.ROWS; r++) {
    for (let c = 0; c < GRID.COLS; c++) {
      const cell = grid[r][c];
      if (cell) {
        drawBlock(ctx, offsetX + c * cellSize, offsetY + r * cellSize, cellSize, cell.color, COLORS.LOCKED_ALPHA, GLOW.LOCKED_BLUR);
      }
    }
  }
}

// ── Single block (wireframe) ────────────────────────────────────

function drawBlock(ctx, x, y, size, color, alpha, blur) {
  const gap = 1;
  ctx.globalAlpha = alpha;
  setGlow(ctx, color, blur);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + gap, y + gap, size - gap * 2, size - gap * 2);
  clearGlow(ctx);
  ctx.globalAlpha = 1;
}

// ── Walls ───────────────────────────────────────────────────────

export function drawWalls(ctx, layout) {
  const { cellSize, offsetX, offsetY } = layout;
  setGlow(ctx, COLORS.HUD, GLOW.WALL_BLUR);
  ctx.strokeStyle = COLORS.WALL;
  ctx.lineWidth = 2;
  ctx.strokeRect(offsetX, offsetY, GRID.COLS * cellSize, GRID.ROWS * cellSize);
  clearGlow(ctx);
}

// ── Active piece ────────────────────────────────────────────────

export function drawPiece(ctx, piece, layout, alpha = 1) {
  if (!piece) return;
  const { cellSize, offsetX, offsetY } = layout;
  const shape = PIECES[piece.type][piece.rotation];
  const color = COLORS[piece.type];

  for (const [r, c] of shape) {
    const px = offsetX + (piece.x + c) * cellSize;
    const py = offsetY + (piece.y + r) * cellSize;
    drawBlock(ctx, px, py, cellSize, color, alpha, GLOW.ACTIVE_BLUR);
  }
}

// ── Ghost piece ─────────────────────────────────────────────────

export function drawGhostPiece(ctx, piece, ghostY, layout) {
  if (!piece || ghostY === piece.y) return;
  const { cellSize, offsetX, offsetY } = layout;
  const shape = PIECES[piece.type][piece.rotation];
  const color = COLORS[piece.type];

  ctx.globalAlpha = 0.12;
  ctx.setLineDash([3, 3]);
  setGlow(ctx, color, GLOW.GHOST_BLUR);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  for (const [r, c] of shape) {
    const px = offsetX + (piece.x + c) * cellSize;
    const py = offsetY + (ghostY + r) * cellSize;
    ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
  }

  ctx.setLineDash([]);
  clearGlow(ctx);
  ctx.globalAlpha = 1;
}

// ── Side panels (NEXT / HOLD) ───────────────────────────────────

export function drawSidePanel(ctx, label, pieceType, x, y, cellSize) {
  const panelW = GRID.SIDE_PANEL_CELLS * cellSize - 12;
  const panelH = 5 * cellSize;

  // Panel background
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(x + 6, y, panelW, panelH);
  ctx.strokeRect(x + 6, y, panelW, panelH);

  // Label
  setGlow(ctx, COLORS.HUD_LABEL, GLOW.HUD_BLUR);
  ctx.fillStyle = COLORS.HUD_LABEL;
  ctx.font = '11px "Space Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(label, x + 6 + panelW / 2, y + 8);
  clearGlow(ctx);

  if (!pieceType) return;

  const shape = PIECES[pieceType][0];
  const color = COLORS[pieceType];

  // Compute bounding box for centering
  let minR = 4, maxR = 0, minC = 4, maxC = 0;
  for (const [r, c] of shape) {
    minR = Math.min(minR, r);
    maxR = Math.max(maxR, r);
    minC = Math.min(minC, c);
    maxC = Math.max(maxC, c);
  }
  const pw = (maxC - minC + 1) * cellSize;
  const ph = (maxR - minR + 1) * cellSize;
  const cx = x + 6 + (panelW - pw) / 2;
  const cy = y + 28 + (panelH - 28 - ph) / 2;

  for (const [r, c] of shape) {
    drawBlock(ctx, cx + (c - minC) * cellSize, cy + (r - minR) * cellSize, cellSize, color, 0.8, GLOW.ACTIVE_BLUR);
  }
}

// ── HUD ─────────────────────────────────────────────────────────

export function drawHUD(ctx, score, level, lines, width) {
  const y = 18;
  const pad = 16;

  ctx.font = '13px "Space Mono", monospace';
  ctx.textBaseline = 'top';

  setGlow(ctx, COLORS.HUD, GLOW.HUD_BLUR);

  ctx.fillStyle = COLORS.HUD_LABEL;
  ctx.textAlign = 'left';
  ctx.fillText('> SCORE:', pad, y);
  ctx.fillStyle = COLORS.HUD;
  ctx.fillText(String(score).padStart(6, '0'), pad + ctx.measureText('> SCORE: ').width, y);

  ctx.fillStyle = COLORS.HUD_LABEL;
  ctx.textAlign = 'center';
  ctx.fillText('LEVEL: ' + String(level).padStart(2, '0'), width / 2, y);

  ctx.fillStyle = COLORS.HUD_LABEL;
  ctx.textAlign = 'right';
  ctx.fillText('LINES: ' + String(lines).padStart(3, '0'), width - pad, y);

  clearGlow(ctx);
}

// ── Integrity meter ─────────────────────────────────────────────

export function drawIntegrityMeter(ctx, integrity, x, y) {
  const panelW = GRID.SIDE_PANEL_CELLS * GRID.CELL_SIZE - 12;
  const barH = 120;
  const barW = 14;
  const cx = x + 6 + panelW / 2;
  const barX = cx - barW / 2;
  const barY = y;

  // Label
  ctx.font = '11px "Space Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  setGlow(ctx, COLORS.HUD_LABEL, GLOW.HUD_BLUR);
  ctx.fillStyle = COLORS.HUD_LABEL;
  ctx.fillText('SYS.INT', cx, barY);
  clearGlow(ctx);

  // Bar outline
  const by = barY + 18;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, by, barW, barH);

  // Fill
  const fillH = (integrity / 100) * barH;
  let barColor;
  if (integrity > 50) barColor = '#00FF41';
  else if (integrity > 25) barColor = '#FFD700';
  else barColor = '#FF3333';

  // Flash when critical
  if (integrity < 10 && Math.floor(Date.now() / 300) % 2 === 0) {
    barColor = '#FF006E';
  }

  ctx.fillStyle = barColor;
  ctx.globalAlpha = 0.6;
  ctx.fillRect(barX + 1, by + barH - fillH, barW - 2, fillH);
  ctx.globalAlpha = 1;

  // Percentage text
  setGlow(ctx, barColor, 4);
  ctx.fillStyle = barColor;
  ctx.font = '10px "Space Mono", monospace';
  ctx.fillText(integrity + '%', cx, by + barH + 6);
  clearGlow(ctx);
}

// ── Start screen ────────────────────────────────────────────────

export function drawStartScreen(ctx, w, h) {
  setGlow(ctx, COLORS.I, 12);
  ctx.fillStyle = COLORS.I;
  ctx.font = 'bold 36px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TETRIS', w / 2, h / 2 - 50);
  clearGlow(ctx);

  setGlow(ctx, COLORS.HUD_LABEL, 6);
  ctx.fillStyle = COLORS.HUD_LABEL;
  ctx.font = '14px "Space Mono", monospace';
  ctx.fillText('[ WEB EDITION ]', w / 2, h / 2 - 10);
  clearGlow(ctx);

  if (Math.floor(Date.now() / 600) % 2 === 0) {
    setGlow(ctx, COLORS.T, 8);
    ctx.fillStyle = COLORS.T;
    ctx.font = '16px "Space Mono", monospace';
    ctx.fillText('PRESS ENTER TO START', w / 2, h / 2 + 40);
    clearGlow(ctx);
  }

  ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
  ctx.font = '11px "Space Mono", monospace';
  ctx.fillText('[ARROWS] MOVE  [\u2191] ROTATE  [SPACE] DROP  [C] HOLD', w / 2, h / 2 + 80);
}

// ── Game over screen ────────────────────────────────────────────

export function drawGameOver(ctx, score, w, h) {
  ctx.fillStyle = 'rgba(10, 10, 10, 0.75)';
  ctx.fillRect(0, 0, w, h);

  setGlow(ctx, COLORS.T, 18);
  ctx.fillStyle = COLORS.T;
  ctx.font = 'bold 36px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SYSTEM CRASH', w / 2, h / 2 - 40);
  clearGlow(ctx);

  setGlow(ctx, COLORS.HUD, 6);
  ctx.fillStyle = COLORS.HUD;
  ctx.font = '18px "Space Mono", monospace';
  ctx.fillText('FINAL SCORE: ' + String(score).padStart(6, '0'), w / 2, h / 2 + 10);
  clearGlow(ctx);

  if (Math.floor(Date.now() / 600) % 2 === 0) {
    setGlow(ctx, COLORS.HUD_LABEL, 8);
    ctx.fillStyle = COLORS.HUD_LABEL;
    ctx.font = '14px "Space Mono", monospace';
    ctx.fillText('PRESS ENTER TO RESTART', w / 2, h / 2 + 50);
    clearGlow(ctx);
  }
}

// ── Line clear effect ───────────────────────────────────────────

export function drawLineClearEffect(ctx, clearingRows, progress, layout) {
  const { cellSize, offsetX, offsetY } = layout;

  for (const row of clearingRows) {
    const ry = offsetY + row * cellSize;

    if (progress < 0.3) {
      // White flash phase
      const flashAlpha = 1 - (progress / 0.3);
      ctx.globalAlpha = flashAlpha * 0.8;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(offsetX, ry, GRID.COLS * cellSize, cellSize);
    } else {
      // Static dissolution phase
      const dissolveProgress = (progress - 0.3) / 0.7;
      const particleChance = 1 - dissolveProgress;

      for (let c = 0; c < GRID.COLS; c++) {
        const px = offsetX + c * cellSize;
        for (let sx = 0; sx < cellSize; sx += 3) {
          for (let sy = 0; sy < cellSize; sy += 3) {
            if (Math.random() < particleChance * 0.6) {
              const scatter = dissolveProgress * 20;
              const dx = (Math.random() - 0.5) * scatter;
              const dy = (Math.random() - 0.5) * scatter - dissolveProgress * 15;
              ctx.fillStyle = COLORS.CORRUPTION_POOL[Math.floor(Math.random() * COLORS.CORRUPTION_POOL.length)];
              ctx.globalAlpha = particleChance * 0.7;
              ctx.fillRect(px + sx + dx, ry + sy + dy, 2, 2);
            }
          }
        }
      }
    }
  }
  ctx.globalAlpha = 1;
}

// ── Clear flash overlay ─────────────────────────────────────────

export function drawClearFlash(ctx, label, w, h, alpha) {
  if (alpha <= 0 || !label) return;
  ctx.globalAlpha = alpha;
  setGlow(ctx, COLORS.I, 20);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, w / 2, h / 2);
  clearGlow(ctx);
  ctx.globalAlpha = 1;
}

// ── Glitch effect ───────────────────────────────────────────────

export function drawGlitchEffect(ctx, w, h, intensity) {
  if (intensity <= 0) return;

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const lines = Math.floor(intensity * 8);
  for (let i = 0; i < lines; i++) {
    const y = Math.floor(Math.random() * h);
    const offset = Math.floor((Math.random() - 0.5) * intensity * 40);
    for (let x = 0; x < w; x++) {
      const srcX = Math.min(Math.max(x + offset, 0), w - 1);
      const dstIdx = (y * w + x) * 4;
      const srcIdx = (y * w + srcX) * 4;
      data[dstIdx] = data[srcIdx];
    }
  }

  ctx.putImageData(imageData, 0, 0);

  ctx.globalAlpha = intensity * 0.3;
  ctx.fillStyle = COLORS.T;
  for (let i = 0; i < 3; i++) {
    const barY = Math.random() * h;
    const barH = 1 + Math.random() * 3;
    ctx.fillRect(0, barY, w, barH);
  }
  ctx.globalAlpha = 1;
}

// ── Ambient corruption ──────────────────────────────────────────

export function drawCorruption(ctx, cells, layout) {
  const { cellSize, offsetX, offsetY } = layout;
  for (const cell of cells) {
    const x0 = offsetX + cell.x * cellSize;
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
