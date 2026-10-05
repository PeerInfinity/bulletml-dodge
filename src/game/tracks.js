/**
 * Slice N2: the bot's training, for the planned Archipelago Loops substrate (⚖ the user, 2026-10-04).
 *
 *  - Five TRACKS (human.js TRACKS: seeing, thinking, hands, focus, panic; focus = the lapses, ⚖ 2026-10-05), each a position 0–100 in the slider's units; the
 *    bot plays with trackKnobs(tracks): equal tracks = the slider, all 100 = the Expert.
 *  - TRAINING POINTS come from the seconds spent in a Noiz2sa region (live, by the bot, or by an instant playback, ⚖)
 *    and from the score made from the region's start (⚖). Only Noiz2sa regions train the bot (⚖).
 *  - Points are spent on track steps, by hand or by the STRATEGY (⚖ "replace the personalities with strategies for
 *    how to spend the training resources … switch at any time"): Even (the default), or one track first.
 *  - A respec is free (⚖ "free in the first version"): every point spent comes back.
 *  - At the ceiling (every track 100) the points left over are SURPLUS, for region XP (⚖ "Surplus mana and points
 *    can be used to boost region XP").
 *
 * Every rate and price is a SETTING (⚖ the user: "For some of your questions, I think I want the answer to be a user
 * configurable setting"). The defaults are placeholders until the segment sweep (slice N1) prices them.
 *
 * A trainer is plain data (JSON): save it as it is. Functions here never touch the clock or a random generator.
 */
import { TRACKS, trackKnobs } from './human.js';

export const TRACK_MAX = 100;
export const STRATEGIES = ['even', ...TRACKS.map((t) => `${t}-first`), 'manual'];
export const STRATEGY_LABEL = { even: 'Even', 'seeing-first': 'Seeing first', 'thinking-first': 'Thinking first', 'hands-first': 'Hands first', 'focus-first': 'Focus first', 'panic-first': 'Panic first', manual: 'By hand' };

/** ⚠ placeholders, to be priced from the N1 measurement; every one is a user setting */
export const DEFAULT_TRAINING = Object.freeze({
    pointsPerSecond: 1, // per second spent in a Noiz2sa region
    pointsPerScore: 0.0001, // per point of score from the region's start (10,000 score = 1 point)
    stepBase: 2, // the price of a track's first step (0 → 1)
    stepGrowth: 1.04, // each step costs this much more than the one before
});

/** the price of one step of a track from position s to s + 1 */
export function stepCost(settings, s) {
    return settings.stepBase * Math.pow(settings.stepGrowth, s);
}

export function newTrainer({ settings = {}, strategy = 'even', tracks = {} } = {}) {
    const st = { ...DEFAULT_TRAINING, ...settings };
    const t = Object.fromEntries(TRACKS.map((k) => [k, clampTrack(tracks[k] ?? 0)]));
    return { settings: st, strategy: checkStrategy(strategy), tracks: t, earned: 0, spent: spentOn(st, t), unspent: 0, surplus: 0 };
}

const clampTrack = (s) => Math.min(TRACK_MAX, Math.max(0, Math.trunc(s)));
function checkStrategy(s) { if (!STRATEGIES.includes(s)) throw new Error(`unknown strategy "${s}" (have: ${STRATEGIES.join(', ')})`); return s; }
/** the points that the given positions cost from 0 */
function spentOn(settings, tracks) {
    let n = 0;
    for (const k of TRACKS) for (let s = 0; s < tracks[k]; s++) n += stepCost(settings, s);
    return n;
}
export const atCeiling = (tr) => TRACKS.every((k) => tr.tracks[k] >= TRACK_MAX);

/** the points a region visit earns: its seconds and its score from the region's start */
export const pointsFor = (settings, { seconds = 0, score = 0 }) => seconds * settings.pointsPerSecond + score * settings.pointsPerScore;

/** add a visit's points (then the strategy spends them); → the points earned */
export function earn(tr, visit) {
    const p = pointsFor(tr.settings, visit);
    tr.earned += p;
    tr.unspent += p;
    autoSpend(tr);
    return p;
}

/** buy one step of a track by hand; → whether it was bought */
export function buyStep(tr, track) {
    if (!TRACKS.includes(track)) throw new Error(`unknown track "${track}"`);
    const s = tr.tracks[track];
    if (s >= TRACK_MAX) return false;
    const c = stepCost(tr.settings, s);
    if (tr.unspent < c) return false;
    tr.unspent -= c; tr.spent += c; tr.tracks[track] = s + 1;
    return true;
}

/** the next track the strategy would raise, or null (manual, or at the ceiling) */
export function nextTrack(tr) {
    if (tr.strategy === 'manual' || atCeiling(tr)) return null;
    if (tr.strategy !== 'even') {
        const first = tr.strategy.slice(0, -'-first'.length);
        if (tr.tracks[first] < TRACK_MAX) return first;
    }
    // even: the lowest track, the first of them in TRACKS order
    let best = null;
    for (const k of TRACKS) if (tr.tracks[k] < TRACK_MAX && (best === null || tr.tracks[k] < tr.tracks[best])) best = k;
    return best;
}

/** spend what the strategy can afford; at the ceiling the rest becomes surplus (any strategy) */
export function autoSpend(tr) {
    for (let k = nextTrack(tr); k !== null && buyStep(tr, k); k = nextTrack(tr));
    if (atCeiling(tr) && tr.unspent > 0) { tr.surplus += tr.unspent; tr.unspent = 0; }
}

/** switch the strategy (at any time, ⚖); it spends what it can at once */
export function setStrategy(tr, strategy) {
    tr.strategy = checkStrategy(strategy);
    autoSpend(tr);
}

/** a free respec: every track back to 0 and every point spent back to unspent; then the strategy spends again */
export function respec(tr) {
    tr.unspent += tr.spent;
    tr.spent = 0;
    for (const k of TRACKS) tr.tracks[k] = 0;
    autoSpend(tr);
}

/** take the surplus (for region XP); → the points taken */
export function takeSurplus(tr) {
    const p = tr.surplus;
    tr.surplus = 0;
    return p;
}

/** the knobs the bot plays with */
export const trainerKnobs = (tr, tactics = {}) => trackKnobs(tr.tracks, tactics);
