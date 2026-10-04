/**
 * Slice H1: the observed world model — what a player with perfect eyes and no foresight can predict.
 *
 * `observe(g, tracker)` reads only what is on screen at this frame (and, through the tracker, what was on screen
 * the frame before): every bullet's and enemy's position, its last frame's motion (the drawn trail), its age
 * (how long the trail is drawn), the enemies' shields, the ship's own state (its controls are known exactly) and
 * its shots. It never reads a BulletML runner, a direction or speed register, the game's `rand()`, the stage LCG or
 * the scene timer.
 *
 * `stepModel(m, input, acc)` advances that picture one frame, the way the engine would if nothing new were fired:
 *  - a bullet or an enemy keeps moving as it was seen moving: straight at its last motion, or — with
 *    `motion: 'curve'` (the default) and two frames of history — turning at the rate and changing speed at the
 *    rate it was seen turning / speeding up (a velocity rotated by a fixed angle per frame), or, for a motion that
 *    started from rest, accelerating by the change it was seen making;
 *  - a bullet that has not moved yet (fired this frame, age 0) is a dot: it stays where it is until it is seen
 *    moving — the model does not know where it is going;
 *  - NOTHING NEW appears: no bullet is fired, no enemy arrives, no scene changes;
 *  - the ship, its shots, the shots' hits on enemies, kills, the kill's bullet wipe, invincibility after a hit and
 *    the stars (only when they have a weight) follow the engine's own rules, since all of that is visible or the
 *    bot's own doing;
 *  - the hit test is the engine's exact one (perfect perception): the swept segment from the trail end (pos − mv
 *    × 1/2/4 by age) to the bullet, within 2 px, and only when the ship projects inside it.
 *
 * Arithmetic: +, −, ×, ÷ and sqrt only (all correctly rounded in IEEE 754), so a prediction is the same number in
 * Node and in any browser — the bot stays reproducible and the page plays Node's moves.
 */
import { SPC, BOSS_TYPE, STATUS, FOE_SCAN_SIZE, SCAN_WIDTH_8, SCAN_HEIGHT_8, SHIP_SPEED, SHIP_SLOW_SPEED, segmentHitsShip, vctDist, inputDir, inputFire, inputSlow } from './noiz2sa-game.js';

export const MOTIONS = ['curve', 'straight'];
const SHOT_SPEED = 4096, SHOT_MAX = 16, SHOT_INTERVAL = 3, SHOT_SCAN_HEIGHT = 3072;
const SHIP_SLOW_DOWN = 64, SHIP_INVINCIBLE_CNT_BASE = 240, EDGE = 1024 * 3;
const BULLET_WIPE_WIDTH = 7200, BONUS_MAX = 256, BONUS_SPEED = 400, BONUS_INHALE_WIDTH = 24000, BONUS_ACQUIRE_WIDTH = 8000;
const SHIP_MV = [[0, -256], [181, -181], [256, 0], [181, 181], [0, 256], [-181, 181], [-256, 0], [-181, -181]];
// a turn is fitted only between two motions at least this fast (1/256 px per frame); slower ones: a constant change
const MIN_TURN_SPEED = 32;
const STRAIGHT = 0, TURN = 1, ACCEL = 2;

/** what the observer remembers of the previous frame: each slot's position and motion */
export function newTracker(slots = 1024) {
    return { frame: -2, x: new Float64Array(slots), y: new Float64Array(slots), mx: new Float64Array(slots), my: new Float64Array(slots), ok: new Uint8Array(slots) };
}

/**
 * The picture at g's frame. An object counts as "seen last frame" when its slot held something at the position
 * it must have come from (pos − its motion) — the continuity a player sees, not an object identity.
 * stats (optional) counts {objects, turning, accel, unseen}.
 */
