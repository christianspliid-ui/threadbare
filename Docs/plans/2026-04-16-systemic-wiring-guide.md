# Systemic Wiring Guide — What the Engine Can Do, and Why It Matters for What You Write

**Date:** 2026-04-16
**Purpose:** This document exists because LLMs are good at writing prose but bad at knowing what a bespoke game engine can do with that prose. The result is hardcoded fiction masquerading as game content. This guide fixes that by explaining the engine's dynamic capabilities *before* you start writing — because knowing what the system can do should change what you decide to write.

**Audience:** Any agent authoring encounters, attachments, or prose content. Read this before the encounter-pipeline, attachment-pipeline, or prose-content-systems skills. This is not optional.

**Core principle:** If the prose can't change based on who's experiencing it, what happened before, or what happens after — you've written a book page, not game content. We're making a game.

---

## Part 1: Why This Matters — The Book vs. Game Distinction

A hardcoded encounter reads the same every time. A festival always has the same description, the same outcome text, the same consequences. If you've read it once, you've read it forever.

A systemically wired encounter reads differently depending on: who the agent is, what they've done before, who they know, what the player-god chose, and what the world looks like right now. It plants seeds that grow into future encounters. It creates artifacts and relationships that other systems can discover. It changes how the world talks about the agent.

**The encounter-pipeline skill teaches you to write great prose. This guide teaches you what to write great prose *about* — because the engine gives you capabilities that should shape your creative decisions from the very first sentence.**

Here's the difference:

**Hardcoded:**
> "The merchant thanks you for your help and gives you a silver brooch."

**Systemically alive:**
> "{name} watches the merchant's hands tremble as {they} pin{s} the brooch to {their} cloak. {?has_faction}The {faction} will hear of this — whether as charity or as leverage depends on who tells it first.{/has_faction}{?no_faction}No guild claims {them}, but that won't last. Acts of mercy in a hungry market draw eyes.{/no_faction}"

The second version uses enrichment placeholders, conditional blocks, and implies aftermath seeding and reputation flow. The prose is better *because* the author knew what the engine could do.

---

## Part 2: The Seven Capabilities — What You Can Do

Every encounter has access to seven systemic capabilities. These aren't optional extras — they're the tools that make content alive. When you sit down to write, you should be asking: "which of these seven am I using, and why am I not using the others?"

### Capability 1: Enrichment Placeholders — Prose That Knows Who's Reading

Every `narrative` field in steps and outcomes supports dynamic text substitution. The engine builds a `NarrativeContext` from the graph at generation time and resolves placeholders into real data.

**Available placeholders:**

| Placeholder | Resolves To | Example |
|---|---|---|
| `{name}` | Agent name | "Kael Thornweaver" |
| `{they}/{them}/{their}/{s}` | Gendered pronouns | "they/them/their/s" |
| `{They}/{Them}/{Their}` | Capitalized pronouns | "They watch..." |
| `{location}` | Current location name | "Thornhaven Market" |
| `{culture}` | Agent's culture | "Coastfolk" |
| `{faction}` | Agent's faction name | "The Weavers' Circle" |
| `{title}` | First reputation trait | "the Resolute" |
| `{artifact:weapon}` | Notable weapon (tier ≥ storied) | "Ashenmourne" |
| `{artifact:any}` | Any notable artifact | "the Covenant Seal" |
| `{ally:strongest}` | Strongest ally (trust ≥ 0.5) | "Serafina" |
| `{rival:strongest}` | Strongest rival | "Voss Ironfold" |
| `{omen_adj}` | Active omen flavor | "whispering" |
| `{omen_verb}` | Active omen action | "unravels" |
| `{omen_noun}` | Active omen object | "the membrane" |
| `{omen_atmosphere}` | Active omen mood | "the air thickens" |
| `{doom_verb}` | Doom archetype vocabulary — action verb | "fractures" (breach) / "gathers" (convergence) |
| `{doom_adj}` | Doom archetype vocabulary — adjective | "fractured" (breach) / "inexorable" (convergence) |
| `{doom_atmosphere}` | Doom archetype vocabulary — atmospheric phrase | "something presses through" (breach) |

**How to verify:** Run the DebugPanel Trace tab filtered on `narrative_generation`. Every step and outcome narrative you see in game should render with placeholders resolved — not as literal `{name}` / `{?has_faction}` text. The regression locks live in `src/engine/__tests__/unifiedAdapterProseEnrichment.test.ts`.

**Conditional blocks** — prose that only appears if a condition is true:

```
{?has_artifact}The weight of {artifact:any} shifts in {their} pack — 
a reminder that power answered once.{/has_artifact}

{?no_faction}{name} walks alone. No banner, no guild mark, 
no one to answer to but the road.{/no_faction}

{?has_ally}Somewhere behind them, {ally:strongest} would hear about this.
That thought alone steadies {their} hand.{/has_ally}
```

Available conditionals: `has_artifact`, `has_ally`, `has_rival`, `has_faction`, `has_title`. Each has an inverse: `no_artifact`, `no_ally`, etc.

**Why this changes what you write:** When you know prose can branch on whether the agent has allies or artifacts, you write scenes that *use* those relationships. A betrayal scene where the agent has no allies reads differently from one where their strongest ally might hear about it. A discovery scene where the agent carries a storied artifact reads differently from one where they have nothing. These aren't cosmetic — they change the emotional texture of the moment. **Write scenes where the conditionals matter, not scenes where they're decoration.**

**Routine tier (ROUTINE_TEMPLATES) also supports enrichment:** As of THR-86, `ROUTINE_TEMPLATES` in `src/data/narrative-content.ts` uses `ShapedTemplate[]` — each template has a `shape` property (`svo | aftermath | inverted | compound | fragment`) and a `template` string that supports the same enrichment placeholders (`{name}`, `{location}`, `{?has_faction}...{/has_faction}`, etc.). When `generateRoutineProse` is called with a `graph` + `actorId`, it runs `enrichProse()` to resolve them; without graph, `applyFallbacks()` provides safe substitutions. Use `{name}` (not `{actor}`) in all new routine templates. Aim for all 5 shapes across the pool for an event type to get variety rotation.

---

### Capability 2: Encounter Seeding — Consequences That Grow Into Future Stories

Aftermath reactions can plant `encounter_seed` effects that spawn new encounters for the agent after a delay. This is how one encounter creates a ripple that becomes a future story.

```typescript
{
  kind: 'encounter_seed',
  templateId: 'broker.quest.shrine_confrontation',  // Specific encounter to spawn
  // OR:
  encounterFamily: 'investigation',                  // Family tag (v1: narrative event)
  targetAgentId: '$actor',       // Who gets the follow-up (defaults to current agent)
  delayTicks: 15,                // When it becomes eligible
  priority: 1.2,                 // Higher = spawns sooner when eligible
  seedLabel: "The shrine map burns in their pocket — someone will come asking"
}
```

