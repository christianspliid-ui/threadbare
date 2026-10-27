> **title:** Attention has a price — THR-2062
> **linear_issue:** THR-2062
> **author:** Claude Code (design lane, run 2026-10-27a)
> **created:** 2026-10-27
> **three_pillars:** Engine done · Content done (two caption lines, badge words) · UI done (the gauge returns when something can spend it)

# Attention has a price — THR-2062

Attention is what it costs to look in on a mortal who lives on without you. A mortal who asks you (The First, by default) never charges it. A town's famine or glut tells you about a mortal's home without charging it. The gauge appears once the god has someone whose chapters it would otherwise miss.

## Why this is load-bearing

The ticket and [the one-thing-at-a-time plan](2026-10-26-thr-2058-one-thing-at-a-time.md) say Attention is never spent because `spendAttention` has no production caller. That is half right. `spendAttention` (`src/engine/attentionPool.ts:61`) has no caller, but the pool *is* spent: `attendThreadTug` (`src/components/Game/hooks/useAgentInteraction.ts:794-815`, THR-665) subtracts a pull's cost straight on the ascendant node when the player answers a "The thread pulls" badge. Nothing in the engine traces it.

The gauge never moved because of who pulls and what it costs. Measured on `main` @ b6b9533a with the prototype census [`proto/thr-2062-attention-census`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2062-attention-census) (`scripts/proto-attention-census.ts`, `devSeedTheFirst`, seeds 42/99/7 × 360 ticks, medium):

Every cell reads seed 42 · 99 · 7. "Greedy" answers every pull it can afford, the hardest a player could spend.

| World | Pulls / 30 days | Of which livelihood | Pool (greedy player) |
|---|---|---|---|
| The First alone, today | 37 · 18 · 15 | 20 · 6 · n/m | never below 5.5 of 6 |
| + 3 retinue on *Lives on*, today | 349 · 400 · 315 | 237 · 298 · 143 | below half on 99 % · 87 % · 88 % of ticks; 294 · 348 · 280 pulls unaffordable |
| + 3 retinue, Decisions 2 + 3 (proto) | 95 · 90 · 156 chapter pulls; livelihood free | — | below half on 30 % · 7 % · 86 % of ticks; 4 · 0 · 99 unaffordable |

(n/m: not measured. The First-alone livelihood count comes from the run with her chapter pulls skipped; seed 7 was not run that way.)

Three facts follow:

1. **The First's pulls buy nothing.** Her thread is `attentionMode: 'pause'` (THR-1715), and `encounterVisibility.ts:553-561, 637-645` already skips the attended-pull gate for a pause-mode thread (UI Law 39: every beat interrupts). Yet `phaseAttention.ts:196-206` raises a pull for her shaping chapters, and the badge charges for it.
2. **Livelihood pulls are two thirds of all pulls and buy nothing.** `phaseResourceStockTiers` (`src/engine/phases/resourceStockTiers.ts:171-186`) pulls a thread when a bonded mortal's home staple goes scarce or surplus. Its synthetic `encounterId` matches no chapter, so answering it opens nothing. Its comment says "deduped so it fires once", but the dedup reads only *live* pulls (`:86-93`), and a pull lives three ticks (`THREAD_TUG_LINGER`), so a lasting famine pulls again every three ticks.
3. **With chapter pulls only, the April economy is right.** At capacity 6 and regen 0.4/tick, a quiet court never runs dry and a busy one overflows. That is the [attention-tier design](2026-04-05-attention-tier-model-design.md)'s own target (§ FOMO Calibration: "quiet days are fine; noisy days produce natural overflow"). No number in `attention-constants.ts` changes.

## Decisions

