# The Reckoning — Doom Archetype Package

## Lore Text

The past has come due.

Every choice echoes. Every soul taken, every promise broken, every sacred boundary crossed—the World-Soul remembers. And in the Reckoning, all those debts come forward at once. The dead rise not as monsters but as *witnesses*. They walk alongside the living, ghosts of cycles past, speaking the words they left unsaid. Buildings echo with the cries of those who died in them. Whole populations manifest as echoes from worlds that should be forgotten. The present can no longer hide from its history. The barrier between what-was and what-is dissolves.

It is not violent or chaotic. It is melancholy, terrible, and inescapable. The living see themselves in the faces of the dead—ancestors, descendants, alternate versions. They see the consequences of their actions made flesh (or whatever the dead have instead of flesh). Some go mad. Some find peace. But there is no escape from the Reckoning. You cannot run from your own past. The world ends not with fury but with the unbearable weight of every moment that came before, finally, *finally*, asking to be acknowledged.

---

## Concept Art
`the-reckoning-concept.png` — 16:9 panoramic. ✅ Generated.

**Prompt description:** Dark oil painting of a world haunted by itself. The present-day landscape is visible but semi-transparent, ghostly. Overlaid upon it are phantom versions of the same landscape from previous cycles—buildings that don't exist anymore visible as transparent ruins, agents from past ages walking alongside the living, monuments from dead worlds still standing. Time magic threads (#ff9933) form concentric ripples and temporal distortions where past and present overlap. Spirit magic (#aa44dd) appears as ascending wisps of ghosts, echoes of the dead visible as shadowy figures with sad faces. Darkness magic (#4a3a8a) pools in the gaps between layers, void-like but not threatening. The sky shows multiple suns or moons from different eras, all visible at once. Lighting is memory-light—soft, nostalgic, mournful, as if lit by candlelight and starlight rather than the sun. Foreground shows living agents encountering their dead counterparts, sometimes touching, sometimes turning away. The overall feel is profoundly sad, achingly beautiful, like wandering through a memorial that is still alive. Style: Guillermo del Toro's Pan's Labyrinth meets Elden Ring's grace-cursed landscapes meets oil painting memento mori.

---

## Hex Overlay
`the-reckoning-hex.png` — 1:1. ⏳ Not yet generated.

