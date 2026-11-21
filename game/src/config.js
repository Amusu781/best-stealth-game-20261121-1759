// Shared tuning for The Night Archivist: tile grid, canvas size and the numbers
// that make sneaking feel fair (detection speed, guard pace, cone size).
export const TILE = 40;
export const COLS = 24;
export const ROWS = 15;
export const HUD_H = 40;
export const VIEW_W = COLS * TILE;
export const VIEW_H = ROWS * TILE;
export const CANVAS_W = VIEW_W;
export const CANVAS_H = HUD_H + VIEW_H;

export const PLAYER_RADIUS = 13;
export const PLAYER_WALK_SPEED = 132;
export const PLAYER_SNEAK_SPEED = 68;
export const GUARD_RADIUS = 14;
export const GUARD_PATROL_SPEED = 56;
export const GUARD_CHASE_SPEED = 98;
export const GUARD_CONE_RANGE = 175;
export const GUARD_CONE_HALF_ANGLE = 0.56; // ~32 degrees each side
export const GUARD_CAUGHT_DISTANCE = 21;

export const SUSPICION_RISE_CLOSE = 62; // per second, player near the guard
export const SUSPICION_RISE_FAR = 20; // per second, at the cone's edge
export const SUSPICION_DECAY = 26; // per second while unseen
export const SNEAK_DETECTION_FACTOR = 0.5;
export const LAMP_DETECTION_FACTOR = 1.5;
export const STILL_DETECTION_FACTOR = 0.7;
export const ALERT_LOSE_SIGHT_SECONDS = 2.5;
export const INVESTIGATE_SECONDS = 3.0;

export const PEBBLES_PER_FLOOR = 3;
export const PEBBLE_RANGE = 330;
export const NOISE_RADIUS = 250;

export const COLORS = {
  floorA: '#3a322a',
  floorB: '#322b25',
  wall: '#171310',
  wallTop: '#4a3f33',
  crate: '#7a5a33',
  crateEdge: '#543d20',
  shelf: '#5c3a4a',
  shelfEdge: '#3f2833',
  plant: '#2e6b34',
  plantDark: '#1d4a22',
  lampGlow: 'rgba(255, 196, 90, 0.16)',
  exitLocked: '#8a2f2f',
  exitOpen: '#2f8a4f',
  ledger: '#e8b64c',
  player: '#3fb6a8',
  playerDark: '#237a6f',
  guard: '#c94f4f',
  guardDark: '#7e2a2a',
  coneCalm: 'rgba(255, 214, 90, 0.20)',
  coneCalmEdge: 'rgba(255, 214, 90, 0.55)',
  coneSuspicious: 'rgba(255, 140, 60, 0.30)',
  coneAlert: 'rgba(255, 60, 60, 0.34)',
  hud: '#14100d',
  hudText: '#e8dcc0',
  dark: 'rgba(6, 8, 18, 0.60)',
};
