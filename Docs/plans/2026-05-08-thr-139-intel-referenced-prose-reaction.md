# THR-139 — Authored `intel_referenced_prose` aftermath reaction variant

**Linear issue:** THR-139
**Project:** Encounter Format Migration (Urgent, Now)
**Parent:** THR-113 (Intelligence Consumption Pathway — Done). Deferred at parent design time per `Docs/plans/2026-04-17-thr-113-intelligence-consumption.md` §Goal "non-goals for v1: No authored 'used intelligence' prose variants — just the placeholder/conditional surface".
**Sibling already shipped:** THR-140 (intel-derived difficulty bonus). Same parent, complementary surface.
**Effort size:** S (engine: ~one new effect kind + dispatcher case + helper; content: ~24 prose lines on 2–3 pilot templates; tests: ~6 unit cases + 1 integration).
**Audience:** Claude Code (judgment work — prose authoring + integration choices); model:opus-4-6 lane to match the Encounter Format Migration project's content workstream.

## Problem

After THR-113 closed the intelligence consumption loop, three surfaces consume `IntelligenceRecord` data:

1. **Encounter scoring** — `encounterScoring.ts` adds `INTEL_SCORING_BONUS` when an actor's records match a candidate. Emits `intelligence_referenced` with `referencedBy: 'scoring_boost'`.
2. **Prose enrichment** — `proseEnrichment.ts` resolves `{intel:category}` placeholders and `{?knows_<category>}…{/knows_<category>}` conditional blocks. Emits `intelligence_referenced` with `referencedBy: 'prose_enrichment'`.
3. **Resolution match** — `observeResolutionIntelligence()` runs at action resolution and emits `intelligence_referenced` with `referencedBy: 'resolution_match'`.

All three are *passive* — they trace and they nudge. None of them produces an authored chronicle line that says "the rumor paid off" when the intel actually mattered. From the player's seat, intel use is invisible: scoring is a quiet probability shift, the placeholder shim only fires if a template already had `{intel:…}` baked in, and the resolution-match trace lives in DebugPanel.

THR-139 closes that gap by adding a fourth consumption surface: an authored aftermath reaction effect that, when present on a reaction and the actor's records match, appends a chronicle-visible `TickEvent` whose prose variants are picked by reliability tier. Authors get a first-class "intel paid off" channel that scales with how trustworthy the intel was.

The reserved `reaction` parameter on `observeResolutionIntelligence` (`src/engine/intelligence.ts:358`, comment at line 402) is exactly the hook this design exposes.

## Goal

Ship a new `EncounterAftermathReactionEffect` variant — `kind: 'intel_referenced_prose'` — that:

1. Is **content-driven**: authors opt in by adding it to a reaction. No template-walking content pass needed for v1.
2. Matches against the actor's intelligence records using the existing `findActionableIntelligence()` predicate, gated by an authored `category: IntelligenceCategory`.
3. Picks one of three authored prose variants (`reliable` / `uncertain` / `dubious`) by the matched record's reliability band.
4. Fan-outs to chronicle as a `TickEvent` via the existing `recent_event` plumbing (no new chronicle path).
5. Emits `intelligence_referenced` with a new `referencedBy: 'aftermath_prose'` discriminator.
6. Fail-soft: if no record matches, the effect no-ops silently. No exception, no chronicle line, no trace beyond the per-effect skip note.

**Non-goals for v1:**

- **No removal/decay of the matched record.** Intelligence is persistent knowledge; this reaction reads but does not consume.
- **No new placeholder syntax.** The authored prose strings still flow through `enrichProse()` and inherit the existing `{name}/{location}/{intel:category}` vocabulary, but no new placeholder is introduced by THR-139.
- **No template-walk content pass.** Content opt-in is *examples on pilot templates* (see Content pillar). A full sweep is a follow-up — see Deferrals.
- **No cross-agent visibility.** The line fires for the actor's intel only. Cross-agent intel flow is THR-142.

