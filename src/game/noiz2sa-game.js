/**
 * The whole of Noiz2sa's game logic (0.52, Kenta Cho, BSD; see NOTICE.md),
 * ported to run headless and deterministic, one call per frame.
 *
 * Kept exactly as the C does it:
 *  - integer positions in 1/256 px, 1024-step angles, the 6.28-based tables;
 *  - the fixed-size pools (foes 1024, shots 16, stars 256, fragments 64), each
 *    filled at the LOWEST free slot (the C's getNext* loops index by i);
 *  - two random generators: the stage LCG (`rand.c`) that builds every stage,
 *    and C's rand() (glibc, `crand.js`) shared by `$rand` and the explosion
 *    fragments — so fragment spawning is simulated (slot use + rand calls)
 *    although nothing draws it;
 *  - float32 where the C uses float (level, maxRank arithmetic);
 *  - the C's quirks, e.g. several shots in one frame each score a kill on a
 *    dying enemy, and a bullet that does not move never hits.
 *
 * Not ported: drawing, sound, the title-screen demo, the high-score file, the
 * wall-clock slow-down. A game starts at initGame(stage) and ends when the C
 * would return to the title (after stage clear or game over).
 *
 * The whole state is plain data; `cloneGame` copies it for look-ahead search.
 */

import { makeRunner, cloneRunner, runRunner, runnerIsEndLib } from '../bulletml.js';
import { newCRand, crand, cloneCRand, RAND_MAX } from './crand.js';

// ── constants (screen.h, foe.cc, ship.c, shot.h, bonus.c, barragemanager.cc, attractmanager.*) ──
export const DIV = 1024;
const SCAN_WIDTH = 320, SCAN_HEIGHT = 480, LAYER_WIDTH = 320, LAYER_HEIGHT = 480;
export const SCAN_WIDTH_8 = SCAN_WIDTH << 8, SCAN_HEIGHT_8 = SCAN_HEIGHT << 8;
const FOE_MAX = 1024, SHOT_MAX = 16, BONUS_MAX = 256, FRAG_MAX = 64;
const SPD_RATE = 800, VEL_RATE = 800;
export const SPC = { NOT_EXIST: -1, FOE: 0, BOSS_ACTIVE_BULLET: 1, ACTIVE_BULLET: 2, BULLET: 3 };
export const BOSS_TYPE = 3;
export const STATUS = { IN_GAME: 1, GAMEOVER: 2, STAGE_CLEAR: 3, TITLE: 0 };
const SHIP_HIT_WIDTH = 512 * 512;
/**
 * The hit test (slice HB): 'original' = the C's (segmentHitsShip: near the TAIL of the drawn trail, see there), the
 * default, which the native build verifies; 'centered' = 2 px around the bullet's position, swept from where it was
 * the frame before (centeredHitsShip, PARSEC47-style).
 */
export const HITBOXES = ['original', 'centered'];
export const SHIP_SPEED = 1280, SHIP_SLOW_SPEED = 640;
const SHIP_SLOW_DOWN = 64, SHIP_INVINCIBLE_CNT_BASE = 240, SHOT_INTERVAL = 3;
const SHIP_SCAN_WIDTH = 1024, SHIP_SCREEN_EDGE_WIDTH = 3;
const SHOT_SPEED = 4096, SHOT_HEIGHT = 24;
const SHOT_SCAN_HEIGHT = Math.trunc(SHOT_HEIGHT * 256 * SCAN_HEIGHT / LAYER_HEIGHT / 2);
const FOE_SIZE = [30, 40, 56, 96];
export const FOE_SCAN_SIZE = FOE_SIZE.map((s) => Math.trunc(Math.trunc(Math.trunc(s * 256 * SCAN_WIDTH / LAYER_WIDTH) / 4) * 3));
const ENEMY_SCORE = [500, 1000, 5000, 50000];
const BULLET_WIPE_WIDTH = 7200;
const BONUS_SPEED = 400, BONUS_INHALE_WIDTH = 24000, BONUS_ACQUIRE_WIDTH = 8000;
const BARRAGE_TYPE_NUM = 3, BARRAGE_MAX = 16;
const SCENE_TERM = 1000, SCENE_END_TERM = 100, ZAKO_APP_TERM = 1500;
const APP_FREQ = [90, 360, 800], SHIELD = [3, 6, 9], BOSS_SHIELD = 128;
export const STAGE_NUM = 10, ENDLESS_STAGE_NUM = 4;
const f32 = Math.fround;
// integer screen fractions, as the C's int arithmetic gives them
const W8_2_3 = Math.trunc((SCAN_WIDTH_8 * 2) / 3), W8_6 = Math.trunc(SCAN_WIDTH_8 / 6);
const H8_6 = Math.trunc(SCAN_HEIGHT_8 / 6), H8_10 = Math.trunc(SCAN_HEIGHT_8 / 10);
// noiz2sa.c stagePrm: {seed, start level, level increment}; seeds < 0 are the endless modes
const STAGE_PRM = [
    [13, 0.5, 0.12], [2, 1.8, 0.15], [3, 3.2, 0.1], [90, 6.0, 0.3], [5, 5.0, 0.6],
    [6, 10.0, 0.6], [7, 5.0, 2.2], [98, 12.0, 1.5], [9, 10.0, 2.0], [79, 21.0, 1.5],
    [-3, 5.0, 0.7], [-1, 10.0, 1.2], [-4, 15.0, 1.8], [-2, 16.0, 1.8],
].map(([s, l, i]) => [s, f32(l), f32(i)]);
export const STAGE_NAMES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'ENDLESS', 'HARD', 'EXTREME', 'INSANE'];

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
// ⚠ The C indexes sctbl[d] with an unmasked d after a changeDirection; here every lookup wraps.
const sinD = (d) => sctbl[d & (DIV - 1)];
const cosD = (d) => sctbl[(d & (DIV - 1)) + 256];
const absN = (a) => (a < 0 ? -a : a);
export function vctDist(ax0, ay0, bx0, by0) {
    const ax = absN(ax0 - bx0), ay = absN(ay0 - by0);
    return ax > ay ? ax + (ay >> 1) : ay + (ax >> 1);
}
// rand.c — the stage LCG, on an unsigned 32-bit word
const nextRandInt = (g) => (g.rnd = (Math.imul(g.rnd, 8513) + 179) >>> 0);

