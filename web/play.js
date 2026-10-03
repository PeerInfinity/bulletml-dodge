/**
 * The browser front end (slice G3): stage select, keyboard play, simple drawing, sound, a bot toggle, replays.
 * It runs the same engine modules as Node (src/game/), one fixed 16 ms step per frame (noiz2sa.c INTERVAL_BASE),
 * decoupled from the display refresh.
 *
 * window.noiz is a small API for the headless checks (test/browser.test.mjs).
 */
import { newGame, stepGame, stateLine, STATUS, SPC, STAGE_NAMES, input } from '../src/game/noiz2sa-game.js';
import { makePolicy, POLICY_NAMES } from '../src/game/policies.js';
import { makeTape, tapeInputs, replayTape } from '../src/game/tape.js';
import { loadNoiz2saPatternsWeb } from '../src/game/patterns-web.js';
import { packBulletML } from '../src/bulletml.js';
import { BOT_VARIANTS, BROWSER_BUDGET, DEFAULT_HORIZON } from '../src/game/bot.js';
import { Sound, CHUNK } from './sound.js';
import { draw, FIELD_X } from './draw.js';

const BASE = new URL('..', import.meta.url);
const INTERVAL_BASE = 16; // ms per frame
const $ = (id) => document.getElementById(id);
const canvas = $('screen'), ctx = canvas.getContext('2d');
const store = {
    get(k, d) { try { const v = localStorage.getItem(`noiz2sa.${k}`); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(`noiz2sa.${k}`, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};

// the G4 bot ('bot: attack', 'bot: no-attack') runs in a Web Worker (web/bot-worker.js); the test policies run here
const G4 = Object.fromEntries(BOT_VARIANTS.map((v) => [`bot: ${v}`, v]));
const ALL_POLICIES = [...Object.keys(G4), ...POLICY_NAMES];
const isG4 = (name) => name in G4;

const app = {
    patterns: null, mode: 'loading', sel: store.get('stage', 0),
    g: null, stage: 0, seed: 1, endlessSeed: 1, played: [], paused: false,
    bot: false, botUsed: false, policyName: store.get('policy', 'bot: attack'), pol: null,
    horizon: store.get('horizon', DEFAULT_HORIZON), budgetX: store.get('budgetX', 1),
    worker: null, g4: null, // g4: {id, from, queue, stalls, ms: [recent bot CPU ms per frame], wait}
    replay: null, // {tape, name, inputs}
    workerLead: 0, // how far ahead the worker may play (its LEAD)
    // slice P1, checks only (window.noiz.setBotOptions): the bot's per-frame cost cap, its budget in units per frame
    // (null: the budget menu × BROWSER_BUDGET) and its bank (frames of budget)
    costCap: Infinity, budgetUnits: null, bankFrames: 32,
    speed: 1, lastTape: null, effects: [], banner: '', endReported: false,
};
if (!ALL_POLICIES.includes(app.policyName)) app.policyName = 'bot: attack';
let g4Id = 0;
const sound = new Sound(BASE);
sound.setMuted(store.get('muted', false));

// ── keyboard ──
const held = new Set();
const GAME_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyZ', 'KeyX']);
const UP = ['ArrowUp', 'KeyW', 'Numpad8'], DOWN = ['ArrowDown', 'KeyS', 'Numpad2'];
const LEFT = ['ArrowLeft', 'KeyA', 'Numpad4'], RIGHT = ['ArrowRight', 'KeyD', 'Numpad6'];
const any = (ks) => ks.some((k) => held.has(k));
// dir 1..8 = N, NE, E, SE, S, SW, W, NW; indexed by [dy+1][dx+1]
const DIR = [[8, 1, 2], [7, 0, 3], [6, 5, 4]];
function keyboardInput() {
    const dx = (any(RIGHT) ? 1 : 0) - (any(LEFT) ? 1 : 0), dy = (any(DOWN) ? 1 : 0) - (any(UP) ? 1 : 0);
    return input(DIR[dy + 1][dx + 1], held.has('KeyZ'), held.has('KeyX'));
}
function isFormField(t) { return t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA'); }
addEventListener('keydown', (e) => {
    if (isFormField(e.target) && e.code !== 'Escape') return;
    sound.unlock();
    if (GAME_KEYS.has(e.code) && app.mode !== 'loading') e.preventDefault();
    if (e.repeat) { held.add(e.code); return; }
    held.add(e.code);
    if (e.code === 'KeyM') setMuted(!sound.muted);
    else if (e.code === 'KeyB') setBot(!app.bot);
    else if (e.code === 'KeyF') setPerfOverlay(!perf.overlay);
    else if (app.mode === 'select') selectKey(e);
    else if (e.code === 'KeyP') togglePause();
    else if (e.code === 'Escape') backToSelect();
});
addEventListener('keyup', (e) => held.delete(e.code));
addEventListener('blur', () => held.clear());

function selectKey(e) {
    const n = STAGE_NAMES.length;
    // the grid is 5 wide (stages 1–5, 6–10, then the 4 endless modes)
    if (e.code === 'ArrowRight' || e.code === 'KeyD') app.sel = (app.sel + 1) % n;
    else if (e.code === 'ArrowLeft' || e.code === 'KeyA') app.sel = (app.sel + n - 1) % n;
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') app.sel = Math.min(n - 1, app.sel + 5);
    else if (e.code === 'ArrowUp' || e.code === 'KeyW') app.sel = Math.max(0, app.sel - 5);
    else if (e.code === 'KeyZ' || e.code === 'Enter' || e.code === 'Space') { startStage(app.sel); return; }
    renderSelect();
}

// ── modes ──
function randomSeed() { return (Math.floor(Math.random() * 0x7ffffffe) + 1) >>> 0; }
function startStage(stage, { seed = null, endlessSeed = null, prefix = [] } = {}) {
    const fixed = $('seed').value.trim();
    app.stage = stage;
    app.seed = seed ?? (fixed !== '' ? Number(fixed) >>> 0 : randomSeed());
    app.endlessSeed = endlessSeed ?? (fixed !== '' ? (Math.imul(7919, app.seed) >>> 0) : randomSeed());
    app.g = newGame(app.patterns, stage, { seed: app.seed, endlessSeed: app.endlessSeed });
    app.played = []; app.paused = false; app.effects = []; app.replay = null; app.banner = '';
    for (const b of prefix) { if (app.g.status !== STATUS.IN_GAME) break; stepGame(app.g, b); app.played.push(b); }
    app.botUsed = app.bot;
    app.sel = stage; store.set('stage', stage);
    setMode('play');
    armBot();
    sound.playStageMusic(stage);
}
function startReplay(tape, name) {
    app.stage = tape.stage; app.seed = tape.seed; app.endlessSeed = tape.endlessSeed;
    app.g = newGame(app.patterns, tape.stage, { seed: tape.seed, endlessSeed: tape.endlessSeed });
    app.replay = { tape, name, inputs: tapeInputs(tape) };
    app.played = []; app.paused = false; app.effects = []; app.banner = ''; app.endReported = false;
    setMode('replay');
    sound.playStageMusic(tape.stage);
}
function backToSelect() {
    if (app.mode === 'play') finishRecording();
    stopG4();
    app.g = null; app.paused = false; app.replay = null;
    sound.stopMusic();
    setMode('select');
}
function finishRecording() {
    if (!app.played.length) return;
    app.lastTape = makeTape({
        stage: app.stage, seed: app.seed, endlessSeed: app.endlessSeed, played: app.played,
        extra: { player: app.botUsed ? `human+${app.policyName.replace('bot: ', 'bot-')}` : 'human',
            ...(app.botUsed && isG4(app.policyName) ? { bot: { variant: G4[app.policyName], horizon: app.horizon, budget: botBudget(), ...(app.costCap !== Infinity ? { costCap: app.costCap } : {}), ...(app.bankFrames !== 32 ? { bankFrames: app.bankFrames } : {}) } } : {}) },
    });
    app.played = [];
    updateControls();
}
function setMode(m) {
    app.mode = m;
    $('select').hidden = m !== 'select';
    renderSelect(); updateControls();
}
function togglePause() { if (app.mode === 'play' || app.mode === 'replay') app.paused = !app.paused; }
function setMuted(m) { sound.setMuted(m); store.set('muted', m); updateControls(); }
function setBot(on) {
    app.bot = on;
    if (on && app.mode === 'play') app.botUsed = true;
    armBot();
    updateControls();
}
/** (re)start the chosen bot for the game in play: a test policy here, or the G4 bot in the worker */
function armBot() {
    stopG4();
    app.pol = null;
    if (!app.bot || app.mode !== 'play' || !app.g) return;
    if (!isG4(app.policyName)) { app.pol = makePolicy(app.policyName); return; }
    const id = ++g4Id;
    app.g4 = { id, from: app.g.frame, queue: [], stalls: 0, ms: [], units: [], maxMs: 0, startedAt: app.g.frame };
    app.worker.postMessage({ type: 'start', id, stage: app.stage, seed: app.seed, endlessSeed: app.endlessSeed,
        inputs: app.played.slice(), variant: G4[app.policyName], horizon: app.horizon, budget: botBudget(), costCap: app.costCap, bankFrames: app.bankFrames });
}
function botBudget() { return app.budgetUnits ?? app.budgetX * BROWSER_BUDGET; }
function stopG4() {
    if (app.g4 && app.worker) app.worker.postMessage({ type: 'stop', id: app.g4.id });
    app.g4 = null;
}
function onWorker(e) {
    const m = e.data;
    if (m.type === 'error') { console.error('bot worker:', m.message); return; }
    const r = app.g4;
    if (m.type !== 'inputs' || !r || m.id !== r.id) return;
    if (m.from !== r.from + r.queue.length) { console.error(`bot worker: inputs from ${m.from}, expected ${r.from + r.queue.length}`); return; }
    r.queue.push(...m.inputs);
    for (const t of m.ms) { r.ms.push(t); if (t > r.maxMs) r.maxMs = t; perf.wSum += t; perf.wN++; if (t > perf.wMax) perf.wMax = t; }
    for (const u of m.units) r.units.push(u);
    if (r.units.length > 600) r.units.splice(0, r.units.length - 600);
    if (r.ms.length > 600) r.ms.splice(0, r.ms.length - 600);
}
/** the worker's input for this frame, or null if it has not come yet (the game then waits) */
function g4Input(frame) {
    const r = app.g4;
    if (!r || r.from !== frame || !r.queue.length) return null;
    r.from++;
    const b = r.queue.shift();
    app.worker.postMessage({ type: 'ack', id: r.id, frame: frame + 1 });
    return b;
}

// ── one frame ──
function onEvents(g, events, prevFoes) {
    for (const e of events) {
        switch (e[0]) {
            case 'shot': sound.chunk(CHUNK.SHOT); break;
            case 'damage': sound.chunk(CHUNK.HIT); break;
            case 'kill': sound.chunk(e[1] === 3 ? CHUNK.BOSS_DESTROYED : CHUNK.FOE_DESTROYED); break;
            case 'hit':
                sound.chunk(CHUNK.SHIP_DESTROYED);
                app.effects.push({ x: g.ship.x >> 8, y: g.ship.y >> 8, r: 60, age: 0, life: 50, color: '#f66' });
                break;
            case 'star': sound.chunk(CHUNK.BONUS); break;
            case 'extend': sound.chunk(CHUNK.EXTEND); break;
            case 'clear': case 'gameover': sound.fadeMusic(); break;
        }
    }
    if (prevFoes) {
        // explosions where an enemy died this frame (page-side effect only)
        for (const fe of prevFoes) {
            if (fe.shield <= 0) app.effects.push({ x: fe.x >> 8, y: fe.y >> 8, r: [30, 40, 56, 96][fe.type], age: 0, life: 30, color: '#ff8' });
        }
    }
}
function liveFoes(g) { const out = []; for (const f of g.foes) if (f && f.spc === SPC.FOE) out.push(f); return out; }

function tick() {
    const g = app.g;
    if (!g) return;
    if (app.mode === 'play') {
        // the bot plays the game; the end screens (stage clear, game over) always take the keyboard
        let b;
        if (app.bot && g.status === STATUS.IN_GAME && (app.pol || app.g4)) {
            b = app.pol ? app.pol(g) : g4Input(g.frame);
            if (b === null) { app.g4.stalls++; perfWait(g.frame); return; } // the worker is late: wait for it, never guess
        } else b = keyboardInput();
        app.played.push(b);
        const prev = liveFoes(g);
        const ev = stepGame(g, b);
        onEvents(g, ev, ev.some((e) => e[0] === 'kill') ? prev : null);
        if (g.status === STATUS.TITLE) { finishRecording(); backToSelect(); }
    } else if (app.mode === 'replay') {
        const r = app.replay;
        if (g.status === STATUS.TITLE || g.frame >= r.inputs.length) {
            if (!app.endReported) { app.endReported = true; app.banner = 'end of tape — Esc for stage select'; sound.fadeMusic(); }
            return;
        }
        const prev = liveFoes(g);
        const ev = stepGame(g, r.inputs[g.frame]);
        onEvents(g, ev, ev.some((e) => e[0] === 'kill') ? prev : null);
    }
    for (const e of app.effects) e.age++;
    app.effects = app.effects.filter((e) => e.age < e.life);
}

// ── the frame-time overlay (F) and its numbers (window.noiz.perf) ──
const perf = {
    overlay: store.get('perfOverlay', false), el: null, shownAt: 0,
    // since the last reset: display frames, their gaps (> 33 ms and > 50 ms, the longest), game frames played
    t0: 0, frames: 0, gaps33: 0, gaps50: 0, maxGap: 0, gameFrames: 0, waits0: 0,
    wSum: 0, wN: 0, wMax: 0, // the worker's ms per frame it played
    waitRuns: [], // [game frame, ticks waited there]
    renderSum: 0, renderMax: 0, // the page's drawing, ms (the canvas calls; the browser's own raster comes later)
    recent: [], // [time, game frame] of the last ~second, for the game's frames/s
};
function perfReset() {
    Object.assign(perf, { t0: performance.now(), frames: 0, gaps33: 0, gaps50: 0, maxGap: 0, gameFrames: 0, waits0: app.g4 ? app.g4.stalls : 0, wSum: 0, wN: 0, wMax: 0, waitRuns: [], renderSum: 0, renderMax: 0 });
}
function perfWait(frame) {
    const w = perf.waitRuns, last = w[w.length - 1];
    if (last && last[0] === frame) last[1]++; else if (w.length < 500) w.push([frame, 1]);
}
function perfDisplayFrame(now, gap, played) {
    perf.frames++; perf.gameFrames += played;
    if (gap > 33) perf.gaps33++;
    if (gap > 50) perf.gaps50++;
    if (gap > perf.maxGap) perf.maxGap = gap;
    perf.recent.push(now, app.g ? app.g.frame : 0);
    while (perf.recent.length > 2 && now - perf.recent[0] > 1000) perf.recent.splice(0, 2);
}
function perfNumbers() {
    const r = perf.recent, n = r.length;
    const fps = n >= 4 && r[n - 2] > r[0] ? ((r[n - 1] - r[1]) * 1000) / (r[n - 2] - r[0]) : 0;
    const w = app.g4;
    const secs = (performance.now() - perf.t0) / 1000;
    return {
        secs, displayFrames: perf.frames, displayFps: perf.frames / Math.max(secs, 1e-3), gaps33: perf.gaps33, gaps50: perf.gaps50, maxGap: perf.maxGap,
        gameFps: fps, gameFrames: perf.gameFrames, renderMs: perf.renderSum / Math.max(1, perf.frames), renderMaxMs: perf.renderMax,
        // startWaits: the first bot frame, while the worker makes its first decision (the page holds the game still)
        bot: w && { waits: w.stalls - perf.waits0, startWaits: perf.waitRuns.filter(([f]) => f === w.startedAt).reduce((a, [, n]) => a + n, 0), waitRuns: perf.waitRuns, lead: w.queue.length, frames: perf.wN, meanMs: perf.wSum / Math.max(1, perf.wN), maxMs: perf.wMax,
            p99Ms: w.ms.length ? [...w.ms].sort((a, b) => a - b)[Math.floor(w.ms.length * 0.99)] : 0 }, // p99: the last 600 frames
    };
}
function setPerfOverlay(on) {
    perf.overlay = on; store.set('perfOverlay', on);
    if (!perf.el) {
        perf.el = document.createElement('pre');
        perf.el.id = 'perf';
        perf.el.style.cssText = 'position:absolute;right:0;bottom:0;margin:0;padding:4px 6px;font:11px/1.35 monospace;color:#cfe;background:rgba(0,0,0,.7);pointer-events:none;white-space:pre';
        $('wrap').appendChild(perf.el);
    }
    perf.el.hidden = !on;
    if (on) perfReset();
}
function perfShow(now) {
    if (!perf.overlay || now - perf.shownAt < 250) return;
    perf.shownAt = now;
    const p = perfNumbers(), b = p.bot;
    perf.el.textContent = [
        `display ${p.displayFps.toFixed(1)}/s  gaps>33ms ${p.gaps33}  >50ms ${p.gaps50}  max ${p.maxGap.toFixed(0)} ms`,
        `game ${p.gameFps.toFixed(1)} frames/s (62.5)  draw ${p.renderMs.toFixed(2)} ms/frame, max ${p.renderMaxMs.toFixed(1)}`,
        b ? `bot waits ${b.waits} (${b.startWaits} at its start)  lead ${b.lead}/${app.workerLead} frames` : 'bot: not in the worker',
        b ? `worker ${b.meanMs.toFixed(1)} ms/frame mean  p99 ${b.p99Ms.toFixed(0)}  max ${b.maxMs.toFixed(0)}` : '',
        `since ${p.secs.toFixed(0)} s (F hides; resets on show)`,
    ].filter(Boolean).join('\n');
}

let acc = 0, last = performance.now();
function loop(now) {
    const gap = now - last;
    acc += Math.min(gap, 250); last = now;
    let steps = 0;
    const f0 = app.g ? app.g.frame : 0;
    while (acc >= INTERVAL_BASE && steps < 8) {
        acc -= INTERVAL_BASE; steps++;
        if (!app.paused) for (let k = 0; k < (app.mode === 'replay' ? app.speed : 1); k++) tick();
    }
    if (acc > INTERVAL_BASE * 8) acc = 0; // too slow to keep up: slow down rather than spiral
    const r0 = performance.now();
    render();
    const rms = performance.now() - r0;
    perf.renderSum += rms; if (rms > perf.renderMax) perf.renderMax = rms;
    perfDisplayFrame(now, gap, app.g ? Math.max(0, app.g.frame - f0) : 0);
    perfShow(now);
    requestAnimationFrame(loop);
}

// ── drawing and controls ──
function render() {
    draw(ctx, app.g, {
        mode: app.mode, paused: app.paused, bot: app.bot, policyName: app.policyName, muted: sound.muted,
        speed: app.speed, tapeName: app.replay?.name, effects: app.effects, banner: app.banner,
        modeLabel: app.mode === 'play' ? (app.bot ? 'PLAY (bot)' : 'PLAY') : app.mode === 'replay' ? 'REPLAY' : app.mode === 'select' ? 'STAGE SELECT' : 'LOADING…',
    });
}
function renderSelect() {
    const grid = $('stages');
    if (!grid.children.length) {
        STAGE_NAMES.forEach((name, i) => {
            const b = document.createElement('button');
            b.textContent = i < 10 ? `STAGE ${name}` : name;
            b.className = i < 10 ? 'stage' : 'stage endless';
            b.addEventListener('click', () => { sound.unlock(); startStage(i); });
            b.addEventListener('mouseenter', () => { app.sel = i; renderSelect(); });
            grid.appendChild(b);
        });
    }
    [...grid.children].forEach((b, i) => b.classList.toggle('sel', i === app.sel));
}
function updateControls() {
    $('bot').checked = app.bot;
    $('policy').value = app.policyName;
    $('mute').textContent = sound.muted ? 'Sound: off (M)' : 'Sound: on (M)';
    $('download').disabled = !app.lastTape;
    $('download').textContent = app.lastTape ? `Download last tape (${STAGE_NAMES[app.lastTape.stage]}, ${app.lastTape.frames} frames)` : 'Download last tape';
}

function initControls() {
    const pol = $('policy');
    for (const n of ALL_POLICIES) { const o = document.createElement('option'); o.value = o.textContent = n; pol.appendChild(o); }
    pol.addEventListener('change', () => { app.policyName = pol.value; store.set('policy', pol.value); if (app.bot) setBot(true); });
    for (const [id, key, values] of [['horizon', 'horizon', [8, 16, 32, 48, 64]], ['budget', 'budgetX', [1, 4, 16]]]) {
        const sel = $(id);
        for (const v of values) { const o = document.createElement('option'); o.value = v; o.textContent = id === 'budget' ? `${v}×` : `${v} frames`; sel.appendChild(o); }
        sel.value = app[key];
        sel.addEventListener('change', () => { app[key] = Number(sel.value); store.set(key, app[key]); if (app.bot) setBot(true); });
    }
    $('bot').addEventListener('change', (e) => setBot(e.target.checked));
    $('mute').addEventListener('click', () => { sound.unlock(); setMuted(!sound.muted); });
    $('speed').addEventListener('change', (e) => { app.speed = Number(e.target.value); });
    $('download').addEventListener('click', () => {
        const t = app.lastTape;
        if (!t) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([JSON.stringify(t)], { type: 'application/json' }));
        a.download = `s${String(t.stage + 1).padStart(2, '0')}-${t.player.replace('+', '-')}-seed${t.seed}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    $('play-tape').addEventListener('click', async () => {
        sound.unlock();
        const f = $('tapes').value;
        if (f) startReplay(await (await fetch(new URL(`tapes/${f}`, BASE))).json(), f);
    });
    $('tape-file').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        sound.unlock();
        startReplay(JSON.parse(await file.text()), file.name);
        e.target.value = '';
    });
    for (const el of document.querySelectorAll('select, button, input[type=checkbox]')) {
        // after a click, give the keys back to the game
        el.addEventListener('change', () => el.blur());
        if (el.tagName === 'BUTTON') el.addEventListener('click', () => el.blur());
    }
}

async function main() {
    initControls();
    if (perf.overlay) setPerfOverlay(true);
    render();
    requestAnimationFrame(loop);
    const [patterns, tapes] = await Promise.all([
        loadNoiz2saPatternsWeb(BASE),
        fetch(new URL('web/index/tapes.json', BASE)).then((r) => r.json()),
    ]);
    app.patterns = patterns;
    app.worker = new Worker(new URL('./bot-worker.js', import.meta.url), { type: 'module' });
    app.worker.onmessage = onWorker;
    app.worker.onerror = (e) => console.error('bot worker failed:', e.message);
    const ready = new Promise((r) => { app.worker.addEventListener('message', (e) => { if (e.data.type === 'ready') { app.workerLead = e.data.lead; r(); } }); });
    app.worker.postMessage({ type: 'init', patterns: Object.fromEntries(Object.entries(patterns).map(([k, l]) => [k, l.map(packBulletML)])) });
    await ready;
    const sel = $('tapes');
    for (const t of tapes) {
        const o = document.createElement('option');
        o.value = t.file; o.textContent = `${t.file.replace(/\.json$/, '')} — ${STAGE_NAMES[t.stage]}, ${t.frames} frames`;
        sel.appendChild(o);
    }
    sel.value = 's01-lookahead-seed1.json';
    setMode('select');
}

// ── for the headless checks ──
window.noiz = {
    ready: null,
    /** play a tape to its end in this page's engine, as fast as it can; the final state line */
    replayFast(tape) {
        const t0 = performance.now();
        const g = replayTape(app.patterns, tape);
        return { stateLine: stateLine(g), frames: g.frame, ms: performance.now() - t0 };
    },
    state() {
        const g = app.g;
        return {
            mode: app.mode, paused: app.paused, sel: app.sel, bot: app.bot, policy: app.policyName,
            g4: app.g4 && { lead: app.g4.queue.length, stalls: app.g4.stalls, frames: app.g4.ms.length,
                meanMs: app.g4.ms.reduce((a, b) => a + b, 0) / Math.max(1, app.g4.ms.length), maxMs: app.g4.maxMs,
                msPerUnit: app.g4.ms.reduce((a, b) => a + b, 0) / Math.max(1, app.g4.units.reduce((a, b) => a + b, 0)) },
            game: g && { frame: g.frame, status: g.status, score: g.score, left: g.left, bonusScore: g.bonusScore, scene: g.scene,
                shipX: g.ship.x, shipY: g.ship.y, shots: g.shots.filter(Boolean).length,
                foes: g.foes.filter((f) => f && f.spc === SPC.FOE).length, line: stateLine(g) },
            recorded: app.played.length, lastTape: app.lastTape && { stage: app.lastTape.stage, seed: app.lastTape.seed, frames: app.lastTape.frames, player: app.lastTape.player },
        };
    },
    lastTape: () => app.lastTape,
    sound: () => ({ decoded: sound.buffers.filter(Boolean).length, context: sound.ctx?.state ?? null,
        music: sound.music.src.split('/').pop(), musicPaused: sound.music.paused, muted: sound.muted }),
    startStage: (i, o) => startStage(i, o),
    setPolicy: (name) => { app.policyName = name; updateControls(); },
    startReplay: (tape, name) => startReplay(tape, name),
    setSpeed: (s) => { app.speed = s; },
    /** the overlay's numbers since the last perfReset (display gaps, game frames/s, bot waits, worker ms) */
    perf: () => perfNumbers(),
    perfReset: () => perfReset(),
    /** (checks only) the worker spins so each of its bot frames takes factor× as long: a slower machine */
    setWorkerSlowdown: (factor) => app.worker.postMessage({ type: 'slow', factor }),
    /** (checks only) the G4 bot's per-frame cost cap in budget units (Infinity: none, the default) for the next start */
    setCostCap: (n) => { app.costCap = n; },
    /** (checks only) {costCap, budget (units/frame, null = the menu's), bankFrames} for the next bot start */
    setBotOptions: (o) => { if ('costCap' in o) app.costCap = o.costCap; if ('budget' in o) app.budgetUnits = o.budget; if ('bankFrames' in o) app.bankFrames = o.bankFrames; },
    fieldX: FIELD_X,
};
window.noiz.ready = main().then(() => true, (e) => { console.error(e); app.banner = String(e); throw e; });
