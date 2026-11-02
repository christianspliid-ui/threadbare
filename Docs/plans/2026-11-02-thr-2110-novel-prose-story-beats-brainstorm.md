# Brainstorm companion — novel-prose story beats (THR-2110 / THR-2134)

Companion to `Docs/plans/2026-11-02-thr-2110-novel-prose-story-beats.md`. The alternatives weighed, and why each lost.

## How to slice

- **One slice of five (the ticket's literal scope).** Lost: about 14,000 words of player text, three times wave 2a's load. A run that dies halfway leaves a half-rewritten story beat with its fallback copy out of step.
- **Five slices, one per beat.** Lost: five gate cycles for text-only work, and no calibration benefit after the first.
- **Two slices (chosen).** A takes the beat players actually meet (Flawed Steel) and the one owing result lines (the Mason-Lord). B takes the other three and calibrates on A's Flawed Steel, the same pattern wave 2 used with its board exemplar.

## Text only, or convert the choices

- **Convert the four quest files to the nudge model now.** Lost: canon rejects authored choices, so this is tempting. But 34 data files still author them, and whether seeded story beats keep them is an open question across the whole legacy corpus, not this ticket's. Converting four here would decide it by precedent. Filed as THR-2135 instead.
- **Wait for THR-2135 before rewriting.** Lost: the text is broken today, and a conversion keeps the scene facts. Plain facts written now carry over; the novel prose would not.
- **Rewrite the words the choices already carry (chosen).** Each `intent` states what the god's hand does, never the ending it buys. That is as close to the nudge model as the shape allows without changing it.

## Budgets

- **No budgets, cold read only.** Lost: slice 1 and wave 2 got away with it because board templates are short already. These beats run 150–350 words a step; without a number the rewrite drifts long again.
- **The board budgets for everything (bandBase 60).** Lost: step 0 is the opening; 60 words cannot carry arrival, situation and problem for a story beat.
- **Opening 80 for step 0, bandBase 60 for variants and overviews, effectLine 25 for intents (chosen).** Every number already exists in `NUDGE_WORD_BUDGETS`. The kill criterion lets one field grow if a fact will not fit, so the budget never costs a fact.

## The fallback copies

- **Delete the fallback, let no-card play use one variant.** Lost: the engine reads `fallback` when no card was played; removing it leaves that path with no ending.
- **Write a distinct fallback ending.** Lost: that is new content and a new outcome, a design change.
- **Keep the spread, cut repeats inside each ending (chosen).** The player sees one ending either way.

## Tensions noted

- The exemplar index rates Flawed Steel 9/10 for wiring and "prose: do not copy". After slice A its prose may be worth copying too. Promoting it is a later call, after slice B's cold read.
- The Apotheosis card "Let The Morning In" is a good verb-noun name that the checker's allowlist rejects. Fixing the allowlist is THR-2106's ground, so the plan expects the one warning.
