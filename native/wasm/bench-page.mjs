// Slice P1: the wasm engine vs the JS engine in the browser, on the page's main thread and in a worker.
// Opened by native/wasm/bench-browser.mjs; the result is window.benchResult.
import factory from './build/noiz2sa.mjs';
import { loadWasmEngine, benchTape, benchAt } from './engine.mjs';
import { benchJs, busiestFrame } from './js-bench.mjs';
import { loadNoiz2saPatternsWeb } from '../../src/game/patterns-web.js';
import { packBulletML } from '../../src/bulletml.js';

const BASE = new URL('../../', import.meta.url);
const tapeName = new URLSearchParams(location.search).get('tape') || 'g4/s11-attack-seed1-b1x.json';
window.benchResult = (async () => {
    const P = await loadNoiz2saPatternsWeb(BASE);
    const tape = await (await fetch(new URL(`tapes/${tapeName}`, BASE))).json();
    const busy = busiestFrame(P, tape);
    const out = { tape: tapeName, busy };
    const e = await loadWasmEngine(factory);
    out.mainWasm = { ...benchTape(e, tape), ...benchAt(e, tape, busy) };
    out.mainJs = benchJs(P, tape, busy);
    const w = new Worker(new URL('./bench-worker.mjs', import.meta.url), { type: 'module' });
    out.worker = await new Promise((resolve, reject) => {
        w.onmessage = (m) => resolve(m.data);
        w.onerror = (err) => reject(new Error(err.message));
        w.postMessage({ tape, busy, patterns: Object.fromEntries(Object.entries(P).map(([k, l]) => [k, l.map(packBulletML)])) });
    });
    document.getElementById('out').textContent = JSON.stringify(out, null, 1);
    return out;
})();
