# H1 — the Expert (observed perception) against the Ace (omniscient)

Written by `bin/h1-sweep.mjs --merge` at commit `a006d53`, 2026-10-06, from 66 runs (0.9 CPU-hours, diagnosis included) in 16 shards.
Budget 1× = 600 units per frame; main horizon 48. The Ace's rows are G4's (results/g4-bot.json, budget 1×, horizon 48, its own ladder 0, 1, 2, 4, …).
The Expert's settings: `{"margin":{"bullet":2,"spawner":8,"top":136},"attackY":160}` (its defaults, EXPERT_DEFAULTS in src/game/bot.js): margin = the clearance in px it keeps from a bullet's drawn trail and from a spawner (an enemy, an active bullet, a dot not yet moving); attackY = the height it attacks from, px from the top.
Seeds: C rand() seed s, endlessSeed 7919 × s. "boss 3 min" = alive 11250 frames into the boss scene (no-attack's goal). Endless modes stop at 30,000 frames.

## Expert vs Ace, horizon 48

### attack

| Stage | Ace: result (seeds 1/2/3) | Ace: lives lost | Ace: score (mean) | Expert: result | Expert: lives lost | Expert: score (mean) | Expert: surprises / repairs / failed (mean) |
|---|---|---|---:|---|---|---:|---|
| 1 | cleared @9,540 / cleared @9,562 / cleared @9,541 | 0 / 0 / 0 | 2,494,263 | cleared @9,593 / cleared @9,573 / cleared @9,635 | 0 / 0 / 0 | 1,768,297 | 44 / 260 / 0 |
| 2 | cleared @9,695 / cleared @9,812 / cleared @9,662 | 0 / 0 / 0 | 4,334,687 | cleared @9,581 / cleared @9,514 / cleared @9,577 | 0 / 0 / 0 | 3,361,803 | 43 / 194 / 0 |
| 3 | cleared @9,806 / cleared @9,765 / cleared @9,982 | 0 / 0 / 0 | 3,002,980 | cleared @9,761 / cleared @9,773 / cleared @9,726 | 0 / 0 / 0 | 2,526,043 | 37 / 234 / 0 |
| 4 | cleared @9,732 / cleared @9,603 / cleared @9,590 | 0 / 0 / 0 | 2,517,520 | cleared @9,633 / cleared @9,844 / cleared @9,924 | 0 / 0 / 0 | 2,229,523 | 42 / 519 / 0 |
| 5 | cleared @9,922 / cleared @9,901 / cleared @9,914 | 0 / 0 / 0 | 4,347,913 | cleared @9,797 / cleared @9,741 / cleared @9,685 | 0 / 0 / 0 | 2,993,737 | 61 / 441 / 0 |
| 6 | cleared @9,909 / cleared @10,775 / cleared @10,582 | 0 / 0 / 0 | 3,827,440 | cleared @9,745 / cleared @9,757 / cleared @9,713 | 0 / 0 / 0 | 2,848,483 | 52 / 490 / 0 |
| 7 | cleared @9,974 / cleared @9,897 / cleared @10,005 | 0 / 0 / 0 | 3,409,663 | cleared @9,632 / cleared @9,650 / cleared @9,601 | 0 / 0 / 0 | 3,115,967 | 77 / 628 / 0 |
| 8 | cleared @9,829 / cleared @9,741 / cleared @9,832 | 0 / 0 / 0 | 3,494,637 | cleared @9,673 / cleared @9,731 / cleared @9,710 | 0 / 0 / 0 | 3,351,703 | 73 / 813 / 0 |
| 9 | cleared @9,688 / cleared @9,654 / cleared @9,708 | 0 / 0 / 0 | 4,099,793 | cleared @9,813 / cleared @9,691 / cleared @9,608 | 0 / 0 / 0 | 3,849,563 | 83 / 929 / 0 |
| 10 | cleared @9,675 / cleared @9,777 / cleared @9,770 | 0 / 0 / 0 | 4,876,817 | cleared @9,613 / cleared @9,629 / cleared @9,598 | 0 / 0 / 0 | 4,379,843 | 81 / 1132 / 0 |
| ENDLESS | scene 30 / scene 30 / scene 30 | 0 / 0 / 0 | 8,631,037 | scene 30 / scene 30 / scene 30 | 0 / 0 / 0 | 7,232,620 | 199 / 2261 / 0 |

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
| attack | Expert | 30 | 30 | 30 | 0 | 0 | 3,042,496 |
| no-attack | Ace | 30 | 30 | 30 | 0 | 0 | — |
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

### Ace (omniscient, the G4 ladder)

| Stage | Variant | Smallest H, no life lost | Smallest H, goal | H=0 | H=1 | H=2 | H=4 | H=8 |
|---|---|---|---|---|---|---|---|---|
| 1 | attack | 1 / 1 / 1 | 1 / 1 / 1 | 3g/3g/4g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 1 | no-attack | 1 / 1 / 1 | 1 / 1 / 1 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 2 | attack | 1 / 1 / 1 | 0 / 1 / 1 | 7/7g/7g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 2 | no-attack | 1 / 1 / 1 | 1 / 1 / 1 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 3 | attack | 1 / 1 / 1 | 1 / 1 / 1 | 5g/5g/5g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 3 | no-attack | 1 / 1 / 1 | 1 / 1 / 1 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 4 | attack | 1 / 1 / 1 | 1 / 1 / 1 | 4g/3g/4g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 4 | no-attack | 1 / 1 / 1 | 1 / 1 / 1 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 5 | attack | 1 / 1 / 1 | 1 / 1 / 1 | 4g/4g/4g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 5 | no-attack | 1 / 1 / 1 | 1 / 1 / 1 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 6 | attack | 1 / 1 / 1 | 1 / 1 / 1 | 3g/3g/4g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 6 | no-attack | 1 / 1 / 1 | 1 / 1 / 1 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 7 | attack | 1 / 1 / 1 | 1 / 1 / 1 | 4g/4g/4g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 7 | no-attack | 1 / 1 / 1 | 1 / 1 / 1 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 8 | attack | 1 / 1 / 1 | 1 / 1 / 1 | 4g/4g/4g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 8 | no-attack | 1 / 1 / 1 | 1 / 1 / 1 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 9 | attack | 1 / 1 / 1 | 1 / 1 / 1 | 3g/5g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 9 | no-attack | 1 / 1 / 1 | 1 / 1 / 1 | 3g/3g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 10 | attack | 1 / 1 / 1 | 1 / 1 / 1 | 3g/4g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 10 | no-attack | 1 / 1 / 1 | 1 / 1 / 1 | 3g/3g/3g | 0/0/0 | 0/0/2 | ·/·/0 | ·/·/0 |

## Where the Expert dies (horizon 48)

Per lost life: the frame, the bullet that hit (speed, frames on screen, its motion since first seen, who fired it), and
"predicted k frames ahead" = for how many frames before the hit the bot's own model (the picture of that frame,
predicted forward along the ship's real path) showed that hit. The scene's patterns follow each hit.

- none

## The causes, every diagnosed Expert hit (the first 12 per run)

| Horizon | Hits diagnosed | fired in the hit's own frame (never seen) | a dot not yet moving | motion changed after the last look | predicted 1–2 frames ahead | predicted ≥ 3 frames ahead | of them aimed |
|---|---:|---:|---:|---:|---:|---:|---:|

## Shards

- shard 1/16: 5 runs at `a006d53`, 1.7 min wall, 4 jobs on 4 cores
- shard 2/16: 5 runs at `a006d53`, 1.5 min wall, 4 jobs on 4 cores
- shard 3/16: 4 runs at `a006d53`, 2.1 min wall, 4 jobs on 4 cores
- shard 4/16: 4 runs at `a006d53`, 1.7 min wall, 4 jobs on 4 cores
- shard 5/16: 4 runs at `a006d53`, 1.2 min wall, 4 jobs on 4 cores
- shard 6/16: 4 runs at `a006d53`, 1.4 min wall, 4 jobs on 4 cores
- shard 7/16: 4 runs at `a006d53`, 1.3 min wall, 4 jobs on 4 cores
- shard 8/16: 4 runs at `a006d53`, 1.3 min wall, 4 jobs on 4 cores
- shard 9/16: 4 runs at `a006d53`, 1.2 min wall, 4 jobs on 4 cores
- shard 10/16: 4 runs at `a006d53`, 1.5 min wall, 4 jobs on 4 cores
- shard 11/16: 4 runs at `a006d53`, 1.5 min wall, 4 jobs on 4 cores
- shard 12/16: 4 runs at `a006d53`, 1 min wall, 4 jobs on 4 cores
- shard 13/16: 4 runs at `a006d53`, 1.6 min wall, 4 jobs on 4 cores
- shard 14/16: 4 runs at `a006d53`, 1.6 min wall, 4 jobs on 4 cores
- shard 15/16: 4 runs at `a006d53`, 1.5 min wall, 4 jobs on 4 cores
- shard 16/16: 4 runs at `a006d53`, 1 min wall, 4 jobs on 4 cores
