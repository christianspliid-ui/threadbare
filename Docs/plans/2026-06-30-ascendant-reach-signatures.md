# Ascendant Reach-Gated Signature Powers

**Date:** 2026-06-30
**Author:** Cowork
**Project:** Ascendant Beats — Divine Cadence
**Status:** In Design → handoff (epic)
**Grill / Brainstorm companion:** `Docs/plans/2026-06-30-ascendant-reach-signatures-grill-me.md`
**Parent plan:** `Docs/plans/2026-06-26-ascendant-beats-divine-cadence.md` §3.5, §4.3, §4.4
**Unblocks:** THR-523

---

## 1. Problem

The Ascendant action system has three buckets — `generic`, `unlockable-generic`, `reach-gated`. The first two ship (THR-505/508/509/511–515). The **`reach-gated` bucket is an empty, fully-wired socket**: the `'reach-gated'` `ActionBucket` type, `ActionBucketEntry.requiresReach`, and the `getTargetActionSlots()` reach gate all shipped (THR-503), but **zero `invest.*` reach-gated card templates are authored** (THR-523). There is nothing that makes "an iron-god" mechanically distinct from "a veil-god."

Because of the **two-domain lock** — every ascendant has a fixed primary + secondary reach for the whole run, and a reach-gated card outside those two reaches is *permanently hidden* — these cards are the **signature powers of an identity**, and coverage must be complete across all 8 reaches or some identities ship with a dead bucket.

## 2. Core idea: an Ars Magica grammar

Reach-gated cards are **new named signature powers** built from a **Technique × Form grammar** (Ars Magica as the lodestar):

- **Reach = Technique** — defines the *mechanic skeleton* (which primitive + which graph target).
- **Sphere = Form** — supplies the *individualized layer* (the bespoke twist/condition) **and the scaling** (effect + cost scale with sphere power).

A reach signature therefore composes: `reach skeleton` × `sphere individualization` → a named-feeling power, with a hand-authored bespoke veneer on the highest-value (reach × sphere) cells. One signature per reach for v1 → a player holds exactly **2** reach-gated powers (primary + secondary reach), each individualized by their **primary sphere**.

The full alternatives ledger and the per-question decision trail live in the grill-me companion (§2 "considered alternatives" is the companion in its entirety: bespoke-per-cell vs grammar-compositional; one-per-reach vs spellbook; new powers vs variants; the Iron/Veil rejected first-drafts).

### 2.1 Freshness caveat (read before grounding code claims)

The local checkout used during design was **behind `origin/main`** (`src/data/ascendant-beat-content.ts` present only in worktrees). Code-existence claims below are grounded in the **Linear Done record** (THR-500 `unlock_action` + Director; THR-503 reach gate + `requiresReach` + persisted `domainAffinities`; THR-509 the four primitives) and the worktree copies, **not** the stale main checkout. CC must work from a fresh `origin/main`.

## 3. Engine pillar

### 3.1 Reuse vs net-new inventory

**Reused (shipped — do not rebuild):**
- The four primitives (THR-509): `co_located_thread_aura`, `chosen_status_grant`, `relic_upkeep_substitute`, `sphere_flavored_effect`.
- The reach gate + `requiresReach` + persisted ascendant `domainAffinities` (THR-503).
- `unlock_action` aftermath + Director offer/grant path (THR-500/517).
- Effect kinds: `encounter_seed`, `intelligence`, `spawn_clue`, `spawn_artifact` (with `tier: 'legendary'`), `faction_*`, `thread_*`.
- `ControlSpec` sustained `perTickCost` / `perTickIncome` (`src/types/controlEffect.ts`).
- Sphere power scalar: `node.properties.sphereAffinity.scores[sphere]` (0–`MAX_SPHERE_SCORE`).

**Net-new (this epic):**
1. `signature_warhost` effect (Iron) — mobilize a faction military force.
2. `sphere_influence_amplify` effect (Veil) — sustained local sphere-power boost via a planar rift.
3. `spawn_unique_location` effect (Stone) — mint a one-of-a-kind location node (forge/mine wonder).
4. A reusable **sphere-power scaling helper** (effect + cost).
5. The **sphere-individualization table** layer (extends `sphere_flavored_effect` to carry per-(reach,sphere) twist + name-fragment).

### 3.2 Sphere-power scaling helper (effect + cost)

