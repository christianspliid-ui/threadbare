# Ascendant Remembrance Flow Design

**Date:** 2026-04-06
**Status:** Approved (brainstorm)
**Replaces:** Current 3-screen creation flow (Cosmology Sliders → Archetype Cards → Avatar Naming)
**Dependencies:** Meet The First redesign (parallel workstream, approach C — content import first)

---

## Design Philosophy

The player doesn't *build* a character — they **remember** one. The ascendant was once a mortal who transformed into something divine. The creation flow is the act of recovering that identity through fragmentary memories, culminating in a collision with cosmic power.

**Core tension:** "I recognize myself, but I'm not myself anymore." The mortal drive survives ascension but gets magnified and distorted into a divine hunger. A shepherd's love for their flock becomes a god's compulsive need to gather and shelter — the love is still there but it's been alchemized into something bigger, stranger, and hungrier.

**Inspiration:** Malazan Book of the Fallen ascendants. Gods are not blank cosmic templates — they are people who *became* something else. The creation flow explores that transformation.

### Guiding Principles

1. **Emotional resonance over mechanical transparency.** The player never sees sphere labels, reach scores, or domain affinities during creation. Every choice is presented as narrative. Mechanics emerge from emotion, not the other way around.
2. **Purely blind.** No stats, no tooltips, no hints at what a choice does mechanically. The player picks by feel. They discover the mechanical truth through gameplay.
3. **Narrative coherence over mechanical freedom.** Mortal choices constrain divine options. A healer driven by undying love doesn't get offered Entropy. The system filters for coherence — the player experiences this as the story leading them somewhere true.
4. **Inevitability.** The transformation should feel fated. "Of course. Of *course* that's what I became." The remembrance choices funnel naturally toward the Hunger reveal.
5. **Distortion, not betrayal.** The Hunger is a magnified version of the mortal drive, not a contradiction of it. The player should feel a thrill of recognition and a chill of "that's not quite what I meant."
6. **Abstract art at every beat.** Every choice has an evocative image — painterly, ambiguous, Mysterium/Dixit-style. No literal illustrations. The creation flow should feel like a dream, not a settings menu.

---

## Flow Overview

| Beat | Player Experience | Mechanical Output |
|------|------------------|-------------------|
| **Start Page** | Atmospheric entry, "New World" | Unchanged |
| **The Stirring** | Pick an abstract image (4-6, no labels) | Seeds which remembrance fragments surface |
| **The Origin** | Pick a memory fragment + give mortal name | Mortal archetype, time-since-ascension, faction/culture ties, domain leanings |
| **The Drive** | Pick a memory fragment | Personality axis, sphere affinity direction, narrows Hunger options |
| **The Transformation** | Pick a Hunger (2-3 offered), nudge court geometry, witness sphere reveal | Hunger (mandate/victory), court geometry, sphere alignment, all affinities locked |
| **The Reveal** | See full identity + give divine name | Complete ascendant profile for game init |
| **Game Start** | World generates from ascendant identity | Meet The First available as first in-game event |

**What disappears from the default flow:** Cosmology sliders, map size picker, seed input, archetype cards. All move to an Advanced Settings toggle accessible from the Start Page for power users and testing.

**What's new:** Abstract images, three remembrance rounds with art per fragment, Hunger reveal, dual naming (mortal + divine), cosmology derived from ascendant identity.

---

## Beat 1: The Stirring

**Screen:** Full dark void. Single line of text fades in: *"Something stirs in the void. What echoes?"*

**Player sees:** 4-6 abstract images. No text, no labels. Pure intuition. Images are painterly, ambiguous — moods, not concepts:

- Warm light through tangled branches (growth, shelter, entanglement)
- A geometric pattern fracturing outward (order, expansion, breaking)
- Dark water reflecting something that isn't there (memory, loss, depth)
- Embers rising from a silhouette (transformation, sacrifice, will)
- Threads converging on a single point (fate, connection, hunger)
- A vast horizon with a single figure (solitude, ambition, journey)

