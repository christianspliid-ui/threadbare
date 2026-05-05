# Encounter Build Toolkit (2026-05-04)

**Status:** Analysis. Proposes how the encounter authoring agent composes any encounter in the v7 UI by pulling from the codebase's full primitive vocabulary. Companion to `2026-05-04-encounter-experience-v7.html` and the player-journey analysis.

**Audience:** Encounter authoring agent (and humans designing it); engine team specifying how primitive references resolve into UI slots; content team thinking about variety budgets.

---

## 1. Premise

The v7 UI is a single scaffold. An encounter is not a one-off bespoke design — it is a **selection of primitives** from the world graph, composed into the v7 slots. **Variety comes from primitive selection, not parallel UI systems.** The toolkit's job is to make every primitive in the codebase a candidate the encounter author can pull from, render in a known slot, and animate in a predictable way.

A scene at a market is the same UI as a scene at a haunted ruin. What differs is the primitive cast: which actors, which place, which conditions, which threads, which items in scene, which callback memories, which faction stakes, which Ascendant moves are scene-relevant.

If the toolkit covers half the primitives, encounters look samey because half the world is invisible. If it covers all of them, every encounter pulls from a different slice and the player feels the world is alive.

## 1.1 Three load-bearing rules

Three principles govern every encounter the authoring agent composes. If a design pulls against these, push back.

### Rule 1 — Path over adjective.

Every player choice in the encounter UI must change the *path*, not just the *adjective*. If three options collapse to "same outcome, different prose," cut them and let the engine pick the prose from scene context. The player's attention is the most expensive thing in the design; it should buy real decisions — different reaches, different cosmological pulls, different moral axes, different consequences — not flavor variants of the same future.

This rule is why the legacy AgendaPicker (40 agenda templates, 240 consequence templates spread as a player-facing menu) is dissolved into engine prose-lookup: those templates remain — but the engine selects from them based on scene primitives, not by asking the player to pick from short lyric blurbs. The player chooses *which intervention, on whom, at what cost*. The flavoring chooses itself from context.

### Rule 2 — The moral axis is structural.

Every reach has an axiological pair, expressed as an archetype pair. When the player leans on a reach, they are not just spending essence — they are tilting the agent along a named moral axis toward one archetype pole or the other. The cosmological pattern (`Brainstorms/brainstorm-cosmological-symmetry.md`) settled this:

| Reach | Sphere | Tension | Archetype Pair |
|-------|--------|--------------|---------------|
| Iron | Force | Mercy ↔ Ruthlessness | Protector ↔ Conqueror |
| Gold | Life | Asceticism ↔ Extravagance | Mender ↔ Magnate |
| Shadow | Entropy | Honesty ↔ Cunning | Confessor ↔ Puppeteer |
| Veil | Mind | Tradition ↔ Novelty | Archivist ↔ Heretic |
| Heart | Spirit | Loyalty ↔ Ambition | Sworn ↔ Renegade |
| Eye | Energy | Revelation ↔ Discretion | Seeker ↔ Sentinel |
| Stone | Matter | Preservation ↔ Transformation | Guardian ↔ Shaper |
| Star | Time | Sacrifice ↔ Survival | Martyr ↔ Survivor |
| *(meta)* | — | Courage ↔ Prudence | Vanguard ↔ Watcher |

A lean toward Iron tilts the agent toward Conqueror. A lean toward Heart tilts toward Renegade. These tilts accumulate. After 14 Iron leans across 22 encounters, Eira is becoming a Conqueror — a kind of being she did not choose. **That accumulating drift is the moral cost of being a god.** It is not a guilt mechanic; it is a structural truth the encounter UI surfaces.

Every lean card should display its moral pole on a one-line tilt indicator: `↬ tilts her toward CONQUEROR`. Subtle, single line, but legible. The aggregate biography is where the player feels the weight.

The meta-axis (Vanguard ↔ Watcher) covers boldness of expression — the *Watch only* opt-out is the Watcher's verb. There is no fourth verb problem because verbs are not a closed set; the encounter author writes them. Watch-only is just the most common name for the Watcher's move.

### Rule 3 — Encounter-specific verbs, not a fixed vocabulary.

Lean primitives are encounter-content-author work. Each encounter writes its own god-verbs ("Stir her resolve," "Sharpen her sight," "Soften her stance," "Open the lantern," "Speak when not asked") tuned to the moment. There is no fixed three-verb model the lean cards must use. The player learns the world by encountering many verbs, not by re-reading the same three.

This means the encounter author has wide creative range; the engine renders whatever the author writes; the cosmological pattern (Rule 2) keeps every verb anchored to a reach + sphere + moral axis underneath.

## 2. The Primitive Inventory

The codebase exposes **28 implemented primitives** plus three confirmed gaps. I've grouped them by what they contribute to a scene.

### 2.1 Actors and forces (who is in or behind the scene)

| Primitive | Type / file | Encounter role |
|---|---|---|
| **Agent / NPC** | `actor` node · `agent.ts`, `npc.ts` | Cast members; protagonist; bystanders |
| **Monster / lair** | `actor` (lair props) · `monster.ts` | Non-mortal threats with tier and sphere dominance |
| **Faction** | `actor` (faction type) · `faction.ts` | Organisations whose stake or presence shapes the scene |
| **Army** | `actor` (army state) · `army.ts` | Warbands/regiments; off-stage force whose pressure is felt |
| **Battle** | `actor` (battle state) · `battle.ts` | Field/siege resolution; spotlight history |
| **Rival god** | `actor` (rival state) · `rival.ts` | Ascendant antagonists whose interventions disturb the scene |

