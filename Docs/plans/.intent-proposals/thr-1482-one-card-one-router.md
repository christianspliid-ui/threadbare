# Action Proposal — THR-1482 one card, one router

## intent_quote

> I would also like that all content by default has a UI - a card or detail page - that can be shown easily from any UI that references it, via a link/tooltip. Again one solution for all content.

> yes, this is it. and also ensure that it is well integrated in our existing agent harness. start the  design immediately

(Christian, attended chat, 2026-09-12.)

## scope (what this plan does)

Mounts the existing THR-301 detail-page stack in `GameView` behind one router (`useRefRouter().open(ref, mode)`) that dispatches on the canonical `WorldRefKind` and a new `ContentRef`; adds a surface registry (two total records: kind → card kind, sheet) so a kind without a row is a compile error; redraws `DetailPageKind` as a projection of those vocabularies with two new page kinds (`group`, `content`); turns the three existing routers into adapters with coverage tests; adds the missing `NavigationTarget` arms whose sheets already exist; gives `EntityLink` a hover card and click card for every kind; derives the anchor catalog's `linked`/`named` status from the registry; resolves THR-966 as "mount" and ships its TTS Done-when; and in a final slice deletes the two unmounted agent components, `EntityCard` (after its one consumer migrates) and `cultureDetail.ts`. Three execution slices.

## scope (what this plan does NOT do — explicit non-goals)

- Does not rewrite any bespoke sheet (`AgentProfileModal`, `FactionSheet`, `LocationProfileModal`, `ArtifactSheet`, `ArmySheet`, `AscendantSheet`); they are Tier 3 and are preserved.
- Does not return `codex` to `WorldRefKind` (THR-1315 stands); content routes to the codex overlay through `ContentRef`, and that arm invites veto.
- Does not un-withhold companions (`sheet: null` by ruling; the card opens).
- Does not touch HexMapV2 or any WebGL layer.
- Does not author game content; fallback prose for two page kinds and tooltip copy only.
- Does not build the content registry it consumes — THR-1481 slice 1 does; slice 2 here is blocked by it.

## impact_class

Reversible. Additive mount and adapters; deletions confined to slice 3 and limited to components with zero production importers (verified 2026-09-12) plus `EntityCard` after migration.

## evidence cited

- **Linear issue:** THR-1482 (child of THR-1156); resolves THR-966; absorbs THR-1315's reasoning
- **Vision premises invoked:** UI Laws 1, 3, 4, 8, 17, 20, 21, 23–29, 33, 35, 50 (`Docs/design-system/laws.md`); THR-1156 distinction 4
- **UL terms touched:** World Object, Template; no new terms (Card, Sheet are design-system words; `ContentRef` is a code word aliasing Content Object from THR-1481)
- **Canon pages consulted:** `world-objects.md`, `interface-map.md`, `design-governance.md`, `systems-inventory.md`; `Docs/design-system/laws.md`, `component-selection.md`, `primitives.md`
- **Prior plan docs this builds on:** `2026-05-06-detail-page-data-model.md` (THR-319), `2026-05-04-encounter-ui-canonical.md` §5, `2026-08-27-shared-anchor-machinery.md` (THR-1212), `2026-03-16-attachment-detail-card-design.md`, `2026-03-08-tooltip-system-design.md`
- **Rejected approaches considered and dismissed:** prune the cluster and rebuild on `EntityCard`; keep both section models with an adapter; return `codex` to `WorldRefKind`; extend `NavigationTarget` per kind; hover card as a bigger tooltip (see the brainstorm companion)

## load-bearing decisions touched

- **The world graph is mutated in place — never depend on object identity.** Respected: the card is generated on open from the live graph; no memo keyed on graph identity.
- **Everything is a graph node/edge.** Respected: no new node types; the registry is data.
- **Agent position three-tier model.** Respected: sublocation cards route to the parent location's sheet, as today.

## high-impact files touched (from Codesight)

- `src/components/Game/GameView.tsx` — one importer but ~5,400 lines; the mount and adapter rewrite are localised and the adapters are tested. Blast Radius section present.
- `src/types/unifiedAction.ts` (476) — **not touched**.

## kill criteria

- If mounting the stack in `GameView` breaks the 1920×1080 viewport contract (Law 33) or the modal z-band table in a way the Playwright evidence cannot clear, stop and revisit THR-966 as prune.
- If the adapter coverage tests cannot be made total (a `ThreadCategory` or `visualKind` member with no `WorldRefKind`), the vocabulary is incomplete and THR-1212's coverage lint is the place to fix it, not this router.
- If Christian vetoes the codex-as-content-sheet arm, slice 2 sets every content row's `sheet` to `null` and the plan otherwise proceeds.

## explicit user sign-off

Not required (Reversible). Director direction quoted above. The Law 21 amendment and the codex-sheet arm are flagged in the plan as joint decisions with veto invited.

## author notes for the judge

The plan deliberately activates the dormant cluster rather than building a third card system; the judge should check that no section of the plan describes a new section model. Two rulings are absorbed and stated (THR-966 → mount; THR-1315 stands with a corrected premise); one law amendment is proposed, not assumed. The weakest point is the `content` page kind's usefulness before THR-1481's query index exists — the plan mitigates by making slice 2 blocked on THR-1481 slice 1 and by keeping the codex overlay as the sheet so a content card is never a dead end.
