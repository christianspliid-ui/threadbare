# Open Questions & Lost Design Insights from Meet The First Review

## CRITICAL FINDINGS

This list captures explicit design questions raised during the review that were NOT resolved in the final v2 design document, along with user insights that may have been lost in the document rewrite.

---

## 1. AMBITION SYSTEM ASSESSMENT & INTEGRATION (Unresolved)

### The Open Question
**User stated (MSG 70):** "Yeah, I don't remember exactly what the current ambition system does, so we need to check. What I can say is that, again, from a design perspective, we want interactivity between all the systems, and so the complexity needs to derive from simple, robust systems that interact."

**Critical insight:**
- The story ambitions depend on the existing ambition system working properly
- The user explicitly said "we need to check" what the current ambition system does
- This was not resolved — there's no follow-up investigation in the transcript

### What the Final Design Says
The design doc (System 4) states: "The First's ambitions are the narrative engine between scheduled beats. When the First pursues an ambition and achieves it, that raises their power/influence for the next beat. When they fail, the next beat reads a weaker, more desperate state."

### The Gap
- **Missing:** What does the current ambition system actually track? Does it support reading "accumulated state" between beats?
- **Missing:** How do we ensure the milestone/progression system doesn't create failure states (user explicitly rejected failure states)?
- **Missing:** Are there gaps in how the ambition system's output feeds into beat selection?

---

## 2. DOOM CLOCK & DIFFICULTY SCALING (Partially Unresolved)

### The Open Question
**User asked (MSG 70):** "The doom clock pacing system reduces difficulty when the arc falls behind. This means a slow-progressing First might have their challenges artificially eased. Does this feel right, or should the arc be allowed to fail/truncate if the First isn't strong enough?"

**User's counter-proposal:** "I'm not quite understanding why we need to make it easier if they fall behind. Is that if they keep failing, or what's the reason for that? Wouldn't we just want them to go through the motions, right? We have some steps we need to go through before the time is up, and every step has an outcome and some consequences that lead them down a tree of different ambitions and stories."

### What the Final Design Says
The design doc (System 4, Fail-Soft table) states: "Doom clock ends before Ordeal fires | Force-fire Ordeal at 90% doom" but does NOT address difficulty scaling or how weak Firsts are handled.

### The Gap
- **Missing:** Does the system artificially ease difficulty, or does it just force the beats to fire?
- **Missing:** How does a weak/slow-progressing First's arc feel different from a strong First's arc? (Different story, not shorter one — user implied this in MSG 70)
- **Missing:** Explicit mapping of how First power level → beat variant selection (mentioned but not detailed)

---

## 3. VARIANT GENERATION & CONTENT ARCHITECTURE (High Uncertainty)

### The Open Question
**User asked (MSG 73):** "How many variant paths should each story phase support? More variants = richer storytelling but exponentially more content."

**User's response:** "I think we need to think a little more about how we do this instead of just thinking that it's basic math. Tell me a little more about how you see the variants being created."

**User's follow-up (MSG 74):** "So I like what you're describing here as a great model, but I still feel we shouldn't undersell the value of variety in content. We should use this system for sure, but again, variety, when we can manage it, should not be skipped just to make things faster. We have enough time to implement this. This is not difficult or just hard work, right?"

### What the Final Design Says
System 7 (Unified Vignette Engine) describes a "layered template system: structure + axis selector + dynamic enrichment + archetype tone" but **does not specify**:
- How many variants per beat
- Whether variants are fully hand-authored or generated
- The content budget/prose line count per variant
- How variants are organized (by world state axis, by reach, by sphere, by relationship tier?)

### The Gap
- **Missing:** Explicit content strategy: How many variants should each phase's beats have? (User pressed: don't just do "basic math")
- **Missing:** Definition of "axis selector" — what axes select which variant? (World state? Agent power? Relationship tier? Prior beat outcomes?)
- **Missing:** Prose budget per variant (user said MSG 67: "I think this is the place in the game where we can have the longest prose")
- **Missing:** Content authoring pipeline — hand-craft all variants or generate with enrichment?

---

## 4. PROSE BUDGET & CONTENT VARIETY (Design Direction Lost)

### The User's Design Vision
**MSG 67:** "I think this is the place in the game where we can have the longest prose, so you have a little more budget to describe the cool defining moment and the seeking threads. Especially, I'd say the defining moment is sort of the highlight, and then the direction given in the name of the character, like the direction that we have those two with a little more budget for writing and that we have enough different versions to make it really, really interesting, right? This really kicks off the game. This is where we need to create an emotional connection from the player to that main agent."

