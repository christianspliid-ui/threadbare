# Encounter Experience — Grill-Me Synthesis (2026-05-04)

**Status:** Pre-design synthesis. Input artifact for upcoming experiments doc.
**Source:** Conversational grill-me pass between Cowork and user, 2026-05-04, 25 questions across 9 thematic batches.
**Relates to:** Linear issue (TBD — to be created or attached during handoff).

---

## 1. Scope Under Interrogation

The player-facing detail experience for encounters in Threadbearer. Current state: the backend pipeline is largely in place (resolution, awareness, aftermath rewards, prose enrichment, graph event nodes), and content exists at multiple quality bars (the gate-duty encounter as gold standard). What is *not* settled is the player's interaction model, the UX surface that hosts a multi-part encounter, and the payoff loop that makes encounters feel weighty in the moment AND readable as story post-hoc.

The redesign goal: **a single coherent encounter experience that scales from short resource-building beats to multi-step story arcs, feels engaging when leaned into AND compelling when read back un-intervened, and uses Threadbearer's evocative aesthetic without sliding into stat-block gaminess.**

This synthesis is the input for a follow-up doc that proposes 2–3 competing experiments (different player-interaction models, UX surfaces, and payoff loops) for the user to evaluate.

---

## 2. Confirmed Decisions

### Player verb
- The player **leans on a moment** — applies pressure to one aspect of a beat (a person, a sense, a threshold). The agent's own decision system absorbs the pressure as a tilt, not a command.
- **The will of the agent can only be nudged, never controlled.** "Pick where they go two steps left" is a different game and not what we want. Picking outcomes destroys the reason to play.
- Players want to influence **direction** ("this story going this way is more interesting") more than outcome (success vs failure).

### Failure is a complication, not an ending
- The game is **not** "pump resources to maintain a top success rate." Even when leaned on, failure must remain a real possibility — the world stays uncertain, anything can happen.
- The player must **learn that failure is part of play.** Failures are complications that move the story sideways, not game-overs that end it.
- Resource investment (essence/quintessence on a lean) influences direction and tilts odds; it does not buy outcomes. If a primitive's design lets the player reliably succeed by spending hard, that primitive has failed the test.
- Each experiment must demonstrate at least one example of "interesting failure" — an encounter outcome where the agent fails the roll and yet the story is more compelling than if they had succeeded.