**Two modes:**
- **`templateId`** — spawns a specific encounter template as a unified action for the target agent. This is the reliable path for authored chains.
- **`encounterFamily`** — emits a narrative event tagged with the family name. Full family-matching (where the engine selects from a pool of family-tagged templates) is future work; for now, use `templateId` for guaranteed spawning.

**Seeds are fail-soft:** if the template doesn't exist or the agent is occupied, the seed emits a "withered" narrative event and is removed. No crashes, no stuck states.

**Why this changes what you write:** When you know an encounter can plant a seed that blooms 15 ticks later, you write *differently*. You write the betrayal scene knowing the revelation scene is coming. You write the merchant's favor knowing the debt-collection encounter is planted. You write the hidden truth knowing the investigation encounter will surface it. **The aftermath isn't the end of the story — it's the planting of the next one.** If your encounter has no seeds, ask why. Some encounters are simple moments (the healer mercy encounter). But if your encounter has consequences that should echo forward, seeds are how you make that happen.

**Example from Flawed Steel:** The "Temper the Narrative" path plants a hidden mark (deception, severity 0.5) with `revealFamilies: ['investigation', 'mercenary', 'crafting']`. It also seeds a `crafting.quest` follow-up at 25 ticks delay. The deception isn't just prose — it's a ticking clock in the graph that other encounter types can discover.

---

### Capability 3: Hidden Marks — Secrets That Can Be Discovered

Hidden marks track secrets, debts, betrayals, and knowledge that persist invisibly until another encounter type reveals them.

```typescript
{
  kind: 'hidden_mark',
  category: 'betrayal',        // betrayal | debt | secret_knowledge | contamination | etc.
  severity: 0.6,               // 0-1, affects reveal likelihood
  label: "Betrayed Brinewall alliance for shrine intelligence",
  revealFamilies?: ['investigation', 'brinewall']  // Which encounter families can discover this
}
```

**Why this changes what you write:** Marks create dramatic irony — the player knows the secret exists, but the world doesn't yet. When you write a deception scene, the mark means the deception has *weight*. It's not just flavor text that says "they got away with it." It's a graph entity that future encounters in the `investigation` or `brinewall` families can detect and trigger consequences from. **Write scenes where the secret matters enough to track.** If a character lies, cheats, or hides something — and it would change the world if discovered — that's a hidden mark.

**🟢 Reveal loop live (THR-112, 2026-04-17):** Hidden marks now actively shape gameplay in three ways:
1. **Scoring boost** — encounters whose `templateId` starts with a mark's `revealFamilies` prefix score `+MARK_REVEAL_SCORING_BONUS * severity` (default +0.3), making agents drift toward encounters that could surface their secrets.
2. **Probabilistic consumption** — when a matching encounter resolves in GameView, `consumeMatchingMarks()` rolls `severity * 0.9` to consume the mark, emit `hidden_mark_revealed`, and append a `ripple_consequence` chronicle event.
3. **Decay** — Phase 6.7 (`phaseHiddenMarkDecay`) decays severity 2%/tick after a 20-tick grace period; marks below severity 0.05 are dropped with a `hidden_mark_revealed` trace (`revealedBy: 'decay:severity_floor'`). Unrevealed marks do not persist forever.

---

### Capability 4: Reputation Flow — How the World Remembers

Two parallel systems track how the world perceives an agent:

**Reputation Score** (0–1 numeric): Direct delta applied per outcome.
```typescript
onSuccess: { narrative: "...", reputationDelta: 0.05 }
onFailure: { narrative: "...", reputationDelta: -0.02 }
```

**Reputation Tallies** (named counters): Accumulate over time, cross thresholds to grant traits.
```typescript
{ kind: 'reputation_tally', key: 'gate_duty.witness_story_followed', delta: 1 }
```

Tallies accumulate and decay (2% per tick). When they cross thresholds (3 → "Whispered", 8 → "Known", 15 → "Legendary"), reputation traits are assigned based on the agent's capability tier.

**Polarity** — encounters are tagged positive or negative via:
1. Explicit `reputationPolarity` field on the template
2. Heuristic from encounter type (assist/trade → positive; steal/duel → mixed)
3. Tiebreaker from agent's axiological alignment

Polarity determines whether reputation grows in the "virtuous" or "notorious" direction for the tested reach domain.

**Why this changes what you write:** Reputation isn't decoration — it feeds back into the scoring pipeline (higher reputation agents get different encounter access) and into prose (reputation traits become `{title}` in enrichment, biography resolvers describe the agent's track record). **Write encounters where the reputation consequence is proportional to the moral weight of the choice.** A trivial task shouldn't swing reputation. A betrayal should leave a mark that the whole reputation system carries forward.

---

### Capability 5: Graph Operations — Changing the World's Structure

Encounters can cause the world graph to be structurally mutated. These changes aren't cosmetic — they change what exists in the world. The authoring surface and the engine implementation are distinct levels; understanding both prevents writing aftermath that tries to call the wrong thing.

#### Engine-internal helpers (not callable from authored aftermath)

These helpers are used by engine code (tick phases, attachment pipeline, agent movement, encounter resolution). Authored encounter aftermath cannot invoke them directly. The list is here so you know what structural mutations the engine can perform, which in turn tells you what shape of outcome a new authored effect kind could produce if you propose one.

| Helper | What It Does |
|---|---|
| `createSublocation` | Creates a new sublocation inside a location |
| `createTradeRoute` | Creates a `trades_with` edge between locations |
| `claimControl` | Creates a `controls` edge |
| `joinOrUpdateMembership` | Creates a `member_of` edge |
| `modifyLocationProperty` | Changes prosperity, defense, magicalSaturation, etc. |
| `createRelationEdge` | Creates any custom edge type |
| `recordIntelligence` | Stores intel on agent node |

**Engine-internal effect primitives (used in attachment / spell pipelines, NOT in encounter aftermath):**

The attachment and spell systems compose effects from a category pool of ~40 primitive types. These are the mechanical vocabulary for authored **attachments** and **spells**, not for encounter aftermath. The table below lists category types, each of which has multiple concrete sub-variants.

| Effect category | What It Does |
|---|---|
| `GraphMutationEffect` | Direct CRUD: `add_edge`, `remove_edge`, `set_property`, `remove_node` |
| `CreateStructureEffect` | Creates locations, sublocations, landmarks, trade routes, barriers |
| `DestroyStructureEffect` | Razes structures |
| `FactionManipulateEffect` | Shift relationships, transfer control, splinter, absorb, declare war, force peace |
| `SpawnEffect` | Brings entities into existence (agents, encounters, attachments, locations) |

