> **title:** Every card says what it buys — the result line, the price row and the kind chip (THR-2146)
> **linear_issue:** THR-2146
> **author:** Claude Code (design lane, unattended, 2026-11-02 — run 2026-11-02f)
> **created:** 2026-11-02
> **three_pillars:** Engine done (one blocked code, one view field, the card's write reaches the Aftermath) · Content done (one word table for the result line) · UI done

# Every card says what it buys (THR-2146)

*A card that does not move the odds has an empty slot where the odds would be, and nothing on the face says what the player gets for the price. Fill that slot with the exact result, stop dealing a heal with nothing to heal, and let the price row hold only the price.*

## Why this is load-bearing

Cold playtest round 6 ([report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-6.md)), 2/3 testers. The story tester listed the card tags (*Create, Find, Cosmic, Cache, Balm, Boost, Kindled ambition*) as never understood and gave the reason: *"Only 'Boost' ever visibly changed the odds. I couldn't see what Balm or Kindle bought me after paying for them."* After picking Balm: *"Nothing tells me what Balm will actually do."* The veteran: *"Non-Boost cards (Cache, Compulsion, Kindled ambition). They don't move odds … nothing confirms it."* The skimmer had *"no guess"* for the *"coloured circle icons next to card prices."*

So the complaint is not the tag word. Every tag already hovers (below). The complaint is that a card which does not move the odds never says, before or after, what it did. That is Christian's chip ruling of 2026-08-23 applied to the card face: *"we want exact and understandable game effects … it is impossible for the player to understand what they are getting"*, with the effect in core vocabulary (condition, item, ambition), never only in prose.

Measured on `main` @ `d322ddd1`:

- **Every tag already has a hover.** Nudge chips carry `ui.card.keyword.<typeId>` (`NudgePhaseShell.tsx:358-365`, built from the library's `effectShape` + `decision`, `ui-content.ts:1500-1517`). Action verb and scale chips carry `ui.card.verb.*` / `ui.card.scale.*` (`ui-content.ts:1155-1200`, set at `actionCardModel.ts:171-174`). Cold players do not hover, so a hover cannot be the only answer.
- **18 library members have `forecastDelta: 0`** (`grep -c "forecastDelta: 0," src/data/nudge-card-library.ts` → 18). On those cards the odds zone draws nothing: `CardFace.tsx:727-735` renders `OddsPips` only for `odds.kind === 'delta'`, and `OddsPips` returns `null` below its epsilon. What is left is the authored effect line, which is prose: Balm's is *"A hurt they were carrying stops being carried."* (`nudge-card-library.ts:992`). It names no condition and no mortal.
- **Balm is dealt whether or not the mortal is hurt.** `dealHand` eligibility checks profile, band fragments, exclusion and authored type, and nothing about the grant's target (`dealHand.ts:322-341`). The grant then finds nothing to remove and correctly raises nothing (`encounterAftermath.ts:2839-2845`, THR-1244). The player paid three essence for no change.
- **The card's write never reaches a report.** Grants are applied after the encounter's own aftermath, and the returned `mutationSummary` is used only to touch caches (`phaseAutonomousAftermath.ts:207-215`). Nothing stores it on the action. Whether the Aftermath view finds the write some other way is not measured; U4's test settles it.
- **The "coloured circles" are two marks beside the price.** The price row draws `ReachIcon`, then `SphereIcon`, then the ✦ pips, then the paying pool's word (`CardFace.tsx:535-583`). On a nudge card the paying pool is `card.sphere ?? budgetSphere` (`buildNudgePhaseModel.ts:889`), so when the sphere mark shows, the word beside it names the same sphere. Action cards set `sphere` but no `costSphere` (`actionCardModel.ts:176`), so their price shows the coloured circle and no word at all.
- **Action cards wear two kind chips.** The verb chip (Create / Find / Change / Destroy / Control) and a muted scale chip (Personal / Local / Regional / Cosmic) (`actionCardModel.ts:171-174`). The veteran listed *"Scale: Cosmic"* as never understood.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Nudge card repertoire and dealt hand (`nudge-card-library`, `dealHand`) | 🟢 ACTIVE | extends: no change to dealing; the hand builder gains one blocked code |
| Nudge hand and blocked codes (`encounters/nudges.ts`) | 🟢 ACTIVE | extends: `no_target` beside `essence_unavailable` / `sphere_locked` / `unlock_missing` / `trait_missing` |
| Nudge dispatch (`nudgeDispatch.dispatchNudgeCommitments`) | 🟢 ACTIVE | extends: returns `nudgeWrites` beside its summary |
| Encounter stage model (`buildUnifiedEncounterStageModel`) and its writer-record merge (`stepCasts.writes`, THR-1670) | 🟢 ACTIVE | extends: one more record merged the same way |
| Shared card face (`shared/CardFace`) | 🟢 ACTIVE | extends: one new zone field `resultLine`; the price row drops the sphere mark |
| Aftermath consequences (`buildAftermathConsequences`) | 🟢 ACTIVE | extends: the card's writes show as ordinary chips |

## Decisions this plan builds on

All four were decided by the design lane under delegation in this plan (process.md rule 4; veto in chat). Each is inside the period focus Christian set on 2026-11-01: *"are we using tried and true ux patterns for how humans read UI panels"*.

1. **D1 — Every card answers "what do I get" in the same slot.** A card that moves the odds shows its pips there, as today. A card that does not shows a **result line** there: the exact game effect, the named mortal, core vocabulary, no number. *"Ends Elara's Wounded."* This is card games' reminder-text pattern: the rule text on the face says what the keyword does, and the keyword stays as a short name the player learns. The authored effect line stays above it as the card's voice.
2. **D2 — A card with nothing to act on is withheld from the hand.** Balm on a mortal with no condition it ends gets the blocked code `no_target`, and the stage withholds it exactly as it withholds `sphere_locked`, `unlock_missing` and `trait_missing` today (`WITHHELD_CODES`, `buildNudgePhaseModel.ts:124-128`, applied at `:711-716`; only `essence_unavailable` is shown dimmed, `nudge-stage-content.ts:232-236`). The player never pays for a card that cannot change anything. The deal itself is not filtered: dealing is re-derived at render and at resolution (`dealHand.ts:470-497`), so a card removed from the deal between the two would break a held selection. The designer view still lists it with its reason.
3. **D3 — The price row holds only the price.** ✦ pips and the paying pool's word. The sphere mark leaves the row, because the word beside it already names the same sphere and the card's tint carries it too (Christian loves the tint; it stays). Action cards gain the pool word they lack. The reach mark moves to the kind side of the row, with its reach word beside it, so no icon carries meaning alone (Laws 11, 12).
4. **D4 — An action card wears one kind chip.** The verb chip stays. The scale word leaves the face and opens the verb chip's hover (*"A Local working. …"*). Out-of-range already reads as a blocked reason in words (`action-card-display.ts:66-73`), which is the only time scale changes the choice.

Rejected: dropping the nudge type chips (the Repertoire's vocabulary is learned once by design, THR-887); a legend panel over the hand (one more surface to read, and Law 53's budget); numbers on the result line (Law 13).

## Engine pillar

- **E1 — `no_target` blocked code.** In `src/engine/encounters/nudges.ts`, the hand builder marks a `remove_condition` card `blocked: 'no_target'` when its resolved target carries no edge of `conditionTraitId`; `buildNudgePhaseModel.ts` adds `no_target` to `WITHHELD_CODES`. The check reads the same edge the remover reads (`encounterAftermath.ts:2777-2837`), so the two cannot disagree. The other grant kinds on library cards (`assign_ambition`, `emit_omen`, `favor_creation`, `hidden_mark`, `plant_compulsion`, `spawn_artifact`, `spell_grant`) create state rather than remove it; the Done-when test proves each writes.
- **E2 — `resultLine` on the view.** `buildNudgePhaseModel.ts` adds `resultLine?: string` to each card whose profile has `forecastDelta` 0 and at least one grant. It is built from the first grant through `nudgeGrantResultLine(grant, ctx)` (C1), with the target's display name and the noun from the display table that already names the thing (condition label, ambition title, item word). A grant whose noun cannot resolve falls back to the kind's sentence without the noun and warns once (Law 14).
- **E3 — The card's write reaches the Aftermath.** The Aftermath's chips are built from authored `changes` plus records the writers leave on the action: the fight's `fightState` and the step cast's `stepCasts[i].writes` (THR-1670), merged at `buildUnifiedEncounterStageModel.ts:885-893`. Nothing like that exists for cards. E3 follows the cast precedent exactly:
  - a new optional field on the action, `nudgeWrites?: readonly NudgeWriteRecord[]` (`src/types/unifiedAction.ts`, beside `stepCasts` at `:3480`), one entry per grant that wrote: `{ cardId, kind, targetId, refId }` (`refId` = the condition, artifact, ambition or spell id);
  - `dispatchNudgeCommitments` builds the entries inside its existing grants `try` (`nudgeDispatch.ts:250-264`) and returns them beside `mutationSummary`, only for grants whose summary shows a write (a `remove_condition` with `removedCount` 0 records nothing — Law 56); `phaseAutonomousAftermath.ts:209-215` stores them on the action;
  - `buildNudgeWriteChanges(activeAction.nudgeWrites, chipWorld)` in `src/engine/views/stage/` turns each into an ordinary change (condition ended → `trait` gain, item → `item` gain, ambition / compulsion / omen / favour → `future_hook`, spell → `trait` gain), merged with `mergeFightChanges` beside `buildCastChanges`. `hidden_mark` records nothing: the Long Game is hidden by design.
- PRNG: none. Pure functions over the graph.

## Content pillar

- **C1 — `NUDGE_GRANT_RESULT_LINES`** in `src/data/nudge-card-display.ts`, keyed on `ResultLineGrantKind`, the grant kinds that appear on library cards minus `quintessence_shift` (it rides only odds cards, e.g. Undertow at `nudge-card-library.ts:954`, whose result is their pips). A new kind added to that subset without a line is a type error (Law 9). Plain register, ≤ `EFFECTS_LINE_MAX_CHARS`. The ambition and compulsion lines say what the god does, not what the mortal chooses (Vision audit note: mortal sovereignty):

| Grant kind | Result line | Fallback (noun unresolved) |
|---|---|---|
| `remove_condition` | Ends {Name}'s {Condition}. | Ends one of {Name}'s conditions. |
| `spawn_artifact` | Leaves {an item} for {Name} to find. | Leaves an item for {Name} to find. |
| `assign_ambition` | Wakes an ambition in {Name}: {Ambition}. | Wakes a new ambition in {Name}. |
| `plant_compulsion` | Plants an urge in {Name} toward {the way of Gold}. | Plants a new urge in {Name}. |
| `emit_omen` | Plants an omen: what {Name} meets next bends toward it. | (same) |
| `favor_creation` | {Name} owes you a favour. | (same) |
| `hidden_mark` | Leaves a hidden mark on {Name}. | (same) |
| `spell_grant` | {Name} learns {Spell}. | {Name} learns a working. |

- **C2 — blocked reason** `no_target: 'Nothing here for it to end'` in `NUDGE_BLOCKED_REASONS` (`nudge-stage-content.ts:237`), the table is keyed on the code union so it is required. Designer view only, like the other withheld codes.
- **C3 — tooltip** `ui.card.result`: *"What this card does to the world when it is played. It does not move the odds."* The result line wears it.
- No authored card line changes.

## UI pillar

- **U1 — Result line zone** in `CardFace.tsx`, in the odds slot (`:727`), drawn when `model.resultLine` is set and `model.odds` is not a delta. Same size as the effect line, `--text-primary` not whisper (Law 45: it carries information), the mortal's name a plain word.
- **U2 — Price row.** Remove the `SphereIcon` from the price group (`:540-544`). Move `ReachIcon` to the kind group with the reach word at chip size, wrapped in `reach.<name>`. `actionCardModel.ts` sets `costSphere: slot.sphere` when `essenceCost > 0`.
- **U3 — One kind chip.** `actionCardModel.ts` stops setting `secondaryKeyword`. `ui.card.verb.*` descriptions stay; the verb chip's tooltip id becomes a composed entry, `ui.card.verb.<crud>.<scale>`, generated like `buildCardKeywordTooltips` from the two existing rows (scale sentence first), each ≤200 characters (Law 18).
- **U4 — Withheld card** needs no UI: the withheld path already exists. A hand that loses Balm deals one card fewer (no refill), as a `trait_missing` loss does today.
- Laws engaged: 9, 10, 11, 12, 13, 14, 17, 18, 45, 56. Browser-verify: Playwright DOM on `?view=game&seeded&size=medium&forceencounters`, a step whose hand holds a non-odds card and a Boost.

### Player-facing text

| Surface | Exact text the player reads | Complaint class | How the player understands it |
|---|---|---|---|
| Result line (nudge card, odds slot) | "Ends Elara's Wounded." · "Leaves a keepsake for Elara to find." · "Wakes an ambition in Elara: Raise a Hall." · "Plants an urge in Baldur toward the way of Gold." | PC-1, PC-8 | The line itself is the explanation; its hover (`ui.card.result`): "What this card does to the world when it is played. It does not move the odds." |
| Price row, action card | "✦✦ Force" (was "✦✦" beside a red circle) | PC-1 | The pool word names who pays; `ui.card.cost` hover unchanged: "Each ✦ is one measure of essence, drawn from the pool of the sphere beside it…" (the executor drops "beside it" → "named after it") |
| Reach chip, action card | "Iron" with the Iron mark | PC-1 | `reach.iron` hover (existing) |
| Verb chip hover, action card (`ui.card.verb.update.local`) | "A working the size of one place. This working takes something that already exists and bends it — a mortal's intent, a place's fortune, a faction's standing." | PC-1 | Replaces the separate "Local" chip the veteran could not read |
| Aftermath chip after a played card | a gain chip in the existing anatomy naming the thing and the mortal, e.g. "Wounded — gone from Elara ▲" (exact tag word from `buildAftermathConsequences`'s `trait` gain row) | PC-8 | The paid card answers in the ending, naming the mortal and the thing |

PC-1 is owed the exact words and where the explanation lives (above). PC-8 is owed the reply within a second: on play, the card's result line was already on the face; at the ending, the chip.

### Playtest signal

A tester who plays a card that does not move the odds (Balm, Cache, Kindled ambition, Compulsion) can say, in their log, what it did and to whom.

### Event notifications

N/A — no toast or chronicle line; the reply is the face and the Aftermath chip.

### Debug inspection (DebugPanel)

`await window.__DEBUG.getStage()` shows each card's `resultLine` and the withheld list with `no_target`; `nudgeWrites` is on the action record in the debug state.

### Visual presence (HexMapV2)

N/A — no map change.

## Blast Radius

`src/types/unifiedAction.ts` is imported by 721 files. The change is one **optional** field on the action, `nudgeWrites?`, beside `stepCasts?` (`:3480`), plus its record type. Nothing existing reads it; the only reader is the new `buildNudgeWriteChanges`. The precedent is the same shape: `stepCasts` is read in six non-test files (`chapterArchive.ts:313`, `buildStepCastModel.ts`, `buildUnifiedEncounterStageModel.ts`, `unifiedActionResolution.ts`, `debug-bridge.ts`, `debug-bridge.d.ts`) and pinned by one test (`stepCast.thr1670.test.ts`). A save or an action made before the change has no `nudgeWrites` key and reads as "no card writes", which is today's behaviour; under `exactOptionalPropertyTypes` the writer omits the key rather than setting `undefined`. The chapter archive does not copy it: its replay keeps the Aftermath it showed at the time, and E3 is a forward-only change. No test pins the action's full key set. This is a `src/types/` change, so the PR passes the `review-gate` skill before arming auto-merge.

## Interface impact

| Contract | Change |
|---|---|
| `dispatchNudgeCommitments` → `UnifiedAction.nudgeWrites` (new optional field) | add: written in `autonomous_aftermath`, read by `buildUnifiedEncounterStageModel` via `buildNudgeWriteChanges` (the `stepCasts.writes` shape) |
| `NudgeBlockedCode` | extend: `no_target` |
| `CardFaceModel` | extend: `resultLine?`; `secondaryKeyword` stays in the type, unused by the action card |

## Wiring

| Module | Phase | UI | Trace | Debug |
|---|---|---|---|---|
| E1 `no_target` | render-time hand build | withheld | none (view) | deal report unchanged; `await __DEBUG.getStage()` lists it under withheld |
| E2 `resultLine` | render-time view | U1 | none | visible in the Stage view model |
| E3 `nudgeWrites` | `autonomous_aftermath` | Aftermath chips | existing `nudge_dispatch_failed` on throw (record built inside its `try`) | action record in debug state |

Checked against `Docs/plans/wiring-checklist.md`: one new module (`buildNudgeWriteChanges`, a view helper) and one new optional state field (`UnifiedAction.nudgeWrites`, serialised with the action like `stepCasts`); no new phase or prose-pipeline hook. `Docs/canon/interface-map.md` + `scripts/interface-contracts.ts` gain the new write → read row. Wiki: `public/nudge-cards-reference.html` (freshness source `nudge-card-library.ts` / `nudge-card-display.ts`) gains the result-line table.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `NUDGE_GRANT_RESULT_LINES` | table above | the result line per grant kind |
| `EFFECTS_LINE_MAX_CHARS` | 140 (existing) | caps the result line too |

## Tracing

N/A — no new trace type. E3 reuses the aftermath mutation summary, which already traces each write (`encounterAftermath.ts`, e.g. `remove_condition[i]: removed N edge(s)`).

## Fail-soft table

| Failure | Fallback |
|---|---|
| Target unresolved at hand build | no `no_target` block; the card plays as today |
| Grant noun does not resolve | the kind's fallback line, one warning |
| Unknown grant kind at runtime | no result line; the card renders as today |
| Condition removed between view and play | the remover finds nothing and raises nothing (existing) |
| Building `nudgeWrites` throws | it is built inside `dispatchNudgeCommitments`' existing `try` (`nudgeDispatch.ts:250-264`) and returned beside `mutationSummary`, so the throw emits `nudge_dispatch_failed` and no record is written; the ending shows the encounter's own chips |
| A `nudgeWrites` entry's target or ref no longer resolves | `buildNudgeWriteChanges` skips it (fail-open, like `buildCastChanges`) |

## Kill criteria

If round 7 still lists Balm, Cache or Kindled ambition under "never understood" with the result line on screen, the line is not being read: move it above the effect line. If a tester reads the reach word as a second price, put it back to icon-only and re-test.

## Three-pillar check

- [x] Engine pillar present (E1–E3)
- [x] Content pillar present (C1–C3)
- [x] UI pillar present (U1–U4)
- [x] Wiring section connects them

## Vision audit

- [x] No premise contradicted. The taste profile's prose-first, no-numbers UI holds: the result line is words. Narrative over mechanics holds: the authored line stays as the card's voice.
- [x] No Vision edit needed.

## Rulebook impact

- [x] No rule of play changes: Balm already did nothing on an unhurt mortal; now it is withheld, as a card the mortal cannot carry already is.
- [x] No `Docs/canon/rulebook.md` edit is needed.

> Brainstorm companion: `Docs/plans/2026-11-02-thr-2146-every-card-says-what-it-buys-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | lines in one data table; no new number |
| 2. Inspectability | PASS | blocked code and result line in the stage model; writes already traced |
| 3. Determinism | PASS | no PRNG; deal unchanged |
| 4. Fail-soft | PASS | table above |
| 5. Narrative over mechanics | PASS | authored line kept |
| 6. Additive | PASS | new optional fields and one code; no export removed |
| 7. Performance | PASS | one edge lookup per Balm card per render |

## Done when

- [ ] A test in `src/engine/views/stage/__tests__/` builds a step with Balm on an unhurt actor and asserts Balm is in `withheld` with `blockedCode === 'no_target'` and not in `cards`; with a Wounded actor it asserts the card is playable with `resultLine === "Ends <Name>'s Wounded."`.
- [ ] A test plays one library card of each grant kind in C1 (except `hidden_mark`) on the cold fixture and asserts a `nudgeWrites` entry and an Aftermath consequence naming the mortal and the thing (E3); Balm on a Wounded actor yields exactly one entry, and a forced `removedCount` 0 yields none.
- [ ] `grep -n "SphereIcon" src/components/shared/CardFace.tsx` shows no use in the price group; an action-card test asserts the pool word renders and `action-card-scale-*` does not.
- [ ] `tooltipValidation.test.ts` passes with the new ids; `NudgeCard.snapshot.test.tsx` is regenerated with the price-row change named in the PR.
- [ ] Browser evidence (visible change, four parts): a 1920×1080 screenshot of a hand with a result-line card and the new price row; console clean; `await window.__DEBUG.getStage()` showing a `resultLine` on that card; a UI-Laws line for Laws 1, 11, 12, 13/14, 17, 21, 33, 37, 45, 56.
- [ ] `npm run gate` green.

## Coordination block

**Suggested model:** opus. Three layers (view, face, aftermath record) and a pinned snapshot. The PR touches `src/engine/` and `src/types/`, so it passes `review-gate` before auto-merge.
**Parallel-safe with:** [the aftermath and the mortal's sheet disagree](https://linear.app/threadbare/issue/THR-2139) (chip wording, not chip sources), the story-text tickets THR-2108 / 2109 / 2110 (data only), [Legibility 1](https://linear.app/threadbare/issue/THR-2122) (`Section.tsx`).
**Mutex with:** [Legibility 3, the Stage and dialogs](https://linear.app/threadbare/issue/THR-2124) if it edits `NudgePhaseShell.tsx`; anything editing `shared/CardFace.tsx` or `phaseAutonomousAftermath.ts`.

**Files to touch:** `src/types/unifiedAction.ts` (one optional field), `src/engine/encounters/nudgeDispatch.ts`, a new `src/engine/views/stage/buildNudgeWriteChanges.ts`, `src/engine/views/stage/buildUnifiedEncounterStageModel.ts`, `src/data/nudge-stage-content.ts`, `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`, `src/engine/encounters/nudges.ts`, `src/engine/views/stage/buildNudgePhaseModel.ts`, `src/engine/phases/phaseAutonomousAftermath.ts`, `src/data/nudge-card-display.ts`, `src/data/ui-content.ts`, `src/components/shared/CardFace.tsx`, `src/components/Game/actionCardModel.ts`, `src/components/Game/encounter-stage/shells/NudgePhaseShell.tsx`, their tests, `public/nudge-cards-reference.html`.

## Notes for the executor

- Card verb glyphs wait on Christian's carved-shape pick ([THR-1908](https://linear.app/threadbare/issue/THR-1908)); do not change them.
- SCAR / BOND / BOON / PATH being "too much to take in" is the Aftermath, not the card; out of scope.

## Forked-audit verdicts

### NFP audit

PASS-with-notes. Tunability, Determinism, Narrative and Performance PASS. Three notes on the first draft:
- Inspectability: E3 named a carrier field that does not exist.
- Fail-soft: the "summary merge throws" row sat outside the dispatch `try`.
- Additive: E3 needs a new state field the wiring note denied.

**Answer:** all three fixed. E3 now stores `UnifiedAction.nudgeWrites`, built inside `dispatchNudgeCommitments`’ existing `try` and following the `stepCasts.writes` precedent. The fail-soft table has two rows for it, and the wiring note names the new field.

### Three-pillar audit

Run 1, FAIL: the UI pillar had no Player-facing text table and no Playtest signal; Event notifications, Debug inspection and Visual presence were not marked. Run 2, FAIL: the Blast Radius section was missing for `src/types/unifiedAction.ts` (about 700 importers). Run 3, PASS-with-notes: all three pillars substantive, no section missing. Notes taken: the stepCasts reader count is corrected; the Blast Radius stays prose (one field, one reader).

### Vision audit

PASS-with-notes. No contradiction. Core loop, non-negotiables #2 and #3, and the taste profile (prose-first UI, sphere tint) are all confirmed. Design tension #4 moves toward legibility, inside the stated need. Note: the ambition and compulsion result lines should keep the mortal’s sovereignty visible.

**Answer:** both lines now say what the god does ("Wakes an ambition in Elara: …", "Plants an urge in Baldur toward …").

### Intent-judge verdict

**Allow** on the third run (impact class Reversible, judge-confirmed; 0 GAPs, 0 VIOLATIONs).
- Run 1, Revise: dimension 12 (no Player-facing text or Playtest signal) and dimension 4 (`quintessence_shift` had no row in a table keyed on the full union). Both fixed: the table and the predicate were added, and C1 keys on `ResultLineGrantKind`.
- Run 2, Revise: dimension 9 (no Blast Radius for a 721-importer type file). Fixed: the section was added and `review-gate` named.
- Run 3, Allow. The judge asked that two choices go to Christian as veto lines, not asks: D2 (a card with nothing to act on is withheld, one card fewer) and `hidden_mark` leaving no Aftermath chip.
