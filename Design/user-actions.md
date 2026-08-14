# User Action Required

**Last updated:** 2026-08-14 15:56 local (2026-08-14 13:56 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. Play the slice once and rule it — both verdict sessions are level

One play session, two tickets, five verdicts. As of 15:37 today every element of the system — data, logic, content, UI — is shipped and deployed, which is the bar your own rule 5 sets.

- [**THR-907**](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) — prose, firing, UI, game feel. Cleared by [THR-1107](https://linear.app/threadbare/issue/THR-1107) ([PR #1450](https://github.com/christianspliid-ui/threadbare/pull/1450)), the 21 lines that read *"she stop"* for a he/she agent, `trial_by_combat` among them; and by the 13-batch mad-lib campaign [THR-1101](https://linear.app/threadbare/issue/THR-1101) closing this morning.
- [**THR-974**](https://linear.app/threadbare/issue/THR-974/consequence-verdict-session-christian-rules-on-world-graph-consequence) — consequence. Cleared yesterday by logic ([THR-969](https://linear.app/threadbare/issue/THR-969)), data ([THR-1082](https://linear.app/threadbare/issue/THR-1082)), UI ([THR-971](https://linear.app/threadbare/issue/THR-971)) and content ([THR-1097](https://linear.app/threadbare/issue/THR-1097)).

**Free play** (what the firing verdict needs): [threadbare.vercel.app/?view=game&seeded&size=medium&forceencounters](https://threadbare.vercel.app/?view=game&seeded&size=medium&forceencounters) · **straight to any ending**: [the review table in THR-1097's closeout](https://linear.app/threadbare/issue/THR-1097/consequence-content-pass-every-vertical-slice-ending-rewritten-as), one link per encounter per ending.

Two honest seams: no encounter authors a `success` band by design (the base text *is* the ordinary win, so `?outcome=success` reports `unauthored_band` correctly), and `agreement` consequences cannot be minted yet ([THR-1110](https://linear.app/threadbare/issue/THR-1110)) so the crossroads promise is carried by its seeded follow-up. "Needs another iteration" is a valid ruling on any of the five. When both close, the map ([THR-902](https://linear.app/threadbare/issue/THR-902)) closes with them.

### 2. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

## Resolved this period

- 2026-08-14: **the last thing standing between you and the full slice review is gone.** [THR-1107](https://linear.app/threadbare/issue/THR-1107) ([PR #1450](https://github.com/christianspliid-ui/threadbare/pull/1450), claimed 15:02, merged 15:37, deployed) — 21 encounter lines that rendered ungrammatically for a he/she agent, invisible to the token scan, invisible in the source, and green in the test suite. It shipped with a regression guard written to fail first. **This unblocked THR-907**, so both verdict sessions are now open together.
- 2026-08-14: **every slice ending now says what it cost the person who walked through it.** [THR-1097](https://linear.app/threadbare/issue/THR-1097) ([PR #1449](https://github.com/christianspliid-ui/threadbare/pull/1449), merged 14:40) — all 55 authored consequences rewritten as cause → change. The defect turned out to be *subject*, not writing quality: a third of the chips reported world state where the rule asks for a personal outcome. **This unblocked THR-974.**
- 2026-08-14: **the ally card you described on Tuesday is in the game.** [THR-1096](https://linear.app/threadbare/issue/THR-1096) ([PR #1448](https://github.com/christianspliid-ui/threadbare/pull/1448)) — a named person with a portrait who rides along and grants a passive bonus, never simulated as an agent, arriving as an encounter consequence and rendering as a BOND chip. A pixel pass on the companions row is deferred to an attended session ([THR-1109](https://linear.app/threadbare/issue/THR-1109)).
- 2026-08-14: **a tenth fix shipped without you, and it was poisoning other people's work.** An action-card animation timer kept running after its card was gone, failing the required check on three unrelated pull requests in six days ([THR-1106](https://linear.app/threadbare/issue/THR-1106), [PR #1447](https://github.com/christianspliid-ui/threadbare/pull/1447)). Two more of the same shape were found in the sweep and filed as [THR-1108](https://linear.app/threadbare/issue/THR-1108).
- 2026-08-14: **the mad-lib encounters are all written — the campaign is complete.** Thirteen batches, closed by [PR #1446](https://github.com/christianspliid-ui/threadbare/pull/1446) at 11:30 ([THR-1101](https://linear.app/threadbare/issue/THR-1101)); the corpus check returns zero and the finished prose is deployed.
- 2026-08-14: **the consequence icon language shipped, and the dam broke.** [PR #1415](https://github.com/christianspliid-ui/threadbare/pull/1415) ([THR-1082](https://linear.app/threadbare/issue/THR-1082)) — the ask you cleared with *"Finish thr-1082."* Two High tickets released behind it: [THR-1096](https://linear.app/threadbare/issue/THR-1096) and [THR-1097](https://linear.app/threadbare/issue/THR-1097).
- 2026-08-13: **a ninth fix shipped without you.** Rites now take longer at higher tiers ([THR-1100](https://linear.app/threadbare/issue/THR-1100), [PR #1433](https://github.com/christianspliid-ui/threadbare/pull/1433)).
- 2026-08-13: **an eighth fix shipped without you.** The prose abstraction detector stopped gating and started ranking ([THR-1092](https://linear.app/threadbare/issue/THR-1092), [PR #1432](https://github.com/christianspliid-ui/threadbare/pull/1432)).
- 2026-08-13: **the aftermath *review* ask was withdrawn, under your own new rule.** Your ruling — *"i cannot evaluate gameplay before all elements of a system has been brought up to the same level. data, ui, content, logic"* — landed as [canon rule 5](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/process.md) ([PR #1431](https://github.com/christianspliid-ui/threadbare/pull/1431)). It is why both verdict sessions were held until they were level, and why they are being asked together now rather than one at a time.

---
*Refreshed hourly by `keep-work-flowing-cc`. Full history of every prior version: `git log -p origin/ops -- Design/user-actions.md`.*
