# H2 — humanlike bots: presets and skill levels

Written by `bin/h2-sweep.mjs --merge` at commit `46e0afb`, 2026-10-04, from 1860 of 1860 runs (4.09 CPU-hours) in 16 shards.
Budget 1× = 600 units per frame. Seeds 1, 2, 3 (C rand() seed s, endlessSeed 7919 × s); bot seeds 1, 2. A cell: lives lost per run (g = game over, c = cleared, b = alive 3 min into the boss scene). "1st min" = runs with no hit in the first minute (3750 frames).

## attack: lives lost per stage (runs: seed × bot seed)

Survival = seconds to the game over, or 180 s for a run without one. Lost / min = lives lost per minute played.

| Player | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Cleared | Game overs | Survival (s) | 1st min | Lost / min | Lives lost (mean) | Mean score |
|---|---|---|---|---|---|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| Steady 0 | 3c/1c/3g/3c/3g/3c | 1c/5g/3g/3g/5g/3g | 3g/3g/3g/3c/4c/5g | 3g/3g/4g/5g/3g/5g | 3g/5g/5g/4g/4g/5g | 3g/4g/4g/3g/4g/5g | 5g/4g/5g/5g/3g/4g | 3g/4g/3g/4g/5g/5g | 4g/3g/3g/3g/3g/4g | 4g/3g/3g/4g/4g/3g | 7/60 | 53/60 | 82.0 | 3/60 | 2.71 | 3.67 | 358,818 |
| Steady 25 | 3g/1c/3c/3c/3c/1c | 6g/5g/4c/4g/0c/4c | 3c/1c/2c/0c/4c/4c | 5g/4c/5g/4g/4c/5g | 6g/3c/2c/5g/4g/6g | 4g/4g/4g/5g/4g/5g | 5g/5g/5g/6g/6g/4g | 6g/5g/6g/5g/5g/5g | 5g/5g/5g/5g/6g/5g | 3g/5g/4g/6c/5g/4g | 19/60 | 41/60 | 130.5 | 9/60 | 2.01 | 4.18 | 818,105 |
| Steady 50 | 0c/1c/2c/0c/1c/0c | 1c/0c/1c/3c/1c/2c | 3c/1c/3c/0c/0c/3c | 3c/2c/2c/3c/1c/1c | 2c/0c/1c/1c/1c/1c | 1c/1c/2c/2c/4c/2c | 2c/2c/6g/4c/1c/4c | 2c/0c/4c/3c/1c/4c | 6c/5c/3g/5g/4c/3c | 2c/3c/5g/5c/5c/3c | 56/60 | 4/60 | 174.4 | 33/60 | 0.86 | 2.23 | 1,544,246 |
| Steady 75 | 0c/0c/0c/0c/1c/0c | 0c/1c/0c/1c/2c/2c | 2c/0c/0c/2c/0c/0c | 0c/1c/5g/0c/1c/1c | 1c/1c/1c/1c/0c/1c | 2c/2c/0c/2c/3c/2c | 0c/1c/0c/0c/2c/1c | 2c/0c/0c/0c/1c/2c | 2c/2c/1c/1c/1c/1c | 6g/1c/6c/0c/2c/1c | 58/60 | 2/60 | 178.7 | 44/60 | 0.43 | 1.13 | 1,827,395 |
| Steady 100 | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 30/30 | 0/30 | 180.0 | 30/30 | 0.00 | 0.00 | 3,051,264 |
| Score chaser 0 | 3g/3g/3g/4g/3g/3g | 5g/3g/3g/3g/3g/3g | 3g/3g/3g/3g/5g/3g | 3g/3g/3g/3g/3g/3g | 4g/4g/3g/4g/3g/4g | 3g/3g/3g/4g/4g/3g | 4g/3g/3g/3g/3g/3g | 3g/3g/3g/4g/3g/3g | 4g/3g/3g/3g/3g/3g | 3g/4g/3g/4g/4g/3g | 0/60 | 60/60 | 42.3 | 0/60 | 4.43 | 3.28 | 169,923 |
| Score chaser 25 | 4g/3g/3g/3g/4g/4g | 5g/3g/4g/5g/3g/3g | 4c/5c/3g/3g/5c/3g | 3g/3g/3g/5g/4g/3g | 4g/3g/5g/4g/3g/3g | 4g/3g/4g/3g/3g/4g | 3g/3g/3g/3g/3g/6g | 3g/4g/3g/3g/3g/4g | 4g/3g/3g/3g/3g/3g | 4g/3g/3g/3g/3g/5g | 3/60 | 57/60 | 56.0 | 1/60 | 3.73 | 3.53 | 305,294 |
| Score chaser 50 | 4g/2c/2c/3c/3g/4g | 5c/5g/5c/4c/6g/5c | 4c/3g/3c/3g/3g/3g | 5g/5g/3g/5g/3g/3g | 5g/6g/6c/4g/4g/5g | 3g/4g/6g/4g/4g/3g | 3g/5g/5g/4g/5g/3g | 7g/5g/7g/3g/5g/4g | 3g/5g/5g/5g/5g/8g | 3g/6g/6g/5g/5g/6g | 10/60 | 50/60 | 88.2 | 3/60 | 3.06 | 4.38 | 759,083 |
| Score chaser 75 | 3g/2c/4g/2c/2c/2c | 4c/6g/4c/6g/6g/4c | 6g/3c/2c/5c/3g/6g | 5g/5c/4c/5c/4g/4g | 4c/7g/6c/6c/4c/6c | 6g/5c/5c/3c/4g/4g | 4g/3g/7g/7g/7g/7g | 3g/4g/6c/4c/7g/7g | 3g/6g/7g/4g/5g/6g | 6g/8g/7g/5g/6g/6g | 23/60 | 37/60 | 127.5 | 5/60 | 2.42 | 4.87 | 1,356,607 |
| Score chaser 100 | 1c/0c/1c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 30/30 | 0/30 | 180.0 | 30/30 | 0.03 | 0.07 | 4,076,732 |
| Cautious 0 | 1c/4g/3c/3g/4g/3c | 5g/3g/5g/3g/5g/3g | 3c/4c/4c/5g/4c/4c | 4g/3g/4g/4g/3g/3g | 4g/3g/5g/3g/3g/4g | 3g/3g/3g/4g/3g/3g | 3g/3g/5g/3g/3g/5g | 3g/3g/3g/4g/4g/4g | 3g/4g/3g/3g/3g/3g | 3g/4g/3g/4g/3g/4g | 8/60 | 52/60 | 79.7 | 5/60 | 2.68 | 3.52 | 310,438 |
| Cautious 25 | 3c/3c/2c/4g/1c/3g | 3g/5g/3c/3c/4g/4c | 3c/2c/3c/5g/5g/4c | 4g/5g/4c/3g/4g/4g | 5g/3g/4g/5c/3c/5c | 4g/5g/3g/5g/3g/4g | 5c/5g/5g/5g/3g/4g | 4g/4g/5c/4g/3g/3g | 5g/5g/5g/5g/3g/3g | 5g/5g/3g/3g/4g/4g | 17/60 | 43/60 | 108.6 | 8/60 | 2.24 | 3.88 | 576,822 |
| Cautious 50 | 1c/0c/0c/3c/1c/1c | 2c/5g/1c/1c/2c/3c | 1c/2c/1c/1c/0c/2c | 1c/1c/1c/2c/1c/4g | 3c/2c/4c/2c/5c/2c | 4c/3c/2c/3c/2c/4g | 4c/5c/5c/4c/3c/4c | 5c/5c/4c/4c/2c/3c | 5c/6g/3g/4c/2c/4c | 7g/5g/5g/4c/3g/5c | 51/60 | 9/60 | 167.9 | 30/60 | 1.16 | 2.90 | 1,297,418 |
| Cautious 75 | 1c/0c/0c/0c/0c/0c | 1c/3c/3c/1c/1c/1c | 0c/1c/2c/1c/1c/2c | 1c/0c/4c/0c/0c/0c | 0c/2c/1c/3c/1c/1c | 3c/1c/1c/0c/1c/2c | 1c/2c/1c/0c/1c/1c | 1c/4c/2c/2c/3c/0c | 1c/0c/1c/2c/3c/1c | 2c/3c/2c/2c/2c/4c | 60/60 | 0/60 | 180.0 | 46/60 | 0.50 | 1.33 | 1,574,022 |
| Cautious 100 | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 30/30 | 0/30 | 180.0 | 30/30 | 0.00 | 0.00 | 2,646,806 |
| Panicky 0 | 4g/3g/3g/2c/3g/3g | 4g/4g/3g/4g/3g/3g | 3g/5g/5g/5g/3g/3g | 3g/3g/4g/3g/3g/3g | 5g/5g/4g/4g/4g/4g | 3g/3g/3g/3g/3g/3g | 3g/5g/3g/3g/3g/3g | 3g/3g/4g/4g/4g/5g | 4g/4g/3g/3g/4g/3g | 3g/3g/3g/3g/3g/3g | 1/60 | 59/60 | 58.9 | 2/60 | 3.43 | 3.47 | 235,337 |
| Panicky 25 | 0c/1c/3c/3g/2c/3c | 5g/5g/5g/3g/3c/3g | 3c/4c/5g/3g/3g/3g | 4g/4g/4c/5g/4g/5g | 4g/3g/3g/4g/4g/4g | 3g/4g/4g/4g/3g/5g | 5g/5g/6g/5g/4g/5g | 4g/4g/5g/4g/4g/4g | 4g/3g/3g/3g/4g/4g | 4g/3g/4g/4g/4g/4g | 9/60 | 51/60 | 88.1 | 6/60 | 2.63 | 3.78 | 449,413 |
| Panicky 50 | 2c/3c/2c/1c/3c/1c | 4c/3c/3c/3g/5c/5c | 1c/1c/2c/3c/1c/3c | 3g/3g/4c/5g/3c/4c | 6g/6g/5c/3c/5g/4c | 4g/4g/3g/6g/4g/5g | 6g/6g/1c/4c/6g/5g | 4g/5g/4g/6g/5g/4g | 5g/5g/4g/6g/6g/4g | 4g/3g/7g/5g/7g/6g | 25/60 | 35/60 | 131.3 | 11/60 | 1.96 | 4.02 | 971,727 |
| Panicky 75 | 0c/1c/1c/1c/0c/1c | 4c/2c/2c/3c/4c/1c | 2c/0c/2c/2c/0c/0c | 2c/2c/1c/0c/2c/3c | 6g/2c/6g/2c/6g/4c | 3c/4c/3c/4c/4c/2c | 2c/1c/2c/2c/4c/3c | 2c/4g/2c/5g/4c/1c | 6g/4c/6g/5c/3c/5c | 4g/4g/6g/6c/4c/6g | 49/60 | 11/60 | 167.7 | 24/60 | 1.15 | 2.88 | 1,504,980 |
| Panicky 100 | 0c/0c/0c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 1c/0c/0c/0c/0c/0c | 1c/0c/0c/0c/0c/1c | 0c/1c/1c/0c/1c/0c | 2c/0c/0c/1c/0c/1c | 60/60 | 0/60 | 180.0 | 58/60 | 0.06 | 0.17 | 2,926,273 |
| Tunnel vision 0 | 3g/3g/3g/4g/3g/3g | 3g/3g/4g/4g/3g/3g | 3g/5g/5g/4c/4c/3g | 5g/3g/4g/3g/3g/3g | 3g/3g/3g/4g/3g/5g | 3g/3g/3g/3g/4g/4g | 4g/4g/5g/3g/4g/3g | 4g/3g/3g/5g/4g/3g | 3g/4g/4g/5g/3g/4g | 4g/4g/3g/3g/4g/4g | 2/60 | 58/60 | 63.4 | 2/60 | 3.32 | 3.58 | 272,096 |
| Tunnel vision 25 | 2c/3c/4g/3c/3g/3g | 5g/3g/5g/5g/5g/5g | 3g/1c/4c/2c/5g/3g | 3g/3g/5g/5g/4g/4g | 4g/5g/4g/5g/5g/5g | 5g/4g/3g/3g/4g/3g | 3g/3g/5g/4g/3g/4g | 5g/4g/4g/5g/4g/4g | 4g/4g/3g/4g/3g/5g | 5g/3g/4g/3g/4g/4g | 6/60 | 54/60 | 82.9 | 3/60 | 2.81 | 3.87 | 469,734 |
| Tunnel vision 50 | 2c/3c/2c/3c/4c/3g | 4c/2c/5g/4c/4c/3c | 4c/3g/3c/2c/3c/3c | 2c/4g/4g/4g/2c/5g | 3g/4c/5c/6g/5c/5c | 5c/4g/5g/3c/3c/5c | 4c/5g/5g/6g/6g/7g | 5g/3c/6g/4g/5c/5g | 4g/5g/7g/7g/7c/4g | 6g/5g/6g/3g/6g/4g | 29/60 | 31/60 | 135.4 | 9/60 | 2.04 | 4.27 | 1,072,497 |
| Tunnel vision 75 | 2c/0c/1c/1c/2c/3c | 2c/3c/2c/4c/3c/1c | 0c/1c/1c/0c/0c/2c | 1c/4c/3c/2c/0c/0c | 1c/3c/1c/4c/2c/3c | 1c/3c/3c/1c/0c/0c | 6c/5g/5c/1c/1c/2c | 2c/5c/6c/3c/1c/3c | 2c/7g/4c/4c/2c/3c | 4c/4g/6g/3c/3c/7c | 56/60 | 4/60 | 174.3 | 29/60 | 0.97 | 2.48 | 1,777,321 |
| Tunnel vision 100 | 0c/0c/0c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 60/60 | 0/60 | 180.0 | 60/60 | 0.00 | 0.00 | 3,068,070 |
| Distracted 0 | 2c/3g/3g/4g/3g/3g | 4g/3g/3g/4g/4g/3g | 5g/5g/5g/5g/5g/4g | 3g/3g/3g/5g/3g/3g | 4g/3g/4g/3g/4g/3g | 3g/3g/3g/3g/4g/3g | 4g/3g/3g/3g/3g/3g | 3g/4g/3g/4g/3g/4g | 3g/3g/5g/3g/4g/4g | 4g/3g/3g/3g/3g/4g | 1/60 | 59/60 | 63.5 | 3/60 | 3.22 | 3.50 | 243,827 |
| Distracted 25 | 2c/1c/2c/3g/3g/4g | 5g/5g/3g/3g/3c/3g | 3c/3c/3c/3g/3c/4c | 3g/3g/3g/4g/3g/5g | 4g/5g/4g/4g/5g/6g | 4g/4g/5g/4g/4g/4g | 4g/4g/3g/4g/4g/5g | 5g/5g/4g/4g/4g/4g | 4g/4g/5g/4g/4g/5g | 4g/4g/3g/3g/4g/4g | 9/60 | 51/60 | 90.4 | 7/60 | 2.57 | 3.80 | 490,662 |
| Distracted 50 | 1c/1c/1c/1c/2c/2c | 2c/4c/5g/3c/3g/5c | 1c/0c/4c/3c/1c/3c | 3c/2c/5g/5g/4c/3c | 5g/3c/6g/5c/5c/5c | 6g/4g/5g/4g/6g/6g | 4c/5c/5g/5c/3c/5g | 5g/4g/5g/3c/5g/5g | 4c/5g/5g/7g/5g/5c | 7g/4g/5g/6g/5g/5g | 31/60 | 29/60 | 142.5 | 10/60 | 1.82 | 4.02 | 1,070,009 |
| Distracted 75 | 2c/3c/1c/0c/0c/0c | 3c/2c/3c/2c/2c/4c | 1c/0c/1c/5c/2c/1c | 4g/5g/1c/4c/4c/5g | 2c/2c/2c/4c/2c/3c | 4c/3c/4c/3c/3c/5c | 3c/5c/4c/5c/5c/3c | 3c/4c/4c/3c/2c/2c | 5c/5g/2c/5c/5c/1c | 6g/6g/5c/5c/5g/6g | 52/60 | 8/60 | 172.6 | 25/60 | 1.24 | 3.18 | 1,477,740 |
| Distracted 100 | 0c/0c/0c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 0c/0c/0c/0c/0c/0c | 1c/0c/0c/0c/0c/0c | 0c/0c/1c/0c/1c/1c | 0c/0c/0c/0c/0c/0c | 0c/0c/1c/0c/0c/0c | 0c/1c/0c/1c/0c/0c | 60/60 | 0/60 | 180.0 | 58/60 | 0.04 | 0.12 | 3,019,619 |
| skill 0 | 4g/3g/3g/4g/3g/3g | 4g/4c/3g/4g/4g/3g | 3g/3g/5g/4g/5g/5g | 3g/3g/4g/3g/3g/3g | 4g/3g/5g/3g/4g/4g | 4g/3g/3g/4g/3g/3g | 3g/3g/3g/3g/4g/3g | 3g/3g/3g/3g/3g/3g | 5g/3g/4g/3g/3g/4g | 3g/4g/4g/3g/3g/3g | 1/60 | 59/60 | 59.2 | 2/60 | 3.42 | 3.47 | 229,508 |
| skill 50 | 1c/2c/0c/3g/2c/2c | 4c/2c/4c/5c/3c/4c | 2c/1c/4c/3c/4c/3c | 2c/3c/3g/2c/5g/3c | 2c/4c/3c/2c/5g/3c | 4c/3g/6g/5c/5g/5g | 5g/4c/7g/6g/3c/2c | 4c/3c/5g/5g/5c/2c | 5g/5c/5g/5c/5g/6c | 6g/7g/4g/5g/6g/5g | 38/60 | 22/60 | 149.9 | 20/60 | 1.67 | 3.82 | 1,203,209 |
| skill 100 | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 0c/0c/0c | 30/30 | 0/30 | 180.0 | 30/30 | 0.00 | 0.00 | 3,051,264 |

