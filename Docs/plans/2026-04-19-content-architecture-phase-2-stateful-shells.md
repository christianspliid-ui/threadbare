# Content Architecture Phase 2 · Stateful Shells — Implementation Plan

**Date:** 2026-04-19
**Linear:** THR-53
**Project:** Content Architecture (Now)
**Depends on:** Phase 1 Core Primitives (THR-7 ✅, THR-14 choice_set ✅, THR-57 resource_delta ✅, THR-58 action_trigger ✅)
**Design seeds:** `Docs/plans/2026-04-03-procedural-content-component-library-foundation-plan.md`, `Docs/plans/2026-04-03-clearance-gate-proto-primitive-pattern.md`
**Target state transitions:** Idea → In Design (this doc) → Implementation Planning → Ready for Dev

---

## Purpose

Phase 1 shipped six authored primitives (`test_shaper`, `prevent_loss`, `content_grant`, `resource_delta`, `action_trigger`, `choice_set`). They are stateless — they fire once and produce a deterministic effect. Phase 2 adds **stateful shells**: authored wrappers that carry lifecycle state across ticks or across multiple resolution attempts. Without stateful shells every encounter that wants scrutiny, proof, armed/disarmed, or tiered outcomes has to either fake it in bespoke code or fall back to a binary primitive.

Phase 2 delivers the four shell concepts from the foundation plan:

1. **`flip_table`** — binary (or small-N) state flip. Armed/disarmed, masked/unmasked, sealed/breached. Revealed variant draws from a seeded authored pool.
2. **`clearance_gate`** — scrutiny shell with states (`pending/cleared/flagged/exposed/compromised/unresolved`) and signal reveals. Partially landed for Gate Duty; this phase promotes it to a reusable primitive with ≥3 proof encounters.
3. **Duplicate-gain policy** — how an attachment behaves when granted to an actor who already holds it (`stack | refresh | flip | worsen | ignore`).
4. **Result bands** — map a numeric outcome margin onto tiered reward brackets so a single template can author graceful win-more / loss-less outcomes.

The three-pillar contract (Engine + Content + UI) is non-negotiable. Phase 2 produces a proof pack that exercises every new capability in at least one user-facing context.

---

## Current State Snapshot (what already exists, what's missing)

### Already landed (pre-Phase-2 spot work)

- `src/types/contentShells.ts` — `ClearanceGateState`, `ClearanceGateConfig`, `ClearanceSignalConfig`, `ClearanceGateTransitionRule`, `ClearanceGateRuntimeState`, `ClearanceGateTransitionRecord`.
- `src/engine/clearanceGate.ts` — `initializeClearanceGates`, `applyClearanceGateStepOutcome`, `summarizeClearanceGateUpdates`, `getClearanceGateState`.
- `GameState.clearanceGateStates?: Map<string, ClearanceGateRuntimeState>` on `src/types/gameState.ts` (line 201).
- `UnifiedActionTemplate.clearanceGates?` slot on `src/types/unifiedAction.ts` (line 685) and mirror on `EncounterPacket` (line 252 of `encounter.ts`).
- One proof-pack encounter wired: `cg.quest.gate_duty` via `buildGateDutyEncounterStageModel.ts` and `ClearanceGatePanel.tsx`.
- Trace fields on records (`ClearanceGateTransitionRecord`) but no structured trace category emitted yet.

### Phase 2 scope (this plan)

Everything Phase 2 is supposed to cover that is **not yet in the tree**:

- `flip_table` shell — types, runtime, authored variants, duplicate-gain interaction.
- Formal `DuplicateGainPolicy` field on `AttachmentTemplate` + runtime enforcement at grant time.
- `ResultBandConfig` on `UnifiedActionTemplate` (`bands`, `threshold`, `effects[]`) + resolver integration.
- A second and third `clearance_gate` proof — Letters of Introduction (social admission) and one exoneration/accusation encounter — to satisfy the "≥3 scenario families" acceptance bar.
- A unified `effect_shell` trace category with subcategories (`reveal`, `flip`, `gate_transition`, `band_selected`, `duplicate_policy_applied`).
- UI surfaces for the new shells: `AttachmentsTab` badges for flip state / clearance state / band-tier labels, DebugPanel lifecycle viewer, Chronicle events for reveal/flip/band-selection.
- Wiring-checklist update and systemic-wiring-guide update so content authors know these capabilities exist.

