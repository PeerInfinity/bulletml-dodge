/*
 * $Id: noiz2sa.c,v 1.8 2003/02/12 13:55:13 kenta Exp $
 *
 * Copyright 2002 Kenta Cho. All rights reserved.
 */

/**
 * Noiz2sa main routine.
 *
 * @version $Revision: 1.8 $
 */
#include "SDL.h"
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#include "noiz2sa.h"
#include "screen.h"
#include "vector.h"
#include "ship.h"
#include "shot.h"
#include "frag.h"
#include "bonus.h"
#include "foe_mtd.h"
#include "brgmng_mtd.h"
#include "background.h"
#include "degutil.h"
#include "soundmanager.h"
#include "attractmanager.h"

static int noSound = 0;

// Initialize and load preference.
static void initFirst() {
  loadPreference();
  srand(SDL_GetTicks());
  initBarragemanager();
  initAttractManager();
}

// Quit and save preference.
void quitLast() {
  if ( !noSound ) closeSound();
  savePreference();
  closeBarragemanager();
  closeSDL();
  SDL_Quit();
  exit(1);
}

int status;

static float stagePrm[STAGE_NUM+ENDLESS_STAGE_NUM+1][3] = {
  {13, 0.5f, 0.12f}, {2, 1.8f, 0.15f}, {3, 3.2f, 0.1f}, {90, 6.0f, 0.3f}, {5, 5.0f, 0.6f},
  {6, 10.0f, 0.6f}, {7, 5.0f, 2.2f}, {98, 12.0f, 1.5f}, {9, 10.0f, 2.0f}, {79, 21.0f, 1.5f},
  {-3, 5.0f, 0.7f}, {-1, 10.0f, 1.2f}, {-4, 15.0f, 1.8f}, {-2, 16.0f, 1.8f},
  {0, -1.0f, 0.0f},
};

void initTitleStage(int stg) {
  initFoes();
  initBarrages(stagePrm[stg][0], stagePrm[stg][1], stagePrm[stg][2]);
}

void initTitle() {
  int stg;
  status = TITLE;

  stg = initTitleAtr();
  initShip();
  initShots();
  initFrags();
  initBonuses();
  initBackground();
  setStageBackground(1);

  initTitleStage(stg);
}

unsigned int randSeed = 1, endlessSeed = 1; /* bulletml-dodge: rand() and endless-mode seeds, from the command line */

void initGame(int stg) {
  status = IN_GAME;
  srand(randSeed); /* bulletml-dodge: a fixed seed for $rand and the fragments */

  initShip();
  initShots();
  initFoes();
  initFrags();
  initBonuses();
  initBackground();

  initBarrages(stagePrm[stg][0], stagePrm[stg][1], stagePrm[stg][2]);
  initGameState(stg);
  if ( stg < STAGE_NUM ) {
    setStageBackground(stg%5+1);
    playMusic(stg%5+1);
  } else {
    if ( !insane ) {
      setStageBackground(0);
      playMusic(0);
    } else {
      setStageBackground(6);
      playMusic(6);
    }
  }
}

void initGameover() {
  status = GAMEOVER;
  initGameoverAtr();
}

void initStageClear() {
  status = STAGE_CLEAR;
  initStageClearAtr();
}

static void move() {
  switch ( status ) {
  case TITLE:
    moveTitleMenu();
    moveBackground();
    addBullets();
    moveFoes();
    break;
  case IN_GAME:
    moveBackground();
    addBullets();
    moveShots();
    moveShip();
    moveFoes();
    moveFrags();
    moveBonuses();
    break;
  case GAMEOVER:
    moveGameover();
    moveBackground();
    addBullets();
    moveShots();
    moveFoes();
    moveFrags();
    break;
  case STAGE_CLEAR:
    moveStageClear();
    moveBackground();
    moveShots();
    moveShip();
    moveFrags();
    moveBonuses();
    break;
  case PAUSE:
    movePause();
    break;
  }
}

