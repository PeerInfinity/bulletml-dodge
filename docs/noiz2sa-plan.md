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
| **G4** | The bot: survival first (the look-ahead planner), then positioning and shooting, then stars; a no-attack variant. | Runs a stage end to end; reports cleared / lives lost / score / look-ahead. |
| **G5** | Cloud sweep: every stage × bot variant × seeds. | `results/` tables, as for the pattern sweep. |
| later | The original look: the 8-bit palette, blur trails, line-drawn letters. | — |

The single-pattern harness (`src/noiz2sa.js`, `bin/run-pattern.mjs`) stays as it is, so the first sweep
stays reproducible.
