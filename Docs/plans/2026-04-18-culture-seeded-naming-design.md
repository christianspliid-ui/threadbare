# Culture-Seeded Agent Name Generation — Design

**Linear issue:** THR-15
**Date:** 2026-04-18
**Author:** Cowork (design pass)
**Status:** Ready for Dev
**Project:** Content Architecture

---

## TL;DR

Add a **per-culture phonetic signature** layer on top of the existing culture name-pool scaffold (`src/data/culture-name-pools.ts`, `pickCulturalName()`). Today two cultures that happen to share the same foundation + primary sphere draw from an identical pool of ~35 hand-authored names; once exhausted, both fall back to the same generic list. The proposed change gives each culture a small, deterministic phoneme inventory and a set of syllable templates derived from its identity seed, so names feel internally consistent within a culture and audibly distinct across cultures — while preserving the curated-pool layer as the first draw for flavor anchoring.

This is **not** a return to the rejected DakDraGar syllable concatenator. That earlier generator operated globally with no culture scoping and no phonotactic rules, producing awkward three-syllable CVC mashups. The new generator is per-culture, phonotactically constrained, and only runs when the curated pool is exhausted or — by configuration — when a culture has been flagged "procedural primary."

## Pivot note

THR-15's original description ("Replace the syllable-concatenation placeholder name generator ... produces awkward names like 'DakDraGar'") describes an earlier state of the codebase. That generator has already been replaced by `pickCulturalName()` drawing from curated pools (2025 → early 2026 work). Reading `culture-name-pools.ts`, `cultureGenerator.ts`, and the NPC/agent call sites confirms the baseline.

The **real remaining limitations** the issue was trying to address are:

1. Two cultures with foundation=`order` and primarySphere=`force` are name-twins — they draw from the same 35-name pool.
2. Pools are finite. At large map sizes with 5 cultures × capital+city+3 towns+9 hamlets × cap-15 NPCs, name exhaustion forces generic fallback and eventually `Wanderer-N`.
3. Foundation/sphere pools borrow from real-world fantasy conventions (`Aldric`, `Ironhide`, `Rowan`) rather than expressing an in-world phonetic tradition.
4. The culture's `demonym` and `homePlaceName` are derived mechanically from foundation-specific suffixes — fine for stub output, weak for a published identity.

The design below addresses 1–4 by adding a phonetic signature per culture, and by routing settlement and demonym generation through the same signature so every name-producing site for a culture sounds like it came from the same tradition.

---

## Engine pillar

### New type: `CulturePhoneticSignature`

Added to `src/types/culture.ts`:

```ts
export interface CulturePhoneticSignature {
  /** Deterministic seed derived from culture identity — drives all phoneme/template picks. */
  seedHash: number;
  /** Vowel inventory (3–5 vowels, drawn from a foundation-biased master list). */
  vowels: string[];
  /** Onset consonant inventory (4–8 consonants, drawn from a sphere-biased master list). */
  onsets: string[];
  /** Coda consonant inventory (0–6 consonants; empty for "open-syllable" traditions). */
  codas: string[];
  /** Syllable templates (CV, CVC, VC, CVVC) in draw-weighted order. */
  syllableTemplates: SyllableTemplate[];
  /** Target syllable counts for personal names (min/max). */
  personalSyllableRange: { min: number; max: number };
  /** Target syllable counts for settlement roots (min/max). */
  settlementSyllableRange: { min: number; max: number };
  /** Optional morphological markers appended to personal names (e.g. "-a", "-eth"). */
  nameSuffixes: string[];
  /** Optional morphological markers appended to settlement names (e.g. "-heim", "-vor"). */
  settlementSuffixes: string[];
  /** Capitalisation style for compound names ("Title Case" | "single-word" | "apostrophe-bridge"). */
  orthography: 'title' | 'compound' | 'apostrophe';
}

export type SyllableTemplate = 'CV' | 'CVC' | 'VC' | 'CVV' | 'CVVC';
```

Stored on the culture node's properties alongside the existing `cultureIdentity: CultureIdentity`:
```ts
properties: {
  cultureIdentity: CultureIdentity,
  culturePhoneticSignature: CulturePhoneticSignature,  // NEW
  ...
}
```

### Signature generation (`buildPhoneticSignature`)

New module: `src/engine/culturePhonetics.ts`. Called once per pregen culture inside `registerPregenCultures()` (or during `generateCultureIdentities()`, right after the identity composes).

