> **title:** `Items move capability tiers again — THR-718`
> **linear_issue:** THR-718
> **author:** `Claude Code`
> **created:** 2026-07-24
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# Items move capability tiers again — THR-718

*Finishes the 2026-04-06 effects[] migration so a legendary blade actually makes its bearer mightier — one stat substrate, tier magnitude visible as dots on the character sheet.*

**User verdicts (chat review 2026-07-23, recorded in the issue):** items move tiers again via a **new `effects[]` primitive feeding `computeRawScore`** — one stat substrate, do NOT resurrect bare `domainContributions` fills; power-budget deliberately (items already shape rolls via test shapers, tier influence stacks on top). UI: **a simple magnitude indicator next to the capability prose, dots, reusing `StepDots` / the sphere symbol language**.

## Why this is load-bearing

`computeRawScore` has walked `possesses`/`bonded_to` edges for artifact `domainContributions` since the capability system shipped — but every possession catalog entry writes `{}`, so the walk finds nothing. Items are the game's most legible power fantasy ("the blade made her mighty") and the contract `attachment-domain-contributions` is 🔴 LEAKED with this ticket named as remediation. Meanwhile the same catalogs *already* carry a working `effects[]` vocabulary (20 primitives) — the leak is a half-finished migration, and finishing it closes the largest remaining item-power gap alongside THR-719/THR-737.

## Substrate inventory