// ── input: one byte per frame ──
/** dir: 0 = none, 1..8 = N, NE, E, SE, S, SW, W, NW (ship.c's sd + 1). */
export const input = (dir, fire, slow) => dir | (fire ? 16 : 0) | (slow ? 32 : 0);
export const inputDir = (b) => b & 15;
export const inputFire = (b) => (b & 16) !== 0;
export const inputSlow = (b) => (b & 32) !== 0;

// ── the game ──
/**
 * `patterns` = {zako: [bml…], middle: [bml…], boss: [bml…]} in the order the C reads them (we sort by
 * file name, and so does our native build). `seed` seeds C's rand() (the game uses SDL_GetTicks);
 * `endlessSeed` seeds the endless modes' stage LCG (the game uses SDL_GetTicks there too).
 */
/**
 * A new game of `stage` (0–9 the stages 1–10, 10–13 the endless modes). `startScene` (slice N0): start in the middle
 * of the stage, at the scene numbered `startScene` (g.scene's value while it plays: 0–8 the ordinary scenes, 9 the
 * boss). Not in the original game: see skipToScene. 0 (the default) is the game exactly as the C plays it.
 */
export function newGame(patterns, stage, { seed = 1, endlessSeed = 1, hitbox = 'original', startScene = 0 } = {}) {
    if (!HITBOXES.includes(hitbox)) throw new Error(`unknown hitbox "${hitbox}" (have: ${HITBOXES.join(', ')})`);
    const lists = [patterns.zako, patterns.middle, patterns.boss];
    const g = {
        lists, stage, hitbox, tick: 0, status: STATUS.IN_GAME, frame: 0,
        rand: newCRand(seed),
        rnd: 0,
        // barragePattern[type][i] records; barrageQueue[type] = indices into them; barrage[] = {type, idx}
        bp: lists.map((l, type) => l.map((bml, i) => ({ type, i, maxRank: 0, rank: 0, frq: 0 }))),
        bq: lists.map((l) => l.map((_, i) => i)),
        barrage: [], barrageNum: 0, bossMode: 0, pax: 0, pay: 0, quickAppType: 0,
        scene: 0, sceneCnt: 0, startScene: 0, level: 0, levelInc: 0, endless: 0, insane: 0, zakoAppCnt: 0,
        foes: new Array(FOE_MAX).fill(null), enNum: [0, 0, 0, 0],
        shots: new Array(SHOT_MAX).fill(null),
        bonuses: new Array(BONUS_MAX).fill(null), bonusScore: 10,
        frags: new Int32Array(FRAG_MAX),
        slotMv: new Int32Array(FOE_MAX * 2), // each foe slot's last mv; a new occupant inherits it (see placeFoe)
        ship: null,
        score: 0, nextExtend: 200000, neAdd: 300000, left: 2, ssSc: 0, sceneScores: [],
        endCnt: 0, mnp: 0,
        // per-frame: ['kill', type, score] ['hit'] ['star', score] ['lostStar'] ['extend'] ['clear'] ['gameover'];
        // for sound only: ['shot'] ['damage', type] (a hit that does not kill)
        events: [],
    };
    // initGame: initShip (scene is 0 here, as after the title), then initBarrages, initGameState
    g.ship = { x: (SCAN_WIDTH / 2) << 8, y: Math.trunc(SCAN_HEIGHT / 5 * 4) << 8, cnt: 0, shotCnt: -1, speed: SHIP_SPEED, invCnt: 0 };
    g.ship.invCnt = Math.max(0, idiv(SHIP_INVINCIBLE_CNT_BASE * (100 - g.scene), 100));
    const [s, startLevel, li] = STAGE_PRM[stage];
    initBarrages(g, s, startLevel, li, endlessSeed);
    if (startScene) skipToScene(g, startScene);
    return g;
}

/** the last scene a game may start at: the boss scene (setBarrages counts the scene up as it starts one) */
export const LAST_START_SCENE = 9;
let skippingScenes = false; // set only inside skipToScene: addFoe places nothing
/**
 * Slice N0: start a game at scene k without playing the scenes before it. Which patterns a scene gets (setBarrages)
 * and when and where its foes appear (addBullets) come only from the stage LCG g.rnd, and play never touches it: its
 * draws in a frame depend only on the frame and the scene's barrages. And every scene starts on an empty field
 * (addBullets' clearFoes at the boundary). So running addBullets for the skipped scenes with no foe placed leaves the
 * stage LCG, the barrage queues and ranks, the level and the scene counter exactly as a played game has them on the
 * frame before scene k starts (test/game.test.mjs checks it on every stage). What a played game would also carry
 * into scene k is NOT reproduced, because it depends on how the scenes were played: C rand() (the game's seed, as at a
 * stage start), the ship (where a new game puts it, with a new game's invincibility), score, lives and stars (none).
 * A boss scene cannot be skipped: when it ends depends on the kill.
 */