static void draw() {
  switch ( status ) {
  case TITLE:
    // Draw background.
    drawBackground();
    drawFoes();
    drawBulletsWake();
    blendScreen();
    // Draw forground.
    drawBullets();
    drawScore();
    drawTitleMenu();
    break;
  case IN_GAME:
    // Draw background.
    drawBackground();
    drawBonuses();
    drawFoes();
    drawBulletsWake();
    drawFrags();
    blendScreen();
    // Draw forground.
    drawShots();
    drawShip();
    drawBullets();
    drawScore();
    break;
  case GAMEOVER:
    // Draw background.
    drawBackground();
    drawFoes();
    drawBulletsWake();
    drawFrags();
    blendScreen();
    // Draw forground.
    drawShots();
    drawBullets();
    drawScore();
    drawGameover();
    break;
  case STAGE_CLEAR:
    // Draw background.
    drawBackground();
    drawBonuses();
    drawFrags();
    blendScreen();
    // Draw forground.
    drawShots();
    drawShip();
    drawScore();
    drawStageClear();
    break;
  case PAUSE:
    // Draw background.
    drawBackground();
    drawBonuses();
    drawFoes();
    drawBulletsWake();
    drawFrags();
    blendScreen();
    // Draw forground.
    drawShots();
    drawShip();
    drawBullets();
    drawScore();
    drawPause();
    break;
  }
}


/* bulletml-dodge: the headless driver replaces the SDL main loop (usage, parseArgs and main).
 *
 *   noiz2sa-headless <pattern-dir> < tape.txt > states.txt
 *
 * The tape on stdin: "stage seed endlessSeed" then "byte count" pairs (run-length; byte = dir | fire<<4 | slow<<5,
 * dir 0 = none, 1..8 = N, NE, E, SE, S, SW, W, NW). The game starts directly at initGame(stage), as after the
 * title (scene is still 0 there). After each move() and tick++, one state line is printed, the format of
 * stateLine() in src/game/noiz2sa-game.js. When the game returns to the title (moveGameover/moveStageClear
 * call initTitle, and the rest of that move() then runs in title state) one last line is printed and the driver
 * stops; only its f= and st=0 are comparable with the port. */
#include <unistd.h>

extern Bonus bonus[];

int reportUB = 0; /* NOIZ_UB=1: foe.cc reports each sctbl over-read to stderr */
int tapeInput = 0; /* the current frame's input byte; screen stub's getPadState/getButtonState read it */
static int headlessTitle = 0;
unsigned int foeStateHash(int *num);

static unsigned int fnvInt(unsigned int h, int v) {
  unsigned int u = (unsigned int)v;
  int b;
  for ( b=0 ; b<4 ; b++ ) { h ^= (u >> (8*b)) & 0xff; h *= 16777619u; }
  return h;
}

static void printState(int frame) {
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
  printf("f=%d st=%d sc=%d l=%d bs=%d scene=%d ship=%d,%d,%d nf=%d F=%x nb=%d B=%x S=%x\n",
         frame, status, score, left, bonusScore, scene, ship.pos.x, ship.pos.y, ship.invCnt, nf, hf, nb, hb, hs);
}

void foeDetail(FILE *fp);
static void printDetail(FILE *fp) {
  int i;
  foeDetail(fp);
  for ( i=0 ; i<BONUS_MAX ; i++ ) {
    if ( bonus[i].cnt == NOT_EXIST ) continue;
    fprintf(fp, "bonus %d x=%d y=%d vx=%d vy=%d down=%d\n", i, bonus[i].pos.x, bonus[i].pos.y, bonus[i].vel.x, bonus[i].vel.y, bonus[i].down);
  }
  for ( i=0 ; i<SHOT_MAX ; i++ ) {
    if ( shot[i].cnt == NOT_EXIST ) continue;
    fprintf(fp, "shot %d x=%d y=%d\n", i, shot[i].pos.x, shot[i].pos.y);
  }
}

int tick = 0;
int interval = INTERVAL_BASE;

int main(int argc, char *argv[]) {
  int stg, b, n, k;
  reportUB = getenv("NOIZ_UB") != NULL;
  int detailFrom = getenv("NOIZ_DETAIL") ? atoi(getenv("NOIZ_DETAIL")) : -1; /* frames detailFrom-1 .. detailFrom go to stderr */
  if ( argc < 2 || chdir(argv[1]) != 0 ) {
    fprintf(stderr, "usage: %s <pattern-dir> < tape.txt\n", argv[0]);
    return 2;
  }
  if ( scanf("%d %u %u", &stg, &randSeed, &endlessSeed) != 3 ) return 2;
  initDegutil();
  initFirst();
  initGame(stg);
  while ( scanf("%d %d", &b, &n) == 2 ) {
    for ( k=0 ; k<n ; k++ ) {
      tapeInput = b;
      move();
      tick++;
      printState(tick);
      if ( detailFrom >= 0 && (tick == detailFrom || tick == detailFrom - 1) ) { fprintf(stderr, "== frame %d\n", tick); printDetail(stderr); }
      if ( status == TITLE ) return 0;
    }
  }
  return 0;
}
