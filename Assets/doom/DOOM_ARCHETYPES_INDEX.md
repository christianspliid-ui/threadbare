# Doom Archetypes — Complete Package Index

This directory contains three complete doom archetype asset packages for The Fantasy World Simulator. Each package defines how the world ends in a distinct way, with unique mechanical, narrative, and visual characteristics.

## Overview

| Archetype | Path | Trigger Spheres | Twilight Length | Harvest Rate | Tone |
|-----------|------|-----------------|-----------------|--------------|------|
| **The Breach** | `./the-breach/` | Force, Chaos, Entropy | 7-10 ticks | 30% | Violent, alien, invasive |
| **The Convergence** | `./the-convergence/` | Order, Mind, Energy | 5-7 ticks | 80% | Transcendent, meditative, inexorable |
| **The Reckoning** | `./the-reckoning/` | Time, Spirit, Darkness | 6-9 ticks | 65% | Melancholy, reflective, memorial |

---

## The Breach
**Path:** `/Assets/doom/the-breach/the-breach-package.md`

The world tears apart from *outside*. A breach in the cosmic membrane allows hostile forces to pour through. Force, Chaos, and Entropy violently rupture reality. The Twilight Phase is 7-10 ticks of escalating structural collapse: terrain fractures, magic threads snap and escape, agents are pulled into voids. It's fast, violent, and catastrophic. Low harvest rate (30%) because essence leaks through the rupture.

**Key mechanics:**
- Fast doom acceleration (+0.5 baseline)
- Terrain becomes "Sunken" and impassable
- Agents are "Pulled" toward rupture
- Essence leaks to the void
- Stage 6 features massive burst of magic dissipating
- Recovery next cycle: world is weakened (Fundament −5-10%)

**Narrative:**
- Something ancient and hostile presses inward
- Reality treated as tissue paper
- Ground opens beneath your feet
- Threads tear and scatter like broken rope
- The void is geometrically wrong, non-Euclidean

---

## The Convergence
**Path:** `/Assets/doom/the-convergence/the-convergence-package.md`

All forces collapse *inward* toward a single point. Order, Mind, and Energy create irresistible gravity. The Twilight Phase is 5-7 ticks of geometric compression: terrain curves inward, agents drift together, minds merge into unity, individuality dissolves. It's meditative and beautiful but inescapable. High harvest rate (80%) because essence pools efficiently at the singularity.

**Key mechanics:**
- Slow doom acceleration (+0.3 baseline)
- Terrain becomes geometric, perfectly regular
- Agents merge into collective consciousness
- Distances collapse (movement rules suspended)
- Agents can "Ascend" voluntarily for essence bonus
- Stage 5 features all of reality at a single point
- Recovery next cycle: world is more ordered (Fundament +3-5%, Order manifest easier)

**Narrative:**
- Everything falls toward the center
- Peaceful surrender to unity
- Geometric perfection emerges from chaos
- Individual identity dissolves
- Transcendence as erasure

---

## The Reckoning
**Path:** `/Assets/doom/the-reckoning/the-reckoning-package.md`

The past manifests alongside the present. Time, Spirit, and Darkness bring forth echoes of all previous cycles—ghosts of the dead walk the world again. The Twilight Phase is 6-9 ticks of temporal layering: agents encounter their own echoes, ghosts accuse them of old debts, past and present occupy the same space. It's introspective and melancholy. Harvest rate (65%) is influenced by player choices—absolution preserves essence, denial corrupts it.

**Key mechanics:**
- Moderate doom acceleration (+0.25 baseline, +0.15 per agent death)
- Terrain shows multiple versions (past/present) simultaneously
- Agents can "Confess" debts and gain absolution
- "Haunted Legacy" (−1 Authority) or "Absolved Heritage" (−1 doom acceleration) outcomes
- Stage 5 features apex of temporal haunting
- Final ascension of spirits upward
- Recovery next cycle: world has ancestral wisdom (Spirit manifest easier, richer echo library)

**Narrative:**
- The dead walk the world again
- Every choice echoes across time
- You see yourself in the faces of ghosts
- Past and present become indistinguishable
- Memory made tangible

