# THR-114 — Multi-Target Aftermath Effects

**Linear issue:** THR-114
**Project:** Encounter Format Migration
**Phase:** Phase 0, Group B (Authoring surface expansion)
**Priority:** Medium (P3) — but load-bearing for Phase 2 content
**Effort size:** M (~1 week, one agent)
**Status:** Implementation Planning
**Parent design:** `Docs/plans/2026-04-16-encounter-template-migration.md` → "Phase 0 Engine prerequisites → Group B: Multi-target aftermath".
**Sibling issues:** THR-112 (Done), THR-113 (Ready for Dev), THR-118 (blocked on this).

## Problem

Authored encounter aftermath today always falls back to the actor. Every effect kind in `src/engine/encounterAftermath.ts` resolves its target via `action?.actorId` if no explicit id is passed (lines 55, 91, 243, 293). The effect schemas in `src/types/unifiedAction.ts:138–186` make this concrete: only `reputation_score` and `reputation_tally` expose an optional `actorId`, and even that field is a misnomer — it is used as the *target's* node id, but the name implies "actor". There is **no way** for an authored template to:

- place a `hidden_mark` on a non-actor agent (the victim of a betrayal),
- grant `intelligence` to anyone other than the actor (so multiple witnesses can share what they observed),
- write a `recent_event` into more than one agent's `recentEvents` buffer (so crowd-scale fiction doesn't become invisible to observers),
- set an absolute reputation value (only deltas exist today — `reputation_set` is missing entirely),
- apply or remove a condition from anyone (no effect kind exists for `apply_condition` / `remove_condition`; attachments/conditions are created elsewhere in the pipeline and aftermath cannot reach them).

The practical consequence for the migration: Phase 2 guild encounters and Phase 3 social encounters routinely describe outcomes like *"the Lorekeepers disown the accused"*, *"the council's dispositions toward the rival collapse"*, *"three witnesses carry away the secret"*, *"the shrine-keeper is shaken"*. If the authoring surface cannot direct aftermath at those non-actor entities, authors will either encode the fiction into prose alone (making it a dead letter, like `hidden_mark` was before THR-112) or will try to smuggle effects by misusing the actor fallback and mutating the actor instead — both fail the three-pillar gate.

## Goal

Extend the aftermath authoring surface so that every effect kind can be directed at a specific target (agent, faction, or sublocation where appropriate), add `reputation_set` as a first-class absolute-assignment effect, and introduce `apply_condition` / `remove_condition` effects that integrate with the existing attachment pipeline without creating a second condition lifecycle. All effects must preserve the current actor-fallback so existing templates continue to work unchanged, and each multi-target effect must emit a trace that carries the effective target id so reviewers can see exactly who each aftermath line touched.

**Non-goals for v1:**
- No "witness auto-derivation" from sublocation co-presence. Witnesses are author-supplied only. (Deferred — see Deferrals §D1.)
- No cross-target chained effects (e.g., *"apply condition X to everyone who has condition Y"*). The scope model is flat: each effect addresses exactly one target or one witness-list, with no query language. (Deferred.)
- No faction-to-faction reputation object. `targetFactionId` mutates the faction node's own `reputationScore` / `reputationTallies`; pair-wise faction relations are a separate design.
- No player-facing modal explaining multi-target outcomes. The existing aftermath summary and chronicle surfaces pick up the new behavior automatically.
- No back-migration of existing templates. Old templates keep working; new authoring guidance calls out multi-target opportunities for Phase 2+.

## Design decisions (load-bearing)

### D1. Every effect kind carries a small, explicit "target set", never an implicit query.

Authors pass ids directly: `targetAgentId`, `targetFactionId`, `targetSublocationId`, or `witnessAgentIds: string[]`. No filters, no "all members of faction X", no "all agents in sublocation Y". If an author wants a witness crowd, they list the ids. The ids typically come from the encounter template's `participants` section, which already names them by role — resolver logic picks them up at reaction time and substitutes the id into the effect.

Rationale: a query language here would duplicate the targeting that already lives in `UnifiedActionTemplate.participants` and `selectedParticipants`. The cost of explicitness is that authors write one more id per multi-target effect; the benefit is that the aftermath trace always shows a concrete `targetId`, and fail-soft is trivial (`targetId` missing ⇒ skip + trace).

### D2. Actor fallback remains, per effect, in exactly one place.

