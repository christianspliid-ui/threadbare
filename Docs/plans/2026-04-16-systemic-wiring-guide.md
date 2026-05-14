# Systemic Wiring Guide — What the Engine Can Do, and Why It Matters for What You Write

**Date:** 2026-04-16
**Purpose:** This document exists because LLMs are good at writing prose but bad at knowing what a bespoke game engine can do with that prose. The result is hardcoded fiction masquerading as game content. This guide fixes that by explaining the engine's dynamic capabilities *before* you start writing — because knowing what the system can do should change what you decide to write.

**Audience:** Any agent authoring encounters, attachments, or prose content. Read this before the encounter-pipeline, attachment-pipeline, or prose-content-systems skills. This is not optional.

**Core principle:** If the prose can't change based on who's experiencing it, what happened before, or what happens after — you've written a book page, not game content. We're making a game.

## Post-Migration Format Baseline (THR-109)

`EncounterTemplate` is retired from authoring flow. Encounter content now ships through `UnifiedActionTemplate` only (including faction/guild templates and branching packets). If a document, prompt, or skill asks for `EncounterTemplate`, treat it as stale and update it.

Phase 1-5 migration audit callouts now codified in this guide:
- Encounter seeds (`encounter_seed`) are the default follow-on mechanism.
- Hidden marks (`hidden_mark`) are the default discoverable-secret mechanism.
- Intelligence grants (`intelligence`) are consumed by scoring, prose enrichment, and resolution-match traces.
- Reputation persistence should use both score deltas and tallies (`reputation_tally`) where long-memory matters.

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

**Hex-level prose uses a separate composer — not `enrichProse`:** As of THR-415, the `hex.survey` divine action emits a `survey_completed` TickEvent whose message is built by `composeSurveyPeopleProse` in `src/engine/surveyProseComposer.ts`. This is a hex-scoped prose composer (averaging location unrest, listing controlling factions) that operates on the graph directly and does not go through `proseEnrichment.ts`. If you add other hex-scoped revelation events (e.g. a HexChronicle people-layer), write a new composer in the same pattern rather than routing through `enrichProse`.

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

**For encounter aftermath authoring, use the typed aftermath effect kinds in Part 5 § "Aftermath Reaction Effect Types" (20 kinds).** Raw graph-mutation primitives are not exposed to authored aftermath — propose a new typed kind if you need one.

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

**Faction succession edges (THR-432):** Two new structural edge types are created by engine-side dispatch — not by authored aftermath:
- `will_succeed: agent → faction` — created by the `action.faction.anoint_successor` divine action via the `anoint_successor` GraphOp dispatched in `unifiedActionResolution.ts`. Stamps `anointedTick`, anointed by ascendant id.
- `leads: agent → faction` — set by `phaseFactionSuccession` (post-narrative slot) when a leader exit is detected and an anointed `will_succeed` candidate resolves. The edge is authoritative when present (read by `getAnointedLeaderId` in `factionNetwork.ts`); existing score derivation is the untouched fallback.

Authored aftermath cannot create these edges directly — they are created as side effects of divine action resolution and tick-phase succession. The `faction.encounter.inheritance` template (planted by the succession phase on the new leader) uses standard aftermath effects (`reputation_tally`, `recent_event`, `hidden_mark`, `encounter_seed`) for its accept/refuse reactions.

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

#### Intelligence is consumed in five places (THR-113, THR-140, THR-139)

Granting intelligence without consuming it is write-only theatre. The engine now closes the loop at five sites. As an author, you get this automatically — but knowing the sites tells you what prose can reference what.

