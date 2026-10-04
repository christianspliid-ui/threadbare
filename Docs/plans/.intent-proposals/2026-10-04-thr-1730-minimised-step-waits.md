# Action proposal — 2026-10-04-thr-1730-minimised-step-waits

## intent_quote

> "Escape and 'Show on map' no longer disregard; they **minimise**: the encounter stays pending, its badge stays standing (Law 40), and it reopens from the badge. 'Let fate decide' with an empty hand (or whatever the empty-hand commit is labelled when this lands) is the one deliberate way to let an encounter play out without spending."
> — THR-1724 description, change 11 (Christian's layout pass, human gate satisfied via chat review 2026-10-04)

> "Should a minimised pause-tier step **wait for the player while time runs**? … Recommendation: A, inside or right after THR-1715, because that ticket already reshapes when pause-mode encounters stop the world."
> — THR-1730 description (filed by the THR-1724 executor)

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations"
> — Christian, 2026-09-25 (design-lane mandate, THR-1611)

## scope (what this plan does)

The plan makes a minimised pause-tier unified-action step wait for the player while the world runs. It adds one optional `playerHold` field to `UnifiedAction`, written only by the UI minimise handler. The engine's phase-2a progress step skips live holds. Holds are released by commit or dismiss in the UI, and by the engine when the step changed, the thread is no longer pause mode, or the action resolved. The badge of a held step says it is waiting, backed by a registered tooltip. A debug accessor lists holds. The rulebook clock paragraph gains one `[IMPL]` sentence in the build PR.

## scope (what this plan does NOT do — explicit non-goals)

- Does not change the auto-pause / interrupt registry or resume-to-prior (THR-1608).
- Does not hold steps for auto-mode ("Lives on") threads or legacy `encounterProgress` encounters.
- Does not hold a step merely because a notification is pending; only an explicit player minimise sets a hold (headless runs unchanged).
- Does not add a cap, a reopen nag, a toast or a map signifier.
- Does not change resolution math, nudge costs, or the empty-hand commit label (THR-1714 owns that).
- Does not touch the five-card hand layout (THR-1732).

## impact_class

Reversible. One kill-switch constant restores today's behaviour; the field is additive and optional.

## evidence cited

- **Linear issue:** THR-1730 (sources: THR-1724, THR-1715)
- **Vision premises invoked:** the Stellaris clock (`Docs/canon/rulebook.md` §3, ruling 2026-09-27); The First is born asking (THR-1715)
- **UL terms touched:** none new. "Waiting" is a plain word, and its tooltip registers in the `ui.*` namespace.
- **Canon pages consulted:** `Docs/canon/rulebook.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/design-system/laws.md` (Laws 1, 13, 17, 21, 33, 37, 39, 40, 52, 53), `Docs/canon/systems-inventory.md`, `Docs/canon/interface-map.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-03-thr-1715-the-first-asks.md`
- **Rejected approaches considered and dismissed:** B (status quo), hold-all-pending, capped hold, reopen nag, world-pause-on-minimise, notification-side flag (brainstorm companion)

## load-bearing decisions touched

- "Everything is a graph node/edge": respected. No relational table; `unifiedActions` is existing GameState, and the field sits beside `disregardRemaining`.
- "The world graph is mutated in place": not touched (no graph write).
- "Engine caches are owned per session": not touched.

## high-impact files touched (from Codesight)

- `src/types/unifiedAction.ts`: about 610 importers. Blast Radius section present.

## kill criteria

- If round-3 cold testers report The First "stuck" or "frozen" with no idea why, the badge signal is too quiet. Escalate the UI, keep the hold.
- If Christian says minimise should mean "I'll come back if I can", set `PLAYER_HOLD_ENABLED = false` (one edit) and close.
- If the census or test:heavy shows any hold set headlessly, that is a bug in U1's guard; fix before merge.
