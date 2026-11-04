> **title:** Novel-prose story beats — Flawed Steel, the Mason-Lord's Wall, the Comet at the Turning, the Page Beneath the Saint and Apotheosis rewritten to Prose Doctrine v2 — THR-2110 (slice A), THR-2134 (slice B)
> **linear_issue:** THR-2110
> **author:** Claude Code (design lane, run dl-2026-11-02-0819, unattended)
> **created:** 2026-11-02
> **three_pillars:** Engine N/A — text fields only, no mechanic, id or effect moves · Content done — five story beats rewritten from scratch in two slices under named word budgets, the Mason-Lord's missing result lines written · UI N/A — no new surface; the text renders in the existing encounter stage and aftermath page

# Novel-prose story beats — THR-2110 / THR-2134

*Five story beats still read like a novel: 150–350-word steps in past tense, inside the scene, with the god as a character who notices, feels and sees. This plan rewrites all their player-facing text as a game master would read it, in two bounded slices, and keeps every mechanic exactly where it is.*

## Why this is load-bearing

The audit ([Encounter story text quality](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md) § P4) found these five templates break doctrine rule zero, *"narrate, never inhabit"*, and the god *"sways, never decides"*. They are met rarely (15 of 1,690 on 2026-10-31, all Flawed Steel; 81 of 1,542 for four of them on 2026-09-28), but each is a story beat, so one meeting is a long read at a moment that matters.

**Measured on `main` @ `93ecdca4`** (a reader over `authoredProse`, `compositionContract.ts:1925`, bundled with esbuild):

| Template | File | Prose words | Longest entry | Entries naming "the god" |
|---|---|---|---|---|
| `crafting.quest.flawed_steel` | `src/data/encounters/flawed-steel.ts` | 3,576 | 348 (step 0) | 9 |
| `stone.permanence.mason_lord_wall` | `the-wall-of-the-mason-lord.ts` | 2,282 | 197 (step 1) | 10 |
| `star.turning.comet_omen` | `the-comet-at-the-turning.ts` | 2,663 | 167 (step 0) | 18 |
| `veil.truth.page_beneath_saint` | `the-page-beneath-the-saint.ts` | 2,595 | 239 (step 1) | 10 |
| `encounter.apotheosis.ascension` | `apotheosis-ascension.ts` | 2,951 | 186 (each opening) | 26 |

`npm run check:encounter -- <id>` on the same commit, prose findings only:

- Flawed Steel: `[register] not-X-but-Y x2`, `[register] second person x2 on mortal-drawn`, intensifiers x2.
- Mason-Lord: intensifiers x5; `[page]` overview and reaction repeat one fact x2. Step 0 has only success and failure lines, and step 1 has no at-cost line (audit P5).
- Comet: `[register] second person x2`; intensifiers x3; `[page]` x2.
- Page: intensifiers x5; `[page]` x3.
- Apotheosis: four openings of 181–186 words (budget 80), each with no real place name in its first paragraph; four mood-named cards ("The Years They Gave", "Let The Morning In", "Nothing Breaks Tonight", "One More Breath"); intensifiers x2.

## What is decided, and by whom

Carried unchanged from the two story-text plans before this one ([slice 1](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-31-thr-2105-encounter-story-text-slice-1.md), [wave 2](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-02-thr-2108-encounter-story-text-wave-2.md)): grade only against Prose Doctrine v2 (`.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md` § Prose doctrine v2) and Christian's verdicts; **rewrite from scratch**, never edit toward the doctrine (Christian, 2026-08-25); no new cast; placement never moves.

*Lane decisions, 2026-11-02 (veto welcome):*

