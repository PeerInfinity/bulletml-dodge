# HB report — a hitbox setting (original / centered) and a dot for each bullet's hit area

Slice HB, 2026-10-04, branch `hitbox` (from `main`). ⚖ The user's rulings (2026-10-04): a **hitbox setting**,
"original" (the default, so the native verification and every recorded game and sweep stay valid) and "centered"
(the fix), recorded in each tape (no field = original); centered = the same 2 px radius around the bullet's
**position**, swept from its previous-frame position, PARSEC47-style; a **dot** for the hit area in the centre of
the bullet (centered) or where the hit area really is (original: the trail's tail), with a page toggle, on by
default; the simple drawing kept.

## Verdict

@@VERDICT@@

## The two hit tests

Units: 1/256 px. `SHIP_HIT_WIDTH = 512²` (2 px, squared) in both.

**Original** (`segmentHitsShip` in `src/game/noiz2sa-game.js`, `foe.cc` as it is). The segment runs from the trail's
tail `p = pos − mv × 1/2/4` (by the bullet's age: under 4 frames, under 8, older) to the bullet's position. With
`b = pos − p`, `o = ship − p`, `inaa = b·b`, `inab = b·o`:

    ht = inab / inaa                 must be in (0, 1)
    hd = |o|² − inab² / inaa / inaa  must be in [0, 512²)

The true squared distance to the line is `|o|² − inab²/inaa`; dividing by `inaa` a second time leaves
`hd ≈ |o|²` once the segment is longer than 1 (in 1/256 px, so always). So `hd < 512²` means **the ship within ~2 px
of the tail `p`** (and inside the segment's span): the hit point is up to 4 moves behind the drawn bullet's head — for
a 3 px/frame bullet, 12 px. A bullet that does not move (`inaa ≤ 1`) never hits. This is the C, and the port keeps
it: `npm run compare-native` with the wrap build stays **137/137** identical.

**Centered** (`centeredHitsShip`, new). From where the bullet was the frame before, `q = pos − mv`, to where it is,
`pos`; with `b = pos − q`, `o = ship − q`:

    inab ≤ 0 or inaa = 0:   d² = |o|²              (behind q, or the bullet did not move)
    inab ≥ inaa:            d² = |ship − pos|²     (past pos)
    otherwise:              d² = |o|² − inab² / inaa
    hit when d² < 512²

PARSEC47's `BulletActor.checkShipHit` with one division, and with the ends included: a capsule of radius 2 px along
the path the bullet's centre swept this frame. So a fast bullet cannot pass over the ship between two frames, and
**a bullet that does not move is a point test: one resting on the ship hits** (the original never hits with it; the
recommended choice, taken). The strict `<` keeps the original's threshold exactly. All the terms up to the one
division are exact integers in a double; the division is correctly rounded, so Node and every browser agree (the page
plays Node's moves under centered too, checked). The box prefilter is 4 px (twice the radius), so it is exact.

Everything else is the same in both: where bullets are, how they move, when they leave the screen (still by the
trail's tail `p`, as the C), the invincibility after a hit, the wipe. `stateLine` is unchanged.

## Where the setting lives

- **Engine:** `newGame(patterns, stage, { seed, endlessSeed, hitbox: 'original' | 'centered' })` (default original;
  anything else throws), kept as `g.hitbox`; `cloneGame` copies it; `moveFoes` picks the test.
- **Tapes:** `makeTape({…, hitbox})` writes `hitbox` only when it is not original; `tapeGameOptions(tape)` reads it
  (a tape without it is original). Every replay path uses it: `replayTape`, the page's replays,
  `bin/check-bot-tapes.mjs`, `bin/diff-frame.mjs`, `src/game/h1-diagnose.js`. `bin/compare-native.mjs` skips a
  centered tape (the native build has the C's test only). `bin/play-game.mjs --hitbox centered` (a tape's own wins).
- **Bots:** `runBot({…, hitbox})`; the result row and the tape carry it when centered. No bot setting: the bots read
  it from the game. The Ace plans on copies of the game, so it follows by itself. The Expert and the humanlike bots
  predict hits on the observed model (`src/game/perception.js`): `observe` copies `g.hitbox` into the model
  (`m.centered`), and `stepModel` then
  - tests the swept position (from where the object was before its predicted move to where it is after) with the
    engine's `centeredHitsShip`, a dot not yet moving included (its first move starts at the dot, so a dot on the ship
    is a real hit);
  - keeps the **bullet clearance** from that same swept segment (the hit area itself) instead of the drawn trail;
  - for a misjudged (negative) bullet clearance (H2), shrinks the same capsule.

  The spawner clearance and the top line are about where new bullets can appear, not about the hit test: unchanged.
  The original path is byte for byte what it was (all the H1b/G4/H2 tapes tried re-record the same, below).
- **Sweeps:** `bin/h1-sweep.mjs --hitbox centered` and `bin/h2-sweep.mjs --hitbox centered` (keys and Expert tapes
  end in `-centered`, so nothing original is overwritten; the run signature records it; the H1 summary does not borrow
  G4's Ace rows for a centered sweep). In CI it goes through the existing `extra` input — no workflow change.

## The drawing

Simple, as before (a thick round-capped line, the same colours and widths):

- **original:** the line from the trail's tail to the bullet (as it was); the **dot at the tail** — where the hit
  area really is. It shows the original's quirk honestly: the dot trails behind the bullet's head.
- **centered:** the same line, the same length, **centred on the bullet's position**; the **dot at the position**.
- the dot is 2 × 2 white pixels, like the ship's own centre point: a hit = the two white dots within 2 px.
- the left panel shows `HITBOX: original` / `centered` for the game on screen.

Screenshots (paused, the Expert on stage 6 seed 2): `docs/g3-screens/hitbox-original.png` (frame 600),
`docs/g3-screens/hitbox-centered.png` (frame 900). The G3/G4 screenshots were regenerated by the browser test and now
show the dots and the panel line.

## The page

A new "Hitbox" box beside "Your games": **hit area** — *original (behind the bullet)* / *centered (on the bullet)*,
and **show the hit spots** (a checkbox, on by default). Both are saved (`localStorage`: `noiz2sa.hitbox`,
`noiz2sa.hitDot`). The hit area applies from the next game (a game in play keeps its own); the game's tape records
it, the bot worker plays the same game, and a replay uses its tape's hitbox whatever the menu says. The note under
the page says it in one sentence: the original game checks a hit near the back end of each bullet's streak, not at
the bullet itself; "centered" moves it to the bullet (white dots show where it is).

## Tests

- `npm test` adds: centered geometry (just inside / at 2 px; a fast bullet crossing the ship in one frame; 3 px off
  its line misses; both ends included; a stationary bullet on the ship hits and the original's never does; the
  original's quirk — on the head the original misses and centered hits, near the tail the reverse); the default is
  original, an unknown hitbox throws; determinism in both modes (and the modes differ); a clone keeps its hitbox;
  tapes record, omit and replay it. Bots: the observed model's one-frame hit predictions are the engine's in both
  modes; the Expert under centered gives the same tape twice, records `hitbox`, and replays.
- `npm run test:browser` adds: the setting's default and menu text, saved; an Expert game under centered whose tape
  carries `hitbox: "centered"` and whose moves Node's Expert plays input for input (994 frames); browser = Node on that
  tape; a replay uses the tape's hitbox when the menu says original; the canvas is white at each bullet's centre
  (centered) or tail (original) with the dots on, and not with them off.
- Old tapes: `node bin/check-bot-tapes.mjs tapes/g4/s01-attack-seed1-b1x.json tapes/h1b/s01-attack-seed1-expert.json
  tapes/h1b/s06-attack-seed1-expert.json tapes/h2/ace-s01-attack-seed1.json tapes/h2/distracted-s01-attack-seed1.json
  tapes/h2/cautious-beginner-s01-attack-seed1.json`: *all 6 tapes the same*. `npm test` also re-records the H1b
  Expert and G4 Ace tapes it always checks.
- `sh native/build.sh`, then `npm run compare-native -- --native native/build/noiz2sa-headless-wrap`: **137/137**.

## Measurements

@@MEASURE@@

## The CI comparison (the coordinator's to dispatch, after merging)

The H1b arguments, plus the hitbox through `extra`. Both perceptions, so the Ace's centered rows are its own:

```
gh workflow run sweep.yml --ref main -f name=hb-centered -f perception=both -f variants=attack,no-attack \
  -f stages=1,2,3,4,5,6,7,8,9,10,ENDLESS -f seeds=1,2,3 -f horizons=0,4,8,16,32,48,64,96 -f budget=1 -f shards=16 \
  -f extra='--hitbox centered'
gh run download <run-id> -n sweep-hb-centered     # then commit results/hb-centered.{md,json}
```

- **Compare with `results/h1b-bot.md`** (the same arguments, original). Expected time like H1b's (~6–10 min on 16
  shards).
- **The tapes:** the Expert's tapes come out as `tapes/h1/…-expert-centered.json`, beside the original ones (nothing
  is replaced). Commit them only if wanted; they replay in the page with their hitbox.
- **Optional, the humanlike bots** (the H3 slider grid under centered), with the H3 grid's own arguments plus
  `-f extra='--hitbox centered'` on `h2-sweep.yml`.

## Open questions

@@OPEN@@
