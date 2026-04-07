# Meet the First — Narrative Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mechanical Meet the First modal with a full-screen cinematic 4-beat flow (Sensing, Testing, Spark, Bond) that matches the Remembrance flow's narrative quality.

**Architecture:** Full-screen overlay inside GameView using the same spatial/scattered image layout and two-click interaction pattern as the Remembrance StirringBeat. Four new beat components orchestrated by MeetTheFirstFlow.tsx, backed by updated engine functions for Hunger-filtered candidate generation and vision-based Spark resolution.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, inline styles for animations (matching Remembrance patterns), seeded PRNG (mulberry32).

**Spec:** `Docs/plans/2026-04-06-meet-the-first-narrative-redesign.md`

---

## File Map

### New Files

| File | Responsibility |
|------|---------------|
| `src/components/MeetTheFirst/MeetTheFirstFlow.tsx` | Beat sequencer — orchestrates 4 beats, accumulates state, mirrors RemembranceFlow.tsx |
| `src/components/MeetTheFirst/SensingBeat.tsx` | Beat 1 — spatial candidate selection with two-click, mirrors StirringBeat.tsx |
| `src/components/MeetTheFirst/TestingBeat.tsx` | Beat 2 — dilemma presentation with comic-panel composition |
| `src/components/MeetTheFirst/SparkBeat.tsx` | Beat 3 — future vision selection with spatial layout |
| `src/components/MeetTheFirst/BondBeat.tsx` | Beat 4 — confirmation, name, epithet, release |
| `src/components/MeetTheFirst/ComicPanel.tsx` | Reusable 16:9 scene + 4:3 character overlay composite |
| `src/data/candidate-vignettes.ts` | Candidate archetype pool — prose, image paths, reach tags, Hunger resonance tags |
| `src/data/spark-vision-catalog.ts` | Vision definitions — prose, image paths, reach investment, trait grants |
| `src/data/meeting-narrative-prose.ts` | Hunger-variant god-voice templates for all beats |
| `src/engine/__tests__/meetTheFirstNarrative.test.ts` | Engine tests for Hunger filtering, vision generation, result building |
| `src/components/MeetTheFirst/__tests__/MeetTheFirstFlow.test.tsx` | Component tests for beat sequencing |

### Modified Files

| File | Changes |
|------|---------|
| `src/types/meetingEncounter.ts` | Replace `sparkTraitId`/`investmentChoiceId`/`shapePath` with `sparkVisionId`; update `MeetingChoiceRecord`; add `SparkVision` type; add `NarrativeCandidate` type |
| `src/types/trace.ts` | Add 4 meeting trace categories |
| `src/engine/meetingEncounter.ts` | Add `generateNarrativeCandidates()`, `generateSparkVisions()`, `buildNarrativeResult()`; keep `createAgentFromMeeting()` unchanged |
| `src/components/Game/GameView.tsx` | Replace `<MeetingEncounterModal>` with `<MeetTheFirstFlow>` |
| `src/data/meeting-art-library.ts` | Populate with placeholder gradients for candidates, scenes, visions |

---

## Task 1: Update Meeting Types

**Files:**
- Modify: `src/types/meetingEncounter.ts`
- Modify: `src/types/trace.ts`

- [ ] **Step 1: Add SparkVision and NarrativeCandidate types to meetingEncounter.ts**

Add these types after the existing `MeetingCandidate` type (around line 210):

```typescript
/** A candidate presented as a narrative vignette — no stats visible to the player. */
export interface NarrativeCandidate {
  /** Temp ID for this candidate (not yet a graph node). */
  tempId: string;
  /** Generated name. */
  name: string;
  /** Archetype from ARCHETYPE_NAME_MAP. */
  archetypeId: string;
  /** Culture from meeting location. */
  cultureId: string;
  /** Primary reach — derived from vignette archetype, never shown. */
  primaryReach: ReachDomain;
  /** Secondary reach — derived from vignette archetype, never shown. */
  secondaryReach: ReachDomain;
  /** Sphere alignment. */
  sphere: SphereName;
  /** Rich prose vignette — the player sees only this. */
  vignetteText: string;
  /** Narrative epithet (e.g. "merchant's daughter, sharp-tongued, restless"). */
  epithet: string;
  /** Path to 4:3 character portrait. */
  imageAssetPath: string;
  /** Gradient fallback when image is missing. */
  placeholderGradient: string;
  /** Hidden axiological profile. */
  axiologicalSeed: AxiologicalProfile;
  /** Hidden reach capabilities (0-1 range). */
  reachCapabilities: Record<ReachDomain, number>;
  /** Hidden cooperation strategy. */
  cooperationStrategy: CooperationStrategy;
  /** Appearance PRNG seed. */
  appearanceSeed: number;
}

/** A vision of the mortal's possible future — presented in Beat 3 (Spark). */
export interface SparkVision {
  /** Unique vision ID (e.g. 'vision.gold_eye.explorer'). */
  id: string;
  /** Player-facing narrative prose. */
  prose: string;
  /** Path to 4:3 future portrait. */
  portraitAssetPath: string;
  /** Path to 16:9 scene backdrop. */
  sceneAssetPath: string;
  /** Gradient fallback for portrait. */
  portraitPlaceholder: string;
  /** Gradient fallback for scene. */
  scenePlaceholder: string;
  /** Which reach gets boosted. */
  reachInvestment: ReachDomain;
  /** Boost amount (added to reach capability). */
  investmentAmount: number;
  /** Trait seeds granted. */
  traitGrants: string[];
  /** Optional starter attachment template ID. */
  starterAttachment?: string;
  /** Which primary reach this vision requires on the candidate. */
  requiredPrimaryReach?: ReachDomain;
  /** Which secondary reach this vision pairs with (optional filter). */
  requiredSecondaryReach?: ReachDomain;
}
```

- [ ] **Step 2: Update MeetingEncounterState — replace sparkTraitId/investmentChoiceId/shapePath**

Find the Step 3 and Step 4 result fields (around lines 136-145) and replace:

```typescript
// Replace these fields in MeetingEncounterState:

// OLD — remove:
// sparkTraitId?: string;
// investmentChoiceId?: string;
// shapePath?: 'shape' | 'surprise';

// NEW — add:
/** Beat 1: narrative candidates (replaces intent-based candidates). */
narrativeCandidates?: NarrativeCandidate[];
/** Beat 3: available spark visions for the selected candidate. */
sparkVisions?: SparkVision[];
/** Beat 3: player's chosen spark vision ID. */
sparkVisionId?: string;
```

