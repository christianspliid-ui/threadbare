# THR-302 — Encounter Format Architecture Cleanup (Implementation Plan)

**Status:** Implementation contract for executor pickup. Draft 2026-05-05.

**Linear issue:** THR-302
**Project:** Encounter Experience
**Parent design plan:** `Docs/plans/2026-05-04-encounter-experience-design-plan.md` §3.1
**Predecessor (closed):** THR-300
**Sibling (gated by this):** THR-301 (encounter UI long-form plan)

---

## 1. Premise

The audit dated 2026-05-04 declared encounter migration "functionally 100 % complete" and framed the remaining work as a clean delete of the deprecated `EncounterTemplate` type plus a tidy CMS metadata filter. Verification against the working tree on 2026-05-05 surfaced architectural surprises that change the shape of the work — exactly the contingency THR-302 anticipated.

This plan documents what is mechanically deletable, what is judgment-heavy refactor, and what assumptions in `Docs/plans/2026-05-04-encounter-experience-design-plan.md` need refresh before THR-301 implementation begins.

---

## 2. Verification findings (2026-05-05)

### 2.1 `EncounterTemplate` is not just a comment-only carcass

`grep -r EncounterTemplate src/` returns matches in **50 files**. Of those, **19 files use it as a TypeScript parameter or return type** — meaning deletion is a multi-file refactor, not a single-line edit. Confirmed callers:

| File | How it uses `EncounterTemplate` |
|------|--------------------------------|
| `src/engine/encounterCache.ts` | Imports the type; `computeRewardEstimate(template: EncounterTemplate)`, `computeTotalTickCost(template: EncounterTemplate)`, cache builder accepts `tmpl: EncounterTemplate` |
| `src/engine/encounterEventNode.ts` | Type-annotates encounter inputs |
| `src/engine/debugEncounterTools.ts` | Type-annotates inputs |
| `src/engine/__tests__/encounter.test.ts` | Test fixtures typed as `EncounterTemplate` |
| `src/engine/__tests__/encounterCache.test.ts` | Test fixtures |
| `src/engine/__tests__/encounterEventNode.test.ts` | Test fixtures |
| `src/engine/__tests__/multiTickSteps.test.ts` | Test fixtures |
| `src/engine/__tests__/socialLeverage.test.ts` | Test fixtures |
| `src/types/__tests__/encounter-quest.test.ts` | Test fixtures |
| `src/testing/contentInvariants.ts` | Invariant scaffolding |
| `src/testing/__tests__/contentInvariants.test.ts` | Invariant tests |
| `src/components/Game/encounter-stage/adapters/buildSimpleEncounterStageModel.ts` | UI adapter; three `EncounterTemplate` parameter sites |
| `src/components/Game/encounter-stage/adapters/__tests__/buildSimpleEncounterStageModel.test.ts` | Adapter tests |
| `src/components/Game/__tests__/LocationView.test.tsx` | Component tests |
| `src/components/Game/__tests__/EncounterLog.test.tsx` | Component tests |
| `src/components/Game/ThreadsPanel.tsx` | Live UI consumer |
| `src/components/Game/RetinuePanel.tsx` | Live UI consumer |
| `src/components/Game/LocationView.tsx` | Live UI consumer |
| `src/components/Game/EncounterLog.tsx` | Live UI consumer |

These compile today because `EncounterTemplate` and `UnifiedActionTemplate` happen to share enough structural overlap (id, name, etc.) for the consumers' actual property reads to type-check. That structural luck is not a substitute for a coherent type contract. The cleanup must retype each call site to `UnifiedActionTemplate` (or to a narrower DTO), then prove the property reads still resolve.

### 2.2 The deprecation comment points at a function that does not exist

The JSDoc on `EncounterTemplate` (line 185 of `src/types/encounter.ts`) reads:

> `@deprecated Use UnifiedActionTemplate — see src/data/unified-action-templates.ts#migrateEncounterTemplate for the migration path.`

