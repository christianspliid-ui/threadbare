# Siege Template Attention Tier Classification

**Linear:** THR-18 · **Project:** Attention Tier Model · **Date:** 2026-04-18
**Depends on:** THR-8 (Attention Tier Model — Phase 6 UI, ✅ Done), Attention Tier Engine Foundation (✅)

## Problem

`src/data/siege-encounter-content.ts` defines two standalone template interfaces — `SiegeSpotlightTemplate` (narrative beats fired during siege ticks) and `SiegeRegionalTemplate` (opportunity encounters seeded near siege hexes). Neither extends `EncounterTemplate`, so when the attention tier foundation added `intrinsicTier: AttentionTier` to `EncounterTemplate`, siege content was left out. Today the 12 siege templates are tier-less, which means:

- Regional encounters spawned from siege templates carry no intrinsic tier → `resolveEffectiveTier()` has to guess, and they all fall through to `'background'` regardless of dramatic weight.
- Spotlight beats (breach, final assault, relief arrives) fire as `BattleState.spotlightHistory` strings without ever entering the attention pipeline, so climactic siege moments never promote to the story-beat queue.
- The digest buffer, thread tugs, and story-beat queue — the three UI surfaces the player actually reads — silently miss siege content.

## Decision: add the field, do not build a mapping layer

The issue description offers two options. We choose **add the field** for three reasons:

1. **Consistency with sibling templates.** `monster-encounter-content.ts`, `social-encounter-content.ts`, `faction-encounter-content.ts`, and the other encounter content files already carry `intrinsicTier` inline. A mapping layer creates a second source of truth for classification and forces anyone editing siege prose to reason about tier in a different file.
2. **Tier is authorial metadata, not derived data.** A spotlight's tier is a judgement call about dramatic weight ("is this a story beat?"). Judgement calls live with the prose, not in an adapter.
3. **Mapping layers rot.** Adding a new spotlight template would require remembering to update a separate classifier. Making the field part of the type forces the author to answer the tier question at write time.

## Three-Pillar Scope

### Engine pillar

**Types (`src/data/siege-encounter-content.ts`):**

```typescript
import type { AttentionTier } from '../types/attention';

export interface SiegeSpotlightTemplate {
  id: string;
  title: string;
  phase: 'opening' | 'early' | 'middle' | 'crescendo' | 'any';
  steps: number;
  reaches: string[];
  prose: string;
  intrinsicTier: AttentionTier;  // NEW — required
}

export interface SiegeRegionalTemplate {
  id: string;
  title: string;
  triggerType: 'allied_defender' | 'allied_attacker' | 'shadow' | 'heart' | 'sabotage';
  prose: string;
  intrinsicTier: AttentionTier;  // NEW — required
}
```

**Regional materialization (`src/engine/siegeResolution.ts` → `generateRegionalEncounters`):**
When a regional template is selected for an actor, propagate its `intrinsicTier` into the resulting `EncounterProgress`. At materialization, resolve `effectiveTier` via `resolveEffectiveTier(actor.courtPosition, template.intrinsicTier)` — same call site pattern as the normal encounter path in `phaseAgentDecision.ts`. Do not invent a new resolution path.

**Spotlight emission (`src/engine/siegeResolution.ts` → `processSiegeTick` / spotlight firing site):**
Spotlights currently push a string into `BattleState.spotlightHistory` and modify momentum. They do not produce an `EncounterProgress` record — nor should they, because they are framing beats, not resolvable encounters. Instead, when a spotlight fires, emit a **digest entry** tagged with `effectiveTier = resolveEffectiveTier(siegeFocusCourtPosition, template.intrinsicTier)`. The "siege focus court position" is the highest-court-position among actors bonded to the siege's participating factions; fall back to `'central'` if no bonded actor is involved (the default behavior — see Fail-soft). This lets the existing digest / story-beat queue surface siege beats without requiring a siege-specific UI.

**Traces:**

```typescript
interface SiegeSpotlightFiredTrace {
  type: 'siege_spotlight_fired';
  tick: number;
  siegeId: string;
  templateId: string;
  intrinsicTier: AttentionTier;
  effectiveTier: AttentionTier;
  courtPositionUsed: CourtPosition;
  bondedActorId: string | null;   // null → central fallback used
}

interface SiegeRegionalSeededTrace {
  type: 'siege_regional_seeded';
  tick: number;
  siegeId: string;
  templateId: string;
  actorId: string;
  intrinsicTier: AttentionTier;
  effectiveTier: AttentionTier;
  triggerType: SiegeRegionalTemplate['triggerType'];
}
```

