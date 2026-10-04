# H2 — humanlike bots: presets and skill levels

Written by `bin/h2-sweep.mjs --from results/h3-grid.json` at commit `d617e3c`, 2026-10-04, from 1050 of 1050 runs (3.50 CPU-hours).
Budget 1× = 600 units per frame. Seeds 1, 2, 3 (C rand() seed s, endlessSeed 7919 × s); bot seeds 1, 2. A cell: lives lost per run (g = game over, c = cleared, b = alive 3 min into the boss scene). "1st min" = runs with no hit in the first minute (3750 frames).

## attack: lives lost per stage (runs: seed × bot seed)

Survival = seconds to the game over, or 180 s for a run without one. Lost / min = lives lost per minute played.

| Player | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Cleared | Game overs | Survival (s) | 1st min | Lost / min | Lives lost (mean) | Mean score |
|---|---|---|---|---|---|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| Ace | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 30/30 | 0/30 | 180.0 | 30/30 | 0.00 | 0.00 | 3,640,571 |
| Expert | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 30/30 | 0/30 | 180.0 | 30/30 | 0.00 | 0.00 | 3,089,185 |
| Steady veteran | 1c/4c/3c/2c/2c/4c | 4c/0c/4c/2c/5c/5c | 2c/4c/2c/3c/1c/3c | 1c/3g/2c/3c/1c/5c | 3c/3c/2c/4c/0c/1c | 2c/3g/4g/3c/5c/3c | 4c/4c/5c/0c/2c/5c | 4c/6c/4c/4c/5g/3c | 2c/2c/5c/2c/2c/2c | 7g/4c/4c/4c/5c/4c | 55/60 | 5/60 | 171.2 | 20/60 | 1.23 | 3.13 | 1,745,157 |
| Score chaser | 4g/4g/5g/5g/3c/3g | 4c/7g/5g/4g/5g/5g | 6g/3g/3g/4g/5c/6g | 4g/3g/5g/5g/3g/3g | 5g/7g/4g/3g/3g/7g | 5g/3g/4g/3g/4g/3g | 3g/3g/3g/4g/3g/6g | 5g/4g/4g/5g/6g/5g | 4g/5g/5g/7g/4g/5g | 5g/4g/4g/5g/5g/6g | 3/60 | 57/60 | 70.6 | 0/60 | 3.71 | 4.42 | 664,256 |
| Cautious beginner | 4g/3g/3g/4g/3g/3g | 4g/4c/3g/4g/4g/3g | 3g/3g/5g/4g/5g/5g | 3g/3g/4g/3g/3g/3g | 4g/3g/5g/3g/4g/4g | 4g/3g/3g/4g/3g/3g | 3g/3g/3g/3g/4g/3g | 3g/3g/3g/3g/3g/3g | 5g/3g/4g/3g/3g/4g | 3g/4g/4g/3g/3g/3g | 1/60 | 59/60 | 59.2 | 2/60 | 3.42 | 3.47 | 229,508 |
| Panicky | 2c/3c/2c/3c/3c/1c | 5g/5g/4g/6g/3c/6g | 5g/3g/5g/4c/3c/3c | 5g/5g/4g/4g/5g/5g | 5g/3c/6g/5g/5g/6g | 5g/3g/4g/4g/5g/5g | 5g/5g/7g/5c/3g/5g | 3g/5g/5g/5g/5g/4g | 5g/5g/5g/5g/5g/5g | 5g/5g/4g/5g/7g/5g | 12/60 | 48/60 | 105.8 | 7/60 | 2.61 | 4.47 | 834,648 |
| Tunnel vision | 3g/4g/3g/4g/3g/4g | 5g/4g/5g/4c/4g/6g | 5c/5g/4c/6g/4c/5g | 4g/4g/5g/5g/5g/4g | 6c/5g/5g/6g/5c/6g | 6g/5g/6g/5g/4g/4g | 3g/5g/7g/5g/4g/6g | 4g/5g/5g/5g/5g/3g | 6g/3g/5g/4g/5g/5g | 5g/9g/5g/3g/4g/3g | 6/60 | 54/60 | 98.2 | 2/60 | 2.88 | 4.70 | 779,007 |
| Distracted | 4g/4g/4g/3g/3g/2c | 5g/3c/5g/5g/5g/5g | 5c/5g/6g/3g/4c/5c | 5g/4g/5g/5g/4g/3g | 5g/4g/3g/5g/5g/3g | 5g/3g/4g/5c/4g/3g | 3g/7g/7g/6g/3g/5g | 5g/5g/5g/5g/4g/6g | 4g/6g/3g/3g/5g/5g | 5g/5g/4g/5g/5g/5g | 6/60 | 54/60 | 95.4 | 3/60 | 2.81 | 4.45 | 690,130 |
| skill 0 | 4g/3g/3g/4g/3g/3g | 4g/4c/3g/4g/4g/3g | 3g/3g/5g/4g/5g/5g | 3g/3g/4g/3g/3g/3g | 4g/3g/5g/3g/4g/4g | 4g/3g/3g/4g/3g/3g | 3g/3g/3g/3g/4g/3g | 3g/3g/3g/3g/3g/3g | 5g/3g/4g/3g/3g/4g | 3g/4g/4g/3g/3g/3g | 1/60 | 59/60 | 59.2 | 2/60 | 3.42 | 3.47 | 229,508 |
| skill 10 | 3g/4g/3g/1c/2c/3g | 5g/4g/4c/4c/4c/3g | 4c/5g/3g/4c/5g/3g | 4g/3g/3g/4c/4g/3g | 5g/3g/3g/5g/5g/3g | 4g/3g/3g/3g/3g/4g | 5g/5g/5g/3g/3g/4g | 4g/4g/5g/4g/4g/4g | 4g/3g/4g/4g/4g/4g | 3g/3g/4g/4g/4g/4g | 8/60 | 52/60 | 79.9 | 3/60 | 2.85 | 3.73 | 393,729 |
| skill 20 | 3c/3g/1c/4c/3g/3g | 5g/5g/5g/5g/3g/4c | 3c/3c/2c/2c/2c/1c | 5g/4c/4g/4c/4g/5g | 5g/3g/3c/5g/5g/4c | 4g/6g/5g/3g/4g/4g | 6c/4g/3g/5g/6g/4g | 4g/5g/5g/4c/4c/3g | 6g/4g/4g/3g/4g/5g | 5g/4g/3g/4g/5g/6g | 17/60 | 43/60 | 111.3 | 8/60 | 2.25 | 4.00 | 718,842 |
| skill 30 | 1c/2c/0c/3g/1c/2c | 3c/2c/4c/5c/1c/4c | 2c/1c/4c/3c/4c/3c | 3c/3c/3g/4c/5g/4c | 2c/4c/6g/5c/5g/3c | 4c/3g/5g/6g/4g/5c | 5g/6c/7g/6c/4c/3c | 4c/3c/5g/5g/6g/4c | 3g/5g/4g/5g/5g/5g | 6g/7g/4g/5g/6g/5g | 34/60 | 26/60 | 143.3 | 20/60 | 1.80 | 3.95 | 1,112,426 |
| skill 40 | 4g/2c/0c/1c/3c/1c | 3c/3c/3c/3c/2c/3c | 3c/2c/2c/3c/2c/1c | 2c/3c/0c/2c/3c/2c | 3c/6c/4g/2c/3c/3c | 1c/2c/4g/4c/2c/5c | 3c/5c/6c/3g/3c/2c | 5c/4c/5c/5c/4c/5g | 6g/5g/6c/5g/7g/7g | 6c/7g/5g/7g/5g/5g | 45/60 | 15/60 | 159.9 | 17/60 | 1.48 | 3.55 | 1,345,976 |
| skill 50 | 1c/2c/1c/2c/1c/1c | 3c/3c/3c/2c/3c/1c | 0c/1c/0c/1c/2c/2c | 2c/2c/1c/2c/4c/2c | 3c/4c/1c/1c/5c/1c | 3c/4c/4c/1c/4c/5g | 2c/2c/4c/3c/4c/1c | 2c/2c/5c/2c/2c/5c | 3c/5c/2c/5g/2c/6c | 7c/5c/5c/4c/3c/5g | 57/60 | 3/60 | 175.0 | 28/60 | 1.06 | 2.73 | 1,661,576 |
| skill 60 | 0c/0c/0c/0c/2c/0c | 0c/1c/2c/0c/1c/4c | 0c/0c/0c/0c/1c/1c | 0c/0c/1c/0c/1c/0c | 1c/2c/0c/1c/1c/1c | 2c/2c/1c/0c/3c/2c | 1c/1c/3c/0c/0c/0c | 0c/0c/0c/1c/2c/1c | 2c/2c/6g/2c/1c/2c | 4c/2c/2c/1c/3c/0c | 59/60 | 1/60 | 179.3 | 47/60 | 0.42 | 1.10 | 2,130,345 |
| skill 70 | 1c/2c/0c/0c/0c/1c | 2c/2c/1c/1c/1c/2c | 1c/1c/3c/1c/2c/1c | 1c/2c/1c/1c/1c/0c | 1c/1c/2c/2c/0c/0c | 0c/1c/3c/0c/1c/1c | 0c/3c/1c/0c/1c/1c | 2c/3c/1c/1c/2c/1c | 6g/1c/3c/2c/3c/1c | 1c/1c/4c/2c/4c/5c | 59/60 | 1/60 | 178.5 | 39/60 | 0.56 | 1.48 | 2,121,334 |
| skill 80 | 0c/1c/0c/0c/1c/0c | 1c/0c/0c/0c/0c/1c | 0c/0c/0c/0c/0c/0c | 0c/0c/1c/1c/0c/0c | 0c/0c/0c/0c/0c/1c | 2c/0c/1c/0c/4c/0c | 0c/0c/0c/1c/1c/3c | 0c/0c/3c/0c/1c/2c | 1c/0c/1c/0c/0c/2c | 1c/0c/1c/0c/2c/1c | 60/60 | 0/60 | 180.0 | 51/60 | 0.22 | 0.57 | 2,369,194 |
| skill 90 | 0c/0c/0c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 1c/0c/0c/0c/0c/0c | 1c/0c/0c/0c/0c/0c | 0c/0c/1c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 60/60 | 0/60 | 180.0 | 60/60 | 0.02 | 0.05 | 2,817,726 |
| skill 100 | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 30/30 | 0/30 | 180.0 | 30/30 | 0.00 | 0.00 | 3,089,185 |

