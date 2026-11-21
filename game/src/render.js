// Everything the player sees: the archive floor, its cover, the guards and
// their raycast vision cones, the light and shadow that show what is safe,
// the HUD, and the title / caught / win screens. All drawing is plain canvas.
import { TILE, COLS, ROWS, HUD_H, VIEW_W, VIEW_H, COLORS, GUARD_RADIUS,
  PLAYER_RADIUS } from './config.js';
import { conePolygon } from './vision.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_FLOOR_CLEAR = 'floor-clear';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_WIN = 'win';

function drawFloorTiles(ctx, floor, floorIndex) {
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const px = x * TILE;
      const py = HUD_H + y * TILE;
      const dark = (x + y) % 2 === 0;
      ctx.fillStyle = dark ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(px, py, TILE, TILE);
      // A worn rug stripe down the middle of each floor, for depth.
      if (x === 12 && floorIndex !== 2) {
        ctx.fillStyle = 'rgba(120, 60, 60, 0.18)';
        ctx.fillRect(px + 4, py, TILE - 8, TILE);
      }
    }
  }
}

function drawWalls(ctx, floor) {
  for (const k of floor.walls) {
    const [x, y] = k.split(',').map(Number);
    const px = x * TILE;
    const py = HUD_H + y * TILE;
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(px, py, TILE, 4);
    ctx.fillRect(px, py, 4, TILE);
  }
}

