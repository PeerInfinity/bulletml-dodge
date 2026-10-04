# Plan: a humanlike bot — a skill slider and personalities

Started 2026-10-03. ⚖ The user: *"I like all of those ideas. I want to implement all of them. In addition to the skill
slider, I would like to have some preset personalities, with different settings for specific attributes. I would prefer
not to have to do any manual recording."* Earlier: the bot as it is now is the MAX setting; lower settings make *"the sort
of mistakes a human might make"*.

## The scale

| Level | What it is |
|---|---|
| **Ace** (max) | today's G4 bot: it plans on a copy of the seeded game, so it knows every future `$rand` draw and aimed shot |
| **Expert** | perfect perception and reflexes, **no foresight**: plans against what it can see (H1) |
| below | the Expert plus human limits (H2), set by one **skill** slider or a **personality** preset |

## The knobs (each a setting; H2 unless noted)

1. **Perception (H1):** omniscient | observed. Observed = the bot predicts from the screen only: bullets and enemies
   continue as seen moving (straight, or curving if it has watched them turn); nothing new appears until it is fired;
   its own ship's motion is known exactly.
2. **Reaction time:** the bot sees the world as it was N frames ago (human visual reaction ~200–250 ms ≈ 12–16 frames).
3. **Planning horizon:** how far ahead it imagines.
4. **Perceived bullet size:** humans dodge the bullet they SEE, not the 2 px trail-end hit point — a safety margin around
   the drawn bullet; at low skill a misjudged (sometimes too small) margin.
5. **Attention:** only bullets within a radius of the ship, or the nearest N, are tracked.
6. **Input limits:** minimum key-hold time, maximum input changes per second, overshoot (holding a direction a few
   frames too long).
7. **Lapses:** short random moments of inattention (keep the last input).
8. **Habits:** greed for stars (risk for points; stars enabled — today `starWeight` 0), preferred height on screen
   (stay low vs push up to attack), slow-button use (forgets it / panics with it), panic under density (reaction and
   precision worsen as the screen fills).

## Personalities (presets; first proposal — the user may rename or retune)

| Preset | Character |
|---|---|
| Ace | the max bot (omniscient) |
| Expert | perfect perception and reflexes, no foresight |
| Steady veteran | quick reactions, generous margin, reads ahead, rarely lapses, attacks methodically |
| Score chaser | greedy for stars, pushes up to attack, thin margin, takes risks |
| Cautious beginner | slow reactions, short horizon, over-large margin, stays low, few kills |
| Panicky | fine when the screen is calm; reaction, precision and slow-button use fall apart when it fills |
| Tunnel vision | small attention radius: surprised by bullets from the edges |
| Distracted | frequent lapses |

The **skill slider** (0–100) interpolates the knobs from Cautious beginner (0) to Expert (100); Ace sits above it.

## Calibration without recordings (⚖ no manual recording)

- **Literature values** anchor the human knobs: simple visual reaction ~200–250 ms; input-change rates and minimum key
  holds of a few per second / ~50–100 ms; lapse frequencies.
- **Outcome targets** anchor the slider (⚖ accepted 2026-10-04): skill 0 rarely survives stage 1's first minute; skill 50
  clears the early stages with losses; skill 100 (Expert) clears most stages; and the slider is **monotonic** — judged
  (H3) by clears, game overs and survival, not by lives lost, which a game over caps.
- Measured by sweeps in cloud sessions, **sharded across several sessions** (the G4 lesson: one 4-core session took 3.6 h).
- Optional later: tapes of real play could be added as a calibration source; nothing depends on them.

## Rules for every slice

- The engine does not change: `npm run compare-native` (wrap) 137/137, `npm test`, `npm run test:browser` (page = Node).
- Determinism: a humanlike bot's randomness comes from its OWN seeded generator — never the game's `rand()` — and its
  settings + seed are recorded in the tape, so every run replays exactly and the page plays Node's moves.
- Work on a branch; the coordinator merges to `main` (which deploys GitHub Pages).

## Slices

