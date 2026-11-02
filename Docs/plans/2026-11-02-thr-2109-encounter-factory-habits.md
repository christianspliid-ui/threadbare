> **title:** Encounter Factory habits — card lines say what the god does, encoded lines state the fact, town encounters name the mortal and write their own stake — THR-2109 (slice a), THR-2129 (slice b), THR-2130 (slice c)
> **linear_issue:** THR-2109
> **author:** Claude Code (design lane, run dl-2026-11-02-0518, unattended)
> **created:** 2026-11-02
> **three_pillars:** Engine N/A — data and authoring-doc text only · Content done — the factory's drafting rules first, then three bounded sweeps · UI N/A — no new surface; the text renders in the existing encounter stage and hand

# Encounter Factory habits — THR-2109 / THR-2129 / THR-2130

*The factory-era encounters mostly hold Prose Doctrine v2, but five habits keep coming back because the drafting prompts never name them. This plan names them in the factory's own rules, then sweeps the copies out in three bounded slices.*

## Why this is load-bearing

The audit ([Encounter story text quality](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md), patterns P3, P6, P8) found the factory corpus is 13.3% of encounters met, and that its faults repeat across templates because they were copied from a model or a brief. Slice 1 of the story-text work ([plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-31-thr-2105-encounter-story-text-slice-1.md), [PR #2672](https://github.com/christianspliid-ui/threadbare/pull/2672)) fixed the source of P6, the golden exemplar's card lines. The copies are still live, and nothing in the draft prompt stops the next batch from making them again.

**Measured on `main` @ `2526793c` (this worktree):**

| Habit | Command | Result |
|---|---|---|
| P6 strength tags | Grep `(?i)(a small help\|a real help\|good help\|strong help\|a steady help\|a small push)` over `src/` | 117 lines in 13 files. `encounter-content.ts` 72, `company-drama.ts` 20, `apotheosis-ascension.ts` 5, the rest 1–3 each. The golden exemplar has none now |
| P6, by template in `encounter-content.ts` | awk tally per `id:` | `shrine_offering` 15, `ward_the_camp` 10, `scout_the_perimeter` 10, `rest_and_reflect` 10, `offer_small_prayer` 10, `sharpen_blades` 9, `tend_to_wounds` 8. All seven are migrated board templates, none on the wave 2 lists |
| Second-person effect lines | multiline Grep `effectLine:\s*\n?\s*'You ` over `src/data` | 29: `company-drama.ts` 20, `apotheosis-ascension.ts` 7, `civic-guard-encounter-content.ts` 2. The civic-guard pair (lines 313, 415) are hold-back cards that comment on the choice, not spell lines, and stay out of scope |
| P3 "X held. Y did not." | Grep over `src/data/encounters` | `vertical-slice.ts` 850, 2399, 5224; `the-unclaimed-relic.ts:137`; `apotheosis-ascension.ts:146` |
| P3 in migrated band prose | read `ward_the_camp` | e.g. "The hand stayed steady. The ground under the north side did not."; "The shape was perfect and it ended a stride short of its own beginning." |
| Town corpus | Grep `id: 'encounter\.town\.` | 51 files |
| The drafting chain | Grep of the habits over `.claude/skills/` | zero hits: no prompt names any of them. Spec line 249 ("Write around pronouns: the role noun") is a rule for **bound cast**, and town drafts applied it to the actor |

Strings split across `+` concatenations, so source greps undercount. Every Done-when below reads the composed text.

## What is decided, and by whom

Carried, unchanged: grade only against Prose Doctrine v2 (`nudge-authoring-spec.md` § Prose doctrine v2, § The communication pivot) and Christian's verdicts; **rewrite from scratch**, never edit toward the doctrine (Christian, 2026-08-25); chip wording untouched (Christian, 2026-08-23 and 2026-09-12); no new cast; placement never moves.

*Lane decisions, 2026-11-02 (veto welcome):*

1. **Three slices.** a ([THR-2109](https://linear.app/threadbare/issue/THR-2109)): the drafting rules, every card effect line, and the five "X held. Y did not." lines. b ([THR-2129](https://linear.app/threadbare/issue/THR-2129/encounter-factory-habits-slice-b-the-seven-migrated-board-encounters)): band prose and afterimages of the seven migrated board templates. c ([THR-2130](https://linear.app/threadbare/issue/THR-2130/encounter-factory-habits-slice-c-town-encounters-name-the-mortal-write)): the town corpus (P8). b and c are blocked by a. One slice of all of it would be about 300 rewritten lines across 60 files, twice what a build run finishes.
2. **An effect line says what the god does, and nothing about how much.** Every strength verdict goes, along with its relatives: "The largest help in the hand", "and it costs no essence". The pip row and the cost row already show both. Where the rest of the line is mood ("Strong help. The metal gives an honest account of itself."), the whole line is rewritten as a spell, never trimmed.
3. **Effect lines use the command register, not "You …".** The spec says "the plain command register of a rulebook … Say what the god does" (§ The communication pivot). Slice 1 already moved the exemplar's five lines off "you", and that decision is past its veto window. "You close the spacing between them" becomes "Close the spacing between them". The command is the god's own act on the world or the odds, never an order to the mortal (Vision non-negotiable 1, "influence, never command").
4. **"It argues for X." riders stay word for word.** They mark which pole a card favours (THR-1714), and `apotheosis-ascension.test.ts:223` pins it. "A small help, and it argues for staying mortal." becomes "… It argues for staying mortal." **The Smugglers' Ford "honest way" card (`smugglers-ford.ts:184`) is not touched.** Its wording waits for Christian's pick (THR-2105, 2026-10-31b report, options A/B/C).
5. **The critic prompt does not change.** `agents/editorial-prompt.md` is a writing check in the audit's table, and every check change waits for [Writing evals — with Christian](https://linear.app/threadbare/issue/THR-2106). The rules go into the doctrine and the drafting prompt only.
6. **The actor is always named.** Role nouns are for bound cast members, whose binding may change. Spec line 249 gets one clarifying clause so the next town brief does not read it as covering `{actor}`.
7. **The rules go into the drafting prompt, not the doctrine.** [THR-2105](https://linear.app/threadbare/issue/THR-2105) put changing the doctrine out of scope. Each rule restates a doctrine line the drafts broke.

## The drafting rules (slice a, C0, do first)

The doctrine itself does not change (out of scope on [THR-2105](https://linear.app/threadbare/issue/THR-2105)). Every rule below is already doctrine; the drafting chain just never named the habit. Add one block, **"Five habits to catch before the critic does"**, to `agents/draft-prompt.md` next to "Card faces are generic" (line 114). Put a pointer to it in `reference/batch-brief-format.md` beside the stake-shape row (line 44). Each rule cites its doctrine line and quotes one failing line from the audit and one passing rewrite:

1. **No strength verdict or cost talk on an effect line** (decision 2). Doctrine: "no meta-commentary about effort or odds — the pip row carries magnitude" (spec line 136).
2. **No "X held. Y did not." turn**, and no line that needs two readings. State what failed. Doctrine: "a sentence that needs two readings is a defect".
3. **The mortal is `{actor}` / `{they}`, never a role noun** (decision 6). Doctrine: "the agent is always named".
4. **A stake sentence is written for its own scene**, never reused from another template. "If not, {location} will think less of {actor}" is the banned shape. Doctrine: stake shapes repeat at most twice (`batch-brief-format.md:44`).
5. **The description never states what step 1 is there to find.** Doctrine: the description gives situation and stake (draft-prompt line 79, THR-1739).

The spec's one edit: line 249 gains "(bound cast only; the actor is always named)". It narrows a misread and adds no rule. Bump `last_validated_against` in `.claude/skills/encounter-pipeline/SKILL.md`. No other skill file changes.

## Slice a — THR-2109

**C0** the drafting rules above. **C1** every effect line in `src/data/` carrying a strength verdict, cost talk or a "You …" opening, rewritten under decisions 2–4. That is the 13 files the P6 grep names, with `smugglers-ford.ts:184` left alone. Each new line follows spec line 1019 (never repeats a word of the card's name) and the ≤25-word cap. **C2** the five "X held. Y did not." lines (table above), rewritten as stated failures.

## Slice b — THR-2129

Blocked by a. The composed `bandProse` fragments and the afterimages of `scout_the_perimeter`, `ward_the_camp`, `rest_and_reflect`, `offer_small_prayer`, `tend_to_wounds`, `shrine_offering` and `sharpen_blades` in `encounter-content.ts`, rewritten from scratch. Each line says what happened to the step: the line held or broke, where, and what it costs the mortal. Effect lines are a's; `settings`/`openings` are not touched. The wave 2 plan's decision 7 left these seven to this ticket.

## Slice c — THR-2130

Blocked by a. The 51 `encounter.town.*` templates and their sequel files. Fix only the P8 sites: role nouns for the actor, reused stake sentences, descriptions that give away step 1, and hard-coded pronouns for a cast member when two people are on stage (use a role noun or restructure, spec line 247). The executor finds the sites with the sweep in the Done-when, then a cold read. Lines with no P8 fault are left alone.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Encounters & Dilemmas: factory corpus, board content | 🟢 ACTIVE | extends — text only |
| Nudge cards: authored specials' `effectLine` / `bandProse` | 🟢 ACTIVE | extends — text only; no profile, cost or `forecastDelta` changes |
| Encounter Factory chain (`.claude/skills/encounter-pipeline/`) | 🟢 ACTIVE | extends — the draft prompt gains the five rules, the brief format a pointer, the spec one clause; the critic prompt is untouched (decision 5) |

## Engine pillar

N/A — no engine code. Every change is a string in `src/data/` or a Markdown file under `.claude/skills/`.

## Content pillar

Slices a–c above. In all three: calibrate on the doctrine's own exemplars and the audit's "What good looks like" list first; write from the skeleton; one fact per sentence; no measured counts or paces (P2).

## UI pillar

N/A — no surface changes. Effect lines and band prose render in the existing hand and outcome prose. Every changed file is outside the UI-pillar directories, so each slice closes with `Browser-verify exempt: text-only data change; the stage that renders it is unchanged`. No UI Law is newly engaged. Law 13/14 legibility is what the cold read judges.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| effect lines, band prose, afterimages, town text | encounter resolution (existing) | hand + outcome prose (existing) | none new | none new | `check:encounter -- <id>`; the package view |
| spec / draft prompt / brief format | none (authoring-side) | none | none | none | read by the factory's writer |

Wiki: if the freshness gate names a page whose `sources` include a touched file, `Wiki-freshness-exempt: text-only encounter rewrite` applies. Systemic wiring guide: no new capability.

## Interface impact

| Contract | Change | Note |
|---|---|---|
| Encounter content → encounter cache (placement) | preserve | no `locationTypes` / `settings` / `openings` edits |
| Card faces → hand UI (`effectLine`) | preserve | same field, same 25-word cap |
| Meeting-card pole marking ("It argues for …", THR-1714) | preserve | decision 4 |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| — | — | None new. `NUDGE_WORD_BUDGETS` (effect line 25 words) unchanged |
| Shared-sentence floor (slice c sweep, one-off) | 8 words | Shortest verbatim sentence the cross-template sweep counts as reuse; a script argument, not a game constant |

## Tracing

N/A — text only; no new decision point.

## Fail-soft table

| Failure | Behaviour |
|---|---|
| A token typo in rewritten prose | `check:encounter`'s enrichment dry-run fails the template |
| A test pins an old string | update the pin, never its intent (`apotheosis-ascension.test.ts` "argues for BOTH poles" must still pass unchanged) |
| An effect line runs past 25 words | the word-budget check fails it |
| A new `{actor}` / `{they}` token meets a context with no actor at runtime | `enrichProse()` substitutes its existing fallback, as for every board template today; slice c adds no new token kind |

## Blast Radius

`src/data/encounter-content.ts` has 104 importers. Only string fields change on seven entries (a and b). No exported name, type or function changes.

## Done when

**Slice a (THR-2109):**

- [ ] `draft-prompt.md` carries the five rules with their doctrine citations and quoted examples, and `batch-brief-format.md` points to them; the spec's only diff is the line-249 clause; `editorial-prompt.md` is unchanged (`git diff --stat` shows it absent).
- [ ] A composed-string sweep over every card in `src/data/` (the `authoredProse` reader, `src/data/content-eval/compositionContract.ts:1925`, plus each file's card objects) finds no `effectLine` matching `(?i)\b(small|real|good|strong|steady|largest) help\b|a small push|costs no essence`, and none starting `You ` in those 13 files, except `smugglers-ford.ts:184`. Output pasted in the PR.
- [ ] Every "It argues for …" rider on `main` before the change is still present word for word (sweep before/after, diffed).
- [ ] The same composed-text sweep over band prose and afterimages finds no sentence pair of the shape "<X> held. <Y> did not." or "<X> held … <Y> undid it." (regex `held\b[^.]*\.\s+\S[^.]*\b(did not|undid)\b`), output pasted.
- [ ] `check:encounter -- <id>` shows no new `[warn]` on any touched template; `npm run gate` green; `npm run gate -- --final` last before push.

**Slice b (THR-2129):** a cold critic given only Prose Doctrine v2 and the audit's P1–P3 reads the seven templates' composed band prose and afterimages and returns **zero** P3 findings (verdict pasted in the PR); the compiled `locationSubtypes` for each template is the same set before and after; gate green.

**Slice c (THR-2130):** (1) no sentence of eight or more words appears verbatim in the step prose, overviews or descriptions of two different town templates (sweep pasted; chips are excluded by Christian's 2026-08-23 ruling, and any chip hit is reported, not fixed); (2) a cold critic given Prose Doctrine v2 and the audit's P8 returns zero P8 findings across the 51 templates; (3) no new `check:encounter` `[warn]`; gate green.

## Kill criteria

- If slice b's cold read still finds P3 after one rewrite round, stop. Post the findings on [THR-2129](https://linear.app/threadbare/issue/THR-2129/encounter-factory-habits-slice-b-the-seven-migrated-board-encounters) for the design lane.
- If slice c's cold read still finds P8 after one rewrite round, stop the same way, on [THR-2130](https://linear.app/threadbare/issue/THR-2130/encounter-factory-habits-slice-c-town-encounters-name-the-mortal-write).
- If `apotheosis-ascension.test.ts` "argues for BOTH poles" (or any pole-marking test) fails, a rider was touched. Restore it word for word before anything else.
- If the next Encounter Factory batch after slice a still ships any of the five habits, the drafting rules were not enough. Report it on [THR-2106](https://linear.app/threadbare/issue/THR-2106) as evidence for a check, rather than adding one here.
- If Christian vetoes decision 3 ("keep 'you' on the cards"), slice a still removes the strength tags and leaves openings as they are.
- If Christian picks a rider wording for Smugglers' Ford, that card follows his pick in whichever slice is open, or in a one-line fix.

## Not in this plan

Any writing-check change, the critic prompt included ([THR-2106](https://linear.app/threadbare/issue/THR-2106)). The board rewrite waves ([THR-2108](https://linear.app/threadbare/issue/THR-2108), [THR-2128](https://linear.app/threadbare/issue/THR-2128)). The five novel-prose encounters ([THR-2110](https://linear.app/threadbare/issue/THR-2110)). Chip wording. Rejected: trimming the tag off and keeping the rest of the line (it leaves mood lines); a new `check:encounter` rule for strength tags (a check change, THR-2106's ground).

## Three-pillar check

- [x] Engine: N/A with rationale (strings only)
- [x] Content: drafting rules + three bounded sweeps with composed-text predicates
- [x] UI: N/A with rationale; browser-verify exemption named
- [x] Wiring: table above; interface preserve ×3

## Vision audit

- [x] Serves NFP 5 and doctrine v2's rule zero ("narrate, never inhabit") and the communication pivot (prose does the scene, cards do the rules).
- [x] No Vision premise changes, and no edit is needed.
- [x] Non-negotiable 1 ("influence, never command"): effect lines in the command register name the god's own act (decision 3).

## Rulebook impact

- [x] `Docs/canon/rulebook.md`: none. No rule of play changes.
- [x] `Docs/canon/rulebook-quick-reference.md`: none.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | no new game numbers |
| 2. Inspectability | PASS | `check:encounter`, the composed-text sweeps, the package view |
| 3. Determinism | PASS | no `forecastDelta`, cost, profile or placement change |
| 4. Fail-soft | PASS | table above |
| 5. Narrative | PASS | the whole plan is narrative surface |
| 6. Additive | PASS | the drafting rules are added; text is rewritten in place (git keeps the old) |
| 7. Performance | PASS | data only |

## Coordination block

**Blocked by:** a nothing; b and c by a ([THR-2109](https://linear.app/threadbare/issue/THR-2109)).
**Suggested model:** opus. A from-scratch rewrite of about 150 lines to a doctrine, judged by composed-text sweeps.
**Parallel-safe with:** the legibility plans ([THR-2122](https://linear.app/threadbare/issue/THR-2122)–[THR-2125](https://linear.app/threadbare/issue/THR-2125)), [THR-2110](https://linear.app/threadbare/issue/THR-2110) (its five files are not in a's list). b with c (disjoint files).
**Mutex with:** [THR-2108](https://linear.app/threadbare/issue/THR-2108) / [THR-2128](https://linear.app/threadbare/issue/THR-2128) on `src/data/encounter-content.ts` (different entries, so a textual merge, but one builder at a time); `nudge-authoring-spec.md` and the encounter-pipeline prompts.

**Files to touch:** slice a: `.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md`, `agents/draft-prompt.md`, `reference/batch-brief-format.md`, `SKILL.md` (`last_validated_against`), `src/data/encounter-content.ts`, the 12 files under `src/data/encounters/` the P6 grep names, `vertical-slice.ts`, `the-unclaimed-relic.ts`, and any test that pins a rewritten string. Slice b: `src/data/encounter-content.ts` (seven entries). Slice c: the `encounter.town.*` files under `src/data/encounters/` and their `*-sequels.ts`.

## Notes for the executor

- The audit's reader is a few lines over `authoredProse`. Bundle it with esbuild as `check:encounter` does, and cover card objects as well as step prose.
- Read the card's name before writing its line. "Steady Grip — Strengthen their hands" passes; "… their grip" fails (spec line 1019).

## Intent-judge verdicts

**Run 1 (2026-11-02, opus, cold): Allow.** Impact class corrected to External: the plan changes how the Encounter Factory's drafting agents behave. Ten dimensions PASS or N/A, two GAPs, both fixed. *Dimension 2:* slice a's P3 Done-when was a source grep, which the plan itself says undercounts. It is now a composed-text sweep with a stated regex. *Dimension 10:* no stop rule for slice c, and the pole-marking test lived only in the fail-soft table. Both are now kill criteria, with a third for the drafting rules not holding. Dimension 1 note: decision 3 (command register) goes slightly past the ticket's habit list. It is disclosed, grounded in the spec and slice 1, and has a veto fallback.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-11-02*

### NFP audit

**NFP AUDIT: PASS-with-notes.** 1, 5 and 6 PASS; 3 and 7 N/A. **2 (note):** the composed-text sweep is a throwaway reader, so its evidence lives only in the PR. *Lane response:* deliberate. A kept sweep would be a writing check, which waits for THR-2106. **4 (note):** runtime behaviour of the new `{actor}` tokens was unstated. *Lane response:* fail-soft row added (`enrichProse()` fallback, no new token kind).

### Three-pillar audit

**PILLAR AUDIT: PASS-with-notes.** Engine and UI N/A with rationale. Content is present and substantive, in the drafting-rules and slice sections. **Note:** the Content pillar section points to those sections instead of using the template's subsections. *Lane response:* kept; restating them would break the 250-line cap.

### Vision audit

**VISION AUDIT: PASS-with-notes.** Confirms the north star (the mortal as a person: decision 6), non-negotiables 1–3 and the taste profile's "state facts, never encode them". **Note:** command-register effect lines must read as the god's act, never an order to the mortal. *Lane response:* added to decision 3.
