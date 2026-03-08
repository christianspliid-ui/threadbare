# Content Population Plan — Horizontal Slice

**Date:** 2026-03-08
**Goal:** Populate all content types with enough variety that every system interaction is visible in a playthrough. Good-enough quality, broad coverage, expand thin taxonomies. Deep polish and automated generation come later.

---

## 1. Current State Summary

The game has 11 content packages (5,055 lines), 203 graph nodes across 18 categories, and 290 typed edges. All major *systems* are implemented and tested (~1,646 tests). The bottleneck is **instance population** — systems are wired but the content they consume is thin, leading to repetitive playthroughs.

**What's rich:** Archetypes (19 fully enriched), culture modifiers (34 composable sets), mandates (12 templates), opposition scoring, disposition/cooperation, scry courts.

**What's thin:** Prose templates (few variants per event type), inspection content (no chronicler vignettes), cultural prose (data exists but no prose templates use it), ordeals (designed but unimplemented), location/sublocation flavor (structural only), artifact lore (patterns but no instances), rival personality (generic action text).

**What's missing entirely:** Ordeal system (types, engine, content), chronicler vignettes, doom-stage prose coloring, seasonal atmosphere, sphere influence flavor events, echo flavor texts.

---

## 2. Architecture: Playthrough-Driven Horizontal Layers

Content is organized by what a player experiences, not by content type. Each layer is independently playtest-verifiable.

```
Layer 1: Minimum Visible Playthrough
  └─ Can you watch 100 ticks and see a coherent, varied story?

Layer 2: Inspection Content
  └─ Can you click on anything and read evocative flavor text?

Layer 3: Replay Variety
  └─ Does the second playthrough feel different from the first?

Layer 4: Connective Tissue
  └─ Do systems feel like they talk to each other?
```

---

## 3. Layer 1 — Minimum Visible Playthrough

The content needed so a 100-tick playtest reads like a coherent story with agent evolution, not repetitive stubs.

### 3.1 World Model Taxonomy Expansion

Expand thin graph categories in `world-model.json`:

**Location types** (7 → 15):
- Add: `port`, `mine`, `academy`, `fortress`, `marketplace`, `grove`, `cavern`, `monastery`
- Each needs: display name, description, default sub-location set, terrain-validity edges

**Sublocation types** (7 → 14):
- Add: `forge`, `archive`, `prison`, `garden`, `throne-room`, `docks`, `crypt`
- Each needs: display name, description, parent-location-type edges

**Region types** (5 → 9):
- Add: `wilderness`, `contested-zone`, `holy-ground`, `trade-route`
- Each needs: display name, description, terrain affinity edges

**Trait categories** (6 × 5 = 30 → 6 × 8 = 48):
- Add 3 new traits per existing category (scar, reputation, mastery, innate, destiny, condition)
- Each needs: display name, description, sphere affinity edges, reach validity edges
- Examples: scar — "Burned", "Hollow-Eyed", "Dream-Touched"; mastery — "Siege-Breaker", "Tongue-of-Silver", "Star-Reader"

**Content:** ~38 new graph nodes + associated edges. Update `world-model.json`, regenerate Obsidian vault.

### 3.2 Ordeal System

The critical missing piece — without ordeals, agents cannot evolve through narrative challenges.

**Types** (`src/types/ordeal.ts`):

```
OrdealDefinition {
  id, name, locationTypes[], encounters[], triggerConditions,
  culturalAffinity?, sphereAffinity?, reachPrimary, reachSecondary
}

EncounterDefinition {
  id, sublocationId, narrative, reach, difficulty,
  onSuccess: EncounterOutcome, onFailure: EncounterOutcome
}

EncounterOutcome {
  narrative, traitModifiers?, reputationDelta?, tierPromotionEligible?
}

OrdealProgress {
  ordealId, actorId, currentEncounterIndex, history[],
  status: 'active' | 'abandoned' | 'completed', startedTick
}
```

**Ordeal content** (`src/data/ordeal-content.ts`) — 10 ordeal templates:

