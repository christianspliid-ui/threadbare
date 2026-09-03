> **title:** `The covet rivalry — what a mortal cannot take, they come to hate (THR-1388)`
> **linear_issue:** THR-1388
> **author:** `Claude Code`
> **created:** 2026-09-03
> **three_pillars:** Engine `done — one seeding rule on the refusal path, one edge writer, one trace` · Content `done — the conquer-territory profile reordered so its destroys are proposed at all` · UI `N/A — the rivalry surfaces through the existing hostility line on the mortal sheet and the existing moment card; no new surface (see § UI pillar)`

# The covet rivalry — what a mortal cannot take, they come to hate (THR-1388)

*The reactive loop's raw supply is zero on the default seeds because the motive gate is asked for a quarrel and the world never writes one; this plan lets coveting write it.*

## Why this is load-bearing

THR-1383 gave the grievance lane its mint window, its displacement and its faction → leader routing, and proved them on constructed scenarios. On seeds 42 and 99 the lane has nothing to read: **zero culprit-carrying harms in 300 ticks**, so no vendetta is ever minted, so `ambition_seek_revenge` — the ambition that names seven of the nine harm-capable templates — is never on any board. The pilot batch of the undertaking factory (THR-1300 slice 5) adds four more motive-gated destroys, and every one of them would meet the same wall. This plan measured *where* the supply dies rather than loosening the gate, and the answer is not the gate.

**The measurement (three `.cache` probes on the real `initializeGameState → runTick` pipeline, 300 ticks, medium map; the corrected runs, after the first pair read the wrong actor key off the board trace):**

| | seed 42 | seed 99 | seed 123 |
|---|---|---|---|
| culprit-carrying harms | 0 | 0 | 5 |
| grievance `pursues` edges | 0 | 0 | 2 |
| `ambition_seek_revenge` ever on a board | no | no | yes |
| harm-capable templates named by an ambition that reached a board | 4 of 9 | 4 of 9 | 9 of 9 |
| `no_motive` refusals of harm-capable templates | 624 (3 mortals, 18 targets) | 1168 (6 mortals, 28 targets) | 1787 (+7 others) |
| of those: actor in a faction, owner a faction, factions **not rival** | 712 of 795 owner slots | 687 of 1655 | — |
| of those: actor unaffiliated | 38 | 698 | — |
| owner slots that were a *faction* | 795 of 891 | 1655 of 2036 | — |
| mortal → mortal `hostile_to` edges at tick 300 | 9 | ~12 | 12 |
| faction rival pairs at tick 300 | 31 | 27+ | 34 |
| `strategic_blockade_route` / `strategic_raze_settlement` ever proposed | never (list positions 9 and 10 of 10 in `ambition_conquer_territory`) | never | blockade 4 started, 4 completed |
| harm-capable undertakings **started / completed** | 0 / 0 | 0 / 0 | 14 / 5 (expose_cache 7/0, blockade 4/4, raid 2/0, suborn 1/1) |
| removed by the **per-mortal cap** (`active_cap` refusals on a harm-capable template) | 65 | 135 | 244 |
| removed by the **variety penalty** | 0 — no harm-capable candidate reached the final board's top list at all (`decision_board_comparison.boardTop`), so the penalty had nothing to act on | 0 (same) | penalty applied on the final board, not measurable as a refusal; 14 starts happened through it |
| removed by `recent_duplicate` | 0 | 0 | 31 |

Three findings, in order of weight:

1. **The gate is starving, not tight.** Every `no_motive` refusal on the quiet seeds is a conqueror aiming at a faction-owned garrison or warehouse whose faction is simply not rival to theirs. Faction rivalry exists (31 pairs) but the conqueror's own faction is rarely one of them, and mortal-to-mortal `hostile_to` is written by exactly two systems — mentorship breaks and the grievance lane itself. The loop's seed input is its own output.
2. **Leader-as-owner is dead on arrival** — the one retune that mirrors THR-1383's victim routing on the read side was run as a controlled arm: with the owning faction's *leader* also counted as an owner, **zero** of 624 refusals on seed 42, **two** of 1168 on seed 99 (both `contested_ambition`, one pair) and **nine** of 1787 on seed 123 (`rivalry`, one pair) would have passed. The leaders hold no quarrel with the conquerors either.
3. **Two of the four reachable destroys are never proposed.** `strategic_blockade_route` and `strategic_raze_settlement` sit at positions 9 and 10 of a ten-entry profile whose walk breaks at `STRATEGIC_MAX_CANDIDATES_PER_AMBITION = 5`; the THR-1309 measurement already recorded this shape for `strategic_suborn_warband`. On seed 123 the blockades that did fire came from a commander whose faction was at war.

