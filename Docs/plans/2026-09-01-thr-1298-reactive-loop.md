> **title:** `The reactive loop — THR-1298`
> **linear_issue:** THR-1298
> **author:** `Claude Code`
> **created:** 2026-09-01
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# The reactive loop — THR-1298

*Undertaking outcomes become culprit-carrying mint events, so a harm done in the world writes itself into what its victim wants next — closing project → consequence → new drive → new project.*

## Why this is load-bearing

Plan doc 4 of 6 from the closed [Proactive Agent Actions wayfinder map](https://linear.app/threadbare/issue/THR-1276/proactive-agent-actions-wayfinder-map). The undertaking substrate (THR-1292) and action library (THR-1297) shipped a world where agents build, seize, and destroy real things — but nothing downstream reacts. Verified 2026-09-01: the mint lane (`gatherMintTuples`, `src/engine/ambitionTick.ts:196-235`) consumes **only** graph event nodes with `eventType: 'encounter_outcome'`, while every undertaking outcome is a flat `TickEvent` — so **no undertaking outcome can currently mint anything**, including the `undertaking_mint_abandoned` TickEvent doc 1 emitted expressly for this doc (`undertakingCheckpoints.ts:713-741`). The victim identity a grievance needs (`MotiveGateResult.ownerId`) is computed at candidate generation and then **discarded** (`strategicActionCandidates.ts:226-228`). Without this doc, north star #2's causal chain ("the chronicle names who did it") ends at the harm; with it, the harm is the beginning of the next story. All design decisions are settled — [THR-1282 resolution + amendment](https://linear.app/threadbare/issue/THR-1282/the-reactive-loop-how-outcomes-mint-new-drives) (Christian, chat 2026-08-26) and the [review record §2.3.4 / §3 row 4](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-08-26-proactive-agent-actions-review.md) — this doc is the engineering of those rulings, not a re-litigation.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Ambitions & Undertakings (`ambitionTick.ts`, `ambitionSelection.ts`, `ambitionAssignment.ts`) | 🟢 ACTIVE | **extends** — mint lane widened to a second event class; selector gains a value-pole term; the dormant reactive pool **retires** into the event-minted lane |
| Undertaking substrate (`undertakingCheckpoints.ts`, `strategicActionLifecycle.ts`) | 🟢 ACTIVE | **extends** — terminal paths emit `undertaking_outcome` event nodes; victim id carried through the runtime |
| Unified decision board (`decisionBoard.ts`) | 🟢 ACTIVE (shadow) | **extends** — fills the declared `urgencyWeight` seam (`decisionBoard.ts:365-367`), third term of `computeTemperamentWeight` |
| Encounter event nodes (`encounterEventNode.ts`) | 🟢 ACTIVE | **extends** — the `participated_in role:'target'` / `occurred_at` shape is reused for undertaking outcomes; new sibling module, no change to the encounter path |
| Motive gate (`undertakingMotive.ts`) | 🟢 ACTIVE | **extends** — `resolveTargetOwners` learns the `owns` edge (its own docblock at `:65-67` promised this and it never landed); `ownerId` stops being discarded |
| Grudge-as-`hostile_to` (`bandOpposition.writeGrudge`, `undertakingMotive` provenance read-around) | 🟢 ACTIVE | **extends** — one shared `writeGrudge` helper with unified provenance; no new edge type |
| Faction grievance decay (`factionAmbitions.ts:216-228`) | 🟢 ACTIVE | untouched — the precedent for agent-side heat decay; deliberately not unified in this doc (different store, different cadence) |
| Reactive ambition pool (`REACTIVE_AMBITION_TEMPLATES`) | 🟠 DORMANT (no assignment path — THR-812) | **retires** — the 4 templates convert into the minted lane; the `ReactiveAmbitionTemplate` type, `triggerEvent`, `skipFilters`, and `ReactiveEventType` die. Runtime population consumed: 0 (nothing ever assigned one — that is the defect) |

## Engine pillar

### Systems design

**New module `src/engine/grievance/undertakingOutcomeNode.ts`** — creates graph event nodes for harm-carrying undertaking outcomes, sibling to `encounterEventNode.ts` (same edge shape, distinct id namespace and `eventType`):

- Node id `evt_und_${projectId}_${tick}`; `type: 'event'` (existing node type — no new node types). Properties: `eventType: 'undertaking_outcome'`, `harmClass`, `templateId`, `verb`, `tick`, `culpritAgentId` (the acting agent), `victimAgentId?`, `targetNodeId?`, `harmMagnitude`, `answersGrievance?: boolean`, `answeredMagnitude?: number`, `chainDepth`.
- Edges: `participated_in` culprit → event `{ role: 'primary' }`; `participated_in` victim → event `{ role: 'target' }` when a victim resolved — **this is deliberately the exact shape `gatherMintTuples` already classifies as `victim`** (`ambitionTick.ts:215`); `occurred_at` event → site location.
- **Emission sites** (all in the terminal paths of `advanceStrategicProjects`, `strategicActionLifecycle.ts:715-836`):
  1. `completed` + template carries `harmClass` (destroy verbs, below) → harm event with victim.
  2. `completed` + the mutation was a holding transfer → `holding_seized`, victim = displaced owner (surfaced by `transferHolding`, which already computes the loser — `holdings.ts:279-292`).
  3. `ended` with `failureReason: 'abandoned_after_halts'` → `undertaking_abandoned` node (culprit-less, self-facing: the owner's own candidate mint, per review §3 row 1). The existing TickEvent stays for the chronicle; the node is what the mint lane reads.
  4. crit-failure complication that kills a bound cast member (doc 3's honest-death seam) → `named_death`, victim = the deceased's strongest bond. **Inert until THR-1296's binder executes** — the emission site and rules row ship now; fail-soft means they simply never fire until deaths exist.
- **The god stays out by construction**: every emission site is an agent-driven undertaking terminal, so `culpritAgentId` is always a mortal. A defensive guard (`culpritAgentId === state.ascendantId → skip`) documents the ruling anyway.

**Victim plumbing.** `evaluateMotiveGate`'s `ownerId` is stamped onto `StrategicActionCandidate` as `victimAgentId?` at generation (`strategicActionCandidates.ts:226-228`) and carried onto `StrategicProjectRuntime` at start — additive optional fields. At emission, if absent, re-resolve from `targetNodeId` ownership. **In the same pass, `resolveTargetOwners` (`undertakingMotive.ts:70-84`) gains the `owns`-edge read its docblock promised** — without it, agent-owned holdings are invisible to the motive gate and to grievance attribution, which is the exact "who did this to whose thing" this doc exists for.

**Mint lane widening.** `gatherMintTuples` accepts `eventType: 'undertaking_outcome'` alongside `'encounter_outcome'`. Classification for undertaking nodes reads `properties.harmClass` directly (never `reachTested` — `classifyMintEvent` stays encounter-only), routed to a new rules table `UNDERTAKING_MINTING_RULES` (Content pillar). The existing window/caps/seed/dedup machinery (`MINT_LOOKBACK_TICKS`, `MINT_MAX_PER_EVENT`, `MINT_BASE_CHANCE`, per-event map) applies unchanged.

**Grievance state lives on the `pursues` edge** (ambition nodes are shared per `templateId` — per-instance state must be edge-side, the established pattern of `mintedByEventId`). `PursuesEdgeProperties` gains an optional grievance block: `culpritAgentId?`, `heat?`, `harmMagnitude?`, `chainDepth?`, `grievance?: true`. A minted drive whose rules row is flagged `grievance: true` (revenge/reclaim candidates) writes the block; soft drives (protect/flee/rebuild) mint as plain ambitions with provenance only.

**One slot, replacement, succession (THR-1282 §2/§4 + amendment §2.3.4).** At mint time for a victim:

1. **Living victim, no active grievance** → mint normally.
2. **Living victim, active grievance** → *replacement by magnitude*: if `newMagnitude > activeMagnitude × GRIEVANCE_REPLACE_RATIO`, the old grievance demotes to its grudge edge immediately (the trace and chronicle name the turn); else the new harm **feeds heat** (`heat += GRIEVANCE_HEAT_FEED × newMagnitude`) — repeat harms never queue a second grievance.
3. **Dead or Broken victim** → *succession*: the drive passes to the strongest positive `relates_to` bond (highest `strength`, tie broken by node-id sort — deterministic; kin edges do not exist yet, so closest sworn bond is the line, per the resolution's recorded directive). No bond → chronicle line, chain ends. Succession never fires past the merely-distracted (amendment).
4. **Ambient victim** (`isAutonomousDecisionActor` false) → **grudge edge only**, no ambition. An ambient agent never consults the board (THR-1348), so a pursues edge would be a lie the arc panel tells; the grudge edge is honest relationship color and re-ignites hot if the agent is ever promoted. Same rule caps chains: `chainDepth > GRIEVANCE_CHAIN_DEPTH_MAX` → grudge edge only regardless of tier (spotlight-only chains, THR-1282 §5).

**Heat decay and the cooling door.** Rides the existing 15-tick milestone pass in `phaseAmbitionProgress` (the same all-actor walk `observeResidence` reuses — no new phase, NFP #7): active grievance edges decay `heat −= GRIEVANCE_HEAT_DECAY_PER_CHECK`. At `heat ≤ GRIEVANCE_COOL_THRESHOLD` the grievance **demotes**: pursues status → `'resolved'` with `resolvedTick`, and the shared `writeGrudge` helper writes/refreshes the bidirectional `hostile_to` edge with unified provenance `{ cause: 'grievance_cooled', sourceEventId, tick }`. **Re-ignition**: a new harm whose culprit already holds a grudge edge with the victim mints at `heat = initial × GRIEVANCE_REIGNITION_BOOST`.

**Satisfaction and settlement doors.** *Satisfaction*: two triggers — (a) a grievance-linked undertaking (project whose `ambitionId` is the grievance's ambition) completes; (b) new milestone condition `grievance_culprit_eliminated`, evaluated **with edge context** (the milestone evaluator passes the pursues-edge properties; the condition reads `culpritAgentId` → `isDeceased` — the THR-812-safe shape: a real node id resolved at evaluation, never an unbindable `$`-ref). On satisfaction the grievance resolves, and the outcome node emitted by the answering undertaking is stamped `answersGrievance: true` + `answeredMagnitude`. The mint lane then **suppresses** the counter-mint in the answered party — unless the answer overshot (`newMagnitude > answeredMagnitude × GRIEVANCE_OVERSHOOT_RATIO`), in which case the chain continues at `chainDepth + 1`. Answered ≠ wronged: most chains end at one round by construction. *Settlement* ships as the engine hook only — a `settleGrievance(state, victimId, culpritId, means)` export that resolves the grievance without suppression stakes, plus a rules-row slot; the authored encounter family that calls it is future content (recorded in THR-1282 §5, not this doc's scope).

**Value-pole selector term (review §3 row 4 — the two-scale obligation, pinned).** `AmbitionTemplate` gains `poleAffinities?: readonly { valuePair: ValuePair; pole: 'virtue' | 'vice'; weight: number }[]`. `scoreDesirability` (`ambitionSelection.ts:75-117`) gains one additive term after the reach-affinity term:

```
poleTerm = Σ affinity.weight × alignment01
alignment01 = pole === 'virtue' ? signedToCanonical01(profile[valuePair])
                                : 1 − signedToCanonical01(profile[valuePair])
```

**The mapping is pinned here so the executor cannot silently invert the poles:** `AxiologicalProfile` storage is **signed ±1** (virtue +1, vice −1 — `src/types/agent.ts:22`); the canonical axis scale is **0–1, 0.5 neutral** (`src/types/axisRegistry.ts:17-19`); the **only** legal bridge is `signedToCanonical01` / `canonical01ToSigned` (`axisRegistry.ts:236-245`, declared canonical in its header). Any open-coded `(v+1)/2` in review is a defect. The profile reaches the scorer via one new field on `AmbitionAgentSnapshot`, read once in `buildAmbitionAgentSnapshot` (`ambitionTick.ts:100-134`) — both callers (mint lane, spontaneous re-eval, initial assignment) get it through the same funnel. Consequence, named in the resolution and embraced: the god's fork-lean pole drift now changes which drive a harm mints, with no new wiring. In the same file, the three inline scoring literals (`0.2` cultural-sphere, `0.15` boosting-trait, `0.05` jitter) are promoted to named constants — converging new weight terms onto anonymous literals would put the mix outside the CMS (NFP #1).

**Reactive pool retirement (conversion-first, deletion-last — NFP #6 within a sanctioned retirement).** The 4 templates (`ambition_seek_revenge`, `ambition_reclaim_homeland`, `ambition_avenge_fallen`, `ambition_fulfill_destiny`, `ambition-templates.ts:811-1100`) convert to plain `AmbitionTemplate`s in a new `GRIEVANCE_AMBITION_TEMPLATES` export (destiny joins `EVENT_MINTED_AMBITION_TEMPLATES` — it is wonder-class, not grievance-class). Their THR-812/THR-841 milestone repairs are already in place and carry over verbatim; `ambition_seek_revenge` and `ambition_avenge_fallen` additionally gain the `grievance_culprit_eliminated` milestone (2-of-N, keeping the reach milestones as alternates). **Their `strategicProfile` blocks carry over unchanged — this is what makes 7 currently-unreachable strategic templates reachable** (`strategic_expose_mark`, `strategic_suborn_warband`, `strategic_sever_network`, `strategic_destroy_masterwork`, `strategic_expose_cache`, `strategic_burn_the_charts`, `strategic_cultivate_informant`, listed only under the reactive pool's profiles today — recon 2026-09-01). Then delete: `ReactiveAmbitionTemplate`, `ReactiveEventType`, `triggerEvent`/`skipFilters`, the `REACTIVE_AMBITION_TEMPLATES` export, the reactive branch in `agentDetail.ts:896-908`, and the reactive arms of `findAmbitionTemplate` (`strategicActionCandidates.ts:718-721`) / `findAmbitionTemplateById` (`ambition-templates.ts:1482`) — both re-pointed at the two surviving pools.

**Board urgency term.** `computeTemperamentWeight` (`decisionBoard.ts:368-377`) gains its declared third term: for a strategic candidate whose `ambitionId` resolves to a pursues edge carrying `grievance: true`, `weight += GRIEVANCE_URGENCY_WEIGHT × clamp01(heat / GRIEVANCE_HEAT_INITIAL_MAX)`. Hot grievances outrank cold ambitions on the one board; as heat decays the grievance competes fairly and eventually cools out — the competition model is the decay curve, no special-case scheduling.

### Graph nodes / edges

- **No new node types, no new edge types.** Event nodes reuse `type: 'event'`; grudges reuse `hostile_to` (the `bandOpposition.writeGrudge` precedent, promoted to a shared helper with unified provenance key `cause` — the three-key divergence documented at `undertakingMotive.ts:28-41` is not widened by a fourth writer).
- `PursuesEdgeProperties` (`src/types/ambition.ts:177-187`): + `culpritAgentId?`, `heat?`, `harmMagnitude?`, `chainDepth?`, `grievance?` — all optional, additive.
- `StrategicActionCandidate` / `StrategicProjectRuntime` (`src/types/strategicAction.ts`): + `victimAgentId?` — optional, additive.
- Strategic template schema: + optional `harmClass?: UndertakingHarmClass` on destroy-family templates (authored, never inferred from the verb — the schema stays the authority).

### Tick phases

- Emission: inside phase 2a.55 (`phaseStrategicProjects` → `advanceStrategicProjects`) — the terminal paths already run there; no new phase.
- Minting + heat decay: inside `ambition_progress` (slot `post-economy`, `phases/index.ts:74`) — minting rides the existing 75-tick nested cadence (15 × 25 LCM, both CMS-tunable); heat decay rides the outer 15-tick milestone pass. No new phase, no new all-actor walk.

### Resolution logic

Covered above: mint classification by `harmClass` → rules row → candidate set → existing `selectAmbitions` funnel (now pole-aware) picks; one-slot/replacement/succession/suppression applied at write time; board urgency at scoring time. Deliberately **no separate grievance scheduler** — the one board is the competition surface (substrate §4 ruling).

### PRNG callouts

- Mint gate and selection reuse the existing seeded stream: `state.seed + tick + actor.id.length + MINT_SEED_OFFSET` (`ambitionTick.ts:497`) — unchanged.
- Succession and replacement are **deterministic** (magnitude comparison; strongest-bond with node-id sort tie-break) — no dice.
- No `Math.random()` anywhere in scope.

## Content pillar

### Data tables

**`UNDERTAKING_MINTING_RULES`** (new, in `src/data/ambition-minting-rules.ts` beside the encounter table) — `Record<UndertakingHarmClass, Partial<Record<MintRelation, MintRuleEntry[]>>>` with `MintRuleEntry` gaining `grievance?: true`. Harm classes and authored candidate sets (2–4 per class, THR-1282 §3):

| harmClass | victim candidates | witness candidates |
|---|---|---|
| `property_destroyed` | seek_revenge (grievance) · rebuild_from_ashes · protect_the_home · flee_the_ravaged_land | protect_the_home · flee_the_ravaged_land |
| `holding_seized` | seek_revenge (grievance) · reclaim_homeland (grievance) · protect_the_home | protect_the_home |
| `network_severed` | seek_revenge (grievance) · found_anew · protect_the_home | — |
| `named_death` | avenge_fallen (grievance) · protect_the_home · flee_the_ravaged_land | protect_the_home |
| `undertaking_abandoned` | *(self-facing, culprit-less)* rebuild_from_ashes · found_anew · flee_the_ravaged_land | — |

Witnesses get soft drives only — never revenge for someone else's property (THR-1282 §2). `harmClass` authoring on the destroy templates: `strategic_raze_settlement`, `strategic_destroy_masterwork`, `strategic_burn_the_charts` → `property_destroyed`; `strategic_sever_network` → `network_severed`; seize routes via the holding-transfer emission site, not a template field.

**Harm magnitude table** `HARM_MAGNITUDE_BY_CLASS` — the replacement-by-magnitude currency: named_death 1.0 · property_destroyed 0.8 · holding_seized 0.6 · network_severed 0.5 · undertaking_abandoned 0.3. One scale, all tunable.

**`poleAffinities` authoring** for all 10 minted-pool templates (4 converted + 6 existing): revenge/avenge lean vice poles of their acting reaches (Conqueror, Inquisitor), protect/rebuild lean virtue (Protector, Keeper), flee leans the prudence pole of the meta-axis, destiny leans Beacon. Weights from `POLE_AFFINITY_WEIGHT` scale, authored per template.

**Mint labels**: `MINT_CLASS_LABELS` gains stems for the five harm classes; `composeMintLabel` extended so a culprit-carrying mint names the culprit — `"the razing of Dunmar — Hesk's work"`. Provenance prose is what makes the arc line read (`AMBITION: Seek revenge · because of the razing of Dunmar`).

### Encounter templates

N/A — the settlement-door encounter family is explicitly future content (THR-1282 §5 records it); this doc ships the engine hook only.

### Prose tables

Grudge line in agent detail reuses the established register ("There is blood between them and …" — the band-grudge phrasing the rulebook already canonizes); one new prose stem per harm class for mint labels (above). No new prose pipeline surfaces.

### Attachment content

N/A — no attachment changes; holdings are consumed (seize victim), not authored here.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces — AgentDetailPanel / BondsTab; no WebGL in scope).*

### Player-facing display

- **Ambition provenance line** (AgentDetailPanel ambitions block, via the `agentDetail.ts` read-model): a minted ambition renders `because of {mintedByLabel}`; a grievance additionally renders its culprit and a heat band as prose — **burning · hot · cooling** — never a number (Laws: player-inspectable quantities only; key:value is unfinished UX — prose band, not `heat: 0.62`).
- **Grudge line** (BondsTab): a `hostile_to` edge with grievance provenance renders "There is blood between them and {name}" with the cause. State-backed (Law 56): both lines read graph state that this doc writes; nothing renders from presentation-side memory.
- UI Laws engaged: 1 (state-backed), 13/14 (prose over numbers), 17 (clickable primitives — culprit name links to the agent), 21, 33, 37 (per THR-1007 minimum set, judged at executor closeout).

### Event notifications

Chronicle entries via existing `TickEvent` stream: grievance minted (names culprit + cause), replacement ("the cache is forgotten; the ruin is not" register — the moment names the turn, amendment §2.3.4), demotion-to-grudge, satisfaction. No new toast/modal surfaces — moment interrupt presentation is doc 5's (`resolveMomentPresentation` consumed, not re-homed).

### Debug inspection (DebugPanel)

`window.__DEBUG.getGrievances(agentRef?)` — async accessor returning active grievance edges (culprit, heat, chainDepth, mintedByEventId) and grudge edges; JSDoc in `src/debug-bridge.d.ts`. CLI: `agent <name>` output gains a grievance/grudge block; `eval` reaches the rest.

### Visual presence (HexMapV2)

N/A — no hex-map surface; grievances are agent-sheet and chronicle material at this tier.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `grievance/undertakingOutcomeNode.ts` | 2a.55 (strategic projects) | — (graph-side) | graph event nodes | `undertaking_outcome_event` | CLI `eval` / `graph` |
| `ambitionTick.ts` (widened mint) | `ambition_progress` (post-economy) | AgentDetailPanel (provenance) | `pursues` edge props | `ambition_minted` (extended) | `__DEBUG.getGrievances` |
| grievance transitions (replace/demote/satisfy/suppress) | `ambition_progress` | BondsTab (grudge line) | `pursues` / `hostile_to` props | `grievance_transition` | `__DEBUG.getGrievances`, CLI `agent` |
| `ambitionSelection.ts` (pole term) | (pure, callers unchanged) | — | — | selection detail inside `ambition_minted` | CLI `eval` |
| `decisionBoard.ts` (urgency term) | 2a.5 decision loop | — | — | existing board trace gains `urgencyWeight` | `balance summary` |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `GRIEVANCE_HEAT_INITIAL_MAX` | 1.0 | heat ceiling; initial heat = `harmMagnitude × GRIEVANCE_HEAT_INITIAL_SCALE` clamped here |
| `GRIEVANCE_HEAT_INITIAL_SCALE` | 1.0 | harm magnitude → initial heat |
| `GRIEVANCE_HEAT_DECAY_PER_CHECK` | 0.06 | decay per 15-tick milestone pass (~10 in-game days to cool from 1.0) |
| `GRIEVANCE_COOL_THRESHOLD` | 0.15 | at/below → demote to grudge edge |
| `GRIEVANCE_HEAT_FEED` | 0.5 | repeat-harm heat feed multiplier on `newMagnitude` |
| `GRIEVANCE_REPLACE_RATIO` | 1.25 | new harm must outweigh active by this ratio to replace |
| `GRIEVANCE_REIGNITION_BOOST` | 1.5 | initial-heat multiplier when the culprit already holds a grudge edge (clamped to max) |
| `GRIEVANCE_OVERSHOOT_RATIO` | 1.5 | answer magnitude beyond `answered × ratio` re-opens the chain |
| `GRIEVANCE_CHAIN_DEPTH_MAX` | 2 | beyond this, victims get grudge edges only (spotlight-only chains) |
| `GRIEVANCE_URGENCY_WEIGHT` | 0.4 | board third-term weight on heat01 |
| `POLE_AFFINITY_WEIGHT` | 0.25 | selector pole-term scale (per-template weights multiply this) |
| `HARM_MAGNITUDE_BY_CLASS` | table above | replacement/suppression currency |
| `AMBITION_CULTURAL_SPHERE_WEIGHT` | 0.2 | promoted from inline literal (`ambitionSelection.ts:82-87`) |
| `AMBITION_BOOSTING_TRAIT_WEIGHT` | 0.15 | promoted from inline literal (`:95-100`) |
| `AMBITION_SELECTION_JITTER` | 0.05 | promoted from inline literal (`:113-114`) |

## Tracing

```ts
// UndertakingOutcomeEventTrace — emitted when a harm-carrying outcome node is written
interface UndertakingOutcomeEventTrace {
  type: 'strategic.undertaking_outcome_event';
  projectId: string;
  harmClass: UndertakingHarmClass;
  culpritAgentId: string;
  victimAgentId?: string;
  harmMagnitude: number;
  chainDepth: number;
  answersGrievance?: boolean;
}

// GrievanceTransitionTrace — emitted on every grievance state change
interface GrievanceTransitionTrace {
  type: 'ambition.grievance_transition';
  agentId: string;
  transition: 'minted' | 'heat_fed' | 'replaced' | 'demoted_to_grudge' | 'satisfied'
            | 'suppressed_countermint' | 'succeeded_to_bond' | 'reignited' | 'settled';
  culpritAgentId?: string;
  heat?: number;
  detail?: string; // e.g. the replacement's "names the turn" line
}
```

Registration note for the executor: trace categories have **four** registration sites (union, runtime array, interfaces, category list — the THR-812-era lesson); the existing `ambition_minted` aggregate trace gains `grievanceCount` and per-mint `culpritAgentId`. Volume: transitions are rare (mint cadence ≥ 75 ticks, decay 15) — well under the 1/tick budget.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| No victim resolvable for a harm outcome | Emit the node culprit-only; witnesses still classify; no grievance mint — warn-level trace, tick continues |
| Culprit node missing/deceased at mint time | Mint the drive without the grievance block (plain provenance ambition); `grievance_culprit_eliminated` reads deceased → satisfaction path still closes cleanly |
| Victim is ambient tier | Grudge edge only (designed behavior, not an error) |
| Victim dead/Broken with no positive bond | Chronicle line only; chain ends |
| `poleAffinities` names a `ValuePair` absent from the profile | Term contributes 0 (schema test pins every authored pair ∈ `VALUE_PAIRS` — the half-dead vocabulary trap doc 1 §4 repaired must not reopen) |
| Broken-state predicate absent (Broken ships disabled) | Succession triggers on `deceased` only; the Broken arm activates when the predicate exists — stated, not silent |
| Event-node create throws | try/catch per write, warn + skip (the `encounterEventNode` idiom); undertaking terminal path completes regardless |
| `named_death` emission before the binder ships | Site never fires (no bound deaths exist) — inert by construction, no error |

## Kill criteria

- If the constructed CLI proof cannot produce a grievance mint end-to-end, the lane widening is wrong — **stop and re-recon** rather than patching the rules table until it passes.
- If the 300-tick observation runs show grievance heat dominating the board (vendetta monoculture) or zero organic mints after tuning, **re-tune the constants against the THR-1277 field-survey baseline** (the tunables exist for exactly this); a *structural* failure — e.g. destroy-verb supply too thin to ever fire organically — is **surfaced as a finding on the issue**, never silently absorbed into constant-twiddling.
- If `decisionBoard.ts` / the strategic packs have merged under THR-1349 or THR-1377 mid-implementation, **re-baseline before the board-urgency slice** — the mutex lines exist to make that drift visible.

## Blast Radius

Checked against `.codesight/graph.md` (2026-09-01): no file in scope is in the ≥100-importer set. `src/types/graph.ts` (198 importers) and `src/types/gameState.ts` (517) are **not touched** — no new node/edge types, and `followedAgentIds` already exists. The widest touched files (`src/types/ambition.ts`, `src/types/strategicAction.ts`) take only additive optional fields.

## Interface impact

| Contract | Disposition | Note |
|---|---|---|
| `world-events-mint-ambitions` (`mintAmbitionsFromEvents`, `AMBITION_MINTING_RULES`) | **extend** | second event class + second rules table through the same lane; write site unchanged, read widened |
| `minted-ambition-provenance` (`mintedByEventId` → `motiveReceipt.ts`) | **extend** | grievance block joins the same edge; motive receipts may now name culprits |
| motive gate `ownerId` (produced, never read) | **add read** | production read site = outcome-node emission; closes a currently-LEAKED-shaped seam |
| `owns` edge (single writer `holdings.ts`) | **preserve** (add reader) | `resolveTargetOwners` reads it; writer discipline untouched |
| `hostile_to` provenance (3-key divergence) | **extend** | shared `writeGrudge` writes `cause`; no fourth key introduced |
| `urgencyWeight` board seam (`decisionBoard.ts:365-367`) | **fill** | the declared slot, filled as declared |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (rules tables, magnitude table, pole affinities, labels; encounter family explicitly deferred with rationale)
- [x] UI pillar present (provenance + grudge lines, debug accessor; moment surfaces are doc 5's with rationale)
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise contradicted. North star #2's causal chain is directly served; "failure is plot, not punishment" is served by abandonment minting rebuild/found drives; the two-way-thread doctrine is served by pole-drift propagating into drive selection (named in THR-1282 §3 and embraced).
- [x] The god-stays-out ruling is honored structurally (mortal-only emission sites) — god-directed grievances remain the recorded future charter.

## Rulebook impact

- [x] This changes rules of play (how drives arise; grudges as persistent state) → `Docs/canon/rulebook.md` gains a Reactive Loop entry `[IMPL]` in the executor's closing PR (wiki-freshness gate will also fire — `public/wiki-manifest.json` sources cover the engine files).
- [x] `Docs/canon/rulebook-quick-reference.md`'s company-grudge line generalizes to cover agent-side grudges — same closing PR.

> Brainstorm companion: `Docs/plans/2026-09-01-thr-1298-reactive-loop-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | 16 named constants incl. 3 promoted from inline literals; magnitude table data-driven |
| 2. Inspectability | PASS | two new trace types + extended aggregate; every transition traced with cause; provenance chain player-visible |
| 3. Determinism | PASS | existing seeded mint stream reused; succession/replacement deterministic; no new PRNG streams |
| 4. Fail-soft | PASS | 8-row table; every graph write individually guarded (encounterEventNode idiom) |
| 5. Narrative over mechanical perfection | PASS | replacement "names the turn"; heat as prose bands; grudges persist forever as story color |
| 6. Additive over destructive | PASS with note | all new state optional/additive; the one deletion (reactive pool) is the sanctioned THR-1282 retirement, conversion-first |
| 7. Performance budget | PASS with note | no new phases or all-actor walks; event-node population grows by harm-outcomes only (rare); the unimplemented event archival (`EVENT_ARCHIVE_TTL`) is a pre-existing gap — executor files a Deferral if measured growth warrants |

## Done when

- [ ] Unit/integration tests: emission per terminal path; victim plumbing (incl. `resolveTargetOwners` + `owns`); one-slot/replacement/succession/suppression each falsified with a controlled arm (the perturbation must be shown to apply — no vacuous guards); pole term shown to flip a selection on a constructed profile through `signedToCanonical01`; schema tests pin `poleAffinities` pairs ∈ `VALUE_PAIRS` and `harmClass` authored on every destroy template
- [ ] Reactive pool retired: type + export + `triggerEvent` gone; a test pins the 7 formerly-unreachable strategic templates as reachable via the converted pool's `strategicProfile`s
- [ ] **Constructed CLI proof** (organic traces are observations, not gates): a scripted scenario (spawn/eval-driven destroy undertaking against an owned target, forced completion) shows — outcome node with culprit + victim → grievance minted with provenance + heat → board trace showing the urgency term → satisfaction via culprit elimination suppressing the counter-mint
- [ ] 300-tick observation run, seeds 42 + 99, reported (not gated): grievance mint count, chain depth distribution, grudge-edge count — the tuning baseline THR-1282 §6 asks for
- [ ] `npm test` and `npx vite build` pass; types via `tsc -b --force` net-new diff; `npm run census:undertakings` still green on both seeds
- [ ] UL terms seated: the `UL-proposal` for *grievance* / *grudge* / *heat* (mechanical senses) is filed as THR-1379 — the executor's closeout confirms the shard entries landed or the proposal is still open and referenced in the completion comment
- [ ] Closing commit body includes `Fixes THR-1298`
- [ ] Browser-verify: Playwright 1920×1080 capture of AgentDetailPanel showing a provenance line + grudge line (constructible via the CLI proof state), console output, `__DEBUG.getGrievances` assertion, UI-Laws judgment line

## Coordination block

**Suggested model:** opus — cross-cutting engine work with two shared-vocabulary tables and a retirement; judgment-heavy (advisory; the CC automation runs Opus regardless).

**Parallel-safe with:** THR-1133, THR-1168 (UI-only surfaces, disjoint files); THR-1299's *design session* (docs-only). 

**Mutex with:** THR-1349 (both edit `decisionBoard.ts` — this fills `computeTemperamentWeight`'s third term while 1349 flips the board live and edits the census gate); THR-1377 (both edit `decisionBoard.ts`'s desire path and the strategic packs — 1377 authors `motivations`, this authors `harmClass` on the same pack files); THR-1301/THR-1303 (cutover/deletion touch `phaseAgentDecision.ts` + `strategic-action-constants.ts`). Sequencing preference: land after THR-1349 and THR-1377 if they are in flight — both are smaller and already Ready for Dev.

**Files to touch:**
- Create: `src/engine/grievance/undertakingOutcomeNode.ts`, `src/data/ambition-selection-constants.ts` (or fold into an existing constants home), tests
- Edit: `src/engine/ambitionTick.ts` (mint widening, heat decay, snapshot field), `src/engine/ambitionSelection.ts` (pole term, literal promotion), `src/data/ambition-minting-rules.ts` (`UNDERTAKING_MINTING_RULES`, labels), `src/data/ambition-templates.ts` (conversion + retirement + `poleAffinities`), `src/types/ambition.ts` (edge props, template field), `src/types/strategicAction.ts` (`victimAgentId`, `harmClass`), `src/engine/strategicActionCandidates.ts` (victim stamp, `findAmbitionTemplate` repoint), `src/engine/strategicActionLifecycle.ts` (emission sites), `src/engine/undertakingMotive.ts` (`owns` read, shared grudge helper home), `src/engine/groups/bandOpposition.ts` (writeGrudge → shared helper), `src/engine/decisionBoard.ts` (urgency term), `src/engine/graphConditions.ts` (`grievance_culprit_eliminated`), `src/engine/agentDetail.ts` + `AgentDetailPanel.tsx` + `BondsTab.tsx` (display), `src/debug-bridge.ts` + `.d.ts`, `src/types/trace.ts` (4 registration sites), `scripts/cli.ts` (agent output), `Docs/canon/rulebook.md`, wiki page per manifest

## Notes for the executor

- **Strangler, never big-bang.** Suggested slices: (1) victim plumbing + `owns` read; (2) outcome nodes + mint widening + rules table; (3) template conversion + pool retirement; (4) pole term; (5) heat/one-slot/replacement/succession + grudge helper; (6) closure doors + board urgency; (7) UI + debug + docs. Each slice green on its own; only the final PR carries `Fixes THR-1298`.
- **Do not touch `classifyMintEvent`** — reach-keyed classification stays encounter-only; harm classes are read off the node. Mixing the two vocabularies is the `hungerResonance` failure class the ticket warns about.
- **Do not widen `eventType: 'encounter_outcome'`** onto undertaking nodes to "reuse" the lane — that routes harms through the wrong rules table by accident (recon 2026-09-01, encounterEventNode §10.2).
- The stale cutover comment at `phaseAgentDecision.ts:~893-897` ("no variety term") belongs to THR-1349's surface — leave it unless you land after 1349 merges and it is still stale.
- `ambition_chase_the_wonder` is today the only minted template with a `strategicProfile`; after conversion, revenge/reclaim join it — expect the undertaking census's distinct-template count to move, and report it, but the census gate itself is THR-1349/THR-1377 ground.
- Kin: `bondType: 'kin'` / `basis: 'lineage'` / `'spouse'` are unproducible content (no writer) — succession must not condition on them; strongest positive `relates_to` only. Kin edges are a recorded future effort (THR-1282 §2).

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-01. Intent-judge (run first): **Allow** — 11 dimensions, 2 GAPs both resolved in this revision (kill criteria inlined above; UL-proposal filed as THR-1379). The judge's advisory — surface the ambient-victims-at-link-one tightening to Christian as a veto invitation — rides the handoff comment.*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Constants table lists 16 named constants (heat decay, replace ratio, chain depth cap, urgency weight, etc.) plus `HARM_MAGNITUDE_BY_CLASS`; 3 inline literals (`0.2`/`0.15`/`0.05` in `ambitionSelection.ts`) explicitly promoted to named constants. |
| 2. Inspectability | PASS | Two new trace interfaces (`UndertakingOutcomeEventTrace`, `GrievanceTransitionTrace`) plus extended `ambition_minted` aggregate; wiring table populates Module/Phase/UI/GameState/Trace/Debug columns for every touched module; registration-note flags the 4-site trace-registration lesson explicitly. |
| 3. Determinism | PASS | "PRNG callouts" section: mint/selection reuse existing seeded stream unchanged; succession (node-id sort tie-break) and replacement (magnitude comparison) stated deterministic; "No `Math.random()` anywhere in scope." |
| 4. Fail-soft | PASS | 8-row fail-soft table covers unresolvable victim, missing/deceased culprit, ambient victim, no-bond succession, absent `ValuePair`, disabled Broken predicate, node-create throw (try/catch per write, encounterEventNode idiom), and pre-binder inert emission — each with a stated fallback, no thrown exceptions. |
| 5. Narrative over mechanical | PASS | Heat renders only as prose bands ("burning · hot · cooling"), never a raw number; replacement demotion is written to "name the turn" in chronicle; grudges persist as permanent story color rather than mechanical cleanup. |
| 6. Additive over destructive | PASS-with-note | All new state (edge/candidate/runtime fields) is optional/additive; the one deletion — retiring `REACTIVE_AMBITION_TEMPLATES`/`ReactiveAmbitionTemplate` — is explicitly "conversion-first, deletion-last," justified as a sanctioned prior-approved retirement (THR-1282) rather than an incidental refactor, and its consumed strategic profiles are carried over verbatim before the old types are deleted. |
| 7. Performance budget | PASS-with-note | No new tick phase, no new all-actor walk — minting/decay ride existing `ambition_progress`/15-tick milestone cadences; event-node growth is bounded to rare harm outcomes. Note: flags a pre-existing gap (`EVENT_ARCHIVE_TTL` unimplemented) as a possible future Deferral rather than measuring/gating it now — disclosed, not hidden. |

NFP AUDIT: PASS-with-notes (see rows above)

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Systems design, graph nodes/edges, tick phases, resolution logic, PRNG callouts all filled with concrete file:line references and new-module specifics |
| Content | present-and-substantive | Data tables (minting rules, magnitude table, pole affinities, labels) fully specified; Encounter templates and Attachment content correctly marked N/A with one-line rationale |
| UI | present-and-substantive | Player-facing display, event notifications, debug inspection all concrete (provenance line, grudge line, `__DEBUG.getGrievances`); Visual presence correctly N/A with rationale |

No missing required sections. Wiring section check: present and connects all active pillars — 5-row table covers each new/modified module against orchestrator phase, UI component, GameState field, trace emitted, and debug visibility, matching the checklist's own table convention. Substrate-existence check: PASS — `## Substrate inventory` opens the doc, 8 rows with extends/retires dispositions; cross-checked against `Docs/canon/systems-inventory.md`; no green-field duplication; the one deletion (reactive ambition pool, 🟠 DORMANT) is a sanctioned conversion-first retirement, not a rebuild.

PILLAR AUDIT: PASS

### Vision audit

Premises touched: `00-north-star.md` → harm-has-narrative-consequence — extended (grievance mint deepens the causal chain). `01-core-loop.md` → "consequences compound … a decision at tick 47 should echo at tick 130" — confirmed/extended, gated through the existing one-board selection (no parallel scheduler). `02-non-negotiables.md` → god-not-protagonist confirmed (`culpritAgentId === state.ascendantId → skip`; god-directed grievances out of scope); everything-is-graph confirmed (no new node/edge types); prose-never-numbers confirmed (heat bands); additive-over-destructive confirmed with sanctioned-retirement note. `03-design-tensions.md` → divine-remove-vs-attachment extended; emergence-vs-authored silent. `taste-profile.md` → prose-first UI and player-is-god-never-protagonist both confirmed. No contradictions found. Qualitative checks: north star yes; core loop yes (rides `ambition_progress` + the single board); non-negotiables inside; tensions balanced; taste respected. `[design-brief-stale]` — `Docs/design-brief.md` carries no Vision summary section.

VISION AUDIT: PASS
