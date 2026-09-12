# Briefing
**Generated:** 2026-09-12 23:58 local (21:58 UTC) · keep-work-flowing-cc

## The one thing

**Two encounters left in the sitting, and the queue has gone quiet behind you.** [THR-1220](https://linear.app/threadbare/issue/THR-1220) — the integrated slice checkpoint. Nothing is being built right now for the first time today; everything your four morning batches produced is shipped and serving, and the live site is on the newest commit.

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

**The question: is the integrated encounter experience at an acceptable state?** A pass charters the hub map — factions, war, economy and divine actions all hang off this interface.

Two merges landed in the last hour and **neither touched these two screens** — no authored line on either encounter has changed under you. One of them is worth knowing about anyway: an encounter ending was printing a raw `{cast:suspect_courier}` where a courier's name belonged, found by a screenshot sweep and fixed at 23:36 ([THR-1459](https://linear.app/threadbare/issue/THR-1459)). That was **Gate Duty**, a quest scene, not one of the five. If you see a raw `{…}` token on the bridge or the caravan, that is a new fault and worth telling me.

Still already-decided and still not asks: a factor line that is not a sentence ([THR-1494](https://linear.app/threadbare/issue/THR-1494)), a cast name colliding with a title-form NPC ([THR-1466](https://linear.app/threadbare/issue/THR-1466)), and sixteen encounters that promise a reward and draw nothing ([THR-1496](https://linear.app/threadbare/issue/THR-1496) — all sixteen are army, tavern, quest and anomaly scenes, none reachable from these two). Read past them.

## Also waiting (2)

- **Fog or witness?** A stranger's sheet shows you almost nothing, even about the encounter you just watched. *(— from tb-orchestrator)*

  Click a mortal you barely know and their sheet reads *"Vara carries no known possessions, conditions, powers, or agreements"* — at the moment the encounter has just wounded and exhausted her. The wound is real and on the world's books; the sheet withholds it because you have not earned knowledge of her. For a mortal you are bonded to, everything shows.

  That is the knowledge system working as designed, but it sits against what you asked the name-click *for*. **Should an encounter's own consequences be exempt from the familiarity gate — because you were there and watched it happen — or does the fog stay honest?** Either answer is defensible and the game means something different each way. Saying nothing leaves it as-is, which is also a real answer. You will likely meet it during the sitting.

- **What is a player allowed to leaf through?** Four questions about what the codex is *for* — all **557 encounters** browsable or only the ones already lived; whether **omens** lose something if you can look them up; whether an **ambition** and a **companion** are definition pages or only read off the person carrying them. Filed as [THR-1495](https://linear.app/threadbare/issue/THR-1495); nothing is broken while these sit. *(— from tb-orchestrator)*

## Queue

**Backed up — 17 ready, nothing in dev, nothing parked, nothing stale.**

- **Both things that were being built have landed, and nothing has replaced them.** [THR-1488](https://linear.app/threadbare/issue/THR-1488) merged at 23:08 — content can now find other content by family instead of by exact name, which revived **48 sequels that were silently dead**. [THR-1459](https://linear.app/threadbare/issue/THR-1459) merged at 23:36 — the raw-token ending above. The board is idle: the next pickup lane runs at the top of the hour and [THR-1489](https://linear.app/threadbare/issue/THR-1489), the last piece of the content-model rebuild, is top of the queue and unclaimed. Healthy, not a stall.
- **Two follow-ons were filed rather than fixed in place, both by agent decision, both open to your veto.** [THR-1497](https://linear.app/threadbare/issue/THR-1497) — a repaired piece of plumbing that lets a finished undertaking stir up a follow-up encounter turns out to be unreachable, because it was wired onto the retired half of the undertaking system; which kind of work should stir which kind of trouble is a content-authoring judgment, so it goes to a design sitting. [THR-1498](https://linear.app/threadbare/issue/THR-1498) — in the same Gate Duty ending, entity names render as plain text where they should be clickable. Neither needs you. *(— from tb-orchestrator)*
- **All three design maps are still finished waiting.** Every piece of homework an agent could do on **fights**, **items** and **powers & spellcraft** is done — twenty-one research tickets, all closed. Twelve questions remain and each is one only you can answer; nothing further can be designed or built on any of them until you do. Deliberately not chased while the sitting is live — say **"work the map"** in a chat when it is done and they get worked one at a time. *(— from tb-orchestrator)*
- **Nothing else is stuck.** No PR is open anywhere, six of the 17 ready items are low-priority deferrals, and nothing has sat longer than a week.

## Health

- **All green.** Site serving the newest commit on main (`987feb3d`). CI and all three post-merge jobs green, no PR waiting to merge, all nine lanes on schedule, reaper ran at 23:40. Engine speed is 59 ms/tick — **30% faster** than the seven-day median across 94 measurements.
- **The lane-silence probe still reports the same three old gaps, and still is not being carried to you.** The newest ended this morning — the weekend shape you ruled normal on 11 September. The two older ones are four and five days past, self-resolved, and the machine has shipped a dozen times since; an answer now would change nothing. The probe's window is long enough that resolved gaps never age out of it, which is why this line repeats — a calibration matter for the lane, logged for the weekly review rather than raised with you.
