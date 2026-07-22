# Flow Web primitive — extraction checkpoint (P4)

**Status:** Decision recorded — **DEFER extraction.**
**Parent plan:** `Docs/plans/2026-07-04-mortal-economy-resource-web.md` §Pattern proposal
**Ticket:** THR-618 (P4) — this document is the checkpoint deliverable named there.
**Date:** 2026-07-22

## The question

The mortal-economy plan proposed a possible load-bearing primitive — *stocks at nodes, flows along edges, coarse tier signals, encounters materializing on anomaly* — to be extracted **when the second consumer (Divine Economy, THR-611) confirms the shape**. P4 is the designated checkpoint: extract now, or not?

## Evidence

Both candidate consumers have now shipped, so the comparison is grep-based fact, not speculation:

| Dimension | Mortal economy (THR-615/616/669/670/617) | Divine economy (THR-611) |
|---|---|---|
| Stocks at nodes | `readResources(props)` bag on locations, quantities per resource id | `essenceSource` property bag on host node (sanctity, kind, tier) |
| Flows along edges | **Yes** — `trades_with` edges carry `CargoManifest {goods, totalValue, carriesStaple}`, decay via `lastTraded` | **No** — essence flows source → ascendant directly; no graph-edge flow, no manifest, no decay window |
| Tier signals | `stockTier` scarce/adequate/surplus from normalized balance | `deriveSourceTier` from sanctity — different inputs, different semantics |
| Anomaly → encounters | Route events + scarcity arcs seed `PendingEncounterSeed`s | Find/build/defend loop is action-driven, not anomaly-materialized |
| Shared code today | — | **Zero.** `essenceSources.ts` imports nothing from `resourceEconomy.ts` and references no `stockTier`/manifest/`trades_with` concept |

## Decision

**Defer.** The second consumer did **not** confirm the shape — it shipped comfortably without it. Of the four limbs of the proposed primitive, Divine Economy uses only "stocks at nodes" and "coarse tiers", and both with different inputs and semantics. The load-bearing limb — flows along edges with manifests and freshness decay — has exactly one consumer (trade). Extracting now would be a single-use abstraction wearing a general name, which the plan itself forbade ("design expansively, implement conservatively") and NFP-style guidance rejects (no abstractions for single-use code).

## Re-open trigger

Extract if and when a **genuine second edge-flow consumer** appears and would otherwise duplicate the manifest/decay/anomaly-seed machinery. The two named candidates:

- **Rumor/information flow** (intelligence system) — would need flows along `knows_about`-style edges with freshness decay: a real structural match.
- **Army supply** (THR-614 follow-up) — supply lines from muster locations to armies in the field: manifests + interdiction events map cleanly onto route events.

Whichever lands first, its design doc must open by comparing against `tradeRoute.ts` + `routeEvents.ts` and either reuse or extract — not green-field a third stocks/flows implementation. (This mirrors the Step 0.6 substrate-existence rule.)

No CLAUDE.md pattern entry is added — that entry was conditional on extraction succeeding.
