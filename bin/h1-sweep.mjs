#!/usr/bin/env node
/**
 * The H1 sweep: the Expert (observed perception) against the Ace (omniscient), sharded — run as GitHub Actions
 * shards (.github/workflows/sweep.yml) or by hand. `node bin/bot-sweep.mjs --perception …` hands over to this script.
 *
 *   node bin/h1-sweep.mjs [--perception observed|omniscient|both] [--variants attack,no-attack]
 *        [--stages 1,2,…,10,ENDLESS] [--seeds 1,2,3] [--horizons 0,4,8,16,32,48,64,96 | none] [--main-horizon 48]
 *        [--budget 1] [--motion straight] [--name h1-bot] [--jobs N] [--shard i/n] [--timeout-min M] [--list]
 *   node bin/h1-sweep.mjs --merge [--expect n] [--name h1-bot] [the same run options]   (combine the shard files)
 *   node bin/h1-sweep.mjs --summary [--name h1-bot] [run options]                      (local parts, no checks)
 *
 * The work comes in CELLS, one per (perception, stage, variant, seed):
 *  - main:   the bot at the main horizon (48), budget × BROWSER_BUDGET; the Expert's tapes go to tapes/h1/;
 *  - ladder: (stages 1–10; `--horizons none` skips it) the look-ahead needed: the horizons from the first up,
 *            until two in a row succeed (no life lost, and cleared / alive 3 minutes into the boss scene). A rung
 *            at the main horizon is the main run.
 * Each run is its own child process (`--one <run json>`), capped at --timeout-min; its row goes to
 * results/.h1-parts/<key>.json (resumable). A run that lost a life is diagnosed (src/game/h1-diagnose.js).
 *
 * Sharding: the cells, sorted longest first, are dealt round-robin to n shards; `--shard i/n` runs shard i
 * (1-based) and writes results/<name>-shards/shard-<i>-of-<n>.json: the run signature (the options above), the rows,
 * and `done: true` once every cell of the shard has finished. `--merge` reads the shard files and FAILS (exit 1,
 * naming them) when a shard of 1..n is missing, unfinished, from another signature or holds a run without a result —
 * a partial table is never written as complete. It writes results/<name>.json and results/<name>.md.
 * Without omniscient rows of its own, the summary takes the Ace from G4 (results/g4-bot.json, budget 1×), whose
 * omniscient path is unchanged (G4 tapes re-record byte for byte; docs/h1-report.md).
 * Seeds: C rand() seed s, endlessSeed 7919 × s (the G2 convention).
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn, execSync } from 'node:child_process';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');
const partsDir = path.join(root, 'results/.h1-parts');
const tapesDir = path.join(root, 'tapes/h1');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };

const STAGES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'ENDLESS', 'HARD', 'EXTREME', 'INSANE'];
const MAX_DIAG = 12;

const pad = (n) => String(n).padStart(2, '0');
// keys: o- = observed (the Expert), a- = omniscient (the Ace)
const runKey = (j) => `${j.perception === 'omniscient' ? 'a' : 'o'}-s${pad(j.stage + 1)}-${j.variant}-seed${j.seed}-h${j.horizon}${j.budgetX !== 1 ? `-b${j.budgetX}x` : ''}${j.motion === 'straight' ? '-straight' : ''}${j.expert ? `-x${expertTag(j.expert)}` : ''}`;
// an --expert override in a part's name: its settings, made file-name safe
function expertTag(x) { return JSON.stringify(x).replace(/[^A-Za-z0-9.]+/g, '_').replace(/^_|_$/g, ''); }
const cellKey = (c) => `${c.perception === 'omniscient' ? 'a' : 'o'}-s${pad(c.stage + 1)}-${c.variant}-seed${c.seed}`;
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
        const { result, tape } = runBot(P, { stage: j.stage, seed: j.seed, variant: j.variant, horizon: j.horizon, budget: j.budgetX * BROWSER_BUDGET, perception: j.perception, motion: j.motion ?? 'curve', expert: j.perception === 'observed' ? j.expert ?? {} : {} });
        if (j.main && j.perception === 'observed' && !j.motion && !j.expert) {
            const file = `s${pad(j.stage + 1)}-${j.variant}-seed${j.seed}-expert${j.budgetX !== 1 ? `-b${j.budgetX}x` : ''}${j.horizon !== 48 ? `-h${j.horizon}` : ''}.json`;
            fs.mkdirSync(tapesDir, { recursive: true });
            fs.writeFileSync(path.join(tapesDir, file), JSON.stringify(tape));
            result.tape = `h1/${file}`;
        }
        const t0 = Date.now();
        const deaths = result.hitFrames.length ? diagnoseDeaths(P, tape, result.hitFrames.slice(0, MAX_DIAG), { motion: j.motion ?? 'curve' }) : [];
        const row = { kind: 'run', ...j, key, ...result, deaths, deathLines: deaths.map(deathLine), diagSec: +((Date.now() - t0) / 1000).toFixed(1) };
        delete row.main;
        fs.writeFileSync(part, JSON.stringify(row));
    }
    process.exit(0);
}

// ── the run signature and the cells ──
const perceptionOpt = opt('perception', 'observed');
const perceptions = perceptionOpt === 'both' ? ['omniscient', 'observed'] : [perceptionOpt];
for (const p of perceptions) if (!['omniscient', 'observed'].includes(p)) { console.error(`unknown perception "${p}"`); process.exit(2); }
const variants = opt('variants', 'attack,no-attack').split(',');
const stageNames = opt('stages', '1,2,3,4,5,6,7,8,9,10,ENDLESS').split(',');
const stagesWanted = stageNames.map((s) => STAGES.indexOf(s));
if (stagesWanted.includes(-1)) { console.error(`unknown stage in "${stageNames}" (have: ${STAGES.join(',')})`); process.exit(2); }
const seeds = opt('seeds', '1,2,3').split(',').map(Number);
const hOpt = opt('horizons', '0,4,8,16,32,48,64,96');
const ladder = hOpt === 'none' || hOpt === '' ? [] : hOpt.split(',').map(Number);
const mainH = Number(opt('main-horizon', 48));
const budgetX = Number(opt('budget', 1));
const motionOpt = opt('motion', null); // null = the Expert's own (curve)
// --expert '{"margin":null}': the Expert's settings changed from its defaults (EXPERT_DEFAULTS in src/game/bot.js), for ablations
const expertOpt = opt('expert', null) ? JSON.parse(opt('expert')) : null;
const name = opt('name', 'h1-bot');
const signature = { perception: perceptionOpt, variants, stages: stageNames, seeds, horizons: ladder, mainHorizon: mainH, budgetX, motion: motionOpt, ...(expertOpt ? { expert: expertOpt } : {}) };
const shardsDir = path.join(root, `results/${name}-shards`);

const cells = [];
for (const perception of perceptions) for (const stage of stagesWanted) for (const variant of variants) for (const seed of seeds) cells.push({ perception, stage, variant, seed });
// longest first (a ladder: up to its length in runs; endless; no-attack lives 3 minutes into the boss scene), in a
// fixed order so every shard deals the same hands
const weight = (c) => (c.stage >= 10 ? 3 : 1 + (ladder.length ? 4 : 0)) * (c.variant === 'no-attack' ? 2 : 1) * (c.perception === 'observed' ? 1 : 0.8);
cells.sort((a, b) => weight(b) - weight(a) || a.perception.localeCompare(b.perception) || a.stage - b.stage || a.variant.localeCompare(b.variant) || a.seed - b.seed);
const [shardI, shardN] = opt('shard', '1/1').split('/').map(Number);
const myCells = cells.filter((_, k) => k % shardN === shardI - 1);

if (args.includes('--list')) {
    for (const c of myCells) console.log(cellKey(c));
    process.exit(0);
}

const readPart = (key) => { const p = path.join(partsDir, `${key}.json`); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; };
let commit = 'unknown';
try { commit = execSync('git rev-parse --short HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* no git */ }