**The decision (Done-when 2, named here):** retune by *seeding a quarrel from coveting*, not by widening a motive. A mortal pursuing a destroy-heavy ambition who is refused a destroy against the same owner often enough comes to hold a rivalry with that owner. One `hostile_to` edge, basis `covets`, written by the world on the refusal path, read by the gate exactly as every other rivalry is read. The alternative — accept that harm is rare on quiet seeds and move the reactive loop's acceptance surface to seed 123 — is recorded in the companion and rejected: it would leave the two seeds every reviewer opens without a single vendetta in a season, and the pilot batch's four new destroys would ship into the same silence.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Ambitions & Undertakings (candidate generation, `generateStrategicCandidates`, the motive gate `undertakingMotive.ts`) | 🟢 ACTIVE | **extends** — the refusal path gains a counter; the gate itself is untouched |
| Grievance lane (`grievance/grudgeEdge.ts`, `hostile_to` with provenance) | 🟢 ACTIVE | **extends** — a sibling writer `writeCovetRivalry` beside `writeGrudge`; the edge shape is the existing one, provenance `covets` reads as *rivalry* (non-injury) by the gate's existing `isInjuryProvenance` rule |
| Faction network (`areFactionsHostile`, `relates_to.isRival`) | 🟢 ACTIVE | **untouched** — measured as the wrong lever (faction pairs exist; they are not the conqueror's) |
| Decision phase (`phaseAgentDecision`, the `strategic_candidate_board` trace) | 🟢 ACTIVE | **extends** — the refusals already in hand feed the counter |
| Census gates (`census:undertakings`: vendetta share ≤ `GRIEVANCE_SHARE_CEILING`) | 🟢 ACTIVE | **cites** — the acceptance envelope, unchanged |

Population consumed at runtime: the mortals the board refuses a destroy — 3 on seed 42, 6 on seed 99 in 300 ticks (probe, corrected run). The rule fires for a handful of mortals a season, which is the point: a rivalry is a story, not a statistic.

## Engine pillar

### Systems design

**The covet counter.** When `generateStrategicCandidates` refuses a template with `no_motive:<targetId>` (owned target, no quarrel — never `no_motive_unowned`), and the actor's active ambition profile lists `destroy` among `preferredVerbs`, the refusal is recorded on the actor: `properties.covet = { ownerId, count, sinceTick, targetId }` — one live record per mortal (the most recently refused owner replaces an older one only when its count is below `COVET_SWITCH_BELOW`). The record is written in `phaseAgentDecision` from the refusals the board trace already carries — no second walk.

**The seed.** When `count` reaches `COVET_RIVALRY_THRESHOLD` boards, `writeCovetRivalry(graph, actorId, ownerId, tick, { targetId })` writes `hostile_to` actor → owner with `cause: 'covets'`, `since`, `sourceTargetId`. The gate then licenses the actor's destroys against that owner under `rivalry` on the next board — nothing else changes: the board still ranks, the variety penalty still applies, the per-mortal cap still holds. The record is cleared on write.

**Bounds.** At most `MAX_COVET_RIVALRIES_PER_ACTOR = 1` live covet edge per mortal; a second covet cannot form while one stands. The ascendant is never a covet target (the god has no holdings a mortal can raid; `victimAgentId === ascendantId` already refuses harm on the other side). An owner that is the actor's own faction is never coveted (the `SAME faction` rows in the histogram). A covet edge is not an injury: the gate names it `rivalry`, never `grudge`, so it cannot mint a vendetta by itself — only the harm it licenses can.

**No decay.** A covet rivalry stands until a harm turns it into a grudge through THR-1383's existing path, which is the loop closing — the same rule every other `hostile_to` already obeys (the UL's Grudge entry: *it never fades*). An earlier draft gave the edge a TTL riding "the grievance-cooling sweep"; the intent judge found there is no such exit — `grievance_cooled` is a `writeGrudge` call when a vendetta cools, not an edge removal, and no `hostile_to` is ever removed anywhere — so the TTL and its constant are gone rather than designed. If a standing covet ever proves to over-supply (the vendetta-share kill criterion), decay is designed then, with its own phase and trace, not assumed.

