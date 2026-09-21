> **title:** `Appointment primitive — a mortal keeps (or misses) a meeting at a place by a time — THR-1479`
> **linear_issue:** THR-1479
> **author:** `Claude Code`
> **created:** 2026-09-21
> **three_pillars:** Engine `done` · Content `done — the Crossroads bargain re-authored as the first user, its missed sequel written, three authoring surfaces amended` · UI `done — the PATH chip's appointment sentence, the thread-row clock badge, the sheet's promise row, the missed sequel's broken-promise chip; Playwright DOM evidence`

# Appointment primitive — THR-1479

*A promise to be somewhere by a time is the one kind of future the engine cannot keep today, so the prose was forbidden to make it (THR-1476). This plan makes it keepable — and missable — and wires it into every place an authoring agent looks, so it cannot ship dead.*

## Why this is load-bearing

On 2026-09-12 Christian reviewed A Bargain at the Crossroads and found the stranger asking for *"collect it here at the next full moon"* while the engine's `encounter_seed` carries a tick and a cast and no place (`src/types/unifiedAction.ts:458-491`): the sequel fired wherever the mortal stood and its gift chip claimed a return nobody made. THR-1476 (Done 2026-09-12, PR #1915) made the prose true **by removal** — the stranger now finds them — and added prose rule 7b: *prose may not set a constraint on future world behaviour that no effect enacts*. This plan makes it true **by construction**: an effect that enacts the place and the time, so the Crossroads bargain can say what it originally said.

Two director rulings are settled inputs, not questions (attended chat 2026-09-12): **a mortal must be able to miss an appointment**, tuned rare and personality-driven, because a meeting that cannot be missed is not a promise; and **only encounters mint appointments for now** — the god making appointments between mortals is later. His third sentence is the requirement that shapes half of this plan: *"the encounter that we gave feedback on … would have to have been built by an agent who knew of and would use the appointment feature … without that connectivity it is a dead feature."* The repo's own record proves the risk: `catalystQuery` is wired, gated, contract-green and 🟢 LIVE on the interface map, and the first content census (2026-09-12, seed 42, 200 ticks) found it **structurally unreachable** — all 35 carriers are legacy-arm templates the live `cells` board never walks (THR-1497). Every connectivity hook in the ticket's table was satisfied by that contract. So this plan carries one row the ticket did not: **reachability under the live model, proven by a census hit, not by a gate that reads the code.**

The vault analysis (`Brainstorms/2026-09-12-appointment-primitive.md`, promoted here per process.md § Plan-doc lifecycle) established that an appointment is three shipped things fused with a clock — a relocation intent with a due tick instead of a give-up tick, a seed that fires at a place in a window, and an agreement that does something when broken. This plan restates the primitive in full, decides the shape (one record of truth, not three), and hands off three execution slices.

## Substrate inventory

Grep evidence 2026-09-21 on `main` `df1cf66c`. `appointment` appears in `src/` only as prose in encounter/backstory content (10 files, zero engine hits); no `rendezvous`, `dueTick`, `atLocationId`, `windowTicks` anywhere in `src/engine/` or `src/types/`. The primitive does not exist; every piece it fuses does.

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| **Encounters & Dilemmas** — encounter seeding: `PendingEncounterSeed` (`unifiedAction.ts:1349-1403`: `targetAgentId`, `eligibleAfterTick`, `templateId` → `query` → `encounterFamily` resolution, `inheritedTargetId` / `inheritedBindings`, `resolutionLocationId` THR-1511), `evaluateEncounterSeeds` (`encounterSeeding.ts:462`, phase `2a.8`), the `encounter_seed` effect member (`unifiedAction.ts:458-491`), planting site `encounterAftermath.ts:1687` | 🟢 ACTIVE | **extends** — the seed gains an optional `appointment` block; `evaluateEncounterSeeds` gains the place-and-window test and the kept/missed conversion. The seed **is** the appointment's record of truth |
| **Movement & Awareness** — relocation intent (`relocationIntent.ts`, THR-1142): `computeRelocationIntentBonus` = `W / (1 + hexDistance)` read per encounter candidate at `encounterScoring.ts:1245`; `resolveRelocationIntentForAgent` retired in `phaseAgentDecision.ts:330` before every skip; `RELOCATION_INTENT_SCORE_WEIGHT = 0.5` (`movement-content.ts:245`), TTL 36; movement candidates priced by `findAllShortestPaths` (`movementCandidates.ts:67`, `tickDistance = pathResult.totalCost`) | 🟢 ACTIVE | **extends** — a sibling reader `computeAppointmentPull` on the same additive channel; the journey candidate goes through `scoreMovementCandidate` and the existing `MovementState` writer. No second movement path (the THR-1142 rule) |
| **Ambitions & Undertakings** — the decision board (`decisionBoard.ts:446-535`: `EVT × desire × temperament × variety`; an encounter's `valuePerTick` already divides by `travelCost + totalTickCost`, `encounterScoring.ts:1151-1161`; an undertaking's by `checkpointsRemaining`) ; checkpoints defer on `actor_absent` / `actor_busy` and count halts (`undertakingCheckpoints.ts:463-487`, `UNDERTAKING_CHECKPOINT_INTERVAL_TICKS = 6`, `UNDERTAKING_HALT_RATCHET_N = 3`) | 🟢 ACTIVE | **extends** — an overrun discount and a hard filter on candidates whose tick cost exceeds slack, applied to both families *before* the board ranks them; a running undertaking is never abandoned — the absence-deferral already prices the journey |
| **Secrets & Favors** — the world-object **Agreement** kind (`world-objects.ts:346-351`: edges `owes_favor` / `knows_secret_of`, classes `favor` / `mark`), the grid's `AGREEMENT` object type (`undertaking-objects.ts:2420-2470`: `isLiveAgreement` discriminator, `use` / `destroy` / `control:seize` eligibility, `create` mints a mark) | 🟢 ACTIVE | **extends** — the promise is an `owes_favor` edge carrying an `appointment` property (a favour of a particular shape, read by `isAppointmentFavour`); kept redeems it, missed marks it `broken`. The grid's `create × Agreement` gains an appointment payoff |
| **Attachments, Items & Possessions** — the attachment-layer `agreement` category (`attachments.ts:137-148`: `AgreementProperties.ticksRemaining`, no breach machinery; `agreement.bargain.promise_given` in `agreement-reward-catalog.ts`) | 🟢 ACTIVE | **preserves** — the Crossroads accept reaction stops granting `promise_given` (the appointment favour *is* the promise, and one promise on the sheet is the Law 56 reading); the catalog entry stays for other users. Breach machinery is built on the world-object edge, not here |
| **Personality & Emergent Traits** — `AxiologicalProfile` value pairs (`agent.ts:9-18`: `courage_prudence` meta axis, `loyalty_ambition` Heart axis), `resolveAxiologicalProfile` already read per board (`decisionBoard.ts:450`) | 🟢 ACTIVE | **reads** — the leave margin is a function of two existing axes; no new personality field |
| **Attention, Chronicle & Narrative** — Event nodes (`world-objects.ts:374-378`, `eventType` discriminator), aftermath words (`aftermathWords.ts:294-328`, ticks → *"four days"*) | 🟢 ACTIVE | **extends** — two event types, `appointment_kept` / `appointment_missed`; the due date renders through the existing ticks-to-words |
| **Content model** — `ContentQuery` (THR-1481, slices 1–5 Done), the seed's `templateId` → `query` order and `validateEncounterSeedRefs` (fatal on a dead id), `check:content-census` | 🟢 ACTIVE | **reuses** — both sequels are a gated literal or a query, never an ungated id (the THR-1489 cross-check); the census gains three counters |
| Encounter Factory harness — `compositionContract.ts` systems-quota keys (`:276-291`, `COMPOSITION_SYSTEMS_QUOTA_MIN = 3`, query double-count `:1143-1159`), `check-authoring-brief.ts` die-B `query_prize` floor (`:60-65`), `encounter-live-proof.ts` claims (`:173`), `check:chip-anchors`, `systems-prompt.md` "Live primitives" (`:44-52`), `nudge-authoring-spec.md` Seeded Sequel row (`:487-519`) | 🟢 ACTIVE | **extends** — one face, one key, two claims, one anchor, one list entry, one row. Every hook the ticket names is an existing mechanism gaining a member |

