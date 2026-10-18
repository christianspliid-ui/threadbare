> **companion to:** `Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md`
> **linear_issue:** THR-1980
> **author:** Claude Code (design lane, run 2026-10-18d)
> **created:** 2026-10-18

# Brainstorm — Words teach themselves by something changing

## The tension

Round 3 (THR-1807) fixed *reach* and *timing*: every word got a registry tooltip, hoverable even under a chapter, and four risks were said before the act. Round 4 shows the fix landed where it was measured (the opposite-trait miss now reads, because a visible thing changed when the tester leaned) and missed where the sentence describes something the screen never shows. The pour is the sharpest case: the sentence "What you pour decides which pools refill fastest" is true, but the starting pool (50) equals the starting cap (50), so no pool can refill before the first spend. The sentence reads as a claim the game never backs.

So the principle this plan adds to THR-1807's rule is: **a word is learned when the player sees it change something.** Tooltips are the backup, not the lesson.

## Alternatives considered

### For the pour
1. **Show the rate as a number ("+3 / season").** The ticket's own recommendation. Rejected: Law 13 [E] allows numerals only for pool balances in persistent chrome; a rate is not a balance. It would need a law amendment, which is a joint decision with Christian. Listed in the run report as what would change the call.
2. **Start pools unequal, by the pour.** Rejected by THR-1807 already ("changes what the pour means"); it would also make the pour a starting-capital buy, a different game.
3. **Start pools below the cap so refill is visible at once.** Rejected: it changes the opening economy (the first casts become cheaper or dearer by sphere), a balance change dressed as a UI fix.
4. **A refill word + rung on each row and live on the pour screen.** Chosen. It is the pour's real effect, it changes visibly at the moment of choice, and it is legal under Law 13 (words, rung marker per THR-1807 rule 3).

### For the odds
1. **Recolour Fated gold.** Reserved for Christian: his 2026-10-04 ruling set fated grey on purpose ("a sure thing needs no god").
2. **A ladder sentence in the legend + "the best word" in the hover.** Chosen: it fixes the reading without touching the ruling.
3. **A within-tier progress bar on the pill.** Rejected: a third magnitude language beside pips and the delta cluster (Law 15 needs a ruling). "Still Doomed" / "close to Perilous" says the same in words.

### For the later words
1. **A tutorial overlay or glossary page.** Rejected again (THR-1807): a second place to look; the Codex exists and did not move the count.
2. **Seen-once captions under each panel.** Chosen: THR-1807 named this as the next step if round 4 showed no hovers, and round 4 did.
3. **Hide everything until first use.** Partly chosen: Attention moves to the first chapter (it matters only when a moment draws on it) and Dominion to the *A path opens* gift. Threads and essence stay at the bond — The First's thread and the hand use them from minute one.

### For the Chronicle
1. **Keep strangers' tier-ups but reword them.** Rejected: 3/3 testers named the Chronicle's stranger growth as noise; rewording noise keeps it noise.
2. **Gate by threaded actor, reword the rest.** Chosen. The producer declares the gate on the event (`chronicleGate`), so the narrative phase never parses messages.

## Vision premises

- The god reads before acting (god-game premise). Every chosen item makes a reading visible; none changes a rule.
- Panels arrive with the gift that names them (THR-1808/1837). Captions ride the same reveal.
- Strangers are not the player's story until threaded (UL Thread; the Ledger tab already shows threaded chapters only).

## Measurements (origin/main 37809540)

- `INITIAL_ESSENCE_PER_SPHERE = 50` (`influence.ts:31`), `BASE_MAX_ESSENCE = 50` (`influence-content.ts:44`).
- `computeEssenceIncome` computed and unread: `GameView.tsx:1650-1653` (grep for `essenceIncome` in that file: lines 200, 1650, 1651 only).
- Income split: `distributeBySpherePoints` (`spherePoints.ts:135-146`), 0.04 floor per sphere (`sphere-points-content.ts:30`), base 1.0 per tick (`influence-content.ts:15`).
- Fated grey: `index.css:210-221` comment and token; pip gold `nudge-pip-vocabulary.ts:90`.
- Chronicle intake copies every ≥ 0.8 event verbatim: `orchestrator.ts:2680-2699`.
- Dominion has no reveal row: `opening-reveal-table.ts:57-75`.
