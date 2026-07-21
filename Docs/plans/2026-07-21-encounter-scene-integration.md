> **title:** `Encounter Scene Integration — target & cast as first-class prose and aftermath subjects`
> **linear_issue:** Multi-slice — six execution issues created at handoff (Slices A–F below); issue ids recorded in each slice's handoff comment
> **author:** `Claude Code (Fable design session)`
> **created:** 2026-07-21
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# Encounter Scene Integration — Slices A–F

*Encounters already run against real world objects (a target agent or location, and — for branching encounters — a bound cast); this plan makes those objects nameable in prose, touchable in aftermath, and carryable across seeded follow-ups.*

## Substrate inventory

**This plan extends and activates existing substrate. Nothing here is green-field.** Grep evidence gathered 2026-07-21:

| Substrate | State today | This plan |
|---|---|---|
| Support bundle (`src/engine/encounterSupportBundle.ts`, `supportBundle` on `UnifiedActionTemplate`) | **ACTIVE** — reuse-first bind + lazy materialization, live in `phaseAgentDecision.ts:931`; bindings persist on `UnifiedAction.supportBindings`; consumed by clearance gates, chapter archive, encounter-stage linker. Adopted by 24 of ~260 templates (23 branching + `cg.quest.gate_duty`). | **Extends** — cast placeholders (Slice C), `$cast:` aftermath sentinels (B), default bundles for the linear tier (E), binding inheritance through seeds (D). |
| Prose enrichment (`src/engine/proseEnrichment.ts`, `enrichProse` / `gatherNarrativeContext`) | **ACTIVE** — ~2,838 identity placeholders + 477 conditional blocks across the linear families. `NarrativeContext` is 100% actor-anchored: no `{target:*}`, no `{cast:*}`. | **Extends** — optional `target` and `cast` context blocks + new placeholder families (A, C). |
| Action targeting | **ACTIVE** — every `UnifiedAction` carries a real `targetId` (agent or location): `phaseAgentDecision.ts:969` (`sel.entry.targetAgentId ?? sel.entry.locationId`). | **Consumed** by A and B; no change to targeting itself. |
| Encounter seeding (`src/engine/encounterSeeding.ts`) | **PARTIAL** — `templateId` seeds spawn real encounters; `encounterFamily` seeds are a v1 stub ("emit a narrative event, don't auto-spawn"). 86 of 186 authored seeds are family-only → advisory theater. Seeded actions are self-targeting (`targetId: seed.targetAgentId`). | **Activates** family matching (D1); **extends** seeds with context inheritance (D2). |
| Aftermath target resolution (`src/engine/encounterAftermath.ts:184–197`) | **ACTIVE but literal** — `targetAgentId` used as a raw node id. `$target`/`$primary` sentinels exist only for the three reach-signature effects (`bindReachSignatureTargets`, THR-555). `role:` prefix is **documented in the wiring guide and used in 3 example files but has no resolver anywhere in `src/engine/`** (grep: 0 hits for `'role:'` parsing). | **Generalizes** the THR-555 bind pass to all effects (B); implements `role:`/`$cast:` against support bindings (B). |
| Bond edges (`relates_to`, `getAgentBonds` in `graphQueries.ts:143`) | **ACTIVE** — sentiment/trust properties read by enrichment (allies/rivals), the `alone`/`outnumbered` predicates, and social systems. **No authored aftermath effect can create or move one** — `social.forge_alliance` succeeds without creating any edge between the two agents. | **Extends** — new `bond_change` aftermath effect kind (B). |
| Narrative linker (`src/components/Game/encounter-stage/narrativeLinker.ts`) | **ACTIVE** — auto-links entity names by literal name-scan against bound cast; branching encounters hardcode cast names in prose (93 `Maren|Dalla|Torve` hits in `flawed-steel.ts`) to make this work. | **Benefits** from C without structural change: once prose renders bound names via `{cast:*}`, the name-scan matches the real entity. |
| Systems inventory check | `npm run generate-systems-inventory` output greped for *scene*, *cast*, *target placeholder*, *bond effect*, *family seed* — 0 hits for any as a distinct subsystem; all touched systems named above already carry ACTIVE badges. | No duplicate system is being green-fielded. |

## Why this is load-bearing