## Three-pillar coverage

| Pillar | In scope this ticket |
|---|---|
| Engine | New effect kind, dispatcher case, helper, trace discriminator, fail-soft contract, unit + integration tests |
| Content | Pilot prose authoring: 3 reliability variants × 6 categories × 1–2 templates each = ~36 lines on 2–3 pilot templates |
| UI | None new. Existing chronicle/right-rail surfaces fire automatically via `TickEvent`. DebugPanel `intelligence_referenced` inspector auto-includes the new `referencedBy` value (verified — its renderer keys off the discriminator field, not a hard-coded enum). |

The UI pillar is **N/A by design, not by omission.** The reaction is wired through `recentEvents`/`tickEvents` and `intelligence_referenced` traces — both surfaces already render. We explicitly verify this in tests (Acceptance §A2), not just claim it.

## Engine design

### E1. New effect variant on `EncounterAftermathReactionEffect`

In `src/types/unifiedAction.ts`, append to the `EncounterAftermathReactionEffect` union (after the existing `intelligence` variant at lines 229–241):

```ts
| {
    readonly kind: 'intel_referenced_prose';
    /** Which intelligence category this prose is conditional on. Effect no-ops if the actor has no matching record. */
    readonly category: IntelligenceCategory;
    /**
     * Reliability-tiered prose variants. The matched record's reliability band
     * (`reliable` / `uncertain` / `dubious`) picks which line is appended to
     * `recentEvents`/`tickEvents`. Authors must supply at least `reliable`;
     * `uncertain` and `dubious` are optional and inherit upward when absent
     * (uncertain → reliable; dubious → uncertain → reliable).
     *
     * Use the same enrichment vocabulary as other aftermath prose
     * ({name}, {location}, {intel:category}, etc.) — the message string
     * passes through the standard prose-enrichment path before being
     * stored on the TickEvent.
     */
    readonly prose: {
      readonly reliable: string;
      readonly uncertain?: string;
      readonly dubious?: string;
    };
    /**
     * Optional significance override (0–1). Defaults derived per band:
     *   reliable → INTEL_REFERENCED_PROSE_SIGNIFICANCE_RELIABLE   (0.6)
     *   uncertain → INTEL_REFERENCED_PROSE_SIGNIFICANCE_UNCERTAIN (0.45)
     *   dubious → INTEL_REFERENCED_PROSE_SIGNIFICANCE_DUBIOUS    (0.3)
     */
    readonly significance?: number;
    /** Direct the reference at a specific agent (defaults to actor). */
    readonly targetAgentId?: string;
    readonly when?: EffectPredicate;
  }
```

Notes:
- The variant intentionally lives *next to* `intelligence` (the grant variant) so the union reads chronologically: grant → reference. Easier on author scanning.
- `prose` is a typed object, not a string, to enforce the three-band shape at compile time. Optional bands inherit from a stricter band so simple authoring stays a single line of prose.
- `targetAgentId` participates in the standard `resolveAftermathTarget` priority, so multi-target aftermath (THR-114) keeps working without special-casing.
- `when` participates in the standard predicate gate (see `applyEncounterAftermathReaction` at `encounterAftermath.ts:390`).

### E2. Constants — `src/data/agent-behavior-constants.ts`

Add after `INTEL_DIFFICULTY_BONUS` (lands with THR-140):

```ts
/**
 * Default TickEvent significance for an intel_referenced_prose effect, per
 * reliability band. Authors can override via the effect's `significance` field.
 * @range 0.2–0.8
 */
export const INTEL_REFERENCED_PROSE_SIGNIFICANCE_RELIABLE  = 0.6;
export const INTEL_REFERENCED_PROSE_SIGNIFICANCE_UNCERTAIN = 0.45;
export const INTEL_REFERENCED_PROSE_SIGNIFICANCE_DUBIOUS   = 0.3;

/**
 * Whether the dubious band fires the prose at all. v1 default = true so that
 * dubious intel produces a hedged chronicle line ("a half-remembered rumor
 * suggested..."). Flip to false to suppress dubious lines entirely. Tunable
 * because dubious intel quality is balance-sensitive and may want to be
 * silenced if it produces too much chronicle noise. @range bool
 */
export const INTEL_REFERENCED_PROSE_DUBIOUS_FIRES = true;
```

