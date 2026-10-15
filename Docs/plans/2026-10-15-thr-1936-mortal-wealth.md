> **title:** Mortal wealth — a mortal's Means becomes a want, and the money encounters finally pay or cost something — THR-1936
> **linear_issue:** THR-1936
> **author:** Claude Code (design lane, unattended, run 2026-10-15e)
> **created:** 2026-10-15
> **three_pillars:** Engine done · Content done · UI done

# Mortal wealth — THR-1936

*Every mortal who makes choices is born with Means, the money encounters they take pay or cost them by how the dice fall, and a poor or greedy mortal leans toward the work that pays.*

## Why this is load-bearing

The [Mortal economy map](https://linear.app/threadbare/issue/THR-1863) wants the economy to *"drive a lot of the fundamental interaction and behavior"* of mortals (Christian, 2026-10-14). For a single mortal it drives nothing today. Three facts, measured on this worktree at `origin/main` (2026-10-15):

- **The mortals who choose have no money.** Only autonomous deciders run the decision board (`phaseAgentDecision.ts:580-582`, `isAutonomousDecisionActor` `decisionTier.ts:34-37`). Worldgen creates them at spotlight tier without `wealth` (`worldSeed.ts:1840-1853`, the mercenary commander `worldSeed.ts:2173-2195`, the garrison captain `seedLivingWorld.ts:1126-1145`). The role table that would give them some (`ROLE_WEALTH`, `npcGraduation.ts:91-121`) is applied only by `hydrateToTier` (`:292-294`), which skips a node already at its tier (`:267`). The person sheet hides Means when `wealth` is absent (`OverviewTab.tsx:708-735`).
- **No encounter writes money.** Of the 71 money encounters [tabled by the outcome research](https://linear.app/threadbare/issue/THR-1872), 70 write nothing economic. Simple encounters cannot carry step writes at all: the converter hard-codes `onSuccess: []` / `onFailure: []` (`encounter-content.ts:335-336`) and `toOutcomeMeta` drops effects (`:298-305`). Step writes are success-or-failure only. The aftermath effect vocabulary has no wealth kind (`EncounterAftermathReactionEffect`, `unifiedAction.ts:438-1415`). `bankWealth` (`wealth.ts:122-132`) has two production callers, both holding income (`holdingIncome.ts:199`, `yieldOps.ts:145`).
- **Nothing reads a mortal's money when they choose.** `wealthCost` is declared (`types/strategicAction.ts:257`) and never read; `scoreUnifiedBoard` (`decisionBoard.ts:534`) has no wealth term.

**Settled input** (cited inline where used; not re-opened):

- **[What money means to a mortal](https://linear.app/threadbare/issue/THR-1865)** — decided by the design lane under delegation, 2026-10-14T10:42Z: *a want first, a cost later.* Prototype [`proto/thr-1865-means-want` @ d7b23e57](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1865-means-want), never merged ([sketch output](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1865-means-want/scripts/proto/means-want-sketch.output.txt)). Its veto window closed 2026-10-15T10:42Z with no veto.
- **[Which money encounters should change the economy](https://linear.app/threadbare/issue/THR-1872)** — research resolved by the orchestrator, 2026-10-14: the 71-row outcome table, its two blockers and thirteen defects (resolution comment).
- **Christian's priority ruling** (map, 2026-10-14): kingdom economy before individual richness. The kingdom plans are written ([purse](https://linear.app/threadbare/issue/THR-1931), [crown](https://linear.app/threadbare/issue/THR-1932)); this plan's money-to-a-faction rows build after the purse.
- **Christian's re-check** (on THR-1865, 2026-10-14): when this lands, check it *"against the kingdom design (for example, whether a mortal's Means should come from their town's and faction's fortunes rather than their own ledger)."* Answered in § Resolution 1.

**How-level choices this plan made** (the decisions left them open; reasons in the [brainstorm companion](2026-10-15-thr-1936-mortal-wealth-brainstorm.md); each is invited for veto): a mortal keeps **their own ledger**, born from their walk of life and shifted by their home town's fortunes; money is written **once, at the roll, by band** through one new outcome table on the template, never by which reaction the mortal picks; the table reuses the aftermath effect vocabulary with **one** new effect kind, `economy_shift`; "paying work" is **derived from the table** (an encounter that pays its actor on a success), not a list of encounter types; losses are halved for a mortal already below Getting by, so poverty never spirals; founding costs ship switched off and switch on only when the measured predicate holds.

## Substrate inventory

Measured on this worktree at `origin/main`, 2026-10-15. Citations are `path:line`.

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Wealth store (`wealth.ts`: tiers Magnate 80 · Wealthy 60 · Comfortable 40 · Getting by 20 `:60-69`, `getWealthTier` `:82-88`, `applyWealthDelta` 0–100 `:97-99`, `readWealth` `:105-108`, `bankWealth` `:122-132`) | 🟢 ACTIVE | **reads and extends the funnel.** Every new mortal write goes through `bankWealth`, which clamps and records `lastWealthReason`. No new store. |
| Role wealth (`ROLE_WEALTH` + `DEFAULT_WEALTH` 20, `npcGraduation.ts:91-123`; `hydrateToTier` `:255-294`; `mintInhabitant.ts:319`) | 🟢 ACTIVE (promotions), 🟠 DORMANT (worldgen deciders) | **activates for worldgen deciders** through one birth pass (§ Systems design 1). Table values unchanged. |
| Holding income (`payHoldingIncome`, `holdingIncome.ts:174-221`; daily, mortals only `:86-88`) | 🟢 ACTIVE | **untouched.** It is the passive half of a mortal's income; this plan adds the active half. |
| Encounter resolution (`fireResolvedActionTriggers`, `unifiedActionResolution.ts:3217`, called on the rolled path `:2845` and the fight no-roll end `:3121`, with `state`, final band, `rng`, `runtime` and the `aftermathChanges` list) | 🟢 ACTIVE | **extends.** The outcome table applies here, once per resolved encounter, for every mortal (watched or not). |
| Aftermath effects (`applyEncounterAftermathReaction`, `encounterAftermath.ts:1134`; the 49-kind union `unifiedAction.ts:438-1415`; synthetic-reaction call precedent `ascendantBeat.ts:1168`) | 🟢 ACTIVE | **extends** with one kind, `economy_shift`; the outcome table calls the same executor. |
| Aftermath variants (`resolveTemplateAftermathVariant`, used at `unifiedActionResolution.ts:3343-3347`; `byOutcome` `unifiedAction.ts:2297-2342`) | 🟢 ACTIVE | **reads.** A branching encounter's variant may carry its own outcome table, which wins over the template's (§ Resolution 3). |
| Simple-encounter converter (`encounter-content.ts`, allowlist; `aftermathConfig` passthrough `:406`) | 🟢 ACTIVE | **extends** with one passthrough line for `outcomeEffects`. Step ops stay empty. |
| Aftermath change kinds (`EncounterAftermathChangeKind`, `unifiedAction.ts:180-188`) | 🟢 ACTIVE | **extends** with `economy` (§ UI pillar). |
| Decision board (`scoreUnifiedBoard` `decisionBoard.ts:534`; encounter score `:576-577`; undertaking `temperamentWeight` `:643-645`; `encounterType` on the cache entry, `encounterCache.ts:99`) | 🟢 ACTIVE | **extends** with one bounded multiplier on paying work (slice S2). |
| Greed axis (`asceticism_extravagance`, `types/agent.ts:11`; words Generous +1 / Greedy −1, `axisRegistry.ts:99-100`) | 🟢 ACTIVE | **reads only.** |
| Means on the person sheet (`OverviewTab.tsx:708-735`; source phrase `describeWealthSource`, `agentDetail.ts:1002-1014`) | 🟢 ACTIVE | **extends.** Now shown for every decider; the source phrases `trade_success` / `trade_failure` finally get writers. |
| Undertaking costs (`wealthCost`, `types/strategicAction.ts:257`; no reader) | 🔴 UNWIRED | **stays unread.** Founding costs are a new, switched-off cost table (slice S2), not this field. |
| `update_node` wealth deltas (`graphOpExecutor.ts:528-561`: plain add, no clamp; a bare number replaces) | ⚠️ HAZARD | **avoided.** No row in this plan writes wealth through `update_node`; a new content test fails any template that does. |

**Runtime counts, seed 42 medium** (from the [THR-1865 sketch](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1865-means-want/scripts/proto/means-want-sketch.output.txt), same world): threaded mortals with wealth at t300 **0**; with the birth pass, median decider wealth at t300 **20** (8 without it); paying work wins **17 of 1,651** board decisions today; Getting-by deciders who reached Comfortable did so in a median **240 ticks** (4 of 19).

## Engine pillar

### Systems design

Three slices, one plan. **This ticket builds S1.** S2 and S3 are filed as their own tickets (§ Slices).

**1. Born with Means (S1).** A new pure helper, `ensureDeciderMeans(graph, tick)` in `src/engine/mortalMeans.ts`, runs once at the end of world creation (`initializeGameState` in `src/engine/gameInit.ts`, after `seedLivingWorld`), and from `npcGraduation`'s promote-to-spotlight path as a no-op guard. For every node where `isAutonomousDecisionActor(node)` is true and `wealth` is undefined:

`wealth = clamp((ROLE_WEALTH[npcRole] ?? DEFAULT_WEALTH) + (MEANS_BIRTH_HOME_SHIFT[homeTier] ?? 0), 0, 100)`

where `homeTier` is `getProsperityTier(prosperity)` (`phaseProsperity.ts:205`) of the settlement the mortal is `located_at` (via `resolveToParentLocation`), or none. `MEANS_BIRTH_HOME_SHIFT`: Flourishing +10 · Prosperous +5 · Modest 0 · Struggling −5 · Destitute −10. It writes `lastWealthReason: 'birth'`. Deterministic; no PRNG. The First and every other decider without `wealth` are covered; an avatar is not a decider and is skipped.

**2. Money written at the roll (S1 seam, S2/S3 content).** A template may carry an **outcome table**:

```ts
// src/types/unifiedAction.ts — on UnifiedActionTemplate and on an aftermath variant
readonly outcomeEffects?: Partial<Record<UnifiedActionOutcome, readonly EncounterAftermathReactionEffect[]>>;
```

In `fireResolvedActionTriggers`, after the existing triggers, the resolution looks up the band's effects (variant first, then template; § Resolution 3) and applies them through `applyEncounterAftermathReaction` with a synthetic reaction `{ id: '<templateId>:outcome:<band>', effects }`, the call `ascendantBeat.ts:1168` already makes. It runs **once per resolved encounter, for every mortal**, before the aftermath summary is built, so the summary's change list includes what the table wrote. The flag `resolved.outcomeEffectsApplied` on the action stops a second application (the autonomous aftermath phase and the player's reaction never re-run it). The table is independent of which reaction the mortal picks afterwards: the dice decide what the venture paid; the reaction decides what the mortal does about it.

The converter gains one passthrough (`outcomeEffects: e.outcomeEffects`, beside `aftermathConfig` at `encounter-content.ts:406`). Step `onSuccess` / `onFailure` stay as they are.

**3. One new effect: `economy_shift` (S1 with `means`; S3 adds the rest).**

```ts
{
  kind: 'economy_shift';
  quantity: 'means';                 // S3 widens: 'prosperity' | 'unrest' | 'stock' | 'lane_volume' | 'purse'
  target?: 'actor' | string;         // 'actor' (default) or a declared cast key
  amount: number;                    // signed, on the quantity's own 0–100 scale
  reason?: MeansReason;              // the source phrase key; defaults by sign and encounterType
}
```

For `means`, the executor reads the target mortal, scales a loss by `MEANS_POOR_LOSS_SCALE` (0.5) when the mortal is below Getting by (`wealth < 20`), and banks it with `bankWealth(props, amount, reason)`. Default reason: a gain on a `trade` encounter is `trade_success`, a loss `trade_failure`; `steal` gains `theft`; `hire` gains `paid_work`; any other gain `venture_gain`, any other loss `venture_loss`. It returns an `economy` aftermath change (§ UI pillar) for the target and emits `economy.means.shift`.

**4. The want (S2).** A pure `computeMeansWant(wealth, greedLean)` in `src/engine/mortalMeans.ts`, the [THR-1865 decision](https://linear.app/threadbare/issue/THR-1865)'s rule with its constants:

- `poverty = clamp((MEANS_COMFORT_LINE − wealth) / MEANS_POVERTY_SPAN, 0, 1)`
- `generous = max(0, lean)`, `greedy = max(0, −lean)` on `asceticism_extravagance` (+1 Generous, −1 Greedy)
- `want = poverty × (1 − MEANS_GENEROSITY_DAMP × generous) + MEANS_GREED_WEIGHT × greedy`
- a mortal at or above `MEANS_RICH_LINE` with `greedy < MEANS_RICH_GREED_CEILING` has `want = −MEANS_RICH_DAMPEN` instead (the rich who are not greedy turn away from coin work)
- `multiplier = 1 + MEANS_WANT_WEIGHT × want` (range 0.82 … 1.9)

`scoreUnifiedBoard` multiplies **paying work** by it: an encounter entry's score (`decisionBoard.ts:576-577`) and an undertaking's `temperamentWeight` (`:643-645`). Paying work is:

- an encounter whose outcome table (template level) gives the **actor** a positive `means` `economy_shift` at `success` — derived once per template into a cached set, `templatePaysActor(templateId)`, so content decides what counts (Law 42). The set is owned by the session's `SimulationRuntime` (built lazily on first board, rebuilt when the template registry's version changes), never a module-scope singleton;
- an undertaking cell in `MEANS_EARNING_CELLS`: draw yield (`use×location`), claim or seize a freehold or a toll (`control:claim|seize × place|route`), conduct trade (`use×route`) and, per the decision's correction, **claim a town** (`control:claim×location`).

The multiplier never touches the forecast or the engagement window (Law 20; THR-1575). It is recorded on the board entry (`meansMultiplier`) and the board result (`meansWant`).

**5. Founding costs (S2, switched off).** `MEANS_CELL_COST` (create a town 40 · create a place 25 · create a lane 20 · raise a lane 10) behind `MEANS_CELL_COST_ENABLED = false`. When on, a costed cell a mortal cannot afford is dropped from their board and the cost is banked (`reason: 'founding'`) when the work starts (`strategicActionLifecycle.ts`). While the mortal's most-wanted cell (highest desire multiplier on the board) is one of the dropped ones, their want gains `MEANS_UNAFFORDED_WANT` (0.3): wanting to found something they cannot pay for pushes them toward paying work. With costs off, this term is 0. S2 runs the decision's predicate (§ Done when, S2) and switches it on in the same PR **only if** it holds; otherwise it stays off and the [undertakings plan](https://linear.app/threadbare/issue/THR-1937) reads it as off.

**Rollback.** `MORTAL_MEANS_ENABLED = false` skips the birth pass, the outcome tables and the want; `economy_shift` becomes a no-op that returns no change. The game then behaves as on main.

### Graph nodes / edges

No new node or edge types. Properties:

| Where | Property | Type | Writer |
|---|---|---|---|
| actor node | `wealth` (existing) | number 0–100 | birth pass, `economy_shift`, holding income (existing), founding cost (S2) |
| actor node | `lastWealthReason` (existing) | `MeansReason` string | `bankWealth` |
| `UnifiedAction` | `outcomeEffectsApplied` | boolean | resolution |
| template / aftermath variant | `outcomeEffects` | band → effects | content |

### Tick phases

| Phase | Slot | Cadence | Reads | Writes |
|---|---|---|---|---|
| world creation (`initializeGameState`) | after `seedLivingWorld` | once | deciders, role, home prosperity | `wealth`, `lastWealthReason` |
| encounter resolution (`fireResolvedActionTriggers`) | unchanged | per resolved encounter | template / variant `outcomeEffects`, final band | via the effect executor; `outcomeEffectsApplied` |
| `agent_decision` (`scoreUnifiedBoard`) | unchanged | unchanged | `wealth`, greed lean, `templatePaysActor` | board entry fields only |

### Resolution logic

1. **Whose ledger.** A mortal's Means is their own ledger (the [THR-1865 decision](https://linear.app/threadbare/issue/THR-1865)), and their town's fortunes reach it three ways rather than replacing it: at birth (`MEANS_BIRTH_HOME_SHIFT`), through what a place pays its holders (holding income's tithe and freehold, unchanged), and through [hunger and unrest](https://linear.app/threadbare/issue/THR-1934)'s *Restless home = one Means band poorer*. A Means derived wholly from the town would make every mortal in a town equally rich, which the map's diversity ruling forbids (*"all settlements shouldn't end up looking the same"*), and would leave the money encounters nothing to write.

   **The faction's fortunes** reach a member's Means through work, not through membership. The [faction purse](https://linear.app/threadbare/issue/THR-1931) has no dues and pays no wages (its plan, § Notes: *"Do not add dues"*; realm membership churns, [THR-1918](https://linear.app/threadbare/issue/THR-1918)), and the [crown](https://linear.app/threadbare/issue/THR-1932)'s tax runs faction to faction. In v1 the coupling runs the other way and stays indirect: S3's purse rows move coin **from** mortals **to** factions (the border levy, guild aid, the keeper's petition, the garrison's price), and the purse makes Commission Quest and Issue Bounty reachable, so a rich faction fills the boards with its errands and a broke one stops. No row in the research table pays a mortal out of a faction's purse, so this plan adds none; *a faction's quest or bounty pays its finisher from the purse* is listed in the Deferral (§ Slices) as the first faction-to-mortal write. A Means read off the faction would hand every member the same fortune and break when membership churns. Wages and patronage stay out (the map's *later efforts*). This is the answer to Christian's re-check; it is a how-level choice invited for veto.
2. **Band magnitudes.** The research table's signs map to named steps: `+` = `MEANS_STEP` (6), `++` = `MEANS_STEP_BIG` (12), small = `MEANS_STEP_SMALL` (3), and the same negative. A band is 20 points wide, so one `+` is a third of a band; a lucky streak of three moves a mortal one word.
3. **Variant before template.** When a branching encounter's resolved aftermath variant carries `outcomeEffects`, its table replaces the template's for that resolution (the path the mortal took decides who paid, e.g. the smugglers' ford lead path). Otherwise the template's table applies.
4. **The poor lose less.** Below Getting by, a loss is halved (`MEANS_POOR_LOSS_SCALE`) and Means floors at 0 through `bankWealth`. With the want pulling the poor toward paying work, this keeps a failed venture from becoming a spiral (the THR-1575 ruling: *"never recreate the early-game traps"*; Law 24).
5. **No double charge.** An outcome table runs once per action (`outcomeEffectsApplied`). An encounter that also authors a reaction writing the same quantity is a content-test failure.

### PRNG callouts

None new. The table keys on the band the existing roll produced; the birth pass and the want are deterministic.

## Content pillar

### Encounter templates

**S2 — the Means rows.** Every row of the [outcome research table](https://linear.app/threadbare/issue/THR-1872) whose write names the acting mortal's Means (carrier **U** on Means) or a cast member's Means (the counting-house dispute's founder and rival house, the merchant's favour) gets an `outcomeEffects` entry for its Means half, at the table's signs (§ Resolution 2). That is about 40 templates: the 23 simple encounters measured (`merchants_gambit` `encounter-content.ts:672` … `sunken_vault` `:14644`; 6 trade, 6 steal, 3 acquire, 3 hire, 1 each lead, create, duel, assist, explore) and the branching rows with a Means write (bell at the exchange, border levy, debt arbitration, ledger by lamplight, pawnbroker's strongroom, smugglers' ford, tithe demanded, toll-gate writ, toll of blades, warlord's tribute, the unmarked crossing, the garrison's price, counting-house dispute, the merchant's favour, the granaries in the famine year). Where the table's prose column says *"needs a line"*, S2 authors that line in the band's existing afterimage (game register, GM narration).

**S3 — the world rows.** The same table's prosperity, unrest, staple, deposit and lane-volume halves, on the widened `economy_shift` (`HARVEST_BAND_SCALE` replaces the god-scale ±25 of `bless_harvest` for encounter use); the seven purse rows on `quantity: 'purse'` through the [faction purse](https://linear.app/threadbare/issue/THR-1931)'s `applyTreasuryDelta` (S3 is blocked by that build); the debt rows on the existing `attachment_grant` once [encounter debts count](https://linear.app/threadbare/issue/THR-1920).

**Not in this plan** (filed as one Deferral, § Slices): place-as-holding writes (a forge or a mill held after success, a prospecting claim), lane-bound writes on the lane events (their seeds drop the lane, defect 8), `sworn_to` from tribute exchange (the crown's), removing a debt, a faction's quest or bounty paying its finisher from the purse, and making money scenes likelier in famine or glut (*likelier when* column; granary riot's famine eligibility belongs to [hunger and unrest](https://linear.app/threadbare/issue/THR-1934)).

### Prose tables

Source phrases in `describeWealthSource` (`agentDetail.ts:1002-1014`), new keys only (existing `trade_success` / `trade_failure` gain writers):

| Reason | Phrase |
|---|---|
| `birth` | "what their walk of life left them" |
| `theft` | "something taken that was not theirs" |
| `paid_work` | "work that paid" |
| `venture_gain` | "a venture that paid" |
| `venture_loss` | "a venture that cost them" |
| `founding` (S2) | "what it cost to found something" |

No chronicle lines: one mortal's purse is not world news (equilibrium is silence).

### Attachment content

N/A — no attachments in S1/S2. S3's debt rows reuse authored debts.

### Data tables

`src/data/mortal-means-constants.ts` (all constants, § Constants table) and the `outcomeEffects` entries on the templates. A new content test, `outcomeEffects.test.ts`, checks every table: bands are real `UnifiedActionOutcome` values; `means` amounts are on the named steps; a cast-key target is a declared cast key that binds (memory: a declared key may be bind-only); no template writes `wealth` through `update_node`; no template writes the same quantity in both its table and a reaction; and (from S2) every template whose table costs the actor Means on a failure band carries a `stakes` risk clause that names the loss (PC-2, § Player-facing text).

## UI pillar

*Screenshot tool: Playwright (DOM surfaces only — the person sheet, the aftermath veil and the debug tab; no WebGL change).*

### Player-facing display

1. **Means on every decider's sheet.** The existing row (`OverviewTab.tsx:708-735`) now appears for every mortal who makes choices, because they all have `wealth`. Words unchanged (Destitute · Getting by · Comfortable · Wealthy · Magnate, the one ladder of the [visibility decision](../audits/2026-10-15-thr-1870-economy-visibility-decision.md) § 1).
2. **An `economy` change on the aftermath.** `economy_shift` returns one aftermath change of the new kind `economy` for the mortal it moved, so a watched encounter's aftermath says what it did to their purse. Wording follows the visibility decision § 5: a crossed band names the new word, a move inside a band names only the direction. The god's-stake plan ([THR-1935](https://linear.app/threadbare/issue/THR-1935)) reuses this change kind for cast receipts; this plan owns its shape.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Encounter stakes line, before the roll (`stakesLine.ts`, the THR-1727 formula `[lead], [actor] must [goal] — or [risk].`) | "Passing through Ashford, Kael Thornweaver must strike a bargain at the market — or come away poorer." | PC-2 | The risk clause is authored content (`template.stakes.risk`, `unifiedAction.ts:2778`; built by `buildStakesLine`, `stakesLine.ts:208-226`; the lead is the existing `chance` variant). Content rule, enforced by `outcomeEffects.test.ts`: **every template whose outcome table costs the actor Means on a failure band carries `stakes` whose `risk` and `lost` (and `lostBadly` where authored) name the loss**; S1 authors it for its one seed row, S2 for the rest. No engine default is added. |
| Encounter result line, after the roll (`STAKES_RESULT_FORMS`, `nudge-stage-content.ts:93-102`, failure form `{actor} {lost}.`) | "Kael Thornweaver came away poorer." | PC-2 | The same authored `lost` ending the risk clause promised. The aftermath's `economy` change (next rows) then says what that loss did to the purse in the sheet's words: the stakes line names the risk, the result line says it landed, the change names the new Means word. |
| Aftermath change, band crossed (gain) | title "Better off" · detail "Kael Thornweaver is now Comfortable." | PC-1, PC-6 | The word is the sheet's Means word; the name routes through `useRefRouter` (Law 21). Polarity `gain`. The second surface showing this fact is the sheet's Means tooltip ("Lately: …"): both read the same write — `bankWealth` sets `wealth` and `lastWealthReason` together in the effect that returns the change — so they cannot disagree after an `economy_shift`. |
| Aftermath change, band crossed (loss) | title "Worse off" · detail "Kael Thornweaver is now Getting by." | PC-1, PC-6 | Polarity `loss`. |
| Aftermath change, inside a band | title "Fortunes turn up" / "Fortunes turn down" · detail "Kael Thornweaver comes away a little richer." / "…a little poorer." | PC-1 | The visibility decision's *"fortunes turn up / down"*. No amount. |
| Change title tooltip (`ui.econ.means.change`) | "How this moved their Means: what they have gathered and kept, in one of five words, from Destitute to Magnate." | PC-1 | First-use explanation, on hover of the title (Law 1). |
| Result line at the floor (a failure on a mortal already at 0) | "Kael Thornweaver came away poorer." with no `economy` change | PC-6 | Accepted as story: the authored `lost` is what happened in the scene, and there was nothing left to lose; the sheet already reads Destitute. Law 56 holds because no change chip claims a move that did not happen. |
| Change detail, name does not resolve | "They are now Comfortable." · "They come away a little richer." | PC-3 | The empty-slot rendering: the pronoun replaces the name; no link is drawn. |
| Means tooltip | "Lately: a venture that paid." (one of the § Prose tables phrases) | PC-3 | The existing tooltip shape `` `Lately: ${source}.` `` |

### Playtest signal

A tester who follows a poor mortal sees them take a paying job, and can say after the aftermath whether it paid. **Watch item:** no tester reads a mortal's Means as a number to farm; it stays a word and a story.

### Event notifications

None. The aftermath change rides the existing aftermath. No toast, no Needs-you entry, no chronicle line.

### Debug inspection (DebugPanel)

- **Economy debug tab** (`EconomyDebugTab.tsx`) gains a **Means** table: decider, wealth, band, last reason, want and multiplier (S2).
- **`window.__DEBUG.getMortalMeans(agentId): Promise<{ wealth: number; band: string; lastReason: string | null; want: MeansWantBreakdown | null } | null>`** in `src/debug-bridge.ts` + `src/debug-bridge.d.ts` (S1 returns `want: null`).
- Board traces carry `meansMultiplier` per entry and `meansWant` per board (S2).

### Visual presence (HexMapV2)

N/A — a mortal's purse is not drawn on the map (the plain map stays quiet, THR-1830).

### UI Laws engaged

| Law | Verdict |
|---|---|
| 1 / 17 | The Means word keeps its tooltip; the aftermath change's title carries a `ui.econ.means.change` registry tooltip. Build obligation. |
| 13 / 14 | Words only: no amount on the sheet or the aftermath. |
| 21 | The name in the change detail routes through `useRefRouter`. Build obligation. |
| 33 | The change is one row in the existing aftermath list; nothing new competes for space at 1920×1080. |
| 37 | N/A — no multi-beat flow. |
| 56 | The change appears only when `economy_shift` actually moved `wealth`; a 0 move (clamped at 0 or 100) writes no change. |

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `src/engine/mortalMeans.ts` (`ensureDeciderMeans`, `computeMeansWant`, `templatePaysActor`) | world creation; `agent_decision` (S2) | `OverviewTab` Means row | actor `wealth`, `lastWealthReason` | `economy.means.birth` | `__DEBUG.getMortalMeans`; Economy tab Means table (S2) |
| `unifiedActionResolution.ts` (`fireResolvedActionTriggers` applies `outcomeEffects`) | encounter resolution | aftermath veil | `UnifiedAction.outcomeEffectsApplied` | `economy.means.shift` (through the effect) | trace viewer |
| `encounterAftermath.ts` (`economy_shift` case) | via the executor | aftermath change list | actor `wealth` | `economy.means.shift` | trace viewer |
| `encounter-content.ts` (converter passthrough) | — | — | — | — | content test |
| `buildAftermathConsequences.ts` (`economy` case) | — | aftermath veil consequence list | reads the change | — | browser evidence (S1 Done when) |
| `decisionBoard.ts` (multiplier, S2) | `agent_decision` | — | — | board trace `meansMultiplier`, `meansWant` | board trace; Economy tab |
| `strategicActionLifecycle.ts` (founding cost, S2, off) | undertaking start | — | actor `wealth` | `economy.means.shift` (`reason: 'founding'`) | trace viewer |

**Prose pipeline:** the aftermath change's sentence is built in a pure helper (`mortalMeans.ts → meansChangeSentence`) from the before/after band, never `enrichProse`. **Player controls:** none; the player reads Means.

**Order.** Individual wealth builds after the kingdom economy (Christian's priority ruling; the ticket: *"schedule its build after the faction purse"*). So **S1 is blocked by [the faction purse build](https://linear.app/threadbare/issue/THR-1931)**, and nothing in this plan ships before the purse does. S2 needs S1. S3 needs S1, [the faction purse build](https://linear.app/threadbare/issue/THR-1931) (purse rows) and [encounter debts never count](https://linear.app/threadbare/issue/THR-1920) (debt rows). [Undertakings in the economy](https://linear.app/threadbare/issue/THR-1937) reads S1's birth Means and S2's want and cost switch.

## Interface impact

`Docs/canon/interface-map.md` lists Economy & Prosperity as audit-on-touch (`:402`). Mapped subsystems: **Mortal Economy & Prosperity** (wealth funnel extended; holding income preserved), **Encounters & Dilemmas (core)** (resolution gains the outcome table; one effect kind), **Agent decision** (one board multiplier, S2). Contracts:

| Contract | Kind | Production read site |
|---|---|---|
| `encounter-outcomes-write-mortal-means` (actor `wealth`, `lastWealthReason` via `economy_shift`) | **add** | `OverviewTab.tsx:708-735` Means row; `scoreUnifiedBoard` want (S2) |
| `mortal-means-steers-board` (`wealth` + greed lean → `meansMultiplier`) | **add** (S2) | `scoreUnifiedBoard` (`decisionBoard.ts:534`) |
| `deciders-born-with-means` (worldgen `wealth` on autonomous deciders) | **add** | `OverviewTab.tsx` Means row; holding income's running total |
| `freehold-income-pays-mortal-holders` (`interface-contracts.ts:5018`) | **preserve** | unchanged |

`scripts/interface-contracts.ts` gets the same rows; `Docs/canon/systems-inventory.md`'s Mortal Economy row (`:74`) gains "a mortal's Means from birth, encounter outcomes that pay or cost, and the want". Design Reference Wiki: **`encounters-manual-reference`** (its sources match `src/engine/encounter*.ts`) gains the outcome table and `economy_shift`.

**UL:** `Docs/ubiquitous-language/Agents.md` § Means (`:913-923`) gains one sentence (encounter outcomes bank through `bankWealth` via `economy_shift`; every decider is born with Means) and its stale code anchor is corrected (`bankWealth` lives in `wealth.ts`, not `holdingIncome.ts`). No new player word, so no `UL-proposal`.

## Constants table

All in `src/data/mortal-means-constants.ts`. Want values are the [THR-1865 decision](https://linear.app/threadbare/issue/THR-1865)'s prototype values.

| Constant | Default | Purpose |
|----------|---------|---------|
| `MORTAL_MEANS_ENABLED` | `true` | Master switch and rollback lever |
| `MEANS_BIRTH_HOME_SHIFT` | Flourishing +10 · Prosperous +5 · Modest 0 · Struggling −5 · Destitute −10 | Home town's fortune on birth Means |
| `MEANS_STEP_SMALL` / `MEANS_STEP` / `MEANS_STEP_BIG` | `3` / `6` / `12` | The research table's small / `+` / `++` |
| `MEANS_POOR_LOSS_SCALE` | `0.5` | Losses below Getting by are halved |
| `MEANS_POOR_LINE` | `WEALTH_TIER_GETTING_BY` (20), **imported** from `wealth.ts:68` | Getting by's floor; one source of truth for the tier line |
| `MEANS_COMFORT_LINE` | `WEALTH_TIER_COMFORTABLE` (40), **imported** from `wealth.ts:65` | Below this a mortal feels poverty |
| `MEANS_POVERTY_SPAN` | `40` | Poverty reaches 1 at 0 wealth |
| `MEANS_GENEROSITY_DAMP` | `0.5` | A Generous lean softens poverty's pull |
| `MEANS_GREED_WEIGHT` | `0.5` | A Greedy lean adds want at any wealth |
| `MEANS_RICH_LINE` | `WEALTH_TIER_WEALTHY` (60), **imported** from `wealth.ts:62` | Wealthy's floor |
| `MEANS_RICH_GREED_CEILING` | `0.3` | A rich mortal greedier than this is not damped |
| `MEANS_RICH_DAMPEN` | `0.3` | The rich, not-greedy want (negative) |
| `MEANS_WANT_WEIGHT` | `0.6` | Board multiplier on paying work: 1 + this × want |
| `MEANS_EARNING_CELLS` | 7 cell keys (§ Systems design 4) | Undertakings that count as paying work |
| `MEANS_CELL_COST_ENABLED` | `false` | Founding costs switch (S2 flips it only on the predicate) |
| `MEANS_CELL_COST` | town 40 · place 25 · lane 20 · raise lane 10 | Founding costs |
| `MEANS_UNAFFORDED_WANT` | `0.3` | Extra want while the mortal's most-wanted cell is unaffordable (only with costs on) |
| `MEANS_COMFORT_PACE_TARGET_TICKS` | `120` | The cost switch's predicate: half of today's 240-tick median |
| `HARVEST_BAND_SCALE` (S3) | critical_success 1.5 · success 1 · success_at_cost 0.5 · failure 0 · critical_failure −0.5, on a base of `HARVEST_ENCOUNTER_BASE` 8 staple | An encounter's staple write by band, replacing the god-scale ±25 of `bless_harvest` for encounter use |

## Tracing

```ts
// economy.means.birth — once per decider at world creation (only when tracing is enabled)
interface MeansBirthTrace {
  type: 'economy.means.birth';
  tick: number;
  agentId: string;
  role: string | null;
  homeTier: ProsperityTier | null;
  wealth: number;
}

// economy.means.shift — every economy_shift on 'means' that moved wealth
interface MeansShiftTrace {
  type: 'economy.means.shift';
  tick: number;
  agentId: string;
  sourceTemplateId: string | null;   // null for founding
  band: UnifiedActionOutcome | null;
  amount: number;                    // after the poor-loss scale
  wealthBefore: number;
  wealthAfter: number;
  bandBefore: WealthTier;
  bandAfter: WealthTier;
  reason: MeansReason;
}

// S2 — on the existing board trace
interface BoardMeansFields {
  meansWant?: { wealth: number; poverty: number; greed: number; generosity: number; want: number; multiplier: number };
  // per entry: meansMultiplier?: number
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Decider has no `npcRole` | `DEFAULT_WEALTH` (20) |
| Home settlement missing or without prosperity | No home shift |
| `outcomeEffects` names a band the roll cannot produce | Content test fails; at runtime the band has no entry and nothing is written |
| `economy_shift` target cast key does not bind | No write, no change; `console.warn` once per template |
| `economy_shift` on a non-actor node (`means`) | No write |
| Exception inside the outcome table | Caught in `fireResolvedActionTriggers`; the resolution and summary proceed without it |
| `wealth` missing on a target at resolution (old save) | `readWealth` reads 0; `bankWealth` writes the result |
| Greed lean missing | Treated as 0 (no greed, no generosity) |
| `templatePaysActor` cache stale after a hot reload | Rebuilt on the next board (keyed on the template registry's version) |

## Blast Radius

`src/types/unifiedAction.ts` is wide (it carries the effect union and the template type). The change is additive: one optional template field, one optional variant field, one union member and one change kind. `unifiedActionResolution.ts` gains a call inside an existing hook. No signature changes.

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/unifiedAction.ts` | wide (≥100) | Additive: `outcomeEffects?`, `economy_shift`, `'economy'`. Exhaustive switches over the effect union and the change kind need a case; the typecheck ratchet finds them |
| `src/engine/unifiedActionResolution.ts` | wide | One added block in `fireResolvedActionTriggers`, wrapped in try/catch |

## Game Design Laws check

- **Law 20** (a mortal engages at about 50–65%) — untouched: the want weighs *what* is on the board, never the forecast or the window.
- **Law 22** (no outcome is dead air) — failure bands now cost Means where the table says so: a failed haggle leaves the mortal poorer, a story artifact the sheet shows.
- **Law 24** (failure never costs skill, never loops) — Means is not Reach; the poor-loss scale and the floor keep a poor mortal from a losing spiral.
- **Law 41** (one vocabulary of effects) — the outcome table is a list of ordinary aftermath effects, with one new kind every system can use; no money-only machinery.
- **Law 42** (simple frameworks) — paying work is derived from content, not a list of encounter types.
- **Law 43** (one concept per thing) — one store (`wealth`), one word (Means), one ladder.
- **Law 45** (never promise what the world will not do) — the aftermath change appears only when wealth actually moved.
- No random draw added (Laws 1–8 untouched).

## Three-pillar check

- [x] Engine pillar present (birth pass, outcome table seam, `economy_shift`, the want, founding cost switch)
- [x] Content pillar present (S2 Means rows, S3 world rows, source phrases, content test; attachments N/A with rationale)
- [x] UI pillar present (Means on every decider, the `economy` aftermath change, debug)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It serves *mechanics surface through prose, never numbers* (Means stays a word) and *the world does not wait for the god* (mortals now earn and lose on their own).
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan changes a rule of play: deciders are born with Means, money encounters pay or cost by band, and poverty and greed lean a mortal toward paying work.
- [x] `Docs/canon/rulebook.md` is updated in the build PRs: S1 adds two sentences to the holding-income paragraph (`:461`, "What a mortal holds yields…": a mortal is born with Means and encounters pay or cost it); S2 adds the want; the quick reference gains one line.

> Brainstorm companion: `Docs/plans/2026-10-15-thr-1936-mortal-wealth-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | ~20 named constants in one file; magnitudes are named steps; earning cells and costs are tables |
| 2. Inspectability | PASS | Two trace types plus board fields; `lastWealthReason`; debug accessor and tab |
| 3. Determinism | PASS | No new PRNG; the table keys on the existing roll's band; birth and want are pure |
| 4. Fail-soft | PASS | The table's block is caught inside the resolution hook; every missing input writes nothing |
| 5. Narrative over mechanical perfection | PASS | Means stays a word; the aftermath says "better off", never an amount |
| 6. Additive over destructive | PASS | New field, new effect kind, new change kind; step ops and holding income untouched; one master switch |
| 7. Performance budget | PASS with note | The table runs once per resolved encounter (a handful of effects). `templatePaysActor` is computed once per template registry version, not per board. S1: tick time in the 30-tick smoke and `test:heavy` stays within noise of main (the table is empty until S2). S2: budget < 2% added board time, measured the same way |

## Kill criteria

- If, with S2 on, paying work still wins under 5% of poor deciders' board decisions over 600 ticks on seed 42, the want needs a direct earning cell rather than a weight (the decision's own *would change the call*); reopen [THR-1865](https://linear.app/threadbare/issue/THR-1865) with the measurement.
- If the share of deciders at Destitute at t600 is more than 10 points above the share at t0, money encounters are draining the poor: lower `MEANS_STEP` for losses or raise `MEANS_POOR_LOSS_SCALE`'s damping before anything else.
- If the median decider's Means at t600 is Wealthy or above, gains outrun losses: rebalance the table's signs before shipping S3.
- If the engagement-window fit moves (mean forecast of engaged challenges shifts by more than 2 points), the want leaked into the odds: a bug, fix before merge.

## Done when

Predicates on seed 42 medium over 600 ticks unless stated.

**S1 (this ticket)**

- [ ] **Born with Means:** every autonomous decider has `wealth` at tick 0, and its value equals `ROLE_WEALTH[role] ?? 20` plus its home shift (fixture test + `economy.means.birth` traces).
- [ ] **Paid once at the roll:** a fixture template with an outcome table pays its actor exactly once per resolution at each band, whether the actor is threaded or not, and whichever reaction is chosen (test over the autonomous aftermath phase and the player path).
- [ ] **Converter passes it:** a simple encounter authored with `outcomeEffects` keeps it after conversion (test).
- [ ] **The poor lose less:** a loss on a mortal below 20 is halved; Means never goes below 0 (unit test).
- [ ] **Rollback:** with `MORTAL_MEANS_ENABLED = false`, a 300-tick run on seed 42 matches main's in every actor's `wealth`.
- [ ] Content test `outcomeEffects.test.ts` green, including the no-`update_node`-wealth rule (it reports today's offenders in `action-template-content.ts` as a known list and fails on any new one).
- [ ] **One seed row ships with S1:** `merchants_gambit` (`encounter-content.ts:672`, `trade`) gets its outcome table (critical success / success `MEANS_STEP`, success at cost 0, failure / critical failure −`MEANS_STEP`) and a `stakes` entry whose risk and `lost` name the loss, so the seam is reachable in a running build.
- [ ] In the browser, `?view=game&seeded&size=medium&spawn=<merchants_gambit's template id>&outcome=failure` on The First shows the stakes line's loss clause before the roll and, after it, the `economy` change ("Worse off" or "Fortunes turn down"); `await window.__DEBUG.getOutcomePinVerdict()` confirms the pinned band. Four-part browser evidence: 1920×1080 screenshot of the aftermath and the person sheet's Means row, console clean, `await window.__DEBUG.getMortalMeans(<id>)` non-null with a `band`, a UI-Laws line for Laws 1, 13/14, 17, 21, 33, 37, 56.

**S2 (filed)**

- [ ] The remaining ~39 Means rows authored, each costing template with a `stakes` risk clause that names the loss; content test green.
- [ ] Paying work wins at least 5% of poor deciders' board decisions (it is 17 of 1,651, about 1%, today).
- [ ] Destitute share at t600 within 10 points of t0; median decider Means at t600 between Getting by and Comfortable.
- [ ] Engagement-window fit unchanged (mean forecast of engaged challenges within 2 points of main).
- [ ] The cost switch: `scripts/means-comfort-pace.ts` reports the median ticks for a Getting-by decider to reach Comfortable; `MEANS_CELL_COST_ENABLED` is `true` in the PR only if that median is at most `MEANS_COMFORT_PACE_TARGET_TICKS` (120), and the PR body quotes the figure either way.

**S3 (filed)**

- [ ] The world rows written through the widened `economy_shift`; the purse rows through `applyTreasuryDelta`; the debt rows count as debts (`countDebts`).

**Every slice**

- [ ] Interface contracts, systems inventory, the wiki page, UL § Means and the rulebook lines updated in the slice that changes them.
- [ ] `npm run gate` green (code track: tests, typecheck ratchet, build, 30-tick CLI smoke, `test:heavy`); `npm run gate -- --final` last before push.
- [ ] Closing commit body and PR body carry the line-anchored closer for that slice's issue.

## Slices

| Slice | Ticket | Builds | Blocked by |
|---|---|---|---|
| S1 | this ticket | birth Means, the outcome table seam, `economy_shift` (`means`), the `economy` change, converter passthrough, content test, debug accessor, one seed row (`merchants_gambit`) | the faction purse build (priority ruling: kingdom first) |
| S2 | filed at handoff | the ~40 Means rows, the want on the board, the founding-cost switch and its measurement, Economy tab Means table | S1 |
| S3 | filed at handoff | the world rows (prosperity, unrest, stock, lane volume), the purse rows, the debt rows | S1, the faction purse build, encounter debts never count |
| Deferral | filed at handoff | place-as-holding, lane-bound writes, `sworn_to` from tribute, removing a debt, famine/glut draws, a faction's quest or bounty paying its finisher from the purse | — |

## Coordination block

**Suggested model:** opus — a resolution-path hook on a wide types file plus a decision-board term; the content rows (S2) are wide but mechanical.

**Blocked by:** [the faction purse build](https://linear.app/threadbare/issue/THR-1931) — Christian's priority ruling puts individual wealth after the kingdom economy, and the ticket asks for the build after the purse.

**Parallel-safe with:** [the crown](https://linear.app/threadbare/issue/THR-1932) (no shared files: it touches faction phases, oaths and the faction sheet); [the type and icons rollout](https://linear.app/threadbare/issue/THR-1879).

**Mutex with:** any build editing `fireResolvedActionTriggers` or the aftermath change kinds in `src/types/unifiedAction.ts` (the god's stake, [THR-1935](https://linear.app/threadbare/issue/THR-1935), reuses the `economy` kind — whichever lands second adopts the first's shape); [the Inspector](https://linear.app/threadbare/issue/THR-1876) S2a (it moves the person sheet's fields; whichever lands second moves the Means row); S2 with any build editing `decisionBoard.ts`; S3 with [hunger and unrest](https://linear.app/threadbare/issue/THR-1934) (both write unrest).

**Files to touch:** (slice S1; S2 adds `decisionBoard.ts`, `strategicActionLifecycle.ts`, `EconomyDebugTab.tsx`, `scripts/means-comfort-pace.ts` and the ~40 templates)
- Create: `src/engine/mortalMeans.ts`, `src/data/mortal-means-constants.ts`, `src/data/__tests__/outcomeEffects.test.ts`, `src/engine/__tests__/mortalMeans.test.ts`
- Edit: `src/types/unifiedAction.ts` (`outcomeEffects`, `economy_shift`, `'economy'`), `src/engine/unifiedActionResolution.ts` (`fireResolvedActionTriggers`), `src/engine/encounterAftermath.ts` (`economy_shift` case), `src/data/encounter-content.ts` (passthrough; `merchants_gambit`'s outcome table and stakes), `src/engine/gameInit.ts` (birth pass), `src/engine/npcGraduation.ts` (guard call), `src/engine/agentDetail.ts` (`describeWealthSource` keys), `src/components/Game/…/OverviewTab.tsx` (no change expected; verify), `src/components/Game/encounter-stage/adapters/buildAftermathConsequences.ts` (the `economy` case), tooltip registry (`ui.econ.means.change`), `src/types/trace.ts` (two trace types), `src/debug-bridge.ts` + `src/debug-bridge.d.ts`, `scripts/interface-contracts.ts`, `Docs/canon/systems-inventory.md`, `Docs/canon/rulebook.md` + quick reference, `Docs/ubiquitous-language/Agents.md` § Means, `Docs/plans/wiring-checklist.md` (a *Mortal Means* section), `public/wiki-manifest.json` + `encounters-manual-reference`

## Notes for the executor

- **Never write `wealth` through `update_node`.** It adds without clamping and a bare number replaces the value (`graphOpExecutor.ts:528-561`); the legacy `action-template-content.ts` wealth ops would set wealth to 0.15. The content test lists them; do not fix them here (they are unreachable, audit § 5).
- **Do not use step `onSuccess` / `onFailure` for money.** They are binary, and simple encounters drop them. The outcome table is the one place.
- **Do not read the forecast** in the want. Law 20 is a ruling.
- `FACTION_TREASURY_TRIBUTE_RATE` (`types/factionAction.ts:109`) stays unread: the [purse plan](2026-10-15-thr-1931-faction-purse.md) named this plan as its owner, and no row in the research table needs it. It belongs to the Deferral's *a faction's quest or bounty pays its finisher* item.
- Royal charters stay out ([the crown plan](2026-10-15-thr-1932-crown.md) § v1 asked to revisit with mortal wealth): no row in the table sells a charter, and nothing could honour one yet.

## Intent-judge verdicts

| Pass | Verdict | Findings | Disposition |
|---|---|---|---|
| 1 | **Escalate** (Reversible) | dim 1 GAP: S1/S2 could build before the faction purse, against the ticket's *"schedule its build after the faction purse"* and the priority ruling; dim 1 GAP: re-check answered for the town only, not the faction; dim 8 GAP: `templatePaysActor` cache owner unstated; dim 12 GAP: tooltip text and empty-name fallback not quoted | Ordering resolved by the ticket's own text, not a new question: **S1 is now blocked by the faction purse build**. Faction half answered (§ Resolution 1); cache owned by `SimulationRuntime`; tooltip and fallback quoted |
| 2 | **Revise** (Reversible) | dim 12 GAP: PC-2 needs the before-roll stakes line; PC-6 second surface unnamed | Stakes and result lines quoted from the THR-1727 formula; content rule on `stakes.risk` / `lost`; the Means tooltip named as the second surface |
| 3 | **Revise** (Reversible) | dim 12 GAP: the stakes sample used a lead the formula cannot render; dim 3 GAP: S1 browser evidence had no content to reach; dim 4 GAP: tier lines copied, `MEANS_UNAFFORDED_WANT` undefined | Sample uses the `chance` lead; S1 ships one seed row (`merchants_gambit`) reached by `?spawn` + `?outcome=failure`; tier lines imported from `wealth.ts`; the unafforded term defined in § Systems design 5 |
| 4 | **Allow** (Reversible) | all PASS except dim 3 GAP (renderer unnamed, birth-pass file); advisories: the floor case, re-check summary for Christian | Taken: `buildAftermathConsequences.ts` named and wired; `initializeGameState` in `gameInit.ts`; floor row added; the re-check answer goes to Christian in the lane report |

## Forked-audit verdicts

Run on the first draft, 2026-10-15 (design lane). The intent-judge revisions change ordering, quoted text and two constants; none touches an audited axis's findings except where noted.

### NFP audit

**PASS-with-notes.** Tunability PASS-with-note: `HARVEST_BAND_SCALE` (S3) was missing from the constants table — *fixed: added with its base.* Inspectability, Determinism, Fail-soft, Narrative PASS. Additive PASS-with-note: the birth pass changes every decider's tick-0 `wealth` from undefined, covered by the master switch. Performance PASS-with-note: S1 had no measurement — *fixed: S1 checks tick time in the 30-tick smoke and `test:heavy`.*

### Three-pillar audit

**PASS.** Engine, Content and UI present and substantive; no missing required sections; the Wiring section maps every module; the Substrate inventory extends the Mortal Economy & Prosperity subsystem and activates the dormant role wealth, with no green-field duplication.

### Vision audit

**PASS-with-notes.** No contradictions. Confirms non-negotiables #2 (story over mechanical perfection) and #3 (prose, never numbers: words only, no amount); extends the north star's *a mortal is a person, not a unit*. Note on design tension (Malazan vs 4X): S2's want and ~40 Means rows add a quiet spreadsheet pull; the plan holds it with word-only display, no chronicle line and kill criteria. Carried into § Playtest signal's watch item.
