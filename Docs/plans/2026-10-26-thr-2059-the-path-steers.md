> **title:** `The path you chose steers what comes next — THR-2059`
> **linear_issue:** THR-2059
> **author:** `Claude Code` (design lane, run 2026-10-26d, unattended)
> **created:** 2026-10-26
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# The path you chose steers what comes next — THR-2059

*Round 5's skimmer named The First "the unseen blade", then was offered Forage, Take Stock and Shore Up Shelter by God's Will, paid for "Service a Dead Drop", never heard of it again, and watched her haggle at a market stall. This plan makes God's Will offer only work that becomes a chapter, makes every compelled piece of work say how it ended, and gives the chosen path a bounded lean on The First's chapters.*

## Why this is load-bearing

The bond promises a future: *"Morthane will become the unseen blade"* (`FIRST_PATH_BOND_LINE`, [THR-1988](https://linear.app/threadbare/issue/THR-1988)). Law 45 says the game never promises what the world will not do. Today three things break that promise. All were measured on `origin/main` @ `fc447b8d`:

1. **God's Will offers chores.** `buildCompulsionEvent` (`src/engine/premonitionCompulsion.ts:144-167`) takes the top four of `decision.topCandidates`, filtered only against the scene about to start and the steer already held (`phaseAgentDecision.ts:1760-1767`). Nothing filters routine work (`isRoutineTemplate`, `attentionCadence.ts:47`). Forage, Take Stock and Shore Up Shelter are all `threatRating: 'trivial'`, so they are `routine: true` (`encounter-content.ts:449`).
2. **A compelled chore runs silently.** "Service a Dead Drop" is `threatRating: 'trivial'` (`encounter-content.ts:14150`), so it is routine. When the compulsion is taken, the player gets *"Your will holds: Morthane turns to Service a Dead Drop."* (`premonitionSteer.ts`, `compulsionOutcomeMessage`). Then the scene runs as daily life: it raises no chapter and sends no notification (`attentionCadence.ts:6-12`). No line ever says how it ended. The skimmer's *"I chose 'Service a Dead Drop'… now my assassin is haggling"* is this gap.
3. **Nothing leans toward the path.** `firstPath.ts` is the only reader of the choice, and it adds one recall line to the first chapter. The trade's lean, `computeRoleAffinityMultiplier` (`encounterScoring.ts:1165`), multiplies `finalScore` (`:1540`). The live decision board scores `valuePerTick × desireMultiplier × forecastFit × arrivalCommitment × appointmentDiscount × whisperPull × encMeans` (`decisionBoard.ts:668-669`) and never reads `finalScore` (the same note is in `premonitionSteer.ts:9-10`). So a lean placed only in `finalScore` steers God's Will's ranking but not The First's own choices. The paid whisper solved this by riding on the candidate (`whisperPull`); the path follows that shape.

**Census** (esbuild bundle of `UNIFIED_ACTION_TEMPLATES`, 571 encounter-shaped templates, 539 story and 32 routine). A path is two Reaches: the vision's `requiredPrimaryReach` (who she is) and its `reachInvestment` (what she becomes). Story scenes whose main Reach is one of a path's two Reaches: 83 (Anchorite, star + veil) to 204 (Blade without equal, iron + eye). For **Unseen blade** (shadow + iron) it is 178 of 539. The scene cache keeps only a scene's main Reach (`encounterCache.ts:318-319` sets `reachSecondary: tmpl.reach`), so the main Reach is the only signal a candidate carries.

**Decided by the design lane under delegation (process.md rule 4), invited for veto in the run report:**

1. **God's Will offers only work that becomes a chapter.** Routine templates never appear as options. Offers are filled from the full ranked list when the top five hold fewer than `COMPULSION_CANDIDATE_COUNT` story scenes. With fewer than `COMPULSION_MIN_STORY_OPTIONS` (2) there is no offer at that decision, and the cooldown is not stamped. *Veto:* "God's Will may offer chores".
2. **Compelled work always says how it ended.** When a compelled scene resolves, one toast names the mortal, the scene and the band: *"Your will is done. Service a Dead Drop: Morthane held."* The band word is the game's one band lexicon (`stepOutcomeWord`), the same word the chapter's own cards show. This is in addition to today's *"Your will holds"* line at the start. It fires for routine work too (an old save, a debug force), because a paid steer is never silent. *Veto:* "the start line is enough".
3. **The chosen path leans The First's chapters, bounded.** A scene whose main Reach is one of the path's two Reaches carries `firstPathPull = 1 + FIRST_PATH_PULL` (0.5, so ×1.5). It is multiplied into the live board score and into `finalScore`, so her own choices and God's Will's ranking agree. Only The First carries it, and only after the bond. It is smaller than the trade's lean (×1.4 on primary) plus the arrival commitment (×2.5), and far below a paid whisper (×(1 + 4 × strength)). Novelty and share ceilings still apply after it. *Veto:* "the path should only lean God's Will" / "the lean should be stronger".
4. **An option that fits the path says so.** A God's Will option carrying the pull shows one line: *"Fits the unseen blade."* The line is backed by state (`fitsPath` on the candidate, Law 56). *Veto:* "no label".

**Rejected:** a filter that makes God's Will offer *only* path-shaped work. With 83 path scenes out of 539 for some paths, a filter would empty the modal on most decisions, and it would decide for the mortal (Law 11). A lean keeps her own values in charge.

**Not in this plan:** path words used as God's Will labels (*"drawn toward The way of Veil calls"*). That is [THR-2057](https://linear.app/threadbare/issue/THR-2057) item 1. **Finding, filed separately:** the trade's lean (`roleAffinityMultiplier`) never reaches the live board (§ Done when).

## Substrate inventory

No new system, node type, edge type or tick phase.

| Existing subsystem | Status | This plan |
|---|---|---|
| Compulsion builder (`buildCompulsionEvent`, `premonitionCompulsion.ts`; call site `phaseAgentDecision.ts:1739-1785`) | 🟢 ACTIVE | **extends**: routine filter, fill from ranked, minimum |
| Compulsion resolution (`resolveCompulsion`, `compulsionOutcomeMessage`, `premonitionSteer.ts`; override `phaseAgentDecision.ts:1787-1858`) | 🟢 ACTIVE | **extends**: the action records that it was compelled |
| Chapter archive (`buildChapterRecord`, `chapterArchive.ts:128`; archive site `orchestrator.ts:4321-4339`) | 🟢 ACTIVE | **extends**: one optional field, one toast at archive |
| First path (`getFirstPathFromGraph`, `firstPath.ts`; `SPARK_VISION_CATALOG`, 24 visions) | 🟢 ACTIVE | **extends**: a pure `firstPathPullFor` |
| Decision board (`decisionBoard.ts:655-690`, candidate multipliers `whisperPull`, `appointmentDiscount`) | 🟢 ACTIVE | **extends**: one more candidate multiplier |
| Daily life (`isRoutineTemplate`, `attentionCadence.ts:47`) | 🟢 ACTIVE | **read only** |

## Blast Radius

Three touched files have 100 or more importers (grep of `from '…/<file>'` across `src/` and `scripts/`): `types/unifiedAction.ts` (716), `types/trace.ts` (156), `engine/orchestrator.ts` (152). Each change is narrow:

- `types/unifiedAction.ts`: one **optional** field (`compelledByGod?: true`). No existing reader changes, and no existing literal needs it.
- `types/trace.ts`: one union member added to `CompulsionOutcomeTrace.outcome` and one optional field. An exhaustive `switch` over that union (if any; `grep -rn "lapsed_unavailable" src`) gains a case.
- `engine/orchestrator.ts`: one block inside the existing `newlyArchived` loop (`:4334-4339`), wrapped in its own `try`.

Everything else touched has 15 or fewer importers.

## Engine pillar

**E1. Story-only offers.** In `buildCompulsionEvent`, drop candidates where `isRoutineTemplate(entry.templateId)`. The call site passes a second list, `decision.rankedCandidates`, with the same two exclusions (the scene about to start, the held steer). The builder fills from it, after the top list and deduplicated by template, up to `COMPULSION_CANDIDATE_COUNT`. If fewer than `COMPULSION_MIN_STORY_OPTIONS` survive, it returns `null`. The call site already stamps `lastCompulsionTick` only when an event is returned. The emission gate `decision.topCandidates.length > 1` stays.

**E2. Compelled actions carry a mark.** When the override takes a compulsion (`compulsionOverrode`), the created `UnifiedAction` gets `compelledByGod: true` (a new optional field on `UnifiedAction`, `types/unifiedAction.ts`). `buildChapterRecord` copies it as `compelled?: true` onto `ChapterRecord` (`types/chapterRecord.ts`).

**E3. The done line.** At the archive site (`orchestrator.ts`, the `newlyArchived` loop), for each record with `compelled`, push one event `divine_steer_done_<actionId>` (`type: 'divine_premonition'`, `notification: { channel: 'toast' }`, `isInterventionBeat: true`, `actorId`). Its message is `compulsionDoneMessage(actorName, templateName, outcome)` from `premonitionSteer.ts`. It emits `CompulsionOutcomeTrace` with the new outcome `'done'` and a `band` field.

**E4. The path pull (pure).** In `firstPath.ts`:

```ts
/** ×(1 + FIRST_PATH_PULL) when the scene's main Reach is one of the path's two; else 1. */
export function firstPathPullFor(path: FirstPath | null, entryReach: ReachDomain): number;
```

`FirstPath` gains `requiredReach: ReachDomain` (from `vision.requiredPrimaryReach`). In `phaseAgentDecision.ts`, beside the whisper pull (`:1245`), when the actor is The First (`firstThread(...).target === agentId`), each candidate whose pull is above 1 gets `firstPathPull` on the candidate and a scaled `finalScore`. Then the ranked list is re-sorted and the top five recut, the same steps `applyWhisperPull` takes (`premonitionSteer.ts:123-140`). The board multiplies `(candidate.firstPathPull ?? 1)` into its encounter score and records it on the entry, as it does `whisperPull`. `CompulsionCandidate` gains `fitsPath?: true` when the pull is above 1.

**PRNG:** none added. The pull is a pure function of the stored path and the template's Reach.

## Content pillar

**C1. The done line** (`src/data/premonition-content.ts`, `COMPULSION_DONE_LINE = '{lead} {encounter}: {name} {word}.'`). There are two leads and no new band words:

| Outcome | `{lead}` | `{word}` (from `stepOutcomeWord`, `outcome-band-content.ts:173`) |
|---|---|---|
| critical_success | Your will is done. | triumphed |
| success, contested_won | Your will is done. | held |
| success_at_cost | Your will is done. | held at a cost |
| failure, contested_lost | Your will was not enough. | broke |
| critical_failure | Your will was not enough. | collapsed |
| unknown / missing | Your will is done. | unfolded (`OUTCOME_BAND_WORD_FALLBACK`) |

`contested_won` and `contested_lost` are `UnifiedActionOutcome` values that `StepOutcome` lacks, so they are mapped to `success` and `failure` before the lookup. `OUTCOME_BAND_WORDS` calls itself "the single source for band→word; do not fork a second lexicon", and the notification cards and step navigator already use it, so the toast's word matches the chapter's own word for the same band. `{encounter}` is the scene's player-facing name from `resolveCompulsionEncounterName`, the same name the start line uses. It stands as a label before the colon, so a verb-phrase name ("Service a Dead Drop") and a noun name ("The Haggle") both read correctly. Rendered: *"Your will is done. Service a Dead Drop: Morthane held."*, *"Your will was not enough. The Haggle: Morthane broke."* The leads follow the shipped *"Your will holds / fades / finds no purchase"* family. No new UL term.

**C2. The fit line:** `FIRST_PATH_FIT_LINE = 'Fits {path}.'`, filled by `firstPathInLine(title)`. The result reads *"Fits the unseen blade."*

No template is re-authored. The chores stay chores.


## UI pillar

*Screenshot tool: Playwright (DOM: the God's Will modal and the toast stack are DOM over the WebGL canvas).*

**UI Laws engaged** (`Docs/design-system/laws.md`): 1 (one viewport; the line adds one row inside the modal's max height), 13/14 (the line is text the player reads, not a hover), 17 (no new hue), 21 (one fact told once: the fit line is the only place the path appears on an option), 33 (state-backed), 37 (copy ≤ 15 words), 56 (the line is backed by `fitsPath`).

- **U1. The fit line.** `src/components/Game/PremonitionModal.tsx`, compulsion option row (around `:323`): when `candidate.fitsPath`, one muted line under the hook reads `FIRST_PATH_FIT_LINE`. No new chip, colour or icon.
- **U2. The done toast** uses the existing `divine_premonition` toast channel. There is no new surface.
- **U3. No chores in the modal.** No component change; E1 feeds it fewer, better options.

### Player-facing text

| Surface | Exact text the player reads | Class | How the player understands it |
|---|---|---|---|
| God's Will option, fits the path | "Fits the unseen blade." | PC-8, PC-6 | The path the player chose is the path the god's menu leans on. The words match the bond card ("will become the unseen blade") because both come from `firstPathInLine`. The same row's hook today can read "drawn toward The way of Veil calls" (THR-2057 item 1). That names a Reach, not the path, and THR-2057's fix must not put the path title in the hook, so the fit line stays the only place the path is named (see § Coordination block) |
| Toast when the compulsion is taken (unchanged, in the same tick as her decision) | "Your will holds: Morthane turns to The Haggle." | PC-8 | The push landed; she is going |
| Toast when compelled work ends (success) | "Your will is done. The Haggle: Morthane held." | PC-8, PC-6 | The paid push answers. The scene has the same name as in the start line, and the band word ("held") is the one the chapter's cards use for that band |
| Same, success at cost | "Your will is done. The Haggle: Morthane held at a cost." | PC-8, PC-6 | Same lexicon as the chapter ("held at a cost", THR-2054) |
| Same, failure | "Your will was not enough. The Haggle: Morthane broke." | PC-8 | It failed. The line says the will was not enough, not that the player chose wrong |
| Same, critical failure | "Your will was not enough. The Haggle: Morthane collapsed." | PC-8 | A bad failure, in the chapter's own word |
| Compelled mortal dies before the work resolves | no done line; the death news reports it | PC-8 | Measured: the only path that removes an unresolved action is the dead-actor sweep (`agentLifecycle.ts:672`). A living mortal's compelled work always resolves, archives and gets its line |
| God's Will modal | no Forage / Take Stock / Shore Up Shelter options | PC-8 | Every option is something that will become a chapter the player can watch |

### Playtest signal

A round-6 tester who chose a path names at least one later chapter or God's Will option that fits it, and no tester reports compelled work that vanished (the ticket's *Fixed when*).

### Debug inspection

`window.__DEBUG.forcePremonition(<firstId>, 'compulsion')` (exists) opens the modal; the queued event's `compulsionCandidates[].fitsPath` is readable from the premonition queue. Board entries carry `firstPathPull` in the decision-board trace; `getTraces` (after `enableTracing`) shows `compulsion_outcome` with `outcome: 'done'`.

**Visual presence (HexMapV2):** N/A. No map layer changes.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| E1 story-only builder | agent decision (`phaseAgentDecision`) | `PremonitionModal.tsx` | `premonitionQueue` | existing compulsion emission | `forcePremonition` |
| E2 compelled mark | agent decision (action creation) | none | `unifiedActions[].compelledByGod` | none | action in `getUnifiedActions` |
| E3 done line | resolution archive (`orchestrator.ts`) | toast stack | `chapterArchive[].compelled`, events | `compulsion_outcome` `done` | `getTraces` |
| E4 path pull | agent decision, before the board | `PremonitionModal.tsx` (fit line) | none (read from the `thread` edge) | board entry `firstPathPull` | board trace |

**Graph nodes/edges:** none new; the path is read from the existing `thread` edge's `meetingChoiceRecord`. **Tick phases:** none new.

## Interface impact

| Contract | Change |
|---|---|
| `UnifiedAction` (`types/unifiedAction.ts`) | **add** optional `compelledByGod` |
| `ChapterRecord` (`types/chapterRecord.ts`) | **add** optional `compelled` |
| `CompulsionCandidate` (`types/premonition.ts`) | **add** optional `fitsPath` |
| Board encounter candidate (`decisionBoard.ts:254-259`) | **add** optional `firstPathPull`, read in the score at `:668` |
| `CompulsionOutcomeTrace` | **extend** `outcome` with `'done'`, add optional `band` |

All are additive (NFP #6). The new write (`compelledByGod`) has its production reader in E3 (agent decision → resolution archive). S1 checks `Docs/canon/interface-map.md` for a decision → archive row and adds this field to it (and to `scripts/interface-contracts.ts`) if the row lists fields.

## Constants table

| Constant | Default | Home | Purpose |
|---|---|---|---|
| `FIRST_PATH_PULL` | 0.5 | `src/data/premonition-constants.ts` | The path's lean on a scene in one of its two Reaches (×1.5) |
| `COMPULSION_MIN_STORY_OPTIONS` | 2 | same | Below this many story options, God's Will does not offer |
| `COMPULSION_CANDIDATE_COUNT` | 4 (existing) | same | Options shown, now filled from the ranked list |

## Tracing

```ts
// types/trace.ts — CompulsionOutcomeTrace (extended)
outcome: 'taken' | 'lapsed_expired' | 'lapsed_unavailable' | 'done';
/** The compelled scene's band, on 'done' only. */
band?: UnifiedActionOutcome;
```

The board entry's `firstPathPull` is the inspection surface for E4 (it sits beside `whisperPull` in every board trace). No new trace category.

## Fail-soft table

| Failure | Fallback |
|---|---|
| No path (pre-THR-1988 save, dev seed without a vision) | `firstPathPullFor(null, …)` → 1; no fit line |
| Unknown vision id or template Reach | pull 1 |
| Fewer than 2 story options | No offer this decision; cooldown not stamped; next decision tries again |
| Compelled mortal dies before archive (the only unresolved removal, `agentLifecycle.ts:672`) | No done line; the death news stands; trace absent |
| Missing or unmapped outcome on the record | "Your will is done. {encounter}: {name} unfolded." (C1 fallback) |
| Any throw in E1/E3/E4 | Caught at the existing `try` around each block; the decision proceeds |

## Three-pillar check

- [x] Engine pillar present: E1–E4 (story-only offers, compelled mark, done line, path pull)
- [x] Content pillar present: C1 the done line on the shared band lexicon, C2 the fit line
- [x] UI pillar present: U1–U3, player-facing text table, Playwright DOM evidence
- [x] Wiring section connects them: wiring table with GameState fields, interface rows, debug levers

## Vision audit

- [x] No Vision premise contradicted. It serves the north star (the mortal feels like a person, and the bond's "will become" is kept, Law 45) and non-negotiable #1 (the path is a lean on her own choice, not a filter; compelled work answers, so the thread runs both ways). Compulsion itself is unchanged (THR-1781, Law 9).
- [x] No Vision edit needed. Noted lean toward legibility (tension #4): the fit line tells the player which option the path favours, in prose, with no number. The weight itself stays hidden.

## Rulebook impact

- [x] `Docs/canon/rulebook.md` does not describe the God's Will offer yet (its only "compulsion" is the *Divine Compulsion* casting in §4). S1 adds to §4 *What You Can Do*: *"When a threaded mortal is about to choose, God's Will may offer you their next few chapters to push toward. It never offers a chore, and when the work is done you hear how it went."*
- [x] S1 adds to §7 *Your first encounter — Meet The First*, after the path: *"Her chapters lean toward the path you chose."*

> Brainstorm companion: `Docs/plans/2026-10-26-thr-2059-the-path-steers-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Two new named constants; the existing count reused |
| 2. Inspectability | PASS | `firstPathPull` on every board entry; `done` trace with band |
| 3. Determinism | PASS | No PRNG; pure pull; fill order is the ranked order |
| 4. Fail-soft | PASS | Table above; every block keeps its `try` |
| 5. Narrative over mechanical perfection | PASS | The bond's promise is kept; paid work answers |
| 6. Additive over destructive | PASS | Optional fields and one union member only |
| 7. Performance budget | PASS | One lookup per candidate per decision, plus one re-sort of the ranked list (as the whisper pull does), for The First only |

## Done when

One build ticket and one bug, filed in *Cold playtest · round 5*:

**S1: [God's Will offers story, compelled work answers, the path leans](https://linear.app/threadbare/issue/THR-2068)** (E1–E4; C1, C2; U1–U3). Also: a unit test that a *routine* compelled action still archives a record and gets its line (`buildChapterRecord` can return null at `orchestrator.ts:4324`).
- [ ] Unit test: `buildCompulsionEvent` with a top list of three chores and two story scenes, plus a ranked list holding two more story scenes, returns four story options and no chore; with one story scene in total it returns `null`.
- [ ] Unit test: a compelled action resolving at each band archives `compelled: true` and pushes exactly one `divine_steer_done_*` toast with the C1 line.
- [ ] Unit test: `firstPathPullFor` returns 1.5 for each of Unseen blade's two Reaches and 1 for gold; a board fixture shows a shadow scene outranking a gold scene of equal EVT for The First, and not for a retinue mortal.
- [ ] A 30-tick CLI smoke passes; a seeded browser run (`?view=game&seeded&size=medium`, `window.__DEBUG.tick(600)`, tracing on) shows `firstPathPull` on board entries and no routine template in any compulsion event.
- [ ] The two rulebook sentences are added, and the wiki page whose `sources` match is updated.
- [ ] Four-part browser evidence at 1920×1080: a forced compulsion with a fitting option shows "Fits the …", and the done toast appears when it resolves; `npm run gate` green; review gate passed.

**Bug (finding): [the trade's lean never reaches the live board](https://linear.app/threadbare/issue/THR-2067).** `roleAffinityMultiplier` lives only in `finalScore` (`encounterScoring.ts:1540`), which the board does not read (`decisionBoard.ts:668-669`). So THR-1984's lean steers God's Will's ranking and the legacy pick, not The First's own choice. Fix: ride it on the candidate like `firstPathPull`.

This ticket (THR-2059) closes when both are filed into the milestone, as THR-2058 did.

## Coordination block

**Suggested model:** opus. It touches `phaseAgentDecision.ts`, the board and `types/unifiedAction.ts`, all wide-blast, and needs the review gate (`src/engine/`, `src/types/`).

**Parallel-safe with:** [THR-2061](https://linear.app/threadbare/issue/THR-2061) (essence readouts, UI files only).

**Mutex with:**
- [THR-2057](https://linear.app/threadbare/issue/THR-2057): both edit `PremonitionModal.tsx` and `premonitionCompulsion.ts` (the compulsion option row and its label). Its item 1 hook fix names a Reach, never the path title, so "Fits {path}." stays the only path wording on the row (PC-6).
- [THR-2060](https://linear.app/threadbare/issue/THR-2060): `debug-bridge.ts` only (a one-line merge).
- [THR-2067](https://linear.app/threadbare/issue/THR-2067) (the role-lean bug): both add a candidate multiplier in `decisionBoard.ts` and `phaseAgentDecision.ts`.

**Blocked by:** none.

**Files to touch:** `src/engine/premonitionCompulsion.ts`, `src/engine/premonitionSteer.ts`, `src/engine/phaseAgentDecision.ts`, `src/engine/firstPath.ts`, `src/engine/decisionBoard.ts`, `src/engine/chapterArchive.ts`, `src/engine/orchestrator.ts` (archive loop), `src/types/unifiedAction.ts`, `src/types/chapterRecord.ts`, `src/types/premonition.ts`, `src/types/trace.ts`, `src/data/premonition-constants.ts`, `src/data/premonition-content.ts`, `src/components/Game/PremonitionModal.tsx`, `Docs/canon/rulebook.md`, tests beside each.

## Kill criteria

- Round 6: if a tester who chose a path still names no fitting chapter or option, raise `FIRST_PATH_PULL`, or move to authored per-vision tags (brainstorm option D).
- If a tester reports The First "only ever does one kind of thing", lower `FIRST_PATH_PULL`.
- If God's Will stops appearing for long stretches (the `COMPULSION_MIN_STORY_OPTIONS` gate), measure the emission rate in a 600-tick run and lower the minimum to 1.

## Notes for the executor

- Re-sort after scaling `finalScore` exactly as `applyWhisperPull` does, or the compulsion builder reads a stale top five.
- `isRoutineTemplate` fails toward story for an unknown id. Keep it that way.
- Do not add the pull to retinue mortals; the path is The First's.
- Do not change the "Your will holds" start line.

## Intent-judge verdict

**Allow** (rev 3), Reversible, 0 findings. Rev 1 was **Revise** on four findings: no Player-facing text or Playtest signal, a done line with a template seam and two sample shapes, and kill criteria only in the proposal. Rev 2 was **Revise** on three dimension-12 GAPs: what the player reads if compelled work is dropped, the band words not matching the chapter's own, and the fit line beside THR-2057's hook. All were fixed: the done line now uses the shared `OUTCOME_BAND_WORDS` lexicon, and the unresolved-drop path was measured (dead-actor sweep only). Rev 3 advisories (the routine-record test; the bug's ticket link) are folded into § Done when and § Coordination block.

## Forked-audit verdicts

The three auditors ran on the first draft. The revisions after them added sections and reworded the done lines (the judge's Revise). No decision changed, and each auditor's notes are answered in the current text (marked → below).

### NFP audit

**PASS-with-notes.** 1 PASS (named constants with homes). 2 PASS-with-note: the interface-map update was conditional, and the decision → archive read may go unverified (→ Interface impact now has S1 check and add the row). 3 PASS (no PRNG; re-sort follows `applyWhisperPull`). 4 PASS (fail-soft table covers no path, unknown id, too few options, pruned action, missing band, throws). 5 PASS (backs the bond's promise; a lean, not a filter). 6 PASS (optional fields, one union member; exhaustive-switch note flagged). 7 PASS: the re-sort was not costed, a minor gap (→ NFP row 7 now names it).

### Three-pillar audit

**PASS-with-notes.** Engine and Content: present and substantive. UI: present but thin. It had no Player-facing text table, complaint-class check or Playtest signal, and no GameState column in Wiring (→ all added). Graph nodes/edges, tick phases, debug inspection and HexMapV2 visual presence were only implied (→ stated). The Coordination block had no "Files to touch" list (→ added). Substrate check: extends or reads ACTIVE subsystems only, with no green-field duplication.

### Vision audit

**PASS-with-notes.** No contradictions. Confirmed: north star (paid steers stop vanishing; the bond's promise is backed), the core loop (offer → chapter → done toast in aftermath), non-negotiable #1 (a lean on her own values; filter rejected on Law 11; compulsion predates the plan), #3 (prose, not numbers), and the taste profile (no numbers, austere copy). Notes: "Your will is done" leans slightly commanding, but it follows the shipped "Your will holds / fades" family. The fit line leans toward legibility (tension #4) without flagging it (→ flagged in § Vision audit).