function skipToScene(g, k) {
    if (!Number.isInteger(k) || k < 0 || k > LAST_START_SCENE) throw new Error(`startScene must be an integer 0–${LAST_START_SCENE} (got ${k})`);
    skippingScenes = true;
    try {
        while (!(g.scene === k - 1 && g.sceneCnt === 0)) addBullets(g);
    } finally { skippingScenes = false; }
    g.sceneScores = []; g.ssSc = 0;
    g.startScene = k;
}

function initBarrages(g, seed, startLevel, li, endlessSeed) {
    for (let t = 0; t < BARRAGE_TYPE_NUM; t++) g.bq[t] = g.lists[t].map((_, i) => i);
    if (seed >= 0) { g.rnd = seed >>> 0; g.endless = 0; g.insane = 0; } else {
        g.rnd = endlessSeed >>> 0; g.endless = 1; g.insane = seed === -2 ? 1 : 0;
    }
    for (let t = 0; t < BARRAGE_TYPE_NUM; t++) {
        const bn = g.lists[t].length;
        const q = g.bq[t];
        const rn = 60 + (nextRandInt(g) % 4);
        for (let j = 0; j < rn; j++) {
            const n1 = nextRandInt(g) % bn, n2 = nextRandInt(g) % bn;
            const tb = q[n1]; q[n1] = q[n2]; q[n2] = tb;
        }
        for (let j = 0; j < bn; j++) {
            const b = g.bp[t][q[j]];
            b.maxRank = f32(f32(f32(nextRandInt(g) % 70) / 100) + f32(0.3)); // (float)(x)/100 + 0.3f
            b.frq = 1;
        }
    }
    g.scene = -1;
    g.sceneCnt = 0;
    g.level = startLevel;
    g.levelInc = li;
}

function rollBarragePattern(g, t) {
    const br = g.bq[t], brNum = br.length;
    const r = f32(f32(nextRandInt(g) % 32) / 32);
    let n = Math.trunc(f32(f32(f32(brNum) / f32(r + 1)) + 0.5));
    if (n === 0) return;
    if (n > brNum) n = brNum;
    const tbr = br[0];
    for (let i = 0; i < n - 1; i++) br[i] = br[i + 1];
    br[n - 1] = tbr;
    const b = g.bp[t][br[0]];
    b.maxRank *= 2;
    while (b.maxRank > 1) b.maxRank -= f32(0.7);
}

function setBarrages(g, levelIn, bm, midMode) {
    let level = levelIn; // the C's parameter shadows the global
    let bpn, bn, addFrqLoop = 0;
    g.barrageNum = 0;
    const barrageMax = (nextRandInt(g) % 3) + 4;
    g.bossMode = bm;
    bpn = midMode ? 1 : 0;
    g.quickAppType = bpn;
    for (bn = 0; ; bn++) {
        if (bn === 0 && level < 0) break;
        if (g.bossMode) {
            bpn = bn === 0 ? 0 : 2;
            if (bn >= BARRAGE_MAX) break;
        } else if (bn >= barrageMax) {
            bn = 0;
            addFrqLoop = 1;
        }
        if (addFrqLoop) {
            const b = g.barrage[bn];
            b.frq++;
            level = f32(level - (1 + b.rank));
            if (level < 0) break;
        } else {
            g.barrageNum++;
            rollBarragePattern(g, bpn);
            const head = g.bp[bpn][g.bq[bpn][0]];
            g.barrage[bn] = head;
            head.frq = 1;
            if (level < head.maxRank) {
                if (level < 0) level = 0;
                head.rank = level;
                if (!g.bossMode || bn > 0) break;
            }
            head.rank = head.maxRank;
            if (!g.bossMode) {
                level = f32(level - (1 + head.maxRank));
            } else if (bn > 0) {
                level = f32(level - (4 + head.maxRank * 6));
            }
        }
        bpn++;
        if (bpn >= BARRAGE_TYPE_NUM) bpn = midMode ? 1 : 0;
    }
    g.pax = (nextRandInt(g) % W8_2_3) + W8_6;
    g.pay = (nextRandInt(g) % H8_6) + H8_10;
    g.scene++;
}

// ── C's rand() helpers (noiz2sa.h) ──
const randN = (g, n) => crand(g.rand) % n;
const randNS = (g, n) => (crand(g.rand) % (n << 1)) - n;

