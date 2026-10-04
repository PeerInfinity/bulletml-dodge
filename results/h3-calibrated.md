# H2 — humanlike bots: presets and skill levels

Written by `bin/h2-sweep.mjs --merge` at commit `4027ea6`, 2026-10-04, from 1050 of 1050 runs (2.20 CPU-hours) in 16 shards.
Budget 1× = 600 units per frame. Seeds 1, 2, 3 (C rand() seed s, endlessSeed 7919 × s); bot seeds 1, 2. A cell: lives lost per run (g = game over, c = cleared, b = alive 3 min into the boss scene). "1st min" = runs with no hit in the first minute (3750 frames).

## attack: lives lost per stage (runs: seed × bot seed)

Survival = seconds to the game over, or 180 s for a run without one. Lost / min = lives lost per minute played.

| Player | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Cleared | Game overs | Survival (s) | 1st min | Lost / min | Lives lost (mean) | Mean score |
|---|---|---|---|---|---|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| Ace | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 30/30 | 0/30 | 180.0 | 30/30 | 0.00 | 0.00 | 3,640,571 |
| Expert | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 30/30 | 0/30 | 180.0 | 30/30 | 0.00 | 0.00 | 3,089,185 |
| Steady | 0c/1c/2c/0c/1c/0c | 1c/0c/1c/3c/1c/2c | 3c/1c/3c/0c/0c/3c | 3c/2c/2c/3c/1c/1c | 2c/0c/1c/1c/1c/1c | 1c/1c/2c/2c/4c/2c | 2c/2c/6g/4c/1c/4c | 2c/0c/4c/3c/1c/4c | 6c/5c/3g/5g/4c/3c | 2c/3c/5g/5c/5c/3c | 56/60 | 4/60 | 174.4 | 33/60 | 0.86 | 2.23 | 1,544,246 |
| Score chaser | 4g/4c/3c/3c/3g/4g | 4c/5g/6g/4c/6g/5g | 5g/3g/3c/3g/3g/3g | 3g/5g/5g/5c/3g/3g | 5g/4g/5g/7g/4g/6g | 3g/4g/5g/4g/4g/3g | 3g/6g/7g/4g/5g/4g | 7g/5g/7g/3g/5g/4g | 4g/4g/5g/5g/4g/6g | 3g/6g/6g/5g/5g/5g | 7/60 | 53/60 | 85.8 | 2/60 | 3.14 | 4.45 | 731,489 |
| Cautious | 1c/0c/0c/3c/1c/1c | 2c/5g/1c/1c/2c/3c | 1c/2c/1c/1c/0c/2c | 1c/1c/1c/2c/1c/4g | 3c/2c/4c/2c/5c/2c | 4c/3c/2c/3c/2c/4g | 4c/5c/5c/4c/3c/4c | 5c/5c/4c/4c/2c/3c | 5c/6g/3g/4c/2c/4c | 7g/5g/5g/4c/3g/5c | 51/60 | 9/60 | 167.9 | 30/60 | 1.16 | 2.90 | 1,297,418 |
| Panicky | 0c/4c/1c/1c/3c/0c | 4c/3c/5g/3g/4g/6g | 1c/1c/2c/3c/1c/3c | 3g/3g/1c/2c/5g/4g | 5c/6g/5c/3c/5g/2c | 4g/4g/3g/6g/4g/5g | 6g/6g/7g/6g/6g/6g | 4g/5g/4g/5c/5g/4g | 5g/7g/5g/4g/5g/4g | 4g/3g/7g/5g/7g/6g | 21/60 | 39/60 | 125.9 | 10/60 | 2.02 | 4.02 | 971,953 |
| Tunnel vision | 2c/3c/2c/2c/3c/3g | 4c/2c/4c/4c/4c/3c | 4c/3g/1c/2c/3c/3c | 2c/4g/4g/4g/4g/5g | 3g/4c/5c/6g/5c/5c | 2c/4g/5g/3c/5c/5c | 4c/5g/6g/6g/5c/6c | 5g/3c/6g/4g/5c/5g | 5g/6g/6c/7g/7g/4g | 6g/5g/6g/3g/6g/4g | 31/60 | 29/60 | 137.8 | 10/60 | 1.99 | 4.20 | 1,098,464 |
| Distracted | 1c/1c/2c/1c/2c/2c | 5g/4c/4c/3c/3g/5g | 1c/0c/4c/3c/1c/3c | 3c/5c/5g/4c/3c/2c | 5g/6g/6g/5c/5c/5c | 4c/4g/5g/4g/6g/5c | 4c/3c/5g/5c/4c/5g | 5g/4g/5g/3c/5g/5g | 5g/2c/5c/6g/5g/6g | 7g/4g/5g/6g/5g/5g | 32/60 | 28/60 | 143.2 | 9/60 | 1.82 | 4.02 | 1,076,686 |
| skill 0 | 4g/3g/3g/4g/3g/3g | 4g/4c/3g/4g/4g/3g | 3g/3g/5g/4g/5g/5g | 3g/3g/4g/3g/3g/3g | 4g/3g/5g/3g/4g/4g | 4g/3g/3g/4g/3g/3g | 3g/3g/3g/3g/4g/3g | 3g/3g/3g/3g/3g/3g | 5g/3g/4g/3g/3g/4g | 3g/4g/4g/3g/3g/3g | 1/60 | 59/60 | 59.2 | 2/60 | 3.42 | 3.47 | 229,508 |
| skill 10 | 4g/4g/3g/3c/4g/3g | 5g/5g/4g/5g/4g/4g | 4c/4c/3g/1c/5g/4g | 4g/3g/3g/3g/3g/3g | 3g/5g/3g/5g/5g/5g | 3g/4g/3g/4g/3g/4g | 5g/3g/5g/3g/3g/5g | 4g/5g/3g/5g/3g/4g | 3g/3g/5g/3g/3g/4g | 3g/3g/4g/5g/3g/4g | 4/60 | 56/60 | 74.3 | 3/60 | 3.02 | 3.77 | 370,737 |
| skill 20 | 2c/4g/3g/2c/4c/4g | 4c/5g/4c/5g/3c/3g | 5g/2c/5g/4c/5g/3c | 4g/3g/3g/4g/5g/4g | 3g/4g/5g/4g/5g/3g | 5g/3g/4g/5g/4g/3g | 4g/5g/3g/3g/4g/3g | 4g/5g/4g/3g/5g/3g | 3g/3g/3g/4g/3g/4g | 5g/4g/5g/5g/4g/3g | 9/60 | 51/60 | 87.0 | 8/60 | 2.69 | 3.83 | 471,784 |
| skill 30 | 3c/3g/1c/4c/3g/3g | 5g/5g/5g/5g/3g/4c | 3c/3c/2c/2c/2c/1c | 5g/4c/4g/4c/4g/5g | 5g/3g/3c/5g/5g/4c | 4g/6g/5g/3g/4g/4g | 6c/4g/3g/5g/6g/4g | 4g/5g/5g/4c/4c/3g | 6g/4g/4g/3g/4g/5g | 5g/4g/3g/4g/5g/6g | 17/60 | 43/60 | 111.3 | 8/60 | 2.25 | 4.00 | 718,842 |
| skill 40 | 4c/2c/1c/2c/2c/3c | 5g/5g/4c/3c/5g/5g | 3c/3g/2c/4c/2c/1c | 5g/1c/4c/5g/4c/5g | 6g/5g/6g/6g/4c/6g | 4g/5g/4g/3g/4c/4g | 6c/6g/4c/5g/6g/6g | 4c/5g/5g/4g/5g/6g | 5g/4g/5g/4g/5g/5g | 4g/6g/3g/6g/5g/4g | 21/60 | 39/60 | 128.5 | 11/60 | 2.09 | 4.25 | 899,860 |
| skill 50 | 1c/2c/0c/3g/1c/2c | 3c/2c/4c/5c/1c/4c | 2c/1c/4c/3c/4c/3c | 3c/3c/3g/4c/5g/4c | 2c/4c/6g/5c/5g/3c | 4c/3g/5g/6g/4g/5c | 5g/6c/7g/6c/4c/3c | 4c/3c/5g/5g/6g/4c | 3g/5g/4g/5g/5g/5g | 6g/7g/4g/5g/6g/5g | 34/60 | 26/60 | 143.3 | 20/60 | 1.80 | 3.95 | 1,112,426 |
| skill 60 | 2c/4c/2c/1c/3c/2c | 5g/4c/5g/4c/2c/2c | 1c/2c/4c/2c/2c/4c | 5g/4c/3c/2c/2c/5c | 2c/5g/5c/3c/2c/2c | 5c/4g/3g/4c/3g/4c | 4c/5c/5g/3g/6g/6g | 3c/3c/5c/5g/2c/5g | 4g/3c/5g/5c/0c/6g | 6c/7g/6g/6c/6g/7g | 40/60 | 20/60 | 154.0 | 20/60 | 1.62 | 3.78 | 1,253,116 |
| skill 70 | 4g/2c/0c/1c/3c/1c | 3c/3c/3c/3c/2c/3c | 3c/2c/2c/3c/2c/1c | 2c/3c/0c/2c/3c/2c | 3c/6c/4g/2c/3c/3c | 1c/2c/4g/4c/2c/5c | 3c/5c/6c/3g/3c/2c | 5c/4c/5c/5c/4c/5g | 6g/5g/6c/5g/7g/7g | 6c/7g/5g/7g/5g/5g | 45/60 | 15/60 | 159.9 | 17/60 | 1.48 | 3.55 | 1,345,976 |
| skill 80 | 1c/0c/1c/1c/1c/0c | 2c/1c/1c/4c/1c/0c | 3c/0c/2c/0c/1c/1c | 2c/4c/1c/3c/2c/3c | 1c/4c/2c/3c/3c/2c | 5c/3c/1c/2c/3c/3c | 2c/3c/0c/3c/3c/2c | 1c/4c/2c/1c/1c/4g | 4g/2c/3c/4c/4c/4c | 3c/6c/3c/3c/6c/1c | 58/60 | 2/60 | 176.1 | 30/60 | 0.87 | 2.27 | 1,690,886 |
| skill 90 | 0c/0c/0c/1c/2c/0c | 1c/1c/2c/0c/0c/0c | 0c/0c/2c/1c/1c/0c | 2c/2c/1c/2c/1c/1c | 1c/1c/0c/0c/2c/2c | 0c/1c/2c/1c/3c/1c | 3c/1c/2c/1c/2c/1c | 1c/1c/3c/1c/1c/0c | 2c/3c/2c/4c/3c/2c | 1c/2c/1c/0c/6c/4c | 60/60 | 0/60 | 180.0 | 44/60 | 0.51 | 1.35 | 2,152,492 |
| skill 100 | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 30/30 | 0/30 | 180.0 | 30/30 | 0.00 | 0.00 | 3,089,185 |

