---
lane: tb-design-lane
run: 2026-10-14a
promoted: 1
filed: 3
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-14 (run a, ~22:20Z on 13 Oct)

## Needs Christian

Nothing needs you.

## Decided for you

- [The world remembers](https://linear.app/threadbare/issue/THR-1813/the-world-remembers-an-account-record-each-run-a-new-world-seeded-with) — **each age now ends by waking a new world that carries what your god left behind.** You ruled on 11 Oct: the god never grows stronger between runs; the world remembers, and the choices widen. This is the plan that builds it.
  - **A new world each run.** *Begin Next Cycle* becomes *Wake in a new world*. The game remembers your past ages on this device (a cleared browser starts over), and the next map is new.
  - **A past god's monument is sized to the god who wakes next.** If your new god shares its spheres, the monument wakes as ground already yours (Held while the memory is still warm, Touched while it is fading), and it fades if you leave it untended. If your new god is opposed, it stands against you until you break it with Shift Dominion. I measured that one fixed mark cannot do both: it either hands a kin god a place it fully owns or leaves an opposed god unbothered. So the mark grows until the new god reads it the way the plan promises.
  - **Monuments stand on ordinary ground.** The place that best fits the old god is already fully the new kin god's, so a monument there would change nothing.
  - **Lines and relics.** A mortal the old god raised lives on as a notable descendant ("of the line of Maren Ashfold"). A relic lies unclaimed somewhere until someone takes it up.
  - **You choose which hunger wakes, at the start of the next Remembrance.** Two stir and the old god's echoes favour one. That is where the mock put the choice, and you meet that god a step later.
  - **Built in three steps.** First the memory and the new world; then the echoes in it; then the widening choices and the *The world remembers* screen. The last step waits until the god-card offering is built.
  - **Links:** [plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-14-thr-1813-the-world-remembers.md), [why each choice](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-14-thr-1813-the-world-remembers-brainstorm.md), [the mock you saw](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-11-thr-1773-remembrance-mock/remembrance-mock.html).
  - Building waits until 22:45 UTC on Wednesday 14 Oct.
  - *To veto, say:* **"monuments should mark the world the same way whoever wakes"**, **"opposed monuments should fade like the others"**, or **"let me choose the hunger at the harvest"**.

## Work

- **Why a plan doc.** Ready for Dev held 2 non-Deferral items, below the floor of 4. This was the oldest workable candidate. Its last lane input, the [god-card offering plan](https://linear.app/threadbare/issue/THR-1811/god-cards-carry-their-progression-as-data-a-tier-how-a-god-gets-each), left its 24 h veto window at about 22:15 UTC, and no veto came. Skipped: [Places founded during play take no culture](https://linear.app/threadbare/issue/THR-1839/places-founded-during-play-take-no-culture-a-hamlet-founded-at-tick) (its input is still inside its window until about 03:45 UTC). No vetoes in the briefing; nothing to resume.
- **Claimed** with marker `design-lane claim 2026-10-14a`, assignment verified.
- **Measured** on `main` @ `98ce7128`:
  - A survey subagent and hand checks found no save or account code at all, and found that `executeCycleTransition`, `collectInjections` and the harvest's divine echo slots are never called or filled.
  - The World-Soul's sphere weights are overwritten every tick, so the tilt rides the cosmology profile instead.
  - A scratch script on seeds 42 / 99 / 7 seeded a monument into real worlds. With one fixed mark, a kin god reached Held at +2 but an opposed god was still Foreign 98–99% of the time; at +3, kin gods went Sovereign 51–71%. Sizing the mark to the god worked in every case: kin Held within +3, opposed Hostile within +6 in 8 of 9 cases.
- **Gates:**
  - Intent judge: **Revise**, then **Revise**, then **Allow**. Rounds 1 and 2 asked for the exact words the player reads: tooltips, empty lists, and a line when the memory cannot be saved. Round 3 caught that the save-failure line could never show, because the save ran after the button. It now saves when the harvest screen opens.
  - NFP, three-pillar and Vision audits: all **pass with notes**, and the notes are folded in.
  - `npm run gate -- --final` PASS.
- **PR:** [docs(plan): 2026-10-14 the world remembers](https://github.com/christianspliid-ui/threadbare/pull/2360), auto-merge armed.
- **Handed off:** [The world remembers](https://linear.app/threadbare/issue/THR-1813/the-world-remembers-an-account-record-each-run-a-new-world-seeded-with) (slice 1) to Ready for Dev, with the coordination block and `Claimable from: 2026-10-14T22:45:00Z`.
- **Filed:**
  - [Echoes stand in the new world](https://linear.app/threadbare/issue/THR-1843/echoes-stand-in-the-new-world-a-past-gods-monument-line-and-relic) (slice 2, blocked by slice 1).
  - [Choices widen across runs](https://linear.app/threadbare/issue/THR-1844/choices-widen-across-runs-four-hungers-on-run-1-one-woken-each-age) (slice 3, blocked by slice 1 and the god-card offering).
  - [UL-proposal: Run, Echo, Memory word and the account record](https://linear.app/threadbare/issue/THR-1845/ul-proposal-run-echo-memory-word-and-the-account-record-what-carries).

## Escalations

None.