The 2026-04-03 gate-duty packet (`Docs/plans/2026-04-03-encounter-packet-cg-gate-duty.md`) set the bar: an encounter's cast, places, and consequences should be "real enough that the world can generate and remember them." The support-bundle engine shipped and works — but adoption stalled at the branching tier, and the prose/aftermath layers were never connected to it. The result, verified across the full content library on 2026-07-21: encounters bind real world objects and then talk about them as "the other party," "the courier," "the captain"; alliances form without creating a bond edge; half the planted seeds never bloom; follow-ups star anonymous strangers instead of the person the story was about. Christian's observation ("encounters don't seem very dynamic or integrated into the world") traces to exactly this seam. Every downstream content initiative — Social Systems Expansion, Encounter Format Migration quality goals, the three-beat loop — pays rent on this gap until it closes.

## The unifying principle

**The scene is a first-class subject.** An encounter's scene — its target (who/what it is with), its cast (the support-bundle bindings), and its place — must be as referenceable as its actor, in all three consumption layers: prose (placeholders), aftermath (effect targeting), and continuity (seed inheritance).

## Slice map

| Slice | Title | Surface | Depends on |
|---|---|---|---|
| **A** | `{target:*}` enrichment placeholders | `proseEnrichment.ts` + encounter-path context callers | — |
| **B** | Aftermath scene-targeting: general `$target` / `$cast:` sentinels + `bond_change` effect + `role:` resolution | `encounterAftermath.ts`, `types/unifiedAction.ts` | — (parallel with A) |
| **C** | `{cast:*}` placeholders + gate-duty pilot rewrite | `proseEnrichment.ts`, `civic-guard-encounter-content.ts` | A (same file surface) |
| **D** | Seed system v2: family matching + context inheritance | `encounterSeeding.ts`, seed-planting site in `encounterAftermath.ts`, `types/unifiedAction.ts` | B (aftermath file overlap) |
| **E** | Family default support bundles for the linear tier | new `src/data/default-support-bundles.ts`, registry merge | C (prose payoff), parallel-safe at engine level |
| **F** | Linear-tier content sweep: social + tavern + borderland | 3 content files + wiring-guide examples | A, B, C |

---

## Engine pillar

### Systems design

**Slice A — target context.** `NarrativeContext` gains an optional block:

```ts
target?: {
  id: string;
  kind: 'agent' | 'location';
  name: string;
  pronouns?: { they: string; them: string; their: string; s: string }; // agent-kind only
  factionName?: string;                                                // agent-kind only
  relation?: 'ally' | 'rival' | 'stranger';                            // from actor→target relates_to sentiment
}
```

`gatherNarrativeContext` gains an optional trailing options object: `opts?: { targetId?: string; action?: UnifiedAction }`. When `targetId` resolves to a node, the block is populated; `relation` classifies via the existing `ALLY_SENTIMENT_THRESHOLD` / `ENEMY_SENTIMENT_THRESHOLD` constants (`src/data/effect-constants.ts`) — same thresholds as the `alone`/`outnumbered` classifier, no new tunables. When `targetId === agentId` (self-targeted actions) the block is **omitted** so `{target}` falls back — a self-targeted encounter has no "other party."

New replacements in `enrichProse` (same regex-block idiom as existing):

| Placeholder | Resolves to | Fallback (block absent) |
|---|---|---|
| `{target}` | target name | `the other party` |
| `{target:they}/{target:them}/{target:their}/{target:s}` (+ capitalized) | target pronouns | `they/them/their/s` |
| `{target:faction}` | target's faction name | `their people` |
| `{?target_is_ally}…{/target_is_ally}` | kept iff `relation === 'ally'` | removed |
| `{?target_is_rival}…{/target_is_rival}` | kept iff `relation === 'rival'` | removed |
| `{?target_is_stranger}…{/target_is_stranger}` | kept iff `relation === 'stranger'` | removed |
| `{?has_target}…{/has_target}` / `{?no_target}…{/no_target}` | presence conditional pair | standard inverse behavior |

Location-kind targets resolve `{target}` only; pronoun/faction/relation tokens use their fallbacks.

**Slice B — aftermath scene sentinels + `bond_change`.**