// ── frag.c: only what affects the game — slot use and rand() calls ──
function addFrag(g, spc, size) {
    const fr = g.frags;
    let i;
    for (i = 0; i < FRAG_MAX; i++) if (fr[i] <= 0) break;
    if (i >= FRAG_MAX) return;
    if (spc === 0) { randN(g, 10); randN(g, 10); fr[i] = 4 + randN(g, 8); } else if (spc === 1) {
        randN(g, size * 3); randN(g, size * 3); fr[i] = 12 + randN(g, 12);
    } else { fr[i] = 10 + randN(g, 4); }
}
function addShotFrag(g) {
    randNS(g, SHOT_SPEED >> 11); randNS(g, SHOT_SPEED >> 11);
    addFrag(g, 0, 0);
}
function addEnemyFrag(g, type) {
    const t = type * 2 + 1;
    for (let i = 0; i < t + randN(g, t * 2); i++) { randNS(g, 16); randNS(g, 16); addFrag(g, 0, 0); }
    for (let i = 0; i < t * 2 + randN(g, t); i++) { randNS(g, 3); randNS(g, 3); addFrag(g, 1, 2 + t); }
}
function addShipFrag(g) {
    for (let i = 0; i < 48; i++) { randNS(g, 24); randNS(g, 24); addFrag(g, 0, 0); }
    for (let i = 0; i < 32; i++) { randNS(g, 4); randNS(g, 4); const size = 1 + randN(g, 6); addFrag(g, 1, size); }
}
const addClearFrag = (g) => addFrag(g, 2, 0);
function moveFrags(g) {
    const fr = g.frags;
    for (let i = 0; i < FRAG_MAX; i++) if (fr[i] > 0) fr[i]--;
}

// ── foe.cc ──
function newFoe(x, y, rank, d, spd, spc, type, shield, cmd, bml = null) {
    return { x, y, px: x, py: y, mx: 0, my: 0, vx: 0, vy: 0, rank, d, spd, spc, type, shield, cnt: 0, hit: 0, cmd, bml };
}
/**
 * Put a new foe in slot i. The C never resets `mv` when it reuses a slot, so until the new occupant first
 * moves, its mv is the previous occupant's last one — and a bullet wiped before its first move (created
 * this frame) leaves a star with that stale velocity. Found by the G2 comparison.
 */
function placeFoe(g, i, fe) {
    fe.mx = g.slotMv[2 * i]; fe.my = g.slotMv[2 * i + 1];
    g.foes[i] = fe;
}
function freeFoeSlot(g) {
    for (let i = 0; i < FOE_MAX; i++) if (!g.foes[i]) return i;
    return -1;
}
function addFoe(g, x, y, rank, d, spd, type, shield, bml) {
    if (skippingScenes) return -1;
    const i = freeFoeSlot(g);
    if (i < 0) return -1;
    placeFoe(g, i, newFoe(x, y, rank, d, spd, SPC.FOE, type, shield, makeRunner(bml), bml));
    g.enNum[type]++;
    return i;
}
function addFoeBossActiveBullet(g, x, y, rank, d, spd, bml) {
    const i = addFoe(g, x, y, rank, d, spd, BOSS_TYPE, 0, bml);
    if (i < 0) return;
    g.enNum[BOSS_TYPE]--;
    g.foes[i].spc = SPC.BOSS_ACTIVE_BULLET;
}
function removeFoeSlot(g, i) {
    const fe = g.foes[i];
    if (fe && fe.spc === SPC.FOE) g.enNum[fe.type]--;
    g.foes[i] = null;
}

/**
 * The runner's view of its foe is the C's `Foe *`: a pointer to SLOT i, not to an object. `<vanish>` frees
 * the slot at once (removeFoe only marks it NOT_EXIST), so a bullet fired later in the same run can take
 * that very slot, and from then on the still-running command reads and writes the new occupant. Until
 * then the vanished foe's fields are still there to read (fe0). Found by the G2 comparison.
 */
// one host object for every run (runs are synchronous and never nested), pointed at the foe before each run:
// allocating the 15 callbacks per foe per frame was a large part of a frame's cost (slice P1)
const H = { g: null, fe0: null, slot: 0 };
const F = () => H.g.foes[H.slot] || H.fe0;
const HOST = {
    getBulletDirection: () => (F().d * 360) / DIV,
    getAimDirection: () => { const g = H.g, fe = F(); g.aimed = true; return (getDeg(g.ship.x - fe.x, g.ship.y - fe.y) * 360) / DIV; },
    getBulletSpeed: () => F().spd / SPD_RATE,
    getDefaultSpeed: () => 1,
    getRank: () => F().rank,
    getRand: () => crand(H.g.rand) / RAND_MAX,
    getTurn: () => H.g.tick,
    getBulletSpeedX: () => F().vx / VEL_RATE,
    getBulletSpeedY: () => F().vy / VEL_RATE,
    createSimpleBullet: (dir, spd) => {
        const g = H.g, fe = F();
        const d = Math.trunc((dir * DIV) / 360) & (DIV - 1);
        const i = freeFoeSlot(g);
        if (i >= 0) placeFoe(g, i, newFoe(fe.x, fe.y, fe.rank, d, Math.trunc(spd * SPD_RATE), SPC.BULLET, 0, 0, null));
    },
    createBullet: (state, dir, spd) => {
        const g = H.g, fe = F();
        const d = Math.trunc((dir * DIV) / 360) & (DIV - 1);
        const i = freeFoeSlot(g);
        if (i >= 0) placeFoe(g, i, newFoe(fe.x, fe.y, fe.rank, d, Math.trunc(spd * SPD_RATE), SPC.ACTIVE_BULLET, 0, 0, makeRunner(state.bml, state)));
    },
    doVanish: () => {
        const g = H.g, fe = F();
        if (fe.type === BOSS_TYPE) return;
        if (fe.spc === SPC.FOE) g.enNum[fe.type]--;
        fe.spc = SPC.NOT_EXIST;
        if (g.foes[H.slot] === fe) g.foes[H.slot] = null; // the slot is free from now on
    },
    doChangeDirection: (d) => { F().d = Math.trunc((d * DIV) / 360); },
    doChangeSpeed: (s) => { F().spd = Math.trunc(s * SPD_RATE); },
    doAccelX: (ax) => { F().vx = Math.trunc(ax * VEL_RATE); },
    doAccelY: (ay) => { F().vy = Math.trunc(ay * VEL_RATE); },
};
function hostFor(g, fe0, slot) {
    H.g = g; H.fe0 = fe0; H.slot = slot;
    return HOST;
}

