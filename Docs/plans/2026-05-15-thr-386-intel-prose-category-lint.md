# THR-386 — Lint rule: `intel_referenced_prose` category vs encounter context match

**Linear issue:** THR-386
**Project:** Encounter Format Migration (Urgent, Now)
**Parent / source:** THR-139 (`intel_referenced_prose` aftermath reaction — Done). Deferral item 4 of `Docs/plans/2026-05-08-thr-139-intel-referenced-prose-reaction.md` §C6 + §Deferrals.
**Sibling deferrals:** THR-383 (template-walk content sweep — Ready for Dev), THR-384 (reaction-level dedup — Idea, gated on playtest), THR-142 (cross-agent intel — Idea).
**Effort size:** S (one pure lint module + one advisory script + one correctness test + a one-line `package.json` script entry).
**Audience:** Claude Code, `model:sonnet`. Mechanical, pattern-following work — there is a near-exact reference implementation (`scripts/lint-encounter-content.ts`), the corpus is known, and the heuristic is fully specified below. No prose authoring, no novel-system design.

## Problem

THR-139 shipped the `intel_referenced_prose` aftermath effect: an author opts in by adding `{ kind: 'intel_referenced_prose', category: <IntelligenceCategory>, prose: {...} }` to a reaction, and when the actor holds a matching intelligence record the chronicle gets an authored "the intel paid off" line. THR-383 (now Ready for Dev) is the breadth pass that adds this effect across the encounter-content catalog — potentially 25–40 new effects.

The `category` field is hand-wired per effect. It is easy to wire wrong: an author copies a reaction, changes the prose, and forgets to change `category` — or picks a category that has no plausible relationship to the encounter. When that happens the effect silently mostly-never fires (the runtime matcher in `findIntelReferencedProseMatch` falls through), and the author gets no signal. THR-139's own §C6 flagged this and deferred a lint guard. With THR-383 about to multiply the surface ~10×, the guard is now worth its cost: a structural check that flags effects whose `category` looks implausible for their template, so a human can confirm-or-fix before the mis-wire ships.

This is **advisory, not blocking** — see "Why a soft warning" below. The runtime matcher can legitimately match on `targetId`/`region` at runtime, which a static lint cannot see, so some flagged effects will be intentional. The lint's job is to surface the *likely-author-error* shape, not to gate content.

## Three-pillar coverage

This is an **Infrastructure / tooling** ticket (Linear label: `Infrastructure`). It is a build-time/dev-time content-quality guard. It adds no runtime systems, no content, and no player-facing surface — so all three product pillars are **N/A by design**, each with rationale below. The real design lives in the "Tooling design" section, which is treated with the same rigor a pillar section would get.

| Pillar | Status | Rationale |
|---|---|---|
| Engine | **N/A** | No tick-loop, graph, resolution, PRNG, or GameState change. The lint imports template *data* and walks it; it never runs inside the simulation. `TEMPLATE_CATEGORY_MATCHERS` is *read* from `src/engine/intelligence.ts` (import only — see "Single source of truth"), not modified. |
| Content | **N/A** | No new encounter / prose / attachment / data-table content is authored. THR-386 is a guard *for* content (it protects the THR-383 sweep); it is not content itself. The only authored data is one tiny synthetic "bad" fixture used by the correctness test. |
| UI | **N/A** | Output is CLI text (the advisory script) and vitest output (the correctness test). No player-facing surface, no notification, no DebugPanel inspector, no HexMap signifier. The tool never runs in-game. Browser-verify is genuinely exempt — no file under `src/components/`, `src/views/`, `src/hooks/use*UI*`, `src/styles/`, `index.css`, or any HexMapV2/Three.js surface is touched. |

## Tooling design

### T1. The plausibility heuristic

For each `intel_referenced_prose` effect with `category: C` found inside a template `T`, the effect's category is considered **plausible** if **any** of the following holds:

1. **Co-traffic signal (primary).** Any reaction anywhere in `T.aftermathConfig` (`fallback.reactions[]` and every `variants[*].reactions[]`) contains a `kind: 'intelligence'` effect with `category === C`. Rationale: if the template *grants* that category of intelligence, *referencing* it later is coherent by construction. This is the strongest signal and it is exactly the surface THR-383 authors against — the THR-383 plan §C1 scopes its sweep to "the 18 files that already carry `kind: 'intelligence'` grants … the strongest 'category is realistic here' signal." So co-traffic clears almost all of THR-383's additions automatically.
2. **Structural signal.** At least one substring in `TEMPLATE_CATEGORY_MATCHERS[C]` appears (case-insensitive) in the concatenated **context string** for `T`: `T.id` + `' '` + `T.name` + `' '` + `(T.locationSubtypes ?? []).join(' ')` + `' '` + `(T.targetSubtypes ?? []).join(' ')` + `' '` + the enclosing reaction's `id` + `' '` + the enclosing reaction's `label`. Rationale: mirrors the runtime matcher's `templateId.includes(m)` path, widened to the structural fields a static pass can see.
3. **Self-evident on the reaction.** Covered by (1) when the same reaction both grants and references `C`; no separate rule needed.

If **none** of (1)–(2) holds, emit one **warning** naming: source file (best-effort), `T.id`, the reaction `id`, the effect's array index, the effect `category`, and the `TEMPLATE_CATEGORY_MATCHERS[C]` substrings that were searched for. Suggested message shape:

```
WARNING template:ac.quest.translate_tome
  reaction "translate_tome_note" effect[1]: intel_referenced_prose category 'military_position'
  has no plausible context match — template grants no 'military_position' intelligence and none of
  [war, siege, patrol, garrison, ambush] appears in the template id / name / locationSubtypes / reaction id+label.
  Either fix the category or confirm it is intentional (runtime targetId/region match).
```

**Why the co-traffic signal matters — worked example.** THR-139's arcane-circle pilot lives on a template whose `id` is `ac.quest.*`-shaped (e.g. an enchant-artifact quest). Its reaction grants `kind: 'intelligence', category: 'agent_network'` *and* references `kind: 'intel_referenced_prose', category: 'agent_network'` in the same `effects[]` array. A naive templateId-substring-only check would **false-positive** here (`ac.quest.enchant_artifact` contains none of `network`/`contact`/`recruit`). Rule (1) clears it cleanly — the template demonstrably traffics in `agent_network`. This is the load-bearing reason rule (1) is primary and rule (2) is the fallback, not the other way round.

### T2. The corpus

Two template sources, both expose `UnifiedActionTemplate`-shaped objects with `id`, optional `name` / `locationSubtypes` / `targetSubtypes`, and `aftermathConfig` — so a **single walker** over `UnifiedActionTemplate[]` handles both:

1. **`UNIFIED_ACTION_TEMPLATES`** (`src/data/unified-action-templates.ts`) — already aggregates the `*-encounter-content.ts` files (it imports `ANOMALY_ENCOUNTER_TEMPLATES`, `ARCANE_CIRCLE_ENCOUNTER_TEMPLATES`, `BUILDERS_FELLOWSHIP_ENCOUNTER_TEMPLATES`, …). All three current THR-139 pilots live here.
2. **`src/data/encounters/` branching encounter files** — each exports a `UnifiedActionTemplate` (e.g. `THE_MERCHANTS_FAVOR_TEMPLATE`) with its own `id`, `locationSubtypes`, and `aftermathConfig`. THR-383's sweep will add `intel_referenced_prose` effects here, so the lint must cover this corpus for forward-coverage even though it has zero such effects today.

**Implementation note for the executor — verify before you build:** confirm whether the `src/data/encounters/` branching templates are *already* re-exported through `UNIFIED_ACTION_TEMPLATES` (or a sibling aggregate). If they are, the corpus is one import. If not, assemble the second list explicitly — there is no `src/data/encounters/index.ts` today, so you will either add a thin barrel export or enumerate the module imports. Prefer a thin barrel (`src/data/encounters/index.ts` exporting an `ALL_BRANCHING_ENCOUNTER_TEMPLATES: readonly UnifiedActionTemplate[]`) — it is reusable and avoids a brittle per-file import list in the lint script. **Do not regex-scan the `.ts` files** for effect objects; import and walk the typed objects (the `lint-encounter-content.ts` corpus is import-based for exactly this reason — regex over nested effect arrays is unreliable).

