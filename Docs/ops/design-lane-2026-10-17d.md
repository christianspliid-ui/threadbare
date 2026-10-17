---
lane: tb-design-lane
run: 2026-10-17d
promoted: 1
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-17 (run d, ~19:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The god's stake in the economy](https://linear.app/threadbare/issue/THR-1935/plan-doc-the-gods-stake-in-the-economy-hungry-towns-on-your-ground): **your god hears one prayer at a time, a season apart.** When several hungry towns on your ground could pray on the same day, the hungriest is heard first, and the others wait their turn. In the builder's test, one world produced 19 prayers in 90 days, which buries the player. This change caps it at 12 in 90 days, one each season. ([the ruling](https://linear.app/threadbare/issue/THR-1935/plan-doc-the-gods-stake-in-the-economy-hungry-towns-on-your-ground) · [plan change](https://github.com/christianspliid-ui/threadbare/pull/2464)) *Veto:* **"let every hungry town pray at once"**.
- Same ruling: **a world with no hungry town on your ground hears no prayers**, and that counts as correct, not broken. *Veto:* **"there should always be someone praying"**.

## Work

- **Claimed** [the god's stake in the economy](https://linear.app/threadbare/issue/THR-1935/plan-doc-the-gods-stake-in-the-economy-hungry-towns-on-your-ground). The builder had held its faith build in [draft PR #2463](https://github.com/christianspliid-ui/threadbare/pull/2463) after the plan's own census hit the flood line (seed 99: 19 prayers, line 12; seed 7: 0). The checkpoint asked the design lane to rule on the fix.
- **Ruled** on both items, as the decision comment on the ticket. Item 1, prayer pacing, is taken as the builder proposed (`PRAYER_MAX_OPEN` 1, `PRAYER_GOD_GAP_DAYS` 7.5), with one addition: hungriest first, ties to the lower id, no seeded draw. Without that, the builder's id-order town loop would always favour low ids. Item 2: seed 7's zero is a harness limit, accepted only when the census shows no town ever passed the gate. Measured against the held branch: `dailyTown` loops towns in id order (`src/engine/prayers.ts:476-490` on `claude/thr-1935-prayers-and-the-faithful`).
- **Amended the plan doc** in [PR #2464](https://github.com/christianspliid-ui/threadbare/pull/2464): Engine § 1, two constants, both kill criteria (the "raise to Held" remedy is marked as measured-ineffective), and Done-when (a one-at-a-time unit test). Docs gates: `lint:plan-doc` passed, `check:impediment-ids` OK, `check:generated-freshness` OK. Auto-merge is armed.
- **Handed back** to Ready for Dev, unassigned, with a coordination block, so the builder resumes the draft. By its estimate, about 30 minutes plus the census re-run remain.

## Escalations

None.