if (!args.includes('--summary') && !args.includes('--merge')) {
    const nJobs = Number(opt('jobs', os.cpus().length));
    const timeoutMs = Number(opt('timeout-min', 150)) * 60_000;
    console.log(`shard ${shardI}/${shardN}: ${myCells.length} of ${cells.length} cells, ${nJobs} at a time`);
    const t0 = Date.now();
    const mine = new Map();
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
                const row = { kind: 'run', ...j, key, outcome: signal ? 'timeout' : `error ${code}` };
                delete row.main;
                fs.writeFileSync(path.join(partsDir, `${key}.json`), JSON.stringify(row));
            }
            const r = readPart(key);
            console.log(`[${((Date.now() - t0) / 60000).toFixed(1)} min] ${key}: ${r.outcome}${r.frames != null ? `, ${r.frames} frames, lives lost ${r.livesLost}, score ${r.score}, ${r.cpuSec}s` : ''}`);
            resolve(r);
        });
    });
    let cellsDone = 0;
    const writeShard = (done) => {
        fs.mkdirSync(shardsDir, { recursive: true });
        fs.writeFileSync(path.join(shardsDir, `shard-${shardI}-of-${shardN}.json`), JSON.stringify({ shard: shardI, of: shardN, signature, done, cells: myCells.length, cellsDone, commit, cores: os.cpus().length, jobs: nJobs, wallMin: +((Date.now() - t0) / 60000).toFixed(1), rows: [...mine.values()] }) + '\n');
    };
    const doCell = async (c) => {
        const base = { perception: c.perception, stage: c.stage, variant: c.variant, seed: c.seed, budgetX, ...(motionOpt ? { motion: motionOpt } : {}), ...(expertOpt && c.perception === 'observed' ? { expert: expertOpt } : {}) };
        const add = (r) => mine.set(r.key, r);
        add(await runOne({ ...base, horizon: mainH, main: true }));
        if (ladder.length && c.stage < 10) {
            let streak = 0;
            for (const horizon of ladder) {
                const r = await runOne({ ...base, horizon, ...(horizon === mainH ? { main: true } : {}) });
                add(r);
                streak = success(r) ? streak + 1 : 0;
                if (streak >= 2) break;
            }
        }
        cellsDone++;
        writeShard(false);
    };
    writeShard(false);
    let next = 0;
    await Promise.all(Array.from({ length: nJobs }, async () => { while (next < myCells.length) await doCell(myCells[next++]); }));
    writeShard(true);
    console.log(`shard ${shardI}/${shardN} done in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
    process.exit(0);
}

// ── the rows: --merge = every shard file of this signature, checked; --summary = the local parts ──
const byKey = new Map();
const shardInfo = [];
if (args.includes('--merge')) {
    const expect = Number(opt('expect', shardN));
    const files = fs.existsSync(shardsDir) ? fs.readdirSync(shardsDir).filter((f) => /^shard-\d+-of-\d+\.json$/.test(f)) : [];
    const problems = [];
    for (let i = 1; i <= expect; i++) {
        const f = path.join(shardsDir, `shard-${i}-of-${expect}.json`);
        if (!fs.existsSync(f)) { problems.push(`shard ${i}/${expect}: missing (${path.relative(root, f)})`); continue; }
        const s = JSON.parse(fs.readFileSync(f, 'utf8'));
        if (JSON.stringify(s.signature) !== JSON.stringify(signature)) { problems.push(`shard ${i}/${expect}: another run signature (${JSON.stringify(s.signature)} ≠ ${JSON.stringify(signature)})`); continue; }
        if (!s.done) { problems.push(`shard ${i}/${expect}: unfinished (${s.cellsDone}/${s.cells} cells)`); continue; }
        const bad = s.rows.filter((r) => r.livesLost == null);
        if (bad.length) problems.push(`shard ${i}/${expect}: ${bad.length} run(s) without a result (${bad.map((r) => `${r.key}: ${r.outcome}`).join(', ')})`);
        shardInfo.push({ shard: `${i}/${expect}`, commit: s.commit, cores: s.cores, jobs: s.jobs, wallMin: s.wallMin, rows: s.rows.length });
        for (const r of s.rows) byKey.set(r.key, r);
    }
    for (const f of files) if (!f.endsWith(`-of-${expect}.json`)) problems.push(`stray shard file ${f} (expected n = ${expect})`);
    if (problems.length) {
        console.error(`merge FAILED — the table would be partial:\n  ${problems.join('\n  ')}`);
        process.exit(1);
    }
    console.log(`merge: all ${expect} shards present and finished, ${byKey.size} runs`);
} else if (fs.existsSync(partsDir)) {
    for (const f of fs.readdirSync(partsDir).filter((x) => x.endsWith('.json'))) { const r = JSON.parse(fs.readFileSync(path.join(partsDir, f), 'utf8')); if (r.kind === 'run') byKey.set(r.key, r); }
}
// rows from before the perception / budget fields (early H1 parts) are the Expert at budget 1×
const allRuns = [...byKey.values()].map((r) => ({ perception: r.key.startsWith('a-') ? 'omniscient' : 'observed', budgetX: 1, ...r })).sort((a, b) => a.key.localeCompare(b.key));
const sel = (r) => r.budgetX === budgetX && (r.perception === 'omniscient' || JSON.stringify(r.expert ?? null) === JSON.stringify(expertOpt));
const runs = allRuns.filter((r) => r.perception === 'observed' && !r.motion && sel(r));
const straightRuns = allRuns.filter((r) => r.perception === 'observed' && r.motion === 'straight' && sel(r));
const aceOwn = allRuns.filter((r) => r.perception === 'omniscient' && sel(r));
const g4 = JSON.parse(fs.readFileSync(path.join(root, 'results/g4-bot.json'), 'utf8'));
const aceFromG4 = !aceOwn.length;
const ace = aceFromG4 ? g4.main.filter((r) => r.budgetX === 1 && r.tail === 'straight').map((r) => ({ ...r, horizon: 48 })) : aceOwn;
const aceLadder = aceFromG4 ? g4.horizons.filter((r) => r.tail === 'straight') : aceOwn;
const stagesShown = STAGES.map((_, i) => i).filter((i) => allRuns.some((r) => r.stage === i));
const variantsShown = ['attack', 'no-attack'].filter((v) => allRuns.some((r) => r.variant === v));
const seedsShown = [...new Set(allRuns.map((r) => r.seed))].sort((a, b) => a - b);
const { BROWSER_BUDGET, MODEL_BASE, MODEL_FOES, UNIT_FOES, EXPERT_DEFAULTS, expertSettings } = await import('../src/game/bot.js');
const expertUsed = expertSettings({ ...EXPERT_DEFAULTS, ...(expertOpt ?? {}) });
const { BOSS_CAP } = await import('../src/game/bot-run.js');
const ok = (r) => r.livesLost != null;
const meta = { commit, date: new Date().toISOString().slice(0, 10), signature, browserBudget: BROWSER_BUDGET, unitFoes: UNIT_FOES, modelBase: MODEL_BASE, modelFoes: MODEL_FOES, bossCap: BOSS_CAP, aceFromG4, expert: expertUsed,
    runs: allRuns.length, cpuSec: Math.round(allRuns.reduce((s, r) => s + (r.cpuSec || 0) + (r.diagSec || 0), 0)), shards: shardInfo };
fs.writeFileSync(path.join(root, `results/${name}.json`), JSON.stringify({ meta, runs: allRuns }) + '\n');

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-US'));
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const md = [];
md.push('# H1 — the Expert (observed perception) against the Ace (omniscient)', '');
md.push(`Written by \`bin/h1-sweep.mjs ${args.includes('--merge') ? '--merge' : '--summary'}\` at commit \`${commit}\`, ${meta.date}, from ${allRuns.length} runs (${(meta.cpuSec / 3600).toFixed(1)} CPU-hours, diagnosis included)${shardInfo.length ? ` in ${shardInfo.length} shards` : ' (local parts)'}.`);
md.push(`Budget ${budgetX}× = ${budgetX * BROWSER_BUDGET} units per frame; main horizon ${mainH}. ${aceFromG4 ? 'The Ace\'s rows are G4\'s (results/g4-bot.json, budget 1×, horizon 48, its own ladder 0, 1, 2, 4, …).' : 'The Ace ran in this sweep.'}`);
md.push(`The Expert's settings: ${Object.keys(expertUsed).length ? `\`${JSON.stringify(expertUsed)}\`` : 'none (the H1 Expert)'}${expertOpt ? ` (changed by --expert \`${JSON.stringify(expertOpt)}\`)` : ' (its defaults, EXPERT_DEFAULTS in src/game/bot.js)'}: margin = the clearance in px it keeps from a bullet's drawn trail and from a spawner (an enemy, an active bullet, a dot not yet moving); attackY = the height it attacks from, px from the top.`);
md.push(`Seeds: C rand() seed s, endlessSeed 7919 × s. "boss 3 min" = alive ${BOSS_CAP} frames into the boss scene (no-attack's goal). Endless modes stop at 30,000 frames.`, '');