### T3. Module + script layout

Mirror the existing `lint-encounter-content.ts` split (pure logic in a module, thin CLI wrapper in `scripts/`):

1. **`src/testing/intelProseCategoryLint.ts`** — new pure module. No `vitest`, no `console`, no `process`. Exports:
   - `interface IntelProseCategoryLintWarning { readonly source: string; readonly templateId: string; readonly reactionId: string; readonly effectIndex: number; readonly category: IntelligenceCategory; readonly searchedSubstrings: readonly string[]; readonly message: string; }`
   - `interface IntelProseCategoryLintResult { readonly warnings: readonly IntelProseCategoryLintWarning[]; readonly templatesScanned: number; readonly effectsScanned: number; readonly systemNotes: readonly string[]; }`
   - `function runIntelProseCategoryLint(templates: readonly UnifiedActionTemplate[]): IntelProseCategoryLintResult` — pure, deterministic, fail-soft (see T6). Imports `TEMPLATE_CATEGORY_MATCHERS` from `src/engine/intelligence.ts`.
   - A small exported helper `isIntelCategoryPlausible(template, reactionId, category): boolean` so the correctness test can assert the heuristic directly.
2. **`scripts/lint-intel-prose-category.ts`** — new thin advisory CLI. Assembles the corpus (T2), calls `runIntelProseCategoryLint`, prints a one-line-per-warning report plus a summary line (`scanned N templates / M effects — K warnings`). **Exits 0 always** unless the script itself throws (corpus import failure) — advisory, never blocks. Mirrors `lint-encounter-content.ts`'s `runCli` / `printRunResult` shape but without the `errorCount > 0 → exit 1` gate.
3. **`package.json`** — add one script entry, mirroring the `lint:encounter-content` esbuild-bundle pattern:
   `"lint:intel-prose-category": "esbuild scripts/lint-intel-prose-category.ts --bundle --platform=node --format=esm --outfile=.cache/lint-intel-prose-category.mjs --external:fs --external:path --external:process --external:url && node .cache/lint-intel-prose-category.mjs"`
4. **`src/testing/__tests__/intelProseCategoryLint.test.ts`** (or co-located in `src/data/__tests__/`) — new correctness test, runs inside `npm test`. See T4.

### T4. The correctness test — what it asserts (and what it must NOT)

The test verifies the **lint function is correct**, not that the corpus is clean. A test that asserted "zero warnings across the whole live corpus" would silently convert this advisory tool into a blocking content gate — explicitly out of scope (THR-386: "soft warning (not a failure)"). The test asserts exactly:

- **Pilots clear.** `runIntelProseCategoryLint` over the live corpus produces **zero warnings for the three THR-139 pilot reactions** (arcane-circle `agent_network`, builders-fellowship `political_secret`, encounter-anomaly `cultural_knowledge`). Assert by filtering `result.warnings` to those `templateId`/`reactionId` pairs and expecting an empty list. This is THR-386's "pre-existing pilots flagged or cleared correctly" + "no false positives on the in-scope encounter set."
- **Co-traffic rule fires.** A synthetic in-test `UnifiedActionTemplate` fixture whose reaction grants `intelligence` of category X and references `intel_referenced_prose` of category X → `isIntelCategoryPlausible` returns `true`; no warning.
- **Structural rule fires.** A synthetic fixture with a templateId/locationSubtype containing a `TEMPLATE_CATEGORY_MATCHERS` substring but no co-grant → plausible, no warning.
- **Bad case is caught.** A synthetic fixture with an `intel_referenced_prose` category that is neither co-trafficked nor structurally present → exactly one warning, with the expected `templateId`/`reactionId`/`category`/`searchedSubstrings`.
- **Determinism.** Two runs over the same input produce identical `warnings` arrays (order included — sort warnings by `templateId`, then `reactionId`, then `effectIndex`).

### T5. CI / discoverability

