> **Brainstorm companion** to `Docs/plans/2026-11-03-thr-2136-the-answer-comes-here.md` (THR-2136). Design lane, 2026-11-03 run a.

# The answer comes here — brainstorm

## The reading that changed the question

The ticket's recommended direction was "flip the constant, turn on the existing card". Reading the card showed why that cannot work on its own: the THR-1812 answering card *is* the veil, and the veil holds the clock. On a running clock it would stop the world and then ask the player to press *Let the world turn* to restart it. That is a forced pause in all but name, which rulebook §3 (2026-09-27) rules out. So the fix is a card that stays on the Stage **without** holding time.

## Options considered

1. **Flip `CHAPTER_ANSWER_CARD_ON_RUNNING_CLOCK` only.** Rejected: pauses a running world; one extra click per step.
2. **A result toast on the map after the close.** Rejected: the testers read the snap to the map itself as failure, so a toast lands too late. It is also a second chrome for one story (Law 37).
3. **Keep the old close, make the next beat open faster** (drop the quiet window for chapter beats). Rejected as the whole fix: there is still a 1–8 s blank map between steps, and the THR-2053 quiet window exists for a real click-hijack bug elsewhere.
4. **Pause on every commit, answer in place, auto-resume.** Rejected: forced resume (rulebook §3).
5. **A live card that stops no time, then the answer in place (chosen).** It uses the registry's existing `stopsTime: false` reading. The answer gets the THR-2052 line it already has, and the Stage never leaves the screen.

## The premonition question

The skimmer's ~20 s Aftermath came from a premonition taking the Stage first. Options: let the premonition go first and show the Aftermath after it (today), or show the chapter's answer first. The player is looking at the chapter and waiting on it, so its answer goes first. The premonition is deferred, never dropped: its queue entry is untouched and it shows when the record ends. This orders arrivals as a queue, which Law 49 already asks for.

## Tension noted

A live card on the Stage dims the map while time runs. That is the same as any step today. If testers find it heavy, the kill criterion lifts the dimming rather than removing the card.
