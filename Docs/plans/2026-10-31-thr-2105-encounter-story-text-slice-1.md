> **title:** Encounter story text, slice 1 — the factory's model text, and the ten board encounters players meet most, rewritten to Prose Doctrine v2 — THR-2105
> **linear_issue:** THR-2105
> **author:** Claude Code (design lane, run 2026-10-31b, unattended)
> **created:** 2026-10-31
> **three_pillars:** Engine N/A — data only, through the converter path the board already uses (THR-884 `settings`/`openings`) · Content done — 10 templates rewritten from scratch, the golden exemplar's five card lines, seven pronoun seams · UI N/A — no new surface; the text renders in the existing encounter stage

# Encounter story text, slice 1 — THR-2105

*The ten board encounters players meet most carry 22.6% of every encounter in the game, and they still read like horoscopes. This slice rewrites them to the doctrine and fixes the model text the factory copies its card habits from.*

## Why this is load-bearing

The audit ([Encounter story text quality](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md)) measured today's attended world: **74.5% of the 1,690 encounters met come from the old board** (`src/data/encounter-content.ts`). The 2026-08-25 rewrite ([THR-1223](https://linear.app/threadbare/issue/THR-1223)) never reached it. Its step prose and success/failure lines are pre-doctrine mood writing (audit P1, P2), now sitting beside the plain at-cost and critical lines [THR-1634](https://linear.app/threadbare/issue/THR-1634) added, so one encounter speaks in two voices. No writing check reaches these templates (audit § The writing checks, fact 1).

The factory's own model text has two habits the doctrine retired: card effect lines that end "A small help." / "A real help." in the second person (audit P6, 121 lines across 13 files), and a bare `{they} find` that prints "There he find…" (audit P7, seven sites). Both trace to text the factory imitates, so they are fixed at that source in this slice.

Nothing new is authored into `encounter-content.ts`, so for the board a rewrite *is* the source fix. Wave 2 and the factory-chain habits are filed as their own tickets (§ Not in this plan).

## What is decided, and by whom

- **Grade only against Prose Doctrine v2** (`.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md` § Prose doctrine v2, § The communication pivot) and Christian's verdicts. Nothing here changes the doctrine.
- **Rewrite from scratch, never edit the old prose toward the doctrine.** Christian, 2026-08-25: *"you did not do a rewrite from scratch … it is still crap … too high brow and not basic game master language."*
- *Lane decision (veto welcome):* **the board gets the full three-paragraph opening.** The doctrine says "three short paragraphs, always", and nothing agreed exempts background encounters. Placement must not move, so each template declares all eight setting classes. Their union is the full subtype list, pinned both ways by `settingClasses.test.ts` (`src/data/settingClasses.ts:70`), so the encounter cache filters exactly as today.
- *Lane decision (veto welcome):* **no new cast in this slice.** The doctrine prefers named people, but a name needs a cast binding (prose may not invent state). Role figures ("the trader") stay unnamed here; the arrival line names the actor and the place through `{name}` and `{location}`.
- *Lane decision (veto welcome):* **the exemplar's five card lines are brought to v2.** Christian approved the Swollen Ford exemplar on 2026-08-09, under v1. Doctrine v2 retired second person and effort commentary sixteen days later, and its own approved card register (Steady Grip, Bind Outcome, Banish Fear) has neither.
- Chip wording is **not** touched. "{location} thinks well of …" and the ambition's name on a chip are Christian's rulings (2026-08-23, 2026-09-12), not defects (audit § Findings dropped).

## The ten templates

Today's ten most-met board templates (attended census `readers/attended.ts 42,99 150` on `126665db`; 382 of 1,690 encounters). All ten are on `RETROFIT_PENDING`; nine are in `FIRED_TEMPLATE_COMPLETION`; none declares `settings`.