### attack: is the skill slider monotonic? (skill 0 → 50 → 100)

Strictly: each step better than the last, or equal only at the floor or the ceiling (0, or every run). Weakly: never worse.

| Measure | skill 0 | skill 50 | skill 100 | Monotonic |
|---|---:|---:|---:|---|
| Cleared | 1/60 | 38/60 | 30/30 | strictly |
| Game overs | 59/60 | 22/60 | 0/30 | strictly |
| Survival (s) | 59.2 | 149.9 | 180.0 | strictly |
| No hit in the 1st min | 2/60 | 20/60 | 30/30 | strictly |
| Lives lost per minute played | 3.42 | 1.67 | 0.00 | strictly |
| Lives lost (mean; not a measure of skill: a game over caps it) | 3.47 | 3.82 | 0.00 | — |

The slider is **strictly monotonic** in clears, game overs and survival.

#### attack: per stage — cleared / survival (s), skill 0 → 50 → 100

| Stage | skill 0 | skill 50 | skill 100 | Weakly monotonic |
|---|---:|---:|---:|---|
| 1 | 0/6 · 95 | 5/6 · 160 | 3/3 · 180 | yes |
| 2 | 1/6 · 89 | 6/6 · 180 | 3/3 · 180 | yes |
| 3 | 0/6 · 95 | 6/6 · 180 | 3/3 · 180 | yes |
| 4 | 0/6 · 47 | 4/6 · 142 | 3/3 · 180 | yes |
| 5 | 0/6 · 78 | 5/6 · 169 | 3/3 · 180 | yes |
| 6 | 0/6 · 44 | 2/6 · 128 | 3/3 · 180 | yes |
| 7 | 0/6 · 42 | 3/6 · 159 | 3/3 · 180 | yes |
| 8 | 0/6 · 27 | 4/6 · 154 | 3/3 · 180 | yes |
| 9 | 0/6 · 45 | 3/6 · 137 | 3/3 · 180 | yes |
| 10 | 0/6 · 30 | 0/6 · 90 | 3/3 · 180 | yes |

