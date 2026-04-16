# Design Quality Gate

> **Date:** 2026-04-16
> **Type:** Process gate — mandatory checklist
> **Status:** Active
> **Applies to:** Every issue moving from In Design → Implementation Planning that touches player-facing features
> **Reference:** `Docs/plans/2026-04-16-game-design-direction.md` (the principles this gate enforces)

---

## Purpose

The existing exit criteria for In Design → Implementation Planning check *structural completeness* (three pillars covered, NFP table, fail-soft table). This gate adds a layer that checks *design quality* — whether the design has been explored deeply enough to produce a good player experience, not just a correct implementation.

**Rule:** A design that passes all structural checks but fails quality questions is not ready for implementation. The structural gate ensures we build it right. The quality gate ensures we build the right thing.

---

## How to Use This Gate

Before moving any player-facing issue from In Design to Implementation Planning:

1. Answer every question in the relevant sections below
2. Answers should be *concrete* — specific scenarios, specific UI descriptions, specific prose examples. "The player will see relevant information" is not an answer. "The player sees a status icon (amber → red) and a prose line like 'Kael hasn't spoken to anyone in four days'" is an answer.
3. If a section is genuinely not applicable, write "N/A — [rationale]". Silence is not acceptable.
4. The user reviews the answers before the issue moves forward. This is a conversation, not a form — the user may push back, ask for alternatives, or redirect.

---

## Section 1: Player Experience Scenario

*Every design must start with a concrete moment of play.*

- [ ] **The golden scenario.** Describe a specific, concrete moment where this feature creates a great player experience. Name the protagonist. Describe what's happening in the world. Walk through what the player sees, feels, chooses, and experiences. This should read like a paragraph from a play session, not a feature spec.

- [ ] **The mundane scenario.** Describe the most *common* way this feature will be encountered — not the peak moment, but the everyday case. Is the everyday case still interesting? If 80% of encounters with this feature are boring, the design needs work regardless of how good the peak is.

- [ ] **The failure scenario.** Describe what happens when things go wrong — when the protagonist fails, when the player makes a bad choice, when the system produces an unexpected result. Is the failure state interesting? Does it produce "cool failure" — narrative texture that makes the next chapter more compelling? If failure is just punishment or frustration, redesign.

---

## Section 2: Emotional Architecture

*How does this feature make the player feel, and how does it communicate through emotion rather than mechanics?*

- [ ] **Emotional read.** How does the player understand this feature's state at a glance? What visual/iconic signals communicate status? What prose communicates texture? The player should never need to parse numbers or open a sub-menu to understand the basic emotional state.

- [ ] **Resonant conditions.** What emotionally resonant human states does this feature surface or create? (e.g., "alone," "hunted," "triumphant," "ashamed"). List the specific conditions and describe how they're communicated to the player. These should activate empathy without explanation.

- [ ] **Stakes framing.** When this feature creates a decision point, how are the stakes communicated in *human terms*? Not "DC 15 check" but "if he fails here, he'll believe he was never meant to be more than a beggar." Write an example of how stakes would be presented in prose.

---

## Section 3: Choice and Dilemma Quality

*Does this feature create genuine decisions for the player?*

- [ ] **Dilemma inventory.** List every choice point this feature creates for the player. For each one: what are the options, what are the tradeoffs, and why isn't there an obviously right answer?

- [ ] **Knowledge-dependent choices.** Which choices require the player to *understand the protagonist* (their personality, state, capabilities, relationships) to make well? If no choices depend on protagonist knowledge, the feature isn't leveraging the core fantasy.

- [ ] **Intervention spectrum.** How does the player's level of engagement affect outcomes? What happens if they do nothing (auto-resolve)? What happens with minimal intervention? What happens with deep, thoughtful intervention? There should be a meaningful difference, but "doing nothing" should still produce an interesting result.

- [ ] **Agency vs. living world balance.** Does this feature give the player too much control? Too much choice becomes control, and control kills the living world feeling. The world must push back — the player is a participant, not an author. Where does the world assert itself in this design? Where is the player surprised by outcomes they didn't choose?