THR-386 says "runs as part of `npm test` **or** `npm run check:content` advisory script" — the OR is satisfied two ways and both ship:
- The **correctness test (T4) runs in `npm test`** — that is the always-on CI presence.
- The **advisory script (`npm run lint:intel-prose-category`)** is the on-demand human/agent surface. It is the command the THR-383 executor should run after the sweep, and the command a content author runs after touching `intel_referenced_prose` effects. Add a one-line pointer to it in `Docs/plans/2026-04-16-systemic-wiring-guide.md` under the existing `intel_referenced_prose` row (THR-139 added that row) so content agents discover it.

Wiring it as a non-blocking CI step in `.github/workflows/ci.yml` is **optional and out of scope** — if the executor adds it, it must be advisory only (the script already exits 0, so a plain step is non-blocking; do not add it to the required `Test · Typecheck · Build` check). Recommended: leave CI untouched this ticket; the `npm test` correctness gate + the systemic-wiring-guide pointer are sufficient.

### T6. Fail-soft table (NFP #4)

| Failure mode | Fallback behaviour |
|---|---|
| A template object is malformed (missing `aftermathConfig`, `reactions` not an array, etc.) | `try/catch` around the per-template walk; push a `systemNotes` entry (`"skipped template <id>: <error>"`) and continue. One bad template never aborts the lint. Mirrors `lint-encounter-content.ts` `collectTemplateCorpus` try/catch. |
| `TEMPLATE_CATEGORY_MATCHERS[C]` is undefined (category not in the table) | Treat as "no structural substrings" — rule (2) cannot pass; rule (1) still can. If neither passes, the warning message notes the empty substring set. Never throw. |
| An effect has `kind: 'intel_referenced_prose'` but a malformed `category` (not an `IntelligenceCategory`) | Emit a warning with `category` echoed verbatim and `searchedSubstrings: []`; do not throw. (TypeScript should already prevent this, but the lint is defensive.) |
| Corpus import throws (e.g. `src/data/encounters` barrel fails to load) | The **script** catches at the top level, prints the error, exits 1 (this is a script-level failure, not a content warning — the only non-zero exit). The **pure module** never imports the corpus itself, so it is unaffected. |
| `name` / `locationSubtypes` / `targetSubtypes` absent on a template | Treated as empty strings in the context string. No throw. |

### T7. Constants / tunables (NFP #1)

No new tunable numeric constants. The lint is binary (plausible / not plausible). The two configurable surfaces are both *structural lists*, not magic numbers, and both should be named module-level `const`s in `intelProseCategoryLint.ts` with a comment:
- `CONTEXT_STRING_SOURCES` — documents which template/reaction fields feed the context string (T1 rule 2). Named so a future author can widen it (e.g. to include step `narrative` text) without hunting through logic.
- `TEMPLATE_CATEGORY_MATCHERS` is **imported, never redefined** — see "Single source of truth".

### T8. Single source of truth

`TEMPLATE_CATEGORY_MATCHERS` already exists in `src/engine/intelligence.ts` (lines ~66–73) and is the authority used by the *runtime* matcher (`findActionableIntelligence`, `findIntelReferencedProseMatch`). The lint **must import it**, never fork or re-declare it. If the lint forked the table, the lint's notion of "plausible" would drift from the runtime's notion of "matches" — defeating the entire purpose. This is a hard constraint, not a preference.

## Tracing (NFP #2)

N/A as a runtime concept — the lint emits no `emitTrace` calls. Inspectability is satisfied structurally: every warning is a typed `IntelProseCategoryLintWarning` carrying `source`, `templateId`, `reactionId`, `effectIndex`, `category`, and `searchedSubstrings` — enough for a human to jump straight to the offending effect and see exactly what the heuristic looked for.

## Why a soft warning, not a hard failure

The runtime matcher `findIntelReferencedProseMatch` matches a record by **any** of: `targetEntityId === action.targetId`, `targetRegion === action's region`, or `templateId` substring. A static lint can only see the third path — `targetId` and `region` are runtime-resolved (THR-386 explicitly puts region matching out of scope). So an effect the lint flags as "implausible" can still be perfectly intentional: the author may be relying on the actor holding a record about the *specific entity* the encounter targets. Making this a hard `npm test` failure would force authors to suppress or contort legitimate effects. Advisory is the correct severity: it surfaces the *shape* of a likely mistake and asks a human to confirm. This matches the repo's existing posture for `check:process` ("advisory … non-blocking") and `lint-encounter-content.ts`'s `R5` warnings.

