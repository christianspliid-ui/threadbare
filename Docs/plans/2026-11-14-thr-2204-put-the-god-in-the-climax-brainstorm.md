> **title:** Brainstorm companion — Put the god in the climax (THR-2204)
> **linear_issue:** THR-2204
> **author:** Claude Code (design lane, run dl-20261114-1118)
> **created:** 2026-11-14

# Brainstorm companion — Put the god in the climax

Companion to [the plan](2026-11-14-thr-2204-put-the-god-in-the-climax.md). This file records the options weighed and the tensions behind each decision.

## The shared premise

The ticket set the frame: "the fix is a bigger hand, never a chosen ending" (Laws 10 and 11). Every option was tested on two questions. *Does the player's hand change the odds of something that matters?* *Does the player ever pick the result itself?* An option needs yes to the first and no to the second.

## What the measurement changed

The ticket read the Apotheosis as "at Fated with an empty hand". On three hands-off seeds it came at tick 361. At the threshold (step 0) the forecast was Fated (0.83 to 0.91) with all seven cards playable, because an unspent purse sits at its cap. The step that decides it (step 1, which grants or refuses Aspect) dealt **no cards** and so never stopped the world. Both halves of the ticket's sentence are true, at different steps. Slice 2 therefore does two things: put the hand on the deciding step, and fit the odds so the cards matter there.

## Question 1 — the Ordeal and the visions

1. **Roll the Ordeal, and let choices lean on it (chosen).** The Ordeal enters the one curve (Law 16) and the First's marble bag (Law 4). Prices stay, and they buy odds, not results.
2. **Keep fixed outcomes and show them.** Rejected. A price for "triumph" is a bought band, whether or not it is shown.
3. **Turn the Ordeal into a full encounter with a hand.** Considered seriously. It is the most uniform answer (Law 42), but it duplicates the Apotheosis, which arrives first (t361 against the Ordeal's ~0.70–0.80 Doom), and it needs a template per Ordeal variant. The roll gets the law right with three choices the player already understands.
4. **Scene: tags and openers (chosen)** against **generating vision prose from the scene** (rejected: pure generated prose is a rejected approach) and **filtering to fitting variants only** (rejected: a mortal with an odd activity would get no vision; scoring degrades gracefully).

Tension: the weight line "This decides how {first}'s story ends" is strong. It is true: the Ordeal band opens and closes endings (`types/returnEngine.ts:123-134`). Law 45 is satisfied, and Law 17 asks for it.

## Question 2 — the Apotheosis

1. **Fitted bare forecast plus dealt and earned cards (chosen).**
2. **Raise the authored difficulties.** Rejected. A fixed number gives different doubt to mortals of different reach.
3. **Make earlier refusals remove cards.** Considered. It punishes a player for not playing, which Law 32 leans against ("not about winning"). Earned slots add; nothing subtracts.
4. **A refill of essence at the threshold.** Rejected. It breaks the small purse (Law 36). The premonition gives the player the chance to save instead.

## Question 3 — after the Return

The empty stretch is a fact of today's game. Only the First's journey makes beats, and nothing replaces it. Filling it with new content without a decision behind it would be noise (Law 27: stop only for moments that offer a move). The moves that already exist (Stay the Unmaking, Rebuke, other threads' chapters) are named on the Return. Whether the run should carry a second whole journey is a question about what a run is, so it is reserved with three options built.

## Question 4 — the ending

1. **Two state-backed lines in beat 2 (chosen).** These tell the player what they did at the two big moments, which is the story Law 32 asks a run to leave.
2. **A generated epilogue.** Rejected: pure generated content.
3. **Rank the run ("you were a distant god").** Rejected: Law 32, the game does not rank the player.

## The predicate

Beat-2 text differing between arms is almost guaranteed, because the hands-off arm steps back at the Ordeal. On its own it would show only that the ending *reports* play. The predicate therefore also asks that an outcome (H6 or H7) differs on at least one seed. The kill criterion covers the case where text differs and outcomes never do.

## Vision premises leaned on

- North star: the pleasure is witnessing a living thing and choosing what kind of god to be. The ending now says which kind.
- Non-negotiables §1: forks belong to the mortal; the god leans.
- Law 32: a run is good if it leaves a story the player can tell.