| Template | Location Types | Encounters | Primary Reach | What It Tests |
|----------|---------------|------------|---------------|---------------|
| The Deep Descent | dungeon, cavern | entrance → trapped passage → beast's lair → treasure vault | Iron / Shadow | Courage and cunning |
| The Rite of Ascension | temple, sacred-site | purification → trial of faith → inner sanctum → revelation | Veil / Heart | Devotion and sacrifice |
| The Grand Bargain | marketplace, port | find dealer → appraise → negotiate → seal the deal | Gold / Eye | Wit and greed |
| The Forbidden Text | academy, library | gain access → decipher → comprehend → transcend | Eye / Veil | Knowledge and hubris |
| The Siege Within | fortress, tower | infiltrate → navigate → confront → claim | Iron / Shadow | Strength and resolve |
| The Green Trial | grove, sacred-site | commune → endure → sacrifice → bloom | Flesh / Star | Patience and surrender |
| The Hollow Deep | mine, cavern | descend → navigate darkness → extract → escape | Stone / Star | Endurance and risk |
| The Silent Way | monastery | submit → fast → meditate → emerge | Heart / Mind | Discipline and humility |
| The People's Judgment | settlement | accused → testify → verdict → consequence | Heart / Gold | Persuasion and honor |
| Echoes of the Fallen | ruin | enter → witness → resist → reclaim | Spirit / Time | Memory and will |

Each template: 3 encounters average × (success prose + failure prose + difficulty + trait delta) = ~60 encounter prose entries.

**Cultural ordeal variants** — 6 modifier overlays:
- Chaos cultures re-skin ordeals as violent/unpredictable
- Order cultures re-skin as procedural/ritualized
- Light cultures re-skin as revelatory/public
- Darkness cultures re-skin as secretive/solitary
- Creation sphere influences encounter flavor (Force ordeals are physical, Mind ordeals are intellectual, etc.)
- These are vocabulary overlays on the 10 generic templates, not separate ordeals

**Engine** (`src/engine/ordeal.ts`):
- `generateOrdealsForLocation()` — selects templates matching location type + culture + sphere
- `initiateOrdeal()` — creates OrdealProgress, adds to game state
- `resolveEncounter()` — uses existing sigmoid → d100 resolution system
- `advanceOrdeal()` — moves to next encounter or completes
- `abandonOrdeal()` — agent gives up (low Maslow needs override)
- `getAvailableOrdeals()` — what can an agent attempt at their current location

**Orchestrator integration:**
- New `phaseOrdealProgression` tick phase after agent actions
- Action selection pipeline: new "Pursue Ordeal" action option in self-actualization Maslow tier
- Trace category: `ordeal_resolution` for debug panel

**UI:**
- Replace LocationView placeholder with active ordeal list + progress indicators
- Ordeal completion events appear in NarrativeFeed

### 3.3 Action Prose Template Expansion

Currently 15 routine + 9 notable templates. Expand:

**New routine variants** — 3 additional per existing event type:
- `action_resolved` (3 new), `action_failed` (3), `action_critical` (3), `trait_acquired` (3), `tier_transition` (3), `divine_intervention` (3), `contested_action` (3), `actor_death` (3), `doom_escalation` (3), `mandate_stage` (3), `trait_lost` (3), `dilemma_mutual_trust` (3), `dilemma_betrayed` (3), `dilemma_exploitation` (3), `dilemma_mutual_distrust` (3)
- Total: 45 new routine templates

**New notable variants** — 2 additional per existing type:
- 9 types × 2 = 18 new notable templates

**New event types** — 4 types that don't exist yet:
- `faction_formed` (2 routine + 1 notable)
- `culture_clash` (2 routine + 1 notable)
- `migration` (2 routine + 1 notable)
- `construction_complete` (2 routine + 1 notable)
- `ordeal_encounter_success` (2 routine + 1 notable)
- `ordeal_encounter_failure` (2 routine + 1 notable)
- `ordeal_completed` (2 routine + 1 notable)
- `ordeal_abandoned` (2 routine + 1 notable)
- Total: 16 routine + 8 notable for new types

### 3.4 Agent Lifecycle Prose

`agentLifecycle.ts` handles death/birth/migration mechanically. Add prose variety:

**Death templates** (5, by cause):
- Age/natural, combat, betrayal, doom-event, sacrifice
- Each: 2-3 sentence template with sphere-word slots

**Birth templates** (3):
- Settlement growth, faction recruitment, wanderer arrival

**Migration templates** (3):
- Exile, opportunity-seeking, cultural pull

### 3.5 Doom Stage Prose Coloring

7 doom stages exist but prose is tone-deaf to impending apocalypse.

