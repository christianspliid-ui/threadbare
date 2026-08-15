# User Action Required

**Last updated:** 2026-08-15 23:56 local (2026-08-15 21:56 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. Approve the batch-1 brief, and pick the art arm — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)

Your ruling 2 says a batch does not run until you approve its brief. One is drafted and parked: [`2026-08-15-retrofit-batch-1-brief.md`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-08-15-retrofit-batch-1-brief.md) ([PR #1491](https://github.com/christianspliid-ui/threadbare/pull/1491)).

**Decision — 27 nudge cards name art plates that were never made.** The library ships 16. Recommendation: generate the ~12 with no honest neighbour (`coin`, `road`, `water`, `tracks`, `listening`, …), remap the ~15 that have one (`mind`→`focus`, `time`→`time-slow`, `spark`→`energy`, `stonework`→`matter`). Half the art cost, without flattening card faces that mean different things. Approve, veto, or pick the other arm.

**Yes/no — batch 1 is six of the camp seven, not the slice five.** The gate was run over all 191 encounters first: the slice encounters were repaired between 08-09 and 08-14 and no longer match the 2026-08-08 audit, while the camp seven are genuinely bare. You sample 2 of the 6 when it runs — suggested: Ward the Camp and Tend to Wounds.

### 2. Close [THR-1129](https://linear.app/threadbare/issue/THR-1129/encounter-factory-ruling-9-sitting-fable-drafts-the-amended-nudge) — one click, nothing to build

The amended spec and exemplar it asked for shipped 2026-08-09 under [THR-883](https://linear.app/threadbare/issue/THR-883/fable-encounter-writing-prototype-lock-the-exact-authoring-format), verified line by line against all three Done-when items; your chat approval was recorded that day. It needs *you* because no automated lane may write `Done`, and closure normally rides a merged PR — there is none when the work shipped a week ago under another id.

It is no longer blocking: an agent verified the spec is on `main` and started THR-1130 past the mutex, recording the reversal. This is hygiene only.

*If the ticket shows an assignee when you open it, ignore that — Linear's GitHub integration re-assigns on PR events (impediment #607), not a session claiming the work.*

### 3. An attended design session for [THR-790 — Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)

*— from tb-orchestrator.* The longest-waiting agreed item on the board (created 2026-07-26, part of the Traits program you settled that day), staged because the Ready-for-Dev shelf ran thin. Its blocker has been `Done` since 2026-07-26; what it still lacks is a plan doc, which needs a design session before an executor can take it. Loads and rationale are in the staging comment on the ticket.

### 4. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

## Resolved this period

- 2026-08-15: **you ruled the consequence verdict, and the standard is already in canon.** [THR-974](https://linear.app/threadbare/issue/THR-974/consequence-verdict-session-christian-rules-on-world-graph-consequence) — mechanics pass, prose does not, *"i think we need the prose changed."* The three plainness moves entered the prose register model and the nudge authoring spec within 50 minutes ([PR #1480](https://github.com/christianspliid-ui/threadbare/pull/1480), [PR #1481](https://github.com/christianspliid-ui/threadbare/pull/1481)); your 10 verbatim rewrites ride the retrofit, now ticketed as [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to).
- 2026-08-15: **a broken gate stopped reporting success.** [THR-1128](https://linear.app/threadbare/issue/THR-1128/checktypecheck-reports-ok-0-errors-down-from-baseline-when-tsc-is) — the typecheck check said "OK — 0 errors" when the compiler was simply absent, then invited committing that as the new floor.
- 2026-08-15: **the resolution readout stopped reporting percentages to you.** [THR-1124](https://linear.app/threadbare/issue/THR-1124) ([PR #1479](https://github.com/christianspliid-ui/threadbare/pull/1479)) — raw numbers on a player surface, replaced with language a player can read. Deployed.
- 2026-08-15: **condition and attachment names explain themselves.** [THR-1122](https://linear.app/threadbare/issue/THR-1122) ([PR #1477](https://github.com/christianspliid-ui/threadbare/pull/1477)) — hovering a condition or attachment name now gives you what it means, wherever it appears. Deployed.
- 2026-08-15: **the stance triple is gone from the game.** [THR-1123](https://linear.app/threadbare/issue/THR-1123) ([PR #1475](https://github.com/christianspliid-ui/threadbare/pull/1475)) — Gate Duty, the last quest encounter still decorating the `supportive / coercive / withdrawn` purchases you condemned at 10:00, now authors its own hand. Deployed.
- 2026-08-15: **the ascendant bar's tooltips come from one place.** [THR-1118](https://linear.app/threadbare/issue/THR-1118) ([PR #1476](https://github.com/christianspliid-ui/threadbare/pull/1476)) — raw internal keys were reaching a player surface; they now resolve through the shared registry.
- 2026-08-15: **the Encounter Factory ask was this lane's error — withdrawn, and the jam it caused is now cleared too.** [THR-1043](https://linear.app/threadbare/issue/THR-1043) was briefed for several days as needing your attended session. In fact you approved the plan 2026-08-08 and the authoring format locked 2026-08-09 ([THR-883](https://linear.app/threadbare/issue/THR-883)). At 21:35 an agent verified that independently, freed the design slot the epic was squatting, and filed the two remaining operation items as [THR-1129](https://linear.app/threadbare/issue/THR-1129) and [THR-1130](https://linear.app/threadbare/issue/THR-1130).
- 2026-08-15: **the encounter veil stopped selling odds.** [THR-1121](https://linear.app/threadbare/issue/THR-1121) ([PR #1474](https://github.com/christianspliid-ui/threadbare/pull/1474)) — the stance purchases behind Intervene/Resume are gone from the veil and the fix is deployed.
- 2026-08-15: **a consequence chip now links what it grants.** [THR-1120](https://linear.app/threadbare/issue/THR-1120) ([PR #1473](https://github.com/christianspliid-ui/threadbare/pull/1473)) — filed 10:00, live 10:39. The reward or penalty an ending hands out is reachable from the aftermath instead of merely named.

---
*Refreshed hourly by `keep-work-flowing-cc`. Full history of every prior version: `git log -p origin/ops -- Design/user-actions.md`.*