| Template | `encounter-content.ts` line | Met today | Note |
|---|---|---|---|
| `encounter.barter_supplies` | 8636 | 44 | |
| `encounter.commune_with_stars` | 9820 | 42 | |
| `encounter.tend_the_weary` | 9472 | 42 | |
| `encounter.local_gossip` | 10930 | 41 | |
| `encounter.assess_holdings` | 8701 | 38 | |
| `encounter.study_surroundings` | 9541 | 38 | |
| `encounter.local_tales` | 9401 | 36 | |
| `encounter.rest_and_recover` | 10314 | 35 | |
| `encounter.forage_provisions` | 10380 | 33 | |
| `encounter.market_day_festival` | 5649 | 33 | Not in `FIRED_TEMPLATE_COMPLETION`: author its missing result lines too |

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Encounters & Dilemmas: board content, setting envelopes (THR-884), opening compile (THR-932), coloration slot (THR-1635) | 🟢 ACTIVE | extends — ten entries adopt the existing `settings`/`openings` shape. No engine change |
| Prose enrichment (`proseEnrichment.ts`, `{they}`/`{s}`) | 🟢 ACTIVE | extends — seven text sites use its agreement token |
| `content-eval` (`compositionContract.ts`, `firedTemplateCompletion.ts`, `retrofitPending.ts`, the golden exemplar) | 🟢 ACTIVE | extends — the completion list grows by one; the exemplar's text changes, not its shape |

Runtime population: 168 board templates; 114 fired on today's attended census, 1,259 of 1,690 encounters (the audit's demand table).

## Engine pillar

N/A — no engine code. The board's converter already passes `settings` and `openings` (`src/data/encounter-content.ts:205`, `:436`) and compiles the opening above step 0 (THR-884, THR-932). `{frag:place_fact}` stays where the coloration pass puts it, at the end of step 0 (`src/engine/fragmentResolution.ts:290`). The sharpen-blades entry (`encounter-content.ts:8247`) is the working precedent.

## Content pillar

**C1 — the model text the factory copies (do first).**
1. `src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts:218-348`: rewrite the five effect lines that end "A small help." / "A real help." / "A strong help." (lines 218, 234, 251, 303, 348). Say what the god does, in the command register, no second person, no strength verdict, no word from the card's name. Example, Steady Breath: "Settle their nerve, so the eye rests on the water and not on the crossing to come." Line 303 (`ford.pay_it_later`) is a cost card, with a different shape. It says what the god does and what the world pays, e.g. "Clear the way across the river, and let the world's end draw a little closer to pay for it."
2. `nudge-authoring-spec.md:1024` (the approved spine): "There \{they} find" → "There \{they} find\{s}". This is a token fix to the director's own text, not a wording change.
3. The six live sites, seven seams counting the spine: `the-unclaimed-relic.ts:244`, `the-broken-seal.ts:344`, `the-drowned-archive.ts:496`, `the-unfinished-rite.ts:144`, `the-beast-in-the-granary.ts:229` (`{They} leave`), and `narrative-content.ts:283` ("what {they} leave behind"). Add `{s}` to each present-tense verb after `{they}`. Two test fixtures quote the same text (`doctrineV2Checks.test.ts:237`, `encounterPackage.test.ts:97`); update them only if they pin the rendered wording.

**C2 — the ten templates, rewritten from scratch.** For each:
1. `settings` listing all eight classes (`SETTING_CLASSES` in `src/data/settingClasses.ts:31`; keep `locationTypes` as it is) and an `openings` entry per class. Each is P1 only: one sentence, how `{name}` came to `{location}`, at a time of day where it helps. Example, barter supplies, urban: "{name} arrives at the market in {location} in the middle of the morning."
2. Step 0 `narrative` becomes P2 + P3: what is happening, what has gone wrong with a cost already paid, and exactly one stake. Total opening ≤80 words with P1.
3. Every later step's `narrative`: what changed, what it cost, what is asked now. One fact per sentence, present tense, common words, no maxim.
4. `onSuccess.narrative` and `onFailure.narrative` on every step: state what happened and what it changed. Delete every verdict fragment ("Fair dealing.", "Knowledge earned.", "Always enough.").
5. Keep the THR-1634 at-cost and critical lines unless the cold read below finds them failing. Author any that are missing (`market_day_festival`), then add it to `FIRED_TEMPLATE_COMPLETION`.
6. `stakes`: change only where a part now contradicts the rewritten result lines.
7. No numerals, no measured counts or paces, no second person, no exclamation marks, no new cast, no game state invented in prose.

