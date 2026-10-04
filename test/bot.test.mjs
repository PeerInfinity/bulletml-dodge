// node test/bot.test.mjs — the G4 bot: determinism, the worker's pattern hand-over, and a short survival check
import assert from 'node:assert/strict';
import { loadNoiz2saPatterns } from '../src/game/patterns-node.js';
import { newGame, stepGame, stateLine, STATUS, SPC } from '../src/game/noiz2sa-game.js';
import { packBulletML, unpackBulletML } from '../src/bulletml.js';
import { makeBot, BROWSER_BUDGET, EXPERT_DEFAULTS, expertSettings, botOptionsFromTape } from '../src/game/bot.js';
import { stepModel, makeMargin, observe, newTracker, delayedModel, attendModel } from '../src/game/perception.js';
import { KNOBS, PRESETS, PRESET, EXPERT_KNOBS, PATH_LOW_KNOBS, HUMAN_KEYS, skillKnobs, pathKnobs, presetKnobs, skillPosition, SKILL_CURVE, settingByName, botOptions, makeRng, makeHands, snapKnob } from '../src/game/human.js';
import fs from 'node:fs';
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

// 6. slice H1b: the Expert's margin and attack settings — recorded in the tape; the margin's geometry; the Ace takes none
{
    const a = runBot(P, { stage: 9, seed: 2, variant: 'attack', perception: 'observed', horizon: 48, budget: BROWSER_BUDGET, hardCap: 600 });
    assert.deepEqual(a.tape.bot, { variant: 'attack', horizon: 48, budget: BROWSER_BUDGET, perception: 'observed', ...expertSettings(EXPERT_DEFAULTS) });
    // no settings at all (the H1 Expert) is a different player, and still reproducible
    const off = { stage: 9, seed: 2, variant: 'attack', perception: 'observed', horizon: 48, budget: BROWSER_BUDGET, hardCap: 600, expert: { margin: null, attackY: null } };
    const h1 = runBot(P, off), h1again = runBot(P, off);
    assert.equal(JSON.stringify(h1.tape), JSON.stringify(h1again.tape));
    assert.equal(h1.tape.bot.margin, undefined);
    assert.throws(() => makeBot({ perception: 'omniscient', margin: { bullet: 2, spawner: 8 } }));
    assert.throws(() => makeBot({ perception: 'omniscient', attackY: 200 }));
    assert.deepEqual(makeBot({}).config.margin, undefined, 'the Ace keeps no margin');
    // the geometry: a bullet passing 3 px to the side is not a hit but is inside a 4 px margin, outside a 2 px one;
    // an enemy 6 px away is inside an 8 px spawner margin; nothing counts while the ship is invincible
    const model = (o, invCnt = 0) => ({ model: true, frame: 0, status: STATUS.IN_GAME, scene: 1, endless: 0, left: 2, ship: { x: 160 * 256, y: 300 * 256, speed: 0, shotCnt: 0, invCnt },
        shots: [], foes: [{ slot: 0, spc: SPC.BULLET, type: 0, shield: 0, px: 0, py: 0, cnt: 5, k: 0, sp: 0, c: 1, s: 0, ds: 0, ax: 0, ay: 0, ...o }], bonuses: null, bonusScore: 10 });
    const passing = { x: 163 * 256, y: 290 * 256, mx: 0, my: 4 * 256 }; // moves down past the ship, 3 px to its side
    for (const [mg, near] of [[{ bullet: 4, spawner: 0 }, true], [{ bullet: 2, spawner: 0 }, false]]) {
        const m = model(passing);
        const hits = [];
        let wasNear = false;
        for (let f = 0; f < 8; f++) { hits.push(stepModel(m, 0, null, 0, makeMargin(mg))); wasNear ||= m.near; }
        assert.ok(!hits.some(Boolean), 'a bullet 3 px away does not hit');
        assert.equal(wasNear, near, `bullet margin ${mg.bullet} px`);
    }
    const enemy = { spc: SPC.FOE, type: 0, shield: 3, x: 166 * 256, y: 300 * 256, mx: 0, my: 0, cnt: 5 };
    let m = model(enemy); stepModel(m, 0, null, 0, makeMargin({ bullet: 0, spawner: 8 })); assert.equal(m.near, true, 'an enemy 6 px away is inside an 8 px spawner margin');
    m = model(enemy); stepModel(m, 0, null, 0, makeMargin({ bullet: 0, spawner: 5 })); assert.equal(m.near, false);
    m = model(enemy, 30); stepModel(m, 0, null, 0, makeMargin({ bullet: 0, spawner: 8 })); assert.equal(m.near, false, 'no margin while invincible');
    const dot = { spc: SPC.BULLET, x: 166 * 256, y: 300 * 256, mx: 0, my: 0, cnt: 0 }; // a bullet not yet moving is a spawner too
    m = model(dot); stepModel(m, 0, null, 0, makeMargin({ bullet: 2, spawner: 8 })); assert.equal(m.near, true, 'a dot not yet moving is kept at the spawner margin');
    console.log(`ok H1b: the tape records the Expert's settings ${JSON.stringify(expertSettings(EXPERT_DEFAULTS))}; the H1 Expert (none) is reproducible; the margin's geometry; the Ace takes no Expert settings`);
}