**Player action:** Click an image. It expands gently. Others fade. Brief transition — the void closes around the chosen image — and we move to the Origin.

**Mechanical mapping:** Each image maps to a *cluster* of remembrance fragments. The mapping is many-to-many — multiple images can surface some of the same fragments, and each image surfaces 3-4 Origin options. The player cannot reverse-engineer the mapping.

**Art requirements:** 4-6 high-quality abstract pieces, 16:9 landscape, Threadbare aesthetic. No literal figures or objects — color, light, texture, and suggestion.

---

## Beat 2: The Origin — "Where did you come from?"

**Screen:** Stirring image dissolves into background (faintly visible). Text fades in: *"You remember..."*

**Player sees:** Three memory fragments, each with its own smaller abstract image. Each fragment is 2-3 sentences of evocative prose establishing:

- **Who you were** — role, status, identity (scholar, ruler, healer, warrior, shepherd, etc.)
- **When you were** — recent or ancient (embedded in the prose, not a separate choice)
- **Where you were** — culture, geography, faction connections

**Time-since-ascension** is encoded in the fragment's prose. Same mortal archetype reads completely differently depending on temporal anchoring:

> *"You remember a throne room where your word was law. The silk banners still hang in the great hall of Tessara."*
> → Recent ruler. Living faction connections.

> *"You remember a throne room, empty now. Its pillars are swallowed by roots. No one remembers the name you held."*
> → Ancient ruler. Ruins layer connections.

**The mortal name:** After selecting, text shifts: *"You had a name once."* Text input appears. Simple, intimate. Placeholder suggests a culture-appropriate name from a pool. Player can type their own or accept.

**Mechanical output:**
- Time-since-ascension (recent → living factions; ancient → ruins layer)
- Mortal archetype category
- Starting faction/culture affinity OR ruins-layer connection
- 2-3 domain reach leanings (hidden)
- Filters which Drive fragments surface next

**Fragment count:** 3-4 per Stirring image cluster. With 4-6 images: **12-24 Origin fragments total.** Each needs abstract art.

---

## Beat 3: The Drive — "What couldn't you let go of?"

**Screen:** Origin image and fragment settle to background ghost. New text: *"But there was something you could not release. Even now, it burns."*

**Player sees:** Three new fragments with abstract art. These are rawer, more emotional than the Origin. The obsession that made ascension possible — the thing so powerful it punched through the boundary between mortal and divine.

**Emotional register shifts here.** Origin fragments are observational ("you remember a place, a role"). Drive fragments are visceral ("you remember a feeling that wouldn't stop"). Intensity ratchets up.

**Example fragments** (for ancient scholar Origin):

> *"You remember a question. It had no answer. You asked it of every book, every sage, every star. You are still asking."*
> → Obsessive knowledge-seeking. Mind sphere direction. Hunger toward Witness.

> *"You remember a name you could not find. Someone was erased — from the records, from memory, from the world. You would not let them be forgotten."*
> → Undying loyalty to the lost. Spirit/Time direction. Hunger toward Preserve.

> *"You remember the moment you realized they were all wrong. Every teacher, every text. The truth was something else entirely, and only you could see it."*
> → Visionary arrogance. Mind/Force direction. Hunger toward Reshape.

**Filtering:** Drive fragments are constrained by Origin. A scholar sees knowledge-obsessions and loss-obsessions, not battlefield-glory obsessions. But deliberate crossover exists — a guardian and a scholar could both reach "someone was erased" through different emotional paths. Branching paths that sometimes reconverge.

**Mechanical output:**
- Primary personality axis (core value tension)
- Sphere affinity direction (narrows to 2-3 likely spheres)
- Dramatically narrows which Hungers are offered in Transformation
- Emotional texture for the ascendant lens (how this god perceives mortals later, including Meet The First)

**Fragment count:** 3-4 per Origin fragment. Heavy reuse expected — many Drives work across multiple Origins. **Library of 20-30 unique Drive fragments** with smart filtering should cover it. Each needs abstract art.

