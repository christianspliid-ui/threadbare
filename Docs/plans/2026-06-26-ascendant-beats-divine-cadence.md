# Ascendant Beats — Divine Cadence

**Date:** 2026-06-26
**Author:** Cowork
**Project:** Ascendant Beats — Divine Cadence (new)
**Status:** In Design → handoff

## 1. Problem

The player-god gets exactly one encounter addressed to *them*: "The First" — a bespoke, player-triggered state machine (`src/engine/meetingEncounter.ts`). Every other encounter is resolved between mortals and surfaced to the player as something to observe or lean on. There is **no system that fires an encounter *because of the ascendant and the turn count*** — to onboard a new player, to keep the world feeling alive, or to hand the player new capabilities as the game progresses.

Three player needs follow from that gap:

1. **A clean, minimal opening.** Turn 1 should expose only the two generic verbs (move, investiture). The other capabilities should arrive as earned story moments, not as a 12-card wall on the first screen. (This reworks the shipped Starter 12 — THR-419.)
2. **A seeded opening graph.** Within the first handful of turns the player should be holding a threaded **actor** (The First), a threaded **location** (their throne / home base, which generates mana), a threaded **artifact**, and the first **action cards** for threading actors, threading locations for mana, and investing energy into the graph.
3. **A living world.** Periodically, the world should "call on the god" — introducing generated cultures and factions and offering initial investment choices into actors, locations, items, and factions.

## 2. The core idea: the Ascendant Beat + the Director

All three needs are the same object fired at different times: an **Ascendant Beat** — an encounter *addressed to the god* rather than resolved between mortals. "The First" is already one of these; it is just hand-wired and player-triggered.

The new work is twofold:

- **A content category** (`AscendantBeat`) authored as a `UnifiedActionTemplate` multi-step encounter, so a beat inherits — for free — aftermath effects, GraphOps, authored choice cards, the five-level outcome ladder, prose enrichment, and the encounter screen + AscendantHand UI (THR-332).
- **A Director** — a new orchestrator phase that decides *which* beat fires *when*, from a scripted spine first and an eligibility-filtered, identity-biased pool thereafter.

This shape is deliberately conservative: it adds **one new aftermath effect** (`unlock_action`), **one new orchestrator phase** (the Director), and **one home-seat essence mechanic**. Everything else reuses systems that already ship.

### 2.1 Considered alternatives (Brainstorm companion)

- **Three separate systems** (onboarding / living-world / unlock-delivery). Rejected: they share a trigger surface, a content format, and an aftermath vocabulary. Splitting them triples the engine surface and orphans the scheduler across three backlogs.
- **Extend the MeetingEncounter state machine** to cover all beats. Rejected: MeetingEncounter is a bespoke 4-beat bonding machine; generalizing it duplicates the `UnifiedActionTemplate` pipeline we already have. Instead we keep MeetingEncounter as *one* spine beat (Beat 0) and author the rest as templates.
- **Per-account unlock meta now.** Deferred by director's verdict (2026-06-26). This doc designs **within-run unlocks only** and leaves a clean interface seam for THR-480 to attach later (§5.3).
- **Force beats as modal interrupts.** Rejected for pool beats (violates "god, not protagonist" pacing). Beats are *offered* as thread-tugs the player chooses to enter; only the scripted opening beats may be modal.

## 3. Engine pillar

### 3.1 New state (`GameState`)

```ts
// src/types/gameState.ts (additions)

/** Within-run action unlock set. Starts as the two generics only; beats push IDs in.
 *  Replaces the prior `unlockedActionIds` semantics (which assumed the Starter-12 floor). */
runUnlockedActionIds: readonly string[];

/** Director state for ascendant beats. */
ascendantBeats: AscendantBeatState;
```

