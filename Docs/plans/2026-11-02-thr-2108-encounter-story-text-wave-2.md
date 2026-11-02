> **title:** Encounter story text, wave 2 — the next twenty board encounters players meet, plus three missing their result lines, rewritten to Prose Doctrine v2 — THR-2108 (slice 2a), THR-2128 (slice 2b)
> **linear_issue:** THR-2108
> **author:** Claude Code (design lane, run dl-20261102T0218Z, unattended)
> **created:** 2026-11-02
> **three_pillars:** Engine N/A — data only, through the converter path slice 1 used · Content done — 23 templates rewritten from scratch in two slices, slice 1's residue fixed, a board exemplar named · UI N/A — no new surface; the text renders in the existing encounter stage

# Encounter story text, wave 2 — THR-2108 / THR-2128

*Slice 1 rewrote the ten board encounters players meet most. The next twenty still on the retrofit list carry another quarter of every encounter met, in the same old voice. This wave rewrites them in two bounded slices, and gives the writer and the critic a board-shaped model first.*

## Why this is load-bearing

The audit ([Encounter story text quality](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md)) found 74.5% of all encounters met come from the old board (`src/data/encounter-content.ts`), written before the doctrine (patterns P1 mood writing, P2 clever specificity, P5 missing result lines). Slice 1 ([plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-31-thr-2105-encounter-story-text-slice-1.md), [PR #2672](https://github.com/christianspliid-ui/threadbare/pull/2672)) fixed the top ten. Its cold read passed the structural bar. About ten lines of residue were left, mostly in kept at-cost/critical lines and in `stakes.lost` (THR-2105 completion comment).

**Re-measured on `main` @ `fea5ff53`:** `readers/attended.ts 42,99 150` gives 1,690 encounters across 219 templates. The twenty `RETROFIT_PENDING` board templates after slice 1's ten fire **401 times (23.7%)**. With the three P5 templates, the wave covers **429 (25.4%)**. `readers/completion.ts` on the same census shows ten of the 23 lack the at-cost/critical ladder and a hand on every step. None of the 23 has an `aftermathConfig`.

## What is decided, and by whom

Carried from slice 1, unchanged: grade only against Prose Doctrine v2 (`nudge-authoring-spec.md` § Prose doctrine v2) and Christian's verdicts; **rewrite from scratch**, never edit toward the doctrine (Christian, 2026-08-25); no new cast; chip wording untouched; placement never moves.

*Lane decisions, 2026-11-02 (veto welcome):*

1. **Two slices, not one.** Twenty rewrites plus ten completions is twice slice 1's load. 2a ([THR-2108](https://linear.app/threadbare/issue/THR-2108)) takes ranks 11–20, 2b ([THR-2128](https://linear.app/threadbare/issue/THR-2128)) ranks 21–30 and the P5 three. 2b is blocked by 2a: same file, same append-only lists.
2. **The arrival line never widens placement.** Slice 1's "declare all eight classes" was right only for templates placed everywhere. Its executor found it would widen `market_day_festival`. The rule now: `locationTypes` stays exactly as it is. `settings` lists only the classes whose whole subtype list (`SETTING_CLASS_MAP`, `src/data/settingClasses.ts:57`; "all eight" is written `settings: SETTING_CLASSES`, as slice 1 did) is already inside today's placement. One opening per declared class (`validateSettingEnvelope`, `settingClasses.ts:245`, fails an opening for an undeclared class). A subtype outside every declared class gets the canonical-first opening (`compileOpeningEnvelope`, `:195`), so that line must read right there too. If no class is whole, or the fallback cannot read right across the rest, declare no `settings`. The arrival sentence then leads step 0's `narrative`.
3. **`stakes` is rewritten with the result lines.** Slice 1 kept `stakes` unless contradicted, and three of its residue phrasings came from `stakes.lost` (THR-2105 calibration comment). Each stake part now says the same thing as its band's result line, in plain words.
4. **Kept THR-1634 at-cost and critical lines are rewritten too.** Slice 1 kept them, and its first cold read found all seven of its findings there.
5. **A board exemplar: `encounter.assess_holdings`.** Slice 1's second cold read found nothing in it (THR-2105 completion comment, findings 1–10 name the other nine). It gets a row in `Docs/exemplars.md` as the board (linear-template) prose model, beside the Swollen Ford row. Writer and critic read it with the doctrine. The Swollen Ford exemplar stays the model for factory encounters.
6. **The Mason-Lord's Wall is not in this wave.** The audit counted it under P5, but it is a P4 novel-prose story beat in its own file, already scoped by [THR-2110](https://linear.app/threadbare/issue/THR-2110). Its missing lines go there.
7. **Four ranked templates are skipped:** `scout_the_perimeter` (18), `tend_to_wounds` (16), `offer_small_prayer` (16), `rest_and_reflect` (13). They are off `RETROFIT_PENDING` and already carry `settings`/`openings` from the THR-838/THR-1222 nudge migration. Their text is factory-era, which is the [factory-habits](https://linear.app/threadbare/issue/THR-2109) ticket's ground. Nothing here touches them.

## Slice 2a — THR-2108

**A0 — slice 1's residue, then the exemplar (do first).** Fix the ten residue lines THR-2105's completion comment lists (local_gossip, tend_the_weary, forage_provisions, study_surroundings, local_tales, barter_supplies, rest_and_recover, commune_with_stars), including their `stakes.lost`. Then add the `assess_holdings` row to `Docs/exemplars.md` (Kind "Encounter — board prose", Rubric "Prose Doctrine v2, linear template", Why: one quoted line).

**A1 — ten templates** (attended count; `encounter-content.ts` line on `fea5ff53`):

| Template | Line | Met | Envelope (decision 2) | Completion owed |
|---|---|---|---|---|
| `encounter.patrol_perimeter` | 8188 | 30 | all eight | — |
| `encounter.barter_with_travelers` | 11998 | 29 | all eight | — |
| `encounter.listen_for_rumors` | 8877 | 29 | all eight | — |
| `encounter.decipher_old_markings` | 9702 | 26 | all eight | — |
| `encounter.investigate_anomaly` | 12128 | 26 | all eight | ladder + `deal` on both steps |
| `encounter.forage_the_land` | 10586 | 25 | all eight | — |
| `encounter.trace_ley_lines` | 9371 | 23 | all eight | — |
| `encounter.shore_up_shelter` | 9842 | 22 | all eight | — |
| `encounter.merchants_gambit` | 732 | 22 | `urban`; oasis falls back | — |
| `encounter.shadow_in_the_night` | 12299 | 21 | all eight | — |

Ten templates, 253 encounters met (15.0%).

## Slice 2b — THR-2128

Blocked by 2a. Same rules; the writer and critic read the exemplar 2a named.

| Template | Line | Met | Envelope (decision 2) | Completion owed |
|---|---|---|---|---|
| `encounter.pickpocket` | 3238 | 18 | `urban` | — |
| `encounter.dead_drop` | 14325 | 18 | `urban`; camp falls back | ladder + `deal`, all steps |
| `encounter.rally_the_locals` | 12192 | 17 | all eight | ladder + `deal`, all steps |
| `encounter.negotiate_passage` | 14932 | 15 | none whole: step-0 lead | ladder + `deal`, all steps |
| `encounter.night_watch` | 8815 | 14 | all eight | — |
| `encounter.festival_of_spheres` | 6763 | 14 | `urban` | ladder + `deal`, all steps |
| `encounter.master_local_craft` | 12378 | 13 | all eight | at-cost + `deal`, all steps |
| `encounter.confront_the_unknown` | 12442 | 13 | all eight | at-cost + `deal`, all steps |
| `encounter.arcane_resonance_study` | 12581 | 13 | all eight | — |
| `encounter.mend_equipment` | 9776 | 13 | all eight | — |
| `encounter.master_craftsman_challenge` | 6544 | 13 | `urban` | at-cost + `deal`, all steps |
| `encounter.tribute_exchange` | 3943 | 11 | none whole: step-0 lead | ladder + `deal`, all steps |
| `encounter.vault_heist` | 3335 | 4 | step-0 lead (only `arcane` is whole; its line cannot read right at a castle) | ladder + `deal`, all steps |

Thirteen templates, 176 encounters met (10.4%). Two more retrofit templates also fire 13 times (`the_haggle`, `negotiate_dispute`). The cut took the tied ones in census-table order; those two lead the next wave.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Encounters & Dilemmas: board content, setting envelopes (THR-884), opening compile (THR-932) | 🟢 ACTIVE | extends — 23 entries adopt `settings`/`openings` under decision 2; no engine change |
| `content-eval` (`firedTemplateCompletion.ts`, `retrofitPending.ts`, `compositionContract.ts`) | 🟢 ACTIVE | extends — the completion list grows by ten, `RETROFIT_PENDING` only shrinks |
| Dealt hand (`deal` declaration, THR-1247) | 🟢 ACTIVE | extends — ten templates gain a pure-fill `deal`, no authored specials |
| Exemplar index (`Docs/exemplars.md`) | 🟢 ACTIVE | extends — one row |

## Engine pillar

N/A — no engine code. The board converter passes `settings`, `openings` and `locationTypes` and unions them for placement (`src/data/encounter-content.ts:428`), and the opening compiles above step 0 (`settingClasses.ts:173`). Slice 1's ten entries are the working precedent.

## Content pillar

For each template, in table order. The rewrite rules are slice 1's C2 points 1–7 ([slice 1 § Content pillar](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-31-thr-2105-encounter-story-text-slice-1.md#content-pillar)), with these changes:

1. **Envelope:** decision 2, as the table names it. Every opening, and every step-0 lead, is one sentence: how `{name}` came to `{location}`.
2. **Every result field is rewritten:** `onSuccess`/`onFailure` narratives, all five afterimages, and `stakes` (decisions 3 and 4). Each stake part agrees with the line of its band.
3. **Completion, where the table owes it:** the missing `successAtCostAfterimage` / `criticalSuccessAfterimage` / `criticalFailureAfterimage` on every step, and a pure-fill `deal` declaration (`count` plus context `tags` from the closed `DealContextTag` set, no specials) on every step without a hand. The at-cost line names the cost in the scene (THR-1634 [§ What "complete" means](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-28-thr-1634-finish-the-encounters-the-player-meets.md#what-complete-means)). Append the id to `FIRED_TEMPLATE_COMPLETION` under a `// THR-2108` or `// THR-2128` comment.
4. **Calibrate** on the `assess_holdings` exemplar first, then the doctrine's exemplars. Its critical failure is the shape: "The count shows a real loss: coin {actor} was sure of is gone. {actor} traces it to the last market and knows who short-changed {them}."

## UI pillar

N/A — no surface changes. Openings already render above step 0 in the encounter stage (THR-884). Every changed file is under `src/data/` or `Docs/`, outside the UI-pillar directories, so each slice closes with `Browser-verify exempt: text-only data change; the stage that renders it is unchanged`. No UI Law is newly engaged. Legibility (Laws 13/14) is what the cold read judges.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| 23 board entries (text, `settings`, `openings`, `deal`) | encounter generation and resolution (existing) | encounter stage (existing) | none new | none new | `check:encounter -- <id>`; the package view |
| `Docs/exemplars.md` row | none (authoring-side) | none | none | none | read by the writer and critic |

Wiki: if the freshness gate names a page whose `sources` include `encounter-content.ts`, `Wiki-freshness-exempt: text-only encounter rewrite` applies (placement unchanged, asserted). Systemic wiring guide: no new capability.

## Interface impact

| Contract | Change | Note |
|---|---|---|
| Encounter content → encounter cache (placement by subtype) | preserve | `locationTypes` unchanged; `settings` adds only subtypes already listed (decision 2) |
| Encounter content → dealt hand (`deal`) | preserve | uses the existing declaration shape |
| Opening coloration (`{frag:place_fact}`) | preserve | the slot stays where the compile pass writes it |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| — | — | None new. Word budgets stay `NUDGE_WORD_BUDGETS`; hand size stays `NUDGE_HAND_MIN..MAX` |

## Tracing

N/A — text and placement-neutral fields; no new decision point.

## Fail-soft table

| Failure | Behaviour |
|---|---|
| An opening for a class not in `settings` | `settingClasses.test.ts` fails the build (`validateSettingEnvelope`) |
| A `deal` tag outside `DealContextTag` | type error at `check:typecheck` |
| A token typo in rewritten prose | `check:encounter`'s enrichment dry-run fails the template |
| A subtype with no class opening | the canonical-first opening renders, as `market_day_festival`'s hamlet does today |

## Blast Radius

`src/data/encounter-content.ts` has 104 importers. Only string fields change, plus `settings`/`openings`/`deal` on 23 entries, in shapes 17 board entries already use. No exported name, type or function changes. A test that pins old wording gets its pin updated, never its intent.

## Done when

Each slice, for its own table:

- [ ] `npm run check:encounter -- <id>` for each template prints no doctrine `[warn]`; every declared class has an opening (decision 2).
- [ ] A cold critic subagent, given only Prose Doctrine v2, the `assess_holdings` exemplar and the audit's P1–P3, reads the composed text of the slice's templates (the `authoredProse` dump) and returns **zero** P1/P2/P3 findings, including on `stakes` and every afterimage. Its verdict is pasted in the PR. Slice 2a's read also covers the A0 residue lines.
- [ ] Every template in the slice is in `FIRED_TEMPLATE_COMPLETION`, and `firedTemplateCompletion.test.ts` passes.
- [ ] Placement unchanged, asserted statically: for each template, the compiled `locationSubtypes` (the union at `encounter-content.ts:428`) is the same set before and after. Then the census: on `readers/attended.ts 42,99 150`, report each template's firings before and after. A drift with an unchanged subtype set means the new `deal` hands shifted the seeded stream, not placement. Report it, do not revert.
- [ ] `RETROFIT_PENDING` does not grow, and any template that now passes is removed.
- [ ] 2a only: `Docs/exemplars.md` carries the `assess_holdings` row.
- [ ] `npm run gate` green; `npm run gate -- --final` last before push.

## Kill criteria

- If the cold read still finds P1–P3 after one rewrite round, stop. Post the findings on the slice's ticket, and do not start 2b until the design lane revises the exemplar choice.
- If any template's subtype set changes, placement changed. Revert that template's `settings`, ship its text with a step-0 lead, and report.
- If Christian vetoes the board exemplar, drop A0's exemplar row and calibrate on the doctrine alone, as slice 1 did.

## Not in this plan

The four skipped migrated templates (decision 7; [THR-2109](https://linear.app/threadbare/issue/THR-2109)). The Mason-Lord's Wall ([THR-2110](https://linear.app/threadbare/issue/THR-2110)). Any writing-check change ([THR-2106](https://linear.app/threadbare/issue/THR-2106)). The rest of the board after rank 30: a later wave, filed when 2b ships. Rejected: one slice of 23 (too long for one run); full openings for every template (it widens placement, as slice 1 found).

## Three-pillar check

- [x] Engine: N/A with rationale (existing converter path)
- [x] Content: 23 rewrites in two slices, ten completions, residue fix, exemplar row
- [x] UI: N/A with rationale; browser-verify exemption named
- [x] Wiring: table above; interface preserve ×3

## Vision audit

- [x] Serves NFP 5 and the Vision's god-reading-a-chronicle stance (doctrine v2's rule zero).
- [x] No Vision premise changes, and no edit is needed.

## Rulebook impact

- [x] `Docs/canon/rulebook.md`: none. No rule of play changes.
- [x] `Docs/canon/rulebook-quick-reference.md`: none.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | no new numbers |
| 2. Inspectability | PASS | `check:encounter`, the package view, the completion reader |
| 3. Determinism | PASS | placement unchanged by construction (decision 2) and asserted |
| 4. Fail-soft | PASS | table above |
| 5. Narrative | PASS | the whole wave is the narrative surface |
| 6. Additive | PASS | adds `settings`/`openings`/`deal`; text rewritten in place |
| 7. Performance | PASS | data only |

## Coordination block

**Blocked by:** 2a nothing; 2b by 2a ([THR-2108](https://linear.app/threadbare/issue/THR-2108)).
**Suggested model:** opus. From-scratch prose to a doctrine, judged by a cold read, plus completions.
**Parallel-safe with:** the legibility plans ([THR-2122](https://linear.app/threadbare/issue/THR-2122)–[THR-2125](https://linear.app/threadbare/issue/THR-2125), components and design-system canon), [THR-2091](https://linear.app/threadbare/issue/THR-2091) (hex push), [THR-2110](https://linear.app/threadbare/issue/THR-2110) (files under `src/data/encounters/`).
**Mutex with:** anything editing these entries in `src/data/encounter-content.ts`, the append-only `RETROFIT_PENDING` / `FIRED_TEMPLATE_COMPLETION` lists, or `Docs/exemplars.md`; [THR-2109](https://linear.app/threadbare/issue/THR-2109) if it reaches `encounter-content.ts` card lines.

**Files to touch:** `src/data/encounter-content.ts`, `src/data/content-eval/firedTemplateCompletion.ts`, `src/data/content-eval/retrofitPending.ts` (removals only), `Docs/exemplars.md` (2a), and any test that pins a rewritten string.

## Notes for the executor

- Throw the old lines out and write from the skeleton (slice 1's note stands).
- For `urban`-only envelopes the opening still reads right in a town, a city and a capital: "{name} reaches the square at {location} as the stalls open", never "the city".
- The audit's reader is a few lines over `authoredProse` (`compositionContract.ts:1925`). Bundle it with esbuild as `check:encounter` does.

## Intent-judge verdicts

**Run 1 (2026-11-02, opus, cold): Allow** (Reversible confirmed). Eleven dimensions PASS, one GAP: the census firing-count check could drift because ten new `deal` hands consume the seeded stream, which is not a placement change. *Fixed:* Done-when and kill criterion 2 now assert placement statically (the compiled subtype set, before and after); the census drift is reported, never reverted on.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-11-02*

### NFP audit

**NFP AUDIT: PASS-with-notes.** 1, 3, 4, 5, 7 PASS. **2 (note):** no trace records which hand a new `deal` step draws. *Lane response:* the dealt hand already traces its deal (THR-1247); a pure-fill declaration adds no new decision point. **6 (note):** old text is thrown out in place. *Lane response:* that is the rewrite; Christian ruled on 2026-08-25 that rewrites start from scratch, and git keeps the old text.

### Three-pillar audit

**PILLAR AUDIT: PASS-with-notes.** Engine and UI N/A with rationale; Content present and substantive (23 templates, owed completions, residue fix, exemplar row). No missing required sections. **Note:** no `Fixes` item in the Done-when. *Lane response:* deliberate; the closer belongs to each slice's executor PR, and a plan doc carries no close keyword (THR-510).

### Vision audit

**VISION AUDIT: PASS.** Confirms north star (the story the player can tell), non-negotiables 2, 3 and 7, and the taste profile's prose-first and Doctrine v2 stances. No contradictions; core loop preserved; pure-fill `deal` keeps the authored/systemic tension in check.
