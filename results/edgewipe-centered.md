# H1 — the Expert (observed perception) against the Ace (omniscient)

Written by `bin/h1-sweep.mjs --merge` at commit `a006d53`, 2026-10-06, from 66 runs (0.9 CPU-hours, diagnosis included) in 16 shards.
Budget 1× = 600 units per frame; main horizon 48. Hitbox: centered (slice HB). The Ace ran in this sweep.
The Expert's settings: `{"margin":{"bullet":2,"spawner":8,"top":136},"attackY":160}` (its defaults, EXPERT_DEFAULTS in src/game/bot.js): margin = the clearance in px it keeps from a bullet's drawn trail and from a spawner (an enemy, an active bullet, a dot not yet moving); attackY = the height it attacks from, px from the top.
Seeds: C rand() seed s, endlessSeed 7919 × s. "boss 3 min" = alive 11250 frames into the boss scene (no-attack's goal). Endless modes stop at 30,000 frames.

## Expert vs Ace, horizon 48

### attack

| Stage | Ace: result (seeds 1/2/3) | Ace: lives lost | Ace: score (mean) | Expert: result | Expert: lives lost | Expert: score (mean) | Expert: surprises / repairs / failed (mean) |
|---|---|---|---:|---|---|---:|---|
| 1 | · / · / · | · / · / · | 0 | cleared @9,569 / cleared @9,569 / cleared @9,649 | 0 / 0 / 0 | 1,737,433 | 86 / 245 / 0 |
| 2 | · / · / · | · / · / · | 0 | cleared @9,593 / cleared @9,629 / cleared @9,594 | 0 / 0 / 0 | 3,350,083 | 87 / 159 / 0 |
| 3 | · / · / · | · / · / · | 0 | cleared @9,726 / cleared @9,773 / cleared @9,705 | 0 / 0 / 0 | 2,544,533 | 93 / 209 / 0 |
| 4 | · / · / · | · / · / · | 0 | cleared @9,819 / cleared @9,671 / cleared @9,658 | 0 / 0 / 0 | 2,278,860 | 115 / 434 / 0 |
| 5 | · / · / · | · / · / · | 0 | cleared @9,793 / cleared @9,749 / cleared @9,785 | 0 / 0 / 0 | 2,998,683 | 140 / 431 / 0 |
| 6 | · / · / · | · / · / · | 0 | cleared @9,717 / cleared @9,782 / cleared @9,717 | 0 / 0 / 0 | 2,757,200 | 155 / 406 / 0 |
| 7 | · / · / · | · / · / · | 0 | cleared @9,796 / cleared @9,754 / cleared @9,833 | 0 / 0 / 0 | 2,977,803 | 216 / 624 / 0 |
| 8 | · / · / · | · / · / · | 0 | cleared @9,657 / cleared @9,670 / cleared @9,599 | 0 / 0 / 0 | 3,113,490 | 227 / 771 / 0 |
| 9 | · / · / · | · / · / · | 0 | cleared @9,717 / cleared @9,657 / cleared @9,607 | 0 / 0 / 0 | 3,435,347 | 207 / 763 / 0 |
| 10 | · / · / · | · / · / · | 0 | cleared @9,698 / cleared @9,691 / cleared @9,879 | 0 / 0 / 0 | 4,442,333 | 286 / 1005 / 0 |
| ENDLESS | · / · / · | · / · / · | 0 | scene 30 / scene 30 / scene 29 | 0 / 0 / 0 | 7,427,133 | 612 / 2104 / 1 |

### no-attack

| Stage | Ace: result (seeds 1/2/3) | Ace: lives lost | Ace: score (mean) | Expert: result | Expert: lives lost | Expert: score (mean) | Expert: surprises / repairs / failed (mean) |
|---|---|---|---:|---|---|---:|---|
| 1 | · / · / · | · / · / · | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 287 / 620 / 0 |
| 2 | · / · / · | · / · / · | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 666 / 708 / 0 |
| 3 | · / · / · | · / · / · | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 519 / 944 / 0 |
| 4 | · / · / · | · / · / · | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 614 / 3339 / 0 |
| 5 | · / · / · | · / · / · | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 606 / 1165 / 0 |
| 6 | · / · / · | · / · / · | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 851 / 1446 / 0 |
| 7 | · / · / · | · / · / · | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 1319 / 2916 / 0 |
| 8 | · / · / · | · / · / · | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 791 / 2144 / 0 |
| 9 | · / · / · | · / · / · | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 1085 / 3925 / 0 |
| 10 | · / · / · | · / · / · | 0 | boss 3 min / boss 3 min / boss 3 min | 0 / 0 / 0 | 0 | 1572 / 2614 / 0 |
| ENDLESS | · / · / · | · / · / · | 0 | scene 9 / scene 9 / scene 9 | 0 / 0 / 0 | 0 | 550 / 1460 / 0 |

### Totals, stages 1–10

| Variant | Bot | Runs | Goal reached (cleared / boss 3 min) | No life lost | Lives lost (total) | Game overs | Mean score |
|---|---|---:|---:|---:|---:|---:|---:|
| attack | Expert | 30 | 30 | 30 | 0 | 0 | 2,963,577 |
| no-attack | Expert | 30 | 30 | 30 | 0 | 0 | — |

## The look-ahead needed (stages 1–10)

Per stage and seed (1/2/3): the smallest horizon run with which the bot reaches the goal (cleared / boss 3 min) with no
life lost, and the smallest with which it reaches the goal at all; "—" = none run did. A seed climbs the ladder until two
horizons in a row succeed, so "·" = not run. H = 0 is the tail controller alone (no simulation, no dodging). The grid:
lives lost at each horizon (g = game over).

### Expert (observed)

| Stage | Variant | Smallest H, no life lost | Smallest H, goal | H=48 |
|---|---|---|---|---|
| 1 | attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 1 | no-attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 2 | attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 2 | no-attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 3 | attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 3 | no-attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 4 | attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 4 | no-attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 5 | attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 5 | no-attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 6 | attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 6 | no-attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 7 | attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 7 | no-attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 8 | attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 8 | no-attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 9 | attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 9 | no-attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 10 | attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 10 | no-attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |

### Ace (omniscient)

| Stage | Variant | Smallest H, no life lost | Smallest H, goal |  |
|---|---|---|---||

## Where the Expert dies (horizon 48)

Per lost life: the frame, the bullet that hit (speed, frames on screen, its motion since first seen, who fired it), and
"predicted k frames ahead" = for how many frames before the hit the bot's own model (the picture of that frame,
predicted forward along the ship's real path) showed that hit. The scene's patterns follow each hit.

- none

## The causes, every diagnosed Expert hit (the first 12 per run)

| Horizon | Hits diagnosed | fired in the hit's own frame (never seen) | a dot not yet moving | motion changed after the last look | predicted 1–2 frames ahead | predicted ≥ 3 frames ahead | of them aimed |
|---|---:|---:|---:|---:|---:|---:|---:|

## Shards

- shard 1/16: 5 runs at `a006d53`, 2.1 min wall, 4 jobs on 4 cores
- shard 2/16: 5 runs at `a006d53`, 2.3 min wall, 4 jobs on 4 cores
- shard 3/16: 4 runs at `a006d53`, 2.1 min wall, 4 jobs on 4 cores
- shard 4/16: 4 runs at `a006d53`, 2.1 min wall, 4 jobs on 4 cores
- shard 5/16: 4 runs at `a006d53`, 0.7 min wall, 4 jobs on 4 cores
- shard 6/16: 4 runs at `a006d53`, 1 min wall, 4 jobs on 4 cores
- shard 7/16: 4 runs at `a006d53`, 1.2 min wall, 4 jobs on 4 cores
- shard 8/16: 4 runs at `a006d53`, 0.7 min wall, 4 jobs on 4 cores
- shard 9/16: 4 runs at `a006d53`, 1.4 min wall, 4 jobs on 4 cores
- shard 10/16: 4 runs at `a006d53`, 1.2 min wall, 4 jobs on 4 cores
- shard 11/16: 4 runs at `a006d53`, 1.5 min wall, 4 jobs on 4 cores
- shard 12/16: 4 runs at `a006d53`, 1.6 min wall, 4 jobs on 4 cores
- shard 13/16: 4 runs at `a006d53`, 1.2 min wall, 4 jobs on 4 cores
- shard 14/16: 4 runs at `a006d53`, 1.2 min wall, 4 jobs on 4 cores
- shard 15/16: 4 runs at `a006d53`, 0.8 min wall, 4 jobs on 4 cores
- shard 16/16: 4 runs at `a006d53`, 1.5 min wall, 4 jobs on 4 cores