**`DOOM_VOCABULARY`** — parallel to `SPHERE_VOCABULARY`:
- Per stage: 5 adjectives, 5 verbs, 3 nouns, 1 atmosphere phrase
- Stages: whispers, signs, tremors, cracks, the breaking, the breach, the unmaking
- Routine/notable template selection consults doom stage for atmospheric word injection

### 3.6 Layer 1 Content Totals

| Item | New entries | Format |
|------|------------|--------|
| Graph nodes (locations, sublocations, regions, traits) | ~38 nodes + edges | world-model.json |
| Ordeal templates | 10 templates, ~30 encounters, ~60 prose entries | ordeal-content.ts |
| Cultural ordeal variants | 6 overlay sets | ordeal-content.ts |
| Ordeal engine | ~400 lines | ordeal.ts |
| Routine prose templates | 45 + 16 = 61 new | narrative-content.ts |
| Notable prose templates | 18 + 8 = 26 new | narrative-content.ts |
| Lifecycle prose | 11 templates | narrative-content.ts |
| Doom vocabulary | 7 stages × word banks | doom-content.ts |
| **Total new prose entries** | **~165** | |

---

## 4. Layer 2 — Inspection Content

What the player sees when they click on things. Currently structural data with no flavor.

### 4.1 Chronicler Vignette Templates

The "third voice" of the game — wry, historical, faintly editorial. Completely missing.

**New content** (`src/data/chronicler-content.ts`):

15 vignette templates, one per inspectable context type:

| Context Type | Example Opening | Slot Variables |
|-------------|-----------------|----------------|
| location | "They built {name} where the {terrain} met the {sphere} currents..." | name, terrain, sphere, age |
| terrain | "The {terrain} here has a memory longer than any {culture}..." | terrain, culture, sphere |
| settlement | "{name} grew from {origin} — a {culture} answer to {need}..." | name, origin, culture, need |
| faction | "The {faction} began as {origin}, though none remember that now..." | faction, origin, leader, sphere |
| agent | "{name} carries {archetype_tone} — the kind that {reach} rewards..." | name, archetype, reach, trait |
| artifact | "It was made in {era}, when {sphere} ran thick as blood..." | era, sphere, material, purpose |
| sacred-site | "Pilgrims once came here for {sphere}. Now only {doom_stage} remains..." | sphere, doom_stage, culture |
| ruin | "Before the {doom_event}, this was {original_purpose}..." | doom_event, original_purpose |
| cultural-practice | "The {culture} call it {practice_name} — outsiders call it {outsider_word}..." | culture, practice, outsider_view |
| historical-event | "In the {ordinal} cycle, when {sphere} was ascendant..." | cycle, sphere, actors |
| trait | "They say those with {trait} can {ability} — and sometimes do..." | trait, ability, consequence |
| sublocation | "The {sublocation} smells of {material} and {sphere_noun}..." | sublocation, material, sphere |
| region | "This stretch of {terrain} belongs to no one — or to {culture}, depending..." | terrain, culture, contested |
| sphere-influence | "Where {sphere} gathers, {phenomenon} follows..." | sphere, phenomenon, effect |
| rival-god | "{rival_name} watches from {domain}. Their {behavior} is patience itself..." | rival, domain, behavior |

Each: 2-3 sentences, wry tone, slot variables filled from game state.

### 4.2 Sub-location Flavor Text

For all 14 sublocation types (7 existing + 7 new from Layer 1):

- 2-3 prose sentences per type
- Sphere-sensitive word slots: a forge under Force influence reads differently than under Entropy
- Add `flavorTemplate` field to sublocation entries in culture-content.ts or new chronicler-content.ts

### 4.3 Artifact Lore Instances

6 lore patterns exist in culture-content.ts. Flesh out:

- 5 concrete artifact instances per pattern = 30 artifact lore entries
- Each: `nameFragments[]`, `materialVocabulary[]`, `legendaryDeed`, `sphereAffinity`, `prose` (2-3 sentences)
- Patterns: sacred_relic, weapon_of_legend, tool_of_craft, symbol_of_office, forbidden_text, natural_wonder

### 4.4 Location Type Flavor

For all 15 location types:

- 2-3 sentence establishing-shot prose template per type
- Terrain-sensitive keys: a port on coast ≠ a port on prairie river
- Used by LocationView when player clicks into a location

### 4.5 Ordeal Inspection Content

When a player inspects a location with active/past ordeals:

