> **title:** `Motive-Receipt Foreshadowing — THR-631`
> **linear_issue:** THR-631
> **author:** Cowork
> **created:** 2026-07-05
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# Motive-Receipt Foreshadowing — THR-631

*Agent encounter-motivation prose becomes a deterministic rendering of the real decision causality the engine already computes, instead of a broken one-sentence fallback.*

## Why this is load-bearing

The foreshadowing surface (THR-389) is the player's window into a mortal's mind — the core of the portfolio-scan beat. Today it fails in four stacked ways. First, exactly one encounter template ever authored foreshadowing variants, so ~99% of reads hit the single generic fallback sentence. Second, that fallback jams the encounter *title* into a *place* slot ("Kael has heard of trouble in Weave a Political Alliance"). Third, subject–verb agreement is broken ("They believes"). Fourth — deepest — the signals feeding variant selection are fake: the tooltip path (`getEncounterForeshadowing.ts`) hardcodes `intelligenceTier: 'unknown', topMotive: 'awareness'`, and the fuller path (`encounterForeshadowing.ts`) derives "motive" from funnel filter-drop counts (a pool-filtering artifact) and "intelligence" from `completionProb` (a success forecast). None of this reflects *why the agent chose this encounter*. Meanwhile `scoreAndSelect` computes the true answer every tick — `ScoredCandidate` carries ~20 labeled contribution fields (`ambitionBoost`, `personalityBias`, `intelBonus`, `markRevealBonus`, bond/reputation/divine-influence terms, `resonance`, `hunchBonus`, `identityBiasBonus`) — and throws it away. This plan keeps it, as a **Motive Receipt**, and renders prose from it. The same receipt powers the trace (NFP #2), the tooltip, and the panel passage, and it structurally fixes the "per-encounter authoring never happens" problem by making systemic composition the floor.

User verdicts (2026-07-05, chat): full receipt redesign, phased · composition-first variety with authored overrides · tooltip + panel both stay, one source.

## Engine pillar

### Systems design

**New type — `MotiveReceipt`** (`src/types/foreshadowing.ts`, additive):

```ts
type MotiveContributionKind =
  | 'ambition' | 'personality' | 'intel' | 'mark' | 'divine' | 'bond'
  | 'reputation' | 'resonance' | 'rarity' | 'hunch' | 'doom_identity'
  | 'chain' | 'exploration' | 'proximity';

interface MotiveContribution {
  kind: MotiveContributionKind;
  weight: number;                    // normalized share of positive score mass, 0..1
  provenance?: {
    nodeId?: string;                 // ambition node, mark node, bonded agent, faction…
    interventionId?: string;         // for 'divine' — feeds the attribution chip
    detail?: string;                 // short machine label, e.g. reach id, mark template id
  };
}

interface MotiveReceipt {
  templateId: string;
  locationId: string;
  contributions: MotiveContribution[];   // top RECEIPT_TOP_CONTRIBUTIONS, ranked desc
  intelTier: 'unknown' | 'rumor' | 'briefed' | 'expert';   // from real IntelligenceRecord (THR-113), NOT completionProb
  expectation: 'doomed' | 'perilous' | 'uncertain' | 'favorable' | 'fated'; // reuse vignette forecast tiers, from completionProb
  dominantReach: ReachDomain;
  decidedAtTick: number;
}
```

**Emission.** In `phaseAgentDecision`, at the point `decision.selected` commits (~line 842), build the receipt from the winning `ScoredCandidate` by mapping its labeled fields to contribution kinds:

| ScoredCandidate field | kind | provenance |
|---|---|---|
| `ambitionBoost` | `ambition` | ambition node id + reach |
| `personalityBias` / `axiologicalScore` | `personality` | dominant value pair |
| `intelBonus` | `intel` | intelligence record id |
| `markRevealBonus` | `mark` | mark template id |
| divine value-overlay delta (`buildValueOverlay`) | `divine` | interventionId + tick |
| bond modifier (`computeBondModifier`) | `bond` | bonded agent node id |
| reputation term (`REPUTATION_SCORING_WEIGHT` path) | `reputation` | faction node id |
| `resonance` + `globalResonance` | `resonance` | sphere name |
| `rarityMultiplier` (>1 only) | `rarity` | — |
| `hunchBonus` | `hunch` | — |
| `identityBiasBonus` | `doom_identity` | doom id |
| `chainBonus` | `chain` | prior encounter id |
| `explorationBonus` | `exploration` | — |
| inverse travel-cost dominance | `proximity` | — |

Normalize positive contributions to shares; keep the top `RECEIPT_TOP_CONTRIBUTIONS` above `RECEIPT_MIN_WEIGHT`. Store on the agent node as property `motiveReceipt` (internal decision data → property, per graph rules; the agent↔encounter relationship is already modeled by the existing decision/movement structures — no new edge type, no new node type). Overwritten on each new selection; serializes with the graph.

**Unified resolver.** Collapse the two implementations into one module, `src/engine/foreshadowing/getEncounterForeshadowing.ts` (keep the richer `encounterForeshadowing.ts` internals; delete the Phase-1 stub path; both GameView and ThreadDetailView call the unified entry). Resolution order:

1. Read `motiveReceipt` from the agent node. If present and matching `(templateId, locationId)` → **compose** (below).
2. If an authored `EncounterTemplate.foreshadowing` variant matches receipt signals → use it (authored override wins over composition).
3. If no receipt (agent idle, stale, pre-receipt saves) → composed generic path using dominantReach + `unknown` intel tier — still grammatical, still varied.
4. Hard failure → existing "…" fail-soft.

**Clause composition.** Prose = deterministic assembly of typed clauses:

- **S1 — knowledge**: how the agent knows (keyed by `intelTier` × provenance kind: rumor/witness/faction word/divine sign).
- **S2 — pull**: the motive (keyed by top contribution `kind`, flavored by `dominantReach`).
- **S3 — expectation**: what they think will happen (keyed by `expectation` tier, hedged harder at low intel — this is where dramatic irony lives; at `rumor` the agent's read may be wrong, and the prose commits to *their* read, not the truth).
- **S4 (optional) — stake/misgiving**: keyed by the second contribution kind, included when its weight ≥ `STAKE_CLAUSE_MIN_WEIGHT`.

Tooltip render = S2 only (one sentence, plain register per THR-609). Panel render = S1–S3(+S4).

**Surface realizer** (`src/engine/foreshadowing/realizer.ts`, ~40 lines): clause templates use typed slots — `{place}` `{person}` `{faction}` `{matter}` `{name}` — plus verb slots `{v:believe}` conjugated from the subject's grammatical number (he/she → 3sg, they → plural; small irregulars table for be/have). A `{matter}` slot only ever receives a noun phrase; a `{place}` slot only ever receives a location name. The category error and the agreement bug become type-impossible. Slot values resolve through the existing `enrichProse()` context where applicable.

### Graph nodes / edges

No new node or edge types. One new agent-node property: `motiveReceipt` (property, not edge — it is decision-internal data, not a relationship; justified per the graph rules since no system needs to traverse from encounter → "agents who chose me for reason X"; if that need arises later, promote to an edge in its own design).

### Tick phases

Receipt emission piggybacks on the existing agent-decision phase at selection commit. No new phase. Resolver remains click-driven (never per-tick).

### Resolution logic

Contribution normalization: `weight_i = max(0, term_i) / Σ max(0, term_j)`. Multiplicative terms (`rarityMultiplier`, `noveltyMultiplier`, `desireMultiplier` components) are converted to additive deltas against their neutral value (×1.0) before normalization, scaled by `MULTIPLIER_DELTA_SCALE`. Clause selection: filter by key, pick via existing `pickTemplate(templates, seed)`.

### PRNG callouts

- Clause variant pick: `mulberry32(stableHashSeed(agentId, templateId) ^ decidedAtTick)` — same decision → same prose; new decision → fresh variety. No `Math.random()`.
- Receipt construction: fully deterministic, no PRNG.

## Content pillar

### Encounter templates

- `EncounterTemplate.foreshadowing` stays as the authored-override layer; its `when` predicates gain `topContribution?: MotiveContributionKind` (additive) and existing `topMotive` (funnel-based) is deprecated-but-tolerated (mapped best-effort, warned in validation).
- New optional template field `intentPhrase?: string` — a short noun phrase naming what the encounter *is* ("the alliance talks", "the fever in the lowlands"). Feeds `{matter}`. Fallback derivation when absent: `"what stirs at {place}"` — grammatical for every template with zero authoring. Backfill `intentPhrase` for the top-10 pool-frequency templates in Phase C.

### Prose tables

New file `src/data/foreshadowing-content.ts` (registered with the prose pipeline; entries follow the ≥3–5 variants-per-key canon rule):

- `KNOWLEDGE_CLAUSES[intelTier]` — 4 tiers × ≥5 variants.
- `MOTIVE_CLAUSES[contributionKind]` — 14 kinds × ≥4 variants; reach-flavor sub-tables for the 4 most common kinds (`ambition`, `personality`, `intel`, `divine`).
- `EXPECTATION_CLAUSES[expectationTier]` — 5 tiers × ≥4 variants, with low-intel hedge modifiers.
- `STAKE_CLAUSES[contributionKind]` — ≥3 variants per kind, optional S4.
- `INTERVENTION_ATTRIBUTION_PHRASES[interventionKind]` — retained from THR-389, now sourced from the receipt's `divine` contribution ("Your whisper, three days past — the fever was your word.").

Voice: plainspoken Malazan baseline (THR-609) — plain register for the tooltip, rationed lyricism allowed only in S3/S4 of the panel render. Short declarative sentences, one vivid detail, no exclamation marks, hedges (*has heard*, *believes*, *suspects*) mandatory below `briefed` tier. Quality bar: the five per-template questions in `Docs/canon/prose.md`.

Combinatorics check: 5 knowledge × 4+ motive × 4 expectation variants ≈ 80+ distinct three-sentence combinations per (tier, kind, forecast) cell before reach flavoring — repetition across a session becomes unlikely without any per-encounter authoring.

### Attachment content

N/A — no attachment changes.

### Data tables

No world-model.json changes. All constants in `src/engine/foreshadowing/constants.ts` (below).

## UI pillar

*Screenshot tool: Playwright (DOM surfaces — thread card tooltip and thread detail panel; no WebGL surface touched).*

### Player-facing display

- **Thread-card tooltip** (right bar, the screenshotted surface): renders the S2 pull sentence only. Constrained width, ellipsis-free (single short sentence); fix the current layout bug where tooltip text overlaps the "Auto" chip — tooltip anchors above the row and never overlaps interactive controls.
- **Thread detail / encounter pool expansion** (existing THR-389 surface): renders S1–S3(+S4) plus the intervention-attribution chip when the receipt carries a `divine` contribution. Chronicle typography as shipped.
- Both surfaces read from the same `ForeshadowingResult`; no divergent code paths.

### Event notifications

None — foreshadowing is a read surface, not an event source. (Attribution chip is in-panel, not a toast.)

### Debug inspection (DebugPanel)

- Existing `Foreshadowing` tab gains a receipt table: contribution kinds, weights, provenance ids.
- `window.__DEBUG.getForeshadowing(agentId, encounterId)` now returns `{ prose, tooltipProse, receipt, variantId, signals }`.
- New `window.__DEBUG.getMotiveReceipt(agentId)` — raw receipt for the agent's current selection.

### Visual presence (HexMapV2)

N/A — no hex-map changes.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| receipt emission (in `phaseAgentDecision`) | agent decision (existing) | — | agent node `motiveReceipt` property | `encounter_scoring` trace gains `receipt` field (additive) | DebugPanel Foreshadowing tab; `__DEBUG.getMotiveReceipt` |
| unified `getEncounterForeshadowing` | none (click-driven) | ThreadDetailView, thread-card tooltip | reads `motiveReceipt` | `foreshadowing` (existing category, `receipt` field added) | Foreshadowing tab; `__DEBUG.getForeshadowing` |
| `realizer.ts` | — | — | — | — | unit-tested; errors logged in `foreshadowing` trace |
| `foreshadowing-content.ts` | — | — | — | — | Prose QA tab (`proseQualityReport` picks up new tables) |

Delete: `src/engine/foreshadowing/getEncounterForeshadowing.ts` Phase-1 stub internals (module path retained, re-exports unified impl); `GLOBAL_FORESHADOWING_FALLBACK_TEMPLATE` and `GENERIC_FORESHADOWING_FALLBACK` single-string fallbacks replaced by the composed generic path (a pool, not a string).

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `RECEIPT_TOP_CONTRIBUTIONS` | 3 | Max contributions kept on a receipt |
| `RECEIPT_MIN_WEIGHT` | 0.10 | Contribution share below which it is dropped |
| `STAKE_CLAUSE_MIN_WEIGHT` | 0.20 | Second contribution weight required to render S4 |
| `MULTIPLIER_DELTA_SCALE` | 1.0 | Scale factor converting multiplicative score terms to additive deltas for normalization |
| `FORESHADOWING_MAX_SENTENCES` | 4 | Retained from THR-389 |
| `FORESHADOWING_MIN_SENTENCES` | 2 | Retained (panel render only; tooltip is exempt at 1) |
| `TOOLTIP_SENTENCES` | 1 | Tooltip render length |
| `INTEL_TIER_*` thresholds | retained | Re-pointed at real `IntelligenceRecord` confidence, not `completionProb` |
| `FORESHADOWING_CACHE_MAX_ENTRIES` | 256 | Retained LRU cap |

## Tracing

```ts
// Additive extension of the existing ForeshadowingResolutionTrace
interface ForeshadowingResolutionTrace {
  category: 'foreshadowing';
  tick: number;
  agentId: string;
  encounterId: string;
  receipt: MotiveReceipt | null;      // NEW — null when composed-generic path used
  compositionKeys: string[];          // NEW — e.g. ['knowledge:rumor', 'pull:ambition/gold', 'expect:perilous']
  variantPicked: string | null;       // authored override id, null = composed
  cacheHit: boolean;
}
// encounter_scoring trace: gains optional `receipt: MotiveReceipt` on the selected candidate (additive)
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| No `motiveReceipt` on agent (idle, stale, old save) | Composed generic path: dominantReach from template, intelTier `unknown` — grammatical, varied |
| Receipt templateId ≠ requested encounter | Ignore receipt, composed generic path, note in trace |
| All contributions below `RECEIPT_MIN_WEIGHT` | Keep single highest regardless; if none positive, `personality` kind with weight 1 |
| `IntelligenceRecord` missing | intelTier `unknown` |
| Clause table key missing (new kind, sparse table) | Fall back to `personality` clause pool; log `compositionKeys` gap in trace |
| `intentPhrase` absent | Derived `{matter}` = "what stirs at {place}" |
| Realizer receives unknown verb lemma | Emit lemma unconjugated (never throw) |
| Resolver throws | Existing "…" placeholder + error trace; tick loop unaffected (click-driven) |
| Old saves with `topMotive`-keyed authored variants | Best-effort mapping funnel-motive → contribution kind; unmapped variants excluded from selection, warned once |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise contradicted. Strengthens: player-as-god reading mortal minds (portfolio Beat 1), prose-first UI (mechanics communicated through narrative, never numbers — receipt weights never surface as numbers to the player), narrative-over-mechanical tiebreaker, dramatic irony through agent's own (possibly wrong) intel.

## Rulebook impact

- [x] No rule of play changes — turn structure, verbs, prerequisites, resources, encounter resolution, clocks, win/loss all untouched. This is a presentation/inspectability layer over an existing decision system.

> Brainstorm companion: `Docs/plans/2026-07-05-thr-631-motive-receipt-foreshadowing-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | All thresholds named in constants.ts (table above) |
| 2. Inspectability | PASS | Receipt = the causal trail, shared verbatim between prose, trace, and DebugPanel; `compositionKeys` make every sentence's provenance queryable |
| 3. Determinism | PASS | Seeded PRNG keyed on (agentId, templateId, decidedAtTick); receipt construction deterministic; no runtime LLM |
| 4. Fail-soft | PASS | Nine-row fallback chain; resolver click-driven, cannot crash tick loop |
| 5. Narrative over mechanical perfection | PASS | Prose renders the agent's *belief* (their intel tier), not ground truth — irony preserved by design |
| 6. Additive over destructive | PASS with note | New fields/types additive; the Phase-1 stub resolver internals are deleted (justification: it is one of two divergent implementations of the same contract — keeping both is the bug; module path and public API retained) |
| 7. Performance budget | PASS | Receipt build is O(constant fields) once per agent decision; resolver stays click-driven + cached |

## Done when

- [ ] The screenshotted failure is impossible: no encounter title ever renders in a place slot; subject–verb agreement holds for he/she/they across all clause tables (unit test sweeps every clause × pronoun)
- [ ] Tooltip and panel render from one resolver; Phase-1 stub gone
- [ ] Receipt visible in DebugPanel for a seeded agent; `__DEBUG.getMotiveReceipt('Kael')` returns ranked contributions
- [ ] 30-tick CLI smoke (engine change): receipt present on ≥80% of agents with an active selection
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` all pass
- [ ] Closing commit body + PR body include `Fixes THR-631`
- [ ] Browser-verify screenshot at 1920×1080 of tooltip + expanded panel (Playwright)

## Coordination block

**Suggested model:** `opus` — multi-pillar engine+content+UI change touching the decision phase; prose authoring quality bar applies

**Parallel-safe with:** UI-only work not touching ThreadDetailView/GameView; content work not touching prose-layer-content.ts or unified-action-templates

**Mutex with:** any change to `encounterScoring.ts` / `phaseAgentDecision.ts` (receipt emission point); any other foreshadowing work; changes to `EncounterTemplate.foreshadowing` type

**Files to touch:**
- Create: `src/engine/foreshadowing/realizer.ts`, `src/engine/foreshadowing/motiveReceipt.ts`, `src/data/foreshadowing-content.ts`, `src/engine/foreshadowing/__tests__/realizer.test.ts`, `__tests__/motiveReceipt.test.ts`, `__tests__/composition.test.ts`
- Edit: `src/engine/phaseAgentDecision.ts` (emit receipt at selection commit), `src/engine/foreshadowing/getEncounterForeshadowing.ts` (unify — becomes the single resolver), `src/engine/foreshadowing/encounterForeshadowing.ts` (fold into unified module), `src/engine/foreshadowing/genericFallback.ts` (replace strings with composed-generic pool), `src/engine/foreshadowing/constants.ts`, `src/types/foreshadowing.ts` (MotiveReceipt, additive), `src/components/Game/ThreadDetailView.tsx` + thread-card tooltip component (single resolver, tooltip overlap fix), `src/debug-bridge.ts` / `.d.ts` (getMotiveReceipt)

## Notes for the executor

- **Phase order:** A — realizer + typed slots + unify resolvers + composed-generic pool (kills every visible bug even before receipts exist). B — receipt emission + receipt-driven composition + real intel tier. C — content depth: fill clause tables to variant floor, reach flavoring, `intentPhrase` backfill top-10, authored overrides for top-3 marquee encounters. D — wiring docs, `prose-content-systems` skill section update, systemic wiring guide entry. Each phase is a separate commit; A is shippable alone.
- Do NOT surface receipt weights as numbers anywhere player-facing — prose only (prose-first UI is a hard rule).
- Do NOT re-derive motive from funnel drops anywhere; if the receipt is missing, the answer is the composed-generic path, not the old heuristic.
- `topMotive` in authored `when` predicates: map `awareness→intel`, `threat→doom_identity`, `capability→ambition`, best-effort; log unmapped.
- New UL term "Motive Receipt" — `UL-proposal` filed at design time by Cowork (see linked issue on THR-631), *before* Phase A lands the term in code (trace payload, `__DEBUG.getMotiveReceipt`, `MotiveContributionKind`). Do not edit UL shards directly; if the proposal is rejected, rename the type before merge.
- The tooltip text-overlap bug in the thread card (visible in the 2026-07-05 screenshot) is in scope for Phase A.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-07-05*

### Intent-judge (Step 8.5, ran before forked audits)

**Verdict: Revise → resolved.** All ten dimensions PASS except one GAP (dim 6, UL timing): the "Motive Receipt" UL-proposal was scheduled for Phase D, after the term would already be baked into code APIs in Phases A–B. Judge noted a rubric-strict reading (one GAP, zero violations) aggregates to Allow, and the required action was a one-line fix needing no user input. **Resolution (same session):** UL-proposal filed at design time as THR-633 (related to THR-631), plan-doc executor note updated to reflect file-proposal-before-Phase-A ordering. Optional cleanup (Linear description plan-doc path drift) also fixed in the handoff comment, which supersedes the description.

### NFP audit

**NFP AUDIT: PASS.** All seven NFPs PASS; NFP #6 PASS-with-note — Phase-1 stub resolver internals deleted, judged a legitimate exception (collapsing duplicate divergent implementations of the same contract; module path and public API retained). Tunability: full constants table. Inspectability: receipt shared verbatim across trace/tooltip/panel/DebugPanel; `compositionKeys` queryable. Determinism: seeded mulberry32, no Math.random(). Fail-soft: nine-row chain, click-driven resolver cannot crash the tick loop. Performance: O(constant) receipt build once per decision, cached click-driven reads.

### Three-pillar audit

**PILLAR AUDIT: PASS.** All three pillars present-and-substantive; wiring table complete with explicit deletion notes; Blast Radius correctly omitted (no ≥100-importer file in scope); all template sections filled with real content. One cosmetic finding (stray non-ASCII character) — fixed.

### Vision audit

**VISION AUDIT: PASS.** No contradictions. Confirms/extends: north star ("read a mortal's mind" via real causal prose), core loop (click-driven, no tick-phase intrusion), non-negotiables (god-not-protagonist intact; weights never surface as numbers), design tensions (leans into dramatic irony via agent's own possibly-wrong belief; composition-as-floor matches settled systemic-before-bespoke direction), taste profile (THR-609 plain register enforced per-surface).
