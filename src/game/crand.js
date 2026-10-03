/**
 * glibc's rand() (the TYPE_3 additive-feedback generator behind srand/rand),
 * so the port draws exactly what a native Linux build of Noiz2sa draws.
 * The state is plain data: `cloneCRand` copies it for look-ahead search.
 */

export const RAND_MAX = 2147483647;

export function newCRand(seed) {
    let s = seed >>> 0;
    if (s === 0) s = 1;
    const r = new Int32Array(34);
    r[0] = s | 0;
    for (let i = 1; i < 31; i++) {
        // r[i] = (16807 * r[i-1]) % 2147483647, computed as glibc does (Schrage's method on signed words)
        const hi = Math.trunc(r[i - 1] / 127773);
        const lo = r[i - 1] % 127773;
        let word = 16807 * lo - 2836 * hi;
        if (word < 0) word += 2147483647;
        r[i] = word;
    }
    for (let i = 31; i < 34; i++) r[i] = r[i - 31];
    const st = { ring: new Int32Array(34), pos: 0 };
    // keep the last 34 values; discard the first 310 outputs (o_0 is r[344])
    st.ring.set(r);
    st.pos = 0; // ring[pos] is r[k] for the oldest k
    for (let i = 34; i < 344; i++) next(st);
    return st;
}

function next(st) {
    // r[k] = r[k-31] + r[k-3]; the ring holds r[k-34..k-1] with ring[pos] = r[k-34]
    const a = st.ring[(st.pos + 3) % 34];  // r[k-31]
    const b = st.ring[(st.pos + 31) % 34]; // r[k-3]
    const v = (a + b) | 0;
    st.ring[st.pos] = v;
    st.pos = (st.pos + 1) % 34;
    return v;
}

export function crand(st) {
    return next(st) >>> 1;
}

export function cloneCRand(st) {
    return { ring: st.ring.slice(), pos: st.pos };
}
