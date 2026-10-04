# H2 — humanlike bots: presets and skill levels

Written by `bin/h2-sweep.mjs --merge` at commit `52f78a7`, 2026-10-04, from 26 of 26 runs (0.06 CPU-hours) in 2 shards.
Budget 1× = 600 units per frame. Seeds 1 (C rand() seed s, endlessSeed 7919 × s); bot seeds 1. A cell: lives lost per run (g = game over, c = cleared, b = alive 3 min into the boss scene). "1st min" = runs with no hit in the first minute (3750 frames).

## attack: lives lost per stage (runs: seed)

| Player | 1 | 6 | Lives lost (mean) | Game overs | Cleared | 1st min | Mean score |
|---|---|---|---:|---:|---:|---:|---:|
| Ace | 0c | 0c | 0.00 | 0/2 | 2/2 | 2/2 | 2,946,770 |
| Expert | 0c | 0c | 0.00 | 0/2 | 2/2 | 2/2 | 2,348,375 |
| Steady veteran | 1c | 2c | 1.50 | 0/2 | 2/2 | 2/2 | 1,617,430 |
| Score chaser | 4g | 5g | 4.50 | 2/2 | 0/2 | 0/2 | 477,895 |
| Cautious beginner | 4g | 4g | 4.00 | 2/2 | 0/2 | 1/2 | 372,685 |
| Panicky | 2c | 5g | 3.50 | 1/2 | 1/2 | 0/2 | 732,290 |
| Tunnel vision | 3g | 6g | 4.50 | 2/2 | 0/2 | 0/2 | 629,480 |
| Distracted | 4g | 5g | 4.50 | 2/2 | 0/2 | 0/2 | 629,735 |
| skill 0 | 4g | 4g | 4.00 | 2/2 | 0/2 | 1/2 | 372,685 |
| skill 25 | 4c | 4g | 4.00 | 1/2 | 1/2 | 0/2 | 477,265 |
| skill 50 | 1c | 3c | 2.00 | 0/2 | 2/2 | 2/2 | 1,132,875 |
| skill 75 | 0c | 3c | 1.50 | 0/2 | 2/2 | 2/2 | 1,413,140 |
| skill 100 | 0c | 0c | 0.00 | 0/2 | 2/2 | 2/2 | 2,348,375 |

### attack: is the skill slider monotonic? (mean lives lost per stage, skill 0 → 25 → 50 → 75 → 100)

| Stage | skill 0 | skill 25 | skill 50 | skill 75 | skill 100 | Monotonic |
|---|---:|---:|---:|---:|---:|---|
| 1 | 4.00 | 4.00 | 1.00 | 0.00 | 0.00 | yes |
| 6 | 4.00 | 4.00 | 3.00 | 3.00 | 0.00 | yes |

Monotonic on every stage shown (more lives lost at a higher skill = not monotonic; equal is fine).

## The human layer at work (means per run)

| Player | Looks / frame | Lapses | Lapse frames | Mean delay (frames) | Bullets unattended / look | Panic frames | Inputs changed by the hands | of them blocked (hold / rate) | Overshoots | Slow mashes | CPU s |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Ace | — | — | — | — | — | — | — | — | — | — | 34.7 |
| Expert | — | — | — | — | — | — | — | — | — | — | 14.3 |
| Steady veteran | 0.49 | 1.0 | 16 | 10.0 | 2.4 | 476 | 1652 | 1607 | 31 | 0.0 | 12.7 |
| Score chaser | 0.48 | 0.5 | 9 | 12.0 | 1.7 | 86 | 1094 | 1030 | 32 | 0.0 | 3.0 |
| Cautious beginner | 0.24 | 3.0 | 64 | 20.9 | 21.6 | 1862 | 4247 | 4164 | 27 | 2.0 | 1.4 |
| Panicky | 0.49 | 1.5 | 18 | 12.6 | 0.4 | 1390 | 2744 | 2649 | 39 | 5.0 | 4.3 |
| Tunnel vision | 0.49 | 1.0 | 18 | 12.0 | 27.6 | 280 | 1959 | 1909 | 26 | 0.0 | 1.9 |
| Distracted | 0.31 | 15.5 | 463 | 13.0 | 3.6 | 361 | 1670 | 1588 | 40 | 0.5 | 3.4 |
| skill 0 | 0.24 | 3.0 | 64 | 20.9 | 21.6 | 1862 | 4247 | 4164 | 27 | 2.0 | 1.6 |
| skill 25 | 0.32 | 4.0 | 65 | 15.1 | 9.1 | 760 | 2038 | 1863 | 59 | 0.5 | 1.8 |
| skill 50 | 0.33 | 2.5 | 28 | 10.2 | 4.4 | 1409 | 1194 | 966 | 88 | 5.0 | 4.0 |
| skill 75 | 0.49 | 2.0 | 9 | 5.0 | 0.1 | 705 | 679 | 561 | 58 | 2.5 | 5.4 |
| skill 100 | — | — | — | — | — | — | — | — | — | — | 14.8 |