| Hook | Where it fires | What it does |
|---|---|---|
| `scoring_boost` | `scoreAndSelect` in `encounterScoring.ts` | Candidates whose `templateId` / `locationId` / `targetAgentId` / region match an actionable record gain `INTEL_SCORING_BONUS` (default `0.25`). `intelBonus` is exposed on `ScoredCandidate` for trace inspection. |
| `prose_enrichment` | `enrichProse` in `proseEnrichment.ts` | `{intel:<category>}` placeholders resolve to the most recent record's label/detail/reliability. `{?knows_<category>}...{/knows_<category>}` and `{?no_<category>}...{/no_<category>}` conditionals gate whole sentences. |
| `resolution_match` | `observeResolutionIntelligence` after `consumeMatchingMarks` in GameView | Passive observation: when a resolved action matches any of the acting agent's records, a trace fires. No game-state mutation — this is the "I noticed" hook for auditing what intel actually paid off. |
| `difficulty_modifier` | `resolveUncontestedStep` in `unifiedActionResolution.ts` | Steps that opt in with `difficultyContext: 'intel_sensitive'` reduce effective difficulty by `INTEL_DIFFICULTY_BONUS` scaled by reliability (`reliable` full, `uncertain` half, `dubious` none). |
| `aftermath_prose` (THR-139) | `applyEncounterAftermathReaction` case `'intel_referenced_prose'` in `encounterAftermath.ts` | Authored "the intel paid off" chronicle line. When the actor holds a matching record, picks a prose variant by reliability band (`reliable` / `uncertain` / `dubious`) and appends a `narrative` `TickEvent` to `recentEvents` / `tickEvents`. Records are read, never consumed. The `dubious` band intentionally surfaces lines where the intel betrays the agent. Authors opt in per reaction; the 72-line shared pack lives in `src/data/intelligence-referenced-prose.ts`. |

Every consumption emits an `intelligence_referenced` trace with a `referencedBy` discriminator (`scoring_boost` | `prose_enrichment` | `resolution_match` | `difficulty_modifier` | `aftermath_prose`), the `recordId`, and the consuming context. Dedup is per-call (scoring loop and enrichProse each only emit once per unique record).

**Authoring `intel_referenced_prose` (THR-139):** Add the effect to a reaction alongside the existing `intelligence` grant. On the first run there's no prior intel, so the effect no-ops silently; on subsequent runs the matching record fires the band-appropriate line. Three pilots are wired today — `arcane-circle-encounter-content.ts` (`agent_network`), `builders-fellowship-encounter-content.ts` (`political_secret`), `encounter-anomaly-content.ts` (`cultural_knowledge`). Use them as authoring templates. Voice contract (Threadbare, 18-32 words/line, dubious shows betrayal) is in the prose-pack file's header comment.

**Author opt-in for resolution difficulty (THR-140):** the difficulty modifier is intentionally inert unless a step explicitly sets `difficultyContext: 'intel_sensitive'`. Use this on beats where prior reconnaissance should make execution easier (ambush prep, route interception, spy leverage). Leave it unset for beats where intelligence should shape discovery/prose only.

**Placeholder vocabulary for prose authors:**

| Placeholder | Resolves to | Silent fallback when record missing |
|---|---|---|
| `{intel:shrine_location}` | Record's `label` | Whole placeholder stripped |
| `{intel:shrine_location.detail}` | Record's `detail` | Stripped |
| `{intel:shrine_location.reliability}` | `"reliable"` / `"uncertain"` / `"dubious"` (thresholds `0.7` / `0.4`; non-finite → `dubious`) | Stripped |
| `{intel:shrine_location.acquiredTicksAgo}` | Ticks since the record was acquired (`tick − acquiredTick`, clamped ≥ 0). Resolves to `'0'` when acquired this tick. | Stripped |
| `{intel:shrine_location.acquiredDaysAgo}` | Game days since acquired (ticks ÷ `TICKS_PER_DAY`, floored). Resolves to `'0'` for intel less than one day old. | Stripped |
| `{?knows_shrine_location}…{/knows_shrine_location}` | Enclosed text if the agent has any record in that category | Enclosed text removed |
| `{?no_shrine_location}…{/no_shrine_location}` | Enclosed text if the agent has NO record in that category | Enclosed text kept |

All six `IntelligenceCategory` values are supported: `shrine_location`, `agent_network`, `trade_route`, `military_position`, `political_secret`, `cultural_knowledge`.

**Why this changes what you write:** Intelligence creates asymmetric knowledge — one agent knows something others don't. Now that knowledge *ranks their next encounter higher*, *shows up in their prose*, and *is noticed when they act on it*. Write reveal beats that call out the intel by category: "What {name} knew of {intel:trade_route} was already {intel:trade_route.acquiredDaysAgo} days stale." Write scenes where an uninformed agent fumbles: "`{?no_political_secret}{name} still did not know who had sent the steward.{/no_political_secret}`" A spy encounter that grants intelligence about a rival's plans is more systemically alive than one that grants a generic sword — and the rival's plans will now *influence what the agent does next*.

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

### Capability 10: Encounter Foreshadowing — What the Agent Believes Before They Arrive (THR-389)

