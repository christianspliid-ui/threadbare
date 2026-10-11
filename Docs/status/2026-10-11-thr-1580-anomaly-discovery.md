# 2026-10-11 — THR-1580 (slice 8): anomaly discovery reads the reach share

**Ticket:** [THR-1580](https://linear.app/threadbare/issue/THR-1580) · **Plan:** `Docs/plans/2026-09-24-thr-1575-forecast-window.md` § Systems design 4 · multi-PR deferral, ticket stays open.

- **The reader.** `encounterScoring.computeAnomalyDiscoveryBonus` — the additive pull on candidates at an undiscovered anomaly place. It is 0 unless Eye ≥ `ANOMALY_EYE_THRESHOLD` (0.15), then `BASE + Eye × EYE_SCALING × 10 + Veil × VEIL_SCALING × 10`. Both reads used the pre-refit curve (midpoint 10, k 0.4).
- **Measured** (`npm run measure:anomaly-scales`, living individuals, medium, seeds 42 · 99 · 7). At tick 0 the gate sits at raw 6 on both the pre-refit curve and the share (dice: raw 8.5), so the drawn set is identical: 19.4 · 6.5 · 6.2%. The pull among the drawn: pre-refit median 0.69 · 1.33 · 1.33 (saturates by raw ~18), share 0.50 · 0.70 · 0.70, max 1.70 on both. At tick 300: drawn 16.6 · 8.2 · 8.1% on both; median pull 0.71 · 0.76 · 0.73 → 0.50 · 0.50 · 0.49.
- **Verdict: reach share**, constants unchanged. A standing gate and a graded pull, not a d100 read. The dice would move the gate to raw 8.5 and cut the drawn set; the share keeps who is drawn and grades how hard. `ANOMALY_EYE_SCALING` stays the lever if the pull should be stronger.
- **Live note:** no anomaly place flipped `discoveredByExploration` by tick 300 on any seed, before or after — the discovery writer (`orchestrator.ts`, on encounter completion while `located_at` the anomaly) did not fire in these runs.
- **Remaining THR-1580 families:** capabilityGrowth, domainCapability profile, encounterAwareness (idle-rate check mandatory; mutex with a THR-1757 cap change), phaseAscendantProgression.