Also remove `intentPrimaryReach`, `intentSecondaryReach`, `intentSphere` — these are no longer player choices (they're derived from the narrative candidate):

```typescript
// OLD — remove:
// intentPrimaryReach?: ReachDomain;
// intentSecondaryReach?: ReachDomain;
// intentSphere?: SphereName;
```

- [ ] **Step 3: Update MeetingChoiceRecord**

Find `MeetingChoiceRecord` (around line 351) and replace with:

```typescript
export interface MeetingChoiceRecord {
  encounterTick: number;
  locationId: string;
  candidateIndex: number;
  archetypeId: string;
  dilemmaChoices: DilemmaChoiceRecord[];
  sparkVisionId: string;
  ascendantSphere: SphereName;
  foundingGateTags: string[];
}
```

Remove the old fields: `intentPrimaryReach`, `intentSecondaryReach`, `intentSphere`, `investmentChoice`, `sparkTraitId`, `shapePath`, `flavorChoices`.

- [ ] **Step 4: Update MeetingStep type**

Replace the MeetingStep type (should be around line 10):

```typescript
// OLD:
// export type MeetingStep = 'seeking_threads' | 'defining_moment' | 'the_spark' | 'confirmation';

// NEW:
export type MeetingStep = 'sensing' | 'testing' | 'spark' | 'bond';
```

- [ ] **Step 5: Add meeting trace categories to trace.ts**

Read the `TraceCategory` type union in `src/types/trace.ts` and add these 4 new entries at the end:

```typescript
| 'meeting_sensing'
| 'meeting_testing'
| 'meeting_spark'
| 'meeting_bond'
```

- [ ] **Step 6: Run type check to see what breaks**

Run: `npx tsc --noEmit 2>&1 | head -80`

Expected: Multiple type errors in `meetingEncounter.ts`, `MeetingEncounterModal.tsx`, and `GameView.tsx` referencing the removed fields. This is expected — we'll fix the engine in Task 2 and the UI in Tasks 4-8.

- [ ] **Step 7: Commit type changes**

```bash
git add src/types/meetingEncounter.ts src/types/trace.ts
git commit -m "feat(meeting): update types for narrative redesign

Replace sparkTraitId/investmentChoiceId/shapePath with sparkVisionId.
Add NarrativeCandidate and SparkVision types.
Update MeetingChoiceRecord. Add meeting trace categories.
Rename MeetingStep values to sensing/testing/spark/bond.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Create Narrative Content Data

**Files:**
- Create: `src/data/candidate-vignettes.ts`
- Create: `src/data/spark-vision-catalog.ts`
- Create: `src/data/meeting-narrative-prose.ts`
- Modify: `src/data/meeting-art-library.ts`

- [ ] **Step 1: Create candidate vignette pool**

Create `src/data/candidate-vignettes.ts` with 24 candidate archetypes covering all 8 reaches as primary (3 per reach). Each has prose, reach tags, and Hunger resonance tags.

```typescript
import type { ReachDomain, SphereName } from '../types/graph';

export interface CandidateVignette {
  /** Unique ID (e.g. 'vignette.iron.sentinel'). */
  id: string;
  /** Display name template (will be replaced with generated name). */
  archetypeLabel: string;
  /** The primary reach this vignette implies. */
  primaryReach: ReachDomain;
  /** The secondary reach this vignette implies. */
  secondaryReach: ReachDomain;
  /** Narrative epithet (e.g. "blacksmith's son, broad-shouldered, stubborn"). */
  epithet: string;
  /** Rich prose vignette — the scene the god glimpses. */
  prose: string;
  /** 4:3 character portrait path. */
  imageAssetPath: string;
  /** Gradient fallback. */
  placeholderGradient: string;
  /** Hunger IDs this vignette resonates with (for filtering). */
  hungerResonance: string[];
  /** Emotional tags for art matching. */
  emotionalTags: string[];
}

/**
 * 24 candidate vignettes — 3 per primary reach.
 * The Ascendant's Hunger filters this pool to surface 3 candidates.
 */
export const CANDIDATE_VIGNETTES: readonly CandidateVignette[] = [
  // ─── Iron (3) ───
  {
    id: 'vignette.iron.sentinel',
    archetypeLabel: 'Sentinel',
    primaryReach: 'iron',
    secondaryReach: 'stone',
    epithet: "wall-watcher, scarred hands, unflinching",
    prose: "She stands on the wall through the third night, long after the others have gone to warm their hands by the fire. The wind cuts through her cloak but she does not move. Below, in the dark, something is watching back — and she knows it.",
    imageAssetPath: '/assets/meeting/candidates/iron-sentinel.webp',
    placeholderGradient: 'linear-gradient(135deg, #2a1a1a, #3a2020, #1a0a0a)',
    hungerResonance: ['hunger.preserve', 'hunger.bind', 'hunger.reclaim'],
    emotionalTags: ['duty', 'endurance', 'isolation'],
  },
  {
    id: 'vignette.iron.champion',
    archetypeLabel: 'Champion',
    primaryReach: 'iron',
    secondaryReach: 'heart',
    epithet: "pit fighter, loyal to a fault, someone's last hope",
    prose: "The crowd roars his name but he is not listening. His eyes are on the woman in the third row — the one who bet everything she had on him. He spits blood, raises his fists, and finds in himself something that should have been spent an hour ago.",
    imageAssetPath: '/assets/meeting/candidates/iron-champion.webp',
    placeholderGradient: 'linear-gradient(135deg, #3a1a0a, #2a1010, #1a0a0a)',
    hungerResonance: ['hunger.gather', 'hunger.kindle', 'hunger.reclaim'],
    emotionalTags: ['sacrifice', 'loyalty', 'strength'],
  },
  {
    id: 'vignette.iron.tactician',
    archetypeLabel: 'Tactician',
    primaryReach: 'iron',
    secondaryReach: 'eye',
    epithet: "young officer, cold eyes, three steps ahead",
    prose: "She has drawn the battle six times on the sand table and won it six different ways. Her commander laughs and calls it a game. She does not laugh. When the horns sound at dawn, every piece will be where she placed it — and every death will be one she calculated.",
    imageAssetPath: '/assets/meeting/candidates/iron-tactician.webp',
    placeholderGradient: 'linear-gradient(135deg, #1a1a2a, #2a1a1a, #0a0a1a)',
    hungerResonance: ['hunger.reshape', 'hunger.sever', 'hunger.witness'],
    emotionalTags: ['control', 'intellect', 'ruthlessness'],
  },

  // ─── Gold (3) ───
  {
    id: 'vignette.gold.merchant',
    archetypeLabel: 'Merchant',
    primaryReach: 'gold',
    secondaryReach: 'eye',
    epithet: "merchant's daughter, ink-stained fingers, sharp-tongued",
    prose: "She counts coins like a general counts soldiers — each one a battle won. The merchants twice her age have learned not to underestimate the girl with ink-stained fingers and a ledger she guards like scripture.",
    imageAssetPath: '/assets/meeting/candidates/gold-merchant.webp',
    placeholderGradient: 'linear-gradient(135deg, #2a2a0a, #3a2a1a, #1a1a0a)',
    hungerResonance: ['hunger.gather', 'hunger.reshape', 'hunger.wander'],
    emotionalTags: ['ambition', 'cunning', 'commerce'],
  },
  {
    id: 'vignette.gold.patron',
    archetypeLabel: 'Patron',
    primaryReach: 'gold',
    secondaryReach: 'heart',
    epithet: "aging benefactor, weary smile, pockets lighter than his conscience",
    prose: "He has given away three fortunes and built four orphanages and he still cannot sleep. There is a child somewhere in this city who is hungry tonight, and he knows it, and the knowing is a wound that gold alone cannot close.",
    imageAssetPath: '/assets/meeting/candidates/gold-patron.webp',
    placeholderGradient: 'linear-gradient(135deg, #2a2a1a, #1a2a1a, #2a1a0a)',
    hungerResonance: ['hunger.gather', 'hunger.kindle', 'hunger.preserve'],
    emotionalTags: ['generosity', 'guilt', 'compassion'],
  },
  {
    id: 'vignette.gold.smuggler',
    archetypeLabel: 'Smuggler',
    primaryReach: 'gold',
    secondaryReach: 'shadow',
    epithet: "river rat, quick hands, debts on both sides of the border",
    prose: "The barrels are labeled salt but they hold something that will save thirty lives if he can get them past the checkpoint. He has done this seventeen times. He has been caught twice. The third time, they said, there will be no trial.",
    imageAssetPath: '/assets/meeting/candidates/gold-smuggler.webp',
    placeholderGradient: 'linear-gradient(135deg, #1a1a0a, #2a1a1a, #0a1a0a)',
    hungerResonance: ['hunger.wander', 'hunger.sever', 'hunger.consume'],
    emotionalTags: ['risk', 'resourcefulness', 'moral_grey'],
  },

  // ─── Shadow (3) ───
  {
    id: 'vignette.shadow.infiltrator',
    archetypeLabel: 'Infiltrator',
    primaryReach: 'shadow',
    secondaryReach: 'eye',
    epithet: "nobody's friend, everybody's confidant, a face for every room",
    prose: "She has worn so many names she sometimes forgets which face is hers. Tonight she is a servant in a lord's house. Tomorrow she will be a priestess at the gate. The truth is a luxury she traded away years ago — and she has never once missed it.",
    imageAssetPath: '/assets/meeting/candidates/shadow-infiltrator.webp',
    placeholderGradient: 'linear-gradient(135deg, #0a0a1a, #1a0a2a, #0a0a0a)',
    hungerResonance: ['hunger.witness', 'hunger.sever', 'hunger.consume'],
    emotionalTags: ['deception', 'identity', 'loss'],
  },
  {
    id: 'vignette.shadow.saboteur',
    archetypeLabel: 'Saboteur',
    primaryReach: 'shadow',
    secondaryReach: 'iron',
    epithet: "quiet hands, a grudge that burns cold, patient",
    prose: "He loosens the third bolt on the gate mechanism and pockets it. Nobody will notice until the siege engines come. By then he will be in the next town, drinking ale with the men who paid him. He does not hate the people behind this wall. He simply does not think of them at all.",
    imageAssetPath: '/assets/meeting/candidates/shadow-saboteur.webp',
    placeholderGradient: 'linear-gradient(135deg, #1a0a0a, #0a0a1a, #1a1a1a)',
    hungerResonance: ['hunger.sever', 'hunger.reshape', 'hunger.reclaim'],
    emotionalTags: ['betrayal', 'precision', 'detachment'],
  },
  {
    id: 'vignette.shadow.manipulator',
    archetypeLabel: 'Manipulator',
    primaryReach: 'shadow',
    secondaryReach: 'heart',
    epithet: "the one who listens, the one who remembers, the one you should not have trusted",
    prose: "She remembers every secret anyone has ever told her. Not because she tries — because she cannot help it. Each confession is a thread, and she holds them all, and the web she weaves is the only thing that has ever made her feel safe.",
    imageAssetPath: '/assets/meeting/candidates/shadow-manipulator.webp',
    placeholderGradient: 'linear-gradient(135deg, #1a0a1a, #2a0a1a, #0a0a1a)',
    hungerResonance: ['hunger.bind', 'hunger.gather', 'hunger.witness'],
    emotionalTags: ['control', 'vulnerability', 'secrets'],
  },

  // ─── Veil (3) ───
  {
    id: 'vignette.veil.diviner',
    archetypeLabel: 'Diviner',
    primaryReach: 'veil',
    secondaryReach: 'eye',
    epithet: "touched since birth, feared by her village, always right",
    prose: "She told them the river would flood. They did not listen. She told them the child would be born wrong. They drove her out. Now she sits at the crossroads and speaks only when asked, and the asking costs more than most can afford.",
    imageAssetPath: '/assets/meeting/candidates/veil-diviner.webp',
    placeholderGradient: 'linear-gradient(135deg, #1a0a2a, #2a1a3a, #0a0a1a)',
    hungerResonance: ['hunger.witness', 'hunger.illuminate', 'hunger.sever'],
    emotionalTags: ['isolation', 'truth', 'power'],
  },
  {
    id: 'vignette.veil.runecaster',
    archetypeLabel: 'Runecaster',
    primaryReach: 'veil',
    secondaryReach: 'stone',
    epithet: "mountain-born, ink under her nails, speaks to the rock",
    prose: "The symbols she carves into the stone are older than the language anyone speaks. She learned them from her grandmother, who learned them from the mountain itself. When she traces the last line, the stone hums, and something beneath the earth shifts in its sleep.",
    imageAssetPath: '/assets/meeting/candidates/veil-runecaster.webp',
    placeholderGradient: 'linear-gradient(135deg, #1a1a2a, #2a2a3a, #1a0a1a)',
    hungerResonance: ['hunger.preserve', 'hunger.bind', 'hunger.reshape'],
    emotionalTags: ['tradition', 'craft', 'ancient_power'],
  },
  {
    id: 'vignette.veil.empath',
    archetypeLabel: 'Empath',
    primaryReach: 'veil',
    secondaryReach: 'heart',
    epithet: "healer who feels too much, cracked hands, kind eyes",
    prose: "She lays her hands on the fevered child and feels the sickness move into her own blood. It will pass — it always does — but for a moment she carries someone else's dying, and the weight of it is a prayer she has never learned to stop making.",
    imageAssetPath: '/assets/meeting/candidates/veil-empath.webp',
    placeholderGradient: 'linear-gradient(135deg, #1a1a2a, #1a2a2a, #1a0a2a)',
    hungerResonance: ['hunger.gather', 'hunger.kindle', 'hunger.haunt'],
    emotionalTags: ['empathy', 'sacrifice', 'healing'],
  },

  // ─── Heart (3) ───
  {
    id: 'vignette.heart.demagogue',
    archetypeLabel: 'Demagogue',
    primaryReach: 'heart',
    secondaryReach: 'gold',
    epithet: "born poor, speaks fire, the crowd hangs on every word",
    prose: "He has never owned anything except his voice, and it is enough. When he stands on the crate in the market square and speaks of bread and dignity, even the guards stop to listen. They will not stop him today. Tomorrow is another matter.",
    imageAssetPath: '/assets/meeting/candidates/heart-demagogue.webp',
    placeholderGradient: 'linear-gradient(135deg, #2a1a0a, #3a1a1a, #1a0a0a)',
    hungerResonance: ['hunger.kindle', 'hunger.gather', 'hunger.reclaim'],
    emotionalTags: ['passion', 'justice', 'charisma'],
  },
  {
    id: 'vignette.heart.counselor',
    archetypeLabel: 'Counselor',
    primaryReach: 'heart',
    secondaryReach: 'eye',
    epithet: "quiet authority, the one they come to after midnight",
    prose: "She does not give advice. She asks questions — the kind that make you sit very still and reconsider every choice you have made this year. The king's counselors hate her. The king cannot rule without her. She has never wanted power, which is precisely why she has it.",
    imageAssetPath: '/assets/meeting/candidates/heart-counselor.webp',
    placeholderGradient: 'linear-gradient(135deg, #1a2a1a, #2a2a1a, #0a1a0a)',
    hungerResonance: ['hunger.witness', 'hunger.reshape', 'hunger.preserve'],
    emotionalTags: ['wisdom', 'influence', 'restraint'],
  },
  {
    id: 'vignette.heart.martyr',
    archetypeLabel: 'Martyr',
    primaryReach: 'heart',
    secondaryReach: 'star',
    epithet: "the one who stays, the one who burns, the one they'll remember",
    prose: "They told her to run. She heard them. She understood them. She turned back toward the fire anyway, because inside it there were still voices calling for help, and she has never been able to walk away from a voice that needs answering.",
    imageAssetPath: '/assets/meeting/candidates/heart-martyr.webp',
    placeholderGradient: 'linear-gradient(135deg, #2a0a0a, #2a1a1a, #3a0a0a)',
    hungerResonance: ['hunger.kindle', 'hunger.gather', 'hunger.consume'],
    emotionalTags: ['sacrifice', 'conviction', 'fire'],
  },

  // ─── Eye (3) ───
  {
    id: 'vignette.eye.cartographer',
    archetypeLabel: 'Cartographer',
    primaryReach: 'eye',
    secondaryReach: 'stone',
    epithet: "map-maker, restless feet, sees what others walk past",
    prose: "He measures the world in paces and angles, marking distances on hide with a charcoal nub worn to his fingertips. The map he carries is more accurate than the king's, and the blank spaces on it trouble him more than the filled ones ever could.",
    imageAssetPath: '/assets/meeting/candidates/eye-cartographer.webp',
    placeholderGradient: 'linear-gradient(135deg, #0a1a2a, #1a2a2a, #0a0a1a)',
    hungerResonance: ['hunger.wander', 'hunger.witness', 'hunger.preserve'],
    emotionalTags: ['curiosity', 'precision', 'exploration'],
  },
  {
    id: 'vignette.eye.oracle',
    archetypeLabel: 'Oracle',
    primaryReach: 'eye',
    secondaryReach: 'veil',
    epithet: "sees too far, speaks in riddles, trusted by no one and consulted by all",
    prose: "The visions come whether she wants them or not. Last night she saw a city burning. The night before, a child who will be king. She writes them all down in a book no one else can read, and waits for the world to catch up to what she already knows.",
    imageAssetPath: '/assets/meeting/candidates/eye-oracle.webp',
    placeholderGradient: 'linear-gradient(135deg, #0a0a2a, #1a1a3a, #0a1a2a)',
    hungerResonance: ['hunger.witness', 'hunger.illuminate', 'hunger.haunt'],
    emotionalTags: ['prophecy', 'burden', 'truth'],
  },
  {
    id: 'vignette.eye.scout',
    archetypeLabel: 'Scout',
    primaryReach: 'eye',
    secondaryReach: 'shadow',
    epithet: "light-footed, sharp-eyed, always the first to know and last to be seen",
    prose: "She has been watching the warband for three days from the ridgeline. She knows how many they are, how they sleep, which ones drink too much. When she returns to camp with her report, the general will ask how she knows. She will shrug. The truth is that she simply pays attention.",
    imageAssetPath: '/assets/meeting/candidates/eye-scout.webp',
    placeholderGradient: 'linear-gradient(135deg, #0a1a0a, #1a2a1a, #0a0a0a)',
    hungerResonance: ['hunger.wander', 'hunger.sever', 'hunger.witness'],
    emotionalTags: ['stealth', 'observation', 'independence'],
  },

  // ─── Stone (3) ───
  {
    id: 'vignette.stone.mason',
    archetypeLabel: 'Mason',
    primaryReach: 'stone',
    secondaryReach: 'gold',
    epithet: "builds things that last, calloused hands, stubborn as the rock he shapes",
    prose: "The wall he is building will stand for a hundred years. He knows this because the wall his grandfather built still stands, and he learned from watching those stones settle into the earth like they had always been there. He does not build quickly. He builds forever.",
    imageAssetPath: '/assets/meeting/candidates/stone-mason.webp',
    placeholderGradient: 'linear-gradient(135deg, #1a1a1a, #2a2a2a, #1a1a0a)',
    hungerResonance: ['hunger.preserve', 'hunger.bind', 'hunger.reshape'],
    emotionalTags: ['craft', 'patience', 'legacy'],
  },
  {
    id: 'vignette.stone.elder',
    archetypeLabel: 'Elder',
    primaryReach: 'stone',
    secondaryReach: 'heart',
    epithet: "village anchor, remembers the old ways, voice like settling earth",
    prose: "She has buried three husbands and raised seven children and she is not done yet. When the young ones argue about the well rights, they come to her, and she settles it not with law but with memory — the memory of who dug that well, and why, and what they asked in return.",
    imageAssetPath: '/assets/meeting/candidates/stone-elder.webp',
    placeholderGradient: 'linear-gradient(135deg, #2a1a1a, #1a1a1a, #2a2a1a)',
    hungerResonance: ['hunger.preserve', 'hunger.gather', 'hunger.bind'],
    emotionalTags: ['tradition', 'authority', 'community'],
  },
  {
    id: 'vignette.stone.geomancer',
    archetypeLabel: 'Geomancer',
    primaryReach: 'stone',
    secondaryReach: 'eye',
    epithet: "reads the bones of the earth, quiet, knows where the water runs",
    prose: "He presses his palm to the ground and listens. Others hear nothing. He hears the aquifer shifting thirty feet below, the fault line murmuring a mile to the east, the foundations of the old temple groaning under a weight they were never built to bear.",
    imageAssetPath: '/assets/meeting/candidates/stone-geomancer.webp',
    placeholderGradient: 'linear-gradient(135deg, #1a1a0a, #1a2a1a, #0a1a1a)',
    hungerResonance: ['hunger.witness', 'hunger.preserve', 'hunger.wander'],
    emotionalTags: ['perception', 'earth', 'hidden_knowledge'],
  },

  // ─── Star (3) ───
  {
    id: 'vignette.star.templar',
    archetypeLabel: 'Templar',
    primaryReach: 'star',
    secondaryReach: 'iron',
    epithet: "faith made flesh, armored in conviction, eyes like burning scripture",
    prose: "He kneels in the mud before the ruined shrine and prays to a god he has never heard answer. The bandits are coming. His sword is ready. He does not know if he will survive the dawn, but he knows — with a certainty that moves his bones — that this ground is holy, and he will not let it be profaned.",
    imageAssetPath: '/assets/meeting/candidates/star-templar.webp',
    placeholderGradient: 'linear-gradient(135deg, #2a2a1a, #3a2a0a, #1a1a0a)',
    hungerResonance: ['hunger.reclaim', 'hunger.kindle', 'hunger.preserve'],
    emotionalTags: ['faith', 'duty', 'fire'],
  },
  {
    id: 'vignette.star.seer',
    archetypeLabel: 'Seer',
    primaryReach: 'star',
    secondaryReach: 'eye',
    epithet: "reads the stars, speaks softly, the weight of knowing things too early",
    prose: "She has told the village three truths and two of them have already come to pass. The third — the one about the harvest — she wishes she could take back. But the stars do not lie, and neither does she, and the price of that honesty is a loneliness that no amount of being right can cure.",
    imageAssetPath: '/assets/meeting/candidates/star-seer.webp',
    placeholderGradient: 'linear-gradient(135deg, #1a1a2a, #2a2a3a, #1a1a1a)',
    hungerResonance: ['hunger.illuminate', 'hunger.witness', 'hunger.haunt'],
    emotionalTags: ['prophecy', 'isolation', 'truth'],
  },
  {
    id: 'vignette.star.apostle',
    archetypeLabel: 'Apostle',
    primaryReach: 'star',
    secondaryReach: 'heart',
    epithet: "wandering preacher, open hands, believes in something nobody else can see yet",
    prose: "He walked into the plague village when everyone else was walking out. He had no medicine, no training, no plan — only a conviction that suffering should not be faced alone. Three weeks later, half of them are dead. The other half call him a saint. He calls himself lucky, and means it.",
    imageAssetPath: '/assets/meeting/candidates/star-apostle.webp',
    placeholderGradient: 'linear-gradient(135deg, #2a1a2a, #2a2a1a, #1a0a1a)',
    hungerResonance: ['hunger.gather', 'hunger.kindle', 'hunger.consume'],
    emotionalTags: ['faith', 'compassion', 'recklessness'],
  },
];
```

- [ ] **Step 2: Create Hunger-variant prose templates**

Create `src/data/meeting-narrative-prose.ts`:

```typescript
/**
 * Hunger-variant god-voice prose for all Meeting beats.
 * Each template has a shared structure with Hunger-specific phrase slots.
 */

/** Beat 1 opening prose — the god reaches out through fate. */
export const SENSING_OPENING_PROSE: Record<string, string> = {
  'hunger.gather':   'You reach out through the web of fates, feeling for a thread that hums with longing. Three lives flicker at the edge of your sight.',
  'hunger.witness':  'You reach out through the web of fates, feeling for a thread that glints with hidden truth. Three lives flicker at the edge of your sight.',
  'hunger.preserve': 'You reach out through the web of fates, feeling for a thread that holds against the wind. Three lives flicker at the edge of your sight.',
  'hunger.reshape':  'You reach out through the web of fates, feeling for a thread that strains to become something new. Three lives flicker at the edge of your sight.',
  'hunger.reclaim':  'You reach out through the web of fates, feeling for a thread that trembles with loss. Three lives flicker at the edge of your sight.',
  'hunger.consume':  'You reach out through the web of fates, feeling for a thread that burns with hunger. Three lives flicker at the edge of your sight.',
  'hunger.sever':    'You reach out through the web of fates, feeling for a thread that cuts against the weave. Three lives flicker at the edge of your sight.',
  'hunger.kindle':   'You reach out through the web of fates, feeling for a thread that sparks with unspent fire. Three lives flicker at the edge of your sight.',
  'hunger.bind':     'You reach out through the web of fates, feeling for a thread that reaches for others. Three lives flicker at the edge of your sight.',
  'hunger.wander':   'You reach out through the web of fates, feeling for a thread that pulls toward the horizon. Three lives flicker at the edge of your sight.',
  'hunger.haunt':    'You reach out through the web of fates, feeling for a thread that echoes with the past. Three lives flicker at the edge of your sight.',
  'hunger.illuminate': 'You reach out through the web of fates, feeling for a thread that shines with clarity. Three lives flicker at the edge of your sight.',
};

/** Fallback if Hunger not found. */
export const SENSING_OPENING_FALLBACK = 'You reach out through the web of fates, feeling for a thread that hums with purpose. Three lives flicker at the edge of your sight.';

/** Beat 1 focus prompt. */
export const SENSING_FOCUS_PROMPT = 'Click again to choose. Or reach for another.';
export const SENSING_REST_PROMPT = 'Something stirs in the web of fate. Who calls to you?';

/** Beat 2 transition prose. */
export const TESTING_TRANSITION_IN = 'The thread tightens. You look closer...';
export const TESTING_BETWEEN_DILEMMAS = 'Another moment surfaces...';

/** Beat 3 transition prose. */
export const SPARK_TRANSITION_IN = 'Something has changed in them. You can feel it — a crack where the light gets in. What will you pour through it?';

/** Beat 4 bond prose — Hunger-specific. */
export const BOND_PROSE: Record<string, string> = {
  'hunger.gather':   'You will shelter them. They will be the first gathered under your wing.',
  'hunger.witness':  'You will watch over them. Their truth will be the first you guard.',
  'hunger.preserve': 'You will hold them against the tide. They will be the first you keep from fading.',
  'hunger.reshape':  'You will push them toward what they could be. They will be the first you reshape.',
  'hunger.reclaim':  'You will restore what was taken from them. They will be the first you reclaim.',
  'hunger.consume':  'You will feed on their fire. They will be the first to burn for you.',
  'hunger.sever':    'You will cut them free from what holds them. They will be the first you liberate.',
  'hunger.kindle':   'You will fan the flame within them. They will be the first you set alight.',
  'hunger.bind':     'You will weave them into your design. They will be the first thread in your tapestry.',
  'hunger.wander':   'You will set them on the road. They will be the first to walk your uncharted path.',
  'hunger.haunt':    'You will echo through their dreams. They will be the first to hear your voice in the dark.',
  'hunger.illuminate': 'You will show them what others cannot see. They will be the first to carry your light.',
};

export const BOND_PROSE_FALLBACK = 'The thread is woven. They are the first.';

/** Beat 4 release button text. */
export const BOND_RELEASE_TEXT = 'Let them walk.';
```

- [ ] **Step 3: Create spark vision catalog**

Create `src/data/spark-vision-catalog.ts`. Each reach gets 3 visions — one for each secondary reach direction the vision could push toward.

```typescript
import type { SparkVision } from '../types/meetingEncounter';

/**
 * Spark visions — 3 possible futures per primary reach (24 total).
 * At runtime, 3 are selected based on the candidate's primary reach +
 * the Ascendant's sphere alignment for tinting.
 */
export const SPARK_VISION_CATALOG: readonly SparkVision[] = [
  // ─── Iron primary visions ───
  {
    id: 'vision.iron.warlord',
    prose: 'A figure in battered armor stands atop a hill of broken shields. Behind them, an army that was scattered yesterday marches as one. They did not conquer this loyalty — they earned it, scar by scar.',
    portraitAssetPath: '/assets/meeting/visions/iron-warlord.webp',
    sceneAssetPath: '/assets/meeting/scenes/battlefield-dawn.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #3a1a0a, #2a0a0a)',
    scenePlaceholder: 'linear-gradient(135deg, #2a1a0a, #1a0a0a, #3a2a1a)',
    reachInvestment: 'heart',
    investmentAmount: 0.15,
    traitGrants: ['commanding_presence', 'earned_loyalty'],
    requiredPrimaryReach: 'iron',
  },
  {
    id: 'vision.iron.duelist',
    prose: 'A lone blade in a moonlit courtyard. They have refused every offer of command, every title, every alliance. What they want is simpler and more dangerous — to be the best, and to know it, and to carry that knowledge like a weapon no one else can lift.',
    portraitAssetPath: '/assets/meeting/visions/iron-duelist.webp',
    sceneAssetPath: '/assets/meeting/scenes/moonlit-courtyard.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #1a1a2a, #2a1a2a)',
    scenePlaceholder: 'linear-gradient(135deg, #0a0a1a, #1a1a2a, #0a0a2a)',
    reachInvestment: 'eye',
    investmentAmount: 0.15,
    traitGrants: ['razor_focus', 'solitary_mastery'],
    requiredPrimaryReach: 'iron',
  },
  {
    id: 'vision.iron.bulwark',
    prose: 'A wall of flesh and iron stands between the village and the thing that came from the dark. They do not advance. They do not retreat. They become the ground itself — immovable, unbreaking, a promise made in blood and stone.',
    portraitAssetPath: '/assets/meeting/visions/iron-bulwark.webp',
    sceneAssetPath: '/assets/meeting/scenes/village-gate-night.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #2a1a1a, #1a1a1a)',
    scenePlaceholder: 'linear-gradient(135deg, #1a0a0a, #0a0a0a, #2a1a0a)',
    reachInvestment: 'stone',
    investmentAmount: 0.15,
    traitGrants: ['unbreakable_will', 'guardian_instinct'],
    requiredPrimaryReach: 'iron',
  },

  // ─── Gold primary visions ───
  {
    id: 'vision.gold.explorer',
    prose: 'A woman standing at the prow of a ship, manifest in hand, eyes fixed on a coast no trader has reached. Her ledger is now a catalog of wonders — and every wonder has a price she intends to be the first to name.',
    portraitAssetPath: '/assets/meeting/visions/gold-explorer.webp',
    sceneAssetPath: '/assets/meeting/scenes/ship-horizon.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #2a2a1a, #1a2a2a)',
    scenePlaceholder: 'linear-gradient(135deg, #0a1a2a, #1a2a3a, #0a0a1a)',
    reachInvestment: 'eye',
    investmentAmount: 0.15,
    traitGrants: ['horizon_hunger', 'first_to_market'],
    requiredPrimaryReach: 'gold',
  },
  {
    id: 'vision.gold.powerbroker',
    prose: 'A spider at the center of a web of debts and favors, where every thread leads back to her counting house. Kings borrow from her. Wars end when she calls in her ledgers. She has never held a sword — she has never needed to.',
    portraitAssetPath: '/assets/meeting/visions/gold-powerbroker.webp',
    sceneAssetPath: '/assets/meeting/scenes/throne-room-shadows.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #2a1a0a, #1a0a1a)',
    scenePlaceholder: 'linear-gradient(135deg, #1a1a1a, #2a1a1a, #0a0a0a)',
    reachInvestment: 'shadow',
    investmentAmount: 0.15,
    traitGrants: ['web_of_influence', 'calculated_mercy'],
    requiredPrimaryReach: 'gold',
  },
  {
    id: 'vision.gold.benefactor',
    prose: 'A weathered traveler distributing bread from a cart, her ledger listing not profits but names of the hungry. She learned that the greatest profit is a full belly and a grateful name — and that this kind of wealth compounds in ways gold never could.',
    portraitAssetPath: '/assets/meeting/visions/gold-benefactor.webp',
    sceneAssetPath: '/assets/meeting/scenes/market-square-dawn.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #2a2a0a, #1a2a1a)',
    scenePlaceholder: 'linear-gradient(135deg, #2a1a0a, #3a2a1a, #1a1a0a)',
    reachInvestment: 'heart',
    investmentAmount: 0.15,
    traitGrants: ['open_hand', 'debt_of_gratitude'],
    requiredPrimaryReach: 'gold',
  },

  // ─── Shadow primary visions ───
  {
    id: 'vision.shadow.spymaster',
    prose: 'A room full of letters, each in a different hand, each carrying a secret that could topple a throne. They sit at the center and read them all, and the picture they assemble is one that no single person was ever meant to see.',
    portraitAssetPath: '/assets/meeting/visions/shadow-spymaster.webp',
    sceneAssetPath: '/assets/meeting/scenes/candlelit-study.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #0a0a1a, #1a0a2a)',
    scenePlaceholder: 'linear-gradient(135deg, #1a1a0a, #0a0a0a, #2a1a0a)',
    reachInvestment: 'eye',
    investmentAmount: 0.15,
    traitGrants: ['information_web', 'patience_of_shadows'],
    requiredPrimaryReach: 'shadow',
  },
  {
    id: 'vision.shadow.assassin',
    prose: 'A single candle extinguished between two fingers. The target never saw them. No one ever does. They are not cruel — they are precise, and there is a difference, and the difference is the only thing that lets them sleep.',
    portraitAssetPath: '/assets/meeting/visions/shadow-assassin.webp',
    sceneAssetPath: '/assets/meeting/scenes/dark-corridor.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #0a0a0a, #1a0a0a)',
    scenePlaceholder: 'linear-gradient(135deg, #0a0a0a, #1a0a0a, #0a0a0a)',
    reachInvestment: 'iron',
    investmentAmount: 0.15,
    traitGrants: ['killing_precision', 'ghost_step'],
    requiredPrimaryReach: 'shadow',
  },
  {
    id: 'vision.shadow.puppetmaster',
    prose: 'They whisper in the ear of a general who thinks the strategy is his own. Three kingdoms have fallen to plans that were never written down, spoken by a voice that was never raised above a murmur.',
    portraitAssetPath: '/assets/meeting/visions/shadow-puppetmaster.webp',
    sceneAssetPath: '/assets/meeting/scenes/war-tent.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #1a0a1a, #0a0a1a)',
    scenePlaceholder: 'linear-gradient(135deg, #1a1a0a, #2a1a0a, #0a0a0a)',
    reachInvestment: 'heart',
    investmentAmount: 0.15,
    traitGrants: ['invisible_hand', 'borrowed_authority'],
    requiredPrimaryReach: 'shadow',
  },

  // ─── Veil primary visions ───
  {
    id: 'vision.veil.archmage',
    prose: 'The tower they built exists in three planes at once. The spells they write are not incantations — they are conversations with the fabric of reality, and reality is beginning to listen.',
    portraitAssetPath: '/assets/meeting/visions/veil-archmage.webp',
    sceneAssetPath: '/assets/meeting/scenes/tower-planes.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #1a0a3a, #2a1a3a)',
    scenePlaceholder: 'linear-gradient(135deg, #0a0a2a, #1a0a3a, #0a0a1a)',
    reachInvestment: 'eye',
    investmentAmount: 0.15,
    traitGrants: ['reality_speaker', 'planar_sight'],
    requiredPrimaryReach: 'veil',
  },
  {
    id: 'vision.veil.wardsmith',
    prose: 'Every stone in the city wall hums with a ward they placed by hand. Nothing enters that they have not permitted. Nothing leaves that they have not blessed. The city sleeps soundly, and does not know why.',
    portraitAssetPath: '/assets/meeting/visions/veil-wardsmith.webp',
    sceneAssetPath: '/assets/meeting/scenes/warded-city-walls.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #1a1a2a, #2a2a3a)',
    scenePlaceholder: 'linear-gradient(135deg, #1a1a1a, #2a2a2a, #1a1a2a)',
    reachInvestment: 'stone',
    investmentAmount: 0.15,
    traitGrants: ['living_ward', 'silent_guardian'],
    requiredPrimaryReach: 'veil',
  },
  {
    id: 'vision.veil.spiritcaller',
    prose: 'The dead speak to them. Not with words — with memories, impressions, the residue of lives that ended too soon. They carry these whispers like a second heartbeat, and the living come to them when they need to hear what the departed left unsaid.',
    portraitAssetPath: '/assets/meeting/visions/veil-spiritcaller.webp',
    sceneAssetPath: '/assets/meeting/scenes/misty-graveyard.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #1a0a2a, #0a1a2a)',
    scenePlaceholder: 'linear-gradient(135deg, #0a0a1a, #1a1a2a, #0a0a0a)',
    reachInvestment: 'heart',
    investmentAmount: 0.15,
    traitGrants: ['death_whisper', 'bridge_between'],
    requiredPrimaryReach: 'veil',
  },

  // ─── Heart primary visions ───
  {
    id: 'vision.heart.revolutionary',
    prose: 'The old order is burning. They lit the match, but the fuel was there long before them — injustice, hunger, the slow grinding of lives into dust. They do not know if what comes next will be better. They only know that what was could not stand.',
    portraitAssetPath: '/assets/meeting/visions/heart-revolutionary.webp',
    sceneAssetPath: '/assets/meeting/scenes/burning-palace.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #3a1a0a, #2a0a0a)',
    scenePlaceholder: 'linear-gradient(135deg, #3a0a0a, #2a0a0a, #1a0a0a)',
    reachInvestment: 'iron',
    investmentAmount: 0.15,
    traitGrants: ['fire_starter', 'voice_of_the_people'],
    requiredPrimaryReach: 'heart',
  },
  {
    id: 'vision.heart.unifier',
    prose: 'Seven clans that have warred for a generation sit at the same table. They did not bring peace — they brought a shared enemy, and then, slowly, turned that alliance into something that no longer needs an enemy to hold it together.',
    portraitAssetPath: '/assets/meeting/visions/heart-unifier.webp',
    sceneAssetPath: '/assets/meeting/scenes/great-hall-feast.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #2a1a0a, #1a2a0a)',
    scenePlaceholder: 'linear-gradient(135deg, #2a1a0a, #3a2a1a, #1a1a0a)',
    reachInvestment: 'gold',
    investmentAmount: 0.15,
    traitGrants: ['bridge_builder', 'shared_table'],
    requiredPrimaryReach: 'heart',
  },
  {
    id: 'vision.heart.saint',
    prose: 'They have healed so many that the sick travel for days just to stand in their shadow. They ask for nothing. They give everything. And in the quiet moments, alone, they wonder if the cost of all this grace is the person they used to be.',
    portraitAssetPath: '/assets/meeting/visions/heart-saint.webp',
    sceneAssetPath: '/assets/meeting/scenes/healing-tent.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #1a2a1a, #2a2a1a)',
    scenePlaceholder: 'linear-gradient(135deg, #1a2a1a, #2a3a1a, #0a1a0a)',
    reachInvestment: 'star',
    investmentAmount: 0.15,
    traitGrants: ['selfless_grace', 'healing_presence'],
    requiredPrimaryReach: 'heart',
  },

  // ─── Eye primary visions ───
  {
    id: 'vision.eye.truthfinder',
    prose: 'Every lie told in this city passes through their hands eventually. Not because they seek them — because lies have a texture, a weight, and they can feel each one like a stone in still water. The powerful fear them. The innocent seek them out.',
    portraitAssetPath: '/assets/meeting/visions/eye-truthfinder.webp',
    sceneAssetPath: '/assets/meeting/scenes/justice-hall.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #0a1a2a, #1a2a3a)',
    scenePlaceholder: 'linear-gradient(135deg, #1a1a2a, #0a1a2a, #1a1a1a)',
    reachInvestment: 'heart',
    investmentAmount: 0.15,
    traitGrants: ['lie_sense', 'weight_of_truth'],
    requiredPrimaryReach: 'eye',
  },
  {
    id: 'vision.eye.pathfinder',
    prose: 'The map they carry has no edges. Every road leads to another road, and they have walked them all and found the places between — the shortcuts, the hidden passes, the forgotten bridges that connect what others thought was separate.',
    portraitAssetPath: '/assets/meeting/visions/eye-pathfinder.webp',
    sceneAssetPath: '/assets/meeting/scenes/mountain-pass.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #0a2a1a, #1a2a2a)',
    scenePlaceholder: 'linear-gradient(135deg, #1a2a1a, #0a1a0a, #1a2a2a)',
    reachInvestment: 'stone',
    investmentAmount: 0.15,
    traitGrants: ['pathfinder_sense', 'hidden_roads'],
    requiredPrimaryReach: 'eye',
  },
  {
    id: 'vision.eye.shadowseer',
    prose: 'They see what is hidden — not just secrets, but the shapes of things that have not happened yet. The future is not fixed, they know this. But it has currents, and they can read them, and the reading is both gift and curse.',
    portraitAssetPath: '/assets/meeting/visions/eye-shadowseer.webp',
    sceneAssetPath: '/assets/meeting/scenes/starlit-tower.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #0a0a2a, #1a1a3a)',
    scenePlaceholder: 'linear-gradient(135deg, #0a0a1a, #0a0a2a, #1a0a2a)',
    reachInvestment: 'veil',
    investmentAmount: 0.15,
    traitGrants: ['future_currents', 'shadow_sight'],
    requiredPrimaryReach: 'eye',
  },

  // ─── Stone primary visions ───
  {
    id: 'vision.stone.architect',
    prose: 'The city they designed will house ten thousand souls. Every street follows the contour of the land, every wall uses the stone that was already there. They did not impose a plan — they listened to what the earth wanted to become, and built it.',
    portraitAssetPath: '/assets/meeting/visions/stone-architect.webp',
    sceneAssetPath: '/assets/meeting/scenes/city-blueprint.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #1a1a1a, #2a2a1a)',
    scenePlaceholder: 'linear-gradient(135deg, #2a2a1a, #1a1a0a, #2a2a2a)',
    reachInvestment: 'gold',
    investmentAmount: 0.15,
    traitGrants: ['earth_listener', 'city_shaper'],
    requiredPrimaryReach: 'stone',
  },
  {
    id: 'vision.stone.wardkeeper',
    prose: 'The boundary they maintain is not a wall but a promise — carved into the bedrock, renewed each equinox, holding back something that the world has agreed to forget. They do not sleep well. They do not need to.',
    portraitAssetPath: '/assets/meeting/visions/stone-wardkeeper.webp',
    sceneAssetPath: '/assets/meeting/scenes/ancient-boundary.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #1a1a0a, #2a1a1a)',
    scenePlaceholder: 'linear-gradient(135deg, #1a0a0a, #2a1a0a, #1a1a0a)',
    reachInvestment: 'veil',
    investmentAmount: 0.15,
    traitGrants: ['boundary_keeper', 'forgotten_oath'],
    requiredPrimaryReach: 'stone',
  },
  {
    id: 'vision.stone.monolith',
    prose: 'They have not moved from this spot in seven years. Empires have risen and fallen around them. They are the fixed point — the one thing that does not change, does not bend, does not break. And in a world of chaos, that is the rarest kind of power.',
    portraitAssetPath: '/assets/meeting/visions/stone-monolith.webp',
    sceneAssetPath: '/assets/meeting/scenes/stone-throne.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #1a1a1a, #0a0a0a)',
    scenePlaceholder: 'linear-gradient(135deg, #1a1a1a, #2a2a2a, #0a0a0a)',
    reachInvestment: 'iron',
    investmentAmount: 0.15,
    traitGrants: ['immovable', 'fixed_point'],
    requiredPrimaryReach: 'stone',
  },

  // ─── Star primary visions ───
  {
    id: 'vision.star.prophet',
    prose: 'A voice in the wilderness that the world is only now beginning to hear. They spoke of justice before it was fashionable, of mercy before it was safe. The faithful follow them. The powerful fear them. They fear nothing at all.',
    portraitAssetPath: '/assets/meeting/visions/star-prophet.webp',
    sceneAssetPath: '/assets/meeting/scenes/desert-sermon.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #2a2a1a, #3a2a0a)',
    scenePlaceholder: 'linear-gradient(135deg, #3a2a0a, #2a1a0a, #3a3a1a)',
    reachInvestment: 'heart',
    investmentAmount: 0.15,
    traitGrants: ['prophetic_voice', 'fearless_conviction'],
    requiredPrimaryReach: 'star',
  },
  {
    id: 'vision.star.inquisitor',
    prose: 'They carry a lantern that burns with no oil. Every shadow it touches reveals the truth underneath — the comfortable lies, the convenient forgettings, the small corruptions that rot a soul from the inside. They do not enjoy this work. They do it anyway.',
    portraitAssetPath: '/assets/meeting/visions/star-inquisitor.webp',
    sceneAssetPath: '/assets/meeting/scenes/lantern-vigil.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #2a1a0a, #1a1a2a)',
    scenePlaceholder: 'linear-gradient(135deg, #2a1a0a, #1a0a0a, #2a2a1a)',
    reachInvestment: 'eye',
    investmentAmount: 0.15,
    traitGrants: ['truth_lantern', 'righteous_burden'],
    requiredPrimaryReach: 'star',
  },
  {
    id: 'vision.star.anchorite',
    prose: 'They withdrew from the world and the world followed them. The hermitage on the cliff is now a pilgrimage site. They asked for silence and received devotion. In the stillness, they found something that words cannot carry — and others travel a thousand miles to sit in that silence with them.',
    portraitAssetPath: '/assets/meeting/visions/star-anchorite.webp',
    sceneAssetPath: '/assets/meeting/scenes/cliff-hermitage.webp',
    portraitPlaceholder: 'linear-gradient(135deg, #1a2a2a, #2a2a3a)',
    scenePlaceholder: 'linear-gradient(135deg, #1a2a2a, #0a1a1a, #2a2a3a)',
    reachInvestment: 'veil',
    investmentAmount: 0.15,
    traitGrants: ['magnetic_stillness', 'silent_authority'],
    requiredPrimaryReach: 'star',
  },
];
```

- [ ] **Step 4: Update meeting-art-library.ts with placeholder gradients**

Read and then replace the empty arrays in `src/data/meeting-art-library.ts` with scene placeholder entries:

```typescript
import type { SphereName } from '../types/graph';

export interface MeetingSceneAsset {
  id: string;
  path: string;
  placeholderGradient: string;
  emotionalTags: string[];
  dilemmaCategories: string[];
}

/** 16:9 scene backdrops for dilemma beats. Placeholder gradients until art is generated. */
export const DILEMMA_SCENE_ART: readonly MeetingSceneAsset[] = [
  { id: 'scene.crossroads', path: '/assets/meeting/scenes/crossroads.webp', placeholderGradient: 'linear-gradient(135deg, #1a1a0a, #2a1a0a, #1a2a1a)', emotionalTags: ['choice', 'journey'], dilemmaCategories: ['general'] },
  { id: 'scene.burning-village', path: '/assets/meeting/scenes/burning-village.webp', placeholderGradient: 'linear-gradient(135deg, #3a0a0a, #2a0a0a, #1a0a0a)', emotionalTags: ['destruction', 'loss', 'urgency'], dilemmaCategories: ['axiological', 'reach_specific'] },
  { id: 'scene.throne-room', path: '/assets/meeting/scenes/throne-room.webp', placeholderGradient: 'linear-gradient(135deg, #2a1a0a, #3a2a1a, #1a1a0a)', emotionalTags: ['power', 'politics', 'betrayal'], dilemmaCategories: ['axiological', 'domain_specific'] },
  { id: 'scene.prison-cell', path: '/assets/meeting/scenes/prison-cell.webp', placeholderGradient: 'linear-gradient(135deg, #0a0a0a, #1a1a1a, #0a0a0a)', emotionalTags: ['confinement', 'mercy', 'justice'], dilemmaCategories: ['axiological'] },
  { id: 'scene.market-riot', path: '/assets/meeting/scenes/market-riot.webp', placeholderGradient: 'linear-gradient(135deg, #2a1a0a, #3a1a0a, #1a0a0a)', emotionalTags: ['chaos', 'courage', 'crowd'], dilemmaCategories: ['general', 'reach_specific'] },
  { id: 'scene.forest-shrine', path: '/assets/meeting/scenes/forest-shrine.webp', placeholderGradient: 'linear-gradient(135deg, #0a1a0a, #1a2a1a, #0a1a0a)', emotionalTags: ['sacred', 'nature', 'revelation'], dilemmaCategories: ['domain_specific'] },
  { id: 'scene.harbor-storm', path: '/assets/meeting/scenes/harbor-storm.webp', placeholderGradient: 'linear-gradient(135deg, #0a0a1a, #1a1a2a, #0a1a1a)', emotionalTags: ['danger', 'choice', 'nature'], dilemmaCategories: ['general'] },
  { id: 'scene.plague-ward', path: '/assets/meeting/scenes/plague-ward.webp', placeholderGradient: 'linear-gradient(135deg, #1a1a0a, #0a1a0a, #1a0a0a)', emotionalTags: ['suffering', 'compassion', 'sacrifice'], dilemmaCategories: ['axiological', 'reach_specific'] },
];

/**
 * Select a scene asset matching emotional tags from a dilemma.
 * Falls back to first scene if no tags match.
 */
export function selectDilemmaScene(
  emotionalTags: string[],
  seed: number,
): MeetingSceneAsset {
  if (DILEMMA_SCENE_ART.length === 0) {
    return { id: 'scene.fallback', path: '', placeholderGradient: 'linear-gradient(135deg, #0a0a0f, #1a1a1a)', emotionalTags: [], dilemmaCategories: [] };
  }
  const scored = DILEMMA_SCENE_ART.map(scene => {
    const overlap = scene.emotionalTags.filter(t => emotionalTags.includes(t)).length;
    return { scene, score: overlap };
  });
  scored.sort((a, b) => b.score - a.score);
  // If top scores are tied, use seed to pick deterministically
  const topScore = scored[0].score;
  const tied = scored.filter(s => s.score === topScore);
  return tied[Math.abs(seed) % tied.length].scene;
}
```

- [ ] **Step 5: Run type check**

Run: `npx tsc --noEmit 2>&1 | head -40`

Expected: Errors from components referencing old meeting fields. Data files should type-check cleanly.

- [ ] **Step 6: Commit content data**

```bash
git add src/data/candidate-vignettes.ts src/data/spark-vision-catalog.ts src/data/meeting-narrative-prose.ts src/data/meeting-art-library.ts
git commit -m "feat(meeting): add narrative content data

24 candidate vignettes (3 per reach), 24 spark visions (3 per reach),
Hunger-variant god-voice prose for all beats, dilemma scene assets
with placeholder gradients.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Engine — Narrative Candidate Generation & Vision Resolution

**Files:**
- Modify: `src/engine/meetingEncounter.ts`
- Create: `src/engine/__tests__/meetTheFirstNarrative.test.ts`

- [ ] **Step 1: Write tests for generateNarrativeCandidates()**

Create `src/engine/__tests__/meetTheFirstNarrative.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  generateNarrativeCandidates,
  generateSparkVisions,
  buildNarrativeResult,
} from '../meetingEncounter';
import { CANDIDATE_VIGNETTES } from '../../data/candidate-vignettes';
import { SPARK_VISION_CATALOG } from '../../data/spark-vision-catalog';

describe('generateNarrativeCandidates', () => {
  it('returns exactly 3 candidates', () => {
    const candidates = generateNarrativeCandidates(
      'hunger.gather', 'default', 42,
    );
    expect(candidates).toHaveLength(3);
  });

  it('produces deterministic results for same seed', () => {
    const a = generateNarrativeCandidates('hunger.gather', 'default', 42);
    const b = generateNarrativeCandidates('hunger.gather', 'default', 42);
    expect(a.map(c => c.tempId)).toEqual(b.map(c => c.tempId));
  });

  it('produces different results for different seeds', () => {
    const a = generateNarrativeCandidates('hunger.gather', 'default', 42);
    const b = generateNarrativeCandidates('hunger.gather', 'default', 99);
    // At least one candidate should differ
    const aIds = a.map(c => c.archetypeId);
    const bIds = b.map(c => c.archetypeId);
    expect(aIds).not.toEqual(bIds);
  });

  it('biases toward Hunger-resonant vignettes', () => {
    // Run 100 times and check that Hunger-resonant reaches appear more often
    const reachCounts: Record<string, number> = {};
    for (let seed = 0; seed < 100; seed++) {
      const candidates = generateNarrativeCandidates('hunger.gather', 'default', seed);
      for (const c of candidates) {
        reachCounts[c.primaryReach] = (reachCounts[c.primaryReach] ?? 0) + 1;
      }
    }
    // Gather resonates with heart, veil, star — these should appear more than iron, shadow
    expect(reachCounts['heart'] ?? 0).toBeGreaterThan(reachCounts['shadow'] ?? 0);
  });

  it('falls back to full pool when Hunger has no matches', () => {
    const candidates = generateNarrativeCandidates(
      'hunger.nonexistent' as any, 'default', 42,
    );
    expect(candidates).toHaveLength(3);
  });

  it('each candidate has required fields', () => {
    const candidates = generateNarrativeCandidates('hunger.gather', 'default', 42);
    for (const c of candidates) {
      expect(c.tempId).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.vignetteText).toBeTruthy();
      expect(c.epithet).toBeTruthy();
      expect(c.imageAssetPath).toBeTruthy();
      expect(c.primaryReach).toBeTruthy();
      expect(c.secondaryReach).toBeTruthy();
      expect(c.reachCapabilities).toBeTruthy();
      expect(c.axiologicalSeed).toBeTruthy();
    }
  });
});

describe('generateSparkVisions', () => {
  it('returns exactly 3 visions for a given primary reach', () => {
    const visions = generateSparkVisions('iron', 'force', 42);
    expect(visions).toHaveLength(3);
  });

  it('all visions match the primary reach', () => {
    const visions = generateSparkVisions('gold', 'energy', 42);
    for (const v of visions) {
      expect(v.requiredPrimaryReach).toBe('gold');
    }
  });

  it('falls back to random visions if reach has fewer than 3', () => {
    // Our catalog has exactly 3 per reach, so this should always work
    for (const reach of ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star'] as const) {
      const visions = generateSparkVisions(reach, 'force', 42);
      expect(visions.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('buildNarrativeResult', () => {
  it('builds a MeetingEncounterResult from narrative flow state', () => {
    const candidates = generateNarrativeCandidates('hunger.gather', 'default', 42);
    const candidate = candidates[0];
    const visions = generateSparkVisions(candidate.primaryReach, 'life', 42);
    const vision = visions[0];

    const result = buildNarrativeResult({
      candidate,
      vision,
      dilemmaChoices: [],
      editedName: undefined,
      locationId: 'loc_test',
      ascendantSphere: 'life',
      tick: 10,
    });

    expect(result.name).toBe(candidate.name);
    expect(result.primaryReach).toBe(candidate.primaryReach);
    expect(result.secondaryReach).toBe(candidate.secondaryReach);
    expect(result.locationId).toBe('loc_test');
    expect(result.meetingChoiceRecord.sparkVisionId).toBe(vision.id);
    // Vision investment should be applied
    const investedReach = vision.reachInvestment;
    expect(result.reachCapabilities[investedReach]).toBeGreaterThan(
      candidate.reachCapabilities[investedReach],
    );
  });

  it('uses edited name when provided', () => {
    const candidates = generateNarrativeCandidates('hunger.gather', 'default', 42);
    const visions = generateSparkVisions(candidates[0].primaryReach, 'life', 42);

    const result = buildNarrativeResult({
      candidate: candidates[0],
      vision: visions[0],
      dilemmaChoices: [],
      editedName: 'Custom Name',
      locationId: 'loc_test',
      ascendantSphere: 'life',
      tick: 10,
    });

    expect(result.name).toBe('Custom Name');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/meetTheFirstNarrative.test.ts 2>&1 | tail -20`

Expected: FAIL — functions don't exist yet.

- [ ] **Step 3: Implement generateNarrativeCandidates()**

Add to `src/engine/meetingEncounter.ts` (after existing imports, add new imports and function):

```typescript
import { CANDIDATE_VIGNETTES, type CandidateVignette } from '../data/candidate-vignettes';
import { SPARK_VISION_CATALOG } from '../data/spark-vision-catalog';
import type { NarrativeCandidate, SparkVision, MeetingEncounterResult } from '../types/meetingEncounter';
import { ARCHETYPE_NAME_MAP } from '../data/meeting-content';

// ─── Constants ───

const NARRATIVE_CANDIDATE_COUNT = 3;
const HUNGER_RESONANCE_WEIGHT = 2.0;
const CANDIDATE_PRIMARY_REACH_BASE = 0.4;
const CANDIDATE_SECONDARY_REACH_BASE = 0.25;
const CANDIDATE_BASE_REACH = 0.1;
const CANDIDATE_REACH_VARIANCE = 0.08;
const SPARK_INVESTMENT_AMOUNT = 0.15;

// ─── Narrative Candidate Generation ───

/**
 * Generate 3 narrative candidates biased by Hunger resonance.
 * Replaces the old intent-based generateCandidates().
 */
export function generateNarrativeCandidates(
  hungerId: string,
  cultureId: string,
  seed: number,
): NarrativeCandidate[] {
  const rng = mulberry32(seed ^ 0x4d454554); // 'MEET' salt

  // Score vignettes by Hunger resonance
  const scored = CANDIDATE_VIGNETTES.map(v => {
    const resonance = v.hungerResonance.includes(hungerId) ? HUNGER_RESONANCE_WEIGHT : 0;
    const jitter = rng() * 0.5;
    return { vignette: v, score: resonance + jitter };
  });

  scored.sort((a, b) => b.score - a.score);

  // Pick top 3, ensuring no duplicate primary reaches if possible
  const selected: CandidateVignette[] = [];
  const usedPrimaryReaches = new Set<string>();

  for (const { vignette } of scored) {
    if (selected.length >= NARRATIVE_CANDIDATE_COUNT) break;
    // Prefer diversity of primary reach
    if (usedPrimaryReaches.has(vignette.primaryReach) && selected.length < NARRATIVE_CANDIDATE_COUNT - 1) {
      // Skip duplicates unless we're running out of options
      const remaining = scored.filter(s =>
        !selected.includes(s.vignette) && !usedPrimaryReaches.has(s.vignette.primaryReach),
      );
      if (remaining.length > 0) continue;
    }
    selected.push(vignette);
    usedPrimaryReaches.add(vignette.primaryReach);
  }

  // Fill remaining slots if diversity filter was too aggressive
  if (selected.length < NARRATIVE_CANDIDATE_COUNT) {
    for (const { vignette } of scored) {
      if (selected.length >= NARRATIVE_CANDIDATE_COUNT) break;
      if (!selected.includes(vignette)) {
        selected.push(vignette);
      }
    }
  }

  return selected.map((vignette, i) => {
    const archetypeKey = `${vignette.primaryReach}_${vignette.secondaryReach}`;
    const archetypeId = ARCHETYPE_NAME_MAP[archetypeKey] ?? 'Wanderer';

    // Generate hidden stats
    const axiologicalSeed = generateRandomProfile(rng);
    const reachCapabilities = generateReachCapabilities(
      vignette.primaryReach, vignette.secondaryReach, rng,
    );
    const cooperationStrategy = assignCooperationStrategy(archetypeId, axiologicalSeed, rng);

    // Generate name from existing name pool
    const name = generateAgentName(rng);

    return {
      tempId: `candidate_${seed}_${i}`,
      name,
      archetypeId,
      cultureId,
      primaryReach: vignette.primaryReach,
      secondaryReach: vignette.secondaryReach,
      sphere: deriveSphereFromReaches(vignette.primaryReach, vignette.secondaryReach, rng),
      vignetteText: vignette.prose,
      epithet: vignette.epithet,
      imageAssetPath: vignette.imageAssetPath,
      placeholderGradient: vignette.placeholderGradient,
      axiologicalSeed,
      reachCapabilities,
      cooperationStrategy,
      appearanceSeed: Math.floor(rng() * 2147483647),
    };
  });
}

/** Derive a sphere from primary/secondary reach using the existing sphere mapping. */
function deriveSphereFromReaches(
  primary: ReachDomain,
  secondary: ReachDomain,
  rng: () => number,
): SphereName {
  // Each reach has natural sphere affinities
  const REACH_SPHERE_MAP: Record<string, SphereName[]> = {
    iron: ['force', 'matter'],
    gold: ['matter', 'energy'],
    shadow: ['entropy', 'mind'],
    veil: ['spirit', 'mind'],
    heart: ['life', 'spirit'],
    eye: ['mind', 'time'],
    stone: ['matter', 'time'],
    star: ['spirit', 'light'],
  };
  const options = REACH_SPHERE_MAP[primary] ?? ['force'];
  return options[Math.floor(rng() * options.length)];
}

// ─── Spark Vision Generation ───

/**
 * Select 3 spark visions matching the candidate's primary reach.
 */
export function generateSparkVisions(
  primaryReach: ReachDomain,
  ascendantPrimarySphere: SphereName,
  seed: number,
): SparkVision[] {
  const matching = SPARK_VISION_CATALOG.filter(
    v => v.requiredPrimaryReach === primaryReach,
  );

  if (matching.length >= 3) {
    return matching.slice(0, 3);
  }

  // Fallback: pad with random visions from other reaches
  const rng = mulberry32(seed ^ 0x5350524B); // 'SPRK' salt
  const others = SPARK_VISION_CATALOG.filter(
    v => v.requiredPrimaryReach !== primaryReach,
  );
  const shuffled = [...others].sort(() => rng() - 0.5);
  const result = [...matching];
  for (const v of shuffled) {
    if (result.length >= 3) break;
    result.push(v);
  }
  return result.slice(0, 3);
}

// ─── Narrative Result Builder ───

export interface NarrativeResultInput {
  candidate: NarrativeCandidate;
  vision: SparkVision;
  dilemmaChoices: DilemmaChoiceRecord[];
  editedName: string | undefined;
  locationId: string;
  ascendantSphere: SphereName;
  tick: number;
}

/**
 * Build a MeetingEncounterResult from the narrative flow's accumulated state.
 * Replaces the old buildMeetingResult().
 */
export function buildNarrativeResult(input: NarrativeResultInput): MeetingEncounterResult {
  const { candidate, vision, dilemmaChoices, editedName, locationId, ascendantSphere, tick } = input;

  // Apply dilemma axiological shifts to candidate's base profile
  let profile = { ...candidate.axiologicalSeed };
  for (const choice of dilemmaChoices) {
    for (const [pair, shift] of Object.entries(choice.axiologicalShifts)) {
      const current = profile[pair as ValuePair] ?? 0;
      profile[pair as ValuePair] = Math.max(-1, Math.min(1, current + (shift ?? 0)));
    }
  }

  // Apply vision reach investment
  const reachCapabilities = { ...candidate.reachCapabilities };
  reachCapabilities[vision.reachInvestment] = Math.min(
    1,
    (reachCapabilities[vision.reachInvestment] ?? 0) + vision.investmentAmount,
  );

  // Collect founding gate tags and trait seeds
  const foundingGateTags = dilemmaChoices.flatMap(c => c.gateTags);
  const traitSeeds = [
    ...dilemmaChoices.flatMap(c => c.traitSeeds ?? []),
    ...vision.traitGrants,
  ];

  const meetingChoiceRecord: MeetingChoiceRecord = {
    encounterTick: tick,
    locationId,
    candidateIndex: 0, // Will be set by the flow component
    archetypeId: candidate.archetypeId,
    dilemmaChoices,
    sparkVisionId: vision.id,
    ascendantSphere,
    foundingGateTags,
  };

  return {
    name: editedName ?? candidate.name,
    archetypeId: candidate.archetypeId,
    cultureId: candidate.cultureId,
    axiologicalProfile: profile,
    reachCapabilities,
    primaryReach: candidate.primaryReach,
    secondaryReach: candidate.secondaryReach,
    sphere: candidate.sphere,
    cooperationStrategy: candidate.cooperationStrategy,
    foundingGateTags,
    traitSeeds,
    appearanceSeed: candidate.appearanceSeed,
    meetingChoiceRecord,
    locationId,
  };
}
```

**Note:** This references existing helper functions (`mulberry32`, `generateRandomProfile`, `generateReachCapabilities`, `assignCooperationStrategy`, `generateAgentName`) that already exist in `meetingEncounter.ts`. If any are private/unexported, export them. The `ValuePair` and `MeetingChoiceRecord` types come from the updated `meetingEncounter.ts` types.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/meetTheFirstNarrative.test.ts 2>&1 | tail -20`

Expected: All tests PASS.

- [ ] **Step 5: Commit engine functions**

```bash
git add src/engine/meetingEncounter.ts src/engine/__tests__/meetTheFirstNarrative.test.ts
git commit -m "feat(meeting): add narrative candidate generation and vision resolution

generateNarrativeCandidates() — Hunger-biased candidate selection from
vignette pool. generateSparkVisions() — reach-matched vision selection.
buildNarrativeResult() — assembles MeetingEncounterResult from narrative
flow state.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: SensingBeat Component (Beat 1)

**Files:**
- Create: `src/components/MeetTheFirst/SensingBeat.tsx`

- [ ] **Step 1: Create SensingBeat.tsx**

```typescript
import { useState, useCallback, useMemo } from 'react';
import type { NarrativeCandidate } from '../../types/meetingEncounter';

interface SensingBeatProps {
  candidates: NarrativeCandidate[];
  openingProse: string;
  onSelect: (candidate: NarrativeCandidate, index: number) => void;
}

/** Spatial rest positions for 3 candidates. */
const REST_POSITIONS = [
  { x: -28, y: -8, scale: 0.85, rotate: -1.5 },
  { x: 26,  y: -4, scale: 0.80, rotate: 1.2 },
  { x: -2,  y: 18, scale: 0.88, rotate: 0.6 },
];

/** Peripheral positions when one candidate is focused. */
const PERIPHERAL_POSITIONS = [
  { x: -40, y: -6,  scale: 0.45, rotate: -3 },
  { x: 42,  y: -10, scale: 0.42, rotate: 2.5 },
  { x: -38, y: 14,  scale: 0.44, rotate: 1.8 },
];

const FOCUS_SCALE = 1.1;
const CONFIRM_SCALE = 1.8;
const CONFIRM_DELAY_MS = 1200;
const SCENE_BG = '#0a0a0f';

export function SensingBeat({ candidates, openingProse, onSelect }: SensingBeatProps) {
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const [confirmedIdx, setConfirmedIdx] = useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const handleClick = useCallback((idx: number) => {
    if (confirmedIdx !== null) return;

    if (focusedIdx === idx) {
      // Second click — confirm
      setConfirmedIdx(idx);
      setTimeout(() => onSelect(candidates[idx], idx), CONFIRM_DELAY_MS);
    } else {
      // First click — focus
      setFocusedIdx(idx);
    }
  }, [focusedIdx, confirmedIdx, onSelect, candidates]);

  const getStyle = (idx: number): React.CSSProperties => {
    const isFocused = focusedIdx === idx;
    const isConfirmed = confirmedIdx === idx;
    const isHovered = hoveredIdx === idx;
    const somethingFocused = focusedIdx !== null;

    if (isConfirmed) {
      return {
        transform: `translate(-50%, -50%) scale(${CONFIRM_SCALE})`,
        opacity: 0,
        filter: 'brightness(1.4) blur(4px)',
        zIndex: 10,
      };
    }

    if (isFocused) {
      return {
        transform: `translate(-50%, -50%) scale(${FOCUS_SCALE})`,
        opacity: 1,
        filter: 'brightness(1.1)',
        zIndex: 5,
      };
    }

    if (somethingFocused) {
      const p = PERIPHERAL_POSITIONS[idx] ?? PERIPHERAL_POSITIONS[0];
      return {
        transform: `translate(calc(-50% + ${p.x}vw), calc(-50% + ${p.y}vh)) scale(${p.scale}) rotate(${p.rotate}deg)`,
        opacity: 0.3,
        filter: 'brightness(0.4)',
        zIndex: 1,
      };
    }

    // Rest state
    const r = REST_POSITIONS[idx] ?? REST_POSITIONS[0];
    const hoverScale = isHovered ? r.scale + 0.06 : r.scale;
    return {
      transform: `translate(calc(-50% + ${r.x}vw), calc(-50% + ${r.y}vh)) scale(${hoverScale}) rotate(${r.rotate}deg)`,
      opacity: isHovered ? 0.95 : 0.55,
      filter: isHovered ? 'brightness(1.15)' : 'brightness(0.65)',
      zIndex: isHovered ? 3 : 2,
    };
  };

  return (
    <div className="h-screen relative overflow-hidden" style={{ background: SCENE_BG }}>
      {/* Opening prose */}
      <p
        className="absolute left-0 right-0 text-center transition-all duration-700"
        style={{
          top: '7vh',
          color: 'rgba(160,140,180,0.5)',
          fontStyle: 'italic',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '1.3rem',
          letterSpacing: '0.06em',
          opacity: confirmedIdx !== null ? 0 : focusedIdx !== null ? 0.4 : 1,
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        {focusedIdx !== null
          ? 'Click again to choose. Or reach for another.'
          : openingProse}
      </p>

      {/* Floating candidate images */}
      {candidates.map((candidate, idx) => {
        const isFocused = focusedIdx === idx;
        const style = getStyle(idx);

        return (
          <button
            key={candidate.tempId}
            type="button"
            onClick={() => handleClick(idx)}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            data-testid={`sensing-candidate-${idx}`}
            className="absolute cursor-pointer"
            style={{
              top: '50%',
              left: '50%',
              width: 'min(900px, 55vw)',
              aspectRatio: '4/3',
              background: 'transparent',
              border: 'none',
              padding: 0,
              ...style,
              transition: 'transform 1s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.8s ease, filter 0.6s ease',
            }}
          >
            {/* Image with dissolved edges */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${candidate.imageAssetPath}), ${candidate.placeholderGradient}`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                maskImage: 'radial-gradient(ellipse 90% 85% at center, black 30%, transparent 95%)',
                WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at center, black 30%, transparent 95%)',
              }}
            />
            {/* Prose vignette — only when focused */}
            <div
              className="absolute left-0 right-0 text-center px-8 transition-opacity duration-700"
              style={{
                bottom: '-12vh',
                opacity: isFocused ? 1 : 0,
                pointerEvents: 'none',
              }}
            >
              <p
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                  fontSize: '0.95rem',
                  lineHeight: 1.7,
                  color: 'rgba(200,190,170,0.85)',
                  maxWidth: '600px',
                  margin: '0 auto',
                }}
              >
                {candidate.vignetteText}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify file compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | grep -i "SensingBeat" | head -5`

Expected: No errors from SensingBeat.tsx (may show errors from other files — that's fine).

- [ ] **Step 3: Commit**

```bash
git add src/components/MeetTheFirst/SensingBeat.tsx
git commit -m "feat(meeting): add SensingBeat component

