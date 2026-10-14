> **title:** Encounter coverage map — the first content-judgments run (THR-1723)
> **linear_issue:** THR-1723
> **author:** Claude Code (tb-design-lane, run 2026-10-14c, unattended)
> **created:** 2026-10-14
> **three_pillars:** Engine N/A — offline tooling by hard constraint, never runtime · Content done · UI N/A — no player surface; the reading surface is an `ops` report (rationale in § UI pillar)

# Encounter coverage map — the first content-judgments run (THR-1723)

*The corpus has 567 encounters and nothing measures what they are about; this run makes the empty and crowded corners visible to the people deciding what to write next.*

## Why this is load-bearing

Christian's direction (2026-10-04): use TypeSafe's Jev model *"for content categorization runs and audits as the content corpus grows."* The encounter pipeline already asks for the result: its Step 0a says *"read the latest encounter coverage map when one exists … Its empty theme × Reach × Sphere cells are input to the category pick, not a quota"* (`.claude/skills/encounter-pipeline/SKILL.md:225`). No map exists, so every authoring run picks its category blind.

What we can measure today is structural only. The content census (`npm run content-census`, THR-473) counts entries by the Reach the author *declared* and the scale. It cannot tell what an encounter is *about*, whether the declared Reach matches the prose, or which Spheres the fiction expresses. Measured on `main` @ `667869d2` (scratch script over `entriesOfKind('encounter_template')`):

| Measure | Value |
|---|---|
| Encounter-kind entries | **567** |
| Declare a `reach` | 567 (but 3 declare a value that is not one of the Eight: `resolve` ×2, `combat` ×1, all in `src/data/effect-shell-proof-templates.ts`) |
| Declare a `sphereAffinity` | **37** (530 carry none) |
| Declare an `encounterType` (the activity verb) | 186 (381 carry none) |
| Wear any authored `family` tag | 107 (460 wear none) |
| Text per entry (every string field ≥ 25 chars containing a space — an upper bound on prose) | median 2,950 chars · p90 8,254 · max 36,996 · total 2.48 M chars |

So for the Sphere axis there is almost nothing declared to count, and for the theme axis two thirds of the corpus is unlabelled. A judged layer is the only way to see the map. This plan designs that run, its persisted artifact and its report, and decides the five questions the ticket lists.

## Substrate inventory

| Existing subsystem / artifact | Status | This plan |
|---|---|---|
| Content-object registry — `entriesOfKind()` in `src/data/contentCatalogs.ts` | 🟢 ACTIVE | **reads** — the Encounter kind's membership is exactly what this returns (567 today); no new membership rule |
| Content tag vocabulary — `src/data/content-tags.ts` + `content-tag-catalog.generated.md` | 🟢 ACTIVE | **reads** — every label the run uses is a seated tag; criteria quote the catalog's own descriptions |
| Cosmology canon — `Docs/canon/cosmology.md` § The Eight Reaches, § Spheres | canon | **reads** — Reach and Sphere criteria quote the canon tables verbatim |
| Content census (reach × scale matrix) — `scripts/content-census.ts`, `src/engine/contentCensus/` | 🟢 ACTIVE | **untouched** — the coverage report places its own judged grid next to the census's declared-reach column, read from the same `entriesOfKind` set; the census code is not edited |
| Prose collector — `src/engine/content-eval/collectAuthoredProse.ts` | 🟢 ACTIVE | **reused** (read-only import, filtered to the Encounter kind); the extractor adds step-level text and afterimages, which the collector does not sweep (content-judgments § Corpus note) |
| Content-judgments hub — `.claude/skills/content-judgments/SKILL.md` | 🟢 ACTIVE (rules, no runner) | **extends** — its § Status changes from "no shared runner" to naming this runner; the Coverage-map catalogue row gains the artifact path |
| Encounter pipeline Step 0a | 🟢 ACTIVE | **extends** — the pointer names the artifact path on `ops` |
| `ops` branch publish — `scripts/ops-publish.sh` | 🟢 ACTIVE | **reused** — the artifact and report publish like any lane exhaust (THR-947) |

No engine module, graph node, edge or tick phase is touched.

## Engine pillar

Engine: N/A — offline tooling by the ticket's hard constraint. Nothing under `src/engine/`, the tick loop or the shipped build calls TypeSafe (content-judgments rule 1; NFP 3 and 4; the rejected "pure LLM-generated content" approach; the static deploy has no server for a key). The runner lives under `scripts/`, imports content catalogs read-only, and is never bundled into the app.

## Content pillar

