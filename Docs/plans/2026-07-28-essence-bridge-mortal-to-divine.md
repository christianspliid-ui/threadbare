---
status: current
issue: THR-618 (Mortal Economy P4 — the essence bridge deliverable)
supersedes: none (couples two shipped systems; invents nothing)
---

# The essence bridge — mortal economy → divine economy

> **lint_plan_doc:** exempt — a shipped-deliverable record, not a plan awaiting handoff. It has no Done-when, coordination block, or forked-audit verdicts because it proposes no work: the change landed in the same PR that added this file, and its acceptance evidence is in the commit body. Same shape as its sibling `2026-07-22-flow-web-extraction-checkpoint.md`, the other P4 checkpoint deliverable. See THR-618.

**Ticket:** THR-618, the last open item of Mortal Economy P4.
**Parent plans:** `Docs/plans/2026-07-04-mortal-economy-resource-web.md` (§Resource model row *"Incense, relics | Spirit | temple economies; bridges to essence (THR-611)"*, §Phasing P4) and `Docs/plans/2026-07-05-divine-economy-essence-sources.md` (which named the coupling and left it to P4).
**Sibling deliverable:** `Docs/plans/2026-07-22-flow-web-extraction-checkpoint.md` — the *other* P4 checkpoint, already decided (defer extraction).
**Date:** 2026-07-28.

## What was still open

