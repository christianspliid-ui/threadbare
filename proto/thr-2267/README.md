# THR-2267 prototype — the race forecast projected per sphere (never merged)

Design lane run `dl-20261121-0519`, 2026-11-21, on origin/main `af9c11c1`.

## What is here

- `agency-<seed>-<arm>.json` — `npm run census:agency -- --all --arms none,greedy,full --ticks 900 --snap-every 12`
  (one snapshot a day, so the replay sees the readings the forecast samples).
- `census-verdict-main.txt` — the census's own race line on main: **NOT MET** (greedy names Doom 0/3; seed 7
  greedy turns 6 times).
- `race-replay.mjs` — re-runs sample → project → settle offline over those snapshots, with pluggable
  Mandate projections. `V0_line` is today's model; it reproduces the census's shown state on 0–4 of ~70 days
  per run (the gap is snapshot vs in-engine sample alignment). Per-sphere shares are recovered by fitting
  `progress = (kP·ledgerP + kS·ledgerS)/2` on snapshots below 0.48 (fit error ≤0.001 on greedy/none).
- `replay-output.txt` — every model at a 2-day and a 4-day hold.

## Cause (measured)

`phaseMandate.ts:459`: `progress = clamp01((clamp01(primaryRatio) + clamp01(secondaryRatio)) / 2)`. On the
chapters-only arm the secondary sphere overshoots its target (end shares 1.42 / 2.45 / 0.91) while the primary
lags (0.83 / 0.88 / 0.60). Once one sphere is full, the total can only rise at half speed and stops where the
lagging sphere stops — but the fifteen-day straight line still carries the earlier, faster slope.

## Result (hold 4 days; turns listed for seeds 42 / 99 / 7)

| Model | greedy names Doom at 0.80 | greedy turns | full turns | none turns |
|---|---|---|---|---|
| V0 today's line | 1/3 | 2 / 2 / 2 | 1 / 1 / 1 | 0 |
| V3 per sphere, straight line | 1/3 (+1 close) | 3 / 2 / 2 | 1 / 1 / 1 | 0 |
| **V5 per sphere, slowing climb** | **3/3** | **0 / 2 / 0** | **3 / 3 / 3** | **0** |

V5 at a 2-day hold also passes (3/3; greedy 2/2/0; full 3/3/3). The full arm's three turns are a real
mid-age slowdown (place casts refused by the purse, ~86%) that the forecast reads as Doom-first for about a
week before the climb resumes; it ends `mandate_first` on all three seeds.
