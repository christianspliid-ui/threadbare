# Phase 12: Flesh Reach Migration to Quintessence - Research

**Researched:** 2026-03-29
**Domain:** Type system refactor, content rewrite, new runtime property (Quintessence), UI grid change, archetype epithet system
**Confidence:** HIGH — all findings sourced from direct codebase inspection and the canonical blueprint doc (TB-075)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Remove Flesh reach (9 → 8), elevate to Quintessence meta-property
- Stone value pair: `humility_pride` → `preservation_transformation`
- Eye value pair: `frankness_propriety` → `revelation_discretion`
- `stoicism_passion` retired entirely
- Flesh action redistribution: Heal→Gold(Life), Diagnose→Eye(Energy), Plague→Shadow(Entropy), Cultivate→Gold(Life)
- Archetype reachAffinities: ~15 entries, mapped per archetype context (Healer: flesh→gold, Warrior: flesh→iron, etc.)
- `FLESH_MAX_HOPS` removed; all reaches use `MAX_AWARENESS_HOPS`
- Obsidian vault Flesh files archived to Actions/_archived/Flesh/ (no redistribution)
- Quintessence: 0–1.0 continuous, 10-level lexicon (Fraying→Absolute), all entities with SphereAffinity also get Quintessence
- Quintessence erosion sources: overchannel, sacking/destruction, failed encounters, wounding/killing, decimating armies/factions, doom progression
- Zero-state: entity-type rules (agents→death/transformation, locations→ruins/void, factions→dissolution); thresholds 0.25=weakened, 0.10=critical, 0.0=dissolution
- Recovery: certain encounters, attachments, ascendant actions, slow passive regeneration
- Quintessence UI: prose-only via IPK, no explicit meter
- No Quintessence-specific player actions in this phase
- Stone axiological tone: Fortress vs Forge narrative
- Eye axiological tone: broader (perception, divination risks, surveillance/privacy) not just reveal/conceal
- Stoicism aspects → `sacrifice_survival` (endurance); Passion aspects → `loyalty_ambition` (drive); per-content-item assignment
- All new Stone/Eye/Quintessence content written in full — no placeholders
- Archetype epithets in agent profile header + meeting encounter framing
- Archetype threshold: >0.6 or <-0.6 earns label
- Hybrid naming: "The [Dominant] of [Modifier-domain]" (e.g., "The Protector of Secrets")
- `courage_prudence` (meta-axis) excluded from archetype epithets
- Archetype name knowledge-gated via AgentKnowledge system (Phase 11)
- Reach colors: sphere color hues darkened for Threadbare dark background
- Agent detail grid: 3×3 → 2×4 (both AgentDetailPanel and ProwessTab)
- Commit granularity at Claude's discretion — each commit passes tsc + tests

### Claude's Discretion

- Exact commit boundaries
- Quintessence passive regeneration rate constant
- Thematic domain words for the modifier pattern (what "Shadow" becomes — "Secrets"? "Whispers"?)
- Exact hex color values after darkening sphere palette for contrast

### Deferred Ideas (OUT OF SCOPE)

- Quintessence-specific player actions (Restore, Sacrifice, Shatter)
- Obsidian vault restructuring beyond archiving
- Foundation governance
- Archetype epithets in ProwessTab per-reach labels, StrandView desires section
</user_constraints>

---

## Summary

Phase 12 is a **cosmological symmetry refactor** (TB-075) plus a **new Quintessence runtime property**. The codebase already contains the full current state: 9 reaches including `flesh`, 10 value pairs including `stoicism_passion`/`frankness_propriety`/`humility_pride`, and no Quintessence system. The canonical TB-075 blueprint (Docs/plans/2026-03-28-cosmological-symmetry-refactor.md) is the primary execution guide and maps 5 internal phases (type system → mechanical propagation → content rewrite → UI polish → tests).

The blast radius is **large but structured**: 493 occurrences across 115 `.ts` files + 28 occurrences across 17 `.tsx` files reference one or more of the affected identifiers. Most are mechanical string-literal renames (find-replace safe); approximately 50 items require semantic review (action template motivations, content prose, archetype reachAffinities).