**For encounter aftermath authoring, use the typed aftermath effect kinds in Part 5 § "Aftermath Reaction Effect Types" (18 kinds).** Raw graph-mutation primitives are not exposed to authored aftermath — propose a new typed kind if you need one.

#### Authored aftermath surface for graph mutation

The following typed effects ARE callable from `aftermathConfig.reactions[].effects` and constitute the complete graph-mutation vocabulary for encounter authors:

- `spawn_artifact` — creates artifact node + possesses/bonded_to/contains edges (THR-115)
- `emit_omen` — appends to `GameState.emittedOmens`, drives encounter bias (THR-115)
- `faction_splinter` / `faction_absorb` / `faction_dissolve` — faction topology surgery (THR-115)
- `faction_declare_war` / `faction_force_peace` — faction sentiment edges (THR-115)
- `intelligence` — writes `intelligenceRecords` on agent node (existing)
- `apply_condition` / `remove_condition` / `condition_attachment` — condition edges + attachments (THR-114 / THR-117)
- `hidden_mark` — discoverable secret on agent (existing)
- `encounter_seed` — plants future encounter, creates `caused_by` edge (THR-116)

If you need a structural mutation that no typed effect covers, propose a new aftermath effect kind — do not try to smuggle engine helpers into authored aftermath.

**How to verify:** Grep `src/engine/encounterAftermath.ts` for the `applyEncounterAftermathReaction` function — the polymorphic switch on `effect.kind` enumerates the actual authoring surface. The count there is the source of truth, not "40".

**Why this changes what you write:** When you know an encounter can cause artifacts to be created, omens to be emitted, or faction topology to change, you write *stories about structural consequences*. A founding scene produces a real artifact or sublocation that other agents can discover, encounters can reference, and the map can display. **Write encounters that leave structural fingerprints on the graph.** If an agent "establishes a guild chapter," that should produce a `spawn_artifact` or faction effect — not just prose that says it happened.

---

### Capability 6: Intelligence and Content Grants — Knowledge as Currency

Two aftermath reaction types give agents tangible knowledge or items:

**Intelligence:**
```typescript
{
  kind: 'intelligence',
  category: 'shrine_location',              // shrine_location | agent_network | trade_route | military_position | political_secret | cultural_knowledge
  label: "Location of the Thornweave Shrine",
  detail: "Northeast of the salt flats, behind the fallen bridge",
  targetRegion?: 'eastern_reach',
  targetEntityId?: 'loc_thornweave_shrine',
  reliability?: 0.8                          // 0-1, how trustworthy
}
```

**Content Grant:** Auto-fires an attachment template onto the agent.
```typescript
{ kind: 'content_grant', templateId: 'patrons_backing' }
```

#### Intelligence is consumed in three places (THR-113)

Granting intelligence without consuming it is write-only theatre. The engine now closes the loop at three sites. As an author, you get this automatically — but knowing the sites tells you what prose can reference what.

| Hook | Where it fires | What it does |
|---|---|---|
| `scoring_boost` | `scoreAndSelect` in `encounterScoring.ts` | Candidates whose `templateId` / `locationId` / `targetAgentId` / region match an actionable record gain `INTEL_SCORING_BONUS` (default `0.25`). `intelBonus` is exposed on `ScoredCandidate` for trace inspection. |
| `prose_enrichment` | `enrichProse` in `proseEnrichment.ts` | `{intel:<category>}` placeholders resolve to the most recent record's label/detail/reliability. `{?knows_<category>}...{/knows_<category>}` and `{?no_<category>}...{/no_<category>}` conditionals gate whole sentences. |
| `resolution_match` | `observeResolutionIntelligence` after `consumeMatchingMarks` in GameView | Passive observation: when a resolved action matches any of the acting agent's records, a trace fires. No game-state mutation — this is the "I noticed" hook for auditing what intel actually paid off. |

Every consumption emits an `intelligence_referenced` trace with a `referencedBy` discriminator (`scoring_boost` | `prose_enrichment` | `resolution_match`), the `recordId`, and the consuming context. Dedup is per-call (scoring loop and enrichProse each only emit once per unique record).

**Placeholder vocabulary for prose authors:**

| Placeholder | Resolves to | Silent fallback when record missing |
|---|---|---|
| `{intel:shrine_location}` | Record's `label` | Whole placeholder stripped |
| `{intel:shrine_location.detail}` | Record's `detail` | Stripped |
| `{intel:shrine_location.reliability}` | `"reliable"` / `"uncertain"` / `"dubious"` (thresholds `0.7` / `0.4`; non-finite → `dubious`) | Stripped |
| `{?knows_shrine_location}…{/knows_shrine_location}` | Enclosed text if the agent has any record in that category | Enclosed text removed |
| `{?no_shrine_location}…{/no_shrine_location}` | Enclosed text if the agent has NO record in that category | Enclosed text kept |

All six `IntelligenceCategory` values are supported: `shrine_location`, `agent_network`, `trade_route`, `military_position`, `political_secret`, `cultural_knowledge`.

**Why this changes what you write:** Intelligence creates asymmetric knowledge — one agent knows something others don't. Now that knowledge *ranks their next encounter higher*, *shows up in their prose*, and *is noticed when they act on it*. Write reveal beats that call out the intel by category: "What {name} knew of {intel:trade_route} had cost them years." Write scenes where an uninformed agent fumbles: "`{?no_political_secret}{name} still did not know who had sent the steward.{/no_political_secret}`" A spy encounter that grants intelligence about a rival's plans is more systemically alive than one that grants a generic sword — and the rival's plans will now *influence what the agent does next*.

---

### Capability 7: Divine Intervention Choices — The Player's Voice

The player is a god. Their choices are always divine interventions, never direct character control. The engine generates intervention choices based on the agent's court position:

| Court Position | Choices Available | Prose Depth |
|---|---|---|
| `the_first` | Supportive (+3%, 1 essence) + Coercive (+15%, 5 essence) + Withdrawn (free) | Full (3-5 sentences) |
| `retinue` | Supportive + Withdrawn | Medium (2-3 sentences) |
| `watched` | Observation only | Peek (1-2 sentences) |
| `dormant` | None | None |

**Intervention tracking persists on thread edges:**
- `totalVignettes`, `playerIntervened`, `playerWithdrew`
- `interventionRatio` (how often the god meddles vs. lets be)
- `supportiveCount`, `coerciveCount`
- `essenceSpentOnEncounters`

**Why this changes what you write:** You're not writing choices for a character — you're writing moments where divine observation creates tension. The god sees the agent struggling and must decide: pour power in, or let them find their own way? **Write moments where the intervention decision is genuinely difficult — where supporting has a cost beyond essence, and withdrawing has consequences beyond failure probability.** The intervention ratio is tracked. A god who always meddles creates a different story than one who watches.

