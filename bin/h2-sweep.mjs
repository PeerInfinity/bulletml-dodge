#!/usr/bin/env node
/**
 * The H2 sweep: humanlike bots (presets and skill levels, src/game/human.js) × stages × seeds, sharded like the H1
 * sweep (bin/h1-sweep.mjs: cells dealt round-robin, longest first, to n shards; one child process per run; a strict
 * merge). Run as GitHub Actions shards (.github/workflows/h2-sweep.yml) or by hand. This is slice H3's calibration tool.
 *
 *   node bin/h2-sweep.mjs [--presets "Expert,Steady,Panicky 70,…" | all | none] [--preset-skills 0,50,100] [--skills 0,25,50,75,100 | none]
 *        [--variants attack] [--stages 1,…,10] [--seeds 1,2,3] [--bot-seeds 1] [--budget 1] [--hitbox centered] [--name h2-bot]
 *        [--jobs N] [--shard i/n] [--timeout-min M] [--tapes] [--list]
 *   node bin/h2-sweep.mjs --merge [--expect n] [the same run options]   (combine the shard files; fails if one is missing)
 *   node bin/h2-sweep.mjs --summary [the same run options]               (the local parts, no checks)
 *   node bin/h2-sweep.mjs --from a.json[,b.json] [the same run options]  (re-report earlier results files' runs)
 *
 * A PLAYER is a preset name (a personality alone plays at skill 50; "Panicky 70" at 70; --preset-skills plays every
 * personality named alone at each of those skills), "skill N" (the slider), or "path N" (a point of the slider's path without its curve, for
 * calibration; give it with --presets); a cell is (player, stage, variant, seed, bot seed — only the first for a
 * setting with no human layer: the Ace, the Expert, skill 100, which never draw from their generator): one run, to the end the
 * rules give it (src/game/bot-run.js: a clear, a game over, 3 minutes into the boss scene for no-attack; endless modes
 * 30,000 frames). Each row: outcome, lives lost, the frames of the hits (the first one: "survived the first minute" =
 * no hit before frame 3750), score, kills, stars, and the human layer's counts (looks, lapses, the hands' changes).
 * Parts go to results/.h2-parts/<key>.json (resumable); --tapes also writes each run's tape to tapes/h2/.
 * Seeds: C rand() seed s, endlessSeed 7919 × s (the G2 convention); the bot's own generator: seed s and the bot seed.
 * --hitbox centered (slice HB): every run on the centered hit test (its keys end in -centered).
 * A part records its setting's knobs; one recorded with other knobs (the slider's curve changed since) is run again.
 *
 * The report (H3) judges a player by clears, game overs, survival (seconds to the game over, or 3 minutes without one),
 * runs with no hit in the first minute, and lives lost per minute played; the slider must be strictly monotonic in the
 * first three. Lives lost alone is not a measure of skill: a game over caps it. It also places each preset on the slider.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn, execSync } from 'node:child_process';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');
const partsDir = path.join(root, 'results/.h2-parts');
const tapesDir = path.join(root, 'tapes/h2');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const STAGES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'ENDLESS', 'HARD', 'EXTREME', 'INSANE'];
const MINUTE = 3750; // frames (62.5 per second)
const pad = (n) => String(n).padStart(2, '0');
const slug = (p) => p.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const runKey = (j) => `${slug(j.player)}-s${pad(j.stage + 1)}-${j.variant}-seed${j.seed}${j.botSeed !== 1 ? `-bot${j.botSeed}` : ''}${j.budgetX !== 1 ? `-b${j.budgetX}x` : ''}${j.hitbox === 'centered' ? '-centered' : ''}`;

// ── one run, in its own process ──
if (opt('one', null)) {
    const { loadNoiz2saPatterns } = await import('../src/game/patterns-node.js');
    const { runBot } = await import('../src/game/bot-run.js');
    const { BROWSER_BUDGET } = await import('../src/game/bot.js');
    const { settingByName, botOptions } = await import('../src/game/human.js');
    const j = JSON.parse(opt('one'));
    const key = runKey(j), part = path.join(partsDir, `${key}.json`);
    fs.mkdirSync(partsDir, { recursive: true });
    if (!fs.existsSync(part)) {
        const st = settingByName(j.player), b = botOptions(st, { botSeed: j.botSeed });
        const { result, tape } = runBot(loadNoiz2saPatterns(), {
            stage: j.stage, seed: j.seed, variant: j.variant, budget: j.budgetX * BROWSER_BUDGET, horizon: b.horizon, perception: b.perception,
            expert: b.perception === 'observed' ? { margin: b.margin, attackY: b.attackY } : {}, starWeight: b.starWeight ?? 0,
            human: b.human ?? null, botSeed: j.botSeed, personality: st.name, hitbox: j.hitbox ?? 'original',
        });
        if (j.tapes) {
            fs.mkdirSync(tapesDir, { recursive: true });
            const file = `${key}.json`;
            fs.writeFileSync(path.join(tapesDir, file), JSON.stringify(tape));
            result.tape = `h2/${file}`;
        }
        const row = { kind: 'run', ...j, key, ...result, firstHit: result.hitFrames[0] ?? null, minute: !result.hitFrames.length || result.hitFrames[0] >= MINUTE, knobs: st.knobs };
        delete row.tapes;
        fs.writeFileSync(part, JSON.stringify(row));
    }
    process.exit(0);
}

// ── the run signature and the cells ──
const { PRESETS } = await import('../src/game/human.js');
const presetsOpt = opt('presets', 'all');
const presetNames = presetsOpt === 'none' || presetsOpt === '' ? [] : presetsOpt === 'all' ? PRESETS.map((p) => p.name) : presetsOpt.split(',').map((s) => s.trim());
// --preset-skills 0,50,100 (H3b): every personality given by name alone plays at each of these skills ("Panicky 0", …);
// the Ace and the Expert once
const presetSkills = opt('preset-skills', null)?.split(',').map(Number) ?? null;
const presets = presetNames.flatMap((n) => (presetSkills && PRESETS.find((p) => p.name === n)?.bias ? presetSkills.map((s) => `${n} ${s}`) : [n]));
const skillsOpt = opt('skills', '0,25,50,75,100');
const skills = skillsOpt === 'none' || skillsOpt === '' ? [] : skillsOpt.split(',').map(Number);
const players = [...presets, ...skills.map((s) => `skill ${s}`)];
{
    const { settingByName } = await import('../src/game/human.js');
    for (const p of players) settingByName(p); // an unknown name fails here, before any work
}
const variants = opt('variants', 'attack').split(',');
const stageNames = opt('stages', '1,2,3,4,5,6,7,8,9,10').split(',');
const stagesWanted = stageNames.map((s) => STAGES.indexOf(s));
if (stagesWanted.includes(-1)) { console.error(`unknown stage in "${stageNames}" (have: ${STAGES.join(',')})`); process.exit(2); }
const seeds = opt('seeds', '1,2,3').split(',').map(Number);
const botSeeds = opt('bot-seeds', '1').split(',').map(Number);
const budgetX = Number(opt('budget', 1));
const tapes = args.includes('--tapes');
const name = opt('name', 'h2-bot');
const hitbox = opt('hitbox', 'original');
if (!['original', 'centered'].includes(hitbox)) { console.error(`unknown hitbox "${hitbox}"`); process.exit(2); }
const signature = { players, variants, stages: stageNames, seeds, botSeeds, budgetX, ...(hitbox !== 'original' ? { hitbox } : {}) };
const shardsDir = path.join(root, `results/${name}-shards`);

// a setting without a human layer (the Ace, the Expert, skill 100) never draws from its generator: one bot seed is enough
const { settingByName: byName, botOptions: optsOf } = await import('../src/game/human.js');
const usesBotSeed = (p) => !!optsOf(byName(p)).human;
const cells = [];
for (const player of players) for (const stage of stagesWanted) for (const variant of variants) for (const seed of seeds) for (const botSeed of usesBotSeed(player) ? botSeeds : botSeeds.slice(0, 1)) {
    cells.push({ player, stage, variant, seed, botSeed, budgetX, ...(hitbox !== 'original' ? { hitbox } : {}) });
}
// longest first (the Ace and the Expert play whole stages; endless modes; no-attack lives 3 minutes into the boss), in a
// fixed order so every shard deals the same hands
const weight = (c) => (c.stage >= 10 ? 3 : 1) * (c.variant === 'no-attack' ? 2 : 1) * (c.player === 'Ace' ? 3 : c.player === 'Expert' || c.player === 'skill 100' ? 2 : 1);
cells.sort((a, b) => weight(b) - weight(a) || players.indexOf(a.player) - players.indexOf(b.player) || a.stage - b.stage || a.variant.localeCompare(b.variant) || a.seed - b.seed || a.botSeed - b.botSeed);
const [shardI, shardN] = opt('shard', '1/1').split('/').map(Number);
const myCells = cells.filter((_, k) => k % shardN === shardI - 1);

if (args.includes('--list')) {
    for (const c of myCells) console.log(runKey(c));
    process.exit(0);
}

const readPart = (key) => { const p = path.join(partsDir, `${key}.json`); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; };
// a part recorded with other knob values for its player (the slider's mapping changed since) is stale: run it again
const stale = (r) => !!r && (r.knobs ? JSON.stringify(r.knobs) !== JSON.stringify(byName(r.player).knobs) : /^skill /.test(r.player)); // a skill part from before H3 has no knobs
let commit = 'unknown';
try { commit = execSync('git rev-parse --short HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* no git */ }

