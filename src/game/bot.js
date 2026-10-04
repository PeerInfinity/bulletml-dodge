/**
 * The G4 bot: plays Noiz2sa with an exact look-ahead (shared by Node and the browser page's worker).
 *
 * Priorities, lexicographic (the user's ruling): survive; then attack (get under an enemy and fire — a kill
 * also wipes the bullets near it into stars); then stars (a hook, weight 0 in v1).
 *
 * How it plays. The game is deterministic and depends only on the inputs, so a plan that was simulated on a
 * copy of the game (`cloneGame` + `stepGame`, the engine itself — nothing approximated) happens exactly as
 * simulated. The bot keeps ONE committed plan of `horizon` frames:
 *  - Every frame it plays the plan's first input and extends the plan by one frame at its far end, with a
 *    cheap "tail" controller: head straight for the target (under an enemy; home for no-attack), or, with
 *    `tail: 'reflex'`, also steer off nearby bullets. That costs one simulated frame per game frame: a
 *    verified-safe plan never needs re-checking.
 *  - When the extension runs into a hit, it REPAIRS the plan: from the snapshot nearest the hit backwards to
 *    the present, it tries each of the 18 inputs (9 directions × normal/slow) held, then the tail, to the end
 *    of the horizon; the latest branch point with a surviving candidate wins, best value first. If none
 *    survives, a beam search from the present over 8-frame chunks; if that fails too, the plan whose first
 *    hit is latest.
 *  - With budget to spare it tries to IMPROVE the plan the same way from the present (attack value, then the
 *    distance to the target, then room around the ship), never trading survival.
 *
 * `costCap` (slice P1, off by default) caps one frame's spending too, in the same units.
 *
 * The budget is a count, not wall-clock, so a run is reproducible: every simulated frame and every game copy
 * costs 1 unit; each game frame adds `budget` units to a bank capped at `budget × bankFrames`; searches stop
 * when the bank is empty. `BROWSER_BUDGET` is calibrated to the browser's frame (docs/g4-report.md).
 *
 * ⚠ Like the pattern harness's planner, the look-ahead copies the seeded game, so it knows the future
 * `$rand` draws: the horizon answers "is there a path that far ahead", not "could a player guess it".
 */
import { stepGame, cloneGame, STATUS, SPC, input, SCAN_WIDTH_8, SCAN_HEIGHT_8, FOE_SCAN_SIZE, SHIP_SPEED, SHIP_SLOW_SPEED } from './noiz2sa-game.js';
import { observe, newTracker, cloneModel, stepModel, makeMargin, MOTIONS } from './perception.js';

export const BOT_VARIANTS = ['attack', 'no-attack'];
/** the tail controller: `straight` (the default: heads for the target, all dodging is the exact search) or
 *  `reflex` (also steers off bullets by itself, from their straight-line motion) */
export const TAILS = ['reflex', 'straight'];
/** simulated frames (+ game copies) per game frame that fit the browser's 16 ms frame; see docs/g4-report.md */
export const BROWSER_BUDGET = 600;
export const DEFAULT_HORIZON = 48;
/** what the plan is simulated on (slice H1): `omniscient` = a copy of the seeded game (the Ace: it knows every
 *  future shot); `observed` = the picture on screen, predicted forward (src/game/perception.js: the Expert) */
export const PERCEPTIONS = ['omniscient', 'observed'];
/** the levels in the page and the sweep: a level is a perception with otherwise the max settings */
export const LEVELS = { ace: { perception: 'omniscient' }, expert: { perception: 'observed' } };
/** the Expert's own defaults (slice H1b, chosen by measurement: docs/h1b-report.md), used when makeBot is not given them:
 *  - margin: the clearance it keeps, in px, from a bullet's drawn trail and from anything that can fire a bullet
 *    (an enemy, an active bullet, a dot not yet moving), and the line it stays below (top: under the band where
 *    enemies appear, 48–128 px down, plus the spawner clearance); perception.js makeMargin;
 *  - attackY: the height it attacks from, in px from the top (the Ace's and no-attack's home is 384, 4/5 down):
 *    near where enemies appear (48–128 px) its shots reach them sooner.
 *  The Ace takes neither: it knows where every bullet will be, and its plans find their own height. */