### E3. Dispatcher case — `src/engine/encounterAftermath.ts`

Add a new `case 'intel_referenced_prose'` to the switch in `applyEncounterAftermathReaction` (current switch begins at line 425). Place it adjacent to the existing `'intelligence'` case so reviewers see the symmetry.

Skeleton (full implementation in the code change, not the plan doc):

```ts
case 'intel_referenced_prose': {
  // Resolve which agent's intel pool we're querying — usually the actor.
  const targetAgentId = effect.targetAgentId
    ?? (target.kind === 'agent' ? target.id : actorAgentId);
  if (!targetAgentId) {
    emitTrace({
      tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
      encounterId, actionId, reactionId: reaction.id, effectIndex: i,
      effectKind: 'intel_referenced_prose',
      effectDetail: { category: effect.category },
      success: false, failReason: 'no_target_agent',
      effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
      summary: `intel_referenced_prose[${i}] skipped: no target agent`,
    });
    break;
  }

  // Fetch records and find the most-recent matching one for the authored
  // category. Reuse findActionableIntelligence-style category match against
  // the action context (templateId/locationId/region).
  const matched = findIntelReferencedProseMatch(
    state, targetAgentId, effect.category, action,
  );
  if (!matched) {
    // Fail-soft no-op. One trace so authors can see "I added the effect but
    // it didn't fire" without ambiguity.
    emitTrace({
      tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
      encounterId, actionId, reactionId: reaction.id, effectIndex: i,
      effectKind: 'intel_referenced_prose',
      effectDetail: { category: effect.category, targetAgentId },
      success: false, failReason: 'no_matching_record',
      effectiveTargetId: targetAgentId, effectiveTargetKind: 'agent',
      summary: `intel_referenced_prose[${i}] no-op: ${targetAgentId} has no actionable ${effect.category} record for ${encounterId}`,
    });
    break;
  }

  const band = reliabilityBand(matched.reliability);
  // Dubious-band suppression switch (E2).
  if (band === 'dubious' && !INTEL_REFERENCED_PROSE_DUBIOUS_FIRES) {
    emitTrace({ /* skipped_by_band trace */ });
    break;
  }
  const proseLine = pickIntelReferencedProseLine(effect.prose, band);
  if (!proseLine) {
    // Author supplied an empty `reliable` string. Treat as no-op.
    emitTrace({ /* skipped_empty_prose trace */ });
    break;
  }

  const significance = effect.significance
    ?? defaultIntelProseSignificance(band);

  const event: TickEvent = {
    id: `enc_after_${reaction.id}_${tick}_${nextRecentEvents.length}`,
    tick,
    type: 'narrative',
    message: proseLine, // enrichment runs upstream in the prose pipeline; same as recent_event
    significance,
    actorId: targetAgentId,
    encounterId,
  };
  nextRecentEvents = appendRecentEvent(nextRecentEvents, event);
  nextTickEvents = [...nextTickEvents, event];

  // Close the loop: the consumption surface emits the trace.
  emitIntelligenceReferenced(tick, targetAgentId, matched.recordId, 'aftermath_prose', {
    templateId: action?.templateId,
    intelCategory: matched.category,
  });

  emitTrace({
    tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
    encounterId, actionId, reactionId: reaction.id, effectIndex: i,
    effectKind: 'intel_referenced_prose',
    effectDetail: {
      category: effect.category, recordId: matched.recordId,
      band, significance, targetAgentId, eventId: event.id,
    },
    success: true,
    effectiveTargetId: targetAgentId, effectiveTargetKind: 'agent',
    summary: `intel_referenced_prose[${i}]: ${targetAgentId} ${effect.category}/${band} → "${proseLine.slice(0, 60)}"`,
  });
  break;
}
```