When the player clicks an encounter row in the agent profile panel, the engine generates 2–4 sentences of foreshadowing prose showing what the agent believes or imagines about the encounter they're moving toward. This runs **on click**, never per-tick — it's a UI-layer resolver, not an orchestrator phase.

**The content surface:**

```typescript
// On UnifiedActionTemplate (src/types/unifiedAction.ts):
foreshadowing?: {
  variants: ForeshadowingVariant[];   // Authored per encounter
  fallback?: string;                  // Encounter-specific fallback (uses placeholders)
};

// Each variant:
{
  id: string;               // e.g. 'plague_outbreak.healer_curiosity'
  template: string;         // Prose template with {name.first}, {pronoun.subject}, {encounter.heading}
  when: {
    intelligenceTier?: 'unknown' | 'rumor' | 'briefed' | 'expert';
    topMotive?: 'awareness' | 'threat' | 'opportunity' | 'duty' | 'curiosity';
    dominantReach?: string;           // e.g. 'eye', 'heart', 'shadow'
    hasMark?: string;                 // Phase 3 — deferred
    hasReputation?: string;           // Phase 3 — deferred
  };
}
```

**Available placeholders in foreshadowing templates:**

| Placeholder | Resolves to |
|---|---|
| `{name.first}` | First word of agent name |
| `{encounter.heading}` | Encounter template `name` field |
| `{pronoun.subject}` | `he` / `she` / `they` (from agent gender) |
| `{pronoun.subject_capitalized}` | Capitalized subject pronoun |

**Variant selection:** The engine picks the most-specific matching variant (most conditions specified in `when`). Ties at the same specificity are broken deterministically with PRNG seeded from `agentId + encounterId`. If no variant matches, falls back to `foreshadowing.fallback`, then to `GENERIC_FORESHADOWING_FALLBACK`.

**Phase 1 signals (current):**
- `intelligenceTier`: always `'unknown'`
- `topMotive`: always `'awareness'`
- `dominantReach`: encounter template's `reach` field (e.g. `'eye'` for plague_outbreak)

Phase 3 will derive these from actual agent intelligence records and encounter-pool funnel scores. The variant system is already live — content authored now will automatically use real signals in Phase 3 without changes.

**Why this changes what you write:** When authoring `foreshadowing` variants, you're writing inside an agent's head — what they've heard, what they fear, what they hope for. The prose should reflect the agent's epistemic state, not objective facts about the encounter. A variant for `intelligenceTier: 'rumor'` should feel uncertain and second-hand. A variant for `topMotive: 'threat'` should feel defensive. The encounter itself hasn't happened yet — the agent is projecting.

**Authoring a new encounter with foreshadowing:**

```typescript
// In encounter-content.ts:
{
  id: 'encounter.guild_audition',
  name: 'Guild Audition',
  reach: 'gold',
  // ...
  foreshadowing: {
    variants: [
      {
        id: 'guild_audition.nervous',
        when: { intelligenceTier: 'unknown' },
        template: "{name.first} has heard the guild judges three times — once at dawn, once at midday, once in firelight. {pronoun.subject_capitalized} rehearses {encounter.heading} the way a soldier rehearses a retreat route: not for confidence, but for the comfort of having a plan.",
      },
      {
        id: 'guild_audition.confident',
        when: { intelligenceTier: 'briefed', topMotive: 'opportunity' },
        template: "{name.first} knows what the {encounter.heading} judges want. {pronoun.subject_capitalized} has made it their job to know. The question isn't whether {pronoun.subject} can impress them — it's which version of impressive to show.",
      },
    ],
    fallback: "{name.first} thinks about {encounter.heading} the way {pronoun.subject} thinks about most things: carefully, and too much.",
  },
}
```

**Where to find the implementation:** `src/engine/foreshadowing/getEncounterForeshadowing.ts` for the resolver, `src/engine/foreshadowing/constants.ts` for the cache cap, `src/types/unifiedAction.ts` for the `EncounterForeshadowing` + `ForeshadowingVariant` interfaces.

---

## Part 3: The Wiring Checklist — Ask These Before You Write

Before writing any encounter, answer these questions. If the answer to most of them is "not applicable," you may be writing a book page, not game content.

### Before the First Word

1. **Who is this encounter for?** Not just "any agent" — what reach domain, what capability tier, what faction or archetype? This determines `locationSubtypes`, `actorAffinities`, `requiredTargetTraits`, `crudType`, and `motivations`. These fields aren't metadata — they're the scoring system's input for deciding whether this encounter surfaces for the right agents.

