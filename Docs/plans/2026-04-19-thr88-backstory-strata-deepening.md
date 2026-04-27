# THR-88: Deepen Backstory Content Strata 2–4

**Date:** 2026-04-19
**Project:** Content Architecture
**Parent design:** `Docs/plans/2026-03-17-tiered-backstory-generation-design.md`
**Status:** Ready for Dev
**Scope:** Content authoring pass on `src/data/backstory-content.ts`

---

## Summary

THR-88 is a **content-density and voice-calibration** pass on the tiered backstory generation system. Engine infrastructure, resolvers, generator, `revelation` AlertIcon, AgentProfileModal "Their Story" section, and the `readBackstoryTier` influence edge property are already shipped per the parent design doc. What remains is bringing stratum 2–4 content tables up to the 4-templates-per-key target with a specific editorial pattern applied to the fourth template in each slot.

**The work is entirely in one file:** `src/data/backstory-content.ts`. No new types, no resolver edits, no generator changes, no UI changes, no tests to add (existing tests cover the resolvers; content density is not a correctness property).

**Target:** ~45 new templates across 6 tables, plus editorial polish on existing templates that read thin or too abstract.

---

## Density Audit (current state)

| Table | Stratum | Keys | Target | Current | Gap | Notes |
|-------|---------|------|--------|---------|-----|-------|
| `SURFACE_ORIGIN_PROSE` | 1 | 19 archetypes | 4/key | 4/key | 0 | ✅ Done |
| `SURFACE_SPHERE_PROSE` | 1 | 8 spheres | 4/key | 4/key | 0 | ✅ Done |
| `BOND_HISTORY_PROSE` | 2 | 8 bases | 4/key | 4/key | 0 | ✅ Done |
| `BOND_HISTORY_NEGATIVE_PROSE` | 2 | 8 bases | 4/key | 4/key | 0 | ✅ Done |
| `TRAIT_ORIGIN_PROSE` | 2 | 6 categories | 4/key | 3/key | **+6** | Missing embodied 4th per category |
| `TURNING_POINT_PROSE` | 2 | 9 value pairs | 4/key | 3/key (×6), 4/key (×3) | **+6** | `asceticism_extravagance`, `honesty_cunning`, `tradition_novelty`, `loyalty_ambition`, `preservation_transformation` (partial), `courage_prudence` thin |
| `CONTRADICTION_PROSE` | 3 | 9 value pairs | 4/key | 3/key (×6), 4/key (×3) | **+6** | Same pattern — need embodied 4th |
| `DECISIVE_NATURE_PROSE` | 3 | 1 (flat) | 6 | 5 | **+1** | Add one embodied/sensory template |
| `FEAR_PROSE` | 3 | 18 value-pair × polarity | 4/key | 4/key (×16), 2/key (×2) | **+4** | Only `revelation_discretion_positive` & `_negative` are thin (2 each) |
| `HIDDEN_MOTIVE_PROSE` | 3 | 5 strategies | 4/key | 4/key | 0 | ✅ Done |
| `STORY_ARC_PROSE` | 4 | 19 archetypes | 4/key | 3/key | **+19** | Need embodied/prophetic 4th per archetype |
| `DIVINE_TRANSFORMATION_PROSE` | 4 | 4 tiers | 4/key | 3/key | **+4** | Need embodied 4th per tier |

**Total new templates required: ~46** (plus ~5 editorial rewrites on existing templates that feel too abstract).

---

## Three-Pillar Coverage

### Engine pillar — N/A with rationale

No engine changes. Infrastructure from THR-87 (parent) is complete:

- Resolvers in `src/engine/prose-resolvers/backstoryResolvers.ts` pull from these tables and do not need to change.
- `BACKSTORY_CONSTANTS` block (`CONTRADICTION_THRESHOLD=0.15`, `FEAR_THRESHOLD=0.3`, `ESSENCE_BRACKET_LOW=20 / MEDIUM=50 / HIGH=100`, `NEW_BADGE_FADE_MS=3000`) is authoritative.
- `readBackstoryTier` on `InfluenceRelationshipProperties` already gates progressive reveal.
- PRNG seeding in the graph-walking prose pipeline is unchanged — adding a 4th template into a random-pick array preserves determinism because seed + index is stable; the odds shift from 1/3 to 1/4 for any given template, which is expected content growth.

