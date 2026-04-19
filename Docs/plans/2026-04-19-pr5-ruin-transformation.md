# PR 5 — Ruin Transformation + PlaceOfPower / Scar + elderEssenceReward Refactor

**Linear:** THR-153
**Project:** Elder Magic & Ruins
**Parent design:** `Docs/plans/2026-04-19-ruins-layer-design.md`
**Upstream contract:** `phaseDelveEmergence` (PR 4, THR-152) — already rolls consequences and writes `state.pendingEmergenceDecision`.
**Status:** Ready for Dev
**Author:** Cowork (2026-04-19)

---

## 1. Purpose

PR 4 rolls the consequence and parks the delve in `pendingEmergenceDecision`. PR 5 picks that up, lets the player resolve the Emergence Dilemma (Let / Claim / Bargain / Corrupt), **transforms the ruin** (prune → Scar sublocation OR promote → PlaceOfPower location), awards elder essence through a refactored `awardElderEssence` path, and launches the `phasePlaceOfPowerStreams` loop so transformed sites produce their passive essence over time.

This PR is the terminal moment of the delve loop — the point where the 5-beat arc converts into a persistent world-state change. It is where prose becomes map geometry.

## 2. Three-pillar scope

### 2.1 Engine

| Module | File | Responsibility |
|--------|------|----------------|
| Transformation orchestrator | `src/engine/ruins/ruinTransformation.ts` (new) | `transformRuinConsequence({ ruinId, outcome, delveId, emergenceChoice, rng })` — swaps subtype, creates sublocation or PoP, seeds holder edge, pulls essence award, emits traces. |
| PoP stream phase | `src/engine/ruins/placeOfPowerStreams.ts` (new) | `phasePlaceOfPowerStreams(state)` — per-tick credit + decay logic for every PoP. |
| Essence reward refactor | `src/engine/elderEssenceReward.ts` (edit) | Extract `awardElderEssence({ ascendantId, amount, sphere, source, tick })` as generic core; keep `computeElderEssenceReward(HiddenSiteRevealResult)` as thin wrapper. |
| Emergence decision resolver | extend `src/engine/ruins/delveVariant.ts` → new `resolveEmergenceDecision(state, choice)` | Called from UI action handler; wires choice → `transformRuinConsequence` + essence award + aftermath (trust / divine_mark / owes_favor). |
| PoP holder edge | `src/types/graph.ts` + helper in `ruinTransformation.ts` | New edge type `holds_place_of_power` (actor → PoP, or faction → PoP, or god → PoP). |
| Sublocation registry | `src/data/sublocation-types.ts` (existing) | Register `ruins.scar` with name / description / typed property bag. |
| Orchestrator wiring | `src/engine/orchestrator.ts` (edit) | Insert `phasePlaceOfPowerStreams` after `phaseDelveEmergence`, before `phaseAftermath`. Reuse existing `pendingEmergenceDecision` auto-fire at `autoFiresTick` already handled in `phaseDelveEmergence`; PR 5 hooks the resolution path. |

**Subtype decision (authoritative — design doc line 321):** the Scar is a **sublocation** with `sublocationTypeId: 'ruins.scar'`, NOT a new `LocationSubtype`. The THR-153 description line "Add `'scar'` to LocationSubtype" is wrong — correct it to "Register `'ruins.scar'` in the sublocation registry." The `'place_of_power'` LocationSubtype is already added in THR-149 (PR 1); **do not re-add.**

**Decision inputs (`transformRuinConsequence`):**

```typescript
interface TransformRuinInput {
  ruinId: string;
  delveId: string;
  emergenceChoice: 'let' | 'claim' | 'bargain' | 'corrupt';
  consequenceRoll: 'catastrophic' | 'scarred' | 'marked' | 'triumphant' | 'transformed';
  agentId: string;
  actingGodId: string;          // Who invoked the Emergence action (always player-god in v1)
  ruinMagnitude: number;
  sphereAlignment: SphereName;
  rng: () => number;
}
```

