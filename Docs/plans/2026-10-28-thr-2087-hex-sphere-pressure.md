> **title:** A hex card grows the sphere of the place it falls on — THR-2087
> **linear_issue:** THR-2087
> **author:** Claude Code (design lane, run 2026-10-28d, unattended)
> **created:** 2026-10-28
> **three_pillars:** Engine done (one pure resolver at the head of the sphere-pressure phase, one constant, two traces) · Content done (four flows cards tagged energy, their technical lines) · UI N/A (no surface changes; the moved scores show on surfaces that already read them)

# A hex card grows the sphere of the place it falls on — THR-2087

*A god who spends essence on a hex card today grows no sphere anywhere; after this, the cast lands on the place that hex holds, or the nearest one.*

## Why this is load-bearing

29 ascendant hex cards carry a sphere (`hex.seed_life` life, `hex.bestow_vision` mind, `hex.smite` force …), and every one of their casts pushes sphere pressure onto a target id no graph node has. The pressure phase skips it as an unknown entity. So the god pays essence, the card says the land changed, and no place's sphere moves: the world total, the World-Soul and the Mandate never hear of it. Four more hex cards (the "flows" cards) are priced in energy and carry no sphere at all. Law 38 says a card is "paid for in essence earned through the card's own sphere"; a card priced in energy that cannot grow energy, or a life card whose life goes nowhere, spends the purse Law 30 says both clocks share and buys the Mandate nothing.

## Measured (design lane, `main` @ c945e599)

| Claim | Evidence |
|---|---|
| Hex casts push onto `hex_COL_ROW` | `unifiedActionResolution.ts:4413-4423` pushes `targetEntityId: completing_action.targetId`; a hex card's target is `hex_COL_ROW` (`hexActionBridge.ts:803-815`, `isHexTargetId` / `parseHexTargetId`) |
| The phase drops them | `phaseSpherePressure.ts:473-474` — `const node = updatedGraph.getNode(entityId); if (!node) continue; // fail-soft: unknown entity`. Hex tiles are not graph nodes (`gameInit.ts:249-251` says so in its own comment) |
| How many cards | 52 hex-category templates; 29 carry `sphereAffinity`; 23 ascendant hex cards carry none (census below) |
| The flows cards | `hex.attune_leyline`, `hex.amplify_flow` (tier 2), `hex.anchor_sphere`, `hex.channel_current` (tier 3): `progression.pricedIn: 'energy'` (`unified-action-templates.ts:3772, 3904, 4733, 4871`), no `sphereAffinity` |
| Where places stand | Seeded medium world (`initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, …, 'medium')`): 712 land hexes, 235 place-tier locations, all with `hexCol/hexRow`, on 214 distinct hexes (max 3 per hex, median 1) |
| How far an empty hex is from a place | Engine `hexDistance` (`delivery.ts:19`): land hexes holding a place 214 / 712 (30%); within 1 hex 619 (87%); within 2 hexes 708 (99.4%); max 4. Seed Life's own barren terrains: 48% hold a place, 86% within 1, 97% within 2 |

Census: [`proto/thr-2087-hex-pressure`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2087-hex-pressure) `scripts/_scratch-2087.ts` (never merged). Run: `npx esbuild scripts/_scratch-2087.ts --bundle --platform=node --format=esm --outfile=.cache/s2087.mjs && node .cache/s2087.mjs`.

## Decisions (design lane, 2026-10-28, by delegation; veto in chat)

