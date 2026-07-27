# THR-810 — guild rank reachability: verdict

**Date:** 2026-07-27 · **Issue:** THR-810 · **Pillar:** Engine · **Status:** verdict recorded, fix re-scoped

Reproduce with:

```bash
npm run sweep:rank-reach -- --seed 42 --map medium --ticks 200 --every 50
```

## Verdict in one line

**All three levers THR-810 proposed are void, because the quantity they adjust is
zero.** The guild reputation economy records **no gain at all** in a live run — not
insufficient gain, none — so the apex tier is not mis-tuned, it is unfed.

## What the sweep measured

`scripts/rank-reach-sweep.ts` runs the real `initializeGameState` → `runTick`
pipeline headlessly and samples every `member_of` edge carrying a `factionDefId`.
Seed 42, map medium, the loop identical to the CLI's `doTick`.

| tick | phase | memberships | max | p90 | median | >=0.60 | >=0.75 | >=0.85 | apex holders |
| ---: | :-- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | playing | 227 | 0.900 | 0.740 | 0.220 | 72 | 12 | 10 | 10 |
| 50 | playing | 203 | 0.868 | 0.725 | 0.208 | 70 | 10 | 5 | 5 |
| 100 | playing | 181 | 0.828 | 0.675 | 0.168 | 36 | 7 | 0 | 0 |
| 150 | playing | 161 | 0.788 | 0.628 | 0.160 | 33 | 5 | 0 | 0 |
| 200 | twilight | 141 | 0.748 | 0.588 | 0.088 | 13 | 0 | 0 | 0 |

Two censuses over the same 200 ticks:

```
Reputation gain census: 0 increases (0 while phase=playing), total +0.000
Faction-template draw census: 3 action instances, 0 drawn by a member of the owning faction
```

## Three corrections to the ticket's premise

**1. There is no equilibrium — the decline is unbroken decay.** THR-810 read the
plateau at ≈0.778 as a gain/decay balance point and derived a required quest cadence
from it. There is no balance: `max` falls by a dead-linear ≈0.0008/tick from tick 0
to tick 900 without a single interruption. Zero memberships gained reputation in 200
ticks. `processFactionEncounterReputation` is correctly wired at both call sites
(`orchestrator.ts:563`, `unifiedActionResolution.ts:1888`) and returns at its
`if (!factionEdge) return` guard every time, because the 3 faction-template actions
drawn in 200 ticks were drawn by non-members.

**2. The 0.6 floor is not safe either.** The ticket recorded 25 members holding ≥0.6
indefinitely and split the content into "6 reachable / 6 unreachable" on that basis.
Measured over a full run, `>=0.60` goes 72 → 33 → 5 → **0 by tick 450**, and all 60
rank-gated templates across all 12 guilds are blocked by tick 900 — senior as well as
elite. The senior tier is not reachable; it is only slower to die.

**3. Everything past ~tick 200 is a post-game world.** The run enters `twilight`
between ticks 150 and 225. The ticket's 300/600/900 rows — and the first pass of this
sweep — measure a world after the run has effectively ended. This also explains why
the original CLI measurement appeared to stabilise at 131 memberships: the CLI's
`doTick` **stops early** on a `twilight`/`harvest` phase change, so a piped `tick 150`
silently advanced 15 ticks. Any future measurement must report `state.phase` next to
the tick; the sweep script now does.

Consequence for the ticket's own acceptance: Done-when 2 asks for an apex holder "at
tick ≥ 300", which is unreachable by construction — there is no live run at tick 300.
Same class as the THR-689 `document.hidden` trap.

## Levers, and why each is rejected

| Lever | Verdict |
| :-- | :-- |
| 1. Lower the apex `minReputation` toward ~0.75 | **Rejected.** The distribution is not resting at 0.778 — it is passing through it. `>=0.75` goes 12 → 7 → 5 → 0. A 0.75 floor is reachable for perhaps 100 ticks and then is not. It buys a delay and flattens every guild ladder to pay for it. |
| 2. Raise sustained gain for high-rank members (scale `reputationReward` by tier, or exempt them from decay) | **Rejected.** `reputationReward` is only ever read inside `processFactionEncounterReputation`, which never runs. Multiplying an unreached reward changes nothing. Decay exemption would freeze the worldgen-seeded leaders at 0.9 forever, which manufactures apex holders without a ladder anyone can climb — a worse lie than the current honest zero. |
| 3. Re-point the 6 elite templates one tier down | **Rejected.** Same decay, later death: by tick 450 the 0.6 tier is empty too. It also spends the top of four guild ladders and leaves the apex a title with no content. |

All three treat a reachability defect as a tuning problem. **The fix belongs in the
draw path, not the reward economy** — and not in this ticket.

## Where the real defect sits

Guild senior/elite content is authored `scale: 'regional'`
(`mct.senior.foreign_deal`, `rb.elite.monster_hunt`, `ts.elite.found_cathedral`,
`bf.elite.grand_monument` …), and `unifiedCandidates.ts:117` skips `regional` and
`cosmic` on the array-scored path by design. The comment there is explicit that such
templates are expected to arrive via the encounter-cache → scoring path instead. The
measurement says that second path is not delivering them to members either: 3 draws in
200 ticks, none by a member, against 227 memberships.

That is the THR-779 family (mortal templates with no live draw path), not a rank
question. Filed as **THR-814** rather than green-fielded here — picking a routing rule
(membership affinity weight? a guild-quest offer phase? widening the cache path?) is a
design decision with its own three pillars, and the systems-inventory rule exists to
stop exactly this kind of adjacent green-field.

## Builders' Fellowship floor inconsistency — confirmed as authored, left unchanged

THR-810 flagged `bf.elite.*` as requiring `master_builder` (tier 2) where the siblings
require their tier-3 apex. It is broader than reported: **`bf` sits one rung lower at
both steps**, senior as well as elite.

| guild | senior → tier | elite → tier |
| :-- | :-- | :-- |
| merchant_consortium | `guildsman` (2, 0.6) | `trade_prince` (3, 0.85) |
| rangers_brotherhood | `ranger_captain` (2, 0.6) | `lord_ranger` (3, 0.85) |
| temple_of_spheres | `high_priest` (2, 0.6) | `pontifex` (3, 0.85) |
| **builders_fellowship** | **`journeyman` (1, 0.3)** | **`master_builder` (2, 0.6)** |

A uniform shift of the whole upper ladder reads as authored; a copy error misplaces one
rung, not two in step. **Verdict: left as authored.** Aligning `bf` upward would make
the one guild whose upper tail sits inside the reachable band unreachable as well, and
with the economy supplying no gain neither placement can be validated against play.
Pinned by test rather than by prose — `factionRankGate.test.ts` now asserts both sides
of the divergence, so it cannot drift further unnoticed. Revisit when guild content
actually reaches members.

## What shipped

- `scripts/rank-reach-sweep.ts` + `npm run sweep:rank-reach` — the measurement, kept as
  a repeatable check rather than a one-off. Exits non-zero while the apex is unreachable,
  so it can become a gate once the draw path is fixed.
- `factionRankGate.test.ts` — the `bf` tier placement pinned on both sides.
- This verdict.

Not shipped, deliberately: any change to `minReputation` floors, `minRank` placements,
or the reward economy. Every such change is unverifiable while gain is zero, and three
of them were the ticket's proposed scope.
