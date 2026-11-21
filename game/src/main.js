// The Night Archivist — bootstrap, game loop and input. The game itself lives in
// levels.js (floors), guards.js (patrols and suspicion), vision.js (raycast
// cones), player.js (movement and pebbles), audio.js (synthesised sound) and
// render.js (everything drawn). This file only wires them together.
import { CANVAS_W, CANVAS_H, HUD_H, TILE, PEBBLES_PER_FLOOR, NOISE_RADIUS } from './config.js';
import { FLOOR_DEFS, buildFloor } from './levels.js';
import { Guard, GUARD_ALERT } from './guards.js';
import { Player } from './player.js';
import { SoundEngine } from './audio.js';
import { render, SCREEN_TITLE, SCREEN_PLAY, SCREEN_FLOOR_CLEAR, SCREEN_CAUGHT,
  SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const game = {
  screen: SCREEN_TITLE,
  floorIndex: 0,
  floor: null,
  guards: [],
  player: null,
  ledgersGot: 0,
  ledgersTotal: 0,
  pebbles: PEBBLES_PER_FLOOR,
  pebblesThrown: [],
  elapsed: 0,
  floorTime: 0,
  floorTimeText: '0:00',
  floorClearedText: '',
  timeText: '0:00',
  maxSuspicion: 0,
  keys: { up: false, down: false, left: false, right: false, sneak: false },
  sound: new SoundEngine(),
  alarmed: false,
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Load a floor fresh: player at the door, guards on patrol, ledgers sealed. */
game.loadFloor = function loadFloor(index) {
  game.floorIndex = index;
  game.floor = buildFloor(FLOOR_DEFS[index]);
  game.guards = game.floor.guards.map((def) => new Guard(def));
  game.player = new Player(game.floor.playerStart);
  game.ledgersGot = 0;
  game.ledgersTotal = game.floor.ledgers.length;
  game.pebbles = PEBBLES_PER_FLOOR;
  game.pebblesThrown = [];
  game.floorTime = 0;
  game.maxSuspicion = 0;
  game.alarmed = false;
  game.timeText = formatTime(game.elapsed);
};

function startGame() {
  game.elapsed = 0;
  game.loadFloor(0);
  game.screen = SCREEN_PLAY;
  announce('Floor 1: The Reading Room. Stay out of the cones.');
}

function nextFloor() {
  if (game.floorIndex + 1 >= FLOOR_DEFS.length) {
    game.screen = SCREEN_WIN;
    game.sound.win();
    announce('You stole every ledger. The archive is yours.');
    return;
  }
  game.loadFloor(game.floorIndex + 1);
  game.screen = SCREEN_PLAY;
  announce(`${game.floor.name}. ${game.floor.subtitle}`);
}

function announce(text) {
  statusEl.textContent = text;
}

function exitTileCentre() {
  return {
    x: game.floor.exit[0] * TILE + TILE / 2,
    y: game.floor.exit[1] * TILE + TILE / 2,
  };
}

function update(dt) {
  if (game.screen !== SCREEN_PLAY) return;
  game.elapsed += dt;
  game.floorTime += dt;
  game.timeText = formatTime(game.elapsed);
  game.floorTimeText = formatTime(game.floorTime);

  game.player.update(game.floor, game.keys, dt);
  if (game.player.stepped) {
    game.sound.footstep(0, game.player.sneaking ? 0.08 : 0.16, false);
  }

  let maxSuspicion = 0;
  let anyAlert = false;
  for (const guard of game.guards) {
    const wasAlert = guard.state === GUARD_ALERT;
    guard.update(game.floor, game.player, dt);
    maxSuspicion = Math.max(maxSuspicion, guard.suspicion);
    if (guard.state === GUARD_ALERT) anyAlert = true;
    if (guard.state === GUARD_ALERT && !wasAlert) {
      game.sound.alarm();
      announce('Spotted! Break line of sight and hide.');
    } else if (guard.state === 'suspicious' && guard.suspicion >= 50 && !guard.warned) {
      guard.warned = true;
      game.sound.suspicious();
    } else if (guard.suspicion < 30) {
      guard.warned = false;
    }
    if (guard.stepped) {
      // A guard's footsteps fade with distance and pan with direction, so you
      // can hear where the patrol is before you see it.
      const dx = guard.x - game.player.x;
      const dy = guard.y - game.player.y;
      const dist = Math.hypot(dx, dy);
      const volume = Math.max(0, 0.22 * (1 - dist / 420));
      if (volume > 0.01) game.sound.footstep(Math.max(-1, Math.min(1, dx / 300)), volume, true);
    }
    if (guard.caughtPlayer(game.player)) {
      game.screen = SCREEN_CAUGHT;
      game.sound.caught();
      announce('Caught. Press R to try this floor again.');
      return;
    }
  }
  game.maxSuspicion = maxSuspicion;
  game.alarmed = anyAlert;

  // Ledgers: walk over one to take it; the exit opens once all are taken.
  for (const ledger of game.floor.ledgers) {
    if (ledger.taken) continue;
    const cx = ledger.x * TILE + TILE / 2;
    const cy = ledger.y * TILE + TILE / 2;
    if (Math.hypot(game.player.x - cx, game.player.y - cy) < 24) {
      ledger.taken = true;
      game.ledgersGot += 1;
      game.sound.pickup();
      announce(
        game.ledgersGot >= game.ledgersTotal
          ? 'Last ledger taken. The exit is open — go, quietly.'
          : `Ledger taken (${game.ledgersGot} of ${game.ledgersTotal}).`,
      );
      if (game.ledgersGot >= game.ledgersTotal) game.sound.doorOpen();
    }
  }

  // The exit: step onto it with every ledger to clear the floor.
  if (game.ledgersGot >= game.ledgersTotal) {
    const exit = exitTileCentre();
    if (Math.hypot(game.player.x - exit.x, game.player.y - exit.y) < 26) {
      game.floorClearedText =
        game.floorIndex + 1 >= FLOOR_DEFS.length
          ? 'The last ledger is in your satchel.'
          : `${game.floor.name} cleared — unseen.`;
      game.screen = SCREEN_FLOOR_CLEAR;
      game.sound.doorOpen();
      announce('Floor clear. Press Enter for the next floor.');
    }
  }

  // Old pebble rings fade out.
  const now = Date.now();
  game.pebblesThrown = game.pebblesThrown.filter((p) => now - p.born < 1200);
}

function throwPebble(clientX, clientY) {
  if (game.screen !== SCREEN_PLAY || game.pebbles <= 0) return;
  const rect = canvas.getBoundingClientRect();
  const mx = ((clientX - rect.left) / rect.width) * CANVAS_W;
  const my = ((clientY - rect.top) / rect.height) * CANVAS_H - HUD_H;
  const target = game.player.pebbleTarget(mx, my);
  game.pebbles -= 1;
  game.pebblesThrown.push({ x: target.x, y: target.y, born: Date.now() });
  game.sound.pebble();
  for (const guard of game.guards) {
    if (Math.hypot(guard.x - target.x, guard.y - target.y) < NOISE_RADIUS) {
      guard.hearNoise(target.x, target.y);
    }
  }
}

const KEY_MAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
};

window.addEventListener('keydown', (event) => {
  game.sound.ensure();
  const mapped = KEY_MAP[event.code];
  if (mapped) {
    game.keys[mapped] = true;
    event.preventDefault();
    return;
  }
  if (event.code === 'Enter') {
    if (game.screen === SCREEN_TITLE) startGame();
    else if (game.screen === SCREEN_FLOOR_CLEAR) nextFloor();
  } else if (event.code === 'KeyR') {
    if (game.screen === SCREEN_CAUGHT || game.screen === SCREEN_WIN) {
      if (game.screen === SCREEN_WIN) startGame();
      else {
        game.loadFloor(game.floorIndex);
        game.screen = SCREEN_PLAY;
        announce('Try again — quieter this time.');
      }
    }
  } else if (event.code === 'KeyM') {
    const muted = game.sound.toggleMute();
    announce(muted ? 'Sound off.' : 'Sound on.');
  }
});

window.addEventListener('keyup', (event) => {
  const mapped = KEY_MAP[event.code];
  if (mapped) game.keys[mapped] = false;
});

canvas.addEventListener('mousedown', (event) => {
  game.sound.ensure();
  if (game.screen === SCREEN_TITLE) {
    startGame();
    return;
  }
  if (game.screen === SCREEN_FLOOR_CLEAR) {
    nextFloor();
    return;
  }
  throwPebble(event.clientX, event.clientY);
});

// Fit the 960x640 canvas into the window without stretching it.
function fitCanvas() {
  const scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);
  canvas.style.width = `${Math.floor(CANVAS_W * scale)}px`;
  canvas.style.height = `${Math.floor(CANVAS_H * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

// Staged screenshots: ?shot=play|alert|title|win stages a fixed frame.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
game.loadFloor(0);
if (shot) {
  stageShot(shot, game);
} else {
  game.screen = SCREEN_TITLE;
}

// Debug hook for automated play-testing: the live game object, read-only use.
window.__nightArchivist = game;

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render(ctx, game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
