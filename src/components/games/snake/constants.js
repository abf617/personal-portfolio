// Cyberpunk Snake - Game Constants

export const COLORS = {
  SNAKE_HEAD: '#00F0FF',
  SNAKE_BODY: 'rgba(0, 240, 255, 0.6)',
  FOOD: '#00FF41',
  VIRUS: '#FF006E',
  GRID: 'rgba(255, 255, 255, 0.05)',
  WALL: 'rgba(0, 240, 255, 0.3)',
  HUD: '#00F0FF',
  HUD_LABEL: '#00FF41',
  CORRUPTION_POOL: ['#00F0FF', '#FF006E', '#00FF41', '#FFD700'],
};

export const GRID = {
  CELL_SIZE: 25,
  HUD_HEIGHT: 50,
};

export const SNAKE = {
  INITIAL_LENGTH: 3,
  INITIAL_DIRECTION: 'RIGHT',
};

export const SPEED = {
  BASE_TICK: 200,
  MIN_TICK: 80,
  SPEED_UP_EVERY: 5,
  TICK_REDUCTION: 15,
};

export const FOOD = {
  POINTS: 10,
  BONUS_POINTS: 50,
  BONUS_SPAWN_INTERVAL: 15000,
  BONUS_DESPAWN_TIME: 6000,
};

export const GLITCH = {
  FOOD_EAT: { chance: 1.0, duration: 0.08, intensity: 0.12 },
  VIRUS_EAT: { chance: 1.0, duration: 0.2, intensity: 0.4 },
  DEATH: { duration: 0.4, intensity: 1.0 },
  CORRUPTION_DURATION: 3000,
  AMBIENT_BASE_CHANCE: 0.01,
};

export const GLOW = {
  HEAD_BLUR: 10,
  FOOD_BLUR: 8,
  VIRUS_BLUR: 12,
  HUD_BLUR: 4,
  WALL_BLUR: 6,
};

export const GAME = {
  SCREEN_SHAKE_DURATION: 0.3,
  SCREEN_SHAKE_INTENSITY: 8,
  SPEED_UP_FLASH_DURATION: 1.0,
};