Quintessence adds a new runtime property to all graph nodes that carry `SphereAffinity` — following the same pattern established in Phase 10. The property lives adjacent to `sphereAffinity` on graph nodes and follows the IPK prose-only display convention from Phase 10.

**Primary recommendation:** Execute TB-075 in 4 plans: (1) type system + mechanical fixes as one atomic pass ending in tsc-clean, (2) content rewrite (new Stone/Eye prose + full Quintessence content file), (3) Quintessence runtime system (type, erosion wiring, IPK display), (4) UI polish + archetype epithets + tests.

---

## Standard Stack

No new dependencies are required. Phase 12 uses the existing stack entirely.

| Component | Current Location | Purpose in Phase 12 |
|-----------|-----------------|---------------------|
| TypeScript type system | `src/types/traits.ts`, `src/types/agent.ts` | ReachDomain 9→8, ValuePair 10→9 |
| Content data files | `src/data/*.ts` | New prose for Stone/Eye pairs, Quintessence lexicon |
| `SphereAffinity` type | `src/types/sphereAffinity.ts` | Pattern reference for Quintessence property shape |
| `ProseKeyword` (IPK) | Phase 10 component | Quintessence display — same approach, no changes needed |
| `AgentKnowledge` system | `src/types/agentKnowledge.ts`, Phase 11 | Gates archetype name revelation |
| `phaseSpherePressure` | `src/engine/phaseSpherePressure.ts` (position 9.5) | Quintessence overchannel erosion hooks here |
| `encounterProgressionV2` | `src/engine/` | Failed encounter Quintessence erosion |
| Vitest test suite | `src/engine/__tests__/`, `src/data/__tests__/` | Must update 100+ test files referencing old types |

---

## Architecture Patterns

### Recommended Implementation Structure

```
src/
├── types/
│   ├── traits.ts          # ReachDomain 9→8, REACH_DOMAINS, NARRATIVE_LEXICON
│   ├── agent.ts           # ValuePair 10→9, VALUE_PAIRS, REACH_VALUE_PAIR, ARCHETYPE_NAMES (new)
│   └── quintessence.ts    # New file: Quintessence interface + constants + lexicon
├── data/
│   ├── quintessence-content.ts   # New: QUINTESSENCE_LEXICON, QUINTESSENCE_WORD_SCALE
│   ├── strand-content.ts         # Update: VALUE_LABELS, INTENSITY_VALUE_LABELS, FEAR_DESCRIPTIONS
│   ├── domain-words.ts           # Update: DOMAIN_WORD_SCALES (remove flesh), VALUE_WORD_MAP
│   ├── agent-behavior-constants.ts  # Remove: FLESH_MAX_HOPS
│   ├── archetype-content.ts      # Update: ~15 reachAffinities entries (flesh → new reach)
│   ├── unified-action-templates.ts  # Update: ~25 motivation renames + flesh action redistribution
│   ├── action-template-content.ts   # Update: ~9 occurrences (motivation renames)
│   ├── backstory-content.ts      # Update: new Stone/Eye turning points, remove stoicism_passion
│   ├── meeting-content.ts        # Update: ~5 Stone/Eye dilemmas rewrite, ~41 total references
│   ├── agenda-content.ts         # Update: ~3 humility_pride → preservation_transformation
│   └── strand-content.ts         # Update: remove stoicism_passion entries
├── engine/
│   ├── encounterAwareness.ts     # Remove: FLESH_MAX_HOPS branch in computeAwarenessHops
│   ├── phaseQuintessence.ts      # New: tick-phase for Quintessence erosion/recovery
│   └── orchestrator.ts           # Wire: phaseQuintessence at appropriate position
└── components/
    ├── Game/AgentDetailPanel.tsx  # Update: 3×3 → 2×4 grid, remove Flesh
    ├── Game/tabs/ProwessTab.tsx   # Update: 3×3 → 2×4 grid, remove Flesh
    ├── Game/AgentProfileModal.tsx # Add: archetype epithet in header
    └── Game/MeetingEncounterModal.tsx  # Update: remove flesh emoji, add archetype framing
```