1. **Text only; every mechanic stays.** Choice ids, card ids, effects, essence costs, aftermath variant keys, change ids, encounter seeds, `stakes` keys and `locationSubtypes` are untouched. Only string values change, plus the Mason-Lord's missing result lines (decision 5). The story each beat tells, and what each choice does, stay the same. The words get plain.
2. **Word budgets for story-beat steps.** Step 0's narrative is the doctrine's opening skeleton: three short paragraphs (arrival with a real name through `{location}` or `{cast:…}`, the situation, the problem), **≤ 80 words**. Each step-1 variant narrative (the god's choice playing out) is **≤ 60 words** (`NUDGE_WORD_BUDGETS.bandBase`). Each aftermath overview is **≤ 60 words**. Each authored choice's `intent` is **≤ 25 words** (`effectLine`). Chips stay at the existing 15. Afterimages keep their own existing check.
3. **The god is the player's hand, never a character.** No line has the god as the subject of a sense or feeling ("noticed", "felt", "could see", "opened the prophet"). A variant narrative may open with one clause saying what the god did, in plain words, then reports what the mortal did. The mortal decides; the god sways.
4. **Apotheosis keeps its four openings and its seven cards.** Its openings drop to the 80-word skeleton with `{location}` in the first paragraph. The three fragment-named cards ("The Years They Gave", "Nothing Breaks Tonight", "One More Breath") are renamed verb + noun (for example "Keep the Years"); card ids stay, so nothing that reads them moves. "Let The Morning In" is already verb + noun; its warning is the checker's verb allowlist, which the audit marks as rejecting good names, so it stays and its one `[card name]` line is expected. "(tier 4)" and other designer words leave the player text (spec § `description` row: no band or tier labels).
5. **The Mason-Lord gets its missing result lines.** At-cost, critical-success and critical-failure afterimages on step 0, and an at-cost afterimage on both step-1 variants, each naming its cost in the scene (THR-1634 [§ What "complete" means](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-28-thr-1634-finish-the-encounters-the-player-meets.md#what-complete-means)). Wave 2 decision 6 handed these lines here.
6. **The `fallback` aftermath stays a copy.** Each quest file sets `fallback: { ...<variant> }` so an encounter played with no card still gets an ending. The audit's "repeated word for word" is that copy plus each variant's own repeats. The copy is structural and the player sees one ending, so it stays. What goes: any sentence repeated across two blocks of one ending (the `[page]` warnings, THR-1474) or across two bands of one variant.
7. **Two slices.** About 14,000 words of story text is three times wave 2a's load. Slice A ([THR-2110](https://linear.app/threadbare/issue/THR-2110)) takes Flawed Steel (the one players meet) and the Mason-Lord (the one owing lines), about 5,900 words. Slice B ([THR-2134](https://linear.app/threadbare/issue/THR-2134), filed this run, blocked by A) takes the comet, the page and Apotheosis, about 8,200 words, calibrated on slice A's Flawed Steel.
8. **The four quest files keep their authored choices.** Flawed Steel, the Mason-Lord, the comet and the page still let the player pick the mortal's path through `authoredChoices`, the model canon rejected on 2026-07-26 ([encounters canon](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/encounters.md) § Rejected, THR-772). Canon's line says zero shipped encounters author it; measured on `93ecdca4`, 34 data files under `src/data/` still do (`grep -rln authoredChoices src/data`). Converting them is a mechanic change across the whole legacy corpus, filed separately as [the authored-choice residue ticket](https://linear.app/threadbare/issue/THR-2135). This plan rewrites the words those choices already carry: each `intent` says what the god's hand does, never which ending it buys. A later conversion reuses the plain scene facts written here.
9. **Structural failures are not this plan's.** The four quest files also fail `check:encounter` on shape: no `settings`, no actor support binding, aftermath bands keyed by choice rather than outcome, changes with no anchor. Those predate the contract, are not story text, and need engine-side choices. This plan asserts their count does not grow. It does not fix them.

These decisions draw only on Prose Doctrine v2, the 2026-10-31 audit and Christian's recorded rulings, all older than the lane's veto window. They do not draw on the [factory-habits](https://linear.app/threadbare/issue/THR-2109) decisions still inside theirs. If those stand, their writing instructions apply to the rewrite as they apply to any factory run. The bar here is the doctrine either way.

## Slice A — THR-2110

| Template | Fields | Owed |
|---|---|---|
| `crafting.quest.flawed_steel` | step 0 and three step-1 variants plus fallback; 30 afterimages; three aftermath variants (overview, reaction prompt, changes, `byOutcome`); `stakes`; `narrativeTemplates`; `description`; choice `intent`s | register x4 to zero |
| `stone.permanence.mason_lord_wall` | step 0 and two step-1 variants plus fallback; afterimages; two aftermath variants; `stakes`; `narrativeTemplates`; `description`; choice `intent`s | decision 5's five lines; `[page]` x2 to zero |

## Slice B — THR-2134

Blocked by A. Same rules. The writer and critic read slice A's rewritten Flawed Steel with the doctrine.

| Template | Fields | Owed |
|---|---|---|
| `star.turning.comet_omen` | as slice A's; aftermath `byOutcome` | register x2 and `[page]` x2 to zero |
| `veil.truth.page_beneath_saint` | as slice A's | `[page]` x3 to zero |
| `encounter.apotheosis.ascension` | four openings; two steps and their variants; seven card names and effect lines; aftermath; fragments | openings to the skeleton (decision 4); three card names to verb + noun |

## Slice B recalibration — after the 2026-11-02 kill (THR-2134)

The first slice-B run hit the kill criterion on 2026-11-02 ([its findings](https://linear.app/threadbare/issue/THR-2134)). Its rewrite sits on branch `claude/vibrant-tu-76f798` (commits `87baca2f`, `77c193e7`), every machine Done-when green, and the second cold read returned 36 findings in eight classes. Classes 2, 3, 6 and 7 are text the second pass fixes against rules that already exist. Classes 1, 4, 5 and 8 lacked a rule; decisions 10–13 supply it. **The second pass resumes from that branch. It does not restart.**

*Lane decisions, 2026-11-04 (run dl-20261104T1419Z, veto welcome).* They draw on code, canon and Christian's own rulings only, not on the [factory-habits](https://linear.app/threadbare/issue/THR-2109) round-2 decisions still inside their veto window.

10. **At-cost charges the mortal, never the god** (class 1). Measured: `outcomeConsequences.ts:277-288`, the `success_at_cost` case, writes a `quintessenceEvent` on `actorId` (`delta: -penalty`) and `growthMultiplier: SUCCESS_AT_COST_GROWTH_MULTIPLIER`; the aftermath's price row says the same (`aftermathWords.ts:1197-1200`, "costs quintessence and half the growth"). A card's `essenceCost` is paid when it is played, on every band. So an at-cost line names what the **mortal** gave up in the scene (strength, nerve, a night's sleep, what they would have learned). It never says the god paid, or paid extra. The branch breaks this at `apotheosis-ascension.ts:282` ("cost the god extra essence"), `:367` ("cost the god some of its own essence") and `:569` ("drew down the god's own essence"). The rule is given to the critic as well as the writer.
11. **The chip carries the state; the overview tells the scene** (class 4). Canon already splits them: a chip names a state the band wrote ([encounters canon](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/encounters.md) § Rejected, UI Law 56), and "scene texture belongs in `overview`/afterimages, which never claim state". Christian's 15-word chip ruling adds *"a test that it does not communicate any of the same info as the aftermath"* (spec § Consequences 1b, 2026-09-12). So when an ending has one fact, the overview tells the moment it happened (who acted, what they did, who saw) and stops before the result noun. The chip names the result. The reaction prompt asks what the god does next, without restating either. A paraphrase counts as a repeat (spec 1b: the four-word machine check is a lower bound).
12. **Pronouns through tokens** (class 5). The enricher resolves `{they}` / `{them}` / `{their}` / `{themselves}` / `{s}` from the bound actor (`proseEnrichment.ts:905-911`), and the corpus already uses them beside `{actor}` (`hostage-exchange.ts:317`). Any pronoun whose referent is `{actor}` is a token. Measured on the branch, lines carrying `{actor}` and a literal *they / their / them / themselves*: Comet 4, Page 2, Apotheosis 9. A literal plural that means a crowd ("the pilgrims … their fields") stays literal.
13. **Losing bands may get their own ending, in the existing shape** (class 8). `byOutcome` is already in all three files (THR-1667 S3 `critical_failure` entries, `keepChanges` helper, Comet `:311-355`). It is the canon surface for "the ending reflects how the encounter ended" ([encounters canon](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/encounters.md) § Outcome-keyed aftermath, THR-969), and THR-1509 already owes `failure` "when a step on it is `fail_action`". So this slice **may add** `byOutcome.failure` or `byOutcome.critical_failure` entries on an existing variant to fix the three contradictions the cold read named (Comet *let them read it* failure, Page *surface* failure, Page *bury* critical failure). Each entry authors `overview`, optionally `reactionPrompt`, and `changes` only as `keepChanges(<base>, [<existing ids>])`. The helper lives only in the Comet file (`:317` on the branch); a Page or Apotheosis entry copies it locally. No new chip, change id, effect, seed, reaction or reaction effect. This reads decision 1 as "no mechanic moves": a band entry chooses among existing chips and adds words. An afterimage softened only to dodge a contradiction goes back to stating the band's fact.

**Second pass, in order.** (a) Apply 10–13 to the branch text. (b) Fix classes 2, 3, 6, 7 against what already binds them: encoded facts and irony lines against doctrine v2 and P1/P2; Christian's six compressed-prose tells (2026-11-03, [Writing evals — with Christian](https://linear.app/threadbare/issue/THR-2106)); card band prose plain and literal ("Ward the Night … the worst" names the worst); the Page and Apotheosis P3 openings name a stake, and Apotheosis P2 a cost already paid (Content step 2). (c) One cold read by a fresh critic given the doctrine, the exemplars, P1–P4 **and decisions 10–13**.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Encounters & Dilemmas: quest and story-beat files under `src/data/encounters/` | 🟢 ACTIVE | extends — string values rewritten, five afterimages added; no shape change |
| Aftermath scenes (THR-1474 page rules, chips at 15 words) | 🟢 ACTIVE | preserves — same variants, changes and seeds; slice B may add `byOutcome` band entries that keep existing chips only (decision 13) |
| `content-eval` (`firedTemplateCompletion.ts`, `retrofitPending.ts`) | 🟢 ACTIVE | extends — the Mason-Lord may join the completion list; `RETROFIT_PENDING` only shrinks |

## Engine pillar

N/A — no engine code and no mechanic change (decision 1). The quest files are plain `UnifiedActionTemplate` data, and every string they author is already collected by `authoredProse` and checked by `check:encounter`. The Apotheosis offer logic (`APOTHEOSIS_ENCOUNTER_TEMPLATE_ID`, `src/data/aspect-content.ts:49`) reads the template id, which stays.

## Content pillar

For each template, in table order:

1. **Read the template's mechanics first:** what each choice does, which change each ending writes, which seed it plants. Write down the one fact each band must state. Then throw the old lines out and write from that list (slice 1's note stands).
2. **Step 0 is the opening skeleton** (decision 2): arrival with a real name, the situation with its costs already paid, the problem as one stake. Present tense. No sensation, no weather unless it is the problem.
3. **Each step-1 variant** says what the god did in one plain clause, then what the mortal did and what it cost (decision 3).
4. **Afterimages and aftermath** state what happened, who it happened to and what changed, in that order. The overview leads with the deciding fact. The reaction prompt asks one question. No line repeats a fact another block on the same ending already carries (decision 6).
5. **`stakes`, `narrativeTemplates` and `description` are rewritten with the result lines**, so each stake part says what its band's line says (wave 2 decision 3). `description` follows the spec's `description` row: situation and stake, no design words.
6. **Choice `intent`s** become one or two direct sentences of what the god's hand does (decision 2, ≤ 25 words). Choice `label`s keep their imperative shape.
7. **Calibrate** on the Swollen Ford row in `Docs/exemplars.md` (factory story shape, authored cards) and the doctrine's Unclaimed Relic rewrite. Slice B adds slice A's Flawed Steel.

## UI pillar

N/A — no surface changes. The text renders in the existing encounter stage and aftermath page. Every changed file is under `src/data/` or `Docs/`, outside the UI-pillar directories, so each slice closes with `Browser-verify exempt: text-only data change; the stage and aftermath page that render it are unchanged`. No UI Law is newly engaged. Legibility (Laws 13/14) is what the cold read judges: shorter, plainer text on the same surface.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| Five story-beat templates (string values, Mason-Lord afterimages; slice B's `byOutcome` band entries, read by `applyAftermathOutcomeBand`) | encounter generation and resolution (existing) | encounter stage, aftermath page (existing) | none new | none new | `check:encounter -- <id>`; `?spawn=<templateId>` |

Wiki: if the freshness gate names a page whose `sources` include one of these files, `Wiki-freshness-exempt: text-only story-beat rewrite` applies (mechanics unchanged, asserted). Systemic wiring guide: § Flawed Steel describes wiring only, which does not change. No new capability.

Prose pipeline: the rewritten strings keep their existing tokens (`{cast:…}`, `{location}`, `{frag:…}`) and pass through the same enrichment pass; `check:encounter`'s enrichment dry-run proves each. Player controls: none new; the same choices and cards are offered at the same steps.

## Interface impact

| Contract | Change | Note |
|---|---|---|
| Encounter content → aftermath scene (variant keys, change ids, seeds) | preserve | decision 1; asserted by the id snapshot in Done-when. Slice B may add `byOutcome` band keys that select existing change ids only (decision 13); no new change id or seed |
| Encounter content → encounter cache (placement) | preserve | `locationSubtypes` and `locationTypes` untouched |
| Apotheosis offer → template id | preserve | `aspect-content.ts:49` reads the id only |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| — | — | None new. Decision 2 reuses `NUDGE_WORD_BUDGETS` rows (`opening` 80, `bandBase` 60, `effectLine` 25, chip 15); the executor asserts them with the reader, adding no constant |

## Tracing

N/A — text only; no new decision point.

## Fail-soft table

| Failure | Behaviour |
|---|---|
| A token typo in rewritten prose | `check:encounter`'s enrichment dry-run fails the template |
| A renamed Apotheosis card id | the id snapshot (Done-when) fails; ids never change |
| A fallback no longer matching its variant | the spread (`{ ...X }`) makes that impossible by construction |
| A new afterimage on a band the step cannot reach | harmless; it renders only when that band resolves |
| A decision-13 `keepChanges` naming an id the base lacks | `keepChanges` filters, so the id is dropped and no chip renders; the PR's listed kept ids and the id snapshot catch it |
| A losing band with no `byOutcome` entry | `applyAftermathOutcomeBand` returns the base ending (fail-soft by construction, `unifiedAction.ts:2526-2530`) |

## Blast Radius

Not triggered. The five files have few importers (each is registered once into the template catalog). No exported name, type or function changes. A test that pins old wording gets its pin updated, never its intent.

## Done when

Each slice, for its own table:

- [ ] `npm run check:encounter -- <id>` for each template shows zero `[register]`, `[page]`, `[opening]` and `[card name]` lines (except the one expected "Let The Morning In" line, decision 4), and no more `intensifiers` than today. The structural lines (decision 9) are no more than today: paste the before/after counts.
- [ ] Budgets hold (decision 2), measured with the same `authoredProse` reader this plan used. Paste its per-template table: step 0 ≤ 80, each variant narrative ≤ 60, each overview ≤ 60, each `intent` ≤ 25.
- [ ] No line names the god as the subject of a sense or feeling (decision 3): a grep for `the god (noticed|felt|saw|could see|heard|opened|found)` returns nothing, and the cold read confirms it.
- [ ] A cold critic subagent, given only Prose Doctrine v2, the calibration exemplars named in Content step 7 and the audit's P1–P4 (slice B: and decisions 10–13), reads the slice's composed text and returns **zero** P1–P4 findings. Its verdict is pasted in the PR.
- [ ] Mechanics unchanged: a before/after snapshot of every id (choices, cards, variants, changes, seeds, `stakes` keys) and every effect object is identical. Only strings differ (decision 1). Slice B: the one allowed difference is new `byOutcome` band keys under decision 13, each listed in the PR with the existing change ids its `keepChanges` keeps.
- [ ] Slice B: each new `byOutcome` entry is rendered once with `?spawn=<templateId>&outcome=<band>`, and `await window.__DEBUG.getOutcomePinVerdict()` names that band on the expected `variantKey`. Paste the verdicts.
- [ ] Slice B: no at-cost line names the god's essence (decision 10): a grep of the three files for `essence` outside `essenceCost` and `quintessence_shift` returns only lines where the god's essence is the subject of a non-at-cost fact (for example the bond chip "sends it a trickle of essence"). No line pairs `{actor}` with a literal pronoun for the actor (decision 12).
- [ ] Slice A: the Mason-Lord carries decision 5's five lines. If `firedTemplateCompletion.test.ts` passes with it added, it joins `FIRED_TEMPLATE_COMPLETION` under `// THR-2110`.
- [ ] Slice B: if Apotheosis now passes `compositionContract.test.ts`, it leaves `RETROFIT_PENDING` in the same commit.
- [ ] `npm run gate` green; `npm run gate -- --final` last before push.

## Kill criteria

- If the cold read still finds P1–P4 after one rewrite round, stop. Post the findings on the slice's ticket. Slice B waits until the design lane revises the calibration.
- Slice B's second pass (after decisions 10–13) gets one cold read. A template with zero P1–P4 ships in this PR. A template still failing reverts to `main`'s text in this PR, its findings go on a new ticket, and the PR says which. There is no third calibration round on this slice. The Done-when lines then apply to the templates the PR ships; for a reverted template, its id and the new ticket's link in the PR replace them.
- If a rewrite cannot state a band's fact inside its budget, raise that one field's budget by the smallest step that fits and say so in the PR. Never drop the fact.
- If the id snapshot differs, a mechanic moved. Revert that template and report.

## Not in this plan

The structural `check:encounter` failures on the four quest files (decision 9). Any writing-check change, including why `check:encounter --all` sweeps only `encounter.*` ids ([THR-2106](https://linear.app/threadbare/issue/THR-2106)). Board templates ([THR-2108](https://linear.app/threadbare/issue/THR-2108), [THR-2128](https://linear.app/threadbare/issue/THR-2128)). Rejected: one slice of five (too long for one run); trimming the old prose to budget (Christian's rewrite-from-scratch rule); merging the fallback copies away (an encounter played without a card would have no ending).

## Three-pillar check

- [x] Engine: N/A with rationale (text only, ids asserted)
- [x] Content: five rewrites in two slices under named budgets, five Mason-Lord lines, Apotheosis openings and card names
- [x] UI: N/A with rationale; browser-verify exemption named
- [x] Wiring: table above; interface preserve ×3

## Vision audit

- [x] Serves NFP 5 and the Vision's god-reading-a-chronicle stance (doctrine v2's rule zero). The god as the player's hand, not a character, is the north star's "the fork was always the mortal's to take" and non-negotiable 1, "influence but not command" ("sways, never decides" is the doctrine's wording of it).
- [x] No Vision premise changes, and no edit is needed.

## Rulebook impact

- [x] `Docs/canon/rulebook.md`: none. No rule of play changes.
- [x] `Docs/canon/rulebook-quick-reference.md`: none.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | budgets reuse named constants; no new numbers |
| 2. Inspectability | PASS | `check:encounter`, the reader, `?spawn=` |
| 3. Determinism | PASS | no mechanic, id or seed moves (asserted) |
| 4. Fail-soft | PASS | table above |
| 5. Narrative | PASS | the whole plan is the narrative surface |
| 6. Additive | PASS | five afterimages added; text rewritten in place |
| 7. Performance | PASS | data only, and shorter |

## Coordination block

**Blocked by:** slice A nothing; slice B by slice A ([THR-2110](https://linear.app/threadbare/issue/THR-2110)).
**Suggested model:** opus. From-scratch prose to a doctrine under budgets, judged by a cold read.
**Parallel-safe with:** the board story-text waves ([THR-2108](https://linear.app/threadbare/issue/THR-2108), [THR-2128](https://linear.app/threadbare/issue/THR-2128), `encounter-content.ts`), the legibility plans ([THR-2122](https://linear.app/threadbare/issue/THR-2122)–[THR-2125](https://linear.app/threadbare/issue/THR-2125), components and design-system canon).
**Mutex with:** anything editing the five story-beat files; the append-only `FIRED_TEMPLATE_COMPLETION` and `RETROFIT_PENDING` lists (wave 2 appends to the first); [THR-2109](https://linear.app/threadbare/issue/THR-2109) if it reaches these files.

**Files to touch:** slice A `src/data/encounters/flawed-steel.ts`, `src/data/encounters/the-wall-of-the-mason-lord.ts`, `src/data/content-eval/firedTemplateCompletion.ts` (append only); slice B `src/data/encounters/the-comet-at-the-turning.ts`, `src/data/encounters/the-page-beneath-the-saint.ts`, `src/data/encounters/apotheosis-ascension.ts`, `src/data/content-eval/retrofitPending.ts` (removal only); any test that pins a rewritten string.

## Notes for the executor

- `check:encounter --all` skips four of these ids. Run each by id.
- Flawed Steel's step 0 is 348 words today. Its 80-word skeleton keeps the fact the old text took a paragraph to show: the forge has gone quiet because a flawed blade went out under Maren's name.
- The reader is a few lines over `authoredProse`; bundle it with esbuild as `check:encounter` does.

## Intent-judge verdicts

**Run 1 (2026-11-02, opus, cold): Allow** (Reversible confirmed). Ten dimensions PASS, two N/A, one GAP: the Wiring table did not name the prose pipeline or player controls. *Fixed:* a line under the table now names both (tokens kept, same enrichment pass; no new controls). Advisory: no sample of the new text is quoted; the cold critic read in Done-when is the legibility check.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-11-02*

### NFP audit

**NFP AUDIT: PASS-with-notes.** 3–7 PASS. **1 (note):** the budget-raise kill criterion does not say where a raised budget lives. *Lane response:* it lives in the PR description for that one field. No constant changes, because `NUDGE_WORD_BUDGETS` binds new authoring and a one-field exception on a legacy beat should not move it. **2 (note):** the budget reader is not a committed script. *Lane response:* deliberate for text-only work. `check:encounter` stays the re-runnable gate; the reader's table is pasted evidence, as wave 2's census was.

### Three-pillar audit

**PILLAR AUDIT: PASS-with-notes.** Engine and UI N/A with rationale; Content present and substantive (five templates, per-field owed tables, budgets, Mason-Lord lines, card renames). Wiring connects; substrate extends ACTIVE systems only. **Note:** the Content pillar omits the template's subsection headings. *Lane response:* their content is in the slice tables. The headings would be empty shells under the size cap (THR-1948).

### Vision audit

**VISION AUDIT: PASS-with-notes.** No contradictions; north star, core loop, non-negotiables 1 and 3 and the taste profile confirmed. **Notes:** (a) core loop asks for "dense and particular" encounter prose; budgets pull against density. *Lane response:* the newer plain-register ruling governs, and particularity rides the real-name rule in every opening. (b) The kept `authoredChoices` strain non-negotiable 1. *Lane response:* agreed; that is why [THR-2135](https://linear.app/threadbare/issue/THR-2135) exists, and the rewritten `intent`s stop naming the ending. (c) Citation. *Fixed:* the Vision audit line now cites the north star and non-negotiable 1.

## Slice B recalibration verdicts (2026-11-04, run dl-20261104T1419Z)

**Intent judge (opus, cold): Allow** (Reversible confirmed). Every code and branch claim was checked against source and holds. Two GAPs, both fixed: the cold critic's Done-when inputs now include decisions 10–13, and the kill criterion now says what closes a reverted template. Its note that `keepChanges` exists only in the Comet file now sits in decision 13.

**NFP audit: PASS-with-notes.** *Fixed:* new band entries are rendered with `?outcome=` (new Done-when line), and the fail-soft table now has two rows for decision 13. Note on NFP 6, that `keepChanges` drops chips on a losing band. *Lane response:* the drop is intended. Law 56 says a chip must match a state the band actually wrote, so a chip that a failure makes false has to go.

**Three-pillar audit: PASS-with-notes.** *Fixed:* the Wiring row and the Interface-impact row now both name decision 13's band entries.

**Vision audit: PASS-with-notes.** No contradictions. Its note on "dense and particular" was already settled in the 2026-11-02 audit: the plain-register ruling governs.