---

## Package Contents

Each archetype folder contains:

```
the-[name]/
├── the-[name]-package.md          # Complete archetype specification
│   ├── Lore Text                   # 2 paragraphs of evocative prose
│   ├── Concept Art                 # Prompt for 16:9 panoramic generation
│   ├── Hex Overlay                 # Prompt for 1:1 hex effect generation
│   └── Game Logic
│       ├── Trigger Spheres         # Which spheres drive this doom
│       ├── Doom Acceleration Rules # How doom speed changes
│       ├── Twilight Phase Effects  # 5-10 tick breakdown with mechanics
│       ├── Terrain Transformation  # How landscape changes with doom %
│       ├── Agent Impact            # How agents are affected at each stage
│       ├── Harvest Modifier        # How essence is preserved/lost
│       └── Narrative Vocabulary    # Atmosphere, sounds, textures, colors, imagery
```

---

## Implementation Notes

### Doom Progression
Each archetype follows a **5-stage escalation model** during the main game, then enters a **Twilight Phase** (5-10 additional ticks) once doom reaches 100%. The Twilight Phase is fully playable—players can still act and make choices, but the world is ending.

**Stages (main game):**
1. Whispers / Distant Pull / Old Debts Surface (0-20%)
2. Signs / Gathering Forces / Witnesses Gather (20-40%)
3. Tremors / The Drawing / The Accounting (40-60%)
4. Crisis / Convergence Point / Judgment Begins (60-80%)
5. Culmination / The Singularity / The Reckoning (80-100%)

**Twilight Phases** have archetype-specific stage names and escalate mechanical effects every tick.

### Trigger Conditions
Each archetype has a **weighted sphere trigger**. The doom archetype for a run is determined at world creation based on the World-Soul's current state and the player's sphere choices. A world saturated in Force + Chaos + Entropy is more likely to trigger The Breach. A world with excess Order + Mind is more likely to trigger The Convergence. A world with high Time + Spirit and significant past trauma is more likely to trigger The Reckoning.

### Visual Direction
**All visual prompts follow the Threadbare style guide** (`STYLE.md`):
- Dark fantasy oil painting aesthetic
- Magic as concentrated threads (not ambient glow)
- Sphere-specific form language (Force = impact radiants, Order = geometric grids, etc.)
- 85-95% darkness, 5-15% bright magic
- No bright daylight, no UI elements, no text
- Chiaroscuro with magic as the primary light source

Concept art (16:9) and hex overlays (1:1) are separate images designed to composite together:
- **Concept art** shows the panoramic world-scale view of the doom in progress
- **Hex overlays** show the quarter-scale tile effect used during gameplay

---

## Integration Checklist

When implementing these archetypes into the game engine:

- [ ] Add lore text to the Chronicle (displayed at doom stage transitions)
- [ ] Implement Twilight Phase tick loop with archetype-specific effects
- [ ] Wire Doom Acceleration Rules to game state (rival actions, agent deaths, player interventions)
- [ ] Add Terrain Transformation logic (hex state changes based on doom %)
- [ ] Implement Agent Impact effects (status application, behavior modification)
- [ ] Add Harvest Modifier calculations (post-Unmaking essence preservation)
- [ ] Generate concept art from prompts (16:9 panoramic)
- [ ] Generate hex overlays from prompts (1:1, semi-transparent PNG)
- [ ] Compose visual style tiles showing sphere form language per archetype
- [ ] Create audio design based on "sounds" vocabulary (ambient, effects, music)
- [ ] Add UI flavor text for status effects and stage transitions
- [ ] Implement post-Unmaking reflection screens (harvest rate, legacy modifiers)

---

## References

- **STYLE.md** — Visual style guide, sphere colors, form language
- **Docs/plans/2026-03-04-phase3a-rival-gods-and-doom-clock.md** — Doom clock system architecture
- **Docs/plans/2026-03-04-high-level-discovery-pass.md** — Cosmology (8 Creation + 4 Foundation spheres)
- **Notion backlog** — Task tracking and integration phases

---

**Created:** 2026-03-05
**Status:** Complete, ready for implementation
