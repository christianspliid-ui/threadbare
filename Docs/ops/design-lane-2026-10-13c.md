---
lane: tb-design-lane
run: 2026-10-13c
promoted: 0
filed: 0
resolved: 1
newFindings: 0
needsChristian: true
---
# Design lane — 2026-10-13 (run c, ~13:20Z)

## Needs Christian

- **One click to unblock the next warm playtest.** [Warm brief v1 tripped its kill criterion](https://linear.app/threadbare/issue/THR-1785/warm-brief-v1-tripped-its-kill-criterion-2-of-3-testers-were-coverage) is decided (below) and its Done-when is met. It is the last open ticket in the *Warm playtest · round 1* milestone, and the playtest lane will not start round 2 while that milestone is open. No lane may mark a non-map ticket Done. *Say:* **"close the warm brief ticket"**. Round 2 can then run from Thursday 15 Oct, when the 7-day spacing ends.

## Decided for you

- [Warm brief v1 tripped its kill criterion](https://linear.app/threadbare/issue/THR-1785/warm-brief-v1-tripped-its-kill-criterion-2-of-3-testers-were-coverage) — **the returning testers get the same instructions next round.**
  - **What happened.** In warm round 1, all six tester sessions set out to find "who holds power here", as the brief asks. None reached a faction, because the Notables and Rivals lists opened nothing.
  - **That dead end is fixed.** [Who holds power is a dead end](https://linear.app/threadbare/issue/THR-1780/who-holds-power-is-a-dead-end-the-notables-badge-counts-active-agendas) shipped on 9 Oct: a ruler's name now opens their sheet, and the sheet's faction line opens the faction's page. The interruptions that kept pulling testers back to The First were cut on 9 Oct too.
  - **So round 2 keeps the old instructions.** Changing the instructions and the game in the same round would hide which change worked. The pass mark stays at 2 of 3 testers.
  - **If 2 of 3 testers still miss the factions,** the next round adds one line: *"you are curious which factions have risen while you were away"*. It names no screen. If that fails too, it is filed as a finding that the mid-game cannot be found from the main screen.
  - **Links:** [the decision](https://linear.app/threadbare/issue/THR-1785/warm-brief-v1-tripped-its-kill-criterion-2-of-3-testers-were-coverage), [round 1 report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/warm-playtest-round-1.md), [the warm playtest plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1744-warm-playtest.md).
  - *To veto, say:* **"give them the factions line now"**.

## Work

- **Why a decision rather than a plan doc.** Ready for Dev holds 3 non-Deferral items, below the floor of 4, but no plan-doc candidate could start:
  - [The world remembers](https://linear.app/threadbare/issue/THR-1813/the-world-remembers-an-account-record-each-run-a-new-world-seeded-with) builds on [God cards carry their progression as data](https://linear.app/threadbare/issue/THR-1811/god-cards-carry-their-progression-as-data-a-tier-how-a-god-gets-each). That decision is still inside its 24 h veto window, until about 22:15 UTC today.
  - [Places founded during play take no culture](https://linear.app/threadbare/issue/THR-1839/places-founded-during-play-take-no-culture-a-hamlet-founded-at-tick) builds on this morning's [Two in five mortals belong to no people](https://linear.app/threadbare/issue/THR-1793/216-of-509-seed-42-mortals-have-no-culture-edge-so-their-sphere-bag-is), also still inside its veto window.
  - [No non-human cast primitive](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor) waits, as recorded on 21 Sep, for a second hunt encounter. `src/data` still holds exactly one (`encounter.hunt.the_beast_in_the_granary`).
  - The warm-brief ticket asks the design lane for a decision, and it holds up warm round 2. I took it ahead of the four open tickets on [The Map Is the Table](https://linear.app/threadbare/issue/THR-1823/wayfinder-map-the-map-is-the-table-a-map-first-game-screen-for-1440p).
- **Claimed** with marker `design-lane claim 2026-10-13c`, assignment verified, then released: Todo, unassigned.
- **Measured on `origin/main`:**
  - `FactionSheet.tsx` is the only component that renders the faction coverage markers ("Network Graph", "Current Agenda", "Ascendant Actions").
  - `OverviewTab.tsx:207-243` links a mortal's faction line to that sheet, and `HeldByLine.tsx:73-83` links a place's holder to it.
  - The warm brief already says *"who holds power here"*.
  - Every other ticket in the round-1 milestone is Done.
- **No vetoes** in the briefing's *From Christian* section. Nothing to resume.

## Escalations

- **The playtest gate and a decision-only ticket can deadlock.** The warm playtest lane waits for every ticket in the last round's milestone to close. A ticket whose Done-when is "decision recorded" can only be closed by Christian or an attended session, so warm round 2 waits on a human click. This is the known [no-closer pattern](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/process.md), surfaced above as one ask. No ticket was filed for it.