**Any engine surfaces that would light up a warning:** none. This is a pure content delta on data tables already wired into the pipeline.

### Content pillar — primary work

Six tables get new templates. Each table's 4th-slot addition follows a consistent **editorial pattern**:

> **The 4th template converts abstract interiority into an embodied, sensory, or behavioral image.**

This pattern is already established in `FEAR_PROSE` (templates 1–3 are psychological statements; template 4 is "{name} breaks things when alone…" / "{name} keeps no journal…" / "{name} counts things — coins, stores, alliances…"). Claude Code should preserve the pattern where it already exists and extend it where templates 1–3 are the only ones present.

#### Voice-distinction rubric per stratum

| Stratum | Voice | Tense/POV | Concreteness target |
|---------|-------|-----------|--------------------|
| 1 Surface | Tavern gossip | "They say…" / "In {culture}…" third-person hearsay | External observation; what reputation says |
| 2 Personal | Biographer | Causal past-tense; named events | What happened and how it left its mark |
| 3 Inner Life | Confessor | "What {name} will never admit…" / interior present | The psychological truth beneath the mask |
| 4 Unmasked | Oracular | "The thread of {name}'s story bends toward…" / fatalistic present | The trajectory, visible only in retrospect |

**Voice violations to watch for and fix:**
- Stratum 2 templates that sound like Stratum 3 (too interior) → push toward concrete event or named consequence.
- Stratum 3 templates that sound like Stratum 2 (too causal/external) → push toward the private admission.
- Stratum 4 templates that read as Stratum 3 (too psychological) → push toward the fatalistic, "the shape is set" register.

#### Per-table editorial guidance

**`TRAIT_ORIGIN_PROSE` (+6)** — Each 4th template should be a concrete moment or sensory image of the trait operating in the world, keyed to the origin category:
- `innate`: the childhood moment where the trait was first visible.
- `mastery`: the specific teacher, workshop, or repetition that pressed it in.
- `reputation`: the name the market gave them before they could protest.
- `scar`: the physical or environmental evidence that remains.
- `condition`: the landscape or social weather that did the shaping.
- `destiny`: the omen, inheritance, or coincidence that announced arrival.

**`TURNING_POINT_PROSE` (+6, one per thin pair)** — The 4th template should be a specific scene sketch: "The [object/setting] the [choice] was made over." Six pairs need this (3 already have a 4th already in the reveal voice — preserve those).

**`CONTRADICTION_PROSE` (+6, one per thin pair)** — The 4th template should externalize the contradiction through behavior: what an observer sees when both poles fire in the same week.

**`DECISIVE_NATURE_PROSE` (+1)** — Add one sensory/embodied template. E.g., how a settled person moves through a room differently from a torn one.

**`FEAR_PROSE` revelation_discretion_positive & _negative (+4 total)** — Both have 2 templates; bring each to 4 with one abstract + one embodied, matching the pattern of the other 16 keys in this table.

**`STORY_ARC_PROSE` (+19, one per archetype)** — The 4th template should be the **omen**: a small, concrete sign that the arc is bending toward its conclusion. Oracular voice, specific image. E.g., for `tragic_hero`: "The signs are accumulating in the way signs do before a tragedy — not announcing themselves, but visible in hindsight. The shape of what comes next is being drawn by decisions already made."

**`DIVINE_TRANSFORMATION_PROSE` (+4, one per tier)** — The 4th template should be a sensory marker of transformation depth. `low`: the first time they noticed. `medium`: the habit that settled in. `high`: the thing they can no longer remember not being able to do. `massive`: the category the world is reaching for and failing.

#### Quality bar — per template

