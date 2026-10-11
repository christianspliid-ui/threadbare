# Action Proposal — A chapter answers on screen (THR-1806)

## intent_quote

The ticket (filed by the cold-playtest lane from round-3 tester reports, in the blessed cold-playtest loop):

> **Design question.** When the player commits the last step of a chapter, when and where do they see what happened?

> **Fixed when** every round-4 tester who commits a main-map chapter step sees its result on screen without opening the Chapter Ledger, and no tester reports a choice that "did nothing".

> **Done when** this ticket's implementation tickets are filed into this same milestone (*Cold playtest · round 3*) and this ticket is closed by the design pass.

Tester quotes carried by the ticket:

> "I made a choice and got nothing: no result, a Chapter Ledger counter going 0 → 1 → 0, and the Aftermath hidden behind an icon. For a systems player, an action with no visible consequence is the cardinal sin." (veteran)

> "Results of main-map quests weren't shown. I found them only by clicking 'Chapter Ledger'." (skimmer)

Christian's standing delegation (2026-09-25, THR-1611):

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations"

## scope (what this plan does)

After a player commits a step of a pause-tier thread chapter while the clock is paused, the encounter veil stays up as an "answering" card that says the answer needs world time and offers "Let the world turn" (runs the clock until that step answers, then returns it to paused) or "Back to the map" (closes; the time readout says the answer waits on time). A running clock behaves as today. UI only: a new hook, an optional veil presentation, a time-readout status prop, ten strings, two constants, one debug accessor, one rulebook §3 sentence.

## scope (what this plan does NOT do — explicit non-goals)

- Does not resolve steps at commit (the ticket's recommended direction) — no engine change to step durations or resolution.
- Does not move the clock without a player press (keeps the 2026-09-27 Stellaris-clock ruling).
- Does not change the auto-open scan, the aftermath surface, or the Chapter Ledger.
- Does not touch auto-resolve-tier threads or legacy encounters (their commit path is unchanged when the clock runs).
- Does not address THR-1807 (reading spends) or THR-1808 (dashboard arrival).

## impact_class

Reversible — UI-only presentation and clock-request change behind named constants; no data migration, no engine state.

## evidence cited

- **Linear issue:** THR-1806
- **Vision premises invoked:** `Docs/canon/rulebook.md` §3 (Stellaris clock, ruling 2026-09-27; The First is born asking, THR-1715); `Docs/design-system/laws.md` Laws 39, 47, 52
- **UL terms touched:** chapter, step, aftermath, veil, thread (existing); no new terms
- **Canon pages consulted:** `Docs/canon/rulebook.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/design-system/laws.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-09-27-thr-1605-the-opening.md` (S3 resume-to-prior), `Docs/plans/2026-10-10-thr-1805-gift-waits-its-turn.md` (sibling round-3 fix; gift waits behind an open veil)
- **Rejected approaches considered and dismissed:** resolve-at-commit (engine path outside the tick; pause-dependent step meaning); automatic run-until-answered (contradicts the 2026-09-27 ruling); status text only (player still dropped on the map)

## load-bearing decisions touched

- "Engine caches are owned per session" — not touched.
- "The world graph is mutated in place" — not touched (no graph writes).
- The Stellaris clock ruling (rulebook §3) — respected: the clock moves only on the player's press and returns to paused.

## high-impact files touched (from Codesight)

None ≥100 importers. Measured importer counts: `GameView.tsx` 7, `EncounterVeil.tsx` 9, `SimulationControls.tsx` 8, `nudge-stage-content.ts` 22.

## kill criteria

- A round-4 tester still reports a main-map choice that "did nothing" → the card is not reaching that path; inspect `__DEBUG.getChapterAnswer()`.
- A round-4 tester reports the world "ran on by itself" after a chapter → the return-to-paused is broken; fix the `pauseIfHeld` call.
- Testers describe the answering card as a stall → fall back to the readout-only path (option C in the brainstorm).
