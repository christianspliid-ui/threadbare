# Secrets & Favors — Quality Gate Addendum

> **Date:** 2026-04-17
> **Issue:** THR-30 (TB-099 · Social Expansion E: Secrets & Favors — Information Economy v1)
> **Status:** Implementation Planning (needs quality gate pass before moving to Ready for Dev)
> **Parent design:** `Docs/plans/2026-04-14-secrets-and-favors-implementation.md`
> **Reference:** `Docs/plans/2026-04-16-design-quality-gate.md`, `Docs/plans/2026-04-16-game-design-direction.md`, `Docs/plans/2026-04-16-agent-initiatives-quality-gate.md` (template pattern)

---

## Why This Addendum Exists

The parent implementation plan (`2026-04-14-secrets-and-favors-implementation.md`) describes Secrets & Favors as a mechanical system: two new edge types, leverage multipliers, six discovery templates, three divine actions, a tension-drift phase, and a consequence function. It answers *what the engine does* but not *what the player experiences when the game plays itself*.

The issue was triaged and moved back from Ready for Dev with the feedback: **"Write 3–4 benchmark scenes focused on the *dramatic moments* — the reveal, the leverage play, the favor called. The mechanical integration is fine; the content design is what's missing."**

This addendum fills those gaps. It covers all 9 quality gate sections and ends with a Systemic Grounding section validating that the moments can actually be produced by the engine described in the parent plan.

### v1 Scope Anchor (from parent plan)

| Surface | Count | Purpose |
|---------|-------|---------|
| New edge types | 2 | `knows_secret_of`, `owes_favor` |
| Discovery templates | 6 | Confession Over Drinks, Quiet Observation, Spy Debrief, Overheard Argument, Drunken Confession, Intercepted Message |
| Secret types | 8 | hidden_allegiance, past_crime, forbidden_relationship, hidden_weakness, secret_ambition, financial_secret, divine_mark, betrayal_planned |
| Divine actions | 3 | Reveal Secret (10 essence), Call in Favor (8 essence), Plant Secret (14 essence) |
| Favor-generating encounters | 5–8 existing templates tagged | Rescue/heal/lend/vouch/cover-retreat/mentor |

Rumor propagation is explicitly deferred — we'll know if we need it once secrets exist and are used.

---

## Section 1: Player Experience Scenario

### The Golden Scenario — A Secret Found Unwanted

Kael Thornweaver, the player's First (Mind/Spirit Witness, Heart tier 5, Eye tier 4), has been bonded to Serafina Emberhold for eleven turns. Serafina is the player's *second* bonded agent — an Iron/Force Scar who founded the Seekers' sister-order, the Ashbound, to protect the Seekers from the Arcane Circle. The two agents trust each other. The player has watched them build that trust.

Turn 12. Kael is at the Weathered Oak on a quiet errand — he's there to meet an informant about a minor matter, the Circle's inventory of restricted texts. The encounter fires: *Quiet Observation*, a tier-2 Eye-reach template. Not curated — ambient. The player almost advances past it, then stops to read.

> *Kael is watching the door, waiting for his contact, when he sees Serafina across the common room. She doesn't see him — her back is to his corner. She's speaking to a figure in a travelling cloak. The cloak is dusted grey, not from the road, but from stone. Quarry stone. The kind only worked at one place within a hundred miles: the Old Forge, where the Arcane Circle sends the exiled to labor. Kael watches her take something small from the figure's hand and tuck it into her sleeve.*
>
> *The figure leaves. Serafina finishes her drink and does not look around.*
>
> *Kael does not move. He sits very still, because suddenly he knows something he did not want to know, and he cannot unknow it.*

The chronicle adds a new entry in the player's peripheral vision — a `knows_secret_of` edge has been created. Serafina's detail panel now shows, only to the player (Kael is bonded and saw it): **Hidden Allegiance — contact with an Old Forge exile (whispered).** Magnitude 0.4. Source: observation.

The player's internal response is instant: *Oh no. Oh no, what is she doing? Is she betraying us? Is she being blackmailed? Did I miss something?*

