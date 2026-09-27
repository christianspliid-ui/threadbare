> **title:** What your hand did, and what it cost — visible consequences and a readable spend — THR-1606, THR-1607
> **linear_issue:** THR-1606 (also THR-1607)
> **author:** Claude Code (attended design session, 2026-09-27)
> **created:** 2026-09-27
> **three_pillars:** Engine `done — two casts gain real effects; cast digest filed on the target; Witness plays its scene` · Content `done — receipt lines, effect chips, tooltip registry entries` · UI `done — receipt, sheet chips, essence rows, card and bar tooltips; Playwright DOM`

# What your hand did, and what it cost — THR-1606, THR-1607

*All three round-1 testers said some form of "I couldn't name one consequence of anything I'd done", and none could say what their essence was. After this plan every cast names who it touched and what changed, that change is real and visible on the mortal, and the resource it drew from visibly moves.*

## Why this is load-bearing

The store page promises *"Their choices are theirs. The story becomes yours."* That needs a visible chain from whisper to mortal choice. The cold playtest ([THR-1610](https://linear.app/threadbare/issue/THR-1610)) found the chain broken at every link. It is also one of the round-1 findings that gate round 2.

What the code does today (traced 2026-09-27):

| Tester saw | Cause |
|---|---|
| "I sent powers into the void three times with no visible result" | **The casts do nothing.** `divine.dream` (Oneiric Sending) and `divine.persuade` (Divine Compulsion) (`unified-action-templates.ts` ~359-432) write one `apply_influence` entry with no `valueDrifts`, `reachBoost` or `behaviorTag`, so `buildValueOverlay` (`interventionEffects.ts` ~106-134), the agent re-score and the motive receipt's divine term all compute no change. Showing the result would show nothing. |
| No target, no change named | The receipt overview is actor-centric ("‹God› completed Dream…"); target changes are never captured as `aftermathChanges`; the cast's digest entry is filed under the god's id, so the target's Story So Far never mentions it (`unifiedActionResolution.ts` ~3838-3867). The one component that renders a target's active effects (`AgentInfoCard`) is imported but never mounted. |
| "A Vision — Witness" shows no scene | The delivery beat resolves through `resolvePendingBeat` and never opens the encounter (orphaned `TODO(THR-514)`). Worse, `runBeatTemplateAftermath` then runs every fallback reaction of the branching template **against the god** — the untrue-scene class [THR-1526](https://linear.app/threadbare/issue/THR-1526) named. The modal copy is a placeholder because `beatProseOverride` looks up the prefixed beat id. |
| Gifts apply silently | "Take the Seat" and "Leave Your Mark" mutate the graph (seat, artifact) with no event, no toast and no `touchWorld`. |
| Essence never visibly drops; the list reorders | `fillPct = min(100, level/10*100)` (`EssenceBlock.tsx` ~31): any pool of 10 or more renders full, and pools start at 50. Rows sort by level, so a spend reorders the list. All 12 spheres show. |
| "Doomed" on a card that succeeded | Casts have a `success_at_cost` floor (THR-728), so a player cast never fails outright, but the forecast word is the raw pre-roll tier. |
| Owing, Sealed, Unnamed, ABSOLUTE, Counter-Omens | Lowest reach-tier words, the quintessence lexicon and label pills, explained only by a raw `title` (the pattern Law 17 retired) or not at all. |

**Constraints this plan obeys, not re-opens:**

- **UI Law 13** (words, never numerals), **with its ratified exception**: resource-pool balances in persistent chrome, meaning the essence counter, may show whole numbers (2026-08-06, THR-890).
- **Law 15** (pips for odds and price; the delta cluster for realised change).
- **Law 17** (every concept word gets a registry tooltip; raw `title` explanations retired).
- **Law 47** (a spend visibly moves the resource it drew from).
- **Law 56** (a consequence chip renders only a real state write).
- The chip-noun memory (sheet words, ≤15-word chips, the effect on hover).
- Vision non-negotiable §3 (prose, never numbers) is honoured through the same exception Law 13 already ratified, and nowhere else.

**Decided in this plan by the design session under delegation** (process.md rule 4; marked *Session decision*; vetoable in chat): what each of the two casts now does (§ B2); Witness plays the scene with The First as its subject rather than being withdrawn (§ B3); Foundation spheres fold away by default (§ B4); a cast card's forecast tooltip reads "how cleanly", not "whether" (§ B4).

## Substrate inventory

Step 0.6 greps: the inventory and `src/engine/` for *receipt, influence, digest, story so far, delivery, witness, essence, forecast, tooltip*.

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Divine receipts (`playerReceipts.ts`, THR-727; `DivineReceiptModal`) | 🟢 ACTIVE | **extends** — the target-change capture feeds the existing receipt; no new receipt tier |
| Divine influence (`apply_influence` graph-op, `divineInfluences`, `interventionEffects.buildValueOverlay`, `decayCurve.ts`) | 🟢 ACTIVE (payload empty for these two verbs) | **activates** — the two verbs gain payloads the live consumer already reads |
| Thread digest / Story So Far (`threadDigest.ts` `composeThreadStory`, `StorySoFarPanel`) | 🟢 ACTIVE | **extends** — a cast digest entry is also filed under the target |
| Agent active-effects card data (`agentDetail.ts` ~1809-1837 `card.activeEffects`) | 🟠 built, rendered nowhere live | **activates** — mounted in the thread detail and the profile sheet |
| Delivery beats (`deliveryBeatAdapter.ts`) + encounter veil (`EncounterVeil`, `buildUnifiedEncounterStageModel`) + debug spawn path (`prepareDebugEncounterSpawn`) | 🟢 ACTIVE | **extends** — Witness uses a non-debug sibling of the spawn path |
| Spine seeding (`ascendantBeatSeeding.ts`) | 🟢 ACTIVE | **extends** — emits a placement event and touches the world |
| Ascendant bar essence (`EssenceBlock.tsx`, `selectors.selectEssenceRows`) | 🟢 ACTIVE | **fixes** — scale, order, balance numeral, fold, tooltip, spend flash |
| Tooltip registry (`ui-content.ts`, `Tooltip.tsx`, `tooltipResolver.ts`) | 🟢 ACTIVE | **extends** — new registry entries |

## Engine pillar

### Systems design

**B2 — The two casts do something.** *Session decision:* each verb gets one real, bounded, inspectable effect, written as the influence payload the live consumer already reads. No new effect type is introduced. Before wiring, the executor greps that the chosen field has a live production reader: `valueDrifts` → `buildValueOverlay` → `agentSelection` re-score is verified live. If `reachBoost` has no live reader, use `valueDrifts` for both verbs.

- **Oneiric Sending (Mind): "they dream of who they are".**
  - Target axis: the value pair bound to the god's **primary reach** (the eight reach-bound `ValuePair`s).
  - The payload is a `valueDrifts` entry of `DREAM_VALUE_DRIFT` on that pair, **in the direction the mortal already leans**. The dream deepens their own lean; the god does not choose the pole.
  - A mortal at exactly 0 on the axis gets no drift and a trace (`influence.no_lean`). The receipt then says the dream found nothing to take hold of. Failure is plot, not dead air.
  - It lasts for the existing dream decay window.
- **Divine Compulsion (Spirit): "they are pushed toward your kind of deed".**
  - The payload is a `valueDrifts` entry of `COMPULSION_VALUE_DRIFT` on the same axis, **toward the pole the god's primary reach names first in its archetype pair** (Iron: Protector ↔ Conqueror → Protector).
  - The executor confirms the pole ordering table in `ValuePair` data. If none exists, both verbs use the dream's "own lean" rule and the compulsion is simply stronger and shorter. The PR says which.
  - It lasts for the existing persuade decay window.
- Both keep their essence cost and forecast. Both write through the existing `apply_influence`, so decay, the overlay and the motive receipt's divine term light up with no new mechanism.

**B1 — The player sees who and what** ([THR-1606](https://linear.app/threadbare/issue/THR-1606)).

- **Target change capture.** When a player cast's graph-ops write to a node other than the actor, the receipt phase records a target-side change line.
  - A new `snapshotTargetChanges(before, after, targetId)` pass beside `snapshotEncounterResolutionContext` reads the target's `divineInfluences`, value profile and conditions before and after, producing `aftermathChanges` entries with `subject: targetId`.
  - Changes band through the existing consequence language (`engine/aftermathWords.ts`, the delta cluster).
- **The receipt names the target.** The toast leads with the target's name and the change: *"Aldric dreams. For a few days, mercy weighs more in what he chooses."* It no longer reads "‹God› completed Dream".
  - The overview uses the template's **display name**, never `template.name` (Law 14).
  - A cast with any target-side change goes to the receipt's toast tier with a chip, and the toast is clickable to the target (Law 1 link).
- **The target's story remembers.** The cast's digest entry is also filed under the target's id, so `composeThreadStory(target)` shows *"Your hand reached into their sleep."* The god's own copy stays.
- **Spine gifts announce themselves.** `seedHomeSeat` and `seedThreadedArtifact` return the placed node ids. `resolvePendingBeat` emits a notice-tier event (chronicle significance ≥ `CHRONICLE_SIGNIFICANCE_THRESHOLD`) naming the place or the bearer: *"A seat is raised for you in Wraithwood."*, *"Kael Thornweaver now carries A Thing Left Behind."*
  - Both call `touchWorld()` after mutating.
  - "Speak" and the investment beats grant cards only; their existing card-reveal already says so. No event.

**B3 — Witness shows the scene.** *Session decision:* build the playback rather than withdraw the beat. The veil already exists, and the debug spawn path already does "mortal + template → open the veil".

- New `prepareDeliveryEncounter(state, templateId, subjectId)` in `src/engine/deliveryBeatAdapter.ts`: a non-debug sibling of `prepareDebugEncounterSpawn` that mints the `UnifiedAction`, the progress and the notification exactly as that path does, for a real subject.
- **Subject:** The First.
  - A delivery beat whose source template cannot bind The First (eligibility, location) is **not offered**. The director filters it out at offer time; it is never shown and then failed.
  - With no First bonded, no delivery beat is offered. The sibling opening plan's S4 already keeps beats behind the bond.
- **Resolve:** Witness opens the veil for that action. `resolvePendingBeat` records the beat as delivered and **skips `runBeatTemplateAftermath` for `kind === 'delivery'`**, because the encounter's own aftermath now runs through the veil, against the right actor.
- **Copy:** `beatProseOverride` looks up the source template via `sourceTemplateIdOf(beatId)`, so the modal shows the encounter's real teaser, not the placeholder.
- Remove the orphaned `TODO(THR-514)` comment with this work.

### Graph nodes / edges

None new. B2 writes into the existing `divineInfluences` payload; B1 and B3 read existing nodes.

### Tick phases

- The receipt phase (`processPlayerReceipts`) gains the target-change capture.
- The digest write sits at the existing site.
- The beat director gains the delivery-beat offer filter (B3).
- No new phase.

### Resolution logic

B2's pole rule is above. B1 capture is a before/after diff on the target. B3's offer filter is the template's own eligibility, bound to The First.

### PRNG callouts

None. Both drifts are deterministic functions of the target's and the god's state.

## Content pillar

### Prose tables

- **Receipt lines** for the two casts, keyed by outcome band (the cast floor makes `success_at_cost` the common case).
  - Authored in the narrator register and filed in `receipt-content.ts`.
  - Two verbs × {clean, at cost, found nothing} = 6 lines.
  - Examples:
    - *"{target} dreams, and wakes certain of something. For a few days, {pole} weighs more in what they choose."*
    - *"{target} dreams, but the dream finds nothing to hold."*
- **Effect chip nouns** (sheet words, ≤15 words, the effect on hover): *Dreaming* / *Compelled*.
  - Hover: *"Your hand is on them: {pole} weighs more in their choices, fading in {durationLabel}."*
  - Uses `durationLabel`, never ticks (Law 13 tick ruling).
- **Gift placement lines** for the seat and the artifact: 2 lines.
- **Digest line** for the target's story: 2 lines (dream and compulsion), past tense.

### Data tables

Tooltip registry entries in `ui-content.ts`, each ≤200 characters (Law 18):

- `ui.essence.row`: what a sphere pool is and what refills it.
- `ui.essence.foundation_fold`: *"Elder powers — you have not yet learned to draw on these."*
- `ui.card.cost`: *"Each ✦ is one measure of {sphere} essence, drawn from your {sphere} pool."*
- `ui.forecast.cast.<tier>` × 5: a cast always lands; the word says how cleanly. *"Doomed — it will land, but crooked."*
- `ui.reach_tier.<reach>.<word>` for the tier words that render at tier 1–2 (Owing, Sealed, Unnamed, Unmourned, Unblooded and their siblings). Each gives the rung and what the next one opens.
- `ui.quintessence` and `ui.quintessence.<band>`, including *ABSOLUTE* and *whole and present*.
- `ui.counter_omens`, `ui.doom_debt`, `ui.investiture`.

### Encounter templates

N/A — B3 plays existing branching templates unchanged. B2's two templates change only their `apply_influence` params.

### Attachment content

N/A.

## UI pillar

*Screenshot tool: Playwright (DOM): receipt toast, profile sheet, thread detail, ascendant bar, cards, veil. UI Laws engaged: 1, 10, 12, 13 (with its essence exception), 14, 15, 17–20, 21, 33, 37, 47, 53, 55, 56.*

### Player-facing display

**B1 — who and what:**

- The receipt toast leads with the target and the change and links to the target.
- **Active effects on the mortal:** mount the `card.activeEffects` chip block (today only in the unmounted `AgentInfoCard`) in `ThreadDetailView` and `AgentProfileModal`, under *"Under your hand"*.
  - Each chip is one real `divineInfluences` entry (Law 56), with its noun, sphere tint and hover sentence.
  - Retire `AgentInfoCard`'s copy of the block, or re-export it, so there is one renderer (Law 3).
- **Story So Far** shows the target-side digest line.
- **Gift placements** reach the chronicle, and the toast links to the place or bearer.

**B3 — Witness:** the delivery-beat modal shows the real teaser; Witness opens the veil on The First's scene; the veil's own aftermath closes it. Uses the existing `EncounterVeil`, with no new component.

**B4 — A readable spend** ([THR-1607](https://linear.app/threadbare/issue/THR-1607)):

- **Essence rows** (`EssenceBlock.tsx`, `selectEssenceRows`):
  - The fill scales to the pool's own ceiling (`ESSENCE_BAR_CEILING`, the starting pool), not `/10`, so a spend visibly moves the bar (Law 47).
  - Each row shows its whole-number balance (Law 13 exception; `formatEssencePool`).
  - **Order is fixed:** the god's identity spheres first, then canonical `SPHERE_NAMES` order. Never by level, so a spend never reorders the list.
  - *Session decision:* the four **Foundation** spheres (chaos, order, light, darkness) fold under an *Elder powers* disclosure, closed by default, unless the god's identity holds one. This matches the taste profile's "Foundation spheres are elder magic, discovered, not selected". A creation sphere at 0 still hides, as today.
  - Every row carries the `ui.essence.row` tooltip (Law 17).
  - **Spend flash:** after a cast, the row it drew from shows the Law 15 delta cluster for `ESSENCE_SPEND_FLASH_MS`.
  - **Hover preview:** hovering a card highlights the row it will draw from.
- **Card cost:**
  - Pips stay (Law 15 sanctions pips for price) and gain the `ui.card.cost` registry tooltip.
  - **Law 10 check:** if the Star reach icon also uses `✦`, the cost pip switches to the essence counter's own glyph, so one glyph never means two things. The executor states which in the PR.
- **Forecast on cast cards:** the word stays (UL `forecast tier`, unchanged) and gains `ui.forecast.cast.<tier>` tooltips that say *how cleanly*, because the cast floor makes *whether* moot. The mortal-encounter forecast tooltips are unchanged.
- **Reach tier words:**
  - Each reach row reads *"Gold — Owing"*, the reach name plus the word, so a rank is never read as a state.
  - The registry tooltip replaces the raw `title` (Law 17 / 19).
- **Quintessence:** the identity strip names *Quintessence* beside its word, with registry tooltips on the word and the ladder line.
- **Counter-Omens, Doom Debt, Investiture:** registry tooltips. (The opening plan's S5 already hides the mandate and doom surfaces until the bond, so a new player meets these later.)

### Event notifications

- Receipt toast (B1), with a chip and a link.
- Chronicle line for gift placements (B1).
- The veil opening from Witness (B3) is the existing encounter halt, so it pauses per the sibling plan's S3 registry.

### Debug inspection (DebugPanel)

- `window.__DEBUG.getLastCastConsequence()` → `{ templateId: string; targetId: string | null; changes: Array<{ kind: string; subject: string; word: string }>; digestFiledOnTarget: boolean }` (B1/B2).
- `window.__DEBUG.getActiveInfluences(agentNameOrId)` → the target's `divineInfluences` with remaining `durationLabel` (B2).
- Declared in `src/debug-bridge.d.ts` with JSDoc.

### Visual presence (HexMapV2)

N/A — the existing cast particle burst already marks the target's hex; no layer change.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| Dream/compulsion payloads (B2) | resolution (`apply_influence`) | sheet chips | target `divineInfluences` (existing) | `influence.applied`, `influence.no_lean` | `getActiveInfluences` |
| Target change capture (B1) | receipt phase | receipt toast, `DivineReceiptModal` | `PlayerActionReceipt.changes` (existing) | `receipt.target_changes` | `getLastCastConsequence` |
| Target digest (B1) | digest write (existing site) | `StorySoFarPanel` | digest buffer (existing) | — | `getLastCastConsequence().digestFiledOnTarget` |
| Active-effects chips (B1) | — | `ThreadDetailView`, `AgentProfileModal` | `card.activeEffects` (existing) | — | Playwright DOM |
| Gift placement (B1) | `resolvePendingBeat` | toast, chronicle | `recentEvents` | `beat.gift_placed` | trace viewer |
| Witness playback (B3) | beat director offer filter; `resolvePendingBeat` | `AscendantBeatModal` → `EncounterVeil` | `tieredEncounterState` (existing) | `beat.delivery_played` / `beat.delivery_skipped` | trace viewer |
| Readable spend (B4) | — | `EssenceBlock`, `CardFace`, `ReachesBlock`, `IdentityStrip`, `MandateTracker`, `DoomClockDetail` | `essencePool` (existing) | — | Playwright DOM |

## Interface impact

Essence & Divine Economy, Ascendant Beats, and Attention & Chronicle are ⚪ UNAUDITED; this plan writes the rows it touches. Each slice registers its rows in `scripts/interface-contracts.ts` and regenerates the map.

| Contract (new id) | Write site | Read site | Action |
|---|---|---|---|
| `cast-influence-shifts-target-values` — a god's dream or compulsion changes what the mortal chooses | `apply_influence` payload `valueDrifts` (B2) | `buildValueOverlay` → `agentSelection` re-score; motive receipt divine term | **add** |
| `player-cast-lands-in-target-story` — the mortal's story remembers your hand | cast digest filed on target (B1) | `composeThreadStory` / `StorySoFarPanel` | **add** |
| `cast-target-changes-reach-receipt` — the receipt names who changed and how | `snapshotTargetChanges` (B1) | `processPlayerReceipts` → toast/modal | **extend** `player-action-aftermath-read` |
| `active-influences-render-on-sheet` — what your hand is doing to a mortal is visible on them | `divineInfluences` | `card.activeEffects` → `ThreadDetailView`, `AgentProfileModal` | **add** (the consumer was built and never mounted) |
| `essence-spend-moves-the-bar` — a spend visibly moves the pool it drew from | `commitPlayerCast` → `GameState.essencePool` | `EssenceBlock` | **add** (Law 47) |
| `delivery-beat-plays-its-encounter` — a vision you witness is a scene you see | `prepareDeliveryEncounter` (B3) | `EncounterVeil` | **add**; **retire** the silent `runBeatTemplateAftermath` run for `delivery` beats, and delete or repoint any test asserting it |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `DREAM_VALUE_DRIFT` | 0.08 | Magnitude of Oneiric Sending's drift on the target's lean (within the existing drift scale; executor checks it against `buildValueOverlay`'s clamp). |
| `COMPULSION_VALUE_DRIFT` | 0.15 | Magnitude of Divine Compulsion's drift. |
| `ESSENCE_BAR_CEILING` | 50 (the starting pool) | What a full essence bar means; replaces the `/10` scale. |
| `ESSENCE_SPEND_FLASH_MS` | 2500 | How long the delta cluster shows on a row after a spend. |
| `ESSENCE_FOUNDATION_FOLDED_DEFAULT` | true | Whether the Elder powers fold starts closed. |

## Tracing

```ts
// influence.applied — emitted when a cast writes a non-empty influence payload (B2)
interface InfluenceAppliedTrace {
  type: 'influence.applied';
  templateId: string;          // divine.dream | divine.persuade
  targetId: string;
  valuePair: string;           // e.g. 'mercy_ruthlessness'
  drift: number;               // signed
  durationTicks: number;
}

// influence.no_lean — emitted when a dream finds a target at exactly 0 on the axis (B2)
interface InfluenceNoLeanTrace {
  type: 'influence.no_lean';
  templateId: string;
  targetId: string;
  valuePair: string;
}

// receipt.target_changes — emitted when the receipt captured target-side changes (B1)
interface ReceiptTargetChangesTrace {
  type: 'receipt.target_changes';
  templateId: string;
  targetId: string;
  changeKinds: string[];
}

// beat.gift_placed — emitted when a spine gift places a seat or an artifact (B1)
interface BeatGiftPlacedTrace {
  type: 'beat.gift_placed';
  beatId: string;
  placedNodeId: string;
  anchorId: string;            // the settlement or the bearer
}

// beat.delivery_played / beat.delivery_skipped — Witness playback outcome (B3)
interface BeatDeliveryTrace {
  type: 'beat.delivery_played' | 'beat.delivery_skipped';
  beatId: string;
  sourceTemplateId: string;
  subjectId: string | null;
  reason?: 'no_first' | 'ineligible' | 'template_missing';
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| The god has no primary reach or its value pair is unresolvable | No drift; `influence.no_lean` trace; the receipt uses the "found nothing" line. The cast still costs and resolves. |
| The target node is gone by receipt time | The receipt falls back to today's overview; no target link. |
| `snapshotTargetChanges` throws | Caught; the receipt proceeds without target changes; logged once. |
| The delivery source template is missing or cannot bind The First | The beat is not offered (`beat.delivery_skipped`). If it was already pending (old save), Witness resolves as today *without* running the template aftermath. |
| The veil fails to open for the delivery action | The beat resolves as delivered; the notification remains in the ledger; no aftermath against the god. |
| An essence pool exceeds `ESSENCE_BAR_CEILING` | The fill clamps at 100%; the numeral still shows the true balance. |
| A registry tooltip id is missing | The existing resolver fallback (label only); caught by the Law 17 registry test. |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/data/unified-action-templates.ts` | 189 (`.codesight/graph.md`, 2026-09-27) | B2 edits only the `onSuccess` `apply_influence` params of two rows (`divine.dream`, `divine.persuade`). No export, type or id changes, so importers are unaffected. The content invariants and template tests are the guard. |

## Slicing

| Slice | Ticket | Pillars | Size |
|---|---|---|---|
| B2 The two casts do something | [THR-1651](https://linear.app/threadbare/issue/THR-1651) | Engine, Content | S |
| B1 The player sees who and what | [THR-1606](https://linear.app/threadbare/issue/THR-1606) | Engine, Content, UI | M |
| B3 Witness shows the scene | [THR-1650](https://linear.app/threadbare/issue/THR-1650) | Engine, UI | M |
| B4 A readable spend | [THR-1607](https://linear.app/threadbare/issue/THR-1607) | UI, Content | M |

Order: **B2 → B1**. B1's receipt would otherwise have nothing to name for these two verbs. B1 still works for every other cast whose graph-ops write to the target, so it may land first if B2 stalls. B3 and B4 are independent.

## Three-pillar check

- [x] Engine pillar present (B2 payloads, B1 capture and digest, B3 playback)
- [x] Content pillar present (receipt lines, chip nouns, gift and digest lines, tooltip registry)
- [x] UI pillar present (receipt, sheet chips, essence, cards, reach words, quintessence, veil)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise.
- [x] **No Vision premise changes.** Non-negotiable §3 (prose, never numbers) stands. The one numeral is the essence balance, under the exception Law 13 already ratified for exactly this counter (2026-08-06). Every other magnitude stays a word, a pip or a delta cluster. `03-design-tensions.md` already anticipated this: essence costs "probably need to be more legible than we currently surface".
- North star — "the intervention has to feel consequential in both directions" — is the premise this plan serves; today it is broken.
- Taste profile — "elder magic, discovered, not selected" — is what motivates the Foundation fold.

## Rulebook impact

- [x] This plan changes a rule of play (what two action verbs do).
- [x] **One rule of play gains teeth, and the rulebook records it.** § 4/§ 6 (what the god can do; resources): Oneiric Sending and Divine Compulsion now shift the target's values for a window [DESIGN — this plan, B2]. The update is in this PR's rulebook edit alongside the opening plan's edits.

> Brainstorm companion: `Docs/plans/2026-09-27-thr-1606-what-your-hand-did-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Two drift magnitudes, the bar ceiling, the flash duration and the fold default are named. |
| 2. Inspectability | PASS | Five trace types; two debug accessors; the mounted sheet chips make the state player-inspectable too (Law 13 visibility parity). |
| 3. Determinism | PASS | No PRNG added; the pole rule is a pure function of state. |
| 4. Fail-soft | PASS | § Fail-soft table; every capture is caught; delivery beats that cannot bind are never offered. |
| 5. Narrative over mechanical perfection | PASS | "The dream found nothing to hold" is a story line, not a silent no-op. |
| 6. Additive over destructive | PASS with note | Additive throughout. One deliberate retirement: the silent template-aftermath run for delivery beats, which wrote untrue consequences against the god. |
| 7. Performance budget | PASS | One before/after diff per player cast; negligible. |

## Done when

Per slice (each ticket carries its copy):

- [ ] **B2** — Unit tests:
  - a dream on a target leaning +0.3 on the axis drifts it further positive;
  - a target at 0 gets no drift and the `no_lean` trace;
  - compulsion drifts toward the named pole (or the documented fallback).
  - Headless CLI evidence (engine pillar, no browser owed): cast `divine.dream` on a mortal, `tick 5`, then `agent <name>` shows the influence, and the re-score differs from a control run.
  - 30-tick CLI smoke plus `npm run test:heavy`.
- [ ] **B1** — On the real first-run path or `?view=game&seeded&size=medium`: cast Oneiric Sending on The First.
  - Playwright screenshot of the toast naming them, of their sheet showing a *Dreaming* chip, and of their Story So Far with the line.
  - `getLastCastConsequence()` output.
  - Test for `snapshotTargetChanges`.
  - The Seat's placement line is in the chronicle.
- [ ] **B3** — `?view=game&seeded&size=medium`, drive to a delivery beat (or stage one via the debug bridge): the modal shows the real teaser; Witness opens the veil with The First as the actor.
  - A test asserts that no fallback reaction runs against the god for a delivery beat.
  - Playwright screenshot of the veil.
- [ ] **B4** — Playwright at 1920×1080:
  - the essence block before and after a cast (the bar moves, the order is unchanged, the balance numeral drops, the flash shows);
  - the Elder powers fold closed;
  - the tooltips on a card cost, a cast forecast word, a reach tier word and Quintessence.
  - A registry test that every new tooltip id resolves.
- [ ] All slices:
  - `npm test`, `npm run check:typecheck` and `npx vite build` pass;
  - the four-part browser-verify evidence for UI slices, with a UI-Laws line (1, 10, 12, 13, 14, 15, 17–20, 21, 33, 37, 47, 53, 55, 56 as engaged);
  - the wiki pages owed per `public/wiki-manifest.json` `sources` (check `encounter*`, receipt and ascendant-bar globs at pickup);
  - `scripts/interface-contracts.ts` rows registered and the interface map regenerated.

## Coordination block

**Suggested model:** sonnet for B2 (two template payloads and tests); opus for B1, B3 and B4 (cross-surface wiring, veil playback, UI Laws judgement).

**Parallel-safe with:** the opening plan's S2, S4 and S7; [THR-1642](https://linear.app/threadbare/issue/THR-1642); [THR-1643](https://linear.app/threadbare/issue/THR-1643).

**Mutex with:**
- B2 ↔ [THR-1643](https://linear.app/threadbare/issue/THR-1643): both edit `src/data/unified-action-templates.ts` (different rows; sequential is safest).
- B1 ↔ B3: both edit `src/engine/ascendantBeat.ts` (`resolvePendingBeat`).
- B3 ↔ opening S4: both edit the beat director in `src/engine/ascendantBeat.ts`.
- B4 ↔ opening S5: both edit the top bar / ascendant bar.
- B1 ↔ opening S1/S3/S5: `GameView.tsx` (the receipt and profile mounts).

**Blocked by:** B1 is soft-blocked by B2 (see § Slicing).

**Files to touch:**
- Edit: `src/data/unified-action-templates.ts` (`divine.dream`, `divine.persuade` payloads) (B2)
- Edit: `src/engine/playerReceipts.ts`, `src/engine/unifiedActionResolution.ts` (target capture, digest-on-target), `src/data/receipt-content.ts` (B1)
- Edit: `src/engine/ascendantBeatSeeding.ts`, `src/engine/ascendantBeat.ts` (gift events; delivery skip) (B1, B3)
- Edit: `src/engine/deliveryBeatAdapter.ts` (`prepareDeliveryEncounter`), `src/components/Game/GameView.tsx` (`beatProseOverride`, Witness handler) (B3)
- Edit: `src/components/Game/ThreadDetailView.tsx`, `AgentProfileModal.tsx`, `AgentInfoCard.tsx` (chip block) (B1)
- Edit: `src/components/ascendant-bar/EssenceBlock.tsx`, `selectors.ts`, `ReachesBlock.tsx`, `IdentityStrip.tsx`; `src/components/shared/CardFace.tsx`, `OddsPips.tsx`; `src/data/ui-content.ts` (B4)
- Edit: `src/debug-bridge.ts`, `src/debug-bridge.d.ts`
- Edit: `scripts/interface-contracts.ts`, `Docs/canon/interface-map.md`

## Notes for the executor

- **Do not add a new effect type for B2.** The point is that the influence pipeline already works end to end, and these two verbs never fed it.
- **Law 56 binds B1:** a chip only for a real write. If a cast's capture finds no target change, the toast uses the "found nothing" line. Never invent a chip.
- **The second essence store** (`ascendant.properties.essencePool`, used by Stillness and influence maintenance) diverges from `GameState.essencePool`, so those changes never show on the bar. B4 does not unify them. It is filed as its own ticket, [THR-1645](https://linear.app/threadbare/issue/THR-1645).
- `AgentInfoCard` is imported but unmounted in `GameView.tsx`. After B1 moves the chip block, check whether the rest of `AgentInfoCard` is dead and say so in the PR; do not delete it inside this slice.

## Forked-audit verdicts

<!-- populated by design-audit-pipeline -->