### attack: is the skill slider monotonic? (skill 0 → 10 → 20 → 30 → 40 → 50 → 60 → 70 → 80 → 90 → 100)

Strictly: each step better than the last, or equal only at the floor or the ceiling (0, or every run). Weakly: never worse.

| Measure | skill 0 | skill 10 | skill 20 | skill 30 | skill 40 | skill 50 | skill 60 | skill 70 | skill 80 | skill 90 | skill 100 | Monotonic |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Cleared | 1/60 | 4/60 | 9/60 | 17/60 | 21/60 | 34/60 | 40/60 | 45/60 | 58/60 | 60/60 | 30/30 | strictly |
| Game overs | 59/60 | 56/60 | 51/60 | 43/60 | 39/60 | 26/60 | 20/60 | 15/60 | 2/60 | 0/60 | 0/30 | strictly |
| Survival (s) | 59.2 | 74.3 | 87.0 | 111.3 | 128.5 | 143.3 | 154.0 | 159.9 | 176.1 | 180.0 | 180.0 | strictly |
| No hit in the 1st min | 2/60 | 3/60 | 8/60 | 8/60 | 11/60 | 20/60 | 20/60 | 17/60 | 30/60 | 44/60 | 30/30 | **no** |
| Lives lost per minute played | 3.42 | 3.02 | 2.69 | 2.25 | 2.09 | 1.80 | 1.62 | 1.48 | 0.87 | 0.51 | 0.00 | strictly |
| Lives lost (mean; not a measure of skill: a game over caps it) | 3.47 | 3.77 | 3.83 | 4.00 | 4.25 | 3.95 | 3.78 | 3.55 | 2.27 | 1.35 | 0.00 | — |

