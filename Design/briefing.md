# Briefing
**Generated:** 2026-09-13 04:58 local (02:58 UTC) · keep-work-flowing-cc

## The one thing

**Still the sitting: two encounters left.** [THR-1220](https://linear.app/threadbare/issue/THR-1220) — the integrated slice checkpoint, unchanged and waiting whenever you next sit down.

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

**The question: is the integrated encounter experience at an acceptable state?** A pass charters the hub map — factions, war, economy and divine actions all hang off this interface.

**Nothing at all shipped this hour, and I checked rather than assumed.** The live site, the main line and your machine are all sitting on the same commit as an hour ago ([b3581662](https://github.com/christianspliid-ui/threadbare/commit/b3581662)) — no merge landed, so neither of your two screens can have moved. The three blemishes from the last brief are unchanged and all three remain decided, not asks: a factor line that is not a sentence ([THR-1494](https://linear.app/threadbare/issue/THR-1494) — fix still open, still failing and still conflicted, see Health), a cast name colliding with a title-form NPC ([THR-1466](https://linear.app/threadbare/issue/THR-1466)), and sixteen reward recipes that promise a prize and draw nothing ([THR-1496](https://linear.app/threadbare/issue/THR-1496) — none reachable from these two). A raw `{cast:…}` token on either screen would be new, and worth telling me.

## Also waiting (2)

- **Fog or witness?** A stranger's sheet shows you almost nothing, even about the encounter you just watched. *(— from tb-orchestrator)*

  Click a mortal you barely know and their sheet reads *"Vara carries no known possessions, conditions, powers, or agreements"* — at the moment the encounter has just wounded and exhausted her. The wound is real and on the world's books; the sheet withholds it because you have not earned knowledge of her. For a mortal you are bonded to, everything shows.

  That is the knowledge system working as designed, but it sits against what you asked the name-click *for*. **Should an encounter's own consequences be exempt from the familiarity gate — because you were there and watched it happen — or does the fog stay honest?** Either answer is defensible and the game means something different each way. Saying nothing leaves it as-is, which is also a real answer. You will likely meet it during the sitting.

- **What is a player allowed to leaf through?** Four questions about what the codex is *for* — all **557 encounters** browsable or only the ones already lived; whether **omens** lose something if you can look them up; whether an **ambition** and a **companion** are definition pages or only read off the person carrying them. Filed as [THR-1495](https://linear.app/threadbare/issue/THR-1495); nothing is broken while these sit. *(— from tb-orchestrator)*

## Queue

**Healthy — 15 ready, 1 in dev, nothing parked, nothing stale.**

- **One job joined the build queue, and it is a keyboard trap in something you shipped yesterday.** *(— from tb-orchestrator)* [THR-1024](https://linear.app/threadbare/issue/THR-1024) — the pop-up panels that open when you click a name, a place or a faction do not announce themselves to a screen reader, and keyboard focus never moves into them or back out. Escape still closes them, so nobody is stuck; it is a panel a keyboard user cannot get inside of. It has sat filed since August waiting on a decision — mount these panels or delete them — and yesterday's *one card, one router* work settled that by mounting them. Needs nothing from you.
- **The one job in flight has not moved in three and a half hours.** [THR-1494](https://linear.app/threadbare/issue/THR-1494) — the factor line that is not a sentence — still has an open fix that is both failing its checks and conflicted against main. See Health.
- **The standing request for a design sitting grew from four items to five, and the fifth is yours by authorship.** *(— from tb-orchestrator)* When you ruled on encounter firing in August you said *"rhythm works — prune later"* and chartered the pruning pass as that later; it was waiting on the Encounter Factory, which finished Thursday. So [how often encounters should fire](https://linear.app/threadbare/issue/THR-1218) now joins [ambitions nothing can act on](https://linear.app/threadbare/issue/THR-1348), [beasts that cannot be cast in a scene](https://linear.app/threadbare/issue/THR-1274), [six content kinds with no reference page](https://linear.app/threadbare/issue/THR-1495) (the codex ask above), and [which kind of work should stir which kind of trouble](https://linear.app/threadbare/issue/THR-1497). None is urgent alone; all five want one afternoon. Not an ask on top of the sitting — noted so it is visible when the sitting closes.
- **All three design maps are still finished waiting.** Every piece of homework an agent could do on **fights**, **items** and **powers & spellcraft** is done — twenty-one research tickets and five agent-doable tasks, all closed. Twelve questions remain and each is one only you can answer. Deliberately not chased while the sitting is live — say **"work the map"** in a chat when it is done and they get worked one at a time. *(— from tb-orchestrator)*

## Health

- **The one open PR is unchanged and still untouched — fourth hour.** [#1927](https://github.com/christianspliid-ui/threadbare/pull/1927) (the THR-1494 fix) carries *both* a failing `Test · Typecheck · Build` and a merge conflict against main. Auto-merge has been armed since 01:17 local and can fire through neither. No new push since 01:18 local, now 3h 40m ago. The owning session has to resolve the conflict *and* read the failure, because clearing one leaves it unmergeable on the other. Nothing here is yours.
- **Everything else is green.** CI and all three post-merge jobs green on the newest main, all three scheduled background jobs healthy, all nine lanes on schedule, reaper ran at 04:40. The site is serving the newest commit. Engine speed is 63 ms/tick — **21% faster** than the seven-day median across 99 measurements.
- **The lane-silence probe still reports the same three old gaps, and still is not being carried to you.** All three are overnight-shaped — the pattern you ruled normal on 8 August and extended to weekends on 11 September; the newest ended Friday morning and the other two are four and six days past, all self-resolved. The probe's window is long enough that resolved gaps never age out of it, which is why this line repeats — a calibration matter for the lane, logged for the weekly review rather than raised with you.
