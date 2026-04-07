# Meet the First — Narrative Redesign

**Date:** 2026-04-06
**Status:** Design approved, pending implementation plan
**Supersedes:** `2026-04-06-meet-the-first-redesign.md` (mechanical flow), `2026-03-26-meet-the-first-design.md` (original)

## Vision

The Meet the First experience is the player's first act of divinity — choosing a mortal champion and igniting their potential. It must feel like **role-playing a god**, not filling out a character sheet. Every choice is presented through images, prose, and emotionally resonant dilemmas. No stats, no reach scores, no mechanical labels are ever visible to the player.

This flow immediately follows the Remembrance (Ascendant creation) and should feel like the **next chapter of the same experience** — same full-screen cinematic beats, same image-first presentation, same two-click interaction pattern, same Threadbare aesthetic. The Ascendant's Hunger, sphere alignment, and mortal echo color every line of prose and every candidate surfaced.

## Approach: Full-Screen Overlay Inside GameView

Replaces the current `MeetingEncounterModal` with a full-screen overlay rendered inside `GameView`, not a new App-level phase. The meeting flow needs access to the live `WorldGraph`, the meeting location, and `createAgentFromMeeting()` — all of which live inside GameView's scope. The overlay covers the game chrome entirely (same visual effect as a standalone phase) but stays mounted within GameView where it can read location/culture context and persist the agent/thread to the graph.

**Mounting pattern:** Same conditional render as today (`{meetingState && <MeetTheFirstFlow ... />}`), but `MeetTheFirstFlow` renders as a `fixed inset-0 z-50` overlay instead of a modal. GameView auto-pauses when the meeting is active (existing behavior).

---

## Emotional Arc

The four beats form a god-mortal relationship arc:

| Beat | Emotion | Duration | Player Action |
|------|---------|----------|---------------|
| 1. The Sensing | Curiosity | 30-60s | Choose a mortal from 3 vignettes |
| 2. The Testing | Investment | 60-90s | Guide the mortal through 2 dilemmas |
| 3. The Spark | Commitment | 30-60s | Choose a vision of who they could become |
| 4. The Bond | Recognition | 15-20s | Name them and release them into the world |

**Total: 2-4 minutes.** Quick enough to maintain momentum, slow enough to feel meaningful.

---

## Beat 1: The Sensing

### Opening

Full-screen dark (`#0a0a0f`). Prose fades in, colored by the Ascendant's Hunger:

> *"You reach out through the web of fates, feeling for a thread that hums with purpose. Three lives flicker at the edge of your sight."*

Hunger variants for the key phrase:
- **Gatherer:** "...a thread that hums with longing."
- **Witness:** "...a thread that glints with hidden truth."
- **Consume:** "...a thread that burns with hunger."
- **Reclaim:** "...a thread that trembles with loss."
- (One variant per Hunger)

### Candidate Presentation

**Layout: Spatial/Scattered** — matching the Remembrance `StirringBeat` pattern.

3 mortal vignette images float on a dark field at different positions, scales, and slight rotations. Each image is a **4:3 character portrait** showing a mortal at a pivotal life moment.