The slider is **strictly monotonic** in clears, game overs and survival.

#### attack: per stage — cleared / survival (s), skill 0 → 10 → 20 → 30 → 40 → 50 → 60 → 70 → 80 → 90 → 100

| Stage | skill 0 | skill 10 | skill 20 | skill 30 | skill 40 | skill 50 | skill 60 | skill 70 | skill 80 | skill 90 | skill 100 | Weakly monotonic |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 0/6 · 95 | 1/6 · 120 | 3/6 · 151 | 3/6 · 122 | 6/6 · 180 | 5/6 · 160 | 6/6 · 180 | 5/6 · 169 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 2 | 1/6 · 89 | 0/6 · 99 | 3/6 · 137 | 1/6 · 116 | 2/6 · 133 | 6/6 · 180 | 4/6 · 154 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 3 | 0/6 · 95 | 3/6 · 135 | 3/6 · 158 | 6/6 · 180 | 5/6 · 157 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 4 | 0/6 · 47 | 0/6 · 47 | 0/6 · 73 | 2/6 · 136 | 3/6 · 157 | 4/6 · 142 | 5/6 · 173 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 5 | 0/6 · 78 | 0/6 · 84 | 0/6 · 69 | 2/6 · 128 | 1/6 · 150 | 4/6 · 164 | 5/6 · 164 | 5/6 · 162 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 6 | 0/6 · 44 | 0/6 · 58 | 0/6 · 82 | 0/6 · 83 | 1/6 · 92 | 2/6 · 122 | 3/6 · 111 | 5/6 · 163 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 7 | 0/6 · 42 | 0/6 · 65 | 0/6 · 59 | 1/6 · 103 | 2/6 · 149 | 4/6 · 166 | 2/6 · 133 | 5/6 · 155 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 8 | 0/6 · 27 | 0/6 · 57 | 0/6 · 63 | 2/6 · 111 | 1/6 · 111 | 3/6 · 149 | 4/6 · 156 | 5/6 · 168 | 5/6 · 160 | 6/6 · 180 | 3/3 · 180 | **no** |
| 9 | 0/6 · 45 | 0/6 · 37 | 0/6 · 30 | 0/6 · 71 | 0/6 · 82 | 0/6 · 80 | 3/6 · 142 | 1/6 · 123 | 5/6 · 161 | 6/6 · 180 | 3/3 · 180 | **no** |
| 10 | 0/6 · 30 | 0/6 · 40 | 0/6 · 48 | 0/6 · 62 | 0/6 · 74 | 0/6 · 90 | 2/6 · 146 | 1/6 · 118 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |

10 stage(s) not weakly monotonic in clears and survival. (A stage has only 6 runs per skill level: one run more or less is within the noise; the slider is judged on the totals above.)

### attack: the presets on the slider (equivalent skill, by each measure)

By shares of runs (cleared, no hit in the first minute) or seconds (survival): linear between the first two neighbouring skill levels that bracket the preset; "< 0" = weaker than skill 0.

| Preset | Cleared | ≈ skill | Survival (s) | ≈ skill | 1st min | ≈ skill |
|---|---:|---:|---:|---:|---:|---:|
| Ace | 30/30 | ≥ 90 | 180.0 | ≥ 90 | 30/30 | ≥ 100 |
| Expert | 30/30 | ≥ 90 | 180.0 | ≥ 90 | 30/30 | ≥ 100 |
| Steady | 56/60 | 78 | 174.4 | 79 | 33/60 | 82 |
| Score chaser | 7/60 | 16 | 85.8 | 19 | 2/60 | 0 |
| Cautious | 51/60 | 75 | 167.9 | 75 | 30/60 | 80 |
| Panicky | 21/60 | 40 | 125.9 | 39 | 10/60 | 37 |
| Tunnel vision | 31/60 | 48 | 137.8 | 46 | 10/60 | 37 |
| Distracted | 32/60 | 48 | 143.2 | 50 | 9/60 | 33 |

