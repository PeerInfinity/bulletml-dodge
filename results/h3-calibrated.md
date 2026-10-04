# H2 — humanlike bots: presets and skill levels

Written by `bin/h2-sweep.mjs --merge` at commit `46e0afb`, 2026-10-04, from 1050 of 1050 runs (2.57 CPU-hours) in 16 shards.
Budget 1× = 600 units per frame. Seeds 1, 2, 3 (C rand() seed s, endlessSeed 7919 × s); bot seeds 1, 2. A cell: lives lost per run (g = game over, c = cleared, b = alive 3 min into the boss scene). "1st min" = runs with no hit in the first minute (3750 frames).

## attack: lives lost per stage (runs: seed × bot seed)

Survival = seconds to the game over, or 180 s for a run without one. Lost / min = lives lost per minute played.

| Player | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Cleared | Game overs | Survival (s) | 1st min | Lost / min | Lives lost (mean) | Mean score |
|---|---|---|---|---|---|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| Ace | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 30/30 | 0/30 | 180.0 | 30/30 | 0.00 | 0.00 | 3,640,571 |
| Expert | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 30/30 | 0/30 | 180.0 | 30/30 | 0.00 | 0.00 | 3,051,264 |
| Steady | 0c/1c/2c/0c/1c/0c | 1c/0c/1c/3c/1c/2c | 3c/1c/3c/0c/0c/3c | 3c/2c/2c/3c/1c/1c | 2c/0c/1c/1c/1c/1c | 1c/1c/2c/2c/4c/2c | 2c/2c/6g/4c/1c/4c | 2c/0c/4c/3c/1c/4c | 6c/5c/3g/5g/4c/3c | 2c/3c/5g/5c/5c/3c | 56/60 | 4/60 | 174.4 | 33/60 | 0.86 | 2.23 | 1,544,246 |
| Score chaser | 4g/2c/2c/3c/3g/4g | 5c/5g/5c/4c/6g/5c | 4c/3g/3c/3g/3g/3g | 5g/5g/3g/5g/3g/3g | 5g/6g/6c/4g/4g/5g | 3g/4g/6g/4g/4g/3g | 3g/5g/5g/4g/5g/3g | 7g/5g/7g/3g/5g/4g | 3g/5g/5g/5g/5g/8g | 3g/6g/6g/5g/5g/6g | 10/60 | 50/60 | 88.2 | 3/60 | 3.06 | 4.38 | 759,083 |
| Cautious | 1c/0c/0c/3c/1c/1c | 2c/5g/1c/1c/2c/3c | 1c/2c/1c/1c/0c/2c | 1c/1c/1c/2c/1c/4g | 3c/2c/4c/2c/5c/2c | 4c/3c/2c/3c/2c/4g | 4c/5c/5c/4c/3c/4c | 5c/5c/4c/4c/2c/3c | 5c/6g/3g/4c/2c/4c | 7g/5g/5g/4c/3g/5c | 51/60 | 9/60 | 167.9 | 30/60 | 1.16 | 2.90 | 1,297,418 |
| Panicky | 2c/3c/2c/1c/3c/1c | 4c/3c/3c/3g/5c/5c | 1c/1c/2c/3c/1c/3c | 3g/3g/4c/5g/3c/4c | 6g/6g/5c/3c/5g/4c | 4g/4g/3g/6g/4g/5g | 6g/6g/1c/4c/6g/5g | 4g/5g/4g/6g/5g/4g | 5g/5g/4g/6g/6g/4g | 4g/3g/7g/5g/7g/6g | 25/60 | 35/60 | 131.3 | 11/60 | 1.96 | 4.02 | 971,727 |
| Tunnel vision | 2c/3c/2c/3c/4c/3g | 4c/2c/5g/4c/4c/3c | 4c/3g/3c/2c/3c/3c | 2c/4g/4g/4g/2c/5g | 3g/4c/5c/6g/5c/5c | 5c/4g/5g/3c/3c/5c | 4c/5g/5g/6g/6g/7g | 5g/3c/6g/4g/5c/5g | 4g/5g/7g/7g/7c/4g | 6g/5g/6g/3g/6g/4g | 29/60 | 31/60 | 135.4 | 9/60 | 2.04 | 4.27 | 1,072,497 |
| Distracted | 1c/1c/1c/1c/2c/2c | 2c/4c/5g/3c/3g/5c | 1c/0c/4c/3c/1c/3c | 3c/2c/5g/5g/4c/3c | 5g/3c/6g/5c/5c/5c | 6g/4g/5g/4g/6g/6g | 4c/5c/5g/5c/3c/5g | 5g/4g/5g/3c/5g/5g | 4c/5g/5g/7g/5g/5c | 7g/4g/5g/6g/5g/5g | 31/60 | 29/60 | 142.5 | 10/60 | 1.82 | 4.02 | 1,070,009 |
| skill 0 | 4g/3g/3g/4g/3g/3g | 4g/4c/3g/4g/4g/3g | 3g/3g/5g/4g/5g/5g | 3g/3g/4g/3g/3g/3g | 4g/3g/5g/3g/4g/4g | 4g/3g/3g/4g/3g/3g | 3g/3g/3g/3g/4g/3g | 3g/3g/3g/3g/3g/3g | 5g/3g/4g/3g/3g/4g | 3g/4g/4g/3g/3g/3g | 1/60 | 59/60 | 59.2 | 2/60 | 3.42 | 3.47 | 229,508 |
| skill 10 | 4g/4g/3g/3c/4g/3g | 5g/5g/4g/5g/4g/4g | 4c/4c/3g/1c/5g/4g | 4g/3g/3g/3g/3g/3g | 3g/5g/3g/5g/5g/5g | 3g/4g/3g/4g/3g/4g | 5g/3g/5g/3g/3g/5g | 4g/5g/3g/5g/3g/4g | 3g/4g/4g/3g/3g/4g | 3g/3g/4g/5g/3g/4g | 4/60 | 56/60 | 74.8 | 3/60 | 3.00 | 3.77 | 371,768 |
| skill 20 | 2c/4g/3g/2c/4c/4g | 5g/5g/4c/5g/3c/3g | 5g/2c/5g/4c/5g/3c | 4g/3g/3g/4g/5g/4g | 3g/4g/5g/4g/5g/3g | 5g/3g/4g/5g/4g/4g | 4g/5g/3g/3g/4g/3g | 4g/5g/4g/3g/5g/3g | 4g/3g/3g/4g/4g/3g | 5g/4g/5g/5g/4g/3g | 8/60 | 52/60 | 88.1 | 8/60 | 2.68 | 3.88 | 479,948 |
| skill 30 | 3c/3g/1c/3c/3g/3g | 3c/4g/5g/5g/3g/4g | 1c/3c/2c/2c/2c/1c | 5g/4c/5g/5g/3g/4c | 5g/3g/3c/5g/5g/4c | 4g/5g/5g/3g/3g/4g | 3g/4g/3g/5g/5g/6g | 4g/5g/5g/4c/4c/3g | 4g/4g/6g/3g/5g/4g | 5g/4g/3g/4g/5g/6g | 16/60 | 44/60 | 106.2 | 9/60 | 2.26 | 3.83 | 677,705 |
| skill 40 | 4c/4c/0c/1c/3c/3c | 3c/4g/4c/3c/5g/3c | 3c/3g/2c/4c/2c/1c | 5g/1c/5g/5g/4c/5g | 6g/5g/5c/6g/4c/6g | 4g/5g/4g/3g/4c/4g | 6c/6g/4c/5g/6g/6g | 4c/5g/5g/4g/5g/6g | 5g/4g/6g/4g/6c/5g | 4g/6g/3g/6g/5g/4g | 24/60 | 36/60 | 133.0 | 11/60 | 2.02 | 4.22 | 933,478 |
| skill 50 | 1c/2c/0c/3g/2c/2c | 4c/2c/4c/5c/3c/4c | 2c/1c/4c/3c/4c/3c | 2c/3c/3g/2c/5g/3c | 2c/4c/3c/2c/5g/3c | 4c/3g/6g/5c/5g/5g | 5g/4c/7g/6g/3c/2c | 4c/3c/5g/5g/5c/2c | 5g/5c/5g/5c/5g/6c | 6g/7g/4g/5g/6g/5g | 38/60 | 22/60 | 149.9 | 20/60 | 1.67 | 3.82 | 1,203,209 |
| skill 60 | 1c/4c/2c/2c/2c/2c | 3c/4c/4c/4c/5c/3c | 1c/2c/4c/2c/2c/4c | 3c/3c/4c/3c/1c/5c | 2c/5g/5c/3c/3c/3c | 3c/5g/3g/5c/3g/4g | 4c/5c/5g/3g/6g/3c | 3c/4c/5c/5g/2c/5g | 6g/6c/6c/7g/6c/5g | 6c/7g/6g/6c/6g/7g | 43/60 | 17/60 | 157.0 | 22/60 | 1.68 | 3.97 | 1,242,723 |
| skill 70 | 4g/2c/1c/2c/2c/0c | 4c/4g/1c/3c/3c/5c | 3c/2c/2c/3c/2c/1c | 1c/1c/0c/1c/3c/2c | 3c/6c/4c/2c/5c/3c | 0c/5c/4g/3c/5c/3c | 6c/2c/4c/3g/6g/3c | 5c/3c/5c/4c/4c/5g | 4c/4c/6g/5g/6g/7g | 6c/7g/5g/7g/5g/5g | 45/60 | 15/60 | 160.4 | 20/60 | 1.47 | 3.53 | 1,378,934 |
| skill 80 | 1c/0c/2c/1c/1c/0c | 1c/1c/1c/4c/1c/2c | 3c/0c/2c/0c/1c/1c | 3c/5g/4c/3c/1c/4c | 1c/4c/4c/3c/2c/2c | 4c/4c/2c/5g/3c/2c | 4c/3c/1c/1c/3c/5c | 1c/4c/3c/1c/1c/4g | 4c/6c/4c/5c/4c/4c | 3c/6c/3c/3c/6c/2c | 57/60 | 3/60 | 176.0 | 27/60 | 1.02 | 2.65 | 1,666,143 |
| skill 90 | 0c/1c/0c/1c/2c/0c | 2c/1c/1c/0c/0c/2c | 0c/0c/2c/1c/1c/0c | 2c/2c/0c/1c/0c/1c | 1c/2c/1c/1c/1c/2c | 1c/0c/1c/2c/2c/2c | 1c/2c/1c/2c/2c/2c | 2c/0c/0c/0c/1c/1c | 2c/1c/1c/2c/4c/2c | 0c/2c/1c/0c/6c/4c | 60/60 | 0/60 | 180.0 | 41/60 | 0.47 | 1.25 | 2,176,653 |
| skill 100 | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 30/30 | 0/30 | 180.0 | 30/30 | 0.00 | 0.00 | 3,051,264 |

