> **title:** Finish the encounters the player actually meets — at-cost prose, extreme bands, band endings and a dealt hand, in firing order — THR-1634
> **linear_issue:** THR-1634
> **author:** Claude Code (design lane, run 2026-09-28d)
> **created:** 2026-09-28
> **three_pillars:** Engine `done — one converter passthrough, a completion ratchet test, and a dealing spike; no tick-loop change` · Content `done — afterimages, deal declarations and band endings on the ten most-fired templates (S1), then The First's other draws (S2) and the next ten by world rank (S3)` · UI `N/A — no new surface; the new prose and hands appear in the existing encounter stage and chapter archive. The S1 spike carries browser evidence for the dealt hand on a legacy template`

# Finish the encounters the player actually meets — THR-1634

*When a mortal succeeds at a cost, the game currently shows the plain success line, because 92% of what fires has no at-cost prose. The encounters The First meets offer no hand either. This plan completes the encounters that actually fire, most-fired first: every outcome gets its own line, every step gets a hand dealt from the god's repertoire, and every ending that already exists learns how the scene went.*

## Why this is load-bearing

Success at a cost is the rulebook's everyday result: 21.6% of every resolution in an attended world, and 29.5% of The First's. Today it reads as a clean win. `afterimageForOutcome` (`src/types/unifiedAction.ts:2952`) falls back to the success line when a step has no `successAtCostAfterimage`, and the templates that carry one account for **8.0%** of attended firings. A critical success reads as an ordinary success and a critical failure as an ordinary failure, for the same reason (`:2946`, `:2954`). And the hand, the player's whole verb in an encounter, appears on templates carrying **7.2%** of firings.

