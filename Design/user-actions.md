# User Action Required

**Last updated:** 2026-08-16 08:55 local (2026-08-16 06:55 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. Sample 2 of 6 from Batch 1 — [THR-1131](https://linear.app/threadbare/issue/THR-1131/retrofit-batch-1-the-slice-six-through-the-factory-line-contract-thr)

Your ruling 6: you sample two encounters per batch. Batch 1 shipped 2026-08-15 23:34Z. Re-verified this run by commit, not by assumption — content commit `781cbbbe` and gate fix `81a5da96` are both ancestors of the live build `4b7e0777`, so these links open the retrofitted versions.

- **[The Unsafe Bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)**
- **[The Grateful Kin](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin)**

Chosen because they are the two your own [THR-974](https://linear.app/threadbare/issue/THR-974/consequence-verdict-session-christian-rules-on-world-graph-consequence) rewrites targeted — the clearest read on whether the plainness re-register landed. All six passed the gate; the two sequels were given first nudge hands rather than being dropped.

[All six side by side](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/batch-report-2026-08-15.md) · [PR #1494](https://github.com/christianspliid-ui/threadbare/pull/1494)

### 2. Charter batch 2 — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)

Parked on you since 2026-08-15 21:16Z: *"a batch does not run until you approve its brief"* (your ruling 2). Best done straight after ask 1, so your read of Batch 1 shapes the next brief. Two things to answer, both with a recommendation already on the ticket:

- **The batch itself.** A brief for the camp six is committed ([`2026-08-15-retrofit-batch-1-brief.md`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-08-15-retrofit-batch-1-brief.md)) — Sharpen Blades, Ward the Camp, Offer a Small Prayer, Rest and Reflect, Tend to Wounds, Scout the Perimeter. Batch 1 ran the slice six instead, so this brief is unspent and is the natural batch 2.
- **Nudge-card art.** The brief framed this as 27 missing plates corpus-wide, generate-or-remap. Batch 1 measured it much smaller in practice: 9 dead tags across six encounters, 7 with honest matches already in the library, and it shipped by remapping. A third option: give the lane a standing rule — *remap where a match is honest, come to me only when it is not* — and the question stops recurring per batch.

### 3. The slice verdict session — [THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game)

*— from tb-orchestrator.* Play the 5-encounter slice end-to-end in the real game and rule on four things: **prose** (does the plain register read grounded), **firing** (does the rhythm work, what is your first pruning instinct — this one needs free play, not only spawn-on-demand), **UI** (the new interface and modifier iconography with real nudge-native encounters), and **game** (is it fun to make these decisions). The consequence verdict was split out and you already ruled it on [THR-974](https://linear.app/threadbare/issue/THR-974/consequence-verdict-session-christian-rules-on-world-graph-consequence).

Open with `run the slice verdict session`. "Needs another iteration" is a valid ruling on any of the four. Waiting since 2026-07-31; both native blockers shipped 2026-08-01, and the surface it asks you to judge finished landing 08-14/08-15. Closing this closes the [encounter experience map](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map).

Overlaps asks 1 and 2 deliberately: one sitting covers all three.

### 4. An attended design session for [THR-790 — Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)

*— from tb-orchestrator.* The longest-waiting agreed item on the board: created 2026-07-26 as part of the Traits program you settled that same day, blocker `Done` since then, unstaged for 21 days. Staged when the Ready-for-Dev shelf ran thin.

What it lacks is a plan doc, and that needs you in the room — locations, artifacts, and draw-by-trait pools. Its sibling [THR-791 (wave 3)](https://linear.app/threadbare/issue/THR-791) is blocked on the identical gap and clears once this one lands a plan doc, so the session buys two tickets, not one.

### 5. Close [THR-1129](https://linear.app/threadbare/issue/THR-1129/encounter-factory-ruling-9-sitting-fable-drafts-the-amended-nudge) — one click, nothing to build

The amended spec and exemplar it asked for shipped 2026-08-09 under [THR-883](https://linear.app/threadbare/issue/THR-883/fable-encounter-writing-prototype-lock-the-exact-authoring-format), verified line by line against all three Done-when items; your chat approval was recorded that day. It needs *you* because no automated lane may write `Done`, and closure normally rides a merged PR — there is none when the work shipped a week ago under another id.

It is no longer blocking anything: an agent verified the spec is on `main` and ran Batch 1 past the mutex, recording the reversal. This is hygiene only.

*If the ticket shows an assignee when you open it, ignore that — Linear's GitHub integration re-assigns on PR events (impediment #607), not a session claiming the work.*

### 6. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

## Resolved this period

- 2026-08-16: **the home tree started updating again on its own schedule.** [THR-1119](https://linear.app/threadbare/issue/THR-1119/autosync-has-been-stalled-12-consecutive-hours-on-three-modified) — fixed 08-15, the stranded note rescued rather than discarded, tree confirmed clean and current again this run.
- 2026-08-16: **the checker that marked clean encounters red is fixed.** [THR-1132](https://linear.app/threadbare/issue/THR-1132/checkencounter-live-false-fails-gate-clean-content-reaction-borne) ([PR #1495](https://github.com/christianspliid-ui/threadbare/pull/1495)) — the live-proof sweep counted reaction-borne effects as missing, which is why the Batch 1 report carried five red ✗ against encounters whose gates were all green.
- 2026-08-16: **the two sequels were saved, not dropped.** [THR-1131](https://linear.app/threadbare/issue/THR-1131/retrofit-batch-1-the-slice-six-through-the-factory-line-contract-thr) — a veto window proposed parking `grateful_kin` and `full_moon_collection`; instead both were authored first nudge hands and passed the full gate. Batch 1 delivered six, not four.
- 2026-08-16: **you approved the batch-1 brief and chartered the batch.** [THR-1131](https://linear.app/threadbare/issue/THR-1131/retrofit-batch-1-the-slice-six-through-the-factory-line-contract-thr) — approved with one amendment, that your 10 [THR-974](https://linear.app/threadbare/issue/THR-974/consequence-verdict-session-christian-rules-on-world-graph-consequence) rewrites are the editorial critic's validation reference rather than verbatim text.
- 2026-08-15: **you ruled the consequence verdict, and the standard is already in canon.** [THR-974](https://linear.app/threadbare/issue/THR-974/consequence-verdict-session-christian-rules-on-world-graph-consequence) — mechanics pass, prose does not. The three plainness moves entered the prose register model and the nudge authoring spec within 50 minutes ([PR #1480](https://github.com/christianspliid-ui/threadbare/pull/1480), [PR #1481](https://github.com/christianspliid-ui/threadbare/pull/1481)).
- 2026-08-15: **a broken gate stopped reporting success.** [THR-1128](https://linear.app/threadbare/issue/THR-1128/checktypecheck-reports-ok-0-errors-down-from-baseline-when-tsc-is) — the typecheck check said "OK — 0 errors" when the compiler was simply absent, then invited committing that as the new floor.
- 2026-08-15: **the resolution readout stopped reporting percentages to you.** [THR-1124](https://linear.app/threadbare/issue/THR-1124) ([PR #1479](https://github.com/christianspliid-ui/threadbare/pull/1479)) — raw numbers on a player surface, replaced with language a player can read. Deployed.
- 2026-08-15: **condition and attachment names explain themselves.** [THR-1122](https://linear.app/threadbare/issue/THR-1122) ([PR #1477](https://github.com/christianspliid-ui/threadbare/pull/1477)) — hovering a condition or attachment name now gives you what it means, wherever it appears. Deployed.
- 2026-08-15: **the stance triple is gone from the game.** [THR-1123](https://linear.app/threadbare/issue/THR-1123) ([PR #1475](https://github.com/christianspliid-ui/threadbare/pull/1475)) — Gate Duty, the last quest encounter still decorating the `supportive / coercive / withdrawn` purchases you condemned at 10:00, now authors its own hand. Deployed.
- 2026-08-15: **the ascendant bar's tooltips come from one place.** [THR-1118](https://linear.app/threadbare/issue/THR-1118) ([PR #1476](https://github.com/christianspliid-ui/threadbare/pull/1476)) — raw internal keys were reaching a player surface; they now resolve through the shared registry.

---
*Refreshed hourly by `keep-work-flowing-cc`. Full history of every prior version: `git log -p origin/ops -- Design/user-actions.md`.*