### attack: is the skill slider monotonic? (skill 0 → 10 → 20 → 30 → 40 → 50 → 60 → 70 → 80 → 90 → 100)

Strictly: each step better than the last, or equal only at the floor or the ceiling (0, or every run). Weakly: never worse.

| Measure | skill 0 | skill 10 | skill 20 | skill 30 | skill 40 | skill 50 | skill 60 | skill 70 | skill 80 | skill 90 | skill 100 | Monotonic |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Cleared | 1/60 | 4/60 | 8/60 | 16/60 | 24/60 | 38/60 | 43/60 | 45/60 | 57/60 | 60/60 | 30/30 | strictly |
| Game overs | 59/60 | 56/60 | 52/60 | 44/60 | 36/60 | 22/60 | 17/60 | 15/60 | 3/60 | 0/60 | 0/30 | strictly |
| Survival (s) | 59.2 | 74.8 | 88.1 | 106.2 | 133.0 | 149.9 | 157.0 | 160.4 | 176.0 | 180.0 | 180.0 | strictly |
| No hit in the 1st min | 2/60 | 3/60 | 8/60 | 9/60 | 11/60 | 20/60 | 22/60 | 20/60 | 27/60 | 41/60 | 30/30 | **no** |
| Lives lost per minute played | 3.42 | 3.00 | 2.68 | 2.26 | 2.02 | 1.67 | 1.68 | 1.47 | 1.02 | 0.47 | 0.00 | **no** |
| Lives lost (mean; not a measure of skill: a game over caps it) | 3.47 | 3.77 | 3.88 | 3.83 | 4.22 | 3.82 | 3.97 | 3.53 | 2.65 | 1.25 | 0.00 | — |