```ts
// src/types/ascendantBeat.ts (new)

export interface AscendantBeatState {
  /** Index into the ordered spine; -1 once the spine is exhausted. */
  spineCursor: number;
  /** At most one beat may be pending/offered at a time. */
  pending: PendingBeat | null;
  /** Append-only record for inspectability + dedup. */
  history: readonly BeatRecord[];
  /** Turn the last beat was offered (cadence gate). */
  lastBeatTurn: number;
}

export interface PendingBeat {
  beatId: string;            // AscendantBeat template id
  kind: BeatKind;
  offeredTurn: number;
  /** Resolved target/subject node ids the beat will operate on (e.g. the culture to introduce). */
  boundNodeIds: readonly string[];
  trigger: BeatTrigger;      // why it fired (for traces + prose)
}

export type BeatKind =
  | 'spine'            // scripted onboarding
  | 'introduction'     // flavor: surface a generated culture/faction
  | 'investment'       // offer initial investment into actor/location/item/faction
  | 'selection'        // choose 1-of-N capability/path
  | 'delivery';        // wrap an existing branching encounter (THR-452 content)

export interface BeatRecord {
  beatId: string;
  kind: BeatKind;
  resolvedTurn: number;
  outcome: string;          // outcome-ladder rung id
  grantedActionIds: readonly string[];
  seededNodeIds: readonly string[];
}
```

`AscendantBeat` itself is **not a new node type**. It is authored as a `UnifiedActionTemplate` carrying a small `beat` descriptor (kind, trigger predicate, eligibility filter, identity bias weights). This keeps the "everything is a graph node/edge / no inventing node types" rule intact — beats are content templates, beat *state* is flat GameState.

### 3.2 The Director (new orchestrator phase)

`phaseAscendantBeatDirector` runs once per turn, early (before encounter resolution, after world-state settles). Pure function over `(state, rng)`:

1. **If a beat is already pending → no-op.** (max-one-pending invariant.)
2. **Spine first.** If `spineCursor >= 0` and the next spine beat's trigger predicate is satisfied (turn ≥ N, "First bonded", "first settlement visited"), offer it and advance the cursor.
3. **Else cadence-gated pool draw.** If `turn - lastBeatTurn >= BEAT_BASE_INTERVAL` (± seeded jitter, floored by `BEAT_MIN_GAP`):
   - Build the **eligible pool**: filter the beat catalog by each beat's eligibility predicate against current world state (e.g. an `introduction` beat is eligible only if there is a generated culture/faction the player has not yet been introduced to; an `investment` beat needs an unthreaded notable actor/location/artifact in range).
   - **Weight** by ascendant identity (reach/sphere affinity) and by `BeatKind` mix weights. Draw with the seeded PRNG.
   - Offer it; set `lastBeatTurn`.
4. **Emit a trace** for every decision (scheduled / offered / skipped-empty-pool).

The Director **only offers**. Resolution happens when the player enters the beat (existing encounter pipeline). On resolution, beat aftermath runs through the normal aftermath resolver, which now understands `unlock_action`.

### 3.3 New aftermath effect: `unlock_action`

```ts
// src/types/unifiedAction.ts — EncounterAftermathReactionEffect union (addition)
| { kind: 'unlock_action'; actionId: string; revealStyle?: 'card_flight' | 'silent' }
```

Resolution (in the aftermath resolver): push `actionId` into `state.runUnlockedActionIds` (dedup), emit `action.unlock.granted`. The action drawer already filters on the unlock set via `isActionRevealed()` in `targetActions.ts` (THR-419), so a granted action simply appears. **No drawer change needed** for the grant to take effect.

### 3.4 Home seat (throne) + mana — new, minimal

The throne is **not a new node type** — it is a `location` node flagged as the ascendant's seat:

- Add `homeSeatLocationId?: string` to `AscendantProperties` (`src/types/influence.ts`).
- A spine beat sets it and creates a `thread` edge (and a `controls` edge) from the ascendant to that location.
- Essence income reuses the existing model in `src/engine/influence.ts::computeEssenceGeneration`. Add one term: `ESSENCE_PER_SEAT` for the location identified by `homeSeatLocationId`. (Mechanically this is a stronger place-of-power; we reuse the place-of-power income path and add the seat as a named, higher-yield case.)
- "Thread locations for mana generation" generally = the **existing** `ESSENCE_PER_THREAD` (0.1/tick) and place-of-power (0.5/tick) income. The new `thread_location_for_mana` action card threads a location and (where appropriate) marks it a place of power, feeding the existing term. No new income subsystem.

