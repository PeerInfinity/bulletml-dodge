# H3 report — calibrating the skill slider and placing the presets

Slice H3 of `docs/humanlike-plan.md`, 2026-10-04, branch `h3-calibrate`. Input: the CI grid `results/h3-grid.md`
(at `d617e3c`: 1,050 runs, every preset and skill 0–100 step 10 × stages 1–10 × game seeds 1–3 × bot seeds 1–2,
attack). ⚖ The user's rulings (2026-10-04): keep the 8 presets, their names and characters; keep the carry-forward
reaction model; no slider step above the Expert (the Ace stays a menu entry); outcome targets: **skill 0 rarely
survives stage 1's first minute; skill 50 clears the early stages with losses; skill 100 (the Expert) clears most
stages; and the slider is monotonic**; no manual recording, knob values inside human-factors ranges.

## Verdict

- **New measures.** `bin/h2-sweep.mjs` now judges a player by **clears, game overs, survival** (seconds to the game
  over, or 3 minutes for a run without one) and **runs with no hit in the first minute**, plus **lives lost per
  minute played**. Lives lost alone was the wrong measure: a weak bot reaches its game over early, which caps its
  losses at 3–4, while a stronger one lives longer and has more time to be hit. Re-read by these measures, the H3 grid
  was already *weakly* monotonic in clears and game overs; survival and lives lost per minute dipped at skill 70.
- **The slider's curve.** Skill now maps to a position on H2's path (beginner → Expert) through a piecewise-linear
  curve, `SKILL_CURVE = [[0, 0], [10, 8], [20, 15], [80, 45], [90, 65], [100, 100]]` (`src/game/human.js`). Most of
  the slider (20–80) now covers the stretch of the path where outcomes change, at an even rate, instead of crowding it
  into skill 10–50. Skill 0 is the Cautious beginner and skill 100 the Expert, exactly as before.
