# bulletml-dodge

Bots that dodge BulletML patterns, to find out which patterns can be dodged with
simple reflexes and which need planning.

- `src/bulletml.js` — BulletML parser + runner, a JS port of libBulletML 0.0.6 whose
  state is plain data (so a bot can copy a world and search ahead).
- `src/noiz2sa.js` — Noiz2sa's bullet world with Kenta Cho's integer arithmetic
  (320×480 field in 1/256 px, 1024-step angles, ship 5 px/frame or 2.5 slowed,
  a 2 px hit radius around each bullet's swept trail). One foe runs one pattern.
- `src/bots.js` — the REFLEX bot (sees only bullets' current positions and motion,
  extrapolated in straight lines for 8 frames) and the PLANNER (beam search H
  frames ahead against the real simulation).
- `bin/run-pattern.mjs <pattern.xml>` — per seed and rank: does the reflex bot
  survive, and if not, the smallest planner horizon H (2, 4, … 64) that does.
  `--trace out.json` writes a replay.
- `bin/sweep.mjs <dir> [--jobs N] [--timeout-min M] [-- run-pattern options]` — every pattern under
  `<dir>`, N at a time; writes `results/<name>.json` and `results/<name>.md`.
- `viewer.html?trace=traces/<name>.json` — replay viewer (serve the directory over HTTP).
- `src/game/` — **the whole of Noiz2sa** (slice G1 of `docs/noiz2sa-plan.md`): stages, enemies, shots,
  stars, lives, scoring, with the C's integer and float arithmetic, its pools, the stage LCG and glibc's
  `rand()` (`crand.js`). Headless and deterministic; `cloneGame` copies a game for look-ahead.
- `bin/play-game.mjs --stage N [--policy chase|random|fire-stay] [--tape t.json] [--save-tape] [--dump]` —
  play a stage headless; `npm test` checks replay, cloning and the stage-clear path.
- `patterns/noiz2sa/` — the 73 patterns from Noiz2sa 0.52 (BSD; licence text beside them).

```
npm install
node bin/run-pattern.mjs "patterns/noiz2sa/boss/[Progear]_round_1_boss_grow_bullets.xml" --seeds 2 --ranks 0.5,1
node bin/sweep.mjs patterns/noiz2sa --jobs 4   # → results/noiz2sa.md
python3 -m http.server 8765   # then open http://127.0.0.1:8765/viewer.html?trace=traces/…json
```

## What the measurements do and do not mean

- The bot only dodges: it never shoots, so no enemy dies and no bullets are
  wiped. Any hit ends the run. A single foe runs a single pattern.
- The planner copies the seeded world, so it knows the pattern's future `$rand`
  draws: H answers "is there a path at this horizon", not "could a player guess it".
- "Reflex fails, H=2 succeeds" partly measures the reflex bot's heuristic.
- Faithfulness to the original game is checked by eye (`viewer.html`), not yet by
  comparing against a build of Noiz2sa.

## Licence

MIT (`LICENSE`). The ported libBulletML and Noiz2sa parts keep their BSD notices (`NOTICE.md`).