A pure helper used by every signature (and reusable by future actions, per the general principle "most actions scale effect *and* cost with sphere power"):

```ts
// src/engine/sphereScaling.ts (new, leaf module)
/** sphereScore in [0, MAX_SPHERE_SCORE]; returns a multiplier ≥ SIGNATURE_SCALE_FLOOR. */
export function spherePowerMultiplier(sphereScore: number): number {
  const t = clamp01(sphereScore / MAX_SPHERE_SCORE);
  return SIGNATURE_SCALE_FLOOR + t * (SIGNATURE_SCALE_CEIL - SIGNATURE_SCALE_FLOOR);
}
export function scaledEffect(base: number, mult: number): number { return base * mult; }
export function scaledCost(base: number, mult: number): number { return base * Math.max(1, mult); }
```

Each signature reads the ascendant's **primary sphere** score (`sphereAffinity.scores[primarySphere]`), derives one multiplier, and applies it to *both* its effect magnitude and its essence cost. Strong sphere → dramatic + expensive. v1 keys on primary sphere only; secondary-sphere keying is a future deepening.

### 3.3 Sphere-individualization layer

Extends the shipped `sphere_flavored_effect` primitive with a per-(reach, sphere) record:

```ts
// src/data/reach-signature-content.ts (new)
interface SignatureIndividualization {
  twist: SphereTwistSpec;       // the unique trigger/condition + payload delta (the §3 "individualization bar")
  nameFragment: string;         // composes the spell name, e.g. force→"of the Hammerfall"
  proseKey: string;             // enrichProse placeholder set
}
type SignatureMatrix = Record<ReachDomain, Partial<Record<CreationSphereName, SignatureIndividualization>>>;
```

Any (reach × sphere) that lacks a bespoke entry falls back to a **composed default** for that reach so no player ever hits an empty cell (correctness property under the two-domain lock).

### 3.4 New effect — `signature_warhost` (Iron)

```ts
| { kind: 'signature_warhost'; factionId: string; baseStrength: number; leaderAgentId?: string; when?: EffectPredicate }
```

Resolution: mark the target faction `mobilized` (a faction property + a `controls`/`commands` edge to a spawned **warhost** modeled as an existing node form — a faction-owned force, *not a new node type*; reuse the faction military representation, falling back to a faction property + sentiment if no force-node form exists). Strength = `scaledEffect(WARHOST_BASE_STRENGTH, mult)`. Pairs against Gold's economic snowball as the military snowball. Sphere twist examples: `force`→shock troops; `order`→disciplined legion (slower decay); `entropy`→a horde that wins fast but disbands.

### 3.5 New effect — `sphere_influence_amplify` (Veil "Rend the Gate")

```ts
| { kind: 'sphere_influence_amplify'; locationId: string; sphere: CreationSphereName; perTick: number; durationMode: 'sustained'; when?: EffectPredicate }
```

Resolution: open a rift at the location to the ascendant's **primary sphere's** home plane, raising that sphere's local influence per tick (boosts sphere-aligned scoring/encounters and threads aligned to it). Implemented as a sustained `ControlSpec` (`perTickCost` in essence, `perTickMutations` raising local `sphereAffinity.scores[sphere]` up to a cap). Because the rift opens onto *your* sphere, individualization is **intrinsic** — no separate twist table needed for the core, though prose varies by sphere. **Downside (the individualized condition):** an open gate has a seeded per-tick chance to leak — spawn a hostile manifestation / chaos pulse — scaled by `RIFT_LEAK_CHANCE × mult`. Relic-buyout available via `relic_upkeep_substitute`.

### 3.6 New effect — `spawn_unique_location` (Stone "The Great Work")

```ts
| { kind: 'spawn_unique_location'; subtype: LocationSubtype; uniqueTag: string; hex?: HexCoord; nearAgentId?: string; artifactForgeTier?: ArtifactTier; when?: EffectPredicate }
```

Resolution: mint a `location` node (legendary forge / deep mine) flagged `unique` (a property + a `controls`/`thread` edge — *not a new node type*), de-duplicated by `uniqueTag` so only one ever exists per run. Optionally enables an "extra-powerful artifact" forge path = `spawn_artifact` with `tier: 'legendary'` (reuse, not new). Sphere twist: `matter`→an inexhaustible mine; `order`→a forge whose artifacts never break; `time`→a workshop that completes works early.

