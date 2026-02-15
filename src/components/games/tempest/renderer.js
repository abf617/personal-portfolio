import { COLORS, TUBE, GLOW, PLAYER, BULLET as BULLET_CONST } from './constants.js';

function setGlow(ctx, color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function clearGlow(ctx) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

// Maps normalized shape vertices to screen coordinates for outer + inner (vanishing) polygons
export function computeTubeState(shape, cx, cy, outerRadius, time) {
  const pulse = TUBE.INNER_PULSE_MIN +
    (TUBE.INNER_PULSE_MAX - TUBE.INNER_PULSE_MIN) *
    (0.5 + 0.5 * Math.sin(time * TUBE.INNER_PULSE_SPEED));

  const outer = shape.vertices.map(v => ({
    x: cx + v.x * outerRadius,
    y: cy + v.y * outerRadius,
  }));

  const inner = shape.vertices.map(v => ({
    x: cx + v.x * outerRadius * pulse,
    y: cy + v.y * outerRadius * pulse,
  }));

  const laneCount = shape.closed ? shape.vertices.length : shape.vertices.length - 1;

  return { outer, inner, cx, cy, laneCount, closed: shape.closed };
}

// Lerp between outer and inner midpoints of a lane at given depth
export function getEntityScreenPos(tubeState, lane, depth) {
  const { outer, inner, laneCount, closed } = tubeState;
  const n = outer.length;

  const i0 = ((lane % n) + n) % n;
  const i1 = closed ? (i0 + 1) % n : Math.min(i0 + 1, n - 1);

  const outerMidX = (outer[i0].x + outer[i1].x) / 2;
  const outerMidY = (outer[i0].y + outer[i1].y) / 2;
  const innerMidX = (inner[i0].x + inner[i1].x) / 2;
  const innerMidY = (inner[i0].y + inner[i1].y) / 2;

  const d = Math.max(0, Math.min(1, depth));
  const scale = 1 - d * (1 - TUBE.INNER_SCALE);

  return {
    x: outerMidX + (innerMidX - outerMidX) * d,
    y: outerMidY + (innerMidY - outerMidY) * d,
    scale,
  };
}

// Get the screen position of a specific vertex at a given depth
function getVertexScreenPos(tubeState, vertIndex, depth) {
  const { outer, inner } = tubeState;
  const n = outer.length;
  const i = ((vertIndex % n) + n) % n;
  const d = Math.max(0, Math.min(1, depth));
  return {
    x: outer[i].x + (inner[i].x - outer[i].x) * d,
    y: outer[i].y + (inner[i].y - outer[i].y) * d,
  };
}

export function drawTube(ctx, tubeState, time, level) {
  const { outer, inner, closed } = tubeState;
  const n = outer.length;

  // Level-based hue shift (cycle every 16 levels)
  const hueShift = ((level - 1) % 16) * 22.5;

  ctx.save();
  if (hueShift > 0) {
    ctx.filter = `hue-rotate(${hueShift}deg)`;
  }

  // Depth rings
  for (let r = 1; r <= TUBE.DEPTH_RINGS; r++) {
    const d = r / (TUBE.DEPTH_RINGS + 1);
    ctx.strokeStyle = COLORS.DEPTH_RING;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p = getVertexScreenPos(tubeState, i, d);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    if (closed) ctx.closePath();
    ctx.stroke();
  }

  // Lane dividers (outer to inner lines)
  setGlow(ctx, COLORS.TUBE, GLOW.TUBE_BLUR * 0.5);
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
  ctx.lineWidth = TUBE.LANE_LINE_WIDTH;
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.moveTo(outer[i].x, outer[i].y);
    ctx.lineTo(inner[i].x, inner[i].y);
    ctx.stroke();
  }

  // Outer rim
  setGlow(ctx, COLORS.TUBE, GLOW.TUBE_BLUR);
  ctx.strokeStyle = COLORS.TUBE;
  ctx.lineWidth = TUBE.EDGE_LINE_WIDTH;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    if (i === 0) ctx.moveTo(outer[i].x, outer[i].y);
    else ctx.lineTo(outer[i].x, outer[i].y);
  }
  if (closed) ctx.closePath();
  ctx.stroke();

  // Inner polygon
  ctx.strokeStyle = COLORS.TUBE_INNER;
  ctx.lineWidth = 1;
  setGlow(ctx, COLORS.TUBE_INNER, GLOW.TUBE_BLUR * 0.5);
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    if (i === 0) ctx.moveTo(inner[i].x, inner[i].y);
    else ctx.lineTo(inner[i].x, inner[i].y);
  }
  if (closed) ctx.closePath();
  ctx.stroke();

  clearGlow(ctx);
  ctx.restore();
}

