---
lane: tb-design-lane
run: 2026-10-26b
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-26 (run b, ~08:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

[An oath from tribute](https://linear.app/threadbare/issue/THR-2051/plan-doc-an-oath-from-tribute-the-house-that-pays-tribute-in-a-crowns): four calls inside [the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-26-thr-2051-oath-from-tribute.md#decisions). Each can be vetoed on its own until Tuesday 08:49 UTC.

- **The mortal's own guild or company swears to the crown over the hall.** When a mortal wins The Tribute Exchange, their own guild, company or order (never a whole realm) swears fealty to the realm that holds that town. If a temple order holds the town and has sworn to a realm, it is that realm. That is 15 of the 16 cases on three test worlds. *Veto:* "only a town a realm holds directly counts".
- **Every win swears; a loss swears nothing.** A clean win, a win and a costly win all swear. A loss still costs the tribute, as the scene's own failure line says. *Veto:* "a costly win should pay without the oath".
- **A tribute that can bind nobody is still paid.** If the mortal has no guild that may swear, or no crown stands over the town, the coin is spent and nothing is sworn. *Veto:* "a tribute that buys no oath should be refunded".
- **The scene comes up as often as today.** It does not lean toward towns under a crown, because the missing piece is usually the mortal's guild, not the crown: 18 of 32 mortals had none. *Veto:* "the tribute scene should only come up under a crown".

So the oath is rare. On three test worlds over 15 days, 2 of 32 tribute scenes had both a guild and a crown, and one of those was won.

## Work

- **Filed and claimed** [Plan doc: an oath from tribute](https://linear.app/threadbare/issue/THR-2051/plan-doc-an-oath-from-tribute-the-house-that-pays-tribute-in-a-crowns), split from [Money encounters, later rows](https://linear.app/threadbare/issue/THR-1954). Its blocker, [the crown](https://linear.app/threadbare/issue/THR-1932), has shipped. That list now keeps bounty collection and the missing salt good.
- **Measured** every Tribute Exchange on three worlds (seeds 42, 99, 7; 360 ticks each) with a throwaway script. The figures are in the plan's substrate inventory.
- **Gates:** intent judge Allow (two small gaps fixed). NFP audit PASS, pillar audit PASS-with-notes (fixed), Vision audit PASS-with-notes (answered in the plan). `lint:plan-doc`, `check:impediment-ids` and `check:generated-freshness` all green.
- **Merged** as [PR #2594](https://github.com/christianspliid-ui/threadbare/pull/2594); `check:plan-doc-liveness` LIVE. **Handed off** to Ready for Dev with a coordination block, held until Tuesday 08:49 UTC by a `Claimable from` line.

## Escalations

None. One observation for the engine lanes, not filed: the census runs logged two caught engine errors. One was *"Failed to add victim edge … Source node not found"* (`createUndertakingOutcomeNode`, seed 42). The other was *"Duplicate node ID: evt_agent_garrison_culture_1_76_0"* (`createUnifiedActionEventNode`, seed 99). Both were fail-soft, and the tick went on.
