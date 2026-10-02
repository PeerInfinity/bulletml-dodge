#!/usr/bin/env node
/**
 * Run bin/run-pattern.mjs over every pattern in a directory tree, N at a time,
 * and write results/<name>.json (one row per pattern) and results/<name>.md.
 *
 *   node bin/sweep.mjs patterns/noiz2sa [--jobs 4] [--timeout-min 30] [--name noiz2sa] [-- <run-pattern options>]
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const argv = process.argv.slice(2);
const dd = argv.indexOf('--');
const args = dd >= 0 ? argv.slice(0, dd) : argv;
const passThrough = dd >= 0 ? argv.slice(dd + 1) : [];
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const root = args.find((a) => !a.startsWith('--') && fs.existsSync(a));
if (!root) { console.error('usage: sweep.mjs <pattern dir> [--jobs N] [--timeout-min M] [--name X] [-- run-pattern options]'); process.exit(2); }
const jobs = Number(opt('jobs', os.cpus().length));
const timeoutMs = Number(opt('timeout-min', 30)) * 60_000;
const name = opt('name', path.basename(root));
const here = path.dirname(new URL(import.meta.url).pathname);
const outDir = path.join(here, '..', 'results');
const tmpDir = path.join(outDir, `.${name}-parts`);
fs.mkdirSync(tmpDir, { recursive: true });

const files = [];
(function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p); else if (e.name.endsWith('.xml')) files.push(p);
    }
})(root);

const results = [];
let next = 0, done = 0;
const t0 = Date.now();
function runOne(file) {
    return new Promise((resolve) => {
        const part = path.join(tmpDir, `${files.indexOf(file)}.json`);
        const child = spawn(process.execPath, [path.join(here, 'run-pattern.mjs'), file, '--json', part, ...passThrough], { stdio: ['ignore', 'pipe', 'pipe'] });
        let log = '';
        child.stdout.on('data', (d) => { log += d; });
        child.stderr.on('data', (d) => { log += d; });
        const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
        child.on('close', (code, signal) => {
            clearTimeout(timer);
            let r;
            if (fs.existsSync(part)) r = JSON.parse(fs.readFileSync(part, 'utf8'));
            else r = { pattern: path.basename(file), file, kind: path.basename(path.dirname(file)), verdict: signal ? 'timeout' : 'error', need: null, error: log.slice(-2000) };
            results.push(r);
            done++;
            console.log(`[${done}/${files.length}] ${r.kind}/${r.pattern}: ${r.verdict}${r.seconds ? ` (${r.seconds.toFixed(0)} s)` : ''}`);
            resolve();
        });
    });
}
async function worker() { while (next < files.length) await runOne(files[next++]); }
await Promise.all(Array.from({ length: Math.min(jobs, files.length) }, worker));

results.sort((a, b) => a.file.localeCompare(b.file));
const settings = results.find((r) => r.settings)?.settings ?? null;
fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify({ name, settings, wallSeconds: (Date.now() - t0) / 1000, jobs, results }, null, 1));
const order = ['reflex', 'H2', 'H4', 'H8', 'H16', 'H32', 'H64', 'not-dodged', 'timeout', 'error'];
const tally = {};
for (const r of results) tally[r.verdict] = (tally[r.verdict] || 0) + 1;
let md = `# Sweep: ${name}\n\n${results.length} patterns, ${jobs} jobs, ${((Date.now() - t0) / 60000).toFixed(1)} min wall.\n`;
md += `Settings: ${JSON.stringify(settings)}\n\n## Tally\n\n| Verdict | Patterns |\n|---|---|\n`;
for (const v of order) if (tally[v]) md += `| ${v} | ${tally[v]} |\n`;
md += `\n## Per pattern\n\nVerdict = the worst over all seeds and ranks: \`reflex\`, the smallest planner horizon \`H<n>\` that survived, or \`not-dodged\`.\n\n| Kind | Pattern | Verdict | Per rank/seed |\n|---|---|---|---|\n`;
for (const r of results) {
    const detail = (r.rows || []).map((x) => `r${x.rank}s${x.seed}:${x.need === null ? '✗' : x.need === 0 ? 'R' : `H${x.need}`}`).join(' ');
    md += `| ${r.kind} | ${r.pattern} | ${r.verdict} | ${detail} |\n`;
}
fs.writeFileSync(path.join(outDir, `${name}.md`), md);
fs.rmSync(tmpDir, { recursive: true, force: true });
console.log(`\nwrote results/${name}.json and results/${name}.md`);
console.log(Object.entries(tally).map(([k, v]) => `${k}: ${v}`).join(', '));