---

## Beat 4: The Transformation — "The power found you."

**Screen:** Mood shifts. Previous fragments darken. Drive image distorts slightly (heat haze). Background deepens. Text, different tone:

*"And then the power found you. Or you found it. It does not matter which. It was hungry. So were you."*

Agency shifts from player to universe. Three sub-beats:

### Step A: The Hunger Reveals Itself

2-3 Hungers appear, pre-filtered by Origin + Drive to feel inevitable. Each has abstract art — more intense, more cosmic than remembrance images. Less painterly, more raw energy.

Each Hunger is a short passage. Not "choose your victory condition" but "this is what the power made of your mortal drive."

**Example** (scholar who couldn't stop asking):

> *"Your question became a hunger. You would know everything. Every secret whispered in darkness. Every truth buried under lies. You would gather all knowledge under your gaze, and nothing — nothing — would be hidden from you."*
> → **The Hunger to Witness.** Mandate: omniscience, information network, seeing through fog.

> *"Your question became a hunger. You asked because the answers were dying. Libraries burning, languages fading, memories rotting. You would hold it all. Every scrap of what was. You would let nothing be forgotten, even if the world must freeze to preserve it."*
> → **The Hunger to Preserve.** Mandate: restoration, ruins reclamation, anti-entropy.

The player picks one. This is the big choice — but it doesn't feel big because Origin and Drive made it feel like a natural conclusion.

**The Hunger is the distorted echo of the Drive.** The power takes what the mortal couldn't let go of and magnifies it to cosmic scale. The love becomes need. The question becomes obsession. The grief becomes a universe-sized refusal to accept loss.

### Step B: The Shape Crystallizes (Minor Notch)

Text: *"The power settles into a pattern..."*

Court geometry defaults from the Hunger. Player sees 2 options (default + one fitting alternative) as brief evocative descriptions:

> *"Your court is a web. Every thread leads to you. Every secret finds its way home."* (default)

> *"Your court is a high house. Knowledge flows upward. You sit at the apex, and nothing reaches you unfiltered."* (alternative)

Quick beat. Not dramatic. A small expression of agency within the constraints.

### Step C: The Resonance Locks In (Reveal, No Choice)

Text: *"The spheres align. This was always going to happen."*

Sphere alignment shown as a cinematic beat — the screen fills with the sphere's color/energy. Not a selection. A consequence.

*"Mind and Spirit pour through you. The universe recognizes what you are."*

Brief pause. Then the Reveal.

**Mechanical output (entire Transformation):**
- Hunger = mandate / victory condition / gameplay archetype
- Court geometry (from 4 options: High House, Circle, Web, Abyss)
- Sphere alignment (primary + secondary)
- All domain affinities locked
- Personality profile finalized

**Content scale:**
- 8-12 Hungers total, each with ~3 prose variants (one per common Drive path)
- 2 court geometry descriptions per Hunger (default + alternative)
- 1 cinematic sphere reveal beat per sphere pair

---

## Beat 5: The Reveal — "This is what you have become."

**Screen:** Stillness. Everything clears. Full ascendant identity assembles — mortal echo and divine hunger woven together.

**Player sees:** A full-screen presentation around a final piece of abstract art (grander, more cosmic than earlier images — mortal warmth and divine intensity layered).

Surrounding the art, the full narrative identity:

> *"You were called **Maren**."*
> *"You were a keeper of forgotten things, in a library that is dust now."*
> *"You could not stop asking. The question burned through you until it burned through the world."*
> *"Now you hunger to Witness. Every secret. Every truth. Nothing hidden."*
> *"Mind and Spirit pour through you. Your court is a Web."*
> *"The mortals will need a name for what you are."*

**The divine name:** Text input. *"What do they call you?"* Placeholder suggests a generated title derived from Hunger + Origin ("The Unblinking Eye", "The Keeper of Dust"). Player can accept or type their own.

**No mechanical information shown.** No sphere labels, no reach scores, no diagrams. Pure narrative identity. The player discovers the mechanical truth through gameplay.

**Tone:** The moment in a myth where the god first appears. Not triumphant — *inevitable.* A little awe, a little unease.

**After naming:** Beat of silence. World begins to generate around the ascendant. Cosmology derived from sphere alignment and Hunger. Map size set by mandate/doom clock defaults.

*"The world takes shape around your hunger. Somewhere below, a mortal looks up. They feel something they cannot name."*

→ Bridge to Meet The First (first in-game event).

**Art:** One reveal portrait per playthrough. V1: well-chosen static piece per Hunger. Future: dynamic composition from the choice thread.

---

## The Hunger Catalog

8-12 core Hungers that serve as gameplay archetypes. Each maps to a mandate (victory condition), preferred court geometry, and sphere alignment tendency. The mortal remembrances filter which 2-3 are offered.

**Draft catalog** (to be expanded during content authoring):

| Hunger | Core Fantasy | Mandate Direction | Default Court | Sphere Tendency |
|--------|-------------|-------------------|---------------|-----------------|
| **Gather** | Shelter, community, flock | Build a community of devoted followers | Circle | Life, Spirit |
| **Witness** | Omniscience, secrets, seeing | Establish an information network across the world | Web | Mind, Spirit |
| **Preserve** | Anti-entropy, memory, stasis | Reclaim ruins and restore what was lost | Circle | Time, Spirit |
| **Reshape** | Transformation, vision, revolution | Change cultures and reshape the world in your image | High House | Force, Mind |
| **Reclaim** | Vengeance, justice, restoration | Recover what was taken, right ancient wrongs | High House | Force, Time |
| **Consume** | Accumulation, growth, appetite | Expand territory and absorb rival power | Abyss | Entropy, Force |
| **Sever** | Freedom, breaking chains, solitude | Destroy systems of control and obligation | Abyss | Entropy, Mind |
| **Kindle** | Inspiration, creation, spark | Ignite new movements, create lasting works | Web | Energy, Life |
| **Bind** | Order, law, structure | Establish an unbreakable covenant across factions | High House | Matter, Mind |
| **Wander** | Journey, discovery, restlessness | Explore every corner of the world, map the unknown | Web | Energy, Time |

These are starting points. Each Hunger needs:
- 2-3 prose variants depending on which Drive path led here
- A mandate with concrete win conditions
- A default court geometry + 1 fitting alternative
- Sphere alignment (primary + secondary)
- Emotional tone for the ascendant lens (how this god perceives mortals)

---

## Content Scale Summary

| Content Type | Estimated Count | Art Required |
|-------------|----------------|--------------|
| Stirring images | 4-6 | 4-6 abstract pieces (16:9, Threadbare aesthetic) |
| Origin fragments | 12-24 | 12-24 smaller abstract pieces |
| Drive fragments | 20-30 (with reuse across Origins) | 20-30 abstract pieces |
| Hunger variants | 24-36 (8-12 Hungers x 2-3 prose variants) | 8-12 Hunger images (cosmic/intense) |
| Court geometry descriptions | 16-24 (8-12 Hungers x 2 options) | None (text only) |
| Sphere reveal beats | ~20 (one per sphere pair) | None (cinematic color/effect) |
| Reveal portraits | 8-12 (one per Hunger) | 8-12 grand composite pieces |
| **Total unique prose fragments** | **~100-130** | |
| **Total art pieces** | **~50-80** | |

---

## Mechanical Mapping Architecture

### The Filtering Funnel

```
Stirring Image
  └─ filters → 3-4 Origin fragments (from library of 12-24)
      └─ each filters → 3-4 Drive fragments (from library of 20-30)
          └─ each filters → 2-3 Hungers (from catalog of 8-12)
              └─ each defaults → Court geometry (notchable)
              └─ each determines → Sphere alignment (revealed)
```

The funnel is many-to-many at every level. Multiple paths can converge on the same Hunger. The player's journey feels unique even when two players end up with the same mechanical build.

### Mapping Tables

Each fragment has metadata (hidden from player):

```typescript
interface RemembranceFragment {
  id: string;
  beat: 'origin' | 'drive';
  prose: string;                    // 2-3 sentence evocative text
  imageAssetId: string;             // abstract art reference
  // Filtering
  stirringClusters: string[];       // which Stirring images can lead here
  requiredOriginTags?: string[];    // for Drive fragments: which Origin tags enable this
  // Mechanical seeds
  tags: string[];                   // e.g. ['ancient', 'scholar', 'loss', 'mind']
  timeSinceAscension?: 'recent' | 'ancient';  // Origin only
  domainLeanings: string[];         // reach affinities seeded (hidden)
  sphereDirection: string[];        // sphere affinities pushed toward
  hungerWeights: Record<string, number>; // how much this fragment favors each Hunger
}
```

```typescript
interface HungerDefinition {
  id: string;
  name: string;                     // e.g. "Witness", "Gather"
  proseVariants: {
    driveTag: string;               // which Drive path triggers this variant
    prose: string;                  // the Hunger reveal passage
  }[];
  mandateTemplate: MandateTemplate; // victory condition structure
  defaultCourt: CourtStructure;
  alternativeCourt: CourtStructure;
  sphereAlignment: {
    primary: Sphere;
    secondary: Sphere;
  };
  domainAffinities: Record<string, number>;  // reach scores
  ascendantLens: {
    perceptionStyle: string;        // how this god sees mortals
    emotionalTone: string;          // what colors their interactions
  };
}
```

### Cosmology Derivation

When the creation flow completes, cosmology is derived — not set by sliders:

- **Sphere weights:** Primary sphere at 0.25, secondary at 0.20, remaining 0.55 split among other spheres with a bias toward spheres tagged by the Drive and Origin fragments (exact distribution tunable via constants)
- **Map size:** Determined by mandate scope (gather/kindle → medium; consume/reclaim → large; wander → large; witness/sever → medium)
- **Seed:** Random by default. Advanced Settings exposes manual seed input.
- **Foundation axes:** Derived from court geometry and Hunger archetype

Advanced Settings toggle on Start Page exposes the full cosmology panel (sphere sliders, map size, seed) for players who want manual control. This overrides the derived values.

---

## Dual Naming System

Two names, two identities:

| Name | When Given | Purpose | Example |
|------|-----------|---------|---------|
| **Mortal name** | Beat 2 (Origin) | The person who was. Intimate, half-forgotten. | "Maren" |
| **Divine name** | Beat 5 (Reveal) | What they became. What mortals call them. | "The Keeper of Dust" |

**Divine name generation:** Placeholder suggestions derived from Hunger + Origin. Formula: "The [Adjective] [Noun]" where adjective comes from the Drive's emotional tone and noun comes from the Hunger's concept. Player can accept or type custom.

**Gameplay implications:**
- The divine name is used in all normal gameplay, UI, and NPC dialogue
- The mortal name surfaces rarely — in ruins inscriptions, ancient follower memories, personal moments of doubt. These are emotional gut-punches by design.
- The gap between the two names *is* the story of ascension

---

## Connection to Meet The First

The ascendant profile produced by this flow is a first-class input to the Meet The First encounter:

- **Ascendant lens** colors all vignettes — a Witness perceives thoughts and hidden truths, a Gatherer perceives vulnerability and belonging, a Reclaimer perceives injustice and potential
- **Hunger** filters which candidate archetypes surface — a Gatherer sees potential flock members, a Witness sees potential agents and informants
- **Mortal echo** provides the emotional subtext — the god sees their own lost mortality in The First. A shepherd-god sees someone who needs protection. A scholar-god sees someone asking questions.
- **Drive** determines what dilemmas are meaningful — dilemmas that resonate with the god's obsession hit harder than generic moral puzzles
- **Time-since-ascension** affects the lens tone — a recent god's lens is warm and specific, an ancient god's lens is vast and slightly alien

The creation flow output feeds directly into the Meet The First selection engine as filtering and enrichment parameters.

---

## What Gets Replaced

| Current | New |
|---------|-----|
| Cosmology slider screen | Removed from default flow → Advanced Settings |
| Map size picker | Derived from mandate scope → Advanced Settings |
| Seed input | Random default → Advanced Settings |
| 4 archetype cards | Replaced by remembrance funnel + Hunger selection |
| Single avatar name | Replaced by dual naming (mortal + divine) |
| `generateArchetypes()` | Replaced by remembrance fragment library + Hunger catalog |
| `AscendantSelection.tsx` | Replaced by new Remembrance flow components |

**Preserved:**
- `StartPage.tsx` — unchanged
- `createAscendant()` — updated to accept remembrance flow output instead of archetype
- `GameView.tsx` initialization — updated inputs but same structure
- Court structure types in `influence.ts` — reused
- Sphere/reach type system — reused (just no longer player-visible during creation)

---

## UX Notes

### Pacing
The full flow should take 3-5 minutes for a player who reads everything. Each beat has a natural pause (image fading, text appearing) that creates rhythm without feeling slow. No beat should feel rushed or require a wall of text to read.

### Transitions
Every transition is a dissolve/fade, not a hard cut. The previous choice's image lingers as a ghost in the background of the next beat. By the Transformation, there are layers of ghosts — the player's journey is literally visible behind them.

### Audio
Each beat could have a subtle audio shift — the Stirring is near-silence, the Origin has warmth, the Drive has tension, the Transformation has cosmic resonance, the Reveal has a moment of clarity. This is aspirational for V1 — silence works fine initially.

### Viewport
All beats render within 1920x1080 with no scrolling (per viewport contract). Fragments are short enough that three fit comfortably. Images are sized to be evocative, not overwhelming.

### Replayability
Different Stirring images lead to genuinely different creation experiences. A player who picks "dark water" and one who picks "embers" will see different Origins, different Drives, and potentially different Hungers — even if they end up with the same sphere alignment. The *story* of how they got there is unique.

---

## Art Pipeline

All art is abstract, painterly, Threadbare aesthetic. No literal illustrations.

| Tier | Pieces | Style | Priority |
|------|--------|-------|----------|
| Stirring images | 4-6 | Large, atmospheric, deeply ambiguous | P0 — these set the first impression |
| Origin fragments | 12-24 | Smaller, more focused, evocative of place/time/identity | P0 — core of the experience |
| Drive fragments | 20-30 | Raw, emotional, intense | P0 — core of the experience |
| Hunger images | 8-12 | Cosmic, intense, less painterly, more raw energy | P0 — the climactic choice |
| Reveal portraits | 8-12 | Grand, composite feel, mortal warmth + divine intensity | P1 — can use Hunger images as V1 placeholder |

**Generation approach:** Use image generation tools with carefully constructed prompts per the Threadbare aesthetic (load `art-direction` skill). Abstract, no literal figures. Each piece should work at both full-screen and thumbnail scale.

---

## Open Questions for Content Authoring

1. **Fragment authoring:** Who writes the ~100 prose fragments? LLM-drafted with human editorial pass recommended — the tone must be consistent and the emotional register must escalate correctly across beats.
2. **Hunger balance:** Do all 8-12 Hungers produce equally viable playthroughs? Each needs a mandate with concrete, achievable win conditions tied to existing game systems.
3. **Reuse mapping:** How many Drive fragments can be shared across Origins without feeling generic? Target: 60% reusable, 40% Origin-specific.
4. **Art volume:** 50-80 abstract pieces is significant. Batch generation with consistent style prompts? Or hand-curated per piece?
5. **Testing:** How do we test that the funnel feels "inevitable" and not "random"? Playtest protocol needed — does the Hunger reveal feel earned by the prior choices?