The content corpus is the subject. Nothing is authored or edited by the run; it produces judgments, a rollup and a findings list.

### Decision 1 — Taxonomy source: four axes, all owned vocabulary

Every label is already seated. No parallel taxonomy is invented.

| Axis | Primitive | Options (source) | Why this axis |
|---|---|---|---|
| **Reach** | Choice | the Eight Reaches + `none` — criteria quote `Docs/canon/cosmology.md` § The Eight Reaches (*"Iron — Strength, force, martial action, direct confrontation"* …) | Every entry declares one, so the judged answer is checkable against the author's; it is the map's main axis and the seed of the mislabel audit |
| **Sphere** | 12 × Noul | one Noul per Sphere — criteria quote cosmology § Spheres (*"Order — Stability, law, structure"* …) plus the seated tag's line (*"Sworn to Order — it holds its shape, and holds others to theirs."*) | Several Spheres may apply or none, so a Choice would force one (skill: "use one [Noul] per label when several may apply"). 530 of 567 declare nothing, so this is the axis the corpus is blindest on |
| **Activity** (theme, what the mortal does) | Choice | the nine seated activity words `#explore #assist #duel #lead #build #steal #create #acquire #hire` + `none` — criteria quote the tag catalog lines (*"#explore — A going-out to find what is there — a ruin, a road, a rumour."*) | These are the `encounterType` values projected as tags; 381 entries carry none |
| **Walk of life** (theme, the world it happens in) | Choice | seventeen seated `family` words: `#combat #knowledge #craft #healing #survival #stealth #social #trade #travel #discovery #territorial #wilderness #ruins #divine #arcane #nature #fate` + `none` — catalog lines quoted | The `family` axis is *"what walk of life it comes from"* (content-objects § The tag vocabulary). This subset is every seated family word whose catalog line names a domain of life rather than an object class (`#relic`), a trait class (`#mastery`), a reputation (`#honor`) or an errand family (`#guild_errand`). The list is a constant, so it can change without a code change |

Plus one **Tag-fit** Noul per authored `family` tag an entry wears (107 entries wear one; most wear one or two): *"Does this encounter earn the tag `<tag>`, defined as '<catalog line>'?"* This is the content-judgments catalogue's Tag-fit row, applied to the encounter kind.

**Activity and Walk of life are judging option lists local to this run. They are not tag axes.** The UL already records that `family` *"holds both 'what kind of object' … and 'what walk of life' … Splitting them would be a sixth axis and a design decision"* (`Docs/ubiquitous-language/Encounters.md:355`). This plan does not split it, does not seat a sixth axis, and changes no tag's axis. `WALK_OF_LIFE_TAGS` and the activity list are constants of the runner that select which seated words a question offers. No entry gains or loses a tag through them.

A theme that the run keeps answering `none` for is a **finding**, not a new label (Decision 3). A genuinely missing term goes through a `UL-proposal` issue, never into the runner's constants.

### Decision 2 — Question design

One request per entry. All questions share one `state` and run in parallel (TypeSafe *Compose and verify*: ask independent questions over the same state together).

**State — blind and filtered.** The state is the entry's player-facing prose and nothing else:

```json
{ "encounter": { "title": "<name>", "text": { "<field path>": "<prose>", … } } }
```

- No id, no declared `reach`, `sphereAffinity`, `encounterType` or tags. The judgment must not be anchored on the author's label it is later compared with.
- Fields start from `collectAuthoredProse()` filtered to `contentType: 'encounter'` **and** to ids in `entriesOfKind('encounter_template')` (the collector also sweeps Action-kind templates from the shared array). It supplies name, description, narrative templates, consequence messages, choice intents and burdens, context-fragment variants and aftermath overviews (`collectAuthoredProse.ts:94-150`). The collector does **not** sweep step-level text, so the extractor adds each step's player-facing strings and afterimages itself. Ids, numbers and mechanical fields are left out (Jev jaggedness #5: *"Filter first; send only what the question needs"*).
- Capped at `ENCOUNTER_STATE_MAX_CHARS` (24,000). The cap keeps fields in authored order and marks the row `truncated: true`. Today it truncates at most the one or two entries above 24k chars (max is 36,996). Jev's own limit is 32k tokens for state plus the longest question.

**Questions — 17 base + tag-fit.**

