/**
 * The game's sounds (web/sounds/, from the Noiz2sa 0.52 distribution, BSD). As soundmanager.c: chunk n plays on
 * mixer channel n, so a new play of a chunk cuts the previous one; the music loops and fades out over 1280 ms
 * at stage clear and game over.
 */
const CHUNKS = ['shot.wav', 'hit.wav', 'foedst.wav', 'bossdst.wav', 'shipdst.wav', 'bonus.wav', 'extend.wav'];
const MUSIC = ['stg0.ogg', 'stg1.ogg', 'stg2.ogg', 'stg3.ogg', 'stg4.ogg', 'stg5.ogg', 'stg00.ogg'];
export const CHUNK = { SHOT: 0, HIT: 1, FOE_DESTROYED: 2, BOSS_DESTROYED: 3, SHIP_DESTROYED: 4, BONUS: 5, EXTEND: 6 };

export class Sound {
    constructor(base) {
        this.base = base;
        this.muted = false;
        this.ctx = null; this.buffers = []; this.playing = []; this.gain = null;
        this.music = new Audio(); this.music.loop = true; this.music.preload = 'none';
        this.fadeTimer = null;
    }
    /** create the AudioContext — call from a user gesture (a key press) */
    unlock() {
        if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
        const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.gain = this.ctx.createGain(); this.gain.connect(this.ctx.destination);
        this.gain.gain.value = this.muted ? 0 : 1;
        CHUNKS.forEach((f, i) => {
            fetch(new URL(`web/sounds/${f}`, this.base)).then((r) => r.arrayBuffer())
                .then((b) => this.ctx.decodeAudioData(b)).then((buf) => { this.buffers[i] = buf; }).catch(() => {});
        });
    }
    setMuted(m) {
        this.muted = m;
        if (this.gain) this.gain.gain.value = m ? 0 : 1;
        this.music.muted = m;
    }
    chunk(n) {
        if (!this.ctx || !this.buffers[n] || this.muted) return;
        try { this.playing[n]?.stop(); } catch { /* already ended */ }
        const src = this.ctx.createBufferSource();
        src.buffer = this.buffers[n]; src.connect(this.gain); src.start();
        this.playing[n] = src;
    }
    /** stage 0–9 → stg(stage%5+1); the endless modes → stg0, INSANE → stg00 (noiz2sa.c initGame) */
    playStageMusic(stage) {
        const idx = stage < 10 ? (stage % 5) + 1 : stage === 13 ? 6 : 0;
        clearInterval(this.fadeTimer);
        this.music.src = new URL(`web/sounds/${MUSIC[idx]}`, this.base).href;
        this.music.volume = 1; this.music.muted = this.muted; this.music.currentTime = 0;
        this.music.play().catch(() => {});
    }
    fadeMusic(ms = 1280) {
        clearInterval(this.fadeTimer);
        const t0 = performance.now(), v0 = this.music.volume;
        this.fadeTimer = setInterval(() => {
            const k = (performance.now() - t0) / ms;
            if (k >= 1) { this.stopMusic(); return; }
            this.music.volume = v0 * (1 - k);
        }, 40);
    }
    stopMusic() { clearInterval(this.fadeTimer); this.music.pause(); }
}
