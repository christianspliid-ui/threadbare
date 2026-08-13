# User Action Required

**Last updated:** 2026-08-13 16:58 local (2026-08-13 14:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. One attended look at the new aftermath — on the preview build, not the live site

[PR #1415](https://github.com/christianspliid-ui/threadbare/pull/1415) builds [THR-1082](https://linear.app/threadbare/issue/THR-1082/consequence-icon-language-aftermath-must-show-what-changed-and-roughly) — your 10 August direction that the aftermath should name what changed rather than report a die roll. Every automated gate is green. The only thing left is a human looking at it at 1920×1080, and unattended runs structurally cannot do that ([impediment #546](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/impediments.md)): the browser refuses to render with nobody present, and the change moves layout, so the cheaper substitute was correctly refused. Held **20 hours** as of this refresh; it will not clear on its own.

**→ [Open the new aftermath (PR preview build)](https://threadbare-git-claude-thr-1082-consequence-language-spliid.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)** — the branch's own preview address, read off the PR's Vercel record. Protected preview, so it may ask you to sign in to Vercel first. Add `&outcome=critical_failure` to the same link for a second ending. **Not** `threadbare.vercel.app` — that is the live site, built from `main`, and this PR is not merged, so it shows the *old* aftermath.

**What to do:** open it, look at two encounters across two outcome bands, and say whether it reads right. Your Law 13/15 ratification is already recorded — this is a look, not a decision.

**Note:** the branch conflicts with `main` in `src/engine/aftermathWords.ts`, its test and the generated interface map — ordinary executor merge work, nothing from you. Nothing merged since 12 August touches the consequence chips, so the preview still shows what you need to see.

**Cost of waiting:** [THR-1096](https://linear.app/threadbare/issue/THR-1096) (companion attachments) and [THR-1097](https://linear.app/threadbare/issue/THR-1097) (consequence content pass) are both High, both blocked behind it, and are the only feature work on the board. THR-1096 is additionally offered to the hourly executor and declined again every run, since nothing unattended can clear its blocker.

### 2. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

## Resolved this period

- 2026-08-13: **a fifth demo-path fix shipped without you.** The Codex stopped speaking CRUD to the player ([THR-1076](https://linear.app/threadbare/issue/THR-1076), [PR #1426](https://github.com/christianspliid-ui/threadbare/pull/1426)).
- 2026-08-13: **a fourth demo-path fix shipped without you.** Three artifact verbs stopped telling the player they are "NOT YET WIRED" ([THR-1075](https://linear.app/threadbare/issue/THR-1075), [PR #1425](https://github.com/christianspliid-ui/threadbare/pull/1425)).
- 2026-08-13: **two more demo-path fixes shipped without you.** The Empower card is no longer artless ([THR-1074](https://linear.app/threadbare/issue/THR-1074), [PR #1424](https://github.com/christianspliid-ui/threadbare/pull/1424)) and the veil now says how long a moment lasts instead of counting ticks ([THR-1070](https://linear.app/threadbare/issue/THR-1070), [PR #1423](https://github.com/christianspliid-ui/threadbare/pull/1423)).
- 2026-08-13: **the demo-ready checkpoint is closed and defect-free.** [THR-986](https://linear.app/threadbare/issue/THR-986) went Done when its last player-visible defect shipped — the Chapter Ledger no longer prints `success_at_cost` at you ([PR #1422](https://github.com/christianspliid-ui/threadbare/pull/1422)), following the fix for encounters handing you raw `{adj}` placeholders.
- 2026-08-13: **the Crossroads bug was not a bug, and its fix has landed.** [THR-1037](https://linear.app/threadbare/issue/THR-1037) — the Full Moon path that looked unreachable — was worked, and the verdict is that the reported failure was an unlucky roll. The test proving the branch is reachable merged as [PR #1421](https://github.com/christianspliid-ui/threadbare/pull/1421).
- 2026-08-12: **your 10 August aftermath direction became working code.** The consequence-language design session settled the four categories, the ▲/▼ delta cluster as the magnitude idiom, the palette rule and the Law 13/15 amendments with you in chat, then handed [THR-1082](https://linear.app/threadbare/issue/THR-1082) to the queue with its [plan doc](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-08-12-thr-1082-consequence-language.md) merged; the executor built it the same evening. Three further product tickets came out of it — [THR-1096](https://linear.app/threadbare/issue/THR-1096), [THR-1097](https://linear.app/threadbare/issue/THR-1097), [THR-1098](https://linear.app/threadbare/issue/THR-1098). Only the look-at-it step above remains.
- 2026-08-12: **the rulings shipped, and a third ticket followed them.** [THR-998](https://linear.app/threadbare/issue/THR-998) (the card risk word) merged as [PR #1410](https://github.com/christianspliid-ui/threadbare/pull/1410), [THR-1067](https://linear.app/threadbare/issue/THR-1067) (18 templates naming the result instead of showing it) as [PR #1406](https://github.com/christianspliid-ui/threadbare/pull/1406), and [THR-1069](https://linear.app/threadbare/issue/THR-1069) as [PR #1411](https://github.com/christianspliid-ui/threadbare/pull/1411) — the executor picked between the delegated options without coming back to you.
- 2026-08-12: **[THR-1092](https://linear.app/threadbare/issue/THR-1092) ruled — the prose checker.** The abstraction detector drops from hard gate to warning, the four sharper checks stay gates, and the executor may sharpen the check further with open eyes. Failing encounters 209 → 81.
- 2026-08-12: **both rulings generalized into canon** — `Docs/canon/process.md` § User review interface rule 4: an agreed outcome delegates its consequences, so a code change that merely follows from a decision you already made does not come back to you.

---
*Refreshed hourly by `keep-work-flowing-cc`. Full history of every prior version: `git log -p origin/ops -- Design/user-actions.md`.*
