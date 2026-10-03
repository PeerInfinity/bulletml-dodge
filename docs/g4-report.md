# G4 report — a bot that plays Noiz2sa

Slice G4 of `docs/noiz2sa-plan.md`, 2026-10-03. Tables: `results/g4-bot.md` (data: `results/g4-bot.json`).

## Verdict

**The bot plays every stage and mode without losing a life: 252 runs (not counting the look-ahead ladder), 0 lives lost.**

| Variant | Stages 1–10 (× 3 seeds × 3 budgets) | Endless modes (30,000 frames) | Lives lost |
|---|---|---|---:|
| attack | **90/90 cleared**, boss killed ~9,500–10,800 frames in | 36/36 reach the cap at scene 29–30 (2–3 boss kills) | 0 |
| no-attack | **90/90 alive 3 minutes into the boss scene** (20,260 frames) | 36/36 alive 3 minutes into the first boss scene | 0 |

- **The look-ahead needed is 1 frame.** With 1 frame of exact simulation the bot clears stages 1–10 (attack) and survives
  the boss for 3 minutes (no-attack) on every stage and seed with no life lost. With 0 frames (no simulation) it loses
  3–7 lives everywhere.
- **The budget barely matters.** 4× and 16× the browser budget change no outcome. The attack score rises by ~3–4% on
  stages 1–10 and ~18% on the endless modes.
- **In the page:** the bot thinks in a Web Worker within the browser budget. The game keeps **62.5 frames/s** in stage
  10's busiest stretch (~400 live objects), with no waits. It plays input for input what the headless bot plays.

⚠ Read "never dies" with the caveat the pattern harness already had: the look-ahead copies the seeded game, so it knows
the patterns' future `$rand` draws and every aimed shot before it is fired. The horizon answers "is there a path", not
"could a player see it coming".

## What the bot does (`src/game/bot.js`)

The engine is deterministic and the bot's input is the game's only input. So a plan simulated on a copy of the game
(`cloneGame` + `stepGame`, the engine itself) happens exactly as simulated, and a verified plan never needs checking
again. The bot keeps one **committed plan** of `horizon` frames (default 48):

1. **Extend.** Every frame it plays the plan's first input and adds one frame at the far end, chosen by a cheap
   **tail controller**. That costs one simulated frame per game frame.
   - Default tail, `straight`: head for the target. For attack, the target is the x of the lowest enemy above the
     ship (the boss only once nothing lower is left), at the home height (4/5 down the screen). For no-attack it is
     home. The straight tail ignores bullets; all dodging is the exact search.
   - `tail: 'reflex'` also steers off bullets, using their straight-line motion.
2. **Repair.** When an extension runs into a hit (an effective `hit` event; hits during invincibility are no-ops in
   the engine, so they cost nothing), it searches for a fix. Branch points are the plan's snapshots (one every 4
   frames), latest first, back to the present. At each it tries the 18 inputs (9 directions × normal/slow), held to
   the end or held 8 frames then the tail. The latest branch point with a survivor wins, best value first.
   - If nothing survives: a beam search from the present (8-frame chunks, width 6).
   - If that fails too: the plan whose first hit comes latest.