### attack: is the skill slider monotonic? (skill 0 → 10 → 20 → 30 → 40 → 50 → 60 → 70 → 80 → 90 → 100)

Strictly: each step better than the last, or equal only at the floor or the ceiling (0, or every run). Weakly: never worse.

| Measure | skill 0 | skill 10 | skill 20 | skill 30 | skill 40 | skill 50 | skill 60 | skill 70 | skill 80 | skill 90 | skill 100 | Monotonic |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Cleared | 1/60 | 8/60 | 17/60 | 34/60 | 45/60 | 57/60 | 59/60 | 59/60 | 60/60 | 60/60 | 30/30 | **weakly only** |
| Game overs | 59/60 | 52/60 | 43/60 | 26/60 | 15/60 | 3/60 | 1/60 | 1/60 | 0/60 | 0/60 | 0/30 | **weakly only** |
| Survival (s) | 59.2 | 79.9 | 111.3 | 143.3 | 159.9 | 175.0 | 179.3 | 178.5 | 180.0 | 180.0 | 180.0 | **no** |
| No hit in the 1st min | 2/60 | 3/60 | 8/60 | 20/60 | 17/60 | 28/60 | 47/60 | 39/60 | 51/60 | 60/60 | 30/30 | **no** |
| Lives lost per minute played | 3.42 | 2.85 | 2.25 | 1.80 | 1.48 | 1.06 | 0.42 | 0.56 | 0.22 | 0.02 | 0.00 | **no** |
| Lives lost (mean; not a measure of skill: a game over caps it) | 3.47 | 3.73 | 4.00 | 3.95 | 3.55 | 2.73 | 1.10 | 1.48 | 0.57 | 0.05 | 0.00 | — |