1. **General sentinel bind pass.** Promote the THR-555 pattern into `bindAftermathSceneTargets(effects, action)` running at the top of aftermath dispatch for *every* reaction: any effect field in {`targetAgentId`, `targetFactionId`, `targetSublocationId`, `withAgentId`} whose value is `'$target'` rebinds to `action.targetId` **iff the resolved node kind matches the field** (an agent field pointed at a location leaves the sentinel — the effect then no-ops down the existing invalid-target path). Value `'$cast:<key>'` (and legacy alias `'role:<key>'`) rebinds via `action.supportBindings` key lookup. `bindReachSignatureTargets` remains for `$primary` and the three signature kinds; the new pass subsumes their `$target` handling — keep both passes composing, signature pass first, to avoid behavior change.
2. **New effect kind** in the `EncounterAftermathReactionEffect` union:

```ts
{
  kind: 'bond_change';
  withAgentId: string;            // literal id, '$target', or '$cast:<key>'
  sentimentDelta: number;         // clamped result ∈ [-1, 1]
  trustDelta?: number;            // clamped result ∈ [0, 1]
  reciprocal?: boolean;           // default true — mirror onto the reverse edge
  when?: EffectPredicate;         // standard gate, free
}
```

Resolution: find the actor→with `relates_to` edge (create with `BOND_CREATE_INITIAL_SENTIMENT`/`BOND_CREATE_INITIAL_TRUST` if missing), apply deltas, clamp; `reciprocal` repeats on the reverse edge. Non-agent resolution target → fail-soft no-op + trace. Mutation calls `touchWorld()` (bonds feed UI selectors and the alone/outnumbered predicates).
3. **`role:` disposition.** Implemented as an alias of `$cast:` (the three `src/data/encounters/examples/` files become genuinely functional). The wiring guide's Part 5 multi-target note is rewritten to document the sentinel vocabulary as the one idiom.

**Slice D — seed system v2.**

1. **Family matching (activates the v1 stub).** In `evaluateEncounterSeeds`, a family-only seed now draws from the registered template pool: candidates = unified templates whose `id` starts with `` `${family}.` `` (the same prefix convention THR-112 hidden-mark `revealFamilies` already uses), filtered by (a) template exists & is agent-performable (`actorAffinities` includes `'individual'`), (b) target agent's current location subtype ∈ `locationSubtypes` (templates with no `locationSubtypes` restriction always pass), (c) agent not busy (existing check). Candidate scan capped at `FAMILY_SEED_MAX_CANDIDATES`; selection is one seeded `rng()` draw over the eligible list (rng already threaded into `evaluateEncounterSeeds`). No eligible candidate → existing withered fail-soft path, unchanged.
2. **Context inheritance.** `PendingEncounterSeed` gains `inheritedTargetId?: string` and `inheritedBindings?: readonly EncounterSupportBinding[]`. The `encounter_seed` *effect* gains `inheritContext?: boolean` (default false — opt-in, additive). When true, the planting site in `encounterAftermath.ts` copies `action.targetId` and `action.supportBindings` onto the seed. At spawn, `evaluateEncounterSeeds` sets the spawned action's `targetId = seed.inheritedTargetId ?? seed.targetAgentId` (today's self-target remains the fallback) and re-validates inherited bindings against the live graph (`graph.getNode` per binding; dead nodes dropped, drop count traced). Inherited bindings flow into the same `supportBindings` slot, so Slice A/C placeholders and Slice B sentinels work in the follow-up unchanged — **the same people return**.

**Slice E — family default support bundles.** New data module `src/data/default-support-bundles.ts`: `DEFAULT_FAMILY_SUPPORT_BUNDLES: Record<familyPrefix, EncounterSupportBundle>` for the linear families (initial set: `tavern`, `social`, and the ten guild families; borderland deliberately excluded v1 — wilderness encounters have no settlement cast to bind). All default specs are `delivery: 'pre-seeded'` with `reuseNpcRoles` — under `prepareEncounterSupportBundle` semantics, **pre-seeded specs bind existing NPCs or stay unresolved; they never materialize** (`allowMaterializePreseeded` stays a debug-path-only option). Defaults therefore add zero world population; they only attach the world's existing keeper/officer/witness to the scene when one is present. Application: a pure `withDefaultSupportBundle(template)` merge applied where the registry assembles unified templates — template-declared `supportBundle` always wins outright (no per-key merge); cap `DEFAULT_BUNDLE_MAX_SPECS` per template.

### Graph nodes / edges