- 10 ordeal-in-progress vignettes (one per template: "The acolyte stands at the threshold...")
- 5 ordeal-completed vignettes ("They say no one has passed the Green Trial since...")
- 3 ordeal-failed vignettes ("The bones of the last challenger still litter...")

### 4.6 Layer 2 Content Totals

| Item | New entries | Format |
|------|------------|--------|
| Chronicler vignette templates | 15 | chronicler-content.ts (new) |
| Sub-location flavor | 14 entries | chronicler-content.ts |
| Artifact lore instances | 30 | chronicler-content.ts or culture-content.ts |
| Location type flavor | 15 | chronicler-content.ts |
| Ordeal inspection vignettes | 18 | ordeal-content.ts |
| **Total new prose entries** | **~92** | |

---

## 5. Layer 3 — Replay Variety

Ensures the second and third playthrough feel different from the first.

### 5.1 Cultural Prose Palettes

Culture-content.ts has 34 composable modifiers with `metaphorSeeds`, `behavioralKeywords`, `materialVocabulary` — but no prose *templates* use them.

**`CULTURAL_PROSE_PALETTE`** — 12 entries (4 foundation + 8 creation sphere):

Each palette:
- 6 adjectives (cultural voice: Chaos = "wild, unbound, seething"; Order = "measured, precise, unyielding")
- 6 verbs (cultural action: Chaos = "shatter, twist, erupt"; Order = "align, temper, bind")
- 3 sentence rhythms (Chaos = short/staccato; Order = long/subordinate clauses)
- 2 greeting forms ("Chaos-child..." vs "By the Third Decree...")
- 2 oath forms ("I swear on the breaking" vs "I swear on the foundation stone")

Narrative engine blends the relevant palette into prose based on actor's culture's foundation + sphere.

### 5.2 Archetype-Event Prose Specialization

19 archetypes × all event types is too many. Curate the highest-impact combos:

**Priority archetypes** (5): Tragic Hero, Trickster, Conqueror, Healer, Prophet
**Priority events** (6): death, action_critical, tier_transition, divine_intervention, contested_action, ordeal_completed

5 × 6 = 30 specialized templates (these replace the generic template when archetype matches).

**Secondary pass** (14 remaining archetypes × 2 key events each = 28 more):
- Each remaining archetype gets specialized death + tier_transition prose
- Total: 30 + 28 = ~58 archetype-event templates

### 5.3 Rival God Personality Content

Currently 4 generic behaviors with weighted action probabilities.

**8 rival personality profiles** (`src/data/rival-content.ts` extension):

| Profile | Sphere Affinity | Behavior Style |
|---------|----------------|----------------|
| The Patient One | Time / Order | Long-game manipulation, rare but devastating actions |
| The Hungry | Entropy / Force | Aggressive, constant pressure, resource denial |
| The Whisperer | Mind / Shadow | Subtle corruption, turning agents against each other |
| The Builder | Matter / Stone | Competes by constructing rival infrastructure |
| The Shepherd | Life / Heart | Steals followers through kindness, counter-worship |
| The Wrathful | Force / Iron | Direct confrontation, challenges player to combat |
| The Trickster | Chaos / Shadow | Unpredictable, disrupts plans, enjoys confusion |
| The Mirror | Spirit / Veil | Mimics player strategy, adapts to counter moves |

Each profile:
- 3 taunt templates (lines rival says when acting against player)
- 2 reaction templates (rival acknowledges player success/failure)
- Sphere-colored threat descriptions (2-3 sentences)
- Total: ~40 rival prose entries

### 5.4 Mandate Narrative Milestones

12 mandates × 3 stages = 36 stage transitions. Add prose:

- 2 templates per stage transition = 72 milestone prose entries
- Setup → escalation ("The signs are unmistakable now — {sphere} gathers strength in {location}")
- Escalation → culmination ("It begins. The {mandate_name} enters its final phase")
- Completion/failure prose (2 each) = 24 more

Total: ~96 mandate milestone prose entries

### 5.5 Dilemma Prose Expansion

Currently 4 dilemma outcome templates total (1 per outcome type).

- 3 variants per outcome type = 12 total (replacing 4)
- Stakes-level prose variants:
  - Low stakes: casual, observational ("Two traders haggled over river rights. Neither lost much.")
  - Medium stakes: tense, consequential ("The alliance fractured. Both sides remember.")
  - High stakes: dramatic, permanent ("Blood sealed the betrayal. Nothing will undo this.")
