# THR-433 — Kindle a Calling (Internal-Pressure Divine Action)

**Date:** 2026-05-14
**Linear:** [THR-433](https://linear.app/threadbare/issue/THR-433) — *Kindle a Calling — internal-pressure divine action (deferred from THR-400)*
**Project:** Social Systems Expansion (Now / High)
**Parent:** [THR-390](https://linear.app/threadbare/issue/THR-390) — Action System Curation & Unlock Roadmap
**Deferred from:** [THR-400](https://linear.app/threadbare/issue/THR-400) §14 deferral #4 (`Docs/plans/2026-05-11-thr-400-faction-action-expansion-reframe.md`)
**Brainstorm companion:** `Docs/plans/2026-05-14-THR-433-kindle-a-calling-brainstorm.md`
**Sibling deferrals:** THR-430 (Schism, In Dev), THR-431 (Reveal Corruption, needs Vision pass), THR-432 (Anoint Successor, Ready for Dev)

## 0. Reading the issue forward

Kindle a Calling is the **redirect** verb of the faction set — but a redirect that the player does not aim. The player pours essence into a faction; the faction's *own* latent pressures decide which want rises; the faction's leadership names the target in an encounter the player only watches. It is the cleanest faction-scale expression of Non-Negotiable #1 ("the player is a god, not a protagonist"): the verb's entire shape is *you supply the heat, the world supplies the want.*

The deferral exists because the issue body names an **internal-pressure resolver** that does not exist. This plan designs that resolver — but it does **not** build a parallel authored-content system. The resolver rides the faction-ambition machinery that already ships (`src/engine/factionAmbitions.ts`): `scoreEligibleAmbitions` already produces weighted `FactionAmbitionType` candidates from each faction's `ambitionWeights` plus world-context eligibility. Kindle a Calling adds **one bias layer** on top of that existing scoring, **one essence-amplification step**, and **one encounter**. No new authored field on `FactionDefinition`. No new ambition enum.

### 0.1 The one interpretation call — and why (the design fork)

The issue body contains **two readings of "latent goal candidates"** and they are not the same design:

- **Reading A (authored):** *"Latent goal candidate authoring — for each faction definition, a small set of candidate ambitions (3–5)."* A new hand-authored `latentCallings` field on every `FactionDefinition`.
- **Reading B (derived):** *"Reads the faction's latent goal candidates (engine-built from ambition history + member pulls + doctrine + leader bias)."* The candidates emerge from live simulation state; nothing is authored per faction.

**This plan takes Reading B.** Rationale:

1. **Non-Negotiable #4 — the world simulates around the player.** The rename rationale for this verb is that it *"amplifies whatever latent ambition the faction already holds."* An authored static menu does not reflect what a faction *became* through play; a derived candidate set does. The want that rises must be the faction's actual want, not a designer's pre-baked list.
2. **It rides verified substrate.** `scoreEligibleAmbitions` + `selectAmbitionType` already do weighted candidate selection (`factionAmbitions.ts:65–128`). Reading B *extends* that; Reading A builds a parallel system beside it.
3. **Zero per-faction authoring burden, and it works for generated factions.** Reading A requires authoring `latentCallings` for every entry in `FACTION_DEFINITIONS` and for every dynamically-seeded monster faction. Reading B works for all factions for free.
4. **The "finer granularity" the issue wants is the `targetNodeId`, not a new enum.** The issue says `territorial_expansion` is "too broad — needs 'expand westward' / 'reclaim the lost province' specificity." That specificity already has a home: `FactionAmbition.targetNodeId` ("Will be set when army/action targets are chosen"). "Reclaim the lost province" = `territorial_expansion` + `targetNodeId` → a specific settlement. The **`faction.encounter.calling_named` encounter is where the target is named** — that is the verb's whole narrative point. Specificity lives in the target resolution and the encounter prose, not in a proliferated type enum.

This is the single substantive interpretation call in the plan. It is flagged in §15 for Christian's awareness; if Reading A was intended, the design is larger and needs a re-scope. Everything below assumes Reading B.

### 0.2 What the codebase actually does today (verified before authoring)

| Claim | Where | Verified |
|------|-------|----------|
| Factions are graph nodes (`actorType: 'faction'`) | `src/engine/factionAmbitions.ts:143–144`, `factionNetwork.ts:128–131` | ✅ |
| Faction ambitions are `ambition` nodes connected via `pursues` edges (faction → ambition) | `factionAmbitions.ts:153–157, 221–231` | ✅ |
| `phaseFactionAmbitions` already does weighted candidate selection from `ambitionWeights` + eligibility | `factionAmbitions.ts:65–128, 202–219` | ✅ |
| Ambition evaluation runs every `FACTION_AMBITION_EVALUATION_INTERVAL` (5) ticks | `factionAmbitions.ts:23, 141` | ✅ |
| `FactionAmbitionType` is a 6-value enum | `src/types/faction.ts:140–146` | ✅ |
| Ambition node carries `ambitionType`, `priority`, `targetNodeId`, `grievanceDecay`, `createdTick` | `factionAmbitions.ts:208–219` | ✅ |
| `pursues` edge carries `priority`, `status`, `milestones` | `factionAmbitions.ts:221–231` | ✅ |
| `requiresMilitaryForce` / `MILITARY_AMBITION_TYPES` gate army spawning | `faction.ts:163–171`, `factionAmbitions.ts:245–250` | ✅ |
| Army spawns at ambition-*creation* time via `spawnArmy(state, factionId, commander, ambitionId)` | `factionAmbitions.ts:243–250` | ✅ |
| Agents carry `axiologicalProfile: Record<ValuePair, number>` on `node.properties` (optional) | `src/types/agent.ts:22`, `src/engine/agentDetail.ts:263, 303, 847` | ✅ |
| 9 canonical `ValuePair`s (loyalty_ambition, preservation_transformation, …) | `agent.ts:25–35` | ✅ |
| Faction leader is *derived* from member scores (not stored) — `getFactionNetworkSummary().leader` / `getFactionLeader` | `factionNetwork.ts:163–164`, `phaseFactionActions.ts` (verified in THR-432 §0.1) | ✅ |
| `encounter_seed` is the canonical follow-on mechanism — `PendingEncounterSeed`, `evaluateEncounterSeeds` phase, `encounter_seed_planted`/`_triggered` traces | `src/types/gameState.ts:273–274`, `src/types/trace.ts:77–78` | ✅ |
| Faction-action encounter content lives in `src/data/faction-action-encounters.ts` (file exists; `UnifiedActionTemplate` encounter exports) | `faction-action-encounters.ts:1–60` | ✅ |
| `applyFactionReputationGain` exists for faction-reputation mutation (pass-through for the stall penalty) | `src/engine/factionReputation.ts:40` | ✅ |
| `divine.inspire` ("Breath of Purpose" — "kindles … a sense of calling and passionate purpose") is the agent-scale precedent, reach `heart` | `src/data/unified-action-templates.ts:423–434` | ✅ |

**Substrate that does NOT exist in the working tree and is treated defensively:**

- The `action.faction.*` verb family and `src/data/faction-action-constants.ts` — created by **THR-400**, whose PR (#276) was blocked by a CI billing failure (impediment #136). At authoring time, `grep` for `action.faction` / `STIR_DISSENT_INCREMENT` returns **zero hits** in the tree. This plan therefore treats THR-400's outputs as a hard dependency (§16 mutex/order) and is written so that *if the constants file is absent at pickup, the executor creates it* — exactly the pattern THR-432 §6 used. The freshness signal this session was `unknown` (sandbox git has no network); the executor must re-verify against `origin/main` at pickup.
- `faction.properties.dissentLevel` (THR-400 Stir Dissent) and `faction.properties.recoveredDoctrineId` (THR-400 Recover Doctrine). The bias layer (§5.2) reads both — but reads them as **optional**: absent → that bias term is 0. The verb is fully functional with or without THR-400's property additions.

## 1. Codesight pre-flight — Blast Radius

**Files touched:**

| File | Importer count | Change | Risk note |
|------|---------------:|--------|-----------|
| `src/engine/factionAmbitions.ts` | ≈15–25 (orchestrator + tests) | additive — new exported `resolveKindledCalling()`, new `computeKindleBias()` helper, new exported `KINDLE_*` references; reuses in-file `mulberry32`/`hashString`/`scoreEligibleAmbitions`/`selectAmbitionType` | additive functions only; no edits to `phaseFactionAmbitions` control flow except the §5.5 stall-fade check |
| `src/data/unified-action-templates.ts` | ≈30 | additive — one new template entry (`action.faction.kindle_a_calling`) | no edits to existing entries |
| `src/data/faction-action-constants.ts` | ≈5 (created by THR-400) | additive — `KINDLE_*` constants appended; **if THR-400 has not landed, create the file** | additive |
| `src/data/faction-action-encounters.ts` | ≈8 | additive — `faction.encounter.calling_named` content | additive |
| `src/types/faction.ts` | ≈40 | additive — `FactionKindleCallingTrace` interface; one-line comment documenting the new optional ambition-node properties (`kindledByAscendant`, `kindledTick`, `kindledCommitted`, `kindledStallDeadlineTick`) | additive interface + doc comment; no structural field change |
| the faction-verb executor module (THR-400 pattern — `factionAction.ts` or a `faction-action-executors` module) | ≈10 | additive — one post-resolution handler keyed to `action.faction.kindle_a_calling` | additive; mirrors THR-400's per-verb executors |
| `Docs/plans/wiring-checklist.md` | — | additive — register the new verb + trace | doc only |
| `Docs/plans/2026-04-16-systemic-wiring-guide.md` | — | additive — the kindle resolver is a content-facing capability (see §9) | doc only |
| `Docs/canon/rulebook.md` | — | additive — one action-verb row, `[DESIGN]` until merge | doc only |

**No file with ≥100 importers is touched.** `src/types/faction.ts` (≈40) is the highest-impact file and the change is a new interface + a comment — no edits to `FactionDefinition`, `FactionAmbition`, or any existing type. **No Blast Radius escalation section required.**

## 2. Substrate — what exists, what this issue builds

**Rides existing substrate:**
- `ambition` nodes + `pursues` edges; `phaseFactionAmbitions`' creation pattern (`factionAmbitions.ts:202–252`).
- `scoreEligibleAmbitions` (weighted candidate set from `ambitionWeights` + eligibility) and `selectAmbitionType` (seeded weighted draw) — currently module-private; this issue exports them or calls them in-file.
- Agent `axiologicalProfile` (`agent.ts:22`); the 9 `ValuePair`s.
- Faction leader derivation (`getFactionNetworkSummary().leader`; or `getAnointedLeaderId`-first once THR-432 lands — either works, the bias layer only needs *a* leader id).
- `encounter_seed` planting (`PendingEncounterSeed`, `evaluateEncounterSeeds`); the THR-400 reframe §7.2 `seedDissentSurfacesEncounter` pattern.
- `UnifiedActionTemplate` divine-action shape (`divine.inspire`, `divine-edict`, the THR-400 `action.faction.*` family).
- The faction-verb post-resolution executor pattern established by THR-400.

**Built by this issue (the internal-pressure resolver):**
- `resolveKindledCalling(state, factionId)` — orchestrates: base candidates → bias layer → essence sharpening → seeded draw → ambition node + `pursues` edge → encounter seed (`factionAmbitions.ts`).
- `computeKindleBias(state, factionId, candidates)` — the four-signal re-weighting (`factionAmbitions.ts`).
- `AMBITION_AXIS_AFFINITY` — a constant table mapping each `FactionAmbitionType` to the `ValuePair` poles that push it.
- `action.faction.kindle_a_calling` template + its post-resolution executor handler.
- `faction.encounter.calling_named` encounter content.
- `FactionKindleCallingTrace`.
- The §5.5 stall-fade check (additive to `phaseFactionAmbitions`).

**Not built here (out of scope):**
- A new authored `latentCallings` field (see §0.1 — Reading A is rejected).
- Any change to the `FactionAmbitionType` enum.
- Schism's faction-split, Reveal Corruption's hidden-state schema, Anoint Successor's succession edges — sibling deferrals, their own tickets.
- A first-class faction "doctrine pressure" subsystem — the bias layer *reads* `recoveredDoctrineId` if THR-400 set it, but does not own doctrine.

## 3. Non-Negotiables compliance (`Docs/plans/2026-04-16-game-design-direction.md`)

| Non-negotiable | Resolution in this plan |
|----------------|-------------------------|
| #1 Player is a god, not a protagonist | The player supplies essence; the **bias layer** (member pulls + leader + doctrine + dissent) decides which want rises; the **seeded PRNG** draws; the **encounter** names the target. The player never selects the ambition, never names the target. They choose *whether to press the calling home or let it cool* — a god's pressure, not a protagonist's plan. |
| #2 The thread is the substrate | The verb fires on a faction but its payoff lands as a `faction.encounter.calling_named` scene on the faction's **leader** — a named mortal. If the leader is unthreaded, the encounter is still the player's window onto the consequence. |
| #3 All mechanics surface through prose | `kindledByAscendant`, `priority`, `biasedWeights` never appear as numbers in player UI. The player reads the chronicle band (§7.2), the faction panel's kindled-ember glyph (§8.2), and the encounter. |
| #4 The world simulates around the player | The verb does **not** fabricate a want — the design fork (§0.1) is resolved toward derived candidates *precisely so* the calling reflects what the faction has actually become. No eligible candidate → the verb is not surfaced; nothing is invented. |
| #5 Vision edits ride with the design | No Vision page edit required — the verb rides existing premises (indirect, thread-mediated divine influence; the player sets conditions the world resolves). See §15. |

## 4. The design at a glance

| Field | Value |
|-------|-------|
| Template id | `action.faction.kindle_a_calling` |
| Name / spell name | Kindle a Calling / *Breath in the Embers* |
| Reach / Sphere | **heart / force** — reassigned from the issue's "life / force" (see §15 note 2: `life` is a Creation Sphere, not a Reach; `heart` is the companion reach of `divine.inspire`, the agent-scale "kindle a calling") |
| CRUD verb | `create` — it brings an `ambition` node + `pursues` edge into existence (companion-consistent with THR-432; see §15 note 3) |
| Cost / rarity | essence `KINDLE_A_CALLING_ESSENCE_COST` (10) · rarity tier 2 (Storied) |
| Target | `faction` (the strategic-layer target; resolution per the THR-400 reframe §2 model) |
| Engine effect | runs `resolveKindledCalling` — bias-weighted seeded draw over the faction's eligible ambition candidates; creates the kindled ambition (`priority: KINDLE_INITIAL_PRIORITY`, `kindledByAscendant: true`, `kindledCommitted: false`); attaches the `pursues` edge, replacing a non-locked existing ambition |
| Mortal-loop bridge | `faction.encounter.calling_named` planted on the faction's leader — the god chooses *press home* (commit) or *let it cool* (stall) |
| Surfacing | drawer entry appears when the focused target is a faction with ≥1 eligible ambition candidate (absent, not greyed, otherwise — legibility model per THR-400 reframe §9.1) |

## 5. Engine pillar

### 5.1 `resolveKindledCalling` — the resolver

New exported function in `src/engine/factionAmbitions.ts` (its natural home — the ambition machinery and the in-file `mulberry32`/`hashString` helpers are already there; the issue's coordination block names `factionAmbitions.ts` as the mutex file).

```
resolveKindledCalling(state, factionId): KindleResult
```

Steps, per cast:

1. **Resolve the faction definition** — `factionDefId ?? factionDefinitionId` (the existing dual-key read at `factionAmbitions.ts:149`). No definition → fail-soft (§11).
2. **Base candidates** — `scoreEligibleAmbitions(state, factionId, definitionId)`. Empty → the action fails-soft with essence refund and prose (§11): kindling *nothing* is a no-op the player is not charged for. This also means the drawer does not surface the verb for a faction with no eligible candidate (§8.1).
3. **Bias layer** — `computeKindleBias(state, factionId, baseCandidates)` returns the candidates with re-weighted `weight` values (§5.2).
4. **Essence sharpening** — raise every biased weight to `KINDLE_WEIGHT_EXPONENT` (>1). This is the mechanical meaning of "pouring heat into the embers": without it, kindling is close to a coin-flip; with it, the faction's *strongest* latent pressure becomes much more likely to be the want that rises. The player still does not choose — but the verb *amplifies what the faction most wants*, which is the rename's whole intent.
5. **Seeded draw** — `selectAmbitionType` over the sharpened candidates, PRNG seeded `mulberry32(state.seed + state.tick * 47 + hashString(factionId) + KINDLE_TIEBREAK_SALT)` — the exact per-faction-per-tick seeding pattern `factionAmbitions.ts:203` already uses (NFP #3).
6. **Replace-or-create** — read the faction's current `pursues` edge:
   - No current ambition → create the kindled ambition + `pursues` edge.
   - Current ambition is **not locked** → remove the old ambition node + `pursues` edge (the existing abandon path, `factionAmbitions.ts:165`), then create the kindled one. Record `replacedAmbitionType` in the trace.
   - Current ambition is **locked** (a committed military ambition the faction has already raised an army for — see §5.4) → the action fails-soft with essence refund and prose *"The faction is already marching — you cannot redirect a war with an ember."*
7. **Create the kindled ambition** — same node/edge shape as `factionAmbitions.ts:208–231`, with extra properties: `kindledByAscendant: true`, `kindledTick: state.tick`, `kindledCommitted: false`, `priority: KINDLE_INITIAL_PRIORITY`, `targetNodeId: null` (the encounter resolves the target). `pursues` edge `status: 'active'`, `priority: KINDLE_INITIAL_PRIORITY`. **No army is spawned here** — army spawn waits for the encounter's commit branch (§5.4).
8. **Plant the encounter** — `faction.encounter.calling_named` on the faction's leader (derived leader id), `delayTicks: KINDLE_ENCOUNTER_DELAY`, via the existing `encounter_seed` mechanism. If the faction has no leader, the seed targets the highest-rank member; if no members, the seed is skipped and the kindled ambition simply stands (fail-soft, §11).
9. **Emit `FactionKindleCallingTrace`** (§10) and call `touchStructure()` / `touchWorld()` per the CLAUDE.md world-version-counter decision.

### 5.2 `computeKindleBias` — the four-signal re-weighting

For each base candidate `{ type, weight }`, multiply `weight` by `(1 + Σ signalContributions)`. Four signals, each clamped ≥ 0:

**(a) Member axiological alignment** — `KINDLE_MEMBER_ALIGNMENT_GAIN`.
Scan the faction's `member_of` members; aggregate their `axiologicalProfile` (`Record<ValuePair, number>`) into a mean profile. For each candidate type, look up `AMBITION_AXIS_AFFINITY[type]` — the `ValuePair` poles that push it — and score how strongly the aggregate profile leans those poles. Contribution = `KINDLE_MEMBER_ALIGNMENT_GAIN × alignmentScore` (alignmentScore ∈ [0,1]). Members with no `axiologicalProfile` are skipped; zero members → this term is 0.

**(b) Leader bias** — `KINDLE_LEADER_BIAS_GAIN`.
Resolve the faction leader (derived; `getAnointedLeaderId`-first once THR-432 lands — either path yields a leader id). The leader's own `axiologicalProfile` scored against `AMBITION_AXIS_AFFINITY[type]` exactly as in (a). The leader counts *more* than any single member (`KINDLE_LEADER_BIAS_GAIN > KINDLE_MEMBER_ALIGNMENT_GAIN`) — the head of a faction shapes its callings disproportionately. No leader → this term is 0.

**(c) Doctrine pressure** — `KINDLE_DOCTRINE_GAIN`.
If `faction.properties.recoveredDoctrineId` is set **and** within `recoveredDoctrineExpiresTick` (THR-400 Recover Doctrine substrate — read defensively; absent → term is 0), add `KINDLE_DOCTRINE_GAIN` to the `cultural_dominance` and `divine_mandate` candidates. A faction freshly reconnected to a recovered teaching leans toward spreading/serving it.

**(d) Dissent pressure** — `KINDLE_DISSENT_GAIN`.
If `faction.properties.dissentLevel` is set (THR-400 Stir Dissent substrate — read defensively; absent → term is 0), add `KINDLE_DISSENT_GAIN × dissentLevel` to the `revenge` and `defensive_consolidation` candidates. A restless faction turns inward or lashes out.

`computeKindleBias` also records, per candidate, **which signal contributed most** — surfaced in the trace as `dominantSignal` ('member' | 'leader' | 'doctrine' | 'dissent' | 'base') for inspectability ("why did *this* calling rise?").

**`AMBITION_AXIS_AFFINITY`** — a named constant table (NFP #1), e.g.:

| Ambition type | Pushed by `ValuePair` poles |
|---------------|----------------------------|
| `territorial_expansion` | loyalty→**ambition**, preservation→**transformation**, courage→**courage** |
| `defensive_consolidation` | preservation→**preservation**, courage→**prudence**, sacrifice→**survival** |
| `resource_acquisition` | asceticism→**extravagance**, loyalty→**ambition** |
| `cultural_dominance` | tradition→**tradition**, revelation→**revelation** |
| `revenge` | mercy→**ruthlessness**, honesty→**cunning** |
| `divine_mandate` | loyalty→**loyalty**, sacrifice→**sacrifice** |

Tunable; the executor may adjust pole assignments — the structure is what matters.

### 5.3 The action's resolution hook

`action.faction.kindle_a_calling`'s effect cannot be a static template GraphOp (it must read faction state, run a weighted draw, create a node + edge, plant an encounter). It is a **typed post-resolution handler keyed to the template id**, exactly the shape THR-400 established for its `action.faction.*` verbs and THR-432 §5.5 used. The handler calls `resolveKindledCalling(state, factionId)` and surfaces the `KindleResult` (success / failed-soft) back through the unified-action trace path. The executor places the handler wherever THR-400's per-verb handlers consolidated (`factionAction.ts` or a `faction-action-executors` module) — consistency with the sibling verbs over a fresh location.

### 5.4 Army-spawn gating and the "locked" rule

The existing `phaseFactionAmbitions` spawns an army the moment it *creates* a military ambition (`factionAmbitions.ts:243–250`). `resolveKindledCalling` creates the kindled ambition itself and **must not call `spawnArmy`** — a kindled-but-uncommitted calling has not been pressed home. Army spawn happens only in the encounter's **commit** branch (§7.3).

**Wiring concern (executor must verify):** confirm no *other* system auto-spawns an army for any military ambition that lacks one. If one does, gate it on `kindledByAscendant === true && kindledCommitted === false` → skip. This is the one interaction-surface risk in the plan; flagged in §15 note 4.

**The "locked" rule (§5.1 step 6):** an existing ambition is *locked* — and therefore not replaceable by Kindle — when the faction has already raised an army pursuing it. Detection uses the existing army↔faction/ambition linkage (the executor verifies the exact accessor in `armySpawning.ts` at pickup — the `ambitionId` is passed to `spawnArmy` but its storage on the army node was not confirmable from the mounted tree). **Safe fallback if the linkage is not cheaply queryable:** treat any `requiresMilitaryForce` ambition that is `kindledCommitted` *or* older than `KINDLE_LOCK_GRACE_TICKS` as locked. Either way the player-facing behavior is identical — fail-soft with refund and prose.

### 5.5 Stall-fade — additive check in `phaseFactionAmbitions`

The encounter's **stall** branch (§7.3) sets `kindledStallDeadlineTick = state.tick + KINDLE_STALL_FADE_TICKS` on the kindled ambition node. `phaseFactionAmbitions` gains a 3-line additive check at the top of its per-faction loop (before the existing active-ambition logic):

```
if (activeAmbition?.properties.kindledStallDeadlineTick != null
    && state.tick >= activeAmbition.properties.kindledStallDeadlineTick) {
  // remove node + pursues edge — the existing abandon path (factionAmbitions.ts:165)
  // emit FactionAmbitionTrace { event: 'abandoned', reason: 'kindled_calling_faded' }
}
```

`phaseFactionAmbitions` runs every 5 ticks, so the fade resolves within ≤5 ticks of the deadline — narratively tolerable ("the calling fades back to latent" is inherently soft) and avoids touching the every-tick `phaseFactionActions.ts` (smaller blast radius). The slop is documented; if precision is ever wanted, the check moves to `phaseFactionActions.ts` with no design change.

## 6. Constants table (NFP #1)

New constants in `src/data/faction-action-constants.ts` (created by THR-400; **if THR-400 has not landed when this is picked up, create the file** — same instruction THR-432 §6 carries).

| Constant | Default | Used by | Purpose |
|----------|--------:|---------|---------|
| `KINDLE_A_CALLING_ESSENCE_COST` | 10 | template | essence cost of Kindle a Calling |
| `KINDLE_MEMBER_ALIGNMENT_GAIN` | 0.6 | bias layer (a) | how much aggregate member axiological alignment biases a candidate |
| `KINDLE_LEADER_BIAS_GAIN` | 0.9 | bias layer (b) | how much the leader's axis biases the matching candidate (> member gain — the head shapes the calling) |
| `KINDLE_DOCTRINE_GAIN` | 0.5 | bias layer (c) | bias toward `cultural_dominance` / `divine_mandate` when a recovered doctrine is active |
| `KINDLE_DISSENT_GAIN` | 0.7 | bias layer (d) | per-unit-dissent bias toward `revenge` / `defensive_consolidation` |
| `KINDLE_WEIGHT_EXPONENT` | 1.8 | essence sharpening | exponent applied to biased weights before the draw — makes the dominant pressure dominate |
| `KINDLE_INITIAL_PRIORITY` | 0.4 | kindled ambition | priority of a freshly-kindled, uncommitted ambition (below a committed one) |
| `KINDLE_COMMITTED_PRIORITY` | 0.9 | encounter commit branch | priority after the faction commits to the calling |
| `KINDLE_ENCOUNTER_DELAY` | 3 | encounter seed | ticks between cast and the `calling_named` encounter becoming eligible |
| `KINDLE_STALL_FADE_TICKS` | 8 | encounter stall branch / §5.5 | ticks after a stall choice before the kindled ambition is removed (±5 — see §5.5) |
| `KINDLE_STALL_REPUTATION_PENALTY` | 0.08 | encounter stall branch | faction reputation drop on stall (the cost of indecision) |
| `KINDLE_LOCK_GRACE_TICKS` | 20 | §5.4 locked-rule fallback | age past which a military ambition is treated as "locked" if the army linkage is not cheaply queryable |
| `KINDLE_TIEBREAK_SALT` | `0xca11` | seeded draw | PRNG salt for the per-faction-per-tick seed |

Reach / sphere / rarity literals are enums, not constants (existing template-authoring convention — THR-400 reframe §6, THR-432 §6).

## 7. Content pillar

### 7.1 Template prose

```
{
  id: 'action.faction.kindle_a_calling',
  name: 'Kindle a Calling',
  spellName: 'Breath in the Embers',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  description: 'You pour heat into the embers the faction has been keeping. '
    + 'Whatever was waiting to be wanted now wants. You do not get to choose '
    + 'which want rises — only that one will.',
  reach: 'heart',
  crudType: 'create',
  scale: 'cosmic',
  sphereAffinity: 'force',
  essenceCost: KINDLE_A_CALLING_ESSENCE_COST,
  apCost: 1,
  actorAffinities: ['ascendant'],
  motivations: ['loyalty_ambition', 'preservation_transformation'],
  targetCategories: ['faction'],
  steps: [{
    reach: 'heart',
    duration: { min: 1, max: 1 },
    difficulty: 0.0,
    onSuccess: [/* post-resolution handler — see §5.3 */],
    onFailure: [],
    failBehavior: 'fail_action',
  }],
  narrativeTemplates: {
    initiation: 'breathes heat into a faction\'s banked embers',
    success: 'something the faction was keeping quiet now burns — a calling has risen',
    failure: 'the embers are cold; this faction has nothing left it is waiting to want',
  },
}
```

`crudType: 'create'` — Kindle a Calling brings an `ambition` node + `pursues` edge into existence; per the five-verb system ("Create — bring something into existence") this is correct, and it matches the sibling THR-432 (`anoint_successor` is also `create`). The agent-scale companion `divine.inspire` is `update` — a deliberate, low-risk divergence; flagged §15 note 3 for the executor to revisit if the unified-action pipeline gates `create` templates differently.

### 7.2 IPK / chronicle band

One short post-state line on cast, with the faction name as an IPK keyword (existing `ProseKeyword.tsx` underline pattern):

> *"Inside the {factionName}, something long banked has caught. No one named it yet — but the room can feel it wants."*

On the `calling_named` encounter's **commit** outcome, a second band:

> *"The {factionName} has named what it wants. {leaderName} spoke it aloud, and now it cannot be unspoken."*

On **stall**:

> *"The calling in the {factionName} went unanswered. {leaderName} let the room cool. The embers bank again — and remember."*

No new prose tables required beyond these three bands.

### 7.3 The `calling_named` encounter

Authored in `src/data/faction-action-encounters.ts`, family `faction_internal_pressure` (matching THR-400's encounter family), per the `encounter-pipeline` / `prose-content-systems` discipline. Planted on the faction's leader when `resolveKindledCalling` fires.

A 2-beat scene. **Beat 1 — the gather:** the leadership convenes; the kindled want is in the room, felt but unnamed; the leader carries the weight of speaking it. **Beat 2 — the naming and the choice:** the leadership debates and the calling takes specific shape — *this* is where the `targetNodeId` is resolved (e.g. `territorial_expansion` → the most-contested adjacent settlement; `revenge` → the faction's standing `grievanceSourceId`; `resource_acquisition` → the richest reachable hex). The player watches the naming; they do not author it.

**Two choices, each a god-action with an explicit moral-axis tilt on the card (Heart axis — Sworn ↔ Renegade — per `2026-05-04-encounter-experience-design-plan.md` Rule 2 and the encounters-canon "all choices are god actions" rule):**

1. **Press the calling home** *(Sworn — the god lends divine weight; the faction binds itself)* — the kindled ambition's `priority` → `KINDLE_COMMITTED_PRIORITY`; `kindledCommitted: true`; `targetNodeId` resolved and set; an army spawns if `requiresMilitaryForce` (§5.4). Aftermath: the leader gains a `kindled_resolve` condition. The encounter **plants one follow-on `encounter_seed`** — the faction's first concrete step toward the calling, scored against the now-committed ambition (systemic wiring guide Capability 2).
2. **Let the room cool** *(toward Renegade / prudence — the god withdraws the heat; the faction is not bound)* — `kindledStallDeadlineTick` is set on the ambition (§5.5); within ≤`KINDLE_STALL_FADE_TICKS`+5 ticks it fades back to latent. The faction's reputation drops by `KINDLE_STALL_REPUTATION_PENALTY`. The leader gains an `indecisive_leadership` hidden mark — "the calling they let go cold" — available to future encounter content (systemic wiring guide hidden-mark capability).

**Enrichment placeholders (≥2 required — systemic wiring guide Capability 1):** `{name}` (the leader), `{factionName}`, `{?has_rival}` / `{?has_ally}` (colors what the calling means in context — a faction with rivals kindling `revenge` reads very differently from one without), `{callingFraming}` (the specific narrative shape of the kindled want — derived from the `dominantSignal` and the resolved `targetNodeId`).

Threadbearer voice: short, charged, mythic — not a tooltip dump. The drawer card is two sentences; the **encounter** is where the verb's narrative weight lives.

### 7.4 What we are NOT writing

No player-facing numbers — `priority`, `biasedWeights`, `kindledTick` never surface as digits (Non-Negotiable #3). No new authored `latentCallings` content per faction definition (§0.1 — Reading A rejected). No prose for the sibling deferrals (THR-430 Schism, THR-431 Reveal Corruption, THR-432 Anoint Successor) — those ship with their own tickets.

## 8. UI pillar

### 8.1 Action drawer surfacing

`action.faction.kindle_a_calling` appears in the drawer when the focused target is a **faction with ≥1 eligible ambition candidate** (`scoreEligibleAmbitions` non-empty).

| Condition | Surfaced? |
|-----------|-----------|
| Focused target is a faction with ≥1 eligible ambition candidate | yes |
| Faction has zero eligible candidates (all `ambitionWeights` zero / all ineligible) | no — absent, not greyed (legibility-correct per THR-400 reframe §9.1) |
| Faction's current ambition is "locked" (committed army — §5.4) | **yes** — surfaced, but the cast fails-soft with refund + prose; "locked" is not cheaply legible to the player, so absence would be misleading |
| Focused target is not a faction | no |

### 8.2 Faction detail panel

When a faction is selected (`FactionSheet.tsx` / `ThreadDetailView.tsx` — both already render the faction `summary` and its ambition):
- If the faction has a `kindledByAscendant` ambition with `kindledCommitted: false`: a small **kindled-ember glyph** next to the ambition display. Tooltip: *"A calling has been kindled — it waits to be named, or to cool."* No numbers.
- Once committed (post-encounter), the glyph clears — it is just the faction's ambition now, rendered by the existing ambition UI. The "by the ascendant's breath" provenance is available to the ambition tooltip as a subtle sublabel (the visible echo of a calling the player kindled).

### 8.3 Chronicle / event log

On cast: the §7.2 first band. On the `calling_named` encounter firing: the encounter's own chronicle entry takes over; on its resolution: the §7.2 commit/stall band. Routed through the existing faction-trace → ChroniclePanel integration (same path `action.divine-edict` and the THR-400 verbs use).

### 8.4 Debug inspection

`DebugPanel` faction inspector gains:
- The kindled ambition's `kindledByAscendant`, `kindledTick`, `kindledCommitted`, `kindledStallDeadlineTick` (raw — debug only).
- The `FactionKindleCallingTrace` (§10) in the trace stream — including the full `biasedWeights` candidate→weight map and `dominantSignal`, so a developer can answer "why did *this* calling rise?" without re-deriving it.

### 8.5 Screenshot evidence at closeout (1920×1080, per Definition of Done)

1. Action drawer with a faction selected, **Kindle a Calling** visible.
2. Faction detail panel showing the kindled-ember glyph after a cast.
3. The `faction.encounter.calling_named` encounter mid-flight (press-home / let-it-cool cards with axis tilts).
4. DebugPanel showing the `FactionKindleCallingTrace` with the `biasedWeights` map.

DOM surfaces → Playwright (`preview_resize(1920,1080)` → `preview_screenshot`). Any HexMap/WebGL surface → Claude-in-Chrome. Plus a console-output block and a `window.__DEBUG.*` assertion (e.g. `window.__DEBUG.eval("state.graph.getOutgoingEdges('<factionId>','pursues')")`).

## 9. Wiring section

| Wiring point | Connection |
|--------------|-----------|
| Orchestrator phase | no new phase — `resolveKindledCalling` runs from the action's post-resolution handler (on cast); the §5.5 stall-fade is an additive check inside the existing `phaseFactionAmbitions` |
| Action drawer | `src/components/actions/*` reads `targetCategories: ['faction']` + the §8.1 surfacing predicate (`scoreEligibleAmbitions` non-empty) |
| Encounter pipeline | `faction.encounter.calling_named` planted via the existing `encounter_seed` mechanism (THR-400 reframe §7.2 pattern); pickup uses the existing portfolio-mortal path |
| Chronicle | new `FactionKindleCallingTrace` → ChroniclePanel via the existing faction-trace integration |
| DebugPanel | faction inspector + trace stream — §8.4 |
| Prose enrichment | the `calling_named` encounter uses existing `enrichProse()` placeholders; **no new placeholders introduced** |
| Player controls | action drawer only; no new hotkeys; no new modals (the encounter modal is the existing one) |
| Ambition system | `resolveKindledCalling` reuses `scoreEligibleAmbitions` / `selectAmbitionType` / the ambition-node-creation pattern; the stall-fade rides the existing abandon path |

**Update `Docs/plans/wiring-checklist.md`** — add `action.faction.kindle_a_calling` to the faction-verb surfacing list and `FactionKindleCallingTrace` to the trace list. **Update `Docs/plans/2026-04-16-systemic-wiring-guide.md`** — the kindle resolver is a content-facing capability (an encounter author can now reason about "the faction's calling was kindled by the ascendant"); document it alongside the THR-400 faction-verb capabilities.

## 10. Traces (NFP #2)

One new trace, defined in `src/types/faction.ts` alongside `FactionAmbitionTrace` (co-located with the ambition concepts it extends — the executor may instead place it in `factionAction.ts` if that is where the THR-400 faction-verb traces consolidated; either is fine, flag the choice in the PR):

```ts
export interface FactionKindleCallingTrace {
  tick: number;
  category: 'faction_kindle_calling';
  factionId: string;
  factionName: string;
  candidateCount: number;
  biasedWeights: Record<FactionAmbitionType, number>;  // post-bias, pre-sharpening — "why this calling?"
  selectedAmbitionType: FactionAmbitionType;
  dominantSignal: 'member' | 'leader' | 'doctrine' | 'dissent' | 'base';
  replacedAmbitionType: FactionAmbitionType | null;     // the ambition Kindle displaced, if any
  leaderId: string | null;                              // encounter target
  seededEncounterId?: string;                           // set when the calling_named seed plants
  outcome: 'kindled' | 'failed_no_candidates' | 'failed_locked' | 'failed_no_definition';
}
```

Added to the trace union the DebugPanel and trace consumers switch on. `category: 'faction_kindle_calling'` is new — register it in the DebugPanel category grouping. The Kindle a Calling *cast* itself also emits via the existing unified-action trace path (same as the THR-400 verbs). The `calling_named` encounter's commit/stall outcome rides the existing encounter-aftermath trace path — no extra trace needed for it.

## 11. Fail-soft posture (NFP #4)

| Failure surface | Behavior | Why |
|-----------------|----------|-----|
| Faction has no definition (`factionDefId`/`factionDefinitionId` both unset) | action fails; essence refunded; `outcome: 'failed_no_definition'`; prose *"This faction has no shape the world remembers — there is nothing in it to kindle."* | don't crash; tell a small story |
| `scoreEligibleAmbitions` returns empty | action fails; essence refunded; `outcome: 'failed_no_candidates'`; prose *"the embers are cold."* Also → verb not surfaced (§8.1) | kindling nothing is a no-op the player is not charged for |
| Current ambition is locked (committed army) | action fails; essence refunded; `outcome: 'failed_locked'`; prose *"you cannot redirect a war with an ember."* | respects the simulation's committed resources |
| Faction has zero members | resolver still runs; bias terms (a) collapse to 0; the calling still rises from base weights; no encounter seeded (no leader/members) — the kindled ambition simply stands | a faction with no one in it can still *want*; don't crash |
| Faction has no leader | encounter seed targets the highest-rank member; if none, seed skipped, kindled ambition stands | THR-400 reframe §5.1 bridge pattern |
| Member / leader has no `axiologicalProfile` | that member/leader is skipped in the bias layer; base weights still drive the draw | tolerate missing data |
| THR-400 substrate absent (`dissentLevel` / `recoveredDoctrineId` unset, or the constants file missing) | bias signals (c)/(d) are 0; the verb is fully functional on base + member + leader signals; executor creates the constants file (§6) | the verb does not hard-depend on THR-400's *runtime* state, only its *file scaffolding* |
| `calling_named` encounter template missing | standard `encounter_seed` "withered" path — trace emitted, no crash; the kindled ambition stands without its scene | THR-400 reframe §7.3 pattern |
| `resolveKindledCalling` throws | the action's post-resolution handler catches, refunds essence, emits a trace — never crashes the tick loop | NFP #4 |
| Faction node / ambition node / `pursues` edge mutated | call `touchStructure()` / `touchWorld()` per the CLAUDE.md world-version-counter decision | UI / selectors must see the change |

## 12. Determinism (NFP #3)

The only PRNG draw in the subsystem is the weighted candidate selection in `resolveKindledCalling` step 5 — `selectAmbitionType` over the sharpened candidates, seeded `mulberry32(state.seed + state.tick * 47 + hashString(factionId) + KINDLE_TIEBREAK_SALT)`, the exact per-faction-per-tick seeding pattern `factionAmbitions.ts:203` already uses. The bias layer (§5.2) and essence sharpening (§5.1 step 4) are pure arithmetic over graph state. Same seed + same tick + same faction state = same calling.

## 13. NFP compliance summary

| # | NFP | Status | Note |
|---|-----|--------|------|
| 1 | Tunability | PASS | 13 constants named in §6; the `AMBITION_AXIS_AFFINITY` table is a named constant; reach/sphere/rarity are enums per convention |
| 2 | Inspectability | PASS | `FactionKindleCallingTrace` (§10) carries the full `biasedWeights` map + `dominantSignal` — "why this calling?" is answerable from the trace alone; DebugPanel lines §8.4 |
| 3 | Determinism | PASS | single seeded `selectAmbitionType` draw; everything else pure arithmetic (§12) |
| 4 | Fail-soft | PASS | 10-row fail-soft table §11; handler-level `try/catch`; THR-400 substrate read defensively |
| 5 | Narrative over mechanical | PASS | the payoff is the `calling_named` scene, not the node write; the design fork (§0.1) was resolved *toward* the reading that makes the calling reflect the faction's real story; `priority`/`biasedWeights` never surface as numbers |
| 6 | Additive over destructive | PASS | new exported functions in `factionAmbitions.ts` (existing flow untouched but for the §5.5 additive check); one new template; one new encounter; one new trace; new optional ambition-node properties — zero edits to `FactionAmbitionType`, `FactionDefinition`, or existing templates |
| 7 | Performance budget | PASS | the bias layer runs once per cast (player-initiated, not per-tick); the §5.5 stall-fade is one property compare per faction per 5-tick ambition pass — same negligible posture as THR-400's dissent-decay block |

## 14. Done when

- [ ] `resolveKindledCalling` + `computeKindleBias` + `AMBITION_AXIS_AFFINITY` added to `src/engine/factionAmbitions.ts` per §5.1–§5.2
- [ ] `action.faction.kindle_a_calling` template in `unified-action-templates.ts` per §7.1 + its post-resolution executor handler per §5.3
- [ ] `KINDLE_*` constants + `AMBITION_AXIS_AFFINITY` in `faction-action-constants.ts` per §6 (create the file if THR-400 has not landed)
- [ ] §5.5 stall-fade check added to `phaseFactionAmbitions` (additive; uses the existing abandon path)
- [ ] Army-spawn gating per §5.4 verified — `resolveKindledCalling` does not spawn; no other system auto-spawns for an uncommitted kindled ambition
- [ ] `FactionKindleCallingTrace` in `faction.ts` (or `factionAction.ts`); added to the trace union; registered in DebugPanel category grouping
- [ ] `faction.encounter.calling_named` authored in `faction-action-encounters.ts` per §7.3 — 2 beats, press-home/let-it-cool god-action choices with Heart-axis tilts, target resolved in beat 2, ≥2 enrichment placeholders, ≥1 follow-on `encounter_seed` on the commit branch, Threadbearer voice
- [ ] IPK chronicle bands per §7.2
- [ ] Action drawer surfaces the verb per §8.1 (absent, not greyed, when no eligible candidates)
- [ ] Faction detail panel kindled-ember glyph per §8.2
- [ ] DebugPanel faction-inspector lines per §8.4
- [ ] `npx tsc --noEmit` clean
- [ ] `npm test` green (bias-layer unit tests across the §11 failure cases; a determinism test — same seed/tick/state → same calling; an integration test: cast Kindle → assert a `kindledByAscendant` ambition holds the `pursues` edge and `calling_named` is seeded; a stall-fade test)
- [ ] 30-tick CLI smoke (`printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium`) — reaches tick 30, non-zero agents, traces present; paste the `status` block
- [ ] Four browser screenshots per §8.5 + console-output block + `window.__DEBUG.*` state assertion
- [ ] `Fixes THR-433` in the closing commit body
- [ ] `Docs/plans/wiring-checklist.md` + `Docs/plans/2026-04-16-systemic-wiring-guide.md` + `Docs/canon/rulebook.md` updated per §9 / §15

## 15. Open questions / notes for Christian

None are blocking — the design is internally complete and ships on verified substrate. Four are flagged for awareness:

1. **The design fork (§0.1) — derived candidates, not authored.** This is the one substantive interpretation call. The issue body contained both readings; this plan takes the **derived** reading (engine-built candidates from `scoreEligibleAmbitions` + a four-signal bias layer), because it honors Non-Negotiable #4, rides verified machinery, needs zero per-faction authoring, and works for generated factions. If you intended **authored** `latentCallings` per faction definition (a fixed 3–5 menu), the design is larger — say so and it needs a re-scope. **The specificity you asked for ("expand westward" not just "territorial_expansion") is handled by the existing `targetNodeId`, resolved inside the `calling_named` encounter** — not by a new enum.
2. **Reach reassignment.** The issue says `life / force`. `life` is a **Creation Sphere**, not a Reach — it cannot sit in the reach slot. Reassigned to **`heart / force`**: `heart` is the reach of `divine.inspire` ("Breath of Purpose" — "kindles … a sense of calling"), the exact agent-scale companion to this faction-scale verb; the Heart axis (Sworn ↔ Renegade) maps cleanly onto the encounter's commit/stall choice. `force` (the issue's intended sphere) is kept. If you'd rather it be `star` (destiny/calling) — a one-field flip — say so.
3. **`crudType: 'create'` vs `'update'`.** Went `create` for consistency with the sibling THR-432 (`anoint_successor` is `create`) and because an `ambition` node genuinely comes into existence. The agent-scale companion `divine.inspire` is `update`. Low-risk; the executor may revisit if the unified-action pipeline gates `create` templates differently.
4. **The "locked" rule and army-spawn gating (§5.4).** Kindle replaces a faction's current ambition *unless* the faction has already raised an army for it. The exact army↔ambition accessor was not confirmable from the mounted tree (THR-400 not landed); §5.4 gives a safe fallback (`KINDLE_LOCK_GRACE_TICKS`). Also flagged: the executor must confirm no other system auto-spawns an army for an uncommitted kindled military ambition.

**Vision audit:** no Vision page edit required — the verb rides existing premises (indirect, thread-mediated divine influence; the player sets a condition the world resolves). Non-Negotiables compliance is in §3.

**Rulebook impact:** Kindle a Calling is a new action verb — `Docs/canon/rulebook.md` §(action verbs / faction interventions) gains one row, marked `[DESIGN]` until shipped, `[IMPL]` on merge. In-scope for the implementing PR per the design-workflow checklist.

## 16. Coordination block

- **Suggested model:** `model:opus-4-7` — honoring the THR-433 issue author's explicit call ("engine work is the bulk — latent-candidate authoring per faction definition + resolver"). Although this plan resolves the "per faction definition authoring" toward a derived resolver (smaller than the issue feared), the engine work is still the load-bearing lift: a novel four-signal bias layer with a tunable affinity table, essence-sharpening math, and the resolver's replace-or-create logic — novel rather than pattern-following. The single `calling_named` encounter is modest prose volume. Opus-4-7 fits the novel-subsystem engine lift; the matching `model:opus-4-7` label is applied to the issue.
- **Parallel-safe with:** any issue that does **not** touch `src/engine/factionAmbitions.ts`, `src/data/unified-action-templates.ts`, `src/data/faction-action-constants.ts`, `src/data/faction-action-encounters.ts`, or the faction-verb executor module.
- **Mutex with:** **THR-400** (creates the `action.faction.*` family + `faction-action-constants.ts` + the executor module — hard dependency), **THR-430** (Schism — `unified-action-templates.ts`, faction files), **THR-431** (Reveal Corruption — `unified-action-templates.ts`, faction files), **THR-432** (Anoint Successor — `unified-action-templates.ts`, `faction-action-constants.ts`, faction files). **Order:** land **after THR-400's merge** (the hard dependency) and after the other sibling deferrals where they collide on `unified-action-templates.ts` / `faction-action-constants.ts`. Whoever implements should re-verify `factionAmbitions.ts` and the `action.faction.*` family against `origin/main` at pickup — additive merges are clean but the faction-verb surface grows with each sibling.
- **Codex review:** yes — structural review fits (a novel bias/resolver subsystem, three-pillar wiring, trace coverage with the `biasedWeights` inspectability contract, encounter prose discipline). The PR-gated review Action picks it up automatically.
- **Files to touch:** `src/engine/factionAmbitions.ts`, `src/data/unified-action-templates.ts`, `src/data/faction-action-constants.ts` (create if absent), `src/data/faction-action-encounters.ts`, `src/types/faction.ts`, the faction-verb executor module (`factionAction.ts` or `faction-action-executors` — match THR-400), `Docs/plans/wiring-checklist.md`, `Docs/plans/2026-04-16-systemic-wiring-guide.md`, `Docs/canon/rulebook.md`.

---

*Designed by Cowork, 2026-05-14. Deferral #4 of 4 from THR-400 §14. Brainstorm companion: `Docs/plans/2026-05-14-THR-433-kindle-a-calling-brainstorm.md`.*
