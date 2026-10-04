/**
 * Tapes: {game, stage, seed, endlessSeed, [hitbox], frames, inputs: [[byte, count], …]} — one input byte per frame
 * (dir | fire<<4 | slow<<5), run-length encoded. Shared by `bin/play-game.mjs` and the browser page.
 * `hitbox` (slice HB) is there only when it is not 'original': a tape without it is an original-hitbox game.
 */
import { newGame, stepGame, STATUS } from './noiz2sa-game.js';

export const TAPE_GAME = 'noiz2sa-0.52';

/** the tape's inputs, one byte per frame */
export function tapeInputs(tape) {
    const out = [];
    for (const [b, n] of tape.inputs) for (let k = 0; k < n; k++) out.push(b);
    return out;
}

/** a tape from the bytes played; `extra` fields (e.g. who played) go after the standard ones */
export function makeTape({ stage, seed, endlessSeed, hitbox = 'original', played, extra = {} }) {
    const rle = [];
    for (const b of played) { if (rle.length && rle[rle.length - 1][0] === b) rle[rle.length - 1][1]++; else rle.push([b, 1]); }
    return { game: TAPE_GAME, stage, seed, endlessSeed, ...(hitbox !== 'original' ? { hitbox } : {}), frames: played.length, inputs: rle, ...extra };
}

/** newGame's options for a tape's game */
export const tapeGameOptions = (tape) => ({ seed: tape.seed, endlessSeed: tape.endlessSeed, hitbox: tape.hitbox || 'original' });

/**
 * Play a tape to its end as `bin/play-game.mjs --tape` does: until the game returns to the title, the
 * inputs run out, or `maxFrames`. `onFrame(g, events)` is called after each frame. Returns the game.
 */
export function replayTape(patterns, tape, { maxFrames = 200000, onFrame = null } = {}) {
    const inputs = tapeInputs(tape);
    const g = newGame(patterns, tape.stage, tapeGameOptions(tape));
    while (g.status !== STATUS.TITLE && g.frame < maxFrames && g.frame < inputs.length) {
        const ev = stepGame(g, inputs[g.frame]);
        if (onFrame) onFrame(g, ev);
    }
    return g;
}
