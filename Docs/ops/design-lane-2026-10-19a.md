---
lane: tb-design-lane
run: 2026-10-19a
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-19 (run a, ~19:18Z)

## Needs Christian

Nothing needs you.

## Decided for you

All from one plan: [Hiring a free company](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-19-thr-1974-hiring-a-free-company.md), for [Plan doc: hiring a free company](https://linear.app/threadbare/issue/THR-1974/plan-doc-hiring-a-free-company-a-realm-buys-a-companys-oath-then-pays). It builds on the [Mercenary hire](https://linear.app/threadbare/issue/THR-1939) decision, whose veto day closed this morning with no veto. The choices below are how that decision gets built.

- **A hired company fights its paymaster's wars, not its own.** While a lord pays a company's soldiers, the company marches on the lord's enemies and rides to defend the lord's towns. Its own grudges wait until the pay stops. It never marches on the lord who pays it. *Veto:* **"a hired company should still fight its own enemies too"**.
- **A lord keeps two days of its own soldiers' pay before it pays anyone else's.** A realm never starves its own host to pay a hired one, so a poor realm cannot keep a company for long. Measured: one company's pay costs a realm between an eighth and three quarters of its daily income. *Veto:* **"a lord should spend its last coin on its sworn swords"**.
- **A company is priced on the soldiers it keeps.** It earns almost nothing, so pricing it on its income made it nearly free. Bought outright, the silver is enough for the company to raise a new host. *Veto:* **"price companies on what they earn, like everyone else"**.
- **A company that swears for protection, with no army left, gets no help to raise one.** It fields soldiers again only if it is later bought with silver. The builder measures how often companies stand empty, and files "the lord pays for the raise" if it is more than half the time. *Veto:* **"a lord should pay to raise its vassal's army at once"**.
- **Two hired companies still make a realm a Crown**, as the earlier decision kept it. Measured: about three times in ten, one hire would be enough. *Veto:* **"hired companies should not count toward a Crown"**.
- **The player reads "pays its soldiers", never a sum, and never the words *mercenary*, *contract* or *hire*.** It shows on the army sheet ("Marching to take Silverborough for the Hold of Witness Skyfield, which pays its soldiers."), on the company's page and on the lord's purse. *Veto:* **"call them mercenaries on screen"**.

## Work

- **Claimed** [Plan doc: hiring a free company](https://linear.app/threadbare/issue/THR-1974/plan-doc-hiring-a-free-company-a-realm-buys-a-companys-oath-then-pays). The briefing had no veto from you. No wayfinder map was open. The shelf was full (26 ready). This was the one agreed plan-doc ticket left, and its veto window closed at 01:35 UTC. The armies bug it waited on ([every army bleeds out within a week](https://linear.app/threadbare/issue/THR-1973)) has shipped.
- **Measured** on main `04ed4c85`, seeds 42, 99 and 7, over 90 days ([census branch](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1974-hire-census), never merged):
  - From day 30 on, **no free company on any seed fields an army**, even with the armies fix live. Each starts with a host, earns about a fifth of its upkeep, goes broke by day 20–30, loses its host, and cannot afford another.
  - All six companies are within reach of a courting realm (45–90 days of 90). All end up sworn: five bought, one persuaded.
  - One company's pay costs a realm 13–77% of its daily income. Uncapped, two hires would bankrupt a poorer realm within days, which is why the plan keeps a reserve.
- **Plan doc** [Hiring a free company](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-19-thr-1974-hiring-a-free-company.md), with its [brainstorm](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-19-thr-1974-hiring-a-free-company-brainstorm.md), in [PR #2487](https://github.com/christianspliid-ui/threadbare/pull/2487).
- **Gates.** Intent judge: **Allow** on pass 2. Pass 1 returned Revise, and all six findings were fixed:
  - a guild that fields an army is priced on that army;
  - the pay stamp holds no faction id;
  - a predicate no longer contradicts its kill criterion;
  - wage chronicle lines are de-duplicated;
  - one phrase is used on every surface;
  - an unresolved name hides the clause.

  Forked audits: NFP, pillar and Vision all returned PASS-with-notes. The fixable notes were fixed; the rest are recorded in the plan.
- **Handed off** to Ready for Dev with its coordination block. There is no hold: every decision it builds on is past its veto window.

## Escalations

None.
