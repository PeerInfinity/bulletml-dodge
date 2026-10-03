/**
 * Simple drawing (⚖ simple first, the original look later): canvas shapes in roughly Noiz2sa's colours.
 * The canvas is the game's 640×480 screen: the 320×480 field in the middle, panels on both sides.
 * Sizes and colour indices are the C's (foe.cc drawFoes/drawBullets, ship.c, shot.c, bonus.c).
 */
import { PAL } from './palette.js';
import { SPC, STATUS, STAGE_NAMES, BOSS_TYPE, sctbl } from '../src/game/noiz2sa-game.js';

export const FIELD_X = 160, FIELD_W = 320, FIELD_H = 480;
const FOE_SIZE = [30, 40, 56, 96];
const FOE_COLOR = [[16 * 4 - 1, 16 * 10 - 7], [16 * 2 - 1, 16 * 8 - 7], [16 * 6 - 1, 16 * 12 - 7], [16 * 1 - 11, 16 * 1 - 4]];
const FOE_HIT_COLOR = 16 * 3 - 1;
const BULLET_COLOR = [[16 * 14 - 1, 16 * 2 - 1], [16 * 16 - 1, 16 * 4 - 1], [16 * 12 - 1, 16 * 6 - 1]];
const sin = (d) => sctbl[d & 1023], cos = (d) => sctbl[(d & 1023) + 256];

/** drawBox: centred, color1 inside, color2 the 1-px border (screen.c) */
function box(c, x, y, w, h, c1, c2) {
    c.fillStyle = PAL[c2]; c.fillRect(x - (w >> 1), y - (h >> 1), w, h);
    if (w > 2 && h > 2) { c.fillStyle = PAL[c1]; c.fillRect(x - (w >> 1) + 1, y - (h >> 1) + 1, w - 2, h - 2); }
}

function drawField(c, g, view) {
    c.save();
    c.beginPath(); c.rect(FIELD_X, 0, FIELD_W, FIELD_H); c.clip();
    c.translate(FIELD_X, 0);
    c.fillStyle = '#000'; c.fillRect(0, 0, FIELD_W, FIELD_H);
    // a scrolling floor grid, for a sense of motion only
    c.strokeStyle = '#0b1a24'; c.lineWidth = 1;
    const off = (g.tick * 2) % 40;
    c.beginPath();
    for (let y = off - 40; y < FIELD_H; y += 40) { c.moveTo(0, y + 0.5); c.lineTo(FIELD_W, y + 0.5); }
    for (let x = 20; x < FIELD_W; x += 40) { c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, FIELD_H); }
    c.stroke();

    // bonus stars: four little boxes turning round the star
    for (const bn of g.bonuses) {
        if (!bn) continue;
        const x = bn.x >> 8, y = bn.y >> 8, d = (bn.cnt * 8) & 1023;
        const ox = sin(d) >> 5, oy = cos(d) >> 5;
        for (const [dx, dy] of [[ox, oy], [-ox, -oy], [oy, -ox], [-oy, ox]]) box(c, x + dx, y + dy, 8, 8, 16 * 3 - 3, 16 * 4 - 7);
    }
    // enemies: a box sized by type (growing in over 16 frames), its shield as small boxes around it
    for (const fe of g.foes) {
        if (!fe || fe.spc !== SPC.FOE) continue;
        const x = fe.x >> 8, y = fe.y >> 8;
        let sz = fe.cnt < 16 ? (FOE_SIZE[fe.type] * fe.cnt) >> 4 : FOE_SIZE[fe.type];
        const cl1 = fe.hit ? FOE_HIT_COLOR : FOE_COLOR[fe.type][0], cl2 = FOE_COLOR[fe.type][1];
        box(c, x, y, sz, sz, cl1, cl2);
        if (fe.shield > 0) {
            let d = (fe.cnt * 8) << 4;
            const md = Math.trunc((1024 << 4) / fe.shield);
            sz = Math.trunc(sz / 3);
            for (let j = 0; j < fe.shield; j++, d += md) {
                const di = (d >> 4) & 1023;
                box(c, x + ((sin(di) * sz) >> 7), y + ((cos(di) * sz) >> 7), sz, sz, cl1, cl2);
            }
        }
    }
    // bullets: a thick line along the last move (the swept segment the hit test uses)
    c.lineCap = 'round';
    for (let i = 0; i < g.foes.length; i++) {
        const fe = g.foes[i];
        if (!fe || fe.spc === SPC.FOE || fe.spc === SPC.NOT_EXIST) continue;
        const bc = BULLET_COLOR[fe.spc === SPC.BULLET ? 0 : fe.spc === SPC.ACTIVE_BULLET ? 2 : 1];
        const x = fe.x / 256, y = fe.y / 256, px = fe.px / 256, py = fe.py / 256;
        c.strokeStyle = PAL[bc[1]]; c.lineWidth = 6;
        c.beginPath(); c.moveTo(px, py); c.lineTo(x + 0.01, y); c.stroke();
        c.strokeStyle = PAL[bc[0]]; c.lineWidth = 3;
        c.beginPath(); c.moveTo(px, py); c.lineTo(x + 0.01, y); c.stroke();
    }
    // shots: two thin boxes
    for (const st of g.shots) {
        if (!st) continue;
        const x = st.x >> 8, y = st.y >> 8;
        box(c, x - 5, y, 4, 24, 16 * 7 - 8, 16 * 7 - 1);
        box(c, x + 5, y, 4, 24, 16 * 7 - 8, 16 * 7 - 1);
    }
    // the ship: blinking while invincible (ship.c: hidden drums when invCnt&31 is 1..15)
    if (g.status !== STATUS.GAMEOVER) {
        const s = g.ship, x = s.x >> 8, y = s.y >> 8, ic = s.invCnt & 31;
        if (!(ic > 0 && ic < 16)) {
            let d = ((s.cnt * 8) & 127) - 256;
            for (let i = 0; i < 4; i++, d += 128) box(c, x + ((sin(d) * 15) >> 8), y - ((cos(d) * 15) >> 10), 4, 30, 16 * 3 - 10, 16 * 3 - 12);
        }
        box(c, x, y, 6, 6, 16 * 2 - 1, 16 * 4 - 5);
        c.fillStyle = '#fff'; c.fillRect(x - 1, y - 1, 2, 2); // the hit point (2 px radius)
    }
    // explosions (page-side effects, not game state)
    for (const e of view.effects) {
        const k = e.age / e.life;
        c.strokeStyle = e.color; c.globalAlpha = 1 - k; c.lineWidth = 2;
        c.beginPath(); c.arc(e.x, e.y, e.r * (0.3 + k), 0, Math.PI * 2); c.stroke();
        c.globalAlpha = 1;
    }
    // messages
    c.textAlign = 'center'; c.fillStyle = '#fff';
    if (g.status === STATUS.STAGE_CLEAR) big(c, 'STAGE CLEAR', Math.min(g.endCnt, 128) * 160 / 128);
    if (g.status === STATUS.GAMEOVER) big(c, 'GAME OVER', Math.min(g.endCnt, 128) * 160 / 128);
    if ((g.status === STATUS.STAGE_CLEAR || g.status === STATUS.GAMEOVER) && g.endCnt > 128 && view.mode === 'play') {
        small(c, 'release, then press Z', 200);
    }
    if (view.paused) big(c, 'PAUSE', 240);
    if (view.banner) small(c, view.banner, 260);
    c.restore();
}
function big(c, s, y) { c.font = 'bold 30px monospace'; c.fillStyle = '#fff'; c.fillText(s, FIELD_W / 2, y); }
function small(c, s, y) { c.font = '14px monospace'; c.fillStyle = '#cfe'; c.fillText(s, FIELD_W / 2, y); }