// 7. slice H2: the human limits
{
    // run a setting (a preset or "skill N") the way bin/h2-sweep.mjs does
    const runSetting = (name, o = {}) => {
        const st = settingByName(name), b = botOptions(st, { botSeed: o.botSeed ?? 1 });
        return runBot(P, { stage: o.stage ?? 2, seed: o.seed ?? 2, variant: o.variant ?? 'attack', budget: BROWSER_BUDGET, hardCap: o.hardCap ?? 1500,
            horizon: b.horizon, perception: b.perception, expert: b.perception === 'observed' ? { margin: b.margin, attackY: b.attackY } : {},
            starWeight: b.starWeight ?? 0, human: b.human ?? null, botSeed: b.botSeed ?? 1, personality: st.name });
    };
    // replay a tape's bot from the settings the tape carries
    const rerun = (tape, hardCap) => {
        const o = botOptionsFromTape(tape);
        return runBot(P, { stage: tape.stage, seed: tape.seed, endlessSeed: tape.endlessSeed, variant: o.variant, horizon: o.horizon, budget: o.budget, hardCap,
            perception: o.perception, expert: o.perception === 'observed' ? { margin: o.margin, attackY: o.attackY } : {}, starWeight: o.starWeight, human: o.human ?? null, botSeed: o.botSeed ?? 1,
            personality: tape.bot.personality ?? null });
    };

    // a. every preset (and two skill levels): the same tape twice; the tape replays; its own settings re-record it
    for (const name of [...PRESETS.map((p) => p.name), 'Panicky 90', 'skill 0', 'skill 50']) {
        const a = runSetting(name), b = runSetting(name);
        assert.equal(JSON.stringify(a.tape), JSON.stringify(b.tape), `${name}: two runs gave different tapes`);
        assert.equal(stateLine(replayTape(P, a.tape)), stateLine(a.game), `${name}: the tape does not replay to the run's game`);
        assert.equal(JSON.stringify(rerun(a.tape, 1500).tape), JSON.stringify(a.tape), `${name}: the tape's own settings do not re-record it`);
        const human = a.result.bot.human;
        console.log(`ok ${name}: same tape twice (stage 3 seed 2, ${a.tape.frames} frames), replays, re-records from its bot record ${JSON.stringify(a.tape.bot.human ?? null).slice(0, 60)}…; lives lost ${a.result.livesLost}${human ? `, ${human.lapses} lapses, ${human.overrides} inputs changed by its hands` : ''}`);
    }
    // b. the bot seed matters (its own generator), the game's generators are untouched by it
    {
        const a = runSetting('Distracted', { botSeed: 1 }), b = runSetting('Distracted', { botSeed: 2 });
        assert.notEqual(JSON.stringify(a.tape.inputs), JSON.stringify(b.tape.inputs), 'another bot seed, other moves');
        assert.equal(b.tape.bot.botSeed, 2);
        const st = botOptions(settingByName('Panicky'));
        const g = newGame(P, 5, { seed: 1 }), bot = makeBot({ ...st, gameSeed: 1 });
        for (let f = 0; f < 900; f++) {
            const r0 = JSON.stringify(g.rand), l0 = g.rnd;
            const x = bot(g);
            assert.equal(JSON.stringify(g.rand), r0, 'the humanlike bot touched the game\'s rand()');
            assert.equal(g.rnd, l0, 'the humanlike bot touched the stage LCG');
            stepGame(g, x);
        }
        // the generator: integer arithmetic, so the same numbers everywhere (pinned)
        const rng = makeRng(1, 1), xs = [rng(), rng(), rng()];
        assert.ok(xs.every((x) => x >= 0 && x < 1));
        assert.deepEqual(xs, (() => { const r = makeRng(1, 1); return [r(), r(), r()]; })());
        assert.notEqual(makeRng(1, 2)(), xs[0]); assert.notEqual(makeRng(2, 1)(), xs[0]);
        console.log(`ok another bot seed gives other moves; the humanlike bot never touches the game's generators; makeRng(1,1) → ${xs.map((x) => x.toFixed(6)).join(', ')}`);
    }
    // c. the defaults are the Expert and the Ace exactly: an H1b Expert tape and a G4 Ace tape re-record (their first 3000 frames)
    {
        for (const [file, name] of [['tapes/h1b/s01-attack-seed1-expert.json', 'Expert'], ['tapes/g4/s01-attack-seed1-b1x.json', 'Ace']]) {
            const want = JSON.parse(fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));
            const N = 3000;
            const got = runSetting(name, { stage: want.stage, seed: want.seed, hardCap: N });
            assert.deepEqual(tapeInputs(got.tape), tapeInputs(want).slice(0, N), `${name} with the default knobs differs from ${file}`);
            const { personality, ...rec } = got.tape.bot;
            assert.equal(personality, name);
            assert.deepEqual(rec, want.bot, `${name}: the tape's bot record`);
            assert.equal(got.tape.bot.human, undefined);
        }
        // the human knobs at the Expert's values are no human layer at all
        assert.equal(makeBot({ perception: 'observed', human: Object.fromEntries(HUMAN_KEYS.map((k) => [k, EXPERT_KNOBS[k]])) }).config.human, undefined);
        assert.throws(() => makeBot({ perception: 'omniscient', human: { reaction: 10 } }), /observed/);
        assert.throws(() => makeBot({ perception: 'observed', human: { reactoin: 10 } }), /unknown human knob/);
        console.log('ok the default knobs re-record the H1b Expert (tapes/h1b) and the G4 Ace (tapes/g4) input for input; human knobs need perception "observed"');
    }
    // d. the presets and the slider: every knob set, on its grid; the slider's ends are the beginner and the Expert, and every
    //    skill-ordered knob moves one way only (a lower skill is never better on any of them)
    {
        for (const p of PRESETS) for (const k of KNOBS) {
            const v = p.knobs[k.key];
            assert.ok(v !== undefined, `${p.name}: no ${k.key}`);
            assert.equal(snapKnob(k.key, v), v, `${p.name}: ${k.key} = ${v} is off its grid / range`);
        }
        assert.deepEqual(skillKnobs(100), PRESETS.find((p) => p.name === 'Expert').knobs);
        assert.deepEqual(skillKnobs(0), { ...PATH_LOW_KNOBS });
        let prev = skillKnobs(0);
        for (let s = 1; s <= 100; s++) {
            const cur = skillKnobs(s);
            for (const k of KNOBS) if (k.skill) assert.ok(k.skill > 0 ? cur[k.key] >= prev[k.key] : cur[k.key] <= prev[k.key], `skill ${s}: ${k.key} ${prev[k.key]} → ${cur[k.key]} goes the wrong way`);
            prev = cur;
        }
        // the slider's curve (H3): from (0, 0) to (100, 100), rising in both; skill s is the path at its position
        assert.deepEqual(SKILL_CURVE[0], [0, 0]);
        assert.deepEqual(SKILL_CURVE[SKILL_CURVE.length - 1], [100, 100]);
        for (let i = 1; i < SKILL_CURVE.length; i++) assert.ok(SKILL_CURVE[i][0] > SKILL_CURVE[i - 1][0] && SKILL_CURVE[i][1] > SKILL_CURVE[i - 1][1], `SKILL_CURVE point ${i} does not rise`);
        for (const s of [0, 13, 50, 87, 100]) assert.deepEqual(skillKnobs(s), pathKnobs(skillPosition(s)));
        assert.deepEqual(settingByName('path 100').knobs, PRESETS.find((p) => p.name === 'Expert').knobs);
        // every human preset is at most the Expert on every skill-ordered knob
        for (const p of PRESETS.filter((q) => q.perception === 'observed')) for (const k of KNOBS) if (k.skill) {
            assert.ok(k.skill > 0 ? p.knobs[k.key] <= k.expert : p.knobs[k.key] >= k.expert, `${p.name}: ${k.key} beyond the Expert's`);
        }
        // H3b: the personalities are biases on the slider: at every skill on their grids, never beyond the Expert, every
        // skill-ordered knob one way with skill; their menu knobs are those at skill 50; Steady at 100 is the Expert, the
        // others are not; "Panicky 70" names one at a skill
        const persons = PRESETS.filter((p) => p.bias);
        assert.deepEqual(persons.map((p) => p.name), ['Steady', 'Score chaser', 'Cautious', 'Panicky', 'Tunnel vision', 'Distracted']);
        for (const p of persons) {
            assert.deepEqual(p.knobs, presetKnobs(p.name, 50), `${p.name}: its menu knobs are not those at skill 50`);
            let before = null;
            for (let s = 0; s <= 100; s++) {
                const cur = presetKnobs(p.name, s);
                for (const k of KNOBS) {
                    assert.equal(snapKnob(k.key, cur[k.key]), cur[k.key], `${p.name} ${s}: ${k.key} off its grid`);
                    if (!k.skill) continue;
                    assert.ok(k.skill > 0 ? cur[k.key] <= k.expert : cur[k.key] >= k.expert, `${p.name} ${s}: ${k.key} beyond the Expert's`);
                    if (before) assert.ok(k.skill > 0 ? cur[k.key] >= before[k.key] : cur[k.key] <= before[k.key], `${p.name} ${s}: ${k.key} ${before[k.key]} → ${cur[k.key]} goes the wrong way`);
                }
                before = cur;
            }
            if (p.name === 'Steady') assert.deepEqual(presetKnobs(p.name, 100), { ...EXPERT_KNOBS });
            else assert.notDeepEqual(presetKnobs(p.name, 100), { ...EXPERT_KNOBS }, `${p.name}: its bias is gone at skill 100`);
        }
        assert.deepEqual(settingByName('panicky 70'), { name: 'Panicky 70', perception: 'observed', knobs: presetKnobs('Panicky', 70) });
        assert.deepEqual(settingByName('Tunnel vision').knobs, presetKnobs('Tunnel vision', 50));
        assert.throws(() => settingByName('Expert 70'), /unknown bot setting/);
        console.log(`ok ${PRESETS.length} presets × ${KNOBS.length} knobs on their grids; the slider runs the beginner (0) → Expert (100), every skill-ordered knob one way; ${persons.length} personalities as biases at skill 0–100, one way, never beyond the Expert, Steady = the Expert at 100`);
    }
    // e. the hands: the minimum hold, the rate cap, the overshoot
    {
        const E = 16; // fire, no direction
        const run = (h, plan, seed = 1) => { const hands = makeHands({ ...EXPERT_KNOBS, ...h }, makeRng(seed, 1)); return plan.map((b, f) => hands(b, 0, f)); };
        const zig = Array.from({ length: 20 }, (_, f) => E | (f % 2 ? 3 : 7)); // E, W, E, W, … every frame
        assert.deepEqual(run({}, zig), zig, 'the Expert\'s hands press what is planned');
        const held = run({ minHold: 4 }, zig);
        for (let f = 0, since = 0; f < held.length; f++) { if (f && held[f] !== held[f - 1]) { assert.ok(since >= 4, `changed after ${since} frames`); since = 1; } else since++; }
        const capped = run({ maxRate: 5 }, Array.from({ length: 125 }, (_, f) => E | (f % 2 ? 3 : 7)));
        const changes = capped.filter((b, f) => f && b !== capped[f - 1]).length;
        assert.ok(changes <= 10 && changes >= 8, `5 changes per second over 2 s: ${changes}`);
        const over = run({ overshootP: 1, overshootFrames: 3 }, [E | 3, E | 3, E | 3, E, E, E, E, E]);
        assert.equal(over[3], E | 3, 'with overshoot, a direction let go of is held on');
        assert.equal(over[7], E, 'and let go of after at most 3 frames');
        console.log(`ok the hands: a ${4}-frame minimum hold, ≤ 5 changes per second (${changes} in 2 s), an overshoot of up to 3 frames`);
    }
    // f. what it sees: the picture n frames late, carried forward, equals the fresh one for bullets that kept their motion;
    //    attention keeps the enemies and the nearest bullets
    {
        const g = newGame(P, 2, { seed: 1 }), tr = newTracker(), bot = makeBot({ horizon: 8 });
        const pics = [];
        for (let f = 0; f < 700; f++) { pics.push(observe(g, tr)); stepGame(g, bot(g)); }
        const n = 6, now = pics[pics.length - 1], late = delayedModel(pics[pics.length - 1 - n], now, n);
        assert.equal(late.frame, now.frame); assert.deepEqual(late.ship, now.ship);
        assert.equal(delayedModel(now, now, 0).foes.length, now.foes.length);
        const bySlot = new Map(now.foes.map((o) => [o.slot, o]));
        let same = 0, moving = 0;
        for (const o of late.foes) {
            const q = bySlot.get(o.slot);
            if (!q || q.spc === SPC.FOE || o.k !== 0 || o.cnt <= n + 1) continue;
            moving++;
            if (Math.abs(q.x - o.x) < 1 && Math.abs(q.y - o.y) < 1) same++;
        }
        assert.ok(moving > 5 && same / moving > 0.8, `straight-moving bullets carried forward ${n} frames land where they are (${same}/${moving})`);
        const a = attendModel(now, 80, 5);
        const bullets = a.foes.filter((o) => o.spc !== SPC.FOE);
        assert.ok(bullets.length <= 5);
        for (const o of bullets) assert.ok(Math.hypot(o.x - now.ship.x, o.y - now.ship.y) <= 80 * 256);
        assert.equal(a.foes.filter((o) => o.spc === SPC.FOE).length, now.foes.filter((o) => o.spc === SPC.FOE).length, 'enemies are always seen');
        // a negative bullet clearance: the bot thinks the hit area smaller — a bullet 1.5 px away is a hit only for the engine
        const mg = makeMargin({ bullet: -1, spawner: 0, top: 0 });
        assert.ok(mg && mg.hit2 === 256 * 256);
        console.log(`ok the late picture (${n} frames) puts ${same}/${moving} straight bullets where they are now; attention keeps ${bullets.length} bullets within 80 px and every enemy`);
    }
}
