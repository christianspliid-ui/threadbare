# Meet The First Redesign — Content-First with Remembrance Integration

**Date:** 2026-04-06
**Status:** Design approved (brainstorm)
**Backlog:** TB-035 (continuation)
**Depends on:** Remembrance Flow (`Docs/plans/2026-04-06-ascendant-remembrance-flow-design.md`), Dilemma Content Library (Notion TB-038)
**Supersedes:** Current meeting encounter implementation (Phases 1-6 of TB-035)
**Preserves:** Thread edge system, journey engine, Return outcomes, prose enrichment — all mechanical infrastructure stays

---

## Problem

The meeting encounter works mechanically but doesn't create emotional investment. Candidates are stat previews, not people. Dilemmas are generic moral puzzles, not echoes of the god's own story. The Spark is a trait picker, not a dramatic moment. The player configures a unit instead of meeting someone.

Meanwhile, the Remembrance Flow (parallel workstream) produces a rich ascendant identity — mortal origin, Drive, Hunger, perception style, emotional tone. None of this feeds into the current meeting encounter. The god who was once a shepherd and now hungers to Gather sees the same candidates as the god who was once a warrior and now hungers to Consume.

## Design Philosophy

1. **Vignette-only.** No stats, no reach scores, no personality hints, no cooperation strategies visible during the encounter. The player reads scenes and picks by feel. Mechanical truth reveals itself through gameplay.
2. **Ascendant lens everywhere.** Every piece of prose is filtered through the god's Hunger, perceptionStyle, and mortal echo. The meeting encounter is the first time the player exercises their divine identity on a mortal.
3. **Emotional resonance over mechanical transparency.** Dilemmas are selected for resonance with the god's Drive, not random moral puzzles. The god encounters echoes of their own transformation.
4. **Pre-baked art throughout.** All images are static assets authored during content passes and selected at runtime by emotional tag matching. No runtime image generation.
5. **The First is their own person.** The encounter is half character generation, half meeting someone who already exists. The god sees their own mortality reflected, but the mortal is not a mirror — they're a separate person whose life is about to change.

---

## Ascendant Lens Architecture

The lens is the connective tissue between the Remembrance Flow and Meet The First. Every piece of prose the player reads is filtered through it.

### Lens Inputs (from Remembrance Flow output)

| Input | Source | Role |
|-------|--------|------|
| `hunger.id` | Transformation beat | Filters candidates, scores dilemma resonance, drives Spark prose |
| `hunger.perceptionStyle` | HungerDefinition | How the god perceives mortals — "reads threads of belonging", "sees what is hidden" |
| `hunger.emotionalTone` | HungerDefinition | Colors all prose — "warmth edged with possessiveness", "detached curiosity" |
| `mortalOrigin` | Origin beat | The god's former identity — shepherd, scholar, ruler, healer |
| `drive` | Drive beat | The obsession that survived ascension — used for echo moments |
| `timeSinceAscension` | Origin beat | Recent (warm, specific lens) vs ancient (vast, slightly alien lens) |
| `mortalName` | Origin beat | For rare, intimate surfacing in the Spark |

### How the Lens Manifests

Each piece of meeting encounter prose has two layers:

1. **The scene** — what's happening (from the dilemma template or candidate vignette)
2. **The perception** — how the god experiences it (from the lens)

The perception layer is woven into the prose, not bolted on as a header or tooltip. A Witness god doesn't see "a young woman arguing with a merchant." They see "the merchant's lie sits behind his teeth like a stone — you can taste it. The woman knows too. She's counting exits."

### Mortal Echo

The lens also surfaces the mortal echo in moments of recognition. Not every dilemma — that would dilute it. But when a dilemma resonates with the god's own Drive, a brief flash: *"Something ancient stirs. You did this once."* Rare, earned, powerful. Target: ~1 echo moment per encounter, placed where it hits hardest.

### Implementation

Each dilemma template gets a `lensOverlays` field — a map of Hunger → perception prose fragment. The base scene stays universal; the lens is additive. At runtime: base setup prose + lens overlay for the active Hunger + optional mortal echo if Drive resonance score exceeds threshold.

