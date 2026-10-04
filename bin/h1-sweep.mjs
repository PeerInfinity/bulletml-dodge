#!/usr/bin/env node
/**
 * The H1 sweep: the Expert (observed perception) on every stage, sharded so several sessions can split it.
 *
 *   node bin/h1-sweep.mjs [--jobs N] [--shard i/n] [--only main|ladder] [--stages 1,2,…,ENDLESS] [--seeds 1,2,3]
 *        [--timeout-min M] [--motion straight] [--list] [--summary]
 *   (also: node bin/bot-sweep.mjs --perception observed …, which hands over to this script)
 *
 * The work comes in CELLS, one per (stage, variant, seed):
 *  - main:   the Expert at the default horizon (48), budget 1× — its tape goes to tapes/h1/;
 *  - ladder: (stages 1–10) the look-ahead needed: the horizons H_LADDER from 0 up, until two in a row succeed
 *            (no life lost, and cleared / alive 3 minutes into the boss scene). The rung at 48 is the main run.
 * Each run is its own child process (`--one <run json>`), capped at --timeout-min; its row goes to
 * results/.h1-parts/<key>.json (resumable). A run that lost a life is diagnosed (src/game/h1-diagnose.js): which
 * bullet hit, how long it was on screen, its motion, its shooter, whether the bot's model saw it coming.
 *
 * `--motion straight` (an ablation): the Expert extrapolates every object in a straight line from its last motion
 * (no turn / speed-change fit); its runs are keyed `…-straight` and keep no tapes.
 * Sharding: the cells, sorted longest first, are dealt round-robin to n shards; `--shard i/n` runs shard i
 * (1-based) and writes its rows to results/h1-shards/shard-<i>-of-<n>.json (commit that file and tapes/h1/).
 * `--summary` merges the local parts with every results/h1-shards/*.json and writes results/h1-bot.json and
 * results/h1-bot.md. The Ace (omniscient) rows are G4's budget-1× rows (results/g4-bot.json): the bot code of the
 * omniscient path is unchanged, and G4 tapes re-record byte for byte (docs/h1-report.md).
 * Seeds: C rand() seed s, endlessSeed 7919 × s (the G2 convention).
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn, execSync } from 'node:child_process';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');
const partsDir = path.join(root, 'results/.h1-parts');
const shardsDir = path.join(root, 'results/h1-shards');
const tapesDir = path.join(root, 'tapes/h1');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };

const STAGES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'ENDLESS', 'HARD', 'EXTREME', 'INSANE'];
const VARIANTS = ['attack', 'no-attack'];
export const H_LADDER = [0, 4, 8, 16, 32, 48, 64, 96];
const MAIN_H = 48, BUDGET_X = 1, MAX_DIAG = 12;

const pad = (n) => String(n).padStart(2, '0');
const runKey = (j) => `o-s${pad(j.stage + 1)}-${j.variant}-seed${j.seed}-h${j.horizon}${j.motion === 'straight' ? '-straight' : ''}`;
const cellKey = (c) => `c-s${pad(c.stage + 1)}-${c.variant}-seed${c.seed}`;
const success = (r) => r.livesLost === 0 && (r.variant === 'attack' ? r.outcome === 'cleared' : r.outcome === 'boss-cap');
const goal = (r) => (r.variant === 'attack' ? r.outcome === 'cleared' : r.outcome === 'boss-cap');

// ── one run, in its own process ──
if (opt('one', null)) {
    const { loadNoiz2saPatterns } = await import('../src/game/patterns-node.js');
    const { runBot } = await import('../src/game/bot-run.js');
    const { BROWSER_BUDGET } = await import('../src/game/bot.js');
    const { diagnoseDeaths, deathLine } = await import('../src/game/h1-diagnose.js');
    const P = loadNoiz2saPatterns();
    const j = JSON.parse(opt('one'));
    const key = runKey(j), part = path.join(partsDir, `${key}.json`);
    fs.mkdirSync(partsDir, { recursive: true });
    if (!fs.existsSync(part)) {
        const { result, tape } = runBot(P, { stage: j.stage, seed: j.seed, variant: j.variant, horizon: j.horizon, budget: BUDGET_X * BROWSER_BUDGET, perception: 'observed', motion: j.motion ?? 'curve' });
        if (j.horizon === MAIN_H && !j.motion) {
            fs.mkdirSync(tapesDir, { recursive: true });
            fs.writeFileSync(path.join(tapesDir, `${key.slice(2)}.json`), JSON.stringify(tape));
            result.tape = `h1/${key.slice(2)}.json`;
        }
        const t0 = Date.now();
        const deaths = result.hitFrames.length ? diagnoseDeaths(P, tape, result.hitFrames.slice(0, MAX_DIAG), { motion: j.motion ?? 'curve' }) : [];
        const row = { kind: 'run', ...j, key, ...result, deaths, deathLines: deaths.map(deathLine), diagSec: +((Date.now() - t0) / 1000).toFixed(1) };
        fs.writeFileSync(part, JSON.stringify(row));
    }
    process.exit(0);
}

// ── the cells ──
const seeds = opt('seeds', '1,2,3').split(',').map(Number);
const stagesWanted = opt('stages', '1,2,3,4,5,6,7,8,9,10,ENDLESS').split(',').map((s) => STAGES.indexOf(s));
const only = opt('only', null);
const motionOpt = opt('motion', null); // null = the Expert's own (curve)
const cells = [];
for (const stage of stagesWanted) for (const variant of VARIANTS) for (const seed of seeds) cells.push({ stage, variant, seed });
// longest first (endless, then no-attack: it lives 3 minutes into the boss scene), a fixed order so shards agree
const weight = (c) => (c.stage >= 10 ? 3 : 1 + (c.stage < 10 && only !== 'main' ? 4 : 0)) * (c.variant === 'no-attack' ? 2 : 1);
cells.sort((a, b) => weight(b) - weight(a) || a.stage - b.stage || a.variant.localeCompare(b.variant) || a.seed - b.seed);
const [shardI, shardN] = (opt('shard', '1/1')).split('/').map(Number);
const myCells = cells.filter((_, k) => k % shardN === shardI - 1);

if (args.includes('--list')) {
    for (const c of myCells) console.log(cellKey(c));
    process.exit(0);
}

const readPart = (key) => { const p = path.join(partsDir, `${key}.json`); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; };

if (!args.includes('--summary')) {
    const nJobs = Number(opt('jobs', os.cpus().length));
    const timeoutMs = Number(opt('timeout-min', 150)) * 60_000;
    console.log(`shard ${shardI}/${shardN}: ${myCells.length} of ${cells.length} cells, ${nJobs} at a time`);
    const t0 = Date.now();
    const mine = [];
    const runOne = (j) => new Promise((resolve) => {
        const key = runKey(j);
        const have = readPart(key);
        if (have) { resolve(have); return; }
        const child = spawn(process.execPath, [path.join(here, 'h1-sweep.mjs'), '--one', JSON.stringify(j)], { stdio: ['ignore', 'inherit', 'inherit'] });
        const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
        child.on('close', (code, signal) => {
            clearTimeout(timer);
            if (code !== 0) {
                fs.mkdirSync(partsDir, { recursive: true });
                fs.writeFileSync(path.join(partsDir, `${key}.json`), JSON.stringify({ kind: 'run', ...j, key, outcome: signal ? 'timeout' : `error ${code}` }));
            }
            const r = readPart(key);
            console.log(`[${((Date.now() - t0) / 60000).toFixed(1)} min] ${key}: ${r.outcome}${r.frames != null ? `, ${r.frames} frames, lives lost ${r.livesLost}, score ${r.score}, ${r.cpuSec}s` : ''}`);
            resolve(r);
        });
    });
    const writeShard = () => {
        fs.mkdirSync(shardsDir, { recursive: true });
        let commit = 'unknown';
        try { commit = execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim(); } catch { /* no git */ }
        fs.writeFileSync(path.join(shardsDir, `shard-${shardI}-of-${shardN}${motionOpt ? `-${motionOpt}` : ''}${only ? `-${only}` : ''}.json`), JSON.stringify({ shard: `${shardI}/${shardN}`, commit, cores: os.cpus().length, jobs: nJobs, wallMin: +((Date.now() - t0) / 60000).toFixed(1), rows: mine }, null, 0) + '\n');
    };
    const doCell = async (c) => {
        const base = { stage: c.stage, variant: c.variant, seed: c.seed, ...(motionOpt ? { motion: motionOpt } : {}) };
        if (only !== 'ladder') mine.push(await runOne({ ...base, horizon: MAIN_H }));
        if (only !== 'main' && c.stage < 10) {
            let streak = 0;
            for (const horizon of H_LADDER) {
                const r = await runOne({ ...base, horizon });
                if (horizon !== MAIN_H || only === 'ladder') mine.push(r);
                streak = success(r) ? streak + 1 : 0;
                if (streak >= 2) break;
            }
        }
        writeShard();
    };
    let next = 0;
    await Promise.all(Array.from({ length: nJobs }, async () => { while (next < myCells.length) await doCell(myCells[next++]); }));
    writeShard();
    console.log(`shard ${shardI}/${shardN} done in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
    if (shardN > 1) process.exit(0);
}

// ── the summary: every run row from the local parts and the shard files ──
const byKey = new Map();
if (fs.existsSync(partsDir)) for (const f of fs.readdirSync(partsDir).filter((x) => x.endsWith('.json'))) { const r = JSON.parse(fs.readFileSync(path.join(partsDir, f), 'utf8')); byKey.set(r.key, r); }
const shardInfo = [];
if (fs.existsSync(shardsDir)) for (const f of fs.readdirSync(shardsDir).filter((x) => x.endsWith('.json')).sort()) {
    const s = JSON.parse(fs.readFileSync(path.join(shardsDir, f), 'utf8'));
    shardInfo.push({ shard: s.shard, commit: s.commit, cores: s.cores, jobs: s.jobs, wallMin: s.wallMin, rows: s.rows.length });
    for (const r of s.rows) if (!byKey.has(r.key) || byKey.get(r.key).frames == null) byKey.set(r.key, r);
}
const allRuns = [...byKey.values()].filter((r) => r.kind === 'run').sort((a, b) => a.key.localeCompare(b.key));
const runs = allRuns.filter((r) => !r.motion), straightRuns = allRuns.filter((r) => r.motion === 'straight');
const stagesShown = STAGES.map((_, i) => i).filter((i) => runs.some((r) => r.stage === i));
// the Ace: G4's budget-1× main rows and its straight-tail ladder
const g4 = JSON.parse(fs.readFileSync(path.join(root, 'results/g4-bot.json'), 'utf8'));
const ace = g4.main.filter((r) => r.budgetX === 1 && r.tail === 'straight');
const aceLadder = g4.horizons.filter((r) => r.tail === 'straight');
const { BROWSER_BUDGET, MODEL_BASE, MODEL_FOES, UNIT_FOES } = await import('../src/game/bot.js');
const { BOSS_CAP } = await import('../src/game/bot-run.js');
let commit = 'unknown';
try { commit = execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim(); } catch { /* no git */ }
const ok = (r) => r.livesLost != null;
const meta = { commit, date: new Date().toISOString().slice(0, 10), browserBudget: BROWSER_BUDGET, unitFoes: UNIT_FOES, modelBase: MODEL_BASE, modelFoes: MODEL_FOES, mainHorizon: MAIN_H, budgetX: BUDGET_X, hLadder: H_LADDER, bossCap: BOSS_CAP,
    runs: allRuns.length, cpuSec: Math.round(allRuns.reduce((s, r) => s + (r.cpuSec || 0) + (r.diagSec || 0), 0)), shards: shardInfo };
fs.writeFileSync(path.join(root, 'results/h1-bot.json'), JSON.stringify({ meta, runs: allRuns }, null, 0) + '\n');

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-US'));
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const md = [];
md.push('# H1 — the Expert (observed perception) against the Ace (omniscient)', '');
md.push(`Written by \`bin/h1-sweep.mjs --summary\` at commit \`${commit}\`, ${meta.date}, from ${allRuns.length} Expert runs (${(meta.cpuSec / 3600).toFixed(1)} CPU-hours, diagnosis included)${shardInfo.length ? ` in ${shardInfo.length} shard file(s)` : ''}.`);
md.push(`Budget ${BUDGET_X}× = ${BROWSER_BUDGET} units per frame. The Ace's rows are G4's (results/g4-bot.json, budget 1×, horizon 48). Seeds s = 1–3: C rand() seed s, endlessSeed 7919 × s.`);
md.push(`"boss 3 min" = alive ${BOSS_CAP} frames into the boss scene (no-attack's goal). ENDLESS stops at 30,000 frames.`, '');

