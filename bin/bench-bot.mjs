#!/usr/bin/env node
/**
 * The bot's per-frame cost, headless (slice P1): play the G4 bot from a stage's start for N frames and report the
 * CPU ms per frame (mean, p99, max), the budget units, what each costly frame did (repair / improve / beam), and
 * how many game copies and simulated frames it took. Optionally writes the inputs, to check that a change kept
 * every move (`--inputs out.json`, then `--check out.json`).
 *
 *   node bin/bench-bot.mjs --stage 9 --seed 1 --frames 2500 [--variant attack] [--horizon 48] [--budget 600]
 *        [--inputs out.json | --check out.json] [--top 10] [--json out.json]
 */
import fs from 'node:fs';
import { loadNoiz2saPatterns } from '../src/game/patterns-node.js';
import { newGame, stepGame, STATUS } from '../src/game/noiz2sa-game.js';
import { makeBot, BROWSER_BUDGET, DEFAULT_HORIZON } from '../src/game/bot.js';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const stage = Number(opt('stage', 9)), seed = Number(opt('seed', 1)), frames = Number(opt('frames', 2500));
const endlessSeed = Number(opt('endless-seed', Math.imul(7919, seed) >>> 0));
const variant = opt('variant', 'attack'), horizon = Number(opt('horizon', DEFAULT_HORIZON)), budget = Number(opt('budget', BROWSER_BUDGET));
const costCap = opt('cost-cap', null);

const P = loadNoiz2saPatterns();
const g = newGame(P, stage, { seed, endlessSeed });
const bot = makeBot({ variant, horizon, budget, ...(costCap !== null ? { costCap: Number(costCap) } : {}) });
const st = bot.stats;
const rows = [], inputs = [];
const t0 = performance.now();
let hits = 0;
while (g.frame < frames && g.status === STATUS.IN_GAME) {
    const before = { repairs: st.repairs, improves: st.improves, beams: st.beams, clones: st.clones, steps: st.steps };
    const t = performance.now();
    const b = bot(g);
    const ms = performance.now() - t;
    let live = 0;
    for (const f of g.foes) if (f) live++;
    const kind = st.beams > before.beams ? 'beam' : st.repairs > before.repairs ? 'repair' : st.improves > before.improves ? 'improve' : 'extend';
    rows.push({ frame: g.frame, ms, units: st.lastCost, kind, clones: st.clones - before.clones, steps: st.steps - before.steps - (st.clones - before.clones), live });
    inputs.push(b);
    for (const e of stepGame(g, b)) if (e[0] === 'hit') hits++;
}
const total = performance.now() - t0;
const sorted = rows.map((r) => r.ms).sort((a, b) => a - b);
const q = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
const sum = (k, f = () => true) => rows.filter(f).reduce((a, r) => a + r[k], 0);
const byKind = {};
for (const r of rows) {
    const k = (byKind[r.kind] ??= { n: 0, ms: 0, units: 0, clones: 0, steps: 0, maxMs: 0 });
    k.n++; k.ms += r.ms; k.units += r.units; k.clones += r.clones; k.steps += r.steps; k.maxMs = Math.max(k.maxMs, r.ms);
}
const out = {
    stage, seed, endlessSeed, variant, horizon, budget, frames: rows.length, hits, totalMs: +total.toFixed(0),
    meanMs: +(total / rows.length).toFixed(3), botMeanMs: +(sum('ms') / rows.length).toFixed(3), p50: +q(0.5).toFixed(2), p99: +q(0.99).toFixed(2), maxMs: +sorted[sorted.length - 1].toFixed(1),
    usPerUnit: +(1000 * sum('ms') / sum('units')).toFixed(2), unitsPerFrame: +(sum('units') / rows.length).toFixed(0),
    clonesPerFrame: +(sum('clones') / rows.length).toFixed(2), stepsPerFrame: +(sum('steps') / rows.length).toFixed(1),
    over16: rows.filter((r) => r.ms > 16).length, over50: rows.filter((r) => r.ms > 50).length,
    byKind: Object.fromEntries(Object.entries(byKind).map(([k, v]) => [k, { n: v.n, meanMs: +(v.ms / v.n).toFixed(2), maxMs: +v.maxMs.toFixed(1), meanUnits: Math.round(v.units / v.n), clones: +(v.clones / v.n).toFixed(1), steps: +(v.steps / v.n).toFixed(1) }])),
    top: [...rows].sort((a, b) => b.ms - a.ms).slice(0, Number(opt('top', 8))).map((r) => ({ ...r, ms: +r.ms.toFixed(1), units: Math.round(r.units) })),
};
console.log(JSON.stringify(out, null, 1));
if (opt('json', null)) fs.writeFileSync(opt('json'), JSON.stringify({ ...out, rows }));
if (opt('inputs', null)) fs.writeFileSync(opt('inputs'), JSON.stringify(inputs));
if (opt('check', null)) {
    const ref = JSON.parse(fs.readFileSync(opt('check'), 'utf8'));
    const n = Math.min(ref.length, inputs.length);
    for (let i = 0; i < n; i++) if (ref[i] !== inputs[i]) { console.log(`DIFFERENT at bot frame ${i}: ${ref[i]} vs ${inputs[i]}`); process.exit(1); }
    console.log(`same inputs for all ${n} frames${ref.length !== inputs.length ? ` (lengths ${ref.length} vs ${inputs.length})` : ''}`);
}