### Graph nodes / edges

No new node or edge type. `hostile_to` gains one more provenance value (`cause: 'covets'`) beside the three older writers' values — `group_engagement` and `grievance_cooled` under `cause`, `mentorship_break` under `basis`; the gate reads all three keys — and `GRUDGE_PROVENANCE` is **not** extended, which is what keeps a covet a rivalry. The UL disagreement this creates (the Grudge entry calls every provenance-stamped `hostile_to` a grudge; the gate and this plan call the non-injury reading a rivalry) is filed as a `UL-proposal` — see § Notes for the executor. The counter lives in `actor.properties.covet` — a property, not an edge, because it is internal bookkeeping about one mortal's frustration, not a relationship; the relationship is the edge it becomes.

### Tick phases

`phaseAgentDecision` (the refusals are in hand there, on the line that emits `strategic_candidate_board`). No new phase.

### Resolution logic

Threshold on a count, no probability. Deterministic by construction: the same refusals in the same order produce the same edge on the same tick.

### PRNG callouts

None. The rule consumes no random numbers; nothing downstream changes its draw order.

### Content (the second finding)

`ambition_conquer_territory.strategicProfile.templateIds` is reordered so the two self-gating destroys sit ahead of the always-available verbs — `strategic_blockade_route` and `strategic_raze_settlement` move to positions 2 and 3, behind `strategic_scout_defenses`. The THR-1309 comment on `strategic_suborn_warband` records the identical measurement and the identical fix; a gated verb that finds no licensed target passes its slot on at no cost, so the always-available verbs lose nothing they would otherwise have had. **This is a content edit with no engine change and ships in the same PR**, because without it a covet rivalry licenses two destroys the board never proposes.

## Content pillar

### Encounter templates

N/A — no encounter content; the harm an unlocked destroy emits feeds the existing catalyst encounters those templates already name.

### Prose tables

The moment the rivalry forms is narrated through the existing hostility line on the mortal sheet: `agentDetail.ts` renders `hostile_to` with `getGrudgeCauseClause(provenance)`, which reads the static map `GRUDGE_CAUSE_CLAUSES` in `src/data/grievance-prose.ts` and falls soft to the unknown clause. One new entry, in the map's register (a static clause; the owner is already a chip beside it, so the clause does not name them): `covets: 'a holding one of them kept reaching for'`. No new table.

### Attachment content

N/A.

### Data tables

`ambition-templates.ts`: the reorder above. `grievance-constants.ts`: the three constants below. `grievance-prose.ts`: the `covets` clause.

## UI pillar

N/A — no new surface. The rivalry appears where every hostility already appears: the mortal sheet's standing/quarrel line (the THR-1383 surface, browser-verified then), and the destroy it licenses appears as an undertaking moment on the mortal the player follows (the THR-1296 moment card, unchanged). The executor verifies the cause word renders on the sheet with the existing jsdom surface test, not a new screenshot; `Browser-verify exempt: no file under src/components is touched` is the expected closeout line. Laws engaged by the existing line: 1 (the owner is a chip), 13 (the count never renders).

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `phaseAgentDecision.ts` (covet counter) | agent decision | — | `actor.properties.covet` | `covet_rivalry_seeded` | `agent <name>` CLI block gains a `covets` line |
| `grievance/grudgeEdge.ts` (`writeCovetRivalry`) | agent decision | AgentDetail hostility line (existing, via `getGrudgeCauseClause`) | `hostile_to` edge | `covet_rivalry_seeded` | `eval` |
| `data/grievance-prose.ts` (`GRUDGE_CAUSE_CLAUSES.covets`) | — | AgentDetail hostility line | — | — | the sheet |
| `ambition-templates.ts` (reorder) | — | — | — | `strategic_candidate_board` refusals now name the two destroys | `encounters` CLI block |
| Player controls | — | N/A — autonomous world behaviour; no player verb, no card, no nudge | — | — | — |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `COVET_RIVALRY_THRESHOLD` | 12 | boards refused `no_motive` against the same owner before a rivalry forms — one game day at 12 ticks/day; the probe saw 624 refusals over 26 pairs on seed 42, so the median pair crosses it inside a season |
| `COVET_SWITCH_BELOW` | 4 | a newer refused owner replaces the counted one only while the count is still this low — a mortal who has nearly formed a rivalry does not forget it for the next warehouse |
| `MAX_COVET_RIVALRIES_PER_ACTOR` | 1 | live covet edges per mortal |

