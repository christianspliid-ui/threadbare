# Wiring Guide Correction Pass — THR-118

**Date:** 2026-04-18
**Issue:** THR-118 — Phase 0: Systemic wiring guide correction pass
**File to correct:** `Docs/plans/2026-04-16-systemic-wiring-guide.md`
**Parent design doc:** `Docs/plans/2026-04-16-encounter-template-migration.md`
**Phase 0 dependencies (all Done):** THR-110, THR-111, THR-114, THR-115, THR-117
**Sibling in flight (not a blocker):** THR-116 (Group D — causation/conditional). Traces for THR-116 already exist in `TRACE_CATEGORIES` — this plan can reference them. If Group D surfaces new authored effect kinds or a `when` DSL after this lands, spawn a thin follow-up under the same project.

---

## Why this is a correction pass, not a rewrite

The wiring guide has been updated incrementally as Phase 0 engine work landed — THR-86 (routine enrichment), THR-112 (mark reveal loop), THR-113 (intel consumption), THR-114 (multi-target), THR-115 (world-shaping), THR-117 (condition-wound). What **hasn't** been done is a reconciling pass that:

1. Corrects residual overstatements and stale framing introduced before those issues landed.
2. Gives authors a "how to verify this capability" pointer per section so they can trust the claims.
3. Exposes the full current trace vocabulary so content agents know what DebugPanel surfaces prove their effects fired.
4. Fixes structural drift in the doc (Capability 9 appears before Capability 8).
5. Re-reviews downstream content skills that load this guide so overstatements don't survive at the edges.

The original THR-118 listed five corrections based on engine state at 2026-04-16. Three of them have been partially or fully addressed by later commits. This plan restates each correction with the current reality and narrows scope to what genuinely remains.

---

## Three pillars

**Engine:** N/A — no engine code changes. This is documentation alignment to engine state already shipped in THR-110/111/114/115/117 and surfaced in `src/types/trace.ts`, `src/engine/encounterAftermath.ts`, and `src/engine/buildUnifiedEncounterStageModel.ts`.

**Content:** Primary pillar. The wiring guide **is** the content authoring contract. Corrections here directly change what encounter-pipeline, attachment-pipeline, and prose-content-systems agents author. Also — re-review downstream content skills for inherited overstatement (see Correction 6 below).

**UI:** N/A for implementation, but the corrections repeatedly cite DebugPanel Trace tab as the verification surface. No UI code changes; DebugPanel already renders the new categories from THR-111.

---

## The six corrections

### Correction 1 — Line 38: Placeholder substitution claim (verify, don't rewrite)

**Current text (line 38):**
> "Every `narrative` field in steps and outcomes supports dynamic text substitution."

**Status after THR-110:** True. `buildUnifiedEncounterStageModel.ts` now runs `enrichProse()` on every narrative surface. The parity test `src/engine/__tests__/unifiedAdapterProseEnrichment.test.ts` locks this in.

**Action:** No text change needed, but add a "How to verify" line right after the placeholder table:

> **How to verify:** Run the DebugPanel Trace tab filtered on `narrative_generation`. Every step and outcome narrative you see in game should render with placeholders resolved — not as literal `{name}` / `{?has_faction}` text. The regression locks live in `src/engine/__tests__/unifiedAdapterProseEnrichment.test.ts`.

### Correction 2 — Line 180 & Line 676: "40 effect types" conflation

**Current text (line 180):**
> **From the effect system (40 effect types):**
>
> | Effect | What It Does |
> |---|---|
> | `GraphMutationEffect` | Direct CRUD ... |
> | `CreateStructureEffect` | Creates locations, sublocations ... |
> | `DestroyStructureEffect` | Razes structures |
> | `FactionManipulateEffect` | Shift relationships, transfer control, splinter, absorb, declare war, force peace |
> | `SpawnEffect` | Brings entities into existence |

**Current text (line 676):**
> **`attachment-pipeline`** — Attachments use the same effect system. The 40 effect types are the mechanical vocabulary.

