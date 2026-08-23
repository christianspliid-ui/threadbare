> **title:** `Reputation unification — one social score between a and b — THR-1206`
> **linear_issue:** THR-1206
> **author:** `Claude Code`
> **created:** 2026-08-23
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# Reputation unification — one social score between a and b — THR-1206

*Reputation becomes the game's single core concept for "the social score that modifies interactions between a and b" (director ruling, verbatim, 2026-08-23) — one read API, one banded word vocabulary, one new edge family filling the two pairs no store covers, and a migration verdict for every mechanism that currently speaks the word.*

## Why this is load-bearing

The director's ruling on the Grateful Kin bond chip (THR-1205 refinement) vetoed bespoke concepts on player surfaces: *"custom concepts are difficult for players to learn and understand. if we do have reputation as our concept for 'the social score that modifies interactions between a and b', then lets use that everywhere."* Today "reputation" names **six** mechanisms that do not agree, the UL defines **none** of them, and the corpus is actively bleeding: **154 of 501 authored `reputation_tally` writes (31%) are silently discarded** on keys the engine rejects (`encounterAftermath.ts:1173`), 18 shipped chips claim `kind: 'reputation'` with no reputation-family write behind them, and the one location-standing mechanism (`standing_welcome`) is write-and-render-only — its documented consumer (`slice.kin.the_roof_opens`) was never authored. Until this lands, no chip can truthfully say "reputation in Sacred Grove", THR-1205's content half stays blocked, and THR-1182's return-visit encounter gates on a condition the director has vetoed as a surface noun.

## Substrate inventory

Verified in-session 2026-08-23 (three parallel sweeps; every claim file:line-cited in the brainstorm companion). `Docs/canon/systems-inventory.md` row: **Reputation & Influence — 🟢 ACTIVE** (aliases: reputation, influence, renown, standing; phases 6.55, 6.6, 6.634, 6.64). This plan **extends** that system and **retires into it**; nothing here is green-field.

