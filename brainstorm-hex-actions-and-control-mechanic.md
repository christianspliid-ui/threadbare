# Brainstorm: Generic Avatar Hex Actions + Control Mechanic

**Date:** 2026-03-17
**Session type:** Cowork brainstorming
**Status:** Working notes — not a design doc yet

## Context

The hex detail view (HexChronicle) has 4 narrative layers: The Land, The Soul, The People, The Ruins. Currently only 4 hex action templates exist (Bless the Land, Corrupt the Land, Survey Territory, Seed Life) — all targeting the Land layer. The other 3 layers have zero player actions from hex context.

The Generalized Action Targeting system is ready — adding new hex actions is purely a content authoring task (new `UnifiedActionTemplate` entries with `targetCategories: ['hex']`).

## Design Direction

### 5 Action Verbs (not 4)

| Verb | CRUD mapping | Character |
|------|-------------|-----------|
| **Create** | `create` | Bring something into existence |
| **Find** | `read` | Perceive, search, reveal hidden information |
| **Change** | `update` | One-time modification for a one-time cost. Fire and forget. |
| **Destroy** | `delete` | Remove, corrupt, scatter, erase |
| **Control** | `update` (sustained) | Sustained effort requiring continuous resources, continuous focus, or stability. See [Control Mechanic](#control-mechanic). |

Change vs Control: Change is a one-time modification. Control is a sustained commitment that ties up resources, attention, or presence in exchange for ongoing effects. Control is the god-game signature — you don't just *do* things, you *hold* things.

### Actions are context-dependent

- Actions only appear if the actor meets prerequisites AND the target has relevant content
- No fixed cap on number of actions — the template pool is open-ended
- Hexes without historical culture don't show Ruins actions (except Create, which can work anywhere)

## Action Matrix

### The Land (terrain, biome, resources, divineInfluence, corruption)

**Create:**
- Seed Life (exists) — terraform barren land, +divineInfluence
- <AI>Raise Terrain — sculpt geography: raise hills from plains, create river forks, form islands?</AI>

**Find:**
- Survey Territory (exists) — reveal fog of war on hex + adjacent
- <AI>Dowse for Resources — reveal hidden resource deposits or water sources, ties into future resource system</AI>

**Change:**
- Bless the Land (exists) — one-time +divineInfluence bump
- Corrupt the Land (exists) — one-time +corruption
- <AI>Shift Season — locally alter growing conditions, force a bloom or a frost</AI>

**Destroy:**
- <AI>Scorch Earth — immediate terrain degradation, no slow corruption buildup, fast + expensive + dramatic</AI>
- <AI>Open the Earth — create chasms/broken_lands terrain, catastrophic, high essence cost</AI>

**Control:**
- Claim Dominion — consecrate this hex to your sphere; slows divineInfluence decay, resists corruption, ongoing cost
- Seal the Land — lock terrain from transformation (immune to corruption degradation or divine upgrades), costs focus
- Cultivate — sustained fertility boost; locations on this hex gain prosperity faster, essence drain per tick

### The Soul (sphere influence, magical saturation, leylines)

**Create:**
- Attune Leyline — establish sphere presence where none exists, inject sphere influence
- <AI>Plant a Seed of Power — create a latent magical node that grows over many ticks into a full leyline nexus</AI>

**Find:**
- Read the Currents — reveal sphere influences and intensities on this hex + adjacent, expose hidden sphere-aligned encounters
- <AI>Sense the Veil — detect whether the Veil is thin here, relevant for veil-reach actions and supernatural encounters</AI>

**Change:**
- Shift Dominion — push one sphere's influence up at the cost of another; rebalance the magical ecology (one-time)
- Amplify the Flow — one-time boost to magicalSaturation at all locations on this hex

**Destroy:**
- Sever the Flow — cut all sphere influence, reduce saturation toward zero, create a "dead zone"
- <AI>Dispel the Wild — purge uncontrolled/hostile magical effects, useful if rival sphere influence is growing</AI>

**Control:**
- Anchor the Sphere — lock the dominant sphere in place; prevents natural drift and rival sphere actions, continuous essence cost
- Channel the Current — sustained redirection of sphere flow; pull influence from adjacent hexes or push outward
- Tap the Source — bind to a sphere-aligned feature and siphon essence per tick (see canonical example below)

### The People (cultures, factions, agents, encounters, locations)

**Create:**
- Send a Herald — spawn a wandering agent aligned to your sphere on this hex
- Found Settlement — seed a new location node (hamlet/camp) — high cost, slow, most impactful Create
- Spark an Encounter — force-generate an encounter at a location on this hex

**Find:**
- Divine the Populace — reveal hidden agents, faction loyalties, disposition, unrest levels
- Scry the Factions — expose faction presence and influence at all locations on this hex
- <AI>Listen to the Land — overhear ongoing encounters or agent plans, passive intelligence action</AI>

**Change:**
- Stir the People — one-time shift to cultural values or faction disposition
- Summon Congregation — draw agents from adjacent hexes toward this one (one-time pull)
- <AI>Inspire Migration — move an entire culture's activity center between locations</AI>

**Destroy:**
- Scatter — force agents to flee, dissolve a faction's local presence
- Smite — kill or remove a specific agent (expensive, high detection)
- Incite Exodus — trigger mass departure from a location, tanking prosperity

**Control:**
- Install a Champion — elevate an agent to faction leadership; they serve your interests but you must maintain their loyalty (essence or attention cost). Neglect → drift or betrayal.
- Impose Decree — sustained behavioral constraint on all agents at this hex ("no violence," "mandatory tithes," "seal the borders"). Costs focus per tick. High-independence agents resist harder.
- Shepherd the Flock — sustained conversion pressure; agents on this hex drift toward your worship over time. Essence drain per tick, high-independence agents resist.

### The Ruins (historical culture, archaeology, exploration hooks)

Context-gated: most only appear on hexes with historical culture. Create is the exception.

**Create:**
- Mark the Ground — plant an exploration hook where none exists (works on any hex)
- Raise the Ruins — restore a ruined sublocation to functional status (shrine → active shrine, ruin → outpost)
- <AI>Fabricate a Legacy — invent false historical culture trace, create fake ruins to attract explorers or mislead rivals</AI>

**Find:**
- Excavate — uncover hidden artifacts buried in the ruins
- Read the Stones — reveal the full historical culture narrative (etymology, epitaph, cause of fall)
- <AI>Archaeologist's Vision — see what the location looked like in its prime, cosmetic/narrative, could unlock unique encounter templates</AI>

**Change:**
- Consecrate the Past — align the ruins to your sphere; changes narrative resonance and may alter what encounters spawn there (one-time)
- Rewrite History — alter the historical culture's legacy, change what traits it passes to successor cultures (one-time)
- Restore a Fragment — partially rebuild, creating a unique sublocation blending old and new

**Destroy:**
- Bury the Past — collapse ruins, erase historical traces, remove exploration hooks. The land forgets.
- Desecrate — corrupt the ruins into a source of corruption or hostile encounters
- <AI>Unmake the Memory — erase the historical culture from the world model entirely, scorched-earth, very expensive</AI>

**Control:**
- Bind the Echoes — claim ownership of the ruins as a node in your influence network; resists rival interference, ongoing stability cost
- Seal the Tomb — sustained lockdown; nobody can excavate or interact. Cheap to maintain but blocks all other Ruins actions. Useful for denying rivals.
- <AI>Awaken the Guardians — activate ancient defenses; ruins become hostile to unauthorized visitors, functioning as a defensive installation, essence per tick</AI>

## Control Mechanic

### Definition
Control = sustained effort. Distinct from Change (one-shot update). Both map to `crudType: 'update'` — Control is distinguished by a **duration mode**, not a new CRUD type.

### Control Slots
- Player has a limited number of control slots
- Slot count scales with Domain Capability tier in the relevant Reach
- <AI>Options: total slots = sum of highest N reach tiers? Or per-reach slots (e.g. Veil tier 6 = 3 Veil-flavored control slots)? Per-reach means specialization matters more.</AI>

### Sustain Models (heterogeneous — not one-size-fits-all)

Different Control actions have different sustain conditions. At least three patterns:

1. **Essence drain** — continuous per-tick cost (e.g., Shepherd the Flock costs essence/tick)
2. **State threshold** — requires a world-state condition to remain true (e.g., entropy ruin tap requires hex corruption ≥ 0.5; if corruption drops below, control lapses)
3. **Ritual investment** — upfront cost of essence + ticks, then self-sustaining as long as threshold holds

These can combine. A control action might need a ritual to establish, then a threshold to maintain, and if the threshold is threatened you could spend essence to prop it up.

### Visibility and Contestation

- Active control effects become **visible encounter nodes** on the hex
- The encounter has **prerequisites** — only agents/ascendants who meet stat thresholds can see it and attempt it
- Prerequisites check the rival's Domain Capability in the relevant Reach + sphere alignment
- A random farmer walking by doesn't see your entropy well. An entropic superagent does.
- Outcomes: **usurp** (rival meets prerequisites AND wins → they take control) or **destroy** (rival wins but wrecks it — investment lost for everyone)
- Usurp only works if the rival themselves has the prerequisites to take control — they must be qualified, not just strong enough to break it

### Canonical Example: Tap Entropic Source

- **Action:** Tap the Source (Control / Ruins or Soul)
- **Prerequisites to establish:** Player's Veil capability ≥ tier 4, hex has historical culture with entropic traces
- **Establishment:** Ritual — 5 essence invested over 5 ticks
- **Sustain condition:** hex corruption ≥ 0.5
- **Benefit:** generates entropic essence per tick (amount scales with hex corruption level)
- **Visibility:** spawns encounter node: "Bound Entropy Well"
- **Encounter prerequisites for rivals:** Veil capability ≥ tier 5 AND (entropic alignment for usurp, OR opposing-sphere alignment for destroy)
- **Usurp path:** rival with entropic alignment + sufficient Veil takes it over — they inherit the infrastructure
- **Destroy path:** rival with opposing alignment (e.g. Star/Life) shatters the well, purging corruption, ending the effect
- **Natural failure:** corruption drops below 0.5 (because someone Blessed the Land nearby) → tap breaks on its own

## Prerequisite System

### Two-axis model (Reaches × Spheres)

Both axes serve as prerequisite gates. From original design research:
- **Reaches** = activity categories in the world (the Nine Reaches: Iron, Gold, Shadow, Veil, Heart, Eye, Stone, Star, Flesh)
- **Spheres** = cosmic energies or threads that fuel activities and make some easier, others harder (Foundation: Chaos/Order/Light/Darkness + Creation: Force/Matter/Energy/Life/Mind/Spirit/Time/Entropy)

These are orthogonal. Both are load-bearing for prerequisites:
- **Reach prerequisite** gates *competence* — "can you do this type of activity at this level?" (Domain Capability tier check)
- **Sphere prerequisite** gates *alignment* — "does your cosmic energy match what this effect requires?" (sphere affinity check)

### Ascendants use the same system as agents
- Ascendants are very powerful former mortals who understand how the universe works
- They have Domain Capability tiers just like agents — same prerequisite checks apply
- Power level is high but tunable — no special bypass
- This creates meaningful build identity: an ascendant with low Veil capability genuinely can't tap an entropy ruin

### Template shape

```
actorPrerequisites: {
  reach?: { domain: ReachDomain, minTier: number },   // competence gate
  sphere?: { name: SphereName, relation: 'aligned' | 'opposing' },  // alignment gate
}
```

Both optional per template. Some actions only need reach competence. Some only need sphere alignment. The interesting ones need both.

### Agent essence — deferred
- Agents should also have access to some level of essence
- Not designing now — comes with the spell system

## Obsidian Updates Made

- Created [[Spheres and Reaches]] consolidated note in `Cosmology/` — canonical reference for how the two axes relate
- Documented vault cleanup needs:
  - `Cosmology/Shadow.md` is a misplaced reach note (Shadow is a Reach, not a Sphere)
  - `Cosmology/Entropy.md` references outdated "Spiritual Domain" naming
  - Index.md needs Agent Wheel, Divine Toolkit, Intervention Delivery marked as deprecated (patch API failed — needs manual or Claude Code update)

## Deprecation Notes

See `deprecation-notice-wheel-and-fixed-actions.md` for:
- Intervention wheel → replaced by ActionDrawer + Generalized Action Targeting
- Fixed action count → replaced by open-ended, data-driven template pool
- List of design docs needing deprecation headers
- CLAUDE.md rejected approaches additions
- Source files to check for dead code

## Lineage: Actor CRUD Action System (2026-03-03)

The original design doc ([Notion: Design: Actor CRUD Action System](https://www.notion.so/Design-Actor-CRUD-Action-System-3182b241dfb081fa9b91d160999e2f34)) established the 48-template CRUD catalog and the domain→sphere alignment table. Key evolution since then:

**8 Domains → 9 Reaches:** Military→Iron, Economic→Gold, Political→Shadow, Magical→Veil, Social→Heart, Knowledge→Eye, Geographic→Stone, Spiritual→Star, plus Flesh (added later — was missing from original 8).

**Sphere alignment decoupled:** The original doc had fixed domain→sphere pairings (Military=Force, Economic=Matter, etc.). This evolved into the orthogonal model: any Reach can be fueled by any Sphere. "Military = Force" became "Iron reach *can* be fueled by Force, but also by Entropy (undead army), Mind (psionic warfare), Life (berserker rage), etc."

**"You can't Update what you haven't Read"** — This original principle is load-bearing for our hex action design. Find actions should gate Change/Control actions. You shouldn't be able to Tap an Entropic Source if you haven't first done Read the Currents to discover the sphere influence. This creates natural action chains: Find → Change/Create → Control.

**Scale levels still relevant:** The original Cosmic/Regional/Local/Personal scale maps to hex actions as mostly Local or Regional, with Control effects potentially reaching Cosmic scale for god-level sustained dominion.

## Open Questions

1. Control slot scaling — per-reach or global pool?
2. Should some Control effects be sphere-specific variants (e.g., "Anchor the Sphere" has different costs/effects depending on which sphere you're anchoring)?
3. How do Control effects interact with the existing encounter resolution pipeline — are they literally encounter templates with a `persistent: true` flag?
4. When a rival usurps, do they inherit your ritual investment (free takeover) or just take the slot and start fresh?
5. What's the visual treatment for Control effects on the hex map? Glow? Icon? Persistent thread animation?
6. Should Find actions explicitly gate Change/Control? ("You can't Update what you haven't Read" from original CRUD design.) If so, how does the prerequisite system track "player has already Read this hex's Soul layer"?
7. The original 48 templates had 12 per CRUD type. Our current hex matrix has ~40+ concepts across 5 verbs × 4 layers. How many should be sphere-generic vs sphere-specific variants?
