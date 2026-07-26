# Action Proposal — THR-799 Ceremonial reveal surface

## intent_quote

> can you integrate design/UI learnings from this "cards" into our game's design system? i would like us to get to this level of fidelity and space in our UI when we show minor game elements like, attachments, action cards, traits, smaller events.

(Accompanied by a screenshot of a Civilization VI "Tech Unlocked" popup card: ornate gold frame, centered letterspaced "TECH UNLOCKED" title, circular wheat-icon medallion, "AGRICULTURE" banner band, "UNLOCKED BY THIS TECH (2)" icon-chip row, inset flavor-quote panel with attribution, full-width OK button.)

## scope (what this plan does)

Extracts nine design learnings from the reference card and lands them in the design system as three new shared primitives (`Medallion`, `FlavorQuote`, `RevealCard` — the latter a compound surface built on the existing `Modal`), new CSS tokens/classes (`--space-ceremonial`, `.inset-well`, `.frame-ceremonial`), one small content table (`reveal-content.ts` — ceremony titles + fallback flavor per element kind), and a same-PR adoption pass over four existing minor-element surfaces (EventPopup ceremonial path, THR-639 beat-unlock reveal, AttachmentDetailView, trait detail presentation). Design-system docs and StyleGuide registration included.

## scope (what this plan does NOT do — explicit non-goals)

- No engine changes — consumes only events that already exist. New reveal *triggers* (e.g. a popup on attachment acquisition) are engine-side deferrals, filed not built.
- No redesign of sidebar list rows / density surfaces — the lesson applies to moments, not lists.
- No corner filigree SVG work in v1 (double-border frame only; v2 follow-up if v1 looks bare).
- No new modal implementation — RevealCard composes the existing `Modal`.
- No numeric stats introduced anywhere — chips and labels are words/icons.
- No changes to ActionCard's own frame.

## impact_class

Reversible — additive UI primitives + presentational adoption of existing surfaces; every touched surface keeps a working prior path (EventPopup compact layout preserved; ActionCard untouched).

## evidence cited

- **Linear issue:** THR-799
- **Vision premises invoked:** dark-tapestry identity per `STYLE.md`; "narrative over mechanical" (NFP #5)
- **UL terms touched:** none new; "sphere", "trait", "attachment", "action card" used per existing UL. No UL-proposal needed.
- **Canon pages consulted:** frontend-ui skill (design-system single-load context: tokens, primitives spec, component-selection, anti-patterns), `Docs/canon/rulebook-quick-reference.md` (no rule of play touched)
- **Prior plan docs this builds on:** THR-639 (Ascendant Beat unlock reveal — one adoption target); design-system consolidation work under UI/UX Design Infrastructure project
- **Rejected approaches considered and dismissed:** one-off EventPopup restyle (doesn't fix the systemic gap); standalone CeremonialModal (violates the design system's own anti-pattern rule + NFP #6); full sidebar-row redesign (density surfaces, deferred)

## load-bearing decisions touched

None of CLAUDE.md's load-bearing architectural decisions are engine/graph-level relevant here (no node types, no edges, no position model, no caches). The plan respects the Viewport Contract (modal inherits 85vh cap; nothing below the fold) and the rejected-approaches list (no R3F, no wheel, etc. — untouched).

## high-impact files touched (from Codesight)

None ≥100 importers. `src/index.css` and shared components are wide visual surfaces but are not on the high-impact importer list; CSS additions are new classes only.

## kill criteria

- If the ceremonial EventPopup path fires so often it becomes noise (every minor event interrupting play), the split heuristic is wrong — fall back to compact-by-default and require explicit `presentation: 'ceremonial'` opt-in per popup source.
- If Christian's chat review of the v1 screenshots says the fidelity target is missed (flat, cramped, or off-voice), iterate on the primitives before any further adoption — do not spread a pattern that hasn't passed the benchmark.
- Rollback is trivial: adoption call sites revert to prior layouts; primitives are additive.

## explicit user sign-off

N/A — Reversible impact class.

## author notes for the judge

- The user's ask is a fidelity/space benchmark, not a request to clone Civ VI verbatim — the plan deliberately re-voices the category titles ("TECH UNLOCKED" → Threadbare-register drafts, flagged for Christian's chat review) rather than copying utilitarian wording. Judge should confirm this reads as intent-faithful rather than drift.
- The four adoption surfaces were chosen to cover each element type the user named (attachments, action cards, traits, smaller events) with at least one surface that already has a trigger. Trait/attachment *acquisition popups* don't exist as events yet — building them would cross into engine scope, so they're explicit deferrals. This is the largest gap between "what the user might imagine" and v1 scope, and it is stated as a non-goal.
- Content pillar is thin (one small table + prose reuse) — deliberate, to keep the ticket executor-safe in one PR.
