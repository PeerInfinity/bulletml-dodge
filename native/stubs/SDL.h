/* bulletml-dodge: a stand-in for SDL.h — the headless build needs only these types and calls. */
#ifndef BULLETML_DODGE_SDL_STUB_H
#define BULLETML_DODGE_SDL_STUB_H
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
typedef unsigned char Uint8;
typedef unsigned int Uint32;
typedef struct { Uint8 r, g, b, unused; } SDL_Color;
typedef struct SDL_Joystick SDL_Joystick;
#ifdef __cplusplus
extern "C" {
#endif
Uint32 SDL_GetTicks(void);
void SDL_Quit(void);
#ifdef __cplusplus
}
#endif
#endif