### E4. Helper functions — `src/engine/intelligence.ts`

Two new exports, kept here so the matching logic stays alongside its sibling consumers:

```ts
/**
 * Find the most-recent intelligence record held by `agentId` of the given
 * category that matches the action's encounter context (locationId /
 * targetAgentId / region / templateId). Mirrors `findActionableIntelligence`
 * but adds a category gate.
 *
 * Returns undefined if the agent has no matching record. Pure / fail-soft.
 */
export function findIntelReferencedProseMatch(
  state: GameState,
  agentId: string,
  category: IntelligenceCategory,
  action: UnifiedAction | undefined,
): IntelligenceRecord | undefined { /* ... */ }

/**
 * Pick the prose line for a given reliability band, with upward inheritance:
 * uncertain → reliable, dubious → uncertain → reliable. Returns the empty
 * string if `reliable` is empty (caller treats as skipped).
 */
export function pickIntelReferencedProseLine(
  prose: { reliable: string; uncertain?: string; dubious?: string },
  band: ReliabilityBand,
): string { /* ... */ }
```

Also extend the `referencedBy` literal union on `emitIntelligenceReferenced` (intelligence.ts:208):

```ts
referencedBy: 'scoring_boost' | 'prose_enrichment' | 'resolution_match' | 'aftermath_prose',
```

…and the matching position on the `intelligence_referenced` trace shape in `src/types/trace.ts:1208`.

### E5. Trace surface

No new trace category. The new `referencedBy: 'aftermath_prose'` discriminator on the existing `intelligence_referenced` category is enough — DebugPanel renders the trace generically and shows whatever string the discriminator carries.

### E6. Constants table

| Constant | Default | Purpose | Range |
|---|---|---|---|
| `INTEL_REFERENCED_PROSE_SIGNIFICANCE_RELIABLE` | `0.6` | Default `TickEvent.significance` for reliable-band lines | 0.2–0.8 |
| `INTEL_REFERENCED_PROSE_SIGNIFICANCE_UNCERTAIN` | `0.45` | Same, uncertain band | 0.2–0.8 |
| `INTEL_REFERENCED_PROSE_SIGNIFICANCE_DUBIOUS` | `0.3` | Same, dubious band | 0.2–0.8 |
| `INTEL_REFERENCED_PROSE_DUBIOUS_FIRES` | `true` | Master suppress switch for dubious-band lines | bool |

### E7. Trace types

| Trace category | Discriminator | Fields | When |
|---|---|---|---|
| `intelligence_referenced` | `referencedBy: 'aftermath_prose'` | existing fields + `intelCategory`, `templateId` | Each successful fire of `intel_referenced_prose` |
| `encounter_aftermath_effect` | `effectKind: 'intel_referenced_prose'` | existing fields + `effectDetail: { category, recordId?, band?, significance?, targetAgentId, eventId? }`; `success: true | false`; `failReason?: 'no_target_agent' \| 'no_matching_record' \| 'skipped_dubious' \| 'skipped_empty_prose'` | Always — one trace per effect fire (success or skip) |

### E8. Fail-soft table

