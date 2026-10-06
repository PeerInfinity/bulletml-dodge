# H2 — humanlike bots: presets and skill levels

Written by `bin/h2-sweep.mjs --merge` at commit `a006d53`, 2026-10-06, from 630 of 630 runs (1.21 CPU-hours) in 16 shards.
Budget 1× = 600 units per frame. Seeds 1, 2, 3 (C rand() seed s, endlessSeed 7919 × s); bot seeds 1, 2. A cell: lives lost per run (g = game over, c = cleared, b = alive 3 min into the boss scene). "1st min" = runs with no hit in the first minute (3750 frames).

## attack: lives lost per stage (runs: seed × bot seed)

Survival = seconds to the game over, or 180 s for a run without one. Lost / min = lives lost per minute played.

| Player | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Cleared | Game overs | Survival (s) | 1st min | Lost / min | Lives lost (mean) | Mean score |
|---|---|---|---|---|---|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| skill 0 | 3c/3g/4g/4g/3g/3g | 4g/4c/3g/4g/4g/3g | 3g/3g/5g/4g/5g/5g | 3g/3g/3g/3g/3g/3g | 4g/3g/4g/3g/4g/4g | 4g/3g/3g/4g/3g/3g | 3g/3g/3g/3g/4g/3g | 3g/3g/3g/3g/3g/3g | 5g/3g/4g/4g/3g/4g | 3g/4g/4g/3g/3g/3g | 2/60 | 58/60 | 60.2 | 1/60 | 3.37 | 3.45 | 233,862 |
| skill 10 | 4g/4g/4g/3c/4g/3g | 5g/4g/4g/5g/4g/4g | 5g/2c/3g/1c/5g/4g | 3g/3g/3g/3g/3g/3g | 3g/5g/3g/5g/5g/4g | 3g/5g/4g/5g/3g/4g | 5g/3g/4g/4g/4g/4g | 4g/3g/4g/4g/4g/4g | 3g/4g/4g/3g/3g/4g | 3g/3g/3g/3g/3g/4g | 3/60 | 57/60 | 73.9 | 3/60 | 2.97 | 3.70 | 359,407 |
| skill 20 | 4g/3c/3g/3c/4c/3c | 5g/5g/5g/5g/5g/3g | 4c/2c/5g/4c/3c/2c | 4g/3g/3g/4g/5g/4g | 4g/4g/5g/4g/5g/3g | 4g/3g/5g/5g/4g/3g | 4g/6g/3g/3g/5g/3g | 4g/5g/4g/3g/3g/4g | 4g/3g/3g/5g/6g/4g | 5g/3g/5g/4g/4g/3g | 9/60 | 51/60 | 88.8 | 5/60 | 2.71 | 3.93 | 498,878 |
| skill 30 | 3c/3g/2c/3c/3c/3c | 3c/4g/4g/5g/5g/5g | 1c/5g/2c/2c/4c/4c | 5g/5g/4g/4c/3g/5g | 5g/3g/5g/5g/3g/5c | 4g/5g/5g/3g/3g/4g | 6g/4g/3g/6g/5g/6g | 4g/4c/6g/4g/5g/3g | 4g/4g/5g/3g/5g/5g | 5g/5g/3g/6g/3g/6g | 14/60 | 46/60 | 108.1 | 7/60 | 2.37 | 4.12 | 684,550 |
| skill 40 | 3c/2c/0c/1c/3c/2c | 3c/4g/4g/3g/4g/5g | 4c/5g/2c/4c/3c/0c | 4c/2c/2c/5g/4c/5g | 5g/5g/5c/5g/3c/5c | 3g/4c/4g/4c/3g/4g | 6g/6c/6g/6g/5g/5g | 5g/4g/6g/4c/5g/6g | 5g/5g/6c/6c/4g/5g | 5g/4g/4g/3g/4g/6g | 25/60 | 35/60 | 127.9 | 9/60 | 2.04 | 4.08 | 897,946 |
| skill 50 | 0c/2c/0c/3g/2c/2c | 4c/4c/3c/3c/6g/3c | 2c/4c/5c/2c/1c/3g | 2c/3g/3g/3c/5g/5g | 4c/6g/5c/3c/5c/3g | 4c/3g/5g/5c/4c/4c | 6g/5c/6c/4c/7g/5c | 5g/5g/5g/2c/5c/5g | 6g/5g/4g/6c/5g/6g | 4g/6g/4g/3g/5g/5g | 32/60 | 28/60 | 137.1 | 16/60 | 1.90 | 4.00 | 1,024,585 |
| skill 60 | 2c/2c/1c/2c/1c/2c | 4g/3c/3c/1c/1c/3c | 1c/1c/2c/3c/2c/3c | 3c/1c/5g/5g/1c/4c | 2c/6g/1c/5c/3c/4c | 5c/5c/3g/6g/3g/2c | 5c/1c/3c/5c/5c/2c | 4c/4c/5c/4c/4c/6g | 6g/4c/4c/5g/6g/7g | 4g/4g/7g/6c/6c/6g | 44/60 | 16/60 | 160.2 | 26/60 | 1.48 | 3.57 | 1,325,957 |
| skill 70 | 3c/1c/2c/2c/0c/2c | 2c/6g/2c/2c/3c/3c | 3c/2c/1c/3c/0c/3c | 4c/4c/2c/3c/3c/2c | 5c/2c/4c/4c/5g/4c | 0c/4c/4c/6g/3c/4c | 6c/5g/5g/3g/4c/5c | 3c/2c/6g/6g/5g/4c | 7g/6c/5c/6g/3c/7g | 6c/5g/6c/7g/6g/6c | 45/60 | 15/60 | 164.6 | 17/60 | 1.52 | 3.78 | 1,356,004 |
| skill 80 | 0c/0c/1c/0c/2c/0c | 2c/0c/2c/5g/3c/1c | 1c/1c/0c/1c/2c/3c | 1c/3c/1c/2c/3c/0c | 2c/1c/2c/3c/4c/6g | 4c/4c/5g/1c/1c/0c | 4c/2c/0c/0c/2c/1c | 3c/2c/4c/3c/4c/4c | 2c/1c/3c/4c/4c/3c | 6c/3c/6g/3c/3c/2c | 56/60 | 4/60 | 177.5 | 26/60 | 0.86 | 2.27 | 1,747,117 |
| skill 90 | 0c/1c/0c/1c/0c/0c | 1c/1c/1c/0c/3c/2c | 0c/0c/1c/1c/1c/2c | 1c/2c/0c/2c/1c/1c | 2c/2c/2c/2c/0c/2c | 3c/1c/1c/0c/3c/1c | 5c/0c/1c/0c/1c/0c | 1c/2c/1c/1c/0c/1c | 4c/2c/3c/2c/3c/0c | 1c/3c/1c/2c/2c/3c | 60/60 | 0/60 | 180.0 | 43/60 | 0.50 | 1.33 | 2,113,252 |
| skill 100 | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 30/30 | 0/30 | 180.0 | 30/30 | 0.00 | 0.00 | 3,042,496 |