function wipeBullets(g, x, y, width) {
    for (let i = 0; i < FOE_MAX; i++) {
        const fe = g.foes[i];
        if (!fe || (fe.spc !== SPC.ACTIVE_BULLET && fe.spc !== SPC.BULLET)) continue;
        if (vctDist(x, y, fe.x, fe.y) < width) {
            addBonus(g, fe.x, fe.y, fe.mx, fe.my);
            g.foes[i] = null;
        }
    }
}

function clearFoes(g) {
    for (let i = 0; i < FOE_MAX; i++) {
        if (!g.foes[i]) continue;
        addClearFrag(g);
        removeFoeSlot(g, i);
    }
}
function clearFoesZako(g) {
    for (let i = 0; i < FOE_MAX; i++) {
        const fe = g.foes[i];
        if (!fe || fe.type === BOSS_TYPE || fe.spc === SPC.BOSS_ACTIVE_BULLET) continue;
        addClearFrag(g);
        removeFoeSlot(g, i);
    }
}

function moveFoes(g) {
    const ship = g.ship, centered = g.hitbox === 'centered';
    for (let i = 0; i < FOE_MAX; i++) {
        let fe = g.foes[i];
        if (!fe) continue;
        if (fe.cmd) {
            // libBulletML's isEnd(): ANY top action ended — a two-action boss pattern restarts when its first ends
            if (fe.type === BOSS_TYPE && runnerIsEndLib(fe.cmd)) fe.cmd = makeRunner(fe.bml);
            runRunner(fe.cmd, hostFor(g, fe, i));
            // as the C: what happens next is decided by the SLOT — vanished and empty, or vanished and
            // already reused by a bullet that run fired (which the C then moves in this same iteration)
            if (!g.foes[i]) continue;
            fe = g.foes[i];
        }
        const mx = ((sinD(fe.d) * fe.spd) >> 8) + fe.vx;
        const my = -((cosD(fe.d) * fe.spd) >> 8) + fe.vy;
        fe.x += mx; fe.y += my;
        fe.mx = mx; fe.my = my;
        g.slotMv[2 * i] = mx; g.slotMv[2 * i + 1] = my;
        const wl = fe.cnt < 4 ? 0 : fe.cnt < 8 ? 1 : 2;
        fe.px = fe.x - mx * (1 << wl);
        fe.py = fe.y - my * (1 << wl);
        fe.cnt++;
        if (fe.spc === SPC.FOE) {
            fe.hit = 0;
            const ss = FOE_SCAN_SIZE[fe.type];
            for (let j = 0; j < SHOT_MAX; j++) {
                const st = g.shots[j];
                if (!st) continue;
                if (absN(fe.x - st.x) < ss && absN(fe.y - st.y) < ss + SHOT_SCAN_HEIGHT) {
                    g.shots[j] = null;
                    fe.shield--; fe.hit = 1;
                    addShotFrag(g);
                    if (fe.shield <= 0) {
                        // ⚠ the C `continue`s the SHOT loop here, so a second shot in the same frame
                        // scores, wipes and explodes again on the already-removed enemy.
                        addScore(g, ENEMY_SCORE[fe.type]);
                        g.events.push(['kill', fe.type, ENEMY_SCORE[fe.type]]);
                        wipeBullets(g, fe.x, fe.y, BULLET_WIPE_WIDTH * (fe.type + 1));
                        addEnemyFrag(g, fe.type);
                        if (fe.type === BOSS_TYPE) bossDestroied(g);
                        if (g.foes[i] === fe) removeFoeSlot(g, i);
                        fe.spc = SPC.NOT_EXIST; fe.cmd = null;
                    } else g.events.push(['damage', fe.type]);
                }
            }
        } else if (fe.spc !== SPC.NOT_EXIST && centered) {
            // centered: from where the bullet was the frame before to where it is now (exact: see NEAR_POINT)
            const sx = ship.x, sy = ship.y, qx = fe.x - mx, qy = fe.y - my;
            if (sx > (qx < fe.x ? qx : fe.x) - NEAR_POINT && sx < (qx < fe.x ? fe.x : qx) + NEAR_POINT
                && sy > (qy < fe.y ? qy : fe.y) - NEAR_POINT && sy < (qy < fe.y ? fe.y : qy) + NEAR_POINT
                && centeredHitsShip(qx, qy, fe.x, fe.y, sx, sy)) destroyShip(g);
        } else if (fe.spc !== SPC.NOT_EXIST) {
            // the float test only for a ship near the swept segment's box (exact: see NEAR_SEGMENT)
            const sx = ship.x, sy = ship.y;
            if (sx > (fe.px < fe.x ? fe.px : fe.x) - NEAR_SEGMENT && sx < (fe.px < fe.x ? fe.x : fe.px) + NEAR_SEGMENT
                && sy > (fe.py < fe.y ? fe.py : fe.y) - NEAR_SEGMENT && sy < (fe.py < fe.y ? fe.y : fe.py) + NEAR_SEGMENT
                && segmentHitsShip(fe.px, fe.py, fe.x, fe.y, sx, sy)) destroyShip(g);
        }
        if (g.foes[i] === fe && (fe.px < 0 || fe.px >= SCAN_WIDTH_8 || fe.py < 0 || fe.py >= SCAN_HEIGHT_8)) {
            removeFoeSlot(g, i);
        }
    }
}

