// Staged screenshot scenes behind ?shot=play|alert|title|win. Each scene sets the
// game to a fixed, hand-placed state — a real frame of the real game, the same
// every time — so the screenshots show the level, the guards and their cones,
// the cover and the exit in one frame.
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_CAUGHT, SCREEN_WIN, SCREEN_FLOOR_CLEAR } from './render.js';

/** Place the game in the named scene and return the screen to draw. */
export function stageShot(name, game) {
  if (name === 'alert') {
    // Floor 3, mid-chase: a guard has spotted the player, cones gone red.
    game.loadFloor(2);
    game.player.x = 11 * 40 + 20;
    game.player.y = 9 * 40 + 20;
    game.player.angle = Math.PI;
    game.player.sneaking = true;
    const guard = game.guards[3];
    guard.x = 13 * 40 + 20;
    guard.y = 9 * 40 + 20;
    guard.angle = Math.PI;
    guard.state = 'alert';
    guard.suspicion = 100;
    guard.lastSeen = { x: game.player.x, y: game.player.y };
    const watcher = game.guards[0];
    watcher.state = 'suspicious';
    watcher.suspicion = 68;
    watcher.angle = Math.PI * 0.75;
    game.screen = SCREEN_PLAY;
    game.elapsed = 142.8;
    return;
  }
  if (name === 'title') {
    game.loadFloor(0);
    game.screen = SCREEN_TITLE;
    return;
  }
  if (name === 'win') {
    game.loadFloor(2);
    for (const ledger of game.floor.ledgers) ledger.taken = true;
    game.ledgersGot = game.ledgersTotal;
    game.elapsed = 284.6;
    game.timeText = '4:44';
    game.screen = SCREEN_WIN;
    return;
  }
  // Default: 'play' — floor 2 mid-game, player crouched behind a crate with
  // two cones sweeping nearby and the exit glowing in the corner.
  game.loadFloor(1);
  game.player.x = 9 * 40 + 20;
  game.player.y = 8 * 40 + 20;
  game.player.angle = -Math.PI / 2;
  game.player.sneaking = true;
  const patroller = game.guards[1];
  patroller.x = 6 * 40 + 20;
  patroller.y = 7 * 40 + 20;
  patroller.angle = 0;
  const second = game.guards[2];
  second.x = 14 * 40 + 20;
  second.y = 12 * 40 + 20;
  second.angle = Math.PI;
  game.floor.ledgers[0].taken = true;
  game.ledgersGot = 1;
  game.elapsed = 96.4;
  game.screen = SCREEN_PLAY;
  game.maxSuspicion = 0;
}

export { SCREEN_TITLE, SCREEN_PLAY, SCREEN_CAUGHT, SCREEN_WIN, SCREEN_FLOOR_CLEAR };
