# Native Noiz2sa 0.52, headless — the G2 reference

`build.sh` builds `build/noiz2sa-headless`. It is Noiz2sa 0.52's game logic with libBulletML 0.0.6,
driven by an input tape and printing one state line per frame. `bin/compare-native.mjs` runs it
next to the JS port (`src/game/noiz2sa-game.js`). The report is `docs/g2-report.md`.

    sh native/build.sh                      # or: npm run native:build   (gcc/g++, x86-64)
    node bin/compare-native.mjs             # every tapes/*.json         (or: npm run compare-native)
    node bin/diff-frame.mjs tapes/x.json N  # both pools in detail at frames N-1 and N

## What is here

| Path | What | Licence |
|---|---|---|
| `noiz2sa/` | the 0.52 source files the game logic needs (from the official `noiz2sa0_52.zip`), CRLF → LF | BSD-2-Clause, Kenta Cho — `noiz2sa/LICENSE-readme_e.txt` |
| `bulletml/` | libBulletML 0.0.6 `src/` and its READMEs, **byte-identical** to the official archive (left out: the ygg/xerces parsers, the VC project files, and two stray zsh `.zhistory` files in `boost/config/`) | modified BSD, shinichiro.h — `bulletml/README.en`; TinyXml: zlib — `bulletml/tinyxml/readme.txt` |
| `stubs/` | a stand-in `SDL.h`, and empty drawing / sound / background / letter functions; the pad read from the tape | ours (MIT) |
| `PATCHES.diff` | every change to the 0.52 files, as a diff against the originals | — |

The library compiles unchanged with `-std=gnu++98 -include cstring -include cstdlib`. Modern headers no
longer pull in `strlen`/`atoi`, and those two flags replace the `#include`s that ledyba's SDL2 port
added. The game's `.cc` files need `-fpermissive` because of `foecommand.h`'s `FoeCommand::doAccelX`
qualified declarations.

## The patches (each marked `/* bulletml-dodge: … */` in the source)

- `barragemanager.cc`: the pattern directories are read in **sorted (strcmp) order**, not in
  `readdir` order. The file names are printed to stderr. The endless modes' stage seed comes from
  the command line, not `SDL_GetTicks()`.
- `noiz2sa.c`: `srand(seed)` in `initGame`. The SDL main loop is replaced by a headless driver. It
  calls `initDegutil`, then `initFirst` unchanged (its `srand(SDL_GetTicks())` sees the stub's 0 and
  is overridden by `initGame`), then `initGame(stage)` directly. `scene` is still 0 there, as the
  port assumes. Each frame it sets the tape input, runs `move()` and `tick++`, and prints the state
  line. It stops after the frame that returns to the title. On that last line only `f=` and `st=0`
  are comparable, because the C has already run `initTitle` and the rest of that `move()` in title
  state.
- `foe.cc`: two read-only accessors over the static foe pool, `foeStateHash` (the state line) and
  `foeDetail` (diagnostics). Before the move it reports each `sctbl` over-read to stderr when
  `NOIZ_UB=1` (see below).
- **Diagnostic variant only**: `build/noiz2sa-headless-wrap` compiles `foe.cc` with
  `-DBULLETML_DODGE_WRAP_D`. That wraps a foe's direction `d` to `[0, 1024)` before the `sctbl`
  lookups, the port's choice for the undefined behaviour. It exists so a comparison can see past
  that behaviour. It is not the reference.

## Floating point

The build uses x86-64 gcc, so floats are SSE scalar (no x87, measured with `objdump`). It never uses
`-ffast-math`, and passes `-ffp-contract=off`. Without a `-march` that has FMA, gcc has nothing to
contract into, and the binary has no FMA instructions (measured too).

## Environment variables (driver)

- `NOIZ_UB=1`: one `ub f=<frame> slot=<i> d=<d>` line on stderr for each foe move whose direction
  indexes past `sctbl`.
- `NOIZ_DETAIL=N`: every foe, bonus and shot on stderr after frames N−1 and N.