### Pattern 1: Type System Change (Phase 1 of TB-075)

**What:** Remove `flesh` from `ReachDomain` union and `REACH_DOMAINS` array; remove `stoicism_passion`, `frankness_propriety`, `humility_pride` from `ValuePair` union; add `revelation_discretion`, `preservation_transformation`. Add `ARCHETYPE_NAMES` constant.
**When to use:** Must be done atomically first. This is the foundation all other changes depend on.
**Key insight:** After making type changes, run `npx tsc --noEmit` — it will produce ~100+ errors that precisely locate every mechanical propagation needed. This is intentional: the compiler is the change-map.

```typescript
// Source: Docs/plans/2026-03-28-cosmological-symmetry-refactor.md
// src/types/traits.ts
export type ReachDomain =
  | 'iron' | 'gold' | 'shadow' | 'veil' | 'heart'
  | 'eye' | 'stone' | 'star';

// src/types/agent.ts
export type ValuePair =
  | 'mercy_ruthlessness'           // Iron   — Protector ↔ Conqueror
  | 'asceticism_extravagance'      // Gold   — Mender ↔ Magnate
  | 'honesty_cunning'              // Shadow — Confessor ↔ Puppeteer
  | 'tradition_novelty'            // Veil   — Archivist ↔ Heretic
  | 'loyalty_ambition'             // Heart  — Sworn ↔ Renegade
  | 'revelation_discretion'        // Eye    — Seeker ↔ Sentinel
  | 'preservation_transformation'  // Stone  — Guardian ↔ Shaper
  | 'sacrifice_survival'           // Star   — Martyr ↔ Survivor
  | 'courage_prudence';            // Meta   — Vanguard ↔ Watcher
```

### Pattern 2: Quintessence as Graph Node Property

**What:** Quintessence is a `number` (0–1.0) added to any graph node that already carries `SphereAffinity`. It is NOT a type-union field on all nodes — only entities with `SphereAffinity` get it. Store as `quintessence?: number` on the node's properties bag.
**When to use:** New file `src/types/quintessence.ts` defines the interface, constants, and lexicon. `gameInit.ts` initializes to 1.0 for all entities seeded with SphereAffinity.

```typescript
// Proposed: src/types/quintessence.ts
export const QUINTESSENCE_LEXICON: readonly string[] = [
  'Fraying',      // 0.0–0.1
  'Flickering',   // 0.1–0.2
  'Tenuous',      // 0.2–0.3
  'Steady',       // 0.3–0.4
  'Rooted',       // 0.4–0.5
  'Resonant',     // 0.5–0.6
  'Crystalline',  // 0.6–0.7
  'Radiant',      // 0.7–0.8
  'Transcendent', // 0.8–0.9
  'Absolute',     // 0.9–1.0
] as const;

export const QUINTESSENCE_THRESHOLDS = {
  WEAKENED: 0.25,
  CRITICAL: 0.10,
  DISSOLUTION: 0.0,
} as const;

// Tunable: passive regeneration rate per tick
export const QUINTESSENCE_PASSIVE_REGEN = 0.002;

export function quintessenceToWord(value: number): string {
  const clamped = Math.max(0, Math.min(1, value));
  const idx = Math.min(9, Math.floor(clamped * 10));
  return QUINTESSENCE_LEXICON[idx];
}
```

### Pattern 3: Archetype Epithet Derivation

**What:** Given an agent's `AxiologicalProfile`, find the strongest lean (>0.6 or <-0.6) across reach-bound pairs only (not `courage_prudence`). Derive "The [Dominant] of [Modifier-domain]" using a thematic word map.
**When to use:** In agent profile header, meeting encounter framing prose. Knowledge-gated by AgentKnowledge.

```typescript
// Proposed: src/engine/archetypeEpithet.ts
export function deriveArchetypeEpithet(
  profile: AxiologicalProfile,
  knowledge?: AgentKnowledge,
): string | null {
  // Find strongest lean across reach-bound pairs (exclude courage_prudence)
  // Return null if no pair exceeds 0.6 threshold
  // Return "The [pole-archetype] of [modifier-word]" using ARCHETYPE_EPITHET_MAP
}
```

