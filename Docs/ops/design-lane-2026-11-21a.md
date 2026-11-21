---
lane: tb-design-lane
run: 2026-11-21a
promoted: 1
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-21 (run a, ~02:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The Rebuke card says it answers only rival gods](https://linear.app/threadbare/issue/THR-2268/the-rebuke-card-says-it-answers-only-rival-gods-its-words-also-name): the card's own words now name both things it answers.
  - Its hover line becomes: *"Answers a rival god, or the doom, where it just struck a place: the place holds for a few days, and some of what was taken comes back."*
  - The card does not get a separate "the doom fed here" line. The place page, the Doom panel's place list and the feeding alert already say that where you cast.
  - Veto in chat. The build waits until 14:30Z (15:30 local) for that.

## Work

- **Claimed** [the Rebuke card ticket](https://linear.app/threadbare/issue/THR-2268/the-rebuke-card-says-it-answers-only-rival-gods-its-words-also-name) under Step 2 rule 1. The shelf was thin: 2 items in Ready for Dev, both waiting out their veto windows. It is a UI-legibility item, so it is inside the period focus.
  - The briefing held no vetoes. The lane had no claims to resume, and no maps are open.
  - Every agreed plan-doc candidate in Todo already has a design. That includes [a well-played age can be won](https://linear.app/threadbare/issue/THR-2245), which is waiting on its three builds. [Which chapters wait for your cards](https://linear.app/threadbare/issue/THR-2174) is your open question, so it was left alone.
  - The ticket's build step said "find where the card face renders". That left the surface undecided, so it needed a design call before a builder could take it.
- **Measured** on main @ `4118b0c2`:
  - The Rebuke card's words are rival-only. The hand hover prints *"Answers a rival god on the place it just pressed…"* (`actionEffectsProse.ts:135`, read by `handCardFace.ts:40`), and the template description says the same.
  - Since [the Doom feeds at a place](https://linear.app/threadbare/issue/THR-2255) shipped, Rebuke also answers the doom. On that cast it tends the place and pushes the god's sphere back the same way (`rivalRebuke.ts:128`, `:213-260`).
  - No screen shows a card's text for a chosen target. The Inspector's Act row is name chips only (`InspectorParts.tsx:76-112`). Every face that prints a card's line (hand hover, gift reveal, Codex) has no target.
- **Decision recorded** on the ticket, with the options weighed.
  - The description now holds a four-item build spec and Done-when: two rewritten lines, one unused constant deleted, and one unit test.
  - The ticket is retitled and in Ready for Dev, unassigned, with a coordination block (sonnet; parallel-safe with the two items already on the shelf). It is claimable from 2026-11-21T14:30Z.

## Escalations

None.
