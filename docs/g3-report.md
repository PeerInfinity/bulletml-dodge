# G3 report — Noiz2sa in the browser

Slice G3 of `docs/noiz2sa-plan.md`, 2026-10-03.

## Verdict

**`play.html` plays Noiz2sa in the browser with the same engine modules as Node.** It has stage select (stages
1–10 and ENDLESS, HARD, EXTREME, INSANE), keyboard play as in the original, simple canvas drawing in the game's
colours, the game's own sounds and music, a bot toggle, and tape replay and recording. In headless Chromium,
**six tapes replayed in the page end on exactly the state line Node prints**, including two full-stage
`lookahead` clears and the 30,000-frame ENDLESS tape. A scripted keyboard game, the bot toggle, pause, Esc and
the recorded tape all pass (`npm run test:browser`, below). `npm test` stays green.

## How to run it

```
cd ~/CC/bulletml-dodge
python3 -m http.server 8765        # any static server, rooted at the repository
# open http://127.0.0.1:8765/play.html
npm run test:browser               # the headless check; serves the repo itself on a free port
```

- **Stage select:** arrows choose a stage, Z or Enter starts it. You can also click a stage.
- **In game:** arrows, WASD or the keypad move the ship. Z fires, X slows, P pauses, Esc returns to stage select.
  B toggles the bot and M toggles sound.
- **Below the screen:** the bot policy, a tape list and a file loader with replay speed (1–16×), "Download last
  tape", a seed field (blank = random), and mute.
- Nothing is deployed. No GitHub Pages: a first public deploy is the user's decision.

## What was built

- **`play.html` + `web/`.**
  - `web/play.js`: the modes, the keyboard, the fixed 16 ms step (`INTERVAL_BASE`) decoupled from
    `requestAnimationFrame`, at most 8 steps per display frame. A machine too slow to keep up slows the game
    down instead of spiralling.
  - `web/draw.js`: the drawing. `web/palette.js`: the game's 256-colour table, from `clrtbl.c`.
  - `web/sound.js`: the sounds.
  - `web/xmldom-shim.js`: the import-map target, so `src/bulletml.js` parses with the browser's `DOMParser`
    with no change for Node.
- **The pattern order over HTTP.** `bin/build-web-index.mjs` (`npm run web-index`) writes
  `web/index/patterns.json`, sorted by strcmp as `patterns-node.js` sorts. It also writes `web/index/tapes.json`.
  `src/game/patterns-web.js` loads them. `test:browser` fails on a stale index (`--check`).
- **Shared modules.**
  - `src/game/policies.js`: `makePolicy(name)` for `lookahead`, `chase`, `random` and `fire-stay`, moved out of
    `bin/play-game.mjs` unchanged.
  - `src/game/tape.js`: `tapeInputs`, `makeTape` and `replayTape`.
  - `bin/play-game.mjs` now imports both.
- **Engine: two sound-only events.**
  - `['shot']` fires when a shot enters the pool (`shot.c` plays chunk 0 only then).
  - `['damage', type]` is a hit that does not kill (chunk 1).
  - No state changed: the state lines are identical (below).
