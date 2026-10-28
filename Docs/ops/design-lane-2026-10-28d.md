---
lane: tb-design-lane
run: 2026-10-28d
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-28 (run d, ~14:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Hex cards' sphere pressure goes nowhere](https://linear.app/threadbare/issue/THR-2087/hex-cards-sphere-pressure-goes-nowhere-a-push-onto-a-hex-col-row) — **a hex card now grows the sphere of the place it falls on.** Today a god who casts Seed Life, Bestow Vision or any of 29 hex cards with a sphere pays essence and grows no sphere anywhere. After this, the cast lands on the place that hex holds, at the same strength as a card cast on a town. On an empty hex it lands on the nearest place within two hexes (that reaches 99% of land on the test world). The four energy-priced "flows" cards (Attune Leyline, Amplify Flow, Anchor the Sphere, Channel the Current) now grow energy too. *Veto:* "a hex card should touch every place on its hex", or "a cast in empty wilds should grow nothing". Plan: [A hex card grows the sphere of the place it falls on](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-28-thr-2087-hex-sphere-pressure.md).

## Work

- **Claimed** [THR-2087](https://linear.app/threadbare/issue/THR-2087/hex-cards-sphere-pressure-goes-nowhere-a-push-onto-a-hex-col-row) (bug, agreed work). Shelf was thin: 2 non-Deferral items in Ready for Dev, no wayfinder maps open, no vetoes in the briefing.
- **Measured** on the seeded medium world: 712 land hexes, 235 places on 214 hexes; 30% of land hexes hold a place, 87% are within one hex of one, 99.4% within two. 52 hex cards, 29 with a sphere, 23 ascendant hex cards with none. Census on [`proto/thr-2087-hex-pressure`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2087-hex-pressure) (never merged).
- **Gates:** intent judge **Allow** (1 gap fixed); NFP, three-pillar and Vision audits **PASS-with-notes**; `lint:plan-doc` clean; plan doc merged via [PR #2647](https://github.com/christianspliid-ui/threadbare/pull/2647).
- **Handed off** to Ready for Dev, unassigned, with `Claimable from: 2026-10-29T02:39:00Z` (12 h after this run's own decision, so a veto lands before the build). It builds on no other lane decision. Mutex with [the god-caused Mandate](https://linear.app/threadbare/issue/THR-2081) (same pressure phase) and [Energy cards](https://linear.app/threadbare/issue/THR-2086) (same card tables).

## Escalations

None.
