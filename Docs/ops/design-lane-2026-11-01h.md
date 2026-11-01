---
lane: tb-design-lane
run: 2026-11-01h
promoted: 0
filed: 4
resolved: 2
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-01 (run h, ~23:18Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Modules and composition — the small set of blocks every panel is built from](https://linear.app/threadbare/issue/THR-2120/modules-and-composition-the-small-set-of-blocks-every-panel-is-built) ([decision](https://github.com/christianspliid-ui/threadbare/blob/docs/plan-thr-2120-ui-modules/Docs/audits/2026-11-01-ui-modules-and-composition.md)): every panel is built from the same seven pieces: who it is, the one "what matters now" line, what your god can do, headed sections, links out, and a quiet line when a slot is empty. Each piece is drawn one way everywhere, so a player learns it once. Veto line: "a different set of blocks".
- Same ticket: sections are grouped by space and their heading, never by a box. Only things you press as a whole (a card, a tile, a dialog option) and the one highlight line get a frame, and boxes never nest more than two deep. Veto line: "keep the section boxes".
- Same ticket: one even rhythm: a wide gap between sections, a small gap under a heading, and one fixed gap between a label and its answer. Veto line: "tighter spacing".
- Same ticket: a section heading looks the same in the Inspector, a dialog and the god rail. The rails are never more cramped than the docked Inspector. Veto line: "let the rails be denser".
- [UI legibility and usability map](https://linear.app/threadbare/issue/THR-2114) closed, and its work is split into four plans: the shared pieces first, then Inspector pages, then the encounter screen and dialogs, then the rails, lists and hover cards. Veto line: "split it differently".

## Work

- **Claimed** [Modules and composition](https://linear.app/threadbare/issue/THR-2120/modules-and-composition-the-small-set-of-blocks-every-panel-is-built) (claim `dl-2026-11-01-2318`). Period focus: it was the last open ticket on [the UI legibility map](https://linear.app/threadbare/issue/THR-2114). The shelf is thin (1 ready), but no focus plan-doc candidate existed until this map closed.
- **Measured before deciding:** three separate section-heading implementations (`SectionLabel` in `Section.tsx`, `SectionHeading`, a local `labelStyle` in `HandSection.tsx`). `Section.tsx` has 39 px spacing literals and 0 `--space-*` tokens. `primitives.md` § SectionHeading still describes uppercase display-face headings the code no longer draws. Census frame depth is 4 on the person page, the Ledger rail, the Stage and the choice dialog.
- **Decided and closed** the ticket (Done, verified) with the decision record. [PR #2694](https://github.com/christianspliid-ui/threadbare/pull/2694) carries the audit, docs gates green, auto-merge queued. The map's Decisions so far are updated.
- **Map closed:** Linear auto-completed [the map](https://linear.app/threadbare/issue/THR-2114) when its last child resolved (the known parent auto-complete, as on THR-1258). The closing carve-up was posted straight after, and four plan-doc tickets were filed (Todo, unassigned, related to the map rather than children of it):
  - [Legibility 1 — the shared blocks, the type ladder and the spacing rhythm](https://linear.app/threadbare/issue/THR-2122/plan-doc-legibility-1-the-shared-blocks-the-type-ladder-and-the): unblocked.
  - [Legibility 2 — Inspector pages](https://linear.app/threadbare/issue/THR-2123/plan-doc-legibility-2-inspector-pages-read-who-now-act-detail-out-at): blocked by 1.
  - [Legibility 3 — the Stage and the dialogs](https://linear.app/threadbare/issue/THR-2124/plan-doc-legibility-3-the-stage-and-the-dialogs-a-title-you-see-first): blocked by 1.
  - [Legibility 4 — the rails, lists and the hover tier](https://linear.app/threadbare/issue/THR-2125/plan-doc-legibility-4-the-god-rail-the-ledger-rail-lists-and-the-hover): blocked by 1 and by [art-led slice 7](https://linear.app/threadbare/issue/THR-2103).
- **Next:** legibility 1 is the next lane plan doc. It can start once THR-2120's veto window closes, at about 11:25Z on 2026-11-02.

## Escalations

None.