if (!args.includes('--summary') && !args.includes('--merge') && !opt('from', null)) {
    const nJobs = Number(opt('jobs', os.cpus().length));
    const timeoutMs = Number(opt('timeout-min', 150)) * 60_000;
    console.log(`shard ${shardI}/${shardN}: ${myCells.length} of ${cells.length} runs, ${nJobs} at a time`);
    const t0 = Date.now();
    const mine = new Map();
    let done = 0;
    const writeShard = (fin) => {
        fs.mkdirSync(shardsDir, { recursive: true });
        fs.writeFileSync(path.join(shardsDir, `shard-${shardI}-of-${shardN}.json`), JSON.stringify({ shard: shardI, of: shardN, signature, done: fin, cells: myCells.length, cellsDone: done, commit, cores: os.cpus().length, jobs: nJobs, wallMin: +((Date.now() - t0) / 60000).toFixed(1), rows: [...mine.values()] }) + '\n');
    };
    const runOne = (j) => new Promise((resolve) => {
        const key = runKey(j);
        const have = readPart(key);
        if (have && !stale(have) && (!tapes || have.tape)) { resolve(have); return; } // --tapes: a part run without one runs again
        if (have) fs.rmSync(path.join(partsDir, `${key}.json`));
        const child = spawn(process.execPath, [path.join(here, 'h2-sweep.mjs'), '--one', JSON.stringify({ ...j, ...(tapes ? { tapes } : {}) })], { stdio: ['ignore', 'inherit', 'inherit'] });
        const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
        child.on('close', (code, signal) => {
            clearTimeout(timer);
            if (code !== 0) {
                fs.mkdirSync(partsDir, { recursive: true });
                fs.writeFileSync(path.join(partsDir, `${key}.json`), JSON.stringify({ kind: 'run', ...j, key, outcome: signal ? 'timeout' : `error ${code}` }));
            }
            const r = readPart(key);
            console.log(`[${((Date.now() - t0) / 60000).toFixed(1)} min] ${key}: ${r.outcome}${r.frames != null ? `, ${r.frames} frames, lives lost ${r.livesLost}${r.firstHit != null ? ` (first at ${r.firstHit})` : ''}, score ${r.score}, ${r.cpuSec}s` : ''}`);
            resolve(r);
        });
    });
    writeShard(false);
    let next = 0;
    await Promise.all(Array.from({ length: nJobs }, async () => {
        while (next < myCells.length) { const r = await runOne(myCells[next++]); mine.set(r.key, r); done++; writeShard(false); }
    }));
    writeShard(true);
    console.log(`shard ${shardI}/${shardN} done in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
    process.exit(0);
}

// ── the rows: --merge = every shard file of this signature, checked; --summary = the local parts of this signature;
// --from a.json,b.json = the runs of earlier results files that fall in this signature, re-reported (with the settings
// those files record, not today's) ──
const byKey = new Map();
const shardInfo = [];
const fromFiles = opt('from', null)?.split(',') ?? null;
const fromSettings = {}, fromCommits = new Set();
if (fromFiles) {
    const keys = new Set(cells.map(runKey));
    for (const f of fromFiles) {
        const d = JSON.parse(fs.readFileSync(path.resolve(f), 'utf8'));
        fromCommits.add(d.meta.commit);
        // a later file's run replaces an earlier one's, and so does its setting
        for (const r of d.runs) if (keys.has(r.key)) { byKey.set(r.key, r); fromSettings[r.player] = d.meta.settings?.[r.player]; }
    }
    console.log(`from ${fromFiles.join(', ')}: ${byKey.size} of ${cells.length} runs`);
} else if (args.includes('--merge')) {
    const expect = Number(opt('expect', shardN));
    const files = fs.existsSync(shardsDir) ? fs.readdirSync(shardsDir).filter((f) => /^shard-\d+-of-\d+\.json$/.test(f)) : [];
    const problems = [];
    for (let i = 1; i <= expect; i++) {
        const f = path.join(shardsDir, `shard-${i}-of-${expect}.json`);
        if (!fs.existsSync(f)) { problems.push(`shard ${i}/${expect}: missing (${path.relative(root, f)})`); continue; }
        const s = JSON.parse(fs.readFileSync(f, 'utf8'));
        if (JSON.stringify(s.signature) !== JSON.stringify(signature)) { problems.push(`shard ${i}/${expect}: another run signature (${JSON.stringify(s.signature)} ≠ ${JSON.stringify(signature)})`); continue; }
        if (!s.done) { problems.push(`shard ${i}/${expect}: unfinished (${s.cellsDone}/${s.cells} runs)`); continue; }
        const bad = s.rows.filter((r) => r.livesLost == null);
        if (bad.length) problems.push(`shard ${i}/${expect}: ${bad.length} run(s) without a result (${bad.map((r) => `${r.key}: ${r.outcome}`).join(', ')})`);
        shardInfo.push({ shard: `${i}/${expect}`, commit: s.commit, cores: s.cores, jobs: s.jobs, wallMin: s.wallMin, rows: s.rows.length });
        for (const r of s.rows) byKey.set(r.key, r);
    }
    for (const f of files) if (!f.endsWith(`-of-${expect}.json`)) problems.push(`stray shard file ${f} (expected n = ${expect})`);
    if (byKey.size !== cells.length && !problems.length) problems.push(`${byKey.size} runs merged, the signature has ${cells.length}`);
    if (problems.length) {
        console.error(`merge FAILED — the table would be partial:\n  ${problems.join('\n  ')}`);
        process.exit(1);
    }
    console.log(`merge: all ${expect} shards present and finished, ${byKey.size} runs`);
} else {
    for (const c of cells) { const r = readPart(runKey(c)); if (r && !stale(r)) byKey.set(r.key, r); }
}
const runs = [...byKey.values()];
const ok = (r) => r.livesLost != null;
const { BROWSER_BUDGET } = await import('../src/game/bot.js');
const { settingByName, KNOBS } = await import('../src/game/human.js');
const meta = { commit, date: new Date().toISOString().slice(0, 10), signature, browserBudget: BROWSER_BUDGET, runs: runs.length, cells: cells.length,
    cpuSec: Math.round(runs.reduce((s, r) => s + (r.cpuSec || 0), 0)), shards: shardInfo, settings: Object.fromEntries(players.map((p) => [p, fromSettings[p] ?? settingByName(p)])) };
if (fromFiles) meta.commit = commit = [...fromCommits].join(', ');
fs.mkdirSync(path.join(root, 'results'), { recursive: true });
fs.writeFileSync(path.join(root, `results/${name}.json`), JSON.stringify({ meta, runs }) + '\n');

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-US'));
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const md = [];
md.push('# H2 — humanlike bots: presets and skill levels', '');
md.push(`Written by \`bin/h2-sweep.mjs ${fromFiles ? `--from ${fromFiles.map((f) => path.relative(root, path.resolve(f))).join(',')}` : args.includes('--merge') ? '--merge' : '--summary'}\` at commit \`${commit}\`, ${meta.date}, from ${runs.length} of ${cells.length} runs (${(meta.cpuSec / 3600).toFixed(2)} CPU-hours)${shardInfo.length ? ` in ${shardInfo.length} shards` : fromFiles ? '' : ' (local parts)'}.`);
md.push(`Budget ${budgetX}× = ${budgetX * BROWSER_BUDGET} units per frame.${hitbox !== 'original' ? ` Hitbox: ${hitbox} (slice HB).` : ''} Seeds ${seeds.join(', ')} (C rand() seed s, endlessSeed 7919 × s); bot seeds ${botSeeds.join(', ')}. A cell: lives lost per run (g = game over, c = cleared, b = alive 3 min into the boss scene). "1st min" = runs with no hit in the first minute (${MINUTE} frames).`, '');
const cell = (r) => (!r ? '·' : !ok(r) ? r.outcome : `${r.livesLost}${r.outcome === 'game over' ? 'g' : r.outcome === 'cleared' ? 'c' : r.outcome === 'boss-cap' ? 'b' : ''}`);
const stagesShown = stagesWanted;
// ── the measures (H3). Lives lost alone misleads: a weak bot reaches its game over early, which caps its losses at 3–4,
// while a stronger one lives longer and so has more time to be hit. So a player is judged by:
//  - cleared: runs that cleared the stage; game overs: runs that ended in one;
//  - survival: frames to the game over, or SURVIVAL_CAP for a run without one (every stage 1–10 ends before 3 minutes);
//  - 1st min: runs with no hit in the first minute;
//  - lives lost per survived minute (lives lost ÷ minutes played): how often it is hit while alive.
const SURVIVAL_CAP = 3 * MINUTE;
const survival = (r) => (r.outcome === 'game over' ? Math.min(r.gameoverFrame ?? r.frames, SURVIVAL_CAP) : SURVIVAL_CAP);
const measures = (rs) => ({
    n: rs.length, cleared: rs.filter((r) => r.outcome === 'cleared').length, gameOvers: rs.filter((r) => r.outcome === 'game over').length,
    survivalSec: mean(rs.map(survival)) / (MINUTE / 60), minute: rs.filter((r) => r.minute).length,
    lostPerMin: rs.reduce((s, r) => s + r.livesLost, 0) / Math.max(1e-9, rs.reduce((s, r) => s + r.frames, 0) / MINUTE),
    livesLost: mean(rs.map((r) => r.livesLost)),
});
// strictly better step by step, except where both ends are at the floor or the ceiling (0, or every run)
const strict = (v, dir, lo, hi) => v.every((x, i) => i === 0 || (dir > 0 ? x > v[i - 1] : x < v[i - 1]) || (x === v[i - 1] && (x === lo || x === hi)));
const weak = (v, dir) => v.every((x, i) => i === 0 || (dir > 0 ? x >= v[i - 1] : x <= v[i - 1]));
const f2 = (v, d = 2) => (v == null ? '·' : v.toFixed(d));
for (const variant of variants) {
    md.push(`## ${variant}: lives lost per stage (runs: seed${botSeeds.length > 1 ? ' × bot seed' : ''})`, '');
    md.push(`Survival = seconds to the game over, or ${SURVIVAL_CAP / (MINUTE / 60)} s for a run without one. Lost / min = lives lost per minute played.`, '');
    md.push(`| Player | ${stagesShown.map((s) => STAGES[s]).join(' | ')} | Cleared | Game overs | Survival (s) | 1st min | Lost / min | Lives lost (mean) | Mean score |`);
    md.push(`|---|${stagesShown.map(() => '---').join('|')}|---:|---:|---:|---:|---:|---:|---:|`);
    for (const player of players) {
        const rs = runs.filter((r) => r.player === player && r.variant === variant && ok(r));
        if (!rs.length) continue;
        const bss = usesBotSeed(player) ? botSeeds : botSeeds.slice(0, 1);
        const per = stagesShown.map((stage) => seeds.flatMap((seed) => bss.map((bs) => cell(runs.find((r) => r.player === player && r.variant === variant && r.stage === stage && r.seed === seed && r.botSeed === bs)))).join('/'));
        const m = measures(rs);
        md.push(`| ${player} | ${per.join(' | ')} | ${m.cleared}/${m.n} | ${m.gameOvers}/${m.n} | ${m.survivalSec.toFixed(1)} | ${m.minute}/${m.n} | ${f2(m.lostPerMin)} | ${f2(m.livesLost)} | ${fmt(Math.round(mean(rs.map((r) => r.score))))} |`);
    }
    md.push('');
    // the slider's monotonicity, by the measures above (not by lives lost)
    const sk = skills.slice().sort((a, b) => a - b);
    if (sk.length > 1) {
        const ms = sk.map((s) => measures(runs.filter((r) => r.player === `skill ${s}` && r.variant === variant && ok(r))));
        if (ms.every((m) => m.n)) {
            md.push(`### ${variant}: is the skill slider monotonic? (skill ${sk.join(' → ')})`, '');
            md.push('Strictly: each step better than the last, or equal only at the floor or the ceiling (0, or every run). Weakly: never worse.', '');
            md.push(`| Measure | ${sk.map((s) => `skill ${s}`).join(' | ')} | Monotonic |`);
            md.push(`|---|${sk.map(() => '---:').join('|')}|---|`);
            const rel = (v) => (v.every((x, i) => i === 0 || x === v[i - 1]) ? 'flat' : null);
            const row = (label, v, show, dir, lo, hi, needStrict) => {
                const verdict = strict(v, dir, lo, hi) ? 'strictly' : weak(v, dir) ? (needStrict ? '**weakly only**' : 'weakly') : '**no**';
                md.push(`| ${label} | ${v.map((x, i) => show(x, i)).join(' | ')} | ${rel(v) ?? verdict} |`);
                return verdict;
            };
            // counts compare as shares (a setting without a human layer runs once per game seed, not per bot seed)
            const share = (k) => ms.map((m) => m[k] / m.n), count = (k) => (_, i) => `${ms[i][k]}/${ms[i].n}`;
            const verdicts = [
                row('Cleared', share('cleared'), count('cleared'), 1, 0, 1, true),
                row('Game overs', share('gameOvers'), count('gameOvers'), -1, 0, 1, true),
                row('Survival (s)', ms.map((m) => +m.survivalSec.toFixed(1)), (x) => x.toFixed(1), 1, 0, SURVIVAL_CAP / (MINUTE / 60), true),
                row('No hit in the 1st min', share('minute'), count('minute'), 1, 0, 1, false),
                row('Lives lost per minute played', ms.map((m) => +m.lostPerMin.toFixed(2)), (x) => x.toFixed(2), -1, 0, Infinity, false),
            ];
            md.push(`| Lives lost (mean; not a measure of skill: a game over caps it) | ${ms.map((m) => f2(m.livesLost)).join(' | ')} | — |`);
            md.push('', verdicts.slice(0, 3).every((v) => v === 'strictly') ? 'The slider is **strictly monotonic** in clears, game overs and survival.' : `**Not strictly monotonic** in clears, game overs and survival (${['clears', 'game overs', 'survival'].filter((_, i) => verdicts[i] !== 'strictly').join(', ')}).`, '');
            // per stage: survival (s) and clears, weakly monotonic (a stage has only seeds × bot seeds runs)
            md.push(`#### ${variant}: per stage — cleared / survival (s), skill ${sk.join(' → ')}`, '');
            md.push(`| Stage | ${sk.map((s) => `skill ${s}`).join(' | ')} | Weakly monotonic |`);
            md.push(`|---|${sk.map(() => '---:').join('|')}|---|`);
            let bad = 0;
            for (const stage of stagesShown) {
                const pm = sk.map((s) => measures(runs.filter((r) => r.player === `skill ${s}` && r.variant === variant && r.stage === stage && ok(r))));
                if (!pm.every((m) => m.n)) continue;
                const mono = weak(pm.map((m) => m.cleared / m.n), 1) && weak(pm.map((m) => +m.survivalSec.toFixed(1)), 1);
                if (!mono) bad++;
                md.push(`| ${STAGES[stage]} | ${pm.map((m) => `${m.cleared}/${m.n} · ${m.survivalSec.toFixed(0)}`).join(' | ')} | ${mono ? 'yes' : '**no**'} |`);
            }
            md.push('', `${bad ? `${bad} stage(s) not weakly monotonic` : 'Every stage shown is weakly monotonic'} in clears and survival. (A stage has only ${seeds.length * botSeeds.length} runs per skill level: one run more or less is within the noise; the slider is judged on the totals above.)`, '');
        }
    }
    // each preset's place on the slider: the skill levels whose survival brackets the preset's
    const presetRows = presets.filter((p) => !/^(skill|path) /.test(p)).map((p) => [p, runs.filter((r) => r.player === p && r.variant === variant && ok(r))]).filter(([, rs]) => rs.length);
    const skm = skills.slice().sort((a, b) => a - b).map((s) => [s, runs.filter((r) => r.player === `skill ${s}` && r.variant === variant && ok(r))]).filter(([, rs]) => rs.length).map(([s, rs]) => [s, measures(rs)]);
    if (presetRows.length && skm.length > 1) {
        // equivalent skill by a measure (a share of runs, or seconds): linear between the first two neighbouring skill
        // levels that bracket it; "< 0" below the grid
        const val = (m, key) => (key === 'survivalSec' ? m[key] : m[key] / m.n);
        const equiv = (m0, key) => {
            const v = val(m0, key), pts = skm.map(([s, m]) => [s, val(m, key)]);
            if (v <= pts[0][1]) return v === pts[0][1] ? `${pts[0][0]}` : `< ${pts[0][0]}`;
            for (let i = 1; i < pts.length; i++) {
                const [s0, v0] = pts[i - 1], [s1, v1] = pts[i];
                if (v <= v1 && v1 > v0) return v === v1 && v1 === Math.max(...pts.map((q) => q[1])) ? `≥ ${s1}` : `${Math.round(s0 + Math.max(0, (v - v0) / (v1 - v0)) * (s1 - s0))}`;
            }
            return `${pts[pts.length - 1][0]}`;
        };
        md.push(`### ${variant}: the presets on the slider (equivalent skill, by each measure)`, '');
        md.push('By shares of runs (cleared, no hit in the first minute) or seconds (survival): linear between the first two neighbouring skill levels that bracket the preset; "< 0" = weaker than skill 0.', '');
        md.push('| Preset | Cleared | ≈ skill | Survival (s) | ≈ skill | 1st min | ≈ skill |');
        md.push('|---|---:|---:|---:|---:|---:|---:|');
        for (const [p, rs] of presetRows) {
            const m = measures(rs);
            md.push(`| ${p} | ${m.cleared}/${m.n} | ${equiv(m, 'cleared')} | ${m.survivalSec.toFixed(1)} | ${equiv(m, 'survivalSec')} | ${m.minute}/${m.n} | ${equiv(m, 'minute')} |`);
        }
        md.push('');
    }
}
md.push('## The human layer at work (means per run)', '');
md.push('| Player | Looks / frame | Lapses | Lapse frames | Mean delay (frames) | Bullets unattended / look | Panic frames | Inputs changed by the hands | of them blocked (hold / rate) | Overshoots | Slow mashes | CPU s |');
md.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
for (const player of players) {
    const rs = runs.filter((r) => r.player === player && ok(r));
    if (!rs.length) continue;
    const h = rs.map((r) => r.bot.human).filter(Boolean);
    const m = (f) => (h.length ? mean(h.map(f)) : null);
    const f1 = (v, d = 1) => (v == null ? '—' : v.toFixed(d));
    md.push(`| ${player} | ${f1(h.length ? m((x) => x.looks) / mean(rs.map((r) => r.frames)) : null, 2)} | ${f1(m((x) => x.lapses))} | ${f1(m((x) => x.lapseFrames), 0)} | ${f1(m((x) => x.delaySum / Math.max(1, x.looks)))} | ${f1(m((x) => x.unattended / Math.max(1, x.looks)))} | ${f1(m((x) => x.panicFrames), 0)} | ${f1(m((x) => x.overrides), 0)} | ${f1(m((x) => x.blocked), 0)} | ${f1(m((x) => x.overshoots), 0)} | ${f1(m((x) => x.mashes))} | ${f1(mean(rs.map((r) => r.cpuSec)))} |`);
}
md.push('');
md.push('## The settings', '');
md.push(`| Knob | ${players.join(' | ')} |`);
md.push(`|---|${players.map(() => '---:').join('|')}|`);
for (const k of KNOBS) md.push(`| ${k.key} (${k.unit}) | ${players.map((p) => (meta.settings[p].perception === 'omniscient' && k.key !== 'horizon' ? '—' : meta.settings[p].knobs[k.key])).join(' | ')} |`);
md.push('');
md.push('## Shards', '');
md.push(shardInfo.length ? shardInfo.map((s) => `- shard ${s.shard}: ${s.rows} runs at \`${s.commit}\`, ${s.wallMin} min wall, ${s.jobs} jobs on ${s.cores} cores`).join('\n') : '- (local parts only)');
fs.writeFileSync(path.join(root, `results/${name}.md`), md.join('\n') + '\n');
console.log(`wrote results/${name}.json, results/${name}.md (${runs.length} runs)`);