export function drawPlayer(ctx, tubeState, lane) {
  const { outer, closed } = tubeState;
  const n = outer.length;

  const i0 = ((lane % n) + n) % n;
  const i1 = closed ? (i0 + 1) % n : Math.min(i0 + 1, n - 1);

  const midX = (outer[i0].x + outer[i1].x) / 2;
  const midY = (outer[i0].y + outer[i1].y) / 2;

  // Direction toward center
  const { cx, cy } = tubeState;
  const dx = cx - midX;
  const dy = cy - midY;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;

  // Perpendicular
  const px = -ny;
  const py = nx;

  const s = PLAYER.SIZE;

  // Chevron shape pointing inward
  setGlow(ctx, COLORS.PLAYER, GLOW.PLAYER_BLUR);
  ctx.strokeStyle = COLORS.PLAYER;
  ctx.lineWidth = 2;
  ctx.beginPath();
  // Left wing tip
  ctx.moveTo(midX - px * s * 0.8, midY - py * s * 0.8);
  // Nose (toward center)
  ctx.lineTo(midX + nx * s * 0.6, midY + ny * s * 0.6);
  // Right wing tip
  ctx.lineTo(midX + px * s * 0.8, midY + py * s * 0.8);
  // Inner notch
  ctx.lineTo(midX + nx * s * 0.1, midY + ny * s * 0.1);
  ctx.closePath();
  ctx.stroke();

  // Fill with low alpha
  ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
  ctx.fill();
  clearGlow(ctx);
}

