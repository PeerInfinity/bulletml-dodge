# H1b report — the Expert keeps a safety margin and attacks from higher up

Slice H1b of `docs/humanlike-plan.md`, 2026-10-04, branch `h1b-expert`. The two open decisions of `docs/h1-report.md`
(a margin for the Expert; tuning its attack), ⚖ the user, 2026-10-04: *"Yes to both"*.

**Baseline:** the CI sweep `results/h1-bot.md` at `978da7e` (stages 1–10, seeds 1–3, horizon 48, budget 1×). The
Expert attack lost **10 lives in 30 runs** and scored a mean **2.46 M** (the Ace: 0 lost, 3.64 M). Every death was a
bullet it could not have seen. It was fired in the hit's own frame, or it was a dot not yet moving, from a spawner
2–6 px from the ship.

## Verdict (local, before the CI sweep)

Stages 1–10 attack × seeds 1–3, horizon 48, budget 1×, with the new defaults:

| | Lives lost (30 runs) | Mean score | Of the Ace's |
|---|---:|---:|---:|
| Ace (baseline, unchanged) | 0 | 3,640,571 | 100% |
| H1 Expert (baseline) | 10 | 2,462,746 | 68% |
| **H1b Expert** | **0** | **3,089,185** | **85%** |

- **No-attack**, stages 1–10 × 3 seeds: all 30 survive 3 minutes of the boss with 0 lives lost, as in the baseline. The
  mean surprises per run fall from 420 to 140: the margin keeps it out of trouble it used to repair.
- **ENDLESS attack**, seeds 1–3: 0 lives lost (baseline 4), mean score 7,988,477 (baseline 6,748,063; the Ace
  8,631,037).
- Safety first: no setting was kept that lost more lives than the baseline anywhere it was measured. The defaults lost
  none in the 63 final runs.

**The full comparison is the coordinator's to run in CI** ([the command](#what-the-coordinator-runs)).

## What changed

### 1. The safety margin (`src/game/perception.js`: `makeMargin`, `stepModel(…, margin)`)

The Expert's model now also reports, per predicted frame, whether the ship came **inside the margin** (`m.near`). The
margin has three parts, each a setting in px:

| Setting | The ship keeps away from | Why |
|---|---|---|
| `bullet` | a bullet's **drawn trail**: the segment from its trail end to its head, ends included | the engine hits only within 2 px of the segment's inside. The Expert used to graze bullets at 2.1 px; a human dodges the bullet they see (drawn 6 px wide in the page) |
| `spawner` | the position of anything that can **fire** a bullet next frame: an enemy, an active (bullet-firing) bullet, a dot not yet moving | a new bullet appears at its spawner and moves in that same frame, so no observer can see it before it hits. Only distance protects from it |
| `top` | the band near the top where enemies **appear** (48–128 px down, at random), plus the spawner clearance: the ship stays below this line | an enemy can appear on top of a ship inside that band and fire at once |

Nothing counts while the ship is invincible. The arithmetic is still +, −, ×, ÷ only, so Node and the browser get the
same numbers. These are the H2 "perceived bullet size" knobs: H2 can make them smaller, larger or noisy.

### 2. How the bot uses it (`src/game/bot.js`)

- **Survival comes first, then the margin.** Plans are compared lexicographically:
  1. a later first hit (as before);
  2. **a later first margin breach** (new);
  3. attack value;
  4. position + room.

  A plan inside the margin is never preferred over a plan that survives longer. When no plan keeps the margin, the
  bot still takes the safest one.
- **Repairs.** The plan keeps two lists, `hits` and `nears`. A margin breach in the plan triggers a repair like a hit
  does (the branch points start before the first breach). A margin repair that fails waits K = 4 frames before the
  next try, as a failed hit repair does.
  - ⚠ The two waits are **separate clocks**: a margin repair that failed never holds up the repair of a hit. The first
    version shared one clock. That cost a life (stage 7 seed 1, at attack height 288): an active bullet at 11 px/frame
    reached the ship while its repair waited.
- **The beam search** ranks its nodes by their first breach, then by room + value.
- **`stats.nearFails`** counts the repairs that could not keep the margin.

### 3. The attack: `attackY` (`src/game/bot.js`)

**Why the Expert scored ⅔ of the Ace.** Stage 1, seed 1, measured per kill:

| | Ace | H1 Expert |
|---|---:|---:|
| mean ship height (from the top, before the boss) | **188 px** | **371 px** |
| enemies killed that re-appeared at the spot where the last one appeared ("quick" spawns) | 467 | 201 |
| median age of those enemies at the kill | 11 frames | 17 frames |
| zako (small enemy) kills | 536 | 272 |
| star score | 1.50 M | 0.68 M |

