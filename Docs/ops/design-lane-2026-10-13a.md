---
lane: tb-design-lane
run: 2026-10-13a
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-13 (run a, ~22:15Z on 10-12)

## Needs Christian

Nothing needs you.

## Decided for you

- [God cards carry their progression as data](https://linear.app/threadbare/issue/THR-1811/god-cards-carry-their-progression-as-data-a-tier-how-a-god-gets-each) — **the world now offers your powers.**
  - **About once a day, three powers stir.** A small "Three powers stir" pill waits by the map. It never pops up on its own. Open it and you see three cards with their sphere colours. Take up one, or let them pass. They pass when the day turns.
  - **You pay with essence you have earned**, never your casting pool. Under each card a short phrase says who pays: *"Paid from Spirit"*, *"From Life, at double"* (when that sphere is short, your first sphere can pay double), or *"Beyond you yet"*.
  - **As you grow, the world offers grander works.** Each time your attunement deepens enough, a beat names it (*"Your hand is felt"*, *"Your will is known"*, *"The world braces"*) and hands you that step's key cards for free: your second signature, Bestow and Shift Dominion first, then Anoint and the faction and army threads, then the relic and strong threads.
  - **The old gift beats that gave every god Consecrate, Bestow and Anoint are gone.** Two gods now share well under one of their first five cards (0.38, down from 3.8 today).
  - **The screen says "powers", not "omens".** "Omen" already names the omen tracks, a card and the Omens panel.
  - **It rises each day, not every few days.** Every price was tuned on a 9-tick rhythm, and a day is 12 ticks.
  - **Links:** [plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-13-thr-1811-god-card-progression-and-offerings.md), [why each choice](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-13-thr-1811-god-card-progression-and-offerings-brainstorm.md), [the earlier offer mock](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-08-thr-1770-buy-mock/market-mock.html). Building waits until 22:45 UTC tomorrow.
  - *To veto, say:* **"call them omens"**, **"only every few days"** or **"only offer me cards in my own spheres"** (the last is one switch; measured, it makes two gods share almost nothing).

## Work

- **Claimed** [God cards carry their progression as data](https://linear.app/threadbare/issue/THR-1811/god-cards-carry-their-progression-as-data-a-tier-how-a-god-gets-each) (claim marker `design-lane claim 2026-10-13a`).
  - Why this ticket: the Ready for Dev shelf held 2 non-Deferral items, below the floor of 4. It is plan doc 3 in the closed [Dominion map](https://linear.app/threadbare/issue/THR-1758/wayfinder-map-dominion-how-the-gods-power-grows-across-a-run)'s carve-up. Both blockers are Done ([Dominion core](https://linear.app/threadbare/issue/THR-1748/dominion-core-one-graded-read-of-how-much-a-world-object-is-the-gods) merged 2026-10-12). No input is a lane decision younger than 24 h.
- **Measured.** A subagent surveyed the beat, unlock, earned-essence and UI code. I re-ran the [card tiers](https://linear.app/threadbare/issue/THR-1794/god-card-tiers-and-the-generic-set-a-progression-ladder-for-every-god) model with one extra filter. Offering only in-sphere cards keeps the run the same size (55.0 vs 54.7 cards held at day 90) and cuts shared first-five cards from 0.38 to 0.03. It ships as a switch, off by default, because the open offer was decided with you present.
- **Gates:**
  - Intent judge: **Revise**, then **Allow**. Round 1 caught a false claim of mine: I wrote that the card drawer hides cards outside a god's spheres. It does not; it only counts them. It also caught how often the pill shows, an expiry that did not match its words, and a clash with the Codex's *Within reach*. All fixed.
  - NFP, three-pillar and Vision audits: PASS / PASS / PASS-with-notes. The notes are folded in.
  - `lint:plan-doc` clean; `check:generated-freshness` OK.
- **Filed** [UL-proposal: Offering, Rung and Key card](https://linear.app/threadbare/issue/THR-1838/ul-proposal-offering-rung-and-key-card-how-a-god-takes-up-its-cards).
- **PR:** [docs(plan): 2026-10-13 god card progression and offerings](https://github.com/christianspliid-ui/threadbare/pull/2352), auto-merge armed. Handoff to Ready for Dev after `check:plan-doc-liveness` says LIVE, with `Claimable from: 2026-10-13T22:45:00Z`.

## Escalations

None.
