# User Action Required

**Last updated:** 2026-08-14 14:57 local (2026-08-14 12:57 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. The consequence review is open — play the endings and rule

[THR-974](https://linear.app/threadbare/issue/THR-974/consequence-verdict-session-christian-rules-on-world-graph-consequence): *after a nudge hand resolves, is the world-graph change visible, and does it feel like it happened in the simulated world?*

All four levels are up as of 14:40 today — logic ([THR-969](https://linear.app/threadbare/issue/THR-969)), data ([THR-1082](https://linear.app/threadbare/issue/THR-1082)), UI ([THR-971](https://linear.app/threadbare/issue/THR-971)), content ([THR-1097](https://linear.app/threadbare/issue/THR-1097), [PR #1449](https://github.com/christianspliid-ui/threadbare/pull/1449), deployed). This is the ask that was deliberately held back for three days under your level-system rule.

**The [review table in THR-1097's closeout](https://linear.app/threadbare/issue/THR-1097/consequence-content-pass-every-vertical-slice-ending-rewritten-as) gives you one direct link per encounter per ending** — eight encounters, no replaying. Two honest caveats: no encounter authors a `success` band by design (the base text *is* the ordinary win, so `?outcome=success` reports `unauthored_band` correctly), and `agreement` consequences cannot be minted yet ([THR-1110](https://linear.app/threadbare/issue/THR-1110)) so the crossroads promise is carried by its seeded follow-up rather than a chip that would assert state nothing wrote.

"Needs another iteration" is a valid ruling.

### 2. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

*The other verdict session ([THR-907](https://linear.app/threadbare/issue/THR-907) — prose, firing, UI, game feel) is still **not** being asked of you. It is one ticket from level: [THR-1107](https://linear.app/threadbare/issue/THR-1107), the 21 lines that render as "she stop" for he/she agents, including the `trial_by_combat` exemplar. Unclaimed and in the queue now. That ask fires once, separately, when it lands.*

## Resolved this period

- 2026-08-14: **every slice ending now says what it cost the person who walked through it.** [THR-1097](https://linear.app/threadbare/issue/THR-1097) ([PR #1449](https://github.com/christianspliid-ui/threadbare/pull/1449), merged 14:40, deployed) — all 55 authored consequences rewritten as cause → change. The defect turned out to be *subject*, not writing quality: a third of the chips reported world state ("the bridge is one crossing older") where the rule asks for a personal outcome. The palette went from conditions-and-standing to eight kinds, including two new mechanical writes. **This unblocked the review above.**
- 2026-08-14: **the ally card you described on Tuesday is in the game.** [THR-1096](https://linear.app/threadbare/issue/THR-1096) ([PR #1448](https://github.com/christianspliid-ui/threadbare/pull/1448), merged 13:54, already deployed) — a named person with a portrait who rides along and grants a passive bonus, never simulated as an agent, arriving as an encounter consequence and rendering as a BOND chip. A pixel pass on the companions row is deferred to an attended session ([THR-1109](https://linear.app/threadbare/issue/THR-1109)).
- 2026-08-14: **a tenth fix shipped without you, and it was poisoning other people's work.** An action-card animation timer kept running after its card was gone, failing the required check on three unrelated pull requests in six days ([THR-1106](https://linear.app/threadbare/issue/THR-1106), [PR #1447](https://github.com/christianspliid-ui/threadbare/pull/1447)). Two more of the same shape were found in the sweep and filed as [THR-1108](https://linear.app/threadbare/issue/THR-1108).
- 2026-08-14: **the mad-lib encounters are all written — the campaign is complete.** Thirteen batches, closed by [PR #1446](https://github.com/christianspliid-ui/threadbare/pull/1446) at 11:30 ([THR-1101](https://linear.app/threadbare/issue/THR-1101)); the corpus check returns zero and the finished prose is already deployed.
- 2026-08-14: **the consequence icon language shipped, and the dam broke.** [PR #1415](https://github.com/christianspliid-ui/threadbare/pull/1415) ([THR-1082](https://linear.app/threadbare/issue/THR-1082)) — the ask you cleared with *"Finish thr-1082."* Two High tickets released behind it: [THR-1096](https://linear.app/threadbare/issue/THR-1096) and [THR-1097](https://linear.app/threadbare/issue/THR-1097).
- 2026-08-14: **a defect the campaign found on its way past.** 21 lines render as *"she stand for"* for he/she agents, including `trial_by_combat`, the exemplar every batch calibrated against. Filed as [THR-1107](https://linear.app/threadbare/issue/THR-1107); no decision needed.
- 2026-08-13: **a ninth fix shipped without you.** Rites now take longer at higher tiers ([THR-1100](https://linear.app/threadbare/issue/THR-1100), [PR #1433](https://github.com/christianspliid-ui/threadbare/pull/1433)).
- 2026-08-13: **an eighth fix shipped without you.** The prose abstraction detector stopped gating and started ranking ([THR-1092](https://linear.app/threadbare/issue/THR-1092), [PR #1432](https://github.com/christianspliid-ui/threadbare/pull/1432)).
- 2026-08-13: **the aftermath *review* ask is withdrawn, under your own new rule.** Your ruling — *"i cannot evaluate gameplay before all elements of a system has been brought up to the same level. data, ui, content, logic"* — landed as [canon rule 5](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/process.md) ([PR #1431](https://github.com/christianspliid-ui/threadbare/pull/1431)). It is the reason THR-974 was held until today, and why THR-907 is still held.
- 2026-08-13: **a seventh fix shipped without you.** Action cards stopped naming the graph and the backlog at the player ([THR-1085](https://linear.app/threadbare/issue/THR-1085), [PR #1428](https://github.com/christianspliid-ui/threadbare/pull/1428)).

---
*Refreshed hourly by `keep-work-flowing-cc`. Full history of every prior version: `git log -p origin/ops -- Design/user-actions.md`.*
