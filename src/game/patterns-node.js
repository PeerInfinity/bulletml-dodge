/** Load Noiz2sa's pattern directories in the order our native build uses: file names by strcmp (byte) order. */
import fs from 'node:fs';
import path from 'node:path';
import { parseBulletML } from '../bulletml.js';

const byteOrder = (a, b) => (Buffer.compare(Buffer.from(a), Buffer.from(b)));

export function loadNoiz2saPatterns(dir = new URL('../../patterns/noiz2sa', import.meta.url).pathname) {
    const out = {};
    for (const kind of ['zako', 'middle', 'boss']) {
        const files = fs.readdirSync(path.join(dir, kind)).filter((f) => f.endsWith('.xml')).sort(byteOrder);
        out[kind] = files.map((f) => parseBulletML(fs.readFileSync(path.join(dir, kind, f), 'utf8'), `${kind}/${f}`));
    }
    return out;
}
