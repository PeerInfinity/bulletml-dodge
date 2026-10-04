/**
 * Slice H1: why did the observed bot (the Expert) lose a life? Replays a tape to each hit and reports, per hit:
 * the bullet(s) that hit, how long each was on screen, whether it moved straight since it was first seen (or
 * turned / changed speed), whether it was fired at the ship (aimed, from its first motion), the pattern of the
 * enemy that fired it and the scene's patterns, and for how many frames before the hit the bot's own model —
 * the picture of each frame predicted forward along the ship's real path — showed that hit coming ("warned").
 *
 *  - warned 0: the model never predicted it: a bullet still a dot (not yet moving) or one whose motion changed
 *    after the bot's last look;
 *  - warned 1–2: seen in time to react only a frame or two;
 *  - warned more: seen coming, and the bot still found no way out (cornered — or its search missed one).
 */
import { newGame, stepGame, cloneGame, segmentHitsShip, getDeg, SPC, STATUS } from './noiz2sa-game.js';
import { tapeInputs } from './tape.js';
import { observe, newTracker, stepModel } from './perception.js';

const WINDOW = 240; // frames of history kept before each hit

export function diagnoseDeaths(patterns, tape, hitFrames, { motion = 'curve' } = {}) {
    const inputs = tapeInputs(tape);
    const out = [];
    for (const hf of hitFrames) {
        const F = hf - 1; // the hit happens in the step from frame F
        const g = newGame(patterns, tape.stage, { seed: tape.seed, endlessSeed: tape.endlessSeed });
        const hist = new Map(); // frame → {foes: [slot → light record], ship, model}
        const tr = newTracker();
        while (g.frame < F) {
            if (g.frame >= F - WINDOW) record(g, hist, tr, motion);
            stepGame(g, inputs[g.frame]);
        }
        record(g, hist, tr, motion);
        const scene = g.barrage.slice(0, g.barrageNum).map((b) => g.lists[b.type][b.i].name);
        // the hitters: step a copy with the ship made invincible (so the hit wipes nothing) and test every bullet
        const c = cloneGame(g);
        c.ship.invCnt = 2;
        stepGame(c, inputs[F]);
        const hitters = [];
        for (let j = 0; j < c.foes.length; j++) {
            const f = c.foes[j];
            if (!f || f.spc === SPC.FOE) continue;
            if (segmentHitsShip(f.px, f.py, f.x, f.y, c.ship.x, c.ship.y)) hitters.push(j);
        }
        const bullets = hitters.map((j) => bulletStory(g, c, j, F, hist, inputs, motion));
        out.push({ frame: hf, scene, bullets, live: g.foes.filter((f) => f).length });
    }
    return out;
}

function record(g, hist, tr, motion) {
    const foes = new Map();
    for (let i = 0; i < g.foes.length; i++) {
        const f = g.foes[i];
        if (f) foes.set(i, { x: f.x, y: f.y, mx: f.mx, my: f.my, cnt: f.cnt, spc: f.spc, name: f.spc === SPC.FOE ? f.bml && f.bml.name : null });
    }
    hist.set(g.frame, { foes, ship: { x: g.ship.x, y: g.ship.y }, model: observe(g, tr, { motion }) });
}