**No new node types. No new edge types.** (Load-bearing rule respected.) `bond_change` mutates the existing `relates_to` edge type's existing `sentiment`/`trust` properties and may create instances of it — creation of *instances* of an existing edge type, not a new type. Support-bundle materialization behavior is unchanged (Slice E's defaults are bind-only).

### Tick phases

No new phases, no reordering. Touched phase surfaces: Phase 2b agent decision (already calls `prepareEncounterSupportBundle`; Slice E only changes which template object it sees), Phase 2a.8 encounter seeding (Slice D, inside the existing `evaluateEncounterSeeds` call), aftermath application (event-driven from GameView/resolution, not a phase; Slice B). Enrichment (A/C) runs at prose-generation time in the UI adapters and resolution paths — never per-tick.

### Resolution logic

Unchanged. No changes to step resolution, difficulty, capability, or the outcome ladder. Family-seed selection (D1) is the only new selection logic; it is a flat seeded draw over an eligibility-filtered list — deliberately not scored (v2 keeps the surface minimal; scoring can layer on later if repetition shows up).

### PRNG callouts

- D1 family draw: one `rng()` call from the rng already passed to `evaluateEncounterSeeds` — seeded, deterministic. **No `Math.random()` anywhere in this plan.**
- A/B/C/E: no randomness (pure resolution against graph state).

## Content pillar

### Encounter templates

- **Slice C pilot:** `cg.quest.gate_duty` prose rewritten against its own bundle — `{cast:suspect_courier}`, `{cast:gate_captain}`, `{cast:checkpoint_witness}` replace "the courier" / "the captain" / generic witnesses. This is the proof template; the branching-tier sweep (retiring hardcoded Maren-style names) is **explicitly deferred** to a follow-up sized after the pilot lands.
- **Slice F sweep (scope-capped to 3 files):** `social-encounter-content.ts`, `tavern-encounter-content.ts`, `borderland-encounter-content.ts` — generic scene nouns → `{target:*}` (and `{cast:*}` where Slice E defaults supply a cast); relationship-shaped outcomes gain `bond_change` (e.g. `social.forge_alliance` success **creates the alliance edge it narrates** — sentiment +, trust +; `social.deceive`/`social.rob` failure branches go negative); continuity-shaped seeds gain `inheritContext: true` (the forge-alliance "ally calls in a favor" seed finally stars the ally).
- Aftermath `label`/`intent` strings in swept reactions may use `{target}` — they run through the same enrichment path.

### Prose tables

No new prose tables. New placeholder vocabulary documented in the systemic wiring guide Capability 1 table (A, C) — same doc section that already owns the placeholder inventory. Register model unaffected: placeholders are register-neutral; swept prose keeps its existing register declarations.

### Attachment content

N/A — no attachment templates touched; reward pools unchanged.

### Data tables

- `src/data/default-support-bundles.ts` (Slice E — new).
- New constants in `src/data/agent-behavior-constants.ts` / `effect-constants.ts` per the constants table.
- Wiring-guide updates (B, D, E sections) and `Docs/plans/wiring-checklist.md` row additions ride the slice that ships them.

## UI pillar

*Screenshot tool: **Playwright (DOM)** — encounter stage, aftermath panel, and ChapterLedger are DOM surfaces; no WebGL touched.*

### Player-facing display

- **Encounter stage prose** now names the target and cast (A/C/F) — rendered through the existing `EncounterStage` narrative paragraphs; **no component changes required** for the text itself.
- **Entity links:** `narrativeLinker.autoLinkNarrative` already scans prose for bound-cast names; once `{cast:*}` renders the *bound* entity's real name, links and tooltips attach to the correct world entity automatically — including reused NPCs, which today mismatch (prose says the authored `spawnName`, binding points at the reused NPC). Slice C adds the target to the link-entry set (`collectSupportBundleEntities` gains a target entry built from `action.targetId`) so the named target is clickable like cast members — Rule 4, "every primitive is clickable."
- **Design-system conformance (required):** no new visual components, tokens, or styles; link/tooltip rendering reuses the existing `EncounterStageNarrativeReference` presentation exactly as-is. Any executor tempted to style new link states must load `frontend-ui` + `Docs/design-system/` first.

### Event notifications