The system offers no explanation. The secret is just a fact now. The player must decide: confront her (through an encounter intervention — essence cost, may damage trust), watch (don't act, see if more information surfaces), or act on the suspicion in some other way (use the secret as leverage in a future scene, reveal it divinely, or plant a counter-narrative).

The player thinks: *I don't want to know this. I liked them being in each other's corner. I don't want to be the god who learned a thing and had to decide what to do with it.* But they have learned it, and now they must.

This is the design goal. Not "the system created a leverage point." The design goal is: **the player holds a burden of knowledge and must choose what to do with it.**

### The Mundane Scenario — Small Debts Accumulating

Pyra Ironhand, an NPC merchant at Millhaven (unbonded), saves Old Garren from a drunk fight in the tavern. The chronicle entry is one line, tier-3 ambient:

> *Garren was going to swing and someone was going to die. Pyra got between them with the easy confidence of a woman who's broken up worse. Garren sat down. Pyra paid for the spilled mead out of her own pocket.*

A `owes_favor` edge is created: Garren → Pyra, magnitude 0.3, context "covered a bad moment," grantedTick 12. The player doesn't see this edge unless they pull up Pyra's panel. It just happened. It's in the graph now.

Three turns later, Garren has a small debt he can't pay. Pyra offers to cover it. Favor magnitude increases to 0.5. The chronicle doesn't even mention it — it's subsumed into the ambient settlement activity.

Seven turns after that, a bonded agent passes through Millhaven needing information on a shipment schedule. Pyra is the best-connected merchant at the settlement. The encounter fires. Pyra hesitates — she wants to help, but the shipment she knows about involves Garren. If she names him, he'll be implicated. She's torn.

The player reads the encounter and thinks: *Why is she hesitating?* Then — if they bother to look — they see in her panel that Garren owes her. Maybe *she* owes *him* in some unspoken way now. The social fabric is thicker than they realized. A mundane favor from eleven turns ago is affecting the information they can get today.

The mundane case works because it's not dramatic — it's weather. Small favors accumulate in the graph, and when a curated moment finally pulls a thread, there's something on the other end.

### The Failure Scenario — The Favor That Breaks

Serafina is in crisis — the Ashbound needs a specific ritual component, and the only person who has one is Warden Hollis, a priest who owes her a life debt from when she pulled him out of a burning chapel eight turns ago (favor magnitude 0.7, "battle_debt").

The player, watching the clock, uses **Call in Favor** (8 essence). The divine action whispers to Hollis's sleeping mind: *remember what you owe.* Hollis meets Serafina the next day at the chapel.

The encounter fires. Serafina asks. Hollis — to everyone's surprise, including the player's — *refuses.*

> *"I owe you my life, Serafina. I know it. I know it every night when I dream of the smoke."*
>
> *He sets the reliquary on the altar between them. He does not push it toward her.*
>
> *"But what you're asking for — what you want to do with this — the thing sleeping in here wasn't sealed by accident. I can't be the hand that unseals it. Not even for you. Not even for my life."*
>
> *He waits, hands folded. He is not angry. He is not defiant. He is a man who has calculated a debt and found that it does not cover this particular purchase.*

The favor breaks. `owes_favor` edge: `broken: true`, `brokenTick: 20`. Massive trust penalty (-0.3). Serafina's sentiment toward Hollis drops. The reputation walk propagates: two agents who `trusts` Serafina learn that Hollis "refused a debt," and Serafina's name is now associated with having been refused — not a shameful thing exactly, but a thing.

And the player learns something about Hollis: he *has* a spine. And something about Serafina: she was willing to use leverage against a friend. And something about the Ashbound's ritual: it was a thing even a life-debt wouldn't buy.

Cool failure: *nobody gets what they wanted, and the world is more interesting for it.* The next time the player sees Hollis in the chronicle, they will think about this scene. The next time Serafina asks a favor, they will wonder how honest she's being. The design bar: the player must feel the failure *mattered* without feeling *punished.*

---

## Section 2: Emotional Architecture

### Emotional Read

Secrets and favors both live on the margins of the agent detail panel. They are *social furniture,* not status bars.

**Iconic (glanceable):**
- An agent's panel shows a "Leverage" section when something is present. A small key icon with a count means "secrets held." A small loop icon with a count means "favors owed to this agent." A chain-link icon means "this agent owes someone else." Colors are muted — ochre for favors, smoke-grey for secrets. No red. Nothing screams.
- Secret magnitude is *prose-encoded,* never numeric on the UI: "whispered gossip" (0.1–0.3), "damaging knowledge" (0.3–0.6), "devastating secret" (0.6–1.0).
- Favor magnitude is *prose-encoded* similarly: "small kindness," "meaningful aid," "life debt."

**Prose (textured):** Secrets discovered, revealed, and favors broken generate chronicle lines in Threadbare voice. The system never says "a secret has been discovered." It says: *Kael does not move. He sits very still, because suddenly he knows something he did not want to know.*

### Resonant Conditions

Secrets and favors produce or respond to these human conditions — the mechanical effect maps back to an emotion the player recognizes:

| Situation | Condition (on agent) | How It Reads |
|-----------|---------------------|--------------|
| Agent just discovered a secret | "burdened" | Prose shows the weight — the thing they cannot unknow |
| Agent holds a dangerous unrevealed secret | "armed" | They carry themselves differently — quieter, more watchful |
| Agent's secret was just revealed | "exposed" | The whole room knows; prose foregrounds shame or defiance |
| Agent owes a large unpaid favor | "indebted" | Agent avoids the creditor, or over-performs loyalty |
| Agent is owed a large unpaid favor | "holding a marker" | Agent speaks to the debtor with easy authority |
| Agent just broke a favor | "dishonored" | Shame-flavored condition; reputation walk propagates it |
| Agent was just refused when calling in a favor | "stung" / "disbelieving" | They counted on something that didn't hold |
| Agent is target of a planted false secret | "haunted" (hidden) | Everything works until someone investigates — then the world turns |

### Stakes Framing

Stakes are always framed in human terms, never mechanical.

Not: *"Secret magnitude 0.6. Revealing grants +0.18 leverage. Subject will gain hostile_to edge."*

But: *"If Kael uses what he saw at the tavern, he wins this negotiation — but he'll have to look Serafina in the eye afterwards and know he used her. And she may come to know he used her. Their trust, eleven turns in the making, becomes a thing that happened once."*

The encounter prose carries this weight. Divine action tooltips carry this weight. The UI never shows a raw number next to a social decision.

---

## Section 3: Choice and Dilemma Quality

### Dilemma Inventory

| Choice Point | Options | Tradeoffs | Why No Right Answer |
|-------------|---------|-----------|-------------------|
| **Secret learned by a bonded agent** (passive — no action needed) | Act on it / hold it / ask the agent about it via an encounter | Acting uses leverage now but consumes the knowledge. Holding preserves the option but the knowledge ages (secrets decay at the low end). Asking breaks the advantage but builds trust. | The knowledge is a burden either way — you *know* this now, and inaction is itself a choice. |
| **Reveal Secret** (divine action, 10 essence) | Reveal to nearest / withhold / find a different leverage | Revealing weaponizes the knowledge but damages the secret-keeper (usually a bonded agent). Withholding keeps the option but costs nothing to hold. | You're a god who might destroy a character's private life to win a scene — is the scene worth it? |
| **Call in Favor** (divine action, 8 essence) | Trigger redemption now / wait / let the agent choose organically | Forcing redemption might break the favor if the cost exceeds the debt. Waiting preserves it but the debt can expire. Letting the agent choose respects their autonomy. | The favor is a resource, but it's also a relationship — treating it like currency can destroy what it meant. |
| **Plant Secret** (divine action, 14 essence) | Plant on rival A / rival B / don't plant | False leverage works until investigated. Planting on the wrong target creates narrative contradictions the graph may resolve against the player. | You are lying *inside* the world. If the lie is uncovered, your own credibility (divine mark suspicion) becomes a narrative fact. |
| **Bonded agent is caught in a favor-call** (mid-encounter) | Intervene to help them pay / intervene to release them from the debt / observe | Intervening to help makes the agent more indebted *to you.* Releasing them costs essence but preserves their autonomy. Observing respects the world's agency but may cost the player an ally. | You can make the problem disappear, but the agent who solves their own debt grows; the agent whose debt you dissolve stays a child. |
| **Secret about a bonded agent comes to light without player choice** | React via intervention / watch the fallout / seek to control the narrative | The world revealed it; the player cannot undo that. But they can soften the fallout, aggravate it, or try to reframe it. | You didn't choose this moment — you're choosing your response to it. |

### Knowledge-Dependent Choices

Every secret/favor decision requires protagonist understanding:

- **Deciding to reveal a secret** depends on knowing what kind of person the subject is. A "proud" agent may be destroyed by a small reveal; a "pragmatic" one shrugs. The player must read the subject's personality and conditions to predict the impact.
- **Deciding when to call in a favor** depends on knowing what the debtor values. An agent whose ambition is "preserve family honor" will pay nearly any favor rather than break one publicly. An agent whose ambition is "survive at any cost" will break the favor if the cost of paying exceeds the reputation damage.
- **Deciding whether to plant a false secret** depends on knowing which targets are *investigable.* Planting on an agent whose rival has Eye tier 5 is a time bomb. Planting on an isolated agent with no curious allies is a durable weapon.

### Intervention Spectrum

| Engagement Level | What Happens |
|-----------------|-------------|
| **Auto-resolve (do nothing)** | Agents discover secrets through encounters. Favors accumulate from rescue/heal/lend outcomes. The `phaseSecretsFavors` runs its decay/tension/expiry passes. Social fabric builds in the background — most of it invisible to the player until a curated moment pulls a thread. NPCs use their own secrets and favors in their own negotiations. The world has information warfare whether or not the player participates. |
| **Minimal intervention** | Player reviews agent panels to see what secrets/favors their bonded agents hold. Occasionally uses Call in Favor at a genuinely useful moment. Never reveals secrets unless forced. Plays the long game, letting the social fabric thicken. |
| **Deep intervention** | Player actively cultivates information asymmetry — spending essence to reveal, plant, and redeem. Orchestrates cascades: plant a false secret, let a rival "discover" it, watch the rival act on it and damage themselves. This is late-game mastery. |

**Doing nothing is still interesting:** NPCs discover their own secrets and call in their own favors. The player may learn that their bonded agent was *just revealed* in someone else's encounter — without ever having touched the secret system themselves. The economy runs without them.

### Agency vs Living World

The world pushes back through:
- **Unpredictable discoveries.** The player can't target what their agent learns — Eye encounters surface whatever the graph has, not what the player wants.
- **Refusal to redeem.** An agent may refuse to pay a favor if the cost exceeds their calculated debt (failure scenario above). The player can force the *attempt* via divine action, but not the outcome.
- **Counter-discovery.** Other agents have Eye capability too. A secret the player's agent holds may be independently discovered by a rival — multiple agents can hold the same `knows_secret_of` edge, and rival reveals surprise the player.
- **False-secret backfire.** Planted secrets can be investigated. If investigation exposes the planting, the target accumulates a `hidden_mark: suspected_divine_interference` trace that rival gods (in future milestones) may exploit.
- **Secret decay.** Low-magnitude secrets fade after `SECRET_MAX_AGE_TICKS`. The player cannot hoard minor leverage indefinitely.
- **Favor tension drift.** Unpaid favors drag sentiment on the `relates_to` edge between debtor and creditor. Holding a favor too long damages the relationship that created it.

---

## Section 4: System Connections and Emergence

### Connection Map

| System | Direction | Interaction |
|--------|-----------|-------------|
| Graph (edge types) | Writes | `knows_secret_of` and `owes_favor` are new edge types on existing nodes |
| `socialLeverage.ts` (THR-28) | Reads + Writes | Secrets/favors feed `computeInitialLeverage()`. Revelation/redemption fire as encounter step effects modifying leverage. |
| Encounter pipeline | Reads + Writes | 6 new discovery templates seed secrets into the graph. 5–8 existing assistance templates now emit `owes_favor` edges on success. |
| Tavern Hubs (THR-27) | Reads | Confession Over Drinks, Overheard Argument, Drunken Confession fire specifically at tavern sublocations |
| Spy Network (THR-51 Establish Spy Network) | Reads | Spy Debrief template reads information edges accumulated by spy networks and converts them to `knows_secret_of` edges for the spymaster |
| Faction Agency (THR-29) | Reads + Writes | `hidden_allegiance` secret revealed to faction leadership triggers excommunication candidate |
| Divine intervention | Reads + Writes | 3 divine actions (Reveal, Call in Favor, Plant) produce and consume secret/favor edges |
| Reputation walk | Writes | Secret revelation and favor breaking propagate sentiment changes across the trust graph |
| Prose pipeline | Writes | New enrichment placeholders: `{secret:held_about}`, `{favor:owed_by}`, `{secret:magnitude_prose}`, `{favor:context}` |
| Cool failure (THR-20) | Reads + Writes | Broken favors and backfired plants can emit complications via the complication taxonomy |
| Attention tier | Writes | Discovery encounters are tier 2 if bonded agent involved; revelation encounters are tier 1 (always surface); favor creation is tier 3 (ambient) |
| Hidden marks | Writes | Planted false secrets write `hidden_mark: planted_by_divine` on targets, discoverable by Investigate encounters |
| Debug panel | Reads | Edge inspection lists `knows_secret_of` / `owes_favor` with full properties |

### Emergent Possibilities

1. **The Information Cascade.** Agent A plants a false secret on rival B claiming B has an affair with C's spouse. B believes it. B confronts C. C's spouse denies it (truthfully). C investigates, discovers the false secret, traces it back to agent A (through social encounters that test plausibility). Now C has a real grievance against A — one the player created out of nothing. None of the steps are scripted; they emerge from the combination of plant → leverage → investigation → reputation.

2. **The Mundane Secret That Mattered.** A bonded agent learns, via passive observation at a tavern, that a minor NPC quartermaster is skimming faction funds (financial_secret, magnitude 0.3 — "damaging knowledge"). The player ignores it; it looks unimportant. Forty turns later, the faction is preparing for war and that same quartermaster is assigning supplies. The player remembers the secret. A single revelation shifts the entire supply economy before battle. The emergence: **small secrets held over long time horizons produce leverage the scripted system couldn't have anticipated.**

3. **Favor as Faction Infrastructure.** The player's First founds a faction (THR-51). Over twenty turns, the First rescues, heals, and lends to twelve agents across three settlements. Twelve `owes_favor` edges now point at the First. When a faction crisis hits, the First has a network of social credit ready — not because the player micromanaged it, but because the First's axiological profile made them naturally generous, and the graph accumulated the consequences. The player can call in the network all at once (at a cost). The emergence: **personality-driven agent actions build strategic resources over time.**

4. **The Refused Favor That Revealed Character.** A bonded agent tries to call in a favor and is refused (failure scenario). The refusal generates a chronicle entry that subtly reveals the debtor's character — "a man who calculated a debt and found it did not cover this particular purchase." The player learns something about that NPC they couldn't have learned through scripted dialogue — because the refusal was a resolution outcome, not a written scene.

5. **The Secret Revealed by the Wrong Person.** A rival NPC discovers the same secret the player's agent holds (two `knows_secret_of` edges, same subject). The NPC reveals it first, in their own encounter, for their own reasons. The player's leverage is now gone — consumed by someone else's play. The emergence: **the player is not the only information warrior in the world.**

### Missed Connections (Deferred)

- **Rumor propagation layer.** Explicitly deferred in parent plan. Secrets currently belong to the discoverer only; they can be revealed to one other agent. A rumor system would let secrets spread organically through the social graph. Revisit once the system is live and we see whether rumor would add or clutter.
- **Secret trading as explicit encounter.** Currently secrets move only via revelation. A "trade secret for secret" encounter type would create information-market dynamics but is not needed for v1 — bilateral confession in drunken-confession templates already approximates this.
- **Divine mark as narrative fact.** When the player uses Reveal Secret, the revealer gains a subtle `divine_mark` (already implied in the SecretType enum). The full narrative consequences of divine marks accumulating are designed separately in the Doom/Omen milestone. This system *emits* marks; the Doom system *reads* them.
- **Favor chains.** "A owes B, B owes C" — no transitive semantics in v1. Favors are bilateral. Transitive/chained favors would be a dedicated future feature.
- **Written agreements as formalized favors.** The existing `agreement` attachment with `type: 'favour'` can represent formalized pacts. Parent plan notes this; we treat `owes_favor` edges as lighter-weight informal debts. A bridge (promoting a large `owes_favor` into a formal agreement on oath/ceremony encounters) is a future extension.

### Turn-Pace Compatibility

**Quick turn:** Secrets and favors are almost entirely invisible on a fast scan. The player sees a small marker on an agent's portrait if a bonded agent holds a new secret (icon + tier-2 chronicle entry) — and can choose to stop or keep scrolling. Mundane favor creation is tier-3: never interrupts.

**Deep turn:** The player inspects agent panels to see the leverage section. They plan a Reveal Secret divine action, mousing over it to read the tooltip prose. They examine their bonded agent's favors-held list to decide which to redeem. This is textured, slow play — matching the beat 3 (Aftermath) portfolio management moment.

---

## Section 5: Design Alternatives

### Alternative A: Single Unified "Social Capital" Scalar

Secrets and favors collapse into one abstract value — social_capital — on each `relates_to` edge. When agent A has high social capital with B, A gets leverage bonuses.

**Gains:** Simpler. Fewer edge types. Less UI surface.
**Loses:** Secrets and favors feel entirely different in play. A secret is *fragile* (one reveal consumes it), *asymmetric* (only the holder has leverage), and *dark* (weapon-like). A favor is *exchange-shaped* (paid or broken), *mutual* (the debt is remembered by both), and *bright* (gratitude-like). Collapsing them erases the emotional distinction.
**Why rejected:** The quality gate asks for *resonant conditions.* "Armed with a secret" and "holding a favor" are different emotional states. Collapsing them produces accurate mechanics and flat fiction.

### Alternative B: Secrets-Only v1 (Defer Favors)

Ship `knows_secret_of` alone. Defer `owes_favor` to a later milestone.

**Gains:** Smaller implementation. Faster to ship. Easier to tune.
**Loses:** The two halves balance each other. Secrets are dark leverage; favors are bright leverage. A game with only dark leverage tilts toward paranoia. The mundane scenario (festival-scale favor accumulation as settlement weather) is exactly the tissue we want the social layer to have — and it's *favors* that produce it, not secrets.
**Why rejected:** Secrets alone make the social layer feel threatening without warm. The two mechanics are not a pair of similar things — they're a pair of opposed things, and opposing them is the design. Ship them together.

### Alternative C: Favors as Attachments, Secrets as Edges

Favors live on the `agreement` attachment system (already has `type: 'favour'`). Secrets are edges. Both systems exist but are modeled differently.

**Gains:** Reuses more existing code. Favors gain all attachment lifecycle machinery (expiry, strengthening, etc.) for free.
**Loses:** Attachments are node-local. You can't walk "who owes me favors?" without scanning every agent in the graph. The load-bearing architectural decision says *meaningful relationships must be graph edges, never property bags.* A favor is literally a relationship between two named agents. It belongs on the edge.
**Why rejected:** Violates the "relationships are edges" principle. The parent plan correctly identified Option A (edge) as load-bearing. We leave the `agreement` attachment for *formalized pacts* (treaties, oaths, written contracts) — ceremonial objects — and keep lightweight interpersonal debt as edges.

### Inspiration

- **Disco Elysium:** Information-as-leverage, learned by paying attention. The joy is not having information — it's holding it and deciding when to deploy it. The game punishes premature revelation. We want the same texture.
- **Crusader Kings III:** Secrets mechanic. A court of characters carrying leverage over each other. Revealing too early is wasteful; holding too long risks the secret becoming useless. Our model is lighter (no blackmail hooks yet) but draws from the same emotional register.
- **Dishonored 1-2 chaos system:** The world remembers small cruelties and kindnesses. We want `met_at` + `owes_favor` to function as the game's long-memory of choices.
- **The Count of Monte Cristo:** The canonical fiction about a debt held so long it becomes a life's work. Favors in this game should feel like they could become Monte Cristo — not immediately cashed, not forgotten, held for the right moment.
- **Malazan (Deadhouse Gates, Memories of Ice):** Characters carry debts and secrets forward across decades. The books' weight comes largely from "X remembers Y's betrayal from five hundred pages ago." We aim for a compressed version of the same memory.

---

## Section 6: UI and Presentation Vision

### First Impression

The player discovers the system through **a moment, not a tutorial.** The first secret-discovery encounter that fires involving their bonded agent is the introduction. A tier-2 chronicle entry appears. The agent panel gains a "Leverage" section with one entry. No popup explains it. The prose and the icon together communicate the meaning.

The first time the player sees a Reveal Secret divine action in the action drawer, it will be *because a bonded agent holds a secret* — the action is contextually gated. The tooltip prose explains what the action does in the agent's voice, not in system terms.

### Visual Hierarchy

1. **Chronicle entry (primary).** Secret discoveries and revelations are the narrative events. They lead.
2. **Agent panel "Leverage" section (secondary).** Quiet, muted, always-available inventory. Never a popup; always a place you can look.
3. **Encounter UI leverage source list (inline).** During a social scene, the leverage breakdown lists secrets/favors as sources. Tooltip prose, not numbers.
4. **Divine action cards (interactive).** Contextually gated. Reveal Secret only appears when a target holds a secret; Call in Favor only when the target owes the bonded agent.
5. **Debug panel (developer).** Full edge inspection.

### Component Vision

Reuses existing primitives:
- **`StatusLine`** for secrets/favors on agent panel (e.g., "Holds a whispered gossip about Voss" | "Owes Pyra a small kindness").
- **`ChronicleEntry`** for tier-2 and tier-1 events. No new component.
- **`ActionCard`** for the 3 divine actions. No new component.
- **`EncounterStep`** already supports custom step effects; secret-revelation and favor-redemption are new effect types but existing UI.

**One small new primitive:** `LeverageBadge` — a small inline pill showing "+ whispered gossip" or "+ life debt" inline with an encounter's leverage breakdown. Uses the prose magnitude descriptor, never the number.

### Prose Integration

The prose pipeline does most of the narrative work. New enrichment placeholders:

| Placeholder | Resolves To | Example |
|-------------|-------------|---------|
| `{secret:magnitude_prose}` | Prose descriptor of magnitude | "whispered gossip" / "damaging knowledge" / "devastating secret" |
| `{secret:type_prose}` | Human-readable secret type | "hidden allegiance" / "past crime" / "forbidden relationship" |
| `{secret:source_prose}` | How it was discovered | "overheard at the tavern" / "pieced together from fragments" |
| `{favor:context}` | Original context of debt | "for pulling you out of the burning chapel" |
| `{favor:magnitude_prose}` | Prose descriptor of magnitude | "small kindness" / "meaningful aid" / "life debt" |
| `{?knows_secret_about}...{/knows_secret_about}` | Conditional block — prose only if the actor holds a secret about the target | "The words catch in your throat. You know what she did at the Old Forge." |
| `{?owes_favor_to_target}...{/owes_favor_to_target}` | Conditional block — prose only if the actor owes the target a favor | "You remember, very clearly, what he did for you." |

Prose carries the narrative. UI carries the status. A player reading the chronicle should understand *what is happening* from the prose alone; a player glancing at the panel should understand *where they stand.*

---

## Section 7: Depth Progression

### Newcomer

A new player never needs to know the system exists. Secrets and favors emerge from their bonded agents' behavior. They read a chronicle entry: *"Kael does not move. He sits very still, because suddenly he knows something he did not want to know."* They feel the weight. They see a new icon appear on Kael's portrait. They inspect and read the prose magnitude descriptor. They understand by context.

If they ignore the system entirely — never use a divine action, never consult an agent panel — the system still runs. Secrets decay. Favors create tension. NPCs reveal things to each other. The world is populated with information warfare that the new player simply watches.

### Expert

An experienced player learns the leverage math implicitly: "high-magnitude secrets are rare; use them in high-stakes encounters." They start planning Reveal Secret deployments to coincide with faction-critical social scenes (THR-29 excommunication hearings). They track favor accumulation on their bonded agents and recognize that a generous First builds a long-game social capital network. They learn that planted secrets work — until they don't — and they calibrate plant targets accordingly.

### Mastery

A master player orchestrates the full information economy. They cultivate a bonded agent toward Eye-dominance so that the agent organically discovers more secrets. They use the spy network initiative (THR-51) to seed Spy Debrief encounters that grant secrets about rival faction leadership. They plant false secrets on adversaries and wait for the investigation to misfire — sometimes for ten or fifteen turns. They hold a devastating secret across an entire narrative arc, waiting for the moment its revelation costs the antagonist everything. They weaponize information over a long horizon.

The mastery ceiling is the emergent layer: knowing when *not* to act. A player who never wastes a secret and never breaks a favor plays the social layer as a long-game instrument. A player who burns every piece of leverage immediately plays the same mechanics as a short-game blunt tool. The difference is hundreds of turns of portfolio thinking.

---

## Section 8: Value Justification

### Core Loop Service

**Primary: Beat 3 (Aftermath).** Secrets and favors are the memory the world has of previous beats. They accumulate during Beat 2 (Curated Moments) and surface during Beat 3 when the player reviews what's changed. They are the mechanical form of "the world remembers."

**Secondary: Beat 1 (Portfolio Scan).** A tier-2 secret-discovery entry can pull the player out of quick-scan mode into a moment of reading. The entry functions as a hook — "what will Kael do with this knowledge?"

**Tertiary: Beat 2 (Curated Moment).** Secrets revealed and favors called become curated encounters. They elevate what would have been a routine social scene into a dramatic one because the leverage changes what's on the table.

### Standalone Value

Yes — clearly. A player watching a bonded agent quietly accumulate secrets and favors, then deploy them at a pivotal moment, is watching the promise "the world has history and history has weight" become mechanically true. Without secrets and favors, social encounters remain symmetric: every negotiation starts from zero. The layer that secrets and favors add is **persistent asymmetric social capital** — which is *the* missing texture in the social pillar.

### Opportunity Cost

Two to three CC sessions of implementation (per parent plan) mean not doing: second-pass encounter migration audit, further hex vignette polish, more THR-20 complication authoring. The tradeoff is worthwhile because: the social layer currently has no memory. Every social encounter is new. The absence of persistent social state is the most-felt gap in current play. Fixing it is high-leverage (pun intended).

---

## Section 9: Content Benchmark Moments

### Benchmark 1 — The Discovery (Golden)

**Setup:** Kael Thornweaver, Heart 5, Eye 4, bonded to the player. He is at the Weathered Oak on a minor errand — waiting for an informant about the Arcane Circle's restricted texts inventory. Serafina Emberhold, also bonded, is his closest ally — she founded the Ashbound to protect Kael's Seekers. The two agents have a `trusts` edge with sentiment 0.82, eleven turns in the making. The player has actively built their friendship.

**Trigger:** A `Quiet Observation` encounter (Eye-reach, tier 2) fires for Kael at the tavern sublocation. The encounter's logic runs: scan other agents present at this sublocation, roll for observation by each — Eye capability vs target's presence score. Serafina is present. She's meeting someone the player hasn't seen before: a cloaked figure who matches (via axiological scoring) the profile of an Old Forge exile. Kael's Eye 4 passes the observation check.

`secretGeneration.ts` runs. Serafina has a `member_of` edge to the Ashbound (public) and a new `acquainted_with` edge to an Old Forge-linked NPC (just formed). The conflict between "Ashbound protects the Seekers" and "Old Forge is Arcane Circle exile territory" scores `hidden_allegiance` as the most plausible secret type. Magnitude rolls at 0.4 (moderate — observation-sourced, not confession-sourced).

A `knows_secret_of(Kael → Serafina)` edge is created: `{ secretType: 'hidden_allegiance', magnitude: 0.4, discoveredTick: 12, source: 'observation', revealed: false }`.

**The moment (chronicle entry, tier 2):**

> *Kael is watching the door, waiting for his contact, when he sees Serafina across the common room. She doesn't see him — her back is to his corner. She's speaking to a figure in a travelling cloak. The cloak is dusted grey, not from the road, but from stone. Quarry stone. The kind only worked at one place within a hundred miles: the Old Forge, where the Arcane Circle sends the exiled to labor.*
>
> *Kael watches her take something small from the figure's hand and tuck it into her sleeve.*
>
> *The figure leaves. Serafina finishes her drink and does not look around.*
>
> *Kael does not move. He sits very still, because suddenly he knows something he did not want to know, and he cannot unknow it.*

**Player's internal response:** *Oh no. What is she doing? Is she betraying us? Is there a reason? Do I ask? Do I hold this?* The prose never names the secret. The player builds it in their head from the fragments Kael observed. The fact that the player must *interpret* what Kael saw — not read "hidden_allegiance_secret_discovered" — is the design working.

**Forward hook:** Kael now holds a secret of magnitude 0.4 about Serafina. Three immediate choice threads open:
1. Do nothing — observe whether more surfaces.
2. Seek a Confession Over Drinks encounter with Serafina (costs time; might consume the secret or might deepen trust).
3. Save the leverage for a future encounter where Kael needs an edge over Serafina (unlikely, unless the faction paths diverge).

The player has not chosen anything yet — they just hold the burden. That is the beat.

**Emotional condition:** Kael gains the "burdened" condition, visible on his panel. Serafina gains nothing — she does not know she has been observed.

### Benchmark 2 — The Mundane Favor (Common Case)

**Setup:** Pyra Ironhand, unbonded NPC merchant at Millhaven (Gold 4, Heart 3). Old Garren, unbonded NPC farmer at Millhaven (Iron 2, Heart 2). The player has never interacted with either. Millhaven appears in the player's peripheral vision as "a settlement where things happen."

**Trigger:** An assistance-tagged encounter fires — Garren is in a tavern brawl; Pyra intervenes. The encounter template has `favorGeneration: { onSuccess: true, magnitudeRange: [0.2, 0.4], context: "covered a bad moment" }`. On success, an `owes_favor(Garren → Pyra)` edge is created with magnitude 0.3.

**The moment (chronicle entry, tier 3 — ambient):**

> *Garren was going to swing and someone was going to die. Pyra got between them with the easy confidence of a woman who's broken up worse. Garren sat down. Pyra paid for the spilled mead out of her own pocket. Nobody said anything about it afterwards. That was the point.*

**Player's internal response:** The player almost certainly scrolls past this. That is correct. It registers peripherally as "Millhaven is a place where people do small kindnesses." The specific favor is filed away in the graph, not the player's head.

**Forward hook:** Weeks (tens of turns) later, when a bonded agent passes through Millhaven needing information, Pyra will hesitate in an encounter — because she holds a favor-creditor relationship with Garren, and the information in question implicates him. The player may or may not ever trace this back to the mundane line from turn 12. It doesn't matter whether they do. The social fabric being thicker than the player can track is the design.

**Emotional condition:** Pyra gains nothing notable. Garren gains "indebted" (low magnitude — the condition barely registers, but it tints his future behavior toward Pyra: slightly more cooperative, slightly more avoidant).

**Why this benchmark matters:** 80% of `owes_favor` edges will be created by moments like this, not by dramatic life debts. If the mundane case is bland filler between dramatic peaks, the system feels hollow. The test: does the one-line chronicle entry earn its tick? The answer must be yes — even at ambient tier, the prose should have a small rhyme: "Nobody said anything about it afterwards. That was the point." A flavor of voice, a small observation. Not "Pyra has created a favor edge with magnitude 0.3."

### Benchmark 3 — The Reveal (Cool Dilemma)

**Setup:** Kael Thornweaver holds the secret from Benchmark 1 (Serafina's Old Forge contact, magnitude 0.4, unrevealed). Six turns have passed. Kael's Seekers faction is in a curated negotiation encounter with the Arcane Circle's Scholar-Warden Voss (from THR-51 Benchmark 4). The stakes: the Circle will either permit the Seekers to operate openly (a meaningful recognition) or declare them proscribed (a major escalation).

The encounter's leverage score is running low. Kael's Heart 5 is strong, but Voss is Heart 4 with factional authority, and the encounter's difficulty modifier is high. The current leverage breakdown shows Kael at -0.12 going into the final step.

**Trigger:** The encounter template includes a "Reveal Secret" branching step that becomes available when the actor holds an unrevealed `knows_secret_of` edge about *anyone present or relevant.* Serafina is not at this encounter, but she is relevant (she runs the Ashbound, which Voss would happily weaken). The step becomes available.

Separately, the player has the **Reveal Secret** divine action available (10 essence), which can force-fire the revelation even if the encounter doesn't naturally offer it.

The encounter prose makes the option visible — not via a button labeled "Reveal Secret," but via a diegetic line:

> *Voss folds his hands on the table. He is waiting. He has the easy posture of a man who has already decided how this ends.*
>
> *Kael thinks about what he saw at the Weathered Oak. He thinks about Serafina, and the Old Forge, and what Voss would do with that knowledge.*
>
> *The words are in his throat. He has not spoken them.*

Three choice lines appear (god-choices, not Kael-choices):

- **Whisper the weight of silence** (2 essence) — reinforce Kael's natural Heart approach; he argues without using the secret. Outcome follows standard resolution. May lose.
- **Loosen his tongue** (10 essence — Reveal Secret divine action) — Kael uses the knowledge. Leverage bonus of `0.4 × SECRET_REVELATION_LEVERAGE_BONUS` — very likely wins the encounter. But: the `knows_secret_of` edge is marked `revealed: true, revealedTo: Voss, revealedTick: 18`. Trust between Kael and Serafina drops by `SECRET_REVELATION_TRUST_PENALTY`. Voss gains a `hostile_to(Voss → Serafina)` edge. If Serafina ever learns Kael revealed it, her `trusts(Serafina → Kael)` edge receives a severe penalty.
- **Let him decide** (free) — Kael's personality resolves. His Heart profile is "reluctant-to-weaponize" — he will likely *not* reveal. Outcome: standard resolution roll, same as the first option but more in-character.

**The moment (if the player chooses Loosen his tongue):**

> *"Scholar-Warden," Kael says quietly. "Before we end this — I want to ask you a question. About the Old Forge."*
>
> *Voss does not move, but the air in the room changes.*
>
> *"The exiles there. Who they meet. Who meets them." Kael holds Voss's eyes. "I wondered if you knew that one of your peers in the reform wing had taken an interest."*
>
> *A silence. Voss studies Kael's face, then the table, then the ceiling, then his hands. When he looks up again, the easy posture is gone.*
>
> *"Name," Voss says.*
>
> *Kael does not name Serafina. He doesn't have to. Voss will ask the Circle's Eye-sworn tonight, and by tomorrow the name will be his.*
>
> *"I think we can come to an arrangement about the Seekers," Voss says.*

**Player's internal response:** *I won the negotiation. I also just set the Arcane Circle on Serafina's trail. She doesn't know I know. She doesn't know I told. And Kael just learned how to weigh a friend's safety against a faction's survival.* The player feels the victory and the cost simultaneously. This is the target.

**Forward hook:** The Seekers gain recognition (a large faction-influence gain). Serafina gains a `pursued_by(Voss → Serafina)` edge — the Circle will begin targeting her within a few turns. Kael gains the "compromised" condition (not an official condition name yet — authored for this scene): "He won by spending something he did not own. He will think about this for many turns." If Serafina eventually discovers, their trust edge is near-destroyed.

**Emotional condition mapping:** Kael "compromised" → the player's future interactions with him carry the weight of this choice. Serafina now `pursued_by` Voss → her future encounters carry threat. Voss "alerted" → his faction actions shift toward investigation.

### Benchmark 4 — The Favor Called At The Worst Time (Hidden / Discovery)

**Setup:** Warden Hollis, an NPC priest at a chapel near the player's primary settlement. He was rescued by Serafina eight turns ago — she pulled him from a burning sanctuary during a faction raid. An `owes_favor(Hollis → Serafina)` edge exists: magnitude 0.7, context "pulled me from the fire," grantedTick 12. The player has not thought about Hollis in a long time. He's a background NPC.

Serafina needs a ritual reliquary from Hollis's chapel for the Ashbound's next action. The ritual in question is morally grey — not outright dark, but the reliquary itself seals something the chapel was founded to contain. The player, watching the clock, uses **Call in Favor** (8 essence) on Hollis.

**Trigger:** The divine action whispers to Hollis's sleeping mind: *remember what you owe.* His next tick's ambition evaluation weights the debt heavily. An encounter fires: Serafina meets Hollis at the chapel. The encounter template has a `favor_redemption` step. Resolution runs: Hollis evaluates the cost of honoring the debt (giving up the reliquary — his chapel's core duty) versus the cost of breaking it (trust loss, reputation damage, personal shame).

Normally `favor_redemption` succeeds automatically. But the encounter template has an edge case: when the *content of the favor ask* exceeds the debt's magnitude by more than `FAVOR_BREAKING_THRESHOLD`, the debtor may refuse. Hollis's axiological profile is "duty above self." The ritual would unseal something his chapel exists to keep sealed. The refusal check fires and passes.

**The moment (encounter prose):**

> *Hollis has already laid out the reliquary on the altar when Serafina enters. He has been expecting her. He has been expecting her for eight turns.*
>
> *"I owe you my life, Serafina. I know it. I know it every night when I dream of the smoke."*
>
> *He sets the reliquary between them but does not push it toward her.*
>
> *"But what you're asking for — what you want to do with this — the thing sleeping in here wasn't sealed by accident. I can't be the hand that unseals it. Not even for you. Not even for my life."*
>
> *He waits, hands folded on his lap, very still. He is not angry. He is not defiant. He is a man who has calculated a debt and found that it does not cover this particular purchase.*
>
> *Serafina looks at the reliquary. She looks at him. She is not used to no.*

**The god's choices** (all delivered in the action drawer's divine-voice tooltip, not as buttons):

- **Lean harder on the debt** (Call in Favor again, 8 essence) — the divine action fires a second time. If it succeeds, Hollis breaks. The `owes_favor` edge is marked `broken: true`. Trust devastated. Reputation walk propagates: "Hollis refused a life debt" enters the social graph as a fact. Serafina gets the reliquary *and* a new enemy in the chapel network.
- **Shift her argument** (Whisper inspiration, 3 essence) — reframe the ask; Serafina promises Hollis something that bridges the gap (a promise to return the reliquary after; an oath on the Ashbound's founding). Resolution rerun with favorable modifiers. May succeed.
- **Let it stand** (free) — Serafina accepts the refusal. The favor remains on the books, unredeemed. She walks away without the reliquary. The Ashbound will have to find another path.

**If the player chooses Let it stand:**

> *Serafina is silent for a long time.*
>
> *Then she picks up the reliquary, looks at it — feels its weight — and sets it back in Hollis's hands. "Keep it," she says. "I'm sorry I asked."*
>
> *She leaves the chapel. Outside, she does not go back the way she came. She walks the long way around the sanctuary wall, the one that faces the river, and she watches the water for a while. When she returns to the Ashbound's hall, she tells them there is no ritual tonight.*

**Player's internal response:** *I didn't get the thing. But Serafina walked away with her honor, and Hollis walked away with his. And the favor is still there — I can't use it again, not really, but it's still there, and maybe it means something different now.* The player feels: a choice not to break someone. A small win that looks like a loss. The game rewarded restraint — not mechanically (the Ashbound still needs the reliquary) but narratively. The `owes_favor` edge remains with a new property: `acknowledged_insufficient: true`. The next time Hollis and Serafina meet, their trust edge will have strengthened slightly, not weakened — *because the debt was offered and respectfully withdrawn.*

**If the player chooses Lean harder (the failure-to-force path):**

The refusal prose from above plays fully. `owes_favor` → `broken: true`. Serafina gains the "outmaneuvered" / "humbled" condition from THR-51's mapping. Hollis gains "haunted" — he kept his duty, but the weight is on him. The chapel network remembers. When Serafina next seeks aid from a cleric, the encounter difficulty is modified by the reputation walk.

**Emotional condition mapping (per choice):**

| Player Choice | Serafina's Condition | Hollis's Condition | Ambient Consequence |
|--------------|---------------------|--------------------|--------------------|
| Lean harder (succeeds) | "ruthless" | "broken" | Chapel network shifts hostile |
| Lean harder (refused, favor breaks) | "outmaneuvered" | "haunted" | Reputation walk: "refused a life debt" |
| Shift her argument | "resourceful" | "grateful" | Both agents' trust strengthens |
| Let it stand | "honorable" | "relieved" | Small trust growth; debt acknowledged |

### Content Quality Bar

**"Every secret and every favor must make the player feel that characters carry things — that knowledge has weight, that kindness accumulates, and that the world remembers."**

A secret discovery that reads "A new secret has been discovered by Kael about Serafina" fails the bar. A secret discovery that reads "Kael does not move. He sits very still, because suddenly he knows something he did not want to know" passes it.

A favor call that reads "The favor has been redeemed" fails the bar. A favor call that reads "He is a man who has calculated a debt and found that it does not cover this particular purchase" passes it.

The test for content authors: *would this chronicle entry make the player stop scrolling?* If the answer is "probably not, and that's fine because it's tier-3 ambient," then the entry should still have a small flavor — a rhyme of voice, a dry observation, an image that earns the two seconds it takes to read. If the answer is "yes, this should stop them," the entry must deliver something they can feel.

---

## Systemic Grounding: How the Engine Produces These Moments

*This section validates that the four benchmark moments are producible by the parent plan's engineering — not merely written as fiction.*

### What Already Exists (High Reuse)

| Infrastructure | Location | How It Serves Secrets & Favors |
|---------------|----------|------------------------------|
| **Graph edge system** | `src/engine/graph.ts`, `src/types/graph.ts` | Supports arbitrary new edge types with property bags. `knows_secret_of` and `owes_favor` slot in naturally. |
| **Social leverage (THR-28)** | `src/engine/socialLeverage.ts` | `computeInitialLeverage()` already supports multiple source contributions. Adding secret/favor bonuses is a few lines per source with leverageHistory trace entries. |
| **Encounter template system** | `src/data/*-encounter-content.ts`, `src/types/encounter.ts` | Supports new templates with no schema change. 6 new templates for discovery, 5–8 tags on existing templates for favor generation. |
| **Encounter step effects** | Existing step effect handlers | Adding `reveal_secret` and `redeem_favor` as step effect types is an additive change. |
| **Resolution system** | `src/types/resolution.ts` (sigmoid → d100) | Observation rolls (Eye vs presence), confession rolls (Heart vs guardedness), and refusal rolls (duty score vs debt magnitude) all use the existing resolver. |
| **Divine action system** | Action template registry | 3 new action templates with target filters (`hasKnownSecrets`, `hasFavorsOwedToHero`). No new framework. |
| **Reputation walk** | Existing sentiment propagation | Secret revelation and favor breaking emit sentiment-propagation events consumed by the existing reputation walker. |
| **Prose pipeline + enrichment** | Prose resolvers | New placeholders (`{secret:magnitude_prose}`, `{favor:context}`) are new resolver entries, not new framework. Conditional blocks `{?knows_secret_about}` reuse the existing conditional syntax. |
| **Chronicle + attention tiers** | Existing tier-1/2/3 routing | Discovery events → tier 2 (bonded) or tier 3 (non-bonded). Revelations → tier 1. Favor creation → tier 3. All existing routes. |
| **Axiological profiles** | Agent personality system | `secretGeneration.ts` reads the target's axiological profile + existing edges to choose a plausible `secretType`. The reliable-refusal check for Benchmark 4 reads Hollis's "duty above self" profile. |
| **Hidden marks** | `src/engine/hiddenMarks.ts` | Planted false secrets write `hidden_mark: planted_by_divine` using the existing marks system, which already supports investigation-driven revelation. |
| **`phaseFactionActions`** | Orchestrator | `phaseSecretsFavors` slots in after at phase 6.653 per parent plan. Decay/tension/expiry is a standard edge-iteration pass. |

### What Needs Building (Per Parent Plan)

| Gap | What's Needed | Size |
|-----|--------------|------|
| **`knows_secret_of` edge type** | New edge type with `KnowsSecretOfEdgeProperties`. Register in graph schema. | S |
| **`owes_favor` edge type** | New edge type with `OwesFavorEdgeProperties`. Register in graph schema. | S |
| **`phaseSecretsFavors`** | New engine phase: decay, tension drift on `relates_to`, expiry. | S |
| **`secretGeneration.ts`** | Given target + graph + RNG, emit plausible `{ secretType, magnitude, detail }`. Reads axiological profile + existing conflicting edges. | M |
| **`computeInitialLeverage` extension** | Add secret and favor bonus computation + leverageHistory entries. Extend `LeverageSource` union type. | S |
| **Reveal / Redeem encounter step effects** | Two new step effect handlers. Emit edge mutations and trace events. | S |
| **3 divine action templates** | Reveal Secret (10 essence), Call in Favor (8 essence), Plant Secret (14 essence). Target filters. Tooltip prose. | S |
| **6 discovery encounter templates** | Confession Over Drinks, Quiet Observation, Spy Debrief, Overheard Argument, Drunken Confession, Intercepted Message. Each with Threadbare-voice prose per Benchmark 1/2's quality bar. | M |
| **Favor generation tags on existing templates** | Add `favorGeneration` metadata to 5–8 existing assistance templates. Small per-template change. | S |
| **Consequence functions** | `applySecretRevelationConsequences`, `applyFavorBreakingConsequences`. Trust deltas, sentiment shifts, chronicle emissions. | M |
| **UI: Leverage section on agent panel** | Reuses `StatusLine`; adds the "Leverage" grouping and prose magnitude descriptors. | S |
| **UI: Leverage indicators in encounter UI** | `LeverageBadge` inline primitive — small, new, one-pass implementation. | S |
| **Debug panel inspection** | Enumerate `knows_secret_of` / `owes_favor` edges on selected agent. | S |
| **Prose resolvers** | New enrichment placeholders + conditional block handlers (reuse syntax). | S |

**Parent plan's total scope estimate:** 2–3 CC sessions. This addendum does not revise that estimate — it refines the authored content inside the same envelope.

### How Each Benchmark Moment Maps to Systems

**Benchmark 1 (Kael's Discovery):**
- **Firing the encounter:** `Quiet Observation` is a tier-2 Eye-reach template. Attention tier scoring assigns tier 2 because Kael is bonded. The template fires at tavern sublocations when another agent is present with "hidden activity" signal (an edge flagged as `secretive` or a recent encounter involving covert behavior).
- **Choosing what Serafina was doing:** `secretGeneration.ts` scans Serafina's edges. She has `member_of(Ashbound)` (public). She has a new `acquainted_with(OldForgeExile)` (formed in the previous tick via her own encounter). The scorer detects conflict potential: "Ashbound protects Seekers, Old Forge is Arcane Circle exile territory." `secretType = hidden_allegiance`. Magnitude computed from Eye capability (4) × observation quality (tavern is a hub = moderate quality) = 0.4.
- **The prose:** Encounter template has an enrichment-heavy prose block. `{actor}`, `{secret:subject}`, `{secret:venue}`, `{secret:visual_detail}` fill from graph + scene state. The "quarry stone / Old Forge" detail is driven by an `enrichment_hint` on the target's `acquainted_with` edge (authored per NPC group but parameterized — "quarry stone" belongs to Old Forge; if the exile had been from elsewhere, a different visual detail surfaces).
- **The "burdened" condition:** A small condition added on discovery, tracked on Kael's agent node. It modifies Kael's encounter scoring weights until the secret is revealed, resolved, or decayed — making him slightly more likely to be drawn into Serafina-adjacent encounters in the coming turns. The system nudges Kael toward the story.

**Benchmark 2 (Mundane Favor):**
- **Firing the encounter:** Standard assistance template (`Tavern Intervention`, perhaps — or we tag existing `Break Up A Fight` template). On successful resolution, `favorGeneration` metadata fires: `owes_favor(Garren → Pyra)` with magnitude from the range `[0.2, 0.4]`, context "covered a bad moment."
- **The prose:** Tier-3 chronicle entry with a short enrichment template: `{helper} got between {debtor} and {threat}. {resolution_one_liner}.` The "Nobody said anything about it afterwards. That was the point." is drawn from a resolver table for `Tavern Intervention` successful-outcome flavor lines.
- **Long-term effect:** The edge persists. When Pyra is queried for information in a future encounter involving Garren, the encounter's hesitation modifier reads the `owes_favor` edge and increases Pyra's "reluctance to implicate" signal. The ripple is systemic.

**Benchmark 3 (The Reveal):**
- **Firing the branching step:** The curated encounter with Voss is a Seekers-faction negotiation template (THR-29 or similar). The template declares: `availableSteps` includes `reveal_secret` if `actor.holdsUnrevealedSecretRelevantTo(encounterContext)`. At step-selection time, Kael's `knows_secret_of(Serafina)` edge is enumerated, relevance is computed (Voss's interest in the Ashbound is high — `hostile_to_faction(Voss → Ashbound)` edge), and the step is surfaced.
- **Player's choice routing:** The action drawer shows three options. "Loosen his tongue" fires the **Reveal Secret** divine action (10 essence). The action's handler marks the secret edge `revealed: true, revealedTo: Voss, revealedTick: currentTick`, then triggers `applySecretRevelationConsequences()`:
  - `trusts(Kael → Serafina)` sentiment drops by `SECRET_REVELATION_TRUST_PENALTY` (parent plan's constant).
  - `hostile_to(Voss → Serafina)` edge created.
  - Reputation walk queued (Voss's awareness of Serafina's Old Forge link propagates to Circle allies).
  - Kael gains the "compromised" condition (authored).
- **The prose:** Encounter step prose with enrichment: `{actor}`, `{secret:subject}` (Serafina), `{secret:type_prose}` (rendered into the dialogue), `{recipient}` (Voss). Reveal Secret's divine tooltip shows the god-voice: *"Speak the thing Kael learned. It will cost him. It will cost her more."*
- **The "compromised" condition:** Added on Kael. Modifies subsequent encounter scoring (slightly higher tier-2 attention — the game will pull the player to Kael-Serafina scenes in the near future, so the fallout actually surfaces).

**Benchmark 4 (Favor Called, Refused):**
- **Firing the encounter:** **Call in Favor** divine action targets Hollis (who has `owes_favor(Hollis → Serafina)` of magnitude 0.7). The action seeds an encounter at Hollis's chapel with Serafina as initiator. The encounter template includes a `favor_redemption` step.
- **The refusal check:** Normally `favor_redemption` auto-succeeds. The template adds a conditional branch: if `encounter.favorCost` (authored per encounter — the reliquary's cost is flagged "seal-breaking, chapel-core-duty") exceeds the debt's magnitude by `FAVOR_BREAKING_THRESHOLD`, a refusal roll fires. Hollis's axiological profile has high "duty above self" weighting. Roll result: refuses.
- **Consequence routing:**
  - *If player chooses Lean harder and refusal holds:* `owes_favor.broken = true, brokenTick = currentTick`. `applyFavorBreakingConsequences()` fires: trust penalty -0.3, reputation walk "refused a life debt" propagates through chapel network. Serafina gains "outmaneuvered." Hollis gains "haunted."
  - *If player chooses Let it stand:* the divine action does not re-fire. The encounter resolves with Serafina withdrawing the ask. The edge gains `acknowledged_insufficient: true` flag (new property, small — authored into the consequence function). On next Serafina-Hollis encounter, trust edge receives +0.05 boost as a recognition of grace.
  - *If player chooses Shift her argument:* new resolution roll with favorable modifier (Serafina promises return of reliquary; the `agreement` attachment with `type: 'oath'` is created, bridging the informal favor into a formal contract — the agreement system handles it going forward). If successful, `owes_favor.redeemed = true, redeemedTick = currentTick`, reliquary changes hands, both conditions positive.
- **The prose:** Encounter step prose with deep enrichment: `{actor}` (Serafina), `{creditor}` (Hollis), `{favor:context}` ("pulled me from the fire"), `{favor:magnitude_prose}` ("life debt"), `{ask:subject}` ("the reliquary"), `{ask:moral_weight_prose}` ("the thing sleeping in here wasn't sealed by accident"). The specific line "a man who has calculated a debt and found that it does not cover this particular purchase" is in Threadbare voice, authored once for the refusal-prose template and reused whenever a refusal scene fires (with placeholders for actor/creditor).

### Systemic vs. Authored Content Ratio

| Layer | Systemic | Authored |
|-------|----------|---------|
| **When a secret is discovered** | 100% — Eye encounters at eligible sublocations + presence of subject + successful observation roll | — |
| **What kind of secret it is** | 90% — `secretGeneration.ts` reads axiological profile + existing edges | 10% — secret type catalogue + magnitude tuning |
| **When a favor is created** | 100% — assistance-tagged encounter outcomes | — |
| **What magnitude the favor has** | 85% — magnitude range from template metadata × outcome quality | 15% — range tuning per template |
| **Whether a favor is refused when called** | 80% — axiological profile + ask cost vs debt magnitude | 20% — refusal threshold tuning |
| **Whether a revelation damages trust** | 100% — consequence function | — |
| **What the player reads** | 15% — enrichment placeholders filled from graph | 85% — prose templates are authored |

The system generates *who, when, why, and whether.* Authors write *how it reads.* This maps to the overall project philosophy: the engine is dynamic; the prose is where the craft lives. Secrets & Favors' authored content — the 6 discovery templates, the 3 divine action tooltips, the 4 consequence-function chronicle lines, and the enrichment resolvers — is the entirety of the content work, and the quality bar above sets the standard.

---

## Applicability Scaling (per Design Quality Gate)

Per the quality gate document, this feature is **medium-scope** (new system, new UI surface, content-heavy). All 9 sections are mandatory. Section 9 is the most important — the 4 benchmarks above are the design; the rest of this document is scaffolding around them.

If implementation pressure forces trimming of scope, the order of cuts should be:

1. **Plant Secret divine action** — the most experimental mechanic; can be deferred to v1.1 without breaking the core.
2. **Intercepted Message discovery template** — the Shadow-heaviest of the six templates; can ship later.
3. **Debug panel inspection UI** — required by NFP #2 eventually, but not player-visible.

The **absolutely-must-ship core** for v1 is:
- `knows_secret_of` and `owes_favor` edge types
- Leverage integration (secrets and favors feed THR-28 leverage)
- At least 3 discovery templates (Confession Over Drinks, Quiet Observation, Overheard Argument — the three most-reusable)
- Reveal Secret and Call in Favor divine actions
- Consequence functions (revelation and breaking)
- Leverage section on agent panel
- Chronicle entries for all 5 event types

Everything in this addendum, top to bottom, serves that core. The benchmarks are the lighthouse.