## The human layer at work (means per run)

| Player | Looks / frame | Lapses | Lapse frames | Mean delay (frames) | Bullets unattended / look | Panic frames | Inputs changed by the hands | of them blocked (hold / rate) | Overshoots | Slow mashes | CPU s |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Ace | — | — | — | — | — | — | — | — | — | — | 50.8 |
| Expert | — | — | — | — | — | — | — | — | — | — | 25.5 |
| Steady | 0.49 | 2.9 | 29 | 10.7 | 33.2 | 3438 | 2246 | 2021 | 72 | 8.4 | 8.8 |
| Score chaser | 0.32 | 2.0 | 33 | 14.3 | 12.1 | 986 | 1041 | 894 | 53 | 1.9 | 3.3 |
| Cautious | 0.33 | 4.5 | 77 | 15.0 | 33.4 | 3428 | 2126 | 1785 | 98 | 10.7 | 5.8 |
| Panicky | 0.32 | 3.7 | 62 | 17.5 | 16.6 | 3327 | 2155 | 1704 | 75 | 27.6 | 4.5 |
| Tunnel vision | 0.33 | 3.5 | 59 | 14.6 | 49.5 | 2212 | 1818 | 1566 | 82 | 5.7 | 3.0 |
| Distracted | 0.32 | 12.0 | 305 | 14.7 | 20.9 | 2423 | 1769 | 1511 | 81 | 6.0 | 4.9 |
| skill 0 | 0.24 | 1.6 | 35 | 21.4 | 31.3 | 1452 | 2181 | 2120 | 16 | 5.0 | 1.9 |
| skill 10 | 0.24 | 2.4 | 54 | 18.9 | 28.1 | 1566 | 2424 | 2324 | 24 | 5.4 | 2.6 |
| skill 20 | 0.24 | 2.7 | 54 | 17.7 | 23.2 | 1408 | 2382 | 2261 | 37 | 3.6 | 3.0 |
| skill 30 | 0.32 | 3.1 | 60 | 16.7 | 26.0 | 2180 | 2400 | 2211 | 52 | 6.8 | 3.6 |
| skill 40 | 0.32 | 3.6 | 67 | 15.7 | 23.1 | 2247 | 2235 | 2000 | 66 | 5.2 | 3.9 |
| skill 50 | 0.33 | 3.7 | 65 | 14.7 | 21.0 | 2347 | 1857 | 1601 | 82 | 5.7 | 4.7 |
| skill 60 | 0.33 | 4.2 | 66 | 13.6 | 20.2 | 2534 | 1748 | 1459 | 88 | 6.9 | 5.7 |
| skill 70 | 0.33 | 3.5 | 50 | 12.5 | 15.8 | 2354 | 1560 | 1292 | 85 | 5.5 | 6.2 |
| skill 80 | 0.33 | 3.6 | 46 | 11.5 | 15.9 | 2661 | 1165 | 883 | 104 | 6.0 | 6.9 |
| skill 90 | 0.49 | 2.1 | 16 | 7.2 | 3.7 | 1987 | 750 | 582 | 85 | 3.0 | 12.3 |
| skill 100 | — | — | — | — | — | — | — | — | — | — | 25.6 |

