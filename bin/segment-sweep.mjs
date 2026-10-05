#!/usr/bin/env node
/**
 * Slice N1: the segment sweep — how hard each segment (a region of the planned Archipelago Loops substrate) is for the
 * humanlike bot, as the chance of a DEATHLESS clear and the seconds a clear costs (⚖ the user, 2026-10-04: "One thing
 * we want to measure is the stats required to complete each stage deathless about half the time"; "Skill level
 * doesn't reduce clear time" — a clean clear always takes the segment's length, so the stats change only the chance).
 * Sharded like bin/h2-sweep.mjs (cells dealt round-robin to n shards; one child process per run; a strict merge); run
 * as GitHub Actions shards (.github/workflows/segment-sweep.yml).
 *
 *   node bin/segment-sweep.mjs [--spans scenes|stages|"1:1-1:3,2:9-3:1"] [--stages 1,…,10] [--skills 0,10,…,100]
 *        [--players "Expert,skill 55"] [--seeds 1] [--bot-seeds 1,…,16] [--hitbox centered] [--name segments]
 *        [--jobs N] [--shard i/n] [--timeout-min M] [--list]
 *   node bin/segment-sweep.mjs --merge [--expect n] [the same run options]   (fails if a shard is missing or unfinished)
 *   node bin/segment-sweep.mjs --summary [the same run options]              (the local parts, no checks)
 *
 * --spans scenes = every scene of the --stages alone (1:1 … 1:9, 1:boss, …); stages = each stage whole (N:1–N:boss);
 * or an explicit list. A cell is (player, span, seed, bot seed): ONE attempt (src/game/segment-run.js, maxAttempts 1)
 * — the restart loop is not played out, it is computed: with a deathless share p, a clean clear's length L and the
 * mean time a failed attempt lasted F, a clear costs on average L + F·(1 − p)/p seconds (attempts independent, as the
 * bot's generator differs per attempt). The bot seeds are the sample; the game seed is the region's.
 * Parts go to results/.seg-parts/<key>.json (resumable).
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn, execSync } from 'node:child_process';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');
const partsDir = path.join(root, 'results/.seg-parts');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const slug = (p) => p.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const { parsePosition, showPosition, BOSS_SCENE, FPS } = await import('../src/game/segment-run.js');
const spanName = (s) => (s.start.stage === s.end.stage && s.start.scene === s.end.scene ? showPosition(s.start) : `${showPosition(s.start)}–${showPosition(s.end)}`);
const runKey = (j) => `${slug(j.player)}-${slug(spanName(j.span))}-seed${j.seed}-bot${j.botSeed}${j.hitbox === 'original' ? '-original' : ''}`;

// ── one run, in its own process ──
if (opt('one', null)) {
    const { loadNoiz2saPatterns } = await import('../src/game/patterns-node.js');
    const { runSegment } = await import('../src/game/segment-run.js');
    const { settingByName, botOptions } = await import('../src/game/human.js');
    const j = JSON.parse(opt('one'));
    const key = runKey(j), part = path.join(partsDir, `${key}.json`);
    fs.mkdirSync(partsDir, { recursive: true });
    if (!fs.existsSync(part)) {
        const st = settingByName(j.player), { botSeed: _, ...bot } = botOptions(st);
        const { result } = runSegment(loadNoiz2saPatterns(), { start: j.span.start, end: j.span.end, bot, botSeed: j.botSeed, seed: j.seed, hitbox: j.hitbox, maxAttempts: 1 });
        const a = result.runs[0];
        fs.writeFileSync(part, JSON.stringify({ kind: 'run', ...j, key, deathless: a.cleared, frames: a.frames, score: a.score, hitAt: a.hitAt, kills: a.kills, stars: a.stars, cpuSec: result.cpuSec, knobs: st.knobs }));
    }
    process.exit(0);
}

// ── the cells ──
const STAGES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'ENDLESS', 'HARD', 'EXTREME', 'INSANE'];
const stageNames = opt('stages', '1,2,3,4,5,6,7,8,9,10').split(',');
if (stageNames.some((s) => !STAGES.includes(s))) { console.error(`unknown stage in "${stageNames}"`); process.exit(2); }
const spansOpt = opt('spans', 'scenes');
const spans = spansOpt === 'scenes'
    ? stageNames.flatMap((s) => Array.from({ length: BOSS_SCENE + 1 }, (_, k) => { const p = parsePosition(`${s}:${k === BOSS_SCENE ? 'boss' : k + 1}`); return { start: p, end: p }; }))
    : spansOpt === 'stages'
        ? stageNames.map((s) => ({ start: parsePosition(`${s}:1`), end: parsePosition(`${s}:boss`) }))
        : spansOpt.split(',').map((t) => { const [a, b] = t.split('-'); return { start: parsePosition(a), end: parsePosition(b ?? a) }; });
const skillsOpt = opt('skills', '0,10,20,30,40,50,60,70,80,90,100');
const players = [...(opt('players', '') ? opt('players').split(',').map((s) => s.trim()) : []), ...(skillsOpt === 'none' ? [] : skillsOpt.split(',').map((s) => `skill ${Number(s)}`))];
const { settingByName, botOptions } = await import('../src/game/human.js');
for (const p of players) settingByName(p); // an unknown name fails here, before any work
const usesBotSeed = (p) => !!botOptions(settingByName(p)).human; // the Expert (skill 100) plays every bot seed the same
const seeds = opt('seeds', '1').split(',').map(Number);
const botSeeds = opt('bot-seeds', Array.from({ length: 16 }, (_, i) => i + 1).join(',')).split(',').map(Number);
const hitbox = opt('hitbox', 'centered');
const name = opt('name', 'segments');
const signature = { players, spans: spans.map(spanName), seeds, botSeeds, hitbox };
const shardsDir = path.join(root, `results/${name}-shards`);
const cells = [];
for (const player of players) for (const span of spans) for (const seed of seeds) for (const botSeed of usesBotSeed(player) ? botSeeds : botSeeds.slice(0, 1)) cells.push({ player, span, seed, botSeed, hitbox });
// longest first (bosses and whole stages; strong players live longer), in a fixed order so every shard deals the same hands
const span0 = (s) => (s.end.stage - s.start.stage) * 10 + (s.end.scene - s.start.scene) + 1 + (s.end.scene === BOSS_SCENE ? 3 : 0);
const weight = (c) => span0(c.span) * (1 + (/^skill (\d+)/.exec(c.player)?.[1] ?? 100) / 100);
cells.sort((a, b) => weight(b) - weight(a) || players.indexOf(a.player) - players.indexOf(b.player) || spans.indexOf(a.span) - spans.indexOf(b.span) || a.seed - b.seed || a.botSeed - b.botSeed);
const [shardI, shardN] = opt('shard', '1/1').split('/').map(Number);
const myCells = cells.filter((_, k) => k % shardN === shardI - 1);
if (args.includes('--list')) { for (const c of myCells) console.log(runKey(c)); process.exit(0); }

const readPart = (key) => { const p = path.join(partsDir, `${key}.json`); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; };
const stale = (r) => !!r && JSON.stringify(r.knobs) !== JSON.stringify(settingByName(r.player).knobs);
let commit = 'unknown';
try { commit = execSync('git rev-parse --short HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* no git */ }