---

## Section 4: System Connections and Emergence

*How does this feature interact with existing systems to create possibilities that didn't exist before?*

- [ ] **Connection map.** List every existing system this feature touches (encounters, factions, hex map, prose pipeline, attention tiers, action system, influence tiers, world-soul, etc.). For each connection, describe the interaction: does it read from that system, write to it, or both? What data flows between them?

- [ ] **Emergent possibilities.** Describe at least two specific emergent scenarios that this feature *enables* through its connections — moments that neither this feature nor the connected system could produce alone. Example: "Faction reputation + encounter awareness = the player can leverage political allies in a combat encounter they couldn't win alone."

- [ ] **Missed connections.** Are there systems this feature *could* connect to but doesn't in this design? For each, explain why the connection is deferred and what it would enable if added later.

- [ ] **Turn-pace compatibility.** How does this feature work in quick turns (player scans and advances) *and* in deep turns (player stops to explore an encounter or situation)? Features that only work when the player is deeply engaged miss the ambient world-building. Features that only work in the background miss the dramatic moments.

---

## Section 5: Design Alternatives

*What other approaches were considered, and why is this one best?*

- [ ] **At least two alternatives.** Describe at least two other ways this feature could have been designed. These should be genuinely different approaches, not minor variations.

- [ ] **Tradeoff analysis.** For each alternative: what would we gain? What would we lose? Why was the chosen approach better for the player experience (not just easier to implement)?

- [ ] **Inspiration check.** What games, books, films, or other media inspired aspects of this design? How does this feature compare to how similar systems work in reference games? What are we doing differently, and why?

---

## Section 6: UI and Presentation Vision

*Not "there will be a panel" but "here's what the player experiences."*

- [ ] **First impression.** When the player encounters this feature for the first time, what do they see? How do they discover it? Is discovery through gameplay, through UI signals, or through explicit tutorial? (Preference: discovery through gameplay and prose, not tutorial.)

- [ ] **Visual hierarchy.** What's the most important information this feature presents, and how does the UI ensure the player sees it first? What's secondary? What's available on drill-down but not shown by default?

- [ ] **Component vision.** Which existing UI components (from the design system) does this feature use? If new components are needed, describe them concretely: what do they show, how do they behave, what's the interaction model?

- [ ] **Prose integration.** How does this feature surface through the prose pipeline? What prose does it generate? What enrichment placeholders does it use? Is the prose carrying the narrative weight, or is the UI doing it? (Preference: prose carries narrative, UI carries status.)

---

## Section 7: Depth Progression

*Does this feature work at every level of player sophistication?*

- [ ] **Newcomer experience.** How does a new player interact with this feature? Is it intuitive? Can they engage with it meaningfully without understanding all the systems behind it?

- [ ] **Expert exploitation.** How does an experienced player use this feature as a *tool* for macro-level play? Does it become a lever for orchestrating larger outcomes? What patterns can a skilled player discover?

- [ ] **Mastery ceiling.** Is there a skill curve to engaging with this feature, or is it the same experience at hour 1 and hour 50? Features should reward attention and understanding.

---

## Section 8: Value Justification

*Why does this feature deserve to exist?*

- [ ] **Core loop service.** Which of the three beats does this feature primarily serve? (Portfolio scan / Curated moment / Aftermath.) How does it make that beat better?

- [ ] **Standalone value.** If we shipped this feature and nothing else, would a player notice and care? If not, what does it *enable* that the player would care about?

- [ ] **Opportunity cost.** What are we *not* building by building this? Is this the highest-value thing we could be working on right now for the player experience?

---

## Section 9: Content Benchmark Moments

*Content is design. In a game where prose is the player's primary experience, "author N templates" is not a content plan — it's a scope estimate. The design must demonstrate what good content looks like before bulk authoring begins.*

This section applies to every issue whose implementation includes content authoring — encounter templates, complication templates, attachment prose, faction content, narrative events, omen beats, or any other authored text that the player will read.