**MSG 236 (Design doc):** Captures: "The god reaches into the web of fate, looking for a specific kind of destiny to weave. This is the game's emotional on-ramp — the highest prose budget in the game, the most content variety"

### What's Missing
- **Missing:** Specific prose budget (word count, character count) per encounter step
- **Missing:** Definition of "enough different versions to make it really interesting" — what's the target content variety?
- **Missing:** How the "defining moment" (Step 3) and "seeking threads" (Step 2) get "little more budget" — this is critical prose distribution

---

## 5. CHARACTER GENERATION & PLAYER CO-Authorship (Core Vision)

### The User's Design Philosophy
**MSG 65:** "So I think the initial idea was that the encounter is half character generation by the player. There is character choice involved and half meeting the character. We need to find the right combination of the character seeming to be someone you meet that actually has a personality and then being able to make some choices that actually then influence what the character becomes, because you are there at a moment that defines the trajectory of this person's life."

**Key quote:** "They clearly already need to be a particular person with a particular set of stats already. Therefore, I think definitely that the Ascendance lens needs to put in flavour text, because this is how you see the world, right?"

**MSG 65 continued:** "I think the first choice is, like, what type of destiny are you wanting to influence? What, which is basically, 'What type of character are you looking for? Are you looking for somebody who you want to shape into an aggressive, aggressive warrior type, or are you looking for somebody you want to push in another direction, like taking political control of a kingdom?' What is it? You already have a plan, right, so you're looking for the right person for this plan."

### What the Final Design Says
System 2 (Meeting Encounter) describes the 4 steps but **does NOT capture**:
- The 50/50 split between character discovery and player co-authorship
- How choices influence spheres/reaches (user said "That can influence their spheres or their reaches")
- The persona of the god's search: "You're looking for a particular person in a particular moment where you can go in and tweak the direction of their life"
- The god's intent/plan driving the search ("You already have a plan, right")

### The Gap
- **Missing:** Explicit design that the dilemma choice shapes the character's starting sphere/reach profile
- **Missing:** How to seed/roll the character — does the player's intent choice pre-seed high values in relevant reaches?
- **Missing:** The god's search persona — should the prose reflect "I'm looking for someone who can become [X]" rather than "Here's a random person"?

---

## 6. THE SPARK (Step 3) — Purpose & Content (Redesign Not Fully Captured)

### The User's Redesign (MSG 66)
"I think the spark is exactly how the God touches them. What is it that happens in the dilemma? We want a moment of birth of the first right, so we want some really, really fucking cool situations that the God has almost designed."

**Key directives:**
- "All those ways of doing that need to be super cool, and they need to fit with what kind of God you are."
- "Kill their parents to make them become vengeful warriors, or again something that really creates tension, or, as we talked about, have the really poor man, the beggar, let the beggar become rich, or something dramatic."
- "We need to show the player needs some choices there in order to sort of also find their voice as a God about whether they are cunning or devious or evil or good, but all of those need to be defined by the content. Give them few, up to maybe three, choices there."
- "When we get through those defining moments, then the spark, I think, is sort of where we show, 'Okay, this then happened. The change has happened. They went through the dilemma, and now they are this new thing, and they are on their way.'"
- "We need to show that they somehow show or tell the story of how their priorities have changed, and potentially we can give them a trade, maybe also."

### What the Final Design Says
System 2 step 3 is called "The Spark" but the design doc description is vague about what the player chooses and what it reveals.

### The Gap
- **Missing:** The dilemma should be 2-3 specific, archetype-appropriate choices (not generic)
- **Missing:** Each choice should reveal the god's personality ("cunning, devious, evil, good") through the consequence
- **Missing:** The spark step should narratively show "priorities have changed" — not just stat shifts
- **Missing:** "Give them a trade" — user suggested the god can invest essence to push the character toward a trade/archetype path

---

## 7. RETINUE & UNIVERSAL ENCOUNTER VISIBILITY (Architecture Needs Clarification)

