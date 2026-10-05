# Segments — how hard each region is for the humanlike bot (centered hitbox)

Written by `bin/segment-sweep.mjs` at commit `04ac619`, 2026-10-05, from 1610 of 1610 single attempts (0.89 CPU-hours) in 16 shards. Game seeds 1; bot seeds 16 (1–16).

A cell: the share of attempts that clear the span **deathless** (one attempt per bot seed). "½ at" = the skill at which that share reaches 50% (linear between the measured levels). E = the mean seconds a clear costs with restart-on-hit, from the deathless share p, a clean clear's length L and the mean length F of a failed attempt: E = L + F·(1 − p)/p (— when no attempt was deathless).

## Deathless share by skill

| Span | skill 0 | skill 10 | skill 20 | skill 30 | skill 40 | skill 50 | skill 60 | skill 70 | skill 80 | skill 90 | skill 100 | ½ at |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1:1–1:boss | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 6% | 100% | 95 |
| 2:1–2:boss | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 100% | 95 |
| 3:1–3:boss | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 6% | 100% | 95 |
| 4:1–4:boss | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 100% | 95 |
| 5:1–5:boss | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 100% | 95 |
| 6:1–6:boss | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 100% | 95 |
| 7:1–7:boss | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 100% | 95 |
| 8:1–8:boss | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 100% | 95 |
| 9:1–9:boss | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 100% | 95 |
| 10:1–10:boss | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 100% | 95 |

## Seconds per clear (E), with restart-on-hit

| Span | L (s) | skill 0 | skill 10 | skill 20 | skill 30 | skill 40 | skill 50 | skill 60 | skill 70 | skill 80 | skill 90 | skill 100 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1:1–1:boss | 153 | — | — | — | — | — | — | — | — | — | 1324 | 153 |
| 2:1–2:boss | 153 | — | — | — | — | — | — | — | — | — | — | 153 |
| 3:1–3:boss | 155 | — | — | — | — | — | — | — | — | — | 1052 | 155 |
| 4:1–4:boss | 156 | — | — | — | — | — | — | — | — | — | — | 156 |
| 5:1–5:boss | 157 | — | — | — | — | — | — | — | — | — | — | 157 |
| 6:1–6:boss | 157 | — | — | — | — | — | — | — | — | — | — | 157 |
| 7:1–7:boss | 164 | — | — | — | — | — | — | — | — | — | — | 164 |
| 8:1–8:boss | 156 | — | — | — | — | — | — | — | — | — | — | 156 |
| 9:1–9:boss | 155 | — | — | — | — | — | — | — | — | — | — | 155 |
| 10:1–10:boss | 156 | — | — | — | — | — | — | — | — | — | — | 156 |

## Monotonic in skill?

| | skill 0 | skill 10 | skill 20 | skill 30 | skill 40 | skill 50 | skill 60 | skill 70 | skill 80 | skill 90 | skill 100 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Deathless, all spans | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 1% | 100% |

All spans together: **NOT strictly monotonic**. 0 of 10 span(s) not weakly monotonic on their own — few attempts per level, so a single attempt more or less is noise.
