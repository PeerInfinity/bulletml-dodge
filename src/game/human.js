/**
 * Slice H2: the human limits, as bot settings. Shared by Node (src/game/bot.js, bin/h2-sweep.mjs) and the page.
 *
 * ⚖ The user: the bot as it was after H1b (the Expert) is the MAX of the slider; lower settings make "the sort of
 * mistakes a human might make", set by one skill slider or a personality preset; no manual recording (the values
 * below are starting points from the human-factors literature and outcome targets; slice H3 calibrates them).
 *
 * A SETTING is a perception ('observed' for every humanlike bot; 'omniscient' only for the Ace) plus one value for
 * every knob in KNOBS. The Expert's values are KNOBS[k].expert: with them the bot is the H1b Expert exactly (its
 * tapes re-record byte for byte; test/bot.test.mjs). Knobs fall in three layers:
 *  - what it SEES (reaction, attention, misjudgement): applied to the observed picture before the planner sees it;
 *  - how it THINKS (horizon, replanEvery, slowUse, the margin, attackY, starWeight): the planner's own settings;
 *  - what its HANDS do (minHold, maxRate, overshoot, lapses, panic slow): applied to the planned input before it is
 *    pressed. The planner is not told: it finds out from the next picture, as a player would.
 *
 * Randomness: the bot's OWN generator (makeRng: mulberry32, integer arithmetic, so the same numbers in every
 * engine), seeded from the game's seed and a bot seed — never the game's rand(). It draws only uniform numbers
 * (no log/exp/cos, whose last bit may differ between engines), so a humanlike bot is reproducible and the page
 * plays Node's moves.
 */

/**
 * Every knob. unit; [min, max] the range the page offers; step its granularity (values are rounded to it);
 * expert = the Expert's value (the H1b behaviour); skill = how it orders with skill: +1 more is more skilled, −1 less
 * is more skilled, 0 a habit (not better or worse: margin, attack height, star greed, panic thresholds); interp =
 * how the skill slider moves between the beginner and the Expert: linearly, or geometrically ('log', for the knobs
 * whose Expert value means "no limit").
 */