Decided by this lane under delegation (process.md rule 4), recorded on [THR-2062](https://linear.app/threadbare/issue/THR-2062). Veto in chat.

1. **Keep Attention; it prices looking in on a mortal who lives on.** The pool, its regen and its costs stay as the April design set them. *Rejected:* retiring the pool. That would remove the agreed design's scan-and-choose loop (rulebook §2 *Scan*), which only bites once the court grows. Retiring it would be a change of direction, so it is not this lane's call.
2. **A mortal who asks you raises no pull.** A pause-mode thread's chapters already stop the world for free, so a pull on them only charges for what is free. *Rejected:* keeping her pull at the First's ×0.5 discount (a charge with no choice behind it).
3. **A home's famine or glut is news, not a purchase.** A livelihood pull fires once when the home staple crosses into scarce or surplus, again only after it has left that tier, and costs nothing to answer. Answering it selects the mortal, as today. *Rejected:* deleting livelihood pulls (the economy plan wants the player to hear about a bonded mortal's home); pricing them (nothing is bought).
4. **No new spend sites.** The April design's story-beat opening (2.0), per-phase (0.5) and notable (0.5) costs stay unwired. A chapter that stops the world is not a choice, so charging for it is a tax. *Would change the call:* a court where *Asks you* mortals are many enough to need rationing.
5. **The gauge shows when a pull can cost something.** That is, when the court holds at least one non-dormant thread set to *Lives on*. With The First alone on *Asks you*, the gauge stays hidden; it has no referent (Law 56's principle, the THR-2058 reason).
6. **An empty pool works as it does today.** The badge says the god cannot spare the attention, a click only selects the mortal, the pull lapses, and the chapter plays out unseen and is filed as a missed chapter (THR-2055).

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Attention, Chronicle & Narrative: the pool (`attentionPool.ts`, `phaseAttention.ts`, phase 2a.65) | 🟡 HALF-WIRED | extends: the engine owns the spend; pause-mode skip |
| Mortal Economy & Prosperity: livelihood pulls (`resourceStockTiers.ts`, THR-615) | 🟡 HALF-WIRED | fixes the dedup; marks the pull `kind: 'livelihood'` |
| Thread-pull badge (`threadTugBadgeModel.ts`, `ThreadsPanel.tsx`, THR-665) | 🟢 ACTIVE | words instead of numerals; free livelihood pulls |
| God rail gauge (`godRailComponents.tsx:101`, THR-1894/2060) | ⚪ HIDDEN | returns behind a predicate |

## Engine pillar

- **E1. Pause-mode threads raise no chapter pull.** In `phaseAttention.ts` § 4a and § 4b, after the dormant skip, `continue` when `resolveAttentionMode(threadEdge.properties) === 'pause'`. That is one line per loop. Proto diff: [`proto/thr-2062-attention-census`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2062-attention-census).
- **E2. Livelihood pulls fire once per crossing.** `ResourceInstance` (`src/types/resource.ts`) gains optional `livelihoodPulledTier?: StockTier`. In `resourceStockTiers.ts`, pull for this place's residents only when `newTier ∈ {scarce, surplus}` and `instance.livelihoodPulledTier !== newTier`, then write it. Clear it when the tier returns to `adequate`. The live-pull dedup stays as a same-tick guard. A mortal who moves in mid-famine is not pulled; the place's sheet already shows the famine (THR-1953 livelihood row).
- **E3. Pulls carry their kind.** `ThreadTug` (`src/types/attention.ts`) gains optional `kind?: 'chapter' | 'livelihood'` (absent reads as `chapter`). `buildLivelihoodTug` writes `'livelihood'`.
- **E4. The engine owns the spend.** Add a pure `attendThreadTug(state, tugId): { state, cost, trace } | null` to `attentionPool.ts`. It finds the live, unattended pull, prices it (`tugAttendCost`: `LIVELIHOOD_TUG_ATTEND_COST` for livelihood, else `computeAttendCost`), refuses when the pool cannot cover it, applies `spendAttention` to the ascendant props, and marks the pull attended. `useAgentInteraction.attendThreadTug` calls it and keeps its `touchWorld` and `setGameState`. `tugAttendCost` moves from `threadTugBadgeModel.ts` into the engine module, and the badge imports it.
- **E5. The gauge predicate.** Add `attentionCanBeSpent(graph, ascendantId): boolean` in `attentionPool.ts`: true when any outgoing `thread` edge has a court position other than `dormant` and `resolveAttentionMode(props) === 'auto_resolve'`.

**Nodes / edges:** none new. One optional property on the resource instance, one on the pull record. **Tick phases:** unchanged order. **Resolution:** untouched (pulls gate notifications, not odds). **PRNG:** none; E1–E5 are deterministic.

## Content pillar

No encounter templates, prose tables, attachment content or data tables change (N/A); the content is two caption lines and the badge words.


- **C1. Caption and tooltip are true again.** `first-use-captions.ts:55` `attention` becomes *"Your free notice. Looking in on a mortal who lives on draws on it; it refills with time."* `ui-content.ts:166` `ui.attention` desc gets the same clause in place of "Attending a moment draws on it".
- **C2. Badge words.** The badge meta for a chapter pull names the threat and what it leaves, in the gauge's own ladder (one concept, Law 43): *"hard · look in, leaves you Strained"*, using `getAttentionVisualState` on the pool after paying. Unaffordable: *"hard · you cannot spare the attention"*. Livelihood: *"their home is short of {good}"* / *"their home has {good} to spare"*, with no cost. `{good}` is `resourceWord(resourceId)` (`src/engine/phases/regionalMonopolies.ts:69`), the same word the famine and glut chronicle lines use (THR-2070): `fresh water`, `fish`, `grazing land`, `grain`. An unknown id renders its lower-cased id. No numerals (Law 13).

## UI pillar

- **U1. Gauge returns.** `ATTENTION_GAUGE_SHOWN` (`src/data/opening-reveal-table.ts:81`) becomes `true` and stays the master switch. `godRailComponents.tsx:101` renders when `ATTENTION_GAUGE_SHOWN && shown('attention') && attentionCanBeSpent(...)`. The god-rail view model reads the predicate beside `att.pool`. The reveal row keeps no `newLabel`; the gauge appears with its first-use caption (C1) the first time the predicate holds, and does not take a slot in the one-per-chapter arrival queue.
- **U2. Words in the gauge tooltip.** `AttentionPoolIndicator.tsx:84-90` drops the `pool / capacity` numerals. The tooltip reads the state word and how full the pool is in words, and numbers stay in traces (Law 13; taste profile, no numbers visible).
**Event notifications:** none new; the shaping-tier notification gate is unchanged. **Debug inspection:** `__DEBUG.buildIncidentBundle().attention.activeThreadTugs` and `getAttentionCadence()`, both existing. **Visual presence (HexMapV2):** N/A, because the plan changes no map layer and pulls stay on the Threads rows.

- **U3. Badge** renders C2's `meta`/`ariaLabel`; component code unchanged except reading the model.

### Player-facing text

A "pull" in this plan is a **Thread Tug** (UL, `Docs/ubiquitous-language/Prose.md#thread-tug`); the player reads it as *The thread pulls*. The livelihood kind is not a new term. It is a Thread Tug whose cause is the mortal's home. The sentence saying so goes through [UL-proposal THR-2074](https://linear.app/threadbare/issue/THR-2074), not a direct edit.

| Surface | Exact text the player reads | Class | How the player understands it |
|---|---|---|---|
| First-use caption (C1) | "Your free notice. Looking in on a mortal who lives on draws on it; it refills with time." | PC-1 | Where Attention is explained, at the moment the gauge first appears |
| `ui.attention` tooltip (C1) | "How much of your notice is free. Looking in on a mortal who lives on draws on it, and it refills on its own as time passes. Nothing to click: it is a gauge." | PC-1 | The same sentence on hover, from the one registry (Law 17) |
| Gauge label + tooltip (U2) | Label "Attention · Strained"; tooltip "Attention: Strained. Little of your notice is free." (Focused: "Attention: most of your notice is free.") | PC-6 | No numerals. The state word is `getAttentionVisualState`'s label (`Busy` / `Strained` / `Overwhelmed`; Focused shows no word) |
| Badge, chapter, affordable (C2) | "hard · look in, leaves you Strained"; aria "The thread pulls, hard — look in, leaves you Strained" | PC-6 | The after-word is the gauge's own label for the pool after paying, word for word. When the pool stays Focused the clause is "look in" alone |
| Badge, chapter, unaffordable (C2) | "hard · you cannot spare the attention"; aria "The thread pulls, hard — you cannot spare the attention" | PC-8 | The reason is on the badge before the click. A click selects the mortal (the Inspector opens within a second), and the badge keeps its line, so the refusal and its reason stay in view |
| Badge, livelihood scarce (C2) | "their home is short of fresh water" (a town short of water); "their home is short of grain"; aria "The thread pulls — their home is short of fresh water" | PC-5, PC-6 | Once per crossing (E2), so it is said once, not every three ticks. The good's word matches the famine chronicle line for the same good, word for word |
| Badge, livelihood surplus (C2) | "their home has fish to spare" (a fishing town in glut); "their home has grazing land to spare"; aria "The thread pulls — their home has fish to spare" | PC-5, PC-6 | As above. The place sheet's livelihood row speaks of food in general (`LIVELIHOOD_FOOD_LINES`), so the badge names the good and the sheet says what it means for the town; the two do not contradict |
| A chapter missed with an empty pool | Read the Threads lists it under its own name, with its band once it resolves (`phaseAttention.ts` missed-tug digest entry, settled by `unifiedActionResolution`); "A chapter" (`MISSED_CHAPTER_NAME`) only if its name cannot be read (THR-2055, unchanged) | PC-4 | The chapter did not vanish: it is in the record, played out without the god |

### Playtest signal

A tester who sets a second mortal to *Lives on* sees the Attention gauge appear, watches it drop after answering a pull, and can say in their own words that Attention is what it costs to look in on that mortal. No tester with only The First reports a gauge that never moves.

**Browser-verify:** Playwright DOM at 1920×1080 on `?view=game&seeded&size=medium`. (a) With The First on *Asks you*, `[data-testid="god-rail-attention"]` is absent. (b) Toggle her to *Lives on* on the Threads row; after `window.__DEBUG.tick(24)` the gauge is present. (c) Answer a pull and read the gauge's state word drop. Assert via `(await window.__DEBUG.buildIncidentBundle()).attention.activeThreadTugs` that no pull names The First while `(await window.__DEBUG.getAttentionCadence()).attentionMode === 'pause'`. **UI Laws engaged:** 1, 13, 17 (`ui.attention` registry tooltip), 21 (the badge's mortal link unchanged), 33 (rail fits, no growth), 37 (N/A, no encounter chrome), 39, 43, 56's principle.