Every stage shown is weakly monotonic in clears and survival. (A stage has only 6 runs per skill level: one run more or less is within the noise; the slider is judged on the totals above.)

### attack: the presets on the slider (equivalent skill, by each measure)

By shares of runs (cleared, no hit in the first minute) or seconds (survival): linear between the first two neighbouring skill levels that bracket the preset; "< 0" = weaker than skill 0.

| Preset | Cleared | ≈ skill | Survival (s) | ≈ skill | 1st min | ≈ skill |
|---|---:|---:|---:|---:|---:|---:|
| Steady 0 | 7/60 | 8 | 82.0 | 13 | 3/60 | 3 |
| Steady 25 | 19/60 | 24 | 130.5 | 39 | 9/60 | 19 |
| Steady 50 | 56/60 | 91 | 174.4 | 91 | 33/60 | 66 |
| Steady 75 | 58/60 | 95 | 178.7 | 98 | 44/60 | 80 |
| Steady 100 | 30/30 | ≥ 100 | 180.0 | ≥ 100 | 30/30 | ≥ 100 |
| Score chaser 0 | 0/60 | < 0 | 42.3 | < 0 | 0/60 | < 0 |
| Score chaser 25 | 3/60 | 3 | 56.0 | < 0 | 1/60 | < 0 |
| Score chaser 50 | 10/60 | 12 | 88.2 | 16 | 3/60 | 3 |
| Score chaser 75 | 23/60 | 30 | 127.5 | 38 | 5/60 | 8 |
| Score chaser 100 | 30/30 | ≥ 100 | 180.0 | ≥ 100 | 30/30 | ≥ 100 |
| Cautious 0 | 8/60 | 9 | 79.7 | 11 | 5/60 | 8 |
| Cautious 25 | 17/60 | 22 | 108.6 | 27 | 8/60 | 17 |
| Cautious 50 | 51/60 | 80 | 167.9 | 80 | 30/60 | 63 |
| Cautious 75 | 60/60 | ≥ 100 | 180.0 | ≥ 100 | 46/60 | 83 |
| Cautious 100 | 30/30 | ≥ 100 | 180.0 | ≥ 100 | 30/30 | ≥ 100 |
| Panicky 0 | 1/60 | 0 | 58.9 | < 0 | 2/60 | 0 |
| Panicky 25 | 9/60 | 11 | 88.1 | 16 | 6/60 | 11 |
| Panicky 50 | 25/60 | 32 | 131.3 | 40 | 11/60 | 25 |
| Panicky 75 | 49/60 | 75 | 167.7 | 80 | 24/60 | 55 |
| Panicky 100 | 60/60 | ≥ 100 | 180.0 | ≥ 100 | 58/60 | 98 |
| Tunnel vision 0 | 2/60 | 1 | 63.4 | 2 | 2/60 | 0 |
| Tunnel vision 25 | 6/60 | 7 | 82.9 | 13 | 3/60 | 3 |
| Tunnel vision 50 | 29/60 | 38 | 135.4 | 42 | 9/60 | 19 |
| Tunnel vision 75 | 56/60 | 91 | 174.3 | 91 | 29/60 | 61 |
| Tunnel vision 100 | 60/60 | ≥ 100 | 180.0 | ≥ 100 | 60/60 | ≥ 100 |
| Distracted 0 | 1/60 | 0 | 63.5 | 2 | 3/60 | 3 |
| Distracted 25 | 9/60 | 11 | 90.4 | 17 | 7/60 | 14 |
| Distracted 50 | 31/60 | 41 | 142.5 | 46 | 10/60 | 22 |
| Distracted 75 | 52/60 | 82 | 172.6 | 88 | 25/60 | 56 |
| Distracted 100 | 60/60 | ≥ 100 | 180.0 | ≥ 100 | 58/60 | 98 |

