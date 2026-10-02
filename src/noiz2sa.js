/**
 * Noiz2sa's bullet world — Kenta Cho's rules (Noiz2sa 0.52, BSD; see
 * NOTICE.md), ported with the same integer arithmetic: positions in 1/256 px,
 * directions in 1/1024 turns, the 6.28-based sin and atan tables, and the
 * 1024-slot foe array (a new bullet takes the LOWEST free slot, so it moves in
 * the same frame when its slot is after its parent's).
 *
 * One foe runs one pattern. What is left out on purpose: the player's shots
 * (the bot only dodges, so no enemy dies and no bullets are wiped), lives and
 * the invincibility after a respawn (any hit ends the run), and the game's
 * wall-clock slow-down when there are many bullets (it changes real time, not
 * per-frame motion).
 */

import { makeRunner, cloneRunner, runRunner, runnerIsEnd } from './bulletml.js';

export const DIV = 1024;
export const SCAN_WIDTH_8 = 320 << 8;
export const SCAN_HEIGHT_8 = 480 << 8;
const SPD_RATE = 800; // COMMAND_SCREEN_SPD_RATE
const VEL_RATE = 800; // COMMAND_SCREEN_VEL_RATE
const FOE_MAX = 1024;
export const SHIP_HIT_WIDTH = 512 * 512;
export const SHIP_SPEED = 1280;
export const SHIP_SLOW_SPEED = 640;
const SHIP_SLOW_DOWN = 64;
const SHIP_EDGE = 1024 * 3;
export const SPC = { FOE: 0, BOSS_ACTIVE_BULLET: 1, ACTIVE_BULLET: 2, BULLET: 3 };
export const BOSS_TYPE = 3;

// ── degutil.c ──
const tantbl = new Int32Array(DIV + 2);
export const sctbl = new Int32Array(DIV + DIV / 4);
{
    let d = 0;
    const od = 6.28 / DIV;
    for (let i = 0; i < DIV; i++) {
        while (Math.trunc(Math.sin(d * od) / Math.cos(d * od) * DIV) < i) d++;
        tantbl[i] = d;
    }
    tantbl[DIV] = tantbl[DIV + 1] = 128;
    for (let i = 0; i < DIV + DIV / 4; i++) sctbl[i] = Math.trunc(Math.sin(i * (6.28 / DIV)) * 256);
}
const idiv = (a, b) => Math.trunc(a / b);
export function getDeg(x, y) {
    if (x === 0 && y === 0) return 0;
    let tx, ty, f, od, tn;
    if (x < 0) {
        tx = -x;
        if (y < 0) {
            ty = -y;
            if (tx > ty) { f = 1; od = DIV * 3 / 4; tn = idiv(ty * DIV, tx); } else { f = -1; od = DIV; tn = idiv(tx * DIV, ty); }
        } else {
            ty = y;
            if (tx > ty) { f = -1; od = DIV * 3 / 4; tn = idiv(ty * DIV, tx); } else { f = 1; od = DIV / 2; tn = idiv(tx * DIV, ty); }
        }
    } else {
        tx = x;
        if (y < 0) {
            ty = -y;
            if (tx > ty) { f = -1; od = DIV / 4; tn = idiv(ty * DIV, tx); } else { f = 1; od = 0; tn = idiv(tx * DIV, ty); }
        } else {
            ty = y;
            if (tx > ty) { f = 1; od = DIV / 4; tn = idiv(ty * DIV, tx); } else { f = -1; od = DIV / 2; tn = idiv(tx * DIV, ty); }
        }
    }
    return (od + tantbl[tn] * f) & (DIV - 1);
}

// ⚠ Deviation: C indexes sctbl[d] with whatever d a changeDirection left (it is
// not masked, so it can run off the table). Here every lookup wraps d.
const sinD = (d) => sctbl[d & (DIV - 1)];
const cosD = (d) => sctbl[(d & (DIV - 1)) + 256];

