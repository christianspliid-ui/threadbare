# Extending the UI — one entry per kind

> **Law 58** (`laws.md` § XVI, Christian, chat 2026-10-14): *the UI grows by adding entries, not by writing screens.* This page is where an agent looks first when the game gains a new action, field, object kind, icon, lens or ask. Each row names the one place to add it, the check that catches a missing entry, and where to see the result.
>
> **Keep this page true.** A PR that adds or changes an extension point updates its row in the same PR. A row marked **several places** is a Law 58 debt with a ticket; when the ticket lands, the row becomes one place.

## Where to add things

| You are adding | The one place | What catches a missing entry | Where to see it | Status |
|---|---|---|---|---|
| A section on an object's page (a new field the player should see) | One `SectionSchemaEntry` row for that kind in `DETAIL_PAGE_REGISTRY` (`src/data/detailPageTemplates.ts`): `typeId`, `order`, `mandatory`, a resolver in `src/engine/detailPageResolvers.ts`, optional fallback | The registry is `Record<GraphPageKind, …>`, so a kind without a schema is a type error; a section that resolves to nothing is skipped, and a page with no sections shows the `unknownStub` | The object's page today; the Inspector lab (`?view=inspector-lab`, THR-1876) once built | One place |
| A new kind of object with a page | Add the kind to `DetailPageKind` (`src/types/detailPage.ts`; `GraphPageKind` derives from it) and give it a schema in `DETAIL_PAGE_REGISTRY`, plus a `KIND_LABELS` entry | Type errors until both exist; an unknown kind renders `unknownStub`, never nothing | As above | One place (two adjacent entries in one file) |
| A UI word, label or tooltip | `src/data/ui-content.ts` (the `ui.*` tooltip registry) | `tooltipValidation.test.ts` (length and form) | Hover it in the game | One place |
| A map lens | One `MapLensDef` in `MAP_LENSES` (`src/data/map-lenses.ts`) plus its layer | `MapLensId` is a closed union | The lens bar on the map | One place; THR-1878 grows it to four lenses |
| A shared UI part (a primitive or a variant) | `src/components/shared/`, with a style guide section and a `component-selection.md` row in the same PR (Law 29) | `styleguideSync.test.ts` | `?view=styleguide` | One place |
| A moment: a surface that stops the world or comes forward on its own (an encounter, a story beat, a gift, a rite, the end of a cycle…), and which home it plays in (the Stage, a dialog or a full-screen ceremony) | One entry in `HOMED_SURFACES` (`src/data/homed-surfaces.ts`): kind, surface, home, stops time, waits its turn, palette, clock-holder words, held line. Then its open predicate in `HOMED_SURFACE_OPEN_WHEN` and its case in its home's host (`StageHost`, `DialogHost` or `CeremonyHost`). The interrupt registry, the clock-holder names, the dialogue palettes and the ceremony list are derived from it | `homedSurfaces.test.ts` names the list; a missing predicate or host case is a type error; an unknown kind renders `HomedSurfaceFallback` | `__DEBUG.getInterruptState().homedSurfaces` (the list as data); `__DEBUG.openHomedSurface(kind)` on `?view=game&seeded&size=medium` once THR-1892 lands | **Designed** (plan `Docs/plans/2026-10-14-thr-1877-encounter-stage.md` § D1); THR-1877's build makes it one place |
| A player action | `src/data/unified-action-templates.ts` | Partly guarded (see below) | The hand, the action catalog, the Codex | **Several places**: THR-1886 makes it one |
| An icon for a concept | Today scattered glyph tables. Do not add a new emoji or symbol glyph: the UI-debt ratchet (THR-1821) only lets that count go down | The ratchet | `?view=styleguide` | **Several places**: THR-1885 builds the `Icon` primitive; THR-1904 fills the one concept → shape table and makes this one place (design: `Docs/plans/2026-10-14-thr-1879-type-and-icons-rollout.md` § 11, which holds the replacement row) |
| A Codex category | `catDefs` in `getCodexCategories()` (`src/components/Codex/codexRegistry.ts`) and the entries that use it | `codexCatalogCoverage.test.ts` | `?view=codex` | **Several places**: THR-1886 derives `catDefs` from one category list |
| A Needs-you ask | Not built yet: the queue's source is a view model (THR-1822) shown by the frame (THR-1875) | — | The top bar's Needs you | Designed as one registry of producers |

## A new player action, today (until THR-1886 lands)

A template edit alone is not enough when the action uses a **new id-prefix** (for example `company.bless`). Do all six, or the action disappears from some surface without any failure:

1. **Action catalog:** add the prefix to `categoryFor(id)` in `scripts/generate-action-catalog.ts` and a member to its `CatalogCategory` union. An unknown prefix returns `null` and the action is left out.
2. **Regenerate the catalog:** `public/action-catalog.generated.json` must change in the same PR (the wiki-freshness gate).
3. **Beat grant:** if a beat grants the action, add its id to `ASCENDANT_ACTION_BUCKETS` (`src/data/ascendant-beat-content.ts`). Tests fail and name the id if you forget.
4. **Commit generated artifacts** before running `npm run check:generated-freshness`, which compares against HEAD.
5. **Codex entries:** add an arm for the prefix in `getAllCodexEntries()` (`src/components/Codex/codexRegistry.ts`). A missing arm hides the action from the Codex silently.
6. **Codex category:** make sure the entry's category has a `catDefs` row in `getCodexCategories()`. A missing row makes the whole category unreachable.

`codexCatalogCoverage.test.ts` now catches 5 and 6 after the fact, grouped by prefix. THR-1886 replaces 1, 5 and 6 with one prefix → category table that both the catalog script and the Codex read.

## When there is no row for what you are adding

Add the thing as one entry in one list, add a check that fails and names that list when an entry is missing, give unknown members a plain fallback, and add a row to the table above. If that is not possible without a new list that must agree with an existing one, derive the new list from the old one instead.
