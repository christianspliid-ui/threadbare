# Authoring Brief

> **Generated:** 2026-08-25 by scripts/build-authoring-brief.ts
> **Sources:**
>   - Docs/plans/2026-04-16-systemic-wiring-guide.md (sha1: 88688f6a283c69ca02e13797c8b633118c118eee)
>   - Docs/plans/2026-04-16-game-design-direction.md (sha1: 653979d71c059ecae5048396f9b8adaae531ccc8)
>   - .claude/skills/encounter-pipeline/SKILL.md (sha1: c972e40ed91635839679921e1df0be477d0430d3)
>   - Sections A/D, hardcoded in the generator (sha1: 65befe901e88a7024492a94e7d79113ba112b52c)
> **Do not hand-edit.** Regenerate via `npm run build-authoring-brief`.

---

## Section A: Register and Narrator Mode — read this before you write a word

This section governs every other section in this brief. Where a design principle below implies a voice, this one wins.

**Narrate, never inhabit (Prose Doctrine v2, 2026-08-25).** Write as a game master reading a module aloud — a narrator reporting events from outside the scene. The player is a god reading a chronicle, not a body in the yard. No interior sensation, no camera work, no atmosphere without a job. **State facts; never encode them:** if the fact is "no one dares approach it," write that sentence — do not dress it as physical evidence for the reader to decode. Every sentence serves challenge, test, or outcome, or it is cut. "It builds atmosphere" is not a job.

**The opening skeleton, always:** P1 arrival (real graph names) · P2 situation and complication (events, with costs already paid) · P3 the problem (one stake shape). **Budget: 80 words across all three.** Subject-verb-object, one fact per sentence, present tense, third person, the agent named. Dialogue is welcome. No exclamation marks.

**Three registers, and baseline is the default.**

- **Baseline** — the large majority of the words the player reads: step narration, band base text, aftermath overviews. Plain, concrete, active. One idea per sentence. Concrete nouns and verbs over abstractions; dry understatement over ornament. Stacked metaphor, archaic diction and ornamental subordinate clauses are drift. If a word would send a reader to a dictionary, it does not belong here.
- **Character** — dialogue and agent-attributed lines. Idiosyncratic per persona, but comprehension first. At most one florid voice per scene; the narration around it stays baseline.
- **Peak** — rationed lyricism, and only on a declared peak surface: the final step's band prose, the fate-reveal line, major aftermath beats. At most one figurative image per paragraph even there.

**Interactive text is always plain.** Card names, `effectLine`s, factor lines, purpose lines, buttons, tooltips: no metaphor, no ambiguity about what a click does. Card names are imperative verb + noun ("Inspire Courage", never "A Little More"); an effect line is one or two direct sentences. The card flavor quote is retired.

**Absent declaration means baseline.** `register?: 'baseline' | 'character' | 'peak'` is additive and optional. Do not declare `peak` to license a lyrical impulse in ordinary narration — that is the exact drift this model exists to stop.

**Baseline, right:**

> The merchant owed too many people too much. He'd started checking the door. When the collector's boy finally came, he already had the ledger open — not to pay, but to show how little was left.

**Baseline, wrong** — same beat, ornamental diction, sends the reader to a dictionary:

> The merchant's ambit had grown parlous, freighted with the weight of unspoken covenants.

**Peak, right** — a doom transition, which is a declared peak surface:

> The bells stopped. Whatever had been holding its breath beneath the city let it out.

**Rule zero: game prose, not novel prose — clarity beats compression.** A sentence that needs two readings is a defect however good it sounds.

> Sources: Docs/canon/prose.md (the register model; narrator mode — Prose Doctrine v2). Full doctrine, the five Seed Dice and the director's calibration exemplar: .claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md § Prose doctrine v2.

---

## Section B: The 7 Engine Capabilities

Every encounter has access to these capabilities. When you sit down to write, ask: which of these am I using, and why am I not using the others?

### Capability 1: Enrichment Placeholders — Prose That Knows Who's Reading

Every `narrative` field in steps and outcomes supports dynamic text substitution. The engine builds a `NarrativeContext` from the graph at generation time and resolves placeholders into real data.

