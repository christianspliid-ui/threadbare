> **title:** `Encounter context-multiplication grammar (Tier-2 surface generators) — THR-573`
> **linear_issue:** THR-573
> **author:** `Claude Code`
> **created:** 2026-07-23
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# Encounter context-multiplication grammar — THR-573

> **lint_plan_doc:** exempt — shipped THR-573 plan slightly predating the current template's checkbox minima; edited in place only for the scene-first retirement markers (THR-1372).

*One authored skeleton becomes ~20 distinct, fully-authored player experiences by letting prose respond to the same context axes the selection engine already keys surface identity on.*

## Why this is load-bearing

The library target is ~1,000+ encounter surfaces (THR-467, director-endorsed 2026-06-22) and the leverage is overwhelmingly Tier 2: context-multiplied templates. Phase 0 shipped the *naming* half — `computeSurfaceKey` in `src/engine/encounterSurface.ts` already treats the same template at a guild versus a shrine versus a road as different surfaces for novelty and recency. But the prose does not follow: those "different" surfaces read identically, so the multiplication is currently an accounting trick the player can see through. This plan designs the *reading* half — the grammar by which authored prose fragments bind to the bound context — plus the primitive inventory, the tier model made concrete, a worked example at full fragment quality, and the authoring-pipeline changes. Without it, Tier-2 authoring (Phases 1–2 of the parent plan) cannot begin, and the volume program stalls at bespoke-only growth (~26 branching cores, linear cost). Parent design: `Docs/plans/2026-06-22-encounter-volume-scaling-design.md`.

## Substrate inventory

Grep evidence gathered 2026-07-23 against `origin/main` (post-THR-694–700 scene-integration chain — a substrate the June parent design predates):

| Substrate | Where | Status |
|---|---|---|
| Surface key + axes (`sublocationTypeId`, `reachPrimary`, `socialRole`) | `src/engine/encounterSurface.ts:30` (`SURFACE_KEY_AXES`), consumed at `encounterScoring.ts:1240` and `phaseAgentDecision.ts:1040` | **ACTIVE** (THR-475 / Phase 0 shipped) |
| Surface-keyed novelty/recency | `encounterScoring.ts` `computeNoveltyMultiplier` call site | **ACTIVE** |
| Volume model | `scripts/encounter-volume-model.ts` (`npm run volume-model`) | **ACTIVE** |
| Enrichment placeholders + conditional blocks (`{name}`, `{target:*}`, `{ally:*}`, `{rival:*}`, `{artifact:*}`, `{intel:*}`, `{?has_*}` / `{?no_*}` / `{?knows_*}` / `{?target_is_ally}`) | `src/engine/proseEnrichment.ts` (`enrichProse`, `NarrativeContext`) | **ACTIVE** |
| Cast tokens + declared-key invariant (`{cast:*}`: bound → live graph name, unbound → spec `spawnName`) | `proseEnrichment.ts` (THR-696) | **ACTIVE** |
| Scene continuity through seeds (`inheritContext` threads target + cast) | `src/engine/encounterSeeding.ts` (THR-697) | **ACTIVE** |
| Register scorer + prose-QA harness | `src/engine/content-eval/registerCompliance.ts:365`, `proseQualityScore.ts:353` (`scoreProseEntry`) | **ACTIVE** (THR-609/490) |
| Omen / doom / sphere vocabulary injection | `NarrativeContext.omen*` / `doom*` fields, `{sphere_flavor}` | **ACTIVE** |
| Legacy `EncounterTemplate` format | removed by THR-108; remaining grep hits are comments (e.g. `arcane-circle-encounter-content.ts:5` "legacy EncounterTemplate entries rewritten") | **RETIRED** — the ticket's "115 legacy templates" interaction concern is stale; multiplication targets `UnifiedActionTemplate` only, and that is now the only format |

**Verdict: this plan extends existing systems.** One genuinely new primitive is proposed (the fragment table + `{frag:*}` resolver) and it is the headline deliverable, not hidden substrate — see the pre-flight below.

## Pre-flight (action-catalog-design skill)

### Substrate Honesty table