| Question id | Primitive | Instructions (abridged; the constants file holds the full text) |
|---|---|---|
| `reach` | Choice (9) | "Which Reach does the mortal's main test in `encounter` draw on? Judge by what the mortal must do to succeed, not by the setting." Option `none`: *"No single Reach; the encounter tests nothing, or several equally."* |
| `reach_rev` | Choice (9) | the same question, with options in **reverse order** |
| `sphere_<name>` ×12 | Noul | "Does the fiction of `encounter` express the Sphere of <Name> (<canon alignment>; '<tag line>') as a force at work in the scene, not as a passing word?" Criteria `true` / `false` spelled out |
| `activity` | Choice (10) | "What is the mortal mainly doing in `encounter`?" Options are the nine activity words + `none` |
| `activity_rev` | Choice (10) | the same, options reversed |
| `walk_of_life` | Choice (18) | "Which walk of life does `encounter` happen in?" Options are the seventeen words + `none` |
| `tagfit_<tag>` ×k | Noul | one per authored family tag the entry wears (Tag fit, above) |

The `_rev` pair answers Jev jaggedness #8 (*"Choice option order — Reorder the options and check the answer is consistent"*) on every entry, not just a sample. An entry whose top answer changes between the two orders is **order-sensitive** and routes to review regardless of confidence. Both probability maps are persisted, and the rollup uses their mean.

The question text is versioned (`ENCOUNTER_COVERAGE_QUESTIONS_VERSION`). Any change to an instruction, an option list or a quoted canon line bumps it. A bump invalidates cached rows (content-judgments rule 4).

### Decision 3 — Relation to the tag census, and where findings land

The run compares the judged layer with what is declared and worn. Four finding classes, all computed in code from the persisted answers:

| Finding class | Predicate | What it means |
|---|---|---|
| **Reach mislabel candidate** | judged `reach` is confident (≥ threshold, not order-sensitive) and differs from the declared `reach` | The prose tests a different Reach than the author filed. Seeds the mislabel audit |
| **Activity backfill candidate** | entry has no `encounterType`, judged `activity` is confident and not `none` | The entry earns an activity word it does not carry |
| **Unearned tag** | a worn family tag's `tagfit_*` Noul is below `TAG_FIT_NO` | The entry wears a tag its prose does not earn |
| **Possible missing theme** | the share of confident `walk_of_life = none` answers is at least `NO_MATCH_SHARE_FLAG` | The vocabulary may lack a walk of life the corpus keeps writing about. The report lists those entries; a reader looks for a recurring theme, and only a real one becomes a `UL-proposal` |

Plus one deterministic pre-check that needs no model: **declared reach outside the Eight** (the three shell-proof templates today).

**Where they land.** Every finding goes into the run report's `## Findings` section, with the entry ids and the probabilities that put each one there. The runner **never edits a catalog, never applies a tag and never files a ticket**. A judgment is a worklist, not a verdict (content-judgments rule 2).

The person who closes a run turns findings into work. For the first run, that is the executor of the run ticket (§ Build slices, slice B). They file one `Todo` ticket per non-empty finding class in the Content Architecture project, each citing the report. The **reach mislabel candidates become the input of the mislabel audit**, the first agreed follow-on run. Later runs need no tickets for findings that are unchanged: the report diffs against the previous artifact and lists only **new** and **resolved** findings.

**Follow-on sequencing.** The mislabel audit comes next. It is seeded by this run's mislabel and unearned-tag lists, and it extends the questions to the declared kind and category. The voice audit comes after that. It scores prose against the GM-narration register and complements, never replaces, the register scorer and `eval:prose`. Neither follow-on is designed here. The ticket says they are agreed in direction, not scope.

### Decision 4 — Output shape, location, and the rollup surface

**Artifact (the persisted judgments)** — `Docs/ops/content-judgments/encounter-coverage.json` on the **`ops` branch**, overwritten each run.

- Git history on `ops` is the run-to-run diff, so audits can be compared without paying for inference again.
- `ops` holds operational exhaust (THR-947). A ~1 MB regenerable judgment file does not belong in `main`'s tree, where every worktree would carry it.
- Agents read it with `git show origin/ops:Docs/ops/content-judgments/encounter-coverage.json`, the pattern the briefing already uses.

