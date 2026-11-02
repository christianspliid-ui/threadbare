---
lane: tb-design-lane
run: 2026-11-02d
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-02 (run d, ~11:18Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Legibility 1 — the shared blocks](https://linear.app/threadbare/issue/THR-2122/plan-doc-legibility-1-the-shared-blocks-the-type-ladder-and-the) ([plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-02-thr-2122-legibility-shared-blocks.md)): every Inspector section gets the agreed spacing and type sizes in one place. Sections sit further apart, body text and chips grow to the readable floor, and lines stop at about 70 characters. Veto line: "keep the old spacing".
- Same plan: a block of facts (the person page's "Allegiance", "Reputation" and the like) becomes two columns, with each label right-aligned and pressed against its answer. Today the answer sits at the far edge of the panel. Veto line: "keep the answers on the right edge".
- Same plan: in a personality bar, the first word ("Craven" in Craven ↔ Brave) sits in the label column, so the whole block keeps one line down the middle. Veto line: "give the bars their own row".
- Same plan: the thin gold lines between fact rows go, and so do the gold section headings on the faction description, place prose and "Who they are". The page's one gold line stays the highlighted "what matters now" line. Veto line: "keep the gold headings".
- Same plan: counts read "Rival gods · 2" and "Your cards · 2", beside the words, the way "Allies · 3" already reads. Today they read "Rival gods (2)", and the hand's count sits at the far right of the rail. Veto line: "keep the brackets".
- Same plan: a story-event section only gets a box while clicking it opens something. Veto line: "box every story event".

## Work

- **Claimed** [Legibility 1](https://linear.app/threadbare/issue/THR-2122/plan-doc-legibility-1-the-shared-blocks-the-type-ladder-and-the) at 11:25:51Z, the moment its last input decision ([Modules and composition](https://linear.app/threadbare/issue/THR-2120/modules-and-composition-the-small-set-of-blocks-every-panel-is-built)) cleared its 12-hour veto window. It is this period's UI focus work.
- **Measured** on `main` @ `fd15490d`: the shared section file has 48 px literals and no spacing tokens, seven text sizes below the 16 px floor, a facts row built with `space-between`, three separate section-heading spellings, and three gold-heading sites. No test pins any of these styles.
- **Plan merged:** [PR #2708](https://github.com/christianspliid-ui/threadbare/pull/2708). Intent judge: Allow on the third run. Run 1 asked for a count form that reads as a count, plus a second kill criterion. Run 2 asked what a count of 0 or 1 reads. Both were fixed in the plan. NFP and Vision auditors: PASS-with-notes; three-pillar auditor: PASS. Each note is answered in the plan's tail.
- **Handed off** to Ready for Dev. It is held until 23:50Z, when this run's veto window closes. [Legibility 2](https://linear.app/threadbare/issue/THR-2123), [3](https://linear.app/threadbare/issue/THR-2124) and [4](https://linear.app/threadbare/issue/THR-2125) wait on it.
- **Next:** Legibility 2–4 can be planned once this plan's own decisions clear their window (about 23:50Z). They build on its block set.

## Escalations

None.
