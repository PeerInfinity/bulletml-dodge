#!/usr/bin/env node
/**
 * Re-record bot tapes from the settings they carry and check the moves are the very same (slice H2: the default
 * knobs must leave the Expert and the Ace unchanged; a humanlike bot replays from its tape's settings + seeds).
 * Any tape written by src/game/bot-run.js (tapes/g4, tapes/h1, tapes/h1b, tapes/h2, a sweep's): its `bot` record →
 * makeBot options (botOptionsFromTape), one run per tape, in parallel child processes. Also checks that the new run
 * writes the same `bot` record.
 *
 *   node bin/check-bot-tapes.mjs tapes/h1b/*.json tapes/g4/s01-attack-seed1-b1x.json … [--jobs 4]
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
if (args[0] === '--one') {
    const { loadNoiz2saPatterns } = await import('../src/game/patterns-node.js');
    const { runBot } = await import('../src/game/bot-run.js');
    const { botOptionsFromTape } = await import('../src/game/bot.js');
    const file = args[1];
    const want = JSON.parse(fs.readFileSync(file, 'utf8'));
    const o = botOptionsFromTape(want);
    const t0 = Date.now();
    const { tape } = runBot(loadNoiz2saPatterns(), {
        stage: want.stage, seed: want.seed, endlessSeed: want.endlessSeed, variant: o.variant, horizon: o.horizon, budget: o.budget, tail: o.tail,
        costCap: o.costCap, bankFrames: o.bankFrames, perception: o.perception, motion: o.motion ?? 'curve',
        expert: o.perception === 'observed' ? { margin: o.margin, attackY: o.attackY } : {}, starWeight: o.starWeight, human: o.human ?? null, botSeed: o.botSeed ?? 1,
        personality: want.bot.personality ?? null,
    });
    const same = JSON.stringify(tape.inputs) === JSON.stringify(want.inputs) && tape.frames === want.frames;
    const sameRec = JSON.stringify(tape.bot) === JSON.stringify(want.bot);
    console.log(`${same && sameRec ? 'same' : 'DIFFERENT'}  ${path.basename(file)}: ${tape.frames} frames${sameRec ? '' : ` (bot record ${JSON.stringify(tape.bot)} ≠ ${JSON.stringify(want.bot)})`} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    process.exit(same && sameRec ? 0 : 1);
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