**Not strictly monotonic** in clears, game overs and survival (clears, game overs, survival).

#### attack: per stage — cleared / survival (s), skill 0 → 10 → 20 → 30 → 40 → 50 → 60 → 70 → 80 → 90 → 100

| Stage | skill 0 | skill 10 | skill 20 | skill 30 | skill 40 | skill 50 | skill 60 | skill 70 | skill 80 | skill 90 | skill 100 | Weakly monotonic |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 0/6 · 95 | 2/6 · 104 | 3/6 · 122 | 5/6 · 160 | 5/6 · 169 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | yes |
| 2 | 1/6 · 89 | 3/6 · 127 | 1/6 · 116 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 3 | 0/6 · 95 | 2/6 · 121 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | yes |
| 4 | 0/6 · 47 | 1/6 · 78 | 2/6 · 136 | 4/6 · 142 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | yes |
| 5 | 0/6 · 78 | 0/6 · 84 | 2/6 · 128 | 4/6 · 164 | 5/6 · 162 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 6 | 0/6 · 44 | 0/6 · 41 | 0/6 · 83 | 2/6 · 122 | 5/6 · 163 | 5/6 · 168 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 7 | 0/6 · 42 | 0/6 · 85 | 1/6 · 103 | 4/6 · 166 | 5/6 · 155 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 8 | 0/6 · 27 | 0/6 · 67 | 2/6 · 111 | 3/6 · 149 | 5/6 · 168 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | yes |
| 9 | 0/6 · 45 | 0/6 · 58 | 0/6 · 71 | 0/6 · 80 | 1/6 · 123 | 5/6 · 162 | 5/6 · 173 | 5/6 · 165 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 10 | 0/6 · 30 | 0/6 · 34 | 0/6 · 62 | 0/6 · 90 | 1/6 · 118 | 5/6 · 159 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | yes |

