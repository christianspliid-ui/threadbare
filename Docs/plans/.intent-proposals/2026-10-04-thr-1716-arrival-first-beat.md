# Action proposal — 2026-10-04-thr-1716-arrival-first-beat

## intent_quote

From the ticket THR-1716 (filed from cold playtest round 2, 2026-10-03, under Christian's account), verbatim:

> **The design question**
> * **How does the arrival hand the player into the first beat?**
>   * Options: auto-run until Beat 0, a single pulsing Play prompt, or the opening beat fires at tick 0.
> * **Is four picture screens the right length for setup?**
>   * Testers praised its writing and the recap.
>   * The skimmer wants a dilemma within about 60 seconds.
>
> **Recommended direction:**
> * The first beat fires without needing Play.
> * Keep the remembrance, but remove the zoom-then-confirm double click: one click selects, with a visible "chosen" state.
>
> ## Fixed when
> No round-3 tester spends more than three actions on the map before their first story beat. Implementation tickets go into this milestone.

Director mandate for the lane (Christian, chat, 2026-09-25):

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map."

Settled clock ruling (Christian, chat, 2026-09-27, recorded on THR-1608):

> "Clock: the Stellaris model. Real-time, with generous auto-pause on important things. Not turn-based."

## scope (what this plan does)

Offers the already-due opening spine beat (Beat 0, "Reach Down") at world arrival, before any tick, via a pure engine helper called from the UI arrival site; opens it directly instead of behind an offer banner; makes the bond's existing "Let them walk." button start the clock the first time time runs in a world; shows a quiet Play prompt while time has never run and nothing is open; and makes each of the four remembrance picture screens choose on one click with a visible chosen state and an undo window. Names the remembrance's inline timing numbers as constants.

## scope (what this plan does NOT do — explicit non-goals)

- Does not shorten or remove any remembrance screen, rewrite its prose, or change which identity questions are asked.
- Does not auto-run the clock without a player act, and does not change resume-to-prior (THR-1608 S3) after time has run once.
- Does not change anything after the bond: The First's attention mode, chapter cadence, the ledger (THR-1715's scope).
- Does not change spine gifts 1–4 or their gates (THR-1647 S4).
- Does not change `initializeGameState`, the headless CLI or any test fixture's tick-0 state.
- Does not touch the meeting's dilemma screens (THR-1714's scope) or tooltips across the HUD (THR-1713's scope).
- Does not change any pre-bonded dev route (`?seeded`, `?spawn=`).

## impact_class

Reversible — UI behaviour and one pure engine helper; no save-format change, no graph write, no PRNG change.

## evidence cited

- **Linear issue:** THR-1716
- **Vision premises invoked:** Vision core loop ("halts for every moment that matters… the meeting"); player-as-god framing
- **UL terms touched:** interrupt, toast (existing, `Agents.md` § Moment presentation); no new terms
- **Canon pages consulted:** `Docs/canon/process.md` (rule 4), `Docs/canon/rulebook-quick-reference.md`, `Docs/design-system/laws.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-09-27-thr-1605-the-opening.md` (S1 meeting trigger, S3 resume-to-prior, S4 gift gates, S5 quiet first screen)
- **Rejected approaches considered and dismissed:** auto-run until Beat 0; Play prompt as sole fix; always-resume after the bond; tutorial modal; cutting a remembrance screen; a separate magnifier for zoom

## load-bearing decisions touched

- "Engine caches must be owned per session" — respected; `clockEverRan` is per-session UI state in `useSimulation`.
- "The world graph is mutated in place" — not touched; the helper writes only `GameState.ascendantBeats` and no graph.
- None changed.

## high-impact files touched (from Codesight)

`src/types/trace.ts` — 148 importers (`.codesight/graph.md`); additive union members only, covered by a Blast Radius section in the plan. All others under 10: `ascendantBeat.ts` 7, `ui-content.ts` 5, `useSimulation.ts` 2, `useInterruptAutoPause.ts` 2, `FragmentCard.tsx` 1. `GameView.tsx` and `debug-bridge.ts` are low-importer but large-surface files, held by the THR-1715 mutex.

## kill criteria

- A round-3 tester spends more than three map actions before the first beat → the arrival path failed; inspect `beat.arrival_offer` on that build.
- Round-3 testers sit in a paused world after the bond → "Let them walk." does not read as starting time; retitle it or resume always.
- Testers report a remembrance choice they could not undo → lengthen the hold or add Continue to the stirring and drive screens.
- Any `?seeded` route shows the beat modal on load → the bond gate is wrong; revert E1's call.