const cellRes = (r, variant, endless) => {
    if (!r) return '·';
    if (!ok(r)) return r.outcome;
    if (endless) return `scene ${r.sceneReached}${r.outcome === 'game over' ? ' (game over)' : ''}`;
    if (variant === 'attack') return r.outcome === 'cleared' ? `cleared @${fmt(r.clearFrame)}` : r.outcome;
    return r.outcome === 'boss-cap' ? 'boss 3 min' : r.outcome;
};
const S = seedsShown.join('/');
md.push(`## Expert vs Ace, horizon ${mainH}`, '');
for (const variant of variantsShown) {
    md.push(`### ${variant}`, '');
    md.push(`| Stage | Ace: result (seeds ${S}) | Ace: lives lost | Ace: score (mean) | Expert: result | Expert: lives lost | Expert: score (mean) | Expert: surprises / repairs / failed (mean) |`);
    md.push('|---|---|---|---:|---|---|---:|---|');
    for (const stage of stagesShown) {
        const A = seedsShown.map((s) => ace.find((r) => r.stage === stage && r.variant === variant && r.seed === s && r.horizon === mainH));
        const E = seedsShown.map((s) => runs.find((r) => r.stage === stage && r.variant === variant && r.seed === s && r.horizon === mainH));
        const e = E.filter((r) => r && ok(r)), a = A.filter((r) => r && ok(r));
        md.push(`| ${STAGES[stage]} | ${A.map((r) => cellRes(r, variant, stage >= 10)).join(' / ')} | ${A.map((r) => (r && ok(r) ? r.livesLost : '·')).join(' / ')} | ${fmt(Math.round(mean(a.map((r) => r.score))))} | ${E.map((r) => cellRes(r, variant, stage >= 10)).join(' / ')} | ${E.map((r) => (r && ok(r) ? r.livesLost : '·')).join(' / ')} | ${fmt(Math.round(mean(e.map((r) => r.score))))} | ${e.length ? `${Math.round(mean(e.map((r) => r.bot.surprises)))} / ${Math.round(mean(e.map((r) => r.bot.repairs)))} / ${Math.round(mean(e.map((r) => r.bot.repairFails)))}` : '·'} |`);
    }
    md.push('');
}
md.push('### Totals, stages 1–10', '');
md.push('| Variant | Bot | Runs | Goal reached (cleared / boss 3 min) | No life lost | Lives lost (total) | Game overs | Mean score |');
md.push('|---|---|---:|---:|---:|---:|---:|---:|');
for (const variant of variantsShown) for (const [who, rows] of [['Ace', ace], ['Expert', runs]]) {
    const rs = rows.filter((r) => r.variant === variant && r.stage < 10 && r.horizon === mainH && ok(r) && seedsShown.includes(r.seed) && stagesShown.includes(r.stage));
    if (!rs.length) continue;
    md.push(`| ${variant} | ${who} | ${rs.length} | ${rs.filter(goal).length} | ${rs.filter((r) => r.livesLost === 0).length} | ${rs.reduce((s, r) => s + r.livesLost, 0)} | ${rs.filter((r) => r.outcome === 'game over').length} | ${variant === 'attack' ? fmt(Math.round(mean(rs.map((r) => r.score)))) : '—'} |`);
}
md.push('');