## Interface impact

| Contract | Change |
|---|---|
| Economy (stock tiers) → Attention (thread pulls) | **preserve, narrowed**: one pull per crossing; pull carries `kind` |
| Attention (pulls) → Encounter visibility | **preserve**: shaping-tier gate unchanged; pause-mode threads already bypassed it |
| UI (badge) → Attention pool write | **retire** the hook's direct prop write; **add** engine `attendThreadTug` as the single writer |
| Attention pool → God rail gauge | **extend**: gauge reads `attentionCanBeSpent` |

Update `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` (Attention, Chronicle & Narrative) for the single-writer row.

## Wiring

Checked against `Docs/plans/wiring-checklist.md`: no new module, so every row below extends an existing phase or caller.

| Module | Phase / caller | Trace | Debug | Player control |
|---|---|---|---|---|
| E1 pause skip | `phaseAttention` (2a.65) | existing `curator_decision` trace, `decision: 'skipped'`, `reason: 'pause_mode_thread'` | `activeThreadTugs` | Threads row *Asks you / Lives on* |
| E2 livelihood once | `phaseResourceStockTiers` | existing `resource_stock_tier_change.emittedTug` true only on a pull | instance prop | none |
| E4 spend | UI hook → engine | `attention_pool` trace, `cause: 'attend_tug'` | `attentionPool` prop | the badge |
| E5 / U1 gauge | god-rail view model (`src/engine/views/godRail.ts` `readAttention` gains `spendable`) | none | `__DEBUG.buildIncidentBundle()` | none |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `LIVELIHOOD_TUG_ATTEND_COST` (new, `attention-constants.ts`) | `0` | Answering news about a mortal's home is free |
| `ATTENTION_GAUGE_SHOWN` | `false` → `true` | Master switch; the predicate does the gating |
| All existing `ATTENTION_*`, `ATTEND_COST_*`, `COURT_COST_MULTIPLIER_*` | unchanged | Measured fit above |

