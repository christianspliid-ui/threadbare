# User Action Required

**Last updated:** 2026-08-10 17:20 local (15:20 UTC). Restructured to standing-asks-only per [THR-1077](https://linear.app/threadbare/issue/THR-1077/designuser-actionsmd-has-grown-into-a-run-by-run-diary-christians), directed by Christian in chat 2026-08-10. Everything this file used to carry — run measurements, findings, narration — lives in its history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. The play sitting — two rulings over the same five encounters

**Session A — the four-part verdict** ([THR-907](https://linear.app/threadbare/issue/THR-907)): does the prose read clear, does the firing rhythm work, is the interface gamey enough, and is deciding actually fun. *"Needs another iteration"* is a valid answer on any of the four.

**Session B — the consequence verdict** ([THR-974](https://linear.app/threadbare/issue/THR-974)): play a hand to its ending and say whether the change to the world is **visible**, and whether it feels like it **happened in the world** rather than being announced at you.

- [The bargain at the crossroads](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads) · [Riders behind the caravan](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan) · [Snow on the pass](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass) · [The swindled family](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family) · [The unsafe bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)

Add `&outcome=critical_failure` (or `success`, `failure`, `near_miss`, `success_at_cost`, `critical_success`) to any link to reach that ending directly; where nobody has written that ending yet you get the normal one. The [demo-ready checkpoint (THR-986)](https://linear.app/threadbare/issue/THR-986) rides on this same sitting, but is still blocked on thirteen of its own tickets either way.

### 2. While you play: does the encounter ending appear on its own now?

You reported on 2026-08-06 that it didn't — you had to click the badge on the agent's thread. Both halves of that cause shipped and were verified against your repro. **No reply needed if it works.** If it doesn't, say so and it gets a fresh ticket — a recurrence now would be a different bug.

### 3. Action cards print a risk that isn't real ([THR-998](https://linear.app/threadbare/issue/THR-998))

Cards read "a steady / uncertain / perilous working", but for 85% of castable cards the number behind the word cannot move the odds at all. **(a)** make the word track the odds the cast will actually roll; **(b)** stop printing a risk word where the odds are flat and print something true instead — scale or cost; **(c)** lower the floors so authored danger bites again (also changes how mortals resolve everything). **Recommendation: (b)** — if the danger doesn't vary, a danger word is the wrong thing to print.

### 4. Two small sound decisions ([THR-962](https://linear.app/threadbare/issue/THR-962), [THR-961](https://linear.app/threadbare/issue/THR-961))

Routing the encounter sound cues to the new screen, and how those cues feel. Both need your ears, not a screen.

### 5. Parked option, no urgency: a Tenacious-style trait

Open option, explicitly not urgent. Safe default is "stays parked."

## Resolved this period

- 2026-08-10: [THR-1064](https://linear.app/threadbare/issue/THR-1064) closed not-a-defect — you closed it 116 seconds after the re-ask.
- 2026-08-10: "drop and re-author" ruling applied to the whole paused content shelf (THR-848/855/856/858/859/861/863/864).
- 2026-08-09: the encounter-writing format locked ([THR-883](https://linear.app/threadbare/issue/THR-883)) — the eleven paused content tickets unblocked.
- 2026-08-09: the process-ticket rule confirmed binding forward ([THR-871](https://linear.app/threadbare/issue/THR-871)).
- 2026-08-08: "overnight quiet is normal" — the lane-silence probe's nightly gaps are declined standing.

---
*Refreshed hourly by `keep-work-flowing-cc`. Full history of every prior version: `git log -p origin/ops -- Design/user-actions.md`.*