- 4 outcomes × 3 stakes = 12 more
- Total: ~24 dilemma prose entries

### 5.6 Ordeal Variety for Replay

- Doom-scaled difficulty tiers: 3 tiers (early/mid/late game) × 10 templates = 30 difficulty variants
- Each tier adjusts: difficulty number, prose tone (hopeful → desperate → existential), trait rewards (minor → major → transformative)
- Sphere-variant ordeals: same template, different sphere coloring = word-bank swaps, not new templates (handled by existing SPHERE_VOCABULARY)

### 5.7 Layer 3 Content Totals

| Item | New entries | Format |
|------|------------|--------|
| Cultural prose palettes | 12 palette entries | culture-content.ts or narrative-content.ts |
| Archetype-event prose | ~58 templates | narrative-content.ts |
| Rival personality profiles | 8 profiles, ~40 prose entries | rival-content.ts |
| Mandate milestone prose | ~96 entries | mandate-content.ts |
| Dilemma prose expansion | ~24 entries | narrative-content.ts |
| Ordeal difficulty tiers | 30 variant entries | ordeal-content.ts |
| **Total new prose entries** | **~260** | |

---

## 6. Layer 4 — Connective Tissue

Small content that makes systems feel like they respond to each other.

### 6.1 Sphere Influence Flavor Events

When a sphere gains or loses influence in a hex:

- 8 creation spheres × 2 directions (gaining/losing) = 16 entries
- "The threads of Force tighten around {location}" / "Life's grip loosens on the {location}"
- These appear in NarrativeFeed as atmosphere events

### 6.2 Cultural Tension Events

When culturalTension.ts fires (mismatch, conquest, dual, fanaticism):

- 4 tension types × 3 prose templates = 12 entries
- "The {culture_a} eye the {culture_b} settlers with open contempt" (mismatch)
- "Two ways of worship now claim the same ground" (dual)

### 6.3 Seasonal Atmosphere

Graph has seasonal-cycle edges. Add atmosphere:

**`SEASONAL_VOCABULARY`** — 4 seasons:
- Each: 3 adjectives, 3 verbs, 1 atmosphere sentence
- Prose generation queries current tick → season mapping for atmospheric word injection
- Spring ("thawing, quickening"), Summer ("blazing, drowsy"), Autumn ("failing, gathering"), Winter ("biting, silent")

### 6.4 World-Soul Echo Content

Echoes carry memories between cycles:

- 12 echo flavor texts (one per situation type):
  - "A memory stirs: the last time a {archetype} stood here, {outcome}"
  - "The World-Soul remembers {sphere} — it was stronger then"
  - "An echo of {rival_name}'s influence lingers in this place"
  - Etc.
- These fire when resonance fragments activate in the fundament

### 6.5 Stealth Detection Prose

The stealth system (`stealth.ts`) defines detection awareness levels but fires no prose events when awareness changes.

**Mortal awareness transitions** (4 templates):
- unaware → suspicion: "Rumors spread through {location} — someone speaks of miracles"
- suspicion → realization: "The people of {location} begin to name the source of {sphere} blessings"
- realization → revelation: "All of {location} knows now. A god walks among them"
- revelation → persecution: "They hunt for the divine hand behind {event}. Fear replaces faith"

**Rival awareness transitions** (4 templates):
- unaware → noticed: "{rival_name} stirs. Something has drawn their gaze"
- noticed → identified: "{rival_name} has found you. Their {behavior} turns purposeful"
- identified → targeted: "{rival_name} moves against you directly. The contest begins"
- targeted → hunted: "{rival_name} commits everything. This is war between gods"

**Content:** 8 detection prose templates in narrative-content.ts. Wire into orchestrator's existing stealth phase.

### 6.6 World-Soul Resonance & Fundament Prose

The World-Soul system (`worldSoul.ts`) has Fundament (coefficient ledger) and Resonance (memory fragments) but no flavor prose for either.

**Fundament coefficient descriptions** (12 entries — one per sphere coefficient):
- Display text explaining what each sphere coefficient means for the world
- "Force coefficient 0.8: Violence comes easily here. Conflicts escalate. Weapons find willing hands."
- "Mind coefficient 0.3: Thought moves slowly. Cunning is rare. Problems are solved with muscle, not wit."

