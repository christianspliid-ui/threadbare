# Content Package Expansion Checklist

**Quick reference for addressing coverage gaps identified in 2026-03-09 audit**

---

## IMMEDIATE EXPANSION (Low effort, high impact)

### 1. Expand Agenda Types - Coincidence & Omen
**File:** `/src/data/agenda-content.ts`
**Current:** 4 each
**Target:** 6 each
**Time:** ~20 min total
**Pattern:** See dream/persuade agendas (5-6 entries) for template

- [ ] Add 2 coincidence agendas
  - [ ] Serendipitous convergence (fate angle)
  - [ ] Chance encounter (opportunity angle)
- [ ] Add 2 omen agendas
  - [ ] Shadow prophecy (warning angle)
  - [ ] Doomed prediction (doom angle)

**Checklist per agenda:**
- [ ] Unique ID (`coincidence_*` or `omen_*`)
- [ ] Name (player-facing)
- [ ] ValuePair + direction
- [ ] Narrative hook (2-3 sentences)
- [ ] Behavior tag
- [ ] Reach boost + domain
- [ ] 3+ archetype affinities

### 2. Expand Rival Action Variants
**File:** `/src/data/rival-content.ts`
**Current:** 4 variants per action type
**Target:** 5-6 variants per action type
**Time:** ~30 min total
**Effort:** Add 1-2 variants to each of 8 action types

- [ ] blessing: add 2 variants (now 6)
- [ ] corruption: add 2 variants (now 6)
- [ ] theft: add 1-2 variants (now 5-6)
- [ ] sabotage: add 1-2 variants (now 5-6)
- [ ] revelation: add 1-2 variants (now 5-6)
- [ ] alliance_offer: add 1-2 variants (now 5-6)
- [ ] betrayal: add 1-2 variants (now 5-6)
- [ ] natural_disaster: add 1-2 variants (now 5-6)

**Pattern:** Look at existing 4 variants, add distinct flavor/approach

### 3. Expand Scry Weaknesses
**File:** `/src/data/scry-content.ts`
**Current:** 8 weakness types
**Target:** 12 weakness types
**Time:** ~15 min
**Addition:** +4 new weakness categories

- [ ] Research current 8 weakness types
- [ ] Brainstorm 4 new context-specific weaknesses
  - [ ] Examples: ambition trap, secret vulnerability, power paradox, false prophecy
- [ ] Add 4 new entries to WEAKNESS_POOL
- [ ] Update tests

---

## SHORT-TERM EXPANSION (Geographic coverage)

### 4. Expand Underground Cavern Cultural Traits
**File:** `/src/data/culture-content.ts`
**Current:** 1-2 insider beats tagged `underground_cavern`
**Target:** 4-5 insider beats
**Time:** ~15 min
**Gap:** Underground is unique region, currently under-represented

- [ ] Add insider beat: Mineral Worship
  - [ ] Description: veneration of crystal, ore, precious metals
  - [ ] Source tags: `['underground_cavern', 'force']` or similar
  - [ ] Strength thresholds: fanatical/strong/fading
  - [ ] Domain contributions
- [ ] Add insider beat: Depth Reverence
  - [ ] Description: spiritual significance of descent, layers, subterranean mystery
- [ ] Add insider beat: Void Meditation
  - [ ] Description: communion with emptiness, absence, nullspace
- [ ] Add insider beat (optional): Subterranean Isolation
  - [ ] Description: cultural pride in cave-dwelling, surface dwellers as other

**Check each entry has:**
- [ ] id, name, description
- [ ] Source tags
- [ ] strengthThresholds object
- [ ] domainContributions
- [ ] tags array

### 5. Expand Glacier/Tundra Cultural Traits
**File:** `/src/data/culture-content.ts`
**Current:** 3 insider beats tagged `glacier` or `tundra`
**Target:** 5-6 insider beats
**Time:** ~10 min
**Gap:** Extreme climate, currently thin

- [ ] Add insider beat: Ice Preservation
  - [ ] Description: using frozen preservation as sacred cultural practice
- [ ] Add insider beat: Frozen Memory
  - [ ] Description: belief that glaciers remember, preserve the past
- [ ] (Optional) Add insider beat: Eternal Winter Reverence
  - [ ] Description: cycles are locked, seasons frozen, eternity is ice

**Check each entry has:**
- [ ] id, name, description
- [ ] Source tags: `['glacier']` or `['tundra']`
- [ ] strengthThresholds object
- [ ] domainContributions
- [ ] tags array

### 6. Add Sublocation Templates
**File:** `/src/data/culture-content.ts` (SUB_LOCATION_TEMPLATES)
**Current:** 14 templates
**Target:** 22 templates (one per biome)
**Time:** ~30 min
**Gap:** Only 64% coverage; missing templates for 8 biomes

- [ ] Map current 14 templates to biomes
- [ ] Identify 8 missing biomes
- [ ] Create template for each missing biome:
  - [ ] Template structure: name, description, location flavor
  - [ ] Biome-specific features (e.g., "coastal shrine" for ocean biomes)
  - [ ] Integration with culture system

---

## MEDIUM-TERM EXPANSION (Breadth enhancement)

### 7. Expand Chronicler Vignettes
**File:** `/src/data/chronicler-content.ts`
**Current:** 15 vignettes
**Target:** 20-25 vignettes
**Time:** ~30 min
**Addition:** +5-10 new flavor vignettes