Spatial/scattered candidate layout with two-click interaction,
dissolved-edge images, and prose vignette on focus. Mirrors
StirringBeat.tsx patterns for consistent Remembrance flow UX.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: ComicPanel + TestingBeat (Beat 2)

**Files:**
- Create: `src/components/MeetTheFirst/ComicPanel.tsx`
- Create: `src/components/MeetTheFirst/TestingBeat.tsx`

- [ ] **Step 1: Create ComicPanel.tsx**

```typescript
interface ComicPanelProps {
  sceneImagePath: string;
  scenePlaceholder: string;
  characterImagePath: string;
  characterPlaceholder: string;
  /** 'left' or 'right' — which side the character appears on. */
  characterPosition?: 'left' | 'right';
  children?: React.ReactNode;
}

/**
 * Comic-panel composition: 16:9 scene backdrop with 4:3 character overlay.
 * Character is offset to one side with dissolved edges.
 */
export function ComicPanel({
  sceneImagePath,
  scenePlaceholder,
  characterImagePath,
  characterPlaceholder,
  characterPosition = 'left',
  children,
}: ComicPanelProps) {
  const isLeft = characterPosition === 'left';

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 16:9 Scene backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${sceneImagePath}), ${scenePlaceholder}`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Dark gradient overlay for readability */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.6) 35%, rgba(10,10,15,0.1) 60%, transparent 100%)',
        }}
      />

      {/* 4:3 Character overlay */}
      <div
        className="absolute bottom-0"
        style={{
          [isLeft ? 'left' : 'right']: '2vw',
          width: 'min(500px, 35vw)',
          aspectRatio: '3/4',
          backgroundImage: `url(${characterImagePath}), ${characterPlaceholder}`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          maskImage: `linear-gradient(to top, transparent 0%, black 15%, black 85%, transparent 100%),
                      linear-gradient(to ${isLeft ? 'right' : 'left'}, black 0%, black 70%, transparent 100%)`,
          maskComposite: 'intersect',
          WebkitMaskImage: `linear-gradient(to top, transparent 0%, black 15%, black 85%, transparent 100%),
                           linear-gradient(to ${isLeft ? 'right' : 'left'}, black 0%, black 70%, transparent 100%)`,
          WebkitMaskComposite: 'source-in',
        }}
      />

      {/* Content overlay (prose, choices) */}
      <div className="absolute inset-0 flex flex-col justify-end">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create TestingBeat.tsx**