## The settings

| Knob | Ace | Expert | Steady veteran | Score chaser | Cautious beginner | Panicky | Tunnel vision | Distracted | skill 0 | skill 25 | skill 50 | skill 75 | skill 100 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| reaction (frames) | — | 0 | 10 | 12 | 20 | 12 | 12 | 13 | 20 | 15 | 10 | 5 | 0 |
| attentionRadius (px) | — | 600 | 360 | 300 | 120 | 300 | 64 | 300 | 120 | 179 | 268 | 401 | 600 |
| attentionCount (bullets) | — | 1024 | 160 | 120 | 24 | 120 | 40 | 120 | 24 | 61 | 157 | 401 | 1024 |
| misjudge (px) | — | 0 | 1 | 2 | 4 | 1 | 1 | 1.5 | 4 | 3 | 2 | 1 | 0 |
| horizon (frames) | 48 | 48 | 48 | 32 | 16 | 32 | 32 | 32 | 16 | 24 | 32 | 40 | 48 |
| replanEvery (frames) | — | 1 | 2 | 2 | 4 | 2 | 2 | 3 | 4 | 3 | 3 | 2 | 1 |
| marginBullet (px) | — | 2 | 4 | 1 | 8 | 3 | 3 | 3 | 8 | 6.5 | 5 | 3.5 | 2 |
| marginSpawner (px) | — | 8 | 10 | 6 | 16 | 10 | 10 | 10 | 16 | 14 | 12 | 10 | 8 |
| marginTop (px) | — | 136 | 150 | 100 | 220 | 160 | 160 | 160 | 220 | 199 | 178 | 157 | 136 |
| attackY (px) | — | 160 | 180 | 120 | 330 | 220 | 200 | 200 | 330 | 288 | 245 | 203 | 160 |
| starWeight (per point) | — | 0 | 0 | 0.02 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| slowUse (0–1) | — | 1 | 1 | 0.8 | 0.3 | 0.9 | 0.9 | 0.8 | 0.3 | 0.45 | 0.65 | 0.8 | 1 |
| minHold (frames) | — | 1 | 3 | 3 | 7 | 3 | 3 | 3 | 7 | 6 | 4 | 3 | 1 |
| maxRate (changes/s) | — | 62.5 | 10 | 9 | 4 | 8 | 8 | 8 | 4 | 8 | 16 | 31.5 | 62.5 |
| overshootP (0–1) | — | 0 | 0.05 | 0.12 | 0.3 | 0.1 | 0.1 | 0.1 | 0.3 | 0.22 | 0.15 | 0.08 | 0 |
| overshootFrames (frames) | — | 0 | 2 | 3 | 6 | 3 | 3 | 3 | 6 | 5 | 3 | 2 | 0 |
| lapseRate (per min) | — | 0 | 0.5 | 1 | 3 | 1 | 1 | 8 | 3 | 2.3 | 1.5 | 0.8 | 0 |
| lapseFrames (frames) | — | 0 | 12 | 14 | 24 | 14 | 14 | 30 | 24 | 18 | 12 | 6 | 0 |
| panicFrom (bullets) | — | 150 | 150 | 120 | 40 | 50 | 120 | 120 | 40 | 68 | 95 | 123 | 150 |
| panicTo (bullets) | — | 400 | 400 | 350 | 150 | 180 | 350 | 350 | 150 | 213 | 275 | 338 | 400 |
| panicReaction (frames) | — | 0 | 3 | 4 | 8 | 14 | 4 | 4 | 8 | 6 | 4 | 2 | 0 |
| panicMisjudge (px) | — | 0 | 0.5 | 1 | 3 | 4 | 1 | 1 | 3 | 2.25 | 1.5 | 0.75 | 0 |
| panicSlow (0–1) | — | 0 | 0 | 0.1 | 0.3 | 0.6 | 0.1 | 0.1 | 0.3 | 0.2 | 0.15 | 0.1 | 0 |

## Shards

- shard 1/2: 13 runs at `52f78a7`, 0.7 min wall, 2 jobs on 4 cores
- shard 2/2: 13 runs at `52f78a7`, 1.1 min wall, 2 jobs on 4 cores
