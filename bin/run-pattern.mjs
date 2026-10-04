#!/usr/bin/env node
/**
 * Run the dodging bots on ONE pattern and report, per seed and rank, whether
 * the reflex bot survives and otherwise the smallest planner horizon that does.
 *
 *   node bin/run-pattern.mjs patterns/noiz2sa/zako/<file>.xml [--seeds 3] [--ranks 0.5,1]
 *        [--frames 1200] [--horizons 2,4,8,16,32,64] [--beam 16] [--trace out.json] [--perception observed]
 *
 * `--perception observed` (slice H1): the planners plan against what is on screen (src/game/perception.js), not
 * against a copy of the seeded world, and replan every frame.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseBulletML } from '../src/bulletml.js';
import { createWorld, step, bulletCount, isFinished } from '../src/noiz2sa.js';
import { makeReflexBot, makePlanner, makeObservedPlanner } from '../src/bots.js';
import { runnerIsEnd } from '../src/bulletml.js';

const args = process.argv.slice(2);
const opt = (name, dflt) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : dflt;
};
const file = args.find((a) => a.endsWith('.xml'));
if (!file) { console.error('usage: run-pattern.mjs <pattern.xml> [options]'); process.exit(2); }
const seeds = Number(opt('seeds', 3));
const ranks = opt('ranks', '0.5,1').split(',').map(Number);
const frames = Number(opt('frames', 1200));
const horizons = opt('horizons', '2,4,8,16,32,64').split(',').map(Number);
const beam = Number(opt('beam', 16));
const tracePath = opt('trace', null);
const observed = opt('perception', 'omniscient') === 'observed';
const jsonPath = opt('json', null);
const kind = path.basename(path.dirname(file)); // zako | middle | boss

const bml = parseBulletML(fs.readFileSync(file, 'utf8'), path.basename(file));

/** Quiet = no bullets left and every runner has ended (a still foe remains). */
function quiet(w) {
    if (bulletCount(w) > 0) return false;
    return w.foes.every((f) => !f || !f.cmd || runnerIsEnd(f.cmd));
}

function play(bot, seed, rank, trace = null) {
    const w = createWorld(bml, { seed, rank, kind });
    let queue = [];
    let peak = 0;
    while (w.tick < frames && !w.dead) {
        if (queue.length === 0) queue = bot(w);
        const a = queue.shift();
        step(w, a);
        peak = Math.max(peak, bulletCount(w));
        if (trace) trace.push(snapshot(w, a));
        if (kind !== 'boss' && (isFinished(w) || quiet(w))) break;
    }
    return { survived: !w.dead, tick: w.tick, deadTick: w.deadTick, peak };
}

function snapshot(w, a) {
    const b = [];
    for (const f of w.foes) if (f) b.push([f.x >> 8, f.y >> 8, f.px >> 8, f.py >> 8, f.spc]);
    return { t: w.tick, s: [w.ship.x >> 8, w.ship.y >> 8], a, dead: w.dead, b };
}

const t0 = Date.now();
const rows = [];
for (const rank of ranks) {
    for (let seed = 1; seed <= seeds; seed++) {
        const r = play(makeReflexBot(), seed, rank);
        let need = r.survived ? 0 : null;
        const tried = [`reflex:${r.survived ? 'ok' : `hit@${r.deadTick}`}`];
        if (!r.survived) {
            for (const h of horizons) {
                const p = play(observed ? makeObservedPlanner({ horizon: h, beam }) : makePlanner({ horizon: h, beam }), seed, rank);
                tried.push(`H${h}:${p.survived ? 'ok' : `hit@${p.deadTick}`}`);
                if (p.survived) { need = h; break; }
            }
        }
        rows.push({ rank, seed, need, peak: r.peak, frames: r.tick, tried: tried.join(' ') });
        console.log(`rank ${rank} seed ${seed}: ${need === null ? 'NOT DODGED' : need === 0 ? 'reflex' : `needs H=${need}`}  (peak ${r.peak} bullets, ${r.tick} frames)  ${tried.join(' ')}`);
    }
}
const worst = rows.some((r) => r.need === null) ? null : Math.max(...rows.map((r) => r.need));
console.log(`\n${bml.name}: ${worst === null ? 'NOT DODGED at some seed/rank' : worst === 0 ? 'REFLEX is enough' : `needs look-ahead H=${worst}`}  [${((Date.now() - t0) / 1000).toFixed(1)} s]`);

if (jsonPath) {
    fs.writeFileSync(jsonPath, JSON.stringify({
        pattern: bml.name, file, kind, verdict: worst === null ? 'not-dodged' : worst === 0 ? 'reflex' : `H${worst}`,
        need: worst, seconds: (Date.now() - t0) / 1000, settings: { seeds, ranks, frames, horizons, beam, ...(observed ? { perception: 'observed' } : {}) }, rows,
    }, null, 1));
}

if (tracePath) {
    const rank = ranks[ranks.length - 1];
    const trace = [];
    const bot = worst ? makePlanner({ horizon: worst, beam }) : makeReflexBot();
    play(bot, 1, rank, trace);
    fs.writeFileSync(tracePath, JSON.stringify({ pattern: bml.name, rank, seed: 1, bot: worst ? `H${worst}` : 'reflex', width: 320, height: 480, frames: trace }));
    console.log(`trace → ${tracePath} (${trace.length} frames)`);
}
