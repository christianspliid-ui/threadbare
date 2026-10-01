# Encounter Pipeline: The Mill Lease
> Scale: short | Slug: mill-lease-auction | Pass: systems
> Date: 2026-10-01 | Pipeline version: 2.0
> Input: `Docs/plans/encounters/mill-lease-auction-revised.md`

**Verdict: READY WITH CAVEATS.** Every referenced id resolves against live code. There is one field correction (an image tag whose plate belongs to another sphere). There are no missing primitives. The caveats are the sequel registration and one test that stays red until the parent is compiled.

## 1. Support bundle honesty

| Key | Reuse roles | Where they are seeded (`LOCATION_ROLE_ROSTERS`) | Spawn | Verdict |
|---|---|---|---|---|
| `cellarer` | `monk`, `priest`, `steward` | hamlet `monk` 0.3; town `priest` 0.7; city / capital `priest` 1.0; farmland and mining seed none of the three | `monk` "Brother Anselm" | honest. The cellarer reuses a priest in most towns and spawns as a monk elsewhere; both read as an abbey's officer. |
| `merchant` | `merchant`, `trader`, `broker` | town / city / capital `merchant` 1.0; no rural roster seeds one | `merchant` "Hugh Draycott" | honest. The merchant reuses in every urban place and spawns in every rural one, which fits a merchant who has come to bid. |

Both are `must-persist`. The cellarer is the appointment's counterparty and is inherited by both sequels (`inheritContext: true`). The merchant is named in the knowledge record's fiction and by role in the missed sequel.

`settings: ['rural', 'urban']` expands to `hamlet · farmland · mining · town · city · capital` (`src/data/settingClasses.ts:58`). The spine's abbey, water-mill and market are lawful in all six. A mining camp with an abbey's mill is the stretch. It stays scene-local invention and asserts no graph state.

## 2. Effect and field audit

| Field | Shape | Verified against | Verdict |
|---|---|---|---|
| step 0 `failureMetadata.effects` | `reputation_with $here −0.03` | boundary-survey precedent; backs the step-0 critical_failure SCAR | ok |
| step 1 `successMetadata.effects[0]` | `reputation_with $here +0.06` | — | ok |
| step 1 `intelligence` | `category: 'trade_route'`, `label`, `detail`, `reliability: 0.85`, `targetAgentId: '$actor'` | `IntelligenceCategory` (`src/types/unifiedAction.ts:73`). `trade_route` matches template ids containing `trade · caravan · merchant · route` (`src/engine/intelligence.ts` `TEMPLATE_CATEGORY_MATCHERS`) | ok, and better connected than `political_secret` |
| step 1 `encounter_seed` + `appointment` | `templateId: 'town.mill_lease_sealed'`, `delayTicks: 36`, `inheritContext: true`, `appointment: { locationId: '$here', counterpartyId: '$cast:cellarer', missed: { templateId: 'town.mill_lease_forfeit', seedLabel } }` | the boundary-survey shape, field for field. `windowTicks` omitted → `APPOINTMENT_WINDOW_TICKS`; `missed.delayTicks` omitted → `APPOINTMENT_MISSED_SEQUEL_DELAY_TICKS` | ok. **Both `seedLabel`s carry no `{…}` token** (the boundary package-pass lesson: `seedLabel` is printed raw). |
| step 1 `failureMetadata.effects` | `reputation_with $here −0.06` | — | ok |
| `deal` tags | `['insight','labor']`, `['social','presence']` | `DealContextTag` (closed, 12 values) | ok |
| nudge ids | `mill.*`, one shared prefix, no duplicates | compiler hand rules | ok |
| `imageTag`s | `generic.matter` (matter), `generic.oath` (order), `generic.rumor` (mind plate on a spirit card) | `NUDGE_CONCEPT_ART` (`src/data/encounter-image-library.ts:627`) | **fix 1** for `generic.focus`; `generic.rumor` ruled lawful (below) |
| `motivations` | `asceticism_extravagance`, `honesty_cunning` | `ValuePair` (`src/types/agent.ts`) | ok |
| `tags` | `['#trade']` | content-tag catalog, family axis, 23 bearers | ok |

**Fix 1 (applied in the final).** Stretch The Morning is a time card wearing `generic.focus`, the mind plate (a hand holding a needle still). The library has a time plate: `generic.time-slow` (a water drop hanging, not yet fallen). That plate *is* the card's mechanism (the hour runs long). Changed to `generic.time-slow`.

**Ruled lawful, no change:** Swell The Rival's Pride (spirit) keeps `generic.rumor` (word passing shutter to shutter). The plate's subject is a boast going round, which is exactly what the card does. The spirit plate (`generic.blessing`, wisps over a bowl) would say nothing about it. The image resolver keys on the tag, not the sphere.

