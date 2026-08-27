> **title:** `Shared anchor machinery — the WorldRef type, the game-wide object catalog, and the resolution gates — THR-1212`
> **linear_issue:** THR-1212
> **author:** `Claude Code (design session)`
> **created:** 2026-08-27
> **three_pillars:** Engine `done` · Content `done` · UI `done (no new surface — laws binding + one deferral chartered)`

# Shared anchor machinery — the `WorldRef` type, the game-wide object catalog, and the resolution gates — THR-1212

*One shared, catalog-backed way for anything in the game to reference a game-state object — replacing seven disagreeing kind vocabularies with one, and making "the reference resolves to something real" a gated property instead of a hope.*

## Why this is load-bearing

The seam inventory ([THR-1158](https://linear.app/threadbare/issue/THR-1158/seam-inventory-where-content-claims-state-where-writes-go-unconsumed)) measured what happens without this: ~89% of authored chips carried no typed entity reference, a resonance weight fired zero times across 167 shipped dilemmas because two id vocabularies never met, and the campaign spine's milestone prose had zero consumers behind a hard-throwing loader. The substrate inventory ([THR-1159](https://linear.app/threadbare/issue/THR-1159/substrate-inventory-what-existing-machinery-the-shared-anchor-type)) found seven live entity-kind vocabularies that disagree — the graph says `actor` while every UI layer says `agent`; `faction` is type-illegal in `TargetCategory` and ships through `as unknown as`; `attachment` is legal in the concept vocabulary and illegal in the visual resolver it feeds. Every future typed seam (hunger, [THR-1213](https://linear.app/threadbare/issue/THR-1213/wave-1-design-b-hunger-vocabulary-unification-one-catalog-one-key); region identity, [THR-1155](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to)) is blocked on this doc because without one canonical reference type and one gate pattern, each seam would mint vocabulary eight, nine, ten.

The wayfinder map ([THR-1157](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map), closed 2026-08-24) settled the decisions this doc builds on; they are **settled input, not re-litigated here**. The program epic ([THR-1156](https://linear.app/threadbare/issue/THR-1156/typed-game-state-architecture-program-epic-claims-vs-reports-acted-on)) holds the four ratified distinctions. Standing preferences: **strangler, never big-bang**; **architecture-first**.

## Substrate inventory

No green field — every piece below exists and this plan extends or reuses it. Verified against the current tree 2026-08-27 (the pilot-era picture has moved: `$target` ([THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)) and `$artifact` ([THR-1275](https://linear.app/threadbare/issue/THR-1275/no-spawned-artifact-anchor-a-possession-chip-is-structurally-forced-to)) sentinels have shipped since the pilot learnings were written).

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Encounters & Dilemmas — aftermath concept decoration (`EncounterAftermathConceptRef`, `buildAftermathConsequences.ts`) | 🟢 ACTIVE | **extends** — stays the chip wire shape (it survived the pilot unchanged); gains a `WorldRef` adapter, is never rewritten |
| Anchor sentinel machinery (`chipAnchorDeclarations.ts`: `$actor`, `$target`, `$cast:`, `$faction:`, `$artifact`, attachment-template literals) | 🟢 ACTIVE | **extends** — becomes the canonical late-bound binding form of `WorldRef`; no new sentinel grammar invented |
| Anchor catalog generator (`scripts/generate-anchor-catalog.ts`, THR-1154; output `.claude/skills/encounter-pipeline/reference/anchor-catalog.generated.md`) | 🟢 ACTIVE | **extends** — membership authority moves to `WorldRefKind`; gains the kind-union coverage lint; stays half-curated and fail-loud |
| Law 56 clause-2 gate (`chipAnchorViolations`, `check:chip-anchors`) | 🟢 ACTIVE | **extends** — gains the no-referent ratchet baseline; currently 0 violations in scope |
| `tooltip` (`tooltipResolver.ts`, 12 live prefixes + 1 reserved) | 🟢 ACTIVE | **reuses** — the catalog validates against its prefix registry; the resolver is not modified |
| Entity visual resolution (`entityVisualResolver.ts` `EntityVisualRef`, `entity-visual-fallbacks.ts` `EntityVisualKind`, 11 kinds) | 🟢 ACTIVE | **reuses as the rendering arm** — adapter maps `WorldRefKind` → `EntityVisualKind`; the deliberate `attachment` absence (THR-1120) is recorded as a curated catalog annotation, not "fixed" |
| `notification` (`NavigationTarget` 7 arms, `EntityNotice.anchorId/anchorKind`) | 🟢 ACTIVE | **reuses/extends** — `NavigationTarget` is the routing arm behind an adapter; `EntityNotice` keeps the word `anchor`, which is why the new type is named `WorldRef` |
| Narrative linker segment quadruple (`encounter-stage/types.ts:128-160`: `referenceId`/`entityId`/`tooltipId`/`entityKind`) | 🟢 ACTIVE | **extends** — adapter target; the absent-kind-means-person compatibility rule is preserved |
| Systems-inventory generator pattern (`generate-systems-inventory.ts`) + freshness registration (`check-generated-freshness.ts`, `generated-artifact-sources.ts` `STATIC_ARTIFACT_SOURCES`) | 🟢 ACTIVE | **reuses as the generator pattern** for the consumption ledger — derived membership, curated annotation, member-without-annotation fails by name, mandatory registration |
| Interface map governance (`scripts/interface-contracts.ts` — downgrade-only, LEAKED→Deferral-ticket) | 🟢 ACTIVE | **reuses the invariant** for the consumption ledger's empty-consumer rows; the map's row schema is not reused (file-granularity, wrong grain) |
| Reach-signature sentinels / `SYMBOLIC_REFS` (`graphOp.ts`) | 🟢 ACTIVE | **leave-alone this wave** — the two-resolver `$target` overlap is catalogued as a known seam; unifying it is chartered by defect evidence, not pre-planned (map ruling: later seams need no map reopen) |
| Action-template targeting (`TargetCategory`) | 🟢 ACTIVE | **leave-alone** — it is a predicate, not a reference ([THR-1159](https://linear.app/threadbare/issue/THR-1159/substrate-inventory-what-existing-machinery-the-shared-anchor-type) verdict); the `as unknown as` faction lie is catalogued and rides whichever seam next touches reach-signature binding |
| `clearance_gate_tag` → `followOnTags` | 🟢 ACTIVE (write side only) | **retires** — the demonstration case; see § Absorbed ruling 2 |

## Prep-step measurement (run 2026-08-27, this session)

The clause-2 predicate with its "declares a referent" scope removed, whole catalog (the pilot-learnings pre-check, [THR-1160](https://linear.app/threadbare/issue/THR-1160/pilot-learnings-what-the-chip-migration-proved-or-changed-before-the); 491 unscoped per PR [#1522](https://github.com/christianspliid-ui/threadbare/pull/1522) at pilot time):

- **626 unique authored chips** across 34 template families (deduped by `change.id` per template, same walk as `chipAnchorViolations`).
- **183 anchored** (at least one `entityId`/`tooltipId` on the declared referent). **0 declares-unanchored** — the clause-2 gate holds on its scoped population.
- **443 no-referent** (older shape, declares neither `stateNoun` nor `concepts`) — the unscoped population wave 1 must decide about.

Where the 443 sit, and what that does to the cost model: **~191 chips live in the eleven two-letter faction families** (`ac`/`tg`/`mc`/`lk`/`ag`/`cg`/`bf`/`uk`/`rb`/`mct`/`ts`, ~15 templates each, ≈1 chip/template) — mechanically-shaped, hod-like content that the pilot measured at **2.0 lines/chip with zero prose rewrites**. **63 chips sit in `reputation.*`** — these need Law 13 visibility-parity triage *before* anchoring (a tally chip folds, it does not anchor). The long tail (`enc`, `liminal`, `social`, `tavern`, `crafting`, `mentorship`, `borderland`, single-file five-packs) is fiction-adjacent — the pilot's prose tax (23/29 nouns rewritten in the slice file) applies there. Per the pilot's estimator rule, **a seam is costed by how many of its nouns already name a real carrier**, and this distribution says: roughly half the corpus is cheap-mechanical, a tenth needs parity triage first, the rest is prose-priced.

## Engine pillar

### Systems design — the `WorldRef` type

New module `src/types/worldRef.ts` (additive; nothing existing is rewritten):

```ts
/** Canonical kinds a game-state reference can name. THE kind vocabulary —
 *  every other kind union is validated as a projection of this one. */
export type WorldRefKind =
  | 'agent'        // graph: actor node (actorType person-like); UI word wins over graph's 'actor'
  | 'faction'      // actor node with actorType 'faction'; authored form is $faction:<defId>
  | 'location'     // place-tier location node
  | 'sublocation'  // location node with parentLocationId (THR-1183 shape)
  | 'hex'          // id serialized `<col>,<row>` — hex identity is coordinates
  | 'artifact'     // artifact | artifact_legendary node
  | 'attachment'   // attachment TEMPLATE node id (committed content; never a granted instance)
  | 'companion'
  | 'army'
  | 'encounter'    // live encounter/action id
  | 'journey'
  | 'receipt'      // divine receipt id
  | 'codex';       // ⛔ reserved — see Absorbed ruling 4

export interface WorldRef {
  readonly kind: WorldRefKind;
  /** One id space, three binding forms (see below). */
  readonly id: string;
  /** Display name for alt text / fallback tiles. */
  readonly name?: string;
  /** Concept explanation (tooltipResolver id) where one exists. */
  readonly tooltipId?: string;
}
```

**Three binding forms, one `id` field** — the pilot proved sentinels-in-the-id-field against real content and the shape survived unchanged ([THR-1160](https://linear.app/threadbare/issue/THR-1160/pilot-learnings-what-the-chip-migration-proved-or-changed-before-the)); this generalizes that rule instead of inventing a second channel:

1. **Committed literal** — an id that means the same thing in every world: attachment template node id, faction *definition* id (reached via `$faction:`), tooltip concept id. The only literals authored content may carry.
2. **Late-bound sentinel** (`$`-prefixed) — resolved against the live graph at use: `$actor`, `$target`, `$cast:<key>`, `$faction:<defId>`, `$artifact`. The existing grammar from `chipAnchorDeclarations.ts`, unchanged. New sentinel forms are budgeted at ~1 form + resolver branch per seam (~30–60 lines, pilot-measured) and enter through the catalog, never ad hoc.
3. **Live node id** — a per-world graph node id. **Engine producers only** (reports); authored content carrying one is a gate violation, because a raw node id "works in the authoring session and nowhere else" (`chipAnchorDeclarations.ts` rejection text). This is distinction 1 of the program epic (claims vs reports) expressed in the binding rule: *claims bind by forms 1–2, reports may bind by form 3.*

**Hub-and-spoke, not replacement.** The four existing shapes — `NavigationTarget`, `EntityVisualRef`, `EncounterAftermathConceptRef`, the narrative-segment quadruple — remain the wire/render formats their consumers already speak. `WorldRef` is the normal form behind them, with adapters in `src/types/worldRefAdapters.ts` (or colocated):

- `toNavigationTarget(ref): NavigationTarget | undefined` — partial (a `codex` ref has no route yet; a `journey` ref needs its `agentId` supplied by the caller). Returning `undefined` is the fail-soft, and the adapter is the single place that knows which kinds route.
- `toEntityVisualRef(ref): EntityVisualRef | undefined` — kind-mapped; `attachment` returns `undefined` **deliberately** (THR-1120: its art lives on the template node; `resolveIcon` skips rather than resolving a wrong tile).
- `fromConceptRef(ref: EncounterAftermathConceptRef): WorldRef | undefined` and `fromNarrativeSegment(...)` — including the segment rule that absent `entityKind` means `agent` (backward compatibility, `encounter-stage/types.ts:145-149`).

What unifies *immediately* is the **kind vocabulary**: each of the seven unions is checked by the catalog's coverage lint as a projection of `WorldRefKind`, with curated dispositions for every deliberate divergence (below). What converges *opportunistically* is the shapes — new code speaks `WorldRef`; existing consumers migrate when their seam is chartered. Strangler, per the standing rule.

### The resolver — paired, live, and it drops

```ts
// src/engine/worldRefResolver.ts
export interface WorldRefResolutionContext {
  readonly graph: WorldGraph;
  readonly actorId?: string;
  readonly targetId?: string;
  readonly castNodeIdByKey?: ReadonlyMap<string, string>;
  readonly encounterTemplateId?: string;
}
/** Node id in THIS world, or undefined. Never throws (NFP #4). */
export function resolveWorldRef(ref: WorldRef, ctx: WorldRefResolutionContext): string | undefined;
```

Implementation delegates to `resolveAnchorDeclaration` for sentinel forms (one rule read twice was THR-1164's explicit design — this keeps it one rule, now read three times: gate, chip renderer, and any new consumer). The pilot's core lesson binds every consumer: **a static type is necessary, never sufficient** — the resolver returns `undefined` and the surface falls soft to plain text/no-affordance, never a dead link (Law 21), and every seam owes the no-op gate below. [THR-1165](https://linear.app/threadbare/issue/THR-1165/two-dollarcast-sentinels-resolve-to-nothing-at-runtime-the-caravan) is the proof case: sentinels that passed the static check while resolving to nothing in play.

### The catalog — one generated authority, game-wide

`scripts/generate-anchor-catalog.ts` (THR-1154) already derives membership from the `NodeType` / `ActorType` / `EdgeType` / `AttachmentCategory` unions with curated annotations and fail-loud behavior. This plan extends it rather than writing a second generator:

1. **`WorldRefKind` becomes a parsed source** and the catalog's membership spine. The generator cross-checks it against the four existing union sources *and* against the consumer projections (`EntityVisualKind`, `EncounterAftermathConceptRef.visualKind`, segment `entityKind`, `NavigationTarget` arms, `EntityNoticeAnchorKind`).
2. **Kind-union coverage lint** — a kind present in any consumer union but unmapped to a `WorldRefKind` (or a `WorldRefKind` with no disposition row per consumer union) **fails the generator by name**, the `assertEveryMemberAnnotated` pattern. Deliberate divergences are curated annotations, e.g.: `EntityVisualKind.avatar/npc-role/unknown` = render-only refinements, not referenceable kinds; `attachment` absent from `EntityVisualKind` = deliberate (THR-1120); `NavigationTarget` lacking `codex` = ⛔ reserved with its Deferral ticket cited. A silent default ("not an anchor") is exactly the hole the pattern exists to close.
3. Output stays at `.claude/skills/encounter-pipeline/reference/anchor-catalog.generated.md` (already freshness-registered in both `check-generated-freshness.ts` and `STATIC_ARTIFACT_SOURCES`); the new source coupling (`src/types/worldRef.ts`) is registered in the same change. Law 56 clause 2 already names this catalog as the authority, so extending it extends the law's reach for free.

### The gates — the typed-seam contract

Ratified pattern every typed seam owes (this is the map's "every typed seam owes a paired live resolver plus a gate on the no-op case", made concrete):

| Gate | When it runs | What it proves | Wave-1 instance |
|---|---|---|---|
| **Static classifier** | authoring time / CI | the declared form *could ever* resolve (sentinel well-formed, literal is committed content) | `classifyAnchorDeclaration` via `check:chip-anchors` — exists, 0 violations |
| **Live resolver that drops** | render/use time | an unresolvable ref degrades to text, never a dead affordance | `resolveAnchorDeclaration` → generalized as `resolveWorldRef` |
| **No-op gate** | CI (vitest contract test) | representative content *actually resolves* in a seeded world — the THR-1165 class | new: per-seam resolution assertion (chips first), pattern below |
| **Ratchet baseline** | CI | the unscoped population only shrinks | new: no-referent chip baseline at **443** |

**No-op gate pattern:** a contract test builds a seeded world through the real `initializeGameState`/`runTick` pipeline (the CLI's pipeline, headless), stages representative content (the template's own cast/support bindings), runs `resolveWorldRef` over every declared anchor on that content, and asserts each resolves to an existing node — enumerating expected drops explicitly rather than tolerating a rate. A vacuous-guard note for the executor: assert the *population is non-empty* before asserting resolution (the empty-population pass is a known test pathology in this repo).

**Ratchet mechanics:** `check:chip-anchors --baseline` compares the no-referent count against a committed `chip-referent-baseline.json` (the `check:typecheck` pattern: fails only on increase; legitimate decreases refresh the baseline with the reason in the commit body). This extends clause 2's pressure to the unscoped 443 without a big-bang sweep — every touched template pays its referents on the way through, and the factory retrofit line ([THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to), [THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine)) drains the bulk at batch cadence.

### The reachable-consumption ledger

Distinction 2 of the program epic (acted-on vs merely-recorded), made machinery. New generator `scripts/generate-consumption-ledger.ts` → `Docs/canon/consumption-ledger.generated.md`, copying the systems-inventory/anchor-catalog pattern exactly:

- **Derived membership:** every aftermath effect kind (the 44-member union) and every `GraphOp` op kind — parsed from source, so a new effect kind appears the day it is added.
- **Curated annotation per row:** consumer site(s) (`file:symbol`), and **class** per the acted-on taxonomy ([THR-1161](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions), settled): `acted-on` (player told via an entity component, awareness-scoped) / `bookkeeping` (invisible accumulator, visible at tally-points) / `dormant-hook` (an active spawn with firing metadata). A member with no row **fails the generator by name**.
- **The mere-existence trap is the row schema's problem to avoid:** the Grateful Kin lesson ([THR-1175](https://linear.app/threadbare/issue/THR-1175/a-town-cannot-owe-a-social-favour-favor-creation-with-a-non-person)) is that a consumer *existing* proves nothing — the write must be consumable *for the operand types it actually receives*. So a row's consumer column records the operand constraint where one exists (e.g. `favor_creation`: person-shaped debtor enforced by the THR-1175 guards), and per-operand enforcement lives in per-seam helper guards, not in this ledger — the ledger names them, the guards enforce them.
- **Empty-consumer rows are `write-without-consumer`** and reuse the interface map's LEAKED discipline verbatim: legal only with a cited `Deferral` ticket; the generator fails otherwise. Freshness-registered in both registries like every generated artifact.

The ledger is the machine that would have caught `hungerResonance` (reader in a disjoint vocabulary = no reachable consumer), mandate milestone prose (zero importers), and `followOnTags` — which is why followOnTags is its demonstration case below.

### Absorbed rulings (the map routed these here; each gets its answer now)

**1. Chips remainder — carrier-anchoring vs closing G1, and the 443.**
Ruling: **carrier-anchoring stays lawful, and the specificity complaint is already half-answered by shipped code.** Since the pilot measured 92% carrier-anchoring, `$target` (THR-1130) and `$artifact` (THR-1275) shipped — the two forms whose absence *forced* the worst carrier flattening (the wrong-end-of-the-edge favor chips; the whole `possession` family). Wave 1 does **not** gate on inventing further sentinel forms: the ledger + catalog will name any spawn kind that still lacks one (`$spawned:` generalization beyond artifacts), and the standing defect-evidence rule charters it when content actually needs it. The **443 no-referent chips migrate by ratchet + factory cadence, not sweep** (mechanics above); the `reputation.*` 63 get visibility-parity triage *first* — a tally chip folds into band prose (Law 13), it does not get an anchor. This is the deliberate call the pilot asked for: we accept carrier-anchoring where the object has no authorable id, we no longer accept it where `$target`/`$artifact` reach the true object.

**2. `followOnTags` — the falsifiable demonstration case.**
The seam inventory measured it: no consumer acts on any tag, the tests assert the write side only, three tag conventions rot in one dead field. Ruling: **delete** — the field, its writers (`clearance_gate_tag` effect plumbing), and the write-side test assertions (`clearanceGate.test.ts:248-249,337-340`), per the interface-map rule that retiring a contract deletes the tests asserting its dead side, and per sunset-by-default (keeping requires evidence of a catch; there is none). **The demonstration is mechanical, and that is the falsifiable part:** the consumption ledger's derived membership + consumer grep must flag `followOnTags` as `write-without-consumer` *on its own* — if the ledger's first run does not surface it unprompted, the ledger design has failed and goes back for rework. Executor order: ledger first, deletion second, citing the ledger row as evidence.

**3. Violation-class taxonomy home.**
`claim-without-anchor` / `write-without-consumer` / `render-private-pipeline` appear nowhere in canon ([THR-1158](https://linear.app/threadbare/issue/THR-1158/seam-inventory-where-content-claims-state-where-writes-go-unconsumed) addendum). Ruling: **the UL is the authority; the interface map points at it.** One `UL-proposal` issue adds the three terms (with "Law 56-hollow", already in-tree at `unifiedAction.ts:1035`, recorded as an alias of `claim-without-anchor`). The interface map's badge vocabulary already covers `write-without-consumer` (≈ LEAKED) and partially `render-private-pipeline`; it gains **one** new badge for the content-claims class, defined by pointer to the UL entry — single authority + pointers, never two definitions. No third home.

**4. The codex arm.**
`NavigationTarget` has no `codex` kind because no in-game codex destination exists — `?view=codex` is a full-page navigation that tears down the running simulation. Ruling: **defer with a chartered route, not silently dropped.** `codex` enters `WorldRefKind` now as **⛔ reserved** (the catalog badge that exists for exactly this), `toNavigationTarget` returns `undefined` for it, and codex-class concepts anchor at the `named` tier via `tooltipId` — explicitly lawful (Law 56 clause 2's closing note: `named` satisfies the clause; folding merely because an anchor cannot be clicked destroys a legitimate consequence). A `Deferral` issue is filed at handoff for the in-game codex surface (an overlay/panel route that does not tear down the sim), and the catalog's reserved-row annotation cites it. The reserved kind makes the gap visible in the authority instead of invisible in a missing union arm.

**5. Edge-schema warn→enforce policy (beyond [THR-1177](https://linear.app/threadbare/issue/THR-1177/edge-integrity-the-enforce-now-package-validate-at-the-two-generic)).**
Ruling — policy, not new machinery: (a) the two generic writer chokepoints enforce now (THR-1177, already ticketed — the edge-integrity audit [THR-1176](https://linear.app/threadbare/issue/THR-1176/edge-integrity-audit-every-schema-constrained-edge-family-checked-for) showed the structural fix is two chokepoints, not thirty validators); (b) every remaining schema-constrained family rides a **warn-count ratchet** measured in the seeded probe world — counts may not grow, and a family flips to enforce when its count reaches 0; (c) a family whose violations are a *deliberate writer* is **schema drift** and is widened, never enforced (`belongs_to` 18/313 is the named case), and the `located_at` schema is corrected to the three-tier position model (a false-warn generator is worse than no warn); (d) sunset applies — a family warning that catches nothing real in six weeks is deleted at retro unless renewed by a catch. No blanket enforce date: enforcement is earned per family by an empty violation list, never scheduled.

### Graph nodes / edges

None added or modified. `WorldRef` references existing node/edge types; the generator *parses* `src/types/graph.ts` as source text (the anchor catalog already does — type-level unions are erased at runtime) and adds no runtime import of it.

### Tick phases

None. All new machinery is build-time (generators, gates) or use-time (resolver called by surfaces/adapters). No orchestrator phase is added — deliberately: this is reference plumbing, not simulation behavior.

### Resolution logic

`resolveWorldRef` is deterministic given (ref, world): sentinel resolution delegates to the existing rules, including their determinism tie-breaks (lowest-sorted faction node; `$artifact`'s held → newest → lowest-id pick order, all NFP #3-annotated in `chipAnchorDeclarations.ts`). No scoring, no probability.

### PRNG callouts

None. No random draws anywhere in this plan.

## Content pillar

Per-template-subsection dispositions: **Encounter templates:** N/A — no template authored or edited (the followOnTags sweep touches plumbing fields, not content). **Prose tables:** N/A — no prose authored. **Attachment content:** N/A — attachment *templates* are referenced as anchor literals, none created. **Data tables:** the committed baselines (`chip-referent-baseline.json`, edge-warn baselines) are the plan's only data artifacts.

No new content is authored by this plan; its content surface is the **authoring interface**:

- **Sentinel vocabulary is the authored binding form** — unchanged grammar, now documented once in the extended catalog, which is already the encounter-pipeline skill's reference. The skill reference gains no second copy; the catalog *is* the authoring doc (generated, cannot drift).
- **Migration path for shipped content** (the map's routed "migration mechanics" item): ratchet + factory cadence per Absorbed ruling 1. Concretely for authors: a template touched by any retrofit batch pays its chips' referents in that batch (2–4 mechanical lines/chip; prose rewrite only where the noun is fiction-shaped, per the pilot's measured split); `reputation.*` chips triage against Law 13 parity before anchoring; nothing else in the corpus is touched until its seam or batch comes up.
- **`followOnTags` deletion** touches content-adjacent template fields; the executor's sweep predicate is "every writer of `followOnTags` / `clearance_gate_tag` plumbing + the write-side test assertions", grep-derived at execution time (THR-688 rule A — predicate, not a snapshot list).

## UI pillar

*Screenshot tool: none owed for the core slices — no new player-facing surface is drawn and no pixel changes (type module, generators, CI gates are `Browser-verify exempt: types/gates-only, no rendered surface changed`). The followOnTags deletion and any adapter wiring that touches chip rendering owe the standard evidence: Playwright DOM capture of an encounter aftermath at 1920×1080 + console + a `__DEBUG` state assertion.*

- **Player-facing display:** no new surface. The laws that bind are already live on the surfaces this machinery feeds: **Law 56** (both clauses — the catalog is named authority in clause 2), **Law 21** (the resolver-that-drops exists so no dead affordance renders), **Law 13 visibility parity** (the reputation-chip triage), and the UI Law (concepts carry visual/tooltip/link where a page exists). The machinery makes these *checkable*; it changes no pixels.
- **The "no naked state" law candidate** ([THR-1161](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions): interface text naming a simulation object always renders as an anchored entity component; plain prose is pure flavor, always): this plan's machinery is what would enforce it, but **ratifying a law is Christian's call in chat, never a plan-doc side effect** (laws.md § Enforcement). It is surfaced as a proposal in the handoff summary; until ratified, nothing in wave 1 depends on it.
- **Event notifications:** none new.
- **Debug inspection:** `window.__DEBUG.getWorldRefDrops()` — a dev-only ring buffer (capped at `WORLDREF_DROP_LOG_MAX`) recording every resolver drop `{refKind, id, surface, tick}`. This is NFP #2's answer for a render-time system that must not emit engine traces from the UI layer: inspectability via the debug bridge, not the trace buffer. Registered in `debug-bridge.d.ts` with JSDoc per the standing convention.
- **Visual presence (HexMapV2):** N/A — no map-layer change.

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `src/types/worldRef.ts` (+ adapters) | none (type layer) | consumed via adapters by chip/segment/notice renderers | none | none | catalog documents it |
| `src/engine/worldRefResolver.ts` | none (called at use time) | encounter stage veil (via `buildAftermathConsequences`) | none | none (see drop log) | `__DEBUG.getWorldRefDrops()` |
| `scripts/generate-anchor-catalog.ts` (extended) | build time | n/a | n/a | n/a | generated .md is the surface |
| `scripts/generate-consumption-ledger.ts` (new) | build time | n/a | n/a | n/a | `Docs/canon/consumption-ledger.generated.md` |
| `check:chip-anchors --baseline` (extended) | CI | n/a | n/a | n/a | committed `chip-referent-baseline.json` |
| followOnTags deletion | removes dead write plumbing | none | field removed from action types | none | ledger row records the retirement |

Wiring-checklist note: no orchestrator phase, modal, GameState field, or player control is added; the executor verifies the *generators* are wired (freshness registration in both registries) — the checklist's analogue for build-time modules. The one checklist-recordable addition is the `__DEBUG.getWorldRefDrops()` accessor: add its row to `Docs/plans/wiring-checklist.md` in the slice that ships it (per the checklist's precedent of recording debug-surface additions).

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `CHIP_NO_REFERENT_BASELINE` (committed `chip-referent-baseline.json`) | `443` | Ratchet ceiling for authored chips declaring no referent; decreases refresh the file, increases fail CI |
| `WORLDREF_DROP_LOG_MAX` | `50` | Cap on the dev-only resolver-drop ring buffer |
| `EDGE_WARN_RATCHET_BASELINE` (per family, committed json — executor names the file with THR-1177's owners) | audit counts from [THR-1176](https://linear.app/threadbare/issue/THR-1176/edge-integrity-audit-every-schema-constrained-edge-family-checked-for) | Per-family edge-schema warn counts may not grow; 0 flips the family to enforce |

## Tracing

No tick-loop traces: nothing here runs in the tick loop (NFP #2 is served by the generated artifacts, the CI gates, and the `__DEBUG` drop log — each a queryable record of *why* a reference resolved or failed). The one runtime observable:

```ts
// __DEBUG.getWorldRefDrops() entry — recorded when resolveWorldRef returns undefined
// for a ref a surface tried to render. Dev-only, ring-buffered, never in prod builds.
interface WorldRefDropRecord {
  refKind: WorldRefKind;
  id: string;        // the declared id/sentinel that failed to resolve
  surface: string;   // caller-supplied label, e.g. 'aftermath-chip'
  tick: number;
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `resolveWorldRef` finds no node (missing actor, unspawned faction chapter, no mint yet) | return `undefined`; surface renders plain text / no affordance (Law 21); drop recorded in dev log |
| Adapter target has no arm for the kind (`codex` → NavigationTarget, `attachment` → EntityVisualRef) | return `undefined`; caller renders without link/tile — deliberate, catalogued |
| Catalog generator: union stops parsing, member unannotated, kind-union uncovered | **fail loud at build time** (deliberate exception to NFP #4, which governs the tick loop — a partial authoring authority is worse than a red build; precedent documented in `generate-anchor-catalog.ts` header) |
| Ledger generator: effect kind with no row / empty consumer without Deferral ticket | fail loud at build time, by name |
| Ratchet baseline file missing/corrupt | gate fails with regeneration instructions — never silently passes |
| Seeded-world no-op gate: world fails to build | test fails (CI); never ships a green on an unexercised population — test asserts population non-empty first |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/unifiedAction.ts` | 278 importers | touched **only** by the followOnTags retirement (the `clearance_gate_tag` effect-kind arm at `unifiedAction.ts:415`; the field itself is declared in `src/types/contentShells.ts:44,70`); the type-check ratchet is the cascade detector, and the ledger's zero-consumer evidence is why the deletion is safe — no reader exists to break |
| `src/types/graph.ts` | 531 importers | **not modified** — parsed as source text by the generator (no runtime import; a source-coupling row is added to `STATIC_ARTIFACT_SOURCES` so freshness catches drift) |

## Interface impact

| Contract | Action |
|---|---|
| `EncounterAftermathConceptRef` wire shape (content → encounter stage) | **preserve** — untouched; adapter added beside it |
| Anchor sentinel grammar (`chipAnchorDeclarations.ts` ⇄ gate ⇄ veil renderer) | **extend** — new consumer (`resolveWorldRef`) reads the same single rule |
| Anchor catalog generated artifact (type unions → `.claude/.../anchor-catalog.generated.md`) | **extend** — new source `src/types/worldRef.ts`; coverage lint added; registration updated in the same change |
| Consumption ledger (effect kinds/GraphOps → `Docs/canon/consumption-ledger.generated.md`) | **add** — new generated artifact; rows registered in `scripts/interface-contracts.ts`'s governance orbit via the LEAKED→Deferral rule reuse; freshness-registered |
| `clearance_gate_tag` → `followOnTags` | **retire** — field, writers, and write-side test assertions deleted (ledger row is the tombstone); the interface map row (if present) is updated in the same PR |
| `tooltipResolver` prefix registry (content ids → tooltip content) | **preserve** — catalog validates against it; resolver unmodified |
| Interface-map badge vocabulary | **extend** — one new badge for the content-claims violation class, defined by pointer to the UL entry (Absorbed ruling 3) |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (authoring interface + migration path; no new authored content by design)
- [x] UI pillar present (no new surface — laws binding, debug accessor, one chartered deferral; rationale stated)
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise is contradicted. The plan serves the ratified typed-state charter ([THR-1156](https://linear.app/threadbare/issue/THR-1156/typed-game-state-architecture-program-epic-claims-vs-reports-acted-on)) and NFP #5 is respected: nothing here forces mechanical prose — folding remains the sanctioned move for pure fiction, and the catalog's `named` tier keeps un-clickable-but-real referents legal.
- [x] No Vision edit is required in this ticket's scope (the "no naked state" law candidate is surfaced to Christian for ratification separately; nothing in wave 1 depends on it).

## Rulebook impact

- [x] No rule of play changes — turn structure, verbs, prerequisites, resources, encounters, clocks, win/loss all untouched. (Reference machinery only.)
- [x] No `Docs/canon/rulebook.md` update is owed in this PR.

> Brainstorm companion: `Docs/plans/2026-08-27-shared-anchor-machinery-brainstorm.md` (written in the same pass).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | The few real numbers are named constants / committed baselines (table above); the machinery is mostly rules, which is what makes seams tunable later |
| 2. Inspectability | PASS with note | No tick traces because nothing ticks; inspectability lives in the generated catalog/ledger, gate outputs, and `__DEBUG.getWorldRefDrops()` — stated deliberately rather than a token trace |
| 3. Determinism | PASS | No PRNG; resolver tie-breaks inherit the existing NFP #3-annotated pick orders |
| 4. Fail-soft | PASS with note | Runtime resolution is fail-soft everywhere (drops → text); build-time generators are deliberately fail-loud, the documented exception the anchor catalog already established |
| 5. Narrative over mechanical perfection | PASS | Fold-into-prose stays a first-class outcome; `named` tier lawful; nothing forces an anchor onto pure fiction |
| 6. Additive over destructive | PASS with note | Everything is additive except the followOnTags retirement — justified by measured zero consumers and sunset-by-default, with the ledger row as evidence |
| 7. Performance budget | PASS | Generators are build-time; resolver is O(small) per rendered ref (same cost as today's `resolveAnchorDeclaration`); no per-tick work added |

## Done when

- [ ] All Engine slices 1–6, Content, UI, and Wiring action items below are landed (each independently shippable; later slices cite earlier artifacts)
- [ ] `npm test` and `npx vite build` pass; types verified via `npm run check:typecheck` (ratchet — never `tsc --noEmit`, a no-op here per THR-686)
- [ ] Each closing commit body and PR body carries its closeable reference per Definition of Done
- [ ] Core slices state `Browser-verify exempt: types/gates-only, no rendered surface changed`; chip-rendering slices carry the Playwright capture + console + `__DEBUG` assertion

*Executor action items — ordered, strangler-sized; each slice is independently shippable and the later ones cite the earlier ones' artifacts.*

**Engine action items**
1. `src/types/worldRef.ts` (`WorldRefKind`, `WorldRef`) + `worldRefAdapters` + `src/engine/worldRefResolver.ts` delegating to `resolveAnchorDeclaration`; unit tests incl. adapter partiality (`codex`, `attachment`) and the segment absent-kind-means-agent rule. Additive; no consumer migrated.
2. Extend `generate-anchor-catalog`: `WorldRefKind` membership spine + kind-union coverage lint over the seven consumer unions with curated dispositions (incl. `attachment`/THR-1120 and `codex`/reserved rows); register the new source in `STATIC_ARTIFACT_SOURCES` + `check-generated-freshness.ts` in the same PR.
3. `check:chip-anchors --baseline` + committed `chip-referent-baseline.json` (443); CI wiring beside the existing check; document refresh semantics in the script header (run as last action before push — tree-diffing gate).
4. `generate-consumption-ledger` v1: derived membership (44 effect kinds + GraphOp ops), curated consumer/class annotations per THR-1161's taxonomy, fail-by-name guards, LEAKED→Deferral reuse for empty-consumer rows, freshness registration. **Acceptance includes the falsification check: the first honest run must flag `followOnTags` unprompted.**
5. No-op gate pattern: one contract test (chips seam) — seeded world, representative templates, every declared anchor resolves to an existing node; population-non-empty assertion first.
6. followOnTags retirement: delete field, writers, write-side assertions (grep-derived predicate), citing the ledger row; type-ratchet + test suite are the cascade evidence. Touches `src/types/unifiedAction.ts` (Blast Radius above).

**Content action items**
1. N/A for new content — the catalog is the authoring doc and regenerates in slice 2. Migration of the 443 rides the factory retrofit cadence (THR-1130/THR-1222), governed by the ratchet from slice 3; `reputation.*` chips get Law 13 parity triage before anchoring.

**UI action items**
1. `__DEBUG.getWorldRefDrops()` + `debug-bridge.d.ts` JSDoc (rides slice 1's resolver PR).
2. File the codex-surface `Deferral` issue (in-game codex destination that does not tear down the sim) and cite it from the catalog's reserved-row annotation (rides slice 2). Coordination block posted as its first comment per THR-836.

**Wiring action items**
1. Freshness registration verified for both generated artifacts (slice 2, slice 4 — the wiring-checklist analogue for build-time modules).
2. UL-proposal issue for `WorldRef` + the three violation classes (with the "Law 56-hollow" alias); interface-map badge extension rides the same PR as slice 4.

**Gate items (every slice):** `npm test`, `npx vite build`, `npm run check:typecheck` (ratchet), 3b/3c freshness gates last; closing commits carry the closeable reference per Definition of Done. Core slices are `Browser-verify exempt: types/gates-only, no rendered surface changed`; any slice touching chip rendering owes the Playwright capture + console + `__DEBUG` assertion.

## Kill criteria

*How we will know this design was wrong, and what happens then.*

- **The ledger fails its own falsification check** — its first honest run does not flag `followOnTags` unprompted → the ledger design is wrong; rework before the deletion slice runs (acceptance criterion in Engine slice 4).
- **The kind-union coverage lint produces more curated-exception rows than mapped rows** → the "normal form" is fiction and hub-and-spoke needs revisiting — Linear comment against this doc, not a silent redesign.
- **THR-1213 (the generalization proof) cannot express the hunger seam without changing the type's shape** → same route: the discrepancy is a Linear comment against this doc; the map decision wins over any detail here.
- **The ratchet baseline generates recurring false failures at closeout** (tree-diffing gate misuse) → repair per the typecheck-ratchet's documented pattern; ≥3 recurrences in a week is an impediment-log pattern for the retro.

## Coordination block

**Suggested model:** opus — cross-cutting type architecture with generator/gate work; judgment-heavy, low-volume code. (Advisory; the automation runs Opus regardless.)

**Parallel-safe with:** THR-1130 / THR-1222 (factory retrofit batches edit encounter content files; this plan's slices edit `src/types/worldRef*`, `scripts/generate-*`, `scripts/check-chip-anchors.ts` — disjoint until a retrofit batch and slice 3 both touch `check-chip-anchors`, which slice 3 should land before); THR-1177 (edge chokepoint validators — different files; this doc only sets policy).

**Mutex with:** THR-1213 (native blocker — it consumes slice 1's type and slice 2's catalog; it must not start until this hands off and slices 1–2 merge); THR-1155 (blocked on THR-1213 per the map's ordering); any ticket editing `scripts/generate-anchor-catalog.ts` or `src/data/content-eval/chipAnchorDeclarations.ts` (both are single-rule files this plan extends — a concurrent editor would fork the one-rule-read-twice design).

**Files to touch:**
- Create: `src/types/worldRef.ts`, `src/types/worldRefAdapters.ts` (or colocate), `src/engine/worldRefResolver.ts`, `scripts/generate-consumption-ledger.ts`, `Docs/canon/consumption-ledger.generated.md` (generated), `chip-referent-baseline.json`, contract tests
- Edit: `scripts/generate-anchor-catalog.ts`, `scripts/anchor-catalog-sources.ts`, `scripts/check-chip-anchors.ts`, `scripts/generated-artifact-sources.ts`, `scripts/check-generated-freshness.ts`, `src/debug-bridge.ts` + `src/debug-bridge.d.ts`, `src/types/unifiedAction.ts` (followOnTags removal only), `.github/workflows/ci.yml` (gate wiring if needed), `scripts/interface-contracts.ts` (badge extension + followOnTags retirement)

## Notes for the executor

- **Do not rewrite the four legacy shapes.** Hub-and-spoke is the design: `WorldRef` behind adapters, wire shapes untouched. A slice that "cleans up" `EncounterAftermathConceptRef` has left scope.
- **One rule, read N times.** Sentinel classification/resolution stays in `chipAnchorDeclarations.ts`; `resolveWorldRef` delegates. Two copies is the drift this whole program exists to kill.
- **The ledger's first run is a test of the ledger.** If `followOnTags` does not surface unprompted, fix the ledger, not the demonstration.
- **Tree-diffing gates run last** (baseline refreshes, freshness checks) — after closeout edits, per the standing CLAUDE.md rule.
- **`node --experimental-strip-types` cannot load the template module** (extensionless imports); probes go through esbuild-bundle or vitest, per the `check:chip-anchors` pattern.
- The map's Decisions-so-far are settled; if an implementation detail here contradicts one, the map decision wins and the discrepancy is a Linear comment, not a silent re-design.

## Intent-judge verdict

**Allow** (2026-08-27; impact class judge-corrected Reversible → External — the slices add blocking CI behavior). 1 GAP (kill criteria not consolidated in the plan doc — fixed: `## Kill criteria` section added), 0 VIOLATIONs. Dimension-9 precision note applied (followOnTags field declared in `contentShells.ts:44,70`; `unifiedAction.ts:415` carries the effect-kind arm). Proposal: `Docs/plans/.intent-proposals/2026-08-27-shared-anchor-machinery.md`.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-08-27*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Constants table: `CHIP_NO_REFERENT_BASELINE`=443, `WORLDREF_DROP_LOG_MAX`=50, `EDGE_WARN_RATCHET_BASELINE` per-family — real numbers named, not embedded |
| 2. Inspectability | PASS-with-note | No tick traces (nothing ticks); relies on generated catalog/ledger + `__DEBUG.getWorldRefDrops()` ring buffer instead of the standard three-union trace registration. Justified explicitly, but the wiring-checklist's own precedent records even trace-less new surfaces as a dedicated wiring-checklist row — this plan declines one, a minor convention gap for a genuinely new `__DEBUG` accessor *(resolved post-audit: the accessor's checklist row is now an executor item)* |
| 3. Determinism | PASS | "No PRNG... resolver tie-breaks inherit the existing NFP #3-annotated pick orders" |
| 4. Fail-soft | PASS-with-note | Runtime resolution fail-soft everywhere (drops→text, Law 21); build-time generators are deliberately fail-loud — an explicit, precedented exception to NFP #4 (cited: `generate-anchor-catalog.ts` header), not a silent violation |
| 5. Narrative over mechanical | PASS | "Fold-into-prose stays a first-class outcome... nothing forces an anchor onto pure fiction" |
| 6. Additive over destructive | PASS-with-note | All additive except `followOnTags` retirement — justified by measured zero consumers, sunset-by-default, and a self-falsifying acceptance check (ledger must flag it unprompted) with a Kill Criterion if that check fails |
| 7. Performance budget | PASS | "Generators are build-time; resolver is O(small) per rendered ref... no per-tick work added" |

NFP AUDIT: PASS-with-notes (see rows above)

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Systems design, resolver, catalog/gate/ledger design, graph/tick/resolution/PRNG subsections all present; N/A rows carry one-line rationale per template rule |
| Content | present-but-thin | Content pillar exists (authoring interface + migration path) but skips the template's four named subsections in favor of an informal bullet list — no explicit per-subsection N/A statements *(resolved post-audit: per-subsection dispositions added)* |
| UI | present-and-substantive | Player-facing display, event notifications, debug inspection, visual presence all addressed; N/A rows carry rationale; screenshot-tool line present with `Browser-verify exempt` justification |

**Missing-required-sections:** No missing top-level sections. Minor gap: Content pillar's four named subsections were not individually N/A'd per template format *(resolved post-audit)*.

**Wiring check:** Yes — the Wiring table maps each module to orchestrator phase (explicitly "none, type/build layer"), UI component, GameState field, trace, and debug visibility, plus a note explaining the wiring-checklist treatment.

**Substrate-existence check:** PASS. Plan opens with a `## Substrate inventory` section listing 12 existing subsystems verified against the tree 2026-08-27, each disposed extends/reuses/leave-alone/retires. Spot-checked against disk: `chipAnchorDeclarations.ts`, `generate-anchor-catalog.ts`, `interface-contracts.ts`, `generate-systems-inventory.ts` all exist. No green-field duplication found.

PILLAR AUDIT: PASS-with-notes

### Vision audit

**Premises touched:** `02-non-negotiables.md` → "Everything is a graph node/edge" — confirmed (no property-bag fields added; `WorldRef` is additive reference plumbing, graph unmodified); "Narrative over mechanical perfection" — confirmed (folding stays sanctioned, `named` tier lawful); "Additive over destructive" — confirmed-with-tension (`followOnTags` retirement justified by measured zero consumers); "Three pillars always present" — confirmed. `00-north-star.md`, `01-core-loop.md`, `03-design-tensions.md`, `taste-profile.md` → not referenced (backend/reference machinery, no player-facing surface).

**Contradictions:** No contradictions found.

**Qualitative checks:** North star: neutral — doesn't move sessions toward the moment but doesn't work against it. Core loop: preserved — no tick-loop or orchestrator-phase code. Non-negotiables: inside them — graph-as-substrate and god/protagonist separation untouched; the followOnTags deletion is evidenced, not aesthetic. Design tensions: not leaned on — substrate for future seams. Taste profile: respected — no numbers-in-UI risk, no node-type invention.

VISION AUDIT: PASS