### The "after" loop is the heart of the design
- The Arkham/Eldritch Horror feeling — *after an encounter, the character is changed in a way you have to reckon with on next use* — is the recurring feeling we are chasing.
- Change must be **thematically relevant** to the encounter type (spiritual encounters change spirit-things) — but with allowance for genre crossover when story warrants (a Gold-failed encounter that leaves a physical wound because someone hit the agent's knees with a baseball bat).
- **Variety is the thesis.** Many small primitives compose into different encounter shapes; same loop reskinned = shallow game. Encounters are how the engine's primitives (actors, attachments, agents, places, items) link into stories.
- Two flavors of change matter: **constraint** (locks out future actions, narrows outcome space) and **opening** (unlocks new actions, places, encounters). Constraint is the more powerful flavor; opening is the engine of plot momentum.
- Stat tweaks (+/- a number) are acceptable as continuous-improvement filler, not the main event.
- **Aftermath = the receipt** that crystallizes change into a graph artifact (attachment, condition, trait, clue, item, vow). The graph IS the audit trail.
- Changes from one encounter must **gate or enable** later encounters. That's the engine of "world stays alive": Encounter 2 → trait → unlocks Encounter 5; Item from Encounter 3 → success in Encounter 6.

### Anatomy
- Multi-step. Each step = a screen with a small choice or two and an outcome.
- Player and world **alternate within an encounter** (Arkham-style: setup → choice → roll → outcome → next setup).
- **Pre-roll lean primarily.** Post-roll reinterpretation reserved for moments where the story calls for it.
- **Aftermath is the final step** and crystallizes the change.
- Aftermath flavor scales with stakes: small encounters get a **receipt** by default; big encounters earn a **forced choice between bad/different outcomes** or an **interpretation choice** that tints how the agent carries the change. The player may opt-in to deeper engagement on a small encounter, but it shouldn't be the default.

### Spectrum
- **Definition: an encounter changes the world.** If nothing changes, it's not an encounter — it's ambient prose or flavor.
- The same fundamental system serves both short resource-building encounters and long story-telling encounters.
- Default activities (rest, gather focus, basic shopping) may internally use the encounter pipeline, but **must not surface** as story encounters. They auto-resolve, audit-only. We do not spend five minutes of the player's time on the agent buying a sword unless that purchase is a story moment.

### Engagement is opt-out
- Threading an agent makes their encounters visible.
- The default per encounter is **"do not intervene"** — every intervention choice must include this option.
- The un-intervened path must still produce a **good story** when read back later. The character sheet should be readable as a compelling biography even if the player ignored the agent for 100 turns.

### Following = threading
- "Following" means the agent is threaded. The player's ensemble starts small (First + handful), grows to ~7 max for the divine court, with strategic flexibility up to ~10–12 for "play-wide" strategies (lots of lightly-followed agents, focus shifts as success emerges).
- Both **tall play** (few heroes, deep investment) and **wide play** (many lightly-tracked agents, opportunistic focus) are first-class.
- The verb is *follow them*, not *manage a queue*.

### Cost model
- Leaning on encounters costs **divine essence and quintessence**. Already in the system. Not free.

### Visible information
- No numerical odds, no percentages, no stat-block popups.
- **Qualitative > quantitative.** Words and imagery that hit emotion, not numbers.
- Confirmed examples: quintessence shown as **light around the portrait**, not "47 / 100." Difficulty shown as evocative phrase ("this is going to be challenging") with supporting iconography.
- No outcome preview before the roll. Tension lives in unknown stakes. Rare exceptions where partial preview serves the story.

### The dice-roll moment
- **Threads** as the metaphor — threads spinning, threads being pulled, color-coded by reach. Lean into the title.
- Audio cues are important to the moment.
- Tarot-card-turn pacing resonates (Citizen Sleeper / Disco Elysium / Hades cited as inspirations).

### Multi-agent timing
- No auto-skipping — chains/arcs would break.
- Game **helps prioritize** ("this one's pressing — start here") but doesn't decide for the player.
- Multiple encounters per turn is allowed; player navigates.

### World-screen → encounter handoff
- ✅ Retinue panel priority indicator showing "this needs attention"
- ✅ Hex pulse + thread-color flare on the agent's tile
- ⚠ Notification card retained on probation — "not sure it works super well"; review during experiments
- ❌ No camera drift
- Entering an encounter takes over the viewport. World **freezes** (single-player, turn-based).

### Aesthetic test
**Red lines (kills the Threadbearer feel):**
- HP bars, XP gauges
- d20 / dice-face icons
- Percentage chance shown by default
- Generic fantasy iconography (sword, shield, heart)
- Stat-block popups ("+5 STR")

**Green lines (allowed and encouraged):**
- Motes/threads as evocative quantity
- Threshold-as-imagery (low / looming / mountain)
- Single-word state labels ("strained", "sure", "frayed")
- Threadbearer-specific iconography (sphere glyphs, reach marks)
- Light around portrait for quintessence and similar resources
- Color-coded threads
- Audio at tension moments

---

## 3. Agent Recommendations (⚡ accepted, refined, or rejected)

| Recommendation | Verdict | Notes |
|---|---|---|
| Player verb is "lean on a moment" | ✅ Accepted | "Good way of saying it." |
| Game escorts player into encounter view (opt-out) | ✅ Refined | Opt-out via mandatory "do not intervene" choice; the game *signals* but doesn't *take over* |
| Aftermath shape mixed by stakes | ✅ Accepted | Small = receipt by default; big = choice/interpretation. Players may opt into deeper engagement on small encounters |
| Multi-agent: explicit player-spotlight order | ❌ Rejected | Would break encounter chains. Replaced with "game helps prioritize, no auto-skipping" |
| Research embedded in experiments doc | ✅ Accepted | Light reference sidebars per experiment; deeper research only if a winning experiment warrants it |
| Encounters as punctuation, not pulse | ✅ Effectively accepted | Cadence still being thought through; default activities + proactive activities are open design space |
| Layered handoff signaling (hex + retinue + camera + card) | ⚠ Partial | Hex flare ✅, retinue priority ✅, camera drift ❌, notification card on probation |
| World freezes during encounter | ✅ Confirmed | Single-player game; freeze is the right call |
| Hybrid display for visible info (icons + numbers behind hover) | ⚠ Refined | Numbers not displayed at all — not even hover. Words and imagery only |

---

## 4. Parked-Then-Resolved

(None during this pass. All questions returned a substantive answer on first ask.)

---

## 5. Unresolved Grey Zones

### G1. Cadence calibration
The principle ("encounters as punctuation, not pulse") is settled but the actual ratio is open. Default activities (rest, focus, shop) auto-resolve without surfacing — that's confirmed. But the gap between default activity and full encounter is unsettled. **Proactive activities** (an agent deciding to assassinate someone, overthrow their lord) are an emerging design space — unclear whether they use the current encounter system or need a variation. Experiments should propose a cadence model rather than assume one.

### G2. The lean primitive vocabulary
We agreed leaning is composable primitives (like attachments) so encounters can vary. The actual vocabulary — what *types* of lean primitives exist, what each manipulates — is unspecified. Experiments must propose 4–8 candidate primitive types and demonstrate them composing into different encounter shapes.

### G3. Notification card on probation
The current notification card is retained but the user "isn't sure it works super well." Each experiment should sketch its alternative if it has one (or explicitly defend keeping the card).

### G4. Proactive vs reactive encounter split
Reactive encounters (something happens to the agent) vs proactive (agent decides to act) might warrant different surface treatments. The current system was designed reactively. Open question: is the encounter screen the right surface for an agent's proactive plan, or does that need its own UX (a "scheme" or "campaign" view)?

### G5. Aftermath choice mechanics for big encounters
We agreed forced-choice and interpretation-choice flavors exist for bigger encounters, but the physical interaction is open. Card-pick? Two-button "Bear it / Refuse it"? Drag a token onto a face-down outcome? Experiments should differentiate on this.

---

## 6. Open Risks and Assumptions

### R1. Sameness risk
The user named this failure mode: "same shit again and again because it's easy to implement." If the lean primitive vocabulary is too small or applied too uniformly, encounters will feel like one loop reskinned. **Mitigation:** every experiment must demonstrate at least 3 visibly distinct encounter shapes built from the same primitive set.

### R2. Paperwork risk
If aftermath becomes a receipt screen with lots of "you got X, you got Y" line items, change will feel administrative rather than weighty. **Mitigation:** aftermath should be poetic, not bureaucratic — one or two changes max per encounter, spotlighted as the moment.

### R3. World drains risk
If the player can never disengage cleanly — every encounter demands attention — the ensemble model collapses to following one agent. **Mitigation:** the "do not intervene" default must be lossless. Un-intervened encounters must produce stories worth reading.

### R4. Turn-based transition risk
The game is mid-transition from tick-based pause/play to turn-based. The encounter design might *define* what turn-based means. Experiments should articulate their turn-model assumptions explicitly so the game-wide turn redesign can ride along.

### R5. Engine–Content–UI gap risk
Backend systems exist (resolution, aftermath, graph events). Content authoring against the new player-facing model has not been designed. **Mitigation:** experiments must explicitly show how content authors compose primitives — otherwise content stays sparse and the system doesn't deliver.

### R6. Quintessence cost calibration risk
Leaning costs essence/quintessence. The cost ratio determines how often the player can engage. If too cheap, every encounter gets leaned on (the choose-not-to-engage default is undermined). If too expensive, the player rarely engages and the system feels remote. **Mitigation:** experiments should propose a cost model and test cases.

---

## 7. Inputs for the Upcoming Design Doc

The follow-up experiments doc must:

1. **Cover all three pillars** (Engine, Content, UI) for each experiment.
2. **Differentiate experiments meaningfully** on player-interaction model, UX surface, AND payoff loop — not just visual treatment.
3. **For each experiment:** propose 4–8 candidate lean primitive types and demonstrate at least 3 distinct encounter shapes composed from them.
4. **For each experiment:** sketch the change vocabulary in graph terms — what node/edge types are introduced or touched, how artifacts gate future encounters.
5. **For each experiment:** articulate the cadence assumption — how often encounters surface, what fills the in-between time, how default activities and proactive activities are handled.
6. **For each experiment:** sketch the handoff signaling (retinue priority + hex flare + notification card disposition + screen takeover).
7. **Include a comparison matrix** at the end: experiments × (load-bearing decision they make, risk they take, question they answer).
8. **Cite light reference patterns** from Arkham/Eldritch Horror, Disco Elysium, Citizen Sleeper, Wildermyth, CK3 events, Hades, Pillars/PoE 2 events as inline sidebars per experiment (not a separate research doc).
9. **Identify which experiment most directly addresses each open risk (R1–R6).**
10. **Flag which decisions are prototype-ready** (testable in code with mock content) vs which require playtest to validate.
11. **End each experiment with a "this experiment is right if…" test** — the falsifiable conviction it bets on.

---

## 8. Working Glossary (provisional, for the experiments doc)

- **Lean** — a player action that applies pressure to one aspect of an encounter beat. Costs essence/quintessence. Pre-roll primarily.
- **Lean primitive** — a typed building block that defines one *kind* of lean (e.g., a "tilt" primitive, a "frame" primitive, an "echo" primitive). Composable like attachments.
- **Beat / step** — one screen of an encounter. Setup + small choice + outcome.
- **Aftermath** — the final step of an encounter, where change is crystallized as a graph artifact.
- **Receipt aftermath** — small-encounter aftermath; informs without demanding a player choice.
- **Choice aftermath** — big-encounter aftermath; player picks how the agent carries the change.
- **Encounter** — a moment that changes the world (definition; flavor beats are not encounters).
- **Threading** — the player's mechanism for binding to an agent. Threaded agents form the ensemble. Encounters surface only for threaded agents.
- **Spotlight** — when a threaded agent's encounter takes over the viewport for the player's turn.