Runtime counts (THR-1476 body, seed 42 medium): the vertical slice's five encounters are the only shipped users of a placed-and-timed promise, and there are zero after THR-1476. Every appointment this plan makes reachable is new content; the census below is what proves any exist.

## Engine pillar

### Systems design

**One record of truth.** An appointment is a `PendingEncounterSeed` whose optional `appointment` block names the place, the due tick, the window, the counterparty, and the missed branch. Nothing is copied onto the mortal: the pull, the chips, the sheet row and the debug readout all read `state.encounterSeeds` filtered by `targetAgentId`. The vault analysis proposed intent-like agent-side state *plus* a placed seed; that is two copies of one fact that drift, and the relocation intent already showed the cost of a record that is only a lean. The seed is persisted, evaluated in phase `2a.8`, carries the cast, and is the thing that fires — so it is the appointment.

```ts
// src/types/unifiedAction.ts — on the encounter_seed effect member (authored) and PendingEncounterSeed (planted)
readonly appointment?: {
  /** Location or Place node — never a bare hex; the chip needs a name to link. Scene sentinels bind ($location, $cast:*). */
  readonly locationId: string;
  /** Authored as delayTicks-from-plant; stored as an absolute due tick. */
  readonly dueTick: number;
  readonly windowTicks?: number;                 // default APPOINTMENT_WINDOW_TICKS
  /** The other party. Needs no agency — the seed brings them. Bound from the cast at plant. */
  readonly counterpartyId?: string;
  /** What fires when the mortal is not there in the window. Gated literal or query, never an ungated id. */
  readonly missed: { readonly templateId?: string; readonly query?: ContentQuery; readonly seedLabel: string; readonly delayTicks?: number };
};
```

The kept branch is the seed's own `templateId` / `query`. Both branches pass `validateEncounterSeedRefs` and `check:encounter`; an appointment with only one branch authored is a composition **error** (§ Content).

**The promise on the graph.** At plant, alongside the seed, an `owes_favor` edge from the mortal to the counterparty (or, when there is none, to the place node) with `properties.appointment = { seedId, locationId, dueTick }`. This is a member of the world-object **Agreement** kind's existing `favor` class — a favour of a particular shape — so it is already a thing the grid can name, the sheet can list, and `isLiveAgreement` admits. `isAppointmentFavour(edge)` is the reading. No new node type, no new edge type, no new class: the classes table keys on edge type and *"every claimed value sits in exactly one class"* (`world-objects.ts:107`), so an `appointment` class would need a property-discriminated registry extension this plan declines — a favour that is a promise to be somewhere is still a favour.

**Slack.** For a mortal with live appointment seeds, every decision tick computes, for the nearest-due seed with non-negative slack: `slack = dueTick − tick − travelTicks(place)`, where `travelTicks` is the `totalCost` of the path `findAllShortestPaths` already prices for that tick's movement candidates (`movementCandidates.ts:67`); an unreachable place is `−∞`. Slack is computed once per mortal per tick and passed down; nothing recomputes paths.

