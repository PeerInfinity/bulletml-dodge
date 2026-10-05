# Segments — how hard each region is for the humanlike bot (centered hitbox)

Written by `bin/segment-sweep.mjs` at commit `04ac619`, 2026-10-05, from 2720 of 2720 single attempts (1.50 CPU-hours) in 16 shards. Game seeds 1; bot seeds 16 (1–16).

A cell: the share of attempts that clear the span **deathless** (one attempt per bot seed). "½ at" = the skill at which that share reaches 50% (linear between the measured levels). E = the mean seconds a clear costs with restart-on-hit, from the deathless share p, a clean clear's length L and the mean length F of a failed attempt: E = L + F·(1 − p)/p (— when no attempt was deathless).

## Deathless share by skill

| Span | tracks 60/60/60/60 | tracks 20/60/60/60 | tracks 40/60/60/60 | tracks 80/60/60/60 | tracks 100/60/60/60 | tracks 60/20/60/60 | tracks 60/40/60/60 | tracks 60/80/60/60 | tracks 60/100/60/60 | tracks 60/60/20/60 | tracks 60/60/40/60 | tracks 60/60/80/60 | tracks 60/60/100/60 | tracks 60/60/60/20 | tracks 60/60/60/40 | tracks 60/60/60/80 | tracks 60/60/60/100 | ½ at |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1:1–1:boss | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 6% | 75% | 0% | 0% | 0% | 0% | — |
| 2:1–2:boss | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 6% | 0% | 0% | 0% | 0% | — |
| 3:1–3:boss | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 56% | 0% | 0% | 0% | 0% | — |
| 4:1–4:boss | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 19% | 0% | 0% | 0% | 0% | — |
| 5:1–5:boss | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 6% | 0% | 0% | 0% | 0% | — |
| 6:1–6:boss | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 19% | 0% | 0% | 0% | 0% | — |
| 7:1–7:boss | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 6% | 0% | 0% | 0% | 0% | — |
| 8:1–8:boss | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 25% | 0% | 0% | 0% | 0% | — |
| 9:1–9:boss | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | — |
| 10:1–10:boss | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | — |

## Seconds per clear (E), with restart-on-hit

| Span | L (s) | tracks 60/60/60/60 | tracks 20/60/60/60 | tracks 40/60/60/60 | tracks 80/60/60/60 | tracks 100/60/60/60 | tracks 60/20/60/60 | tracks 60/40/60/60 | tracks 60/80/60/60 | tracks 60/100/60/60 | tracks 60/60/20/60 | tracks 60/60/40/60 | tracks 60/60/80/60 | tracks 60/60/100/60 | tracks 60/60/60/20 | tracks 60/60/60/40 | tracks 60/60/60/80 | tracks 60/60/60/100 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1:1–1:boss | 154 | — | — | — | — | — | — | — | — | — | — | — | 1178 | 190 | — | — | — | — |
| 2:1–2:boss | 154 | — | — | — | — | — | — | — | — | — | — | — | — | 1217 | — | — | — | — |
| 3:1–3:boss | 155 | — | — | — | — | — | — | — | — | — | — | — | — | 216 | — | — | — | — |
| 4:1–4:boss | 160 | — | — | — | — | — | — | — | — | — | — | — | — | 520 | — | — | — | — |
| 5:1–5:boss | 159 | — | — | — | — | — | — | — | — | — | — | — | — | 1590 | — | — | — | — |
| 6:1–6:boss | 156 | — | — | — | — | — | — | — | — | — | — | — | — | 481 | — | — | — | — |
| 7:1–7:boss | 156 | — | — | — | — | — | — | — | — | — | — | — | — | 1518 | — | — | — | — |
| 8:1–8:boss | 155 | — | — | — | — | — | — | — | — | — | — | — | — | 360 | — | — | — | — |
| 9:1–9:boss | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| 10:1–10:boss | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |

## Monotonic in skill?