*(Step 0.6 — grep evidence 2026-07-24. This finishes a migration inside two ACTIVE subsystems — Attachments/Possessions and Personality & Traits' capability math; nothing green-field.)*

- **Read side exists and is live code:** `src/engine/domainCapability.ts:71–82` — `computeRawScore` walks `possesses`/`bonded_to` edges and sums `artifactNode.properties.domainContributions`. The walk is tested; only the data is empty. Traits (`has_trait` walk, lines 54–69) and resources (`controls`, 84–93) use the same property legitimately — `culture-content.ts` writes real trait contributions (e.g. `{ iron: 2 }`). **The leak is possession-catalog-side only.**
- **The effects[] vocabulary exists:** `src/types/effects.ts` defines ~39 composable primitives with resolver `src/engine/effectResolver.ts` and pure queries in `src/engine/effects/effectQueries.ts`. `anomaly-reward-catalog.ts` header: "Upgraded 2026-04-06: Migrated reachBonus/domainContributions to composable effects[]." **Several existing primitives already carry `reach` + `value`** (`PassiveEffect`, `PermanentEffect`, `DurationEffect`, `ConditionalEffect`, `effects.ts:186–218`) — but those feed the **resolution-roll** consumer via `getEffectModifierValue` (`effectResolver.ts:82–104`), not capability tiers. **No primitive feeds `computeRawScore`**, and a distinct `stat_contribution` primitive is deliberately preferable to teaching `computeRawScore` to read the existing reach effects: tier influence becomes **opt-in per item**, instead of a blanket balance shift across every already-seeded passive-effect item (`gameInit.ts:600–699`) whose values were tuned for rolls, not tiers.
- **Interface row:** `attachment-domain-contributions` — 🔴 LEAKED, deferral THR-718 (`Docs/canon/interface-map.generated.md:58`). Sibling contracts deliberately out of scope here: `attachment-edge-modifiers` (THR-723), `attachment-effects-shape-resolution` (🟢 LIVE — test shapers, the "items already shape rolls" power-budget context), `trait_grant` consumer wiring (THR-737).
- **UI substrate:** capability renders in `ProwessTab.tsx` via the shared `DomainCard` (`src/components/shared/DomainCard.tsx`) — art thumbnail + reach name + **5-tier word scale** (`DOMAIN_WORD_SCALES`, tier 0–4). `StepDots` (`src/components/shared/StepDots.tsx`) is the shared dot primitive (progress semantics: completed/current/pending). **The 5-dot capability precedent already exists:** the pre-modal agent sheet rendered a sphere-coloured capability-dot meter with `CAPABILITY_DOTS = 5` (`AgentDetailPanel.tsx:28,477–520` — orphaned dead code, cited as *precedent only*, do not touch), and sphere-influence dots render in `HexBreadcrumb.tsx:132–144`. The 5-dot scale is therefore the established capability-dot language, matching both that precedent and the 5-tier DomainCard word scale.
- `AgentDetailPanel.tsx` also renders `domainContributions` — **orphaned dead code, do not touch** (interface-map known trap).

**Verdict: extends** the effects[] vocabulary by one primitive + one pure collector, **completes** the possession-catalog migration, **retunes nothing** in trait/resource capability math, **replaces nothing** (legacy node-prop read stays for traits/resources/old artifacts).

## Engine pillar

### Systems design

1. **New effect primitive** in `src/types/effects.ts`:

```ts
// StatContributionEffect — passive capability contribution while the item is
// possessed or bonded. Feeds computeRawScore; the ONE stat substrate (user
// verdict: no bare domainContributions fills on possession entries).
export interface StatContributionEffect {
  readonly type: 'stat_contribution';
  readonly contributions: Readonly<Partial<Record<ReachDomain, number>>>;
}
```

Added to the `AttachmentEffect` union (`effects.ts:731`). Passive semantics: active while the possession edge exists; no charges, no duration (composition with `conditional`/`duration` wrappers is possible later but **out of scope** — flag as non-goal).

2. **Pure collector** in `src/engine/effects/effectQueries.ts`: `collectStatContributions(node): Partial<Record<ReachDomain, number>>` — sums `stat_contribution` entries across the node's `effects[]`; `{}` when none/malformed.

3. **`computeRawScore` hook** (`domainCapability.ts`, inside the existing `possesses`/`bonded_to` walk): after the legacy `domainContributions` read, add `total += collectStatContributions(artifactNode)[domain] ?? 0`. Additive; the legacy node-prop read **stays** (traits/resources use the same walk shape, and any modded/old artifact with real node-prop values keeps working — NFP #6).

### Graph nodes / edges

None added or modified. The primitive lives inside the existing `effects[]` property bag on possession/artifact nodes; contribution flows through existing `possesses`/`bonded_to` edges.

### Tick phases

None added or modified. `computeRawScore` is a pure read called from existing sites (capability checks, eligibility, scoring).

### Resolution logic

Capability tiers move exactly as they do for traits today: contributions are additive raw-score terms feeding the same sigmoid (midpoint ~10) — one source of truth, no parallel channel. **Power budget (user note, "tune deliberately"):** items already shape resolution *rolls* through **two** existing channels — test shapers (`collectTestShapers`, LIVE contract) *and* the reach-modifier effects (`passive`/`permanent`/`conditional` via `getEffectModifierValue`). Tier contributions stack a **third** influence on top, moving *eligibility and prose tier*. The banding below is calibrated against that total: an item that already carries a strong roll modifier should take the low end of its band (per-item judgment, justified in the PR body). A single common item never moves a tier by itself; a legendary bonded artifact visibly can.

### PRNG callouts

None — pure reads, no randomness.

## Content pillar

### Encounter templates

None touched.

### Prose tables

`mechanicalSummary` strings on migrated catalog entries updated to name their contribution ("Iron +1 while borne") so tooltips tell the truth. No new prose tables.

### Attachment content

**The migration (predicate, not a list):** every possession-catalog entry whose design intent includes capability influence — the entries that carry an empty `domainContributions: {}` bag today, plus any whose flavor text promises might/skill — gains a `stat_contribution` effect in its `effects[]`. Catalogs in scope: `reward-attachment-catalog.ts`, `anomaly-reward-catalog.ts`, `artifact-templates.ts`, `starter-attachments.ts`, `choice-set-catalog.ts` (same catalog set THR-737 names). Magnitude per item is a content judgment inside the named bands; each choice justified in the PR body (mirrors the THR-736 rule). Empty legacy `{}` bags on migrated entries may be deleted in the same pass (they are dead weight, not data). The executor records the migrated-entry count as closeout evidence.

### Data tables

`src/data/item-stat-bands.ts` (new, tiny): the power-budget bands as named constants (below) + a doc comment tying them to trait scale (culture traits: 1–2/level) and sigmoid midpoint.

## UI pillar

*Screenshot tool: **Playwright** (ProwessTab/DomainCard is DOM; no WebGL). 1920×1080.*

### Player-facing display

- **`DomainCard` gains a magnitude-dot row**: 5 dots matching the existing 5-tier word scale (tier 0–4 → 1–5 filled), rendered next to/under the tier word. Implemented by extending the shared `StepDots` with a `variant: 'magnitude'` (filled = achieved, dim = remainder, **no** current-step glow — magnitude is a level, not progress). Reuse over new component per the user's verbatim ask; tokens only (`var(--step-completed)` family), no hardcoded hex.
- Dots respect the existing reveal gating (unrevealed domains show no dots, same as `???` word).
- Item tooltips (existing `resolveAttachmentTooltip` path) surface the updated `mechanicalSummary` — no new tooltip machinery.

### Event notifications

None — tier changes already narrate through existing tier-promotion events.

### Debug inspection (DebugPanel)

No new bridge. Verification via CLI `eval`: `computeRawScore` before/after granting a migrated item to an agent (see Done when). Existing capability displays (DebugPanel agent views) pick the change up automatically.

### Visual presence (HexMapV2)

N/A — no map surface.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md — no new orchestrator phases, GameState fields, trace categories, or player controls; the one UI surface change rides an existing shared primitive.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `effects.ts` (`stat_contribution`) | none (data) | item tooltips (`mechanicalSummary`) | — | none | CLI `eval` on `effects[]` |
| `effectQueries.ts` (`collectStatContributions`) | none (pure read) | — | — | none | CLI `eval` |
| `domainCapability.ts` hook | none (read-side) | `DomainCard` dots via tier | — | none (existing tier-promotion events cover) | `computeRawScore` eval probe |
| `StepDots` magnitude variant | — | `DomainCard` in `ProwessTab` | — | — | Playwright screenshot |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `ITEM_STAT_BAND_MINOR` | `0.5` | Common/minor item contribution ceiling per reach |
| `ITEM_STAT_BAND_NOTABLE` | `1.0` | Notable/rare item ceiling per reach |
| `ITEM_STAT_BAND_LEGENDARY` | `2.0` | Legendary/bonded artifact ceiling per reach (≈ one strong trait level) |
| `MAGNITUDE_DOTS_TOTAL` | `5` | Dot count on DomainCard — matches the 5-tier `DOMAIN_WORD_SCALES` |

*(Bands are authoring guidance enforced by a content test asserting no catalog entry exceeds `ITEM_STAT_BAND_LEGENDARY` per reach — tunable without code changes.)*

## Tracing

N/A — no new writes: pure read-side capability math + data migration; tier crossings already emit existing tier-promotion events, which is where inspectability for "the item moved my tier" already lives.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `effects[]` missing/malformed on an item | `collectStatContributions` returns `{}`; contribution is 0 |
| `stat_contribution` entry with non-numeric value | Entry skipped; other entries still sum |
| Item node deleted mid-walk | Existing `if (!artifactNode) continue` guard covers |
| Both legacy `domainContributions` and new effect present on one node | Both sum (additive); content test flags double-dipping catalog entries |
| Catalog entry exceeds the legendary band | Content test fails the build — caught at author time, not runtime |

## Interface impact

*(Step 0.7 — Attachments/Possessions is an **audited** subsystem; this is the row the ticket exists to remediate. Executor updates `scripts/interface-contracts.ts` in the same PR.)*

| Contract | Action | Producer → Consumer | Notes |
|---|---|---|---|
| `attachment-domain-contributions` (🔴 LEAKED) | **extend → LIVE** | catalog `effects[]` `stat_contribution` (new write shape) → `collectStatContributions` → `computeRawScore` | Re-badge with dated `verifiedLive`; add the new symbols to the row's grep keys (`stat_contribution`, `collectStatContributions`) so both sides hit |
| `attachment-effects-shape-resolution` (🟢 LIVE) | **preserve** | test shapers unchanged | The power-budget context — untouched |
| `attachment-edge-modifiers` (🔴 LEAKED, THR-723) | **preserve (do not touch)** | — | Separate remediation; do not conflate |
| `attachment-character-sheet-display` (🟢 LIVE) | **extend** | `DomainCard` dots + updated `mechanicalSummary` | Display-side only |

## Blast Radius

*Omitted — no ≥100-importer file is touched. `effects.ts`, `effectQueries.ts`, `domainCapability.ts`, `DomainCard.tsx`, `StepDots.tsx`, and the catalogs are all below the bar (the high-impact list in CLAUDE.md § Codesight names none of them).*

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise contradicted — items-as-power is core god-game fantasy; magnitude surfaces as dots beside prose (symbol language, not raw numbers), consistent with prose-first non-negotiables; capability math stays one-substrate.
- [x] No Vision edit required.

## Rulebook impact

- [x] This plan **does** touch a rule of play at the margins: possessions now contribute to Domain Capability tiers (prerequisite math). The rulebook already describes Domain Capability gating; the executor adds one line to the relevant section noting item contributions (`[IMPL]` once shipped) in the same PR.
- [x] `Docs/canon/rulebook.md` one-line update is in the executor's scope.

> Brainstorm companion: `Docs/plans/2026-07-24-item-stat-contributions-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Band ceilings + dot count are named constants; per-item magnitudes are data entries |
| 2. Inspectability | PASS | Tier crossings already trace via tier-promotion events; eval probe named in Done-when |
| 3. Determinism | PASS | Pure reads, no PRNG |
| 4. Fail-soft | PASS | 5-row table; malformed data degrades to zero contribution, never throws |
| 5. Narrative over mechanical perfection | PASS | Dots-as-symbol-language beside prose tier words; tooltips speak prose ("Iron +1 while borne") |
| 6. Additive over destructive | PASS | New primitive + collector + additive hook; legacy node-prop read preserved; only dead `{}` bags removed |
| 7. Performance budget | PASS with note | `computeRawScore` is hot; the added walk is O(effects-per-item) over already-iterated nodes — verify no regression via the 30-tick CLI smoke |

## Done when

- [ ] CLI probe: `eval` `computeRawScore` for an agent before/after receiving a migrated item shows the contribution; a band-ceiling content test passes; migrated-entry count recorded in closeout
- [ ] 30-tick CLI smoke (`--seed 42 --map medium`) clean, no tick-time regression beyond noise (engine-smoke rule applies — `domainCapability.ts` is engine)
- [ ] DomainCard renders magnitude dots at all 5 tiers; unrevealed domains show none; Playwright screenshot at 1920×1080 + console output; sim advanced only via `window.__DEBUG.tick(n)`
- [ ] `attachment-domain-contributions` re-badged LIVE with dated `verifiedLive` + both-side symbol hits in `scripts/interface-contracts.ts`
- [ ] Rulebook one-liner added; wiki-freshness gate satisfied by a real page update if a manifest glob matches the touched catalogs
- [ ] `npm test`, `npx vite build`, `npm run check:typecheck` (ratchet), `npm run check:generated-freshness` pass
- [ ] Closing commit body + PR body include `Fixes THR-718`

## Coordination block

**Suggested model:** opus — cross-cutting engine math change (hot path) + per-item content judgments.

**Parallel-safe with:** UL tickets, THR-738, THR-721 — disjoint files.

**Mutex with:** THR-719 and THR-737 (all three edit `src/types/effects.ts` / `effectQueries.ts` / the same attachment catalogs — the converging effects[] substrate). Preferred order: **718 → 719 → 737**. Single-lane WIP makes this sequencing, not conflict.

**Files to touch:**
- Create: `src/data/item-stat-bands.ts`, content test for band ceilings, tests for collector + hook
- Edit: `src/types/effects.ts` (union + interface), `src/engine/effects/effectQueries.ts`, `src/engine/domainCapability.ts` (artifact-walk hook), `src/components/shared/StepDots.tsx` (magnitude variant), `src/components/shared/DomainCard.tsx` (dot row), the five catalogs (migration + `mechanicalSummary`), `scripts/interface-contracts.ts`, `Docs/canon/rulebook.md`

## Notes for the executor

- **Do not resurrect bare `domainContributions` fills on possession entries** — the user verdict is explicit: one stat substrate via effects[]. Trait/resource/culture uses of the property are legitimate and untouched.
- **Do not touch** `AgentDetailPanel.tsx` (orphaned), the edge-modifier path (THR-723), or `attachmentTriggers.ts` (THR-719).
- StepDots' existing progress semantics must keep working unchanged for its three current consumers — the magnitude variant is additive (default behavior identical).
- Magnitude judgments: justify per item in the PR body; a mass default is the THR-736 anti-pattern.
- `frontend-ui` skill + `Docs/design-system/` are required loads for the UI part (ticket requirement).

## Intent-judge verdict

**Revise → Allow** (2026-07-24, cold-boot Opus judge, two passes). First pass found three GAPs of one root cause (over-narrow greps): the effects union already carries reach-modifier primitives feeding *rolls* (~39 types, not ~20), the power budget under-counted existing roll channels, and a `CAPABILITY_DOTS = 5` precedent existed uncited. All three fixed inline and re-verified against source; second pass **Allow** with 0 findings. One nit fixed (union is `AttachmentEffect`, not `ItemEffect`). Proposal: `Docs/plans/.intent-proposals/2026-07-24-item-stat-contributions.md`.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-07-24*

### NFP audit

| NFP | Verdict | Evidence |
|---|---|---|
| 1. Tunability | PASS | `ITEM_STAT_BAND_MINOR/NOTABLE/LEGENDARY`, `MAGNITUDE_DOTS_TOTAL` named constants; band ceilings enforced by a content test, not hardcoded logic |
| 2. Inspectability | PASS | Reuses existing tier-promotion trace events; CLI `eval` probe on `computeRawScore` named as verification; no new opaque state |
| 3. Determinism | PASS | Pure reads only, no PRNG touched |
| 4. Fail-soft | PASS | 5-row table — malformed/missing effects degrade to `{}`/0, deleted node guarded, no throw path |
| 5. Narrative over mechanical | PASS | Dots-as-symbol beside prose tier words; `mechanicalSummary` speaks prose |
| 6. Additive over destructive | PASS | New primitive + collector + additive hook; legacy read preserved; only empty `{}` dead-weight removed |
| 7. Performance budget | PASS with note | Hot path acknowledged; added walk O(effects-per-item) over already-iterated nodes; 30-tick smoke required before commit |

NFP AUDIT: PASS [design-brief-stale — audited against CLAUDE.md § NFPs]

### Three-pillar audit

| Pillar | Verdict | Finding |
|---|---|---|
| Engine | present-and-substantive | Primitive + collector + additive hook confirmed against disk (`domainCapability.ts:71–82`); resolution logic, PRNG N/A justified, fail-soft present |
| Content | present-and-substantive | Predicate-scoped migration across 5 named catalogs, prose updates, bands data table with enforcing content test |
| UI | present-and-substantive | `StepDots` magnitude variant + `DomainCard` dot row (files confirmed), reveal gating respected, Playwright + `__DEBUG` evidence named |

No missing required sections; Blast Radius correctly omitted (verified against the CLAUDE.md high-impact list). Wiring table honest for a pure additive read-path hook. Substrate check: `## Substrate inventory` substantive; cross-checked against systems inventory (Attachments/Possessions ACTIVE) and live source; honestly framed as "extends" — no unacknowledged duplication.

PILLAR AUDIT: PASS

### Vision audit

Script ran clean. Premises: non-negotiables #2/#3/#4/#6/#7 **confirmed** (prose-first primary display via dots, graph substrate, additive, three pillars); north star / core loop / design tensions silent or consistent; `taste-profile.md` absent from worktree — unverifiable, not contradicted. One named tension, non-blocking: the tooltip example "Iron +1 while borne" carries a number, but inside the existing `mechanicalSummary` tooltip convention — the primary display stays symbolic dots.

No contradictions found.

VISION AUDIT: PASS-with-notes — tooltip-number tension + weak premise-1 citation noted for author awareness.