- **Strictly monotonic on the full grid** (local, 630 runs, every skill level × stages 1–10 × 3 seeds × 2 bot seeds):

  | | 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100 |
  |---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
  | cleared (of 60) | 1 | 4 | 9 | 17 | 21 | 34 | 40 | 45 | 58 | 60 | 60 |
  | game overs (of 60) | 59 | 56 | 51 | 43 | 39 | 26 | 20 | 15 | 2 | 0 | 0 |
  | survival (s) | 59.2 | 74.3 | 87.0 | 111.3 | 128.5 | 143.3 | 154.0 | 159.9 | 176.1 | 180 | 180 |
  | lives lost per minute | 3.42 | 3.02 | 2.69 | 2.25 | 2.09 | 1.80 | 1.62 | 1.48 | 0.87 | 0.51 | 0 |

  (Skill 100 runs once per game seed, 30 runs: it never draws from its generator. Shown here per 60.) Clears, game
  overs, survival and lives lost per minute are strictly monotonic, and so is the mean score. The first-minute
  measure is not: 8, 8 at skill 20–30 and 20, 20, 17 at skill 50–70 (see [What is left](#what-is-left)).
- **The targets:** skill 0 clears 1 of 60 runs and survives 59 s on average; on **stage 1 alone** it clears 0 of 6,
  but 2 of 6 runs pass the first minute without a hit (a question for the user, below). **Skill 50 clears stages 1–3**
  in 17 of 18 runs, losing 0–5 lives each, and has a game over on most later stages. **Skill 100 clears everything.**
- **The presets on the slider** (unchanged; equivalent skill by clears / survival): Cautious beginner 0, Score
  chaser ≈ 7, Distracted ≈ 14–23, Tunnel vision ≈ 14–25, Panicky ≈ 24–28, Steady veteran ≈ 77, Expert 100. No preset
  contradicts its description, so none was retuned. Four of them cluster at the weak end; the measurements behind that
  and the **proposals for the user** are [below](#proposals-for-the-user).
- **Tests:** `npm test` and `npm run test:browser` green; the Expert's and the Ace's tapes re-record byte for byte, and
  so do all 26 H2 tapes (`node bin/check-bot-tapes.mjs tapes/h1b/*.json tapes/g4/s01-attack-seed1-b1x.json
  tapes/g4/s06-no-attack-seed1-b1x.json tapes/g4/s10-attack-seed1-b1x.json tapes/h1/s03-attack-seed1-expert.json
  tapes/h2/*.json` → *all 34 tapes the same*); the engine is untouched (`npm run compare-native` with the wrap build:
  137/137). **The six slider tapes for skill 25, 50 and 75 in `tapes/h2/` were re-recorded**: the same skill now
  means other knob values (skill 0 and 100 did not change); `web/index/tapes.json` was rebuilt.
- **The CI verification grid `h3-calibrated` is the coordinator's to dispatch** ([the command](#the-ci-verification-grid)).

## 1. The measures (`bin/h2-sweep.mjs`)

Per player and variant the report now gives, besides the per-stage cells:

| Measure | What | Direction |
|---|---|---|
| Cleared | runs that cleared the stage | higher is better |
| Game overs | runs that ended in one | lower |
| Survival (s) | seconds to the game over; 180 s (3 minutes) for a run without one (every stage 1–10 ends before 3 minutes) | higher |
| 1st min | runs with no hit in the first minute (3,750 frames) | higher |
| Lost / min | lives lost per minute played (lives lost ÷ minutes of the run) | lower |
| Lives lost (mean) | kept, but marked: a game over caps it, so it is not a measure of skill | — |

**The slider's monotonicity** is a table of these measures by skill, each judged **strictly** (every step better,
or equal only at the floor or the ceiling: 0, or every run) or **weakly** (never worse). Counts are compared as shares
(skill 100 has 30 runs, the others 60). The slider must be strictly monotonic in clears, game overs and survival; the
report says so in one line. A per-stage table follows (clears and survival per stage, weakly), for information: a
stage has only 6 runs per level, and one run more or less is noise.

**The presets on the slider:** each preset's equivalent skill by clears, survival and first-minute survival, linear
between the two neighbouring skill levels that bracket it.

Also new in the sweep:

- `--from a.json[,b.json]` re-reports the runs of earlier results files (with the settings those files record), e.g.
  the CI grid by the new measures, or the CI presets with local skill runs.
- `"path N"` players (give them with `--presets`): a point of the slider's path without its curve, for calibration.
- A part records its setting's knobs; a part whose player now has other knobs (the curve changed) runs again. And
  `--tapes` re-runs a cached part that has no tape (before, it silently wrote none).

## 2. The grid at `d617e3c`, re-measured

`results/h3-grid-remeasured.md` (`node bin/h2-sweep.mjs --from results/h3-grid.json --presets all --skills
0,10,20,30,40,50,60,70,80,90,100 --seeds 1,2,3 --bot-seeds 1,2 --name h3-grid-remeasured`). The coordinator's
reading checks out:

| Old skill | 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| cleared (of 60) | 1 | 8 | 17 | 34 | 45 | 57 | 59 | 59 | 60 | 60 | 60 |
| game overs | 59 | 52 | 43 | 26 | 15 | 3 | 1 | 1 | 0 | 0 | 0 |
| survival (s) | 59.2 | 79.9 | 111.3 | 143.3 | 159.9 | 175.0 | 179.3 | **178.5** | 180 | 180 | 180 |
| no hit in the 1st min | 2 | 3 | 8 | 20 | **17** | 28 | 47 | **39** | 51 | 60 | 60 |
| lives lost per minute | 3.42 | 2.85 | 2.25 | 1.80 | 1.48 | 1.06 | 0.42 | **0.56** | 0.22 | 0.02 | 0 |

Clears and game overs were weakly monotonic (59 = 59 at 60–70); survival and lives lost per minute dipped at 70; the
first minute dipped at 40 and 70. Lives lost per stage, the old check, called all 10 stages non-monotonic, wrongly.
The shape: 52 of the 59 extra clears come between skill 0 and 50; from 60 up only the hit rate changes.

## 3. The path, sampled finely

The slider's *path* is H2's: every knob between the beginner's value and the Expert's, linearly (geometrically for
attentionRadius, attentionCount and maxRate). To see where outcomes change along it, I ran the path at the points in
between (`path 5, 15, … 95`, and the candidates `path 8, 13, 19, 24, 29, 34, 40, 62`), each on the same 60-run grid,
locally (4 cores; 1,080 runs, ≈ 35 min wall). With the CI grid's points:

| Path | 0 | 5 | 8 | 10 | 13 | 15 | 19 | 20 | 24 | 25 | 29 | 30 | 34 | 35 | 40 | 45 | 50 | 55 | 60 | 62 | 65 | 70 | 75 | 80 | 85 | 90 | 95 | 100 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| cleared | 1 | 1 | 4 | 8 | 4 | 9 | 12 | 17 | 9 | 21 | 39 | 34 | 41 | 40 | 45 | 58 | 57 | 59 | 59 | 60 | 60 | 59 | 60 | 60 | 60 | 60 | 60 | 60 |
| survival (s) | 59 | 60 | 74 | 80 | 66 | 87 | 100 | 111 | 106 | 129 | 155 | 143 | 154 | 154 | 160 | 176 | 175 | 178 | 179 | 180 | 180 | 179 | 180 | 180 | 180 | 180 | 180 | 180 |
| lost / min | 3.42 | 3.47 | 3.02 | 2.85 | 3.13 | 2.69 | 2.47 | 2.25 | 2.47 | 2.09 | 1.62 | 1.80 | 1.53 | 1.62 | 1.48 | 0.87 | 1.06 | 0.77 | 0.42 | 0.54 | 0.51 | 0.56 | 0.45 | 0.22 | 0.08 | 0.02 | 0 | 0 |

What it says:

- **Almost everything happens between path 5 and 45**: clears 1 → 58. Above 45 only the hit rate falls (0.87 → 0 per
  minute). Path 0–5 is flat.
- **The noise is large**: neighbouring points 3–5 apart invert by up to 8 clears (path 10 → 13: 8 → 4; 20 → 24: 17 →
  9; 29 → 30: 39 → 34). Each point is a different set of snapped knob values played on the same seeds, and a run's
  outcome is chaotic in the knobs. So strict monotonicity at 11 levels of 60 runs holds only where the steps are
  larger than this noise, and a curve is best chosen on points that have been measured.

## 4. The new mapping

`skillKnobs(s) = pathKnobs(skillPosition(s))`, with `skillPosition` piecewise linear through
`SKILL_CURVE = [[0, 0], [10, 8], [20, 15], [80, 45], [90, 65], [100, 100]]`:

- **0 → 20 covers path 0 → 15** (the bottom, where path 0–5 is flat: skill 10 starts at path 8, the first point with
  more clears than the beginner);
- **20 → 80 covers path 15 → 45 at half a path unit per skill point**: the stretch where clears go 9 → 58;
- **80 → 90 covers path 45 → 65** (clears 58 → 60; the hit rate halves);
- **90 → 100 covers path 65 → 100**: from a player who clears everything but is hit about once every two minutes to
  the Expert, who is not hit.

How it was chosen: a straight line through the measured profile (half a path unit per skill point over the steep
part), with its points at multiples of 10 on path points already measured (8, 15, 20, 25, … 45, 65), then verified
end to end with the new `skill N` players. The verification needed no nudging. Being on measured points, this is a fit
to this grid's seeds; on other seeds I expect it monotonic in expectation, with the occasional one-level inversion of
a few clears (the noise above), most likely between skill 30 and 40 (17 → 21) and between 80 and 90 (58 → 60).

The knobs at each skill level (all of them between the beginner's and the Expert's values, as before; the habit knobs
margin, heights and panic thresholds move with them):

| Knob | 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| *path position* | 0 | 8 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 65 | 100 |
| reaction (frames) | 20 | 18 | 17 | 16 | 15 | 14 | 13 | 12 | 11 | 7 | 0 |
| attentionRadius (px) | 120 | 136 | 153 | 166 | 179 | 194 | 211 | 228 | 248 | 342 | 600 |
| attentionCount | 24 | 32 | 42 | 51 | 61 | 74 | 89 | 108 | 130 | 275 | 1024 |
| misjudge (px) | 4 | 3.75 | 3.5 | 3.25 | 3 | 2.75 | 2.5 | 2.5 | 2.25 | 1.5 | 0 |
| horizon (frames) | 16 | 19 | 21 | 22 | 24 | 26 | 27 | 29 | 30 | 37 | 48 |
| replanEvery (frames) | 4 | 4 | 4 | 3 | 3 | 3 | 3 | 3 | 3 | 2 | 1 |
| marginBullet (px) | 8 | 7.5 | 7 | 6.75 | 6.5 | 6.25 | 6 | 5.5 | 5.25 | 4 | 2 |
| marginSpawner (px) | 16 | 15 | 15 | 14 | 14 | 14 | 13 | 13 | 12 | 11 | 8 |
| marginTop (px) | 220 | 213 | 207 | 203 | 199 | 195 | 191 | 186 | 182 | 165 | 136 |
| attackY (px) | 330 | 316 | 305 | 296 | 288 | 279 | 271 | 262 | 254 | 220 | 160 |
| starWeight | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| slowUse | 0.3 | 0.35 | 0.4 | 0.45 | 0.45 | 0.5 | 0.55 | 0.6 | 0.6 | 0.75 | 1 |
| minHold (frames) | 7 | 7 | 6 | 6 | 6 | 5 | 5 | 5 | 4 | 3 | 1 |
| maxRate (changes/s) | 4 | 5 | 6 | 7 | 8 | 9 | 10.5 | 12 | 14 | 24 | 62.5 |
| overshootP | 0.3 | 0.28 | 0.26 | 0.24 | 0.22 | 0.21 | 0.2 | 0.18 | 0.16 | 0.1 | 0 |
| overshootFrames | 6 | 6 | 5 | 5 | 5 | 4 | 4 | 4 | 3 | 2 | 0 |
| lapseRate (per min) | 3 | 2.8 | 2.5 | 2.4 | 2.3 | 2.1 | 2 | 1.8 | 1.6 | 1 | 0 |
| lapseFrames | 24 | 22 | 20 | 19 | 18 | 17 | 16 | 14 | 13 | 8 | 0 |
| panicFrom / panicTo (bullets) | 40 / 150 | 49 / 170 | 57 / 188 | 62 / 200 | 68 / 213 | 73 / 225 | 79 / 238 | 84 / 250 | 90 / 263 | 112 / 313 | 150 / 400 |
| panicReaction (frames) | 8 | 7 | 7 | 6 | 6 | 6 | 5 | 5 | 4 | 3 | 0 |
| panicMisjudge (px) | 3 | 2.75 | 2.5 | 2.5 | 2.25 | 2 | 2 | 1.75 | 1.75 | 1 | 0 |
| panicSlow | 0.3 | 0.3 | 0.25 | 0.25 | 0.2 | 0.2 | 0.2 | 0.2 | 0.15 | 0.1 | 0 |

**Human-factors ranges** (the H2 report's sources [1]–[12]). The curve does not invent values: every skill level is a
point between the two presets H2 anchored in the literature. What changed is where the slider spends its length. Its
reaction time now runs 320 ms (skill 0: general population plus a choice among 8 directions [1, 2, 4, 5]) → 224 ms
(skill 50: simple visual reaction, ~200–250 ms [1, 2]) → 176 ms (skill 80: practised action-game players, ~150–190 ms
[3]); only above skill ≈ 85 does it go below ~150 ms, toward the Expert's 0 (the old slider did from skill 55 up). The same holds for the hands: minimum holds of 112–64 ms over skill 0–80 (dwell times 70–120 ms
[6]); 4–14 input changes per second (one finger ~5 taps per second [7], more with several fingers); tracked bullets
24–130 within 120–248 px (tracking 4–8 objects [8] plus a useful field of view [9, 12]); lapses 3–1.6 per minute
(PVT lapses [10]). **So the slider is now human over its first 80%**, where before only its first ~55% was.

`settingByName('path N')` and the sweep's `path N` players give the path without the curve, for any later
recalibration; `skillPosition(s)` and `pathKnobs(p)` are exported. The page needs no change: it calls `skillKnobs`.

## 5. Results, before and after (the full skill grid, local)

Before: the CI grid at `d617e3c` (§ 2). After: the new `skill N` players, run locally on the same grid
(`node bin/h2-sweep.mjs --presets none --skills 0,10,20,30,40,50,60,70,80,90,100 --seeds 1,2,3 --bot-seeds 1,2 --name
h3-local`, 630 runs, 15 min wall on 4 cores; `results/h3-local.json`), reported with the CI presets
(`--from results/h3-grid.json,results/h3-local.json --name h3-calibrated-local` → `results/h3-calibrated-local.md`).
Local runs match CI's exactly: a skill 20 and a Panicky run reproduce CI's frames, score and hit frames; `path 40`
reproduces CI's old skill 40 in 60 of 60 runs; and the new skill 30, 50 and 70 (path 20, 30, 40) reproduce CI's old
skill 20, 30 and 40 in 180 of 180 runs.

| Skill | cleared before → after | game overs | survival (s) | 1st min | lost / min |
|---|---|---|---|---|---|
| 0 | 1 → 1 | 59 → 59 | 59.2 → 59.2 | 2 → 2 | 3.42 → 3.42 |
| 10 | 8 → 4 | 52 → 56 | 79.9 → 74.3 | 3 → 3 | 2.85 → 3.02 |
| 20 | 17 → 9 | 43 → 51 | 111.3 → 87.0 | 8 → 8 | 2.25 → 2.69 |
| 30 | 34 → 17 | 26 → 43 | 143.3 → 111.3 | 20 → 8 | 1.80 → 2.25 |
| 40 | 45 → 21 | 15 → 39 | 159.9 → 128.5 | 17 → 11 | 1.48 → 2.09 |
| 50 | 57 → 34 | 3 → 26 | 175.0 → 143.3 | 28 → 20 | 1.06 → 1.80 |
| 60 | 59 → 40 | 1 → 20 | 179.3 → 154.0 | 47 → 20 | 0.42 → 1.62 |
| 70 | 59 → 45 | 1 → 15 | 178.5 → 159.9 | 39 → 17 | 0.56 → 1.48 |
| 80 | 60 → 58 | 0 → 2 | 180 → 176.1 | 51 → 30 | 0.22 → 0.87 |
| 90 | 60 → 60 | 0 → 0 | 180 → 180 | 60 → 44 | 0.02 → 0.51 |
| 100 | 60 → 60 | 0 → 0 | 180 → 180 | 60 → 60 | 0 → 0 |

Steps in clears, before: +7 +9 +17 +11 +12 +2 0 +1 0 0; after: +3 +5 +8 +4 +13 +6 +5 +13 +2 0. Before, 3 of the 10
steps changed nothing in clears and two more gained 1–2; after, 1 step changes nothing (90 → 100, both at the ceiling, where the hit rate still
falls from 0.51 to 0 per minute).

**Skill 50 per stage** (after; cleared / runs, lives lost per run): stage 1 5/6 (1c/2c/0c/3g/1c/2c), stage 2 6/6
(3c/2c/4c/5c/1c/4c), stage 3 6/6 (2c/1c/4c/3c/4c/3c), stage 4 4/6, 5 4/6, 6 2/6, 7 4/6, 8 3/6, 9 0/6, 10 0/6. *"Clears
the early stages with losses"*: yes.

**Skill 0 on stage 1** (unchanged, = the Cautious beginner): 0 of 6 runs clear it; mean survival 95 s; first hits at
frames 6250, 2672, 3342, 4807, 1324, 2587, so **4 of 6 are hit inside the first minute and 2 are not** (100 s and 77 s).
Over all ten stages, 2 of 60 runs pass the first minute unhit. Whether "rarely survives stage 1's first minute" is met
depends on its reading: met if it means "loses a life", or "rarely survives stage 1" (0/6); not quite met for stage 1
alone if it means "no hit at all in the first minute" (2/6). The beginner's character (*"an over-large margin, stays
low"*) is what keeps it safe early; making it weaker in the first minute would go against that. I left it; see the
proposals.

## 6. The presets on the slider

The presets are unchanged (their knobs, so their CI runs at `d617e3c` stand). Their equivalent skill on the new
slider (`results/h3-calibrated-local.md` § the presets on the slider):

| Preset | Cleared | ≈ skill | Survival (s) | ≈ skill | 1st min | ≈ skill | Stage profile (clears per stage 1–10, of 6) |
|---|---:|---:|---:|---:|---:|---:|---|
| Expert | 30/30 | ≥ 90 | 180 | ≥ 90 | 30/30 | 100 | all |
| Steady veteran | 55/60 | **78** | 171.2 | **77** | 20/60 | 50 | 6 6 6 5 6 4 6 5 6 5 |
| Panicky | 12/60 | **24** | 105.8 | **28** | 7/60 | 18 | **6** 1 3 0 1 0 1 0 0 0 |
| Tunnel vision | 6/60 | **14** | 98.2 | **25** | 2/60 | 0 | 0 1 3 0 2 0 0 0 0 0 |
| Distracted | 6/60 | **14** | 95.4 | **23** | 3/60 | 10 | 1 1 3 0 0 1 0 0 0 0 |
| Score chaser | 3/60 | **7** | 70.6 | **8** | 0/60 | < 0 | 1 1 1 0 0 0 0 0 0 0 |
| Cautious beginner | 1/60 | 0 | 59.2 | 0 | 2/60 | 0 | 0 1 0 0 0 0 0 0 0 0 |

**Against their descriptions** (none contradicts its own, so none was retuned):

- **Steady veteran** — *quick reactions, a generous margin, reads ahead, rarely lapses*: ≈ skill 77, clears 55 of 60,
  the strongest human preset. Its first minute is worse than its clears suggest (20/60, ≈ skill 50): it is hit early
  and then recovers, as a methodical player would.
- **Panicky** — *fine when the screen is calm; falls apart when it fills*: it clears calm stage 1 in **6 of 6** runs
  (skill 50 does 5 of 6; Tunnel vision and Distracted 0–1 of 6) and the denser stages 2–10 in 6 of 54. Its overall ≈
  24–28 is the average of a skill-50 player on calm screens and a skill-10 one on dense screens. Matches.
- **Tunnel vision** — *surprised by bullets from the edges*: on stage 1 its first hits come at frames 246, 389 and 473
  in three of six runs (4–8 s), and it does not see 35 bullets per look on average (the most of any preset). Matches.
- **Distracted** — *frequent lapses*: 10.6 lapses per run, 310 frames in lapses (5 s per run). Matches.
- **Score chaser** — *greedy for stars, pushes up to attack, a thin margin, takes risks*: it takes risks and pays
  for them: game over in 57 of 60, ≈ skill 7. It matches its description, but not the goal of a score chaser: its mean
  score (664 k) is far below the Steady veteran's (1.75 M).
- **Cautious beginner** — the slider's 0.

**Several presets equally weak.** Panicky, Tunnel vision and Distracted sit together at ≈ skill 14–28, and the Score
chaser at ≈ 7. To see why, I ran each with its flaw removed or on another base (each on the same 60-run grid; scratch
runs, not committed):

| Variant | Cleared | ≈ skill | Survival (s) | ≈ skill |
|---|---:|---:|---:|---:|
| **the shared base** of Panicky / Tunnel vision / Distracted (their common knobs, without the flaw: reaction 12, attention 300 px / 120, misjudge 1, horizon 32, margin 3, attack at 200 px, mild panic, 1 lapse/min) | 15/60 | 28 | 105.9 | 28 |
| Panicky's panic on the **Steady veteran's** base | 49/60 | 73 | 164.6 | 73 |
| Tunnel vision's attention (64 px / 40) on the veteran's base | 47/60 | 72 | 163.0 | 72 |
| Distracted's lapses (8/min of 30 frames) on the veteran's base | 46/60 | 71 | 159.8 | 70 |
| Score chaser without star greed (starWeight 0) | 0/60 | < 0 | 57.7 | < 0 |
| Score chaser with margin 2, misjudge 1 | 6/60 | 14 | 76.3 | 12 |
| Score chaser with the Expert's top line and attack at 140 px | 1/60 | 0 | 65.1 | 4 |
| Score chaser's habits (margins 1 / 6, top 100, attack 120, greed 0.02) on the veteran's base | 7/60 | 16 | 96.3 | 24 |
| … the same with margin 2 | 17/60 | 30 | 107.5 | 28 |
| … the same with the Expert's top line and attack at 140 px | 20/60 | 38 | 119.0 | 34 |

So: **the shared base is itself weak** (≈ skill 28: its eyes and hands are mid-slider, but its habits are a
competent player's, a 3 px margin and attacking at 200 px, where the slider at the same skill keeps ~6.75 px and
attacks from ~295 px); **each flaw costs little on top of it** (Panicky ≈ base, Tunnel vision and Distracted ≈ 10
points less by clears). On the veteran's base each flaw costs 5–8 skill points. The **Score chaser** is weak on any base:
its thin margin with ±2 px misjudgement (it often believes the hit area smaller than it is), its attack position inside
the band where enemies appear, and its greed together; no single habit explains it.

Is that right for their characters? For Panicky, Tunnel vision and Distracted, *"a below-average player with one
flaw"* is a fair reading of their descriptions, and their losses look different even where their totals agree (the
stage profiles above). But it leaves the slider's 30–75 without a preset, and makes three of them hard to tell apart
by outcome. For the Score chaser, a risk-taker who almost never finishes a stage and scores less than the veteran
is a weak reading of "score chaser".

## Proposals for the user

None applied; each is a ruling for you.

1. **Spread the presets.** Rebase Panicky, Tunnel vision and Distracted on the Steady veteran's eyes and hands (their
   flaw and habits kept). Measured: ≈ skill 70–73 each, clearing 46–49 of 60. Each then reads as *"a good player with
   one weakness"*, and Panicky's calm/dense contrast stays. They would cluster again, higher up. To spread them
   instead, use bases of different strength: e.g. Distracted on the veteran's base (≈ 70), Panicky on the slider's
   skill 50 (*not measured*), Tunnel vision as it is (≈ 14–25).
