# H1 — the Expert (observed perception) against the Ace (omniscient)

Written by `bin/h1-sweep.mjs --merge` at commit `8e8e9c0`, 2026-10-04, from 493 runs (3.2 CPU-hours, diagnosis included) in 16 shards.
Budget 1× = 600 units per frame; main horizon 48. The Ace ran in this sweep.
The Expert's settings: `{"margin":{"bullet":2,"spawner":8,"top":136},"attackY":160}` (its defaults, EXPERT_DEFAULTS in src/game/bot.js): margin = the clearance in px it keeps from a bullet's drawn trail and from a spawner (an enemy, an active bullet, a dot not yet moving); attackY = the height it attacks from, px from the top.
Seeds: C rand() seed s, endlessSeed 7919 × s. "boss 3 min" = alive 11250 frames into the boss scene (no-attack's goal). Endless modes stop at 30,000 frames.

## Expert vs Ace, horizon 48

### attack

| Stage | Ace: result (seeds 1/2/3) | Ace: lives lost | Ace: score (mean) | Expert: result | Expert: lives lost | Expert: score (mean) | Expert: surprises / repairs / failed (mean) |
|---|---|---|---:|---|---|---:|---|
| 1 | cleared @9,540 / cleared @9,562 / cleared @9,541 | 0 / 0 / 0 | 2,494,263 | cleared @9,577 / cleared @9,573 / cleared @9,601 | 0 / 0 / 0 | 1,622,963 | 46 / 277 / 0 |
| 2 | cleared @9,695 / cleared @9,812 / cleared @9,662 | 0 / 0 / 0 | 4,334,687 | cleared @9,574 / cleared @9,533 / cleared @9,573 | 0 / 0 / 0 | 3,368,287 | 42 / 182 / 0 |
| 3 | cleared @9,806 / cleared @9,765 / cleared @9,982 | 0 / 0 / 0 | 3,002,980 | cleared @9,733 / cleared @9,725 / cleared @9,689 | 0 / 0 / 0 | 2,428,700 | 38 / 211 / 0 |
| 4 | cleared @9,732 / cleared @9,603 / cleared @9,590 | 0 / 0 / 0 | 2,517,520 | cleared @9,618 / cleared @9,935 / cleared @9,785 | 0 / 0 / 0 | 2,336,573 | 44 / 494 / 0 |
| 5 | cleared @9,922 / cleared @9,901 / cleared @9,914 | 0 / 0 / 0 | 4,347,913 | cleared @9,757 / cleared @9,681 / cleared @9,729 | 0 / 0 / 0 | 3,011,113 | 52 / 419 / 0 |
| 6 | cleared @9,909 / cleared @10,775 / cleared @10,582 | 0 / 0 / 0 | 3,827,440 | cleared @9,779 / cleared @9,748 / cleared @9,760 | 0 / 0 / 0 | 3,051,950 | 51 / 456 / 0 |
| 7 | cleared @9,974 / cleared @9,897 / cleared @10,005 | 0 / 0 / 0 | 3,409,663 | cleared @9,775 / cleared @9,716 / cleared @9,900 | 0 / 0 / 0 | 3,104,870 | 78 / 630 / 0 |
| 8 | cleared @9,829 / cleared @9,741 / cleared @9,832 | 0 / 0 / 0 | 3,494,637 | cleared @9,736 / cleared @9,839 / cleared @9,703 | 0 / 0 / 0 | 3,398,353 | 68 / 810 / 0 |
| 9 | cleared @9,688 / cleared @9,654 / cleared @9,708 | 0 / 0 / 0 | 4,099,793 | cleared @9,603 / cleared @9,682 / cleared @9,657 | 0 / 0 / 0 | 3,999,093 | 76 / 808 / 0 |
| 10 | cleared @9,675 / cleared @9,777 / cleared @9,770 | 0 / 0 / 0 | 4,876,817 | cleared @9,787 / cleared @9,987 / cleared @9,710 | 0 / 0 / 0 | 4,569,950 | 84 / 1132 / 0 |
| ENDLESS | scene 30 / scene 30 / scene 30 | 0 / 0 / 0 | 8,631,037 | scene 30 / scene 30 / scene 30 | 0 / 0 / 0 | 7,988,477 | 209 / 2314 / 0 |

### no-attack

| Stage | Ace: result (seeds 1/2/3) | Ace: lives lost | Ace: score (mean) | Expert: result | Expert: lives lost | Expert: score (mean) | Expert: surprises / repairs / failed (mean) |
|---|---|---|---:|---|---|---:|---|
| 1 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 43 / 683 / 0 |
| 2 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 91 / 731 / 0 |
| 3 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 52 / 1155 / 0 |
| 4 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 110 / 4208 / 0 |
| 5 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 78 / 1528 / 0 |
| 6 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 91 / 1986 / 0 |
| 7 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 346 / 3797 / 0 |
| 8 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 107 / 2617 / 0 |
| 9 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 200 / 4804 / 0 |
| 10 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 280 / 4139 / 0 |
| ENDLESS | scene 9 / scene 9 / scene 9 | 0 / 0 / 0 | 0 | scene 9 / scene 9 / scene 9 | 0 / 0 / 0 | 0 | 57 / 1639 / 0 |

### Totals, stages 1–10

| Variant | Bot | Runs | Goal reached (cleared / boss 3 min) | No life lost | Lives lost (total) | Game overs | Mean score |
|---|---|---:|---:|---:|---:|---:|---:|
| attack | Ace | 30 | 30 | 30 | 0 | 0 | 3,640,571 |
| attack | Expert | 30 | 30 | 30 | 0 | 0 | 3,089,185 |
| no-attack | Ace | 30 | 30 | 30 | 0 | 0 | — |
| no-attack | Expert | 30 | 30 | 30 | 0 | 0 | — |

## The look-ahead needed (stages 1–10)

Per stage and seed (1/2/3): the smallest horizon run with which the bot reaches the goal (cleared / boss 3 min) with no
life lost, and the smallest with which it reaches the goal at all; "—" = none run did. A seed climbs the ladder until two
horizons in a row succeed, so "·" = not run. H = 0 is the tail controller alone (no simulation, no dodging). The grid:
lives lost at each horizon (g = game over).

### Expert (observed)

| Stage | Variant | Smallest H, no life lost | Smallest H, goal | H=0 | H=4 | H=8 | H=16 | H=48 |
|---|---|---|---|---|---|---|---|---|
| 1 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 4g/4g/3g | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 |
| 1 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 |
| 2 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/5g/3g | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 |
| 2 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 |
| 3 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 |
| 3 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 |
| 4 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 |
| 4 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 |
| 5 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 4g/4g/4g | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 |
| 5 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 |
| 6 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 |
| 6 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 |
| 7 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 4g/3g/4g | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 |
| 7 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 |
| 8 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 5g/4g/3g | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 |
| 8 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 |
| 9 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/4g/4g | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 |
| 9 | no-attack | 8 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 1/0/0 | 0/0/0 | 0/·/· | 0/0/0 |
| 10 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 |
| 10 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 |

### Ace (omniscient)

| Stage | Variant | Smallest H, no life lost | Smallest H, goal | H=0 | H=4 | H=8 | H=48 |
|---|---|---|---|---|---|---|---|
| 1 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/4g | 0/0/0 | 0/0/0 | 0/0/0 |
| 1 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | 0/0/0 |
| 2 | attack | 4 / 4 / 4 | 0 / 4 / 4 | 7/7g/7g | 0/0/0 | 0/0/0 | 0/0/0 |
| 2 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | 0/0/0 |
| 3 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 5g/5g/5g | 0/0/0 | 0/0/0 | 0/0/0 |
| 3 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | 0/0/0 |
| 4 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 4g/3g/4g | 0/0/0 | 0/0/0 | 0/0/0 |
| 4 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | 0/0/0 |
| 5 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 4g/4g/4g | 0/0/0 | 0/0/0 | 0/0/0 |
| 5 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | 0/0/0 |
| 6 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/4g | 0/0/0 | 0/0/0 | 0/0/0 |
| 6 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | 0/0/0 |
| 7 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 4g/4g/4g | 0/0/0 | 0/0/0 | 0/0/0 |
| 7 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | 0/0/0 |
| 8 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 4g/4g/4g | 0/0/0 | 0/0/0 | 0/0/0 |
| 8 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | 0/0/0 |
| 9 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/5g/3g | 0/0/0 | 0/0/0 | 0/0/0 |
| 9 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | 0/0/0 |
| 10 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/4g/3g | 0/0/0 | 0/0/0 | 0/0/0 |
| 10 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | 0/0/0 |

## Where the Expert dies (horizon 48)

Per lost life: the frame, the bullet that hit (speed, frames on screen, its motion since first seen, who fired it), and
"predicted k frames ahead" = for how many frames before the hit the bot's own model (the picture of that frame,
predicted forward along the ship's real path) showed that hit. The scene's patterns follow each hit.

- none

## The causes, every diagnosed Expert hit (the first 12 per run)

| Horizon | Hits diagnosed | fired in the hit's own frame (never seen) | a dot not yet moving | motion changed after the last look | predicted 1–2 frames ahead | predicted ≥ 3 frames ahead | of them aimed |
|---|---:|---:|---:|---:|---:|---:|---:|
| 0 | 194 | 0 | 0 | 0 | 0 | 194 | 125 |
| 4 | 1 | 0 | 1 | 0 | 0 | 0 | 0 |

## Shards

- shard 1/16: 33 runs at `8e8e9c0`, 3.6 min wall, 4 jobs on 4 cores
- shard 2/16: 33 runs at `8e8e9c0`, 4.1 min wall, 4 jobs on 4 cores
- shard 3/16: 33 runs at `8e8e9c0`, 4.4 min wall, 4 jobs on 4 cores
- shard 4/16: 33 runs at `8e8e9c0`, 4.4 min wall, 4 jobs on 4 cores
- shard 5/16: 32 runs at `8e8e9c0`, 2.5 min wall, 4 jobs on 4 cores
- shard 6/16: 32 runs at `8e8e9c0`, 3.3 min wall, 4 jobs on 4 cores
- shard 7/16: 32 runs at `8e8e9c0`, 2.3 min wall, 4 jobs on 4 cores
- shard 8/16: 32 runs at `8e8e9c0`, 2.8 min wall, 4 jobs on 4 cores
- shard 9/16: 33 runs at `8e8e9c0`, 3.8 min wall, 4 jobs on 4 cores
- shard 10/16: 32 runs at `8e8e9c0`, 3.9 min wall, 4 jobs on 4 cores
- shard 11/16: 32 runs at `8e8e9c0`, 3.9 min wall, 4 jobs on 4 cores
- shard 12/16: 32 runs at `8e8e9c0`, 3.2 min wall, 4 jobs on 4 cores
- shard 13/16: 29 runs at `8e8e9c0`, 3.9 min wall, 4 jobs on 4 cores
- shard 14/16: 26 runs at `8e8e9c0`, 3.9 min wall, 4 jobs on 4 cores
- shard 15/16: 23 runs at `8e8e9c0`, 2.7 min wall, 4 jobs on 4 cores
- shard 16/16: 26 runs at `8e8e9c0`, 3.2 min wall, 4 jobs on 4 cores
