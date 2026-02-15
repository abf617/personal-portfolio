export const COLORS = {
  PLAYER: '#00F0FF',
  FLIPPER: '#FF006E',
  TANKER: '#FF8C00',
  SPIKER: '#FF2020',
  PULSAR: '#FFD700',
  BULLET: '#00FF41',
  HUD: '#00F0FF',
  HUD_LABEL: '#00FF41',
  TUBE: '#00F0FF',
  TUBE_INNER: '#FF006E',
  DEPTH_RING: 'rgba(0, 240, 255, 0.15)',
  SPIKE_TRAIL: '#FF2020',
  SUPERZAPPER: '#FFD700',
  PARTICLE_POOL: ['#00F0FF', '#FF006E', '#00FF41', '#FFD700'],
};

export const TUBE = {
  OUTER_RADIUS_FACTOR: 0.42,
  INNER_SCALE: 0.15,
  DEPTH_RINGS: 4,
  EDGE_LINE_WIDTH: 2,
  LANE_LINE_WIDTH: 1,
  INNER_PULSE_MIN: 0.12,
  INNER_PULSE_MAX: 0.18,
  INNER_PULSE_SPEED: 2,
};

// Helper to generate regular polygon vertices (normalized -1..1)
function regularPolygon(n, startAngle = -Math.PI / 2) {
  const verts = [];
  for (let i = 0; i < n; i++) {
    const a = startAngle + (i / n) * Math.PI * 2;
    verts.push({ x: Math.cos(a), y: Math.sin(a) });
  }
  return verts;
}

function starVertices(points, innerRatio = 0.5) {
  const verts = [];
  const total = points * 2;
  for (let i = 0; i < total; i++) {
    const a = -Math.PI / 2 + (i / total) * Math.PI * 2;
    const r = i % 2 === 0 ? 1 : innerRatio;
    verts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }
  return verts;
}

export const LEVEL_SHAPES = [
  { name: 'circle', vertices: regularPolygon(16), closed: true },
  { name: 'square', vertices: regularPolygon(4, -Math.PI / 4), closed: true },
  { name: 'plus', vertices: [
    { x: -0.3, y: -1 }, { x: 0.3, y: -1 }, { x: 0.3, y: -0.3 }, { x: 1, y: -0.3 },
    { x: 1, y: 0.3 }, { x: 0.3, y: 0.3 }, { x: 0.3, y: 1 }, { x: -0.3, y: 1 },
    { x: -0.3, y: 0.3 }, { x: -1, y: 0.3 }, { x: -1, y: -0.3 }, { x: -0.3, y: -0.3 },
  ], closed: true },
  { name: 'triangle', vertices: regularPolygon(3), closed: true },
  { name: 'star', vertices: starVertices(5, 0.45), closed: true },
  { name: 'V', vertices: [
    { x: -1, y: -0.8 }, { x: -0.6, y: -0.6 }, { x: -0.3, y: -0.2 },
    { x: 0, y: 0.4 },
    { x: 0.3, y: -0.2 }, { x: 0.6, y: -0.6 }, { x: 1, y: -0.8 },
  ], closed: false },
  { name: 'flat', vertices: [
    { x: -1, y: 0 }, { x: -0.7, y: 0 }, { x: -0.4, y: 0 }, { x: -0.1, y: 0 },
    { x: 0.1, y: 0 }, { x: 0.4, y: 0 }, { x: 0.7, y: 0 }, { x: 1, y: 0 },
  ], closed: false },
  { name: 'pentagon', vertices: regularPolygon(5), closed: true },
  { name: 'steps', vertices: [
    { x: -1, y: 0.6 }, { x: -0.6, y: 0.6 }, { x: -0.6, y: 0.2 }, { x: -0.2, y: 0.2 },
    { x: -0.2, y: -0.2 }, { x: 0.2, y: -0.2 }, { x: 0.2, y: -0.6 }, { x: 0.6, y: -0.6 },
    { x: 0.6, y: -1 }, { x: 1, y: -1 },
  ], closed: false },
  { name: 'hexagon', vertices: regularPolygon(6), closed: true },
  { name: 'clover', vertices: (() => {
    const v = [];
    const lobes = 3;
    const steps = 24;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const r = 0.5 + 0.5 * Math.abs(Math.cos(lobes * a / 2));
      v.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    return v;
  })(), closed: true },
  { name: 'infinity', vertices: (() => {
    const v = [];
    const steps = 24;
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const scale = 1 / (1 + Math.sin(t) * Math.sin(t) * 0.5);
      v.push({ x: Math.cos(t) * scale, y: Math.sin(2 * t) * 0.5 * scale });
    }
    return v;
  })(), closed: true },
  { name: 'W', vertices: [
    { x: -1, y: -0.8 }, { x: -0.65, y: 0.6 }, { x: -0.3, y: -0.2 },
    { x: 0, y: 0.8 },
    { x: 0.3, y: -0.2 }, { x: 0.65, y: 0.6 }, { x: 1, y: -0.8 },
  ], closed: false },
  { name: 'octagon', vertices: regularPolygon(8), closed: true },
  { name: 'diamond', vertices: [
    { x: 0, y: -1 }, { x: 0.5, y: -0.3 }, { x: 1, y: 0 },
    { x: 0.5, y: 0.3 }, { x: 0, y: 1 }, { x: -0.5, y: 0.3 },
    { x: -1, y: 0 }, { x: -0.5, y: -0.3 },
  ], closed: true },
  { name: 'circle-II', vertices: regularPolygon(20), closed: true },
];