export function observe(g, tracker, { motion = 'curve', stars = false } = {}, stats = null) {
    const foes = [];
    const tr = tracker, cont = tr.frame === g.frame - 1;
    for (let i = 0; i < g.foes.length; i++) {
        const f = g.foes[i];
        if (!f || f.spc === SPC.NOT_EXIST) { tr.ok[i] = 0; continue; }
        const o = { slot: i, spc: f.spc, type: f.type, shield: f.shield, x: f.x, y: f.y, px: f.px, py: f.py, mx: 0, my: 0, cnt: f.cnt, k: STRAIGHT, sp: 0, c: 1, s: 0, ds: 0, ax: 0, ay: 0 };
        if (f.cnt > 0) {
            o.mx = f.mx; o.my = f.my;
            if (motion === 'curve' && cont && tr.ok[i] && tr.x[i] === f.x - f.mx && tr.y[i] === f.y - f.my) {
                const pmx = tr.mx[i], pmy = tr.my[i];
                if (pmx !== f.mx || pmy !== f.my) {
                    const s1 = Math.sqrt(pmx * pmx + pmy * pmy), s2 = Math.sqrt(f.mx * f.mx + f.my * f.my);
                    if (s1 >= MIN_TURN_SPEED && s2 >= MIN_TURN_SPEED) {
                        o.k = TURN; o.sp = s2; o.ds = s2 - s1;
                        o.c = (pmx * f.mx + pmy * f.my) / (s1 * s2);
                        o.s = (pmx * f.my - pmy * f.mx) / (s1 * s2);
                        if (stats) stats.turning++;
                    } else { o.k = ACCEL; o.ax = f.mx - pmx; o.ay = f.my - pmy; if (stats) stats.accel++; }
                }
            }
            tr.x[i] = f.x; tr.y[i] = f.y; tr.mx[i] = f.mx; tr.my[i] = f.my; tr.ok[i] = 1;
        } else {
            // a dot that has not moved: where it goes is not on screen yet (and its mv register is stale)
            o.px = f.x; o.py = f.y;
            tr.ok[i] = 0;
            if (stats) stats.unseen++;
        }
        foes.push(o);
    }
    tr.frame = g.frame;
    if (stats) stats.objects += foes.length;
    const s = g.ship;
    const m = {
        model: true, frame: g.frame, status: g.status, scene: g.scene, endless: g.endless, left: g.left,
        ship: { x: s.x, y: s.y, speed: s.speed, shotCnt: s.shotCnt, invCnt: s.invCnt },
        shots: [], foes, bonuses: null, bonusScore: g.bonusScore,
    };
    for (const st of g.shots) if (st) m.shots.push({ x: st.x, y: st.y });
    if (stars) { m.bonuses = []; for (const b of g.bonuses) if (b) m.bonuses.push({ x: b.x, y: b.y, vx: b.vx, vy: b.vy, down: b.down }); }
    return m;
}

const cloneObj = (o) => ({ slot: o.slot, spc: o.spc, type: o.type, shield: o.shield, x: o.x, y: o.y, px: o.px, py: o.py, mx: o.mx, my: o.my, cnt: o.cnt, k: o.k, sp: o.sp, c: o.c, s: o.s, ds: o.ds, ax: o.ax, ay: o.ay });
export function cloneModel(m) {
    const foes = new Array(m.foes.length);
    for (let i = 0; i < foes.length; i++) foes[i] = cloneObj(m.foes[i]);
    return {
        model: true, frame: m.frame, status: m.status, scene: m.scene, endless: m.endless, left: m.left,
        ship: { ...m.ship }, shots: m.shots.map((s) => ({ x: s.x, y: s.y })), foes,
        bonuses: m.bonuses && m.bonuses.map((b) => ({ ...b })), bonusScore: m.bonusScore,
    };
}

function addBonus(m, x, y, vx, vy) {
    if (m.bonuses && m.bonuses.length < BONUS_MAX) m.bonuses.push({ x, y, vx, vy, down: 1 });
}

/**
 * The safety margin (slice H1b; the H2 "perceived bullet size" knob reuses it), in px:
 *  - `bullet`: the clearance kept from a bullet's DRAWN trail (the segment from its trail end to its head, ends
 *    included), where the engine only hits within 2 px of the segment's inside;
 *  - `spawner`: the clearance kept from whatever can fire a bullet next frame — an enemy, an active (bullet-firing)
 *    bullet, and a dot not yet moving (where it goes is not on screen yet). A new bullet appears at its spawner and
 *    moves in that same frame, so it cannot be seen before it hits: only distance protects from it;
 *  - `top`: the line (px from the top) the ship stays below. Enemies appear at random in a band near the top of the
 *    screen (48–128 px down) and may fire at once: a ship inside that band can have one appear on top of it.
 * `makeMargin({bullet, spawner, top})` → the form stepModel takes (squared radii in 1/256 px), or null for none.
 */
export function makeMargin(mg) {
    if (!mg || !(mg.bullet > 0 || mg.spawner > 0 || mg.top > 0)) return null;
    const rb = Math.max(0, mg.bullet || 0) * 256, rs = Math.max(0, mg.spawner || 0) * 256;
    return { rb, rs, b2: rb * rb, s2: rs * rs, box: Math.max(rb, rs), top: Math.max(0, mg.top || 0) * 256 };
}

