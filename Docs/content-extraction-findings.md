# Content Extraction Findings: Hardcoded Strings & Thin Template Pools

## Summary
Scanned all engine files in `src/engine/`, types in `src/types/`, and components in `src/components/` for hardcoded narrative content, prose templates, fallback strings, and thin template pools (< 4 entries).

---

## 1. HARDCODED PROSE IN ENGINE FILES

### agentLifecycle.ts
**Lines 64-69: BORN_NAMES — 10 entry name pool for newborns**
```typescript
const BORN_NAMES = [
  'Newborn of the Weave', 'Child of Embers', 'Seedling of the Veil',
  'Heir of the Forge', 'Wanderer Reborn', 'Whisper of Dawn',
  'Thread of Fate', 'Echo of the Past', 'Spark of the New',
  'Voice of the Unwritten',
];
```
**Status:** Already acceptable pool size (10 entries), but content is hardcoded. Should live in `agent-lifecycle-content.ts` or similar.

**Lines 164: REACHES array — 9 reach domains hardcoded**
```typescript
const reaches = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh'];
```
**Status:** This should use REACH_DOMAINS from types/index.ts instead of hardcoding.

---

### strands.ts
**Lines 97-121: VALUE_LABELS & FEAR_DESCRIPTIONS — Hardcoded value pair prose**
```typescript
const VALUE_LABELS: Record<ValuePair, [string, string]> = {
  ambition_contentment: ['Ambitious', 'Content'],
  courage_prudence: ['Courageous', 'Prudent'],
  // ... 8 more pairs
};

const FEAR_DESCRIPTIONS: Record<ValuePair, [string, string]> = {
  ambition_contentment: ['Fears irrelevance and failure', 'Fears being forced to strive'],
  courage_prudence: ['Fears showing weakness', 'Fears reckless consequences'],
  // ... 8 more pairs (20 strings total)
};
```
**Status:** CRITICAL — This is narrative prose content hardcoded in engine. Should extract to `strand-content.ts` with 10 pairs × 2 labels + 10 pairs × 2 fears = 40 content strings.

---

### profileGenerator.ts
**Lines 46-59: QUOTE_TEMPLATES — 12-entry template pool**
```typescript
const QUOTE_TEMPLATES = [
  '{name} once said: "Power is not taken — it is woven..."',
  // ... 11 more templates (12 total)
];
```
**Status:** Already good size (12), but content is hardcoded. Should live in `profile-content.ts`.

**Lines 61-74: SPHERE_FLAVOR — Hardcoded sphere prose**
```typescript
const SPHERE_FLAVOR: Record<string, string> = {
  force: 'clash of arms',
  matter: 'weight of stone',
  // ... 10 more spheres (12 total)
};
```
**Status:** Prose content. Should extract to profile content package.

**Lines 78-95: ORIGIN_TEMPLATES, MIDDLE_TEMPLATES, CLOSING_TEMPLATES — 4 + 3 + 3 = 10 templates total**
```typescript
const ORIGIN_TEMPLATES = [
  '{name} was born among the {culture}...',
  // ... 3 more (4 total)
];
const MIDDLE_TEMPLATES = [
  'Those who knew {name} spoke of...',
  // ... 2 more (3 total)
];
const CLOSING_TEMPLATES = [
  'Now {name} stands at a crossroads...',
  // ... 2 more (3 total)
];
```
**Status:** Adequate pool sizes, but all hardcoded in engine. Should extract to `profile-content.ts`.

---

### ascendant.ts
**Lines 38-47: ARCHETYPE_TITLES — 8 spheres × 3 titles = 24 hardcoded titles**
```typescript
const ARCHETYPE_TITLES: Record<SphereName, string[]> = {
  force: ['The Warlord Ascendant', 'The Iron Sovereign', 'The Storm Marshal'],
  matter: ['The Stone Architect', 'The Foundation Lord', 'The Earthshaper'],
  // ... 6 more spheres (24 titles total)
};
```
**Status:** CRITICAL — Ascendant archetype naming. Should extract to `ascendant-content.ts` with 24 pool entries.

---

### encounter.ts
**Lines 144, 152: Fallback/placeholder strings**
```typescript
outcome: { narrative: 'The encounter dissolves into shadow.' },
outcome: { narrative: 'No further trial awaits.' },
```
**Status:** Two hardcoded fallback narratives. Should use encounter-content.ts defaults.

