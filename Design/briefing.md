# Briefing
**Generated:** 2026-08-15 23:00 local (21:00 UTC) · keep-work-flowing-cc

## The one thing

**One click, and it is genuinely yours to make: mark [THR-1129](https://linear.app/threadbare/issue/THR-1129/encounter-factory-ruling-9-sitting-fable-drafts-the-amended-nudge) Done.**

The ticket was filed at 21:32 tonight asking Fable to draft the amended authoring spec plus one exemplar encounter — and an hour later the executor discovered the entire thing had already shipped on 2026-08-09, under a different ticket number ([THR-883](https://linear.app/threadbare/issue/THR-883/fable-encounter-writing-prototype-lock-the-exact-authoring-format)). Not "mostly done" — checked line by line against all three of its own Done-when items: the four rulings are in the spec, the Swollen Ford exemplar was re-run through the full gate tonight and passes clean with zero exemptions, and your chat approval (*"looks fine"*) was recorded on 2026-08-09.

So there is nothing to build. The ticket just needs closing, and **no automated lane is allowed to write `Done`** — every other route to closure runs through merging a PR, and there is no PR here because the work shipped a week ago. That is the whole ask: open it and close it.

The reason it is worth your click rather than waiting: while it sits open in `In Dev`, it reads as work in flight, and the next sibling ([THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to), the 15-encounter retrofit that carries your ten prose rewrites) sits behind a blocker the evidence already cleared.

## Also waiting (1)

- **A Tenacious-style trait** — a parked design option with no ticket and nothing downstream waiting. Say the word if you want it opened; otherwise it stays parked, which is the safe default.

## Queue

**5 ready, 1 in dev (parked, the item above) — the shelf is thin but not jammed.**

- **[THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) is the one real claimable ticket** — High, Content, retrofit the 15 nudge-era encounters to the full Composition Contract. The remaining four are pixel passes ([THR-1109](https://linear.app/threadbare/issue/THR-1109/companions-row-owes-its-19201080-pixel-pass-attended-session-thr-1096), [THR-1125](https://linear.app/threadbare/issue/THR-1125/thr-1121s-veil-rework-owes-its-19201080-pixel-pass-attended-session), [THR-1126](https://linear.app/threadbare/issue/THR-1126/gate-dutys-nudge-stage-owes-its-19201080-pixel-pass-thr-1123-follow-up), [THR-1127](https://linear.app/threadbare/issue/THR-1127/ascendant-bars-four-rehomed-tooltips-owe-their-19201080-pixel-pass)), which need a person at a browser and no unattended run can take.
- **The hour's finding, and it is a good one.** The executor did not rebuild work that already existed. THR-1129's own id-based search came back clean and correctly so — the work had shipped under a *sibling* ticket, which no id-keyed search could see. It was caught by reading the exemplar file's git history instead, and logged as impediment #606 so the next lane checks the artifact path rather than only the ticket number.
- **The traits program moved a step without you.** [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (Traits wave 2) — the longest-waiting agreed item on the board, 20 days unstaged — was staged into `In Design` for a plan doc (*— from tb-orchestrator run h*). That is a design-session need, not a decision for you: you settled the traits direction on 2026-07-26 and the *how* is the agent's.
- **Why the slice replay is still not an invitation.** [THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) stays held for the same reason as the last two hours: your prose ruling this afternoon produced ten verbatim rewrites, and those ride THR-1130's retrofit, which has not started. Replaying tonight would show you prose you already rejected.

## Health

**All green.**

- Live site serves [`6b8718d4`](https://github.com/christianspliid-ui/threadbare/commit/6b8718d4); every commit since is impediment logs and docs, so no rebuild was owed. Home tree on `main`, level with the remote, clean. No PRs waiting to merge. Automated checks running normally, both background jobs healthy, all 9 scheduled tasks on schedule, workspace reaper current (22:40).
- **A second Linear write hazard was pinned down tonight, with a timestamped trace.** Opening a PR whose body names an issue id silently re-assigns that issue — and merging it fires again, 2 seconds later, with no session write involved. That is the last untested candidate from THR-1058, now confirmed and logged as impediment #607. It matters for reading this board: if THR-1129 shows an assignee, that is integration noise, not someone claiming the work. The follow-up PR was rewritten to name no issue id so it cannot re-fire.
- Carried for visibility only, sixth day and unchanged: the scheduled lanes went quiet for 20.6 h on 2026-08-10→11 with no pause marker covering it. Verbatim from the probe: *"The scheduled lanes went silent for 20.6h (2026-08-10T19:57:52.000Z → 2026-08-11T16:32:43.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."*