| Mechanism | Substrate it touches | Exists today? | Verdict |
|---|---|---|---|
| Place identity axis | `sublocationTypeId` on `EncounterCacheEntry`, in `SURFACE_KEY_AXES` | Yes (`encounterSurface.ts:31`) | rides existing |
| Counterpart-role identity axis | `targetAgentRole` on cache entry (Phase 0), `NpcRole` enum (~37 values, `src/types/npc.ts:34`) | Yes | rides existing |
| Fragment resolution inside prose | `enrichProse()` token pipeline | Yes — pipeline exists; **new token family `{frag:*}` + context fields added** | small extension, specced fully below |
| Fragment storage on templates | `UnifiedActionTemplate` (additive optional field) | Field is new; format is the live standard | **NEW — this plan's core deliverable, fully specced here** |
| Coloration axes (sphere/omen/doom vocab, cast continuity, intel, `{?target_is_ally}`) | existing enrichment machinery | Yes | rides existing, zero changes |
| Surface counting / QA enumeration | `collectAuthoredProse` sweep + volume-model script | Yes — both extended additively | rides existing (small extension) |

No entry other than the declared deliverable needs new substrate. Nothing is deferred to "verify at implementation."

### Mortal-Loop Bridge

Surfaces are ordinary mortal encounters flowing through the existing decision → encounter → aftermath loop. No new player verb, no new intervention type, no new resource. The player's experience of this plan is purely that the world's recurring situations read as belonging to their place and people: the recruitment pitch in the smugglers' den is a different scene from the one in the temple quarter, made of the same bones. God-intervention choices, "let them handle it," and the aftermath surface are untouched.

### Surface-Shape check

Fragments are **template-local** — declared on the template that owns them, authored per family. Axes are **global closed enums** (`SublocationTypeId` registry, `NpcRole` union) shared with the selection layer, so the same axis vocabulary drives both *which surface fires* and *how it reads*, and cardinality is bounded by construction. This plan makes that choice explicit rather than defaulting to global because `unified-action-templates.ts` happens to be global: prose belongs to its template; identity vocabulary belongs to the engine.

## The grammar

### Rule 1 — Two kinds of axes: identity multiplies, coloration combines

**Identity axes** create distinct surfaces. They are exactly the per-template levers already in `SURFACE_KEY_AXES`, so selection identity and prose identity can never drift apart:

- **`place`** (`sublocationTypeId`) — the Arkham lever. ~20 closed values (tavern, guild-hall, market-district, shrine, harbor, smugglers-den, …).
- **`counterpartRole`** (`socialRole` / `targetAgentRole`) — who the scene is with. ~37 closed values (fence, priest, scout, noble, …). `null` for non-social templates, which then multiply on place alone.

