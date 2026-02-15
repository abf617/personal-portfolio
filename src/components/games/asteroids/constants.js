// Cyberpunk Asteroids - Game Constants

export const COLORS = {
  SHIP: '#00F0FF',       // neon-cyan
  ASTEROID: '#00FF41',   // neon-green
  BULLET: '#FF006E',     // neon-magenta
  HUD: '#00F0FF',
  HUD_LABEL: '#00FF41',
  PARTICLE_POOL: ['#00F0FF', '#FF006E', '#00FF41'],
};

export const SHIP = {
  ROTATION_SPEED: 4.5,      // radians per second
  THRUST: 300,               // pixels per second squared
  FRICTION: 0.98,            // velocity multiplier per frame
  MAX_SPEED: 400,
  FIRE_RATE: 0.2,            // seconds between shots
  INVINCIBILITY_TIME: 3,     // seconds after respawn
  SIZE: 15,                  // radius for collision + drawing scale
};

export const ASTEROID_SIZES = {
  LARGE:  { radius: 40, minSpeed: 30, maxSpeed: 80, points: 20 },
  MEDIUM: { radius: 22, minSpeed: 50, maxSpeed: 120, points: 50 },
  SMALL:  { radius: 10, minSpeed: 70, maxSpeed: 160, points: 100 },
};

export const ASTEROID = {
  SPLIT_COUNT: 2,
  JAGGED_VERTICES: 10,      // number of polygon vertices
  JAGGEDNESS: 0.4,          // how irregular the shape is (0-1)
};

export const BULLET = {
  SPEED: 500,
  LIFETIME: 1.5,             // seconds
  MAX_ON_SCREEN: 8,
  SIZE: 2,
};

export const PARTICLE = {
  COUNT_PER_EXPLOSION: 12,
  THRUST_COUNT: 2,
  SPEED_MIN: 40,
  SPEED_MAX: 180,
  LIFETIME: 0.8,
};

export const LEVELS = {
  BASE_ASTEROIDS: 4,         // starting asteroid count
  ASTEROIDS_PER_LEVEL: 1,   // additional per level
  MAX_ASTEROIDS: 12,
  SPEED_SCALE_PER_LEVEL: 0.05,
  TRANSITION_DURATION: 2,    // seconds to show level text
};

export const GAME = {
  STARTING_LIVES: 3,
  EXTRA_LIFE_SCORE: 10000,
  RESPAWN_DELAY: 1.5,        // seconds before ship reappears
  GLITCH_DURATION: 0.4,      // seconds for death glitch effect
  SCREEN_SHAKE_DURATION: 0.3,
  SCREEN_SHAKE_INTENSITY: 6,
};

// Per-size glitch on asteroid destruction
// chance: probability of triggering, duration/intensity scale the canvas effect
export const HIT_GLITCH = {
  LARGE:  { chance: 1.0,  duration: 0.18, intensity: 0.35 },
  MEDIUM: { chance: 0.45, duration: 0.10, intensity: 0.18 },
  SMALL:  { chance: 0.20, duration: 0.06, intensity: 0.10 },
};

export const GLOW = {
  SHIP_BLUR: 8,
  ASTEROID_BLUR: 5,
  BULLET_BLUR: 10,
  HUD_BLUR: 4,
};