---

## Design Principles (for this slice)

1. **Reuse-first.** Shells bind to support-bundle objects, not hard-coded node ids. `clearance_gate` already honors this; `flip_table` must follow suit for any per-variant bound subject.
2. **Additive-only (NFP #6).** Existing effect types, resolver hooks, and runtime state stay shaped as today. Phase 2 adds new optional fields; no rename, no breaking consumer signatures.
3. **Shell runtime is a pure reducer over `effectStates` and the new `contentShellStates`.** No hidden coupling. The same tick phase that owns attachments owns shells.
4. **Fail-soft (NFP #4).** Missing flip variant → keep the current state and emit trace. Unknown duplicate-gain policy → default `refresh`. Missing result band → fall back to the nearest lower band; if none, fall back to the template's existing single-outcome effect list.
5. **Deterministic (NFP #3).** Any stochastic selection (flip variant pick, band tie-break) uses a keyed PRNG stream derived from `(seed, tick, templateId, actorId, shellId)`.
6. **Inspectable (NFP #2).** Every shell state change emits an `effect_shell` trace with before/after and the authoring source.

---

## Engine Pillar

### 1. Shared shell types — extend `src/types/contentShells.ts`

Additive file-level additions. No changes to the existing `ClearanceGate*` exports.

```ts
// ─── Flip Table ──────────────────────────────────────────────────
export type FlipTableState =
  | 'front'
  | 'flipped'
  | 'revealed';

export interface FlipTableVariant {
  readonly key: string;
  /** Weight for seeded random pick; omit for uniform. */
  readonly weight?: number;
  /** Effects that apply while this variant is the revealed face. */
  readonly onRevealedEffects?: readonly import('./effects').AttachmentEffect[];
  /** Authored label used by UI and enrichProse() — e.g. "armed", "contaminated", "innocent". */
  readonly label: string;
  /** Optional authored prose body consumed by enrichProse. */
  readonly revealProseKey?: string;
  readonly tags?: readonly string[];
}

export interface FlipTableConfig {
  readonly id: string;
  /** Binding key into the encounter/attachment support bundle (optional — may be unbound). */
  readonly subjectBindingKey?: string;
  /** Authored variants for the flipped face. At least one must be present. */
  readonly variants: readonly FlipTableVariant[];
  readonly initialState?: FlipTableState;     // default 'front'
  readonly flipTrigger: FlipTableFlipTrigger; // see below
  readonly revealPolicy?: 'immediate' | 'on_trigger';
  /** Optional steering when used on attachments: what revealedVariantKey to seed with. */
  readonly preselectVariantKey?: string;
  readonly persistence: 'scene-only' | 'must-persist';
}

export type FlipTableFlipTrigger =
  | { readonly kind: 'step_outcome'; readonly stepIndex: number;
      readonly outcomes: readonly ClearanceGateOutcome[] }
  | { readonly kind: 'attachment_gained' }
  | { readonly kind: 'manual' };

export interface FlipTableRuntimeState {
  readonly runtimeId: string;
  readonly templateId: string;
  readonly flipId: string;
  readonly ownerActorId: string;
  readonly anchorAttachmentId?: string;
  readonly state: FlipTableState;
  readonly revealedVariantKey?: string;
  readonly lastUpdatedTick: number;
}

// ─── Duplicate-Gain Policy ───────────────────────────────────────
export type DuplicateGainPolicy =
  | 'stack'     // increment stacks (effect shell decides cap)
  | 'refresh'   // reset durations / cooldowns only
  | 'flip'      // trigger a flip_table variant reveal
  | 'worsen'    // apply authored worsen-effects
  | 'ignore';

export interface DuplicateGainWorsenRule {
  readonly maxApplications?: number;
  readonly effectsPerReapply: readonly import('./effects').AttachmentEffect[];
}

// ─── Result Bands ────────────────────────────────────────────────
export interface ResultBandConfig {
  readonly id: string;
  /** Numeric lower bound on margin/score. Bands are sorted descending; the first band whose
   *  threshold is <= margin applies. Margin semantics match the unified outcome ladder. */
  readonly threshold: number;
  readonly label: string;
  readonly outcomeBand: 'critical_success' | 'success' | 'success_at_cost' | 'failure' | 'critical_failure';
  readonly effects: readonly import('./effects').AttachmentEffect[];
  readonly followOnTags?: readonly string[];
}

export interface ResultBandSelectionRecord {
  readonly tick: number;
  readonly actorId: string;
  readonly templateId: string;
  readonly margin: number;
  readonly selectedBandId: string;
  readonly selectedLabel: string;
  readonly selectedOutcomeBand: ResultBandConfig['outcomeBand'];
}
```

### 2. Runtime module — new `src/engine/effectShellRuntime.ts`

A single module owns the reducer surface for Phase 2 shells. It exports:

- `initializeFlipTables(existingStates, template, bindings, owner, tick)` — mirror of `initializeClearanceGates`.
- `applyFlipTableTrigger(existingStates, runtimeId, trigger, rng, tick)` — deterministic variant pick via PRNG; returns `{ nextStates, transition }`.
- `resolveDuplicateGain(existingAttachment, incomingTemplate, actor, rng, tick)` — returns `{ action: 'skip' | 'stack' | 'refresh' | 'apply_worsen' | 'trigger_flip'; payload? }`.
- `selectResultBand(template, margin)` — pure band selector returning `ResultBandConfig | undefined`.
- `summarizeShellUpdates(updates)` — human-readable log line for chronicle/trace.

This module is the single import point for the orchestrator and for `unifiedActionResolution`. No shell logic leaks elsewhere.

### 3. GameState additions

Additive fields only:

```ts
// src/types/gameState.ts (additions)
flipTableStates?: Map<string, import('./contentShells').FlipTableRuntimeState>;
resultBandHistory?: Array<import('./contentShells').ResultBandSelectionRecord>;
```

### 4. Orchestrator wiring

- **Grant-time (attachment application in `phaseAttachmentApplication` or the reward resolver):** consult `resolveDuplicateGain` before appending a new attachment. On `refresh`/`stack`/`flip`, mutate the existing attachment via the shell runtime, do not push a duplicate. On `ignore`, short-circuit. Emit `effect_shell` trace with `kind: 'duplicate_policy_applied'`.
- **Resolution time (`unifiedActionResolution.ts`):** after computing margin but before emitting rewards, call `selectResultBand(template, margin)`. If a band matches, replace the single effect list with the band's effects. Emit `effect_shell` trace `kind: 'band_selected'` and push `ResultBandSelectionRecord` onto `resultBandHistory`.
- **Step-outcome time:** after `applyClearanceGateStepOutcome` runs, also run `applyFlipTableTrigger` for flips whose trigger is `{ kind: 'step_outcome', ... }`. This keeps shell transitions in a predictable order: clearance first, flip second.

### 5. PRNG callouts (NFP #3)

| Use | RNG key | Notes |
|---|---|---|
| Flip variant pick | `(seed, tick, 'flip_table', templateId, runtimeId)` | Weighted by `FlipTableVariant.weight`; stable across reruns. |
| Duplicate-worsen tie-break | `(seed, tick, 'duplicate_gain', templateId, actorId)` | Only used when worsen rule has an authored choice table. |
| Result band tie on exact threshold | `(seed, tick, 'result_band', templateId, actorId)` | Tie resolves deterministically via sorted band id; PRNG only applies if two bands share a threshold (authors should not do this; flag via lint). |

### 6. Trace category

Add a single discriminated trace — one category, multiple subtypes — to keep `effectShellRuntime` the only emitter.

```ts
export type EffectShellTrace =
  | { kind: 'effect_shell'; subkind: 'flip_revealed'; tick: number; actorId: string;
      runtimeId: string; templateId: string; flipId: string; variantKey: string;
      previousState: FlipTableState; nextState: FlipTableState }
  | { kind: 'effect_shell'; subkind: 'gate_transition'; tick: number; actorId: string;
      runtimeId: string; previousState: ClearanceGateState; nextState: ClearanceGateState;
      revealedSignals: readonly string[]; followOnTagsAdded: readonly string[] }
  | { kind: 'effect_shell'; subkind: 'band_selected'; tick: number; actorId: string;
      templateId: string; margin: number; selectedBandId: string;
      selectedOutcomeBand: ResultBandConfig['outcomeBand'] }
  | { kind: 'effect_shell'; subkind: 'duplicate_policy_applied'; tick: number; actorId: string;
      templateId: string; policy: DuplicateGainPolicy; outcome: 'stacked' | 'refreshed' | 'flipped' | 'worsened' | 'ignored' };
```

Reused by DebugPanel, chronicle, and tests.

### 7. Fail-soft table

| Failure | Behavior | Trace |
|---|---|---|
| Flip trigger fires but no variants authored | Keep `state='front'`, emit `effect_shell/flip_revealed` with `variantKey='__none__'`, log warning once per template | `console.warn` (dev only) + trace |
| Duplicate-gain policy field missing | Default to `refresh` | `duplicate_policy_applied` with `policy: 'refresh'`, `outcome: 'refreshed'` |
| Worsen rule authored but `maxApplications` reached | Silently degrade to `refresh` | trace `duplicate_policy_applied` with `outcome: 'refreshed'` + note |
| Margin matches no band | Fall back to template's existing `onResolve` effect list (pre-band behavior) | trace `band_selected` with `selectedBandId: '__fallback__'` |
| Clearance transition config references unbound witness | Transition still applies; missing witnesses omitted from `witnessNodeIds` | existing `gate_transition` trace |
| `flipTableStates` map missing entirely | Initialize empty; all lookups return `undefined`, downstream reduces to no-op | no trace |

### 8. Constants table (extend `src/data/effect-constants.ts`)

| Constant | Default | Purpose |
|---|---|---|
| `MAX_FLIP_VARIANTS_PER_TEMPLATE` | 6 | Authoring sanity cap; lint flag if exceeded. |
| `DEFAULT_DUPLICATE_GAIN_POLICY` | `'refresh'` | Used when template omits `duplicateGainPolicy`. |
| `DEFAULT_RESULT_BAND_COUNT` | 3 | Hint used by authoring tooling; no runtime enforcement. |
| `RESULT_BAND_FALLBACK_ID` | `'__fallback__'` | Sentinel value recorded when no band matches. |
| `DUPLICATE_WORSEN_DEFAULT_MAX` | 3 | Default `maxApplications` when worsen rule omits it. |

---

## Content Pillar

Phase 2 ships a proof pack that exercises every new capability. No hardcoded fiction — prose routes through `enrichProse()` and shell state informs placeholder substitution per the systemic wiring guide.

### Clearance-gate proof pack (completes the "≥3 scenario families" bar)

1. **`cg.quest.gate_duty`** — already wired. Verify Phase 2 runtime changes don't regress it.
2. **`cg.social.letters_of_introduction`** — new. Courtier seeks admission to a noble court. Subject = letter of introduction (attachment), authority = seneschal (support bundle NPC), witnesses = two courtiers. States: `pending → cleared | flagged | exposed`. Signals: forged seal (hidden), endorsement match (known), peer recognition (hidden, revealed on success_at_cost). Follow-on tags drive one downstream encounter (`cg.social.court_audience`) in the hex.
3. **`cg.legal.false_accusation_exoneration`** — new. Actor is accused; the clearance_gate subject is the actor themselves. Authority = tribunal scribe. Witnesses = at least one faction-member from a prior relationship edge. States: `pending → cleared | compromised | exposed`. Signals: contradictory witness (hidden), planted evidence (hidden), prior reputation (known). Result band + follow-on both participate.

### Flip-table proof pack

1. **`attachment.trap.pressure_plate`** — `front` = inert, `flipped` → variant pick from `{'spike', 'alarm', 'collapsing', 'silent'}`. Trigger: agent entering the trapped sublocation (attachment-gained by a proximity hook). This proves the attachment-side flip.
2. **`encounter.shrine.sealed_relic`** — `front` = sealed, `flipped` → `{'blessed', 'cursed', 'hollow'}`. Trigger: encounter step success on reveal step. Proves encounter-side flip with step_outcome trigger.
3. **`attachment.cache.hidden_cargo`** — `front` = declared, `flipped` → `{'contraband', 'legitimate', 'planted'}`. Trigger: clearance_gate step reveal. Proves flip triggered by a clearance_gate outcome (cross-shell composition).

### Duplicate-gain proof pack

Four attachment templates, one per policy:

1. **`attachment.blessing.vigil_ward`** — `duplicateGainPolicy: 'refresh'`. Reapplying resets the duration. Single short test confirms no stack growth.
2. **`attachment.curse.cumulative_debt`** — `duplicateGainPolicy: 'stack'`. Proves stacking primitive integration with existing `StackingEffect`.
3. **`attachment.secret.exposed_deed`** — `duplicateGainPolicy: 'flip'`. Second gain triggers an embedded `flip_table` reveal (e.g., now public knowledge).
4. **`attachment.injury.lingering_wound`** — `duplicateGainPolicy: 'worsen'`. Each reapply applies a `worsenEffects` list (e.g., extra penalty, reduced healing).
5. **`attachment.trait.founder_mark`** — `duplicateGainPolicy: 'ignore'`. Proves idempotent grants.

### Result-band proof pack

Two templates exercise the selector from different angles:

1. **`spell.moonlit.judgment`** — a spell whose margin drives a 5-band outcome. Bands: `crit_success | success | success_at_cost | failure | crit_failure`. Each band authors distinct effects (reach bonuses, condition grants, doom drift). Proves the full 5-band shape.
2. **`encounter.trial.by_oath`** — an encounter whose margin derives from social reach + witness count. Uses 3 bands (`success | success_at_cost | failure`) to keep content authoring approachable. Proves the "pick the first band whose threshold is ≤ margin" rule.

### Authoring guidance

Update `Docs/plans/2026-04-16-systemic-wiring-guide.md` with three new short sections:

- "Duplicate-gain: choose a policy" — decision tree `ignore → refresh → stack → worsen → flip`.
- "Flip tables: variant authoring" — weights, labels, prose keys, how `preselectVariantKey` interacts with determinism.
- "Result bands: ladder authoring" — threshold spacing recommendations, 3-band vs 5-band guidance, fallback semantics.

---

## UI Pillar

No new modal. Every surface extends an existing one.

### `AttachmentsTab` (EntityCard)

- Add a `ShellBadgeRow` under each attachment card that renders:
  - **Clearance badge** — `Pending` (gray) / `Flagged` (amber) / `Exposed` (red) / `Cleared` (green) / `Compromised` (slate) / `Unresolved` (blue).
  - **Flip badge** — `Armed` / `Revealed: {label}` / `Inert`, colored by variant tag.
  - **Band indicator** (on most recent resolution only) — small pill showing the selected outcome band label.
- Tooltip on each badge shows the last transition tick and summary.

### Chronicle (`ChroniclePanel`)

Extend the chronicle formatter to render `effect_shell` traces. Entries:

- `Flip revealed` → "`{subject}` reveals itself as `{variant.label}`." (enrichProse key `effect_shell.flip.{variantKey}` with fallback template).
- `Gate transition` → "`{subject}`'s clearance `{previousState} → {nextState}`." plus signals revealed in parens.
- `Band selected` → "Outcome: `{selectedLabel}` (margin `{margin}`)." — appears only for encounters where the template opts into band prose.
- `Duplicate policy applied` → Chronicle-suppressed by default unless `outcome === 'worsened' || 'flipped'` (the policies that meaningfully change state).

### DebugPanel

Add a sub-tab `Shells` with three mini-viewers:

- **Clearance Gates** — table of `{runtimeId, state, revealedSignalKeys, attempts, lastUpdatedTick}`; click → jump to owning agent/location.
- **Flip Tables** — table of `{runtimeId, state, revealedVariantKey, ownerActorId}`.
- **Result Band History** — most recent 50 selections across all templates, sortable by tick.

The viewer is a pure read of `GameState.clearanceGateStates`, `GameState.flipTableStates`, `GameState.resultBandHistory`.

### HexMapV2 (minimal)

No new overlay. Clearance/flip/band states live inside encounters and attachments, which already surface via existing agent/location panels. Adding a hex-level signifier for "unresolved clearance here" is explicitly **deferred** (out of Phase 2 scope) and will be raised as a follow-on issue if playtesting shows it's needed.

### Player controls

No new controls. The player's interaction remains through the encounter stage and the action drawer, both of which already route through `unifiedActionResolution`. Shells add information density, not new inputs.

---

## Wiring Section (per `Docs/plans/wiring-checklist.md`)

For each new module, confirm all six wiring points exist before calling Phase 2 done:

| Capability | Orchestrator phase | UI component | GameState flow | Traces | Debug visibility | Prose pipeline | Player controls |
|---|---|---|---|---|---|---|---|
| `flip_table` | `phaseEffectShells` (new, runs after `phaseAttachmentApplication` and after `phaseEncounterStepResolution`) | `AttachmentsTab` flip badge, chronicle entry | `flipTableStates: Map` | `effect_shell/flip_revealed` | DebugPanel "Shells" tab | `enrichProse('effect_shell.flip.*')` | n/a |
| `clearance_gate` (reusable) | existing `unifiedActionResolution` step-outcome hook | `ClearanceGatePanel` (extend), `AttachmentsTab` clearance badge | `clearanceGateStates: Map` | `effect_shell/gate_transition` | DebugPanel "Shells" tab | `enrichProse('effect_shell.gate.*')` | existing encounter UI |
| `duplicate_gain` | `phaseAttachmentApplication` pre-apply hook | Chronicle entry for `worsen`/`flip` outcomes | n/a (mutates existing attachment) | `effect_shell/duplicate_policy_applied` | DebugPanel "Shells" tab sidebar counter | `enrichProse('effect_shell.duplicate.*')` | n/a |
| `result_bands` | `unifiedActionResolution` post-margin hook | Chronicle band entry | `resultBandHistory: Array` | `effect_shell/band_selected` | DebugPanel "Shells" tab | `enrichProse('effect_shell.band.*')` | n/a |

Update `Docs/plans/wiring-checklist.md` with these four rows.
Update `Docs/plans/2026-04-16-systemic-wiring-guide.md` to document shells as a seventh engine capability (alongside the existing six: enrichment, seeding, hidden marks, reputation, graph ops, intelligence, divine intervention).

---

## Acceptance Bar

Phase 2 is not done until:

- [ ] `flip_table` shell authored, wired to orchestrator, tested across all three proof templates.
- [ ] `clearance_gate` operates as a reusable primitive — at least three scenario families (`cg.quest.gate_duty`, `cg.social.letters_of_introduction`, `cg.legal.false_accusation_exoneration`) resolve to distinct observable outcomes with the same runtime.
- [ ] Duplicate-gain policy authored for all five proof attachments; runtime consults the policy before every grant; trace visible in DebugPanel.
- [ ] Result bands select deterministically and reproduce the same band for the same seed+margin in 10/10 runs.
- [ ] All shells emit `effect_shell` traces and appear in DebugPanel "Shells" tab.
- [ ] Chronicle renders at least one human-readable event per shell category when the proof-pack encounters run.
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` all pass.
- [ ] Headless CLI — `npm run cli -- --seed 42 --map medium`, then `run 5` for 30 ticks — produces encounters in all three proof packs and their chronicle entries render without `__ENRICH_MISS__` placeholders.
- [ ] `Docs/plans/wiring-checklist.md` updated; `Docs/plans/2026-04-16-systemic-wiring-guide.md` updated.
- [ ] New constants landed in `src/data/effect-constants.ts`.

---

## Non-Goals (explicit, to prevent scope creep)

- No `task_progress` shell (Phase 3 — THR-54).
- No service retainers (Phase 3 — THR-54).
- No starter libraries built on top of shells (Phase 4 — THR-55).
- No governance rules for shell stacking caps (Phase 5 — THR-56).
- No hex-level overlays for clearance/flip state (deferred, will raise follow-on issue if needed).
- No migration of existing ad-hoc trap/reveal code — new shells only.

---

## Constants Summary (NFP #1)

| Constant | Default | Location | Purpose |
|---|---|---|---|
| `MAX_FLIP_VARIANTS_PER_TEMPLATE` | 6 | `effect-constants.ts` | Lint cap |
| `DEFAULT_DUPLICATE_GAIN_POLICY` | `'refresh'` | `effect-constants.ts` | Fallback policy |
| `DEFAULT_RESULT_BAND_COUNT` | 3 | `effect-constants.ts` | Authoring hint |
| `RESULT_BAND_FALLBACK_ID` | `'__fallback__'` | `effect-constants.ts` | Sentinel |
| `DUPLICATE_WORSEN_DEFAULT_MAX` | 3 | `effect-constants.ts` | Worsen cap |

All values are tunable without code changes.

---

## Trace Contract (NFP #2)

One category `effect_shell` with four subkinds (`flip_revealed`, `gate_transition`, `band_selected`, `duplicate_policy_applied`). Each trace carries enough context to reconstruct the decision: template id, runtime id, actor id, previous/next state, seed-derived key. Inspectable via DebugPanel "Shells" tab and via `window.__DEBUG.exportDiagnostics()`.

---

## Fail-Soft Contract (NFP #4)

See the fail-soft table in the Engine section. The tick loop must never throw because of a shell misconfiguration; every failure mode degrades to a no-op or a documented fallback and emits a trace.

---

## NFP Compliance Summary

| NFP | Status | Note |
|---|---|---|
| #1 Tunability | PASS | Five new named constants; no magic numbers in runtime. |
| #2 Inspectability | PASS | Single trace category `effect_shell` with four discriminated subkinds; DebugPanel sub-tab. |
| #3 Determinism | PASS | PRNG callouts table documents every stochastic decision; selections reproducible per `(seed, tick, templateId, runtimeId)` key. |
| #4 Fail-soft | PASS | Fail-soft table covers every authored failure mode; tick loop never throws on shell misconfig. |
| #5 Narrative over mechanical | PASS with note | Chronicle entries use `enrichProse()` keys; flip and band labels flow through the prose pipeline. Note: authors must provide prose keys — missing keys fall back to generic templates, not placeholder tags. |
| #6 Additive over destructive | PASS | Every type and runtime field is new. Existing signatures unchanged. |
| #7 Performance | PASS with note | Shell lookups are `Map.get` per template per tick — O(attachments × shells) worst case. Note: If the `Shells` DebugPanel sub-tab becomes a hot render path during live sim, virtualize or gate behind an explicit "expand" toggle before calling Phase 2 done. |

---

## Recommended Slice Order (for the executor)

1. Land shared types (`FlipTableConfig`, `DuplicateGainPolicy`, `ResultBandConfig` + runtime state shapes) in `contentShells.ts`.
2. Add `effectShellRuntime.ts` with pure functions and unit tests.
3. Wire `phaseEffectShells` orchestrator phase; bump `worldVersion` / `structuralCacheVersion` only if shell state mutation affects structural caches (it should not).
4. Add `flipTableStates` + `resultBandHistory` to GameState. Tests: determinism on flip variant pick; band selector edge cases.
5. Build authoring proof pack (content files) — add content before UI so the UI has real data to render.
6. Extend `AttachmentsTab`, chronicle formatter, DebugPanel sub-tab.
7. Update `Docs/plans/wiring-checklist.md` and `Docs/plans/2026-04-16-systemic-wiring-guide.md`.
8. Run headless CLI smoke + full test suite; fix any regressions.
9. Commit with `Fixes THR-53` in the body.

---

## Lessons carried from the seed documents

From `2026-04-03-procedural-content-component-library-foundation-plan.md`:

- Keep shell runtime separate from encounter-specific authoring. Phase 2 honors this by putting all reducers in `effectShellRuntime.ts`, with encounter packets and attachment templates only declaring `FlipTableConfig` / `ResultBandConfig` / `duplicateGainPolicy`.

From `2026-04-03-clearance-gate-proto-primitive-pattern.md`:

- Reuse-first binding and subject-specific state. `clearance_gate` already follows this. `flip_table` inherits the pattern via `subjectBindingKey`.
- Acceptance bar requires ≥3 scenario families for any shell we call a primitive. Phase 2 delivers that for `clearance_gate` and creates the hook to extend `flip_table` to more content families in Phase 3+ without runtime changes.

The shell shape is intentionally conservative: we are adding the four shells from the foundation plan and nothing more. If playtesting reveals a missing shell (e.g., a `countdown` or `auction`), that becomes a Phase 2b or a new issue — not a silent expansion of this one.