5 stage(s) not weakly monotonic in clears and survival. (A stage has only 6 runs per skill level: one run more or less is within the noise; the slider is judged on the totals above.)

### attack: the presets on the slider (equivalent skill, by each measure)

By shares of runs (cleared, no hit in the first minute) or seconds (survival): linear between the first two neighbouring skill levels that bracket the preset; "< 0" = weaker than skill 0.

| Preset | Cleared | ≈ skill | Survival (s) | ≈ skill | 1st min | ≈ skill |
|---|---:|---:|---:|---:|---:|---:|
| Ace | 30/30 | ≥ 80 | 180.0 | ≥ 80 | 30/30 | ≥ 90 |
| Expert | 30/30 | ≥ 80 | 180.0 | ≥ 80 | 30/30 | ≥ 90 |
| Steady veteran | 55/60 | 48 | 171.2 | 48 | 20/60 | 30 |
| Score chaser | 3/60 | 3 | 70.6 | 6 | 0/60 | < 0 |
| Cautious beginner | 1/60 | 0 | 59.2 | 0 | 2/60 | 0 |
| Panicky | 12/60 | 14 | 105.8 | 18 | 7/60 | 18 |
| Tunnel vision | 6/60 | 7 | 98.2 | 16 | 2/60 | 0 |
| Distracted | 6/60 | 7 | 95.4 | 15 | 3/60 | 10 |

## The human layer at work (means per run)

