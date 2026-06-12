---
title: Threadbearer — Design Brief
purpose: ≤2-page orientation for any agent entering a design session. Read this BEFORE any shard, canon page, or domain skill.
audience: agents (Cowork, CC, Codex) starting any design or content work
companions:
  - Docs/canon/rulebook-quick-reference.md
  - TheFantasyWorldSimulator/Index.md
status: stable
last_validated_against: 2026-06-11
---

# Threadbearer — Design Brief

**The Fantasy World Simulator** is a systemic god-game and rogue-lite narrative simulation. You play an Ascendant — a former mortal turned demigod — shaping a procedurally generated fantasy world through indirect influence, divine interventions, and sustained control, while a Doom Clock ticks toward the Unmaking.

## The core fantasy

You are a nascent god who discovers interesting mortals and follows their stories like a living novel. You do not direct-control characters. You nudge probabilities, commission encounters, plant threads of influence, and watch what mortals do with them. The game's central question isn't "did you win?" — it's "what kind of god did you become?"

## The three-beat core loop

Every play session moves through the same rhythm.

**Portfolio scan.** You look at your people. Protagonist states arrive as emotional signals and human-textured prose — "Serafina is struggling", "Kael is ascending" — not as raw numbers. You scan, you assess, you decide who matters most right now.

**Curated moment.** The game pulls you toward an encounter it has identified as emotionally significant: a pivotal confrontation, a turning point, a moment where your choice will matter. You engage with branching decision-making under uncertainty.

**Aftermath.** Resolution reshapes the protagonist's trajectory. Failure is not a loss state — it's a story turn. The next chapter is richer for what just happened.

## What the player does

Five verbs describe every action in the game: **Create, Find, Change, Destroy, Control**. Control is the god-game signature — not a one-shot change but sustained commitment, ongoing cost, contestable by rivals. The game's fundamental constraint: you can't Update what you haven't Read. Find gates Change and Control.

Actions live on two orthogonal axes. **Reaches** (eight: Iron, Gold, Shadow, Veil, Heart, Eye, Stone, Star) define what kind of activity you're doing. **Spheres** (twelve: four Foundation Spheres plus eight Creation Spheres) define what cosmic energy fuels it. The same Reach at different Sphere alignments produces fundamentally different effects: Iron+Life rallies the living; Iron+Entropy raises the dead; Iron+Mind dominates enemy will. Every combination is coherent and none is inherently good or evil.

## What pressure makes it a game

Two clocks run in parallel. The **Doom Clock** (seven archetypes, five stages each: Whispers, Signs, Tremors, Crisis, Culmination) advances toward an Unmaking. The **Victory Mandate** (three stages) tracks graph-state conditions for a win. Essence spent on one is essence not spent on the other.

The game is not, structurally, about winning. It is about what kind of being you chose to be toward a world you could not save unconditionally. Either clock ending triggers the Twilight Phase — the run's closing chapter, harvested into Echoes that feed the next cycle's World-Soul.

## Six principles every feature must satisfy

Every design decision — engine, content, UI, prose — is checked against these six:

1. **Emotional read at every level.** The player understands game state through human conditions (alone, ashamed, triumphant), not through numbers.
2. **Genuine dilemmas.** Choices where there is no obviously right answer and the best option depends on understanding the protagonist.
3. **Cool failure.** Every failure state produces narrative texture that makes the next chapter more interesting. Failure is plot, not punishment.
4. **Turn-based pacing.** Each tick is a turn the player controls. Features must work in both quick turns (scan and advance) and deep turns (stop and engage).
5. **Prose carries narrative, UI carries status.** Mechanics are communicated through story, never through exposed numbers.
6. **Content is design.** Authored prose, encounter templates, and complication moments are the player experience, not implementation details behind it.

---

**Next reads (load on demand):**
- Rules of play: `Docs/canon/rulebook.md`
- Reaches × Spheres deep dive: `TheFantasyWorldSimulator/Cosmology/Spheres and Reaches.md` (Obsidian MCP)
- Action verb mechanics: `.claude/skills/state-of-game-design/reference/verbs-resolution.md`
- Encounters: `Docs/canon/encounters.md`
- Agents & threads: `Docs/canon/agents.md`
- Prose authoring: `Docs/canon/prose.md`
- Hex map / HexMapV2: `Docs/canon/hex-map.md`
- Experiential compass: `Docs/plans/2026-04-16-game-design-direction.md`
- Vision premises: `TheFantasyWorldSimulator/Vision/` (Obsidian MCP)