2. **What graph state makes this encounter interesting?** Does the agent have allies who could be implicated? Rivals who could interfere? A faction that would care? Artifacts that change the meaning of the scene? **Write scenes where graph state matters** — use conditional blocks to make the prose respond to it.

3. **What should persist after this encounter?** Not just "reputation goes up." What new edges exist in the graph? What hidden marks track secrets? What seeds plant future stories? What intelligence does the agent now possess? **If nothing persists except a reputation number, the encounter is ephemeral.**

### During Writing

4. **Are the narrative fields templates or strings?** Every `narrativeTemplate` field in steps (and `intent` in aftermath reactions) should use enrichment placeholders where the agent's identity, relationships, or possessions would change the emotional texture. `{name}` is the minimum. Conditional blocks (`{?has_faction}...{/has_faction}`) are where the real dynamism lives.

5. **Do the outcomes use different systemic consequences?** Success and failure should produce different *kinds* of persistence, not just different prose. Success might create an edge and seed a follow-up. Failure might plant a hidden mark and damage reputation. **Different outcomes should leave different structural fingerprints.**

6. **Are the aftermath reactions wired?** Each reaction in the aftermath config should declare its effects explicitly: `reputation_score`, `reputation_tally`, `faction_reputation_gain`, `encounter_seed`, `hidden_mark`, `intelligence`, `recent_event`. If a reaction has no effects, it's flavor text — and flavor text that doesn't change the world isn't pulling its weight in a game.

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

All encounters use `UnifiedActionTemplate` (migrated as of THR-108). `EncounterTemplate` no longer exists.

| Field | Type | What It Controls |
|---|---|---|
| `locationSubtypes` | `string[]` | Which location subtypes surface this encounter |
| `actorAffinities` | `ActorType[]` | Which entity types can perform this (`'individual'`, `'faction'`, etc.) |
| `requiredTargetTraits` | `string[]` | Target node must have all listed traits (AND logic) |
| `requiredNodeProperties` | `Record<string, unknown>` | Target node property key/value pairs that must match |
| `crudType` | `'create'\|'read'\|'update'\|'delete'` | Determines motivation alignment scoring and reputation polarity heuristic |
| `motivations` | `ValuePair[]` | Which axiological value pairs drive agent interest |
| `rarityTier` | `1\|2\|3\|4` | Narrative significance (1=common, 4=legendary); drives visual treatment and unlock logic |
| `reach` | `ReachDomain` | Primary capability domain tested across all steps |
| `sphereAffinity` | `SphereName` | Resonance scoring with hex sphere and world-soul |
| `intrinsicTier` | `AttentionTier` | `'background'` / `'shaping'` / `'story_beat'` attention tier |
| `reputationPolarity` | `'positive' \| 'negative'` | Optional explicit override; if omitted, derived from `crudType` |

### Step-Level Fields

| Field | Type | What It Controls |
|---|---|---|
| `reach` | `ReachDomain` | Which capability domain resolves this step |
| `difficulty` | `number` | **0–1 scale** → sigmoid → probability (NOT 0-100) |
| `duration` | `{ min: number, max: number }` | Tick range to resolve (e.g. `{ min: 1, max: 2 }`) |
| `failBehavior` | `'continue_weakened' \| 'fail_action'` | What happens on step failure: continue with disadvantage or end encounter |
| `onSuccess` | `GraphOp[]` | Graph mutations applied immediately on success (usually `[]` for simple encounters) |
| `onFailure` | `GraphOp[]` | Graph mutations applied immediately on failure (usually `[]` for simple encounters) |
| `narrativeTemplate` | `string` | Scene-setting prose; supports all enrichment placeholders |
| `successAfterimage` | `string` | Brief outcome shown in Scene So Far on success (1-2 sentences) |
| `failureAfterimage` | `string` | Brief outcome shown in Scene So Far on failure (1-2 sentences) |
| `successMetadata` | `ActionStepOutcomeMetadata` | Mechanical consequence of success: rewardPool, reputationDelta, tierPromotionEligible |
| `failureMetadata` | `ActionStepOutcomeMetadata` | Mechanical consequence of failure: reputationDelta |

### Outcome Metadata Fields (ActionStepOutcomeMetadata)

| Field | Type | What It Controls |
|---|---|---|
| `reputationDelta` | `number` | Direct reputation score change on this outcome |
| `tierPromotionEligible` | `boolean` | Allows capability tier promotion if this outcome fires |
| `rewardPool` | `RewardPoolRecipe` | Attachment pool draw on success |