**The curve, in three regimes** (constants in the table):

| Regime | Test | What the board does |
|---|---|---|
| Far | `slack > APPOINTMENT_PULL_HORIZON_TICKS` | nothing — life continues |
| Leaning | `APPOINTMENT_LEAVE_MARGIN ≤ slack ≤ HORIZON` | `computeAppointmentPull` adds `APPOINTMENT_PULL_WEIGHT / (1 + hexDistance(candidate, place))` to every encounter candidate — the relocation channel at `encounterScoring.ts:1245`, second term; every candidate of either family whose tick cost exceeds `slack` is multiplied by `APPOINTMENT_OVERRUN_DISCOUNT` before the board ranks |
| Departing | `slack < leaveMargin` and `slack ≥ 0` | candidates whose tick cost exceeds `slack` are **dropped**; a synthetic movement candidate for the place with `motivationPull = APPOINTMENT_JOURNEY_PULL` enters `scoreMovementCandidate` and wins unless a nearer candidate scores higher after the drop (a burning village three hexes away can still hold them — that is the story); a running encounter finishes first (the busy skip at `phaseAgentDecision.ts:356-373` is untouched); a running undertaking is **never** abandoned — its checkpoints defer on absence and halt out on their own clock |
| Lost | `slack < 0` | the pull stops; the seed waits for its due tick and converts (below) |

**The leave margin is where personality lives.** `leaveMargin = APPOINTMENT_LEAVE_MARGIN_TICKS + APPOINTMENT_PRUDENCE_MARGIN_TICKS × clamp01(−profile.courage_prudence) − APPOINTMENT_AMBITION_MARGIN_TICKS × clamp01(−profile.loyalty_ambition)`. A Watcher (prudent) leaves a day early; a Renegade (ambitious over loyal) cuts it fine, and at the defaults the margin can go **negative** — the mortal chooses to miss, which is the ruling's *rare and personality-driven* and exactly where a god's whisper belongs. Two existing axes, no new field.

**Several appointments.** Sorted by `dueTick`; the pull and the filter come from the nearest-due with non-negative slack. Two that cannot both be kept are decided by the same rule (the nearer wins the pull; the farther is missed when its due tick passes) — legible on the chip as *"cannot keep both"*. `APPOINTMENT_MAX_PER_MORTAL` refuses a fourth at plant with a trace.

**Firing and conversion** — in `evaluateEncounterSeeds`, before the existing resolution ladder, for a seed with an `appointment` block whose `eligibleAfterTick` (= `dueTick`) has passed:

1. `tick ≤ dueTick + windowTicks` **and** the target's hex equals the place's hex (`resolveAgentHex` vs `resolveLocationToHex` — hex-granular, the awareness rule): **kept**. The seed fires through the existing ladder with `resolutionLocationId = locationId` (THR-1511's field, so a subtype-gated query is judged at the place); the favour edge is removed (redeemed); an Event node `appointment_kept` is written; trace.
2. `tick > dueTick + windowTicks` (present or not — the window closed): **missed**. The seed is rewritten in place: `templateId` / `query` ← `missed.*`, `eligibleAfterTick = tick + missed.delayTicks ?? APPOINTMENT_MISSED_SEQUEL_DELAY_TICKS`, `appointment` cleared and `missedAppointment = { locationId, dueTick }` kept for the trace and the chip; the favour edge gains `broken: true` and stays until the missed sequel fires (its aftermath may keep or retire it — the chip reads the edge); Event node `appointment_missed`; trace. The missed sequel then fires **wherever the mortal is**, through the unchanged placeless path.
3. Otherwise (due, in the window, not there yet): the seed waits. Arriving early is fine — the mortal stands at the place and takes local encounters whose cost fits the remaining ticks.

**What does not change.** Placeless seeds, `inheritContext`, the resolution ladder, the withered-narrative fail-soft, `resolveRelocationIntentForAgent`, `MovementState`'s writer, the busy skip, the checkpoint deferral, the neglect loop, every existing trace.

### Graph nodes / edges

No new node or edge type. One `owes_favor` edge per appointment with `properties.appointment` (and `broken` on a miss); two new `eventType` values on Event nodes (`appointment_kept`, `appointment_missed`), added to `EVENT_TYPES` so `world-objects.generated.md` counts them.

### Tick phases

None new. Slack and the pull run inside phase `2a` agent decision (where the relocation read already runs); firing and conversion inside `2a.8` seed evaluation.

### Resolution logic

Deterministic: slack is arithmetic over an already-priced path; the regimes are threshold tests; the journey candidate is scored by the existing `scoreMovementCandidate`. The kept sequel resolves through the existing seed ladder (one `rng()` for a query draw, the same stream as today).

### PRNG callouts

None added. The missed branch's query draw uses the seed ladder's existing draw at fire time.

## Content pillar

### Encounter templates

**The first user, made true by construction.** A Bargain at the Crossroads (`vertical-slice.ts`, `bargain_at_crossroads`): the accept reaction's `encounter_seed` for `SLICE_TEMPLATE_IDS.fullMoon` gains `appointment: { locationId: '$location', dueTick: +SLICE_FULL_MOON_DELAY_TICKS, counterpartyId: '$cast:stranger', missed: { query: { kind: 'encounter_template', tags: ['#crossroads_debt'] }, seedLabel: 'the stranger collects' } }` and drops the `attachment_grant` of `promise_given`. The opening returns to *collect it here at the next full moon*; the Full Moon Collection's opening returns to the crossroads under the moon and its gift chip may again say they came — because now they did. The kept sequel is the gated literal (`validateEncounterSeedRefs` is fatal on a dead id); the missed sequel is a query, so a second reckoning authored later joins by tag.

**The missed sequel, authored with the parent** (the Seeded Sequel rule): `encounter.slice.full_moon_reckoning` — *The Stranger Finds Them*: one step, the stranger's arrival wherever the road has taken them, the broken promise on the table; bands per the outcome ladder; the aftermath's BOND chip anchors the broken favour edge (Law 56 — a real write). Tagged `#crossroads_debt` (seated in `content-tag-catalog.generated.md`). It is the corpus's first `appointment_missed` user and the live proof's second branch.

**Prose rule 7b gains its lawful exception**, in the same three files THR-1476 amended: `nudge-authoring-spec.md` (rule 7b: *…unless an `appointment` block enacts it — the only lawful way to write a place-and-time promise*; the Seeded Sequel row gains the placed/timed variant; the Consequence Draw palette gains `appointment` under PATH; the Plot-Hook Draw may roll a hook whose premise is a meeting to keep), `SKILL.md` (the REVISE trigger names the exception), `systems-prompt.md` (**Live primitives** list gains `appointment` — miss this and the systems agent BLOCKs every appointment draft as a missing primitive, the silent killer; and the Aftermath Supportability question gains *"does every place-and-time promise name its appointment block, with both sequels?"*).

### Prose tables

Two chronicle lines beside the strategic ones in `strategic-action-constants.ts`'s sibling for encounters: *`${name} keeps their word at ${place}`* on kept (significance `APPOINTMENT_EVENT_SIGNIFICANCE`), *`${name} was not at ${place} when the moon came round`* on missed. The due date on every surface renders through `aftermathWords`' ticks-to-words (*"in four days"*, never a tick count — Laws 13/14).

### Attachment content

None new. `agreement.bargain.promise_given` stays in the catalog for other authors; the Crossroads stops granting it.

### Data tables

Constants table below. **Systemic wiring guide** — *Capability 31: Appointments* (after Capability 30), with the Crossroads bargain as the worked example: the package as it should have been written, the two-sequel rule, the 7b exception, and the reachability row. **Canon** `Docs/canon/encounters.md`: one paragraph naming the block and the rule. **UL** `Docs/ubiquitous-language/Encounters.md`: **Appointment** seated beside Seed — *a seed bound to a place and a due tick, kept by being there in the window, missed otherwise; the promise is a favour owed*. **Rulebook**: one sentence under Encounters tagged `[IMPL]` on ship.

## UI pillar

*Screenshot tool: **Playwright (DOM)** — every surface is DOM: the encounter veil's consequence chips, the threads panel, the mortal sheet. Route: `?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads`, accept, capture the PATH chip; `window.__DEBUG.tick(n)` past the due tick with the mortal present (`move agent` via the CLI or `__DEBUG`) and absent, capture the thread-row badge and the sheet row; `?spawn=encounter.slice.full_moon_reckoning` for the broken-promise chip. Four-part evidence per DoD.*

### Player-facing display

- **The promise is made** — the aftermath's PATH chip (`buildAftermathConsequences.ts:735-747`, the `seed` kind) gains the appointment sentence, ≤15 words, sheet words: *"A meeting at the Crossroads, in eleven days."* Hover: what it keeps and what happens if missed. Click routes through the one card, one router (THR-1482) to the place. **Laws 12** (first-contact legend for the new chip shape), **13/14** (words, not numbers), **21**, **56** (the seed and the favour edge are real writes).
- **The thread row** — `ThreadsPanel.tsx`'s doing-line / badge model gains a clock badge while an appointment is pending: *"keeps a promise at the Crossroads · four days"*; regime word on hover (*far · leaning · on the road · waiting · lost*).
- **The sheet** — the row where favours already render (BondsTab, via `agentAttachments` / the Agreement kind's card) lists the appointment favour in words; a broken one reads *broken* with the missed sequel's name when it has fired.
- **The missed sequel** — its BOND chip anchors the broken favour (Law 56); its SCAR-tone reading is the reputation write the author chooses, not a hidden number.

### Event notifications

Chronicle lines on kept and missed (above). No toast — a followed mortal's departure is already a moment through THR-1299's stream; kept/missed are chronicle-eligible at their significance.

### Debug inspection (DebugPanel)

- `window.__DEBUG.getAppointments(agent?)` → `{ seedId, place, dueTick, windowTicks, slack, regime, leaveMargin, counterparty }[]`; CLI `appointments [agent|@hero]`.
- `EncounterSeedsTab.tsx` shows the appointment block on a seed row.
- Four traces in the trace viewer (below).

### Visual presence (HexMapV2)

N/A — the journey is the ordinary movement trail; no new signifier.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `engine/encounterSeeding.ts` (kept / missed / wait arm; `resolutionLocationId` on kept) | `2a.8` | — | `encounterSeeds[]` (`appointment`, `missedAppointment`) | `appointment_kept`, `appointment_missed` | `__DEBUG.getSeeds()`, `EncounterSeedsTab` |
| `engine/encounterAftermath.ts` (plant: bind `$location` / `$cast:*` in the block; write the favour edge; refuse over max) | aftermath | PATH chip | `encounterSeeds[]`, graph `owes_favor` | `appointment_planted` | `__DEBUG.getAppointments` |
| `engine/appointments.ts` (new: `isAppointmentFavour`, `computeAppointmentSlack`, `computeAppointmentPull`, `leaveMargin`, `appointmentRegime`) | `2a` decision | — | reads seeds + graph | `appointment_regime` (on regime change only) | `__DEBUG.getAppointments`, CLI |
| `engine/encounterScoring.ts:1245` (second additive term), `engine/phaseAgentDecision.ts` (overrun discount, departing filter, journey candidate via `scoreMovementCandidate`) | `2a` | — | `MovementState` (existing writer) | existing movement traces | trace viewer |
| `components/Game/encounter-stage/adapters/buildAftermathConsequences.ts`, `ThreadsPanel.tsx` (+ badge model), the favours row (`BondsTab.tsx` / `AgentProfileModal.tsx`) | — | those | reads seeds + edge | — | Playwright capture |
| `types/trace.ts` + the three other registration sites (`TRACE_CATEGORY_COLORS`, `trace.test.ts` list, the category union) | — | — | — | four categories | — |

Prose pipeline: the chip sentence and chronicle lines go through the existing words tables; no `enrichProse()` slot. Player controls: none — the god nudges through the cards already in the encounter; a whisper or compulsion is the existing lever.

## Constants table

In `src/data/movement-content.ts` beside the relocation constants (NFP #1):

| Constant | Default | Purpose |
|----------|---------|---------|
| `APPOINTMENT_WINDOW_TICKS` | `12` | how long the meeting can be kept once due (one day) |
| `APPOINTMENT_PULL_HORIZON_TICKS` | `24` | slack at or below which the lean begins (two days) |
| `APPOINTMENT_PULL_WEIGHT` | `1.0` | the additive pull at the place; twice relocation's `0.5` deliberately — a promise *is* the trade THR-1142 declined |
| `APPOINTMENT_OVERRUN_DISCOUNT` | `0.25` | multiplier on a leaning-regime candidate whose tick cost exceeds slack |
| `APPOINTMENT_LEAVE_MARGIN_TICKS` | `6` | base slack at which the mortal departs (half a day) |
| `APPOINTMENT_PRUDENCE_MARGIN_TICKS` | `12` | added margin at full prudence (`courage_prudence = −1`) |
| `APPOINTMENT_AMBITION_MARGIN_TICKS` | `12` | margin removed at full ambition (`loyalty_ambition = −1`); at defaults the margin spans `[−6, 18]`, so a Renegade can choose to miss |
| `APPOINTMENT_JOURNEY_PULL` | `1.0` | motivation pull of the synthetic journey candidate (above every `computeBasePull` seen on the census seeds; executor asserts the max) |
| `APPOINTMENT_MISSED_SEQUEL_DELAY_TICKS` | `12` | ticks after the window closes before the missed sequel is eligible |
| `APPOINTMENT_MAX_PER_MORTAL` | `3` | a fourth is refused at plant |
| `APPOINTMENT_EVENT_SIGNIFICANCE` | `0.5` | chronicle significance of kept / missed |
| `APPOINTMENT_BRIEF_FLOOR` | `1` | die-B `appointment` faces per batch of six — the **second and last free floor** (THR-1489's arithmetic: a third puts half the shape axis under forced draws). **Home: `PACKET_BATCH_BOUNDS` in `src/data/content-eval/packetDice.ts` beside `queryPrizeFloor`, not the movement constants** — slice 2 |

## Tracing

Register the members at all four sites; do not duck-type (`emitTrace`'s `Omit` collapses unions).

```ts
// appointment_planted — an encounter ending planted a placed, timed seed
interface AppointmentPlantedTrace extends TraceBase {
  category: 'appointment_planted';
  agentId: string; seedId: string; locationId: string; dueTick: number; windowTicks: number;
  counterpartyId?: string; templateId?: string; refused?: 'over_max' | 'place_unresolved';
}
// appointment_regime — the mortal's regime changed (far → leaning → departing → waiting | lost)
interface AppointmentRegimeTrace extends TraceBase {
  category: 'appointment_regime';
  agentId: string; seedId: string; regime: 'far' | 'leaning' | 'departing' | 'waiting' | 'lost';
  slack: number; travelTicks: number; leaveMargin: number;
}
// appointment_kept — present in the window; the kept sequel fired
interface AppointmentKeptTrace extends TraceBase {
  category: 'appointment_kept';
  agentId: string; seedId: string; locationId: string; dueTick: number; arrivedTick: number; resolvedTemplateId: string;
}
// appointment_missed — the window closed; the seed converted to the missed branch
interface AppointmentMissedTrace extends TraceBase {
  category: 'appointment_missed';
  agentId: string; seedId: string; locationId: string; dueTick: number;
  reason: 'absent' | 'unreachable' | 'chose_to_miss' | 'place_lost'; missedTemplateId?: string; missedQuery?: string;
}
```

`appointment_regime` fires on change only — a handful per appointment, never per tick.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `$location` / `$cast:*` sentinel does not bind at plant | seed planted **placeless** (today's shape); `appointment_planted` with `refused: 'place_unresolved'`; the gate makes this an authoring error before it ships |
| Place node gone before due (dissolved settlement) | seed converts to placeless at the next `2a.8` pass; `appointment_missed` with `reason: 'place_lost'` and the **kept** branch fires wherever they are — the world broke the promise, not the mortal |
| No path from the mortal to the place | slack `−∞`, regime `lost`; missed at the window's close with `reason: 'unreachable'` |
| Counterparty dead at fire | existing `inheritedTargetId` fallback (self-target) — the sequel still fires; the favour edge is removed |
| Target is not an autonomous decision actor (ambient / notable) | no pull can run; the seed still fires if they happen to be present, else converts. `check:encounter` warns when an appointment targets anything but `$actor` / a threaded id |
| A fourth appointment | refused at plant with `refused: 'over_max'`; the aftermath's other effects apply |
| Two appointments due the same tick at two places | nearest by travel wins the pull; the other is missed with `reason: 'chose_to_miss'` |
| Malformed `appointment` block on a saved world | reads as absent (the `readRelocationIntent` shape-validating idiom); placeless behaviour |
| Journey candidate's place is where they already stand | no candidate injected; regime `waiting` |

## Interface impact

| Contract | Action | Producer → Consumer |
|----------|--------|---------------------|
| `appointment-pulls-agent-movement` | **add, LEAKED-with-ticket at filing** (THR-1479 slice 1) | `encounterSeeds[].appointment` → `computeAppointmentPull` (encounter scoring) + the journey candidate (movement selection) |
| `missed-appointment-breaks-agreement` | **add, LEAKED-with-ticket at filing** (THR-1479 slice 1) | `evaluateEncounterSeeds` missed arm → `owes_favor.properties.broken` → sheet row + missed sequel's chip |
| `encounter-seed-resolves-by-query` (THR-1488) | **preserve** | the missed branch is a query through the same resolver |
| `content-query-one-resolver-engine-and-gate` | **preserve** | both branches gated by `validateEncounterSeedRefs` / `check:encounter` |
| Relocation intent → encounter scoring (THR-1142) | **preserve** | untouched; a second term on the same channel |

Systems-inventory keywords `appointment`, `rendezvous`, `due tick` added to the Encounters and Movement rows so the DORMANT badge reports non-use.

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/unifiedAction.ts` | 494 (`.codesight/graph.md`, 2026-09-21) | one **optional** field on two existing shapes; no existing field changes; `check:typecheck` ratchet must report unchanged |
| `src/types/trace.ts` | ~120 | four union members + four interfaces; the ratchet covers it |
| `src/types/gameState.ts` | 599 | **not edited** — `encounterSeeds[]` already exists |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] Does not contradict a Vision premise. A promise the mortal can keep or break is `00-north-star.md`'s witnessing seat made sharper — the god watches them choose, and nudges through the cards; *forks are the mortal's* (`02-non-negotiables.md` #1) is why the leave margin can go negative rather than the engine forcing the walk. Failure is plot: a missed meeting is a sequel, never dead air.
- [x] No Vision edit required.

## Rulebook impact

- [x] **Changes a rule of play** (Encounters): *An encounter may bind a mortal to a place by a time. They lean toward it, then go; a prudent mortal leaves early and an ambitious one may choose to miss. Kept, the promised meeting fires there; missed, a reckoning finds them wherever they are, with the broken promise on their sheet.*
- [x] `Docs/canon/rulebook.md` is updated in the same PR as the code — the sentence lands under Encounters tagged `[IMPL]` on ship, in the slice-1 PR, and the executor re-verdicts the section when the tag flips.

> Brainstorm companion: `Docs/plans/2026-09-21-thr-1479-appointment-primitive-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | twelve named constants; the margin is a formula over two of them and two existing axes |
| 2. Inspectability | PASS | four registered traces, `getAppointments`, CLI, seeds tab, two Event kinds |
| 3. Determinism | PASS | slack is arithmetic over the priced path; no new draw |
| 4. Fail-soft | PASS | nine rows; every unresolvable input degrades to today's placeless seed |
| 5. Narrative over mechanical perfection | PASS | a Renegade who chooses to miss is the story; the world losing the place is not the mortal's fault |
| 6. Additive over destructive | PASS | optional fields, one new engine module, one favour edge; nothing deleted; `promise_given` stays in the catalog |
| 7. Performance budget | PASS | slack reuses the tick's shortest-path map; one filter pass over candidates; regime trace on change only |

## Done when

**Slice 1 — the primitive, its first user, its surfaces (THR-1479):**

- [ ] Unit, on fixtures that falsify: slack arithmetic (reachable / unreachable / at the place); the regime thresholds at each boundary; leave margin at the four axis corners including a negative margin; the overrun discount applies only in `leaning` and the drop only in `departing`; the journey candidate is scored by `scoreMovementCandidate` and loses to a nearer higher-pull candidate; kept fires only in the window **and** on the hex; missed converts and rewrites the seed; the favour edge is redeemed on kept and `broken` on missed; a fourth appointment is refused; a `place_lost` fires the kept branch placeless
- [ ] Generated small world on `cells`: plant on `@hero` via the Crossroads accept → advance → the mortal departs at `slack < leaveMargin` (regime trace) → present at due → `appointment_kept` and the Full Moon Collection on the crossroads hex; the twin with `move agent` away at due → `appointment_missed` → the reckoning fires elsewhere with the broken favour on the sheet
- [ ] The Crossroads bargain and the Full Moon Collection re-authored to the placed truth; `full_moon_reckoning` authored, tagged, gated; `check:encounter` green with both branches; prose rule 7b exception in the three files
- [ ] PATH chip sentence, thread-row badge, sheet row, broken-promise chip — Playwright four-part evidence at 1920×1080 on the routes above; Laws 12, 13/14, 21, 56 cited
- [ ] Four traces registered at all four sites; `__DEBUG.getAppointments`, CLI `appointments`; Event kinds in `EVENT_TYPES`
- [ ] Interface contracts registered LEAKED-with-ticket; rulebook sentence, canon paragraph, UL term landed; wiki freshness green
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build`; 30-tick CLI smoke; `npm run test:heavy` locally
- [ ] Closing commit body and PR body include `Fixes THR-1479`

**Slice 2 — the harness (child ticket, blocked by slice 1):** wiring guide Capability 31 with the Crossroads as worked example; spec / SKILL / systems-prompt amendments if slice 1 did not land them; die-B face `appointment` with `APPOINTMENT_BRIEF_FLOOR`; `appointments` systems-quota key (**an appointment seed earns `appointments` in place of `seeds`, plus `content_query` when its missed branch is a query — two at most, the same ceiling a query seed has today**); composition error on a single-branch appointment; `check:chip-anchors` accepts the appointment as a PATH anchor; live-proof claims `appointment_kept` / `appointment_missed` driving the world present and absent; `check:content-census` counts appointments authored / kept / missed per seeded 200-tick run and the weekly hygiene routine reports them; **the reachability row**: a census hit on a seeded run, not a gate reading the code; interface contracts flip 🟢.

**Slice 3 — the grid (child ticket, blocked by slice 1):** `create × Agreement` gains an optional `appointment` payoff on the template (plants the appointment seed on completion, place = the work's site, query for the meeting); `LIVE_CELL_NOTES` row; `GraphCondition` gains `agent_kept_appointment` (count of `appointment_kept` Event nodes for the agent ≥ N); at least one ambition template lists the cell (executor's pick: an ambition whose family already lists `create × Agreement`, else the social ambition nearest to a parley); reachability contract green. **`use × Agreement:appointment` is declined** — keeping an appointment is a journey the decision phase makes, not a work; the ticket's table row is amended in the handoff.

## Kill criteria

- On the census seeds, mortals with a live appointment abandon running undertakings at a rate above the halt baseline → `APPOINTMENT_PULL_HORIZON_TICKS` shortens before anything else moves; if the journey candidate is winning over encounters at the mortal's own hex, `APPOINTMENT_JOURNEY_PULL` is too high.
- Appointments are kept ≥ 95% of the time across temperaments → the margin formula is not reaching the negative range; widen `APPOINTMENT_AMBITION_MARGIN_TICKS` before touching the base.
- Two batches after slice 2 lands, the census reports zero authored appointments → retro finding *dead primitive*; the die floor and the systems-prompt entry are the first suspects.
- A second copy of the appointment appears on the mortal node → the one-record rule regressed; the seed is the record.

## Coordination block

**Suggested model:** opus — three engine seams (seeding, scoring, movement selection) touched in one slice, with the regime arithmetic and the conversion arm needing judgment; content and UI follow the plan mechanically.
**Parallel-safe with:** [THR-1348](https://linear.app/threadbare/issue/THR-1348) (tier pull — `ambitionAssignment.ts` / `strategicKindReachability.ts`, disjoint from seeding and scoring), [THR-1448](https://linear.app/threadbare/issue/THR-1448) (held-town position — `decisionBoard.ts` desire term and faction gates; this plan's filter runs *before* the board and does not edit `scoreUnifiedBoard`), [THR-790](https://linear.app/threadbare/issue/THR-790) (traits — disjoint).
**Mutex with:** any ticket editing `src/engine/encounterSeeding.ts` or `src/engine/phaseAgentDecision.ts` (both edit the seed evaluation arm / the decision loop) — none queued at handoff; [THR-1348](https://linear.app/threadbare/issue/THR-1348) only if its plan lands the pull in `phaseAgentDecision.ts` rather than at assignment (the ruling prefers assignment; re-check at claim).
**Files to touch:** (slice 1) `src/types/unifiedAction.ts` (two optional fields), `src/types/trace.ts` (+ the three other registration sites), `src/engine/appointments.ts` (new), `src/engine/encounterSeeding.ts` (kept / missed / wait arm), `src/engine/encounterAftermath.ts` (plant: bind sentinels, favour edge, max), `src/engine/encounterScoring.ts` (second pull term), `src/engine/phaseAgentDecision.ts` (discount, drop, journey candidate), `src/data/movement-content.ts` (constants), `src/data/world-objects.ts` (`EVENT_TYPES`), `src/data/encounters/vertical-slice.ts` (Crossroads + Full Moon re-authored; `full_moon_reckoning`), `src/components/Game/encounter-stage/adapters/buildAftermathConsequences.ts`, `src/components/Game/ThreadsPanel.tsx` (+ badge model), the favours row component, `src/components/Game/debug/EncounterSeedsTab.tsx`, `src/debug-bridge.ts` + `.d.ts`, `scripts/cli.ts`, `scripts/interface-contracts.ts`, `.claude/skills/encounter-pipeline/{reference/nudge-authoring-spec.md,SKILL.md,agents/systems-prompt.md}`, `Docs/canon/{rulebook.md,encounters.md,systems-inventory}` keywords, `Docs/ubiquitous-language/Encounters.md`, wiki page per manifest; tests: `src/engine/__tests__/appointments.test.ts` (new), `encounterSeeding-appointment.test.ts` (new), a generated-world test beside `encounterAftermath-agent_relocation.test.ts`.

## Notes for the executor

- **The seed is the appointment.** Do not add an `appointments` property to the mortal node. Everything reads `state.encounterSeeds` filtered by target; the favour edge is the *promise*, not a second record of the meeting.
- **No second movement path.** The journey candidate enters `scoreMovementCandidate` and the existing `MovementState` writer; nothing here calls `rebindLocatedAt`. If the mortal does not go, the board outvoted the promise — trace it, do not force it.
- **The drop runs before the board, not inside it.** `scoreUnifiedBoard` is untouched; THR-1448 will be adding a desire term there, and two editors on that function is the mutex this plan avoids.
- **Kept requires the hex, not the node.** Standing at any Place inside the Location's hex is keeping it — the awareness rule. A sublocation-level test would make every appointment at a town missable by standing in the wrong inn.
- **Both branches or a composition error.** A parent that authors an appointment without a missed branch is the cutscene-with-a-walk the ruling forbids. The gate is what makes the rule true; land it in slice 1 if the composition file is already open, else slice 2 owns it.
- **Never an ungated id.** The Full Moon Collection is a literal because it is one authored scene — the gate covers it. The reckoning is a query because it is a kind. Do not invert them.
- **`promise_given` goes, on the Crossroads only.** One promise on the sheet. The catalog entry stays for other users.
- **The wiki gate will fire** (`encounterSeeding.ts` and `phaseAgentDecision.ts` are in page sources). Update; do not exempt.
- **THR-1476's rule stays.** 7b is still the law; the appointment block is its one exception, and the systems-prompt question is what enforces that the exception is *used* rather than the rule ignored.
- **The die floor is the last free one.** Two floors on die B (`query_prize`, `appointment`) is the ceiling THR-1489's comment measured. Do not add a third.
- **`touchWorld` at plant.** The favour edge is a graph write inside the aftermath dispatcher; call `touchWorld(runtime)` at the plant site the way the other aftermath graph ops do, or the sheet row serves stale state.
- **Ruling 2 means "not the god".** *Only encounters mint appointments for now* excludes the god making appointments between mortals; it does not exclude slice 3's `create × Agreement` payoff, which the ticket's own table asks for. Do not defer slice 3 on the ruling.
- **No halt-tolerance constant, on purpose.** The ticket's design Done-when lists one; the plan has none because a running undertaking is never abandoned and the checkpoint deferral already prices an absence. Adding one would be a second clock on the same journey.
- **UL seat.** The canonical heading is **Encounter Seed** (alias Seed) in `Encounters.md`; seat **Appointment** beside it. The promise's kind is the world-object **Agreement** in `Agents.md`, not the attachment-layer category in `Traits.md`.

## Intent-judge verdict

**Run 1 (fable, cold, 2026-09-21): Allow** — impact class corrected upward from Reversible to **External** (the skill-file edits change what the encounter-pipeline's systems auditor blocks and what every batch rolls; the composition gate and interface-map generator are CI preconditions). Eleven dimensions PASS, zero GAPs, zero VIOLATIONs. Seven advisory notes, all applied in this revision: the die-B floor constant's home is `PACKET_BATCH_BOUNDS` (`packetDice.ts`), not the movement constants; `touchWorld` at the plant site; ruling 2 reads *not the god*, so slice 3 is not deferred on it; importer count refreshed 476 → 494; **Appointment** seats beside **Encounter Seed** and the promise's kind is `Agents.md` § Agreement; the absent halt-tolerance constant is intentional; the coordination block names the skill-file edits.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-21 (sonnet, three auditors spawned in one message).*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | 12 named constants (§Constants table); leave margin is a formula over 2 of them + 2 existing personality axes, no magic numbers |
| 2. Inspectability | PASS | 4 traces registered "at all four sites" (§Tracing); `__DEBUG.getAppointments`, CLI `appointments`; `EncounterSeedsTab.tsx` row; Wiring table maps every module to phase/UI/GameState field/trace/debug per wiring-checklist.md format |
| 3. Determinism | PASS | "slack is arithmetic over an already-priced path"; PRNG callouts section: "None added"; missed-branch draw reuses existing seed-ladder stream |
| 4. Fail-soft | PASS | 9-row fail-soft table; every case degrades to "today's placeless seed" behavior, never throws |
| 5. Narrative over mechanical | PASS | negative leave-margin (chosen miss) framed as story per director ruling; place-lost case explicitly "the world broke the promise, not the mortal" |
| 6. Additive over destructive | PASS | two optional fields on existing shapes, one new module (`appointments.ts`), one new edge property; "nothing deleted"; `promise_given` catalog entry explicitly preserved |
| 7. Performance budget | PASS | slack reuses the tick's already-computed shortest-path map (no new pathfinding); regime trace fires "on change only," not per-tick; one filter pass over candidates |

**NFP AUDIT: PASS.**

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Systems design, graph nodes/edges, tick phases, resolution logic, PRNG callouts all filled with concrete file:line references and a full state machine (regimes, slack, conversion) |
| Content | present-and-substantive | Encounter templates, prose tables, attachment content, data tables all filled; names the specific template (Crossroads) as first user plus a new missed-sequel template |
| UI | present-and-substantive | Player-facing display, event notifications, debug inspection, visual presence all addressed; Visual presence marked N/A-with-rationale — acceptable per-subsection N/A |

No missing required sections. Wiring table connects each module to phase, UI component, GameState field, trace and debug visibility, plus the prose-pipeline and player-controls notes. Substrate-existence check: `## Substrate inventory` opens with grep evidence; every subsystem cross-checked against `Docs/canon/systems-inventory.md`, all 🟢 ACTIVE, all *extends* — no green-field duplication. **PILLAR AUDIT: PASS.**

### Vision audit

`00-north-star.md` → forks are always the mortal's — confirmed (negative leave margin; kept/missed resolve through fate). `01-core-loop.md` → scan → encounter → aftermath rhythm — confirmed (background arithmetic; surfaces only through chips). `02-non-negotiables.md` → god not protagonist (only encounters mint; influence stays through cards); everything is a graph node/edge (reuses `owes_favor`, declines a new type); three pillars present; additive — all confirmed. `03-design-tensions.md` → divine remove vs. attachment — extended (a kept or broken promise deepens the mortal's personhood without adding control). `taste-profile.md` → no numbers in UI — confirmed. One soft lean noted: `APPOINTMENT_MAX_PER_MORTAL = 3` risks a mortal juggling clocks reading as a dashboard; capped and mostly invisible, so minor. No contradictions. **VISION AUDIT: PASS-with-notes.**