### attack: is the skill slider monotonic? (skill 0 → 10 → 20 → 30 → 40 → 50 → 60 → 70 → 80 → 90 → 100)

Strictly: each step better than the last, or equal only at the floor or the ceiling (0, or every run). Weakly: never worse.

| Measure | skill 0 | skill 10 | skill 20 | skill 30 | skill 40 | skill 50 | skill 60 | skill 70 | skill 80 | skill 90 | skill 100 | Monotonic |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Cleared | 2/60 | 3/60 | 9/60 | 14/60 | 25/60 | 32/60 | 44/60 | 45/60 | 56/60 | 60/60 | 30/30 | strictly |
| Game overs | 58/60 | 57/60 | 51/60 | 46/60 | 35/60 | 28/60 | 16/60 | 15/60 | 4/60 | 0/60 | 0/30 | strictly |
| Survival (s) | 60.2 | 73.9 | 88.8 | 108.1 | 127.9 | 137.1 | 160.2 | 164.6 | 177.5 | 180.0 | 180.0 | strictly |
| No hit in the 1st min | 1/60 | 3/60 | 5/60 | 7/60 | 9/60 | 16/60 | 26/60 | 17/60 | 26/60 | 43/60 | 30/30 | **no** |
| Lives lost per minute played | 3.37 | 2.97 | 2.71 | 2.37 | 2.04 | 1.90 | 1.48 | 1.52 | 0.86 | 0.50 | 0.00 | **no** |
| Lives lost (mean; not a measure of skill: a game over caps it) | 3.45 | 3.70 | 3.93 | 4.12 | 4.08 | 4.00 | 3.57 | 3.78 | 2.27 | 1.33 | 0.00 | — |

The slider is **strictly monotonic** in clears, game overs and survival.

#### attack: per stage — cleared / survival (s), skill 0 → 10 → 20 → 30 → 40 → 50 → 60 → 70 → 80 → 90 → 100

