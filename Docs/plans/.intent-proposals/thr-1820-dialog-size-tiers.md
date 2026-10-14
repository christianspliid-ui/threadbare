# Action proposal — THR-1820 dialog size tiers

## intent_quote

> ensure we actually use the screen real estate and not end up with under sized dialogues that push us to scroll

— Christian, 2026-10-11 UI review (quoted in THR-1820's description).

> design primarily for minimum 1440p landscape

— Christian, same review (quoted in THR-1819, the blocker this plan builds on).

> A panel grows to its size limit before it scrolls or truncates ('and 24 more'). Only at its tier maximum do long lists go progressive (Law 36).

— the law as ratified by Christian in chat, attended groundwork session 2026-10-14 (shared brief, cross-cutting decision 6: "it enters the Law Book as **[E]**"; human gate satisfied via chat review 2026-10-14).

The issue's own Done-when: *"plan doc lists every modal/overlay/detail surface with its tier, the new Law text is drafted for `Docs/design-system/laws.md`, and the Modal primitive API change is specified."*

## scope (what this plan does)

Authors the plan doc for THR-1820 and adds the ratified law to `Docs/design-system/laws.md` as Law 57 (with a cross-reference line under Law 36 and a changelog row). The plan defines four dialog size tiers (S / M / L / XL) as CSS tokens with values at 1920 / 2560 / 3440, all capped at THR-1819's 85vh; a `size` prop on `Modal` and `RevealCard` that replaces free `maxWidth` (kept, deprecated); a two-column `SheetColumns` primitive for L and above; the `modal-maxwidth` ratchet row with today's baseline (17); a debug report that makes the law checkable in the browser; and a migration list covering every modal, overlay and detail surface in `src/components`, each with a tier, or "retired by THR-1827", or "moves to the Stage (THR-1829)", or "ceremony", "flyout" or "not a panel". It files THR-1880 for the six hand-built dialogs that wait for THR-1821's `Overlay`.

## scope (what this plan does NOT do — explicit non-goals)

- Does not write `src/` (design session).
- Does not re-decide the Inspector's, the Stage's or the frame's geometry (THR-1827 / 1828 / 1829); it states only what Law 57 asks of them.
- Does not define THR-1819's tokens (breakpoint blocks, root step-up, the 85vh token) — it names them and depends on them.
- Does not specify THR-1821's ratchet script or its `Overlay` primitive — it supplies one row (`modal-maxwidth`) and follows THR-1821's rule that `Overlay` sizes nothing (the tiers live on `Modal`).
- Does not migrate surfaces about to be deleted (the profile and sheet modals, `DetailModal`, the detail column, the Stage-bound modals); they keep their free widths until their builds delete them.
- Does not change any rule of play or any engine behaviour. The only player-facing word changes are removing the `+N` chip and adding two static lines: the Chapter Ledger's fail-soft "This chapter has no record to show yet." (slice 1) and the Divine Court picker's "Back to the court" (slice 2, THR-1880).
- Does not edit Laws 33 or 36's ratified text (one italic cross-reference line under 36 only).
- Does not cover screens narrower than 1920 (brief rule 1: keep today's behaviour) beyond a safety clamp.

## impact_class

High-risk — the docs PR adds a binding **[E]** law to the Law Book, which only Christian's dated ratification may do (`laws.md` provenance rule). The explicit sign-off below covers it. The rest of the PR (plan doc, brainstorm, this proposal, a changelog row) is docs-only and reversible.

## evidence cited

- **Linear issue:** THR-1820 (follow-up THR-1880 filed)
- **Vision premises invoked:** the wayfinder map THR-1823 destination "The Map Is the Table"; UI Laws 26, 33, 36, 49, 55
- **UL terms touched:** none — dialog sizes are design-system vocabulary (`Docs/design-system/`), not game-domain language; no `UL-proposal` needed
- **Canon pages consulted:** `Docs/canon/design-governance.md`, `Docs/design-system/laws.md`, `INDEX.md`, `layout-zones.md`, `component-selection.md`, `primitives.md`, `tokens.md`
- **Prior plan docs / decisions this builds on:** `Docs/audits/2026-10-11-thr-1827-inspector-decision.md`, `Docs/audits/2026-10-12-thr-1828-screen-frame-decision.md`, `Docs/audits/2026-10-14-thr-1829-encounter-stage-decision.md`, `Docs/audits/2026-10-13-thr-1833-type-system-decision.md`, the 2026-10-14 groundwork brief (attended)
- **Rejected approaches considered and dismissed:** fluid `min(px, vw)` tiers; a fifth "Stage" tier; automatic tier step-up by measurement; rem-only tiers (S and M are rem, L and XL px, following THR-1819's two token families); container queries for the two-column switch; keeping the `+N` chip; migrating the hand-built overlays in this ticket (all in the brainstorm companion)

## load-bearing decisions touched

None of CLAUDE.md's load-bearing architectural decisions (graph, reaches/spheres, ascendants, node types, edges, position tiers, awareness, mutation/versioning, per-session caches, distance matrix). The plan is presentation-only. The rejected-approaches list is respected (no R3F, no AgentWheel return — the wheel-era `AgendaPicker` / `InterventionConfirm` are listed as retiring with the ActionDrawer).

## high-impact files touched (from Codesight)

None at ≥ 100 importers. `src/components/shared/Modal.tsx` has 24 importers (grep of `from '../shared/Modal'` / `from './Modal'`); `src/index.css` is imported once (`main.tsx`); `src/engine/chapterArchive.ts` changes one constant value read only by `ChapterLedger.tsx`.

## kill criteria

- At 2560×1440 an S or M dialog's content fills under a third of the panel's width on most rows → lower that tier's 2560 value before migrating more.
- Christian says an L dialog "feels like a page" → L at 2560 drops toward 1440 and the Stage-matching rationale is recorded as overridden.
- `__DEBUG.getDialogSizes().open[].scrollingBelowCap` non-empty on a migrated surface → that migration is not done.

## explicit user sign-off

The law, verbatim as Christian ratified it in chat in the attended groundwork session on 2026-10-14 (shared brief, cross-cutting decision 6: *"New UI Law — ratified by Christian in chat 2026-10-14 (human gate satisfied via chat review 2026-10-14; it enters the Law Book as **[E]**, not [P])"*):

> A panel grows to its size limit before it scrolls or truncates ('and 24 more'). Only at its tier maximum do long lists go progressive (Law 36).

Recorded on THR-1820 as a comment, "Human gate satisfied via chat review 2026-10-14", on 2026-10-14 at 08:26Z, before the handoff. Law 57's text in `laws.md` keeps both sentences' meaning and adds only the membership and ordering clauses this plan was asked to draft.

## author notes for the judge

- The numbers come from content, not taste: S holds ~69 characters of prose at both screens; M holds one row of four 210 px hand cards (the Stage's row); L matches the Stage panel width; XL is the screen minus gutters. S at 600 equals today's `Modal` default so default callers do not move at 1080p.
- THR-1819's and THR-1821's plans were written in parallel. Their drafts appeared during this session, and this plan was aligned to them: `--modal-max-h`, the `base`/`fhd`/`qhd`/`uwqhd` tiers, THR-1819's two token families (S and M are rem text containers, L and XL px frame values), its layout-contract parity test, THR-1821's row name `modal-maxwidth`, its rule that `Overlay` sizes nothing (tiers stay on `Modal`), and its Overlay slice moving `ChoiceSetModal` onto `Modal`. Names follow the drafts; if a merged plan renames one, the executor uses the merged name. Values do not change.
- One cross-plan conflict is noted, not resolved here. THR-1821's draft moves `ScryOverlay` (the Divine Court) and the in-game Codex layer onto `Overlay backdrop="void"` as "full-screen ceremonies". THR-1829 and the brief (rule 7) make the court a dialog, and the brief also lists the Codex, "until its placement is decided", as a dialog tier. This plan follows the brief: L and XL dialogs (THR-1880). THR-1820 is now also blocked by THR-1821 (the ratchet it registers its row in), and is mutex with THR-1821's Overlay slice on `Modal.tsx`.
- The migration list was built from a full grep of `<Modal`, `<RevealCard`, `<DetailModal`, `maxWidth=`, `fixed inset-0`, `absolute inset-0 … z-`, `position: 'fixed'` and `createPortal(` in `src/components`; two surprises are recorded as facts: `StrandView` is unreachable (its opener is destructured and never passed) and `MandateTracker` is unmounted.
- One genuine creative question was noticed and **not** decided: whether the cycle-end harvest should become full-screen ceremony. The plan keeps today's shape (a centred panel) and tiers it M; it is reported back, not decided.
- `CHAPTER_LEDGER_PAGE_SIZE` lives in an engine file but is read only by the Ledger component; changing it does not make this an Engine-pillar plan.
