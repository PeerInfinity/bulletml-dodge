/**
 * BulletML parser + runner — a JavaScript port of libBulletML 0.0.6
 * (shinichiro.h, Modified BSD; see NOTICE.md), kept close to the C++ so the
 * patterns behave as they do in Kenta Cho's games.
 *
 * Differences from the C++ that are deliberate:
 *  - A runner's whole state is PLAIN DATA (`cloneImpl`), so a bot can copy a
 *    world and search ahead. The parsed tree is shared and never copied.
 *  - Formulas compile once per node to a JS function over ($rand, $rank, $n).
 */

// The XML parser: the browser's own DOMParser in a page, @xmldom/xmldom in Node. A Web Worker has neither; it
// takes patterns parsed elsewhere (packBulletML → postMessage → unpackBulletML).
let DOMParser = globalThis.DOMParser;
if (!DOMParser) {
    try { ({ DOMParser } = await import('@xmldom/xmldom')); } catch { DOMParser = null; }
}

const NAMES = new Set([
    'bullet', 'action', 'fire', 'changeDirection', 'changeSpeed', 'accel', 'wait',
    'repeat', 'bulletRef', 'actionRef', 'fireRef', 'vanish', 'horizontal', 'vertical',
    'term', 'times', 'direction', 'speed', 'param', 'bulletml',
]);

/** Compile a BulletML formula. Only numbers, $rand, $rank, $n and + - * / % ( ) are accepted. */
function compileFormula(text) {
    const src = text.trim();
    if (src === '') return () => 0;
    if (!/^[0-9.\s+\-*/%()$a-z]*$/.test(src)) throw new Error(`bad formula: ${src}`);
    const js = src
        .replace(/\$rand/g, 'R()')
        .replace(/\$rank/g, 'K')
        .replace(/\$([0-9]+)/g, (_, n) => `P(${n})`);
    if (/[a-z]/.test(js.replace(/\b[RKP]\b/g, ''))) throw new Error(`bad formula: ${src}`);
    // eslint-disable-next-line no-new-func
    return new Function('R', 'K', 'P', `return (${js});`);
}

export function parseBulletML(xmlText, name = '?') {
    if (!DOMParser) throw new Error(`${name}: no XML parser here (a worker takes packed patterns)`);
    const doc = new DOMParser({ onError: () => {} }).parseFromString(xmlText, 'text/xml');
    const rootEl = doc.documentElement;
    if (!rootEl || rootEl.localName !== 'bulletml') throw new Error(`${name}: no <bulletml> root`);
    const refs = { bullet: new Map(), action: new Map(), fire: new Map() };
    const topActions = [];
    let nextId = 0;

    function build(el, parent) {
        const node = {
            id: nextId++, name: el.localName, type: el.getAttribute('type') || 'none',
            label: el.getAttribute('label') || null, parent, children: [], fn: null, text: '',
        };
        if (!NAMES.has(node.name)) throw new Error(`${name}: unknown element <${node.name}>`);
        let text = '';
        for (let c = el.firstChild; c; c = c.nextSibling) {
            if (c.nodeType === 1) node.children.push(build(c, node));
            else if (c.nodeType === 3 || c.nodeType === 4) text += c.nodeValue;
        }
        node.text = text;
        if (node.children.length === 0 && text.trim() !== '') node.fn = compileFormula(text);
        if (node.label && refs[node.name]) refs[node.name].set(node.label, node);
        if (node.name === 'action' && node.label && node.label.startsWith('top') && parent && parent.name === 'bulletml') {
            topActions.push(node);
        }
        return node;
    }

    const root = build(rootEl, null);
    const horizontal = rootEl.getAttribute('type') === 'horizontal';
    return { name, root, refs, topActions, horizontal };
}

/**
 * A parsed pattern as plain data that postMessage can copy (its compiled formulas are functions, which it
 * cannot): the same tree, refs and top actions, with `fn` left out. unpackBulletML compiles them again from
 * the same text, so the result runs exactly as the original.
 */