**Outcome matrix** (derived from design doc § Emergence Dilemma + consequence roll):

| Consequence roll | Emergence choice | Outcome |
|------------------|------------------|---------|
| `catastrophic` | any | Ruin consumed. Spawn `ruins.scar` sublocation. **No** PoP. Agent already dead from consequence roll (handled in PR 4). Essence reward: half-magnitude, spirit sphere only. |
| `scarred` / `marked` / `triumphant` | `let` | Ruin consumed (scarred) or transformed (triumphant+) based on roll. Essence reward to agent's sphere pool (routed to ascendant). No holder edge. |
| `transformed` | `let` | Ruin promoted to PoP. Holder = agent. Essence reward full. |
| `transformed` | `claim` | Ruin promoted to PoP. Holder = player-god (`holds_place_of_power` edge). Agent loses artifact (if any). Essence cost: `ruinMagnitude * POP_CLAIM_COST_MULTIPLIER`. |
| `transformed` | `bargain` | Ruin promoted to PoP. Holder = agent. Creates `owes_favor` edge (god = debtor, agent = creditor) via THR-30 edge type. No essence cost. |
| `transformed` | `corrupt` | Ruin promoted to PoP. Holder = agent. God receives `POP_CORRUPT_SIPHON_FRACTION` of each stream tick. `divine_mark` SecretType edge created on agent. Essence cost: `POP_CORRUPT_UP_FRONT_COST`. |
| `triumphant` | `claim` / `bargain` / `corrupt` | Fall back to `let` — no PoP formed, no holder effect. (Non-transformed rolls have no PoP to claim; the modal surfaces this but UI should grey out the three claim-variant options per § 2.3.) |

**Stream phase logic** (`phasePlaceOfPowerStreams`):

1. Enumerate all `place_of_power` locations.
2. For each: follow its `holds_place_of_power` edge. If no edge, skip (unclaimed PoP emits nothing).
3. Resolve holder hex position (agent → `located_at`; god → always "present"; faction → any faction member on hex qualifies).
4. If holder present on PoP hex: credit `essencePerTick` into ascendant's `essencePool[sphereAlignment]`. Reset `streamDecayCountdown` to `POP_STREAM_DECAY_WINDOW_TICKS`. Emit `ruins.pop_stream`.
5. If absent: decrement `streamDecayCountdown`. When it hits zero, prune holder edge, set `holderId: null`, emit `ruins.pop_stream_decayed` + `ruins.pop_holder_changed` (reason: `holder_died` if holder node missing, else `holder_absent`).
6. **Corrupt-path siphon:** if holder carries a `divine_mark` SecretType with `markKind: 'corrupt_pop'`, credit `floor(essencePerTick * POP_CORRUPT_SIPHON_FRACTION)` to marker-god's essence pool in addition to holder's full credit. Siphon does not deplete holder's credit — it's a bonus stream for the god.

**Constants (extend `src/engine/ruins/constants.ts`):**

| Constant | Default | Purpose |
|----------|---------|---------|
| `POP_ESSENCE_PER_TICK_MIN` | 1 | Minimum essencePerTick at PoP creation |
| `POP_ESSENCE_PER_TICK_MAX` | 3 | Maximum essencePerTick at PoP creation |
| `POP_ESSENCE_RATE_FROM_MAGNITUDE` | `ceil(ruinMagnitude * 3)` | Formula → rate; clamped to [MIN, MAX] |
| `POP_STREAM_DECAY_WINDOW_TICKS` | 10 | Ticks holder can be absent before stream stops |
| `POP_CLAIM_COST_MULTIPLIER` | 20 | `ruinMagnitude * 20` = Claim essence cost |
| `POP_CORRUPT_UP_FRONT_COST` | 4 | Up-front cost of Corrupt choice |
| `POP_CORRUPT_SIPHON_FRACTION` | 0.33 | Share god siphons from corrupted stream |
| `SCAR_CONDITION_ATTACH_DURATION` | 40 | Ticks a "Haunted by Scar" agent condition lingers on the delve agent (if consumed) |
| `TRANSFORMED_ELDER_ESSENCE_MULTIPLIER` | 1.0 | Full elder-essence reward on transformed outcome |
| `CONSUMED_ELDER_ESSENCE_MULTIPLIER` | 0.5 | Half reward on consumed outcome |
| `CATASTROPHIC_ELDER_ESSENCE_MULTIPLIER` | 0.25 | Quarter reward on catastrophic outcome |

