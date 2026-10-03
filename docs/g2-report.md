# G2 report — the JS port of Noiz2sa against a native build, frame by frame

Slice G2 of `docs/noiz2sa-plan.md`, 2026-10-03.

## Verdict

**The port matches the native build frame for frame on every tape, except where the C's behaviour is
undefined.** That is 137 tapes and 455,916 frames, covering all 10 stages and all 4 endless modes:

- **Wrap variant: 137/137 identical.** This is the native build with the one undefined behaviour
  pinned to the port's choice. It includes 10 tapes (one per stage) that play to the boss kill, the
  stage clear and the return to the title with no deaths, and a 30,000-frame ENDLESS tape with 2
  boss kills.
- **Reference build: 72/137 identical to the end.** The other 65 all differ first at **exactly** the
  frame of their first `sctbl` over-read, which the native build reports itself. That is a C
  undefined behaviour (plan risk 2, below), and **no difference is unexplained**.
- **Three real port bugs were found and fixed** (below). `npm test` stays green.

The over-read is not a corner case. Every long tape hits it: each full-stage tape within 400–7,300
frames. So **no full stage can be verified against the reference build alone.** Past the first
over-read, what the native game does depends on the memory that happens to follow `sctbl` in that
particular binary.

## What was built

- **`native/`**: a headless native Noiz2sa 0.52 (`native/build.sh` → `native/build/noiz2sa-headless`),
  described in `native/README.md`.
  - The game logic is the official 0.52 source, unchanged apart from the marked patches in
    `native/PATCHES.diff`: sorted pattern order, `srand(seed)` in `initGame`, the endless seed from
    the command line, a headless driver in place of the SDL loop, read-only accessors for the state
    line, and an over-read report.
  - libBulletML 0.0.6 is **byte-identical** to the official archive. ledyba's SDL2 port turned out
    to carry 0.0.6 plus two `#include`s, and `-include cstring -include cstdlib` does the same job,
    so nothing was taken from that port.
  - Drawing, sound and SDL are stubs (`native/stubs/`).
  - x86-64 gcc 13.3, `-O2 -ffp-contract=off`. `objdump` shows no x87 and no FMA instructions.
- **A diagnostic variant**, `native/build/noiz2sa-headless-wrap`. It is the same build with one
  undefined behaviour (below) pinned to the port's choice, so that a comparison can see past it. It
  is never the reference.
- **`bin/compare-native.mjs`** (`npm run compare-native`). For each tape it plays the port and the
  native build and compares the state lines (`stateLine()` in `src/game/noiz2sa-game.js`, byte for
  byte). It reports the first differing frame and its fields, and marks a difference as explained
  when it follows an `sctbl` over-read that the native build reported. Without a native build it
  prints "skipped" and exits 0. It is **not** part of `npm test`: the full tape set takes about 30 s
  and needs the build.
- **`bin/diff-frame.mjs`**: every foe, bonus and shot on both sides at frames N−1 and N, as a
  unified diff. Every cause below was found with it.
- **A `lookahead` test policy** in `bin/play-game.mjs`. It is not the G4 bot. Every 4 frames it
  tries 18 inputs (9 directions × normal/slow) for 40 frames on a copy of the game, then keeps the
  safest input nearest the lowest enemy. `--la-safe N` sets how many survived frames count as safe.
  It exists to record tapes that reach a boss kill.

## Checks besides the tapes

- **Trig tables.** The native `sctbl` (all 1,280 entries) and every `tantbl` entry (probed through
  `getDeg`) are identical to the port's. The port computes them with V8's `Math.sin`/`cos`, the
  native build with glibc's.
- **Risk 4 (operand order).** No formula in the 73 patterns contains two `$rand`s, so the evaluation
  order cannot show.
- **Risk 5 (pattern order).** Both sides sort by name (strcmp). It is a patch on the native side,
  so this agreement is by construction.
- **Sensitivity.** The comparison detected each of the three port bugs below on real tapes before
  they were fixed, and each fix removed exactly its class of difference.

## Differences found

### Fixed in the port (`e2fa320`)