```ts
interface EncounterCoverageArtifact {
  schema: 1;
  questionsVersion: number;          // ENCOUNTER_COVERAGE_QUESTIONS_VERSION
  model: string;                     // versioned id returned by the API, e.g. "jev-1.13.0"
  doctrine: string;                  // "prose@2" (content-judgments rule 3)
  ranAt: string;                     // ISO-8601 UTC
  sourceCommit: string;              // main sha the catalogs were read from
  usage: { requests: number; inputTokens: number; usdEstimate: number; wallSeconds: number; reusedRows: number };
  thresholds: { choiceConfidence: number; sphereYes: number; tagFitNo: number; calibratedAt: string | null };
  questions: Record<string, unknown>;  // the exact question objects sent, once per run
  rows: EncounterJudgmentRow[];        // id-ascending
  calibration: CalibrationBlock | null;
}
interface EncounterJudgmentRow {
  id: string;
  contentHash: string;               // FNV-1a of the state JSON — the cache key, with questionsVersion + model
  truncated: boolean;
  declared: { reach: string; encounterType: string | null; sphereAffinity: string | null; familyTags: string[] };
  answers: Record<string, { choice?: string; noul?: number; probabilities?: Record<string, number>; confidence?: number }>; // probabilities rounded to 3 dp
  orderSensitive: { reach: boolean; activity: boolean };
  error?: string;                    // a failed request: the row is kept, answers empty
}
```

**Reuse, don't re-infer.** Before calling the API the runner reads the previous artifact from `origin/ops`. It reuses any row whose `(contentHash, questionsVersion, model)` all match. Only new or edited encounters cost money on a re-run.

**Report (the rollup surface)** — `Docs/ops/content-judgments/encounter-coverage.md` on `ops`, published in the same commit. Sections:

1. **Header line**: entries · requests · reused rows · input tokens · USD estimate · wall time · model · thresholds (the cost line the ticket asks for). A second line states who calibrated: *"Thresholds calibrated against a blind Claude reader subagent (a model, not a human) on 64 entries"*, so a later veto is made with that in view.
2. **Reach × Activity grid**: judged Reach (8 + none) by judged Activity (9 + none), confident answers only. Cells marked **empty** (0) and **thin** (below `COVERAGE_THIN_CELL`). The `review` margin counts entries that were not confident.
3. **Reach × Walk-of-life grid**: the same treatment.
4. **Sphere column**: per Sphere, the count of entries at or above `sphereYes`, with the declared `sphereAffinity` count beside it.
5. **Declared vs judged Reach**: a 9 × 9 table and the agreement rate.
6. **Findings**: the four classes and the pre-check (Decision 3), each with ids and probabilities; on re-runs, new and resolved findings only.
7. **Review worklist**: low-confidence and order-sensitive entries, ordered by confidence ascending (content-judgments rule 5).

The grids are *"input to the category pick, not a quota"* (pipeline Step 0a). The report says so in its first line.

**No served page.** See § UI pillar.

### Decision 5 — Calibration method

Thresholds are set on our own content before any judgment counts as confident (content-judgments rule 5).

- **Sample:** `CALIBRATION_SAMPLE_PER_REACH` (8) entries per declared Reach, so 64. They are chosen deterministically: within each Reach, sort by FNV-1a hash of the id and take the first 8. No PRNG, and the same sample on every re-run until the corpus changes.
- **Reader:** one fresh-context Claude subagent, cold, given the same blind `state` Jev saw, the same option lists and canon quotes, and **not** Jev's answers or the declared labels. It labels each sample entry's Reach, Activity, Walk of life and its Spheres (yes/no per Sphere). Its labels are written into the artifact's `calibration` block with the prompt used, so the hand-check is re-readable. A human reader is optional and not required: Christian is chat-only (THR-608), and the reader subagent is the "reader" content-judgments rule 5 names.
- **Threshold rule:** for each Choice axis, the threshold is the **lowest** confidence `c` at which agreement among sample answers with confidence ≥ `c` (and not order-sensitive) is at least `CALIBRATION_TARGET_AGREEMENT` (0.85), and those answers are at least `CALIBRATION_MIN_ADMITTED_SHARE` (0.5) of the sample. Sphere `sphereYes` and `tagFitNo` are chosen the same way on the yes/no labels. One table in the report shows agreement against each candidate `c`, in steps of 0.05.
- **If no `c` qualifies:** the axis is marked **uncalibrated**, every answer on it routes to review, and the report says so in its header. That is a valid, measured negative result. The run still persists. The grids still render, with every cell in the review margin.
- **Model pinning:** after calibration the runner pins `JEV_MODEL` to the versioned id that answered (`jev-1.13.0` today), not `jev-latest`. TypeSafe's docs advise pinning when thresholds were tuned against a version. A model change re-runs calibration.

**Why 64.** At 85% agreement, 64 samples give a 95% interval of about ±9 points. That is tight enough to tell 85% from 70%, at a cost of about one subagent pass. Eight per Reach keeps the small Reaches (Star 44, Veil 41) represented.

### Cost estimate (to be replaced by the measured line)