| Slice | What |
|---|---|
| **H1** | Built on branch `h1-perception` (`docs/h1-report.md`): `src/game/perception.js` (the observed model), `perception: 'observed'` in `src/game/bot.js`, the Expert in the page ("bot: expert attack / no-attack"), the sharded H1 sweep (`bin/h1-sweep.mjs`, as GitHub Actions shards: `.github/workflows/sweep.yml`), death diagnosis, the observed planner for single patterns, a CI test gate. Measured so far: the 73 patterns keep their verdict (62 reflex / 11 H2); no-attack stages 1–5 need 4 frames of look-ahead (8 on one seed); deaths come from bullets fired by active bullets 1–2 px from the ship. **The full sweep is the coordinator's to dispatch** (commands in the report). |
| **H1b** | Built on branch `h1b-expert` (`docs/h1b-report.md`), the user's "yes to both" on H1's open decisions. A **safety margin** for the Expert: it keeps 2 px from a bullet's drawn trail and 8 px from anything that can fire one (enemies, active bullets, dots not yet moving), and stays below the band where enemies appear (136 px). The margin ranks right after survival. And an **attack height** of 160 px, near where enemies appear, instead of the home row. All chosen by measurement and recorded in the tape. The Ace is unchanged. Local, stages 1–10 attack × 3 seeds: lives lost 10 → 0, mean score 2.46 M → 3.09 M (the Ace: 3.64 M); ENDLESS 4 → 0; no-attack still 0. **The CI sweep `h1b-bot` is the coordinator's to dispatch** (command in the report). |
| **H2** | Built on branch `h2-humanlike` (`docs/h2-report.md`): every knob above a setting (23, `src/game/human.js`; default = the Expert exactly: H1b and G4 tapes re-record byte for byte), the bot's own seeded generator (settings + bot seed in the tape; tapes re-record from their own record), the 8 presets as data, the skill slider (Cautious beginner 0 → Expert 100), the page's personality menu / slider / advanced panel (page = Node), `bin/h2-sweep.mjs` + `.github/workflows/h2-sweep.yml`. Smoke (stages 1, 6, seed 1): the slider monotonic; the beginner loses every ship but survives stage 1's first minute (target not met yet). **H3's grid is the coordinator's to dispatch** (command in the report). |
| **H3** | Built on branch `h3-calibrate` (`docs/h3-report.md`), from the CI grid `results/h3-grid.md` and the user's rulings (targets accepted; presets, carry-forward reaction and the Ace's place kept). The sweep's measures: clears, game overs, survival (s to the game over, 3 min without one), first minute unhit, lives lost per minute played; the slider's monotonicity by them; each preset's equivalent skill; `--from` re-reports results files. **The slider's curve** `SKILL_CURVE` (skill → a position on H2's path, piecewise linear: 0→0, 10→8, 20→15, 80→45, 90→65, 100→100), chosen on a fine local sample of the path. Local, the full skill grid (630 runs): clears 1, 4, 9, 17, 21, 34, 40, 45, 58, 60, 60 of 60 and survival 59 → 180 s, **strictly monotonic** (before: 1, 8, 17, 34, 45, 57, 59, 59, 60, 60, 60); skill 50 clears stages 1–3 in 17 of 18 runs; the slider is human (≥ ~150 ms reaction) up to skill ≈ 85. Presets unchanged (≈ skill: beginner 0, Score chaser 7, Distracted and Tunnel vision 14–25, Panicky 24–28, Steady veteran 77); proposals for the user in the report. Six slider tapes in `tapes/h2/` re-recorded. **The CI verification grid `h3-calibrated` is the coordinator's to dispatch** (command in the report). |
| **H3b** | Built on branch `h3b-personalities` (`docs/h3b-report.md`), ⚖ the user: the presets become **biases on the calibrated slider** (Cautious beginner → Cautious, Steady veteran → Steady; default skill 50; biases apply at 100 except Steady's, which fades into the Expert; faculties below the beginner kept, within the knobs' ranges). A bias shifts skill-ordered knobs along the path, multiplies habits, or sets star greed. The page: the slider moves the chosen personality ("Panicky 80"). Small set (local, 540 runs: each at skill 0/50/100): then ⚖ the full set (local, 1,710 runs: each at skill 0/25/50/75/100 × 2 bot seeds): every personality strictly monotonic in skill; at 50: Score chaser ≈ 16–19, Panicky ≈ 40, Tunnel vision ≈ 46–48, Distracted ≈ 48–50, Cautious ≈ 75, Steady ≈ 78; Tunnel vision and Distracted show as early hits more than as losses from 50 up; at 100 the flaws barely cost (the Score chaser outscores the Ace). Settings kept as they are (⚖). |


- ⚖ **The user, 2026-10-04:** *"I still want to keep the settings as they are."* The open questions of
  `docs/h3b-report.md` (flaws at skill 100, Cautious vs Steady at 50, the Score chaser at 50) are closed with no change.
  **The arc's planned slices H1–H3 (and H1b, H3b) are complete**; CI verified the slider and personality grids run for run
  (`results/h3-calibrated.md`, `results/h3b-personalities.md`).