function drawPanels(c, g, view) {
    c.fillStyle = '#05080c'; c.fillRect(0, 0, FIELD_X, FIELD_H); c.fillRect(FIELD_X + FIELD_W, 0, FIELD_X, FIELD_H);
    c.fillStyle = '#123'; c.fillRect(FIELD_X - 1, 0, 1, FIELD_H); c.fillRect(FIELD_X + FIELD_W, 0, 1, FIELD_H);
    c.textAlign = 'left';
    const lab = (s, x, y) => { c.font = '12px monospace'; c.fillStyle = '#7ab'; c.fillText(s, x, y); };
    const val = (s, x, y, col = '#fff') => { c.font = 'bold 20px monospace'; c.fillStyle = col; c.fillText(String(s), x, y); };
    const L = 14, R = FIELD_X + FIELD_W + 14;
    if (g) {
        lab('SCORE', L, 30); val(g.score, L, 54);
        lab('STAR', L, 90); val(g.bonusScore, L, 114, PAL[16 * 3 - 3]);
        lab('SHIPS LEFT', R, 30); val(g.left < 0 ? 0 : g.left, R, 54, PAL[16 * 2 - 1]);
        for (let i = 0; i < Math.min(Math.max(g.left, 0), 8); i++) box(c, R + 6 + i * 14, 70, 6, 6, 16 * 2 - 1, 16 * 4 - 5);
        lab('STAGE', R, 100); val(STAGE_NAMES[g.stage], R, 124);
        // setBarrages counts the scene up as it starts one, so the boss scene is 9 (19, 29… in the endless modes)
        lab('SCENE', R, 160); val(g.scene < 0 ? '-' : g.scene % 10 === 9 ? 'BOSS' : g.scene + 1, R, 184);
        lab('FRAME', R, 220); val(g.frame, R, 240, '#9ab');
    }
    lab(view.modeLabel, L, 160);
    if (view.mode === 'replay') {
        lab(`replay ×${view.speed}`, L, 180);
        const n = (view.tapeName || '').replace(/\.json$/, '');
        lab(n.length > 18 ? n.slice(0, 17) + '…' : n, L, 196);
    }
    lab(view.bot ? `BOT: ${view.policyName}` : 'BOT: off', L, 220);
    lab(view.muted ? 'SOUND: off' : 'SOUND: on', L, 240);
    c.font = '11px monospace'; c.fillStyle = '#567';
    const help = ['arrows/WASD move', 'Z fire  X slow', 'P pause  Esc back', 'B bot  M mute'];
    help.forEach((s, i) => c.fillText(s, L, 400 + i * 16));
}

export function draw(c, g, view) {
    c.fillStyle = '#000'; c.fillRect(0, 0, 640, 480);
    if (g) drawField(c, g, view); else { c.fillStyle = '#000'; c.fillRect(FIELD_X, 0, FIELD_W, FIELD_H); }
    drawPanels(c, g, view);
}

export const foeDrawSize = (type) => FOE_SIZE[type];
export { BOSS_TYPE };
