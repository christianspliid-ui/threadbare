# Debts in the money encounters — brainstorm companion (THR-2023)

> Companion to [`2026-10-24-thr-2023-encounter-debts.md`](2026-10-24-thr-2023-encounter-debts.md). Authored by the design lane (run 2026-10-24c), unattended. Records the alternatives weighed, the tensions, and the Vision premises the plan rests on.

## The question

Four rows of the money-encounter outcome table wanted a debt to move, and the engine had only one way to end a debt (its term, THR-1999). What is the smallest generic seam that makes all four true?

## Alternatives weighed

### Ending a debt early

- **A. A `debt_settle` effect kind in the shared aftermath union (taken).** One remover, usable by any encounter, card or reaction (Law 41). The creditor side is authored on the template; the debtor's payment lives in the function, so coin is counted once.
- **B. Reuse `remove_edge` from the action-template ops** (as `action.gold.break-agreement` does for `party_to`). Rejected: an op addresses an edge by type and endpoints, and the debtor in Debt Collection is not a bound endpoint. It also bypasses the Means repayment and the trace.
- **C. Shorten the term to zero and let expiry remove it.** Rejected: expiry runs once a tick in Phase 6.625c, so the sheet would show a "collected" debt for the rest of the tick, and expiry's trace says *"term ran out"*, which is the wrong story.
- **D. A generic `attachment_revoke`.** Considered as the wider seam. Rejected for now: nothing authored needs to revoke a favour, mark or blessing through an encounter, and the debt case needs Means semantics a generic revoke would have to special-case. If a second agreement class needs it, widen `debt_settle` then.

### Which debt is settled

- **Oldest first (taken).** Deterministic, the debt that has waited longest. A tie-break by edge id keeps it stable.
- **Largest first.** Rejected: all debts are one template today, so it collapses to oldest anyway.
- **Bind a debtor as cast.** Rejected for Debt Collection: no support-bundle spec can pick "an agent with a debt edge to the actor", and a spawned debtor would owe nothing. The effect's own lookup is honest; the `debtorAgentId` field stays for scenes that do have the debtor on stage.

### The Loan's roles

- **The actor lends (taken).** Gold reach, counting house, and the narrative's *"cautious lender"* read the actor as the lender. It closes a loop with Debt Collection at the same sublocation.
- **The actor brokers between a lender and a borrower.** A fair reading of *"the agreement must hold both"*. Rejected: two cast for one simple scene, and the actor would gain nothing a later scene can pay off.
- **The actor borrows.** Rejected: the stakes (*"set fair terms on a loan to a desperate borrower"*) name someone else as the borrower.

### The cathedral's treasury

- **The dean's and the factor's Means (taken).** The people on stage carry the coin; every `$cast` binding exists in the scene already.
- **A temple faction purse.** The research table called it *the temple treasury*. Rejected for this plan: no support binding is a faction (`EncounterSupportBinding.kind` is `'actor' | 'location'`, `types/encounter.ts:262`), `$realm` binds realms only (`sceneSentinels.ts:73–78`), and a "faction of a cast member" sentinel would bind nothing for a spawned priest unless that priest belongs to a temple faction — unmeasured. A dead binding is the THR-1446 failure. Left as a note for the executor to measure.
- **No coin at all, only debts.** Rejected: the failure bands say the lenders *took the plate*, which is coin moving.

### The arbitration note on critical failure

- **No debt (taken).** The afterimage calls it a note on a house that has stopped paying; a collectable debt would contradict the prose.
- **A debt anyway.** Rejected for that reason. A worthless note as its own agreement would need a second concept (Law 43).

## Tensions

- **Lending makes the lender poorer at once.** That is the risk of lending, and it keeps the Means want honest: a poor mortal is not drawn to The Loan (`templatePaysActorOnSuccess` sees no actor gain).
- **Debt Collection may rarely find a debt.** Only a handful of scenes make debts, and the collector must be the creditor. The Done-when measures it and files a Deferral on the draw rather than tuning it here.
- **A debt that runs out unpaid is a free win for the debtor.** Unchanged from THR-1999. A default consequence (a grudge, a reputation loss) is a separate design.

## Vision premises

- **The world does not wait for the god** (Law 13): debts are made and settled between mortals with no card involved.
- **No outcome is dead air** (Law 22): the failure bands now change the world.
- **The game never promises what the world will not do** (Law 45 [P]): four stakes and afterimages become true.
