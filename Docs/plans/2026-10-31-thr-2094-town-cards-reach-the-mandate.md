> **title:** Town cards reach the Mandate — the god's sphere push lands in a Place, and a working pushes twice a look — THR-2094
> **linear_issue:** THR-2094
> **author:** Claude Code (design lane, run 2026-10-31d, unattended)
> **created:** 2026-10-31
> **three_pillars:** Engine done (one push-target resolver beside the hex bridge, one push-strength rule, one trace type) · Content N/A — no new card, word or table row; one rulebook sentence · UI N/A — no surface changes; the Mandate bar fills faster through existing readouts

# Town cards reach the Mandate — THR-2094

*A Reshape, Preserve or Bind god that spends everything on its 2-essence town cards can now fill half its first sphere before doom reaches three-quarters. Today it stalls at a quarter to a third, while Witness, the Hunger the target was fitted on, reaches the full target by then.*

## Why this is load-bearing

[Slice 1](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-30-thr-2089-cheap-place-cards.md) gave force, matter and time a 2-essence town card. Its census found the first sphere stuck between a quarter and half of the target (87 points; half is 43.5) at doom 0.75. Under its kill criteria, that filed this ticket. [Slice 2](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-31-thr-2090-spirit-life-entropy-place-cards.md) expects Gather to land in the same band. THR-2081 Decision 4 says one Mandate unit for every Hunger. Until the band closes, the Mandate is a winnable goal for Witness and a near-certain loss for every Hunger whose first sphere has only a town card (Reshape, Preserve, Bind today; Gather after slice 2).

**Measured** on [`proto/thr-2094-place-card-plateau`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2094-place-card-plateau) (never merged). The census is `scripts/_scratch-2094.ts`: slice 1's `mandate-census.ts` with counters added. Raw logs are in `scripts/_scratch-2094-results/` on the proto branch (`.txt`, since `*.log` is gitignored). Setup: seeded medium 42, The First bonded, a scripted god casting its cheapest card per sphere on legal targets. Reported value: the first-sphere ledger at doom 0.75.

| Arm | Reshape (force) | Preserve (time) | Bind (matter) | Witness (mind) |
|---|---|---|---|---|
| today | 34.2 | 22.2 | 37.3 | 87.2 |
| any location, no subtype filter (`WIDE`) | 68.2 | — | — | — |
| any Place (`SUBLOC`) | 66.2 | — | — | — |
| push ×2 for 2-essence cards (`PERESSENCE PECAP=2`) | 42.2 | 36.2 | 54.3 | 85.2 (Vision is 1 essence, so unchanged) |
| the god's push at a town lands in its least-touched Place (`DISTRICT`) | 66.2 | 35.2 | 49.3 | — |
| **both** | **66.2** | **45.2** | **58.3** | — |

**What the counters showed** (`r-base.txt`, `p-base.txt`, `b-base.txt`):

- **Towns do not saturate.** At doom 0.75 every Reshape target town holds force 0–4, against a cap of 10 (`scoreHist={"0":20,"1":8,"2":6,"3":1,"4":2}`).
- **The god's share is not diluted.** Mean share per level-up is 0.96–0.98 in every arm.
- **Essence is the stall.** The god cannot afford its card on 95% of ticks after its starting pool runs out (Reshape `poorTicks=597` of 627). Every arm gets about 65 first-sphere casts by doom 0.75. No cast was refused (`refused={}`).
- **A push levels its target at most once.** `resolveSpherePressure` (`phaseSpherePressure.ts:318-350`) raises a score by one level per push and carries the rest as progress. So a cast on fresh ground is worth one point. A cast on a town already at 3 needs 4 pressure for its next level, more than one cast's 3.
- **Witness's advantage is price and breadth.** Its Vision costs 1 essence (about 130 casts), and it lands on ~1,000 Places, nearly all at 0. Town cards cost 2 (about 65 casts), and they land on 30–50 towns. Repeat visits climb the level cost, and rivals contest towns: Reshape loses 13.0 points to rival and doom wear, Preserve 12.0.

## Decisions (design lane, 2026-10-31, by delegation; veto in chat)