| Stage | skill 0 | skill 10 | skill 20 | skill 30 | skill 40 | skill 50 | skill 60 | skill 70 | skill 80 | skill 90 | skill 100 | Weakly monotonic |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 1/6 · 109 | 1/6 · 131 | 4/6 · 156 | 5/6 · 162 | 6/6 · 180 | 5/6 · 160 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 2 | 1/6 · 89 | 0/6 · 91 | 0/6 · 122 | 1/6 · 107 | 1/6 · 87 | 5/6 · 176 | 5/6 · 160 | 5/6 · 174 | 5/6 · 175 | 6/6 · 180 | 3/3 · 180 | **no** |
| 3 | 0/6 · 95 | 2/6 · 127 | 5/6 · 168 | 5/6 · 172 | 5/6 · 168 | 5/6 · 158 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 4 | 0/6 · 45 | 0/6 · 41 | 0/6 · 71 | 1/6 · 118 | 4/6 · 162 | 2/6 · 112 | 4/6 · 167 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 5 | 0/6 · 73 | 0/6 · 79 | 0/6 · 83 | 1/6 · 111 | 3/6 · 145 | 4/6 · 154 | 5/6 · 175 | 5/6 · 168 | 5/6 · 176 | 6/6 · 180 | 3/3 · 180 | **no** |
| 6 | 0/6 · 41 | 0/6 · 76 | 0/6 · 69 | 0/6 · 71 | 2/6 · 102 | 4/6 · 143 | 3/6 · 127 | 5/6 · 174 | 5/6 · 170 | 6/6 · 180 | 3/3 · 180 | **no** |
| 7 | 0/6 · 41 | 0/6 · 70 | 0/6 · 73 | 0/6 · 105 | 1/6 · 147 | 4/6 · 168 | 6/6 · 180 | 3/6 · 128 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 8 | 0/6 · 26 | 0/6 · 51 | 0/6 · 46 | 1/6 · 95 | 1/6 · 111 | 2/6 · 125 | 5/6 · 171 | 3/6 · 157 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 9 | 0/6 · 52 | 0/6 · 43 | 0/6 · 54 | 0/6 · 76 | 2/6 · 121 | 1/6 · 112 | 2/6 · 142 | 3/6 · 164 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 10 | 0/6 · 30 | 0/6 · 30 | 0/6 · 45 | 0/6 · 65 | 0/6 · 56 | 0/6 · 63 | 2/6 · 119 | 3/6 · 141 | 5/6 · 175 | 6/6 · 180 | 3/3 · 180 | **no** |

10 stage(s) not weakly monotonic in clears and survival. (A stage has only 6 runs per skill level: one run more or less is within the noise; the slider is judged on the totals above.)

## The human layer at work (means per run)

| Player | Looks / frame | Lapses | Lapse frames | Mean delay (frames) | Bullets unattended / look | Panic frames | Inputs changed by the hands | of them blocked (hold / rate) | Overshoots | Slow mashes | CPU s |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| skill 0 | 0.24 | 1.6 | 37 | 21.4 | 31.5 | 1441 | 2202 | 2140 | 15 | 5.3 | 2.3 |
| skill 10 | 0.24 | 2.3 | 51 | 19.0 | 29.1 | 1512 | 2425 | 2324 | 24 | 5.5 | 2.7 |
| skill 20 | 0.24 | 2.5 | 50 | 17.8 | 24.8 | 1525 | 2454 | 2329 | 38 | 4.1 | 3.3 |
| skill 30 | 0.32 | 2.8 | 57 | 16.6 | 24.1 | 1964 | 2352 | 2173 | 51 | 5.7 | 3.5 |
| skill 40 | 0.32 | 3.5 | 65 | 15.7 | 23.4 | 2254 | 2194 | 1965 | 65 | 5.3 | 4.2 |
| skill 50 | 0.33 | 3.6 | 61 | 14.6 | 20.1 | 2233 | 1769 | 1522 | 80 | 5.0 | 4.9 |
| skill 60 | 0.33 | 4.2 | 68 | 13.6 | 21.0 | 2693 | 1824 | 1534 | 90 | 7.0 | 6.3 |
| skill 70 | 0.33 | 3.8 | 54 | 12.6 | 17.6 | 2582 | 1643 | 1351 | 88 | 7.2 | 6.9 |
| skill 80 | 0.33 | 3.2 | 41 | 11.5 | 16.0 | 2755 | 1175 | 896 | 105 | 5.6 | 7.9 |
| skill 90 | 0.49 | 2.2 | 16 | 7.2 | 3.9 | 1953 | 728 | 568 | 81 | 2.6 | 12.9 |
| skill 100 | — | — | — | — | — | — | — | — | — | — | 34.9 |

## The settings