const hs = [...new Set(runs.filter((r) => r.stage < 10).map((r) => r.horizon))].sort((a, b) => a - b);
const ladderTable = (title, rows, lad) => {
    md.push(title, '');
    md.push(`| Stage | Variant | Smallest H, no life lost | Smallest H, goal | ${lad.map((h) => `H=${h}`).join(' | ')} |`);
    md.push(`|---|---|---|---|${lad.map(() => '---').join('|')}|`);
    for (const stage of stagesShown.filter((s) => s < 10)) for (const variant of variantsShown) {
        const rs = rows.filter((r) => r.stage === stage && r.variant === variant);
        if (!rs.length) continue;
        const bySeed = seedsShown.map((s) => rs.filter((r) => r.seed === s && ok(r)).sort((a, b) => a.horizon - b.horizon));
        const minH = (pred) => bySeed.map((l) => { const r = l.find(pred); return r ? r.horizon : '—'; }).join(' / ');
        const grid = lad.map((h) => seedsShown.map((s) => { const r = rs.find((x) => x.seed === s && x.horizon === h); return r ? (ok(r) ? `${r.livesLost}${r.outcome === 'game over' ? 'g' : ''}` : r.outcome) : '·'; }).join('/'));
        md.push(`| ${STAGES[stage]} | ${variant} | ${minH(success)} | ${minH(goal)} | ${grid.join(' | ')} |`);
    }
    md.push('');
};
md.push('## The look-ahead needed (stages 1–10)', '');
md.push(`Per stage and seed (${S}): the smallest horizon run with which the bot reaches the goal (cleared / boss 3 min) with no`,
    'life lost, and the smallest with which it reaches the goal at all; "—" = none run did. A seed climbs the ladder until two',
    'horizons in a row succeed, so "·" = not run. H = 0 is the tail controller alone (no simulation, no dodging). The grid:',
    'lives lost at each horizon (g = game over).', '');
