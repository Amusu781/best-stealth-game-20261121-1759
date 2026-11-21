// The player: a hooded archivist who walks, sneaks and throws pebbles.
// WASD / arrows to move, Shift to sneak (slower, quieter, harder to spot),
// click to throw a pebble at the mouse — a guard that hears it goes to look.
import { TILE, PLAYER_RADIUS, PLAYER_WALK_SPEED, PLAYER_SNEAK_SPEED,
  PEBBLE_RANGE } from './config.js';

export class Player {
  constructor(startTile) {
    this.reset(startTile);
  }

  reset(startTile) {
    this.x = startTile[0] * TILE + TILE / 2;
    this.y = startTile[1] * TILE + TILE / 2;
    this.angle = -Math.PI / 2;
    this.sneaking = false;
    this.moving = false;
    this.stepTimer = 0;
    this.stepped = false;
  }

  hitsSolid(floor, px, py) {
    const r = PLAYER_RADIUS - 2;
    const corners = [
      [px - r, py - r], [px + r, py - r], [px - r, py + r], [px + r, py + r],
    ];
    for (const [cx, cy] of corners) {
      const tx = Math.floor(cx / TILE);
      const ty = Math.floor(cy / TILE);
      const k = `${tx},${ty}`;
      if (floor.walls.has(k) || floor.crates.has(k) || floor.shelves.has(k)) return true;
    }
    return false;
  }

  /** Move from the held keys; returns nothing, sets moving/sneaking/stepped. */
  update(floor, keys, dt) {
    let dx = 0;
    let dy = 0;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;
    if (keys.up) dy -= 1;
    if (keys.down) dy += 1;
    this.moving = dx !== 0 || dy !== 0;
    this.sneaking = Boolean(keys.sneak);
    if (!this.moving) {
      this.stepped = false;
      return;
    }
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
    const speed = this.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_WALK_SPEED;
    const nx = this.x + dx * speed * dt;
    const ny = this.y + dy * speed * dt;
    this.angle = Math.atan2(dy, dx);
    if (!this.hitsSolid(floor, nx, this.y)) this.x = nx;
    if (!this.hitsSolid(floor, this.x, ny)) this.y = ny;

    // Footstep timing: a soft beat while sneaking, a louder one while walking.
    this.stepTimer -= dt;
    if (this.stepTimer <= 0) {
      this.stepTimer = this.sneaking ? 0.52 : 0.34;
      this.stepped = true;
    } else {
      this.stepped = false;
    }
  }

  /** The pebble's landing point for a click at world (mx, my), clamped to range. */
  pebbleTarget(mx, my) {
    const dx = mx - this.x;
    const dy = my - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= PEBBLE_RANGE) return { x: mx, y: my };
    return {
      x: this.x + (dx / dist) * PEBBLE_RANGE,
      y: this.y + (dy / dist) * PEBBLE_RANGE,
    };
  }
}