### 3.5 Reach-gated investment cards — new gate

The ascendant identity carries `domainAffinities` (reach weights) during Remembrance but does **not** persist them on the ascendant node, and `targetActions.ts` has **no reach gate** (only a sphere gate). Two additions:

- Persist the ascendant's reach affinities on the node at creation (`src/engine/ascendant.ts`), e.g. `domainAffinities` / a derived `primaryReach`.
- Add a **reach gate** to `getTargetActionSlots()` mirroring the sphere gate: a template may declare `requiresReach?: ReachDomain` (and optional minimum affinity). If the ascendant lacks it, the card is **hidden** (consistent with the unlock gate) — or shown dimmed with a reason if we want it legible as an aspiration. Default: hidden, with a `selection` beat occasionally surfacing reach-locked cards as "what you could become."

Investment cards therefore fall into three buckets:

| Bucket | Gate | Example |
|---|---|---|
| Generic | none (beyond unlock) | `invest.thread_actor`, `invest.thread_location_mana`, generic `investiture` |
| Unlockable-generic | within-run unlock via beat | `invest.endow_artifact`, `invest.consecrate_location` |
| Reach-gated | `requiresReach` + unlock | `invest.iron.fortify_bloodline`, `invest.veil.seed_prophecy` |

### 3.6 Constants (NFP #1)

| Constant | Default | Purpose | File |
|---|---|---|---|
| `BEAT_BASE_INTERVAL` | 9 (turns) | Cadence between pool beats | `src/data/ascendant-beat-content.ts` |
| `BEAT_INTERVAL_JITTER` | ±2 | Seeded jitter on the interval | same |
| `BEAT_MIN_GAP` | 4 | Hard floor between any two beats | same |
| `BEAT_MAX_PENDING` | 1 | Max simultaneously offered beats | same |
| `SPINE_TRIGGER_TURNS` | `[0, 2, 4, 6, 8]` | Earliest turn each spine beat may fire | same |
| `BEAT_KIND_WEIGHTS` | `{introduction:3, investment:4, selection:1, delivery:2}` | Pool draw mix | same |
| `ESSENCE_PER_SEAT` | 1.0 | Per-tick essence from the throne | `src/data/influence-content.ts` |
| `REACH_GATE_MIN_AFFINITY` | 0.2 | Minimum reach affinity to pass the reach gate | `src/data/influence-content.ts` |

All exposed via the existing CMS tunables registry (`src/components/CMS/registry.ts`).

### 3.7 Tracing (NFP #2)

```ts
interface BeatScheduledTrace   { category: 'ascendant.beat.scheduled'; turn: number; beatId: string; kind: BeatKind; trigger: BeatTrigger; poolSize: number; }
interface BeatOfferedTrace     { category: 'ascendant.beat.offered'; turn: number; beatId: string; boundNodeIds: string[]; }
interface BeatSkippedTrace     { category: 'ascendant.beat.skipped'; turn: number; reason: 'pending' | 'cadence' | 'empty_pool'; }
interface BeatResolvedTrace    { category: 'ascendant.beat.resolved'; turn: number; beatId: string; outcome: string; grantedActionIds: string[]; seededNodeIds: string[]; }
interface ActionUnlockGranted  { category: 'action.unlock.granted'; turn: number; actionId: string; via: 'beat' | 'debug'; }
```

Add all five to `TRACE_CATEGORIES` (the encounter-migration retros flagged missing entries as a recurring bug — see `project_encounter_migration_codex_review`).

### 3.8 Fail-soft (NFP #4)

| Failure | Fallback |
|---|---|
| Empty eligible pool at cadence | Skip silently; emit `beat.skipped` (`empty_pool`). World simply has nothing to say this turn. |
| Spine beat template missing | Advance cursor, emit narrative-event fallback, never block the opening. |
| `unlock_action` references unknown actionId | No-op the grant, emit a warning trace; beat still resolves. |
| `homeSeatLocationId` points at a destroyed location | Income term contributes 0; a future beat may re-offer a seat. |
| Reach gate referenced with unknown reach | Treat as ungated (fail open for visibility), warn. |
| Director throws | Caught at phase boundary; tick continues (the loop must never crash). |