| Player | Looks / frame | Lapses | Lapse frames | Mean delay (frames) | Bullets unattended / look | Panic frames | Inputs changed by the hands | of them blocked (hold / rate) | Overshoots | Slow mashes | CPU s |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Ace | — | — | — | — | — | — | — | — | — | — | 57.1 |
| Expert | — | — | — | — | — | — | — | — | — | — | 28.3 |
| Steady veteran | 0.49 | 0.5 | 7 | 10.1 | 9.4 | 1197 | 1392 | 1344 | 32 | 0.0 | 23.4 |
| Score chaser | 0.48 | 0.6 | 8 | 12.0 | 3.3 | 188 | 1040 | 978 | 31 | 0.1 | 5.8 |
| Cautious beginner | 0.24 | 1.6 | 35 | 21.4 | 31.3 | 1452 | 2181 | 2120 | 16 | 5.0 | 1.9 |
| Panicky | 0.49 | 1.0 | 13 | 13.7 | 2.7 | 2094 | 2238 | 2075 | 30 | 13.0 | 8.2 |
| Tunnel vision | 0.49 | 0.9 | 12 | 12.0 | 34.9 | 329 | 2031 | 1977 | 27 | 0.4 | 4.3 |
| Distracted | 0.31 | 10.6 | 310 | 13.0 | 3.8 | 400 | 1176 | 1112 | 31 | 0.4 | 5.1 |
| skill 0 | 0.24 | 1.6 | 35 | 21.4 | 31.3 | 1452 | 2181 | 2120 | 16 | 5.0 | 2.1 |
| skill 10 | 0.24 | 2.3 | 49 | 18.9 | 27.9 | 1707 | 2507 | 2415 | 27 | 5.2 | 3.0 |
| skill 20 | 0.32 | 3.1 | 60 | 16.7 | 26.0 | 2180 | 2400 | 2211 | 52 | 6.8 | 4.1 |
| skill 30 | 0.33 | 3.7 | 65 | 14.7 | 21.0 | 2347 | 1857 | 1601 | 82 | 5.7 | 5.4 |
| skill 40 | 0.33 | 3.5 | 50 | 12.5 | 15.8 | 2354 | 1560 | 1292 | 85 | 5.5 | 6.7 |
| skill 50 | 0.33 | 2.8 | 33 | 10.4 | 11.4 | 2381 | 1099 | 840 | 96 | 5.3 | 8.3 |
| skill 60 | 0.49 | 2.5 | 25 | 8.3 | 6.2 | 2176 | 790 | 589 | 102 | 3.2 | 16.5 |
| skill 70 | 0.49 | 2.2 | 14 | 6.1 | 2.0 | 1860 | 731 | 589 | 73 | 2.5 | 18.2 |
| skill 80 | 0.49 | 1.2 | 5 | 4.1 | 0.2 | 1531 | 236 | 162 | 58 | 1.0 | 19.2 |
| skill 90 | 0.99 | 0.7 | 1 | 2.0 | 0.0 | 1225 | 186 | 146 | 29 | 0.8 | 21.6 |
| skill 100 | — | — | — | — | — | — | — | — | — | — | 27.4 |

## The settings

