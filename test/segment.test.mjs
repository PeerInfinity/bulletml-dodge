// node test/segment.test.mjs — slice N0: segments (a region of the Loops substrate) played by a bot, restart on a hit
import assert from 'node:assert/strict';
import { loadNoiz2saPatterns } from '../src/game/patterns-node.js';
import { STATUS } from '../src/game/noiz2sa-game.js';
import { replayTape } from '../src/game/tape.js';
import { settingByName, botOptions } from '../src/game/human.js';
import { runSegment, checkSpan, parsePosition, showPosition, attemptBotSeed, BOSS_SCENE } from '../src/game/segment-run.js';

const P = loadNoiz2saPatterns();
const botFor = (name) => { const { botSeed: _, ...b } = botOptions(settingByName(name)); return b; };
const strip = (r) => ({ ...r, cpuSec: 0 });

// 1. positions and spans
{
    assert.deepEqual(parsePosition('2:5'), { stage: 1, scene: 4 });
    assert.deepEqual(parsePosition('3:boss'), { stage: 2, scene: BOSS_SCENE });
    assert.deepEqual(parsePosition('endless:1'), { stage: 10, scene: 0 });
    assert.equal(showPosition({ stage: 2, scene: BOSS_SCENE }), '3:boss');
    assert.throws(() => parsePosition('2:10'), /scene/);
    assert.throws(() => parsePosition('11:1'), /unknown stage/);
    assert.equal(checkSpan({ stage: 1, scene: 8 }, { stage: 2, scene: 0 }), 2);
    assert.throws(() => checkSpan({ stage: 1, scene: 3 }, { stage: 1, scene: 2 }), /before its start/);
    assert.throws(() => checkSpan({ stage: 10, scene: 3 }, { stage: 11, scene: 0 }), /endless/);
    assert.equal(attemptBotSeed(7, 0), 7);
    assert.notEqual(attemptBotSeed(7, 1), attemptBotSeed(7, 2));
    console.log('ok positions and spans');
}

// 2. a humanlike bot on one scene: restarts on a hit, deterministic, and its tapes replay to the same ends
{
    const o = { start: { stage: 0, scene: 2 }, end: { stage: 0, scene: 2 }, bot: botFor('skill 20'), seed: 2, botSeed: 1, maxAttempts: 2, tapes: true };
    const a = runSegment(P, o), b = runSegment(P, o);
    assert.deepEqual(strip(a.result), strip(b.result), 'deterministic');
    assert.deepEqual(a.tapes, b.tapes);
    const r = a.result;
    assert.ok(r.attempts === 2, `skill 20 should need a retry here (attempts ${r.attempts}) — the test needs a failed attempt`);
    assert.equal(a.tapes.length, r.attempts, 'one game per attempt on a one-scene span');
    assert.equal(r.frames, r.runs.reduce((n, x) => n + x.frames, 0), 'the time spent includes every failed attempt');
    a.tapes.forEach((t, i) => {
        assert.equal(t.startScene, 2); assert.equal(t.hitbox, 'centered'); assert.equal(t.segment.attempt, i);
        let hits = 0;
        const g = replayTape(P, t, { onFrame: (_, ev) => { for (const e of ev) if (e[0] === 'hit') hits++; } });
        assert.equal(g.status, STATUS.IN_GAME);
        if (r.runs[i].cleared) { assert.equal(hits, 0); assert.ok(g.scene > 2, 'the cleared tape ends after its scene'); } else assert.equal(hits, 1, 'a failed tape ends at its hit');
    });
    console.log(`ok one scene (stage 1 scene 3, skill 20): ${r.cleared ? 'cleared' : 'not cleared'} on attempt ${r.attempts}, ${r.seconds} s spent; deterministic; ${a.tapes.length} tapes replay`);
}

// 3. a span across a boss: the Ace kills it and goes on into the next stage, deathless; two games, the score from the region's start
{
    const { result: r, tapes } = runSegment(P, { start: { stage: 0, scene: 8 }, end: { stage: 1, scene: 0 }, bot: botFor('Ace'), seed: 1, budget: 75, tapes: true }); // ⅛ of the page's budget: the Ace still never gets hit, and the boss costs ~1.6 ms/frame instead of ~25
    assert.ok(r.cleared && r.deathless && r.attempts === 1, JSON.stringify(r.runs));
    assert.deepEqual(tapes.map((t) => [t.stage, t.startScene ?? 0]), [[0, 8], [1, 0]]);
    assert.ok(tapes[0].frames > 1000 && tapes[1].frames >= 1000, 'a scene, the boss, then a scene');
    assert.equal(r.score, r.runs[0].score);
    assert.ok(r.score > 0);
    console.log(`ok across a boss (stage 1 scene 9 → stage 2 scene 1, the Ace at ⅛ budget): deathless, ${r.seconds} s (${tapes[0].frames} + ${tapes[1].frames} frames), score ${r.score}`);
}