| Knob | skill 0 | skill 10 | skill 20 | skill 30 | skill 40 | skill 50 | skill 60 | skill 70 | skill 80 | skill 90 | skill 100 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| reaction (frames) | 20 | 18 | 17 | 16 | 15 | 14 | 13 | 12 | 11 | 7 | 0 |
| attentionRadius (px) | 120 | 136 | 153 | 166 | 179 | 194 | 211 | 228 | 248 | 342 | 600 |
| attentionCount (bullets) | 24 | 32 | 42 | 51 | 61 | 74 | 89 | 108 | 130 | 275 | 1024 |
| misjudge (px) | 4 | 3.75 | 3.5 | 3.25 | 3 | 2.75 | 2.5 | 2.5 | 2.25 | 1.5 | 0 |
| horizon (frames) | 16 | 19 | 21 | 22 | 24 | 26 | 27 | 29 | 30 | 37 | 48 |
| replanEvery (frames) | 4 | 4 | 4 | 3 | 3 | 3 | 3 | 3 | 3 | 2 | 1 |
| marginBullet (px) | 8 | 7.5 | 7 | 6.75 | 6.5 | 6.25 | 6 | 5.5 | 5.25 | 4 | 2 |
| marginSpawner (px) | 16 | 15 | 15 | 14 | 14 | 14 | 13 | 13 | 12 | 11 | 8 |
| marginTop (px) | 220 | 213 | 207 | 203 | 199 | 195 | 191 | 186 | 182 | 165 | 136 |
| attackY (px) | 330 | 316 | 305 | 296 | 288 | 279 | 271 | 262 | 254 | 220 | 160 |
| starWeight (per point) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| slowUse (0–1) | 0.3 | 0.35 | 0.4 | 0.45 | 0.45 | 0.5 | 0.55 | 0.6 | 0.6 | 0.75 | 1 |
| minHold (frames) | 7 | 7 | 6 | 6 | 6 | 5 | 5 | 5 | 4 | 3 | 1 |
| maxRate (changes/s) | 4 | 5 | 6 | 7 | 8 | 9 | 10.5 | 12 | 14 | 24 | 62.5 |
| overshootP (0–1) | 0.3 | 0.28 | 0.26 | 0.24 | 0.22 | 0.21 | 0.2 | 0.18 | 0.16 | 0.1 | 0 |
| overshootFrames (frames) | 6 | 6 | 5 | 5 | 5 | 4 | 4 | 4 | 3 | 2 | 0 |
| lapseRate (per min) | 3 | 2.8 | 2.5 | 2.4 | 2.3 | 2.1 | 2 | 1.8 | 1.6 | 1 | 0 |
| lapseFrames (frames) | 24 | 22 | 20 | 19 | 18 | 17 | 16 | 14 | 13 | 8 | 0 |
| panicFrom (bullets) | 40 | 49 | 57 | 62 | 68 | 73 | 79 | 84 | 90 | 112 | 150 |
| panicTo (bullets) | 150 | 170 | 188 | 200 | 213 | 225 | 238 | 250 | 263 | 313 | 400 |
| panicReaction (frames) | 8 | 7 | 7 | 6 | 6 | 6 | 5 | 5 | 4 | 3 | 0 |
| panicMisjudge (px) | 3 | 2.75 | 2.5 | 2.5 | 2.25 | 2 | 2 | 1.75 | 1.75 | 1 | 0 |
| panicSlow (0–1) | 0.3 | 0.3 | 0.25 | 0.25 | 0.2 | 0.2 | 0.2 | 0.2 | 0.15 | 0.1 | 0 |

## Shards

- shard 1/16: 40 runs at `a006d53`, 1.5 min wall, 4 jobs on 4 cores
- shard 2/16: 40 runs at `a006d53`, 1.5 min wall, 4 jobs on 4 cores
- shard 3/16: 40 runs at `a006d53`, 1.2 min wall, 4 jobs on 4 cores
- shard 4/16: 40 runs at `a006d53`, 0.9 min wall, 4 jobs on 4 cores
- shard 5/16: 40 runs at `a006d53`, 1.5 min wall, 4 jobs on 4 cores
- shard 6/16: 40 runs at `a006d53`, 1.6 min wall, 4 jobs on 4 cores
- shard 7/16: 39 runs at `a006d53`, 1.2 min wall, 4 jobs on 4 cores
- shard 8/16: 39 runs at `a006d53`, 0.9 min wall, 4 jobs on 4 cores
- shard 9/16: 39 runs at `a006d53`, 1.3 min wall, 4 jobs on 4 cores
- shard 10/16: 39 runs at `a006d53`, 1.4 min wall, 4 jobs on 4 cores
- shard 11/16: 39 runs at `a006d53`, 0.9 min wall, 4 jobs on 4 cores
- shard 12/16: 39 runs at `a006d53`, 1.5 min wall, 4 jobs on 4 cores
- shard 13/16: 39 runs at `a006d53`, 1.4 min wall, 4 jobs on 4 cores
- shard 14/16: 39 runs at `a006d53`, 1.5 min wall, 4 jobs on 4 cores
- shard 15/16: 39 runs at `a006d53`, 1.4 min wall, 4 jobs on 4 cores
- shard 16/16: 39 runs at `a006d53`, 1.3 min wall, 4 jobs on 4 cores