**Prompt description:** Semi-transparent hex overlay showing Reckoning effects. The hex shows layered transparency—multiple versions of the same hex visible at different depths, each slightly faded. Time magic threads (#ff9933) form concentric ripples and time-wave rings, overlapping from center to edge, creating echo-imagery. Spirit threads (#aa44dd) appear as ascending wisps, ghostly trails rising from the edges toward the top of the hex. Darkness threads (#4a3a8a) fill the gaps between layers, subtle but omnipresent. At the center or edges, faint outlines of past-cycle structures or agents are barely visible—translucent, monochromatic, haunting. The effect should read as "layered in time, haunted by history." Semi-transparent but the layering effect is strong. 10-20% coverage.

---

## Game Logic

### Trigger Spheres
| Sphere | Weight | Role |
|--------|--------|------|
| **Time** | 0.35 | Primary driver — all moments collapse onto each other, past made present |
| **Spirit** | 0.30 | The dead rise — echoes of previous cycles walk the world again |
| **Darkness** | 0.20 | Void between moments — the gaps where history pools and lingers |
| **Mind** | 0.10 | Memory and witness — consciousness carries the weight of what-was |
| **Entropy** | 0.05 | Degradation of time's arrow — causality becomes uncertain |

**Trigger condition:** High Time + Spirit saturation, especially if agents have died, cities have been destroyed, or promises have been broken (moral "debt" in the world-state).

---

## Doom Acceleration Rules

- **Baseline acceleration:** +0.25 per tick (sorrowful but inevitable)
- **Rival god "attack" action:** +0.08 per attack (each death adds to the reckoning, more spirits rise)
- **Agent death in the world:** +0.15 per death (each death calls forth another echo)
- **Player stealth intervention (mercy, forgiveness):** −0.10 per intervention (compassion toward the dead slows the reckoning)
- **High Spirit sphere saturation:** +0.07 (more ghosts answering the call)
- **Broken promises or violated mandates:** +0.20 (divine debt accelerates the reckoning)
- **Stage escalation event:** Auto-accelerate by +0.12 when entering next stage

---

## Twilight Phase Effects

The Twilight Phase for The Reckoning lasts 6-9 ticks. It is introspective and haunting.

| Tick | Effect | Visual | Mechanical Impact |
|------|--------|--------|-------------------|
| 1 (Stage 5: Entry) | **Echoes Begin to Walk** — The first ghosts manifest. Spectral versions of dead agents and inhabitants appear, walking the same paths they walked in life. They don't interact with the living, but they are *present*. | Time magic (#ff9933) begins to show concentric ripples. Spirit threads (#aa44dd) rise as wisps from the ground. Faint transparent versions of past-cycle people appear, walking through solid objects, ignoring the present world. Sky gains a second moon or sun (a ghost celestial body from a previous age). | All agents gain "Haunted" state (−1 Morale, +1 Mind vulnerability). They can see ghosts but cannot yet speak to them. Narratively, unease spreads. No mechanical penalty yet, but dread is setting in. Essence pools begin to feel "distant" (essence feels like it's being drawn away). |
| 2 | **Temporal Layering** — The present and past begin to occupy the same space. Multiple versions of the same location are visible simultaneously. A ruined building and its full-integrity version exist at the same location. Agents report seeing two different skies. | Hex layering becomes visible—multiple versions of each hex visible at different transparencies. Time ripples intensify. All Spirit threads become visible, creating a ghost-gallery of ascending forms. Darkness threads fill the gaps, making the layering visible as shadow-gaps between times. Agents see their younger/older selves sometimes, or alternate versions of themselves. | "Temporal Fragmentation" begins — agents must make d100 vs. 50 + (current Reckoning stage × 10) checks each turn or become momentarily confused (skip next action). Locations have "Echo States"—some hexes show their past-state version (ruins, intact; destroyed, full) and agents can interact with both (move through present obstacles, fight past-enemies). |
| 3 | **Voices of the Dead** — The ghosts now *speak*. They remember. They cry out about how they died, what they left undone, what debts remain unpaid. The living hear accusations, pleas, warnings. For agents who caused deaths, it is unbearable. | All ghosts become translucent but more defined. They open their mouths—no sound issues, but the living *hear* their words through Time magic resonance (orange ripples carrying voice-echoes). Spirit threads glow brighter with each ghost-voice. The emotional weight is visible in the images—dead children, betrayed lovers, murdered soldiers, all present and accusatory. | "Reckoning Debts" trigger—each agent that has killed, broken a promise, or violated a mandate experiences "Judgment" (d100 vs. 50 + total Reckoning debts). Failure = take 1 Spirit damage per debt + gain "Guilt" status (−2 to all rolls until absolved). Agents can choose to "Confess" to ghosts (spiritual resolution, no mechanical effect but roleplay-significant). |
| 4 | **Temporal Communion** — Agents now recognize themselves in the ghosts—past versions, future versions, alternate possibilities. Some embrace their echoes. Some reject them. Some go mad seeing what they might have been. | Ghosts and living appear interchangeable now—both semi-transparent. Agents see their own echoes (past-self and future-self) walking beside them. Time ripples show all moments at once: birth, death, peak power, lowest point, all visible in rings. Spirit threads form spirals connecting each agent to their own echoes. Darkness threads show the "gaps" between versions—the choices not made, the paths not taken. | "Identity Questioning" — agents make Mind resilience checks (d100 vs. 40 + doom %) or gain "Echo-Struck" (confused about which version of themselves is "real," −3 to decision-making, may act randomly or be controlled by echo-version for one action). Agents can choose to "Merge" with their echo (gain insight/memory from past/future self, but lose 2 individual agency). Some agents may experience "Déjà Vu Spirals" (repeating the same action loop, unable to choose differently). |
| 5 | **The Reckoning Reaches Apex** — All dead from all cycles manifest at once. The world is *more dead than alive*. Ghosts outnumber the living by orders of magnitude. The weight of all history presses down. | A veritable army of ghosts now visible—transparent figures filling every hex, every space. Time ripples are so dense they look like static. Spirit threads create a pillar connecting earth to sky, carrying the ascended dead upward. The sky is crowded with ghost celestial bodies, ghost constellations, ghost dimensions overlaid. Darkness threads are everywhere, defining space between moments. Agents appear small and alone among the multitude of the dead. | "Overwhelming Witness" — all agents take 2 Spirit damage just from the weight of the presence. They cannot hide or escape. Every action is performed in front of the ghosts, judged. Agents gain "Seen" status (+5 to all detection checks, cannot go unnoticed). Essence in the world begins to *flow backward* (all essence returns toward World-Soul, agents lose 10% of their essence pools per tick). |
| 6 | **Absolution or Acceptance** — The ghosts stop accusing. Instead, they accept. They forgive (or fail to—it depends on the agents' choices). Those who faced their debts find peace with their echoes. Those who denied them experience "Haunting" (permanent psychological scars). | Ghosts either fade peacefully (if absolved) or become agitated (if denied). Those fading appear to ascend further, their spirit threads unraveling into pure light and dissolving. Those denied become more solid, more angry, their forms darkening. Agents who sought absolution stand peacefully amid the multitude. Agents who denied their guilt are surrounded by accusatory specters, their personal shadow-space growing darker. | Agents gain "Haunted Legacy" (−1 permanent Authority, representing the judgment of the dead upon them) or "Absolved Heritage" (−1 permanent doom acceleration, the dead no longer press them toward the end; they accept their death with grace). Final Essence pools are harvested directly—all essence returns to World-Soul. The Reckoning is moving toward completion. |
| 7-9 | **Ascension of the Departed** — The ghosts rise. All accumulated memories, experiences, histories flow upward into the World-Soul. The living watch as the dead complete their cycle and return to the Source. A moment of terrible beauty. | Spirit threads create a majestic ascending column. All ghosts are peaceful now, moving upward, becoming luminous. Time ripples slow and transform into gentle waves. The sky clears of ghost-celestials as they return to wherever they came from. Darkness threads dissolve, leaving the present world slightly brighter (less shadow, more clarity). The dead are truly gone now—not erased but *completed*. Agents who were present experience this as profound peace or profound loss, depending on their actions. | Agents still living experience "Quiet" (all morale penalties and debts are "forgiven" by the cosmos, no mechanical effect but deep roleplay significance). Essence is fully harvested. Agents can perform a final act in the quiet aftermath. The Unmaking begins as the World-Soul takes the harvested essence and completed cycles upward, preparing rebirth. |

---

## Terrain Transformation

| Doom % | Terrain Effect | Progression |
|--------|----------------|-------------|
| 0-20% | Subtle overlays — faint ghost-versions of terrain visible beneath present version | Awareness phase — perceptive agents notice the world is showing its age, its history. Old scars visible under new growth. |
| 20-40% | "Haunted Reaches" — ghost-versions become clearer. Past terrain (ruins, dead forests, swamps from prior ages) visible as transparent overlays. | Major landmarks show their past states. Cities show both current and ruined versions. |
| 40-60% | "Echo Layers" — past and present terrain are equally visible, equally solid. Agents can walk through past-versions of structures that don't exist anymore. | Hexes become "temporally fractured"—multiple versions exist with equal reality-weight. Navigation becomes confusing (distances meaningless). |
| 60-80% | "Palimpsest Lands" — terrain cycles through multiple versions as you watch. A hex might be forest, then ruin, then swamp, then forest again in rapid succession. | Movement and combat are affected (terrain changes as agents act). Temporal instability makes planning difficult. |
| 80-100% | "The Witnessed World" — terrain is locked in a state of maximum temporal density—all versions exist simultaneously, completely overlaid. Past and present are indistinguishable. | The world is now a ghost of itself, showing all its ages at once. Terrain hexes are practically unreliable; description is the only way to understand them. |

---

## Agent Impact

| Doom % Range | Agent Effect | Description |
|--------------|--------------|-------------|
| 0-25% | "Nostalgic Melancholy" | Agents feel wistful, remember past loves and losses. −1 Morale. Some experience vivid memories of events that didn't happen to them (echoes from past cycles leaking through). |
| 25-50% | "Haunted" | Agents see ghosts. They're uncertain if ghosts are real. −2 Morale, +1 Mind vulnerability (ghosts are psychically loud). Agents may hear their own names called by the dead. Some choose to follow the voices. |
| 50-75% | "Echo-Struck" | Agents begin to confuse themselves with their echoes. They question which memories are real. They see themselves among the dead. −3 Personality (losing sense of continuous identity), +1 Spirit damage per turn from the weight of all selves. Some agents may act as if they are already dead, moving slowly, speaking in past tense. |
| 75-90% | "Reckoning Judgment" | Agents are confronted by the full weight of their choices. Every death they caused, every promise broken, every life affected—all present and accusatory. Most gain "Haunted Legacy" (permanent −1 Authority). Those who face their debts compassionately may gain "Absolved Heritage" instead. Either way, they are forever changed. |
| 90-100% | "Completion" | Agents who remain are the last living witnesses. They alone hear the final words of the dead. They alone carry the completed memories into the next cycle (as echoes). They are no longer entirely alive—they are "Half-Returned" (can become echoes in future cycles, cannot fully die or be forgotten). The game ends as they stand in the quiet after the ascension, at peace or at loss. |

---

## Harvest Modifier

**The Reckoning is highly emotionally resonant for World-Soul preservation.**

- **Base Harvest Rate:** 65% (normally ~60%; the act of remembering preserves essence)
- **Modification:** Agents who achieved "Absolved Heritage" add +3% per absolution (forgiveness is preservative)
- **Agents who completed their echoes with grace:** +2% (peaceful completion allows essence to flow cleanly)
- **Agents who denied their debts:** −5% each (denial damages the harvest, essence corrupts and is lost)
- **Memories harvested:** All memories of all dead are preserved as "Echoes" in the Resonance (next cycle has access to rich echo-library of past knowledge)
- **Next Cycle Consequence:** The resulting new cycle is born with "Ancestral Wisdom" (Fundament includes +2% memory retention; Spirit sphere manifests more easily. Echoes from the prior cycle are more detailed and more present.)

**Strategic implication:** The Reckoning rewards players who engage deeply with choice, consequence, and redemption. Brutal, unrepentant players lose essence; compassionate, reflective players preserve more. The mechanic is morally weighted.

---

## Narrative Vocabulary Tags

```
atmosphere:
  - "the weight of all choices made"
  - "memory made tangible"
  - "time folding back on itself"
  - "the past demanding to be acknowledged"
  - "beautiful melancholy"
  - "haunting as mercy, not curse"
  - "echoes of what-was asking forgiveness"
  - "the unbearable specificity of loss"

sounds:
  - "whispers of the dead (sad, not threatening)"
  - "overlapping voices (same words spoken in different eras)"
  - "echoes of past events (footsteps, battles, laughter)"
  - "low mournful horns (funeral processions from distant times)"
  - "the ringing of bells (tolling for the departed)"
  - "wind carrying words (snatches of unfinished conversations)"
  - "silence heavy with presence (dead air, charged atmosphere)"

textures:
  - "ghostly translucence (seeing through but not opaque)"
  - "cold to touch (the dead carry no warmth)"
  - "layered like old paint (multiple versions visible)"
  - "weight (not physical but psychological, pressing)"
  - "threads that pull backward (Time magic, drawing past forward)"

colors:
  - "Time orange (#ff9933) ripples and overlaps"
  - "Spirit violet (#aa44dd) ascending wisps"
  - "Darkness indigo (#4a3a8a) pooling in gaps between times"
  - "Desaturated versions of normal colors (echoes are less vivid)"
  - "Grey-blue twilight light (remembrance light)"
  - "Gold light at edges (transcendence, ascending spirits)"

imagery:
  - "the living walking among the dead"
  - "seeing yourself in the faces of ghosts"
  - "a city where both full and ruined versions exist at once"
  - "multiple sunsets from multiple eras happening simultaneously"
  - "the dead reaching out but not touching"
  - "ascending spirits becoming light and dissolving"
  - "monuments from dead worlds still standing, translucent"
  - "a person divided into past-self and future-self, standing apart"
  - "rivers of ghosts flowing upward"
  - "memories becoming visible, painful, undeniable"
  - "forgiveness as a kind of light breaking through shadow"
```
