#!/usr/bin/env node
/**
 * The wasm engine against the JS port, in Node: every frame's state line on each tape, then the timings.
 *   node native/wasm/check.mjs [tape.json …]     (default: tapes/*.json)  [--bench tapes/g4/s11-attack-seed1-b1x.json]
 */
import fs from 'node:fs';
import path from 'node:path';
import factory from './build/noiz2sa.mjs';
import { loadWasmEngine, benchTape, benchAt } from './engine.mjs';
import { loadNoiz2saPatterns } from '../../src/game/patterns-node.js';
import { newGame, stepGame, stateLine, cloneGame, STATUS } from '../../src/game/noiz2sa-game.js';

const root = new URL('../..', import.meta.url).pathname;
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const files = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
const tapes = files.length ? files : fs.readdirSync(path.join(root, 'tapes')).filter((f) => f.endsWith('.json')).sort().map((f) => path.join(root, 'tapes', f));
const e = await loadWasmEngine(factory);
const P = loadNoiz2saPatterns();
const inputsOf = (t) => { const out = []; for (const [b, n] of t.inputs) for (let k = 0; k < n; k++) out.push(b); return out; };

let same = 0, frames = 0;
if (!args.includes('--no-compare')) {
    for (const file of tapes) {
        const tape = JSON.parse(fs.readFileSync(file, 'utf8'));
        const inputs = inputsOf(tape);
        const g = newGame(P, tape.stage, { seed: tape.seed, endlessSeed: tape.endlessSeed });
        e.init(tape.stage, tape.seed, tape.endlessSeed);
        let bad = null;
        for (let f = 0; f < inputs.length && g.status !== STATUS.TITLE; f++) {
            stepGame(g, inputs[f]); e.step(inputs[f]);
            frames++;
            const a = stateLine(g), b = e.stateLine();
            // on the frame that returns to the title only f= and st= compare (see bin/compare-native.mjs)
            if (a !== b && !(g.status === STATUS.TITLE && a.split(' ').slice(0, 2).join() === b.split(' ').slice(0, 2).join())) { bad = { frame: f + 1, js: a, wasm: b }; break; }
        }
        if (bad) console.log(`DIFFERS ${path.basename(file)} at frame ${bad.frame}\n  js   ${bad.js}\n  wasm ${bad.wasm}`); else same++;
    }
    console.log(`${same}/${tapes.length} tapes: the wasm engine's state line = the JS port's on every frame (${frames} frames)`);
}
// snapshot / restore: from a mid-game snapshot, a detour with other inputs, then a restore, must replay exactly
{
    const tape = JSON.parse(fs.readFileSync(path.join(root, 'tapes/g4/s10-attack-seed1-b1x.json'), 'utf8'));
    const inputs = inputsOf(tape);
    e.init(tape.stage, tape.seed, tape.endlessSeed);
    for (let f = 0; f < 8900; f++) e.step(inputs[f]);
    const snap = e.snapshot();
    const run = () => { const out = []; for (let f = 8900; f < 9400; f++) { e.step(inputs[f]); out.push(e.stateLine()); } return out; };
    const a = run();
    e.restore(snap);
    for (let f = 0; f < 700; f++) e.step((f * 7) % 64); // a detour: other inputs, longer
    e.restore(snap);
    const b = run();
    const g = newGame(P, tape.stage, { seed: tape.seed, endlessSeed: tape.endlessSeed });
    for (let f = 0; f < 9400; f++) stepGame(g, inputs[f]);
    const ok = a.join() === b.join() && a[a.length - 1] === stateLine(g);
    console.log(`${ok ? 'ok' : 'FAILED'} snapshot at frame 8900 of s10-attack-seed1-b1x (${snap.length} bytes), a 700-frame detour, restore: the same 500 frames again, = the JS port`);
}
const bt = opt('bench', null);
if (bt) {
    const tape = JSON.parse(fs.readFileSync(bt, 'utf8'));
    const inputs = inputsOf(tape);
    // the busiest frame by live foe slots, from the JS port
    const g = newGame(P, tape.stage, { seed: tape.seed, endlessSeed: tape.endlessSeed });
    let busy = 0, busyN = -1;
    for (let f = 0; f < inputs.length && g.status !== STATUS.TITLE; f++) {
        stepGame(g, inputs[f]);
        if ((f & 63) === 0) { let n = 0; for (const x of g.foes) if (x) n++; if (n > busyN) { busyN = n; busy = g.frame; } }
    }
    const w = benchTape(e, tape);
    const at = benchAt(e, tape, busy);
    console.log(JSON.stringify({ engine: 'wasm', where: 'node', tape: path.basename(bt), ...w, ...at, line: undefined }));
    console.log(`wasm final ${w.line}`);
}