## Wiring checklist (`Docs/plans/wiring-checklist.md`)

| Wiring surface | Status |
|---|---|
| Orchestrator phase | None — not a runtime system. |
| GameState fields | None. |
| Modals / GameView JSX | None. |
| Trace categories | None. |
| Debug visibility | None — lint output is CLI / test output. |
| Prose pipeline | None. |
| Player controls | None. |
| `package.json` scripts | **New:** `lint:intel-prose-category` (one additive line). |
| `Docs/plans/wiring-checklist.md` | No new row needed (no runtime surface) — but add a one-liner under any "content lint" / tooling section if one exists. |
| `Docs/plans/2026-04-16-systemic-wiring-guide.md` | **Update:** add a pointer to `npm run lint:intel-prose-category` under the existing `intel_referenced_prose` capability row. |

## NFP compliance

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | No new magic numbers; the one configurable surface (`CONTEXT_STRING_SOURCES`) is a named `const`. `TEMPLATE_CATEGORY_MATCHERS` reused, not forked. |
| 2. Inspectability | PASS | Every warning is a typed record with file/template/reaction/effect-index/category/searched-substrings — directly traceable to the offending effect. |
| 3. Determinism | PASS | Pure function; warnings sorted by `(templateId, reactionId, effectIndex)`. Two runs over the same corpus are byte-identical. Asserted in T4. |
| 4. Fail-soft | PASS | Per-template `try/catch` → `systemNotes` + continue; malformed categories never throw; only a corpus-import crash exits non-zero, and only in the script wrapper. See T6. |
| 5. Narrative over mechanical | PASS (N/A-leaning) | The lint exists to keep authored narrative effects firing as intended — it protects narrative integrity rather than trading against it. |
| 6. Additive over destructive | PASS | All-new files (`intelProseCategoryLint.ts`, `lint-intel-prose-category.ts`, the test, optionally `src/data/encounters/index.ts`) + one additive `package.json` line. Zero modification of existing runtime code. `TEMPLATE_CATEGORY_MATCHERS` is imported read-only. |
| 7. Performance | PASS | Build-time/dev-time only; never on the tick path. One linear walk of the template corpus. No budget impact. |

## Risks + open questions

1. **Risk — false positives on `src/data/encounters/` branching templates.** Branching encounters may have richer per-step structure than the `aftermathConfig` walk assumes. Mitigation: T2 mandates the executor verify the corpus shape before building, and the heuristic's rule (1) (co-traffic) keys off `aftermathConfig` which the existing `contentInvariants.ts:assertKnownAftermathKinds` already walks for these templates — so the structure is proven. If a branching template stores reactions somewhere other than `aftermathConfig.{fallback,variants}.reactions`, the executor extends the walker and notes it; it is not a redesign.
2. **Risk — the THR-383 sweep lands first and produces warnings the lint then flags.** This is *working as intended* — THR-386 is the guard for exactly that sweep. Sequencing: THR-386 and THR-383 are parallel-safe (disjoint files). If THR-386 lands first, the THR-383 executor runs `npm run lint:intel-prose-category` as a post-sweep check. If THR-383 lands first, THR-386's executor runs the new lint over the post-sweep corpus and any warnings it surfaces are filed as a normal content follow-up (not blocking THR-386's own merge — the correctness test only asserts the pilots clear, not the whole corpus).
3. **Open question — should the lint also cover `npc-action-templates.ts`?** Out of scope. THR-383's scope note verified `unified-action-templates.ts` and `npc-action-templates.ts` carry zero `aftermathReactions`. If a future ticket adds `intel_referenced_prose` effects to NPC templates, widening the corpus is a one-line change to the script's corpus assembly — note it, don't build for it now.
4. **Open question — warning volume.** If the post-THR-383 corpus produces a noisy warning list, that is signal, not noise: it means the sweep wired implausible categories and they need human review. No dedup or volume cap is in scope — the warning count is the metric.