```typescript
interface LensOverlay {
  hungerId: string;           // which Hunger this overlay is for
  perceptionProse: string;    // 1-2 sentences woven into the scene
  echoThreshold?: number;     // Drive resonance score above which mortal echo fires
  echoProse?: string;         // the echo line (e.g. "You did this once.")
}
```

---

## Step 1: Seeking Threads (Candidates as Vignettes)

### What Changes

| Current | New |
|---------|-----|
| Player picks primary reach, secondary reach, sphere | Player sees 3 vignettes immediately — intent is implicit in the Hunger |
| 3 candidates with personality hints + reach scores | 3 candidates as prose vignettes with abstract art, no stats |
| Stat preview drives selection | Emotional resonance drives selection |

### Candidate Generation (Behind the Scenes)

Mechanically unchanged — still generates 3 candidates with reach affinities, axiological profiles, cooperation strategies. Still filtered by location subtype and culture.

**New filter: Hunger shapes the candidate pool.** A Gatherer surfaces vulnerable people, protectors, community-builders. A Witness surfaces secret-keepers, investigators, outcasts who see too much. Not hard locks — weighted tendencies. The god's Hunger draws certain mortals into view.

### What the Player Sees

Each candidate is a **3-5 sentence vignette** — a moment in that person's life. No name yet (they're strangers). No stats ever.

Three layers per vignette:
1. **The scene** — what the mortal is doing (location-appropriate, culture-appropriate)
2. **The lens** — how the god perceives them (Hunger + perceptionStyle)
3. **The echo** — a single line of mortal recognition, on at most 1 of 3 candidates, only if the candidate resonates with the god's Drive

**Concept art:** Each vignette has an abstract mood image, selected from a pre-baked library by matching the candidate's emotional tags to the image library tags.

### Example (Gatherer god, shepherd origin, fishing village)

> *A woman kneels on the dock, mending a net with hands that move without thinking. Around her, children chase each other between the boats — not hers, but she watches them with the same attention she gives the knots. When one stumbles near the water's edge, her arm is already there, catching without looking up.*
>
> *You feel the threads of care radiating from her — invisible, unasked for, load-bearing. She holds this dock together and no one has noticed.*
>
> *Something ancient stirs. You did this once.*

### Example (Witness god, scholar origin, market town)

> *A boy sits cross-legged behind a tanner's stall, scratching marks on a scrap of leather with a nail. Not letters — a map. He's been watching the merchant traffic for weeks, marking which carts arrive on which days, which traders speak to the harbourmaster and which avoid him. He doesn't know why he's doing this. He just can't stop.*
>
> *The pattern is almost visible to him. Another season and he'll see it. You can see it already.*

### "Look Again" Mechanic

Still present. Free during first playthrough. Regenerates 3 new candidates. Prose: *"These threads are not the ones you seek. You look deeper into the web."*

### Selection Transition

Chosen candidate's vignette lingers. Their art remains. Text shifts: *"You pull the thread."* Transition to Step 2. The candidate now has a name (generated from culture pool, revealed at the start of the Defining Moment).

### Intent Simplification

The current 3-picker (primary reach, secondary reach, sphere) is removed from the player-facing flow. The Hunger already encodes the god's intent. Behind the scenes, the Hunger maps to reach/sphere tendencies for candidate generation — same filtering, no manual input.

---

## Step 2: The Defining Moment (Dilemma Engine)

### What Changes

| Current | New |
|---------|-----|
| 16 generic dilemma templates | 177 Notion templates (post-nomenclature fix: ~165 viable) |
| Selected by target value pair only | Multi-axis selection: category slot + Hunger resonance + Drive resonance |
| Generic prose | Ascendant lens wrapping every scene |
| No connection to ascendant identity | Dilemmas echo the god's own transformation |

### Dilemma Selection Engine

2-3 dilemmas per encounter. Each drawn from a different category for breadth:

| Slot | Category | Count in Library | Keyed To | Purpose |
|------|----------|-----------------|----------|---------|
| 1 | Axiological | 50 | Value pair mapped to candidate's primary reach | Shapes the soul |
| 2 | Reach-specific | 45 (→ ~40 post-flesh fix) | Candidate's primary reach domain | Shapes capability |
| 3 (optional, ~60% chance) | Domain-specific OR General/Graph | 40 + 42 | Ascendant's primary sphere OR full pool | Cosmic binding OR graph elements |

### Resonance Scoring

Within each category slot, multiple templates are eligible. The engine scores them:

- **Drive resonance** (+0 to +3): Dilemmas whose emotional core echoes the god's Drive. A god driven by loss sees dilemmas about losing things.
- **Hunger resonance** (+0 to +2): Dilemmas whose outcome space aligns with the Hunger. A Gatherer sees dilemmas about belonging.
- **Anti-resonance bonus** (~15% chance): Deliberately select a dilemma that contradicts the Hunger. Creates productive tension.
- **Incompatibility filter**: Templates with `incompatibleWith` references exclude each other (already in Notion data).
- **Replay filter**: Templates seen in the current playthrough are excluded.

Top-scoring template per slot is selected. Ties broken by seeded PRNG.

### Prose Presentation

Each dilemma presented as:

1. **Scene header** — *"The name comes to you: Kael. And you see..."*
2. **Setup prose** — from Notion template, enriched with `{agent.name}`, `{agent.location}`, lens perception overlay
3. **Two choices** — presented as what happens, not what it does. No shift labels, no trait names.
4. **Outcome prose** — the consequence, through the lens
5. **Concept art** — one pre-baked abstract image matched by dilemma emotional tags

**Between dilemmas:** Brief transition. *"The thread pulls taut. You look closer."*

### Nomenclature Fix (Pre-Import)

| Issue | Action | Affected Templates |
|-------|--------|-------------------|
| Eye: frankness/propriety | Re-key to revelation/discretion | ~10 templates |
| Stone: humility/pride | Re-key to preservation/transformation | ~10 templates |
| Flesh reach dilemmas | Redistribute to surviving reaches or cut | ~10 templates |
| Flesh axiological (stoicism/passion) | Redistribute or cut | ~5 templates |
| Total needing update | | ~30-35 templates |

---

## Step 3: The Spark (Recognition, Not Selection)

### What Changes

| Current | New |
|---------|-----|
| Player sees trait options, picks one | No player choice — narrative consequence beat |
| Pays 2 essence as visible transaction | Essence cost still applies, narrated as cost of reaching across the boundary |
| Trait assigned from menu | Trait derived from dilemma choices + Hunger alignment |
| Generic presentation | Per-Hunger prose, highest emotional budget in the encounter |

### Co-Authorship Model

The brainstorm called for a 50/50 split between character discovery and player choice. This design delivers it across steps: Steps 1-2 are the player's choices (pick a person, shape their soul through dilemmas). Step 3 is the consequence — the god's response to what emerged. The player co-authored the character through their choices; the Spark is the universe responding.

### What the Player Experiences

After the final dilemma resolves, the prose shifts register. Intensity drops. Stillness.

> *"The thread is woven. You see them now — not as they are, but as they will become."*

Then: a passage written per-Hunger that captures the moment of divine recognition. **4-6 sentences. The highest prose budget beat in the encounter.**

### Example (Gatherer god, shepherd origin)

> *She doesn't know you're watching. She's wrapping the boy's hand where the rope burned it, murmuring something you can't hear but somehow remember — the cadence of comfort, older than language. You had hands like hers once. Rough, warm, always reaching for something that needed holding.*
>
> *The hunger stirs. Not for her — for what she could become under your attention. The thread tightens. She looks up, suddenly, at nothing. She felt it.*

### Example (Witness god, scholar origin)

> *He's still scratching his map. The pattern is almost complete — he's three connections from seeing what you already see. You could show him. You could open his eyes right now and let the knowledge pour in. But that would break him. Better to pull the thread gently. Let him find it himself. Let the question burn the way yours burned.*
>
> *He pauses. Looks at his hands. Something has changed, and he doesn't know what.*

