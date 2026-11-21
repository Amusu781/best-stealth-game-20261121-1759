// The three floors of the Halloway Archive. Each floor is built from lists of
// rectangles and points (no hand-counted text maps), so a floor is always exactly
// the grid the collision and vision code reads.
//
// Legend used by the builders below:
//   walls   - solid, block movement and sight
//   crates  - low cover, block movement and sight, readable at a glance
//   shelves - tall cover, block movement and sight
//   plants  - soft cover: block sight but not movement; standing in one hides you
//   lamps   - warm pools of light; being lit makes you easier to spot
//   ledgers - sealed books you must collect before the exit opens
//   guards  - patrol waypoints in tile coordinates, walked in a loop
import { COLS, ROWS } from './config.js';

function key(x, y) {
  return `${x},${y}`;
}

/** Build one floor's lookup tables from its plain description. */
export function buildFloor(def) {
  const walls = new Set();
  const crates = new Set();
  const shelves = new Set();
  const plants = new Set();
  // Border walls all round.
  for (let x = 0; x < COLS; x += 1) {
    walls.add(key(x, 0));
    walls.add(key(x, ROWS - 1));
  }
  for (let y = 0; y < ROWS; y += 1) {
    walls.add(key(0, y));
    walls.add(key(COLS - 1, y));
  }
  for (const [x, y, w, h] of def.walls) {
    for (let ix = x; ix < x + w; ix += 1) {
      for (let iy = y; iy < y + h; iy += 1) walls.add(key(ix, iy));
    }
  }
  for (const [x, y] of def.crates) crates.add(key(x, y));
  for (const [x, y] of def.shelves) shelves.add(key(x, y));
  for (const [x, y] of def.plants) plants.add(key(x, y));
  return {
    name: def.name,
    subtitle: def.subtitle,
    walls,
    crates,
    shelves,
    plants,
    lamps: def.lamps,
    ledgers: def.ledgers.map(([x, y]) => ({ x, y, taken: false })),
    exit: def.exit,
    playerStart: def.playerStart,
    guards: def.guards,
  };
}

export const FLOOR_DEFS = [
  {
    name: 'Floor 1 — The Reading Room',
    subtitle: 'Learn the patrols. One ledger seals the exit.',
    walls: [
      [8, 1, 1, 6], // left divider, gap at y=7
      [8, 8, 1, 6], // left divider below the gap
      [16, 1, 1, 3], // right divider, gap at y=4
      [16, 5, 1, 9], // right divider below the gap
    ],
    crates: [[4, 3], [5, 3], [12, 9], [13, 9], [19, 6], [20, 11]],
    shelves: [[3, 10], [4, 10], [11, 3], [18, 12]],
    plants: [[6, 11], [14, 5], [20, 3], [10, 12]],
    lamps: [[6, 2], [18, 8]],
    ledgers: [[20, 2]],
    exit: [22, 13],
    playerStart: [2, 13],
    guards: [
      { waypoints: [[11, 2], [11, 12]], speed: 52 },
      { waypoints: [[10, 10], [14, 10], [14, 5], [10, 5]], speed: 56 },
      { waypoints: [[18, 10], [22, 10], [22, 4], [18, 4]], speed: 54 },
    ],
  },
  {
    name: 'Floor 2 — The Map Gallery',
    subtitle: 'Two ledgers, four guards. The lamps are not your friends.',
    walls: [
      [1, 5, 11, 1], // upper divider, gap at x=12
      [13, 5, 10, 1], // upper divider, other side of the gap
      [1, 10, 4, 1], // lower divider, gap at x=5
      [6, 10, 17, 1], // lower divider, other side of the gap
      [17, 6, 1, 4], // short stub wall in the middle band
    ],
    crates: [[3, 3], [4, 3], [10, 7], [11, 7], [20, 3], [6, 12], [7, 12], [14, 12]],
    shelves: [[8, 2], [15, 3], [19, 8], [3, 8]],
    plants: [[5, 7], [12, 3], [18, 12], [21, 7]],
    lamps: [[6, 6], [18, 6], [12, 12]],
    ledgers: [[22, 2], [2, 13]],
    exit: [22, 13],
    playerStart: [2, 2],
    guards: [
      { waypoints: [[5, 2], [14, 2]], speed: 58 },
      { waypoints: [[3, 7], [16, 7]], speed: 60 },
      { waypoints: [[8, 12], [21, 12]], speed: 58 },
      { waypoints: [[20, 6], [20, 9], [22, 9], [22, 6]], speed: 62 },
    ],
  },
  {
    name: 'Floor 3 — The Vault of Ledgers',
    subtitle: 'Five guards, two ledgers, nowhere to hurry.',
    walls: [
      [7, 1, 1, 11], // left divider, gap at y=12
      [7, 13, 1, 1],
      [15, 1, 1, 2], // right divider, gap at y=3
      [15, 4, 1, 10], // right divider below the gap
      [9, 7, 6, 1], // middle bar splitting the centre room
    ],
    crates: [[4, 4], [5, 4], [10, 3], [11, 10], [18, 5], [19, 11], [12, 12]],
    shelves: [[3, 8], [4, 8], [9, 12], [20, 8]],
    plants: [[6, 6], [13, 5], [17, 10], [21, 3]],
    lamps: [[5, 8], [12, 7], [19, 7], [12, 13]],
    ledgers: [[21, 2], [2, 2]],
    exit: [22, 13],
    playerStart: [2, 13],
    guards: [
      { waypoints: [[11, 2], [11, 6]], speed: 62 },
      { waypoints: [[4, 10], [4, 4], [6, 4], [6, 10]], speed: 60 },
      { waypoints: [[17, 2], [22, 2], [22, 6], [17, 6]], speed: 64 },
      { waypoints: [[10, 9], [13, 9], [13, 13], [10, 13]], speed: 62 },
      { waypoints: [[18, 9], [21, 9], [21, 12], [18, 12]], speed: 66 },
    ],
  },
];

export function tileKey(x, y) {
  return key(x, y);
}
