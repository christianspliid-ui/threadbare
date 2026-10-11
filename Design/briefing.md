# Briefing
**Generated:** 2026-10-11 13:58 local (11:58 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** Every recent lane silence began when the computer started or woke and the app did not reopen. Only you can change that setting. Say "done" and the next silence check will confirm it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

The silence check still reports the Tuesday-to-Thursday gap this setting is meant to close: *"The scheduled lanes went silent for 31.8h (2026-10-06T20:56:43.000Z → 2026-10-08T04:42:41.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."*

## Also waiting (3)

- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [How the god's own power grows](https://linear.app/threadbare/issue/THR-1765/how-the-gods-own-power-grows-what-raises-the-gods-sphere-score-across) — your god grows by spending through its spheres; about five growth steps a run. Turf stops widening at double strength; nothing fades if you stop spending. *To veto, say:* **"my god should keep growing its land"**, **"power should come from deeds, not spending"** or **"unspent power should fade"**. Window closes about 14:30 today. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-10b.md)*
- [The First's chapters end out of sight](https://linear.app/threadbare/issue/THR-1806/on-the-main-map-the-firsts-chapters-end-out-of-sight-the-player) — a choice made while paused stays on screen saying "The world must turn before this answers", with **Let the world turn** or **Back to the map**. Time never moves without your click. *To veto, say:* **"a choice should be answered the instant I make it"** or **"just let time run after I choose"**. Building waits until about 10:05 Monday. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-10d.md)*
- [The player can't read what they spend or risk](https://linear.app/threadbare/issue/THR-1807/recurs-after-fix-twice-the-player-cant-read-what-they-spend-or-risk) — every game word explains itself on hover, even during a chapter; the game names the price or risk before you commit; Reach ranks show their rung; empty side-bar sections stay hidden; the clock says who is holding it. *To veto, say:* **"Doom should stay a mystery"**, **"name the mortals before I focus them"** or **"let me open Doom during a chapter"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-11b.md)*

Say "veto <title>" to reverse any of these.

## Queue

**Healthy: 5 jobs ready, 1 being built.** Two new map bugs joined the queue: [the world map can crash on load](https://linear.app/threadbare/issue/THR-1817/the-world-map-can-crash-on-load-hexmapv2-calls-two-usememo-hooks-after) (High) and [the map tooltip shows raw terrain words and lingers](https://linear.app/threadbare/issue/THR-1818/map-hover-tooltip-shows-raw-terrain-keys-plateau-temperate-forest-and). Still ready from the round-3 playtest: [a paused choice stays on screen](https://linear.app/threadbare/issue/THR-1812/a-chapter-step-committed-on-a-paused-clock-stays-on-screen-the-world), [the map's words explain themselves](https://linear.app/threadbare/issue/THR-1814/the-maps-words-explain-themselves-doom-omen-world-soul-and-attention) and [say it before it happens](https://linear.app/threadbare/issue/THR-1815/say-it-before-it-happens-the-sphere-pour-says-what-it-changes-the). Being built: [Escape closes the sheet on top, not the encounter behind it](https://linear.app/threadbare/issue/THR-1816/escape-closes-the-encounter-behind-an-open-sheet-instead-of-the-sheet), its pull request [#2333](https://github.com/christianspliid-ui/threadbare/pull/2333) waiting on checks and set to merge. The [raw `{are}` bug](https://linear.app/threadbare/issue/THR-1810/encounter-prose-leaks-raw-are-two-lines-use-a-verb-token-only) is fixed and live ([#2332](https://github.com/christianspliid-ui/threadbare/pull/2332)). Nothing is blocked, stale or parked.

## Health

- **Heavy background tests still red on main**, three runs in a row including the newest commit ([latest run](https://github.com/christianspliid-ui/threadbare/actions/runs/38134727282), [previous](https://github.com/christianspliid-ui/threadbare/actions/runs/38132422938)). Earlier runs showed two tests running out of time, not a broken game. The builder owes a fix and an impediment row.
- Everything else is green: the engine runs at 107 ms/tick (9% faster than its weekly median), the live site serves the latest commit, automated checks are normal, all 11 scheduled lanes are on time, and the cleanup job ran at 13:40.