Today the fallback pattern is scattered: `const actorId = effect.actorId ?? actorAgentId;`. In the new schema every target-bearing effect gets a single resolver call — `resolveAftermathTarget(effect, action)` — that returns a typed `AftermathTarget` union: `{ kind: 'agent'; id: string } | { kind: 'faction'; id: string } | { kind: 'sublocation'; id: string } | { kind: 'none' }`. Handler switch on `target.kind`. Effects that have no sensible non-agent target (e.g., `clearance_gate_tag` which targets a gate by `runtimeId`, not an agent) do not take the new fields.

### D3. `reputation_set` is an absolute clamp, not a delta.

Effect shape: `{ kind: 'reputation_set'; value: number; targetAgentId?: string; targetFactionId?: string; }`. Value is clamped to `[0, 1]` on write. Useful for outcome-specific hard resets (*"standing with the guild collapses to 0.1"*) where a delta can't predict the right magnitude because the prior value is author-opaque. Not useful for day-to-day outcomes — `reputation_score` delta remains the default. Documentation should steer authors to `reputation_set` only for "the reputation is now literally X" fiction, not "rep goes down a lot".

### D4. Faction reputation is stored on the faction node as `reputationScore` / `reputationTallies`, not as aggregated member rep.

Codesight confirms faction nodes exist as `actor` nodes with `actorType='faction'` (`src/types/graph.ts:17–31`) but have no dedicated reputation field today. Member reputation lives on `member_of` edges (`src/engine/factionReputation.ts:40–111`) and models *one agent's standing inside the faction*. That is a different concept from *the faction's public-facing standing in the world*. For v1 we add faction-wide rep as a top-level `reputationScore: number` property on the faction node, initialized lazily to `DEFAULT_REPUTATION` when first read. `reputation_score` / `reputation_tally` / `reputation_set` effects with `targetFactionId` mutate these properties on the faction node directly, mirroring the agent path.

Rejected: distributing faction-targeted effects across all member edges. That conflates two distinct signals (member-inside-faction vs faction-in-world) and would create confusing double-accounting. Rejected: deriving faction rep from member rep on read. Too expensive, not authorable.

### D5. Conditions use the existing attachment graph surface. Aftermath writes a `has_trait`-style edge into the graph.

The codesight brief notes there is no dedicated `applyAttachment(state, targetId, template)` function today — conditions are `has_trait` edges between agents and trait/condition nodes. The v1 design commits to that same surface: `apply_condition` resolves the condition template id to an existing trait node (fail-soft if not present), then calls `state.graph.addEdge(targetId, traitId, 'has_trait', { appliedAt: tick, ... })`. `remove_condition` removes matching edges by `traitId` (and optional `appliedAt` window). Because this is a **structural** graph change, aftermath calls `touchStructure(runtime)` — not `touchWorld()` — when either effect fires. The existing attachment lifecycle (tick, expiry, attachments derivation) picks up the edge in the normal way.

This is deliberately simple. We *could* build a full pending-condition queue with a dedicated phase; we're not, because the existing attachment logic already polls `has_trait` edges, and adding a second pipeline is a classic "twice the wiring, half the surface" trap. The tradeoff: aftermath becomes aware of graph structure (it already is — see `clearance_gate_tag`), and condition expiry/decay is outside this issue's scope (attachments already handle it).

### D6. Witness propagation is a fan-out of the same `TickEvent` into each witness's `recentEvents` buffer, not a new event per witness.

Effect `{ kind: 'recent_event'; witnessAgentIds?: string[]; ... }` writes one event with `witnessAgentIds` recorded on the event, then iterates witness ids and appends the same event object to each witness's `recentEvents` array (via a new per-agent buffer). The event is also pushed to `tickEvents` once, so the chronicle shows it once but every witness can query "was I there?" by checking `event.witnessAgentIds?.includes(myId)`. Fail-soft: unknown witness ids are dropped with a `recent_event` trace line noting the skip. The actor remains the default "participant 0" and is always recorded even if not listed explicitly in `witnessAgentIds`.

Rejected: creating a per-agent cloned event (N events for N witnesses). Blows up `tickEvents`, duplicates chronicle entries, loses the "they saw the same thing" semantic.

### D7. `applyEncounterAftermathReaction()` gains a `runtime: SimulationRuntime` parameter.

