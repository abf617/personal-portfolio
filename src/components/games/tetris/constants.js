export const COLORS = {
  I: '#00F0FF',
  O: '#FFD700',
  T: '#FF006E',
  S: '#00FF41',
  Z: '#FF3333',
  J: '#4488FF',
  L: '#FF8800',
  GRID: 'rgba(255, 255, 255, 0.04)',
  WALL: 'rgba(0, 240, 255, 0.4)',
  GHOST: 'rgba(255, 255, 255, 0.12)',
  HUD: '#00F0FF',
  HUD_LABEL: '#00FF41',
  LOCKED_ALPHA: 0.4,
  CORRUPTION_POOL: ['#00F0FF', '#FF006E', '#00FF41', '#FFD700'],
};

export const GRID = {
  CELL_SIZE: 28,
  COLS: 10,
  ROWS: 20,
  HUD_HEIGHT: 50,
  SIDE_PANEL_CELLS: 6,
};

// Standard SRS tetromino shapes: each piece has 4 rotation states
// Each state is a list of [row, col] offsets from the piece origin
export const PIECES = {
  I: [
    [[0,0],[0,1],[0,2],[0,3]],
    [[0,2],[1,2],[2,2],[3,2]],
    [[2,0],[2,1],[2,2],[2,3]],
    [[0,1],[1,1],[2,1],[3,1]],
  ],
  O: [
    [[0,1],[0,2],[1,1],[1,2]],
    [[0,1],[0,2],[1,1],[1,2]],
    [[0,1],[0,2],[1,1],[1,2]],
    [[0,1],[0,2],[1,1],[1,2]],
  ],
  T: [
    [[0,1],[1,0],[1,1],[1,2]],
    [[0,1],[1,1],[1,2],[2,1]],
    [[1,0],[1,1],[1,2],[2,1]],
    [[0,1],[1,0],[1,1],[2,1]],
  ],
  S: [
    [[0,1],[0,2],[1,0],[1,1]],
    [[0,1],[1,1],[1,2],[2,2]],
    [[1,1],[1,2],[2,0],[2,1]],
    [[0,0],[1,0],[1,1],[2,1]],
  ],
  Z: [
    [[0,0],[0,1],[1,1],[1,2]],
    [[0,2],[1,1],[1,2],[2,1]],
    [[1,0],[1,1],[2,1],[2,2]],
    [[0,1],[1,0],[1,1],[2,0]],
  ],
  J: [
    [[0,0],[1,0],[1,1],[1,2]],
    [[0,1],[0,2],[1,1],[2,1]],
    [[1,0],[1,1],[1,2],[2,2]],
    [[0,1],[1,1],[2,0],[2,1]],
  ],
  L: [
    [[0,2],[1,0],[1,1],[1,2]],
    [[0,1],[1,1],[2,1],[2,2]],
    [[1,0],[1,1],[1,2],[2,0]],
    [[0,0],[0,1],[1,1],[2,1]],
  ],
};

// SRS wall kick data: offsets to try when rotation collides
// Key format: "fromState>toState", values are [col, row] offsets
const JLSTZ_KICKS = {
  '0>1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '1>0': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '1>2': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '2>1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '2>3': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '3>2': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '3>0': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '0>3': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
};

const I_KICKS = {
  '0>1': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  '1>0': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  '1>2': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
  '2>1': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
  '2>3': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  '3>2': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  '3>0': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
  '0>3': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
};

export function getWallKicks(type, fromRot, toRot) {
  const key = `${fromRot}>${toRot}`;
  return type === 'I' ? (I_KICKS[key] || []) : (JLSTZ_KICKS[key] || []);
}

// Drop speed per level (ms)
export const SPEED = [
  800, 720, 630, 550, 470, 380, 300, 220, 170, 130,
  100, 80, 70, 60, 50, 50,
];

export const SCORING = {
  SINGLE: 100,
  DOUBLE: 300,
  TRIPLE: 500,
  TETRIS: 800,
  SOFT_DROP: 1,
  HARD_DROP: 2,
};

export const LEVELS = {
  LINES_PER_LEVEL: 10,
};

export const GLITCH = {
  SINGLE:  { duration: 0.06, intensity: 0.08 },
  DOUBLE:  { duration: 0.12, intensity: 0.18 },
  TRIPLE:  { duration: 0.2, intensity: 0.3 },
  TETRIS:  { duration: 0.35, intensity: 0.5 },
  DEATH:   { duration: 0.5, intensity: 1.0 },
  LINE_CLEAR_ANIM: 0.3,
  AMBIENT_BASE_CHANCE: 0.008,
};

export const GLOW = {
  ACTIVE_BLUR: 10,
  LOCKED_BLUR: 3,
  GHOST_BLUR: 0,
  HUD_BLUR: 4,
  WALL_BLUR: 6,
};

export const GAME = {
  SHAKE_INTENSITY: 8,
  SHAKE_DURATION: 0.3,
  DAS: 167,
  ARR: 33,
  LOCK_DELAY: 500,
  FLASH_DURATION: 1.0,
};
