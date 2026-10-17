---
lane: tb-design-lane
run: 2026-10-17a
promoted: 0
filed: 2
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-17 (run a, ~09:40Z)

## Needs Christian

Nothing needs you.

## Decided for you

Each line is a how-level call inside the plan for [Undertakings in the economy](https://linear.app/threadbare/issue/THR-1937) ([plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-17-thr-1937-undertakings-in-the-economy.md)). You already kept the economy map's decisions. Each line names the words that veto it.

- [Undertakings in the economy](https://linear.app/threadbare/issue/THR-1937): **a town a mortal founds is placed on open ground near where they set out.** Today it lands on top of a town that already stands, a fault I found while measuring. If there is no open ground nearby, nothing is founded and the mortal's card says so. *Veto:* **"let founded towns sit beside existing ones"**.
- Same plan: **a founded guild takes its calling from its founder's strongest Reach**: a Gold founder makes merchants, a Stone founder builders, a Shadow founder thieves. Without a calling, the faction purse never pays the guild anything. An Iron founder's company has no trade and earns no guild income. *Veto:* **"founded guilds should have no trade"**.
- Same plan: **a trade run pays a mortal at most once a day.** A trade run cannot fail, so paying for every run would make trading a mill. *Veto:* **"pay every trade run"**.
- Same plan: **a lane a mortal claims counts as a lane they hold**, along with lanes they toll or opened, when Dominate Regional Trade counts lanes. *Veto:* **"only lanes they opened or toll"**.
- Same plan: **the undertaking builds come last**, after [mortal wealth](https://linear.app/threadbare/issue/THR-1936), as the map's order says. The first build could start now because the faction purse has shipped, but it waits. *Veto:* **"build the founded-town ruler now"**.

## Work

- **Claimed** [Undertakings in the economy](https://linear.app/threadbare/issue/THR-1937) (`design-lane claim 2026-10-17a`). It was the only agreed plan-doc ticket that was still unwritten and past its veto day. The build shelf was not thin (21 ready), no wayfinder map is open, and you sent no vetoes.
- **Plan doc merged:** [the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-17-thr-1937-undertakings-in-the-economy.md) and its [brainstorm companion](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-17-thr-1937-undertakings-in-the-economy-brainstorm.md), via [PR #2453](https://github.com/christianspliid-ui/threadbare/pull/2453) (`af333a96`). Liveness check: LIVE.
  - The plan covers who rules a founded town (the founder's strongest town-holding faction, else the founder), the founder's freehold, and the toll on a lane they open.
  - It covers a founded guild's calling and purse, a building raised from the town's own next choice, and pay for trade runs.
  - It rewrites four ambitions so they can be met by their own work: Dominate Regional Trade, Found Something New, Rebuild from Ashes and Protect the Home.
  - A faction's resource ambition counts as met once it holds a regional monopoly.
- **Gates:**
  - Intent judge: Allow on the first pass, and I took all four of its advisories.
  - Audits: NFP and pillar passed.
  - Vision returned Revise on the first draft: who founded a lane was stored as an id on the lane, not an edge. I fixed it, and the re-run passed with notes.
- **Handoff:** the ticket is in Todo, unassigned, and blocked by [mortal wealth](https://linear.app/threadbare/issue/THR-1936). The orchestrator promotes it when that merges. Coordination block posted.
- **Filed:**
  - [S2 — the town's next building](https://linear.app/threadbare/issue/THR-1966), blocked by S1 and [the settlement economy](https://linear.app/threadbare/issue/THR-1923).
  - [S3 — trade pays, ambitions measure it](https://linear.app/threadbare/issue/THR-1967), blocked by S1, [mortal wealth S2](https://linear.app/threadbare/issue/THR-1952) and [war aims S2](https://linear.app/threadbare/issue/THR-1955).

## Escalations

None.