TypeSafe bills input tokens only, at $0.042 per million for `jev-1.13.0` (docs.typesafe.ai/models, read 2026-10-14). The estimate assumes a state of about 740 tokens on average (2.48 M chars over 567 entries, at roughly 4 chars per token, with some fields filtered out) and about 3,200 question tokens (17 base questions with quoted canon lines, plus tag-fit). That gives roughly 2.3 M input tokens per full run, **about $0.10**. A re-run that reuses cached rows costs a fraction of that. The runner refuses a planned run whose estimated input exceeds `RUN_MAX_INPUT_TOKENS` (5 M) unless `--force` is passed. That is a guard against a question-set mistake multiplying the bill, not a budget.

Rate limits (80 requests/s) are far above `RUN_CONCURRENCY` (4). 429/529 responses back off exponentially (docs § Handling rate limits).

## UI pillar

UI: N/A — no player-facing surface, by design.

- The coverage map is an **authoring** instrument. Its readers are the encounter pipeline's Step 0a, design sessions and, occasionally, Christian through a link in a lane report.
- A player-facing view of the encounter catalog is withheld by recorded ruling. THR-1495: *"an encounter catalog is the answer key"* (content-objects § Stale sources).
- A served wiki page would add a `public/wiki-manifest.json` entry and a freshness obligation for a report that changes only when someone re-runs it. The `ops` markdown report renders on GitHub as a clickable link (Rule Zero), which is all its readers need.
- If a later ruling wants it in the Design Reference Wiki, that is additive: one manifest row pointing at the same markdown.

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `scripts/content-judgments/encounterState.ts` (blind state extractor) | none — offline | none | none | none (offline script; see § Tracing) | `--dry-run` prints one entry's state |
| `scripts/content-judgments/encounterQuestions.ts` (versioned question set from canon quotes) | none | none | none | none | `--dry-run` prints the question objects |
| `scripts/content-judgments/jevClient.ts` (fetch, backoff, key handling) | none | none | none | none | stderr progress, never the key |
| `scripts/content-judgments/coverageRollup.ts` (grids, findings, diff, calibration math) | none | none | none | none | the report itself |
| `scripts/judge-encounters.ts` + npm `judge:encounters` (runner) | none | none | none | none | the artifact + report on `ops` |

Wiring-checklist rows (`Docs/plans/wiring-checklist.md`): orchestrator, UI, GameState, traces, prose pipeline and player controls are all **N/A — offline script**. `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` gain nothing: the runner makes no cross-system runtime read or write. `collectAuthoredProse` and `entriesOfKind` are imported read-only by a script, which is how `content-census` already uses the catalogs.

**Skill and doc edits (same PR as slice A):**

- `.claude/skills/content-judgments/SKILL.md`: § Status names the runner, the artifact path and the key-missing behaviour. The Coverage-map row cites the artifact. Bump `last_validated_against`.
- `.claude/skills/encounter-pipeline/SKILL.md` Step 0a: replace "when one exists" with the `git show origin/ops:…encounter-coverage.md` command, and say what to do when it is absent (proceed without it, as today). Bump `last_validated_against`.
- `Docs/canon/content-objects.md` § Known seams: one line recording that three shell-proof encounter templates declare reach values outside the Eight, if slice A's pre-check confirms it on `main`.

## Interface impact

| Contract | Disposition |
|---|---|
| `entriesOfKind('encounter_template')` (content registry → offline scripts) | **preserve** — read-only consumer, same as `content-census` |
| `collectAuthoredProse` field list (content-eval → offline scripts) | **preserve** — imported, not modified |
| Any engine read/write | none |

## Constants table

All in `scripts/content-judgments/constants.ts`.

