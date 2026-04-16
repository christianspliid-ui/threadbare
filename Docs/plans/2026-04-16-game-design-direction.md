# Game Design Direction

> **Date:** 2026-04-16
> **Type:** Foundational design document
> **Status:** Active
> **Purpose:** Defines what Threadbearer is supposed to *feel like* to play — the core fantasy, the engagement loop, the emotional architecture. Every feature design must serve the principles in this document.

---

## The Core Fantasy

You are a nascent god who discovers interesting mortals, follows their stories like a living novel, and shapes their arcs through subtle divine intervention. The game is a third-person role-playing engine — you empathize with protagonists as *people*, not game pieces. You don't write their stories; you discover them, invest in them, and nudge them at critical moments.

The target player is a middle-aged fantasy reader who grew up on BECMI D&D and graduated to Malazan. They want wonder layered over complexity, stories that surprise them, and choices that matter because they're about people, not optimization.

---

## The Three-Beat Core Loop

Every play session revolves around three beats, repeated across a portfolio of protagonists:

### Beat 1: "How Are My People Doing?"

The portfolio scan. The player hops between their protagonists and reads their state *at a glance*.

**What the player needs to know instantly:**
- **Emotional trajectory** — are they thriving, steady, struggling, or in crisis? This is how they *feel* they're doing, not an objective assessment. A protagonist might be objectively powerful but feel lost. Another might be poor but burning with purpose.
- **Human condition texture** — not just mood, but *situation*. Alone. Sick. Far from home. Grieving a mentor. Flush with a first victory. These are universally resonant states that activate player empathy without explanation. You don't need to be told why "alone and wounded" is bad — you feel it.
- **Arc direction** — are things getting better or worse for them? Is this a rising arc or a falling one? The player should be able to sense the trajectory, not just the current state.

**Two layers of presentation:**
1. **Iconic/visual layer** — glanceable status through UI signals (color, icons, visual energy). The player scans their protagonist list and immediately knows who needs attention. A shift from "struggling" to "in crisis" is a visual alarm that draws the player in.
2. **Prose layer** — a sentence or two of human-textured narrative that paints the specific situation. Not "Mood: -3" but "Kael hasn't spoken to anyone in four days. He carries the goblin king's scar like a debt." This is where the emotionally resonant condition library lives.

**Design principle:** The at-a-glance read should make the player *want to click*. A status shift from yellow to red, combined with a prose line that evokes a human condition, creates the pull: "I need to see what happened."

### Beat 2: "The Curated Moment"

The game watches the simulation and identifies emotionally significant encounters — the peaks and troughs of a protagonist's life. When one fires, it pulls the player in.

**How the game curates:**
- The simulation runs continuously. Agents make decisions, encounter challenges, change conditions. Most of this is background — the equivalent of "went to the blacksmith, traveled to the next town." The game tracks it but doesn't demand attention.
- When something emotionally significant happens — a real threat, a breakthrough opportunity, a betrayal, a moment of crisis or triumph — the game raises a signal. "Something is happening to someone you care about."
- The player can always choose to dive into any protagonist at any time. But the *designed* experience is: notification → zoom in → experience the moment.

**What happens inside the moment:**
- **Time functionally slows.** The encounter is not a single resolution roll. It's an unfolding micro-narrative with multiple beats.
- **The situation is set up with emotional context.** Before any choices appear, the player understands the stakes in human terms. "Kael is exhausted, alone, and facing the goblin boss who took his sword. If he fails here, he loses more than a fight — he loses the belief that he can be more than a beggar."
- **The player makes choices under uncertainty.** Multiple intervention options, each a genuine dilemma. No obvious right answer. The player needs to *understand the protagonist* — their personality, their state, their capabilities — to make good judgments. "Do I inspire his courage (risky — he might overextend) or steady his nerves (safer — but is it enough)?"
- **The situation shifts.** Choices have visible consequences within the encounter. The tide turns, or doesn't. New complications emerge. The roller coaster has ups and downs.
- **Resolution arrives.** It could go either way, and *both outcomes must be interesting.*

**The emotional curve:** Tension builds → player makes choices → situation shifts → more choices → resolution → aftermath. The player stays engaged throughout because they're making real decisions about someone they care about.

### Beat 3: "The Aftermath"

The resolution reshapes the protagonist's trajectory, and the player sees the change.