```typescript
import { useState, useCallback, useEffect } from 'react';
import type { NarrativeCandidate } from '../../types/meetingEncounter';
import type { DilemmaInstance, DilemmaChoiceRecord } from '../../types/meetingEncounter';
import { ComicPanel } from './ComicPanel';
import { selectDilemmaScene } from '../../data/meeting-art-library';
import { TESTING_TRANSITION_IN, TESTING_BETWEEN_DILEMMAS } from '../../data/meeting-narrative-prose';

interface TestingBeatProps {
  candidate: NarrativeCandidate;
  dilemmas: DilemmaInstance[];
  godVoiceOverride?: string;
  onComplete: (choices: DilemmaChoiceRecord[]) => void;
}

const SCENE_BG = '#0a0a0f';

export function TestingBeat({ candidate, dilemmas, godVoiceOverride, onComplete }: TestingBeatProps) {
  const [currentDilemmaIdx, setCurrentDilemmaIdx] = useState(-1); // -1 = transition in
  const [choices, setChoices] = useState<DilemmaChoiceRecord[]>([]);
  const [fadeState, setFadeState] = useState<'in' | 'visible' | 'out'>('in');

  // Transition in
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentDilemmaIdx(0);
      setFadeState('visible');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleChoice = useCallback((choiceId: string) => {
    const dilemma = dilemmas[currentDilemmaIdx];
    if (!dilemma) return;

    const choice = dilemma.choices.find(c => c.id === choiceId);
    if (!choice) return;

    const record: DilemmaChoiceRecord = {
      dilemmaId: dilemma.templateId,
      category: dilemma.category,
      choiceId,
      gateTags: choice.gateTags,
      axiologicalShifts: choice.axiologicalShifts,
      reachChanges: choice.reachChanges,
      traitSeeds: choice.traitSeeds,
    };

    const newChoices = [...choices, record];
    setChoices(newChoices);

    if (currentDilemmaIdx < dilemmas.length - 1) {
      // Transition to next dilemma
      setFadeState('out');
      setTimeout(() => {
        setCurrentDilemmaIdx(prev => prev + 1);
        setFadeState('visible');
      }, 1200);
    } else {
      // All dilemmas complete
      setFadeState('out');
      setTimeout(() => onComplete(newChoices), 1000);
    }
  }, [currentDilemmaIdx, dilemmas, choices, onComplete]);

  const currentDilemma = currentDilemmaIdx >= 0 ? dilemmas[currentDilemmaIdx] : null;

  // Select scene art based on dilemma emotional tags
  const sceneAsset = currentDilemma
    ? selectDilemmaScene(
        (currentDilemma as any).resonance?.emotionalRegister ?? [],
        currentDilemmaIdx,
      )
    : null;

  return (
    <div className="h-screen relative overflow-hidden" style={{ background: SCENE_BG }}>
      {/* Transition-in text */}
      {currentDilemmaIdx === -1 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              fontSize: '1.3rem',
              color: 'rgba(200,180,140,0.6)',
              letterSpacing: '0.06em',
              opacity: 1,
              transition: 'opacity 1s ease',
            }}
          >
            {TESTING_TRANSITION_IN}
          </p>
        </div>
      )}

      {/* Dilemma scene */}
      {currentDilemma && (
        <div
          className="absolute inset-0"
          style={{
            opacity: fadeState === 'visible' ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }}
        >
          <ComicPanel
            sceneImagePath={sceneAsset?.path ?? ''}
            scenePlaceholder={sceneAsset?.placeholderGradient ?? 'linear-gradient(135deg, #0a0a0f, #1a1a1a)'}
            characterImagePath={candidate.imageAssetPath}
            characterPlaceholder={candidate.placeholderGradient}
            characterPosition={currentDilemmaIdx % 2 === 0 ? 'left' : 'right'}
          >
            {/* Prose area */}
            <div className="px-8 pb-8 max-w-3xl mx-auto" style={{ paddingLeft: '38vw' }}>
              {/* God voice */}
              <p
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                  fontSize: '0.9rem',
                  color: 'rgba(212,168,122,0.7)',
                  marginBottom: '12px',
                  lineHeight: 1.6,
                }}
              >
                {godVoiceOverride ?? currentDilemma.godVoice}
              </p>

              {/* Setup prose */}
              <p
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '1rem',
                  color: 'rgba(200,190,170,0.85)',
                  marginBottom: '24px',
                  lineHeight: 1.7,
                }}
              >
                {currentDilemma.setup}
              </p>

              {/* Choices as prose fragments */}
              <div className="flex flex-col gap-3">
                {currentDilemma.choices.map(choice => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => handleChoice(choice.id)}
                    data-testid={`dilemma-choice-${choice.id}`}
                    className="text-left cursor-pointer transition-all duration-300"
                    style={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontStyle: 'italic',
                      fontSize: '0.95rem',
                      color: 'rgba(180,170,160,0.7)',
                      padding: '12px 16px',
                      borderRadius: '4px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      lineHeight: 1.6,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = 'rgba(212,168,122,0.9)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(212,168,122,0.2)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = 'rgba(180,170,160,0.7)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    }}
                  >
                    {choice.text}
                  </button>
                ))}
              </div>
            </div>
          </ComicPanel>

          {/* Dilemma counter */}
          <div
            className="absolute top-6 right-8"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: '0.75rem',
              color: 'rgba(160,140,180,0.3)',
              letterSpacing: '0.1em',
            }}
          >
            {currentDilemmaIdx + 1} of {dilemmas.length}
          </div>
        </div>
      )}

      {/* Between-dilemma transition text */}
      {fadeState === 'out' && currentDilemmaIdx < dilemmas.length - 1 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              fontSize: '1.2rem',
              color: 'rgba(200,180,140,0.5)',
              letterSpacing: '0.06em',
            }}
          >
            {TESTING_BETWEEN_DILEMMAS}
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | grep -c "error TS"`

