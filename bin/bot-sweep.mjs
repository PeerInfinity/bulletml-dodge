#!/usr/bin/env node
/**
 * The G4 sweep: the bot on every stage, in worker processes.
 *
 *   node bin/bot-sweep.mjs [--jobs N] [--timeout-min M] [--only main|horizons] [--seeds 1,2,3] [--summary]
 *   node bin/bot-sweep.mjs --perception observed|omniscient|both …   (slice H1: the Expert vs the Ace, sharded; bin/h1-sweep.mjs)
 *
 *  - main:     stages 1–10 and ENDLESS/HARD/EXTREME/INSANE × attack/no-attack × seeds × budgets 1×, 4×, 16×
 *              BROWSER_BUDGET, at the default horizon. Tapes → tapes/g4/ (they replay in play.html).
 *  - horizons: the look-ahead needed, stages 1–10 × both variants × seeds, budget 1×, up a ladder of horizons
 *              (0 = no simulation at all) until two in a row succeed (no life lost, and cleared / alive 3
 *              minutes into the boss scene), with each tail: straight (the bot's own: no bullet avoidance
 *              outside the exact search) and reflex (steers off bullets by itself).
 * Each run is one child process (`--one <job json>`), capped at --timeout-min of wall time; its result goes
 * to results/.g4-parts/<key>.json, so an interrupted sweep resumes where it stopped. Then it writes
 * results/g4-bot.json and results/g4-bot.md (`--summary` writes them from the parts alone).
 * Seeds: C rand() seed s, endlessSeed 7919 × s (the G2 convention).
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');
const partsDir = path.join(root, 'results/.g4-parts');
const tapesDir = path.join(root, 'tapes/g4');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
// slice H1: with `--perception observed|omniscient|both` this is the H1 sweep (the Expert vs the Ace; sharded, its own
// job list and outputs): bin/h1-sweep.mjs
if (opt('perception', null) !== null) { await import('./h1-sweep.mjs'); process.exit(0); }

const STAGES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'ENDLESS', 'HARD', 'EXTREME', 'INSANE'];
const VARIANTS = ['attack', 'no-attack'];
const BUDGETS_X = [1, 4, 16];
// the look-ahead ladder; a (stage, variant, seed, tail) climbs it until two horizons in a row succeed
const H_LADDER = { straight: [0, 1, 2, 4, 8, 16, 32, 48], reflex: [0, 1, 2, 4, 8, 16, 32, 48] };
const H_BUDGET_X = 1;

const pad = (n) => String(n).padStart(2, '0');
const keyOf = (j) => j.kind === 'main'
    ? `s${pad(j.stage + 1)}-${j.variant}-seed${j.seed}-b${j.budgetX}x`
    : j.kind === 'ladder' ? `l-s${pad(j.stage + 1)}-${j.variant}-seed${j.seed}-${j.tail}`
        : `h-s${pad(j.stage + 1)}-${j.variant}-seed${j.seed}-${j.tail}-h${j.horizon}`;
const success = (r) => r.livesLost === 0 && (r.variant === 'attack' ? r.outcome === 'cleared' : r.outcome === 'boss-cap');

// ── one run, in its own process ──
if (opt('one', null)) {
    const { loadNoiz2saPatterns } = await import('../src/game/patterns-node.js');
    const { runBot } = await import('../src/game/bot-run.js');
    const { BROWSER_BUDGET, DEFAULT_HORIZON } = await import('../src/game/bot.js');
    const P = loadNoiz2saPatterns();
    const j = JSON.parse(opt('one'));
    fs.mkdirSync(partsDir, { recursive: true });
    const one = (job) => {
        const key = keyOf(job), part = path.join(partsDir, `${key}.json`);
        if (fs.existsSync(part)) return JSON.parse(fs.readFileSync(part, 'utf8'));
        const { result, tape } = runBot(P, {
            stage: job.stage, seed: job.seed, variant: job.variant, tail: job.tail,
            horizon: job.horizon ?? DEFAULT_HORIZON, budget: job.budgetX * BROWSER_BUDGET,
        });
        if (job.kind === 'main') {
            fs.mkdirSync(tapesDir, { recursive: true });
            fs.writeFileSync(path.join(tapesDir, `${key}.json`), JSON.stringify(tape));
            result.tape = `g4/${key}.json`;
        }
        const row = { ...job, key, ...result };
        fs.writeFileSync(part, JSON.stringify(row));
        return row;
    };
    if (j.kind === 'ladder') {
        // up the ladder until two horizons in a row succeed; each rung is its own part (resumable)
        let streak = 0;
        const rungs = [];
        for (const horizon of H_LADDER[j.tail]) {
            const r = one({ kind: 'horizon', stage: j.stage, variant: j.variant, seed: j.seed, budgetX: j.budgetX, tail: j.tail, horizon });
            rungs.push(horizon);
            streak = success(r) ? streak + 1 : 0;
            if (streak >= 2) break;
        }
        fs.writeFileSync(path.join(partsDir, `${keyOf(j)}.json`), JSON.stringify({ ...j, key: keyOf(j), rungs, outcome: `${rungs.length} rungs` }));
    } else one(j);
    process.exit(0);
}

// ── the job list ──
const seeds = opt('seeds', '1,2,3').split(',').map(Number);
const only = opt('only', null);
const jobs = [];
if (!only || only === 'main') {
    for (let stage = 0; stage < STAGES.length; stage++) for (const variant of VARIANTS) for (const seed of seeds) for (const budgetX of BUDGETS_X) {
        jobs.push({ kind: 'main', stage, variant, seed, budgetX, tail: 'straight' });
    }
}
if (!only || only === 'horizons') {
    for (let stage = 0; stage < 10; stage++) for (const variant of VARIANTS) for (const seed of seeds) for (const tail of Object.keys(H_LADDER)) {
        jobs.push({ kind: 'ladder', stage, variant, seed, budgetX: H_BUDGET_X, tail });
    }
}
// longest first: endless, then no-attack (it lives 3 minutes into the boss scene), then the big budgets and horizons
const weight = (j) => (j.stage >= 10 ? 3 : 1) * (j.variant === 'no-attack' ? 2 : 1) * (1 + Math.log2(j.budgetX)) * (j.kind === 'ladder' ? 1.5 : 2);
jobs.sort((a, b) => weight(b) - weight(a));

if (!args.includes('--summary')) {
    const nJobs = Number(opt('jobs', os.cpus().length));
    const timeoutMs = Number(opt('timeout-min', 120)) * 60_000;
    const todo = jobs.filter((j) => !fs.existsSync(path.join(partsDir, `${keyOf(j)}.json`)));
    console.log(`${jobs.length} runs, ${jobs.length - todo.length} done already, ${todo.length} to do, ${nJobs} at a time`);
    const t0 = Date.now();
    let next = 0, done = 0;
    const runOne = (j) => new Promise((resolve) => {
        const child = spawn(process.execPath, [path.join(here, 'bot-sweep.mjs'), '--one', JSON.stringify(j)], { stdio: ['ignore', 'inherit', 'inherit'] });
        const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
        child.on('close', (code, signal) => {
            clearTimeout(timer);
            done++;
            const key = keyOf(j);
            if (code !== 0) {
                fs.mkdirSync(partsDir, { recursive: true });
                fs.writeFileSync(path.join(partsDir, `${key}.json`), JSON.stringify({ ...j, key, outcome: signal ? 'timeout' : `error ${code}` }));
            }
            const r = JSON.parse(fs.readFileSync(path.join(partsDir, `${key}.json`), 'utf8'));
            console.log(`[${done}/${todo.length} ${((Date.now() - t0) / 60000).toFixed(1)} min] ${key}: ${r.outcome}${r.frames != null ? `, ${r.frames} frames, lives lost ${r.livesLost}, score ${r.score}, ${r.cpuSec}s` : ''}`);
            resolve();
        });
    });
    await Promise.all(Array.from({ length: nJobs }, async () => { while (next < todo.length) await runOne(todo[next++]); }));
    console.log(`sweep done in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
}

// ── the summary ──
const rows = fs.existsSync(partsDir) ? fs.readdirSync(partsDir).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(fs.readFileSync(path.join(partsDir, f), 'utf8'))) : [];
const main = rows.filter((r) => r.kind === 'main'), hor = rows.filter((r) => r.kind === 'horizon');
const { BROWSER_BUDGET, DEFAULT_HORIZON, UNIT_FOES } = await import('../src/game/bot.js');
const { BOSS_CAP } = await import('../src/game/bot-run.js');
let commit = 'unknown';
try { commit = (await import('node:child_process')).execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim(); } catch { /* no git */ }
const meta = { commit, date: new Date().toISOString().slice(0, 10), browserBudget: BROWSER_BUDGET, unitFoes: UNIT_FOES, defaultHorizon: DEFAULT_HORIZON, bossCap: BOSS_CAP, horizonBudgetX: H_BUDGET_X, hLadder: H_LADDER,
    runs: main.length + hor.length, cpuSec: +rows.reduce((s, r) => s + (r.cpuSec || 0), 0).toFixed(0) };