## Tracing

E4 emits the existing `AttentionPoolTrace` (`src/types/attention.ts:210`) with `cause: 'attend_tug'`, `delta: -cost`. No new trace type; one optional field:

```ts
export interface AttentionPoolTrace extends TraceBase {
  category: 'attention_pool';
  previous: number;
  current: number;
  capacity: number;
  delta: number;
  cause: string;           // 'attend_tug' for the spend
  tugId?: string;          // new, optional: the pull that was answered
  tugKind?: 'chapter' | 'livelihood'; // new, optional
}

// src/types/attention.ts:199, CuratorDecisionTrace: one more member, so
// "why did The First get no pull?" is answered in the trace (E1).
decision: 'kept' | 'curated_out' | 'skipped';
```

## Fail-soft table

| Case | Fallback |
|---|---|
| Pull id not found / already attended | `attendThreadTug` returns `null`; the hook only selects the mortal |
| Ascendant node missing | `null`; no spend |
| Thread props lack `attentionMode` | `resolveAttentionMode` falls back by court position (The First → pause) |
| Old save: pull without `kind` | treated as `chapter`; a lingering old livelihood pull lapses within three ticks |
| Instance without `livelihoodPulledTier` | first crossing pulls, as today |

## Kill criteria

If the census after the build (`npm run census:attention`, landed from the proto, 3 seeds × 360 ticks) shows **any** pull for a pause-mode thread, more than one livelihood pull per mortal per crossing, or a First-alone world whose pool ever leaves full, the build is wrong; fix before merge. If a 3-retinue *Lives on* world never drops below half on any seed, the economy is too loose to read and the ticket returns to design with that number. If one sits below half on more than 95 % of ticks on every seed, it is too tight: raise `ATTENTION_BASE_REGEN` one step (0.4 → 0.5) once and re-run before merge.

