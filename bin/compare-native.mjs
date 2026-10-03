#!/usr/bin/env node
/**
 * The G2 fidelity check: play each tape in the JS port and in the native Noiz2sa 0.52 build
 * (native/build.sh → native/build/noiz2sa-headless) and compare the per-frame state lines.
 *
 *   node bin/compare-native.mjs [tape.json …]      (default: every tapes/*.json)
 *        [--native path] [--json out.json] [--keep dir]   (--keep writes both dumps per tape)
 *
 * Per tape it reports the first differing frame and which fields differ. When the game returns to the
 * title, the native build has already run initTitle and part of a title-state move(), so on that last
 * line only f= and st= are compared. Without a native build it says so and exits 0 (so it can sit
 * beside `npm test`); with --require-native it exits 2 instead.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadNoiz2saPatterns } from '../src/game/patterns-node.js';
import { newGame, stepGame, stateLine, STATUS } from '../src/game/noiz2sa-game.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const flags = new Set(['--native', '--json', '--keep']);
const files = args.filter((a, i) => !a.startsWith('--') && !flags.has(args[i - 1]));
const tapes = files.length ? files : fs.readdirSync(path.join(root, 'tapes')).filter((f) => f.endsWith('.json')).sort().map((f) => path.join(root, 'tapes', f));
const native = opt('native', path.join(root, 'native/build/noiz2sa-headless'));
const patternDir = path.join(root, 'patterns/noiz2sa');

if (!fs.existsSync(native)) {
    console.log(`no native build at ${path.relative(root, native)} — run native/build.sh; skipped`);
    process.exit(args.includes('--require-native') ? 2 : 0);
}

const P = loadNoiz2saPatterns();
const parse = (line) => Object.fromEntries(line.split(' ').map((kv) => kv.split('=')));

function runPort(tape) {
    const inputs = [];
    for (const [b, n] of tape.inputs) for (let k = 0; k < n; k++) inputs.push(b);
    const g = newGame(P, tape.stage, { seed: tape.seed, endlessSeed: tape.endlessSeed });
    const out = [];
    while (g.status !== STATUS.TITLE && g.frame < inputs.length) {
        stepGame(g, inputs[g.frame]);
        out.push(stateLine(g));
    }
    return out;
}

function runNative(tape) {
    const text = `${tape.stage} ${tape.seed} ${tape.endlessSeed}\n${tape.inputs.map(([b, n]) => `${b} ${n}`).join('\n')}\n`;
    const r = spawnSync(native, [patternDir], { input: text, maxBuffer: 1 << 30, encoding: 'utf8', env: { ...process.env, NOIZ_UB: '1' } });
    if (r.status !== 0) throw new Error(`native exited ${r.status}: ${r.stderr.slice(-500)}`);
    // the reference build reports each sctbl over-read (undefined behaviour: a direction d outside [0, 1024))
    const ub = [...r.stderr.matchAll(/^ub f=(\d+) slot=(\d+) d=(-?\d+)$/gm)].map((m) => ({ frame: Number(m[1]), slot: Number(m[2]), d: Number(m[3]) }));
    return { lines: r.stdout.split('\n').filter(Boolean), ub };
}

const results = [];
let bad = 0;
for (const file of tapes) {
    const tape = JSON.parse(fs.readFileSync(file, 'utf8'));
    const t0 = Date.now();
    const js = runPort(tape), { lines: cc, ub } = runNative(tape);
    const name = path.basename(file, '.json');
    if (opt('keep', null)) {
        fs.mkdirSync(opt('keep'), { recursive: true });
        fs.writeFileSync(path.join(opt('keep'), `${name}.js.txt`), js.join('\n') + '\n');
        fs.writeFileSync(path.join(opt('keep'), `${name}.native.txt`), cc.join('\n') + '\n');
    }
    let first = null;
    const n = Math.max(js.length, cc.length);
    for (let i = 0; i < n && !first; i++) {
        if (js[i] === cc[i]) continue;
        if (js[i] === undefined || cc[i] === undefined) { first = { line: i, frame: i + 1, fields: ['length'], js: js[i] ?? '(ended)', native: cc[i] ?? '(ended)' }; break; }
        const a = parse(js[i]), b = parse(cc[i]);
        const title = a.st === '0' && b.st === '0';
        const keys = title ? ['f', 'st'] : [...new Set([...Object.keys(a), ...Object.keys(b)])];
        const fields = keys.filter((k) => a[k] !== b[k]);
        if (fields.length) first = { line: i, frame: Number(b.f ?? a.f), fields, js: js[i], native: cc[i] };
    }
    const last = parse(js[js.length - 1] ?? 'f=0');
    // a difference at or after an over-read is explained by it (the C's result there is undefined)
    if (first) first.afterUB = ub.length > 0 && ub[0].frame <= first.frame ? ub[0] : null;
    const r = { tape: name, ubFrames: new Set(ub.map((u) => u.frame)).size, firstUB: ub[0] ?? null, stage: tape.stage, seed: tape.seed, endlessSeed: tape.endlessSeed, frames: js.length, nativeFrames: cc.length, end: { st: last.st, sc: last.sc, l: last.l, scene: last.scene }, match: !first, first };
    results.push(r);
    if (first && !first.afterUB) bad++;
    const sec = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(first
        ? `${first.afterUB ? 'UB   ' : 'DIFF '} ${name}: ${js.length} / ${cc.length} frames; first at frame ${first.frame} in ${first.fields.join(', ')}${first.afterUB ? `, after an sctbl over-read at frame ${first.afterUB.frame} (slot ${first.afterUB.slot}, d=${first.afterUB.d})` : ''}\n      js     ${first.js}\n      native ${first.native}`
        : `same  ${name}: ${js.length} frames, end st=${last.st} scene=${last.scene} score=${last.sc} left=${last.l} (${sec} s)`);
}
const ubn = results.filter((r) => r.first?.afterUB).length;
console.log(`${results.length - bad - ubn}/${results.length} tapes identical, ${ubn} differ only after an sctbl over-read (undefined behaviour), ${bad} unexplained`);
if (opt('json', null)) fs.writeFileSync(opt('json'), JSON.stringify(results, null, 1) + '\n');
process.exit(bad ? 1 : 0);