- [ ] **Benchmark moments (3–4 minimum).** For each major content category the issue introduces, write at least one fully worked moment — not a prose sample in a table cell, but a complete scene. Each benchmark must include:
  - **The setup:** Who is the protagonist? Where are they? What's happening in their arc right now? What has the player been watching?
  - **The trigger:** What causes this content to fire? An encounter outcome? A complication? An omen beat? An initiative milestone?
  - **The moment itself:** The full prose the player would read, in Threadbare voice, with context-specific details (not generic placeholders). This is the actual writing, not a description of what the writing would say.
  - **The player's internal response:** What does the player think and feel after reading this? What question forms in their mind? What do they want to do next? If the answer is "nothing — they move on," the content isn't pulling its weight.
  - **The forward hook:** How does this moment change the story going forward? What new thread, condition, relationship, or tension did it create?

- [ ] **Mundane benchmark.** At least one benchmark must show the *common case* — the content the player will encounter 80% of the time, not just the dramatic peak. If the everyday content is bland filler between highlights, the system will feel hollow. The mundane case must still create texture — a small observation, a quiet shift, a thread that could matter later.

- [ ] **Emotional condition mapping.** For content that creates or modifies protagonist states, list the specific *human conditions* this content surfaces — not mechanical labels ("trust_decay -0.02") but experiences the player recognizes ("exposed," "ashamed," "indebted," "unexpectedly grateful"). Every mechanical effect should trace back to a human condition the player can empathize with.

- [ ] **Content quality bar statement.** Write one sentence that defines the quality bar for all templates in this category. This sentence becomes the benchmark that the content authoring skill checks against during bulk implementation. Example: "Every complication must make the player think 'oh no — oh, that's actually interesting' rather than 'the system says something went wrong.'"

**Why this section exists:** The content pillar in designs historically says "~N templates, authored during implementation" with a table of ID/severity/effect/prose-sample rows. This produces structurally correct but emotionally inert content — templates that fill the right fields but don't create moments. The benchmark moments are the creative work that makes the system come alive. They are the design. Everything else is the filing system.

**Relationship to content skills:** The benchmark moments and quality bar statement from this section are injected into the content authoring skills (encounter-pipeline, attachment-pipeline, prose-content-systems) as reference material during implementation. Every authored template is checked against the benchmarks. This closes the chain: game design direction → quality gate → content skills → every individual template.

---

## Relationship to Existing Gates

This gate **supplements**, not replaces, the existing structural exit criteria:

| Gate | What it checks | When it applies |
|------|---------------|-----------------|
| **Structural gate** (existing) | Three pillars covered, NFP compliance, fail-soft table, wiring section | All issues |
| **Quality gate** (this document) | Player experience depth, emotional architecture, choice quality, system connections | Player-facing features |

Both gates must pass before an issue moves to Implementation Planning. Infrastructure-only issues (CI, tooling, refactoring) may skip the quality gate with an explicit "N/A — infrastructure only, no player-facing changes" note.

---

## Applicability and Scaling

Not every question applies equally to every feature. The gate scales with feature scope:

**Small features** (single encounter type, one new condition, a UI polish pass): Sections 1, 2, and 8 are mandatory. Section 9 if the feature includes authored content. Others as applicable.

**Medium features** (new system, new UI surface, encounter rework): All sections mandatory. Section 9 mandatory if any content authoring is part of implementation.

**Large features** (new pillar, fundamental loop change, multi-system integration): All sections mandatory, and each section should have more depth — multiple scenarios in Section 1, more alternatives in Section 5, deeper connection mapping in Section 4, more benchmark moments in Section 9.

**Content-heavy features** (complication templates, encounter batches, attachment catalogs, omen content, faction content): Section 9 is the *most important* section. If you can only do one section well, do Section 9. The benchmark moments ARE the design for content-heavy features — everything else is plumbing.

Use judgment, but err on the side of answering more questions rather than fewer. The cost of over-thinking a design is much lower than the cost of under-thinking one.
