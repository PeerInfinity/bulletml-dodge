import factory from './build/noiz2sa.mjs';
import { loadWasmEngine, benchTape, benchAt } from './engine.mjs';
import { benchJs } from './js-bench.mjs';
import { unpackBulletML } from '../../src/bulletml.js';

onmessage = async ({ data: { tape, busy, patterns } }) => {
    const P = {};
    for (const k of Object.keys(patterns)) P[k] = patterns[k].map(unpackBulletML);
    const e = await loadWasmEngine(factory);
    const wasm = { ...benchTape(e, tape), ...benchAt(e, tape, busy) };
    const js = benchJs(P, tape, busy);
    postMessage({ wasm, js });
};
