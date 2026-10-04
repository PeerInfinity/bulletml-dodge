// node test/game.test.mjs — determinism, cloning, and the stage-clear path
import assert from 'node:assert/strict';
import { loadNoiz2saPatterns } from '../src/game/patterns-node.js';
import { newGame, stepGame, stateLine, cloneGame, input, STATUS, SPC } from '../src/game/noiz2sa-game.js';

const P = loadNoiz2saPatterns();
function chase(g) {
    let best = null;
    for (const f of g.foes) if (f && f.spc === SPC.FOE && (!best || f.y > best.y)) best = f;
    if (!best) return input(0, true, false);
    const dx = best.x - g.ship.x;
    return input(Math.abs(dx) < 1024 ? 0 : dx > 0 ? 3 : 7, true, false);
}

// 1. a clone taken mid-game continues exactly as the original
{
    const g = newGame(P, 3, { seed: 7 });
    for (let f = 0; f < 700; f++) stepGame(g, chase(g));
    const c = cloneGame(g);
    for (let f = 0; f < 800; f++) {
        const b = chase(g);
        stepGame(g, b); stepGame(c, b);
        assert.equal(stateLine(c), stateLine(g), `clone diverged at frame ${g.frame}`);
    }
    console.log('ok clone continues identically (stage 4, 800 frames)');
}

// 2. stepping the clone does not touch the original
{
    const g = newGame(P, 0, { seed: 1 });
    for (let f = 0; f < 500; f++) stepGame(g, chase(g));
    const before = stateLine(g);
    const c = cloneGame(g);
    for (let f = 0; f < 300; f++) stepGame(c, input(1, true, true));
    assert.equal(stateLine(g), before);
    console.log('ok the original is untouched by its clone');
}

// 3. an invincible chaser clears stage 1: boss kill → stage clear → back to title, with the left bonus
{
    const g = newGame(P, 0, { seed: 1 });
    let cleared = false, bossKills = 0;
    while (g.status !== STATUS.TITLE && g.frame < 60000) {
        if (g.status === STATUS.IN_GAME) g.ship.invCnt = 2; // test-only invincibility
        for (const e of stepGame(g, chase(g))) { if (e[0] === 'clear') cleared = true; if (e[0] === 'kill' && e[1] === 3) bossKills++; }
    }
    assert.ok(cleared, 'stage cleared');
    assert.ok(bossKills >= 1);
    console.log(`ok stage 1 cleared at frame ${g.frame}, scenes ${g.sceneScores.length}, score ${g.score}, ships ${g.left}, boss kill events ${bossKills}`);
}

// 4. slice HB: the hitbox setting — the two hit tests' geometry, the default, determinism in both modes, tapes
{
    const { centeredHitsShip, segmentHitsShip, HITBOXES } = await import('../src/game/noiz2sa-game.js');
    const { makeTape, replayTape, tapeGameOptions } = await import('../src/game/tape.js');
    const px = 256;
    // centered: 2 px (strictly) around the swept position
    assert.ok(centeredHitsShip(0, 0, 10 * px, 0, 10 * px, 511), 'just inside 2 px of the position');
    assert.ok(!centeredHitsShip(0, 0, 10 * px, 0, 10 * px, 512), '2 px away is a miss');
    // a fast bullet that crosses the ship in one frame: 40 px in a frame, the ship halfway, 1 px off the line
    assert.ok(centeredHitsShip(0, 0, 40 * px, 0, 20 * px, px), 'a fast bullet cannot skip the ship');
    assert.ok(!centeredHitsShip(0, 0, 40 * px, 0, 20 * px, 3 * px), 'but 3 px off its line it misses');
    // the ends are included (a capsule): just behind where it started, just past where it is
    assert.ok(centeredHitsShip(0, 0, 40 * px, 0, -px, 0) && centeredHitsShip(0, 0, 40 * px, 0, 41 * px, 0));
    assert.ok(!centeredHitsShip(0, 0, 40 * px, 0, -3 * px, 0) && !centeredHitsShip(0, 0, 40 * px, 0, 43 * px, 0));
    // a bullet that does not move: centered = a point test, it hits on the ship; the original never hits
    assert.ok(centeredHitsShip(5000, 6000, 5000, 6000, 5000, 6000) && centeredHitsShip(5000, 6000, 5000, 6000, 5300, 6200));
    assert.ok(!centeredHitsShip(5000, 6000, 5000, 6000, 5000 + 2 * px, 6000));
    assert.ok(!segmentHitsShip(5000, 6000, 5000, 6000, 5000, 6000), 'the original: a bullet that does not move never hits');
    // the original's quirk: its trail from the tail (pos − 4 mv) to the head, the ship ON the head — a miss; near the tail — a hit
    const mv = 3 * px, tail = 100 * px, head = tail + 4 * mv;
    assert.ok(!segmentHitsShip(tail, 0, head, 0, head, 0) && centeredHitsShip(head - mv, 0, head, 0, head, 0), 'on the head: original misses, centered hits');
    assert.ok(segmentHitsShip(tail, 0, head, 0, tail + 64, 0) && !centeredHitsShip(head - mv, 0, head, 0, tail + 64, 0), 'near the tail: original hits, centered misses');
    // the default is the original; an unknown hitbox is an error
    assert.deepEqual(HITBOXES, ['original', 'centered']);
    assert.equal(newGame(P, 0, { seed: 1 }).hitbox, 'original');
    assert.throws(() => newGame(P, 0, { seed: 1, hitbox: 'round' }), /unknown hitbox/);
    // determinism in both modes; a clone keeps its hitbox; the two modes play out differently
    const run = (hitbox) => {
        const g = newGame(P, 5, { seed: 3, hitbox }), lines = [], played = [];
        while (g.status === STATUS.IN_GAME && g.frame < 4000) { const b = chase(g); played.push(b); stepGame(g, b); lines.push(stateLine(g)); }
        return { g, lines, played };
    };
    const o1 = run('original'), o2 = run('original'), c1 = run('centered'), c2 = run('centered');
    assert.deepEqual(o1.lines, o2.lines); assert.deepEqual(c1.lines, c2.lines);
    assert.notDeepEqual(o1.lines, c1.lines, 'the hitbox changes the game');
    assert.equal(cloneGame(c1.g).hitbox, 'centered');
    // tapes: centered is recorded and replayed; a tape without `hitbox` is the original
    const tc = makeTape({ stage: 5, seed: 3, endlessSeed: 1, hitbox: 'centered', played: c1.played });
    const to = makeTape({ stage: 5, seed: 3, endlessSeed: 1, played: o1.played });
    assert.equal(tc.hitbox, 'centered'); assert.ok(!('hitbox' in to));
    assert.equal(tapeGameOptions(to).hitbox, 'original');
    assert.equal(stateLine(replayTape(P, tc)), c1.lines[c1.lines.length - 1]);
    assert.equal(stateLine(replayTape(P, to)), o1.lines[o1.lines.length - 1]);
    console.log(`ok hitbox: centered geometry (2 px swept, fast bullets, a resting bullet hits), the default original, deterministic in both modes (stage 6: original ${o1.g.left} left at frame ${o1.g.frame}, centered ${c1.g.left} at ${c1.g.frame}), tapes record and replay it`);
}
