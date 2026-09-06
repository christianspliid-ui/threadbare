# Briefing
**Generated:** 2026-09-06 15:00 local (13:00 UTC) · keep-work-flowing-cc

## The one thing

**Reconnect Linear.** Four lanes read the board before they do anything, and all four are still shut out: work pickup, the orchestrator, daily grooming, and this brief. None of them can claim a ticket, promote work, or check what is in flight. Linear worked on Friday — this is a change, not a standing gap, and it is now into its second day.

Either fix is enough, and both need you because an unattended session cannot sign in:

- **Re-authorize the Linear connector** — claude.ai → Settings → Connectors.
- **Or set `LINEAR_API_KEY` in the machine environment** — better for the scheduled lanes: no browser sign-in, and it does not lapse the same way. The code that reads it is already shipped. (Confirmed unset again this run.)

**Why this one first:** your approval at the top of the list below — *"batch 2, run the six"* — will not start the machine while this is broken, because the lane that would pick it up cannot claim the ticket. You can still start it by hand in a chat session; it is only the unattended machine that is stopped. Everything else queued behind you is in the same position.

*(Raised again this morning by [tb-orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-06.md) and [daily-backlog-grooming](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/backlog-grooming-2026-09-06.md); logged as impediments [#973 and #974](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/impediments.md).)*

## Also waiting (13)

1. [Approve the camp six](https://linear.app/threadbare/issue/THR-1130) — *"batch 2, run the six"* unblocks the retrofit line. [The brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md).
2. [The undertaking retirement list](https://linear.app/threadbare/issue/THR-1392) — four templates get deleted; you asked to see the list first. *"Run 4b"* finishes it.
3. [Do you still want the incident-capture button?](https://linear.app/threadbare/issue/THR-1134) — your own 16 August ticket, 21 days untouched. Yes or no.
4. [Three questions left on the undertakings map](https://linear.app/threadbare/issue/THR-1396) — take [the division rule](https://linear.app/threadbare/issue/THR-1398) first; it unblocks four.
5. [Traits wave 2 — still planning it?](https://linear.app/threadbare/issue/THR-790) — one word, and smaller than earlier briefings claimed.
6. [The fight map — seven open](https://linear.app/threadbare/issue/THR-1258) — settle [monster fights](https://linear.app/threadbare/issue/THR-1263) and [duels](https://linear.app/threadbare/issue/THR-1264) and three more open by themselves.
7. Two sketches ready to build for you to react to — [twenty spells](https://linear.app/threadbare/issue/THR-1232), [thirty items](https://linear.app/threadbare/issue/THR-1236).
8. [Should image spend be gated on you at all?](https://linear.app/threadbare/issue/THR-876) — your answer settles five plates and every batch after.
9. [What is a run about?](https://linear.app/threadbare/issue/THR-1198) — the god's remembrance, or a named campaign. No urgency.
10. [One attended dev-server session](https://linear.app/threadbare/issue/THR-1133) — nine passes, nineteen captures owed. Nothing blocks the sitting.
11. [Chart the hub map](https://linear.app/threadbare/issue/THR-1220) — advice is still *wait*; only you can charter one.
12. A Tenacious-style trait, parked — no ticket, no urgency, listed so it is not forgotten.
13. [Should weekend quiet be normal too?](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md) — one word stops the 45-hour gap reaching you again.

## Queue

**Stale — Linear was unreachable this run too, so nothing below was read today.** Last verified Friday 2026-09-04: 10 Ready for Dev, 3 In Dev (THR-1410 live; THR-1130 and THR-1392 parked on your gates above). No open PRs at all right now, so nothing is stranded mid-merge — that part is measured, not carried. Recommended next pickup is unchanged from Friday: [THR-1411](https://linear.app/threadbare/issue/THR-1411) then [THR-1416](https://linear.app/threadbare/issue/THR-1416). **No parked-In-Dev scan ran; this lane is the only one that looks, and it could not.**

## Health

- **Two overnight silence gaps** (11.7 h and 10 h, Tue and Thu nights) — declined per your 8 August ruling that overnight quiet is normal. Noted for visibility only. The 45-hour weekend gap is ask 13 above, not a second health item.
- **Everything else green.** Last hour's stuck retrospective PR merged on its own — [#1822](https://github.com/christianspliid-ui/threadbare/pull/1822) is in at [`4ced52a8`](https://github.com/christianspliid-ui/threadbare/commit/4ced52a8) and no PR is now waiting. Deploy up to date at [`5c37c7dd`](https://github.com/christianspliid-ui/threadbare/commit/5c37c7dd) (later commits were docs-only, so no rebuild was owed), all 3 scheduled workflows and all 3 post-merge checks healthy, all 9 scheduled tasks on schedule, the branch reaper ran 16 minutes ago, and tick cost is 85 ms/tick — 1% above the 7-day median, well inside the drift line.