## The human layer at work (means per run)

| Player | Looks / frame | Lapses | Lapse frames | Mean delay (frames) | Bullets unattended / look | Panic frames | Inputs changed by the hands | of them blocked (hold / rate) | Overshoots | Slow mashes | CPU s |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Steady 0 | 0.32 | 1.7 | 26 | 15.2 | 36.9 | 2266 | 2601 | 2547 | 16 | 5.7 | 3.0 |
| Steady 25 | 0.33 | 2.0 | 23 | 12.7 | 32.6 | 2847 | 2730 | 2630 | 39 | 4.7 | 4.5 |
| Steady 50 | 0.49 | 2.9 | 29 | 10.7 | 33.2 | 3438 | 2246 | 2021 | 72 | 8.4 | 9.1 |
| Steady 75 | 0.49 | 2.3 | 18 | 8.4 | 22.1 | 2911 | 1074 | 880 | 92 | 4.6 | 13.6 |
| Steady 100 | — | — | — | — | — | — | — | — | — | — | 30.2 |
| Score chaser 0 | 0.24 | 1.2 | 26 | 21.1 | 26.2 | 920 | 1544 | 1500 | 10 | 3.4 | 1.8 |
| Score chaser 25 | 0.32 | 1.3 | 25 | 17.5 | 16.8 | 682 | 1336 | 1258 | 24 | 1.5 | 2.3 |
| Score chaser 50 | 0.32 | 2.1 | 35 | 14.3 | 12.3 | 990 | 1060 | 910 | 53 | 2.1 | 3.6 |
| Score chaser 75 | 0.33 | 2.8 | 39 | 12.3 | 8.8 | 1349 | 756 | 567 | 83 | 1.9 | 5.4 |
| Score chaser 100 | — | — | — | — | — | — | — | — | — | — | 31.7 |
| Cautious 0 | 0.24 | 2.5 | 60 | 21.6 | 37.5 | 2009 | 2897 | 2813 | 21 | 7.5 | 2.0 |
| Cautious 25 | 0.32 | 3.2 | 67 | 18.0 | 32.3 | 2245 | 2703 | 2549 | 42 | 6.8 | 3.0 |
| Cautious 50 | 0.33 | 4.5 | 77 | 15.0 | 33.4 | 3428 | 2126 | 1785 | 98 | 10.7 | 5.8 |
| Cautious 75 | 0.33 | 3.8 | 53 | 12.8 | 25.7 | 3292 | 1194 | 874 | 113 | 7.8 | 8.0 |
| Cautious 100 | — | — | — | — | — | — | — | — | — | — | 30.9 |
| Panicky 0 | 0.24 | 2.0 | 47 | 25.5 | 28.0 | 2116 | 2376 | 2266 | 15 | 21.3 | 1.8 |
| Panicky 25 | 0.32 | 2.7 | 56 | 20.8 | 20.6 | 2383 | 2509 | 2308 | 34 | 20.0 | 2.8 |
| Panicky 50 | 0.32 | 3.9 | 66 | 17.6 | 17.4 | 3469 | 2215 | 1749 | 76 | 28.8 | 4.7 |
| Panicky 75 | 0.33 | 3.6 | 50 | 15.2 | 13.3 | 4161 | 1715 | 1081 | 105 | 31.9 | 6.7 |
| Panicky 100 | 0.99 | 0.0 | 0 | 0.8 | 0.0 | 2199 | 159 | 0 | 0 | 9.3 | 29.2 |
| Tunnel vision 0 | 0.24 | 1.8 | 42 | 21.4 | 41.2 | 1606 | 2313 | 2241 | 18 | 5.8 | 1.5 |
| Tunnel vision 25 | 0.32 | 2.4 | 49 | 17.6 | 41.2 | 1395 | 2137 | 2029 | 34 | 2.8 | 1.8 |
| Tunnel vision 50 | 0.33 | 3.5 | 58 | 14.6 | 49.4 | 2144 | 1794 | 1549 | 80 | 5.4 | 2.9 |
| Tunnel vision 75 | 0.33 | 3.9 | 55 | 12.6 | 57.3 | 2613 | 1167 | 874 | 113 | 5.5 | 3.7 |
| Tunnel vision 100 | 0.99 | 0.0 | 0 | 0.0 | 22.5 | 0 | 0 | 0 | 0 | 0.0 | 21.5 |
| Distracted 0 | 0.23 | 6.1 | 201 | 21.4 | 31.6 | 1604 | 2195 | 2122 | 18 | 5.9 | 1.7 |
| Distracted 25 | 0.31 | 8.3 | 235 | 17.8 | 25.8 | 1724 | 2164 | 2030 | 39 | 4.5 | 2.7 |
| Distracted 50 | 0.32 | 11.7 | 297 | 14.7 | 20.7 | 2376 | 1764 | 1512 | 80 | 5.8 | 4.6 |
| Distracted 75 | 0.32 | 13.4 | 299 | 12.6 | 16.0 | 2601 | 1101 | 833 | 106 | 4.6 | 6.6 |
| Distracted 100 | 0.98 | 9.0 | 89 | 0.0 | 0.0 | 0 | 0 | 0 | 0 | 0.0 | 22.9 |
| skill 0 | 0.24 | 1.6 | 35 | 21.4 | 31.3 | 1452 | 2181 | 2120 | 16 | 5.0 | 1.7 |
| skill 50 | 0.33 | 4.0 | 67 | 14.7 | 22.9 | 2585 | 1934 | 1661 | 85 | 6.8 | 4.4 |
| skill 100 | — | — | — | — | — | — | — | — | — | — | 31.3 |