fs.writeFileSync(path.join(root, 'results/g4-bot.json'), JSON.stringify({ meta, main, horizons: hor }, null, 1) + '\n');

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-US'));
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const md = [];
md.push('# G4 — the bot on every stage', '');
md.push(`Written by \`bin/bot-sweep.mjs\` at commit \`${commit}\`, ${meta.date}. ${meta.runs} runs, ${(meta.cpuSec / 3600).toFixed(1)} CPU-hours.`);
md.push(`Budget 1× = ${BROWSER_BUDGET} units per frame (a simulated frame costs 1 + live foe slots / ${UNIT_FOES} units); default horizon ${DEFAULT_HORIZON} frames.`);
md.push(`Seeds s = 1–3: C rand() seed s, endlessSeed 7919 × s. "boss 3 min" = alive ${BOSS_CAP} frames into the boss scene (no-attack's "survived"). Endless modes stop at 30,000 frames.`, '');

const cell = (rs, variant, endless) => {
    if (!rs.length) return '—';
    if (variant === 'attack' && !endless) {
        const c = rs.filter((r) => r.outcome === 'cleared');
        return `${c.length}/${rs.length} cleared${c.length ? ` @${fmt(Math.round(mean(c.map((r) => r.clearFrame))))}` : ''}`;
    }
    if (!endless) return `${rs.filter((r) => r.outcome === 'boss-cap').length}/${rs.length} boss 3 min`;
    return `scene ${rs.map((r) => r.sceneReached).join('/')}${rs.some((r) => r.outcome === 'game over') ? ` (game over ${rs.filter((r) => r.outcome === 'game over').length})` : ''}`;
};
for (const variant of VARIANTS) {
    md.push(`## ${variant}`, '');
    md.push('| Stage | Budget | Result (3 seeds) | Lives lost (per seed) | Score (mean) | Kills z/m/b/boss (mean) | Stars (mean) | Frames (mean) | CPU s (mean) |');
    md.push('|---|---|---|---|---:|---|---:|---:|---:|');
    for (let stage = 0; stage < STAGES.length; stage++) for (const bx of BUDGETS_X) {
        const rs = main.filter((r) => r.stage === stage && r.variant === variant && r.budgetX === bx).sort((a, b) => a.seed - b.seed);
        if (!rs.length) continue;
        const ok = rs.filter((r) => r.livesLost != null);
        const k = [0, 1, 2, 3].map((i) => Math.round(mean(ok.map((r) => r.kills[i])) ?? 0)).join('/');
        md.push(`| ${STAGES[stage]} | ${bx}× | ${cell(ok, variant, stage >= 10)}${ok.length < rs.length ? ` (${rs.length - ok.length} ${rs.find((r) => r.livesLost == null).outcome})` : ''} | ${ok.map((r) => r.livesLost).join(' / ')} | ${fmt(Math.round(mean(ok.map((r) => r.score))))} | ${k} | ${fmt(Math.round(mean(ok.map((r) => r.stars))))} | ${fmt(Math.round(mean(ok.map((r) => r.frames))))} | ${(mean(ok.map((r) => r.cpuSec)) ?? 0).toFixed(0)} |`);
    }
    md.push('');
}