### Pattern 4: Quintessence Erosion Wiring

**What:** Erosion events push delta values through a `QuintessenceEvent` (analogous to `SpherePressureEvent`). The new `phaseQuintessence` tick-phase processes accumulated events, clamps to 0–1, and handles zero-state outcomes by entity type.
**When to use:** Wire into orchestrator after existing phases. Overchannel erosion routes from `phaseSpherePressure` at position 9.5.

### Anti-Patterns to Avoid

- **Don't mix Phase 1 and Phase 2 into one commit.** TB-075's "expect ~100 type errors after Phase 1" pattern is intentional — run tsc between phases to verify completeness.
- **Don't delete `stoicism_passion` entries from content files without assigning content.** The CONTEXT.md mandates per-item assignment: stoicism aspects → `sacrifice_survival`, passion aspects → `loyalty_ambition`. Each content item needs a deliberate choice.
- **Don't treat Quintessence as a 10th reach.** It has no axiological pair, no capability tier, no encounter affinity. It is a meta-property (existential health), not an activity domain.
- **Don't update ProwessTab grid without updating AgentDetailPanel.** Both components maintain independent `DOMAINS_GRID` / `ALL_DOMAINS` arrays — both must change to 2×4.
- **Don't use `AxiologicalProfile` with 10 keys after the type change.** It's `Record<ValuePair, number>` — it auto-shrinks when `ValuePair` shrinks, but test mocks that explicitly construct 10-key objects will break.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Quintessence prose display | Custom number-to-word function | `quintessenceToWord()` using `QUINTESSENCE_LEXICON` constant | Tunability: changing lexicon words is changing a constant, not code |
| Archetype epithet generation | String template in component | `deriveArchetypeEpithet()` engine function | Must be testable; component should be pure display |
| Finding all `flesh` references | Manual search | `npx tsc --noEmit` after Phase 1 type changes | Compiler provides exact error list — more reliable than grep |
| Zero-state dissolution handling | Per-entity-type conditionals in erosion phase | Entity-type dispatch table + `ZERO_STATE_RULES` constant | Fail-soft: missing entity type should produce graceful fallback not crash |

**Key insight:** The TypeScript compiler is the most reliable tool for finding the blast radius of type changes. Use it deliberately — make the type changes, run tsc, let errors drive the mechanical work.

---

## Common Pitfalls

### Pitfall 1: AxiologicalProfile test fixture explosion
**What goes wrong:** ~100 test files construct `AxiologicalProfile` objects with all 10 pairs. After removing `stoicism_passion`/`frankness_propriety`/`humility_pride`, these become type errors AND silent runtime bugs (profiles with extra keys that the type system no longer validates).
**Why it happens:** TypeScript `Record<ValuePair, number>` doesn't enforce exact key set at construction sites that use object literals.
**How to avoid:** After Phase 1 type changes, run `npm test` (not just tsc) — test failures show which fixtures need updating. Use a helper factory `makeAxiologicalProfile(overrides)` that uses `VALUE_PAIRS` to construct complete profiles.
**Warning signs:** Tests pass tsc but produce wrong strand/scoring outputs.

### Pitfall 2: `humility_pride` in ~40 files — semantic vs mechanical
**What goes wrong:** Mass find-replace of `humility_pride` → `preservation_transformation` silently changes the semantic intent of ~25 action template motivations. "Humility" and "preservation" are different concepts.
**Why it happens:** The old Stone pair was ego-focused; the new pair is about protecting vs reshaping.
**How to avoid:** Review each `humility_pride` occurrence in `unified-action-templates.ts` and `action-template-content.ts` individually. Build/crafting/infrastructure actions → `preservation_transformation` is fine. Ego-motivated actions → may fit better as `loyalty_ambition` or another pair.
**Warning signs:** Actions about claiming territory or asserting dominance tagged as `preservation_transformation`.

