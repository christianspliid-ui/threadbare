# Content Strategy — Threadbare Narrative Voice

> **Creative Mission:** *"Stories that inspire us to be better and remind us how deep we can fall."*

**Goal:** Define the prose voice, narrative archetypes, cultural texture, thematic rules, and production workflow for all text content in The Fantasy World Simulator. This document is the constitution — any content creator (human or AI) reads this before writing a word.

**Companion doc:** `2026-03-06-narrative-context-pipeline.md` covers the technical system that harvests world objects and feeds them to the prose generator.

---

## 1. Three Prose Modes

Every piece of text in the game falls into one of three modes. Each has distinct voice rules, a distinct relationship to the player, and a distinct purpose.

### Divine Voice (second-person)

The player is a god. When they act, the prose addresses them directly.

> "You reached into the dream of Kaelen, and something ancient stirred."

- **POV:** Second-person singular
- **Tone:** Spare, direct, slightly ominous. The god's touch should feel alien and heavy, even when benevolent.
- **Length:** 1–2 sentences. Never more.
- **When used:** Player interventions, divine toolkit actions, dream manipulations, essence expenditure.
- **Key rule:** The Divine Voice never explains itself. No "You did this because..." — the god acts, the world responds.

### Event Narration (third-person)

The world moves. Characters act, clash, build, betray, die. The prose describes what happens.

> "Kaelen struck with desperate force, and the gates fell. The cost was written in the dead behind him."

- **POV:** Third-person limited, close to the acting character
- **Tone:** Lean and sharp. McCarthy economy. Every word earns its place. Tone shifts with the character's archetype and the situation — a Trickster's scene reads differently than a Tragic Hero's.
- **Length:** 1–2 sentences for Routine tier. 2–4 sentences for Notable. Up to a short paragraph for Chronicle.
- **When used:** NPC actions, combat resolution, trait acquisition/loss, tier transitions, contested actions, doom escalation, mandate progress.
- **Key rule:** Show cost. Every action ripples. A victory has a body count, a kindness creates a debt, a betrayal poisons something downstream.

### Chronicler Vignettes (historical/contextual)

A cosmic record-keeper who witnesses everything. Slightly wry, occasionally awed. Not the player, not a character — a voice with faint editorial presence. The chronicler writes "flavor plaques" for things in the world, giving them history and weight.

> "The Broken Gate has stood since the Sundering. Those who pass beneath it say the stone still hums with the echo of what was lost."

- **POV:** Third-person omniscient with slight editorial voice
- **Tone:** Historical, evocative, slightly wry. A sense of time's weight. Never dry — always carrying a faint judgment or wonder.
- **Length:** 2–3 sentences. Never long-winded. A feeling of history, not a history lesson.
- **When used:** Location inspection, artifact tooltips, faction descriptions, culture summaries, any world object the player examines.
- **Key rule:** The chronicler puts things in their place. Not just "what you see" but "what this has been" — layers, accumulated meaning, the marks time has left.

---

## 2. Prose Style Rules

These apply across all three modes.

**Lean and sharp.** Short, punchy, evocative. Every word earns its place. Maximum impact per word. No padding, no filler, no throat-clearing.

**Sensory grounding.** What does it smell like, what does it weigh, what does the air feel like? The world is physical. War is mud and iron. Trade is hunger and leverage. Magic has a bodily cost.

**Show, never explain.** "The tragedy of it was..." is banned. Show the act, trust the reader. Never tell the player what to feel.

**Show cost.** Every action ripples. The prose is interested in consequence — what was gained, what was lost, what changed.

**Moral ambiguity.** No pure heroes or pure villains. Even the Monster archetype can show buried humanity. Even the Oathkeeper's vow can be the wrong one.

**Black comedy where earned.** The darkest moments can be funny if a Trickster or Folk Hero is involved. Gallows humor is earned by the character's archetype, never forced by the narrator.

**Scale shifts.** The same event told at god-scale ("the frontier burned") and at human-scale ("she watched her orchard catch"). The three prose modes enable this naturally.

