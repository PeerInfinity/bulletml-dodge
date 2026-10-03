# Plan: the whole of Noiz2sa, and a bot that plays it

Started 2026-10-03. Rulings by the user (verbatim where quoted):

- Bot priorities: *"First dodging bullets, then attacking enemies, then scoring points. Survival is the
  first priority. We could ignore points entirely in the first version. We could also see if the bot
  can survive without attacking any enemies."*
- Visuals: simple first (canvas shapes in the game's colours), the original look as a later slice.
- Fidelity: compare the port frame by frame against a native build of Noiz2sa.
- Players: both humans (keyboard, as in the original) and the bot, plus replays.
- Metrics: track all of — stages cleared and lives lost, score, and the look-ahead the bot needs.

## What the game is (measured from the 0.52 source, ~3,600 lines of C)

- **Stages.** 10 stages + 4 endless modes, each chosen on the title screen and played alone; stage clear
  and game over both return to the title. `stagePrm` gives each stage a seed, a start level and a level
  increment. A stage is scenes 0–7 of 1000 frames each (scene 3 is a "middle" scene), then the boss scene.
- **The boss has no timeout.** The boss scene sets its timer to 999,999 frames; the stage ends only when
  the boss (shield 128) dies. Escort zako stop after 1,500 frames. A bot that never shoots cannot clear
  a stage, so the survive-without-attacking run needs our own cap, reported apart from "cleared".
- **Stage generation** uses the game's own LCG (`rand.c`: ×8513 + 179) — deterministic per stage —
  over the pattern lists in `zako/`, `middle/`, `boss/`. ⚠ The C reads those directories with
  `readdir`, whose order depends on the filesystem; we fix it (sorted by name) here AND in the native build.
- **`$rand` is C's `rand()`**, shared with the explosion fragments (`frag.c`), which draw from it when
  enemies are hit or die and when the ship dies. A faithful port must make those calls in the same order
  (the fragment pool's occupancy decides whether a call happens), and emulate glibc's `rand()` for the
  native comparison. The game seeds it with `srand(SDL_GetTicks())`; we take the seed as an input.
- **Shots.** Fire every 4 frames (`SHOT_INTERVAL` 3), 16 px/frame upward, at most 16 on screen.
- **Enemies** take hits to a shield (zako 3, middle 6, big 9, boss 128). A kill scores 500 / 1,000 /
  5,000 / 50,000 and turns every bullet near it into a green star (`wipeBullets`).
- **Stars** fall, bounce at the bottom, rise; the ship inhales them nearby. Each pickup scores the
  current chain value (10, +10 per pickup, max 1,000); a star lost off the top halves the chain.
- **Lives.** Start with 3 (`left` 2). Extra ships at 200,000 and every 500,000 after. A hit during
  invincibility is ignored; invincibility after a death is 240 × (100 − scene) / 100 frames. A death
  clears the zako bullets. Clearing a stage adds 100,000 per ship left.
- **Wall-clock slow-down** with many bullets changes only real time, not per-frame motion — the port
  steps frames and ignores it.

## Slices

| Slice | What | Done when |
|---|---|---|
| **G1** | The game logic, headless (`src/game/`): ship, shots, foes, stars, fragments' rand calls, stage generation, scoring, lives; driven by an input tape `{dir, fire, slow}` per frame; a state hash per frame. | A tape plays a stage from start to clear or game over; replay is bit-identical. |
| **G2** | Fidelity: native Noiz2sa (ledyba's SDL2 port, BSD) patched for a fixed `srand` seed, sorted pattern order, tape input and a per-frame state dump; compare with G1. | Identical dumps on recorded tapes for several stages, or every difference explained. |
| **G3** | The browser front end: stage select, keyboard play, simple drawing, the game's sounds, a bot toggle, tape replay. | A human can play every stage; the bot can be switched on. |
| **G4** | The bot: survival first (the look-ahead planner), then positioning and shooting, then stars; a no-attack variant. Includes the sweep (every stage × variant × seeds × budgets). | Runs a stage end to end; reports cleared / lives lost / score / look-ahead. |
| **G5** | Cloud sweep: every stage × bot variant × seeds. | `results/` tables, as for the pattern sweep. |
| later | The original look: the 8-bit palette, blur trails, line-drawn letters. | — |

The single-pattern harness (`src/noiz2sa.js`, `bin/run-pattern.mjs`) stays as it is, so the first sweep
stays reproducible.

## Status

- **G1 DONE 2026-10-03** (`4a6d4ec`). `npm test`: a mid-game copy continues identically; stepping a copy
  leaves the original untouched; an invincible test chaser clears stage 1 (boss kill → stage clear → title).
  Speed: a whole stage in ~0.3 s of CPU. Test policies in `bin/play-game.mjs` (`chase`, `random`,
  `fire-stay`) are smoke tests, not the bot.

- **G2 DONE 2026-10-03** (report: `docs/g2-report.md`). The headless native 0.52 build is in `native/`.
  `bin/compare-native.mjs` compares it with the port on 137 tapes (all stages and modes; one full-stage
  clear per stage 1–10, no deaths).
  - Against a diagnostic build that pins the over-read below to the port's wrap: **137/137 identical
    frame for frame**.
  - Against the reference build: 72 identical, and the other 65 each differ first at exactly the frame
    of their first `sctbl` over-read (risk 2, undefined behaviour, recorded).
  - Three port bugs were fixed: a reused slot's stale `mv` gives a wiped bullet's star its
    velocity; vanish-then-fire slot reuse (risk 1); libBulletML `isEnd()` = ANY action ended.
    ⚠ The single-pattern harness keeps the old behaviour on all three (sweep reproducibility); a
    re-run is the user's call.
  - Risks 3–5 were checked and show no difference.

- **G3 DONE 2026-10-03** (report: `docs/g3-report.md`). `play.html`: stage select (1–10 + 4 endless modes),
  keyboard play as in the original, simple canvas drawing, the game's sounds and music (vendored, BSD), a bot
  toggle (the test policies, now `src/game/policies.js`), tape replay and recording (the play-game format + `seed`).
  `npm run test:browser`: page = Node on 6 tapes (2 full clears, the 30,000-frame ENDLESS); keyboard, bot, pause,
  Esc and the recorded tape round-trip in page and Node. Smoke tapes re-record 126/126; wrap 137/137.
  ⚠ The committed s01-lookahead tape's recipe is unrecorded (HEAD re-records 10,506 frames, not 10,494).
  ⚠ `lookahead` ≈ 17 ms CPU per frame: 49–63 fps in the page in stage 1, slower in busy scenes — G4 needs a budget.

- **G4 DONE 2026-10-03** (report: `docs/g4-report.md`, tables: `results/g4-bot.md`). `src/game/bot.js`: an exact
  look-ahead bot (a committed plan extended one frame per frame, repaired from snapshots when it runs into a hit,
  improved with spare budget), variants `attack` and `no-attack`; the budget is a count (1 + live/52 units per simulated
  frame; 1× = 600 ≈ 3 ms in Chromium), so runs are reproducible. In `play.html` it runs in a Web Worker: 62.5 frames/s in
  stage 10's busiest stretch, input for input what Node plays. Sweep (`bin/bot-sweep.mjs`, 218 min on 4 cores):
  **252 runs, 0 lives lost** — attack clears 90/90 stage runs, no-attack lives 3 minutes into the boss on 90/90, every
  endless run reaches 30,000 frames (scene 29–30). **Look-ahead needed: 1 frame** on all 60 (stage × variant × seed);
  0 frames loses 3–7 lives. 4×/16× budgets change no outcome, +4% score (stages) / +18% (endless). Tapes: `tapes/g4/`.
  ⚠ The look-ahead knows the future `$rand` draws (copies the seeded game) — "never dies" is about determinism, not foresight.
  ⚖ For the coordinator: the browser budget (kept 1×), the page's default policy (now "bot: attack"), a bot without
  future knowledge as the next measurement.

- **P1 DONE 2026-10-03, branch `perf-p1`** (report: `docs/p1-report.md`). The page's lag with the bot on: the bot's
  `improve` spends ~half its bank every 8th frame (4,300–5,000 units, 18–100 ms here), and on a ~5× slower worker the
  mean passes 16 ms, so the page waits. Fixes that change no move (137/137 native-identical, 12 G4 tapes re-recorded
  byte for byte, page = Node): a 1.3–1.4× faster engine per budget unit, the worker no longer idling between slices
  (setTimeout clamp), LEAD 60 → 180, panels redrawn on change. Worker 5× slowed: waits per 40 s 234 → 52 (stage 10),
  497 → 22 (ENDLESS), all left in the first ~2 s. Overlay: key F. `costCap` (off by default): 0 lives lost on 32 runs,
  −2…−30% attack score. Wasm build of the native engine (`native/wasm/`): every frame of 149 tapes equal, ~1.8× per
  step, snapshot/restore 18–19 µs; bot estimate ~1.6×. ⚖ Recommended: neither wasm nor a data-layout rewrite now; a
  start-up hold for the remaining waits.

### Where G2 may find differences (known places the port is not literally the C)

*(As written before G2. The outcome of each is in the G2 bullet above and in `docs/g2-report.md`.)*

1. **`<vanish>` then a new bullet in the same frame.** The C frees the vanishing foe's slot *during* its
   run, so a bullet fired later in that run can take the slot (and the C then moves it in the same
   iteration). The port frees the slot after the run.
2. **`sctbl[d]` with an unmasked `d`.** After a `changeDirection` the C can index past the table
   (undefined behaviour — it reads whatever follows); the port wraps `d`.
3. **Float evaluation.** The port assumes SSE single precision (x86-64 gcc). The 2003 Windows binary
   likely used x87 extended precision, so it is not the reference — the native Linux build is.
4. **Formula operand order.** libBulletML leaves `a + b` evaluation order to the compiler; it matters only
   with two `$rand`s in one formula, and no Noiz2sa pattern has one.
5. **Pattern order.** Sorted by file name in both; the original `readdir` order is filesystem-dependent.

- ⚖ **The user, 2026-10-03:** *"I want a pages deploy when this is finished. I don't think we need to rerun the
  sweep."* The first pattern sweep stays as it is (its harness keeps the pre-G2 semantics). G3 is deployed to
  GitHub Pages from `main` (root): https://peerinfinity.github.io/bulletml-dodge/play.html