### Aftermath Reaction Effect Types

| Effect Kind | Purpose | Key Fields |
|---|---|---|
| `reputation_score` | Direct reputation delta (actor or faction) | `delta`, `targetAgentId?`, `targetFactionId?` |
| `reputation_tally` | Named counter accumulation — key MUST be a valid `${reach}.positive` or `${reach}.negative` (8 reach domains). Off-axis keys are silently dropped with `aftermath_invalid_tally_key` trace. | `key`, `delta`, `targetAgentId?`, `targetFactionId?` |
| `faction_reputation_gain` | Grow/shrink a faction member's standing directly. Agent must have a `member_of` edge to the faction; non-members are silently skipped. Amount clamped to [-1, +1]. Emits `faction_reputation` trace with `cause:'encounter_aftermath'`. | `factionId`, `amount` |
| `reputation_set` | Absolute reputation assignment (hard reset) | `value` (clamped [0,1]), `targetAgentId?`, `targetFactionId?` |
| `encounter_seed` | Plant future encounter | `templateId` or `encounterFamily`, `delayTicks`, `seedLabel` |
| `hidden_mark` | Track discoverable secret on an agent | `category`, `severity`, `label`, `revealFamilies`, `targetAgentId?` |
| `intelligence` | Grant knowledge to an agent | `category`, `label`, `detail`, `targetEntityId`, `reliability`, `targetAgentId?` |
| `intel_referenced_prose` (THR-139) | Authored "the intel paid off" chronicle line — fires when actor holds a matching record; reliability band picks one of three prose variants; record is read, not consumed | `category`, `prose: { reliable, uncertain?, dubious? }`, `significance?`, `targetAgentId?` |
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
| `'alone'` | No allies or enemies share the actor's exact `located_at` node (see Capability 11) |
| `'outnumbered'` | `enemies > allies + 1` at the actor's location (see Capability 11) |

```typescript
// Effect fires only when the actor is reputation-worthy
{ kind: 'reputation_score', delta: 0.1, when: 'reputation_above:0.6' }

// Effect fires only when wounded
{ kind: 'encounter_seed', encounterFamily: 'revenge', seedLabel: 'They remember the wound', delayTicks: 12, priority: 1.5, when: 'health_low' }
```

See **Capability 11** for full documentation on `alone` and `outnumbered`.

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

### Capability 11: `alone` and `outnumbered` Predicates — Co-Location Arithmetic (THR-144)

Two structural predicates that evaluate the actor's immediate scene. Use them to write content that plays differently when a character faces a crowd versus a solo journey.

#### How co-location is determined

An *ally* or *enemy* is any actor sharing the **exact same `located_at` node** as the subject. An agent at a sublocation is NOT co-located with an agent at the parent location — they occupy different scene nodes. Hex-level proximity does not count (a cave within the same hex is a different scene).

#### Classification rules (first match wins)

| Check | Result |
|-------|--------|
| Direct `relates_to` edge between the two actors (either direction) with `sentiment ≥ +0.35` | **ally** |
| Direct `relates_to` edge with `sentiment ≤ −0.35` | **enemy** |
| Both actors share the same `factionId` property | **ally** |
| The two actors belong to different factions that have a `relates_to` edge with `sentiment ≥ +0.35` | **ally** |
| The two actors belong to different factions with `relates_to sentiment ≤ −0.35` | **enemy** |
| None of the above | **neutral** (does not affect either count) |

#### Predicate semantics

