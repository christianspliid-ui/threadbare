---
lane: tb-design-lane
run: 2026-11-07b
promoted: 0
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-07 (run b, ~05:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [UL-proposal: "Reach" never names the god's hold on a place, and the player-facing Hook](https://linear.app/threadbare/issue/THR-2181) — **the game's glossary now keeps two pairs of words apart.** "Reach" is only ever what a mortal does (Iron, Heart, Eye and the rest). The god's hold on a place, person or faction is always called **Dominion**, and anything that explains it says the word. **Hooks** is now the player's word for the marks, clues and vows that tie the god to something unfinished, the row on the god rail. The writers' term for content that reacts to a trait keeps its full name, "Trait Hook", so the two never share a word. Nothing on screen changes; this keeps later text from bringing back the mix-up a warm round-3 tester hit. Say "veto Reach and Hook glossary" to reverse it.

## Work

- **Claimed** [the Reach and Hook glossary proposal](https://linear.app/threadbare/issue/THR-2181). The build shelf has one ticket, on hold until 15:36 UTC, so a plan doc would have come first, but none was workable. Every warm-round-3 UI finding already has its decision and its build shipped or queued: [the mid-game words](https://linear.app/threadbare/issue/THR-2175), ["Fated" fails](https://linear.app/threadbare/issue/THR-2171), [rivals](https://linear.app/threadbare/issue/THR-2172), [while you were away](https://linear.app/threadbare/issue/THR-2173), [which chapters wait](https://linear.app/threadbare/issue/THR-2174) and ["See the work"](https://linear.app/threadbare/issue/THR-1859). Slice 2 of the chapter-hand plan already shipped ([PR #2776](https://github.com/christianspliid-ui/threadbare/pull/2776)). [Away leans](https://linear.app/threadbare/issue/THR-2189) and [the Crossroads words](https://linear.app/threadbare/issue/THR-2190) build on this morning's lean decision, which is still inside its veto window. No wayfinder map is open. This proposal was agreed (the lane decided it on 5 Nov, past its window), it is UI-words focus work, and it was the last open blocker on [the mid-game words](https://linear.app/threadbare/issue/THR-2175).
- **Measured before seating** (main @ `2b3bebee`): the Dominion caption is labelled "Dominion" since [the rail rows build](https://linear.app/threadbare/issue/THR-2183). The Hooks row counts conditions + clues + vows (`countHooks`), matching its hover. The old glossary listed bare "Hook" as another name for Trait Hook, a real collision, so that alias is now retired. Also noted in the entry: the Hooks row's "clue" is a kind of trait, not a Lead.
- **Landed** [PR #2778](https://github.com/christianspliid-ui/threadbare/pull/2778) (docs only, merged). Entries: [Cosmology § Reach](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/ubiquitous-language/Cosmology.md#reach), [Traits § Hook](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/ubiquitous-language/Traits.md#hook), [Traits § Trait Hook](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/ubiquitous-language/Traits.md#trait-hook), plus the glossary index and the regenerated glossary dashboard. `gate --final` PASS.
- **Closed** the proposal under the design-request carve-out, with the Done-when quoted and the outputs linked. Verified Done.

## Escalations

None.