## The settings

| Knob | Steady 0 | Steady 25 | Steady 50 | Steady 75 | Steady 100 | Score chaser 0 | Score chaser 25 | Score chaser 50 | Score chaser 75 | Score chaser 100 | Cautious 0 | Cautious 25 | Cautious 50 | Cautious 75 | Cautious 100 | Panicky 0 | Panicky 25 | Panicky 50 | Panicky 75 | Panicky 100 | Tunnel vision 0 | Tunnel vision 25 | Tunnel vision 50 | Tunnel vision 75 | Tunnel vision 100 | Distracted 0 | Distracted 25 | Distracted 50 | Distracted 75 | Distracted 100 | skill 0 | skill 50 | skill 100 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| reaction (frames) | 14 | 12 | 10 | 8 | 0 | 20 | 17 | 14 | 12 | 0 | 20 | 17 | 14 | 12 | 0 | 20 | 17 | 14 | 12 | 0 | 20 | 17 | 14 | 12 | 0 | 20 | 17 | 14 | 12 | 0 | 20 | 14 | 0 |
| attentionRadius (px) | 120 | 159 | 194 | 238 | 600 | 120 | 159 | 194 | 238 | 600 | 120 | 159 | 194 | 238 | 600 | 120 | 159 | 194 | 238 | 600 | 33 | 44 | 54 | 66 | 166 | 120 | 159 | 194 | 238 | 600 | 120 | 194 | 600 |
| attentionCount (bullets) | 24 | 46 | 74 | 118 | 1024 | 24 | 46 | 74 | 118 | 1024 | 24 | 46 | 74 | 118 | 1024 | 24 | 46 | 74 | 118 | 1024 | 8 | 15 | 24 | 38 | 332 | 24 | 46 | 74 | 118 | 1024 | 24 | 74 | 1024 |
| misjudge (px) | 2.75 | 2.25 | 2 | 1.5 | 0 | 4 | 3.25 | 2.75 | 2.25 | 0 | 4 | 3.25 | 2.75 | 2.25 | 0 | 4 | 3.25 | 2.75 | 2.25 | 0 | 4 | 3.25 | 2.75 | 2.25 | 0 | 4 | 3.25 | 2.75 | 2.25 | 0 | 4 | 2.75 | 0 |
| horizon (frames) | 26 | 30 | 32 | 35 | 48 | 16 | 22 | 26 | 30 | 48 | 16 | 22 | 26 | 30 | 48 | 16 | 22 | 26 | 30 | 48 | 16 | 22 | 26 | 30 | 48 | 16 | 22 | 26 | 30 | 48 | 16 | 26 | 48 |
| replanEvery (frames) | 3 | 3 | 2 | 2 | 1 | 4 | 3 | 3 | 3 | 1 | 4 | 3 | 3 | 3 | 1 | 4 | 3 | 3 | 3 | 1 | 4 | 3 | 3 | 3 | 1 | 4 | 3 | 3 | 3 | 1 | 4 | 3 | 1 |
| marginBullet (px) | 10.5 | 8.75 | 7.5 | 6.5 | 2 | 4 | 3.5 | 3 | 2.75 | 1 | 12 | 10.5 | 9.25 | 8.25 | 3 | 8 | 7 | 6.25 | 5.5 | 2 | 8 | 7 | 6.25 | 5.5 | 2 | 8 | 7 | 6.25 | 5.5 | 2 | 8 | 6.25 | 2 |
| marginSpawner (px) | 19 | 17 | 16 | 14 | 8 | 12 | 11 | 10 | 9 | 6 | 24 | 22 | 20 | 19 | 12 | 16 | 15 | 14 | 13 | 8 | 16 | 15 | 14 | 13 | 8 | 16 | 15 | 14 | 13 | 8 | 16 | 14 | 8 |
| marginTop (px) | 220 | 205 | 195 | 184 | 136 | 165 | 154 | 146 | 138 | 102 | 264 | 246 | 234 | 221 | 163 | 220 | 205 | 195 | 184 | 136 | 220 | 205 | 195 | 184 | 136 | 220 | 205 | 195 | 184 | 136 | 220 | 195 | 136 |
| attackY (px) | 330 | 300 | 279 | 258 | 160 | 215 | 195 | 181 | 168 | 104 | 413 | 375 | 349 | 322 | 200 | 330 | 300 | 279 | 258 | 160 | 330 | 300 | 279 | 258 | 160 | 330 | 300 | 279 | 258 | 160 | 330 | 279 | 160 |
| starWeight (per point) | 0 | 0 | 0 | 0 | 0 | 0.02 | 0.02 | 0.02 | 0.02 | 0.02 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| slowUse (0–1) | 0.3 | 0.4 | 0.5 | 0.6 | 1 | 0.3 | 0.4 | 0.5 | 0.6 | 1 | 0.3 | 0.4 | 0.5 | 0.6 | 1 | 0.3 | 0.4 | 0.5 | 0.6 | 1 | 0.3 | 0.4 | 0.5 | 0.6 | 1 | 0.3 | 0.4 | 0.5 | 0.6 | 1 | 0.3 | 0.5 | 1 |
| minHold (frames) | 7 | 6 | 5 | 4 | 1 | 7 | 6 | 5 | 4 | 1 | 7 | 6 | 5 | 4 | 1 | 7 | 6 | 5 | 4 | 1 | 7 | 6 | 5 | 4 | 1 | 7 | 6 | 5 | 4 | 1 | 7 | 5 | 1 |
| maxRate (changes/s) | 4 | 6.5 | 9 | 13 | 62.5 | 4 | 6.5 | 9 | 13 | 62.5 | 4 | 6.5 | 9 | 13 | 62.5 | 4 | 6.5 | 9 | 13 | 62.5 | 4 | 6.5 | 9 | 13 | 62.5 | 4 | 6.5 | 9 | 13 | 62.5 | 4 | 9 | 62.5 |
| overshootP (0–1) | 0.21 | 0.17 | 0.15 | 0.12 | 0 | 0.3 | 0.25 | 0.21 | 0.17 | 0 | 0.3 | 0.25 | 0.21 | 0.17 | 0 | 0.3 | 0.25 | 0.21 | 0.17 | 0 | 0.3 | 0.25 | 0.21 | 0.17 | 0 | 0.3 | 0.25 | 0.21 | 0.17 | 0 | 0.3 | 0.21 | 0 |
| overshootFrames (frames) | 4 | 3 | 3 | 2 | 0 | 6 | 5 | 4 | 3 | 0 | 6 | 5 | 4 | 3 | 0 | 6 | 5 | 4 | 3 | 0 | 6 | 5 | 4 | 3 | 0 | 6 | 5 | 4 | 3 | 0 | 6 | 4 | 0 |
| lapseRate (per min) | 1.8 | 1.5 | 1.3 | 1 | 0 | 3 | 2.5 | 2.1 | 1.7 | 0 | 3 | 2.5 | 2.1 | 1.7 | 0 | 3 | 2.5 | 2.1 | 1.7 | 0 | 3 | 2.5 | 2.1 | 1.7 | 0 | 7.5 | 7 | 6.6 | 6.2 | 4.5 | 3 | 2.1 | 0 |
| lapseFrames (frames) | 14 | 12 | 10 | 8 | 0 | 24 | 20 | 17 | 14 | 0 | 24 | 20 | 17 | 14 | 0 | 24 | 20 | 17 | 14 | 0 | 24 | 20 | 17 | 14 | 0 | 34 | 29 | 26 | 23 | 10 | 24 | 17 | 0 |
| panicFrom (bullets) | 40 | 59 | 73 | 87 | 150 | 40 | 59 | 73 | 87 | 150 | 40 | 59 | 73 | 87 | 150 | 24 | 36 | 44 | 52 | 90 | 40 | 59 | 73 | 87 | 150 | 40 | 59 | 73 | 87 | 150 | 40 | 73 | 150 |
| panicTo (bullets) | 150 | 194 | 225 | 256 | 400 | 150 | 194 | 225 | 256 | 400 | 150 | 194 | 225 | 256 | 400 | 90 | 116 | 135 | 154 | 240 | 150 | 194 | 225 | 256 | 400 | 150 | 194 | 225 | 256 | 400 | 150 | 225 | 400 |
| panicReaction (frames) | 6 | 5 | 4 | 3 | 0 | 8 | 7 | 6 | 5 | 0 | 8 | 7 | 6 | 5 | 0 | 16 | 15 | 14 | 13 | 8 | 8 | 7 | 6 | 5 | 0 | 8 | 7 | 6 | 5 | 0 | 8 | 6 | 0 |
| panicMisjudge (px) | 2 | 1.75 | 1.5 | 1.25 | 0 | 3 | 2.5 | 2 | 1.75 | 0 | 3 | 2.5 | 2 | 1.75 | 0 | 6 | 5.5 | 5 | 4.75 | 3 | 3 | 2.5 | 2 | 1.75 | 0 | 3 | 2.5 | 2 | 1.75 | 0 | 3 | 2 | 0 |
| panicSlow (0–1) | 0.2 | 0.15 | 0.15 | 0.1 | 0 | 0.3 | 0.25 | 0.2 | 0.15 | 0 | 0.3 | 0.25 | 0.2 | 0.15 | 0 | 0.6 | 0.55 | 0.5 | 0.45 | 0.3 | 0.3 | 0.25 | 0.2 | 0.15 | 0 | 0.3 | 0.25 | 0.2 | 0.15 | 0 | 0.3 | 0.2 | 0 |