**Problem:** The "40 effect types" figure conflates two distinct pools:
- **Aftermath effect kinds** — the typed effects authors put in `aftermathConfig.reactions[].effects` arrays. See the table at line 582–603 (`reputation_score`, `reputation_tally`, `reputation_set`, `encounter_seed`, `hidden_mark`, `intelligence`, `apply_condition`, `remove_condition`, `condition_attachment`, `clearance_gate_tag`, `recent_event`, `spawn_artifact`, `emit_omen`, `faction_splinter`, `faction_absorb`, `faction_dissolve`, `faction_declare_war`, `faction_force_peace` — **18 kinds** as of THR-117).
- **Attachment/spell effect primitives** — the category-level types (`GraphMutationEffect`, `CreateStructureEffect`, `DestroyStructureEffect`, `FactionManipulateEffect`, `SpawnEffect`, and others) used inside attachment and spell pipelines, not inside encounter aftermath.

**Action — rewrite both places:**

At line 180, replace the "40 effect types" framing with:

> **Engine-internal effect primitives (used in attachment / spell pipelines, NOT in encounter aftermath):**
>
> The attachment and spell systems compose effects from a category pool of ~40 primitive types. These are the mechanical vocabulary for authored **attachments** and **spells**, not for encounter aftermath. The table below lists category types, each of which has multiple concrete sub-variants.
>
> | Effect category | What It Does |
> |---|---|
> | `GraphMutationEffect` | Direct CRUD: `add_edge`, `remove_edge`, `set_property`, `remove_node` |
> | `CreateStructureEffect` | Creates locations, sublocations, landmarks, trade routes, barriers |
> | `DestroyStructureEffect` | Razes structures |
> | `FactionManipulateEffect` | Shift relationships, transfer control, splinter, absorb, declare war, force peace |
> | `SpawnEffect` | Brings entities into existence (agents, encounters, attachments, locations) |
>
> **For encounter aftermath authoring, use the typed aftermath effect kinds in Part 5 § "Aftermath Reaction Effect Types" (18 kinds).** Raw graph-mutation primitives are not exposed to authored aftermath — propose a new typed kind if you need one.

At line 676, rewrite the attachment-pipeline bullet:

> **`attachment-pipeline`** — Attachments compose behavior from the engine's effect primitive categories (`GraphMutationEffect`, `CreateStructureEffect`, `SpawnEffect`, etc.). These primitives are distinct from the 18 typed aftermath effect kinds — the attachment pool is authored at a lower level. See the attachment-pipeline skill for the full vocabulary.

**How to verify:** Grep `src/engine/encounterAftermath.ts::applyEncounterAftermathReaction` — the polymorphic switch on `effect.kind` enumerates the actual authoring surface. The count there is the source of truth, not "40".

### Correction 3 — Capability 5: reframe helpers as engine-internal, not authoring surface

**Current text (lines 166–190):** Capability 5 presents `createSublocation`, `createTradeRoute`, `claimControl`, `joinOrUpdateMembership`, `modifyLocationProperty`, `createRelationEdge`, `recordIntelligence` as "Available operations" under a section about what encounter authors can do. This is misleading — these are engine-internal utility functions. Authored aftermath doesn't call them directly.

**Problem:** Authors reading Capability 5 today will write aftermath reactions expecting to invoke `createSublocation`. There is no bridge. They'll hit it in review, waste time, and produce hardcoded prose instead.

**Action — rewrite the capability:** Reframe as "Graph Operations — Engine-Internal Helpers and the Authored Aftermath Surface That Wraps Them." Explicitly:

1. Move the existing `createSublocation` / `createTradeRoute` / `claimControl` / `joinOrUpdateMembership` / `modifyLocationProperty` / `createRelationEdge` / `recordIntelligence` table under a sub-heading titled **"Engine-internal helpers (not callable from authored aftermath)"** with a lead sentence:
   > "These helpers are used by engine code (tick phases, attachment pipeline, agent movement, encounter resolution). Authored encounter aftermath cannot invoke them directly. The list is here so you know what structural mutations the engine can perform, which in turn tells you what shape of outcome a new authored effect kind could produce if you propose one."

