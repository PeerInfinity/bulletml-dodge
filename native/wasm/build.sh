#!/bin/sh
# Build the native Noiz2sa 0.52 engine (+ libBulletML 0.0.6) to WebAssembly — the slice P1 feasibility measurement
# (docs/p1-report.md); the page does not use it.
#   source <emsdk>/emsdk_env.sh; sh native/wasm/build.sh   -> native/wasm/build/noiz2sa.mjs + noiz2sa.wasm
# The wrap variant (foe.cc with -DBULLETML_DODGE_WRAP_D): a direction outside [0, 1024) is wrapped before the
# sctbl lookup, as the JS port does, instead of the reference build's over-read (undefined behaviour).
# glibc-rand.c replaces musl's rand(): the game must draw what a native Linux build (and the port) draws.
# The patterns are embedded at /patterns (MEMFS). Floats: wasm f32/f64 are IEEE single/double, no FMA contraction.
set -e
cd "$(dirname "$0")"
N=..
OUT=build
mkdir -p "$OUT/obj"
OPT="${OPT:--O3}"
CFLAGS="$OPT -ffp-contract=off -fno-fast-math -w"
LIBFLAGS="-std=gnu++98 -include cstring -include cstdlib -I $N/bulletml"
for f in $N/bulletml/*.cpp $N/bulletml/tinyxml/tinyxml.cpp $N/bulletml/tinyxml/tinyxmlparser.cpp $N/bulletml/tinyxml/tinyxmlerror.cpp; do
  em++ $CFLAGS $LIBFLAGS -c "$f" -o "$OUT/obj/$(basename "$f" .cpp).o"
done
# clang rejects foecommand.h's qualified member declarations (gcc takes them with -fpermissive): build from a copy
# of the game sources with that qualification dropped (no other change)
rm -rf "$OUT/src" && cp -r $N/noiz2sa "$OUT/src"
sed -i 's/virtual \(.*\) FoeCommand::/virtual \1 /' "$OUT/src/foecommand.h"
GAMEFLAGS="-I $N/stubs -I $OUT/src -I $N -I $N/bulletml"
for f in $OUT/src/*.c $N/stubs/headless.c; do
  case "$f" in */noiz2sa.c) continue;; esac # included by api.c
  emcc $CFLAGS $GAMEFLAGS -c "$f" -o "$OUT/obj/$(basename "$f" .c).o"
done
for f in $OUT/src/*.cc; do
  em++ $CFLAGS -std=gnu++98 $GAMEFLAGS -DBULLETML_DODGE_WRAP_D -c "$f" -o "$OUT/obj/$(basename "$f" .cc).o"
done
emcc $CFLAGS $GAMEFLAGS -c api.c -o "$OUT/obj/api.o"
emcc $CFLAGS -c glibc-rand.c -o "$OUT/obj/glibc-rand.o"
em++ $OPT -o "$OUT/noiz2sa.mjs" "$OUT"/obj/*.o \
  --embed-file ../../patterns/noiz2sa@/patterns \
  -sMODULARIZE -sEXPORT_ES6 -sENVIRONMENT=web,worker,node -sALLOW_MEMORY_GROWTH -sINITIAL_MEMORY=16MB \
  -sEXPORTED_FUNCTIONS=_nz_load,_nz_init,_nz_step,_nz_status,_nz_frame,_nz_ship_x,_nz_ship_y,_nz_state_line,_nz_mem_top \
  -sEXPORTED_RUNTIME_METHODS=UTF8ToString,HEAPU8 -sINVOKE_RUN=0
ls -l "$OUT"/noiz2sa.*