---

### Capability 8: Complication System — Failure Has Texture (THR-20)

When a failure-tier step outcome occurs (success_at_cost / failure / critical_failure), the engine automatically selects a concrete narrative complication from a pool of templates. This runs for **all** action templates, not just the proving-slice families. The complication is displayed in the EncounterVeil and emits notification events.

**You do not author complications per-encounter.** Complications come from the global `src/data/complication-templates.ts` pool. However, the complication **scoring and selection** is influenced by:
- The **action's reach** — matching templates score higher (e.g. a `heart` action preferentially draws `broken_trust` and `witness` complications; a `shadow` action preferentially draws `rival_attention` and `scar`)
- The **active omen category** — synergy bonus if the complication category matches omen themes
- The **doom stage** — `worsening_convergence` templates score higher at stage 3+
- **Scar stacking** — if the actor already has scar attachments, diminishing returns apply
- The **location's unrest** — `location_fallout` complications diminish when unrest is already maxed

**Complication effects that run automatically (you don't need to wire these per-encounter):**

| Effect type | What it does |
|---|---|
| `unrest_delta` | Raises/lowers location unrest |
| `attachment_add` | Creates a mark/scar attachment on the actor |
| `doom_micro_tick` | Advances the doom clock by a small magnitude |
| `relates_to_create` | Creates a graph edge between actor and a witness/faction member |
| `reputation_delta` | Adjusts actor reputation |
| `quintessence_delta` | Adjusts the actor's quintessence |
| `location_fallout` | Marks a location as unsafe/compromised |

**Prose placeholders available in complication templates** (resolve from live graph):
- `{name}` — actor's name · `{possessive}` — `their` · `{location}` — current location name
- `{witness}` — a randomly chosen present agent · `{faction}` — actor's faction name
- `{omen_atmosphere}` — flavored atmosphere from the active omen

**What you CAN do:** Author new complication templates in `src/data/complication-templates.ts`. Each needs:
- `id`, `category` (9 options), `name`, `severity` (`minor`/`standard`/`severe`)
- `proseTemplates: string[]` — 3+ prose variants using placeholders
- `effects: ComplicationEffect[]` — at least one game-state effect
- Optional `requirements`: `witnessesPresent`, `factionRelationship`, `atSettlement`, `minDoomStage`, `omenCategory`
- Optional `reachAffinity: string[]` and `omenSynergy: string[]` for scoring bias

**Notification routing:** Severe → `alert` channel. Standard → `toast`. Minor → silent (prose-only in EncounterVeil).

**Why this changes what you write:** Failure in this engine is never "nothing happened." Write failure branch prose that *opens space* for the complication to specify the consequence: "The attempt goes wrong—" leaves room. "The merchant catches you red-handed—" over-specifies and may contradict a `scar` or `worsening_convergence` complication. Let the complication system carry the specificity; your prose carries the emotional register.

---

### Capability 9: World-Shaping Effects — Encounters That Change the Map (THR-115)

Aftermath reactions can now permanently reshape world topology: spawning artifacts, staining regions with omens, splitting or absorbing factions, and triggering war or peace between factions. These effects run through the same `applyEncounterAftermathReaction` call path as all other effects — content authors just declare the intent, the engine does the surgery.

#### Spawn Artifact

```typescript
{
  kind: 'spawn_artifact',
  artifactName: "The Thornweave Seal",
  artifactSubtype: 'relic',                     // relic | weapon | scroll | vessel | etc.
  possessedByAgentId: '$actor',                 // who carries it (defaults to actor)
  bondedToAgentId?: '$actor',                   // mystical bond (optional)
  targetLocationId?: 'loc_throne_room',         // contained within a location (optional)
  chronicleEntry?: "A seal of binding was forged in the ruins."
}
```

Creates an `artifact` graph node, adds `possesses` / `bonded_to` / `contains` edges as declared, and optionally appends a chronicle event. The artifact becomes part of the world graph — prose resolvers can reference it via `{artifact:relic}`, and other encounters can discover it.

**When to use:** Founding moments, magical discoveries, pivotal plot payoffs. If the encounter's outcome is "an important object now exists in the world," this is the effect.

#### Emit Omen

```typescript
{
  kind: 'emit_omen',
  omenId: 'omen_bridge_of_silence',
  encounterTypeBias: { ritual: 0.3, conflict: -0.15 },  // which encounter types become more/less likely
  scope: {
    kind: 'local',                // global | regional | local
    hexCol: 4, hexRow: 7,
    radius: 3                     // hex distance radius for 'local'
  },
  durationTicks: 48,              // how long the omen stains this region (default: 48 = 4 game days)
  intensity: 0.7                  // 0-1, scales the bias contribution
}
```

Appends an `EmittedOmen` to `GameState.emittedOmens`. The omen drives `deriveEmittedOmenEncounterBias` in Phase 2b, nudging agent encounter selection toward the declared bias while the omen is active. Decays automatically in Phase 1.7a when `tick > expiresTick`.

Cap: `MAX_EMITTED_OMENS_CAP = 10`. When exceeded, the oldest omen is evicted.

**When to use:** Dark rituals, cursed ground, prophecies fulfilled, corrupted shrines. A conflict in a sacred grove should make ritual and spiritual encounters more likely in that region for the next few days — this is the mechanism.

#### Faction Topology Effects

Five effects reshape the faction graph:

```typescript
// Split a faction into two
{ kind: 'faction_splinter', factionId: 'faction_weavers_circle',
  newFactionName: "The Rift Circle", newFactionType: 'guild',
  memberSelectionStrategy: 'by_reputation_below', memberSelectionValue: 0.3,
  sentimentToward: 'resentful' }

// One faction absorbs another's members
{ kind: 'faction_absorb', absorbingFactionId: 'faction_iron_pact',
  absorbedFactionId: 'faction_weavers_circle',
  memberSelectionStrategy: 'all_matching_trait', memberSelectionTrait: 'aligned_iron',
  reputationMerge: 'max' }

// Dissolve a faction entirely
{ kind: 'faction_dissolve', factionId: 'faction_weavers_circle',
  memberDisposition: 'drift_to_rival',   // independent | drift_to_rival
  rivalFactionId: 'faction_iron_pact' }

// Declare war between two factions
{ kind: 'faction_declare_war',
  factionAId: 'faction_iron_pact', factionBId: 'faction_weavers_circle' }

// Force peace between two factions
{ kind: 'faction_force_peace',
  factionAId: 'faction_iron_pact', factionBId: 'faction_weavers_circle',
  sentimentFloor: 0.1 }
```

**Member selection strategies** (`faction_splinter` / `faction_absorb`):
- `all_matching_trait` — all members who have a specific trait
- `within_radius` — members within N hex distance of the origin hex
- `by_reputation_below` / `by_reputation_above` — members whose reputation with the faction is below/above a threshold
- `explicit_ids` — exact agent IDs (for authored story moments)
- `random_sample` — deterministically random subset by count

**Reputation merge strategies** (`faction_absorb`):
- `max` — each absorbed member gets the higher of their two reputation values
- `sum_clamped` — reputations add (clamped 0–1)
- `weighted_avg` — proportional blend based on member counts

**When to use faction effects:** These are climax-level story beats, not routine aftermath. Reserve them for encounters where the fiction demands structural change — the betrayal that tears a guild apart, the war declaration at the coronation, the peace treaty as divine intervention. Each call mutates `WorldGraph` topology and bumps `structuralCacheVersion` — other systems will notice.

---

## Part 3: The Wiring Checklist — Ask These Before You Write

Before writing any encounter, answer these questions. If the answer to most of them is "not applicable," you may be writing a book page, not game content.

### Before the First Word

1. **Who is this encounter for?** Not just "any agent" — what reach domain, what capability tier, what faction or archetype? This determines `locationTypes`, `visibleTo`, `requiredTraits`, `encounterType`, and `motivations`. These fields aren't metadata — they're the scoring system's input for deciding whether this encounter surfaces for the right agents.

2. **What graph state makes this encounter interesting?** Does the agent have allies who could be implicated? Rivals who could interfere? A faction that would care? Artifacts that change the meaning of the scene? **Write scenes where graph state matters** — use conditional blocks to make the prose respond to it.

3. **What should persist after this encounter?** Not just "reputation goes up." What new edges exist in the graph? What hidden marks track secrets? What seeds plant future stories? What intelligence does the agent now possess? **If nothing persists except a reputation number, the encounter is ephemeral.**

### During Writing

4. **Are the narrative fields templates or strings?** Every `narrative` field in steps and outcomes should use enrichment placeholders where the agent's identity, relationships, or possessions would change the emotional texture. `{name}` is the minimum. Conditional blocks (`{?has_faction}...{/has_faction}`) are where the real dynamism lives.

5. **Do the outcomes use different systemic consequences?** Success and failure should produce different *kinds* of persistence, not just different prose. Success might create an edge and seed a follow-up. Failure might plant a hidden mark and damage reputation. **Different outcomes should leave different structural fingerprints.**

6. **Are the aftermath reactions wired?** Each reaction in the aftermath config should declare its effects explicitly: `reputation_score`, `reputation_tally`, `encounter_seed`, `hidden_mark`, `intelligence`, `recent_event`. If a reaction has no effects, it's flavor text — and flavor text that doesn't change the world isn't pulling its weight in a game.

### After Writing (Systems Audit)

7. **Can you trace the encounter's impact three ticks later?** After the encounter resolves, what changes in the world? Can another encounter discover what happened here? Can an agent's biography resolver mention it? Does the location's encounter history capture it? If the answer is "nothing observable changes," the encounter is a dead end.

8. **Does the encounter create asymmetry?** The best encounters create situations where different agents know different things, where hidden marks wait to be discovered, where seeds will bloom at unexpected times. Symmetry (everyone knows the same thing, nothing is hidden, no consequences) is the enemy of interesting game state.

---

## Part 4: Worked Example — From Premise to Wired Encounter

**Premise:** "Pyra organizes a harvest festival at the settlement."

### The Book Page Version (What NOT to do)

```
Pyra gathers the village for a harvest festival. There's music, 
food, and dancing. The festival is a success and everyone is happy.
Reputation +0.05.
```

This is hardcoded fiction. It reads the same regardless of who Pyra is, where the settlement is, who lives there, or what happened last week. Nothing persists. Nothing seeds. Nothing can be discovered.

### The Systemically Alive Version

**Step 0 — The Preparation** (difficulty: 0.3, reach: gold, duration: 3)

```
narrative: "{name} moves through the {location} market at dawn, 
tallying debts and favors owed. {?has_faction}The {faction} could 
make this simple — a word to the grain merchants, and the stores 
open. But {they} want{s} this to belong to the people, not the 
guild.{/has_faction}{?no_faction}Without a guild to lean on, every 
bushel of grain is a negotiation, every musician a personal favor 
called in.{/no_faction} Three days until the solstice. The 
settlement will remember how this went."
```

**onSuccess outcome:**
```
narrative: "The grain arrives. The musicians tune their instruments 
in the square. {name} hasn't slept in two days, but {they} stand{s} 
at the edge of the market watching it come together — not with 
pride exactly, but with the specific relief of someone who bet 
everything on a single hand."
reputationDelta: 0.08
```

**Step 1 — The Festival** (difficulty: 0.25, reach: heart, duration: 2)

```
narrative: "By the second night, the festival has its own momentum. 
{?has_ally}{ally:strongest} finds {them} near the bonfire and says 
nothing — just hands {them} a cup. That's enough.{/has_ally}
{?no_ally}{name} stands alone near the bonfire. Nobody brings 
{them} a cup. {They} pour{s} {their} own.{/no_ally} But somewhere 
in the crowd, someone is watching who shouldn't be."
```

**Aftermath reactions:**

**Reaction 1: "Steady Pyra's patience"** (divine intervention — supportive)
```
effects: [
  { kind: 'reputation_tally', key: 'festival_organizer', delta: 2 },
  { kind: 'encounter_seed', 
    templateId: 'social.quest.festival_aftermath_gratitude',
    delayTicks: 8, 
    seedLabel: "The settlement remembers who fed them" },
  { kind: 'recent_event', 
    message: "The harvest festival drew the settlement together — 
    and drew attention from beyond the walls" }
]
```

**Reaction 2: "Send a vision of the watching figure"** (divine intervention — coercive)
```
effects: [
  { kind: 'intelligence', 
    category: 'agent_network', 
    label: "Spy at the festival",
    detail: "A figure in Arcane Circle colors, counting heads" },
  { kind: 'hidden_mark', 
    category: 'secret_knowledge', 
    severity: 0.4,
    label: "Pyra knows she's being watched",
    revealFamilies: ['investigation', 'arcane_circle'] },
  { kind: 'encounter_seed',
    templateId: 'social.quest.arcane_circle_approach',
    delayTicks: 12,
    seedLabel: "The Circle makes their move" }
]
```

**Reaction 3: "Let her be who she is"** (withdrawn)
```
effects: [
  { kind: 'reputation_tally', key: 'festival_organizer', delta: 1 },
  { kind: 'recent_event',
    message: "The festival ends. The settlement is fed. 
    Nothing else needs to happen — but it will." }
]
```

### Why This Version Is Alive

- **Enrichment placeholders** make the prose respond to Pyra's actual state (faction, allies, pronouns)
- **Conditional blocks** create two distinct emotional textures: one where Pyra has support, one where she's alone
- **Reputation tallies** build toward a persistent "festival_organizer" reputation that will eventually cross thresholds
- **Encounter seeds** plant two different future stories depending on what the god chooses — gratitude from the settlement OR confrontation with the Arcane Circle
- **Intelligence** gives Pyra actionable knowledge about being watched (if the god sends the vision)
- **Hidden marks** create dramatic irony — Pyra knows about the spy, but the spy doesn't know she knows, and investigation encounters can surface this
- **The withdrawn option** is real — it produces a quieter outcome with less seeding, which is the game-mechanical expression of "the god chose not to interfere"
- **The divine intervention choices are genuinely different** — supporting the festival vs. warning about the spy are different kinds of godly action with different consequences

This is what "content is design" means: the systemic wiring isn't decoration on top of the prose. The wiring IS the design. The prose serves the wiring. Knowing that encounter seeds exist is what made the author write a scene where someone is watching — because that watcher can become a future encounter.

---

## Part 5: The Capability Inventory — Quick Reference

For implementation agents translating authored designs into template code.

### Template-Level Fields That Affect Scoring/Filtering

| Field | Type | What It Controls |
|---|---|---|
| `locationTypes` | `LocationSubtype[]` | Which location subtypes surface this encounter |
| `sublocationTypes` | `string[]` | Further refinement within locations |
| `visibleTo` | `string[]` | `'faction:<id>'`, `'agent:<id>'`, `'archetype:<id>'`, `'culture:<id>'`, `'all'` |
| `requiredTraits` | `Array<{traitId, minLevel?}>` | Agent must have these traits |
| `blockedByTraits` | `string[]` | Agent must NOT have these traits |
| `encounterType` | `EncounterType` | Controls motivation alignment scoring |
| `motivations` | `ValuePair[]` | Which axiological value pairs drive agent interest |
| `threatRating` | `ThreatRating` | Trivial → Deadly; feeds threat tolerance filter |
| `reachPrimary` / `reachSecondary` | `ReachDomain` | Which capability domains are tested |
| `sphereAffinity` | `SphereName` | Resonance scoring with hex sphere and world-soul |
| `intrinsicTier` | `AttentionTier` | Background / Shaping / Crescendo attention tier |
| `questPriority` | `number` | Score multiplier (1.0 normal, 2.0+ quest importance) |
| `reputationPolarity` | `'positive' \| 'negative'` | Which direction reputation flows |
| `remoteAttempt` | `boolean` | Can be attempted without physical presence |

### Step-Level Fields

| Field | Type | What It Controls |
|---|---|---|
| `reach` | `ReachDomain` | Which capability domain resolves this step |
| `difficulty` | `number` | 0-100 scale → sigmoid → probability |
| `duration` | `number` | Ticks to resolve (1 = quick, 3-5 = multi-day, 5-10 = siege) |
| `narrative` | `string` | Supports all enrichment placeholders |
| `leverageOnSuccess/Failure` | `number` | Accumulated social leverage for gated steps |
| `conditional` | `object` | Leverage-range or partial-success gating |

### Outcome-Level Fields

| Field | Type | What It Controls |
|---|---|---|
| `narrative` | `string` | Supports all enrichment placeholders |
| `traitModifiers` | `Record<string, number>` | Trait gain/loss |
| `reputationDelta` | `number` | Direct reputation score change |
| `tierPromotionEligible` | `boolean` | Allows capability tier promotion on this outcome |
| `rewardPool` | `RewardPoolRecipe` | Attachment generation |
| `appliesWound` | `boolean` | **Legacy only (`EncounterTemplate` only).** Triggers mid-encounter tier promotion on wound. Not available on `UnifiedActionTemplate` — use the `condition_attachment` aftermath effect instead. |

### Aftermath Reaction Effect Types

| Effect Kind | Purpose | Key Fields |
|---|---|---|
| `reputation_score` | Direct reputation delta (actor or faction) | `delta`, `targetAgentId?`, `targetFactionId?` |
| `reputation_tally` | Named counter accumulation | `key`, `delta`, `targetAgentId?`, `targetFactionId?` |
| `reputation_set` | Absolute reputation assignment (hard reset) | `value` (clamped [0,1]), `targetAgentId?`, `targetFactionId?` |
| `encounter_seed` | Plant future encounter | `templateId` or `encounterFamily`, `delayTicks`, `seedLabel` |
| `hidden_mark` | Track discoverable secret on an agent | `category`, `severity`, `label`, `revealFamilies`, `targetAgentId?` |
| `intelligence` | Grant knowledge to an agent | `category`, `label`, `detail`, `targetEntityId`, `reliability`, `targetAgentId?` |
| `apply_condition` | Attach a trait condition for N ticks (full target resolution: agent, faction, sublocation) | `conditionTraitId`, `durationTicks?`, `intensity?`, `targetAgentId?`, `targetFactionId?`, `targetSublocationId?` |
| `remove_condition` | Remove a trait condition (oldest or all) | `conditionTraitId`, `removeAll?`, `targetAgentId?`, `targetFactionId?`, `targetSublocationId?` |
| `condition_attachment` | Apply a condition trait by template ID; auto-looks up default duration; **triggers mid-encounter tier promotion when the template is the `wounded` condition** | `templateId` (e.g. `'trait.condition.wounded'`), `targetAgentId?`, `durationOverride?`, `stackCount?` |
| `clearance_gate_tag` | Advance gate progression | `tag` |
| `recent_event` | Emit narrative event (optionally fan out to witnesses) | `message`, `significance`, `witnessAgentIds?[]` |
| `spawn_artifact` | Create an artifact graph node; add possesses/bonded_to/contains edges; optional chronicle event | `artifactName`, `artifactSubtype`, `possessedByAgentId?`, `bondedToAgentId?`, `targetLocationId?`, `chronicleEntry?` |
| `emit_omen` | Append `EmittedOmen` to `GameState.emittedOmens`; drive per-type encounter bias in a scope/radius until expiry | `omenId`, `encounterTypeBias`, `scope` (`global`/`regional`/`local`+radius), `durationTicks?`, `intensity?` |
| `faction_splinter` | Create a new faction node; migrate selected members; add resentful edge | `factionId`, `newFactionName`, `newFactionType`, `memberSelectionStrategy`, `sentimentToward?` |
| `faction_absorb` | Migrate selected members from absorbed faction to absorbing; mark absorbed dissolved | `absorbingFactionId`, `absorbedFactionId`, `memberSelectionStrategy`, `reputationMerge` (`max`/`sum_clamped`/`weighted_avg`) |
| `faction_dissolve` | Mark faction dissolved; disperse members to independent or drift_to_rival | `factionId`, `memberDisposition` (`independent`/`drift_to_rival`), `rivalFactionId?` |
| `faction_declare_war` | Create bidirectional war_sentiment edges between two factions | `factionAId`, `factionBId` |
| `faction_force_peace` | Create bidirectional treaty edges; clamp sentiment above floor | `factionAId`, `factionBId`, `sentimentFloor?` |

**Multi-target note (THR-114):** Effects that accept `targetAgentId` / `targetFactionId` / `targetSublocationId` use priority resolution: explicit agent > explicit faction > explicit sublocation > action actor (fallback). Use `role:` prefix for participant substitution (e.g. `targetAgentId: 'role:victim'`). See `src/data/encounters/examples/` for gold-standard patterns: `example.betrayal_multi_target.ts` (hidden_mark + apply_condition on victim), `example.council_disowns.ts` (reputation_set on faction), `example.shrine_consecration.ts` (apply_condition + remove_condition on sublocation).

**Use `reputation_set` only when the fiction demands "it is now literally X"**, not for ordinary outcome nudges — those belong to `reputation_score` with a delta.

#### Conditions and wounds (THR-117)

Wounds are **not a separate subsystem** — they are a condition subcategory, fully wired into the same slot, overflow, and attachment pipeline as diseases, curses, blessings, and bestowed effects.

**Five condition subcategories:** `wound` (cap 3), `disease` (cap 2), `curse` (cap 2), `blessing` (cap 2), `bestowed` (cap 2). Slot caps are in `src/data/attachment-slot-constants.ts:CONDITION_CAPS`.

**Authoring surface for UnifiedActionTemplate aftermath:** Use `condition_attachment`. Example:

```typescript
{ kind: 'condition_attachment', templateId: 'trait.condition.wounded' }
```

The executor (a) resolves `templateId` from `condition-trait-content`, (b) looks up the default duration from `CONDITION_DURATIONS`, (c) creates a `has_trait` edge on the target agent, (d) emits `encounter_aftermath_effect` trace, and (e) **returns a `woundApplied` signal** when the condition is the wounded trait — which is fed into `checkMidEncounterPromotion` to promote the encounter from `background → shaping` tier, making the story beat visible in the chronicle.

**Overflow is automatic:** When a third wound is applied, `resolveWoundOverflow` fires automatically on the next tick (phase 2a.85), rolling against `WOUND_INCAPACITATION_CHECK_DIFFICULTY = 0.4`. Failure produces a `scar` consequence trait. You do not need to author this.

**Key constants:** `CONDITION_WOUNDED_DURATION = 24` (2 game days), `WOUND_INCAPACITATION_CHECK_DIFFICULTY = 0.4`, `CONDITION_ATTACHMENT_DEFAULT_STACK_COUNT = 1`.

**Verification:** `src/engine/__tests__/conditionOverflow.test.ts` (overflow pipeline), `src/engine/__tests__/conditionAttachment.test.ts` (aftermath effect).

---

### Capability 10: Conditional Aftermath Gates + Thread Mutations (THR-116)

#### The `when` predicate gate

Every `EncounterAftermathReactionEffect` can carry an optional `when?: EffectPredicate` field. If the predicate evaluates false, the effect is skipped silently (emits `aftermath_effect_skipped_by_when` trace). This lets one reaction branch serve multiple situations.

**Available predicates:**
| Predicate | Fires when |
|-----------|-----------|
| `'health_high'` | Agent's doom fraction ≤ 0.25 (healthy) |
| `'health_low'` | Agent's doom fraction ≥ 0.75 (badly hurt) |
| `'in_combat'` | Agent has `status_in_combat` trait |
| `'at_sea'` | Agent is in coastal/ocean biome |
| `'near_water'` | Coastal, river, lake, swamp, or archipelago biome |
| `'reputation_above:0.6'` | Actor's `reputationScore` > 0.6 |
| `'reputation_below:0.3'` | Actor's `reputationScore` < 0.3 |
| `'has_mark:suspicion'` | Actor has at least one hidden mark of that category |
| `'has_intel:patrol_routes'` | Actor has an intelligence record in that category |
| `'faction_controls:city_north'` | Actor's faction controls the named region |

```typescript
// Effect fires only when the actor is reputation-worthy
{ kind: 'reputation_score', delta: 0.1, when: 'reputation_above:0.6' }

// Effect fires only when wounded
{ kind: 'encounter_seed', encounterFamily: 'revenge', seedLabel: 'They remember the wound', delayTicks: 12, priority: 1.5, when: 'health_low' }
```

**Note:** `alone` and `outnumbered` predicates exist in the type but are currently stubs (always evaluates alone=true, outnumbered=false) — annotated in source with TODO.

#### Thread mutation effects

Four new effect kinds directly mutate thread-bond edges:

| Kind | What it does |
|------|-------------|
| `thread_strengthen` | Increases `edge.properties.strength` by `delta`, clamped at 1.0 |
| `thread_weaken` | Decreases `edge.properties.strength` by `delta`, clamped at 0.0 |
| `thread_break` | Removes the thread edge entirely; emits a `TickEvent` |
| `thread_branch` | Creates a new thread edge from `ascendantId → newMortalId` with `initialStrength` and a `branchedFromMortalId` back-reference |

```typescript
// Strengthen after trust-building reaction
{ kind: 'thread_strengthen', ascendantId: 'asc.player', mortalId: 'npc.spymaster', delta: 0.15 }

// Break the thread if the bond shatters
{ kind: 'thread_break', ascendantId: 'asc.player', mortalId: 'npc.betrayer' }

// Branch a new thread from an existing one
{ kind: 'thread_branch', ascendantId: 'asc.player', sourceMortalId: 'npc.mentor', newMortalId: 'npc.protege', initialStrength: 0.4 }
```

Thread strength is visible in `ThreadsPanel` as a thin animated bar (only shown when `< 1.0`). Mutations are inspectable via `thread_mutation_applied` / `thread_mutation_skipped` trace categories in the DebugPanel.

#### The `{cause:*}` prose placeholders

If a seeded encounter carries a `sourceEncounterId`, prose can reference the causing encounter:

- `{cause:label}` — the `seedLabel` from the original seed effect (e.g. "The mark knows your face")
- `{cause:ticksAgo}` — how many ticks ago the seed was planted

These resolve from `ctx.cause` in `NarrativeContext`. If no cause is present, `{cause:*}` tokens strip cleanly.

---

### Trace Categories You Can Filter On

Content authoring often needs to verify "did my effect actually fire?" DebugPanel's Trace tab filters on any of the categories below, grouped by what they prove:

| Verifies... | Categories |
|---|---|
| Prose enrichment works | `narrative_generation`, `intelligence_referenced` |
| Aftermath fired | `encounter_aftermath_applied`, `encounter_aftermath_effect` |
| Seeds planted and triggered | `encounter_seed_planted`, `encounter_seed_triggered`, `causation_edge_created` (THR-116) |
| Hidden marks placed, revealed, or decayed | `hidden_mark_placed`, `hidden_mark_revealed` |
| Intelligence granted, consumed, referenced | `intelligence_granted`, `intelligence_referenced` |
| Multi-target aftermath (THR-114) | `aftermath_target_resolved`, `aftermath_target_invalid`, `faction_reputation_changed`, `reputation_set_applied`, `condition_applied`, `condition_removed` |
| World-shaping aftermath (THR-115) | `artifact_spawned`, `omen_emitted`, `omen_decayed`, `faction_splintered`, `faction_absorbed`, `faction_dissolved`, `faction_war_declared`, `faction_peace_forced` |
| Conditional / causation effects (THR-116) | `aftermath_effect_skipped_by_when`, `aftermath_effect_when_passed`, `thread_mutation_applied`, `thread_mutation_skipped` |
| Graph mutation & UI choice flow | `graph_op_execution`, `choice_set_player_resolved`, `choice_set_player_dismissed` |
| Complication outcomes (THR-20) | `complication_selection` |

**How to use:** Open DebugPanel (backtick or F1), select the Trace tab, check the category filter chips. Full TypeScript interface definitions for each trace type live in `src/types/trace.ts`.

---

## Part 6: The Exemplars — Study These Encounters

These encounters demonstrate championship-level systemic wiring. Read them before authoring new content.

### Rival Shrine Betrayal (`broker.quest.rival_shrine_betrayal`)
**File:** `src/data/encounters/rival-shrine-betrayal.ts`
**Why it's exemplary:** Creates an intelligence artifact as a graph node that future encounters can reference via `revealFamilies`. Plants 4 encounter seeds across 2 branches. Uses hidden marks with severity tracking. Multi-layered reputation consequences ripple through faction network.

### Flawed Steel (`crafting.quest.flawed_steel`)
**File:** `src/data/encounters/flawed-steel.ts`
**Why it's exemplary:** Three branches with 6 total aftermath reaction paths, each producing distinct systemic fingerprints. Deception severity varies by reaction choice (prepared vs. unguarded). Seeds different encounter families per path. The prose and the wiring are inseparable — the narrative about managed truth IS the hidden mark system.

### The Contrast — Wandering Healer (`healer.quest.wandering_healer_shrine_access`)
**File:** `src/data/encounters/wandering-healer-shrine-access.ts`
**Why it's minimal (intentionally):** Single step, linear, no graph ops, no seeds, no hidden marks. This is a mercy encounter — sometimes simplicity is correct. But it's the exception, not the template. If your encounter looks like this and it isn't intentionally simple, you're underusing the engine.

---

## Part 7: Common Anti-Patterns

### Anti-Pattern 1: "Prose-First, Wire-Never"
The author writes beautiful prose, then asks "what systemic effects should this have?" and bolts on a `reputationDelta: 0.05`. The prose and the wiring are disconnected. **Fix:** Write the systemic consequences first (what seeds, what marks, what graph changes), then write prose that makes those consequences emotionally resonant.

### Anti-Pattern 2: "Static Strings in Dynamic Fields"
The `narrative` field contains prose with no placeholders, no conditionals, no reference to the agent's actual state. Every agent reads the same text. **Fix:** Use at minimum `{name}`, `{they}/{them}/{their}`, and one conditional block per narrative field. If the prose doesn't change based on who's experiencing it, ask why.

### Anti-Pattern 3: "Aftermath as Epilogue"
Aftermath reactions have evocative prose but no effects array, or only a `recent_event`. The aftermath doesn't change the world — it just describes what happened. **Fix:** Every aftermath reaction should have at least one effect that creates persistent state: a seed, a mark, a tally, or intelligence.

### Anti-Pattern 4: "Seeds Without Templates"
An encounter plants seeds using `encounterFamily` only, with no `templateId`. Since family-matching is v1/narrative-only, the seed emits a narrative event but doesn't spawn an actual follow-up encounter. **Fix:** Use `templateId` for guaranteed follow-up spawning. Use `encounterFamily` only when you intentionally want a narrative event without a specific follow-up.

### Anti-Pattern 5: "Scoring Blindness"
The author doesn't set `encounterType`, `motivations`, `locationTypes`, or `visibleTo` thoughtfully. The encounter exists in the content registry but never surfaces for appropriate agents because the scoring system can't match it. **Fix:** Think about scoring as design. A festival encounter should be `encounterType: 'lead'` with `motivations: ['loyalty_ambition']` and `locationTypes: ['market_district', 'settlement_square']`. These fields determine whether the encounter finds its audience.

### Anti-Pattern 6: "Symmetric Outcomes"
Success and failure both produce the same kind of persistence — maybe both add reputation, or both add a recent_event. There's no reason the world would feel different after success vs. failure. **Fix:** Success and failure should leave *structurally different* fingerprints. Success creates an ally edge and seeds a gratitude encounter. Failure plants a hidden mark and seeds a confrontation encounter. The world should be observably different.

---

## Part 8: Integration Points — Where This Guide Connects

This guide should be read before these skills:

- **`encounter-pipeline`** — The four-pass pipeline authors encounters. This guide tells authors *what to write about* based on engine capabilities. The systems-audit agent (Pass 3) should validate wiring against this guide.
- **`attachment-pipeline`** — Attachments compose behavior from the engine's effect primitive categories (`GraphMutationEffect`, `CreateStructureEffect`, `SpawnEffect`, etc.). These primitives are distinct from the 18 typed aftermath effect kinds — the attachment pool is authored at a lower level. See the attachment-pipeline skill for the full vocabulary.
- **`prose-content-systems`** — Day-to-day content uses enrichment placeholders and narrative templates. This guide explains what those placeholders resolve to and why they matter.
- **`prose-pipeline`** — Resolver architecture for graph-walking prose. This guide explains the other side: how encounter outcomes create the graph state that resolvers later walk.
- **`encounter-actor-systems`** — The scoring, filtering, and resolution systems. This guide explains how template fields feed into those systems.

**The chain of authority:**
```
Game Design Direction (emotional principles)
    → Systemic Wiring Guide (what the engine can do)
        → Quality Gate Section 9 (benchmark moments)
            → Encounter/Attachment Pipeline (authoring)
                → Prose Content Systems (day-to-day content)
```

Every link in this chain matters. Great prose without systemic wiring is a book page. Systemic wiring without great prose is a database entry. The game needs both.
