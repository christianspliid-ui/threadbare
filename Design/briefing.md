# Briefing
**Generated:** 2026-09-13 01:58 local (23:58 UTC) · keep-work-flowing-cc

## The one thing

**Still the sitting: two encounters left.** [THR-1220](https://linear.app/threadbare/issue/THR-1220) — the integrated slice checkpoint, unchanged and waiting whenever you next sit down.

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

**The question: is the integrated encounter experience at an acceptable state?** A pass charters the hub map — factions, war, economy and divine actions all hang off this interface.

**Nothing has changed on either screen since the last brief.** I re-checked that the seven tickets your own 12 September review produced are landed, not merely filed: the chip nouns, the chip sentence cap, the condition hover, the name-click, the place-and-time prose rule and the nudge header are all merged. The one still open ([THR-1467](https://linear.app/threadbare/issue/THR-1467) — two identical `BOON · STONE` chips) is on *Snow on the Pass*, which you have already played, so it is not in front of you tonight.

Two blemishes are still decided-not-asks and still worth reading past: a cast name colliding with a title-form NPC ([THR-1466](https://linear.app/threadbare/issue/THR-1466)), and sixteen encounters that promise a reward and draw nothing ([THR-1496](https://linear.app/threadbare/issue/THR-1496) — army, tavern, quest and anomaly scenes, none reachable from these two). The third, a factor line that is not a sentence ([THR-1494](https://linear.app/threadbare/issue/THR-1494)), now has a fix in flight — it has **not** landed, so the line still reads as you saw it. A raw `{cast:…}` token anywhere on these two screens would be new, and worth telling me.

## Also waiting (2)

- **Fog or witness?** A stranger's sheet shows you almost nothing, even about the encounter you just watched. *(— from tb-orchestrator)*

  Click a mortal you barely know and their sheet reads *"Vara carries no known possessions, conditions, powers, or agreements"* — at the moment the encounter has just wounded and exhausted her. The wound is real and on the world's books; the sheet withholds it because you have not earned knowledge of her. For a mortal you are bonded to, everything shows.

  That is the knowledge system working as designed, but it sits against what you asked the name-click *for*. **Should an encounter's own consequences be exempt from the familiarity gate — because you were there and watched it happen — or does the fog stay honest?** Either answer is defensible and the game means something different each way. Saying nothing leaves it as-is, which is also a real answer. You will likely meet it during the sitting.

- **What is a player allowed to leaf through?** Four questions about what the codex is *for* — all **557 encounters** browsable or only the ones already lived; whether **omens** lose something if you can look them up; whether an **ambition** and a **companion** are definition pages or only read off the person carrying them. Filed as [THR-1495](https://linear.app/threadbare/issue/THR-1495); nothing is broken while these sit. *(— from tb-orchestrator)*

## Queue

**Healthy — 15 ready, 1 in dev, nothing parked, nothing stale.**

- **The board is working again.** A session picked up [THR-1494](https://linear.app/threadbare/issue/THR-1494) — the factor line that is not a sentence — and has a fix open as [#1927](https://github.com/christianspliid-ui/threadbare/pull/1927). It is not merging yet; see Health.
- **The five-part content-model rebuild is finished and closed out.** All five slices landed between roughly 4pm and 12:45am. Content can now find other content by family instead of by exact name, and the last slice teaches the authoring machinery to *count* how often that happens, so the capability that revived 48 dead sequels cannot quietly rot again. Nothing in this chain needs you.
- **Two follow-ons remain filed rather than fixed, both by agent decision, both open to your veto.** [THR-1497](https://linear.app/threadbare/issue/THR-1497) — the repaired plumbing that lets a finished undertaking stir up a follow-up encounter is unreachable, because it was wired onto the retired half of the undertaking system; which kind of work should stir which kind of trouble is a content-authoring judgment, so it goes to a design sitting. [THR-1498](https://linear.app/threadbare/issue/THR-1498) — in Gate Duty's ending, entity names render as plain text where they should be clickable. *(— from tb-orchestrator)*
- **All three design maps are still finished waiting.** Every piece of homework an agent could do on **fights**, **items** and **powers & spellcraft** is done — twenty-one research tickets, all closed. Twelve questions remain and each is one only you can answer. Deliberately not chased while the sitting is live — say **"work the map"** in a chat when it is done and they get worked one at a time. *(— from tb-orchestrator)*

## Health

- **One open PR will not merge on its own.** [#1927](https://github.com/christianspliid-ui/threadbare/pull/1927) (the THR-1494 fix) has a failing `Test · Typecheck · Build` — [the failing run](https://github.com/christianspliid-ui/threadbare/actions/runs/34725032530/job/103637602344). Auto-merge is armed and simply never fires, which reads as shipped everywhere except the check itself. The session that owns it has to read the failure and push a fix; nothing here is yours.
- **Everything else is green.** Site serving the newest commit on main (`e855b8b4`). CI and all three post-merge jobs green, all nine lanes on schedule, reaper ran at 01:40. Engine speed is 58 ms/tick — **28% faster** than the seven-day median across 96 measurements.
- **The lane-silence probe still reports the same three old gaps, and still is not being carried to you.** Newest ended Saturday morning — the weekend shape you ruled normal on 11 September; the two older ones are four and five days past and self-resolved. The probe's window is long enough that resolved gaps never age out of it, which is why this line repeats — a calibration matter for the lane, logged for the weekly review rather than raised with you.