P4 shipped its five divine economic verbs in the 2026-07-22 slice (PR #742). Two items stayed
open on the ticket, and the extraction checkpoint closed one of them. This document closes the
other: the **essence bridge** — the coupling that makes the mortal resource web matter to divine
income.

The extraction checkpoint measured the two economies against each other and found **zero shared
code**: `essenceSources.ts` imported nothing from `resourceEconomy.ts` and referenced no
`stockTier` concept. That was the correct finding for *abstraction* (don't extract a primitive
neither consumer needs) and simultaneously the diagnosis for *coupling*: the two webs sat on the
same map and never touched. A god's essence and a god's people had nothing to do with each other.

## The design

**A typed essence source is sustained by the land it stands on.**

Each tick, for every source the ascendant controls:

1. Resolve the host to its **economic location** — a location answers for itself; a sublocation
   walks one `parentLocationId` hop (the three-tier position model: stocks live at the location
   tier). Anything that resolves to no resourced location draws nothing.
2. Take the goods at that location whose `RESOURCE_CLASSES[id].primarySphere` equals the source's
   `sphereAffinity`. A Spirit shrine looks to its valley's pearls; a Matter nexus to its ore and
   stone.
3. Score their **already-derived** stock tiers — `surplus +1`, `adequate 0`, `scarce −1` — weighted
   by class `baseValue`, giving an affinity score in `[-1, 1]`. Nothing is recomputed; this reads
   the tiers `phaseResourceStockTiers` already wrote (NFP #7).
4. Drift sanctity by `affinityScore × ECON_SANCTITY_DRIFT_PER_TICK`.

That is the whole coupling: **one signed number per source per tick**, applied to the private
scalar the divine economy already owns. No second income channel, no new phase, no new node or
edge type, nothing new for the player to read.

### The two asymmetries (this is the design, not an implementation detail)

**Upward drift stops at `ECON_SANCTITY_NURTURE_CEILING` (0.5)** — deliberately *below*
`SANCTITY_FLOWERING_THRESHOLD` (0.6). A rich valley carries a source most of the way and then
stops. **Only the god's hand makes a source flower.** Without this, a well-chosen shrine site would
flower on its own and the Build/Sanctify verb would become decoration.

**Downward drift has no floor above zero,** and stacks with the contested drain in the same tick. A
starving land empties a source completely; a starving land *plus* a rival bleeding it does so
roughly three times faster.

The world gives less than it can take away. That asymmetry is what makes tending and defending a
source worth the player's attention, and it is asserted directly as contract tests rather than left
as a property of the constants.

### What is deliberately excluded

**Untyped sources draw no drift.** A migrated, unbuilt place of power has no `sphereAffinity`, so
it is skipped — it stays on the legacy alignment-distributed income term. This is the NFP #6
load-bearing contract from THR-611 carried forward intact: *a save that has done nothing keeps
exactly its old income.* Pinned by a 100-tick test on a doubly-surplus location.

**Desecrated sources are inert.** The land's gift redirects with the income; a source the player has
lost is not quietly being nurtured back on their behalf.

## Three pillars

**Engine.** `src/engine/essenceEconomyBridge.ts` (new, pure: `computeSanctitySustenance`,
`resolveEconomicHost`, `scoreSphereAffinity`, `sustenancePolarity`). Applied inside the existing
`recomputeControlledSourceTiers` walk in `essenceSources.ts` — the pass already iterating controlled
sources and already writing sanctity, so the bridge costs no extra traversal. Order within the tick:
economic drift, then the contested drain, then tier derivation.

**Content.** `SUSTENANCE_PROSE` in `src/data/essence-sources.ts` — per-Sphere × polarity
(nurturing / steady / withering) sentences in the baseline plain register (THR-609), plus a generic
fallback for the four Foundation spheres, which no resource class carries. Tuning what the coupling
*says* is editing this table (NFP #1).

**UI.** The Livelihood line in `LocationView.tsx` gains one sustenance sentence when the location
hosts a **discovered**, sphere-typed, non-desecrated source *and* actually grows goods of that
Sphere. The guards mirror the engine's exactly, so the sentence never claims a bargain the drift is
not making, and an undiscovered source stays silent (fog-consistent). The DebugPanel Essence Sources
tab gains a per-source `land:` line naming polarity, matched goods, and drift.

**Wiring.** No new phase — `phaseEssenceSources` is unchanged in registration and gains only two
trace counters. The aggregate `essence_source_phase` trace carries `econNurtured` / `econWithered`
(still ONE trace per tick, never per source). `__DEBUG.getEssenceSources()` returns a per-source
`sustenance` block, and gains the `.d.ts` entry it was previously missing entirely.

## Constants

| Constant | Default | Purpose |
|---|---|---|
| `ECON_SANCTITY_DRIFT_PER_TICK` | 0.01 | Sanctity drift at a full surplus/scarcity match |
| `ECON_SANCTITY_NURTURE_CEILING` | 0.5 | Ceiling the land alone cannot pass (below Flowering 0.6) |
| `ECON_STOCK_TIER_SCORE` | −1 / 0 / +1 | Signed tier contribution (scarce / adequate / surplus) |

At the default drift, a uniformly-surplus valley carries a source from 0 to the ceiling in 50 ticks
(~4 game days at 12 ticks/day) — slow enough to read as the land's work, fast enough to notice
inside a run.

## Fail-soft

| Failure | Behaviour |
|---|---|
| Source untyped (no `sphereAffinity`) | zero drift, `reason: 'untyped'` — legacy income path preserved |
| Host resolves to no resourced location | zero drift, `reason: 'no-host'` |
| Location grows nothing of the source's Sphere | zero drift, `reason: 'no-matching-goods'` |
| Sanctity already at the ceiling | zero drift, `reason: 'ceiling'`; polarity still reported honestly |
| Resource with no derived `stockTier` yet | read as `adequate` (same convention as the Livelihood line) |
| Non-finite sanctity on the bag | treated as 0; the tier derivation already resolves it to `dormant` |
| Source typed to a Foundation sphere | no resource class carries one → `no-matching-goods`, prose falls back |

Every miss is a zero-drift result carrying a `reason`, so the caller never branches on shape and the
debug surface can distinguish *drawing nothing* from *drawing zero*.

## NFP compliance

| NFP | Verdict | Note |
|---|---|---|
| 1 Tunability | PASS | 3 named constants + the prose table; the coupling's feel and its voice are both data |
| 2 Inspectability | PASS | aggregate trace counters; per-source `sustenance` on the debug bridge with a `reason` for every inert case; debug-tab line |
| 3 Determinism | PASS | pure arithmetic over graph state, no PRNG |
| 4 Fail-soft | PASS | table above; every path returns a neutral result rather than throwing |
| 5 Narrative over mechanical | PASS | the player-facing surface is one sentence of prose; no tier named, no number shown |
| 6 Additive | PASS | no type removals; untyped-source contract pins legacy income unchanged |
| 7 Performance budget | PASS | rides the existing controlled-source walk; reads pre-derived tiers, recomputes nothing |

## Verification

`src/engine/__tests__/essenceEconomyBridge.test.ts` — 22 tests. Four are marked CONTRACT: untyped
sources never drift; the land alone can never flower a source (500 ticks, still `dormant`); a
starving land drains to exactly zero; a migrated untyped place of power is untouched over 100 ticks
on a doubly-surplus location.

## Rulebook impact

None. No new verb, cost, or prerequisite — the *world's response* to state the player already
controls deepens. The five economic verbs' `[IMPL]` rows from the 2026-07-22 slice stand unchanged.
