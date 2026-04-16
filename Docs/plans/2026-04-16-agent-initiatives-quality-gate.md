# Agent Initiatives — Quality Gate Addendum

> **Date:** 2026-04-16
> **Issue:** THR-51 (TB-097 · Social Expansion B: Agent Initiatives)
> **Status:** In Design (moved back from Ready for Dev — fails quality gate)
> **Parent design:** `Docs/plans/2026-03-31-social-systems-expansion-design.md` § Expansion B
> **Reference:** `Docs/plans/2026-04-16-design-quality-gate.md`, `Docs/plans/2026-04-16-game-design-direction.md`

---

## Why This Addendum Exists

The parent design doc (social-systems-expansion-design.md) describes Agent Initiatives as a mechanical system: tick phase, gating prerequisites, initiative types, world effects. It answers *what happens in the engine* but not *what the player experiences*. The design was moved to Ready for Dev based on structural completeness, but it fails the quality gate — there are no player scenarios, no emotional architecture, no dilemma inventory, and no content benchmarks.

This addendum fills those gaps for the **trimmed v1 scope: 6 initiative types** (the high-narrative-yield subset).

### v1 Initiative Types (6)

| Initiative | Reach | Why v1 |
|-----------|-------|--------|
| **Found Organization** | Heart + secondary | Agent creates a new faction — the highest expression of ambition |
| **Recruit Party** | Heart | Agents form traveling groups — social bonds made visible |
| **Commission Quest** | Gold/Star | Agents create work for others — the world generates its own content |
| **Organize Festival** | Heart + Gold | Temporary community events — the mundane heartbeat of settlements |
| **Establish Spy Network** | Shadow | Hidden infrastructure — paranoia and information asymmetry |
| **Consecrate Holy Site** | Star | Sphere influence made physical — the world's spiritual geography shifts |

---

## Section 1: Player Experience Scenario

### The Golden Scenario

Kael Thornweaver — the player's First, a Mind/Spirit Witness — has been growing through social encounters for twelve turns. He's reached Heart tier 5 through repeated negotiations and one failed recruitment that left him "humbled but wiser." His ambition is "seek influence beyond the Circle." The player has been watching him outgrow the Arcane Circle faction, chafing against their insularity.

Turn 13. The chronicle shows a new kind of entry — not an encounter, but an announcement:

> *Kael Thornweaver has begun gathering those who share his restlessness. In the back room of the Weathered Oak, he speaks quietly to three others who've glimpsed the spaces between accepted knowledge. He calls them the Seekers of Lost Echoes — though for now, they are just four people who believe the Circle has stopped asking the right questions.*

The player thinks: "He's doing this *himself*? I didn't tell him to." They check Kael's detail panel and see a new section — **Active Initiative: Found Organization (4/10 ticks)**. The prose tells them more than the progress bar: this is fragile, ambitious, and could draw enemies.

Over the next ticks, the initiative generates encounters — Kael needs to recruit a fifth member (minimum threshold). He approaches Maren, a former Circle scholar who left under a cloud. The player gets a curated encounter:

> *Maren studies Kael across the table. "The last person who asked me to join something told me I'd change the world. I changed nothing, and lost my library privileges." She folds her arms. "Tell me why the Seekers will be different, and tell me the truth."*

Kael is weighing his options — the player can see it in the encounter prose. He could inspire her with the vision (Heart), show her the evidence he's gathered (Eye), or simply be honest that he doesn't know yet (Mind). His personality leans toward Heart — he's an inspirer, not a scholar.

