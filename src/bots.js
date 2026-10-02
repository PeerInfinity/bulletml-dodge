/**
 * Two kinds of dodger.
 *
 *  - REFLEX (horizon 0): sees only the screen now — each bullet's position and
 *    its last frame's motion — and extrapolates them in straight lines for a
 *    short reaction window. It never runs the pattern, so it cannot know that a
 *    bullet will turn, split or be fired next.
 *  - PLANNER (horizon H): searches move sequences H frames ahead against the
 *    real simulation (a copy of the world), with a beam search; it replans
 *    every chunk. ⚠ It also knows the pattern's future $rand draws, because it
 *    copies the seeded world — it answers "is there a path at this horizon",
 *    not "could a player guess it".
 */

import { ACTIONS, SHIP_SPEED, SCAN_WIDTH_8, SCAN_HEIGHT_8, SPC, cloneWorld, step, stepFrame, moveShip, segmentHitsShip, actionDir, actionSlow } from './noiz2sa.js';

const HOME_X = SCAN_WIDTH_8 / 2;
const HOME_Y = (SCAN_HEIGHT_8 / 5) * 4;
const SHIP_MV = [[0, -256], [181, -181], [256, 0], [181, 181], [0, 256], [-181, 181], [-256, 0], [-181, -181]];
const EDGE = 3072;

/** Squared distance from the ship to the nearest bullet (1/256 px units). */
export function clearance2(w) {
    let best = Infinity;
    const sx = w.ship.x, sy = w.ship.y;
    for (const f of w.foes) {
        if (!f || f.spc === SPC.FOE) continue;
        const dx = f.x - sx, dy = f.y - sy;
        const d2 = dx * dx + dy * dy;
        if (d2 < best) best = d2;
    }
    return best;
}

// ── REFLEX ──
export function makeReflexBot({ window = 8, sigmaPx = 12, homeWeight = 0.02 } = {}) {
    const sigma2 = (sigmaPx * 256) ** 2;
    const near2 = (sigmaPx * 256 * 8) ** 2;
    return function reflex(w) {
        const sx0 = w.ship.x, sy0 = w.ship.y;
        const bullets = [];
        for (const f of w.foes) {
            if (!f || f.spc === SPC.FOE) continue;
            const dx = f.x - sx0, dy = f.y - sy0;
            if (dx * dx + dy * dy < near2) bullets.push(f);
        }
        let bestA = 0, bestCost = Infinity;
        for (let a = 0; a < ACTIONS; a++) {
            let sx = sx0, sy = sy0, speed = w.ship.speed, cost = 0;
            const sd = actionDir(a), slow = actionSlow(a);
            for (let t = 1; t <= window; t++) {
                if (slow) { if (speed > 640) speed -= 64; } else if (speed < SHIP_SPEED) speed += 64;
                if (sd >= 0) {
                    sx = Math.min(Math.max(sx + ((speed * SHIP_MV[sd][0]) >> 8), EDGE), SCAN_WIDTH_8 - EDGE);
                    sy = Math.min(Math.max(sy + ((speed * SHIP_MV[sd][1]) >> 8), EDGE), SCAN_HEIGHT_8 - EDGE);
                }
                for (const f of bullets) {
                    const bx = f.x + f.mx * t, by = f.y + f.my * t;
                    const dx = bx - sx, dy = by - sy;
                    const d2 = dx * dx + dy * dy;
                    cost += d2 < (4 * 256) ** 2 ? 1000 / t : Math.exp(-d2 / (2 * sigma2));
                }
            }
            const hx = (sx - HOME_X) / 256, hy = (sy - HOME_Y) / 256;
            cost += homeWeight * Math.sqrt(hx * hx + hy * hy);
            if (cost < bestCost) { bestCost = cost; bestA = a; }
        }
        return [bestA];
    };
}

// ── PLANNER ──
/**
 * Beam search over `depth` chunks of `chunk` frames (horizon ≈ depth × chunk).
 * A node's score is the smallest clearance seen on its path, so the beam
 * prefers paths that stay away from bullets. Returns the first chunk of the
 * best surviving path (or of the longest-surviving one when none survive).
 *
 * Speed-up, exact: the bullets depend on the ship only when the pattern AIMS.
 * A chunk is simulated once; if nothing aimed during it, all 18 moves are
 * tested against that one run's bullet segments. Otherwise each move gets its
 * own copy of the world.
 */
export function makePlanner({ horizon, beam = 16, maxDepth = 8 } = {}) {
    const chunk = Math.max(1, Math.ceil(horizon / maxDepth));
    const depth = Math.max(1, Math.ceil(horizon / chunk));
    const cap2 = (48 * 256) ** 2;
    const stats = { shared: 0, split: 0 };

    function expand(node, out, onDead) {
        const base = cloneWorld(node.w);
        base.aimed = false;
        const frames = [];
        for (let t = 0; t < chunk; t++) {
            const segs = [];
            stepFrame(base, 0, segs);
            frames.push(segs);
        }
        if (!base.aimed) {
            stats.shared++;
            for (let a = 0; a < ACTIONS; a++) {
                const ship = { ...node.w.ship };
                let score = node.score, deadAt = -1;
                for (let t = 0; t < chunk && deadAt < 0; t++) {
                    moveShip(ship, a);
                    const segs = frames[t];
                    for (let k = 0; k < segs.length; k += 4) {
                        if (segmentHitsShip(segs[k], segs[k + 1], segs[k + 2], segs[k + 3], ship.x, ship.y)) { deadAt = node.w.tick + t; break; }
                        const dx = segs[k + 2] - ship.x, dy = segs[k + 3] - ship.y;
                        const d2 = dx * dx + dy * dy;
                        if (d2 < score) score = d2;
                    }
                }
                const first = node.first === -1 ? a : node.first;
                if (deadAt >= 0) { onDead(first, deadAt); continue; }
                out.push({ w: { ...base, ship, dead: false, deadTick: -1 }, first, score: Math.min(score, cap2) });
            }
        } else {
            stats.split++;
            for (let a = 0; a < ACTIONS; a++) {
                const c = cloneWorld(node.w);
                let score = node.score;
                for (let t = 0; t < chunk; t++) {
                    step(c, a);
                    if (c.dead) break;
                    score = Math.min(score, clearance2(c));
                }
                const first = node.first === -1 ? a : node.first;
                if (c.dead) { onDead(first, c.deadTick); continue; }
                out.push({ w: c, first, score: Math.min(score, cap2) });
            }
        }
    }

    function planner(w) {
        let frontier = [{ w, first: -1, score: cap2 }];
        let bestDead = null;
        const onDead = (first, deadTick) => { if (!bestDead || deadTick > bestDead.deadTick) bestDead = { first, deadTick }; };
        for (let k = 0; k < depth; k++) {
            const next = [];
            for (const node of frontier) expand(node, next, onDead);
            if (next.length === 0) break;
            for (const n of next) {
                // tie-break toward home so equal-clearance paths do not drift into corners
                const hx = (n.w.ship.x - HOME_X) / 256, hy = (n.w.ship.y - HOME_Y) / 256;
                n.key = Math.sqrt(n.score) / 256 - 0.01 * Math.sqrt(hx * hx + hy * hy);
            }
            next.sort((p, q) => q.key - p.key);
            frontier = next.slice(0, beam);
        }
        const firstA = frontier[0].first !== -1 ? frontier[0].first : (bestDead ? bestDead.first : 0);
        return new Array(chunk).fill(firstA);
    }
    planner.stats = stats;
    return planner;
}
