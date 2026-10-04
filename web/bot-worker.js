/**
 * The G4 bot in a Web Worker, so the page's game keeps its full speed while the bot thinks.
 *
 * The worker plays its OWN copy of the game: the engine is deterministic and the bot's input is the only input,
 * so its copy and the page's stay identical frame for frame. It runs ahead of the page by up to LEAD frames
 * and posts the inputs; the page plays them as they come (and waits — it never guesses — if one is late).
 * The bot's budget is the same count as in Node, so the page plays exactly the moves a headless run plays.
 *
 * Messages in:  {type: 'init', patterns}  (packed with packBulletML: a worker has no XML parser)
 *               {type: 'start', id, stage, seed, endlessSeed, hitbox, inputs, bot}
 *                 — `inputs` are the frames played so far (replayed here), the bot takes over after them; `bot` = the
 *                 makeBot options (variant, perception, horizon, budget, …; for a humanlike bot (H2) its margin, attackY,
 *                 starWeight, human knobs, botSeed and gameSeed), so the worker's bot is the one a tape records
 *               {type: 'ack', id, frame}  the page's current frame;  {type: 'stop', id}
 *               {type: 'slow', factor}  (checks only) make each bot frame take factor× its CPU time: a slower machine
 * Messages out: {type: 'inputs', id, from, inputs, ms, units}  inputs for frames from, from+1, …, and the
 *               bot's CPU time and budget units spent for each;  {type: 'ready', lead};  {type: 'error', message}
 */
import { unpackBulletML } from '../src/bulletml.js';
import { newGame, stepGame, STATUS } from '../src/game/noiz2sa-game.js';
import { makeBot } from '../src/game/bot.js';

// frames the worker may run ahead of the page (~3 s). Its bursts (an `improve` every 8 frames spends up to half the
// bank, ~10,000 units) are paid back from this lead, so a slow machine needs it long (slice P1: 60 was ~1 s)
const LEAD = 180;
// the worker yields between slices with a message to itself: setTimeout(0) is clamped to ≥ 4 ms once nested, which
// left the worker idle up to a third of the time when it was behind (slice P1)
const kick = new MessageChannel();
let kicked = false; // a kick is on its way
kick.port1.onmessage = () => { kicked = false; pump(); };
let patterns = null, run = null, pumping = false;
let slow = 1; // for the frame-time checks only (window.noiz.setWorkerSlowdown): spin so each bot frame takes slow× its time

function start(m) {
    const g = newGame(patterns, m.stage, { seed: m.seed, endlessSeed: m.endlessSeed, hitbox: m.hitbox ?? 'original' });
    for (const b of m.inputs) stepGame(g, b);
    run = { id: m.id, g, bot: makeBot({ ...m.bot, costCap: m.bot.costCap ?? Infinity }), pageFrame: g.frame, out: [], ms: [], units: [], from: g.frame };
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
        if (slow > 1) { const until = t + (performance.now() - t) * slow; while (performance.now() < until); }
        run.ms.push(+(performance.now() - t).toFixed(2));
        run.units.push(Math.round(run.bot.stats.lastCost));
        stepGame(run.g, b);
        run.out.push(b);
        if (run.out.length >= 4 || performance.now() - t0 > 8) break;
    }
    flush();
    pumping = false;
    // keep going in slices so 'ack' and 'stop' get through between them
    if (run && run.g.status === STATUS.IN_GAME && run.g.frame - run.pageFrame < LEAD && !kicked) { kicked = true; kick.port2.postMessage(null); }
}

onmessage = (e) => {
    const m = e.data;
    try {
        if (m.type === 'init') {
            patterns = {};
            for (const k of Object.keys(m.patterns)) patterns[k] = m.patterns[k].map(unpackBulletML);
            postMessage({ type: 'ready', lead: LEAD });
        } else if (m.type === 'start') start(m);
        else if (m.type === 'ack') { if (run && run.id === m.id) { run.pageFrame = m.frame; if (!kicked) pump(); } }
        else if (m.type === 'stop') { if (run && run.id === m.id) run = null; }
        else if (m.type === 'slow') slow = m.factor;
    } catch (err) {
        postMessage({ type: 'error', message: String(err && err.stack || err) });
    }
};
