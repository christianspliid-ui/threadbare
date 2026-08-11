# User Action Required

**Last updated:** 2026-08-11 21:05 local (19:05 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077/designuser-actionsmd-has-grown-into-a-run-by-run-diary-christians). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. The play sitting — two rulings over the same five encounters

**Session A — the four-part verdict** ([THR-907](https://linear.app/threadbare/issue/THR-907)): does the prose read clear, does the firing rhythm work, is the interface gamey enough, and is deciding actually fun. *"Needs another iteration"* is a valid answer on any of the four.

**Session B — the consequence verdict** ([THR-974](https://linear.app/threadbare/issue/THR-974)): play a hand to its ending and say whether the change to the world is **visible**, and whether it feels like it **happened in the world** rather than being announced at you. Both gating tickets shipped; the orchestrator has re-confirmed it fully unblocked on each of its last three runs.

- [The bargain at the crossroads](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads) · [Riders behind the caravan](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan) · [Snow on the pass](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass) · [The swindled family](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family) · [The unsafe bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)

Add `&outcome=critical_failure` (or `success`, `failure`, `near_miss`, `success_at_cost`, `critical_success`) to any link to reach that ending directly; where nobody has written that ending yet you get the normal one. The [demo-ready checkpoint (THR-986)](https://linear.app/threadbare/issue/THR-986) rides on this same sitting, but is still blocked on five of its own tickets either way.

### 2. Mercy currently makes people crueller ([THR-1071](https://linear.app/threadbare/issue/THR-1071))

In 37 of the 40 converted dilemmas, the choice that is merciful *by its own text* writes a shift **toward** ruthlessness. Kneeling in the dirt to hold a cup to a dying boy's lips moves the character toward Conqueror. It is live on every converted template, it is High priority, and it reads correctly from either code path alone — which is why it shipped.

Your own note is why it sits in Todo rather than the dev queue: the remedy has to be picked before anyone rewrites. Three parts to the call:

- **Flip the 37 authored shift signs** so the merciful choice writes the merciful direction. Clean fix for the meaning; but the stone set currently reads right *by accident* (two inversions cancelling), so flipping breaks stone.
- **Re-bind the pole letters** in the test blocks so the two paths stop disagreeing with each other. Touches no prose and no values, but leaves the mercy-reads-as-ruthlessness problem alone.
- **Both, in a stated order** — probably what's wanted — plus whether the stone set is exempted or its value pair gets renamed instead.

### 3. Action cards print a risk that isn't real ([THR-998](https://linear.app/threadbare/issue/THR-998))

Cards read "a steady / uncertain / perilous working", but for 85% of castable cards the number behind the word cannot move the odds at all. **(a)** make the word track the odds the cast will actually roll; **(b)** stop printing a risk word where the odds are flat and print something true instead — scale or cost; **(c)** lower the floors so authored danger bites again (also changes how mortals resolve everything). **Recommendation: (b)** — if the danger doesn't vary, a danger word is the wrong thing to print.

### 4. Two small sound decisions ([THR-962](https://linear.app/threadbare/issue/THR-962), [THR-961](https://linear.app/threadbare/issue/THR-961))

Routing the encounter sound cues to the new screen, and how those cues feel. Both need your ears, not a screen. Both have bounced out of the dev queue twice because an executor cannot close a "Christian hears it" checkbox.

### 5. Was the overnight automation pause deliberate?

No scheduled lane wrote anything between 2026-08-10 21:57 and 2026-08-11 18:32 local (~20.6h). Everything has since resumed on its own. Most of the gap is the machine asleep, but it was demonstrably up 07:26–12:40 local with no lane firing — which matches the usage-limit pattern rather than a fault.

**If you paused it (or hit plan limits): no action needed beyond saying so** — a pause marker gets dropped and the probe stops flagging it. If you didn't, say that and it gets investigated as a real stoppage. The probe verdict, verbatim:

> "The scheduled lanes went silent for 20.6h (2026-08-10T19:57:52.000Z → 2026-08-11T16:32:43.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."

### 6. While you play: does the encounter ending appear on its own now?

You reported on 2026-08-06 that it didn't — you had to click the badge on the agent's thread. Both halves of that cause shipped and were verified against your repro. **No reply needed if it works.** If it doesn't, say so and it gets a fresh ticket — a recurrence now would be a different bug.

### 7. Parked option, no urgency: a Tenacious-style trait

Open option, explicitly not urgent. Safe default is "stays parked."

## Resolved this period

- 2026-08-11: [THR-866](https://linear.app/threadbare/issue/THR-866) closed — the design look at the apex Ascension encounter, which produced [THR-1086](https://linear.app/threadbare/issue/THR-1086), the last encounter still on the old authored-choices format.
- 2026-08-11: **Linear signed back in** — the connector outage that locked every lane out of the board cleared within the hour.
- 2026-08-11: the ~20.6h lane silence ended and **tb-orchestrator re-fired** after 21 missed slots — all 9 scheduled tasks back within 2 slots. Only the "was it deliberate?" question remains open.
- 2026-08-10: [THR-1083](https://linear.app/threadbare/issue/THR-1083) shipped — the last screen an encounter shows you was outside every prose check; it is now inside one.
- 2026-08-10: [THR-1064](https://linear.app/threadbare/issue/THR-1064) closed not-a-defect — you closed it 116 seconds after the re-ask. The investigation behind it is what found ask 2 above.
- 2026-08-10: "drop and re-author" ruling applied to the whole paused content shelf (THR-848/855/856/858/859/861/863/864), and the WS5 batch tickets are now canceled on the board.
- 2026-08-09: the encounter-writing format locked ([THR-883](https://linear.app/threadbare/issue/THR-883)).
- 2026-08-09: the process-ticket rule confirmed binding forward ([THR-871](https://linear.app/threadbare/issue/THR-871)).
- 2026-08-08: "overnight quiet is normal" — the lane-silence probe's nightly gaps are declined standing.

---
*Refreshed hourly by `keep-work-flowing-cc`. Full history of every prior version: `git log -p origin/ops -- Design/user-actions.md`.*