**No modern anachronisms.** No modern political language, therapy-speak, or contemporary idioms. The world is pre-modern; the prose stays there.

**No redemption guarantees.** Characters can seek redemption but the narrative never promises it. A Monster might die a monster. A Fallen Noble might fall further. Hope is real but not guaranteed.

---

## 3. Nineteen Narrative Archetypes

Each character receives an archetype tag at creation — a narrative lens that shapes how events involving them are told. This is separate from personality values (the 10 value pairs). The archetype determines the *kind of story* they're in; personality determines *how they behave within it*.

### Archetype Table

| # | Archetype | Story Shape | Prose Tone | Reach Affinities |
|---|-----------|-------------|------------|------------------|
| 1 | **Tragic Hero** | Rise, hubris, fall | Grand, foreboding, inevitable | Iron, Veil, Heart |
| 2 | **Trickster** | Schemes, reversals, ironic justice | Wry, quick, darkly comic | Shadow, Gold, Heart |
| 3 | **Coming of Age** | Innocence → hardening → transformation | Wonder fading to resolve | Flesh, Veil, Eye |
| 4 | **Brooding Warrior** | Burden, endurance, reluctant action | Terse, heavy, physical | Iron, Stone, Star |
| 5 | **Fallen Noble** | Lost glory, bitter wisdom, possible redemption | Weary, sharp-edged, proud | Gold, Heart, Shadow |
| 6 | **True Believer** | Faith tested, vindicated or shattered | Fervent, intense, certain | Veil, Star, Heart |
| 7 | **Schemer** | Webs of manipulation, delayed payoffs | Cold, precise, calculating | Shadow, Gold, Heart |
| 8 | **Wanderer** | Rootless, observing, stumbling into consequence | Detached, laconic, then suddenly urgent | Star, Eye, Shadow |
| 9 | **Monster** | Inhuman acts, possibly with buried humanity | Brutal, unflinching, occasionally tender | Iron, Flesh, Shadow |
| 10 | **Folk Hero** | Unlikely champion, beloved by common people | Warm, earthy, darkly funny | Heart, Stone, Gold |
| 11 | **Reluctant King** | Refuses power → forced to accept → transformed by burden | Quiet dignity, weight of duty, melancholy | Heart, Iron, Stone |
| 12 | **Oathkeeper** | Bound by a vow that costs everything | Stubborn, grinding, the vow becomes the whole person | Iron, Star, Heart |
| 13 | **Poisoned Court** | Power corrupts, alliances shift, trust is a weapon | Silken, venomous, every word has a second meaning | Gold, Heart, Shadow |
| 14 | **Doomed Innocent** | Good person in a world that will break them | Tender at first, darkening steadily, no rescue coming | Star, Veil, Heart |
| 15 | **Old Power** | Ancient, vast, fading or awakening | Slow, heavy, elemental — weight not speed | Veil, Eye, Star |
| 16 | **Kingmaker** | Never rules, always decides who does | Shrewd, understated, power through others | Gold, Heart, Shadow |
| 17 | **Seeker** | Pursues forbidden knowledge, pays the price of knowing | Obsessive, precise, progressively unhinged | Eye, Veil, Star |
| 18 | **Maker** | Creates something that outlasts them — or destroys them | Patient, hands-on, proud — the craft is sacred | Stone, Flesh, Eye |
| 19 | **Noble Savage** | Primal strength meets civilization, transforms it or is broken | Raw, physical, elemental — contempt for complexity | Iron, Flesh, Stone |

### Reach Coverage Verification

Every Reach has at least 3 archetypes with natural affinity:

| Reach | Archetypes |
|-------|------------|
| **Iron** (warfare) | Brooding Warrior, Tragic Hero, Oathkeeper, Monster, Noble Savage, Reluctant King |
| **Gold** (trade) | Schemer, Poisoned Court, Kingmaker, Folk Hero, Fallen Noble, Trickster |
| **Shadow** (stealth) | Trickster, Schemer, Wanderer, Poisoned Court, Fallen Noble, Kingmaker, Monster |
| **Veil** (magic) | Old Power, Seeker, True Believer, Doomed Innocent, Tragic Hero, Coming of Age |
| **Heart** (social) | Folk Hero, Poisoned Court, Fallen Noble, Kingmaker, Reluctant King, Trickster, Schemer, Oathkeeper, True Believer, Doomed Innocent, Tragic Hero |
| **Eye** (knowledge) | Seeker, Old Power, Wanderer, Maker, Coming of Age |
| **Stone** (construction) | Maker, Reluctant King, Folk Hero, Brooding Warrior, Noble Savage |
| **Star** (navigation/fate) | Doomed Innocent, Wanderer, True Believer, Seeker, Oathkeeper, Brooding Warrior, Old Power |
| **Flesh** (biology) | Monster, Maker, Coming of Age, Noble Savage |

### Archetype Data Requirements

Each archetype needs the following content data (stored in `archetype-content.ts`):

- **Tone keywords** — adjective palette, verb preferences, sentence rhythm guidance
- **Narrative beat patterns** — which event types get elevated to Notable/Chronicle tier for this archetype (a Tragic Hero's death is always Chronicle-tier; a Trickster's scheme succeeding is Notable)
- **Vignette seeds** — short contextual fragments the chronicler voice can draw from
- **Reach affinities** — which Reaches this archetype naturally gravitates toward (3+ per archetype)
- **Narrative requirements** — the kinds of world objects their story beats tend to demand (see §5 and the companion pipeline doc)

### Narrative Requirements by Archetype

| Archetype | Typical Narrative Object Demands |
|-----------|----------------------------------|
| Tragic Hero | Legendary weapons, cursed artifacts, monuments to past glory |
| Trickster | Disguises, hidden passages, compromising secrets, unlikely tools |
| Coming of Age | Mentors, first weapons, rites of passage, threshold locations |
| Brooding Warrior | Battlefields, scarred weapons, graves of fallen comrades |
| Fallen Noble | Faded insignia, ruined estates, loyal retainers, lost heirlooms |
| True Believer | Shrines, holy relics, sacred texts, heretical counterpoints |
| Schemer | Tools of betrayal, secret meeting locations, forged documents, poisons |
| Wanderer | Crossroads, foreign artifacts, strangers' debts, forgotten paths |
| Monster | Trophies of conquest, devastated landscapes, fearful witnesses |
| Folk Hero | Common tools turned weapons, grateful communities, humble gifts |
| Reluctant King | Thrones, crowns, seals of office, petitioners, unanswered letters |
| Oathkeeper | The oath's physical token, witnesses to the vow, tests of faith |
| Poisoned Court | Thrones, seals of office, poisoned gifts, spy networks, alliances |
| Doomed Innocent | Small personal treasures, protective figures, places of safety lost |
| Old Power | Ancient sites, sleeping artifacts, geological features, forgotten wards |
| Kingmaker | Candidates, leverage, intelligence networks, debts owed |
| Seeker | Ancient ruins, forbidden libraries, cryptic artifacts, warning inscriptions |
| Maker | Raw materials, workshops, unfinished masterworks, apprentices |
| Noble Savage | Wilderness landmarks, totemic animals, sacred natural sites, tribal tokens |

---

## 4. Cultural Narrative Palettes

Each culture in the world gets a narrative palette — a set of prose-level textures that color how characters from that culture are described. When the narrative engine generates prose, it blends three inputs:

1. **Archetype tone** — how this kind of story sounds
2. **Sphere vocabulary** — what cosmic force colors the event
3. **Cultural palette** — what world this character comes from

The cultural palette is the layer that makes two Tragic Heroes feel distinct — one from a nomadic horse culture, one from a merchant republic.

### Palette Elements

Each culture defines:

