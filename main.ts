// The Night Archivist — a 3-floor top-down stealth game.
// SPDX-License-Identifier: MIT
//
// This program hands the entry in: it copies this repository's game/ and
// screenshots/ into the output directory and writes dossier.json with the
// vendored make.fun library, exactly as the kit asks. It runs on Node 22
// with the standard library only, no network, and writes the same bytes
// every run: the copy is a plain recursive copy and the dossier is a pure
// function of the files copied.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyClean(source, target) {
  // Start from an empty target so a stale file from an earlier run can never
  // leak into this one; the grader runs the program twice and compares bytes.
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyClean(join(repoRoot, 'game'), join(outDir, 'game'));
if (existsSync(join(repoRoot, 'screenshots'))) {
  copyClean(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'));
} else {
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
}

// The gate's own caps, as the kit states them: the dossier text cap shapes the
// bytes; the rest refuse an entry the scorer would refuse anyway.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

// One line of proof on stderr so a run's output shows the hand-in landed:
// the dossier bytes and the two folders it was built from.
const dossierBytes = Buffer.byteLength(dossier, 'utf8');
process.stderr.write(
  `night-archivist: wrote ${join(outDir, 'dossier.json')} (${dossierBytes} bytes) ` +
    `from game/ and screenshots/ in ${repoRoot}\n`,
);