Values above override any defaults already in `constants.ts`; if conflicts, keep authoritative copy here. All routed through `agent-behavior-constants.ts` is **not** the convention — ruin-layer constants live in `src/engine/ruins/constants.ts` (per PR 1 § Step 3).

**Graph mutations (ordered, idempotent per delve):**

1. Create new PoP node (if transformed) OR create new Scar sublocation node (if consumed).
2. Copy relevant property bag from ruin node (`sphereAlignment`, `originCultureId`, `transformedFromRuinId`).
3. Move any `located_at` edges pointing at the ruin to point at the new node (agents don't teleport — they stay where they were).
4. If consumed: remove `elder_ruin` subtype + ruin properties from the location node, OR prune the location entirely and move agents up to parent hex depending on cosmetic original subtype. For v1 **prune the location** and drop the Scar as a sublocation at the same hex (this is the design doc's behavior per line 424).
5. Emit `ruins.ruin_transformed` trace.
6. Bump `touchStructure()` — subtype change affects encounter scoring fallback per CLAUDE.md load-bearing decision.
7. Bump `touchWorld()` — UI selectors must re-read.

**Refactor of `elderEssenceReward.ts`:**

```typescript
// NEW — generic core
export interface AwardElderEssenceInput {
  readonly ascendantId: string;       // Future-proof: multi-ascendant support
  readonly amount: number;            // Total to distribute
  readonly distributionMode: 'foundation_spread' | 'single_sphere';
  readonly sphere?: SphereName;       // Required when single_sphere
  readonly source: 'hidden_site_reveal' | 'ruin_transformed' | 'ruin_consumed' | 'ruin_catastrophic';
  readonly tick: number;
  readonly essencePool: EssencePool;
}

export function awardElderEssence(input: AwardElderEssenceInput): EssenceRewardResult { ... }

// EXISTING — now a thin wrapper, preserving the old call-site
export function computeElderEssenceReward(
  reveal: HiddenSiteRevealResult,
  tick: number,
  essencePool: EssencePool,
): EssenceRewardResult {
  return awardElderEssence({
    ascendantId: getAscendantId(reveal),  // helper already implicit in current code
    amount: reveal.hasElderMagic ? ELDER_SITE_ESSENCE_REWARD : HIDDEN_SITE_ESSENCE_REWARD,
    distributionMode: reveal.hasElderMagic ? 'foundation_spread' : 'single_sphere',
    sphere: reveal.hasElderMagic ? undefined : 'spirit',
    source: 'hidden_site_reveal',
    tick,
    essencePool,
  });
}
```

Keep the `revelation`/`ruins_essence_reward` trace category emission for the old path; add `ruins.elder_essence_awarded` for the new path.

### 2.2 Content

**Transformation prose — 6 vignettes** (3 ruin archetypes × {consumed_scar, transformed_pop}):

| Vignette key | Archetype | Outcome | Length |
|--------------|-----------|---------|--------|
| `ruins.transform.vault.scar` | vault | consumed | 2 sentences poet + 3 witness bullets |
| `ruins.transform.vault.pop` | vault | transformed | 2 sentences poet + 3 witness bullets |
| `ruins.transform.temple.scar` | temple | consumed | same |
| `ruins.transform.temple.pop` | temple | transformed | same |
| `ruins.transform.battlefield.scar` | battlefield | consumed | same |
| `ruins.transform.battlefield.pop` | battlefield | transformed | same |

Authored in `src/data/prose/ruinsTransformation.ts` as a table keyed by `(archetype, outcome)`. Use **enrichment placeholders only**: `{agentName}`, `{ruinName}`, `{sphereName}`, `{artifactName?}`. No hardcoded names (per systemic wiring guide § Enrichment).

Archetype is derived from the ruin's `sphereAlignment` at creation (Revelation chamber → vault, Warding chamber → battlefield, Bargain chamber → temple — see design doc § Chamber archetypes).

**PoP passive-effect copy — 4 emergence choice variants:**

| Key | Renders in |
|-----|-----------|
| `ruins.pop.passive.let` | PoP Inspector panel when holder = agent and choice was Let |
| `ruins.pop.passive.claim` | PoP Inspector when holder = god |
| `ruins.pop.passive.bargain` | PoP Inspector when owes_favor-bargain was struck |
| `ruins.pop.passive.corrupt` | PoP Inspector when corrupt siphon is active |

One short poet-voice line per variant.

**Emergence Dilemma choice cards (4 × per-outcome consequences):**

Already partially surfaced in design doc § Emergence Dilemma family. Content authoring task: populate the modal's per-choice preview prose (poet + witness) in `src/data/prose/emergenceDilemma.ts`. One poet line per (choice × consequenceRoll) for the four viable cells (rolls `triumphant` and `transformed` only); four more for the degraded cells (`catastrophic` / `scarred` / `marked`) that fall back to `let`.

**Chronicle headline entries:**

Three new chronicle producers (dual-voice compliant, PR 7 contract):

1. `ruins.transform.consumed` — fires from `transformRuinConsequence` consumed path.
2. `ruins.transform.emerged` — fires from transformed path.
3. `ruins.pop_stream_decayed.headline` — fires once when stream dies (not on every tick).

Each produces a `ChronicleEntry` with `poetProse` + `witnessFacts: string[]` per PR 7's extension of the ChronicleEntry type.

**Passive-effect data table** — non-prose:

```typescript
// src/data/ruins/placeOfPowerEffects.ts
export const POP_PASSIVE_EFFECTS: Record<SphereName, PoPEffectSpec> = {
  chaos: { essencePerTick: 2, agentVisionRadiusBonus: 1, ... },
  order: { essencePerTick: 2, factionStandingBonusNearby: 0.05, ... },
  light: { essencePerTick: 3, healTickToHolder: 1, ... },
  darkness: { essencePerTick: 2, fearAuraRadius: 2, ... },
  // ... 9 spheres total
};
```

Values are placeholders — tune in QA. Effects beyond the essence stream itself are **additive only** in v1; the stream is mandatory, bonus effects are discoverable in v2+.

### 2.3 UI

| Component | File | Responsibility |
|-----------|------|----------------|
| EmergenceDilemmaModal | `src/components/ruins/EmergenceDilemmaModal.tsx` (new) | Blocking modal when `state.pendingEmergenceDecision != null`. Shows 4 choice cards (Let / Claim / Bargain / Corrupt) with per-choice prose + essence cost + consequence preview. Auto-fire countdown visible. Inviable options greyed (not hidden) with tooltip explaining why. |
| PoP Inspector | `src/components/Game/LocationView.tsx` (extend) | When `locationSubtype === 'place_of_power'`, render holder + stream rate + decay countdown + sphere + history sparkline (last 20 ticks from trace buffer). |
| Scar inspector | `src/components/Game/HexPoiPanel.tsx` (extend) | When hovering/selecting a hex with a `ruins.scar` sublocation, show scar name + origin ruin + consumed-tick + lingering prose. |
| HexMapV2 signifiers | `src/components/HexMapV2/signifiers/` (new entries) | `PlaceOfPowerCrown` (full ring + sphere-colored glow) and `ScarMarker` (cross-hatch). Data: read from graph in the per-hex signifier pass. |
| Chronicle rendering | `ChronicleEntryCard.tsx` (no change if PR 7 landed) | Consumes the new `poetProse` + `witnessFacts` shape. |
| Chronicle headline hooks | `src/components/Game/RightRail/ChronicleFeed.tsx` | No change — new chronicle entries use existing surface. Verify the three new producers show up in the right-rail feed. |

**Modal behavior details:**

- Inviable options (Claim / Bargain / Corrupt when roll ≠ transformed) render greyed with the tooltip "This outcome cannot be claimed — the ruin was {rollOutcome}." Clicking does nothing.
- Cost preview shows up-front essence delta (e.g. "−6 Chaos") computed against current pool; greyed if unaffordable.
- Countdown pip shows "Auto-fires in {remaining} ticks" sourced from `pendingEmergenceDecision.autoFiresTick - state.tick`.
- On confirm, dispatches `resolveEmergenceDecision(state, choice)`; engine takes over.
- 1920×1080 viewport compliant: `max-height: 85vh`, no internal overflow. Four choice cards in a 2×2 grid.

**HexMapV2 signifiers:** add to the existing signifier-layer registry (same mechanism used by ruin markers in PR 6). Per `hexmap-layers` skill, signifiers are pure functions of `(hexState) → drawInstructions[]`; no new render layer needed.

**DebugPanel:** extend the existing DebugPanel Ruins tab (if present from PR 2 — check first) with a "Transformations" subtab showing:
- PoP table (id, holder, stream rate, decay countdown)
- Scar table (id, origin ruin id, consumed tick)
- Force-trigger buttons: `Force emergence: let`, `Force emergence: claim`, `Force stream decay`

---

## 3. Constants table (NFP #1)

| Constant | Default | Purpose | Source |
|----------|---------|---------|--------|
| `POP_ESSENCE_PER_TICK_MIN` | 1 | Stream floor | this PR |
| `POP_ESSENCE_PER_TICK_MAX` | 3 | Stream ceiling | this PR |
| `POP_STREAM_DECAY_WINDOW_TICKS` | 10 | Absence grace | design doc |
| `POP_CLAIM_COST_MULTIPLIER` | 20 | Claim action cost | design doc |
| `POP_CORRUPT_UP_FRONT_COST` | 4 | Corrupt upfront | design doc |
| `POP_CORRUPT_SIPHON_FRACTION` | 0.33 | God siphon rate | design doc |
| `SCAR_CONDITION_ATTACH_DURATION` | 40 | "Haunted by Scar" ticks | this PR |
| `TRANSFORMED_ELDER_ESSENCE_MULTIPLIER` | 1.0 | Full reward | this PR |
| `CONSUMED_ELDER_ESSENCE_MULTIPLIER` | 0.5 | Half reward | this PR |
| `CATASTROPHIC_ELDER_ESSENCE_MULTIPLIER` | 0.25 | Quarter reward | this PR |
| `EMERGENCE_DECISION_TIMEOUT_TICKS` | 8 | Auto-fire threshold | design doc (reuse) |

All in `src/engine/ruins/constants.ts`.

## 4. Trace interfaces (NFP #2)

Registered in PR 1 already; this PR emits them.

```typescript
interface RuinTransformedTrace {
  category: 'ruins.ruin_transformed';
  tick: number;
  ruinId: string;
  outcome: 'consumed' | 'transformed';
  newPlaceOfPowerId?: string;
  newScarSublocationId?: string;
  delveId: string;
  emergenceChoice: 'let' | 'claim' | 'bargain' | 'corrupt';
}

interface PlaceOfPowerStreamTrace {
  category: 'ruins.pop_stream';
  tick: number;
  popId: string;
  holderId: string | null;
  essenceCredited: number;
  streamDecayCountdown: number;
  siphonToGodId?: string;         // present only on corrupt path
  siphonAmount?: number;
}

interface PlaceOfPowerHolderChangedTrace {
  category: 'ruins.pop_holder_changed';
  tick: number;
  popId: string;
  previousHolderId: string | null;
  newHolderId: string | null;
  holderType: 'actor' | 'faction' | 'god' | null;
  reason: 'emergence' | 'claim_action' | 'presence_resumed' | 'holder_died' | 'holder_absent';
}

interface PlaceOfPowerStreamDecayedTrace {
  category: 'ruins.pop_stream_decayed';
  tick: number;
  popId: string;
  lastHolderId: string;
  absenceDurationTicks: number;
}

// Optional new category if not already registered in PR 1 — verify before emitting
interface ElderEssenceAwardedTrace {
  category: 'ruins.elder_essence_awarded';
  tick: number;
  ascendantId: string;
  totalAmount: number;
  distributionMode: 'foundation_spread' | 'single_sphere';
  source: 'hidden_site_reveal' | 'ruin_transformed' | 'ruin_consumed' | 'ruin_catastrophic';
}
```

**Pre-flight check for CC:** `grep TRACE_CATEGORIES src/types/trace.ts` — if `ruins.elder_essence_awarded` is not there, add it alongside the existing `ruins.*` entries (follow PR 1 pattern). Do NOT add to `traceBuffer.ts`; that file only consumes the list.

## 5. Fail-soft table (NFP #4)

| Failure | Fallback |
|---------|----------|
| `pendingEmergenceDecision` references a delve that no longer exists | Clear pending state; emit `ruins.emergence_orphaned` warning trace; no transformation fires |
| Ruin node already pruned when transformation fires | Skip transformation; log warning; essence award still fires at half multiplier to give player some closure |
| Holder agent dies between PoP creation and first stream tick | Holder edge pruned; stream decay begins immediately next tick |
| `essencePool` missing the target sphere key | Initialize the sphere to 0 before crediting; no crash |
| PoP placed on a hex that later gets world-gen-regenerated (shouldn't happen in-game but possible in tests) | Structural cache bump triggers re-discovery; stream continues once holder re-enters |
| UI modal dismissed without player choice and tick advances past `autoFiresTick` | `phaseDelveEmergence` already auto-fires `let`; modal re-renders only if `pendingEmergenceDecision` reappears from a new delve |
| Corrupt siphon target god id no longer exists (dev/test reset) | Siphon credit silently skipped; holder still gets full credit; emit `ruins.pop_stream.siphon_orphaned` warning |
| Scar sublocation registry missing `ruins.scar` | `transformRuinConsequence` falls back to `ruins.scar.fallback` with hardcoded minimal prose; emit `ruins.schema_drift` warning |
| Elder essence amount computes to NaN or Infinity | Clamp to `[0, ELDER_SITE_ESSENCE_REWARD * 2]`; log warning |

## 6. Wiring (per `Docs/plans/wiring-checklist.md`)

| Module | Orchestrator phase | UI surface | GameState field(s) | Trace | Debug visibility |
|--------|--------------------|-----------|--------------------|-------|------------------|
| `transformRuinConsequence` | called from `resolveEmergenceDecision` (inside existing `phaseDelveEmergence` auto-fire or user-dispatched from modal) | EmergenceDilemmaModal → HexMap signifier swap | `state.graph`, `state.essencePool`, `state.pendingEmergenceDecision` | `ruins.ruin_transformed` + `ruins.elder_essence_awarded` | DebugPanel Ruins tab |
| `phasePlaceOfPowerStreams` | new phase, after `phaseDelveEmergence` | EssenceTicker (existing) + PoP Inspector | `state.essencePool`, `state.graph` (PoP property mutations) | `ruins.pop_stream`, `ruins.pop_stream_decayed`, `ruins.pop_holder_changed` | DebugPanel Ruins tab |
| `awardElderEssence` | called from transformation and from existing revelation path | Chronicle headline | `state.essencePool` | `ruins.elder_essence_awarded` | existing essence delta debug |
| EmergenceDilemmaModal | — (UI) | renders from GameState | `state.pendingEmergenceDecision` | — (dispatches resolve which emits) | — |
| HexMapV2 signifier additions | — | rendered per-hex in existing signifier layer | reads `state.graph` subtype | — | — |
| Chronicle headlines | existing chronicle emitter | RightRail/ChronicleFeed | `state.chronicleEntries` | — | — |

**New GameState field:** none strictly required. `pendingEmergenceDecision` already exists (PR 4). If the modal needs per-choice preview data beyond what's computable from `pendingEmergenceDecision`, compute inline at render time — do not inflate GameState.

**Orchestrator change:** insert one new phase call, pattern-matching the existing 5 ruins phases (THR-153 adds the 6th):

```typescript
// Phase 6.659: PoP Streams — credit / decay for transformed ruins (THR-153)
s = { ...s, ...phasePlaceOfPowerStreams(s) };
phaseEventCounts['pop_streams'] = s.tickEvents.length - prevEventCount;
prevEventCount = s.tickEvents.length;
```

**Post-transformation cache invalidation:** must call both `touchWorld()` AND `touchStructure()` — subtype change impacts encounter scoring fallback (CLAUDE.md load-bearing decision on `worldVersion` / `structuralCacheVersion`).

## 7. Test strategy (per `testing-patterns` skill)

**Engine unit tests** (`src/engine/ruins/__tests__/ruinTransformation.test.ts`):

1. Each of the 7 outcome-matrix cells produces the expected graph mutation.
2. `awardElderEssence` distributes correctly across foundation spheres (transformed) and to single sphere (consumed).
3. Idempotency: calling `transformRuinConsequence` twice for the same `delveId` is a no-op the second time (guard via `transformedFromRuinId` check).
4. Trace emissions fire in order: `ruins.elder_essence_awarded` → `ruins.ruin_transformed` → `ruins.pop_holder_changed` (transformed path).

**Stream phase tests** (`src/engine/ruins/__tests__/placeOfPowerStreams.test.ts`):

1. Holder present → essence credited, countdown reset.
2. Holder absent → countdown decrements.
3. Countdown hits 0 → holder edge pruned, stream dead.
4. Corrupt siphon credits the god alongside holder.
5. PoP with no holder edge emits nothing, doesn't crash.

**Integration test** (`src/engine/__tests__/delveFullArc.test.ts` — add scenarios, don't replace):

- Full 5-beat delve → emergence → transform → 3 stream ticks, asserting essence totals on the god's ascendant pool match the formula.

**Contract test:** round-trip `HiddenSiteRevealResult` → `computeElderEssenceReward` (old path) produces identical results before and after the refactor — catches accidental drift in the wrapper.

**UI smoke test** (`src/components/ruins/__tests__/EmergenceDilemmaModal.test.tsx`): renders without error for each consequence roll, with correct options greyed.

**Pre-commit minimum** (CLAUDE.md § Testing): `npm test`, `npx tsc --noEmit`, `npx vite build` — all green.

## 8. Acceptance criteria (revised)

- [ ] `resolveEmergenceDecision(state, choice)` wired from `EmergenceDilemmaModal` and from auto-fire in `phaseDelveEmergence`
- [ ] `transformRuinConsequence` handles all 7 outcome-matrix rows correctly; tests cover each
- [ ] `ruins.scar` sublocation type registered in `src/data/sublocation-types.ts` with display metadata
- [ ] `place_of_power` LocationSubtype rendered on HexMap with distinct signifier; `ruins.scar` sublocation rendered as cross-hatch
- [ ] `phasePlaceOfPowerStreams` wired into orchestrator after `phaseDelveEmergence`
- [ ] `awardElderEssence` generic core extracted; existing `computeElderEssenceReward` call-site preserved and passing its old test
- [ ] Corrupt-path siphon credits god's essence pool alongside holder's
- [ ] Chronicle entries (`consumed`, `emerged`, `pop_decayed_headline`) fire once per event and render dual-voice
- [ ] PoP Inspector shows holder + rate + decay + sphere
- [ ] 6 transformation vignettes authored with enrichment placeholders (no hardcoded names)
- [ ] EmergenceDilemmaModal inviable options greyed with tooltip
- [ ] All traces listed in § 4 emit with correct typed payloads
- [ ] Auto-fire path (player AFK) produces `emergenceChoice: 'let'` with `autoResolved: true` fallback; no crash
- [ ] Fail-soft table scenarios covered by tests where feasible (9 of 10 at minimum)
- [ ] `touchWorld()` + `touchStructure()` called post-transformation
- [ ] Pre-commit checklist: `npm test` green, `npx tsc --noEmit` clean, `npx vite build` succeeds
- [ ] Definition of Done: commit with `Fixes THR-153` in body; push; update `project-status.md`, `project-history.md`, `changelog.md`; update `wiring-checklist.md` with PoP streams phase + EmergenceDilemmaModal + new trace categories

## 9. Corrections to the current THR-153 description

The existing issue description has two errors CC should ignore:

1. **"Add `'scar'` to LocationSubtype"** — WRONG. Per design doc line 319–324, the Scar is a **sublocation** with `sublocationTypeId: 'ruins.scar'`. Register it in the sublocation-type registry instead.
2. **"Register `'place_of_power'` in LocationSubtype"** — ALREADY DONE in PR 1 (THR-149). Do not duplicate.

This plan doc (§ 2.1) is the source of truth. The Linear description will be corrected via the Ready-for-Dev handoff comment.

## 10. Out of scope (explicit)

- v2+ only: multi-holder PoP ownership (factions sharing a site)
- v2+ only: PoP stream visualization (particle trail)
- v2+ only: Ascendant-specialist PoP holding mechanics
- v2+ only: Scar → rebuilt-ruin reverse transformation
- v2+ only: Rival-god claim contests on a PoP

## 11. Parallelism notes

- **Parallel-safe with:** any other Elder Magic & Ruins PR still open (PR 6 worldgen, PR 7 chronicle migration, PR 8 guild hooks) — different file surfaces.
- **Mutex with:** PR 4 (THR-152) only if re-opened — touches `phaseDelveEmergence` contract. PR 4 is Done, so no live mutex.
- **File-level collisions to watch:** `src/engine/elderEssenceReward.ts` (refactor), `src/engine/orchestrator.ts` (new phase), `src/data/sublocation-types.ts` (register scar), `src/types/graph.ts` (new `holds_place_of_power` edge). If another concurrent branch touches any of these, rebase first.

## 12. Suggested model: Opus

Rationale: refactor crosses tightly-coupled modules (elderEssenceReward + delveVariant + new ruinTransformation + new placeOfPowerStreams), introduces a new graph edge type (blast radius via `src/types/graph.ts`, 370 importers per Codesight), adds a new orchestrator phase with aftermath dependencies, and requires authoring prose in the PR 7 dual-voice contract. Architectural judgment calls are abundant (e.g. how to handle the "holder dies mid-tick" race, whether to prune the ruin node or swap its subtype, how to compose the outcome-matrix into a single resolver). Sonnet would likely produce a working implementation but would plausibly miss the touchStructure/touchWorld double-call, the sublocation-vs-subtype distinction, or the corrupt-siphon ordering.

## 13. Codex review: yes

Worth a read-through. Focus areas for the reviewer: outcome-matrix completeness, cache-invalidation discipline, idempotency of transformation, refactor-wrapper equivalence in `elderEssenceReward.ts`.
