---
lane: tb-design-lane
run: 2026-10-18c
promoted: 1
filed: 2
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-18 (run c, ~10:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Chapters forget who The First is](https://linear.app/threadbare/issue/THR-1982/chapters-forget-who-the-first-is-a-herb-healer-is-offered-a-smithing) — **The First keeps the trade you met her in.** The healer you chose stays a healer: the meeting now saves her trade, her sheet shows it ("Healer"), and her chapters lean toward her work. ([plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1982-the-first-keeps-her-trade.md)) *Veto:* **"her trade should change when her life does"**.
- Same plan — **the five big regional chapters built around a job only go to a mortal with that kind of trade**: the archivist's forged saint, the prophet's comet, the magistrate's verdict, the mason-lord's wall, the merchant-prince's granaries. A healer no longer gets cast as a forty-year archivist. Each of the five can still come to some First (a rune-carver gets the archive, a mason the wall). *Veto:* **"don't lock chapters away from The First — rewrite them instead"**.
- Same plan — **your First's trade is fixed; her calling ("Called Mender") still changes with her life.** These are two lines on her sheet: what she was, and what the world calls her now. *Veto:* **"one identity line is enough"**.
- Same plan — **with a trade, The First can be cast as "the healer" in other people's scenes, and stops being cast in roles that don't fit her.** Today she can be cast as anyone. *Veto:* **"keep The First out of other people's scenes"**.
- The ordinary guild scenes (the "smithing guild applicant" from round 4) get their own pass: [ordinary scenes still hand The First a trade she never had](https://linear.app/threadbare/issue/THR-1983/ordinary-scenes-still-hand-the-first-a-trade-she-never-had-guild). The builder holds [the build](https://linear.app/threadbare/issue/THR-1984/the-first-keeps-her-trade-the-meeting-writes-the-trade-the-player-read) until 19 Oct 10:41 UTC.

## Work

- **Claimed** [Chapters forget who The First is](https://linear.app/threadbare/issue/THR-1982/chapters-forget-who-the-first-is-a-herb-healer-is-offered-a-smithing) (cold playtest round 4, PC-6). This was agreed work: a playtest bug whose Done-when is a design pass. The shelf was full (26 ready), no map was open, and no lane decision it needed was under 24 h old.
- **Measured** on main `80b719a9`. The meeting shows the epithet "healer who feels too much" but saves no trade and no `npcRole`. So the chapter engine's role weight is a no-op for her (`encounterScoring.ts:1170`). Five regional chapters cast their protagonist as a fixed job, and run on anyone with the right Reach.
- **Plan doc** [The First keeps her trade](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1982-the-first-keeps-her-trade.md), with its [brainstorm](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1982-the-first-keeps-her-trade-brainstorm.md), merged in [PR #2478](https://github.com/christianspliid-ui/threadbare/pull/2478).
- **Gates.** Intent judge: Revise on pass 1. It found six issues: the dev-seed First, two screens that print raw roles, the binder, the guild recast, the UL term and a citation. All were fixed, and pass 2 returned Allow. NFP, three-pillar and Vision audits: all PASS-with-notes.
- **Filed** [the build](https://linear.app/threadbare/issue/THR-1984/the-first-keeps-her-trade-the-meeting-writes-the-trade-the-player-read) (Ready for Dev, claimable from 2026-10-19T10:41Z) and [the ordinary-scene follow-up](https://linear.app/threadbare/issue/THR-1983/ordinary-scenes-still-hand-the-first-a-trade-she-never-had-guild) (Todo). Both are in *Cold playtest · round 4*.
- **Closed** the design ticket per its Done-when (implementation tickets filed), as THR-1807 was closed on 2026-10-11.

## Escalations

- [The Crossroads](https://linear.app/threadbare/issue/THR-1926) has been stuck in Implementation Planning since 2026-10-14. Its plan merged and its handoff is complete, but it never moved to Ready for Dev. It is assigned without a design-lane marker, so it belongs to the attended session that wrote it, and this lane did not touch it. The weekly hygiene sweep flagged it the same way this morning. Moving it to Ready for Dev and unassigning it is the orchestrator's or that session's call.
