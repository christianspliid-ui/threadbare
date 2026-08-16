# User Action Required

**Last updated:** 2026-08-16 03:02 local (2026-08-16 01:02 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. Sample 2 of 6 from Batch 1 — [THR-1131](https://linear.app/threadbare/issue/THR-1131/retrofit-batch-1-the-slice-six-through-the-factory-line-contract-thr)

Your ruling 6: you sample two encounters per batch. Batch 1 shipped 2026-08-15 23:34Z and has been live since.

- **[The Unsafe Bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)**
- **[The Grateful Kin](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin)**

Chosen because they are the two your own [THR-974](https://linear.app/threadbare/issue/THR-974/consequence-verdict-session-christian-rules-on-world-graph-consequence) rewrites targeted — the clearest read on whether the plainness re-register landed. All six passed the gate; the two sequels were given first nudge hands rather than being dropped.

Batches 2–3 wait on this read, and as of this hour they are the only work left on the board that an agent can build. [All six side by side](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/batch-report-2026-08-15.md) · [PR #1494](https://github.com/christianspliid-ui/threadbare/pull/1494)

### 2. An attended design session for [THR-790 — Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)

*— from tb-orchestrator.* The longest-waiting agreed item on the board: created 2026-07-26 as part of the Traits program you settled that same day, blocker `Done` since then, unstaged for 20 days. Staged when the Ready-for-Dev shelf ran thin.

What it lacks is a plan doc, and that needs you in the room — locations, artifacts, and draw-by-trait pools. Its sibling [THR-791 (wave 3)](https://linear.app/threadbare/issue/THR-791) is blocked on the identical gap and clears once this one lands a plan doc, so the session buys two tickets, not one. Loads and rationale are in the staging comment on the ticket.

### 3. Close [THR-1129](https://linear.app/threadbare/issue/THR-1129/encounter-factory-ruling-9-sitting-fable-drafts-the-amended-nudge) — one click, nothing to build

The amended spec and exemplar it asked for shipped 2026-08-09 under [THR-883](https://linear.app/threadbare/issue/THR-883/fable-encounter-writing-prototype-lock-the-exact-authoring-format), verified line by line against all three Done-when items; your chat approval was recorded that day. It needs *you* because no automated lane may write `Done`, and closure normally rides a merged PR — there is none when the work shipped a week ago under another id.

It is no longer blocking anything: an agent verified the spec is on `main` and ran Batch 1 past the mutex, recording the reversal. This is hygiene only.

*If the ticket shows an assignee when you open it, ignore that — Linear's GitHub integration re-assigns on PR events (impediment #607), not a session claiming the work.*

### 4. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

## Resolved this period

- 2026-08-16: **the checker that marked clean encounters red is fixed.** [THR-1132](https://linear.app/threadbare/issue/THR-1132/checkencounter-live-false-fails-gate-clean-content-reaction-borne) ([PR #1495](https://github.com/christianspliid-ui/threadbare/pull/1495)) — the live-proof sweep counted reaction-borne effects as missing, which is why the Batch 1 report carried five red ✗ against encounters whose gates were all green. Those marks were the tool, not the content.
- 2026-08-16: **the two sequels were saved, not dropped.** [THR-1131](https://linear.app/threadbare/issue/THR-1131/retrofit-batch-1-the-slice-six-through-the-factory-line-contract-thr) — a veto window proposed parking `grateful_kin` and `full_moon_collection` for want of a contract shape. Instead both were authored first nudge hands (5 cards, 4 spheres, all bands covered) and passed the full gate. Batch 1 delivered six, not four.
- 2026-08-16: **you approved the batch-1 brief and chartered the batch.** [THR-1131](https://linear.app/threadbare/issue/THR-1131/retrofit-batch-1-the-slice-six-through-the-factory-line-contract-thr) — approved with one amendment, that your 10 [THR-974](https://linear.app/threadbare/issue/THR-974/consequence-verdict-session-christian-rules-on-world-graph-consequence) rewrites are the editorial critic's validation reference rather than verbatim text: *"run them through the factory instead with the new rules as a validation."*
- 2026-08-15: **you ruled the consequence verdict, and the standard is already in canon.** [THR-974](https://linear.app/threadbare/issue/THR-974/consequence-verdict-session-christian-rules-on-world-graph-consequence) — mechanics pass, prose does not, *"i think we need the prose changed."* The three plainness moves entered the prose register model and the nudge authoring spec within 50 minutes ([PR #1480](https://github.com/christianspliid-ui/threadbare/pull/1480), [PR #1481](https://github.com/christianspliid-ui/threadbare/pull/1481)).
- 2026-08-15: **a broken gate stopped reporting success.** [THR-1128](https://linear.app/threadbare/issue/THR-1128/checktypecheck-reports-ok-0-errors-down-from-baseline-when-tsc-is) — the typecheck check said "OK — 0 errors" when the compiler was simply absent, then invited committing that as the new floor.
- 2026-08-15: **the resolution readout stopped reporting percentages to you.** [THR-1124](https://linear.app/threadbare/issue/THR-1124) ([PR #1479](https://github.com/christianspliid-ui/threadbare/pull/1479)) — raw numbers on a player surface, replaced with language a player can read. Deployed.
- 2026-08-15: **condition and attachment names explain themselves.** [THR-1122](https://linear.app/threadbare/issue/THR-1122) ([PR #1477](https://github.com/christianspliid-ui/threadbare/pull/1477)) — hovering a condition or attachment name now gives you what it means, wherever it appears. Deployed.
- 2026-08-15: **the stance triple is gone from the game.** [THR-1123](https://linear.app/threadbare/issue/THR-1123) ([PR #1475](https://github.com/christianspliid-ui/threadbare/pull/1475)) — Gate Duty, the last quest encounter still decorating the `supportive / coercive / withdrawn` purchases you condemned at 10:00, now authors its own hand. Deployed.
- 2026-08-15: **the ascendant bar's tooltips come from one place.** [THR-1118](https://linear.app/threadbare/issue/THR-1118) ([PR #1476](https://github.com/christianspliid-ui/threadbare/pull/1476)) — raw internal keys were reaching a player surface; they now resolve through the shared registry.
- 2026-08-15: **the Encounter Factory ask was this lane's error — withdrawn, and the jam it caused is now cleared too.** [THR-1043](https://linear.app/threadbare/issue/THR-1043) was briefed for days as needing your attended session. In fact you approved the plan 2026-08-08 and the authoring format locked 2026-08-09 ([THR-883](https://linear.app/threadbare/issue/THR-883)). At 21:35 an agent verified that independently, freed the design slot the epic was squatting, and filed the two remaining operation items.

---
*Refreshed hourly by `keep-work-flowing-cc`. Full history of every prior version: `git log -p origin/ops -- Design/user-actions.md`.*
