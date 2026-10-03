/* bulletml-dodge (slice P1): glibc's rand()/srand() (the TYPE_3 additive-feedback generator), for the wasm build.
 * Emscripten's libc (musl) has another rand(); the game's $rand and fragments must draw what a native Linux build
 * draws (the JS port's src/game/crand.js is the same generator). Defining them here keeps musl's out of the link. */
static int ring[34];
static int pos;

static int next(void) {
  int v = (int)((unsigned)ring[(pos + 3) % 34] + (unsigned)ring[(pos + 31) % 34]);
  ring[pos] = v;
  pos = (pos + 1) % 34;
  return v;
}

void srand(unsigned int seed) {
  int r[34], i;
  if ( seed == 0 ) seed = 1;
  r[0] = (int)seed;
  for ( i=1 ; i<31 ; i++ ) {
    int hi = r[i-1] / 127773, lo = r[i-1] % 127773;
    int word = 16807 * lo - 2836 * hi;
    if ( word < 0 ) word += 2147483647;
    r[i] = word;
  }
  for ( i=31 ; i<34 ; i++ ) r[i] = r[i-31];
  for ( i=0 ; i<34 ; i++ ) ring[i] = r[i];
  pos = 0;
  for ( i=34 ; i<344 ; i++ ) next();
}

int rand(void) { return (int)((unsigned)next() >> 1); }
