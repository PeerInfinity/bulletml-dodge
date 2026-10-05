// node test/tracks.test.mjs — slice N2: the four tracks and the training economy (src/game/tracks.js)
import assert from 'node:assert/strict';
import { KNOBS, TRACKS, EXPERT_KNOBS, skillKnobs, trackKnobs, settingByName } from '../src/game/human.js';
import { newTrainer, earn, buyStep, respec, setStrategy, takeSurplus, stepCost, atCeiling, trainerKnobs, STRATEGIES, TRACK_MAX } from '../src/game/tracks.js';

// 1. the tracks → the knobs: equal tracks = the slider, all 100 = the Expert, one track moves only its group
{
    assert.deepEqual(TRACKS, ['seeing', 'thinking', 'hands', 'panic']);
    assert.deepEqual(new Set(KNOBS.map((k) => k.group)), new Set(TRACKS), 'every knob is in a track');
    for (const s of [0, 15, 40, 77, 100]) assert.deepEqual(trackKnobs(Object.fromEntries(TRACKS.map((t) => [t, s]))), skillKnobs(s), `equal tracks ${s} = skill ${s}`);
    assert.deepEqual(trackKnobs({ seeing: 100, thinking: 100, hands: 100, panic: 100 }), { ...EXPERT_KNOBS });
    const base = trackKnobs({ seeing: 30, thinking: 30, hands: 30, panic: 30 });
    for (const t of TRACKS) {
        const up = trackKnobs({ seeing: 30, thinking: 30, hands: 30, panic: 30, [t]: 90 });
        for (const k of KNOBS) if (k.group !== t) assert.equal(up[k.key], base[k.key], `${t} moved ${k.key}`);
        assert.ok(KNOBS.some((k) => k.group === t && up[k.key] !== base[k.key]), `${t} moves its own knobs`);
    }
    assert.deepEqual(settingByName('tracks 10/20/30/40').knobs, trackKnobs({ seeing: 10, thinking: 20, hands: 30, panic: 40 }));
    assert.equal(trackKnobs({}, { marginBullet: 5 }).marginBullet, 5, 'a tactic sets a habit');
    assert.throws(() => trackKnobs({}, { reaction: 3 }), /a skill, not a tactic/);
    console.log('ok tracks: equal tracks = the slider, all 100 = the Expert, each track moves only its own group');
}

// 2. the economy: points from seconds and score, the strategies, a free respec, the surplus at the ceiling
{
    const settings = { pointsPerSecond: 1, pointsPerScore: 0.001, stepBase: 1, stepGrowth: 1 }; // every step costs 1
    const tr = newTrainer({ settings });
    assert.equal(tr.strategy, 'even');
    assert.equal(earn(tr, { seconds: 10, score: 2000 }), 12);
    assert.deepEqual(tr.tracks, { seeing: 3, thinking: 3, hands: 3, panic: 3 }, 'Even raises the lowest track, in TRACKS order');
    assert.equal(tr.unspent, 0); assert.equal(tr.spent, 12);
    setStrategy(tr, 'hands-first');
    earn(tr, { seconds: 5 });
    assert.equal(tr.tracks.hands, 8, 'one track first');
    const before = tr.spent;
    setStrategy(tr, 'manual');
    respec(tr);
    assert.deepEqual(tr.tracks, { seeing: 0, thinking: 0, hands: 0, panic: 0 });
    assert.equal(tr.unspent, before, 'a respec gives every point back');
    assert.ok(buyStep(tr, 'panic') && tr.tracks.panic === 1);
    assert.throws(() => buyStep(tr, 'luck'), /unknown track/);
    setStrategy(tr, 'even');
    assert.equal(tr.unspent, 0, 'switching spends at once');
    earn(tr, { seconds: 4 * TRACK_MAX }); // more than the ceiling costs
    assert.ok(atCeiling(tr));
    assert.equal(tr.surplus, tr.earned - 4 * TRACK_MAX);
    assert.equal(takeSurplus(tr), tr.earned - 4 * TRACK_MAX);
    assert.equal(tr.surplus, 0);
    assert.deepEqual(trainerKnobs(tr), { ...EXPERT_KNOBS });
    assert.deepEqual(JSON.parse(JSON.stringify(tr)), tr, 'a trainer is plain data');
    assert.throws(() => newTrainer({ strategy: 'Panicky' }), /unknown strategy/);
    assert.deepEqual(STRATEGIES, ['even', 'seeing-first', 'thinking-first', 'hands-first', 'panic-first', 'manual']);
    // prices rise with the position (the defaults); a trainer made at positions has paid for them
    const d = newTrainer();
    assert.ok(stepCost(d.settings, 50) > stepCost(d.settings, 0));
    const at = newTrainer({ settings, tracks: { seeing: 5 } });
    assert.equal(at.spent, 5);
    console.log('ok training: points from seconds and score, Even and one-track-first, a free respec, surplus at the ceiling');
}
