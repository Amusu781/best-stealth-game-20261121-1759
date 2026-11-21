# The Night Archivist

[![make.fun](https://img.shields.io/badge/make.fun-bounty-blue)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A complete top-down stealth game, built for the make.fun bounty
[Make the best stealth game](https://make.fun/bounty/best-stealth-game-20261121-1759).

You are the Night Archivist. Three floors of the Halloway Archive, three
sealed ledgers, and guards who patrol every corridor. Slip past them, take
every ledger, and reach the green exit unseen.

## How to play

Open `game/index.html` in a desktop browser (or serve `game/` with any
static server). No network, no build step, no files outside `game/`.

- **WASD / arrow keys** — move
- **Shift** — sneak (slower, quieter, harder to spot)
- **Click** — throw a pebble; a guard that hears it goes to look
- **M** — mute, **R** — retry a floor after being caught, **Enter** — start / continue

## What is in the game

- **Three floors** — The Reading Room, The Map Gallery, The Vault of Ledgers —
  each with its own patrols, cover and ledgers.
- **Raycast vision cones** — guards see only what a straight line reaches;
  walls, crates, shelves and plants all block sight.
- **Recoverable detection** — a suspicion meter rises while you are seen and
  decays while you are not. A guard who only glimpses you pauses and looks
  (`?`); one who is sure chases (`!`). Break line of sight and they calm down
  and return to patrol.
- **Cover you can read** — crates and shelves block sight and movement,
  plants hide you while you stand in them, and lamp pools light you up.
- **Synthesised sound** — footsteps (a guard's fade with distance and pan
  with direction, so you hear the patrol before you see it), alarm stings,
  pickup chimes. All WebAudio, no audio files.
- **Win / lose / restart** — caught means retry the floor; clearing all three
  floors wins the game.

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` (Node 22, standard library only).
- `vendor/makefun-game.ts` — the kit's library, unchanged.
- `game/index.html` — the page.
- `game/src/config.js` — tuning: speeds, cone size, suspicion rates.
- `game/src/levels.js` — the three floors.
- `game/src/vision.js` — raycast cones and line of sight.
- `game/src/guards.js` — patrol, suspicion, chase and investigate.
- `game/src/player.js` — movement, sneaking and pebbles.
- `game/src/audio.js` — synthesised footsteps and stings.
- `game/src/render.js` — drawing, lighting and the HUD.
- `game/src/shots.js` — staged screenshot scenes (`?shot=play|alert|title|win`).
- `game/src/main.js` — bootstrap, game loop and input.
- `screenshots/` — real renders of the game in a browser.

## Verify

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