export const KNOBS = [
    // ── seeing ──
    { key: 'reaction', group: 'seeing', unit: 'frames', min: 0, max: 40, step: 1, expert: 0, skill: -1,
        help: 'reaction time: the picture it plans on is the screen as it was this many frames ago (16 ms each), with what it saw then carried forward along its seen motion; its own ship is where it really is. Anything fired, turned or killed since is not seen yet.' },
    { key: 'attentionRadius', group: 'seeing', unit: 'px', min: 24, max: 600, step: 1, expert: 600, skill: 1, interp: 'log',
        help: 'attention radius: bullets farther than this from the ship are not seen (600 px = the whole 320×480 screen). Enemies are always seen.' },
    { key: 'attentionCount', group: 'seeing', unit: 'bullets', min: 4, max: 1024, step: 1, expert: 1024, skill: 1, interp: 'log',
        help: 'attention span: only the nearest this-many bullets are seen (1024 = all).' },
    { key: 'misjudge', group: 'seeing', unit: 'px', min: 0, max: 8, step: 0.25, expert: 0, skill: -1,
        help: 'misjudged bullet size: the bullet clearance it keeps is off by up to ± this much, a new error every 30 frames; below 0 it thinks the hit area is smaller than it is (it can be hit by a bullet it "dodged").' },
    // ── thinking ──
    { key: 'horizon', group: 'thinking', unit: 'frames', min: 0, max: 96, step: 1, expert: 48, skill: 1,
        help: 'planning horizon: how far ahead it imagines (0 = no planning, it just heads for its target).' },
    { key: 'replanEvery', group: 'thinking', unit: 'frames', min: 1, max: 30, step: 1, expert: 1, skill: -1,
        help: 'how often it looks again and replans; in between it plays its plan blind.' },
    { key: 'marginBullet', group: 'thinking', unit: 'px', min: -2, max: 16, step: 0.25, expert: 2, skill: 0,
        help: 'perceived bullet size: the clearance it keeps from a bullet\'s drawn trail (the hit area is 2 px around it); below 0 it shaves inside the hit area.' },
    { key: 'marginSpawner', group: 'thinking', unit: 'px', min: 0, max: 40, step: 1, expert: 8, skill: 0,
        help: 'the clearance it keeps from anything that can fire a bullet (an enemy, an active bullet, a dot not yet moving).' },
    { key: 'marginTop', group: 'thinking', unit: 'px', min: 0, max: 400, step: 1, expert: 136, skill: 0,
        help: 'it stays below this line (px from the top; enemies appear 48–128 px down).' },
    { key: 'attackY', group: 'thinking', unit: 'px', min: 16, max: 440, step: 1, expert: 160, skill: 0,
        help: 'preferred height: where it waits under its target to attack, px from the top (low = safe, high = more kills).' },
    { key: 'starWeight', group: 'thinking', unit: 'per point', min: 0, max: 0.1, step: 0.001, expert: 0, skill: 0,
        help: 'star greed: what a star\'s points are worth against a kill (a kill = 4–16; a star 10–1000 points × this).' },
    { key: 'slowUse', group: 'thinking', unit: '0–1', min: 0, max: 1, step: 0.05, expert: 1, skill: 1,
        help: 'slow button: the chance, at each look, that it remembers it has one (1 = always; 0 = it never slows down).' },
    // ── hands ──
    { key: 'minHold', group: 'hands', unit: 'frames', min: 1, max: 16, step: 1, expert: 1, skill: -1,
        help: 'minimum key hold: an input it presses is held at least this many frames.' },
    { key: 'maxRate', group: 'hands', unit: 'changes/s', min: 1, max: 62.5, step: 0.5, expert: 62.5, skill: 1, interp: 'log',
        help: 'maximum input changes per second (direction or slow; 62.5 = every frame, no limit).' },
    { key: 'overshootP', group: 'hands', unit: '0–1', min: 0, max: 1, step: 0.01, expert: 0, skill: -1,
        help: 'overshoot: the chance that, when it lets go of a direction, it holds it a little too long.' },
    { key: 'overshootFrames', group: 'hands', unit: 'frames', min: 0, max: 12, step: 1, expert: 0, skill: -1,
        help: 'overshoot length: up to this many frames too long (1 to this, evenly).' },
    { key: 'lapseRate', group: 'hands', unit: 'per min', min: 0, max: 30, step: 0.1, expert: 0, skill: -1,
        help: 'lapses: moments of inattention per minute of play; during one it keeps pressing what it pressed and does not look.' },
    { key: 'lapseFrames', group: 'hands', unit: 'frames', min: 0, max: 90, step: 1, expert: 0, skill: -1,
        help: 'lapse length: on average (½× to 1½×, evenly).' },
    // ── panic ──
    { key: 'panicFrom', group: 'panic', unit: 'bullets', min: 0, max: 600, step: 1, expert: 150, skill: 0,
        help: 'panic starts when this many bullets are on screen…' },
    { key: 'panicTo', group: 'panic', unit: 'bullets', min: 1, max: 800, step: 1, expert: 400, skill: 0,
        help: '…and is full at this many (it grows evenly in between).' },
    { key: 'panicReaction', group: 'panic', unit: 'frames', min: 0, max: 30, step: 1, expert: 0, skill: -1,
        help: 'under full panic, its reaction time is this much longer.' },
    { key: 'panicMisjudge', group: 'panic', unit: 'px', min: 0, max: 8, step: 0.25, expert: 0, skill: -1,
        help: 'under full panic, its misjudgement of bullet size grows by this much.' },
    { key: 'panicSlow', group: 'panic', unit: '0–1', min: 0, max: 1, step: 0.05, expert: 0, skill: -1,
        help: 'under full panic, the chance per half second that it mashes the slow button for half a second.' },
];
export const KNOB = Object.fromEntries(KNOBS.map((k) => [k.key, k]));
export const KNOB_KEYS = KNOBS.map((k) => k.key);
/** the Expert's knob values (the H1b Expert) */
export const EXPERT_KNOBS = Object.freeze(Object.fromEntries(KNOBS.map((k) => [k.key, k.expert])));
/** the knobs of the human layer (the others are the planner's own: horizon, margin, attackY, starWeight) */
export const HUMAN_KEYS = ['reaction', 'attentionRadius', 'attentionCount', 'misjudge', 'replanEvery', 'slowUse', 'minHold', 'maxRate',
    'overshootP', 'overshootFrames', 'lapseRate', 'lapseFrames', 'panicFrom', 'panicTo', 'panicReaction', 'panicMisjudge', 'panicSlow'];
