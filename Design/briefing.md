# Briefing
**Generated:** 2026-09-13 00:55 local (22:55 UTC) · keep-work-flowing-cc

## The one thing

**Still the sitting: two encounters left.** [THR-1220](https://linear.app/threadbare/issue/THR-1220) — the integrated slice checkpoint, unchanged from last hour and waiting whenever you next sit down.

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

**The question: is the integrated encounter experience at an acceptable state?** A pass charters the hub map — factions, war, economy and divine actions all hang off this interface.

One merge landed since the last brief and **it did not touch either screen** — no authored line on the bridge or the caravan has changed under you. Three blemishes are already decided and are still not asks: a factor line that is not a sentence ([THR-1494](https://linear.app/threadbare/issue/THR-1494)), a cast name colliding with a title-form NPC ([THR-1466](https://linear.app/threadbare/issue/THR-1466)), and sixteen encounters that promise a reward and draw nothing ([THR-1496](https://linear.app/threadbare/issue/THR-1496) — army, tavern, quest and anomaly scenes, none reachable from these two). Read past them. A raw `{cast:…}` token anywhere on these two screens would be new, and worth telling me.

## Also waiting (2)

- **Fog or witness?** A stranger's sheet shows you almost nothing, even about the encounter you just watched. *(— from tb-orchestrator)*

  Click a mortal you barely know and their sheet reads *"Vara carries no known possessions, conditions, powers, or agreements"* — at the moment the encounter has just wounded and exhausted her. The wound is real and on the world's books; the sheet withholds it because you have not earned knowledge of her. For a mortal you are bonded to, everything shows.

  That is the knowledge system working as designed, but it sits against what you asked the name-click *for*. **Should an encounter's own consequences be exempt from the familiarity gate — because you were there and watched it happen — or does the fog stay honest?** Either answer is defensible and the game means something different each way. Saying nothing leaves it as-is, which is also a real answer. You will likely meet it during the sitting.

- **What is a player allowed to leaf through?** Four questions about what the codex is *for* — all **557 encounters** browsable or only the ones already lived; whether **omens** lose something if you can look them up; whether an **ambition** and a **companion** are definition pages or only read off the person carrying them. Filed as [THR-1495](https://linear.app/threadbare/issue/THR-1495); nothing is broken while these sit. *(— from tb-orchestrator)*

## Queue

**Backed up — 16 ready, nothing in dev, nothing parked, nothing stale.**

- **The five-part content-model rebuild is finished.** [THR-1489](https://linear.app/threadbare/issue/THR-1489) merged at 00:45 — the last piece, and the one that keeps the rest honest: the authoring machinery now *counts* how often content reaches other content by family rather than by exact name, so the capability that revived 48 dead sequels last hour cannot quietly rot again. All five slices landed between roughly 4pm and 12:45am. Nothing in this chain needs you.
- **The board is idle again, and that is the normal overnight shape.** Nothing is in dev; the pickup lane runs at the top of each hour and there are sixteen unclaimed items for it. Six are low-priority deferrals, nothing is Urgent or High, and nothing has sat longer than a week.
- **Two follow-ons remain filed rather than fixed, both by agent decision, both open to your veto.** [THR-1497](https://linear.app/threadbare/issue/THR-1497) — the repaired plumbing that lets a finished undertaking stir up a follow-up encounter is unreachable, because it was wired onto the retired half of the undertaking system; which kind of work should stir which kind of trouble is a content-authoring judgment, so it goes to a design sitting. [THR-1498](https://linear.app/threadbare/issue/THR-1498) — in Gate Duty's ending, entity names render as plain text where they should be clickable. Neither needs you. *(— from tb-orchestrator)*
- **All three design maps are still finished waiting.** Every piece of homework an agent could do on **fights**, **items** and **powers & spellcraft** is done — twenty-one research tickets, all closed. Twelve questions remain and each is one only you can answer. Deliberately not chased while the sitting is live — say **"work the map"** in a chat when it is done and they get worked one at a time. *(— from tb-orchestrator)*

## Health

- **All green.** Site serving the newest commit on main (`e855b8b4`). CI and all three post-merge jobs green, no PR open or waiting to merge, all nine lanes on schedule, reaper ran at 00:40. Engine speed is 59 ms/tick — **28% faster** than the seven-day median across 95 measurements.
- **The lane-silence probe still reports the same three old gaps, and still is not being carried to you.** The newest ended Saturday morning — the weekend shape you ruled normal on 11 September. The two older ones are four and five days past, self-resolved, and the machine has shipped a dozen times since; an answer now would change nothing. The probe's window is long enough that resolved gaps never age out of it, which is why this line repeats — a calibration matter for the lane, logged for the weekly review rather than raised with you.