export function packBulletML(bml) {
    const map = new Map();
    const copy = (n) => {
        if (!n) return n;
        let c = map.get(n);
        if (c) return c;
        c = { ...n, fn: null, parent: null, children: [] };
        map.set(n, c);
        c.parent = copy(n.parent);
        c.children = n.children.map(copy);
        return c;
    };
    const root = copy(bml.root);
    const refs = {};
    for (const k of Object.keys(bml.refs)) refs[k] = new Map([...bml.refs[k]].map(([l, n]) => [l, copy(n)]));
    return { name: bml.name, root, refs, topActions: bml.topActions.map(copy), horizontal: bml.horizontal };
}
export function unpackBulletML(bml) {
    const walk = (n) => {
        if (n.children.length === 0 && n.text.trim() !== '') n.fn = compileFormula(n.text);
        n.children.forEach(walk);
    };
    walk(bml.root);
    return bml;
}

function child(node, name) {
    for (const c of node.children) if (c.name === name) return c;
    return null;
}
function next(node) {
    const p = node.parent;
    if (!p) return null;
    const i = p.children.indexOf(node);
    return p.children[i + 1] || null;
}

/**
 * The game supplies a `host` with: getBulletDirection, getAimDirection,
 * getBulletSpeed, getDefaultSpeed, getRank, getRand, getTurn, getBulletSpeedX/Y,
 * createSimpleBullet(dir, spd), createBullet(state, dir, spd), doVanish,
 * doChangeDirection, doChangeSpeed, doAccelX, doAccelY — the libBulletML virtuals.
 */

/** A runner = the list of impls libBulletML's BulletMLRunner holds. State: {bml, nodes, params}. */
export function makeRunner(bml, state = null) {
    const states = state ? [state] : bml.topActions.map((a) => ({ bml, nodes: [a], params: null }));
    return { impls: states.map(makeImpl) };
}

function makeImpl(state) {
    // C++ setParent(0) on every root node — a global, permanent tree mutation.
    for (const n of state.nodes) n.parent = null;
    return {
        bml: state.bml, nodes: state.nodes.slice(), actIte: 0, end: false, act: state.nodes[0],
        actTurn: -1, endTurn: 0, params: state.params,
        spd: null, dir: null, prevSpd: null, prevDir: null, // null = not "validate"
        changeDir: null, changeSpeed: null, accelX: null, accelY: null,
        repeatStack: [], refStack: [],
    };
}

const cloneLin = (f) => (f ? { fx: f.fx, lx: f.lx, fy: f.fy, ly: f.ly, g: f.g } : null);
const cloneStack = (a) => (a.length ? a.map((e) => ({ ...e })) : []);
// written out field by field, in makeImpl's order (slice P1: faster than a spread)
const cloneImpl = (m) => ({
    bml: m.bml, nodes: m.nodes.slice(), actIte: m.actIte, end: m.end, act: m.act,
    actTurn: m.actTurn, endTurn: m.endTurn, params: m.params,
    spd: m.spd, dir: m.dir, prevSpd: m.prevSpd, prevDir: m.prevDir,
    changeDir: cloneLin(m.changeDir), changeSpeed: cloneLin(m.changeSpeed), accelX: cloneLin(m.accelX), accelY: cloneLin(m.accelY),
    repeatStack: cloneStack(m.repeatStack), refStack: cloneStack(m.refStack),
});
export function cloneRunner(r) {
    return { impls: r.impls.length === 1 ? [cloneImpl(r.impls[0])] : r.impls.map(cloneImpl) };
}

/**
 * ⚠ NOT libBulletML's isEnd(): this is true when EVERY top action has ended. It is kept as it is because the
 * single-pattern harness (src/noiz2sa.js, bin/run-pattern.mjs) uses it and its sweep must stay reproducible.
 */
export const runnerIsEnd = (r) => r.impls.every((m) => m.end);
/**
 * libBulletML 0.0.6's BulletMLRunner::isEnd(): true as soon as ANY top action has ended (the "all" version
 * is commented out in bulletmlrunner.cpp). Noiz2sa restarts a boss runner on it. Found by the G2 comparison.
 */
export const runnerIsEndLib = (r) => r.impls.some((m) => m.end);

export function runRunner(r, host) {
    for (const m of r.impls) runImpl(m, host);
}

// ── LinearFunc ──
const lin = (fx, lx, fy, ly) => ({ fx, lx, fy, ly, g: (ly - fy) / (lx - fx) });
const linValue = (f, x) => f.fy + f.g * (x - f.fx);

// a formula's $n reads the params of the impl being evaluated (formulas never nest), so one function serves them all
// instead of two new closures per evaluation (slice P1); hosts' getRand takes no `this`
let numParams = null;
const paramOf = (i) => (numParams && i < numParams.length ? numParams[i] : 1);
function num(m, host, node) {
    numParams = m.params;
    return node.fn(host.getRand, host.getRank(), paramOf);
}

