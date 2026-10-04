# H1 — the Expert (observed perception) against the Ace (omniscient)

Written by `bin/h1-sweep.mjs --merge` at commit `46e0afb`, 2026-10-04, from 493 runs (3.3 CPU-hours, diagnosis included) in 16 shards.
Budget 1× = 600 units per frame; main horizon 48. The Ace ran in this sweep.
The Expert's settings: `{"margin":{"bullet":2,"spawner":8,"top":136},"attackY":160}` (its defaults, EXPERT_DEFAULTS in src/game/bot.js): margin = the clearance in px it keeps from a bullet's drawn trail and from a spawner (an enemy, an active bullet, a dot not yet moving); attackY = the height it attacks from, px from the top.
Seeds: C rand() seed s, endlessSeed 7919 × s. "boss 3 min" = alive 11250 frames into the boss scene (no-attack's goal). Endless modes stop at 30,000 frames.

## Expert vs Ace, horizon 48

### attack

| Stage | Ace: result (seeds 1/2/3) | Ace: lives lost | Ace: score (mean) | Expert: result | Expert: lives lost | Expert: score (mean) | Expert: surprises / repairs / failed (mean) |
|---|---|---|---:|---|---|---:|---|
| 1 | cleared @9,540 / cleared @9,562 / cleared @9,541 | 0 / 0 / 0 | 2,494,263 | cleared @9,595 / cleared @9,569 / cleared @9,581 | 0 / 0 / 0 | 1,585,543 | 41 / 266 / 0 |
| 2 | cleared @9,695 / cleared @9,812 / cleared @9,662 | 0 / 0 / 0 | 4,334,687 | cleared @9,661 / cleared @9,551 / cleared @9,609 | 0 / 0 / 0 | 3,465,547 | 38 / 184 / 0 |
| 3 | cleared @9,806 / cleared @9,765 / cleared @9,982 | 0 / 0 / 0 | 3,002,980 | cleared @9,769 / cleared @9,681 / cleared @9,739 | 0 / 0 / 0 | 2,535,870 | 36 / 205 / 0 |
| 4 | cleared @9,732 / cleared @9,603 / cleared @9,590 | 0 / 0 / 0 | 2,517,520 | cleared @9,714 / cleared @9,781 / cleared @9,845 | 0 / 0 / 0 | 2,132,340 | 53 / 553 / 0 |
| 5 | cleared @9,922 / cleared @9,901 / cleared @9,914 | 0 / 0 / 0 | 4,347,913 | cleared @9,711 / cleared @9,693 / cleared @9,749 | 0 / 0 / 0 | 3,177,793 | 52 / 449 / 0 |
| 6 | cleared @9,909 / cleared @10,775 / cleared @10,582 | 0 / 0 / 0 | 3,827,440 | cleared @9,717 / cleared @9,707 / cleared @9,718 | 0 / 0 / 0 | 2,877,397 | 61 / 528 / 0 |
| 7 | cleared @9,974 / cleared @9,897 / cleared @10,005 | 0 / 0 / 0 | 3,409,663 | cleared @9,899 / cleared @9,754 / cleared @9,685 | 0 / 0 / 0 | 3,346,267 | 73 / 657 / 0 |
| 8 | cleared @9,829 / cleared @9,741 / cleared @9,832 | 0 / 0 / 0 | 3,494,637 | cleared @9,657 / cleared @9,651 / cleared @9,846 | 0 / 0 / 0 | 3,290,897 | 74 / 786 / 0 |
| 9 | cleared @9,688 / cleared @9,654 / cleared @9,708 | 0 / 0 / 0 | 4,099,793 | cleared @9,599 / cleared @9,788 / cleared @9,789 | 0 / 0 / 0 | 3,677,843 | 79 / 913 / 0 |
| 10 | cleared @9,675 / cleared @9,777 / cleared @9,770 | 0 / 0 / 0 | 4,876,817 | cleared @9,917 / cleared @10,025 / cleared @10,552 | 0 / 0 / 0 | 4,423,140 | 89 / 1147 / 0 |
| ENDLESS | scene 30 / scene 30 / scene 30 | 0 / 0 / 0 | 8,631,037 | scene 30 / scene 30 / scene 30 | 0 / 0 / 0 | 7,157,860 | 195 / 2218 / 0 |

### no-attack

| Stage | Ace: result (seeds 1/2/3) | Ace: lives lost | Ace: score (mean) | Expert: result | Expert: lives lost | Expert: score (mean) | Expert: surprises / repairs / failed (mean) |
|---|---|---|---:|---|---|---:|---|
| 1 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 40 / 732 / 0 |
| 2 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 93 / 778 / 0 |
| 3 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 58 / 1164 / 0 |
| 4 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 99 / 3730 / 0 |
| 5 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 82 / 1519 / 0 |
| 6 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 88 / 1894 / 0 |
| 7 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 304 / 3775 / 0 |
| 8 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 105 / 2661 / 0 |
| 9 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 186 / 4826 / 0 |
| 10 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 237 / 4058 / 0 |
| ENDLESS | scene 9 / scene 9 / scene 9 | 0 / 0 / 0 | 0 | scene 9 / scene 9 / scene 9 | 0 / 0 / 0 | 0 | 66 / 1770 / 0 |

### Totals, stages 1–10

| Variant | Bot | Runs | Goal reached (cleared / boss 3 min) | No life lost | Lives lost (total) | Game overs | Mean score |
|---|---|---:|---:|---:|---:|---:|---:|
| attack | Ace | 30 | 30 | 30 | 0 | 0 | 3,640,571 |
| attack | Expert | 30 | 30 | 30 | 0 | 0 | 3,051,264 |
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
| 8 | attack | 4 / 4 / 8 | 4 / 4 / 4 | 5g/4g/3g | 0/0/1 | 0/0/0 | ·/·/0 | 0/0/0 |
| 8 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 |
| 9 | attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/4g/4g | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 |
| 9 | no-attack | 4 / 4 / 4 | 4 / 4 / 4 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | 0/0/0 |
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
| 4 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |

## Shards

- shard 1/16: 33 runs at `46e0afb`, 3.7 min wall, 4 jobs on 4 cores
- shard 2/16: 33 runs at `46e0afb`, 4.2 min wall, 4 jobs on 4 cores
- shard 3/16: 33 runs at `46e0afb`, 4.6 min wall, 4 jobs on 4 cores
- shard 4/16: 33 runs at `46e0afb`, 3.6 min wall, 4 jobs on 4 cores
- shard 5/16: 32 runs at `46e0afb`, 3.3 min wall, 4 jobs on 4 cores
- shard 6/16: 32 runs at `46e0afb`, 3.3 min wall, 4 jobs on 4 cores
- shard 7/16: 33 runs at `46e0afb`, 3.6 min wall, 4 jobs on 4 cores
- shard 8/16: 32 runs at `46e0afb`, 2.8 min wall, 4 jobs on 4 cores
- shard 9/16: 32 runs at `46e0afb`, 2.1 min wall, 4 jobs on 4 cores
- shard 10/16: 32 runs at `46e0afb`, 3.9 min wall, 4 jobs on 4 cores
- shard 11/16: 32 runs at `46e0afb`, 3.9 min wall, 4 jobs on 4 cores
- shard 12/16: 32 runs at `46e0afb`, 4.3 min wall, 4 jobs on 4 cores
- shard 13/16: 29 runs at `46e0afb`, 4 min wall, 4 jobs on 4 cores
- shard 14/16: 26 runs at `46e0afb`, 2.5 min wall, 4 jobs on 4 cores
- shard 15/16: 23 runs at `46e0afb`, 3.4 min wall, 4 jobs on 4 cores
- shard 16/16: 26 runs at `46e0afb`, 3.1 min wall, 4 jobs on 4 cores
