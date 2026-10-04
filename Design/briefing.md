# Briefing
**Generated:** 2026-10-04 22:56 local (20:56 UTC) · keep-work-flowing-cc

## The one thing

**Were you away, or was the app closed, last week?** On two weekday stretches no lane ran at all, and nothing recorded a pause. The longer one: **"The scheduled lanes went silent for 25h (2026-09-29T17:38:06.000Z → 2026-09-30T18:36:30.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."** *— from the lane-silence check* In your time that was Tuesday ~19:30 to Wednesday ~20:20. The other stretch ran from Thursday 1 October ~17:00 to Friday 2 October ~13:45.

One reply covers both, for example "away both times" or "app was closed". If either one wasn't you, say so and it becomes a fault to chase. Details: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Also waiting (2)

- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [The fair draw for experts](https://linear.app/threadbare/issue/THR-1687/the-candidate-cap-starves-newly-authored-everyday-content-expert): **expert mortals will start to see the expert encounters written for them.** *The call to veto:* mortals would pick their own ambitions less often (3–4% of choices instead of 5–10%). [Evidence](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-04-thr-1687-start-local-drop.md) · [plan § D4](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-01-thr-1687-cap-local-order.md). Veto window closes ~02:45 Monday. *— from the design lane*
- [The world arrives paused with no direction](https://linear.app/threadbare/issue/THR-1716/the-world-arrives-paused-with-no-direction-after-ascend-nothing-says): **after Ascend, "Reach Down" is on screen at once, and the bond's own button, *"Let them walk"*, starts time.** *The call to veto:* say so if you'd rather the world start on its own after the bond. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1716-arrival-first-beat.md). Veto window closes ~08:45 Monday. *— from the design lane*
- [A five-card hand doesn't fit 1080](https://linear.app/threadbare/issue/THR-1732/a-five-card-hand-at-169-doesnt-fit-1080-the-encounter-column-scrolls): **the "Let fate decide" button stays on screen however many cards you're dealt.** Cards stay four per row at the size you approved; when they wrap, the button, your essence and the price · odds · setback key sit in a bar pinned to the bottom. *The call to veto:* say **"five across"** or **"one row"** if you'd rather change your four-per-row rule. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1732-five-card-hand-fit.md). Veto window closes ~14:40 Monday. *— from the design lane*
- [A minimised encounter step plays out on its own](https://linear.app/threadbare/issue/THR-1730/a-minimised-encounter-step-plays-out-on-its-own-once-time-runs-should): **a moment you set down now waits for you, however long the world runs.** The mortal stands still in that moment, their badge reads "waiting for you", and it never plays out by itself or pops back up. Switching their thread to **Lives on** lets it go. *The call to veto:* say so if you meant minimise as "I'll come back if I can, otherwise let it play out" — a one-line switch. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1730-minimised-step-waits.md). Veto window closes ~20:40 Monday. *— from the design lane*

Say "veto fair draw", "veto arrival", "veto hand bar" or "veto set-down waits" to reverse any of these.

## Queue

**4 jobs ready** (healthy), all four waiting on the veto windows above, so the builder has no new work until ~02:45 Monday. The fair-draw pull request ([#2180](https://github.com/christianspliid-ui/threadbare/pull/2180)) is no longer clashing with main; it is held on purpose until its veto window closes.

- **Being built:** two rulebook clean-up jobs ([THR-912](https://linear.app/threadbare/issue/THR-912/drift-scan-2026-10-02-rulebook-ul-9-ul-references-broken-in-rulebook) and [THR-913](https://linear.app/threadbare/issue/THR-913/drift-scan-2026-10-02-rulebook-impl-tags-9-impl-tags-with-broken-code)) share one pull request ([#2227](https://github.com/christianspliid-ui/threadbare/pull/2227)), set to merge itself but clashing with main. Covered under Health.

## Health

- **The rulebook pull request ([#2227](https://github.com/christianspliid-ui/threadbare/pull/2227)) clashes with main** (opened ~5.5 h ago). The builder's unstick duty ([THR-1735](https://linear.app/threadbare/issue/THR-1735/stuck-prs-are-the-pickup-lanes-to-fix-unstick-duty-in-step-08)) owns it. A builder's job, not yours.
- **The heavy simulation tests are red on main**, now 5 h. A builder owes a fix.
- **The worktree reaper has 6 worktrees waiting for a decision** (476 worktrees, 320 local branches on disk; log updated 22:42). Noted for visibility.
- Everything else is green. Simulation speed is normal (101 ms per tick, below its weekly median of 117), the live site serves the latest commit, automated checks run normally, and all 11 scheduled tasks are on time.
