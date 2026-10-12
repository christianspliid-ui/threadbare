# Briefing
**Generated:** 2026-10-12 23:57 local (21:57 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** Every recent lane silence began when the computer started or woke and the app did not reopen. Only you can change that setting. Say "done" and the next silence check will confirm it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

The silence check still reports the Tuesday-to-Thursday gap this setting is meant to close: *"The scheduled lanes went silent for 31.8h (2026-10-06T20:56:43.000Z → 2026-10-08T04:42:41.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."*

## Also waiting (3)

- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [Dominion on the map and on every sheet](https://linear.app/threadbare/issue/THR-1750/dominion-on-the-map-and-on-every-sheet-the-player-can-see-their-turf) — **new this hour: your ground becomes visible.** Press **1** (or the Dominion button) to dim everything that isn't yours; a gold line traces where your ground ends. Open land takes its colour from the nearest town within two hexes. Lost ground shows a broken gold ring for three days. Every place, faction and relic page gets a *Dominion* box; cards show *"Held · cheaper here"* or *"Hostile · dearer here"*, and from this build prices really change with the ground. Only the Dominion view is built; the other three map tabs wait for [Lenses on the map](https://linear.app/threadbare/issue/THR-1830/lenses-on-the-map-how-the-five-lenses-look-switch-and-combine-with). [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-12-thr-1750-dominion-on-screen.md), [mock](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-11-thr-1766-dominion-mock/map-c.png). Building waits for the Dominion core and not before 21:40 tomorrow. *To veto, say:* **"give me all four map tabs now"**, **"show my ground only right around towns"** or **"keep my ground off faction and relic pages"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-12d.md)*
- [The world arrives with no direction](https://linear.app/threadbare/issue/THR-1808/recurs-after-fix-the-world-arrives-with-no-direction-after-the-bonding) — after the bond the screen fills one gift at a time instead of all at once. At the bond you see only time, your essence and Attention, your hand, The First's thread, the Chronicle and Settings; later gifts bring the rest. One line says what to do first ("Watch over Elara. A chapter of her story is waiting →"). After 200 ticks nothing stays hidden, and a "Show every panel" setting turns it all off. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-12-thr-1808-post-bond-reveal.md). Building waits until 14:38 tomorrow. *To veto, say:* **"show me the Doom straight away"**, **"the Reaches from the start"** or **"no slow reveal, show everything"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-12c.md)*
- [The screen frame](https://linear.app/threadbare/issue/THR-1828/the-screen-frame-top-bar-with-the-needs-you-queue-the-god-rail-and-the) — One row across the top, a rail on each side, and the map keeps at least 60% of the screen. The World Pulse box goes; World-Soul becomes one line above the Chronicle. Mocks: [1440p](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-12-thr-1828-screen-frame/frame-1440p.jpg), [1080p](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-12-thr-1828-screen-frame/frame-1080p.jpg), [1080p with a page and Needs you open](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-12-thr-1828-screen-frame/frame-1080p-inspector-queue.jpg). *To veto, say:* **"keep World-Soul up top"**, **"I want the agent and culture counts"** or **"keep the World Pulse box"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-12b.md)*
- [Find anything](https://linear.app/threadbare/issue/THR-1832/find-anything-what-the-god-can-search-for-and-what-a-result-does) — Ctrl+K (or /) opens a search box. It finds only things you have already seen. Picking a result flies the map there and opens it; a card arms ready to cast. Searching never pauses the game. *To veto, say:* **"search should find anything in the world"**, **"only find people I know well"** or **"pause the game while I search"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-12a.md)*

Say "veto <title>" to reverse any of these.

## Queue

**Thin: nothing being built, 2 ready on timed holds.** [Dominion core](https://linear.app/threadbare/issue/THR-1748/dominion-core-one-graded-read-of-how-much-a-world-object-is-the-gods) is finished and live ([#2351](https://github.com/christianspliid-ui/threadbare/pull/2351)). [The god's screen fills one gift at a time](https://linear.app/threadbare/issue/THR-1837/the-gods-screen-fills-one-gift-at-a-time-after-the-bond-only-the) opens 14:38 tomorrow; [Dominion on the map and on every sheet](https://linear.app/threadbare/issue/THR-1750/dominion-on-the-map-and-on-every-sheet-the-player-can-see-their-turf) now has its core and opens 21:40 tomorrow. Until then the builder has nothing to pick up. Nothing is blocked, stale or parked.

## Health

- **The heavy simulation tests went red on the Dominion core merge** ([run](https://github.com/christianspliid-ui/threadbare/actions/runs/38304374382)). Two tests ran past their time limit (`debugTickBatch`, `doomIdentityMilestones`); the other 250 passed. Engine speed is normal (100 ms a tick, 15% faster than the weekly median), so this looks like slow test runs, not a slower game. The builder owes a follow-up; nothing for you.
- Everything else is green: the live site is up to date, automated checks are normal, no pull requests are waiting, all 11 scheduled lanes are on time, and the cleanup job ran at 23:40. No new messages from you on Discord.