`grep migrateEncounterTemplate` against the working tree returns **zero matches**. The actual helper in `unified-action-templates.ts` is `migrateActionTemplate(old: ActionTemplateData)` — different name, different input type. Either the migration helper was renamed or the comment was aspirational; either way, the executor must not chase a ghost function.

### 2.3 The CMS metadata-filter proposal needs a different signal

The parent plan §3.1 proposes filtering `UNIFIED_ACTION_TEMPLATES` by `narrativeLayer: 'encounter'` plus `category`. The verification:

- `narrativeLayer` is a real optional field on `UnifiedActionTemplate` (`src/types/unifiedAction.ts` line 625).
- Across `src/data/`, the only values actually authored are `'ruins'`, `'soul'`, and `'land'`.
- **No encounter content file sets `narrativeLayer: 'encounter'`.** Civic Guard, Arcane Circle, Holy Order Dawn, Thieves' Guild, social, faction, mercenary, monster, army, siege, battle — none of them.

So a filter on `narrativeLayer === 'encounter'` returns zero rows today. The CMS refactor cannot land as written. There are three viable resolutions, and the choice is design-direction-bearing — it changes the metadata contract content authors live under.

| Option | Scope | Trade-off |
|--------|-------|-----------|
| **A. Bulk-add `narrativeLayer: 'encounter'`** to every encounter template across the 8+ source files | 28 files of `UnifiedActionTemplate[]` declarations | Most faithful to the parent plan; large mechanical edit; commits authors to populating `narrativeLayer` going forward; ends with three meaningful values (`encounter`, `ruins`, `soul`/`land`) and a clear taxonomy |
| **B. Use a side-table registry** keyed by template id (`ENCOUNTER_TEMPLATE_IDS: ReadonlySet<string>`) populated by re-exporting each source array's ids | Adds one indirection module | No content-file edits; CMS filter becomes `id ∈ ENCOUNTER_TEMPLATE_IDS`; loses the in-template self-description that makes content browsable from the template alone |
| **C. Keep the 8 separate CMS imports, treat them as authored taxonomy** | No code change beyond comments | Honest about what the data looks like today; punts metadata-driven filtering until the encounter UI work surfaces an actual need; closes THR-302 with the type-system cleanup only |

**Recommendation in this plan: Option A.** It honours the parent plan, respects the principle that browseable content carries its own taxonomy, and is mechanical once the executor commits to it. But the choice belongs to the executor + author once they see the diff size; document the chosen path in the closing commit and feed the verdict back to THR-301.

### 2.4 `Systems/Encounter System.md` claim is still inaccurate

Untouched by verification — the audit is correct that the canonical doc claims `EncounterTemplate` was removed and that this is false today. Fix lands with the type-deletion commit.

---

## 3. Three-pillar coverage

### 3.1 Engine pillar (primary)

**Type-system surgery.** The work:

1. Replace every `EncounterTemplate` parameter / variable / return-type annotation with `UnifiedActionTemplate` across the 19 callers listed in §2.1. Where a function reads only a narrow subset of properties (e.g. `encounterCache.ts#computeRewardEstimate` likely reads `id` + `outcomes`), prefer narrowing to `Pick<UnifiedActionTemplate, 'id' | …>` or to a small DTO interface defined alongside the consumer.
2. Audit `encounterCache.ts` specifically — its caller `factionQuestGeneration.ts` (which has zero `EncounterTemplate` references) suggests there is already a UnifiedActionTemplate-typed callsite producing the cache entries; confirm and unify.
3. Delete the `EncounterTemplate` interface (`src/types/encounter.ts` lines 184–287) and its stale comment.
4. Re-target the deprecation reference in any remaining JSDoc: there is no `migrateEncounterTemplate`. Either point at `migrateActionTemplate` if it serves the same role, or remove the reference.
5. Confirm `npx tsc --noEmit` is clean after the deletion. Run `npm test`.

