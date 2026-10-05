#!/usr/bin/env node
/**
 * Slice N0: play one segment (a region of the Archipelago Loops substrate) with a bot, restarting it on every hit
 * (src/game/segment-run.js).
 *
 *   node bin/segment-run.mjs --start 2:5 [--end 3:boss] [--player "skill 50"] [--seeds 1] [--bot-seeds 1]
 *        [--max-attempts 20] [--hitbox centered|original] [--budget 1] [--tapes dir] [--json out.json]
 *
 * A position is STAGE:SCENE as a player counts them: stage 1–10 (or ENDLESS, HARD, EXTREME, INSANE), scene 1–9 or
 * "boss". --end defaults to --start (a one-scene segment). A player is a setting name as bin/h2-sweep.mjs takes it
 * ("Expert", "skill 50", "Panicky 70", "path 40"). One run per (seed, bot seed): the attempts until a clear, and
 * whether the first was deathless; then the share of deathless first attempts and the mean seconds spent per clear.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadNoiz2saPatterns } from '../src/game/patterns-node.js';
import { BROWSER_BUDGET } from '../src/game/bot.js';
import { settingByName, botOptions } from '../src/game/human.js';
import { runSegment, parsePosition, showPosition } from '../src/game/segment-run.js';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const list = (s) => String(s).split(',').map(Number);

if (!opt('start', null)) { console.error('usage: node bin/segment-run.mjs --start STAGE:SCENE [--end STAGE:SCENE] [--player NAME] …'); process.exit(2); }
const start = parsePosition(opt('start')), end = parsePosition(opt('end', opt('start')));
const st = settingByName(opt('player', 'Expert'));
const { botSeed: _, ...bot } = botOptions(st);
const hitbox = opt('hitbox', 'centered'), maxAttempts = Number(opt('max-attempts', 20)), budget = Number(opt('budget', 1)) * BROWSER_BUDGET;
const tapesDir = opt('tapes', null);
const P = loadNoiz2saPatterns();

const rows = [];
for (const seed of list(opt('seeds', 1))) {
    for (const botSeed of list(opt('bot-seeds', 1))) {
        const { result, tapes } = runSegment(P, { start, end, bot, botSeed, seed, hitbox, maxAttempts, budget, tapes: !!tapesDir });
        rows.push(result);
        const tag = `${st.name.replace(/\s+/g, '-')}-${showPosition(start).replace(':', '_')}-${showPosition(end).replace(':', '_')}-seed${seed}-bot${botSeed}`;
        if (tapesDir) {
            fs.mkdirSync(tapesDir, { recursive: true });
            tapes.forEach((t, i) => fs.writeFileSync(path.join(tapesDir, `${tag}-${i}.json`), JSON.stringify(t)));
        }
        console.log(`${st.name} ${showPosition(start)}–${showPosition(end)} seed ${seed} bot ${botSeed}: ${result.cleared ? `cleared on attempt ${result.attempts}` : `NOT cleared in ${result.attempts}`}`
            + `${result.deathless ? ' (deathless)' : ''}, ${result.seconds} s spent, score ${result.score ?? '—'}, ${result.cpuSec} s CPU`);
    }
}
const n = rows.length, deathless = rows.filter((r) => r.deathless).length, cleared = rows.filter((r) => r.cleared);
console.log(`${st.name} ${showPosition(start)}–${showPosition(end)} (${hitbox}): deathless first attempt ${deathless}/${n}; cleared ${cleared.length}/${n}`
    + (cleared.length ? `; mean seconds spent per clear ${(cleared.reduce((s, r) => s + r.seconds, 0) / cleared.length).toFixed(1)}` : ''));
if (opt('json', null)) fs.writeFileSync(opt('json'), JSON.stringify({ player: st.name, knobs: st.knobs, start, end, hitbox, rows }, null, 1));