if (!args.includes('--summary') && !args.includes('--merge')) {
    const nJobs = Number(opt('jobs', os.cpus().length));
    const timeoutMs = Number(opt('timeout-min', 60)) * 60_000;
    console.log(`shard ${shardI}/${shardN}: ${myCells.length} of ${cells.length} runs, ${nJobs} at a time`);
    const t0 = Date.now(), mine = new Map();
    let done = 0;
    const writeShard = (fin) => {
        fs.mkdirSync(shardsDir, { recursive: true });
        fs.writeFileSync(path.join(shardsDir, `shard-${shardI}-of-${shardN}.json`), JSON.stringify({ shard: shardI, of: shardN, signature, done: fin, cells: myCells.length, cellsDone: done, commit, cores: os.cpus().length, jobs: nJobs, wallMin: +((Date.now() - t0) / 60000).toFixed(1), rows: [...mine.values()] }) + '\n');
    };
    const runOne = (j) => new Promise((resolve) => {
        const key = runKey(j), have = readPart(key);
        if (have && !stale(have)) { resolve(have); return; }
        if (have) fs.rmSync(path.join(partsDir, `${key}.json`));
        const child = spawn(process.execPath, [path.join(here, 'segment-sweep.mjs'), '--one', JSON.stringify(j)], { stdio: ['ignore', 'inherit', 'inherit'] });
        const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
        child.on('close', (code, signal) => {
            clearTimeout(timer);
            if (code !== 0) { fs.mkdirSync(partsDir, { recursive: true }); fs.writeFileSync(path.join(partsDir, `${key}.json`), JSON.stringify({ kind: 'run', ...j, key, outcome: signal ? 'timeout' : `error ${code}` })); }
            const r = readPart(key);
            console.log(`[${((Date.now() - t0) / 60000).toFixed(1)} min] ${key}: ${r.outcome ?? (r.deathless ? 'deathless' : `hit at ${showPosition(r.hitAt)} after ${r.frames} frames`)}${r.cpuSec != null ? `, ${r.cpuSec}s` : ''}`);
            resolve(r);
        });
    });
    writeShard(false);
    let next = 0;
    await Promise.all(Array.from({ length: nJobs }, async () => { while (next < myCells.length) { const r = await runOne(myCells[next++]); mine.set(r.key, r); done++; writeShard(false); } }));
    writeShard(true);
    console.log(`shard ${shardI}/${shardN} done in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
    process.exit(0);
}

// ── the rows ──
const byKey = new Map(), shardInfo = [];
if (args.includes('--merge')) {
    const expect = Number(opt('expect', shardN)), problems = [];
    const files = fs.existsSync(shardsDir) ? fs.readdirSync(shardsDir).filter((f) => /^shard-\d+-of-\d+\.json$/.test(f)) : [];
    for (let i = 1; i <= expect; i++) {
        const f = path.join(shardsDir, `shard-${i}-of-${expect}.json`);
        if (!fs.existsSync(f)) { problems.push(`shard ${i}/${expect}: missing`); continue; }
        const s = JSON.parse(fs.readFileSync(f, 'utf8'));
        if (JSON.stringify(s.signature) !== JSON.stringify(signature)) { problems.push(`shard ${i}/${expect}: another run signature`); continue; }
        if (!s.done) { problems.push(`shard ${i}/${expect}: unfinished (${s.cellsDone}/${s.cells} runs)`); continue; }
        const bad = s.rows.filter((r) => r.deathless == null);
        if (bad.length) problems.push(`shard ${i}/${expect}: ${bad.length} run(s) without a result (${bad.map((r) => `${r.key}: ${r.outcome}`).join(', ')})`);
        shardInfo.push({ shard: `${i}/${expect}`, commit: s.commit, cores: s.cores, wallMin: s.wallMin, rows: s.rows.length });
        for (const r of s.rows) byKey.set(r.key, r);
    }
    for (const f of files) if (!f.endsWith(`-of-${expect}.json`)) problems.push(`stray shard file ${f}`);
    const missing = cells.filter((c) => !byKey.has(runKey(c)));
    if (missing.length) problems.push(`${missing.length} of ${cells.length} runs missing (first: ${runKey(missing[0])})`);
    if (problems.length) { console.error(`merge FAILED:\n  ${problems.join('\n  ')}`); process.exit(1); }
} else {
    for (const c of cells) { const r = readPart(runKey(c)); if (r && r.deathless != null && !stale(r)) byKey.set(r.key, r); }
}

// ── the report ──
/** a player's numbers on a span: deathless share p, a clean clear's seconds L, a failed attempt's mean seconds F, and E = L + F(1 − p)/p */
function cellStats(player, span) {
    const rows = cells.filter((c) => c.player === player && c.span === span).map((c) => byKey.get(runKey(c))).filter(Boolean);
    if (!rows.length) return null;
    const ok = rows.filter((r) => r.deathless), bad = rows.filter((r) => !r.deathless);
    const p = ok.length / rows.length;
    const L = ok.length ? ok.reduce((s, r) => s + r.frames, 0) / ok.length / FPS : null;
    const F = bad.length ? bad.reduce((s, r) => s + r.frames, 0) / bad.length / FPS : 0;
    const E = p > 0 && L != null ? L + (F * (1 - p)) / p : null;
    return { n: rows.length, deathless: ok.length, p, L, F, E };
}
const skillOf = (p) => { const m = /^skill (\d+(?:\.\d+)?)$/.exec(p); return m ? Number(m[1]) : null; };
const ladder = players.filter((p) => skillOf(p) !== null).sort((a, b) => skillOf(a) - skillOf(b));
/** the skill at which the deathless share reaches ½ (linear between the first bracketing levels); null if never */
function halfSkill(span) {
    const pts = ladder.map((pl) => [skillOf(pl), cellStats(pl, span)?.p]).filter(([, p]) => p != null);
    if (!pts.length) return null;
    if (pts[0][1] >= 0.5) return `≤ ${pts[0][0]}`;
    for (let i = 1; i < pts.length; i++) {
        const [s0, p0] = pts[i - 1], [s1, p1] = pts[i];
        if (p1 >= 0.5) return (s0 + ((0.5 - p0) / (p1 - p0)) * (s1 - s0)).toFixed(0);
    }
    return `> ${pts.at(-1)[0]}`;
}
const pct = (x) => (x == null ? '—' : `${Math.round(x * 100)}%`);
const sec = (x) => (x == null ? '—' : x.toFixed(0));
const lines = [];
const runsDone = byKey.size, cpuH = [...byKey.values()].reduce((s, r) => s + (r.cpuSec ?? 0), 0) / 3600;
lines.push(`# Segments — how hard each region is for the humanlike bot (${hitbox} hitbox)`, '');
lines.push(`Written by \`bin/segment-sweep.mjs\` at commit \`${commit}\`, ${new Date().toISOString().slice(0, 10)}, from ${runsDone} of ${cells.length} single attempts (${cpuH.toFixed(2)} CPU-hours)${shardInfo.length ? ` in ${shardInfo.length} shards` : ''}. Game seeds ${seeds.join(', ')}; bot seeds ${botSeeds.length} (${botSeeds[0]}–${botSeeds.at(-1)}).`, '');
lines.push('A cell: the share of attempts that clear the span **deathless** (one attempt per bot seed). "½ at" = the skill at which that share reaches 50% (linear between the measured levels). E = the mean seconds a clear costs with restart-on-hit, from the deathless share p, a clean clear\'s length L and the mean length F of a failed attempt: E = L + F·(1 − p)/p (— when no attempt was deathless).', '');
lines.push('## Deathless share by skill', '');
lines.push(`| Span | ${players.join(' | ')} | ½ at |`, `|---|${players.map(() => '---:').join('|')}|---:|`);
for (const s of spans) lines.push(`| ${spanName(s)} | ${players.map((pl) => pct(cellStats(pl, s)?.p)).join(' | ')} | ${halfSkill(s) ?? '—'} |`);
lines.push('', '## Seconds per clear (E), with restart-on-hit', '');
lines.push(`| Span | L (s) | ${players.join(' | ')} |`, `|---|---:|${players.map(() => '---:').join('|')}|`);
for (const s of spans) {
    const Ls = players.map((pl) => cellStats(pl, s)?.L).filter((x) => x != null);
    lines.push(`| ${spanName(s)} | ${Ls.length ? sec(Ls.reduce((a, b) => a + b, 0) / Ls.length) : '—'} | ${players.map((pl) => sec(cellStats(pl, s)?.E)).join(' | ')} |`);
}
// is the deathless share monotonic in skill? (weakly per span; a span has only a few attempts per level)
const nonMono = spans.filter((s) => { const ps = ladder.map((pl) => cellStats(pl, s)?.p).filter((x) => x != null); return ps.some((p, i) => i > 0 && p < ps[i - 1]); });
const tot = ladder.map((pl) => { const st = spans.map((s) => cellStats(pl, s)).filter(Boolean); return st.reduce((a, x) => a + x.deathless, 0) / Math.max(1, st.reduce((a, x) => a + x.n, 0)); });
const strict = tot.every((p, i) => i === 0 || p > tot[i - 1] || (p === 1 && tot[i - 1] === 1));
lines.push('', '## Monotonic in skill?', '');
if (ladder.length) {
    lines.push(`| | ${ladder.join(' | ')} |`, `|---|${ladder.map(() => '---:').join('|')}|`, `| Deathless, all spans | ${tot.map(pct).join(' | ')} |`, '');
    lines.push(`All spans together: **${strict ? 'strictly monotonic' : 'NOT strictly monotonic'}**. ${nonMono.length} of ${spans.length} span(s) not weakly monotonic on their own${nonMono.length ? ` (${nonMono.map(spanName).join(', ')})` : ''} — few attempts per level, so a single attempt more or less is noise.`);
}
fs.mkdirSync(path.join(root, 'results'), { recursive: true });
fs.writeFileSync(path.join(root, `results/${name}.md`), lines.join('\n') + '\n');
const out = { meta: { commit, date: new Date().toISOString(), signature, shards: shardInfo, settings: Object.fromEntries(players.map((p) => [p, settingByName(p).knobs])) },
    spans: spans.map((s) => ({ span: spanName(s), start: s.start, end: s.end, half: halfSkill(s), players: Object.fromEntries(players.map((pl) => [pl, cellStats(pl, s)])) })),
    runs: [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key)) };
fs.writeFileSync(path.join(root, `results/${name}.json`), JSON.stringify(out, null, 1) + '\n');
console.log(lines.join('\n'));
