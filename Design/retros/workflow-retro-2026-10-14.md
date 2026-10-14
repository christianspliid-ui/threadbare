# Workflow Retro — 2026-10-14

Covers 2026-10-07T09:20Z → 2026-10-14T09:20Z. Previous report: [`workflow-retro-2026-10-08.md`](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md). That report was a late catch-up run, so this window overlaps it by about a day (10-07 → 10-08).

## Needs Christian

**Nothing needs you.** Two small process fixes are filed and will run on their own:

- **One piece of work got built twice this morning.** "Places founded during play take no culture" ([THR-1839](https://linear.app/threadbare/issue/THR-1839)) was built by two sessions at once. One was a pickup run that had crashed at 05:31 your time and was told to "Try again" at about 08:45. The other was the regular 08:45 pickup. They started in the same minute, and both believed the ticket was theirs. One version merged and the other was parked, so the game is fine. The cost was about half an hour of duplicated work. The fix is [THR-1887](https://linear.app/threadbare/issue/THR-1887): each claim gets a session stamp, so a second session backs off. *If you clicked "Try again" on that crashed run yourself, that was fine. The lane should have checked the board again before working, and the fix makes it do that.*
- **A finished design ticket waited about 17 hours for your click.** The warm-brief ticket ([THR-1785](https://linear.app/threadbare/issue/THR-1785)) held warm playtest round 2 closed from Tuesday afternoon until you closed it in chat this morning. The design lane closed five similar tickets itself this week without asking you. The rule is unclear, so I filed [THR-1888](https://linear.app/threadbare/issue/THR-1888) to let the lane close finished design requests. Those clicks then never reach you. *Veto in chat if you'd rather keep closing them yourself.*

## Throughput

- **86 issues completed** in the window, against 79 last week and 32 the week before. **114 pull requests merged** (of 120 opened). **328 non-merge commits** on `main`.
- **Commits per day (local):** `10-08: 19 · 10-09: 89 · 10-10: 50 · 10-11: 62 · 10-12: 36 · 10-13: 17 · 10-14 (to 11:20): 55`. The machine was up all week, with no outage gaps like last week's.
- **Composition:**
  - Five Continuous Improvement issues completed (THR-1744, THR-1776, THR-1795, THR-1796, THR-1785). The rest were product, which keeps the process share around 6%.
  - About a third of the completions were wayfinder decision tickets: the Dominion map closed, and the Map-Is-the-Table UI map closed 10-14.
  - Warm round 1 and cold round 3 playtest findings drained fully.
- **Pickup run outcomes.** The newest 50 of 2,013 runs reach back to 10-13 11:52Z (about 21.5 h):
  - **11 did real work**, from 8 to 69 min each.
  - **38 exited in under a minute.** The queue then held 4 items, 2 of them under `Claimable from:` holds, or the WIP-until-merged gate was waiting on an armed PR.
  - **1 crashed and was resumed 3 h later**: the 03:31Z run. See Findings.
  - Overnight short exits are correct behaviour on a thin, held shelf. They are not idle waste.
- **Queue depth: refilled.**
  - Ready for Dev dipped to **4** (2 held) overnight 10-13/14, but never hit zero.
  - It now holds **18**, because the warm round 2 and economy filings landed this morning.
  - The design lane ran its slots and kept a shelf. Last week's supply concern has not come back.

## Findings filed

- **[THR-1887](https://linear.app/threadbare/issue/THR-1887): two pickup sessions built THR-1839 in parallel.** A claim carries no session identity, so a resumed crashed run and the next scheduled run both claimed it at 06:45–06:46Z. High, `Ready for Dev`, Continuous Improvement, Improvement + Infrastructure, coordination block inline. It also owns closing the leftover draft [PR #2367](https://github.com/christianspliid-ui/threadbare/pull/2367) and salvaging its one unique piece, the impediment-1183 timeout fix.
- **[THR-1888](https://linear.app/threadbare/issue/THR-1888): the design lane closes non-wayfinder design tickets against its own rule.** The lane closed five such tickets itself (THR-1782, 1784, 1805, 1806, 1807). It also left one open per the rule (THR-1785), which held the warm round 2 gate shut about 17.5 h. The ticket proposes a design-request carve-out. Medium, `Ready for Dev`, Continuous Improvement, Improvement.

Both were re-read with `get_issue` after creation: state `Ready for Dev`, assignee null.

## Clean checks

- **Ship mechanics: PASS.**
  - **50 distinct line-anchored `Fixes THR-XX` closers** on `main` in the window. Every one landed on an issue that is now Done, and no merged PR left its issue open.
  - The Done issues without an in-window closer are all accounted for:
    - wayfinder tickets (carve-out);
    - THR-1779, THR-1814 and THR-1817, which have merged landing PRs whose closers predate the window;
    - THR-1808 (shipped under THR-1837's commit) and THR-1644 (shipped via THR-1754/1755);
    - THR-1785, closed on Christian's chat instruction, with the gate recorded;
    - the five design-lane closures, which are THR-1888.
  - No false close (THR-540 pattern) found.
- **Open-PR backlog: no rot.** There are 4 open PRs, the oldest about 2 h. Three are armed and waiting on checks. The fourth is the THR-1839 duplicate draft, which THR-1887 owns.
- **CI: PASS.** `ci.yml` since 10-07 shows 238 success, 1 failure and 18 cancelled (superseded pushes). `main`'s latest push run is green.
- **WIP and claim discipline: one finding (THR-1887), otherwise PASS.**
  - In Dev holds one item, [THR-1819](https://linear.app/threadbare/issue/THR-1819), claimed 07:58Z with armed [PR #2382](https://github.com/christianspliid-ui/threadbare/pull/2382).
  - No issue sat claimed for 24 h+ without a checkpoint.
  - No executor wrote `state:"Done"`.
- **Checkpoint hygiene: PASS.** No issue reached 3+ checkpoints without shipping. [THR-1580](https://linear.app/threadbare/issue/THR-1580) shipped as 12 sequential PRs in one night, by design ("one reader at a time"). It was not stalled, and all 12 merged.
- **Handoff quality: PASS (sampled).**
  - Design-lane handoffs keep the decision-record shape (Decision / Why / Options / Would change / Outputs) with plan-doc links and `Claimable from:` holds.
  - Orchestrator promotions carry the full coordination block with mutex reasons. THR-1839's promotion is a model of the form.
  - Direct-filed scoped tickets such as [THR-1886](https://linear.app/threadbare/issue/THR-1886) carry their approach and a Done-when without a plan doc, which is acceptable for that shape (THR-836).
  - I saw no pickup bounces for a missing block.

## Handoffs to the Friday retro

- **Load-timeout test flakes under the full gate.** The THR-1839 runs hit three tests that time out under load and pass alone (doom milestones, a node test, the undertaking grid). Impediment 1183 and the earlier 1167 are recurrences. This is test health.
- **Linear auto-links `#NNNN`.** Linear rendered "impediment #1183" in a ticket body as a link to PR 1183. Any lane that writes `#<n>` for impediment rows into Linear makes the same false link. It is a small writing-convention item for the impediment-reporter skill.

## Notes

- **How the duplicate happened, from the transcripts.**
  - The 03:31Z pickup session's first turn ended with exit code 3221225786 (0xC000013A).
  - The next message in that session is a `[user] Try again` at about 06:45Z. I can't tell whether Christian typed it or the app re-sent it, so the report doesn't assume either.
  - The resumed session ran the whole pickup from its 3-hour-old start. It read the board fresh and claimed THR-1839 at the same time as the 06:45:26Z scheduled run.
  - The groomer and the 07:19Z pickup both caught the duplicate within minutes. The detection worked; the prevention didn't.
- **Why THR-1888 is Ready for Dev, not Todo.** The direction is an agent call under the delegation rule, and the edit is a scoped docs change. If Christian vetoes, the ticket flips to "enforce the rule" instead. The edit stays the same size.
- **Why the design-lane closures are not filed as a Rule 3 violation.** Rule 3 targets executors bypassing merge auto-close on code. These are design tickets with no code and with every output linked. The defect is two contradictory rule texts, not a false close.
- **The window overlaps last week's report** by about a day, because that run fired late. The 10-08 Done items counted here (THR-1747, THR-1768, THR-1744, THR-1782, THR-1784) may also appear in last week's 79.
- **No queue mutation.** This retro claimed nothing, moved nothing and closed nothing. It created two issues and posted one correction comment, on THR-1887.
