# Briefing
**Generated:** 2026-10-04 19:58 local (17:58 UTC) · keep-work-flowing-cc

## The one thing

**Were you away, or was the app closed, last week?** On two weekday stretches no lane ran at all, and nothing recorded a pause. The longer one: **"The scheduled lanes went silent for 25h (2026-09-29T17:38:06.000Z → 2026-09-30T18:36:30.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."** *— from the lane-silence check* In your time that was Tuesday ~19:30 to Wednesday ~20:20. The other stretch ran from Thursday 1 October ~17:00 to Friday 2 October ~13:45.

One reply covers both, for example "away both times" or "app was closed". If either one wasn't you, say so and it becomes a fault to chase. Details: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Also waiting (2)

- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [Show the roll](https://linear.app/threadbare/issue/THR-1714/dilemmas-hide-the-roll-the-players-whisper-is-a-weight-not-a-choice): **the bonding scenes tell you what your hand did, in words, never odds.** The button reads "Play your hand, let fate answer". A card that pulls one way says so ("Leans Brave"). [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-03-thr-1714-show-the-roll.md). **Veto window closes ~20:45 tonight, under an hour from now.** *— from the design lane*
- [The fair draw for experts](https://linear.app/threadbare/issue/THR-1687/the-candidate-cap-starves-newly-authored-everyday-content-expert): **expert mortals will start to see the expert encounters written for them.** *The call to veto:* mortals would pick their own ambitions less often (3–4% of choices instead of 5–10%). [Evidence](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-04-thr-1687-start-local-drop.md) · [plan § D4](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-01-thr-1687-cap-local-order.md). Veto window closes ~02:45 Monday. *— from the design lane*
- [The world arrives paused with no direction](https://linear.app/threadbare/issue/THR-1716/the-world-arrives-paused-with-no-direction-after-ascend-nothing-says): **after Ascend, "Reach Down" is on screen at once, and the bond's own button, *"Let them walk"*, starts time.** *The call to veto:* say so if you'd rather the world start on its own after the bond. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1716-arrival-first-beat.md). Veto window closes ~08:45 Monday. *— from the design lane*
- [A five-card hand doesn't fit 1080](https://linear.app/threadbare/issue/THR-1732/a-five-card-hand-at-169-doesnt-fit-1080-the-encounter-column-scrolls): **the "Let fate decide" button stays on screen however many cards you're dealt.** Cards stay four per row at the size you approved. When they wrap, the button, your essence and the price · odds · setback key sit in a bar pinned to the bottom. *The call to veto:* say **"five across"** or **"one row"** if you'd rather change your four-per-row rule. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1732-five-card-hand-fit.md). Veto window closes ~14:40 Monday. *— from the design lane*

Say "veto show the roll", "veto fair draw", "veto arrival" or "veto hand bar" to reverse any of these.

## Queue

**4 jobs ready** (healthy), the same as last hour. Nothing has merged since the last brief. It's Sunday evening, and every ready job is waiting out a veto window.

- **Being built:** two rulebook clean-up jobs ([THR-912](https://linear.app/threadbare/issue/THR-912/drift-scan-2026-10-02-rulebook-ul-9-ul-references-broken-in-rulebook) and [THR-913](https://linear.app/threadbare/issue/THR-913/drift-scan-2026-10-02-rulebook-impl-tags-9-impl-tags-with-broken-code)) share one pull request ([#2227](https://github.com/christianspliid-ui/threadbare/pull/2227)). It is set to merge itself but has clashed with main for ~4.5 h. The work is pushed (branch `claude/thr-912-rulebook-drift`) and nothing is sitting uncommitted. A builder clears the clash.
- **Next up:** [Show the roll](https://linear.app/threadbare/issue/THR-1714/dilemmas-hide-the-roll-the-players-whisper-is-a-weight-not-a-choice) (High), buildable from ~20:45 tonight.
- **Buildable Monday:** [the paused arrival](https://linear.app/threadbare/issue/THR-1716/the-world-arrives-paused-with-no-direction-after-ascend-nothing-says) (~08:45) and [the five-card hand](https://linear.app/threadbare/issue/THR-1732/a-five-card-hand-at-169-doesnt-fit-1080-the-encounter-column-scrolls) (~14:40).
- **Held on purpose:** [the fair draw for experts](https://linear.app/threadbare/issue/THR-1687/the-candidate-cap-starves-newly-authored-everyday-content-expert) ([#2180](https://github.com/christianspliid-ui/threadbare/pull/2180)) waits for its veto window (~02:45 Monday). Its conflict is covered under Health.

## Health

- **Simulation speed is still above its weekly norm, five hours running.** "tick cost 149 ms/tick steady, 28% above the 7-day median (116, 119 rows since 73c7bdf7); top phase agent_decision, 523 agents. Name the merges between 73c7bdf7 and 288083e6: git log --oneline --merges 73c7bdf7..288083e6". This matches last hour's number on the same commit, so it is not noise. Finding the cause is a builder's job.
- **The fair-draw pull request has clashed with main for 38 hours** ([#2180](https://github.com/christianspliid-ui/threadbare/pull/2180)). The stuck-PR check calls it abandoned because the builder's unstick duty ([THR-1735](https://linear.app/threadbare/issue/THR-1735/stuck-prs-are-the-pickup-lanes-to-fix-unstick-duty-in-step-08)) has not fired on it. It can't merge before Monday ~02:45 anyway. A builder's job, not yours.
- **The rulebook pull request ([#2227](https://github.com/christianspliid-ui/threadbare/pull/2227)) also clashes with main**, now ~4.5 h. Same duty, same owner.
- **The heavy simulation tests are red on the latest main** (288083e6), now 2 h. A builder owes a fix.
- **The worktree reaper has 6 worktrees waiting for a decision** (468 worktrees and 313 local branches on disk; it last ran 19:40). That is the reaper's own job; it's noted here for visibility.
- Everything else is green. The live site serves the latest main (288083e6), automated checks run normally, and all 11 scheduled tasks are on time.