2. Add a new sub-heading **"Authored aftermath surface for graph mutation"** listing the typed effects that *are* callable from `aftermathConfig.reactions[].effects`:
   - `spawn_artifact` — creates artifact node + possesses/bonded_to/contains edges (THR-115)
   - `emit_omen` — appends to `GameState.emittedOmens`, drives encounter bias (THR-115)
   - `faction_splinter` / `faction_absorb` / `faction_dissolve` — faction topology surgery (THR-115)
   - `faction_declare_war` / `faction_force_peace` — faction sentiment edges (THR-115)
   - `intelligence` — writes `intelligenceRecords` on agent node (existing)
   - `apply_condition` / `remove_condition` / `condition_attachment` — condition edges + attachments (THR-114 / THR-117)
   - `hidden_mark` — discoverable secret on agent (existing)
   - `encounter_seed` — plants future encounter, creates `caused_by` edge once THR-116 lands

3. End with: **"If you need a structural mutation that no typed effect covers, propose a new aftermath effect kind — do not try to smuggle engine helpers into authored aftermath."**

**How to verify:** Grep `src/engine/encounterAftermath.ts` for the switch statement — every kind listed under "authored surface" must appear there. Any helper in the "engine-internal" sub-heading should NOT appear in that file's switch.

### Correction 4 — Capability numbering drift

**Current state:** Capabilities in the doc are ordered 1, 2, 3, 4, 5, 6, 7, 9, 8. Capability 9 (World-Shaping Effects, THR-115) is at line 265. Capability 8 (Complication System, THR-20) is at line 358. Capability 9 was inserted when THR-115 landed but placed before the existing Capability 8.

**Problem:** Doc readability. Content skills cite "Capability 5" etc. — numbering drift makes those references ambiguous.

**Action:** Reorder so Capability 8 (Complication System) precedes Capability 9 (World-Shaping Effects). No content change — just move the two sub-sections. Also update the "Capability N: ..." heading line on each if the numbers shift. Grep the doc and any content skill files for any `Capability <N>` cross-references; update them where needed.

### Correction 5 — Add the trace category reference section

**Current state:** The guide mentions trace categories in passing (e.g. "emits `hidden_mark_revealed` trace") but never lists them as a vocabulary authors can filter DebugPanel on.

**Problem:** Authors are told to verify their effects via traces, but don't know the full vocabulary. `src/types/trace.ts` lists ~80 categories — many of them directly relevant to content (`encounter_aftermath_applied`, `encounter_seed_planted`, `hidden_mark_placed`, `intelligence_granted`, `artifact_spawned`, `omen_emitted`, `faction_splintered`, `causation_edge_created`, `aftermath_effect_skipped_by_when`, `thread_mutation_applied`, etc.).

**Action — add a new sub-section at the end of Part 5 titled "Trace Categories You Can Filter On"** with a grouped table:

> Content authoring often needs to verify "did my effect actually fire?" DebugPanel's Trace tab filters on any of the categories below. Group them by what they prove:
>
> | Verifies... | Categories |
> |---|---|
> | Prose enrichment works | `narrative_generation`, `intelligence_referenced` |
> | Aftermath fired | `encounter_aftermath_applied`, `encounter_aftermath_effect` |
> | Seeds planted and triggered | `encounter_seed_planted`, `encounter_seed_triggered`, `causation_edge_created` (THR-116) |
> | Hidden marks placed, revealed, or decayed | `hidden_mark_placed`, `hidden_mark_revealed` |
> | Intelligence granted, consumed, referenced | `intelligence_granted`, `intelligence_referenced` |
> | Multi-target aftermath (THR-114) | `aftermath_target_resolved`, `aftermath_target_invalid`, `faction_reputation_changed`, `reputation_set_applied`, `condition_applied`, `condition_removed` |
> | World-shaping aftermath (THR-115) | `artifact_spawned`, `omen_emitted`, `omen_decayed`, `faction_splintered`, `faction_absorbed`, `faction_dissolved`, `faction_war_declared`, `faction_peace_forced` |
> | Conditional / causation effects (THR-116) | `aftermath_effect_skipped_by_when`, `aftermath_effect_when_passed`, `thread_mutation_applied`, `thread_mutation_skipped` |
> | Graph mutation & UI choice flow | `graph_op_execution`, `choice_set_player_resolved`, `choice_set_player_dismissed` |
> | Complication outcomes (THR-20) | `complication_selection` |
>
> **How to use:** Open DebugPanel (backtick or F1), select the Trace tab, check the category filter chips. Full TypeScript interface definitions for each trace type live in `src/types/trace.ts`.