/**
 * A ship more than NEAR_SEGMENT (16 px) outside the box of a bullet's swept segment is never hit, so moveFoes skips
 * the float test then (slice P1: it was a third of a busy frame). Exact, not a tolerance: the test hits only when the
 * ship's projection falls inside the segment (0 < ht < 1) and its squared distance to the line is under 2 px²
 * (SHIP_HIT_WIDTH = 512²). Outside the box by 16 px, the true distance to the segment is ≥ 4096, so hd ≥ 4096²
 * ≈ 1.7e7 — 64× the threshold; the float32 rounding of these screen-sized terms (|o|² < 2^35, relative error
 * ~1e-7 per operation) is a few 10⁴ at most.
 */
const NEAR_SEGMENT = 16 * 256;
/** vector.c vctInnerProduct: (float)a.x*b.x + (float)a.y*b.y, in float. */
const ip = (ax, ay, bx, by) => f32(f32(f32(ax) * f32(bx)) + f32(f32(ay) * f32(by)));
/** The ship-vs-bullet test of moveFoes, in the C's float arithmetic: the swept segment (px,py)→(x,y) within 2 px. */
export function segmentHitsShip(px, py, x, y, sx, sy) {
    const bx = x - px, by = y - py;
    const inaa = ip(bx, by, bx, by);
    if (!(inaa > 1)) return false; // a bullet that does not move never hits
    const ox = sx - px, oy = sy - py;
    const inab = ip(bx, by, ox, oy);
    const ht = f32(inab / inaa);
    if (!(ht > 0 && ht < 1)) return false;
    const hd = f32(ip(ox, oy, ox, oy) - f32(f32(f32(inab * inab) / inaa) / inaa));
    return hd >= 0 && hd < SHIP_HIT_WIDTH;
}


/** centered's box prefilter: 4 px, twice the hit radius (outside it the distance is ≥ 4 px, so never a hit) */
const NEAR_POINT = 4 * 256;
/**
 * The centered hit test (slice HB; PARSEC47's BulletActor.checkShipHit, with the ends included): the ship is hit when
 * it comes within 2 px (SHIP_HIT_WIDTH = 512², the original's threshold) of the segment the bullet's POSITION swept
 * this frame, from (qx, qy) (the frame before) to (x, y) — a capsule, so a fast bullet cannot skip the ship. A bullet
 * that does not move is a plain point test: one resting on the ship hits (in the original it never does). Exact
 * integers up to the one division, all correctly rounded doubles, so Node and every browser agree.
 */
export function centeredHitsShip(qx, qy, x, y, sx, sy) {
    const bx = x - qx, by = y - qy, ox = sx - qx, oy = sy - qy;
    const inaa = bx * bx + by * by, inab = bx * ox + by * oy;
    let d2;
    if (inaa === 0 || inab <= 0) d2 = ox * ox + oy * oy; // not moving, or the ship behind where it started
    else if (inab >= inaa) { const ex = sx - x, ey = sy - y; d2 = ex * ex + ey * ey; } // the ship past where it is now
    else d2 = ox * ox + oy * oy - (inab * inab) / inaa;
    return d2 < SHIP_HIT_WIDTH;
}

// ── barragemanager.cc addBullets / boss ──
function addBullets(g) {
    g.sceneCnt--;
    if (g.sceneCnt < 0) {
        if (!g.insane) clearFoes(g);
        if (g.scene >= 0 && !g.endless) setClearScore(g);
        if (g.scene % 10 === 8) {
            g.sceneCnt = 999999;
            g.zakoAppCnt = ZAKO_APP_TERM;
            setBarrages(g, g.level, 1, 0);
            addBossBullet(g);
        } else {
            g.sceneCnt = SCENE_TERM;
            setBarrages(g, g.level, 0, g.scene % 10 === 3 ? 1 : 0);
        }
        g.level = f32(g.level + g.levelInc);
        if (g.status !== STATUS.IN_GAME) g.sceneCnt = 999999;
    }
    if (g.sceneCnt < SCENE_END_TERM) return;
    for (let i = 0; i < g.barrageNum; i++) {
        if (g.bossMode) {
            if (i > 0) break;
            if (g.zakoAppCnt <= 0) break;
            g.zakoAppCnt--;
        }
        const b = g.barrage[i];
        const type = b.type;
        if (type === g.quickAppType && g.enNum[type] === 0) {
            addFoe(g, g.pax, g.pay, b.rank, 512, 0, type, SHIELD[type], g.lists[type][b.i]);
        }
        let frq = Math.trunc(APP_FREQ[type] / b.frq);
        if (frq < 2) frq = 2;
        if (nextRandInt(g) % frq === 0) {
            const x = (nextRandInt(g) % W8_2_3) + W8_6;
            const y = (nextRandInt(g) % H8_6) + H8_10;
            if (type === g.quickAppType) { g.pax = x; g.pay = y; }
            addFoe(g, x, y, b.rank, 512, 0, type, SHIELD[type], g.lists[type][b.i]);
        }
    }
}

