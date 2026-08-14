# User Action Required

**Last updated:** 2026-08-14 20:57 local (2026-08-14 18:57 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. Rule the consequence verdict — play one encounter through to its aftermath

[**THR-974**](https://linear.app/threadbare/issue/THR-974/consequence-verdict-session-christian-rules-on-world-graph-consequence) — the last verdict still open on the Encounter Experience map. You ruled it **"not yet"** on 2026-08-10 because the chips were unreadable (*"what does steadily even mean?"*). Everything you chartered against that ruling has now shipped and deployed: the icon vocabulary ([THR-1082](https://linear.app/threadbare/issue/THR-1082), 08:59 local today) and the content rewrite of all 55 authored consequences ([THR-1097](https://linear.app/threadbare/issue/THR-1097), 14:40 local today), on top of the logic ([THR-969](https://linear.app/threadbare/issue/THR-969)) and UI ([THR-971](https://linear.app/threadbare/issue/THR-971)) that were already in. Level-checked against the live build 2026-08-14 18:57 UTC.

**The question:** after a hand resolves, does the consequence read as a real thing that happened to that person — noun, direction, rough magnitude — rather than an ungaugeable adverb?

**Free play**: [threadbare.vercel.app/?view=game&seeded&size=medium&forceencounters](https://threadbare.vercel.app/?view=game&seeded&size=medium&forceencounters) · **straight to any ending**: [the review table in THR-1097's closeout](https://linear.app/threadbare/issue/THR-1097/consequence-content-pass-every-vertical-slice-ending-rewritten-as), one link per encounter per ending.

One honest seam, by design: no encounter authors a `success` band — the base text *is* the ordinary win, so `?outcome=success` reports `unauthored_band` correctly. "Needs another iteration" is a valid ruling; it closes the verdict and charters the follow-up. When this closes, the map ([THR-902](https://linear.app/threadbare/issue/THR-902)) closes with it.

### 2. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

## Resolved this period

- 2026-08-14: **withdrawn — the slice verdict session was never open.** [THR-907](https://linear.app/threadbare/issue/THR-907) was briefed as a live ask for three consecutive hours. It was not: you ruled all four verdicts on 2026-08-10 (prose *"this is the bar"*, firing *"rhythm works, prune later"*, UI *"the encounter view is good enough"*, game *"the decisions land"*). It stays open pending an agent-authored plan-doc carve-up, which is not your work. The ask is retired.
- 2026-08-14: **the Place of Power panel stopped reading as a debug strip.** [THR-1104](https://linear.app/threadbare/issue/THR-1104) ([PR #1455](https://github.com/christianspliid-ui/threadbare/pull/1455)) — six `label: value` rows became sentences, on your standing direction that key:value labels are unfinished UX.
- 2026-08-14: **the Codex stopped contradicting itself.** [THR-1103](https://linear.app/threadbare/issue/THR-1103) ([PR #1454](https://github.com/christianspliid-ui/threadbare/pull/1454)) — the browsable catalog at [`?view=codex`](https://threadbare.vercel.app/?view=codex) showed two different spellings of the same word. The residue it deliberately left is filed as [THR-1113](https://linear.app/threadbare/issue/THR-1113) rather than quietly dropped, and an executor picked it up this evening.
- 2026-08-14: **an engine ticket was closed by measuring instead of building.** [THR-1102](https://linear.app/threadbare/issue/THR-1102) (encounter tone tier) — implemented as specified, then found zero live readers across all 683 templates and reverted rather than add a field to a 278-importer type for nobody. Awaiting a close, blocking nothing.
- 2026-08-14: **the crossroads promise became a real thing the person holds.** [THR-1110](https://linear.app/threadbare/issue/THR-1110) ([PR #1451](https://github.com/christianspliid-ui/threadbare/pull/1451)) — an aftermath could name only two of the seven consequence categories; it can now grant all seven, so `agreement`, `blessing`, `curse`, `bestowed_power` and `spell` all became authorable.
- 2026-08-14: **21 encounter lines that read ungrammatically for a he/she agent are fixed.** [THR-1107](https://linear.app/threadbare/issue/THR-1107) ([PR #1450](https://github.com/christianspliid-ui/threadbare/pull/1450)) — invisible to the token scan, invisible in the source, green in the test suite. Shipped with a regression guard written to fail first.
- 2026-08-14: **every slice ending now says what it cost the person who walked through it.** [THR-1097](https://linear.app/threadbare/issue/THR-1097) ([PR #1449](https://github.com/christianspliid-ui/threadbare/pull/1449)) — all 55 authored consequences rewritten as cause → change. The defect was *subject*, not writing quality. **This levelled THR-974.**
- 2026-08-14: **the ally card you described on Tuesday is in the game.** [THR-1096](https://linear.app/threadbare/issue/THR-1096) ([PR #1448](https://github.com/christianspliid-ui/threadbare/pull/1448)) — a named person with a portrait who rides along and grants a passive bonus, arriving as an encounter consequence and rendering as a BOND chip. A pixel pass is deferred to an attended session ([THR-1109](https://linear.app/threadbare/issue/THR-1109)).
- 2026-08-14: **a fix shipped that was poisoning other people's work.** An action-card animation timer kept running after its card was gone, failing the required check on three unrelated pull requests in six days ([THR-1106](https://linear.app/threadbare/issue/THR-1106), [PR #1447](https://github.com/christianspliid-ui/threadbare/pull/1447)). Two more of the same shape were filed as [THR-1108](https://linear.app/threadbare/issue/THR-1108).
- 2026-08-14: **the mad-lib encounters are all written — the campaign is complete.** Thirteen batches, closed by [PR #1446](https://github.com/christianspliid-ui/threadbare/pull/1446) ([THR-1101](https://linear.app/threadbare/issue/THR-1101)); the corpus check returns zero and the finished prose is deployed.

---
*Refreshed hourly by `keep-work-flowing-cc`. Full history of every prior version: `git log -p origin/ops -- Design/user-actions.md`.*
