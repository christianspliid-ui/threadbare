# Briefing

**Generated:** 2026-08-13 14:55 local (2026-08-13 12:55 UTC) · keep-work-flowing-cc

## The one thing

**Ten minutes looking at the new aftermath. Same ask as the last two hours — it is still the only thing waiting on you, and everything else on the board is moving without you.**

**→ [Open the new aftermath (PR preview build)](https://threadbare-git-claude-thr-1082-consequence-language-spliid.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)**

That is the branch's own preview address from [PR #1415](https://github.com/christianspliid-ui/threadbare/pull/1415). It is a protected preview, so it may ask you to sign in to Vercel first (your own account, one click). For a second ending, add `&outcome=critical_failure` to the same link.

**What to look at:** two encounters across two outcome bands, and whether the consequences read right — [THR-1082](https://linear.app/threadbare/issue/THR-1082/consequence-icon-language-aftermath-must-show-what-changed-and-roughly) is your 10 August direction built out: the aftermath naming what changed instead of reporting a die roll. Your Law 13/15 ratification is already recorded. **This is a look, not a decision.**

Every automated gate is green. The one Done-when left is real pixels at 1920×1080, and an unattended run structurally cannot produce them ([impediment #546](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/impediments.md)) — the change moves layout, so the cheaper substitute was correctly refused.

**What it costs to wait:** [THR-1096](https://linear.app/threadbare/issue/THR-1096/companion-attachments-a-person-in-the-retinue-granting-bonuses-who-is) (companion attachments) and [THR-1097](https://linear.app/threadbare/issue/THR-1097/consequence-content-pass-every-vertical-slice-ending-rewritten-as) are both High, both blocked behind this, and are the only feature work the board is holding.

*Still not yours:* the branch has drifted further behind `main` and conflicts in `src/engine/aftermathWords.ts` and its test. Ordinary merge work. Nothing that landed since — the ledger wording, the veil's duration wording, the Empower card art — touches the consequence chips, so the preview above still shows you what you need to see.

## Also waiting (1)

- **A Tenacious-style trait** — parked design option, no ticket, no urgency; stays parked unless you say otherwise. Detail: [`Design/user-actions.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**Backed up — 17 ready, 1 in flight. Three player-facing fixes shipped in the last three hours.**

- **Shipped since the last brief:** [THR-1074](https://linear.app/threadbare/issue/THR-1074) — the Empower card is no longer artless ([PR #1424](https://github.com/christianspliid-ui/threadbare/pull/1424)) — and [THR-1070](https://linear.app/threadbare/issue/THR-1070) — the veil says how long a moment lasts instead of counting ticks ([PR #1423](https://github.com/christianspliid-ui/threadbare/pull/1423)). Both are the demo-path polish you asked for, landing without a decision from you.
- **[THR-1082](https://linear.app/threadbare/issue/THR-1082/consequence-icon-language-aftermath-must-show-what-changed-and-roughly) is the only item in flight**, In Dev with nobody holding it, held ~18 hours. That is the PR above; the hold is deliberate and documented, not neglect.
- **The 17-item shelf is roughly half player-facing polish, half process cleanup** — Low and Medium engine, content and UI defects. The only two High items are the pair blocked behind THR-1082, so the same ten minutes unblocks the whole feature pipeline.
- Stale: [THR-991](https://linear.app/threadbare/issue/THR-991/ul-shards-can-record-a-term-as-rejected-only-by-mislabelling-it), untouched 10 days.

## Health

**Deploy, CI, both scheduled workflows and all nine task heartbeats are green.** The live site is serving the newest commit on `main` ([`b3cbe049`](https://github.com/christianspliid-ui/threadbare/commit/b3cbe049ab9cac3a53ce1a198846352880cbc332)). Two executor-side items, neither needing you:

- **The home copy of the repo has now missed three hourly syncs** (12:50, 13:50, 14:50) and sits 10 commits behind, up from 8 an hour ago. Same cause as yesterday — three files left uncommitted there (`.claude/settings.json`, `.claude/settings.local.json`, `Docs/impediments.md`) — and it never clears on its own, so a session has to clear those files. It does not affect the live site or any branch.
- **Two stale worktrees still need disposition**, both holding unmerged work the housekeeping job will not delete on its own. That job ran healthy at 14:40.
- **Overnight quiet, declined as normal** — 10.8 h with no lane writing between 21:14 and 06:00, the same shape as every night this week, per your 2026-08-08 ruling. The older 20.6-hour stoppage of 10→11 August is re-flagged by the same probe; it was recorded resolved on 12 August and handed to Friday's retro, so it is declined rather than re-raised.