function getDirection(m, host, dirNode, prevChange = true) {
    let dir = num(m, host, dirNode);
    let isDefault = true;
    const type = dirNode.type;
    if (type !== 'none') {
        isDefault = false;
        if (type === 'absolute') {
            if (m.bml.horizontal) dir -= 90;
        } else if (type === 'relative') {
            dir += host.getBulletDirection();
        } else if (type === 'sequence') {
            if (m.prevDir === null) { dir = 0; isDefault = true; } else dir += m.prevDir;
        } else {
            isDefault = true;
        }
    }
    if (isDefault) dir += host.getAimDirection();
    while (dir > 360) dir -= 360;
    while (dir < 0) dir += 360;
    if (prevChange) m.prevDir = dir;
    return dir;
}

function getSpeed(m, host, spdNode) {
    let spd = num(m, host, spdNode);
    const type = spdNode.type;
    if (type === 'relative') spd += host.getBulletSpeed();
    else if (type === 'sequence') spd = m.prevSpd === null ? 1 : spd + m.prevSpd;
    m.prevSpd = spd;
    return spd;
}

function setSpeed(m, host) {
    const s = child(m.act, 'speed');
    if (s) m.spd = getSpeed(m, host, s);
}
function setDirection(m, host) {
    const d = child(m.act, 'direction');
    if (d) m.dir = getDirection(m, host, d);
}

const isTurnEnd = (m) => m.end || m.actTurn > m.endTurn;

const CHANGES = [['changeDir', 'doChangeDirection'], ['changeSpeed', 'doChangeSpeed'], ['accelX', 'doAccelX'], ['accelY', 'doAccelY']];
function changes(m, host) {
    const now = host.getTurn();
    for (const [key, apply] of CHANGES) {
        const f = m[key];
        if (!f) continue;
        if (now >= f.lx) { host[apply](f.ly); m[key] = null; } else host[apply](linValue(f, now));
    }
}

function getParameters(m, host) {
    let para = null;
    for (const n of m.act.children) {
        if (n.name !== 'param') continue;
        if (!para) para = [0];
        para.push(num(m, host, n));
    }
    return para;
}

const COMMANDS = {
    bullet(m, host) {
        setSpeed(m, host);
        setDirection(m, host);
        if (m.spd === null) m.prevSpd = m.spd = host.getDefaultSpeed();
        if (m.dir === null) m.prevDir = m.dir = host.getAimDirection();
        const acts = m.act.children.filter((c) => c.name === 'action')
            .concat(m.act.children.filter((c) => c.name === 'actionRef'));
        if (acts.length === 0) host.createSimpleBullet(m.dir, m.spd);
        else host.createBullet({ bml: m.bml, nodes: acts, params: m.params }, m.dir, m.spd);
        m.act = null;
    },
    action(m) {
        m.act = m.act.children.length ? m.act.children[0] : null;
    },
    fire(m, host) {
        m.spd = null; m.dir = null; // shotInit
        setSpeed(m, host);
        setDirection(m, host);
        const b = child(m.act, 'bullet') || child(m.act, 'bulletRef');
        if (!b) throw new Error('<fire> must have contents bullet or bulletRef');
        m.act = b;
    },
    wait(m, host) {
        const frame = Math.trunc(num(m, host, m.act));
        if (frame > 0) m.actTurn += frame;
        m.act = null;
    },
    repeat(m, host) {
        const times = child(m.act, 'times');
        if (!times) return; // C++: returns without advancing (an infinite loop there too)
        const n = Math.trunc(num(m, host, times));
        const action = child(m.act, 'action') || child(m.act, 'actionRef');
        if (!action) throw new Error('repeat elem must have contents action or actionRef');
        m.repeatStack.push({ ite: 0, end: n, act: action });
        m.act = action;
    },
    fireRef(m, host) { ref(m, host, 'fire'); },
    actionRef(m, host) { ref(m, host, 'action'); },
    bulletRef(m, host) { ref(m, host, 'bullet'); },
    changeDirection(m, host) {
        const term = Math.trunc(num(m, host, child(m.act, 'term')));
        const dirNode = child(m.act, 'direction');
        const seq = dirNode.type === 'sequence';
        const dir = seq ? num(m, host, dirNode) : getDirection(m, host, dirNode, false);
        const finalTurn = m.actTurn + term;
        const first = host.getBulletDirection();
        if (seq) {
            m.changeDir = lin(m.actTurn, finalTurn, first, first + dir * term);
        } else {
            const s1 = dir - first;
            const s2 = s1 > 0 ? s1 - 360 : s1 + 360;
            // C++ calls integer abs() on doubles here: compare truncated magnitudes.
            const space = Math.abs(Math.trunc(s1)) < Math.abs(Math.trunc(s2)) ? s1 : s2;
            m.changeDir = lin(m.actTurn, finalTurn, first, first + space);
        }
        m.act = null;
    },
    changeSpeed(m, host) {
        const term = Math.trunc(num(m, host, child(m.act, 'term')));
        const spdNode = child(m.act, 'speed');
        const spd = spdNode.type !== 'sequence'
            ? getSpeed(m, host, spdNode)
            : num(m, host, spdNode) * term + host.getBulletSpeed();
        m.changeSpeed = lin(m.actTurn, m.actTurn + term, host.getBulletSpeed(), spd);
        m.act = null;
    },
    accel(m, host) {
        const term = Math.trunc(num(m, host, child(m.act, 'term')));
        const h = child(m.act, 'horizontal');
        const v = child(m.act, 'vertical');
        if (m.bml.horizontal) {
            if (v) accel(m, host, 'X', num(m, host, v), term, v.type);
            if (h) accel(m, host, 'Y', -num(m, host, h), term, h.type);
        } else {
            if (h) accel(m, host, 'X', num(m, host, h), term, h.type);
            if (v) accel(m, host, 'Y', num(m, host, v), term, v.type);
        }
        m.act = null;
    },
    vanish(m, host) {
        host.doVanish();
        m.act = null;
    },
};