Both trace types must be registered in `TRACE_CATEGORIES` (Codex review on THR-115-class migrations flagged this as a recurring miss).

### Content pillar

Tier assignments per template. Rationale: spotlights that frame or sustain pacing = `shaping`; spotlights that pivot the siege's outcome = `story_beat`; slow-burn atmospherics = `background`. Regional opportunities default to `background` (the siege is already the headline) and escalate to `shaping` when the template invites the player to take a risky agency move.

**Spotlight templates (7):**

| ID | Title hint | Tier | Why |
|----|-----------|------|-----|
| `siege.spotlight.opens` | Gates open, armies gather | `shaping` | Sets the stage; player should notice the siege has begun but not be stopped |
| `siege.spotlight.sally_forth` | Defenders counterattack | `shaping` | Tactical escalation; interesting but mid-siege |
| `siege.spotlight.negotiate_terms` | White flag diplomacy bid | `story_beat` | Player-impactful choice window; outcome changes siege trajectory |
| `siege.spotlight.starvation` | Granaries fail | `background` | Slow-burn atmosphere; accumulates rather than punches |
| `siege.spotlight.breach` | Walls collapse | `story_beat` | Defining dramatic moment; the siege tilts here |
| `siege.spotlight.final_assault` | All reserves committed | `story_beat` | Climactic; outcome is decided in this beat |
| `siege.spotlight.relief_arrives` | Distant horns, relief force | `story_beat` | Memorable reversal beat |

**Regional templates (5):**

| ID | Title hint | Tier | Why |
|----|-----------|------|-----|
| `siege.regional.call_for_aid` | Besieged plea for help | `shaping` | Explicit invitation to engage; warrants a thread tug |
| `siege.regional.join_attackers` | Press the advantage | `background` | Ambient opportunity; only notable if agent already thread-bonded |
| `siege.regional.smuggle_supplies` | Shadow paths through lines | `shaping` | Agency moment, risky — surfaces the choice |
| `siege.regional.negotiate_terms` | Neutral broker | `shaping` | Cross-faction diplomatic moment; worth surfacing |
| `siege.regional.sabotage` | Exposed engines | `background` | Opportunistic; surfaces only for bonded agents |

Tiers are defaults for v1; tune by observing siege playtests against the curator's attention budget.

### UI pillar

**No new components.** The attention UI surfaces built in THR-8 (Phase 6) already consume `effectiveTier`:

- **Digest buffer** (`ThreadsPanel.tsx` → digest entry list) renders `background`-tier entries in the ambient feed, bold-marks `shaping`-tier.
- **Thread tugs** (HexMapV2 ambient overlays) vibrate hexes where `shaping`-tier encounters are active.
- **Story beat queue** (modal / inline card in `GameView.tsx`) blocks auto-advance when a `story_beat`-tier entry is queued.

This issue's UI work is **verification**, not construction: integration tests must prove that a fired `siege.spotlight.breach` produces a story-beat queue entry, and that a seeded `siege.regional.smuggle_supplies` produces a thread tug on the target actor's hex.

