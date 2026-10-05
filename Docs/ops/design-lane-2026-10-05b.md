---
lane: tb-design-lane
run: 2026-10-05b
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-05 (run b, ~06:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [A lead that reaches "knows where it lies" on a wonder can never become a delve](https://linear.app/threadbare/issue/THR-1702/a-lead-that-reaches-located-on-a-wonder-can-never-become-a-delve-and): **once a mortal has found a wonder (or a plain ruin no delve can enter), the search is over.** The place goes on their sheet as **"found it"**, and they stop walking back to survey it again. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1702-found-leads-end-the-climb.md).
  - **What was wrong:** at a ruin, a found lead leads to a delve. At a wonder nothing comes next, so the mortal kept going back. On one test world a seeker returned to a glowing hollow they had already found **9 times** in a season. That was one survey in six on that world. Their lead never faded.
  - **Wider than the ticket said:** plain ruins with no way down (toppled towers, shipwrecks, burned-out towns from before the game) have the same dead end, 6–11 of them per world. The fix covers them too.
  - **One line made honest:** the visit's "knows where it lies" chip stops adding *"and can go down into it"*, which was false at those places.
  - **Not decided:** finding a wonder gives no reward. What a wonder is *for* is your call if you ever want one, and this fix leaves room for it.
  - *The calls to veto:*
    - Say **"drop wonders from the visit"** if you'd rather mortals never visit wonders at all (it measured as moving the loop, not ending it).
    - Say **"finding a wonder should give something"** to open that question.

  Say "veto found it" to reverse it. It can be built from about 08:45 Tuesday your time.

## Work

- **Chosen:**
  - The build shelf had 4 jobs that are not deferrals (floor 4), so it was not thin.
  - No wayfinder map is open.
  - Of the agreed tickets still undesigned, this bug was the one with no younger lane decision underneath it. [Threading as character creation](https://linear.app/threadbare/issue/THR-1644/threading-as-character-creation-every-thread-plays-a-ceremony-the) is larger and may want a map, which is yours to chart.
  - [Encounter summaries read like prompts](https://linear.app/threadbare/issue/THR-1739/encounter-summaries-read-like-authoring-prompts-rewrite-designer-voice) is already build-ready; it waits on [stakes everywhere](https://linear.app/threadbare/issue/THR-1728/author-stakes-for-every-encounter-template-and-make-the-stakes-line).
- **Measured** (main `3dc2947b`): a new census, [`lead-dead-ends.ts`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/readers/lead-dead-ends.ts), ran on seeds 42 · 99 · 4 · 8, medium, 300 ticks.
  - Each world has 14–24 sites the visit admits but no delve can enter.
  - 2 of 66 visits went to one.
  - Seed 99: one wonder lead was found, then re-surveyed 9 times, with 9 visits refused. The lead was still live at t300.
  - Delves: 3 · 3 · 0 · 2.
- **Gates:**
  - Intent judge: round 1 **Revise**. It wanted a blast-radius note for the trace types file (114 importers), the glossary updated for "found it", and the inventory names fixed. All three were fixed, and round 2 was **Allow**.
  - Auditors: NFP PASS-with-notes, pillars PASS, Vision PASS.
- **Shipped:**
  - [PR #2237](https://github.com/christianspliid-ui/threadbare/pull/2237) merged; plan-doc liveness `LIVE`.
  - The ticket moved to Ready for Dev, unassigned, with `Claimable from: 2026-10-06T06:45:00Z` in the description.
  - The decision record and the handoff comment (with the coordination block) are posted.
- **Friction:**
  - My first push used a branch named after the ticket. I renamed it to an id-free branch before opening the PR, so nothing can auto-close the ticket.

## Escalations

None.