## Tracing

```ts
// covet_rivalry_seeded — emitted when the counter crosses the threshold and the edge is written
interface CovetRivalrySeededTrace {
  category: 'covet_rivalry_seeded';
  tick: number;
  actorId: string;
  ownerId: string;          // the faction or mortal whose holding was refused
  targetId: string;         // the last refused target
  refusals: number;         // the count at seeding
  ambitionId: string;       // the destroy-heavy ambition that drove the refusals
  summary: string;
}
```

Registered in all four places (`TraceCategory`, `TRACE_CATEGORIES`, the interface, the `TraceEntry` union).

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Refusal names a target that no longer exists | counter untouched; no edge |
| Owner resolves to the ascendant | never counted (guard before the counter) |
| Owner is the actor's own faction | never counted |
| Actor already holds a covet edge | counter frozen at threshold; no second edge |
| `writeCovetRivalry` throws (missing node) | returns false, trace not emitted, tick continues |
| A `covets` provenance reaches the sheet before the clause map has the entry | `getGrudgeCauseClause` falls to `GRUDGE_CAUSE_CLAUSE_UNKNOWN`; the line renders |
| Profile has no `preferredVerbs` | treated as not destroy-heavy; no counting |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/trace.ts` | 116 importers (`.codesight/graph.md`, 2026-09-03) | additive only — one new union member and one new string literal in `TraceCategory` / `TRACE_CATEGORIES`; no existing importer changes shape, and the four registration sites are the same four every trace addition touches |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (the reorder; prose via the existing line)
- [x] UI pillar N/A with rationale (existing surfaces carry it)
- [x] Wiring section connects them

## Interface impact

| Contract | Disposition |
|---|---|
| `grievance-reaches-the-mortal-sheet` (Ambitions & Undertakings → Attention, Chronicle & Narrative) | preserve — the sheet already renders `hostile_to` with cause; one more cause word |
| grievance lane mint window / displacement (THR-1383 rows) | preserve — a covet is a rivalry, not an injury; it enters the lane only through the harm it licenses |
| `undertaking-creation-effects`, `binder-*` rows | preserve — untouched |
| new: covet counter → grievance writer | **add** — production read site is the motive gate (`holdsMotive` reads the edge on the next board); no deferral needed |

## Vision audit

- [x] `02-non-negotiables.md` mortal sovereignty — confirmed: the world writes the quarrel from what the mortal *did* (kept reaching for another's holding), not from the god's hand.
- [x] `01-core-loop.md` — the aftermath rhythm gains its missing input: a followed conqueror now produces the vendetta the player was promised.
- [x] `03-design-tensions.md` §2 systemic emergence vs. authored moments — navigated, not violated: the rule is pure emergence (a count of what the mortal did on the board) with one authored clause; it stays a rivalry rather than an authored wrong, so the world says "in each other's way", never "one wronged the other". Companion § Tensions surfaced.
- [x] `taste-profile.md` — numbers never surface (Law 13; the count stays on the actor); the edge names its cause, the "every part of a name is something that happened" pattern extended to a relationship.
- [x] No premise contradicted; no Vision edit.

## Rulebook impact

- [x] This plan does not change a rule of play. Rivalry is already a motive the gate reads (`§10.7 [IMPL]`); this adds one more way the world writes it. No rulebook edit.
- [x] If it did, `Docs/canon/rulebook.md` would be updated in the same PR — not applicable.

> Brainstorm companion: `Docs/plans/2026-09-03-thr-1388-covet-rivalry-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | three named constants; the threshold is the whole feel |
| 2. Inspectability | PASS | one trace at seeding, the counter on the actor readable by `agent <name>`, the edge on the mortal sheet with its cause |
| 3. Determinism | PASS | a count over an ordered refusal list; no rng |
| 4. Fail-soft | PASS | table above; every guard returns and continues |
| 5. Narrative over mechanical perfection | PASS | the rule *is* the story — coveting breeds hatred — and it stays a rivalry until a harm makes it a grudge |
| 6. Additive over destructive | PASS | new cause value, new writer, new property, one list reorder; nothing removed |
| 7. Performance budget | PASS | O(refusals) per decision, already iterated for the trace |