## Coordination block

```
Suggested model: sonnet
model:sonnet   ← matching label applied to the issue (Rule 10)
Parallel-safe with: THR-425, THR-383, THR-406, THR-434
Mutex with: none
Codex review: yes (multi-file tooling change — review catches corpus-assembly bugs and heuristic false-positive/false-negative errors before they ship)
```

**Why parallel-safe with all current executor work:**
- **THR-383** (intel-referenced-prose content sweep) — edits `src/data/*-encounter-content.ts` + `src/data/encounters/*.ts`. THR-386 edits `src/testing/`, `scripts/`, `package.json`, and optionally adds `src/data/encounters/index.ts` (a *new* barrel — does not modify existing encounter files). Disjoint. The two are designed to complement: THR-386 is the guard for THR-383's output.
- **THR-425** (stagger Linear MCP pollers) — infra/scheduling config, no file overlap.
- **THR-406** (Vision/ numbered files — Codex) — docs/vault, no file overlap.
- **THR-434** (impediment-dashboard regen) — `scripts/` + impediment data; if it also touches `package.json` the overlap is two *additive, non-conflicting* script lines — trivial merge. Flag for whoever lands second.

**Mutex with: none.** The only shared file is `package.json`, and the change is a single additive script entry — not a mutex-class conflict.

## Done when

- [ ] `src/testing/intelProseCategoryLint.ts` created — pure module exporting `runIntelProseCategoryLint`, `isIntelCategoryPlausible`, and the two interfaces. Imports `TEMPLATE_CATEGORY_MATCHERS` from `src/engine/intelligence.ts` (not forked).
- [ ] `scripts/lint-intel-prose-category.ts` created — advisory CLI, assembles both corpora, prints warnings + summary, exits 0 on warnings (exits 1 only on corpus-import crash).
- [ ] Corpus assembly verified per T2 — if `src/data/encounters/` branching templates are not already aggregated, a thin `src/data/encounters/index.ts` barrel is added (preferred over a per-file import list).
- [ ] `package.json` — `lint:intel-prose-category` script added, mirroring the `lint:encounter-content` esbuild pattern.
- [ ] `src/testing/__tests__/intelProseCategoryLint.test.ts` created — asserts: 3 THR-139 pilots clear; co-traffic rule clears; structural rule clears; synthetic bad fixture flagged with expected fields; determinism (sorted, stable). Does **not** assert whole-corpus cleanliness.
- [ ] `Docs/plans/2026-04-16-systemic-wiring-guide.md` — pointer to `npm run lint:intel-prose-category` added under the `intel_referenced_prose` row.
- [ ] `npm test` green · `npx tsc --noEmit` clean · `npx vite build` clean — raw output pasted in the closing commit body or Linear completion comment.
- [ ] `npm run lint:intel-prose-category` runs clean against the current corpus (expected: 0 warnings today, since the only 3 `intel_referenced_prose` effects are the well-formed THR-139 pilots) — paste the summary line as evidence.
- [ ] Browser-verify exempt — state in the commit body: `Browser-verify exempt: tooling/infra change, no runtime UI surface (no files under src/components, src/views, src/hooks/use*UI*, src/styles, index.css, or HexMapV2)`.
- [ ] Closing commit body includes `Fixes THR-386`.

## Definition of done for this issue

Standard repo Definition of Done applies. Notes specific to THR-386:
- This is a content-quality *tool*, not content — the THR-383 sweep is the customer. No deferrals expected; if the executor finds the `src/data/encounters/` corpus needs more than a thin barrel, that is a scope note in the closing comment, not a new deferral.
- Engine-smoke (30-tick CLI) is **not required** — THR-386 touches nothing under `src/engine/`, `src/types/gameState.ts`, `src/types/graph.ts`, or any tick-loop / orchestrator / phase / agent-decision file. (It *imports* `TEMPLATE_CATEGORY_MATCHERS` from `src/engine/intelligence.ts` read-only; it does not modify engine code.)

---

*Plan authored by Cowork, 2026-05-15 (`keep-work-flowing` scheduled run).*