The slider is **strictly monotonic** in clears, game overs and survival.

#### attack: per stage — cleared / survival (s), skill 0 → 10 → 20 → 30 → 40 → 50 → 60 → 70 → 80 → 90 → 100

| Stage | skill 0 | skill 10 | skill 20 | skill 30 | skill 40 | skill 50 | skill 60 | skill 70 | skill 80 | skill 90 | skill 100 | Weakly monotonic |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 0/6 · 95 | 1/6 · 120 | 3/6 · 151 | 3/6 · 122 | 6/6 · 180 | 5/6 · 160 | 6/6 · 180 | 5/6 · 169 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 2 | 1/6 · 89 | 0/6 · 102 | 2/6 · 139 | 1/6 · 99 | 4/6 · 156 | 6/6 · 180 | 6/6 · 180 | 5/6 · 159 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 3 | 0/6 · 95 | 3/6 · 135 | 3/6 · 158 | 6/6 · 180 | 5/6 · 157 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 4 | 0/6 · 47 | 0/6 · 47 | 0/6 · 69 | 2/6 · 131 | 2/6 · 153 | 4/6 · 142 | 6/6 · 180 | 6/6 · 180 | 5/6 · 172 | 6/6 · 180 | 3/3 · 180 | **no** |
| 5 | 0/6 · 78 | 0/6 · 84 | 0/6 · 71 | 2/6 · 128 | 2/6 · 157 | 5/6 · 169 | 5/6 · 164 | 6/6 · 180 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 6 | 0/6 · 44 | 0/6 · 58 | 0/6 · 85 | 0/6 · 76 | 1/6 · 92 | 2/6 · 128 | 2/6 · 93 | 5/6 · 164 | 5/6 · 168 | 6/6 · 180 | 3/3 · 180 | **no** |
| 7 | 0/6 · 42 | 0/6 · 65 | 0/6 · 59 | 0/6 · 79 | 2/6 · 149 | 3/6 · 159 | 3/6 · 139 | 4/6 · 150 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 8 | 0/6 · 27 | 0/6 · 57 | 0/6 · 63 | 2/6 · 111 | 1/6 · 111 | 4/6 · 154 | 4/6 · 156 | 5/6 · 168 | 5/6 · 160 | 6/6 · 180 | 3/3 · 180 | **no** |
| 9 | 0/6 · 45 | 0/6 · 40 | 0/6 · 37 | 0/6 · 73 | 1/6 · 101 | 3/6 · 137 | 3/6 · 152 | 2/6 · 137 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |
| 10 | 0/6 · 30 | 0/6 · 40 | 0/6 · 48 | 0/6 · 62 | 0/6 · 74 | 0/6 · 90 | 2/6 · 146 | 1/6 · 117 | 6/6 · 180 | 6/6 · 180 | 3/3 · 180 | **no** |