1. **A stale `mv` in a reused foe slot.** The C never resets a slot's `mv` when it reuses the slot.
   If a bullet created this frame is wiped (an enemy dies near it) before it first moves, its star
   gets the previous occupant's last velocity. The port gave it 0.
   - *Seen:* on the first run, 48 of the 126 smoke tapes differed first in the bonus hash (`B=`),
     e.g. `s01-random-seed2` frame 693. After this fix no `B=` difference was left.
   - *Fix:* the game keeps each slot's last `mv` (`slotMv`), and a new occupant inherits it
     (`placeFoe`).
2. **`<vanish>` then a new bullet in the same run (plan risk 1).** `removeFoe` only marks the slot
   free. A bullet fired later in the same `run()` takes that very slot. The still-running command
   then reads and writes the new occupant through its `Foe *`, and `moveFoes` moves the new
   occupant in the same iteration.
   - *Seen:* a bullet in slot 0 instead of slot 10 (`s08-chase-seed3` frame 1391,
     `s08-random-seed1`, `s09-chase-seed3`).
   - *Fix:* the BulletML host addresses the slot (`g.foes[slot]`, or the vanished foe until the
     slot is reused), `doVanish` frees the slot at once, and `moveFoes` continues with whatever now
     occupies the slot.
3. **libBulletML's `isEnd()` is "ANY top action ended", not "all".** In `bulletmlrunner.cpp` the
   all-version is commented out. Noiz2sa restarts a boss runner (the boss and its boss-active
   bullets) on `isEnd()`, so a two-action pattern restarts as soon as its first action ends.
   - *Seen:* 4 extra bullets from `[daiouzyou]_r1_boss_5.xml` at ENDLESS frame 29,452.
   - *Fix:* a new `runnerIsEndLib` (`some`) in `src/bulletml.js`, used by the game.
   - ⚠ **The single-pattern harness (`src/noiz2sa.js`, `bin/run-pattern.mjs`) still uses the old
     `runnerIsEnd` (`every`).** It was left unchanged so the first sweep stays reproducible. So that
     sweep restarted two-action boss patterns later than the real game does, and it shares bugs 1
     and 2 as well. **Whether to re-run the sweep with these semantics is a decision for the user.**

### Undefined behaviour in the C, recorded and not fixed (plan risk 2)

`moveFoes` reads `sctbl[fe->d]` and `sctbl[fe->d+256]` with an unmasked `d`. `sctbl` has 1,280 entries.
`doChangeDirection` stores `(int)(d*1024/360)`, and libBulletML's `changeDirection` interpolates from
the current direction by the shorter way round, so `d` can leave `[0, 1024)`, e.g. −15 or 1031:

- For **`d` in [1024, 1280)** the sine read is in range, but the cosine (`d+256`) reads past the
  end. This was the first over-read on 39 of the 65 tapes.
- For a **negative `d`**, both reads are before the start. This was the first over-read on 26 of
  the 65.

In this build `tantbl` follows `sctbl` (`nm`), so the over-read cosine is a small angle number, not a
cosine. Before `sctbl` sit libBulletML's formula statics. The 2003 Windows binary had some other
layout, so no build is "the" behaviour here. The port wraps `d` (the evident intent). The reference
build reports each over-read (`NOIZ_UB=1` → `ub f= slot= d=`), and the comparison attributes a
difference to it when the over-read is at or before the first differing frame. Every one of the 65
first differences is at exactly that frame.

### Checked and not different

Risks 3–5 (float evaluation, `$rand` operand order, pattern order): see "Checks besides the tapes".
The port's float32 arithmetic agrees with SSE on every tape.

## The tapes (`tapes/`, 137)

- **126 smoke-policy tapes:** `chase`, `random` and `fire-stay` × stages 1–10 and the 4 endless
  modes × seeds 1–3. Endless seed = 7919 × seed. Most end in game over → title.
- **11 `lookahead` tapes**, seed 1:
  - **stages 1–10: each reaches the boss kill → stage clear → title, with no deaths.** These are
    the stage-clear tapes the brief asked for.
  - **ENDLESS** (`s11-lookahead-seed1`): 30,000 frames, 2 boss kills, no deaths. It was recorded
    before fix 3 with the 9-direction version of the policy. The inputs are still a valid tape.
    Replayed by today's port it still survives with 2 boss kills, and it matches the wrap variant.
  - **HARD, EXTREME, INSANE:** the look-ahead runs were **stopped by the user's decision** to save
    local CPU (each would have taken ~30 min). These modes are covered only by the smoke-policy
    tapes (1,021–5,024 frames each).

