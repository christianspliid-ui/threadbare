> **title:** `Grievance supply — a harm must be seen, and a vendetta may take a want's place — THR-1383`
> **linear_issue:** THR-1383
> **author:** `Claude Code` (single-executor design session, 2026-09-02)
> **created:** 2026-09-02
> **three_pillars:** Engine `done` · Content `N/A — the minting rules table and the four grievance templates already exist; no template, prose table, or data row changes` · UI `done — one chronicle line and one arc-panel word; no new surface`

# Grievance supply — a harm must be seen, and a vendetta may take a want's place — THR-1383

*The grievance lane works end to end on a constructed scenario and mints nothing in ordinary play; two supply holes are measured here, and this plan closes both without touching the lifecycle THR-1298 shipped.*

## Why this is load-bearing

THR-1298 built the reactive loop: a harm-carrying undertaking writes an outcome node, the mint lane turns it into a drive, the drive carries heat onto the one decision board, it cools into a grudge or is answered. Slice 7's observation run reported **zero grievances minted in 300 ticks on both seeds**, and the plan's kill criterion said to surface that rather than tune it away. The rulebook now carries an honest `[DESIGN]` gap (§10.7) and the quick-reference card says *"no grievance mints in ordinary play yet"*. Until this closes, the board's urgency term, the *Blood* section of the Bonds tab, the provenance line on a drive, and the culprit-eliminated milestone are all shipped surfaces that no run ever reaches — the invisible-feature failure Vision non-negotiable #7 names.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| ambitions — `ambitionTick.ts` (`phaseAmbitionProgress`, the mint lane `gatherMintTuples` / `mintAmbitionsFromEvents`) | 🟢 ACTIVE | **extends**: the mint window is derived from the pass cadence; the free-slot gate admits a grievance-class mint by displacing a secondary want |
| grievance — `src/engine/grievance/*` (`resolveGrievanceDisposition`, `grudgeEdge`, `undertakingOutcomeNode`) | 🟢 ACTIVE | **preserves** the lifecycle (one slot, feed/replace, succession, tier, cooling, satisfaction); **extends** emission with a faction-victim routing edge |
| ambition minting rules — `src/data/ambition-minting-rules.ts` (`UNDERTAKING_MINTING_RULES`, `HARM_MAGNITUDE`) | 🟢 ACTIVE | preserves — the `grievance: true` flag on a rules row is what this plan reads |
| decision board — `decisionBoard.ts` (urgency term) | 🟢 ACTIVE (live since THR-1349) | preserves |

Runtime counts consumed (seed 42 / 99, medium, 300 ticks, live board): 12 / 12 culprit-carrying `undertaking_outcome` nodes; every victim an autonomous spotlight mortal holding 2 active ambitions; 3 / 6 of them inside a mint window.

## The measurement this plan stands on

Re-run on the current tip (the live board, post-THR-1349), 300 ticks, medium, both seeds, reading every `undertaking_outcome` node that carries a culprit:

| | seed 42 | seed 99 |
|---|---|---|
| culprit-carrying harms | 12 (11 `network_severed` @0.5, 1 `property_destroyed` @0.8) | 12 (7 `network_severed`, 5 `property_destroyed`) |
| victim is an autonomous spotlight mortal | 12 / 12 | 12 / 12 |
| victim holds 2 active ambitions at the time | 12 / 12 | 12 / 12 |
| harm falls inside a mint window | **3 / 12** | **6 / 12** |
| grievances minted | 0 | 0 |

Two holes, and both are structural rather than tunable:

1. **A harm has to be seen, and two-thirds are not.** Minting runs inside `phaseAmbitionProgress`, which runs on `MILESTONE_CHECK_INTERVAL` (15), and the mint pass itself is gated on `AMBITION_REEVAL_INTERVAL` (25) — so a mint pass happens every **75** ticks (the LCM), while `MINT_LOOKBACK_TICKS` is **25**. The windows `[50,75]`, `[125,150]`, `[200,225]`, `[275,300]` cover one tick in three. A harm at tick 142 or 197 is never offered to anyone. This predates THR-1298 (it is THR-726's window against THR-726's cadence) and it throttles the encounter-outcome mints too.
2. **A vendetta cannot get past two wants.** The mint pass runs only when `currentActiveCount < MAX_ACTIVE_AMBITIONS` (2). Under the live board every spotlight mortal pursues two ambitions — that is what the board is for — so the gate is closed for every victim, on both seeds, all run. The one-slot rule THR-1298 shipped governs grievance-against-grievance; nothing lets a grievance in against a want, which inverts the urgency the board then gives it.

