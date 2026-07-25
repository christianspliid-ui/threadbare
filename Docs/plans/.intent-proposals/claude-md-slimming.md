# Action Proposal — CLAUDE.md slimming pass (THR-760)

## intent_quote

> take a look at this https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models and assess if we need to update our context files for our setup for threadbearer

Followed by (after the assessment recommended "Open a design ticket for a 'CLAUDE.md slimming pass' scoped as: (1) move the scheduled-task registry to Docs/ops/, (2) collapse Design Governance and Documentation Strategy to pointers at their canon homes, (3) cut the Domain Skills table to a few routing lines, (4) trim Debug Bridge to a pointer at the .d.ts plus the two or three load-bearing warnings, (5) retire the global ~/.claude/CLAUDE.md. … Want me to write that up as a Linear ticket and plan doc for the executor lane?"):

> yes

## scope (what this plan does)

Relocates ~8k tokens of duplicated always-loaded context out of the project CLAUDE.md into authoritative homes (new `Docs/ops/scheduled-tasks-registry.md`, `Docs/canon/process.md` absorbing Design Governance with the pointer direction flipped, skill `description:` frontmatter, `src/debug-bridge.ts` JSDoc, `Docs/documentation-ownership.md`), leaving pointers behind; retires the generic global `~/.claude/CLAUDE.md` after archiving it into the repo. Docs + comment-only; no runtime behavior changes.

## scope (what this plan does NOT do — explicit non-goals)

- Does NOT delete or weaken any project rule — relocation only, with a named destination required per removed paragraph.
- Does NOT touch Definition of Done, Session Types, Testing, Sandbox Limitations, Viewport Contract, Load-Bearing Decisions, Rejected Approaches, NFPs, Codesight, or the freshness table (explicitly kept; a possible follow-up ticket, not this one).
- Does NOT restructure the canon/skill/UL architecture (the article endorses it as-is).
- Does NOT change any engine/content/UI behavior; `src/` edits are JSDoc comments only.
- Does NOT chase the originally-floated 8–10k final size; honest landing for this scope is ~13k and the plan says so.

## impact_class

High-risk. (Judge-corrected 2026-07-25 from the author's original "Reversible": the skill's classification table lists CLAUDE.md edits and canon-page rewrites as High-risk, and this plan does both, plus a `design-session` skill edit that changes other agents' behavior. Mechanically everything reverts via git — the global-file deletion is archived into the repo first — but the class follows the blast surface, not the revertability. Explicit user sign-off is recorded below.)

## evidence cited

- **Linear issue:** THR-760
- **Vision premises invoked:** none (no game-design surface); layer model in `Docs/plans/2026-05-05-canonical-documentation-strategy.md` invoked as direction
- **UL terms touched:** none; no new terms
- **Canon pages consulted:** `Docs/canon/process.md` (read in full — confirmed it is a pointer page whose Design Governance target is CLAUDE.md, hence the authority flip rather than a delete)
- **Prior plan docs this builds on:** `2026-05-05-canonical-documentation-strategy.md`, `2026-04-13-linear-coordination-protocol.md` (untouched, cited)
- **Rejected approaches considered and dismissed:** delete-on-faith; full rewrite; move checklist into design-session skill; auto-generate the skills table (see brainstorm companion)

## load-bearing decisions touched

None of the "Load-Bearing Architectural Decisions" entries are touched — that section is explicitly in the keep-verbatim list.

## high-impact files touched (from Codesight)

None. Only `src/` files touched are `src/debug-bridge.ts` / `src/debug-bridge.d.ts` (dev-only bridge, not on the ≥100-importer list; comment-only edits). No Blast Radius section required.

## kill criteria

If, within two weeks of merge, sessions demonstrably mis-follow a relocated rule (e.g. a design session skips the governance checklist because the pointer chain broke, or a scheduled-task change lands without updating the registry), the pointer is judged too weak: restore the affected section to CLAUDE.md verbatim (git revert of that hunk) and log the failure as an impediment for the retro. The weekly drift scan + workflow retro are the detection surfaces.

## explicit user sign-off

Required (High-risk class) and present: Christian's verbatim chat reply "yes" (2026-07-25, morning session) to the assistant's exact 5-item scope proposal quoted in intent_quote above — including the global CLAUDE.md retirement. Recorded in the plan doc ("Human gate satisfied via chat review 2026-07-25") and in the THR-760 issue description.

## author notes for the judge

- The measured section sizes in the plan are from a chars/4 script run this session; they are estimates, and the Done-when uses a chars threshold rather than exact token counts for verifiability.
- The main judgment call: flipping process.md's authority direction for Design Governance (canon becomes authoritative, CLAUDE.md becomes pointer). This matches process.md's own stated end-state model but inverts its current line-15 convention for that row; the plan requires updating that line in the same PR.
- The savings estimate was revised down from the chat assessment (8–10k final → ~13k final) once the approved keep-list was subtracted; the plan discloses this rather than widening scope to hit the earlier number.