// ── seeded $rand (mulberry32), part of the world state ──
function rand01(w) {
    let t = (w.rng = (w.rng + 0x6D2B79F5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// ship.c shipMv
const SHIP_MV = [[0, -256], [181, -181], [256, 0], [181, 181], [0, 256], [-181, 181], [-256, 0], [-181, -181]];
/** Actions: 0..8 = stay, N, NE, E, SE, S, SW, W, NW; +9 = the same with the slow button held. */
export const ACTIONS = 18;
export const actionDir = (a) => (a % 9) - 1; // -1 = stay
export const actionSlow = (a) => a >= 9;

export function createWorld(bml, { seed = 1, rank = 0.5, kind = 'zako', x = null, y = null } = {}) {
    const w = {
        bml, tick: 0, rng: seed | 0, dead: false, deadTick: -1, kind,
        ship: { x: (320 / 2) << 8, y: ((480 / 5) * 4) << 8, speed: SHIP_SPEED },
        foes: new Array(FOE_MAX).fill(null),
    };
    // Spawn as barragemanager.cc does: a zako/middle foe at a random point in the top band
    // (pointing down, speed 0); the boss at (W/2, H/5).
    let fx = x, fy = y;
    if (fx === null) {
        if (kind === 'boss') { fx = SCAN_WIDTH_8 / 2; fy = SCAN_HEIGHT_8 / 5; } else {
            fx = Math.floor(rand01(w) * (SCAN_WIDTH_8 * 2 / 3)) + SCAN_WIDTH_8 / 6;
            fy = Math.floor(rand01(w) * (SCAN_HEIGHT_8 / 6)) + SCAN_HEIGHT_8 / 10;
        }
    }
    const foe = newFoe(fx, fy, rank, 512, 0, SPC.FOE, makeRunner(bml));
    foe.type = kind === 'boss' ? BOSS_TYPE : kind === 'middle' ? 1 : 0;
    w.foes[0] = foe;
    return w;
}

/** A foe or bullet, flat: pos (x,y), previous pos for the hit trail (px,py), last move (mx,my), accel velocity (vx,vy). */
function newFoe(x, y, rank, d, spd, spc, cmd) {
    return { x, y, px: x, py: y, mx: 0, my: 0, vx: 0, vy: 0, rank, d, spd, spc, type: 0, cnt: 0, cmd, removed: false };
}

function addFoe(w, foe) {
    for (let i = 0; i < FOE_MAX; i++) if (!w.foes[i]) { w.foes[i] = foe; return; }
}

export function cloneWorld(w) {
    return {
        ...w,
        ship: { ...w.ship },
        foes: w.foes.map((f) => (f ? { ...f, cmd: f.cmd ? cloneRunner(f.cmd) : null } : null)),
    };
}

/** FoeCommand: the libBulletML virtuals for one foe. */
function hostFor(w, fe) {
    return {
        getBulletDirection: () => (fe.d * 360) / DIV,
        getAimDirection: () => { w.aimed = true; return (getDeg(w.ship.x - fe.x, w.ship.y - fe.y) * 360) / DIV; },
        getBulletSpeed: () => fe.spd / SPD_RATE,
        getDefaultSpeed: () => 1,
        getRank: () => fe.rank,
        getRand: () => rand01(w),
        getTurn: () => w.tick,
        getBulletSpeedX: () => fe.vx / VEL_RATE,
        getBulletSpeedY: () => fe.vy / VEL_RATE,
        createSimpleBullet: (dir, spd) => {
            const d = Math.trunc((dir * DIV) / 360) & (DIV - 1);
            addFoe(w, newFoe(fe.x, fe.y, fe.rank, d, Math.trunc(spd * SPD_RATE), SPC.BULLET, null));
        },
        createBullet: (state, dir, spd) => {
            const d = Math.trunc((dir * DIV) / 360) & (DIV - 1);
            addFoe(w, newFoe(fe.x, fe.y, fe.rank, d, Math.trunc(spd * SPD_RATE), SPC.ACTIVE_BULLET, makeRunner(w.bml, state)));
        },
        doVanish: () => { if (fe.type !== BOSS_TYPE) fe.removed = true; },
        doChangeDirection: (d) => { fe.d = Math.trunc((d * DIV) / 360); },
        doChangeSpeed: (s) => { fe.spd = Math.trunc(s * SPD_RATE); },
        doAccelX: (ax) => { fe.vx = Math.trunc(ax * VEL_RATE); },
        doAccelY: (ay) => { fe.vy = Math.trunc(ay * VEL_RATE); },
    };
}

/** ship.c moveShip, on a ship object alone (the bullets never move the ship). */
export function moveShip(s, action) {
    if (actionSlow(action)) { if (s.speed > SHIP_SLOW_SPEED) s.speed -= SHIP_SLOW_DOWN; } else if (s.speed < SHIP_SPEED) s.speed += SHIP_SLOW_DOWN;
    const sd = actionDir(action);
    if (sd >= 0) {
        s.x += (s.speed * SHIP_MV[sd][0]) >> 8;
        s.y += (s.speed * SHIP_MV[sd][1]) >> 8;
        s.x = Math.min(Math.max(s.x, SHIP_EDGE), SCAN_WIDTH_8 - SHIP_EDGE);
        s.y = Math.min(Math.max(s.y, SHIP_EDGE), SCAN_HEIGHT_8 - SHIP_EDGE);
    }
}

/** The ship-vs-bullet test of moveFoes: the bullet's swept segment (px,py)→(x,y) against a 2 px radius. */
export function segmentHitsShip(px, py, x, y, sx, sy) {
    const bx = x - px, by = y - py;
    const inaa = bx * bx + by * by;
    if (!(inaa > 1)) return false; // ⚠ a bullet that does not move never hits (as in the game)
    const ox = sx - px, oy = sy - py;
    const inab = bx * ox + by * oy;
    const ht = inab / inaa;
    if (!(ht > 0 && ht < 1)) return false;
    const hd = ox * ox + oy * oy - (inab * inab) / inaa / inaa;
    return hd >= 0 && hd < SHIP_HIT_WIDTH;
}

/** One frame: addBullets (nothing — one foe), moveShip, moveFoes; then tick++. Stops at a hit. */
export function step(w, action) {
    if (w.dead) return;
    stepFrame(w, action, null);
}

/**
 * One frame that never stops at a hit (a planner keeps the bullets running to
 * test other ships against them). When `segs` is given, every bullet's hit
 * segment is appended as px,py,x,y — tested in the same order the game tests.
 * `w.aimed` is set when the pattern asked where the ship is this frame.
 */
export function stepFrame(w, action, segs) {
    moveShip(w.ship, action);
    const sx = w.ship.x, sy = w.ship.y;
    for (let i = 0; i < FOE_MAX; i++) {
        const fe = w.foes[i];
        if (!fe) continue;
        if (fe.cmd) {
            if (fe.type === BOSS_TYPE && fe.spc !== SPC.BULLET && runnerIsEnd(fe.cmd)) fe.cmd = makeRunner(w.bml);
            runRunner(fe.cmd, hostFor(w, fe));
            if (fe.removed) { w.foes[i] = null; continue; }
        }
        const mx = ((sinD(fe.d) * fe.spd) >> 8) + fe.vx;
        const my = -((cosD(fe.d) * fe.spd) >> 8) + fe.vy;
        fe.x += mx; fe.y += my;
        fe.mx = mx; fe.my = my;
        const wl = fe.cnt < 4 ? 0 : fe.cnt < 8 ? 1 : 2;
        fe.px = fe.x - mx * (1 << wl);
        fe.py = fe.y - my * (1 << wl);
        fe.cnt++;
        if (fe.spc !== SPC.FOE) {
            if (segs) segs.push(fe.px, fe.py, fe.x, fe.y);
            if (!w.dead && segmentHitsShip(fe.px, fe.py, fe.x, fe.y, sx, sy)) { w.dead = true; w.deadTick = w.tick; }
        }
        if (fe.px < 0 || fe.px >= SCAN_WIDTH_8 || fe.py < 0 || fe.py >= SCAN_HEIGHT_8) w.foes[i] = null;
    }
    w.tick++;
}

/** True when nothing is left that could still fire or hit. */
export function isFinished(w) {
    return w.foes.every((f) => !f);
}

export function bulletCount(w) {
    let n = 0;
    for (const f of w.foes) if (f && f.spc !== SPC.FOE) n++;
    return n;
}
