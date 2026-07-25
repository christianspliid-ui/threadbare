# Brainstorm companion — CLAUDE.md slimming pass (THR-760)

**Plan doc:** `Docs/plans/2026-07-25-thr-760-claude-md-slimming.md`
**Date:** 2026-07-25 · **Author:** Claude Code design session (Fable)

## Origin

Christian asked for an assessment of https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models against the Threadbare setup ("assess if we need to update our context files for our setup"). The assessment (chat, 2026-07-25) found the architecture already aligned — canon pages, skill routing, UL shards, auto-memory, generated references are all the article's recommended patterns — but the project CLAUDE.md measured ~21k tokens always-loaded, roughly 8k of which duplicates content with (or that should have) an authoritative home elsewhere. Christian approved the 5-item scope in chat.

## Alternatives considered

1. **Do nothing / "the architecture is already right".** Rejected: the duplication is not just cost, it is drift — the Domain Skills table and scheduled-task fire times had already diverged from their live counterparts at measurement time. Duplicated prose rots.
2. **Delete rules on faith ("Claude 5 is smart, unhobble it").** Rejected explicitly. Threadbare's rules are empirically earned — gate theater (THR-686), phantom Done (THR-417), green-fielding a built war system (THR-614). The article's "trust judgment" applies to *generic behavioral scaffolding* (hence retiring the global file), not to project-specific failure-mode rules. Every project rule keeps exactly one authoritative home.
3. **Full CLAUDE.md rewrite to ~5k.** Rejected for this ticket: would require restructuring Definition of Done, Session Types, and Testing, which are high-traffic load-bearing text with many inbound references; risk/benefit poor in one pass. Left as an explicit follow-up candidate.
4. **Move Design Governance into the `design-session` skill instead of canon.** Considered — the checklist is only exercised by design sessions. Rejected in favor of `Docs/canon/process.md`: the canon layer is the declared "what governs how we ship" surface, process.md already carries the pointer row, and skills should stay executable checklists that cite canon rather than own it (matches the UL → Canon → Plans layer model).
5. **Keep the Domain Skills table but auto-generate it.** Considered (matches the systems-inventory pattern). Rejected: the harness already injects the live skill list with descriptions each session — a generated duplicate would still be a duplicate. The right home for per-skill triggers is each skill's own `description:` frontmatter.

## Tensions surfaced

- **Empirically-earned rules vs. token cost.** Resolved by the relocation test: a paragraph may leave CLAUDE.md only when the executor can name the file where it now authoritatively lives.
- **Handoff-visible risk:** design sessions follow CLAUDE.md § Design Governance *by reference from the design-session skill*; if the pointer flip misses a reference, future design sessions follow a gone section. Mitigated with per-item grep sweeps in the plan's Done-when.
- **Global CLAUDE.md is cross-project and outside version control.** Resolved with archive-before-delete into `Docs/ops/`, plus a stop-and-surface clause if project-specific content is found in it.
- **Honest target revision:** the chat assessment floated "8–10k final"; scoping DoD/Session Types/Testing out (deliberately) lands ~13k. The plan states this openly rather than pressuring the executor to over-cut.

## Vision premises invoked

None — no game-design surface. The relevant "vision" document is the process canon layer model (`Docs/plans/2026-05-05-canonical-documentation-strategy.md`), which this plan strengthens: it moves CLAUDE.md toward "navigation + gotchas" and canon toward "authoritative spec", the declared end-state of that strategy.