### 3.7 The eight reach skeletons

| Reach | Effect skeleton (target · primitive/effect) | Strategy unlocked |
|---|---|---|
| **Iron — Warhost** | faction/agent · `signature_warhost` (new) + `chosen_status_grant` | Military conquest snowball |
| **Gold — Patronage Network** | location/faction · sustained `ControlSpec` `perTickIncome` | Essence/prosperity snowball |
| **Shadow — Broker's Web** | faction · `hidden_mark` + `intelligence` | Information asymmetry + covert nudging |
| **Veil — Rend the Gate** | location · `sphere_influence_amplify` (new), sustained | Reshape local cosmic conditions |
| **Heart — Sworn Oath (stub)** | agent/site · `co_located_thread_aura` (loyalty) | Devoted inner circle (full retinue deferred) |
| **Eye — The Deep Eye** | region/culture · `intelligence` + `spawn_clue` + reveal | Discovery/understanding of the elder layer |
| **Stone — The Great Work** | location/artifact · `spawn_unique_location` (new) + `spawn_artifact` tier:legendary | Build one-of-a-kind wonders |
| **Star — Beacon of Fate** | agent/world · `encounter_seed` (quest) + ranged reach-bonus | Long-distance influence; breaks locality |

Every skeleton: effect + cost run through §3.2 scaling on the primary sphere; the §3.3 matrix supplies the individualized twist + name; second cards (Iron Divine Wrath, Veil Awaken-the-Gifted) deferred to the per-reach-spellbook expansion.

### 3.8 Constants (NFP #1)

| Constant | Default | Purpose | File |
|---|---|---|---|
| `SIGNATURE_SCALE_FLOOR` | 0.6 | Min sphere-power multiplier (sphere score 0) | `src/data/reach-signature-content.ts` |
| `SIGNATURE_SCALE_CEIL` | 2.0 | Max multiplier (sphere score = MAX) | same |
| `SIGNATURE_BASE_COST.<reach>` | per reach | One-time essence base (pre-scale), higher than generic verbs | same |
| `WARHOST_BASE_STRENGTH` | 1.0 | Pre-scale warhost strength | same |
| `RIFT_PERTICK_COST` | 0.5 | Per-tick essence to hold a gate | same |
| `RIFT_INFLUENCE_PER_TICK` | 0.05 | Local sphere-score gain/tick (capped) | same |
| `RIFT_LEAK_CHANCE` | 0.03 | Pre-scale per-tick leak probability | same |
| `GREAT_WORK_ARTIFACT_TIER` | `'legendary'` | Forge output tier | same |
| `DEEP_EYE_CLUE_PRECISION` | `'located'` | Clue precision granted | same |
| `BEACON_QUEST_DELAY` | 6 | `encounter_seed.delayTicks` for the fated quest | same |
| `SWORN_OATH_LOYALTY_PER_TICK` | 0.02 | Heart-stub aura magnitude | same |

All exposed via the CMS tunables registry (`src/components/CMS/registry.ts`).

### 3.9 Tracing (NFP #2)

```ts
interface SignatureCastTrace      { category: 'ascendant.signature.cast'; turn: number; actionId: string; reach: ReachDomain; sphere: CreationSphereName; mult: number; scaledCost: number; }
interface SignatureScaledTrace    { category: 'ascendant.signature.scaled'; turn: number; actionId: string; baseEffect: number; scaledEffect: number; sphereScore: number; }
interface WarhostMobilizedTrace   { category: 'ascendant.signature.warhost'; turn: number; factionId: string; strength: number; }
interface RiftOpenedTrace         { category: 'ascendant.signature.rift'; turn: number; locationId: string; sphere: CreationSphereName; }
interface RiftLeakTrace           { category: 'ascendant.signature.rift_leak'; turn: number; locationId: string; }
interface UniqueLocationTrace     { category: 'ascendant.signature.unique_location'; turn: number; locationId: string; uniqueTag: string; }
```

Register all in `TRACE_CATEGORIES`.

### 3.10 Fail-soft (NFP #4)