### Pitfall 3: `stoicism_passion` content orphaning
**What goes wrong:** Removing `stoicism_passion` from `strand-content.ts` without redistributing its turning points, fears, and strand entries leaves content holes or test failures.
**Why it happens:** `backstory-content.ts` (15 references) and `strand-content.ts` (10 references) contain prose that was written for the stoicism↔passion axis. These are qualitatively different from mechanical key-renames.
**How to avoid:** For each stoicism_passion prose entry: classify as endurance-flavored (→ `sacrifice_survival`) or drive-flavored (→ `loyalty_ambition`), rewrite the prose to fit the new pair's narrative.
**Warning signs:** `strand-content.test.ts` expects specific pair lists — it will catch stragglers.

### Pitfall 4: Quintessence not initialized on legacy entities
**What goes wrong:** If `gameInit.ts` only initializes Quintessence on newly seeded entities, legacy-format entities (created in earlier ticks or loaded from world-model.json) will have `undefined` quintessence.
**Why it happens:** The phaseQuintessence erosion logic will receive `undefined` instead of `1.0`.
**How to avoid:** Add fail-soft defaults: `node.properties.quintessence ?? 1.0` everywhere quintessence is read. The missing-Quintessence case means "fully vital" not "dissolved".
**Warning signs:** Agents dissolving on the first tick of a session.

### Pitfall 5: 3×3 → 2×4 grid change missed in one component
**What goes wrong:** `AgentDetailPanel.tsx` is updated but `ProwessTab.tsx` retains the old 3×3 layout (or vice versa).
**Why it happens:** Both components maintain independent `DOMAINS_GRID` / `ALL_DOMAINS` constants with the flesh entry.
**How to avoid:** Change both in the same commit. Verify at 1920×1080 with `?view=game`.

### Pitfall 6: REACH_BADGE_COLORS retains flesh entry
**What goes wrong:** `src/components/CMS/registry.ts` REACH_BADGE_COLORS has `flesh: '#dc2626'`. After removal, the CMS viewer for reach-scoped content may show `undefined` color or TypeScript errors if it's typed as `Record<ReachDomain, string>`.
**How to avoid:** Remove flesh entry as part of Phase 1 constants cleanup. Verify registry.ts is typed correctly.

---

## Code Examples

### Current state — what needs changing

```typescript
// src/types/traits.ts — CURRENT (must change)
export type ReachDomain =
  | 'iron' | 'gold' | 'shadow' | 'veil' | 'heart'
  | 'eye' | 'stone' | 'star' | 'flesh';  // remove 'flesh'

// src/types/agent.ts — CURRENT (must change)
export type ValuePair =
  | ...
  | 'frankness_propriety'      // Eye — rename to revelation_discretion
  | 'humility_pride'           // Stone — rename to preservation_transformation
  | 'stoicism_passion'         // Flesh — remove entirely
  | 'courage_prudence';

// src/engine/encounterAwareness.ts — CURRENT (must change)
const cap = reach === 'flesh' ? FLESH_MAX_HOPS : MAX_AWARENESS_HOPS;
// AFTER: const cap = MAX_AWARENESS_HOPS;

// src/components/Game/AgentDetailPanel.tsx — CURRENT (must change)
const DOMAINS_GRID: ReachDomain[][] = [
  ['iron', 'gold', 'shadow'],
  ['veil', 'heart', 'eye'],
  ['stone', 'star', 'flesh'],  // 3×3
];
// AFTER: 2×4 layout
const DOMAINS_GRID: ReachDomain[][] = [
  ['iron', 'gold', 'shadow', 'veil'],
  ['heart', 'eye', 'stone', 'star'],
];
```

### Quintessence initialization (gameInit.ts pattern)

```typescript
// Follow SphereAffinity seeding pattern in gameInit.ts
// After sphereAffinity is set on an entity, initialize quintessence:
if (node.properties.sphereAffinity) {
  node.properties.quintessence = 1.0;  // All entities start fully vital
}
```

### Archetype epithet knowledge gate (Phase 11 pattern)

```typescript
// Follow revelationEmitter.ts / AgentKnowledge patterns from Phase 11
// Archetype epithet is only displayed when knowledge.revealedFacets includes 'archetype'
// or when AgentKnowledge level is 'intimate' or higher
if (knowledge?.revealedFacets?.has('archetype') || knowledgeLevel >= 'intimate') {
  return deriveArchetypeEpithet(profile);
}
return null;
```

