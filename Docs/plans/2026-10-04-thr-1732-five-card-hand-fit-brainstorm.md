# Brainstorm companion: the commit stays on screen when the hand wraps (THR-1732)

Companion to `Docs/plans/2026-10-04-thr-1732-five-card-hand-fit.md`. It records the alternatives, the tension between Christian's two same-day rulings, and the Vision premise the call leans on.

## The tension

Christian's 2026-10-04 layout pass approved two things that cannot both hold:

1. **Rows of at most four cards with 16:9 bands.** Law 33 and Law 5/7 were amended that day.
2. **"It must still fit the 1920×1080 viewport contract with two card rows — verify with 5 cards."**

Two rows of the locked card are 656px. The veil column is 986px. What sits above the hand (step dots, title row, context strip, stakes line, scene prose) takes 380–470px on the measured scene, and the commit row and paddings take ~130px. The sum exceeds the column by 269px on the five-card bridge. It is worse on art scenes, where the column is 52% wide and rows hold three.

So the question is *which* approved rule bends, or whether one can be honoured in spirit without bending any. The lane's boundary says a law amendment is a joint decision with Christian. The lane therefore looked for the option that bends nothing, and found one that removes the actual harm.

## What the player actually loses today

Not "the second row". The second row is reachable by scrolling the column, which Law 33 sanctions. The player loses **the commit**: it sits 196px below the fold on a five-card hand. Law 48 makes the commit the second beat of every act that spends essence. A god who stages a hand and then sees no way to fire it reads the screen as broken. THR-1410 was exactly this defect on the legacy veil, and it was fixed by guaranteeing the commit's reachability, not by shrinking content.

## Alternatives

| Option | Fixes 5 cards? | Fixes 6–8? | Fixes art scenes? | Bends an approved rule? |
|---|---|---|---|---|
| A: five per row when room | Only by cutting the gap (1098 > 1088) | No | No | Law 33 "at most four" |
| B: tighter card body | Partly (~50px per row) | No | No | THR-890 locked card |
| C: accept column scroll | No (commit below fold) | No | No | None, but Law 48's beat is off screen |
| D: one row, wider veil | Yes | Up to 8 at 1920 | Not with art | Reverses the wrap-rows choice |
| E: step dots into title row | 48px only | No | No | Christian's title-row composition |
| **F: pinned hand bar (chosen)** | **Commit always visible** | **Yes** | **Yes** | **None** |

F does not make two rows fit, which is impossible. It makes the *act* fit. That was the point of the viewport contract for this surface.

## Why not reserve it for Christian

The lane's reservation test is a fork in *what the game means* with no agreed outcome. This is layout. The agreed outcome, a playable encounter screen inside one viewport, decides between options that bend his rules and one that does not. The bending options stay one sentence away for him: "five across" or "one row". F stays useful under both, because neither one handles hands of six or more.

## Vision premise

The nudge model's core is a god's deliberate act: stage the hand, then fire it (Law 48's "a deliberate act of a god"). Any layout that hides the firing control undermines the premise more than any amount of hidden card art does. Keeping the scene prose at full height honours "narrative over mechanical perfection": the story is never clipped to make room for chrome.

## Risks noted

- Sticky positioning can be defeated by a future `overflow` on an ancestor. The plan's fail-soft is that the bar degrades to today's in-flow row, and a unit test pins the structure.
- A pinned bar over cards could hide a card's bottom (the odds pips) when the column is not scrolled to the end. The fade reads as "continues", and at maximum scroll every card clears the bar (a Done-when assertion).