**Resonance fragment prose** (8 templates — one per fragment type):
- "In the last age, a {archetype} {action} at {location}. The World-Soul remembers"
- "A {sphere} echo persists — {sphere_adj} and {sphere_adj}, like a wound that won't close"
- Used when resonance fragments activate or when player inspects the World-Soul state

**Content:** New `worldsoul-content.ts` package (~80 lines). 20 entries total.

### 6.7 Magic Tradition Flavor

The world model has 34 magic-tradition nodes but no prose content for any of them.

**Tradition flavor templates** (34 entries — one per tradition):
- Each: 1-2 sentence description + sphere affinity + practice verb + practitioner noun
- "Pyromancy draws on Force and Energy — its practitioners are called Burners, and their art is loud"
- "Herbalism channels Life through Matter — hedge-witches and root-doctors who know which leaf heals and which kills"

**Content:** Add to chronicler-content.ts or new magic-content.ts. Used when player inspects a location where a tradition is practiced or an agent who practices one.

### 6.8 Ordeal ↔ System Connections

Ordeals should react to other systems:

- 3 ordeal-doom interaction templates: ordeals become harder/more desperate as doom advances
- 3 ordeal-culture interaction templates: ordeals flavor-shift based on local culture
- 3 ordeal-rival interaction templates: rival gods can corrupt/block ordeals

### 6.9 Layer 4 Content Totals

| Item | New entries | Format |
|------|------------|--------|
| Sphere influence events | 16 | narrative-content.ts |
| Cultural tension events | 12 | culture-content.ts |
| Seasonal vocabulary | 4 season entries | narrative-content.ts |
| World-Soul echo texts | 12 | narrative-content.ts |
| Stealth detection prose | 8 | narrative-content.ts |
| World-Soul resonance & fundament | 20 | worldsoul-content.ts (new) |
| Magic tradition flavor | 34 | chronicler-content.ts |
| Ordeal system connections | 9 | ordeal-content.ts |
| **Total new prose entries** | **~115** | |

---

## 7. Grand Total

| Layer | New prose/content entries | New graph nodes | New files |
|-------|--------------------------|-----------------|-----------|
| Layer 1: Visible Playthrough | ~165 | ~38 | ordeal.ts (types), ordeal.ts (engine), ordeal-content.ts |
| Layer 2: Inspection | ~92 | 0 | chronicler-content.ts |
| Layer 3: Replay Variety | ~260 | 0 | Extensions to existing packages |
| Layer 4: Connective Tissue | ~115 | 0 | worldsoul-content.ts (new) + extensions |
| **Total** | **~632 new content entries** | **~38 graph nodes** | **4 new files + extensions** |

---

## 8. Content Package Map After Population

| Package | Current Lines | Estimated After | Change |
|---------|--------------|-----------------|--------|
| archetype-content.ts | 894 | ~1,100 | +archetype-event prose templates |
| culture-content.ts | 1,847 | ~2,100 | +cultural palettes, tension events |
| narrative-content.ts | 207 | ~800 | +routine/notable/lifecycle/seasonal/sphere-influence/stealth-detection templates |
| ordeal-content.ts | **0 (new)** | ~800 | 10 templates, 30 encounters, variants, inspection vignettes |
| chronicler-content.ts | **0 (new)** | ~650 | 15 vignettes, sublocation flavor, location flavor, artifact lore, magic tradition flavor |
| worldsoul-content.ts | **0 (new)** | ~80 | Fundament descriptions, resonance fragment prose |
| mandate-content.ts | 835 | ~1,100 | +milestone prose |
| rival-content.ts | 143 | ~350 | +8 personality profiles |
| doom-content.ts | 23 | ~120 | +doom vocabulary per stage |
| scry-content.ts | 351 | 351 | No change this pass |
| dream-content.ts | 204 | 204 | No change this pass |
| opposition-content.ts | 112 | 112 | No change this pass |
| influence-content.ts | 65 | 65 | No change this pass |
| world-model.json | 203 nodes | ~241 nodes | +38 new taxonomy entries |
| **Total** | **~5,055 lines** | **~8,200+ lines** | **~62% growth** |

---

## 9. Implementation Sequencing

Each layer can be implemented as a sprint. Layer 1 is prerequisite for all others.