Expected: Count should be decreasing. ComicPanel and TestingBeat should compile cleanly (errors will remain in GameView/old modal).

- [ ] **Step 4: Commit**

```bash
git add src/components/MeetTheFirst/ComicPanel.tsx src/components/MeetTheFirst/TestingBeat.tsx
git commit -m "feat(meeting): add ComicPanel and TestingBeat components

ComicPanel composites 4:3 character over 16:9 scene with dissolved edges.
TestingBeat presents dilemmas with comic-panel layout, prose-fragment
choices, god-voice narration, and between-dilemma transitions.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: SparkBeat (Beat 3) + BondBeat (Beat 4)

**Files:**
- Create: `src/components/MeetTheFirst/SparkBeat.tsx`
- Create: `src/components/MeetTheFirst/BondBeat.tsx`

- [ ] **Step 1: Create SparkBeat.tsx**

SparkBeat reuses the same spatial layout as SensingBeat, but with comic-panel composited images and sphere-tinted glow.

```typescript
import { useState, useCallback } from 'react';
import type { SparkVision } from '../../types/meetingEncounter';
import { getSphereColor } from '../../data/sphereIcons';
import { SPARK_TRANSITION_IN } from '../../data/meeting-narrative-prose';
import type { SphereName } from '../../types/graph';