- **Sound mapping (from the C's `playChunk` calls).**

  | Event | Sound |
  |---|---|
  | shot | `shot.wav` |
  | damage | `hit.wav` |
  | kill | `foedst.wav`, or `bossdst.wav` for the boss |
  | ship hit | `shipdst.wav` |
  | star | `bonus.wav` |
  | extend | `extend.wav` |

  - Each effect plays on its own channel, so a replay cuts the previous one, as `Mix_PlayChannel(idx)` does.
  - Music: stage index s → `stg{s%5+1}.ogg`. ENDLESS, HARD and EXTREME play `stg0.ogg`; INSANE plays
    `stg00.ogg` (`noiz2sa.c initGame`). Stage clear and game over fade the music out over 1,280 ms.
  - Mute persists in `localStorage`.
- **Vendored sounds:** `web/sounds/` holds the 7 WAVs (440 KB) and 7 OGGs (8.3 MB) from the official 0.52 zip,
  unchanged, with the BSD licence text. `NOTICE.md` and the README say so.
- **Drawing (simple, ⚖):**
  - Enemies are boxes sized 30/40/56/96, growing in over 16 frames, with their shield as orbiting small boxes and
    a hit flash.
  - Bullets are thick lines along their swept segment. Shots are twin bars. Stars are four turning boxes.
  - The ship is drawn with its drums, blinks while invincible, and shows a 2 px hit point.
  - Explosion rings are a page-side effect only.
  - Panels show score, star chain, ships left, stage, scene (BOSS on the boss scene), frame, mode, bot and
    sound. STAGE CLEAR, GAME OVER and PAUSE are shown as messages.
- **Recording.**
  - Every game played in the page is kept as a tape when it returns to the title or on Esc.
  - It has the same fields as `play-game.mjs` writes (`game, stage, seed, endlessSeed, frames, inputs`), plus
    `player` (`human`, or `human+<policy>` if the bot played any of it).
  - A human game's `seed` and `endlessSeed` are random unless the seed field is set. With the field set,
    endlessSeed = 7919 × seed, the G2 convention.
- **Bot.** It plays only while the game is in progress. The stage-clear and game-over screens always take the
  keyboard, because a policy that always fires would hold them for the full 900 frames.

## Acceptance — measured

1. **Browser = Node** (`npm run test:browser`). For each tape, Node's reference is the last line of
   `bin/play-game.mjs --tape … --dump`, and the page's is `replayTape` in its own engine. They are equal on all 6:

   | Tape | Frames | End | Page time |
   |---|---:|---|---:|
   | s01-lookahead-seed1 | 10,494 | stage clear → title, score 1,711,710 | 0.35–1.3 s |
   | s10-lookahead-seed1 | 10,477 | stage clear → title, score 3,022,000 | 0.9–2.4 s |
   | s11-lookahead-seed1 (ENDLESS) | 30,000 | in game, scene 29, score 3,909,250 | 1.2–3.4 s |
   | s07-chase-seed2 | 5,690 | game over → title | 0.2–0.4 s |
   | s13-random-seed1 (EXTREME) | 1,078 | game over → title | 0.1–0.4 s |
   | s14-fire-stay-seed1 (INSANE) | 1,629 | game over → title | 0.1–0.3 s |

2. **Scripted keyboard game** (stage 1, seed 42):
   - Arrows move the stage-select cursor; Z starts the stage; the overlay hides.
   - Holding Z + Left for 60 frames moves the ship left (40960 → …) and fires shots; Right moves it back (→ 78848).
   - The panel's frame counter redraws.
   - B hands control to `lookahead`. It moves the ship with no key held, kills enemies (score 0 → 10,500–12,650
     by frame ~430), and the score panel redraws. B gives control back.
   - P holds the frame for 400 ms; P again resumes.
   - Esc returns to stage select.
   - The recorded tape (seed 42) replays, **in the page and in Node** (downloaded through the button, then
     `play-game.mjs --tape`), to exactly the state line the game was in when Esc was pressed.
   - Sound: 7/7 effects decode, the audio context is running, and `stg1.ogg` plays for stage 1. This was
     checked headless, so nobody heard it.
   - The suite passed on 4 consecutive runs after one fix (below).
3. **Screenshots** (`docs/g3-screens/`, checked by eye):
   - `stage-select.png`
   - `play.png`: the bot playing stage 1.
   - `replay-mid-stage.png`: s05-lookahead at frame 6,000, paused, with a big enemy, bullets, stars and shots.
   - `stage-clear.png`: s01-lookahead replayed to its STAGE CLEAR.

   The first screenshots exposed three defects, all fixed and now asserted where testable:
   - the stage-select overlay stayed on screen during play (CSS `display:flex` beat `hidden`);
   - the boss scene read "SCENE 10" (`setBarrages` counts the scene up as it starts it, so the boss scene is 9);
   - a long tape name ran into the field.
4. **`npm test`** is green.

**The policy move changed nothing.** Before the move, the existing code re-recorded all 126 smoke tapes
(`chase`, `random`, `fire-stay` × 14 stages × 3 seeds) byte for byte. After the move, with the new events, it
still does: 126/126. `npm run compare-native` against the wrap build: **137/137 identical** (47 s).

⚠ **The committed `s01-lookahead-seed1` tape is NOT reproduced by re-recording, and that predates G3.** Running
`play-game.mjs --stage 0 --seed 1 --endless-seed 7919 --policy lookahead` gives 10,506 frames (score 1,696,490).
The committed tape has 10,494. **HEAD's own code (`344daf2`, in a throwaway worktree) gives the same 10,506-frame
tape byte for byte as the refactored code.** So the refactor is exact, and the committed tape came from other
settings or an intermediate version during G2. The tape is still valid: it replays, and it matches the native
build. Only its recipe is unrecorded. The other nine `lookahead` re-records were not run (~3 min CPU each).

## Not done / open

- **The bot's speed in real time.** `lookahead` costs about 17 ms of CPU per frame on average in Node, against a
  16 ms frame. In the page, early in stage 1, it ran at **49–63 frames/s** (the game's rate is 62.5). In busy
  scenes it will run below full speed: the game slows down rather than skipping. G4's bot needs a time budget or
  a worker.
- **Every stage played by a human:** only stage 1 was played by the keyboard script. The other stages and modes
  start the same way and were exercised through replays; no human played them through.
- **The look:** simple shapes, per the ruling. Missing from the original look: blur trails, the line-drawn
  letters, the scrolling background, fragments.
- **Endless modes on stage select:** they use the stage LCG seed `endlessSeed`, random per game, as the C's
  `SDL_GetTicks` does.
- **The report-back:** no handshake message reached this session, so there was no `from` address to reply to.
  This file is the report.