1. **When the god works a town, its sphere push lands in the town's Place that holds least of that sphere.** The card still acts on the town: walls, stores and footings change as today. Only the sphere push is re-aimed, to the Place with the lowest score in the card's sphere (ties by id). A town with no Places keeps the push. *Why:* this is the breadth Witness already has through its Places. Reshape reaches 66.2, the most a 2-essence god can afford (the `WIDE` and `SUBLOC` arms reach the same). It keeps the cards on towns, which slice 1 decided, and it needs no new target rule for the player. *Veto:* "the push should stay on the town".
2. **A working pushes twice what a look pushes.** A god's push is `ACTION_PRESSURE_SUCCESS × min(essenceCost, GOD_PUSH_ESSENCE_CAP)`, with the cap at 2 (failure uses the same multiplier). Vision and the other 1-essence cards keep 3. Every card at 2 essence or more pushes 6. *Why:* this follows slice 1's Decision 2, where a card that changes the world costs 2 and a look costs 1, and THR-2081 Decision 4, one unit for every Hunger. Today a 2-essence card buys half the push of a 1-essence look per essence spent. Decision 1 alone leaves Preserve at 35.2, because many of its hamlet targets have no Place. With both, all three clear half. *Veto:* "keep every push at 3".

Rejected, one line each ([brainstorm](2026-10-31-thr-2094-town-cards-reach-the-mandate-brainstorm.md)):
- Widening `targetSubtypes` to every location: Steel the Walls on a ruin changes nothing, so the card's effect would be dishonest (Substrate Honesty).
- Uncapped per-essence push: an 18-essence card would push 54 into one location, banking most of ten levels of progress in a single cast.
- A per-Hunger Mandate target: slice 1 Decision 1 already rejected it.
- Lowering the target: Witness would finish before doom 0.5.
- Re-pricing the cards to 1: slice 1 Decision 2 rejected it.

