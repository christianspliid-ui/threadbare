# 2026-10-11 — THR-1580 (slice 11): the full capability profile reads the reach share

**Ticket:** [THR-1580](https://linear.app/threadbare/issue/THR-1580) · **Plan:** `Docs/plans/2026-09-24-thr-1575-forecast-window.md` § Systems design 4 · multi-PR deferral, ticket stays open.

- **The reader (one site).** `domainCapability.computeFullProfile` — the per-reach `{ rawScore, capability, tier, label }` profile. It read the pre-refit curve (midpoint 10, k 0.4), so a raw-16 mortal profiled as tier 10 while `capabilityGrowth` (slice 10) put the same mortal at tier 4 and printed "is now <tier-4 label>".
- **Verdict: reach share**, no constants touched. The profile is a tier/label reader, so it follows the scale tiers already cross on (slices 7, 9, 10). `capability` is now `rawToReachShare(rawScore)`; `tier`/`label` derive from it.
- **No production caller.** The callers are `simulationHarness.sumRawScores` and the `resolution-to-growth` contract test, and both read only `rawScore`, which is unchanged. No live trajectory moves, so no measure script; the new unit test pins raw 16 → share 0.4 → tier 4 (pre-refit read tier 10).
- **Wiki:** the cosmology page notes the re-fit and drops the stale "all 9 domains" remark (the doc comment is fixed); the encounters manual's tunables table still listed the March sigmoid 10 / 0.4 as the live curve and now reads 30 / 0.08.
- **Remaining THR-1580 families:** encounterAwareness (idle-rate check mandatory; mutex with a THR-1757 cap change), then retire `computeCapabilityPreRefit`.
