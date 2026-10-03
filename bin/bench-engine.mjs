#!/usr/bin/env node
/**
 * The engine's own speed (slice P1): replay a tape and time stepGame per frame; copy the game with cloneGame at
 * its busiest frame and time that; and check the tape ends on the same state line as before (`--expect`).
 *
 *   node bin/bench-engine.mjs [tape.json] [--reps 3] [--clones 2000] [--rollouts 200] [--expect stateLine]
 * Default tape: tapes/g4/s11-attack-seed1-b1x.json (ENDLESS, 30,000 frames).
 */
import fs from 'node:fs';
import { loadNoiz2saPatterns } from '../src/game/patterns-node.js';
import { newGame, stepGame, cloneGame, stateLine, STATUS } from '../src/game/noiz2sa-game.js';
import { tapeInputs } from '../src/game/tape.js';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const file = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--')) ?? new URL('../tapes/g4/s11-attack-seed1-b1x.json', import.meta.url).pathname;
const tape = JSON.parse(fs.readFileSync(file, 'utf8'));
const inputs = tapeInputs(tape);
const P = loadNoiz2saPatterns();
const reps = Number(opt('reps', 3)), nClones = Number(opt('clones', 2000));

const live = (g) => { let n = 0; for (const f of g.foes) if (f) n++; return n; };
let best = Infinity, line = '', busyFrame = 0, busyLive = -1;
for (let r = 0; r < reps; r++) {
    const g = newGame(P, tape.stage, { seed: tape.seed, endlessSeed: tape.endlessSeed });
    const t0 = performance.now();
    for (let f = 0; f < inputs.length && g.status !== STATUS.TITLE; f++) {
        stepGame(g, inputs[f]);
        if (r === 0 && (f & 63) === 0) { const n = live(g); if (n > busyLive) { busyLive = n; busyFrame = g.frame; } }
    }
    const ms = performance.now() - t0;
    best = Math.min(best, ms);
    line = stateLine(g);
}
// the busiest frame: clone it nClones times
const g = newGame(P, tape.stage, { seed: tape.seed, endlessSeed: tape.endlessSeed });
while (g.frame < busyFrame) stepGame(g, inputs[g.frame]);
let keep = null, cloneUs = Infinity;
for (let batch = 0; batch < 5; batch++) {
    const tc = performance.now();
    for (let k = 0; k < nClones; k++) keep = cloneGame(g);
    cloneUs = Math.min(cloneUs, (1000 * (performance.now() - tc)) / nClones);
}
// and 48-frame rollouts from there (a clone + 48 steps), as the bot does them
// (the best of 5 batches: the machine is shared)
const R = Number(opt('rollouts', 200));
let rollUs = Infinity;
for (let batch = 0; batch < 5; batch++) {
    const tr = performance.now();
    for (let k = 0; k < R; k++) { const c = cloneGame(g); for (let i = 0; i < 48 && c.status === STATUS.IN_GAME; i++) stepGame(c, inputs[g.frame + i] ?? 0); }
    rollUs = Math.min(rollUs, (1000 * (performance.now() - tr)) / R);
}
const out = { tape: file.split('/').slice(-2).join('/'), frames: inputs.length, stepUs: +((1000 * best) / inputs.length).toFixed(2), busyFrame, busyLive, cloneUs: +cloneUs.toFixed(1), rollout48Us: +rollUs.toFixed(0), line };
console.log(JSON.stringify(out));
if (opt('expect', null) && opt('expect') !== line) { console.log('STATE LINE CHANGED'); process.exit(1); }
void keep;
