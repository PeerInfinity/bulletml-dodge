/**
 * The test policies (not the G4 bot), shared by `bin/play-game.mjs` and the browser page.
 *
 * `makePolicy(name, opts)` returns `(g) => input byte` for the game `g`, called once per frame, in order.
 * A policy keeps its own state (the random policy's generator, the look-ahead's current plan), so make a
 * fresh one per game. Moved here unchanged from `bin/play-game.mjs`; the G2 tapes recorded with them
 * re-record byte for byte.
 */
import { stepGame, cloneGame, STATUS, SPC, input } from './noiz2sa-game.js';

export const POLICY_NAMES = ['lookahead', 'chase', 'random', 'fire-stay'];

function lowestFoe(g) {
    let best = null;
    for (const f of g.foes) if (f && f.spc === SPC.FOE && (!best || f.y > best.y)) best = f;
    return best;
}

/** stand still and fire */
const fireStay = () => () => input(0, true, false);

/** random direction; fire 3/4 of the time; slow 1/8 */
function random() {
    let r = 12345;
    const rnd = () => ((r = (Math.imul(r, 1103515245) + 12345) >>> 0) >>> 16);
    return () => input(rnd() % 9, rnd() % 4 !== 0, rnd() % 8 === 0);
}

/** slide under the lowest enemy and fire; ignores bullets */
const chase = () => (g) => {
    const best = lowestFoe(g);
    if (!best) return input(0, true, false);
    const dx = best.x - g.ship.x;
    return input(Math.abs(dx) < 1024 ? 0 : dx > 0 ? 3 : 7, true, false);
};

/**
 * Every 4 frames, try each direction (fast or slow) held for 8 frames then standing for the rest of a
 * 40-frame look-ahead, on a copy of the game; keep the safest, then the one nearest the x of the lowest
 * enemy. It only exists to record tapes that reach a boss kill for the G2 comparison.
 * `laSafe`: frames of look-ahead survival that count as "safe" (lower = bolder).
 */
function lookahead({ laSafe = 40 } = {}) {
    let plan = 0, planLeft = 0;
    const chaseTarget = (h) => { const best = lowestFoe(h); return best ? best.x : h.ship.x; };
    return (g) => {
        if (planLeft-- > 0) return plan;
        let bestScore = -Infinity;
        for (let cand = 0; cand < 18; cand++) {
            const dir = cand % 9, slow = cand >= 9;
            const c = cloneGame(g);
            let alive = 0;
            for (let k = 0; k < 40 && c.status === STATUS.IN_GAME; k++) {
                const ev = stepGame(c, input(k < 8 ? dir : 0, true, slow));
                if (ev.some((e) => e[0] === 'hit')) break;
                alive++;
            }
            const score = Math.min(alive, laSafe) * 1e6 - Math.abs(chaseTarget(c) - c.ship.x) - Math.abs(c.ship.y - 98304) * 0.5;
            if (score > bestScore) { bestScore = score; plan = input(dir, true, slow); }
        }
        planLeft = 3;
        return plan;
    };
}

const FACTORIES = { 'fire-stay': fireStay, random, chase, lookahead };

export function makePolicy(name, opts = {}) {
    const f = FACTORIES[name];
    if (!f) throw new Error(`unknown policy "${name}" (have: ${POLICY_NAMES.join(', ')})`);
    return f(opts);
}