## Shards

- shard 1/16: 117 runs at `46e0afb`, 4.2 min wall, 4 jobs on 4 cores
- shard 2/16: 117 runs at `46e0afb`, 3.7 min wall, 4 jobs on 4 cores
- shard 3/16: 117 runs at `46e0afb`, 4.4 min wall, 4 jobs on 4 cores
- shard 4/16: 117 runs at `46e0afb`, 4.7 min wall, 4 jobs on 4 cores
- shard 5/16: 116 runs at `46e0afb`, 4.5 min wall, 4 jobs on 4 cores
- shard 6/16: 116 runs at `46e0afb`, 4.8 min wall, 4 jobs on 4 cores
- shard 7/16: 116 runs at `46e0afb`, 4.8 min wall, 4 jobs on 4 cores
- shard 8/16: 116 runs at `46e0afb`, 4.9 min wall, 4 jobs on 4 cores
- shard 9/16: 116 runs at `46e0afb`, 3 min wall, 4 jobs on 4 cores
- shard 10/16: 116 runs at `46e0afb`, 5.1 min wall, 4 jobs on 4 cores
- shard 11/16: 116 runs at `46e0afb`, 5 min wall, 4 jobs on 4 cores
- shard 12/16: 116 runs at `46e0afb`, 3.1 min wall, 4 jobs on 4 cores
- shard 13/16: 116 runs at `46e0afb`, 3.6 min wall, 4 jobs on 4 cores
- shard 14/16: 116 runs at `46e0afb`, 4.8 min wall, 4 jobs on 4 cores
- shard 15/16: 116 runs at `46e0afb`, 2.8 min wall, 4 jobs on 4 cores
- shard 16/16: 116 runs at `46e0afb`, 2.7 min wall, 4 jobs on 4 cores
