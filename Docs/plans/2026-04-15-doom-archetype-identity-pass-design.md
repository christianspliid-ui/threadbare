# Doom Archetype Identity Pass — THR-21 Design

> **Date:** 2026-04-15
> **Status:** In Design
> **Issue:** [THR-21](https://linear.app/threadbare/issue/THR-21/tb-107-doom-archetype-identity-pass)
> **Project:** Thematic Pressure & Living World
> **Depends on:** THR-19 (Omen Agenda System — must be implemented first)

---

## Problem Statement

The doom clock has 7 archetypes (breach, convergence, changing, sundering, failing, ascension, reckoning) with authored stage names, escalation cards, and vocabulary banks. But during play, they feel like differently-labeled timers. A Breach run doesn't *feel* like things are tearing apart until the doom cards actually fire. Between cards, every archetype plays the same.

**The goal:** By tick 10–20, before any major doom card fires, the player should feel what kind of world-ending pressure this run is generating. The archetype identity should permeate omen language, event composition, rival behavior, location change, social strain, and tonal bias — not just card text.

**This issue is an identity integration pass**, not a new system. It configures and extends the systems from THR-19 (Omen Agenda) and THR-20 (Complications) to be doom-archetype-aware.

---

## Core Concept: The Doom Identity Matrix

Each archetype defines a **doom identity matrix** — a configuration bundle that tells every downstream system how this archetype colors the world. THR-19's omen agendas already have per-archetype doom-echo templates. This pass ensures every other system also participates.

### Identity Matrix Structure

```typescript
interface DoomIdentityMatrix {
  archetype: DoomClockArchetype;
  
  /** Omen configuration (THR-19 hook) — already designed there */
  omenTrackIds: string[];
  
  /** Event pool biases — which encounter types this archetype favors */
  encounterPoolBias: Partial<Record<EncounterType, number>>;
  
  /** Rival behavior biases — how rivals act under this archetype */
  rivalBehaviorBias: RivalBehaviorBias;
  
  /** Location pressure rules — how settlements change */
  locationPressure: LocationPressureRules;
  
  /** Social strain rules — how relationships are stressed */
  socialStrain: SocialStrainRules;
  
  /** Complication bias (THR-20 hook) — which complication categories are more likely */
  complicationBias: Partial<Record<ComplicationCategory, number>>;
  
  /** Prose tone modifiers — vocabulary injection beyond omen vocabulary */
  proseTone: DoomProseTone;
  
  /** Chronicle chapter theming — how chronicle entries are titled/framed */
  chronicleTheme: ChronicleThemeRules;
  
  /** "Felt identity" criteria — what signals the player should notice by tick N */
  identityMilestones: IdentityMilestone[];
}
```

---

## Per-Archetype Identity Design

### The Breach (Force/Chaos/Entropy) — *"Something is getting in"*

**Felt identity:** The world is a membrane being punctured. Outsider threats. Paranoia. Physical danger from the edges inward.

| System | Breach Coloring |
|--------|----------------|
| **Encounter bias** | duel +0.25, explore +0.15 (more conflict and more desperate exploration at the margins) |
| **Rival behavior** | Rivals become more *aggressive* — they attack rather than scheme. Rival actions favor military and territorial pressure. |
| **Location pressure** | Frontier settlements lose prosperity faster (-1/tick at doom ≥ 40%). Border hexes show corruption earlier. "Thin places" near map edges. |
| **Social strain** | Trust decays faster between agents from different factions. Paranoia: agents are less likely to accept social encounters from strangers. |
| **Complication bias** | `location_fallout` +0.3, `scar` +0.2 (physical consequences, places damaged) |
| **Prose tone** | Verbs: tear, rip, pour, breach, fracture. Adjectives: raw, exposed, alien, wrong. Light described as "leaking" or "escaping." |
| **Chronicle theme** | Chapter titles reference boundaries: "The Border Thins," "What Came Through," "The Edge of the Map" |

**Identity milestones:**
- By tick 8: At least one omen beat mentioning "thin places" or "the edge"
- By tick 15: At least one frontier settlement with notably lower prosperity
- By tick 20: At least one encounter uniquely flavored by Breach vocabulary

### The Convergence (Order/Mind/Energy) — *"Everything is falling inward"*

**Felt identity:** Gravity. Inevitability. Beautiful but inescapable compression. Agents drawn together whether they want to be or not.

| System | Convergence Coloring |
|--------|---------------------|
| **Encounter bias** | social +0.3, duel -0.2 (more social encounters, fewer fights — conflict is absorbed, not expressed) |
| **Rival behavior** | Rivals become more *manipulative* — they create alliances and dependencies rather than attacking. "You will join willingly or be absorbed." |
| **Location pressure** | Central settlements gain prosperity (+1/tick at doom ≥ 40%). Edge settlements slowly depopulate. Agents drift toward population centers. |
| **Social strain** | Trust *increases* between co-located agents (forced closeness creates bonds). But agents who resist grouping suffer isolation penalties. |
| **Complication bias** | `debt` +0.3, `witness` +0.2 (everything is observed; obligations accumulate) |
| **Prose tone** | Verbs: draw, compress, fold, gather, merge. Adjectives: geometric, perfect, inevitable, crystalline. Distances described as "shrinking." |
| **Chronicle theme** | Titles reference unity: "The Gathering," "Closer Than Before," "A Single Point of Light" |

**Identity milestones:**
- By tick 8: Murmurs noting agents "gathering" or "drawn toward" central locations
- By tick 15: Central settlement visibly more prosperous than periphery
- By tick 20: At least one forced-proximity social encounter uniquely Convergence-flavored

### The Reckoning (Time/Spirit/Darkness) — *"The past is here now"*

**Felt identity:** Ghosts. Memory made tangible. Every choice echoes. The dead walk alongside the living.

| System | Reckoning Coloring |
|--------|-------------------|
| **Encounter bias** | social +0.2, explore +0.15, assist +0.1 (encounters about relationships, discovery, and helping — memory and debt) |
| **Rival behavior** | Rivals become more *reflective* — they invoke past betrayals and old debts rather than current power. Rival actions reference history. |
| **Location pressure** | Locations with agent deaths gain "haunted" atmospheric tags. Shrines and memorial sublocations become more significant. Spirit sphere pressure near graveyards. |
| **Social strain** | Old relationships intensify. Trust decays for agents with betrayal history. Trust increases for agents with loyalty history. The past amplifies. |
| **Complication bias** | `broken_trust` +0.3, `debt` +0.2 (old debts surface; trust fractures along old lines) |
| **Prose tone** | Verbs: echo, remember, surface, haunt, return. Adjectives: familiar, half-remembered, translucent, ancestral. Time described as "layered." |
| **Chronicle theme** | Titles reference memory: "What Was Forgotten," "The Debt Unpaid," "Faces in the Fog" |

**Identity milestones:**
- By tick 8: At least one omen beat referencing "old debts" or "the past"
- By tick 15: At least one social encounter colored by relationship history
- By tick 20: Location murmurs mentioning ghosts, echoes, or memory

**Scope boundary:** THR-21 delivers the identity matrix system + complete content for **Breach, Convergence, and Reckoning** (the 3 fully-designed archetypes with authored doom packages). The remaining 4 archetypes (changing, sundering, failing, ascension) are a follow-up content issue (THR-XX) that uses the same matrix format. This split ensures THR-21 can be verified end-to-end without blocking on content for archetypes that lack authored doom packages.

---

## Engine Pillar

### Identity Matrix Loading

Each archetype's identity matrix is authored as a JSON data file alongside existing doom content:

```
src/data/doom/
├── breach.json              # existing stage names
├── breach-identity.json     # NEW: identity matrix
├── convergence.json
├── convergence-identity.json
├── ...
```

Loaded at game initialization alongside doom archetype selection. The matrix is immutable for the run — it's a configuration, not state.

### System Integration Points

**1. Encounter Seeding (Phase 2a.8)**
Already reads omen encounter bias (from THR-19). This pass adds the identity matrix's `encounterPoolBias` as a *persistent* base bias that stacks with the omen's per-track bias. The omen bias is the "current weather"; the identity bias is the "climate."

```typescript
// In encounter seeding:
const totalBias = mergeEncounterBiases(
  identityMatrix.encounterPoolBias,  // persistent climate
  activeOmenBias,                     // current weather (from THR-19)
);
```

**2. Rival Actions (Phase 3)**
The existing `phaseRivalActions` selects rival behavior. Add identity-aware behavior weighting:
- Breach: rivals favor `attack`, `corrupt`, `claim_territory`
- Convergence: rivals favor `influence`, `ally`, `absorb`
- Reckoning: rivals favor `haunt`, `invoke_debt`, `memory_attack`

This is a bias on the existing rival action selection pool, not a new system.

**3. Location Pressure (Phase 6.63 Prosperity / Phase 6.637 Unrest)**
The identity matrix's `locationPressure` rules inject per-tick modifiers into existing prosperity and unrest calculations:
- Breach: frontier penalty, core neutral
- Convergence: center bonus, edge penalty
- Reckoning: death-site haunting bonus (spirit pressure)

**4. Social Strain (Phase 6.5 Reputation Decay / Trust)**
Identity matrix's `socialStrain` modifies trust decay rates:
- Breach: cross-faction trust decays 20% faster
- Convergence: co-location trust builds 20% faster
- Reckoning: history-weighted trust amplification (betrayal = faster decay, loyalty = faster growth)

**5. Complication Bias (inside THR-20's selector)**
The identity matrix's `complicationBias` is added to the complication scoring pipeline as a persistent weight, stacking with the omen synergy bonus.

**6. Prose Tone (enrichProse())**
The identity matrix's `proseTone` vocabulary is always available alongside omen vocabulary. Omen vocabulary changes with each track; prose tone is constant for the run. A new set of placeholders: `{doom_verb}`, `{doom_adj}`, `{doom_atmosphere}`.

**7. Chronicle Theming**
Chronicle chapter titles are generated from the identity matrix's `chronicleTheme` rules. Each archetype provides 8–12 chapter title templates with placeholders.

### Identity Milestone Tracking

A lightweight diagnostic system (debug-only, not player-facing) that checks whether the "felt identity" milestones are being hit:

```typescript
interface IdentityMilestone {
  description: string;
  checkByTick: number;
  check: (gameState: GameState) => boolean;
}
```

The debug panel's Omens tab shows milestone status: ✓ met / ✗ not met. This is a design tuning tool — if milestones aren't being hit, the biases need adjustment.

---

## Content Pillar

### Per-Archetype Content Requirements

Each archetype needs:

| Content | Count | Notes |
|---------|-------|-------|
| Identity matrix JSON | 1 | Biases, thresholds, rule configuration |
| Doom-echo omen templates | 3–5 | Already designed in THR-19 for Breach/Convergence/Reckoning |
| Prose vocabulary bank | ~30 words | Verbs, adjectives, nouns, atmosphere sentences |
| Chronicle chapter title templates | 8–12 | With placeholders: {location}, {agent}, {faction} |
| Rival behavior verb pool | 5–8 | Archetype-specific action descriptors |
| Identity milestones | 3 | Testable "felt identity" criteria |

**Total new content per archetype:** ~60–80 authored items.
**For 7 archetypes:** ~420–560 items. This is the largest content task in the Thematic Pressure project.

### Archetype Prose Voice Samples

Each archetype should have a distinct prose "voice" that's recognizable even in mundane descriptions:

**Breach voice (urgent, physical, spatial):**
> "The market in Thornhaven is busy today, but the merchants keep glancing at the horizon. The sky has been wrong for three days — too sharp at the edges, like a painting someone tore."

**Convergence voice (meditative, geometric, inevitable):**
> "The market in Thornhaven is busy today. Busier than it should be. Merchants from the outer villages have come to trade, all arriving on the same morning, as though drawn by a tide no one announced."

**Reckoning voice (reflective, layered, ghostly):**
> "The market in Thornhaven is busy today — busier than old Maren can remember, and she remembers everything. She swears she saw Hennik's grandfather among the crowd. Hennik's grandfather died ten winters ago."

---

## UI Pillar

### No New UI Components

This issue creates no new UI surfaces. It configures existing and THR-19/THR-20/THR-22 surfaces:

- **WorldPulse (THR-19):** Omen display already shows doom-echo omens. No change needed — the content is archetype-specific by design.
- **Complication toasts (THR-20):** Complication prose already uses vocabulary from templates. Identity matrix just biases which complications appear.
- **Location murmurs (THR-22):** Murmur templates can reference `{doom_adj}` and `{doom_atmosphere}` for archetype coloring.
- **Chronicle:** Chapter titles already generated — now they use identity matrix templates instead of generic titles.
- **Debug Panel:** Identity milestone tracker added to the Omens tab.

### Prose Consistency Verification

During implementation, run the CLI for 30 ticks per archetype and audit:
- Do omen beats use archetype-specific vocabulary?
- Do chronicle entries feel thematically distinct between archetypes?
- Do murmurs reference doom-colored language?
- Are identity milestones being hit by tick 20?

This is a content QA pass, not a mechanical test.

---

## Wiring Section

| Module | Phase | UI | GameState | Traces | Debug | Controls |
|--------|-------|-----|-----------|--------|-------|----------|
| Identity matrix loader | Init (game start) | N/A | `GameState.doomIdentityMatrix` (readonly) | N/A | Matrix visible in doom debug | N/A |
| Encounter pool bias | Phase 2a.8 | Indirect (encounter availability) | Reads matrix → adds to encounter seeding bias | In encounter seeding trace | Bias values in seeding trace | N/A |
| Rival behavior bias | Phase 3 | Indirect (rival action descriptions) | Reads matrix → weights rival action selection | In rival action trace | Rival bias in trace | N/A |
| Location pressure mods | Phase 6.63/6.637 | Indirect (prosperity/unrest numbers) | Reads matrix → modifies per-tick deltas | In prosperity/unrest traces | Delta breakdown in trace | N/A |
| Social strain mods | Phase 6.5 | Indirect (trust display) | Reads matrix → modifies decay/growth rates | In trust decay trace | Rate modifier in trace | N/A |
| Complication bias | Inside THR-20 selector | Indirect (complication descriptions) | Reads matrix → adds to scoring | In complication selection trace | Bias in trace | N/A |
| Prose tone vocabulary | `enrichProse()` | All prose surfaces | Reads matrix → vocabulary available | N/A | N/A | N/A |
| Chronicle themes | Phase 5 | Chronicle panel | Reads matrix → title template pool | N/A | N/A | N/A |
| Milestone tracker | Debug-only derivation | Debug panel Omens tab | Reads GameState, checks criteria | N/A | Milestone status display | N/A |

---

## Constants Table (NFP #1)

| Constant | Default | Purpose |
|----------|---------|---------|
| `IDENTITY_ENCOUNTER_BIAS_CAP` | `0.3` | Max persistent encounter bias from identity matrix |
| `IDENTITY_RIVAL_BIAS_WEIGHT` | `0.4` | How much identity matrix influences rival action selection |
| `IDENTITY_PROSPERITY_MODIFIER_CAP` | `2.0` | Max per-tick prosperity delta from identity pressure |
| `IDENTITY_TRUST_DECAY_MODIFIER` | `0.2` | Fraction by which trust decay/growth is modified (20%) |
| `IDENTITY_COMPLICATION_BIAS_CAP` | `0.3` | Max complication category bias from identity matrix |
| `IDENTITY_MILESTONE_CHECK_INTERVAL` | `5` | Ticks between milestone status checks (debug only) |
| `BREACH_FRONTIER_PROSPERITY_PENALTY` | `-1` | Per-tick prosperity penalty for frontier locations (Breach) |
| `CONVERGENCE_CENTER_PROSPERITY_BONUS` | `+1` | Per-tick prosperity bonus for central locations (Convergence) |
| `RECKONING_DEATH_SITE_SPIRIT_PRESSURE` | `0.02` | Spirit sphere pressure at locations where agents have died |

---

## Fail-Soft Table (NFP #4)

| Failure Case | Fallback |
|-------------|----------|
| Identity matrix JSON missing for archetype | Use empty biases (all zeros). Log warning. Game plays as generic doom. |
| Encounter bias references unknown encounter type | Skip that entry |
| Rival behavior bias references unknown action | Skip; rival uses default selection |
| Location pressure targets non-existent location category | Skip; no modifier applied |
| Chronicle theme templates empty | Use generic "Chapter N" titles |
| Identity milestone check function throws | Catch, mark as "unknown" in debug |
| Prose tone vocabulary empty | `{doom_verb}` etc. resolve to empty string |
| Complication bias stacks beyond cap | Clamp to `IDENTITY_COMPLICATION_BIAS_CAP` |

---

## NFP Compliance

| Priority | NFP | Status | Notes |
|----------|-----|--------|-------|
| 1 | Tunability | PASS | All biases are per-archetype constants in JSON. System caps are named constants. |
| 2 | Inspectability | PASS | Every bias feeds into existing trace infrastructure. Milestone tracker shows identity progress. |
| 3 | Determinism | PASS | Identity matrix is deterministic from archetype selection. No new PRNG calls — all randomness goes through existing seeded systems. |
| 4 | Fail-soft | PASS | See table. Missing identity = generic doom (existing behavior). |
| 5 | Narrative over mechanical | PASS | This is fundamentally a narrative identity system. The mechanical biases exist to produce narrative distinctiveness. |
| 6 | Additive | PASS | New readonly field on GameState. Existing phases read an optional config — no behavior change if absent. |
| 7 | Performance | PASS | Identity matrix is loaded once. Bias lookups are O(1) hash reads. No per-tick computation. |

---

## Known Risk: Rival Behavior Thinness (THR-66)

The identity matrix promises rival behavior bias per archetype, but current rival behavior is mostly canned pressure + toast. THR-66 (rival activation overhaul) is in "Idea" status. Until rivals have richer behavior, the `rivalBehaviorBias` pillar of doom identity will be **structurally thin** — biases will apply but the base behavior pool they bias is narrow.

**Mitigation:** Implement the bias infrastructure now (it's additive and cheap). When THR-66 enriches rival actions, the identity biases will automatically produce more variety. In the interim, the other 6 integration points (encounter pool, location pressure, social strain, complication bias, prose tone, chronicle themes) carry the identity load. Log a milestone check for "rival behavior felt distinct" that will intentionally fail until THR-66 lands.

---

## Dependency on THR-19

THR-21 cannot be implemented before THR-19 because:
1. Doom-echo omen templates (the primary vehicle for archetype identity) are defined and selected by the omen agenda system
2. Omen vocabulary injection (`{omen_adj}`, etc.) is the prose pipeline that archetype vocabulary extends
3. The `omenState.history` that THR-21's milestone tracker reads is created by THR-19

**Implementation order:** THR-19 first → THR-21 as a configuration + content pass on top.

---

## Implementation Scope Estimate

| Task | Pillar | Size |
|------|--------|------|
| `DoomIdentityMatrix` type + loader | Engine | S |
| Encounter bias integration (merge with omen bias) | Engine | S |
| Rival behavior bias integration | Engine | S |
| Location pressure integration | Engine | S |
| Social strain integration | Engine | S |
| Complication bias integration (THR-20 hook) | Engine | S |
| Prose tone vocabulary integration | Engine | S |
| Chronicle theme integration | Engine/Content | S |
| Identity milestone tracker (debug-only) | Engine | S |
| Identity matrix JSON for 3 archetypes (Breach, Convergence, Reckoning) | Content | M |
| Prose vocabulary banks for 3 archetypes (~90 words) | Content | M |
| Chronicle title templates for 3 archetypes (~30 templates) | Content | S |
| CLI audit: 30-tick runs per archetype, verify milestones | QA | M |

**Total estimate:** ~2 Claude Code sessions

**Out of scope (follow-up issue):** Identity matrices + content for changing, sundering, failing, ascension. Same format, authored once this vertical slice is verified.

---

## Quality Gate Addendum (2026-04-16)

> Added to satisfy the design quality gate (`Docs/plans/2026-04-16-design-quality-gate.md`). Sections 1, 2, and 9 were missing from the original structural design.

### Section 1: Player Experience Scenario

**The golden scenario (Breach).**

Tick 9. The player's first settlement, Thornwall, sits at the map's edge. The doom clock reads 35% — not critical, but climbing. The player has been watching Kael navigate social encounters at the central town and hasn't paid much attention to the frontier.

Then the chronicle's chapter heading appears: *"The Border Thins."*

The next three entries feel different from the last run's chronicle:

> *A shepherd found dead on the Eastridge with no wound. Three goats still alive, pressed against the far wall of the pen, facing outward. Whatever came, they could see it and he could not.*

> *Serafina reports that the northern patrol found nothing — but the nothing felt wrong. "The air tastes different past the ridge," she said. "Like there's a door open somewhere."*

> *Millhaven's market gate is closed for the first time in living memory. No official reason. The gate-ward says it's for "maintenance." He says it with his hand on his sword.*

The player thinks: "Something is coming from the edges. The settlements near the border are spooked. This feels like a *Breach* run." They haven't read a tooltip or a system label. The doom archetype has been communicated entirely through the texture of prose and the behavior of the world.

**The mundane scenario.**

Most ticks, doom identity manifests as a subtle difference in prose vocabulary, not a dramatic beat. In a Convergence run, the chronicle describes agents "gathering" and "drawn together" where a Breach run would say "scattered" and "pushed to the margins." The murmur at a central settlement reads "The square is strangely full — folk from the outer farms, here for no clear reason" instead of "The market is busy." The player absorbs this subconsciously — it colors the mood without demanding attention.

**The failure scenario.**

The doom identity system can't really "fail" from a mechanical perspective — it's a configuration layer, not a new system. But it can fail to *register*. If the prose vocabulary is too subtle or the bias modifiers are too weak, the player won't feel the difference between archetypes. The verification milestone tracker (debug-only) exists specifically to catch this — if by tick 20 an archetype hasn't produced its minimum identity beats, the tuning is off.

Cool failure in the world itself: when doom pressure creates a location that loses prosperity, that's not a failure for the player — it's narrative texture. "Thornwall is struggling" is interesting, not punishing.

### Section 2: Emotional Architecture (Summary)

**Emotional read:** The player reads doom identity through the *mood of the chronicle* — vocabulary, tone, and the kinds of events that happen. Breach feels like paranoia and siege. Convergence feels like inevitability and forced intimacy. Reckoning feels like ghosts and debts. No number communicates this — only prose.

**Resonant conditions (world-level):** Not on individual agents but on the *world's mood*:
- Breach: "the frontier is restless," "borders feel thin," "something out there"
- Convergence: "drawn together," "nowhere to go," "beautiful and inescapable"
- Reckoning: "the past remembers," "old debts," "the dead have opinions"

### Section 9: Content Benchmark Moments

#### Benchmark 1: Breach — The Chronicle Chapter Heading

**Setup:** Tick 8, Breach doom at 30%. Three settlements on the map — one central (Millhaven), one mid-range (Thornwall), one frontier (Eastridge). No doom card has fired yet.

**Trigger:** Chronicle chapter cycle. The identity matrix's `chronicleTheme` field selects from Breach title templates.

**The moment:**

> **Chapter III: What the Shepherds Saw**
>
> *The patrols say nothing is wrong. The patrols say the frontier is quiet. But the shepherds on the Eastridge stopped bringing their flocks past the second marker three days ago, and nobody has asked them why.*
>
> *At Millhaven, the debate in the Consortium hall has shifted — not openly, not with a vote, but in the way that Merchant-Captain Heln now checks the horizon before opening the gate each morning. What she's looking for, she doesn't say.*

**Player's internal response:** "This run has a vibe. Something's coming from outside." The player hasn't seen a system label — the doom archetype is communicated through the *texture* of the world.

**Forward hook:** The player is now primed to notice frontier-related events. When a doom card does fire at 40%, it lands in a world that was already anxious — the card feels like a culmination, not a surprise.

#### Benchmark 2: Convergence — The Mundane Murmur Shift

**Setup:** Tick 12, Convergence doom at 25%. Normal tick, no major events.

**Trigger:** Location murmur generation for Millhaven (central settlement). Convergence identity matrix adds `social +0.3` encounter bias and the prose tone vocabulary: *draw, compress, fold, gather, merge, geometric, perfect, inevitable*.

**The moment (murmur tooltip on Millhaven hex):**

> *The square is fuller than the season warrants. Three farming families have moved into town from the outer holdings — not fleeing anything, they say. Just... drawn here. The Weathered Oak has put tables in the alley to handle the overflow.*

**Player's internal response:** This is the 80% case — not a dramatic beat, but atmospheric texture. The player scans past it during a quick turn, but it registers: something is pulling people inward. When they contrast this with their memory of a Breach run (where frontiers emptied from fear), the archetype identity clicks.

**Forward hook:** The population concentration at Millhaven means more social encounters, more forced-proximity conflicts, more factions competing in close quarters. The Convergence identity creates the conditions for its own dramatic moments.

#### Benchmark 3: Reckoning — An Encounter Colored by Memory

**Setup:** Tick 18, Reckoning doom at 40%. Kael is at a location where an NPC agent died 6 ticks ago during a failed duel. The location now has the "haunted" atmospheric tag from the Reckoning identity matrix.

**Trigger:** Encounter selection. Reckoning bias: `social +0.2, explore +0.15`. The encounter fires at a location with a death history. Prose tone: *echo, remember, surface, haunt, return, familiar, half-remembered, translucent, ancestral*.

**The moment (curated encounter):**

> *Kael crosses the courtyard where Aldric fell — and stops. The flagstones are clean. Someone has swept them. But the air holds a weight that cleaning can't reach.*
>
> *An old woman sits on the bench where Aldric used to read. She looks up at Kael with eyes that seem to expect him.*
>
> *"You knew him," she says. Not a question.*
>
> *"I knew him," Kael says.*
>
> *"Then you know what he was trying to do. And you know he wasn't finished." She holds out a leather journal, soft with handling. "He left this. I've been waiting for someone who'd understand what's inside."*

**Player's internal response:** "The past is literally reaching out. This run isn't just doom — it's *memory as doom*. The dead aren't gone; they're unfinished." The Reckoning identity makes death a narrative resource, not just agent removal.

**Forward hook:** The journal is an attachment — a knowledge artifact that carries Aldric's unfinished research. Kael now inherits a dead agent's quest. The Reckoning archetype turns loss into continuity.

### Content Quality Bar

**"Every doom archetype must make the player feel a different kind of dread — not through labels or numbers, but through the vocabulary of the world itself. Breach is paranoia. Convergence is inevitability. Reckoning is ghosts. If the player can't feel the difference by tick 15 without reading a tooltip, the content has failed."**
