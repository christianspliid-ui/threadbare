> **title:** `Encounter stakes line — THR-1727`
> **linear_issue:** THR-1727
> **author:** Claude Code (attended design session with Christian)
> **created:** 2026-10-04
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# Encounter stakes line — THR-1727

*One formula sentence tells the player what an encounter is about, and the same parts tell the finished story afterwards.*

## Why this is load-bearing

Christian, playing The Unsafe Bridge for the THR-1220 checkpoint (chat, 2026-10-04): the encounter summary text "should be reworked across encounters". The top of the veil carries two unrelated texts today:

- **The summary** (`template.description`, rendered at `EncounterVeil.tsx:2211-2224`): hand-written per template, no shared shape. It repeats the scene prose that sits directly below it, says "the traveler" while the mortal's name sits above it (it is written before the game knows who faces it), and explains the god's levers ("a god can lean on that confidence either way"), which is the cards' job.
- **The motive intro line** (`NudgeMotiveIntro`, built by `motiveIntroLine()` in `buildNudgePhaseModel.ts:443-456` from `MOTIVE_INTRO_VARIANTS`, `nudge-stage-content.ts:75-96`): a stock sentence floating on its own; its `chance` variants carry no information ("Vara was simply here when it started.").

Agreed in chat the same day (the design decisions A/B/C, all accepted):

- **A.** Both are replaced by **one stakes line**: `[lead], [actor] must [goal] — or [risk].`
- **B.** The second half is always the "— or …" fork: what happens if it goes wrong.
- **C.** When the encounter ends, the line becomes a **result line** built from the same parts plus the outcome band, and that line feeds the Chapter Ledger, the encounter badge and the agent's thread row.