### 3.9 Determinism (NFP #3)

All pool draws, jitter, and weighting use the seeded session PRNG. Same seed + same inputs → same beat schedule. The spine is fully deterministic (trigger predicates only).

### 3.10 Blast Radius (high-impact files touched)

| File | Importers | Cascade risk |
|---|---|---|
| `src/types/gameState.ts` | ~176 | Adding `runUnlockedActionIds` + `ascendantBeats` is **additive** (new optional-on-read fields with init defaults); existing consumers unaffected, but every state factory/clone must initialize them. |
| `src/engine/graph.ts` | ~370 | Only touched if seat/thread helpers are added there; prefer adding to `influence.ts`/`ascendant.ts` to avoid rippling the 370-importer schema file. |

Mitigation: keep additions in leaf modules (`ascendantBeat.ts`, `influence.ts`, `ascendant.ts`); touch `gameState.ts` for fields only, with defaults centralized in `gameInit.ts`.

**Two-domain lock (settled 2026-06-26).** Every ascendant has exactly one **primary + one secondary domain (reach)**, fixed for the whole game; no other domain is ever accessible that run. The reach gate is therefore a *permanent* filter, not a temporary unlock: a card requiring a reach outside the ascendant's two domains is hidden for the entire game and never surfaced — not even as aspiration. Spheres are the orthogonal axis (also primary + secondary, fixed at chargen). The expression cards in §4.4 are *generic* (every run) but their produced magic is flavored by the ascendant's two domains + two spheres.

## 4. Content pillar

### 4.1 The scripted spine (reworks the Starter 12)

| Beat | Trigger | Grants (action cards) | Seeds (threads/graph) |
|---|---|---|---|
| 0 — The First | first settlement visit (existing) | `invest.thread_actor` (generic) + `observe` | threaded **actor** (The First) |
| 1 — The Seat | First bonded, turn ≥ 2 | `invest.thread_location_mana` (generic) | threaded **location** = throne/home seat; sets `homeSeatLocationId`, begins mana income |
| 2 — A Thing Left Behind | turn ≥ 4 | `invest.endow_artifact` | threaded **artifact** |
| 3 — The First Word | turn ≥ 6 | first expressive verb (identity-biased: dream / persuade / …) | — |
| 4 — A Path Opens | turn ≥ 8 | **selection**: choose 1 of N investment cards (some reach-gated, shown as aspiration) | — |

Each is a `UnifiedActionTemplate` (`beat.kind = 'spine'`) with `unlock_action` + `encounter_seed`/`add_node`/`add_edge` aftermath. The 10 ex-Starter-12 actions are redistributed across these grants and early pool beats; `STARTER_ACTION_IDS` shrinks to `[move, investiture]`.

### 4.2 The pool (starter library ~12–20, expandable)

- **Introduction beats** — surface a generated **culture** or **faction** the player hasn't met; flavor-first prose, ending on an investment hook. Eligibility: an un-introduced culture/faction exists.
- **Investment beats** — "the world calls": offer initial investment into an actor / location / item / faction (thread, bless, claim, endow). Eligibility: an unthreaded notable target in awareness range.
- **Selection beats** — choose 1-of-N capability unlocks (within-run).
- **Delivery beats** — wrap one of the ~30 unreachable branching encounters (THR-452) as a divine vision. Adapter maps the branching encounter into a beat shell.

All prose: Threadbare voice, player-as-god framing, long-form welcome (it is read + TTS), with `enrichProse` placeholders for generated culture/faction/actor/artifact names so the same beat reads bespoke each run.

### 4.3 Unlock catalog

A single table (`src/data/ascendant-beat-content.ts`) mapping `beatId → grantedActionIds`, and each investment action's bucket (generic / unlockable-generic / reach-gated + `requiresReach`). This is the authoring source of truth for "what unlocks where."

