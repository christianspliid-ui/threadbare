# THR-430 — Schism: faction-split divine action

**Status:** Ready for Dev
**Author:** Cowork (scheduled session, 2026-05-12)
**Parent:** THR-400 (Faction Action Expansion — In Dev) · sibling of THR-431/432/433
**Project:** Social Systems Expansion (Now / High)
**Vision premise:** verdicted 2026-05-11 (THR-400 §"Schism's outcome ambiguity") — *the player forces the crisis; they do not choose the resolution.* No re-litigation of the philosophy in this plan.

> **Sandbox note:** session-precheck returned `freshness=unknown` (git/index state could not be read in the Cowork sandbox). The user must verify the working tree is current against `origin/main` before CC begins implementation.

---

## 1. Why this issue is its own ticket

`FactionManipulateEffect.splinter` already exists as a value in `src/types/effects.ts:175`. A full `faction_splinter` *aftermath* effect already exists in `src/engine/encounterAftermath.ts:1611–1726` — it partitions `member_of` edges, mints a new faction node, transfers reputation share, copies `relates_to` edges, creates a hostile back-edge, emits chronicle events and traces, calls `touchWorld` + `touchStructure`. Tests exist (`encounterAftermath.worldShaping.test.ts:332+`). Constants exist (`FACTION_SPLINTER_DEFAULT_REPUTATION_SHARE`, `FACTION_SPLINTER_INITIAL_SENTIMENT_TO_PARENT`, `FACTION_MUTATION_CHRONICLE_SIGNIFICANCE.splinter`).

What is **missing** is the divine action that exposes this machinery to the player as a *deferred* crisis. THR-400 shipped seven faction verbs that resolve immediately; Schism is the only one that needs:

1. A **pending-resolution window** (24 ticks default) — the crisis is planted but not settled.
2. **Outcome decision logic** at the resolution tick — reform or split, based on faction state at the moment of resolution, *not* at the moment of the cast.
3. A **reform branch** — there is no existing `faction_reform` machinery; the splinter machinery only models the split outcome.
4. A **player-facing scene** — `faction.encounter.schism_resolution` planted on the most-threaded faction member when the resolution tick fires.

This is roughly 60% reuse, 40% new code. It is the only deferral from THR-400 that carries a non-trivial subsystem build.

## 2. Three-pillar overview

| Pillar | What ships |
|---|---|
| **Engine** | `action.faction.schism` template · pending-resolution state on faction node · `phaseSchismResolution` tick phase · `faction_reform` runtime branch (sister to existing `faction_splinter`) · cohesion/spread/dissent scoring used at resolution |
| **Content** | Action prose (player-read text, success/fail afterimage) · `faction.encounter.schism_resolution` encounter template with reform-vs-split branches · prose strings for the two outcome chronicles · two new doctrinal-side names (procedural name generation for the splinter) |
| **UI** | Faction detail panel shows "Schism brewing — resolves in N ticks" banner · action drawer surfaces `action.faction.schism` when a faction is the focused target · hex-map signifier ring on faction-controlled hexes during pending window · chronicle event for plant, resolution, and split-or-reform · `__DEBUG.schism()` for headless inspection |

All three pillars carry shippable work. Wiring section §10 makes the integration points explicit.

## 3. Engine pillar

### 3.1 Action template

File: `src/data/unified-action-templates.ts` — append to the faction-action cluster (currently 7 verbs after THR-400, plus the original 2). Format matches `action.divine-edict` and `action.anoint-champion` already in the file.

```ts
{
  id: 'action.faction.schism',
  name: 'Schism',
  spellName: 'Two Truths Where One Stood',
  rarityTier: 3,
  intrinsicTier: 'shaping',
  description:
    "You plant a doctrinal split inside the faction. Two truths surface where there was one. The crisis is real now — what comes next is not yours to choose.",
  reach: 'star',
  crudType: 'update',
  scale: 'regional',
  steps: [{
    reach: 'star',
    duration: { min: 1, max: 1 },
    difficulty: 0.0,
    onSuccess: [{
      op: 'plant_schism',                          // new GraphOp — see §3.2
      factionId: '$target',
      resolutionDelay: SCHISM_PENDING_DURATION_TICKS,
      actorId: '$caster',
    }],
    onFailure: [],
    failBehavior: 'fail_action',
  }],
  apCost: 1,
  essenceCost: SCHISM_ESSENCE_COST,                 // 14, named constant
  actorAffinities: ['ascendant'],
  sphereAffinity: 'chaos',
  motivations: ['preservation_transformation', 'loyalty_ambition'],
  targetCategories: ['actor'],
  targetSubtypes: ['faction'],
  narrativeTemplates: {
    initiation: "plants a schism inside {target}",
    success: "the faction tremors — two doctrines now, where one stood",
    failure: "the words pass through the faction without finding purchase",
  },
}
```

