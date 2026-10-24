> **title:** Debts in the money encounters — THR-2023
> **linear_issue:** THR-2023
> **author:** Claude Code (design lane, run 2026-10-24c, unattended)
> **created:** 2026-10-24
> **three_pillars:** Engine done · Content done · UI done

# Debts in the money encounters — THR-2023

*A debt the game can make but never pay off is a stakes line that lies: "collect the overdue debt" collects nothing, and a loan has no one to owe it.*

## Why this is load-bearing

Encounter debts became real this month: [encounter debts count](https://linear.app/threadbare/issue/THR-1920) made them make a mortal Debt-Laden, and [agreement expiry](https://linear.app/threadbare/issue/THR-1999) made them end when their term runs out. But a debt still has only two ways to end, its term or its holder's death, and only two scenes ever make one with a named lender (the cathedral loan's *Stand surety*, the tithe scenes' failures). The money encounters that are *about* debt do not touch one. **Debt Collection** says *"collect the overdue debt in full"* and on a good roll pays the collector out of nowhere; on a bad roll its stakes promise *"the debt go uncollectable"* and nothing happens (Law 22, dead air; Law 45, a promise the world does not keep). **The Loan** has no borrower. The **debt arbitration**'s *"left with the master's note instead of coin"* writes no note. The **toll-gate writ**'s *"{actor}'s name is written in the toll book"* writes nothing. The **cathedral loan** moves no coin on any band.

This plan closes those four rows of [Money encounters, later rows](https://linear.app/threadbare/issue/THR-1954), a deferral of the shipped [mortal wealth plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-15-thr-1936-mortal-wealth.md) (§ *Not in this plan*: "removing a debt"). It adds one way for a debt to end early (it is paid, or it is written off), gives The Loan a borrower, writes the note and the toll-book debt where the prose already says so, and decides which way the cathedral's coin moves. It unblocks a small loop that already half exists: a mortal lends at the counting house, and later collects there.

**Lane decisions under delegation (process.md rule 4) — veto in chat.** This plan was authored unattended. Four calls in it were made by the lane, not by Christian, and are marked **[lane]** where used: (1) a debt settled early is the *oldest* live debt owed to the collector; (2) the cathedral's treasury is carried by the dean's Means, not a temple faction purse; (3) the lender in The Loan is the acting mortal; (4) the critical-failure note in the debt arbitration writes no debt. None draws on an earlier lane decision, so there is no veto-window hold on the build.

## Substrate inventory

All measured on `main` @ `94e9b402` (includes the THR-1999 merge).

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| **Attachments, Items & Possessions** — agreements as `relates_to` edges written by `instantiateAgreementReward` (`src/engine/rewardPool.ts:1260`; source = debtor, target = creditor, `:1274–1276`), read by `readAgreement` (`src/engine/agreementShape.ts:75`) | 🟢 ACTIVE | **extends** — a second remover beside expiry; no new edge type |
| Agreement expiry, Phase 6.625c (`expireAgreements`, `src/engine/agreementExpiry.ts:37`; orchestrator `:3888`) | 🟢 ACTIVE | **preserved** — settle reuses its removal shape and trace style; expiry itself unchanged |
| Economic traits — `countDebts` (`src/engine/phaseEconomicTraits.ts:122`) → `trait.condition.debt-laden` at `ECON_TRAIT_DEBT_LADEN_MIN_DEBTS = 2`, removed at 0 (`:301–314`) | 🟢 ACTIVE | **activates** its "all debts cleared" exit for a cause other than expiry; doc comment at `:118` refreshed |
| Encounter aftermath effects — `attachment_grant` handler (`src/engine/encounterAftermath.ts:2876`), band tables via `applyOutcomeEffectsTable` (`src/engine/unifiedActionResolution.ts:3296`), scene sentinels (`bindAftermathSceneTargets`, `encounterAftermath.ts:930`; field table `src/engine/sceneSentinels.ts:108`) | 🟢 ACTIVE | **extends** — one new effect kind `debt_settle`, one new sentinel field `creditorAgentId` |
| Mortal Means — `economy_shift quantity:'means'` (`types/unifiedAction.ts:576–600`; applier `encounterAftermath.ts:1931–1971` via `applyMeansShift`, `src/engine/mortalMeans.ts:226`) | 🟢 ACTIVE | **extends** — new rows on four templates; the debtor's repayment uses `applyMeansShift` |
| Means want — `templatePaysActorOnSuccess` (`mortalMeans.ts:156`, positive actor-targeted `means` on `success` only) | 🟢 ACTIVE | **preserved** — The Loan's success costs the lender, so it correctly earns no lean |
| Person sheet agreement rows — `agentAttachments.ts:415–454` (both directions, `subcategory 'debt'` at `:435`), tile words `personRows.ts:309` (`Bound to ${counterpartyName}`) | 🟢 ACTIVE | **extends** — a direction word |

**The other debtor → creditor shape: favours.** The Agreement undertaking kind (`src/data/undertaking-objects.ts:2718–2759`) covers `owes_favor` (a favour, *"a debt one party owes another"*, `:2722`) and `knows_secret_of` (a mark). A favour already ends early: its creditor redeems it (`use`, `:2743`) or forgives it (`destroy`, `:2753`). The player reads a favour as *"Is owed a favour by {name}"* (`src/data/subject-sheet-words.ts:106`) and *"A favour owed"* (`:288–289`); a debt's type word is *"A debt"* (`AGREEMENT_TYPE_WORDS`, same file).

**Why `debt_settle` acts on `relates_to` debts and not on favours.** A favour is leverage a creditor *calls in* for help (rulebook: *"someone on the hex who owes the mortal a favour stands beside them, and the debt is paid by it"*), and the Agreement verbs already end it. A debt is coin: it is what Debt-Laden counts (`countDebts` reads `relates_to` only), what `agreement.debt.minor` writes, and what the money encounters' outcome rows name. Nothing ends it early. So `debt_settle` matches `agreementType === 'debt'` on `relates_to` edges only and never touches `owes_favor`; the two shapes coexist as they do today. This plan adds no third shape.

**What does not exist (searched):** no effect or function settles, repays, forgives or revokes a `relates_to` debt before its term — `repay|settleDebt|forgive|clearDebt|debt_cleared|attachment_revoke|agreement_remove|revoke_agreement|removeAgreement|break_agreement|defaulted` matches only prose and unrelated identifiers. `action.gold.break-agreement` (`src/data/action-template-content.ts:362`) removes `party_to` edges (`:372`), not agreements. The only incidental removers are slot overflow disposal (`phaseSlotCaps.ts:75–80`, then `phaseDisposalTimeout` `:174`, spotlight actors only) and death (`agentLifecycle.ts:303–304`). `agreement.debt.minor` (`src/data/agreement-reward-catalog.ts:45`, `ticksRemaining: 48`) is the only debt template.

**The five templates today:**

| Template | File | Cast | Debt / Means today |
|---|---|---|---|
| `encounter.debt_collection` | `src/data/encounter-content.ts:6005` | none | `means +MEANS_STEP` on critical_success and success (`:6014–6015`); nothing on failure |
| `encounter.the_loan` | `encounter-content.ts:5946` | none | none; reward pool only (`:5991`, `:5998`) |
| `encounter.town.debt_arbitration` | `src/data/encounters/debt-arbitration.ts:102` | `master` (house master), `claimant` (`:467`) | `means +MEANS_STEP` on the good bands of both variants (`:500–503`, `:847–850`); the note is prose only (`:353–354`, `:415–416`, `:935`) |
| `encounter.town.toll_gate_writ` | `src/data/encounters/toll-gate-writ.ts:24` | `tollmaster`, `traveller` (`:433`) | none; the toll book is prose only (`:990`) |
| `encounter.town.cathedral_loan` | `src/data/encounters/cathedral-loan.ts:76` | `dean` (priest), `factor` (lenders' factor) (`:308`) | no `outcomeEffects`; *Stand surety* grants `agreement.debt.minor` `$actor` → `$cast:factor` (`:558–567`) |

**Precedent for a cast on a simple encounter:** `encounter.sharpen_blades` declares a one-actor `supportBundle` with `delivery: 'lazy-materialize-on-trigger'` (`encounter-content.ts:8174`), and simple templates carry `supportBundle` through the converter (`:225`, `:411`).

## Interface impact

| Contract | Change | Note |
|---|---|---|
| Encounter aftermath → agreement edges (write: grant) | **preserve** | `attachment_grant` unchanged; new authored rows only |
| Encounter aftermath → agreement edges (write: **remove**) | **add** | `debt_settle` removes one `relates_to` agreement edge. Production readers of the removal: `countDebts` (Debt-Laden), `agentAttachments` (sheet), `expireAgreements` (skips what is gone). |
| Encounter aftermath → mortal Means (debtor repays) | **extend** | through `applyMeansShift`, same as every Means write; `economy.means.shift` trace |
| Agreement expiry → agreement edges | **preserve** | |
| Sheet ← agreement edges | **extend** | reads edge direction to say *Owes* / *Is owed by* |

`Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` gain the remove row in the build PR (the two-file edit).

## Engine pillar

### Systems design

**1. A debt can be settled before its term — `debt_settle`.** A new aftermath effect kind, one function behind it:

```ts
// types/unifiedAction.ts — added to the EncounterAftermathReactionEffect union (additive)
export interface DebtSettleEffect {
  readonly kind: 'debt_settle';
  /** Who is owed. Sentinel-bound; default '$actor'. */
  readonly creditorAgentId?: string;
  /** Optional: settle only a debt this agent owes. Unset = any debtor. */
  readonly debtorAgentId?: string;
  /** 'paid' — the debtor pays (Means falls); 'written_off' — the debt is struck, no coin moves. */
  readonly settlement: 'paid' | 'written_off';
}
```

New module `src/engine/debtSettle.ts`:

```ts
export function settleDebt(
  graph: WorldGraph,
  args: { creditorId: string; debtorId?: string; settlement: 'paid' | 'written_off'; tick: number },
): DebtSettleResult; // { settled: false, reason } | { settled: true, edgeId, debtorId, creditorId, meansDelta }
```

- **Which debt [lane]:** the live debts owed to the creditor are the `relates_to` edges with `target === creditorId`, `readAgreement(...).type === 'debt'` and `!agreementLapsed(agreement, tick)` (the same test `countDebts` uses, flat shape — the nested fixture shape counts either way and is matched on either end, as `countDebts` does). If `debtorId` is set, only edges whose `source === debtorId`. Pick the **oldest** by `acquiredTick`, ties by edge id ascending. Deterministic; no PRNG.
- **Paid:** remove the edge, then `applyMeansShift(debtor.properties, -DEBT_REPAY_MEANS, 'debt_repaid')` (gated by `MORTAL_MEANS_ENABLED` inside the applier; a poor debtor pays half, `MEANS_POOR_LOSS_SCALE`, so no spiral). The creditor's gain stays where it is authored, in the template's own `means` row, so the coin is counted once.
- **Written off:** remove the edge; no Means moves.
- **No debt owed:** no edge removed, a `debt_settle_noop` trace, and the template's other effects still apply (Debt Collection still pays a collector working for someone else's house — today's behaviour).
- Removal reuses `graph.removeEdge` and the `touchWorld()` discipline already used by expiry; no change to `expireAgreements`.

The handler is a new `case 'debt_settle'` in the aftermath effect switch beside `attachment_grant` (`encounterAftermath.ts:2876`), behind `ENCOUNTER_DEBT_SETTLE_ENABLED`.

**2. A sentinel field for the creditor.** `SCENE_SENTINEL_FIELDS` (`sceneSentinels.ts:108`) gains `creditorAgentId: 'agent'`. `debtorAgentId: 'agent'` is already there.

**3. The rest is authored rows** on existing effect kinds (`attachment_grant`, `economy_shift`, `bond_change`) — § Content pillar.

### Graph nodes / edges

No new node or edge type. `relates_to` agreement edges gain a second remover. No new property.

### Tick phases

None new. `debt_settle` runs inside encounter aftermath resolution like every band effect. Debt-Laden is re-read by the economic-traits phase on its next pass and drops at zero debts (existing `:312–314`). Expiry (6.625c) skips an edge that is already gone.

### Resolution logic

None changed. The bands come from the existing roll; the effects are band rows.

### PRNG callouts

None. The debt pick is a deterministic sort (Law 5: no random draw is added).

## Content pillar

### Encounter templates

All amounts use the named steps (`MEANS_STEP_SMALL` 3, `MEANS_STEP` 6, `MEANS_STEP_BIG` 12; `src/data/mortal-means-constants.ts:28–32`), so the content test on named steps holds.

**A. Debt Collection** (`encounter.debt_collection`) — the actor collects what is owed *to them*.

| Band | Effects (added → existing) |
|---|---|
| critical_success | `debt_settle { creditorAgentId: '$actor', settlement: 'paid' }` + existing `means +MEANS_STEP` |
| success | same as critical_success |
| success_at_cost | `debt_settle { creditorAgentId: '$actor', settlement: 'paid' }` + `means +MEANS_STEP_SMALL` (paid short) |
| failure | `debt_settle { creditorAgentId: '$actor', settlement: 'written_off' }` |
| critical_failure | `debt_settle { creditorAgentId: '$actor', settlement: 'written_off' }` + `means -MEANS_STEP_SMALL` (the cost of chasing) |

The stakes line already says this (*"see the debtor skip town and the debt go uncollectable"*); now it is true. A mortal owed nothing still gets today's pay on success and loses only the small step on a critical failure.

**B. The Loan** (`encounter.the_loan`) — **[lane]** the acting mortal is the lender (the template's gold reach, the counting house, and its own narrative, *"A cautious lender and a desperate debtor"*, read the actor as the cautious lender). It gains one cast:

```ts
supportBundle: [{
  kind: 'actor', key: 'borrower',
  delivery: 'lazy-materialize-on-trigger', persistence: 'must-persist',
  reuseNpcRoles: ['laborer', 'civilian'], supportRole: 'loan_borrower',
  spawnNpcRole: 'laborer', spawnName: 'Wenna Tull',
}],
```

`lazy-materialize-on-trigger` because the debt is *about* the borrower (the THR-1165 lesson recorded on `sharpen_blades`: a bind-only default let a debt land on scenery).

| Band | Effects |
|---|---|
| critical_success / success | `attachment_grant { templateId: 'agreement.debt.minor', targetAgentId: '$cast:borrower', counterpartyId: '$actor' }` + `means -LOAN_PRINCIPAL_MEANS` on `$actor` (coin lent) + `means +LOAN_PRINCIPAL_MEANS` on `$cast:borrower` |
| success_at_cost | the same three |
| failure | the same three + `bond_change { withAgentId: '$cast:borrower', sentimentDelta: LOAN_RESENTMENT_SENTIMENT }` (the onFailure prose: *"the terms breed resentment before the ink is dry"*) |
| critical_failure | the same as failure with `sentimentDelta: LOAN_RESENTMENT_SENTIMENT_CRIT` |

The rows reference the constants by name. `LOAN_PRINCIPAL_MEANS` is defined as `= MEANS_STEP`, so its value (6) is a named step and the existing content test (every `means` amount is in `MEANS_NAMED_STEPS`, `mortal-means-constants.ts:35`) passes unchanged; retuning it to a non-step value means adding that value to `MEANS_NAMED_STEPS` in the same edit. The sentiment constants are not Means and that test does not read them.

The lender is out of pocket until the debt is collected; Debt Collection at the same counting house pays them back. A loan never collected costs the lender `LOAN_PRINCIPAL_MEANS` — the risk of lending.

**C. Debt arbitration — the master's note** (`encounter.town.debt_arbitration`, the negative variant, the *Collect the third* step whose afterimages are `:353–354`). On **failure** only:

`attachment_grant { templateId: 'agreement.debt.minor', targetAgentId: '$cast:master', counterpartyId: '$actor' }` — the house master owes the mortal. The mortal can later collect it (A).

**[lane]** The **critical_failure** band writes no note debt: its afterimage is *"a note on a house that has stopped paying its notes"*, a note worth nothing. The other path's *Collect the third* step (afterimages `:415–416`) gets exactly the same rows: its **failure** band writes the note debt `$cast:master` → `$actor`, its **critical_failure** band writes none. The failure aftermath card (`:935`, *"holds the master's note for the third"*) gains the chip in § UI.

**D. Toll-gate writ — the toll book** (`encounter.town.toll_gate_writ`, the success_at_cost band whose overview is `:990`). Add:

`attachment_grant { templateId: 'agreement.debt.minor', targetAgentId: '$actor', counterpartyId: '$cast:tollmaster' }` — the mortal's name stands beside the family's writ, and the mortal now owes the toll-master for the family's passage. The debt is unconditional (nothing models whether the writ holds), and the chip says so.

**E. The cathedral loan — which way the coin moves** (`encounter.town.cathedral_loan`). **[lane]** The chapter's treasury is carried by the **dean's Means** (`$cast:dean`), and the lenders' by the **factor's** (`$cast:factor`). The scene sets the chapter's debt to the lenders; the bands say who ends up with the silver. A new `outcomeEffects` table:

| Band | Afterimage today | Effects |
|---|---|---|
| critical_success | *"took the tithes for the whole debt and gave back every piece of plate"* (`:192`), *"A charge the lenders had added twice came to light"* (`:292`) | `means -MEANS_STEP` on `$cast:factor` (the struck charge), `means +MEANS_STEP` on `$cast:dean` |
| success | the plate kept, tithes pledged | `attachment_grant { agreement.debt.minor, targetAgentId: '$cast:dean', counterpartyId: '$cast:factor' }` (the chapter now owes in tithes, not plate) |
| success_at_cost | the plate kept, tarnished | the same debt as success (the existing *Stand surety* reaction still adds the mortal's own) |
| failure | *"The lenders took the cathedral's altar plate"* (`:334`) | `means +MEANS_STEP` on `$cast:factor`, `means -MEANS_STEP` on `$cast:dean` |
| critical_failure | *"took every last piece"* (`:172`) | `means +MEANS_STEP_BIG` on `$cast:factor`, `means -MEANS_STEP_BIG` on `$cast:dean` |

No band pays the acting mortal, so the Means want is untouched (`templatePaysActorOnSuccess` reads actor-targeted rows only, `mortalMeans.ts:163`).

### Prose tables

No new prose tables. Every effect above sits under prose that already says it, with **one prose edit**. Debt Collection's second step pays on success (*"Payment arrives inside four days, in full, delivered by a clerk who will not meet {their} eye."*, `encounter-content.ts` ~`:6054`). Its failure today says the debtor *left*: *"The debtor is gone before the notice takes effect — house emptied, counting-house lease signed over to a cousin."* (~`:6059`), and its stakes risk line says *"see the debtor skip town"*. A written-off debtor is a mortal who stays on the map, so both change to say the coin is hidden, not the person gone:
- failure narrative → *"The debtor moves faster than the notice — strongbox emptied, counting-house lease signed over to a cousin. {actor} holds a contract that is entirely valid and entirely uncollectable."*
- stakes `risk` → *"see the debtor hide the coin and the debt go uncollectable"*; stakes `lost` → *"saw the debtor hide the coin and the debt go uncollectable"*. The Loan's success says *"the debt is recorded as what it is: an obligation freely made"* and its failure *"The borrower signs, but the terms breed resentment before the ink is dry."*

### Attachment content

None new. `agreement.debt.minor` serves every row (one debt template, term 48 ticks). A distinct note or toll-book template is not added: the sheet names the counterparty, and Law 43 asks for one concept.

### Data tables

New constants in `src/data/mortal-means-constants.ts` (§ Constants). No `world-model.json` change.

## UI pillar

*Screenshot tool: Playwright (DOM) — every surface here is DOM (the person sheet, the aftermath card). No WebGL.*

### Player-facing display

1. **The sheet says which way a debt runs.** `agentAttachments.ts` already lists an agreement from both ends; it gains `direction: 'owes' | 'owed'` (source = the sheet's mortal → `owes`). `personRows.ts:309` reads it for debts:
   - debtor's sheet: **"Owes Odile Marrow"**
   - creditor's sheet: **"Is owed by Wenna Tull"**
   - a non-debt agreement keeps **"Bound to {name}"**.
   The remaining term (THR-1999) stays as it is. The ascendant bar's vows row (`HooksBlock.tsx:311–345`) takes the same two phrases for debts.
2. **Aftermath chips** on the three branching scenes, each a `shell_state` change backed by the effect in the same band (UI Law 56), following the `writ.sent.cost.favour` precedent (`toll-gate-writ.ts`, the change after `:990`):
   - debt arbitration failure — title **"A note held"**, detail **"{cast:master} owes {actor} the third."**
   - toll-gate writ success_at_cost — title **"In the toll book"**, detail **"{actor}'s name stands in the toll book; {actor} owes {cast:tollmaster}."**
   - cathedral loan success / success_at_cost — title **"The chapter's debt"**, detail **"The chapter owes {cast:factor}, in tithes now, not plate."**; failure / critical_failure — title **"The plate taken"**, detail **"{cast:factor} carried the chapter's silver away."**
3. **The Loan and Debt Collection** are simple encounters with no aftermath card; their result reads in the step narrative the player already sees (quoted in § Prose tables and below) and on the sheets (the borrower's new *Owes* row, a cleared row, Debt-Laden lifting). There is no player-facing Means receipt for these scenes: no component or view reads `economy.means.shift` (grep of `src/components` and `src/engine/views`, 2026-10-24), and this plan does not add one.

UI Laws engaged: **1** (one surface per fact — the debt lives on the sheet), **13/14** (words, never numerals: no sums shown), **17**, **21**, **33**, **37**, **56** (every chip above is backed by a write in its own band).

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Person sheet, agreement row (debtor) | "Owes Odile Marrow" | PC-1, PC-6 | Row tooltip: *"A debt. It ends when it is paid, written off, or its term runs out."* The remaining term (THR-1999) sits beside it. |
| Person sheet, agreement row (creditor) | "Is owed by Wenna Tull" | PC-1, PC-6 | The same tooltip; the mirror of the borrower's row, so the two sheets no longer say the same "Bound to" from both ends |
| Ascendant bar vows row (`HooksBlock.tsx:311–345`, today `${typeWord} with ${counterpartyName}`) | "Owes Odile Marrow" / "Is owed by Wenna Tull" for a debt | PC-6 | Word for word the sheet's text, so one debt reads one way on both surfaces |
| Debt Collection, step 2 success (existing narrative, now true) | "Maren files the notice and takes no further step. Payment arrives inside four days, in full, delivered by a clerk who will not meet her eye." On **Maren's own sheet** (the mortal the player was watching), the row *Is owed by Wenna Tull* is gone. | PC-2, PC-8 | Stakes before: *"collect the overdue debt in full"*; the result says it was paid, and the collector's own row naming the debtor is gone |
| Debt Collection, step 2 failure (narrative reworded, § Prose tables) | "The debtor moves faster than the notice — strongbox emptied, counting-house lease signed over to a cousin. Maren holds a contract that is entirely valid and entirely uncollectable." Maren's *Is owed by Wenna Tull* row is gone, unpaid; Wenna Tull is still in town. | PC-2, PC-6 | Stakes before: *"see the debtor hide the coin and the debt go uncollectable"* — the reworded prose and stakes no longer say the debtor left, so they match a debtor still on the map |
| Debt Collection, no debt owed | The same narratives; no sheet row changes. | PC-2 | Today's behaviour: a collector working another house's book. Nothing claims a named debt was settled. |
| The Loan success (existing narrative) | "The agreement is struck. Both parties sign without flinching, and the debt is recorded as what it is: an obligation freely made." Then Wenna Tull's sheet shows *Owes Maren*. | PC-2, PC-8 | Stakes before: *"set fair terms on a loan to a desperate borrower"*; the new row is the debt the line names |
| The Loan failure (existing narrative) | "Maren's judgment slips. The borrower signs, but the terms breed resentment before the ink is dry." | PC-2 | The debt is still made; the resentment is the cost |
| Debt arbitration failure chip | "A note held" — "Aurel Vance owes Maren the third." | PC-3 | A named debt, both names filled |
| Toll-gate writ success_at_cost chip | "In the toll book" — "Maren's name stands in the toll book; Maren owes Reyne Holloway." | PC-3, PC-6 | Why the mortal now carries a debt; the chip's "owes Reyne Holloway" and the sheet's *Owes Reyne Holloway* say the same unconditional debt |
| Cathedral loan success chip | "The chapter's debt" — "The chapter owes Odile Marrow, in tithes now, not plate." | PC-2, PC-3 | Follows the stakes *"kept the cathedral's altar plate out of the lenders' hands"* (`cathedral-loan.ts:333`) |
| Cathedral loan failure chip | "The plate taken" — "Odile Marrow carried the chapter's silver away." | PC-2, PC-3 | Follows the stakes *"The lenders took the cathedral's altar plate"* (`:334`) |

What each class owes ([`Docs/ops/player-complaint-classes.md`](../ops/player-complaint-classes.md)): **PC-1** — the words and where they are explained: the row text and its tooltip, quoted above. **PC-2** — the stakes line before and the chip after, quoted above for the cathedral; the other templates' stakes already name the debt. **PC-3** — rendered samples with real names (the spawn names `Aurel Vance`, `Reyne Holloway`, `Odile Marrow`, plus a sample borrower and actor); when a cast slot is empty the grant refuses (`counterparty_unresolved`), and the chip must not render without its write — the executor verifies the shell-state chip is hidden when its band's effect did not land, and hides it if not (UI Law 56). **PC-6** — the other surface showing a debt is the ascendant bar's vows row; it takes the same words. Favours are shown by the notable line (*"Is owed a favour by {name}"*, `subject-sheet-words.ts:106`) and the agreement type word (*"A favour owed"*); debt and favour words are chosen together: the same *"Is owed … by"* frame, with *a favour* named and a debt left as the plain verb, so a reader can tell a favour from coin. The favour words do not change. **PC-8** — the two simple scenes' results are their existing step narratives (quoted above), now backed by a write.

### Playtest signal

A tester who opens a mortal's sheet after a loan or a note can say who owes whom.

### Event notifications

No new toast or chronicle line. The bands' afterimages already narrate each outcome; the sheet carries the state.

### Debug inspection (DebugPanel)

- Traces `agreement_settled` and `debt_settle_noop` (§ Tracing), registered in `types/trace.ts` beside `agreement_expired`, so `window.__DEBUG.getTraces()` shows them (with tracing enabled).
- No new `__DEBUG` accessor. The Done-when asserts through the existing graph read in the CLI (`eval`) and `getTraces`.

### Visual presence (HexMapV2)

N/A — a debt is a relationship between two people; nothing on the map changes.

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `src/engine/debtSettle.ts` (new) | encounter aftermath (inside resolution) | — | `relates_to` agreement edges; debtor `wealth` | `agreement_settled`, `debt_settle_noop`, `economy.means.shift` | `getTraces` |
| `encounterAftermath.ts` `case 'debt_settle'` | encounter aftermath | aftermath card (chips, branching only) | — | as above | `getTraces` |
| `sceneSentinels.ts` `creditorAgentId` | — | — | — | existing binder refusal traces | — |
| `agentAttachments.ts` `direction` + `personRows.ts:309` words | — | person sheet (Inspector) | reads edge direction | — | DOM |
| Template rows (A–E) | — | aftermath card / sheet | — | existing | — |

Checked against `Docs/plans/wiring-checklist.md`: no new orchestrator phase; the new module is called from the aftermath switch (reachable on every encounter resolution); the read site of the new write is `countDebts` and the sheet (production). No prose pipeline change (`enrichProse` untouched). No player control added.

**Docs owed by the build PR:** `Docs/canon/interface-map.md` + `scripts/interface-contracts.ts` (the remove row); the Design Reference Wiki page whose `sources` match `agreementExpiry.ts` / `encounterAftermath.ts`; the systemic wiring guide (a new content-facing effect kind, `debt_settle`); `Docs/canon/rulebook.md` (§ Rulebook impact).

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `ENCOUNTER_DEBT_SETTLE_ENABLED` | `true` | Kill switch for `debt_settle` (off = the effect no-ops with `debt_settle_noop reason:'disabled'`) |
| `DEBT_REPAY_MEANS` | `MEANS_STEP` (6) | Means a debtor pays when a debt is settled `paid` (scaled by `MEANS_POOR_LOSS_SCALE` below Getting by) |
| `LOAN_PRINCIPAL_MEANS` | `MEANS_STEP` (6) | Means the lender lays out and the borrower receives in The Loan; kept equal to `DEBT_REPAY_MEANS` so a collected loan nets the lender zero |
| `LOAN_RESENTMENT_SENTIMENT` | `-0.1` | The borrower's sentiment toward the lender on The Loan's failure |
| `LOAN_RESENTMENT_SENTIMENT_CRIT` | `-0.2` | The same on critical failure |

The template rows otherwise use the existing named steps. The pick order (oldest first) is a named exported comparator, `compareDebtsOldestFirst`, not a magic literal.

## Tracing

```ts
// agreement_settled — emitted when debt_settle removes a debt edge
interface AgreementSettledTrace {
  type: 'agreement_settled';
  tick: number;
  edgeId: string;
  debtorId: string;
  creditorId: string;
  settlement: 'paid' | 'written_off';
  acquiredTick: number;
  meansDelta: number;      // the debtor's actual change (0 when written off or Means is off)
  templateId?: string;     // the encounter that settled it
  summary: string;         // "debt between {debtor} and {creditor} settled (paid)"
}

// debt_settle_noop — emitted when debt_settle finds nothing to settle
interface DebtSettleNoopTrace {
  type: 'debt_settle_noop';
  tick: number;
  creditorId: string | null;
  debtorId?: string;
  reason: 'no_debt_owed' | 'creditor_unbound' | 'disabled';
  templateId?: string;
}
```

## Fail-soft table

| Failure case | Fallback |
|---|---|
| `creditorAgentId` unbound (still `$…`) or not a node | No-op, `debt_settle_noop reason:'creditor_unbound'`; the band's other effects apply |
| No live debt owed to the creditor | No-op, `reason:'no_debt_owed'`; other effects apply |
| Debtor node missing at settle time (died the same tick) | Remove the edge, skip the Means write, `meansDelta: 0` |
| `MORTAL_MEANS_ENABLED` off | Edge still removed on `paid`; `meansDelta: 0` |
| `ENCOUNTER_DEBT_SETTLE_ENABLED` off | No-op, `reason:'disabled'` |
| A nested-shape fixture debt | Matched exactly as `countDebts` matches it; removed the same way |
| `$cast:borrower` / `$cast:master` / `$cast:tollmaster` / `$cast:dean` / `$cast:factor` unbound | The existing `attachment_grant` (`counterparty_unresolved`) and Means (`aftermath_target_invalid`) refusals; nothing throws |
| The debtor's agreement slots are full (cap 4) | Existing slot-overflow behaviour; unchanged |

## Blast Radius

| File | Importer count | Cascade-risk note |
|---|---|---|
| `src/types/unifiedAction.ts` | 685 importers (grep of import specifiers, 2026-10-24) | Additive union member `DebtSettleEffect`. Exhaustive `switch`es over the effect kind must gain a case or a default; `npm run check:typecheck` finds them. |
| `src/types/trace.ts` | 144 importers | Two trace categories registered in the three places `agreement_expired` is (`:553`, `:1215`, `:7679`). Additive. |

`encounterAftermath.ts` (68), `agentAttachments.ts` (10), `sceneSentinels.ts` (7), `personRows.ts` (1) are below the bar.

## Game Design Laws check

- **22 (no dead air):** Debt Collection's failure bands now write off a debt; The Loan's failure leaves a resentful borrower. Conforms.
- **24 (failure never costs skill):** failure costs coin and sentiment only. Conforms.
- **41 (one vocabulary of effects):** `debt_settle` is a member of the shared aftermath effect union, usable by any encounter, card or reaction — not a debt-only subsystem. Conforms.
- **42 (simple frameworks):** one generic remover, one sentinel field; everything else is authored rows. Conforms.
- **43 (one concept):** every debt is the one `agreement.debt.minor`; no note or toll-book concept. Two debtor → creditor shapes already exist (favour and debt); this plan adds none, keeps them apart in code, and words them in parallel for the player: *"Is owed a favour by {name}"* beside *"Is owed by {name}"* / *"Owes {name}"*. The UL entry Agreement names only favour and mark, so the design lane filed [UL-proposal: Debt](https://linear.app/threadbare/issue/THR-2025) seating **debt** as the Agreement's third class (the `relates_to` reward agreement with `agreementType: 'debt'`) with the player words *Owes* / *Is owed by*. Conforms once that proposal lands; until then the UL gap is named here, not hidden.
- **45 [P] (no promise the world will not do):** fixes four stakes and afterimages that promised a debt or its loss. Conforms.
- **1 / 5:** no random draw added.

## Three-pillar check

- [x] Engine pillar present — `debt_settle`, `settleDebt`, the sentinel field
- [x] Content pillar present — rows on five templates, one cast, constants
- [x] UI pillar present — sheet direction words, four chips, Playwright DOM
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It is mortal-side economy plumbing; the god's hand is untouched (Law 9), and no card or ending is chosen by the player (Law 10).
- [x] No Vision edit needed.

## Rulebook impact

- [ ] This plan does not change a rule of play — **it does**: a debt can now end before its term.
- [x] The rulebook edit is in scope: **`Docs/canon/rulebook.md` is updated in the build PR**, appended to the paragraph *"Money encounters move the town too"*, with the `[IMPL — THR-2023 …]` tag the build adds (the paragraph describes shipped behaviour, so it lands with the code):

> A debt can end before its term. A mortal who collects what they are owed is paid, and the debtor is the poorer for it; a collection gone wrong writes the debt off. A loan leaves the borrower owing the lender, a banking house that cannot pay leaves a note it owes, and standing for a traveller at the toll gate puts the mortal's name in the toll book.

> Brainstorm companion: `Docs/plans/2026-10-24-thr-2023-encounter-debts-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Five named constants; template rows use the named Means steps; the pick order is a named comparator |
| 2. Inspectability | PASS | `agreement_settled` and `debt_settle_noop` carry debtor, creditor, settlement, edge and the Means delta |
| 3. Determinism | PASS | No PRNG; oldest-first with an id tie-break |
| 4. Fail-soft | PASS | Every unbound or missing case no-ops with a trace (fail-soft table) |
| 5. Narrative over mechanical perfection | PASS with note | The cathedral's treasury rides the dean's Means rather than a faction purse: the people on stage carry the coin, which reads truer than an off-stage purse no binding can reach |
| 6. Additive over destructive | PASS | New effect kind, new module, new sentinel field, new sheet field; expiry and `attachment_grant` unchanged |
| 7. Performance budget | PASS | One outgoing/incoming edge scan per settled debt, only at encounter resolution |

## Done when

- [ ] A test builds a world where a mortal lends through **The Loan** (the borrower's sheet row reads *Owes {lender}*; the lender's reads *Is owed by {borrower}*), and then the lender resolves **Debt Collection** at success: the debt edge is gone, the borrower's Means fell by `DEBT_REPAY_MEANS`, the lender's rose by `MEANS_STEP`, and an `agreement_settled` trace with `settlement:'paid'` names both. Falsified by setting `ENCOUNTER_DEBT_SETTLE_ENABLED = false`: the edge survives.
- [ ] The same test at Debt Collection failure writes the debt off (`settlement:'written_off'`, no debtor Means change); a debtor whose debts reach zero loses Debt-Laden on the next economic-traits pass.
- [ ] With two live debts owed to one creditor, the older is settled first (test).
- [ ] Debt Collection with no debt owed emits `debt_settle_noop reason:'no_debt_owed'` and still pays its success row (test).
- [ ] The debt arbitration's negative-variant failure writes a debt `$cast:master` → actor; its critical failure writes none. The toll-gate writ's success_at_cost writes actor → `$cast:tollmaster`. The cathedral loan's five bands write the table in § Content E (one test per template, at every band).
- [ ] A live census on seeds 42 and 99 over 600 ticks (CLI, `getTraces` or the trace log) reports: how many `agreement_settled` fired (paid / written off), how many `debt_settle_noop` by reason, and how many debts The Loan created. The report goes in the PR body. If `no_debt_owed` is more than 90% of Debt Collection's settles, file a Deferral (same project) on drawing Debt Collection toward mortals who are owed — do not tune the draw in this PR. The same census reports how often The Loan resolved before and after the change (same seeds, same ticks, `main` before the PR as the baseline): if The Loan never creates a debt, or resolves less than half as often as its baseline (the lender now pays to lend), file a Deferral on the lender's Means want and do not tune the draw here.
- [ ] Not in this build, already filed by the design lane: **the result line of a simple encounter cannot name a settled debtor** ([THR-2024](https://linear.app/threadbare/issue/THR-2024), Deferral). The step narratives are fixed text with `{actor}` only, so Debt Collection says "the debtor"; the debtor's name reads on the collector's sheet instead.
- [ ] Browser evidence (UI pillar): at 1920×1080, a sheet showing *Owes* and *Is owed by* rows and one of the four chips; console clean; a `window.__DEBUG` assertion that the shown debt edge exists; a UI-Laws judgment line (Laws 1, 13/14, 17, 21, 33, 37, 56).
- [ ] The rulebook paragraph, interface map + contracts, systemic wiring guide and the matching wiki page are updated.
- [ ] `npm run gate` (code track) passes; `npm run gate -- --final` last before push.

## Coordination block

**Suggested model:** opus — a new effect kind through the aftermath switch and the sentinel binder, plus five templates' band tables; the binder and the converter allowlist have known traps.

**Parallel-safe with:** [Prose fixes from the mislabel audit](https://linear.app/threadbare/issue/THR-2011) only if it does not edit the five templates named here (check before claiming); the settlement economy build ([THR-1923](https://linear.app/threadbare/issue/THR-1923)) — no shared files beyond `types/unifiedAction.ts` union additions.

**Mutex with:** [Money encounters, later rows](https://linear.app/threadbare/issue/THR-1954) when any of its items is picked up — the same templates' outcome tables and the same aftermath effect union; anything editing `src/data/encounters/cathedral-loan.ts`, `debt-arbitration.ts`, `toll-gate-writ.ts`, or the `the_loan` / `debt_collection` entries of `encounter-content.ts`.

**Files to touch:**
- Create: `src/engine/debtSettle.ts`; `src/engine/__tests__/debtSettle.test.ts`; template tests beside the existing ones
- Edit: `src/types/unifiedAction.ts` (the `DebtSettleEffect` union member)
- Edit: `src/engine/encounterAftermath.ts` (`case 'debt_settle'`)
- Edit: `src/engine/sceneSentinels.ts` (`creditorAgentId: 'agent'`)
- Edit: `src/types/trace.ts` (two categories, three registration sites)
- Edit: `src/data/mortal-means-constants.ts` (five constants)
- Edit: `src/data/encounter-content.ts` (`the_loan` cast + table; `debt_collection` table, its failure narrative and its stakes `risk` / `lost` lines)
- Edit: `src/data/encounters/debt-arbitration.ts`, `toll-gate-writ.ts`, `cathedral-loan.ts` (rows + chips)
- Edit: `src/engine/agentAttachments.ts` (`direction`), `src/engine/views/subjects/personRows.ts` (words + tooltip), `src/components/Game/ascendant-bar/HooksBlock.tsx` (the same words)
- Edit: `src/engine/phaseEconomicTraits.ts` (refresh the stale doc comment at `:118`)
- Edit: `Docs/canon/rulebook.md`, `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`, the systemic wiring guide, the matching wiki page

## Notes for the executor

- **The converter is an allowlist** (memory: content converter is a field allowlist). Confirm `outcomeEffects` and `supportBundle` reach the runtime template for `the_loan` (`encounter-content.ts:225`/`:411` carry `supportBundle`); prove each new row lands with a test, not by reading.
- **`$cast:` binds only when the binding exists.** `lazy-materialize-on-trigger` materialises the borrower when the scene triggers; verify on a generated world that `$cast:borrower` resolves to a node before the band table runs (the THR-1165 lesson). If it does not, the grant refuses with `counterparty_unresolved` — that would be a defect, not a pass.
- **Do not add a new debt template**, a note kind or a toll kind (Law 43). One `agreement.debt.minor`.
- **Do not change `expireAgreements`** or the Debt-Laden threshold.
- **The creditor's gain is authored, the debtor's loss is in `settleDebt`.** Do not add a second creditor Means write inside `settleDebt`, or the coin is counted twice.
- **Cathedral grey zone:** if you find the dean is reliably a member of a temple faction with a purse on generated worlds, do not switch to the purse here — record the measurement on the ticket; it is a later call.
- The veto lines in this plan's header are Christian's to use; a veto in chat before the build reaches main reverts the vetoed row only.

## Kill criteria

Gathered here from the Done-when and the notes:
- Debt Collection finds no debt owed in more than 90% of its settles (600-tick census, seeds 42/99) → file a Deferral on drawing it toward creditors; do not tune the draw in the build.
- The Loan never creates a debt, or resolves less than half as often as on `main` before the change → file a Deferral on the lender's Means want.
- `$cast:borrower` does not bind before The Loan's band table runs → a defect; fix the delivery, never ship the row unbound.
- Christian vetoes a [lane] call → revert that row only.

## Intent-judge verdict

*intent-judge (opus, cold), four passes, 2026-10-24.*

- **Pass 1 — Revise.** GAPs on UL (Agreement names only favour and mark), substrate (the favour shape and its `use` / `destroy` verbs were not inventoried), player legibility (simple-encounter results unquoted; "Means receipt" claim untrue). Fixed: the favour row and the why-not-favours paragraph; the UL-proposal named; result lines quoted; the receipt claim corrected.
- **Pass 2 — Revise.** GAPs on player legibility (Debt Collection's result never names the debtor; its failure prose said the debtor left town while a written-off debtor stays on the map) and kill criteria (none for The Loan's draw). Fixed: the debtor's name reads on the collector's own sheet, Deferral [THR-2024](https://linear.app/threadbare/issue/THR-2024) filed for naming it in the result line; failure narrative and stakes reworded; The Loan kill criterion added.
- **Pass 3 — Revise.** GAPs on NFP 1 (loan constants defined but rows used literals) and PC-6 (the toll-book chip said "if the writ is false" over an unconditional debt). Fixed: rows reference the constants, the named-step test explained; the chip reworded to match the sheet.
- **Pass 4 — Allow.** One non-blocking GAP (UL-proposal not yet linked); closed by linking [THR-2025](https://linear.app/threadbare/issue/THR-2025) in the Law 43 line. Optional advice (a gathered kill-criteria section) taken above.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-24 (sonnet auditors, run in parallel with intent-judge pass 4 on the pass-3-fixed text).*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Constants table (kill switch, DEBT_REPAY_MEANS, LOAN_PRINCIPAL_MEANS, two sentiment constants); rows use named Means steps; named comparator `compareDebtsOldestFirst` |
| 2. Inspectability | PASS | `agreement_settled` and `debt_settle_noop` traces registered in trace.ts; wiring table maps getTraces |
| 3. Determinism | PASS | No PRNG; oldest by acquiredTick, ties by edge id |
| 4. Fail-soft | PASS | Unbound creditor, no debt, missing debtor, flags off, unbound casts all no-op with traces |
| 5. Narrative over mechanical | PASS-with-note | Cathedral coin rides the dean's Means (lane decision, flagged for veto); Debt Collection prose reworded so the debtor stays on the map |
| 6. Additive over destructive | PASS-with-note | New union member, module, sentinel field, sheet field; expiry and `attachment_grant` unchanged. Note: first early remover of agreement edges; edits Debt Collection's failure narrative and stakes |
| 7. Performance budget | PASS | One edge scan per settled debt, only at encounter resolution |

NFP AUDIT: PASS-with-notes

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | `debt_settle` effect and `settleDebt` module, sentinel field, graph edges, tick phases, resolution, no-PRNG callout |
| Content | present-and-substantive | Band tables for five templates, one new cast, prose edits, attachment content, data constants |
| UI | present-and-substantive | Sheet direction words, four chips, player-facing text with PC classes, playtest signal, debug traces, map N/A with reason |

No missing required sections. Wiring gives phase, UI, field, trace and debug per module, checked against the wiring checklist. Substrate: no existing debt-removal subsystem in the inventory; the favour shape is treated as separate; no green-field duplication.

PILLAR AUDIT: PASS

### Vision audit

Premises touched: north star (mortals with witnessed interior life — extended), core loop (aftermath compounds — extended), non-negotiables #1 and #2 (confirmed), taste profile (prose-first UI, no numbers — confirmed). No contradictions. Notes: no single player-facing *moment* is named (soft gap); The Loan and Debt Collection show their result only on sheets, so aftermath is less visible there (tracked by [THR-2024](https://linear.app/threadbare/issue/THR-2024)); oldest-first picking is slightly mechanical, carried by prose and chips.

VISION AUDIT: PASS-with-notes
