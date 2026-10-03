#!/usr/bin/env node
/**
 * The page's frame times with the bot on, in headless Chromium (slice P1). For each scene: start the stage with a
 * fixed seed and the G4 bot on, play `--secs` seconds, and read the overlay's numbers (window.noiz.perf): display
 * gaps, the game's frames/s, the bot waits, the worker's ms/frame. Then it checks that the page played, input for
 * input, what Node's bot plays from the same start (skip with --no-check).
 *
 *   node bin/perf-page.mjs [--scenes 9:1,10:1] [--secs 40] [--variant attack] [--budget 1] [--bot-off]
 *        [--profile out-prefix]   (a CPU profile of the worker, over CDP: <prefix>-<stage>-<seed>.cpuprofile)
 *        [--throttle R]   (CDP CPU throttling ×R on the page and its worker: a slower machine)
 *        [--cost-cap N]   (the bot's per-frame cost cap, budget units)  [--budget-units N] [--bank F]   (budget, bank frames)
 *        [--slow K]   (the worker spins so each bot frame takes K× its time: a K× slower machine for the bot)
 *        [--load N]   (N busy processes beside the browser: a slower / busier machine)  [--json out.json]
 * A scene is stage:seed (stage 0–13, 10 = ENDLESS); endlessSeed is 7919 × seed, as the page's fixed-seed field gives.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { loadNoiz2saPatterns } from '../src/game/patterns-node.js';
import { newGame, stepGame, STATUS } from '../src/game/noiz2sa-game.js';
import { makeBot, BROWSER_BUDGET, DEFAULT_HORIZON } from '../src/game/bot.js';
import { tapeInputs } from '../src/game/tape.js';

const root = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const scenes = opt('scenes', '9:1,10:1').split(',').map((s) => s.split(':').map(Number));
const secs = Number(opt('secs', 40)), variant = opt('variant', 'attack'), budgetX = Number(opt('budget', 1));
const botOn = !args.includes('--bot-off'), check = !args.includes('--no-check') && botOn;
const profile = opt('profile', null);
// --load N: N busy processes beside the browser for the whole run, a stand-in for a slower or busier machine
const burners = [];
for (let i = 0; i < Number(opt('load', 0)); i++) burners.push(spawn(process.execPath, ['-e', 'for(;;){}'], { stdio: 'ignore' }));
process.on('exit', () => burners.forEach((b) => b.kill()));

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
    '.xml': 'text/xml', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.png': 'image/png', '.wasm': 'application/wasm' };
const server = http.createServer((req, res) => {
    const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/play.html`;
const freePort = () => new Promise((r) => { const s = net.createServer(); s.listen(0, () => { const p = s.address().port; s.close(() => r(p)); }); });
const throttle = Number(opt('throttle', 0));
const cdpPort = profile || throttle ? await freePort() : 0;
const browser = await chromium.launch(cdpPort ? { args: [`--remote-debugging-port=${cdpPort}`] } : {});

/** a raw CDP connection to the browser, to reach the page's dedicated worker (Playwright gives no session for it) */
async function workerProfiler() {
    const ver = await (await fetch(`http://127.0.0.1:${cdpPort}/json/version`)).json();
    const ws = new WebSocket(ver.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r, { once: true }));
    let id = 0;
    const pending = new Map(), events = [];
    ws.addEventListener('message', (e) => {
        const m = JSON.parse(e.data);
        if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else events.push(m);
    });
    const send = (method, params = {}, sessionId) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) })); });
    const { result } = await send('Target.getTargets');
    const pageT = result.targetInfos.find((t) => t.type === 'page' && t.url.includes('play.html'));
    const { result: a } = await send('Target.attachToTarget', { targetId: pageT.targetId, flatten: true });
    await send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true }, a.sessionId);
    for (let k = 0; k < 50 && !events.some((e) => e.method === 'Target.attachedToTarget' && e.params.targetInfo.type === 'worker'); k++) await new Promise((r) => setTimeout(r, 100));
    const w = events.find((e) => e.method === 'Target.attachedToTarget' && e.params.targetInfo.type === 'worker');
    if (!w) throw new Error('no worker target');
    const sid = w.params.sessionId;
    if (throttle) {
        // a slower machine: CPU throttling on the page and on its worker
        console.log('throttle page', JSON.stringify((await send('Emulation.setCPUThrottlingRate', { rate: throttle }, a.sessionId)).error ?? 'ok'),
            'worker', JSON.stringify((await send('Emulation.setCPUThrottlingRate', { rate: throttle }, sid)).error ?? 'ok'));
    }
    await send('Profiler.enable', {}, sid);
    await send('Profiler.setSamplingInterval', { interval: 200 }, sid);
    return {
        start: () => send('Profiler.start', {}, sid),
        stop: async () => (await send('Profiler.stop', {}, sid)).result.profile,
        close: () => ws.close(),
    };
}