```ts
export function buildPhoneticSignature(
  identity: CultureIdentity,
  cultureSeed: number,
): CulturePhoneticSignature
```

Algorithm:

1. Mix `cultureSeed` with a stable hash of `foundationBias + veneratedSpheres[0] + (demonym ?? '')` → `seedHash`. This guarantees two cultures with identical foundation+sphere but different demonyms get distinct signatures.
2. PRNG = mulberry32(`seedHash`).
3. Pick `vowels` from `VOWEL_MASTER_LIST_BY_FOUNDATION[foundationBias]` (see Content pillar); 3–5 vowels.
4. Pick `onsets` from `CONSONANT_MASTER_LIST_BY_SPHERE[primarySphere]` union a foundation-biased subset; 4–8 onsets.
5. Pick `codas` — empty list with `OPEN_SYLLABLE_CHANCE` by foundation, otherwise 2–6 consonants. Foundations: `chaos` and `light` skew open; `order` and `darkness` skew closed.
6. Pick `syllableTemplates` — 2–3 templates with weights. Foundations seed the mix: `chaos` → favours VC/CVVC; `order` → favours CVC; `light` → favours CV/CVV; `darkness` → favours CVC/VC.
7. Pick syllable ranges: personal 2–3 most cultures, occasional 1 or 4. Settlements 2–4.
8. Pick `nameSuffixes` and `settlementSuffixes` from foundation-biased template lists.
9. Pick `orthography` weighted by foundation.

All picks are deterministic functions of `seedHash` — NFP #3 satisfied.

### New generator: `generatePhoneticName`

```ts
export function generatePhoneticName(
  signature: CulturePhoneticSignature,
  mode: 'personal' | 'settlement' | 'homeland',
  rng: () => number,
  usedNames: Set<string>,
): string
```

Loop: compose syllables per signature templates until a candidate name is produced. Reject if in `usedNames` (up to `MAX_PHONETIC_ATTEMPTS` tries). Apply orthography and optional suffix. Return.

### `pickCulturalName` becomes a layered picker

Extend the existing function (keep the signature stable to avoid rewriting call sites):

```ts
export function pickCulturalName(
  foundationBias: string,
  primarySphere: string,
  rng: () => number,
  usedNames: Set<string>,
  signature?: CulturePhoneticSignature,   // NEW optional arg
): string
```

Order of attempts:
1. **Curated culture pool** (existing foundation ∪ sphere pool). First draw for anchor flavor.
2. **Phonetic generator** (`generatePhoneticName`) if `signature` provided and pool exhausted, OR if `NAMING_CONSTANTS.PHONETIC_PRIMARY_CHANCE` hits.
3. **Generic pool** (existing).
4. **Last-resort `Wanderer-N`** (existing).

When no signature is passed (legacy callers, culture-less agents) the old behavior is preserved — **fail-soft** path.

### Call-site changes

- `src/engine/npcSeeding.ts:223` — after resolving the culture node, also pull `culturePhoneticSignature` and pass it.
- `src/engine/agentLifecycle.ts` (birth naming, ~line 18) — same pattern: resolve new-agent's culture, pass the signature.
- `src/engine/cultureGenerator.ts` (`demonym` + `homePlaceName`) — replace the charCode-suffix hack with `generatePhoneticName(..., 'homeland', rng, usedHomeNames)` seeded by the signature. Falls back to the old path if the signature can't be built.
- `src/engine/settlementNaming.ts` (and its callers for hamlets/towns/cities/capitals) — add a new branch that calls `generatePhoneticName(..., 'settlement', ...)` with the culture's signature when one exists; keep the existing `SETTLEMENT_ROOTS_BY_*` fragments as a pool-first attempt for anchor flavor.

### Traces

New trace types in `src/engine/culturePhonetics.ts`:

```ts
export interface CulturePhoneticSignatureBuiltTrace {
  type: 'culture_phonetic_signature_built';
  cultureId: string;
  seedHash: number;
  vowelCount: number;
  onsetCount: number;
  codaCount: number;
  templates: SyllableTemplate[];
  personalRange: [number, number];
  settlementRange: [number, number];
  tick: 0;
}

export interface PhoneticNameGeneratedTrace {
  type: 'phonetic_name_generated';
  cultureId: string;
  mode: 'personal' | 'settlement' | 'homeland';
  name: string;
  attemptsUsed: number;
  tick: number;
}
```

