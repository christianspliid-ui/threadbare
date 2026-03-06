# The Breach — Doom Archetype Package

## Lore Text

The world was never meant to be alone.

For eons, the veil between realities held firm—a thin, ancient thing of thread and principle, the cosmic membrane that separated Threadbare from what lay beyond. But something has punched through. The forces outside are not gods or demons; they are *older*, *hungrier*, and utterly indifferent to the sacred geometry that contained them. They pour through tears in the fabric like infections in a wound, like water through breaking dams. There is no negotiation with the Breach. There is only the flood.

The ground fractures not from internal force but from external pressure—the weight of something vast pressing *inward* from the dark beyond. Reality unravels like burnt cloth. Magic threads snap and writhe as they're pulled toward the rupture. The sky doesn't crack; it *peels back*, revealing the howling void behind it. The last moments of the world are not a silent fading but a violent tearing, a desperate scream as something old and precious is devoured by something ancient and ravenous.

---

## Concept Art
`the-breach-concept.png` — 16:9 panoramic. ✅ Generated.

**Prompt description:** Epic oil painting of a dark fantasy world being torn apart. A massive jagged rupture splits the sky—not lightning-like but a permanent wound, its edges spreading like a spiderweb of fractures. The world beyond the tear is *wrong*—a void that is not black but a swirling, turbulent non-color, alien and geometrically hostile. Chaos magic (#8a8a8e) swirls in fractals around the rupture; Force magic (#ff4444) erupts in violent directional streaks from impact zones where the pressure is greatest; Entropy threads (#5a8a7a) unravel and scatter like frayed fiber. The ground near the rupture splits into jagged chasms with sharp Force-colored violence at the edges. Distant landscape collapses—mountains crumble, forests uproot, terrain inverts into alien geometry. Agents and structures silhouetted against the growing rupture, dwarfed by the cosmic violence. Primary lighting from the void-light beyond the tear, casting everything below in sick, distorted shadows. Painterly, dark chiaroscuro, scale is vast and overwhelming. Style: Diablo 3 worldscape meets Elden Ring cosmic dread meets H.R. Giger's alien geometry.

---

## Hex Overlay
`the-breach-hex.png` — 1:1. ⏳ Not yet generated.

**Prompt description:** Semi-transparent hex overlay showing the Breach doom effect. A jagged fracture line splits the hex diagonally from one edge toward the center—sharp, violent edges. Chaos magic threads (#8a8a8e) in fractals spread like cracks from the fracture. Force magic threads (#ff4444) explode outward in sharp directional streaks and impact radiants from the deepest points. Around the rupture, the hex's surface warps—edges curl inward as if the fabric is being pulled, creating depth and distortion. No terrain visible, semi-transparent except for the bright magic concentrations. The effect should read as "reality tearing open." 10-20% coverage focused on the fracture line.

---

## Game Logic

### Trigger Spheres
| Sphere | Weight | Role |
|--------|--------|------|
| **Force** | 0.35 | Primary driver — the breaching force is violent, directional, aggressive |
| **Chaos** | 0.30 | Unpredictability — the breach expands in fractals, no pattern |
| **Entropy** | 0.20 | Degradation — threads snap and fall apart as they're pulled outward |
| **Mind** | 0.10 | Existential pressure — agents experience breaking cognition, madness at edges |
| **Darkness** | 0.05 | The void beyond is absorbing, pulling inward |

**Trigger condition:** Excess Force + Chaos + Entropy, especially if Mind is low (world cannot comprehend or integrate the breach).

---

## Doom Acceleration Rules

- **Baseline acceleration:** +0.5 per tick (fast doom, violence accelerates itself)
- **Rival god "attack" action:** +0.10 per attack (rivals physically assault the veil, worsen the rupture)
- **Player stealth intervention (successful):** -0.15 per intervention (stabilizing the edges, buying time)
- **High Force sphere saturation in world:** +0.05 per 10% saturation (violent world accelerates violent end)
- **Low Order sphere in Fundament:** +0.07 (structural integrity failing)
- **Stage escalation event:** Auto-accelerate by +0.20 when entering next stage

---

## Twilight Phase Effects

The Twilight Phase for The Breach lasts 7-10 ticks. Each tick escalates the violence of the rupture.

| Tick | Effect | Visual | Mechanical Impact |
|------|--------|--------|-------------------|
| 1 (Stage 5: Entry) | **The Rupture Expands** — A visible wound tears through the sky. Void-light pours in. | Jagged rupture splits the sky; Chaos fractals spread from the edges; void beyond is swirling and wrong. | All agents gain "Panic" state (−2 to all action rolls). Terrain hexes at rupture epicenter become "Fractured" (impassable, deals Void damage to anything that tries to cross). |
| 2 | **Veil Unraveling** — Magic threads snap like overstrained rope. Creation Sphere threads visibly tearing free from world nodes. | All magic overlays on hexes begin to "float" upward, detaching. Brilliant but chaotic threads spiral toward the rupture. | All agents must make a resilience check (d100 vs. 50 + current doom %) or take 1 Void damage. Essence pools in world begin to *leak* upward (lose 5% essence per tick from this point forward). |
| 3 | **Ground Gives Way** — Terrain chasms open suddenly beneath inhabited hexes. Locations begin to collapse into voids. | Chasms split across hexes; Chaos and Force threads explosion-like at fracture points; areas "peel back" to show swirling non-space beneath. | Terrain hexes now have 40% chance per hex to become "Sunken" (agents in those hexes take 2 Void damage per tick, must flee or die). Major locations at risk of "Collapse" (buildings destroy, inhabitants must evacuate). |
| 4 | **Pressure Spike** — The void-force *pushes* inward. Everything is pulled toward the rupture. Agents drift helplessly. | Subtle but rising visual distortion—lines warp toward the rupture center as if gravity has inverted. Chaos fractals accelerate. Force threads become violent horizontal streaks pointing inward. | All mobile agents are "Pulled" (−3 to movement rolls, must succeed or drift 1 hex closer to rupture per tick). Stationary entities (cities, landmarks) begin to sink and slide toward rupture. |
| 5 | **Reality Rejection** — The border between the world and the void becomes fuzzy. Agents at the edge begin to see *through* to the other side. Madness spike. | The rupture's edges are now flickering, unstable. Void shows glimpses of alien geometry, non-Euclidean structures. Agents at the edge appear partially transparent, "bleeding out" into the void. | Agents within 3 hexes of rupture must make Mind resilience check (d100 vs. 70 + current doom %) or gain "Void-Touched" (hallucinating, −4 to all rolls, may act randomly). |
| 6 | **Final Severance** — The last threads snap. Creation Sphere magic, unable to anchor to the breaking world, erupts outward in one final spectacular moment before dissipating. | A brilliant burst of all 8 Creation Sphere colors simultaneously—a dazzling aurora of threads flying upward and dissolving into particles. Beautiful and terrible. | All essence in the world is *harvested* (drain remaining essence pools to 0). Agents lose all active spells/miracles. One final moment where players can witness the beauty before devastation. |
| 7 | **The Void Expands** — The rupture is now larger than the world. More area is *outside* than inside. Reality is collapsing inward to fill the void. | Rupture covers 60%+ of visible sky. Void-light drowns out all other light. The world is now surrounded by the breach on all sides, shrinking. | Agents must reach "Safe Zones" (predefined loci of high Order/Light sphere presence) or be "Unmade" (permanent removal from world). Global Unmaking begins if any agent is still unmade. |
| 8 (optional, high doom) | **The Swallowing** — The void has won. The world is inverted—what remains is a bubble of reality inside an infinite void. Agents who survived are now witnessing the final dissolution. | Inverted space—agents stand on the *inside* of a shrinking sphere. Void is all around them. Threads of remaining magic drift downward into the abyss. | Passive Void damage (1 per tick) to all agents. All locations are now sinking. This is endgame; the Unmaking is completing. |
| 9-10 (only if extended with cosmic intervention) | **Echoes of the Breach** — Fragments of the void-space drift through what remains. Ghostly shapes of alien things briefly manifest before being pulled away. The world is fragmenting into pieces. | Void-space subdivides into fractal shards. Magic threads are completely disconnected, floating. Ghosts of what was briefly visible in the void-fragments. | All agents are "Shattered" (separated into isolated pockets). Communication between zones fails. Each pocket of survivors faces their own local Unmaking. |

---

## Terrain Transformation

| Doom % | Terrain Effect | Progression |
|--------|----------------|-------------|
| 0-20% | No visible change — subtle distortions, sky slightly wrong | Awareness phase — careful observers notice cracks forming in reality. No mechanical effect yet. |
| 20-40% | "Fractured Fringe" — terrain at edges develops hairline cracks. Sky discolors at horizon. | Hexes within 8 hexes of eventual rupture point begin to take on a fissured appearance; no impassability yet. |
| 40-60% | "Splintered Reaches" — visible splits in terrain. Some hexes become impassable. First chasms open. | Chasms now block movement in affected hexes; terrain physically fractures; visual split becomes undeniable. |
| 60-80% | "Sunken Lands" — large sections of terrain invert, creating abysses. Many hexes are now Sunken. | More than 40% of map may be Sunken; travel becomes desperate routing through remaining safe hexes. |
| 80-100% | "The Inverted Sphere" — the world as a whole inverts; remaining land is a floating island in void. | No new terrain added; all remaining hexes are under constant Void pressure. The world is fundamentally broken. |

---

## Agent Impact

| Doom % Range | Agent Effect | Description |
|--------------|--------------|-------------|
| 0-25% | "Unease" | Agents experience unsettling dreams. Minor morale penalty (−1 to social rolls). Some whisper about the pressure they feel. No mechanical penalty yet. |
| 25-50% | "Trembling" | Agents are visibly frightened. Movement becomes sluggish (−1 to Reach rolls). Panic state triggered in crowds. Agents may refuse dangerous tasks. |
| 50-75% | "Breaking" | Agents suffer Void-Touched status spontaneously. Dreams become nightmares. Some agents "Flee" (leave the world permanently, cannot be recalled). Divine interventions to stabilize minds cost +3 Essence. |
| 75-90% | "Shattering" | Agents at the edges (near rupture) are pulled toward it. Death becomes common. Only the strongest or most protected survive. Those who do are "Scar-Marked" (permanent −2 Resolve, haunted by void-touch). |
| 90-100% | "Unmade" | Agents not in Safe Zones are literally erased from the world (cannot be resurrected, even through echoes). Those in Safe Zones are isolated, helpless, watching the world die. |

---

## Harvest Modifier

**The Breach is catastrophic for World-Soul preservation.**

- **Base Harvest Rate:** 30% (normally ~60% of world's magic essence is preserved for next cycle)
- **Modification:** Each stage beyond Stage 3 reduces harvest by 10% (Stage 4: 20%, Stage 5: 10%)
- **Void Damage Penalty:** All agents lost to Void damage are *permanently lost*—cannot be echoed. Their memory is erased.
- **Essence Leak:** Essence that "escaped" through the rupture is permanently lost to the world-soul. Only essence in the hands of agents or locked in structures is saved.
- **Next Cycle Consequence:** The resulting new cycle is born with a "Scar" (Fundament coefficient reduces by 5-10%, making magic weaker in the next world. Order sphere is harder to manifest.)

**Strategic implication:** The Breach is a *losing* scenario. Players who face it should focus on evacuation and minimal essence loss, not world preservation. The world after a Breach recovery will be weakened.

---

## Narrative Vocabulary Tags

```
atmosphere:
  - "suffocating pressure from beyond"
  - "the breaking of cosmic law"
  - "invasion from outside all worlds"
  - "violent forced unfurling"
  - "hostile alienness"
  - "the scream of reality tearing"

sounds:
  - "low, omnipresent humming (pressure)"
  - "sharp cracks like ice breaking"
  - "winds from nowhere, geometrically wrong"
  - "threads snapping (high-pitched)"
  - "the world sighing/groaning as it tears"
  - "whispers in languages that aren't language"
  - "silence where sound should be"

textures:
  - "edges that cut if you touch them"
  - "ground that feels hollow under feet"
  - "magic threads becoming brittle, fraying"
  - "sky peeling like burnt paint"
  - "fractals in every direction"

colors:
  - "void-black that isn't quite black (hyperdark, infinite)"
  - "Chaos grey (#8a8a8e) fractals spreading"
  - "Force crimson (#ff4444) explosion-lines at rupture edges"
  - "Entropy sea-green (#5a8a7a) threads unraveling into motes"
  - "Void-light: sickly non-color at rupture, no standard name"
  - "Everything desaturated and pulled toward the tear"

imagery:
  - "a wound in the sky that spreads like infection"
  - "something vast and hostile pressing inward"
  - "reality as tissue paper being torn open"
  - "threads pulled toward a single point of devastation"
  - "chasms that shouldn't exist (pulling inward, not down)"
  - "agents drifting helplessly toward the rupture"
  - "ghostly shapes in the void (non-Euclidean, briefly visible)"
  - "the final burst of magic ascending, dispersing"
  - "a world becoming a bubble in an infinite void"
```