| Element | Purpose | Example (warrior nomads) | Example (merchant republic) |
|---------|---------|--------------------------|---------------------------|
| **Characteristic metaphors** | The culture's natural imagery | "sharp as a winter wind," "the herd moves or dies" | "the ledger balances," "a coin has two faces" |
| **Honor/shame vocabulary** | What this culture values and condemns | Strength, endurance, loyalty to the chief | Cleverness, reputation, keeping contracts |
| **Oath forms** | How promises sound | "By my blade and my blood" | "On my name and my house's credit" |
| **Death language** | How they speak of the dead | "Rode into the last steppe" | "Closed their final account" |
| **Storytelling tradition** | How their own histories are told | Oral saga — repetition, kennings, rhythmic | Written chronicle — precise, dated, archival |
| **Material vocabulary** | What things are made of, what's precious | Leather, bone, horsehair, iron | Silk, glass, paper, gold leaf |

Cultural palettes are stored in a content package and referenced by culture ID. They feed into prose generation at the template-filling stage — sphere vocabulary provides the cosmic color, the cultural palette provides the worldly texture.

### Palette Generation from Composite Modifiers

*(Updated 2026-03-06 — palettes are now generated from modifier seeds, not hand-authored per culture)*

Cultural narrative palettes are **generated, not hand-written**. Each culture's palette is composed from three modifier sources at culture-creation time:

1. **Foundation sphere modifiers** (4 sets) — broad tonal shaping from the World-Soul's foundation balance (Chaos/Order/Light/Darkness). Determines social structure tendency, accountability mode, and metaphor seeds.
2. **Creation sphere modifiers** (8 sets) — behavioral coloring and material vocabulary from the culture's venerated creation spheres. Each sphere contributes 4–6 material terms and 3–5 behavioral keywords.
3. **Biome modifiers** (~20 sets) — survival traits, material culture, and metaphor palette from the landscape where the culture originated.

The generator composes these layers additively. Conflicts between layers create cultural distinctiveness: a Mind-venerating desert culture values knowledge but carries it orally (paper crumbles in sand). A Force-venerating tundra culture settles disputes by endurance contest, not single combat.

This means the content pipeline needs **~32 modifier definition sets** (seeds), not hundreds of hand-authored palettes. See `2026-03-06-culture-bounded-context-design.md` §6 for the full modifier tables and §7 for content production requirements.

### Cultural Voice Intensity

The narrative engine scales cultural voice by the actor's cultural strength:

- **0.8–1.0 (fanatical):** Prose saturated with cultural metaphor and vocabulary
- **0.5–0.79 (strong):** Clear cultural coloring — metaphors appear, material vocabulary used
- **0.3–0.49 (fading):** Faint coloring — occasional cultural reference
- **Below 0.3 (silent):** Culture absent from prose entirely

---

## 4a. Culture Content Production Manifest

*(Added 2026-03-06 — enumerates all content authoring required for the culture system)*

### Modifier Definition Sets (~32 Total)

| Category | Count | Per Set Contents |
|---|---|---|
| Foundation sphere modifiers | 4 | 3–5 behavioral keywords, social structure tendency, accountability mode, 3–4 metaphor seeds |
| Creation sphere modifiers | 8 | 4–6 behavioral keywords, 4–6 material vocabulary terms, 1–2 formative trait seeds, 1–2 behavioral trait seeds |
| Biome modifiers | ~20 | 3–5 survival trait keywords, 4–6 material culture terms, 3–4 metaphor templates |

### Cultural Trait Definitions

| Type | Count | Per Trait |
|---|---|---|
| Formative traits (innate, permanent) | ~30–40 | Name, description, domain contributions, tags, source conditions |
| Behavioral traits (cultural, strength-gated) | ~40–50 | Name, description, domain contributions, strength threshold table, tags |

Traits are drawn from modifier seeds, not hand-authored per culture. The generator combines seeds: Force+Desert → "Sand Warrior" (formative) + "Trial by Thirst" (behavioral).

### Culture-Gated Beat Definitions

~20–30 insider narrative beats. Each needs: event type trigger, minimum cultural strength, required trait/sphere, prose template seeds, archetype affinity.

### Art & Location Content

~15–20 sub-location templates with cultural variant descriptors. ~5–6 artifact lore sentence patterns. Tag vocabulary for prompt construction per culture+building type combination.

### Estimated Total Scope

`culture-content.ts` estimated at 800–1200 lines — comparable to enriched `archetype-content.ts` (894 lines, 53 tests).