## 3. Chip backing (Law 56)

| Chip | Backing write | Fires on |
|---|---|---|
| BOND reputation with {location} (CS / S / SAC) | step 1 `reputation_with $here +0.06` | every path into a success band (step 1 succeeded). On the step-0-failure path the net is +0.03, still a gain. |
| BOON knowledge (CS / S / SAC) | step 1 `intelligence trade_route` | step 1 success |
| PATH appointment (CS / S / SAC) | step 1 `encounter_seed` + `appointment` (`$appointment` anchor, THR-1518) | step 1 success |
| SCAR reputation (failure) | step 1 `reputation_with −0.06` | step 1 failure |
| SCAR reputation (critical_failure) | step 1 `−0.06`, or step 0 `−0.03` on the step-0-critical path | both paths |

## 4. Gate pre-check (scratch-injected, nothing written to shared files)

The parent cannot be registered here (the real compile is the orchestrator's). So the dry-run's emitted `.ts` was bundled from the scratchpad, pushed onto `UNIFIED_ACTION_TEMPLATES` in memory, and run through the unmodified `scripts/check-encounter.ts`:

```
checked 1   clean 1   failing 0   on ratchet 0   warnings 0
✓ encounter.town.mill_lease_auction  [systems: cast, rewards, reputation, appointments]
```

Composition Contract, register detectors, reference liveness (the two sequel ids resolve against the registry), enrichment dry-run and forecast arithmetic are all clean, with zero warn-channel lines. That covers the doctrine-v2 name/effect-line checks and the `[page]` four-word overlaps. The compiler's dry-run is clean too (hand rules, envelope, byOutcome keys).

## 5. Missing primitives

None. Every effect kind already ships (`reputation_with`, `intelligence`, `encounter_seed` + `appointment`, `bond_change`, `rewardPool`).

## 6. Caveats

1. **Sequel file + registration.** `src/data/encounters/mill-lease-sequels.ts` exports `MILL_LEASE_SEQUELS` (`town.mill_lease_sealed`, `town.mill_lease_forfeit`). It is spread into `RAW_UNIFIED_ACTION_TEMPLATES` beside `...BOUNDARY_SURVEY_SEQUELS` in `src/data/unified-action-templates.ts` (import + spread, two lines; the THR-1677/1678/1679 precedent). Without it, `validateEncounterSeedRefs` reports both appointment branches as `dead_template`.
2. **One test is red until the parent compiles.** `encounterSeedLiveness.test.ts` › *every non-drawable template has a planter* lists `town.mill_lease_sealed` and `town.mill_lease_forfeit` as orphans, because their planter (`encounter.town.mill_lease_auction`) is not registered until the real `compile:encounter` runs. Expected; it goes green with the compile. Verify it after.
3. **Live proof.** Take evidence from a seed sweep plus one pinned run per band (`?view=game&seeded&size=medium&spawn=encounter.town.mill_lease_auction&outcome=<band>`), reading `await window.__DEBUG.getOutcomePinVerdict()` until `band_rendered` (impediments #1111/#1113/#1118). Prove both appointment branches.
4. *Note:* `intrinsicTier: 'shaping'` is deliberate; the 0.45 open-draw cap binds `background` only. No reach gate, so the forecast window keeps the job with Gold-competent mortals.
5. *Note, success_at_cost:* the cost is prose-carried (the fellowship short of coin all year). No band-keyed effect can carry it honestly. Same as the boundary survey and the bell tower.
6. *Note, batch caps:* this slot authors the batch's one Kindled Ambition special (spirit) and no Compulsion, Mercy, Undertow or Heavy Hand. The step-1 `presence` deal tag can still *deal* a library Kindled Ambition beside the authored one; the brief's caps cover authored specials.

## 7. Implementation file map

| File | Action | Notes |
|---|---|---|
| `Docs/plans/encounters/mill-lease-auction.package.json` | create | Compiles (`compile:encounter`, THR-1246) into `src/data/encounters/mill-lease-auction.ts`, its structural test, and the parent's registrations. **Orchestrator compiles; this pass only dry-runs.** |
| `src/data/encounters/mill-lease-sequels.ts` | create (hand-authored) | both sequels, `drawable: false`, no `locationSubtypes`, `intrinsicTier: 'background'` |
| `src/data/unified-action-templates.ts` | modify (2 lines) | import + spread `MILL_LEASE_SEQUELS` |
| `src/data/content-eval/plotHooks.ts` | orchestrator, at closeout | stamp `hook.succession_crisis` `usedBy` |
| Engine / types / art | none | image tags are `generic.*` library plates |

READY WITH CAVEATS