export const EXPERT_DEFAULTS = { margin: { bullet: 2, spawner: 8, top: 136 }, attackY: 160 };
/** the Expert settings in use, as bot.config and a tape record them (the ones left at "none" are left out) */
export function expertSettings({ margin, attackY }) {
    return {
        ...(makeMargin(margin) ? { margin: { bullet: margin.bullet || 0, spawner: margin.spawner || 0, top: margin.top || 0 } } : {}),
        ...(attackY != null ? { attackY } : {}),
    };
}

const HOME_X = SCAN_WIDTH_8 / 2;
const HOME_Y = Math.trunc((SCAN_HEIGHT_8 / 5) * 4);
const EDGE = 1024 * 3;
const SHIP_MV = [[0, -256], [181, -181], [256, 0], [181, 181], [0, 256], [-181, 181], [-256, 0], [-181, -181]];
const NEAR = (72 * 256) ** 2;
const REFLEX_WINDOW = 6;
const IMPROVE_EVERY = 8;
const HIT_R2 = (6 * 256) ** 2;
const SIGMA2 = (14 * 256) ** 2;
/** a simulated frame costs 1 + (live foe slots) / UNIT_FOES budget units */
export const UNIT_FOES = 52;
/** a predicted frame of the observed model (or a copy of it) costs MODEL_BASE + live objects / MODEL_FOES units:
 *  fitted, like UNIT_FOES, so that a unit is about the same CPU time (bin/bench-model.mjs, docs/h1-report.md) */
export const MODEL_BASE = 0.15, MODEL_FOES = 220;

/** the enemy the attacker goes for: the lowest one above the ship (the boss in its scene, once it is alone) */
export function attackTarget(g) {
    let best = null, bestKey = -Infinity;
    const sy = g.ship.y;
    for (const f of g.foes) {
        if (!f || f.spc !== SPC.FOE) continue;
        if (f.y > sy - 24 * 256 || f.y < 0) continue;
        const key = f.y - Math.abs(f.x - g.ship.x) * 0.5 + (f.type === 3 ? -64 * 256 : 0);
        if (key > bestKey) { bestKey = key; best = f; }
    }
    return best;
}

/**
 * The reflex tail controller: of the 9 directions at normal speed (and standing slow), the one whose next
 * REFLEX_WINDOW frames, against the bullets' current motion extrapolated in straight lines, stay clearest,
 * with a pull toward (tx, ty). Cheap; only ever a proposal — the plan is verified by the real simulation.
 */
function reflexInput(g, tx, ty, fire) {
    const ship = g.ship, sx0 = ship.x, sy0 = ship.y;
    const bx = [], by = [], bmx = [], bmy = [];
    for (const f of g.foes) {
        if (!f || f.spc === SPC.FOE) continue;
        const dx = f.x - sx0, dy = f.y - sy0;
        if (dx * dx + dy * dy < NEAR) { bx.push(f.x); by.push(f.y); bmx.push(f.mx); bmy.push(f.my); }
    }
    let best = 0, bestCost = Infinity;
    for (let d = 0; d <= 8; d++) {
        let sx = sx0, sy = sy0, speed = ship.speed, cost = 0;
        for (let t = 1; t <= REFLEX_WINDOW; t++) {
            if (speed < SHIP_SPEED) speed += 64;
            if (d > 0) {
                sx = Math.min(Math.max(sx + ((speed * SHIP_MV[d - 1][0]) >> 8), EDGE), SCAN_WIDTH_8 - EDGE);
                sy = Math.min(Math.max(sy + ((speed * SHIP_MV[d - 1][1]) >> 8), EDGE), SCAN_HEIGHT_8 - EDGE);
            }
            for (let k = 0; k < bx.length; k++) {
                const dx = bx[k] + bmx[k] * t - sx, dy = by[k] + bmy[k] * t - sy;
                const d2 = dx * dx + dy * dy;
                cost += d2 < HIT_R2 ? 1000 / t : Math.exp(-d2 / SIGMA2) * 4;
            }
        }
        const ex = (sx - tx) / 256, ey = (sy - ty) / 256;
        cost += 0.02 * Math.abs(ex) + 0.01 * Math.abs(ey);
        if (cost < bestCost) { bestCost = cost; best = d; }
    }
    return input(best, fire, false);
}