Every new or revised template must:
1. **Fit the voice rubric** for its stratum (see table above).
2. **Use only approved placeholders**: `{name}`, `{culture}`, `{archetype}`, `{bond}`, `{basis}`, `{trait}`, `{value}`, `{left_pole}`, `{right_pole}`, `{fear}`, `{arc_phase}`, `{ascendant_sphere}`, `{sphere}`, `{strategy_description}`. No new placeholders without updating the resolver and `NarrativeContext` type — and this pass does not introduce any.
3. **Threadbare aesthetic**: beauty first, darkness emerging from detail. Specific sensory concreteness. No mystical hand-waving.
4. **No length creep**: 1–3 sentences. Match the prevailing template length for the table.
5. **No repetition of existing template's core image** within the same key. Each template should offer a different angle or detail.
6. **Deterministic-safe**: no references to time-of-day, season, current mood, or other non-static context that would break across re-renders.

#### Systemic wiring check

Per `Docs/plans/2026-04-16-systemic-wiring-guide.md`, content should reach for engine capabilities rather than hardcoding fiction. This pass is **content density on an already-wired pipeline** — the seven engine capabilities (enrichment placeholders, encounter seeding, hidden marks, reputation flow, graph ops, intelligence, divine intervention) are already used by the backstory resolvers. The templates being added use the existing placeholder vocabulary; they don't need new capabilities.

**If during authoring Claude Code discovers a desired placeholder that doesn't exist** (e.g., `{first_kill}`, `{mentor}`, `{lost_thing}`), that's a deferral, not in-scope. File a follow-up issue labeled `Deferral` in the Content Architecture project; do not extend `NarrativeContext` or `backstoryResolvers.ts` inside this pass.

### UI pillar — N/A with rationale

No UI changes. The AgentProfileModal "Their Story" section already renders the enriched prose by calling the backstory resolvers through the standard prose pipeline. The `revelation` AlertIcon and `readBackstoryTier` gating are wired. New templates flow through the same rendering path as the existing ones.

**UI surfaces that remain consistent:**
- AgentProfileModal → "Their Story" section → renders resolver output.
- Influence-tier-gated strata reveal: Tier 1 shows stratum 1; Tier 2 adds stratum 2; etc.
- `revelation` alert fires when a new stratum is unlocked (unchanged).

---

## Load-Bearing Rules

