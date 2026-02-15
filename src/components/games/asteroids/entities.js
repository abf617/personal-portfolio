import {
  SHIP, ASTEROID_SIZES, ASTEROID, BULLET, PARTICLE, COLORS,
} from './constants.js';

// Wrap a value around screen boundaries
function wrap(val, max) {
  if (val < 0) return val + max;
  if (val > max) return val - max;
  return val;
}

// ── Ship ──────────────────────────────────────────────────────────

export class Ship {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.rotation = -Math.PI / 2; // pointing up
    this.thrusting = false;
    this.fireCooldown = 0;
    this.invincibleTimer = SHIP.INVINCIBILITY_TIME;
    this.alive = true;
    this.respawnTimer = 0;
  }

  get invincible() {
    return this.invincibleTimer > 0;
  }

  update(dt, width, height) {
    if (!this.alive) return;

    // Thrust
    if (this.thrusting) {
      this.vx += Math.cos(this.rotation) * SHIP.THRUST * dt;
      this.vy += Math.sin(this.rotation) * SHIP.THRUST * dt;
    }

    // Friction
    this.vx *= SHIP.FRICTION;
    this.vy *= SHIP.FRICTION;

    // Speed cap
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > SHIP.MAX_SPEED) {
      this.vx = (this.vx / speed) * SHIP.MAX_SPEED;
      this.vy = (this.vy / speed) * SHIP.MAX_SPEED;
    }

    // Move
    this.x = wrap(this.x + this.vx * dt, width);
    this.y = wrap(this.y + this.vy * dt, height);

    // Cooldowns
    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
  }

  getVertices() {
    const s = SHIP.SIZE;
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);
    // Triangle: nose, bottom-left, bottom-right
    return [
      { x: this.x + cos * s * 1.4, y: this.y + sin * s * 1.4 },             // nose
      { x: this.x + cos * (-s) - sin * s, y: this.y + sin * (-s) + cos * s }, // bottom-left
      { x: this.x + cos * (-s) + sin * s, y: this.y + sin * (-s) - cos * s }, // bottom-right
    ];
  }

  getThrustPoint() {
    const s = SHIP.SIZE;
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);
    return {
      x: this.x + cos * (-s * 1.1),
      y: this.y + sin * (-s * 1.1),
    };
  }
}

// ── Asteroid ──────────────────────────────────────────────────────

export class AsteroidEntity {
  constructor(x, y, size, width, height) {
    this.x = x;
    this.y = y;
    this.size = size; // 'LARGE' | 'MEDIUM' | 'SMALL'
    const cfg = ASTEROID_SIZES[size];
    this.radius = cfg.radius;
    this.points = cfg.points;

    // Random velocity
    const angle = Math.random() * Math.PI * 2;
    const speed = cfg.minSpeed + Math.random() * (cfg.maxSpeed - cfg.minSpeed);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.rotationAngle = 0;
    this.rotationSpeed = (Math.random() - 0.5) * 2; // radians/sec

    this.screenWidth = width;
    this.screenHeight = height;

    // Generate jagged shape
    this.shape = this._generateShape();
  }

  _generateShape() {
    const verts = ASTEROID.JAGGED_VERTICES;
    const points = [];
    for (let i = 0; i < verts; i++) {
      const angle = (i / verts) * Math.PI * 2;
      const jag = 1 - ASTEROID.JAGGEDNESS + Math.random() * ASTEROID.JAGGEDNESS * 2;
      points.push({
        angle,
        dist: this.radius * jag,
      });
    }
    return points;
  }

  getVertices() {
    return this.shape.map(p => ({
      x: this.x + Math.cos(p.angle + this.rotationAngle) * p.dist,
      y: this.y + Math.sin(p.angle + this.rotationAngle) * p.dist,
    }));
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, this.screenWidth);
    this.y = wrap(this.y + this.vy * dt, this.screenHeight);
    this.rotationAngle += this.rotationSpeed * dt;
  }

  split() {
    const nextSize =
      this.size === 'LARGE' ? 'MEDIUM' :
      this.size === 'MEDIUM' ? 'SMALL' : null;

    if (!nextSize) return [];

    const children = [];
    for (let i = 0; i < ASTEROID.SPLIT_COUNT; i++) {
      const child = new AsteroidEntity(
        this.x, this.y, nextSize,
        this.screenWidth, this.screenHeight,
      );
      children.push(child);
    }
    return children;
  }
}

// ── Bullet ────────────────────────────────────────────────────────

export class BulletEntity {
  constructor(x, y, rotation) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(rotation) * BULLET.SPEED;
    this.vy = Math.sin(rotation) * BULLET.SPEED;
    this.lifetime = BULLET.LIFETIME;
    this.alive = true;
  }

  update(dt, width, height) {
    this.x = wrap(this.x + this.vx * dt, width);
    this.y = wrap(this.y + this.vy * dt, height);
    this.lifetime -= dt;
    if (this.lifetime <= 0) this.alive = false;
  }
}

// ── Particle ──────────────────────────────────────────────────────

export class ParticleEntity {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = PARTICLE.SPEED_MIN + Math.random() * (PARTICLE.SPEED_MAX - PARTICLE.SPEED_MIN);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.lifetime = PARTICLE.LIFETIME * (0.5 + Math.random() * 0.5);
    this.maxLifetime = this.lifetime;
    this.color = color || COLORS.PARTICLE_POOL[Math.floor(Math.random() * COLORS.PARTICLE_POOL.length)];
    this.alive = true;
  }

  get alpha() {
    return Math.max(0, this.lifetime / this.maxLifetime);
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.lifetime -= dt;
    if (this.lifetime <= 0) this.alive = false;
  }
}

// ── Factory helpers ───────────────────────────────────────────────

export function createExplosion(x, y, count = PARTICLE.COUNT_PER_EXPLOSION) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push(new ParticleEntity(x, y));
  }
  return particles;
}

export function createThrustParticle(x, y) {
  const p = new ParticleEntity(x, y, COLORS.SHIP);
  // Override to be a smaller, shorter-lived particle
  p.lifetime = 0.2 + Math.random() * 0.2;
  p.maxLifetime = p.lifetime;
  const speed = 30 + Math.random() * 60;
  const angle = Math.random() * Math.PI * 2;
  p.vx = Math.cos(angle) * speed;
  p.vy = Math.sin(angle) * speed;
  return p;
}