---

## File-Level Change Map

### Phase 1: Type System (no content changes)

| File | Change | Risk |
|------|--------|------|
| `src/types/traits.ts` | Remove `flesh` from ReachDomain, REACH_DOMAINS, NARRATIVE_LEXICON (move to quintessence-content.ts) | HIGH blast radius — triggers all downstream errors |
| `src/types/agent.ts` | Remove 3 ValuePairs, add 2, update VALUE_PAIRS + REACH_VALUE_PAIR, add ARCHETYPE_NAMES | HIGH |
| `src/components/CMS/registry.ts` | Remove `flesh` from REACH_BADGE_COLORS, update colors for all 8 reaches | LOW |
| `src/data/agent-behavior-constants.ts` | Remove FLESH_MAX_HOPS | LOW |
| `src/components/CMS/tunableConstants.ts` | Remove FLESH_MAX_HOPS tunable (3 references) | LOW |

### Phase 2: Mechanical Propagation (~100 type errors)

| Category | Files | Change Type |
|----------|-------|-------------|
| `'frankness_propriety'` rename | ~20 .ts files | find-replace |
| `'humility_pride'` rename | ~40 .ts files | find-replace + semantic review for ~25 action templates |
| `'stoicism_passion'` removal | ~15 .ts files | delete entries, per-item content reassignment |
| `'flesh'` as ReachDomain removal | ~15 .ts + 17 .tsx files | delete entries, grid layout changes |
| encounterAwareness.ts | 1 file | remove FLESH_MAX_HOPS branch |
| Test fixtures | ~100 test files | update AxiologicalProfile constructions |

**Key mechanical files** (highest reference counts):
- `src/data/meeting-content.ts` — 41 references (largest single file)
- `src/data/culture-content.ts` — 42 references
- `src/data/reward-attachment-catalog.ts` — 33 references
- `src/data/unified-action-templates.ts` — 24 references (semantic review needed)
- `src/data/encounter-content.ts` — 21 references
- `src/engine/strands.ts` — 8 references

### Phase 3: Content Rewrite (semantic, not mechanical)

| File | New Content |
|------|-------------|
| `src/data/strand-content.ts` | New VALUE_LABELS + INTENSITY_VALUE_LABELS + FEAR_DESCRIPTIONS for `preservation_transformation` and `revelation_discretion` |
| `src/data/domain-words.ts` | Remove flesh entry from DOMAIN_WORD_SCALES and VALUE_WORD_MAP |
| `src/data/backstory-content.ts` | New turning points + contradiction prose for Stone/Eye pairs |
| `src/data/meeting-content.ts` | Rewrite ~5 Stone/Eye dilemmas (Fortress vs Forge; Truth-seeker vs Secret-keeper) |
| `src/data/agenda-content.ts` | Rewrite ~3 humility_pride agendas as preservation_transformation |
| `src/data/quintessence-content.ts` | NEW FILE: QUINTESSENCE_LEXICON, QUINTESSENCE_WORD_SCALE, IPK display prose |
| `src/data/archetype-content.ts` | Update ~15 reachAffinities entries (flesh → context-appropriate reach) |

### Phase 4: Quintessence Runtime

| File | Change |
|------|--------|
| `src/types/quintessence.ts` | NEW FILE: Quintessence interface, constants, lexicon, helper functions |
| `src/engine/gameInit.ts` | Initialize `quintessence: 1.0` on all SphereAffinity-bearing entities |
| `src/engine/phaseQuintessence.ts` | NEW FILE: Erosion/recovery tick phase, zero-state dispatch |
| `src/engine/orchestrator.ts` | Wire phaseQuintessence; add QuintessenceEvent to tick event types |
| `src/engine/phaseSpherePressure.ts` | Emit QuintessenceEvent on overchannel |
| `src/engine/encounter.ts` or `encounterProgressionV2` | Emit QuintessenceEvent on narrative-diminishing failures |

### Phase 5: UI Polish + Archetype Epithets

