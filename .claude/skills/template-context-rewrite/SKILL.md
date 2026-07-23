---
name: template-context-rewrite
description: Multiply an existing UnifiedActionTemplate family across context axes by authoring `contextFragments` — place and counterpart-role prose variants that make one skeleton read as many distinct scenes. Use for Tier-2 volume work. NOT for bespoke branching encounters (use `encounter-pipeline`) and NOT for format migration (use `template-encounter-rewrite`). Triggers on "context fragments", "multiply encounter", "Tier 2 surfaces", "surface multiplication", "{frag:", "context-multiplication".
last_validated_against: 2026-07-23
---

# Template Context Rewrite (Tier-2 surface multiplication)

Four passes that take one authored template and multiply it into ~12–24 distinct
player-facing surfaces by letting prose respond to the same context axes the selection
engine already keys surface identity on.

**Design:** `Docs/plans/2026-07-23-encounter-context-multiplication-grammar.md` (THR-573).
**Engine:** `src/engine/fragmentResolution.ts`. **Type:** `ContextFragmentSet` in
`src/types/unifiedAction.ts`.

## Step 0 — Canon load (before drafting anything)

1. `Docs/canon/encounters.md` — current encounter spec.
2. `Docs/canon/prose.md` — register model, the five-question bar, voice rules.
3. `Docs/plans/2026-04-16-systemic-wiring-guide.md` § context fragments.

## What multiplies, and what does not

| Kind | Axes | Effect |
|---|---|---|
| **Identity** — creates surfaces | `place` (`sublocationTypeId`), `counterpartRole` (`npcRole`) | Counts toward the library; keyed into `computeSurfaceKey` |
| **Coloration** — free variation | sphere/omen/doom vocabulary, `{cast:*}` continuity, `{intel:*}`, `{?target_is_ally}` | Varies the reading; never counts as a surface |

Rejected as v1 identity axes — do not re-litigate: personality traits (illegible to the
player), faction stance (unbounded per template; needs its own design), prior history
(already served by cast continuity as coloration).

## Pass 1 — Axis election

For the family, elect **4–6 place values** and **4–6 role values** that earn fragments.

- Read the template's `locationSubtypes` gate **first**. **Never elect a value the
  selection layer cannot bind** — electing `throne-room` for a tavern-gated family is
  dead content that inflates the count and never renders.
- Verify every elected value exists: places against the `sublocation-type.*` registry,
  roles against the `NpcRole` union in `src/types/npc.ts`.
- Output an election table with a one-line rationale per value.

Caps (enforced by `enumerateTemplateSurfaces`): `MAX_FRAGMENT_SLOTS_PER_TEMPLATE` = 4,
`MAX_VARIANTS_PER_SLOT` = 8, `MAX_SURFACES_PER_TEMPLATE` = 24.

## Pass 2 — Scene-first fragment drafting

Write the **paragraph first**, then extract the fragment. Drafting the table first
produces labels; drafting the scene first produces prose.

- Pick slots where the axis actually shows: an *opening* is where the place shows, a
  *counter/hesitation* is where the person shows. Two slots is usually right.
- Baseline register unless the surface is a designated peak (canon).
- **Names come only from enrichment tokens** — `{name}`, `{cast:<key>}`, `{target}`.
  Never hardcode an entity name in a fragment.
- The `'*'` default is a **real authored fragment**, not a stub. It is what the scene
  reads like when nothing is bound, and it is required — a missing default strips the
  token at render.
- One earned concrete detail per fragment (a tide table, an open ledger). No interiority
  ("X felt Y"), no digits, no exclamation marks, no probability words.

## Pass 3 — QA

**Mechanical (all must pass):**

```bash
npx vitest run src/engine/__tests__/fragmentResolution.test.ts
npm run volume-model    # measured mode reports this template's surface count
```

- Every variants map contains `'*'`.
- `enumerateTemplateSurfaces` reports `problems: []` and `exceedsCap: false`.
- Register scorer: every variant scores no `fail`. Fragments reach the prose-QA corpus
  via `collectAuthoredProse`, so `__DEBUG.proseQualityReport()` and the DebugPanel
  "Prose QA" tab both cover them.

**Editorial:**

- Five-question bar per fragment.
- Read at least **3 composed samples** end to end (skeleton + fragment as the player
  sees it), not just the fragments in isolation.

## Pass 4 — Merge

1. Land `contextFragments` on the template; reference slots as `{frag:<slot>}` in the
   step prose.
2. **Check the family's converter.** Pools that convert raw entries into
   `UnifiedActionTemplate` (e.g. `toSocialTemplate` in `src/data/social-scene-templates.ts`)
   are explicit field whitelists — an unlisted field is dropped **silently** and the
   whole layer no-ops. Add `contextFragments` to both the raw type and the converter.
3. **Check static display surfaces.** `narrativeTemplates.initiation` is read raw by
   Codex cards and previews that never run `enrichProse`; a bare `{frag:*}` token leaks
   there. Expand it to the `'*'` default at conversion time.
4. Verify in the DebugPanel **Fragments** tab (static inventory + live bindings) or
   headlessly via `window.__DEBUG.resolveSurfaceFragments('<agent>')`.
5. Evidence block: measured surface count, scorer summary, one composed sample.

## Watch for

- **`usedDefault` always true** in live bindings → the axis election missed; the template
  is gated somewhere the elected values never bind.
- **No PRNG.** Fragment selection is a pure lookup — same surface, same words. If a
  surface's prose feels repetitive, the fix is novelty tuning or another axis value, not
  randomness. (`FRAGMENT_SEED_OFFSET` is reserved for a future multi-variant path.)
- **Trace volume.** `surface_fragments_bound` fires once per encounter instantiation.
  Never per step render.