### 2.2 Place and environment (where the scene happens)

| Primitive | Type / file | Encounter role |
|---|---|---|
| **Place / location** | `location` node | Hex tile with terrain, traits, alignment |
| **Sublocation** | `location` + `sublocationTypeId` · `sublocation.ts` | The room within the inn; the alcove off the gate |
| **Resource** | location property bag · `resource.ts` | Wealth gradients (e.g. how scarce salt is here) |
| **Sphere alignment / influence** | `aligned_with` + `sphere_influence` edges | Cosmic mood of the place; which magic is easy here |
| **Ambient state** *(partial)* | `trait` on location · `traits.ts` | Weather, time-of-day, festival in progress, blackout — modelled as decaying location traits today |
| **Echo** | `echoed_to` (implicit) · `echo.ts` | Cross-cycle memory bound to a place — a relic, a monument, a scar |

### 2.3 Attached to actors and places (state that travels)

| Primitive | Type / file | Encounter role |
|---|---|---|
| **Attachment** (umbrella, 6 subtypes) | `artifact` node + `possesses` edge · `attachments.ts` | The currency of state. Six subtypes: |
| — Possession (item) | `attachments.ts` | Carried artifacts: arms, mounts, vestments, tomes, relics, tools, provisions |
| — Condition | `attachments.ts` | Temporary state — wounded, exhausted, drunk, marked |
| — Blessing | `attachments.ts` | Beneficial divine effect |
| — Curse | `attachments.ts` | Detrimental divine effect |
| — Bestowed power | `attachments.ts` | Granted ability — a prophet's flame, a regent's seal |
| — Agreement | `attachments.ts` | Pact, debt, favour, oath, treaty, bargain |
| **Trait** | `trait` node (8 categories) · `traits.ts` | Long-lived qualities — innate, mastery, reputation, scar, condition, destiny, cultural, bestowed |
| **Reputation** | `has_trait` edge + reputation category · `traits.ts` | Reach-bound polarity that shapes NPC reaction |
| **Vow / debt / oath** | `agreement` category · `attachments.ts` | Narrative bindings the player can lean on, deepen, or break |

### 2.4 Social fabric (the leverage system)

| Primitive | Type / file | Encounter role |
|---|---|---|
| **Secret** | `knows_secret_of` edge · `secretsFavors.ts` | Who knows what compromising thing about whom (8 secret types) |
| **Favor / leverage** | `owes_favor` edge · `secretsFavors.ts` | Who owes whom what (debtor → creditor, magnitude, fulfilled) |
| **Knowledge / clue** | `knows_clue_of` edge · `knowledge.ts` | Ruins-knowledge; precision and magnitude |

### 2.5 Narrative scaffolding (what gives the scene shape and weight)

| Primitive | Type / file | Encounter role |
|---|---|---|
| **Event / encounter memory** | `event` node + `participated_in` · `graph.ts` | Past encounter outcomes — the callback fuel |
| **Story arc / ambition** | `ambition` node (7 categories) · `ambition.ts` | Long-running goals an agent pursues — the why behind the how |
| **Chronicle entry** | volume/chapter metadata · `chronicle.ts` | Compressed prose summaries of tier-3 events; the long memory |
| **Thread / bond** | `thread` edge · `graph.ts` | Player↔agent connection; surfaces in protagonist panel |
| **Reach domain** | `ReachDomain` (8 types) · `traits.ts` | Iron, Gold, Shadow, Veil, Heart, Eye, Stone, Star — capability axes the leans key off. Each reach is paired 1:1 with a Creation Sphere (Force, Life, Entropy, Mind, Spirit, Energy, Matter, Time respectively); see Rule 2 above. *Flesh has been retired and converted to Quintessence (a meta-property, not a reach); see `Brainstorms/brainstorm-cosmological-symmetry.md`.* |
| **Quintessence** | meta-property · phase-transition threshold | Coherence of being. Low = destruction/death; high = ascension/transformation. Not a reach — a single scalar that gates phase changes. May surface in scene state (an agent at low Quintessence is fragile here) but never as a lean target. |
| **Axiological value pair** | `ValuePair` (9 types) · `agent.ts` | Virtue/flaw polarities bound to reaches; deep character profiling |

### 2.6 Cosmic and rare (load when relevant)

| Primitive | Type / file | Encounter role |
|---|---|---|
| **Sphere effect / magic** | `aligned_with` + `sphere_influence` edges | 12 spheres — the visible threadwork of the world |
| **Omen** | `trait` or attachment · `omen.ts` | Active portent — biases outcomes, signals approaching beats |
| **Complication** | attachment variant · `complication.ts` | Failure outcome modifiers — reach affinity, severity, omen synergy |

### 2.7 Confirmed gaps (would extend the toolkit)

- **Encounter template as graph node** — encounters are static data today, not first-class graph entities. Means the author can't wire encounters into the world by graph-traversal. *Proposal: `encounter_template` node type with edges `has_outcome`, `gates_to`, `spawns_from`.*
- **Relationship / disposition node** — agents have `relates_to` edges with sentiment values, but no reified dyadic relationship state with history and arc. *Proposal: `relationship` node capturing dyadic state, history, trajectory.*
- **Divine mark / blessing / curse as distinct node** — currently folded into attachments; no explicit "this place is cursed by [god]" or "this agent bears [god]'s mark." *Proposal: `blessing | curse | mark` node, source god ID, magnitude, decay.*

These are flagged for the design plan; the toolkit doc treats them as desirable but not blocking.

