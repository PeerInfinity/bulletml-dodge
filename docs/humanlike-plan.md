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
- **Outcome targets** anchor the slider (first proposal): skill 0 rarely survives stage 1's first minute; skill 50 clears
  the early stages with losses; skill 100 (Expert) clears most stages but not all; and the curve of lives lost is
  **monotonic** in skill on every stage.
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
| **H1** | Perception model (observed vs omniscient) and the Expert level; look-ahead needed and outcomes on stages 1–10 (sharded sweep). |
| **H2** | The human knobs, the bot's own RNG, settings in the tape, stars on; the skill slider and the presets in the page (an advanced panel for the knobs). |
| **H3** | Calibration: sweeps per preset and skill level × stages × seeds; tune to the targets; monotonic curves; report. |

## Status

| Slice | State |
|---|---|
| **H1** | Built on branch `h1-perception` (`docs/h1-report.md`): `src/game/perception.js` (the observed model), `perception: 'observed'` in `src/game/bot.js`, the Expert in the page ("bot: expert attack / no-attack"), `bin/h1-sweep.mjs` (sharded; `bin/bot-sweep.mjs --perception observed` hands over to it), death diagnosis (`src/game/h1-diagnose.js`), the observed planner for single patterns (`bin/run-pattern.mjs --perception observed`). Results: see the report. |
| H2 | not started |
| H3 | not started |

