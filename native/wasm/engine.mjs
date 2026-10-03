/**
 * The wasm engine (native/wasm/build.sh) behind a small JS object, and the P1 measurements on it; runs in Node and
 * in a browser. Slice P1 feasibility only — the page does not use it.
 */
export async function loadWasmEngine(factory) {
    const M = await factory();
    if (M._nz_load() !== 0) throw new Error('nz_load failed');
    const fresh = M.HEAPU8.slice(0, M._nz_mem_top()); // the state after loading, before any game
    const e = {
        M,
        /** a new game: back to the fresh state (as a new native process), then initGame */
        init: (stage, seed, endlessSeed) => { M.HEAPU8.set(fresh, 0); M._nz_init(stage, seed >>> 0, endlessSeed >>> 0); },
        step: (b) => M._nz_step(b),
        status: () => M._nz_status(),
        frame: () => M._nz_frame(),
        stateLine: () => M.UTF8ToString(M._nz_state_line()),
        memTop: () => M._nz_mem_top(),
        /** the whole state: the used part of linear memory */
        snapshot: () => M.HEAPU8.slice(0, M._nz_mem_top()),
        /** into an existing buffer (no allocation), returns the byte count */
        snapshotInto: (buf) => { const n = M._nz_mem_top(); buf.set(M.HEAPU8.subarray(0, n)); return n; },
        restore: (snap, n = snap.length) => { M.HEAPU8.set(n === snap.length ? snap : snap.subarray(0, n), 0); },
    };
    return e;
}

const tapeInputs = (tape) => { const out = []; for (const [b, n] of tape.inputs) for (let k = 0; k < n; k++) out.push(b); return out; };

/**
 * Time the engine on a tape: µs per step over the whole tape (best of `reps`), then at the busiest frame µs per
 * snapshot, per restore, and per 48-frame rollout (restore + 48 steps), as the bot would use them.
 */
export function benchTape(e, tape, { reps = 3, n = 2000, rollouts = 200 } = {}) {
    const inputs = tapeInputs(tape);
    let best = Infinity, line = '', busyFrame = 0, busyMem = 0;
    for (let r = 0; r < reps; r++) {
        e.init(tape.stage, tape.seed, tape.endlessSeed);
        const t0 = performance.now();
        for (let f = 0; f < inputs.length; f++) { if (e.step(inputs[f]) === 0) break; }
        best = Math.min(best, performance.now() - t0);
        line = e.stateLine();
    }
    return { frames: inputs.length, stepUs: (1000 * best) / inputs.length, line };
}

/** replay to frame F, then time snapshots, restores and rollouts there */
export function benchAt(e, tape, F, { n = 2000, rollouts = 200 } = {}) {
    const inputs = tapeInputs(tape);
    e.init(tape.stage, tape.seed, tape.endlessSeed);
    for (let f = 0; f < F; f++) e.step(inputs[f]);
    const nf = Number(e.stateLine().match(/nf=(\d+)/)[1]);
    const snap = e.snapshot();
    const best = (fn, k) => { let b = Infinity; for (let batch = 0; batch < 5; batch++) { const t = performance.now(); for (let i = 0; i < k; i++) fn(); b = Math.min(b, (1000 * (performance.now() - t)) / k); } return b; };
    const buf = new Uint8Array(snap.length + (1 << 20));
    const snapUs = best(() => e.snapshotInto(buf), n);
    const snapAllocUs = best(() => e.snapshot(), Math.max(50, n >> 2));
    const restoreUs = best(() => e.restore(snap), n);
    const rollUs = best(() => { e.restore(snap); for (let i = 0; i < 48; i++) e.step(inputs[F + i] ?? 0); }, rollouts);
    e.restore(snap);
    return { frame: F, liveFoes: nf, memBytes: snap.length, snapshotUs: snapUs, snapshotAllocUs: snapAllocUs, restoreUs, rollout48Us: rollUs };
}