const cellRes = (r, variant, endless) => {
    if (!r) return '·';
    if (!ok(r)) return r.outcome;
    if (endless) return `scene ${r.sceneReached}${r.outcome === 'game over' ? ' (game over)' : ''}`;
    if (variant === 'attack') return r.outcome === 'cleared' ? `cleared @${fmt(r.clearFrame)}` : r.outcome;
    return r.outcome === 'boss-cap' ? 'boss 3 min' : r.outcome;
};
md.push('## Expert vs Ace, horizon 48', '');
for (const variant of VARIANTS) {
    md.push(`### ${variant}`, '');
    md.push('| Stage | Ace: result (seeds 1/2/3) | Ace: lives lost | Ace: score (mean) | Expert: result (seeds 1/2/3) | Expert: lives lost | Expert: score (mean) | Expert: surprises / repairs / failed (mean) |');
    md.push('|---|---|---|---:|---|---|---:|---|');
    for (const stage of stagesShown) {
        const A = seeds.map((s) => ace.find((r) => r.stage === stage && r.variant === variant && r.seed === s));
        const E = seeds.map((s) => runs.find((r) => r.stage === stage && r.variant === variant && r.seed === s && r.horizon === MAIN_H));
        const e = E.filter((r) => r && ok(r)), a = A.filter((r) => r && ok(r));
        md.push(`| ${STAGES[stage]} | ${A.map((r) => cellRes(r, variant, stage >= 10)).join(' / ')} | ${A.map((r) => (r ? r.livesLost : '·')).join(' / ')} | ${fmt(Math.round(mean(a.map((r) => r.score))))} | ${E.map((r) => cellRes(r, variant, stage >= 10)).join(' / ')} | ${E.map((r) => (r && ok(r) ? r.livesLost : '·')).join(' / ')} | ${fmt(Math.round(mean(e.map((r) => r.score))))} | ${e.length ? `${Math.round(mean(e.map((r) => r.bot.surprises)))} / ${Math.round(mean(e.map((r) => r.bot.repairs)))} / ${Math.round(mean(e.map((r) => r.bot.repairFails)))}` : '·'} |`);
    }
    md.push('');
}
md.push('### Totals, stages 1–10', '');
md.push('| Variant | Bot | Runs | Goal reached (cleared / boss 3 min) | No life lost | Lives lost (total) | Game overs | Mean score |');
md.push('|---|---|---:|---:|---:|---:|---:|---:|');
for (const variant of VARIANTS) for (const [name, rows] of [['Ace', ace], ['Expert', runs.filter((r) => r.horizon === MAIN_H)]]) {
    const rs = rows.filter((r) => r.variant === variant && r.stage < 10 && ok(r) && seeds.includes(r.seed) && stagesShown.includes(r.stage));
    if (!rs.length) continue;
    md.push(`| ${variant} | ${name} | ${rs.length} | ${rs.filter(goal).length} | ${rs.filter((r) => r.livesLost === 0).length} | ${rs.reduce((s, r) => s + r.livesLost, 0)} | ${rs.filter((r) => r.outcome === 'game over').length} | ${variant === 'attack' ? fmt(Math.round(mean(rs.map((r) => r.score)))) : '—'} |`);
}
md.push('');

