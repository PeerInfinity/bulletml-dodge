#!/usr/bin/env node
/**
 * Re-run G4 sweep runs and check they give the very same tapes (slice P1: the engine's speed-ups must not change a
 * single move). One run per tape file name (s<stage>-<variant>-seed<s>-b<k>x.json), in parallel child processes.
 *
 *   node bin/check-g4-tapes.mjs tapes/g4/s10-attack-seed1-b1x.json … [--jobs 4]
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
if (args[0] === '--one') {
    const { loadNoiz2saPatterns } = await import('../src/game/patterns-node.js');
    const { runBot } = await import('../src/game/bot-run.js');
    const { BROWSER_BUDGET } = await import('../src/game/bot.js');
    const file = args[1];
    const want = JSON.parse(fs.readFileSync(file, 'utf8'));
    const m = path.basename(file).match(/^s(\d+)-(attack|no-attack)-seed(\d+)-b(\d+)x\.json$/);
    const t0 = Date.now();
    const { tape } = runBot(loadNoiz2saPatterns(), { stage: Number(m[1]) - 1, seed: Number(m[3]), variant: m[2], budget: Number(m[4]) * BROWSER_BUDGET });
    const same = JSON.stringify(tape.inputs) === JSON.stringify(want.inputs) && tape.frames === want.frames;
    console.log(`${same ? 'same' : 'DIFFERENT'}  ${path.basename(file)}: ${tape.frames} frames (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    process.exit(same ? 0 : 1);
}
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const files = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--jobs');
const jobs = Number(opt('jobs', os.cpus().length));
let bad = 0, next = 0;
await Promise.all(Array.from({ length: jobs }, async () => {
    while (next < files.length) {
        const f = files[next++];
        const code = await new Promise((r) => spawn(process.execPath, [new URL(import.meta.url).pathname, '--one', f], { stdio: 'inherit' }).on('exit', r));
        if (code !== 0) bad++;
    }
}));
console.log(bad ? `${bad} of ${files.length} tapes differ` : `all ${files.length} tapes the same`);
process.exit(bad ? 1 : 0);
