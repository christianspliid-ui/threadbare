# Brainstorm — yield and leverage (THR-1439)

*Companion to `2026-09-08-thr-1439-yield-and-leverage.md`. What was weighed, in the order it came up, 2026-09-08.*

**Is the rider paid?** Christian's standing rider: wealth visible on the sheet before any yield cell ships. THR-1428 shipped the Means word on the mortal sheet and the faction sheet and the passive trickle in `holdingIncome.ts`. Checked at source, not assumed. Paid.

**What a harvest costs.** Christian's line said "at a cost to the Location's prosperity *or* the holder's standing there". Both, small: prosperity is the well (the pulse and the tithe both read it), standing with the Location is the town's opinion of the one drawing from it — and a `reputation_with` toward a Location is already a Standing object the registry enumerates, so the resentment shows up where `lower × Standing` and the sheet already look. Rejected: standing with the Location's *faction* — the town is the one being taxed.

**A failed harvest still pays.** The bands scale the lump; the costs are flat. A `failure` band is a court held for nothing, a tithe demanded and refused. That is the risk that makes it a work rather than a button, and the chronicle has something to say about it.

**Theft moves the edge; it never copies.** Christian: "the holder loses it, never a copy, or theft is free." `retargetEdgeSource` (THR-1437 found `updateEdge` does not reindex) keeps the id, so every reader by id survives and every reader by source sees the thief. Rejected: a new edge plus `revealed` on the old — a copy by another name.

**The favour class joins the Agreement kind.** The grid says use × Agreement spends a favour and destroy × Agreement forgives it, "both live" — but the Agreement shape today is marks only. THR-1436's `edgeTypes` makes the widening a one-line shape change; the trouble is ownership: an edge object is held by its source, a favour's source is the debtor, and *using* a favour is the creditor's act. THR-1438's per-verb `ownershipOverride` + `eligibility` is exactly the tool, so the Agreement kind reads: seize → the holder's (a mark, never a debt); use → the creditor's for a favour, the holder's for a mark. Rejected: a separate Favour kind — the catalogue has one Agreement kind with two classes, and a kind is not added for a verb's convenience.

**What redeeming a favour buys.** The favour system already has a redemption funnel (`secretsFavorsConsequences.ts:267`, the encounter-side `redeem_favor` op). A mortal's *work* of redeeming needs a product without inventing a service: standing with the debtor's faction (the debtor speaks for you) — one lump, one constant, and the encounter path keeps its own. Rejected: wealth — a favour is not a purse.

**Route volume.** The toll already scales on volume (`holdingIncome.ts:113`), so the merchant's expansion work only has to write the number the toll reads, and restart the decay clock — expansion is activity. Rejected: a new `capacity` property beside `volume`.

**The capability rider** — a completed work grows capability in its Reach — has no writer anywhere on `main`. It binds every cell on the map, not this band, so it is filed as its own small executor ticket at the handoff instead of being smuggled into four cells' completions.