10 stage(s) not weakly monotonic in clears and survival. (A stage has only 6 runs per skill level: one run more or less is within the noise; the slider is judged on the totals above.)

### attack: the presets on the slider (equivalent skill, by each measure)

By shares of runs (cleared, no hit in the first minute) or seconds (survival): linear between the first two neighbouring skill levels that bracket the preset; "< 0" = weaker than skill 0.

| Preset | Cleared | ≈ skill | Survival (s) | ≈ skill | 1st min | ≈ skill |
|---|---:|---:|---:|---:|---:|---:|
| Ace | 30/30 | ≥ 90 | 180.0 | ≥ 90 | 30/30 | ≥ 100 |
| Expert | 30/30 | ≥ 90 | 180.0 | ≥ 90 | 30/30 | ≥ 100 |
| Steady | 56/60 | 79 | 174.4 | 79 | 33/60 | 84 |
| Score chaser | 10/60 | 23 | 88.2 | 20 | 3/60 | 10 |
| Cautious | 51/60 | 75 | 167.9 | 75 | 30/60 | 82 |
| Panicky | 25/60 | 41 | 131.3 | 39 | 11/60 | 40 |
| Tunnel vision | 29/60 | 44 | 135.4 | 41 | 9/60 | 30 |
| Distracted | 31/60 | 45 | 142.5 | 46 | 10/60 | 35 |

## The human layer at work (means per run)

