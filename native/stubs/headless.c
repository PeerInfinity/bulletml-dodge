/* bulletml-dodge: stubs for everything the headless build does not run — drawing (screen.c, letterrender.c,
 * background.c), sound (soundmanager.c) — and the pad read from the tape. None of these touch game state. */
#include "SDL.h"
#include "screen.h"
#include "letterrender.h"
#include "background.h"
#include "soundmanager.h"

Uint32 SDL_GetTicks(void) { return 0; }
void SDL_Quit(void) {}

static LayerBit dummy[1];
int windowMode = 0;
LayerBit *l1buf = dummy, *l2buf = dummy, *buf = dummy, *lpbuf = dummy, *rpbuf = dummy;
Uint8 *keys = dummy;
SDL_Joystick *stick = NULL;
int buttonReversed = 0;
int brightness = DEFAULT_BRIGHTNESS;

void initSDL(int window) {}
void closeSDL() {}
void blendScreen() {}
void flipScreen() {}
void clearScreen() {}
void clearLPanel() {}
void clearRPanel() {}
void smokeScreen() {}
void drawThickLine(int x1, int y1, int x2, int y2, LayerBit color1, LayerBit color2, int width) {}
void drawLine(int x1, int y1, int x2, int y2, LayerBit color, int width, LayerBit *buf) {}
void drawBox(int x, int y, int width, int height, LayerBit color1, LayerBit color2, LayerBit *buf) {}
void drawBoxPanel(int x, int y, int width, int height, LayerBit color1, LayerBit color2, LayerBit *buf) {}
int drawNum(int n, int x, int y, int s, int c1, int c2) { return x; }
int drawNumRight(int n, int x, int y, int s, int c1, int c2) { return y; }
int drawNumCenter(int n, int x, int y, int s, int c1, int c2) { return x; }
void drawSprite(int n, int x, int y) {}

void drawLetterBuf(int idx, int lx, int ly, int ltSize, int d, LayerBit color1, LayerBit color2, LayerBit *buf, int panel) {}
void drawLetter(int idx, int lx, int ly, int ltSize, int d, LayerBit color1, LayerBit color2, LayerBit *buf) {}
void drawStringBuf(char *str, int lx, int ly, int ltSize, int d, LayerBit color1, LayerBit color2, LayerBit *buf, int panel) {}
void drawString(char *str, int lx, int ly, int ltSize, int d, LayerBit color1, LayerBit color2, LayerBit *buf) {}

void initBackground() {}
void setStageBackground(int stage) {}
void moveBackground() {}
void drawBackground() {}

void closeSound() {}
void initSound() {}
void playMusic(int idx) {}
void fadeMusic() {}
void stopMusic() {}
void playChunk(int idx) {}

/* The tape byte: dir 1..8 = N, NE, E, SE, S, SW, W, NW; fire = 16 (button 1); slow = 32 (button 2). */
extern int tapeInput;
static const int dirPad[9] = {
  0, PAD_UP, PAD_UP | PAD_RIGHT, PAD_RIGHT, PAD_DOWN | PAD_RIGHT, PAD_DOWN, PAD_DOWN | PAD_LEFT, PAD_LEFT, PAD_UP | PAD_LEFT,
};
int getPadState() { return dirPad[tapeInput & 15]; }
int getButtonState() { return tapeInput & (PAD_BUTTON1 | PAD_BUTTON2); }