export function drawBullet(ctx, tubeState, lane, depth) {
  const pos = getEntityScreenPos(tubeState, lane, depth);
  const r = BULLET_CONST.SIZE * pos.scale;

  setGlow(ctx, COLORS.BULLET, GLOW.BULLET_BLUR);
  ctx.fillStyle = COLORS.BULLET;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, Math.max(1, r), 0, Math.PI * 2);
  ctx.fill();

  // Trail toward outer rim
  if (depth > 0.05) {
    const trailPos = getEntityScreenPos(tubeState, lane, Math.max(0, depth - 0.08));
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = COLORS.BULLET;
    ctx.lineWidth = Math.max(1, r * 0.6);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(trailPos.x, trailPos.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  clearGlow(ctx);
}

export function drawFlipper(ctx, tubeState, lane, depth, flipProgress) {
  const pos = getEntityScreenPos(tubeState, lane, depth);
  const s = 8 * pos.scale;

  setGlow(ctx, COLORS.FLIPPER, GLOW.ENEMY_BLUR);
  ctx.strokeStyle = COLORS.FLIPPER;
  ctx.lineWidth = 1.5 * pos.scale;

  // Bow-tie shape that rotates during flip
  const angle = flipProgress * Math.PI;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  ctx.beginPath();
  ctx.moveTo(pos.x + cos * s - sin * s * 0.5, pos.y + sin * s + cos * s * 0.5);
  ctx.lineTo(pos.x, pos.y);
  ctx.lineTo(pos.x + cos * s + sin * s * 0.5, pos.y + sin * s - cos * s * 0.5);
  ctx.moveTo(pos.x - cos * s + sin * s * 0.5, pos.y - sin * s - cos * s * 0.5);
  ctx.lineTo(pos.x, pos.y);
  ctx.lineTo(pos.x - cos * s - sin * s * 0.5, pos.y - sin * s + cos * s * 0.5);
  ctx.stroke();
  clearGlow(ctx);
}

export function drawTanker(ctx, tubeState, lane, depth) {
  const pos = getEntityScreenPos(tubeState, lane, depth);
  const s = 9 * pos.scale;

  setGlow(ctx, COLORS.TANKER, GLOW.ENEMY_BLUR);
  ctx.strokeStyle = COLORS.TANKER;
  ctx.lineWidth = 1.5 * pos.scale;

  // Diamond
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y - s);
  ctx.lineTo(pos.x + s, pos.y);
  ctx.lineTo(pos.x, pos.y + s);
  ctx.lineTo(pos.x - s, pos.y);
  ctx.closePath();
  ctx.stroke();

  // Inner cross (dashed)
  ctx.setLineDash([2 * pos.scale, 2 * pos.scale]);
  ctx.beginPath();
  ctx.moveTo(pos.x - s * 0.5, pos.y);
  ctx.lineTo(pos.x + s * 0.5, pos.y);
  ctx.moveTo(pos.x, pos.y - s * 0.5);
  ctx.lineTo(pos.x, pos.y + s * 0.5);
  ctx.stroke();
  ctx.setLineDash([]);
  clearGlow(ctx);
}

export function drawSpiker(ctx, tubeState, lane, depth) {
  const pos = getEntityScreenPos(tubeState, lane, depth);
  const s = 7 * pos.scale;

  setGlow(ctx, COLORS.SPIKER, GLOW.ENEMY_BLUR);
  ctx.strokeStyle = COLORS.SPIKER;
  ctx.lineWidth = 1.5 * pos.scale;

  // Narrow downward-pointing triangle
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y + s);
  ctx.lineTo(pos.x - s * 0.5, pos.y - s * 0.6);
  ctx.lineTo(pos.x + s * 0.5, pos.y - s * 0.6);
  ctx.closePath();
  ctx.stroke();
  clearGlow(ctx);
}