### The Mortal Name Surfaces

This is where `mortalName` from the Remembrance Flow can appear — a brief, intimate flash. Not always. Only when the Drive resonance is high enough that the god's own mortality surfaces.

> *You had a name once. Before the hunger. Before the power. It tastes like dust now.*

### Behind the Scenes

- God-given trait derived from dilemma choice history + Hunger, not player-selected
- Thread edge established at Tier 1 (Touched) with `courtPosition: 'the_first'`
- Essence cost (2) deducted — narrated, not transacted
- `meetingChoiceRecord` stored with full dilemma history

### Art

One pre-baked image per Hunger (~10-12 pieces). More intense than dilemma art — the moment of divine contact. Can echo or reuse Hunger reveal images from the Remembrance Flow.

---

## Step 4: The Name They'll Carry

### What Changes

| Current | New |
|---------|-----|
| "Shape them" / "Surprise me" with stat editing | Same two paths, but vignette-only presentation |
| Stats visible in "Shape them" | No stats visible in either path |
| Generic closing | Per-Hunger closing vignette |

### Flow

After the Spark, stillness. Then:

> *"They have a name. You've always known it."*

Name appears — generated from culture pool. Text input for player to accept or change.

**"Shape them" → "You remember more."** Player can edit name. Sees the closing vignette.

**"Surprise me" → "Let the thread settle."** Accept everything. Closing vignette plays automatically.

### Closing Vignette

Brief, 2-3 sentences, per-Hunger tone. The moment after the divine touch — what does the person feel?

> *She goes back to mending the net. But her hands move differently now — faster, surer, as if the knots have become simpler. She won't understand why for a long time. You will watch her until she does.*

### Art

The candidate's Step 1 art returns, with a CSS treatment (glow, saturation shift, warmth) to suggest the bond has been formed.

### Transition to Game

> *"The world takes shape around your hunger. Somewhere below, your First looks up."*

→ Game starts. Agent exists. Player has an emotional connection to a person.

---

## Dilemma Import Pipeline

### Source

Notion TB-038 Dilemma Content Library — 177 templates across 4 category pages:
- Category 1: Axiological (50)
- Category 2: Reach-Specific (45)
- Category 3: Domain-Specific (40)
- Category 4: General/Graph (42)

### Transform Steps

1. **Export** from Notion (batch fetch via MCP)
2. **Nomenclature fix** — re-key deprecated pairs, handle flesh content (~30-35 templates)
3. **Tag enrichment** — add `emotionalRegister`, `hungerResonance`, `driveResonance` tags to every template
4. **Lens overlay authoring** — add `lensOverlays` per Hunger for each template (can be batched — many templates share emotional registers)
5. **Art tag assignment** — tag each template with 2-3 mood keywords for image library matching
6. **Schema mapping** — Notion fields → TypeScript `DilemmaTemplate` type
7. **Import** into `src/data/meeting-dilemma-library.ts` (new file, replaces inline templates in `meeting-content.ts`)

### Post-Import Validation

- All templates parse as valid `DilemmaTemplate`
- No references to deprecated reaches (flesh) or pairs (frankness/propriety, humility/pride, stoicism/passion)
- Category distribution matches expectations
- `incompatibleWith` references resolve
- Every template has emotional tags and at least one lens overlay

---

## Art Budget

All pre-baked static assets. Authored during content passes, bundled with the build.

| Category | Pieces | Style | Selection Method |
|----------|--------|-------|-----------------|
| Candidate mood images | 20-30 | Abstract, painterly, person-in-moment | Emotional tone + location atmosphere tags |
| Dilemma mood images | 30-40 | Abstract, painterly, tension/crisis | Emotional register tags (violence, loss, loyalty, etc.) |
| Spark/bond images | 10-12 | Intense, cosmic edge, moment-of-contact | One per Hunger |
| **Total** | **60-82** | Threadbare aesthetic throughout | Tag-matched at runtime |

Art is selected at runtime by matching encounter element tags against image library tags. Abstract art paired with different prose reads differently, so cross-playthrough reuse is natural and expected.

