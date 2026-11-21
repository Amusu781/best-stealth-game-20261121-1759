// Guard behaviour: patrol waypoints you can learn, a suspicion meter that
// rises when the player is seen and decays when they are not, and a chase that
// gives the player a chance to break away and recover.
//
// States: patrol -> suspicious (pauses, looks toward the player) -> alert
// (chases) -> investigate (checks the last seen spot or a thrown pebble) ->
// patrol. A guard that loses the player calms down; nobody stays angry forever.
import { TILE, GUARD_PATROL_SPEED, GUARD_CHASE_SPEED, GUARD_CAUGHT_DISTANCE,
  SUSPICION_RISE_CLOSE, SUSPICION_RISE_FAR, SUSPICION_DECAY, SNEAK_DETECTION_FACTOR,
  LAMP_DETECTION_FACTOR, STILL_DETECTION_FACTOR, ALERT_LOSE_SIGHT_SECONDS,
  INVESTIGATE_SECONDS, GUARD_CONE_RANGE } from './config.js';
import { guardCanSeePlayer, playerIsLit } from './vision.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_SUSPICIOUS = 'suspicious';
export const GUARD_ALERT = 'alert';
export const GUARD_INVESTIGATE = 'investigate';

function tileCentre(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

export class Guard {
  constructor(def) {
    this.waypoints = def.waypoints.map(([x, y]) => tileCentre(x, y));
    this.speed = def.speed ?? GUARD_PATROL_SPEED;
    const start = this.waypoints[0];
    this.x = start.x;
    this.y = start.y;
    this.waypointIndex = 1 % this.waypoints.length;
    const next = this.waypoints[this.waypointIndex];
    this.angle = Math.atan2(next.y - start.y, next.x - start.x);
    this.state = GUARD_PATROL;
    this.suspicion = 0;
    this.lastSeen = null;
    this.unseenFor = 0;
    this.investigateFor = 0;
    this.investigateTarget = null;
    this.pauseFor = 0;
    this.stepTimer = Math.random() * 0.4;
  }

  /** Move toward (tx, ty) at `speed`, sliding along solid tiles. Returns arrived. */
  moveToward(floor, tx, ty, speed, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return true;
    const step = Math.min(dist, speed * dt);
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    this.angle = Math.atan2(dy, dx);
    if (!this.hitsSolid(floor, nx, this.y)) this.x = nx;
    if (!this.hitsSolid(floor, this.x, ny)) this.y = ny;
    return dist - step < 2;
  }

  hitsSolid(floor, px, py) {
    const r = 12;
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

  /** A thrown pebble (or any loud noise) sends this guard to look at the spot. */
  hearNoise(x, y) {
    if (this.state === GUARD_ALERT) return;
    this.investigateTarget = { x, y };
    this.investigateFor = INVESTIGATE_SECONDS;
    this.state = GUARD_INVESTIGATE;
    this.suspicion = Math.max(this.suspicion, 35);
  }

  update(floor, player, dt) {
    const sees = guardCanSeePlayer(floor, this, player);
    const dist = Math.hypot(player.x - this.x, player.y - this.y);

    if (sees) {
      this.lastSeen = { x: player.x, y: player.y };
      this.unseenFor = 0;
      // Closer is scarier; sneaking, standing still and darkness all slow the rise.
      const closeness = 1 - dist / GUARD_CONE_RANGE;
      let rate = SUSPICION_RISE_FAR + (SUSPICION_RISE_CLOSE - SUSPICION_RISE_FAR) * closeness;
      if (player.sneaking) rate *= SNEAK_DETECTION_FACTOR;
      if (!player.moving) rate *= STILL_DETECTION_FACTOR;
      if (playerIsLit(floor, player)) rate *= LAMP_DETECTION_FACTOR;
      this.suspicion = Math.min(100, this.suspicion + rate * dt);
    } else {
      this.unseenFor += dt;
      this.suspicion = Math.max(0, this.suspicion - SUSPICION_DECAY * dt);
    }

    if (this.state === GUARD_PATROL) {
      if (this.suspicion >= 100) {
        this.state = GUARD_ALERT;
      } else if (this.suspicion >= 50) {
        this.state = GUARD_SUSPICIOUS;
        this.pauseFor = 1.1;
      } else {
        const target = this.waypoints[this.waypointIndex];
        if (this.moveToward(floor, target.x, target.y, this.speed, dt)) {
          this.waypointIndex = (this.waypointIndex + 1) % this.waypoints.length;
        }
      }
    } else if (this.state === GUARD_SUSPICIOUS) {
      // Pause and stare toward where the player was glimpsed; a near miss raises
      // the alarm without ending the run.
      if (this.lastSeen) this.angle = Math.atan2(this.lastSeen.y - this.y, this.lastSeen.x - this.x);
      this.pauseFor -= dt;
      if (this.suspicion >= 100) {
        this.state = GUARD_ALERT;
      } else if (this.pauseFor <= 0 && this.suspicion < 30) {
        this.state = GUARD_PATROL;
      }
    } else if (this.state === GUARD_ALERT) {
      const target = sees ? { x: player.x, y: player.y } : this.lastSeen;
      if (target) this.moveToward(floor, target.x, target.y, GUARD_CHASE_SPEED, dt);
      if (!sees && this.unseenFor > ALERT_LOSE_SIGHT_SECONDS) {
        // Broke away: the guard checks the last seen spot, then calms down.
        this.state = GUARD_INVESTIGATE;
        this.investigateTarget = this.lastSeen;
        this.investigateFor = INVESTIGATE_SECONDS;
      }
    } else if (this.state === GUARD_INVESTIGATE) {
      if (this.suspicion >= 100) {
        this.state = GUARD_ALERT;
      } else if (this.investigateTarget) {
        const arrived = this.moveToward(
          floor, this.investigateTarget.x, this.investigateTarget.y, this.speed * 1.15, dt,
        );
        if (arrived) {
          this.investigateFor -= dt;
          this.angle += dt * 1.6; // look around while checking the spot
          if (this.investigateFor <= 0 && this.suspicion < 30) {
            this.state = GUARD_PATROL;
            this.investigateTarget = null;
          }
        }
      }
    }

    // Footstep timing for the audio engine: guards walk on a steady beat.
    this.stepTimer -= dt;
    if (this.stepTimer <= 0 && (this.state === GUARD_PATROL || this.state === GUARD_INVESTIGATE)) {
      this.stepTimer = 0.5;
      this.stepped = true;
    } else {
      this.stepped = false;
    }
  }

  /** True when this guard has caught the player. */
  caughtPlayer(player) {
    return (
      this.state === GUARD_ALERT &&
      Math.hypot(player.x - this.x, player.y - this.y) < GUARD_CAUGHT_DISTANCE
    );
  }
}
