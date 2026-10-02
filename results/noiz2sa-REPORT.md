# Noiz2sa sweep — run report

| | |
|---|---|
| Started (UTC) | 2026-10-02T15:56:37Z |
| Wall time | 54 s (sweep's own figure: 53.9 s; `time`: real 0m53.98s, user 2m25.9s) |
| Node | v22.22.0 |
| nproc | 4 (`--jobs 4`) |
| Commit | `58312cab27e13e8b2a27db06e7416c8ef8083c41` (main at the time; no code changed) |
| Command | `node bin/sweep.mjs patterns/noiz2sa --jobs 4 --timeout-min 45 --name noiz2sa` |
| Settings | seeds 3, ranks 0.5 and 1, 1200 frames, horizons 2,4,8,16,32,64, beam 16 |

The quick check passed first: `node bin/run-pattern.mjs patterns/noiz2sa/zako/3waychase.xml --seeds 1 --ranks 1` printed
"3waychase.xml: REFLEX is enough".

## Tally (from results/noiz2sa.md)

| Verdict | Patterns |
|---|---|
| reflex | 62 |
| H2 | 11 |

No pattern needed H ≥ 4, and none was `not-dodged`. **There were no timeout or error rows.**

## Patterns whose verdict is not `reflex`

All 11 are `H2`, and all 11 are in `boss/`. The `frames` and `peak` columns are from the **reflex** run (`run-pattern.mjs` records the reflex run's numbers), so on a failed row `frames` is reflex's hit frame + 1.

| Pattern | Rank/seed rows needing H2 (reflex hit frame) | Peak bullets r0.5 / r1 |
|---|---|---|
| [daiouzyou]_r1_boss_4.xml | r1 s3 (987) | 101 / 133 |
| [daiouzyou]_r1_boss_5.xml | **all 6** (each one at 115) | 44 / 52 |
| [Guwange]_round_4_boss_eye_ball.xml | r1 s3 (623) | ~90 / ~250 |
| [Ikaruga]_drc2.xml | r1 s1 (584), r1 s2 (986) | ~28 / ~42 |
| [ketsui]_r5_accel_aim_13way.xml | **r0.5 s1, s2, s3 (each one at 228)**; rank 1 is reflex | 102 / 129 |
| [ketsui]_r5_middle_slow_spread.xml | r1 s1 (938) | ~127 / ~148 |
| [Progear]_round_1_boss_grow_bullets.xml | r1 s1, s2, s3 (each one at 343) | 79 / 170 |
| [Progear]_round_2_boss_struggling.xml | r1 s1 (811) | ~128 / ~359 |
| [Progear]_round_5_boss_last_round_wave.xml | **r0.5 s2 (917)**; rank 1 is reflex | ~107 / ~206 |
| double_roll_seeds.xml | r1 s1, s2, s3 (each one at 570) | 120 / 149 |
| side_cracker.xml | r0.5 s3 (561), r1 s2 (602) | ~83 / ~96 |

Full per-row detail (`tried` strings) is in `results/noiz2sa.json`; every failing row reads `reflex:hit@N H2:ok`.

## Things worth noticing

1. **A lower rank is harder than a higher rank in two patterns.**
   - `[ketsui]_r5_accel_aim_13way.xml`: at rank 0.5 reflex is hit at frame 228 for every seed, but at rank 1 it survives 1200 frames on every seed. Rank probably changes the speed or timing of the aimed 13-way enough that the slower version catches the straight-line extrapolation (8 frames) out. It needs a look in the viewer.
   - `[Progear]_round_5_boss_last_round_wave.xml`: only r0.5 s2 fails. Rank 1 is reflex on all seeds even though its bullet peak is about twice as high.
   No pattern needs a *larger horizon* at a lower rank, since every failure is solved at H2. The inversion is between reflex and H2.
2. **H2 always works.** The horizon ladder never got past its first step. So the planner, which knows the seeded `$rand` future, separates nothing beyond "reflex vs. not". The "reflex fails, H=2 succeeds" caveat in the README applies to all 11 patterns: this sweep mostly measures where the reflex heuristic fails.
3. **Every failure is a boss pattern.** The `middle/` and `zako/` runs end early once their pattern finishes and no bullets remain (non-boss runs stop when `quiet`). All 246 of their early-ending reflex rows ended between frames 140 and 533. Bosses run the full 1200 frames, so they are exposed about 2–8× longer. Some of the boss/non-boss split may come from that exposure rather than from difficulty.
4. **Many results do not depend on the seed.** Several failures repeat at the identical frame across all three seeds (boss_5 @115, accel_aim_13way @228, grow_bullets @343, double_roll_seeds @570), with identical peaks. These patterns either draw no `$rand` before the hit, or their draws do not change the outcome. For them, 3 seeds amount to 1 sample.
5. `[daiouzyou]_r1_boss_5.xml` is the only pattern where reflex fails at every rank and seed, and it fails very early (frame 115, peak ≤ 52 bullets). That points at a specific geometric trap for the reflex heuristic rather than at bullet density.
6. The sweep was far faster than expected (54 s total; the slowest pattern was `double_roll_seeds.xml` at 38 s), because no pattern ever reached the expensive large-horizon planner runs.
