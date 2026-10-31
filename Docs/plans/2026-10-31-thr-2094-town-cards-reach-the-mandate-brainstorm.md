> **title:** Town cards reach the Mandate — brainstorm companion (THR-2094)
> **linear_issue:** THR-2094
> **author:** Claude Code (design lane, run 2026-10-31d, unattended)
> **created:** 2026-10-31

# Brainstorm companion: why the town cards plateau

Companion to [the plan](2026-10-31-thr-2094-town-cards-reach-the-mandate.md). It records the hypotheses tested, in order, and the levers weighed.

## Hypotheses the ticket named

1. **Town scores saturate.** *Refuted.* At doom 0.75 every Reshape target town holds force 0–4, against a cap of 10. Preserve's time and Bind's matter look the same (`scoreHist` lines in `r-base.txt`, `p-base.txt`, `b-base.txt`).
2. **Casts stall.** *Confirmed, but it is supply, not refusal.* `refused={}` in every arm. After the starting pool runs out, the god cannot afford its 2-essence card on about 95% of ticks. All arms land about 65 first-sphere casts by doom 0.75.

## What the counters added

- **Share is not the issue.** The god's share per level-up is 0.96–0.99 everywhere, so the world's own pushes on busy towns do not dilute it.
- **One level per push.** `resolveSpherePressure` levels a score at most once per push and banks the rest as progress. On fresh ground a cast is worth about one point, whatever its size. That is why the uncapped push arm moved Reshape only from 34.2 to 42.2: towns revisited at score 3+ need 4+ pressure per level, and doubling the push helps there. On fresh Places it banks unused progress (Place + 2× push equals Place alone for Reshape, 66.2 both).
- **The ceiling for a 2-essence god is about 66.** 65 casts at one point each. The `WIDE`, `SUBLOC` and `DISTRICT` arms all hit it for Reshape. Witness's 1-essence Vision gets about 130 casts, which is why the 87 target fits it.
- **Contest.** Towns lose 12–13 points to rival and doom wear (Reshape, Preserve). Places and Witness's ground lose 0.

## Levers weighed

| Lever | Result (first sphere at doom 0.75) | Taken? |
|---|---|---|
| Widen `targetSubtypes` to every place | Reshape 68.2 | No. A town card on a ruin does nothing the card says (Substrate Honesty) |
| Allow Place targets on the town cards | Reshape 66.2 (any-Place arm) | No. The ops write to the town's own properties, so a Place target would change nothing the player can see |
| Push ×2 for the god's 2+ essence cards | 42.2 / 36.2 / 54.3 | **Yes, with the Place rule** |
| The god's push at a town settles in its least-touched Place | 66.2 / 35.2 / 49.3 | **Yes** |
| Both | 66.2 / 45.2 / 58.3 | **Taken** |
| Uncapped per-essence push | not measured beyond the cheapest cards | No. An 18-essence card would push 54 |
| Lower the Mandate target | — | No. Witness finishes before doom 0.5 |
| Per-Hunger target | — | No. Slice 1 Decision 1 |
| Re-price the town cards to 1 | — | No. Slice 1 Decision 2 |
| Credit pressure instead of levels in the ledger | not measured | No. It rewrites THR-2081's unit and refits every number, to fix one card family |

## Gather, Kindle, Haunt, Consume (indicative only)

The census picks today's cheapest card per sphere, and slice 2's cards are not built yet. So these arms used the 4-essence gift cards (`loc.bless_harvest`, `loc.blight`) or the temple-gated `action.consecrate`, under the 2× push. Gather's life reached 12.2, still worn by doom's tide, which THR-2090 removes. Kindle's energy reached 26.2, Haunt's spirit 32.2, Consume's entropy 16.2. They are re-measured on top of THR-2090 in the Done-when, not tuned here.
