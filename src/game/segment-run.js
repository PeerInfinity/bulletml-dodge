/**
 * Slice N0: one SEGMENT played by a bot, as an Archipelago Loops region plays it (NewDocs plan "bulletml-incremental",
 * ⚖ the user 2026-10-04): a region is one or more scenes, from a start (stage, scene) to an end (stage, scene), and may
 * pass a boss into the next stage; a hit restarts the region from its start, and the time already spent stays spent.
 *
 * Positions: `stage` as newGame takes it (0–9 the stages 1–10, 10–13 the endless modes); `scene` = g.scene's value while
 * the scene plays (0–8 the ordinary scenes, 9 the boss). A span covers its start and end scenes, both included.
 *
 * An ATTEMPT starts a game at the span's start (newGame's startScene) and ends:
 *  - with a hit: failed (the attempt's frames are the time spent);
 *  - cleared: when the end scene is over. An ordinary scene is over when the next one starts; the boss when it is
 *    killed or after BOSS_CAP frames (3 minutes) without a hit (⚖ the G4 no-attack rule). A boss that is not the end
 *    leads into the next stage: a new game at its scene 0, the score carried on (an endless mode has no next stage,
 *    so a span in one stays inside it).
 * Score counts from the region's start (⚖): every game of an attempt starts at 0.
 *
 * Attempts go on until one clears or `maxAttempts` have failed. Each attempt's bot draws from its own generator
 * (attemptBotSeed), so a humanlike bot's retries differ; a bot with no human layer (the Ace, the Expert) plays every
 * attempt the same. Deterministic: the same options give the same result and tapes, byte for byte.
 */
import { newGame, stepGame, STATUS, STAGE_NUM, STAGE_NAMES, LAST_START_SCENE } from './noiz2sa-game.js';
import { makeBot, tapeBotRecord, BROWSER_BUDGET } from './bot.js';
import { makeTape } from './tape.js';
import { BOSS_CAP } from './bot-run.js';

export const BOSS_SCENE = LAST_START_SCENE; // 9: the scene number while the boss is up
export const FPS = 62.5;

/** the bot seed of attempt a (0, 1, …) of a run with bot seed s: attempt 0 is s itself */
export const attemptBotSeed = (s, a) => (s + Math.imul(a, 0x9e3779b9)) >>> 0;

/** a position as a player writes it, STAGE:SCENE (stage 1–10 or an endless mode's name, scene 1–9 or boss): "2:5" → {stage: 1, scene: 4}; "3:boss" → {stage: 2, scene: 9} */
export function parsePosition(s) {
    const m = /^([^:]+):(\d+|boss)$/i.exec(String(s ?? '').trim());
    if (!m) throw new Error(`a position is STAGE:SCENE, e.g. 2:5 or 3:boss (got ${s})`);
    const stage = STAGE_NAMES.findIndex((n) => n.toLowerCase() === m[1].toLowerCase());
    if (stage < 0) throw new Error(`unknown stage "${m[1]}" (have: ${STAGE_NAMES.join(', ')})`);
    const scene = m[2].toLowerCase() === 'boss' ? BOSS_SCENE : Number(m[2]) - 1;
    if (m[2].toLowerCase() !== 'boss' && (scene < 0 || scene >= BOSS_SCENE)) throw new Error(`scene must be 1–${BOSS_SCENE} or boss (got ${m[2]})`);
    return { stage, scene };
}
export const showPosition = (p) => `${STAGE_NAMES[p.stage]}:${p.scene === BOSS_SCENE ? 'boss' : p.scene + 1}`;

const before = (a, b) => a.stage < b.stage || (a.stage === b.stage && a.scene <= b.scene);

/** a span's start and end, checked; → the stages it passes through */
export function checkSpan(start, end) {
    for (const [n, p] of [['start', start], ['end', end]]) {
        if (!p || !Number.isInteger(p.stage) || !Number.isInteger(p.scene) || p.stage < 0 || p.stage >= STAGE_NUM + 4 || p.scene < 0 || p.scene > BOSS_SCENE) {
            throw new Error(`segment ${n} must be {stage: 0–13, scene: 0–${BOSS_SCENE}} (got ${JSON.stringify(p)})`);
        }
    }
    if (!before(start, end)) throw new Error(`segment end ${JSON.stringify(end)} is before its start ${JSON.stringify(start)}`);
    if (start.stage !== end.stage && end.stage >= STAGE_NUM) throw new Error('a segment in an endless mode stays inside it (no next stage)');
    return end.stage - start.stage + 1;
}