---

### interventionEffects.ts
**Lines 183: DOMAINS array — 5 hardcoded domain words**
```typescript
const domains = ['might', 'wisdom', 'skill', 'cunning', 'grace'];
```
**Status:** Thin pool (5 entries). Could expand or extract to content package. Currently only used for value pair selection seeding.

**Line 385: Error fallback string**
```typescript
consequenceMessage: `Unknown intervention type: ${interventionType}`,
```
**Status:** Fallback for unknown intervention. Consider extracting to error message content.

---

### orchestrator.ts
**Lines 367-369: Word pools for prose substitution — CRITICAL THIN POOLS**
```typescript
const adjPool = ['quiet', 'fierce', 'solemn', 'bitter', 'fragile', 'burning', 'ancient', 'hollow'];
const nounPool = ['purpose', 'strength', 'resolve', 'shadow', 'faith', 'devotion', 'reckoning', 'silence'];
const verbPool = ['circled', 'retreated', 'watched', 'bristled'];
```
**Status:** CRITICAL — Thin verb pool (4 entries), used inline in prose template substitution. These are created fresh on every dilemma resolution. Should extract to `orchestrator-content.ts` or `narrative-substitution-content.ts` and reuse. Verb pool especially thin.

---

### wheel.ts
**Line 210: Single hardcoded description string**
```typescript
description: 'Observe agent psyche and situation',
```
**Status:** Action descriptions in WHEEL_LAYOUT are hardcoded. Should extract descriptions to `wheel-content.ts` or derive from INTERVENTION_DEFINITIONS.

---

### chronicle.ts
**Lines 11-12: ROMAN numerals array — 20 entries, acceptable but hardcoded**
```typescript
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
```
**Status:** Technical constant (Roman numerals), not narrative content. OK to stay in engine. But could extract to `chronicle-content.ts` for consistency.

---

### tooltipResolver.ts
**Lines 131-132, 139-140: Hardcoded doom tooltips**
```typescript
desc: 'The final stage where all spheres collapse. Tracked by {{ui.doom_bar}}. The world returns to void.',
desc: 'A measure of how close the world draws to the Unmaking. Managed via {{ui.mandate_tracker}}.',
```
**Status:** Global doom concept descriptions. Should extract to `doom-content.ts` or `ui-content.ts` extensions.

**Lines 171, 181: Fallback "mysterious figure" strings**
```typescript
desc: 'A mysterious figure.',
desc: 'A mysterious figure.',
```
**Status:** Fallback prose. Should use familiarity-gated content from narrative packages.

**Line 187, 203, 211: 'Unknown' fallback for archetype names**
```typescript
const archetypeName = detail.archetype?.name ?? 'Unknown';
```
**Status:** Three instances of fallback 'Unknown'. Should use graceful fallback prose or defer to content.

---

## 2. THIN TEMPLATE POOLS (< 4 entries)

### orchestrator.ts — CRITICAL
- **verbPool (line 369):** 4 entries: `['circled', 'retreated', 'watched', 'bristled']`
  - Used for dilemma narrative substitution
  - **Recommendation:** Expand to 8-12 entries or extract to content package with sphere/dilemma-type affinity variants

### interventionEffects.ts
- **domains array (line 183):** 5 entries: `['might', 'wisdom', 'skill', 'cunning', 'grace']`
  - Used only once in value pair selection
  - **Recommendation:** Verify usage, consider if this is a placeholder or if 5 is sufficient

---

## 3. FALLBACK/PLACEHOLDER STRINGS

| File | Line | String | Status |
|------|------|--------|--------|
| agentDetail.ts | 213 | `'Unknown'` (for tier names) | Fallback for missing tier |
| encounter.ts | 113 | `'Unknown Step'` | Fallback for missing step name |
| encounter.ts | 144, 152 | Two hardcoded fallback narratives | Graceful degradation |
| tooltipResolver.ts | 187, 203, 211 | `'Unknown'` (archetype names) | Fallback when detail unavailable |
| tooltipResolver.ts | 171, 181 | `'A mysterious figure.'` | Tier 1 stranger tooltip (×2) |
| interventionEffects.ts | 385 | `'Unknown intervention type...'` | Error fallback |
| components/Game/DoomBar.tsx | 16 | `'Unknown'` (doom stage name) | Fallback for missing stage name |
| components/Game/HexZoomView.tsx | 297 | `'Unknown'` (location name) | Fallback for hidden location |

