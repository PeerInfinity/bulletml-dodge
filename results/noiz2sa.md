# Sweep: noiz2sa

73 patterns, 4 jobs, 0.9 min wall.
Settings: {"seeds":3,"ranks":[0.5,1],"frames":1200,"horizons":[2,4,8,16,32,64],"beam":16}

## Tally

| Verdict | Patterns |
|---|---|
| reflex | 62 |
| H2 | 11 |

## Per pattern

Verdict = the worst over all seeds and ranks: `reflex`, the smallest planner horizon `H<n>` that survived, or `not-dodged`.

| Kind | Pattern | Verdict | Per rank/seed |
|---|---|---|---|
| boss | [daiouzyou]_hibati_2_2_b.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| boss | [daiouzyou]_hibati_2_2_r.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| boss | [daiouzyou]_r1_boss_1.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| boss | [daiouzyou]_r1_boss_4.xml | H2 | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:H2 |
| boss | [daiouzyou]_r1_boss_5.xml | H2 | r0.5s1:H2 r0.5s2:H2 r0.5s3:H2 r1s1:H2 r1s2:H2 r1s3:H2 |
| boss | [daiouzyou]_r1_boss_l.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| boss | [Guwange]_round_2_boss_circle_fire.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| boss | [Guwange]_round_3_boss_fast_3way.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| boss | [Guwange]_round_4_boss_eye_ball.xml | H2 | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:H2 |
| boss | [Ikaruga]_drc2.xml | H2 | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:H2 r1s2:H2 r1s3:R |
| boss | [Ikaruga]_r1_mdl.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| boss | [ketsui]_r2_boss_rkt.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| boss | [ketsui]_r3_boss_fastspread.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| boss | [ketsui]_r4_boss_rb_rockets.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| boss | [ketsui]_r5_accel_aim_13way.xml | H2 | r0.5s1:H2 r0.5s2:H2 r0.5s3:H2 r1s1:R r1s2:R r1s3:R |
| boss | [ketsui]_r5_middle_slow_spread.xml | H2 | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:H2 r1s2:R r1s3:R |
| boss | [Progear]_round_1_boss_grow_bullets.xml | H2 | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:H2 r1s2:H2 r1s3:H2 |
| boss | [Progear]_round_2_boss_struggling.xml | H2 | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:H2 r1s2:R r1s3:R |
| boss | [Progear]_round_3_boss_back_burst.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| boss | [Progear]_round_3_boss_wave_bullets.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| boss | [Progear]_round_5_boss_last_round_wave.xml | H2 | r0.5s1:R r0.5s2:H2 r0.5s3:R r1s1:R r1s2:R r1s3:R |
| boss | [Progear]_round_5_middle_boss_rockets.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| boss | [Psyvariar]_X-A_boss_opening.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| boss | 57way.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| boss | 88way.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| boss | beewinder.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| boss | bit.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| boss | double_roll_seeds.xml | H2 | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:H2 r1s2:H2 r1s3:H2 |
| boss | forward_3way.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| boss | roll3pos.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| boss | rollbar.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| boss | side_cracker.xml | H2 | r0.5s1:R r0.5s2:R r0.5s3:H2 r1s1:R r1s2:H2 r1s3:R |
| middle | [daiouzyou]_r1_boss_2.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| middle | [daiouzyou]_r1_boss_3.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| middle | [Ikaruga]_r3_mdl_3.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| middle | [Ikaruga]_rf_l.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| middle | [ketsui]_r2_5way_round.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| middle | [ketsui]_r4_boss_last_red_aim.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| middle | 1tonway.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| middle | 22way.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| middle | 23accel.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| middle | 2round.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| middle | 4waccel.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| middle | 4way.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| middle | accel16way.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| middle | grow.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| middle | growround.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| middle | mnway.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| middle | nwroll.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| middle | shotgun.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| middle | spread_bf.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| middle | spread2blt.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| middle | spreadnn.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| middle | vrtlas.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| middle | xfire.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| zako | [Ikaruga]_r5_vrp.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| zako | [ketsui]_r1_boss_bit.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| zako | 248shot.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| zako | 3waychase.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| zako | 6gt.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| zako | accel.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| zako | accum.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| zako | bar.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| zako | bee.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| zako | bit_move.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| zako | nway.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| zako | rndway.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| zako | slowdown.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| zako | spread.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| zako | stay.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| zako | thrust.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| zako | twin_extend.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
| zako | twin.xml | reflex | r0.5s1:R r0.5s2:R r0.5s3:R r1s1:R r1s2:R r1s3:R |