Calibrate against the doctrine's exemplars and the audit's "What good looks like" lines, e.g. `trade_caravan_escort`: "The ambushers cut the lead wagon loose and drive it off. {actor} is knocked down in the fight, and the caravan loses its best goods and two guards."

## UI pillar

N/A — no surface changes. Openings already render above step 0 in the encounter stage (THR-884). Every changed file sits under `src/data/` or the spec, outside the UI-pillar directories, so the ticket closes with `Browser-verify exempt: text-only data change; the stage that renders it is unchanged`. UI Laws engaged: none newly. Legibility (Laws 13/14) is the point of the text, and the cold read judges it.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| ten board entries (text, `settings`, `openings`) | encounter generation and resolution (existing) | encounter stage (existing) | none new | none new | `check:encounter -- <id>`; the package view |
| golden exemplar fixture | none (authoring-side) | none | none | none | `check:encounter` imports it |

Wiki: the freshness gate names the Design Reference Wiki page whose `sources` include `encounter-content.ts`, if any. The change is behaviour-neutral (text only, placement unchanged), so `Wiki-freshness-exempt: text-only encounter rewrite` applies if the gate fires. Systemic wiring guide: no new capability.

## Interface impact

| Contract | Change | Note |
|---|---|---|
| Encounter content → encounter cache (placement by subtype) | preserve | `settings` listing all eight classes expands to the same subtype list (`settingClasses.ts:70`, pinned both ways) |
| Encounter content → prose enrichment (tokens) | preserve | adds `{s}` agreement tokens only |
| Opening coloration (`{frag:place_fact}`) | preserve | the slot stays where the compile pass writes it |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| — | — | None new. Word budgets stay `NUDGE_WORD_BUDGETS` |

## Tracing

N/A — text and placement-neutral fields; no new decision point to trace.

## Fail-soft table

| Failure | Behaviour |
|---|---|
| A setting class missing from `openings` | The build-time test fails (`settingClasses.test.ts`); at runtime the `'*'` default renders step 0 alone, as today |
| A token typo in rewritten prose | `check:encounter`'s enrichment dry-run fails the template |
| `{s}` on a verb after a name, not a pronoun | Renders correctly: `{name} work{s}` is handled since THR-1857 (`proseEnrichment.ts:868`) |

## Blast Radius

`src/data/encounter-content.ts` has 104 importers (`grep -rl "encounter-content'" src scripts` → 104). This slice changes only string fields and adds `settings`/`openings` to ten entries, through a shape 7 board entries already use (`grep -c "^    openings: {"` → 7; e.g. lines 8247, 8921, 9902, 10540). No exported name, type or function changes. The risk is a test that pins old wording. The executor runs `npm test` and updates only pins of the rewritten strings, never the assertion's intent.

## Done when

- [ ] `npm run check:encounter -- <id>` for each of the ten prints no doctrine `[warn]` on openings, and each declares all eight classes with an opening per class.
- [ ] A cold critic subagent, given only Prose Doctrine v2 and the audit's patterns P1–P3, reads the composed text of the ten (the `authoredProse` dump) and returns **zero** P1/P2/P3 findings. Its verdict is pasted in the PR.
- [ ] All ten are in `FIRED_TEMPLATE_COMPLETION`, and `firedTemplateCompletion.test.ts` passes.
- [ ] The exemplar has no effect line ending in "help." and none starting "You". Each of the seven seam sites (the spec spine and the six files in C1.3) reads `find{s}` / `leave{s}`. (`tavern-encounter-content.ts:752`, "what did {they} leave behind?", is correct as it stands: "did" carries the tense. Leave it alone.)
- [ ] Placement unchanged: on `readers/attended.ts 42,99 150`, each of the ten fires the same number of times before and after.
- [ ] `RETROFIT_PENDING` does not grow. Any of the ten that now pass are removed (`check:encounter` exits 1 on a stale entry).
- [ ] `npm run gate` green; `npm run gate -- --final` last before push.

