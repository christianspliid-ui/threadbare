---
lane: tb-design-lane
run: 2026-11-15a
promoted: 0
filed: 1
resolved: 2
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-15 (run a, ~02:18Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Rival gods are a threat you can see but never answer](https://linear.app/threadbare/issue/THR-2172/rival-gods-are-a-threat-you-can-see-but-never-answer-every-rival): **the answer to a rival now shows up where the threat is.**
  - **What went wrong:** in warm round 4, no tester did anything about a rival. Rebuke, the card made for that, was never found.
  - **What is really happening:** rivals land often, and a place is open to Rebuke most of the time. The gift that hands you Rebuke says "go to the place it pressed", but never says which place. Its only button is "Receive". The rival panel's "How to answer it" line talks only about tending, even when you hold Rebuke. The pressed place's own page doesn't mention the rival at all.
  - **The fix:**
    - The rival panel reads "Rebuke it at Greycity, or tend your places", with Greycity as a link.
    - The pressed place's page opens with "The Hollow Warden pressed it yesterday", and Rebuke is its first card.
    - The gift names the rival and the place. Its button reads "Go to Greycity" and takes you there.
    - The "While you were away" recap says which rival pressed a place that slipped.
  - **Kept as it is:** the rules. No new stop, card or number.
  - Built in [The answer to a rival is where the threat is](https://linear.app/threadbare/issue/THR-2237/the-answer-to-a-rival-is-where-the-threat-is-the-rival-panel-says).
  - **Veto:** say "rivals should be answered from the rival panel" if you want a Rebuke button there instead. The build is held for your veto until 15:20 UTC today.

## Work

- **Claimed** [Rival gods are a threat you can see but never answer](https://linear.app/threadbare/issue/THR-2172) with the marker `design-lane claim dl-20261115T0218Z`.
  - Why this one: the build shelf holds 7, so it is not thin. Every wayfinder map is closed. The two open UI-project tickets are your icon picks.
  - Warm round 4 marked this finding *not met*. Its earlier decision named "Rebuke not found" as the trigger for the next slice. The last run (2026-11-14f) set it aside for a run with a measurement first.
- **Measured** on main @ `b7ab4c12` with a census on [`proto/thr-2172-rebuke-census`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2172-rebuke-census) (never merged). Seed 42, seeded First, beats taken as a player would:
  - First landing at t37. 33 pressed places by t200. A place is open to Rebuke on 344 of 400 ticks.
  - The gift fires at t147, two ticks after "A Path Opens".
  - 96 of 123 landings hit places under fog. That confirms the skimmer's "places I never saw on my map". Fog stays as it is: the toast click already opens the place.
  - The census took three tries. The first read the wrong event list, and the second never answered "A Path Opens", so no later gift could fire. Both were census bugs, not game bugs.
- **Filed** [The answer to a rival is where the threat is](https://linear.app/threadbare/issue/THR-2237):
  - Ready for Dev, unassigned, in the *Warm playtest · round 3* milestone.
  - `Claimable from: 2026-11-15T15:20:00Z` is in its description.
  - Its coordination block is the latest comment: parallel-safe with the shelf. A conditional mutex with [One mark, one meaning on the Stage](https://linear.app/threadbare/issue/THR-2231) only if that build touches the Act row's card order.
  - No plan doc: it is four view-and-copy changes on systems that already exist, so the ticket body is the plan.
- **Decision record** posted on the finding. Released to Todo, unassigned, blocked by the build.
- **Closed** [Coming back has no "while you were away"](https://linear.app/threadbare/issue/THR-2173) under the design-request carve-out:
  - Its build ([While you were away](https://linear.app/threadbare/issue/THR-2184)) is Done.
  - Warm round 4 met its Fixed-when: "a great 'While you were away' summary", and a 148 s warm-up.
  - The skimmer's ask for rival news in the recap is part 4 of the new build.

## Escalations

None.