| Constant | Default | Purpose |
|----------|---------|---------|
| `JEV_MODEL` | `'jev-1.13.0'` | Pinned model id; thresholds are tuned against it |
| `JEV_ENDPOINT` | `'https://api.typesafe.ai/v1/systemone'` | HTTP endpoint (docs § API reference) |
| `JEV_PRICE_PER_MTOK_USD` | `0.042` | Input price for the cost line; read from docs 2026-10-14, update with the model |
| `ENCOUNTER_COVERAGE_QUESTIONS_VERSION` | `1` | Bumped on any question-text or option change; invalidates cached rows |
| `ENCOUNTER_STATE_MAX_CHARS` | `24000` | State cap; keeps state + longest question under Jev's 32k-token limit |
| `WALK_OF_LIFE_TAGS` | the 17 listed in Decision 1 | Walk-of-life option list (seated family words only) |
| `RUN_CONCURRENCY` | `4` | Parallel requests |
| `RUN_MAX_RETRIES` | `5` | Backoff attempts on 429/529/network error before the row is kept as `error` |
| `RUN_BACKOFF_BASE_MS` | `1000` | Exponential backoff base; `retry-after` wins when present |
| `RUN_MAX_INPUT_TOKENS` | `5_000_000` | Refuse a planned run above this estimate without `--force` |
| `RUN_PARTIAL_ERROR_SHARE` | `0.10` | Above this share of errored rows the report is marked **partial** and the runner exits 1 |
| `CALIBRATION_SAMPLE_PER_REACH` | `8` | 64-entry stratified calibration sample |
| `CALIBRATION_TARGET_AGREEMENT` | `0.85` | Agreement the confident band must reach |
| `CALIBRATION_MIN_ADMITTED_SHARE` | `0.5` | The threshold must admit at least this share of the sample |
| `CALIBRATION_STEP` | `0.05` | Candidate-threshold grid |
| `DEFAULT_CHOICE_CONFIDENCE` | `0.6` | Pre-calibration placeholder; replaced by the calibrated value, recorded in the artifact |
| `DEFAULT_SPHERE_YES` | `0.7` | Pre-calibration placeholder for Sphere Nouls |
| `DEFAULT_TAG_FIT_NO` | `0.3` | Pre-calibration placeholder for tag-fit Nouls |
| `COVERAGE_THIN_CELL` | `3` | A grid cell below this is "thin" |
| `NO_MATCH_SHARE_FLAG` | `0.15` | Share of confident `walk_of_life = none` that raises the possible-missing-theme finding |

## Tracing

N/A — the run never touches GameState or the trace buffer, so it emits no engine traces. Inspectability comes from the persisted artifact instead. It holds every question object sent, every answer with its full probability map, the model id that answered, the state's content hash, the source commit, and the calibration labels with the reader prompt. Any judgment can be traced to the exact text and question that produced it, and re-asked.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `TYPESAFE_API_KEY` unset | Print `judge:encounters: skipped — TYPESAFE_API_KEY is not set`, exit 0, write nothing |
| 401 (bad key) | Stop before any further request; exit 1 with "key rejected" (never echo the key); write nothing |
| 429 / 529 / network error | Exponential backoff up to `RUN_MAX_RETRIES`; then keep the row with `error` and empty answers, and continue |
| 422 on one entry (malformed request) | Keep the row with `error: '422 <field>'`, continue; the report lists errored rows |
| More than `RUN_PARTIAL_ERROR_SHARE` (10%) of rows errored | Persist what exists, mark the report header **partial**, exit 1 so the operator notices |
| Previous artifact missing / unreadable on `ops` | Run cold (no reuse); note it in the header |
| Entry has no prose fields | Row kept with `error: 'no prose'`, no request sent |
| State over `ENCOUNTER_STATE_MAX_CHARS` | Truncate in field order, `truncated: true` |
| Estimate above `RUN_MAX_INPUT_TOKENS` | Refuse unless `--force`; print the estimate |
| Calibration cannot reach the target on an axis | Axis marked uncalibrated; every answer on it routes to review; run still persists |
| `ops-publish.sh` fails | Leave the files in the worktree, exit 1, print the publish command to retry (the paid answers are not lost) |

## Blast Radius

Not applicable: no file with ≥100 importers is edited. `contentCatalogs.ts` and `collectAuthoredProse.ts` are imported, not changed.

## Build slices

Two tickets, because the second needs a key only Christian can set.