## The settings

| Knob | Ace | Expert | Steady | Score chaser | Cautious | Panicky | Tunnel vision | Distracted | skill 0 | skill 10 | skill 20 | skill 30 | skill 40 | skill 50 | skill 60 | skill 70 | skill 80 | skill 90 | skill 100 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| reaction (frames) | — | 0 | 10 | 14 | 14 | 14 | 14 | 14 | 20 | 18 | 17 | 16 | 15 | 14 | 13 | 12 | 11 | 7 | 0 |
| attentionRadius (px) | — | 600 | 194 | 194 | 194 | 194 | 54 | 194 | 120 | 136 | 153 | 166 | 179 | 194 | 211 | 228 | 248 | 342 | 600 |
| attentionCount (bullets) | — | 1024 | 74 | 74 | 74 | 74 | 24 | 74 | 24 | 32 | 42 | 51 | 61 | 74 | 89 | 108 | 130 | 275 | 1024 |
| misjudge (px) | — | 0 | 2 | 2.75 | 2.75 | 2.75 | 2.75 | 2.75 | 4 | 3.75 | 3.5 | 3.25 | 3 | 2.75 | 2.5 | 2.5 | 2.25 | 1.5 | 0 |
| horizon (frames) | 48 | 48 | 32 | 26 | 26 | 26 | 26 | 26 | 16 | 19 | 21 | 22 | 24 | 26 | 27 | 29 | 30 | 37 | 48 |
| replanEvery (frames) | — | 1 | 2 | 3 | 3 | 3 | 3 | 3 | 4 | 4 | 4 | 3 | 3 | 3 | 3 | 3 | 3 | 2 | 1 |
| marginBullet (px) | — | 2 | 7.5 | 3 | 9.25 | 6.25 | 6.25 | 6.25 | 8 | 7.5 | 7 | 6.75 | 6.5 | 6.25 | 6 | 5.5 | 5.25 | 4 | 2 |
| marginSpawner (px) | — | 8 | 16 | 10 | 20 | 14 | 14 | 14 | 16 | 15 | 15 | 14 | 14 | 14 | 13 | 13 | 12 | 11 | 8 |
| marginTop (px) | — | 136 | 195 | 146 | 234 | 195 | 195 | 195 | 220 | 213 | 207 | 203 | 199 | 195 | 191 | 186 | 182 | 165 | 136 |
| attackY (px) | — | 160 | 279 | 181 | 349 | 279 | 279 | 279 | 330 | 316 | 305 | 296 | 288 | 279 | 271 | 262 | 254 | 220 | 160 |
| starWeight (per point) | — | 0 | 0 | 0.02 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| slowUse (0–1) | — | 1 | 0.5 | 0.5 | 0.5 | 0.5 | 0.5 | 0.5 | 0.3 | 0.35 | 0.4 | 0.45 | 0.45 | 0.5 | 0.55 | 0.6 | 0.6 | 0.75 | 1 |
| minHold (frames) | — | 1 | 5 | 5 | 5 | 5 | 5 | 5 | 7 | 7 | 6 | 6 | 6 | 5 | 5 | 5 | 4 | 3 | 1 |
| maxRate (changes/s) | — | 62.5 | 9 | 9 | 9 | 9 | 9 | 9 | 4 | 5 | 6 | 7 | 8 | 9 | 10.5 | 12 | 14 | 24 | 62.5 |
| overshootP (0–1) | — | 0 | 0.15 | 0.21 | 0.21 | 0.21 | 0.21 | 0.21 | 0.3 | 0.28 | 0.26 | 0.24 | 0.22 | 0.21 | 0.2 | 0.18 | 0.16 | 0.1 | 0 |
| overshootFrames (frames) | — | 0 | 3 | 4 | 4 | 4 | 4 | 4 | 6 | 6 | 5 | 5 | 5 | 4 | 4 | 4 | 3 | 2 | 0 |
| lapseRate (per min) | — | 0 | 1.3 | 2.1 | 2.1 | 2.1 | 2.1 | 6.6 | 3 | 2.8 | 2.5 | 2.4 | 2.3 | 2.1 | 2 | 1.8 | 1.6 | 1 | 0 |
| lapseFrames (frames) | — | 0 | 10 | 17 | 17 | 17 | 17 | 26 | 24 | 22 | 20 | 19 | 18 | 17 | 16 | 14 | 13 | 8 | 0 |
| panicFrom (bullets) | — | 150 | 73 | 73 | 73 | 44 | 73 | 73 | 40 | 49 | 57 | 62 | 68 | 73 | 79 | 84 | 90 | 112 | 150 |
| panicTo (bullets) | — | 400 | 225 | 225 | 225 | 135 | 225 | 225 | 150 | 170 | 188 | 200 | 213 | 225 | 238 | 250 | 263 | 313 | 400 |
| panicReaction (frames) | — | 0 | 4 | 6 | 6 | 14 | 6 | 6 | 8 | 7 | 7 | 6 | 6 | 6 | 5 | 5 | 4 | 3 | 0 |
| panicMisjudge (px) | — | 0 | 1.5 | 2 | 2 | 5 | 2 | 2 | 3 | 2.75 | 2.5 | 2.5 | 2.25 | 2 | 2 | 1.75 | 1.75 | 1 | 0 |
| panicSlow (0–1) | — | 0 | 0.15 | 0.2 | 0.2 | 0.5 | 0.2 | 0.2 | 0.3 | 0.3 | 0.25 | 0.25 | 0.2 | 0.2 | 0.2 | 0.2 | 0.15 | 0.1 | 0 |