/** squared distance from (sx, sy) to the segment (px, py)–(x, y), ends included */
function segDist2(px, py, x, y, sx, sy) {
    const bx = x - px, by = y - py, ox = sx - px, oy = sy - py;
    const l2 = bx * bx + by * by;
    let t = l2 > 0 ? (ox * bx + oy * by) / l2 : 0;
    if (t < 0) t = 0; else if (t > 1) t = 1;
    const dx = ox - t * bx, dy = oy - t * by;
    return dx * dx + dy * dy;
}

/**
 * One predicted frame with the ship's input `b`. Returns true when the ship is hit (an effective hit: not while
 * invincible). acc.value gains what the bot values (as the engine's events would give it): a kill 4 + 4 × type,
 * a damaging hit 1, a star starWeight × its score. With a `margin` (makeMargin), m.near tells whether the ship
 * came inside it this frame (not while invincible); without one m.near stays false.
 */
export function stepModel(m, b, acc = null, starWeight = 0, margin = null) {
    m.near = false;
    if (m.status !== STATUS.IN_GAME) { m.frame++; return false; }
    const ship = m.ship;
    // shots (moveShots), then the ship (moveShip)
    if (m.shots.length) {
        let n = 0;
        for (const st of m.shots) { st.y -= SHOT_SPEED; if (st.y >= 0) m.shots[n++] = st; }
        m.shots.length = n;
    }
    const sd = inputDir(b) - 1;
    if (inputFire(b) && ship.shotCnt < 0) {
        if (m.shots.length < SHOT_MAX) m.shots.push({ x: ship.x, y: ship.y });
        ship.shotCnt = SHOT_INTERVAL;
    }
    ship.shotCnt--;
    if (inputSlow(b)) { if (ship.speed > SHIP_SLOW_SPEED) ship.speed -= SHIP_SLOW_DOWN; } else if (ship.speed < SHIP_SPEED) ship.speed += SHIP_SLOW_DOWN;
    if (sd >= 0) {
        ship.x += (ship.speed * SHIP_MV[sd][0]) >> 8;
        ship.y += (ship.speed * SHIP_MV[sd][1]) >> 8;
        if (ship.x < EDGE) ship.x = EDGE; else if (ship.x > SCAN_WIDTH_8 - EDGE) ship.x = SCAN_WIDTH_8 - EDGE;
        if (ship.y < EDGE) ship.y = EDGE; else if (ship.y > SCAN_HEIGHT_8 - EDGE) ship.y = SCAN_HEIGHT_8 - EDGE;
    }
    if (ship.invCnt > 0) ship.invCnt--;
    // the objects (moveFoes), as seen moving
    let hit = false, removed = false, near = !!margin && ship.y < margin.top && ship.invCnt <= 0;
    const sx = ship.x, sy = ship.y, foes = m.foes;
    for (let i = 0; i < foes.length; i++) {
        const o = foes[i];
        if (o.spc < 0) continue; // removed this frame (a wipe, a kill)
        const isFoe = o.spc === SPC.FOE;
        if (o.cnt > 0) {
            if (o.k === TURN) {
                const vx = o.c * o.mx - o.s * o.my, vy = o.s * o.mx + o.c * o.my;
                let sp = o.sp + o.ds;
                if (sp < 0) sp = 0;
                const r = o.sp > 0 ? sp / o.sp : 0;
                o.mx = vx * r; o.my = vy * r; o.sp = sp;
            } else if (o.k === ACCEL) { o.mx += o.ax; o.my += o.ay; }
            o.x += o.mx; o.y += o.my;
            const wl = o.cnt < 4 ? 1 : o.cnt < 8 ? 2 : 4;
            o.px = o.x - o.mx * wl; o.py = o.y - o.my * wl;
            o.cnt++;
        }
        if (isFoe) {
            const ss = FOE_SCAN_SIZE[o.type];
            for (let j = 0; j < m.shots.length; j++) {
                const st = m.shots[j];
                if (!st || Math.abs(o.x - st.x) >= ss || Math.abs(o.y - st.y) >= ss + SHOT_SCAN_HEIGHT) continue;
                m.shots[j] = null; removed = true;
                o.shield--;
                if (o.shield <= 0) {
                    if (acc) acc.value += 4 + o.type * 4;
                    const w = BULLET_WIPE_WIDTH * (o.type + 1);
                    for (const q of foes) {
                        if (q.spc !== SPC.ACTIVE_BULLET && q.spc !== SPC.BULLET) continue;
                        if (vctDist(o.x, o.y, q.x, q.y) < w) { addBonus(m, q.x, q.y, q.mx, q.my); q.spc = -1; }
                    }
                    if (o.type === BOSS_TYPE) {
                        for (const q of foes) q.spc = -1;
                        if (!m.endless) m.status = STATUS.STAGE_CLEAR;
                    }
                    o.spc = -1;
                    break;
                } else if (acc) acc.value += 1;
            }
        }
        if (margin && !near && ship.invCnt <= 0 && o.spc >= 0) {
            // the margin: the drawn trail of a moving bullet; the position of a spawner (an enemy, an active bullet,
            // a dot not yet moving)
            const bx = margin.box;
            if (sx > Math.min(o.px, o.x) - bx && sx < Math.max(o.px, o.x) + bx && sy > Math.min(o.py, o.y) - bx && sy < Math.max(o.py, o.y) + bx) {
                if (!isFoe && o.cnt > 0 && margin.b2 > 0 && segDist2(o.px, o.py, o.x, o.y, sx, sy) < margin.b2) near = true;
                else if ((o.spc !== SPC.BULLET || o.cnt === 0) && margin.s2 > 0) {
                    const dx = o.x - sx, dy = o.y - sy;
                    if (dx * dx + dy * dy < margin.s2) near = true;
                }
            }
        }
        if (!isFoe && o.cnt > 0) {
            // the engine's test, on the predicted segment (a dot that has not moved never hits)
            if (sx > Math.min(o.px, o.x) - 4096 && sx < Math.max(o.px, o.x) + 4096 && sy > Math.min(o.py, o.y) - 4096 && sy < Math.max(o.py, o.y) + 4096
                && segmentHitsShip(o.px, o.py, o.x, o.y, sx, sy) && ship.invCnt <= 0) {
                hit = true;
                m.left--;
                if (m.left < 0) m.status = STATUS.GAMEOVER;
                else {
                    ship.invCnt = Math.max(0, Math.trunc(SHIP_INVINCIBLE_CNT_BASE * (100 - m.scene) / 100));
                    for (const q of foes) if (q.type !== BOSS_TYPE && q.spc !== SPC.BOSS_ACTIVE_BULLET) q.spc = -1;
                }
            }
        }
        if (o.spc >= 0 && (o.px < 0 || o.px >= SCAN_WIDTH_8 || o.py < 0 || o.py >= SCAN_HEIGHT_8)) o.spc = -1;
        if (o.spc < 0) removed = true;
    }
    if (removed) {
        m.foes = foes.filter((o) => o.spc >= 0);
        m.shots = m.shots.filter((s) => s);
    }
    if (m.bonuses && m.bonuses.length) moveBonuses(m, acc, starWeight);
    m.near = near && !hit;
    m.frame++;
    return hit;
}

