/**
 * The G4 bot in a Web Worker, so the page's game keeps its full speed while the bot thinks.
 *
 * The worker plays its OWN copy of the game: the engine is deterministic and the bot's input is the only input,
 * so its copy and the page's stay identical frame for frame. It runs ahead of the page by up to LEAD frames
 * and posts the inputs; the page plays them as they come (and waits — it never guesses — if one is late).
 * The bot's budget is the same count as in Node, so the page plays exactly the moves a headless run plays.
 *
 * Messages in:  {type: 'init', patterns}  (packed with packBulletML: a worker has no XML parser)
 *               {type: 'start', id, stage, seed, endlessSeed, inputs, variant, horizon, budget}
 *                 — `inputs` are the frames played so far (replayed here), the bot takes over after them
 *               {type: 'ack', id, frame}  the page's current frame;  {type: 'stop', id}
 * Messages out: {type: 'inputs', id, from, inputs, ms, units}  inputs for frames from, from+1, …, and the
 *               bot's CPU time and budget units spent for each;  {type: 'ready'};  {type: 'error', message}
 */
import { unpackBulletML } from '../src/bulletml.js';
import { newGame, stepGame, STATUS } from '../src/game/noiz2sa-game.js';
import { makeBot } from '../src/game/bot.js';

const LEAD = 60; // frames the worker may run ahead of the page (~1 s): covers the bot's costliest searches
let patterns = null, run = null, pumping = false;

function start(m) {
    const g = newGame(patterns, m.stage, { seed: m.seed, endlessSeed: m.endlessSeed });
    for (const b of m.inputs) stepGame(g, b);
    run = { id: m.id, g, bot: makeBot({ variant: m.variant, horizon: m.horizon, budget: m.budget }), pageFrame: g.frame, out: [], ms: [], units: [], from: g.frame };
    pump();
}

function flush() {
    if (!run || !run.out.length) return;
    postMessage({ type: 'inputs', id: run.id, from: run.from, inputs: run.out, ms: run.ms, units: run.units });
    run.from += run.out.length;
    run.out = []; run.ms = []; run.units = [];
}

function pump() {
    if (pumping) return;
    pumping = true;
    const t0 = performance.now();
    while (run && run.g.status === STATUS.IN_GAME && run.g.frame - run.pageFrame < LEAD) {
        const t = performance.now();
        const b = run.bot(run.g);
        run.ms.push(+(performance.now() - t).toFixed(2));
        run.units.push(Math.round(run.bot.stats.lastCost));
        stepGame(run.g, b);
        run.out.push(b);
        if (run.out.length >= 4 || performance.now() - t0 > 8) break;
    }
    flush();
    pumping = false;
    // keep going in slices so 'ack' and 'stop' get through between them
    if (run && run.g.status === STATUS.IN_GAME && run.g.frame - run.pageFrame < LEAD) setTimeout(pump, 0);
}

onmessage = (e) => {
    const m = e.data;
    try {
        if (m.type === 'init') {
            patterns = {};
            for (const k of Object.keys(m.patterns)) patterns[k] = m.patterns[k].map(unpackBulletML);
            postMessage({ type: 'ready' });
        } else if (m.type === 'start') start(m);
        else if (m.type === 'ack') { if (run && run.id === m.id) { run.pageFrame = m.frame; pump(); } }
        else if (m.type === 'stop') { if (run && run.id === m.id) run = null; }
    } catch (err) {
        postMessage({ type: 'error', message: String(err && err.stack || err) });
    }
};
