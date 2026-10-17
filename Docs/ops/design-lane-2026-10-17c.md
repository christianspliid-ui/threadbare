---
lane: tb-design-lane
run: 2026-10-17c
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-17 (run c, ~13:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

Each line is a call inside the new plan for [the end of the age](https://linear.app/threadbare/issue/THR-1381) ([plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-17-thr-1381-the-end-of-the-age.md)). The rulebook already promised a closing chapter and a World-Soul that remembers; this plan writes them. Each line names the words that veto it.

- [The end of the age](https://linear.app/threadbare/issue/THR-1381): **finishing the Mandate ends the age.** Today only the doom clock ends a run, so a player who completes the Mandate plays on until doom and the ending reads as somber. The rulebook says either clock ends the age. *Veto:* **"let me keep playing after the Mandate"**.
- Same plan: **at the end you watch, you do not act.** One short screen, *The age ends*, plays three beats before the harvest: how the age ended, what became of your First, and what the world will remember. It replaces the popup and the seven silent ticks. *Veto:* **"give me a last turn to act in the Twilight"**.
- Same plan: **each way an age can end has its own opening**: one for each of the seven dooms (*The Breach*, *The Sundering*…) and one for the Mandate, for example "A force from outside the world broke through its walls. The age of Ilmarra ends. From here you watch; you cannot act." *Veto:* **"one ending text is enough"**.
- Same plan: **your First's fate is one line**: became your Aspect, lived to see the end, or died before it. *Veto:* **"say more about the First"**.
- Same plan: **the World-Soul keeps three memories of each age**: how it ended, the sphere the world leaned to most, and your greatest mark (for example "Ilmarra held The Long Barrow above every other place."). They fade over seven ages, and ten are kept. Great wars, betrayals and sacrifices are not remembered yet, because the game keeps no record of them to read. *Veto:* **"remember the wars too"**.
- Same plan: **the next world showing these memories is a later job**, on the *The world remembers* step: [the next world shows what the World-Soul remembers](https://linear.app/threadbare/issue/THR-1971). *Veto:* **"show them in this build"**.

## Work

- **Claimed** [Twilight authorship vs emergence](https://linear.app/threadbare/issue/THR-1381) (`design-lane claim 2026-10-17c`). The build shelf was not thin (21 ready), no wayfinder map is open, and every closed-map carve-up already has its plan. This was the only agreed, unblocked plan-doc ticket left. Its scope came from the 2026-06-23 verdict as narrowed in triage on 14 October: the closing beats and the memory writer. Echo selection was already settled by [the world remembers](https://linear.app/threadbare/issue/THR-1813).
- **Measured before writing:**
  - Only doom expiry starts the Twilight (`orchestrator.ts:2882`); the Mandate's completion writes no phase.
  - The Twilight simulates nothing and shows nothing: seven ticks on a module-level counter (`cycleEnd.ts:66`), which also breaks the one-session-per-cache rule.
  - Nothing writes World-Soul memories (`captureMemory` has no caller; the shipped account carry is marked `TODO(THR-1381)`).
  - The game keeps no run-level record of wars or betrayals.
- **Plan doc:** [the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-17-thr-1381-the-end-of-the-age.md) and its [brainstorm companion](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-17-thr-1381-the-end-of-the-age-brainstorm.md), via [PR #2458](https://github.com/christianspliid-ui/threadbare/pull/2458). The [rulebook](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/rulebook.md) §8 and open question 6 now cite it.
- **Gates:**
  - Intent judge: Revise, then Allow. It asked for a kill-criteria section, a named fallback when the screen fails to open, and an end to the module counter on the fallback path. All three were fixed, and four advisories were applied.
  - Audits: NFP passed with notes, pillar passed, Vision passed with notes.
- **Handoff:** [the end of the age](https://linear.app/threadbare/issue/THR-1381) is in Ready for Dev with its coordination block. The builder holds it until 2026-10-18 13:50 UTC so you have a day to veto.
- **Filed:** [the next world shows what the World-Soul remembers](https://linear.app/threadbare/issue/THR-1971) (Deferral, Todo). It is blocked by [choices widen across runs](https://linear.app/threadbare/issue/THR-1844) and by this build.

## Escalations

None.