| File | Change |
|------|--------|
| `src/components/Game/AgentDetailPanel.tsx` | 3×3 → 2×4 DOMAINS_GRID, remove flesh from DOMAIN_NAMES |
| `src/components/Game/tabs/ProwessTab.tsx` | 3×3 → 2×4 ALL_DOMAINS, remove flesh from DOMAIN_NAMES |
| `src/components/Game/AgentProfileModal.tsx` | Add archetype epithet in header (knowledge-gated) |
| `src/components/Game/MeetingEncounterModal.tsx` | Remove flesh emoji, add archetype framing prose |
| `src/engine/archetypeEpithet.ts` | NEW FILE: deriveArchetypeEpithet(), ARCHETYPE_DOMAIN_WORDS map |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (version per package.json) |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npm test -- --reporter=dot` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Behavior | Test Type | Automated Command | File Status |
|----------|-----------|-------------------|-------------|
| REACH_DOMAINS.length === 8 | unit | `npm test -- strand-content` | Update existing |
| VALUE_PAIRS.length === 9 | unit | `npm test -- domain-words` | Update existing |
| No `flesh` in REACH_VALUE_PAIR | unit | `npm test -- domain-words` | Update existing |
| ARCHETYPE_NAMES covers all 9 pairs | unit | new test | Wave 0 gap |
| quintessenceToWord(0.0) === 'Fraying' | unit | new test | Wave 0 gap |
| quintessenceToWord(1.0) === 'Absolute' | unit | new test | Wave 0 gap |
| phaseQuintessence erodes on overchannel event | unit | new test | Wave 0 gap |
| deriveArchetypeEpithet threshold >0.6 | unit | new test | Wave 0 gap |
| courage_prudence excluded from epithets | unit | new test | Wave 0 gap |
| 2×4 grid renders 8 reaches at 1920×1080 | visual/manual | manual | manual only |
| stone value pair uses preservation_transformation | unit | `npm test -- strand-content` | Update existing |
| eye value pair uses revelation_discretion | unit | `npm test -- strand-content` | Update existing |
| stoicism_passion absent from all content | unit | `npm test -- strand-content backstory-content` | Update existing |

### Sampling Rate

- **Per commit:** `npx tsc --noEmit && npm test`
- **Per wave:** `npm test && npx vite build`
- **Phase gate:** Full suite green + `npx vite build` clean before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/types/__tests__/quintessence.test.ts` — covers quintessenceToWord, lexicon length, threshold constants
- [ ] `src/engine/__tests__/archetypeEpithet.test.ts` — covers derivation threshold, meta-axis exclusion, knowledge gate
- [ ] `src/engine/__tests__/phaseQuintessence.test.ts` — covers erosion accumulation, zero-state dispatch, passive regen
- [ ] Update all existing test fixtures: any `AxiologicalProfile` with 10 keys → 9 keys; any `REACH_DOMAINS.length === 9` → 8; any reference to `'flesh'` as ReachDomain

---

## State of the Art

| Old Approach | Current Approach | Phase |
|--------------|-----------------|-------|
| 9 Reaches including Flesh | 8 Reaches, Flesh elevated to Quintessence | Phase 12 |
| 10 ValuePairs including stoicism_passion | 9 ValuePairs, retired pair redistributed | Phase 12 |
| Physical resilience as a Reach domain | Quintessence as existential meta-property (0–1.0) | Phase 12 |
| No archetype display in UI | Archetype epithet in agent profile header | Phase 12 |
| 3×3 grid for 9 reaches | 2×4 grid for 8 reaches | Phase 12 |

**Established by Phase 10 (confirmed, use these patterns):**
- `SphereAffinity` as graph node property (property on node.properties bag)
- `SpherePressureEvent` accumulation + tick-phase processing (model for QuintessenceEvent)
- `ProseKeyword` / IPK display for numeric values (no numbers shown to player)
- `phaseSpherePressure` at orchestrator position 9.5

**Established by Phase 11 (confirmed, use these patterns):**
- `AgentKnowledge` facet-based gating for progressive revelation
- `revealedFacets` Set for O(1) knowledge checks
- `domain_revealed` TickEvent type for revelation notifications

---

## Open Questions