function bulletStory(g, c, j, F, hist, inputs, motion) {
    const f = c.foes[j];
    // walk back through the frames while slot j holds the same bullet (position continuity)
    let first = F, cur = hist.get(F).foes.get(j);
    if (!cur || cur.x !== f.x - f.mx || cur.y !== f.y - f.my) {
        // fired in the hit's own frame (and moved in it): never on screen before it hit
        const spawn = [f.x - f.mx, f.y - f.my], sh = hist.get(F).ship;
        let shooter = null;
        for (const [, r] of hist.get(F).foes) if ((r.spc === SPC.FOE || r.spc === SPC.ACTIVE_BULLET) && Math.abs(r.x - spawn[0]) <= 256 && Math.abs(r.y - spawn[1]) <= 256) { shooter = r.spc === SPC.FOE ? r.name : 'an active bullet'; if (r.spc === SPC.FOE) break; }
        const d = Math.abs(((getDeg(f.mx, f.my) - getDeg(sh.x - spawn[0], sh.y - spawn[1]) + 512) & 1023) - 512);
        return { slot: j, ageAtHit: f.cnt, seenFrames: 0, shooter, aimed: d <= 6, warned: 0, motionChanges: 0, lastChangeFrame: null,
            speedPx: +(Math.hypot(f.mx, f.my) / 256).toFixed(2), fromPx: Math.round(Math.hypot(sh.x - spawn[0], sh.y - spawn[1]) / 256), unseen: true };
    }
    for (let k = F - 1; hist.has(k); k--) {
        const prev = hist.get(k).foes.get(j);
        if (!prev || cur.cnt === 0 || prev.x !== cur.x - cur.mx || prev.y !== cur.y - cur.my || prev.cnt !== cur.cnt - 1) break;
        first = k; cur = prev;
    }
    const firstRec = hist.get(first).foes.get(j);
    const spawn = firstRec.cnt === 0 ? [firstRec.x, firstRec.y] : [firstRec.x - firstRec.mx, firstRec.y - firstRec.my];
    // who fired it: an object of the frame it was first seen whose previous position was the spawn point
    let shooter = null;
    for (const [, r] of hist.get(first).foes) {
        if (r.spc !== SPC.FOE && r.spc !== SPC.ACTIVE_BULLET) continue;
        if (Math.abs(r.x - r.mx - spawn[0]) <= 256 && Math.abs(r.y - r.my - spawn[1]) <= 256) { shooter = r.spc === SPC.FOE ? r.name : 'an active bullet'; if (r.spc === SPC.FOE) break; }
        if (!shooter && Math.abs(r.x - spawn[0]) <= 256 && Math.abs(r.y - spawn[1]) <= 256) shooter = r.spc === SPC.FOE ? r.name : 'an active bullet';
    }
    // its motion since it was first seen moving: how many frames its motion changed
    let changes = 0, lastChange = null, firstMv = null, prevMv = null;
    for (let k = first; k <= F; k++) {
        const r = hist.get(k).foes.get(j);
        if (r.cnt === 0) continue;
        if (!firstMv) firstMv = [r.mx, r.my, k];
        if (prevMv && (prevMv[0] !== r.mx || prevMv[1] !== r.my)) { changes++; lastChange = k; }
        prevMv = [r.mx, r.my];
    }
    const mvNow = [f.mx, f.my];
    if (prevMv && (prevMv[0] !== mvNow[0] || prevMv[1] !== mvNow[1])) { changes++; lastChange = F + 1; }
    // aimed: its first motion points at where the ship was when it was fired (within 2°)
    let aimed = null;
    if (firstMv) {
        const sh = hist.get(Math.max(first - 1, F - WINDOW)) ? hist.get(Math.max(first - 1, F - WINDOW)).ship : hist.get(first).ship;
        const a = getDeg(firstMv[0], firstMv[1]), b = getDeg(sh.x - spawn[0], sh.y - spawn[1]);
        const d = Math.abs(((a - b + 512) & 1023) - 512);
        aimed = d <= 6;
    }
    // warned: for how many frames before the hit the model of that frame (the bullet alone, the ship's real
    // inputs) predicted this hit
    let warned = 0;
    for (let k = F; k >= first; k--) {
        const m = structuredClone(hist.get(k).model);
        m.foes = m.foes.filter((o) => o.slot === j);
        m.ship.invCnt = Math.min(m.ship.invCnt, Math.max(0, F - k)); // as invincible as the ship really was
        let hitAt = -1;
        for (let t = k; t <= F; t++) if (stepModel(m, inputs[t]) && hitAt < 0) hitAt = t;
        if (hitAt === F) warned = F + 1 - k; else break;
    }
    const pred = hist.get(F).model.foes.find((o) => o.slot === j);
    return {
        slot: j, ageAtHit: f.cnt, seenFrames: F + 1 - first, spawnFrame: first, shooter, aimed,
        motionChanges: changes, lastChangeFrame: lastChange, warned,
        speedPx: +(Math.hypot(f.mx, f.my) / 256).toFixed(2), unseenDot: !!pred && pred.cnt === 0,
    };
}

/** one line per hit, for the report */
export function deathLine(d) {
    const b = d.bullets.map((x) => {
        if (x.unseen) return `${x.aimed ? 'aimed ' : ''}bullet ${x.speedPx} px/f from ${x.shooter ?? '?'} ${x.fromPx} px away: fired in the hit's own frame (never seen)`;
        const what = x.unseenDot ? 'a dot not yet moving' : x.warned === 0 ? (x.lastChangeFrame !== null && x.lastChangeFrame >= d.frame - 1 ? 'turned / changed speed after the last look' : 'mispredicted') : x.warned <= 2 ? `seen ${x.warned} frame${x.warned > 1 ? 's' : ''} ahead` : `seen ${x.warned} frames ahead (cornered)`;
        return `${x.aimed ? 'aimed ' : ''}bullet ${x.speedPx} px/f, on screen ${x.seenFrames} f, ${x.motionChanges ? `motion changed ${x.motionChanges}×` : 'straight'}, from ${x.shooter ?? '?'}: ${what}`;
    });
    return `f${d.frame}: ${b.join('; ') || 'no hitter found'}`;
}
