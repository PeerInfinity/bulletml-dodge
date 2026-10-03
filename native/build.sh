#!/bin/sh
# Build the headless native Noiz2sa 0.52 (+ libBulletML 0.0.6) used by bin/compare-native.mjs.
#   native/build.sh            -> native/build/noiz2sa-headless
# x86-64 gcc/g++, SSE floats (the x86-64 default). -ffp-contract=off keeps a*b+c from fusing into an FMA if a
# -march with FMA is ever added; without one gcc has no FMA to contract to, and -ffast-math is never used.
set -e
cd "$(dirname "$0")"
OUT=build
mkdir -p "$OUT/wrap"
CFLAGS="-O2 -ffp-contract=off -fno-fast-math -w"
LIBFLAGS="-std=gnu++98 -include cstring -include cstdlib -I bulletml"
for f in bulletml/*.cpp bulletml/tinyxml/tinyxml.cpp bulletml/tinyxml/tinyxmlparser.cpp bulletml/tinyxml/tinyxmlerror.cpp; do
  g++ $CFLAGS $LIBFLAGS -c "$f" -o "$OUT/$(basename "$f" .cpp).o"
done
GAMEFLAGS="-I stubs -I noiz2sa -I . -I bulletml"
for f in noiz2sa/*.c stubs/headless.c; do
  gcc $CFLAGS $GAMEFLAGS -c "$f" -o "$OUT/$(basename "$f" .c).o"
done
for f in noiz2sa/*.cc; do
  g++ $CFLAGS -std=gnu++98 -fpermissive $GAMEFLAGS -c "$f" -o "$OUT/$(basename "$f" .cc).o"
done
g++ $CFLAGS -std=gnu++98 -fpermissive $GAMEFLAGS -DBULLETML_DODGE_WRAP_D -c noiz2sa/foe.cc -o "$OUT/wrap/foe.o"
g++ -o "$OUT/noiz2sa-headless" "$OUT"/*.o -lm
g++ -o "$OUT/noiz2sa-headless-wrap" $(ls "$OUT"/*.o | grep -v '/foe.o$') "$OUT/wrap/foe.o" -lm
echo "built $OUT/noiz2sa-headless (the reference) and $OUT/noiz2sa-headless-wrap (diagnostic: sctbl over-read pinned to the port's wrap)"
