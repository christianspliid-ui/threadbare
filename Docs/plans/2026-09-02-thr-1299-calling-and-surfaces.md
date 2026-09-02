> **title:** `The calling & the surfaces — THR-1299`
> **linear_issue:** THR-1299
> **author:** `Claude Code`
> **created:** 2026-09-02
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# The calling & the surfaces — THR-1299

*The undertaking machine docs 1–3 shipped runs entirely off-screen: this doc gives the player the follow affordance, the moment card, the arc panel, and the derived calling that make a mortal's projects watchable — and closes the one 🔴 LEAKED contract on the board.*

## Why this is load-bearing

Plan doc 5 of 6 from the closed [Proactive Agent Actions wayfinder map](https://linear.app/threadbare/issue/THR-1276/proactive-agent-actions-wayfinder-map). Verified 2026-09-02 (fresh recon against `main` @ `af0e898d`): the producer half of the moment stream is fully shipped and fully unconsumed. `resolveMomentPresentation` computes `'interrupt' | 'badge' | 'none'` per review ruling 2.1 and the value dies in the trace buffer (`undertakingCheckpoints.ts:175-195`, `:817`); moment `TickEvent`s carry no `notification` directive so `notificationRouter.ts:124` drops them, and their significance (0.4/0.55) sits below `phaseNarrative`'s 0.8 chronicle threshold (`orchestrator.ts:2530-2537`) so the chronicle drops them too. `followedAgentIds` is written exactly once, at init, to `[]` (`gameInit.ts:342`) — no affordance, no second reader — which makes `everInterrupted` near-always false and the failure-scar register (`recordFailureScar`, `strategicActionLifecycle.ts:731-733`) effectively unreachable. The `undertaking-checkpoint-events` contract is registered **🔴 LEAKED** (`Docs/canon/interface-map.generated.md`, deferral [THR-1293](https://linear.app/threadbare/issue/THR-1293/undertaking-checkpoints-have-no-player-facing-consumer-the-moment) — folded into this doc). Every design decision is settled input: [THR-1279 verdicts + amendment](https://linear.app/threadbare/issue/THR-1279/mock-following-an-agents-arc-the-project-moments-surface), [THR-1281 §7b (the calling)](https://linear.app/threadbare/issue/THR-1281/the-action-library-grammar-crud-verbs-across-reaches-and-tiers), [THR-1282 §6 (provenance)](https://linear.app/threadbare/issue/THR-1282/the-reactive-loop-how-outcomes-mint-new-drives), and the review record §2.1/§3 + Appendix C C1/S5/M1/M3/M4 (`Docs/audits/2026-08-26-proactive-agent-actions-review.md`). This doc is the engineering of those rulings.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Undertaking checkpoints (`undertakingCheckpoints.ts`) | 🟢 ACTIVE | **extends** — moment records enter a consumable queue; two emission defects fixed (completion gate, dead `started` branch); `isFollowedAgent` gains the mute clause |
| Notification router + threading gate (`notificationRouter.ts`, `notificationThreadingGate.ts`) | 🟢 ACTIVE | untouched — moments deliberately do NOT ride the toast channel (ruling 2.1: interrupt/badge only; badges are recovery, not toasts) |
| Player receipts (`playerReceipts.ts`) | 🟢 ACTIVE | pattern source only — capped queue, idempotency flag, pure tiering fn are copied idioms, not shared code; the `modal|toast` vocabulary stays receipts-only |
| Badge family (`threadTugBadgeModel` / `encounterBadgeModel` / `entityNoticeBadgeModel`) | 🟢 ACTIVE | **extends** — the moment badge is the fourth member ("one vocabulary in three tenses" gains its fourth) |
| Interrupt registry (`GameView.tsx:3548-3572` + `useInterruptAutoPause`) | 🟢 ACTIVE | **extends** — one new `pendingMoment` term + `getDebugOpenModals` entry |
| Chronicle (`phaseNarrative`, `ChroniclePanel`) | 🟢 ACTIVE | **extends** — interrupt-tier moments and calling changes reach it via significance, no threshold edit |
| BehaviorFamily presentation (`strategicPresentation.ts:26-40` + 4 live render sites) | 🟢 ACTIVE | **retires into the calling** — presentation layer swaps in the same PR-window (review Eng M1); the enum and template fields stay (their mechanical retirement is docs 4/6 conversion ground) |
| `AgentProfileModal` → `JourneyTab` (`tabs/JourneyTab.tsx`) | 🟢 ACTIVE | **extends** — this IS the arc panel; the "future update" stub dies |
| `AgentDetailPanel.tsx` | ⚫ DEAD (unmounted; interface-map documented-dead) | **not extended** — nothing in this doc lands there; correction already posted on THR-1298 |
| Holdings & works (`holdings.ts`, `naming/workNames.ts`, `AttachmentsTab`) | 🟢 ACTIVE | **extends** — display already shipped; player-facing label corrected to *Freehold* (THR-1314 arbitration); works strip on the arc |
| Attention court (`attentionTier.ts`, thread edges, `courtPosition`) | 🟢 ACTIVE | **reconciled** — the default-follow read becomes court-position-aware (`dormant`/`watched` are not default-followed), retiring the documented predicate divergence the orchestrator filed on this ticket 2026-08-27; court semantics themselves untouched |

## Engine pillar

### Systems design

**Follow state — one field, one mute, one writer module.** `state.followedAgentIds` (shipped, doc 1) stays the explicit-follow list; new optional `state.mutedAgentIds?: string[]` expresses the un-follow of a default-followed agent — the gap doc 1's own comment hands to this doc (`undertakingCheckpoints.ts:208-211`: *"a missing unfollow is a missing feature while a mute-by-default is a bug"*). New single-writer module `src/engine/followedAgents.ts`: `followAgent(state, agentId)` (adds to list, clears mute), `unfollowAgent(state, agentId)` (removes from list; if the agent is default-followed, adds to mute), `isFollowed(state, graph, agentId)`. A muted agent's moments resolve `badge`, never `interrupt` — mute drops the upgrade, it does not silence the stream.

**The default-follow read is court-position-aware — the dormant divergence closes here (option 1 of the orchestrator's 2026-08-27 finding on this ticket).** Today `isFollowedAgent` (`undertakingCheckpoints.ts:213-216`) tests bare `thread`-edge *existence*, while every attention predicate (`resolveEffectiveTier`, `phaseAttention`, `encounterVisibility`) keys on the edge's `courtPosition` — so a player who casts `thread.dormant` ("their encounters no longer surface as tugs… the thread persists") would silence encounters and still be interrupted by undertaking news. `isFollowed` therefore reads: explicit `followedAgentIds` entry, **or** a live `thread` edge whose `courtPosition` ∈ `{'the_first', 'retinue'}` — exactly the ruling's default-followed population — and in both cases `&& !muted`. `dormant` and `watched` are not default-followed; either is explicitly followable through the affordance (the honest expression of "follow any agent"). The live-edge read stays live (threads are minted long after init — the existing comment's sound rationale); the court check sits inside it. `resolveMomentPresentation` repoints to the shared helper, which retires the two-predicate redundancy by construction. Both fields are plain string arrays on GameState (save-compatible, additive).

**Moment queue — the receipts idiom, the moment vocabulary.** New optional `state.pendingUndertakingMoments?: UndertakingMomentRecord[]`, FIFO capped at `MOMENT_QUEUE_MAX` with a `queue_capped` trace (the `playerReceipts.ts:287-300` idiom). Record shape: `{ id, projectId, actorId, momentClass, presentation, tick, label, undertakingName, band?, effect?, lostCastName?, changes?, divineInfluence?, provenanceEventId?, acknowledged }`. Producers are the existing emission sites in `undertakingCheckpoints.ts` — every emitted moment pushes a record alongside its TickEvent; `presentation` is stamped from `resolveMomentPresentation` at push time. The `'modal' | 'toast'` receipts vocabulary is deliberately NOT adopted: moments are `interrupt | badge | none` by ruling 2.1 (badges are the recovery surface, and a toast is neither — reconciliation recorded in the brainstorm companion). Three emission defects fixed in the same pass:

1. **Completions emit.** `undertakingCheckpoints.ts:589-593` gates TickEvent emission on `momentClass !== 'completion'` — the single most important moment class never reaches the stream. The gate drops; completion emits both TickEvent and record.
2. **Foundings wire as badges.** `'started'` is in the class union and handled by `resolveMomentPresentation` (`:186` → badge) but nothing ever passes it. Undertaking start (project activation in `strategicActionLifecycle.ts`) emits a `started` record at badge tier — ruling 2.1: *"foundings badge until nudge cards ship, so no interrupt is ever card-less."*
3. **Interrupt-tier moments reach the chronicle.** A record with `presentation === 'interrupt'` emits its TickEvent at `MOMENT_INTERRUPT_SIGNIFICANCE` (0.85, above `phaseNarrative`'s 0.8 threshold); badge/none tiers keep today's sub-threshold significances. One constant, no orchestrator edit.

**Interrupt collation (review M4, Law 49).** The queue is consumed in `GameView`: when `interruptModalOpen` is false and the queue holds an unacknowledged `interrupt` record, the oldest pops into a `pendingMoment` state slot; `pendingMoment !== null` joins the `interruptModalOpen` disjunction (`GameView.tsx:3555-3564`) and `getDebugOpenModals` (`:3574+`) in the same edit — the registry comment demands both. Because the slot only fills when no other interrupt is open, **encounter first, never two modals** holds by construction: an encounter auto-open in the same tick wins the race (its scan runs on the same effect pass and sets `tieredEncounterState` before the moment consumer sees a closed registry). Acknowledging the card marks the record and releases the slot; unacknowledged interrupt records survive as badges (Law 40 — recovery route). `beatDismissal.ts` deliberately does NOT auto-resolve moment cards (same class as the encounter veil: what a verification run is there to observe).

**The calling — derived identity, event-driven recompute.** New module `src/engine/calling.ts`. Inputs per [THR-1281 §7b]: the agent's **leading reach pair** (top two domain-capability reaches), the **active ambition** (its category + wanted kinds — the ambition term carries the heaviest weight per review M1: it is the volatile input, and deeds feed it), and the **personality lean** (verb-lean weight + title modifier). `deriveCalling(graph, agentId, ambition)` scores the naming table (`src/data/calling-content.ts`, Content pillar) with `CALLING_AMBITION_WEIGHT`/`CALLING_REACH_WEIGHT`/`CALLING_PERSONALITY_WEIGHT` and returns `{ titleKey, title }`. Stored on the agent node: `properties.calling`, `properties.callingSinceTick`.

**Hysteresis (the grill-me risk row: wrong values flicker or fossilize).** Recompute is event-driven, never per-tick (NFP #7): the three trigger sites are ambition assignment/completion/abandonment (`ambitionTick.ts` write sites), undertaking completion (`strategicActionLifecycle.ts` terminal path), and spotlight promotion (`agentLifecycle` tier write). A challenger replaces the incumbent only when both hold: `tick - callingSinceTick >= CALLING_MIN_HOLD_TICKS` and challenger score exceeds incumbent score by `CALLING_SCORE_MARGIN`. A change emits a `TickEvent` (`calling_changed`, significance `CALLING_CHANGE_SIGNIFICANCE` = 0.85 for spotlight agents — a calling change IS a chronicle moment, per the ruling) and a `CallingChangeTrace`. **The chronicle-moment claim ships only after telemetry verifies a narratable change rate** (review M1) — see Done-when; the kill criterion below says what happens if the constants cannot be tuned into the band.

**BehaviorFamily presentation swap — atomic (review Eng M1).** `getBehaviorFamilyPresentation`'s four live render sites (`AgentInfoCard.tsx:467,491`, `ThreadsPanel.tsx:331`, `ThreadDetailView.tsx:768`, `DebugTabContent.tsx:441,492,514`) swap to a `getCallingPresentation(agent)` in the **same PR-window** — a split ship renders nothing on thread rows or breaks on old history. Persisted `StrategicHistoryEntry.behaviorFamily` records render through a legacy fallback map (family → seed title) so old saves stay readable. The `BehaviorFamily` enum, template `strategicProfile.behaviorFamily` fields, and their mechanical scoring are **not** touched here — that retirement is the docs 4/6 template-conversion ground; this doc owns only the presentation layer.

**Scapegoat / divine-act provenance (review S5, THR-1282 §6).** `StrategicProjectRuntime` gains optional `divineInfluence?: { actionId: string; verb: 'inspire' | 'sabotage'; tick: number }`, stamped where the doc-1 divine modifiers (`UNDERTAKING_INSPIRE_MODIFIER` / `UNDERTAKING_SABOTAGE_MODIFIER`) apply to a checkpoint. Moment records carry it forward; the moment card's provenance chip names the divine act in the chain (*"because of the blighted fields — a blessing his neighbors did not share"*), clickable to the receipt/chronicle entry where one resolves. Doc 4's mortal-culprit provenance (`mintedByEventId` → `composeMintLabel`) is consumed as-is for the ambition-side chips; this doc adds only the divine link, which doc 4 explicitly left unclaimed.

**Census small items (THR-1279 census, new findings 1–3).** (a) `'bridge'` joins `LocationSubtype` (`src/types/index.ts:65`) — additive; renderers fall back to the generic location signifier until art exists. (b) **Named calendar: dropped for v1** (build-or-drop was this doc's call): moment and chronicle prose renders relative time ("two days past", the 12-tick-day vocabulary) instead of invented dates; a named calendar is a future flavor charter — veto invited in the handoff. (c) The per-agent "arc so far" strip is UI-pillar work below.

### Graph nodes / edges

**None new.** Calling lives in agent node `properties` (a derived label, not a relationship — the property-bag test in CLAUDE.md's load-bearing rules is met: no traversal wants it). Follow/mute are GameState arrays, not edges — deliberately: a `thread` edge is a court-position instrument with seven consumers, and overloading it with follow semantics is how the mute-vs-unfollow bug ships. Works/holdings/grudges all read existing shapes (`owns`, `hostile_to`, `pursues`).

### Tick phases

No new phases. Moment records ride the existing checkpoint pass (`2a.55`); calling recompute rides its three event sites; queue consumption is UI-side (GameView effect). The one orchestrator-adjacent change is a significance constant on emitted events.

### Resolution logic

Untouched — checkpoints keep the doc-1 band mapping. The moment card *displays* `lastCheckpoint { band, effect, roll, probability }` through banded words only (`ForecastTier`/`StepOutcome` vocabularies; the four-band-union trap is called out for the executor: the checkpoint trace carries `StepOutcome`, not `EncounterOutcomeBand`).

### PRNG callouts

**No new PRNG streams. No `Math.random()` anywhere in scope.** Calling derivation is a deterministic argmax over the naming table (tie broken by table order); moment queue ordering is emission order; the only randomness near this doc is `workNames.ts`'s existing `hashSeed`/`pickFrom`, consumed read-only.

## Content pillar

### Data tables

**`src/data/calling-content.ts`** — the naming table [THR-1281 §7b]: rows `{ titleKey, title, reachPair: [ReachDomain, ReachDomain] | ReachDomain, ambitionCategories: AmbitionCategory[], wantedKinds?: UndertakingKindId[], personalityModifiers?: { trait, replacementTitle }[] }`. Seeded from the ten retired family names re-cut as titles (Merchant → *Trader*/*Smuggler* by personality lean, Builder → *Mason*/*Founder*, Scholar → *Seeker*, Zealot → *Zealot*, Court → *Spider*, Underworld → *Smuggler*/*Knife*, Warlord → *Reaver*, Caretaker → *Mender*, Artist → *Crafter*, Wanderer → *Wayfarer*), grown open-endedly — Christian wants MORE than 8 readable patterns; ≥16 titles at v1 with at least one personality-modified variant per family seed. `CALLING_FALLBACK_TITLE = 'Wanderer'` for the profile no row matches. Legacy fallback map `BEHAVIOR_FAMILY_TO_CALLING` for persisted history records.

**Moment card prose** — narrator-mode templates per moment class (`completion`, `at_cost`, `complication`, `fork`, `abandoned`, `started`) in `src/data/moment-card-content.ts`: one opening line + one consequence line per class, placeholder-driven (actor, undertaking name, site, `lostCastName` for complications — the binder ruling: *the moment names the lost cast member*). Register: game-wide plain narrator (canon `Docs/canon/prose.md`); card faces stay library-generic (the encounter format lock) — scene texture lives in the prose block, chips claim only state.

### Encounter templates

N/A — no new encounters. The Inspire/Sabotage cards the moment card hosts are the existing doc-1 divine verbs surfaced in a new slot, not new templates.

### Prose tables

Ambition flavor line: **no new authoring** — `AmbitionTemplate.selectionProse` (already authored on every template) surfaces as the flavor text under `AMBITION: <displayName>` (THR-1279 verdict 2). Missing/empty `selectionProse` → name renders alone (the "trivially decodable" arm). Relative-time vocabulary for moment/chronicle prose reuses the 12-tick-day words.

### Attachment content

N/A — holdings attachment faces shipped in doc 2; this doc renders them and corrects the label (*Freehold*, THR-1314).

## UI pillar

*Screenshot tool: Playwright (DOM surfaces — JourneyTab, MomentCard modal, ThreadsPanel badges, AttachmentsTab; no WebGL in scope).*

### Player-facing display

- **The moment card** (`src/components/Game/MomentCard.tsx`, on shared `Modal` at `MODAL_Z_DEFAULT`): Law 37 identity chrome (agent portrait via `EntityVisual`, undertaking name, checkpoint position via `StepDots`, per-step outcome colors); compressed Law 38 beat order (context strip → prose → outcome → consequences); **action slot** hosting the Inspire/Sabotage cards when the moment's undertaking is a legal target of those verbs (the god's v1 on-ramp — review S5; card faces library-generic per the format lock); **consequence chips** rendered exclusively from the doc-2 `completionChanges`/per-band `changes` declarations (Law 56 both clauses — a chip without an engine write cannot exist by construction; magnitudes via `DeltaCluster`, Law 13 amendment); **provenance chips, both directions** — backward: the divine act when `divineInfluence` is stamped, clickable (Laws 17/21); forward: *what this set in motion* — when the moment's outcome event minted a drive (a `pursues` edge whose `mintedByEventId` matches this moment's event id, doc 4's write), the chip links forward to that ambition on the victim's arc (THR-1282 §6: "the moment's grudge chip links forward to the ambition it became"). The forward chip is fail-soft absent until THR-1298 lands — same dependency posture as the arc's provenance line. Dismiss = acknowledge (single reversible click — not a Law 48 armed action; nothing is destroyed, the badge remains the recovery route).
- **The follow affordance — one state, two surfaces** (ruling 2.1 + Christian's extension): a follow toggle on the **JourneyTab header** and on the **EncounterVeil identity header** for the encounter's subject agent. Both call `followAgent`/`unfollowAgent`; the toggle renders followed / thread-followed / muted states honestly (a threaded agent shows "followed by bond — mute?" rather than a lying unchecked box). Follow state is game state (per-save), not a Law 51 preference.
- **The moment badge** — fourth member of the badge family: `momentBadgeModel.ts` + `MomentBadge.tsx` on `ThreadsPanel` rows, counting unacknowledged records per agent within `MOMENT_BADGE_RETENTION_TICKS`; coalesced with a count (Law 49), non-destructive open (Law 40), routed to the moment card (badge-opened cards render identically to interrupt-opened ones — Law C1's one-lesson rule: this interface always means the same thing, and with the action slot it always offers something to do).
- **JourneyTab becomes the arc panel** (THR-1279 verdict 1): the "future update" stub (`JourneyTab.tsx:52-64`) is replaced by (1) the **undertaking card** — `ActiveUndertakingSummary` with progress words (`getUndertakingProgressWord`), halts/escalation sentence, and `lastCheckpoint` band word; (2) **ambitions** as `AMBITION: <name>` + flavor (`selectionProse`) + doc-4 provenance line, via the extended `ActiveIntent` (gains `flavorText?`); (3) the **arc-so-far strip** — new read-model `getAgentArc(graph, state, agentId)` in `agentDetail.ts` assembling up to `MOMENT_ARC_STRIP_MAX` entries from persisted `StrategicHistoryEntry` records, completed ambitions, christened works, and calling changes, newest last, each entry one line with its tick-relative time. This is the census's "curated per-agent chronicle surface", built from persisted state (the 48-tick digest buffer is deliberately not the source — an arc outlives it).
- **Chronicle chain rendering (carve-up item 9, THR-1282 §6 "the chronicle renders the chain as a line") — constituted, not a new panel:** the chain-as-a-line is the sum of (a) doc 4's culprit-naming chronicle entries (`composeMintLabel` — "the razing of Dunmar — Hesk's work"), which this doc admits to the chronicle via `MOMENT_INTERRUPT_SIGNIFICANCE`; (b) the backward provenance chips (ambition → the moment that minted it, arc + moment card); and (c) the forward chip above (moment → the drive it minted). The arc-so-far strip orders an agent's own links chronologically, which *is* the line for one life. No `ChroniclePanel` structural change is owed; if Christian wants a dedicated cross-agent chain view later, that is a new surface charter.
- **The calling on every agent surface**: replaces the family glyph+label on `ThreadsPanel` rows, `AgentInfoCard`, `ThreadDetailView`, `DebugTabContent`; joins the OverviewTab identity block. Old history renders via the legacy fallback map.
- **Freeholds**: `AttachmentsTab`'s holding group header renders *Freeholds* (UL arbitration THR-1314 — "Holdings" is a six-way player-facing collision). Works render their christened names; failure scars render the folly register where sites carry them. **Ascendant-bar freehold row: dropped for v1** (`HooksBlock.tsx:302-307` names this ticket) — Law 53's HUD budget; the sheet and the arc cover it. Veto invited in the handoff.
- UI Laws engaged: 1, 13/14 (words+banded deltas, no numerals), 15 (DeltaCluster for realized change), 16, 17/21 (clickable primitives), 23/24 (Modal contract), 25, 26 (decision tree: modal = witness+act), 33, 36, 37/38 (encounter chrome family), 39/40/49/52 (interrupt registry, badges, coalescing, pause-cause), 42 (register), 55 (arc reachable from thread row + chronicle), 56 (state-backed chips, both clauses).

### Event notifications

Interrupt-tier moments auto-pause via the registry with cause named (Laws 39/52). Badge tier renders on thread rows only — **no toasts for moments** (ruling 2.1; the toast channel remains receipts/encounter ground). Chronicle receives interrupt-tier moments and spotlight calling changes via significance.

### Debug inspection (DebugPanel)

New `window.__DEBUG` accessors (declared in `debug-bridge.d.ts` — and the three existing undeclared strategic accessors `getStrategicDecisionSummary` / `getStrategicProjects` / `getStrategicHistory` gain their missing declarations in the same edit): `getUndertakingMoments(agentRef?)` (queue records + presentation), `getFollowedAgents()` (`{ explicit, threaded, muted }`), `getCalling(agentRef)` (`{ title, titleKey, sinceTick }`), `followAgent(agentRef)` / `unfollowAgent(agentRef)` (test levers — the CLI world has no thread edges, so constructed proofs need them). All async, all `await`ed.

### Visual presence (HexMapV2)

N/A — no map-layer work; the works-on-the-map markers shipped with the substrate (`StrategicMarkerMesh`), and the `bridge` subtype falls back to the generic signifier until an art pass.

## Wiring

Checked against `Docs/plans/wiring-checklist.md` — every new module has an invocation site, every GameState field a UI consumer, every trace a registration, every player control a handler.

| Module | Orchestrator phase | UI component | GameState flow | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `followedAgents.ts` (new) | none (event-driven writes from UI + init) | JourneyTab header toggle, EncounterVeil header toggle | `followedAgentIds`, `mutedAgentIds` | `FollowChangeTrace` | `getFollowedAgents`, `followAgent`/`unfollowAgent` |
| `undertakingCheckpoints.ts` (moment records) | `2a.55` (existing) | MomentCard (interrupt), MomentBadge (badge) | `pendingUndertakingMoments` | `MomentSurfaceTrace` + existing `UndertakingCheckpointTrace` | `getUndertakingMoments` |
| `calling.ts` (new) | none (three event sites) | ThreadsPanel/AgentInfoCard/ThreadDetailView/OverviewTab | agent `properties.calling` | `CallingChangeTrace` | `getCalling` |
| `agentDetail.ts` (`getAgentArc`, `ActiveIntent.flavorText`) | read-model | JourneyTab arc strip + IntentSection | reads persisted history/ambitions/works | — | via existing detail dumps |
| GameView moment consumer | UI effect | MomentCard modal + interrupt registry + `getDebugOpenModals` | pops queue → `pendingMoment` | — | `getOpenModals` shows `MomentCard` |
| Chain rendering (read-only) | read-model | MomentCard forward/backward chips + arc strip ordering | reads `pursues.mintedByEventId` (doc 4) + `divineInfluence` | — | via `getUndertakingMoments` + `getGrievances` (doc 4) |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `MOMENT_QUEUE_MAX` | 8 | FIFO cap on pending moment records; overflow drops oldest with trace |
| `MOMENT_INTERRUPT_SIGNIFICANCE` | 0.85 | TickEvent significance for interrupt-tier moments (clears the 0.8 chronicle threshold) |
| `MOMENT_BADGE_RETENTION_TICKS` | 48 | How long an unacknowledged badge stays countable on a thread row |
| `MOMENT_ARC_STRIP_MAX` | 12 | Max entries on the JourneyTab arc-so-far strip |
| `CALLING_MIN_HOLD_TICKS` | 36 | Hysteresis floor — a calling holds ≥3 days before any challenger wins |
| `CALLING_SCORE_MARGIN` | 0.15 | Challenger must beat the incumbent's score by this margin |
| `CALLING_AMBITION_WEIGHT` | 0.5 | Ambition term weight (the volatile input leads — review M1) |
| `CALLING_REACH_WEIGHT` | 0.35 | Leading reach-pair term weight |
| `CALLING_PERSONALITY_WEIGHT` | 0.15 | Personality-lean term weight |
| `CALLING_CHANGE_SIGNIFICANCE` | 0.85 | Chronicle-clearing significance for spotlight calling changes |
| `CALLING_FALLBACK_TITLE` | `'Wanderer'` | Title when no naming-table row matches |
| `UNDERTAKING_INSPIRE_MODIFIER` / `UNDERTAKING_SABOTAGE_MODIFIER` | +0.15 / −0.15 | Inherited (doc 1) — the verbs the action slot hosts |

## Tracing

```ts
interface FollowChangeTrace extends BaseTrace {
  category: 'follow_change';
  agentId: string;
  action: 'follow' | 'unfollow' | 'mute' | 'unmute';
  source: 'arc_panel' | 'encounter_ui' | 'init' | 'debug';
}

interface MomentSurfaceTrace extends BaseTrace {
  category: 'moment_surface';
  event: 'queued' | 'opened' | 'acknowledged' | 'dropped';
  projectId: string;
  actorId: string;
  momentClass: UndertakingMomentClass;
  presentation: UndertakingMomentPresentation;
}

interface CallingChangeTrace extends BaseTrace {
  category: 'calling_change';
  agentId: string;
  fromTitleKey: string | null;
  toTitleKey: string;
  cause: 'ambition_change' | 'undertaking_complete' | 'tier_promotion' | 'initial';
  incumbentScore: number;
  challengerScore: number;
}
```

Registration note: each category lands at **all four** registration sites (`trace.ts` union + display list, category registry, buffer routing) — the four-site lesson is standing.

## Fail-soft table

| Failure | Fallback |
|---|---|
| Moment record's template/label unresolvable | generic label from verb + kind noun; card still renders |
| Queue at `MOMENT_QUEUE_MAX` | oldest unacknowledged record dropped with `MomentSurfaceTrace{dropped}` — never a throw |
| `pendingMoment` set while another interrupt opens same frame | registry disjunction holds both; moment card waits (slot filled, render gated) — never two modals |
| Calling inputs missing (no ambition, empty capability) | `CALLING_FALLBACK_TITLE`; no change event |
| Persisted history record with `behaviorFamily`, no calling | legacy fallback map renders the seed title |
| `divineInfluence` names a resolved-away action id | chip renders unlinked text, no dead-end click (Law 17) |
| Muted id for an agent with no thread edge | harmless — mute only gates the upgrade path |
| `selectionProse` missing on an ambition template | `AMBITION: <name>` renders alone |
| Save without new optional fields | all reads `?.`-guarded; queue/mute/calling initialize lazily |

## Kill criteria

If the 300-tick telemetry shows the hysteresis constants cannot land a narratable change rate — flicker (any agent >3 calling changes per 100 ticks) and fossilization (zero changes across a population with completed undertakings) simultaneously untunable — the calling ships as a **static** derived title: the chronicle-moment claim and change event stay behind `CALLING_CHANGE_SIGNIFICANCE = 0` until a redesign ticket, recorded in the closeout, not silently.

## Blast Radius

Touched ≥100-importer files (per `.codesight/graph.md`): `src/types/gameState.ts` (3 new optional fields), `src/types/trace.ts` (3 new interfaces + registrations), `src/types/strategicAction.ts` (1 optional runtime field, 1 record type). All additive optional — no existing reader changes shape. `GameView.tsx` is wide but the edit is the sanctioned two-line registry pattern its own comment prescribes.

## Interface impact

| Contract | Disposition |
|---|---|
| `undertaking-checkpoint-events` (🔴 LEAKED) | **goes LIVE** — read sites: GameView moment consumer, `momentBadgeModel`, `getAgentArc`; THR-1293's deferral reference drops; its Done-when is satisfied by this doc |
| `followedAgentIds` (write-with-one-reader) | **extends** — second reader (affordance) + first UI writer + mute clause; single-writer module |
| BehaviorFamily presentation (implicit contract, 4 render sites) | **retires into calling presentation** — asserting tests repoint to `getCallingPresentation`; legacy fallback map tested against a persisted-history fixture |
| `attachment-character-sheet-display` (🟢 LIVE) | **preserve** — label-only change (*Freeholds*) |
| New: `calling-derivation` (agent properties → 4 components) | **add** — production read sites named above; registered with the generator |

## Three-pillar check

- [x] Engine pillar present (follow/mute, moment queue + emission fixes, calling derivation, divine-influence stamp, bridge subtype)
- [x] Content pillar present (calling naming table, moment prose templates, flavor surfacing; encounters/attachments explicitly N/A with rationale)
- [x] UI pillar present (moment card, follow toggle ×2, badge, arc panel, calling renders, Freehold label; HexMapV2 N/A with rationale)
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise contradicted. "Follow any agent's story" (north star) gets its first real instrument; player-conferred attention is the god-not-protagonist frame (the god watches and nudges, never steers); prose-never-numbers holds on every new surface (banded words, DeltaCluster, no numerals).
- [x] The interrupt-for-tension intent stands as ruled: every interrupt is one the player asked for (follow), and no interrupt is card-less (foundings badge until nudge cards ship).

## Rulebook impact

- [x] This changes rules of play (following confers interrupt attention; moments; the calling) → `Docs/canon/rulebook.md` gains a "Following & Moments" entry and a "The Calling" entry, both `[IMPL]`, in the executor's closing PR (wiki-freshness gate will fire — the manifest's sources cover these engine files).
- [x] `Docs/canon/rulebook-quick-reference.md` gains one line each for follow→interrupt and the calling — same closing PR.

> Brainstorm companion: `Docs/plans/2026-09-02-thr-1299-calling-and-surfaces-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | 11 new named constants; naming table data-driven; significances are constants, not magic thresholds |
| 2. Inspectability | PASS | 3 new trace types at all four sites; 5 new debug accessors + 3 missing declarations fixed; every presentation decision already traced (doc 1) now consumed |
| 3. Determinism | PASS | no new PRNG; calling is a deterministic argmax with stable tie-break; queue order = emission order |
| 4. Fail-soft | PASS | 9-row table; queue cap, lazy init, legacy fallbacks, unlinked-chip degrade |
| 5. Narrative over mechanical perfection | PASS | the calling is a readable identity, not a stat; moments name the lost cast member; relative-time prose over invented dates |
| 6. Additive over destructive | PASS with note | every state field optional; the one retirement (family presentation) is presentation-layer-only, atomic-in-window, with a persisted-record fallback — the enum and mechanics stay for docs 4/6 |
| 7. Performance budget | PASS | no new phases, no per-tick recompute (calling is event-driven at three sites); queue capped; badge model reads a capped array |

## Done when

- [ ] Unit/integration tests: emission per moment class incl. the fixed completion gate and wired `started`; presentation matrix (explicit-followed × default-followed × muted × **court position incl. dormant/watched** × class) falsified with controlled arms — the dormant arm must show `badge`, honoring `thread.dormant`'s authored text; queue cap + acknowledge; calling hysteresis (hold floor and margin each shown to block a change that would otherwise fire, and to admit one past both gates); legacy family fallback against a persisted-history fixture; collation (a queued moment + an open encounter never co-render)
- [ ] `undertaking-checkpoint-events` goes LIVE in the interface map; THR-1293's Done-when satisfied and folded (its issue closed by reference in the closing comment — not by a `Fixes` line for it)
- [ ] **Constructed browser proof** (CLI worlds carry no thread edges — organic CLI traces cannot gate this): `?view=game&seeded&size=medium`, `await __DEBUG.followAgent(<agent>)`, `__DEBUG.tick(...)` to a checkpoint completion → moment card renders with chips + action slot; screenshot 1920×1080; `await __DEBUG.getUndertakingMoments()` assertion; console (empty valid); UI-Laws judgment line citing at minimum Laws 1, 13/14, 17, 21, 33, 37, 49, 56
- [ ] **Calling telemetry** (review M1 gate for the chronicle-moment claim): 300 ticks, seeds 42 + 99 — report changes/agent for spotlight agents; narratable band = no agent >3 changes per 100 ticks AND ≥1 change somewhere in a population with completed undertakings; outside the band → kill criterion applies and is recorded
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build` green; 30-tick CLI smoke (engine files touched)
- [ ] UL terms seated: `UL-proposal` for *Calling*, *Moment*, *Follow* (Agents.md) + See-Also from *Chronicle Entry* — filed at handoff; executor closeout confirms shard entries landed or the proposal is still open and referenced
- [ ] Closing commit body includes `Fixes THR-1299`

## Coordination block

**Suggested model:** opus — UI-heavy but judgment-dense (register, Laws, an atomic presentation swap); advisory — the CC automation runs Opus regardless.

**Parallel-safe with:** THR-1378 (rulebook findings — docs-only); THR-1377/THR-1349 (decision-board/pack ground — disjoint files).

**Mutex with:** THR-1298's executor (both edit `undertakingCheckpoints.ts`, `strategicActionLifecycle.ts` terminal paths, `agentDetail.ts`, `trace.ts` registrations, and the JourneyTab/IntentSection surface — doc 4 adds the provenance line, this doc adds flavor + arc around it). **Sequencing preference: land after THR-1298** — its mint provenance is what the arc's provenance line renders; landing first forces re-merge on the same lines.

**Files to touch:**
- Create: `src/engine/followedAgents.ts`, `src/engine/calling.ts`, `src/data/calling-content.ts`, `src/data/moment-card-content.ts`, `src/components/Game/MomentCard.tsx`, `src/components/Game/momentBadgeModel.ts`, `src/components/Game/MomentBadge.tsx`, tests
- Edit: `src/engine/undertakingCheckpoints.ts` (records, gate fixes, mute clause), `src/engine/strategicActionLifecycle.ts` (`started` emission, divine-influence stamp, calling trigger), `src/engine/ambitionTick.ts` (calling trigger), `src/engine/agentDetail.ts` (`getAgentArc`, `flavorText`), `src/components/Game/GameView.tsx` (consumer + registry + debug mirror), `src/components/Game/tabs/JourneyTab.tsx`, `tabs/AttachmentsTab.tsx` (Freeholds), `tabs/OverviewTab.tsx`, `ThreadsPanel.tsx`, `AgentInfoCard.tsx`, `ThreadDetailView.tsx`, `debug/DebugTabContent.tsx`, `EncounterVeil.tsx` (follow toggle), `src/engine/strategicPresentation.ts` (calling presentation + legacy map), `src/types/gameState.ts`, `src/types/strategicAction.ts`, `src/types/index.ts` (bridge), `src/types/trace.ts`, `src/debug-bridge.ts` + `.d.ts`, `scripts/` calling-telemetry addition (extend `undertaking-census.ts` or sibling), `Docs/canon/rulebook.md`, `Docs/canon/rulebook-quick-reference.md`, wiki page per manifest, `scripts/interface-contracts.ts`

## Notes for the executor

- **Strangler slices:** (1) follow module + mute + debug levers; (2) emission fixes + moment queue + traces; (3) MomentCard + registry + collation; (4) badge + arc panel + flavor; (5) calling module + content + presentation swap (atomic within this slice); (6) Freeholds label + census items + docs. Each slice green alone; only the final PR carries the closing keyword.
- **The presentation swap is the one non-additive move** — do not split slice 5 across PR-windows; the four render sites and the legacy map ship together.
- **Do not put moments on the toast channel** — ruling 2.1 is interrupt/badge only; a toast tier re-opens the dismiss-spam hazard the review closed.
- **Do not overload `thread` edges with follow semantics** — mute exists precisely so court position and player attention stay separate axes.
- **Band vocabulary:** the checkpoint carries `StepOutcome`; do not render it through `EncounterOutcomeBand` mappers — four coexisting unions type-check against each other silently.
- The `?forceencounters` lever does not force moments; the debug follow lever is the review route.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-02. Intent-judge (run first): **Allow** — 11 dimensions; the initial pass returned Revise with 1 VIOLATION (the dormant-thread predicate divergence, orchestrator finding 2026-08-27 on this ticket) and 1 GAP (chronicle chain rendering undispositioned); both resolved in this revision (court-position-aware default-follow, option 1; chain-as-a-line constituted from doc-4 chronicle entries + bidirectional provenance chips) and re-scored PASS on a delta pass.*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Constants table: 12 named constants (queue caps, significances, hysteresis floor/margin, weight terms, fallback title) — no bare magic numbers found in the design text |
| 2. Inspectability | PASS | 3 new trace interfaces (`FollowChangeTrace`/`MomentSurfaceTrace`/`CallingChangeTrace`) registered "at all four registration sites"; Wiring table matches checklist's Module/Phase/UI/GameState/Trace/Debug format; 5 new + 3 fixed `__DEBUG` accessors, all `await`ed |
| 3. Determinism | PASS | Explicit: "No new PRNG streams. No `Math.random()` anywhere in scope"; calling derivation is deterministic argmax with stable table-order tie-break; queue order = emission order |
| 4. Fail-soft | PASS | 9-row fail-soft table covers unresolvable labels, queue overflow, missing calling inputs, dead-referent chips, save-compat via `?.`-guards |
| 5. Narrative over mechanical | PASS | Calling is "a readable identity, not a stat"; moment cards "name the lost cast member"; relative-time prose replaces invented calendar dates (explicit build-or-drop call) |
| 6. Additive over destructive | PASS-with-note | Nearly all new fields optional/additive, but the BehaviorFamily→calling presentation swap is flagged by the plan itself as "the one non-additive move" — 4 render sites must ship atomically in one PR-window; mitigated by a legacy fallback map for persisted history, but it is a genuine hard cutover, not additive |
| 7. Performance budget | PASS | No new orchestrator phase; calling recompute is event-driven at 3 sites, not per-tick; moment queue capped (`MOMENT_QUEUE_MAX`=8); badge model reads a capped array |

NFP AUDIT: PASS-with-notes (see rows above)

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Systems design, graph nodes/edges (none-new, justified), tick phases, resolution logic, PRNG callouts all filled with real detail (follow/mute module, moment queue, calling derivation, hysteresis, provenance stamp) |
| Content | present-and-substantive | Data tables (calling naming table, moment-card prose) filled; encounter templates and attachment content explicitly `N/A` with one-line rationale each |
| UI | present-and-substantive | Player-facing display, event notifications, debug inspection all filled with concrete components/Laws; visual presence (HexMapV2) explicitly `N/A` with rationale |

No missing required sections. Wiring section check: the Wiring table matches the checklist's required column shape and every new module (`followedAgents.ts`, moment records, `calling.ts`, `agentDetail.ts`, GameView consumer, chain rendering) has a row connecting engine write → UI consumer → trace → debug accessor. Substrate-existence check: PASS — `## Substrate inventory` opens the doc, 10 subsystems with ACTIVE/DEAD status and extends/retires/reconciled dispositions; cross-checked against `Docs/canon/systems-inventory.md`; no green-field duplication.

PILLAR AUDIT: PASS

### Vision audit

Premises touched: `00-north-star.md` → "follow any agent's story… watched these people choose things across dozens of ticks" — confirmed (the follow affordance is the first real instrument). `01-core-loop.md` → "one complex story at a time, front-of-stage" — extended (collation: encounter always wins the race, moment card waits; badges scoped to followed agents, not a dashboard). `02-non-negotiables.md` → god-not-protagonist confirmed (Inspire/Sabotage are existing probability-bending doc-1 verbs, not direct control); everything-is-graph confirmed with explicit rationale (calling = derived property label, no traversal; follow/mute = GameState arrays, deliberately not overloading `thread` edges); prose-not-numbers confirmed (banded words, DeltaCluster). `03-design-tensions.md` → not referenced; tensions #3/#5 implicitly honored. `taste-profile.md` → prose-first UI confirmed; card faces stay library-generic per the THR-883 pivot. No contradictions found. Qualitative checks: north star PASS; core loop PASS; non-negotiables PASS; tensions PASS (implicit); taste PASS (calling is presentation over existing Domain Capability, not classical stats). `[design-brief-stale]` — `Docs/design-brief.md` has no Vision summary section.

VISION AUDIT: PASS-with-notes