**Image sizing:** `min(1100px, 65vw)` base width at 4:3 aspect ratio (matching StirringBeat's large image treatment, adjusted for portrait aspect).

**Rest positions** (3 slots instead of StirringBeat's 4):

| Slot | x offset | y offset | Scale | Rotate |
|------|----------|----------|-------|--------|
| 0 | -28vw | -8vh | 0.85 | -1.5deg |
| 1 | 26vw | -4vh | 0.80 | 1.2deg |
| 2 | -2vw | 18vh | 0.88 | 0.6deg |

**Interaction — two-click (identical to StirringBeat):**
1. **Hover:** Image brightens slightly, scales up +0.06
2. **First click (focus):** Image centers at scale 1.1, full brightness. Others shrink, dim, blur. Prose vignette fades in below the image.
3. **Second click (confirm):** Image scales to 1.8, fades to opacity 0 with blur. Transition to Beat 2 after 1.2s.

**Prose vignette** (appears on focus): A paragraph describing the mortal — who they are, what moment the god is glimpsing. Written so that the mortal's hidden stats are implied by context:

> *"She counts coins like a general counts soldiers — each one a battle won. The merchants twice her age have learned not to underestimate the girl with ink-stained fingers and a ledger she guards like scripture."*

This tells the player: high Gold reach, sharp mind, ambitious. But they never see "Gold 4, Eye 2."

**Dissolved edges:** Radial gradient mask on images, identical to StirringBeat: `radial-gradient(ellipse 90% 85% at center, black 30%, transparent 95%)`.

### Behind the Scenes

- The Ascendant's **Hunger biases the candidate pool**. A Gatherer surfaces mortals at moments of isolation/belonging. A Witness surfaces mortals hiding truths.
- Each candidate has hidden: axiological profile, reach capabilities (primary 0.4, secondary 0.25, others 0.1 +/- variance), cooperation strategy.
- Reach affinities are derived from narrative context — the merchant has high Gold, the soldier has high Iron.
- 3 candidates are drawn from a pool of ~20-24 character archetypes, filtered by Hunger resonance.

---

## Beat 2: The Testing

### Transition In

The selected mortal's image fades. Brief god-voice bridge:

> *"The thread tightens. You look closer..."*

### Dilemma Presentation

**2 dilemmas**, presented one at a time. Each dilemma is a full-screen scene using **comic-panel composition**:

- **Background:** 16:9 location/encounter scene image (a crossroads, a burning village, a throne room)
- **Character overlay:** The mortal's 4:3 portrait, offset to the left or right third, with dissolved/masked edges blending into the scene. CSS layering with the character image positioned over the location backdrop.
- **Prose:** Setup text (3-5 sentences) describing the situation, rendered over a semi-transparent dark gradient at the bottom of the scene.
- **God-voice:** 1-2 sentences in italicized gold text, filtered through the Ascendant's Hunger perception style.

**Choices:** 2 per dilemma, presented as prose fragments below the scene — not buttons with labels, but sentences the player completes:

> *"She reaches for the blade..."*
> *"She drops to her knees and speaks a name she swore she'd forgotten..."*

Each choice is a clickable text block with subtle hover glow. No mechanical labels, no "+mercy" indicators.

**Transition between dilemmas:** Scene dissolves. God-voice bridge: *"Another moment surfaces..."* New scene paints in.

### Behind the Scenes

- Dilemmas are selected for **resonance with the Ascendant's Hunger** via `dilemmaResonanceTags`. The god encounters situations that echo their own transformation.
- Each choice accumulates: axiological profile shifts (+/- 0.15-0.3), founding gate tags, narrative trait seeds.
- Dilemmas drawn from `ENRICHED_DILEMMA_LIBRARY` (167 templates), filtered and scored by Hunger resonance.

---

## Beat 3: The Spark

### Transition In

Screen goes dark after the final dilemma. God-voice prose:

> *"Something has changed in them. You can feel it — a crack where the light gets in. What will you pour through it?"*

### Vision Presentation

**Layout: Spatial/Scattered** — same pattern as Beat 1 for consistent interaction.

3 vision images appear, each showing the mortal in a possible future. **Comic-panel composition:** 4:3 future-portrait of the mortal composited over a 16:9 scene of where that future takes them.

- Subtle color grading/glow tinted by the Ascendant's **primary sphere color**
- Slightly more luminous/ethereal aesthetic than Beats 1-2 — these are divine visions, not memories

**Example visions** (for the merchant girl):

| Vision | Image | Prose | Hidden Reward |
|--------|-------|-------|---------------|
| Explorer-Merchant | Woman at the prow of a ship, manifest in hand | *"A woman who maps the edges of the known world, her ledger now a catalog of wonders."* | Eye reach boost + navigation attachment |
| Power Broker | Figure in silk whispering in a king's ear | *"A spider at the center of a web of debts and favors, where every thread leads back to her counting house."* | Shadow reach boost + influence attachment |
| Benefactor | Traveler distributing bread from a cart | *"A woman who learned that the greatest profit is a full belly and a grateful name."* | Heart reach boost + provision attachment |

**Interaction — two-click (identical to Beat 1):**
1. Focus a vision — it centers, prose expands beneath it
2. Confirm — other visions dissolve away

### Behind the Scenes

- Each vision maps to: a reach investment direction, a trait package, and potentially a starter attachment (item/spell/bond).
- Vision options are generated based on the mortal's primary and secondary reaches combined with the Ascendant's sphere alignment.
- The player sees narrative futures; the engine applies mechanical rewards.

---

## Beat 4: The Bond

### Presentation

No choices — just recognition. Brief, resonant, final.

1. **The chosen Spark vision holds on screen**, slowly transitioning to a portrait framing of the mortal as they are now, at the threshold of becoming.
2. **God-voice prose** fades in, reflecting on the bond. Hunger-colored:
   - **Gatherer:** *"You will shelter them. They will be the first gathered under your wing."*
   - **Witness:** *"You will watch over them. Their truth will be the first you guard."*
   - **Consume:** *"You will feed on their fire. They will be the first to burn for you."*
   - (One variant per Hunger)
3. **The mortal's name** appears — generated from origin context, styled as an inscription (not a form field). The player can click to edit if they wish, but the default presentation is "this is their name."
4. **A narrative epithet** crystallizes who they are:
   > *"Mira of the Counting House — merchant's daughter, sharp-tongued, restless, destined for roads unknown."*
5. **A single button:** *"Let them walk."* — the mortal enters the world.

### Duration

15-20 seconds. The exhale after the Spark's climax.

### Behind the Scenes

- Agent node created in the world graph with all accumulated properties.
- `thread` edge established from Ascendant to mortal with `courtPosition: 'the_first'`.
- Full `meetingChoiceRecord` persisted for the journey engine.

---

## Art Budget

### Character Portraits (4:3)

| Category | Count | Description | Usage |
|----------|-------|-------------|-------|
| Candidate vignettes | 20-24 | Mortals at pivotal life moments | Beat 1 selection, composited into Beat 2 |
| Spark future portraits | 18-24 | Same mortals transformed, aspirational energy | Composited into Beat 3, post-Spark agent portrait |
| **Subtotal** | **38-48** | | |

Tagged by: reach affinity, archetype, emotional register.

### Scene/Location Backdrops (16:9)

| Category | Count | Description | Usage |
|----------|-------|-------------|-------|
| Dilemma scenes | 15-20 | Encounter environments (crossroads, burning village, throne room, etc.) | Beat 2 backgrounds |
| Spark vision scenes | 10-15 | Aspirational locations (ship's deck, court, shrine, frontier) | Beat 3 backgrounds |
| **Subtotal** | **25-35** | | |

Tagged by: emotional register, dilemma category, reach affinity.

### Total: ~63-83 unique images

All pre-baked static assets, Threadbare aesthetic, tagged for runtime selection.

### Comic-Panel Compositing

Character portraits (4:3) are composited over scene backdrops (16:9) at runtime using CSS layering:
- Character image offset to left or right third of the scene
- Dissolved/masked edges on the character layer to blend into the backdrop
- Any character can appear in any compatible scene, giving combinatorial variety

---

## Ascendant Lens Integration

The Ascendant's identity (created in the Remembrance flow) colors every aspect of the meeting:

| Lens Element | Where It Applies | How |
|-------------|------------------|-----|
| **Hunger** | Candidate filtering (Beat 1) | Biases which mortal archetypes surface |
| **Hunger** | God-voice prose (all beats) | Swappable phrases per Hunger in shared prose templates |
| **Hunger** | Dilemma selection (Beat 2) | `dilemmaResonanceTags` score which dilemmas surface |
| **Hunger** | Bond prose (Beat 4) | Hunger-specific closing narration |
| **Primary sphere** | Spark coloring (Beat 3) | Color grading/glow on vision images |
| **Perception style** | All prose | How the god describes what they see |
| **Mortal echo** | Dilemma resonance (Beat 2) | Dilemmas that mirror the god's own transformation |

---

## Component Architecture

```
MeetTheFirstFlow.tsx (master orchestrator, mirrors RemembranceFlow.tsx)
├── SensingBeat.tsx (Beat 1 — candidate selection)
│   ├── Spatial layout with 3 floating 4:3 images
│   ├── Two-click interaction (focus → confirm)
│   └── Prose vignette on focus
├── TestingBeat.tsx (Beat 2 — dilemmas)
│   ├── Comic-panel composition (16:9 scene + 4:3 character overlay)
│   ├── Prose + god-voice narration
│   └── Two prose-fragment choices per dilemma
├── SparkBeat.tsx (Beat 3 — future visions)
│   ├── Spatial layout with 3 floating composite images
│   ├── Two-click interaction (focus → confirm)
│   └── Sphere-tinted color grading
└── BondBeat.tsx (Beat 4 — confirmation)
    ├── Portrait transition from Spark vision
    ├── God-voice closing prose (Hunger-specific)
    ├── Name display with optional edit
    ├── Narrative epithet
    └── "Let them walk" button
```

### Engine Integration

- **Candidate generation:** `generateCandidates()` — filters by Hunger, assigns hidden stats from narrative context. Existing engine, needs Hunger filtering added.
- **Dilemma selection:** `selectDilemmas()` — scores by Hunger resonance tags. Existing engine, needs resonance scoring.
- **Spark resolution:** New — maps vision choice to reach investment + trait package + starter attachment.
- **Agent creation:** `createAgentFromMeeting()` — existing, creates agent node + thread edge.
- **Seeded PRNG:** All randomness deterministic, as per existing engine.

### Integration Point

Entry: `GameView.tsx` conditional render — same pattern as current `MeetingEncounterModal`. Triggered when `meetingState` is set (after Remembrance completes and GameView mounts with the initial world).
Exit: `onComplete(meetingResult)` → calls `createAgentFromMeeting()` against the live graph → sets `meetingState` to null → game begins.

The flow has full access to `gameState.graph`, the meeting location (from `meetingState.locationId`), and culture context — because it renders inside GameView, not before it.

---

## Mechanical Contract Changes

**This design supersedes the presentation layer AND modifies the mechanical step contract.** The existing state/result types from `meetingEncounter.ts` must evolve:

### Step 3 (Spark): Type Changes

The current state fields `sparkTraitId` and `investmentChoiceId` are replaced by a single `visionId` choice. The vision encapsulates both the trait and investment:

```typescript
// Current (removed)
sparkTraitId?: string;
investmentChoiceId?: string;

// New
sparkVisionId?: string;  // References a SparkVision from the vision catalog
```

Each `SparkVision` maps to concrete mechanical rewards:

```typescript
interface SparkVision {
  id: string;
  prose: string;                          // Player-facing narrative
  imageAssetPath: string;                 // 4:3 future portrait
  sceneAssetPath: string;                 // 16:9 backdrop
  reachInvestment: ReachDomain;           // Which reach gets boosted
  investmentAmount: number;               // How much (replaces investmentChoiceId)
  traitGrants: string[];                  // Replaces sparkTraitId
  starterAttachment?: string;             // Optional item/spell/bond template ID
  requiredPrimaryReach?: ReachDomain;     // Filters which visions appear for which candidates
}
```

### Step 4 (Bond): Type Changes

The current `shapePath: 'shape' | 'surprise'` field is removed. Beat 4 is no longer a branching choice — it's a confirmation beat. The mortal's identity was already shaped by the Spark vision choice.

```typescript
// Current (removed)
shapePath?: 'shape' | 'surprise';

// No replacement needed — Beat 4 has no mechanical choice
```

### MeetingChoiceRecord Evolution

The persisted `meetingChoiceRecord` on the thread edge must include:

```typescript
interface MeetingChoiceRecord {
  candidateIndex: number;              // Beat 1 choice
  dilemmaChoices: DilemmaChoiceRecord[]; // Beat 2 choices (unchanged)
  sparkVisionId: string;               // Beat 3 choice (replaces sparkTraitId + investmentChoiceId)
  // shapePath removed — no longer a choice
  // sparkTraitId removed — encoded in vision
  // investmentChoice removed — encoded in vision
}
```

### Backward Compatibility

No backward compatibility shim needed. Meet the First is a one-time creation flow — there are no persisted `meetingChoiceRecords` from prior sessions that need migration. The type change is clean.

---

## NFP Compliance

### Constants Table

| Constant | Default | Purpose |
|----------|---------|---------|
| `SENSING_REST_POSITIONS` | 3-slot array (see Beat 1) | Spatial layout for candidate images |
| `SENSING_IMAGE_WIDTH` | `min(1100px, 65vw)` | Base width of candidate portrait images |
| `SENSING_IMAGE_ASPECT` | `4/3` | Character portrait aspect ratio |
| `FOCUS_SCALE` | 1.1 | Scale when image is focused |
| `CONFIRM_SCALE` | 1.8 | Scale during confirm animation |
| `CONFIRM_DELAY_MS` | 1200 | Delay before transitioning after confirm |
| `DILEMMA_COUNT` | 2 | Number of dilemmas per encounter |
| `CANDIDATE_COUNT` | 3 | Number of mortal candidates surfaced |
| `SPARK_VISION_COUNT` | 3 | Number of future visions offered |
| `CANDIDATE_PRIMARY_REACH` | 0.4 | Hidden primary reach capability |
| `CANDIDATE_SECONDARY_REACH` | 0.25 | Hidden secondary reach capability |
| `CANDIDATE_BASE_REACH` | 0.1 | Hidden baseline for other reaches |
| `CANDIDATE_REACH_VARIANCE` | 0.08 | Random variance on reach values |
| `DILEMMA_PROFILE_SHIFT` | 0.15-0.3 | Axiological shift per dilemma choice |
| `SCENE_BG_COLOR` | `#0a0a0f` | Full-screen background color |

### Tracing

| Trace Type | Emitted When | Fields |
|-----------|-------------|--------|
| `meeting.sensing.candidates_surfaced` | Beat 1: candidates generated | `candidateIds`, `hungerId`, `seed` |
| `meeting.sensing.candidate_selected` | Beat 1: player confirms mortal | `candidateId`, `archetypeId` |
| `meeting.testing.dilemma_presented` | Beat 2: dilemma shown | `dilemmaId`, `resonanceScore` |
| `meeting.testing.dilemma_choice` | Beat 2: player picks choice | `dilemmaId`, `choiceIndex`, `profileShifts` |
| `meeting.spark.visions_presented` | Beat 3: visions shown | `visionIds`, `sphereAlignment` |
| `meeting.spark.vision_chosen` | Beat 3: player confirms vision | `visionId`, `reachInvestment`, `attachmentId` |
| `meeting.bond.completed` | Beat 4: player confirms | `agentId`, `mortalName`, `totalDuration` |

### PRNG Callouts

- Candidate generation: seeded from game seed + Ascendant identity hash
- Dilemma selection: seeded from game seed + candidate ID
- Vision generation: seeded from game seed + candidate ID + dilemma choice record
- All existing `createSeededRng(baseSeed, salt)` patterns apply

### Fail-Soft Table

| Failure | Fallback |
|---------|----------|
| Character art asset missing | Gradient placeholder (as in StirringBeat's `STIRRING_PLACEHOLDERS`) |
| Scene backdrop asset missing | Dark gradient with ambient color from sphere alignment |
| Fewer than 3 candidates match Hunger filter | Relax Hunger filter, draw from full pool |
| Dilemma library returns <2 resonant matches | Fall back to highest-scoring non-resonant dilemmas |
| Spark vision generation fails | Offer 2 visions instead of 3; minimum 2 |
| Name generation returns empty | Fall back to archetype-based name pool (existing) |

### Wiring

| Surface | Integration |
|---------|-------------|
| **Orchestrator phase** | No new orchestrator phase. Renders as a full-screen overlay inside `GameView.tsx` via existing conditional render pattern (`{meetingState && ...}`). |
| **UI component** | `MeetTheFirstFlow.tsx` replaces `MeetingEncounterModal.tsx` in GameView's JSX. Fixed overlay (`fixed inset-0 z-50`) instead of modal. |
| **GameState flow** | Receives `AscendantIdentity` from Remembrance (passed through App → GameView props) + reads `meetingState.locationId` from live graph → produces `MeetingEncounterResult` → calls `createAgentFromMeeting()` against live `gameState.graph`. |
| **Traces** | New `TraceCategory` entries required (see below). |
| **Debug visibility** | Meeting state inspectable via DebugPanel; CLI `spawn encounter-context` updated for testing. |
| **Player controls** | Two-click interaction (focus/confirm) on spatial images; prose-fragment choices on dilemmas; name edit on Bond beat. |
| **Prose pipeline** | No `enrichProse()` path. Meeting prose uses authored templates with Hunger-variant phrase slots, resolved at render time from the `AscendantLens`. This matches the current pattern — `MeetingEncounterModal` has never used `enrichProse`. Dilemma setup/godVoice text comes from `ENRICHED_DILEMMA_LIBRARY` templates as-is. |

### TraceCategory Additions

The following new categories must be added to `TraceCategory` in `src/types/trace.ts`:

```typescript
// Add to TraceCategory enum:
meeting_sensing = 'meeting_sensing',
meeting_testing = 'meeting_testing',
meeting_spark = 'meeting_spark',
meeting_bond = 'meeting_bond',
```

Each trace event from the Tracing table above uses one of these categories. The trace types themselves (e.g., `meeting.sensing.candidates_surfaced`) are the `type` field within the trace payload — the `TraceCategory` is the broad bucket for filtering in DebugPanel.

### Prerequisite Health

Before implementing, verify these upstream pipelines are producing output:

| Prerequisite | How to verify | Fallback if missing |
|-------------|---------------|---------------------|
| `ENRICHED_DILEMMA_LIBRARY` populated | Check `meeting-dilemma-library.ts` has entries | Use `DILEMMA_TEMPLATES` starter set from `meeting-content.ts` |
| `AscendantIdentity` passed to GameView | Remembrance flow → App.tsx → GameView props chain | Meeting cannot fire without identity; gate on identity presence |
| `meetingState.locationId` resolves to a valid location node | `graph.getNode(locationId)` returns a location with `locationSubtype` | Use the hero's current hex location as fallback |
| Hunger definitions exist | `HUNGER_CATALOG` or equivalent has all 10 hungers | Degrade to unfiltered candidate pool + generic god-voice prose |

---

## Relationship to Existing Redesign Docs

- **`2026-04-06-meet-the-first-redesign.md`** — Describes the mechanical flow (dilemma engine, resonance scoring, Ascendant Lens types). The engine architecture for candidate generation and dilemma selection remains valid. **This design supersedes the Step 3 (Spark) and Step 4 (Confirmation) mechanical contracts** — see "Mechanical Contract Changes" section above. The Step 1 intent-picker UI is also fully replaced (reach/sphere pickers → spatial image selection).
- **`2026-04-06-meet-the-first-redesign-implementation.md`** — The phased implementation plan. Phases 1-2 (cleanup + dilemma engine) are still applicable. **Phases 3-4 (UI + content) are fully superseded** by this design, including the step types and result shapes.
- **`2026-03-26-meet-the-first-open-questions.md`** — Several open questions are resolved by this design:
  - Variant generation: Hunger-biased candidate pool (resolved)
  - Prose budget: Full art + authored prose per beat (resolved)
  - Spark step: Vision-based future selection replacing trait/investment menus (resolved)
  - Shape/surprise branch: Removed — Beat 4 is confirmation only (resolved)
  - Remaining open: Founding Gates definition, non-First encounter universalization, attention mode mechanics (out of scope for this design)