## Shards

- shard 1/16: 66 runs at `4027ea6`, 1.9 min wall, 4 jobs on 4 cores
- shard 2/16: 66 runs at `4027ea6`, 2.6 min wall, 4 jobs on 4 cores
- shard 3/16: 66 runs at `4027ea6`, 2.7 min wall, 4 jobs on 4 cores
- shard 4/16: 66 runs at `4027ea6`, 2.5 min wall, 4 jobs on 4 cores
- shard 5/16: 66 runs at `4027ea6`, 2.2 min wall, 4 jobs on 4 cores
- shard 6/16: 66 runs at `4027ea6`, 2.1 min wall, 4 jobs on 4 cores
- shard 7/16: 66 runs at `4027ea6`, 2.7 min wall, 4 jobs on 4 cores
- shard 8/16: 66 runs at `4027ea6`, 1.7 min wall, 4 jobs on 4 cores
- shard 9/16: 66 runs at `4027ea6`, 1.7 min wall, 4 jobs on 4 cores
- shard 10/16: 66 runs at `4027ea6`, 2.3 min wall, 4 jobs on 4 cores
- shard 11/16: 65 runs at `4027ea6`, 1.8 min wall, 4 jobs on 4 cores
- shard 12/16: 65 runs at `4027ea6`, 2.7 min wall, 4 jobs on 4 cores
- shard 13/16: 65 runs at `4027ea6`, 2.3 min wall, 4 jobs on 4 cores
- shard 14/16: 65 runs at `4027ea6`, 2.4 min wall, 4 jobs on 4 cores
- shard 15/16: 65 runs at `4027ea6`, 2.3 min wall, 4 jobs on 4 cores
- shard 16/16: 65 runs at `4027ea6`, 2.3 min wall, 4 jobs on 4 cores