- **Additive over destructive** (NFP #6) — prefer adding a 4th template over rewriting existing ones. Editorial rewrites only for templates that actively miss the stratum's voice. Flag any rewrite in a PR comment.
- **No new keys in any table.** The key sets are the schema and are authoritative (see `narrativeArchetype` enum, `BondBasis` enum, `ValuePair` enum, `TraitCategory` enum, `CooperationStrategy` enum, `SphereName` enum, divine-tier enum). If a key is missing that a resolver needs, that's an infrastructure bug — file a separate issue.
- **Deterministic-safe.** Templates must not introduce state-dependent variability beyond the resolver's PRNG draw.
- **Fallback preservation.** `DECISIVE_NATURE_PROSE` is the fallback when no contradiction is detected. Growing it from 5 to 6 templates is low-risk; do not shrink it.

---

## NFP Compliance Table

| # | NFP | Status | Note |
|---|-----|--------|------|
| 1 | Tunability | **PASS** | No new constants. Existing `BACKSTORY_CONSTANTS` block unchanged. |
| 2 | Inspectability | **PASS** | Resolver traces already include `templateId` index into the table. New templates slot into the same trace format. |
| 3 | Determinism | **PASS** | PRNG draw from `templates[n]` is determinism-safe. Shifting `n` from 3→4 shifts the modulo result but remains pure-functional. |
| 4 | Fail-soft | **PASS** | Backstory resolvers already handle missing keys with graceful fallback (empty string → section omitted). No new failure modes introduced. |
| 5 | Narrative over mechanical | **PASS** | This is a narrative density pass. Voice-rubric compliance is the quality gate. |
| 6 | Additive over destructive | **PASS** | Primarily additive. Editorial rewrites permitted only where existing template violates stratum voice. |
| 7 | Performance budget | **PASS** | Templates are constant data. Table-size growth is ~15%. Resolver cost O(1). |

---

## Fail-Soft Table

| Failure case | Fallback | Change from status quo |
|-------------|----------|----------------------|
| Missing key in a table (e.g., new archetype without entry) | Resolver returns empty string → section omitted in "Their Story" | Unchanged |
| All templates for a key are empty strings | Resolver returns empty string → section omitted | Unchanged |
| Placeholder in template is missing from `NarrativeContext` | Unreplaced `{placeholder}` appears in UI → visible bug | **Authors must not introduce new placeholders.** This pass uses only the existing 12. Quality bar #2 enforces. |
| Two templates are identical within a key | PRNG still draws uniformly; variety reduced but no crash | Mitigated by the "no repetition of core image" rule in the quality bar |

---

## Constants Table

**No new constants in this pass.** The existing block is authoritative:

```ts
// From BACKSTORY_CONSTANTS (already in codebase)
CONTRADICTION_THRESHOLD = 0.15   // |value| below this counts as contradiction
FEAR_THRESHOLD = 0.3             // |value| above this selects a shadow fear
ESSENCE_BRACKET_LOW = 20
ESSENCE_BRACKET_MEDIUM = 50
ESSENCE_BRACKET_HIGH = 100
NEW_BADGE_FADE_MS = 3000
```

---

## Traces

**No new trace types.** The existing `resolver.backstory.*` trace categories emit `resolverName`, `templateId` (array index), and `outputLength`. New templates flow through the same tracing — the `templateId` range just grows from `[0,2]` to `[0,3]` for affected keys.

**Verification step Claude Code should run:**
```bash
npm run cli -- --seed 42 --map medium
# at fws> prompt:
tick 10
agent @hero                   # prints "Their Story" stratum 1
# inspect resolver traces for templateId distribution across reruns with different seeds
```

If template distribution is noticeably skewed across seeds 40–50, that's a PRNG issue upstream, not a content bug.

---

## Action Items for Claude Code

1. **Read the file:** `src/data/backstory-content.ts`.
2. **Audit against the density table above.** Confirm the counts match what's on disk (file may have drifted since this plan was written — 2026-04-19).
3. **Add templates table-by-table**, in this order (smallest-effort first to preserve momentum):
   1. `FEAR_PROSE` — `revelation_discretion_positive` and `revelation_discretion_negative` (+4 templates)
   2. `DECISIVE_NATURE_PROSE` (+1 template)
   3. `DIVINE_TRANSFORMATION_PROSE` (+4 templates)
   4. `TRAIT_ORIGIN_PROSE` (+6 templates)
   5. `TURNING_POINT_PROSE` (+6 templates to thin pairs)
   6. `CONTRADICTION_PROSE` (+6 templates to thin pairs)
   7. `STORY_ARC_PROSE` (+19 templates — largest chunk; do last)
4. **Editorial rewrite pass** on any template that violates the stratum voice rubric. Flag rewrites in commit body under `Content edits:`.
5. **Verify via CLI** (see Traces section above).
6. **Type-check & build:** `npx tsc --noEmit && npx vite build`.
7. **Test:** `npm test` — existing backstory resolver tests must still pass (no changes to resolver or table schema).
8. **Commit & push** — closing commit must include `Fixes THR-88`.

---

## Out of Scope (file as Deferral if discovered)

- Any new placeholder (e.g., `{first_kill}`, `{mentor}`) → requires `NarrativeContext` + resolver changes.
- Any new content table key (e.g., a new archetype not in the enum).
- New trace types or resolver signatures.
- UI adjustments to AgentProfileModal.
- Tests for content density — density is not a correctness property.
- Tone calibration across the entire content surface (reaches beyond backstory prose).

---

## References

- Parent design: `Docs/plans/2026-03-17-tiered-backstory-generation-design.md`
- Prose pipeline: `Docs/plans/systemic-wiring-guide.md` → `prose-pipeline` skill
- Threadbare aesthetic: `prose-content-systems` skill
- Voice rubric lives in this doc (Stratum Voice table above)
- File under edit: `src/data/backstory-content.ts` (unique file touched; no other files in this pass)