Without this, the per-template summaries keep drifting (81 of them, no shape), and the surfaces that must name a story at a glance (Law 55: an ongoing story is never lost) have nothing better than the template's title.

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Motive receipt + `classifyMotive` (`readMotiveReceipt`, `buildNudgePhaseModel.ts:92-93, 927`) | 🟢 ACTIVE | **extends** — the classification (chance / mission / divine / choice) and `missionNameFor()` are reused unchanged to pick the lead clause |
| `MOTIVE_INTRO_VARIANTS` / `NudgeMotiveIntro` | 🟢 ACTIVE | **replaces** — superseded by `STAKES_LEAD_VARIANTS`; the component unmounts |
| `template.description` subtitle on the veil | 🟢 ACTIVE | **replaces on the veil** — the field stays on the type (additive, NFP #6) and remains the fallback for a template with no `stakes`; other readers keep it |
| Chapter archive (`buildChapterRecord`, `src/engine/chapterArchive.ts`) | 🟢 ACTIVE | **extends** — `ChapterRecord` gains `stakesLine` |
| Outcome band mapping (`stepOutcomeToOutcomeBand`, `data/outcome-band-content.ts`) | 🟢 ACTIVE | **reused** to choose the result-line form |
| Prose enrichment (`enrichProse`) | 🟢 ACTIVE | **reused** — the assembled line passes enrichment (Law 43) |

## Engine pillar

### Systems design

New pure module `src/engine/encounters/stakesLine.ts`:

```ts
export interface EncounterStakes {
  /** Bare verb phrase after "must": "cross a rotten toll bridge". Lowercase, no final period. */
  readonly goal: string;
  /** Bare verb phrase after "— or": the worst ending the encounter can reach. "go into the river with the pack". */
  readonly risk: string;
  /** Past tense, for success / success_at_cost / near_miss: "crossed the rotten toll bridge". */
  readonly won: string;
  /** Past tense of the authored plain-failure ending: "turned back to the long ford and lost the day". */
  readonly lost: string;
  /** Past tense of the authored critical-failure ending: "went into the river with the pack".
   *  Required when the template authors a distinct critical_failure ending; otherwise `lost` is used. */
  readonly lostBadly?: string;
  /** Per fork arm (keyed by the resolved variantKey, THR-1509): an arm that pursues a different
   *  goal carries its own past-tense forms, so the ending names what the mortal actually did. */
  readonly arms?: Readonly<Record<string, Partial<Pick<EncounterStakes, 'won' | 'lost' | 'lostBadly'>>>>;
}

export interface StakesContext {
  readonly motiveSource: MotiveSource | null; // chance | mission | divine | choice
  readonly missionName?: string;
  readonly locationName?: string;
}

/** Opening line: "[lead], [actor] must [goal] — or [risk]." */
export function buildStakesLine(stakes, actorName, ctx, seedKey): StakesLineResult;

/** Ending line, chosen by outcome band. */
export function buildResultLine(stakes, actorName, band): string;
```

`StakesLineResult` = `{ text, leadSource, fallback: StakesFallbackReason | null }` so the trace and debug bridge can say why a line looks the way it does (NFP #2).

**Freeze the context when the encounter action starts, in the engine.** The motive receipt is read from the actor node (today at render time, `buildNudgePhaseModel.ts:927`) and can change before the encounter resolves; the result line must use the same lead. So `stakesContext: StakesContext` (an optional additive field on `UnifiedAction`) is stamped by an engine helper, `stampStakesContext(action, graph)` in `stakesLine.ts`, at the point the encounter action is created/started on the tick path, not when the veil opens. That makes the persisted text independent of UI timing: the same seed produces the same stamped context headless and in the browser (NFP #3). The `encounter.stakes_line` trace fires there. Every reader (veil, chapter archive, badge, thread row) reads the stamped copy; the stage adapter stops calling `readMotiveReceipt` for the intro. The executor names the exact start site (the encounter action constructor or its first-step dispatch) in the PR.

**Opening line formula.**

| Motive source | Lead clause (`STAKES_LEAD_VARIANTS`) | Example |
|---|---|---|
| `mission` | `As part of {mission},` | *As part of Raise the Old Banner, Kael must outrun the storm to the pass shelter — or spend the night in the open.* |
| `divine` | `Led here by your hand,` | *Led here by your hand, Vara must slip the riders out of the column — or face them at the gates.* |
| `choice` | `Choosing this road,` | |
| `chance` | `Passing through {location},` | *Passing through Sacred Grove, Vara must cross a rotten toll bridge — or go into the river with the pack.* |
| none / unresolved | *(no lead)* — `{Actor} must {goal} — or {risk}.` | |

`As part of {mission}` keeps Christian's own original `mission` example. `Led here by your hand` is second person for the god's own action, which Law 42 allows. Each source holds a list so authors can add variants later. Selection is `hashSeed(actionId) % n` (`hashSeed` from `src/engine/naming/workNames.ts`), never an rng draw (NFP #3); an empty variant list means "no lead" rather than a divide by zero. A single variant per source at ship.

**Result line formula** (`STAKES_RESULT_FORMS`, keyed on `OutcomeBand`):

| Band | Form |
|---|---|
| `critical_success`, `success` | `{Actor} {won}.` |
| `success_at_cost` | `{Actor} {won}, at a cost.` |
| `near_miss` | `{Actor} nearly {won}, but {lost}.` |
| `failure` | `{Actor} {lost}.` |
| `critical_failure` | `{Actor} {lostBadly ?? lost}.` |

The forms are resolved against the fork arm the encounter actually resolved on: `arms[variantKey]` fields override the top-level ones, so a mortal who took the other arm is never credited with a goal they did not pursue. **The result line must agree with the band prose on screen**: `lost` is written from the template's authored plain-failure ending and `lostBadly` from its critical-failure ending (on the bridge, failure is the long ford, `vertical-slice.ts:342/440/736`; critical failure is the river, `:443/680`). The detail of *what* the cost was lives in the aftermath chips (Law 56); the result line names the story's ending, not its consequences. The pinned-outcome lever (`?outcome=`) exercises every row.

### Graph nodes / edges

None. `stakes` is template data; `stakesContext` is an optional field on `UnifiedAction` (data internal to the action, not a relationship between entities).

### Tick phases

None new. `stakesContext` is stamped where the encounter action starts on the tick path; the opening line is assembled from it at render time; the result line is built in `buildChapterRecord`, which already runs when an encounter action resolves.

### Resolution logic

None — the line describes the encounter; it never feeds scoring or resolution.

### PRNG callouts

None. Variant choice is a stable hash of the action id.

## Content pillar

### Encounter templates

`UnifiedActionTemplate` gains `stakes?: EncounterStakes` (additive). **Membership predicate** (THR-688 rule A): every template that can open on the encounter veil, i.e. every template resolved by `getAnyEncounterById` plus every `UnifiedActionTemplate` carrying authored steps that the stage model builder accepts. The executor computes the set from code at implementation time; no snapshot count.

**Authoring rules** (enforced by the validator, below):

1. `goal` and `risk` are bare verb phrases that read after "must" and after "— or", lowercase first letter, no final period, no proper name of the acting mortal, never "the traveler", never "god", "you" or "your" (the god is not the subject of the mortal's stakes).
2. `risk` names **the worst ending the encounter can reach** (the stake), not a choice offered inside the scene. On the bridge the risk is going into the river; the ford is the plain-failure ending, which `lost` carries.
3. `won` is the past tense of `goal`. `lost` and `lostBadly` are written from the template's own authored failure and critical-failure endings, so the ledger never tells a different story from the screen. A template whose fork arms pursue different goals authors `arms` entries.
4. Plain game register (`Docs/canon/prose.md` rule zero); concrete nouns from the scene; no vagueness-lexicon words.
5. Length caps: see constants.

**Rollout, split in two tickets:**

- **THR-1727 (this ticket)** ships the mechanism plus `stakes` on the five vertical-slice encounters (`src/data/encounters/vertical-slice.ts`) so Christian's checkpoint routes show the new line. The validator runs in **report mode**: it lists templates in the predicate that lack `stakes` and fails only on malformed `stakes`.
- **Follow-on content ticket** (filed with this handoff, blocked by THR-1727): author `stakes` for every remaining template in the predicate, then flip the validator to **required mode**, where a template in the predicate without `stakes` fails the test. That flip is the regression lock that keeps the shape from drifting again.

### Prose tables

`STAKES_LEAD_VARIANTS` and `STAKES_RESULT_FORMS` live in `src/data/nudge-stage-content.ts` beside the variants they replace. `MOTIVE_INTRO_VARIANTS` and `MOTIVE_MISSION_FALLBACK` are deleted once nothing reads them (the mission fallback moves into the stakes module: with no resolvable mission name, the `mission` lead is dropped and the line falls back to the no-lead form, rather than printing "As part of the work they took on").

### Attachment content

N/A — attachments carry no encounter summary.

### Data tables

N/A — no `world-model.json` change.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces only; no WebGL involved).*

### Player-facing display

- **Encounter veil.** The stakes line takes the subtitle slot under the title row (`EncounterVeil.tsx:2211-2224`); `NudgeMotiveIntro` (mounted at `EncounterVeil.tsx:2248-2250`, and also mounted at `NudgePhaseShell.tsx:243`) unmounts at both sites. One line, the actor's name rendered as the existing clickable agent link (Law 21), the location in the `chance` lead likewise a link. Typography is the subtitle's existing style; THR-1724 restyles the header around it and is sequenced first (see coordination).
- **Chapter Ledger** (`ChapterLedger.tsx`, row at ~235): the row's secondary line becomes the record's `stakesLine` (result line once resolved, opening line while live) under the template name.
- **Encounter badge** (model in `encounterBadgeModel.ts`, runtime in `encounterNotificationRuntime.ts`): the badge tooltip/body names the open encounter by its opening stakes line.
- **Agent thread row** (`ThreadsPanel.tsx`): the row's current-encounter text becomes the opening stakes line while an encounter is live; after it resolves, the result line until the next encounter replaces it.

UI Laws engaged: 1 and 21 (the actor and location are linked concepts), 13 (no numbers), 37 (one chrome across beats — the line stays fixed across steps of a multi-step encounter), 42 (game register; the god's second person only in the `divine` lead), 43 (the assembled line passes enrichment; no raw `{token}`), 55 (the ledger and thread row carry the story by name), 56 (the result line is a prose surface and claims no state; consequences stay in the chips).

### Event notifications

No new notifications. Existing chronicle entries are unchanged in this ticket.

### Debug inspection (DebugPanel)

`window.__DEBUG.getEncounterStakes()` (async, documented in `src/debug-bridge.d.ts`): for the open veil returns `{ templateId, line, leadSource, fallback, hasStakes }`; with an `actionId` argument, also returns the result line for a resolved action. This is the state assertion for browser evidence.

### Visual presence (HexMapV2)

N/A — no map surface shows encounter text.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `engine/encounters/stakesLine.ts` | encounter action start on the tick path (`stampStakesContext`); line builders pure, called at render and chapter-record time | `EncounterVeil` subtitle slot | `UnifiedAction.stakesContext` (new, optional) | `encounter.stakes_line` | `__DEBUG.getEncounterStakes()` |
| `buildNudgePhaseModel` / `buildUnifiedEncounterStageModel` | render | `EncounterVeil` | reads `template.stakes` and the stamped `stakesContext` (never writes it) | — | — |
| `chapterArchive.buildChapterRecord` | encounter resolution (existing call site) | `ChapterLedger`, `ThreadsPanel` | `ChapterRecord.stakesLine` (new) | — | ledger row |
| `encounterBadgeModel` / `encounterNotificationRuntime` | — | encounter badge | reads stamped context | — | — |
| validator test | CI | — | — | — | test output lists missing templates |

Prose pipeline: the assembled line goes through `enrichProse()` like the subtitle does today. Interface map: add a row for the new template → veil / ledger / badge / thread-row read of `stakes` in `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts`; retire the `MOTIVE_INTRO_VARIANTS` read.

## Interface impact

| Contract | Change |
|---|---|
| Encounter template → veil subtitle (`description`) | **retire on the veil** for templates with `stakes`; `description` kept as fallback and for any other reader |
| Motive receipt → veil intro line | **retire**; the receipt now feeds the stakes lead |
| Encounter template `stakes` → veil, Chapter Ledger, badge, thread row | **add**; production read sites named above |
| `UnifiedAction.stakesContext` written at encounter action start (engine) → read by veil, chapter archive, badge, thread row | **add**; write and read site both in this ticket |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `STAKES_GOAL_MAX_CHARS` | 60 | cap on `goal` (and `won`) so the line stays one line at 1920 wide |
| `STAKES_RISK_MAX_CHARS` | 60 | cap on `risk` (and `lost`) |
| `STAKES_LINE_MAX_CHARS` | 150 | cap on the assembled opening line including the lead and the actor's name; over it, the lead is dropped first |
| `STAKES_LEAD_VARIANTS` | one per motive source (table above) | the "why they're here" lead clause |
| `STAKES_RESULT_FORMS` | per outcome band (table above) | the ending sentence shape |
| `STAKES_FORBIDDEN_WORDS` | `traveler`, `god`, `you`, `your` | validator word list for `goal`/`risk`/`won`/`lost` |

## Tracing

```ts
// EncounterStakesLineTrace — emitted once per action when its stakes context is stamped
interface EncounterStakesLineTrace {
  type: 'encounter.stakes_line';
  actionId: string;
  templateId: string;
  leadSource: MotiveSource | 'none';
  /** Why the line is not the full formula, when it is not. */
  fallback: 'no_stakes_description_used' | 'no_mission_name' | 'no_location' | 'over_length_lead_dropped' | null;
}
```

## Fail-soft table

| Failure case | Fallback |
|---|---|
| Template has no `stakes` (migration window) | Render `template.description` as today, no motive line; trace `no_stakes_description_used` |
| Template has neither `stakes` nor `description` | Render nothing in the slot (no placeholder, Law 4) |
| `mission` source but no resolvable mission name | Drop the lead: `{Actor} must …`; trace `no_mission_name` |
| `chance` source but no location name | Drop the lead; trace `no_location` |
| Assembled line over `STAKES_LINE_MAX_CHARS` | Drop the lead; never truncate mid-word |
| Actor node gone (departed mortal) | Use the chapter archive's existing `DEPARTED_MORTAL` name |
| Outcome band unknown at archive time | Use the opening line in the ledger rather than a guessed ending |
| `stakesContext` missing on an old save | Rebuild it from the current receipt at read time (fail-open) |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/unifiedAction.ts` | hundreds (see `.codesight/graph.md`) | two optional fields only; no reader or fixture changes |

`src/types/unifiedAction.ts` is a top-importer file. The change is two **optional** fields (`UnifiedActionTemplate.stakes`, `UnifiedAction.stakesContext`), so no existing reader or fixture breaks; `npm run check:typecheck` ratchet must show zero net-new errors. No other high-impact file changes.

## Three-pillar check

- [x] Engine pillar present — `stakesLine.ts`, stamped `stakesContext`, chapter-record extension
- [x] Content pillar present — `stakes` field, authoring rules, slice migration here, full migration in the follow-on
- [x] UI pillar present — veil subtitle slot, Chapter Ledger, badge, thread row; Laws named
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise — it makes each mortal story nameable at a glance, which serves the god-watching-mortals premise
- [x] No Vision edit needed

## Rulebook impact

- [x] This plan does not change a rule of play — the line describes an encounter; odds, verbs, resources and outcomes are untouched
- [x] No `Docs/canon/rulebook.md` edit needed

> Brainstorm companion: `Docs/plans/2026-10-04-thr-1727-encounter-stakes-line-brainstorm.md`.

## Executor action items

1. Add `EncounterStakes` + optional `stakes` / `stakesContext` fields; write `stakesLine.ts` with unit tests for every lead source, every band, every fallback row.
2. Stamp `stakesContext` in the engine at encounter action start (`stampStakesContext`), never in the render adapter; trace it; extend `buildChapterRecord` with `stakesLine`.
3. Veil: stakes line in the subtitle slot; unmount `NudgeMotiveIntro`; delete the dead variant tables.
4. Ledger, badge, thread row read the line.
5. Author `stakes` for the five vertical-slice encounters (rules above).
6. Validator test in report mode; `__DEBUG.getEncounterStakes()`; interface-map row; systemic wiring guide entry (new template field); wiki page if its `sources` glob matches.
7. Browser evidence at 1920×1080 on both checkpoint routes plus `?outcome=failure` and `?outcome=critical_failure` routes (result lines in the ledger).
8. Validator: `lostBadly` required when the template authors a distinct critical_failure ending; `arms` entries required for fork arms with a different goal (executor derives both predicates from the template data model).

## Done when

- [ ] `npm test` and `npx vite build` pass; types via the `check:typecheck` ratchet (never `tsc --noEmit`); `npm run gate` green
- [ ] Closing commit body includes the line-anchored close keyword for THR-1727
- [ ] Browser-verify four-part evidence at 1920×1080 as below

Acceptance detail:

- `https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge` and `…&spawn=encounter.slice.riders_behind_caravan` open with one stakes line under the title and no motive line; four-part browser evidence (screenshot, console, `await window.__DEBUG.getEncounterStakes()` showing `hasStakes: true`, UI-Laws line citing 1, 13, 21, 37, 42, 43, 55, 56).
- After resolving the bridge with `&outcome=failure`, the Chapter Ledger row shows the `lost` line (the ford); with `&outcome=critical_failure`, the `lostBadly` line (the river). Each matches the band prose shown on screen; read `await window.__DEBUG.getOutcomePinVerdict()` first and only trust a `band_rendered` run.
- `npm run gate` green; the validator lists the remaining templates without `stakes` and fails none.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | lead variants, result forms, caps and the word list are named constants |
| 2. Inspectability | PASS | `encounter.stakes_line` trace names the lead source and every fallback; debug accessor |
| 3. Determinism | PASS | variant choice hashes the action id; no rng |
| 4. Fail-soft | PASS | every missing input degrades to a shorter line or the old description; never a raw token |
| 5. Narrative over mechanical perfection | PASS | the line is the story's name; it never claims mechanical state |
| 6. Additive over destructive | PASS with note | optional fields; `description` kept; the motive variant tables are deleted only once nothing reads them |
| 7. Performance budget | PASS | string assembly at render and once per resolution; negligible |

## Kill criteria

- If Christian, on the checkpoint routes, finds the formula sentence repetitive across encounters after the slice migration, stop the follow-on migration and revisit the lead/forms tables (they are constants, so the fix is data).
- If more than a handful of encounters cannot express their worst ending as a single "— or" verb phrase within `STAKES_RISK_MAX_CHARS`, the formula is too narrow: raise it with Christian before forcing them.
- If the result line contradicts the band prose or the aftermath chips in playtests, the band→form table or the authoring rule is wrong and must be revised before the follow-on migration.

## Ubiquitous Language

"Stakes line" (the opening sentence) and "result line" (its ending form) are new terms. The design session files a `UL-proposal` issue for both at handoff; the executor uses those words in code and comments.

## Coordination block

**Suggested model:** opus — touches the veil, the stage adapter, the chapter archive and four UI surfaces, plus prose authoring for five encounters.

**Parallel-safe with:** THR-1715 — its GameView edit is the attention-mode handler; no shared file with this plan. THR-1726 — fixes cast-name enrichment in the bridge's step prose, not the subtitle slot (re-check if its fix lands in `vertical-slice.ts` at the same lines).

**Mutex with:** THR-1724 (both edit `EncounterVeil.tsx` header region and `NudgePhaseShell.tsx`; THR-1724 goes first and leaves the subtitle slot for this ticket). THR-1714 (both edit `nudge-stage-content.ts` and `EncounterVeil.tsx`). THR-1725 (both edit per-encounter files under `src/data/encounters/`; conflict only if both touch the same template objects).

**Files to touch:**
- Create: `src/engine/encounters/stakesLine.ts` (+ tests)
- Edit: `src/types/unifiedAction.ts` (two optional fields)
- Edit: `src/components/Game/encounter-stage/adapters/buildNudgePhaseModel.ts` (stamp context, drop `motiveIntroLine`)
- Edit: `src/components/Game/EncounterVeil.tsx` (subtitle slot; unmount `NudgeMotiveIntro`)
- Edit: `src/components/Game/encounter-stage/shells/NudgePhaseShell.tsx`, delete `shells/NudgeMotiveIntro.tsx` once unreferenced
- Edit: `src/data/nudge-stage-content.ts` (new tables; delete old)
- Edit: `src/engine/chapterArchive.ts`, `src/components/Game/ChapterLedger.tsx`, `src/components/Game/ThreadsPanel.tsx`, `src/components/Game/encounterNotificationRuntime.ts`, `encounterBadgeModel.ts`
- Edit: `src/data/encounters/vertical-slice.ts` (five `stakes` blocks)
- Edit: `src/debug-bridge.ts`, `src/debug-bridge.d.ts`, `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`, `Docs/plans/2026-04-16-systemic-wiring-guide.md`

## Notes for the executor

- Christian approved the decisions A/B/C in chat on 2026-10-04; the formula, the "— or" fork and the result line are settled. The wording of the lead variants and result forms is the executor's call within the rules (agreed-outcome delegation), but keep `As part of {mission}`, which is Christian's own phrasing.
- `risk` is the cost of failure, not the other option in the scene. The bridge's risk is going into the river, not the ford.
- Do not restyle the header; THR-1724 owns it. Put the line in the slot THR-1724 leaves for the summary.
- Do not delete `template.description`; other readers and the migration fallback need it.
- File the follow-on content ticket's work as specified in the Content pillar; do not migrate non-slice encounters here.

## Forked-audit verdicts

### NFP audit

PASS-with-notes. Tunability, fail-soft, narrative and performance PASS. Notes: (2/3) the context stamp first sat in the render-path adapter, so persisted text depended on UI timing; **resolved** by stamping in the engine at encounter action start. (4) An empty variant list would divide by zero in `% n`; **resolved** (empty list = no lead). (6) The motive variant tables are deleted once unread; justified replacement, recorded in the NFP table.

### Three-pillar audit

PASS-with-notes. All three pillars substantive; the substrate is acknowledged (motive receipt, chapter archive, outcome bands, enrichment all ACTIVE and extended, nothing rebuilt). Notes: missing template tail sections and the coordination block, uncounted Blast Radius, the second `NudgeMotiveIntro` mount in `NudgePhaseShell.tsx:243`, and the badge model living in `encounterBadgeModel.ts`. **All resolved** in this revision.

### Vision audit

REVISE, then resolved. Premises extended: the north star's "story the player can tell in prose" and the core loop's aftermath beat; non-negotiables 1 (god not protagonist) and 3 (no numbers) confirmed; Prose Doctrine v2 "announce the stake plainly" strongly confirmed. Finding: one `lost` form for both failure bands would have told a false ending on the bridge (failure = the ford, critical failure = the river), and the stakes ignored which fork arm resolved. **Resolved** by `lost` / `lostBadly` written from the template's authored endings, per-arm overrides, and a Done-when that checks both failure routes against the band prose.

### Intent-judge

First run: Revise (GAPs on the render-path stamp, the UL commitment, and the missing kill criteria / coordination block). All three addressed in this revision; re-run verdict recorded below.

Re-run: **Allow** (no violations; one wiring GAP: four lines still described the render-path stamp; corrected before the PR, no re-run needed per the judge).