function addBossBullet(g) {
    let bossSet = false;
    for (let i = 0; i < g.barrageNum; i++) {
        const b = g.barrage[i];
        if (b.type !== 2) continue;
        const bml = g.lists[2][b.i];
        if (!bossSet) { addFoe(g, SCAN_WIDTH_8 / 2, SCAN_HEIGHT_8 / 5, b.rank, 512, 0, BOSS_TYPE, BOSS_SHIELD, bml); bossSet = true; } else {
            addFoeBossActiveBullet(g, SCAN_WIDTH_8 / 2, SCAN_HEIGHT_8 / 5, b.rank, 512, 0, bml);
        }
    }
}

function bossDestroied(g) {
    if (!g.endless) {
        setClearScore(g);
        addLeftBonus(g);
        initStageClear(g);
    }
    clearFoes(g);
    g.sceneCnt = 180;
    g.zakoAppCnt = 0;
}

// ── shot.c ──
function addShot(g, x, y) {
    for (let i = 0; i < SHOT_MAX; i++) if (!g.shots[i]) { g.shots[i] = { x, y, cnt: 0 }; g.events.push(['shot']); return; }
}
function moveShots(g) {
    for (let i = 0; i < SHOT_MAX; i++) {
        const st = g.shots[i];
        if (!st) continue;
        st.y -= SHOT_SPEED;
        st.cnt++;
        if (st.y < 0) g.shots[i] = null;
    }
}

// ── ship.c ──
const SHIP_MV = [[0, -256], [181, -181], [256, 0], [181, 181], [0, 256], [-181, 181], [-256, 0], [-181, -181]];
function moveShip(g, inp) {
    const s = g.ship;
    const sd = inputDir(inp) - 1;
    if (inputFire(inp) && s.shotCnt < 0 && g.status === STATUS.IN_GAME) {
        addShot(g, s.x, s.y);
        s.shotCnt = SHOT_INTERVAL;
    }
    s.shotCnt--;
    if (inputSlow(inp)) { if (s.speed > SHIP_SLOW_SPEED) s.speed -= SHIP_SLOW_DOWN; } else if (s.speed < SHIP_SPEED) s.speed += SHIP_SLOW_DOWN;
    if (sd >= 0) {
        s.x += (s.speed * SHIP_MV[sd][0]) >> 8;
        s.y += (s.speed * SHIP_MV[sd][1]) >> 8;
        const e = SHIP_SCAN_WIDTH * SHIP_SCREEN_EDGE_WIDTH;
        if (s.x < e) s.x = e; else if (s.x > SCAN_WIDTH_8 - e) s.x = SCAN_WIDTH_8 - e;
        if (s.y < e) s.y = e; else if (s.y > SCAN_HEIGHT_8 - e) s.y = SCAN_HEIGHT_8 - e;
    }
    s.cnt++;
    if (s.invCnt > 0) s.invCnt--;
}
function destroyShip(g) {
    if (g.status !== STATUS.IN_GAME || g.ship.invCnt > 0) return;
    addShipFrag(g);
    g.bonusScore = 10; // resetBonusScore
    g.events.push(['hit']);
    g.left--;
    if (g.left < 0) { initGameover(g); return; }
    g.ship.invCnt = Math.max(0, idiv(SHIP_INVINCIBLE_CNT_BASE * (100 - g.scene), 100));
    clearFoesZako(g);
}

// ── bonus.c ──
function addBonus(g, x, y, vx, vy) {
    for (let i = 0; i < BONUS_MAX; i++) if (!g.bonuses[i]) { g.bonuses[i] = { x, y, vx, vy, cnt: 0, down: 1 }; return; }
}
function moveBonuses(g) {
    const ship = g.ship;
    for (let i = 0; i < BONUS_MAX; i++) {
        const bn = g.bonuses[i];
        if (!bn) continue;
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
            if (bn.y < 0) {
                g.bonusScore = Math.max(10, Math.trunc(g.bonusScore / 20) * 10); // missBonus
                g.events.push(['lostStar']);
                g.bonuses[i] = null;
                continue;
            }
        }
        const d = vctDist(ship.x, ship.y, bn.x, bn.y);
        if (d < BONUS_ACQUIRE_WIDTH) {
            addScore(g, g.bonusScore);
            g.events.push(['star', g.bonusScore]);
            if (g.bonusScore < 1000) g.bonusScore += 10;
            g.bonuses[i] = null;
            continue;
        } else if (d < BONUS_INHALE_WIDTH) {
            // (long)(dx)*(W-d)>>20 — a 64-bit product on Linux; exact in a double here
            bn.vx += Math.floor(((ship.x - bn.x) * (BONUS_INHALE_WIDTH - d)) / 1048576);
            bn.vy += Math.floor(((ship.y - bn.y) * (BONUS_INHALE_WIDTH - d)) / 1048576);
        }
        bn.cnt++;
    }
}

