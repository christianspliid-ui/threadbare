# Briefing
**Generated:** 2026-09-13 02:57 local (00:57 UTC) · keep-work-flowing-cc

## The one thing

**Still the sitting: two encounters left.** [THR-1220](https://linear.app/threadbare/issue/THR-1220) — the integrated slice checkpoint, unchanged and waiting whenever you next sit down.

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

**The question: is the integrated encounter experience at an acceptable state?** A pass charters the hub map — factions, war, economy and divine actions all hang off this interface.

**Neither screen changed this hour.** One thing merged — new Realm content, three scenes about being called to court, levied at a border, and asked for a tithe ([THR-1454](https://linear.app/threadbare/issue/THR-1454)) — and I checked its diff rather than assuming: it adds new encounters and touches nothing in either of yours. The three blemishes from the last brief are unchanged: a factor line that is not a sentence ([THR-1494](https://linear.app/threadbare/issue/THR-1494) — fix still open and still not landing, see Health), a cast name colliding with a title-form NPC ([THR-1466](https://linear.app/threadbare/issue/THR-1466)), and sixteen reward recipes that promise a prize and draw nothing ([THR-1496](https://linear.app/threadbare/issue/THR-1496) — none reachable from these two). All three are decided, none is an ask. A raw `{cast:…}` token on either screen would be new, and worth telling me.

## Also waiting (2)

- **Fog or witness?** A stranger's sheet shows you almost nothing, even about the encounter you just watched. *(— from tb-orchestrator)*

  Click a mortal you barely know and their sheet reads *"Vara carries no known possessions, conditions, powers, or agreements"* — at the moment the encounter has just wounded and exhausted her. The wound is real and on the world's books; the sheet withholds it because you have not earned knowledge of her. For a mortal you are bonded to, everything shows.

  That is the knowledge system working as designed, but it sits against what you asked the name-click *for*. **Should an encounter's own consequences be exempt from the familiarity gate — because you were there and watched it happen — or does the fog stay honest?** Either answer is defensible and the game means something different each way. Saying nothing leaves it as-is, which is also a real answer. You will likely meet it during the sitting.

- **What is a player allowed to leaf through?** Four questions about what the codex is *for* — all **557 encounters** browsable or only the ones already lived; whether **omens** lose something if you can look them up; whether an **ambition** and a **companion** are definition pages or only read off the person carrying them. Filed as [THR-1495](https://linear.app/threadbare/issue/THR-1495); nothing is broken while these sit. *(— from tb-orchestrator)*

## Queue

**Healthy — 14 ready, 2 in dev, nothing parked, nothing stale.**

- **The Realm got a court.** [THR-1454](https://linear.app/threadbare/issue/THR-1454) was claimed, built and merged inside the hour ([#1928](https://github.com/christianspliid-ui/threadbare/pull/1928), merged 02:55). It is the first content that actually spends the Realm — three scenes where a mortal is summoned to court, stopped for a border levy, or asked for a tithe. Until now the Realm existed as a thing the world knew about and nothing ever asked you to feel. Nothing in it needs you, and it does not touch the sitting.
- **The other in-flight ticket is stuck, not moving.** [THR-1494](https://linear.app/threadbare/issue/THR-1494) — the factor line that is not a sentence — still has its fix open as [#1927](https://github.com/christianspliid-ui/threadbare/pull/1927), failing and untouched for an hour and a half. See Health.
- **Two follow-ons stay filed rather than fixed, both by agent decision, both open to your veto.** [THR-1497](https://linear.app/threadbare/issue/THR-1497) — the repaired plumbing that lets a finished undertaking stir up a follow-up encounter is unreachable, because it was wired onto the retired half of the undertaking system; which kind of work should stir which kind of trouble is a content-authoring judgment, so it goes to a design sitting. [THR-1498](https://linear.app/threadbare/issue/THR-1498) — in Gate Duty's ending, entity names render as plain text where they should be clickable. *(— from tb-orchestrator)*
- **All three design maps are still finished waiting.** Every piece of homework an agent could do on **fights**, **items** and **powers & spellcraft** is done — twenty-one research tickets, all closed. Twelve questions remain and each is one only you can answer. Deliberately not chased while the sitting is live — say **"work the map"** in a chat when it is done and they get worked one at a time. *(— from tb-orchestrator)*

## Health

- **One open PR still will not merge on its own, and nobody has touched it in 90 minutes.** [#1927](https://github.com/christianspliid-ui/threadbare/pull/1927) (the THR-1494 fix) has a failing `Test · Typecheck · Build` — [the failing run](https://github.com/christianspliid-ui/threadbare/actions/runs/34725032530/job/103637602344). Auto-merge is armed and simply never fires, so it reads as shipped everywhere except the check itself. No new push since 01:18; the owning session has to read the failure and push a fix. Nothing here is yours.
- **Everything else is green.** CI and all three post-merge jobs green, all nine lanes on schedule, reaper ran at 02:40. The site was serving the newest commit when probed; the Realm-court deploy went out minutes later and lands on its own. Engine speed is 59 ms/tick — **27% faster** than the seven-day median across 97 measurements.
- **The lane-silence probe still reports the same three old gaps, and still is not being carried to you.** Newest ended Saturday morning — the weekend shape you ruled normal on 11 September; the two older ones are four and five days past and self-resolved. The probe's window is long enough that resolved gaps never age out of it, which is why this line repeats — a calibration matter for the lane, logged for the weekly review rather than raised with you.