| Failure | Fallback |
|---|---|
| Reach outside ascendant's two domains | Card hidden by the shipped reach gate (correct, by design). |
| `primarySphere` score missing / 0 | Multiplier = `SIGNATURE_SCALE_FLOOR`; effect still fires at the floor. |
| (reach × sphere) has no bespoke matrix entry | Composed default for that reach; never an empty card. |
| `signature_warhost` on dissolved/destroyed faction | No-op grant, warn trace; card still resolves. |
| `sphere_influence_amplify` location destroyed | Rift lapses (ControlSpec `lapsed` path); income/boost → 0. |
| `spawn_unique_location` `uniqueTag` already exists | No-op spawn (dedup), reroute to upgrading the existing one or refund. |
| Any new effect throws | Caught at aftermath-resolver boundary; beat still resolves (tick never crashes). |

### 3.11 Determinism (NFP #3)

All scaling reads existing state; the only stochastic element (`RIFT_LEAK_CHANCE`) uses the seeded session PRNG. Same seed + inputs → same outcomes.

### 3.12 Blast Radius (high-impact files)

| File | Importers | Cascade risk |
|---|---|---|
| `src/types/unifiedAction.ts` | high | Adding 3 effect `kind`s is **additive** to the union; existing consumers unaffected, but the aftermath resolver `switch` must handle them (exhaustiveness). |
| `src/engine/targetActions.ts` | high | No change — reach gate already shipped (THR-503); signatures just declare `requiresReach`. |
| `src/types/gameState.ts` | ~176 | No new fields required (uses existing `runUnlockedActionIds`); confirm. |

Mitigation: new logic in leaf modules (`sphereScaling.ts`, `reach-signature-content.ts`, per-effect resolver handlers); touch the union + resolver only.

## 4. Content pillar

### 4.1 Reach skeletons + 4.2 sphere-individualization matrix
Author the 8 skeletons (`src/data/reach-signature-content.ts`) as `UnifiedActionTemplate`s with `requiresReach` set and `bucket: 'reach-gated'`. Author the `SignatureMatrix` with bespoke entries for high-value (reach × primary-sphere) cells and a composed default per reach. Namespace: **`invest.<reach>.<name>`** (e.g. `invest.veil.rend_the_gate`, `invest.iron.warhost`).

### 4.3 Bucket catalogue (THR-523 surface)
Add the 8 ids to `ASCENDANT_ACTION_BUCKETS` as `{ bucket: 'reach-gated', requiresReach: <reach> }`; keep THR-505 coverage tests green (every granted id bucketed + resolves to a real template; every reach-gated entry declares `requiresReach`).

### 4.4 Acquisition beats
- **Primary-reach signature:** granted at the culmination of the onboarding spine — Beat 4 "A Path Opens" (`selection` beat) surfaces the player's *primary-reach* signature (choice is target/flavor, not whether to receive).
- **Secondary-reach signature:** a pool `selection` beat, gated by the shipped eligibility predicates (THR-516), surfacing only the player's eligible (in-domain) signature.

### 4.5 Prose
Threadbare voice, player-as-god framing, `enrichProse` placeholders keyed by reach × sphere so each signature reads bespoke per run. The name composes from `nameFragment` (sphere) onto the reach base ("Warhost **of the Hammerfall**").

## 5. UI pillar