| Player | Looks / frame | Lapses | Lapse frames | Mean delay (frames) | Bullets unattended / look | Panic frames | Inputs changed by the hands | of them blocked (hold / rate) | Overshoots | Slow mashes | CPU s |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Ace | — | — | — | — | — | — | — | — | — | — | 60.4 |
| Expert | — | — | — | — | — | — | — | — | — | — | 30.2 |
| Steady | 0.49 | 2.9 | 29 | 10.7 | 33.2 | 3438 | 2246 | 2021 | 72 | 8.4 | 9.8 |
| Score chaser | 0.32 | 2.1 | 35 | 14.3 | 12.3 | 990 | 1060 | 910 | 53 | 2.1 | 3.8 |
| Cautious | 0.33 | 4.5 | 77 | 15.0 | 33.4 | 3428 | 2126 | 1785 | 98 | 10.7 | 6.6 |
| Panicky | 0.32 | 3.9 | 66 | 17.6 | 17.4 | 3469 | 2215 | 1749 | 76 | 28.8 | 5.3 |
| Tunnel vision | 0.33 | 3.5 | 58 | 14.6 | 49.4 | 2144 | 1794 | 1549 | 80 | 5.4 | 3.4 |
| Distracted | 0.32 | 11.7 | 297 | 14.7 | 20.7 | 2376 | 1764 | 1512 | 80 | 5.8 | 5.7 |
| skill 0 | 0.24 | 1.6 | 35 | 21.4 | 31.3 | 1452 | 2181 | 2120 | 16 | 5.0 | 2.2 |
| skill 10 | 0.24 | 2.4 | 54 | 18.9 | 28.3 | 1584 | 2442 | 2341 | 24 | 5.7 | 3.0 |
| skill 20 | 0.24 | 2.7 | 54 | 17.7 | 23.3 | 1436 | 2427 | 2302 | 39 | 3.8 | 3.5 |
| skill 30 | 0.32 | 2.9 | 59 | 16.7 | 24.9 | 2037 | 2293 | 2113 | 50 | 6.0 | 4.0 |
| skill 40 | 0.33 | 3.6 | 68 | 15.7 | 23.9 | 2363 | 2300 | 2057 | 68 | 5.7 | 4.8 |
| skill 50 | 0.33 | 4.0 | 67 | 14.7 | 22.9 | 2585 | 1934 | 1661 | 85 | 6.8 | 5.9 |
| skill 60 | 0.33 | 4.0 | 64 | 13.6 | 20.6 | 2576 | 1778 | 1483 | 89 | 7.4 | 6.4 |
| skill 70 | 0.33 | 3.7 | 52 | 12.5 | 16.3 | 2417 | 1575 | 1302 | 85 | 5.9 | 7.1 |
| skill 80 | 0.33 | 3.6 | 46 | 11.5 | 16.1 | 2656 | 1161 | 887 | 102 | 5.8 | 8.1 |
| skill 90 | 0.49 | 2.0 | 16 | 7.2 | 3.9 | 1950 | 753 | 586 | 84 | 2.9 | 14.4 |
| skill 100 | — | — | — | — | — | — | — | — | — | — | 30.7 |

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

- shard 1/16: 66 runs at `46e0afb`, 1.8 min wall, 4 jobs on 4 cores
- shard 2/16: 66 runs at `46e0afb`, 2.8 min wall, 4 jobs on 4 cores
- shard 3/16: 66 runs at `46e0afb`, 2.7 min wall, 4 jobs on 4 cores
- shard 4/16: 66 runs at `46e0afb`, 2.8 min wall, 4 jobs on 4 cores
- shard 5/16: 66 runs at `46e0afb`, 3 min wall, 4 jobs on 4 cores
- shard 6/16: 66 runs at `46e0afb`, 2.7 min wall, 4 jobs on 4 cores
- shard 7/16: 66 runs at `46e0afb`, 2.9 min wall, 4 jobs on 4 cores
- shard 8/16: 66 runs at `46e0afb`, 3 min wall, 4 jobs on 4 cores
- shard 9/16: 66 runs at `46e0afb`, 3.1 min wall, 4 jobs on 4 cores
- shard 10/16: 66 runs at `46e0afb`, 3.2 min wall, 4 jobs on 4 cores
- shard 11/16: 65 runs at `46e0afb`, 2.6 min wall, 4 jobs on 4 cores
- shard 12/16: 65 runs at `46e0afb`, 2.9 min wall, 4 jobs on 4 cores
- shard 13/16: 65 runs at `46e0afb`, 2.4 min wall, 4 jobs on 4 cores
- shard 14/16: 65 runs at `46e0afb`, 2.4 min wall, 4 jobs on 4 cores
- shard 15/16: 65 runs at `46e0afb`, 1.8 min wall, 4 jobs on 4 cores
- shard 16/16: 65 runs at `46e0afb`, 2.2 min wall, 4 jobs on 4 cores