**Recommendation:** Create `fallback-content.ts` with all graceful fallback prose, keyed by context type.

---

## 4. TODO/FIXME COMMENTS WITH CONTENT IMPLICATIONS

### orchestrator.ts:529
```typescript
// TODO: extract actorId from event once TickEvent carries it
```
**Status:** Infrastructure task, not content-related. No action needed.

---

## 5. SUMMARY: Content Extraction Opportunities

### **Critical Extractions (HIGH PRIORITY)**

1. **strands.ts (VALUE_LABELS + FEAR_DESCRIPTIONS)**
   - 40 narrative strings across 10 value pairs
   - Extract to: `strand-content.ts`
   - Tests: 40+ validation tests

2. **ascendant.ts (ARCHETYPE_TITLES)**
   - 24 archetype names (8 spheres × 3 titles)
   - Extract to: `ascendant-content.ts`
   - Tests: 24+ validation tests

3. **orchestrator.ts (Word pools for substitution)**
   - adjPool (8), nounPool (8), verbPool (4)
   - **Expand verbPool to 8-12 entries**
   - Extract to: `orchestrator-content.ts` or `narrative-substitution-content.ts`
   - Tests: Pool validation + substitution integration tests

### **Medium-Priority Extractions**

4. **profileGenerator.ts (all template pools)**
   - QUOTE_TEMPLATES (12)
   - SPHERE_FLAVOR (12)
   - ORIGIN/MIDDLE/CLOSING_TEMPLATES (3+3+4)
   - Extract to: `profile-content.ts`
   - Tests: 37+ validation tests

5. **tooltipResolver.ts (hardcoded doom tooltips + fallback prose)**
   - Doom system descriptions (2)
   - Fallback "mysterious figure" (2)
   - Extract to: `doom-content.ts` or `tooltip-content.ts`
   - Tests: Tooltip resolution integration tests

6. **wheel.ts (action descriptions)**
   - Description field in WHEEL_LAYOUT
   - Extract to: `wheel-content.ts` or extend INTERVENTION_DEFINITIONS
   - Tests: Wheel slot generation tests

### **Low-Priority Extractions**

7. **agentLifecycle.ts (BORN_NAMES)**
   - 10 newborn names
   - Extract to: `agent-lifecycle-content.ts`

8. **agentLifecycle.ts (reaches array)**
   - Replace hardcoded array with REACH_DOMAINS import

9. **chronicle.ts (ROMAN numerals)**
   - 20 entries, optional extraction to `chronicle-content.ts` for consistency

---

## 6. COMPONENT-LEVEL HARDCODED STRINGS

Checked src/components/ for hardcoded UI display strings:
- Most UI strings are properly in components (location names, agent names, etc. from graph state)
- Fallback strings exist in DoomBar, HexZoomView (for unknown/hidden content)
- **Recommendation:** Create component-level `component-fallbacks.ts` or integrate into main fallback-content.ts

---

## 7. ACTION ITEMS

| Priority | Task | File(s) | Effort |
|----------|------|---------|--------|
| 🔴 HIGH | Extract VALUE_LABELS + FEAR_DESCRIPTIONS from strands.ts | strands.ts → strand-content.ts | 1 session |
| 🔴 HIGH | Extract ARCHETYPE_TITLES from ascendant.ts | ascendant.ts → ascendant-content.ts | 0.5 session |
| 🔴 HIGH | Expand + extract orchestrator word pools | orchestrator.ts → orchestrator-content.ts | 1 session |
| 🟡 MED | Extract profileGenerator template pools | profileGenerator.ts → profile-content.ts | 1 session |
| 🟡 MED | Extract tooltipResolver hardcoded doom prose | tooltipResolver.ts → doom-content.ts | 0.5 session |
| 🟡 MED | Extract wheel action descriptions | wheel.ts → wheel-content.ts | 0.5 session |
| 🟢 LOW | Extract BORN_NAMES from agentLifecycle | agentLifecycle.ts → agent-lifecycle-content.ts | 0.5 session |
| 🟢 LOW | Replace reaches hardcoded array with REACH_DOMAINS | agentLifecycle.ts | 0.25 session |
| 🟢 LOW | Create fallback-content.ts for all graceful degradation prose | New file | 0.5 session |

**Total Estimated Effort:** ~5-6 sessions (fully modularized content extraction)