The living-world map ([A world that starts alive](https://linear.app/threadbare/issue/THR-1589)) split its content program into a **reach half** and a **volume half**. The reach half is [Let written encounters land](https://linear.app/threadbare/issue/THR-1633), carve-up plan 4 of 7. Its S1–S3 shipped on 2026-09-28. This is the volume half, carve-up plan 5 of 7. It was blocked on the reach half on purpose: THR-1633 changed which templates fire, and this plan is ranked by what fires.

**Settled input — not reopened here.**

- [Write where the dice land](https://linear.app/threadbare/issue/THR-1598) (research, 2026-09-25, resolved by `tb-orchestrator` T1.5, not vetoed). Its rules:
  - Finish templates in the order the dice land.
  - Each slice gets at-cost prose, missing extreme-band prose and a `deal` hand.
  - Band endings go on existing aftermaths.
  - Completing existing templates is **bulk work, unsampled**. Brand-new templates go through the Encounter Factory's 2-of-6 sample.
  - Make the top five fire less often.
  - Stop after three slices.
- [What the player actually meets](https://linear.app/threadbare/issue/THR-1590) (task, 2026-09-25): the attended dice match the unattended ones, so the world's firing ranking is the demand ranking. That still holds (§ Re-measured: the attended top-10 and the unattended 200-tick top-10 share nine templates).
- The THR-1633 closeout comment (2026-09-27) told this plan to **re-rank from a fresh run after the reach slices land, not from THR-1598's list**. Done below.

**Decided in this plan by the design lane under delegation** (process.md rule 4 — the *how* of an agreed outcome; each is marked *Lane decision* where it appears and can be vetoed in chat):
1. The slices are re-ranked from today's run. THR-1598's list is superseded (§ Re-measured).
2. Background prose counts, because the player can read it (§ Open call 1).
3. No new damper for the top five: the world-wide one already holds them (§ Open call 3).
4. Templates without an aftermath get their endings from the afterimage ladder, not from a new aftermath (§ What "complete" means).
5. The rewards-variety fog does not enter the plan (§ Out of scope).
6. The five `encounter.slice.*` templates are excluded.

**Words.**
- *Afterimages* are the per-band text on a step (`successAfterimage`, `successAtCostAfterimage`, `criticalSuccessAfterimage`, `failureAfterimage`, `criticalFailureAfterimage`): the UL's word, part of the `outcome` prose field class (`Docs/ubiquitous-language/Prose.md` § Field class; `Encounters.md` § Aftermath). An *at-cost line* is a `successAtCostAfterimage`.
- *A hand* is a step's nudge hand. A *dealt hand* and a *deal declaration* are the UL terms (`Docs/ubiquitous-language/Encounters.md` § Dealt Hand, § Deal Declaration).
- A *band ending* is an `AftermathVariant.byOutcome` override (THR-969).

## Re-measured on current `main` (2026-09-28)

Measured on `main` @ `c077dd9a`, after THR-1633 S1 (the fair shortlist), S2 (a journey keeps its goal) and S3 (spotlight mortals join guilds). Seeds 42 and 99, medium map. The commands are the same as in the audit README.

- `readers/attended.ts 42,99 150`: an attended world, identity and The First bonded, no clicks. It has an unattended arm.
- `readers/reach.ts 42,99 200`: unattended.
- `readers/completion.ts` (new with this plan): joins the attended firings against the live template registry. For every fired template it reports which afterimage fields, hands and band endings exist. It walks branch arms and fallbacks the way `attended.ts`'s `stepsOf` does, and counts a step with only a `deal` as having a hand.

Raw outputs are in `Docs/audits/2026-09-25-living-world-data/output/`: `attended-medium-2026-09-28.{txt,json}`, `reach-gates-2026-09-28.json` and `completion-2026-09-28.{txt,json}`.

| Measure (seeds 42 + 99) | 2026-09-25 (THR-1598) | 2026-09-28 (`c077dd9a`) | Source |
|---|---|---|---|
| Attended encounter firings, 150 ticks | 772 | **1,542** | `attended-medium*` |
| Top-10 share, attended | 47.4% | **23.5%** | same |
| Top-10 share, unattended 200 ticks | 49.7% | **23.1%** (1,831 firings, 159 drawable fired) | `reach-gates-2026-09-28.json` |
| Most-fired template's share | 7.1% (`confront_the_unknown`) | **3.0%** (`barter_supplies`) | same |
| Distinct templates fired, attended | 95 | **185** | `attended-medium*` |
| At-cost resolutions, attended | 267 / 745 (35.8%) | 324 / 1,503 (**21.6%**) | same |
| Firings on templates with *any* at-cost prose | 3.8% | **8.0%** | `completion-2026-09-28` |
| Firings on templates with the full afterimage ladder on every step | not measured | **7.2%** (14 templates) | same |
| Firings on templates with a hand (authored or dealt) | 4.8% | **7.2%** (14 templates) | same |
| Templates in the top 40 that are on `RETROFIT_PENDING` | not measured | **34 of 40** | same |
| Templates in the top 40 with any aftermath config | not measured | **6 of 40** | same |
| The First: firings · distinct templates | 14 · 11 | **45 · 25** | `attended-medium*` |
| The First: at-cost share of its resolutions | not measured | **29.5%** (13 of 44) | same |
| The First: longest gap between encounters (42 · 99) | 90-tick wait before its first | **25 · 25** | same |

**What changed, in game terms.**

1. **The world is flat now.** In THR-1598's ranking five templates carried a quarter of all firings. Now the most-fired template is 3% and it takes the top 40 to reach 61%. Coverage per template is lower, so the plan has to spread across more templates for the same share.
2. **THR-1598's list is gone.** Its slice 1 was `confront_the_unknown`, `master_local_craft`, `arcane_resonance_study`, `plague_outbreak`, `master_craftsman_challenge`, `rally_the_locals`, `weave_political_alliance`, `trace_ley_lines`, `crafting.quest.flawed_steel`, `army.supply.siege_lifted`. Today only `flawed_steel` is in the top 10; the rest rank 18th to 86th. Its slice 2 was The First's `reputation.*` draws, and The First draws none of them now. *Lane decision:* the slices below replace THR-1598's lists; THR-1598's rules carry over unchanged.
3. **The First reads the same encounters as the world.** Its 45 firings spread over 25 templates. 16 of them rank inside the world's top 60, and 4 are in the top 10. Most are everyday `encounter.*` board templates such as barter, tending, vault heists and guild aid. Only one is a story beat (`veil.truth.page_beneath_saint`). So finishing the world's most-fired templates also finishes most of what the player reads live.
4. **The work is shaped like the corpus.** The top 40 are mostly two- and three-step `encounter.*` entries in `src/data/encounter-content.ts`: 34 are on `RETROFIT_PENDING` and 34 have no aftermath. One is a branching encounter with its own file (`crafting.quest.flawed_steel`).

**The ranking** (attended, both seeds; columns: firings, of which The First, of which at-cost):

| Rank | Template | Fired | First | At-cost | Steps | Has now |
|---|---|---|---|---|---|---|
| 1 | `encounter.barter_supplies` | 47 | 0 | 6 | 2 | nothing |
| 2 | `encounter.decipher_old_markings` | 39 | 1 | 5 | 2 | nothing |
| 3 | `encounter.commune_with_stars` | 37 | 0 | 4 | 2 | nothing |
| 4 | `encounter.tend_the_weary` | 37 | 1 | 5 | 2 | nothing |
| 5 | `encounter.barter_with_travelers` | 36 | **7** | 6 | 2 | crit lines on 1 step |
| 6 | `encounter.local_tales` | 36 | 0 | **15** | 2 | nothing |
| 7 | `crafting.quest.flawed_steel` | 34 | 3 | 1 | 5 (incl. branch arms) | crit lines on 4 arms; 4 aftermath variants, no band endings |
| 8 | `encounter.pickpocket` | 33 | 0 | 3 | 3 | nothing |
| 9 | `encounter.study_surroundings` | 33 | 0 | 8 | 2 | nothing |
| 10 | `encounter.assess_holdings` | 30 | 0 | 5 | 2 | nothing |

The full ranking (185 templates) is in `completion-2026-09-28.txt`.

## The open calls THR-1598 left, settled

**Open call 1 — is background prose read?** *Lane decision: yes, the player can read it, so it counts. The First's draws still come first.* Measured in code:

- **Live, on the encounter stage** (scene, hand, outcome): only for a threaded mortal at the story-beat tier, or at shaping when the player attended the tug. `encounterVisibility.ts:493`, `:502` and `:506-511`. For today's world that means The First.
- **In the chapter archive: every resolved encounter, threaded or not.** `orchestrator.ts:3947-3950` archives each resolution. `chapterArchive.ts:220-224` stores `afterimageForOutcome(...)` per step and `:151` stores the aftermath overview. `ChapterView.tsx:212-214` and `:234` render both. The global ledger filters to threaded chapters by default (`ChapterLedger.tsx:152`). Any mortal's **Chapters tab** on their sheet (`AgentProfileModal.tsx:305`) and the ledger's "show all" render the full afterimages of an unthreaded mortal. Non-threaded records are evicted first (`chapterArchive.ts:54`, `:269-273`).
- **The one-line event** (`unifiedActionResolution.ts:2748-2774`) carries only the template name and an outcome verb. It is not authored prose.

So when a player opens a mortal's sheet, which the living-world map exists to make worth doing, they read that mortal's chapter, including every at-cost line that fell back to a success line. The world's firing ranking is the right demand signal. The First's draws are weighted first within it, because those are also read live.

**Open call 2 — near-miss.** *Settled by existing rules, not by this lane.* Near-miss resolved 0 times in 1,503 attended resolutions today (the bands table in `attended-medium-2026-09-28.txt` has no near-miss row), as in THR-1598's run. The linear authoring spec pays it through the library's **band fragments** that a dealt card brings, not through a step field (`template-encounter-rewrite` SKILL.md, the fields table). This plan therefore authors **no** `nearMissAfterimage`. Dealing a hand is what gives near-miss its payoff. (`nearMissAfterimage` exists on `ActionStep`, `unifiedAction.ts:1957-1971`, and falls back to the success line. Leaving it absent is today's behaviour.)

**Open call 3 — make the top five fire less.** *Lane decision: no new work; the damper exists and is holding.* The world-wide novelty damper already caps any one template's share of the world's draws:
- `NOVELTY_GLOBAL_SHARE_TARGET = 0.04` with a steep exponent, `agent-behavior-constants.ts:1251-1263`;
- a share ceiling, `NOVELTY_TEMPLATE_SHARE_CEILING = 0.08`;
- global recency, `NOVELTY_GLOBAL_MAX_PENALTY = 0.95`.

All of these apply at `encounterScoring.ts:1498`. Measured today, the most-fired template is 3.0% of attended firings (3.4% unattended over 200 ticks), under the 4% target. The top-10 share fell from 47% to 23.5% as the reach slices landed. What THR-1598 asked for already holds, so a second damper would fight the first. The kill criteria below re-check it after each slice, because completion must not change the draw.

**Open call 4 — a spike on a `deal` for legacy templates.** *Answered by reading the code, with one real defect found. The spike remains as S1's first step.*
- The dealer does not care whether a template is legacy. It builds the hand from the god's repertoire (`dealHand.ts:512-518`), reads no tier or court position, and a step with only a `deal` and no authored specials is legal (`dealHand.ts:283`; `nudgeHandChecklist.ts:222-226`).
- **But a `deal` authored on an `encounter-content.ts` entry never reaches the shipped template.** That file's `toUnifiedTemplate` builds every `ActionStep` field by field (`encounter-content.ts:320-340`). Its raw step type and its passthrough list name `successAtCostAfterimage`, `purposeLine`, `factorLines` and `nudges` (`:249-252`, `:335-338`), but not `deal`.
- This is the THR-838 converter-allowlist trap again: a field outside the list is dropped silently, with no type error in either position. **Nine of S1's ten templates live in that file.** Without the fix, the hand half of S1 would ship as data nobody reads.
- The fix is S1 item E1. The spike then proves the hand renders.

**Open call 5 — The First's list rests on few firings.** *Addressed by making slices predicates.* 45 firings is still a small sample of The First's draws, and a different seed draws differently. Slices therefore name a **membership predicate** re-run at pickup (THR-688 rule A). The tables here are today's snapshot of it, not a fixed list.

## Substrate inventory

`Docs/canon/systems-inventory.md` was grepped for encounter, aftermath, nudge, deal, repertoire, chapter and archive. Every system this plan touches exists and is active; nothing here is new.

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| **Encounters & Dilemmas**: step afterimages (`afterimageForOutcome`), `aftermathConfig` with `byOutcome` (THR-969) | 🟢 ACTIVE | **extends (content only)**: fills the fields on fired templates; no resolver change |
| **Nudge hand / Repertoire**: `dealHand.ts` (THR-1247), `nudgeHandChecklist.ts` | 🟢 ACTIVE | **extends**: `deal` passes through the `encounter-content.ts` converter (E1); fired templates declare it |
| **Chapter archive**: `chapterArchive.ts`, `ChapterView.tsx`, `ChapterLedger.tsx` | 🟢 ACTIVE | **preserves**: already renders what this plan writes |
| **Composition Contract / `RETROFIT_PENDING`**: `compositionContract.ts`, `retrofitPending.ts`, `check:encounter` | 🟢 ACTIVE | **preserves**: completion does not bring a legacy template up to the full contract, so it stays on the ratchet. If one does come to pass, the ratchet test fails until it is removed from the list, which is the intended ratchet |
| **Encounter novelty damper**: `encounterNoveltyRecord`, `encounterScoring.ts:1498` | 🟢 ACTIVE | **preserves**: open call 3; checked, not changed |

**Population counts consumed (runtime, not grep).**
- 185 templates fired in 150 attended ticks.
- S1: 10 templates with 24 steps, counting branch arms. 9 are in `encounter-content.ts` and 1 is in `src/data/encounters/flawed-steel.ts`. Only `flawed_steel` has an aftermath config (4 variants).
- S2 and S3: see § Slicing. All 20 are in `encounter-content.ts` except `veil.truth.page_beneath_saint` (`src/data/encounters/the-page-beneath-the-saint.ts`, 3 aftermath variants).

## What "complete" means

A fired template is **complete** when all of these hold. The S1 ratchet test (E3) asserts each clause:

1. **Afterimages on every step**, branch arms and fallbacks included: `successAtCostAfterimage`, `criticalSuccessAfterimage` and `criticalFailureAfterimage`, beside the existing `successAfterimage` and `failureAfterimage`. The at-cost line names the cost in the scene: what was spent, broken, owed or seen. The rulebook's at-cost is a success that leaves a mark, and a line that reads as a clean win is a defect. Crit lines differ in kind from the plain band, not only in degree.
2. **A hand on every step**: an authored hand already present, or a `deal` declaration. A declaration is `count`, context `tags` from the closed `DealContextTag` set, and optionally 0–2 authored specials under the existing hand rules (4–8 composed, `NUDGE_HAND_MIN..MAX`). Specials are optional. The default is a pure fill, which is the cheap path THR-1247 built.
3. **Band endings where an aftermath exists.** Each reachable path's variant carries `byOutcome` overrides for the losing bands its steps can end on: `critical_failure` always, and `failure` when a step on that path is `fail_action`. Coverage is owed per path (THR-1509). Winning bands are optional. Overrides reuse effects and chip words the variant already has: a band ending re-tells *how* the existing change landed. It never adds a chip without a state write behind it (UI Law 56). A band that needs a new effect is out of scope and becomes a finding in the slice's closeout.
4. **No new aftermath.** *Lane decision:* a template with no `aftermathConfig` does not get one. Its ending is the afterimages of its last step, plus the generated overview `buildEncounterAftermathOverview` (`unifiedActionResolution.ts:3089`). Writing an aftermath from scratch is full-contract work: setting envelope, cast binding, a persistent reward, three system connections. THR-1598 routed that to the factory (its slice 4), and it stays there.

**Register.** Prose Doctrine v2, narrator mode, baseline register. "Game prose, not novel prose" is rule zero of the nudge authoring spec. The authoring skill is `template-encounter-rewrite` for linear entries. `flawed_steel` and `page_beneath_saint` are edited in their own files under the same spec. `flawed_steel` is a wiring-only exemplar (`Docs/exemplars.md`): its new lines are written to today's doctrine, not copied from its older prose.

**Floor (the bulk path, THR-1598's sampling policy).** Christian does not sample. The floor is:
- `check:encounter` stays within the `RETROFIT_PENDING` ratchet;
- the prose-register report (`window.__DEBUG.proseQualityReport()` or the register scorer), recorded in the PR body, with no new `fail`;
- one critic-agent pass per template against the 12-question narrator checklist.

This is the path THR-1598 decided under delegation, with a veto invited and not used.

## Engine pillar

No tick-loop, scoring, resolution or graph change. Three small pieces make the content half shippable and keep it from sliding back.

### E1 — `deal` reaches the shipped template (S1)

Add `deal?: StepDealDeclaration` to the raw step type in `src/data/encounter-content.ts` (beside `nudges`, `:252`), and `deal: step.deal` to `toUnifiedTemplate`'s step builder (beside `nudges: step.nudges`, `:338`). Entries that author no `deal` convert byte-identically (NFP #6).

**Other converters.** The executor greps `toUnifiedTemplate` across `src/data/` and adds the same passthrough to every converter that builds a template in the slice being shipped:
- S1 needs only `encounter-content.ts`. `flawed-steel.ts` authors `UnifiedActionTemplate` steps directly.
- S2 and S3 re-check at pickup. Their templates are all `encounter-content.ts` entries or direct-authored files today.

**Test.** The test asserts on the **shipped** object, not the authored literal (the THR-838 lesson): `getAnyEncounterById('encounter.barter_supplies').steps[i].deal` equals what the entry declared.

### E2 — the dealing spike (S1, first step)

Before any prose, declare a `deal` on one S1 template (`encounter.barter_with_travelers`, The First's most-drawn) and prove three things:

1. **It renders.** On a local dev build, `?view=game&seeded&size=medium&spawn=encounter.barter_with_travelers` opens the stage with a composed hand of 4–8 cards on step 1, read from the DOM (the cards are DOM, not WebGL).
2. **It does not change an unattended world.** Dealing uses no PRNG (`dealHand.ts` header). `readers/reach.ts 42,99 200` with and without the declaration must give identical per-template firing counts.
3. **It stays inside the tick budget.** The dealer runs on each resolution of a template that declares a fill (`unifiedActionResolution.ts:581`, `:614`, `:2071`). Once all ten S1 templates declare one, attended ms per tick must stay within `COMPLETION_TICK_BUDGET_PCT` of a same-session baseline.

If (1) fails, the hand half of S1 stops and becomes a finding (kill criteria). The prose half ships alone.

### E3 — the completion ratchet (S1)

A growing list, `FIRED_TEMPLATE_COMPLETION` in a new `src/data/content-eval/firedTemplateCompletion.ts`, holds the ids each slice has completed. A vitest beside it (`src/data/__tests__/firedTemplateCompletion.test.ts`) asserts clauses 1–3 of § What "complete" means for every listed id, on the shipped template:
- steps walked through branch arms and fallbacks;
- `byOutcome` checked with the same per-path predicate the `?outcome=` verdict uses (THR-1509).

The list only grows. Removing an id is a deliberate edit in a PR, the same shape as `RETROFIT_PENDING` in reverse. It lives in `content-eval`, off the client bundle.

### Graph nodes / edges · Tick phases · Resolution logic

N/A: no node, edge, phase or resolver change. Afterimages is read by the existing `afterimageForOutcome`, and band endings by the existing `applyAftermathOutcomeBand`.

### PRNG callouts

None consumed. Dealing is pure over (repertoire, declaration, world state). E2's second check pins it.

## Content pillar

| Slice | Templates | Steps | Work |
|---|---|---|---|
| **S1** (this ticket) | ranks 1–10 (table above) | 24 | Afterimages where missing: 24 at-cost, 19 crit-success and 19 crit-failure lines. A `deal` on every step. `flawed_steel`'s 4 aftermath variants get losing-band endings per path |
| **S2** | The First's other draws (§ Slicing predicate) | 28 | Same, plus `page_beneath_saint`'s 3 aftermath variants |
| **S3** | the next ten by world rank (§ Slicing predicate) | 22 | Same |

The line counts are estimates from `completion-2026-09-28.txt`; the executor's own run of the reader is authoritative.

### Encounter templates

Existing only. No new template, family, seed or aftermath. **New templates stay out** (see § Out of scope): the +40 hamlet/town templates and the ruin family that THR-1598 routed to the factory.

### Prose tables · Attachment content

N/A: afterimages live on template steps. No prose table or attachment changes.

### Data tables

`FIRED_TEMPLATE_COMPLETION` (E3). No constant in the client bundle changes.

## UI pillar

UI: N/A — no component, modal or HexMapV2 layer changes. What the player gets is more text and more hands in two existing surfaces: the encounter stage (the hand, the outcome line) and the chapter archive (a mortal's Chapters tab, the ledger).

**Browser evidence** is owed once, by the E2 spike, because only E2 exercises a rendering path new to these templates: a dealt hand on a converter-built legacy entry.
- Route: Playwright DOM on a local dev build, at 1920×1080, with `?view=game&seeded&size=medium&spawn=encounter.barter_with_travelers`.
- Check: count the rendered hand cards.
- Then add `&outcome=success_at_cost` and confirm `await window.__DEBUG.getOutcomePinVerdict()` returns `band_rendered` with the new line on screen.

Prose and band endings on S1–S3 are content-pillar work, accepted headless (THR-688 rule C) through E3 and the readers.

**UI Laws engaged:** none newly. The hand is the existing stage's card row, whose faces are library-generic by construction. Band endings reuse existing chips, and Law 56 (a chip needs a state write) is kept by § What "complete" means, clause 3. The spike's evidence line cites the DoD minimum set (Laws 1, 13/14, 17, 21, 33, 37).

### Debug inspection (DebugPanel)

Nothing new. The existing reads cover it:
- `?outcome=` with `getOutcomePinVerdict()` pins any band of a `?spawn=`ed template, so every new line and band ending can be reviewed from a URL;
- `?forceencounters` surfaces a threaded agent's hand.

### Player-facing display · Event notifications · Visual presence (HexMapV2)

N/A: existing surfaces only (above).

## Wiring

> See checklist: `Docs/plans/wiring-checklist.md`. Each slice checks E1's passthrough and E3's list against it at closeout.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `toUnifiedTemplate` `deal` passthrough (E1) | registry build (module load) | encounter stage (existing) | — | — | `getAnyEncounterById(id).steps[i].deal` |
| dealt hand on legacy steps (E2) | resolution (`unifiedActionResolution.ts:581/614/2071`, existing) | `buildNudgePhaseModel.ts:640` (existing) | — | existing forecast traces | `?spawn=` + DOM |
| afterimages (S1–S3) | resolution → `afterimageForOutcome` (existing) | stage, `ChapterView` (existing) | `chapterArchive` records (existing) | — | `?outcome=` verdict |
| band endings (S1–S3) | aftermath → `applyAftermathOutcomeBand` (existing) | aftermath panel, `ChapterView` (existing) | `aftermathSummary` (existing) | — | `?outcome=` verdict |
| completion ratchet (E3) | — (test) | — | — | — | vitest |

The systemic wiring guide gains no capability: `deal`, afterimages and `byOutcome` are all documented there already (Capability 18 for `byOutcome`).

## Interface impact

Encounters & Dilemmas (core) is ⚪ UNAUDITED. Per protocol §4, this plan writes rows for the contracts it touches. The executor registers the `add` row in `scripts/interface-contracts.ts` in S1.

| Contract | Action | Detail |
|---|---|---|
| `raw-entry-deal-reaches-template` | **add** (S1) | Content → Encounters: a `deal` declared on an `encounter-content.ts` entry arrives on the shipped `ActionStep`. Producer `toUnifiedTemplate`; reader `composeDealtStepFromState` (`dealHand.ts`). Evidence: E1's shipped-object test |
| `engagement-forecast-gates-choice` | **preserve** | Dealing does not touch scoring; E2 check 2 pins identical unattended firings |
| `shortlist-reaches-every-template` | **preserve** | THR-1633 S1's row. Completion changes no draw |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `FIRED_TEMPLATE_COMPLETION` | S1's ten ids | E3: the growing list of completed fired templates the ratchet test checks |
| `COMPLETION_SLICE_TEMPLATES` | `10` | Templates per slice, one executor run's worth of prose (~60–80 lines) |
| `COMPLETION_TICK_BUDGET_PCT` | `5` | E2: attended ms per tick after the S1 deals, against a same-session baseline |
| `COMPLETION_TOP_TEMPLATE_SHARE_MAX` | `0.04` | Kill check: after each slice, no template above this share of attended firings. It matches the damper's own target (`NOVELTY_GLOBAL_SHARE_TARGET`) |
| `COMPLETION_NEXT_SLICE_MIN_SHARE` | `0.08` | Stop rule: a fourth slice is filed only if the next ten incomplete templates carry at least this share of attended firings, or include at least two of The First's draws |
| `DEAL_DEFAULT_COUNT` (existing, `dealHand.ts` imports) | unchanged | A step's `count` when its author has no reason to pick one |

The ratchet list and the acceptance constants live in `src/data/content-eval/` (authoring side), not the client bundle.

## Tracing

N/A — no new trace types; what happened is already inspectable:
- the chapter archive record stores the afterimages shown;
- the `?outcome=` verdict names the band, the path (`variantKey`) and whether that band is authored there;
- the dealt hand's ids are namespaced `dealt.<memberId>` on the stage model.

A missing line stays visible as a fallback, not an error, and E3 is the census of which templates are complete.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| A step still lacks at-cost or crit prose | `afterimageForOutcome` falls back to the success or failure line: today's behaviour |
| A `deal` declared but no `ascendantIdentity` (headless, CLI) | `composeDealtStepFromState` deals nothing (`dealHand.ts:512-518`); the step has no hand, as today |
| A `deal` asks for more cards than fit | The dealer clamps to the hand window; no oversized hand, no error |
| A converter outside S1's file drops `deal` | E1's shipped-object test fails in CI for any slice template it covers |
| A band ending names a band the path cannot reach | Never rendered. The ratchet predicate is the THR-1509 per-path one, so the executor sees it as a verdict, not a crash |
| The E2 hand does not render | Kill criteria: the prose half ships, the hand half becomes a finding |

## Slicing

Slices are **predicates re-run at pickup** (THR-688 rule A). The lists are the 2026-09-28 snapshot and each slice's ticket carries its predicate verbatim. `encounter.slice.*` templates are always excluded: they are under Christian's playthrough ([THR-1220](https://linear.app/threadbare/issue/THR-1220)).

| Slice | Predicate | Snapshot (2026-09-28) | Depends on | Size |
|---|---|---|---|---|
| **S1** (this ticket) | The 10 highest-ranked incomplete templates on a fresh attended run | `barter_supplies`, `decipher_old_markings`, `commune_with_stars`, `tend_the_weary`, `barter_with_travelers`, `local_tales`, `crafting.quest.flawed_steel`, `pickpocket`, `study_surroundings`, `assess_holdings`. They carry 23.5% of attended firings, 17.9% of at-cost results, and 12 of The First's 45 | — | medium (E1–E3 small; prose ~60 lines) |
| **S2** | Templates The First drew on a fresh attended run, incomplete, highest world rank first, up to 10 | `rest_and_recover`, `shadow_in_the_night`, `vault_heist`, `merchants_gambit`, `knowledge_test`, `barter_survival`, `veil.truth.page_beneath_saint`, `confront_the_unknown`, `aid_refugees`, `guild_aid`. 20 of The First's firings; 10.2% of all | S1 (E1, E3 in place) | medium |
| **S3** | The next 10 highest-ranked incomplete templates on a fresh attended run | `forage_provisions`, `festival_of_spheres`, `forage_the_land`, `investigate_anomaly`, `dead_drop`, `trace_ley_lines`, `tribute_exchange`, `shore_up_shelter`, `listen_for_rumors`, `local_gossip`. 14.5% of all | S2 | medium |

After S1–S3 the snapshot covers 48.2% of attended firings, 41.4% of at-cost results and 32 of The First's 45 firings, up from 8.0% of firings and 4 of The First's 45. **Stop after S3** (THR-1598's stop rule), re-run `completion.ts`, and file a fourth slice only if `COMPLETION_NEXT_SLICE_MIN_SHARE` says so. That call belongs to the design lane with the numbers, not to the executor.

This ticket carries **S1**. S2 and S3 are filed at handoff as their own tickets, each blocked as above.

## Out of scope

- **New templates** (THR-1598's +40 hamlet/town, a ruin family, lairs). The factory's 2-of-6 sample path, briefed separately after a fresh `readers/demand.ts` census. THR-1612 and THR-1613 have landed, so the precondition THR-1598 named is met. A brief is a design-lane candidate, not this plan.
- **New aftermaths** on the 34 of 40 fired templates that have none. Full-contract factory work (THR-1598 slice 4).
- **Rewards variety** (map fog: `starter_revelation` ≈ 10% of grants). *Lane decision:* it does not rank. It is granted by a starter possession, the Burned Codex, on first use (`src/data/starter-attachments.ts:247-253`), not by any encounter on the ranked list. Completion cannot move it.
- **Art** for the named templates: the map's Out of scope.
- **A weighting change** for the top five: open call 3.

## Three-pillar check

- [x] Engine pillar present: E1 (converter passthrough, a real defect with a code cite), E2 (spike with three measurable checks), E3 (ratchet test)
- [x] Content pillar present: three slices, each a predicate with a snapshot, a definition of complete, a register and a floor
- [x] UI pillar present: N/A with rationale (existing surfaces only); the one new rendering path gets browser evidence in E2
- [x] Wiring section connects them: every new field has a named reader

## Vision audit

- [x] **No contradiction with any Vision premise.** Files: `Vision/00-north-star.md` (the outcome feels partly in the player's hands and partly not, told in prose), `Vision/01-core-loop.md` (the aftermath exists so consequences compound; the scan decides what is front of stage), `Vision/02-non-negotiables.md` #1 (god, not protagonist), #3 (mechanics surface through prose, never numbers) and #6 (additive), `Vision/taste-profile.md` (no numbers in UI; the meeting-encounter prose is the quality bar).
  - **Every band pays off** (the five-band ladder, THR-772, and non-negotiable #3): this plan is that premise applied to the corpus. A cost that reads as a clean win is exactly the flattening the five-band ladder exists to prevent, and near-miss gets its payoff through dealt band fragments.
  - **God, not protagonist:** a dealt hand is the god's own repertoire in the scene, which is the nudge model's premise (influence, never authorship).
  - **Variety** ("the same encounter twice should be rare"): the plan changes no draw and relies on the damper that enforces it.
- [x] No Vision edit is needed.

## Rulebook impact

- [x] No rule of play changes. The rulebook already says success can come at a cost, a critical result differs in kind, and the god acts through a hand. This plan makes the fired corpus say so.
- [x] No rulebook edit.

> Brainstorm companion: `Docs/plans/2026-09-28-thr-1634-finish-the-encounters-the-player-meets-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | How |
|---|---|---|
| 1. Tunability | PASS | Slice size, stop rule, tick budget and share ceiling are named constants; a dealt hand's size is the step's `count`, clamped by the existing window constants |
| 2. Inspectability | PASS | `?outcome=` verdict per band and path; chapter archive shows the line shown; E3 is the completeness census |
| 3. Determinism | PASS | Dealing is PRNG-free. E2 check 2 pins identical unattended firings with and without the declarations |
| 4. Fail-soft | PASS | § Fail-soft: every missing piece falls back to today's line or no hand |
| 5. Narrative over mechanics | PASS | The whole plan: the cost, the crit and the god's hand become legible in the story |
| 6. Additive over destructive | PASS | Only optional fields filled; E1 is byte-identical for entries without `deal`; no field removed |
| 7. Performance budget | PASS | Prose is free at runtime; the dealer cost is measured by E2 check 3 against `COMPLETION_TICK_BUDGET_PCT` |

## Kill criteria

- **E2 check 1 fails** (no hand renders on the legacy template): ship S1's prose and band endings without `deal`, file the rendering defect with the DOM evidence, and hold the hand half of S2 and S3 behind it.
- **E2 check 2 fails** (unattended firings differ with dealing on): stop. Dealing is not pure, and that breaks the THR-1247 design. Report before shipping any declaration.
- **E2 check 3 fails** (over the tick budget): ship prose only and file the dealer cost as a performance finding.
- **After any slice**, a template above `COMPLETION_TOP_TEMPLATE_SHARE_MAX` of attended firings, or a top-10 share above 0.30: completion has changed the draw, which it must not. Report before the next slice.
- **The register report shows a new `fail`**, or the critic pass flags a line as reading like a clean win: rewrite before merge. That is the floor, not a tuning call.

## Done when

**S1 (this ticket):**
- [ ] E1: `deal` passes through `encounter-content.ts`'s `toUnifiedTemplate`. A shipped-object test asserts it. Entries without `deal` convert byte-identically (existing registry tests green unchanged).
- [ ] E2: spike evidence in the PR body:
  - (1) Playwright DOM at 1920×1080: 4–8 hand cards on `?spawn=encounter.barter_with_travelers`, plus the `getOutcomePinVerdict()` output on `&outcome=success_at_cost`;
  - (2) `readers/reach.ts 42,99 200` per-template firings identical with and without the declarations;
  - (3) attended ms per tick within `COMPLETION_TICK_BUDGET_PCT`.
- [ ] The ten S1 templates meet clauses 1–3 of § What "complete" means and are listed in `FIRED_TEMPLATE_COMPLETION`. E3's test is green.
- [ ] Floor: `check:encounter -- --all` within the `RETROFIT_PENDING` ratchet; the register report on the touched templates with no new `fail`; one critic pass per template, noted in the PR body.
- [ ] `readers/completion.ts` re-run on the branch: before/after coverage lines (firings with any at-cost prose, with the full ladder, with a hand) in the PR body.
- [ ] `raw-entry-deal-reaches-template` registered in `scripts/interface-contracts.ts`; interface map regenerated.
- [ ] Code gate green: `npm test`, `npm run check:typecheck`, `npx vite build`, both freshness gates. E1 touches only a data converter, so `test:heavy` and the CLI smoke apply only if the executor's diff reaches `src/engine/`.

**S2 and S3:** their slice's content Done-when. Each re-runs the predicate, meets clauses 1–3 for every template it picks, extends `FIRED_TEMPLATE_COMPLETION`, and reports the kill check. S3's closeout also states the stop-rule numbers.

## Coordination block

**Suggested model:** fable. This is mostly prose. Christian ruled that the model that holds the prose doctrine writes the corpus (2026-07-30), and E1–E3 are small enough to ride along.
**Parallel-safe with:**
- [THR-1641](https://linear.app/threadbare/issue/THR-1641) (reach S4). It edits faction definitions, `unified-action-templates.ts`, `encounter-anomaly-content.ts` and the tag vocabulary, not `encounter-content.ts`'s S1 entries or its converter.
- The living-world Ready-for-Dev tickets ([THR-1654](https://linear.app/threadbare/issue/THR-1654), [THR-1656](https://linear.app/threadbare/issue/THR-1656), [THR-1657](https://linear.app/threadbare/issue/THR-1657), [THR-1659](https://linear.app/threadbare/issue/THR-1659), [THR-1663](https://linear.app/threadbare/issue/THR-1663)). Worldgen, chronicle and sheet surfaces, disjoint files.
**Mutex with:** any ticket editing `src/data/encounter-content.ts`'s converter (`toUnifiedTemplate`, `:240-345`) or the S1 entries (both are S1 surfaces). S2 and S3 of this plan, which share `FIRED_TEMPLATE_COMPLETION` and re-rank off the same baseline.

**Files to touch:** (S1)
- `src/data/encounter-content.ts` (E1 passthrough; the nine entries' prose and `deal`).
- `src/data/encounters/flawed-steel.ts` (prose, `deal`, `byOutcome`).
- New `src/data/content-eval/firedTemplateCompletion.ts` and `src/data/__tests__/firedTemplateCompletion.test.ts` (E3).
- A shipped-object test beside the registry tests (E1).
- `scripts/interface-contracts.ts` and `Docs/canon/interface-map.md` (row).
- `src/data/content-eval/retrofitPending.ts` only if a template now passes the full contract.

## Notes for the executor

- **Re-run the readers; do not trust this doc's numbers.** Bundle with esbuild as the audit README says, and strip `[WorldGen]` and `[worldgen]` lines before parsing. `completion.ts` takes the `--json` output of `attended.ts`.
- **The converter trap is the one to fear.** After E1, assert on `getAnyEncounterById(...)`, never on the entry literal. An authored field the converter drops type-checks and does nothing.
- **Branch arms count as steps.** `flawed_steel`'s aftermath has four variants. Coverage is owed per path. Read THR-1509's verdict fields before writing its band endings, and use `?outcome=` per path to check them.
- **`RETROFIT_PENDING` is a two-way ratchet** (`compositionContract.test.ts:536-559`). If completing a template makes it pass the full contract, the test fails until you remove it from the list. That is success; remove it.
- **Two review links for the closeout comment**, for information and not an ask:
  - `?view=game&seeded&size=medium&spawn=encounter.barter_with_travelers&outcome=success_at_cost`
  - `…&spawn=encounter.local_tales&outcome=success_at_cost`. `local_tales` has the most at-cost results of any template: 15.

## Intent-judge verdict

**Allow**. Impact class Reversible (judge-confirmed). Run 2026-09-28, cold spawn on fable, ~120 s, anti-correlation guard held. Action proposal: `Docs/plans/.intent-proposals/2026-09-28-thr-1634-finish-the-encounters-the-player-meets.md`.

- **Dimension 1 (intent fidelity): PASS.** The re-rank follows the ticket's and THR-1633's instruction, and THR-1598's rules carry over unchanged. The judge accepted the no-work answer to "make the top five fire less" on the measured 3.0% share, with the kill check keeping it honest.
- **Dimension 11 (substrate): PASS.** The judge verified E1's defect by grep: `nudges` is at `encounter-content.ts:252` and `:338`, and there is no `deal` field or passthrough.
- **One GAP, folded in before the PR (UL):** the draft coined *outcome prose* for the per-band step text. The UL already names it (*afterimage*: `Prose.md` § Field class, `Encounters.md` § Aftermath), so the plan now uses *afterimage* throughout.
- **One nit, folded in:** the header said "ranks 11–30" for S3, which contradicted the predicate. It now says "the next ten by world rank".

## Forked-audit verdicts

*Generated by design-audit-pipeline, 2026-09-28: three cold auditors on sonnet, run in parallel.*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Named constants: `COMPLETION_SLICE_TEMPLATES`, `COMPLETION_TICK_BUDGET_PCT`, `COMPLETION_TOP_TEMPLATE_SHARE_MAX`, `COMPLETION_NEXT_SLICE_MIN_SHARE`; hand size uses the existing `NUDGE_HAND_MIN..MAX` |
| 2. Inspectability | PASS | The Wiring table follows the checklist schema; the `?outcome=` verdict, the chapter archive and E3 act as the completeness census |
| 3. Determinism | PASS | "Dealing is PRNG-free"; E2 check 2 pins identical unattended firings with and without the declarations |
| 4. Fail-soft | PASS | Fail-soft table, 6 cases, each with a named fallback |
| 5. Narrative over mechanical | PASS | At-cost and crit lines plus dealt hands make outcomes legible in prose |
| 6. Additive over destructive | PASS | E1 is byte-identical for entries without `deal`; only optional fields are filled |
| 7. Performance budget | PASS | E2 check 3 measures ms per tick against `COMPLETION_TICK_BUDGET_PCT`; the kill criterion ships prose only if it fails |

NFP AUDIT: PASS

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | E1–E3 with file:line cites; PRNG callout explicit; tick-phase, resolution and graph N/A with reason |
| Content | present-and-substantive | Slicing table, per-slice counts, register and floor; prose tables N/A with reason |
| UI | N/A-with-rationale | No component changes; browser evidence specified for the one new rendering path (E2) |

No missing required sections. The Wiring table maps E1, E2, S1–S3 and E3 to phase, component, GameState field, trace and debug visibility. Substrate check: present and correct; five 🟢 ACTIVE subsystems, extends or preserves, no green-field duplication.

PILLAR AUDIT: PASS

### Vision audit

- `00-north-star.md`: the outcome is partly in the player's hands, told in prose. *Extended.*
- `01-core-loop.md`: the aftermath exists so consequences compound (*extended*); the scan decides (*confirmed preserved*: no draw change, instrumented).
- `02-non-negotiables.md` #1, #3 and #6: *confirmed*.
- `03-design-tensions.md`: not pulled.
- `taste-profile.md`: numbers-in-UI anti-pattern avoided; the register floor stands in for the meeting-encounter bar.

No contradictions. **Note:** the Vision section paraphrased premises without file citations. Folded in: the section now names each Vision file and the premise it draws on.

VISION AUDIT: PASS-with-notes (note folded in)

