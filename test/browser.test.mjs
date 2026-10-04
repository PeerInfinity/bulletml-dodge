// npm run test:browser — the browser page (play.html) against Node, in headless Chromium:
//  1. browser = Node: tapes replayed in the page's engine end on the same state line as bin/play-game.mjs --dump;
//  2. a scripted keyboard game: stage select, movement, shots, the panel, pause, the bot toggle, Esc, and the
//     recorded tape (it replays to the state the game was in, and downloads in the play-game format);
//  3. screenshots of stage select, play and a stage clear → docs/g3-screens/.
// It serves the repository itself on a free port. Needs `npm install` (playwright) and its Chromium.
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { loadNoiz2saPatterns } from '../src/game/patterns-node.js';
import { newGame, stepGame, stateLine, STATUS } from '../src/game/noiz2sa-game.js';
import { makeBot, BROWSER_BUDGET, DEFAULT_HORIZON, EXPERT_DEFAULTS, expertSettings, botOptionsFromTape } from '../src/game/bot.js';
import { PRESET, skillKnobs, presetKnobs, humanDiff } from '../src/game/human.js';
import { tapeInputs, replayTape } from '../src/game/tape.js';

const root = new URL('..', import.meta.url).pathname;
const shots = path.join(root, 'docs/g3-screens');
const TAPES = ['s01-lookahead-seed1', 's10-lookahead-seed1', 's11-lookahead-seed1', 's07-chase-seed2', 's13-random-seed1', 's14-fire-stay-seed1'];

