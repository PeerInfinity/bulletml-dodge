#!/usr/bin/env node
/**
 * Play one Noiz2sa stage headless.
 *
 *   node bin/play-game.mjs --stage 0 [--seed 1] [--endless-seed 1]
 *        [--tape in.json | --policy fire-stay|random] [--frames N]
 *        [--save-tape out.json] [--dump states.txt]
 *
 * A tape is {stage, seed, endlessSeed, inputs: [[byte, count], …]} (run-length encoded; byte = dir | fire<<4 | slow<<5).
 * --dump writes one state line per frame (the format the native build prints, for the fidelity check).
 */
import fs from 'node:fs';
import { loadNoiz2saPatterns } from '../src/game/patterns-node.js';
import { newGame, stepGame, stateLine, STATUS, SPC, input, STAGE_NAMES } from '../src/game/noiz2sa-game.js';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
let tape = opt('tape', null) ? JSON.parse(fs.readFileSync(opt('tape'), 'utf8')) : null;
const stage = tape ? tape.stage : Number(opt('stage', 0));
const seed = tape ? tape.seed : Number(opt('seed', 1));
const endlessSeed = tape ? tape.endlessSeed : Number(opt('endless-seed', 1));
const policy = opt('policy', 'fire-stay');
const maxFrames = Number(opt('frames', 200000));

const inputs = [];
if (tape) for (const [b, n] of tape.inputs) for (let k = 0; k < n; k++) inputs.push(b);
let r = 12345;
const rnd = () => ((r = (Math.imul(r, 1103515245) + 12345) >>> 0) >>> 16);
function nextInput(f) {
    if (tape) return f < inputs.length ? inputs[f] : 0;
    if (policy === 'random') return input(rnd() % 9, rnd() % 4 !== 0, rnd() % 8 === 0);
    if (policy === 'chase') {
        // a test policy, not the bot: slide under the lowest enemy and fire; ignores bullets
        let best = null;
        for (const f of g.foes) if (f && f.spc === SPC.FOE && (!best || f.y > best.y)) best = f;
        if (!best) return input(0, true, false);
        const dx = best.x - g.ship.x;
        return input(Math.abs(dx) < 1024 ? 0 : dx > 0 ? 3 : 7, true, false);
    }
    return input(0, true, false);
}

const g = newGame(loadNoiz2saPatterns(), stage, { seed, endlessSeed });
const played = [];
const dump = opt('dump', null) ? [] : null;
const t0 = Date.now();
const tally = { kills: [0, 0, 0, 0], hits: 0, stars: 0, lostStars: 0, extends: 0 };
while (g.status !== STATUS.TITLE && g.frame < maxFrames && (!tape || g.frame < inputs.length)) {
    const b = nextInput(g.frame);
    played.push(b);
    for (const e of stepGame(g, b)) {
        if (e[0] === 'kill') tally.kills[e[1]]++;
        else if (e[0] === 'hit') tally.hits++;
        else if (e[0] === 'star') tally.stars++;
        else if (e[0] === 'lostStar') tally.lostStars++;
        else if (e[0] === 'extend') tally.extends++;
    }
    if (dump) dump.push(stateLine(g));
}
const outcome = g.status === STATUS.TITLE ? (g.left < 0 ? 'game over' : 'returned to title') : g.status === STATUS.STAGE_CLEAR ? 'stage clear' : g.status === STATUS.GAMEOVER ? 'game over' : 'in game';
console.log(`stage ${STAGE_NAMES[stage]} seed ${seed}: ${outcome} after ${g.frame} frames (${(g.frame / 60).toFixed(0)} s game time), scene ${g.scene}, score ${g.score}, ships left ${g.left}`);
console.log(`kills zako/middle/big/boss ${tally.kills.join('/')}, deaths ${tally.hits}, stars ${tally.stars} (lost ${tally.lostStars}), extends ${tally.extends}; ${((Date.now() - t0) / 1000).toFixed(1)} s wall`);
if (opt('save-tape', null)) {
    const rle = [];
    for (const b of played) { if (rle.length && rle[rle.length - 1][0] === b) rle[rle.length - 1][1]++; else rle.push([b, 1]); }
    fs.writeFileSync(opt('save-tape'), JSON.stringify({ game: 'noiz2sa-0.52', stage, seed, endlessSeed, frames: played.length, inputs: rle }));
}
if (dump) fs.writeFileSync(opt('dump'), dump.join('\n') + '\n');