function moveBonuses(m, acc, starWeight) {
    const ship = m.ship;
    let n = 0;
    for (const bn of m.bonuses) {
        bn.x += bn.vx; bn.y += bn.vy;
        bn.vx -= bn.vx >> 6;
        if (bn.x < SCAN_WIDTH_8 / 8) { bn.x = SCAN_WIDTH_8 / 8; if (bn.vx < 0) bn.vx = -bn.vx; } else if (bn.x > (SCAN_WIDTH_8 / 8) * 7) {
            bn.x = (SCAN_WIDTH_8 / 8) * 7; if (bn.vx > 0) bn.vx = -bn.vx;
        }
        if (bn.down) {
            bn.vy += (BONUS_SPEED - bn.vy) >> 6;
            if (bn.y > SCAN_HEIGHT_8) { bn.down = 0; bn.y = SCAN_HEIGHT_8; bn.vy = -bn.vy; }
        } else {
            bn.vy += (-BONUS_SPEED - bn.vy) >> 6;
            if (bn.y < 0) { m.bonusScore = Math.max(10, Math.trunc(m.bonusScore / 20) * 10); continue; }
        }
        const d = vctDist(ship.x, ship.y, bn.x, bn.y);
        if (d < BONUS_ACQUIRE_WIDTH) {
            if (acc) acc.value += starWeight * m.bonusScore;
            if (m.bonusScore < 1000) m.bonusScore += 10;
            continue;
        } else if (d < BONUS_INHALE_WIDTH) {
            bn.vx += Math.floor(((ship.x - bn.x) * (BONUS_INHALE_WIDTH - d)) / 1048576);
            bn.vy += Math.floor(((ship.y - bn.y) * (BONUS_INHALE_WIDTH - d)) / 1048576);
        }
        m.bonuses[n++] = bn;
    }
    m.bonuses.length = n;
}