execFileSync(process.execPath, [path.join(root, 'bin/build-web-index.mjs'), '--check'], { stdio: 'inherit' });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
    '.xml': 'text/xml', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.png': 'image/png', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
    const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/play.html`;

const browser = await chromium.launch();
const errors = [];
let failed = false;
try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 960 }, acceptDownloads: true });
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(url);
    await page.evaluate(() => window.noiz.ready);
    const state = () => page.evaluate(() => window.noiz.state());
    const waitFrames = async (n) => {
        const f0 = (await state()).game.frame;
        await page.waitForFunction((f) => window.noiz.state().game?.frame >= f, f0 + n, { timeout: 60000 });
    };

    // ── 1. browser = Node ──
    for (const name of TAPES) {
        const file = path.join(root, 'tapes', `${name}.json`);
        const tape = JSON.parse(fs.readFileSync(file, 'utf8'));
        const dump = path.join(root, 'results', `.browser-check-${name}.txt`);
        execFileSync(process.execPath, [path.join(root, 'bin/play-game.mjs'), '--tape', file, '--dump', dump]);
        const lines = fs.readFileSync(dump, 'utf8').trimEnd().split('\n');
        fs.unlinkSync(dump);
        const node = lines[lines.length - 1];
        const web = await page.evaluate((t) => window.noiz.replayFast(t), tape);
        assert.equal(web.stateLine, node, `${name}: browser and Node differ`);
        console.log(`ok browser = Node  ${name}: ${web.frames} frames in ${web.ms.toFixed(0)} ms — ${node.split(' ').slice(1, 6).join(' ')}`);
    }

    // ── 2. keyboard ──
    let s = await state();
    assert.equal(s.mode, 'select');
    assert.equal(await page.locator('#select').isVisible(), true, 'the stage select overlay shows');
    await page.locator('#wrap').screenshot({ path: path.join(shots, 'stage-select.png') });
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowLeft');
    assert.equal((await state()).sel, 1, 'arrow keys move the selection');
    await page.keyboard.press('ArrowLeft');
    await page.evaluate(() => { document.getElementById('seed').value = '42'; });
    await page.keyboard.press('KeyZ');
    s = await state();
    assert.equal(s.mode, 'play'); assert.equal(s.game.frame < 30, true);
    assert.equal(await page.locator('#select').isHidden(), true, 'the stage select overlay hides in play');
    const x0 = s.game.shipX;
    await page.keyboard.down('KeyZ'); await page.keyboard.down('ArrowLeft');
    await waitFrames(60);
    s = await state();
    assert.ok(s.game.shipX < x0, `left arrow moves the ship (${x0} → ${s.game.shipX})`);
    assert.ok(s.game.shots > 0, 'Z fires shots');
    await page.keyboard.up('ArrowLeft'); await page.keyboard.down('ArrowRight');
    await waitFrames(60);
    const x1 = (await state()).game.shipX;
    assert.ok(x1 > s.game.shipX, 'right arrow moves the ship back');
    await page.keyboard.up('ArrowRight');
    // the sounds: a key press unlocked audio; all 7 effects decode, and stage 1 (index 0) plays stg1.ogg (index%5+1, noiz2sa.c)
    await page.waitForFunction(() => window.noiz.sound().decoded === 7, null, { timeout: 20000 });
    const snd = await page.evaluate(() => window.noiz.sound());
    assert.equal(snd.music, 'stg1.ogg');
    console.log(`ok sound: ${snd.decoded}/7 effects decoded, audio context ${snd.context}, music ${snd.music} (${snd.musicPaused ? 'paused' : 'playing'})`);

    // the panel redraws as the game runs (the frame counter, right panel)
    const panelPixels = (x, y, w, h) => page.evaluate(([x, y, w, h]) => document.getElementById('screen').getContext('2d').getImageData(x, y, w, h).data.join(), [x, y, w, h]);
    const r0 = await panelPixels(480, 200, 160, 50);
    await waitFrames(30);
    assert.notEqual(await panelPixels(480, 200, 160, 50), r0, 'the panel frame counter redraws');
    s = await state();
    console.log(`ok keyboard: ship moved ${x0} → ${x1}, shots fired, panel redrawn (frame ${s.game.frame})`);
    await page.keyboard.up('KeyZ');

    // bot toggle: B hands control to the default policy (the G4 bot, attack, in its worker), which moves the ship
    // with no key held, survives, and kills something, so the score panel changes too
    const p0 = await panelPixels(0, 0, 160, 130);
    const score0 = s.game.score;
    await page.keyboard.press('KeyB');
    s = await state();
    assert.equal(s.bot, true);
    const bx = s.game.shipX, by = s.game.shipY, bf = s.game.frame, bt = Date.now();
    await waitFrames(240);
    s = await state();
    const botRate = (s.game.frame - bf) / ((Date.now() - bt) / 1000);
    assert.ok(s.game.shipX !== bx || s.game.shipY !== by, 'the bot moves the ship');
    await page.waitForFunction((sc) => window.noiz.state().game.score > sc, score0, { timeout: 90000 });
    assert.notEqual(await panelPixels(0, 0, 160, 130), p0, 'the score panel redraws');
    s = await state();
    await page.locator('#wrap').screenshot({ path: path.join(shots, 'play.png') });
    await page.keyboard.press('KeyB');
    assert.equal((await state()).bot, false);
    console.log(`ok bot toggle: ${s.policy} moved the ship (${bx},${by}) → (${s.game.shipX},${s.game.shipY}) with no key held; score ${score0} → ${s.game.score} at frame ${s.game.frame}; ${botRate.toFixed(0)} frames/s with the bot on (the game's rate is 62.5)`);

    // pause / unpause
    await page.keyboard.press('KeyP');
    const fp = (await state()).game.frame;
    await page.waitForTimeout(400);
    s = await state();
    assert.equal(s.paused, true); assert.equal(s.game.frame, fp, 'no frames while paused');
    await page.keyboard.press('KeyP');
    await waitFrames(10);
    console.log(`ok pause holds the frame at ${fp} for 400 ms; unpause resumes`);

    // Esc back to stage select (paused first, so the state line is the last frame played); the tape replays to it
    await page.keyboard.press('KeyP');
    const live = (await state()).game.line;
    await page.keyboard.press('Escape');
    s = await state();
    assert.equal(s.mode, 'select', 'Esc returns to stage select');
    assert.equal(s.lastTape.seed, 42); assert.equal(s.lastTape.stage, 0);
    const tape = await page.evaluate(() => window.noiz.lastTape());
    const back = await page.evaluate((t) => window.noiz.replayFast(t), tape);
    assert.equal(back.stateLine, live, 'the recorded tape replays to the state the game was in');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#download')]);
    const saved = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
    assert.deepEqual(Object.keys(saved).slice(0, 6), ['game', 'stage', 'seed', 'endlessSeed', 'frames', 'inputs']);
    assert.equal(saved.frames, tape.frames);
    // and Node replays the downloaded tape to the same state
    const tmp = path.join(root, 'results', '.browser-check-download.json');
    fs.writeFileSync(tmp, JSON.stringify(saved));
    const nodeDump = tmp.replace(/json$/, 'txt');
    execFileSync(process.execPath, [path.join(root, 'bin/play-game.mjs'), '--tape', tmp, '--dump', nodeDump]);
    const nodeLast = fs.readFileSync(nodeDump, 'utf8').trimEnd().split('\n').pop();
    fs.unlinkSync(tmp); fs.unlinkSync(nodeDump);
    assert.equal(nodeLast, live, 'Node replays the downloaded tape to the same state');
    console.log(`ok Esc → stage select; tape (${tape.frames} frames, seed ${tape.seed}, ${dl.suggestedFilename()}) replays to the live state in the page and in Node`);

    // ── 2b. the G4 bot in a busy scene: the game keeps full speed, and the page plays exactly Node's moves ──
    {
        const src = JSON.parse(fs.readFileSync(path.join(root, 'tapes/s10-lookahead-seed1.json'), 'utf8'));
        const FROM = 8900; // stage 10's busiest stretch (~400 live bullets and enemies), in the boss scene
        const prefix = tapeInputs(src).slice(0, FROM);
        await page.keyboard.press('KeyB'); // the bot on from stage select, so it plays from the first frame after the prefix
        await page.evaluate(([t, prefix]) => { window.noiz.setPolicy('bot: attack'); window.noiz.startStage(t.stage, { seed: t.seed, endlessSeed: t.endlessSeed, prefix }); }, [src, prefix]);
        s = await state();
        assert.equal(s.bot, true); assert.ok(s.game.frame >= FROM);
        await page.waitForFunction((f) => window.noiz.state().game.frame >= f, FROM + 60, { timeout: 30000 }); // warm-up
        const s1 = await state(), f1 = s1.game.frame, t1 = Date.now();
        assert.equal(s1.g4.stalls, 0, 'the start-up hold leaves no wait at the bot\'s start');
        assert.ok(await page.evaluate(() => [...document.querySelectorAll('#budget option')].some((o) => o.value === '0.5')), 'a ½× budget option');
        await page.waitForTimeout(6000);
        s = await state();
        const fps = (s.game.frame - f1) / ((Date.now() - t1) / 1000);
        await page.keyboard.press('KeyP');
        fs.mkdirSync(path.join(root, 'docs/g4-screens'), { recursive: true });
        await page.locator('#wrap').screenshot({ path: path.join(root, 'docs/g4-screens/bot-busy.png') });
        s = await state();
        const g4 = s.g4;
        console.log(`ok G4 bot (attack, horizon ${DEFAULT_HORIZON}, budget ${BROWSER_BUDGET}) from stage 10 frame ${FROM}: ${fps.toFixed(1)} frames/s (the game's rate is 62.5); worker CPU ${g4.meanMs.toFixed(1)} ms/frame mean (last 600 frames), ${g4.maxMs.toFixed(0)} ms max, ${(g4.msPerUnit * 1000).toFixed(1)} µs per budget unit; ${g4.stalls - s1.g4.stalls} waits in the measured 6 s (${s1.g4.stalls} at the start: the game holds until the worker is 60 frames ahead); ${s.game.left} ships left`);
        assert.ok(fps >= 58, `the game keeps ≥ 58 frames/s with the bot on in a busy scene (got ${fps.toFixed(1)})`);
        await page.keyboard.press('Escape');
        const tape = await page.evaluate(() => window.noiz.lastTape());
        assert.deepEqual(tape.bot, { variant: 'attack', horizon: DEFAULT_HORIZON, budget: BROWSER_BUDGET });
        // Node: the same prefix, then makeBot with the same settings, must choose the very same inputs
        const inputs = tapeInputs(tape);
        assert.deepEqual(inputs.slice(0, FROM), prefix);
        const g = newGame(loadNoiz2saPatterns(), tape.stage, { seed: tape.seed, endlessSeed: tape.endlessSeed });
        for (const b of prefix) stepGame(g, b);
        const bot = makeBot({ variant: 'attack', horizon: DEFAULT_HORIZON, budget: BROWSER_BUDGET });
        for (let f = FROM; f < inputs.length && g.status === STATUS.IN_GAME; f++) {
            const b = bot(g);
            assert.equal(b, inputs[f], `the page's bot and Node's differ at frame ${f}`);
            stepGame(g, b);
        }
        console.log(`ok the page's bot played ${inputs.length - FROM} frames, input for input what Node's bot plays`);
    }

    // ── 2c. the H1 Expert (observed perception) in the same busy scene: full speed, and Node's moves input for input ──
    {
        const src = JSON.parse(fs.readFileSync(path.join(root, 'tapes/s10-lookahead-seed1.json'), 'utf8'));
        const FROM = 8900;
        const prefix = tapeInputs(src).slice(0, FROM);
        // the bot is still on from 2b
        await page.evaluate(([t, prefix]) => { window.noiz.setPolicy('bot: expert attack'); window.noiz.startStage(t.stage, { seed: t.seed, endlessSeed: t.endlessSeed, prefix }); }, [src, prefix]);
        s = await state();
        assert.equal(s.bot, true); assert.equal(s.policy, 'bot: expert attack');
        await page.waitForFunction((f) => window.noiz.state().game.frame >= f, FROM + 60, { timeout: 30000 });
        const s1 = await state(), f1 = s1.game.frame, t1 = Date.now();
        await page.waitForTimeout(6000);
        s = await state();
        const fps = (s.game.frame - f1) / ((Date.now() - t1) / 1000);
        const g4 = s.g4;
        console.log(`ok Expert (attack, observed, horizon ${DEFAULT_HORIZON}, budget ${BROWSER_BUDGET}) from stage 10 frame ${FROM}: ${fps.toFixed(1)} frames/s; worker CPU ${g4.meanMs.toFixed(1)} ms/frame mean, ${g4.maxMs.toFixed(0)} ms max; ${g4.stalls - s1.g4.stalls} waits in the measured 6 s; ${s.game.left} ships left`);
        assert.ok(fps >= 58, `the game keeps ≥ 58 frames/s with the Expert on in a busy scene (got ${fps.toFixed(1)})`);
        await page.keyboard.press('Escape');
        const tape = await page.evaluate(() => window.noiz.lastTape());
        assert.deepEqual(tape.bot, { variant: 'attack', horizon: DEFAULT_HORIZON, budget: BROWSER_BUDGET, perception: 'observed', ...expertSettings(EXPERT_DEFAULTS) });
        assert.equal(tape.player, 'human+bot-expert-attack');
        const inputs = tapeInputs(tape);
        assert.deepEqual(inputs.slice(0, FROM), prefix);
        const g = newGame(loadNoiz2saPatterns(), tape.stage, { seed: tape.seed, endlessSeed: tape.endlessSeed });
        for (const b of prefix) stepGame(g, b);
        const bot = makeBot({ variant: 'attack', horizon: DEFAULT_HORIZON, budget: BROWSER_BUDGET, perception: 'observed' });
        for (let f = FROM; f < inputs.length && g.status === STATUS.IN_GAME; f++) {
            const b = bot(g);
            assert.equal(b, inputs[f], `the page's Expert and Node's differ at frame ${f}`);
            stepGame(g, b);
        }
        console.log(`ok the page's Expert played ${inputs.length - FROM} frames, input for input what Node's Expert plays`);
    }

    // ── 2d. slice H2: the humanlike bot — two personalities and a skill level, from the menu / slider; the tape records
    //        the setting, and Node's bot built from the tape's record plays the page's moves input for input ──
    {
        // the bot seed: empty field = a new random seed every game; a number = that seed every game
        await page.evaluate(() => window.noiz.setKnob('botSeed', ''));
        const seeds = [];
        for (let i = 0; i < 3; i++) { await page.evaluate(() => window.noiz.startStage(0, { seed: 1, endlessSeed: 7919 })); seeds.push((await page.evaluate(() => window.noiz.botSetting())).botSeed); }
        assert.ok(new Set(seeds).size > 1, `random bot seeds differ between games (${seeds})`);
        await page.evaluate(() => window.noiz.setKnob('botSeed', '77'));
        await page.evaluate(() => window.noiz.startStage(0, { seed: 1, endlessSeed: 7919 }));
        assert.equal((await page.evaluate(() => window.noiz.botSetting())).botSeed, 77, 'a fixed bot seed is used');
        assert.equal(await page.evaluate(() => document.getElementById('knob-botSeed').value), '77');
        await page.evaluate(() => window.noiz.setKnob('botSeed', ''));
        // the knob rows: every box and every unit at the same x within its column
        const xs = await page.evaluate(() => {
            document.getElementById('advanced').open = true;
            const rows = [...document.querySelectorAll('#knobs label')].map((l) => { const [n, i, u] = l.children; return { left: Math.round(l.getBoundingClientRect().left), box: Math.round(i.getBoundingClientRect().left - l.getBoundingClientRect().left), unit: Math.round(u.getBoundingClientRect().left - l.getBoundingClientRect().left) }; });
            document.getElementById('advanced').open = false;
            return rows;
        });
        const off = new Set(xs.map((r) => `${r.box},${r.unit}`));
        assert.equal(off.size, 1, `every knob row has its box and unit at the same offsets (${[...off]})`);
        console.log(`ok bot seed: random per game (${seeds.join(', ')}), fixed when set (77); ${xs.length} knob rows aligned (box at +${xs[0].box}px, unit at +${xs[0].unit}px)`);
    }
    // H3b: a personality starts at skill 50 and keeps its biases when the slider moves; on the Expert the slider alone
    for (const [how, arg, stage, seed] of [['preset', 'Distracted', 2, 5], ['preset', 'Panicky 80', 5, 3], ['skill', 30, 0, 4]]) {
        const [name, sk] = how === 'preset' ? [arg.replace(/ \d+$/, ''), Number(/\d+$/.exec(arg)?.[0] ?? 50)] : [null, arg];
        if (how === 'skill') await page.evaluate(() => window.noiz.setPersonality('Expert'));
        await page.evaluate(([how, name, sk]) => { if (how === 'preset') { window.noiz.setPersonality(name); if (sk !== 50) window.noiz.setSkill(sk); } else window.noiz.setSkill(sk); }, [how, name, sk]);
        const set = await page.evaluate(() => window.noiz.botSetting());
        if (how === 'skill') {
            assert.equal(set.menuText, `custom (skill ${arg})`, 'the slider on the Expert puts the menu on "custom (skill N)"');
            assert.deepEqual(set.knobs, skillKnobs(arg));
        } else {
            assert.equal(set.persona, name, 'the slider keeps the personality'); assert.equal(set.skill, sk);
            assert.deepEqual(set.knobs, presetKnobs(name, sk));
            if (sk === 50) assert.deepEqual(set.knobs, PRESET[name].knobs);
        }
        s = await state();
        assert.equal(s.policy, 'bot: personality attack', 'a personality plays as "bot: personality …"');
        assert.equal(await page.evaluate(() => document.getElementById('horizon').disabled), true, 'its look-ahead is its horizon knob');
        await page.evaluate(([stage, seed]) => window.noiz.startStage(stage, { seed, endlessSeed: 7919 * seed }), [stage, seed]);
        s = await state();
        assert.equal(s.bot, true);
        const TO = 900;
        await page.waitForFunction((f) => window.noiz.state().game.frame >= f || window.noiz.state().game.status !== 1, TO, { timeout: 60000 });
        await page.keyboard.press('Escape');
        const tape = await page.evaluate(() => window.noiz.lastTape());
        const label = how === 'skill' ? `skill ${arg}` : `${name} ${sk}`;
        assert.equal(tape.bot.personality, label);
        assert.deepEqual(tape.bot.human, humanDiff(set.knobs));
        // ⚖ 2026-10-04: the bot seed is random per game unless fixed; the tape records the one this game used
        assert.ok(Number.isInteger(tape.bot.botSeed) && tape.bot.botSeed >= 1, 'a bot seed was drawn');
        assert.equal(tape.bot.botSeed, (await page.evaluate(() => window.noiz.botSetting())).botSeed, 'the tape records this game\'s bot seed');
        const inputs = tapeInputs(tape);
        const g = newGame(loadNoiz2saPatterns(), tape.stage, { seed: tape.seed, endlessSeed: tape.endlessSeed });
        const bot = makeBot(botOptionsFromTape(tape));
        let n = 0;
        for (let f = 0; f < inputs.length && g.status === STATUS.IN_GAME; f++, n++) {
            const b = bot(g);
            assert.equal(b, inputs[f], `${label}: the page's bot and Node's differ at frame ${f}`);
            stepGame(g, b);
        }
        console.log(`ok ${label} (${how}): stage ${stage + 1} seed ${seed}, the page's humanlike bot played ${n} frames input for input what Node's plays from the tape's record (${bot.stats.human.lapses} lapses, ${bot.stats.human.overrides} inputs changed by its hands, ${g.left} ships left)`);
    }
    {
        // the advanced panel: one knob changed → "custom", recorded
        await page.evaluate(() => { window.noiz.setPersonality('Steady'); window.noiz.setKnob('reaction', 17); });
        const set = await page.evaluate(() => window.noiz.botSetting());
        assert.equal(set.persona, 'custom'); assert.equal(set.knobs.reaction, 17); assert.equal(set.knobs.minHold, PRESET.Steady.knobs.minHold);
        assert.equal(await page.evaluate(() => document.getElementById('knob-reaction').value), '17');
        assert.equal(await page.evaluate(() => document.querySelectorAll('#knobs input').length), Object.keys(PRESET.Expert.knobs).length + 1, 'every knob (and the bot seed) in the advanced panel');
        await page.evaluate(() => { window.noiz.setPersonality('Expert'); window.noiz.setPolicy('bot: attack'); });
        console.log('ok the advanced panel shows every knob; changing one makes the setting "custom"');
    }

    // ── 2e. slice HB: the hitbox setting (default original, saved, recorded in the tape, a replay uses its tape's), the
    //    hit-spot dots (at the trail's tail in original, at the bullet in centered), and the page = Node for the
    //    Expert in centered ──
    {
        let h = await page.evaluate(() => window.noiz.hitboxSetting());
        assert.equal(h.hitbox, 'original', 'the default hitbox is the original');
        assert.equal(h.hitDot, true, 'the hit spots are shown by default');
        assert.equal(h.menuText, 'original (behind the bullet)');
        await page.selectOption('#hitbox', 'centered');
        h = await page.evaluate(() => window.noiz.hitboxSetting());
        assert.equal(h.hitbox, 'centered');
        assert.equal(await page.evaluate(() => localStorage.getItem('noiz2sa.hitbox')), '"centered"', 'the setting is saved');
        // the Expert in a centered game: its tape records the hitbox, and Node's Expert plays it input for input
        await page.evaluate(() => { window.noiz.setPolicy('bot: expert attack'); window.noiz.startStage(5, { seed: 2, endlessSeed: 7919 * 2 }); });
        await page.waitForFunction(() => window.noiz.state().game.frame >= 900, null, { timeout: 60000 });
        assert.equal((await page.evaluate(() => window.noiz.hitboxSetting())).game, 'centered');
        // the dots: pause, then read the canvas at each bullet's hit spot (white with the dots on, not with them off)
        await page.keyboard.press('KeyP');
        const pix = () => page.evaluate(() => {
            const c = document.getElementById('screen').getContext('2d');
            const cen = window.noiz.hitboxSetting().game === 'centered';
            return window.noiz.bullets(30).map((b) => {
                const x = Math.round((cen ? b.x : b.px) / 256) + window.noiz.fieldX, y = Math.round((cen ? b.y : b.py) / 256);
                if (y < 2 || y > 477 || x < window.noiz.fieldX + 2 || x > window.noiz.fieldX + 317) return null;
                const d = c.getImageData(x - 1, y - 1, 1, 1).data;
                return d[0] === 255 && d[1] === 255 && d[2] === 255;
            }).filter((v) => v !== null);
        });
        await page.waitForTimeout(100);
        const on = await pix();
        await page.locator('#wrap').screenshot({ path: path.join(shots, 'hitbox-centered.png') });
        await page.click('#hit-dot');
        await page.waitForTimeout(100);
        const off = await pix();
        assert.ok(on.length >= 3 && on.filter(Boolean).length >= 0.8 * on.length, `every bullet has a white dot at its centre (${on.filter(Boolean).length}/${on.length})`);
        assert.ok(off.filter(Boolean).length < off.length / 4, `no dots when they are off (${off.filter(Boolean).length}/${off.length} white)`);
        assert.equal((await page.evaluate(() => window.noiz.hitboxSetting())).hitDot, false);
        await page.click('#hit-dot');
        await page.keyboard.press('KeyP');
        await page.waitForTimeout(1500);
        await page.keyboard.press('Escape');
        const tape = await page.evaluate(() => window.noiz.lastTape());
        assert.equal(tape.hitbox, 'centered', 'the tape records the hitbox');
        assert.equal(tape.player, 'human+bot-expert-attack');
        const inputs = tapeInputs(tape);
        const g = newGame(loadNoiz2saPatterns(), tape.stage, { seed: tape.seed, endlessSeed: tape.endlessSeed, hitbox: 'centered' });
        const bot = makeBot({ variant: 'attack', horizon: DEFAULT_HORIZON, budget: BROWSER_BUDGET, perception: 'observed' });
        for (let f = 0; f < inputs.length && g.status === STATUS.IN_GAME; f++) {
            const b = bot(g);
            assert.equal(b, inputs[f], `the page's centered Expert and Node's differ at frame ${f}`);
            stepGame(g, b);
        }
        // a replay plays with its tape's hitbox, whatever the setting: the centered tape under "original", and the
        // page's engine ends it on Node's state line
        await page.selectOption('#hitbox', 'original');
        const web = await page.evaluate((t) => window.noiz.replayFast(t), tape);
        assert.equal(web.stateLine, stateLine(replayTape(loadNoiz2saPatterns(), tape)), 'browser = Node on a centered tape');
        await page.evaluate((t) => window.noiz.startReplay(t, 'centered.json'), tape);
        assert.equal((await page.evaluate(() => window.noiz.hitboxSetting())).game, 'centered', 'a replay uses its tape\'s hitbox');
        // original: the dot sits at the trail's tail
        await page.evaluate(() => { window.noiz.setPolicy('bot: expert attack'); window.noiz.startStage(5, { seed: 2, endlessSeed: 7919 * 2 }); });
        await page.waitForFunction(() => window.noiz.state().game.frame >= 600, null, { timeout: 60000 });
        assert.equal((await page.evaluate(() => window.noiz.hitboxSetting())).game, 'original');
        await page.keyboard.press('KeyP');
        await page.waitForTimeout(100);
        const tail = await pix();
        await page.locator('#wrap').screenshot({ path: path.join(shots, 'hitbox-original.png') });
        assert.ok(tail.length >= 3 && tail.filter(Boolean).length >= 0.8 * tail.length, `original: every bullet has its dot at its trail's tail (${tail.filter(Boolean).length}/${tail.length})`);
        await page.keyboard.press('KeyP');
        await page.keyboard.press('Escape');
        console.log(`ok hitbox: default original, saved, recorded in the tape and used by its replay; the dots (${on.length} bullets at their centre in centered, ${tail.length} at the tail in original; none when off); the page's centered Expert played ${inputs.length} frames input for input what Node's plays`);
    }

    // ── 3. a busy mid-stage frame, then a stage clear, from replayed tapes ──
    const busy = JSON.parse(fs.readFileSync(path.join(root, 'tapes/s05-lookahead-seed1.json'), 'utf8'));
    await page.evaluate((t) => { window.noiz.startReplay(t, 's05-lookahead-seed1.json'); window.noiz.setSpeed(16); }, busy);
    await page.waitForFunction(() => window.noiz.state().game.frame >= 6000, null, { timeout: 120000 });
    await page.keyboard.press('KeyP');
    await page.locator('#wrap').screenshot({ path: path.join(shots, 'replay-mid-stage.png') });
    s = await state();
    console.log(`ok replay mid-stage screenshot: s05-lookahead-seed1 frame ${s.game.frame}, ${s.game.foes} enemies`);
    await page.keyboard.press('Escape');

    const clear = JSON.parse(fs.readFileSync(path.join(root, 'tapes/s01-lookahead-seed1.json'), 'utf8'));
    await page.evaluate((t) => { window.noiz.startReplay(t, 's01-lookahead-seed1.json'); window.noiz.setSpeed(16); }, clear);
    await page.waitForFunction(() => window.noiz.state().game.status === 3, null, { timeout: 120000 });
    await page.evaluate(() => window.noiz.setSpeed(1));
    await page.waitForTimeout(1500);
    s = await state();
    assert.equal(s.game.status, 3);
    await page.locator('#wrap').screenshot({ path: path.join(shots, 'stage-clear.png') });
    console.log(`ok replayed s01-lookahead-seed1 to its stage clear (frame ${s.game.frame}, score ${s.game.score})`);

    assert.deepEqual(errors, [], 'no page errors');
    console.log(`ok no page errors; screenshots in ${path.relative(root, shots)}/`);
} catch (e) {
    failed = true;
    console.error(e);
    if (errors.length) console.error('page errors:', errors);
} finally {
    await browser.close();
    server.close();
}
process.exit(failed ? 1 : 0);