If verification reveals a UI gap (e.g., siege-origin digest entries display with a missing icon because the existing components assume an encounter icon that siege spotlights don't provide), the gap becomes a follow-up issue — not in-scope here.

### Wiring

Per `Docs/plans/wiring-checklist.md`:

| Surface | Touch |
|---------|-------|
| Orchestrator phase | `siegeResolution.ts` inside `processSiegeTick` (existing phase, no new phase) |
| GameState flow | Regional encounters: `gameState.encounters` via existing `EncounterProgress` shape — no schema change. Spotlight digest entries: existing digest buffer on `gameState.attention` |
| Traces | 2 new trace types above; register in `TRACE_CATEGORIES` |
| Debug visibility | `window.__DEBUG.getTraces()` + DebugPanel trace filter will display the new types automatically once categorized |
| Player controls | None — siege spotlights are author-driven; no new button |
| Prose pipeline | `enrichProse()` already handles the prose strings; no resolver changes |

**`Docs/plans/2026-04-16-systemic-wiring-guide.md`:** no update needed. This issue populates existing capabilities; it does not introduce a new one. `intrinsicTier` on content templates is already documented there.

## Constants

| Name | Value | Purpose |
|------|-------|---------|
| `SIEGE_SPOTLIGHT_TIER_DEFAULT` | `'shaping'` | Fallback if a spotlight is added later without `intrinsicTier` populated |
| `SIEGE_REGIONAL_TIER_DEFAULT` | `'background'` | Fallback for regionals |
| `SIEGE_SPOTLIGHT_COURT_POSITION_FALLBACK` | `'central'` | Court position assumed when spotlight fires with no bonded actor in siege participants |

These live alongside the existing siege constants in `siegeResolution.ts`.

## Fail-soft

| Failure case | Fallback |
|--------------|----------|
| Template missing `intrinsicTier` (e.g., content written before type update) | Default to `SIEGE_SPOTLIGHT_TIER_DEFAULT` / `SIEGE_REGIONAL_TIER_DEFAULT`; emit `attention_tier_missing` warning trace with templateId |
| Spotlight fires with no bonded actor in siege participants | Use `SIEGE_SPOTLIGHT_COURT_POSITION_FALLBACK` = `'central'` (so tier still surfaces); set `bondedActorId: null` in trace |
| `resolveEffectiveTier` returns `'invisible'` (dormant actor) | Digest entry still written but filtered from UI — existing behavior, no change |
| Regional template lookup fails at encounter materialization | Regional encounter is not seeded; emit existing `siege_regional_seed_failed` trace (already exists — do not duplicate) |

## NFP Compliance

| NFP | Status | Note |
|-----|--------|------|
| 1. Tunability | PASS | 12 tier values + 3 fallback constants — all named, all in one place |
| 2. Inspectability | PASS | 2 new trace types expose full tier resolution context |
| 3. Determinism | PASS | Tier is static template metadata; no PRNG involvement |
| 4. Fail-soft | PASS | Missing/undefined tier degrades to sensible default; no thrown exceptions |
| 5. Narrative over mechanical | PASS | Tier assignments chosen by dramatic weight, not by engine heuristic |
| 6. Additive | PASS | Adds a required field to two interfaces; populates all call sites in the same PR — no half-state |
| 7. Performance | PASS with note | Constant-time classification per template; no impact. Note: siege ticks already dominated by momentum math — tier resolution is noise |

## Testing Strategy

- **Type-level:** all 12 siege templates must compile with required `intrinsicTier`. TypeScript enforces this; a compile error is the first line of defense.
- **Unit:** `resolveEffectiveTier` called with each siege-origin (tier, courtPosition) pair produces expected effective tier.
- **Integration — regional:** seed a `siege.regional.smuggle_supplies` for a thread-bonded actor in central court. Assert the resulting `EncounterProgress.effectiveTier === 'shaping'` and that a thread tug is present on the actor's hex.
- **Integration — spotlight:** fire a `siege.spotlight.breach`. Assert the digest buffer contains an entry with `effectiveTier === 'story_beat'` and that the story-beat queue is non-empty.
- **Fail-soft:** construct a siege template without `intrinsicTier` (forced cast in test). Assert it falls back to the declared default and emits the warning trace.
- **Trace registration:** assert `TRACE_CATEGORIES` contains `siege_spotlight_fired` and `siege_regional_seeded`.

## Rejected approaches

- **Mapping/adapter layer** that classifies by template `id` prefix or `phase` — rejected for the three reasons above.
- **Optional `intrinsicTier?`** on the interfaces with a runtime default — rejected because it permits half-states where content lands without tier and silently defaults. Required field forces the author to make the call.
- **Spotlights as `EncounterProgress` records** so they flow through the normal pipeline — rejected because spotlights are framing beats, not resolvable encounters; forcing them into the encounter shape would distort the BattleState momentum model and require fake resolution steps.

## Acceptance criteria

1. Both siege template interfaces expose `intrinsicTier: AttentionTier` as a required field.
2. All 12 templates in `siege-encounter-content.ts` carry the tier assignment from the Content table above.
3. Regional materialization propagates `intrinsicTier` into `EncounterProgress` and resolves `effectiveTier` via `resolveEffectiveTier`.
4. Spotlight firing emits a digest entry tagged with `effectiveTier`; `breach` / `final_assault` / `relief_arrives` produce story-beat-tier entries.
5. Two new trace types registered in `TRACE_CATEGORIES` and emitted at the correct sites.
6. Fail-soft: undefined tier → default with warning trace; no bonded actor → `'central'` fallback; no crash.
7. Tests cover: type presence (compile-time), materialization propagation, fail-soft default, tier → UI surface (thread tug + story-beat queue).
8. Pre-commit: `npm test`, `npx tsc --noEmit`, `npx vite build` all green.
9. Definition of Done completed: commit with `Fixes THR-18`, push, merge, Linear auto-close, `project-status.md` updated.