**After success:** New confidence, new capabilities, new opportunities. But also new risks — boldness can become recklessness, fame attracts enemies, victory creates expectations. Success should open doors, not just close the current challenge.

**After failure:** This is where Threadbearer diverges from most games. **Failure is not a loss state — it's a story turn.** The protagonist who loses to the goblin boss doesn't get a "game over" screen. He gets captured. Thrown in a dungeon. Comes out 30 ticks later with his pride shattered, his sword gone, and new scars on his soul. And that's *interesting*. The player might be more invested in him now than before, because his story just got more complicated.

**Design principle: "Cool failure."** Every failure state should produce narrative texture that makes the *next* chapter more interesting. New conditions, new traits, new motivations, new constraints. The aftermath of failure is a hook, not a dead end.

**The loop resets:** The player sees their protagonist's new state, reads the aftermath prose, updates their mental model of the arc, and releases back to the world. Beat 1 begins again with changed stakes.

---

## Pacing: Turn-Based, Player-Paced

**Settled decision: The game is turn-based.** Each tick is a turn. The player decides when to advance to the next turn.

Continuous real-time play actively works against the core experience. If the game's value is in *being present for moments* — reading prose, scanning protagonist states, choosing whether to dive into an encounter — then auto-advancing time pulls attention away from what matters. Turn-based says "each tick is yours. Here's what happened. Here's what needs attention. Take your time."

**What a turn looks like to the player:**
1. The tick resolves — agents act, encounters fire, conditions change, the world moves
2. The game presents what happened: notifications for significant events, status updates on protagonists, world state changes
3. The player explores at their own pace — read encounter prose, check protagonist states, scan the map, dive into anything interesting
4. When ready, the player advances to the next turn

**Two rhythms within the turn-based frame:**

**Quick turns:** Nothing major happened. The player scans their protagonist statuses, sees nothing urgent, maybe reads a background event, and advances. This is the "reading between chapters" feel. The player might advance several turns quickly when their protagonists are in stable arcs.

**Deep turns:** A significant encounter fired. The player stops advancing and goes deep — reads the encounter setup, makes choices through branching decisions, witnesses the resolution, reads the aftermath. This might take several minutes for a single turn. This is the "turning point in the novel" feel.

**The key insight:** The dramatic encounters *are* the game. The quick turns between them are what makes them meaningful — context, buildup, the quiet before the storm. But the emotional engagement lives in the encounters where the player stops and goes deep.

**Player freedom:** The player can always explore anything — check on any protagonist, read any location, browse the map, inspect factions. Turn-based doesn't mean the game gates exploration. It means the *world* waits for the player, not the other way around.

---

## Encounter Design Principles

Encounters are the linchpin. They're where the player's emotional investment pays off or deepens. Every encounter design must satisfy these principles:

### 1. Not a Coin Flip (for the Player's Moments)

The binary model (invest essence → succeed/fail) produces two bad states: frustration ("I wasted my investment") or indifference ("I succeeded, next"). Neither keeps the player in the scene. An encounter the player is *present for* must be an experience, not a transaction.

**Important distinction:** Binary resolution is fine as a background mechanic. The world simulation runs thousands of small encounters that resolve through success/failure and change world state — factions gain or lose territory, NPCs gain or lose reputation, trade routes open or close. This is the engine of continuous change and evolution that makes the world feel alive. But these are not where the player spends their time. The *player-facing* encounters — the curated moments where the game says "pay attention" — must be richer than a coin flip.

### 2. Multiple Meaningful Choices

The player should face several decision points within an encounter, each a genuine dilemma. "Do I push him to fight or to flee? Fighting might win but might break him. Fleeing preserves him but costs reputation." The choices should require understanding the protagonist — their personality, capabilities, current state — not just resource math.

### 3. No Obviously Right Answer

If one choice is clearly optimal, it's not a dilemma. The best encounters create situations where every option has real upside and real risk, and the "right" answer depends on what you value: safety vs. glory, short-term survival vs. long-term arc, the protagonist's nature vs. what you want them to become.

### 4. Failure Must Be Cool

Every failure outcome should create narrative texture — new conditions, new traits, new story hooks — that makes the next chapter more interesting. Capture, loss, injury, shame, exile: these aren't punishment, they're *plot*. The player should think "oh no — oh, that's actually interesting" rather than "that sucked, I want to reload."