---

## Codebase Cleanup (Pre-Implementation)

Before building the new system:

| File | Action |
|------|--------|
| `src/data/meeting-content.ts` | Delete 3 broken flesh dilemma drafts (lines 593-673) |
| `src/data/meeting-content.ts` | Remove 17 flesh entries from `ARCHETYPE_NAME_MAP` |
| `src/data/meeting-content.ts` | Remove flesh entry from `REACH_INVESTMENT_TEXT` |
| `src/components/Game/MeetingEncounterModal.tsx` | Remove stat preview UI (reach scores, personality hints, cooperation strategy) |

---

## Connection to Remembrance Flow

The Remembrance Flow (`2026-04-06-ascendant-remembrance-flow-design.md`) produces a complete ascendant identity. This design consumes it as a first-class input:

| Remembrance Output | Meeting Encounter Use |
|---|---|
| Hunger | Candidate pool filtering, dilemma resonance scoring, Spark prose variant, closing vignette tone |
| perceptionStyle | Lens overlay on all prose — how the god sees |
| emotionalTone | Colors all prose — warmth, detachment, intensity |
| mortalOrigin | Mortal echo moments — "you did this once" |
| Drive | Resonance scoring for dilemma selection, echo threshold |
| timeSinceAscension | Lens tone — recent=warm/specific, ancient=vast/alien |
| mortalName | Surfaces in Spark if Drive resonance is high |

The two systems are designed in parallel but the dependency is one-way: the meeting encounter consumes the Remembrance Flow output. It does not modify or constrain the Remembrance Flow design.

---

## What This Design Does NOT Change

The mechanical infrastructure stays:

- Thread edge system (type, properties, direction)
- Court positions (the_first, retinue, watched)
- Journey engine (doom-clock phases, beat scheduling)
- Return outcomes (6 divergent endings, convergence model)
- Prose enrichment pipeline (placeholder resolution)
- Agent creation mechanics (graph node, edges, properties)
- Encounter system architecture (steps, choices, resolution)

This redesign replaces the **content and presentation layer** on top of the existing mechanical skeleton.

---

## Open Questions for Implementation

1. **Lens overlay authoring scale:** 177 templates x 10 Hungers = 1,770 overlay variants if fully authored. Realistic target: author overlays per *emotional register* (20-30 registers) rather than per template. Templates sharing the same register share the overlay.
2. **Candidate vignette authoring:** Vignettes are more complex than the current personality hints. Need a vignette template system — location subtype x Hunger x emotional archetype → vignette prose. Estimate: 50-80 vignette templates with enrichment placeholders.
3. **Remembrance Flow interface contract:** The exact TypeScript interface for the Remembrance Flow output needs to be defined before implementation begins. Draft in this doc's Lens Inputs table.
4. **Dilemma 3 probability tuning:** The 60% default for the optional third dilemma needs playtesting. Too many dilemmas = fatigue. Too few = the encounter feels thin.

---

## NFP Compliance

| Priority | NFP | Status |
|----------|-----|--------|
| 1 | **Tunability** | PASS — Resonance weights, echo thresholds, dilemma count probability, art tag matching weights are all named constants |
| 2 | **Inspectability** | PASS — Selection engine emits traces: which dilemmas were eligible, resonance scores, why each was chosen. Lens overlay source tracked. |
| 3 | **Determinism** | PASS — All selection uses seeded PRNG. Same seed + same ascendant identity = same encounter. |
| 4 | **Fail-soft** | PASS — Missing lens overlay → base prose without lens. Missing art → atmospheric color gradient fallback. Missing Hunger input → generic lens (current behavior). |
| 5 | **Narrative over mechanical** | PASS — This is the core principle of the redesign. |
| 6 | **Additive** | PASS — New dilemma library supplements existing type. New lens system adds to existing enrichment pipeline. Mechanical infrastructure untouched. |
| 7 | **Performance** | PASS — 177 templates loaded once. Selection engine is O(n) scan with scoring. Art library is static asset lookup. No runtime generation. |