| Knob | Ace | Expert | Steady veteran | Score chaser | Cautious beginner | Panicky | Tunnel vision | Distracted | skill 0 | skill 10 | skill 20 | skill 30 | skill 40 | skill 50 | skill 60 | skill 70 | skill 80 | skill 90 | skill 100 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| reaction (frames) | — | 0 | 10 | 12 | 20 | 12 | 12 | 13 | 20 | 18 | 16 | 14 | 12 | 10 | 8 | 6 | 4 | 2 | 0 |
| attentionRadius (px) | — | 600 | 360 | 300 | 120 | 300 | 64 | 300 | 120 | 141 | 166 | 194 | 228 | 268 | 315 | 370 | 435 | 511 | 600 |
| attentionCount (bullets) | — | 1024 | 160 | 120 | 24 | 120 | 40 | 120 | 24 | 35 | 51 | 74 | 108 | 157 | 228 | 332 | 483 | 704 | 1024 |
| misjudge (px) | — | 0 | 1 | 2 | 4 | 1 | 1 | 1.5 | 4 | 3.5 | 3.25 | 2.75 | 2.5 | 2 | 1.5 | 1.25 | 0.75 | 0.5 | 0 |
| horizon (frames) | 48 | 48 | 48 | 32 | 16 | 32 | 32 | 32 | 16 | 19 | 22 | 26 | 29 | 32 | 35 | 38 | 42 | 45 | 48 |
| replanEvery (frames) | — | 1 | 2 | 2 | 4 | 2 | 2 | 3 | 4 | 4 | 3 | 3 | 3 | 3 | 2 | 2 | 2 | 1 | 1 |
| marginBullet (px) | — | 2 | 4 | 1 | 8 | 3 | 3 | 3 | 8 | 7.5 | 6.75 | 6.25 | 5.5 | 5 | 4.5 | 3.75 | 3.25 | 2.5 | 2 |
| marginSpawner (px) | — | 8 | 10 | 6 | 16 | 10 | 10 | 10 | 16 | 15 | 14 | 14 | 13 | 12 | 11 | 10 | 10 | 9 | 8 |
| marginTop (px) | — | 136 | 150 | 100 | 220 | 160 | 160 | 160 | 220 | 212 | 203 | 195 | 186 | 178 | 170 | 161 | 153 | 144 | 136 |
| attackY (px) | — | 160 | 180 | 120 | 330 | 220 | 200 | 200 | 330 | 313 | 296 | 279 | 262 | 245 | 228 | 211 | 194 | 177 | 160 |
| starWeight (per point) | — | 0 | 0 | 0.02 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| slowUse (0–1) | — | 1 | 1 | 0.8 | 0.3 | 0.9 | 0.9 | 0.8 | 0.3 | 0.35 | 0.45 | 0.5 | 0.6 | 0.65 | 0.7 | 0.8 | 0.85 | 0.95 | 1 |
| minHold (frames) | — | 1 | 3 | 3 | 7 | 3 | 3 | 3 | 7 | 6 | 6 | 5 | 5 | 4 | 3 | 3 | 2 | 2 | 1 |
| maxRate (changes/s) | — | 62.5 | 10 | 9 | 4 | 8 | 8 | 8 | 4 | 5.5 | 7 | 9 | 12 | 16 | 21 | 27.5 | 36 | 47.5 | 62.5 |
| overshootP (0–1) | — | 0 | 0.05 | 0.12 | 0.3 | 0.1 | 0.1 | 0.1 | 0.3 | 0.27 | 0.24 | 0.21 | 0.18 | 0.15 | 0.12 | 0.09 | 0.06 | 0.03 | 0 |
| overshootFrames (frames) | — | 0 | 2 | 3 | 6 | 3 | 3 | 3 | 6 | 5 | 5 | 4 | 4 | 3 | 2 | 2 | 1 | 1 | 0 |
| lapseRate (per min) | — | 0 | 0.5 | 1 | 3 | 1 | 1 | 8 | 3 | 2.7 | 2.4 | 2.1 | 1.8 | 1.5 | 1.2 | 0.9 | 0.6 | 0.3 | 0 |
| lapseFrames (frames) | — | 0 | 12 | 14 | 24 | 14 | 14 | 30 | 24 | 22 | 19 | 17 | 14 | 12 | 10 | 7 | 5 | 2 | 0 |
| panicFrom (bullets) | — | 150 | 150 | 120 | 40 | 50 | 120 | 120 | 40 | 51 | 62 | 73 | 84 | 95 | 106 | 117 | 128 | 139 | 150 |
| panicTo (bullets) | — | 400 | 400 | 350 | 150 | 180 | 350 | 350 | 150 | 175 | 200 | 225 | 250 | 275 | 300 | 325 | 350 | 375 | 400 |
| panicReaction (frames) | — | 0 | 3 | 4 | 8 | 14 | 4 | 4 | 8 | 7 | 6 | 6 | 5 | 4 | 3 | 2 | 2 | 1 | 0 |
| panicMisjudge (px) | — | 0 | 0.5 | 1 | 3 | 4 | 1 | 1 | 3 | 2.75 | 2.5 | 2 | 1.75 | 1.5 | 1.25 | 1 | 0.5 | 0.25 | 0 |
| panicSlow (0–1) | — | 0 | 0 | 0.1 | 0.3 | 0.6 | 0.1 | 0.1 | 0.3 | 0.25 | 0.25 | 0.2 | 0.2 | 0.15 | 0.1 | 0.1 | 0.05 | 0.05 | 0 |

## Shards

- (local parts only)
