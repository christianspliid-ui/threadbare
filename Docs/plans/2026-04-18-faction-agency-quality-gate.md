# Faction Agency — Quality Gate Addendum

> **Date:** 2026-04-18
> **Issue:** THR-29 (TB-098 · Social Expansion C: Faction Agency)
> **Status:** In Design (addressing quality gate failure from 2026-04-16)
> **Parent design:** `Docs/plans/2026-03-31-social-systems-expansion-design.md` § Expansion C
> **Parent implementation plan:** `Docs/plans/2026-04-14-faction-agency-implementation.md`
> **Reference:** `Docs/plans/2026-04-16-design-quality-gate.md`, `Docs/plans/2026-04-16-game-design-direction.md`, `Docs/plans/2026-04-16-agent-initiatives-quality-gate.md` (sister addendum for THR-51)

---

## Why This Addendum Exists

The parent implementation plan (`2026-04-14-faction-agency-implementation.md`) describes Faction Agency as a 10-action behavior loop with treasury costs, cooldowns, and ambition affinities. It answers *what the engine does when a faction acts* but not *what the player experiences when a faction acts*. The 2026-04-16 quality gate comment on THR-29 was explicit: "feature list with no experiential layer" — the same failure mode that bounced THR-51.

This addendum applies the user's explicit revision direction:

1. **Trim 10 → 6 v1 actions.** Same trim approach as THR-51 (13 → 6). Keep the high-narrative-yield subset; defer actions that need upstream systems.
2. **Write golden / mundane / failure scenarios** for the system as a whole.
3. **Write 4 benchmark scenes** showing the quality bar.
4. **Build the emotional architecture** — conditions, stakes, communication.
5. **Develop the dilemma inventory** — the real choice design space (your two bonded agents on opposite sides of a rivalry).
6. **Ground each benchmark** in existing engine infrastructure — no vaporware.

### v1 Action Types (6)

Trimmed from the implementation plan's 7 Tier-1 actions. **Sponsor Agent deferred** because it overlaps with the Anoint Champion divine action and lacks the ensemble/stakes qualities of the kept six.

| Action | Axis | Why v1 | What the player feels |
|--------|------|--------|----------------------|
| **Hold Conclave** | Group / ensemble | The ensemble dramatic scene — factions deliberating their future. Uses THR-28 group resolution. | "I'm watching a room full of strong opinions decide something that will affect everything." |
| **Declare Rivalry** | Adversary creation | Single act that reshapes the political map. Creates durable hostility that cascades through every subsequent encounter. | "The world just got more dangerous. My bonded agent is on the wrong side of a line that didn't exist yesterday." |
| **Propose Alliance** | Bond between collectives | The counterpart to rivalry. Alliance declarations change what's possible for both factions' members. | "Two factions just merged worlds. My bonded agent has new allies — and new obligations." |
| **Excommunicate** | Personal / emotional | The most intimate faction action — one person, specifically named, cast out. Strikes at belonging. | "They're throwing someone out. I can see the person they're throwing out." |
| **Commission Quest** | Grounding / frequent | The everyday heartbeat. Factions need members to do things; members need reasons to act. The repeating background beat. | "The world is asking things of people. My agents are being invited into stories." |
| **Issue Bounty** | Dramatic / legible | Puts a target on a named person. The bounty itself becomes a beat that agents react to. | "Someone is being hunted, and the hunters know who they are." |

### Actions Deferred from v1

| Deferred | Why | When |
|----------|-----|------|
| Sponsor Agent | Overlaps with Anoint Champion divine action; lacks ensemble/stakes weight. Mechanical wealth transfer without a scene. | Fold into faction quest rewards or revisit after THR-30 (favors/secrets). |
| Build Guild Hall | Construction needs the initiative pattern and economic teeth from M3. | M3 Dynamic Economy. |
| Establish Chapter | Same — needs expansion economy to feel consequential. | M3 Dynamic Economy. |
| Territorial Claim | Needs the control/defense encounter loop from a mature military system. | Siege system maturity. |

---

## Section 1: Player Experience Scenario

### The Golden Scenario

Kael Thornweaver — the player's First, a Mind/Spirit Witness — has founded the Seekers of Lost Echoes (THR-51 initiative). Six ticks later, the Seekers have seven members, a small chapterhouse above the Weathered Oak's back room, and a shared conviction that the Arcane Circle's insularity is the real danger.

The Circle notices.

At tick 22, the chronicle shows an entry that makes the player sit up:

> *The Arcane Circle has convened in the inner sanctum. Scholar-Warden Voss has called his circle of scholars to a conclave — the first in eleven years. Eight voices now speak, and among them Voss has placed the question that has been gathering silently for weeks: what does the Circle do about the Seekers?*