export function drawSpikeTrail(ctx, tubeState, lane, segments) {
  if (!segments || segments.length < 2) return;

  setGlow(ctx, COLORS.SPIKE_TRAIL, 3);
  ctx.strokeStyle = COLORS.SPIKE_TRAIL;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  for (let i = 0; i < segments.length; i++) {
    const pos = getEntityScreenPos(tubeState, lane, segments[i]);
    if (i === 0) ctx.moveTo(pos.x, pos.y);
    else ctx.lineTo(pos.x, pos.y);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
  clearGlow(ctx);
}

export function drawPulsar(ctx, tubeState, lane, depth, isActive) {
  const pos = getEntityScreenPos(tubeState, lane, depth);
  const s = 8 * pos.scale;
  const color = isActive ? '#FFFFFF' : COLORS.PULSAR;
  const blur = isActive ? GLOW.ENEMY_BLUR * 2 : GLOW.ENEMY_BLUR;

  setGlow(ctx, color, blur);
  ctx.strokeStyle = color;
  ctx.lineWidth = (isActive ? 2.5 : 1.5) * pos.scale;

  // Hexagon
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const px = pos.x + Math.cos(a) * s;
    const py = pos.y + Math.sin(a) * s;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  if (isActive) {
    ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
    ctx.fill();
  }
  clearGlow(ctx);
}

export function drawPulsarLaneEffect(ctx, tubeState, lane, depth) {
  const { outer, inner, closed } = tubeState;
  const n = outer.length;
  const i0 = ((lane % n) + n) % n;
  const i1 = closed ? (i0 + 1) % n : Math.min(i0 + 1, n - 1);

  // Electrify lane edges from enemy depth to outer rim
  ctx.globalAlpha = 0.3 + 0.2 * Math.sin(Date.now() * 0.01);
  setGlow(ctx, COLORS.PULSAR, 6);
  ctx.strokeStyle = COLORS.PULSAR;
  ctx.lineWidth = 2;

  const dStart = Math.max(0, depth - 0.02);
  for (const vi of [i0, i1]) {
    const pOuter = getVertexScreenPos(tubeState, vi, dStart);
    const pRim = { x: outer[vi].x, y: outer[vi].y };
    ctx.beginPath();
    ctx.moveTo(pOuter.x, pOuter.y);
    ctx.lineTo(pRim.x, pRim.y);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  clearGlow(ctx);
}

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

export function drawHUD(ctx, score, lives, level, zapperCharges, width) {
  const y = 20;
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

  // Lives (center-left)
  const livesText = 'LIVES: ' + '\u25A0'.repeat(Math.max(0, lives));
  ctx.fillStyle = COLORS.HUD_LABEL;
  ctx.textAlign = 'center';
  ctx.fillText(livesText, width * 0.38, y);

  // Level (center-right)
  ctx.fillStyle = COLORS.HUD_LABEL;
  ctx.textAlign = 'center';
  ctx.fillText('NODE: ' + String(level).padStart(2, '0'), width * 0.62, y);

  // Superzapper (right)
  ctx.textAlign = 'right';
  if (zapperCharges > 0) {
    ctx.fillStyle = COLORS.SUPERZAPPER;
    ctx.fillText('EMP:' + '\u26A1'.repeat(zapperCharges), width - pad, y);
  } else {
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.fillText('EMP:--', width - pad, y);
  }

  clearGlow(ctx);
}

export function drawStartScreen(ctx, w, h) {
  // Title
  setGlow(ctx, COLORS.PLAYER, 12);
  ctx.fillStyle = COLORS.PLAYER;
  ctx.font = 'bold 36px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FIREWALL', w / 2, h / 2 - 50);
  clearGlow(ctx);

  // Subtitle
  setGlow(ctx, COLORS.BULLET, 6);
  ctx.fillStyle = COLORS.BULLET;
  ctx.font = '14px "Space Mono", monospace';
  ctx.fillText('[ DATA TUNNEL DEFENSE ]', w / 2, h / 2 - 10);
  clearGlow(ctx);

  // Prompt
  if (Math.floor(Date.now() / 600) % 2 === 0) {
    setGlow(ctx, COLORS.FLIPPER, 8);
    ctx.fillStyle = COLORS.FLIPPER;
    ctx.font = '16px "Space Mono", monospace';
    ctx.fillText('PRESS ENTER TO START', w / 2, h / 2 + 40);
    clearGlow(ctx);
  }

  // Controls hint
  ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
  ctx.font = '11px "Space Mono", monospace';
  ctx.fillText('[LEFT/RIGHT] MOVE   [SPACE] FIRE   [Z] EMP', w / 2, h / 2 + 80);
}

export function drawGameOver(ctx, score, w, h) {
  ctx.fillStyle = 'rgba(10, 10, 10, 0.7)';
  ctx.fillRect(0, 0, w, h);

  setGlow(ctx, COLORS.FLIPPER, 15);
  ctx.fillStyle = COLORS.FLIPPER;
  ctx.font = 'bold 40px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BREACH DETECTED', w / 2, h / 2 - 40);
  clearGlow(ctx);

  setGlow(ctx, COLORS.HUD, 6);
  ctx.fillStyle = COLORS.HUD;
  ctx.font = '18px "Space Mono", monospace';
  ctx.fillText('FINAL SCORE: ' + String(score).padStart(6, '0'), w / 2, h / 2 + 10);
  clearGlow(ctx);

  if (Math.floor(Date.now() / 600) % 2 === 0) {
    setGlow(ctx, COLORS.BULLET, 8);
    ctx.fillStyle = COLORS.BULLET;
    ctx.font = '14px "Space Mono", monospace';
    ctx.fillText('PRESS ENTER TO RESTART', w / 2, h / 2 + 50);
    clearGlow(ctx);
  }
}

