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
