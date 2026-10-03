#!/usr/bin/env node
/**
 * Write the indexes the browser page needs, since a static server gives it no directory listings:
 *   web/index/patterns.json — {zako: [file…], middle: […], boss: […]} in strcmp (byte) order, the order the
 *                             engine and our native build read them in (gameplay-relevant: the stage LCG
 *                             indexes these lists);
 *   web/index/tapes.json    — the tapes in tapes/ and tapes/g4/, with stage, seed and length.
 *   node bin/build-web-index.mjs [--check]   (--check: exit 1 if the files on disk are stale)
 */
import fs from 'node:fs';
import path from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const byteOrder = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b));

const patterns = {};
for (const kind of ['zako', 'middle', 'boss']) {
    patterns[kind] = fs.readdirSync(path.join(root, 'patterns/noiz2sa', kind)).filter((f) => f.endsWith('.xml')).sort(byteOrder);
}
// tapes/*.json, then the G4 bot's tapes/g4/*.json (as "g4/<file>")
const tapeFiles = (sub) => {
    const d = path.join(root, 'tapes', sub);
    return fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith('.json')).sort(byteOrder).map((f) => (sub ? `${sub}/${f}` : f)) : [];
};
const tapes = [...tapeFiles(''), ...tapeFiles('g4')].map((f) => {
    const t = JSON.parse(fs.readFileSync(path.join(root, 'tapes', f), 'utf8'));
    return { file: f, stage: t.stage, seed: t.seed, endlessSeed: t.endlessSeed, frames: t.frames };
});
const out = {
    'web/index/patterns.json': JSON.stringify(patterns, null, 1) + '\n',
    'web/index/tapes.json': JSON.stringify(tapes, null, 1) + '\n',
};
let stale = 0;
for (const [rel, text] of Object.entries(out)) {
    const p = path.join(root, rel);
    const cur = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
    if (cur === text) continue;
    if (process.argv.includes('--check')) { console.error(`stale: ${rel} (run node bin/build-web-index.mjs)`); stale++; } else {
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, text);
        console.log(`wrote ${rel}`);
    }
}
process.exit(stale ? 1 : 0);