### 4.4 Early expression cards — the per-graph investment toolkit

Four generic verbs available in every run (unlocked early via beats), one per graph type — item, location, agent, faction. The **verb is universal; the magic it produces is flavored by the ascendant's primary/secondary domain + sphere** (per the two-domain lock). These sit in the **unlockable-generic** bucket — not reach-gated/hidden. Codebase grounding verified 2026-06-26.

**`[imbue] <item>`** — create an artifact carrying a sphere-themed power, or add a power to an artifact a threaded agent already holds. Variants: (a) imbue an item the agent already holds; (b) create an imbued item and grant it via a `possesses` edge. *Reuse:* artifact `effects` / `activatedEffects` (`src/data/artifact-templates.ts`); `possesses` edge (`rewardPool.ts`). *New:* an "append effect to an existing artifact" path + a sphere→effect flavor table. *Cost:* domain-relevant essence.

**`[consecrate] <location>`** — only on `temple` / `shrine` subtypes (subtype enum exists). Converts the location into a faith/domain-spreading site via a **sustained ControlEffect** (`perTickCost`, `src/types/controlEffect.ts`). Alternative: pay a high one-time cost to mint a **relic artifact** (`lossCondition: 'permanent'`) that sustains the consecration with **zero ongoing upkeep**. *Reuse:* subtype gating, `ControlSpec` sustained perTick cost/income, permanent-loss artifacts. *New (engine):* the faith/domain "spread outward" effect (aura/cascade beyond the hex) and the relic-as-upkeep-substitute wiring. *Cost:* sustained per-tick essence, or high upfront for the relic.

**`[bestow power] <threaded agent>`** — requires the thread's `awareness` ≥ `faith` (awareness tiers exist: unaware/intuition/faith/communion). Grants the agent castable `ActivatedAbility` spells — start with two: (1) a **reach bonus** in the ascendant's domain, (2) a **quintessence-over-time** boon. *Reuse:* `ActivatedAbility` + `spellActivation.ts`, awareness gating, passive reach-bonus effect. *New/flag:* quintessence is a 0–1 health-scale value, not an accumulator — "generate quintessence over time" needs a defined semantic (regen boost vs. true resource accumulation); resolve in the issue. *Cost:* one-time domain-relevant essence.

**`[anoint] <faction>`** — make a threaded faction a **chosen faction**, granting a domain-specific power fitting its `factionType` (military → leadership aura, religious → faith spread, guild → reputation, etc.). *Reuse:* faction type system + rank bonuses + `FactionManipulateEffect` (`src/types/faction.ts`); peer to the existing `action.anoint-champion` (mortal analogue). *New (engine):* a `chosen` status property on the faction + a faction-power-grant effect keyed on `factionType` × ascendant domain. *Cost:* one-time domain-relevant essence.

Consecrate's faith-spread and anoint's chosen-power are the two genuinely new engine effects; they may split into their own issues at implementation planning. New constants: `CONSECRATE_PERTICK`, `CONSECRATE_RELIC_UPFRONT`, `BESTOW_COST`, `ANOINT_COST`, `BESTOW_MIN_AWARENESS` (`'faith'`).

## 5. UI pillar

### 5.1 Beat presentation

- Pending pool beats surface as a **thread-tug / notification in the world view** (reuse the world-view→encounter handoff pattern from THR-340: hex pulse + retinue pip). The player chooses to enter.
- Scripted spine beats (the opening) may present **modally** so onboarding is not missable.
- Inside the beat: the existing **encounter screen + AscendantHand** (THR-332). No new encounter surface.

### 5.2 The unlock moment

When a beat grants an action, a **card-flight reveal** ("you have learned …") sends the new card into the AscendantHand. `revealStyle: 'silent'` for grants we don't want to interrupt on. The action drawer already renders the card once it is in `runUnlockedActionIds`.

### 5.3 Selection picker + meta seam

- Selection beats render a **choose-1-of-N card picker** (reuses ActionCard focused mode).
- A thin, deferred seam for THR-480: a `bankedDiscoveries` list is *recorded in `BeatRecord`* but not surfaced or persisted in this phase. When the per-account layer is designed, it reads beat history; no rework of this system is required.