No touched file has 100 or more importers (`types/attention` 29, `types/resource` 32, `opening-reveal-table` 8, `threadTugBadgeModel` 6, `attentionPool` 3, `resourceStockTiers` 2, `phaseAttention` 1), so no Blast Radius section. `types/influence` (147) is deliberately not touched.

## Three-pillar check

- [x] Engine pillar present (E1–E5)
- [x] Content pillar present (C1–C2: caption, tooltip, badge words)
- [x] UI pillar present (U1–U3, browser-verify route named)
- [x] Wiring section connects them

## Vision audit

- [x] Does not contradict a Vision premise. Serves rulebook §2 *Scan* ("the choice of whose story to watch is yours") and the north star's *witnessing, not steering*: Attention now prices only a real choice. Game Design Laws 15, 36, 43 and 45 hold (pause-mode is the player's ask; the purse bites once the court grows; one ladder for the cost; the caption becomes true). No [E] law is bent.
- [x] No Vision edit needed.

## Rulebook impact

- [x] One rule of play changes: who and what Attention is spent on.
- [x] `Docs/canon/rulebook.md` §2 *Scan* is edited in the build: replace "[DESIGN — Attention Pool and Thread Tugs partially implemented …]" with an [IMPL] clause, *Looking in on a mortal who lives on costs Attention; one who asks you never does; news of a mortal's home is free*, citing `attentionPool.ts` `attendThreadTug` and this plan.