md.push('## The look-ahead needed (stages 1–10, Expert)', '');
md.push('Per stage and seed (1 / 2 / 3): the smallest horizon on the ladder with which the Expert reaches the goal (cleared /',
    'boss 3 min) with no life lost, and the smallest with which it reaches the goal at all; "—" = none tried did. A seed climbs',
    `the ladder (${H_LADDER.join(', ')}) until two horizons in a row succeed, so "·" = not run. H = 0 is the tail controller alone`,
    '(no simulation). The grid: lives lost at each horizon (g = game over). The Ace (G4 ladder, straight tail): the smallest H with no life lost.', '');
md.push(`| Stage | Variant | Ace | Expert: smallest H, no life lost | Expert: smallest H, goal | ${H_LADDER.map((h) => `H=${h}`).join(' | ')} |`);
md.push(`|---|---|---|---|---|${H_LADDER.map(() => '---').join('|')}|`);
for (const stage of stagesShown.filter((s) => s < 10)) for (const variant of VARIANTS) {
    const rs = runs.filter((r) => r.stage === stage && r.variant === variant);
    if (!rs.length) continue;
    const bySeed = seeds.map((s) => rs.filter((r) => r.seed === s && ok(r)).sort((a, b) => a.horizon - b.horizon));
    const minH = (pred) => bySeed.map((l) => { const r = l.find(pred); return r ? r.horizon : '—'; }).join(' / ');
    const aceMin = seeds.map((s) => { const l = aceLadder.filter((r) => r.stage === stage && r.variant === variant && r.seed === s && ok(r)).sort((a, b) => a.horizon - b.horizon).find(success); return l ? l.horizon : '—'; }).join(' / ');
    const grid = H_LADDER.map((h) => seeds.map((s) => { const r = rs.find((x) => x.seed === s && x.horizon === h); return r ? (ok(r) ? `${r.livesLost}${r.outcome === 'game over' ? 'g' : ''}` : r.outcome) : '·'; }).join('/'));
    md.push(`| ${STAGES[stage]} | ${variant} | ${aceMin} | ${minH(success)} | ${minH(goal)} | ${grid.join(' | ')} |`);
}
md.push('');