export const FPS = 62.5;
/** frames between two misjudgement errors (and two panic slow-mash chances) */
export const MISJUDGE_EVERY = 30, PANIC_SLOW_FRAMES = 30;

/** a value on the knob's grid, inside its range */
export function snapKnob(key, v) {
    const k = KNOB[key];
    const x = Math.min(k.max, Math.max(k.min, Number(v)));
    return Number((Math.round(x / k.step) * k.step).toFixed(6));
}

/** the human knobs that differ from the Expert's (what a tape records); null when all are the Expert's */
export function humanDiff(knobs) {
    const out = {};
    for (const k of HUMAN_KEYS) if (knobs[k] !== undefined && knobs[k] !== EXPERT_KNOBS[k]) out[k] = knobs[k];
    // the panic thresholds only matter with a panic effect
    if (!(out.panicReaction || out.panicMisjudge || out.panicSlow)) { delete out.panicFrom; delete out.panicTo; }
    return Object.keys(out).length ? out : null;
}

// ── the presets (⚖ the plan's first proposal: the user may rename or retune) ──
// Literature anchors (docs/h2-report.md cites them): simple visual reaction ~200–250 ms (12–16 frames of 16 ms),
// faster in practised gamers (~150–190 ms); choice reaction among several keys slower (Hick–Hyman: +~150 ms for 8–9
// choices); key hold (dwell) times ~70–120 ms in keystroke studies; maximal tapping ~5–7 per second per finger;
// multiple-object tracking ~4–8 objects; useful field of view shrinks under load; attention lapses (PVT, > 500 ms)
// a few per 10 minutes rested, many more when tired or distracted.
const base = (o) => ({ ...EXPERT_KNOBS, ...o });
export const PRESETS = [
    { name: 'Ace', perception: 'omniscient', knobs: base({}),
        description: 'the max bot: plans on a copy of the seeded game, so it knows every future shot (not human)' },
    { name: 'Expert', perception: 'observed', knobs: base({}),
        description: 'perfect eyes and reflexes, no foresight: plans on what it sees, every frame (the H1b bot)' },
    { name: 'Steady veteran', perception: 'observed',
        knobs: base({ reaction: 10, attentionRadius: 360, attentionCount: 160, misjudge: 1, horizon: 48, replanEvery: 2, marginBullet: 4, marginSpawner: 10,
            marginTop: 150, attackY: 180, slowUse: 1, minHold: 3, maxRate: 10, overshootP: 0.05, overshootFrames: 2, lapseRate: 0.5, lapseFrames: 12,
            panicFrom: 150, panicTo: 400, panicReaction: 3, panicMisjudge: 0.5 }),
        description: 'quick reactions, a generous margin, reads ahead, rarely lapses, attacks methodically' },
    { name: 'Score chaser', perception: 'observed',
        knobs: base({ reaction: 12, attentionRadius: 300, attentionCount: 120, misjudge: 2, horizon: 32, replanEvery: 2, marginBullet: 1, marginSpawner: 6,
            marginTop: 100, attackY: 120, starWeight: 0.02, slowUse: 0.8, minHold: 3, maxRate: 9, overshootP: 0.12, overshootFrames: 3, lapseRate: 1, lapseFrames: 14,
            panicFrom: 120, panicTo: 350, panicReaction: 4, panicMisjudge: 1, panicSlow: 0.1 }),
        description: 'greedy for stars, pushes up to attack, a thin margin, takes risks' },
    { name: 'Cautious beginner', perception: 'observed',
        knobs: base({ reaction: 20, attentionRadius: 120, attentionCount: 24, misjudge: 4, horizon: 16, replanEvery: 4, marginBullet: 8, marginSpawner: 16,
            marginTop: 220, attackY: 330, slowUse: 0.3, minHold: 7, maxRate: 4, overshootP: 0.3, overshootFrames: 6, lapseRate: 3, lapseFrames: 24,
            panicFrom: 40, panicTo: 150, panicReaction: 8, panicMisjudge: 3, panicSlow: 0.3 }),
        description: 'slow reactions, a short horizon, an over-large margin, stays low, few kills' },
    { name: 'Panicky', perception: 'observed',
        knobs: base({ reaction: 12, attentionRadius: 300, attentionCount: 120, misjudge: 1, horizon: 32, replanEvery: 2, marginBullet: 3, marginSpawner: 10,
            marginTop: 160, attackY: 220, slowUse: 0.9, minHold: 3, maxRate: 8, overshootP: 0.1, overshootFrames: 3, lapseRate: 1, lapseFrames: 14,
            panicFrom: 50, panicTo: 180, panicReaction: 14, panicMisjudge: 4, panicSlow: 0.6 }),
        description: 'fine when the screen is calm; reaction, precision and slow-button use fall apart when it fills' },
    { name: 'Tunnel vision', perception: 'observed',
        knobs: base({ reaction: 12, attentionRadius: 64, attentionCount: 40, misjudge: 1, horizon: 32, replanEvery: 2, marginBullet: 3, marginSpawner: 10,
            marginTop: 160, attackY: 200, slowUse: 0.9, minHold: 3, maxRate: 8, overshootP: 0.1, overshootFrames: 3, lapseRate: 1, lapseFrames: 14,
            panicFrom: 120, panicTo: 350, panicReaction: 4, panicMisjudge: 1, panicSlow: 0.1 }),
        description: 'a small attention radius: surprised by bullets from the edges' },
    { name: 'Distracted', perception: 'observed',
        knobs: base({ reaction: 13, attentionRadius: 300, attentionCount: 120, misjudge: 1.5, horizon: 32, replanEvery: 3, marginBullet: 3, marginSpawner: 10,
            marginTop: 160, attackY: 200, slowUse: 0.8, minHold: 3, maxRate: 8, overshootP: 0.1, overshootFrames: 3, lapseRate: 8, lapseFrames: 30,
            panicFrom: 120, panicTo: 350, panicReaction: 4, panicMisjudge: 1, panicSlow: 0.1 }),
        description: 'frequent lapses: its eyes leave the screen several times a minute' },
];
export const PRESET = Object.fromEntries(PRESETS.map((p) => [p.name, p]));
/** the skill slider's ends: 0 = Cautious beginner, 100 = Expert (the Ace sits above it, as a preset) */
export const SKILL_LOW = 'Cautious beginner', SKILL_HIGH = 'Expert';

