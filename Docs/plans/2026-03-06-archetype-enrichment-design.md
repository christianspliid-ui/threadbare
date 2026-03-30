# Archetype Content Enrichment — Design Document

**Goal:** Enrich the existing 19 narrative archetypes in `archetype-content.ts` with tone keywords, beat patterns, vignette seeds, and narrative requirements — the four content layers specified in the Content Strategy and Narrative Context Pipeline design docs.

**Source specs:**
- `Docs/plans/2026-03-06-content-strategy.md` §3 (archetype table, requirements table)
- `Docs/plans/2026-03-06-narrative-context-pipeline.md` §4 (beat pattern interface, examples)

---

## 1. Approach: Enrich In-Place

Expand the existing `NarrativeArchetype` interface and enrich all 19 entries within `archetype-content.ts`. No file splitting — one content package, one file, one place the content writer edits.

**Rationale:** Matches the content package pattern (single file per domain). The file grows from ~45 to ~500 lines — well within bounds for a data file. Both design docs explicitly reference `archetype-content.ts` as the home for all archetype data.

---

## 2. Enriched Interface

```typescript
export interface ToneKeywords {
  adjectives: string[];     // 5-8 adjective palette for this archetype
  verbs: string[];          // 5-8 preferred verbs
  sentenceRhythm: string;   // prose guidance, e.g. "Short punchy clauses. No compound sentences."
}

export interface BeatPattern {
  eventTypes: NarrativeEventType[];
  minimumTier: NarrativeTier;
  promoteTo?: NarrativeTier;
  narrativeRequirements: NarrativeRequirement[];
  contextPreferences: string[];
}

export interface NarrativeRequirement {
  category: 'artifact' | 'location' | 'character' | 'faction';
  tags: string[];
  required: boolean;        // true = spawn if absent
  culturallyShape: boolean; // true = use local culture vocabulary
}

export interface NarrativeArchetype {
  id: string;
  name: string;
  storyShape: string;
  proseTone: string;
  reachAffinities: ReachDomain[];
  toneKeywords: ToneKeywords;
  beatPatterns: BeatPattern[];
  vignetteSeeds: string[];  // 3-5 chronicler fragments per archetype
  narrativeRequirements: NarrativeRequirement[];  // archetype-level defaults
}
```

### Design Decisions

| Decision | Chosen | Alternative | Rationale |
|----------|--------|-------------|-----------|
| BeatPattern types defined locally | In archetype-content.ts | Import from types/narrative.ts | Content package owns its own shapes; engine will import from here when pipeline is built |
| narrativeRequirements at two levels | Archetype-level defaults + per-beat overrides | Only per-beat | Archetype-level defaults (e.g., "Tragic Hero always wants legendary weapons nearby") reduce repetition across beats |
| vignetteSeeds as plain strings | string[] with {name} placeholder | Structured objects with tags | Vignettes are short prose fragments — structured metadata adds complexity without value. A simple {name} substitution handles the common case. |
| sentenceRhythm as guidance string | Free-text string | Enum of rhythm types | Rhythm varies too much between archetypes for an enum to capture. A guidance string lets the content writer express nuance. |

---

## 3. Content Scope Per Archetype

Each archetype gets:

- **toneKeywords:** 5-8 adjectives, 5-8 verbs, 1 rhythm guidance string
- **beatPatterns:** 2-4 patterns covering the archetype's signature moments (death, critical success, trait changes, tier transitions)
- **vignetteSeeds:** 3-5 short chronicler-voice fragments with `{name}` placeholder
- **narrativeRequirements:** 2-4 archetype-level object demands (from Content Strategy §3 table)

Total new content per archetype: ~25-35 lines of TypeScript data.
Total file size after enrichment: ~500-600 lines.

---

## 4. Beat Pattern Coverage

Every archetype needs at least these signature beats:

| Beat | Event Types | Typical Promotion |
|------|-------------|-------------------|
| **Signature death** | `actor_death` | notable → chronicle (for dramatic archetypes) |
| **Defining action** | `action_critical`, `contested_action` | routine → notable |
| **Character growth** | `trait_acquired`, `tier_transition` | routine → notable |

Some archetypes get additional beats:
- **Trickster:** scheme succeeding (`contested_action` success → notable)
- **True Believer:** faith tested (`doom_escalation` → chronicle)
- **Seeker:** knowledge discovered (`trait_acquired` → notable, with library/ruin required)
- **Schemer:** betrayal (`contested_action` → notable, with poison/document required)

---

## 5. Lookup Functions

Three new exports alongside the existing `getArchetype()`:

```typescript
export function getArchetypeTone(id: string): ToneKeywords | undefined;
export function getArchetypeBeatPatterns(id: string): BeatPattern[];
export function getArchetypeVignette(id: string, seed: number): string | undefined;
```

`getArchetypeVignette` uses a seeded index to pick deterministically from the vignette pool — consistent with the project's determinism priority.

---

## 6. Backward Compatibility

The existing `NarrativeArchetype` interface gains new required fields. All 19 entries are populated in this task, so no consumer breaks. The existing `getArchetype()` function and `AgentDetailPanel` consumer continue working unchanged — they simply gain access to richer data.

---

## 7. Test Coverage

- All 19 archetypes have all required fields populated
- Every archetype has ≥2 beat patterns, ≥3 vignette seeds, ≥2 narrative requirements
- Beat patterns reference only valid `NarrativeEventType` values
- Vignette seeds contain `{name}` placeholder
- Tone keywords have ≥5 adjectives and ≥5 verbs each
- Lookup functions return correct data
- `getArchetypeVignette` is deterministic (same seed → same pick)
