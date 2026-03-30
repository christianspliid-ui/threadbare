# Cosmological Symmetry Refactor — Implementation Plan

> **TB-075** | Design: 2026-03-28 | Status: Ready for implementation
> Canonical source: Obsidian → `TheFantasyWorldSimulator/Cosmology/The Cosmological Pattern.md`
> Brainstorm: Obsidian → `TheFantasyWorldSimulator/Brainstorms/brainstorm-cosmological-symmetry.md`

## Summary

The cosmological model has been restructured from 9 reaches + loose sphere mappings to a symmetric 4-8-8-1 pattern: 4 Foundation spheres → 8 Creation spheres → 8 Reaches + Quintessence. This requires updating the codebase to reflect:

1. **Flesh reach removed** — elevated to Quintessence (a derived meta-property, not a reach)
2. **Two axiological pairs replaced** — Stone: `humility_pride` → `preservation_transformation`; Eye: `frankness_propriety` → `revelation_discretion`
3. **One axiological pair retired** — `stoicism_passion` (was Flesh's pair) removed entirely
4. **Archetype pairs added** — each axiological pole now has a named character archetype
5. **Reach colors updated** — reaches inherit sphere colors from the 1:1 pairing
6. **Nine → Eight** throughout — comments, constants, UI layouts

## Design Decisions (settled, do not revisit)

- **Reach colors:** Adopt sphere colors. Old colors were from the previous model.
- **Flesh content migration:** Hybrid. Narrative lexicon → Quintessence descriptors. Flesh actions → redistribute (healing→Gold, athletics→Iron, body-mod→Stone, survival→Star). FLESH_MAX_HOPS → replace with location-based proximity check.
- **Foundation governance:** Deferred — doesn't block this refactor.
- **Quintessence axiological pair:** None. It's a meter, not a personality axis.
- **Stoicism↔Passion:** Retired. Meta-axis (Vanguard↔Watcher) covers boldness.

## Phase 1: Type System & Constants (no content changes)

The foundation that everything else depends on. Must be done first and atomically.

### 1a. `src/types/traits.ts` — ReachDomain

```typescript
// BEFORE: 9 reaches
export type ReachDomain =
  | 'iron' | 'gold' | 'shadow' | 'veil' | 'heart'
  | 'eye' | 'stone' | 'star' | 'flesh';

// AFTER: 8 reaches
export type ReachDomain =
  | 'iron' | 'gold' | 'shadow' | 'veil' | 'heart'
  | 'eye' | 'stone' | 'star';

export const REACH_DOMAINS: ReachDomain[] = [
  'iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star',
];
```

Remove `flesh` from `NARRATIVE_LEXICON` (move its content to a new `QUINTESSENCE_LEXICON` constant — see Phase 3).

### 1b. `src/types/agent.ts` — ValuePair & Mappings

```typescript
// BEFORE: 10 pairs (9 reach-bound + 1 meta)
// AFTER: 9 pairs (8 reach-bound + 1 meta)

export type ValuePair =
  | 'mercy_ruthlessness'           // Iron   — Protector ↔ Conqueror
  | 'asceticism_extravagance'      // Gold   — Mender ↔ Magnate
  | 'honesty_cunning'              // Shadow — Confessor ↔ Puppeteer
  | 'tradition_novelty'            // Veil   — Archivist ↔ Heretic
  | 'loyalty_ambition'             // Heart  — Sworn ↔ Renegade
  | 'revelation_discretion'        // Eye    — Seeker ↔ Sentinel (was frankness_propriety)
  | 'preservation_transformation'  // Stone  — Guardian ↔ Shaper (was humility_pride)
  | 'sacrifice_survival'           // Star   — Martyr ↔ Survivor
  | 'courage_prudence';            // Meta   — Vanguard ↔ Watcher

// Remove: 'frankness_propriety', 'humility_pride', 'stoicism_passion'
// Add: 'revelation_discretion', 'preservation_transformation'

export const VALUE_PAIRS: readonly ValuePair[] = [
  'mercy_ruthlessness',
  'asceticism_extravagance',
  'honesty_cunning',
  'tradition_novelty',
  'loyalty_ambition',
  'revelation_discretion',
  'preservation_transformation',
  'sacrifice_survival',
  'courage_prudence',
] as const;

export const REACH_VALUE_PAIR: Record<ReachDomain, ValuePair> = {
  iron:   'mercy_ruthlessness',
  gold:   'asceticism_extravagance',
  shadow: 'honesty_cunning',
  veil:   'tradition_novelty',
  heart:  'loyalty_ambition',
  eye:    'revelation_discretion',
  stone:  'preservation_transformation',
  star:   'sacrifice_survival',
};
```

### 1c. New: Archetype pair names constant

Add to `src/types/agent.ts` or a new `src/data/archetype-names.ts`:

```typescript
/** Character archetype names for each axiological pole */
export const ARCHETYPE_NAMES: Record<ValuePair, [string, string]> = {
  mercy_ruthlessness:          ['Protector', 'Conqueror'],
  asceticism_extravagance:     ['Mender', 'Magnate'],
  honesty_cunning:             ['Confessor', 'Puppeteer'],
  tradition_novelty:           ['Archivist', 'Heretic'],
  loyalty_ambition:            ['Sworn', 'Renegade'],
  revelation_discretion:       ['Seeker', 'Sentinel'],
  preservation_transformation: ['Guardian', 'Shaper'],
  sacrifice_survival:          ['Martyr', 'Survivor'],
  courage_prudence:            ['Vanguard', 'Watcher'],
};
```

### 1d. Reach color constants

Update `src/components/CMS/registry.ts` REACH_BADGE_COLORS to match sphere colors:

```typescript
export const REACH_BADGE_COLORS: Record<ReachDomain, string> = {
  iron:   '#ff6b6b',  // Force red
  stone:  '#d4a87a',  // Matter warm tan
  eye:    '#ffe44d',  // Energy gold (may need darkening for text contrast)
  gold:   '#33ff77',  // Life green (may need darkening for text contrast)
  veil:   '#44aaff',  // Mind blue
  heart:  '#cc66ff',  // Spirit purple
  star:   '#ffb355',  // Time amber
  shadow: '#8fd4c0',  // Entropy teal
};
// Remove: flesh entry
```

Note: Some of these hex values (especially Life green `#33ff77` and Energy gold `#ffe44d`) are too bright for text contrast. Darken for badge use — e.g., Life → `#22cc55`, Energy → `#d4a017`.

### Phase 1 verification

After Phase 1, run `npx tsc --noEmit`. This will produce ~100+ type errors across all files that reference the old types. That's expected — it's the compiler telling us exactly what to fix in Phase 2.

---

## Phase 2: Mechanical Propagation (fix every type error)

Work through every TypeScript error from Phase 1. These are mostly find-and-replace operations.

### 2a. String key renames (global find-replace)

| Old key | New key | Files affected |
|---------|---------|---------------|
| `'frankness_propriety'` | `'revelation_discretion'` | ~20 files |
| `'humility_pride'` | `'preservation_transformation'` | ~40 files (most common) |
| `'stoicism_passion'` | **DELETE** (see 2b) | ~15 files |
| `'flesh'` (as ReachDomain) | **DELETE** (see 2c) | ~15 files |

**Important:** `humility_pride` appears in action template motivations across `action-template-content.ts` and `unified-action-templates.ts` (~25 occurrences). These are semantic, not just renames — the motivation for a Stone action was "humility vs pride" and is now "preservation vs transformation". Review each occurrence:

- If the action is about building/crafting/infrastructure → `preservation_transformation` fits directly
- If the action was using humility_pride as "ego" motivation → consider whether `preservation_transformation` still works or if a different pair is more appropriate

### 2b. Remove `stoicism_passion` everywhere

This pair is retired. Every reference must be removed:

- `VALUE_PAIRS` array: remove entry
- `VALUE_LABELS`: remove entry
- `INTENSITY_VALUE_LABELS`: remove entry
- `FEAR_DESCRIPTIONS`: remove entry
- `VALUE_WORD_MAP`: remove entry
- `backstory-content.ts`: remove `stoicism_passion` turning point prose and contradiction prose
- `strand-content.ts`: remove all stoicism_passion entries
- `AxiologicalProfile` type: Since this is `Record<ValuePair, number>`, it auto-shrinks when ValuePair changes. But any code that initializes profiles by iterating `VALUE_PAIRS` will automatically handle this.
- Tests: remove stoicism_passion from expected lists

### 2c. Remove `flesh` as a ReachDomain everywhere

- `REACH_DOMAINS` array: remove
- `NARRATIVE_LEXICON`: move flesh entry to `QUINTESSENCE_LEXICON`
- `DOMAIN_WORD_SCALES`: remove flesh entry
- `REACH_BADGE_COLORS`: remove flesh entry
- `REACH_BASED_FEARS`: remove Flesh entry (or move to Quintessence fears)
- `REACH_FEAR_LABELS`: remove Flesh entry
- `CONTENT_COUNTS`: update `REACH_BASED_FEARS: 9` → `8`
- UI components referencing flesh display name/emoji:
  - `AgentDetailPanel.tsx` — remove flesh from 3×3 grid (now 2×4 or other layout)
  - `AgentInfoCard.tsx` — remove flesh display
  - `AgentProfileModal.tsx` — remove flesh from domain name mapping
  - `MeetingEncounterModal.tsx` — remove flesh emoji '⚕'
  - `TieredEncounterModal.tsx` — remove flesh emoji '⚕'
  - `ArchetypeCard.tsx` — remove 'Flesh' display name
- `agent-behavior-constants.ts`: remove `FLESH_MAX_HOPS`
- `tunableConstants.ts`: remove FLESH_MAX_HOPS tunable
- `encounterAwareness.ts`: remove flesh-specific hop cap logic

### 2d. Agent grid layout change

The agent detail panel currently uses a 3×3 grid for 9 reaches. With 8 reaches, switch to a **2×4 grid** (two rows of four). This is cleaner and avoids an awkward gap.

Files: `AgentDetailPanel.tsx`, potentially `AgentProfileModal.tsx`

---

## Phase 3: Content Rewrite (semantic, not mechanical)

These changes require new prose, not just find-replace.

### 3a. New axiological content for `preservation_transformation` (Stone)

Write new content for all content pools:

- `VALUE_LABELS`: `['Preserving', 'Transformative']`
- `VALUE_WORD_MAP`: `['Preserving', 'Transformative']`
- `INTENSITY_VALUE_LABELS`: Three-level intensity prose (weak/moderate/strong for both poles)
- `FEAR_DESCRIPTIONS`: `['Fears change destroying what they've protected', 'Fears stagnation trapping them in the old']`
- `backstory-content.ts`: New turning point and contradiction prose for preservation_transformation
- `meeting-content.ts`: Review meeting dilemmas that referenced humility_pride — rewrite Stone dilemmas around preservation vs transformation
- `agenda-content.ts`: 3 agenda entries reference humility_pride → rewrite as preservation_transformation agendas

### 3b. New axiological content for `revelation_discretion` (Eye)

Write new content for all content pools:

- `VALUE_LABELS`: `['Revealing', 'Discreet']`
- `VALUE_WORD_MAP`: `['Revealing', 'Discreet']`
- `INTENSITY_VALUE_LABELS`: Three-level intensity prose
- `FEAR_DESCRIPTIONS`: `['Fears dangerous knowledge staying hidden', 'Fears reckless revelation destroying the unprepared']`
- `backstory-content.ts`: New turning point and contradiction prose
- `meeting-content.ts`: Review meeting dilemmas that referenced frankness_propriety — rewrite Eye dilemmas around revelation vs discretion

### 3c. Quintessence content (new)

Create `src/data/quintessence-content.ts` (or add to existing content file):

```typescript
/** Quintessence narrative lexicon — derived from old Flesh lexicon */
export const QUINTESSENCE_LEXICON: string[] = [
  'Fraying',     // 1 — barely coherent
  'Flickering',  // 2
  'Tenuous',     // 3
  'Steady',      // 4
  'Rooted',      // 5
  'Resonant',    // 6
  'Crystalline', // 7
  'Radiant',     // 8
  'Transcendent',// 9
  'Absolute',    // 10 — approaching phase transition upward
];

/** Quintessence word scale (5-tier, for UI display) */
export const QUINTESSENCE_WORD_SCALE: [string, string, string, string, string] =
  ['Remnant', 'Flickering', 'Steady', 'Resonant', 'Paragon'];
```

### 3d. Action template motivation audit

`unified-action-templates.ts` has ~25 occurrences of `humility_pride` as a motivation. Each needs review:

- Stone-domain actions (build, fortify, craft): change to `preservation_transformation`
- Actions where "pride" was the real motivation (e.g., "claim territory"): consider if `preservation_transformation` or another pair (like `loyalty_ambition`) is a better fit
- Actions where "humility" was the motivation (e.g., "serve community"): `preservation_transformation` works if framed as "preserving what exists"

`action-template-content.ts` has ~9 occurrences — same audit needed.

### 3e. Flesh action redistribution

The old Flesh reach had action templates. These need new homes:

| Old Flesh action | New reach | Rationale |
|-----------------|-----------|-----------|
| Heal / Mend wounds | Gold (Life) | Life sphere = healing |
| Endurance / Athletic feats | Iron (Force) | Force sphere = physical might |
| Body modification / Shapeshifting | Stone (Matter) | Matter sphere = form change |
| Survival instinct / Hardiness | Star (Time) | Time sphere → Survivor archetype |

If specific action template IDs exist for flesh, they need to be reassigned to the new reach and have their domain field updated.

---

## Phase 4: UI Polish

### 4a. Archetype names in UI

Decide where archetype names appear:

- **StrandView "Desires" section**: Currently shows "Merciful" / "Ruthless" — could prefix with archetype: "The Protector (Merciful)" or just show archetype name at extremes
- **Agent profile**: Could show dominant archetype as a title/epithet
- **Meeting encounter modal**: Axiological dilemma framing could use archetype names

This is additive — doesn't block the refactor. Can be a follow-up.

### 4b. Agent detail grid

Switch from 3×3 (9 reaches) to 2×4 (8 reaches). Check layout at 1920×1080.

### 4c. Color contrast pass

After applying sphere colors to reach badges, verify text readability. Life green and Energy gold will likely need darker variants for badge backgrounds with white text.

---

## Phase 5: Tests

### 5a. Update existing tests

- All tests that construct `AxiologicalProfile` with 10 entries → update to 9
- All tests that iterate `VALUE_PAIRS` → will auto-fix when constant changes
- All tests that reference `'flesh'` → remove/update
- All tests that reference old pair names → update to new names
- `strand-content.test.ts` — update expected pair lists
- `domain-words.test.ts` — update expected values
- `backstory-content.test.ts` — update expected pair list

### 5b. New tests

- Verify `REACH_VALUE_PAIR` maps 8 reaches to 8 unique pairs
- Verify `ARCHETYPE_NAMES` has entries for all 9 pairs (8 reach + 1 meta)
- Verify `VALUE_PAIRS.length === 9`
- Verify `REACH_DOMAINS.length === 8`
- Verify no reference to 'flesh' as a ReachDomain anywhere in type system

### 5c. Contract test: axiological profile ↔ strand generation

Verify that the strand system correctly generates desires/beliefs/fears for the new pairs and doesn't reference the old ones.

---

## Execution Order

1. **Phase 1** (type system) → expect ~100 type errors
2. **Phase 2a-2d** (mechanical fixes) → resolve all type errors → `npx tsc --noEmit` clean
3. **Phase 3a-3b** (new content for Stone/Eye) → content pools complete
4. **Phase 3c** (Quintessence content) → new file
5. **Phase 3d-3e** (action template audit + flesh redistribution)
6. **Phase 4** (UI polish)
7. **Phase 5** (tests)
8. **Verify:** `npm test`, `npx tsc --noEmit`, `npx vite build`

Phases 1-2 are one commit. Phase 3 is one commit. Phases 4-5 together. Three commits total.

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| `humility_pride` appears in ~40 files — high blast radius | Most are string literals amenable to find-replace. The ~25 action template motivations need individual review. |
| AxiologicalProfile shape change breaks serialized state | Game state is not persisted between sessions (no save/load yet). No migration needed. |
| Meeting encounter dilemmas reference old pairs | Only ~5 dilemmas reference Stone/Eye pairs specifically. Rewrite needed but bounded. |
| Flesh removal breaks agent capability display | AgentDetailPanel grid layout must change (3×3 → 2×4). Bounded UI change. |
| Reach color change surprises player | No players yet — this is pre-release. |

## NFP Compliance

| Priority | Status | Note |
|----------|--------|------|
| 1. Tunability | PASS | All new content uses same constant-driven architecture. Archetype names are data, not code. |
| 2. Inspectability | PASS | Archetype names improve inspectability — seeing "Conqueror" in traces is clearer than seeing "ruthlessness_leaning". |
| 3. Determinism | PASS | No PRNG changes. Pure data migration. |
| 4. Fail-soft | PASS | AxiologicalProfile defaults to 0.0 on all axes. Missing pairs → neutral. |
| 5. Narrative over mechanical | PASS | This entire change is narrative-driven — archetypes tell better stories than abstract values. |
| 6. Additive over destructive | PASS with note | Removing flesh is destructive, but the old reach was blocking the symmetric pattern. Content is preserved (redistributed + Quintessence). |
| 7. Performance | PASS | No performance impact — pure data changes. |