**No new graph nodes, edges, tick phases, PRNG callouts, or constants** — pure type-system refactor.

**Constants table:** N/A — no tunables introduced or moved.

**PRNG callouts:** N/A.

**Fail-soft table:** N/A — compile-time refactor; runtime behaviour must be byte-identical.

**Tracing:** N/A — no new traces.

### 3.2 Content pillar

**N/A with rationale.** No encounter content files change. All `*-encounter-content.ts` files already declare `UnifiedActionTemplate[]`. The audit's "all 115 templates migrated" claim is correct at the content level; the mismatch is purely structural (type definition + CMS plumbing).

If the executor adopts §2.3 Option A, the content change is the bulk addition of `narrativeLayer: 'encounter'` to every encounter template across:
- `encounter-content.ts`, `social-encounter-content.ts`, `tavern-encounter-content.ts`, `borderland-encounter-content.ts`
- `faction-encounter-content.ts`, `civic-guard-encounter-content.ts`, `arcane-circle-encounter-content.ts`, `holy-order-dawn-encounter-content.ts`, `thieves-guild-encounter-content.ts`, `merchant-consortium-encounter-content.ts`, `lorekeepers-covenant-encounter-content.ts`, `rangers-brotherhood-encounter-content.ts`, `temple-of-spheres-encounter-content.ts`, `builders-fellowship-encounter-content.ts`
- `mercenary-encounter-content.ts`, `monster-encounter-content.ts`, `army-encounter-content.ts`, `siege-encounter-content.ts`, `battle-spotlight-content.ts`, `underking-court-encounter-content.ts`
- `secret-encounter-content.ts`, `encounter-anomaly-content.ts`

That is mechanical-flavoured but voluminous. If the executor adopts Option B or C, no content edits.

### 3.3 UI pillar

**Live consumers (must be retyped, must remain visually identical):**
- `src/components/Game/ThreadsPanel.tsx`
- `src/components/Game/RetinuePanel.tsx`
- `src/components/Game/LocationView.tsx`
- `src/components/Game/EncounterLog.tsx`
- `src/components/Game/encounter-stage/adapters/buildSimpleEncounterStageModel.ts`

After retyping, run `?view=game&seeded&size=medium` and verify Threads panel, Retinue panel, Location detail panel, and Encounter Log render unchanged. The CMS browser at `?view=cms` must look identical post-refactor — same categories, same encounter cards listed under each — even if the *internal* import topology has changed.

**Verification only — no new UI surfaces, no signifiers, no notifications, no debug panels.** This is type-system hygiene; the player surface is invariant.

### 3.4 Wiring (per `Docs/plans/wiring-checklist.md`)

| Surface | Change |
|---------|--------|
| Orchestrator phases | None |
| GameState fields | None |
| Trace categories | None |
| Player controls | None |
| Modals registered in GameView | None |
| CMS registry imports | Refactor (option chosen by executor; visible categories must stay stable) |
| Debug panel | None |
| Wiring checklist file | No edit required — this work removes infrastructure rather than adding it |

---

## 4. Files to touch (executor checklist)

Engine retype:
- `src/types/encounter.ts` — delete `EncounterTemplate` interface (lines 184–287) + stale JSDoc; preserve `EncounterStep`, `EncounterType`, `ThreatRating`, `SecretDiscoverySource`, etc. that other call sites still need
- `src/engine/encounterCache.ts` — retype 4 sites
- `src/engine/encounterEventNode.ts` — retype
- `src/engine/debugEncounterTools.ts` — retype
- `src/components/Game/encounter-stage/adapters/buildSimpleEncounterStageModel.ts` — retype 3 sites
- `src/components/Game/ThreadsPanel.tsx` — retype
- `src/components/Game/RetinuePanel.tsx` — retype
- `src/components/Game/LocationView.tsx` — retype
- `src/components/Game/EncounterLog.tsx` — retype
- `src/testing/contentInvariants.ts` — retype