md.push('## How the budget changes the results', '');
md.push('| Variant | Budget | Runs | Stages cleared (1–10) | Boss 3 min (no-attack, 1–10) | Lives lost (total) | Runs with a life lost | Game overs | Mean score, stages 1–10 | Mean bot cost / frame (units) | CPU h |');
md.push('|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
for (const variant of VARIANTS) for (const bx of BUDGETS_X) {
    const rs = main.filter((r) => r.variant === variant && r.budgetX === bx && r.livesLost != null);
    if (!rs.length) continue;
    const st = rs.filter((r) => r.stage < 10);
    md.push(`| ${variant} | ${bx}× (${bx * BROWSER_BUDGET}) | ${rs.length} | ${st.filter((r) => r.outcome === 'cleared').length}/${st.length} | ${variant === 'no-attack' ? `${st.filter((r) => r.outcome === 'boss-cap').length}/${st.length}` : '—'} | ${rs.reduce((s, r) => s + r.livesLost, 0)} | ${rs.filter((r) => r.livesLost > 0).length} | ${rs.filter((r) => r.outcome === 'game over').length} | ${fmt(Math.round(mean(st.map((r) => r.score))))} | ${(mean(rs.map((r) => r.bot.costPerFrame)) ?? 0).toFixed(0)} | ${(rs.reduce((s, r) => s + r.cpuSec, 0) / 3600).toFixed(2)} |`);
}
md.push('');

md.push('## The look-ahead needed (stages 1–10)', '');
md.push(`Budget ${H_BUDGET_X}×. Per stage and seed (1 / 2 / 3), the smallest horizon (frames of exact look-ahead) on the ladder with which`,
    'the bot clears the stage (attack) or lives 3 minutes into the boss scene (no-attack) without losing a life, and the smallest',
    'with which it gets there at all; "—" = no horizon tried did. A seed climbs the ladder until two horizons in a row succeed',
    '(so "·" = not run). Horizon 0 = no simulation: the tail controller alone. The straight tail does not steer off bullets, so',
    'all its dodging is the exact search; the reflex tail steers off bullets by itself. The grid: lives lost at each horizon.', '');
for (const tail of Object.keys(H_LADDER)) {
    md.push(`### ${tail} tail`, '');
    md.push(`| Stage | Variant | Smallest H, no life lost | Smallest H, cleared / boss 3 min | ${H_LADDER[tail].map((h) => `H=${h}`).join(' | ')} |`);
    md.push(`|---|---|---|---|${H_LADDER[tail].map(() => '---').join('|')}|`);
    for (let stage = 0; stage < 10; stage++) for (const variant of VARIANTS) {
        const rs = hor.filter((r) => r.stage === stage && r.variant === variant && r.tail === tail);
        if (!rs.length) continue;
        const bySeed = seeds.map((s) => rs.filter((r) => r.seed === s && r.livesLost != null).sort((a, b) => a.horizon - b.horizon));
        const goal = (r) => (variant === 'attack' ? r.outcome === 'cleared' : r.outcome === 'boss-cap');
        const minH = (pred) => bySeed.map((l) => { const r = l.find(pred); return r ? r.horizon : '—'; }).join(' / ');
        const goalOnly = goal;
        const grid = H_LADDER[tail].map((h) => seeds.map((s) => { const r = rs.find((x) => x.seed === s && x.horizon === h); return r ? (r.livesLost ?? r.outcome) : '·'; }).join('/'));
        md.push(`| ${STAGES[stage]} | ${variant} | ${minH(success)} | ${minH(goalOnly)} | ${grid.join(' | ')} |`);
    }
    md.push('');
}
fs.writeFileSync(path.join(root, 'results/g4-bot.md'), md.join('\n'));
console.log(`wrote results/g4-bot.json, results/g4-bot.md (${rows.length} runs)`);