interface SparkBeatProps {
  visions: SparkVision[];
  primarySphere: SphereName;
  onSelect: (vision: SparkVision, index: number) => void;
}

const REST_POSITIONS = [
  { x: -28, y: -8, scale: 0.85, rotate: -1.5 },
  { x: 26,  y: -4, scale: 0.80, rotate: 1.2 },
  { x: -2,  y: 18, scale: 0.88, rotate: 0.6 },
];

const PERIPHERAL_POSITIONS = [
  { x: -40, y: -6,  scale: 0.45, rotate: -3 },
  { x: 42,  y: -10, scale: 0.42, rotate: 2.5 },
  { x: -38, y: 14,  scale: 0.44, rotate: 1.8 },
];

const FOCUS_SCALE = 1.1;
const CONFIRM_SCALE = 1.8;
const CONFIRM_DELAY_MS = 1200;
const SCENE_BG = '#0a0a0f';

export function SparkBeat({ visions, primarySphere, onSelect }: SparkBeatProps) {
  const [phase, setPhase] = useState<'transition' | 'choosing'>('transition');
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const [confirmedIdx, setConfirmedIdx] = useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const sphereColor = getSphereColor(primarySphere);

  // Transition in — show prose, then reveal visions
  useState(() => {
    setTimeout(() => setPhase('choosing'), 2500);
  });

  const handleClick = useCallback((idx: number) => {
    if (confirmedIdx !== null || phase !== 'choosing') return;

    if (focusedIdx === idx) {
      setConfirmedIdx(idx);
      setTimeout(() => onSelect(visions[idx], idx), CONFIRM_DELAY_MS);
    } else {
      setFocusedIdx(idx);
    }
  }, [focusedIdx, confirmedIdx, phase, onSelect, visions]);

  const getStyle = (idx: number): React.CSSProperties => {
    const isFocused = focusedIdx === idx;
    const isConfirmed = confirmedIdx === idx;
    const isHovered = hoveredIdx === idx;
    const somethingFocused = focusedIdx !== null;

    if (isConfirmed) {
      return {
        transform: `translate(-50%, -50%) scale(${CONFIRM_SCALE})`,
        opacity: 0,
        filter: `brightness(1.4) blur(4px) drop-shadow(0 0 40px ${sphereColor}40)`,
        zIndex: 10,
      };
    }
    if (isFocused) {
      return {
        transform: `translate(-50%, -50%) scale(${FOCUS_SCALE})`,
        opacity: 1,
        filter: `brightness(1.1) drop-shadow(0 0 20px ${sphereColor}20)`,
        zIndex: 5,
      };
    }
    if (somethingFocused) {
      const p = PERIPHERAL_POSITIONS[idx] ?? PERIPHERAL_POSITIONS[0];
      return {
        transform: `translate(calc(-50% + ${p.x}vw), calc(-50% + ${p.y}vh)) scale(${p.scale}) rotate(${p.rotate}deg)`,
        opacity: 0.3,
        filter: 'brightness(0.4)',
        zIndex: 1,
      };
    }
    const r = REST_POSITIONS[idx] ?? REST_POSITIONS[0];
    const hoverScale = isHovered ? r.scale + 0.06 : r.scale;
    return {
      transform: `translate(calc(-50% + ${r.x}vw), calc(-50% + ${r.y}vh)) scale(${hoverScale}) rotate(${r.rotate}deg)`,
      opacity: isHovered ? 0.95 : 0.55,
      filter: isHovered ? `brightness(1.15) drop-shadow(0 0 10px ${sphereColor}15)` : 'brightness(0.65)',
      zIndex: isHovered ? 3 : 2,
    };
  };

  return (
    <div className="h-screen relative overflow-hidden" style={{ background: SCENE_BG }}>
      {/* Transition prose */}
      <p
        className="absolute left-0 right-0 text-center transition-all duration-1000"
        style={{
          top: '7vh',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic',
          fontSize: '1.3rem',
          letterSpacing: '0.06em',
          color: 'rgba(160,140,180,0.5)',
          opacity: phase === 'transition' ? 1 : confirmedIdx !== null ? 0 : focusedIdx !== null ? 0.4 : 0.7,
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        {phase === 'transition'
          ? SPARK_TRANSITION_IN
          : focusedIdx !== null
            ? 'Click again to choose this path.'
            : 'What will they become?'}
      </p>

      {/* Vision images — same spatial layout as SensingBeat */}
      {phase === 'choosing' && visions.map((vision, idx) => {
        const isFocused = focusedIdx === idx;
        const style = getStyle(idx);

        return (
          <button
            key={vision.id}
            type="button"
            onClick={() => handleClick(idx)}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            data-testid={`spark-vision-${idx}`}
            className="absolute cursor-pointer"
            style={{
              top: '50%',
              left: '50%',
              width: 'min(900px, 55vw)',
              aspectRatio: '16/9',
              background: 'transparent',
              border: 'none',
              padding: 0,
              ...style,
              transition: 'transform 1s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.8s ease, filter 0.6s ease',
            }}
          >
            {/* Scene backdrop */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${vision.sceneAssetPath}), ${vision.scenePlaceholder}`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                maskImage: 'radial-gradient(ellipse 90% 85% at center, black 30%, transparent 95%)',
                WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at center, black 30%, transparent 95%)',
              }}
            />
            {/* Character portrait overlay */}
            <div
              className="absolute bottom-0 left-0"
              style={{
                width: '40%',
                aspectRatio: '3/4',
                backgroundImage: `url(${vision.portraitAssetPath}), ${vision.portraitPlaceholder}`,
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
                maskImage: 'linear-gradient(to top, transparent 0%, black 15%, black 80%, transparent 100%), linear-gradient(to right, black 0%, black 60%, transparent 100%)',
                maskComposite: 'intersect',
                WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 15%, black 80%, transparent 100%), linear-gradient(to right, black 0%, black 60%, transparent 100%)',
                WebkitMaskComposite: 'source-in',
              }}
            />
            {/* Vision prose — only when focused */}
            <div
              className="absolute left-0 right-0 text-center px-8 transition-opacity duration-700"
              style={{
                bottom: '-12vh',
                opacity: isFocused ? 1 : 0,
                pointerEvents: 'none',
              }}
            >
              <p
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                  fontSize: '0.95rem',
                  lineHeight: 1.7,
                  color: `${sphereColor}cc`,
                  maxWidth: '600px',
                  margin: '0 auto',
                }}
              >
                {vision.prose}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create BondBeat.tsx**

```typescript
import { useState, useEffect } from 'react';
import type { NarrativeCandidate, SparkVision } from '../../types/meetingEncounter';
import { BOND_PROSE, BOND_PROSE_FALLBACK, BOND_RELEASE_TEXT } from '../../data/meeting-narrative-prose';
import { getSphereColor } from '../../data/sphereIcons';
import type { SphereName } from '../../types/graph';

interface BondBeatProps {
  candidate: NarrativeCandidate;
  vision: SparkVision;
  hungerId: string;
  primarySphere: SphereName;
  onComplete: (editedName: string | undefined) => void;
}

const SCENE_BG = '#0a0a0f';

export function BondBeat({ candidate, vision, hungerId, primarySphere, onComplete }: BondBeatProps) {
  const [phase, setPhase] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(candidate.name);

  const sphereColor = getSphereColor(primarySphere);
  const bondProse = BOND_PROSE[hungerId] ?? BOND_PROSE_FALLBACK;

  // Staggered reveal
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),   // Image appears
      setTimeout(() => setPhase(2), 1500),  // Bond prose
      setTimeout(() => setPhase(3), 3000),  // Name + epithet
      setTimeout(() => setPhase(4), 4000),  // Release button
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const lineStyle = (minPhase: number): React.CSSProperties => ({
    opacity: phase >= minPhase ? 1 : 0,
    transform: phase >= minPhase ? 'translateY(0)' : 'translateY(8px)',
    transition: 'opacity 1s ease, transform 1s ease',
  });

  return (
    <div
      className="h-screen flex flex-col items-center justify-center"
      style={{ background: SCENE_BG }}
    >
      {/* Vision portrait — fades in */}
      <div
        style={{
          width: 'min(600px, 50vw)',
          aspectRatio: '4/3',
          backgroundImage: `url(${vision.portraitAssetPath}), ${vision.portraitPlaceholder}`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          maskImage: 'radial-gradient(ellipse 90% 90% at center, black 30%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at center, black 30%, transparent 90%)',
          ...lineStyle(1),
          marginBottom: '3vh',
        }}
      />

      {/* Bond prose */}
      <p
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic',
          fontSize: '1.2rem',
          color: `${sphereColor}99`,
          letterSpacing: '0.04em',
          textAlign: 'center',
          maxWidth: '600px',
          lineHeight: 1.7,
          ...lineStyle(2),
          marginBottom: '3vh',
        }}
      >
        {bondProse}
      </p>

      {/* Name + epithet */}
      <div style={{ ...lineStyle(3), textAlign: 'center' }}>
        {editingName ? (
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => { if (e.key === 'Enter') setEditingName(false); }}
            autoFocus
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: `1px solid ${sphereColor}40`,
              fontFamily: 'Cinzel, Georgia, serif',
              fontSize: '1.8rem',
              color: '#e8e0d0',
              textAlign: 'center',
              width: '400px',
              outline: 'none',
            }}
          />
        ) : (
          <h2
            onClick={() => setEditingName(true)}
            className="cursor-pointer"
            style={{
              fontFamily: 'Cinzel, Georgia, serif',
              fontSize: '1.8rem',
              color: '#e8e0d0',
              letterSpacing: '0.08em',
              marginBottom: '8px',
            }}
            title="Click to edit name"
          >
            {name}
          </h2>
        )}
        <p
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontStyle: 'italic',
            fontSize: '0.9rem',
            color: 'rgba(200,190,170,0.6)',
            letterSpacing: '0.04em',
          }}
        >
          {candidate.epithet}
        </p>
      </div>

      {/* Release button */}
      <button
        type="button"
        onClick={() => onComplete(name !== candidate.name ? name : undefined)}
        data-testid="bond-release"
        style={{
          ...lineStyle(4),
          marginTop: '4vh',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic',
          fontSize: '1rem',
          color: `${sphereColor}88`,
          background: 'transparent',
          border: `1px solid ${sphereColor}20`,
          padding: '12px 32px',
          borderRadius: '4px',
          cursor: 'pointer',
          letterSpacing: '0.06em',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = `${sphereColor}40`;
          e.currentTarget.style.color = `${sphereColor}cc`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = `${sphereColor}20`;
          e.currentTarget.style.color = `${sphereColor}88`;
        }}
      >
        {BOND_RELEASE_TEXT}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | grep -c "error TS"`

- [ ] **Step 4: Commit**

```bash
git add src/components/MeetTheFirst/SparkBeat.tsx src/components/MeetTheFirst/BondBeat.tsx
git commit -m "feat(meeting): add SparkBeat and BondBeat components

SparkBeat — spatial vision selection with sphere-tinted glow and
comic-panel composite images. BondBeat — staggered reveal of bond
prose, name (click-to-edit), epithet, and release button.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: MeetTheFirstFlow Orchestrator

**Files:**
- Create: `src/components/MeetTheFirst/MeetTheFirstFlow.tsx`

- [ ] **Step 1: Create the orchestrator**

```typescript
import { useState, useCallback, useMemo } from 'react';
import type { MeetingEncounterResult, NarrativeCandidate, SparkVision } from '../../types/meetingEncounter';
import type { DilemmaInstance, DilemmaChoiceRecord } from '../../types/meetingEncounter';
import type { AscendantIdentity } from '../../types/remembrance';
import type { WorldGraph } from '../../types/graph';
import type { SphereName } from '../../types/graph';
import { SensingBeat } from './SensingBeat';
import { TestingBeat } from './TestingBeat';
import { SparkBeat } from './SparkBeat';
import { BondBeat } from './BondBeat';
import { generateNarrativeCandidates, generateSparkVisions, buildNarrativeResult } from '../../engine/meetingEncounter';
import { selectDilemmas } from '../../engine/meetingEncounter';
import { ENRICHED_DILEMMA_LIBRARY } from '../../data/meeting-dilemma-library';
import { DILEMMA_TEMPLATES } from '../../data/meeting-content';
import { SENSING_OPENING_PROSE, SENSING_OPENING_FALLBACK } from '../../data/meeting-narrative-prose';

type MeetBeat = 'sensing' | 'testing' | 'spark' | 'bond';

interface MeetTheFirstFlowProps {
  ascendantIdentity: AscendantIdentity;
  graph: WorldGraph;
  ascendantId: string;
  locationId: string;
  seed: number;
  tick: number;
  onComplete: (result: MeetingEncounterResult) => void;
  onClose: () => void;
}

export function MeetTheFirstFlow({
  ascendantIdentity,
  graph,
  ascendantId,
  locationId,
  seed,
  tick,
  onComplete,
  onClose,
}: MeetTheFirstFlowProps) {
  const [beat, setBeat] = useState<MeetBeat>('sensing');

  // Accumulated state
  const [selectedCandidate, setSelectedCandidate] = useState<NarrativeCandidate | null>(null);
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);
  const [dilemmaChoices, setDilemmaChoices] = useState<DilemmaChoiceRecord[]>([]);
  const [selectedVision, setSelectedVision] = useState<SparkVision | null>(null);

  const hungerId = ascendantIdentity.hungerId;
  const primarySphere = ascendantIdentity.sphereAlignment.primary;
  const locationNode = graph.getNode(locationId);
  const cultureId = (locationNode?.properties.cultureId as string) ?? 'default';
  const locationSubtype = (locationNode?.properties.locationSubtype as string) ?? 'village';

  // Generate candidates (memoized on seed + hunger)
  const candidates = useMemo(
    () => generateNarrativeCandidates(hungerId, cultureId, seed),
    [hungerId, cultureId, seed],
  );

  // Opening prose
  const openingProse = SENSING_OPENING_PROSE[hungerId] ?? SENSING_OPENING_FALLBACK;

  // ─── Beat handlers ───

  const handleSensingSelect = useCallback((candidate: NarrativeCandidate, index: number) => {
    setSelectedCandidate(candidate);
    setSelectedCandidateIndex(index);
    setBeat('testing');
  }, []);

  const handleTestingComplete = useCallback((choices: DilemmaChoiceRecord[]) => {
    setDilemmaChoices(choices);
    setBeat('spark');
  }, []);

  const handleSparkSelect = useCallback((vision: SparkVision) => {
    setSelectedVision(vision);
    setBeat('bond');
  }, []);

  const handleBondComplete = useCallback((editedName: string | undefined) => {
    if (!selectedCandidate || !selectedVision) return;

    const result = buildNarrativeResult({
      candidate: selectedCandidate,
      vision: selectedVision,
      dilemmaChoices,
      editedName,
      locationId,
      ascendantSphere: primarySphere,
      tick,
    });

    // Set the candidate index in the record
    result.meetingChoiceRecord.candidateIndex = selectedCandidateIndex;

    onComplete(result);
  }, [selectedCandidate, selectedVision, dilemmaChoices, locationId, primarySphere, tick, selectedCandidateIndex, onComplete]);

  // Generate dilemmas for the selected candidate
  const dilemmas = useMemo(() => {
    if (!selectedCandidate) return [];
    const templates = ENRICHED_DILEMMA_LIBRARY.length > 0 ? ENRICHED_DILEMMA_LIBRARY : DILEMMA_TEMPLATES;
    return selectDilemmas(
      templates,
      selectedCandidate.primaryReach,
      selectedCandidate.secondaryReach,
      selectedCandidate.sphere,
      selectedCandidate.archetypeId,
      locationSubtype,
      seed + 1,
    );
  }, [selectedCandidate, locationSubtype, seed]);

  // Generate spark visions for the selected candidate
  const sparkVisions = useMemo(() => {
    if (!selectedCandidate) return [];
    return generateSparkVisions(selectedCandidate.primaryReach, primarySphere, seed + 2);
  }, [selectedCandidate, primarySphere, seed]);

  return (
    <div className="fixed inset-0 z-50" style={{ background: '#0a0a0f' }}>
      {beat === 'sensing' && (
        <SensingBeat
          candidates={candidates}
          openingProse={openingProse}
          onSelect={handleSensingSelect}
        />
      )}

      {beat === 'testing' && selectedCandidate && (
        <TestingBeat
          candidate={selectedCandidate}
          dilemmas={dilemmas}
          onComplete={handleTestingComplete}
        />
      )}

      {beat === 'spark' && (
        <SparkBeat
          visions={sparkVisions}
          primarySphere={primarySphere}
          onSelect={handleSparkSelect}
        />
      )}

      {beat === 'bond' && selectedCandidate && selectedVision && (
        <BondBeat
          candidate={selectedCandidate}
          vision={selectedVision}
          hungerId={hungerId}
          primarySphere={primarySphere}
          onComplete={handleBondComplete}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | grep "MeetTheFirstFlow" | head -5`

Expected: No errors from MeetTheFirstFlow.tsx. (Other files may still have errors from old type references.)

- [ ] **Step 3: Commit**

```bash
git add src/components/MeetTheFirst/MeetTheFirstFlow.tsx
git commit -m "feat(meeting): add MeetTheFirstFlow orchestrator

4-beat flow: Sensing → Testing → Spark → Bond. Mirrors
RemembranceFlow.tsx pattern with accumulated state per beat.
Generates narrative candidates, dilemmas, and spark visions
from Ascendant identity. Full-screen fixed overlay (z-50).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: GameView Integration

**Files:**
- Modify: `src/components/Game/GameView.tsx`

- [ ] **Step 1: Replace MeetingEncounterModal with MeetTheFirstFlow**

In GameView.tsx, find the MeetingEncounterModal import and conditional render (around lines 2742-2759) and replace:

**Import change** — find the `MeetingEncounterModal` import and replace:

```typescript
// OLD:
// import { MeetingEncounterModal } from './MeetingEncounterModal';

// NEW:
import { MeetTheFirstFlow } from '../MeetTheFirst/MeetTheFirstFlow';
```

**JSX change** — find the `{meetingState && (<MeetingEncounterModal .../>)}` block and replace:

```typescript
{meetingState && ascendantIdentity && (
  <MeetTheFirstFlow
    ascendantIdentity={ascendantIdentity}
    graph={gameState.graph}
    ascendantId={gameState.ascendantId}
    locationId={meetingState.locationId}
    seed={gameState.seed}
    tick={gameState.tick}
    onComplete={handleMeetingComplete}
    onClose={handleMeetingClose}
  />
)}
```

Where `ascendantIdentity` comes from the GameView props (already passed as `ascendantIdentity?: AscendantIdentity`).

- [ ] **Step 2: Update handleMeetingComplete to work with new result shape**

The `handleMeetingComplete` callback should already work since `MeetingEncounterResult` is the same type (we updated the fields but kept the interface name). Verify the function doesn't reference `shapePath`, `sparkTraitId`, or `investmentChoiceId`.

Check: `grep -n "sparkTraitId\|investmentChoiceId\|shapePath" src/components/Game/GameView.tsx`

If any references exist, remove them.

- [ ] **Step 3: Update createMeetingEncounterState calls**

The `handleStartMeeting` function calls `createMeetingEncounterState()` which may reference old intent fields. Since the narrative flow generates its own candidates, simplify the state creation or keep the minimal fields the flow needs (id, locationId, ascendantId, tick, status).

If `createMeetingEncounterState` needs updating, update it in `meetingEncounter.ts` to drop the intent-derivation logic:

```typescript
export function createMeetingEncounterState(
  locationId: string,
  ascendantId: string,
  tick: number,
): MeetingEncounterState {
  return {
    id: `meeting_${tick}_${Date.now()}`,
    currentStep: 'sensing',
    locationId,
    ascendantId,
    startedTick: tick,
    status: 'active',
  };
}
```

- [ ] **Step 4: Run type check**

Run: `npx tsc --noEmit 2>&1 | head -40`

Expected: Errors should be minimal. Fix any remaining type mismatches.

- [ ] **Step 5: Run all tests**

Run: `npm test 2>&1 | tail -30`

Expected: All tests pass. Some old meeting tests may need updating if they reference removed fields.

- [ ] **Step 6: Build check**

Run: `npx vite build 2>&1 | tail -10`

Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/components/Game/GameView.tsx src/engine/meetingEncounter.ts
git commit -m "feat(meeting): wire MeetTheFirstFlow into GameView

Replace MeetingEncounterModal with full-screen MeetTheFirstFlow overlay.
Simplify createMeetingEncounterState for narrative flow. Update imports.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Fix Remaining Type Errors & Clean Up

**Files:**
- Various — fix any remaining compilation errors

- [ ] **Step 1: Find all remaining type errors**

Run: `npx tsc --noEmit 2>&1`

Catalog every error. Common expected issues:
- Old test files referencing `sparkTraitId`, `investmentChoiceId`, `shapePath`, `intentPrimaryReach`
- Old MeetingEncounterModal component still importing removed types
- Any downstream consumers of `MeetingChoiceRecord` old fields

- [ ] **Step 2: Fix each error**

For each error:
- If it's in a test file: update the test to use new fields
- If it's in `MeetingEncounterModal.tsx`: leave the old component file for now (it's no longer imported by GameView, so it won't be included in the build, but we don't delete it yet in case we need reference)
- If it's in engine code: update to use new types

- [ ] **Step 3: Run full validation**

```bash
npm test && npx tsc --noEmit && npx vite build
```

Expected: All three pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "fix(meeting): resolve remaining type errors from narrative redesign

Update tests and engine code for new MeetingChoiceRecord shape.
Clean up references to removed fields (sparkTraitId, investmentChoiceId,
shapePath, intentPrimaryReach/SecondaryReach/Sphere).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Smoke Test & Verification

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Navigate to game view**

Open `http://localhost:5173/?view=game` in browser.

- [ ] **Step 3: Trigger Meet the First**

The meeting should auto-trigger after tick 2 at a settled location. Verify:
- Full-screen dark overlay appears
- 3 candidate images visible in spatial layout
- Hover brightens images
- Click focuses one (prose appears)
- Click again confirms (image zooms, fades)
- Dilemma scene appears with comic-panel composition
- Choices are prose fragments, not buttons
- Spark visions appear after dilemmas
- Bond beat shows name + epithet + release button
- Clicking "Let them walk" creates the agent and returns to game

- [ ] **Step 4: Verify agent creation**

Open debug panel (F1) and run: `agents` — verify the new agent exists with `createdByMeeting: true`.

- [ ] **Step 5: Run pre-commit checklist**

```bash
npm test && npx tsc --noEmit && npx vite build
```

All three must pass.

- [ ] **Step 6: Final commit and push**

```bash
git push
```
