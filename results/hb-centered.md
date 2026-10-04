# H1 — the Expert (observed perception) against the Ace (omniscient)

Written by `bin/h1-sweep.mjs --merge` at commit `38d9177`, 2026-10-04, from 554 runs (4.1 CPU-hours, diagnosis included) in 16 shards.
Budget 1× = 600 units per frame; main horizon 48. Hitbox: centered (slice HB). The Ace ran in this sweep.
The Expert's settings: `{"margin":{"bullet":2,"spawner":8,"top":136},"attackY":160}` (its defaults, EXPERT_DEFAULTS in src/game/bot.js): margin = the clearance in px it keeps from a bullet's drawn trail and from a spawner (an enemy, an active bullet, a dot not yet moving); attackY = the height it attacks from, px from the top.
Seeds: C rand() seed s, endlessSeed 7919 × s. "boss 3 min" = alive 11250 frames into the boss scene (no-attack's goal). Endless modes stop at 30,000 frames.

## Expert vs Ace, horizon 48

### attack

| Stage | Ace: result (seeds 1/2/3) | Ace: lives lost | Ace: score (mean) | Expert: result | Expert: lives lost | Expert: score (mean) | Expert: surprises / repairs / failed (mean) |
|---|---|---|---:|---|---|---:|---|
| 1 | cleared @9,559 / cleared @9,576 / cleared @9,552 | 0 / 0 / 0 | 2,539,450 | cleared @9,561 / cleared @9,573 / cleared @9,561 | 0 / 0 / 0 | 1,616,910 | 91 / 218 / 0 |
| 2 | cleared @9,748 / cleared @9,694 / cleared @9,846 | 0 / 0 / 0 | 4,236,260 | cleared @9,585 / cleared @9,661 / cleared @9,573 | 0 / 0 / 0 | 3,152,613 | 92 / 156 / 0 |
| 3 | cleared @9,664 / cleared @9,795 / cleared @9,736 | 0 / 0 / 0 | 2,987,863 | cleared @9,717 / cleared @9,733 / cleared @9,717 | 0 / 0 / 0 | 2,698,180 | 91 / 207 / 0 |
| 4 | cleared @9,743 / cleared @9,746 / cleared @9,785 | 0 / 0 / 0 | 2,363,003 | cleared @9,661 / cleared @9,673 / cleared @9,843 | 0 / 0 / 0 | 2,273,983 | 141 / 446 / 0 |
| 5 | cleared @9,679 / cleared @9,799 / cleared @10,058 | 0 / 0 / 0 | 3,995,880 | cleared @9,793 / cleared @9,773 / cleared @9,741 | 0 / 0 / 0 | 3,031,537 | 138 / 386 / 0 |
| 6 | cleared @10,711 / cleared @10,093 / cleared @10,570 | 0 / 0 / 0 | 3,745,553 | cleared @9,713 / cleared @9,777 / cleared @9,785 | 0 / 0 / 0 | 2,952,387 | 149 / 389 / 0 |
| 7 | cleared @9,902 / cleared @9,925 / cleared @9,831 | 0 / 0 / 0 | 3,474,777 | cleared @9,645 / cleared @9,641 / cleared @9,681 | 0 / 0 / 0 | 3,315,917 | 198 / 519 / 0 |
| 8 | cleared @9,825 / cleared @9,674 / cleared @9,786 | 0 / 0 / 0 | 3,526,770 | cleared @9,665 / cleared @9,689 / cleared @9,688 | 0 / 0 / 0 | 3,502,367 | 225 / 752 / 0 |
| 9 | cleared @9,675 / cleared @9,720 / cleared @9,716 | 0 / 0 / 0 | 3,518,033 | cleared @9,665 / cleared @9,653 / cleared @9,765 | 0 / 0 / 0 | 3,919,063 | 222 / 687 / 0 |
| 10 | cleared @9,682 / cleared @9,795 / cleared @9,706 | 0 / 0 / 0 | 4,540,570 | cleared @9,681 / cleared @9,773 / cleared @9,737 | 0 / 0 / 0 | 4,554,297 | 283 / 962 / 1 |
| ENDLESS | scene 29 / scene 30 / scene 30 | 0 / 0 / 0 | 8,515,053 | scene 30 / scene 30 / scene 30 | 1 / 0 / 0 | 7,138,263 | 532 / 1547 / 0 |

### no-attack

| Stage | Ace: result (seeds 1/2/3) | Ace: lives lost | Ace: score (mean) | Expert: result | Expert: lives lost | Expert: score (mean) | Expert: surprises / repairs / failed (mean) |
|---|---|---|---:|---|---|---:|---|
| 1 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 319 / 648 / 0 |
| 2 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 695 / 728 / 0 |
| 3 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 562 / 945 / 0 |
| 4 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 712 / 3628 / 0 |
| 5 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 605 / 1125 / 0 |
| 6 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 860 / 1461 / 0 |
| 7 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 1533 / 2873 / 0 |
| 8 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 853 / 2219 / 1 |
| 9 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 1310 / 3717 / 0 |
| 10 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 1451 / 2388 / 0 |
| ENDLESS | scene 9 / scene 9 / scene 9 | 0 / 0 / 0 | 0 | scene 9 / scene 9 / scene 9 | 0 / 0 / 0 | 0 | 565 / 1484 / 0 |

### Totals, stages 1–10

| Variant | Bot | Runs | Goal reached (cleared / boss 3 min) | No life lost | Lives lost (total) | Game overs | Mean score |
|---|---|---:|---:|---:|---:|---:|---:|
| attack | Ace | 30 | 30 | 30 | 0 | 0 | 3,492,816 |
| attack | Expert | 30 | 30 | 30 | 0 | 0 | 3,101,725 |
| no-attack | Ace | 30 | 30 | 30 | 0 | 0 | — |
| no-attack | Expert | 30 | 30 | 30 | 0 | 0 | — |

## The look-ahead needed (stages 1–10)

Per stage and seed (1/2/3): the smallest horizon run with which the bot reaches the goal (cleared / boss 3 min) with no
life lost, and the smallest with which it reaches the goal at all; "—" = none run did. A seed climbs the ladder until two
horizons in a row succeed, so "·" = not run. H = 0 is the tail controller alone (no simulation, no dodging). The grid:
lives lost at each horizon (g = game over).

### Expert (observed)

| Stage | Variant | Smallest H, no life lost | Smallest H, goal | H=0 | H=4 | H=8 | H=16 | H=32 | H=48 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 4g/4g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· | 0/0/0 |
| 1 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· | 0/0/0 |
| 2 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· | 0/0/0 |
| 2 | no-attack | 8 / 8 / 8 | 4 / 4 / 4 | 3g/3g/3g | 1/1/1 | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 |
| 3 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· | 0/0/0 |
| 3 | no-attack | 4 / 8 / 8 | 4 / 4 / 4 | 3g/3g/3g | 0/1/1 | 0/0/0 | ·/0/0 | ·/·/· | 0/0/0 |
| 4 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· | 0/0/0 |
| 4 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· | 0/0/0 |
| 5 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 4g/4g/4g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· | 0/0/0 |
| 5 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/1/0 | ·/0/· | ·/0/· | 0/0/0 |
| 6 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· | 0/0/0 |
| 6 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/1/0 | ·/0/· | ·/0/· | 0/0/0 |
| 7 | attack | 4 / 4 / 8 | 4 / 4 / 4 | 3g/3g/3g | 0/0/1 | 0/1/0 | ·/0/0 | ·/0/· | 0/0/0 |
| 7 | no-attack | 16 / 16 / 16 | 8 / 4 / 4 | 3g/3g/3g | 3g/2/1 | 1/1/1 | 0/0/0 | 0/0/0 | 0/0/0 |
| 8 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· | 0/0/0 |
| 8 | no-attack | 4 / 8 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/1/0 | 1/0/0 | 0/0/· | 0/·/· | 0/0/0 |
| 9 | attack | 8 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 1/0/0 | 0/0/0 | 0/·/· | ·/·/· | 0/0/0 |
| 9 | no-attack | 8 / 16 / 16 | 8 / 4 / 8 | 3g/3g/3g | 3g/1/3g | 0/1/1 | 0/0/0 | ·/0/0 | 0/0/0 |
| 10 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 1/0/0 | 0/·/· | 0/·/· | 0/0/0 |
| 10 | no-attack | 8 / 16 / 8 | 8 / 4 / 8 | 3g/3g/3g | 3g/2/3g | 0/2/0 | 0/0/0 | ·/0/· | 0/0/0 |

### Ace (omniscient)

| Stage | Variant | Smallest H, no life lost | Smallest H, goal | H=0 | H=4 | H=8 | H=16 | H=32 | H=48 | H=64 |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· | 0/0/0 | ·/·/· |
| 1 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· | 0/0/0 | ·/·/· |
| 2 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 7g/7g/7g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· | 0/0/0 | ·/·/· |
| 2 | no-attack | 8 / 8 / 8 | 4 / 4 / 4 | 3g/3g/3g | 1/1/1 | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 | ·/·/· |
| 3 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 4g/5g/4g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· | 0/0/0 | ·/·/· |
| 3 | no-attack | 8 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 2/0/0 | 0/0/0 | 0/·/· | ·/·/· | 0/0/0 | ·/·/· |
| 4 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/4g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· | 0/0/0 | ·/·/· |
| 4 | no-attack | 4 / 4 / 8 | 4 / 4 / 4 | 3g/3g/3g | 0/0/1 | 0/0/0 | ·/·/0 | ·/·/· | 0/0/0 | ·/·/· |
| 5 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/4g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· | 0/0/0 | ·/·/· |
| 5 | no-attack | 8 / 8 / 4 | 4 / 4 / 4 | 3g/3g/3g | 2/1/0 | 0/0/1 | 0/0/0 | ·/·/0 | 0/0/0 | ·/·/· |
| 6 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· | 0/0/0 | ·/·/· |
| 6 | no-attack | 4 / 4 / 8 | 4 / 4 / 4 | 3g/3g/3g | 0/0/2 | 0/0/0 | ·/·/0 | ·/·/· | 0/0/0 | ·/·/· |
| 7 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· | 0/0/0 | ·/·/· |
| 7 | no-attack | 8 / 8 / 16 | 4 / 4 / 4 | 3g/3g/3g | 1/1/1 | 0/0/1 | 0/0/0 | ·/·/0 | 0/0/0 | ·/·/· |
| 8 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 4g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· | 0/0/0 | ·/·/· |
| 8 | no-attack | 8 / 8 / 4 | 4 / 4 / 4 | 3g/3g/3g | 1/1/0 | 0/0/0 | 0/0/· | ·/·/· | 0/0/0 | ·/·/· |
| 9 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· | 0/0/0 | ·/·/· |
| 9 | no-attack | 8 / 16 / 8 | 4 / 4 / 8 | 3g/3g/3g | 1/2/3g | 0/1/0 | 1/0/0 | 0/0/· | 0/0/0 | ·/·/· |
| 10 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· | 0/0/0 | ·/·/· |
| 10 | no-attack | 48 / 48 / 32 | 8 / 8 / 8 | 3g/3g/3g | 3g/3g/3g | 1/2/2 | 1/1/1 | 1/1/0 | 0/0/0 | 0/0/· |

## Where the Expert dies (horizon 48)

Per lost life: the frame, the bullet that hit (speed, frames on screen, its motion since first seen, who fired it), and
"predicted k frames ahead" = for how many frames before the hit the bot's own model (the picture of that frame,
predicted forward along the ship's real path) showed that hit. The scene's patterns follow each hit.

- **ENDLESS attack seed 1** (1 lost, cap):
  - f28484: bullet 15.57 px/f from middle/22way.xml 13 px away: fired in the hit's own frame (never seen) — scene: zako/[ketsui]_r1_boss_bit, middle/22way, boss/[ketsui]_r3_boss_fastspread, zako/nway

## The causes, every diagnosed Expert hit (the first 12 per run)

| Horizon | Hits diagnosed | fired in the hit's own frame (never seen) | a dot not yet moving | motion changed after the last look | predicted 1–2 frames ahead | predicted ≥ 3 frames ahead | of them aimed |
|---|---:|---:|---:|---:|---:|---:|---:|
| 0 | 184 | 0 | 0 | 0 | 15 | 169 | 103 |
| 4 | 29 | 0 | 1 | 0 | 0 | 28 | 18 |
| 8 | 12 | 0 | 1 | 0 | 0 | 11 | 10 |
| 48 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |

## Shards

- shard 1/16: 36 runs at `38d9177`, 4.2 min wall, 4 jobs on 4 cores
- shard 2/16: 35 runs at `38d9177`, 4.3 min wall, 4 jobs on 4 cores
- shard 3/16: 40 runs at `38d9177`, 5.6 min wall, 4 jobs on 4 cores
- shard 4/16: 39 runs at `38d9177`, 5.4 min wall, 4 jobs on 4 cores
- shard 5/16: 37 runs at `38d9177`, 4.8 min wall, 4 jobs on 4 cores
- shard 6/16: 35 runs at `38d9177`, 4.8 min wall, 4 jobs on 4 cores
- shard 7/16: 35 runs at `38d9177`, 4.6 min wall, 4 jobs on 4 cores
- shard 8/16: 36 runs at `38d9177`, 3.5 min wall, 4 jobs on 4 cores
- shard 9/16: 35 runs at `38d9177`, 3 min wall, 4 jobs on 4 cores
- shard 10/16: 38 runs at `38d9177`, 4.7 min wall, 4 jobs on 4 cores
- shard 11/16: 40 runs at `38d9177`, 5.7 min wall, 4 jobs on 4 cores
- shard 12/16: 36 runs at `38d9177`, 5.2 min wall, 4 jobs on 4 cores
- shard 13/16: 33 runs at `38d9177`, 5.9 min wall, 4 jobs on 4 cores
- shard 14/16: 29 runs at `38d9177`, 4.3 min wall, 4 jobs on 4 cores
- shard 15/16: 23 runs at `38d9177`, 2.1 min wall, 4 jobs on 4 cores
- shard 16/16: 27 runs at `38d9177`, 3.3 min wall, 4 jobs on 4 cores
