/**
 * Load Noiz2sa's patterns over HTTP, in the order the engine needs (strcmp by file name — the stage LCG indexes
 * these lists, so the order is gameplay). The order comes from web/index/patterns.json, written by
 * `node bin/build-web-index.mjs` with the same sort `patterns-node.js` uses.
 * `base` is the URL of the repository root.
 */
import { parseBulletML } from '../bulletml.js';

export async function loadNoiz2saPatternsWeb(base) {
    const index = await (await fetch(new URL('web/index/patterns.json', base))).json();
    const out = {};
    for (const kind of ['zako', 'middle', 'boss']) {
        const texts = await Promise.all(index[kind].map(async (f) => {
            const r = await fetch(new URL(`patterns/noiz2sa/${kind}/${encodeURIComponent(f)}`, base));
            if (!r.ok) throw new Error(`${kind}/${f}: HTTP ${r.status}`);
            return r.text();
        }));
        out[kind] = texts.map((t, i) => parseBulletML(t, `${kind}/${index[kind][i]}`));
    }
    return out;
}