| Predicate | True when |
|-----------|-----------|
| `'alone'` | `allyCount === 0 && enemyCount === 0` — no allies or enemies at the scene node (neutrals don't count) |
| `'outnumbered'` | `enemyCount > allyCount + 1` — strictly more enemies than allies plus the actor themselves |

`PredicateContext` exposes `allyCount` and `enemyCount` as raw numbers — future parameterized predicates like `ally_count_above:2` can use them without rebuilding the traversal.

#### Example usage

```typescript
// Last Stand — bonus fires only when facing multiple enemies
{ kind: 'stat_bonus', reach: 'iron', value: 0.2, when: 'outnumbered' }

// Lone Walk — reflective prose branch fires only when no one else is present
{ kind: 'encounter_seed', encounterFamily: 'reflection', seedLabel: 'The road listens', delayTicks: 6, when: 'alone' }
```

#### Important constraints

- **Sub-locations count separately.** An agent at a tavern sublocation is alone with respect to anyone at the parent tavern location node.
- **Sentiment threshold is ±0.35.** Mid-range sentiment (−0.34 to +0.34) is neutral. Calibration constant: `ALLY_SENTIMENT_THRESHOLD`, `ENEMY_SENTIMENT_THRESHOLD` in `src/data/effect-constants.ts`.
- **Outnumbered margin is 1.** A 2v2 scene is NOT outnumbered. A 3v1 scene IS. Constant: `OUTNUMBERED_MARGIN`.
- **Faction-less strangers are neutral.** Two actors with no faction and no `relates_to` edges are neither allies nor enemies.

---

### Capability 12: Secrets & Favors — Persistent Social Leverage (THR-30)

Two graph edge types that model what agents know about each other and what debts they carry. Both feed into social encounter resolution as leverage bonuses.

#### `knows_secret_of` edge (discoverer → subject)

An agent who learns a secret about another agent gains a leverage advantage in social encounters. Secrets are typed and have magnitude (0.05–1.0).

**Secret types and what produces them:**

| Type | Source | Produces when |
|------|--------|--------------|
| `hidden_weakness` | Observation, any source | Fallback — always available |
| `past_crime` | Spy debrief, observation | Agent has hostile `relates_to` edges or criminal faction membership |
| `hidden_allegiance` | Confession, spy debrief | Agent belongs to 2+ factions |
| `financial_desperation` | Tavern gossip, observation | Agent has `owes_favor` edges with high magnitude |
| `shameful_origin` | Confession | Randomly surfaced biographical secret |
| `forbidden_knowledge` | Archive access, spy debrief | Agent in knowledge/arcane factions |

**How to wire secret discovery from encounter content:**

Two surfaces:
1. **Template metadata** (`secretDiscovery` on the template step): set on `UnifiedActionTemplate` — engine automatically calls `generateSecret` + `createSecretEdge` on step success.
2. **Aftermath effect kind** (`secret_discovery`): explicit effect in `aftermathConfig.reactions[].effects` — use for story-significant discoveries with more control over timing.

```typescript
// Template metadata approach (auto-fires on step success):
steps: [{
  ...,
  secretDiscovery: { source: 'observation', magnitudeBonus: 0.1 },
}]

// Aftermath effect approach (fires at reaction resolution):
effects: [{ kind: 'secret_discovery', source: 'spy_debrief' }]
```

**Leverage bonus:** `secret.magnitude × SECRET_LEVERAGE_MULTIPLIER (0.30)`. Only unrevealed secrets contribute.

**Cap:** `MAX_SECRETS_PER_AGENT = 8` total outgoing `knows_secret_of` edges per discoverer. Capped edges are silently dropped.

#### `owes_favor` edge (debtor → creditor)

An agent who receives significant aid owes a favor to the helper. The creditor gains leverage over the debtor in future encounters.

**How to wire favor creation from encounter content:**

Two surfaces:
1. **Template metadata** (`favorGeneration`): auto-fires on step success.
2. **Aftermath effect kind** (`favor_creation`): explicit, controlled timing.

```typescript
// Template metadata:
steps: [{
  ...,
  favorGeneration: { onSuccess: true, magnitudeRange: [0.2, 0.4], context: 'healed their wound' },
}]

// Aftermath effect:
effects: [{ kind: 'favor_creation', magnitudeRange: [0.1, 0.3], context: 'gave shelter in the storm' }]
```

**Leverage bonus:** `favor.magnitude × FAVOR_LEVERAGE_MULTIPLIER (0.25)`. Only unredeemed, unbroken favors contribute.

**Cap:** `MAX_FAVORS_PER_AGENT = 6` active outgoing `owes_favor` edges per debtor.

#### Divine GraphOps for Secrets & Favors

Three GraphOps are available in `onSuccess` / `onFailure` step arrays:

| Op | What it does | Requires |
|----|-------------|---------|
| `reveal_secret` | Marks the actor's highest-magnitude unrevealed secret about target as revealed (removes leverage) | Actor must hold a secret about target |
| `call_in_favor` | Redeems the target's best unredeemed favor owed to the actor | Target must owe actor a favor |
| `plant_secret` | Creates a fabricated `knows_secret_of` edge (actor→target) with `planted: true` | No prerequisites |

```typescript
onSuccess: [{ op: 'reveal_secret', target: '$target' }]
onSuccess: [{ op: 'call_in_favor', target: '$target' }]
onSuccess: [{ op: 'plant_secret', source: '$actor', target: '$target',
              properties: { magnitude: 0.5, secretType: 'past_crime' } }]
```

#### Important constraints

- **Edge direction is semantic.** `knows_secret_of` source=discoverer, target=subject. `owes_favor` source=debtor, target=creditor. Never reverse these.
- **`reveal_secret` requires the actor to hold the secret.** If the actor doesn't personally have a `knows_secret_of` edge to the target, the op fails gracefully.
- **`call_in_favor` only redeems favors owed to the actor.** A debtor's favors to third parties cannot be redeemed by the actor.
- **Leverage is computed fresh per encounter.** There's no cached leverage value — it's recalculated from live graph edges at the start of each social encounter resolution.

#### How to verify

Filter DebugPanel Trace tab on `secret_discovered` + `favor_created`. Open DebugPanel → Secrets & Favors tab for a per-agent view of all edges. AgentDetailPanel shows the LeverageSection when the agent has any active secrets or favors.

---

---

### Capability 13: Stateful Effect Shells — Hidden State That Evolves Through Play (THR-53)

Three shell primitives let an encounter or attachment carry state that evolves as actions unfold:

**flip_table** — A binary (or small-N) hidden state machine attached to a template. Each config has a set of `variants` (with weights), an `initialState` (`front`/`flipped`/`revealed`), and a `flipTrigger`. The `step_outcome` trigger fires inside `executeStepResult` when the specified step resolves with any of the listed outcomes. Use it for: fate cards, sealed letters, deferred reveals, loot-box tension, branching destiny.

```ts
flipTables: [{
  id: 'sealed_fate',
  variants: [{ key: 'boon', weight: 2, label: 'Fortune' }, { key: 'bane', weight: 1, label: 'Doom' }],
  initialState: 'front',
  flipTrigger: { kind: 'step_outcome', stepIndex: 1, outcomes: ['success', 'critical_success'] },
  revealPolicy: 'on_trigger',   // or 'immediate' to pick variant at first flip
  persistence: 'must-persist',
}]
```

`revealPolicy: 'immediate'` selects a variant the first time the trigger fires (front→flipped). `revealPolicy: 'on_trigger'` defers variant selection to the second trigger (flipped→revealed). Runtime state lives in `GameState.flipTableStates` and is visible in DebugPanel → **Shells** tab.

**duplicate_gain_policy** (on `PossessionNodeProperties`) — Controls what happens when an actor tries to gain an attachment they already hold. Options: `stack` (multiple copies), `refresh` (reset duration), `ignore` (no-op), `flip` (trigger a flip table on the held copy), `worsen` (apply escalating negative effects, up to `maxApplications`). Default is `refresh`.

**result_bands** — A ladder of threshold→outcome mappings on a template. When a step resolves, the margin is compared against declared bands to select a tier. Bands declare effects and optional follow-on tags. Runtime selections are recorded in `GameState.resultBandHistory`. Hooks: `selectResultBand` / `buildBandSelectionRecord` in `effectShellRuntime.ts`.

#### How to verify

Open DebugPanel → **Shells** tab to see all active flip table runtime states (state, variant key, owner actor, last updated tick). Filter Trace Feed on `effect_shell` to see every transition as it fires.

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
| Secrets & favors (THR-30) | `secret_discovered`, `favor_created` |
| Graph mutation & UI choice flow | `graph_op_execution`, `choice_set_player_resolved`, `choice_set_player_dismissed` |
| Complication outcomes (THR-20) | `complication_selection` |
| Effect shell transitions (THR-53) | `effect_shell` (subkind: `flip_revealed`, `gate_transition`, `band_selected`, `duplicate_policy_applied`) |

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
The `narrativeTemplate` field contains prose with no placeholders, no conditionals, no reference to the agent's actual state. Every agent reads the same text. **Fix:** Use at minimum `{name}`, `{they}/{them}/{their}`, and one conditional block per narrative field. If the prose doesn't change based on who's experiencing it, ask why.

### Anti-Pattern 3: "Aftermath as Epilogue"
Aftermath reactions have evocative prose but no effects array, or only a `recent_event`. The aftermath doesn't change the world — it just describes what happened. **Fix:** Every aftermath reaction should have at least one effect that creates persistent state: a seed, a mark, a tally, or intelligence.

### Anti-Pattern 4: "Seeds Without Templates"
An encounter plants seeds using `encounterFamily` only, with no `templateId`. Since family-matching is v1/narrative-only, the seed emits a narrative event but doesn't spawn an actual follow-up encounter. **Fix:** Use `templateId` for guaranteed follow-up spawning. Use `encounterFamily` only when you intentionally want a narrative event without a specific follow-up.

### Anti-Pattern 5: "Scoring Blindness"
The author doesn't set `crudType`, `motivations`, `locationSubtypes`, or `actorAffinities` thoughtfully. The encounter exists in the content registry but never surfaces for appropriate agents because the scoring system can't match it. **Fix:** Think about scoring as design. A festival encounter should be `crudType: 'update'` with `motivations: [['loyalty', 'ambition']]` and `locationSubtypes: ['market', 'settlement']`. These fields determine whether the encounter finds its audience.

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

---

## Appendix: Culture-Seeded Naming (THR-15, 2026-04-18)

**Location names, agent names, demonyms, and homeland names are now culture-phonetic.** Each culture at worldgen time builds a deterministic `CulturePhoneticSignature` (vowel inventory, onset/coda consonants, syllable templates, orthography style) seeded from its foundation + sphere + demonym hash. All name generation routes through the layered picker in `pickCulturalName()`:

1. 35% chance: phonetic generator first
2. Curated pool (foundation + sphere flavor words)
3. Phonetic fallback (if pool exhausted)
4. Generic fallback, then `Wanderer-N`

**What this means for content authors:**
- Agent names will be audibly distinct per culture — Chaos/Force cultures sound harsh and percussive; Light/Spirit cultures are vowel-rich and open-syllable.
- Settlement names seeded by nearby culture phonetics — a Chaos/Matter frontier town won't sound like an Order/Spirit holy city.
- Demonyms and homeland names are phonetically consistent with the culture's agent names.
- `{culture}` placeholder in prose resolves to the demonym — which is now phonetically generated, not a template word.

**Debug Panel Cultures tab** (`DebugTabContent` → `'cultures'` → `CulturePhoneticsInspector`) shows live phoneme inventory + sample names per culture with Re-roll samples.


---

## 8. Phase Story-Beats (THR-254)

Phased events (e.g. The Chain Weakens, THR-225) emit `ChronicleEntry` records when a phase activates. Since THR-254, these entries carry dual-voice content — `poetProse` (divine/cosmic register) and `witnessFacts` (mortal/grounded bullets) — sourced from a static template registry.

### How to author phase story-beats

1. **Define templates** in a per-composition file: `src/data/story-beat-templates/<your-event>.ts`.
   - Implement `CompositionStoryBeatTemplate` (from `chain-weakens.ts`).
   - Provide both `poetProse` and `witnessFacts` when possible.
   - Set `defaultVoice: "divine" | "mortal"` to guide the phase runner.
   - Set `sphere: SphereName` (never `"void"` — map to `"entropy"` or another canonical sphere).
   - Set `mood` (e.g. `"uneasy"`, `"dread"`, `"resolute"`).
2. **Register templates** by adding them to `STORY_BEAT_TEMPLATE_REGISTRY` in `src/data/story-beat-templates/index.ts`.
3. **Wire to phases** in the recipe (`.recipe.ts`): each `storyBeat` block takes an optional `voice: "divine" | "mortal"` field that overrides the template's `defaultVoice`.

### Voice convention

| Voice | ChronicleEntry field | Register | When to use |
|---|---|---|---|
| `divine` | `poetProse` | Cosmic/emotional, italic serif | The ascendant perceives before mortals name it |
| `mortal` | `witnessFacts` | Factual bullets, body sans | Ground-level action, mortal agency |

Both fields can be populated regardless of `voice` hint — the hint is a lead indicator, not an exclusion.

### Fail-soft

If a `storyBeat.template` id is not in the registry, `makePhaseChronicleEntry` falls back to `phase.rationale` as prose and emits a `composition.story_beat_template_missing` trace. No crash.

### Constants

| Constant | Default | File |
|---|---|---|
| `STORY_BEAT_DEFAULT_MOOD` | `"ominous"` | `src/data/composition-config.ts` |
| `STORY_BEAT_DEFAULT_SPHERE` | `"entropy"` | same |
| `STORY_BEAT_DEFAULT_VOICE` | `"divine"` | same |
