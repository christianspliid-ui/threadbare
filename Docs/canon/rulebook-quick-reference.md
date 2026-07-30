---
domain: rulebook
last_reviewed: 2026-07-21
reviewer: claude-code
ul_shards: [Cosmology, Agents, Encounters, Prose, Graph]
status: live
companion_of: rulebook.md
---

# Rulebook — Quick Reference

> The board-game reference card. **Current rules only** — no status flags, no caveats. For "is this real yet?" load the full [rulebook](rulebook.md). For *why*, load Vision. For terms, load UL.

## What You Are

You are an **Ascendant** — a transcended mortal. You watch the world from a height. You spend sphere-typed essence. You shift probabilities on mortals you have threads to. You do not direct-control characters. The game asks one question per run: *what kind of god are you?*

## What the World Is

A procedurally generated hex map. Hexes are mutable state (not graph nodes). Everything else — actors, locations, sublocations, factions, cultures, artifacts, traits — is a graph node connected by typed edges. Agents pursue their own goals through a Maslow needs pipeline. Above the cycle: a **Doom Clock** ticking toward an Unmaking. Beneath it: a **World-Soul** carrying echoes from prior cycles.

## The Three-Beat Turn

**Scan → Curated Moment → Aftermath.** Each tick is two in-world hours; 12 ticks per day. The world advances only when you say so. Order is load-bearing: scan means you chose to look; encounter is the chapter; aftermath is the breath before the next scan.

## What You Can Do

Five verbs: **Create, Find, Change, Destroy, Control**. Control is the god-game signature — sustained commitment with ongoing cost, contestable by rivals. *You can't Update what you haven't Read* — Find gates Change/Control.

Every detail view becomes an **action target**. The ActionDrawer fills with templates filtered for that target. Each template can require two orthogonal checks: a **Reach prerequisite** (Domain Capability tier) and a **Sphere prerequisite** (sphere alignment). Both optional per template. Prerequisites also gate visibility.

## The Cosmology

**Eight Reaches** (what you do): Iron, Gold, Shadow, Veil, Heart, Eye, Stone, Star.

**Twelve Spheres** (what fuels it):
- *Foundation:* Chaos ↔ Order, Light ↔ Darkness
- *Creation:* Force ↔ Mind, Matter ↔ Time, Energy ↔ Spirit, Life ↔ Entropy

Reaches and Spheres are **orthogonal**. The same Reach at different Sphere alignments produces different narrative textures. Quintessence is a separate meta-property (narrative centrality / threadbare-ness), **not** a ninth Reach.

## Your Resources

- **Influence Essence** — per-sphere pools. Regenerates from worshippers / places of power / portfolio depth. Spent on actions, sustained on Control.
- **Control slots** — sustained-effect cap, scales with Domain Capability tier.
- **Influence Tiers** — depth of a thread (0–4 in code; five narrative names — Unaware → Curious → Recognized → Devoted → Enthralled — plus 'Aspect' as a separate apex milestone).
- **Court positions** — `the_first`, `retinue`, `watched`, `dormant`.
- **Stealth** — detection profile against two audiences: mortals (whose disbelief turns to faith) and rival gods (who scan for divine signatures).

The two-way thread: you intervene; the mortal responds. The response is part of the texture.

## Encounters

A **curated chapter**, not a flat roll. Two pipelines, one format (`UnifiedActionTemplate`): authored *branching* encounters and systemic *linear template* encounters. Encounter awareness is **hex-granular** — if you see the hex, you see everything on it.

Resolution: **sigmoid → d100**, unified. No alternative dice. Outcomes land on a five-band ladder — *clean · at-cost · failure · crit-success · crit-failure*. The world is capability-poor by design, so **success-at-cost (scraping through) is the dominant, expected texture**; clean and critical success are rare signals a god notices. Critical failure survives at every scale (only its severity scales) **except under an active `no_crit_fail` nudge** — an authored, essence-priced, per-step exception, never a global gate. **Every failure leaves a story artifact** — no outcome is dead air.

**The nudge** [IMPL — THR-773 substrate, THR-775 interface]: in an *attended* encounter only (`story_beat` tier), you get a hand of authored, essence-priced cards that bend the named odds. You nudge the physics; fate still picks the outcome. A card may carry a **rider** — *no crit fail* or *floor at cost* — that remaps the band after the roll lands; at most one applies, and riders never take an extra die. Background and shaping encounters resolve exactly as before. **Probability floors at 5%, and the clamp bites before your cards are counted** — a mortal attempting something far outside their reach reads *doomed* however much you spend. You bend a mortal's odds; you do not lend them your competence.