1. **A hex push lands on one place, at full strength.** The place-tier location on that hex with the lowest id takes the whole push. A hex card then weighs what a place card weighs (both push `ACTION_PRESSURE_SUCCESS` = 3 on success), so hex cards do not out-earn town cards by covering more ground, and no push is split below the size that moves a score. *Veto:* "a hex card should touch every place on its hex".
2. **An empty hex feeds the nearest place within two hexes.** Nearest by `hexDistance`, ties broken by lowest id. Two hexes reaches 99.4% of land hexes on the seeded world, so a cast on barren ground still counts; the land's sphere lives in its places. Beyond two hexes the push is dropped, but with a trace, never silently. *Veto:* "a cast in empty wilds should grow nothing".
3. **The four flows cards carry energy.** They are already priced in energy; tagging them is what makes that price buy energy. This adds no card and changes no price. It does not touch [Energy gets cards a god can cast](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-28-thr-2086-energy-cards.md), whose two new cards ship either way; that plan's Decision 1 declined this re-tag *because* of this bug.
4. **Resolve in the phase, not at the push sites.** One resolver at the head of `phaseSpherePressure` catches any writer that queues a hex id (measured: the completing-action push at `unifiedActionResolution.ts:4418`; any other writer handed a hex target is caught too) without editing the push sites. It copies each event whole, so fields other plans add to `SpherePressureEvent` (the Mandate plan's `causedBy`) ride through.

Rejected: make hexes graph nodes (a new node type for one lookup; CLAUDE.md's verification rule); split the push across every place on the hex (pushes of 1–1.5 rarely move a score); push onto the mortals on the hex (mortals weigh 0.2 in the world total and wander off). Detail in the [brainstorm](2026-10-28-thr-2087-hex-sphere-pressure-brainstorm.md).

None of these four decisions builds on another lane decision inside its veto window: the fix holds under today's Mandate (places count 1.0 in the world total) and under [the god-caused Mandate](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-28-thr-2081-god-caused-mandate.md) alike.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Spheres & Quintessence — sphere pressure resolution (`phaseSpherePressure.ts`) | 🟢 ACTIVE | **extends**: hex target ids resolve to a place before grouping |
| Unified action resolution (`unifiedActionResolution.ts` sphere push) | 🟢 ACTIVE | preserved, unchanged |
| Hex action bridge (`isHexTargetId` / `parseHexTargetId`) | 🟢 ACTIVE | reused |
| Three-tier position (`sublocationShape.ts` `getLocationNodes`) | 🟢 ACTIVE | reused; the place tier only |

## Engine pillar

**New module `src/engine/hexPressureTarget.ts`** (pure, no state):

```ts
/** Rewrite every pressure aimed at a hex id onto a place-tier location; drop the unanchored. */
export function resolveHexPressureTargets(
  graph: WorldGraph, pressures: SpherePressureEvent[], tick: number,
): { pressures: SpherePressureEvent[]; traces: HexPressureTrace[] }
```

1. A pressure whose `targetEntityId` fails `isHexTargetId` passes through untouched (same object).
2. For a hex id, parse it; build once per call the list of place-tier locations (`getLocationNodes(graph)`) with numeric `hexCol` / `hexRow`.
3. On-hex places, sorted by id → the first. Else every place with `hexDistance ≤ HEX_PRESSURE_FALLBACK_RADIUS`, sorted by (distance, id) → the first.
4. Found → `{ ...p, targetEntityId: place.id }` plus a `sphere_pressure.hex_resolved` trace. None → the event is dropped plus a `sphere_pressure.hex_unanchored` trace.

**Call site:** `phaseSpherePressure`, right after `const pressures = state.pendingSpherePressures ?? []` and the empty check, before the group-by-entity loop. Emit the traces with `emitTrace`. Wrap the call in try/catch: on throw, use the original list (today's behaviour).

Graph nodes / edges: none. Tick phases: none new. PRNG: none (deterministic id sort). Performance: one pass over 235 place nodes per tick *that has a hex push*, zero otherwise.

## Content pillar

1. `src/data/unified-action-templates.ts`: add `sphereAffinity: 'energy'` to `hex.attune_leyline`, `hex.amplify_flow`, `hex.anchor_sphere`, `hex.channel_current`. `pricedIn` stays; the price does not change.
2. `src/data/action-technical-effects.ts`: append to each of the four lines "Pushes energy pressure on the hex's place (or the nearest within HEX_PRESSURE_FALLBACK_RADIUS)." Append the same clause, with its own sphere, to `hex.seed_life` and `hex.bestow_vision`. The other 27 sphere-tagged hex lines are left as they are (they never named their pressure).
3. No prose change: the cards' narrative templates already describe the land changing.

## UI pillar

UI: N/A — no component, hook or style changes. The moved scores reach the player through surfaces that already read place sphere scores (the place page's sphere row, the map's sphere tint, the Mandate track). `Browser-verify exempt: engine and card data only; no src/components, src/hooks, src/contexts or index.css change.` UI Laws engaged: none newly; Law 21 (one reading per concept) is *restored*, since the card face's sphere tint now means what it says.

## Wiring

| Item | Disposition |
|---|---|
| Orchestrator phase | none new; inside `phaseSpherePressure` |
| GameState flow | reads `pendingSpherePressures` (already), writes nothing new |
| Traces | two new types, below |
| Debug visibility | trace viewer; `window.__DEBUG` unchanged |
| Wiki | `public/tick-cycle-reference.html` and `public/cosmology-reference.html` source `phaseSpherePressure.ts`: one sentence each, "a push aimed at a hex lands on that hex's place, or the nearest within two hexes" |
| Systemic wiring guide | one line under sphere pressure: a writer may queue a `hex_COL_ROW` id; the phase anchors it |

## Interface impact

| Contract | Disposition |
|---|---|
| Action resolution → `pendingSpherePressures` → sphere pressure phase | **extend**: hex ids now land. Same producer, same consumer, no new cross-system read or write, so no new `scripts/interface-contracts.ts` row; the new `getLocationNodes` read stays inside the phase (today it reads actor `located_at` edges for agent presence, `phaseSpherePressure.ts:450-457`) |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `HEX_PRESSURE_FALLBACK_RADIUS` | `2` | How far (hexes) a push on an empty hex looks for a place. 2 covers 99.4% of seeded land; 1 covers 87% |

Lives in `src/types/sphereAffinity.ts` beside `ACTION_PRESSURE_SUCCESS`.

## Tracing

```ts
export interface HexPressureTrace {
  type: 'sphere_pressure.hex_resolved' | 'sphere_pressure.hex_unanchored';
  tick: number;
  hexId: string;            // 'hex_COL_ROW'
  sphere: SphereName;
  source: PressureSource;
  sourceId: string;
  resolvedTo?: string;      // place id (resolved only)
  distance?: number;        // 0 on-hex, else 1..radius (resolved only)
  summary: string;
}
```

Both type strings join the trace-type union and registry in `src/types/trace.ts` beside `'sphere_pressure'`.

## Fail-soft table

| Case | Fallback |
|---|---|
| Hex id that does not parse | passes through; the phase skips it as today |
| No place within the radius | dropped, `hex_unanchored` trace |
| Place lacks a sphere bag | the phase's existing default-bag path |
| Resolver throws | original list used; today's behaviour |

## Blast Radius

`unified-action-templates.ts` (259 importers) gains one field on four templates, no shape change. `trace.ts` (148 importers) gains two union members, additive. No signature changes.

## Done when

- [ ] Test (`hexPressureTarget.test.ts`): a hex push on a hex holding two places lands on the lower id at full magnitude; an empty hex lands on the nearest place within 2 (tie → lower id); beyond 2 it is dropped with a `hex_unanchored` trace; a non-hex push is returned as the same object.
- [ ] Test (phase level): a resolved `hex.seed_life` cast on a hex that holds a place moves a life score on that place, through `phaseSpherePressure` (the ticket's literal predicate). A second case on an empty hex moves the nearest place within 2.
- [ ] Test: each of the four flows cards has `sphereAffinity: 'energy'`, and a resolved cast queues an energy push that `phaseSpherePressure` lands on a place.
- [ ] A 30-tick CLI smoke passes; `npm run gate` green.
- [ ] The two wiki sentences and the wiring-guide line land.

## Kill criteria

If a 600-tick seeded run shows hex casts overtaking place casts as a god's main sphere source (more than half of `divine_action` sphere levels arrive through `hex_resolved`), the fallback radius is too generous: drop it to 1 and re-measure. If `hex_unanchored` fires on more than 5% of hex pushes, the radius is too tight.

## Not in this plan

- Sustained hex controls (`hex.anchor_sphere`, `hex.channel_current` while held) leave `targetNodeId` unset (`controlEffectSpawn.ts:155-159`), so their per-tick pressure (`phaseControlEffects.ts:446`) never fires. Their one-off cast push lands after this plan; the per-tick hold is a separate question about what a held hex channels.
- The 23 ascendant hex cards with no sphere stay untagged; giving each a sphere is a card-by-card content call.

## Three-pillar check

- [x] Engine: resolver, constant, traces, call site
- [x] Content: four tags, six technical lines
- [x] UI: N/A with rationale; browser-verify exempt line given
- [x] Wiring: table above, checked against [`Docs/plans/wiring-checklist.md`](wiring-checklist.md)

## Vision audit

- [x] Law 38 (a card is paid for in essence earned through its own sphere) becomes true for 33 hex cards whose sphere went nowhere. Law 30 (one purse, two clocks): hex casts now buy Mandate progress like place casts, at the same push size. Law 45 (no false promise): the card text that says the land changed is now true.
- [x] No Vision edit needed.

## Rulebook impact

- [x] `Docs/canon/rulebook.md`: none. It says what a card does and never said a hex card's sphere goes nowhere.
- [x] `Docs/canon/rulebook-quick-reference.md`: none.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | one named radius |
| 2. Inspectability | PASS | every hex push leaves a resolved or unanchored trace |
| 3. Determinism | PASS | id sort; no PRNG |
| 4. Fail-soft | PASS | try/catch falls back to today |
| 5. Narrative | PASS | the card's words now come true |
| 6. Additive | PASS | new module, new field on four templates, new trace types |
| 7. Performance | PASS | one pass over place nodes only on ticks with a hex push |

## Coordination block

**Suggested model:** sonnet — one small pure module, four data tags, tests.
**Parallel-safe with:** [the loan's collection](https://linear.app/threadbare/issue/THR-2044) and [famine and glut draws](https://linear.app/threadbare/issue/THR-2040); neither edits sphere pressure or the card tables.
**Mutex with:** [the god-caused Mandate](https://linear.app/threadbare/issue/THR-2081) — both edit `phaseSpherePressure.ts` (its credit pass vs. this resolver at the phase head) and `src/types/sphereAffinity.ts`. [Energy cards](https://linear.app/threadbare/issue/THR-2086) — both edit `unified-action-templates.ts` and `action-technical-effects.ts` (shared tables; union-merge conflicts). Whichever lands second rebases.

**Files to touch:** `src/engine/hexPressureTarget.ts` (new), `src/engine/phaseSpherePressure.ts`, `src/types/sphereAffinity.ts`, `src/types/trace.ts`, `src/data/unified-action-templates.ts`, `src/data/action-technical-effects.ts`, `src/engine/__tests__/hexPressureTarget.test.ts` (new), `public/tick-cycle-reference.html`, `public/cosmology-reference.html`, `Docs/plans/2026-04-16-systemic-wiring-guide.md`.

## Notes for the executor

- `getLocationNodes` returns the place tier only; do not use `getNodesByType('location')` (it returns both tiers).
- Use `hexDistance` from `src/engine/delivery.ts` (odd-r offset, the map's own) rather than writing a new one.
- The census on `proto/thr-2087-hex-pressure` shows how to build the seeded medium world for the phase-level test.
- If the Mandate plan has landed first, its `causedBy` field rides through the `{ ...p }` copy; check its test still passes.

## Intent-judge verdicts

**Allow** (2026-10-28, cold opus judge). Impact class Reversible. 11 PASS, 1 GAP (dimension 3: the interface-impact line misdescribed how the phase reads presence; corrected above), 1 N/A. Advisory applied: the phase-level test is pinned to an on-hex fixture so it proves the ticket's literal predicate.

## Forked-audit verdicts

### NFP audit

**PASS-with-notes.** NFPs 2–6 pass. **1 (note):** "lowest id wins" and full-strength magnitude are design choices, not constants; the kill thresholds are review numbers. **7 (note):** `getLocationNodes` may itself walk the graph, so "one pass over 235 places" may understate the cost; still bounded and gated to ticks with a hex push. Line drift corrected. *Lane response:* accepted; the executor may cache the place list per tick if the profile shows it.

### Three-pillar audit

**PASS-with-notes.** Engine and Content present and substantive; UI N/A with rationale. Substrate inventory matches systems-inventory; no green-field duplication. Notes: the coordination block lacked "Files to touch" (added) and the Wiring section is a disposition table rather than per-module.

### Vision audit

**PASS-with-notes.** Non-negotiables 1, 2, 4, 5, 7 confirmed; no contradictions. Notes: UI N/A carries "invisible feature" risk, acceptable; the technical-effect lines name a constant and must never reach a player surface as raw text. *Lane response:* technical lines already name constants (the energy-cards plan's `LOC_STOKE_FORGES_PROSPERITY_DELTA`); unchanged convention.
