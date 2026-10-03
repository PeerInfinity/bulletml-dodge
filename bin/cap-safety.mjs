#!/usr/bin/env node
/**
 * Slice P1: is a cheaper bot safe? The G4 bot with a per-frame cost cap, a smaller budget or a smaller bank, on a small set — stages 1, 6, 10 and
 * ENDLESS × seeds 1, 2 × attack / no-attack, budget 1× — run to the end the G4 rules give (bot-run.js), in parallel
 * child processes. Prints lives lost, outcome, score and the largest one-frame spend per run, cap vs no cap.
 *
 *   node bin/cap-safety.mjs --caps 0,2400 [--stages 0,5,9,10] [--seeds 1,2] [--jobs 3] [--json out.json]
 *   node bin/cap-safety.mjs --settings 300:32,150:32,600:8   (budget units : bank frames [: cap])
 *   (cap 0 = no cap; 600:32 with no cap is G4's bot, so its results equal results/g4-bot.json's)
 */
import fs from 'node:fs';
import os from 'node:os';
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
if (args[0] === '--one') {
    const { loadNoiz2saPatterns } = await import('../src/game/patterns-node.js');
    const { runBot } = await import('../src/game/bot-run.js');
    const { BROWSER_BUDGET } = await import('../src/game/bot.js');
    const job = JSON.parse(args[1]);
    const { result: r } = runBot(loadNoiz2saPatterns(), { stage: job.stage, seed: job.seed, variant: job.variant, budget: job.budget ?? BROWSER_BUDGET, bankFrames: job.bank ?? 32, costCap: job.cap || Infinity });
    process.stdout.write(JSON.stringify({ ...job, outcome: r.outcome, frames: r.frames, livesLost: r.livesLost, hitFrames: r.hitFrames, score: r.score, cpuSec: r.cpuSec, bot: r.bot }));
    process.exit(0);
}
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const settings = opt('settings', null)
    ? opt('settings').split(',').map((x) => { const [budget, bank, cap = 0] = x.split(':').map(Number); return { budget, bank, cap }; })
    : opt('caps', '0,2400').split(',').map((cap) => ({ budget: 600, bank: 32, cap: Number(cap) }));
const stages = opt('stages', '0,5,9,10').split(',').map(Number);
const seeds = opt('seeds', '1,2').split(',').map(Number);
const jobs = [];
for (const stage of stages) for (const seed of seeds) for (const variant of ['attack', 'no-attack']) for (const st of settings) jobs.push({ stage, seed, variant, ...st });
const out = [];
let next = 0;
await Promise.all(Array.from({ length: Number(opt('jobs', Math.max(1, os.cpus().length - 1))) }, async () => {
    while (next < jobs.length) {
        const job = jobs[next++];
        const text = await new Promise((resolve) => {
            let s = '';
            const p = spawn(process.execPath, [new URL(import.meta.url).pathname, '--one', JSON.stringify(job)]);
            p.stdout.on('data', (d) => { s += d; });
            p.stderr.on('data', (d) => process.stderr.write(d));
            p.on('exit', () => resolve(s));
        });
        const r = JSON.parse(text);
        out.push(r);
        console.log(`stage ${r.stage + 1} seed ${r.seed} ${r.variant.padEnd(9)} budget ${String(r.budget).padStart(3)} bank ${String(r.bank).padStart(2)} cap ${String(r.cap || '-').padStart(5)}: ${r.outcome}, ${r.livesLost} lives lost, score ${r.score}, ${r.frames} frames; max ${r.bot.maxFrameCost} units in a frame, ${r.bot.costPerFrame}/frame; ${r.bot.repairs} repairs, ${r.bot.repairFails} failed, ${r.bot.improves} improves (${r.cpuSec} s)`);
    }
}));
if (opt('json', null)) fs.writeFileSync(opt('json'), JSON.stringify(out, null, 1));