**Meet The First** [IMPL engine+UI / DESIGN content — THR-868, conversion in THR-875]: the run's opening encounter and the only guaranteed one. Five beats, **three fate rolls** — two *formative tests* and the *bond test* as climax. A meeting card may carry a **pole lean**: the played hand's net lean picks which pole of the reach's value pair a *success* writes, and fate picks the band. Success writes the leaned pole; failure writes the **opposite** one plus a scar; the middle band writes a tempered shift. So *you nudged toward mercy, fate landed ruthlessness* is a real result — and you never have to seek a failure to get the pole you want. The bond **always** forms; the roll picks its reception (*awe · devotion · bargain · doubt · defiance*), and a defiant First bonds and defies you. A First can never start Broken (floor-clamped), and every card is affordable when offered (cost-capped — it fires on turn one). Most runs still show the pre-nudge beat until the dilemma-library conversion lands.

**Broken** [DESIGN — consequences ship disabled until the rebuild road exists]: failing erodes quintessence, scaled by band, step difficulty, and whether you were watching. Worn far enough a mortal goes *Broken* — not dead, not hurt, **out of the story**: no ordinary draws, drifting toward tended ground, for one to two in-game weeks. Erosion alone never reaches zero; death stays zero-state-owned. *Rekindle the Thread* (Spirit) is the expensive exception — the rebuild road is the primary recovery.

Four design rules: (1) Path over adjective. (2) Moral axis is structural — each Reach maps to an archetype-pair (Iron: Protector ↔ Conqueror, etc.). (3) Verbs are encounter-specific, soft-power flavoured. (4) Every primitive is clickable.

**Failure is plot, not punishment.** Aftermath reshapes the protagonist's trajectory; it always produces narrative texture.

## The World at Work

Locations hold **resource stocks** in named classes (staple / strategic / luxury / arcane), resolving to three tiers: **scarce · adequate · surplus**. Tier drives prosperity, and surfaces as a plain-prose **Livelihood** line — you read hunger or glut, never a number.

Trade routes carry a **cargo manifest** naming what actually moves, derived from what each endpoint has spare and what it wants. Merchants prefer **complementary** partners — a surplus beside a shortage beats two towns with the same granary.

Five economic verbs are yours: **Bless the Harvest** (Gold / Life) swells staples toward glut; **Blight the Fields** (Shadow / Entropy) draws them toward famine; **Reveal the Vein** (Eye / Matter) surfaces a new deposit; **Guide the Caravan** (Eye / Order) boosts and protects every road that feeds a settlement; **Sour the Mine** (Shadow / Entropy) pinches the non-staple wealth shut. All arrive as milestone unlocks, all land a beat later — you tilt the odds, you do not farm.

## The World in Company

Mortals **band into companies** (never "parties" in player-facing prose) that travel and fall apart together. A company holds a single scalar, **cohesion**, read only as prose: **bound · holding · frayed · breaking**. Companies form from colocated mortals, take encounters a lone agent cannot, and resolve each step through whichever companion best suits that step's Reach.

Factions field **bands** of their own named people — a band is a company in every respect, and known by whose it is ("The Temple of the Spheres' Sparrows"). A company and a foreign band on the same hex resolve as **one contested pair**: both priced by full company strength, the loser shedding cohesion, a decisive loss risking a named member's life, and both sides leaving with a **grudge** that the mortal sheet reports in prose ("There is blood between them and …"). Four authored confrontations — **The Ambush**, **Den Assault**, **The Guild Falls**, **The Standoff** — surface only while a live opponent is standing there; The Standoff is the rung where it can end with nobody carried away.

Your seat stays the intervention seat: **Bless this Company** (Heart / Spirit) steadies a band's bonds; **Draw Together** (Heart / Spirit) tilts scattered threaded mortals toward one hex until a company gathers on its own; **Reunite** (Heart / Spirit) calls a company that has *already disbanded* back toward one another, re-forming under a variant of its old name — or lapsing unanswered; **Sunder** (Shadow / Entropy) is Bless's mirror, doubling dissent and desertion and forcing the fray drama pool open. Bless and Sunder may both be open at once and neither cancels the other. You never command a company.

## The Clocks and the Ending

Two clocks pressure the run. **Doom** (7 archetypes × 5 stages: Whispers, Signs, Tremors, Crisis, Culmination) ticks toward an Unmaking. **Victory Mandate** (3 stages, graph-state win) runs in parallel. They pressure each other — essence spent on one is essence not spent on the other.

Either clock ending triggers the **Twilight Phase**: the run's closing chapter, harvested into Echoes (Legacy / Monument / Relic) that feed the **World-Soul** and shape the next cycle.

The game is not, structurally, about winning. It is about what kind of being you chose to be toward a world you could not save unconditionally.

---

For the full rulebook (with status flags, source citations, and open questions): [rulebook.md](rulebook.md).
For terms: [Ubiquitous Language index](../ubiquitous-language/README.md).
For why: [Vision/](../../TheFantasyWorldSimulator/Vision/) (Obsidian vault).
