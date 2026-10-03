#!/usr/bin/env node
/** Slice P1: open native/wasm/bench.html in headless Chromium (serving the repository) and print its timings.
 *   node native/wasm/bench-browser.mjs [g4/s11-attack-seed1-b1x.json] */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = new URL('../../', import.meta.url).pathname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.xml': 'text/xml', '.wasm': 'application/wasm' };
const server = http.createServer((req, res) => {
    const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch();
try {
    const page = await browser.newPage();
    page.on('pageerror', (e) => console.error('page error:', e));
    await page.goto(`http://127.0.0.1:${server.address().port}/native/wasm/bench.html?tape=${encodeURIComponent(process.argv[2] || 'g4/s11-attack-seed1-b1x.json')}`);
    const r = await page.evaluate(() => window.benchResult);
    console.log(JSON.stringify(r, (k, v) => (typeof v === 'number' && !Number.isInteger(v) ? +v.toFixed(2) : v), 1));
} finally {
    await browser.close();
    server.close();
}
