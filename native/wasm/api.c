/* bulletml-dodge (slice P1): a minimal C API over the native Noiz2sa 0.52 engine, for the wasm feasibility
 * measurement (docs/p1-report.md). Not used by the page.
 *
 * noiz2sa.c is included (its main renamed away) to reach its static move(). The state is ALL of the program's
 * memory — the foe pool, the BulletML runners on the heap, malloc's own books — so the simplest exact snapshot is
 * a copy of the used part of linear memory, [0, sbrk(0)); restore copies it back (from JS, between calls). */
#define main noiz2sa_native_main
#include "noiz2sa.c" /* build/src/, a copy of ../noiz2sa/ (see build.sh) */
#undef main
#include <emscripten.h>

/* read the patterns (once per instance), as the native driver does before initGame */
EMSCRIPTEN_KEEPALIVE int nz_load(void) {
  if ( chdir("/patterns") != 0 ) return -1;
  initDegutil();
  initFirst();
  return 0;
}

/* stage 0..13; seeds as the native driver's tape header. Call it on a FRESH state — right after nz_load, or
 * after restoring the memory snapshot taken then (engine.mjs does): a second game in the same memory would
 * start from the first one's leftovers (e.g. initShip reads `scene`), unlike the native driver's new process. */
EMSCRIPTEN_KEEPALIVE int nz_init(int stg, unsigned int seed, unsigned int eSeed) {
  randSeed = seed; endlessSeed = eSeed;
  tick = 0;
  initGame(stg);
  return 0;
}

/* one frame: the input byte (dir | fire<<4 | slow<<5), move(), tick++. Returns the status. */
EMSCRIPTEN_KEEPALIVE int nz_step(int input) {
  tapeInput = input;
  move();
  tick++;
  return status;
}

EMSCRIPTEN_KEEPALIVE int nz_status(void) { return status; }
EMSCRIPTEN_KEEPALIVE int nz_frame(void) { return tick; }
EMSCRIPTEN_KEEPALIVE int nz_ship_x(void) { return ship.pos.x; }
EMSCRIPTEN_KEEPALIVE int nz_ship_y(void) { return ship.pos.y; }

/* the state line (the format of stateLine() in src/game/noiz2sa-game.js), in a static buffer */
static char line[256];
EMSCRIPTEN_KEEPALIVE const char *nz_state_line(void) {
  int i, nf, nb = 0;
  unsigned int hf = foeStateHash(&nf), hb = 0x811c9dc5u, hs = 0x811c9dc5u;
  for ( i=0 ; i<BONUS_MAX ; i++ ) {
    if ( bonus[i].cnt == NOT_EXIST ) continue;
    nb++;
    hb = fnvInt(hb, i); hb = fnvInt(hb, bonus[i].pos.x); hb = fnvInt(hb, bonus[i].pos.y);
  }
  for ( i=0 ; i<SHOT_MAX ; i++ ) {
    if ( shot[i].cnt == NOT_EXIST ) continue;
    hs = fnvInt(hs, i); hs = fnvInt(hs, shot[i].pos.x); hs = fnvInt(hs, shot[i].pos.y);
  }
  snprintf(line, sizeof line, "f=%d st=%d sc=%d l=%d bs=%d scene=%d ship=%d,%d,%d nf=%d F=%x nb=%d B=%x S=%x",
           tick, status, score, left, bonusScore, scene, ship.pos.x, ship.pos.y, ship.invCnt, nf, hf, nb, hb, hs);
  return line;
}

/* the end of the used memory: a snapshot is HEAPU8.slice(0, nz_mem_top()) */
EMSCRIPTEN_KEEPALIVE unsigned int nz_mem_top(void) { return (unsigned int)(uintptr_t)sbrk(0); }