| Placeholder | Resolves To | Example |
|---|---|---|
| `{name}` | Agent name | "Kael Thornweaver" |
| `{they}/{them}/{their}/{s}` | Gendered pronouns | "they/them/their/s" |
| `{They}/{Them}/{Their}` | Capitalized pronouns | "They watch..." |
| `{location}` | Current location name | "Thornhaven Market" |
| `{culture}` | Agent's culture | "Coastfolk" |
| `{faction}` | Agent's faction name | "The Weavers' Circle" |
| `{group}` | Caller-bound subject group (THR-522) — an Ascendant introduction beat's Director-bound culture/faction | "Children of the Shadow-Kept Timberlands" |
| `{title}` | First reputation trait | "the Resolute" |
| `{artifact:weapon}` | Notable weapon (tier ≥ storied) | "Ashenmourne" |
| `{artifact:any}` | Any notable artifact | "the Covenant Seal" |
| `{ally:strongest}` | Strongest ally (trust ≥ 0.5) | "Serafina" |
| `{rival:strongest}` | Strongest rival | "Voss Ironfold" |
| `{omen_adj}` | Active omen flavor | "whispering" |
| `{omen_verb}` | Active omen action | "unravels" |
| `{omen_noun}` | Active omen object | "the membrane" |
| `{omen_atmosphere}` | Active omen mood | "the air thickens" |
| `{doom_verb}` | Doom archetype vocabulary — action verb | "fractures" (breach) / "gathers" (convergence) |
| `{doom_adj}` | Doom archetype vocabulary — adjective | "fractured" (breach) / "inexorable" (convergence) |
| `{doom_atmosphere}` | Doom archetype vocabulary — atmospheric phrase | "something presses through" (breach) |
| `{target}` | Scene target — the entity the encounter is *with* (THR-694). Falls back to "the other party" | "Serafina" |
| `{target:they\|them\|their\|s}` (+ capitalized) | Target's pronouns; neutral fallback | "she/her/her/s" |
| `{target:faction}` | Target's faction name; falls back to "their people" | "The Iron Wardens" |
| `{cast:<key>}` | Scene cast — a `supportBundle` member by spec key (THR-696). Renders the *bound* entity's live name | "Captain Merrow" |
| `{econ_adj}` | Economic mood adjective (THR-725) — boom/bust coloration of the settlement the scene plays out in. Strips silently in the neutral prosperity band | "grain-heavy" (boom) / "shuttered" (bust) |
| `{econ_noun}` | Economic mood noun phrase | "wagons queued past the gate" / "shuttered stalls" |
| `{econ_atmosphere}` | Economic mood atmospheric phrase | "nobody is counting carefully" / "people watch each other's hands" |

**Why this changes what you write:** When you know prose can branch on whether the agent has allies or artifacts, you write scenes that *use* those relationships. A betrayal scene where the agent has no allies reads differently from one where their strongest ally might hear about it. A discovery scene where the agent carries a storied artifact reads differently from one where they have nothing. These aren't cosmetic — they change the emotional texture of the moment. **Write scenes where the conditionals matter, not scenes where they're decoration.**

### Capability 2: Encounter Seeding — Consequences That Grow Into Future Stories

Aftermath reactions can plant `encounter_seed` effects that spawn new encounters for the agent after a delay. This is how one encounter creates a ripple that becomes a future story.

```typescript
{
  kind: 'encounter_seed',
  templateId: 'broker.quest.shrine_confrontation',  // Specific encounter to spawn
  // OR:
  encounterFamily: 'broker.quest',                   // Family prefix — the engine draws + spawns a member (THR-697)
  targetAgentId: '$actor',       // Who gets the follow-up (defaults to current agent)
  delayTicks: 15,                // When it becomes eligible
  priority: 1.2,                 // Higher = spawns sooner when eligible
  inheritContext: true,          // (opt-in) carry this action's target + cast into the follow-up (THR-697)
  seedLabel: "The shrine map burns in their pocket — someone will come asking"
}
```

**Why this changes what you write:** When you know an encounter can plant a seed that blooms 15 ticks later, you write *differently*. You write the betrayal scene knowing the revelation scene is coming. You write the merchant's favor knowing the debt-collection encounter is planted. You write the hidden truth knowing the investigation encounter will surface it. **The aftermath isn't the end of the story — it's the planting of the next one.** If your encounter has no seeds, ask why. Some encounters are simple moments (the healer mercy encounter). But if your encounter has consequences that should echo forward, seeds are how you make that happen.

### Capability 3: Hidden Marks — Secrets That Can Be Discovered

Hidden marks track secrets, debts, betrayals, and knowledge that persist invisibly until another encounter type reveals them.

