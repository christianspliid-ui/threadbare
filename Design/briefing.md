# Briefing
**Generated:** 2026-10-10 20:55 local (18:55 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** Every recent lane silence began when the computer started or woke and the app did not reopen. Only you can change that setting. Say "done" and the next silence check will confirm it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

The silence check still reports the Tuesday-to-Thursday gap this setting is meant to close: *"The scheduled lanes went silent for 31.8h (2026-10-06T20:56:43.000Z → 2026-10-08T04:42:41.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."*

## Also waiting (3)

- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [The opening gifts open on top of whatever the player just clicked](https://linear.app/threadbare/issue/THR-1805/the-opening-gifts-open-on-top-of-whatever-the-player-just-clicked) — **a gift from the opening now waits its turn.** It never opens over something you opened yourself (a mortal's profile, the cast drawer, the Chapter Ledger, the Codex), and never within 2 seconds of a click. Until then it waits as a small pill at the top of the screen: "✦ A GIFT WAITS — A Place to Stand · Open ▸". It opens by itself once your screen is clear, or straight away if you click the pill. "Reach Down" still opens at once. All three round-3 testers hit this. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-10-thr-1805-gift-waits-its-turn.md). *To veto, say:* **"gifts should only open when I click them"** or **"gifts should open the moment they're ready"**. Building waits until about 20:35 Sunday your time. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-10c.md)*
- [How the god's own power grows](https://linear.app/threadbare/issue/THR-1765/how-the-gods-own-power-grows-what-raises-the-gods-sphere-score-across) — your god grows by spending through its spheres: essence drawn through a sphere it bought attunes it a little further, and the mandate's milestones lift it as today. About five growth steps a run, roughly one every two to four weeks. Growth firms up friendly ground and makes signature powers strike harder. Turf stops widening at double strength; past that, deeper ground is won place by place. Nothing fades if you stop spending; you simply stop growing. *To veto, say:* **"my god should keep growing its land"**, **"power should come from deeds, not spending"** or **"unspent power should fade"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-10b.md)*
- [Dominion of the secondary actors](https://linear.app/threadbare/issue/THR-1764/dominion-of-the-secondary-actors-how-a-faction-an-army-a-company-or-an) — factions, armies, companies and relics read the people or ground they are made of. A mortal you **bestow** a gift on spreads your spheres faster. A faction you **anoint** keeps its towns on your ground tended and shrugs off one rival raid, but does not grow your turf. Your faithful armies don't fight better on your land by themselves. *To veto, say:* **"my faithful should win on my land"**, **"a relic should hold ground on its own"** or **"anointing should spread my turf, not just defend it"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-10a.md)*

Say "veto <title>" to reverse any of these.

## Queue

**Healthy but thin: 2 jobs ready, 1 being built.** Neither ready job is older than 2 days or blocked; no parked jobs.

- **Being built now:** a fix so the health check stops calling a test run "failing" after a re-run of the same commit passed ([THR-1776](https://linear.app/threadbare/issue/THR-1776/the-main-red-probe-ignores-a-green-re-run-of-the-same-commit-the)) — up as [#2311](https://github.com/christianspliid-ui/threadbare/pull/2311), waiting on checks and set to merge on its own.
- **Ready:** the gift-waits-its-turn build ([THR-1809](https://linear.app/threadbare/issue/THR-1809/a-ready-opening-gift-waits-for-a-quiet-moment-never-opens-over-a)) — held until Sunday ~20:35 for your veto window; and a machinery fix to the review gate ([THR-1795](https://linear.app/threadbare/issue/THR-1795/review-gate-hook-judges-the-wrong-push-an-armed-pr-merged-before-its)).
- **Now live:** the glossary entry for "The First", "Rite of the Thread" and "the god's mark" ([THR-1756](https://linear.app/threadbare/issue/THR-1756/ul-proposal-the-first-the-first-mortal-the-god-threads-any-route-add), via [#2308](https://github.com/christianspliid-ui/threadbare/pull/2308)).

## Health

- **Heavy simulation tests are still red on the latest main** ([CI runs](https://github.com/christianspliid-ui/threadbare/actions/workflows/heavy-tests.yml)): *"\"Heavy simulation tests\" is red on the latest main (4 h) — a follow-up fix is owed; log it as an impediment row if no session has claimed it."* No session has claimed the fix itself. Executor work, not yours.
- Overnight quiet Friday 20:34 → Saturday 11:26 (14.9 h) is the normal night-and-weekend shape; not an ask.
- Everything else is green. The live site is current (only docs merged since the last publish), no pull requests are stuck, automated checks run normally, every scheduled lane is on time, and the speed check is back to normal (132 ms/tick, +10% vs the weekly median).