Tests (retype fixtures only — assertions stay):
- `src/engine/__tests__/encounter.test.ts`
- `src/engine/__tests__/encounterCache.test.ts`
- `src/engine/__tests__/encounterEventNode.test.ts`
- `src/engine/__tests__/multiTickSteps.test.ts`
- `src/engine/__tests__/socialLeverage.test.ts`
- `src/types/__tests__/encounter-quest.test.ts`
- `src/testing/__tests__/contentInvariants.test.ts`
- `src/components/Game/encounter-stage/adapters/__tests__/buildSimpleEncounterStageModel.test.ts`
- `src/components/Game/__tests__/LocationView.test.tsx`
- `src/components/Game/__tests__/EncounterLog.test.tsx`

CMS (executor chooses Option A / B / C from §2.3):
- `src/components/CMS/registry.ts` — refactor encounter imports; visible categories unchanged
- (Option A only) the 22 `*-encounter-content.ts` files — bulk-add `narrativeLayer: 'encounter'`

Doc accuracy:
- `Systems/Encounter System.md` (Obsidian vault) — replace stale "type was removed" claim with: *"All encounter templates are functionally migrated to UnifiedActionTemplate. The deprecated `EncounterTemplate` type was removed in <merge commit>."*

THR-301 feedback:
- Post a comment on THR-301 with the verdict on §2.3 (which option was chosen and why), and any further architectural surprises uncovered during the refactor.

---

## 5. Done when

- [ ] `EncounterTemplate` interface and the `migrateEncounterTemplate` JSDoc reference are gone from `src/types/encounter.ts`.
- [ ] All 19 callers retyped to `UnifiedActionTemplate` (or a narrower `Pick<>`); zero remaining references to `EncounterTemplate` in `src/`.
- [ ] CMS registry refactored per the chosen option from §2.3; `?view=cms` renders identical encounter categories before/after.
- [ ] `?view=game&seeded&size=medium` boots; ThreadsPanel, RetinuePanel, LocationView, EncounterLog render unchanged.
- [ ] `npm test` green; `npx tsc --noEmit` clean; `npx vite build` succeeds.
- [ ] `Systems/Encounter System.md` updated with accurate post-refactor language.
- [ ] Comment posted on THR-301 reporting (a) which CMS option was chosen and why, (b) any further architectural surprises that change THR-301's assumptions.
- [ ] Closing commit body contains `Fixes THR-302` and links the verification evidence (raw test/typecheck/build output or a CI run).

---

## 6. NFP compliance summary

| NFP | Verdict | Note |
|-----|---------|------|
| 1 — Tunability | PASS (N/A) | No tunables introduced. |
| 2 — Inspectability | PASS | Type-narrowing improves callsite legibility; no traces touched. |
| 3 — Determinism | PASS (N/A) | Compile-time refactor; runtime byte-identical. |
| 4 — Fail-soft | PASS (N/A) | No new failure modes; tests gate the refactor. |
| 5 — Narrative over mechanical perfection | PASS (N/A) | No narrative surfaces touched. |
| 6 — Additive over destructive | **PARTIAL — by design.** | Destructive type deletion is the point. The deprecation has been live long enough; the structural-overlap luck that keeps callers compiling is the bug. |
| 7 — Performance budget | PASS (N/A) | Zero runtime impact. |

NFP #6 is the audit-of-record exception; the entire ticket exists to perform a destructive cleanup that the audit explicitly approved as overdue.

---

## 7. Out of scope

- Encounter UI implementation (THR-301).
- The `encounter_template` graph node type and its `gates_to` / `spawns_from` / `enables` edges (THR-301 territory).
- The encounter authoring contract changes (THR-301 territory).
- Adding `narrativeLayer` values beyond `'encounter'` (e.g. retiring or renaming `'land'` / `'soul'`).
- Decomposing `unified-action-templates.ts` (4000-line file). Out-of-scope hygiene.
