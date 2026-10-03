/** The JS engine timed the same way as the wasm one (engine.mjs): µs per step over a tape, then at a frame µs per
 *  cloneGame and per 48-frame rollout (clone + 48 steps). Node and browser. */
import { newGame, stepGame, cloneGame, stateLine, STATUS } from '../../src/game/noiz2sa-game.js';

const tapeInputs = (tape) => { const out = []; for (const [b, n] of tape.inputs) for (let k = 0; k < n; k++) out.push(b); return out; };
const best = (fn, k) => { let b = Infinity; for (let batch = 0; batch < 5; batch++) { const t = performance.now(); for (let i = 0; i < k; i++) fn(); b = Math.min(b, (1000 * (performance.now() - t)) / k); } return b; };

export function benchJs(P, tape, F, { reps = 3, n = 2000, rollouts = 200 } = {}) {
    const inputs = tapeInputs(tape);
    let bestMs = Infinity, line = '';
    for (let r = 0; r < reps; r++) {
        const g = newGame(P, tape.stage, { seed: tape.seed, endlessSeed: tape.endlessSeed });
        const t0 = performance.now();
        for (let f = 0; f < inputs.length && g.status !== STATUS.TITLE; f++) stepGame(g, inputs[f]);
        bestMs = Math.min(bestMs, performance.now() - t0);
        line = stateLine(g);
    }
    const g = newGame(P, tape.stage, { seed: tape.seed, endlessSeed: tape.endlessSeed });
    for (let f = 0; f < F; f++) stepGame(g, inputs[f]);
    let keep;
    const cloneUs = best(() => { keep = cloneGame(g); }, n);
    const rollUs = best(() => { const c = cloneGame(g); for (let i = 0; i < 48; i++) stepGame(c, inputs[F + i] ?? 0); }, rollouts);
    void keep;
    return { engine: 'js', frames: inputs.length, stepUs: (1000 * bestMs) / inputs.length, frame: F, cloneUs, rollout48Us: rollUs, line };
}

/** the busiest frame (most live foe slots, sampled every 64 frames) */
export function busiestFrame(P, tape) {
    const inputs = tapeInputs(tape);
    const g = newGame(P, tape.stage, { seed: tape.seed, endlessSeed: tape.endlessSeed });
    let busy = 0, busyN = -1;
    for (let f = 0; f < inputs.length && g.status !== STATUS.TITLE; f++) {
        stepGame(g, inputs[f]);
        if ((f & 63) === 0) { let n = 0; for (const x of g.foes) if (x) n++; if (n > busyN) { busyN = n; busy = g.frame; } }
    }
    return busy;
}