---

## 3. UI Slot Mapping

Every region of v7 has a defined relationship to the primitive vocabulary. Here is the contract.

### 3.1 Eira Hero Panel (left rail)

The **protagonist's view of the scene.** All slots filtered by scene relevance.

| UI slot | Pulls from | Filter | Reflows when |
|---|---|---|---|
| Portrait | actor.appearance / generated portrait | matches the threaded actor | character art changes |
| Name + role + bond | actor.name, actor.spheres, thread.tier | always | bond tier changes |
| State indicator | open conditions on actor (visible category) | only "now-active" conditions | a condition fires/expires |
| Capability strips (3) | actor.reach scores → qualitative bands | always 3 spheres shown for this scene; encounter author picks which 3 of 8 are relevant | reaches change, encounter switches relevant axes |
| Items in scene | possession attachments on actor | encounter-flagged "scene-relevant" + ones whose tags match place/cast | author marks `relevant: true` on the items the scene could touch |
| Active vow callout | agreement attachments with `active=true` for this beat | the encounter author marks which vows are "active now" | a vow is activated/discharged |
| Recent moments | `participated_in` events involving this actor | filter by callback-eligibility (place adjacency, cast adjacency, or beat-flagged) | a beat fires that invokes an old event |

**Elastic to 0–N:** items 0–N, recent moments 0–N, vows 0–N. Capability strips are fixed at 3 (the encounter's primary axes — author selects from 8 reaches).

### 3.2 Active Card (center column)

The **scene happening now.** Single card that scrolls vertically when prose is long.

| UI slot | Pulls from | Filter |
|---|---|---|
| Title | encounter.beat[i].title | per beat |
| Place painting | location.painting (or sublocation.painting if more specific) | full-width banner |
| Place caption | location.label · sublocation.label · ambient state · time-of-day | composed string |
| Callback note (optional) | event referenced by this beat's `invokes` field | only when the beat invokes an old event |
| Outcome forecast band | engine sigmoid output → 5-tier qualitative band ("the threads stand uncertain") + 1–3 narrative factors on hover | one line above prose. Subsumes the legacy `Systems/Fate Forecast.md` surface — same five tiers (Doomed → Fated), no numbers, no per-beat author work. |
| Prose | beat.prose with primitive references resolved to dotted-underline tooltips | TTS-renderable |
| Lean primitives (typically 3, 1–N supported) | beat.leans[] | each lean declares: reach (1 of 8), encounter-author-written god-verb, agent reaction prose, mechanical tilt-toward, **moral-axis tilt** (the archetype pole the lean pulls toward — see Rule 2), fail-forward note. Sphere coloring of prose is automatic from the reach (1:1 pair). |
| TTS button | always present | wires to Kokomoro voice |

**Prose primitive references** are the load-bearing detail. When prose says *"the trader thinks about running"*, the encounter author wires the word "running" to a tooltip that pulls from the trader's current condition + tags + secret. The tooltip is **not** authored prose; it's resolved from primitives. This is what makes the scene *feel* connected to the underlying world.

**Elastic:** prose is variable length; leans default to 3 but the structure supports 1–N (a solo dilemma might offer two; a complex moment might offer four).

### 3.3 Cast in the scene (right rail, top)

The **NPCs, monsters, factions, and forces in the scene.** Each is an actor reference.

| UI slot per cast tile | Pulls from | Filter |
|---|---|---|
| Portrait | actor.appearance | always |
| Name | actor.name (or `unnamed` for anonymous threats) | always |
| Sphere / role | actor.primarySphere · actor.role | always |
| Disposition (italic, dotted-underline) | actor.disposition[forBeat] | per-beat — encounter author can specify how a cast member's disposition shifts beat-by-beat |
| "To her" relationship | `relates_to` edge from cast → protagonist (sentiment, history) | always |
| Tags | actor.scene_tags + cross-references (hidden cargo, late for council, looking for a face) | author-selected |

**Cast can include:**
- Named NPCs (Captain Veiren)
- Anonymous NPCs (a nervous trader)
- Monsters (a wraith, a tavern brawler)
- Factions personified (an envoy of the Spice Merchants — represented by an actor with `faction_representative` tag)
- Off-stage forces present-via-effect (an army camped outside; absent in the room but their pressure is registered as a cast tile with "off-stage" flag)

**Elastic:** 0 cast (a solo internal dilemma) to N cast (a court intrigue with six). The right rail reflows; with more than 4, cast scrolls within its rail region.

### 3.4 Your Hand (right rail, middle)

**Ascendant action templates filtered by scene relevance.** This is the *scene-relevance filter* described in the player-journey doc.

| UI slot per card | Pulls from | Filter |
|---|---|---|
| Icon | unifiedActionTemplate.icon | always |
| Name | template.spellName | always |
| Description | template.proseSummary, with `[agent]` `[item]` `[place]` IPK terms resolved against scene cast | |
| Cost | template.essenceCost · sphereAffinity multiplier | |
| Tier badge | template.tier (Touched / Drawn / Devoted / Exalted) | |
| Rare pulse | template.rarity ≥ 3 OR story_beat | when present |

**Three states:**
- **Playable** — target type has a match in scene cast/place/items, and player has cost.
- **Dimmed** — target match exists but player lacks cost or prereq; show the prereq as teaching.
- **Hidden** — no scene relevance (e.g., perception scry when you're already at the scene).

**Elastic:** 1–N visible (default 3) with "+N more" disclosure. Ascendant deck grows over the campaign — the panel gracefully accepts new cards.

### 3.5 The State of the Scene (right rail, bottom)

The **invisible currents** that shape the moment.

| UI slot | Pulls from | Filter |
|---|---|---|
| Threads in play | `sphere_influence` edges + scene-tagged thread descriptors (authority taut, hidden satchel, patience fraying, etc.) | author-curated, drawn from the graph |
| Factions here | factions whose `encounter_at` edge touches this place + factions represented by present cast | computed from cast and place |
| Place conditions | place.traits + sublocation conditions + ambient state | filtered to "active and visible" |
| Conditions on her | open conditions on protagonist (visibility=public OR ascendant-readable) | empty when none |
| Detection / rivals noticing | accumulating divine-intervention pressure in this region (computed) | surfaces as a thread when crossed — *"a rival god turns its head"*. Replaces the per-card detection-risk label from the legacy Fate Forecast. Slow-build, mostly invisible per-action. |
| Cumulative archetype drift on protagonist | sum of recent moral-axis tilts on this agent | surfaces when the drift crosses a threshold — *"Eira has tilted toward Conqueror across her last 14 leans"*. Visible in scene state for the player who wants to see it; the moral cost made legible. |

**Elastic:** all four panels can be empty (dashed placeholder showing the slot exists) or full (multiple lines / chip rows). A bare scene shows mostly placeholders; a saturated scene fills every panel.

### 3.6 Bottom bar

The **player's resource state and pacing context.**

| UI slot | Pulls from |
|---|---|
| Quintessence orbs | ascendant.quintessence (current/max) |
| Center hint | static — *"lean on her · play a card · or let the dice fall"* |
| Scene pacing | encounter.beat[current] of encounter.beats.length |
| Watch only | always available; author may rename per scene ("hold your tongue", "stay your hand", etc.) |

---

## 4. The Encounter Authoring Contract

The encounter authoring agent specifies a structured document. The renderer fills v7 slots from it. The author **does not specify pixel positions.** They specify primitive references and the renderer composes.

```
Encounter:
  protagonist: actor_id (the threaded agent, normally)
  place:
    location: location_id
    sublocation: sublocation_id (optional)
    ambient_state: { time-of-day, weather, special }
    painting: image_ref or generated_prompt

  cast: [
    {
      actor: actor_id,
      role_in_scene: short_string,
      disposition_per_beat: { 1: "...", 2: "...", ... },
      tags: [scene_tags],
      offstage: false,
    },
    ...
  ]

  scene_state:
    threads_in_play: [
      { name: "authority", weight: "taut", color: "iron" },
      { name: "hidden cargo", weight: "thin", color: "eye" },
      ...
    ]
    factions_here: [faction_id, ...]
    place_conditions: [trait_id, ...]
    conditions_on_protagonist: [condition_id, ...]

  protagonist_view:
    capability_axes: [3 reach_ids relevant here]
    items_relevant: [attachment_id, ...]  // marked relevant by author
    vows_active_per_beat: { 1: [vow_id], 2: [vow_id], ... }
    callback_candidates: [event_id, ...]  // events eligible to be invoked
    state_descriptor: short qualitative ("steady, but reading the room")

  beats: [
    {
      title: "The Captain Stops",
      invokes: event_id (optional),  // surfaces the callback note
      prose: "Veiren plants his bootheel...",
      prose_tooltips: { "running": condition_or_secret_ref, ... },
      leans: [
        {
          reach: "iron",                              // 1 of 8 — sphere coloring is automatic from the 1:1 pair
          cost: "small_breath",                       // narrative tier; engine maps to essence integer
          god_verb: "Stir her resolve.",              // encounter-author-written; no fixed verb vocabulary
          agent_reaction: "Her shoulders set. She closes the distance...",
          tilts_toward: "a wound, a debt, or his favour earned",  // mechanical outcome shape
          moral_axis_pole: "conqueror",               // the archetype pole this lean tilts toward (per cosmological pattern)
          fail_forward: "a new thread opens",
        },
        ...
      ],
    },
    ...
  ]

  aftermath:
    receipt: short_narrative_summary
    changes: [
      { kind: "intelligence", payload: knowledge_id },
      { kind: "faction_tilt", payload: { faction_id, delta } },
      { kind: "vow_held", payload: vow_id },
      { kind: "thread_offered", payload: actor_id },
      { kind: "biography_entry", payload: short_text },
    ]
    choice (optional, for big encounters):
      prompt: "How does she carry this?",
      options: [{ label, consequences }, ...]

  ascendant_hand_filter:
    eligible: [template_id, ...]  // computed from scene primitives, but author can curate
    rare_pulse: [template_id, ...]
```

The renderer takes this document and binds it into v7's slots. **Every primitive reference is resolved through the graph at render time** — so if Veiren's disposition changes between encounter authoring and play, the cast tile reflects the current state.

This means:
- Authors write *references*, not snapshots.
- The same encounter, played by a different protagonist threaded to the same agents, automatically re-renders with the new protagonist's relationship to the cast.
- A change to a faction's mood between turns flows into the next encounter that involves that faction without re-authoring.

---

## 5. Worked Examples

Four contrasting scenes, all in the same v7 scaffold. Each section names which primitives are foregrounded and what slots fill in.

### 5.1 Eira at the South Gate (baseline — social interrogation)

**Foregrounded primitives:** agent (Eira), agents (Veiren, trader, Halren), faction (Civic Guard), place (South Gate sublocation), vow, item (Captain's token), event (iron market last winter), threads (authority, hidden cargo, patience fraying), reach domains (Iron, Eye, Heart).

**Slot fills:**
- Hero panel: Eira / Iron-rooted, Drawn bond / vow active. Items: token, vow. Recent: iron market.
- Active card: South Gate dusk painting; "The Captain Stops" prose; outcome forecast band reads *"the threads stand uncertain · iron-rooted, but Halren is watching"*; three reach-aligned leans:
  - **IRON · Stir her resolve** — `↬ tilts toward CONQUEROR`
  - **EYE · Sharpen her sight** — `↬ tilts toward SEEKER`
  - **HEART · Soften her stance** — `↬ tilts toward SWORN`
- Cast: Veiren (suspicious), Trader (about to bolt), Halren (late for council).
- Hand: Send a sign, Veil the cargo, Mark her with fate (rare). Click-to-cast — no inner picker (the legacy AgendaPicker is dissolved into engine prose-lookup).
- Scene state: threads (4), factions (3 — Civic Guard, Spice Merchants, Salt-runners suspected), place conditions (choke-point, lanterns lit, AUTHORITY tilt), no conditions on Eira, no rival-noticing.

**Distinctive:** social fabric (the cast's dispositions and her relationships) is the puzzle. No combat. Sphere effects mostly absent. The moral axis is most active on Iron — repeated Iron leans drift Eira from her natural Mender pole (Gold/Life-asceticism) toward Conqueror, betraying the vow.

---

### 5.2 The Tavern's Last Cup (combat with mortal threat)

**Setting:** A backwater inn near sunset. Eira has stopped for water. Three drunken sellswords are looking for trouble.

**Foregrounded primitives:** agent (Eira), monster (drunken brawler — anonymous; tier 1 lair-style threat), agent (the tavernkeeper, named NPC), sublocation (the inn's common room), conditions (intoxicated × 3, on the brawlers; vigilant on the tavernkeeper), item (the broken bottle; the tavernkeeper's hidden truncheon — a possession with `tags: [improvised_weapon, off-screen]`), reputation (Eira's standing with travelling merchants — relevant if a merchant is in the room), reach domains (Iron, Heart).

**Slot fills:**
- Hero panel: Eira / state: "alert, hand near belt" / capability: Iron foregrounded, Heart. Items: a knife, a wineskin (relevant). Recent: a previous tavern brawl, two months back (callback eligible).
- Active card: the inn's common room painting; "The First Bottle Breaks" prose; outcome forecast reads *"the threads stand perilous · iron-rooted, the room is cramped"*; leans:
  - **IRON · break first** (small breath) — *"Stir her into striking before the lead brawler does."* `↬ tilts toward CONQUEROR`
  - **EYE · count the room** (fuller breath) — *"Sharpen her sight. She'll see who's actually dangerous and who's just loud."* `↬ tilts toward SEEKER`
  - **HEART · walk it down** (deep draught) — *"Soften her stance. She offers the broken bottle to the keeper. The room reads it."* `↬ tilts toward SWORN`
- Cast (4 tiles, scrolls): the lead brawler (intoxicated, looking for a fight); two background brawlers (drunk, will follow the lead); the tavernkeeper (vigilant, has a truncheon under the bar — disposition: *"will call for the watch if it goes loud"*); a quiet merchant in the corner (witness).
- Hand: Wrath descending (`divine.intimidate`); Veil her presence (`divine.deceive` — a blanket of unease over the brawlers); Embolden the tavernkeeper (`action.social.embolden` — he draws the truncheon early); Mark this as a debt (custom).
- Scene state:
  - Threads: drunken pride (taut, iron); the keeper's resolve (thin, iron); the merchant's witness (fraying, eye).
  - Factions here: Travelling Merchants (the merchant), no formal guard presence.
  - Place conditions: cramped, low-ceilinged, lantern light; *tilts the room toward IRON; +1 difficulty to flee*.
  - Conditions on Eira: none active.

**Distinctive:** the cast is mostly hostile or neutral. Place conditions tilt mechanically (close quarters favour Iron). One Ascendant card is mechanical (`divine.intimidate`); another is social (`embolden the keeper`). The aftermath shape will likely include a wound or a new enemy faction's interest, plus a callback-eligible memory ("the night she didn't break the bottle first").

**This shows:** monsters / anonymous threats; mechanical place modifiers; reach domain capability shifts; the cast scaling up to four with scroll.

---

### 5.3 A Whisper at Court (faction intrigue, secrets, favours)

**Setting:** The Marble Hall of Bren, late afternoon. A faction conclave is in session. Eira has been asked to deliver a sealed letter — and to wait.

**Foregrounded primitives:** agent (Eira), faction (House Maren, House Talbain, the Spice Merchants — three factions present), agents (the regent, three lords, two scribes — six cast), secrets (Eira knows a secret about House Talbain — they buy salt from the Salt-runners; this came from her last encounter), favours (House Maren owes her a favour from the iron market night), ambitions (each lord pursues their own ambition; House Talbain pursues "consolidation"; House Maren pursues "vengeance"), item (the sealed letter — possession with `tags: [scene_focal]`), trait (Eira has acquired "civic guard adjacent" reputation from beat 3 of the gate encounter), reach domains (Eye, Heart, Star), divine action (`action.divine-edict` — only available during conclave).

**Slot fills:**
- Hero panel: Eira / state: "watching three rooms at once". Items: sealed letter (active), Captain's token (relevant — could be invoked to call on Civic Guard backing). Vows: vow to small folk (active in case the letter ruins the trader). Recent: gate scene (47 turns ago — invoked).
- Active card: the Marble Hall painting; "A Letter Asked to Wait" prose. Tooltips on:
  - "the regent's gaze" (he is *aware she carries something; faction House Maren has briefed him*)
  - "House Talbain's silence" (the secret she carries about them)
  - "a familiar back at the door" (Halren is here — callback to the gate)
- Leans:
  - **EYE · read the regent's hand** — *"Sharpen her sight. She'll see whose seal will move first."* `↬ tilts toward SEEKER`
  - **STAR · speak when not asked** — *"A hush of inevitability. She breaks the silence with the letter early; the long arc tilts. The room turns."* `↬ tilts toward MARTYR` *(speaking out of turn at court is a sacrifice — Star/Time, the sphere of the long view)*
  - **HEART · let it pass** — *"Soften her stance. She lets the regent open it on his own time."* `↬ tilts toward SWORN`
- Cast (six, scrolls):
  - The Regent (impatient, *"weighing whose favour costs less"*) → to her: *"a face she has only seen across crowds"*.
  - Lord Maren (allied — owes Eira a favour, knows it) → *"to her: a debt she has not yet called in"*.
  - Lord Talbain (suspicious — pursues consolidation; doesn't know Eira holds his secret) → *"to her: a stranger with a hand inside his house"*.
  - Lady Talbain (his sister; ambition: legacy) → *"to her: a face seen at the gate three winters back"*.
  - Halren the Lawful (returns from the gate scene — he's a Spice Merchant councillor, witnessing) → *"to her: a face that knows what she did"* (callback hook!).
  - The royal scribe (neutral, recording) → *"to her: forgettable"*.
- Hand: Whisper a sign (`divine.omen`); Tip the scales toward Eira (`action.social.tip_scales`); Divine edict (`action.divine-edict` — only available because conclave is live; would weight the next faction debate); Mark her with fate (rare, dimmed — needs Devoted bond).
- Scene state:
  - Threads: the regent's patience (thin, ferrying), House Maren's debt (taut, gold), House Talbain's secret (thin, bright eye-blue, *pulsing because Eira holds it*), the letter (taut, voice).
  - Factions here: House Maren · House Talbain · Spice Merchants · (off-stage: Civic Guard, Salt-runners — represented as rim-chips).
  - Place conditions: marble hall, midday light through high windows; *tilts the room toward STAR/Time — the long view dominates; +1 to leans whose tilt-toward involves consequence-across-time*.
  - Conditions on Eira: she carries a secret (visible as a "weight" indicator if author flags it).

**Distinctive:** secrets and favours are first-class scene mechanics. The cast is six, with the Halren callback creating a dopamine spike (recognition: *"oh — he was there"*). The reach domain *Star* (Time-aligned) is foregrounded — at court, time and consequence are the levers; speaking now or later is a Sacrifice/Survival call (Martyr ↔ Survivor archetype pair). One Ascendant move (`divine-edict`) is *only available because of context* — a teaching moment. The Lord Talbain disposition is *especially* dynamic — leaning Eye on the right beat could let Eira reveal his secret in front of the conclave, irreversibly altering the faction landscape.

**This shows:** secrets, favours, ambitions, reputation as scene primitives; reach-domain rotation per scene (the encounter author picked Eye/Star/Heart for this moment, sidelining Iron); context-gated Ascendant moves; cast scaling to six with callback recognition; the moral axis (Star → Sacrifice ↔ Survival → Martyr ↔ Survivor) made structural in the lean tilt.

---

### 5.4 The Ritual of the Threshold (sphere magic, omens, places of power)

**Setting:** A ruined dolmen on the cliffs north of Bren, midnight. Eira has come because the small folk who once tended it are dying. The dolmen is dormant — but tonight the sphere alignment has shifted.

**Foregrounded primitives:** agent (Eira), sublocation (the dolmen — a place of power with `aligned_with: spirit, life`), echo (the legacy of the small folk who tended the place; bound to a small chronicle entry), sphere effect (Spirit dominance is briefly waxing tonight; visible as luminous threads in the painting), omen (a prior encounter generated an omen of "the cold that does not pass"), monster (a half-formed wraith — a sphere-aligned threat; tier 2; aspirational primitive: a divine mark on the place from a rival god), conditions (Eira: chilled to the bone; place: the threshold thins), trait (Eira has inherited "small folk's keeper" from the gate encounter — she is bound to protect them), reach domains (Spirit, Heart), divine actions (`divine.coincidence`, `divine.inspire`, `loc.consecrate` — place-targeting).

**Slot fills:**
- Hero panel: Eira / state: *"she shivers but does not move"* / capability foregrounds **Heart** (Spirit-paired) and **Star** (Time-paired). Items: an oil lamp; a coin from the gate scene (the Captain's token — could she leave it as offering?). Vows: vow to small folk (active, deepening because they are dying). Recent: the gate scene (callback-eligible because of the token), and *"a small folk burial, six turns ago"* (vow-related, eligible).
- Active card: the dolmen at midnight, sphere threads visible above the stones; "The Threshold Thins" prose. Tooltips on:
  - "the cold" (condition: chilled to the bone — visible in scene state)
  - "the threshold" (place trait: dormant gateway — sphere-aligned to Spirit, half-open tonight)
  - "what stands beyond" (the half-formed wraith — author-flagged for tooltip)
- Leans:
  - **HEART · open the lantern** — *"Stir her toward speaking the small folk's words. The wraith hears its name."* `↬ tilts toward SWORN` *(Spirit sphere coloring is automatic — Heart's pair)*
  - **STAR · place the coin** — *"Soften her stance. She leaves the Captain's token at the threshold. The vow deepens; the long arc is paid for."* (this expends an item from her inventory!) `↬ tilts toward MARTYR`
  - **SHADOW · withdraw and watch** — *"Hold her in place. The wraith does not see her tonight. Whatever happens, she will hear about it later."* `↬ tilts toward CONFESSOR` *(silent witness — Entropy sphere)*
- Cast (one or two):
  - The half-formed wraith (sphere-aligned, hostile if approached, ambiguous if named; *"to her: the dead the small folk could not bury"*) — silhouette portrait, sphere-tinted.
  - Optional: the small folk themselves, off-stage but present — represented as a single tile *"the small folk, dying"*, with disposition *"asking without speaking"*.
- Hand: Mark her with fate (rare, *brightly lit because the place is sphere-aligned*); Inspire her vow (`divine.inspire`); Consecrate the threshold (`loc.consecrate` — *only available at sphere-aligned places*; teaches the player); Whisper to the wraith (custom — `divine.persuade` retargeted at a non-mortal, costs more because not standard).
- Scene state:
  - Threads: the threshold's pull (taut, spirit-violet), the small folk's mourning (thin, heart-rose), the cold (fraying, omen-ghost-green).
  - Factions here: none formal; the dead are not a faction. *Off-stage: the rival god whose mark may be on this place — flagged but unconfirmed.*
  - Place conditions: ruined dolmen, midnight, threshold thinning; *the place is Spirit-aligned, so leans toward Heart (Spirit's reach pair) are favoured; +2 difficulty to leans whose tilt opposes the place's sphere; rival omen weight: cold-that-does-not-pass*.
  - Conditions on Eira: chilled (active, will compound if the scene goes long).

**Distinctive:** Heart and Star foregrounded for a Spirit-aligned ritual; Shadow appears as an unusual third lean. Omens are visible. Sphere influence is named on the place — and because the place is Spirit-aligned, the corresponding reach (Heart) is mechanically favoured. An Ascendant card is *only available because the place is sphere-aligned*. An item (the Captain's token) can be **consumed** by a lean choice — a real cost, not just essence. The wraith is a non-mortal cast member whose tile renders with sphere-tinted portrait.

**This shows:** sphere magic and effects, with the 1:1 sphere↔reach pairing visible mechanically; echoes; omens; place-of-power mechanics; non-mortal cast; item-consuming leans; reach-domain freedom (any 3 of 8 per scene); place-gated Ascendant moves; conditions compounding across beats; moral-axis tilt toward unusual archetype poles (Confessor — silent witness — is rare and load-bearing here).

---

## 6. Variety Levers

Where the toolkit's variety actually comes from. If an encounter feels samey, one of these levers wasn't pulled.

| Lever | Range | Effect on scene shape |
|---|---|---|
| **Cast size** | 0–8 | Solo dilemma → ensemble court; reflows the cast rail |
| **Cast type mix** | named NPCs · monsters · faction representatives · off-stage forces | Combat vs social vs intrigue vs cosmic |
| **Reach domain selection** | any 3 of 8 | Each scene foregrounds different capabilities |
| **Place sphere alignment** | none · single sphere · contested · place-of-power | Tilts mechanics, unlocks place-gated Ascendant moves |
| **Active conditions on protagonist** | 0–N | Wounded, cursed, marked, exhausted, blessed — scene starts non-baseline |
| **Faction stakes** | 0–N factions visible | Each adds threads in play and faction-chip representation |
| **Echo / callback density** | 0–N callback-eligible memories | Recognition-dopamine frequency; biographical weight |
| **Sphere effect visibility** | 0–N visible threads | Mystical scenes have many; mundane scenes have one or none |
| **Item consumption per lean** | none · optional · required | Lean costs an item, not just essence — real material stakes |
| **Beat count** | 1–~8 | One-beat punch vs slow-burn arc |
| **Aftermath shape** | receipt · forced choice · interpretation choice · mixed | Stake-scaled |
| **Hand availability** | constrained by scene primitives | Each scene exposes a different filtered hand |

The encounter authoring agent's job is to *tune these levers* so that every scene feels distinct — even when the underlying scaffold is the same.

---

## 7. The Encounter Authoring Agent's Workflow

Given a scene seed (a place + a triggering condition + a protagonist), the agent should:

1. **Read the world graph** — pull all primitives currently associated with the place, the protagonist, the relevant factions, and the recent encounter history.
2. **Choose foregrounded reaches** — pick the 3 of 8 reach domains that best characterise this scene. Each reach carries its sphere automatically (1:1 pair) and its archetype-pole moral axis.
3. **Cast the scene** — select N cast members from the actor pool present at the place + faction representatives + threats. Author dispositions per beat.
4. **Wire the threads in play** — name 3–5 threads that are taut/thin/fraying in this moment, drawn from the social fabric (reputation, secrets, favours, ambitions) + spheres + place conditions.
5. **Score the protagonist's view** — pick relevant items (mark `scene-relevant`), active vows, callback-eligible recent moments.
6. **Compose the beats** — write prose, mark tooltipped terms back to graph references, define leans (each lean: reach + cost + god-verb + agent reaction + tilts-toward + moral-axis-pole + fail-forward), specify aftermath. **Each lean must change the path, not just the adjective** (Rule 1) — three coloured variants of the same outcome should be cut to one.
7. **Filter the hand** — compute which Ascendant templates are scene-relevant from primitive presence (cast types, place type, factions, sphere alignment, bond tier). Hand cards click direct — no AgendaPicker step.
8. **Prepare aftermath shape** — which canonical effect kinds (`reputation_tally`, `intelligence`, `condition_attachment`, `hidden_mark`, `encounter_seed`, `spawn_artifact`, `faction_*`, `recent_event`) the encounter can produce; for big encounters, what choice the player faces. Each registered effect becomes an artifact materialising in the protagonist's panel at resolution time.

The agent **does not invent prose disconnected from primitives.** Every dotted-underline term in the prose should resolve to a graph entity (a tag, a condition, a secret, an ambition, a memory). That's what makes the world feel alive: the prose is a *reading* of the graph, not a story written beside it.

---

## 8. Open questions and next moves

### Resolved during the Vision audit (2026-05-04)

- ✅ **Three intervention verbs (nudge/whisper/vision)** — settled: encounter-specific verbs are author-content. The taste-profile hypothesis is dissolved. (Rule 3.)
- ✅ **Fate Forecast surface** — subsumed into the per-beat outcome forecast band above the prose. The legacy `Systems/Fate Forecast.md` doc gets superseded as part of the long-form plan ticket scope.
- ✅ **AgendaPicker** — dissolved into engine prose-lookup. Hand cards click direct. The 240 consequence templates remain as the engine's prose-table; the player-facing menu is removed because it changed the adjective, not the path (Rule 1).
- ✅ **Block as a fourth verb** — non-issue. Verbs are not a closed set. Watch-only is the Watcher's verb (meta-axis pole — Vanguard ↔ Watcher / Courage ↔ Prudence).
- ✅ **Reach count and Flesh** — 8 reaches confirmed; Flesh is retired and replaced by Quintessence (a meta-property). 1:1 sphere↔reach pairing is the canonical pattern.
- ✅ **Moral weight of leaning** — structural via the cosmological pattern: every reach lean tilts toward an archetype pole (Rule 2). The aggregate drift is the moral cost. UI surfaces it on the lean card and in the scene-state cumulative drift indicator.

### Still open — next plan decides

1. **Encounter templates as graph nodes** — should we promote encounter templates to first-class graph entities (with edges `gates_to`, `spawns_from`)? This would let chained arcs reach across the graph rather than living in static data. Recommended for the long-form plan.
2. **Relationship state as primitive** — a reified `relationship` node between any two actors, with history and trajectory, would make the *"to her: ..."* line in cast tiles much richer. Recommended.
3. **Divine marks as distinct primitives** — `blessing | curse | mark` as first-class nodes (not just attachments) would make divine intervention legible in scene state. Recommended.
4. **Item consumption in leans** — do we let leans expend items? Mechanically powerful (real material cost) but adds complexity. Worked example 5.4 demonstrates the use case; the design plan should confirm whether to support.
5. **Cast scaling beyond 4** — the right rail's cast region scrolls, but at 6+ the player loses peripheral awareness. Do we collapse minor cast members (the royal scribe, background brawlers) into a "+ N background figures" tile? Recommended to specify a cast-attention budget.
6. **Place-of-power Ascendant moves** — when the place is sphere-aligned, certain moves (`loc.consecrate`, `loc.place_of_power`) become available that aren't otherwise. The hand needs to teach this clearly — currently the toolkit assumes "dimmed cards explain themselves" but place-gating may need its own affordance.
7. **Off-stage cast representation** — in the court intrigue, "Civic Guard, off-stage" is a faction chip; in the ritual, "the small folk, dying" is a pseudo-cast tile. Are these the same thing represented differently, or genuinely different? Decision needed.

### Canonical doc updates required (part of long-form plan ticket scope)

- `Systems/Domain Word Scales.md` — stale. Still shows 9 reaches with Flesh. Update to 8 reaches + Quintessence (per `Brainstorms/brainstorm-cosmological-symmetry.md`).
- `Systems/Fate Forecast.md` — supersede; forwarding link to the encounter UI canonical (new doc to write).
- `Systems/Action Narrative System.md` — clarify that the AgendaPicker UI surface is removed; the agenda data persists as engine prose-lookup.
- `Vision/taste-profile.md` — soften or remove the §"Three intervention verbs" strong opinion. Replace with: *"verbs are encounter-specific, anchored in the cosmological pattern of reach + sphere + moral axis."*
- New `Systems/Encounter UI.md` — the v7 surface, slot mapping, registration animations, the path-vs-adjective rule. Currently lives in plan docs; promotion to canonical happens at the end of the long-form plan ticket.

---

## 9. Verdict question for the user

The Vision-audit drifts have been resolved (see §8 Resolved). Three things still need a verdict before this becomes the spine of the long-form design plan:

1. **Toolkit scope.** Have I named the right primitives? The discovery found 28 implemented + 3 gaps. Anything I missed that you know lives in the codebase or *should* live there?
2. **Slot mapping correctness.** For each UI region of v7, the slot mapping in §3 names where each primitive renders. Anything misaligned with how you imagine it?
3. **Worked-example coverage.** The four scenes (gate, tavern, court, ritual) exercise different primitive subsets. Do they collectively demonstrate enough variety, or is there a class of encounter (e.g. journey vignette, faction war battle, divine apparition) that the toolkit *must* cover and these four don't address?

If those land, the next deliverable is the **long-form design plan** — Engine / Content / UI pillars, NFP-compliant, with the seven still-open questions resolved into decisions, the encounter authoring contract specified more precisely, the lean primitive cosmological-pattern fully enumerated for v1, the canonical doc updates landed (Domain Word Scales / Fate Forecast / Action Narrative System / taste-profile / new Encounter UI canonical), and the encounter content guidelines aligned with Rules 1–3.