**Slice A: the runner (this ticket, [THR-1723](https://linear.app/threadbare/issue/THR-1723)).** All of it is verifiable without a key: modules, tests, npm script, `--dry-run`, the skip path and the skill edits.

**Slice B: the first full run and calibration ([THR-1850](https://linear.app/threadbare/issue/THR-1850/first-encounter-coverage-run-judge-all-encounter-entries-with-jev), blocked by slice A and by Christian setting `TYPESAFE_API_KEY`).** The run, the reader-subagent calibration, threshold pinning, the published artifact and report, and the finding tickets.

## Kill criteria

- If calibration cannot reach 85% Reach agreement over at least half the 64-entry sample, the axis is reported uncalibrated, and the mislabel-audit follow-on waits for a better question or model.
- If the first run's `walk_of_life = none` share is above 15%, the vocabulary question goes to a `UL-proposal` rather than into the runner.
- If the measured cost line is far above the ~$0.10 estimate, the token ceiling refuses re-runs until the question set is trimmed.

## Three-pillar check

- [x] Engine pillar present (N/A with rationale: offline by hard constraint)
- [x] Content pillar present (the five decisions, artifact, report, findings)
- [x] UI pillar present (N/A with rationale: authoring instrument, encounter catalog withheld from players by ruling, report renders as a link)
- [x] Wiring section connects them (offline modules, skill pointers, interface impact)

## Vision audit

- [x] This plan does not contradict any Vision premise (vault `Vision/01-core-loop.md`: the encounter pipeline curates which situation gets framed, and this map feeds that choice; `Vision/03-design-tensions.md` #2 systemic vs authored: the map makes authored gaps visible; `Vision/taste-profile.md` rejected *pure LLM-generated content*: respected). It reads content and changes no rule, no player surface and no generation path. Runtime LLM content stays rejected: the model never writes prose and never runs in the game.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No rulebook edit.

> Brainstorm companion: `Docs/plans/2026-10-14-thr-1723-encounter-coverage-map-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every threshold, cap, price, option list and sample size is a named constant (§ Constants); calibrated values are recorded in the artifact |
| 2. Inspectability | PASS | The artifact persists questions, answers with full probabilities, model id, content hash, source commit and calibration labels; no engine traces because nothing runs in the engine |
| 3. Determinism | PASS with note | The game is untouched. The run is not bit-reproducible (a remote model), which is why answers are **persisted and reused** rather than re-inferred. Entry order, sample choice and rollup are deterministic (id order, FNV hash, no PRNG) |
| 4. Fail-soft | PASS | § Fail-soft table; a missing key is a clean skip; a failed row never aborts the run |
| 5. Narrative over mechanical perfection | PASS | The map is input to choosing stories, *"not a quota"*; findings are worklists for a reader, never auto-applied |
| 6. Additive over destructive | PASS | New scripts and an `ops` artifact; two skill pointers updated; no catalog, type or engine change |
| 7. Performance budget | N/A | Offline; ~567 requests at concurrency 4; the cost line measures the run |

## Done when

**Slice A ([THR-1723](https://linear.app/threadbare/issue/THR-1723)):**

- [ ] `npm run judge:encounters -- --dry-run --limit 1` prints one encounter's blind state (no `reach`/`sphereAffinity`/`encounterType`/tags/id inside it) and the full question set, and makes no network call
- [ ] With `TYPESAFE_API_KEY` unset, `npm run judge:encounters` prints the skip line and exits 0
- [ ] Vitest over `scripts/content-judgments/`. The state extractor drops every declared label. The question set quotes the cosmology and tag-catalog lines verbatim (asserted against the source files, so a canon edit fails the test and forces a version bump). The `_rev` options are the exact reverse. The rollup computes the grids, the four finding classes, the new/resolved diff and the threshold rule on a fixture artifact. Cache reuse matches only on `(contentHash, questionsVersion, model)`. The key never appears in any thrown error or log line (a fixture key string is asserted absent from the output)
- [ ] `content-judgments` and `encounter-pipeline` skills updated as § Wiring says, `last_validated_against` bumped
- [ ] Code gates: `npm test`, `npm run check:typecheck`, `npx vite build`, freshness gates. Browser-verify exempt: offline script, no UI

**Slice B ([THR-1850](https://linear.app/threadbare/issue/THR-1850/first-encounter-coverage-run-judge-all-encounter-entries-with-jev)):**

- [ ] One full run over the Encounter kind publishes `Docs/ops/content-judgments/encounter-coverage.json` and `.md` to `ops`, with a header cost line (requests, input tokens, USD, wall time)
- [ ] The artifact's `calibration` block holds the reader's labels for the 64-entry sample, and the report shows the agreement-vs-threshold table. Either Reach agreement is ≥ 85% among admitted answers with at least half the sample admitted, or the report marks the axis uncalibrated (a measured negative result is a valid close)
- [ ] `JEV_MODEL` is pinned to the answering version and the calibrated thresholds are committed as constants
- [ ] One `Todo` ticket per non-empty finding class, filed in Content Architecture, each linking the report. The mislabel-audit ticket is among them

## Coordination block

**Suggested model:** opus. The question text quotes canon exactly and the calibration math has edge cases. Advisory only.

**Parallel-safe with:** all open work. New files under `scripts/content-judgments/`, one npm script, two skill files. The executor's current ticket ([THR-1839](https://linear.app/threadbare/issue/THR-1839)) and the shelf ([THR-1757](https://linear.app/threadbare/issue/THR-1757), [THR-1813](https://linear.app/threadbare/issue/THR-1813), [THR-1848](https://linear.app/threadbare/issue/THR-1848)) edit `src/`, none of these files.

**Mutex with:** any ticket editing `.claude/skills/encounter-pipeline/SKILL.md` Step 0a or `.claude/skills/content-judgments/SKILL.md`, because both get small edits here. None is open today.

**Files to touch:**
- Create: `scripts/content-judgments/{constants,encounterState,encounterQuestions,jevClient,coverageRollup}.ts`, `scripts/judge-encounters.ts`, `scripts/__tests__/content-judgments-*.test.ts`
- Edit: `package.json` (`judge:encounters` script, esbuild-bundled like `content-census`), `.claude/skills/content-judgments/SKILL.md`, `.claude/skills/encounter-pipeline/SKILL.md`, `Docs/canon/content-objects.md` (one Known-seams line)

## Notes for the executor

- **Read the live docs before writing the client** (content-judgments: *"Do not write integration code from memory"*). Use plain `fetch` against the HTTP API. Do not add the JS SDK as a dependency: one endpoint plus backoff is ~60 lines, and a new package is a supply-chain surface for an offline tool.
- **Never pass the declared labels into `state`.** The whole comparison depends on the judgment being blind.
- The three `encounter.shell_proof.*` templates (`reach: 'resolve' | 'combat'`) are in `UNIFIED_ACTION_TEMPLATES`. Judge them like any entry and report them through the pre-check. Fixing them is not this ticket's work.
- Keep the question text in one place (`encounterQuestions.ts`) and build criteria from the canon files, either at build time or via a test that asserts the quotes. A hand-paraphrase is the drift content-judgments rule 4 forbids.
- Slice A must not make a paid call, even if a key happens to be set in the executor's environment. Use `--dry-run` and fixtures.
- Publish through `bash scripts/ops-publish.sh`. Never commit the artifact to `main`.

## Decisions taken by the design lane under delegation

Christian filed this ticket on 2026-10-04 and left these five choices to the plan doc. The lane decided them on 2026-10-14 and invites a veto:

1. Four axes: Reach (Choice), Sphere (12 Nouls), Activity (the nine seated verbs), Walk of life (17 seated family words), plus tag-fit on worn tags.
2. A blind, filtered state, and a reversed-order twin for every Choice.
3. Four finding classes reported, never applied; the first run's executor files one ticket per class; the mislabel audit follows next.
4. Artifact and report on `ops`, overwritten each run, cached by content hash; no served page.
5. A 64-entry stratified sample labelled by a blind reader subagent; the threshold is the lowest confidence giving 85% agreement over at least half the sample; otherwise the axis is uncalibrated.

## Forked-audit verdicts

Intent judge (opus, cold, ~64 s): **Allow**, Reversible. Two GAPs closed before the PR. Dimension 6: Activity and Walk of life are now stated as run-local option lists, not a split of the `family` axis, citing `Docs/ubiquitous-language/Encounters.md:355`. Dimension 10: a `## Kill criteria` section was added. Two advisories were applied: slice B was filed as [THR-1850](https://linear.app/threadbare/issue/THR-1850/first-encounter-coverage-run-judge-all-encounter-entries-with-jev), blocked by this ticket, and the report header now names the calibrating reader as a model.

### NFP audit

**NFP AUDIT: PASS-with-notes.**

- Tunability: PASS-with-note. The partial-run error share had no name. It is now `RUN_PARTIAL_ERROR_SHARE`.
- Inspectability: PASS.
- Determinism: PASS-with-note. The remote model is not bit-reproducible. Answers are persisted and reused, keyed on `(contentHash, questionsVersion, model)`, and the sample is chosen by FNV hash.
- Fail-soft: PASS.
- Narrative: PASS.
- Additive: PASS.
- Performance: N/A.

### Three-pillar audit

**PILLAR AUDIT: PASS.**

- Engine: N/A with rationale.
- Content: present and substantive.
- UI: N/A with rationale (THR-1495 withholds the encounter catalog; authoring readers only).
- No required section is missing. The Wiring section is coherent for offline-only. The substrate check is N/A, but the inventory is present and replaces nothing.

### Vision audit

**VISION AUDIT: PASS-with-notes.** No contradictions.

- Confirmed: non-negotiables #2 (narrative; the map is "not a quota"), #6 (additive) and #7 (three pillars), and the taste-profile rejection of pure LLM-generated content.
- Extended: core-loop curation (pipeline Step 0a) and design tension #2.
- Note: the Vision checkbox cited no Vision files by path. They are now cited.
