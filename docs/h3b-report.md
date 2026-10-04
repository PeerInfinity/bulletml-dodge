# H3b report — personalities as biases on the skill slider

Slice H3b, 2026-10-04, branch `h3b-personalities` (from `h3-calibrate`). ⚖ The user: *"try changing the other
presets so that instead of being a fixed set of stats, they're a set of biases to apply to the 0–100 calibration"*.
Rulings: "Cautious beginner" → **Cautious**, "Steady veteran" → **Steady**; every personality starts at **skill 50**;
the biases still apply at skill 100 for every personality **except Steady**; path positions below the beginner are
kept if meaningful, otherwise clamped; a **small set of measurements first**, and the full set only if the user asks
for it after seeing these.

## Verdict

- **Six personalities are now biases** (`src/game/human.js`): Steady, Score chaser, Cautious, Panicky, Tunnel vision
  and Distracted, each at any skill 0–100 (`presetKnobs(name, skill)`, `settingByName('Panicky 70')`). The Ace and the
  Expert stay fixed menu entries. The slider itself (H3's curve) is unchanged.
- **The page:** choosing a personality puts the slider at 50; moving the slider keeps the personality (the label
  and the tape say "Panicky 80"). On the Ace or the Expert the slider gives the plain slider ("custom (skill N)"), as
  before. A stored "Steady veteran" or "Cautious beginner" setting is read as Steady or Cautious.
- **Small measurement set** (local, 540 runs, 20 min: each personality at skill 0, 50 and 100 × stages 1–10 × seeds
  1–3 × bot seed 1; `results/h3b-small.json`, compared with the slider's own runs on the same seeds in
  `results/h3b-small-vs-slider.md`):
  - every personality gets better with skill: 0 < 50 < 100 in clears, survival and lives lost per minute;
  - at the default skill 50 they **spread across the slider**: Score chaser ≈ 16, Panicky ≈ 34, Distracted ≈ 40–52,
    Tunnel vision ≈ 58–60, Cautious ≈ 75, Steady ≈ 76 (the plain slider at 50 is, by definition, 50). Under the old fixed
    stats four of them sat together at ≈ 7–28;
  - their characters show: Panicky clears the calm stages 1 and 3 every time at 50 and none of stages 6–10; Distracted
    has 12 lapses a run; Tunnel vision misses 51 bullets per look. The **Score chaser at skill 100 outscores everyone**,
    the Ace included (4.18 M against the Expert's 3.09 M and the Ace's 3.64 M), with 0.07 lives lost per run;
  - **at skill 100 the flaws hardly cost anything**: all six clear all 30 runs, and Panicky and Distracted lose 0.1 lives
    per run. Their knobs differ from the Expert's, but the Expert's planning, every frame with a 48-frame horizon,
    covers for them. See question 2.
- Tests: `npm test` and `npm run test:browser` green (the page plays Node's moves for Distracted 50, Panicky 80 and
  skill 30); all 34 bot tapes re-record the same (the Expert's and the Ace's byte for byte, the H2 tapes from their own
  records); `npm run compare-native` (wrap) 137/137.

## How a bias works

At skill s the slider is at path position p = `skillPosition(s)` (H3). A personality changes knobs in three ways:

| Kind | For | What it does |
|---|---|---|
| **shift** | the skill-ordered knobs (reaction, attention, lapses, panic effects, …) | the knob is taken from the path that many path units away from p: −40 = that faculty as it is 40 path units lower. Never above the Expert. |
| **mul** | the habits (margins, top line, attack height, panic thresholds) | the slider's value at p times this factor |
| **set** | star greed | this value at any skill |

Values go on the knob's grid and inside its range. A personality's knobs are monotonic in skill on every
skill-ordered knob, and never beyond the Expert's (`test/bot.test.mjs` checks every skill 0–100).

**Below the beginner (⚖ "if meaningful, keep them").** A shift can ask for a faculty below the beginner's (path < 0).
The knob then continues along the path's own trend, down to path −150, and is clamped to its range. I judged that
meaningful, so it is kept. The values it gives at skill 0 are still within the human-factors ranges of the H2 report:

- Tunnel vision: attention 33 px and 8 bullets (tracking ~4–8 objects);
- Distracted: 7.5 lapses a minute of ~0.5 s (a tired observer's PVT);
- Panicky: +16 frames (256 ms) of reaction and ±6 px of misjudgement at full panic.

At skill 0 it makes little difference to the outcome, because the beginner already dies in about a minute.

**Steady (⚖ the exception at 100).** Its bias shrinks with the path position, by the factor (100 − p)/100, so it is
gone at the Expert: Steady 100 = the Expert exactly.

### The biases (first proposal)

| Personality | Bias | At skill 50 (p 30) | At skill 100 |
|---|---|---|---|
| **Steady** | shift +30 on reaction, misjudgement, horizon, replanning, overshoot, panic effects; +40 on lapses; margins ×1.3 (bullets) and ×1.2 (spawners); fades to nothing at 100 | reaction 10 frames (slider 14), horizon 32 (26), replans every 2 frames (3), 1.3 lapses/min (2.1), margin 7.5 px (6.25) | the Expert |
| **Score chaser** | margins ×0.5 (bullets), ×0.75 (spawners); top line ×0.75; attack height ×0.65; star greed 0.02 | margin 3 px, attacks at 181 px (279), top line 146 | margin 1 px, attacks at 104 px, top line 102 (the old preset's habits) |
| **Cautious** | margins ×1.5; top line ×1.2; attack height ×1.25 | margin 9.25 px, attacks at 349 px | margin 3 px, attacks at 200 px |
| **Panicky** | shift −100 on the panic effects (reaction, misjudgement, slow-mashing); panic thresholds ×0.6 | panic from 44 to 135 bullets; at full panic +14 frames, ±5 px, mashes slow at 0.5 | panic from 90 to 240 bullets; +8 frames, ±3 px, 0.3 (the beginner's panic) |
| **Tunnel vision** | shift −80 on attention radius, −30 on attention count | 54 px, 24 bullets (slider 194 px, 74) | 166 px, 332 bullets |
| **Distracted** | shift −150 on lapse rate, −40 on lapse length | 6.6 lapses/min of 26 frames (slider 2.1 of 17) | 4.5 lapses/min of 10 frames |

At skill 50 the flaws match the old presets' (Tunnel vision 64 px, Distracted 8 lapses of 30 frames, Panicky +14
frames / 4 px / 0.6). The rest of the knobs are now the slider's.

## The small measurement set

Each personality at skill 0, 50, 100 on stages 1–10 × seeds 1–3 × bot seed 1 (30 runs each; the slider's own runs on
the same 30 cells from `results/h3-local.json`). ≈ skill = the slider level with the same clears / survival.

| Setting | Cleared | Survival (s) | ≈ skill | Lost / min | Mean score | Clears per stage 1–10 (of 3) |
|---|---:|---:|---:|---:|---:|---|
| slider 0 / 50 / 100 | 0 / 14 / 30 | 61.6 / 136.5 / 180 | — | 3.39 / 1.83 / 0 | 0.23 / 1.11 / 3.09 M | 0000000000 / 3331111100 / all |
| Steady 0 | 3 | 75.2 | 13–15 | 2.83 | 0.32 M | 1110000000 |
| **Steady 50** | 27 | 170.8 | **76–77** | 0.92 | 1.49 M | 3333332322 |
| Steady 100 | 30 | 180 | = Expert | 0 | 3.09 M | all |
| Score chaser 0 | 0 | 41.5 | < 0 | 4.54 | 0.17 M | 0000000000 |
| **Score chaser 50** | 3 | 86.0 | **15–17** | 3.16 | 0.77 M | 1110000000 |
| Score chaser 100 | 30 | 180 | ≥ 90 | 0.03 | **4.18 M** | all |
| Cautious 0 | 5 | 88.4 | 18–20 | 2.42 | 0.35 M | 2030000000 |
| **Cautious 50** | 26 | 167.2 | **74–75** | 1.07 | 1.31 M | 3333333320 |
| Cautious 100 | 30 | 180 | ≥ 90 | 0 | 2.68 M | all |
| Panicky 0 | 0 | 58.3 | ≤ 0 | 3.41 | 0.22 M | 0000000000 |
| **Panicky 50** | 10 | 124.9 | **33–35** | 2.03 | 0.96 M | 3131200000 |
| Panicky 100 | 30 | 180 | ≥ 90 | 0.04 | 2.84 M | all |
| Tunnel vision 0 | 1 | 63.8 | 4–10 | 3.29 | 0.28 M | 0010000000 |
| **Tunnel vision 50** | 18 | 148.9 | **58–60** | 1.90 | 1.22 M | 3331222110 |
| Tunnel vision 100 | 30 | 180 | ≥ 90 | 0 | 3.02 M | all |
| Distracted 0 | 1 | 65.9 | 7–10 | 3.16 | 0.26 M | 1000000000 |
| **Distracted 50** | 14 | 138.9 | **40–52** | 1.93 | 1.08 M | 3132112010 |
| Distracted 100 | 30 | 180 | ≥ 90 | 0.04 | 3.02 M | all |

(With one bot seed, the slider's own 30-run subset is only weakly monotonic: skill 40 and 50 both clear 14. So read
the ≈ skill column to ±5–10.)

What it says:

- **Monotonic in skill**, every personality.
- **Spread at 50**, in an order that fits the characters: the risk-taker lowest, then the one who falls apart under
  load, the inattentive one, the narrow-sighted one, and the two careful ones on top.
- **Cautious is as strong as Steady at 50.** A larger margin and staying low are a big help to a mid-level player (the
  margin is the strongest single lever I have seen). Cautious pays in score at the top (2.68 M at 100 against the
  Expert's 3.09 M, with fewer kills and stars), not in survival.
- **Score chaser:** weak at 50, where a 3 px margin and attacking at 181 px are too much for its mid-level eyes and
  hands. At 100 it is the best scorer in the game, collecting 3.03 M in stars against the Expert's 2.01 M.
- **The flaws fade in effect at the top**, though not in their knobs (question 2).

## Questions for the user

1. **The full set?** Proposed: every personality at skill 0, 25, 50, 75 and 100, with 2 bot seeds (1,770 runs, ~1.5
   CPU-hours, ~10 min on 16 CI runners), after `h3-calibrate` and this branch are merged:

   ```
   gh workflow run h2-sweep.yml --ref main -f name=h3b-personalities \
     -f presets="Steady,Score chaser,Cautious,Panicky,Tunnel vision,Distracted" -f skills=0,50,100 \
     -f variants=attack -f stages=1,2,3,4,5,6,7,8,9,10 -f seeds=1,2,3 -f bot_seeds=1,2 \
     -f extra="--preset-skills 0,25,50,75,100" -f shards=16
   ```
   (`skills=0,50,100` adds the slider's own levels to compare; locally: the same options with `node bin/h2-sweep.mjs`.)
2. **Should the flaws show at skill 100?** Today they hardly do: Panicky and Distracted lose 0.1 lives per run, the others
   none. Stronger biases at the top would make an "Expert with tunnel vision" visibly fallible. Options: leave it (a
   flaw matters less the better you are, which is plausible), or scale each flaw up with skill so that it costs, say,
   ~10 skill points everywhere.
3. **Cautious ≈ Steady at 50.** Fine (careful players survive), or should Cautious pay more, e.g. fewer kills from
   attacking lower still, or a slower reaction?
4. **Score chaser at 50 ≈ 16.** Fine (a reckless mid-level player), or soften its margin at low skills (×0.5 → ×0.7) so
   it lands nearer 30–40?

## Files

- `src/game/human.js`: `PATH_LOW_KNOBS` (the slider's 0, H2's beginner; no longer a menu entry), `PATH_MIN`,
  `biasedKnobs`, `presetKnobs`, `DEFAULT_SKILL`; the personalities as biases; `settingByName('Name N')`.
- `web/play.js`, `play.html`: the personality keeps its biases while the slider moves; it starts at 50; the renames.
- `bin/h2-sweep.mjs`: `--preset-skills` (each personality at each of these skills); "Name N" players.
- `test/bot.test.mjs`, `test/browser.test.mjs`: the personalities at every skill (on the grid, one way, never beyond
  the Expert, Steady 100 = the Expert, the others not); "Panicky 90" reproducible; the page at Panicky 80.
- `results/h3b-small.json` (the 540 runs), `results/h3b-small-vs-slider.md` (with the slider's runs on the same cells).
- The old H2 preset tapes in `tapes/h2/` (`cautious-beginner-…`, `steady-veteran-…`, …) are kept: they carry their own
  knobs and still replay, as the H2 presets they were.