### The User's Expanded Vision (MSG 75, MSG 76)
**MSG 75:** "Make sure we also integrate the trade system into our story selling engine here. If the agent has acquired super cool traits, they can be really interesting to use to influence what's happening. Yeah, so some vignettes trigger on Doom Clock Schedule, right? The first vignettes trigger on Doom Clock Schedule. I think we also have, in other places, vignettes triggering for none firsts on different encounters. I think we talked about that at certain encounters we wanted those to not just happen automatically. We wanted basically every encounter to be clickable so you can go in and see it and then influence it so that we could generate a vignette for every single encounter, not of this size and variety, but, like, okay, he's in a dungeon now. Interesting, I can see that because I have a threat to him, and I chose to go in through the interface and click on that agent and go to the dungeon. I can see he's in this encounter, and then there's a little bit of a vignette that shows a picture of what's happening, and so on."

**MSG 76:** "We have those two systems: 1. One is here now, chaos action helps the situation, which is really interesting to talk about, but the others are more tactical, long-term investments, more like yeah, and that's why they are cards and they are not in the encounter; they are elsewhere."

### What the Final Design Says
System 0 (Divine Court) describes Retinue vignettes as "supporting scene" vignettes but does NOT address:
- **Non-First encounters being universally clickable vignettes**
- **Every threaded agent's encounters generating auto-vignettes**
- **Trade integration into journey beat consequences**

### The Gap
- **Missing:** Definition of retinue vignette structure — are they same template as First vignettes (enrichment + choice) or simplified?
- **Missing:** How often do retinue vignettes fire? (When agents encounter conflict? On a schedule?)
- **Missing:** Integration point: "Every encounter to be clickable" — where does this live in the architecture?
- **Missing:** How does this interact with the non-First encounter system being designed separately (TB-036)?

---

## 8. ATTENTION MODE & PAUSE MECHANIC (Design Needs Enrichment)

### The User's Reframing (MSG 69)
"I think this is fine. I would also say that we can make a narrative way of the player choosing different types of threads, so a thick thread would stop the game, right, because you will be into it. You can feel something is happening, and you are so invested in this relationship that you want to micromanage it, so that just basically chooses the stop, pause again."

**New mechanic proposed:**
1. "Time out with auto resolve"
2. "Tick loop pause on choice"

**Resource connection:** "We can say that the first always starts on pause, and everybody else always starts on time out with auto resolve. You basically have an action (the actions we're going to design in the next design as a god) where you can basically play that action on the character to strengthen the strand, invest some more, and that allows you to then get the automatic pause on choice. There might be a bonus there. If you pay for that extra focus, you get basically better encounters because you have the opportunity to know more about what happens, so you can choose better situations to influence, and therefore basically the encounters become better for you, or you get a bonus or some way."

### What the Final Design Says
System 0 mentions `attentionMode` as `'pause' | 'auto_resolve'` and that it's "modifiable by player action" but does NOT address:
- **Resource cost of toggling pause mode**
- **The bonus/advantage for paying to pause** (better encounter content? more choice options?)
- **Mechanical difference between "time out with auto resolve" and retinue auto-resolve defaults**

### The Gap
- **Missing:** Should toggling pause on a retinue member cost essence? How much?
- **Missing:** What's the mechanical payoff? (Better variant selection? More enrichment?)
- **Missing:** Is this a card action (TB-036) or an encounter-time decision?

---

## 9. BRANCHING STORY TREE & FOUND Gates GATES (Partial Implementation)

### The User's Core Vision (MSG 71, MSG 73)
**MSG 71:** "The journey arc needs a fundamental rethink — from linear milestones to a doom-clock-scheduled branching story tree where the First's actual world state determines which story beats fire. Work this out now."

**MSG 73:** "Does this model feel right? Doom clock schedules when beats fire, world state determines which variant fires, player choice within the variant determines consequences." **User: "Yes, this is it"**