## Kill criteria

- If the cold read still finds P1–P3 after one rewrite round, stop. The doctrine's exemplars are not enough to calibrate board text. Post the critic's findings on the ticket, so the design lane can add a board exemplar before wave 2.
- If any firing count moves, placement changed: revert the `settings` lines, ship the text without openings, and report.
- If Christian vetoes the full opening for background encounters, drop C2.1 and keep the rest.

## Not in this plan (filed as their own tickets)

- **Old-board wave 2**: the next twenty most-met board templates (about 15% of encounters), plus the seven templates missing result lines (audit P5). [THR-2108](https://linear.app/threadbare/issue/THR-2108/encounter-story-text-wave-2-the-next-twenty-most-met-board-encounters), blocked by this ticket.
- **The factory chain**: the 121 strength-tagged card lines (P6), the encoded-line habit and the slice "X held. Y did not." tic (P3), role nouns for the actor, the repeated town stake sentences, and descriptions that give away the answer (P8). The fix goes into the factory's brief and drafting prompts, plus the templates named. [THR-2109](https://linear.app/threadbare/issue/THR-2109/encounter-factory-habits-strength-tags-on-card-lines-encoded-x-held-y), blocked by this ticket.
- **The five novel-prose templates** (P4). [THR-2110](https://linear.app/threadbare/issue/THR-2110/rewrite-the-five-novel-prose-encounters-to-prose-doctrine-v2-flawed).
- **Any change to a writing check**: waits for [Writing evals — with Christian](https://linear.app/threadbare/issue/THR-2106).

Rejected: naming the board's role figures through cast bindings (structural across 168 templates, and prose cannot invent names); narrowing `settings` to an honest envelope as THR-1222 did (it moves placement).

## Three-pillar check

- [x] Engine: N/A with rationale (data through the existing converter path)
- [x] Content: ten rewrites, five exemplar lines, seven pronoun seams
- [x] UI: N/A with rationale; browser-verify exemption named
- [x] Wiring: table above; no interface change

## Vision audit

- [x] Serves NFP 5 (narrative over mechanical perfection) and the Vision's god-reading-a-chronicle stance, which is doctrine v2's rule zero.
- [x] No Vision premise changes, and no edit is needed.

## Rulebook impact

- [x] `Docs/canon/rulebook.md`: none. No rule of play changes.
- [x] `Docs/canon/rulebook-quick-reference.md`: none.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | no new numbers |
| 2. Inspectability | PASS | `check:encounter` and the package view show every line by field |
| 3. Determinism | PASS | placement unchanged by construction, and asserted |
| 4. Fail-soft | PASS | table above |
| 5. Narrative | PASS | the whole slice is the narrative surface |
| 6. Additive | PASS | adds `settings`/`openings`; rewrites text in place; no schema change |
| 7. Performance | PASS | data only |

## Coordination block

**Blocked by:** nothing.
**Suggested model:** opus. A from-scratch prose rewrite to a doctrine, judged by a cold read, plus about 80 one-line openings.
**Parallel-safe with:** [THR-2090](https://linear.app/threadbare/issue/THR-2090) and [THR-2094](https://linear.app/threadbare/issue/THR-2094) (god cards and the Mandate ledger), the art-led slices [THR-2098](https://linear.app/threadbare/issue/THR-2098)–[THR-2103](https://linear.app/threadbare/issue/THR-2103) (components), [THR-2091](https://linear.app/threadbare/issue/THR-2091) (hex push).
**Mutex with:** any ticket editing these ten entries in `src/data/encounter-content.ts`, `RETROFIT_PENDING` or `FIRED_TEMPLATE_COMPLETION` (append-only lists, conflict-prone), the golden exemplar fixture, or `nudge-authoring-spec.md` — including this ticket's own follow-ups (wave 2, factory chain), which go after it.

**Files to touch:** `src/data/encounter-content.ts` (ten entries), `src/data/content-eval/firedTemplateCompletion.ts`, `src/data/content-eval/retrofitPending.ts` (removals only), `src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts`, `.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md` (one token; bump `last_validated_against` if the skill carries one), `src/data/encounters/the-unclaimed-relic.ts`, `the-broken-seal.ts`, `the-drowned-archive.ts`, `the-unfinished-rite.ts`, `the-beast-in-the-granary.ts`, `src/data/narrative-content.ts`, and any test that pins a rewritten string.

## Notes for the executor

- Throw the old lines out and write from the skeleton. Do not edit them toward the doctrine; Christian rejected exactly that on 2026-08-25.
- Write the arrival lines to read right in every class. "{name} arrives at the market in {location}" is wrong for a battlefield camp; "{name} reaches the camp market behind the lines at {location}" is right.
- The audit's reader is a few lines over `authoredProse` (`compositionContract.ts:1925`). Bundle it with esbuild as `check:encounter` does, to produce the cold read's input.

## Intent-judge verdicts

**Run 1 (2026-10-31, opus, cold): Revise** (Reversible confirmed). Three gaps, all fixed:
- the three follow-ups were named as filed but not linked; they are now filed and linked (THR-2108, THR-2109, THR-2110);
- the exemplar has five strength-tagged lines, not four (line 303, a cost card, ends "A strong help."); C1.1 names all five;
- Done-when 4's grep would have flagged the correct line "what did {they} leave behind?"; the predicate now names the seven sites and leaves that line alone.

The judge's nit on the seam count is reconciled: seven sites everywhere. Separately, the strength-tag total was mis-summed as 133; a case-insensitive grep gives 121.

**Run 2: Allow** (Reversible confirmed). Every run-1 fix was verified against the files and Linear. Two nits were folded in: "four card lines" became "five" in § What is decided, and a stale section pointer was fixed.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-31*

### NFP audit

**NFP AUDIT: PASS-with-notes.** NFPs 2, 3, 4, 5 and 7 pass: inspectable via `check:encounter` and the package view; placement unchanged by construction and asserted; a fail-soft table for missing classes, token typos and `{s}` after a name; data only. **1 (note):** the 80-word opening cap is not tied to a named constant. *Lane response:* it is: the cap is the opening row of `NUDGE_WORD_BUDGETS`, which the Constants table names. **6 (note):** old prose is replaced in place, which is the point of a rewrite; `RETROFIT_PENDING` only shrinks. The auditor did not read `wiring-checklist.md` (532 KB), and took the placement claim from the plan. The intent judge verified it at `settingClasses.ts:31`/`:70`.

### Three-pillar audit

**PILLAR AUDIT: PASS.** Engine and UI are N/A with rationale (the existing converter path with the `:8247` precedent; no new surface, with the browser-verify exemption stated). Content is present and substantive: C1 (five exemplar lines, seven seams, each with file and line) and C2 (ten templates, each with a seven-point rewrite spec and calibration lines). No required section is missing. The substrate inventory extends three active subsystems and builds nothing green-field.

### Vision audit

**VISION AUDIT: PASS-with-notes.** No contradictions. It supports the north star ("the mortal has to feel like a person") and the core loop's "prose earns that attention"; it respects the taste profile (prose-first, no numbers, GM register). The card lines keep the god's influence register. **Notes:** the no-new-cast decision leaves role figures unnamed, a soft limit on the north star. The exemplar rewrite overrides a v1-era approval through a lane decision; it is flagged "veto welcome". *Lane response:* both are recorded under § What is decided with veto lines, and cast naming is called out as a possible structural ticket in the brainstorm.