2. **The Score chaser.** Either keep it as the reckless one (≈ skill 7), or make it a strong player who takes measured
   risks: the veteran's base with a 2 px margin, the Expert's top line and attack at 140 px (≈ skill 34–38 by the
   variants above; still well below the veteran). Its greed is not what kills it, so the star weight can stay.
3. **Skill 0 and stage 1's first minute.** Accept the target as met (no stage-1 clear, 4 of 6 hit in the first
   minute, 59 s mean survival over all stages), or ask for a weaker first minute. That would mean a less cautious
   beginner (a smaller margin or a higher position), against its description.
4. **The first-minute measure is not monotonic** (§ 5: 8 = 8, and 20, 20, 17). Should it be a target too? A stricter
   curve would need more measured points around path 20 and 35–40; for a smoother measure it may be better judged per
   stage on more seeds.

## What is left

- **The first-minute measure** is not monotonic (skill 20 = 30: 8/60; skill 50 = 60: 20/60; skill 70: 17/60). It was
  not a required target; proposal 4.
- **Generalisation:** the curve is fitted on this grid's seeds (1–3, bot seeds 1–2). Another seed set will be
  monotonic in expectation, but a 60-run level has a noise of a few clears (§ 3). A larger grid (say seeds 1–6) would
  say how often it inverts; I did not run one.