/** the `straight` tail: head for (tx, ty) and ignore the bullets (all dodging is left to the exact search) */
function straightInput(g, tx, ty, fire) {
    const dx = tx - g.ship.x, dy = ty - g.ship.y, dead = 3 * 256;
    const h = dx > dead ? 1 : dx < -dead ? -1 : 0, v = dy > dead ? 1 : dy < -dead ? -1 : 0;
    return input(DIR[v + 1][h + 1], fire, false);
}
const DIR = [[8, 1, 2], [7, 0, 3], [6, 5, 4]]; // dir by [dy+1][dx+1]
const HIT = 1, MARGIN = 2; // what a simulated frame ran into

/** squared distance from the ship to the nearest bullet, capped */
function clearance2(g) {
    let best = (48 * 256) ** 2;
    const sx = g.ship.x, sy = g.ship.y;
    for (const f of g.foes) {
        if (!f || f.spc === SPC.FOE) continue;
        const dx = f.x - sx, dy = f.y - sy;
        const d2 = dx * dx + dy * dy;
        if (d2 < best) best = d2;
    }
    return best;
}

/**
 * makeBot({variant, horizon, budget, bankFrames}) → bot(g) → input byte, called once per frame in order
 * (like the test policies). `bot.stats` counts what it did. A bot follows ONE game; if it is handed a game at
 * another frame than it expects, it starts over from that game.
 */