Enemies appear at random in a band near the top (y 48–128 px). One type re-appears at once, at the same spot, when the
last one of it dies. Several things follow from that:
- The Ace sits right under that spot and kills each one as it appears. Each kill wipes nearby bullets into stars.
- The Expert did not lag or give up after surprises. It simply attacked from its home row (384 px, 4/5 down). Its plans
  value the kills they can see, and a visible enemy is killed from 384 px about as surely as from 190 px, so nothing
  pulled it up.
- From up close the shots arrive sooner. The enemy dies sooner, and the next one appears sooner.

**`attackY`** (px from the top) is the height the attacking Expert heads for: the target of its tail controller and of
its position score. The Ace and no-attack keep the home row. The Ace's plans find their own height, and its moves are
unchanged.

**Tried and dropped: `spawnMemory`.** With no enemy above it, the Expert waited under the spot where it last saw an enemy
appear. It added nothing at 240 px (3.35 M vs 3.33 M) and lost a life at 192 px (3.46 M vs 3.59 M, 1 life lost), so
it was removed.

## How the defaults were chosen (local measurements)

**The set:** stages 6, 7, 9, 10, attack, seeds 1–3 (12 runs), horizon 48, budget 1×. These are the stages where the
baseline lost 9 of its 10 lives.

| Set (12 runs) | Lives lost | Mean score |
|---|---:|---:|
| Ace | 0 | 4,053,428 |
| H1 Expert (baseline, CI) | 9 | 3,035,299 |

**Step 1: the margin** (`bullet` / `spawner` px; home row, no `top`):

| bullet / spawner | Lives lost | Mean score |
|---|---:|---:|
| 0 / 8 | 0 | 3,103,248 |
| 1 / 6 | 0 | 3,085,251 |
| 2 / 4 | 0 | 3,063,592 |
| 2 / 6 | 0 | 2,847,275 |
| **2 / 8** | **0** | **2,957,468** |
| 3 / 10 | 0 | 2,740,376 |
| 4 / 12 | 0 | 2,642,762 |

- Every margin removes all 9 deaths.
- The score falls slowly as the margin grows. The run-to-run noise is ~±0.1–0.2 M: the order is not monotone.
- The rows other than 2 / 8 ran before the separate-clock fix above. That fix only touches safety: 2 / 8 scored
  2,960,661 before it and 2,957,468 after.
- **Spawner 8 px** was chosen. The baseline's spawners were 2–6 px away, and the fastest children seen there move
  5.6 px/frame. 4 px left no room for them.

**Step 2: the attack height** (margin 2 / 8):

| attackY | Lives lost | Mean score |
|---|---:|---:|
| 384 (home) | 0 | 2,957,468 |
| 240 | 0 | 3,330,012 |
| 192 | 0 | 3,587,079 |
| **160** | **0** | **3,642,698** |
| 128 | 0 | 3,659,433 |
| 96 | **6** | 3,330,908 |

