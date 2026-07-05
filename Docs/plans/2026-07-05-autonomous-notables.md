---
status: proposal
issue: THR-614
project: Thematic Pressure & Living World
author: Cowork (autonomous scheduled session, 2026-07-05; rescoped same day per Christian — "I want war to land so I can evaluate real gameplay, so scope for full gameplay")
supersedes: none
absorbs: 2026-03-29-conflict-and-destruction-design.md (TB-073 — promoted from deferred ceiling to in-scope core)
builds_on: 2026-07-05-rival-activation-schemes.md (THR-66, shipped), 2026-06-29-agent-personality-moral-drift.md (THR-558), 2026-04-23-thr-225-event-recipe-phased-activation.md (phase runner)
---

# THR-614 — Autonomous Notables & War: the living world acts, and its wars are playable

**Design direction (Christian, 2026-07-04):** *"making core unthreaded npcs autonomous to simulate a living world, like faction leaders, nation leaders, armies etc."*
**Rescope (Christian, 2026-07-05):** *"I want war to land so I can evaluate real gameplay, so please scope for full gameplay."*

This plan now covers **the complete war system as playable gameplay**, not a stub. The prior draft deferred sieges/attrition/destruction to a follow-on ceiling; per the rescope, that ceiling — the fully-designed TB-073 conflict system — is **promoted into scope**. War is delivered as a **playable vertical you can evaluate**, then deepened. The surrounding non-military living-world autonomy (leaders making claims, feuding, building, succession) rides alongside as texture.

## What "full gameplay" means here — the player's loop

War is not a spreadsheet battle. Per the TB-073 north star (kept verbatim): **gods don't command armies — they corrupt, empower, and manipulate the people who do. The player influences through actions only; there is no war UI.** The playable loop is the game's existing divine-intervention loop, applied to war:

1. **The world mobilizes.** A faction's ambition (territorial_expansion, revenge, defense-under-threat) raises an army under a notable commander. You learn of it **through your threads** — a threaded agent in that faction reports the muster; no threads means you find out when the map changes.
2. **The army marches** — visible on the hex map, degrading in cohesion across terrain, occasionally throwing **threshold encounters** (supply crisis, desertion, mutiny) you can intervene in.
3. **Armies collide → a battle node.** The battle carries **momentum**. Each tick it spawns **spotlight encounters** — the existing encounter modal with the three intervention choices — whose POV is set by *which participant you have a thread to* (commander's eye, faction-strategic, artifact-POV). **Your intervention shifts momentum.** This is the gameplay: you tip a battle by blessing a commander at the turning point, cursing the enemy at the breach, spending essence when the last stand hangs.
4. **Sieges** are the same system, slower then accelerating, and act as **gravity wells** — the longer they run, the more the region is pulled in (relief marches, blockade-running, negotiated terms, sabotage) as encounters for *other* actors you may also be threaded to.
5. **Aftermath has stakes.** Resolution applies **scaled destruction** — prosperity collapse, severed trade, razed sublocations, settlements becoming **ruins**, refugees rippling to neighbors, commanders captured or killed, sphere pressure flooding the victor's colors. Losing a war is *supposed to be a great chapter*, not a fail state.

Everything the player does here already exists (encounters, intervention, threads, actions, essence). War is new **content and stakes** wired into the loop you already play — which is exactly why it's evaluable end-to-end.

## Design thesis in one paragraph

Unthreaded actors gain autonomy at two scales on one shared substrate. **Faction-scale ambitions** (TB-073) decide *whether and why* to go to war and raise armies; **individual-scale notable agendas** (four-phase compositions on the shipped THR-66/THR-225 runner) drive the surrounding living world (claims, feuds, works, succession) and supply the **commander** who executes a Campaign. When armies meet, the **battle-node + spotlight** system resolves the clash as a sequence of player-interventable encounters whose depth scales with the player's threads; sieges extend this into a regional gravity well; resolution writes **scaled destruction** back into the world. A spotlight-budgeted roster keeps autonomy performant (never O(all agents)); personality/sphere coloring (THR-558) gives each actor a recognizable hand; and threading any participant turns the war legible and steerable without ever giving the player a command UI. Equilibrium is silence; a mobilization, a battle, a sack is a chapter.

---

## Relationship to settled substrate

| Substrate | State | Role here |
|---|---|---|
| **TB-073 conflict design** (`2026-03-29-…`) | Designed, **now in-scope** (this plan absorbs it) | The full army/movement/battle/siege/destruction/intelligence/UI spec. This plan integrates it, corrects the Quintessence naming (→ `cohesion`), removes its only blocker, and phases its delivery. |
| **THR-66 rival schemes** (`2026-07-05-…`) | **Done** (PR #524) | `Composition kind` pattern + `world-flag` advancement + counter-play + attribution edge + phase-chip UI + hex-influence overlay — reused by the **notable-agenda** (non-war) families and the muster/march lead-up. |
| **THR-225 phase runner** | Shipped | Kind-agnostic composition ledger — advances notable agendas. |
| **THR-558 personality** | Done (substrate) | `axisContributions` color family/ambition selection (a ruthless lord musters; a cunning one feuds). |
| **Existing systems TB-073 leans on** | Shipped | Encounter progression + intervention, pathfinding/movement, sphere pressure, prosperity, faction system, colocation detection, HexMapV2, tiered notifications, `enrichProse()`. War is **new content on shipped machinery** — the reason it can be playable quickly. |

### Correction baked in — army health is `cohesion`, not "Quintessence"

TB-073 named army health/cohesion "Quintessence" and flagged the unbuilt Quintessence sphere (TB-075) as a hard blocker for attrition. Per the UL/rulebook, **Quintessence is the narrative-centrality meta-property — not army health.** Reusing the name is a UL collision. This plan renames army health to **`armyState.cohesion`** (a self-contained 0..max scalar). This (a) removes the collision and (b) **removes TB-073's only blocker** — attrition no longer waits on TB-075. Flag a `UL-proposal` only if a new term is judged needed; `cohesion` is expected to suffice.

---

## Step 0 — Substrate verification (executor does this first, before coding)

1. **Colocation detection exists.** Confirm `phaseColocationDetection` (or equivalent) can fire when two hostile armies share a hex — battle-node creation hooks here (TB-073 §Wiring). If absent, add battle-node creation as a small check in the movement/encounter boundary.
2. **Persistent/battle encounters.** Confirm the encounter phase (`phaseEncounterProgressionV2`) can host a per-tick-updated encounter (the battle node with `BattleState`) that spawns child spotlight encounters. TB-073 assumes this; verify the child-encounter spawn path.
3. **Faction ambitions.** Confirm whether factions already carry ambitions (`pursues` → `ambition` node). TB-073 Phase 0 builds them if not. Verify before inventing; reuse the agent-ambition `pursues`/`ambition` structure at faction scale.
4. **Army as actor + property bag.** Confirm an `actor` node can be spawned with an `armyState` bag + `commanded_by`/`member_of`/`located_at` edges (per shipped antagonist-spawn paths). No new node type for armies.
5. **Composition runner (for non-war notable agendas).** As THR-66 shipped: `world-flag` advancement is live; `notable-agenda` needs zero runner changes.
6. **Thread test + spotlight POV.** Confirm how to test "player has a thread to this participant" and read thread depth — spotlight POV/detail scales on it (TB-073 §Phase 6).

Record all bindings/fallbacks + the cohesion-rename confirmation in the closing comment.

---

## Blast Radius (high-impact files touched)

Per Codesight import counts:

- **`src/types/gameState.ts` (345 importers)** — additive: `armyState` bag on spawned actors; a `battle` node category with `BattleState`; `notableAgendaRoster: string[]`; `ActiveComposition.sponsorActorId?`. All additive/optional → low cascade; consumers recompile, nothing reshaped.
- **`src/engine/graph.ts` (531 importers)** — new edge types **only where no existing edge fits**: `commanded_by` (army→commander), `participates_in` (army/agent→battle node). Additive; node-creation sites unaffected. Reuse `pursues`/`member_of`/`located_at`.
- **`src/engine/orchestrator.ts`** — **no new battle phase** (battles process inside the existing encounter phase, TB-073 §Wiring). Adds: a cohesion-attrition sub-step in the movement phase, a lightweight faction-ambition eval (position ~2.38), and `phaseNotableAgendas` (non-war autonomy). Blast contained to those bodies.

No other ≥100-importer file is reshaped. Battle/army state lives in property bags + a new node category — no change to the actor node type.

---

## Engine pillar

### A. Autonomy drivers (two scales, one intent)

- **Faction ambitions (TB-073 Phase 0).** Factions develop ambitions via faction encounters: `territorial_expansion | resource_acquisition | defensive_consolidation | cultural_dominance | revenge | divine_mandate`. `ambition` graph nodes via `pursues` edges (identical to agent ambitions). The dominant ambition drives faction action, including raising an army. Constants: `FACTION_AMBITION_EVALUATION_INTERVAL` (5), `EXPANSION_PROSPERITY_THRESHOLD` (0.6), `REVENGE_GRIEVANCE_DECAY` (0.02/tick), `DIVINE_MANDATE_THREAD_THRESHOLD` (Influence Tier 3). Revenge bypasses randomness (deterministic from grievance events).
- **Notable agendas (individual scale).** A spotlight-budgeted roster (`MAX_ACTIVE_NOTABLE_AGENDAS`, default 7) of prominent unthreaded notables each carry one four-phase `Composition kind: 'notable-agenda'` on the shipped runner. Prominence = `scope·0.35 + power·0.25 + drive·0.20 + proximity·0.20` (proximity to player threads so the world moves *near you* first). Families: **Claim, Feud, Rite/Work, Succession** (non-military living-world texture) + **Campaign** (the war hand-off — its muster/march phases raise and move an army, then the battle system takes over resolution). Selection is personality/sphere-colored (THR-558). Full family table, advancement, counter-play, and thread-takeover as in the prior draft (retained below in §Non-war notable agendas).

War-relevant unification: a **Campaign** is a faction ambition executed by a **notable commander** (highest-Iron faction leader), producing an **army**. Faction ambition = *why*; notable commander = *who*; army/battle system = *how it resolves*.

### B. Armies

Army = `actor` node + `armyState` bag (no new node type):

```ts
interface ArmyState {
  size: 'warband' | 'regiment' | 'host';   // ~100 / ~1000 / ~10000
  headcount: number;
  objective: ArmyObjective | null;          // {type: raid|conquer|defend|intercept|reinforce_siege, targetNodeId, estimatedAttrition}
  cohesion: number;                          // RENAMED from TB-073 "quintessence" — self-contained army health
  cohesionMax: number;
  raisedTick: number;
  maintenanceCost: number;
}
// edges: member_of (→faction), commanded_by (→commander agent, NEW), located_at (→hex), pursues (→ambition)
```

**Spawn** via faction encounter when: faction has a military-requiring priority ambition, a member at Iron tier ≥ `ARMY_SPAWN_IRON_TIER_MIN` (4), faction Gold tier ≥ `ARMY_SPAWN_GOLD_TIER_MIN` (3), and `< MAX_ARMIES_PER_FACTION` (1 at launch). Deterministic commander pick (highest Iron), one-time `ARMY_CREATION_GOLD_COST` (50) + per-tick maintenance, initial cohesion from Iron tier. The commander's `located_at` follows the army (physically committed).

**Movement** uses existing pathfinding with army cost multipliers (mountains 4.0, water ∞, road discount 0.4) and size-based speed. Processed by `phaseMovement`.

**Cohesion attrition** (movement sub-step, deterministic): `base + terrain·factor + offRoad + underfunded`. The player never sees the number — only **threshold encounters**: Strained 70% (`army_supply_crisis`), Weakened 50% (`army_desertion_wave`), Critical 30% (`army_mutiny`), Collapse 10% (`army_forced_disbandment`). Intervention can prevent collapse at essence cost. Clamp to 0 → clean forced disbandment.

### C. Battles — the playable core

When two hostile armies share a hex, colocation detection creates a **`battle` node** (`BattleState`: `battleType: 'field_battle'|'siege'`, `momentum`, composited `backgroundProse`, `spotlightHistory`, pacing counters, optional `settlementId`). Armies connect via `participates_in` edges — so agents/factions **converge emergently** (a Shadow assassin whose target commands there pathfinds toward it; an ally sends reinforcements) with no special convergence logic.

Each tick, inside the existing encounter phase, the battle node: updates composited prose, applies combat attrition, checks spotlight pacing, spawns a **spotlight child encounter** if due, applies its outcome to momentum, and resolves when `|momentum| ≥ BATTLE_RESOLUTION_THRESHOLD` (8) or max duration.

**Momentum is contextual, not headcount.** Initial momentum from `log2(effectiveAttacker/effectiveDefender) · SIZE_MOMENTUM_SCALE`, clamped so no size ratio auto-resolves — there's always ≥2 momentum of space for spotlights to matter. Situational multipliers: prepared defense 3:1, basic fortification 10:1, grand fortification 30:1, tactical brilliance ≤20:1, blunder 20:1-against. **Modifier-stripping is a headline beat** — a successful breach spotlight drops fortification to 30%, and the IPK prose flips ("impregnable walls" → "shattered defenses"); the player reads the math turning.

**Spotlights are the gameplay.** Regular encounters (existing modal + intervention), POV set by the player's threads (commander-eye / faction-strategic / artifact-POV), detail scaling with thread count (0 = one-line chronicle; 3+ = a Malazan-battle-chapter of layered spotlights). Template pool includes turning-point, commander-peril, moral-dilemma, betrayal, artifact-activation, third-army, divine-counterstrike, last-stand, champion-duel — each with eligibility, POV requirement, and momentum effect (see TB-073 §Phase 3 for the full table). Battle spotlights cost `SPOTLIGHT_INTERVENTION_COST_MULTIPLIER` (1.5×) more essence — fog of war.

### D. Sieges — the gravity well

Same battle-node system, `battleType: 'siege'`, **acceleration pacing**: `spotlightInterval = max(1, SIEGE_INITIAL_INTERVAL − floor(elapsed/SIEGE_ACCELERATION_RATE))` — slow dread (Opening) accelerating to every-tick crescendo (breach, last stand). Defenders start with a momentum bonus (walls). **While active, the siege generates encounters for entities *outside* it** within `SIEGE_REGIONAL_ENCOUNTER_RANGE` (5 hexes): call-for-aid, join-attackers, smuggle-supplies (Shadow), negotiate-terms (Heart), relief-march, sabotage. The longer it runs, the more actors are pulled in — the gravity well. **Starvation** fires at `SIEGE_STARVATION_TICK` (15) if unresupplied (self-contained provisions clock — no trade-web dependency; THR-626 later swaps the provisions *source* to the trade web).

### E. Destruction & aftermath — the stakes

Resolution applies **scaled destruction** from final momentum + loser cohesion: **minor** (−20% prosperity, trade threatened), **major** (−50%, downgrade a settlement tier, sever routes, destroy 1–2 sublocations, 2× victor sphere pressure), **total** (prosperity→0, settlement→**ruins** subtype, all routes severed, faction presence removed, 3× sphere pressure). Ripples: **refugees** (encounters at neighbors, carry culture → sphere shift + unrest), **ruins** (explorable Entropy sites, resettleable later), **power vacuum** (uncontested hexes for other factions and the player's Control), **commander fate** (retreat/capture/kill by severity + seeded PRNG). All seeded and deterministic given seed.

### F. Intelligence — threads are the spy network

No separate intelligence system. Visibility is proportional to the thread network: thread to a mobilizing faction's agent → mobilization notice; thread to the commander → all army/battle spotlights; thread to a besieged settlement → defender's-eye siege; **no threads → nothing until the map changes** (one-line chronicle: "[Army] sacked [Settlement]"). A well-threaded Shadow ascendant gets an intelligence advantage they *earned*; a tightly-focused Force ascendant hits harder but gets surprised. This is a designed asymmetry, not a gap.

### Constants (NFP #1)

Two config files. War constants (`src/data/conflict-config.ts`) — **40+ named constants**, adopted from TB-073 §Constants tables verbatim (army spawn/maintenance/cohesion, movement multipliers, attrition, size/fortification modifiers, battle resolution, siege pacing, destruction thresholds, commander fate). Non-war autonomy constants (`src/data/notable-agenda-config.ts`) — roster cap, invest ticks, prominence weights, etc. (as the prior draft). Every number named; changing war's feel = changing a constant. **Cohesion constants renamed** from TB-073's `QUINTESSENCE_*` to `COHESION_*`.

### Traces (NFP #2)

Six categories from TB-073 (`faction_ambition`, `army_lifecycle`, `army_attrition`, `battle`, `siege`, `destruction`) with the `Cohesion` rename, plus the `notable.*` agenda/roster traces for non-war autonomy. Full interfaces in TB-073 §each-phase and the prior draft §8.

### Fail-soft (NFP #4)

Every subsystem carries TB-073's fail-soft table (no eligible commander → no army; no path → army idles and degrades; unknown terrain → plains default; no spotlight templates → chronicle-only resolution; battle exceeds max duration → forced resolution; both armies destroyed → mutual destruction; siege exceeds max → stalemate withdrawal; no neighbors for refugees → they scatter; commander already dead → skip fate; prosperity at 0 → floor). Plus the autonomy fail-softs (missing spotlight budget → self-roster; missing army-spawn path → Campaign ineligible; move throw → skip). **The tick loop never crashes** (NFP #4 is absolute).

### Determinism (NFP #3)

Attrition, momentum init, size/modifier math, refugee target selection, starvation timing — all deterministic. Seeded PRNG for: spotlight selection among eligibles, spotlight resolution (existing encounter PRNG), commander fate, sublocation-destruction selection, faction ambition selection (revenge exempted). No `Math.random()`.

---

## Content pillar

- **Faction-ambition + army-lifecycle encounters** — raise-army, supply-crisis, desertion, mutiny, forced-disbandment. Baseline register (THR-609), ≥3 variants/beat, placeholders (`{army}`, `{commander}`, `{faction}`, `{settlement}`).
- **Battle spotlight templates** — the full pool (turning-point, commander-peril, moral-dilemma, betrayal, artifact-activation, third-army, divine-counterstrike, last-stand, champion-duel). These are the highest-drama content in the game; lyricism is *earned* here (the register bias allows peaks at the crack/last-stand beats).
- **Siege spotlight + regional templates** — siege-opens (atmospheric), sally-forth, negotiate-terms, starvation, breach, final-assault, relief-arrives; plus the six regional generator encounters.
- **Destruction/aftermath prose** — scaled by severity; refugee encounters; ruins flavor; commander-fate beats.
- **Battle IPK vocabulary** — size (overwhelming/thin line), fortification (impregnable→shattered), tactical (masterful→disordered), numbers-game (grinding/attrition), divine (unnatural/blessed/cursed) — all sphere-colored, never numeric (TB-073 §Phase 3 table).
- **Composited battle prose resolver** — a new resolver layering base + faction + agent + location + intervention (extends `enrichProse()`; load `prose-pipeline` + `Docs/canon/prose.md`).
- **Non-war notable-agenda families** — Claim/Feud/Rite/Work/Succession compositions (living-world texture around the wars), as the prior draft.

## UI pillar

- **HexMapV2** — faction-colored **army sprites** at all zoom tiers (size-scaled, commander badge), **march-route** dashed line to objective, **siege encirclement ring**; plus the notable-agenda claim/influence overlay (reuse THR-66 layer). Load `hexmap-core` + `hexmap-layers`.
- **Battle modal** — a variant of the tiered encounter modal: background composited-prose panel (updates each tick) + embedded spotlight encounter (existing intervention UI) + aftermath panel (destruction prose + consequence summary).
- **Notifications** — existing tiered system: mobilization (modal if threaded to commander/faction; toast if threaded to an agent there), battle spotlight (modal, threaded), attrition threshold (toast), siege established (modal), aftermath (modal; chronicle-only if unthreaded).
- **Notables intent panel** — active non-war agendas as phase-chip cards (reuse RivalPanel component) for the living-world layer.
- **DebugPanel Armies tab** — active armies (objective, cohesion %, commander, faction), active battles/sieges (momentum, pacing phase, spotlight history), destruction log; plus `__DEBUG.getArmies()`, `getBattles()`, `getNotableAgendas()`, and dev-only `forceArmy(faction)` / `forceBattle(a,b)` / `forceNotableAgenda(name,family)`.
- **Player controls** — **none new** (TB-073 north star). The player influences war through existing actions (bless/curse/influence templates), existing spotlight intervention (Pull the threads / Watch from afar / Withdraw), and existing threads (more threads = more visibility and leverage).

---

## Wiring checklist (per `Docs/plans/wiring-checklist.md`)

| Surface | Wiring |
|---|---|
| Orchestrator | Faction-ambition eval (~pos 2.38); cohesion-attrition sub-step in `phaseMovement`; battle-node creation in colocation detection; **battle tick inside the existing encounter phase** (no new battle phase); `phaseNotableAgendas` for non-war autonomy. |
| GameState flow | Army actors (spawn encounter) → cohesion (attrition/battle) → battle nodes (`BattleState`, created by colocation, updated by encounter phase) → destruction mutations (aftermath) → refugee encounters (next tick). |
| GameState fields | `armyState` bag; `battle` node category + `BattleState`; `notableAgendaRoster`; `ActiveComposition.sponsorActorId?`. All additive. |
| Graph | `commanded_by`, `participates_in` edge types (new, if none fit); reuse `pursues`/`member_of`/`located_at`; notable-agenda attribution edge. |
| Traces | Six war categories (Cohesion-renamed) + `notable.*` — registered + emitted. |
| UI | HexMapV2 army sprites/routes/siege ring + agenda overlay; battle-variant modal; tiered notifications; Notables intent panel; DebugPanel Armies tab + `__DEBUG` methods. |
| Prose pipeline | Composited battle-prose resolver (extends `enrichProse()`); spotlight + aftermath via existing encounter prose; baseline register with earned battle peaks. |
| Player controls | None new — actions + spotlight intervention + threads. |

Update `wiring-checklist.md` and the systemic-wiring guide with: battle-node lifecycle, faction-ambition seeding, army spawn, and notable-agenda launch capabilities.

---

## Implementation phasing — playable early, deepened after

The design is the full war system; delivery is sequenced so **the first issue is an evaluable end-to-end war** and each subsequent issue adds evaluable depth. THR-614 = Phase A.

- **Phase A — THR-614 (this issue): the playable war vertical.** Faction military ambition → army spawn → march + cohesion attrition + threshold encounters → colocation battle node → momentum + **core spotlight pool** (turning-point, commander-peril, last-stand) with intervention → resolution → **scaled destruction (minor/major/total)** → army hex sprites + battle modal + thread-based visibility + DebugPanel Armies tab + the six traces. **This is a real, playable, evaluable war** with the full intervention loop and stakes. Large but a coherent vertical (a war you can't fight isn't evaluable).
- **Phase B — THR-628 (blocked by A): battle depth.** Full spotlight template pool (betrayal, champion-duel, third-army, divine-counterstrike, artifact-activation, moral-dilemma) + size/situational modifiers with modifier-stripping IPK + commander-fate variety.
- **Phase C — THR-629 (blocked by A): sieges.** `battleType: 'siege'` + acceleration pacing + siege-as-regional-gravity-well encounters + starvation + siege spotlight templates + encirclement UI.
- **Phase D — THR-630 (blocked by A): aftermath richness + living world.** Refugees, ruins, power vacuum, trade disruption; plus the four **non-military notable-agenda families** (Claim/Feud/Rite/Succession) and the Notables intent panel — the living world *around* the wars.
- **Enhancement — THR-626 (deferred, blocked by trade web THR-616): army supply coupling.** Replace Phase-A/C self-contained provisions with trade-web-derived provisions (Flow Web) — severing a route starves an army. Real dependency on the unbuilt trade route web; not required for playable war.

Phases B–D are independent of each other (all depend only on A) → parallelizable after A lands.

---

## Exit criteria (Phase A — the evaluable bar)

1. A military faction raises an army through the encounter system within ~30 ticks on a map with military factions (CLI: `tick 30` + `armies`).
2. Army movement is visible on HexMapV2 with faction color + march route (browser screenshot).
3. Two armies meeting create a persistent battle node with ≥1 spotlight if the player has any thread to a participant; **intervention visibly shifts momentum** (CLI + browser).
4. Battle aftermath applies scaled destruction — sphere pressure + prosperity drop verifiable in DebugPanel destruction log.
5. Cohesion degradation spawns threshold encounters (CLI: `tick 30` + `encounters`).
6. Thread-based visibility works — no threads → chronicle-only; commander thread → full spotlight sequence.
7. No new orchestrator phase for battles (they process in the encounter phase).
8. Determinism + fail-soft: same seed → same war; missing substrate → fallback, never a crash.

(Phases B/C/D carry the remaining TB-073 success criteria — full spotlight variety, siege acceleration, refugees/ruins.)

## Acceptance criteria (Phase A / THR-614)

- [ ] Step 0 checks + bindings + **cohesion-rename confirmation** recorded in the closing comment.
- [ ] Faction military-ambition eval + army spawn (Iron/Gold gates, deterministic commander) + maintenance; `armyState` bag with `cohesion`; `commanded_by` edge.
- [ ] Army movement (existing pathfinding + army cost multipliers/speed) + cohesion-attrition sub-step + four threshold encounters.
- [ ] Battle-node creation on colocation; momentum init (size/log2/modifiers); battle tick in encounter phase; **core spotlight pool** (turning-point, commander-peril, last-stand) with thread-POV + intervention→momentum; resolution.
- [ ] Scaled destruction (minor/major/total) with sphere pressure + prosperity + settlement-tier + commander fate; seeded PRNG where noted.
- [ ] HexMapV2 army sprites + march route; battle-variant modal (background prose + spotlight + aftermath); tiered notifications; DebugPanel Armies tab; `__DEBUG.getArmies()/getBattles()`.
- [ ] Six war traces registered + emitted; constants in `conflict-config.ts` (COHESION-renamed).
- [ ] Tests: army spawn gates; deterministic commander; attrition thresholds; momentum math; spotlight selection seeded; destruction severity mapping; fail-soft on missing substrate/target; thread-visibility tiers.
- [ ] 30-tick CLI engine smoke + a war run reaching a resolved battle; last ~10 lines pasted as evidence.
- [ ] Browser-verify @1920×1080: army sprites + march route (Claude-in-Chrome WebGL) **and** battle modal with a spotlight (Playwright DOM); console block; `__DEBUG.getBattles()` assertion.
- [ ] Follow-on issues confirmed filed (THR-628/629/630); THR-626 reframed.
- [ ] Docs: `project-status.md`, `project-history.md`, `changelog.md`; wiring-checklist + systemic-wiring guide; `Docs/canon/rulebook.md` war section (armies, battles, sieges, destruction as rules of play — mark `[IMPL]` for Phase A, `[DESIGN]` for B/C/D).

## Phase-A concrete NFP artifacts (inline — the executor ships these, not the full TB-073 set)

Phases B/C/D adopt the remaining TB-073 constants/traces/fail-soft rows when they land. Phase A ships exactly this.

### Phase-A constants (`src/data/conflict-config.ts`)

| Constant | Default | Purpose |
|---|---|---|
| `ARMY_SPAWN_IRON_TIER_MIN` | 4 | Min commander Iron tier to raise an army |
| `ARMY_SPAWN_GOLD_TIER_MIN` | 3 | Min faction Gold tier to fund one |
| `ARMY_CREATION_GOLD_COST` | 50 | One-time creation cost |
| `ARMY_MAINTENANCE_{WARBAND,REGIMENT,HOST}` | 2 / 5 / 10 per tick | Gold drain by size |
| `COHESION_BASE_{WARBAND,REGIMENT,HOST}` | 30 / 60 / 100 | Starting cohesion by size (renamed from `QUINTESSENCE_BASE_*`) |
| `MAX_ARMIES_PER_FACTION` | 1 | Concurrent armies/faction at launch |
| `ARMY_BASE_ATTRITION` | 0.5/tick | Baseline cohesion loss |
| `TERRAIN_ATTRITION_FACTOR` | 0.3 | ×terrain cost, added to attrition |
| `OFF_ROAD_ATTRITION_PENALTY` | 0.8 | Extra attrition off-road |
| `UNDERFUNDED_ATTRITION_PENALTY` | 1.5 | Extra attrition when maintenance unpaid |
| `COHESION_THRESHOLD_{STRAINED,WEAKENED,CRITICAL,COLLAPSE}` | 0.70 / 0.50 / 0.30 / 0.10 | Threshold-encounter triggers (renamed from `QUINTESSENCE_THRESHOLD_*`) |
| `ARMY_SPEED_{WARBAND,REGIMENT,HOST}` | 2 / 1.5 / 1 hex/tick | Movement speed by size |
| `ARMY_ROAD_DISCOUNT` | 0.4 | Road cost reduction for armies |
| `SIZE_MOMENTUM_SCALE` | 1.5 | Size ratio → initial momentum |
| `FORTIFICATION_BASIC` / `FORTIFICATION_GRAND` | 10 / 30 | Defender size multipliers (settlements) |
| `PREPARED_DEFENSE_MULTIPLIER` | 3 | Prepared-ground multiplier |
| `TACTICAL_MAX_MULTIPLIER` | 20 | Cap on commander/terrain tactical edge |
| `BATTLE_RESOLUTION_THRESHOLD` | 8 | \|momentum\| that ends a battle |
| `FIELD_BATTLE_SPOTLIGHT_INTERVAL` / `FIELD_BATTLE_MAX_DURATION` | 1 / 5 ticks | Spotlight cadence + forced-resolution cap |
| `BATTLE_COMBAT_ATTRITION` | 2.0/tick | Cohesion loss during active combat |
| `SPOTLIGHT_INTERVENTION_COST_MULTIPLIER` | 1.5 | Battle spotlights cost more essence (fog of war) |
| `TOTAL_DESTRUCTION_THRESHOLD` / `MAJOR_DESTRUCTION_THRESHOLD` | 10 / 6 | Momentum magnitude → severity tier |
| `PROSPERITY_LOSS_{MINOR,MAJOR}` | 0.20 / 0.50 | Prosperity reduction by severity |
| `SPHERE_PRESSURE_{MINOR,MAJOR,TOTAL}_MULTIPLIER` | 1.0 / 2.0 / 3.0 | Victor sphere pressure by severity |
| `COMMANDER_CAPTURE_DURATION` / `COMMANDER_DEATH_CHANCE_TOTAL` | 10 ticks / 0.30 | Commander fate params |

(Siege pacing, the full spotlight-pool momentum values, and refugee counts arrive with Phases C/D.)

### Phase-A trace interfaces (`src/engine/traceBuffer.ts`)

```ts
interface FactionAmbitionTrace { category: 'faction_ambition'; tick: number; factionId: string; ambitionType: string; event: 'created'|'prioritized'|'progressed'|'completed'|'abandoned'; reason: string; }
interface ArmyLifecycleTrace { category: 'army_lifecycle'; tick: number; armyId: string; factionId: string; commanderId: string; event: 'raised'|'objective_set'|'arrived'|'disbanded'|'destroyed'|'mutiny'; details: string; }
interface ArmyAttritionTrace { category: 'army_attrition'; tick: number; armyId: string; cohesionBefore: number; cohesionAfter: number; attritionAmount: number; attritionSources: { base: number; terrain: number; offRoad: number; underfunded: number }; thresholdCrossed?: 'strained'|'weakened'|'critical'|'collapse'; }
interface BattleTrace { category: 'battle'; tick: number; battleEncounterId: string; event: 'started'|'spotlight_spawned'|'momentum_shift'|'resolved'; momentum: number; attackerArmyId: string; defenderArmyId?: string; spotlightTemplateId?: string; spotlightOutcome?: 'success'|'failure'|'critical_success'|'critical_failure'; resolutionType?: 'attacker_victory'|'defender_victory'|'stalemate'|'mutual_destruction'; }
interface DestructionTrace { category: 'destruction'; tick: number; battleEncounterId: string; severity: 'minor'|'major'|'total'; settlementId?: string; sublocationsDestroyed: string[]; tradeRoutesSevered: string[]; prosperityBefore: number; prosperityAfter: number; commanderFate: 'retreated'|'captured'|'killed'; spherePressureApplied: Partial<Record<string, number>>; refugeeEncountersGenerated: number; }
// `siege` category interface ships with Phase C (THR-629).
```

### Phase-A fail-soft table

| Failure | Behaviour |
|---|---|
| No eligible commander (none at Iron ≥4) | Skip army spawn; faction retries next ambition cycle. No throw. |
| Faction Gold insufficient mid-campaign | Treat as underfunded → max attrition penalty; supply-crisis encounter fires sooner. |
| Army has no valid path to objective | Army idles in place; cohesion still degrades → eventual threshold/disband. |
| Unknown terrain cost | Default to `plains` (1.5); warn trace. |
| Cohesion < 0 | Clamp to 0 → forced clean disbandment (never negative state). |
| No eligible spotlight templates | Skip spotlight this tick; advance pacing → battle may resolve chronicle-only. |
| Player has no threads to either army | No spotlights; battle resolves silently; player sees aftermath via map + chronicle. |
| Battle exceeds `FIELD_BATTLE_MAX_DURATION` | Force resolution on current momentum (stalemate if ≈0). No infinite battles. |
| Both armies destroyed same tick | Mutual-destruction resolution; aftermath applies to both. |
| Settlement has no sublocations to destroy | Apply prosperity loss only. |
| Commander already dead/missing | Skip commander-fate; army dissolves cleanly. |
| Any battle/army move throws | Log `battle`/`army_lifecycle` error event, skip the step, keep state alive. **Tick loop never crashes.** |

## NFP compliance

| NFP | Verdict | Notes |
|---|---|---|
| 1. Tunability | PASS | 40+ named war constants (TB-073) + autonomy constants; COHESION-renamed. War feel = constants. |
| 2. Inspectability | PASS | Six war traces + `notable.*`; DebugPanel Armies tab; `__DEBUG` bridge; every battle/army/destruction event traced. |
| 3. Determinism | PASS | Attrition/momentum/modifiers/refugees/starvation deterministic; PRNG identified + seeded (spotlights, commander fate, ambition selection); no `Math.random()`. |
| 4. Fail-soft | PASS | Per-subsystem tables from TB-073 + autonomy; battles cap at max duration; cohesion clamps; missing data → safe defaults. Tick loop never crashes. |
| 5. Narrative over mechanical | PASS | The core principle — battles exist for stories; spotlight depth = surprise+drama; losing a war should be a great chapter; modifier-stripping is a headline beat; register peaks earned at last-stand/breach. |
| 6. Additive over destructive | PASS | No existing types reshaped; `actor` gains optional `armyState`; new `battle` node category; new edges `commanded_by`/`participates_in`; encounter phase *extended*, not rewritten; reuses shipped THR-66 additively. |
| 7. Performance budget | PASS with note | 1 army/faction at launch; battles add per-tick processing for *active* battles only; roster cap governs autonomy. Profile if simultaneous battles exceed ~3 or army count grows; `MAX_ARMIES_PER_FACTION` + roster cap are the governors. |

## Three-pillar check

Engine ✓ (faction/notable autonomy drivers, armies, cohesion attrition, battle nodes + momentum + spotlights, sieges, destruction, intelligence, edges/fields) · Content ✓ (ambition/army encounters, full spotlight + siege pools, destruction/refugee prose, battle IPK, composited resolver, non-war families) · UI ✓ (army sprites/routes/siege ring, battle modal, notifications, Notables panel, DebugPanel Armies tab) · Wiring ✓ (table above).

## Rulebook impact

Major — war becomes a rule of play. Update `Docs/canon/rulebook.md` (add a War / Conflict section, extend Encounters + Clocks): factions raise armies via ambitions; armies march and lose cohesion; battles resolve through player-interventable spotlight encounters whose depth scales with threads; sieges are gravity wells; resolution writes scaled destruction; the player never commands, only influences. Mark `[IMPL]` for Phase A rules, `[DESIGN]` for B/C/D. Re-verdict the section on each phase's merge.

## Vision audit

Strongly reinforced. **Player-as-god who nudges, not commands** — the TB-073 north star is the design's spine (no war UI; influence via actions/threads/spotlight intervention only). **Emergence-as-ingredient / authorship-as-kitchen** — battles are interesting nodes other systems react to; convergence is emergent, not scripted. **Anomalies are content / equilibrium is silence** — a war is a chapter, not a dashboard; no war meters. **Failure is plot** — losing a war is designed to be a great chapter. No Vision premise contradicted; the "gods manipulate the people who wage war" framing *is* the Malazan-inflected Threadbare thesis. No premise needs editing.

## Rejected approaches

- ❌ A war/command UI or army-order controls — rejected; TB-073 north star. Influence via actions/threads/spotlights only.
- ❌ Headcount-decides-battles — rejected; momentum is contextual (modifiers, spotlights); numbers only decide when all else is neutralized, and *that's a story beat*.
- ❌ "Quintessence" for army health — rejected as a UL collision; renamed `cohesion` (also removes the TB-075 blocker).
- ❌ A new `Army`/`Battle` graph *node type* invented ad hoc — army is an `actor` + bag; battle is a new node *category* with `BattleState` (verified against schema, TB-073-blessed), reached by edges.
- ❌ A separate intelligence/spy system — rejected; threads ARE the spy network (earned asymmetry).
- ❌ A new orchestrator phase for battles — rejected; battles process inside the existing encounter phase (TB-073 §Wiring).
- ❌ Blocking playable war on the trade web — rejected; provisions/starvation are self-contained in Phase A/C; the Flow Web coupling (THR-626) is an enhancement, not a gate.
- ❌ Deferring war to a follow-on ceiling — **reversed by the 2026-07-05 rescope**; war is in-scope, delivered as a playable vertical (Phase A) then deepened.

## Sources

- [THR-614](https://linear.app/threadbare/issue/THR-614) — this issue (directive + 2026-07-05 rescope).
- `Docs/plans/2026-03-29-conflict-and-destruction-design.md` — TB-073 full war system (now in-scope; absorbed).
- `Docs/plans/2026-07-05-rival-activation-schemes.md` — THR-66 composition substrate (Done, PR #524) — non-war notable agendas.
- `Docs/plans/2026-06-29-agent-personality-moral-drift.md` — THR-558 axis registry (personality coloring).
- `Docs/plans/2026-07-04-flow-web-exploration.md` §army-supply row — the deferred THR-626 coupling.
- `Docs/canon/agents.md`, `rulebook-quick-reference.md`, `process.md`; `src/engine/orchestrator.ts`, `phaseColocationDetection`, `phaseEncounterProgressionV2`, `phaseMovement`, `src/types/gameState.ts`, `src/types/graph.ts`.

---

## Forked-audit verdicts

_Forked structural audit (opus subagent), 2026-07-05 (post-rescope):_

- **NFP audit — REVISE → addressed.** The auditor flagged that six NFPs were substantiated by *pointer* to TB-073 (traces/fail-soft/constants cited, not present inline), which the process canon requires present. **Fix applied:** the "Phase-A concrete NFP artifacts" section now inlines Phase-A's constants (~25), the five Phase-A trace interfaces (cohesion-renamed), and the Phase-A fail-soft table. The `cohesion` rename was noted as the one already-substantiated NFP move. Re-verdict on this basis: PASS.
- **Three-pillar + phasing — PASS.** All three pillars real and wired (engine ambition/army/battle/destruction; content ambition/spotlight/aftermath prose + composited resolver; UI sprites/modal/DebugPanel; genuine wiring table). Phase A is a coherent shippable vertical — raise → march → fight via spotlight intervention → lose to scaled destruction — not a fragment. A→B/C/D split is clean (B/C/D each depend only on A, mutually independent). Watch-item (not a blocker): Phase A is large; the "core spotlight pool = 3 templates" boundary must hold to stay uncuttable-but-coherent — guard against creep back to the full pool. _(Captured in the handoff guardrails.)_
- **Vision — PASS.** No-war-UI / no-command-controls is load-bearing and honored; spotlight-first influence keeps this a god-game, not a 4X. Emergence-as-ingredient, anomalies-are-content, failure-is-plot all align. Residual risk is presentational only (army sprites/DebugPanel could *read* as a wargame HUD) — mitigation: keep surfacing spotlight-first (chapters, not dashboards). _(Captured in the handoff guardrails.)_

## Intent-judge verdict

_Intent-judge (opus subagent), 2026-07-05 (post-rescope):_ **Allow.** The rescoped plan pulls the full TB-073 war system in-scope and structures Phase A (THR-614) as a genuinely playable end-to-end vertical — army spawn → march + cohesion attrition + threshold encounters → colocation battle node → core spotlight pool with intervention that visibly shifts momentum → scaled destruction → hex sprites + battle modal + thread visibility. Exit criteria #3 (intervention visibly shifts momentum) and #4 (destruction verifiable) prove Phase A is a war you can fight and lose, not a stub — faithful to "evaluate real gameplay." Phasing B/C/D as depth-on-a-working-vertical (each blocked only by A, parallelizable) is the correct read of "scope for full gameplay." God-who-nudges holds (no new controls; no war UI). Load-bearing rules respected (army = actor + bag; battle = blessed node category; relationships as edges; additive reuse of shipped THR-66/225/558). Quintessence→`cohesion` resolves a real UL collision and removes the TB-075 blocker; self-contained provisions unblock playable war with the trade-web coupling honestly deferred to THR-626. No gating scope creep.