### 5.4 Debug + visual presence

- `__DEBUG.listBeats()`, `__DEBUG.fireBeat(beatId)`, `__DEBUG.grantUnlock(actionId)`, `__DEBUG.beatSchedule()` — added to `src/debug-bridge.ts`.
- DebugPanel sub-tab: pending beat, spine cursor, last-beat turn, eligible pool, run-unlocked set.
- HexMapV2: the throne/home-seat location gets a signifier; a beat-bound target hex pulses when a beat is offered.

### 5.5 Closeout artifact (Definition of Done)

UI changes here are DOM (notifications, picker, drawer) **and** WebGL (hex signifier/pulse). Closeout must produce, at 1920×1080: Playwright screenshot + console for the DOM surfaces; **Claude-in-Chrome** screenshot for the hex throne signifier / beat pulse (Playwright cannot see canvas). Plus `__DEBUG` state assertions proving `runUnlockedActionIds` grew and a beat resolved.

## 6. Wiring section

| Module | Wires to |
|---|---|
| `phaseAscendantBeatDirector` | registered in `orchestrator.ts` turn sequence (before encounter resolution) |
| `ascendantBeats` state | consumed by world-view notification + DebugPanel |
| `unlock_action` aftermath | aftermath resolver → `runUnlockedActionIds` → `targetActions.ts` filter (already reads it) |
| home seat | `AscendantProperties.homeSeatLocationId` → `computeEssenceGeneration` → essence HUD |
| reach gate | `getTargetActionSlots()` → AscendantHand filter |
| traces | `traceBuffer` + `TRACE_CATEGORIES` |
| prose | beat templates run through `enrichProse()` |

Update `Docs/plans/wiring-checklist.md` (new phase, new GameState fields, new trace categories, new player control) and `Docs/plans/2026-04-16-systemic-wiring-guide.md` (new `unlock_action` aftermath effect — content authors must know it exists).

## 7. NFP compliance

| # | Priority | Verdict |
|---|---|---|
| 1 | Tunability | PASS — all cadence/income/gate numbers are named constants in the CMS registry. |
| 2 | Inspectability | PASS — five trace types; flat beat state; append-only history; DebugPanel tab. |
| 3 | Determinism | PASS — seeded PRNG for all draws/jitter; deterministic spine. |
| 4 | Fail-soft | PASS — fallback table §3.8; Director caught at phase boundary. |
| 5 | Narrative over mechanical | PASS — beats are prose-first, identity-flavored; mechanics arrive as story. |
| 6 | Additive over destructive | PASS with note — additive except the Starter-12 → 2-generic rework, which is the explicit ask (rebuild `STARTER_ACTION_IDS`). |
| 7 | Performance budget | PASS — Director is O(catalog) once per turn with cheap predicates; no per-tick hot-path cost. |

## 8. Three-pillar check

Engine (§3) ✔ · Content (§4) ✔ · UI (§5) ✔ · Wiring (§6) ✔.

## 9. Proposed child issues (route on handoff)

1. **Director + beat state + `unlock_action` aftermath** (Engine) → this project. Foundation; blocks the rest.
2. **Starter-12 → 2-generic floor rework** (Engine/Content/UI) → Action System & Unlocks. Small, can land first.
3. **Home seat + mana income** (Engine/UI) → this project.
4. **Reach gate in `targetActions.ts` + persist ascendant reach** (Engine/UI) → Action System & Unlocks.
5. **Scripted spine beats (0–4) authoring** (Content/UI) → Onboarding & First-Run Experience. Blocked by #1–#4.
6. **Pool beat starter library + unlock catalog** (Content) → this project. Blocked by #1.
7. **Delivery-beat adapter for THR-452 branching content** (Engine/Content) → this project.
8. **`__DEBUG` + DebugPanel beat tab** (UI) → this project. Parallel-safe with most.

Each issue gets a coordination block on handoff (suggested model, parallel-safe with, mutex with) per the coordination protocol.
