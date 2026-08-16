---
lane: daily-backlog-grooming
run: 2026-08-16
promoted: 0
filed: 1
resolved: 1
swept: 5
canceled: 4
newFindings: 1
needsChristian: true
---
# Backlog Grooming — 2026-08-16

## Needs Christian

1. **Sample 2 of the 6 retrofitted encounters and give a verdict.** Batch 1 of the encounter retrofit shipped overnight — the six slice encounters now carry the full contract. Your sample verdict is what batch 2 (the camp seven) gets written against, so the next nine are waiting on it. → [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) · shipped as [PR #1494](https://github.com/christianspliid-ui/threadbare/pull/1494)
2. **One attended dev-server session clears four owed screenshot checks** (~30 min, one `npm run dev`, four URLs). Four UI changes shipped with test-level proof but no picture; the hourly lane cannot take screenshots. → [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-four-owed-19201080-captures-one-dev-server)
3. Nothing else. One item left your queue this run — THR-1129 was already finished and is now closed.

## Work in flight

- [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) — 6 of ~15 encounters retrofitted (shipped under sibling id THR-1131, +gate fix THR-1132). Camp seven + sequels remain. Parked correctly on the item above, not stalled.

## Technical gates resolved this run

- **THR-1129 → Done.** Verified-shipped park: scope landed 2026-08-09 under sibling id THR-883. Re-verified independently — `2ea391a2` and `dc39d921` are both ancestors of `origin/main`, spec file present, PR #1489 `MERGED` and naming no issue id. No merge can ever carry `Fixes THR-1129`, so the auto-close could never fire and it would have sat `In Dev` forever. The park cited *"THR-846: no CC lane may write Done"*; THR-846 says no such thing — it is about *where* to park. Reasoning recorded on the issue.
- **THR-1130's stale ask corrected.** Its top comment still asked for a brief approval + art ruling Christian answered overnight; a comment now names the settled answers and the one live ask, so the hourly briefing does not re-ask them.

## Counts by state

Idea 82 · Todo 10 · In Design 1 · Implementation Planning 0 · Ready for Dev 1 · In Dev 1 (was: RfD 4, In Dev 2).

## Problems found and fixed

- **The ready queue held only work the executor structurally cannot claim** — all 4 items were attended-only screenshot passes, and `keep-work-flowing-cc` judges queue health on *count*, so 4 unclaimable items reported `healthy` while the lane starved. Measured at impediments #611 (3 consecutive byte-identical hourly runs, ~4 min each) and #604 (6 occurrences). Consolidated to one ticket, so the count now reads what is true.
- No orphan issues (every issue carries a project). No completed-but-open projects — every active project has open work. No `Now` project off High priority. No design work stale past 7 days (In Design holds only THR-790, updated 08-15). No prioritization inversion: the queue's sole item is a deferral in an active project, which is rule 1.

## Materiality sweep

Swept 5 in-scope tickets. **Canceled 4** — THR-1109, THR-1125, THR-1126, THR-1127 — all on question 4 (≥3 tickets, one predicate: *a shipped UI change whose 1920×1080 capture was routed to a deferral because `preview_start` is refused unattended*). Consolidated into [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-four-owed-19201080-captures-one-dev-server), which carries all four passes, their parents (THR-1096/1121/1123/1118), URLs and Done-whens; each cancel comment points at it. **No capture was waived** — this is a merge, not a prune. THR-1114 (`sphereAffinity` outside the twelve Spheres) **stands**: labelled `Improvement` but it is product content on a player-visible surface, and § 2.5 puts product work out of scope for cancellation. **Doubt recorded:** collapsing four tickets into one loses per-parent Linear traceability; mitigated by naming every parent and canceled id inside THR-1133, but if the sweep is ever discharged partially, the remainder must be re-expanded rather than closed whole.

## Pipeline status

**Claimable shelf: empty.** THR-1133 is the only Ready-for-Dev item and it is attended-only, so the unattended lane still has nothing — that is now honestly reported rather than masked by a count of 4. This is a supply problem, not a tidying one: the fix is upstream, and upstream is item 1 above. Closest to Ready for Dev: batch 2 of the encounter retrofit under THR-1130, which needs only the sample verdict, then an agent-drafted brief. Recommended next pickup once unblocked: THR-1130 batch 2 (camp seven).
