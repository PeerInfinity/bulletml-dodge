# bulletml-dodge

**Play it:** https://peerinfinity.github.io/bulletml-dodge/play.html — Kenta Cho's Noiz2sa (BSD), ported to
the browser and verified frame by frame against a native build; press B to let the bot play (the G4 bot, in a Web Worker).

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
- `play.html` — **Noiz2sa in the browser** (slice G3; `docs/g3-report.md`): stage select (stages 1–10 and the
  four endless modes), keyboard play (arrows/WASD, Z fire, X slow, P pause, Esc back), simple drawing, the game's
  own sounds and music, a bot toggle (B; the test policies of `src/game/policies.js`), tape replay and recording.
  It runs the same engine modules as Node; an import map points `@xmldom/xmldom` at the browser's `DOMParser`.
  `npm run test:browser` checks it in headless Chromium against Node.
- `src/game/policies.js` — the test policies (`lookahead`, `chase`, `random`, `fire-stay`), shared by
  `bin/play-game.mjs` and the page; `src/game/tape.js` — tape encoding and replay.
- `src/game/bot.js` — **the G4 bot** (`docs/g4-report.md`), shared by Node and the page: survival first (an exact
  look-ahead on copies of the game: a committed plan of `horizon` frames, extended one frame per frame and repaired
  when it runs into a hit), then attack (get under an enemy and fire), stars a hook. Two variants, `attack` and
  `no-attack`; the budget is a count of simulated frames (reproducible), calibrated to the browser's 16 ms frame.
  In `play.html` it thinks in a Web Worker (`web/bot-worker.js`). `src/game/bot-run.js` plays one headless run.
- `bin/bot-sweep.mjs` — the bot on every stage × variant × seed × budget, and the look-ahead needed, in worker
  processes → `results/g4-bot.md`, `results/g4-bot.json`; tapes in `tapes/g4/` (they replay in the page).
- `src/game/perception.js` — **the Expert's eyes** (slice H1, `docs/h1-report.md`): the observed world model.
  Bullets and enemies continue as seen moving (turning if seen turning); nothing new appears until it is fired.
  `makeBot({perception: 'observed'})` plans on it instead of on a copy of the seeded game (the Ace); in the page it is
  "bot: expert …". `src/game/h1-diagnose.js` explains each lost life.
- `bin/h1-sweep.mjs` (or `bin/bot-sweep.mjs --perception observed|omniscient|both`) — the Expert vs the Ace and the
  look-ahead needed, sharded (`--shard i/N`, then `--merge --expect N`) → `results/h1-bot.md`; it runs as GitHub
  Actions shards (`.github/workflows/sweep.yml`, dispatched by hand). `.github/workflows/test.yml` is the test gate.
- `bin/build-web-index.mjs` (`npm run web-index`) — writes `web/index/` (the pattern order and the tape list the
  page needs); re-run it after adding a tape or a pattern (`npm run test:browser` refuses a stale index).
- `patterns/noiz2sa/` — the 73 patterns from Noiz2sa 0.52 (BSD; licence text beside them).

```
npm install
node bin/run-pattern.mjs "patterns/noiz2sa/boss/[Progear]_round_1_boss_grow_bullets.xml" --seeds 2 --ranks 0.5,1
node bin/sweep.mjs patterns/noiz2sa --jobs 4   # → results/noiz2sa.md
python3 -m http.server 8765   # then open http://127.0.0.1:8765/viewer.html?trace=traces/…json
                              #   or http://127.0.0.1:8765/play.html to play
npm run test:browser          # the page vs Node, keyboard, screenshots (needs `npx playwright install chromium` once)
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

MIT (`LICENSE`). The ported libBulletML and Noiz2sa parts keep their BSD notices (`NOTICE.md`); the sounds and
music in `web/sounds/` are Noiz2sa 0.52's own (BSD, licence text beside them).