### 3.2 New GraphOp: `plant_schism`

The cleanest integration point is a new `GraphOp` kind that runs at action resolution. It mirrors the shape of existing ops like `update_node` and `apply_condition`.

File: `src/types/graphOps.ts` (or wherever `GraphOp` union lives — verify with `grep -n "type GraphOp" src/types/`).

```ts
| {
    readonly op: 'plant_schism';
    readonly factionId: string;                // '$target' resolved at apply time
    readonly resolutionDelay: number;          // ticks until resolution
    readonly actorId: string;                  // '$caster' — for trace continuity & encounter targeting
  }
```

Handler (in the graph-op apply file) sets these properties on the faction node:

```ts
node.properties.schismPendingResolutionTick = state.tick + op.resolutionDelay;
node.properties.schismPlantedTick           = state.tick;
node.properties.schismActorAgentId          = op.actorId;
// Initial cohesion snapshot — recorded at plant time for variance-from-baseline scoring
node.properties.schismBaselineCohesion      = computeFactionCohesion(state, op.factionId);
```

`touchWorld()` + `touchStructure()` (the property mutation invalidates encounter awareness caches that may key on faction identity). Emit trace `category: 'schism_planted'` with `{ factionId, actorId, resolutionTick, baselineCohesion }`.

### 3.3 New tick phase: `phaseSchismResolution`

File: `src/engine/phaseSchismResolution.ts` (new). Registered in `src/engine/orchestrator.ts` as **Phase 6.653** — immediately after `phaseFactionActions` (6.652), so faction-internal moves this tick have already happened before we evaluate.

Per-tick scan:

```ts
for each faction node F where F.properties.schismPendingResolutionTick === state.tick:
   const decision = decideSchismOutcome(state, F, rng)   // see §3.4
   if (decision.outcome === 'split') {
     applyFactionSplinter(state, F, decision, runtime)   // reuses faction_splinter aftermath
   } else {
     applyFactionReform(state, F, decision, runtime)     // new — see §3.5
   }
   plantSchismResolutionEncounter(state, F, decision, runtime)  // see §6.2
   clearSchismProperties(F)
   emitTrace({category:'schism_resolved', factionId:F.id, outcome:decision.outcome, ...})
```

The phase is idempotent on tick replay (decision uses seeded PRNG from `state.tick + F.id`).

### 3.4 Decision logic — `decideSchismOutcome`

Three numeric inputs feed a scalar `splitPressure` ∈ [0, 1]:

| Signal | Source | Why it matters |
|---|---|---|
| **leaderCohesionDrop** | `baselineCohesion - currentCohesion`. Cohesion = max sentiment among `member_of` edges between leader-rank members. | If leadership has fragmented during the pending window, split is more likely. |
| **memberAxiologicalSpread** | stddev of member `axiologicalProfile` scores across the faction's two most-weighted reaches. | High spread = no unifying alignment = no glue to reform. |
| **dissentLevel** | `F.properties.dissentScore ?? 0`. Stir Dissent (THR-400) feeds this; others may. Read action — does not fabricate. | The pre-existing tension going into the cast. |

```ts
splitPressure = clamp01(
    SCHISM_WEIGHT_COHESION  * normalize(leaderCohesionDrop)      // default 0.4
  + SCHISM_WEIGHT_SPREAD    * normalize(memberAxiologicalSpread) // default 0.4
  + SCHISM_WEIGHT_DISSENT   * normalize(dissentLevel)            // default 0.2
);
// Outcome: rng() < splitPressure → split, else reform.
```

