// node test/bot.test.mjs — the G4 bot: determinism, the worker's pattern hand-over, and a short survival check
import assert from 'node:assert/strict';
import { loadNoiz2saPatterns } from '../src/game/patterns-node.js';
import { newGame, stepGame, stateLine, STATUS } from '../src/game/noiz2sa-game.js';
import { packBulletML, unpackBulletML } from '../src/bulletml.js';
import { makeBot, BROWSER_BUDGET } from '../src/game/bot.js';
import { runBot } from '../src/game/bot-run.js';
import { tapeInputs, replayTape } from '../src/game/tape.js';

const P = loadNoiz2saPatterns();

// 1. the same seed + budget gives the same tape twice, and the tape replays to the bot's own game
for (const variant of ['attack', 'no-attack']) {
    const opts = { stage: 3, seed: 2, variant, horizon: 32, budget: BROWSER_BUDGET, hardCap: 1200 };
    const a = runBot(P, opts), b = runBot(P, opts);
    assert.equal(JSON.stringify(a.tape), JSON.stringify(b.tape), `${variant}: two runs gave different tapes`);
    assert.equal(stateLine(replayTape(P, a.tape)), stateLine(a.game), `${variant}: the tape does not replay to the run's game`);
    console.log(`ok ${variant}: same tape twice (stage 4 seed 2, ${a.tape.frames} frames, ${a.tape.inputs.length} runs), replays to the same state; score ${a.result.score}, lives lost ${a.result.livesLost}`);
}

// 2. a small budget (searches cut short by the bank) is reproducible too: the budget is a count, not a clock
{
    const opts = { stage: 9, seed: 1, variant: 'attack', horizon: 48, hardCap: 900 };
    const lo = runBot(P, { ...opts, budget: 100 }), again = runBot(P, { ...opts, budget: 100 });
    assert.equal(JSON.stringify(lo.tape), JSON.stringify(again.tape));
    console.log(`ok budget 100: reproducible too (cost ${lo.result.bot.cost} units over ${lo.tape.frames} frames, max ${lo.result.bot.maxFrameCost} in one frame)`);
}

// 3. patterns packed for the worker (postMessage = structured clone) play exactly as the parsed ones
{
    const W = {};
    for (const k of Object.keys(P)) W[k] = structuredClone(P[k].map(packBulletML)).map(unpackBulletML);
    const tape = runBot(P, { stage: 9, seed: 3, variant: 'attack', horizon: 16, budget: BROWSER_BUDGET, hardCap: 1500 }).tape;
    const inputs = tapeInputs(tape);
    const g1 = newGame(P, 9, { seed: 3, endlessSeed: 7919 * 3 }), g2 = newGame(W, 9, { seed: 3, endlessSeed: 7919 * 3 });
    for (const b of inputs) { stepGame(g1, b); stepGame(g2, b); assert.equal(stateLine(g2), stateLine(g1), `packed patterns diverge at frame ${g1.frame}`); }
    // and a bot on the packed patterns makes the same moves
    const h1 = newGame(P, 9, { seed: 3, endlessSeed: 7919 * 3 }), h2 = newGame(W, 9, { seed: 3, endlessSeed: 7919 * 3 });
    const b1 = makeBot({ horizon: 16 }), b2 = makeBot({ horizon: 16 });
    for (let f = 0; f < 600; f++) { const x = b1(h1), y = b2(h2); assert.equal(y, x, `bots differ at frame ${f}`); stepGame(h1, x); stepGame(h2, y); }
    console.log(`ok packed patterns (the worker's) replay ${inputs.length} frames of stage 10 state line for state line; the bots agree for 600 frames`);
}

// 4. a bot handed a game at another frame starts over from it (the page hands over mid-game)
{
    const g = newGame(P, 0, { seed: 1 });
    const bot = makeBot({ horizon: 8 });
    for (let f = 0; f < 50; f++) stepGame(g, bot(g));
    stepGame(g, 0); // someone else played a frame
    for (let f = 0; f < 50; f++) stepGame(g, bot(g));
    assert.equal(g.status, STATUS.IN_GAME);
    console.log('ok the bot follows a game that moved on without it');
}

// 5. slice H1: the Expert (observed perception) — the same seed + settings give the same tape twice, the tape replays,
//    and its model never reads the game's random generator (the game's rand() state is the same with or without it)
{
    for (const variant of ['attack', 'no-attack']) {
        const opts = { stage: 9, seed: 2, variant, perception: 'observed', horizon: 48, budget: BROWSER_BUDGET, hardCap: 1500 };
        const a = runBot(P, opts), b = runBot(P, opts);
        assert.equal(JSON.stringify(a.tape), JSON.stringify(b.tape), `observed ${variant}: two runs gave different tapes`);
        assert.equal(a.tape.bot.perception, 'observed');
        assert.equal(stateLine(replayTape(P, a.tape)), stateLine(a.game), `observed ${variant}: the tape does not replay to the run's game`);
        console.log(`ok Expert ${variant}: same tape twice (stage 10 seed 2, ${a.tape.frames} frames), replays to the same state; lives lost ${a.result.livesLost}, ${a.result.bot.surprises} surprises`);
    }
    const g = newGame(P, 9, { seed: 1 }), bot = makeBot({ perception: 'observed', horizon: 32 });
    for (let f = 0; f < 600; f++) {
        const r0 = JSON.stringify(g.rand), l0 = g.rnd;
        const b = bot(g);
        assert.equal(JSON.stringify(g.rand), r0, 'the observed bot touched the game\'s rand()');
        assert.equal(g.rnd, l0, 'the observed bot touched the stage LCG');
        stepGame(g, b);
    }
    console.log('ok the Expert reads the screen only: the game\'s generators are untouched by its decisions');
}
