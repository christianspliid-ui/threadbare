> **title:** `Content model — one content-object registry, one closed tag vocabulary, one content query — THR-1481`
> **linear_issue:** THR-1481
> **author:** `Claude Code (design session)`
> **created:** 2026-09-12
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# Content model — one content-object registry, one closed tag vocabulary, one content query — THR-1481

*Any piece of content can hand out any other piece of content by one rule, and every authoring agent learns that rule from one catalog.*

## Why this is load-bearing

Christian's ask, verbatim (attended chat, 2026-09-12): *"an item attachment 'the sword of gilgul' tagged with #weapon, #sword, #magical, #entropy … an entropy themed encounter [can] give out random #weapon #entropy rewards from the content table … this pattern should be used across all content types so our agent skills for using them just works … ensure that it is well integrated in our existing agent harness."*

The assessment that preceded this plan measured the distance. The tag-filtered draw already ships for one content family: possessions, conditions, powers, companions and agreements carry `tags: string[]`, and `reward_draw` ([THR-1146](https://linear.app/threadbare/issue/THR-1146)) resolves a `#weapon #iron` prize with a tier curve from the outcome band, with a gate that fails a filter matching nothing using the runtime's own predicate. That is the right shape, and it stops at the edge of the attachment catalog. Everywhere else, content references content by **literal id**, and literal ids rot: 67 of 115 reveal families matched zero templates before [THR-844](https://linear.app/threadbare/issue/THR-844) aliased them; `encounter_seed.templateId`, `encounterFamily` prefixes, undertaking `catalystEncounterIds` (spelled `encounter_` where the corpus spells `encounter.`, so none can resolve) and step-level `rewardPool` recipes are all ungated today. The tag vocabulary that does exist is five dialects with no const, no union and no lint; encounters and undertakings carry no tags at all; and world objects have a registry while content types have none.

Without this, every new content type (the appointment primitive, [THR-1479](https://linear.app/threadbare/issue/THR-1479), is next) adds a sixth literal-id path and a sixth tag dialect, and every authoring skill teaches its own referencing rule. With it, the three pipelines share one sentence: *name what you want by kind and tags; the resolver finds it; the gate proves it resolves.* This is program-epic distinction 3 ([THR-1156](https://linear.app/threadbare/issue/THR-1156): the referenceable vocabulary is generated, never hand-written) applied to authored content instead of world objects.

**Standing preferences that bind this plan:** strangler, never big-bang (NFP #6); the `reward_draw` pattern is the template, not a new mechanism; gates run the runtime's own predicate so gate and engine cannot disagree; a capability is alive only when the authoring doc names it, the brief can roll it, a gate counts it, the live proof proves it, and the interface map tracks its readers ([THR-1479](https://linear.app/threadbare/issue/THR-1479)'s connectivity rule, [THR-1299](https://linear.app/threadbare/issue/THR-1299)'s lesson).

## Substrate inventory

No green field. Verified against the tree 2026-09-12 (assessment session, three exploration sweeps; file:line citations in the Linear issue body).

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Attachments, Items & Possessions — reward pool (`src/engine/rewardPool.ts`: `rewardCategoryNodeQuery`, `rewardCandidateMatchesTags`, `assembleRewardPool`, `drawSeededReward`) | 🟢 ACTIVE | **extends** — becomes the first consumer of the shared content-query resolver; the tag predicate moves *into* the resolver and the pool calls it; the seeded draw path is untouched |
| Encounters & Dilemmas — `reward_draw` effect + `validateRewardDrawPools` (`src/engine/nudgeGrantLiveness.ts`) | 🟢 ACTIVE | **extends** — the gate generalises to every `ContentQuery` literal in content, and gains the step-level `rewardPool` route it does not cover today |
| Encounters & Dilemmas — encounter seeding (`src/engine/encounterSeeding.ts`: `matchFamilyTemplate`, id-prefix family match, `FAMILY_SEED_MAX_CANDIDATES`) | 🟢 ACTIVE | **extends** — `encounter_seed` gains a `query` operand resolved by the shared resolver; the prefix form survives one release as an alias that the resolver rewrites |
| Ambitions & Undertakings — `catalystEncounterIds` on `StrategicActionTemplate` (write-set recorded, never resolved) | 🟠 DORMANT (unresolved ids) | **activates** — `catalystQuery?: ContentQuery` with the same resolver; the literal list is migrated and then gated |
| Ambitions & Undertakings — `conditionPool` / `pickConditionTemplate` (`src/data/undertaking-objects.ts`, `#blessing` / `#curse` tag scan) | 🟢 ACTIVE | **extends** — re-expressed as a `ContentQuery` over kind `condition_template`; identical candidates asserted by a shared-path test |
| World-object registry (`src/data/world-objects.ts`, `generate-world-objects`, `worldObjects.test.ts`) | 🟢 ACTIVE | **reuses the pattern** — the content-object registry is its sibling: same `K({...})` row shape, same one-PR rule, same generator + contract-test + drift-badge trio; the two `content`-status rows (`action_template`, `encounter_template`) gain a pointer at their content-kind row |
| Anchor catalog generator (`scripts/generate-anchor-catalog.ts`, `anchor-catalog-sources.ts`; injected into draft and critic prompts) | 🟢 ACTIVE | **reuses the pattern** — `content-tag-catalog.generated.md` is generated the same way (derived membership, curated description, member-without-description fails by name) and injected into the same prompts |
| Content census (`src/engine/contentCensus/`, `censusTag`, `npm run content-census`) | 🟠 DORMANT (metadata only) | **absorbs** — `censusTag.reach` is retired into the reach tag axis; `censusTag.scale` becomes the typed `scale?: ActionScale` field it always was; the census reads the registry instead of six hand-listed adapters |
| Tooltip resolver (`src/engine/tooltipResolver.ts`, 13 prefixes; Law 17) | 🟢 ACTIVE | **extends** — one new prefix `tag.*`, resolved from the vocabulary's authored descriptions, so every tag the player can see carries a tooltip from the one registry |
| Codex (`src/components/Codex/codexRegistry.ts`, overlay in `GameView.tsx`) | 🟢 ACTIVE | **extends** — a tag filter row on the possessions / conditions / agreements categories; the first player-facing reader of the vocabulary |
| Nudge deal tags (`DealContextTag`, 12 closed values: `might`, `finesse`, …; `src/engine/encounters/dealHand.ts`) | 🟢 ACTIVE | **leave-alone this wave** — a card-context vocabulary, not a content tag; it is not a spelling of `ReachDomain` (the eight words do not map onto the eight reaches) and unifying it is chartered by defect evidence, not pre-planned. Recorded as a known seam in the canon page |
| Converter allowlists (`toUnifiedTemplate` in `src/data/encounter-content.ts` and `src/data/faction-encounter-content.ts`) | 🟢 ACTIVE | **extends** — both gain the `tags` passthrough; a contract test asserts a tagged `EncounterEntry` survives conversion |

**Runtime population consumed** (seed 42, medium, tick 0 catalogs): 118 distinct `#`-tag literals across ~30 data files; 25 templates carry `#weapon`; 4 carry a sphere tag; 188 `encounter.`-prefixed templates and 683 unified templates in total; 7 agreement templates; companion registry; 8 undertaking kind rows and 60 live cells. The census numbers are inputs to the migration ratchet, not targets.

## Interface impact

| Contract | Action | Detail |
|---|---|---|
| `attachment-encounter-rewards` (🟢) | **preserve** | `assembleRewardPool` and the instantiators do not change shape; the candidate set is produced by the shared resolver and asserted identical by a shared-path test |
| `reward-draw-shares-one-seeded-draw-with-the-step-route` (🔵) | **extend** | the gate half now covers the step route (`ActionStepOutcomeMetadata.rewardPool`), closing the asymmetry the assessment found |
| `content-query-one-resolver-engine-and-gate` | **add** | producer: `src/engine/contentQuery.ts`; consumers: `rewardPool.ts`, `encounterSeeding.ts`, `undertaking-objects.ts` (condition pool), `nudgeGrantLiveness.ts` (gate); registered 🟢 on landing of slice 3 |
| `encounter-seed-resolves-by-query` | **add, LEAKED-with-ticket at filing** | producer: `encounter_seed.query` on the effect union; reader: `encounterSeeding.ts`; ticket: the slice-4 execution issue |
| `undertaking-catalyst-resolves-by-query` | **add, LEAKED-with-ticket at filing** | producer: `StrategicActionTemplate.catalystQuery`; reader: the catalyst seeding site in the undertaking checkpoint path; ticket: the slice-4 execution issue |
| `content-tag-vocabulary-closed` | **add** | producer: `src/data/content-tags.ts`; consumers: every catalog's contract test, `check:attachment`, `check:encounter`, `check:undertaking`, the tooltip resolver's `tag.*` prefix, the codex filter |
| `content-objects-registry` | **add** | producer: `src/data/content-objects.ts`; consumers: `generate-content-objects`, the contract test, the CLI `content` command, `window.__DEBUG.getContentObjects()`, the content census |

Systems-inventory keywords added for the Attachments and Encounters rows: `content object`, `content tag`, `content query`, `tag vocabulary`.

## Blast Radius

| File | Importer count | Cascade-risk note |
|---|---|---|
| `src/types/unifiedAction.ts` | 476 | Two **optional** additions only: `tags?: readonly ContentTag[]` on `UnifiedActionTemplate`, `query?: ContentQuery` on the `encounter_seed` member. No existing field changes shape; `check:typecheck` ratchet must report unchanged. |
| `src/types/traits.ts` | 335 | `TraitDefinitionProperties.tags` **keeps `string[]`** at the node-property level (saved worlds carry arbitrary strings; fail-soft). The closed vocabulary is enforced on the *catalog literals* by the contract test and the gates, not by narrowing this type. No change to the file in slices 1–3. |
| `src/types/attachments.ts` | high-fanout (below 100 in the live graph but named in every attachment plan) | `RewardPoolRecipe` is preserved verbatim and gains a documented projection onto `ContentQuery`; `PossessionNodeProperties.tags` stays `string[]` for the same reason as traits. |

The registry and vocabulary modules are new files with no importers; the resolver is a new engine module whose only wide edge is being *called by* `rewardPool.ts`.

## Engine pillar

### Systems design

Three additive pieces, each a sibling of something that already exists.

**1. The content-object registry — `src/data/content-objects.ts`.** The sibling of `world-objects.ts`. One row per authored content kind:

```ts
export type ContentObjectKindId =
  | 'encounter_template'    // UnifiedActionTemplate with actorAffinities incl. individual (the encounter corpus)
  | 'action_template'       // UnifiedActionTemplate played by the god / hex / location verbs
  | 'undertaking_template'  // StrategicActionTemplate (packs + factory) and the synthesised cells
  | 'item_template'         // PossessionNodeProperties catalog entries (reward_*, starter_*, anomaly_* possessions)
  | 'legendary_template'    // ArtifactTemplate
  | 'condition_template'    // trait definitions, subcategory condition | scar
  | 'power_template'        // trait definitions, subcategory bestowed | spell; SpellTemplate
  | 'agreement_template'    // AgreementRewardTemplate
  | 'companion_template'    // CompanionTemplate
  | 'ambition_template'     // AmbitionTemplate
  | 'omen_template'         // OmenTrackTemplate
  | 'nudge_card';           // NudgeCardMember (the god's repertoire)

export interface ContentObjectKind {
  readonly id: ContentObjectKindId;
  /** The word the game uses. Player-facing. */
  readonly gameWord: string;
  /** The UL entry (`Docs/ubiquitous-language/<shard>.md#<anchor>`). */
  readonly ulTerm: string;
  /** Id prefixes this kind owns. Every id in the corpus must start with one prefix claimed by exactly one row. */
  readonly idPrefixes: readonly string[];
  /** Module basename + exported symbol(s) that hold the catalog; the generator verifies each exists. */
  readonly catalog: { readonly module: string; readonly exports: readonly string[] };
  /** Tag axes an entry of this kind must carry (the gate fails an entry missing one). */
  readonly requiredAxes: readonly ContentTagAxis[];
  /** Typed fields that project onto a tag axis at index time (never double-authored). */
  readonly projections: Readonly<Partial<Record<ContentTagAxis, string>>>;
  /** The world-object kind an instance becomes when granted, or null for content that is never instantiated. */
  readonly instantiatesAs: WorldObjectKindId | null;
  /** The machine gate that validates this kind (`npm run <script>`), or null while none exists. */
  readonly gate: string | null;
  /** Filled by THR-1482: the card kind and the sheet a reference to this kind opens. */
  readonly surface: { readonly card: string | null; readonly sheet: string | null };
  readonly owningSystem: string;   // verbatim subsystems-registry name
  readonly status: 'live' | 'dormant' | 'legacy';
  readonly note: string;
}
```

Guards, mirroring the world-object trio: **contract test** (`src/data/__tests__/contentObjects.test.ts`) pins that every id prefix found in the catalogs is claimed by exactly one row, every `catalog.module` + export exists, every `owningSystem` is a verbatim subsystem name, every `instantiatesAs` is a registered world-object kind; **generator** (`scripts/generate-content-objects.ts` → `Docs/canon/content-objects.generated.md`, registered in `STATIC_ARTIFACT_SOURCES`, `--check` fails on drift) renders a census per kind (entries, tag coverage per axis, DEAD tags, ungated kinds) with badges; **write-time** — none (content is authored, not minted at runtime). The two `content`-status rows in `world-objects.ts` (`action_template`, `encounter_template`) gain a `contentKind` pointer so the two registries reference each other and the world-objects generator can fail on a content row that names no content kind.

**2. The closed tag vocabulary — `src/data/content-tags.ts`.**

```ts
export type ContentTagAxis = 'form' | 'reach' | 'sphere' | 'family' | 'polarity';

/** Every tag carries its `#`. The library has always written `'#weapon'`; `'weapon'` matches nothing (THR-1146). */
export type ContentTag = `#${string}`;

export interface ContentTagDef {
  readonly tag: ContentTag;
  readonly axis: ContentTagAxis;
  /** Plain-register, ≤ TOOLTIP_MAX_CHARS; becomes the `tag.<name>` tooltip. */
  readonly description: string;
  /** Kinds this tag may appear on; empty = any. */
  readonly kinds?: readonly ContentObjectKindId[];
}

export const CONTENT_TAGS: readonly ContentTagDef[] = [ /* authored */ ];
```

- **Derived axes:** `reach` tags are generated from `REACH_DOMAINS` (`#iron` … `#star`) and `sphere` tags from `SPHERE_NAMES` (`#chaos` … `#entropy`) — the vocabulary imports the unions rather than restating them, so a ninth reach or a thirteenth sphere appears here the day it is added. `polarity` is `#positive` | `#negative` (already the one predicate `conditionProxyEvents` classifies on).
- **Authored axes:** `form` (what the thing *is*: `#weapon` `#sword` `#armor` `#tome` `#mount` `#tool` `#provision` `#scroll` `#talisman` …) and `family` (what class of story-object: `#relic` `#trinket` `#artifact` `#blessing` `#curse` `#wound` `#disease` `#consumable` `#anomaly` `#sequel` …). The executor seeds these from the 118-value census under the classification rule below; extending either axis afterwards is a design-session decision recorded on the canon page, exactly as the encounter catalogs are governed.
- **Classification rule for the migration (executor applies, records the table in the closing comment):** a live tag survives when it has ≥1 runtime reader **or** ≥ `CONTENT_TAG_MIN_BEARERS` bearers across catalogs; a bare tag (`legendary`, `road`) is rewritten with its `#`; a tag naming a reach or sphere under another spelling is rewritten onto the derived axis; everything else is retired (removed from the entry) and listed in the closing comment. Unknown tags remaining after the sweep go into `CONTENT_TAG_RETROFIT_PENDING` (`src/data/content-eval/contentTagRetrofitPending.ts`) — named once, shrinking only, with the `undertakingContract.test.ts` shape: the test fails both a listed entry that now passes and an unlisted one that fails. **When the ratchet reaches zero the catalog-entry types tighten** (`ArtifactTemplate.tags`, `CompanionTemplate.tags`, `AgreementRewardTemplate.tags`, `UnifiedActionTemplate.tags` → `readonly ContentTag[]`); node-property bags stay `string[]`.
- **Projection rule (no double-authoring, NFP #6):** where a typed field exists, the tag axis is *projected* from it at index time and never authored: an encounter's `reach: 'iron'` yields `#iron`, its `sphereAffinity: 'entropy'` yields `#entropy`; an item's `sphereAffinity` (retyped from `string` to `SphereName`) yields its sphere tag. `effectiveTags(entry) = authored ∪ projected`. The contract test fails an authored tag that contradicts its projection (an item that authors `#gold` while its typed reach says iron). Items have no typed reach field, so their reach tags stay authored — the census adapter's `dominantReachFromEffects` derivation is retired rather than persisted, resolving [THR-477](https://linear.app/threadbare/issue/THR-477)'s open derive-vs-persist question in favour of *authored on the tag axis*.
- **Generated catalog:** `scripts/generate-content-tag-catalog.ts` → `.claude/skills/encounter-pipeline/reference/content-tag-catalog.generated.md` (and symlinked by reference from the undertaking and attachment skills): one table per axis, each tag with its description and a bearer count per content kind; a tag with zero bearers is badged **DEAD** and the weekly retro deletes it (the sunset rule). Registered in `STATIC_ARTIFACT_SOURCES`; `--check` runs under `check:generated-freshness`.

**3. The content query — `src/types/contentQuery.ts` + `src/engine/contentQuery.ts`.**

```ts
export interface ContentQuery {
  /** One kind or several; the resolver unions them. */
  readonly kind: ContentObjectKindId | readonly ContentObjectKindId[];
  /** Every tag must be present (the reward-pool ALL-of rule, unchanged). */
  readonly tags?: readonly ContentTag[];
  /** At least one of these must be present. */
  readonly anyTags?: readonly ContentTag[];
  /** Inclusive rarity window; absent = any. */
  readonly tier?: RarityTier | { readonly min?: RarityTier; readonly max?: RarityTier };
  /** Ids never returned (the running encounter's own template, a template already granted). */
  readonly exclude?: readonly string[];
}

export interface ContentQueryHit { readonly kind: ContentObjectKindId; readonly id: string; readonly tier: RarityTier | null; }

/** Pure. Deterministic order (kind order as registered, then id ascending). No PRNG. */
export function resolveContentQuery(query: ContentQuery, catalogs: ContentCatalogs): readonly ContentQueryHit[];

/** One seeded pick over a resolved set. The only PRNG call in the module. */
export function drawFromContentQuery(query: ContentQuery, catalogs: ContentCatalogs, rng: () => number): ContentQueryHit | undefined;
```

`ContentCatalogs` is the registry's catalogs materialised once per session (the `SimulationRuntime`-owned cache pattern; never module scope). `RewardPoolRecipe` is preserved and gains `toContentQuery(recipe, category)`: `categoryWeights` picks the category, `tagFilters` → `tags`, `sphereTint` → a sphere tag in `anyTags`; `rewardCategoryNodeQuery` + `rewardCandidateMatchesTags` become thin calls into the resolver, and a shared-path test asserts the candidate set for every shipped recipe is byte-identical before and after. `matchFamilyTemplate` in `encounterSeeding.ts` becomes `resolveContentQuery({ kind: 'encounter_template', tags: [...] })` with `FAMILY_SEED_MAX_CANDIDATES` retained as `CONTENT_QUERY_MAX_CANDIDATES`; the `encounterFamily` prefix form is rewritten by an alias table (`ENCOUNTER_FAMILY_TAGS`, one release) to the family tag the prefix's templates now carry.

### Graph nodes / edges

None added. Content stays where it is (catalog literals; templates that live in the graph keep their `action_template` / `encounter_template` node types). `PossessionNodeProperties.tags` and `TraitDefinitionProperties.tags` keep their shape.

### Tick phases

None added. The resolver runs inside the phases that already draw content: aftermath reaction application (`reward_draw`, `encounter_seed`), step resolution (`rewardPool`), phase `2a.8` seed evaluation, undertaking checkpoint catalyst seeding, and `create × Condition` completion. Cost is bounded by `CONTENT_QUERY_MAX_CANDIDATES` and the per-session catalog index.

### Resolution logic

Filter, sort, first-or-draw. Kind filter → tag ALL-of → tag ANY-of → tier window → exclude → sort by (registry kind order, id). `drawFromContentQuery` takes one `rng()` over the sorted set. An empty set returns `undefined` and is the caller's fail-soft case (table below).

### PRNG callouts

Exactly one: `drawFromContentQuery`'s pick, keyed by the caller's seeded stream (`drawSeededReward` keys on seed, tick, actor, template today and keeps that key). `resolveContentQuery` takes no PRNG. Gates call the resolver, never the draw.

## Content pillar

### Encounter templates

- `UnifiedActionTemplate` gains `tags?: readonly ContentTag[]` (authored `form` / `family` only; `reach` and `sphere` are projected). Both `toUnifiedTemplate` converters pass it through; `EncounterEntry` and `FactionEntry` gain the field.
- `encounter_seed` gains `query?: ContentQuery`. The Seeded Sequel shape in `Docs/canon/encounter-catalogs.md` §1 gains the query form: *a parent plants a follow-up by kind and tags when the sequel is one of a family rather than one authored template*. `templateId` stays the literal form and **both** forms are gated: a literal must resolve to a live template, a query to ≥1 hit.
- Migration of `encounterFamily` users (the eleven two-letter faction families, `ac.quest` and siblings): each family's templates receive a `family` tag (`#ac_quest` is not a tag; the executor names one per family from the game word, e.g. `#circle_errand`), and the alias table maps the prefix to it for one release.
- One live exemplar per query site, on the exemplar templates the pipeline already cites: `mc.quest.collect_bounty` (reward), the Full Moon pair in `vertical-slice.ts` (seed by query, in the placeless form THR-1476 leaves), one undertaking pack template (catalyst by query).

### Prose tables

None. Tags never reach prose; the `tag.*` tooltip copy is UI microcopy authored in the vocabulary (plain register, ≤200 characters, Law 18 validation applies).

### Attachment content

- The five dialects migrate onto the vocabulary under the classification rule. `artifact-templates.ts` and `companion-templates.ts` gain the `#`. `agreement-reward-catalog.ts` `tier: number` becomes `RarityTier`. `anomaly-reward-catalog.ts` header stops claiming tag-matched sharing until a `ContentQuery` consumer exists (or the executor wires one, in which case the header is true).
- `sphereAffinity` on `PossessionNodeProperties` and `SpellTemplate` retypes from `string` to `SphereName` (the free-string values in the corpus are already sphere names; a non-member fails typecheck and is corrected).
- The attachment pipeline gains its first machine gate: `npm run check:attachment -- <id> | --all` (`scripts/check-attachment.ts` over `src/data/content-eval/attachmentContract.ts`): every tag in the vocabulary, every required axis present, `sphereAffinity` a `SphereName`, tier in range, `censusTag` absent (retired). Ratchet as above.

### Data tables

- `src/data/content-objects.ts` (registry), `src/data/content-tags.ts` (vocabulary), `src/data/content-eval/contentTagRetrofitPending.ts` (ratchet), `ENCOUNTER_FAMILY_TAGS` alias table (one release, in `encounterSeeding.ts`).
- `censusTag` fields deleted from the six entry types once the vocabulary lands (slice 2) — and from `ConditionalSublocationSpec` in `src/engine/phaseSublocations.ts`, the seventh carrier, which is world-side and simply loses the field; `ContentCensusTag` type retired; the census adapters read the registry.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces) at 1920×1080.*

### Player-facing display

- **Codex tag filter (Laws 1, 9, 17, 21):** the possessions, conditions, agreements and undertakings categories gain a filter row of tag chips grouped by axis (form · sphere · reach · family); selecting one filters the entry list. Chips render through `CardKeywordChip`'s vocabulary pattern (one icon vocabulary per axis: sphere chips use `SphereIcon`, reach chips the reach glyph set, form/family chips a glyph keyed on the axis) and carry the `tag.<name>` tooltip. This is the first surface where the player meets the vocabulary, so it is where the rule "a tag is a game word" is tested.
- **Attachment sheet tags (Laws 1, 16, 17):** `AttachmentDetailView` shows the entry's effective tags as chips with tooltips in place of the raw `tags` line it renders today. No numerals; no raw keys (Law 14).
- **Design Reference Wiki:** `public/content-objects-reference.html`, registered in `public/wiki-manifest.json`, rendered by the generator — the served twin of `content-objects.generated.md`, the way World Objects is served.

### Event notifications

None. Content resolution is silent by design; an empty query surfaces to the *author* through the gate and to the *developer* through the trace, never to the player.

### Debug inspection (DebugPanel)

- `window.__DEBUG.getContentObjects()` — every content kind with its catalog size and tag coverage (the `objects` mirror).
- `window.__DEBUG.queryContent(query)` — runs `resolveContentQuery` against the live session's catalogs and returns the hits; the one-line answer to "would this filter match anything?".
- CLI: `content [kind]` (sibling of `objects`) and `query <json>`.

### Visual presence (HexMapV2)

N/A — content templates have no map presence; instances they mint already render through their world-object kind.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `src/data/content-objects.ts` | — (data) | Codex filter (kinds), wiki page | — | — | CLI `content`, `__DEBUG.getContentObjects` |
| `src/data/content-tags.ts` | — (data) | Codex filter, attachment sheet chips, `tag.*` tooltips | — | — | catalog `.generated.md` |
| `src/engine/contentQuery.ts` | called from aftermath, step resolution, `2a.8` seeding, undertaking checkpoints, `create × Condition` | — | `SimulationRuntime.contentCatalogs` (session cache) | `content.query_resolved`, `content.query_empty` | `__DEBUG.queryContent`, CLI `query` |
| `src/engine/rewardPool.ts` (extended) | unchanged | unchanged | unchanged | `aftermath_reward_draw`, `aftermath_reward_draw_empty` (unchanged) | unchanged |
| `src/engine/encounterSeeding.ts` (extended) | `2a.8` | — | `encounterSeeds[]` (query stored on the seed) | existing seed traces + `content.query_*` | `__DEBUG.getSeeds()` |
| `src/data/content-eval/attachmentContract.ts` + `scripts/check-attachment.ts` | — (gate) | — | — | — | `npm run check:attachment` |
| `scripts/generate-content-objects.ts`, `scripts/generate-content-tag-catalog.ts` | — (build) | wiki page | — | — | `check:generated-freshness` |

**Harness wiring (the part Christian asked for by name) — each is a Done-when of the slice that makes it true:**

| Hook | What changes | Why it binds |
|---|---|---|
| Systemic wiring guide (`Docs/plans/2026-04-16-systemic-wiring-guide.md`) | **Capability 29: Content tags and the content query** — the query shape, the four sites it works at (reward, seed, catalyst, condition pool), the projection rule, and a worked example: *an entropy-themed encounter whose crit ending draws `{ kind: 'item_template', tags: ['#weapon', '#entropy'] }`* | The guide is the IKEA manual; a capability not in it is not used |
| Canon (`Docs/canon/content-objects.md`, new; README index row; CLAUDE.md canon table row) | Step 0 for any content authoring: the registry, the vocabulary, the query rule, the known seams (deal tags), the rejected approaches (free-string tags, id-prefix families, per-kind gates) | Canon pages are the agent's single ≤200-line entrypoint |
| UL (`Docs/ubiquitous-language/Encounters.md`) | Terms **Content Object**, **Content Tag**, **Content Query** seated beside the existing `### EncounterTemplate` / `### UnifiedActionTemplate` headings; code words as aliases | UL wins on terminology; the registry's `ulTerm` must resolve |
| Encounter pipeline (`SKILL.md`, `reference/nudge-authoring-spec.md`, `agents/draft-prompt.md`, `agents/systems-prompt.md`) | the tag catalog injected into draft **and** critic prompts beside the anchor catalog; spec § Consequences names the query form for prizes and seeds; **systems-prompt "Live primitives" list gains `ContentQuery`** | Otherwise the systems agent flags every query as a missing primitive and BLOCKs the draft — the silent-kill trap |
| Undertaking pipeline (`SKILL.md`, `reference/undertaking-package-format.md`) | `catalystQuery` in the package format; auto-REVISE trigger: a catalyst list naming ids that do not resolve | "Copy the encounter line" — the rule is stated where it differs |
| Attachment pipeline (`SKILL.md`, `agents/*`) | Pass 3 (systems audit) runs `check:attachment`; the tag catalog is the authoring reference for tags; the four-pass pipeline gains a gate for the first time | An attachment that ships with a tag outside the vocabulary is unreachable by every query |
| Brief dice (`reference/batch-brief-format.md`, `check-authoring-brief.ts`) | Decision-shape die B gains face `query_prize` (an ending must hand out a prize **by query, not by id**) with a floor of one per batch of six; the batch report prints the count | "Rolls propose, design disposes" — the roll forces the reach |
| Composition gates (`src/data/content-eval/compositionContract.ts`) | `content_query` joins the systems-quota connection keys; `validateContentQueries` runs the runtime resolver over every query literal in a template (reactions, bands, steps, seeds) and is **fatal on an empty set**; the ratchet grandfathers the legacy corpus | Green is a precondition for a PR existing |
| Live proof (`scripts/encounter-live-proof.ts`, `undertaking-live-proof.ts`) | Claims `content_query_resolved` (a query site actually produced a hit in the run) and `catalyst_seeded` | Declared blocks must *arrive* |
| Interface map (`scripts/interface-contracts.ts`) | The four `add` rows above, two registered LEAKED-with-ticket at filing | The generator fails the build on LEAKED-without-ticket |
| Usage census | `encounter-batch-report` and `undertaking-batch-report` print queries authored per batch; weekly hygiene prints DEAD tags and query sites with zero hits over a seeded 200-tick run | Presence in the corpus is measured, never assumed |
| Appointments ([THR-1479](https://linear.app/threadbare/issue/THR-1479)) | Its plan names kept/missed sequels as `ContentQuery` or gated literal, never an ungated id | The first new consumer proves the model rather than adding a sixth literal-id path |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `CONTENT_QUERY_MAX_CANDIDATES` | 64 | Cap on the resolved set before a draw (inherits `FAMILY_SEED_MAX_CANDIDATES`'s role); above it the sorted head is kept and a `content.query_truncated` trace fires |
| `CONTENT_TAG_MIN_BEARERS` | 3 | Migration rule: a tag with fewer bearers and no runtime reader is retired rather than seated |
| `CONTENT_TAG_DEAD_BEARERS` | 0 | Generated-catalog badge threshold: a tag with this many bearers is DEAD and the retro deletes it |
| `TOOLTIP_MAX_CHARS` (existing) | 200 | Tag descriptions are validated by the existing tooltip test |
| `CONTENT_TAG_RETROFIT_PENDING` | named list | Shrinking ratchet of entries that predate the vocabulary; the type tightens when it is empty |
| `ENCOUNTER_FAMILY_TAGS` | alias table | One-release map from `encounterFamily` prefixes to family tags |

## Tracing

```ts
// content.query_resolved — emitted when a query site resolves a non-empty set
interface ContentQueryResolvedTrace {
  type: 'content.query_resolved';
  site: 'reward_draw' | 'step_reward_pool' | 'encounter_seed' | 'undertaking_catalyst' | 'condition_pool' | 'debug';
  query: ContentQuery;
  candidateCount: number;
  truncated: boolean;
  pickedId?: string;          // present when the site drew
  actorId?: string;
  templateId?: string;        // the encounter/undertaking that carried the query
}

// content.query_empty — emitted when a query site resolves nothing; the site fail-softs
interface ContentQueryEmptyTrace {
  type: 'content.query_empty';
  site: ContentQueryResolvedTrace['site'];
  query: ContentQuery;
  actorId?: string;
  templateId?: string;
}
```

Both register in the trace category table (four registration sites — the memory note applies) under a new `content` category; `aftermath_reward_draw*` keep their names.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| Query resolves to nothing at runtime (a saved world whose catalog differs from the authoring one) | `content.query_empty` trace; the effect is skipped; sibling effects apply; a `reward_draw` keeps emitting `aftermath_reward_draw_empty` |
| A seed carrying a query resolves to nothing at fire time | the existing "withered" narrative event path (`resolvedTemplateId: 'query:<kind>'`) — the same shape family seeds fail into today |
| A saved world carries a tag outside the vocabulary on a node | ignored by the resolver, warned once per `(kind, tag)` per session, never a throw |
| Registry row names a catalog export that does not exist | build-time failure in the generator and contract test; never reaches the tick loop |
| A tag description exceeds the tooltip limit | existing `tooltipValidation.test.ts` fails the build |
| `encounterFamily` prefix with no alias row | falls through to the current prefix match for one release, `content.query_resolved` with `site: 'encounter_seed'` and `query: { kind, anyTags: [] }`; the gate fails the authoring-time case |
| Catalog cache absent on a `SimulationRuntime` | built lazily on first query; a build failure returns the empty set and traces `content.query_empty` |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It serves the standing premise that creativity lives in the combination, never in inventing structure per encounter (`Docs/canon/encounter-catalogs.md` preamble, Christian 2026-07-31): a closed tag vocabulary is one more short list the AI structures better from.
- [x] No Vision edit required.

## Rulebook impact

- [x] This plan does not change a rule of play. What an encounter may hand out is unchanged; only how an author names it changes.
- [x] No `Docs/canon/rulebook.md` update is owed; the encounter-catalogs page (Seeded Sequel shape, Stakes surfaces) is updated by slice 4 as an authoring catalog, not a rule.

> Brainstorm companion: `Docs/plans/2026-09-12-thr-1481-content-model-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | six named constants; the vocabulary itself is data, extended by design-session decision |
| 2. Inspectability | PASS | two traces per query site; `__DEBUG.queryContent`; CLI `query`; generated census with DEAD badges |
| 3. Determinism | PASS | resolver is pure and sorted; one seeded draw keyed as today; gates never draw |
| 4. Fail-soft | PASS | table above; empty sets skip, unknown tags warn once, build failures never reach the tick loop |
| 5. Narrative over mechanical perfection | PASS with note | a query trades one authored prize for a family of fitting ones; the pipeline's brief die keeps authored specifics reachable (`templateId` stays legal and gated) |
| 6. Additive over destructive | PASS with note | every field is optional-additive; `RewardPoolRecipe` preserved; `censusTag` is the one deletion, retired because it is metadata nothing reads — and node-property `tags` deliberately keep `string[]` |
| 7. Performance budget | PASS | catalog index built once per session; resolved sets capped; no per-tick scans beyond the sites that already scan |

## Kill criteria

How we know this plan was wrong, and what happens then:

- **The resolver cannot reproduce the reward pool.** If after slices 1–3 the shared-path test cannot be made byte-identical for every shipped `RewardPoolRecipe`, the resolver is wrong: the recipe path stays as is, slice 3 closes with the resolver as a gate-only predicate, and slice 4 does not start until the divergence is explained.
- **The axes are too narrow.** If the migration classification retires more than half of the 118 live tags, or any retired tag turns out to have had a runtime reader that now matches nothing, the `form`/`family` seed set is reopened with Christian before any catalog-entry type tightens.
- **The capability is dead.** If two encounter batches after slice 5 author zero queries (the usage census in the batch report), the retro names it "dead primitive" under THR-1479's own rule and the brief die floor is raised or the query shape is revisited.

## Done when

Execution is sliced (§ Coordination block). The design ticket is done when all five slices are merged and:

- [ ] `npm run generate-content-objects:check`, `generate-content-tag-catalog:check` pass under `check:generated-freshness`; `Docs/canon/content-objects.generated.md` and the tag catalog are committed
- [ ] `contentObjects.test.ts` pins prefix ↔ row totality; `contentTags.test.ts` pins: every catalog tag is in the vocabulary or in the ratchet; projections do not contradict authored tags; every tag description passes tooltip validation
- [ ] shared-path test: every shipped `RewardPoolRecipe` resolves byte-identical candidate sets through the resolver and through the pre-change predicate (falsified both ways)
- [ ] `check:encounter --all` fatal on an empty query in reactions, bands, steps **and seeds**; `check:undertaking --all` fatal on an unresolvable catalyst; `check:attachment --all` green outside the ratchet
- [ ] one live exemplar per query site, proven by `check:encounter-live` claim `content_query_resolved` and `check:undertaking-live` claim `catalyst_seeded`
- [ ] every row of the harness table above landed and cited by path in the closing comment
- [ ] codex tag filter and attachment-sheet tag chips browser-verified at 1920×1080 with the four-part evidence (Laws 1, 9, 13/14, 16, 17, 21, 33, 37)
- [ ] `npm test`, `npm run test:heavy`, `npm run check:typecheck` (ratchet unchanged), `npx vite build` pass; 30-tick CLI engine smoke
- [ ] closing commits carry `Fixes THR-<slice>` per slice; this design ticket closes with the last slice

## Coordination block

**Suggested model:** opus — cross-cutting type and gate work across three pipelines; judgment-heavy tag classification.

**Parallel-safe with:** THR-1482 slice 1 (router + world-ref cards; disjoint files) — **except** the registry's `surface` column, which THR-1482 slice 2 fills after THR-1481 slice 1 lands.

**Mutex with:** anything editing `src/engine/rewardPool.ts`, `src/engine/encounterSeeding.ts`, `src/types/unifiedAction.ts`'s effect union, `src/data/world-objects.ts`, or the three pipeline `SKILL.md`s while a slice is In Dev (both edit the same files). THR-1479 (appointments) is **blocked by slice 3** for its stakes shape and should not start execution before it.

**Slices (each filed as a child execution ticket with its own coordination block):**

1. **Registry + generator + canon + UL + CLI `content`** — `content-objects.ts`, `generate-content-objects.ts`, contract test, `Docs/canon/content-objects.md`, UL terms, README/CLAUDE.md rows, wiki page, `world-objects.ts` `contentKind` pointers, `__DEBUG.getContentObjects`. No behaviour change.
2. **Vocabulary + migration + attachment gate + player surfaces** — `content-tags.ts`, tag catalog generator, `tag.*` tooltip prefix, five-dialect migration under the ratchet, `sphereAffinity` retype, `censusTag` retirement, `check:attachment`, codex tag filter, attachment-sheet chips, attachment-pipeline skill edits. Blocked by 1.
3. **Content query + shared resolver** — `contentQuery.ts` (types + engine), `rewardPool.ts` onto the resolver with the shared-path test, step-route gate, `conditionPool` onto the resolver, traces, `__DEBUG.queryContent`, CLI `query`, interface-map rows, wiring-guide Capability 29. Blocked by 2.
4. **Encounters and undertakings on the query** — `UnifiedActionTemplate.tags` + converters + projection, `encounter_seed.query` + alias table + gate, `catalystQuery` + reader + gate, exemplars, encounter/undertaking skill + spec + systems-prompt edits. Blocked by 3.
5. **Harness closing sweep** — brief die face, composition quota key, live-proof claims, batch-report census, weekly-hygiene DEAD-tag report, interface-map rows flipped from LEAKED, THR-1479 plan cross-check. Blocked by 4.

**Files to touch:** (union across slices)
- Create: `src/data/content-objects.ts`, `src/data/content-tags.ts`, `src/types/contentQuery.ts`, `src/engine/contentQuery.ts`, `src/data/content-eval/attachmentContract.ts`, `src/data/content-eval/contentTagRetrofitPending.ts`, `scripts/generate-content-objects.ts`, `scripts/generate-content-tag-catalog.ts`, `scripts/check-attachment.ts`, `Docs/canon/content-objects.md`, `Docs/canon/content-objects.generated.md`, `.claude/skills/encounter-pipeline/reference/content-tag-catalog.generated.md`, `public/content-objects-reference.html`, tests beside each
- Edit: `src/data/world-objects.ts` (contentKind pointers), `src/types/unifiedAction.ts` (two optional fields), `src/types/attachments.ts` (`sphereAffinity: SphereName`, recipe projection doc), `src/types/effects.ts` (`SpellTemplate.sphereAffinity`), `src/types/strategicAction.ts` (`catalystQuery`), `src/engine/rewardPool.ts`, `src/engine/encounterSeeding.ts`, `src/engine/nudgeGrantLiveness.ts`, `src/engine/tooltipResolver.ts`, `src/engine/contentCensus/*`, `src/data/undertaking-objects.ts` (condition pool), `src/data/encounter-content.ts` + `src/data/faction-encounter-content.ts` (converters), the five tag-bearing catalogs, `src/components/Codex/*` (filter), `src/components/Game/AttachmentDetailView.tsx`, `src/debug-bridge.ts` + `.d.ts`, `scripts/cli.ts`, `scripts/interface-contracts.ts`, `scripts/generated-artifact-sources.ts`, `scripts/subsystems-registry.ts` (keywords), `src/data/content-eval/compositionContract.ts`, `scripts/encounter-live-proof.ts`, `scripts/undertaking-live-proof.ts`, `scripts/check-authoring-brief.ts`, `public/wiki-manifest.json`, `Docs/plans/2026-04-16-systemic-wiring-guide.md`, `Docs/canon/README.md`, `Docs/canon/encounters.md`, `Docs/canon/attachments.md`, `Docs/canon/undertakings.md`, `Docs/canon/encounter-catalogs.md`, `Docs/ubiquitous-language/Encounters.md`, `CLAUDE.md` (canon table row), the three pipeline skills and their agent prompts / reference files

## Notes for the executor

- **Do not narrow the node-property `tags` types.** Saved worlds carry arbitrary strings. The vocabulary is enforced on catalog literals by the contract test and the gates; the *catalog entry* types tighten only when the ratchet is empty.
- **Do not reimplement the predicate in a gate.** Every gate calls `resolveContentQuery`. The shared-path test is the proof that the reward pool did not drift; write it before moving `rewardPool.ts` onto the resolver, and falsify it by perturbing one tag.
- **Projection beats authoring.** Where a typed field exists (`reach`, `sphereAffinity`), never author the tag; the contract test fails a contradiction. Items keep authored reach tags because no typed reach exists on them — do not invent one.
- **The deal-tag vocabulary is out of scope.** `might`/`finesse`/… are card-context words, not reach spellings; leave `DealContextTag` alone and record the seam on the canon page.
- **Encounters: the four-edit trap.** A `tags` field survives only if `UnifiedActionTemplate`, `EncounterEntry`, and *both* `toUnifiedTemplate` converters carry it. The contract test that a tagged entry survives conversion is the Done-when, not the type.
- **Harness edits ride the slice that makes them true**, never a trailing "docs" slice. Slice 5 is the closing sweep for the dice, quota, live proof and census — the guide, spec, prompts and canon land with slices 3 and 4.
- **Family tags are game words.** When migrating `encounterFamily` prefixes, name the family the way the codex would say it, not the way the id spells it.
- **THR-477's open question is closed here**: reach on effect-derivable content is *authored on the tag axis*, not derived and not persisted from the derivation. Delete the derivation.

## Intent-judge verdict

*2026-09-12 — cold-context judge (fable), proposal `Docs/plans/.intent-proposals/thr-1481-content-model.md`.*

**Verdict: Allow.** Impact class corrected upward from Reversible to **External** (the plan edits three pipeline skills, agent prompts, the brief die, a fatal composition gate and the live-proof scripts — all change other agents' behaviour). Scores: PASS on dimensions 1–9 and 11; one GAP on dimension 10 (kill criteria lived only in the proposal) — resolved by the `## Kill criteria` section above. Advisories applied in the same pass: UL seating anchored beside `### EncounterTemplate` / `### UnifiedActionTemplate`; `phaseSublocations.ts` named as the seventh `censusTag` carrier.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-12*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Constants table names 6 tunables (`CONTENT_QUERY_MAX_CANDIDATES`, `CONTENT_TAG_MIN_BEARERS`, `CONTENT_TAG_DEAD_BEARERS`, `CONTENT_TAG_RETROFIT_PENDING`, `ENCOUNTER_FAMILY_TAGS`, reuses `TOOLTIP_MAX_CHARS`); vocabulary itself is data extended by design decision, not code |
| 2. Inspectability | PASS | Wiring table matches checklist's own Module/Phase/UI/GameState/Trace/Debug columns; two new traces (`content.query_resolved`, `content.query_empty`); `__DEBUG.getContentObjects`/`queryContent`; CLI `content`/`query`; generated census with DEAD badges |
| 3. Determinism | PASS | "`resolveContentQuery` ... Pure ... Deterministic order ... No PRNG"; exactly one seeded draw (`drawFromContentQuery`), keyed identically to today's `drawSeededReward`; "Gates call the resolver, never the draw" |
| 4. Fail-soft | PASS | Explicit 7-row fail-soft table covers empty query, seed-resolves-nothing, unvocabularied saved-world tag (warn-once, never throw), missing catalog export (build-time only), tooltip overflow, missing family alias, absent cache (lazy rebuild) |
| 5. Narrative over mechanical | PASS-with-note | Query trades one authored prize for a matching family; brief-die floor keeps authored `templateId` legal and gated so specificity stays reachable — a real trade-off, honestly flagged rather than hidden |
| 6. Additive over destructive | PASS-with-note | All new fields optional; `RewardPoolRecipe` preserved verbatim; node-property `tags` deliberately kept `string[]` (no narrowing); sole deletion is `censusTag`, justified as "metadata nothing reads" |
| 7. Performance budget | PASS | Catalog materialized once per `SimulationRuntime` session (not module scope, per Load-Bearing rule); resolved sets capped at `CONTENT_QUERY_MAX_CANDIDATES`; "no per-tick scans beyond the sites that already scan" |

NFP AUDIT: PASS-with-notes (see rows 5, 6 above)

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Full systems design (registry, vocabulary, resolver), graph/tick-phase/resolution/PRNG subsections all filled with concrete module paths and signatures |
| Content | present-and-substantive | Encounter templates, prose (N/A rationale given), attachment content, and data tables all addressed with specific file/field changes |
| UI | present-and-substantive | Player-facing display, event notifications (N/A rationale), debug inspection, and visual presence (N/A rationale) all filled; screenshot tool stated (Playwright) |

**Missing-required-sections:** No missing required sections. Blast Radius present (required — three files ≥100 importers cited). Constants table, Tracing, Fail-soft table, Three-pillar check, Vision audit, Rulebook impact, NFP-compliance table, Coordination block, Notes for executor, Forked-audit verdicts placeholder — all present and non-token-empty.

**Wiring check:** Yes — the Wiring table maps each module (`content-objects.ts`, `content-tags.ts`, `contentQuery.ts`, `rewardPool.ts`, `encounterSeeding.ts`, gate/generator scripts) to orchestrator phase, UI component, GameState field, trace, and debug visibility, plus a second harness-wiring table connecting to skills/canon/pipelines/gates.

**Substrate-existence check:** Present and substantive. `## Substrate inventory` opens the doc (before Engine pillar) with a table naming subsystems by their systems-inventory names, cross-checked directly against `Docs/canon/systems-inventory.md` — confirmed exact matches for "Encounters & Dilemmas," "Ambitions & Undertakings," and "Attachments, Items & Possessions" rows, both 🟢 ACTIVE. Every listed subsystem is disposed as extends/activates/reuses-the-pattern, never rebuilt; the one 🟠 DORMANT row (`catalystEncounterIds`) is correctly flagged for activation, not reconstruction. No green-field duplication detected — no proposed module matches an inventory name without acknowledgment.

**PILLAR AUDIT: PASS**

### Vision audit

**1. Vision premises touched**
- `00-north-star.md` → not referenced
- `01-core-loop.md` → not referenced
- `02-non-negotiables.md` → "Additive over destructive changes" (#6) — [confirmed]; "The three pillars are always present" (#7) — [confirmed]; "Everything is a graph node/edge" (#4) — [confirmed, by omission — tags stay catalog/property data, never encoded as a relationship edge]; "All mechanics surface through prose, never numbers" (#3) — [confirmed — UI section bars numerals/raw keys]
- `03-design-tensions.md` → "Systemic emergence vs. authored moments" (#2) — [extended — the query mechanism trades one authored id for a resolved family, mitigated by the brief-die floor keeping literal `templateId` legal]
- `taste-profile.md` → "Encounter-specific intervention verbs" (open-ended, data-driven card library) — [confirmed, consonant with a closed-but-generated tag vocabulary]; "Meeting-encounter prose is the quality bar" — [confirmed — `tag.*` tooltip copy held to plain register, ≤200 chars, Law 18]

**2. Vision contradictions**
No contradictions found.

**3. Five qualitative checks**
- North star: Neutral — infrastructure with no direct bearing on the sovereignty-consequence moment; doesn't hinder it.
- Core loop: Clear — no change to scan → encounter → aftermath; resolver runs inside existing phases.
- Non-negotiables: Clear — graph substrate untouched (node-property `tags` deliberately not narrowed into relationship fields), numbers stay out of player view, changes are additive, three pillars present.
- Design tensions: Note — leans toward systemic/generated reward selection, but the plan explicitly preserves authored-specific capability (brief-die floor, `templateId` gated-legal), so the counter-pull survives.
- Taste profile: Clear — vocabulary is closed-but-generated (mirrors the card-library precedent), tooltip prose held to the register bar.

VISION AUDIT: PASS-with-notes — soft note only on the systemic-vs-authored tension (§3, design-tensions), which the plan itself names and mitigates; no premise is at risk.
