# Action proposal — the answer comes here (THR-2136)

## intent_quote

> "get the design lane to focus on UI and UX improvements for the next period. specifically legibility and usability of the different UI modules: are we using tried and true ux patterns for how humans read UI panels..." — Christian, chat, 2026-11-01

Ticket THR-2136 (filed from cold playtest round 6, recurrence of THR-1806 → THR-1976 → THR-2052): "On a running clock, what does the player see in the first second after pressing Play on a chapter step, and does the Aftermath of the last step outrank other arrivals? … Fixed when no round-7 tester says a chapter step or chapter ended with no visible result. Done when this ticket's implementation tickets are filed into this milestone (Cold playtest · round 6) and this ticket is closed by the design pass."

Tester evidence (round 6, 3/3): story — "Two-step chapters dropped me back on the map between steps and after the last step, with no outcome shown. I thought it had broken." Veteran — "For about a minute I thought my spend had done nothing." Skimmer — "a snap back to the map with no result."

## scope (what this plan does)

After Play on a chapter step with the clock running, the chapter stays on the Stage as a live answering card that does not hold the clock, so time keeps running. When the step answers, its next beat or Aftermath opens in the same place. That answer opens before any premonition or other arrival that became ready meanwhile, and skips the 2.5 s quiet-after-input window for this one beat. *Back to the map* remains the way out.

## scope (what this plan does NOT do — explicit non-goals)

- No change to step timing, resolution, odds or the engine tick.
- No forced pause or forced resume of the clock (rulebook §3).
- The paused-clock answering card (THR-1812) is unchanged.
- Does not restyle the Stage's type or hierarchy (that is Legibility 3, THR-2124).
- Does not change THR-2053's surface hold or its quiet window for world-opened chapters.

## impact_class

Reversible (one constant restores today's close).

## evidence cited

- **Linear issue:** THR-2136
- **Vision premises invoked:** the god's time is theirs (rulebook §3, no forced pause/resume, 2026-09-27)
- **UL terms touched:** Stage, Aftermath, chapter, step (unchanged)
- **Canon pages consulted:** `Docs/design-system/laws.md` (Laws 37–39, 45, 47, 49, 52, 54, 55), `Docs/canon/rulebook-quick-reference.md`
- **Prior plan docs this builds on:** THR-1812 (answering card), THR-2052 (last-step answer line), THR-2053 (arrival holds), THR-1877 (homed surfaces)
- **Rejected approaches considered and dismissed:** flipping the constant alone (pauses a running world), a map toast (too late, second chrome), pause-and-auto-resume (forced resume)

## load-bearing decisions touched

- None of the engine decisions. One Stage, no fourth container type (THR-1823): the live card is the Stage under a second registry id.

## high-impact files touched (from Codesight)

None at ≥100 importers. `GameView.tsx`, `useChapterAnswerRun.ts`, `EncounterVeil.tsx`, `nudge-stage-content.ts` (33), `homed-surfaces.ts`, `src/debug-bridge.d.ts`.

## kill criteria

If round 7 testers say the Stage blocks the map while waiting, lift the map dimming for the live phase. If any tester still reports no visible result, take the question to Christian: pause on commit, which reverses the no-forced-pause ruling.
