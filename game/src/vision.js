// Raycast vision: what a guard can actually see, and the cone the player sees.
// A tile blocks sight when it is a wall, a crate, a shelf or a plant. Rays are
// marched in small steps and stop at the first blocking tile, so a cone bends
// around cover exactly the way the player expects.
import { TILE, GUARD_CONE_RANGE, GUARD_CONE_HALF_ANGLE } from './config.js';

const RAY_STEP = 4;
const CONE_RAYS = 40;

/** True when the tile at (tx, ty) blocks a line of sight. */
export function tileBlocksSight(floor, tx, ty) {
  const k = `${tx},${ty}`;
  return (
    floor.walls.has(k) || floor.crates.has(k) || floor.shelves.has(k) || floor.plants.has(k)
  );
}

/** True when the straight line from (x0, y0) to (x1, y1) crosses no sight-blocking tile. */
export function hasLineOfSight(floor, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const steps = Math.ceil(dist / RAY_STEP);
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const tx = Math.floor((x0 + dx * t) / TILE);
    const ty = Math.floor((y0 + dy * t) / TILE);
    if (tileBlocksSight(floor, tx, ty)) return false;
  }
  return true;
}

/** Cast one ray from (x, y) at `angle`; return how far it travels before hitting cover. */
export function castRay(floor, x, y, angle, maxDist) {
  let dist = 0;
  const stepX = Math.cos(angle) * RAY_STEP;
  const stepY = Math.sin(angle) * RAY_STEP;
  while (dist < maxDist) {
    dist += RAY_STEP;
    const px = x + stepX * (dist / RAY_STEP);
    const py = y + stepY * (dist / RAY_STEP);
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    if (tileBlocksSight(floor, tx, ty)) return dist;
  }
  return maxDist;
}

/** The vision cone as a polygon: the guard's position plus one point per ray. */
export function conePolygon(floor, guard) {
  const points = [{ x: guard.x, y: guard.y }];
  for (let i = 0; i <= CONE_RAYS; i += 1) {
    const angle = guard.angle - GUARD_CONE_HALF_ANGLE + (2 * GUARD_CONE_HALF_ANGLE * i) / CONE_RAYS;
    const dist = castRay(floor, guard.x, guard.y, angle, GUARD_CONE_RANGE);
    points.push({ x: guard.x + Math.cos(angle) * dist, y: guard.y + Math.sin(angle) * dist });
  }
  return points;
}

/** True when the player stands on a plant tile: soft cover hides them outright. */
export function playerIsConcealed(floor, player) {
  const tx = Math.floor(player.x / TILE);
  const ty = Math.floor(player.y / TILE);
  return floor.plants.has(`${tx},${ty}`);
}

/** True when the player stands inside a lamp's pool of light. */
export function playerIsLit(floor, player) {
  for (const [lx, ly] of floor.lamps) {
    const cx = lx * TILE + TILE / 2;
    const cy = ly * TILE + TILE / 2;
    if (Math.hypot(player.x - cx, player.y - cy) < TILE * 1.6) return true;
  }
  return false;
}

/**
 * Can this guard see the player right now? Inside the cone, inside range, with a
 * clear line of sight — and not when the player is hidden in soft cover.
 */
export function guardCanSeePlayer(floor, guard, player) {
  if (playerIsConcealed(floor, player)) return false;
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD_CONE_RANGE) return false;
  let diff = Math.atan2(dy, dx) - guard.angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) > GUARD_CONE_HALF_ANGLE) return false;
  return hasLineOfSight(floor, guard.x, guard.y, player.x, player.y);
}