**Why this is not reserved for Christian.** The ticket asks for a lever inside an agreed system (the [design request](https://linear.app/threadbare/issue/THR-2094) names this exact choice), and THR-2081 Decision 4 tests it. Neither decision changes what the Mandate means. It still counts only what the god's own hand raised in its two spheres. On contest (THR-2081 Decision 3): a rival or doom push on the Place still takes back what the god holds there, exactly as on any ground. In the census, though, no Place was hit: 0 opposition debits in the `DISTRICT` arms, against 10–11 on towns. So a town god's ground is now as lightly contested as Witness's, which also shows 0 today. That is parity with the reference Hunger, and it is the trade this decision makes. *Veto line above.*

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Sphere pressure resolution `phaseSpherePressure` (one level per push, `:318-350`) | 🟢 ACTIVE | **reads**; unchanged |
| Hex push resolver `resolveHexPressureTargets` (`hexPressureTarget.ts`, THR-2087) | 🟢 ACTIVE | **extends**: a sibling resolver runs right after it at `phaseSpherePressure.ts:433` |
| Card resolution push (`unifiedActionResolution.ts:4469-4481`) | 🟢 ACTIVE | **extends**: magnitude multiplier for the god's casts |
| Mandate ledger `mandateLedger.ts` | 🟢 ACTIVE | **reads**; unchanged. A Place credits like any location (weight 1.0) |
| Three-tier position: sublocations are `type: 'location'` with `parentLocationId` (`sublocationShape.ts`) | 🟢 ACTIVE | **reads**: Places are a town's children |
| Census `scripts/mandate-census.ts` | 🟢 ACTIVE | **reads**; the Done-when runs it unchanged |

Runtime count (seeded medium 42, t627): 37 Reshape-legal towns, 51 Preserve-legal, 1–6 Bind-legal at a time (`requiredNodeProperties: { economyNextBuilding }`). There are ~1,000 Places world-wide (`r-sub.txt legal=1016`).

## Engine pillar

**New module `src/engine/townPressureTarget.ts`**, shaped like `hexPressureTarget.ts`:

```ts
export function resolveTownPressureTargets(
  graph: WorldGraph, pressures: SpherePressureEvent[], ascendantId: string, tick: number,
): { pressures: SpherePressureEvent[]; traces: TownPressureTraceInput[] }
```

For each push where `GOD_PUSH_LANDS_IN_SUBLOCATION` is on, `p.source === 'divine_action'`, `p.causedBy === ascendantId`, and the target node's `locationSubtype ?? locationType` is in `GOD_PUSH_TOWN_SUBTYPES`, it takes the target's children (location nodes whose `parentLocationId` is the target id). It picks the child with the lowest `sphereAffinity.scores[p.sphere]` (missing = 0), ties broken by id. It rewrites `targetEntityId` to that child, keeps every other field, and adds `aimedAtId: <town id>`. With no children, the push passes through. Pure, deterministic, no PRNG. Build the parent→children map lazily, only when the first qualifying push is found. A tick with no god push at a town costs one pass over the pushes. Call it in `phaseSpherePressure.ts` right after `resolveHexPressureTargets` (`:433`), so a hex push that resolves onto a town is re-aimed too.

**Push strength** in `unifiedActionResolution.ts:4471`: when `completing_action.actorId === state.ascendantId`, multiply the magnitude by `Math.min(GOD_PUSH_ESSENCE_CAP, Math.max(1, template.essenceCost ?? 1))`, and set `pushScale` on the push when the factor is above 1, so the `sphere_pressure` trace shows why it is larger. Mortal and rival pushes are unchanged. The `atk/def` contest pushes at `:4156` / `:4166` are not touched.

**Types** (`src/types/sphereAffinity.ts`, additive): `aimedAtId?: string` and `pushScale?: number` on `SpherePressureEvent`, plus the three constants below. `TownPressureTrace` goes in `src/types/traces/sphere-traces.ts` and the `trace.ts` union, beside `HexPressureTrace`.

Graph nodes and edges: none new. Tick phases: none new.

## Content pillar

N/A. No card, name, line or table row changes. The cards still do to the town exactly what their words say. The rulebook gains one sentence (§ Rulebook impact).

## UI pillar

N/A for new surface. The Mandate bar, the god rail and the Chapter Ledger already read `mandateState`. They fill faster, with no new text. There is no player-facing line about where the push landed. The town card's receipt names the town, which is the player's act (UI Law 13/14: the act names its target; the ledger detail is debug). **Debug inspection:** the trace viewer shows `town_pressure` (aimed at → landed in) and `mandate_ledger_credit` on the Place. **Browser-verify exempt:** nothing a player sees changes shape. The Done-when is a census, not a screenshot.

### Player-facing text

| Surface | Exact text | Complaint class | How the player understands it |
|---|---|---|---|
| none new | — | — | — |

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `townPressureTarget.ts` | `sphere_pressure` (inside, after the hex resolver) | none | none | `town_pressure` (new) | trace viewer; `npm run census:mandate` |
| push strength | unified action resolution (existing) | none | none | `sphere_pressure` shows the larger magnitude | trace viewer |

Wiki: the page or pages `check:wiki-freshness:blocking` names for `phaseSpherePressure.ts` / `unifiedActionResolution.ts`. Systemic wiring guide: no new content-facing capability.

## Interface impact

| Contract | Change | Note |
|---|---|---|
| Card resolution → sphere pressure | **extend** | the god's pushes scale by price, capped at 2× |
| Sphere pressure target resolution (hex → location) | **extend** | town → Place, for the god's pushes only. Add the row to `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` |
| Sphere pressure → Mandate ledger | preserve | Places credit as locations |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `GOD_PUSH_LANDS_IN_SUBLOCATION` | `true` | Decision 1's switch; `false` restores today |
| `GOD_PUSH_TOWN_SUBTYPES` | `['settlement','hamlet','town','city','capital']` | which targets count as towns, the same set the town cards name |
| `GOD_PUSH_ESSENCE_CAP` | `2` | Decision 2: the most a god card's price multiplies its push; `1` restores today |

## Tracing

```ts
export interface TownPressureTrace extends TraceBase {
  category: 'town_pressure';
  tick: number;
  townId: string;      // where the card was aimed
  sublocationId: string;  // where the push landed
  sphere: SphereName;
  sublocationScore: number; // that Place's score before the push
}
```

One per re-aimed push. A pass-through (no Places) emits nothing.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| target node missing | the push passes through unchanged; `phaseSpherePressure` already drops unknown entities |
| town has no Places | the push stays on the town |
| child has no `sphereAffinity` | reads as score 0, so it is picked first. Resolution initialises a blank affinity (`phaseSpherePressure.ts:503-506`) |
| `essenceCost` missing or 0 | multiplier 1 |
| the resolver throws | catch, return the pushes unchanged, emit no trace |

## Blast Radius

`src/types/trace.ts` (132 importers): one member added to the trace union, which is additive. Any exhaustive `switch` on `category` must handle `town_pressure`; `npm run check:typecheck` finds them. `unifiedActionResolution.ts` (62) and `src/types/sphereAffinity.ts` (54) are under the 100-importer line. Run `npm test` in full.

## Done when

- [ ] On top of [THR-2090](https://linear.app/threadbare/issue/THR-2090), `npm run census:mandate -- sweep seeded reshape`, `… preserve` and `… bind` each show the first sphere at or above 43.5 at doom 0.75. Lane proto: 66.2 / 45.2 / 58.3.
- [ ] `npm run census:mandate -- godloc seeded` (Witness) does not complete before doom 0.5. Lane proto: 82.2 at 0.5 today, Vision unchanged. `… sweep seeded gather` and `… kindle` record their numbers in the status fragment.
- [ ] `townPressureTarget.test.ts`: the god's push at a town lands on its lowest-score Place (ties by id). A town with no Places keeps it. A non-town target, a mortal's push and a rival's push pass through. With `GOD_PUSH_LANDS_IN_SUBLOCATION` false, every push passes through. One trace per re-aimed push.
- [ ] A resolution test: the god's 1-, 2- and 8-essence casts push 3 / 6 / 6 on success. A mortal's cast pushes 3. With `GOD_PUSH_ESSENCE_CAP` 1, all push 3.
- [ ] `npm run gate` green; `check:interface-contracts` passes with the new row.

## Kill criteria

- Any Hunger in `sweep seeded` completes before doom 0.5: lower `GOD_PUSH_ESSENCE_CAP` to 1 and re-measure. Decision 1 alone still lifts Reshape and Bind.
- Preserve still under half: its hamlet targets lack Places. File a follow-up on Keep the Stores' targets; do not refit the target.
- The town Hungers' ground goes uncontested in play (no rival push ever reaches a Place on a warm run's trace export): file a rival-targeting follow-up so schemes can reach Places. Do not move the push back to the town.
- A warm playtest shows a town god's Mandate moving with no visible cause: put the Place name in the Mandate detail (UI follow-up). The rule stands.

## Not in this plan

- The Mandate target itself (87 / 23) and its fit: unchanged.
- Gather and Kindle after THR-2090: measured here, tuned there.
- Rival scheme targeting of Places: unchanged.

## Three-pillar check

- [x] Engine: one resolver, one multiplier, one trace type, three constants
- [x] Content: N/A with rationale; rulebook sentence below
- [x] UI: N/A with rationale; debug path named
- [x] Wiring: table above; interface-map row

## Vision audit

- [x] Law 30 (two clocks, one purse): the Mandate becomes reachable for the town Hungers, so spending on it is a real choice against doom. Law 36 (the purse is small): prices unchanged, and a price now buys push, capped at 2×. Law 43 (one concept per thing to learn): the player learns nothing new. Law 32 (a run is not about winning): doom and the Mandate's meaning are unchanged.
- [x] No Vision edit needed.

## Rulebook impact

- [x] `Docs/canon/rulebook.md:413`, after "The Mandate counts only what your own hand raised in your two spheres": add "When you work a town, the push to your sphere lands in the Place of it that holds least of that sphere [IMPL — THR-2094]." The executor makes the edit.
- [x] `rulebook-quick-reference.md`: none.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | three named constants, two of them switches |
| 2. Inspectability | PASS | `town_pressure` trace; `aimedAtId` on the push |
| 3. Determinism | PASS | id tie-break; no draw |
| 4. Fail-soft | PASS | table above |
| 5. Narrative | PASS | the town changes as the card says; the god's sphere takes hold in its Places |
| 6. Additive | PASS | new module, optional field, multiplier behind a constant |
| 7. Performance | PASS | one parent map per sphere-pressure phase; god casts are a handful a tick |

## Coordination block

**Blocked by:** [THR-2090](https://linear.app/threadbare/issue/THR-2090), so the Done-when measures on top of its tide exemption and life card.
**Suggested model:** sonnet. One pure resolver modelled on an existing one, one multiplier, tests.
**Parallel-safe with:** [THR-2098](https://linear.app/threadbare/issue/THR-2098) and [THR-2105](https://linear.app/threadbare/issue/THR-2105) (UI and content, disjoint).
**Mutex with:** `phaseSpherePressure.ts` around the hex resolver call and `hexPressureTarget.ts` ([THR-2091](https://linear.app/threadbare/issue/THR-2091), branch `thr-2091-oddq`); `src/types/sphereAffinity.ts` constants (THR-2090 adds one beside them).

**Files to touch:** `src/engine/townPressureTarget.ts` (new) and its test, `src/engine/phaseSpherePressure.ts` (one call), `src/engine/unifiedActionResolution.ts` (multiplier) and a resolution test, `src/types/sphereAffinity.ts`, `src/types/traces/sphere-traces.ts`, `src/types/trace.ts`, `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`, `Docs/canon/rulebook.md`, the wiki page the freshness gate names.

## Notes for the executor

- The proto switches in `unifiedActionResolution.ts` on the proto branch are for measurement only. Do not port them. The Place rule belongs in the new resolver, not at the resolution site.
- Measure on top of THR-2090. Record all five first-sphere numbers in the status fragment.

## Intent-judge verdicts

**Run 1 (2026-10-31, opus, cold): Revise** (Reversible confirmed; dimension 1 PASS, with the census numbers checked against the logs). Three findings, all fixed:
- "mark" collided with the canonical UL term *The God's Mark* (`Docs/ubiquitous-language/Agents.md:89`), including in the rulebook sentence. Now "push" throughout.
- The census logs were not on the proto branch (`*.log` is gitignored). They are now committed as `.txt`.
- The rulebook sentence mixed "quarter" and "district". Now one term only.

**Run 2: Revise.** All three run-1 fixes confirmed, and every cited number checked against the committed logs. One finding: "district" mislabels the sublocation tier, whose UL game word is *Place* (`Docs/ubiquitous-language/Graph.md` § Place), and it collides with the `market-district` sublocation type. Fixed: "Place" in prose and the rulebook sentence, `sublocation` in code names (`GOD_PUSH_LANDS_IN_SUBLOCATION`, `sublocationId`). The proto switch `DISTRICT` keeps its label.

**Run 3: Allow** (Reversible confirmed). All twelve dimensions pass, every cited number re-read from the committed logs, and the UL fix confirmed against `Graph.md` § Place. One optional note: name the wiki page in Wiring rather than leaving it to the freshness gate. Left to the gate, which names it exactly.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-31*

### NFP audit

**NFP AUDIT: PASS-with-notes.** NFPs 1, 3, 4 and 6 pass: three named constants with revert values, an id tie-break and no draw, a five-row fail-soft table, and an additive module, field and trace behind switches. **2 (note):** the push multiplier recorded no factor in any trace. **5 (note):** no player-facing text names the Place. **7 (note):** the Place map was built on every call. *Lane response:* 2 and 7 are fixed. The push now carries `pushScale`, and the map is built lazily on the first qualifying push. 5 is accepted; its kill criterion files the UI follow-up.

### Three-pillar audit

**PILLAR AUDIT: PASS-with-notes.** Engine is present and substantive. Content and UI are N/A with rationale. Wiring is present, and the substrate inventory has a runtime count. Cross-checked against `systems-inventory.md`, no existing town→Place resolver exists, so this is a sibling, not a duplicate. **Notes:** no Blast Radius section although `src/types/trace.ts` is wide-blast; the Done-when omits the standard closer line. *Lane response:* Blast Radius added (`trace.ts`, 132 importers). The closer is the executor's under the Definition of Done.

### Vision audit

**VISION AUDIT: PASS-with-notes.** No contradictions. Premises confirmed: two clocks, one purse (made reachable for the town-card Hungers), essence as the economy, prose not numbers, god not protagonist. **Note:** design tension #4 (legibility vs. mystery). The Mandate bar fills from Places the player never sees named, a soft lean toward mystery. *Lane response:* accepted; it is covered by the third kill criterion.