- [ ] Review existing 15 vignettes for pattern
- [ ] Brainstorm 5-10 new vignette themes
  - [ ] Examples: artifact discovery, cultural encounter, prophecy fulfillment, tragedy, triumph
- [ ] Write 5-10 new vignettes (2-3 sentences each)
- [ ] Add to CHRONICLER_VIGNETTES array

### 8. Expand Magic Tradition Flavors
**File:** `/src/data/chronicler-content.ts`
**Current:** 34 magic tradition flavors
**Target:** 50+ flavors
**Time:** ~45 min
**Addition:** +16 flavors for deeper magic system coverage

- [ ] Analyze existing 34 for pattern (school/tradition/practice types)
- [ ] Brainstorm 16 new traditions
  - [ ] Ideas: elemental schools, bloodline magics, artifact magics, cosmic magics, etc.
- [ ] Write flavor text for each (1-2 sentences)
- [ ] Add to MAGIC_TRADITION_FLAVOR array

---

## LONG-TERM EXPANSION (System deepening)

### 9. Add Rare Encounter Types
**File:** `/src/data/encounter-content.ts`
**Current:** 10 encounter templates
**Target:** 12-13 templates
**Time:** ~1 hour
**Addition:** +2-3 specialized encounters

Candidates:
- [ ] Boss encounter (rival god manifestation)
- [ ] Catastrophic event (natural disaster, apocalyptic moment)
- [ ] Miraculous manifestation (divine blessing, cosmic event)

Each encounter needs:
- [ ] id, name, locationTypes
- [ ] reachPrimary, reachSecondary
- [ ] threatRating, motivations
- [ ] 3 steps (name, reach, difficulty, narrative, onSuccess/onFailure)

---

## VALIDATION & TESTING

### Before Committing Changes

- [ ] **Type checking:** `npx tsc --noEmit` passes
- [ ] **Tests pass:** `npm test` (especially content package tests)
- [ ] **No duplicate IDs:** All new entries have unique IDs
- [ ] **Consistent structure:** New entries match existing pattern
- [ ] **Linked from index:** If new insider beat/vignette, linked from relevant systems note

### Content-Specific Validation

**For agenda changes:**
- [ ] Each agenda is in exactly one intervention type array
- [ ] ValuePair exists in agent value system
- [ ] Reach boost domain exists

**For culture-content changes:**
- [ ] Source tags match existing biome/foundation/sphere names
- [ ] Domain contributions use valid reach domains
- [ ] Strength thresholds are readable (fanatical/strong/fading)

**For scry changes:**
- [ ] Weakness pool entries are unique concepts
- [ ] WEAKNESS_POOL and court structures complement each other

**For encounter changes:**
- [ ] Location types match world-model.json
- [ ] Reach domains are valid
- [ ] Step difficulty progression makes sense (base → base+10 → base+20)

---

## Quick Reference: File Locations & Structure

| Package | File Path | Main Export | Add To |
|---------|-----------|-------------|--------|
| Agendas | `/src/data/agenda-content.ts` | AGENDA_TEMPLATES.{type}[] | dream, persuade, deceive, etc. |
| Rival Actions | `/src/data/rival-content.ts` | RIVAL_ACTION_TEMPLATES.{type}[] | blessing, corruption, etc. |
| Scry | `/src/data/scry-content.ts` | WEAKNESS_POOL[] | Array of objects |
| Culture Traits | `/src/data/culture-content.ts` | INSIDER_BEATS[] | Array of trait objects |
| Culture Sublocs | `/src/data/culture-content.ts` | SUB_LOCATION_TEMPLATES[] | Array of template objects |
| Chronicler | `/src/data/chronicler-content.ts` | CHRONICLER_VIGNETTES[] | MAGIC_TRADITION_FLAVOR[] |
| Encounters | `/src/data/encounter-content.ts` | ENCOUNTER_TEMPLATES[] | Array of encounter objects |

---

## Session Completion Checklist

After completing any expansion section above:

- [ ] **Code complete:** All new entries added to source files
- [ ] **Tests updated:** Content package tests run and pass
- [ ] **Type check:** `npx tsc --noEmit` shows no errors
- [ ] **Audit updated:** Rerun audit to verify new counts
- [ ] **Docs updated:** Update Obsidian or Notion if adding new systems
- [ ] **Changelog entry:** Add one-line entry to CLAUDE.md changelog

---

## Performance Tracking

| Task | Status | Time Spent | Notes |
|------|--------|-----------|-------|
| Expand agendas (coincidence/omen) | ☐ | — | |
| Expand rival actions | ☐ | — | |
| Expand scry weaknesses | ☐ | — | |
| Expand underground traits | ☐ | — | |
| Expand glacier/tundra traits | ☐ | — | |
| Add sublocation templates | ☐ | — | |
| Expand chronicler vignettes | ☐ | — | |
| Expand magic traditions | ☐ | — | |
| Add rare encounters | ☐ | — | |

---

**Estimated Total Time for Full Expansion:** 4-5 hours
**Recommended Session Breakdown:**
- Session 1 (1.5 hours): Tasks 1-3 (immediate thin pools)
- Session 2 (1.5 hours): Tasks 4-6 (geographic coverage)
- Session 3+ (1.5 hours each): Tasks 7-9 (medium/long-term)