**Layer 1 tasks** (must be sequential for ordeal system, parallel for prose):
1. Taxonomy expansion (world-model.json + vault regeneration)
2. Ordeal type system (`src/types/ordeal.ts`)
3. Ordeal content package (`src/data/ordeal-content.ts` — 10 templates, encounters)
4. Ordeal engine (`src/engine/ordeal.ts` — generation, resolution, progression)
5. Ordeal orchestrator integration (`phaseOrdealProgression` + action selection)
6. Ordeal UI (LocationView enhancement)
7. Action prose expansion (narrative-content.ts — 87 new templates)
8. Lifecycle prose (narrative-content.ts — 11 templates)
9. Doom vocabulary (doom-content.ts — 7 stage word banks)
10. Ordeal trace instrumentation (debug panel)
11. Integration tests + playtest verification

**Layer 2 tasks** (largely parallel):
1. Chronicler vignette templates (chronicler-content.ts — 15 vignettes)
2. Sub-location flavor text (14 entries)
3. Artifact lore instances (30 entries)
4. Location type flavor (15 entries)
5. Ordeal inspection vignettes (18 entries)
6. Chronicler integration into inspection UI (LocationView, AgentDetailPanel)

**Layer 3 tasks** (largely parallel):
1. Cultural prose palettes (12 entries)
2. Archetype-event prose (~58 templates)
3. Rival personality profiles (8 profiles)
4. Mandate milestone prose (~96 entries)
5. Dilemma prose expansion (~24 entries)
6. Ordeal difficulty tiers (30 entries)
7. Narrative engine: cultural palette blending integration
8. Playtest verification across 3+ seeds

**Layer 4 tasks** (all parallel):
1. Sphere influence flavor events (16 entries)
2. Cultural tension event prose (12 entries)
3. Seasonal vocabulary (4 entries)
4. World-Soul echo texts (12 entries)
5. Stealth detection prose (8 entries)
6. World-Soul resonance & fundament prose (20 entries — worldsoul-content.ts)
7. Magic tradition flavor (34 entries)
8. Ordeal-system connection prose (9 entries)

---

## 10. Decisions

### D1: Ordeal complexity
**Chosen:** Linear encounter sequences (2-4 steps), no branching paths. Branching adds combinatorial content burden for minimal variety payoff at this stage. The *content* of each encounter creates variety, not the structure.

### D2: Cultural ordeal variants
**Chosen:** Vocabulary overlays, not separate ordeal templates. A Chaos culture's "Rite of Ascension" uses the same encounter structure but swaps word banks (Chaos vocabulary for prose generation). This means 10 templates × vocabulary overlays = many apparent ordeals without combinatorial content explosion.

### D3: Chronicler vignette architecture
**Chosen:** Slot-based templates in a new `chronicler-content.ts` package. Each template has named variable slots filled from game state at inspection time. No LLM generation at this stage — pure template interpolation. LLM enhancement comes in the quality-deep pass later.

### D4: Prose template format
**Chosen:** Same format as existing `ROUTINE_TEMPLATES` / `NOTABLE_TEMPLATES` in narrative-content.ts. String templates with `{variable}` slots. Sphere vocabulary provides word bank lookups. No new template architecture needed.

### D5: Ordeal ↔ Maslow integration
**Chosen:** Ordeals live in the self-actualization tier of the Maslow pipeline. Agents pursue ordeals when lower needs (survival, safety, belonging, esteem) are met. This means only thriving agents attempt ordeals, which matches the narrative intent — ordeals are aspirational, not desperate.

### D6: Quality bar
**Chosen:** Good-enough coverage. 2-3 variants per content type to prove system interaction. Formulaic but structurally correct. Polish and LLM-enhancement come in a dedicated quality pass later.

### D7: Content file organization
**Chosen:** Two new content packages (`ordeal-content.ts`, `chronicler-content.ts`), extensions to 5 existing packages. No content in engine files — strict data/engine boundary maintained.

---

## 11. What This Plan Does NOT Cover

These are explicitly deferred to future work:

- **LLM-enhanced prose generation** — This plan uses template interpolation only. LLM integration for richer prose is a separate initiative.
- **Automated content generation pipelines** — Building tools that generate content programmatically. Requires research into quality control.
- **Deep prose quality** — Hand-crafted, tonally perfect prose. This plan aims for structural correctness and coverage.
- **Art content** — Hex tiles, character portraits, location establishing shots. Handled by the batch art pipeline.
- **Sound/music** — Not in scope.
- **Player-facing text (UI copy)** — Button labels, tooltips, tutorial text. Separate concern.
- **Balancing** — Ordeal difficulty curves, mandate pacing, doom timing. Requires playtest data from populated content.