const P = loadNoiz2saPatterns();
const results = [];
try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 960 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(url);
    await page.evaluate(() => window.noiz.ready);
    const botOpts = { costCap: Number(opt('cost-cap', Infinity)), budget: opt('budget-units', null) === null ? null : Number(opt('budget-units')), bankFrames: Number(opt('bank', 32)) };
    await page.evaluate((o) => window.noiz.setBotOptions(o), botOpts);
    if (opt('slow', null)) await page.evaluate((k) => window.noiz.setWorkerSlowdown(k), Number(opt('slow')));
    const prof = cdpPort ? await workerProfiler() : null;
    for (const [stage, seed] of scenes) {
        const endlessSeed = Math.imul(7919, seed) >>> 0;
        await page.evaluate(([v, b, on]) => {
            window.noiz.setPolicy(`bot: ${v}`);
            document.getElementById('budget').value = String(b); document.getElementById('budget').dispatchEvent(new Event('change'));
            if (window.noiz.state().bot !== on) window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyB' }));
        }, [variant, budgetX, botOn]);
        if (prof && profile) await prof.start();
        await page.evaluate(([s, seed, es]) => { window.noiz.startStage(s, { seed, endlessSeed: es }); window.noiz.perfReset(); }, [stage, seed, endlessSeed]);
        await page.waitForTimeout(secs * 1000);
        const p = await page.evaluate(() => window.noiz.perf());
        const st = await page.evaluate(() => window.noiz.state());
        if (prof && profile) {
            const cp = await prof.stop();
            fs.writeFileSync(`${profile}-${stage}-${seed}.cpuprofile`, JSON.stringify(cp));
        }
        await page.keyboard.press('Escape');
        const tape = await page.evaluate(() => window.noiz.lastTape());
        let same = null;
        if (check) {
            const inputs = tapeInputs(tape);
            const g = newGame(P, stage, { seed, endlessSeed });
            const bot = makeBot({ variant, horizon: DEFAULT_HORIZON, budget: botOpts.budget ?? budgetX * BROWSER_BUDGET, costCap: botOpts.costCap, bankFrames: botOpts.bankFrames });
            same = true;
            for (let f = 0; f < inputs.length && g.status === STATUS.IN_GAME; f++) {
                const b = bot(g);
                if (b !== inputs[f]) { same = `differs at frame ${f}`; break; }
                stepGame(g, b);
            }
        }
        const r = { stage, seed, botOn, variant, budgetX, secs, frames: st.game?.frame ?? tape?.frames, foes: st.game?.foes, ...p, sameAsNode: same };
        results.push(r);
        const b = p.bot;
        console.log(`stage ${stage} seed ${seed} (${botOn ? `bot ${variant}, ${botOpts.budget ?? budgetX * BROWSER_BUDGET} units, bank ${botOpts.bankFrames}${botOpts.costCap !== Infinity ? `, cap ${botOpts.costCap}` : ''}` : 'bot off'}): ${p.displayFrames} display frames in ${p.secs.toFixed(1)} s, gaps > 33 ms ${p.gaps33}, > 50 ms ${p.gaps50}, max ${p.maxGap.toFixed(0)} ms; draw ${p.renderMs.toFixed(2)} ms/frame (max ${p.renderMaxMs.toFixed(1)}); ${p.gameFrames} game frames (${(p.gameFrames / p.secs).toFixed(1)}/s)`
            + (b ? `; waits ${b.waits} (${b.startWaits} at the bot's start); worker ${b.meanMs.toFixed(2)} ms/frame mean, p99 ${b.p99Ms.toFixed(1)}, max ${b.maxMs.toFixed(0)} (last ${b.frames} frames)` : '')
            + (same === null ? '' : `; page = Node: ${same}`));
        if (b && b.waitRuns.length) console.log(`  waits at game frames (frame×ticks): ${b.waitRuns.slice(0, 40).map(([f, n]) => `${f}×${n}`).join(" ")}`);
    }
    if (prof) prof.close();
    if (errors.length) console.log('page errors:', errors);
} finally {
    await browser.close();
    server.close();
    burners.forEach((b) => b.kill());
}
if (opt('json', null)) fs.writeFileSync(opt('json'), JSON.stringify(results, null, 1));
