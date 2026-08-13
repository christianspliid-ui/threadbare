# Briefing

**Generated:** 2026-08-13 12:58 local (2026-08-13 10:58 UTC) · keep-work-flowing-cc

## The one thing

**Ten minutes looking at the screen lands your aftermath direction — but open the preview link below, not the live site. The last two briefs sent you to the wrong build.**

[PR #1415](https://github.com/christianspliid-ui/threadbare/pull/1415) builds [THR-1082](https://linear.app/threadbare/issue/THR-1082/consequence-icon-language-aftermath-must-show-what-changed-and-roughly), the consequence icon language you directed on 10 August — the aftermath naming what changed instead of reporting a die roll. Tests, build, typecheck and the engine smoke are all green. The one thing it still owes is a look at the real pixels at 1920×1080, and **no unattended run can produce that** — the browser refuses to render when nobody is present ([impediment #546](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/impediments.md)). The executor deliberately refused the cheaper substitute because this change *moves layout* — a new icon column, a tag column, a right-aligned cluster, a legend row — and that is exactly the case where only real pixels can tell you it looks right.

**Correction to yesterday's ask, and to the two DMs that carried it.** Both pointed you at `threadbare.vercel.app` — the *live* site. That build is served from `main`, and this PR is not merged into `main`, so it does not contain the change: you would have looked at the old aftermath, seen nothing new, and the review would have been worthless. The build that actually has it is the PR's own preview deployment:

**→ [Open the new aftermath (PR preview build)](https://threadbare-7wzebf47m-spliid.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)**

It is a protected preview, so you may be asked to sign in to Vercel first — your own account, one click. To see a second ending, add `&outcome=critical_failure` to the same link.

**What to do:** open it, look at the two encounters across two outcome bands, and say whether it reads right. Your Law 13/15 ratification is already recorded — this is a look, not a decision.

**One thing changed since yesterday, and it is the executor's problem, not yours:** the branch has drifted behind `main` and now conflicts in `src/engine/aftermathWords.ts` and its test, not just in a generated file. Yesterday's brief said "one trivial conflict"; that is no longer true. It is still ordinary merge work and does not need you — but it does mean the preview above is from 12 August and will need re-checking if the conflict resolution changes any rendering.

**What it costs to wait:** [THR-1096](https://linear.app/threadbare/issue/THR-1096/companion-attachments-a-person-in-the-retinue-granting-bonuses-who-is) (companion attachments, the board's top product item) and [THR-1097](https://linear.app/threadbare/issue/THR-1097/consequence-content-pass-every-vertical-slice-ending-rewritten-as) (the consequence content pass) are both High, both still in Todo, and both natively blocked behind this. They are the only product work on the board — everything else queued is cleanup.

## Also waiting (1)

- **A Tenacious-style trait** — parked design option, no ticket, no urgency; stays parked unless you say otherwise. Detail: [`Design/user-actions.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**Backed up — 19 ready, 1 in flight. The lanes are moving; the shelf is all cleanup.**

- **[THR-1082](https://linear.app/threadbare/issue/THR-1082/consequence-icon-language-aftermath-must-show-what-changed-and-roughly) is the only item in flight**, In Dev with nobody holding it, parked ~16 hours. That is the PR above — the one thing that needs you. The park is deliberate and documented, not neglect.
- **[THR-1037](https://linear.app/threadbare/issue/THR-1037/verify-a-bargain-at-the-crossroads-full-moon-seed-path-is-actually) closed since the last brief** — the Crossroads Full Moon path was never a defect, and [PR #1421](https://github.com/christianspliid-ui/threadbare/pull/1421)'s red check cleared and merged on its own. Nothing was needed from you.
- **Nothing on the 19-item shelf is product work.** It is Low- and Medium-priority engine, content and UI cleanup — no feature or new content is queued for pickup. The two High product tickets are the ones blocked behind THR-1082, so the same ten minutes unblocks the entire product pipeline.
- Stale: [THR-991](https://linear.app/threadbare/issue/THR-991/ul-shards-can-record-a-term-as-rejected-only-by-mislabelling-it), untouched 10 days.
- [THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) surfaced again from the orchestrator and is declined again — you ruled all four verdicts on 10 August; the ticket stays open only for an agent-side closeout.

## Health

**Deploy, CI, both scheduled workflows and all nine task heartbeats are green.** The live site is serving the newest commit on `main` ([`3601534d`](https://github.com/christianspliid-ui/threadbare/commit/3601534dd0a1a80931512fe1c9ec7ef76b168fd5)). Three executor-side items, none needing you:

- **The home copy of the repo stopped auto-updating this hour.** Three edits sitting uncommitted there (`.claude/settings.json`, `.claude/settings.local.json`, `Docs/impediments.md`) block the hourly sync, which skipped at 12:50 and left the copy 6 commits behind. This is the failure mode that never clears on its own — every later hour hits the same collision — so it wants a session to clear those three files. It does not affect the live site or any branch.
- **[PR #1415](https://github.com/christianspliid-ui/threadbare/pull/1415) now conflicts in real source**, not just a generated file (see above). Ordinary merge work for whichever session picks it up after your look.
- **Two stale worktrees still need disposition**, both holding unmerged work the housekeeping job will not delete on its own. That job ran 18 minutes ago and is healthy.
- **Overnight quiet, declined as normal** — 10.8 h with no lane writing between 21:14 and 06:00, the same shape as every night this week, per your 2026-08-08 ruling. The older 20.6-hour stoppage of 10→11 August is flagged again by the same probe; it was recorded as resolved on 12 August and handed to Friday's retro, so it is declined rather than re-raised.