```typescript
{
  kind: 'hidden_mark',
  category: 'betrayal',        // betrayal | debt | secret_knowledge | contamination | etc.
  severity: 0.6,               // 0-1, affects reveal likelihood
  label: "Betrayed Brinewall alliance for shrine intelligence",
  revealFamilies?: ['investigation', 'brinewall']  // Which encounter families can discover this
}
```

**Why this changes what you write:** Marks create dramatic irony — the player knows the secret exists, but the world doesn't yet. When you write a deception scene, the mark means the deception has *weight*. It's not just flavor text that says "they got away with it." It's a graph entity that future encounters in the `investigation` or `brinewall` families can detect and trigger consequences from. **Write scenes where the secret matters enough to track.** If a character lies, cheats, or hides something — and it would change the world if discovered — that's a hidden mark.

### Capability 4: Reputation Flow — How the World Remembers

Two parallel systems track how the world perceives an agent:

```typescript
onSuccess: { narrative: "...", reputationDelta: 0.05 }
onFailure: { narrative: "...", reputationDelta: -0.02 }
```

**Why this changes what you write:** Reputation isn't decoration — it feeds back into the scoring pipeline (higher reputation agents get different encounter access) and into prose (reputation traits become `{title}` in enrichment, biography resolvers describe the agent's track record). **Write encounters where the reputation consequence is proportional to the moral weight of the choice.** A trivial task shouldn't swing reputation. A betrayal should leave a mark that the whole reputation system carries forward.

### Capability 5: Graph Operations — Changing the World's Structure

Encounters can cause the world graph to be structurally mutated. These changes aren't cosmetic — they change what exists in the world. The authoring surface and the engine implementation are distinct levels; understanding both prevents writing aftermath that tries to call the wrong thing.

| Helper | What It Does |
|---|---|
| `createSublocation` | Creates a new sublocation inside a location |
| `createTradeRoute` | Creates a `trades_with` edge between locations |
| `claimControl` | Creates a `controls` edge |
| `joinOrUpdateMembership` | Creates a `member_of` edge |
| `modifyLocationProperty` | Changes prosperity, defense, magicalSaturation, etc. |
| `createRelationEdge` | Creates any custom edge type |
| `recordIntelligence` | Stores intel on agent node |

**Why this changes what you write:** When you know an encounter can cause artifacts to be created, omens to be emitted, or faction topology to change, you write *stories about structural consequences*. A founding scene produces a real artifact or sublocation that other agents can discover, encounters can reference, and the map can display. **Write encounters that leave structural fingerprints on the graph.** If an agent "establishes a guild chapter," that should produce a `spawn_artifact` or faction effect — not just prose that says it happened.

### Capability 6: Intelligence and Content Grants — Knowledge as Currency

Two aftermath reaction types give agents tangible knowledge or items:

```typescript
{
  kind: 'intelligence',
  category: 'shrine_location',              // shrine_location | agent_network | trade_route | military_position | political_secret | cultural_knowledge
  label: "Location of the Thornweave Shrine",
  detail: "Northeast of the salt flats, behind the fallen bridge",
  targetRegion?: 'eastern_reach',
  targetEntityId?: 'loc_thornweave_shrine',
  reliability?: 0.8                          // 0-1, how trustworthy
}
```

**Why this changes what you write:** Intelligence creates asymmetric knowledge — one agent knows something others don't. Now that knowledge *ranks their next encounter higher*, *shows up in their prose*, and *is noticed when they act on it*. Write reveal beats that call out the intel by category: "What {name} knew of {intel:trade_route} was already {intel:trade_route.acquiredDaysAgo} days stale." Write scenes where an uninformed agent fumbles: "`{?no_political_secret}{name} still did not know who had sent the steward.{/no_political_secret}`" A spy encounter that grants intelligence about a rival's plans is more systemically alive than one that grants a generic sword — and the rival's plans will now *influence what the agent does next*.

### Capability 7: Divine Intervention Choices — The Player's Voice

The player is a god. Their choices are always divine interventions, never direct character control.

```ts
{
  id: 'turn_the_chaos', label: 'Turn the Chaos', /* …prose… */
  interventionType: 'coercive',
  moralAxis: 'iron',     // which Reach's virtue↔vice axis this choice moves (defaults to the choice's reach)
  pole: 'vice',          // 'virtue' tilts toward the reach's virtue pole, 'vice' toward the vice pole
  magnitude: 0.15,       // unsigned drift strength, canonical 0.05–0.20 (PERSONALITY_DRIFT_DELTA_*)
}
```

