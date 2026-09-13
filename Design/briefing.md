# Briefing
**Generated:** 2026-09-13 03:58 local (01:58 UTC) · keep-work-flowing-cc

## The one thing

**Still the sitting: two encounters left.** [THR-1220](https://linear.app/threadbare/issue/THR-1220) — the integrated slice checkpoint, unchanged and waiting whenever you next sit down.

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

**The question: is the integrated encounter experience at an acceptable state?** A pass charters the hub map — factions, war, economy and divine actions all hang off this interface.

**Neither screen changed this hour, and I checked rather than assumed.** One thing merged — clicking a name inside the whisper that warns you about someone now opens *that* person's sheet instead of whoever you last had selected ([THR-1461](https://linear.app/threadbare/issue/THR-1461), [#1929](https://github.com/christianspliid-ui/threadbare/pull/1929), merged 03:27). Its diff touches only the premonition pop-up and the screen that mounts it; neither of your two routes renders either. The three blemishes from the last brief are unchanged and all three remain decided, not asks: a factor line that is not a sentence ([THR-1494](https://linear.app/threadbare/issue/THR-1494) — fix still open, now also conflicted, see Health), a cast name colliding with a title-form NPC ([THR-1466](https://linear.app/threadbare/issue/THR-1466)), and sixteen reward recipes that promise a prize and draw nothing ([THR-1496](https://linear.app/threadbare/issue/THR-1496) — none reachable from these two). A raw `{cast:…}` token on either screen would be new, and worth telling me.

## Also waiting (2)

- **Fog or witness?** A stranger's sheet shows you almost nothing, even about the encounter you just watched. *(— from tb-orchestrator)*

  Click a mortal you barely know and their sheet reads *"Vara carries no known possessions, conditions, powers, or agreements"* — at the moment the encounter has just wounded and exhausted her. The wound is real and on the world's books; the sheet withholds it because you have not earned knowledge of her. For a mortal you are bonded to, everything shows.

  That is the knowledge system working as designed, but it sits against what you asked the name-click *for*. **Should an encounter's own consequences be exempt from the familiarity gate — because you were there and watched it happen — or does the fog stay honest?** Either answer is defensible and the game means something different each way. Saying nothing leaves it as-is, which is also a real answer. You will likely meet it during the sitting.

- **What is a player allowed to leaf through?** Four questions about what the codex is *for* — all **557 encounters** browsable or only the ones already lived; whether **omens** lose something if you can look them up; whether an **ambition** and a **companion** are definition pages or only read off the person carrying them. Filed as [THR-1495](https://linear.app/threadbare/issue/THR-1495); nothing is broken while these sit. *(— from tb-orchestrator)*

## Queue

**Healthy — 15 ready, 1 in dev, nothing parked, nothing stale.**

- **Two new repairs joined the build queue, and both came out of last night's own finished work rather than from a plan.** *(— from tb-orchestrator)* [THR-1500](https://linear.app/threadbare/issue/THR-1500) — in four more places on screen, clicking a person's name opens the wrong person's sheet; the same defect the merge above fixed on the whisper, measured and set aside so each surface could be proven separately. [THR-1499](https://linear.app/threadbare/issue/THR-1499) — a realm's court can change how it feels about a mortal, the game says so, and the crown's name is then the one thing on the card you cannot click; guilds can be clicked, only realms cannot. Neither needs you.
- **The one job in flight is stuck, not moving.** [THR-1494](https://linear.app/threadbare/issue/THR-1494) — the factor line that is not a sentence — has had no push in two and a half hours and its fix has now also picked up a merge conflict. See Health.
- **The standing request for a design sitting is four items deep and has not moved for five orchestrator runs.** *(— from tb-orchestrator)* Four pieces of work all queued behind the same thing: [ambitions nothing can act on](https://linear.app/threadbare/issue/THR-1348), [beasts that cannot be cast in a scene](https://linear.app/threadbare/issue/THR-1274), [six content kinds with no reference page](https://linear.app/threadbare/issue/THR-1495) (the codex ask above), and [which kind of work should stir which kind of trouble](https://linear.app/threadbare/issue/THR-1497). None is urgent alone; all four want one afternoon. Not an ask on top of the sitting — noted so it is visible when the sitting closes.
- **All three design maps are still finished waiting.** Every piece of homework an agent could do on **fights**, **items** and **powers & spellcraft** is done — twenty-one research tickets, all closed. Twelve questions remain and each is one only you can answer. Deliberately not chased while the sitting is live — say **"work the map"** in a chat when it is done and they get worked one at a time. *(— from tb-orchestrator)*

## Health

- **The one open PR got worse, not better, and still nobody has touched it.** [#1927](https://github.com/christianspliid-ui/threadbare/pull/1927) (the THR-1494 fix) now has *both* a failing `Test · Typecheck · Build` — [the failing run](https://github.com/christianspliid-ui/threadbare/actions/runs/34725032530/job/103637602344) — and a merge conflict against main, picked up as other work landed around it. Auto-merge has been armed since 01:17 and cannot fire through either. No new push since 01:18; the owning session has to resolve the conflict *and* read the failure, because clearing one leaves it unmergeable on the other. Nothing here is yours.
- **Everything else is green.** CI and all three post-merge jobs green on the newest main, all nine lanes on schedule, reaper ran at 03:40. The site is serving the newest commit. Engine speed is 62 ms/tick — **22% faster** than the seven-day median across 98 measurements.
- **The lane-silence probe still reports the same three old gaps, and still is not being carried to you.** All three are overnight-shaped — the pattern you ruled normal on 8 August and extended to weekends on 11 September; the newest ended Friday morning and the other two are four and six days past, all self-resolved. The probe's window is long enough that resolved gaps never age out of it, which is why this line repeats — a calibration matter for the lane, logged for the weekly review rather than raised with you.
