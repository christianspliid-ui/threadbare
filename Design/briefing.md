# Briefing
**Generated:** 2026-09-07 02:56 local (00:56 UTC) · keep-work-flowing-cc

## The one thing

**Approve the camp six — three words and six encounters get built tonight.** [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) · [the brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md)

**I have moved this ahead of the Traits question, and I should say why rather than quietly reshuffle.** Traits wave 2 has led seven briefs running and it has not moved you; it also shrank — three of the four things it was said to block closed under their own power, so what is left is intent, not a valve. The camp six is the ask whose answer turns into shipped work the same hour: say the word and the unattended machine picks up [THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) without you being present.

Six encounters, not seven — sharpening blades, warding the camp, a small prayer, rest, tending wounds, scouting. `shrine_offering` is held to batch 3, which is why your slice checkpoint waits one batch longer. Two questions in the brief: **repair the six in place, or re-roll them from fresh premises?** (repair is the plan), and the 2-of-6 sample — `ward_the_camp` and `tend_to_wounds`, your own pick.

**"batch 2, run the six"** · *"re-roll them"* · *"put shrine_offering back in."*

## Also waiting (14)

- **[What should a proportion read as?](https://linear.app/threadbare/issue/THR-1424)** — *new this hour.* Two screens still show a bare percentage and there is no sanctioned reading for one. Recommendation: **drop both numbers** rather than invent a language. Say *"drop them"* and it is done.
- **[Are you still planning to design Traits wave 2?](https://linear.app/threadbare/issue/THR-790)** — one word. In Design, your name on it, **23 days**, no plan doc; it holds the design tier's one preparation slot.
- **[The undertaking retirement list](https://linear.app/threadbare/issue/THR-1392)** — four templates get deleted; *"run 4b"* finishes the migration.
- **[Do you still want the incident-capture button?](https://linear.app/threadbare/issue/THR-1134)** — you filed it 16 August; yes or no.
- **[Three questions on the undertakings map](https://linear.app/threadbare/issue/THR-1396)** — take [the division rule](https://linear.app/threadbare/issue/THR-1398) first; it unblocks four.
- **[The fight map](https://linear.app/threadbare/issue/THR-1258)** — settle [monster fights](https://linear.app/threadbare/issue/THR-1263) and [duels](https://linear.app/threadbare/issue/THR-1264) and three more open by themselves.
- **[Twenty spells](https://linear.app/threadbare/issue/THR-1232) and [thirty items](https://linear.app/threadbare/issue/THR-1236)** — sketches built for you to react to.
- **[Image credits](https://linear.app/threadbare/issue/THR-876)** — should the spend be gated on you at all?
- **[What is a run about?](https://linear.app/threadbare/issue/THR-1198)** — remembrance, or named campaigns.
- **[One attended dev-server session](https://linear.app/threadbare/issue/THR-1133)** — nineteen captures owed; nothing blocks the sitting.
- **[Chart the hub map](https://linear.app/threadbare/issue/THR-1220)** — advice is still to wait for your slice checkpoint.
- **A Tenacious-style trait** — parked by default, listed so it is not forgotten.
- **Should weekend quiet be normal too?** — one word declines the 45-hour Friday-to-Sunday gap the way you declined overnight quiet.
- **The scripted half of Linear access** — `LINEAR_API_KEY` is still unset, so a handful of background checks stay dark. Nothing is blocked on it.

**One ask joined this hour ([THR-1424](https://linear.app/threadbare/issue/THR-1424)); none left.** No message came in overnight.

## Queue

**Healthy — 4 ready, and the machine shipped through the night.**

- **Ready for Dev: 4**, all unclaimed, none stale. [THR-1425](https://linear.app/threadbare/issue/THR-1425) (five more surfaces show a raw tick count), [THR-1407](https://linear.app/threadbare/issue/THR-1407) (owningSystem registry), [THR-1422](https://linear.app/threadbare/issue/THR-1422) (duplicated constants), [THR-1415](https://linear.app/threadbare/issue/THR-1415) (Vite watches worktrees).
- **One shipped in the last hour** — [THR-1423](https://linear.app/threadbare/issue/THR-1423), eight tick readouts now read in words, merged as [PR #1832](https://github.com/christianspliid-ui/threadbare/pull/1832) and already live. [THR-1425](https://linear.app/threadbare/issue/THR-1425) is its deferral and was promoted in behind it, which is why the count held at four.
- **In Dev: nothing live.** The only two In-Dev items are your two parked approvals, [THR-1130](https://linear.app/threadbare/issue/THR-1130) and [THR-1392](https://linear.app/threadbare/issue/THR-1392) — correctly parked on your word, not stalled.

## Health

- **Green everywhere the probes can see.** Deploy live and current at `759e661d`; all scheduled workflows and post-merge CI green; no PRs waiting to merge; all 9 scheduled tasks on schedule; the worktree reaper ran at 02:40.
- **Engine speed stays under the line.** 105 ms/tick steady, **+24% against the 7-day median of 85** — below the 25% threshold. Warm-up 38.0 ms against a normal 38, so the reading is trustworthy. Second hour in a row under the line; the three consecutive rows above 110 ms have not resumed. No executor action needed.
- Visibility only, no action: the silence probe still reports the same three gaps (44.9 h weekend, 11.7 h and 10 h overnight). The two overnight ones are declined under your 8 August ruling; the weekend one is on your list above.
- Agent-owned, unchanged and flagged for the Friday retro: **seven merges to `main` from the Linear outage window carry no `Fixes THR-XX` line** ([PRs #1821–#1827](https://github.com/christianspliid-ui/threadbare/pulls?q=is%3Apr+is%3Amerged)) because the lanes correctly refused to claim board tickets they could not reach. Shipped but unticketed, and needs reconciling.
- Agent-owned, no action from you: **two consecutive orchestrator runs found a finished, unblocked ticket stranded in `Todo`** by the session that authored it, because the executor's pickup query reads only `Ready for Dev`. Twice is a pattern; flagged for the retro rather than filed.
- Minor, no action: the home tree sits 11 commits behind `origin/main`. It is autosync's read-only mirror and no lane reads from it — every session works in its own worktree off `origin/main`.