function ref(m, host, kind) {
    const prev = m.params;
    m.params = getParameters(m, host);
    m.refStack.push({ node: m.act, params: prev });
    const target = m.bml.refs[kind].get(m.act.label);
    if (!target) throw new Error(`${m.bml.name}: no ${kind} labelled "${m.act.label}"`);
    m.act = target;
}

function accel(m, host, axis, value, term, type) {
    const first = axis === 'X' ? host.getBulletSpeedX() : host.getBulletSpeedY();
    const fin = type === 'sequence' ? first + value * term : type === 'relative' ? first + value : value;
    m[`accel${axis}`] = lin(m.actTurn, m.actTurn + term, first, fin);
}

const isRefTarget = (node) => node.parent && node.parent.name === 'bulletml';

function runSub(m, host) {
    let guard = 0;
    while (m.act && !isTurnEnd(m)) {
        if (++guard > 100000) throw new Error(`${m.bml.name}: runaway action (no wait in a loop?)`);
        let prev = m.act;
        const cmd = COMMANDS[m.act.name];
        if (!cmd) throw new Error(`${m.bml.name}: <${m.act.name}> is not a command`);
        cmd(m, host);
        // return from a ref
        if (!m.act && isRefTarget(prev)) {
            const top = m.refStack.pop();
            prev = top.node;
            m.params = top.params;
        }
        if (!m.act) m.act = next(prev);
        // climb to find the next node
        while (!m.act) {
            if (prev.parent && prev.parent.name === 'repeat') {
                const rep = m.repeatStack[m.repeatStack.length - 1];
                rep.ite++;
                if (rep.ite < rep.end) { m.act = rep.act; break; }
                m.repeatStack.pop();
            }
            m.act = prev.parent;
            if (!m.act) break;
            prev = m.act;
            if (isRefTarget(prev)) {
                const top = m.refStack.pop();
                prev = m.act = top.node;
                m.params = top.params;
            }
            m.act = next(m.act);
        }
    }
}

function runImpl(m, host) {
    if (m.end) return;
    changes(m, host);
    m.endTurn = host.getTurn();
    if (!m.act) {
        if (!isTurnEnd(m) && !m.changeDir && !m.changeSpeed && !m.accelX && !m.accelY) m.end = true;
        return;
    }
    m.act = m.nodes[m.actIte];
    if (m.actTurn === -1) m.actTurn = host.getTurn();
    runSub(m, host);
    if (!m.act) {
        m.actIte++;
        if (m.nodes.length !== m.actIte) m.act = m.nodes[m.actIte];
    } else {
        m.nodes[m.actIte] = m.act;
    }
}