- `bond_change` emits no toast of its own (aftermath reactions already narrate their outcome); it appends nothing to `recentEvents` beyond what the hosting reaction already does. Deliberate: avoid double-narration.
- Family-seed spawns reuse the existing "A planted thread bears fruit" TickEvent (D) with the matched template name appended.

### Debug inspection (DebugPanel)

- `window.__DEBUG.inspectSceneContext(agentRef)` (Slice A carries it): returns `{ actionId, templateId, targetId, targetName, targetKind, relation, bindings: [{key, nodeId, name, reused}] }` for the agent's active unified action, or `{ error }`. This is the DoD state-assertion hook for every slice.
- Existing trace tab picks up the new trace categories (see Tracing).

### Visual presence (HexMapV2)

N/A — no hex-map surface in scope. (Bond edges have no map rendering today; adding one is out of scope and untracked here.)

## Wiring

> See checklist: Docs/plans/wiring-checklist.md — rows to add: `bond_change` effect kind; `{target:*}`/`{cast:*}` placeholder families; seed `inheritContext`; `__DEBUG.inspectSceneContext`.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `proseEnrichment.ts` target/cast blocks (A/C) | n/a — prose-generation time | `EncounterStage` via `buildUnifiedEncounterStageModel` | reads `unifiedActions[].targetId/supportBindings` | none per-call (see Tracing rationale) | `__DEBUG.inspectSceneContext` |
| `encounterAftermath.ts` sentinel pass + `bond_change` (B) | aftermath application (event-driven) | AftermathPanel (existing) | mutates `relates_to` edges; `touchWorld()` | `aftermath_sentinel_bound`, `bond_change_applied` | Trace tab |
| `encounterSeeding.ts` family match + inheritance (D) | Phase 2a.8 | n/a | `pendingEncounterSeeds[]` (2 new optional fields) | `encounter_seed_family_matched`, `seed_context_inherited` | Trace tab + existing seed traces |
| `default-support-bundles.ts` + registry merge (E) | Phase 2b (via existing bundle prep) | ChapterLedger participants (existing) | `unifiedActions[].supportBindings` | existing bundle path | ChapterLedger + `inspectSceneContext` |
| Content sweep (F) | n/a | EncounterStage | n/a | n/a | Prose QA report (`__DEBUG.proseQualityReport`) |

Prose pipeline: A/C/F run through `enrichProse()` — yes, by construction. Player controls: none added.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `FAMILY_SEED_MAX_CANDIDATES` | `12` | Cap on eligible templates a family seed scans before the draw (perf + repetition bound) |
| `BOND_CREATE_INITIAL_SENTIMENT` | `0` | Starting sentiment when `bond_change` must create a missing `relates_to` edge |
| `BOND_CREATE_INITIAL_TRUST` | `0` | Starting trust on a created edge |
| `DEFAULT_BUNDLE_MAX_SPECS` | `3` | Cap on default-bundle specs merged onto a linear template |
| `CAST_CONTEXT_MAX_MEMBERS` | `6` | Cap on cast entries injected into `NarrativeContext` (enrichment perf) |
| (reused) `ALLY_SENTIMENT_THRESHOLD` / `ENEMY_SENTIMENT_THRESHOLD` | `±0.35` | Target `relation` classification — same constants as the co-location classifier; deliberately **not** duplicated |

## Tracing

```ts
// aftermath_sentinel_bound — emitted when a $target/$cast:/role: sentinel rebinds (B)
interface AftermathSentinelBoundTrace {
  type: 'aftermath_sentinel_bound';
  actionId: string; effectKind: string;
  sentinel: string;            // '$target' | '$cast:<key>' | 'role:<key>'
  resolvedNodeId: string | null; // null = unresolvable, effect will no-op
}

// bond_change_applied — emitted per applied bond mutation (B)
interface BondChangeAppliedTrace {
  type: 'bond_change_applied';
  actorId: string; withAgentId: string;
  sentimentBefore: number; sentimentAfter: number;
  created: boolean; reciprocal: boolean;
}

// encounter_seed_family_matched — family seed resolved to a concrete template (D)
interface SeedFamilyMatchedTrace {
  type: 'encounter_seed_family_matched';
  seedId: string; family: string;
  candidateCount: number; resolvedTemplateId: string;
}

// seed_context_inherited — inherited scene context attached at spawn (D)
interface SeedContextInheritedTrace {
  type: 'seed_context_inherited';
  seedId: string; inheritedTargetId: string | null;
  bindingCount: number; droppedBindingCount: number;
}
```