**Why this changes what you write:** You're not writing choices for a character — you're writing moments where divine observation creates tension. The god sees the agent struggling and must decide: pour power in, or let them find their own way? **Write moments where the intervention decision is genuinely difficult — where supporting has a cost beyond essence, and withdrawing has consequences beyond failure probability.** That last clause is now the *whole* of it rather than a stretch goal: since THR-1121 withdrawing has no failure-probability consequence to be "beyond", because no choice carries one. The interesting difference between meddling and watching has to be in the fiction and the aftermath, or it is nowhere. The intervention ratio is still tracked, and a god who always meddles still creates a different story than one who watches.

---

## Section C: Encounter Design Principles

> **Section A governs every principle below.** These say what an encounter must *do*. None of them licenses ornate prose: the effect is produced by what happens in the scene, stated plainly, in narrator mode.

Encounters are the linchpin — the curated moments where the game says "pay attention". Every encounter design must satisfy these principles, and every one of them is subject to the register model: `Docs/canon/prose.md` § the register model and § narrator mode — Prose Doctrine v2.

### 1. Not a Coin Flip (for the Player's Moments)
The binary model (invest essence → succeed/fail) produces two bad states: frustration ("I wasted my investment") or indifference ("I succeeded, next"). Neither keeps the player in the scene. An encounter the player is *present for* must be an experience, not a transaction. **Register clamp:** the richness lives in the mechanism — a hand worth thinking about, bands worth reading — never in the ornateness of the sentences describing it.

### 2. Multiple Meaningful Nudges
The player is a god, not the protagonist: they never choose the mortal's response. What varies inside an encounter is which **nudges** the player spends — each a concrete exercise of influence on the scene or on the mortal's inner weather, each with a real cost and a real risk. The dilemma is *whether and where to spend*, and reading it requires understanding the protagonist — personality, capabilities, current state — not just resource math. Playing nothing must stay viable. **Register clamp:** a card face states what the god does and why that moves the odds, in plain interactive text; the scene does the fiction, the cards do the rules.

### 3. No Obviously Right Answer
If one option is clearly optimal, it's not a dilemma. The best encounters create situations where every option has real upside and real risk, and the "right" answer depends on what you value: safety vs. glory, short-term survival vs. long-term arc, the protagonist's nature vs. what you want them to become. **Register clamp:** state each option's upside and cost plainly on the card face — a dilemma the player has to decode is not a dilemma.

### 4. Failure Must Be Cool
Every failure outcome should create narrative texture — new conditions, new traits, new story hooks — that makes the next chapter more interesting. Capture, loss, injury, shame, exile: these aren't punishment, they're *plot*. The player should think "oh no — oh, that's actually interesting" rather than "that sucked, I want to reload." **Register clamp:** name the consequence in plain words — what changed, what it cost, what is owed now — and let that be the texture.

### 5. Consequences Reshape Trajectory
Both success and failure should visibly change the protagonist's standing, capabilities, relationships, and opportunities. The player should read the aftermath and be able to say what is different. The arc has turned. **Register clamp:** report the change as events and state the player can inspect, never as an interior condition the narrator asserts on the mortal's behalf.

### 6. Stakes Stated Before the Hand
Before the hand appears, the player must understand what this costs the protagonist if it goes wrong. Not "DC 15 Strength check" but the concrete price: the debt falls due, the guild strikes his name, he walks back the way he came with nothing. The game states the stake before it offers the nudges. **Register clamp:** stakes are facts and costs in the narrator's voice from outside the scene — never the mortal's interior weather, and never foreshadowed for the reader to decode.

### 7. The Situation Turns
Within a single encounter the situation should turn: a complication lands, a cost is paid, the odds move. The player is reading a sequence of events, not picking from a menu. **Register clamp:** the turn is made of things that happen and prices that get paid — one fact per sentence, the ≤80-word beat budget — never of prose reaching for an arc.

---

## Section D: Player-as-God Framing Constraint

The player is a god who observes through threads and intervenes indirectly. They **NEVER** make choices for the character. Every player-facing option is a **nudge** — a concrete, sphere-flavoured exercise of the god's influence on the scene or on the mortal's inner weather (a stumble on loose stone, an urge arriving in sleep, a sense that this has happened before, an old ambition catching light again, a face nobody afterwards quite recalls, a wound that closes cleaner than it should), never an instruction to the mortal (say this, go there, fight) and never a choice between authored endings. **Influence, never authorship.** The mortal acts according to their personality and the god's influence. Playing nothing must always be viable: a hand is an offer, not a toll gate.