Emitted via the existing `traceBuffer` pathway — matches the NPC seeding pattern (NFP #2).

### Constants table (NFP #1)

All added to `src/types/culture.ts` or a new `src/engine/culturePhonetics-constants.ts`.

| Constant | Default | Purpose |
|---|---|---|
| `PHONETIC_SEED_SALT` | `0x9E3779B1` | Fixed salt mixed into seedHash so phonetic RNG doesn't collide with other culture RNGs. |
| `VOWEL_COUNT_RANGE` | `{ min: 3, max: 5 }` | Vowel inventory size per culture. |
| `ONSET_COUNT_RANGE` | `{ min: 4, max: 8 }` | Onset consonant inventory size. |
| `CODA_COUNT_RANGE` | `{ min: 0, max: 6 }` | Coda consonant inventory size (0 = open-syllable tradition). |
| `OPEN_SYLLABLE_CHANCE_BY_FOUNDATION` | chaos 0.45, order 0.1, light 0.55, darkness 0.15 | Probability coda list is empty. |
| `SYLLABLE_TEMPLATE_COUNT_RANGE` | `{ min: 2, max: 3 }` | How many templates a culture uses. |
| `PERSONAL_SYLLABLE_RANGE` | `{ min: 2, max: 3 }` | Default syllable count for personal names. |
| `SETTLEMENT_SYLLABLE_RANGE` | `{ min: 2, max: 4 }` | Default syllable count for settlement names. |
| `NAME_SUFFIX_CHANCE` | `0.4` | Probability a generated personal name gets a morphological suffix. |
| `SETTLEMENT_SUFFIX_CHANCE` | `0.7` | Probability a generated settlement name gets a suffix. |
| `MAX_PHONETIC_ATTEMPTS` | `16` | Attempts before the generator gives up and the caller falls through to the next tier. |
| `PHONETIC_PRIMARY_CHANCE` | `0.35` | Chance the phonetic generator is tried before the curated pool (tunable; 0 = pool always first). |
| `PHONETIC_GENERATOR_ENABLED` | `true` | Master kill-switch; when false, `pickCulturalName` ignores the signature argument. |

All live above the fold in their source file, keyed by purpose, with a comment tying each to the feel it controls.

### Fail-soft table (NFP #4)

| Failure | Fallback |
|---|---|
| `buildPhoneticSignature` called before `CultureIdentity` is composed | Skip; log a trace; culture reverts to pool-only naming. |
| `generatePhoneticName` exhausts `MAX_PHONETIC_ATTEMPTS` without producing a unique name | Return `null`; `pickCulturalName` falls through to generic pool. |
| `PHONETIC_GENERATOR_ENABLED=false` | All phonetic calls short-circuit to existing pool path. Entire feature toggles off. |
| Culture node missing `culturePhoneticSignature` (e.g. saves from prior version) | Call site proceeds without signature — same behavior as today. |
| Name generator produces a string with no vowels, starts with a non-letter, or length < 2 | Discard; retry; on retry-exhaustion, fall through. |

### NFP compliance summary

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | All magic numbers in the constants table above. |
| 2. Inspectability | PASS | Two new trace types; signature stored on culture node for debug read. |
| 3. Determinism | PASS | seedHash derived from culture seed + identity; all RNG is mulberry32. |
| 4. Fail-soft | PASS | See table above; generator is additive; legacy path always available. |
| 5. Narrative over mechanical | PASS | Curated pool still fires first for flavor anchors; generator fills the long tail. |
| 6. Additive over destructive | PASS | Extends `pickCulturalName` signature with an optional arg; adds new type/module; no deletions. |
| 7. Performance budget | PASS | Signature built once per culture (≤5 per map). Name generation O(templates × attempts); bounded, off the tick loop. |

---

## Content pillar

### Phoneme master lists

New file: `src/data/culture-phonetic-pools.ts`. Contains the raw phoneme inventories the signature builder samples from.

```ts
export const VOWEL_MASTER_LIST_BY_FOUNDATION: Record<string, string[]> = {
  chaos:    ['a', 'e', 'i', 'o', 'u', 'y', 'ae', 'ei', 'ou'],
  order:    ['a', 'e', 'i', 'o', 'u'],
  light:    ['a', 'e', 'i', 'o', 'u', 'ai', 'ea', 'ia'],
  darkness: ['a', 'e', 'i', 'o', 'u', 'y', 'ae', 'oe'],
};

export const CONSONANT_MASTER_LIST_BY_SPHERE: Record<string, string[]> = {
  force:   ['k', 'r', 'g', 't', 'd', 'n', 'gr', 'kr', 'th'],
  matter:  ['b', 'd', 'g', 'm', 'n', 'r', 'dr', 'br', 'nd'],
  energy:  ['v', 'z', 's', 'l', 't', 'sh', 'zr', 'vl'],
  life:    ['l', 'n', 'm', 'w', 'r', 'y', 'ly', 'ln'],
  mind:    ['s', 'th', 'f', 'l', 'n', 'r', 'sc', 'pr'],
  spirit:  ['s', 'h', 'l', 'm', 'n', 'w', 'sh', 'wh'],
  time:    ['s', 'v', 'r', 'n', 'd', 'l', 'ss', 'nd'],
  entropy: ['k', 'r', 'sh', 'sk', 'x', 't', 'rr', 'kh'],
};

export const FOUNDATION_CONSONANT_BIAS: Record<string, string[]> = {
  chaos:    ['x', 'z', 'q', 'kk'],
  order:    ['l', 'n', 'r', 's'],
  light:    ['l', 'm', 's', 'r'],
  darkness: ['r', 'g', 'v', 'gh'],
};

export const NAME_SUFFIXES_BY_FOUNDATION: Record<string, string[]> = {
  chaos:    ['-a', '-ix', '-ux', '-yr', ''],
  order:    ['-us', '-an', '-or', '-eth', ''],
  light:    ['-iel', '-ion', '-ea', '-ia', ''],
  darkness: ['-ir', '-or', '-al', '-en', ''],
};

export const SETTLEMENT_SUFFIXES_BY_FOUNDATION_PHONETIC: Record<string, string[]> = {
  chaos:    ['-rak', '-vel', '-wik', '-tor'],
  order:    ['-heim', '-stad', '-gar', '-holm'],
  light:    ['-loren', '-ae', '-mira', '-sol'],
  darkness: ['-morn', '-vale', '-hollow', '-shir'],
};
```

Notes:
- Master lists are intentionally small (~9 items each). The signature samples 3–8 per culture, so pools are differentiated but not combinatorially explosive.
- Digraphs (`gr`, `kh`, `th`, `sh`) are treated as single onsets/codas in the syllable builder — the generator does not insert consonant clusters beyond what the inventory allows.
- Empty-string suffixes (`''`) let a culture have no morphological marker, producing shorter names.

### Curated pool interaction

`FOUNDATION_NAMES` and `SPHERE_NAMES_POOL` (existing `culture-name-pools.ts`) are **unchanged**. They keep their anchor role — first-draw flavor, hand-authored character. The phonetic generator operates below them.

If playtesting shows too much tonal clash between curated names and generated names for the same culture, a later pass can tag each curated entry with foundation+sphere phonotactic flags so they can be filtered into the signature-matching subset. Not required for v1.

### Settlement names

The existing `SETTLEMENT_ROOTS_BY_FOUNDATION`, `SETTLEMENT_ROOTS_BY_SPHERE`, `SETTLEMENT_SUFFIXES_BY_FOUNDATION` remain as the first-pass pool. The phonetic generator becomes the second pass (instead of returning ungenerated names). This means:
- A culture's cities always use curated roots first (`Ironhold`, `Dawnwatch`) — recognisable anchors.
- Once the pool repeats within a culture province, procedurally generated settlement names take over (`Kovren`, `Drolath`, `Mirasoe`) — unique per culture.
- Hamlets and small settlements lean harder on the phonetic generator because there are more of them per province.

### Dilemma prose location integration

Encounter/dilemma prose that references locations by name (via enrichment placeholders) automatically benefits — the location node's `name` property is already set at worldgen. No prose-template changes required. But we should write:

- A short author note in the **systemic wiring guide** (`Docs/plans/2026-04-16-systemic-wiring-guide.md`) explaining that location names are now culture-phonetic and authors should assume they can reference a location by name without worrying about tone clash.
- A caveat: if a prose template hardcodes a settlement name for a vignette, check that the culture-phonetic system hasn't already consumed the same string. Use the `{location.name}` placeholder, never a literal.

---

## UI pillar

### Debug Panel — culture inspection

Add a **Culture Phonetics** sub-panel to the existing culture inspector in the Debug Panel (`DebugPanel` / culture tab). For each culture node, show:

| Field | Source |
|---|---|
| Culture name | `culture.name` |
| Foundation + primary sphere | `cultureIdentity.foundationBias`, `cultureIdentity.veneratedSpheres[0]` |
| seedHash | `culturePhoneticSignature.seedHash` (hex) |
| Vowels | `signature.vowels.join(' ')` |
| Onsets | `signature.onsets.join(' ')` |
| Codas | `signature.codas.join(' ')` or "(open-syllable)" |
| Templates | `signature.syllableTemplates.join(' / ')` |
| Personal range | `signature.personalSyllableRange.min–max` |
| Settlement range | `signature.settlementSyllableRange.min–max` |
| Name suffixes | `signature.nameSuffixes.join(' / ')` |
| Sample names | 5 names generated on-demand from the signature |

A **"Re-roll samples"** button runs the generator 5 more times — useful for QA'ing whether a culture's phonotactics produce a pleasing range.

### CMS browser — culture view

The existing CMS browser (`?view=cms`) has a culture listing. Extend each culture's entry with:
- A one-line display of their phoneme inventory ("Vowels: a e i u · Onsets: k r th gr · Codas: n rk")
- 3 sample names inline (regenerated on mount with a stable `useMemo` seed so the display is stable per session but refreshes on rebuild)

This gives designers a way to visually scan cultures for tonal distinctness without opening debug.

### Styleguide slot

`?view=styleguide` should include a "Culture phonetics readout" component sample so the component can be reviewed in isolation. This is a 10-minute addition because we already use the component in two places.

### Event / chronicle surfacing

No new toasts or chronicle entries are needed for v1 — the feature is invisible to the player beyond higher-quality names. The only user-visible change is that names in the world look more distinct and culturally consistent, which is the point.

### Player-facing inspection

Culture names and demonyms already appear in the culture inspect sheet and in on-boarding screens. No direct UI change; names just read better because they came from a coherent phonetic tradition.

---

## Wiring section

Per `Docs/plans/wiring-checklist.md`, each new surface must be wired across engine, state, UI, and debug.

| Surface | Where | Notes |
|---|---|---|
| Orchestrator phase | None — name generation is worldgen-time and birth-time, both outside the tick loop | N/A |
| GameState flow | Culture nodes gain a new property (`culturePhoneticSignature`). No separate GameState field. | Survives save/load because it's on the graph. |
| Debug panel | Culture tab gains phonetics sub-panel | New component: `CulturePhoneticsInspector.tsx` |
| CMS | Culture list row extended | Touches `CultureBrowser.tsx` or equivalent |
| Traces | `culture_phonetic_signature_built`, `phonetic_name_generated` | Wired via `emitTrace()` from `culturePhonetics.ts` |
| Prose pipeline | No direct hook — location names already pass through | Add author note to systemic wiring guide |
| Player controls | None | Feature is passive |
| Constants surface | New `culturePhonetics-constants.ts` (or co-located in `culture.ts`) | All tunables there |
| Worldgen wiring | `cultureGenerator.ts:registerPregenCultures()` — after creating the culture actor node, call `buildPhoneticSignature(identity, cultureSeed)` and set it on `properties.culturePhoneticSignature` | One insertion point |

### Files likely to change

- `src/types/culture.ts` — add `CulturePhoneticSignature` type, constants
- `src/data/culture-phonetic-pools.ts` — NEW
- `src/engine/culturePhonetics.ts` — NEW (builder + generator + traces)
- `src/engine/culturePhonetics-constants.ts` — NEW (or merged into `culture.ts`)
- `src/data/culture-name-pools.ts` — extend `pickCulturalName` signature
- `src/engine/cultureGenerator.ts` — call `buildPhoneticSignature`; replace demonym/homePlaceName derivation to use generator
- `src/engine/npcSeeding.ts` — pass signature to `pickCulturalName`
- `src/engine/agentLifecycle.ts` — pass signature to `pickCulturalName` for birth names
- `src/engine/settlementNaming.ts` (or callers) — pool-first then signature-generator for settlements
- `src/ui/debug/CulturePhoneticsInspector.tsx` — NEW
- `src/ui/debug/DebugPanel.tsx` — mount the new inspector in the culture tab
- `src/ui/cms/CultureBrowser.tsx` (name TBD) — add phonetics row
- `src/views/Styleguide.tsx` — add sample slot
- `src/engine/traceBuffer.ts` — register the two new trace type strings (union extension)
- Tests: `src/engine/culturePhonetics.test.ts` (NEW), updates to `cultureGenerator.test.ts` and `npcSeeding.test.ts`
- `Docs/plans/2026-04-16-systemic-wiring-guide.md` — add "location names are culture-phonetic" note

### Grey zones / reasonable-choice notes

1. **Whether curated pool or generator fires first.** Defaulted to pool-first with `PHONETIC_PRIMARY_CHANCE=0.35` as a mid-range; a tuning pass can rebalance after playtesting.
2. **Whether `buildPhoneticSignature` runs during `generateCultureIdentities()` (alongside `composeCultureIdentity`) or during `registerPregenCultures()` (right before node creation).** The latter is cleaner because the PregenCulture has its seed assigned; chose that. Either works.
3. **Settlement naming is split across a few files** (`settlementNaming.ts`, hex-placement code, capital promotion). Implementation should audit all of them and route every site through the same pool-first-then-signature helper so names stay consistent. This is the highest-risk integration point — flagging for Codex review.
4. **Whether phonetic names should include apostrophe bridges (`Kael'nor`).** Added as a third orthography style but weighted low (0.1); culture can opt in when seedHash rolls it. Easy to disable by zeroing the weight.
5. **Whether to pre-generate N names per culture at worldgen and cache them vs. generate on demand.** Chose on-demand generation — simpler, no stale-cache concerns, and cost is negligible (bounded loop ≤16 attempts). A perf pass can cache later if profiler shows hotspots.

---

## Test plan

- **Unit: `culturePhonetics.test.ts`** — determinism (same seed → same signature), all 4 foundations produce valid signatures, all 8 spheres, edge cases (empty codas → only CV/VC templates selected).
- **Unit: `pickCulturalName` with signature** — verify it respects pool-first default, falls through to generator, respects `PHONETIC_GENERATOR_ENABLED=false` kill-switch.
- **Integration: `cultureGenerator.test.ts`** — culture nodes have `culturePhoneticSignature` set after registration; two cultures with same foundation+sphere have different signatures.
- **Integration: `npcSeeding.test.ts`** — NPCs seeded in a given culture get names that pass a phonotactic sanity check (all letters come from signature's inventory, syllable count in range) at least 80% of the time (accounting for curated-pool draws first).
- **Snapshot: 10 names per culture at seed=42** — visible in a snapshot file for human review across refactors.
- **CLI smoke test:** `npm run cli -- --seed 42`, then `eval state.graph.getNodesByType('actor').filter(a => a.properties.cultureIdentity).map(a => ({name: a.name, culture: a.properties.cultureIdentity?.archetypeLabel}))` — visually confirm distinct-by-culture.

---

## Handoff — Claude Code coordination

**Suggested model:** Sonnet (medium-complexity additive change, many files, pattern-heavy). Label: `model:sonnet`.

**Parallel-safe with:**
- UI-only work in unrelated domains (hex map tuning, styleguide-only changes, encounter-format-migration content edits)
- Prose content authoring that doesn't touch `culture-name-pools.ts` or `cultureGenerator.ts`

**Mutex with:**
- Any other work modifying `src/data/culture-name-pools.ts`, `src/engine/cultureGenerator.ts`, `src/engine/npcSeeding.ts`, `src/engine/agentLifecycle.ts`, or `src/types/culture.ts`
- Settlement-name refactors or name-pool expansion work (they'd rebase-collide)

**Codex review:** yes — settlement naming is split across multiple files; Codex should verify every culture-seeded name path goes through the layered picker, and that the kill-switch `PHONETIC_GENERATOR_ENABLED` actually disables all new code paths.

**Implementation order suggestion:**
1. Types + constants (`culture.ts`, `culturePhonetics-constants.ts`)
2. Phoneme pools (`culture-phonetic-pools.ts`)
3. Builder + generator (`culturePhonetics.ts`)
4. Extend `pickCulturalName` (signature + logic)
5. Wire in `cultureGenerator.ts` (register signature)
6. Route `npcSeeding` and `agentLifecycle` through the signature
7. Settlement naming audit + integration
8. Debug Panel inspector
9. CMS row + styleguide slot
10. Tests + snapshot
11. Systemic wiring guide note

Shippable at step 7; steps 8–11 can come in a second commit if scope creeps.