| # | Mechanism | Store | Pairwise? | Health | Verdict (this plan) |
|---|---|---|---|---|---|
| 1 | Faction membership reputation | `member_of.reputation` (0–1), per-definition rank tiers | agent↔faction, members only | Healthy; rank/access/bonus/expulsion consumers | **KEEP** — becomes the membership leg of the concept; machinery untouched |
| 2 | World renown | `node.properties.reputationScore` (0–1, default 0.5) | one-sided | Live (death gate `agentLifecycle.ts:120`, decay, predicates, agent-card word) | **KEEP** — the degenerate "b = the world at large" leg; same banded words |
| 3 | Reach-polarity tallies → reputation traits | `reputationTallies` (16 valid keys) → 19 `subcategory: 'reputation'` traits | one-sided (what you're *known for*) | Live but leaking: 31% of writes on invalid keys, silently dropped | **KEEP the trait machinery; FIX the leak** — invalid key becomes an authoring-time gate failure, and the dead keys are re-authored to the mechanism their fiction means (deferral sweep) |
| 4 | Pairwise agent regard | `relates_to.sentiment/.trust` + `perceiveReputation()` (`reputationWalk.ts:71`) | agent↔agent | Live (agent decision loop) | **KEEP** — becomes the personal leg; the unified read delegates to it |
| 5 | `reputation_set` effect | writes `reputationScore` | one-sided | Dead content — sole authoring site is an unimported `examples/` file | **RETIRE the authoring surface** — handler stays (fail-soft for old saves), effect removed from the authoring vocabulary |
| 6 | `standing_welcome` location condition | `has_trait` on the *location* | not pairwise (property of the place) | Write-and-render-only; zero readers | **RETIRE** — replaced by the new `reputation_with` edge; definition kept read-tolerant for saved worlds, writers migrated |

**The gap the new machinery fills:** no store covers agent↔location or non-member agent↔faction. Candidate reuse was checked and rejected: `knows_of` (actor→location, zero props, ~unused) is semantically *awareness*, not standing, and overloading it would bury the concept — the same drift this plan exists to end; `member_of` means membership; `sacred_route` carries pilgrimage pooling (THR-1184). New edge family it is, under the load-bearing rule that relationships are edges, never property bags.

## Interface impact

| Contract | Action |
|---|---|
| `member_of.reputation` → rank derivation → access gates / bonuses / expulsion | **Preserve** — untouched. Note for a follow-up: two rank reads coexist (derived `meetsFactionRankRequirement` vs cached `edge.rank` in `factionAwareness.ts:127`, `reputationWalk.ts:147`, `socialLeverage.ts:132`); this plan does not unify them, it records them (executor files a deferral). |
| `reputationTallies` → `phaseReputationTraits` → reputation traits → gates/scoring/prose | **Preserve + harden** — `encounterAftermath.ts:1173` invalid-key rejection stops being silent: emit the existing trace AND fail `check:encounter` at authoring time (new content-eval rule). |
| `apply_condition` → `standing_welcome` → LocationProfileModal conditions row | **Retire** — writers migrate to `reputation_with`; the condition definition stays registered (saved-world tolerance, THR-1177/1183 pattern); the Modal's standing surface moves to the new row below. |
| **Add:** `reputation_with` edge writes → decay phase → read API → leverage / eligibility / chips / profile rows | **Add** — rows registered in `scripts/interface-contracts.ts` in the same change (production read sites named in §Engine, all shipping in this ticket — no dangling write). |
| `EncounterAftermathChange (kind: 'reputation')` → BOND chip | **Extend** — reputation chips gain truthful backing (`reputation_with` effect) and the exact-effect statement per THR-1205. |

## Engine pillar

### Systems design

New module `src/engine/reputation.ts` — the single entry point for the concept:

- `getReputationWith(graph, aId, bId): { score, band, source }` — the **one read**. Dispatch: `b` is a faction node and `a` is a member → `member_of.reputation` (`source: 'membership'`); a `reputation_with` edge a→b exists → its `score` (`source: 'edge'`); `b` is an agent with a `relates_to` a→b edge → `(trust + 1) / 2` (`source: 'bond'`); else `REPUTATION_WITH_DEFAULT` (`source: 'default'`). `band` always comes from `getReputationWord` (`src/data/domain-words.ts:122`) — **one word vocabulary for every leg**, which is what makes six stores one concept on every surface.
- `applyReputationWithDelta(graph, aId, bId, delta, tick, cause)` — the **one write** for the edge leg. Clamps to `[0,1]`, mints the edge at `REPUTATION_WITH_DEFAULT` on first write, stamps `lastChangedTick`, emits `reputation_with_changed`. Sublocation targets resolve to the parent location via `resolveToParentLocation` (three-tier rule) before writing. Deltas from authored content are capped at `REPUTATION_WITH_MAX_DELTA_PER_OUTCOME` (mirrors `FACTION_PROSE_MAX_REPUTATION_DELTA_PER_OUTCOME`).
- Membership-leg and bond-leg writes keep their existing APIs (`applyFactionReputationGain`, `relates_to` updates) — this module does not proxy writes it does not own.

### Graph nodes / edges

New edge family, registered in `src/types/graph.ts` (EdgeType union) and `src/types/edgeSchema.ts`:

| | |
|---|---|
| Type | `reputation_with` |
| Endpoints | `actor` → `actor \| location` (faction nodes are actors, so non-member faction standing needs no special case) |
| Direction / cardinality | directed, many-to-many |
| Required properties | `score` (0–1), `lastChangedTick` |

THR-1177's two generic chokepoints (`graphOpExecutor.executeAddEdge`, `strategicGraphOps.createRelationEdge`) validate the endpoints for free once the schema row exists. Edges are **sparse by design**: minted only when something happens, pruned by decay (below) — no N×M blowup.

### Tick phases

Extend **phase 6.6 (`phaseReputationDecay`)** — the existing reputation decay home: each `reputation_with` edge decays toward `REPUTATION_WITH_DEFAULT` by `REPUTATION_WITH_DECAY_PER_TICK`; an edge inside `REPUTATION_WITH_PRUNE_EPSILON` of neutral after decay is deleted with a `reputation_with_pruned` trace (fade-out is the deletion — keeps the graph sparse and the phase O(edges-that-exist)). No new phase registration.

### Resolution logic — the consumers (the acted-on test)

A write nobody reads is the THR-1154 flaw one layer down, so all three consumers ship **in this ticket**:

1. **Eligibility gate** — new optional template field `requiredReputationWith?: { atLeast: ReputationBand }` (relative to the action's target), checked in `targetActions.ts` beside the `requiredTargetTraits` gate (~`:262`) and in `encounterFilterPipeline.ts` beside the faction-rank gate (~`:415`). First production user: THR-1182's return-visit encounter re-specs from `requiredTargetTraits: ['trait.condition.location.standing_welcome']` to this gate (handoff comment on THR-1182 updates its spec).
2. **Social-scene opening leverage** — `computeInitialLeverage` (`socialLeverage.ts:157`) gains a standing term: `(getReputationWith(actor, target).score − 0.5) × REPUTATION_LEVERAGE_SCALE`, with its own `LeverageHistoryEntry` so the receipt names it. This is literally "the social score modifies interactions between a and b".
3. **Chip backing** — new aftermath effect kind `reputation_with` (`{ targetLocationId | targetAgentId | targetFactionId | sentinel, delta }`) handled in `encounterAftermath.ts` beside `faction_reputation_gain`, **added to the content-converter field allowlist** (the converter is an allowlist — an unlisted field is silently dropped), and to `CHIP_BACKING_EFFECT_KINDS` in `compositionContract.ts` so a reputation chip backed by it passes the backing gate.

Deliberately *not* in this ticket: making `computeBondModifier` pairwise (recorded as a named follow-up — it is a tuning change, separable), trade pricing (no hook exists anywhere in `src/engine/` — greenfield, out of scope), a favor call-in verb (none exists to hook).

### PRNG callouts

None. Every operation here is deterministic arithmetic on graph state; the decay phase iterates edges in graph insertion order.

## Content pillar

### Encounter templates

- **Grateful Kin (`src/data/encounters/vertical-slice.ts`)** — the triggering case: all three band writers replace `apply_condition → standing_welcome` with `reputation_with` deltas to `$target` (warm > normal > fumbled, per band, from the constants table). The four bond chips (`slice.kin.a_standing_welcome*`, `a_cooler_welcome`) restate per THR-1205's exact-effect rule: `stateNoun.text: 'reputation with {target}'`, `tooltipId: 'ui.reputation_with'`, anchor unchanged (`$target`, `visualKind: 'location'`). This unblocks THR-1205's deferred content half.
- **THR-1182 return-visit encounter** — its gate re-specs to `requiredReputationWith: { atLeast: <band> }`; that ticket's brief step is unchanged (Factory ruling 2 still applies).

### Data tables

- `ui.reputation_with` tooltip entry in `src/data/ui-content.ts` (beside `ui.standing_welcome`), chaining `{{ui.standing}}` per the existing pattern.
- `standing_welcome` definition stays in `condition-trait-content.ts` (read tolerance for saved worlds) with a deprecation comment naming this plan; `CONDITION_STANDING_WELCOME_DURATION` keeps its export until the last reader goes.
- `reputation_set` removed from authoring examples; `example.council_disowns.ts` re-authored or deleted (it is unimported).

### The two content sweeps (deferral tickets, filed at handoff with predicates)

1. **Dead-tally re-author sweep.** Predicate: any authored `reputation_tally` effect whose `key ∉ REACH_DOMAINS × {positive, negative}` (154 writes across 78 keys at survey time — the count will rot, the predicate will not). Each re-authors to the mechanism its fiction means: guild-work keys (`ac.*`, `tg.*`, `cg.*`, `ag.*`) → `faction_reputation_gain`; place/community-shaped keys (`slice.road_repute`, `community.refugee_welcome`, `route.*`) → `reputation_with`; company keys → company cohesion; pure-narrative one-offs → a valid reach key or deletion. Engine half ships **in this ticket**: a `check:encounter` content-eval rule fails any template authoring an invalid tally key, so the class cannot regrow while the sweep drains it. Also in this ticket: the three engine-authored invalid keys (`unifiedActionResolution.ts:814,830,846`) are fixed.
2. **Mislabeled chip re-kind sweep.** Predicate: any `kind: 'reputation'` chip in a file with zero reputation-family effects (18 chips in 4 files at survey time — `road-ambush`, `soul-ferryman`, `the-brink-rescue`, `the-courtyard-duel`); each re-kinds to what its backing write actually is (cast-fate / mark / hook).

### Attachment content

N/A — no attachment templates change; `standing_welcome` is a condition-trait definition (retained read-tolerant, covered under Data tables), and reputation is deliberately not an attachment.

### Prose tables

`aftermathWords.ts` key-humanisation (~`:226-252`) trims its free-form-key branch to valid keys once the sweep lands (noted in sweep ticket 1; the prose layer must not render keys the write layer refuses). `{title}` enrichment and the reputation-trait vocabulary are untouched.

### UL

New UL entry **Reputation** (Encounters or Agents shard — arbitration per the `ubiquitous-language` skill), definition verbatim from the director: *the social score that modifies interactions between a and b*, with the four legs (membership / edge / bond / renown) and a pointer that `STANDING` remains a retired display kind. Filed as a `UL-proposal` Linear issue in the executor's closeout (the UL flow, not a direct shard edit from this plan).

## UI pillar

*Screenshot tool: Playwright (DOM surfaces — modal, tabs, chips). No WebGL surface is touched.*

UI Laws engaged (judgment owed at closeout, at minimum): **1** (clickability), **13** (words, never numerals — the banded word IS the display; no percentages), **14** (no raw keys), **17** (tooltips via registry), **21** (no dead links), **37**, **56** (chips report real, inspectable writes — the visibility-parity clause is the point of the whole plan).

### Player-facing display

1. **LocationProfileModal** — new "Standing" row between prose and Conditions: *"Your name here: **trusted**"* (banded word from the single vocabulary; `Tooltip id='ui.reputation_with'`). Requires threading a viewer id (the avatar agent) through the modal's props from its call sites (`HexSidebar`, `HexDetailView`, `EncounterVeil` route) — the modal is currently entirely location-absolute. Renders only when a non-default standing exists (designed absence otherwise; a row that always says "unknown" is noise).
2. **AgentProfileModal → OverviewTab** — the existing Reputation section (world renown word) gains the agent's notable standings: top `reputation_with` edges rendered exactly like the existing faction-standing row (glyph + linked name + banded word; the `OverviewTab.tsx:396-416` pattern), knowledge-gated like its siblings.
3. **Consequence chips** — reputation chips state the exact effect per THR-1205: noun "reputation with X", counterparty anchor (all six `visualKind`s already route), delta cluster as shipped by PR #1584.
4. **FactionSheet Law 13 fix rides along** — `FactionSheet.tsx:429/577/580` leak raw percentages on a player-reachable surface; they band to the same word vocabulary in this ticket (same-concept surface, same PR — not a separate ticket).

### Event notifications

None new — the chip is the notification surface (aftermath), consistent with THR-1136's ruling that removed the tally receipt.

### Debug inspection

`window.__DEBUG.getReputationWith(a, b)` accessor (await-able, like the rest of the bridge) documented in `debug-bridge.d.ts`; decay/prune visible via the `reputation_with_*` traces in the trace viewer.

### Visual presence (HexMapV2)

N/A — no map-layer change; standing is a profile/chip concept.

## Wiring

> See checklist: `Docs/plans/wiring-checklist.md`

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `engine/reputation.ts` (read/write API) | — (called by consumers) | LocationProfileModal, OverviewTab, chips | graph edges (`reputation_with`) | `reputation_with_changed` | `__DEBUG.getReputationWith` |
| decay/prune | 6.6 `phaseReputationDecay` (extended) | — | graph edges | `reputation_with_pruned` | trace viewer |
| aftermath effect `reputation_with` | encounter aftermath (existing) | consequence chips | graph edges | `encounter_aftermath_effect` (existing) + `reputation_with_changed` | trace viewer |
| eligibility gate | encounter filter pipeline (existing) | — (gates visibility) | reads edges | existing filter traces | `__DEBUG` encounter listing |
| leverage term | social scene opening (existing) | leverage receipt | reads edges | `LeverageHistoryEntry` (existing) | leverage history |

Trace categories are registered in **all four** registration sites (the known drift trap — only the full suite catches a miss).

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `REPUTATION_WITH_DEFAULT` | `0.5` | Neutral score; the read-API fallback and the mint value (matches `DEFAULT_REPUTATION` convention) |
| `REPUTATION_WITH_DECAY_PER_TICK` | `0.001` | Drift toward neutral per tick (matches faction reputation's rate — earned standing lingers) |
| `REPUTATION_WITH_PRUNE_EPSILON` | `0.02` | Distance from neutral below which a decayed edge is deleted |
| `REPUTATION_WITH_MAX_DELTA_PER_OUTCOME` | `0.15` | Authoring cap per aftermath outcome (mirrors the faction prose cap's intent) |
| `REPUTATION_LEVERAGE_SCALE` | `2.0` | Leverage points per unit of (score − 0.5) in social-scene openings |
| `SLICE_KIN_WELCOME_DELTA_WARM / _NORMAL / _FUMBLED` | `0.12 / 0.08 / 0.04` | Grateful Kin band deltas replacing the condition intensities |

Band thresholds are **not** new constants — the single vocabulary is `getReputationWord`'s existing bands (`src/data/domain-words.ts:122`); the gate's `ReputationBand` type derives from it.

## Tracing

```ts
// reputation_with_changed — emitted on every edge-leg write
interface ReputationWithChangedTrace {
  type: 'reputation_with_changed';
  sourceId: string;      // a — whose standing
  targetId: string;      // b — with whom/where
  delta: number;
  newScore: number;
  cause: string;         // effect id / 'decay' / migration tag
}

// reputation_with_pruned — emitted when decay deletes an at-neutral edge
interface ReputationWithPrunedTrace {
  type: 'reputation_with_pruned';
  sourceId: string;
  targetId: string;
  finalScore: number;
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Write targets a missing node | trace + skip (no throw) |
| Write targets a sublocation | resolve to parent location via `resolveToParentLocation`; if unresolvable, trace + skip |
| Read with no edge / no membership / no bond | `REPUTATION_WITH_DEFAULT`, `source: 'default'` |
| Saved world predating the edge family | reads default everywhere; `standing_welcome` conditions still render (definition retained) |
| Authored delta beyond the cap | clamp to cap + trace (matches faction clamp behaviour) |
| Invalid tally key (existing leak) | unchanged at runtime (trace, no write) — **but** now fails `check:encounter` at authoring time, so it cannot ship |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/graph.ts` | 125 importers | `EdgeType` union gains one member — purely additive; exhaustive-switch sites over EdgeType (if any) surface in typecheck, covered by the ratchet |
| `src/types/unifiedAction.ts` | 278 importers | New effect kind + optional template field — additive; the converter allowlist and `check:encounter` are the two places an omission would silently no-op, both named in action items |
| `src/engine/traceBuffer.ts` | 232 importers | Two new trace categories registered here (and in the other three registration sites) — additive union members; a missed site surfaces only in the full suite, which is why the four-site rule is restated in Wiring |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. The concept strengthens "the two-way thread" (the world remembers how you and yours behaved) and player-legibility ("every primitive is clickable" — standing is now a clickable, worded primitive). Indirect-influence framing untouched: reputation belongs to mortals and communities; the god reads and nudges it, never sets it by fiat.
- [x] If it did, the Vision edit would be part of this ticket's scope — no edit needed.

## Rulebook impact

- [x] This plan changes a rule of play: a named social score gating some encounters and shifting social scenes.
- [x] `Docs/canon/rulebook.md` gains a short **Reputation** paragraph flagged `[DESIGN]` in this PR; it flips to `[IMPL]` at execution closeout.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | six named constants; band vocabulary single-sourced |
| 2. Inspectability | PASS | two new trace types, four-site registered; every write receipted |
| 3. Determinism | PASS | no PRNG anywhere in the design |
| 4. Fail-soft | PASS | table above; no new throw paths |
| 5. Narrative over mechanical perfection | PASS | banded words, never numbers; fade-out is silent (kin forget slowly), chips carry the story |
| 6. Additive over destructive | PASS with note | all additions except two deliberate retirements (standing_welcome writers, reputation_set authoring surface) — both read-tolerant, neither deletes handlers or definitions |
| 7. Performance budget | PASS | decay is O(existing edges), pruning keeps the set sparse; no per-tick N×M scan |

## Done when

- [ ] `reputation_with` edge family registered (types + schema) and validated at both THR-1177 chokepoints
- [ ] `engine/reputation.ts` read/write API with unit tests covering all four dispatch legs (membership / edge / bond / default) — both polarities per leg (a gate that never rejects is not a gate)
- [ ] Decay + prune wired into phase 6.6 with tests (decay direction, prune threshold, trace emission)
- [ ] Aftermath effect `reputation_with` handled, converter-allowlisted, chip-backing-listed; CLI/`__DEBUG` proof that resolving Grateful Kin writes the edge and the chip anchors to it
- [ ] Eligibility gate live with the both-polarity assertion; THR-1182 re-spec comment posted
- [ ] Grateful Kin bands + chips migrated; `standing_welcome` has zero writers (definition retained); THR-1205's deferred exact-effect wording ships as "reputation with {target}"
- [ ] Leverage term + history entry live
- [ ] LocationProfileModal standing row + OverviewTab standings rows + FactionSheet banding, with 1920×1080 Playwright screenshots and console capture per Browser-verify (UI-Laws judgment line citing 1, 13/14, 17, 21, 37, 56)
- [ ] `check:encounter` invalid-tally-key rule red on a fixture, green on the corpus minus the swept files' known keys (rule may carry a temporary allowlist of the 78 surveyed keys, burned down by the sweep ticket)
- [ ] Two deferral sweep tickets exist with the predicates above; UL-proposal issue filed
- [ ] `npm test` and `npx vite build` pass; types via `tsc -b` ratchet
- [ ] Closing commit body includes `Fixes THR-1206`

## Coordination block

**Suggested model:** opus — multi-system engine work with content and UI halves; the sweeps are deferred so this stays one focused ticket.

**Parallel-safe with:** THR-1201, THR-1202 (FEAR_PROSE/TURNING_POINT_PROSE tables — disjoint files); the THR-1157 shared-machinery *design* session (docs-only; no execution overlap — this ticket does not touch the anchor-type machinery and its catalog rows join when that lands).

**Mutex with:** THR-1130 batch retrofits and THR-1182 (all edit `src/data/encounters/vertical-slice.ts`); anything editing `src/engine/encounterAftermath.ts` or `src/types/edgeSchema.ts`.

**Files to touch:**
- Create: `src/engine/reputation.ts`, `src/engine/__tests__/reputation.test.ts`
- Edit: `src/types/graph.ts` (EdgeType), `src/types/edgeSchema.ts` (schema row), `src/types/unifiedAction.ts` (effect kind + gate field), `src/engine/encounterAftermath.ts` (effect handler + tally-key gate hook), `src/engine/phaseReputationDecay.ts` (edge sweep), `src/engine/socialLeverage.ts` (standing term), `src/engine/targetActions.ts` + `src/engine/encounterFilterPipeline.ts` (gate), `src/engine/unifiedActionResolution.ts` (three engine-authored invalid tally keys), `src/data/encounters/vertical-slice.ts` (Grateful Kin migration), `src/data/ui-content.ts` (tooltip), `src/data/condition-trait-content.ts` (deprecation note), `src/data/content-eval/compositionContract.ts` (backing kinds + invalid-key rule), `src/components/Game/LocationProfileModal.tsx` (+ call sites), `src/components/Game/tabs/OverviewTab.tsx`, `src/components/Game/FactionSheet.tsx`, `src/debug-bridge.ts` + `src/debug-bridge.d.ts`, `src/types/trace.ts` + `src/engine/traceBuffer.ts` (+ the other two trace-category registration sites), `scripts/interface-contracts.ts`, `Docs/canon/rulebook.md` ([DESIGN] → [IMPL] flip)

## Notes for the executor

- **Do not migrate `relates_to`, `member_of`, tallies, or `reputationScore` into the new edge.** The unification is the read API + the word vocabulary + the new edge for the two uncovered pairs. A store migration is explicitly not this ticket (strangler ruling).
- **The converter is a field allowlist** — the new effect's fields must be added there or authored content silently drops them (the known trap).
- **`stateNoun.text` is NOT enriched on the tag line** in all render paths — verify `{target}` enrichment reaches the chip tag (PR #1584 added adapter-side enrichment; confirm it covers the migrated chips).
- Latent bug found in survey, out of scope, file as deferral if not already: `secretGeneration.ts:184` reads `relates_to.properties.reputation`, which never exists — the `past_crime` branch can never fire.
- The two rank reads (derived vs cached) disagreement: record as a deferral, do not fix here.
- Band names for the gate come from `getReputationWord`'s range — do not invent a second band table.

## Intent-judge verdict

**Allow** (2026-08-23, cold-boot judge, impact class confirmed Reversible). One GAP (dimension 9, blast radius): trace-registration files (`src/types/trace.ts`, `src/engine/traceBuffer.ts` — 232 importers) were absent from Files-to-touch/Blast Radius — **fixed in this revision**. Advisory findings: the proposal's "dispatches over world renown" wording is imprecise (renown is unified by shared band vocabulary only, as this doc's mechanism table states — the plan wins); immediate-runnability sequencing accepted as an agent-owned technical verdict; the `check:encounter` authoring-gate borders External class but names its affected system and ships with a temporary allowlist, meeting that class's demand.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-08-23*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Constants table: 6 named constants (`REPUTATION_WITH_DEFAULT`, `_DECAY_PER_TICK`, `_PRUNE_EPSILON`, `_MAX_DELTA_PER_OUTCOME`, `REPUTATION_LEVERAGE_SCALE`, 3 slice deltas); bands sourced from existing `getReputationWord`, not reinvented |
| 2. Inspectability | PASS | Two typed traces (`reputation_with_changed`/`_pruned`) with `cause` field for causal trail; Wiring table matches `wiring-checklist.md` convention; `__DEBUG.getReputationWith` accessor; "four-site registration" discipline named |
| 3. Determinism | PASS | Explicit "PRNG callouts: None... deterministic arithmetic... decay iterates edges in graph insertion order" |
| 4. Fail-soft | PASS | 6-row fail-soft table; every failure traces+skips or clamps, no throw paths introduced |
| 5. Narrative over mechanical | PASS | Bands not numbers on player surfaces (Law 13 cited); FactionSheet raw-percentage leak fixed same-PR; silent fade-out framed as narrative ("kin forget slowly") |
| 6. Additive over destructive | PASS-with-note | Doc self-flags: two retirements (`standing_welcome` writers, `reputation_set` authoring surface) — both keep handlers/definitions live for saved-world read-tolerance, no store migration. Genuinely additive except removing two authoring surfaces, disclosed rather than hidden |
| 7. Performance budget | PASS | Decay declared O(existing edges) via sparse mint/prune-on-decay design; explicit "no per-tick N×M scan" claim |

NFP AUDIT: PASS-with-notes (see row 6)

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Systems design, graph edges/schema, tick phase (extends existing 6.6), resolution/consumers, PRNG callout all filled with concrete file:line references |
| Content | present-but-thin | Encounter templates, Data tables, Prose tables, UL all filled; `### Attachment content` was absent — **fixed in-revision** (explicit N/A with rationale) |
| UI | present-and-substantive | Player-facing display, Event notifications, Debug inspection filled; Visual presence correctly N/A with rationale |

Wiring check: Yes — the table connects each module to phase, component, graph field, trace, and debug surface. Substrate check: present and correctly sourced against the systems inventory ("Reputation & Influence — 🟢 ACTIVE", extends, no green-field duplication); auditor noted it is the second section rather than the literal first — informational only.

PILLAR AUDIT: PASS-with-notes (both notes resolved in this revision)

### Vision audit

Premises: north star "weight of threads" — extended; core loop — silent (operates inside existing machinery); non-negotiables #1 god-not-protagonist — confirmed (retiring the `reputation_set` fiat-write *reinforces* it), #3 prose-never-numbers — confirmed, #4 graph edges — confirmed, #6 additive — confirmed, #7 three pillars — confirmed; taste profile — no numbers, no property-bag drift. No contradictions found. All five qualitative checks clear.

VISION AUDIT: PASS

> Brainstorm companion: `Docs/plans/2026-08-23-thr-1206-reputation-unification-brainstorm.md`
