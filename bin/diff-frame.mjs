#!/usr/bin/env node
/**
 * Diagnose a G2 difference: print the port's and the native build's pools in detail at frame N-1 and N
 * of a tape, side by side as a unified diff (one foe / bonus / shot per line).
 *
 *   node bin/diff-frame.mjs tapes/x.json N [--native path]
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadNoiz2saPatterns } from '../src/game/patterns-node.js';
import { newGame, stepGame, STATUS, SPC } from '../src/game/noiz2sa-game.js';
import { tapeGameOptions } from '../src/game/tape.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [file, frameArg] = process.argv.slice(2);
const N = Number(frameArg);
const i = process.argv.indexOf('--native');
const native = i >= 0 ? process.argv[i + 1] : path.join(root, 'native/build/noiz2sa-headless');
const tape = JSON.parse(fs.readFileSync(file, 'utf8'));

function detail(g) {
    const out = [];
    g.foes.forEach((f, k) => {
        if (!f) return;
        out.push(`foe ${k} spc=${f.spc} type=${f.type} x=${f.x} y=${f.y} d=${f.d} spd=${f.spd} vx=${f.vx} vy=${f.vy} mv=${f.mx},${f.my} shield=${f.spc === SPC.FOE ? f.shield : 0} cnt=${f.cnt}`);
    });
    g.bonuses.forEach((b, k) => { if (b) out.push(`bonus ${k} x=${b.x} y=${b.y} vx=${b.vx} vy=${b.vy} down=${b.down}`); });
    g.shots.forEach((s, k) => { if (s) out.push(`shot ${k} x=${s.x} y=${s.y}`); });
    return out;
}

const inputs = [];
for (const [b, n] of tape.inputs) for (let k = 0; k < n; k++) inputs.push(b);
const g = newGame(loadNoiz2saPatterns(), tape.stage, tapeGameOptions(tape));
const js = [];
while (g.status !== STATUS.TITLE && g.frame < Math.min(N, inputs.length)) {
    stepGame(g, inputs[g.frame]);
    if (g.frame === N - 1 || g.frame === N) js.push(`== frame ${g.frame}`, ...detail(g));
}
const text = `${tape.stage} ${tape.seed} ${tape.endlessSeed}\n${tape.inputs.map(([b, n]) => `${b} ${n}`).join('\n')}\n`;
const r = spawnSync(native, [path.join(root, 'patterns/noiz2sa')], { input: text, maxBuffer: 1 << 30, encoding: 'utf8', env: { ...process.env, NOIZ_DETAIL: String(N) } });
const cc = r.stderr.split('\n').filter((l) => /^(==|foe|bonus|shot) /.test(l));
const tmp = fs.mkdtempSync('/tmp/diff-frame-');
fs.writeFileSync(path.join(tmp, 'js.txt'), js.join('\n') + '\n');
fs.writeFileSync(path.join(tmp, 'native.txt'), cc.join('\n') + '\n');
const d = spawnSync('diff', ['-u', path.join(tmp, 'js.txt'), path.join(tmp, 'native.txt')], { encoding: 'utf8' });
console.log(d.stdout || 'identical detail');
fs.rmSync(tmp, { recursive: true });
