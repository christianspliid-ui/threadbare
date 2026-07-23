# Project Status

> Updated 2026-07-23. Detailed per-ticket narratives that used to live here are archived: shipped-work one-liners in `Docs/project-history.md`, full rationale rows in `Docs/changelog.md`, and the wiring detail in `Docs/plans/wiring-checklist.md`. This file stays ≤60 lines by contract.

## Current Focus

**Encounter volume — Tier 2 is live.** THR-573 shipped the context-multiplication grammar (2026-07-23): authored `contextFragments` let one template read as many scenes along the same axes the surface key already uses. Proof unit `social_scene.recruitment_pitch` = 20 surfaces from 9 fragments; `npm run volume-model` now reports **measured** counts against the ~1,584 library target, so the gap is an observable. Phase-2 scale-out (retrofitting more families via the new `template-context-rewrite` skill) gates on the KPI read — deliberately not started.

**Merge-queue friction closed.** THR-714 (2026-07-23) made `ul-dashboard.generated.json` regenerate deterministically — the wall-clock field it carried made any two PRs that ran `prebuild` conflict on every cascade merge, which silently stalled armed auto-merges (impediment #197). A sweep of `prebuild` confirmed it was the last non-deterministic artifact of the 25.

**Interface drift is now a checkable class.** THR-717 (2026-07-23) shipped the contract registry + downgrade-only liveness generator: 20 cross-system contracts carry design intent, grep-verifiable symbols, and a badge that can only be *downgraded* mechanically — 🟢 LIVE requires dated human verification, because a naive write+read symbol match would have re-badged both known leaks green. `prebuild` fails if any contract reads LEAKED without a remediation ticket. Design Step 0.7 + a `lint:plan-doc` nag make it binding on new plans; drift-scan S11 seeds one audit ticket/week against the 15 still-unaudited subsystems. Remediation backlog: THR-718…THR-723.

The Ready-for-Dev queue holds THR-722 (retire dead `grants[]`). The hourly `tb-opus-pickup` lane and `keep-work-flowing-cc` briefing are live; new work flows through Linear (Threadbare team).

**Recently completed (2026-07-22, marathon):**
- **M3 Dynamic Economy nearly complete** — THR-669 (route events + the trade-route pipeline revived: three stacked engine bugs meant no route had ever survived), THR-670 (cargo route lines + tooltips on HexMapV2), THR-617 (P3 power couplings: systemic monopolies with live chronicle prose, sphere drift from cargo flows, faction gold term, scarcity arcs with intervention encounters). THR-618 partial: all five divine economic verbs now `[IMPL]` (reveal vein / guide caravan / sour mine shipped, bless/blight were live) and the Flow Web extraction checkpoint is decided (**defer** — `Docs/plans/2026-07-22-flow-web-extraction-checkpoint.md`); only the THR-611-coordinated essence bridge remains.
- **War project complete** — THR-628 (battle depth: prepared defense, tactical events, breach surfacing, battle IPK), THR-629 (siege gravity-well repair: dead capability gates fixed, relief_march + sabotage live), THR-630 (Phase D: notable-agenda roster + five families incl. the Campaign war hand-off that opens war to the nations, NotablesPanel, power-vacuum verification).
- **Scene Integration complete incl. follow-ups** — chain A–F shipped earlier; THR-712 (guild-tier sweep: cast figures, one genuine bond, 44 continuity seeds, permanent guild prose-QA gate) and THR-713 (381 invented-name literals across seven branching encounters retired to `{cast:*}`).
- **Cowork migration complete** — THR-677 ports live (daily grooming, workflow retro, project hygiene), THR-684 attachment-pipeline prompts written, THR-704 scheduler hygiene, monthly-rulebook-review registered.

## Milestone Status

Tracked in [Linear Projects](https://linear.app/threadbare/projects). Active: Thematic Pressure & Living World (war system now fully live), Content Architecture (scene integration complete). See Linear for per-project state — this file does not duplicate it.

## Where things live

- Shipped work: `Docs/project-history.md` (one-liners) + Linear Done
- Rationale: `Docs/changelog.md`
- Wiring: `Docs/plans/wiring-checklist.md` + `Docs/plans/2026-04-16-systemic-wiring-guide.md`
- Rules of play: `Docs/canon/rulebook.md` (+ quick-reference)
- Christian-facing: `Design/briefing.md` / `Design/user-actions.md` (hourly refresh)

## Active Backlog Ideas

None parked here — file ideas as Linear issues (predicates, not counts; see `Docs/canon/process.md`).