/**
 * The knobs at skill s (0–100): each knob between the beginner's value (0) and the Expert's (100), linearly or
 * geometrically (interp 'log'), on the knob's grid. Every skill-ordered knob moves one way only, so a lower skill is
 * never better on any of them (test/bot.test.mjs checks it).
 */
export function skillKnobs(s) {
    const t = Math.min(100, Math.max(0, Number(s))) / 100;
    const lo = PRESET[SKILL_LOW].knobs, hi = PRESET[SKILL_HIGH].knobs, out = {};
    for (const k of KNOBS) {
        const a = lo[k.key], b = hi[k.key];
        const v = k.interp === 'log' && a > 0 && b > 0 ? a * Math.pow(b / a, t) : a + (b - a) * t;
        out[k.key] = snapKnob(k.key, v);
    }
    return out;
}

/**
 * A setting by name, as the sweep and the page name them: a preset name (any case, spaces or dashes), or
 * "skill N". → {name, perception, knobs}.
 */
export function settingByName(name) {
    const m = /^skill[ _-]?(\d+(?:\.\d+)?)$/i.exec(String(name).trim());
    if (m) return { name: `skill ${Number(m[1])}`, perception: 'observed', knobs: skillKnobs(Number(m[1])) };
    const norm = (x) => x.toLowerCase().replace(/[\s_-]+/g, '');
    const p = PRESETS.find((q) => norm(q.name) === norm(String(name)));
    if (!p) throw new Error(`unknown bot setting "${name}" (have: ${PRESETS.map((q) => q.name).join(', ')}, skill 0–100)`);
    return { name: p.name, perception: p.perception, knobs: { ...p.knobs } };
}

/**
 * makeBot options for a setting {perception, knobs} (the Ace takes only its horizon: it plans on the game itself).
 */