md.push('## Where the Expert dies (horizon 48)', '');
md.push('Per lost life: the frame, the bullet that hit (speed, frames on screen, its motion since first seen, who fired it), and',
    '"seen k frames ahead" = for how many frames before the hit the bot\'s own model (the picture of that frame, predicted',
    'forward along the ship\'s real path) showed that hit. The scene\'s patterns follow each run.', '');
for (const r of runs.filter((x) => x.horizon === MAIN_H && x.livesLost > 0)) {
    md.push(`- **${STAGES[r.stage]} ${r.variant} seed ${r.seed}** (${r.livesLost} lost, ${r.outcome}):`);
    for (let k = 0; k < r.deaths.length; k++) md.push(`  - ${r.deathLines[k]} — scene: ${r.deaths[k].scene.map((n) => n.replace(/\.xml$/, '')).join(', ')}`);
}
md.push('');
// the causes, over every diagnosed hit (all horizons)
const cause = (b) => (b.unseen ? 'fired in the hit\'s own frame (never seen)' : b.unseenDot ? 'a dot not yet moving' : b.warned === 0 ? 'motion changed after the last look' : b.warned <= 2 ? 'seen 1–2 frames ahead' : 'seen ≥ 3 frames ahead (cornered)');
md.push('## The causes, every diagnosed hit', '');
md.push('| Horizon | Hits diagnosed | ' + ['fired in the hit\'s own frame (never seen)', 'a dot not yet moving', 'motion changed after the last look', 'seen 1–2 frames ahead', 'seen ≥ 3 frames ahead (cornered)'].join(' | ') + ' | of them aimed |');
md.push('|---|---:|---:|---:|---:|---:|---:|---:|');
for (const h of H_LADDER) {
    const hs = runs.filter((r) => r.horizon === h && r.deaths).flatMap((r) => r.deaths.map((d) => d.bullets[0]).filter(Boolean));
    if (!hs.length) continue;
    const n = (c) => hs.filter((b) => cause(b) === c).length;
    md.push(`| ${h} | ${hs.length} | ${n('fired in the hit\'s own frame (never seen)')} | ${n('a dot not yet moving')} | ${n('motion changed after the last look')} | ${n('seen 1–2 frames ahead')} | ${n('seen ≥ 3 frames ahead (cornered)')} | ${hs.filter((b) => b.aimed).length} |`);
}
md.push('');
if (straightRuns.length) {
    md.push('## Ablation: straight-line extrapolation only (no turn / speed-change fit), horizon 48', '');
    md.push('| Stage | Variant | Expert (curve): lives lost, seeds 1/2/3 | Straight only: lives lost | Straight only: result |');
    md.push('|---|---|---|---|---|');
    for (const stage of stagesShown) for (const variant of VARIANTS) {
        const S = seeds.map((s) => straightRuns.find((r) => r.stage === stage && r.variant === variant && r.seed === s && r.horizon === MAIN_H));
        if (!S.some(Boolean)) continue;
        const E = seeds.map((s) => runs.find((r) => r.stage === stage && r.variant === variant && r.seed === s && r.horizon === MAIN_H));
        md.push(`| ${STAGES[stage]} | ${variant} | ${E.map((r) => (r && ok(r) ? r.livesLost : '·')).join(' / ')} | ${S.map((r) => (r && ok(r) ? r.livesLost : '·')).join(' / ')} | ${S.map((r) => cellRes(r, variant, stage >= 10)).join(' / ')} |`);
    }
    const tot = (rs) => rs.filter((r) => r && ok(r) && r.horizon === MAIN_H).reduce((a, r) => a + r.livesLost, 0);
    md.push('', `Lives lost in total: curve ${tot(runs.filter((r) => straightRuns.some((x) => x.stage === r.stage && x.variant === r.variant && x.seed === r.seed)))}, straight ${tot(straightRuns)}.`, '');
}
md.push('## Shards', '');
md.push(shardInfo.length ? shardInfo.map((s) => `- shard ${s.shard}: ${s.rows} runs at \`${s.commit}\`, ${s.wallMin} min wall, ${s.jobs} jobs on ${s.cores} cores`).join('\n') : '- (local parts only)');
fs.writeFileSync(path.join(root, 'results/h1-bot.md'), md.join('\n') + '\n');
console.log(`wrote results/h1-bot.json, results/h1-bot.md (${runs.length} runs)`);