All four magic numbers are tunable constants. Fail-soft: missing inputs default to 0 (graceful drift toward reform — the "world heals" failure mode is canonical for this game).

### 3.5 Reform branch — new runtime, `applyFactionReform`

Sister to `faction_splinter`, lives next to it in `src/engine/encounterAftermath.ts` (or extracted into a shared `factionTopology.ts` if the file is getting too large — CC's call).

```ts
function applyFactionReform(state, faction, decision, runtime):
  // 1. Reputation penalty on the faction itself
  faction.properties.reputation =
    clamp01((faction.properties.reputation ?? 0.5) - SCHISM_REFORM_REPUTATION_PENALTY)

  // 2. Expel the K most-misaligned members
  const members = getFactionMembers(state, faction.id)
  const ranked  = members.sort(byMisalignmentDesc(faction))
  const expelled = ranked.slice(0, SCHISM_REFORM_EXPULSION_COUNT)
  for (m of expelled) removeMemberOfEdge(state, m, faction.id)

  // 3. Mark the reform — surfaces in chronicle + encounter prose
  faction.properties.lastSchismReformTick = state.tick
  faction.properties.lastSchismExpelledCount = expelled.length

  // 4. Wiring
  touchWorld(runtime)
  touchStructure(runtime)
  appendRecentEvent(...narrative TickEvent...)
  emitTrace({category:'faction_reformed', ...})
```

The expulsion is hard — the misaligned members become free agents (or drift to the faction's strongest rival, matching the `drift_to_rival` pattern already in `faction_dissolve`).

### 3.6 Constants table (NFP #1)

All constants go in `src/data/faction-constants.ts` (existing file, adjacent to existing splinter constants):

| Constant | Default | Purpose |
|---|---|---|
| `SCHISM_ESSENCE_COST` | 14 | Action essence cost (matches THR-400 spec) |
| `SCHISM_PENDING_DURATION_TICKS` | 24 | How long the crisis sits before resolution |
| `SCHISM_WEIGHT_COHESION` | 0.4 | Contribution of leadership-cohesion drop to split pressure |
| `SCHISM_WEIGHT_SPREAD` | 0.4 | Contribution of member-axiology stddev to split pressure |
| `SCHISM_WEIGHT_DISSENT` | 0.2 | Contribution of pre-cast dissent score to split pressure |
| `SCHISM_REFORM_REPUTATION_PENALTY` | 0.15 | Reputation lost on the faction node on reform |
| `SCHISM_REFORM_EXPULSION_COUNT` | 3 | Number of most-misaligned members expelled on reform |
| `SCHISM_RESOLUTION_CHRONICLE_SIGNIFICANCE` | 0.85 | TickEvent significance for the resolution beat |
| `SCHISM_RESOLUTION_ENCOUNTER_DELAY` | 0 | Ticks between resolution and the planted encounter (0 = same tick) |

Reuse (no new values): `FACTION_SPLINTER_DEFAULT_REPUTATION_SHARE`, `FACTION_SPLINTER_INITIAL_SENTIMENT_TO_PARENT`, `FACTION_MUTATION_CHRONICLE_SIGNIFICANCE.splinter`.

### 3.7 Tracing (NFP #2)

Three new trace categories, each a TypeScript interface in `src/engine/traceBuffer.ts` (extend existing trace-type union):

```ts
interface SchismPlantedTrace {
  category: 'schism_planted';
  tick: number;
  factionId: string;
  actorAgentId: string;
  resolutionTick: number;
  baselineCohesion: number;
}

interface SchismResolvedTrace {
  category: 'schism_resolved';
  tick: number;
  factionId: string;
  outcome: 'split' | 'reform';
  splitPressure: number;
  inputs: { cohesionDrop: number; spread: number; dissent: number };
  // outcome-specific:
  splinterFactionId?: string;     // when split
  splinterMemberCount?: number;   // when split
  expelledMemberIds?: string[];   // when reform
}

interface FactionReformedTrace {
  category: 'faction_reformed';
  tick: number;
  factionId: string;
  reputationBefore: number;
  reputationAfter: number;
  expelledCount: number;
  expelledIds: string[];
}
```

The existing `faction_splintered` trace continues to fire on the split branch — no change to its shape; CC will call into the existing splinter machinery.

### 3.8 Fail-soft table (NFP #4)

| Failure | Behavior |
|---|---|
| Target faction was dissolved between cast and resolution | Phase logs `schism_resolved` with `outcome: 'noop'`, clears properties, no graph mutation, no encounter planted |
| Faction has < 2 members at resolution | Force reform branch with expulsion clamped to `members.length - 1` (can't split a faction of one) |
| Faction has no leader-rank members | `leaderCohesionDrop = 0`, decision falls back to spread + dissent inputs |
| `decideSchismOutcome` throws | Caught in phase wrapper, trace logs `failReason: 'decision_threw'`, clears pending properties, no mutation |
| `applyFactionSplinter` fails after partial application | Existing splinter implementation already has fail-soft for invalid source — inherit; phase logs and continues |
| `applyFactionReform` cannot find members to expel | Apply reputation penalty only, log `expelledCount: 0` |
| No threaded member to host the resolution encounter | Plant encounter on highest-reputation member instead; if still none, skip encounter, trace `failReason: 'no_encounter_host'` |

### 3.9 No blast-radius section required

Importer counts: `unified-action-templates.ts` 35, `faction-definitions.ts` 23, `effects.ts` 35, `phaseFactionActions.ts` 2. None exceed the ≥100 threshold. The orchestrator (where the new phase registers) is the most-touched file in scope, but registering one new phase next to twenty existing peers is mechanical — the existing phase pattern is the contract.

## 4. Content pillar

### 4.1 Action prose (already drafted in §3.1)

The action's `description` field is the player-read promise. `narrativeTemplates.initiation/success/failure` populate the chronicle on cast.

### 4.2 Resolution chronicle prose

Two outcome strings live in `src/data/faction-action-encounters.ts` (or a new sibling `faction-schism-content.ts` if the file grows large). They are not random pools — each is a single authored line tied to the outcome, parameterized by faction name:

**Split:**
> *{factionName} fractures. Where there was one doctrine, two now stand. {splinterName} walks out the door it built.*

**Reform:**
> *{factionName} pulls back from the edge. {expelledCount} voice{s?} are gone in the morning. The doctrine still holds — narrower than it was.*

Both feed `appendRecentEvent` with `significance: SCHISM_RESOLUTION_CHRONICLE_SIGNIFICANCE`.

### 4.3 Splinter naming

The splinter needs a name. Reuse the existing dynamic-faction naming approach from `dynamicFactionDefinitions` (verify how `faction_splinter` aftermath sources `effect.newFactionName` today — the existing code takes a literal string). For the schism-resolution path, generate procedurally from a small pool tied to the parent's `factionType` and the *axis of disagreement* (the reach with highest member spread at resolution time):

- `factionType: 'guild'` + disagreement on `iron` → "The Sundered Hand"
- `factionType: 'religious'` + disagreement on `star` → "The Second Star"
- `factionType: 'mercantile'` + disagreement on `gold` → "The Lesser Coin"

A small content table — `SCHISM_SPLINTER_NAME_TEMPLATES` keyed by `(factionType, reach)` — lives in `src/data/faction-schism-content.ts`. Default fallback: `"${parentName} — Schismatics"`.

### 4.4 `faction.encounter.schism_resolution` template

New encounter template in `src/data/faction-action-encounters.ts` following the existing `UnifiedActionTemplate` shape (model: `FA_QUEST_BOARD_TEMPLATE` and `FA_RIVALRY_CONFRONTATION_TEMPLATE` already in that file). The encounter has **two branches** keyed off the outcome:

- **`when: schism_outcome=split`** — the member must choose which half to leave with, or whether to abandon both.
- **`when: schism_outcome=reform`** — the member faces the leadership purge; were they on the expelled list, or did they survive it?

Each branch is two `steps` (recognition, then choice). Prose is mid-length, Threadbearer voice (short, charged, mythic). Aftermath rewards: a `condition` reflecting the choice (e.g. `schismatic_loyalty`, `reformist_survivor`, `between_doctrines`) — adds to the agent's permanent record. The encounter is the player's first scene-level view of what their cast produced; it is the payoff, so it must read well.

Prose-quality bar: matches the meeting-prose tier. Prose authoring is the heaviest single chunk of work in this issue — the suggested model (`opus-4-6`) is dimensioned for it.

### 4.5 Content checklist

- [ ] Action description + narrativeTemplates (initiation/success/failure)
- [ ] Two outcome chronicle strings (split + reform)
- [ ] `SCHISM_SPLINTER_NAME_TEMPLATES` table covering 5 factionTypes × 9 reaches = up to 45 entries (default fallback acceptable)
- [ ] `faction.encounter.schism_resolution` template — two branches × two steps, with Threadbearer-voice prose, success/failure afterimages, three new conditions in `src/data/condition-content.ts`
- [ ] Three new conditions: `schismatic_loyalty`, `reformist_survivor`, `between_doctrines` (mechanical: small reach-bias on relevant reach for N ticks)

## 5. UI pillar

### 5.1 Faction detail panel — pending-schism banner

Component: `src/components/FactionDetailPanel.tsx` (verify exact path — CC should check `grep -rn "FactionDetail" src/components/`).

Add a conditional banner above the existing faction summary:

```tsx
{faction.properties.schismPendingResolutionTick && (
  <SchismPendingBanner
    faction={faction}
    resolutionTick={faction.properties.schismPendingResolutionTick}
    currentTick={state.tick}
  />
)}
```

The banner reads: *"A schism brews. The faction tremors. {N} ticks until the crisis settles."* — countdown updates each tick. Uses existing `Card` + `SectionHeading` primitives from the design system v1 (UI Visual Overhaul project).

### 5.2 Action drawer — surfaces the action

The action drawer is data-driven by `targetCategories` / `targetSubtypes` on `UnifiedActionTemplate`. Setting `targetCategories: ['actor']` + `targetSubtypes: ['faction']` on the schism template (per §3.1) is sufficient — the drawer already filters by these fields for `action.divine-edict` and `action.anoint-champion`. No new drawer code; verify by inspecting the drawer when the focused target is a faction.

**Visual test:** screenshot of the action drawer at 1920×1080 with a faction focused, showing the eight faction verbs (THR-400's seven plus Schism). The order is alphabetical by name — Schism appears between "Reveal Corruption" and "Stir Dissent".

### 5.3 Hex-map signifier

During the pending window (tick range `[schismPlantedTick, schismPendingResolutionTick]`), every hex with a `controls` edge from this faction renders a fractured-ring signifier overlay (a thin red dotted ring breaking into two arcs).

Implementation: extends the existing per-hex signifier overlay pipeline (`HexMapV2` `signifierLayer`). The renderer queries faction.properties.schismPendingResolutionTick at scene-rebuild time. Z-order: above territory tint, below agent dots.

A single visual contract: *if the faction has a pending schism, every hex it controls shows the cracked-ring signifier; on resolution the signifier disappears.* If split happens, the territory split itself is the next-frame visual — half the hexes pick up the new faction's color, the other half stay.

### 5.4 Chronicle event + alert

The plant emits a chronicle entry via `appendRecentEvent` with `significance: 0.7` (high — visible in the chronicle scroll). The resolution emits a second entry with `SCHISM_RESOLUTION_CHRONICLE_SIGNIFICANCE = 0.85` (higher — major beat).

No toast alert on plant (the action drawer already gave the player their feedback). On resolution, a chronicle-highlight pop (existing `ChronicleHighlight` component) catches the player's eye when a schism resolves while they were panned elsewhere.

### 5.5 Debug bridge

Append to `src/debug-bridge.ts`:

```ts
schism: {
  list(): Array<{factionId, factionName, plantedTick, resolutionTick, ticksRemaining}> {
    return getState().graph.getAllNodes()
      .filter(n => n.properties?.schismPendingResolutionTick)
      .map(n => ({ /* ... */ }))
  },
  forceResolve(factionId: string): {outcome, inputs, summary} {
    // sets resolutionTick to current tick + 1, returns expected outcome from decideSchismOutcome dry-run
  },
}
```

Documented in `CLAUDE.md` §Debug Bridge under the existing block.

### 5.6 Three-pillar evidence (Definition of Done)

Closing evidence in the merge commit body or Linear completion comment:

1. **Screenshot at 1920×1080** — faction detail panel showing the pending banner *and* a separate screenshot of the resolved outcome (either split visible on hex map or reform reflected in the panel).
2. **Console output** — `mcp__Claude_in_Chrome__read_console_messages` filtered to errors+warnings during a full plant→resolution playthrough.
3. **`__DEBUG.schism.list()` output** — proves the state field is wired and queryable.

Hex-map signifier verification uses Claude-in-Chrome (Playwright can't see WebGL — per CLAUDE.md viewport contract).

## 6. Wiring section

Reference: `Docs/plans/wiring-checklist.md`. Each module below must be reachable from the live game, not only from tests.

### 6.1 Engine wiring

| Module | Integration point |
|---|---|
| `action.faction.schism` template | Registered in the `UNIFIED_ACTION_TEMPLATES` export of `unified-action-templates.ts` — automatic via the catalog importer |
| `plant_schism` GraphOp | Added to the GraphOp union type + handler dispatch in the apply file (verify with `grep -n "case 'update_node'" src/engine/graphOps`) |
| `phaseSchismResolution` | Imported in `orchestrator.ts`, registered at Phase 6.653 (after `phaseFactionActions`) via `runRegisteredPhases` |
| `applyFactionReform` | Exported from the same module as `applyFactionSplinter` (or sibling) so it can be unit-tested |
| New traces | Added to the trace-buffer type union; trace categories listed in `Docs/canon/encounters.md` if appropriate |
| Constants | `src/data/faction-constants.ts` — re-exported via `faction-definitions.ts` re-export block to follow the existing pattern |

### 6.2 Content wiring

| Module | Integration point |
|---|---|
| `faction.encounter.schism_resolution` template | Registered in the encounter-catalog export (same path the existing `FA_QUEST_BOARD_TEMPLATE` follows) |
| Planted by `phaseSchismResolution` via the standard `encounter_seed` aftermath effect kind — *reuses existing planting machinery* (no new planting path) |
| Splinter name table | Read by `applyFactionSplinter`'s caller (the resolution phase) — passed in as `newFactionName` per the existing effect signature |
| New conditions | Registered in `condition-content.ts`; condition icons follow existing convention in `uiColorPalette.ts` |

### 6.3 UI wiring

| Module | Integration point |
|---|---|
| `SchismPendingBanner` | Rendered conditionally in `FactionDetailPanel.tsx` |
| Action drawer surfacing | No code change — data-driven by `targetSubtypes: ['faction']` (verify by inspecting drawer with a faction focused) |
| Hex-map signifier | New entry in the HexMapV2 signifier pipeline; data source: `graph.getAllNodes().filter(n => n.properties.schismPendingResolutionTick)` → cross to controlled hexes via `controls` edges |
| Chronicle highlight | Existing `ChronicleHighlight` reads the `TickEvent.significance` — significance ≥ 0.8 triggers the highlight pop automatically |
| Debug bridge | Added to `__DEBUG` namespace per §5.5 |

### 6.4 Player controls

The player has one control: **cast `action.faction.schism` on a faction**. There is no UI to cancel a pending schism, no UI to influence the resolution outcome — this is the design (player forces the crisis, does not choose the resolution). After cast the player can observe via banner, hex-map signifier, chronicle, and the planted encounter; they cannot interrupt.

## 7. Mortal-loop bridge

The `faction.encounter.schism_resolution` encounter is the player's first scene-level view of what their cast produced. Critical design property: **the encounter does not retell the resolution — it shows one mortal living through it.** The player gets a high-significance chronicle event for the resolution itself; the encounter is the human consequence.

Targeting: planted on the most-threaded faction member (highest thread tug from the player), tie-broken by reputation. If neither metric distinguishes a clear host, fall back to a random faction member with `member_of` edge intact (post-split, this means a member still in the parent faction OR in the splinter — whichever has higher thread weight from the player).

## 8. Testing (per `testing-patterns` skill)

| Test | What it covers |
|---|---|
| `phaseSchismResolution.unit.test.ts` | Schism resolves on the right tick; outcome decision is deterministic given seed + inputs |
| `phaseSchismResolution.faction-state.test.ts` | Reform applies reputation penalty + expulsion correctly; split routes to `faction_splinter` machinery |
| `phaseSchismResolution.fail-soft.test.ts` | All seven rows of the fail-soft table |
| `encounterAftermath.factionReform.test.ts` | New `applyFactionReform` runtime, mirroring `faction_splinter` tests |
| `unifiedActions.schism.contract.test.ts` | Casting `action.faction.schism` plants properties + emits trace; essence cost deducted |
| `30-tick CLI smoke` | `printf "tick 30\nstatus\nexit\n" \| npm run cli -- --seed 42 --map medium` — engine smoke pass criterion |

Snapshot tests are not required; this is content + engine behavior, both covered by behavioral assertions.

## 9. NFP Compliance summary

| NFP | Compliance |
|---|---|
| **#1 Tunability** | PASS — 9 new named constants in `faction-constants.ts`, no magic numbers |
| **#2 Inspectability** | PASS — 3 new trace categories with TypeScript interfaces, all decisions logged including the input vector |
| **#3 Determinism** | PASS — `decideSchismOutcome` PRNG seeded on `state.tick + factionId`; faction-splinter machinery already deterministic |
| **#4 Fail-soft** | PASS — 7-row fail-soft table; phase wrapped in try/catch; missing inputs default to 0 (drift to reform) |
| **#5 Narrative over mechanical perfection** | PASS — outcome ambiguity is the design hook; reform is *not* a failure, it's a different story; player has no override |
| **#6 Additive over destructive** | PASS — adds new GraphOp, new phase, new function, new constants; reuses existing splinter machinery unchanged |
| **#7 Performance** | PASS — phase scans only nodes with `schismPendingResolutionTick` set (typically 0–2 per tick); decision cost is O(members) at resolution only |

## 10. Open questions (none blocking)

None for the design itself. Two implementation choices CC may resolve:

1. **Splinter-name source.** I've specified a small content table; an alternative is to use the existing dynamic faction naming pipeline (if there is one — verify via `grep -rn "generateFactionName\|factionNameTemplate" src/`). If the existing path exists, prefer it.
2. **Reform module location.** §3.5 suggests siting `applyFactionReform` next to `applyFactionSplinter` in `encounterAftermath.ts`. If that file is already large (it is — 2400+ lines), CC may extract both into `src/engine/factionTopology.ts` in the same PR. The extraction is a low-risk move-only refactor.

## 11. Definition of Done — addendums

In addition to the standard Definition of Done in `CLAUDE.md`:

- [ ] 30-tick CLI smoke includes at least one schism plant + resolution (force with `eval` or wait for the natural cast probability)
- [ ] Screenshot of post-resolution hex map shows either (a) the two halves of a split faction holding different colored territory or (b) the unchanged territory of a reformed faction with the panel showing `lastSchismExpelledCount`
- [ ] One new entry in `Docs/canon/encounters.md` documenting the schism-resolution encounter (it is the first encounter planted by a divine action's deferred-resolution path — pattern worth canonising for future deferred actions)

## 12. Coordination block

* **Suggested model:** `model:opus-4-6` — the encounter template + two outcome chronicles + condition prose is prose-heavy; engine wiring is mechanical but the prose is the bottleneck. (Matching `model:opus-4-6` label applied to the issue.)
* **Mutex with:** any open work touching `src/data/unified-action-templates.ts`, `src/data/faction-constants.ts`, `src/data/faction-action-encounters.ts`, `src/engine/encounterAftermath.ts`, or `src/engine/orchestrator.ts` (the phase registration). Currently no other work is in flight against these files; THR-431/432/433 will need to be sequenced after this lands.
* **Parallel-safe with:** all other open work — Schism's footprint is narrow and the files it edits are not in active mutation right now.
* **Codex review:** **no.** This is judgment-heavy prose + a new subsystem branch; CC-the-executor is the right surface.
* **Done when:** All boxes in §11 plus the standard Definition of Done in `CLAUDE.md`. `npm test` green, `npx tsc --noEmit` clean, `npx vite build` succeeds, 1920×1080 screenshots + `__DEBUG.schism.list()` output attached to closing comment.

---

*Plan authored by Cowork as scheduled-task pickup, 2026-05-12. Vision premise inherited from THR-400's 2026-05-11 audit verdict. No grill-me pre-pass — scope was well-bounded and vision was already settled.*