- The score rises up to 160–128 px, then falls off a cliff.
- At 96 px the ship sits where the **boss appears** (the screen's centre, 96 px down). Stage 9 seed 1 dies in frame
  9,010, the boss's first frame, to its first volley, fired 0 px away.
- **160 px** was chosen: as good as 128 px (within noise) and 64 px clear of the cliff.

**Step 3: the bullet margin at that height** (attackY 160, spawner 8):

| bullet | Lives lost | Mean score |
|---|---:|---:|
| 0 | **1** (stage 7 seed 1: a dot not yet moving, from an active bullet) | 3,695,555 |
| **2** | **0** | **3,642,698** |
| 3 | 0 | 3,481,809 |

- At the home row the bullet margin bought nothing measurable. Once the Expert attacks from higher up, it is the
  difference between 0 and 1 lost.
- **2 px** was chosen. 3 px (half the drawn width) is safe too, but costs 0.16 M.

**Step 4: the `top` line.** With margin 2 / 8 and attackY 160, the first broad check (stages 1–10 and ENDLESS × 3
seeds) lost 0 lives on stages 1–10, but 1 on ENDLESS seed 3:
- frame 6,469: an enemy appeared 4 px from the ship and fired in that frame;
- nothing had been within 30 px of the ship the frame before;
- the ship had drifted up to 115 px, inside the band where enemies appear: its plans valued an earlier kill.

| (attackY 160, margin 2 / 8) | stages 6, 7, 9, 10: lost / mean | ENDLESS seeds 1–3: lost / mean |
|---|---|---|
| no `top` | 0 / 3,642,698 | 1 / 7,009,903 |
| **`top` 136** (128 + the spawner's 8) | **0 / 3,681,466** | **0 / 7,988,477** |

It costs nothing measurable, so it is on.

## Defaults

`EXPERT_DEFAULTS` in `src/game/bot.js`; `makeBot` uses them for `perception: 'observed'` when not given others:

```js
{ margin: { bullet: 2, spawner: 8, top: 136 }, attackY: 160 }
```

- **The Ace takes none of it.** `makeBot` throws if the Ace is given a margin or an attackY.
- **The H1 Expert is still there:** `makeBot({ perception: 'observed', margin: null, attackY: null })`.
- **The tape records the settings in use:** `bot: {variant, horizon, budget, perception: 'observed', margin, attackY}`,
  in Node's runs and the page's alike.
- **For the sweep:** `--expert '<json>'` overrides them for ablations, e.g. `--expert {"margin":null,"attackY":null}`
  = the H1 Expert. Its runs get their own part keys, and the merge only takes rows of its own settings. The results'
  header now names the Expert's settings.

## Before / after on the small sets (local, horizon 48, budget 1×)

**Attack, stages 1–10 and ENDLESS × seeds 1–3** (the final defaults; the Ace and the H1 Expert are the CI baseline,
`results/h1-bot.md`). Lives lost per seed 1 / 2 / 3, then the mean score:

| Stage | Ace lives lost | Ace score | H1 Expert lives lost | H1 Expert score | H1b Expert lives lost | H1b Expert score |
|---|---|---:|---|---:|---|---:|
| 1 | 0 / 0 / 0 | 2,494,263 | 0 / 0 / 0 | 1,218,980 | 0 / 0 / 0 | 1,622,963 |
| 2 | 0 / 0 / 0 | 4,334,687 | 1 / 0 / 0 | 2,321,690 | 0 / 0 / 0 | 3,368,287 |
| 3 | 0 / 0 / 0 | 3,002,980 | 0 / 0 / 0 | 1,781,900 | 0 / 0 / 0 | 2,428,700 |
| 4 | 0 / 0 / 0 | 2,517,520 | 0 / 0 / 0 | 1,658,967 | 0 / 0 / 0 | 2,336,573 |
| 5 | 0 / 0 / 0 | 4,347,913 | 0 / 0 / 0 | 2,290,183 | 0 / 0 / 0 | 3,011,113 |
| 6 | 0 / 0 / 0 | 3,827,440 | 1 / 0 / 0 | 2,267,417 | 0 / 0 / 0 | 3,051,950 |
| 7 | 0 / 0 / 0 | 3,409,663 | 1 / 1 / 0 | 2,665,840 | 0 / 0 / 0 | 3,104,870 |
| 8 | 0 / 0 / 0 | 3,494,637 | 0 / 0 / 0 | 3,214,547 | 0 / 0 / 0 | 3,398,353 |
| 9 | 0 / 0 / 0 | 4,099,793 | 1 / 1 / 0 | 3,032,800 | 0 / 0 / 0 | 3,999,093 |
| 10 | 0 / 0 / 0 | 4,876,817 | 1 / 1 / 2 | 4,175,140 | 0 / 0 / 0 | 4,569,950 |
| **1–10** | **0** | **3,640,571** | **10** | **2,462,746** | **0** | **3,089,185** |
| ENDLESS | 0 / 0 / 0 | 8,631,037 | 0 / 2 / 2 | 6,748,063 | 0 / 0 / 0 | 7,988,477 |

- **Every stage clears**, as before.
- **The gain is mostly stars:**
  - star score per run is 1.52 M → 2.01 M (+33%);
  - zako kills over the 30 runs are 9,078 → 9,744 (+7%);
  - kills of the larger enemies are unchanged.
- **Higher up, each kill's wipe makes its stars nearer the ship,** and the star value (`bonusScore`, up to 1,000 a
  star) climbs further before a star is lost.
- **Surprises per run** (attack) rise a little: 46 → 58. Attacking from higher up, bullets arrive sooner after they
  are fired. 1 margin repair per run fails on average.

**No-attack, stages 1–10 × seeds 1–3** (the final defaults): all 30 survive 3 minutes of the boss, 0 lives lost (the
baseline: the same). The no-attack Expert stays on the home row, so only the margin applies to it.

**The hard set** (stages 6, 7, 9, 10 attack, 12 runs): lives lost 9 → 0, mean score 3,035,299 → 3,681,466 (the Ace
4,053,428).

## What the coordinator runs

The same arguments as the baseline. After merging `h1b-expert` to main:

```
gh workflow run sweep.yml --ref main -f name=h1b-bot -f perception=both -f variants=attack,no-attack \
  -f stages=1,2,3,4,5,6,7,8,9,10,ENDLESS -f seeds=1,2,3 -f horizons=0,4,8,16,32,48,64,96 -f budget=1 -f shards=16
gh run download <run-id> -n sweep-h1b-bot     # then commit results/h1b-bot.{md,json} and tapes/h1/
```

- **Compare with `results/h1-bot.md`.** The Ace's rows must be identical: its moves did not change.
- **Expected time:** like H1's (16 shards, ~6 min wall). The Expert now repairs margin breaches too, and its model frame
  costs ~10–20% more CPU (see below). Allow up to ~10 min.
- **The tapes:** the Expert's main-run tapes go to `tapes/h1/` under the same names as H1's, so committing them
  replaces the H1 Expert's tapes with the H1b Expert's. That is intended: the page's Expert is the H1b Expert.
- **Optional, the ablation** (the H1 Expert on the same code, to separate the margin's and the attack's shares):

  ```
  gh workflow run sweep.yml --ref main -f name=h1b-ablation-h1 -f perception=observed -f variants=attack \
    -f stages=1,2,3,4,5,6,7,8,9,10,ENDLESS -f seeds=1,2,3 -f horizons=none -f budget=1 -f shards=4 \
    -f extra='--expert {"margin":null,"attackY":null}'
  ```

## Rules kept

- **The engine is unchanged.** `sh native/build.sh`, then
  `npm run compare-native -- --native native/build/noiz2sa-headless-wrap --require-native`: **137/137** tapes identical.
  `src/game/noiz2sa-game.js` is untouched.
- **The Ace's moves are unchanged.** Eight G4 tapes re-record byte for byte: stages 1, 3, 6 and 10, attack and no-attack, seed 1, budget 1×
(`node bin/check-g4-tapes.mjs tapes/g4/s01-attack-seed1-b1x.json …`: *all 8 tapes the same*). Why:
  - With no margin every plan's first breach is its first hit or ∞, so the new comparison key never decides between
    two of the Ace's plans.
  - The beam's new sort key is ∞ for all of the Ace's nodes.
  - The margin's repair clock never starts for the Ace.
- **Determinism.** `npm test` (new section 6) checks:
  - the same seed and settings give the same tape twice, and the tape replays to the run's game, for the Expert with
    its defaults and with none;
  - the tape records the settings;
  - the margin's geometry: a bullet passing 3 px away is inside a 4 px margin and outside a 2 px one; an enemy 6 px
    away is inside an 8 px spawner margin; a dot not yet moving counts as a spawner; nothing counts while invincible;
  - the Ace refuses Expert settings.
- **The page plays Node's moves.** `npm run test:browser`: green.
  - The Expert from stage 10 frame 8,900 runs at 62.5 frames/s with 0 waits, and the page's 435 frames equal Node's,
    input for input.
  - The tape records `{…, perception: 'observed', margin: {bullet: 2, spawner: 8, top: 136}, attackY: 160}`.
  - Worker CPU: **8.2 ms/frame mean, 141 ms max** (H1: 4.3 ms and 110 ms). The rest of the frame is still free, and
    the worker's 180-frame lead covers the peaks.
- **`npm test` is green**, and so is the web index check (`node bin/build-web-index.mjs --check`).

## Cost

The margin adds a box test per object per predicted frame, and the distance test near the ship.
- **Measured:** 5.0–5.3 µs → 5.9–6.5 µs per model frame (stage 10, `tapes/g4/s10-attack-seed1-b1x.json`, every 100
  frames, 48-frame rollouts, on a loaded 4-core box). That is ~10–25% more CPU per budget unit.
- **Not refitted:** the budget units (`MODEL_BASE`, `MODEL_FOES`). "Budget 1×" is still a count, so runs are
  reproducible; it now buys the Expert ~10–25% more CPU than the Ace.
- **In the page** (stage 10 from frame 8,900): the Expert's worker takes 8.2 ms/frame mean, 141 ms max (H1: 4.3 ms,
  110 ms). That is its more frequent repairs plus the margin test. It still holds 62.5 frames/s with 0 waits.
- **Repairs:** the Expert also repairs margin breaches, so its budget goes to safety before attack. That costs score
  only when the bank runs dry.

## Open questions

1. **Run the CI sweep** (above) and commit `results/h1b-bot.*` and `tapes/h1/`, then run `npm run web-index`.
2. **The remaining gap to the Ace** (~85% of its score). That is foresight: the Ace knows where the next enemy
   will appear and waits under it. Spawn memory did not close it. A further step would be learning the "quick" respawn
   rule as a player would: one type comes back at once, at the same spot, when its last one dies. That is knowledge of
   the game's rules, not of `rand()`, and it is a question for the user whether the Expert should have it.
3. **Refit the model's budget units with the margin on**, so that budget 1× is again the same CPU for both bots. It
   changes the Expert's moves a little, so it is left for the coordinator to decide.
4. **For H2:** `margin.bullet`, `margin.spawner` and `margin.top` are the "perceived bullet size" knobs, and `attackY`
   is the "preferred height" habit (Score chaser: higher; Cautious beginner: the home row). The monotonic-in-skill
   target should hold: on this set every margin from 2 / 4 to 4 / 12 lost no lives, and the score fell as it grew.