The player's divine choices appear: **"Whisper conviction"** (essence cost: 2 — strengthen Kael's natural Heart approach), **"Send a fragment of what you've seen"** (essence cost: 3 — give Kael knowledge he shouldn't have, tilting him toward Eye), or **"Let him find his own words"** (free — Kael decides based on his personality and the moment). The player isn't choosing Kael's words. They're choosing whether to intervene, and how much divine weight to put on the scales.

The player's internal response: "This is *his* story. I'm watching a character become someone. I could help — but should I? If I whisper conviction now, does he learn to rely on me instead of himself?"

### The Mundane Scenario

An NPC agent in the player's second settlement — a Gold-reach merchant named Pyra — organizes a festival. The chronicle mentions it in a single line among other tick events:

> *Pyra Ironhand has organized a harvest gathering at Millhaven. The smell of roasted grain and spiced cider draws folk from the surrounding farms.*

The player doesn't interact with it. But next turn, they notice: Millhaven's hex has a brief activity pulse. Two agents who were at the festival now have a `met_at` relationship. A lonely NPC agent who attended has their "isolated" condition replaced with "settling in." The prosperity ticker at Millhaven nudges up by 1.

The festival isn't a story beat — it's atmospheric. But it's doing real work: creating relationships, shifting conditions, making the settlement feel lived-in. When the player eventually needs something to happen at Millhaven, there's social fabric to work with.

### The Failure Scenario

Kael's Seekers founding hits a crisis at tick 7 of 10. He's recruited three members but needs five. One prospect turned him down. Another was pressured by the Arcane Circle to stay away. The initiative's progress stalls.

Then it fails — not enough members by the deadline. But the failure isn't "initiative failed, resources consumed." The chronicle reads:

> *The Seekers of Lost Echoes never quite cohered. Kael watches Davin, the last holdout, shake his head and walk back toward the Circle's tower. But the conversations happened. The questions were asked. And the Arcane Circle now knows that Kael Thornweaver tried to found a rival. Scholar-Warden Voss has taken a personal interest.*

The player gets: a new `hostile_to` edge between Kael and Scholar-Warden Voss. Kael gains the condition "marked" — someone powerful is watching. The two members who *did* join still have `respects` edges to Kael. The foundation for a second attempt exists, but now it's harder and more dangerous.

Cool failure: the attempt created narrative texture that makes the *next* chapter more compelling. The player thinks "oh no — oh, that's interesting. Kael has an enemy now. And he has two allies who believed in him."

---

## Section 2: Emotional Architecture

### Emotional Read

The player understands initiative state through two channels:

**Iconic (glanceable):** Agent detail panel shows "Active Initiative" with a type icon, progress bar (ticks), and a one-word status: *preparing / building / struggling / completing / stalled*. The status word drives the emotional read — "struggling" tells you more than "6/10 ticks."

**Prose (textured):** Each initiative stage generates a chronicle line in Threadbare voice. Not "Kael's organization is at 70%" but "The Seekers now number four. Kael reads their faces at each meeting, counting silences."

### Resonant Conditions

Initiatives create or modify these human conditions on the initiating agent:

| Phase | Condition | Communication |
|-------|-----------|---------------|
| Starting | "ambitious" | "There's a light in Kael's eyes that wasn't there before" |
| Mid-progress | "building something" | "Kael speaks with the careful authority of someone who has people counting on him" |
| Struggling | "exposed" | "The whole settlement knows what Kael tried to do. Every face is a judgment" |
| Failed | "marked" / "humbled" | "Kael sits alone at the Weathered Oak, nursing a drink he can't taste" |
| Succeeded | "established" / "vindicated" | "When Kael enters a room now, people make space" |

### Stakes Framing

When an initiative reaches a crisis point and generates a curated encounter, stakes are framed in human terms:

Not: "Initiative success probability: 45%. Resource cost on failure: 20 wealth."

But: "If Maren says no, Kael will have to face the Circle alone — and they already know he tried. Everyone who's watching will see him fail. The Seekers will be a joke told in the Academy's halls, and Kael will be the punchline."

---

## Section 3: Choice and Dilemma Quality

### Dilemma Inventory

| Choice Point | Options | Tradeoffs | Why No Right Answer |
|-------------|---------|-----------|-------------------|
| **Inspire Initiative** (divine action) | Nudge agent toward initiative type A vs B vs let them choose | Risky initiative = higher narrative yield but might fail; safe initiative = reliable but less compelling. Letting them choose = authentic but might not serve your goals | You're a god who *follows* stories, not writes them — but you can whisper |
| **Mid-initiative crisis** | Intervene (spend essence to help) vs observe (let agent handle it) vs redirect (push them toward compromise) | Intervention solves the crisis but costs essence and makes the agent more dependent on you. Observing risks failure but builds agent autonomy. Redirecting changes the outcome's character | Agency vs living world — how much is *your* story vs *theirs*? |
| **Conflicting initiatives** | Two bonded agents pursue initiatives that create tension (Kael's faction vs Serafina's faction loyalty) | Supporting one strains your relationship with the other. You can't serve both interests | This is the Malazan portfolio problem — your protagonists have different stories |
| **Initiative timing** | Agent wants to start initiative during a doom pressure spike | Ambitious but dangerous — the initiative might succeed while the world burns. Or it might be exactly what's needed to push back | Short-term vs long-term, safety vs ambition |

### Knowledge-Dependent Choices

Every mid-initiative intervention requires protagonist understanding:

- Deciding *whether* to intervene in a recruitment crisis depends on knowing Kael's personality. A Heart-dominant agent might talk Maren around on his own — spending essence to help would work, but is it necessary? If the player has been reading Kael's character sheet and watching his social encounters, they know his Heart is strong enough. But if the target has high skepticism (visible through familiarity), maybe Kael needs the push.
- Deciding whether to intervene in a stalled initiative depends on knowing whether the agent is resilient enough to recover alone or whether this failure will break them. A "quietly determined" agent can handle a setback; an "exposed" one might spiral.

### Intervention Spectrum

| Engagement Level | What Happens |
|-----------------|-------------|
| **Auto-resolve (do nothing)** | Agents pursue initiatives based on Maslow hierarchy + ambition. Outcomes follow resolution system. Still produces chronicle entries and world changes. Some initiatives fail; some succeed. The world makes itself. |
| **Minimal intervention** | Player uses "Inspire Initiative" once to nudge agent toward a specific type. Watches the results. Spends essence only at critical crisis moments. |
| **Deep intervention** | Player inspires initiative, then actively manages the crisis encounters — choosing approaches, spending essence at key moments, potentially redirecting the initiative when obstacles arise. |

**Doing nothing is still interesting:** An NPC agent founding an organization or establishing a spy network without player involvement is part of the living world. The player discovers it happened and reacts — that's the portfolio scan beat.

### Agency vs Living World

The world pushes back through:
- **Rival faction interference** (the Circle opposing Kael's Seekers)
- **Resource scarcity** (can't organize a festival if the settlement is impoverished)
- **Other agents' initiatives** (two agents competing to recruit the same person)
- **Doom pressure** (omen context making certain initiatives harder)
- **Unpredictable recruitment** — you can inspire the initiative, but you can't choose who agrees to join

---

## Section 4: System Connections and Emergence

### Connection Map

| System | Direction | Interaction |
|--------|-----------|-------------|
| Maslow pipeline | Reads | Self-actualization need triggers initiative evaluation |
| Domain Capability | Reads | Tier gates determine available initiative types |
| Encounter system | Reads + Writes | Generates recruitment/crisis/completion encounters; completed initiatives spawn new encounter types at locations |
| Faction system | Reads + Writes | Found Organization creates factions; faction standing gates Commission Quest; existing factions react to competing initiatives |
| Location/Sublocation | Writes | Creates sublocations (spy network, holy site); modifies location prosperity |
| Hex map | Writes | Activity pulse from festivals; new sublocation signifiers |
| Prose pipeline | Writes | Initiative stages generate chronicle text via enrichment |
| Attention tiers | Writes | Initiative encounters scored as tier-2 (bonded agent) or tier-3 (ambient) |
| Cool failure (THR-20) | Writes | Failed initiatives generate complications per the complication taxonomy |
| Omen system (THR-19) | Reads | Doom context biases initiative difficulty and sphere coloring |
| Action system | Reads | "Inspire Initiative" divine action targets bonded agents |

### Emergent Possibilities

1. **Faction schism through initiative:** Agent A founds a new organization that attracts members from Agent B's faction. Agent B's faction declares rivalry. The player's two bonded agents are now on opposite sides of a conflict *they didn't plan* — the world created a dilemma from two agents' ambitions colliding.

2. **Initiative chain reactions:** Agent consecrates a holy site at a hex. The sphere influence shift makes that hex more attractive for Star-aligned agents. An NPC Star agent moves there and founds a pilgrimage route. A Gold agent sees the foot traffic and organizes a market festival. The settlement grows — all from one initiative cascading.

3. **Spy network as information asymmetry:** An NPC Shadow agent establishes a spy network at the player's primary settlement. The player doesn't know about it (it's invisible). But they notice that an NPC keeps showing up at encounters with suspicious foreknowledge. Investigation reveals the network — and now the player has a choice about whether to expose it or leverage it.

### Missed Connections (Deferred)

- **Economy system:** Build Structure, Trade Post, and economic initiatives deferred until Dynamic Economy milestone gives them mechanical teeth.
- **Siege system:** Fortification initiatives deferred — would interact with settlement defense.
- **Mentor/Apprentice:** Train Apprentice deferred to its own issue (THR-75) for relationship chain design.

### Turn-Pace Compatibility

**Quick turn:** Chronicle shows "Kael continues work on the Seekers (7/10)" — glanceable progress. Festival at Millhaven appears as a one-line ambient note.

**Deep turn:** Player stops at an initiative crisis encounter — full multi-step social scene with choices. Or they inspect the newly consecrated holy site and see its sphere influence spreading.

---

## Section 5: Design Alternatives

### Alternative A: Player-Directed Initiatives

The player explicitly commands agents to pursue initiatives (like a Civilization build queue). Full control over what gets built where.

**Gains:** Player agency. Clear strategic planning.
**Loses:** Living world feeling. Agents become units, not characters. Violates "agency vs living world" principle.
**Why rejected:** The core fantasy is watching characters become who they are, not directing units. Player *influence* (Inspire Initiative) preserves the portfolio-of-protagonists feel.

### Alternative B: Initiative as Encounter Outcome Only

Initiatives don't exist as a separate phase — they emerge as encounter outcomes. A "founding an organization" encounter, if successful, creates the faction immediately in one step.

**Gains:** Simpler. No new tick phase. Fits existing encounter pipeline.
**Loses:** The *process* of building something over time. A faction founding in one encounter step lacks weight. The multi-tick nature of initiatives creates the anticipation/anxiety arc.
**Why rejected:** The multi-tick duration is what makes initiatives feel like ambition rather than luck. A festival that takes 3 ticks to organize means the player watches the settlement prepare. A one-step festival is just another encounter resolution.

### Inspiration

- **Dwarf Fortress:** Dwarves undertake projects based on personality, skill, and need. The player watches and manages rather than directs.
- **Crusader Kings:** Characters pursue ambitions that create faction drama. The player can influence but not control.
- **Malazan:** Characters' personal projects (founding armies, building alliances, consecrating warrens) create the story arcs that matter most.

---

## Section 6: UI and Presentation Vision

### First Impression

The player discovers initiatives through the chronicle — they see an agent doing something *new*. Not a tutorial popup, not a UI element. The first initiative in any playthrough is the First agent attempting something that serves their ambition. It appears as a prose chronicle entry, and the agent's detail panel gains a new "Active Initiative" section.

### Visual Hierarchy

1. **Chronicle entry** (primary): The initiative announcement is a narrative event, not a system notification
2. **Agent detail panel** (secondary): "Active Initiative" section with type, progress, status word, and current crisis if any
3. **Hex activity** (ambient): Festival and consecration initiatives create visible hex effects (pulse/glow)
4. **Action drawer** (interactive): "Inspire Initiative" appears as a divine action card when targeting a bonded agent with self-actualization need

### Component Vision

- **Initiative status** in agent detail panel: Uses existing `StatusLine` primitive with initiative-specific status words. Progress shown as a narrative tick count ("fourth of ten days") not a progress bar.
- **Initiative encounters**: Use existing encounter modal — no new components needed. Crisis encounters are curated social scenes.
- **Chronicle entries**: New chronicle entry type `initiative_stage` with tier-2 attention level for bonded agents.

### Prose Integration

Initiative stages feed the prose pipeline through enrichment:
- `{initiative_type}` → "founding of the Seekers"
- `{initiative_status}` → "struggling to find a fifth member"
- `{initiative_stakes}` → "the Arcane Circle has noticed"

The prose carries narrative; the UI carries status. The player reads the chronicle to understand *what's happening*. They check the panel to see *how far along*.

---

## Section 7: Depth Progression

### Newcomer

A new player sees their First agent announce an initiative. They read the chronicle entry. They don't need to understand the initiative system — they just see a character pursuing a dream. If a crisis encounter fires, they respond to it like any other encounter. The system is invisible; the story is visible.

### Expert

An experienced player learns that "Inspire Initiative" divine action lets them nudge agents toward specific initiative types. They start thinking strategically: "If I inspire Kael toward Found Organization now, while the Arcane Circle is distracted by the doom pressure, he'll face less resistance." They time initiatives to align with world state.

### Mastery

A master player orchestrates initiative chains: inspire an agent to consecrate a holy site, which shifts sphere influence, which attracts a Star-aligned NPC, who then founds a pilgrimage route, which creates foot traffic, which another bonded agent exploits with a festival, which builds the prosperity needed for a larger initiative. The system becomes a lever for macro-level world-shaping — but only through patience and reading the world state.

---

## Section 8: Value Justification

### Core Loop Service

**Primary:** Beat 1 (Portfolio Scan) and Beat 3 (Aftermath). Initiatives make agents feel autonomous — the player scans their portfolio and discovers characters pursuing goals, not waiting for encounters. The aftermath of initiative success/failure reshapes agent trajectory.

**Secondary:** Beat 2 (Curated Moment). Initiative crisis encounters are curated moments — the system identifies emotional significance (your bonded agent's dream is at risk) and pulls the player in.

### Standalone Value

Yes. A player watching an agent found an organization, struggle, and either succeed or fail meaningfully would notice and care. It's the most direct expression of the "agents make things happen" promise. Without initiatives, agents are reactive — things happen *to* them. With initiatives, agents have agency.

### Opportunity Cost

Building initiatives means not building economy feedback loops (M3), not doing hex vignette phase 2, not doing attention tier UI. The tradeoff is worthwhile because: initiatives make the social world feel alive, which is the current weakest pillar. The economy and visual systems are important but the world needs to feel inhabited first.

---

## Section 9: Content Benchmark Moments

### Benchmark 1: The Announcement (Found Organization — Golden)

**Setup:** Kael Thornweaver, Heart tier 5, Mind tier 6. Ambition: "seek influence beyond the Circle." Has been a member of the Arcane Circle for 8 ticks but his axiological profile favors openness over tradition. Two recent encounters: a tavern debate where he argued for sharing restricted knowledge, and a failed recruitment where he was told "you think too big."

**Trigger:** `phaseAgentInitiative` evaluates Kael. Found Organization scores highest (Heart 5 ≥ tier 5 threshold, ambition alignment 0.9, at settlement with tavern). Initiative begins.

**The moment:**

> *It begins with four chairs around a table in the back of the Weathered Oak.*
>
> *Kael Thornweaver speaks quietly, leaning forward, hands wrapped around a cup he hasn't touched. Across from him sit Lira — who was expelled from the Circle for asking about the Breach — and Thom, the stonecutter's son who can feel ley-lines shift. The fourth chair holds Venna, who has never been part of anything and isn't sure she should start now.*
>
> *"I'm not asking you to fight the Circle," Kael says. "I'm asking you to remember what they've forgotten — that knowing is supposed to change things. Not sit in a tower."*
>
> *Lira nods slowly. Thom looks at his hands. Venna stares at the door.*
>
> *They don't have a name yet. They don't have a charter or a hall or the approval of anyone with authority. What they have is a table, four cups, and the dangerous idea that knowledge is for everyone.*

**Player's internal response:** "He's really doing this. He's going to make enemies. I want to see where this goes." The player feels *invested* in an outcome they didn't choose — this is Kael's ambition, not the player's command.

**Forward hook:** Initiative is now active (4 ticks into 10). Kael needs to recruit a 5th member (minimum faction threshold). The Arcane Circle hasn't noticed yet — but they will. The player now has a reason to monitor Kael's location, consider spending essence, and worry about timing.

**Emotional condition:** Kael gains "quietly determined" — a condition the player reads as forward momentum with vulnerability.

### Benchmark 2: The Mundane Heartbeat (Organize Festival — Common Case)

**Setup:** Pyra Ironhand, an NPC merchant (Gold tier 4, Heart tier 3) at Millhaven. Not a bonded agent. The player has visited Millhaven once but has no active stories there. Prosperity is middling.

**Trigger:** Pyra's Maslow evaluation shows belonging/esteem needs unmet despite wealth. Organize Festival scores highest (Heart 3 ≥ tier 3, Gold for resources, at settlement). Initiative begins and completes in 3 ticks.

**The moment (chronicle entry, tier 3 — ambient):**

> *Millhaven's harvest gathering draws forty souls from the surrounding farms. Pyra Ironhand, who organized the whole affair, stands by the cider barrels looking faintly surprised that anyone came. Children chase each other between the stalls. Old Garren plays the squeeze-box badly and no one minds.*

**Player's internal response:** The player scans past this during a quick turn — but it registers. Millhaven is alive. People do things there. When the player eventually needs to send a bonded agent to Millhaven, they'll remember it as a place with a community, not an empty node on the graph.

**Forward hook:** Subtle — two agents who attended now have a `met_at` edge. Millhaven prosperity +1. An isolated NPC's "lonely" condition shifts to "settling in." None of these are dramatic, but they're the soil that future stories grow in.

**Emotional condition:** Pyra gains "satisfied" — quietly proud of something small. Background texture, not a story beat.

### Benchmark 3: The Crisis (Recruit Party — Cool Failure)

**Setup:** Serafina (player's second bonded agent, Iron/Force Scar archetype) is at a tavern with three other agents. She's been pursuing the ambition "prove strength through leadership." Her initiative: Recruit Party — she wants to form a group to investigate rumors of something dangerous in the northern reaches.

**Trigger:** Initiative is at tick 2 of 3. One agent agreed to join (Dorek, an Iron-reach fighter). But the second recruit — Mila, a cautious Eye-reach scout — is wavering. Crisis encounter fires.

**The moment (curated encounter, tier 2):**

> *Mila spreads the patrol map across the tavern table, pointing to the marks she's made in charcoal. "Here. Here. And here." Her finger traces the northern ridgeline. "Whatever's up there has been moving south for three weeks. I've tracked it."*
>
> *She looks at Serafina. "I know what you're asking, and I know what Dorek thinks — that three swords are better than two. But I've seen what happens to parties that go north without knowing what they're walking into." She folds the map. "You want me to scout blind? Or do you want me to scout smart?"*
>
> *Serafina's jaw tightens. The player can feel it through the thread — she wants to demand commitment. That's who she is. Iron doesn't wait.*

The player's divine choices: **"Steady her patience"** (essence cost: 2 — nudge Serafina toward letting Mila scout, against her Iron nature), **"Send a vision of the northern threat"** (essence cost: 3 — give Serafina knowledge she shouldn't have, which she'll share with Mila as if she dreamed it), or **"Let her be who she is"** (free — Serafina demands commitment, because that's what Iron does). The god doesn't choose Serafina's words. The god chooses whether to temper her nature, arm her with forbidden knowledge, or trust that her iron will either hold or break.

**If Mila refuses (failure path):**

> *Mila tucks the map into her belt. "I'm not dying because someone needed to prove a point." She nods to Serafina — not unkindly — and walks out.*
>
> *Dorek watches her go, then looks at Serafina. "Just us, then?"*
>
> *Just us, then. Two swords and a bad idea. Serafina stares at the door Mila walked through and wonders if iron alone has ever been enough.*

**Player's internal response:** "Serafina's too proud to recruit well. But Dorek stayed — he believed in her even when it fell apart. And Mila's scout intelligence about the northern threat is now just... out there. Someone else might use it."

**Forward hook:** Party initiative fails (below minimum). But: Dorek gains `trusts` edge to Serafina. Mila's intelligence about the northern threat becomes a `rumor` at the settlement. Serafina gains condition "stung" — failure she'll carry into her next attempt. The northern threat is still there, and now more people know about it.

### Benchmark 4: The Hidden (Establish Spy Network — Severe/Discovery)

**Setup:** Voss, an NPC Shadow-reach agent (Shadow tier 5, not bonded to the player). He's been at the player's primary settlement for 6 ticks, always on the periphery — the player might have noticed him in a few encounter backgrounds but never interacted with him directly.

**Trigger:** Voss's initiative completes. A spy network sublocation is created — but it's invisible. The player doesn't know.

**The moment (delayed discovery — 3-4 ticks later, during a bonded agent's encounter):**

> *Kael is negotiating with the Merchant Consortium for research supplies when the merchant's tone shifts. "We know about the Seekers," the merchant says, with the easy confidence of someone reading from someone else's notes. "We know about the four meetings. We know Venna almost didn't come back after the second one."*
>
> *Kael goes very still. "How do you know that?"*
>
> *The merchant smiles. "Millhaven isn't as quiet as it looks."*

**Player's internal response:** "Wait — someone's been *spying* on Kael? On *my* settlement? Who set this up? How long has this been going on?" The player feels violated on behalf of their protagonist — and suddenly the settlement feels less safe and more interesting.

**Forward hook:** The spy network is now partially revealed — the player knows *something* is gathering information, but not who runs it. Investigation encounters become available. The player can try to find and destroy the network, or try to identify and turn the spymaster.

**Emotional condition:** Kael gains "watched" — the skin-crawling awareness that someone knows more about you than they should.

### Emotional Condition Mapping

| Initiative Phase | Mechanical Effect | Human Condition | Communication |
|-----------------|-------------------|-----------------|---------------|
| Initiative started | initiative_active flag | "quietly determined" | Prose shows forward momentum and vulnerability |
| Progress midpoint | tick counter advances | "building something" | Agent speaks with new authority; people notice |
| Crisis (resource shortage) | initiative_stalled flag | "stretched thin" | Agent is visibly torn between initiative and other needs |
| Crisis (opposition) | encounter generated | "exposed" | The world knows what they're trying, and some don't want it to succeed |
| Failed (insufficient recruits) | initiative_failed, reputation_cost | "marked" / "stung" | The attempt drew attention and enemies without succeeding |
| Failed (opposition won) | initiative_blocked, rival_edge | "outmaneuvered" | Someone else decided the agent's future |
| Succeeded | sublocation/faction created | "established" / "vindicated" | When the agent enters a room, people make space |
| Mundane success (festival) | prosperity_boost, met_at edges | "satisfied" | Quietly proud of something small |

### Content Quality Bar

**"Every initiative must make the player feel that the world contains people with dreams, not just systems with outputs."**

An initiative announcement that reads like a system log ("Agent X has begun initiative: Found Organization") fails the bar. An initiative announcement that reads like a chapter opening ("It begins with four chairs around a table") passes it. The test: would this chronicle entry make the player stop scanning and actually read?

---

## Systemic Grounding: How the Engine Produces These Moments

*Added 2026-04-16. This section validates that the benchmark moments above can actually be produced by the game's systems, not just written as fiction.*

### What Already Exists (High Reuse)

| Infrastructure | Location | How It Serves Initiatives |
|---------------|----------|--------------------------|
| **Multi-tick projects** | `StrategicProjectRuntime` in `src/types/strategicAction.ts` | Progress-per-tick, stalled/completed/failed states. Initiative = specialized strategic project with phases. |
| **Ambition → strategic action** | `strategicActionCandidates.ts` | Ambitions already generate strategic action candidates scored alongside encounters. An "initiative ambition" generates founding/festival/consecration candidates. |
| **Encounter seeding mid-project** | `strategicActionLifecycle.ts` → `seed_encounter` mutation | A founding initiative can seed recruitment encounters into the normal pipeline mid-progress. |
| **Sublocation creation** | `strategicGraphOps.ts` → `createSublocation()` | Runtime sublocation creation with `createdBy`, `createdTick` metadata. Guild halls, spy networks, holy sites are sublocations. |
| **Resolution system** | `sigmoid → d100` pipeline in `src/types/resolution.ts` | Handles recruitment rolls: `domain: Heart, difficulty: target disposition + interference`. Produces outcome spectrum (critical success → critical failure). |
| **Axiological profiles** | Agent personality driving encounter scoring | The same profile that makes Pyra prefer social encounters makes her select festival initiatives over spy networks. |
| **Intervention choices** | `encounterVisibility.ts` → `generateInterventionChoices()` | Already produces divine intervention options (supportive/coercive/withdrawn) with `godVoice` flavor. Initiative encounters use this existing system. |

### What Needs Building (Medium Effort)

| Gap | What's Needed | Size |
|-----|--------------|------|
| **Initiative evaluation trigger** | Check agent's ambition + capability tier → eligible for initiative? Currently no "self-actualization" gate. Add tier check in `ambitionSelection.ts`. | S |
| **Initiative template system** | New `InitiativeTemplate` type (or subtype of `StrategicActionTemplate`) defining: type, reach prerequisites, phases, recruitment threshold, duration range. | M |
| **Initiative phase tracking** | Extend `StrategicProjectRuntime` with phase state: recruitment phase (resolve per tick) → organization phase → completion. | M |
| **Runtime faction creation** | `createFaction()` in `strategicGraphOps.ts` — doesn't exist. **Workaround:** pre-seed dormant faction shells during worldgen, activated by initiative completion. Or use sublocation + `member_of` edges as faction proxy for v1. | M |
| **Interference modifiers** | If agent has `hostile_to` edge with an existing faction, that faction's presence at the location increases recruitment difficulty. Reads graph edges, modifies resolution input. | S |

### How Each Benchmark Moment Maps to Systems

**Benchmark 1 (Kael founding the Seekers):**
- **"Four chairs around a table"** — prose template keyed to initiative type `found_organization`, phase `announcement`, with `{actor}` and `{location_sublocation}` enrichment placeholders. The specific attendees (Lira, Thom, Venna) come from: agents at the same location with compatible axiological profiles and unmet belonging needs.
- **"Recruited 3, needs 5"** — `StrategicProjectRuntime.progress = 3`, `progressRequired = 5`. Each tick during recruitment phase: `resolve(domain: Heart, capability: agent.heartScore, difficulty: targetDisposition + factionInterference)`. Success = progress += 1. Failure = no progress + complication roll.
- **"Arcane Circle pressured them"** — if `hostile_to(ArcaneCircle, Kael)` edge exists, interference modifier `+0.15` on recruitment difficulty for targets who are Circle members or have `respects` edges to Circle agents. This is modeled, not hardcoded.
- **"Scholar-Warden Voss has taken a personal interest"** — on initiative failure, if a hostile faction exists, generate `hostile_to(Voss, Kael)` edge via complication outcome (THR-20 complication category: `witness`).

**Benchmark 2 (Pyra's festival):**
- **Why Pyra organizes a festival** — Pyra's axiological profile (community-oriented) + Heart tier 3 + Gold tier 4 + ambition "gain community standing" → `Organize Festival` initiative scores highest. When the player inspects Pyra's character sheet, they see: ambitions, personality values, capability tiers. The connection is legible.
- **`met_at` edges** — festival completion triggers `GraphOps`: for each agent at location during festival ticks, create `met_at` edges between agents who didn't already have relationship edges. Systemic.
- **Prosperity +1** — festival completion mutation: `location.properties.prosperity += FESTIVAL_PROSPERITY_BOOST`.

**Benchmark 3 (Serafina's failed party):**
- **"Mila is wavering"** — recruitment resolution roll for Mila: `domain: Heart, capability: Serafina.heartScore (low — she's Iron-dominant), difficulty: Mila.skepticism`. Partial success → crisis encounter seeded.
- **"Let her be who she is"** — the withdrawn intervention option. Serafina's Iron-dominant personality resolves the encounter via her natural approach (demand). The outcome depends on the resolution roll, not the player's will.
- **Divine intervention options** — existing `generateInterventionChoices()` with initiative-specific `godVoice` templates: `"Steady her patience"` = supportive (modifies Serafina's approach toward Eye), `"Send a vision"` = coercive (adds divine knowledge modifier to resolution).

**Benchmark 4 (Voss's spy network):**
- **Invisible sublocation** — `createSublocation(type: 'spy_network', visible: false)`. Spy networks are sublocations with a visibility flag; not shown on hex map or location panels.
- **Delayed discovery** — the spy network generates `information_edge` mutations: Voss gains knowledge about agents at the location. When this knowledge is used in another agent's encounter (merchant cites it), the player discovers the network's existence indirectly.
- **"Millhaven isn't as quiet as it looks"** — encounter prose template for `spy_network_reveal` trigger, enriched with `{known_secrets}` from the information edges Voss has accumulated.

### Systemic vs. Authored Content Ratio

| Layer | Systemic | Authored |
|-------|----------|---------|
| **Which agent initiates what** | 100% — ambition + capability + personality scoring | — |
| **Whether initiative succeeds** | 90% — multi-tick resolution rolls | 10% — thresholds tuned by content |
| **Who gets recruited** | 80% — agents at location with compatible profiles | 20% — minimum thresholds set per initiative type |
| **What interference happens** | 70% — hostile edges + faction presence modifiers | 30% — complication templates from THR-20 |
| **What the player reads** | 10% — enrichment placeholders filled from graph | 90% — prose templates are authored content |

The system generates the *what*, *when*, *who*, and *whether*. Authors write the *how it reads*. The prose templates are authored, but they're parameterized by systemic data — not hardcoded stories.