To call `touchWorld()` / `touchStructure()` correctly after property and structural mutations, the function needs the runtime. This is the same shape of signature change THR-113 made to `scoreAndSelect()` (see THR-113 plan comment, §Load-bearing decisions #7). Two call sites exist: `GameView.tsx:1920` and the encounter-aftermath test files. The GameView call is inside a `setGameState(prev => {...})` updater — **touchWorld/touchStructure calls must move out of the updater** to avoid StrictMode double-increment (the same concern captured in THR-133 for `emitTrace`). Plan: call `applyEncounterAftermathReaction` inside the updater (returning new state), then call `touchWorld(runtime)` / `touchStructure(runtime)` in the `setGameState` callback's outer scope using a summary of mutation kinds returned from the reaction function.

### D8. Each multi-target effect trace includes `effectiveTargetId` and `effectiveTargetKind`.

The existing `encounter_aftermath_effect` trace already carries an `effectDetail` object. We add two *top-level* fields to the trace so debug filters can see them without opening the detail blob: `effectiveTargetId: string` and `effectiveTargetKind: 'agent' | 'faction' | 'sublocation' | 'actor_fallback'`. `actor_fallback` means no explicit target was supplied and the actor was used. Authors reviewing encounter output filter `effectiveTargetKind !== 'actor_fallback'` to see what their multi-target authoring is producing.

---

## Engine pillar

### E1. Schema additions in `src/types/unifiedAction.ts`

```typescript
// Add to the top of the file, near HiddenMarkCategory
export type AftermathTarget =
  | { readonly kind: 'agent'; readonly id: string }
  | { readonly kind: 'faction'; readonly id: string }
  | { readonly kind: 'sublocation'; readonly id: string }
  | { readonly kind: 'actor_fallback' };

// Update EncounterAftermathReactionEffect union
// reputation_score: add targetAgentId, targetFactionId (keep actorId for backcompat, deprecate)
// reputation_tally: add targetAgentId, targetFactionId (same)
// hidden_mark: add targetAgentId, targetFactionId
// intelligence: add targetAgentId (grants-to), keep existing targetRegion/targetEntityId (what-about)
// recent_event: add witnessAgentIds?: readonly string[]
// encounter_seed: existing targetAgentId is fine; add note to docs

// New kinds
| {
    readonly kind: 'reputation_set';
    readonly targetAgentId?: string;
    readonly targetFactionId?: string;
    readonly value: number; // 0..1, clamped on write
  }
| {
    readonly kind: 'apply_condition';
    readonly targetAgentId?: string;
    readonly targetFactionId?: string;
    readonly targetSublocationId?: string;
    readonly conditionTraitId: string; // existing trait node id
    readonly durationTicks?: number; // optional; null = no auto-expiry
    readonly intensity?: number; // optional, 0..1, stored on edge
  }
| {
    readonly kind: 'remove_condition';
    readonly targetAgentId?: string;
    readonly targetFactionId?: string;
    readonly targetSublocationId?: string;
    readonly conditionTraitId: string;
    readonly removeAll?: boolean; // default false — remove oldest matching; true removes all
  };
```

Note: `targetAgentId` / `targetFactionId` / `targetSublocationId` are *mutually exclusive* within a single effect. If two are set, the resolver picks in priority order (`agent` > `faction` > `sublocation`) and emits a `multiple_targets_specified` trace warning; author intent is ambiguous and CC should not silently pick one without noting.

### E2. New target resolver helper in `src/engine/encounterAftermath.ts`

```typescript
function resolveAftermathTarget(
  effect: EncounterAftermathReactionEffect,
  action: UnifiedAction | undefined,
): AftermathTarget {
  const maybe = effect as Partial<{
    targetAgentId: string; targetFactionId: string; targetSublocationId: string;
    actorId: string; // legacy
  }>;
  if (maybe.targetAgentId) return { kind: 'agent', id: maybe.targetAgentId };
  if (maybe.targetFactionId) return { kind: 'faction', id: maybe.targetFactionId };
  if (maybe.targetSublocationId) return { kind: 'sublocation', id: maybe.targetSublocationId };
  if (maybe.actorId) return { kind: 'agent', id: maybe.actorId }; // legacy fallback
  if (action?.actorId) return { kind: 'agent', id: action.actorId };
  return { kind: 'actor_fallback' };
}
```

All handler branches accept the resolved `target` and a `validateFor: ('agent' | 'faction' | 'sublocation')[]` list that declares which kinds are supported. Effects that only support `agent` (today's `reputation_score` semantics during pre-D4 rollout) log a `target_kind_not_supported` trace and skip.

### E3. Handler changes per effect

**`reputation_score`, `reputation_tally`, `reputation_set`** (new):
- `agent` target: mutate `node.properties.reputationScore` / `reputationTallies` exactly as today, with the target's node id, not the actor's.
- `faction` target: same properties, on the faction node. Initialize `reputationScore` to `DEFAULT_REPUTATION` when undefined on read.
- Fail-soft: node missing → trace + skip. `touchWorld(runtime)` after the mutation batch.

**`hidden_mark`**:
- `agent` target: write mark with `targetAgentId` = resolved id. `hidden_mark_placed` trace's `agentId` is the target, not the actor (preserving THR-112's semantics).
- `faction` target: **reject for v1** (faction marks are a future design). Trace `target_kind_not_supported`, skip.

**`intelligence`**:
- `agent` target: grant intelligence to that agent's `intelligenceRecords` slice. This is the *who holds it* axis. `targetEntityId` / `targetRegion` remain the *who / where it's about* axes — unchanged.
- `faction` target: **reject for v1**. Faction-held intelligence is out of scope.
- Multiple witness-grant via `intelligence` effect: authors emit the effect N times, once per witness. Alternative: `targetAgentIds: string[]`. We chose the explicit-repetition path to keep the schema flat and make per-grant traces clean.

**`recent_event`**:
- `witnessAgentIds` is fan-out. Actor always records implicitly.
- Each witness's `recentEvents` buffer must be bounded by `MAX_RECENT_EVENTS` (existing constant, enforced via `appendRecentEvent`).
- **Storage question:** `recentEvents` today is a single global array on `GameState`. For witness fan-out, we need per-agent recentEvents buffers. Check current codebase: if `recentEvents` is global, we rely on `event.witnessAgentIds` + `event.actorId` for downstream filters (chronicle, agent-detail panel) and keep the single array. If per-agent buffers already exist (`agentNode.properties.recentEvents`), append to each witness's buffer.
  - **Expected reality:** `recentEvents` is the global "last N world events" buffer; per-agent memory lives on the agent node. For v1 we append once to the global buffer with `witnessAgentIds` populated, and the chronicle/debug layer uses that field to render "also observed by". Per-agent memory fan-out is a deferral. This keeps the storage model additive.

**`encounter_seed`**:
- Already supports `targetAgentId`. Documentation pass to call this out in the authoring guide; no schema change. Keep the actor fallback for backcompat.

**`clearance_gate_tag`**:
- Untouched. Targets a gate by `runtimeId`, not an agent.

**`apply_condition`** (new):
- Resolve target. For `agent` / `sublocation` / `faction` — add a `has_trait` edge from target → conditionTraitId with properties `{ appliedAt: tick, durationTicks?, intensity?, sourceEncounterId, sourceReactionId }`.
- If the target node or `conditionTraitId` node is missing: trace fail-soft, skip.
- Structural change → `touchStructure(runtime)` after the batch.

**`remove_condition`** (new):
- Find matching `has_trait` edges from target → conditionTraitId.
- If `removeAll` is false (default): remove oldest (smallest `appliedAt`). If none found: trace skip, no-op.
- If `removeAll` is true: remove all matching edges.
- Structural change → `touchStructure(runtime)`.

### E4. Tracing

Add six new trace categories in `src/types/trace.ts` (paired with handler emissions):

| Trace category                         | Emitted when                                                        | Key fields |
|----------------------------------------|--------------------------------------------------------------------|-----------|
| `aftermath_target_resolved`            | Every effect, just after `resolveAftermathTarget()`                 | `effectIndex`, `effectKind`, `effectiveTargetId`, `effectiveTargetKind` |
| `faction_reputation_changed`           | `reputation_score` / `reputation_tally` / `reputation_set` with faction target | `factionId`, `previous`, `result`, `delta`, `kind` |
| `reputation_set_applied`               | `reputation_set` success                                            | `targetId`, `targetKind`, `value`, `previous` |
| `condition_applied`                    | `apply_condition` success                                           | `targetId`, `targetKind`, `conditionTraitId`, `durationTicks`, `intensity` |
| `condition_removed`                    | `remove_condition` success                                          | `targetId`, `targetKind`, `conditionTraitId`, `removedCount` |
| `aftermath_target_invalid`             | Any effect whose target cannot be resolved or is unsupported        | `effectKind`, `attemptedTargetKind`, `reason` |

Update `TRACE_CATEGORIES` in `src/types/trace.ts` (line ~120) in the same edit — same pattern THR-111 used.

The top-level `encounter_aftermath_effect` trace (existing) gains two fields: `effectiveTargetId` and `effectiveTargetKind`. These are stringly typed today via `effectDetail`; promoting them makes DebugPanel filters cleaner. Existing tests that assert on `effectDetail` shape continue to pass — we add fields, don't rename.

### E5. Signature change: `applyEncounterAftermathReaction(state, action, reaction, tick, runtime)`

Runtime is required (not optional) to force call sites to adopt. Two updates:

1. `src/components/Game/GameView.tsx:1920` — pass `runtimeRef.current`. See D7: `touchWorld` / `touchStructure` calls must live *outside* the `setGameState` updater. The reaction function returns `{ state, mutationSummary: { touchedWorld: boolean; touchedStructure: boolean } }` so the caller can invoke the correct touch outside the updater. (Signature becomes a tuple return, not just state.)
2. `src/engine/__tests__/encounterAftermath*.test.ts` — thread a test runtime via `createSimulationRuntime()`.

### E6. Constants (new, in `src/engine/constants.ts`)

| Constant                             | Default | Purpose |
|--------------------------------------|---------|---------|
| `DEFAULT_FACTION_REPUTATION`         | 0.5     | Faction node's `reputationScore` when first read. Matches `DEFAULT_REPUTATION` for agents. |
| `CONDITION_DEFAULT_INTENSITY`        | 0.5     | `apply_condition` intensity when effect omits it. |
| `CONDITION_DEFAULT_DURATION_TICKS`   | 0 (0 = indefinite) | `apply_condition` duration when omitted. Zero means "no auto-expiry, remove via `remove_condition`." |

No magic-number tuning in this issue's v1. If authors need category-specific defaults, extend here.

### E7. Fail-soft table

| Failure                                        | Behavior                                                                |
|------------------------------------------------|-------------------------------------------------------------------------|
| Effect has two target fields set                | Priority agent > faction > sublocation; emit `multiple_targets_specified` warning trace; apply to priority target. |
| Target id does not resolve to a node           | Skip effect; emit `aftermath_target_invalid` with `reason: 'target_node_missing'`. No state mutation. |
| Target kind is unsupported for effect (e.g. `hidden_mark` + faction in v1) | Skip effect; emit `aftermath_target_invalid` with `reason: 'target_kind_not_supported'`. |
| `conditionTraitId` not found                    | Skip effect; emit `aftermath_target_invalid` with `reason: 'condition_template_missing'`. |
| `remove_condition` finds zero matching edges   | No-op; emit `condition_removed` with `removedCount: 0` (not a failure). |
| `witnessAgentIds` contains unknown ids         | Skip that id only; event still records with known witnesses; emit `recent_event_witness_dropped` detail inside the existing effect trace. |
| Caller passes no runtime (undefined)           | **Throw** — this is a programming error, not a data error. Runtime is required for correctness. |

---

## Content pillar

### C1. Authoring surface changes

Every effect kind's schema block gets a JSDoc update describing which target fields it accepts. Authors writing Phase 2+ templates see:

```typescript
reactions: [
  {
    id: 'rx.betrayal_revealed',
    label: 'The Secret Keeper Betrays',
    effects: [
      // Mark the victim (not the actor) — their future investigations surface this
      { kind: 'hidden_mark', targetAgentId: 'role:victim', category: 'betrayal', severity: 0.7, label: 'betrayed by {actorName}', revealFamilies: ['investigation', 'confrontation'] },
      // Drop the faction's public standing — not just the actor's standing with them
      { kind: 'reputation_score', targetFactionId: 'role:guild', delta: -0.05 },
      // All witnesses remember this
      { kind: 'recent_event', witnessAgentIds: ['role:witness_a', 'role:witness_b', 'role:bystander'], message: '{actorName} betrayed {victimName} — many saw it.', significance: 0.75 },
      // Attach a "grieving" condition to the victim, expiring in ~200 ticks
      { kind: 'apply_condition', targetAgentId: 'role:victim', conditionTraitId: 'trait.condition.grieving', durationTicks: 200, intensity: 0.6 },
    ],
  },
],
```

Note: `role:X` is a participant reference string. `resolveAftermathTarget()` runs a participant substitution pass (already part of the unified adapter's prose enrichment — reuse that function; do **not** re-implement) before target resolution. If the participant slot is unfilled, the effect skips with `participant_unresolved` fail-soft.

### C2. Gold-standard example templates

Three examples live in `src/data/encounters/examples/` (a new subfolder — currently no such folder exists for examples; create it and link from the systemic wiring guide). These are not real game content; they exist as the canonical references encounter-pipeline skill point to:

1. **`example.betrayal_multi_target.ts`** — demonstrates `hidden_mark` on victim, `reputation_score` on faction, witness fan-out, condition apply.
2. **`example.council_disowns.ts`** — demonstrates `reputation_set` (hard reset), faction-targeted reputation, faction-wide `recent_event`.
3. **`example.shrine_consecration.ts`** — demonstrates sublocation-targeted `apply_condition` (the shrine gains `trait.condition.consecrated` for 1000 ticks).

Each example has an inline comment block explaining the multi-target design decision and a `// THR-114` tag for trace-back.

### C3. Migration guidance

Pass to Phase 2 guild migrations: the `template-encounter-rewrite` skill (and encounter-pipeline skill) must load *and apply* this plan's authoring-surface section. Specifically:

- When a template's fiction describes a consequence that happens to a participant other than the actor, the author **must** use the appropriate target field instead of the actor fallback.
- When fiction describes a faction-wide consequence, the author **must** use `targetFactionId`.
- When fiction describes witnesses carrying away a memory, the author **should** populate `witnessAgentIds` (bounded to the existing participant roster — no invented ids).

The three-pillar gate (audit in THR-129 and successors) **gains a new check**: for each migrated template, assert that any outcome whose prose names a non-actor entity also emits at least one effect targeting that entity. This is an automated lint, not a manual review — the audit script grows to include participant-cross-reference checks.

### C4. No generic content required in this issue

The effect schema changes are additive and backward-compatible. Phase 1 pilot templates (THR-89 Done) continue to work unchanged. New content leverages the expanded surface as Phase 2 lands.

---

## UI pillar

### U1. DebugPanel — new trace filters

Add to the `encounter_aftermath_effect` filter group in `src/components/Game/DebugPanel.tsx`:

- Toggle: "Show only multi-target effects" — filters to traces where `effectiveTargetKind !== 'actor_fallback'`.
- Toggle: "Show only faction-targeted" — filters `effectiveTargetKind === 'faction'`.
- New category filters (from §E4): `faction_reputation_changed`, `reputation_set_applied`, `condition_applied`, `condition_removed`, `aftermath_target_invalid`, `aftermath_target_resolved`.

Each trace line in the list renders `effectiveTargetId` next to `effectKind` (e.g. `reputation_score → agent:npc.victim_a  -0.05`). When `effectiveTargetKind === 'actor_fallback'`, render it in a dimmed color so reviewers instantly see which lines kept the old semantics.

### U2. Chronicle — witness attribution

Chronicle entries (in `src/components/Game/Chronicle.tsx` or the nearest equivalent — confirm path during implementation) for `recent_event` effects with `witnessAgentIds` populated gain a subtle "Witnesses: A, B, C" line beneath the message. Non-expanded rendering remains identical — only the expanded-row or hover state surfaces witness attribution. Players should not feel the chronicle suddenly became noisy; the new surface is opt-in via click.

If the actor is in `witnessAgentIds` already, de-duplicate. If the list is empty or missing, render no witness line.

### U3. Aftermath overlay (if present)

If the aftermath/resolution overlay surfaces effects to the player (check `src/components/Game/EncounterAftermathOverlay.tsx` or `EncounterResolution*.tsx` during implementation), it must now show target attribution. E.g. instead of "Reputation changed +0.05", render "Guild reputation changed +0.05" or "Victim's reputation changed +0.05". The resolver looks up the target node's display name from the graph; falls back to the id if missing.

**Non-goal:** no new modal. If the existing overlay does not surface effect-level detail today, this issue does not add it. The player-facing surface is "the right thing happens to the right entity," not "a new UI reveals a new mechanic."

### U4. Agent-detail panel — conditions surface

Existing agent-detail panels that surface "attachments" / "conditions" pick up condition applications from `has_trait` edges automatically (they already iterate the agent's attachments). **No changes required** — this is a genuine win of the graph-edge approach from D5. The existing rendering will just start showing conditions that were applied via aftermath, attributed via `sourceEncounterId` / `sourceReactionId`.

One cosmetic update: when a condition has `sourceEncounterId`, render that as a tooltip ("from: {encounter name}") so players can trace *why* a condition exists. This is a 10-line diff to the attachment-rendering component; ship it with this issue.

---

## Wiring

Cross-reference to `Docs/plans/wiring-checklist.md`:

| Surface                                | Change                                                    |
|----------------------------------------|-----------------------------------------------------------|
| `src/engine/encounterAftermath.ts`     | Handler refactor per §E3; new target resolver §E2; runtime param §E5 |
| `src/types/unifiedAction.ts`           | Schema additions per §E1                                  |
| `src/types/trace.ts`                   | New categories §E4; update `TRACE_CATEGORIES` array       |
| `src/engine/constants.ts`              | New constants §E6                                         |
| `src/components/Game/GameView.tsx:~1920` | Thread runtime into reaction call; move `touchWorld`/`touchStructure` out of updater §D7 |
| `src/components/Game/DebugPanel.tsx`   | New filters, target-rendering §U1                          |
| `src/components/Game/Chronicle.tsx` (or equivalent) | Witness attribution §U2                          |
| `src/components/Game/AgentDetail*.tsx` | Condition-source tooltip §U4                              |
| `src/data/encounters/examples/` (new)  | Gold-standard examples §C2                                 |
| `Docs/plans/2026-04-16-systemic-wiring-guide.md` | Update "aftermath effects" section to list new kinds and multi-target surface (deferred to THR-118) |
| `Docs/plans/wiring-checklist.md`       | Add "multi-target aftermath" row                           |

Orchestrator phase counts: **no new phase** required. The attachment lifecycle already runs post-aftermath; `has_trait` edges added by `apply_condition` are picked up in the normal flow.

---

## Testing

Per `testing-patterns` skill.

### Engine tests (`src/engine/__tests__/encounterAftermath-multi-target.test.ts` — new file)

- `reputation_score` with `targetAgentId` mutates target, not actor.
- `reputation_score` with `targetFactionId` mutates faction node; faction node previously had no reputationScore → initialized to `DEFAULT_FACTION_REPUTATION` first.
- `reputation_set` clamps to `[0, 1]`.
- `recent_event` with `witnessAgentIds: [A, B]` produces one `TickEvent` with `witnessAgentIds` populated; both `A` and `B` present (dedup vs actor).
- `apply_condition` adds a `has_trait` edge; `touchStructure` called; condition visible via existing attachment query.
- `remove_condition` default removes oldest; `removeAll: true` removes all.
- `remove_condition` with zero matches emits `condition_removed` with `removedCount: 0`.
- Unknown witness id drops witness but still records event.
- Target node missing → skip with `aftermath_target_invalid` trace; no mutation.
- `hidden_mark` + `targetFactionId` rejected as unsupported in v1.
- Actor fallback still works (no target fields → actor target).

### Contract tests

- **Trace completeness** (extends existing trace-category test): every new category appears in `TRACE_CATEGORIES` and has a corresponding trace emission path.
- **Mutation observability** (existing contract in `mutation-observability.contract.test.ts`): `apply_condition` and `remove_condition` trigger `touchStructure`; `reputation_score` / `reputation_set` with faction target trigger `touchWorld`.
- **Fail-soft** (new or extend existing): every branch of §E7's fail-soft table produces the expected trace and leaves state unchanged.

### Integration tests

- End-to-end scenario: run an encounter whose reaction targets three agents (actor + 2 witnesses), one faction, and one sublocation. Assert each target's state after the reaction. Snapshot the trace output and check all six new categories appear where expected.
- Determinism: same seed, same inputs → byte-identical trace sequence, including effect ordering.

### Pre-commit minimum (NFP standard)

- `npm test` — all tests pass.
- `npx tsc --noEmit` — type check clean.
- `npx vite build` — production build succeeds.
- Additionally: run `npm run cli -- --seed 42`, `tick 30`, verify `traces` command shows the new categories appear in a real session run.

---

## NFP Compliance

| NFP | Status | Note |
|-----|--------|------|
| 1. Tunability | **PASS** | Three new constants in `constants.ts`; no inline magic numbers. |
| 2. Inspectability | **PASS** | Six new trace categories + promoted `effectiveTargetId` fields on existing traces. Every branch traces. |
| 3. Determinism | **PASS** | No PRNG use in aftermath today; none introduced. Target resolution is deterministic priority order. |
| 4. Fail-soft | **PASS** | §E7 covers every failure mode with an explicit trace-and-skip policy; no throws except the programming-error runtime-undefined case. |
| 5. Narrative over mechanical perfection | **PASS** | Witness fan-out, faction targeting, and condition CRUD are all authored specifically to let fiction land on the right entities. `reputation_set` exists purely because fiction sometimes demands "rep is now X," not "rep goes down." |
| 6. Additive over destructive | **PASS** | Every existing effect shape continues to work; actor fallback preserved. No renamed fields; new fields are all optional. |
| 7. Performance budget | **PASS with note** | Witness fan-out is bounded by `MAX_RECENT_EVENTS` per witness and typical witness lists are <10. Condition edge writes are O(1). Target resolver is a short priority chain. No hot-path changes. **Note:** if Phase 2+ authoring pushes witness lists into the hundreds, revisit the single-event-with-witness-list vs per-agent-buffer tradeoff. |

---

## Three-pillar coverage

- **Engine:** schema additions, handler refactor, target resolver, runtime threading, new constants, six new trace categories. §E1–E7.
- **Content:** JSDoc authoring-surface updates, three gold-standard example templates, migration-guidance pass for Phase 2+, lint hook in THR-129 audit script. §C1–C4. No generic content required; future templates opt in.
- **UI:** DebugPanel filter additions and target rendering; Chronicle witness attribution on expanded rows; Agent-detail condition-source tooltip. No new modals. §U1–U4.

---

## Deferrals (open on close)

D1. **Witness auto-derivation from sublocation co-presence.** Today witnesses are explicit. Eventually the engine should auto-add agents in the actor's sublocation (or within sight radius) to the witness list. S.
D2. **Faction-held intelligence records.** `intelligence` with `targetFactionId` is rejected in v1 because factions have no `intelligenceRecords` surface. If Phase 2 guild content needs "the guild knows X," open this. M.
D3. **Hidden marks on factions.** Same reason as D2. If Phase 2+ ends up wanting faction-scale marks, open this. M.
D4. **Per-agent `recentEvents` buffer fan-out.** Today `recentEvents` is a global array. If balance telemetry or agent-detail UI grows to want per-agent memory slices, introduce agent-scoped buffers. Touches many call sites — non-trivial. L.
D5. **Cross-target chained effects / query-based targeting.** The `targetAgentId` API is explicit only. Eventually authors may want "all members of faction X", "everyone with condition Y". Design and implement a small query DSL. L.
D6. **`apply_condition` → `Condition` entity with its own lifecycle phase.** Current design piggybacks on `has_trait` edges. If conditions need properties outside the edge surface, build a first-class Condition node type. M.
D7. **Aftermath overlay target attribution.** If a player-facing overlay surfaces effects textually, update it to show target attribution (see §U3). Depends on whether that overlay exists and how much of it surfaces effect-level detail. S–M.
D8. **Faction-to-faction reputation model.** `targetFactionId` currently mutates the faction node's `reputationScore`; it does not model "faction A's standing with faction B." Separate design needed. L.

---

## Claude Code coordination (for the handoff comment)

- **Suggested model:** `sonnet` — engine schema + handler refactor + trace/contract test updates; shape well understood, no novel architecture.
- **Parallel-safe with:** THR-113 *after* THR-113 merges (shared `encounterAftermath.ts` edits). In practice: wait for THR-113 merge to main before branching THR-114.
- **Mutex with:** THR-113 (both edit `src/engine/encounterAftermath.ts` and `src/types/unifiedAction.ts`). Sequence: 112 → 113 → 114.
- **Codex review:** yes. Reasons: (1) runtime signature change with StrictMode concern (see D7) is exactly where THR-112 was flagged (THR-133 deferral); (2) condition-lifecycle integration with existing attachment pipeline has non-obvious interactions worth a second pass; (3) faction-reputation-on-node is a new property shape and deserves review against NFP #6.

---

## Links

- Parent plan: `Docs/plans/2026-04-16-encounter-template-migration.md`
- Sibling (Done): `Docs/plans/2026-04-17-thr-112-hidden-mark-revelation.md`
- Sibling (Ready for Dev): `Docs/plans/2026-04-17-thr-113-intelligence-consumption.md`
- Systemic wiring guide (requires correction pass after this lands): `Docs/plans/2026-04-16-systemic-wiring-guide.md`
- Wiring checklist: `Docs/plans/wiring-checklist.md`
