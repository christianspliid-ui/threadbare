# Action Proposal — Pure Claude Code Migration

## intent_quote

> "take an honest look at the way threadbearer ways of working is set up. I really think we have a lot of architectural issues because we are set up running across cowork and claude code. because of the sandbox, the VM issues, the skills not being shared. Are we getting value for money here or should we not just migrate the whole setup to run purely in claude code? please assess, compare, recommend. try to empathize with me as a user. what setup will lower my cognitive load and the amount of manual fiddling in applications and managing handovers, since i am clearly the bottleneck in this setup."

> "you are assuming the UX value of the cowork interface is high compared to the CC interface. unpack that as I am not convinced the difference is that big."

> "yes" — (2026-07-17, in response to "Want the migration plan drafted?" after the recommendation converged on Option B, pure Claude Code)

> AskUserQuestion answers (2026-07-17): Project home = "New project"; Cutover style = "Phased, one week".

## scope (what this plan does)

Migrates all agent work into Claude Code over one phased week: builds CC equivalents (design-session skill, hourly briefing task, ported skills), verifies one full design cycle through the CC path, then disables Cowork scheduled tasks and deletes the bridge machinery (flush-plan-docs pipeline + flush-close-guard workflow + plan-pending-commit label, dual skill trees + sync hook, Cowork sections of CLAUDE.md). Exports Cowork memory to a repo doc first. Touches process/docs/skills/CI-workflow files only.

## scope (what this plan does NOT do — explicit non-goals)

- No changes to Linear as the queue, CI as the merge gate, or the hourly Opus pickup lane — all confirmed working.
- No `src/` changes; no game design, content, rulebook, or Vision changes.
- No change to THR-608 (Christian's chat-only, plain-language review register) — only the app it happens in.
- Does not touch personal (non-Threadbare) Cowork scheduled tasks, e.g. `weekly-invoice-check`.
- Does not delete anything before the Phase 2 parallel-run go/no-go passes.
- Does not decide the fate of the Obsidian MCP for other uses — it only removes the *fallback duality* for vault writes from agents.

## impact_class

High-risk. Reversible at every step by design (deletion-last, revertable commits), but it retires an entire runtime and rewrites CLAUDE.md's coordination protocol — a wrong move degrades the whole delivery pipeline, not one feature.

## evidence cited

- **Linear issue:** THR-TBD — project "Pure Claude Code Migration" + 8 issues to be created (authoring session had no Linear auth; see plan doc Notes for the executor).
- **Vision premises invoked:** none — ways-of-working only.
- **UL terms touched:** none.
- **Canon pages consulted:** `Docs/canon/process.md` domain (governance checklist followed; three pillars N/A'd with rationale).
- **Prior plan docs this builds on:** `Docs/plans/2026-04-13-linear-coordination-protocol.md` (to be updated), `Docs/plans/2026-07-04-user-review-interface.md` (THR-608, unchanged), retro `Design/retros/retro-2026-07-03.md` (primary evidence base).
- **Rejected approaches considered and dismissed:** status quo (structural friction, ~half of ~192 impediments); Cowork-as-messenger-only (challenged by user, inbox value not evidenced by retros); big-bang cutover (user chose phased). Full reasoning in the brainstorm companion.

## load-bearing decisions touched

None of the CLAUDE.md "Load-Bearing Architectural Decisions" (all are game-architecture). The plan does rewrite CLAUDE.md's *coordination* sections (Cowork vs Claude Code, Skill Tree Layout, Known Sandbox Limitations, scheduled-task table) — which function as load-bearing process decisions; that rewrite is the explicit subject of the plan, with user sign-off below.

## high-impact files touched (from Codesight)

None — no `src/` files touched. Blast Radius section omitted per template rule.

## kill criteria

- Phase 2 gate: if a full design cycle cannot flow design → merge → auto-close inside CC within the parallel-run window, stop; Cowork tasks remain enabled; file findings and reassess.
- Post-cutover: if within 2 weeks the briefing-file inbox demonstrably loses time-critical asks (worse than the chat baseline, which already staled 3 retros), add a notification channel; if CC scheduled Linear auth regresses and can't be fixed in a week, re-enable Cowork tasks via revert.
- Rollback mechanics: re-enable Cowork tasks + `git revert` demolition PRs.

## explicit user sign-off

> "yes" — Christian, 2026-07-17, in direct response to "Want the migration plan drafted?" following the explicit recommendation "Option B — pure Claude Code," plus AskUserQuestion confirmations same day (new project; phased one-week cutover). Note: sign-off is for the plan/handoff; Phase 3 demolition additionally gates on Phase 2 evidence.

## author notes for the judge

- The authoring session is itself Cowork and could not reach Linear (connector unauthenticated) — the label/handoff steps deviate from protocol by necessity; the plan doc lands via direct PR and the executor creates the project/issues. Judge should weigh whether that deviation is acceptable rather than Block on it; the alternative was no handoff at all.
- Design-audit-pipeline (Step 8.6) intentionally skipped with rationale in the plan doc: all three audit axes are N/A for a pure process change. If you disagree, say Revise and it will be run.
- Honest uncertainty: the inbox-gap mitigation (briefing file + morning habit) is the weakest link. Evidence says chat surfacing performed no better, but that evidence is thin (3 retros). Kill criteria cover it with an additive fix.
- The plan deliberately violates the *spirit* of NFP #6 (additive over destructive) in Phase 3 and says so in its NFP table — destruction is the value; sequencing is the safety.
