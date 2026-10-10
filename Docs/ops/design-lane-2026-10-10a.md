---
lane: tb-design-lane
run: 2026-10-10a
promoted: 0
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-10 (run a, ~11:50Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Dominion of the secondary actors](https://linear.app/threadbare/issue/THR-1764/dominion-of-the-secondary-actors-how-a-faction-an-army-a-company-or-an) — how factions, armies, companies and relics belong to your god, and what your powers do for them.
  - **Each reads the people or ground it is made of.** A faction reads its people, an army reads its faction, a company reads its members, and a relic reads whoever carries it.
  - **Gifts make carriers.** A mortal you **bestow** a gift on spreads your spheres where they stand a step faster than their thread alone would.
  - **Anointing defends.** A faction you **anoint** keeps its towns on your ground tended for you, so they don't fade and they shrug off one rival raid. It doesn't grow your turf.
  - **Wars stay witnessed.** Your faithful armies don't fight better on your land by themselves. Your hand in a war is still the spotlight moment, and that moment is already cheaper and surer when it's your own army.

  *To veto, say:* **"my faithful should win on my land"**, **"a relic should hold ground on its own"** or **"anointing should spread my turf, not just defend it"**.

## Work

- **Claimed and resolved** [Dominion of the secondary actors](https://linear.app/threadbare/issue/THR-1764/dominion-of-the-secondary-actors-how-a-faction-an-army-a-company-or-an) on the [Dominion map](https://linear.app/threadbare/issue/THR-1758/wayfinder-map-dominion-how-the-gods-power-grows-across-a-run). Why this ticket:
  - It was next in the map's suggested order, and its only blocker (the formula) is done.
  - The ready queue held 7 jobs, above the floor of 4.
  - No vetoes were waiting in the briefing.
- **Evidence** (three seeded worlds, at the start and 240 ticks in):
  - No artifact in any world carries sphere scores (0 of 185–709).
  - Armies have no individual soldiers, only a headcount.
  - The engine's faction read is blank at the start. Later it rounds a mean of 1s and 2s down to nearly nothing.
  - Reading a faction by the towns it holds would make factions Sovereign with no player at all. It was rejected because it counts the ground twice.
  - Holding factions hold 1.6–2.6 towns each, so an anointing defends a town or three.
  - The war system has no sphere input. Canon says you witness wars and do not command them.
- **Outputs:**
  - Write-up: [secondary-actor dominion prototype](https://github.com/christianspliid-ui/threadbare/blob/docs/plan-thr-1764-secondary-actors/Docs/audits/2026-10-10-thr-1764-secondary-actors-dominion-prototype.md) ([PR #2297](https://github.com/christianspliid-ui/threadbare/pull/2297), auto-merge armed, docs gates green locally).
  - Census on [proto/thr-1764-secondary-actors](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1764-secondary-actors), never merged.
- **Map graduated:**
  - Added the decision line to the map's decisions.
  - Replaced the open "secondary actors" fog line with the one question this ticket sent there: whether a relic can hold ground on its own (it would need sphere scores on artifacts).
  - No new tickets. Every rule and constant lands in the [Dominion core plan doc](https://linear.app/threadbare/issue/THR-1748/dominion-core-one-graded-read-of-how-much-a-world-object-is-the-gods), which also owes the two faction-read fixes and the combined economy run.
- **Map status:** four tickets remain open:
  - [How the god's own power grows](https://linear.app/threadbare/issue/THR-1765)
  - [the screen mock](https://linear.app/threadbare/issue/THR-1766)
  - [God-card tiers and the generic set](https://linear.app/threadbare/issue/THR-1794)
  - [cross-run growth](https://linear.app/threadbare/issue/THR-1773), which is blocked by the card tiers

## Escalations

None.