function drawCover(ctx, floor) {
  for (const k of floor.crates) {
    const [x, y] = k.split(',').map(Number);
    const px = x * TILE + 3;
    const py = HUD_H + y * TILE + 3;
    ctx.fillStyle = COLORS.crate;
    ctx.fillRect(px, py, TILE - 6, TILE - 6);
    ctx.strokeStyle = COLORS.crateEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, TILE - 6, TILE - 6);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + TILE - 6, py + TILE - 6);
    ctx.moveTo(px + TILE - 6, py);
    ctx.lineTo(px, py + TILE - 6);
    ctx.stroke();
  }
  for (const k of floor.shelves) {
    const [x, y] = k.split(',').map(Number);
    const px = x * TILE + 2;
    const py = HUD_H + y * TILE + 2;
    ctx.fillStyle = COLORS.shelf;
    ctx.fillRect(px, py, TILE - 4, TILE - 4);
    ctx.strokeStyle = COLORS.shelfEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, TILE - 4, TILE - 4);
    // Book spines along the shelf, so it reads as a shelf at a glance.
    for (let i = 0; i < 4; i += 1) {
      ctx.fillStyle = ['#c9a227', '#7a4a8a', '#3f7a5a', '#a85a2a'][i];
      ctx.fillRect(px + 5 + i * 8, py + 6, 5, TILE - 16);
    }
  }
  for (const k of floor.plants) {
    const [x, y] = k.split(',').map(Number);
    const cx = x * TILE + TILE / 2;
    const cy = HUD_H + y * TILE + TILE / 2;
    ctx.fillStyle = COLORS.plantDark;
    ctx.beginPath();
    ctx.arc(cx, cy, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.plant;
    ctx.beginPath();
    ctx.arc(cx - 6, cy - 4, 9, 0, Math.PI * 2);
    ctx.arc(cx + 7, cy - 5, 8, 0, Math.PI * 2);
    ctx.arc(cx + 2, cy + 7, 9, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLamps(ctx, floor) {
  for (const [lx, ly] of floor.lamps) {
    const cx = lx * TILE + TILE / 2;
    const cy = HUD_H + ly * TILE + TILE / 2;
    const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, TILE * 1.7);
    glow.addColorStop(0, 'rgba(255, 200, 100, 0.28)');
    glow.addColorStop(1, 'rgba(255, 200, 100, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, TILE * 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8b64c';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLedgersAndExit(ctx, floor, ledgersGot, ledgersTotal) {
  for (const ledger of floor.ledgers) {
    if (ledger.taken) continue;
    const cx = ledger.x * TILE + TILE / 2;
    const cy = HUD_H + ledger.y * TILE + TILE / 2;
    const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 280);
    ctx.fillStyle = `rgba(232, 182, 76, ${0.25 * pulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.ledger;
    ctx.fillRect(cx - 9, cy - 12, 18, 24);
    ctx.fillStyle = '#7a5a10';
    ctx.fillRect(cx - 9, cy - 2, 18, 3);
    ctx.fillStyle = '#fff2c0';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('§', cx, cy + 4);
  }
  const ex = floor.exit[0] * TILE;
  const ey = HUD_H + floor.exit[1] * TILE;
  const open = ledgersGot >= ledgersTotal;
  ctx.fillStyle = open ? COLORS.exitOpen : COLORS.exitLocked;
  ctx.fillRect(ex + 2, ey + 2, TILE - 4, TILE - 4);
  ctx.fillStyle = '#0e1a12';
  ctx.fillRect(ex + 12, ey + 14, 16, 24);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT' : 'LOCKED', ex + TILE / 2, ey + 12);
  if (!open) {
    ctx.fillStyle = '#e8dcc0';
    ctx.font = '10px sans-serif';
    ctx.fillText(`${ledgersGot}/${ledgersTotal} ledgers`, ex + TILE / 2, ey + TILE - 4);
  }
}

function drawCones(ctx, floor, guards) {
  for (const guard of guards) {
    const poly = conePolygon(floor, guard);
    const fill = guard.state === 'alert'
      ? COLORS.coneAlert
      : guard.suspicion >= 50
        ? COLORS.coneSuspicious
        : COLORS.coneCalm;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(poly[0].x, HUD_H + poly[0].y);
    for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i].x, HUD_H + poly[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = guard.state === 'alert' ? 'rgba(255, 80, 80, 0.7)' : COLORS.coneCalmEdge;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawGuards(ctx, guards) {
  for (const guard of guards) {
    const gy = HUD_H + guard.y;
    // Direction tick: a short nose showing where the guard faces.
    ctx.strokeStyle = '#ffd65a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(guard.x, gy);
    ctx.lineTo(guard.x + Math.cos(guard.angle) * (GUARD_RADIUS + 8),
      gy + Math.sin(guard.angle) * (GUARD_RADIUS + 8));
    ctx.stroke();
    ctx.fillStyle = COLORS.guardDark;
    ctx.beginPath();
    ctx.arc(guard.x, gy, GUARD_RADIUS + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.guard;
    ctx.beginPath();
    ctx.arc(guard.x, gy, GUARD_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c0d0d';
    ctx.beginPath();
    ctx.arc(guard.x + Math.cos(guard.angle) * 5, gy + Math.sin(guard.angle) * 5, 4, 0, Math.PI * 2);
    ctx.fill();
    // Suspicion: "?" while curious, "!" once the chase is on.
    if (guard.state === 'suspicious' || guard.state === 'investigate') {
      ctx.fillStyle = '#ffb347';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', guard.x, gy - GUARD_RADIUS - 6);
    } else if (guard.state === 'alert') {
      ctx.fillStyle = '#ff4d4d';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, gy - GUARD_RADIUS - 6);
    }
  }
}

function drawPlayer(ctx, player) {
  const py = HUD_H + player.y;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(player.x, py + 10, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.playerDark;
  ctx.beginPath();
  ctx.arc(player.x, py, PLAYER_RADIUS + 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(player.x, py, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  // Hood point and facing tick.
  ctx.fillStyle = '#d7fff6';
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(player.angle) * 6, py + Math.sin(player.angle) * 6, 4, 0, Math.PI * 2);
  ctx.fill();
  if (player.sneaking) {
    ctx.strokeStyle = 'rgba(63, 182, 168, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(player.x, py, PLAYER_RADIUS + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawPebbles(ctx, pebbles) {
  for (const pebble of pebbles) {
    const age = (Date.now() - pebble.born) / 1000;
    if (age > 1.2) continue;
    const r = 6 + age * 46;
    ctx.strokeStyle = `rgba(232, 220, 192, ${Math.max(0, 0.8 - age * 0.6)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pebble.x, HUD_H + pebble.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#cfc4a8';
    ctx.beginPath();
    ctx.arc(pebble.x, HUD_H + pebble.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Night darkness with a lit circle around the player and pools under the lamps.
 *  The offscreen layer is reused across frames instead of allocated each time. */
const darkLayer = document.createElement('canvas');
darkLayer.width = VIEW_W;
darkLayer.height = VIEW_H;

function drawDarkness(ctx, floor, player) {
  const dctx = darkLayer.getContext('2d');
  dctx.globalCompositeOperation = 'source-over';
  dctx.clearRect(0, 0, VIEW_W, VIEW_H);
  dctx.fillStyle = COLORS.dark;
  dctx.fillRect(0, 0, VIEW_W, VIEW_H);
  dctx.globalCompositeOperation = 'destination-out';
  const playerGlow = dctx.createRadialGradient(player.x, player.y, 30, player.x, player.y, 235);
  playerGlow.addColorStop(0, 'rgba(0,0,0,1)');
  playerGlow.addColorStop(1, 'rgba(0,0,0,0)');
  dctx.fillStyle = playerGlow;
  dctx.beginPath();
  dctx.arc(player.x, player.y, 235, 0, Math.PI * 2);
  dctx.fill();
  for (const [lx, ly] of floor.lamps) {
    const cx = lx * TILE + TILE / 2;
    const cy = ly * TILE + TILE / 2;
    const lampGlow = dctx.createRadialGradient(cx, cy, 10, cx, cy, TILE * 1.5);
    lampGlow.addColorStop(0, 'rgba(0,0,0,0.9)');
    lampGlow.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = lampGlow;
    dctx.beginPath();
    dctx.arc(cx, cy, TILE * 1.5, 0, Math.PI * 2);
    dctx.fill();
  }
  ctx.drawImage(darkLayer, 0, HUD_H);
}

function drawHud(ctx, game) {
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(game.floor.name, 12, 25);
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `Ledgers ${game.ledgersGot}/${game.ledgersTotal}   Pebbles ${game.pebbles}   Time ${game.timeText}`,
    VIEW_W / 2, 25,
  );
  // The suspicion meter: the highest guard's suspicion, green to red.
  const s = game.maxSuspicion;
  ctx.textAlign = 'right';
  ctx.fillText('Seen', VIEW_W - 150, 25);
  ctx.fillStyle = '#3a2f28';
  ctx.fillRect(VIEW_W - 140, 14, 110, 12);
  ctx.fillStyle = s >= 100 ? '#ff4d4d' : s >= 50 ? '#ff9a3d' : '#7ec850';
  ctx.fillRect(VIEW_W - 140, 14, Math.round(110 * Math.min(1, s / 100)), 12);
  ctx.strokeStyle = '#e8dcc0';
  ctx.lineWidth = 1;
  ctx.strokeRect(VIEW_W - 140, 14, 110, 12);
}

function drawOverlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(8, 6, 10, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, HUD_H + VIEW_H);
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW_W / 2, 250);
  ctx.fillStyle = '#e8dcc0';
  ctx.font = '16px Georgia, serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 295 + i * 26));
}

export function render(ctx, game) {
  ctx.clearRect(0, 0, VIEW_W, HUD_H + VIEW_H);
  const floor = game.floor;
  drawFloorTiles(ctx, floor, game.floorIndex);
  drawLamps(ctx, floor);
  drawWalls(ctx, floor);
  drawCover(ctx, floor);
  drawLedgersAndExit(ctx, floor, game.ledgersGot, game.ledgersTotal);
  if (game.screen === SCREEN_PLAY) drawCones(ctx, floor, game.guards);
  drawGuards(ctx, game.guards);
  drawPlayer(ctx, game.player);
  drawPebbles(ctx, game.pebblesThrown);
  drawDarkness(ctx, floor, game.player);
  drawHud(ctx, game);

  if (game.screen === SCREEN_TITLE) {
    drawOverlay(ctx, 'THE NIGHT ARCHIVIST', [
      'Three floors of the Halloway Archive. Three sealed ledgers.',
      'Slip past the guards, take every ledger, reach the green exit unseen.',
      '',
      'WASD / arrows — move      Shift — sneak      Click — throw a pebble',
      'Hide behind crates and shelves. Plants hide you. Lamps give you away.',
      'A guard who only glimpses you calms down. One who catches you does not.',
      '',
      'Click or press Enter to begin',
    ], '#e8b64c');
  } else if (game.screen === SCREEN_FLOOR_CLEAR) {
    drawOverlay(ctx, 'FLOOR CLEAR', [
      game.floorClearedText,
      `Floor time ${game.floorTimeText}   —   click or press Enter for the next floor`,
    ], '#7ec850');
  } else if (game.screen === SCREEN_CAUGHT) {
    drawOverlay(ctx, 'CAUGHT', [
      'A guard laid a hand on your shoulder. The archive keeps its secrets.',
      `You reached ${game.floor.name} with ${game.ledgersGot} ledger(s) in hand.`,
      '',
      'Press R to try this floor again',
    ], '#ff4d4d');
  } else if (game.screen === SCREEN_WIN) {
    drawOverlay(ctx, 'THE ARCHIVE IS YOURS', [
      'All three ledgers, all three floors — and nobody ever saw you leave.',
      `Total time ${game.timeText}    Pebbles left ${game.pebbles}`,
      '',
      'Press R to play again',
    ], '#e8b64c');
  }
}
