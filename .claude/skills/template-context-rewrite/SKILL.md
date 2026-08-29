---
name: template-context-rewrite
description: Multiply an existing UnifiedActionTemplate family across context axes by authoring `contextFragments` — place and counterpart-role prose variants that make one skeleton read as many distinct scenes. Use for Tier-2 volume work. NOT for bespoke branching encounters (use `encounter-pipeline`) and NOT for format migration (use `template-encounter-rewrite`). Triggers on "context fragments", "multiply encounter", "Tier 2 surfaces", "surface multiplication", "{frag:", "context-multiplication".
last_validated_against: 2026-08-29
validated_doctrine: prose@2
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

## Pass 2 — Design-first fragment drafting (narrator mode)

*Amended 2026-08-29 (THR-1324). This pass was titled "Scene-first fragment drafting" and
opened "Write the **paragraph first**, then extract the fragment" — the named mechanism by
which in-situ prose got into the corpus, retired 2026-08-25 with Prose Doctrine v2. Its
"one earned concrete detail per fragment" rule is the retired picturable-anchor rule and
goes with it. What that bullet was protecting — no interiority, no digits, no exclamation
marks, no probability words — survives below, because narrator mode already forbids it.*

**Decide what the axis changes, then state it.** A fragment's job is to name what is
different about *this* place or *this* counterpart — plainly, as a narrator reporting it.
Drafting the table mechanically produces labels; drafting a scene and mining it for
fragments produces the in-situ prose the doctrine retired. Neither is the move: settle
what the axis actually alters about the situation, then write that fact into the slot.

- Pick slots where the axis actually shows: an *opening* is where the place shows, a
  *counter/hesitation* is where the person shows. Two slots is usually right.
- Baseline register — encounter surfaces never qualify for peak (canon, Doctrine v2).
- **State the difference, don't encode it.** If the axis means the harbour office is
  short-staffed, write that; do not hand the reader physical evidence to decode.
- **Names come only from enrichment tokens** — `{name}`, `{cast:<key>}`, `{target}`.
  Never hardcode an entity name in a fragment.
- The `'*'` default is a **real authored fragment**, not a stub. It is what the surface
  reads like when nothing is bound, and it is required — a missing default strips the
  token at render.
- No interiority ("X felt Y"), no camera work, no digits, no exclamation marks, no
  probability words. Every fragment serves challenge → test → outcome; one that serves
  none of those is cut.

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