**Deliberate non-trace:** target/cast placeholder resolution emits nothing per `enrichProse` call. Enrichment runs constantly across UI renders; per-call traces would flood the 2000-entry ring buffer (per-agent-burst lesson). Inspectability is served by `__DEBUG.inspectSceneContext` instead. (The `intelligence_referenced` trace is unaffected — it measures *consumption*, fires only on token presence, and stays as-is.)

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `targetId` missing / node deleted / self-targeted | `target` block omitted; `{target:*}` render documented fallbacks ("the other party", neutral pronouns); conditionals resolve as no-target |
| Location-kind target hit by pronoun/faction/relation tokens | Generic fallbacks; no crash, no empty string mid-sentence |
| `$cast:<key>` / `role:<key>` with no matching binding | Sentinel left in place → existing invalid-target path skips the effect; `aftermath_sentinel_bound` traces `resolvedNodeId: null` |
| `$target` sentinel on a field whose kind ≠ target's kind | Sentinel left; effect no-ops (same path as above) |
| `bond_change` resolved to non-agent node | No-op + trace; reaction's other effects unaffected |
| Family seed: no eligible template | Existing withered narrative event; seed removed (unchanged v1 behavior) |
| Inherited binding node dead at spawn | Binding dropped, `droppedBindingCount` traced; spawn proceeds with survivors |
| Inherited target dead at spawn | `inheritedTargetId` ignored → self-target fallback (today's behavior) |
| Default-bundle spec finds no reusable NPC at location | Spec stays unresolved (pre-seeded never materializes); `{cast:*}` falls back to the spec's `spawnName`/`fallbackName` carried into context |
| `{cast:<key>}` where template declares no such key | Token stripped + one dev-mode `console.warn` (authoring error, not runtime state) |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/unifiedAction.ts` | 278 importers | All changes are **additive optional fields** (2 on `PendingEncounterSeed`, `inheritContext` on the seed effect, one new union member `bond_change`). Union extension surfaces in the `encounterAftermath.ts` effect switch (exhaustiveness) — one new case, no existing case touched. No field removals or renames; downstream importers compile unchanged. Verify with `tsc -b --force` net-new diff (THR-489 baseline discipline). |

No other file in scope is on the ≥100-importer list (`proseEnrichment.ts`, `encounterSeeding.ts`, `encounterAftermath.ts`, `encounterSupportBundle.ts`, `types/encounter.ts` are all below it).

## Three-pillar check

- [x] Engine pillar present (Slices A–E)
- [x] Content pillar present (Slice C pilot + Slice F sweep; attachment content N/A with rationale)
- [x] UI pillar present (linker/target links, `__DEBUG` surface, notifications rationale; HexMapV2 N/A with rationale)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise — it *services* two: the living-world premise (the world's existing people star in encounters, and remember them via bond edges) and Rule 4 of the encounter experience design (every primitive is clickable — targets become clickable references). Player-as-god framing untouched: all changes are about *mortal↔mortal* scene fidelity; god verbs and intervention framing are unchanged.
- [x] No Vision edit required.

## Rulebook impact

- [x] This plan does not change a rule of play. Turn structure, action verbs, prerequisites, resources, resolution, clocks, win/loss: unchanged. Family seeds finally *doing what the wiring guide already documents* is an implementation-completion, not a rule change; `bond_change` is a new aftermath effect kind (authoring vocabulary, not a player-facing rule). The full rulebook's encounter section needs no re-verdict; the **systemic wiring guide** (authoring canon) is updated per-slice instead.

> Brainstorm companion: `Docs/plans/2026-07-21-encounter-scene-integration-brainstorm.md` (written alongside, same pass).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | 5 new named constants + 2 deliberate reuses; zero magic numbers in logic |
| 2. Inspectability | PASS with note | 4 new trace types + `__DEBUG.inspectSceneContext`; enrichment deliberately un-traced per-call (ring-buffer volume), rationale recorded above |
| 3. Determinism | PASS | One new seeded `rng()` draw (family match) on the already-threaded rng; everything else pure graph resolution |
| 4. Fail-soft | PASS | 11-row fail-soft table; every sentinel/lookup miss degrades to today's behavior, never throws |
| 5. Narrative over mechanical perfection | PASS | The entire plan is narrative-serving: names over nouns, recurring characters over strangers, bonds that exist because the story said so |
| 6. Additive over destructive | PASS | Optional fields, new union member, new placeholders with silent fallbacks; no removals; un-migrated content renders identically to today |
| 7. Performance budget | PASS with note | Enrichment adds O(1) graph lookups per prose render (target node + ≤6 cast nodes); family match capped at `FAMILY_SEED_MAX_CANDIDATES` per eligible seed per tick; no per-tick scans added. Profile only if seed volume grows |

## Done when

*Per-slice Done-whens live in each slice's Linear issue. Plan-level:*

- [ ] All six slices merged; each closing commit body includes its `Fixes THR-XX` and verification evidence (npm test + vite build raw output or green CI link; types via `tsc -b --force` net-new diff)
- [ ] `cg.quest.gate_duty` renders bound-cast names in the browser (Playwright screenshot at 1920×1080, encounter stage open)
- [ ] `social.forge_alliance` success provably creates/raises a `relates_to` edge (`__DEBUG` assertion in closing comment)
- [ ] A family-only seed provably spawns a real encounter in a 30-tick CLI run (engine smoke evidence)
- [ ] Systemic wiring guide + wiring checklist updated in the same PRs as the code they document

## Coordination block

**Suggested model:** opus — cross-cutting engine seams with a 278-importer type file in scope; per-slice blocks in the issue comments refine this.

**Parallel-safe with:** anything not touching `src/engine/proseEnrichment.ts`, `encounterAftermath.ts`, `encounterSeeding.ts`, or the three swept content files. Slice-level parallelism: A ∥ B; C after A; D after B; E after C; F after A+B+C.

**Mutex with:** THR-609 residual register passes **only if** they touch the three Slice-F content files concurrently; otherwise disjoint.

**Files to touch:**
- Create: `src/data/default-support-bundles.ts` (E)
- Edit: `src/engine/proseEnrichment.ts` (A, C) · `src/engine/encounterAftermath.ts` (B, D-planting) · `src/engine/encounterSeeding.ts` (D) · `src/types/unifiedAction.ts` (B, D — additive) · `src/types/encounter.ts` (C — cast context type, if not colocated) · `src/engine/debug-bridge` surface (A) · `src/components/Game/encounter-stage/narrativeLinker.ts` + `buildUnifiedEncounterStageModel.ts` (C — target link entry) · `src/data/civic-guard-encounter-content.ts` (C pilot) · `src/data/{social,tavern,borderland}-encounter-content.ts` (F) · `Docs/plans/2026-04-16-systemic-wiring-guide.md` (B, C, D, E sections) · `Docs/plans/wiring-checklist.md`

## Notes for the executor

- **Do not** add a `{target}` fallback that names a random co-located agent — absence must read as absence ("the other party"), never invent a referent.
- **Do not** make Slice E defaults `lazy-materialize` — bind-only is the design decision; materializing defaults would inflate world population template-by-template.
- The `encounterFamily` prefix convention is *id-prefix-before-first-dot*, matching THR-112 `revealFamilies`. Do not introduce a separate family registry.
- Slice F is scope-capped at three files. The ten guild-family files and the branching-tier hardcoded-name retirement are follow-ups, deliberately not in this plan.
- `spawn encounter-context` CLI and `__DEBUG.fireAction` paths create actions too — verify they flow through the same bundle/target plumbing (they call the same lifecycle helpers; confirm, don't assume).
- Existing tests to extend, not replace: `unifiedAdapterProseEnrichment.test.ts` (A/C), `encounterAftermath.test.ts` (B), `encounterSupportBundle.test.ts` (E), plus the gate-duty progression suites (C pilot must keep them green).

## Intent-judge verdict

*Recorded 2026-07-21 — cold-context Opus subagent per Step 8.5.*

**Verdict: Allow.** 0 GAPs, 0 VIOLATIONs across all 11 dimensions; impact class confirmed Reversible. The judge sample-verified eight substrate-inventory claims against source (supportBindings on `UnifiedAction`, the family-seed v1 stub, the absent `role:` resolver, `getAgentBonds`, the THR-555 three-effect sentinel scope, the actor-only `NarrativeContext`, the edge-less `forge_alliance`, the reused ±0.35 thresholds) — all held. Full verdict in session transcript; proposal at `Docs/plans/.intent-proposals/2026-07-21-encounter-scene-integration.md`.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-07-21*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Constants table: 5 new named constants + 2 explicit reuses (`ALLY_SENTIMENT_THRESHOLD`/`ENEMY_SENTIMENT_THRESHOLD`); no unnamed magic numbers found in logic |
| 2. Inspectability | PASS-with-note | 4 new trace types + `__DEBUG.inspectSceneContext`; per-call enrichment deliberately untraced — ring-buffer volume rationale stated explicitly, alternate inspection path provided |
| 3. Determinism | PASS | One seeded `rng()` draw (family match, D1) on the already-threaded rng; all else pure graph resolution; plan states "No `Math.random()` anywhere in this plan" |
| 4. Fail-soft | PASS | 11-row fail-soft table; every listed miss degrades to existing behavior, none throws; the one tick-phase-touching piece (D1 seed matching) is covered |
| 5. Narrative over mechanical | PASS | Executor notes explicitly forbid inventing a random co-located referent for a missing `{target}` — absence must read as absence, never invented |
| 6. Additive over destructive | PASS | "No new node types. No new edge types."; Blast Radius confirms additive-only optional fields + one new union member on the 278-importer file; no removals/renames |
| 7. Performance budget | PASS-with-note | O(1) lookups per prose render (target + ≤6 cast); family-match scan capped (`FAMILY_SEED_MAX_CANDIDATES`); no new per-tick scans added; profiling explicitly deferred until seed volume grows |

NFP AUDIT: PASS-with-notes (see rows above) `[design-brief-stale]`

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Systems design, graph nodes/edges, tick phases, resolution logic, PRNG callouts all filled with concrete file/line citations across Slices A/B/D/E |
| Content | present-and-substantive | Encounter templates (C pilot + F sweep), prose tables, data tables filled; attachment content marked N/A with one-line rationale |
| UI | present-and-substantive | Player-facing display, event notifications, debug inspection (`__DEBUG.inspectSceneContext`), visual presence (HexMapV2 N/A with rationale) all filled |

**Missing-required-sections:** No missing required sections. Every template section is present, including the conditional Blast Radius section (justified: `types/unifiedAction.ts`, 278 importers).

**Wiring section check:** Yes — the Wiring table maps each of the five touched modules to orchestrator phase, UI component, GameState field, trace emitted, and debug visibility.

**Substrate-existence check:** PASS. The plan opens with a `## Substrate inventory` section citing exact files/line numbers, classifying each substrate as ACTIVE/PARTIAL, and framing the plan as extends/activates throughout. Cross-checked against `Docs/canon/systems-inventory.md`: the touched domain is "Encounters & Dilemmas" (ACTIVE; tick phase `2a.8` matches the plan's cited seed-evaluation phase exactly). No premise noun matches an inventory subsystem as a distinct system. No green-field collision found.

**PILLAR AUDIT: PASS**

### Vision audit

**Premises touched:** `00-north-star.md` → "mortal has to feel like a person, not a unit... weight of threads" — **extended** (named target/cast, bond edges, seed-context inheritance so "the same people return"). `01-core-loop.md` → "aftermath exists so consequences compound" — **extended** (`bond_change` compounds onto the graph, not just narration). `02-non-negotiables.md` → #1 god-not-protagonist **confirmed**; #3 mechanics surface through prose, never numbers **confirmed** (`relation` is a prose category; raw sentiment stays hidden); #4 everything is a graph edge **confirmed**; #6 additive **confirmed**. `03-design-tensions.md` → tension 2 (emergence vs. authored) — **extended**, directly fixes the doc's own named drift signal ("the agent did the thing" → named specificity).

**Contradictions:** No contradictions found. Soft note: Slice D activates 86 previously-inert family seeds into real spawns — worth watching against `01-core-loop.md`'s "no drumbeat of unbidden encounters" guard, though these are pre-planted threads blooming, not new unbidden volume.

**Qualitative checks:** North star — yes, directly strengthens "mortal as person"/"weight of threads." Core loop — scan→encounter→aftermath order untouched. Non-negotiables — inside all checked. Design tensions — corrects the named drift signal; no over-rotation. Taste profile — file absent from repo; not assessable.

**VISION AUDIT: PASS** `[taste-profile-missing]`
