# User Action Required

**Last updated:** 2026-08-12 02:57 local (2026-08-12 00:57 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077/designuser-actionsmd-has-grown-into-a-run-by-run-diary-christians). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. Did you switch the two work lanes off?

Two of the nine scheduled jobs are off — disabled, not merely quiet — and have missed every slot since:

- **`tb-opus-pickup`** — the executor lane. Last ran 22:01, shipped THR-1071, has since skipped 23:01, 00:01, 01:01 and 02:01.
- **`tb-orchestrator`** — decides what gets promoted next. Last ran 21:26, has since skipped 22:25, 23:25, 00:25, 01:25 and 02:25.

No pause marker records it (the marker on disk is an expired historical one from 2026-08-03). **While the executor lane is off, nothing on the board moves** — including work your other rulings would create. The queue has sat unchanged at 21 ready / 0 in flight for five hours.

**If you turned them off: just say so** and a marker gets dropped, which also closes the overnight question below. It would be a coherent follow-through on your 2026-08-10 direction to stop the lanes filing cleanup work — switching off the lane that drains it is the same instinct. **If you didn't:** say that, and it gets investigated as a real stoppage.

**Same question also covers the overnight silence.** No lane wrote anything 2026-08-10 21:57 → 2026-08-11 18:32 local (~20.6 h), with no pause marker covering it.

### 2. The play sitting — two rulings over the same five encounters

**Session A — the four-part verdict** ([THR-907](https://linear.app/threadbare/issue/THR-907)): does the prose read clear, does the firing rhythm work, is the interface gamey enough, and is deciding actually fun. *"Needs another iteration"* is a valid answer on any of the four.

**Session B — the consequence verdict** ([THR-974](https://linear.app/threadbare/issue/THR-974)): play a hand to its ending and say whether the change to the world is **visible**, and whether it feels like it **happened in the world** rather than being announced at you. Both gating tickets shipped; fully unblocked.

- [The bargain at the crossroads](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads) · [Riders behind the caravan](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan) · [Snow on the pass](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass) · [The swindled family](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family) · [The unsafe bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)

Every encounter in the game now runs the format you locked ([THR-1086](https://linear.app/threadbare/issue/THR-1086), 2026-08-11). Add `&outcome=critical_failure` (or `success`, `failure`, `near_miss`, `success_at_cost`, `critical_success`) to any link to reach that ending directly; where nobody has written that ending yet you get the normal one. **This is the only ask that refills the shelf with real work** — the board is 21 cleanup items and zero feature or content work.

### 3. Action cards print a risk that isn't real ([THR-998](https://linear.app/threadbare/issue/THR-998))

Cards read "a steady / uncertain / perilous working", but for 85% of castable cards the number behind the word cannot move the odds at all. **(a)** make the word track the odds the cast will actually roll; **(b)** stop printing a risk word where the odds are flat and print something true instead — scale or cost; **(c)** lower the floors so authored danger bites again (also changes how mortals resolve everything). **Recommendation: (b)** — if the danger doesn't vary, a danger word is the wrong thing to print.

### 4. Two small sound decisions ([THR-962](https://linear.app/threadbare/issue/THR-962), [THR-961](https://linear.app/threadbare/issue/THR-961))

Routing the encounter sound cues to the new screen, and how those cues feel. Both need your ears, not a screen. Both have bounced out of the dev queue twice because an executor cannot close a "Christian hears it" checkbox.

### 5. While you play: does the encounter ending appear on its own now?

You reported on 2026-08-06 that it didn't — you had to click the badge on the agent's thread. Both halves of that cause shipped and were verified against your repro. **No reply needed if it works.** If it doesn't, say so and it gets a fresh ticket — a recurrence now would be a different bug.

### 6. Parked option, no urgency: a Tenacious-style trait

Open option, explicitly not urgent. Safe default is "stays parked."

## Resolved this period

- 2026-08-11: [THR-1071](https://linear.app/threadbare/issue/THR-1071) shipped — mercy no longer makes people crueller. **Your tail question was decided without you, legitimately: stone was exempted from the flip** and given the opposite remedy rather than its value pair renamed. Say the word if you'd rather it had been renamed.
- 2026-08-11: **the cleanup shelf pruned 36 → 21** — ~16 sub-bar process tickets canceled and folded into [THR-1089](https://linear.app/threadbare/issue/THR-1089) and [THR-1090](https://linear.app/threadbare/issue/THR-1090). Your 2026-08-10 materiality bar applied retroactively.
- 2026-08-11: [THR-1086](https://linear.app/threadbare/issue/THR-1086) shipped — the Apotheosis converted off authored choices. **Every encounter in the game now runs the locked format**; the WS5 conversion program is complete.
- 2026-08-11: [THR-866](https://linear.app/threadbare/issue/THR-866) closed — the design look at the apex Ascension encounter, which produced THR-1086 above.
- 2026-08-11: **Linear signed back in** — the connector outage that locked every lane out of the board cleared within the hour, and has stayed closed since.
- 2026-08-10: [THR-1083](https://linear.app/threadbare/issue/THR-1083) shipped — the last screen an encounter shows you was outside every prose check; it is now inside one.
- 2026-08-10: [THR-1064](https://linear.app/threadbare/issue/THR-1064) closed not-a-defect. The investigation behind it is what found the mercy bug above.
- 2026-08-10: "drop and re-author" ruling applied to the whole paused content shelf (THR-848/855/856/858/859/861/863/864).
- 2026-08-09: the encounter-writing format locked ([THR-883](https://linear.app/threadbare/issue/THR-883)).
- 2026-08-08: "overnight quiet is normal" — the lane-silence probe's nightly gaps are declined standing.

---
*Refreshed hourly by `keep-work-flowing-cc`. Full history of every prior version: `git log -p origin/ops -- Design/user-actions.md`.*