- The presets' equivalent skill is a single number for a player whose strength varies by stage (Panicky most of all).

## The CI verification grid

The same shape as `results/h3-grid.md` (every preset, skill 0–100 step 10, stages 1–10 attack, seeds 1–3, bot seeds
1–2; 1,050 runs, 16 shards), after `h3-calibrate` is merged (the workflow runs from `main`):

```
gh workflow run h2-sweep.yml --ref main -f name=h3-calibrated -f presets=all \
  -f skills=0,10,20,30,40,50,60,70,80,90,100 -f variants=attack -f stages=1,2,3,4,5,6,7,8,9,10 \
  -f seeds=1,2,3 -f bot_seeds=1,2 -f shards=16
```

What to expect: the runs are deterministic, so the presets should reproduce `results/h3-grid.json` run for run
(their knobs did not change) and the skill levels `results/h3-local.json` run for run; `results/h3-calibrated.md` should
match `results/h3-calibrated-local.md` table for table, and say *"The slider is **strictly monotonic** in clears, game
overs and survival."* About 2.5 CPU-hours (the new mid-slider levels die sooner than the old ones): ~10 minutes on 16
runners. To compare locally: `node bin/h2-sweep.mjs --from results/h3-calibrated.json,results/h3-local.json …` or a
diff of the two `.md` files below their first line.

## Files

- `src/game/human.js`: `SKILL_CURVE`, `skillPosition`, `pathKnobs`; `skillKnobs` = the path at the curve; `"path N"`
  in `settingByName`.
- `bin/h2-sweep.mjs`: the measures, the monotonicity by them, the presets' equivalent skill, `--from`, stale parts,
  `--tapes` on cached parts.
- `test/bot.test.mjs`: the curve runs (0, 0) → (100, 100), rising; `skillKnobs` = `pathKnobs(skillPosition)`;
  `path 100` = the Expert (the old checks stand: the slider's ends, every skill-ordered knob one way).
- `tapes/h2/skill-{25,50,75}-s0{1,6}-attack-seed1.json` re-recorded; `web/index/tapes.json` rebuilt.
- `results/h3-grid-remeasured.md` (the CI grid by the new measures), `results/h3-local.json` (the 630 local runs of
  the new slider), `results/h3-calibrated-local.md` (those with the CI presets).
