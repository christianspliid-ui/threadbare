> **title:** Culture and spheres showing through — one stated fact per encounter opening — THR-1635
> **linear_issue:** THR-1635
> **author:** Claude Code (design lane, run 2026-09-27b)
> **created:** 2026-09-27
> **three_pillars:** Engine `done` · Content `done — the prototype's cells port in slice 1; the full tables are slice 2` · UI `done — no new component; the line reads in the existing opening prose, with a debug read and a Fragments-tab row`

# Culture and spheres showing through — THR-1635

*Today an encounter reads the same in a town of open witnesses and a town of sworn silence. After this plan the opening says one plain fact about how these people, or this place's power, bear on the test — without anyone rewriting an encounter per culture or per sphere.*

## Why this is load-bearing

The living-world map ([A world that starts alive](https://linear.app/threadbare/issue/THR-1589)) asked for a world that reads as lived in from the first scene. Cultures and spheres are generated for every world, but encounter prose never reads either: a player cannot tell from an opening whose town they are in. This is carve-up plan 6 of 7 from that map.

**Settled input — not reopened here.** [Culture and spheres showing through](https://linear.app/threadbare/issue/THR-1599) was decided by the design lane on 2026-09-25 under delegation (process.md rule 4) and was not vetoed. Its decision, in short:

- **One stated-fact sentence** added to the opening's situation-and-complication beat (P2 of the [Doctrine v2](https://github.com/christianspliid-ui/threadbare/blob/main/.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md) skeleton). Never a word swap into authored sentences: [THR-1101](https://linear.app/threadbare/issue/THR-1101) removed the `{adj}`/`{verb}` mad-lib shape on purpose, and Doctrine v2 retired atmosphere without a job.
- **Culture custom** keyed by the place's culture's *foundation* (its social contract: chaos = honour and challenge, order = written law, light = open witness, darkness = closed circles) × the encounter's primary reach, with **3 variants per cell** and **a per-culture variant stamp at worldgen**, so two same-foundation cultures in one world never read the same line.
- **Sphere fact** keyed by the place's dominant sphere × reach, only when that sphere holds at least `SPHERE_FACT_MIN_SHARE` = 0.55 of the place's sphere score.
- **One line per opening; culture wins** when both apply. Card tints (PremonitionModal) are unchanged.
- **Carrier:** the [THR-573](https://linear.app/threadbare/issue/THR-573) fragment system, with new `foundation`/`sphere` axes — not a parallel system.
- The four missing sphere word lists (chaos, order, light, darkness) go into `SPHERE_VOCABULARY` for routine event prose, not for encounters.

The prototype is on the never-merged branch [`proto/thr-1599-culture-sphere-layer`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1599-culture-sphere-layer/Docs/audits/2026-09-25-living-world-data/proto-thr-1599) (`layer.ts` holds the tables and the four word lists; `sample.ts` measures). **Port from it; do not rewrite from this summary.**

**Decided in this plan by the design lane under delegation** (each marked *Lane decision* where it appears; each can be vetoed in chat): the axes land as *coloration* axes, not identity axes (§ Systems design); the line goes in by a compiled reserved token (§ Systems design); the sphere table covers the seven spheres that ever dominate a place (§ Content pillar); the line gets its own word budget (§ Constants); the five slice encounters are held out until Christian's playthrough closes (§ Notes); the content is split into two slices (§ Slicing).

## Re-measured on current `main` (2026-09-27)

The ticket asked for the prototype samples to be re-checked after two culture fixes shipped ([THR-1623](https://linear.app/threadbare/issue/THR-1623), [THR-1622](https://linear.app/threadbare/issue/THR-1622)). Run from `origin/main` at `2ebe7d4d`, with the prototype's two files copied in (not committed):

```
npx esbuild Docs/audits/2026-09-25-living-world-data/proto-thr-1599/sample.ts --bundle --platform=node --format=esm --outfile=.cache/thr1599.mjs --external:fs --external:path
node .cache/thr1599.mjs 42 ; node .cache/thr1599.mjs 99
```

| Measure (medium, t0) | Seed 42 | Seed 99 |
|---|---|---|
| Living cultures | 3 | 3 |
| Foundations of the living cultures | light · darkness · order | darkness · light · light |
| Place-tier Locations carrying a current culture | 40 of 235 | 60 of 238 |
| Places with a sphere affinity | 118 | 135 |
| Dominant-sphere share p50 / p90 | 0.43 / 0.60 | 0.40 / 0.57 |
| Places at ≥ 0.55 share | 35 (30%) | 24 (18%) |
| Spheres that ever dominate a place | matter 44, entropy 26, life 18, energy 18, darkness 5, time 5, light 2 | matter 40, entropy 39, life 27, energy 23, darkness 5, light 1 |
| Engine `cultureResolver` / `agentCultureResolver` | **40 of 40 / 235 of 235** (was 0 / 0) | **60 of 60 / 325 of 325** (was 0 / 0) |

What changed since the decision, and what it means here:

- **The culture resolvers fire now** — the THR-1623 fix landed, so the place's culture is readable through the same `belongs_to` edge (`cultureLayer: 'current'`) the prototype used.
- **Seed 42's three cultures now have three different foundations**, but seed 99 still has two light cultures. **The per-culture variant stamp is still required.**
- **Order and chaos still never dominate a place, and force, mind and spirit never did on either seed.** That sets the sphere table's authoring scope (§ Content pillar).
- A re-composed sample reads as the decision intended, e.g. *Master the Local Craft* in the order-foundation Tistasean town: *"… Geralt sets out to learn it properly. The Tistasean guild rolls list who may learn which technique; Geralt is not on it, and the clerk will not bend."*

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| `fragment` — `fragmentResolution.ts` (THR-573 / THR-475 / THR-884) | 🟢 ACTIVE | **extends** — two coloration axes and one reserved slot; one lookup chain, one fallback rule, one warn-once memo |
| Setting envelopes — `compileOpeningEnvelope` (`src/data/settingClasses.ts:173`) | 🟢 ACTIVE | **precedent + sibling** — the new compile pass copies its shape (module-load, idempotent, fail-loud guard test) |
| Prose enrichment — `gatherNarrativeContext` / `enrichProse` (`src/engine/proseEnrichment.ts`) | 🟢 ACTIVE | **extends** — gathers the place's culture and sphere; resolves the reserved slot |
| **Culture** — `cultureGenerator.ts` (`generateCultures` :522, `registerPregenCultures` :472) | 🟢 ACTIVE | **extends** — one stamp field on `CultureIdentity`, written once at worldgen |
| Sphere affinity — `getNodeSphereAffinity` / `getDominantSphere` (`src/engine/sphereAffinity.ts:32,155`) | 🟠 DORMANT as a badge (Spheres & Quintessence; keyword heuristic), live as data | **reads** — no change. The affinity data is live: the re-measure above reads it on 118 · 135 places |
| Narrative engine vocabulary — `SPHERE_VOCABULARY` (`src/data/narrative-content.ts:35`) | 🟢 ACTIVE | **extends** — the four missing foundation spheres; today `narrative.ts:67` falls back to `['unknown']` for them |
| Doctrine checker — `NUDGE_WORD_BUDGETS` / `doctrineV2Checks.ts` | 🟢 ACTIVE | **extends** — one budget row for the added line |

Population the plan consumes, measured above: **40 · 60 culture-bearing places** and **35 · 24 strong-sphere places** per medium world. The template population is every drawable encounter with a plain first step; the decision counted ~518, and the guard test in slice 1 measures the real number rather than trusting that count.

## Engine pillar

### Systems design

**1. Two coloration axes in the fragment module.** *Lane decision.* `fragmentResolution.ts` already distinguishes **identity axes** (which create distinct surfaces and feed `computeSurfaceKey`: `place`, `counterpartRole`, `setting`) from **coloration axes** (which vary the reading without creating identity — its header names sphere/omen vocabulary as one). Culture and sphere are coloration: one encounter at a light-foundation town and the same encounter at a darkness town are the same surface, read differently. So:

- Add `COLORATION_FRAGMENT_AXES = ['foundation', 'sphere'] as const` beside `SURFACE_FRAGMENT_AXES`, and a union `FragmentAxis`.
- Widen `BoundFragmentAxes` with `foundation?`, `sphere?`, `sphereShare?`, `cultureVariant?`.
- `isFragmentAxis` accepts both families. `enumerateTemplateSurfaces` **ignores coloration axes** — they never multiply the surface count and never touch `computeSurfaceKey`. A template that *authors* its own coloration-axis slot is reported as a problem in v1 (the shared table is the only source), so enumeration stays honest.
- Add `resolveOpeningColoration(reach, bound, templateId)`. Like `resolveSettingVariant` (`fragmentResolution.ts:222`), it is **not a second mechanism**: it picks the table line, builds a `ContextFragmentSet` on the right axis and delegates to `resolveFragment`, so the trace and debug read get a normal `FragmentBinding`.

**2. The line goes in by a compiled reserved token.** *Lane decision.* A new pure function `compileOpeningColoration(template)`, sibling of `compileOpeningEnvelope`, applied once at module load:

- Reserved slot `COLORATION_FRAGMENT_SLOT = 'place_fact'`; token `{frag:place_fact}`.
- Placement: if step 0's `narrativeTemplate` has a paragraph break, the token goes at the end of its **first** paragraph (P2, situation and complication). Otherwise it goes at the end of the prose. If the author already placed the token, it stays where it is.
- Idempotent (a template already carrying the token is returned unchanged), byte-identical for templates it skips, and it skips a branch-first template, a template with no `reach`, and anything in `COLORATION_EXCLUDED_TEMPLATE_PREFIXES`.
- Applied at the catalog assembly points so that **every template the guard test's universe names carries exactly one token**. The universe is: `ENCOUNTER_TEMPLATES`, everything `getAnyEncounterById` resolves, `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES`, and the encounter-shaped members of `UNIFIED_ACTION_TEMPLATES`. The executor picks the assembly points (grey zone below); **the guard is the contract**, as `settingClasses.test.ts` is for openings.

Why a compiled token rather than appending at render time: every step-0 renderer already goes through `enrichProse` for the opening-envelope token, so a token rides that one path; a render-time append would need the step index at five call sites (four stage adapters and `unifiedActionResolution.ts:2262`). The token also shows as a chip in the CMS package view, which already renders `{frag:*}` as a slot (`src/components/CMS/encounter-package/PackageBlocks.tsx:145`), so designers can see where the line lands.

**3. The render path.** In `enrichProse`'s `{frag:*}` branch (`proseEnrichment.ts:668`), the reserved slot is resolved through `resolveOpeningColoration` from context fields, not from `ctx.contextFragments`. `gatherNarrativeContext` adds:

- `placeLocationId`: the agent's location walked up to the Location tier with `resolveToParentLocation` (`sublocationShape.ts`). A mortal standing in a Place reads its town's culture.
- `placeName`, `placeFoundation`, `placeDemonym`, `placeCultureVariant`: from that Location's `belongs_to` edge with `cultureLayer: 'current'` (the edge `sample.ts` reads). Absent culture means all four are absent.
- `placeDominantSphere`, `placeSphereShare`: `getNodeSphereAffinity` + `getDominantSphere` on the agent's own location first, then the parent Location. Share = dominant score ÷ total score.
- `templateReach`: the template's `reach`, threaded through the existing `templateId` option. No new required parameter.

`resolveOpeningColoration` fills `{demonym}` and `{place}` itself, then returns the line; `{actor}` is left for the rest of `enrichProse` to resolve as usual. **Table lines never use `{culture}`**, because that token names the *actor's* culture (`proseEnrichment.ts:449`), and a stranger in town is exactly the case where the two differ.

**4. The per-culture variant stamp.** `stampCultureCustomVariants(graph)` in `cultureGenerator.ts`, called once in `worldSeed.ts` after both culture paths (`:1335`, `:1427`). For each foundation, the cultures of that foundation are sorted by node id and stamped `cultureIdentity.customVariant = ordinal mod CULTURE_CUSTOM_VARIANTS`. `CultureIdentity` gains the optional `customVariant?: number` field (additive, NFP #6). Historical cultures are stamped too; no reader uses theirs, and stamping them is cheaper than a special case. A saved world without the stamp derives the same ordinal at read time, which is the fail-soft path.

**5. Choosing the line.**

1. Culture present, foundation is one of the four, and the cell `CULTURE_CUSTOMS[foundation][reach]` is authored → the culture line, variant `customVariant mod cell length`.
2. Else, dominant sphere with share ≥ `SPHERE_FACT_MIN_SHARE`, and the cell `SPHERE_FACTS[sphere][reach]` is authored → the sphere line, variant chosen by a stable hash of the place id (`hashSeed` from the one-namer primitives) mod the cell's length.
3. Else → nothing. The token strips to `''` and the paragraph reads exactly as authored today.

### Graph nodes / edges

None new. It reads `belongs_to` (culture, `cultureLayer: 'current'`) and `located_at`. It writes one property, `cultureIdentity.customVariant`, once at worldgen.

### Tick phases

None. Worldgen writes the stamp once; everything else happens at prose render time, inside the existing `enrichProse` calls.

### Resolution logic

None. The line is prose only: it changes no roll, forecast, eligibility or outcome.

### PRNG callouts

None. The stamp is an ordinal and the sphere variant is a stable hash, so the same world gives the same line every run (NFP #3), and no PRNG stream is consumed. That matters because `worldSeed` stream order is load-bearing.

## Content pillar

### Prose tables

A new data module `src/data/culture-sphere-lines.ts` holds `CULTURE_CUSTOMS: Record<Foundation, Partial<Record<ReachDomain, readonly string[]>>>` and `SPHERE_FACTS: Partial<Record<SphereName, Partial<Record<ReachDomain, readonly string[]>>>>`. `Partial` is deliberate: an unauthored cell means no line, never a crash (NFP #4).

**Authoring rules** (the decision's, restated as checkable rules):

- **One sentence per line**, at most `COLORATION_LINE_MAX_WORDS` (28) words. The prototype's 36 lines run 19 words at the median and 26 at the most.
- **It states a custom, a cost or a pressure that bears on the test**: who may act, what it costs, who is watching, what is hidden. It never describes a mood.
- **Tokens:** `{actor}`, `{demonym}`, `{place}` only. Never `{culture}` (see § Systems design, part 3).
- **Sphere lines never name the sphere as game jargon.** The prototype's *"stands on matter-heavy ground"* is the shape to avoid; say what the power does (*"the thing is bound into the stone itself"*).
- **A culture cell's three variants must differ in the custom, not in the wording**, because they are what two same-foundation cultures read side by side.

**Authoring scope:**

| Table | Cells | Lines | Slice |
|---|---|---|---|
| Culture customs, the prototype's reaches (iron, stone, eye) | 4 × 3 | 24 from the prototype + 12 new third variants | 1 |
| Culture customs, the other five reaches (gold, shadow, veil, heart, star) | 4 × 5 | 60 | 2 |
| Sphere facts, the prototype's cells (life, matter, darkness, order × iron, stone, eye) | 12 | 12 from the prototype + 12 new second variants | 1 |
| Sphere facts, the rest of the seven that ever dominate (matter, entropy, life, energy, darkness, time, light) × 8 reaches | the remaining cells | up to 112 in total across both slices | 2 |

*Lane decision:* force, mind, spirit and chaos cells are not authored. None of them dominated a place on either seed, so their lines would never fire. The order cells already in the prototype are ported because they cost nothing. If a later world shows one of them dominating, the trace names the cell (`sphere_cell_unauthored`) and it can be authored then.

**Who authors:** prose is authored by the model that writes the corpus, not delegated through a spec (Christian's standing rule for prose content). Slice 2 is prose-only and suggests `fable`.

### Data tables

`SPHERE_VOCABULARY` gains `chaos`, `order`, `light` and `darkness`, ported verbatim from the prototype's `MISSING_SPHERE_VOCABULARY` (10 adjectives, 10 past-tense verbs, 10 nouns each, the shape of the existing eight). These feed `narrative.ts:67`, which falls back to `['unknown']` for them today.

### Encounter templates

None rewritten. The compile pass adds a token to step 0.

### Attachment content

N/A — no attachment carries opening prose.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces). The line is prose in DOM surfaces; no WebGL is involved.*

### Player-facing display

No new component. The line appears inside the opening prose the encounter stage already renders (all four stage adapters feed step 0 through `enrichProse`), and in the frozen step record that `unifiedActionResolution.ts:2262` writes for replay and the chronicle. UI Laws engaged:

- **Law 43** (no leaked placeholders): the token and its inner tokens must never reach the player raw. The leak guard in slice 1 covers this.
- **Laws 1, 13/14, 17, 21, 33 and 37**: checked and unaffected. The line is prose, with no numeral, no engine unit, no new control and no new chrome, and the opening's layout is unchanged.
- **Law 56** (a chip only for a real change): the line is prose in the opening, never a chip.

### Event notifications

None.

### Debug inspection (DebugPanel)

- **`window.__DEBUG.getOpeningColoration(locationId?, reach?)`** (async, typed in `debug-bridge.d.ts`). It defaults to the hero's location and all eight reaches, and returns `{ locationId, placeLocationId, foundation, cultureId, customVariant, dominantSphere, sphereShare, perReach: Record<ReachDomain, { kind: 'culture' | 'sphere' | 'none', reason, line }> }`.
- **`window.__DEBUG.getColorationCensus()`** returns place-tier counts: with a culture, with a strong sphere, both, neither, and per-foundation culture counts with their stamps. This is the re-measure above as a one-liner.
- **Fragments debug tab** (`FragmentsDebugTab.tsx`): one row for the reserved slot, showing kind, cell and variant.

### Visual presence (HexMapV2)

N/A — the line is encounter prose; the map is unchanged.

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `stampCultureCustomVariants` (`cultureGenerator.ts`) | worldgen (`worldSeed.ts`, after both culture paths) | — | `cultureIdentity.customVariant` on culture nodes | none (one-shot, inspectable on the node) | `getColorationCensus()` |
| `compileOpeningColoration` (`settingClasses.ts` or `fragmentResolution.ts`, the executor's call) | module load | CMS `PackageBlocks` shows the chip | — | — | guard test |
| `resolveOpeningColoration` (`fragmentResolution.ts`) | render time, via `enrichProse` | encounter stage opening; step records | — | `opening_coloration_bound` | `getOpeningColoration()`, Fragments tab |
| `gatherNarrativeContext` additions (`proseEnrichment.ts`) | render time | — | `NarrativeContext.place*` fields | — | — |
| `SPHERE_VOCABULARY` additions | tick narrative events | event feed prose | — | — | — |

Checked against `Docs/plans/wiring-checklist.md`. Rows that apply: the prose pipeline (`enrichProse`: yes), debug visibility (yes), traces (yes). No orchestrator phase, no GameState field and no player control.

## Interface impact

Culture, Encounters & Dilemmas and Spheres & Quintessence are **unaudited** in `Docs/canon/interface-map.md`, so this is audit-on-touch.

| Contract | Action |
|---|---|
| **new** `culture-custom-reaches-encounter-opening`: worldgen writes `cultureIdentity.customVariant` and the place's `belongs_to` culture; `resolveOpeningColoration` reads both at step-0 render | **add** — the write site and the production read site are both in this plan. Row in `interface-map.md` + `scripts/interface-contracts.ts` in slice 1 |
| **new** `place-sphere-reaches-encounter-opening`: `sphereAffinity` on location nodes → `resolveOpeningColoration` | **add** — same PR |
| THR-573 fragment resolution (`{frag:*}` identity axes) | **extend** — new coloration axes; identity axes, `computeSurfaceKey` and surface enumeration unchanged |
| THR-884 setting envelopes (`{frag:opening}`) | **preserve** — the new token sits in step-0 prose after the envelope's prepend; the two never share a slot |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `SPHERE_FACT_MIN_SHARE` | `0.55` | The dominant sphere's share of a place's sphere score at or above which the sphere line is stated. Measured: 0.35 fired on 74% of places (noise); 0.55 fires on 30% · 18% |
| `CULTURE_CUSTOM_VARIANTS` | `3` | Variants authored per culture cell; the stamp takes an ordinal modulo this |
| `SPHERE_FACT_VARIANTS` | `2` | Variants authored per sphere cell |
| `COLORATION_LINE_MAX_WORDS` | `28` | Word budget for one added line, as a new `NUDGE_WORD_BUDGETS` row. The authored opening keeps its 80; the checker counts the line separately |
| `COLORATION_FRAGMENT_SLOT` | `'place_fact'` | Reserved slot name for the compiled token |
| `COLORATION_EXCLUDED_TEMPLATE_PREFIXES` | `['encounter.slice.']` | Templates the compile pass skips. See § Notes for why the slice is held out, and when it is released |
| `COLORATION_CULTURE_FIRST` | `true` | Precedence when both lines apply. The decision fixes culture first; named so the call is one flip, not a rewrite |

## Tracing

```ts
// OpeningColorationBoundTrace — emitted once per enrichProse call that resolves the reserved slot
interface OpeningColorationBoundTrace {
  category: 'opening_coloration_bound';
  tick: number;
  agentId: string;
  templateId: string;
  reach: ReachDomain;
  placeLocationId: string | null;
  kind: 'culture' | 'sphere' | 'none';
  /** Why a line was or was not chosen: 'culture', 'sphere', 'no_place', 'no_culture',
   *  'unknown_foundation', 'culture_cell_unauthored', 'sphere_below_share',
   *  'sphere_cell_unauthored', 'no_reach'. */
  reason: string;
  foundation?: string;
  cultureId?: string;
  variant?: number;
  dominantSphere?: string;
  sphereShare?: number;
  summary: string; // e.g. "opening_coloration: encounter.master_local_craft stone → culture light#1"
}
```

It follows the `outcome_band_prose_selected` precedent in the same file: one trace per enrich call, and nothing is emitted while tracing is disabled.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Agent has no location, or the location has no parent Location | No culture line; the sphere check runs on whatever node exists, else nothing. Reason `no_place` |
| Place has no current culture | Sphere check, else nothing. Reason `no_culture` |
| Foundation is not one of the four (e.g. an old save's `'balanced'`) | No culture line; the sphere check runs. Reason `unknown_foundation` |
| Culture has no `customVariant` (a pre-stamp save) | Derive the same ordinal at read time: same-foundation cultures sorted by id |
| More same-foundation cultures than variants | Ordinal modulo the cell length. Two cultures share a line, the trace shows it, and the census counts it |
| Cell unauthored (slice 2 not yet shipped) | Fall through to the next rule, else nothing. Reasons `culture_cell_unauthored` / `sphere_cell_unauthored` |
| Template has no `reach` | The compile pass skips it; at render time, reason `no_reach` and nothing |
| A renderer shows step prose without `enrichProse` | The leak guard catches it in CI. The residual `{frag:*}` strip in `enrichProse` already prevents a malformed token leaking |
| Any throw inside the resolver | Caught at the existing `unifiedActionResolution` try/catch (`:2245`), which stores the raw template. The resolver itself returns `''` on any missing input and never throws |

## Blast Radius

Not required. None of the files touched has ≥100 importers (counted 2026-09-27: `types/culture` 33, `settingClasses` 50, `proseEnrichment` 29, `worldSeed` 24, `narrative-content` 10, `fragmentResolution` 7, `cultureGenerator` 4).

## Slicing

*Lane decision:* two build tickets, so the carrier ships without waiting on ~170 lines of prose.

- **Slice 1, this ticket ([THR-1635](https://linear.app/threadbare/issue/THR-1635)):** all of the Engine and UI pillars, the four word lists, and the prototype's cells ported plus their missing variants (the slice-1 rows in § Content pillar). Unauthored cells fall back to no line, so the slice ships safe.
- **Slice 2, [Culture and spheres showing through: write the rest of the tables](https://linear.app/threadbare/issue/THR-1638)** (Todo, blocked by slice 1): the slice-2 rows. Prose only; no engine change.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It serves *the world is lived in and it is not about you*: a stranger's encounter reads the town's customs, not the stranger's. It keeps the player-as-god framing: the line narrates the world, not the god.
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play. The line is prose only: no roll, forecast, eligibility or outcome changes.
- [x] No rulebook edit.

> Brainstorm companion: `Docs/plans/2026-09-27-thr-1635-culture-sphere-openings-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Seven named constants; the threshold and precedence are one-number changes |
| 2. Inspectability | PASS | `opening_coloration_bound` carries its reason; two debug reads; a Fragments-tab row; the stamp sits on the culture node |
| 3. Determinism | PASS | No PRNG: an ordinal stamp and a stable place-id hash. No `worldSeed` stream is consumed |
| 4. Fail-soft | PASS | Every missing input degrades to no line; see the table |
| 5. Narrative over mechanical perfection | PASS | The line changes what the test is *about*, with no mechanical effect; the culture-first precedence favours the story |
| 6. Additive over destructive | PASS | New optional field, new axes, new module, new token; nothing removed; skipped templates are byte-identical |
| 7. Performance budget | PASS with note | Render time only: two edge walks and one affinity read per step-0 render. No per-tick cost. The executor records the 30-tick CLI smoke timing |

## Kill criteria

- **Players skip the added sentence** (a read test, or Christian in play) → keep the tables but turn the compile pass off: one exclusion change, restoring today's text byte for byte.
- **One town's custom reads as a stuck record** after about five encounters → author more variants per cell (the decision's named fix), not a redesign.
- **The leak guard finds a renderer outside `enrichProse` that cannot be fixed cheaply** → narrow the compile pass's universe to the renderers the guard covers.

## Done when

Slice 1 (this ticket):

- [ ] The guard test proves every template in the stated universe (§ Systems design, part 2) carries exactly one `{frag:place_fact}`, except the excluded prefixes, branch-first templates and templates without a reach. It prints the count it checked, and fails at zero.
- [ ] Unit tests for `resolveOpeningColoration` cover every reason code in § Tracing, culture-first precedence, the stamp ordinal with two same-foundation cultures, and the pre-stamp fallback.
- [ ] A **leak guard** renders step 0 of every guarded template through `enrichProse` on a generated medium world, for seeds 42 and 99, at a culture-bearing place and at a strong-sphere wild place. It asserts no `{` survives, and that at least one render per seed carries a culture line and one a sphere line (so the probe cannot pass vacuously).
- [ ] On a generated medium world, `getColorationCensus()` reports the re-measure table's culture and strong-sphere counts within ±10%, and no two living same-foundation cultures share a stamp while there are three or fewer of them.
- [ ] `SPHERE_VOCABULARY` has all twelve spheres; the `narrative.ts:67` `['unknown']` fallback no longer fires for chaos, order, light or darkness.
- [ ] The doctrine checker reports the added line against `COLORATION_LINE_MAX_WORDS`, not against the opening's 80.
- [ ] The two interface-map rows are added. The wiki pages whose sources this touches (`attention-story-reference` for `src/engine/prose*.ts`, `run-lifecycle-reference` for `worldSeed.ts`, and any catalog page an assembly point touches) are updated.
- [ ] Browser evidence (UI pillar, per [verification-gates § Browser-verify](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/verification-gates.md)):
  - a 1920×1080 Playwright screenshot of an encounter opening showing the line, via `?view=game&seeded&size=medium&spawn=<a template whose reach cell is authored>`;
  - console output;
  - `await window.__DEBUG.getOpeningColoration()` naming the same line;
  - a UI-Laws line citing 1, 13/14, 17, 21, 33, 37, 43 and 56.
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build`, `npm run test:heavy` (engine files are touched), and a 30-tick CLI smoke all pass.
- [ ] The closing commit body carries the close keyword for this ticket on its own line.

## Coordination block

**Suggested model:** opus — the engine and UI carrier plus a ported table (advisory; the lane runs what it runs).

**Parallel-safe with:** [THR-1627](https://linear.app/threadbare/issue/THR-1627) (content-level measurement; touches no file here).

**Mutex with:**
- [THR-1633](https://linear.app/threadbare/issue/THR-1633) — the let-written-encounters-land work may edit `encounter-content.ts` and the catalog assembly points the compile pass is applied at.
- [THR-1630](https://linear.app/threadbare/issue/THR-1630) and [THR-1632](https://linear.app/threadbare/issue/THR-1632) — both will likely edit `worldSeed.ts` and `cultureGenerator.ts` (notables and ties; temple chapters per culture).

Each of these is a mutex only once it is itself in build. Today all three are plan tickets, and plan docs touch no `src/`.

**Files to touch:**
- Create: `src/data/culture-sphere-lines.ts` (tables and constants); tests beside the modules below.
- Edit:
  - `src/engine/fragmentResolution.ts` (coloration axes, `resolveOpeningColoration`, enumeration ignores coloration)
  - `src/engine/proseEnrichment.ts` (context fields, reserved-slot branch, trace)
  - `src/engine/cultureGenerator.ts` (the stamp)
  - `src/engine/worldSeed.ts` (one call)
  - `src/types/culture.ts` (`customVariant?`)
  - `src/data/settingClasses.ts` or the fragment module (`compileOpeningColoration`), plus the catalog assembly points
  - `src/data/narrative-content.ts` (four word lists)
  - `src/data/content-eval/nudgeAuthoringConstants.ts` (`NUDGE_WORD_BUDGETS` row) and `doctrineV2Checks.ts`
  - `src/debug-bridge.ts` and `.d.ts`
  - `src/components/Game/debug/FragmentsDebugTab.tsx`
  - `src/types/trace.ts`
  - `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts`
  - `Docs/plans/2026-04-16-systemic-wiring-guide.md` (new content-facing capability: the coloration line and its tables)

## Notes for the executor

- **The slice encounters are held out on purpose** (*lane decision*). Christian is mid-playthrough of the five slice encounters ([the integrated slice checkpoint](https://linear.app/threadbare/issue/THR-1220)); changing their openings under him would muddy that verdict. Mark the exclusion constant `// TODO(THR-1220): release the slice once the checkpoint closes`. Releasing it is a one-line constant change.
- **Grey zone: assembly points.** Where exactly `compileOpeningColoration` is applied is yours. The guard's universe is the contract. Prefer the fewest points that make the guard pass, and never apply it per tick.
- **Grey zone: where the compile function lives.** `settingClasses.ts` keeps it beside its sibling; `fragmentResolution.ts` keeps it beside the slot constant. Either is fine.
- **Do not** key anything on the actor's culture. A stranger reads the *town's* custom; a second line for the actor's own culture is the "cultural friction" idea the decision named as a possible later step, not this plan.
- **Do not** add coloration to `computeSurfaceKey` or to surface enumeration. Coloration axes are not identity (§ Systems design).
- **Port the prototype lines**, then write the missing variants to the authoring rules. Replace sphere-jargon phrasings (*"matter-heavy ground"*) as you port them.
- `{place}` resolves to the **Location-tier** name (the town), not the Place the mortal stands in.

## Forked-audit verdicts

Intent judge (fable, cold context, 2026-09-27): **Allow**, Reversible confirmed. 14 file:line claims spot-checked in the worktree, all confirmed. One GAP (kill criteria were only in the proposal) is fixed by § Kill criteria. One cosmetic path fix was applied.

### NFP audit

**PASS-with-notes.** All seven NFPs pass. Note on NFP 7: the render-time-only cost is reasoned, not measured; the executor records the 30-tick CLI smoke timing (already a Done-when).

### Three-pillar audit

**PASS-with-notes.** All three pillars are present and substantive; wiring and substrate inventory are present and cross-checked against the systems inventory. Note: sphere affinity was labelled ACTIVE while the inventory badges Spheres & Quintessence as DORMANT. The row now states both (the badge, and the live data this plan reads). Not blocking, since the plan only reads it.

### Vision audit

**PASS.** North star confirmed (the world is lived in); non-negotiable #3 (prose, never numbers) confirmed through the sphere-jargon ban; design tension #2 extended (generated culture selects an authored cell). No contradictions.