1. **Archetype epithet modifier words for reach domains**
   - What we know: Hybrid pattern is "The [pole-archetype] of [thematic-word]". Examples given: "The Protector of Secrets", "The Shaper of Harvests".
   - What's unclear: The full mapping of reach/sphere names to thematic words (e.g., Shadow → "Secrets" or "Whispers"? Star → "Fate" or "Heavens"?).
   - Recommendation: Claude's discretion. Draft `ARCHETYPE_DOMAIN_WORDS` constant covering all 8 reaches × 2 poles. Use evocative Threadbare-aesthetic words. Examples: Iron→"Storms"/"Ruin", Gold→"Harvests"/"Plenty", Shadow→"Secrets"/"Whispers", Veil→"Mysteries"/"Currents", Heart→"Bonds"/"Flames", Eye→"Truths"/"Horizons", Stone→"Ages"/"Forms", Star→"Fates"/"Heavens".

2. **Quintessence passive regeneration rate**
   - What we know: Value must be a named constant (`QUINTESSENCE_PASSIVE_REGEN`). Recovery exists.
   - What's unclear: Exact rate. Too fast = no tension. Too slow = frustrating.
   - Recommendation: Start at 0.002 per tick (500 ticks to recover from 0 to 1). Tune after observing 30-tick runs with the CLI.

3. **Zero-state dissolution timing**
   - What we know: 0.0 = dissolution. Rules are entity-type based (agents→death/transformation, etc.).
   - What's unclear: Is dissolution instant-on-reaching-zero, or does it happen at the start of the next phaseQuintessence run?
   - Recommendation: Process at phaseQuintessence run time (not mid-tick). Emit a `dissolution_event` TickEvent type so the player sees what happened via the Chronicle.

4. **StrandView `stoicism_passion` content redistribution**
   - What we know: ~10 strand-content.ts entries reference stoicism_passion; CONTEXT.md mandates per-item assignment.
   - What's unclear: Some stoicism_passion content may fit neither `sacrifice_survival` nor `loyalty_ambition` cleanly.
   - Recommendation: For any entry that doesn't fit cleanly, bias toward `sacrifice_survival` (endurance is the closer concept). Flag outliers in a code comment for future review.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `src/types/traits.ts`, `src/types/agent.ts`, `src/types/sphereAffinity.ts`, `src/types/gameState.ts` — current type system state confirmed
- `Docs/plans/2026-03-28-cosmological-symmetry-refactor.md` — TB-075 canonical implementation blueprint, read in full
- `.planning/phases/12-flesh-reach-migration-to-quintessence/12-CONTEXT.md` — user decisions, all locked
- `src/data/agent-behavior-constants.ts` — FLESH_MAX_HOPS location confirmed
- `src/engine/encounterAwareness.ts` — flesh-specific branch confirmed
- `src/components/Game/AgentDetailPanel.tsx`, `ProwessTab.tsx` — 3×3 grid confirmed
- `src/components/CMS/registry.ts` — REACH_BADGE_COLORS with flesh entry confirmed
- Grep counts across all .ts and .tsx files — blast radius quantified (493 + 28 occurrences, 115 + 17 files)

### Secondary (MEDIUM confidence)
- `src/data/strand-content.ts`, `src/data/domain-words.ts` — content structure confirmed, new prose requirements identified from existing pattern
- Phase 10/11 context (STATE.md accumulated decisions) — SphereAffinity and AgentKnowledge patterns confirmed as models for Quintessence and archetype gating

---

## Metadata

**Confidence breakdown:**
- Type system changes: HIGH — all target files inspected, exact changes known
- Mechanical propagation scope: HIGH — grep-verified 493 occurrences across 115 files; TB-075 lists all affected files
- Content rewrite scope: HIGH — content files inspected, structure confirmed
- Quintessence runtime design: HIGH — follows confirmed Phase 10 SphereAffinity pattern exactly
- Archetype epithet system: MEDIUM — interface defined, modifier words are Claude's discretion
- Test update scope: MEDIUM — know which tests will break, exact fixture changes require tsc output

**Research date:** 2026-03-29
**Valid until:** 2026-04-29 (stable codebase, no external dependencies)
