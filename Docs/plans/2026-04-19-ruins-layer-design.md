# Ruins Layer — Design Doc

**Date:** 2026-04-19
**Status:** Design complete (post fresh-eyes review pass), ready for Implementation Planning
**Predecessors:**
- `Docs/plans/2026-04-18-ruins-layer-brainstorm-prep.md` (research + scoping)
- `Docs/plans/2026-04-17-secrets-and-favors-quality-gate.md` (THR-30 — clue's sibling system)

**Authorship:** Consolidates a multi-session brainstorm between Christian Spliid and the Cowork design agent (2026-04-17 → 2026-04-19). Locks every decision taken in that dialogue; notes deferrals for v2+ where applicable.

**Revision history:**
- 2026-04-19 v1 — Initial draft from brainstorm consolidation.
- 2026-04-19 v1.1 — Fresh-eyes review pass corrected: attention tier vocabulary (`background`/`shaping`/`story_beat` per `src/types/attention.ts`), location subtype rename (`elder_ruin` to avoid collision with existing `'ruins'`/`'ruined_*'` cosmetic subtypes), sublocation schema (free-string `sublocationTypeId: 'ruins.scar'` not union extension), explicit Prerequisites section (portfolio-pinning, `elderEssenceReward` refactor, trace-category registration), full TypeScript trace interfaces for all 16 categories, worked Narrative Gravity example, NFP count alignment (56 constants / 13 fail-soft rows).

---

## Executive Summary

The **Ruins Layer** is Threadbearer's system for elder-magic discovery, god-mortal-rival informational asymmetry, and high-risk/high-reward site exploration. It introduces four new graph primitives (`knows_clue_of` edge, `'delve'` encounter variant, `'elder_ruin'` LocationSubtype, `'place_of_power'` LocationSubtype) plus one new sublocation type (`'ruins.scar'`) layered on top of existing infrastructure (narrative-layer revelation, treasure-map consumption pattern, elder-essence reward function, historical-culture seeding, THR-30 knowledge edges). The `'elder_ruin'` name is chosen specifically to avoid collision with the existing cosmetic subtypes `'ruins'`, `'ruined_tower'`, `'ruined_city'`, `'ruined_village'` (which are decorative and do not participate in the systemic ruins layer).

The system's signature mechanics:

1. **Clues** are transient `knows_clue_of` edges attached to actors and factions, sibling to THR-30's `knows_secret_of`. They have precision bands (vague → narrowed → located), provenance (library research, tavern rumor, treasure map, divine whisper), and decay.
2. **Delves** are a `'delve'` variant of the unified encounter system — 5-tick arcs with 3 player-intervention beats. Every delve transforms its ruin. Single-agent for v1.
3. **Places of Power** are the durable product of a successful delve — permanent location-subtype nodes with sphere-aligned essence streams, contested by holders. They form a new economic axis of divine play.
4. **God-vs-god conflict** is first-class: rival gods use the same Perceive action family as the player, produce clue edges pointing at live Places of Power, and intervene via a four-way dilemma (Let / Claim / Bargain / Corrupt) at delve emergence.
5. **Scale-based concurrency** keeps the player with one saga-delve plus two to three minor threads at any time; no delve firehose.
6. **Narrative Gravity biases big delves to big actors.** Six coordinated channels (receiver-weighting, saga tier floors, worldgen co-location, faction dossier propagation, Compose-a-Clue defaulting, faction quest routing) ensure saga-scale content attaches to the highest-weight agents. The cascade: big actors → saga delves → Transformed outcomes → new ascendants. The protagonist portfolio emerges from the ruins layer.

This doc is a **three-pillar spec** (Engine + Content + UI) with full NFP compliance. It defers party delves, misleading clues, and cross-god cooperation to v2+ with clean schema hooks.

---

## Context

### What's already built (do not reinvent)

Found via repo audit on 2026-04-19:

| Existing system | Location | Relevance to ruins |
|-----------------|----------|-------------------|
| Historical culture seeding | `src/engine/historicalCulture.ts` | Dead empires at world-seed time; their identity drives "region naming, ruin generation, artifact seeding, and prose enrichment" |
| Narrative-layer revelation | `src/types/unifiedAction.ts` + `src/engine/revelationResolver.ts` | `'ruins'` is already one of four narrative layers; `hex.read_stones` (full) and `hex.whisper_intuition` (partial) are registered divine actions |
| Treasure maps | `src/engine/treasureMapConsumption.ts` | Clue-as-item pattern partly wired — function already takes an `eventType` parameter, but only `'hidden_site_discovered'` call sites exist today. Ruin integration is a new call site, not a refactor. |
| Elder-essence rewards | `src/engine/elderEssenceReward.ts` | Currently coupled to `HiddenSiteRevealResult` (line 34 signature). Not directly reusable for ruin-transformation. Either generalize signature or add a sibling function — see Prerequisites. |
| Hidden site discovery | `src/engine/revelationResolver.ts` (HiddenSiteRevealedTrace) | Sublocation-revelation plumbing exists; extend for ruin-specific revelation |
| Adventurer's Guild | `src/data/faction-definitions.ts` (`ADVENTURING_GUILD_DEFINITION`) | Already exists with reserved quest IDs (`ag.quest.ruin_delve`, `ag.quest.recover_artifact`, `ag.senior.deep_expedition`, `ag.elite.lost_city`) — populate these hooks rather than create a new faction |
| Secrets & Favors (THR-30) | `src/types/secretsFavors.ts` | Knowledge-as-edge primitive; clues are a sibling of secrets under a unified `knowledge` edge family |

**Consequence:** the ruins-layer implementation is substantially smaller than a greenfield system. We're **extending and naming**, not inventing infrastructure.

### What today's design adds

- `knows_clue_of` edge type (sibling to `knows_secret_of`).
- `Clue` target polymorphism — pointing at `'elder_ruin'` locations in v1, extensible to agents/factions/artifacts in v2+.
- `encounterVariant: 'delve'` tag on the unified encounter system, with a 5-tick arc resolver.
- `'elder_ruin'` LocationSubtype — systemic delve-eligible ruin (distinct from existing cosmetic `'ruins'`/`'ruined_*'` subtypes).
- `'place_of_power'` LocationSubtype — promotion target for transformed `elder_ruin` locations.
- `'ruins.scar'` sublocation type (registered via `sublocationTypeId` — free-string registry, not a union extension).
- Perceive divine-action family (5 actions) + Relay divine-action family (2 actions).
- Claim / Bargain / Corrupt divine actions at delve emergence.
- Scale-based delve concurrency cap at `phaseDelveAdmission`.
- Ruin density seeding rules during worldgen historical-culture pass.
- **16 new `ruins.*` trace categories** registered in `TRACE_CATEGORIES` (Step 0 of PR 1).
- **Optional refactor** of `computeElderEssenceReward` to accept a generic shape, so both `HiddenSiteRevealResult` and `RuinTransformedTrace` can drive the reward path without duplication.

### Hard prerequisites (must land or be stubbed before ruins-layer ships)

These are systems the ruins-layer design *assumes exist* and must either be implemented first or have explicit fallbacks documented. Verify each before opening implementation issues.

| Prerequisite | Status (verified 2026-04-19) | Required by | Mitigation if absent |
|--------------|------------------------------|-------------|---------------------|
| **Portfolio-pinning mechanism** (`portfolio_pinned` flag/edge on actors marked as protagonists by the player or system) | **Does not exist** in code (`grep portfolio` returns only unrelated faction-content files) | Narrative Gravity Channel 1 (`portfolioPinnedBonus`), Channel 5 (Compose-a-Clue default tie-break) | Open a separate Linear issue for portfolio-pinning before PR 2; until shipped, `CLUE_BIAS_PORTFOLIO_PINNED` resolves to `+0` and Compose-a-Clue tie-breaks fall through to receiver-score from Channel 1. The design degrades gracefully — bias is still strong via tier + bonded — but the *protagonist-promotion* cascade weakens. |
| **Backstory-stratum culture-tie lookup** (per `prose-vignettes-and-enrichment` skill — `agent.backstoryStrata` referencing `originCultureId`) | Backstory strata exist but the culture-tie predicate may not be a single function call yet | Channel 1 (`cultureBackstoryTieBonus`) | If lookup is multi-step, extract a `agentTiesToCulture(agent, cultureId): boolean` helper as part of PR 2; if backstory data lacks the linkage, this bonus collapses to `+0`. |
| **`AttentionTier` is a stable, queryable property of every agent** | Verified — `intrinsicTier: AttentionTier` lives on every encounter and on actor metadata (`src/types/attention.ts`, `src/types/encounter.ts`, `src/types/unifiedAction.ts`) | Channels 1, 2, 4, 5 | None needed; system already in place. |
| **Faction rank is queryable on every faction member** (Adventurer's Guild specifically — Master / Senior / Journeyman / Apprentice) | Verified — `ADVENTURING_GUILD_DEFINITION` has rank schema; member-rank edges exist | Channel 4 (dossier propagation), Channel 6 (quest routing) | None needed. |
| **`emitTrace` accepts `ruins.*` categories** | These are new categories — must be added to `TRACE_CATEGORIES` in `src/types/trace.ts` before any ruins code lands | All inspectability | PR 1 Step 0: register all 16 categories. Without this, traces are silently dropped (the `as any` pattern visible in `treasureMapConsumption.ts` line 91 is a smell — do not propagate). |
| **`treasureMapConsumption.consumeTreasureMapsAtHex` accepts an `eventType` parameter** | Verified (line 35: `eventType: string`); current callers pass `'hidden_site_discovered'` only | Clue-as-item consumption for ruin discovery | Add a new call site that fires with a ruin-event type (e.g. `'ruins.delve_admitted'`); no refactor needed but design must register the new event type and a possession `consumeOnEvent` matcher. |
| **`computeElderEssenceReward` is currently coupled to `HiddenSiteRevealResult`** | Verified — function signature `(reveal: HiddenSiteRevealResult, tick: number)` (line 34 of `elderEssenceReward.ts`) | Elder-essence reward at delve emergence | Either (a) refactor signature to accept a generic `{ hasElderMagic: boolean; sublocationName: string; sublocationId: string }` shape and call from both surfaces, or (b) write a sibling `computeRuinTransformationEssenceReward` that mirrors the logic for `RuinTransformedTrace`. PR 5 picks one and documents in commit. The current design assumed reuse "for free"; the actual delta is a small refactor. |

### Non-goals for v1

- Party delves. (Schema hook via `participants: AgentId[]` — array of length 1 in v1.)
- Misleading clues (wrong leads that point at the wrong site). v2+.
- Inter-god cooperation / alliance on delve outcomes. v2+.
- Rival god entities as active agents. Schema hook only — the Perceive/Relay/Claim actions are designed to work identically for rival gods, but the rival-god actor type is its own feature.
- Multi-saga chains (sequential sagas sharing an ongoing plot). v2+.
- Misfired delves (agent enters without a clue and blunders into danger). v2+; the design presumes clue-converged initiation.

---

## Load-Bearing Decisions (settled in brainstorm)

These are locked. Do not revisit without explicit user conversation.

1. **Clues are graph edges, not nodes.** A `knows_clue_of` edge points from the knower (actor or faction) to the target (ruin, in v1). Edge carries provenance, magnitude, precision, consumption state. Target polymorphism lives on the edge's `targetId`, not in a separate clue node.
2. **Clues are transient.** On convergence (delve initiated successfully at target), all clue edges pointing at that target are pruned and the holders' knowledge is promoted to a `knows_of` familiarity edge. Unreached clues decay on a TTL. No persistent clue-graph bloat.
3. **Clue discovery extends THR-30's six discovery templates.** Quiet Observation, Intercepted Message, Spy Debrief, Drunken Confession, Confession Over Drinks, Overheard Argument — each gets a clue-branch alongside its secret-branch. Plus 3–4 ruin-specific templates (Trash Map in Looted Pack, Glossed Tome, Mason's Mark, Drunk Cartographer).
4. **Delve is a unified encounter variant, not a new pipeline.** `encounterVariant: 'delve'` tags the encounter; the 5-tick arc is the variant's signature internal structure. Inherits scoring, awareness, prose enrichment, aftermath plumbing from unified encounters.
5. **Every delve transforms its ruin.** Binary terminal states: **Consumed** (ruin pruned; Scar sublocation spawned) or **Transformed** (ruin promoted to PlaceOfPower location subtype). No neutral "visited and moved on" outcome.
6. **Places of Power are contested essence faucets.** Sphere-aligned, holder-bound, passive per-tick essence stream, ambient-encounter gravity well for their sphere. Target ~20–30% of mature-game god essence income.
7. **Stream transferability decays over 10 ticks on holder absence.** Holding is active posture, not one-time claim. Rival claim attempts are explicit divine actions, not passive.
8. **God-vs-god information conflict is first-class.** Rival gods use the same action vocabulary as the player god. Perceive-family actions produce clue edges pointing at active PlacesOfPower. Rival-god discovery is the bridge into rival intervention.
9. **Emergence Dilemma is the ruins layer's signature.** Four-way divine intervention at delve emergence: **Let / Claim / Bargain / Corrupt** — each mutates who benefits from the delve outcome.
10. **Scale-based concurrent cap.** `scale: 'minor' | 'major' | 'saga'`. Saga = 1 globally; Major = up to 2 (blocked during saga); Minor = up to 3 always. Gates at delve initiation, not clue availability.
11. **Single-agent delves in v1.** Schema carries `participants: AgentId[]` (array of length 1 in v1). Party delves are v2+ without migration.
12. **Ruin density follows lost-culture territory.** Baseline density on wilderness hexes within a fallen culture's former reach. Capital/dense-settlement hexes over the same territory: 2–3× baseline. Most non-capital hexes: 0–1 ruin. No hex exceeds 3 without special worldgen reason.
13. **Agents return from delves changed.** Every delve resolution runs a consequence roll: Catastrophic (~10%) / Scarred (~25%) / Marked (~35%) / Triumphant (~20%) / Transformed (~10%). There is no "unchanged" outcome.
14. **Dual-voice chronicle is the UI pattern for all delve beats.** Poet's Voice (display serif, italic, emotional prose) above + Witness's Voice (sans-serif, muted, bulleted, mechanical exposition) below. This pattern is general and should be used throughout chronicle; the ruins layer is its first major consumer.
15. **No ambient chronicle entries for god perception.** All god perception surfaces via actions the player (or rival) explicitly took. No passive "the weave stirs around Kael" chronicle without a prior Perceive spend.
16. **Big delves bias toward big actors (Narrative Gravity).** Clue receiver selection, worldgen ruin placement, faction dossier propagation, Compose-a-Clue default targeting, and faction quest routing all bias high-magnitude ruins toward high-attention-tier agents. Saga-tier clues physically cannot land on background NPCs. The cascade: high-impact agents undertake sagas → consequence rolls land Transformed outcomes more often (because high-impact agents take saga delves more often) → ascendants emerge from the ruins layer rather than from worldgen specials.

---

## Narrative Gravity (Big-Actor Bias)

The ruins layer is wired so that **the system's most consequential content (saga delves) reliably attaches to the system's most narratively weighty actors (portfolio-pinned, bonded, ascendant, elite-rank).** Without this bias, the consequence-roll's 10% Transformed outcome wastes itself on background NPCs the player has no reason to follow; with the bias, it becomes the protagonist-promotion engine.

The bias operates through six coordinated channels — no single channel does the work alone, and each is independently tunable:

### Channel 1: Receiver-selection weight in `produceClueConsequence`

When a clue is generated from any source, candidate recipients are scored:

```
receiverScore = baseTierMultiplier
              × (1 + bondedToPlayerBonus)
              × (1 + portfolioPinnedBonus)
              × (1 + factionRankBonus)
              × (1 + sphereAlignmentMatchBonus)
              × (1 + cultureBackstoryTieBonus)
```

Where:
- `baseTierMultiplier` reads the existing `AttentionTier` (`story_beat = 4.0, shaping = 2.0, background = 1.0`) — per `src/types/attention.ts` the tier union is `'background' | 'shaping' | 'story_beat'`
- `bondedToPlayerBonus` adds 5.0 for the player god's bonded agents
- `portfolioPinnedBonus` adds 3.0 for **portfolio-pinned agents** (see prerequisite note below — the portfolio-pinning mechanism does not yet exist and is a gating dependency for this channel)
- `factionRankBonus` adds 2.5 for guild masters / lieutenants / ascendants
- `sphereAlignmentMatchBonus` adds 1.5 when the agent's primary sphere matches the ruin's originating-culture sphere
- `cultureBackstoryTieBonus` adds 3.0 when the agent's backstory-stratum (existing system per `prose-vignettes-and-enrichment` skill) ties them to the originating lost culture

Selection is weighted-random among candidates within the eligible pool (geographic reachability + faction membership for `faction_dossier` source), not deterministic top-pick — so the bias is strong but not mechanical.

### Channel 2: Saga clues enforce a tier floor

Saga-magnitude clues (`ruinMagnitude ≥ 0.67`) check `SAGA_CLUE_MIN_TIER` before any receiver-selection runs. If no candidate in the eligible pool meets the floor (`shaping` tier or higher — i.e. either `'shaping'` or `'story_beat'`), the clue **does not generate**. The opportunity stays latent on the ruin until a sufficiently high-tier agent enters the eligibility pool. This is the hard guard that prevents saga sagas wasting on nobodies.

Major-magnitude clues (`0.34–0.66`) prefer `shaping`/`story_beat` agents but allow `background` agents as recipients (the bias is soft). Minor clues are unconstrained.

### Channel 3: Worldgen co-location of saga ruins

During the ruin-seeding worldgen pass, after lost-culture territory is computed, saga-magnitude ruins (the highest-magnitude ones, derived from the culture's capital sites) get a placement-bias toward hexes that:
- Sit within the territory's historical reach (existing rule)
- AND are within `SAGA_RUIN_PROXIMITY_HEXES` of a current high-density settlement or capital
- AND have a `regionalCosmologyPressure` matching the culture's sphere alignment

`SAGA_RUIN_WORLDGEN_HIGH_DENSITY_BIAS` (default 0.6) controls the strength: 0.0 = pure historical-territory placement, 1.0 = saga ruins always co-locate with current high-density regions. Default 0.6 means saga ruins lean toward where the action is, but ~40% of the time still land in the wilderness for narrative variety.

### Channel 4: Faction dossier rank propagation

When a clue with `source: 'faction_dossier'` enters a faction's collective knowledge (the faction-internal intelligence-share mechanism), it propagates to members in rank-tier order:

- Saga-tier clue: visible to elite-rank only for `FACTION_DOSSIER_TIER_DELAY_TICKS` (default 20), then propagates to senior, then journeymen
- Major-tier clue: visible to senior+ for delay window, then propagates down
- Minor-tier clue: visible to all members immediately

This means saga clues entering the Adventurer's Guild dossier first land on the Guild Master and elite-rank members — who typically sit at `story_beat` or `shaping` attention tiers. By the time the clue propagates to journeymen (usually `background`), an elite member has likely already converged.

### Channel 5: Compose-a-Clue default targeting

When the player god uses `divine.relay.compose_a_clue` without specifying a recipient agent, the resolver picks the default by:

1. Filter to agents bonded to the player god
2. Filter to agents geographically capable of reaching the target ruin
3. Filter to agents whose sphere alignment matches the ruin's elder-magic alignment (within 1 sphere-distance)
4. Of remaining candidates, pick the highest-attention-tier one
5. Tie-break on portfolio-pin, then on receiver-score from Channel 1

The player god can override the default by explicit selection in the ActionDrawer card. The default is the suggested recipient, surfaced in UI as "→ Kael Thornweaver" with a small "(default)" badge.

### Channel 6: Narrative-gravity quest spawning via Adventurer's Guild

High-magnitude undelved ruins generate Adventurer's Guild quest postings on a tick cadence (`RUIN_QUEST_GENERATION_INTERVAL_TICKS`, default 30):

- Saga ruin → `ag.elite.lost_city` quest, gated to Guild Master + elite rank
- Major ruin → `ag.senior.deep_expedition` quest, gated to senior + elite rank
- Minor ruin → `ag.quest.ruin_delve` or `ag.quest.recover_artifact`, available to all ranks

The existing faction-quest matching system already routes quests to rank-eligible members. This channel just supplies saga-tier postings into the existing queue — no new infrastructure.

### The cascade payoff (the strategic point)

These six channels compound into a self-reinforcing protagonist-promotion engine:

1. **Big actor accumulates clues** (Channels 1, 2, 4, 5, 6 — by virtue of attention tier (`shaping`/`story_beat`), bonded status, faction rank, sphere alignment, geographic placement)
2. **Big actor undertakes saga delves** (because they hold the located clues, and because Adventurer's Guild quest routing puts saga contracts in front of them)
3. **Saga delves apply harsh consequence rolls** (Catastrophic 10% / Scarred 25% / Marked 35% / Triumphant 20% / Transformed 10%)
4. **The Transformed outcome promotes the agent toward ascendant candidacy** (per existing design)
5. **Ascendant candidates gravitate toward `shaping`/`story_beat` tiers and their ascendancy sphere alignment becomes the next saga's preferred recipient**
6. **The portfolio grows through the ruins layer** rather than through worldgen specials or hand-placed NPCs

This is how Threadbearer's protagonist portfolio (Malazan-style) emerges from systemic play instead of authorial hand-placement. It's also why every channel is independently tunable: if playtest shows the bias is too tight (the same 3 agents dominate forever), tune `bondedToPlayerBonus` down. If too loose (sagas keep dying with NPCs), tune `SAGA_CLUE_MIN_TIER` up.

### Worked example: a saga clue's receiver selection

To make the formula concrete, here's how a single saga-tier clue gets routed.

**Setup.** Worldgen has placed a saga ruin (`ruinMagnitude = 0.78`, `sphereAlignment = 'darkness'`, `originCultureId = 'culture.fallen-thanate'`) two hexes from the city of Greythorn. A `library_research` encounter at Greythorn's library produces a clue and asks `produceClueConsequence` to route it.

**Candidate pool** (everyone in geographic eligibility — within 4 hexes of the library):

| Agent | Tier | Bonded? | Portfolio? | Faction rank | Sphere | Backstory tie | Recently received clue? |
|-------|------|---------|------------|--------------|--------|---------------|------------------------|
| Kael Thornweaver | `shaping` | yes | yes | guild senior | spirit | yes (thanate exile) | no |
| Mira Voss | `story_beat` | no | no | guild master | order | no | no |
| Talen the Wry | `background` | yes | no | journeyman | darkness | no | yes (3 ticks ago) |
| Old Berret | `background` | no | no | journeyman | matter | no | no |

**Step 1 — saga floor check.** `ruinMagnitude (0.78) ≥ SAGA_MAGNITUDE_THRESHOLD (0.67)` → enforce `SAGA_CLUE_MIN_TIER = 'shaping'`. Talen and Old Berret are `background` → eliminated. Two candidates remain: Kael, Mira.

**Step 2 — receiverScore for each survivor:**

```
Kael:
  baseTierMultiplier        = CLUE_BIAS_TIER_SHAPING (2.0)
  bondedToPlayerBonus       = +5.0  (yes)
  portfolioPinnedBonus      = +3.0  (yes — gated on prereq)
  factionRankBonus          = +0    (senior, not master/lieutenant)
  sphereAlignmentMatchBonus = +0    (spirit ≠ darkness)
  cultureBackstoryTieBonus  = +3.0  (thanate exile)
  recentCluePenalty         = ×1.0  (none recent)

  receiverScore = 2.0 × (1 + 5.0) × (1 + 3.0) × (1 + 0) × (1 + 0) × (1 + 3.0) × 1.0
                = 2.0 × 6.0 × 4.0 × 1.0 × 1.0 × 4.0
                = 192.0

Mira:
  baseTierMultiplier        = CLUE_BIAS_TIER_STORY_BEAT (4.0)
  bondedToPlayerBonus       = +0    (not bonded)
  portfolioPinnedBonus      = +0
  factionRankBonus          = +2.5  (guild master)
  sphereAlignmentMatchBonus = +0    (order ≠ darkness)
  cultureBackstoryTieBonus  = +0
  recentCluePenalty         = ×1.0

  receiverScore = 4.0 × 1.0 × 1.0 × 3.5 × 1.0 × 1.0 × 1.0
                = 14.0
```

**Step 3 — weighted-random selection.** Top-N = 5; both candidates fit. Kael's weight is `192.0 / (192.0 + 14.0) ≈ 0.93`. Mira's is `≈ 0.07`. Kael wins ~93% of the time but Mira still emerges occasionally — which is the design intent: the bias is strong, not deterministic.

**Step 4 — emit traces.** `ruins.clue_receiver_selected` with the score breakdown above (so playtest tuning can see why a candidate dominated). `ruins.clue_discovered` with `knower=Kael, target=ruin, source='library_research', precision='vague'`.

**What changes the answer.** If Kael had received a clue 3 ticks ago (within `RECEIVER_RECENT_CLUE_WINDOW_TICKS = 5`), his weight would be multiplied by `RECEIVER_RECENT_CLUE_PENALTY = 0.5`, dropping him to ~96 vs Mira's 14 — still ~87% Kael. If portfolio-pinning isn't shipped yet (its prerequisite issue is open), the `portfolioPinnedBonus` term collapses to `+0` and Kael's score drops to 48 vs Mira's 14 → 77/23 split. The bias is robust under partial implementation.

### Failure mode coverage

- **No candidate meets saga tier floor:** clue does not generate; opportunity stays latent on the ruin. Emit `ruins.clue_suppressed_no_eligible_recipient` trace. The ruin remains undelved until a worthy candidate emerges (which the ascendant cascade itself helps with — sagas pull characters into the portfolio).
- **Bias too tight; same agent always wins:** weighted-random selection among scored candidates (not deterministic top-pick) introduces variance. Additional safeguard: `RECEIVER_RECENT_CLUE_PENALTY` (default 0.5) applies a multiplier to agents who already received a clue within the last 5 ticks, smoothing distribution.
- **Worldgen produces no high-magnitude ruins near high-density regions:** the placement bias is soft (0.6 default), so worldgen never blocks; saga ruins simply land in less-trafficked areas, and Channel 6 (quest spawning) compensates by pulling agents toward them via faction quests.

---

## Engine Pillar

### Graph schema additions

**New edge type:**

```typescript
// src/types/secretsFavors.ts (rename to src/types/knowledge.ts in ruins-layer PR)

export type ClueSource =
  | 'library_research'      // Found in a book at a library sublocation
  | 'tavern_rumor'          // Overheard at a tavern hub
  | 'treasure_map'          // Diegetic item — parchment, gloss, mason's-mark
  | 'spy_debrief'           // From spy network (shared with secrets)
  | 'divine_whisper'        // From a god's Compose-a-Clue action
  | 'encounter_outcome'     // Produced as a branch outcome of a reach-gated encounter
  | 'faction_dossier';      // Faction-internal intelligence share

export type CluePrecision = 'vague' | 'narrowed' | 'located';

/** Properties stored on the `knows_clue_of` graph edge (knower → target-ruin). */
export interface KnowsClueOfEdgeProperties {
  /** 0.0 (wisp of rumor) → 1.0 (exact map) */
  magnitude: number;
  precision: CluePrecision;
  source: ClueSource;
  discoveredTick: number;
  /** Set true when the knower initiates a delve at target; edge then pruned */
  consumed: boolean;
  consumedTick?: number;
  /** Human-readable detail generated at discovery time */
  detail?: string;
  /** If this clue was composed by a god, the god's id. Enables divine_mark spillover. */
  composedByGodId?: string;
}
```

**Extended node subtypes:**

```typescript
// src/types/index.ts — extend existing LocationSubtype union
// (NB: 'ruins', 'ruined_tower', 'ruined_city', 'ruined_village' already exist as
// decorative/hex-subtype variants. We use 'elder_ruin' as the new *systemic*
// subtype that participates in the ruins layer — clues, delves, transformation —
// so there's no name collision with the existing cosmetic ruins subtypes.)

type LocationSubtype =
  | /* existing 50+ subtypes including 'ruins', 'ruined_tower', 'ruined_city', 'ruined_village', 'ancient_vault', ... */
  | 'elder_ruin'      // new — a systemic ruin pending delve (distinct from cosmetic 'ruins')
  | 'place_of_power'  // new — a transformed elder_ruin, permanent
  ;
```

**Sublocation schema:** sublocations are not a typed union — they carry a free-string `sublocationTypeId` property (per `src/types/sublocation.ts`). The Scar is a registered sublocation type:

```typescript
// Registered in the existing sublocation type registry:
sublocationTypeId: 'ruins.scar'  // consumed-delve narrative marker
```

When we need to identify Scars in engine code, we match on the `sublocationTypeId` string, not a compile-time subtype literal. This matches the existing pattern (e.g. `sublocation.temple-quarter`, `sublocation.war-camp`).

**New node properties:**

`elder_ruin`-subtype locations carry:

```typescript
interface RuinProperties {
  ruinMagnitude: number;         // 0.0 low → 1.0 lost-culture capital; drives delve scale
  sphereAlignment: SphereName;   // The elder-magic alignment — drives chamber archetype
  originCultureId: string;       // Which historical-culture's territory this belongs to
  delveScale: 'minor' | 'major' | 'saga';  // Derived from magnitude at worldgen
  ageState: 'living' | 'dormant' | 'lost'; // v1 always 'lost' for ruins
  discovered: boolean;            // True once first clue has been consumed at this site
  undelved: boolean;              // True until a delve terminates here
}
```

PlaceOfPower-subtype locations carry:

```typescript
interface PlaceOfPowerProperties {
  sphereAlignment: SphereName;
  essencePerTick: number;          // 1–3 sphere-aligned essence per tick
  holderId: string | null;         // Actor or faction currently holding; null = unclaimed
  holderType: 'actor' | 'faction' | 'god' | null;
  lastHolderPresenceTick: number;  // Tracks decay: if holder not present at hex, stream decays
  streamDecayCountdown: number;    // Ticks remaining before stream dries up (reset on presence)
  transformedFromRuinId: string;   // Provenance — which ruin this was before
  emergenceOutcome: 'let' | 'claim' | 'bargain' | 'corrupt'; // Which Emergence Dilemma path ran
}
```

### New tick phases

Insert into the tick loop after `phaseEncounterResolution`, before `phaseAftermath`:

1. **`phaseDelveAdmission`** — when an agent with a `precision: 'located'` clue enters the ruin's hex, evaluate scale caps. Admit if capacity available; else queue with `admissionBlockedReason: 'saga_active' | 'major_cap' | 'minor_cap'` and emit a soft-block trace. Queued delves retry each tick until admitted or until their `admissionExpires` tick passes.
2. **`phaseDelveProgression`** — for each active delve, advance the 5-tick arc by one beat. Fire the beat's prose resolver, capture any intervention input from `GameState.pendingDivineActions`, resolve the beat's outcome, write to delve state.
3. **`phaseDelveEmergence`** — for each delve reaching beat 5, run the consequence roll and the Emergence Dilemma resolver. Transform the ruin (prune → Scar or promote → PlaceOfPower). Fire elder-essence reward. Emit `DelveTerminatedTrace`.
4. **`phasePlaceOfPowerStreams`** — for each PlaceOfPower, check holder presence on the hex. If present, credit `essencePerTick` to holder; reset `streamDecayCountdown`. If absent, decrement countdown; when zero, set `holderId: null`. Emit `PlaceOfPowerStreamTrace`.
5. **`phaseClueDecay`** — scan `knows_clue_of` edges. Prune edges where `now - discoveredTick > CLUE_MAX_AGE_TICKS[precision]`. Emit `ClueDecayTrace`. Precision bands have different TTLs (vague = 20 ticks, narrowed = 40, located = 80).

### New consequence functions

**`produceClueConsequence`** — called from encounter outcome processing when a branch's outcome includes clue acquisition. **Receiver selection runs the Narrative Gravity weighting (see section above) — this function does not assume the caller has already picked the recipient.**

```typescript
produceClueConsequence({
  // Candidate pool — function picks the receiver from this set via Narrative Gravity scoring
  candidatePool: (AgentId | FactionId)[],
  targetRuinId: string,
  source: ClueSource,
  magnitude: number,
  precision: CluePrecision,
  detail: string,
  composedByGodId?: string,
})
// 1. If ruinMagnitude >= SAGA_MAGNITUDE_THRESHOLD, filter candidates to those
//    meeting SAGA_CLUE_MIN_TIER. If pool empties, emit clue_suppressed trace and return.
// 2. Score remaining candidates via receiverScore formula (Channel 1 in Narrative Gravity).
// 3. Weighted-random selection among top N candidates.
// 4. Create knows_clue_of edge on selected knower.
// 5. Emit ClueDiscoveredTrace.
// 6. If composedByGodId set, create knows_secret_of edge with SecretType 'divine_mark'.
```

**`selectClueRecipient`** — helper exposed for testing and for Compose-a-Clue's default targeting:

```typescript
selectClueRecipient({
  candidatePool: AgentId[],
  ruin: RuinProperties,
  playerGodId: string,
  rng: () => number,
}): AgentId | null
// Pure function. Returns null if no candidate meets magnitude-tier floor.
// Applies full Narrative Gravity weighting + recent-clue-penalty.
// Deterministic given same RNG seed — reproducible for test/replay.
```

**`consumeCluesOnConvergence`** — called at delve admission:

```typescript
consumeCluesOnConvergence(ruinId: string)
// Iterates all knows_clue_of edges targeting ruinId.
// For each: set consumed=true, mark consumedTick, prune edge, and add
// a knows_of familiarity edge from the same knower to the ruin.
// Emits ClueConsumedTrace per clue.
```

**`transformRuinConsequence`** — called at delve emergence:

```typescript
transformRuinConsequence({
  ruinId: string,
  outcome: 'consumed' | 'transformed',
  delveId: string,
  emergenceChoice: 'let' | 'claim' | 'bargain' | 'corrupt',
})
// If 'consumed': prune ruin location; spawn Scar sublocation on its hex.
// If 'transformed': promote ruin to PlaceOfPower location; seed holder edge.
// Fire elder-essence reward via elderEssenceReward.ts.
// Emit RuinTransformedTrace.
```

**`applyDelveConsequenceRoll`** — called at delve emergence for the agent:

```typescript
applyDelveConsequenceRoll({
  agentId: string,
  delveScale: 'minor' | 'major' | 'saga',
  ruinMagnitude: number,
})
// Rolls against consequence table. Applies one of:
//   - Catastrophic: kill agent, record death cause
//   - Scarred: attach permanent Scarred condition (sphere-specific variants)
//   - Marked: attach Marked attachment with capability + liability
//   - Triumphant: grant artifact item, no penalty
//   - Transformed: promote agent toward ascendant candidacy
// Emits DelveConsequenceTrace.
```

### New divine actions — Perceive family

Player (and rival gods, once rival gods exist) target a hex, not an agent. Gates: awareness of the hex (via existing `narrativeLayer: 'land' | 'soul' | 'people' | 'ruins'` fog system), sufficient essence, bonded-agent-proximity requirement for most (agent-adjacency-gated).

| Action ID | Sphere cost | Agent adjacency? | Produces |
|-----------|-------------|------------------|----------|
| `divine.perceive.cast_attention` | 1 Spirit | Required | Vague clue at hex if any undelved ruin exists |
| `divine.perceive.refine_the_hush` | 2 Spirit + 1 Time | Required | Upgrades a vague clue → narrowed |
| `divine.perceive.listen_for_a_name` | 1 Mind + 1 Star-adjacent | Required | Reveals originCultureId of ruin, unlocks culture-specific prose |
| `divine.perceive.read_the_threads` | 1 Mind + 1 Time | Not required | Reveals existence of Place of Power at hex (vague clue targeting PoP, not ruin) |
| `divine.perceive.taste_the_wake` | 2 Time + 1 Spirit | Required | Reveals divine_mark secrets on agents at hex — discovers rival god's recent activity |

All produce `ClueDiscoveredTrace` with `source: 'divine_whisper'` and `composedByGodId: <actingGodId>`. The composedByGodId field is what triggers `divine_mark` spillover when the clue is consumed — rival gods who run `taste_the_wake` on that hex later can discover who was here.

### New divine actions — Relay family

| Action ID | Sphere cost | Target | Produces |
|-----------|-------------|--------|----------|
| `divine.relay.compose_a_clue` | 1 Mind + 1 sphere-of-anomaly | Bonded agent | Creates `knows_clue_of` edge on the agent pointing at a ruin the god already knows about |
| `divine.relay.whisper_the_direction` | 1 Spirit | Bonded agent | One-time pathing nudge — adjusts the agent's next-tick move target toward the ruin hex, without creating a clue edge |

Compose-a-Clue is the peer of THR-30's Plant-Secret — both fabricate a knowledge edge; both cost essence; both create a `divine_mark` SecretType edge on the receiving agent that rival gods can discover.

### New divine actions — Emergence Dilemma family

Fired only at beat 5 of a delve, as a mandatory player decision gate. The delve pauses until the player selects one (or a default fires after `EMERGENCE_DECISION_TIMEOUT_TICKS`):

| Action ID | Sphere cost | Effect |
|-----------|-------------|--------|
| `divine.emergence.let` | 0 | Agent keeps delve outcome. No essence stream to god. Trust + loyalty gain on agent. |
| `divine.emergence.claim` | Proportional to ruinMagnitude | God becomes holder of PlaceOfPower. Agent loses artifact; trust penalty. Cost: `ruinMagnitude * 20` essence. |
| `divine.emergence.bargain` | 0 at Emergence; future `owes_favor` from god to agent | Agent keeps outcome; god gains `owes_favor` edge (god = debtor, agent = creditor) via THR-30. Agent can later call in favor. |
| `divine.emergence.corrupt` | 4 essence up front | Agent keeps outcome; god receives 33% of the stream passively. Creates `divine_mark` secret on agent. Rival gods can discover via Perceive. |

### Trace categories

Add to `TRACE_CATEGORIES`:

- `ruins.clue_discovered` — A clue edge was created
- `ruins.clue_consumed` — A clue was converged and pruned
- `ruins.clue_decayed` — A clue TTL'd out
- `ruins.delve_admitted` — A delve passed admission gate
- `ruins.delve_blocked` — A delve was soft-blocked by scale cap
- `ruins.delve_beat` — A delve advanced one beat (per-beat trace with prose summary)
- `ruins.delve_emergence` — Emergence Dilemma resolved
- `ruins.delve_consequence` — Agent consequence roll applied
- `ruins.ruin_transformed` — Ruin state transition (consumed or transformed)
- `ruins.pop_stream` — PlaceOfPower emitted essence this tick
- `ruins.pop_holder_changed` — PlaceOfPower gained/lost/changed holder
- `ruins.pop_stream_decayed` — Stream dried up due to holder absence
- `ruins.divine_mark_composed` — A god's action left a divine_mark edge
- `ruins.divine_mark_discovered` — A rival god's Perceive surfaced a divine_mark
- `ruins.clue_suppressed_no_eligible_recipient` — Saga clue did not generate because no candidate met the tier floor
- `ruins.clue_receiver_selected` — A clue was routed to a recipient via Narrative Gravity weighting (with score breakdown per channel)

### TypeScript interface definitions for traces

```typescript
interface ClueDiscoveredTrace {
  category: 'ruins.clue_discovered';
  tick: number;
  knowerId: string;
  targetRuinId: string;
  source: ClueSource;
  precision: CluePrecision;
  magnitude: number;
  composedByGodId?: string;
}

interface DelveEmergenceTrace {
  category: 'ruins.delve_emergence';
  tick: number;
  delveId: string;
  agentId: string;
  ruinId: string;
  emergenceChoice: 'let' | 'claim' | 'bargain' | 'corrupt';
  consequenceRoll: 'catastrophic' | 'scarred' | 'marked' | 'triumphant' | 'transformed';
  essenceCredited: number;
  newPlaceOfPowerId?: string;
  newScarId?: string;
}

interface PlaceOfPowerStreamTrace {
  category: 'ruins.pop_stream';
  tick: number;
  popId: string;
  holderId: string | null;
  essenceCredited: number;
  streamDecayCountdown: number;
}
```

```typescript
interface ClueConsumedTrace {
  category: 'ruins.clue_consumed';
  tick: number;
  knowerId: string;
  targetRuinId: string;
  delveId: string;
  sourceAtDiscovery: ClueSource;
  ticksHeld: number;
}

interface ClueDecayedTrace {
  category: 'ruins.clue_decayed';
  tick: number;
  knowerId: string;
  targetRuinId: string;
  precisionAtDecay: CluePrecision;
  reason: 'ttl_expired' | 'target_transformed' | 'knower_died';
}

interface DelveAdmittedTrace {
  category: 'ruins.delve_admitted';
  tick: number;
  delveId: string;
  agentId: string;
  ruinId: string;
  delveScale: 'minor' | 'major' | 'saga';
  concurrentCountsAtAdmission: { saga: number; major: number; minor: number };
}

interface DelveBlockedTrace {
  category: 'ruins.delve_blocked';
  tick: number;
  agentId: string;
  ruinId: string;
  delveScale: 'minor' | 'major' | 'saga';
  admissionBlockedReason: 'saga_active' | 'major_cap' | 'minor_cap';
  queuePosition: number;
  admissionExpires: number;
}

interface DelveBeatTrace {
  category: 'ruins.delve_beat';
  tick: number;
  delveId: string;
  agentId: string;
  ruinId: string;
  beatIndex: number; // 1..5 for major/saga; 1..2 for minor
  beatName: string;
  beatOutcome: 'advanced' | 'stalled' | 'intervened';
  poetProseSnippet: string;
  witnessFacts: string[];
}

interface DelveConsequenceTrace {
  category: 'ruins.delve_consequence';
  tick: number;
  delveId: string;
  agentId: string;
  ruinId: string;
  roll: 'catastrophic' | 'scarred' | 'marked' | 'triumphant' | 'transformed';
  rollValue: number; // 0..1 — the RNG draw
  conditionAttached?: string;
  attachmentGranted?: string;
  artifactGranted?: string;
}

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

interface PlaceOfPowerHolderChangedTrace {
  category: 'ruins.pop_holder_changed';
  tick: number;
  popId: string;
  previousHolderId: string | null;
  newHolderId: string | null;
  holderType: 'actor' | 'faction' | 'god' | null;
  reason: 'emergence' | 'claim_action' | 'presence_resumed' | 'holder_died';
}

interface PlaceOfPowerStreamDecayedTrace {
  category: 'ruins.pop_stream_decayed';
  tick: number;
  popId: string;
  lastHolderId: string;
  absenceDurationTicks: number;
}

interface DivineMarkComposedTrace {
  category: 'ruins.divine_mark_composed';
  tick: number;
  godId: string;
  subjectAgentId: string;
  viaAction: string; // e.g. 'divine.relay.compose_a_clue'
  secretEdgeId: string;
}

interface DivineMarkDiscoveredTrace {
  category: 'ruins.divine_mark_discovered';
  tick: number;
  discoveringGodId: string;
  discoveredMarkGodId: string;
  subjectAgentId: string;
  viaAction: string; // e.g. 'divine.perceive.taste_the_wake'
}

interface ClueSuppressedNoEligibleRecipientTrace {
  category: 'ruins.clue_suppressed_no_eligible_recipient';
  tick: number;
  targetRuinId: string;
  ruinMagnitude: number;
  requiredMinTier: AttentionTier;
  candidatePoolSize: number;
  candidatesByTier: Record<AttentionTier, number>;
}

interface ClueReceiverSelectedTrace {
  category: 'ruins.clue_receiver_selected';
  tick: number;
  selectedKnowerId: string;
  targetRuinId: string;
  candidatePoolSize: number;
  scoreBreakdown: {
    knowerId: string;
    baseTierMultiplier: number;
    bondedBonus: number;
    portfolioBonus: number;
    factionRankBonus: number;
    sphereAlignmentMatchBonus: number;
    cultureBackstoryTieBonus: number;
    recentCluePenalty: number;
    finalScore: number;
  }[];
  weightedRandomSeed: string;
}
```

Note: trace types use the existing `emitTrace` machinery and must be registered in `src/types/trace.ts` `TRACE_CATEGORIES` array. The category names above (`ruins.*` namespace) need to be added before any ruins-layer code lands — this is Step 0 of PR 1.

---

## Content Pillar

### Ruin magnitude → delve scale mapping

Worldgen assigns `ruinMagnitude ∈ [0, 1]` at seed time based on the originating historical culture's weight (capital sites → high magnitude, peripheral shrines → low):

| `ruinMagnitude` range | `delveScale` | Arc length | Consequence severity | Typical outcome |
|-----------------------|--------------|------------|---------------------|-----------------|
| 0.0 – 0.33 | `minor` | 2 ticks (compressed) | Low — Triumphant/Marked dominant | 0.5 essence/tick if transformed |
| 0.34 – 0.66 | `major` | 5 ticks (full arc) | Medium — Scarred/Marked dominant | 1–2 essence/tick if transformed |
| 0.67 – 1.0 | `saga` | 5 ticks (with extended beats) | High — Catastrophic/Transformed dominant | 2–3 essence/tick if transformed |

### Chamber archetypes (delve flavor)

Each delve's Interior beat (beat 3) uses a chamber archetype derived from the ruin's `sphereAlignment`:

| Chamber type | Spheres | Challenge nature | Typical reward-on-success |
|--------------|---------|------------------|--------------------------|
| **Revelation chamber** | Eye / Star / Veil | Perceptual — see-through-illusion, read-forgotten-script, face-a-mirror | Knowledge artifact, prophetic mark |
| **Warding chamber** | Iron / Shadow / Flesh | Physical/endurance — fight, evade, endure | Weapon-artifact, resilience mark |
| **Bargain chamber** | Heart / Veil / Gold | Social/moral — negotiate with shade, refuse a tempting trade, accept a cost | Relational artifact, binding mark |

Content authors populate prose tables per `sphereAlignment × beatNumber`. Initial v1 content budget: 3 prose variants per (sphere × beat) = 9 spheres × 5 beats × 3 variants = 135 prose snippets. Reuses the existing prose-pipeline resolver infrastructure; no new resolver class needed.

### Clue provenance prose library

v1 content budget:

- **Library research** (`library_research`): 20 snippets, 4 precision tiers each
- **Tavern rumor** (`tavern_rumor`): 20 snippets
- **Treasure map** (`treasure_map`): 15 item-flavor snippets (trash map, glossed tome, mason's-mark walking stick, carved bone, sailor's charm, etc.)
- **Spy debrief** (`spy_debrief`): reuses THR-30's Spy Debrief template prose, extended with clue-branch
- **Divine whisper** (`divine_whisper`): 15 snippets per sphere alignment = 135 snippets
- **Encounter outcome** (`encounter_outcome`): 6 snippets per existing THR-30 discovery template × 6 templates = 36 snippets
- **Faction dossier** (`faction_dossier`): 10 snippets per faction type (v1 = Adventurer's Guild only) = 10 snippets

Total new clue-prose content: ~260 snippets. Mid-sized content authoring sprint.

### Encounter template extensions

For each of the six THR-30 discovery templates, add a `clue_branch` outcome that fires when the observed/debriefed/overheard agent is ruin-adjacent (within 2 hexes of an undelved ruin, or carrying a ruin-related item). The branch produces a `knows_clue_of` edge instead of `knows_secret_of`.

New ruin-specific encounter templates (v1):

| Template ID | Trigger | Reach | Produces |
|-------------|---------|-------|----------|
| `ruins.trash_map_in_pack` | Looting a dead NPC's corpse | Shadow | Treasure-map clue, vague precision |
| `ruins.glossed_tome` | Reading time at a library sublocation | Eye | Library-research clue, narrowed precision |
| `ruins.masons_mark` | Examining a mason's walking-stick artifact | Eye + Stone | Treasure-map clue, narrowed precision |
| `ruins.drunk_cartographer` | Hanging out at tavern hub | Heart + Eye | Tavern-rumor clue, random precision |

### Adventurer's Guild hooks populated

The existing `ADVENTURING_GUILD_DEFINITION` reserves quest template IDs that the ruins layer populates:

- `ag.quest.ruin_delve` — guild posts a minor delve contract on a `knows_clue_of` target the guild holds
- `ag.quest.recover_artifact` — guild requests recovery of a specific artifact from a named ruin (narrowed clue)
- `ag.senior.deep_expedition` — guild sponsors a major delve; multi-agent-ready for v2 party delves
- `ag.elite.lost_city` — guild pursues a saga delve; reserved for lost-culture capitals

Guild members acquire clue edges through guild-internal dossier sharing (implemented via `faction_dossier` source) — the guild's collective knowledge propagates to members who meet the guild's rank gate.

Internal sub-faction emphasis (for v1 reach-weight tension):
- **Mercenaries sub-faction** — Iron/Flesh-biased; picks up Warding-chamber contracts
- **Scholars sub-faction** — Eye/Star-biased; picks up Revelation-chamber contracts
- **Collectors sub-faction** — Heart/Gold-biased; picks up Bargain-chamber contracts

Represented in v1 as agent `subfaction` property, not separate faction nodes.

### Emergence prose templates

Dual-voice chronicle pattern applies to every Emergence prose (see UI Pillar for typography specifics). Content authoring budget:

| Emergence choice | Prose-voice snippets per sphere | Total |
|------------------|--------------------------------|-------|
| Let | 3 per sphere × 9 spheres | 27 |
| Claim | 3 per sphere × 9 spheres | 27 |
| Bargain | 3 per sphere × 9 spheres | 27 |
| Corrupt | 3 per sphere × 9 spheres | 27 |

Total Emergence prose: 108 snippets (Poet's Voice) + 108 matching Witness's Voice explanations = 216 snippets.

---

## UI Pillar

### Dual-voice chronicle pattern (general — ruins layer is first consumer)

Every delve-beat chronicle entry uses two visually distinct paragraphs:

**Poet's Voice** (top)
- Font: display serif (use existing `font-display` class)
- Style: italic, slightly larger than body, muted-earth tone
- Role: emotional / narrative — the experiential surface
- Length: 1–3 sentences

**Witness's Voice** (bottom)
- Font: sans-serif body (use existing `font-body` class)
- Style: regular weight, smaller, neutral-ink tone, rendered as a bulleted list when multiple mechanical facts apply
- Role: mechanical / expositional — what changed in the game state, what the player can do next
- Length: 1–4 bullets

Implementation: extend `ChronicleEntry` with `poetProse: string` and `witnessFacts: string[]`. Update `ChronicleEntryCard` component to render both paragraphs with the correct typographic differentiation. All future chronicle producers should use this shape; existing single-voice chronicle entries are progressively migrated.

### HexMapV2 signifiers

New signifier layer additions:

| Signifier | Target | Visual | When shown |
|-----------|--------|--------|------------|
| Ruin marker | `elder_ruin`-subtype locations | Partial-ring silhouette, sphere-colored, low-opacity until discovered | Always once `ruins` narrative layer revealed; higher opacity when a clue points at it |
| Delve-in-progress ring | Ruin during active delve | Pulsing ring with beat-index dots (1/5, 2/5, etc.) | During delve only |
| Place of Power crown | PlaceOfPower location | Full ring with sphere-colored glow | Always once transformed |
| Scar grave-marker | Scar sublocation | Small cross-hatch mark on hex | Always |
| Essence-stream trail | Between PlaceOfPower and holder agent | Faint sphere-colored particle trail | When holder present on hex, passive |

### Modals / panels

**Delve Progress Panel** — opens when a bonded agent is participating in an active delve. Shows:
- Current beat number + beat name
- Poet/Witness chronicle for the most recent beat
- Available divine actions (Whisper-the-Direction, Refine-the-Hush, sphere-specific Perceive)
- Countdown to next beat resolution

**Emergence Dilemma Modal** — blocking modal that opens at beat 5. Presents the four choices (Let / Claim / Bargain / Corrupt) with:
- Per-choice Poet/Witness prose preview
- Essence cost and consequence summary
- Trust/faction-standing impact hints
- Default selection highlighted after `EMERGENCE_DECISION_HINT_TICKS` (auto-fires after `EMERGENCE_DECISION_TIMEOUT_TICKS`)

**Clue Journal Panel** — new tab in the existing player info surface. Lists all clues held by bonded agents + god's own clues (from Perceive actions), organized by target hex. Supports filter-by-sphere and sort-by-precision.

**Place of Power Inspector** — extends location-detail panel for `'place_of_power'` LocationSubtype. Shows:
- Current holder + stream rate
- Decay countdown if holder absent
- Essence-history sparkline (last 20 ticks)
- Rival-god presence indicators (if a rival's Perceive has surfaced this PoP)

### DebugPanel tabs

Add a **Ruins** tab to the existing DebugPanel:
- List all ruins with magnitude, scale, discovery state, clue count
- List all active delves with beat progress and participant
- List all Places of Power with holder, essence rate, decay state
- Force-trigger buttons: `Spawn clue`, `Force delve admission`, `Force emergence choice`

### Player controls

All new divine actions (Perceive / Relay / Emergence Dilemma) register in the ActionDrawer via the existing unified-action template system. No new action-surface UI needed; they appear as sphere-filtered cards when the god targets a hex or bonded agent.

---

## Wiring Section

For every module, map to its integration point. Reference `Docs/plans/wiring-checklist.md`; update that checklist as part of implementation.

| Module | Orchestrator phase | UI component | GameState field | Trace category | Debug visibility |
|--------|-------------------|--------------|-----------------|---------------|------------------|
| Clue edge creation | `phaseEncounterResolution` (consequence hooks) | ChronicleEntryCard (Poet/Witness) | `state.graph` edges | `ruins.clue_discovered` | DebugPanel Ruins tab |
| Clue decay | `phaseClueDecay` (new) | — | `state.graph` edges | `ruins.clue_decayed` | DebugPanel Ruins tab |
| Delve admission | `phaseDelveAdmission` (new) | ChronicleEntryCard (soft-block prose) | `state.delves`, `state.delveAdmissionQueue` | `ruins.delve_admitted` / `ruins.delve_blocked` | DebugPanel Ruins tab |
| Delve progression | `phaseDelveProgression` (new) | DelveProgressPanel | `state.delves[id].currentBeat` | `ruins.delve_beat` | DebugPanel Ruins tab |
| Emergence dilemma | `phaseDelveEmergence` (new) | EmergenceDilemmaModal | `state.pendingEmergenceDecision` | `ruins.delve_emergence` | DebugPanel Ruins tab |
| Ruin transformation | `phaseDelveEmergence` (new) | HexMapV2 signifier swap (Ruin → PoP or Scar) | `state.graph` mutations | `ruins.ruin_transformed` | DebugPanel Ruins tab |
| PoP stream | `phasePlaceOfPowerStreams` (new) | EssenceTicker | `state.essence`, `state.graph.placeOfPower.streamDecayCountdown` | `ruins.pop_stream` | DebugPanel Ruins tab |
| Perceive actions | existing `phaseDivineActions` | ActionDrawer cards | `state.pendingDivineActions` | `ruins.clue_discovered` (with source=divine_whisper) | existing divine-action debug |
| Relay actions | existing `phaseDivineActions` | ActionDrawer cards | `state.pendingDivineActions` | `ruins.clue_discovered` + `ruins.divine_mark_composed` | existing divine-action debug |
| Prose enrichment | existing prose pipeline | ChronicleEntryCard, DelveProgressPanel | — | — | existing prose-trace debug |

Explicitly verifies: the ruins layer uses `enrichProse()` for every player-facing string. No hardcoded template strings.

---

## Constants Table (NFP #1 — Tunability)

| Constant | Default | Purpose |
|----------|---------|---------|
| `CLUE_MAX_AGE_TICKS_VAGUE` | 20 | TTL for vague-precision clues |
| `CLUE_MAX_AGE_TICKS_NARROWED` | 40 | TTL for narrowed-precision clues |
| `CLUE_MAX_AGE_TICKS_LOCATED` | 80 | TTL for located-precision clues |
| `CLUE_DECAY_CHECK_INTERVAL` | 10 | Ticks between clue-decay sweeps |
| `MAX_SAGA_DELVES_CONCURRENT` | 1 | Global saga-delve cap |
| `MAX_MAJOR_DELVES_CONCURRENT` | 2 | Global major-delve cap (blocked during saga) |
| `MAX_MINOR_DELVES_CONCURRENT` | 3 | Global minor-delve cap |
| `DELVE_ADMISSION_RETRY_INTERVAL` | 5 | Ticks between admission retries for queued delves |
| `DELVE_ADMISSION_EXPIRY_TICKS` | 40 | Max ticks a delve can sit queued before abandonment |
| `DELVE_BEAT_DURATION_MINOR` | 1 | Ticks per beat for minor delves (2 beats, compressed) |
| `DELVE_BEAT_DURATION_MAJOR` | 1 | Ticks per beat for major delves (5 beats) |
| `DELVE_BEAT_DURATION_SAGA` | 2 | Ticks per beat for saga delves (5 beats, extended) |
| `EMERGENCE_DECISION_HINT_TICKS` | 3 | Ticks before default choice is highlighted |
| `EMERGENCE_DECISION_TIMEOUT_TICKS` | 8 | Ticks before default auto-fires |
| `DELVE_CONSEQUENCE_CATASTROPHIC_WEIGHT` | 0.10 | Weight for Catastrophic roll |
| `DELVE_CONSEQUENCE_SCARRED_WEIGHT` | 0.25 | Weight for Scarred roll |
| `DELVE_CONSEQUENCE_MARKED_WEIGHT` | 0.35 | Weight for Marked roll |
| `DELVE_CONSEQUENCE_TRIUMPHANT_WEIGHT` | 0.20 | Weight for Triumphant roll |
| `DELVE_CONSEQUENCE_TRANSFORMED_WEIGHT` | 0.10 | Weight for Transformed roll |
| `POP_ESSENCE_PER_TICK_MIN` | 1 | Minimum essence-per-tick from a PlaceOfPower |
| `POP_ESSENCE_PER_TICK_MAX` | 3 | Maximum essence-per-tick from a PlaceOfPower |
| `POP_STREAM_DECAY_WINDOW_TICKS` | 10 | Ticks holder can be absent before stream dies |
| `POP_CLAIM_COST_MULTIPLIER` | 20 | `ruinMagnitude * 20` = claim essence cost |
| `POP_CORRUPT_UP_FRONT_COST` | 4 | Essence cost for Corrupt choice |
| `POP_CORRUPT_SIPHON_FRACTION` | 0.33 | Fraction of stream god receives under Corrupt |
| `RUIN_DENSITY_WILDERNESS` | 0.15 | Per-hex probability multiplier for wilderness hexes in culture territory |
| `RUIN_DENSITY_SETTLEMENT` | 0.10 | Per-hex probability for settlement hexes |
| `RUIN_DENSITY_CAPITAL` | 0.35 | Per-hex probability for capital/dense-settlement hexes |
| `RUIN_MAX_PER_HEX_STANDARD` | 1 | Max ruins per non-capital hex |
| `RUIN_MAX_PER_HEX_CAPITAL` | 3 | Max ruins per capital hex |
| `RUIN_MAGNITUDE_MINOR_MAX` | 0.33 | Upper bound for minor-scale ruins |
| `RUIN_MAGNITUDE_MAJOR_MAX` | 0.66 | Upper bound for major-scale ruins |
| `RUIN_SAGA_CAPITAL_BIAS` | 0.4 | Additional magnitude weight for capital-origin ruins |
| `PERCEIVE_CAST_ATTENTION_COST` | 1 | Spirit essence cost |
| `PERCEIVE_REFINE_HUSH_COST_SPIRIT` | 2 | Spirit component of Refine the Hush |
| `PERCEIVE_REFINE_HUSH_COST_TIME` | 1 | Time component of Refine the Hush |
| `PERCEIVE_LISTEN_NAME_COST_MIND` | 1 | Mind component of Listen for a Name |
| `PERCEIVE_LISTEN_NAME_COST_STAR` | 1 | Star-adjacent component of Listen for a Name |
| `PERCEIVE_READ_THREADS_COST_MIND` | 1 | Mind component of Read the Threads |
| `PERCEIVE_READ_THREADS_COST_TIME` | 1 | Time component of Read the Threads |
| `PERCEIVE_TASTE_WAKE_COST_TIME` | 2 | Time component of Taste the Wake |
| `PERCEIVE_TASTE_WAKE_COST_SPIRIT` | 1 | Spirit component of Taste the Wake |
| `RELAY_COMPOSE_CLUE_COST_MIND` | 1 | Mind component of Compose a Clue |
| `RELAY_COMPOSE_CLUE_COST_SPHERE` | 1 | Sphere-of-anomaly component of Compose a Clue |
| `RELAY_WHISPER_DIRECTION_COST` | 1 | Spirit essence cost for Whisper the Direction |
| `SAGA_MAGNITUDE_THRESHOLD` | 0.67 | `ruinMagnitude` at which saga-tier rules apply |
| `SAGA_CLUE_MIN_TIER` | `'shaping'` | Minimum `AttentionTier` that can receive a saga clue (per `src/types/attention.ts`) |
| `CLUE_BIAS_BONDED_AGENT` | 5.0 | Additive bonus to receiverScore for player-god-bonded agents |
| `CLUE_BIAS_PORTFOLIO_PINNED` | 3.0 | Additive bonus for portfolio-pinned agents (gated on portfolio-pinning prerequisite) |
| `CLUE_BIAS_FACTION_LEADER` | 2.5 | Additive bonus for guild masters / lieutenants / ascendants |
| `CLUE_BIAS_TIER_STORY_BEAT` | 4.0 | Base multiplier for `'story_beat'` tier agents |
| `CLUE_BIAS_TIER_SHAPING` | 2.0 | Base multiplier for `'shaping'` tier agents |
| `CLUE_BIAS_TIER_BACKGROUND` | 1.0 | Base multiplier for `'background'` tier agents |
| `CLUE_BIAS_SPHERE_MATCH` | 1.5 | Additive bonus when agent's sphere matches ruin's |
| `CLUE_BIAS_CULTURE_BACKSTORY_TIE` | 3.0 | Additive bonus when agent's backstory-stratum ties to originating culture |
| `RECEIVER_RECENT_CLUE_PENALTY` | 0.5 | Multiplier for agents who received a clue within last 5 ticks |
| `RECEIVER_RECENT_CLUE_WINDOW_TICKS` | 5 | Window for the recent-clue penalty |
| `SAGA_RUIN_WORLDGEN_HIGH_DENSITY_BIAS` | 0.6 | Probability saga ruins place near high-density regions |
| `SAGA_RUIN_PROXIMITY_HEXES` | 3 | Max hex distance from high-density region for biased placement |
| `FACTION_DOSSIER_TIER_DELAY_TICKS` | 20 | Delay before saga/major clues propagate from elite to lower ranks |
| `RUIN_QUEST_GENERATION_INTERVAL_TICKS` | 30 | Cadence for faction quest postings from undelved ruins |
| `WEIGHTED_SELECTION_TOP_N` | 5 | Top N candidates considered in weighted-random receiver selection |

Total new tunable constants: 56. All live in a new `src/constants/ruinsLayer.ts` (or extend `src/types/secretsFavors.ts` → renamed `src/types/knowledge.ts`).

---

## Fail-Soft Table (NFP #4)

| Failure case | Fallback behavior |
|--------------|-------------------|
| Clue edge targets a ruin that was already transformed | Prune clue silently on next decay sweep; emit `ruins.clue_decayed` with reason `target_transformed` |
| Delve admission queue overflows | Oldest queued entries drop with `admission_expired` trace; no crash |
| Agent enters ruin hex with no located clue | Delve does not initiate; no admission gate triggered; existing `narrativeLayer: 'ruins'` fog reveal still applies |
| Emergence Dilemma timeout with no player input | Default to `Let` (safest outcome for agent); emit `ruins.delve_emergence` with `emergenceChoice: 'let'` and flag `autoResolved: true` |
| PlaceOfPower holder dies mid-stream-tick | Holder edge pruned; stream decay begins next tick; no essence credited this tick |
| Ruin magnitude property missing on an `elder_ruin`-subtype location | Default to 0.5 (median); emit warning trace `ruins.schema_drift` |
| Perceive action on a hex with no revealed `ruins` layer | Action succeeds but produces no clue; emit `ruins.clue_discovered` with `precision: 'vague'` and empty target (records the spend) |
| Prose resolver can't find entry for (sphere × beat) | Fall back to generic `ruins.beat.<n>.fallback` prose; emit `prose.fallback` trace |
| Worldgen produces 0 ruins (extreme seed) | Accept; game proceeds without ruins layer active; Perceive actions remain callable but always produce empty-target clues |
| Scale cap check races two admissions in same tick | Deterministic ordering by (agent ID lexicographic ascending); loser queued |
| Saga clue has no candidate meeting tier floor | Clue does not generate; emit `ruins.clue_suppressed_no_eligible_recipient`; ruin remains undelved until eligible candidate emerges |
| Narrative Gravity bias too tight (one agent monopolizes clues) | Weighted-random over top N candidates + `RECEIVER_RECENT_CLUE_PENALTY` smooths distribution; tunable via constants if playtest reveals issues |
| Compose-a-Clue called with no bonded agents | Action fails gracefully; player receives "no agent eligible to receive this clue" feedback; essence not consumed |

---

## NFP Compliance Summary

| NFP | Status | Notes |
|-----|--------|-------|
| #1 Tunability | PASS | 56 named constants in `src/constants/ruinsLayer.ts` |
| #2 Inspectability | PASS | 16 new trace categories with TypeScript interface definitions (see Engine Pillar → Trace interface definitions); DebugPanel Ruins tab; receiver-selected trace surfaces the Narrative Gravity score breakdown per channel for tunability |
| #3 Determinism | PASS | All PRNG calls go through per-session seeded RNG; consequence rolls, density seeding, scale assignment all reproducible |
| #4 Fail-soft | PASS | 13 failure modes mapped to graceful fallbacks |
| #5 Narrative over mechanical perfection | PASS | Dual-voice chronicle foregrounds prose; Emergence Dilemma is narrative-first, numbers-hidden |
| #6 Additive over destructive | PASS | All changes are new edge type, new phases, new node subtypes, extensions to existing templates. No refactor of existing systems except the `secretsFavors.ts` → `knowledge.ts` rename which is additive (exports preserved with new names alongside old) |
| #7 Performance budget | PASS | Clue decay runs every 10 ticks; PoP stream check is O(PoP_count) per tick (typically ≤ 20); delve admission O(active_delves); no distance-matrix lookups |

---

## THR-30 Integration (first-class section, not appendix)

### Structural unification

Clues and secrets are the same primitive wearing different masks. Recommendation: **rename `src/types/secretsFavors.ts` → `src/types/knowledge.ts`** and colocate `KnowsClueOfEdgeProperties` alongside `KnowsSecretOfEdgeProperties` + `OwesFavorEdgeProperties`. Shared:

- Provenance enum pattern (`SecretSource` / `ClueSource`)
- Magnitude/precision scalar
- Discovery/consumption tick tracking
- Prose-magnitude resolver pattern (`secretMagnitudeProse` / `clueMagnitudeProse`)
- Divine-action family (Reveal/Plant/Compose/Call-in all touch knowledge edges)

Divergence (kept):

- **Terminal policy:** secrets retain-on-reveal (`revealed: true`, edge retained); clues prune-on-consume (edge removed, replaced by `knows_of` familiarity). Encoded per-subtype.
- **Target polymorphism:** secrets always target actors; clues target locations in v1 (agents/factions/artifacts in v2+).

### Encounter template sharing

All six THR-30 discovery templates (Confession Over Drinks, Quiet Observation, Spy Debrief, Overheard Argument, Drunken Confession, Intercepted Message) gain a clue-branch when the observed/debriefed agent is ruin-adjacent. No new encounter pipeline; the branch reads the target subtype and produces the appropriate edge.

Shared emotional-architecture consequence: acquiring clues can generate "burdened" / "haunted" conditions (THR-30's vocabulary) when the clue carries high-magnitude dread (saga-scale ruins with dark-alignment).

### Divine-action peer family

The full information-intervention divine action family:

| Action | Edge type | Operation | Essence cost |
|--------|-----------|-----------|--------------|
| THR-30 `divine.reveal_secret` | `knows_secret_of` | Make public | 10 |
| THR-30 `divine.call_in_favor` | `owes_favor` | Redeem | 8 |
| THR-30 `divine.plant_secret` | `knows_secret_of` (fabricated) | Inject | 14 |
| Ruins `divine.relay.compose_a_clue` | `knows_clue_of` | Inject | 1 Mind + 1 sphere |
| Ruins `divine.emergence.claim` | `holds_place_of_power` | Transfer | magnitude × 20 |
| Ruins `divine.emergence.corrupt` | `holds_place_of_power` (siphon) + `knows_secret_of(divine_mark)` | Inject + mark | 4 |

Shared trace category: `divine.information`. Shared prose pattern ("the god's breath stirs the weave"). Shared essence-economy rubric (cost scales with consequence severity).

### divine_mark as the god-vs-god bridge

Every Compose-a-Clue, Plant-Secret, and Corrupt action that touches an agent creates a `knows_secret_of` edge of `SecretType: 'divine_mark'` on the agent. This is the canonical mechanism by which rival gods discover the player god's activity:

1. Player god composes a clue on Kael pointing at the Veil-Well ruin.
2. The action fires `produceClueConsequence` + a `knows_secret_of` edge (type: divine_mark, subject: Kael, source: divine_revelation, detail: "touched by the god of breath and threads").
3. A rival god later runs `divine.perceive.taste_the_wake` on Kael's hex.
4. Taste-the-Wake surfaces the divine_mark edge → the rival now holds a clue about the player god's activity.
5. The rival can intervene — reveal the mark publicly (trust penalty on Kael), plant a counter-secret, claim the Veil-Well themselves if Kael's delve completes.

This is the **god-vs-god information conflict** as a mechanic, not a narrative aspiration.

### Prose resolver unification

Refactor `secretMagnitudeProse` into a `knowledgeMagnitudeProse({ kind: 'secret' | 'clue' | 'favor', magnitude })` family function. Subtypes read shared band thresholds, customize adjective vocabulary. Content authors see one function, one band-threshold table, one surface to QA.

### Recommended PR sequencing

**PR 0 (prerequisite, may be a separate Linear issue):** Portfolio-pinning mechanism — design and implement the `portfolio_pinned` flag/edge so Channel 1 of Narrative Gravity can score on it. If deferred, ship ruins layer with `CLUE_BIAS_PORTFOLIO_PINNED = 0` and add a TODO to revisit Channel 1 once portfolio-pinning lands. Either way, do not ship the ruins layer claiming the protagonist-promotion cascade is complete unless this is in.

1. **PR 1 — Knowledge rename + shared primitives + trace-category registration.** Rename `secretsFavors.ts` → `knowledge.ts`. Add `KnowsClueOfEdgeProperties`. Extract shared prose-magnitude function. Re-export existing secrets/favors names for backward compat. **Step 0 of this PR: add all 16 `ruins.*` categories to `TRACE_CATEGORIES` in `src/types/trace.ts`** so subsequent PRs can emit traces without `as any` casts.
2. **PR 2 — Clue edge creation and decay.** `produceClueConsequence`, `phaseClueDecay`, `consumeCluesOnConvergence`. Extend THR-30 discovery templates with clue-branches. Extend encounter outcome processing to fire the new consequence.
3. **PR 3 — Perceive + Relay divine actions.** Register new action templates; resolver wiring; essence cost accounting; UI cards in ActionDrawer.
4. **PR 4 — Delve variant + 5-tick arc.** `encounterVariant: 'delve'`, `phaseDelveAdmission`, `phaseDelveProgression`, `phaseDelveEmergence`. Chamber-archetype prose tables. Consequence roll. DelveProgressPanel UI.
5. **PR 5 — Ruin transformation + PlaceOfPower (+ elderEssenceReward refactor).** Emergence Dilemma modal, `transformRuinConsequence`, `phasePlaceOfPowerStreams`, stream-decay logic, HexMapV2 signifier layer, EmergenceDilemmaModal UI. **Includes refactor of `computeElderEssenceReward` to accept a generic shape (or addition of a sibling function for the `RuinTransformedTrace` path)** — pick one and document the choice in the commit message.
6. **PR 6 — Worldgen density pass.** `RUIN_DENSITY_*` constants, historical-culture territory scan, `'elder_ruin'` LocationSubtype seeding in worldgen passes. Debug panel Ruins tab.
7. **PR 7 — Dual-voice chronicle migration.** Extend `ChronicleEntry` with `poetProse` + `witnessFacts`. Update `ChronicleEntryCard`. Migrate existing chronicle producers opportunistically (not blocking).
8. **PR 8 — Adventurer's Guild quest hook population.** Populate reserved quest template IDs. Subfaction biasing. Channel 4 / Channel 6 wiring (faction dossier + quest routing).

Total: ~8 PRs (plus PR 0 prerequisite), each individually shippable, each produces visible content.

---

## Open Questions Deferred to Implementation

1. **Clue edge rendering in the Journal Panel layout** — needs a UI sketch pass during Implementation Planning. Card vs. list vs. tree-by-hex?
2. **Delve-chamber archetype content per sphere** — the 9 spheres × 5 beats × 3 variants content budget may grow or shrink during authoring; revisit at content sprint kickoff.
3. **Saga-delve pacing** — does a saga-delve feel right at 5 × 2 = 10 ticks, or should saga beats be even longer? Tune after playtest of first implemented saga.
4. **Emergence Dilemma UI feel** — is it modal-blocking or side-panel? Prototype both and decide during PR 5.
5. **Scar sublocation prose and purpose** — v1 is narrative-only; should Scars accumulate any gameplay property (ambient haunting, pilgrimage site, etc.)? Revisit v2.

---

## Explicit Deferrals (require follow-up Linear issues under ruins-layer project)

Each must become a deferral-labeled Linear issue when PRs land:

- **Party delves** (`participants: AgentId[]` length > 1) — schema hook in PR 4, implementation v2+
- **Misleading clues** (wrong-lead clues that point at the wrong site) — schema supports via `misleading: true` flag in v2+, authoring in v3+
- **Rival god entities as active agents** — the Perceive/Relay/Emergence vocabulary is designed to work identically for rival gods, but the rival-god actor type is its own system
- **Inter-god cooperation** (alliances, shared PoP holdings) — v2+
- **Multi-saga chains** (sequential saga-delves sharing a plot arc) — v2+
- **Misfired delves** (agents entering ruins without a clue) — v2+
- **PlaceOfPower ascendant-holder specialization** — ascendants as PoP holders should have unique prose/mechanics; v2+
- **Scar gameplay properties** — haunting, pilgrimage, long-memory effects; v2+
- **Cross-ruin narrative linking** (a clue at ruin A that hints at ruin B) — v2+

Each becomes a `// TODO(THR-XX)` in the relevant code location and a `Deferral`-labeled Linear issue in the Ruins Layer project.

---

## Success Metrics

The ruins layer succeeds if:

1. **Essence economy:** PlacesOfPower contribute 20–30% of mature-game god essence income. (Measure: run 200-tick CLI sim; report per-phase essence attribution.)
2. **Delve cadence:** a typical player experiences ~1 saga delve per 100 ticks + 2–3 minor delves concurrent. (Measure: CLI sim delve-log export; band-check.)
3. **God-vs-god activation:** once rival gods are wired, rival Perceive actions surface divine_marks on ≥ 30% of player-composed clues within 20 ticks. (Measure: v2+; deferred.)
4. **Content survival:** the Emergence Dilemma prose-bank of 216 snippets never repeats on the same agent within the same playthrough. (Measure: prose-pipeline variant-drift report.)
5. **No delve firehose:** the player is never blocked-out of delve participation due to concurrency caps for more than 20 ticks. (Measure: admission-queue trace timing.)
6. **Narrative Gravity is effective:** ≥ 80% of saga delves in a mature-game playthrough are undertaken by agents who are bonded, portfolio-pinned, `shaping`/`story_beat`-tier, or faction-elite at the time of admission. (Measure: CLI sim; log admissions; tier-distribution report.)
7. **Ascendant cascade works:** at least 40% of new ascendants in a 500-tick playthrough emerge via a delve Transformed outcome rather than via other pathways. (Measure: CLI sim; ascendant-origin trace.)
8. **Bias is tunable, not rigid:** no single agent receives more than 40% of clues routed in any 50-tick window. (Measure: receiver-selected trace; distribution-variance check.)
9. **Saga suppression isn't pathological:** fewer than 10% of saga ruins remain in `clue_suppressed` state for more than 100 ticks after worldgen. (Measure: ruin-state timeline report.)

---

## Relation to Roadmap

This design maps to Linear project **Elder Magic & Ruins** (or adjacent; confirm project assignment during Implementation Planning). Issues to create in ordered dependency:

0. THR-XX — **Portfolio-pinning prerequisite** (PR 0). May land in a different project if it has wider use; either way, this issue is gating for full Channel 1 scoring. Without it, ship ruins layer with `CLUE_BIAS_PORTFOLIO_PINNED = 0` and document.
1. THR-XX — Knowledge rename + shared primitives + `ruins.*` trace registration (PR 1)
2. THR-XX — Clue edge creation and decay (PR 2), blocked by 1
3. THR-XX — Perceive + Relay divine actions (PR 3), blocked by 2
4. THR-XX — Delve variant + 5-tick arc (PR 4), blocked by 3
5. THR-XX — Ruin transformation + PlaceOfPower (+ `elderEssenceReward` refactor) (PR 5), blocked by 4
6. THR-XX — Worldgen density pass + `elder_ruin` seeding (PR 6), parallel-safe with 2–5
7. THR-XX — Dual-voice chronicle migration (PR 7), parallel-safe with 2–6
8. THR-XX — Adventurer's Guild quest hook population (PR 8), blocked by 2

CC coordination block per protocol:
- **Suggested model:** Sonnet for PRs 1–3, 6–8 (moderate complexity); Opus for PRs 4–5 (core mechanic depth)
- **Codex review:** yes for all PRs
- **Mutex-with:** PR 1 mutex with any live secrets/favors work; PR 5 mutex with any live work in `elderEssenceReward.ts`; PRs 2–5 serialized by design; PRs 6–8 parallel-safe

---

## Appendix A: Dialogue trace

This doc consolidates a multi-session brainstorm in Cowork between Christian Spliid (design lead) and the design agent. Key decision-making moments:

- **Clue terminology:** adopted "clues" over "leads" (user: "instead of calling it lead, let's call it clues")
- **Clue ownership:** generalized from guild-specific to all-actor/faction (user: "we have a general concept called a faction that a guild is an instantiation of")
- **Clue transience:** clues prune on convergence; direct familiarity edge replaces them (user: "when we have finally explored and found whatever the clue pointed towards, we can remove the clues")
- **Dual-voice chronicle:** emerged from user's feedback that Scene A (Grandmother's Gesture) was "too abstract for a game" and needed explanatory paragraph in different font
- **God-vs-god framing:** emerged when user asked rival gods to "use the same actions as the player guard"
- **Delve-as-variant framing:** adopted to avoid creating a parallel encounter pipeline
- **PlaceOfPower economic axis:** emerged from user's "pull two dark essence every round from this" framing
- **Scale-based concurrency cap:** designed collaboratively; user flagged "we don't want the players to be formed with tonnes of delves, with one big one running at any time"

Predecessor doc: `Docs/plans/2026-04-18-ruins-layer-brainstorm-prep.md` (10 open questions, 8 opportunity families, scope breakdown — all now resolved in this doc).

---

**End of design doc.** Ready to hand off to Implementation Planning. Next step: create Linear issues per the PR-sequencing list, attach this doc to each, coordinate with CC for sequencing.