export function botOptions({ perception = 'observed', knobs }, { botSeed = 1 } = {}) {
    const k = { ...EXPERT_KNOBS, ...knobs };
    if (perception === 'omniscient') return { perception, horizon: k.horizon };
    const human = humanDiff(k);
    return {
        perception, horizon: k.horizon, margin: { bullet: k.marginBullet, spawner: k.marginSpawner, top: k.marginTop }, attackY: k.attackY,
        starWeight: k.starWeight, ...(human ? { human, botSeed } : {}),
    };
}

// ── the bot's own random generator ──
/** a 32-bit hash (the murmur3 finaliser) */
function mix32(x) {
    x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
    x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
    return (x ^ (x >>> 16)) >>> 0;
}
/**
 * The bot's generator: mulberry32 (Tommy Ettinger's), seeded from the game's seed and the bot seed. rng() → [0, 1).
 * Its state is rng.state.a (a 32-bit integer), part of the bot.
 */
export function makeRng(gameSeed = 1, botSeed = 1) {
    const state = { a: mix32((mix32(gameSeed >>> 0) ^ Math.imul(botSeed >>> 0, 0x9e3779b9) ^ 0x68e31da4) >>> 0) };
    const rng = () => {
        let a = (state.a + 0x6d2b79f5) | 0;
        state.a = a;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    rng.state = state;
    return rng;
}

// ── the hands: from the planned input to the pressed one ──
const SLOW_BIT = 32, FIRE_BIT = 16;
const moveBits = (b) => b & ~FIRE_BIT; // a change = the direction or the slow button (fire is held throughout)

/**
 * The hands, one per bot: hands(planned, panic) → the input pressed this frame. In order: an overshoot in progress
 * keeps the old direction; a change sooner than minHold frames after the last, or beyond maxRate changes in the last
 * second, is not made (the last input stays); a direction let go of may be overshot; a panic slow-mash ORs in the slow
 * button. Draws from rng only when the knob is on.
 */
export function makeHands(h, rng) {
    const st = { last: null, planned: null, since: 0, changes: [], over: 0, mash: 0, mashClock: 0, overrides: 0, overshoots: 0, mashes: 0, blocked: 0 };
    const minHold = Math.max(1, h.minHold | 0);
    const window = Math.round(FPS), maxIn = h.maxRate >= FPS ? Infinity : Math.max(1, Math.floor(h.maxRate));
    function hands(b, panic, frame) {
        let out = b;
        if (st.last !== null) {
            const want = moveBits(b) !== moveBits(st.last);
            if (st.over > 0) { st.over--; out = (st.last & ~FIRE_BIT) | (b & FIRE_BIT); }
            else if (want) {
                while (st.changes.length && st.changes[0] <= frame - window) st.changes.shift();
                if (st.since < minHold || st.changes.length >= maxIn) { out = st.last; st.blocked++; }
                // an overshoot starts where the PLAN lets go of the direction being held (once, not again after it)
                else if (h.overshootP > 0 && h.overshootFrames > 0 && (st.last & 15) !== 0 && (st.last & 15) !== (b & 15) && st.planned !== null
                    && (st.planned & 15) === (st.last & 15) && rng() < h.overshootP) {
                    st.over = Math.floor(rng() * h.overshootFrames); // this frame and `over` more
                    st.overshoots++;
                    out = (st.last & ~FIRE_BIT) | (b & FIRE_BIT);
                }
            }
        }
        if (h.panicSlow > 0) {
            if (st.mash > 0) st.mash--;
            else if (panic > 0 && frame - st.mashClock >= PANIC_SLOW_FRAMES) {
                st.mashClock = frame;
                if (rng() < h.panicSlow * panic) { st.mash = PANIC_SLOW_FRAMES; st.mashes++; }
            }
            if (st.mash > 0) out |= SLOW_BIT;
        }
        st.planned = b;
        if (out !== b) st.overrides++;
        if (st.last === null || moveBits(out) !== moveBits(st.last)) { st.since = 1; st.changes.push(frame); } else st.since++;
        st.last = out;
        return out;
    }
    /** a lapse: the last input stays (and counts as held) */
    hands.keep = (b) => { const out = st.last === null ? b : st.last; st.since++; st.last = out; st.planned = out; return out; };
    hands.stats = st;
    return hands;
}