| Failure mode | Fallback behavior |
|---|---|
| No `targetAgentId` resolvable | Skip effect, emit `encounter_aftermath_effect` with `success: false`, `failReason: 'no_target_agent'`. No throw. |
| Agent has no records of `category` | Skip effect, emit trace with `failReason: 'no_matching_record'`. No throw, no chronicle line. |
| Records exist but none match action context | Same as above. |
| Matched record's reliability is dubious AND `INTEL_REFERENCED_PROSE_DUBIOUS_FIRES === false` | Skip effect, emit trace with `failReason: 'skipped_dubious'`. No throw. |
| Author supplied empty `reliable` string | Skip effect, emit trace with `failReason: 'skipped_empty_prose'`. No throw. |
| `when` predicate fails | Existing `aftermath_effect_skipped_by_when` trace fires (no change). |
| `reliabilityBand` receives invalid number | `reliabilityDescriptor` already returns `'dubious'` on NaN/negative — inherit that fallback. |
| Trace emit throws | Caught by outer try/catch on `emitIntelligenceReferenced`; effect application continues (NFP #4 contract preserved). |

## Content design

### C1. Pilot templates

Two templates already grant intelligence and feel narratively right for a "they used the rumor" moment:

1. **`src/data/arcane-circle-encounter-content.ts`** — `cultural_knowledge` and `political_secret` records are granted across multiple reactions. Three pilot reactions get `intel_referenced_prose` follow-ups so an Arcane Circle agent who *previously* learned a fragment of lore visibly references it the next time they enter a relevant encounter. Pilot reactions: pick three from the existing `kind: 'intelligence'` grants (line numbers above) — one for `cultural_knowledge`, one for `political_secret`, one for `agent_network`.
2. **A second pilot to be picked from the `military_position` / `trade_route` / `shrine_location` cluster** during implementation. Codex/CC will pick the highest-trafficked existing template that already has actionable references. The migration phasing plan does not depend on which one — any template that currently emits `intelligence_referenced` traces in a CLI smoke is a valid pilot.

### C2. Authoring shape (per pilot reaction)

Authors add the effect alongside existing aftermath effects:

```ts
{
  kind: 'intel_referenced_prose',
  category: 'cultural_knowledge',
  prose: {
    reliable:  '{name} reads the working with the unhurried recognition of someone who has seen its bones before — the lore came back, exactly as remembered.',
    uncertain: '{name} works half from instinct, half from a half-recalled fragment — the lore returned in pieces, but enough.',
    dubious:   '{name} reaches for the lore they thought they knew. What surfaces is older, and stranger, and not quite what was expected.',
  },
  significance: 0.55,
}
```

### C3. Per-category prose line counts

Author 3-line packs (one per band) for **all six** `IntelligenceCategory` values, even though only 2–3 templates use them in v1. The packs live in `src/data/intelligence-referenced-prose.ts` (new file) so the authored lines are reusable across templates.

| IntelligenceCategory | Pilot lines (reliable / uncertain / dubious) | Total |
|---|---|---|
| `shrine_location` | 4 / 4 / 4 | 12 |
| `agent_network` | 4 / 4 / 4 | 12 |
| `trade_route` | 4 / 4 / 4 | 12 |
| `military_position` | 4 / 4 / 4 | 12 |
| `political_secret` | 4 / 4 / 4 | 12 |
| `cultural_knowledge` | 4 / 4 / 4 | 12 |
| **Total** | | **72 lines** |

The pack is a `Record<IntelligenceCategory, { reliable: string[]; uncertain: string[]; dubious: string[] }>`. Pilot templates pick a line from the pack inline, or compose their own. The pack exists so that subsequent template authors don't have to write fresh prose for every reaction — they get a 4-line library to draw from.

### C4. Voice + length contract

- Threadbare voice (Witness/Poet hybrid). Past-tense, third-person, sphere-tinted where authentic.
- 18–32 words per line. Hard floor 12 (avoid bullet voice), hard ceiling 40.
- Each line stands alone — never references the next reaction step or assumes which choice the player makes.
- `{name}` and `{location}` are encouraged; deeper enrichment (`{ally}/{rival}`) is optional.
- No numbers. Reliability is conveyed by phrasing, not by stats.
- The `dubious` band's prose **explicitly hedges or shows the intel betraying the agent** — the tonal contract is that dubious intel sometimes makes things worse. The line still fires (per `INTEL_REFERENCED_PROSE_DUBIOUS_FIRES = true`) so the player sees the silent miss, not a quiet success.

### C5. Where the pack lives

New file: `src/data/intelligence-referenced-prose.ts`.

```ts
import type { IntelligenceCategory } from '../types/unifiedAction';

export const INTEL_REFERENCED_PROSE_PACK: Record<
  IntelligenceCategory,
  { reliable: readonly string[]; uncertain: readonly string[]; dubious: readonly string[] }
> = {
  shrine_location: {
    reliable: [/* 4 lines */],
    uncertain: [/* 4 lines */],
    dubious: [/* 4 lines */],
  },
  // ... other categories
};
```

Authors pick lines by index when adding the effect to a reaction (`prose: { reliable: INTEL_REFERENCED_PROSE_PACK.cultural_knowledge.reliable[0], ... }`) or write bespoke prose. Both are equally valid.

### C6. Lint guard (deferred but worth flagging)

A future content-lint rule could warn when an `intel_referenced_prose` effect's `category` doesn't match any plausible match-context emitted by the encounter's preceding steps. Out of scope for v1 — see Deferrals.

## UI design

**N/A by design — no new UI surface.**

The reaction surfaces through two existing channels:

1. **Chronicle / right rail** — the `TickEvent` we append to `recentEvents` and `tickEvents` flows through the same renderer that handles `recent_event` aftermath effects today. ChroniclePanel and RightRail/AlertList consume these arrays without discrimination on event source. Verified: `TickEvent.type: 'narrative'` is already supported in the renderer's accepted-types union.
2. **DebugPanel `intelligence_referenced` inspector** — already renders all four (after our change) `referencedBy` discriminator values uniformly. No code change needed.

**Verification step required at closeout:**
- Browser-in-the-loop screenshot at 1920×1080 with `?view=game&seeded` showing a chronicle line whose source is an `intel_referenced_prose` reaction. The plan-doc reviewer pastes this into the closing Linear comment per THR-266 (in flight).

If the renderer turns out to *not* surface this `TickEvent.type: 'narrative'` event correctly (a discovery only verifiable in the browser), the implementer escalates back to Cowork with the screenshot rather than silently fixing the renderer — that's a UI-pillar design change, not an implementation detail.

## Wiring checklist (per `Docs/plans/wiring-checklist.md`)

| Wiring surface | Status |
|---|---|
| Orchestrator phase | No new phase. The reaction runs inside `applyEncounterAftermathReaction`, which is already called from the existing aftermath orchestrator phase. |
| GameState fields | None new. Mutates existing `recentEvents` and `tickEvents` arrays. |
| Modals / GameView JSX | None new. |
| Trace categories emitted | `intelligence_referenced` (existing, new discriminator) + `encounter_aftermath_effect` (existing, new `effectKind`) + `aftermath_effect_skipped_by_when` (existing, no change) |
| Debug visibility | DebugPanel intelligence_referenced inspector already covers this. No change needed. |
| Prose pipeline (`enrichProse()`) | `effect.prose.reliable/uncertain/dubious` strings flow through standard enrichment at the call site (same pattern as `recent_event.message`). |
| Player controls | None new. |
| Wiring checklist update | Add a row under "Aftermath effect kinds" naming `intel_referenced_prose`. |
| Systemic wiring guide | Add a row to the 7-capability table in `Docs/plans/2026-04-16-systemic-wiring-guide.md`: "Intel-referenced prose — close the consumption loop with a player-visible chronicle line." Code authors expanding intelligence content should be pointed here. |

## Tests

| Test type | What it covers | Where |
|---|---|---|
| Unit — match | `findIntelReferencedProseMatch` finds correct record by category + targetEntityId | `src/engine/__tests__/intelligence.referencedProse.test.ts` |
| Unit — match | Same, by category + targetRegion | same file |
| Unit — match | Same, by category + templateId substring | same file |
| Unit — match | Returns undefined when agent has zero records of category | same file |
| Unit — band | `pickIntelReferencedProseLine` picks correct band, with upward inheritance | same file |
| Unit — dispatcher | Reaction with `intel_referenced_prose` and matching record appends correct `TickEvent` to `recentEvents` and `tickEvents` | `src/engine/__tests__/encounterAftermath.intelReferencedProse.test.ts` |
| Unit — dispatcher | Reaction with no matching record emits skip trace and does not append event | same file |
| Unit — dispatcher | Reaction with `INTEL_REFERENCED_PROSE_DUBIOUS_FIRES = false` and dubious record skips the line | same file |
| Unit — dispatcher | Reaction with empty `reliable` string skips and emits `failReason: 'skipped_empty_prose'` | same file |
| Unit — trace | Successful fire emits `intelligence_referenced` with `referencedBy: 'aftermath_prose'` and the matched recordId | same file |
| Integration | End-to-end: plant intel → run a tick that fires the relevant aftermath reaction → assert the chronicle entry surfaces in `recentEvents` and the trace count for `referencedBy: 'aftermath_prose'` is 1 | `src/engine/__tests__/contracts/intel-aftermath-prose-liveness.contract.test.ts` |

Total: ~10 unit assertions + 1 integration. No snapshot tests required for v1 (prose strings are authored data, not generated).

## NFP compliance

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | Three significance constants + one suppression switch in `agent-behavior-constants.ts`. Authors can override per-effect via `significance` field. |
| 2. Inspectability | PASS | New `referencedBy: 'aftermath_prose'` discriminator on `intelligence_referenced` + per-effect `encounter_aftermath_effect` traces with success/skip/failReason. |
| 3. Determinism | PASS | No new randomness. Match selection uses stable `acquiredTick` desc sort; band derivation is a pure threshold. |
| 4. Fail-soft | PASS | All five failure paths in §E8 emit a trace and continue. `findIntelReferencedProseMatch` is wrapped in try/catch (mirrors `findActionableIntelligence`). |
| 5. Narrative over mechanical | PASS | The whole ticket exists to make a previously-invisible mechanical fact (intel matched scoring) into a visible narrative beat. |
| 6. Additive over destructive | PASS | New union variant; new dispatcher case; new helper. No modification of existing variants, dispatchers, or callers. |
| 7. Performance | PASS | One additional category-filtered scan per `intel_referenced_prose` effect per reaction application. Aftermath reactions are off the per-tick critical path (they fire on resolution, not every tick), so there is no measurable budget impact. |

## Risks + open questions

1. **Risk: Chronicle noise.** If authors stack `intel_referenced_prose` on every reaction, the chronicle could surface 3+ "they remembered the rumor" lines in one encounter. Mitigation: voice contract caps at one effect per reaction; pilot pass deliberately uses 2–3 reactions across two templates so we can observe stack depth before broad rollout. If noise is a real problem in playtesting, the dubious-suppression switch + per-encounter dedup (in a follow-up) is the lever.

2. **Risk: Dubious lines pull weight.** A poorly-written dubious line could read as a bug ("why did the intel fail?"). Mitigation: voice contract §C4 mandates that dubious lines hedge or *show the intel betraying the agent*. The dubious authoring is the most narratively interesting band, not a vestigial one.

3. **Open question: Do we want the matched record to display its `acquiredTick` ("a rumor from 18 days ago…") in the prose?** v1 says no — authors don't have access to a `{intel:cultural_knowledge.acquiredDaysAgo}` placeholder. If playtest feedback shows authors wanting it, add the placeholder in a follow-up (deferred).

4. **Open question: Should reaction-resolution emit a `resolution_match` *and* an `aftermath_prose` trace for the same record?** Yes — they're different consumption surfaces. The same record can be referenced by both during the resolution → aftermath sequence. DebugPanel groups by `recordId`, so the duplication is visible but not noisy.

5. **Risk: The `targetAgentId` field overlaps semantically with the existing `target.kind === 'agent'` resolution path.** Mitigation: dispatcher prefers explicit `effect.targetAgentId` when present, falls back to `target.kind === 'agent' ? target.id : actorAgentId`. Same precedence rule used by `recent_event.witnessAgentIds`. Tests explicitly cover both paths.

## Coordination block

```
Suggested model: opus-4-6
model:opus-4-6   ← matching label required (Rule 10)
Parallel-safe with: THR-368, THR-266, THR-267, THR-268, THR-374
Mutex with: none
Codex review: yes (touches a load-bearing dispatcher; one trace-discriminator extension; small content surface — Codex review will catch shape regressions in the union)
```

**Why parallel-safe with all currently-claimed work:**
- THR-368 (intel_sensitive content opt-in) touches `UNIFIED_ACTION_TEMPLATES` step `difficultyContext` fields; THR-139 touches reactions' aftermath effect arrays. No file overlap.
- THR-266 / THR-267 / THR-268 are workflow / governance docs.
- THR-374 is snapshot tests in the encounter-UI tree.
- Encounter Format Migration project's content workstream (THR-318 streams) is in 'Done' state; no live mutex.

## Done when

- [ ] `EncounterAftermathReactionEffect` union has the new `intel_referenced_prose` variant; type-check clean (`npx tsc --noEmit`).
- [ ] `applyEncounterAftermathReaction` switch handles the new kind with the success + 5 skip-path traces from §E8.
- [ ] `findIntelReferencedProseMatch` and `pickIntelReferencedProseLine` exported from `src/engine/intelligence.ts` with full JSDoc.
- [ ] `emitIntelligenceReferenced` accepts the new `'aftermath_prose'` discriminator and the trace shape in `src/types/trace.ts` is widened to match.
- [ ] Three significance constants + one suppression switch added to `src/data/agent-behavior-constants.ts`.
- [ ] `src/data/intelligence-referenced-prose.ts` created with all six categories × three bands × four lines.
- [ ] At least 2 pilot reactions in `arcane-circle-encounter-content.ts` (and one second pilot, see C1) reference the new effect.
- [ ] Unit tests pass: 10+ assertions across two files (see Tests).
- [ ] Integration contract test passes: `intel-aftermath-prose-liveness.contract.test.ts`.
- [ ] `Docs/plans/wiring-checklist.md` "Aftermath effect kinds" row added for `intel_referenced_prose`.
- [ ] `Docs/plans/2026-04-16-systemic-wiring-guide.md` row added under the 7-capability table for "Intel-referenced prose".
- [ ] Browser-in-the-loop screenshot at 1920×1080 (`?view=game&seeded`) showing one fired chronicle line, attached to the closing Linear comment.
- [ ] Verification evidence pasted in closing comment: `npm test`, `npx tsc --noEmit`, `npx vite build` raw output.
- [ ] Linear issue closes via `Fixes THR-139` in merge commit body.

## Deferrals

Filed as new Linear issues at handoff time, labeled `Deferral`, project Encounter Format Migration:

1. **Template-walk content sweep** — go through all reactions across `UNIFIED_ACTION_TEMPLATES` and decide which ones should reference intel via the new effect. Judgment work; v1 ships with 2–3 pilot templates only.
2. **`intel_referenced_prose` dedup at reaction level** — if a reaction has multiple `intel_referenced_prose` effects matching the same record (e.g., across `category: cultural_knowledge` and `category: political_secret`), suppress all but the highest-significance line. Out of scope until playtest shows the noise is real.
3. **`{intel:category.acquiredDaysAgo}` enrichment placeholder** — let authored prose surface "a rumor from 18 days ago..." textually. Not needed for v1.
4. **Lint rule for category mismatch** — warn when an effect's `category` is implausible for the encounter's templateId/locationId/region pattern (per §C6).

These four are size XS each; they exist as deferrals because the v1 scope here is the engine + pack + pilot, not full template coverage.