Full design rationale: `2026-03-06-culture-bounded-context-design.md`

---

## 5. History in Narrative

The world has memory. History enters the prose in three ways:

### Historical Context Injection (Event Narration)

When generating Notable or Chronicle prose for an event at a location or involving factions, the engine checks the world graph for relevant history:

- Prior events at this location (battles, treaties, disasters)
- Historical relationships between the involved actors or factions
- Old grudges, broken oaths, prior alliances

When relevant history exists, a brief historical fragment gets woven into the event narration:

> "The gates of Ashenmere fell — not for the first time. The stone still bore scorch-marks from the last siege."

> "Kaelen struck a bargain with the Thornwood clans, though neither side had forgotten the Salt Road betrayal."

This is **not every event** — only Notable/Chronicle tier, and only when the graph has relevant history. Routine events stay clean and immediate.

### Chronicler Vignettes (World Inspection)

When the player inspects a world object, the chronicler voice provides context drawn from:

- The object's creation event (who built this, when, why)
- Notable events that happened here (battles, treaties, disasters)
- Cultural context (what this place means to the local culture)
- Current state vs. past (ruins that were once great, humble places that became legendary)

### Opposition as Narrative Fuel

The most interesting narrative context is *oppositional*. The engine actively seeks tension when selecting world objects to weave into prose:

- **Sphere opposition** — A Force-aligned artifact in a Mind-aligned character's scene
- **Value opposition** — A loyal faction near a treacherous character
- **Archetype friction** — A True Believer forced to deal with a Trickster
- **Historical grudges** — Factions or actors with prior conflict in the graph

The narrative context pipeline (companion doc) handles the technical scoring. The creative principle is simple: **tension makes better stories.** When the engine chooses which nearby objects and agents to mention, it prefers the ones that create friction with the protagonist.

---

## 6. Thematic Rules and Exclusions

### What We Embrace

- **Moral ambiguity** — no pure heroes or pure villains
- **Consequence** — every action costs something, every victory is paid for
- **Physical reality** — war is mud and iron, magic has a bodily cost
- **Black comedy** — gallows humor earned by character archetype, not forced
- **Scale shifts** — god-scale and human-scale views of the same events
- **Earned emotion** — tragedy, romance, triumph only when the narrative has built toward them
- **Character arcs** — people change, not always for the better
- **The full range of literary tone** — tragedy, comedy, suspense, tension, romance, epicness, all in one world

### Hard Exclusions

These are never generated, never implied, never depicted — regardless of narrative justification:

| Exclusion | Rule |
|-----------|------|
| **Sexual violence** | Never depicted, implied, or referenced, even obliquely |
| **Overt sexual content** | Romance and desire exist; the prose fades to black. Longing, tension, devotion — yes. Explicit scenes — no. |
| **Killing of children** | Children can exist in the world but are never victims of violence in the prose. War orphans, famine's toll — referenced at a distance as consequence, never depicted. |
| **Abuse** | Domestic abuse, torture of the helpless, cruelty for cruelty's sake. Villainy is shown through what it costs the world, not through depicting suffering. The camera pulls back. |
| **Gratuitous animal cruelty** | Animals can die in war or famine. Torture of animals as characterization or shock is excluded. |
| **Modern anachronisms** | No modern political language, therapy-speak, or contemporary idioms. The world is pre-modern; the prose stays there. |

### The Governing Principle

The world is dark and brutal, but the narrative voice has moral clarity. It doesn't flinch from showing that darkness exists — a city falls, a betrayal cuts deep, a hero dies badly — but it never *lingers* in cruelty. The prose is interested in what darkness **costs** and what people **do about it**, not in the darkness itself.

The darkest parts of human depravity are excluded. We have enough of that in the real world. What remains: stories that inspire us to be better and remind us how deep we can fall.

---

## 7. Content Production Workflow

### Creative Writing Skills

The project uses a creative writing skills plugin with five tools:

| Skill | When to Use | Output |
|-------|-------------|--------|
| `cw-style-skill-creator` | Once — to create a custom style skill encoding this strategy | A reusable `.skill` file |
| `cw-prose-writing` | Writing prose templates, vignettes, chronicle prompts | Template strings for content packages |
| `cw-brainstorming` | Exploring new archetype tones, cultural palettes, beat patterns | Working notes → refined into content data |
| `cw-official-docs` | Documenting finalized archetype/culture specs | Obsidian vault system notes |
| `cw-story-critique` | Reviewing prose quality of existing content | Feedback → revisions |

### Production Flow

```
1. Load content strategy (this doc) for rules
2. Load game style skill for voice
3. Use cw-prose-writing to draft content
4. Use cw-story-critique to review
5. Commit to the appropriate *-content.ts package
```

### Content Package Map

All narrative content lives in `src/data/*-content.ts` files:

| Package | Contents |
|---------|----------|
| `narrative-content.ts` | Sphere vocabulary, routine/notable templates, value flavors, chronicle prompts |
| `archetype-content.ts` | 19 archetype definitions: tone keywords, beat patterns, vignette seeds, narrative requirements |
| `culture-content.ts` | ~32 composite modifier sets (foundation+creation+biome), ~70–90 cultural trait seeds, ~20–30 culture-gated beat definitions, sub-location templates, artifact lore patterns. See §4a manifest. |
| `dream-content.ts` | Manipulation/intervention definitions, delivery constants |
| `doom-content.ts` | Archetype stage names, thresholds, escalation narrative beats |
| `rival-content.ts` | Rival names, behaviors, weights |
| `scry-content.ts` | Court structures, title fragments, archetypes (existing ✅) |
| `mandate-content.ts` | Mandate templates, conditions, descriptions (existing ✅) |
| `influence-content.ts` | Tier names |

### Relationship to Other Docs

- **`STYLE.md`** — visual style (art direction, colors, sphere form language). This doc covers *prose* style.
- **`2026-03-06-content-package-architecture.md`** — where content files live and how they're structured. This doc covers *what goes in them*.
- **`2026-03-06-narrative-context-pipeline.md`** — how the engine harvests world objects and feeds them to prose generation. This doc covers *the creative rules* the pipeline serves.

---

## Decisions Log

| Decision | Chosen | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Prose density | Lean and sharp (McCarthy) | Dense literary (Malazan), varies by tier | Game text competes with visuals/mechanics for attention. Maximum impact per word. |
| Narrator voice | Three modes (divine/event/chronicler) | Single omniscient, pure second-person, no narrator personality | Three modes let the prose serve different purposes — player agency, world events, worldbuilding — each optimally |
| Archetype system | Separate tag (19 archetypes) | Derived from personality values, combined system | Archetypes define story shape; personality defines behavior. Different dimensions, shouldn't be coupled. |
| Archetype count | 19 | Fewer (10), more (25+) | 19 covers all 9 Reaches with 3+ each, draws from Malazan + Tolkien + Martin traditions without becoming unwieldy |
| Thematic scope | Full grimdark minus real human depravity | Mythic-dark only, heroic undertone, no limits | "Stories that inspire us to be better and remind us how deep we can fall." Dark enough to matter, not so dark it wallows. |
| Culture in narrative | Narrative palettes blended with archetype + sphere | Culture as flavor text only, culture overrides archetype | Blending preserves archetype consistency while adding worldly texture |
| History in narrative | Injected at Notable/Chronicle tier via graph lookup | Always present, never present, player-toggled | History adds depth to important moments without cluttering routine events |
| Cultural palette source | Generated from composite modifiers (foundation+creation+biome) | Hand-authored per culture, derived from sphere only | Composite modifiers scale to any number of cultures from ~32 seed sets while ensuring every culture takes color from World-Soul and landscape |
| Cultural trait model | Two types: formative (innate, permanent) + behavioral (new `cultural` category, strength-gated) | Single trait type, extend existing categories | Youth-acquired skills are permanent; customs/values scale with identity strength. Distinct mechanics need distinct categories. |
| Culture budget | ≤1.0 total across 0–2 cultures | Unbounded stacking, fixed 50/50 split | Budget forces meaningful identity choices and natural narrative tension without combinatorial explosion |