**Auto-REVISE trigger:** Any encounter where the player "chooses how the character responds" must be rejected and reframed as a nudge hand.

> Source: encounter-pipeline SKILL.md — player-as-god framing constraint

---

## Section E: Editorial Rejection Triggers

The following trigger **REVISE BEFORE CONTINUING** (non-negotiable — address before proceeding):

1. **No approach prose** — steps lack descriptive setup before the hand appears
2. **Generic god-verbs** — "intervene" / "help" / "act" with no specific divine framing
3. **No thread integration** — the encounter does not acknowledge the agent's relationships, history, or traits
4. **Missing aftermath reaction choices** — scale medium+ must offer branching aftermath reactions
5. **Reporter prose** — outcomes state that something happened ("they succeeded") without stating what changed and what it cost
6. **No concept art recommendation** — brief omitted, or too vague to paint a scene
7. **A hand outside 4–8 authored cards on a nudge-bearing step**
8. **Fewer than 4 distinct spheres, or no ungated common (sphere-less) option, in a hand**
9. **Any nudge with no failure-band fragment** — or a big-delta nudge (`forecastDelta ≥ 0.15`) missing either failure band
10. **A `StepOutcome` band no fragment in the hand covers**
11. **A number or `%` in an `effectLine`** — words only; the pip row renders magnitude
12. **Trait-hook step skipped**, or a hook naming a ref `validateTraitRefs()` reports dead
13. **A nudge-specific payoff written into the base band text** — it must read correctly with any subset of the hand active
14. **A player-facing option that instructs the mortal** rather than exerting the god's influence on the scene or the mortal's inner weather — the rejected authored-futures model. Range is not the test: a dream, an omen, a kindled desire are lawful; "tell them to run" is not
15. **Any detector hit**: a vagueness-lexicon word, or more than one annotation clause across the encounter
16. **Scene-bespoke prose on a card face** — a title, effect line, or flavor quote that only reads in this encounter (the communication pivot: prose does the scene, cards do the rules)
17. **An effect line that states mood instead of mechanism** — it must say what the god does and why that moves the odds
18. **No setting envelope, or a declared class with no opening** — or a spine/afterimage that names class scenery
19. **Two rider cards in one hand**, or a rider with no justifying comment
20. **A zero-essence non-trait card with no other cost channel**, or a grant naming content that does not exist (`validateNudgeGrantRefs`)
21. **Two encounters in the same family with an identical card-type composition**
22. **A seam echo** — a repeated image, repeated sentence shape, or near-identical phrasing across a paragraph boundary (the class the automated detectors cannot see; check every opening→spine and spine→band seam explicitly)
23. **A static authored factor line** — any `factorLines` entry that would read identically on every run of the encounter (the variance rule: factors come from the broader game context — agent, hex, global modifiers, earlier steps — all derived; scene facts are priced into the difficulty and live in the prose)
24. **The agent as bystander** — a set-piece scene the acting agent merely watches, without the design block's written justification; the default shape is the opportunity/complication/danger landing on the agent or in their path
25. **Announced outcome mechanics in scene prose** — explicit "pass and X / fail and Y" framing; the outcome ladder lives in afterimages and band prose. The *stake* is the opposite: state it plainly in P3, as a fact and a cost (Prose Doctrine v2 reversed foreshadow-never-announce — do not encode a stake in the scene's furniture for the reader to decode)
26. **A design-block breach** — a declared mechanic or object the prose never uses, a step whose prose does not test its declared reach, a mortal choice with no named value axis, or a promise (mystery, hook) with no designed payoff
27. **A title that fails the glance test** — a player reading only the title cannot say what the complication or objective is ("The Broken Wheel" passes; "The Held Commission" does not)
28. **A missing or verbose crux** — the design block does not open with the one plain-grammar sentence stating the complication from the agent's point of view, or needs a paragraph to say it
29. **Unreadable compression** — a sentence that needs two readings, a paragraph carrying a larger story than its word count can hold, or clue information front-loaded in the opening that the shape puts behind an investigation gate (rule zero: game prose, not novel prose — clarity beats compression, dialogue welcome)
30. **A shape invented on the fly** — the encounter does not name its shape from the catalog, or its step structure contradicts the shape it names
31. **Invented game state in base prose** — a relationship, debt, prior visit, or standing between the agent and the world asserted in scene prose with no backing state read (prose rule 7: consume state through a gate or placeholder, produce it through grants/aftermath, never declare it in narration)

> Source: encounter-pipeline SKILL.md — Automatic REVISE triggers (extracted at generation time)