export function makeBot({ variant = 'attack', horizon = DEFAULT_HORIZON, budget = BROWSER_BUDGET, bankFrames = 32, snapEvery = 4, starWeight = 0, tail: tailKind = 'straight', costCap = Infinity, perception = 'omniscient', motion = 'curve', margin: marginOpt, attackY: attackYOpt } = {}) {
    if (!BOT_VARIANTS.includes(variant)) throw new Error(`unknown bot variant "${variant}" (have: ${BOT_VARIANTS.join(', ')})`);
    if (!TAILS.includes(tailKind)) throw new Error(`unknown tail "${tailKind}" (have: ${TAILS.join(', ')})`);
    if (!PERCEPTIONS.includes(perception)) throw new Error(`unknown perception "${perception}" (have: ${PERCEPTIONS.join(', ')})`);
    if (!MOTIONS.includes(motion)) throw new Error(`unknown motion "${motion}" (have: ${MOTIONS.join(', ')})`);
    const fire = variant === 'attack', observed = perception === 'observed';
    const marginPx = marginOpt !== undefined ? marginOpt : observed ? EXPERT_DEFAULTS.margin : null;
    if (marginPx && !observed) throw new Error('a margin needs perception "observed" (the Ace plans on the game itself)');
    const margin = makeMargin(marginPx);
    // the attack (H1b): the height it attacks from, in px from the top (null = home, 4/5 down)
    const attackYPx = attackYOpt !== undefined ? attackYOpt : observed ? EXPERT_DEFAULTS.attackY : null;
    if (attackYPx != null && !observed) throw new Error('attackY is an Expert setting (perception "observed")');
    const AY = fire && attackYPx != null ? Math.trunc(attackYPx * 256) : HOME_Y;
    const H = Math.max(0, horizon | 0), K = snapEvery, cap = budget * bankFrames;
    const stats = { frames: 0, cost: 0, steps: 0, clones: 0, lastSteps: 0, lastLive: 0, lastCost: 0, maxFrameCost: 0, repairs: 0, repairFails: 0, beams: 0, improves: 0, improveTries: 0, doomed: 0,
        // observed only: frames whose fresh picture put a hit into a plan that was safe the frame before (a surprise),
        // and what the observer saw (object-frames, turning / accelerating fits, dots not yet moving)
        surprises: 0, seen: { objects: 0, turning: 0, accel: 0, unseen: 0 },
        // with a margin: repairs that could not keep the plan outside it
        nearFails: 0 };
    const tracker = observed ? newTracker() : null;

    // the plan: plan[i] is the input for frame f0 + i; snaps.get(f) is the game at frame f (before its input);
    // end is the game after the whole plan; hits are the frames whose input runs into a hit, nears (with a margin)
    // the frames whose input brings the ship inside the margin
    let f0 = -1, plan = [], snaps = new Map(), end = null, hits = [], nears = [], bank = cap, spent = 0, lastFail = -1e9, lastNearFail = -1e9;

    // a simulated frame (or a game copy) costs more with more objects alive: `unit` is set per game frame
    // from the live foe slots then (enemies + bullets), so that a unit of budget is about the same CPU time
    let unit = 1, steps = 0;
    const charge = (n) => { spent += n * unit; steps += n; };
    const clone = observed ? (s) => { stats.clones++; return cloneModel(s); } : (s) => { stats.clones++; return cloneGame(s); };
    const left = () => bank - spent;
    // what this frame's decision may still spend: the bank, and at most `costCap` units in one frame (slice P1:
    // a per-decision cap, counted in units like everything else, so still reproducible; Infinity = no cap, G4's bot)
    const room = () => Math.min(bank, costCap) - spent;

    function target(c) {
        if (!fire) return [HOME_X, HOME_Y];
        const t = attackTarget(c);
        return t ? [t.x, AY] : [HOME_X, AY];
    }
    const tail = tailKind === 'reflex'
        ? (c) => { const [tx, ty] = target(c); return reflexInput(c, tx, ty, fire); }
        : (c) => { const [tx, ty] = target(c); return straightInput(c, tx, ty, fire); };

    /** step c with input b: HIT if the ship was hit, MARGIN if it came inside the margin, else 0 */
    function step(c, b, acc) {
        charge(1);
        if (observed) return stepModel(c, b, acc, starWeight, margin) ? HIT : c.near ? MARGIN : 0;
        let hit = false;
        for (const e of stepGame(c, b)) {
            if (e[0] === 'hit') hit = true;
            else if (acc) {
                if (e[0] === 'kill') acc.value += 4 + e[1] * 4;
                else if (e[0] === 'damage') acc.value += 1;
                else if (e[0] === 'star') acc.value += starWeight * e[1];
            }
        }
        return hit ? HIT : 0;
    }

    /** extend the plan by one frame at its far end (with the tail controller) */
    function extendOne() {
        if (end.status !== STATUS.IN_GAME) { plan.push(fire ? input(0, true, false) : 0); return; }
        if (end.frame % K === 0) { snaps.set(end.frame, clone(end)); charge(1); }
        const b = tail(end);
        const f = end.frame;
        const r = step(end, b, null);
        if (r === HIT) hits.push(f); else if (r === MARGIN) nears.push(f);
        plan.push(b);
    }

    /**
     * Roll out from state s (at frame s.frame) to frame E: the `fixed` inputs if given, else `first` held for
     * `hold` frames; then the tail. Returns {inputs, firstHit (frame or Infinity), firstNear (the first frame inside
     * the margin, or Infinity), value, pos, room, from}, or null when the bank cannot pay for it.
     */
    function rollout(s, first, hold, E, fixed = null) {
        if (room() < E - s.frame + 1) return null;
        const c = clone(s); charge(1);
        const inputs = [], acc = { value: 0 };
        let firstHit = Infinity, firstNear = Infinity;
        while (c.frame < E && c.status === STATUS.IN_GAME) {
            const i = c.frame - s.frame;
            const b = fixed ? (i < fixed.length ? fixed[i] : tail(c)) : i < hold ? first : tail(c);
            const f = c.frame;
            inputs.push(b);
            const r = step(c, b, acc);
            if (r === HIT) { firstHit = f; if (firstNear > f) firstNear = f; break; }
            if (r === MARGIN && firstNear === Infinity) firstNear = f;
        }
        const [tx, ty] = target(c);
        const pos = -Math.abs(c.ship.x - tx) / 256 - Math.abs(c.ship.y - ty) / 512;
        return { inputs, firstHit, firstNear, value: acc.value, pos, room: Math.sqrt(clearance2(c)) / 256, from: s.frame };
    }

    const better = (a, b) => {
        // lexicographic: survival (later first hit), then the margin (later first breach), then attack value, then
        // position + room
        if (!b) return true;
        if (a.firstHit !== b.firstHit) return a.firstHit > b.firstHit;
        if (a.firstNear !== b.firstNear) return a.firstNear > b.firstNear;
        if (a.value !== b.value) return a.value > b.value;
        return a.pos + a.room > b.pos + b.room;
    };

    /** replace the plan from frame r.from with r.inputs, then re-simulate it to rebuild the snapshots */
    function commit(r) {
        const i0 = r.from - f0;
        plan.length = i0;
        hits = hits.filter((f) => f < r.from);
        nears = nears.filter((f) => f < r.from);
        for (const f of [...snaps.keys()]) if (f > r.from) snaps.delete(f);
        const s = r.from === f0 ? rootState : snaps.get(r.from);
        end = clone(s); charge(1);
        for (const b of r.inputs) {
            if (end.status !== STATUS.IN_GAME) { plan.push(b); continue; }
            if (end.frame % K === 0 && end.frame !== r.from) { snaps.set(end.frame, clone(end)); charge(1); }
            const f = end.frame;
            const res = step(end, b, null);
            if (res === HIT) hits.push(f); else if (res === MARGIN) nears.push(f);
            plan.push(b);
        }
        while (plan.length < H && left() > 0) extendOne();
    }

    const INPUTS = [];
    for (const slow of [false, true]) for (let d = 0; d <= 8; d++) INPUTS.push(input(d, fire, slow));

    let rootState = null;

    /** try the 18 held inputs (whole way, and 8 frames then the tail) from state s; the best result */
    function tryFrom(s, E, best) {
        for (const hold of [E, 8]) {
            for (const b of INPUTS) {
                const r = rollout(s, b, hold, E);
                if (!r) return { best, out: true };
                if (better(r, best)) best = r;
            }
        }
        return { best, out: false };
    }

    function repair() {
        stats.repairs++;
        const E = f0 + plan.length;
        const firstHit = hits.length ? hits[0] : Infinity, firstNear = nears.length ? Math.min(nears[0], firstHit) : firstHit;
        const current = { firstHit, firstNear, value: -Infinity, pos: -Infinity, room: 0 };
        const clean = (r) => r.firstHit === Infinity && r.firstNear === Infinity;
        // branch points: snapshots before the trouble (a hit, or the margin), latest first, then the present
        const points = [...snaps.keys()].filter((f) => f <= firstNear && f > f0).sort((a, b) => b - a);
        points.push(f0);
        let best = null;
        for (const p of points) {
            const s = p === f0 ? rootState : snaps.get(p);
            const res = tryFrom(s, E, best);
            best = res.best;
            if (best && clean(best)) break;
            if (res.out) break;
        }
        if ((!best || !clean(best)) && room() > 0) {
            const b = beam(E);
            if (b && better(b, best)) best = b;
        }
        if (best && (best.firstHit > current.firstHit || (best.firstHit === current.firstHit && best.firstNear > current.firstNear))) { commit(best); }
        // a repair that failed is not retried for K frames; the margin has its own clock, so that a margin it could
        // not keep never holds up the repair of a hit
        if (hits.length) { stats.repairFails++; lastFail = f0; } else if (nears.length) { stats.nearFails++; lastNearFail = f0; }
    }

    /** beam search from the present over 8-frame chunks (18 inputs each), keeping the 6 best; null if out of bank */
    function beam(E) {
        stats.beams++;
        const C = 8, W = 6;
        let front = [{ state: rootState, inputs: [], value: 0, firstNear: Infinity }];
        let bestDead = null;
        while (front.length && front[0].state.frame < E) {
            const next = [];
            for (const n of front) {
                for (const b of INPUTS) {
                    if (room() < C + 1) return bestDead;
                    const c = clone(n.state); charge(1);
                    const acc = { value: n.value };
                    const inputs = n.inputs.slice();
                    let hitAt = Infinity, firstNear = n.firstNear;
                    for (let k = 0; k < C && c.frame < E && c.status === STATUS.IN_GAME; k++) {
                        const f = c.frame;
                        inputs.push(b);
                        const r = step(c, b, acc);
                        if (r === HIT) { hitAt = f; if (firstNear > f) firstNear = f; break; }
                        if (r === MARGIN && firstNear === Infinity) firstNear = f;
                    }
                    const node = { state: c, inputs, value: acc.value, room: Math.sqrt(clearance2(c)) / 256, firstNear };
                    if (hitAt !== Infinity) {
                        const r = { inputs, firstHit: hitAt, firstNear, value: acc.value, pos: 0, room: 0, from: f0 };
                        if (better(r, bestDead)) bestDead = r;
                    } else next.push(node);
                }
            }
            // outside the margin longest first (without a margin all are Infinity), then room + value
            next.sort((a, b) => (a.firstNear !== b.firstNear ? (a.firstNear > b.firstNear ? -1 : 1) : (b.room + b.value) - (a.room + a.value)));
            front = next.slice(0, W);
            if (front.length && (front[0].state.frame >= E || front[0].state.status !== STATUS.IN_GAME)) {
                const n = front[0];
                const [tx] = target(n.state);
                return { inputs: n.inputs, firstHit: Infinity, firstNear: n.firstNear, value: n.value, pos: -Math.abs(n.state.ship.x - tx) / 256, room: n.room, from: f0 };
            }
        }
        return bestDead;
    }

    /** with budget to spare, try to do better than the current safe plan from the present */
    function improve() {
        stats.improveTries++;
        const E = f0 + plan.length;
        // the current plan's own value, measured the same way as the candidates
        const cur = rollout(rootState, 0, 0, E, plan);
        if (!cur) return;
        let best = cur;
        // as many candidate sets as the spare budget pays for (a bigger budget looks at more plans), keeping
        // half the bank for repairs: each set is the 18 inputs held for `hold` frames, then the tail
        const setCost = INPUTS.length * (H + 1) * unit;
        const holds = [...new Set([8, H, 16, 4, 32, 2, 24].map((h) => Math.min(h, H)))];
        for (const hold of holds) {
            if (left() - cap / 2 < setCost || room() < setCost) break;
            for (const b of INPUTS) {
                const r = rollout(rootState, b, hold, E);
                if (!r) break;
                if (better(r, best)) best = r;
            }
        }
        if (best !== cur) { stats.improves++; commit(best); }
    }

    function reset(s) {
        f0 = s.frame; plan = []; snaps = new Map(); hits = []; nears = []; lastFail = -1e9; lastNearFail = -1e9;
        end = clone(s); charge(1);
    }

    function bot(g) {
        if (H === 0) { stats.frames++; return tail(g); } // no look-ahead at all: the tail controller alone
        spent = 0; steps = 0;
        let live = 0;
        for (const f of g.foes) if (f) live++;
        unit = observed ? MODEL_BASE + live / MODEL_FOES : 1 + live / UNIT_FOES;
        bank = Math.min(bank + budget, cap);
        if (!observed) {
            if (g.frame !== f0 || !end) reset(g);
            rootState = g;
        } else {
            // the observed bot looks again every frame: what it predicted last frame may be wrong (a bullet fired since,
            // a turn), so the plan is re-checked against the fresh picture — and repaired below if it now runs into a hit
            rootState = observe(g, tracker, { motion, stars: starWeight > 0 }, stats.seen); charge(1); // looking costs a model frame
            if (g.frame !== f0 || !end) reset(rootState);
            else {
                const wasSafe = hits.length === 0;
                commit({ from: f0, inputs: plan.slice() });
                if (wasSafe && hits.length) stats.surprises++;
            }
        }
        while (plan.length < H) extendOne();
        if (g.status === STATUS.IN_GAME) {
            if (hits.length ? f0 - lastFail >= K || lastFail < 0 : nears.length && (f0 - lastNearFail >= K || lastNearFail < 0)) repair();
            else if (!hits.length && f0 % IMPROVE_EVERY === 0 && left() > cap / 2 + (INPUTS.length + 1) * (H + 1) * unit
                && room() > (INPUTS.length + 1) * (H + 1) * unit) improve();
        }
        const b = plan.shift();
        f0++;
        snaps.delete(f0 - 1);
        if (hits.length && hits[0] < f0) { hits.shift(); stats.doomed++; }
        if (nears.length && nears[0] < f0) nears.shift();
        bank -= spent;
        stats.frames++; stats.cost += spent; stats.steps += steps; stats.lastSteps = steps; stats.lastLive = live; stats.lastCost = spent;
        if (spent > stats.maxFrameCost) stats.maxFrameCost = spent;
        return b;
    }
    bot.stats = stats;
    bot.config = { variant, horizon: H, budget, bankFrames, snapEvery: K, starWeight, tail: tailKind, ...(costCap !== Infinity ? { costCap } : {}), ...(observed ? { perception, motion } : {}), ...expertSettings({ margin: marginPx, attackY: attackYPx }) };
    return bot;
}
