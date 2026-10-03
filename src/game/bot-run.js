/**
 * One G4 bot run, headless: a stage (or endless mode) from its start to the end the rules give it. Shared by
 * bin/bot-sweep.mjs and the tests. Deterministic: the same options give the same tape, byte for byte.
 *
 * Ends:
 *  - stages 1–10: the stage clear, a game over, or BOSS_CAP frames (3 minutes) into the boss scene — the boss
 *    has no timeout, and a bot that never fires cannot kill it (⚖ the user's ruling: no-attack "survived" =
 *    survived 3 minutes of the boss scene; reported apart from "cleared");
 *  - endless modes: a game over or `endlessCap` frames (and, for no-attack, BOSS_CAP frames into the first
 *    boss scene, which it can never leave);
 *  - after a clear or a game over the run lets go of the buttons and then presses fire, as a player would, so
 *    the tape plays on to the title screen.
 */
import { newGame, stepGame, STATUS, STAGE_NUM, input } from './noiz2sa-game.js';
import { makeBot } from './bot.js';
import { makeTape } from './tape.js';

/** 3 minutes at the game's 62.5 frames/s (16 ms frames) */
export const BOSS_CAP = 11250;
const BOSS_SCENE = 9; // the scene number while the boss is up (setBarrages counts the scene up as it starts it)

export function runBot(patterns, { stage, seed = 1, endlessSeed = 7919 * seed, variant = 'attack', horizon, budget, tail = 'straight', endlessCap = 30000, hardCap = 60000 } = {}) {
    const g = newGame(patterns, stage, { seed, endlessSeed });
    const bot = makeBot({ variant, horizon, budget, tail });
    const endless = stage >= STAGE_NUM;
    const played = [];
    const r = {
        stage, seed, endlessSeed, variant, horizon: bot.config.horizon, budget, tail,
        outcome: null, frames: 0, clearFrame: null, gameoverFrame: null, bossStart: null, bossFrames: 0,
        livesLost: 0, hitFrames: [], score: 0, kills: [0, 0, 0, 0], stars: 0, starScore: 0, lostStars: 0, extends: 0,
        sceneReached: 0, cpuSec: 0, bot: null,
    };
    const t0 = performance.now();
    let endAt = -1;
    while (g.status !== STATUS.TITLE && g.frame < hardCap) {
        let b;
        if (g.status === STATUS.IN_GAME) {
            if (g.scene === BOSS_SCENE && r.bossStart === null) r.bossStart = g.frame;
            if (r.bossStart !== null && g.frame - r.bossStart >= BOSS_CAP && (!endless || variant === 'no-attack')) { r.outcome = 'boss-cap'; break; }
            if (endless && g.frame >= endlessCap) { r.outcome = 'cap'; break; }
            b = bot(g);
        } else {
            // the end screen: let go of everything, then fire once it is allowed (moveEnd: after 128 frames)
            if (endAt < 0) endAt = g.frame;
            b = g.frame - endAt > 130 ? input(0, true, false) : 0;
        }
        played.push(b);
        for (const e of stepGame(g, b)) {
            switch (e[0]) {
                case 'kill': r.kills[e[1]]++; break;
                case 'hit': r.livesLost++; r.hitFrames.push(g.frame); break;
                case 'star': r.stars++; r.starScore += e[1]; break;
                case 'lostStar': r.lostStars++; break;
                case 'extend': r.extends++; break;
                case 'clear': r.clearFrame = g.frame; break;
                case 'gameover': r.gameoverFrame = g.frame; break;
            }
        }
        if (g.status === STATUS.IN_GAME && g.scene > r.sceneReached) r.sceneReached = g.scene;
    }
    if (!r.outcome) r.outcome = r.clearFrame !== null ? 'cleared' : r.gameoverFrame !== null ? 'game over' : g.status === STATUS.TITLE ? 'title' : 'hard cap';
    if (r.bossStart !== null) r.bossFrames = (r.gameoverFrame ?? r.clearFrame ?? g.frame) - r.bossStart;
    r.frames = g.frame;
    r.score = g.score;
    r.cpuSec = +((performance.now() - t0) / 1000).toFixed(2);
    const st = bot.stats;
    r.bot = { cost: Math.round(st.cost), steps: st.steps, costPerFrame: +(st.cost / Math.max(1, st.frames)).toFixed(1), maxFrameCost: Math.round(st.maxFrameCost),
        repairs: st.repairs, repairFails: st.repairFails, beams: st.beams, improves: st.improves };
    const tape = makeTape({ stage, seed, endlessSeed, played, extra: { player: `bot-${variant}`, bot: { variant, horizon: r.horizon, budget, ...(tail !== 'straight' ? { tail } : {}) } } });
    return { result: r, tape, game: g };
}