ladderTable('### Expert (observed)', runs, hs);
const aceHs = [...new Set(aceLadder.filter((r) => r.stage < 10).map((r) => r.horizon))].sort((a, b) => a - b);
ladderTable(`### Ace (omniscient${aceFromG4 ? ', the G4 ladder' : ''})`, aceLadder, aceHs);

md.push(`## Where the Expert dies (horizon ${mainH})`, '');
md.push('Per lost life: the frame, the bullet that hit (speed, frames on screen, its motion since first seen, who fired it), and',
    '"predicted k frames ahead" = for how many frames before the hit the bot\'s own model (the picture of that frame,',
    'predicted forward along the ship\'s real path) showed that hit. The scene\'s patterns follow each hit.', '');
for (const r of runs.filter((x) => x.horizon === mainH && x.livesLost > 0)) {
    md.push(`- **${STAGES[r.stage]} ${r.variant} seed ${r.seed}** (${r.livesLost} lost, ${r.outcome}):`);
    for (let k = 0; k < r.deaths.length; k++) md.push(`  - ${r.deathLines[k]} — scene: ${r.deaths[k].scene.map((n) => n.replace(/\.xml$/, '')).join(', ')}`);
}
if (!runs.some((x) => x.horizon === mainH && x.livesLost > 0)) md.push('- none');
md.push('');
const CAUSES = ['fired in the hit\'s own frame (never seen)', 'a dot not yet moving', 'motion changed after the last look', 'predicted 1–2 frames ahead', 'predicted ≥ 3 frames ahead'];
const cause = (b) => (b.unseen ? CAUSES[0] : b.unseenDot ? CAUSES[1] : b.warned === 0 ? CAUSES[2] : b.warned <= 2 ? CAUSES[3] : CAUSES[4]);
md.push(`## The causes, every diagnosed Expert hit (the first ${MAX_DIAG} per run)`, '');
md.push(`| Horizon | Hits diagnosed | ${CAUSES.join(' | ')} | of them aimed |`);
md.push(`|---|---:|${CAUSES.map(() => '---:').join('|')}|---:|`);
for (const h of hs) {
    const hb = runs.filter((r) => r.horizon === h && r.deaths).flatMap((r) => r.deaths.map((d) => d.bullets[0]).filter(Boolean));
    if (!hb.length) continue;
    md.push(`| ${h} | ${hb.length} | ${CAUSES.map((c) => hb.filter((b) => cause(b) === c).length).join(' | ')} | ${hb.filter((b) => b.aimed).length} |`);
}
md.push('');
if (straightRuns.length) {
    md.push(`## Ablation: straight-line extrapolation only (no turn / speed-change fit), horizon ${mainH}`, '');
    md.push(`| Stage | Variant | Expert (curve): lives lost, seeds ${S} | Straight only: lives lost | Straight only: result |`);
    md.push('|---|---|---|---|---|');
    for (const stage of stagesShown) for (const variant of variantsShown) {
        const St = seedsShown.map((s) => straightRuns.find((r) => r.stage === stage && r.variant === variant && r.seed === s && r.horizon === mainH));
        if (!St.some(Boolean)) continue;
        const E = seedsShown.map((s) => runs.find((r) => r.stage === stage && r.variant === variant && r.seed === s && r.horizon === mainH));
        md.push(`| ${STAGES[stage]} | ${variant} | ${E.map((r) => (r && ok(r) ? r.livesLost : '·')).join(' / ')} | ${St.map((r) => (r && ok(r) ? r.livesLost : '·')).join(' / ')} | ${St.map((r) => cellRes(r, variant, stage >= 10)).join(' / ')} |`);
    }
    md.push('');
}
md.push('## Shards', '');
md.push(shardInfo.length ? shardInfo.map((s) => `- shard ${s.shard}: ${s.rows} runs at \`${s.commit}\`, ${s.wallMin} min wall, ${s.jobs} jobs on ${s.cores} cores`).join('\n') : '- (local parts only)');
fs.writeFileSync(path.join(root, `results/${name}.md`), md.join('\n') + '\n');
console.log(`wrote results/${name}.json, results/${name}.md (${allRuns.length} runs)`);