The player's detail panel shows a new element they've never seen: **Active Conclave: The Arcane Circle (4 participants, 3 ticks remaining).** Clicking it opens a view of the faction with a new "Conclave" section: the question being debated, the participants (Voss, Scholar Malia, Librarian Orren, and — the player's breath catches — Maren, the scholar Kael recruited into the Seekers two ticks ago).

Maren was at the Circle conclave. She's still technically a member.

The conclave runs three ticks. The player watches it unfold through chronicle entries, each one shorter than an encounter but heavier than a routine:

> *Tick 23: Voss presents the argument. The Seekers have recruited from the Circle. They meet in secret. They have not asked permission. He does not say "treason" but the word hangs in the air.*

> *Tick 24: Malia speaks for patience. Orren speaks for discipline. The debate is a knife turning slowly.*

The player's divine action drawer lights up: **"Divine Edict" is available (essence cost: 18).** The god can speak into the conclave debate — push it toward a particular outcome. But Divine Edict requires a bonded agent to be present, and Maren is only barely bonded (Kael's ally, not the player's direct bond).

The real choice emerges: **Maren is at the conclave and she is about to be asked whether to excommunicate Kael.** 

The player sees Maren's character sheet. She has Heart tier 4, loyalty to Kael (`respects` edge, strength 0.7), but she's also been a Circle scholar for nineteen years. Her axiological profile: loyalty at the midpoint, honesty high. This is a person who will tell the truth.

Three divine options appear:
- **"Strengthen her resolve"** (essence cost: 5 — shift Maren's loyalty to Kael without removing her sight of the truth)
- **"Show her the cost of silence"** (essence cost: 8 — reveal to Maren, through dream or vision, what happens to the Circle if the Seekers are crushed: stagnation, the ossification she joined the Circle to prevent)
- **"Let her answer as herself"** (free — Maren decides with the conviction and compromises that are already in her)

The player thinks: "If I strengthen her resolve, she'll defend Kael — but she'll be outnumbered, and the vote will go against him anyway. If I show her the cost of silence, she becomes an ally to Kael that I made, not one Kael earned. If I let her answer as herself, I don't know what she'll say. She might betray him. She might save him. She might split the difference and both."

The player picks the free option. Maren speaks.

> *Tick 25: Maren stands. She does not deny attending the Seekers' meetings. She does not plead. "The Circle taught me that knowing changes things," she says quietly. "I went to the Seekers to find out if they meant it or if they were just reciting our creed back to us. They mean it." She pauses. "I don't know yet if they are right. But I know that expelling them will make us smaller."*
>
> *The chamber is silent. Voss's face has gone unreadable.*
>
> *The vote is called. Three for censure. Two for excommunication. Maren abstains.*
>
> *Scholar-Warden Voss declares: the Seekers of Lost Echoes are hereby named rivals of the Arcane Circle. Their members are barred from Circle grounds. Any scholar who joins them will answer to the conclave.*

The chronicle closes the conclave with a new event:

> *Tick 25: The Arcane Circle has declared rivalry with the Seekers of Lost Echoes. Kael Thornweaver's name is spoken in the Circle's halls like a wound.*

The player's internal response: "Maren didn't betray him. She didn't save him either. She told the truth, and the truth wasn't enough. Now Kael has a rival faction — a real enemy. And Maren is still in the Circle, still bonded to Kael, and both of those facts are going to tear at her."

The world just got bigger *and* more dangerous. The player didn't make any of this happen — the Circle acted on its own ambition, its leader's personality, the state of its membership. The player watched.

### The Mundane Scenario

The Merchant Consortium at Saltspire commissions a quest. The chronicle entry is one line in a cluster of other tick events:

> *The Merchant Consortium has posted work on the Saltspire notice board: a shipment to be escorted to Thornfield, and something they aren't naming about the caravan that disappeared last month.*

The player doesn't interact with it. But over the next five ticks, two NPC agents — both members of the Consortium — take the quest. The chronicle mentions the successful delivery in a single line, and the failed attempt to recover the missing caravan in another. Thornfield's prosperity nudges up. One of the NPC agents gains a `respects` edge to the Consortium's leader. The missing caravan becomes a `rumor` node at Saltspire that other agents may eventually investigate.

The faction did work. The world absorbed it. Nothing dramatic — but the Consortium is no longer scenery. It's doing its job, and its job is doing things.

### The Failure Scenario

The Thieves' Guild at Blackharbor issues a bounty on a Merchant Consortium caravan master who exposed their racket. The chronicle entry:

> *A bounty has been posted in the shadow-places of Blackharbor: the head of Caravan Master Jorin, wanted by the Thieves' Guild. The coin is generous. The eyes of those who look at him now are watchful.*

The bounty lands on a tier-2 chronicle slot (it involves named NPCs and creates durable danger). Two Thieves' Guild members take the hunt. One fails at his own encounter. The other successfully tracks Jorin — but the attempted assassination is interrupted by a Consortium guard who dies protecting his charge.

The chronicle reads:

> *The hunt ended badly for everyone. Jorin lives. The assassin was killed by Jorin's man. The Consortium guard Pell Ironwood did not survive the wound. The Merchant Consortium has not yet declared anything — but the notice of Pell's death has reached the Consul's chamber, and the Consul is known to remember names.*

The bounty failed. But the failure wasn't "bounty: outcome: failed." It created new edges: the Consortium's Consul has `hostile_to` feelings toward the Thieves' Guild that weren't there before. Pell's son (an NPC agent with a `related_to` edge) gains the condition "bereaved." The Thieves' Guild spent 12 treasury and has nothing to show. Jorin gained "hunted" — a condition that will color his next encounters with wariness.

Cool failure: the bounty failed, but it made the *next* faction conflict possible. The Merchant Consortium is now primed to declare rivalry with the Thieves' Guild — not because the player did anything, but because one failed faction action created the conditions that make another faction action inevitable. The world is generating its own pressure.

---

## Section 2: Emotional Architecture

### Emotional Read

Faction actions communicate through three channels, each with a distinct tempo:

**Iconic (glanceable):** Faction detail panel shows "Recent Action" with type icon, outcome, and one-word status: *deliberating / acted / stalled / resolved.* Relationship edges render with mood glyphs — rival factions get a small divided-banners icon on their relation row, allied factions get linked-banners.

**Prose (textured):** Each action produces chronicle prose in Threadbare voice. Not "Faction A declared rivalry with Faction B" but "The Seekers of Lost Echoes have drawn a banner the Circle cannot pretend to ignore."

**Scene (dramatic):** Conclaves, excommunications, and bounty-deaths produce full-scene encounters. These are the tier-1 moments — the rare beats where the player reads every line.

### Resonant Conditions

Faction actions apply or modify these human conditions on affected agents (not the faction itself — factions don't feel; their members do):

| Action | Affected | Condition | Communication |
|--------|----------|-----------|---------------|
| Excommunication (target) | Ex-member | "cast out" | "The doors close. Her name is struck from the rolls. She walks out carrying only what she brought in." |
| Excommunication (witness) | Other members | "steadied" or "shaken" (by leader bias) | "The lesson is clear. No one says it." |
| Rivalry declaration (member) | Rival faction member | "marked for suspicion" | "Eyes find him wherever he goes. Rooms quiet as he enters." |
| Alliance proposal (member) | Ally faction member | "welcomed in from the cold" | "Doors that were closed are open now. He remembers when they weren't." |
| Bounty (target) | Hunted agent | "hunted" | "Every stranger in an inn is a calculation. He learns to sleep with his back to the wall." |
| Bounty (member) | Hunter | "on the hunt" / "bloodied" | "The money was good. The work was worse than he said it would be." |
| Conclave (dissenter) | Member who lost the vote | "dissenting" / "silenced" | "He voted no. The council voted yes. He will carry out the decision because that is what he swore. But his hands do not stop shaking for an hour." |
| Conclave (winner) | Member whose position won | "vindicated" | "The Circle has seen things her way. She does not smile — but she holds her tea cup slightly tighter than she meant to." |
| Commission Quest (taker) | Questing member | "charged with duty" | "He carries a purpose now. It fits him better than his old clothes." |

### Stakes Framing

When a faction action reaches a player-visible scene, stakes are framed in human terms:

Not: "Conclave resolution: excommunication vote. Outcome: target loses `member_of` edge and gains `hostile_to` edge."

But: "Maren has been a Circle scholar for nineteen years. She met her husband in the east wing library. She taught three generations of apprentices. If the vote goes against her, she walks out of a life — and into whatever the Seekers are becoming, or into no place at all."

Not: "The Thieves' Guild has issued a bounty on Jorin. Reward: 10 wealth. Expiry: 40 ticks."

But: "Jorin Blackharrow exposed the Thieves' Guild's shipyard racket to the harbormaster. He did it because his cousin had been drowned in the harbor for asking questions. The Thieves' Guild has not forgotten. They never do."

Where possible, the scene prose also surfaces the adjacent stakes: who loves the bountied person, who depends on the excommunicated member, what the rivalry costs the merchants who were profiting from neutrality.

---

## Section 3: Choice and Dilemma Quality

### Dilemma Inventory

| Choice Point | Options | Tradeoffs | Why No Right Answer |
|-------------|---------|-----------|---------------------|
| **Divine Edict** (conclave) | Push conclave toward god's preferred outcome vs. let the faction decide vs. tip the scales gently | Full push = win the vote, but the faction now owes its direction to the god's voice rather than its own reasoning. Free = authentic faction agency, but the outcome might be wrong for your bonded agents. | A god who decides everything has no story — a world that decides for itself might decide against you. |
| **Conflicting bonds** | Two bonded agents in factions that declare rivalry — support one and strain the other, or stay out and leave both alone | Each bond deepens the other's feeling of abandonment. Staying out preserves both but invests in neither. | The Malazan portfolio problem — your protagonists have different factions, and factions don't care whether the god finds the pairing convenient. |
| **Excommunication intervention** | Your bonded agent is about to be excommunicated — spend essence to shift the vote, send a warning vision, or let it happen | Saving them keeps the structure but breeds resentment inside the faction. Warning them lets them leave first, preserving dignity but accelerating the break. Letting it happen creates their liberation/banishment story. | "Saving" a character can be the thing that traps them. |
| **Rivalry opportunity** | A faction with hostile sentiment toward a rival faction is considering declaring open rivalry — spend essence to push them (or prevent them) | Declaring rivalry makes the world more dramatic but costs your bonded agents in the crossed faction. Preventing it preserves peace but might leave real grievances to fester into something worse. | Peace is not always good; open war is not always bad. |
| **Bounty dilemma** | A faction has issued a bounty on an NPC — do nothing, protect the target (via a bonded agent's proximity), or escalate (leak the bounty publicly) | Doing nothing = the world acts on itself. Protecting = your bonded agent becomes entangled with the target. Escalating = the bounty becomes a political event, not a private one, and the issuing faction loses face. | You are a god — not the police. |
| **Alliance acceptance** | A faction your bonded agent belongs to proposes alliance with a faction they've spent years disliking — speak into the decision, or stay silent | Pushing alliance gives your bonded agent new resources but betrays their personal history. Opposing preserves integrity but isolates their faction. | Growth requires compromise; compromise can hollow a person out. |

### Knowledge-Dependent Choices

Every faction dilemma requires protagonist and world understanding:

- **Knowing the conclave is about to happen** requires attention to faction state — active ambition, time since last conclave, crisis triggers. The game surfaces conclave-imminent signals through chronicle tier 2 entries ("The Arcane Circle grows restive. Voices argue in the halls.") — the player must notice and choose to engage.
- **Knowing which faction member might flip** requires reading their axiological profile and edges (who do they `respect`, who do they `fear`, where do their loyalties actually live). This is the character-sheet-investment reward — the player who reads Maren's profile sees a likely abstainer; the player who doesn't sees an enemy.
- **Knowing whether excommunication will shatter or free a member** requires condition-reading. An "isolated" member thrown out joins whoever will take them. A "vindicated" member thrown out founds something new. The chronicle teaches these patterns but the player must draw the inferences.

### Intervention Spectrum

| Engagement Level | What Happens |
|-----------------|-------------|
| **Auto-resolve (do nothing)** | Factions evaluate their ambition, their leader's personality, their state, and select an action. Actions execute. The world shifts. Chronicle entries narrate the shifts. Some factions are more active than others (aggressive leaders issue bounties, cooperative leaders propose alliances). The political map evolves. Some of your bonded agents benefit; some suffer. |
| **Minimal intervention** | The player uses Divine Edict once per "big" conclave — the rare scene where a vote will dramatically reshape a bonded agent's world. The rest of faction action is observation. |
| **Deep intervention** | The player engineers conflicts and alliances. They find hostile faction pairings and push rivalry to generate drama. They fund Anoint Champion on agents whose faction is in a conclave so the agent's position carries weight. They watch bounties and decide whether to leverage them or neutralize them. |

**Doing nothing is still interesting:** NPC factions declaring rivalries with other NPC factions creates a world the player's bonded agents live in. A rivalry between the Merchant Consortium and the Thieves' Guild reshapes every tavern encounter in Blackharbor — not because the player did anything, but because the world did.

### Agency vs. Living World

The world pushes back through:
- **Leader personality determinism** — an aggressive-leader faction will find a way to issue bounties regardless of god intervention. You can delay, not prevent.
- **Inter-faction gravity** — hostile sentiment grows between factions based on their members' actions. Your bonded agents' choices shape faction-level sentiment without your direct input.
- **Member dissent** — conclaves produce "dissenting" members who may pursue initiatives (THR-51) that undercut the conclave's decision. The faction's decisions are not the final word.
- **External pressure** — doom pressure and omens bias faction decisions. A faction under severe omen pressure may declare rivalry where it would otherwise propose alliance.

---

## Section 4: System Connections and Emergence

### Connection Map

| System | Direction | Interaction |
|--------|-----------|-------------|
| Agent Initiatives (THR-51) | Reads + Writes | Found Organization initiatives create new factions. Initiative failures generate `hostile_to` edges that prime rivalry declarations. |
| Deep Social Scenes (THR-28) | Reads | Conclaves use group scene resolution and the leverage mechanic. |
| Attention Tier model (shipped) | Writes | Faction actions scored into tier-1 (conclaves involving bonded agent), tier-2 (actions affecting bonded agent's faction), tier-3 (ambient faction activity). |
| Axiological profiles | Reads | Leader personality drives action bias. Conclave participants' profiles shape their positions. |
| Ambitions | Reads | Active ambition biases action selection (resource_acquisition → commission quest; revenge → issue bounty). |
| Reputation | Writes | Faction actions cascade to reputation — excommunication cascades to other faction memberships; completed quests build reputation with the issuing faction. |
| Encounter pipeline | Writes | Quests, bounty hunts, rivalry encounters, conclave scenes are all injected as encounter candidates. |
| Wealth system | Reads + Writes | Faction treasury deductions for action costs. Sponsor/bounty wealth transfers. Quest tribute feeds treasury. |
| Cool failure (THR-20) | Writes | Failed actions generate complications per the complication taxonomy. |
| Omen system (THR-19) | Reads | Doom pressure biases faction decisions. |
| Secrets & Favors (THR-30) | Feeds | Faction actions create `knows_secret_of` edges (conclave dissidents, excommunicated members carrying secrets, bounty targets with leverage). |
| Graph operations | Writes | `relates_to` (rivalry/alliance basis), `hostile_to` (excommunication), `bounty` nodes, `faction_quest` nodes. |

### Emergent Possibilities

1. **The cascading rivalry.** Faction A declares rivalry with Faction B. Faction B's ally Faction C is now forced into a position. Faction C holds a conclave — does it honor the alliance or stay neutral? The conclave resolution shifts the political map a second time. The player didn't engineer any of this; it emerged from sentiment gradients and leader personalities.

2. **The split member.** Agent X is a member of Faction A and trusted by Faction B's leader. Faction A declares rivalry with Faction B. Agent X cannot remain in both worlds. The system generates a crisis encounter where Agent X must choose. If they're a bonded agent, the player faces a choice. If they're an NPC, the choice resolves according to their axiological profile — and may produce a Found Organization initiative (THR-51) where Agent X creates a third way rather than picking a side.

3. **The bounty that triggered a war.** A small bounty posted by a small faction on a small agent results in a death that crosses lines the faction didn't know existed. A grieving relative is a member of a bigger, more powerful faction. The bigger faction holds a conclave. A new rivalry is born. The player reads the chronicle and traces the chain back to the original bounty, realizing the whole escalation started with an act their bonded agents had no part in.

4. **The conclave that shifts a faction.** The Arcane Circle has held together on tradition for eleven years. One conclave — triggered by the Seekers' rise — debates not just punishment but the Circle's purpose. Maren's abstention signals a rift. Over the next ten ticks, conclave dissidents begin pursuing their own Found Organization initiatives. The Circle doesn't split in this conclave, but this conclave was the moment where the future of the split became possible.

### Missed Connections (Deferred)

- **Sponsor Agent:** Deferred as noted. Revisit after THR-30 ships — sponsorship tied to favors/secrets creates stronger dramatic shape.
- **Economic feedback:** Treasury income from quest tribute exists in v1 but isn't yet tied to faction wealth growing into expansion (Build Guild Hall, etc.). M3 Dynamic Economy.
- **Cross-settlement faction politics:** Rivalries at the settlement level exist; at the regional level they need the geographic reach model to mature.

### Turn-Pace Compatibility

**Quick turn:** Ambient faction activity appears as tier-3 chronicle lines the player scans past ("The Merchant Consortium posted notice at Saltspire."). Bonded-agent-adjacent events appear as tier-2 alerts ("A bounty has been issued on someone your Serafina's brother serves.").

**Deep turn:** A conclave involving a bonded agent is a full-scene tier-1 encounter — the player reads every line, considers divine intervention, watches the vote unfold.

---

## Section 5: Design Alternatives

### Alternative A: Player-Directed Faction Actions

The player commands factions directly — choose rivalry, choose alliance, commission quests as the god.

**Gains:** Direct power. Strategic planning.
**Loses:** Living world. Factions become puppets. The portfolio-of-protagonists frame collapses because factions aren't protagonists either — but they become tools of the god rather than collectives with agency.
**Why rejected:** The divine role is to shape with whispers and attention, not to command. Direct faction control recapitulates the 4X god-king frame this game rejects.

### Alternative B: Faction Actions as Encounter Outcomes Only

No faction action phase — all faction actions emerge from encounters. An "internal faction dispute" encounter resolves, and the resolution creates the rivalry/alliance/bounty.

**Gains:** Unified pipeline.
**Loses:** Factions only act when an encounter fires in their space. Factions without active members miss their turn. The periodic, deliberate rhythm of faction deliberation (conclaves every ~50 ticks) can't exist.
**Why rejected:** Factions are temporal entities that need their own cadence. A conclave isn't an encounter — it's a deliberation that takes ticks. The separate phase is what makes it feel like institutions.

### Alternative C: Flat Uniform Action Frequency

All factions act every N ticks regardless of state.

**Gains:** Predictable cadence. Simple math.
**Loses:** Some factions feel alive while others feel moribund — and that texture is desirable. A Thieves' Guild under pressure should act more than a sleepy merchant consortium. Leader personality should matter.
**Why rejected:** The pressure-responsive rhythm is part of what makes factions feel like living institutions rather than metronomes.

### Inspiration

- **Crusader Kings:** Factions (courts, religions, realms) act through personalities. Characters pursue ambitions, but faction structures shape what's possible. The player watches and tilts.
- **Europa Universalis:** Nations as collective actors with AI personalities (aggressive, merchant, religious). Rivalries, alliances, and grievances cascade across maps. Individual rulers matter less than institutions.
- **Mount & Blade:** Factions declare wars and peace based on leader personality and state. The player can influence but not command. The political map evolves whether you're fighting or trading.

---

## Section 6: UI and Presentation Vision

### First Impression

The player discovers faction agency through the chronicle. The first faction action in any playthrough is typically a Commission Quest — it appears as an ambient tier-3 entry. The second or third faction action is usually a rivalry or conclave involving the Arcane Circle (the player's starting faction) — and that's the moment the player realizes faction action is a real system.

There is no tutorial popup. The player reads the Circle's conclave announcement. They click the faction detail panel and see the new "Active Conclave" section. The game teaches by naming what's happening.

### Visual Hierarchy

1. **Chronicle entry** (primary): Every faction action produces prose.
2. **Faction detail panel "Recent Actions" section** (secondary): Durable log of recent actions with outcomes. Players scanning a faction see what it's been doing.
3. **Faction relationships row** (at-a-glance): Rivalries and alliances visible on faction panel with mood glyphs. Rival factions' entries render with a muted-red accent; allied factions render with a linked-banner icon.
4. **Active Conclave section** (conditional): When a faction is holding a conclave, the faction panel surfaces a prominent section showing participants, question being debated, and ticks remaining.
5. **Action drawer** (interactive): "Divine Edict" appears when a conclave with a bonded-agent-reachable faction is in session. "Anoint Champion" appears when targeting a faction member.

### Component Vision

- **Faction action log:** Uses existing `ChronicleEntry` primitive with action-type icons. No new component.
- **Active Conclave section:** New component (`ActiveConclaveView`) rendered inside FactionSheet when the faction has `activeConclave` property set. Shows participants (agent portraits with axiological glyph), question prose, ticks remaining, and — if a bonded agent is a participant — a "Speak into the conclave" button that opens the Divine Edict flow.
- **Rivalry/alliance row:** Extend existing faction relations display with basis-specific styling. No new component.
- **Bounty notice:** Bounty nodes render in the target agent's detail panel ("Hunted by: [Faction]") and, for faction members, appear in the action drawer as available encounter candidates.

### Prose Integration

Faction action prose uses enrichment placeholders feeding from faction state:

- `{faction_name}` → "Arcane Circle" (or localized/poetic variant if the faction has a `poetic_name` property — "the circle of quiet scholars")
- `{faction_leader}` → "Scholar-Warden Voss"
- `{rival_faction}` → "the Seekers of Lost Echoes"
- `{action_context}` → biography fragment tied to the conclave question — "the scholars who meet above the Weathered Oak"

The prose pipeline already supports this pattern (see systemic wiring guide, enrichment placeholders). Faction action templates are parameterized by faction state, not hardcoded.

---

## Section 7: Depth Progression

### Newcomer

A new player sees the Arcane Circle's conclave. They click the notification. They read the chronicle. They don't need to understand conclave mechanics, leverage, or the dissent tracker. They see a roomful of named people arguing about a decision, and they see one of Kael's friends in the room. That's enough. They watch the vote. They read the outcome. The system is invisible; the drama is visible.

### Expert

An experienced player learns that conclaves can be nudged with Divine Edict, and they begin watching for conclave-imminent signals (chronicle tier-2 "the faction grows restive" entries). They learn that rivalry declarations follow negative sentiment gradients, and they start watching the sentiment between factions whose rivalry would benefit their bonded agents. They start using Anoint Champion on bonded agents whose position in an upcoming conclave vote matters.

### Mastery

A master player orchestrates faction politics as a meta-layer. They cultivate rivalry between two factions whose conflict advances a bonded agent's ambition. They allow excommunications to happen so the ex-members form the nucleus of a Found Organization initiative. They use Divine Edict sparingly but with precision — one edict in the right conclave can reshape the entire regional map for twenty ticks. They read the chronicle not for stories but for patterns — which factions are tending toward rivalry, which toward alliance, which leaders are about to retire or die. Faction actions become a chessboard the player plays as a composer, not a commander.

---

## Section 8: Value Justification

### Core Loop Service

**Primary:** Beat 1 (Portfolio Scan) and Beat 3 (Aftermath). Faction actions make the world feel like it's inhabited by collectives with their own ambitions. When the player scans their turn, they see factions doing things — not just agents. This is the "the world is alive without me" pillar.

**Secondary:** Beat 2 (Curated Moment). Conclaves and excommunications are curated moments — the system identifies when a faction action touches a bonded agent and surfaces it at tier-1 attention. The player reads every line.

### Standalone Value

Yes. A player who watched only faction actions (no direct agent control, no divine interventions) would still see a world evolving: rivalries declared, alliances formed, scholars cast out, quests commissioned, bounties claimed or failed. The faction layer is the political spine of the world. Without it, agents are islands; with it, agents are citizens of collectives that shape their options.

### Opportunity Cost

Building faction agency means not yet building economy feedback loops (M3), not doing hex vignette phase 2, not polishing onboarding. The tradeoff is worthwhile because: the social world currently has agents and locations but no institutional layer between them. Factions-as-scenery is the current state; factions-as-actors is the upgrade that makes everything else (rivalries, alliances, politics, drama) legible.

---

## Section 9: Content Benchmark Moments

### Benchmark 1: The Conclave (Hold Conclave — Golden)

**Setup:** The Arcane Circle has been stable for eleven years. Ambition: `defensive_consolidation`. Leader: Scholar-Warden Voss, axiological profile heavy on tradition + prudence. The Seekers of Lost Echoes (founded by Kael Thornweaver via THR-51 initiative) have reached seven members, recruited two from the Circle's ranks. Circle sentiment toward Seekers: -0.45 and falling. `CONCLAVE_TRIGGER_INTERVAL` has elapsed and a crisis signal (rival faction with >= 2 poached members) fires conclave evaluation.

**Trigger:** `phaseFactionActions` evaluates the Circle. `Hold Conclave` scores highest (crisis trigger + traditionalism + available top-ranked members). Conclave begins with a 3-tick deliberation window.

**The moment (opening chronicle, tier 2):**

> *Scholar-Warden Voss has called a conclave. The first in eleven years. Eight voices will speak, and among them the question that has been gathering silently for weeks: what does the Circle do about the Seekers?*
>
> *The participants gather in the inner sanctum. Malia, whose robes still carry chalk-dust from her morning teaching. Orren, who has not slept. Three others whose names Kael knew as a student. And Maren — who joined the Seekers two ticks ago, and who has not resigned her Circle membership.*
>
> *She arrives at the conclave because she was invited. She does not know yet that this invitation was a test.*

**Mid-conclave chronicle (tier 2, tick 2 of 3):**

> *The debate turns. Voss speaks of erosion. Malia speaks of inquiry. Orren speaks of the cost of silence — and realizes, halfway through, that he is no longer sure which side of the question he is on.*
>
> *Maren has not spoken.*

**Resolution scene (if Divine Edict not used, tier 1, tick 3 of 3):**

> *The vote is called. Voss's position: censure and exclusion. Malia's counterproposal: inquiry delegation. Three voices back Voss; two back Malia. One voice has not answered.*
>
> *Maren stands. "I went to the Seekers to find out if they meant it or if they were just reciting our creed back to us. They mean it." A pause. "Expelling them will make us smaller. I abstain."*
>
> *The chamber is silent.*
>
> *Voss's motion carries. The Seekers of Lost Echoes are declared rivals of the Arcane Circle. Their members are barred. Any scholar who joins them will answer to the conclave.*
>
> *Maren walks out last. She is still a scholar. She has not yet decided what else she is.*

**Player's internal response:** The player feels the weight of a real deliberation. They've watched a faction make a decision — one they might have disagreed with, one that will reshape the next twenty ticks. Maren's abstention is a forward hook they didn't script.

**Forward hook:** Rivalry edge between Circle and Seekers created. Maren gains condition "dissenting" + `respects` edge to Kael deepens. Voss gains condition "vindicated." Three of the four `respects` edges Kael had inside the Circle are now `conflicted_about` edges — relationships complicated but not severed.

**Emotional condition mapping:** Dissenters gain "silenced." Winners gain "vindicated." The faction itself gains a chronicle-visible property `last_major_action: declared_rivalry_with_seekers` which colors its next conclave prose.

### Benchmark 2: The Letter of Censure (Excommunicate — Dramatic/Personal)

**Setup:** Lira, a scholar Kael recruited to the Seekers in an earlier tick, is still officially a Circle member. The Circle's post-conclave rivalry declaration includes a clause: members who have joined the Seekers will be personally censured. Lira's case is brought to Voss.

**Trigger:** `phaseFactionActions` evaluates the Circle. `Excommunicate` scores highest (action type unlocked by conclave policy, specific target identified by `member_of(both: Circle, Seekers)` query).

**The moment (tier 2 chronicle, because Lira is tier-2 adjacent to Kael who is tier-1):**

> *Lira received the letter at dawn. Circle seal. Voss's hand.*
>
> *She read it twice. The words were polite. They said her scholarship was valued. They said that a scholar's loyalty could not be divided. They said that her membership in the Arcane Circle was, with regret, ended this morning at the eighth bell.*
>
> *She set the letter down on the kitchen table next to her teacup. Her hand did not shake. Her hand had been shaking for three ticks already and now it had nothing left to shake with.*
>
> *At the eighth bell she walked to the Circle's east gate. The guard nodded to her, the same guard who had nodded to her every morning for four years. She surrendered her medallion. He looked at her face and said "I'm sorry, scholar," quietly enough that the other guard wouldn't hear.*
>
> *She walked down the hill and did not look back.*

**Player's internal response:** The player may or may not know Lira. If they do, the moment lands heavily. If they don't, it lands as atmosphere — the world's ambient cruelty and dignity rendered in a moment.

**Forward hook:** Lira's `member_of(Circle)` edge removed. `hostile_to(Circle, Lira)` edge created (the faction's institutional grievance). Lira gains condition "cast out." Lira's `member_of(Seekers)` edge persists. Her Seeker membership now defines her, not incidentally but primarily. Next tick, Lira's "cast out" condition interacts with her personality — she may pursue her own initiative (Found Organization: "the scholars outside the walls") or deepen her Seeker commitment.

**No Divine Edict moment here.** Excommunication is a bureaucratic act; it happens off-screen for the faction and on-screen for the individual. The player witnesses, does not intervene, and the system generates consequential downstream graph mutations regardless.

### Benchmark 3: The Bounty That Went Wrong (Issue Bounty — Cool Failure)

**Setup:** The Thieves' Guild at Blackharbor has `revenge` ambition following a failed racket that Caravan Master Jorin Blackharrow exposed. Leader: Maela Quickwater, axiological profile heavy on cunning + vengeance.

**Trigger:** `phaseFactionActions` evaluates the Guild. `Issue Bounty` scores highest (revenge ambition + cunning leader + named grievance target). Bounty is issued: 10 wealth on Jorin's head.

**The moment (initial chronicle, tier 3 because it's an NPC):**

> *A notice has been posted in the shadow-places of Blackharbor: the head of Caravan Master Jorin Blackharrow, wanted by the Thieves' Guild. The coin is generous. The eyes of those who look at him now are watchful.*

**The hunt encounter fires for two Guild members across three subsequent ticks. One fails at the hunt entirely (lost trail, gave up). The second tracks Jorin to the Saltspire road. The resolution rolls. Jorin has `guarded_by` edges to two of his caravan guards. The assassination attempt is partial success — Jorin lives but his guard Pell Ironwood dies shielding him.**

**The chronicle of the failed bounty (tier 2 — NPC death adjacent to active faction):**

> *The hunt ended badly for everyone. Jorin lives. The assassin fell to the caravan guard's sword. The caravan guard Pell Ironwood did not survive his own wound.*
>
> *The Merchant Consortium has not yet declared anything. But the notice of Pell's death has reached the Consul's chamber, and the Consul is known to remember names.*

**Player's internal response:** The player may not know any of these characters. The moment lands as texture — the world doing things to itself, failure creating forward pressure. If the player has a bonded agent in the Merchant Consortium, the Consul's memory becomes a thread they can investigate.

**Forward hook:** Bounty expires unfulfilled. Thieves' Guild treasury -12. Merchant Consortium sentiment toward Thieves' Guild drops to -0.6 (pushes toward the Declare Rivalry threshold). Pell's son (NPC agent with `related_to` edge) gains condition "bereaved." Jorin gains condition "hunted." The entire scene is durable graph state that primes the next faction action: the Merchant Consortium's next conclave will likely surface this grievance.

### Benchmark 4: The Alliance That Came Too Late (Propose Alliance — Bittersweet)

**Setup:** The Arcane Circle (post-Seeker rivalry declaration) and the Mages' Benevolent Fund — a small scholarly faction with overlapping membership and shared academic values — are being pushed together by the rising influence of the Seekers. Both factions have positive sentiment but have never formalized alliance. The Fund's leader, an elderly scholar named Hespid, has just one ambition left: `defensive_consolidation`.

**Trigger:** Both factions have positive sentiment > `ALLIANCE_SENTIMENT_THRESHOLD`. Ambitions align. Hespid's personality (cooperative + prudent) biases Propose Alliance heavily. The action fires.

**The moment (tier 2, because Kael is tier-1 adjacent and the Circle is in his portfolio):**

> *Scholar Hespid of the Mages' Benevolent Fund has proposed alliance with the Arcane Circle. The ceremony was brief — a room, a handshake, Voss signing the concordat in his careful scholar's hand while Hespid signed in a hand that trembled slightly from age.*
>
> *The two factions are now formally allied. Their members share access to the Circle's lower library. Their conclaves will invite the other's senior scholars as observers.*
>
> *Scholar Hespid is eighty-one. He did not look at the clock during the ceremony. But he did look at the window.*

**Player's internal response:** The player feels the bittersweet weight — an alliance formed too late to do much good. Hespid is dying. The Fund is aging. The Circle is fortifying against the Seekers by drawing a shield that is already failing. The gesture is dignified, and dignified gestures can be the most melancholy moments in a chronicle.

**Forward hook:** `relates_to(basis: alliance)` edge between Circle and Fund. Members gain shared encounter visibility. Hespid's age flag sets up a future faction leadership transition (post-Hespid-death, the Fund's next leader may renegotiate). Kael's possible future conclave appearance (if the Circle invites Fund scholars as observers, and a Fund scholar respects Kael) creates a narrative reserve — an alliance he didn't sign but that shapes his options.

### Content Quality Bar

**"Every faction action must make the player feel that institutions have personalities — and those personalities collide with human lives."**

A faction action chronicle entry that reads like a system log ("The Arcane Circle has declared rivalry with the Seekers.") fails the bar. A faction action that reads like a scene opening ("Voss's face has gone unreadable. The vote was three to two, with one abstention, and the motion carries.") passes it. The test: would this chronicle entry make the player stop, click the faction, and want to know what happens next?

Every conclave must produce at least one "dissenting" member whose dissent is named and tracked. Every excommunication must render the ex-member's walk out. Every bounty failure must produce at least one durable graph edge that threatens to cascade.

---

## Systemic Grounding: How the Engine Produces These Moments

*This section validates that each benchmark can be produced by existing or minimally-extended infrastructure, not just written as fiction.*

### What Already Exists (High Reuse)

| Infrastructure | Location | How It Serves Faction Agency |
|---------------|----------|------------------------------|
| **Faction nodes with wealth/ambition** | Worldgen faction seeding + `phaseFactionAmbitions` | Treasury, ambition state, and `member_of` edges already exist. Faction actions read these directly. |
| **Axiological profiles (leaders)** | `src/data/agent-axiological-profiles` + leader identification via rank | Leader personality bias on action selection maps directly to existing profile axes (courage/prudence, cooperation/independence, etc.). |
| **Sentiment edges (`relates_to`)** | Existing edge type with `sentiment` and `basis` fields | Rivalry/alliance are `relates_to` mutations. No new edge type needed. |
| **Group scene resolution (THR-28)** | Deep Social Scenes with leverage mechanic | Conclaves are group scenes with faction-scoped question state. Leverage tracks the debate. |
| **Encounter candidate injection** | `phaseAgentDecision` candidate pool | Quest, rivalry, bounty, and conclave encounters inject into agent decision via existing pipeline. |
| **Chronicle pipeline with tier routing** | Attention Tier Model (shipped) | Faction actions route to tier 1/2/3 based on whether bonded agents are involved. Existing mechanism. |
| **Divine intervention choices** | `generateInterventionChoices()` | Divine Edict uses the existing intervention system with conclave-specific `godVoice` templates. |
| **Graph operations for durable state** | `strategicGraphOps`, `applyWealthDelta`, edge CRUD | Bounty nodes, sponsor edges, hostile edges are all graph operations that already exist. |

### What Needs Building (Medium Effort)

| Gap | What's Needed | Size |
|-----|--------------|------|
| **`phaseFactionActions` orchestrator phase** | New phase at 6.652 after `phaseFactionAmbitions`. Iterates factions, scores eligible actions, executes winner. Specified in implementation plan. | M |
| **Action scoring with leader bias** | Scoring function combining ambition affinity + leader axiological bias + treasury/member gates + cooldowns. PRNG-seeded weighted selection. | M |
| **Conclave state on faction nodes** | `activeConclave: { question, participants, ticksRemaining, leverageState }` property. Multi-tick lifecycle handled by `phaseFactionActions` advancing state per tick. | M |
| **Faction action executor functions** | 6 executors (one per v1 action). Most are graph mutations + encounter seeding. Conclave is the complex one (uses THR-28 resolution). | L |
| **Faction action chronicle templates** | ~18 chronicle prose templates (6 actions × 3 variants: execution, success, failure). Authored content, parameterized by faction state. | M |
| **Conclave-participant selection logic** | Pick top-ranked faction members + agents with strong `respects`/`rivals_with` edges to the conclave question topic. Heuristic, deterministic. | S |
| **ActiveConclaveView UI component** | New component rendered in FactionSheet when `activeConclave` is set. Participants, question prose, ticks remaining, Divine Edict button. | M |

### How Each Benchmark Maps to Systems

**Benchmark 1 (The Conclave):**
- **"Voss has called a conclave"** — `phaseFactionActions` selects `Hold Conclave`. Creates `activeConclave` property on faction node. Conclave ticks advance in subsequent `phaseFactionActions` runs.
- **Participant selection** — query: top N ranked members + any member with `respects`/`hostile_to` edges to faction entities relevant to the conclave question. Deterministic heuristic + seeded PRNG tiebreak.
- **Maren's abstention** — resolution of conclave position uses agent axiological profile + edges. Maren has midpoint `loyalty_ambition`, high `honesty_cunning` (toward honest end), `respects` edge to Kael of strength 0.7, `member_of(Circle)` of duration 19 ticks. These inputs into the conclave resolution scoring produce a tiebreaking outcome (abstain), not a binary vote. The existing group scene resolution (THR-28) supports this through its leverage mechanic — Maren's position lands at leverage zero (neither side wins her).
- **Prose enrichment** — `{faction_name}`, `{conclave_question}`, `{dissenter_name}` placeholders feed from conclave state. Chronicle templates are authored; the data is systemic.
- **Divine Edict availability** — `generateInterventionChoices()` checks for active conclaves reachable to bonded agents. If Maren is bonded (even indirectly via Kael's bond strength spillover), the edict surfaces.

**Benchmark 2 (Lira's Excommunication):**
- **Target selection** — query: members who also belong to rival factions. Lira has `member_of(Circle)` AND `member_of(Seekers)`. After the conclave declares rivalry, both memberships flag her as a censure candidate.
- **"The eighth bell" prose** — chronicle template for excommunication parameterized by `{target_name}`, `{faction_name}`, `{target_home_description}`. Authored with variants for Mind/Star/Heart factions (scholarly, religious, sororal tones).
- **Graph mutations** — remove `member_of(Lira, Circle)`, create `hostile_to(Circle, Lira)`, apply reputation splash to Lira's other faction memberships per `EXCOMMUNICATION_REPUTATION_SPLASH` constant. All existing graph operations.
- **Condition application** — `applyCondition(Lira, 'cast_out', duration: 20)`. Condition's emotional weight reads in subsequent encounters as prose modifier.

**Benchmark 3 (The Bounty):**
- **Bounty issuance** — `createBountyNode({target: Jorin, reward: 10, issuer: ThievesGuild, expiry: tick+40})`. Faction treasury -12. Existing graph op pattern.
- **Hunter selection** — bounty node injects as encounter candidate for Thieves' Guild members at or near Jorin's location. Existing candidate injection mechanism.
- **Resolution with guard intervention** — hunt encounter fires. Jorin's `guarded_by` edges surface during encounter resolution. Roll: sigmoid-based, domain Shadow (assassin) vs. Iron (Pell). Partial success: assassin succeeds against Jorin but Pell intervenes, dies, and inflicts fatal wound on assassin. This is an existing pattern — multi-party encounter resolution with shields/protection checks.
- **Cascading consequences** — Pell's death triggers `applyCondition(PellSon, 'bereaved')`. Jorin's "hunted" condition persists. Merchant Consortium sentiment toward Thieves' Guild drops via existing sentiment delta on faction events. If sentiment crosses `RIVALRY_SENTIMENT_THRESHOLD`, the Consortium's next faction action evaluation will surface Declare Rivalry as the top-scoring action. No hardcoded escalation — the math does it.

**Benchmark 4 (The Alliance That Came Too Late):**
- **Alliance proposal trigger** — `phaseFactionActions` evaluates Mages' Benevolent Fund. Positive sentiment with Circle crosses `ALLIANCE_SENTIMENT_THRESHOLD`. Hespid's profile bias (cooperative + prudent) pushes Propose Alliance to top score.
- **"Hespid is eighty-one" prose** — enrichment draws from Hespid's agent properties: `age` (systemic), `personalityArchetype` ("elderly scholar"). The line about looking at the window is authored atmosphere in the alliance ceremony chronicle template, conditionally rendered when the proposing leader's age > 70.
- **Forward hook (Hespid's death flag)** — Hespid's age threshold primes the existing agent-death system. Post-Hespid death, a leadership transition event fires in the Fund. The new leader's personality may not favor the alliance. The alliance could dissolve — not as a designed quest, but as systemic consequence of a leader change.

### Systemic vs. Authored Content Ratio

| Layer | Systemic | Authored |
|-------|----------|----------|
| **Which faction acts when** | 100% — cooldowns, triggers, cadence | — |
| **Which action is chosen** | 95% — ambition + leader bias + state scoring | 5% — action template definitions |
| **Conclave participants** | 90% — rank + edge-based relevance | 10% — minimum participant count |
| **Conclave vote outcomes** | 80% — axiological profiles + THR-28 resolution | 20% — question-specific vote options |
| **What happens after action** | 70% — graph mutations + downstream condition/edge cascades | 30% — complication templates for failures |
| **What the player reads** | 10% — enrichment placeholders filled from graph state | 90% — prose templates are authored |

The system chooses which faction acts, what it does, who is affected, and the downstream cascade. Authors write how it reads. The prose is authored, but it's parameterized by systemic data — not hardcoded fiction about specific named factions.

---

## Open Questions (Flagged for Human Review)

1. **Sponsor Agent deferral confirmation.** The parent implementation plan treats Sponsor Agent as Tier 1. This addendum proposes deferring it to v1.5 because it lacks the ensemble/scene weight of the other six. Is this trim acceptable, or should Sponsor Agent stay in v1 and something else (Propose Alliance? Commission Quest?) defer instead?

2. **Conclave frequency tuning.** The implementation plan sets `CONCLAVE_TRIGGER_INTERVAL = 50`. For 11 factions across a 200-tick game, that's ~44 conclaves. Is that the right volume, or does the quality bar require fewer, more momentous conclaves (e.g., `CONCLAVE_TRIGGER_INTERVAL = 80` → ~28 per game)?

3. **Divine Edict bonded-agent requirement.** Should Divine Edict require a bonded agent to be a conclave *participant*, or is it sufficient for a bonded agent to be a *member* of the conclave's faction? The former is more restrictive and preserves scarcity; the latter is more flexible and creates more divine moments.

4. **Rivalry declaration authorship.** Rivalry declarations are dramatic events. Should the chronicle template for a rivalry declaration between two specific factions be authored per faction-pair (Circle-vs-Seekers gets bespoke prose), or should it be parameterized (any-rivalry-declaration uses a shared template with `{faction_a_description}` and `{faction_b_description}` enrichment)? The former is higher quality but requires per-pair authoring; the latter scales but risks genericism.

---

## Status

Quality gate addendum complete. Awaiting user sign-off before moving to Implementation Planning.

**Note to reviewer:** This addendum was produced during an autonomous Cowork session on 2026-04-18 following the explicit revision direction in the 2026-04-16 THR-29 quality gate comment. The six-action v1 trim mirrors the THR-51 approach. The benchmark moments are new and grounded in existing engine infrastructure per the systemic grounding section. This addendum does not override the implementation plan — it is a prerequisite artifact that the implementation plan must be audited against before THR-29 can move to Ready for Dev.

**Blocker note:** THR-29 depends on THR-51 for faction founding (the Seekers scenario in Benchmark 1 assumes Kael has founded via initiative). THR-51 is awaiting user sign-off on its own quality gate. THR-29 cannot move to Ready for Dev until both quality gates are approved and THR-51 ships.