### What the Final Design Says
System 4 (Hero's Journey Arc) captures the doom clock + variant selection model, but **does NOT explicitly address**:
- **Founding Gates** — what gates which outcomes? (The design mentions "Founding Gates" in System 6 but doesn't define them)
- **Beat history pattern-matching** — how does prior beat sequence affect Crisis/Ordeal variant selection? (Mentioned but not detailed)

### The Gap
- **Missing:** Full definition of Founding Gates — what conditions gate which Return outcomes?
- **Missing:** How beat history informs later beat selection (mentioned: "A sequence of Rising Star → Rising Star → Corrupted Path tells a different story")
- **Missing:** Crisis escalation — how does it read prior beat history to introduce shadow/hubris/threat?

---

## 10. TRADE/ARCHETYPE INVESTMENT IN CHARACTER CREATION (New System Mentioned, Not Designed)

### The User's Reference (MSG 66)
"We need to show that they somehow show or tell the story of how their priorities have changed, and potentially we can give them a trade, maybe also. Even the God can maybe choose to invest in a certain trade for them that again pushes them in a certain direction and makes them feel like they have invested some energy in making them do certain things."

### What the Final Design Says
No mention of trades/archetypes in the character creation flow (System 2).

### The Gap
- **Missing:** Step 3 (The Spark) should allow god to invest essence in a specific trade/archetype direction
- **Missing:** How trades appear in character sheet post-meeting
- **Missing:** How this integrates with character generation (random roll + god nudging toward a trade)

---

## 11. ORDEAL OUTCOME WEIGHT ON LATER BEATS (Mentioned but Underspecified)

### The User's Insight (MSG 70)
"That is, to a large extent, an indicator also of how much influence that God has had through this follower. We should ensure that that should also have impacted the world, right? We expect that, because all the things that the agent does, all the encounters they go around and do, not only make them grow in whatever stats they want to grow in, but they should also influence the world. Their ambition is also changing the world, and that should be aligned with God's goals in some situations. In others, it may come down to the transformation that you get a rival ascendant, right? That this first rises to be a rival ascendant. We need to have different journey archetypes, which I think points in the direction of both using C and B and D to get a really strong system."

### What the Final Design Says
System 6 (Return) mentions Ordeal outcome weighs outcomes but doesn't address:
- **How agent's world impact feeds into Ordeal difficulty/variant**
- **Rival ascendant as a possible outcome** (mentioned in System 6 outcomes, but not how it's triggered)
- **World state = god's influence indicator**

### The Gap
- **Missing:** How much should Ordeal reflect the agent's accumulated world impact vs. internal growth?
- **Missing:** Clear trigger for "agent becomes rival ascendant" outcome
- **Missing:** Connection: agent's location control / faction leadership / world dominance → affects Ordeal difficulty/variant

---

## 12. FIRST VIGNETTES VS. RETINUE VIGNETTES — CONTENT PARITY (Unresolved)

### The User's Directive (MSG 75)
"Yeah, so some vignettes trigger on Doom Clock Schedule, right? The first vignettes trigger on Doom Clock Schedule. I think we also have, in other places, vignettes triggering for none firsts on different encounters... you can see he's in this encounter, and then there's a little bit of a vignette that shows a picture of what's happening, and so on."

### What the Final Design Says
System 0 distinguishes Retinue from First but doesn't define:
- **Retinue vignette structure** — same template + enrichment as First, or simplified?
- **Non-First encounter vignette format** — what does "a little bit of a vignette" mean? Single prose line? Multi-line + image?

### The Gap
- **Missing:** Content spec for Retinue vignettes (prose length, choice count, enrichment layers)
- **Missing:** Definition of "supporting scene" vignette beats (what triggers them? How many per archetype?)
- **Missing:** How non-First encounter vignettes are authored (template vs. hardcoded per encounter type)

---

## SUMMARY: WHAT WAS LOST IN THE COMPACTION

1. **Ambition system integration** — needs explicit verification of current system's robustness
2. **Character co-authorship mechanics** — the 50/50 split between discovery and player choice
3. **Variant generation strategy** — user explicitly rejected "just math" but final design doesn't detail the strategy
4. **Prose budgets & content variety directives** — "longest prose," "enough versions," "defining moment is highlight"
5. **Spark step (Step 3) redesign** — 2-3 God-personality-revealing dilemma choices, possible trade investment
6. **Retinue vignette specs** — missing structure, triggering, content depth
7. **Non-First encounter universalization** — "every encounter clickable" architecture details
8. **Attention mode mechanics** — resource cost, bonus payoff for toggling pause
9. **Founding Gates full definition** — what conditions gate which Return outcomes?
10. **Trade investment in character creation** — God can nudge agent toward specific archetype
11. **World state → Ordeal weighting** — how agent impact feeds into Ordeal
12. **Beat history pattern matching** — Crisis/Ordeal variant selection based on prior beat sequence

**User's statement (MSG 93):** "i think we lost something important in the compaction and you jumped to implementation. go back and read this chat and compare to the design document. we have open questions"

This confirms the above 12 categories are where important design vision was lost.