/**
 * @param patterns  the Noiz2sa patterns (loadNoiz2saPatterns / the page's)
 * @param o.start, o.end  {stage, scene}
 * @param o.bot      makeBot options for the player (e.g. human.js botOptions(settingByName(…)) without botSeed), a variant
 * @param o.botSeed  the run's bot seed (attempt a plays with attemptBotSeed(botSeed, a))
 * @param o.seed     the game's C rand() seed (every game of the region starts with it); endlessSeed 7919 × seed
 * @param o.hitbox   'centered' (⚖ the substrate's) or 'original'
 * @param o.maxAttempts  stop after this many failed attempts
 * @param o.tapes    keep every game's tape (else none)
 * @returns {{result, tapes}}
 */
export function runSegment(patterns, { start, end, bot: botOpt = {}, botSeed = 1, seed = 1, endlessSeed = 7919 * seed, hitbox = 'centered', maxAttempts = 20, budget = BROWSER_BUDGET, tapes: keepTapes = false } = {}) {
    checkSpan(start, end);
    const t0 = performance.now();
    const attempts = [], tapes = [];
    let botRecord = null;
    for (let a = 0; a < maxAttempts; a++) {
        const at = { cleared: false, frames: 0, score: 0, hitAt: null, kills: 0, stars: 0 };
        let pos = { ...start }, done = false;
        while (!done) {
            const g = newGame(patterns, pos.stage, { seed, endlessSeed, hitbox, startScene: pos.scene });
            const bot = makeBot({ variant: 'attack', budget, ...botOpt, botSeed: attemptBotSeed(botSeed, a), gameSeed: seed });
            botRecord ??= tapeBotRecord(bot.config);
            const played = [];
            const last = pos.stage === end.stage;
            let bossStart = null, next = false;
            while (!done && !next) {
                if (g.status !== STATUS.IN_GAME) throw new Error(`segment: the game left play (status ${g.status}) at frame ${g.frame}`);
                const b = bot(g);
                played.push(b);
                for (const e of stepGame(g, b)) {
                    if (e[0] === 'hit') { at.hitAt = { stage: pos.stage, scene: g.scene, frame: g.frame }; done = true; }
                    else if (e[0] === 'kill') at.kills++;
                    else if (e[0] === 'star') at.stars++;
                    else if (e[0] === 'clear') next = true; // the boss killed (stages 1–10)
                }
                if (done) break;
                if (g.scene === BOSS_SCENE && bossStart === null) bossStart = g.frame;
                if (bossStart !== null && g.frame - bossStart >= BOSS_CAP) next = true; // 3 minutes of the boss without a hit
                if (g.scene > (last ? end.scene : BOSS_SCENE)) next = true; // the end scene is over (endless: the boss killed)
                if (next && last) { at.cleared = true; done = true; }
            }
            at.frames += played.length;
            at.score += g.score;
            if (keepTapes) tapes.push(makeTape({ stage: pos.stage, seed, endlessSeed, hitbox, startScene: pos.scene, played, extra: { player: `bot-${botRecord.variant}`, bot: tapeBotRecord(bot.config), segment: { start, end, attempt: a } } }));
            if (!done) pos = { stage: pos.stage + 1, scene: 0 };
        }
        attempts.push(at);
        if (at.cleared) break;
    }
    const frames = attempts.reduce((n, x) => n + x.frames, 0);
    const result = {
        start, end, seed, botSeed, hitbox, maxAttempts, bot: botRecord,
        cleared: attempts.at(-1).cleared, attempts: attempts.length, deathless: attempts[0].cleared,
        frames, seconds: +(frames / FPS).toFixed(2), clearFrames: attempts.at(-1).cleared ? attempts.at(-1).frames : null,
        score: attempts.at(-1).cleared ? attempts.at(-1).score : null,
        runs: attempts, cpuSec: +((performance.now() - t0) / 1000).toFixed(2),
    };
    return { result, tapes };
}
