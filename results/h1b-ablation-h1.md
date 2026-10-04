# H1 — the Expert (observed perception) against the Ace (omniscient)

Written by `bin/h1-sweep.mjs --merge` at commit `8e8e9c0`, 2026-10-04, from 33 runs (0.3 CPU-hours, diagnosis included) in 4 shards.
Budget 1× = 600 units per frame; main horizon 48. The Ace's rows are G4's (results/g4-bot.json, budget 1×, horizon 48, its own ladder 0, 1, 2, 4, …).
The Expert's settings: none (the H1 Expert) (changed by --expert `{"margin":null,"attackY":null}`): margin = the clearance in px it keeps from a bullet's drawn trail and from a spawner (an enemy, an active bullet, a dot not yet moving); attackY = the height it attacks from, px from the top.
Seeds: C rand() seed s, endlessSeed 7919 × s. "boss 3 min" = alive 11250 frames into the boss scene (no-attack's goal). Endless modes stop at 30,000 frames.

## Expert vs Ace, horizon 48

### attack

| Stage | Ace: result (seeds 1/2/3) | Ace: lives lost | Ace: score (mean) | Expert: result | Expert: lives lost | Expert: score (mean) | Expert: surprises / repairs / failed (mean) |
|---|---|---|---:|---|---|---:|---|
| 1 | cleared @9,540 / cleared @9,562 / cleared @9,541 | 0 / 0 / 0 | 2,494,263 | cleared @9,559 / cleared @9,552 / cleared @9,583 | 0 / 0 / 0 | 1,218,980 | 15 / 15 / 0 |
| 2 | cleared @9,695 / cleared @9,812 / cleared @9,662 | 0 / 0 / 0 | 4,334,687 | cleared @9,693 / cleared @9,597 / cleared @9,645 | 1 / 0 / 0 | 2,321,690 | 23 / 23 / 0 |
| 3 | cleared @9,806 / cleared @9,765 / cleared @9,982 | 0 / 0 / 0 | 3,002,980 | cleared @9,634 / cleared @9,599 / cleared @9,583 | 0 / 0 / 0 | 1,781,900 | 20 / 20 / 0 |
| 4 | cleared @9,732 / cleared @9,603 / cleared @9,590 | 0 / 0 / 0 | 2,517,520 | cleared @9,666 / cleared @9,657 / cleared @9,672 | 0 / 0 / 0 | 1,658,967 | 32 / 32 / 0 |
| 5 | cleared @9,922 / cleared @9,901 / cleared @9,914 | 0 / 0 / 0 | 4,347,913 | cleared @9,696 / cleared @9,805 / cleared @9,788 | 0 / 0 / 0 | 2,290,183 | 35 / 35 / 0 |
| 6 | cleared @9,909 / cleared @10,775 / cleared @10,582 | 0 / 0 / 0 | 3,827,440 | cleared @9,678 / cleared @9,607 / cleared @9,590 | 1 / 0 / 0 | 2,267,417 | 37 / 37 / 0 |
| 7 | cleared @9,974 / cleared @9,897 / cleared @10,005 | 0 / 0 / 0 | 3,409,663 | cleared @9,598 / cleared @9,610 / cleared @9,646 | 1 / 1 / 0 | 2,665,840 | 61 / 61 / 0 |
| 8 | cleared @9,829 / cleared @9,741 / cleared @9,832 | 0 / 0 / 0 | 3,494,637 | cleared @9,618 / cleared @9,641 / cleared @9,583 | 0 / 0 / 0 | 3,214,547 | 60 / 60 / 0 |
| 9 | cleared @9,688 / cleared @9,654 / cleared @9,708 | 0 / 0 / 0 | 4,099,793 | cleared @9,626 / cleared @9,656 / cleared @9,630 | 1 / 1 / 0 | 3,032,800 | 69 / 69 / 0 |
| 10 | cleared @9,675 / cleared @9,777 / cleared @9,770 | 0 / 0 / 0 | 4,876,817 | cleared @9,613 / cleared @9,669 / cleared @9,585 | 1 / 1 / 2 | 4,175,140 | 108 / 108 / 0 |
| ENDLESS | scene 30 / scene 30 / scene 30 | 0 / 0 / 0 | 8,631,037 | scene 30 / scene 30 / scene 30 | 0 / 2 / 2 | 6,748,063 | 184 / 184 / 0 |

### Totals, stages 1–10

| Variant | Bot | Runs | Goal reached (cleared / boss 3 min) | No life lost | Lives lost (total) | Game overs | Mean score |
|---|---|---:|---:|---:|---:|---:|---:|
| attack | Ace | 30 | 30 | 30 | 0 | 0 | 3,640,571 |
| attack | Expert | 30 | 30 | 21 | 10 | 0 | 2,462,746 |

## The look-ahead needed (stages 1–10)

Per stage and seed (1/2/3): the smallest horizon run with which the bot reaches the goal (cleared / boss 3 min) with no
life lost, and the smallest with which it reaches the goal at all; "—" = none run did. A seed climbs the ladder until two
horizons in a row succeed, so "·" = not run. H = 0 is the tail controller alone (no simulation, no dodging). The grid:
lives lost at each horizon (g = game over).

### Expert (observed)

| Stage | Variant | Smallest H, no life lost | Smallest H, goal | H=48 |
|---|---|---|---|---|
| 1 | attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 2 | attack | — / 48 / 48 | 48 / 48 / 48 | 1/0/0 |
| 3 | attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 4 | attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 5 | attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 6 | attack | — / 48 / 48 | 48 / 48 / 48 | 1/0/0 |
| 7 | attack | — / — / 48 | 48 / 48 / 48 | 1/1/0 |
| 8 | attack | 48 / 48 / 48 | 48 / 48 / 48 | 0/0/0 |
| 9 | attack | — / — / 48 | 48 / 48 / 48 | 1/1/0 |
| 10 | attack | — / — / — | 48 / 48 / 48 | 1/1/2 |

### Ace (omniscient, the G4 ladder)

| Stage | Variant | Smallest H, no life lost | Smallest H, goal | H=0 | H=1 | H=2 | H=4 | H=8 |
|---|---|---|---|---|---|---|---|---|
| 1 | attack | 1 / 1 / 1 | 1 / 1 / 1 | 3g/3g/4g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 2 | attack | 1 / 1 / 1 | 0 / 1 / 1 | 7/7g/7g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 3 | attack | 1 / 1 / 1 | 1 / 1 / 1 | 5g/5g/5g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 4 | attack | 1 / 1 / 1 | 1 / 1 / 1 | 4g/3g/4g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 5 | attack | 1 / 1 / 1 | 1 / 1 / 1 | 4g/4g/4g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 6 | attack | 1 / 1 / 1 | 1 / 1 / 1 | 3g/3g/4g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 7 | attack | 1 / 1 / 1 | 1 / 1 / 1 | 4g/4g/4g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 8 | attack | 1 / 1 / 1 | 1 / 1 / 1 | 4g/4g/4g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 9 | attack | 1 / 1 / 1 | 1 / 1 / 1 | 3g/5g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |
| 10 | attack | 1 / 1 / 1 | 1 / 1 / 1 | 3g/4g/3g | 0/0/0 | 0/0/0 | ·/·/· | ·/·/· |

## Where the Expert dies (horizon 48)

Per lost life: the frame, the bullet that hit (speed, frames on screen, its motion since first seen, who fired it), and
"predicted k frames ahead" = for how many frames before the hit the bot's own model (the picture of that frame,
predicted forward along the ship's real path) showed that hit. The scene's patterns follow each hit.

- **2 attack seed 1** (1 lost, cleared):
  - f9330: bullet 1.56 px/f from zako/bee.xml 6 px away: fired in the hit's own frame (never seen) — scene: zako/bee, boss/[Ikaruga]_r1_mdl, boss/[Progear]_round_1_boss_grow_bullets
- **6 attack seed 1** (1 lost, cleared):
  - f9420: bullet 1.56 px/f, on screen 1 f, straight, from an active bullet: a dot not yet moving — scene: zako/accum, boss/[Progear]_round_5_boss_last_round_wave, boss/[Progear]_round_5_middle_boss_rockets, boss/57way
- **7 attack seed 1** (1 lost, cleared):
  - f9224: bullet 3.11 px/f from boss/[Progear]_round_5_middle_boss_rockets.xml 3 px away: fired in the hit's own frame (never seen) — scene: zako/[Ikaruga]_r5_vrp, boss/[Progear]_round_5_middle_boss_rockets, boss/bit, boss/[daiouzyou]_hibati_2_2_b, boss/[daiouzyou]_hibati_2_2_r, boss/[daiouzyou]_r1_boss_1
- **7 attack seed 2** (1 lost, cleared):
  - f9274: bullet 3.11 px/f from boss/[Progear]_round_5_middle_boss_rockets.xml 5 px away: fired in the hit's own frame (never seen); bullet 3.11 px/f from boss/[Progear]_round_5_middle_boss_rockets.xml 5 px away: fired in the hit's own frame (never seen); bullet 2.5 px/f from boss/[Progear]_round_5_middle_boss_rockets.xml 5 px away: fired in the hit's own frame (never seen); bullet 3.11 px/f from boss/[Progear]_round_5_middle_boss_rockets.xml 5 px away: fired in the hit's own frame (never seen); bullet 2.5 px/f from boss/[Progear]_round_5_middle_boss_rockets.xml 5 px away: fired in the hit's own frame (never seen); bullet 2.5 px/f from boss/[Progear]_round_5_middle_boss_rockets.xml 5 px away: fired in the hit's own frame (never seen); bullet 2.5 px/f from boss/[Progear]_round_5_middle_boss_rockets.xml 5 px away: fired in the hit's own frame (never seen) — scene: zako/[Ikaruga]_r5_vrp, boss/[Progear]_round_5_middle_boss_rockets, boss/bit, boss/[daiouzyou]_hibati_2_2_b, boss/[daiouzyou]_hibati_2_2_r, boss/[daiouzyou]_r1_boss_1
- **9 attack seed 1** (1 lost, cleared):
  - f4122: bullet 1.87 px/f, on screen 1 f, straight, from boss/[Progear]_round_2_boss_struggling.xml: a dot not yet moving — scene: middle/4way, boss/[Progear]_round_1_boss_grow_bullets, middle/22way, boss/[Progear]_round_2_boss_struggling, middle/[Ikaruga]_rf_l, boss/[Progear]_round_3_boss_back_burst
- **9 attack seed 2** (1 lost, cleared):
  - f7876: bullet 1.99 px/f from zako/3waychase.xml 5 px away: fired in the hit's own frame (never seen); bullet 2 px/f from zako/3waychase.xml 5 px away: fired in the hit's own frame (never seen) — scene: zako/3waychase, middle/2round, boss/[Psyvariar]_X-A_boss_opening, zako/bit_move, middle/23accel, boss/[daiouzyou]_hibati_2_2_b
- **10 attack seed 1** (1 lost, cleared):
  - f2822: bullet 1.88 px/f from an active bullet 2 px away: fired in the hit's own frame (never seen) — scene: zako/6gt, middle/spreadnn, boss/[Guwange]_round_3_boss_fast_3way, zako/bar
- **10 attack seed 2** (1 lost, cleared):
  - f2901: bullet 1.87 px/f, on screen 1 f, straight, from ?: a dot not yet moving — scene: zako/6gt, middle/spreadnn, boss/[Guwange]_round_3_boss_fast_3way, zako/bar
- **10 attack seed 3** (2 lost, cleared):
  - f8441: bullet 1.87 px/f from ? 6 px away: fired in the hit's own frame (never seen); bullet 3.11 px/f from ? 6 px away: fired in the hit's own frame (never seen); bullet 4.36 px/f from ? 6 px away: fired in the hit's own frame (never seen); bullet 5.61 px/f from ? 6 px away: fired in the hit's own frame (never seen); bullet 1.87 px/f from ? 6 px away: fired in the hit's own frame (never seen); bullet 3.12 px/f from ? 6 px away: fired in the hit's own frame (never seen); bullet 4.37 px/f from ? 6 px away: fired in the hit's own frame (never seen); bullet 5.61 px/f from ? 6 px away: fired in the hit's own frame (never seen) — scene: zako/twin_extend, middle/[daiouzyou]_r1_boss_3, boss/[Progear]_round_5_middle_boss_rockets, zako/spread, middle/shotgun, boss/[Psyvariar]_X-A_boss_opening
  - f9071: bullet 3.12 px/f, on screen 1 f, straight, from boss/88way.xml: a dot not yet moving; bullet 3.11 px/f, on screen 1 f, straight, from boss/88way.xml: a dot not yet moving — scene: zako/rndway, boss/88way, boss/[daiouzyou]_hibati_2_2_r, boss/[daiouzyou]_r1_boss_1, boss/57way, boss/[daiouzyou]_r1_boss_4, boss/[daiouzyou]_r1_boss_5
- **ENDLESS attack seed 2** (2 lost, cap):
  - f10624: bullet 2.8 px/f from zako/accel.xml 5 px away: fired in the hit's own frame (never seen) — scene: zako/accel, middle/[Ikaruga]_r3_mdl_3, boss/[daiouzyou]_r1_boss_4, zako/[ketsui]_r1_boss_bit, middle/[ketsui]_r2_5way_round, boss/side_cracker
  - f24334: bullet 18.68 px/f, on screen 1 f, straight, from boss/[daiouzyou]_r1_boss_1.xml: a dot not yet moving; bullet 18.74 px/f, on screen 1 f, straight, from boss/[daiouzyou]_r1_boss_1.xml: a dot not yet moving; bullet 18.68 px/f, on screen 1 f, straight, from boss/[daiouzyou]_r1_boss_1.xml: a dot not yet moving — scene: middle/growround, boss/[ketsui]_r3_boss_fastspread, middle/nwroll, boss/[daiouzyou]_r1_boss_1, middle/mnway, boss/57way
- **ENDLESS attack seed 3** (2 lost, cap):
  - f881: bullet 1.56 px/f, on screen 1 f, straight, from zako/thrust.xml: a dot not yet moving — scene: zako/bar, middle/spreadnn, boss/88way, zako/thrust
  - f29446: bullet 1.87 px/f from ? 6 px away: fired in the hit's own frame (never seen); bullet 3.12 px/f from ? 6 px away: fired in the hit's own frame (never seen); bullet 4.37 px/f from ? 6 px away: fired in the hit's own frame (never seen); bullet 1.87 px/f from ? 6 px away: fired in the hit's own frame (never seen); bullet 3.11 px/f from ? 6 px away: fired in the hit's own frame (never seen); bullet 4.37 px/f from ? 6 px away: fired in the hit's own frame (never seen) — scene: zako/spread, middle/spread_bf, boss/[Ikaruga]_drc2, zako/twin, middle/shotgun, boss/double_roll_seeds

## The causes, every diagnosed Expert hit (the first 12 per run)

| Horizon | Hits diagnosed | fired in the hit's own frame (never seen) | a dot not yet moving | motion changed after the last look | predicted 1–2 frames ahead | predicted ≥ 3 frames ahead | of them aimed |
|---|---:|---:|---:|---:|---:|---:|---:|
| 48 | 14 | 8 | 6 | 0 | 0 | 0 | 0 |

## Shards

- shard 1/4: 9 runs at `8e8e9c0`, 1.4 min wall, 4 jobs on 4 cores
- shard 2/4: 8 runs at `8e8e9c0`, 1.2 min wall, 4 jobs on 4 cores
- shard 3/4: 8 runs at `8e8e9c0`, 1.3 min wall, 4 jobs on 4 cores
- shard 4/4: 8 runs at `8e8e9c0`, 1 min wall, 4 jobs on 4 cores