// ── attractmanager.c ──
function addScore(g, s) {
    g.score += s;
    if (g.score >= g.nextExtend) {
        g.nextExtend += g.neAdd;
        g.neAdd = 500000;
        if (g.left <= 8) { g.left++; g.events.push(['extend']); }
    }
}
function addLeftBonus(g) {
    g.nextExtend = 999999999;
    addScore(g, g.left * 100000);
}
function setClearScore(g) {
    g.sceneScores.push({ scene: g.scene, score: g.score - g.ssSc });
    g.ssSc = g.score;
}
function initGameover(g) { g.status = STATUS.GAMEOVER; g.endCnt = 0; g.mnp = 0; g.events.push(['gameover']); }
function initStageClear(g) { g.status = STATUS.STAGE_CLEAR; g.endCnt = 0; g.mnp = 0; g.events.push(['clear']); }
function moveEnd(g, inp) {
    const fire = inputFire(inp);
    if (g.endCnt > 900 || (g.endCnt > 128 && g.mnp && fire)) { g.status = STATUS.TITLE; return; }
    if (!fire && !inputSlow(inp)) g.mnp = 1; // the C tests btn == 0: no button at all
    g.endCnt++;
}

/** One frame (noiz2sa.c move(), then tick++). Returns the events of this frame. */
export function stepGame(g, inp) {
    g.events = [];
    switch (g.status) {
        case STATUS.IN_GAME:
            addBullets(g); moveShots(g); moveShip(g, inp); moveFoes(g); moveFrags(g); moveBonuses(g);
            break;
        case STATUS.GAMEOVER:
            moveEnd(g, inp); if (g.status === STATUS.TITLE) break;
            addBullets(g); moveShots(g); moveFoes(g); moveFrags(g);
            break;
        case STATUS.STAGE_CLEAR:
            moveEnd(g, inp); if (g.status === STATUS.TITLE) break;
            moveShots(g); moveShip(g, inp); moveFrags(g); moveBonuses(g);
            break;
        default:
            return g.events;
    }
    g.tick++;
    g.frame++;
    return g.events;
}

// cloneGame's copies, written out (slice P1: faster than spreads and maps; the same fields in the same order as
// newFoe / addShot / addBonus, so the copies share the originals' shapes)
const cloneFoe = (f) => ({
    x: f.x, y: f.y, px: f.px, py: f.py, mx: f.mx, my: f.my, vx: f.vx, vy: f.vy, rank: f.rank, d: f.d, spd: f.spd,
    spc: f.spc, type: f.type, shield: f.shield, cnt: f.cnt, hit: f.hit, cmd: f.cmd ? cloneRunner(f.cmd) : null, bml: f.bml,
});
function cloneSlots(a, copy) {
    const out = a.slice();
    for (let i = 0; i < out.length; i++) if (out[i]) out[i] = copy(out[i]);
    return out;
}
const cloneShot = (x) => ({ x: x.x, y: x.y, cnt: x.cnt });
const cloneBonus = (b) => ({ x: b.x, y: b.y, vx: b.vx, vy: b.vy, cnt: b.cnt, down: b.down });

export function cloneGame(g) {
    const bp = g.bp.map((l) => l.map((b) => ({ type: b.type, i: b.i, maxRank: b.maxRank, rank: b.rank, frq: b.frq })));
    return {
        ...g,
        rand: cloneCRand(g.rand),
        bp,
        bq: g.bq.map((q) => q.slice()),
        barrage: g.barrage.map((b) => bp[b.type][b.i]), // barrage[] points at bp records
        foes: cloneSlots(g.foes, cloneFoe),
        enNum: g.enNum.slice(),
        shots: cloneSlots(g.shots, cloneShot),
        bonuses: cloneSlots(g.bonuses, cloneBonus),
        frags: g.frags.slice(),
        slotMv: g.slotMv.slice(),
        ship: { ...g.ship },
        sceneScores: g.sceneScores.slice(),
        events: [],
    };
}

// ── a per-frame state line, the same format the native build prints ──
function fnv(h, v) { h ^= v & 0xff; h = Math.imul(h, 16777619); h ^= (v >>> 8) & 0xff; h = Math.imul(h, 16777619); h ^= (v >>> 16) & 0xff; h = Math.imul(h, 16777619); h ^= (v >>> 24) & 0xff; return Math.imul(h, 16777619); }
export function stateLine(g) {
    let hf = 0x811c9dc5 | 0, nf = 0;
    for (let i = 0; i < FOE_MAX; i++) {
        const f = g.foes[i];
        if (!f) continue;
        nf++;
        for (const v of [i, f.spc, f.x, f.y, f.d, f.spd, f.spc === SPC.FOE ? f.shield : 0]) hf = fnv(hf, v);
    }
    let hb = 0x811c9dc5 | 0, nb = 0;
    for (let i = 0; i < BONUS_MAX; i++) { const b = g.bonuses[i]; if (!b) continue; nb++; for (const v of [i, b.x, b.y]) hb = fnv(hb, v); }
    let hs = 0x811c9dc5 | 0;
    for (let i = 0; i < SHOT_MAX; i++) { const s = g.shots[i]; if (!s) continue; for (const v of [i, s.x, s.y]) hs = fnv(hs, v); }
    return `f=${g.frame} st=${g.status} sc=${g.score} l=${g.left} bs=${g.bonusScore} scene=${g.scene} ship=${g.ship.x},${g.ship.y},${g.ship.invCnt} nf=${nf} F=${(hf >>> 0).toString(16)} nb=${nb} B=${(hb >>> 0).toString(16)} S=${(hs >>> 0).toString(16)}`;
}
