# Routine Template Structural Variety (THR-86)

**Status:** Ready for Dev
**Owner:** Cowork (design) → Claude Code (implementation)
**Linear:** THR-86 — *"Rewrite ROUTINE_TEMPLATES with structural variety and richer placeholders"*
**Project:** Content Architecture (Now)
**Priority:** High
**Date:** 2026-04-17
**Related:**
- `Docs/plans/2026-04-16-systemic-wiring-guide.md` (enrichment placeholders, anti-pattern §2)
- `src/data/narrative-content.ts` (ROUTINE_TEMPLATES — this issue's primary content surface)
- `src/engine/narrative.ts` (generateRoutineProse — engine surface)
- `src/engine/proseEnrichment.ts` (enrichProse + NarrativeContext — the richer placeholder system routine prose currently ignores)

---

## Problem

`ROUTINE_TEMPLATES` in `src/data/narrative-content.ts` currently ships ≈80 templates across 23 event types, and every single one follows the exact same grammatical mold:

```
{actor} {verb} {target}, {adj} {noun}
```

Representative samples across event types:

| Event type | Template |
|---|---|
| action_resolved | `{actor} {verb} at {target}, a {adj} {noun} taking shape` |
| trait_acquired | `{actor} gained something new — a {adj} {noun}` |
| divine_intervention | `{actor} felt the {adj} hand move their world, {noun} unfurling` |
| actor_death | `{actor} fell as all must, {adj} {noun} the final word` |
| faction_formed | `{actor} bound themselves to others, {adj} {noun} the anchor` |

The sphere vocabulary does its job — adjectives and nouns rotate per sphere and avoid same-root collisions — but **the container is identical every time**. Scroll the chronicle feed for 30 ticks and you read the same sentence 30 times with different nouns. That is the "Static Strings in Dynamic Fields" anti-pattern from the systemic wiring guide applied to grammar: dynamic vocabulary shoved into a static shape produces a soundscape that feels mechanical, not alive.

Worse, routine prose is **actively bypassing the richer systemic vocabulary the engine already offers**:

- `enrichProse()` in `src/engine/proseEnrichment.ts` resolves `{name}`, `{location}`, `{they}/{them}/{their}`, `{artifact:weapon}`, `{ally:strongest}`, `{faction}`, `{title}`, plus `{?has_faction}…{/has_faction}` conditional blocks.
- `generateRoutineProse()` only calls `.replace()` on five tokens: `{actor}`, `{target}`, `{adj}`, `{verb}`, `{noun}`.
- The engine receives `ProseContext.locationName` from callers, then silently drops it because no routine template has ever been written to consume `{location}`.

The fix is not a per-template polish pass. The fix is **redesigning the template grammar so 80+ templates naturally vary in shape**, then rewriting templates to use the new grammar and the richer placeholder vocabulary. Per THR-86 verbatim: *"This is a structural improvement, not a per-template rewrite."*

## Goals

1. **Bar 1 — Structural Variety.** Across the 23 event-type pools, templates must distribute across four distinct sentence shapes. No event-type pool may contain only one shape.
2. **Bar 2 — Systemic Wiring.** Upgrade `{actor}` → `{name}` everywhere (so `enrichProse` can resolve it). Add `{location}` where it reads naturally. Use `{?has_faction}…{/has_faction}` / `{?has_ally}…{/has_ally}` conditional blocks where faction/ally state genuinely changes the sentence's meaning.
3. **Bar 3 — No adjacent-shape repeats.** When the orchestrator emits routine prose for two successive events in the same tick, the shape picker rotates to avoid back-to-back identical shapes per event type.
4. **Bar 4 — Backward-compat and fail-soft.** Callers without a `WorldGraph` or `actorId` still get a well-formed sentence — the new path degrades to the old path rather than throwing or leaking raw placeholders.

## Non-goals

- Not rewriting `NOTABLE_TEMPLATES` or `ARCHETYPE_EVENT_TEMPLATES` (tracked separately — THR-86 scope is explicitly routine prose).
- Not changing the sphere vocabulary pools (`SPHERE_VOCABULARY`) — those already work.
- Not introducing LLM generation for routine prose (Tier 1 stays template-stitched per `.agents/skills/state-of-game-design/SKILL.md`).
- Not adding new narrative event types — only rewriting the 23 that exist.

---

## Engine Pillar

### Shape Tag System

Templates become objects carrying their structural shape rather than bare strings:

```typescript
// src/types/narrative.ts
export type ProseShape = 'svo' | 'aftermath' | 'inverted' | 'compound' | 'fragment';

export interface ShapedTemplate {
  shape: ProseShape;
  template: string;
}

// src/data/narrative-content.ts
export const ROUTINE_TEMPLATES: Record<NarrativeEventType, ShapedTemplate[]>;
```

The five shapes, with representative grammar:

| Shape | Grammar | Feel | Example (action_resolved / force) |
|---|---|---|---|
| `svo` | Subject → verb → object → modifier coda | Workmanlike, direct | `{name} {verb} {target}, a {adj} {noun} in their wake.` |
| `aftermath` | Consequence first, actor second | Cinematic, reverses cause and effect | `A {adj} {noun} spreads through {location}; {name} has {verb} {target}.` |
| `inverted` | Prepositional phrase first, subject later | Literary, delays the actor | `Through {adj} {noun}, {name} {verb} {target}.` |
| `compound` | Two clauses joined by em-dash/semicolon, optional state clause | Heavier, weighty | `{name} {verb} {target} — {adj} {noun} is the cost{?has_faction}, and {faction} watches{/has_faction}.` |
| `fragment` | Short declarative fragments; uses pronouns | Staccato, intimate | `A {adj} hour for {name}. {They} {verb}. The {noun} remains.` |

`svo` is the current shape and stays as the most common (familiarity anchor). The other four exist to break monotony. Distribution weights are tunable (see Constants).

### Shape Picker with Rotation Memory

`generateRoutineProse` changes from "pick a template uniformly at random" to "pick a shape by weight, then pick a template of that shape, with adjacent-repeat avoidance":

```typescript
// src/engine/narrative.ts

interface ShapeRotationState {
  lastShapeByEventType: Map<NarrativeEventType, ProseShape>;
}

// Module-scope but owned per-session (future: move into SimulationRuntime per
// CLAUDE.md load-bearing decision on engine caches). For v1, reset via existing
// resetNarrativeEventCounter.
let shapeRotation: ShapeRotationState = { lastShapeByEventType: new Map() };

export function resetNarrativeEventCounter(): void {
  narrativeEventCounter = 0;
  shapeRotation = { lastShapeByEventType: new Map() };
}

function pickShape(
  pool: ShapedTemplate[],
  eventType: NarrativeEventType,
  seed: number,
): ShapedTemplate {
  const rng = mulberry32(seed);
  const shapesPresent = new Set(pool.map(t => t.shape));
  const lastShape = shapeRotation.lastShapeByEventType.get(eventType);

  // Build candidates = all templates, weighted by DEFAULT_SHAPE_WEIGHTS,
  // with adjacent-repeat penalty applied to lastShape.
  let candidates = pool;
  if (lastShape && shapesPresent.size > 1) {
    // Reroll-style: try up to SHAPE_REROLL_LIMIT to avoid lastShape.
    for (let i = 0; i < SHAPE_REROLL_LIMIT; i++) {
      const picked = weightedPick(candidates, DEFAULT_SHAPE_WEIGHTS, rng);
      if (picked.shape !== lastShape) {
        shapeRotation.lastShapeByEventType.set(eventType, picked.shape);
        return picked;
      }
    }
  }
  const picked = weightedPick(candidates, DEFAULT_SHAPE_WEIGHTS, rng);
  shapeRotation.lastShapeByEventType.set(eventType, picked.shape);
  return picked;
}
```

Rotation memory is per event type, not global — `action_resolved` alternating its own shapes is what a reader perceives, not global alternation across all event types.

### Enrichment Integration — Additive Path

`generateRoutineProse` currently calls `.replace()` on five tokens. After THR-86, it calls `enrichProse()` when a `NarrativeContext` can be constructed, then falls back to the old `.replace()` path when it cannot:

```typescript
export function generateRoutineProse(
  eventType: NarrativeEventType,
  context: ProseContext,
  seed: number,
  graph?: WorldGraph,
): ProseFragment {
  const rng = mulberry32(seed);
  const sphere = context.sphere ?? 'force';
  const templates = ROUTINE_TEMPLATES[eventType] ?? ROUTINE_TEMPLATES.action_resolved;
  const shaped = pickShape(templates, eventType, seed);
  let { adj, verb, noun } = pickSphereWords(sphere, seed);
  // ...cultural flavor unchanged...

  // Sphere-word substitution is always applied first (stays on ProseContext).
  let text = shaped.template
    .replace(/\{adj\}/g, adj)
    .replace(/\{verb\}/g, verb)
    .replace(/\{noun\}/g, noun);

  // Enrichment path: rich NarrativeContext if graph + actorId present, else fallback.
  let fallbackReason: 'no_graph' | 'no_actor_id' | undefined;
  if (graph && context.actorId) {
    const ctx = gatherNarrativeContext(graph, context.actorId);
    // enrichProse resolves {name}, {location}, {they}, {?has_faction}, etc.
    // For routine prose we also inject {target} explicitly since NarrativeContext
    // is actor-centric — pass it as a pre-replace step.
    text = text.replace(/\{target\}/g, context.targetName ?? context.locationName ?? 'the world');
    text = enrichProse(text, ctx);
  } else {
    fallbackReason = graph ? 'no_actor_id' : 'no_graph';
    // Safe fallback: map new placeholders to old behavior so legacy callers don't leak raw tokens.
    text = text
      .replace(/\{name\}/g, context.actorName ?? 'the actor')
      .replace(/\{actor\}/g, context.actorName ?? 'the actor')  // transitional: old placeholder still works
      .replace(/\{target\}/g, context.targetName ?? context.locationName ?? 'the target')
      .replace(/\{location\}/g, context.locationName ?? 'the wilderness')
      .replace(/\{they\}/g, 'they').replace(/\{them\}/g, 'them').replace(/\{their\}/g, 'their')
      .replace(/\{They\}/g, 'They').replace(/\{Them\}/g, 'Them').replace(/\{Their\}/g, 'Their');
    // Strip any unresolved conditional blocks to "no" branch.
    text = text.replace(/\{\?has_\w+\}[\s\S]*?\{\/has_\w+\}/g, '');
    text = text.replace(/\{\?no_\w+\}([\s\S]*?)\{\/no_\w+\}/g, '$1');
  }
  // ...emit trace (see Traces section)...
}
```

The fallback path is what keeps the change **additive** (NFP #6). Every existing caller continues to work; templates authored to the new vocabulary produce richer output only when a graph is available.

### Why not move routine prose entirely under `enrichProse`?

Considered and rejected for this issue:

- `gatherNarrativeContext` does real graph work (scans edges for bonds, possessions, traits, culture). Running it for every routine event in every tick would be wasteful when the template needs only `{name}` or nothing.
- `NarrativeContext` is actor-centric; routine prose is actor + target + location. `enrichProse` currently has no `{target}` resolution. Adding `{target}` resolution into `enrichProse` is a scope creep beyond THR-86.
- The transitional both-paths approach lets us migrate templates one at a time and measure impact (shape distribution traces, see below) before deciding whether to unify.

If a future issue unifies them, the signature `enrichProse(template, ctx, target?)` is the natural extension point.

### Constants Table

All tunable numbers live in `src/engine/narrative-constants.ts` (create if it does not exist — currently these values are inlined in `narrative.ts`).

| Name | Default | Purpose |
|---|---|---|
| `DEFAULT_SHAPE_WEIGHTS` | `{ svo: 0.4, aftermath: 0.2, inverted: 0.15, compound: 0.15, fragment: 0.1 }` | How often each shape is selected when all shapes exist in the pool. `svo` weighted highest because it's the reader's anchor; variations provide contrast. |
| `SHAPE_REROLL_LIMIT` | `3` | Max attempts to avoid the previously-used shape per event type before accepting a repeat. |
| `MIN_SHAPES_PER_EVENT_TYPE` | `3` | Minimum distinct shapes each event type's template pool must carry. Enforced by unit test, not runtime. |
| `ENRICHMENT_FALLBACK_MODE` | `'safe'` | When `enrichProse` cannot run (no graph/actorId), unresolved conditional blocks strip to the "no" branch rather than leaking. |
| `COLLISION_REROLL_LIMIT` | `3` (existing) | Max re-rolls when adj/noun share a linguistic root. Unchanged — already works. |

### Traces

Extend the existing `narrative_generation` trace with two fields:

```typescript
// Current (src/engine/traceBuffer.ts or the narrative trace interface):
// {
//   tick, category: 'narrative_generation', agentId, summary,
//   tier, sphereWords, culturalFlavorApplied, finalProse
// }

// After THR-86:
interface NarrativeGenerationTrace {
  tick: number;
  category: 'narrative_generation';
  agentId?: string;
  summary: string;
  tier: NarrativeTier;
  sphereWords: string[];
  culturalFlavorApplied: boolean;
  finalProse: string;

  // NEW — THR-86
  shape: ProseShape;                       // Which structural shape was chosen
  placeholdersResolved: string[];          // e.g. ['name', 'location', 'has_faction']
  fallbackReason?: 'no_graph' | 'no_actor_id';  // Present when enrichProse was skipped
}
```

This makes shape distribution and placeholder coverage inspectable from the DebugPanel and from automated QA (see UI Pillar).

### Fail-soft Table

| Failure case | Behavior |
|---|---|
| `graph` absent | Skip `enrichProse`. Strip `{?has_*}` blocks to empty, `{?no_*}` to content. Emit `fallbackReason: 'no_graph'`. |
| `graph` present but `context.actorId` absent | Same as above with `fallbackReason: 'no_actor_id'`. |
| `gatherNarrativeContext` throws (corrupt graph) | Caught; fall back to `.replace()` path. Emit `fallbackReason: 'no_actor_id'` with trace tag. Never throws upward — tick loop must not crash (NFP #4). |
| Unknown event type | Current behavior preserved — falls back to `ROUTINE_TEMPLATES.action_resolved`. |
| Template pool has only one shape | `pickShape` still works — adjacent-repeat is logged as unavoidable and skipped. Unit test enforces `MIN_SHAPES_PER_EVENT_TYPE` but runtime does not enforce (fail-soft over fail-fast for content data). |
| Unresolved placeholder leaks (bug in content data) | Residual strip at end: `text.replace(/\{[^}]+\}/g, '')`. Emit `trace.warn` so dev catches it, but never show raw `{foo}` to players. |
| `DEFAULT_SHAPE_WEIGHTS` sum ≠ 1 | Normalized inside `weightedPick`. Tunable-at-runtime without requiring a rebuild. |

---

## Content Pillar

### Template Rewrite Scope

All 23 event-type pools in `ROUTINE_TEMPLATES`:

```
action_resolved, action_failed, action_critical, trait_acquired, tier_transition,
divine_intervention, contested_action, actor_death, doom_escalation, mandate_stage,
trait_lost, dilemma_mutual_trust, dilemma_betrayed, dilemma_exploitation,
dilemma_mutual_distrust, faction_formed, culture_clash, migration,
construction_complete, encounter_step_success, encounter_step_failure,
encounter_completed, encounter_abandoned
```

Each pool ships **4–6 templates distributed across at least 3 of the 5 shapes**. Recommended distribution:
- 2× `svo` (keep current-style templates as the anchor)
- 1× `aftermath`
- 1× `inverted`
- 1× `compound`
- 0–1× `fragment` (only where it reads well — dilemma events suit it; construction events don't)

With 23 event types × 5 templates ≈ 115 total templates; actual count per issue description is "80+" which matches if some event types carry 3 and high-traffic types (`action_resolved`, `action_failed`, `action_critical`, `contested_action`) carry 5–6.

### Template Vocabulary Migration

Every template upgrades `{actor}` → `{name}`. Keep `{target}` for non-actor addressees. Add `{location}` where it reads naturally (roughly 40% of templates). Use conditional blocks sparingly — only where the sentence makes more sense with/without the state:

**Before:**
```
{actor} gained something new — a {adj} {noun}
```

**After (svo):**
```
{name} gained something new — a {adj} {noun} settling into them{?has_faction}, a mark {faction} will recognize{/has_faction}.
```

**After (aftermath):**
```
A {adj} {noun} now walks {location}; {name} has learned what {they} did not know an hour ago.
```

**After (inverted):**
```
Through {adj} trial, {name} earned the {noun}{?has_ally} — a story for {ally:strongest} to hear{/has_ally}.
```

### Worked Example — `action_resolved` pool (5 templates across 4 shapes)

```typescript
action_resolved: [
  {
    shape: 'svo',
    template: '{name} {verb} {target} at {location}, a {adj} {noun} in their wake.',
  },
  {
    shape: 'svo',
    template: '{name} pressed their work on {target} — the {adj} {noun} took shape where they stood.',
  },
  {
    shape: 'aftermath',
    template: 'A {adj} {noun} settles across {location}; {name} has {verb} {target}{?has_faction}, and {faction} will hear of it{/has_faction}.',
  },
  {
    shape: 'inverted',
    template: 'Through {adj} {noun}, {name} {verb} {target} — nothing grand, but nothing that undoes itself.',
  },
  {
    shape: 'compound',
    template: '{name} {verb} {target}; the {adj} {noun} is the ledger{?has_ally}, and {ally:strongest} is the witness{/has_ally}.',
  },
],
```

Reading five of these in a row produces five different reading experiences. Reading five copies of the old single-shape pool produces one experience, played five times.

### Worked Example — `actor_death` pool (4 templates)

Death events are high-weight narrative moments — shape variety matters most here. Fragment shape suits death well.

```typescript
actor_death: [
  {
    shape: 'svo',
    template: '{name} fell as all must, the {adj} {noun} the final word.',
  },
  {
    shape: 'aftermath',
    template: 'A {adj} {noun} lingers in {location}. {name} is gone.',
  },
  {
    shape: 'fragment',
    template: '{name} is still. The {noun} remains. A {adj} hour.',
  },
  {
    shape: 'compound',
    template: '{name} crossed over — the {adj} {noun} is what {they} leave behind{?has_faction}, and {faction} will carry it{/has_faction}.',
  },
],
```

### Same-Root Collision Guard

The existing `sharesRoot` collision guard in `pickSphereWords` continues to apply. Templates that repeat the `{noun}` slot (rare after rewrite — most templates use it once) still trigger the reroll loop. No change needed.

### Author's Checklist (per template)

- [ ] `{name}` used (not `{actor}`)
- [ ] `{location}` used or intentionally omitted
- [ ] `{target}` used where the event has an addressee (actions, dilemmas); omitted for events where the actor is alone (actor_death, tier_transition)
- [ ] Sphere-bearing slots (`{adj}`, `{verb}`, `{noun}`) present — do not strip them, sphere coloring is the lowest-level vocabulary variety
- [ ] Conditional blocks (`{?has_faction}…{/has_faction}`) used only when the sentence reads differently with/without the state. Do not wrap sentence-essential content in a conditional.
- [ ] Shape tag correct (read the sentence out loud — does it match the shape's description?)
- [ ] Reads well in isolation (no reliance on previous sentence)

---

## UI Pillar

### Chronicle Feed (player-facing)

The Chronicle/Event feed already renders `ProseFragment.text` — no UI code change required. The visible improvement is emergent: scroll the feed and the sentences vary.

**QA procedure** (manual, pre-merge):
1. Load `?view=game&seeded` on `http://localhost:5173`
2. Unpause and let the simulation run to tick 30
3. Scroll the event feed
4. Expect: shape variety within each event type (no two adjacent action_resolved events reading identical shapes), `{location}` surfacing in at least 30% of prose, no raw placeholder tokens (`{foo}`) visible
5. Check DebugPanel → Trace → filter `narrative_generation` → scan for shape distribution across the tick range

### DebugPanel — Narrative Generation Trace

The DebugPanel's existing narrative_generation trace inspection gains the two new fields automatically (it renders all trace properties). No UI code change required. Optionally add a shape-distribution summary view (defer — not blocking for THR-86).

### HexMapV2

N/A — routine prose does not render spatial signifiers. Marked N/A with rationale.

### Notifications / Toasts / Modals

N/A — routine prose flows through the existing event feed. No new notification surface needed.

---

## Wiring Section

Per `Docs/plans/wiring-checklist.md` and `Docs/plans/2026-04-16-systemic-wiring-guide.md`, every new capability must be wired end-to-end. Routine prose already is — this issue upgrades existing wiring, not adds new wiring.

| Surface | Current | After THR-86 |
|---|---|---|
| Orchestrator phase | `unifiedActionPhases.ts` calls `generateRoutineProse` | Unchanged. Still calls `generateRoutineProse`; new shape + enrichProse path is internal to the function. |
| UI component | Chronicle/Event feed renders `ProseFragment.text` | Unchanged — prose emerges richer automatically. |
| GameState flow | `ProseContext` built at call site from actor + target + sphere + location | Unchanged. Graph is already passed through. |
| Traces | `narrative_generation` trace emitted per routine prose call | Extended with `shape`, `placeholdersResolved`, optional `fallbackReason`. |
| Debug visibility | DebugPanel Trace tab shows narrative_generation entries | Unchanged — new fields render automatically. |
| Prose pipeline | `generateRoutineProse` → `.replace()` → text | `generateRoutineProse` → `pickShape` → (graph? `enrichProse` : fallback `.replace()`) → text |
| Player controls | N/A (read-only feed) | N/A |
| Content authoring | Templates as bare strings | Templates as `{ shape, template }` objects. Author's checklist added to `.agents/skills/prose-content-systems/`. |

**Update `Docs/plans/wiring-checklist.md`?** Not required — no new orchestrator phase, no new modal, no new GameState field. The systemic wiring guide (`2026-04-16-systemic-wiring-guide.md`) §"Capability 1: Enrichment Placeholders" should reference THR-86 as the issue that extends enrichment coverage into routine prose.

---

## NFP Compliance Summary

| # | NFP | Status | Note |
|---|---|---|---|
| 1 | Tunability | PASS | `DEFAULT_SHAPE_WEIGHTS`, `SHAPE_REROLL_LIMIT`, `MIN_SHAPES_PER_EVENT_TYPE`, `ENRICHMENT_FALLBACK_MODE` all named constants in `narrative-constants.ts`. Changing shape mix = editing one weight table. |
| 2 | Inspectability | PASS | `narrative_generation` trace gains `shape`, `placeholdersResolved`, `fallbackReason`. Shape distribution becomes a one-query question against the trace buffer. |
| 3 | Determinism | PASS | Shape picker uses `mulberry32(seed)`. Rotation memory is per-session (reset alongside `narrativeEventCounter`). Same seed + same tick sequence = same prose, including shape choice. |
| 4 | Fail-soft | PASS | Full fail-soft table above. Missing graph, missing actorId, unknown event type, unresolved placeholder — all degrade gracefully, none throw. Residual strip guarantees no raw `{foo}` leaks. |
| 5 | Narrative over mechanical | PASS | This issue exists specifically because mechanical identicalness broke narrative texture. Rewrite is the remediation. |
| 6 | Additive over destructive | PASS | Legacy `{actor}` placeholder still resolves in the fallback path. Templates migrate one at a time via the author's checklist. Existing tests continue to pass while content is rewritten. |
| 7 | Performance | PASS | Adds one `Map.get`/`Map.set` per event plus one conditional call to `gatherNarrativeContext`. Routine prose is emitted on the order of tens of times per tick — negligible cost. `gatherNarrativeContext` is already called elsewhere (notable prose path) so no new hot loop. |

---

## Testing Notes

Dev-side tests to add alongside implementation:

1. **Structural variety test** (`src/engine/__tests__/narrative-shape-variety.test.ts`) — for each event type, assert `templates.length >= 3` and the set of unique `.shape` values covers at least `MIN_SHAPES_PER_EVENT_TYPE`.
2. **Shape rotation test** — call `generateRoutineProse` 10× in a row for the same event type and assert consecutive shapes differ at least 80% of the time (allow occasional repeat via the reroll cap).
3. **Enrichment fallback test** — call `generateRoutineProse` without `graph`; assert no raw `{foo}` in output, assert `fallbackReason` trace field is emitted.
4. **Enrichment happy-path test** — build a graph with an actor in a named faction at a named location; assert `{name}`, `{location}`, and the `{?has_faction}…{/has_faction}` branch resolve correctly.
5. **Determinism test** — call twice with same seed, assert identical output (text + shape).
6. **Existing narrative tests** — must continue to pass. The shape layer is additive.

Run `npm test` + `npx tsc --noEmit` + `npx vite build` per the pre-commit checklist. The CLI smoke test (`npm run cli`, `tick 30`, `events`) should show visibly varied chronicle entries.

---

## Claude Code Coordination Block

**Suggested model:** `sonnet`

Content-heavy rewrite of ≈80–115 templates combined with an engine grammar change. Not architectural enough for opus, too substantive for haiku. Sonnet is the right fit — solid prose sense + steady refactor execution.

**Parallel-safe with:**
- THR-135 — prose resolver tests (different file surface: `src/engine/proseResolvers*`)
- THR-116, THR-117 — encounter authoring issues in Encounter Format Migration project (they touch encounter-specific content, not `narrative-content.ts`)
- Non-prose THR issues in Social Systems Expansion, Thematic Pressure, Attention Tier Model (different files entirely)

**Mutex with:**
- `src/data/narrative-content.ts` — this issue rewrites ≈80+ templates in ROUTINE_TEMPLATES; any concurrent edit to the same export conflicts. Other exports (`NOTABLE_TEMPLATES`, `ARCHETYPE_EVENT_TEMPLATES`, `SPHERE_VOCABULARY`, `DILEMMA_STAKES_PROSE`, etc.) are not touched.
- `src/engine/narrative.ts` — new shape picker + enrichment integration edits `generateRoutineProse`.
- `src/types/narrative.ts` — adds `ProseShape` and `ShapedTemplate` type exports. Minimal but blocking for any concurrent work adding types here.

**Codex review:** no

Rationale: this is a refactor within an established pattern (Tier 1 template stitching). The engine change is small (one function edited, plus a new types export and a constants file). Content rewrite is repetitive and pattern-bound — the author's checklist and unit tests (shape variety, enrichment fallback) cover the risk surface. Codex review is reserved for high-impact files, subtle correctness, and first-in-pattern architectures; none apply here.

**Upgrade to `yes` if during implementation** the scope shifts to unifying `generateRoutineProse` and `enrichProse` fully (dropping the fallback path), because that would be a first-in-pattern architectural choice.

---

## Definition of Done

- [ ] `ROUTINE_TEMPLATES` rewritten — all 23 event types have 3+ templates covering 3+ shapes
- [ ] `generateRoutineProse` calls `enrichProse` when graph+actorId present, fallback path otherwise
- [ ] `narrative_generation` trace extended with `shape`, `placeholdersResolved`, `fallbackReason`
- [ ] Unit tests added: shape variety, rotation, enrichment fallback, enrichment happy-path, determinism
- [ ] `npm test` passes, `npx tsc --noEmit` clean, `npx vite build` succeeds
- [ ] Manual QA per UI Pillar procedure — chronicle feed at tick 30 shows visible shape variety, no raw placeholder leaks
- [ ] `Docs/changelog.md` entry, `Docs/project-history.md` one-liner, `Docs/project-status.md` updated
- [ ] Commit message includes `Fixes THR-86`
- [ ] `.agents/skills/prose-content-systems/` updated with the Author's Checklist
- [ ] Linear issue moved to Done via auto-close on push to main