export const PLAYER = {
  MOVE_COOLDOWN: 0.08,
  FIRE_RATE: 0.12,
  SIZE: 12,
  DEATH_ANIM_DURATION: 0.6,
};

export const BULLET = {
  SPEED: 1.8,
  MAX_ON_SCREEN: 8,
  SIZE: 3,
};

export const ENEMIES = {
  FLIPPER: { speed: 0.3, points: 150, flipChance: 0.02, flipSpeed: 0.08 },
  TANKER: { speed: 0.2, points: 100, childCount: 2 },
  SPIKER: { speed: 0.25, points: 50, trailInterval: 0.15 },
  PULSAR: { speed: 0.15, points: 200, pulseInterval: 2, pulseDuration: 0.8 },
};

export const LEVELS = {
  ENEMY_COUNTS: [
    6, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14,
  ],
  FLIPPER_START: 1,
  TANKER_START: 3,
  SPIKER_START: 5,
  PULSAR_START: 7,
  BASE_SPAWN_INTERVAL: 2.0,
  MIN_SPAWN_INTERVAL: 0.6,
  SPAWN_INTERVAL_DECAY: 0.08,
  SPEED_SCALE_PER_CYCLE: 0.15,
  WARP_DURATION: 2.0,
  TRANSITION_DURATION: 1.5,
};

export const SUPERZAPPER = {
  FIRST_KILLS_ALL: true,
  CHARGES_PER_LEVEL: 2,
};

export const GLOW = {
  PLAYER_BLUR: 8,
  ENEMY_BLUR: 6,
  BULLET_BLUR: 10,
  TUBE_BLUR: 4,
  HUD_BLUR: 4,
};

export const PARTICLE = {
  COUNT_PER_EXPLOSION: 10,
  SPEED_MIN: 60,
  SPEED_MAX: 200,
  LIFETIME: 0.7,
};

export const GAME = {
  STARTING_LIVES: 3,
  EXTRA_LIFE_SCORE: 20000,
  GLITCH_DURATION: 0.4,
  SCREEN_SHAKE_DURATION: 0.3,
  SCREEN_SHAKE_INTENSITY: 6,
};

export const HIT_GLITCH = {
  KILL: { chance: 0.4, duration: 0.08, intensity: 0.15 },
  DEATH: { chance: 1.0, duration: 0.3, intensity: 0.6 },
  SUPERZAPPER: { chance: 1.0, duration: 0.25, intensity: 0.5 },
  WARP: { chance: 1.0, duration: 0.2, intensity: 0.4 },
  LEVEL_CLEAR: { chance: 1.0, duration: 0.15, intensity: 0.3 },
};