## Done when

- [x] Measured (Done-when 1): the tables above, from the `strategic_candidate_board` refusals trace and the graph — probes in `.cache/harm-supply-probe.ts`, `motive-diagnosis-probe.ts`, `leader-arm-probe.ts`, `quarrel-supply-probe.ts` (exploratory, gitignored; reproducible from this doc's numbers).
- [x] Decision named (Done-when 2): the covet rivalry, above; leader-as-owner rejected on a zero controlled arm.
- [ ] `writeCovetRivalry`, the counter in `phaseAgentDecision`, the three constants, the trace registered in four places, the `covets` clause — with a unit test that a refusal streak below the threshold writes nothing, one at the threshold writes exactly one edge the gate reads as `rivalry` (not `grudge`), and a second streak while the edge stands writes nothing.
- [ ] `ambition_conquer_territory` reordered; `check:undertaking -- --all` unchanged.
- [ ] **The acceptance re-run (Done-when 3):** the THR-1383 probe shape on seeds 42 and 99, 300 ticks — culprit-carrying harms **> 0 on both**, grievance `pursues` **> 0 on both**, `census:undertakings` on both seeds inside the envelope with vendetta share ≤ `GRIEVANCE_SHARE_CEILING` — quoted in the closeout, replacing the zero baseline. If the re-run stays at zero on either seed, lower `COVET_RIVALRY_THRESHOLD` once (to 6) and re-measure; if still zero, stop and report — the constant is not the lever and the ticket reopens for design.
- [ ] `npm test`, `npm run test:heavy` locally (engine files), `npx vite build`, the typecheck ratchet; 30-tick CLI smoke.
- [ ] Closing commit body includes `Fixes THR-1388`
- [ ] `Browser-verify exempt: no file under src/components, src/hooks, src/contexts or src/index.css is touched` in the commit body

## Coordination block

**Suggested model:** `opus` — one engine rule with a measured acceptance; the re-run is the hard part.

**Parallel-safe with:** THR-1300 slice 5 (the pilot compiles content into `strategic-packs/factory/` and adds two mutation hints in `strategicActionLifecycle.ts`; this plan touches neither file).

**Mutex with:** none open. (Anything editing `src/engine/phaseAgentDecision.ts` or `src/engine/grievance/grudgeEdge.ts` would collide — none is on the board.)

**Files to touch:**
- Edit: `src/engine/phaseAgentDecision.ts` (the covet counter on the refusal list, beside the board trace)
- Edit: `src/engine/grievance/grudgeEdge.ts` (`writeCovetRivalry`; `covets` cause)
- Edit: `src/data/grievance-constants.ts` (three constants)
- Edit: `src/types/trace.ts` (`covet_rivalry_seeded`, four registration sites)
- Edit: `src/data/grievance-prose.ts` (`GRUDGE_CAUSE_CLAUSES.covets`, static clause in the map's register)
- Edit: `src/data/ambition-templates.ts` (`ambition_conquer_territory` reorder with the THR-1309-style comment)
- Edit: `scripts/cli.ts` (`agent <name>` shows the covet line)
- Create: `src/engine/grievance/__tests__/covetRivalry.test.ts`
- Edit: `public/essence-control-reference.html` or the grievance wiki page the manifest names for `grudgeEdge.ts` (one paragraph: coveting breeds rivalry)

## Notes for the executor

- Do **not** widen the motive gate or add a fifth motive. The measurement says the gate is right; the world was silent.
- Do **not** add a destroy-verb desire weight (the ticket's third candidate): no harm-capable candidate reached the final board's top list on the quiet seeds, so a weight would have had nothing to act on. Same for the variety penalty and the cap — measured, dispatched, not the lever.
- Do **not** extend `GRUDGE_PROVENANCE` with `covets`. A covet must read as *rivalry* so it cannot mint a vendetta on its own — the harm it licenses does that through the existing lane.
- The refusal reason to count is `no_motive:` exactly; `no_motive_unowned:` means nobody holds the target, and coveting nobody is not a story.
- Run the acceptance re-run before touching the threshold. The plan names one retry and one stop.
- **UL:** the term is filed as [THR-1391](https://linear.app/threadbare/issue/THR-1391) (`UL-proposal`: *Covet rivalry*, and a Grudge carve-out for the non-injury reading the gate already names `rivalry`). Use the words *covet rivalry* / *rivalry* in comments and traces; do not call the edge a grudge anywhere. The proposal is not a blocker for the implementation — the UL entry lands with or after it.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-03. Intent judge (Fable, cold context): Revise → Revise → **Allow** on the third run; the two Revises were the TTL/cooling exit that did not exist (dropped, § No decay), the unnamed clause file, the UL term (filed as THR-1391), the missing Blast Radius, and residue counts — all fixed inline.*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Constants table names `COVET_RIVALRY_THRESHOLD` (12), `COVET_SWITCH_BELOW` (4), `MAX_COVET_RIVALRIES_PER_ACTOR` (1), each with a stated rationale tied to measured data. |
| 2. Inspectability | PASS | `covet_rivalry_seeded` trace registered at "all four places"; counter exposed via `agent <name>` CLI; edge readable via `eval` and the mortal sheet's hostility line — matches wiring-checklist's trace/debug-visibility columns. |
| 3. Determinism | PASS | Explicit: "Threshold on a count, no probability... same refusals in same order produce the same edge on the same tick"; PRNG callouts section states "None." |
| 4. Fail-soft | PASS | Seven-row fail-soft table covers stale target, ascendant/own-faction guards, existing-edge freeze, writer throw, missing prose entry, missing `preferredVerbs` — each with a stated fallback that continues the tick. |
| 5. Narrative over mechanical | PASS | Explicitly framed as "the rule *is* the story"; ties mechanic to Vision non-negotiable (mortal sovereignty) and adds one prose clause via existing fallback-safe `getGrudgeCauseClause`. |
| 6. Additive over destructive | PASS | New cause value, new writer, new property, one list reorder — verified: `GRUDGE_PROVENANCE` deliberately not extended, and the earlier TTL/decay idea was dropped rather than half-built. |
| 7. Performance budget | PASS | Stated O(refusals) per decision "already iterated for the trace" — reuses an existing walk; no new tick-phase or per-tick scan. |

NFP AUDIT: PASS

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | All five required subsections present with concrete detail; PRNG explicitly "None" with rationale. |
| Content | present-and-substantive | Encounter templates and Attachment content explicitly N/A with reason; Prose tables and Data tables carry real content (one new clause, one reorder + three constants). |
| UI | N/A-with-rationale | Rivalry surfaces through the existing THR-1383 hostility line and existing moment card; names the exempt reason and cites Laws 1/13. |

No missing required sections. Wiring table connects each active-pillar module to phase, UI surface, GameState field, trace and debug visibility. Substrate-existence check: PASS — five existing subsystems named with extends/untouched/cites dispositions, cross-checked against `Docs/canon/systems-inventory.md`; no green-field duplication.

PILLAR AUDIT: PASS

### Vision audit

`00-north-star.md` → "a grudge carried" — extended. `01-core-loop.md` → "aftermath echoes… the player starts to see their own hand" — extended. `02-non-negotiables.md` → #1 god-not-protagonist confirmed; #4 graph-edge relationships confirmed (property is bookkeeping); #7 three pillars confirmed. `03-design-tensions.md` → §2 emergence vs. authored moments — at stake, not violated (auditor asked for an explicit line; added to § Vision audit above). `taste-profile.md` → "numbers in UI" anti-pattern — confirmed (Law 13). No contradictions found. North star consistent; core loop consistent (feeds supply); god/protagonist separation clean; design tensions not violated; taste profile clean.

VISION AUDIT: PASS-with-notes — the note (name tension §2 explicitly) is applied in this revision.