- **5.1 AscendantHand** — reach-gated cards render via the shipped `getTargetActionSlots()` filter; no new surface. Sustained signatures (Gold/Veil) show the per-tick cost label (existing `controlSpec` label path).
- **5.2 Unlock moment** — `unlock_action` card-flight reveal ("You have learned …") sends the signature into AscendantHand (shipped).
- **5.3 Selection-beat picker** — choose-1-of-N picker (shipped ActionCard focused mode) showing the player's eligible reach signature(s).
- **5.4 Hex signifiers (WebGL)** — new signifiers: a mustering **warhost** marker (Iron), a **rift** pulse at a gate location (Veil), a **unique-location** wonder glyph (Stone). Beat-bound target hex pulses on offer (shipped pattern).
- **5.5 Debug** — extend `__DEBUG`: `listSignatures()`, `fireSignature(reach)`, and surface `runUnlockedActionIds` + the primary-sphere multiplier in the DebugPanel beat tab.
- **5.6 Closeout artifact (Definition of Done)** — at 1920×1080: Playwright screenshot + console for AscendantHand/picker (DOM); **Claude-in-Chrome** screenshot for the warhost/rift/wonder hex signifiers (Three.js — Playwright can't see canvas); `__DEBUG` assertions proving a signature entered `runUnlockedActionIds` and resolved with a sphere-scaled magnitude.

## 6. Wiring

| Module | Wires to |
|---|---|
| 3 new effect kinds | aftermath resolver `switch` → graph mutations → traces |
| `sphereScaling.ts` | every signature handler (effect + cost) |
| `reach-signature-content.ts` | `ASCENDANT_ACTION_BUCKETS`, beat `grantsActionIds`, `enrichProse()` |
| `requiresReach` on templates | `getTargetActionSlots()` reach gate (shipped) → AscendantHand |
| acquisition | spine Beat 4 + pool `selection` beats (THR-516 eligibility) |
| hex signifiers | HexMapV2 layer + `worldVersion`/`structuralCacheVersion` touches on spawn/mutate |
| traces | `traceBuffer` + `TRACE_CATEGORIES` |

Update `Docs/plans/wiring-checklist.md` (3 new effect kinds, new trace categories, new hex signifiers) and `Docs/plans/2026-04-16-systemic-wiring-guide.md` (content authors must learn the 3 new effects + the sphere-scaling helper).

## 7. NFP compliance

| # | Priority | Verdict |
|---|---|---|
| 1 | Tunability | PASS — all magnitudes/costs/curves are named constants in the CMS registry; per-reach base costs tunable. |
| 2 | Inspectability | PASS — six trace types incl. the sphere-scale derivation; DebugPanel surfacing. |
| 3 | Determinism | PASS — only the rift-leak roll is stochastic, on the seeded PRNG. |
| 4 | Fail-soft | PASS — §3.10 table; resolver-boundary catch; composed-default guarantees no empty card. |
| 5 | Narrative over mechanical | PASS — prose-first, sphere-individualized names; mechanics arrive as identity. |
| 6 | Additive over destructive | PASS — additive union extensions + new leaf modules; no rewrites. |
| 7 | Performance budget | PASS — signatures fire on player action; sustained effects reuse the existing per-tick ControlSpec path (no new hot loop). |

## 8. Three-pillar check

Engine (§3) ✔ · Content (§4) ✔ · UI (§5) ✔ · Wiring (§6) ✔.

## 9. Vision & rulebook impact

- **Vision:** reinforces the settled two-domain lock and "Reaches = what you do / Spheres = what fuels it" — no Vision premise contradicted; adds the corollary that *Spheres scale and individualize divine expression*. Worth a one-line Vision note, not a rewrite.
- **Rulebook:** adds a rule of play — *reach-gated signature powers* (how a player acquires their two signatures, how sphere power scales them). Update `Docs/canon/rulebook.md` (action verbs / resources section) in the implementing PR and re-verdict that section.

## 10. Proposed issue structure (the epic, under THR-499)

1. **Sphere-power scaling helper + constants** (`sphereScaling.ts`) [Engine, Sonnet]. Foundation; blocks signatures that scale. Parallel-safe.
2. **Sphere-individualization matrix primitive** (`reach-signature-content.ts` scaffold + `SignatureMatrix` type, extends `sphere_flavored_effect`) [Engine/Content, Sonnet]. Blocks content authoring.
3. **`signature_warhost` effect** (Iron) [Engine, Opus] — new faction-force mobilization. Mutex with faction-effect-heavy work.
4. **`sphere_influence_amplify` effect** (Veil Rend the Gate) [Engine, Opus] — sustained sphere boost + leak; touches sphere-affinity mutation.
5. **`spawn_unique_location` effect** (Stone Great Work) [Engine, Sonnet] — mint unique location + legendary-forge path.
6. **Content-only signatures** (Gold/Shadow/Star/Eye/Heart-stub) [Content, **Codex-eligible**] — author on shipped primitives. Blocked by #1, #2.
7. **Engine-backed signatures authoring** (Iron/Veil/Stone templates + matrix entries) [Content, Sonnet]. Blocked by #1–#5.
8. **Reach-gated bucket catalogue + acquisition beats** (THR-523 surface + spine Beat 4 / pool selection wiring) [Content/Engine, Sonnet]. Blocked by #6, #7.
9. **Hex signifiers + DebugPanel signature surfacing** (warhost/rift/wonder) [UI, Sonnet]. Parallel-safe after #3–#5.
10. **Heart full-retinue signature** [Deferral] — gated on Tavern & Party (Social Systems Expansion).

Each gets a coordination block (suggested model, parallel-safe with, mutex with, files-to-touch / done-when) on handoff. THR-523 folds into #8.