3. **Improve.** Every 8 frames, with the bank more than half full, it tries candidate sets from the present: the 18
   inputs held 8, H, 16, 4, 32, 2 or 24 frames, then the tail. It takes as many sets as the spare budget pays for,
   keeping half the bank for repairs. A candidate replaces the plan only if it is better, compared in this order
   (the user's priorities):
   - it survives longer (a later first hit);
   - more attack value (each hit on an enemy +1, each kill +4/8/12/16 by type);
   - ship position and room to the nearest bullet at the end.
   Stars have a weight hook (`starWeight`), 0 in v1. The attack variant always holds fire; no-attack never fires.

**The budget is a count.** Every simulated frame and every game copy costs `1 + live foe slots / 52` units. The 52 is
fitted from Node timings, so a unit is about the same CPU time in a quiet scene and a busy one. Each game frame adds
`budget` units to a bank capped at 32 frames' worth. Searches stop when the bank is empty. No clock is read, so a run
is reproducible: the sweep's tapes re-record byte for byte, and the page plays the headless bot's moves.

**Calibration.**
- 1 unit ≈ 11 µs in Node under the sweep's 4-way load. It is **5.2–5.5 µs in the page's worker** (headless Chromium,
  measured by `test:browser`).
- `BROWSER_BUDGET` = 600 units/frame ≈ 3 ms in Chromium (≈ 6.6 ms in Node), a fifth of the 16 ms frame. That leaves
  room for slower machines.
- The largest single-frame spend in the whole sweep at 1× was 10,206 units, about 53 ms in Chromium. The worker
  runs up to 60 frames (~1 s) ahead, so the page never noticed.

**The worker (`web/bot-worker.js`).** It plays its own copy of the game: same stage, seeds and inputs so far, then the
bot. It runs up to 60 frames ahead of the page and posts the inputs; the page plays them. If an input is late, the page
waits a frame rather than guess (counted; 0 in the measured busy window).
- A worker has neither the page's import map nor `DOMParser`. So the page parses the patterns and posts them packed:
  `packBulletML` drops the compiled formula functions, which `postMessage` cannot copy, and `unpackBulletML`
  recompiles them from the same text.
- `src/bulletml.js` now picks its XML parser at load: the browser's `DOMParser` if there is one, else
  `@xmldom/xmldom` (Node), else none (a worker). Behaviour is unchanged.

**In the page.** `play.html` adds "bot: attack" and "bot: no-attack" to the policy list (the default is now "bot:
attack") and look-ahead and budget selectors. The test policies are still there. A tape recorded with the bot carries
`bot: {variant, horizon, budget}`.

## The look-ahead needed (stages 1–10, budget 1×)

For each (stage, variant, seed, tail), the bot climbs the ladder H = 0, 1, 2, 4, 8, 16, 32, 48 until two horizons in a
row succeed. Success means cleared (attack) or alive 3 minutes into the boss scene (no-attack), with no life lost.

| Tail | Smallest H with no life lost | H = 0 (no simulation) |
|---|---|---|
| straight (the bot's own) | **1 on all 60 (stage × variant × seed)** | 3–7 lives lost everywhere; no-attack = game over |
| reflex | **0** on 17 of 60, **1** on the other 43 | the reflex alone survives stages 1, 2 and 4 (attack) |

- At H = 0 the straight-tail attacker still **clears** 1 of 30 (stage 2, seed 1, with 7 lives lost, thanks to extends).
- The reflex-tail attacker at H = 0 clears 29/30. Killing enemies wipes their bullets, which does a lot of the
  dodging.
- **Non-monotonic case:** stage 10, no-attack, seed 3, straight tail: H = 1 loses 0 lives, **H = 2 loses 2**, and
  H = 4 and 8 lose 0. A longer plan commits to more, and a repair limited to 18 held inputs from snapshots can miss
  an escape that a 1-frame replan finds.

So in Noiz2sa, a ship that may check every input one frame ahead exactly, and choose among 18, is never cornered on
these 60 runs. The hit test is a 2 px radius against each bullet's swept segment, and the ship moves 5 px a frame
(2.5 px slow).

## How the budget changes the results

| Variant | Budget | Cleared / alive (1–10) | Lives lost | Mean score, 1–10 | Mean score, endless | Mean cost/frame | CPU h |
|---|---|---:|---:|---:|---:|---:|---:|
| attack | 1× (600) | 30/30 | 0 | 3,640,571 | 13,297,531 | 576 | 0.79 |
| attack | 4× (2,400) | 30/30 | 0 | 3,764,968 | 15,733,284 | 1,545 | 2.33 |
| attack | 16× (9,600) | 30/30 | 0 | 3,789,566 | 15,509,218 | 1,857 | 3.08 |
| no-attack | 1× | 30/30 | 0 | — | — | 560 | 0.81 |
| no-attack | 4× | 30/30 | 0 | — | — | 2,094 | 2.87 |
| no-attack | 16× | 30/30 | 0 | — | — | 3,113 | 4.29 |

- 16× spends only ~1.2–1.5× what 4× does. The improve step tries at most 7 candidate sets, so spending saturates.
- On stages 1, 2, 3 and 5, 4× and 16× give identical runs.
- More budget buys score, never survival, because survival is already total at 1×.

## Per-stage tables

Each table has stages × budgets with the clear frame, lives lost per seed, score, kills by type, stars, frames and CPU;
they are in `results/g4-bot.md`. Some highlights at 1×:

- **Clear frames:** attack clears a stage in 9,548–10,422 frames (≈ 2.5–2.8 minutes; scenes 0–7 take 8,000).
- **Kills and stars:** a stage gives ~380–540 zako, 40–100 middle and 2–33 big kills. Stars collected are 1,900–4,700
  per stage, all from the wipes (stars have no weight in the plan).
- **Score:** 2.5–4.9 M per stage. The G2 `lookahead` tapes scored 1.7 M (stage 1) and 3.0 M (stage 10).
- **Endless (30,000 frames):** ENDLESS reaches scene 30 (3 boss kills); HARD, EXTREME and INSANE reach scene 29
  (2 boss kills). Scores are 8.6–16 M at 1× and up to 20 M at 16×.
- **No-attack** never scores (it never fires, and stars only come from kills). It survives the boss for 3 minutes on
  every stage and mode.

## What surprised me

- **One frame of exact look-ahead is enough.** The plan was built for 48-frame horizons with repairs and beam search.
  On the 252 main runs the beam search never ran, and no repair ever failed: 56,941 repairs, all successful.
- **The straight tail beats the reflex tail.** I expected the reflex tail to be the better default. In a comparison
  (stages 6, 8, 10, INSANE, seeds 1–2), straight scored as well or better, up to 15.3 M vs 11.5 M on INSANE. It was
  just as safe and used ~30% less CPU: dodging with a heuristic costs attack position, and the exact check does the
  dodging anyway.
- **Survival is free.** The budget's only effect is on score.

## What failed / is not done

- **The first worker attempt.** Chromium (141) applies neither import maps nor `DOMParser` in workers. That is why
  patterns are posted packed (above).
- **Two shell mistakes.** `pkill -f` matched my own shell twice (exit 144); nothing was lost. One stop-hook nuisance:
  the sweep writes tapes continuously, so `tapes/g4/` was excluded locally until the end.
- **Stars are a hook only** (`starWeight` 0). No run tried it.
- **The summary header's commit.** `results/g4-bot.md` names `64f2530` because the summary is written when the sweep
  ends. **The sweep ran at `8724da9`**; the commits between only touch the README, `.gitignore` and tapes, and the bot
  code is identical.
- **The ladder at budget 1× only**, and it climbs only until two horizons in a row succeed. So the H = 16–48 columns
  are empty ("·"); the main sweep covers H = 48.

## Rules kept

- **The engine is unchanged.** All 137 tapes in `tapes/` give identical per-frame state lines before (`e7f03c0`) and
  after: a hash of every frame's `stateLine` matches, 137/137. That includes the `lookahead` tapes.
- **`src/noiz2sa.js` and `bin/run-pattern.mjs` are untouched.** `src/bulletml.js` only changed how it finds its XML
  parser, plus the pack/unpack helpers.
- **`npm test` is green.** It adds `test/bot.test.mjs`: the same seed + budget gives the same tape twice, for both
  variants; a starved budget is reproducible; packed patterns replay state line for state line; a bot handed a game at
  another frame starts over.
- **`npm run test:browser` is green.** It adds the busy-scene check, from stage 10 frame 8,900 with ~400 live objects:
  - 62.5 frames/s, 0 waits;
  - worker 2.4–3.7 ms/frame mean, 72–82 ms max;
  - the page's 435 bot frames equal Node's, input for input;
  - a screenshot, `docs/g4-screens/bot-busy.png`.
- **Spot checks:** `s01-attack-seed1-b1x` and `s10-no-attack-seed3-b1x` re-record byte for byte and replay to their end.

## The sweep

- `node bin/bot-sweep.mjs --jobs 4` ran at commit `8724da9`: **218 minutes wall, 4 cores, 14.5 CPU-hours.**
  - 252 main runs: 14 stages × 2 variants × 3 seeds × 3 budgets, at horizon 48.
  - 120 ladders: 345 ladder runs.
- Each run is its own child process, capped at 150 minutes; none timed out. An interrupted sweep resumes from its
  parts.
- The 252 tapes are in `tapes/g4/` (4.2 MB) and listed in the page's replay menu (`web/index/tapes.json`).
- Re-run: `node bin/bot-sweep.mjs --jobs N`. Summary only: `node bin/bot-sweep.mjs --summary`.

## For the coordinator to decide

1. **The browser budget.** 600 units ≈ 3 ms in Chromium here. It could go to 4× (≈ 12 ms) for the extra endless
   score, but that leaves little margin on slower machines. I kept 1×.
2. **The default policy in the page** is now "bot: attack" (it was `lookahead`). The test policies remain selectable.
3. **The next slice.** Since 1 frame suffices with full knowledge, the meaningful next measurement is a bot that does
   **not** know the future `$rand` draws or aims: plan against a model of the bullets, not the seeded game. That
   would turn "look-ahead needed" into a statement about the patterns rather than about determinism. Stars (`starWeight`)
   are the other open item.
