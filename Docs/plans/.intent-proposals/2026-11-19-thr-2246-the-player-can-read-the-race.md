# Action Proposal — the player can read the race (THR-2246)

## intent_quote

> "assess what can push the game forward then prepare enough for design and dev that our routines run again."
— Christian, chat, 2026-11-18 (the attended session filed THR-2246 under this delegation as ticket 2 of "make the ending a game").

The ticket's own design question (filed under that delegation): *"What does the player read, and where, so that the ending is in sight while there is still time to change it?"* — the forecast sentence, the lever, where it lives, and what the player sees when the race turns.

Playtest voice behind it (warm round 4): *"LOST: is the world ending? Should I be doing something about the doom? Nothing tells me."*

Period focus (Christian, chat 2026-11-01): *"get the design lane to focus on UI and UX improvements for the next period. specifically legibility and usability of the different UI modules"*.

## scope (what this plan does)

Adds a race forecast. The engine samples Mandate and Doom progress once a day over fifteen days and projects which clock finishes first. The result is one of four states (Mandate first, Doom first, close, Mandate stalled), or hidden early in the age. A state turns only after it has held for two days. The plan adds one lever pick: the bound mortal's chapters in the short sphere, else Stay the Unmaking. It adds one optional field on the Mandate state, one trace, and one non-pausing alert when the race turns. It shows the forecast on the folded rail row (in place of the trend word), in the Mandate block (in place of the flavour line), and in the Mandate and Doom dialogs. It adds a warm-recap line and replaces the checkpoint's "on pace" sentence. Debug: `getRace`, plus a debug-only `forceRace`. Four implementation tickets: engine; content and UI; a census check of turn count and accuracy; a place lever after THR-2249.

## scope (what this plan does NOT do — explicit non-goals)

- No change to how either clock moves: no rule of play, no rate, no target.
- No numeral, percentage or projected day count on any player surface (the hover names its fifteen-day window in words).
- No score, grade or "winning/losing" wording (Law 32).
- No new persistent chrome and no top-bar change.
- No place lever in this slice. It is deferred to ticket 4, behind THR-2249.
- No pausing popup.
- Not the Twilight lines (THR-2250) and not Doom's last stage (ticket 3 of the direction).

## impact_class

Reversible — one optional state field, words on existing surfaces, all behind a pure view function.

## evidence cited

- **Linear issue:** THR-2246
- **Vision premises invoked:** `00-north-star.md` (two clocks, "not a game about winning"), `02-non-negotiables.md` #2/#3; Game Design Laws 30, 32
- **UL terms touched:** Mandate, Doom, the Unmaking, Stay the Unmaking (all existing). "Race" names the module and its hover id (`ui.race`) only. No player sentence says it: the rail words are "Lands first" / "Doom lands first" / "Close finish", and the alerts read "How the age ends has shifted." / "Now you can see how the age ends." No UL entry is proposed.
- **Canon pages consulted:** `Docs/design-system/laws.md`, `Docs/game-design/laws.md`, `Docs/ops/player-complaint-classes.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-11-19-thr-2245-a-well-played-age-can-be-won.md` (census measurements)
- **Rejected approaches considered and dismissed:** see the brainstorm companion (top-bar meter, day counts, 36-tick window, lastStep-only, pause popup, place lever now)

## load-bearing decisions touched

- Graph mutated in place / change detection via worldVersion: the new field lives on `mandateState`, which is written immutably per tick like `recentLedgerMoves`, so no graph-identity keying.
- Engine caches per session: none added.

## high-impact files touched (from Codesight)

None ≥100 importers. `src/types/mandate.ts` has 27 importing files; `phaseMandate.ts` is imported by 2 source files.

## kill criteria

The census (ticket 3) gates it. More than three turns per age on any seed raises the hold, then the window. If that still fails, the forecast is hidden and redesigned. A state shown at Doom 0.80 that names the wrong clock on two of three seeds blocks ticket 2's surfaces. A warm tester saying Doom ended the age "out of nowhere" refutes the playtest signal.

## explicit user sign-off

N/A (Reversible).

## author notes for the judge

- The plan is decided by the design lane under delegation; Christian may veto in chat. Implementation tickets carry `Claimable from` 12 h after handoff.
- The lever order (chapters before Stay) rests on THR-2245's census numbers, which are a projection plus measured arms, not a shipped measurement.
- Uncertain: whether "Goal · Doom lands first" fits the folded rail row at 1920 without truncation. The plan gives the executor a fallback.
- The forecast's accuracy before THR-2249 ships will mostly read Doom-first; that is intended honesty, not a defect.
