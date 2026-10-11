# Briefing
**Generated:** 2026-10-11 19:58 local (17:58 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** Every recent lane silence began when the computer started or woke and the app did not reopen. Only you can change that setting. Say "done" and the next silence check will confirm it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

The silence check still reports the Tuesday-to-Thursday gap this setting is meant to close: *"The scheduled lanes went silent for 31.8h (2026-10-06T20:56:43.000Z → 2026-10-08T04:42:41.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."*

## Also waiting (3)

- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [Map chrome and markers](https://linear.app/threadbare/issue/THR-1831/map-chrome-and-markers-zoom-controls-minimap-opening-zoom-agent-marker) — the map gets zoom, "centre on my First" and "show known land" buttons plus keys, and a minimap at 1440p. The game opens on your First with your known land in view. Your mortals keep a portrait at every zoom. Borders use each holder's own ink (red is danger only, gold is your frontier). Uncharted land looks like parchment, and place names grow as you zoom. *To veto, say:* **"I want to start face to face with my mortal"**, **"keep the red borders"** or **"no minimap"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-11c.md)*
- [The First's chapters end out of sight](https://linear.app/threadbare/issue/THR-1806/on-the-main-map-the-firsts-chapters-end-out-of-sight-the-player) — a choice made while paused stays on screen saying "The world must turn before this answers", with **Let the world turn** or **Back to the map**. Time never moves without your click. *To veto, say:* **"a choice should be answered the instant I make it"** or **"just let time run after I choose"**. Building waits until about 10:05 Monday. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-10d.md)*
- [The player can't read what they spend or risk](https://linear.app/threadbare/issue/THR-1807/recurs-after-fix-twice-the-player-cant-read-what-they-spend-or-risk) — every game word explains itself on hover, even during a chapter; the game names the price or risk before you commit; Reach ranks show their rung; empty side-bar sections stay hidden; the clock says who is holding it. *To veto, say:* **"Doom should stay a mystery"**, **"name the mortals before I focus them"** or **"let me open Doom during a chapter"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-11b.md)*

Say "veto <title>" to reverse any of these.

## Queue

**Healthy: 3 jobs ready, none being built right now.** Ready, all from the round-3 playtest: [a paused choice stays on screen](https://linear.app/threadbare/issue/THR-1812/a-chapter-step-committed-on-a-paused-clock-stays-on-screen-the-world), [the map's words explain themselves](https://linear.app/threadbare/issue/THR-1814/the-maps-words-explain-themselves-doom-omen-world-soul-and-attention) and [say it before it happens](https://linear.app/threadbare/issue/THR-1815/say-it-before-it-happens-the-sphere-pour-says-what-it-changes-the). The next builder run picks one up on its own. Nothing is blocked, stale or parked.

## Health

- **Heavy background tests are still red on main** ([run on 8f9853c2](https://github.com/christianspliid-ui/threadbare/actions/runs/38142539478), and the commit before, [1b0c5644](https://github.com/christianspliid-ui/threadbare/actions/runs/38139808324)), about 5 hours now. The newest commit only touched docs, so it did not re-run them. Earlier failures were tests running out of time, not a broken game. The builder owes a fix and an impediment row. Not yours.
- Engine speed is back to normal (120 ms per tick, 2% above the weekly median); last hour's alarm was noise.
- Everything else is green: the live site is up to date, automated checks are normal, no pull requests are stuck, all 11 scheduled lanes are on time, and the cleanup job ran at 19:40.