The ticket's original count (6 of 13 victims were factions) was measured under contest B; under the live board no faction was a victim in 300 ticks on either seed. The faction routing is kept because it is cheap and the class exists; it is not what the supply depends on.

## Blast Radius

One touched file clears the ≥100-importer bar: `src/types/trace.ts` (115 importers per `.codesight/graph.md` at drafting). The edit is one new member on the `TraceEvent` union plus its interface — purely additive, so no importer's existing narrowing changes. Two things the executor must still do because of the count, not despite it:

| File | Importers | Edit | Why it cannot break an importer | Gate |
|---|---|---|---|---|
| `src/types/trace.ts` | 115 | add `AmbitionDisplacedTrace` to the union | additive union member; no importer narrows exhaustively on trace type without a default (`traceBuffer` consumers switch on `category`, not on the full union) | `npm run check:typecheck` must report the ratchet unchanged — a *rise* means an exhaustive switch exists somewhere and needs the new arm |
| `src/engine/traceBuffer.ts` (registration) | ~100 | `TRACE_CATEGORIES` entry | table row | same |
| `src/engine/ambitionTick.ts` | <20 | logic | — | unit + CLI smoke |
| `src/engine/grievance/undertakingOutcomeNode.ts` | <10 | one edge write | — | unit |

The four-site registration rule for a new trace type (union, `TRACE_CATEGORIES`, the trace viewer's category list, the CLI `traces` filter) is what turns a 115-importer edit into a build failure if half-done; the Done-when names the four so the executor cannot ship three.

## Engine pillar

### Systems design

Three moves, all in `ambitionTick.ts` and `undertakingOutcomeNode.ts`; the lifecycle module is untouched.

**1. The mint window is derived from the mint cadence.** Replace the literal `MINT_LOOKBACK_TICKS = 25` with a value derived from the two cadences it has to tile: `MINT_LOOKBACK_TICKS = lcm(MILESTONE_CHECK_INTERVAL, AMBITION_REEVAL_INTERVAL)` (= 75 at the shipped values), computed once at module load from the exported constants so a retune of either interval cannot re-open the gap. The windows then tile the timeline: every event node is inside exactly one pass's window. The per-event cap (`MINT_MAX_PER_EVENT`), the per-agent one-mint-per-pass rule and the seeded gate are unchanged; a wider window means more *candidates* per pass, not more mints per agent. **This also applies to the encounter-outcome mints** (THR-726), which were throttled by the same gap — recorded as a consequence, not hidden.

**2. A grievance-class drive may displace a secondary want.** There are two `currentActiveCount < 2` gates in `ambitionTick.ts` (both a literal `2`; replace with `MAX_ACTIVE_AMBITIONS` when touched — NFP #1): the **mint-block** gate (`:747`) and the spontaneous-re-evaluation gate (`:847`). Only the mint-block gate opens: the mint pass runs when a slot is free **or** the tuples on offer include a culprit-carrying undertaking harm at or above `GRIEVANCE_DISPLACE_MIN_MAGNITUDE`; the spontaneous gate stays closed for a full mortal. `mintAmbitionsFromEvents` gains a `slotsFree: boolean` input; when no slot is free it restricts the candidate set to rows flagged `grievance: true` (a full mortal is never offered a *rebuild* or *guard* drive into a slot they do not have — only a vendetta earns eviction) and the existing temperament funnel picks as today. If it returns a grievance-class assignment and the disposition says `write`, the lane **displaces**: the mortal's `secondary` non-grievance `pursues` edge closes as `abandoned` with `abandonedReason: 'displaced_by_grievance'` and the existing `resolvedTick`, traced (`ambition_displaced`, one per event) and told to the chronicle for a spotlight mortal. The primary is never displaced — it is the identity drive the calling reads, and exactly one of a mortal's two wants is primary by construction, so the secondary is always the one that yields. A mortal already holding a grievance never reaches this branch: `findActiveGrievanceEdge` is consulted first and the one-slot rule (feed / replace) applies unchanged. Determinism: the displaced edge is the secondary; there is at most one.

**3. A faction's harm reaches its leader.** In `createUndertakingOutcomeNode`, when `victimAgentId` resolves to an actor whose `actorType` is `faction`, a second `participated_in { role: 'target', viaFactionId }` edge is written from `getFactionLeaderId(faction)` when a leader exists. The mint lane then sees the harm as the leader's victim relation with no further change; the disposition's tier rule decides whether the leader carries a vendetta or a grudge. The faction's own edge stays (it is the honest record). Provenance prose reads *"the razing of Thornhall — their guild's hall"*: `composeHarmLabel` gains the `viaFactionId` name when present.

### Graph nodes / edges

No new node or edge types. `PursuesEdgeProperties` gains optional `abandonedReason?: 'displaced_by_grievance'` (additive; the arc panel reads it for one word); the close timestamp reuses the existing `resolvedTick?`. `participated_in` gains optional `viaFactionId?: string` (additive; the schema's required `role`/`outcome` untouched).

### Tick phases

`ambition_progress` (post-economy) as today — no new phase, no new all-actor walk. Emission stays in `phaseStrategicProjects`.

### Resolution logic

Displacement is deterministic (the single secondary). Candidate restriction to `grievance: true` rows is a filter on the existing rules table. Everything after `mintAmbitionsFromEvents` returns — disposition, edge write, provenance — is the shipped path.

### PRNG callouts

None new. The mint gate and selection keep their seeded stream (`state.seed + tick + actor.id.length + MINT_SEED_OFFSET`). No `Math.random()`.

## Content pillar

Content: N/A — the rules table already flags which rows are grievance-class and the four grievance templates exist (`GRIEVANCE_AMBITION_TEMPLATES`). The provenance label gains a faction clause from data already on the node.

## UI pillar

*Screenshot tool: Playwright (DOM) — the arc panel's abandoned list; substitution by jsdom render if a dev server is refused.*

### Player-facing display

- **Arc panel (`JourneyTab`)** — an abandoned ambition whose edge carries `abandonedReason: 'displaced_by_grievance'` reads *"set aside for a vendetta"* in place of the generic abandonment word. One word in an existing list; Laws 13/14 (words, never the key), 17 (existing tooltip pattern), 21.
- **Chronicle** — one `TickEvent` at `GRIEVANCE_DISPLACE_EVENT_SIGNIFICANCE` (0.6) for a spotlight mortal: *"Oswen sets aside the granary to seek revenge on Maerin."* Rides the existing `ambition_milestone`-style event path; nothing new renders it.
- The provenance line, heat words, and the Bonds tab's *Blood* section (THR-1298 slice 7) are the surfaces this supply finally reaches; unchanged.

### Event notifications

The chronicle line above. No toast — a displacement is a texture beat, not an interrupt (the follow/moment stream of THR-1299 covers undertakings, not drives).

### Debug inspection (DebugPanel)

`__DEBUG.getGrievances()` already lists grievance edges; the `ambition_displaced` trace joins the trace viewer. The CLI `agent <name>` block already shows the grievance and grudge state.

### Visual presence (HexMapV2)

None.

## Wiring

> See checklist: `Docs/plans/wiring-checklist.md` — no new phase, modal, GameState field, or player control; one new trace category (`ambition_displaced`) registered at the four sites (union, `TRACE_CATEGORIES`, debug viewer label, CLI `traces` filter — the THR-1298 `grievance_transition` precedent).

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `ambitionTick.ts` (window derivation, displacement) | `ambition_progress` | `JourneyTab` (one word) | `pursues` edge props (`abandonedReason`) | `ambition_displaced`, `ambition_minted` (existing) | trace viewer, CLI `agent` |
| `undertakingOutcomeNode.ts` (faction → leader edge) | `phaseStrategicProjects` | — | `participated_in` edge props (`viaFactionId`) | `undertaking_outcome` (existing) | CLI `events` |
| `agentDetail.ts` (reads `abandonedReason`) | — | `JourneyTab` | — | — | — |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `MINT_LOOKBACK_TICKS` | `lcm(MILESTONE_CHECK_INTERVAL, AMBITION_REEVAL_INTERVAL)` = 75 (from 25) | The window a mint pass reads; derived so the windows tile the cadence and every harm is seen exactly once |
| `GRIEVANCE_DISPLACE_MIN_MAGNITUDE` | `0.5` | The lightest harm that may evict a secondary want — `network_severed` (0.5) qualifies, so both seeds have supply; the temperament funnel still decides whether the mortal *wants* revenge |
| `GRIEVANCE_DISPLACE_EVENT_SIGNIFICANCE` | `0.6` | Chronicle weight of a displacement for a spotlight mortal |
| `GRIEVANCE_SHARE_CEILING` (census, reported + gated) | `0.35` | Kill-criterion tripwire: grievance-class edges as a share of all active `pursues` edges on autonomous mortals at 300 ticks |

## Tracing

```ts
// ambition_displaced — emitted once per displacement, when a grievance-class mint
// closes a secondary want to take its slot (THR-1383).
interface AmbitionDisplacedTrace extends TraceBase {
  category: 'ambition_displaced';
  agentId: string;
  displacedTemplateId: string;      // the want that closed
  grievanceTemplateId: string;      // the vendetta that took the slot
  culpritAgentId: string;
  harmMagnitude: number;
  sourceEventId: string;
}
```

The existing `ambition_minted` aggregate gains nothing; `grievance_transition` is emitted by the lifecycle as today.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| `lcm` of the two intervals is absurd (one interval 0 or non-integer) | Fall back to the larger interval; never a window of 0 — a `console.warn` once at module load |
| Full mortal, grievance-class candidate, disposition returns `write: false` (grudge only / heat fed) | Nothing displaced — displacement happens only after the lifecycle says a `pursues` edge is owed |
| No secondary non-grievance edge to displace (a full mortal whose second slot is already a grievance — the one-slot rule routes that case to feed/replace first, so this branch is guarded rather than expected) | Skip the mint for this pass and count the event against its per-event cap; never write a third active edge |
| Faction victim with no leader | Faction edge only, as today; no throw |
| `viaFactionId` names a node that no longer exists at provenance time | Label falls back to the plain harm label |

## Kill criteria

- If the 300-tick runs after this lands show a **vendetta monoculture** — grievance share of active drives above `GRIEVANCE_SHARE_CEILING` on either seed — raise `GRIEVANCE_DISPLACE_MIN_MAGNITUDE` to exclude `network_severed` (0.6) and re-measure; if still over, the displacement rule is wrong and the flag goes back to the design session, not to a fourth threshold.
- If the runs still mint **zero** with both holes closed, the supply is thinner than the emitters suggest (e.g. every harm lands on a mortal already holding a hotter grievance) and that is a finding for THR-1300's kind rows, surfaced on the issue rather than tuned.
- If widening the window to 75 makes the encounter-outcome mints (THR-726) crowd out the world's own re-evaluation — measured as the share of spontaneous (non-minted) assignments falling below a quarter of all assignments — the window derivation stands and `MINT_BASE_CHANCE` is the knob, recorded on the issue.

## Interface impact

| Contract (`interface-map`) | Action |
|---|---|
| `world-events-mint-ambitions` (🟢 LIVE — `AMBITION_MINTING_RULES`, `mintAmbitionsFromEvents`) | **extend** — the window derivation and the `slotsFree` input; same producer, same consumer |
| the two THR-1298 grievance contracts (`grievance-*`, 🟢 LIVE) | preserve — lifecycle untouched |
| `ambition-acquisition` (🟢 LIVE) | preserve |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar N/A with rationale
- [x] UI pillar present (one word, one chronicle line)
- [x] Wiring section connects them

## Vision audit

- [x] If it contradicted a premise, the Vision edit would be in scope — none is owed.
- [x] This plan does not contradict a Vision premise. It leans on the north star's *weight of threads* (a wrong done to a mortal must be able to move them) and tension #2's authored-moment side: a vendetta taking a want's place is a chapter, and the chronicle says so.

## Rulebook impact

- [x] The rulebook changes: §10.7's *"A vendetta cannot currently displace an ordinary want, only another vendetta"* `[DESIGN]` gap flips to `[IMPL]` with the new rule (*a heavy enough harm sets a lesser want aside*), and the quick-reference card's *Supply gap* line is removed — in the closing PR, with the measurement.
- [x] `Docs/canon/rulebook.md` is updated in the same PR (the closing one).

> Brainstorm companion: `Docs/plans/2026-09-02-thr-1383-grievance-supply-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | The window is derived from two named cadences; the threshold, the significance and the ceiling are named constants |
| 2. Inspectability | PASS | One new trace, registered at all four sites; the census reports the grievance share |
| 3. Determinism | PASS | Displacement picks the single secondary; no new random draws |
| 4. Fail-soft | PASS | Table above; the lifecycle's own refusals still stop a write |
| 5. Narrative over mechanical perfection | PASS | A vendetta that sets a want aside is the story the reactive loop was built for |
| 6. Additive over destructive | PASS | Two optional edge props, one derived constant, one trace; nothing removed |
| 7. Performance budget | PASS | Same walk, same cadence. The wider window's cost is measured, not assumed: the harm probe counted **12** undertaking-harm outcome nodes per seed across 150 ticks (seeds 42 and 99), so a 75-tick window reads at most ~6 more nodes per pass than the 25-tick one — three-fold over a population of a dozen, on a pass that runs once every 75 ticks. Not a profiler-visible quantity; the kill criterion is the tick-time budget the CLI smoke already reads |

## Done when

- [ ] `MINT_LOOKBACK_TICKS` derived from the cadences; a test pins that the windows tile (`lcm` at the shipped values = 75) and that a harm at every tick offset within a cadence is offered exactly once
- [ ] Displacement: a full spotlight mortal harmed at ≥ `GRIEVANCE_DISPLACE_MIN_MAGNITUDE` mints a grievance-class drive and closes the secondary want with `abandonedReason`; a full mortal offered only soft drives mints nothing; a mortal already holding a grievance takes the feed/replace path unchanged — each pinned, each falsified once
- [ ] Faction victim's harm reaches the leader via `participated_in { role: 'target', viaFactionId }`; provenance names the faction
- [ ] **300-tick runs, seeds 42 and 99: grievance mint count non-zero on both, chain-depth distribution reported, grievance share ≤ `GRIEVANCE_SHARE_CEILING`** — pasted to the issue, replacing the all-zero baseline
- [ ] Rulebook §10.7 + quick-reference updated; `ambition_displaced` in the trace viewer; the arc-panel word rendered (jsdom render evidence, Laws 13/14/17/21)
- [ ] `npm test`, `check:typecheck`, `vite build`, 30-tick CLI smoke, `npm run test:heavy` locally (engine diff)
- [ ] Closing commit body includes `Fixes THR-1383`

## Coordination block

**Suggested model:** opus — the displacement rule sits inside a 900-line phase with three interacting gates; the constants are trivial, the ordering is not.

**Parallel-safe with:** THR-1387 (`strategicActionCandidates.ts`, the census), THR-1300 / THR-1381 (plan-doc authoring), anything UI-only.

**Mutex with:** anything editing `src/engine/ambitionTick.ts` or `src/engine/grievance/*` (the mint gate and the emission site); `src/engine/agentDetail.ts` for the one-word read.

**Files to touch:**
- Edit: `src/engine/ambitionTick.ts` (window derivation, `slotsFree`, displacement), `src/engine/grievance/undertakingOutcomeNode.ts` (leader edge), `src/data/grievance-constants.ts` (three constants), `src/types/ambition.ts` (`abandonedReason`), `src/types/trace.ts` (+ the three sibling registration sites — comment-and-union edits on a 115-importer file, additive), `src/engine/agentDetail.ts` + `src/components/Game/tabs/JourneyTab.tsx` (the word), `scripts/undertaking-census.ts` (grievance share line), `Docs/canon/rulebook.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/ubiquitous-language/Agents.md` (the Grievance entry gains one sentence: a heavy enough harm may take an ordinary want's slot — or fold it into the still-open THR-1379 UL-proposal), wiki `agents-reference` (mint cadence and displacement sentences)

## Notes for the executor

- The window derivation must read the *exported* constants, not copy 75 — the whole point is that a retune of either interval cannot reopen the gap.
- Displacement runs **after** `resolveGrievanceDisposition` says `write: true`, never before: a grudge-only disposition must leave the secondary want standing.
- Do not widen the tier rule or the one-slot rule — both are Christian-visible design (the tier rule is a standing veto invitation on THR-1298).
- The 300-tick runs are the acceptance; run them with the CLI or a `.cache` probe, paste the counts, and report the chain-depth distribution even if it is all zeros.

## Forked-audit verdicts

Three independent auditors (NFP / three-pillar / Vision), run 2026-09-02 on this draft after the intent-judge's Allow. The two notes were applied before commit: the `## Blast Radius` section above was added for the 115-importer `src/types/trace.ts` edit, and NFP #7 now cites the harm probe's measured node count instead of asserting boundedness.

**NFP audit — PASS-with-notes.**

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Constants table names all four levers (`MINT_LOOKBACK_TICKS` derived, `GRIEVANCE_DISPLACE_MIN_MAGNITUDE`, `_EVENT_SIGNIFICANCE`, `_SHARE_CEILING`); the two literal `2` gates are flagged for `MAX_ACTIVE_AMBITIONS` replacement |
| 2. Inspectability | PASS | New `ambition_displaced` trace registered at the four sites; wiring table matches `wiring-checklist.md`; census gains a grievance-share line; kill criteria are measured, not assumed |
| 3. Determinism | PASS | Displacement picks the single secondary; no new random draws; mint gate keeps its seeded stream |
| 4. Fail-soft | PASS | Five-row table (lcm degenerate case, `write:false` no-op, no-secondary guard, leaderless faction, dangling `viaFactionId`) — each names a concrete fallback, never a throw |
| 5. Narrative over mechanical | PASS | Ties to the north star ("weight of threads"); displacement framed as an authored chronicle beat |
| 6. Additive over destructive | PASS | Only optional edge props + one derived constant + one trace; the grievance lifecycle module untouched |
| 7. Performance budget | PASS-with-note | *At audit:* boundedness asserted, no measured read count. *Applied:* the row now cites the harm probe (12 nodes per seed per 150 ticks) |

**Three-pillar audit — PASS-with-notes.** Engine present-and-substantive; Content N/A-with-rationale (rules table already flags grievance-class rows, four templates exist, only a provenance-label reuse); UI present-and-substantive (display, notifications, debug inspection, explicit "None" for visual presence). Wiring table connects `ambitionTick.ts` and `undertakingOutcomeNode.ts` to phase, component, GameState field, trace and debug surface. Substrate check clean: all four named substrates (`ambitions`, `grievance`, `ambition-minting-rules.ts`, `decisionBoard.ts`) match `Docs/canon/systems-inventory.md` verbatim, all 🟢 ACTIVE, dispositions extend/preserve — no green-field duplication. *Note at audit:* `## Blast Radius` missing for the self-reported 115-importer file. *Applied:* section added.

**Vision audit — PASS.** Premises touched: `00-north-star` "weight of threads" (confirmed — displacement makes an over-full thread portfolio cost something); `02-non-negotiables` #2 narrative over mechanical, #4 graph edges, #6 additive, #7 three pillars (all confirmed); `03-design-tensions` #2 emergence vs. authored moments (confirmed, named — the chronicle line earns the authored counter-pull); `taste-profile` prose-first UI and edges-not-property-bags (confirmed). No contradictions. Five checks: north star yes; core loop preserved (background mint, no change to scan → encounter → aftermath); non-negotiables clean (the god never picks the displacement, the temperament funnel does); tensions balanced; taste respected. The mechanical `vision-audit` script flagged one named-without-citation premise (NFP #5) and noted `Docs/design-brief.md` has no "Vision summary" section — pre-existing, outside this plan's scope.