(`reachPrimary` stays in the surface key but is **not** a multiplication lever: a template's reach is fixed at authoring, so reach differentiates *templates*, not surfaces of one template.)

**Coloration axes** vary the reading without creating identity, and they are all already live: sphere/omen/doom vocabulary injection, `{cast:*}` continuity (a returning character is the strongest freshness signal we have, per THR-697), `{intel:*}` recognition, `{?target_is_ally}` relationship forks, `{name}`/`{ally}`/`{rival}` bindings. The grammar's contract: **coloration is free variation on any surface; only identity axes count toward the library.**

**Explicitly rejected as v1 identity axes** (recorded so drafts don't re-litigate): *personality traits* (illegible as a prose axis — the player can't see why the scene reads differently, violating inspectability of experience; personality already acts through selection and motive receipts); *faction stance* (real candidate, but stance data is per-faction-pair and unbounded per template — defer to v2 with its own design); *prior history* (already served by cast continuity + choice memory as coloration; making it identity would double-count novelty).

### Rule 2 — Fragments attach at named slots, with a declared-default invariant

An authoring-time additive field on `UnifiedActionTemplate`:

```ts
/** One slot's authored variants along one identity axis. */
export interface ContextFragmentSet {
  readonly slot: string;                                 // e.g. 'opening', 'counterpart'
  readonly axis: SurfaceFragmentAxis;                    // 'place' | 'counterpartRole'
  /** axisValue -> authored prose. MUST contain the '*' default key. */
  readonly variants: Readonly<Record<string, string>>;
}

// on UnifiedActionTemplate (additive, optional):
readonly contextFragments?: readonly ContextFragmentSet[];
```

Prose fields reference slots with a new enrichment token: `{frag:opening}`. At render time `enrichProse()` resolves the token from the action's bound context: bound axis value → that variant; unknown/absent value → the `'*'` default; malformed slot → token stripped plus one warn trace. This is the cast system's **declared-key invariant** transplanted: *a declared slot always resolves*, so prose can reference its own fragments unguarded and base behavior is never worse than today. A template with no `contextFragments` renders exactly as it does now — the whole layer is opt-in per template.

Resolution is a **deterministic lookup, no PRNG**: same surface → same prose, every run (NFP #3 for free). Multiple variants *per axis value* (rotating three tavern-openings) are deliberately out of v1 — that is where seeded `pickTemplate` would enter, and it can be added later without schema change by widening the value type to `string | readonly string[]`.

### Rule 3 — A surface counts when it reads differently

The library-counting rule the volume model needs: a template's surface count = (place values with ≥1 authored variant in any slot, plus 1 for `'*'`) × (role values likewise, plus 1). Fragment tables are statically enumerable, so `scripts/encounter-volume-model.ts` gains a mode that **reads the actual fragment tables and reports measured surface counts** — the ~1,000 target becomes an observable, not an assertion. The same enumerability feeds Prose QA: `collectAuthoredProse` sweeps every variant, so every fragment is scored by the THR-609 register scorer before it ships (this closes, for fragments, the same blind spot step-afterimages currently sit in).

### Rule 4 — Tier model, made concrete

| Tier | What it is | Engine mechanism | Prose source | Volume share |
|---|---|---|---|---|
| 1 — Bespoke marquee | Hand-authored branching encounters (`encounter-pipeline`) | unchanged | fully authored | ~60–80 cores (quality engine, not volume) |
| 2 — Context-multiplied | Linear/family templates + `contextFragments` | this plan | authored fragments, per identity-axis value | ~600–900 surfaces (the backbone) |
| 3 — Ambient grammar | Procedural composition from phrase-banks | future (Phase 3 of parent) | phrase-banks, ambient-only guardrail | long tail; **out of scope here** |

Tier-2 leverage arithmetic: ~50–80 skeletons × 2 slots × (4–6 authored values per axis) ≈ 12–24 surfaces each from ~9–12 authored fragments — the worked example below realizes exactly this shape.

### Primitive inventory (named, reusable)

1. **Surface key** (`computeSurfaceKey`, live) — surface identity for selection/novelty.
2. **Enrichment token pipeline** (`enrichProse`, live) — placeholder + conditional resolution.
3. **Declared-default fragment table** (`ContextFragmentSet` + `{frag:*}`, **new**) — context-keyed authored prose with never-throw fallback.
4. **Cast/support bundle** (live) — character continuity across surfaces.
5. **Seed context inheritance** (live) — surface-to-surface scene continuity.
6. **Register scorer** (live) — mechanical quality floor over enumerable prose.
7. **Volume model** (live, extended) — measured surface counts from fragment tables.

Nothing else is invented. Any future consumer wanting context-keyed prose variants (attachment flavor by place, faction content by stance) reuses primitive 3 rather than green-fielding — that is what makes it a primitive rather than a feature.

## Engine pillar

### Systems design

New module `src/engine/fragmentResolution.ts` (pure):

- `resolveFragment(template, slot, boundContext) → { text, axis, value, usedDefault }` — the lookup + fallback chain above.
- `enumerateTemplateSurfaces(template) → SurfaceEnumeration` — static product of authored axis values (Rule 3), consumed by the volume model and Prose QA.

`enrichProse()` gains the `{frag:<slot>}` token family. Two additive fields on `NarrativeContext`: `sublocationTypeId?: string` and `targetRole?: string`, populated at context-build time from the action's location resolution and target node (both already graph-resolvable where contexts are built; absent → `'*'` path). No new tick phase — resolution happens inside existing prose rendering at encounter instantiation/step render.

### Graph nodes / edges

None. No new node or edge types; the grammar reads existing `located_at` resolution and target/`supportBindings` state. (Load-bearing rule "relationships are edges" is untouched — fragments are template data, not world state.)

### Tick phases

None added. Fragment resolution runs inside existing prose-generation call sites (encounter step render, aftermath render). No orchestrator change beyond the trace emission below.

### Resolution logic

Deterministic two-step lookup: `variants[boundAxisValue] ?? variants['*']`. Slot missing from `contextFragments` → token stripped + single warn trace per template id (not per render). No scoring, no ranking.

### PRNG callouts

**None.** v1 fragment selection is a pure lookup. The absence of PRNG is the design: same surface, same words. (Future multi-variant-per-value would use `pickTemplate(variants, seed + FRAGMENT_SEED_OFFSET)` — named here so the offset is reserved, not improvised.)

## Content pillar

### Encounter templates

- **Retrofit proof (this ticket's executor scope):** `social_scene.recruitment_pitch` (`src/data/social-scene-templates.ts:259`) gains the fragment tables authored in the worked example below — 20 surfaces from 9 fragments. This is the parent plan's "Phase 1: prove Tier 2 on existing content" first unit.
- **Not in this ticket:** converting further families. That is Phase-2 authoring at scale, gated on the KPI measurement of the proof (top-share falls, eligible-pool depth rises — THR-457 harness).

### Prose tables

The fragment tables ARE the new prose surface. Authoring rules (binding, enforced by the pipeline skill — *amended 2026-08-29, round-5 sweep: the original scene-first rule ("write the paragraph, then extract") was retired 2026-08-25 with Prose Doctrine v2; the skill's Pass 2 is now design-first fragment drafting in narrator mode*): baseline register — encounter surfaces never qualify for peak (v2 closed the peak list to non-encounter surfaces); every variant passes the 5-question bar; fragments never hardcode entity names — `{name}`/`{cast:*}`/`{target}` remain the only name sources; the `'*'` default is a real authored fragment, not a stub.

### Attachment content

N/A — no attachment changes. (Attachment flavor-by-place is a named *future* consumer of primitive 3, not scope.)

### Data tables

None beyond `contextFragments` on retrofitted templates. No world-model.json changes.

### Worked example — one core → 20 surfaces

**Core:** `social_scene.recruitment_pitch` (5 steps: opening → read → pitch → counter → close; reach heart/shadow; runs at settlements). Two slots:

- Slot **`opening`** on axis **`place`** — referenced from the opening step's `narrative` (`{frag:opening}` replaces the current generic line). 5 authored values + default.
- Slot **`counterpart`** on axis **`counterpartRole`** — referenced from the counter step's `narrative` (the hesitation is where the *person* shows). 4 authored values + default.

Surface count: (5+1 places counting `'*'`… only values with authored variants count, so 5) × 4 = **20 authored surfaces**, from **9 fragments + the existing skeleton**. Fragments in full (these are the executor's content, not illustrations):

**`opening` × `place`:**

| value | fragment |
|---|---|
| `'*'` (default) | `{actor} finds the target where the day has put them, and opens with a warm word and a well-chosen compliment.` |
| `sublocation-type.tavern` | `{actor} pays for the second round before sitting down. The pitch starts as tavern talk — work, weather, who owes whom — and stays that way until the target relaxes.` |
| `sublocation-type.guild-hall` | `{actor} waits through the queue at the counter like anyone else. When their turn comes, the ledger stays open between them — this is a business call, and both of them know it.` |
| `sublocation-type.market-district` | `{actor} falls in beside the target between stalls, matching their pace. Half the pitch is lost to a fishmonger's shouting, which suits {actor} fine — nothing said here sounds rehearsed.` |
| `sublocation-type.shrine` | `{actor} waits until the target finishes at the altar. Voices stay low here, and the pitch comes out quieter and more honest-sounding than {actor} intended.` |
| `sublocation-type.harbor` | `{actor} finds the target checking cargo against a tide table. The pitch has until the water turns, and both of them know exactly how long that is.` |

**`counterpart` × `counterpartRole`:**

| value | fragment |
|---|---|
| `'*'` (default) | `The target raises a concern — something that holds them back. {actor} must address it directly.` |
| `fence` | `The target's concern is simple arithmetic: they already sell to everyone, and joining one side means the other sides stop buying. {actor} will have to beat the margin, not the argument.` |
| `priest` | `The target hears the offer out, then observes that they already serve a patron — one with a longer memory than most. {actor} is being asked, politely, what happens to them when the two loyalties disagree.` |
| `scout` | `The target wants the terms plain: pay, routes, and who covers them if it goes wrong. They have watched employers from a distance for years. They know exactly how expendable the far end of a line is.` |
| `noble` | `The target does not say no. They say that people like them are not recruited, they are *allied with* — and allies expect a title on the arrangement. The work is agreeable; the wording is not.` |

**Three composed samples** (skeleton + fragments + live enrichment, as the player would read them):

1. *tavern × fence* — "Marek pays for the second round before sitting down. The pitch starts as tavern talk — work, weather, who owes whom — and stays that way until the target relaxes. … The target's concern is simple arithmetic: they already sell to everyone, and joining one side means the other sides stop buying. Marek will have to beat the margin, not the argument."
2. *shrine × noble* — "Serafina waits until the target finishes at the altar. Voices stay low here, and the pitch comes out quieter and more honest-sounding than Serafina intended. … The target does not say no. They say that people like them are not recruited, they are allied with — and allies expect a title on the arrangement."
3. *harbor × scout* — "Kael finds the target checking cargo against a tide table. The pitch has until the water turns, and both of them know exactly how long that is. … The target wants the terms plain: pay, routes, and who covers them if it goes wrong."

**Prose-bar evaluation.** Register: all nine fragments are baseline — short declarative sentences, concrete nouns, zero rare words, zero digits-in-prose, no "X felt Y" interiority, no probability words, no exclamation marks; scorer-clean by inspection against `registerCompliance.ts` detector classes, and mechanically re-scored at implementation when the fragments land in a sweepable table (Rule 3 makes them enumerable — the executor's `npm test` gate includes the fragment sweep). Five-question bar, per fragment: each creates a recognizable human condition (the fence's margin, the noble's wording, the scout's expendability); each opens a question (what happens when the tide turns / when the loyalties disagree); each is a moment with one earned detail (tide table, second round, open ledger), not a label; the *counter*-step failures stay interesting (a festering concern is a future surface, and seed continuity can carry the same counterpart back); each serves Beat 2 (curated moment texture) without touching Beat 1/3 machinery. Voice canon: wear-and-age texture, dry, no bombast; player-as-god framing untouched (all fragments describe mortals acting — the god still only nudges).

## UI pillar

*Screenshot tool: **Playwright** (Debug Panel is DOM; no WebGL surface changes).*

### Player-facing display

The prose itself — no new chrome, no new modal. Encounter step text renders through the existing encounter surface; fragments arrive pre-resolved in the step narrative. The parent design's "seen/unseen codex" replayability meta remains **deferred** (unchanged decision, revisit after Phase-2 volume exists to be perceived).

### Event notifications

None new. Existing chronicle/tick-event flow untouched.

### Debug inspection (DebugPanel)

The Phase-0 encounter inspection view (surfaceKey + axis values + noveltyMultiplier) gains a **fragment-bindings row**: per slot — axis, bound value, `usedDefault` flag. `window.__DEBUG.resolveSurfaceFragments(<encounter or agent ref>)` returns the same structure headlessly for the DoD state assertion.

### Visual presence (HexMapV2)

N/A — no map-layer changes; surfaces have no spatial signifier beyond the encounters that already render.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `fragmentResolution.ts` | none (called inside prose render at encounter instantiation/step render) | encounter step prose (existing) | none (template data + bound action context) | `surface_fragments_bound` | DebugPanel fragment-bindings row; `__DEBUG.resolveSurfaceFragments` |
| `proseEnrichment.ts` (`{frag:*}` + 2 context fields) | existing call sites | — | — | warn trace on missing `'*'` | — |
| `scripts/encounter-volume-model.ts` (measured mode) | n/a (script) | — | — | — | dated md+json in `Docs/playtests/coverage/` |
| `collectAuthoredProse` (fragment sweep) | n/a (QA harness) | DebugPanel Prose QA tab (existing) | — | — | fragments appear as scored entries |

Executor must update `Docs/plans/wiring-checklist.md` (new module + trace) and — because this ships a **content-author-facing capability** — add the fragment grammar to `Docs/plans/2026-04-16-systemic-wiring-guide.md` as a new capability section in the same PR.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `SURFACE_FRAGMENT_AXES` | `['place','counterpartRole']` | Which identity axes may carry fragment tables (v1) |
| `FRAGMENT_DEFAULT_KEY` | `'*'` | Required default key in every variants map |
| `MAX_FRAGMENT_SLOTS_PER_TEMPLATE` | `4` | Compactness cap per template |
| `MAX_VARIANTS_PER_SLOT` | `8` | Authoring cap per slot (cardinality discipline) |
| `MAX_SURFACES_PER_TEMPLATE` | `24` | Cap from parent design; enumeration asserts it |
| `FRAGMENT_SEED_OFFSET` | reserved (unused v1) | Named seed offset for future multi-variant-per-value |

## Tracing

```ts
// SurfaceFragmentsBoundTrace — emitted once per encounter instantiation that resolves ≥1 fragment slot
interface SurfaceFragmentsBoundTrace {
  type: 'surface_fragments_bound';
  templateId: string;
  surfaceKey: string;                 // ties prose identity to selection identity
  bindings: ReadonlyArray<{
    slot: string;
    axis: string;                     // 'place' | 'counterpartRole'
    value: string;                    // bound axis value or '*'
    usedDefault: boolean;
  }>;
}
```

One aggregate trace per encounter instantiation, never per step render (ring-buffer discipline, THR trace-volume rule). Category registered in `TRACE_CATEGORIES`.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Bound axis value has no authored variant | `'*'` default variant; `usedDefault: true` in trace |
| Variants map missing the `'*'` key (authoring error) | Token stripped from prose + one warn trace per template id; unit test also rejects at build time |
| `{frag:<slot>}` references an undeclared slot | Token stripped + one warn trace per template id |
| Context lacks sublocation/role (e.g. hex-tier action, non-social) | Axis resolves to `'*'` path; never throws |
| Template has no `contextFragments` at all | Renders exactly as today — layer is opt-in |
| Enumeration exceeds `MAX_SURFACES_PER_TEMPLATE` | Volume model flags the template; authoring gate fails; runtime unaffected |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/unifiedAction.ts` | 278 importers | One additive optional field (`contextFragments?`) + one exported interface; no existing signature changes, so no compile ripple — risk is conceptual (a new authored field content agents must learn), addressed by the wiring-guide capability section |
| `src/engine/proseEnrichment.ts` | high fan-in (all prose render paths) | New token family is additive; existing tokens and conditionals untouched; the two new `NarrativeContext` fields are optional, so all existing context builders compile unchanged |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (worked example is executor-ready content)
- [x] UI pillar present (debug surfaces; player-facing is the prose itself; HexMapV2 N/A with rationale)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise — it operationalizes replayability-first and narrative-over-mechanical (volume without flattening the marquee); player-as-god framing untouched; no rejected approach reintroduced (fragments are authored, not runtime-LLM; no intelligence gating of candidates; no `EncounterTemplate` revival).
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan does not change a rule of play — turn structure, verbs, prerequisites, resources, encounter *mechanics*, clocks, and win/loss are all untouched; only selection-identity prose texture changes. No rulebook edit required.

> Brainstorm companion: `Docs/plans/2026-07-23-encounter-context-multiplication-grammar-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | All axes, caps, and the default key are named constants; volume targets already constants in `encounterSurface.ts` |
| 2. Inspectability | PASS | `surface_fragments_bound` trace carries slot/axis/value/usedDefault; DebugPanel row + `__DEBUG` read |
| 3. Determinism | PASS | v1 resolution is a pure lookup — no PRNG at all; future multi-variant path has a reserved named seed offset |
| 4. Fail-soft | PASS | Declared-default invariant; every failure path degrades to `'*'` or today's behavior; never throws |
| 5. Narrative over mechanical perfection | PASS | The entire design exists to make mechanical multiplication *read* as story; fragments are scene-first authored prose under the register scorer |
| 6. Additive over destructive | PASS | Optional field + new token family + pure module; zero existing signatures changed; templates without fragments behave identically |
| 7. Performance budget | PASS with note | Resolution is O(slots) map lookups per encounter instantiation (≤4), amortized over ≤40 scored candidates only at render, not scoring; no profiling expected — flag only if step-render hot path shows regression |

## Done when

- [ ] `fragmentResolution.ts` ships with `resolveFragment` + `enumerateTemplateSurfaces`; unit tests cover the full fallback chain and the `'*'`-required rule
- [ ] `enrichProse` resolves `{frag:*}` from the two new optional context fields; all existing enrichment tests stay green
- [ ] `social_scene.recruitment_pitch` carries the 9 worked-example fragments verbatim; enumeration reports 20 surfaces; fragment sweep scores all 9 clean (no `fail`)
- [ ] `npm run volume-model` measured mode reports per-template authored surface counts; two runs byte-identical
- [ ] `surface_fragments_bound` trace registered and emitted; DebugPanel shows fragment bindings; `__DEBUG.resolveSurfaceFragments` works headlessly
- [ ] `template-context-rewrite` pipeline skill created per the spec below
- [ ] Systemic wiring guide + wiring checklist updated in the same PR
- [ ] `npm test` and `npx vite build` pass; ratchet via `npm run check:typecheck` unchanged or justified
- [ ] Browser artifact: 1920×1080 Playwright screenshot of DebugPanel fragment-bindings row + console + `__DEBUG` assertion
- [ ] Closing commit body includes `Fixes THR-573`

## Authoring-pipeline changes (spec)

New skill `.claude/skills/template-context-rewrite/SKILL.md` (name per parent design), four passes mirroring the encounter-pipeline shape:

1. **Axis election** — for the family: which 4–6 place values and 4–6 role values earn fragments, from the family's `locationTypes` gates and plausible counterparts. Output: the election table with one-line rationale per value. Guard: never elect a value the selection layer cannot actually bind (check the family's location gating first — electing `throne-room` for a tavern-gated family is dead content).
2. **Design-first fragment drafting (narrator mode)** — *(pass renamed 2026-08-25/29; the original "scene-first: write the paragraph, then extract" instruction is the retired workflow — the shipped skill drafts fields directly in narrator mode)*. Canon Step 0: `Docs/canon/encounters.md` + `Docs/canon/prose.md`. Register: baseline — no fragment slot is a peak surface. Names come only from enrichment tokens.
3. **QA pass** — mechanical: register scorer over every variant (fail = rewrite), `'*'` present in every map, enumeration within `MAX_SURFACES_PER_TEMPLATE`. Editorial: 5-question bar per fragment; composed-sample read (skeleton + fragment) for at least 3 surfaces.
4. **Merge** — fragments into the template file; wiring-guide cross-check; evidence block.

`encounter-pipeline` (Tier-1 bespoke) is **unchanged** — bespoke encounters may adopt fragments later but are not required to.

## Coordination block

**Suggested model:** `opus` — engine seam (enrichment pipeline + types) plus authored content in one slice; judgment calls on prose quality.

**Parallel-safe with:** THR-714 (script-only, disjoint files); any HexMapV2 or economy work — no shared files.

**Mutex with:** any ticket editing `src/engine/proseEnrichment.ts`, `src/types/unifiedAction.ts`, or `src/data/social-scene-templates.ts` (all three are edited here).

**UL follow-up:** "Surface" and "Fragment" are used consistently here and in shipped code (`SurfaceKey`) but are not yet UL-declared — file a `UL-proposal` issue (Encounters shard) alongside pickup; not blocking.

**Files to touch:**
- Create: `src/engine/fragmentResolution.ts`, `src/engine/__tests__/fragmentResolution.test.ts`, `.claude/skills/template-context-rewrite/SKILL.md`
- Edit: `src/types/unifiedAction.ts` (additive `contextFragments?` + interface), `src/engine/proseEnrichment.ts` (`{frag:*}` + 2 optional context fields), `src/data/social-scene-templates.ts` (worked-example fragments), `scripts/encounter-volume-model.ts` (measured mode), `src/engine/content-eval/collectAuthoredProse.ts` (fragment sweep), `src/types/trace.ts` (`surface_fragments_bound`), DebugPanel encounter inspection (fragment-bindings row), `src/debug-bridge.ts` (`resolveSurfaceFragments`), `Docs/plans/wiring-checklist.md`, `Docs/plans/2026-04-16-systemic-wiring-guide.md`

## Notes for the executor

- **Do not build Tier 3** (procedural grammar) or per-run pool partitioning — explicitly later phases of the parent plan.
- **Do not retrofit more families** than `recruitment_pitch` in this ticket; Phase-2 scale-out gates on the KPI read (top-share ↓, pool depth ↑ via THR-457 harness) after this ships.
- The worked-example fragments above are **the content** — land them verbatim unless the scorer fails one (then fix minimally and note it).
- `NarrativeContext` gains optional fields only; do not thread new required parameters through context builders — absent context is the `'*'` path by design.
- The `social_scene.*` family flows through a converter into `UnifiedActionTemplate` — `contextFragments` must pass through the converter additively (check the converter honors unknown-to-it fields; the THR-711 tier fix touched the same converter, mind the mutex).
- Trace volume: one `surface_fragments_bound` per encounter instantiation, never per step or per tick per agent.
- Vision-audit follow-through: verify the surface-keyed novelty penalty actually suppresses same-surface re-fires in a 30-tick CLI run (same paragraph should not recur in quick succession for one agent) — if it does recur, that is a novelty-tuning observation to log, not a reason to add PRNG to fragment selection.

## Intent-judge verdict

**Allow** (2026-07-23, opus judge, cold-context; impact class Reversible confirmed). 11/11 dimensions PASS; 0 GAPs, 0 VIOLATIONs. Substrate-existence dimension repo-verified. Three non-blocking observations recorded: (1) the ticket's "(encounter-pipeline skill updates)" parenthetical is satisfied by the new `template-context-rewrite` skill with `encounter-pipeline` deliberately unchanged — noted for the executor; (2) UL-proposal flag now in the coordination block; (3) the worked example sits exactly at the ≥20 floor — all 9 fragments must land for the count to hold.

## Forked-audit verdicts

<!-- populated by design-audit-pipeline — /design-audit <plan-doc-path> -->

*(All three auditors spawned cold 2026-07-23 per design-audit-pipeline; opus; repo spot-checks against origin/main.)*

### NFP audit

**PASS.** Substrate claims spot-checked and confirmed (`SURFACE_KEY_AXES` at `encounterSurface.ts:30`; `TRACE_CATEGORIES` in `src/types/trace.ts`). Compliance table matches the design body — no material overstatements. Per-NFP: (1) Tunability PASS — six named constants, no magic numbers in resolution logic. (2) Inspectability PASS — full trace interface ties prose identity to `surfaceKey`; DebugPanel row + `__DEBUG` read. (3) Determinism PASS — pure lookup, explicitly PRNG-free, byte-identical Done-when; reserved named seed offset for the future path ("exemplary"). (4) Fail-soft PASS — six-row table, every branch degrades to `'*'` or today's render, never throws; warn-once-per-template respects ring-buffer discipline. (5) Narrative-over-mechanical PASS — scene-first, scorer-gated fragments. (6) Additive PASS — one optional field + one token family + one pure module; zero signature changes on the 278-importer file. (7) Performance PASS with honest note — O(≤4) lookups at render only. No discrepancies requiring revision.

### Three-pillar audit

**PASS.** Engine: concrete and executor-ready (named module, two function signatures, no-PRNG lookup chain, no-new-phase rationale). Content: worked example is real deliverable content — 9 verbatim fragments, 5×4=20 enumeration, three composed samples, inline register/5-question evaluation; scope boundary explicit. UI: prose-is-the-surface justified; DebugPanel row + headless `__DEBUG` assertion; HexMapV2 N/A with rationale; browser-verify tool correctly named (Playwright, DOM). Wiring: table complete across all five columns with reasoned none/n-a cells. Files-to-touch ↔ pillars consistency clean — no orphan specs in either direction; all ten spot-checked paths exist. "The plan is unusually complete — substrate inventory grep-backed, fail-soft table exhaustive, Blast Radius present."

### Vision audit

**PASS.** No rejected approach reintroduced (authored not runtime-LLM; UnifiedActionTemplate only; intel stays additive coloration per the closed THR-138 direction; no new nodes/edges; player-as-god untouched). All nine fragments individually clean against the voice rules — short declarative, one earned detail, zero exclamation, dry wit, baseline plainness; "all describe mortals acting; the god still only nudges." One non-blocking tension named and reconciled: the prose canon's "minimum 3–5 variants per key" rule vs v1's one-variant-per-axis-value — defensible because multiplication supplies library-level variety and surface-keyed novelty suppresses repeats, with `FRAGMENT_SEED_OFFSET` reserved for future multi-variant; executor should confirm novelty actually suppresses same-surface re-fires (note added to Notes for the executor). No Vision edit required.
