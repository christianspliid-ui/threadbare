---
lane: tb-design-lane
run: 2026-10-17b
promoted: 1
filed: 2
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-17 (run b, ~10:45Z)

## Needs Christian

Nothing needs you.

## Decided for you

Each line is a how-level call inside the plan for [the god's stake in the economy](https://linear.app/threadbare/issue/THR-1935) ([plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-17-thr-1935-the-gods-stake-in-the-economy.md)). You already kept the big call on 15 October: the god is paid in worshippers, not coin. Each line names the words that veto it.

- [The god's stake in the economy](https://linear.app/threadbare/issue/THR-1935): **a town that keeps faith with you can lose it.** If it starves for about four days, its faithful turn away and its gift of essence stops. Without this, a town's hunger would change nothing for you, because faith only changes a source's essence once it flowers. The game warns you first: "Millbrook's faith wavers: its bread is short." *Veto:* **"faith once won should never be lost"**.
- Same plan: **you can keep faith with at most four towns at once.** I measured this in the power model. Four faithful towns add about 4% to your essence by the end of a run, and six push the richest god over the agreed ceiling. *Veto:* **"no cap on faithful towns"**.
- Same plan: **only bread moves a town's faith; Sanctify cannot raise it.** If Sanctify could raise it, the god's income could leave the agreed range with four faithful towns. *Veto:* **"let me sanctify my faithful towns"**.
- Same plan: **the 30-day spans read "a year" on screen.** The game's year is 30 days (a season is 7.5 days). So a town prays at most once a year, and Bless the Holding lasts a year. The decision said "a season" but set 30 days. I kept the 30 days because a prayer every week would flood you. *Veto:* **"make the blessing last a season"** (about a week).
- Same plan: **the screen says "faithful", never "congregation".** "Congregation" already names the Temple faction in each culture, and one word must not mean two things. *Veto:* **"call them congregations anyway"**.
- Same plan: **helping a hungry town off your own ground counts once a year.** It nudges your ground a little each time, so without the limit, casting Bless the Harvest on one foreign town every day would buy you ground. *Veto:* **"every act of kindness should count"**.
- Same plan: **Open the Markets' thieves' guild becomes a temptation, not a certainty.** In a booming town, a resident who leans to Shadow is drawn toward founding a guild, and that guild is thieves. It is not forced into being. *Veto:* **"the boom should always breed a thieves' guild"**.

## Work

- **Claimed** [the god's stake in the economy](https://linear.app/threadbare/issue/THR-1935) (`design-lane claim 2026-10-17b`). It was the last unwritten plan from the economy map. You kept its decision on 15 October, and the plan it waited on, [hunger and unrest](https://linear.app/threadbare/issue/THR-1934), has merged. The build shelf was not thin (22 ready), no wayfinder map is open, and you sent no vetoes.
- **Plan doc:** [the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-17-thr-1935-the-gods-stake-in-the-economy.md) and its [brainstorm companion](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-17-thr-1935-the-gods-stake-in-the-economy-brainstorm.md), via [PR #2454](https://github.com/christianspliid-ui/threadbare/pull/2454).
  - **Prayers:** a hungry town on your ground prays (chronicle, place page, Needs you, Trouble lens; never an interrupt). Answering with Bless the Harvest or Open the Markets widens your ground. If the town recovers, it keeps faith with you.
  - **Ignored prayers:** a rival raids the town next, inside the usual limit. The rival's "starve the faithful" step now really thins your faithful.
  - **Receipts:** every economic card says what it changed, in words.
  - **New cards:** Fortune's Favour, Ruin and Bless the Holding join the omen market.
  - **Fixed promises:** Claim Resource pays in the essence of what it claims, and Open the Markets' thieves' guild finally happens.
- **Measured:** the power model with faithful towns added. With 1 to 4 faithful towns, essence at day 90 rises 1.4–4.3%, under the decision's 10% line. At six, the richest god crosses the 13.5 ceiling (13.52).
- **Gates:**
  - Intent judge: Revise twice, then Allow. It asked for quoted words on three surfaces and for one shared faith line and Needs-you line, and asked for the unrounded measurement. All were fixed.
  - Audits: NFP passed with notes (two small fixes taken), pillar passed, Vision passed with notes.
- **Handoff:** the ticket is in Todo, blocked by [hunger and unrest](https://linear.app/threadbare/issue/THR-1934), whose build is the prayer's trigger. The orchestrator promotes it when that merges. Coordination block posted.
- **Filed:**
  - [S2 — every economic card says what it changed](https://linear.app/threadbare/issue/THR-1968). Nothing blocks it, so it went to Ready for Dev.
  - [S3 — the new market cards and the two promises](https://linear.app/threadbare/issue/THR-1969). It is blocked by [mortal wealth](https://linear.app/threadbare/issue/THR-1936), [undertakings in the economy](https://linear.app/threadbare/issue/THR-1937) and S2.

## Escalations

None.