### 5. Consequences Reshape Trajectory

Both success and failure should visibly change the protagonist's emotional state, capabilities, relationships, and opportunities. The player should see the aftermath and think "they're different now." The arc has turned.

### 6. Emotionally Resonant Stakes

Before choices appear, the player must understand the stakes in *human* terms. Not "DC 15 Strength check" but "he's exhausted and alone, and if he fails here, he'll believe he was never meant to be more than a beggar." The game sets up empathy before it asks for decisions.

### 7. The Roller Coaster

Within a single encounter, the emotional trajectory should shift — hope rises, complications appear, the tide turns, a final moment of uncertainty. The player should feel carried through an arc, not presented with a menu.

---

## The Emotional Read: Synthesis, Not New System

The player needs to read a protagonist's state *as a person*, not as a stat block. This isn't a new game system — it's a **presentation and synthesis layer** that reads from existing systems and produces a human-readable emotional hook.

**What it reads from (already built or in progress):**
- Personality traits and archetype
- Ambition system (what they want, whether they're getting it)
- Recent encounter trajectory (winning streak? losing streak? stagnant?)
- Reputation (rising, falling, among whom)
- Essence/quintessence levels
- Conditions and attachments (sick, wounded, blessed, cursed)
- Relationships (alone, mentored, betrayed, beloved)
- Location context (far from home, in hostile territory, in a place of power)

**What it produces:**
A human-textured emotional label and a prose line. The evaluator looks at the combination of signals — "lost last three encounters, ambition is high, reputation declining, alone" — and synthesizes a condition like "losing faith" or "struggling against the current." This is what the player reads at a glance in Beat 1.

**Examples of synthesized reads:**
- *Alone, far from home, grieving, ashamed, hunted, betrayed*
- *Confident, beloved, purposeful, defiant, victorious, reborn*
- *Sick, exhausted, broken, desperate, lost, forgotten*
- *Ambitious, reckless, obsessed, transformed, hardened, hopeful*

These are not game mechanics disguised as words. They are *human experiences* the player recognizes from their own life. When the game tells you a protagonist is "alone," you don't need a tooltip. You know what alone feels like.

**The library grows with the game.** Every new system should contribute conditions that paint new facets of the human experience. A trade system adds "bankrupt" and "prosperous." A faction system adds "exiled" and "celebrated." A war system adds "shell-shocked" and "battle-hardened." The synthesis layer is the bridge between mechanical depth and emotional surface.

---

## Depth Progression: From Patron to Mastermind

The game has a natural difficulty curve built into its own depth:

### Early Play: Protagonist-Intimate

You have your First — the protagonist you met during the Meet The First encounter, the one whose background you understand, whose relationship to you was forged through those initial branching choices. You follow their story. You intervene in their personal moments. The world is backdrop — you're learning how people work, how encounters feel, how your influence shapes outcomes. The fantasy is "guardian angel."

### Mid Play: Expanding the Circle

You start connecting with additional protagonists — two or three secondaries who caught your attention. Maybe a merchant's daughter with ambition, a disgraced soldier seeking redemption. Your First still gets the deepest encounters and the most complex branching. Your secondaries get medium-depth stories. You also have a few lightly-connected agents on the bench — people you've noticed but haven't invested in deeply yet. They're candidates for promotion if a story arc completes or a protagonist falls. You're starting to see the *systems* behind the stories — this guild keeps producing interesting encounters, that faction is creating opportunities. The fantasy is "patron."

### Late Play: Macro Orchestration

You're playing the whole board. You push one protagonist toward the adventuring guild, another into the merchant prince's court, a third into the resistance movement. You're using world structures — factions, institutions, geography, trade routes — as instruments through the contextual action cards. Select a faction, see what actions are available, influence its trajectory. You're not just helping people through moments; you're architecting the conditions for moments to happen. The fantasy is "mastermind god."

**The protagonist portfolio model:**
- **The First:** Your primary protagonist. Deepest investment, longest/most complex encounters, the strongest emotional connection. Met through the Meet The First encounter at game start.
- **Secondaries (2-3):** Protagonists you've invested in over time. Medium-depth encounters. Each has their own arc and personality.
- **The bench:** Lightly-connected agents you've noticed but not deeply invested in. Short check-ins, basic status. Candidates for promotion when a story arc completes or a protagonist is lost.
- **The natural arc:** You start with one (your First) and gradually expand. At the height of a run, you might have four or five active stories. This is *Malazan Book of the Fallen* structure, not single-protagonist fantasy — you jump between perspectives, and the richness comes from the interweaving.

### Narrative Portfolio Management: One Story at a Time

The player's protagonist portfolio is managed through the **divine cord** (the connection system) and the **threads bar** (the right-side UI). But critically, **the game does not surface multiple storylines in parallel.** 

In a turn-based frame, each protagonist's significant encounter is surfaced and completed as a unit — the player dives into one story, experiences it through its branches and resolution, then returns to the world. For longer encounters (multi-step arcs like Gate Duty), the game can compress multiple steps into a single deep session rather than spreading them across turns. The player uploads the story context to their mental working memory, engages deeply, and finishes (or reaches a natural pause point) before the next story surfaces.

**Hard limit:** Maximum one complex (multi-branch) story active at any time. Other protagonists' significant encounters queue — they don't fire simultaneously. Simpler encounters (single-step, background events) can resolve in parallel, but the player's *attention* is focused on one narrative thread at a time.

This is not a limitation — it's a design choice that serves the core experience. Interleaving multiple complex stories dilutes engagement with all of them. Focusing on one at a time deepens engagement with each.

**Design principle:** This progression is *emergent*, not gated. You don't unlock "macro mode" at hour 10. You naturally start thinking bigger as you understand the world better. Every system we design should work at the intimate level *and* become a tool for macro play. A faction system isn't just background color — it's a lever the player can eventually learn to pull. The action card system (select any node → see contextual actions) is the primary macro tool — it already exists in early form and needs deepening, not reinvention.

---

## The Living World Requirement

The world must feel vibrant and alive *independently of the player*. This is not optional backdrop — it's structural.

**Why it matters:** The macro progression only works if the world has real structures worth manipulating. If the adventuring guild in Thornwall is just a label on a building, the player can never think "I should push Kael toward Thornwall." But if Thornwall's guild has been taking contracts, building reputation, feuding with the local lord, and producing its own stories — then discovering it through a protagonist creates a genuine "I can use this" moment.

**What "alive" means:**
- Factions pursue their own agendas, creating opportunities and conflicts the player can exploit
- Locations have their own trajectories — towns grow, decline, change character
- NPCs outside the player's influence have arcs of their own (even if simpler)
- The world-soul's cosmic balance creates large-scale shifts that ripple into everything
- Events happen that no one caused — natural disasters, plagues, migrations, discoveries

**Design principle:** Every world system should produce visible change that the player can *notice* through their protagonists. If a system only produces numbers under the hood, it's not contributing to the living world feel.

---

## What Good Design Looks Like (Anti-Patterns and Positive Patterns)

### Anti-Patterns (what our current designs do wrong)

- **"Six new actions"** — listed as bullet points without exploring what makes each one a genuine dilemma, what choices they create for the player, or how they feel in the moment
- **Engine-first design** — the tick loop is elegant, the resolution math is correct, but nobody asked "what does the player see and feel?"
- **Binary outcomes** — succeed/fail with no narrative texture in between. No roller coaster, no cool failure
- **Mechanical surface** — protagonist state communicated as stats and numbers rather than emotionally resonant human conditions
- **Isolated systems** — a new system is designed, tested, and shipped without exploring how it connects to existing systems to create emergent moments
- **Missing UI vision** — "there will be a panel" without describing what the player experiences when they look at it

### Positive Patterns (what we should aim for)

- **Scenario-first design** — start with "imagine the player is watching Kael face the goblin boss" and design backward from the experience
- **Dilemma-centered actions** — every player choice should have genuine tradeoffs that depend on understanding the protagonist
- **Cool failure by default** — failure outcomes designed with as much care as success outcomes, producing narrative hooks. Draw from TTRPG game-mastering wisdom: "fail forward" with complications, not dead ends. The best GMs don't let failure stop the story — they let it *twist* the story.
- **Emotional read at every level** — from the protagonist list (glanceable status) to the encounter (prose-rich stakes) to the aftermath (trajectory change)
- **Connection mapping** — explicitly designing how a new system creates emergent possibilities with existing systems. "Faction reputation + encounter awareness + action choices = the player can leverage political position in combat encounters"
- **Turn compatibility** — every feature works in quick turns (background, ambient, auto-resolved) *and* deep turns (focused, scene-level, branching encounters)

### Existing Benchmarks (what's closest to working)

Two features in the current prototype are closest to delivering the real game experience:

- **Character creation (Remembrance)** — the player gets prose, makes choices with ambiguity, and the payoff is the definition of their divine identity. It has story, interaction, and consequence.
- **Meet The First encounter** — branching encounter that introduces the player's first protagonist through narrative choices. The payoff is the start of a relationship where you understand the character's background and personality. First iteration, not strong enough yet, but the *shape* is right.

Both features work because they combine prose, meaningful choices, and a payoff that's about *identity and relationship* rather than mechanical reward. Every feature should aspire to this shape.

- **Gate Duty encounter** (`civic-guard-encounter-content.ts`) — the first branching encounter prototype. Three steps, three intervention branches per step (supportive, coercive, withdrawn), prose that genuinely changes based on prior choices, and consequences that carry thematic weight. The clearance gate signal system adds state-aware branching on top. This is the closest prototype to the encounter vision described in Beat 2 — a micro-narrative with real choice points where the player's approach reshapes the story. What's missing: scaling the pattern, making branch choices carry mechanical weight beyond essence cost, and deeper "cool failure" aftermath.

Gate Duty, Remembrance, and Meet The First together form the **design DNA** of the game. New features should study all three.

---

## How This Document Is Used

This is not a specification. It's a **compass**. It tells you what direction "good" is.

- **During design (In Design phase):** Load this document. Every design decision should be tested against these principles. "Does this serve the three-beat loop? Does this create genuine dilemmas? Does failure produce cool narrative? Can the player read emotional state at a glance?"
- **At the design quality gate (In Design → Implementation Planning):** The gate checklist asks specific questions derived from these principles. If you can't answer them, the design isn't ready.
- **During implementation:** If an implementation decision has a design-neutral option and a design-serving option, choose the one that serves these principles.
- **During review:** If a shipped feature doesn't deliver on the experience described here, that's a design gap — file it, don't accept it.

---

## Resolved Decisions

Decisions that were open during drafting but are now settled:

1. **Turn-based, not continuous.** The game is turn-based. Each tick is a turn, and the player decides when to advance. Continuous real-time play actively undermines the core experience by pulling attention away from the moments that matter.

2. **The emotional read is a synthesis layer, not a new system.** It reads from existing systems (personality, ambition, encounter trajectory, reputation, conditions, relationships, location) and produces a human-readable emotional hook. No new game mechanics — better presentation of existing data.

3. **Protagonist count is small and grows organically.** Start with the First, expand to 2-3 secondaries, maintain a bench of lightly-connected candidates. Not 6+ simultaneous deep stories. Malazan structure with 4-5 active perspectives at peak, not a roster game.

4. **Macro play tools already exist in early form.** The contextual action card system (select any node → see contextual actions) is the macro tool. It needs deepening and better design, not reinvention.

---

## Open Questions (To Be Resolved Through Design Work)

These are genuine design challenges that this document identifies but does not solve:

1. **Encounter interaction depth and variety.** The branching encounter system supports short, medium, and long encounters with up to five branch points. The right answer isn't a fixed depth — it's variety. Some encounters should be quick (one meaningful choice), others should be deep multi-branch arcs. But the balance matters: too much player agency becomes control, and control kills the living world feeling. The world needs to push back. How do we calibrate the spectrum so the player feels like a participant, not an author?

2. **Narrative portfolio management.** With 3-5 protagonists at different investment levels, how does the game help the player manage attention across stories? This isn't "notification fatigue" — it's "how many stories can you follow and care about simultaneously?" How does the game signal which stories are peaking vs. cruising? How does encounter depth scale with protagonist tier (First gets complex branches, bench agents get simple check-ins)?

3. **The failure economy.** Failure must tell interesting stories — complications, not dead ends. Draw from TTRPG GM wisdom: every failure should create a new situation that's as interesting as success would have been. The condition library needs to be deep enough that repeated failures produce *different* textures. How deep? How do we prevent failure patterns from becoming repetitive over dozens of hours?

4. **The presentation gap.** The biggest lag in the core loop. The engine generates events, but the player experience of those events — the prose, the visual staging, the emotional texture, the sense of being *in* the moment — is largely unbuilt. This is the critical path. How do we close the gap between what the simulation produces and what the player experiences?