export function drawLevelComplete(ctx, level, w, h, alpha) {
  ctx.globalAlpha = alpha;
  setGlow(ctx, COLORS.BULLET, 12);
  ctx.fillStyle = COLORS.BULLET;
  ctx.font = 'bold 28px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NODE SECURED', w / 2, h / 2 - 15);
  clearGlow(ctx);

  setGlow(ctx, COLORS.PLAYER, 8);
  ctx.fillStyle = COLORS.PLAYER;
  ctx.font = '18px "Space Mono", monospace';
  ctx.fillText('ENTERING NODE ' + String(level + 1).padStart(2, '0'), w / 2, h / 2 + 20);
  clearGlow(ctx);
  ctx.globalAlpha = 1;
}

export function drawWarpEffect(ctx, tubeState, progress, w, h) {
  const { inner, closed } = tubeState;
  const n = inner.length;

  // Zoom streak lines radiating from center
  const streakCount = n * 2;
  const intensity = Math.sin(progress * Math.PI);

  ctx.save();
  setGlow(ctx, COLORS.PLAYER, 8);

  for (let i = 0; i < streakCount; i++) {
    const angle = (i / streakCount) * Math.PI * 2;
    const len = 50 + progress * Math.max(w, h) * 0.6;
    const startR = 10 + progress * 40;

    ctx.globalAlpha = intensity * 0.6 * (0.5 + 0.5 * Math.random());
    ctx.strokeStyle = COLORS.PARTICLE_POOL[i % COLORS.PARTICLE_POOL.length];
    ctx.lineWidth = 1 + progress * 2;
    ctx.beginPath();
    ctx.moveTo(
      tubeState.cx + Math.cos(angle) * startR,
      tubeState.cy + Math.sin(angle) * startR
    );
    ctx.lineTo(
      tubeState.cx + Math.cos(angle) * len,
      tubeState.cy + Math.sin(angle) * len
    );
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  clearGlow(ctx);
  ctx.restore();
}

export function drawSuperzapperFlash(ctx, w, h, intensity) {
  ctx.globalAlpha = intensity * 0.6;
  ctx.fillStyle = COLORS.SUPERZAPPER;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
}

export function drawGlitchEffect(ctx, width, height, intensity) {
  if (intensity <= 0) return;

  const dpr = window.devicePixelRatio || 1;
  const canvasW = Math.floor(width * dpr);
  const canvasH = Math.floor(height * dpr);
  if (canvasW <= 0 || canvasH <= 0) return;

  const imageData = ctx.getImageData(0, 0, canvasW, canvasH);
  const data = imageData.data;

  const lines = Math.floor(intensity * 8);
  for (let i = 0; i < lines; i++) {
    const y = Math.floor(Math.random() * canvasH);
    const offset = Math.floor((Math.random() - 0.5) * intensity * 40);
    for (let x = 0; x < canvasW; x++) {
      const srcX = Math.min(Math.max(x + offset, 0), canvasW - 1);
      const dstIdx = (y * canvasW + x) * 4;
      const srcIdx = (y * canvasW + srcX) * 4;
      data[dstIdx] = data[srcIdx];
    }
  }

  ctx.putImageData(imageData, 0, 0);

  ctx.globalAlpha = intensity * 0.3;
  ctx.fillStyle = COLORS.FLIPPER;
  for (let i = 0; i < 3; i++) {
    const barY = Math.random() * height;
    const barH = 1 + Math.random() * 3;
    ctx.fillRect(0, barY, width, barH);
  }
  ctx.globalAlpha = 1;
}