Result per tape (`results/g2/compare-reference.json`, `results/g2/compare-wrap.json`; the console
output is in the `.txt` files beside them):

| Tape | Stage | Frames | End | Reference build | Wrap variant |
|---|---|---:|---|---|---|
| s01-chase-seed1 | 1 | 9272 | game over → title | identical | identical |
| s01-chase-seed2 | 1 | 5674 | game over → title | identical | identical |
| s01-chase-seed3 | 1 | 5658 | game over → title | identical | identical |
| s01-fire-stay-seed1 | 1 | 1639 | game over → title | identical | identical |
| s01-fire-stay-seed2 | 1 | 1639 | game over → title | identical | identical |
| s01-fire-stay-seed3 | 1 | 1647 | game over → title | identical | identical |
| s01-lookahead-seed1 | 1 | 10494 | stage clear → title | over-read at f6481 (d=-15), first diff f6481 (F) | identical |
| s01-random-seed1 | 1 | 4725 | game over → title | identical | identical |
| s01-random-seed2 | 1 | 3550 | game over → title | identical | identical |
| s01-random-seed3 | 1 | 4725 | game over → title | identical | identical |
| s02-chase-seed1 | 2 | 10016 | game over → title | over-read at f7231 (d=1026), first diff f7231 (F) | identical |
| s02-chase-seed2 | 2 | 8184 | game over → title | over-read at f7273 (d=-2), first diff f7279 (F) | identical |
| s02-chase-seed3 | 2 | 8232 | game over → title | identical | identical |
| s02-fire-stay-seed1 | 2 | 1798 | game over → title | identical | identical |
| s02-fire-stay-seed2 | 2 | 1818 | game over → title | identical | identical |
| s02-fire-stay-seed3 | 2 | 1807 | game over → title | identical | identical |
| s02-lookahead-seed1 | 2 | 10582 | stage clear → title | over-read at f7236 (d=-5), first diff f7236 (nf,F) | identical |
| s02-random-seed1 | 2 | 1046 | game over → title | identical | identical |
| s02-random-seed2 | 2 | 1046 | game over → title | identical | identical |
| s02-random-seed3 | 2 | 1046 | game over → title | identical | identical |
| s03-chase-seed1 | 3 | 10235 | game over → title | over-read at f3145 (d=1041), first diff f3145 (F) | identical |
| s03-chase-seed2 | 3 | 6524 | game over → title | identical | identical |
| s03-chase-seed3 | 3 | 6524 | game over → title | identical | identical |
| s03-fire-stay-seed1 | 3 | 1652 | game over → title | identical | identical |
| s03-fire-stay-seed2 | 3 | 1898 | game over → title | identical | identical |
| s03-fire-stay-seed3 | 3 | 1652 | game over → title | identical | identical |
| s03-lookahead-seed1 | 3 | 10633 | stage clear → title | over-read at f3141 (d=1031), first diff f3141 (F) | identical |
| s03-random-seed1 | 3 | 2012 | game over → title | identical | identical |
| s03-random-seed2 | 3 | 1501 | game over → title | identical | identical |
| s03-random-seed3 | 3 | 1774 | game over → title | identical | identical |
| s04-chase-seed1 | 4 | 2715 | game over → title | over-read at f1634 (d=1055), first diff f1634 (F) | identical |
| s04-chase-seed2 | 4 | 3872 | game over → title | over-read at f1420 (d=-16), first diff f1420 (F) | identical |
| s04-chase-seed3 | 4 | 2420 | game over → title | over-read at f1281 (d=1054), first diff f1281 (F) | identical |
| s04-fire-stay-seed1 | 4 | 2268 | game over → title | over-read at f1205 (d=1044), first diff f1205 (F) | identical |
| s04-fire-stay-seed2 | 4 | 2278 | game over → title | over-read at f1124 (d=1058), first diff f1124 (F) | identical |
| s04-fire-stay-seed3 | 4 | 2293 | game over → title | over-read at f1209 (d=1044), first diff f1209 (F) | identical |
| s04-lookahead-seed1 | 4 | 10594 | stage clear → title | over-read at f1177 (d=-45), first diff f1177 (F) | identical |
| s04-random-seed1 | 4 | 1748 | game over → title | over-read at f1251 (d=1031), first diff f1251 (F) | identical |
| s04-random-seed2 | 4 | 1748 | game over → title | over-read at f1182 (d=-28), first diff f1182 (nf,F) | identical |
| s04-random-seed3 | 4 | 1748 | game over → title | over-read at f1177 (d=1050), first diff f1177 (F) | identical |
| s05-chase-seed1 | 5 | 2593 | game over → title | identical | identical |
| s05-chase-seed2 | 5 | 5787 | game over → title | over-read at f3863 (d=1028), first diff f3863 (F) | identical |
| s05-chase-seed3 | 5 | 5030 | game over → title | identical | identical |
| s05-fire-stay-seed1 | 5 | 1653 | game over → title | identical | identical |
| s05-fire-stay-seed2 | 5 | 1653 | game over → title | identical | identical |
| s05-fire-stay-seed3 | 5 | 1653 | game over → title | identical | identical |
| s05-lookahead-seed1 | 5 | 10610 | stage clear → title | over-read at f3201 (d=1026), first diff f3201 (F) | identical |
| s05-random-seed1 | 5 | 1570 | game over → title | identical | identical |
| s05-random-seed2 | 5 | 1817 | game over → title | identical | identical |
| s05-random-seed3 | 5 | 1964 | game over → title | identical | identical |
| s06-chase-seed1 | 6 | 1804 | game over → title | over-read at f505 (d=-16), first diff f505 (F) | identical |
| s06-chase-seed2 | 6 | 2308 | game over → title | over-read at f672 (d=-15), first diff f672 (F) | identical |
| s06-chase-seed3 | 6 | 1866 | game over → title | over-read at f184 (d=1056), first diff f184 (F) | identical |
| s06-fire-stay-seed1 | 6 | 1648 | game over → title | over-read at f110 (d=-29), first diff f110 (F) | identical |
| s06-fire-stay-seed2 | 6 | 1648 | game over → title | over-read at f176 (d=1027), first diff f176 (F) | identical |
| s06-fire-stay-seed3 | 6 | 1633 | game over → title | over-read at f640 (d=-9), first diff f640 (nf,F) | identical |
| s06-lookahead-seed1 | 6 | 10653 | stage clear → title | over-read at f399 (d=-10), first diff f399 (nf,F) | identical |
| s06-random-seed1 | 6 | 1085 | game over → title | over-read at f111 (d=-29), first diff f111 (F) | identical |
| s06-random-seed2 | 6 | 1345 | game over → title | over-read at f162 (d=1029), first diff f162 (F) | identical |
| s06-random-seed3 | 6 | 1345 | game over → title | over-read at f155 (d=1029), first diff f155 (F) | identical |
| s07-chase-seed1 | 7 | 3096 | game over → title | over-read at f2096 (d=1035), first diff f2096 (F) | identical |
| s07-chase-seed2 | 7 | 5690 | game over → title | over-read at f2133 (d=1034), first diff f2133 (F) | identical |
| s07-chase-seed3 | 7 | 2275 | game over → title | over-read at f2135 (d=-32), first diff f2135 (nf,F) | identical |
| s07-fire-stay-seed1 | 7 | 2314 | game over → title | over-read at f2221 (d=-39), first diff f2221 (nf,F) | identical |
| s07-fire-stay-seed2 | 7 | 2140 | game over → title | identical | identical |
| s07-fire-stay-seed3 | 7 | 2322 | game over → title | over-read at f2179 (d=1031), first diff f2179 (F) | identical |
| s07-lookahead-seed1 | 7 | 10662 | stage clear → title | over-read at f2063 (d=1073), first diff f2063 (F) | identical |
| s07-random-seed1 | 7 | 1678 | game over → title | identical | identical |
| s07-random-seed2 | 7 | 1648 | game over → title | identical | identical |
| s07-random-seed3 | 7 | 1752 | game over → title | identical | identical |
| s08-chase-seed1 | 8 | 2432 | game over → title | over-read at f1361 (d=-20), first diff f1361 (F) | identical |
| s08-chase-seed2 | 8 | 4682 | game over → title | over-read at f1749 (d=-20), first diff f1749 (F) | identical |
| s08-chase-seed3 | 8 | 2128 | game over → title | over-read at f1107 (d=1028), first diff f1107 (F) | identical |
| s08-fire-stay-seed1 | 8 | 1638 | game over → title | over-read at f1239 (d=-35), first diff f1239 (F) | identical |
| s08-fire-stay-seed2 | 8 | 1631 | game over → title | over-read at f1114 (d=1042), first diff f1114 (F) | identical |
| s08-fire-stay-seed3 | 8 | 1626 | game over → title | over-read at f1206 (d=-40), first diff f1206 (nf,F) | identical |
| s08-lookahead-seed1 | 8 | 10529 | stage clear → title | over-read at f1313 (d=-25), first diff f1313 (F) | identical |
| s08-random-seed1 | 8 | 1597 | game over → title | over-read at f1144 (d=1033), first diff f1144 (F) | identical |
| s08-random-seed2 | 8 | 1594 | game over → title | over-read at f1220 (d=1024), first diff f1220 (F) | identical |
| s08-random-seed3 | 8 | 1071 | game over → title | identical | identical |
| s09-chase-seed1 | 9 | 2203 | game over → title | over-read at f1278 (d=1032), first diff f1278 (F) | identical |
| s09-chase-seed2 | 9 | 1804 | game over → title | over-read at f1121 (d=-26), first diff f1121 (F) | identical |
| s09-chase-seed3 | 9 | 2101 | game over → title | over-read at f1288 (d=1052), first diff f1288 (F) | identical |
| s09-fire-stay-seed1 | 9 | 1734 | game over → title | over-read at f1108 (d=-22), first diff f1108 (F) | identical |
| s09-fire-stay-seed2 | 9 | 1707 | game over → title | over-read at f1070 (d=1027), first diff f1070 (F) | identical |
| s09-fire-stay-seed3 | 9 | 1832 | game over → title | over-read at f1147 (d=-48), first diff f1147 (nf,F) | identical |
| s09-lookahead-seed1 | 9 | 10506 | stage clear → title | over-read at f1234 (d=-8), first diff f1234 (nf,F) | identical |
| s09-random-seed1 | 9 | 1055 | game over → title | identical | identical |
| s09-random-seed2 | 9 | 1055 | game over → title | identical | identical |
| s09-random-seed3 | 9 | 1055 | game over → title | identical | identical |
| s10-chase-seed1 | 10 | 2117 | game over → title | identical | identical |
| s10-chase-seed2 | 10 | 2302 | game over → title | identical | identical |
| s10-chase-seed3 | 10 | 2176 | game over → title | identical | identical |
| s10-fire-stay-seed1 | 10 | 1634 | game over → title | identical | identical |
| s10-fire-stay-seed2 | 10 | 1679 | game over → title | identical | identical |
| s10-fire-stay-seed3 | 10 | 1650 | game over → title | identical | identical |
| s10-lookahead-seed1 | 10 | 10477 | stage clear → title | over-read at f3134 (d=-17), first diff f3134 (nf,F) | identical |
| s10-random-seed1 | 10 | 1655 | game over → title | identical | identical |
| s10-random-seed2 | 10 | 1655 | game over → title | identical | identical |
| s10-random-seed3 | 10 | 1056 | game over → title | identical | identical |
| s11-chase-seed1 | ENDLESS | 4251 | game over → title | over-read at f3091 (d=1024), first diff f3091 (F) | identical |
| s11-chase-seed2 | ENDLESS | 8712 | game over → title | over-read at f3519 (d=1026), first diff f3519 (F) | identical |
| s11-chase-seed3 | ENDLESS | 3871 | game over → title | over-read at f3613 (d=-4), first diff f3613 (F) | identical |
| s11-fire-stay-seed1 | ENDLESS | 1641 | game over → title | identical | identical |
| s11-fire-stay-seed2 | ENDLESS | 1779 | game over → title | identical | identical |
| s11-fire-stay-seed3 | ENDLESS | 1680 | game over → title | identical | identical |
| s11-lookahead-seed1 | ENDLESS | 30000 | in game (tape end) | over-read at f3122 (d=-1), first diff f3122 (F) | identical |
| s11-random-seed1 | ENDLESS | 1615 | game over → title | identical | identical |
| s11-random-seed2 | ENDLESS | 2016 | game over → title | identical | identical |
| s11-random-seed3 | ENDLESS | 2345 | game over → title | identical | identical |
| s12-chase-seed1 | HARD | 2530 | game over → title | identical | identical |
| s12-chase-seed2 | HARD | 5024 | game over → title | identical | identical |
| s12-chase-seed3 | HARD | 3376 | game over → title | identical | identical |
| s12-fire-stay-seed1 | HARD | 1629 | game over → title | over-read at f780 (d=1025), first diff f780 (F) | identical |
| s12-fire-stay-seed2 | HARD | 1779 | game over → title | identical | identical |
| s12-fire-stay-seed3 | HARD | 1666 | game over → title | identical | identical |
| s12-random-seed1 | HARD | 1348 | game over → title | over-read at f780 (d=1025), first diff f780 (F) | identical |
| s12-random-seed2 | HARD | 1849 | game over → title | identical | identical |
| s12-random-seed3 | HARD | 1934 | game over → title | identical | identical |
| s13-chase-seed1 | EXTREME | 3129 | game over → title | over-read at f362 (d=1025), first diff f362 (F) | identical |
| s13-chase-seed2 | EXTREME | 2166 | game over → title | identical | identical |
| s13-chase-seed3 | EXTREME | 1879 | game over → title | identical | identical |
| s13-fire-stay-seed1 | EXTREME | 1629 | game over → title | over-read at f468 (d=1025), first diff f468 (F) | identical |
| s13-fire-stay-seed2 | EXTREME | 1665 | game over → title | identical | identical |
| s13-fire-stay-seed3 | EXTREME | 1630 | game over → title | identical | identical |
| s13-random-seed1 | EXTREME | 1078 | game over → title | over-read at f362 (d=1025), first diff f362 (F) | identical |
| s13-random-seed2 | EXTREME | 2266 | game over → title | over-read at f2169 (d=1027), first diff f2169 (F) | identical |
| s13-random-seed3 | EXTREME | 1021 | game over → title | identical | identical |
| s14-chase-seed1 | INSANE | 2764 | game over → title | over-read at f362 (d=1025), first diff f362 (F) | identical |
| s14-chase-seed2 | INSANE | 2166 | game over → title | identical | identical |
| s14-chase-seed3 | INSANE | 1879 | game over → title | identical | identical |
| s14-fire-stay-seed1 | INSANE | 1629 | game over → title | over-read at f468 (d=1025), first diff f468 (F) | identical |
| s14-fire-stay-seed2 | INSANE | 1665 | game over → title | identical | identical |
| s14-fire-stay-seed3 | INSANE | 1630 | game over → title | identical | identical |
| s14-random-seed1 | INSANE | 1078 | game over → title | over-read at f362 (d=1025), first diff f362 (F) | identical |
| s14-random-seed2 | INSANE | 2266 | game over → title | over-read at f2127 (d=1028), first diff f2127 (F) | identical |
| s14-random-seed3 | INSANE | 1021 | game over → title | identical | identical |

## What remains unverified

- **Anything after an over-read, against the reference.** This is unverifiable by nature (undefined
  behaviour). The wrap variant shows that everything else stays identical past it.
- **HARD, EXTREME and INSANE beyond the smoke tapes**: no long tape. INSANE's special case (no
  `clearFoes` at a scene change) and the endless boss restart are exercised only in the shorter
  runs.
- **Seeds:** the full-stage tapes use seed 1 only.
- **The title screen, pause and the high-score file** are outside the port by design. So is the
  wall-clock slow-down, which only changes real time.
- **The original 2003 Windows binary** (x87, MSVC/MinGW layout) is not the reference. Its
  over-reads and float rounding may differ.
- **Speed:** the full comparison takes about 2 minutes with both builds, so it is not part of
  `npm test`. It skips cleanly without a native build.

## Handshake / report back

No handshake message reached this session (`bulletml-g2`): `ReadNotifications` was empty at the start,
during and at the end of the slice, and no cross-session message arrived. The coordinator's memory
names `archipelago-cc-94` as the sender. A reply was attempted there after this report was pushed; the
result is recorded in the memory file `project_bulletml_dodge.md`. This report file is the report back.

