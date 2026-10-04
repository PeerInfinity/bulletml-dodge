#!/usr/bin/env node
/**
 * Slice H1: the observed model's cost against the engine's, to fit its budget units (MODEL_BASE, MODEL_FOES in
 * src/game/bot.js). Replays a G4 tape and, every --every frames, times a 48-frame rollout (a copy + 48 steps, the
 * bot's straight tail held) on the engine and on the observed model from the same frame.
 *
 *   node bin/bench-model.mjs [--tape tapes/g4/s10-attack-seed1-b1x.json] [--every 200] [--reps 20]
 * Prints per sample: live objects, µs per engine frame, µs per model frame, and both in budget units
 * (an engine frame = 1 + live / UNIT_FOES units), then a least-squares fit of model units = a + live / b.
 */
import fs from 'node:fs';
import { loadNoiz2saPatterns } from '../src/game/patterns-node.js';
import { newGame, stepGame, cloneGame, STATUS } from '../src/game/noiz2sa-game.js';
import { tapeInputs } from '../src/game/tape.js';
import { observe, newTracker, cloneModel, stepModel } from '../src/game/perception.js';
import { UNIT_FOES, MODEL_BASE, MODEL_FOES } from '../src/game/bot.js';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const tape = JSON.parse(fs.readFileSync(opt('tape', 'tapes/g4/s10-attack-seed1-b1x.json'), 'utf8'));
const every = Number(opt('every', 200)), reps = Number(opt('reps', 20)), L = 48;
const P = loadNoiz2saPatterns();
const g = newGame(P, tape.stage, { seed: tape.seed, endlessSeed: tape.endlessSeed });
const inputs = tapeInputs(tape);
const tr = newTracker();
const rows = [];
for (let f = 0; f < inputs.length && g.status === STATUS.IN_GAME; f++) {
    const m = observe(g, tr);
    if (f > 0 && f % every === 0) {
        let live = 0;
        for (const x of g.foes) if (x) live++;
        const hold = inputs.slice(f, f + L);
        while (hold.length < L) hold.push(16);
        const time = (fn) => { for (let r = 0; r < 5; r++) fn(); const t = performance.now(); for (let r = 0; r < reps; r++) fn(); return (performance.now() - t) * 1000 / reps / (L + 1); };
        const ue = time(() => { const c = cloneGame(g); for (const b of hold) stepGame(c, b); });
        const um = time(() => { const c = cloneModel(m); for (const b of hold) stepModel(c, b); });
        const unitUs = ue / (1 + live / UNIT_FOES);
        rows.push({ f, live, ue, um, units: um / unitUs, unitUs });
        console.log(`f ${f}  live ${live}  engine ${ue.toFixed(1)} µs/frame  model ${um.toFixed(2)} µs/frame  → model ${(um / unitUs).toFixed(3)} units (now charged ${(MODEL_BASE + live / MODEL_FOES).toFixed(3)}); 1 unit = ${unitUs.toFixed(1)} µs`);
    }
    stepGame(g, inputs[f]);
}
// least squares in µs (model µs = a + c × live), then in units at the median µs per engine unit (the per-sample
// unit is noisy: it depends on how busy the runners are)
const n = rows.length, sx = rows.reduce((s, r) => s + r.live, 0), sy = rows.reduce((s, r) => s + r.um, 0);
const sxx = rows.reduce((s, r) => s + r.live * r.live, 0), sxy = rows.reduce((s, r) => s + r.live * r.um, 0);
const c = (n * sxy - sx * sy) / (n * sxx - sx * sx), a = (sy - c * sx) / n;
const unit = rows.map((r) => r.unitUs).sort((x, y) => x - y)[n >> 1];
console.log(`fit: model frame ≈ ${a.toFixed(2)} µs + ${(c * 1000).toFixed(1)} ns × live; 1 engine unit = ${unit.toFixed(1)} µs (median) → ${(a / unit).toFixed(3)} + live / ${(unit / c).toFixed(0)} units (${n} samples)`);