> Brainstorm companion: `Docs/plans/2026-10-27-thr-2062-attention-has-a-price-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | One new named constant; every cost stays a constant |
| 2. Inspectability | PASS | The spend moves into the engine and emits `attention_pool` |
| 3. Determinism | PASS | No RNG; once-per-crossing is stored state |
| 4. Fail-soft | PASS | See table; every miss means no spend |
| 5. Narrative over mechanical perfection | PASS | Badge speaks in the gauge's words, not numbers |
| 6. Additive over destructive | PASS | Two optional fields, one optional trace field |
| 7. Performance budget | PASS | One property read per thread per tick |

## Done when

- [ ] E1–E5, C1–C2, U1–U3 shipped; unit tests: pause-mode thread yields no pull; livelihood pulls once per crossing and again after leaving the tier; `attendThreadTug` spends, refuses, and returns `null` per the fail-soft table; `attentionCanBeSpent` true/false cases.
- [ ] `scripts/census-attention.ts` (from the proto) lands as `npm run census:attention`; before/after recorded in the status fragment and the kill criteria hold.
- [ ] Browser evidence per the UI pillar; rulebook §2 line; interface map + contracts row.
- [ ] `grep -rn "properties.attentionPool =" src/components` returns nothing.
- [ ] `npm run gate` verdict pasted; engine files owe the 30-tick CLI smoke.
- [ ] Closing commit body includes the issue's close line on its own line.

## Coordination block

**Build ticket:** this ticket (THR-2062) carries the build. It moves to Ready for Dev at handoff; no child is filed.

**Suggested model:** sonnet. Five small engine edits, two copy lines and one predicate; the design is settled.
**Parallel-safe with:** [THR-2072](https://linear.app/threadbare/issue/THR-2072) and [THR-2051](https://linear.app/threadbare/issue/THR-2051) (no shared file).
**Mutex with:** anything editing `src/engine/phases/resourceStockTiers.ts` (the salt plan [THR-2069](https://linear.app/threadbare/issue/THR-2069) adds a good that file classifies), `phaseAttention.ts`, or `godRailComponents.tsx`.
**Files to touch:**
- Edit: `src/engine/attentionPool.ts` (`attendThreadTug`, `tugAttendCost`, `attentionCanBeSpent`)
- Edit: `src/engine/phaseAttention.ts` (pause-mode skip in §§ 4a, 4b)
- Edit: `src/engine/phases/resourceStockTiers.ts` (once per crossing, `kind`)
- Edit: `src/types/attention.ts` (`ThreadTug.kind`, trace fields), `src/types/resource.ts` (`livelihoodPulledTier`)
- Edit: `src/data/attention-constants.ts` (`LIVELIHOOD_TUG_ATTEND_COST`), `src/components/CMS/tunableConstants.ts` (its row)
- Edit: `src/engine/views/godRail.ts` (`spendable`), `src/components/Game/frame/godRailComponents.tsx`, `src/data/opening-reveal-table.ts`
- Edit: `src/components/Game/threadTugBadgeModel.ts`, `src/components/Game/hooks/useAgentInteraction.ts`, `src/components/Game/AttentionPoolIndicator.tsx`
- Edit: `src/data/first-use-captions.ts`, `src/data/ui-content.ts`, `Docs/canon/rulebook.md`, `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`
- Create: `scripts/census-attention.ts` + `census:attention` in `package.json` (from the proto)
- Tests: `src/engine/__tests__/attentionPool*.test.ts`, `phaseAttention*.test.ts`, `resourceStockTiers*.test.ts`, `src/components/Game/__tests__/threadTugBadgeModel*.test.ts`

## Notes for the executor

- The proto branch [`proto/thr-2062-attention-census`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2062-attention-census) was committed with `--no-verify` and is never merged; lift the census script and the two-line pause skip by hand.
- The census's greedy player models the hook's spend inline; once E4 lands, call the engine `attendThreadTug` instead so the census measures the real writer.
- Do not touch the curator cap (`curator.ts:102-104`): chapter pulls never reach it.

## Intent-judge verdict

**Allow** (Reversible), 2026-10-27, cold opus judge, third run. Run 1 Revise (no Player-facing text or Playtest signal; "Thread Tug" not used), fixed. Run 2 Revise (the livelihood badge said "grain" for all four staples), fixed with per-good words from `resourceWord`; E1 now traces its skip. Run 3 notes applied: the Thread Tug sentence goes through [UL-proposal THR-2074](https://linear.app/threadbare/issue/THR-2074); the phase label reads 2a.65; the handoff states THR-2062 is the build ticket.

## Forked-audit verdicts

### NFP audit
PASS-with-notes. All seven pass. Notes: a livelihood re-pull suppressed by once-per-crossing shows only as `emittedTug: false` with no reason; the gauge predicate is read through the debug bundle, not traced. The hook's direct pool write is retired on purpose (one engine writer, grep-enforced).

### Three-pillar audit
PASS-with-notes. All three pillars present and substantive; wiring maps every module. Notes applied: Event notifications, Debug inspection and HexMapV2 now carry explicit lines; the Content N/A sub-surfaces are stated; substrate rows use the inventory's names.

### Vision audit
PASS-with-notes. No contradictions; the plan confirms *witnessing, not steering* and the core loop's scan. Notes applied: the gauge tooltip drops its numerals (U2), and the kill criteria now bound the punishing side as well as the loose one.