If THR-116 has not merged at the moment this lands, include the Group D entries anyway with a parenthetical "(THR-116, may require sibling merge)" — the traces already exist in `TRACE_CATEGORIES`.

### Correction 6 — Downstream content skill review (do last, keep light)

After corrections 1–5 land, re-read these content skill files and check for claims that leak the same overstatements:

- `.agents/skills/encounter-pipeline/SKILL.md` (and any sub-files)
- `.agents/skills/attachment-pipeline/SKILL.md`
- `.agents/skills/prose-content-systems/SKILL.md`
- `.agents/skills/prose-vignettes-and-enrichment/SKILL.md`
- Any `.agents/skills/template-encounter-rewrite/*` if present

For each: grep for "40 effect types", references to `createSublocation` / `retireNPC` as authored surfaces, claims that every narrative field is enriched (true after THR-110 but worth double-checking the phrasing), and mentions of "wound" as a separate subsystem (should now read as "condition subcategory"). Fix in place where found. Keep this scope-tight — fix only what contradicts the reconciled wiring guide.

---

## Scope discipline

**In scope:**
- Text edits to `Docs/plans/2026-04-16-systemic-wiring-guide.md` (corrections 1–5).
- "How to verify" lines added to each Capability section and Part 5 table.
- Downstream skill review (correction 6) limited to the five skills listed, fixing only overstatements that contradict corrections 1–5.
- Capability numbering reorder.

**Out of scope — spawn follow-up issues if discovered:**
- Expanding Capability 2 / Capability 3 with THR-116 `when` DSL grammar (wait until THR-116 lands).
- Net-new capabilities (e.g. any Phase 1+ engine work).
- UI changes to DebugPanel (the categories render automatically from the array).
- Engine test additions beyond what already exists.

---

## NFP compliance

| NFP | Priority | Status | Note |
|---|---|---|---|
| 1 | Tunability | PASS | No constants introduced. |
| 2 | Inspectability | PASS | Actively improved — new trace-category reference section makes every capability's verification pathway explicit. |
| 3 | Determinism | PASS | Documentation only. |
| 4 | Fail-soft | PASS | Documentation only. |
| 5 | Narrative over mechanical perfection | PASS | The whole point — ensures content authors target real engine behavior, not ghosts. |
| 6 | Additive over destructive | PASS with note | Corrections 2 and 3 reframe misleading text. This is destructive by nature of being corrections, but no public API or authored-content contract is invalidated. |
| 7 | Performance budget | PASS | Documentation only. |

---

## Acceptance

- Corrections 1–5 applied to `Docs/plans/2026-04-16-systemic-wiring-guide.md`.
- Capability numbering is now 1, 2, 3, 4, 5, 6, 7, 8, 9 in doc order.
- Every capability section has a "How to verify" line pointing at a trace category, DebugPanel filter, integration test, or code file.
- The new Part 5 "Trace Categories You Can Filter On" section exists with all THR-111/114/115/116 categories grouped by verification purpose.
- Correction 6 sweep applied — downstream content skills no longer repeat the overstated claims from corrections 2 and 3.
- A one-line completion comment is added to THR-118 after merge.

---

## Wiring

This is a documentation issue; no engine wiring. The corrections reference existing wiring that is already in place:
- `src/engine/buildUnifiedEncounterStageModel.ts` — enrichProse path (THR-110)
- `src/engine/encounterAftermath.ts::applyEncounterAftermathReaction` — aftermath effect kind switch
- `src/types/trace.ts::TRACE_CATEGORIES` — trace vocabulary
- `src/engine/__tests__/unifiedAdapterProseEnrichment.test.ts` — enrichment parity lock
- `src/engine/__tests__/conditionOverflow.test.ts`, `conditionAttachment.test.ts` — condition/wound verification

Update `Docs/plans/wiring-checklist.md` only if the correction pass exposes a new orchestrator phase or player control that isn't tracked. Expected: no checklist update needed.
