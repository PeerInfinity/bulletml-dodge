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

const app = {
    patterns: null, mode: 'loading', sel: store.get('stage', 0),
    g: null, stage: 0, seed: 1, endlessSeed: 1, played: [], paused: false,
    bot: false, botUsed: false, policyName: store.get('policy', 'lookahead'), pol: null,
    replay: null, // {tape, name, inputs}
    speed: 1, lastTape: null, effects: [], banner: '', endReported: false,
};
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
function startStage(stage, { seed = null, endlessSeed = null } = {}) {
    const fixed = $('seed').value.trim();
    app.stage = stage;
    app.seed = seed ?? (fixed !== '' ? Number(fixed) >>> 0 : randomSeed());
    app.endlessSeed = endlessSeed ?? (fixed !== '' ? (Math.imul(7919, app.seed) >>> 0) : randomSeed());
    app.g = newGame(app.patterns, stage, { seed: app.seed, endlessSeed: app.endlessSeed });
    app.played = []; app.paused = false; app.effects = []; app.replay = null; app.banner = '';
    app.botUsed = app.bot; app.pol = app.bot ? makePolicy(app.policyName) : null;
    app.sel = stage; store.set('stage', stage);
    setMode('play');
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
    app.g = null; app.paused = false; app.replay = null;
    sound.stopMusic();
    setMode('select');
}
function finishRecording() {
    if (!app.played.length) return;
    app.lastTape = makeTape({
        stage: app.stage, seed: app.seed, endlessSeed: app.endlessSeed, played: app.played,
        extra: { player: app.botUsed ? `human+${app.policyName}` : 'human' },
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
    if (on) { app.pol = makePolicy(app.policyName); if (app.mode === 'play') app.botUsed = true; } else app.pol = null;
    updateControls();
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
        const b = app.bot && app.pol && g.status === STATUS.IN_GAME ? app.pol(g) : keyboardInput();
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

let acc = 0, last = performance.now();
function loop(now) {
    acc += Math.min(now - last, 250); last = now;
    let steps = 0;
    while (acc >= INTERVAL_BASE && steps < 8) {
        acc -= INTERVAL_BASE; steps++;
        if (!app.paused) for (let k = 0; k < (app.mode === 'replay' ? app.speed : 1); k++) tick();
    }
    if (acc > INTERVAL_BASE * 8) acc = 0; // too slow to keep up: slow down rather than spiral
    render();
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
    for (const n of POLICY_NAMES) { const o = document.createElement('option'); o.value = o.textContent = n; pol.appendChild(o); }
    pol.addEventListener('change', () => { app.policyName = pol.value; store.set('policy', pol.value); if (app.bot) setBot(true); });
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
    render();
    requestAnimationFrame(loop);
    const [patterns, tapes] = await Promise.all([
        loadNoiz2saPatternsWeb(BASE),
        fetch(new URL('web/index/tapes.json', BASE)).then((r) => r.json()),
    ]);
    app.patterns = patterns;
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
            mode: app.mode, paused: app.paused, sel: app.sel, bot: app.bot,
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
    startReplay: (tape, name) => startReplay(tape, name),
    setSpeed: (s) => { app.speed = s; },
    fieldX: FIELD_X,
};
window.noiz.ready = main().then(() => true, (e) => { console.error(e); app.banner = String(e); throw e; });
