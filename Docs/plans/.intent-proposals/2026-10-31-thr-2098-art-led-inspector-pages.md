# Action proposal — 2026-10-31-thr-2098-art-led-inspector-pages

## intent_quote

> "The UI layout of the menus, especially the character menus could use a pass to heighten the quality using icons, images, and so on." (Christian, chat 2026-10-31)

> "yes. and after that this type of treatment should be done to all the UI layers" (Christian, chat 2026-10-31, after approving the person-page mock https://claude.ai/artifact/F7ShcxkK5VqvJErrDk9MNM)

THR-2098 (filed in that session) scopes slice 2: "apply the dressing rules to every non-person Inspector page kind: place (location and sublocation); land; faction / Realm; army; relic (artifact); god; content card; record." It says: "Plan doc: none yet. This is agreed-but-undesigned work for the design lane. Author a slice plan against the programme doc once THR-2097 merges." THR-2097 merged (PR #2663) at 2026-10-31 ~13:00Z.

## scope (what this plan does)

Applies the programme doc's dressing rules R1–R8 (`Docs/plans/2026-10-31-art-led-ui-pass.md`) to the Inspector's non-person page kinds. Specifically: a hero-led header aside at wide/Full for every non-person kind; place headers fed their terrain so the existing art resolver returns a landscape (today a glyph); carved icons on section headings from existing registry ideas; relic galleries in the aside on place and faction pages; the fifteen remaining `panel` rows turned into sentences (with linked parts) or chips; the Mandate as the god page's highlight; quiet empty lines. Touches presentation builders under `src/engine/views/`, the registry table, one words file and `SubjectHeader.tsx`.

## scope (what this plan does NOT do — explicit non-goals)

- No new art, no new carved icon shapes (picking shapes is Christian's, THR-2104 / THR-1908).
- Does not dress the `here_now` / `story` / `reaches` tabs or the god Overview tab — they wait on THR-2104.
- Does not touch the person page (slice 1), the god rail and top bar (slice 3), Stage moments, dialogs, ceremonies or lists (slices 4–7).
- Does not change the Connections block; relics there stay chips.
- Does not touch the world map, the hover card's layout, debug/CMS/styleguide views.
- No engine, tick, rule or trace change.

## impact_class

Reversible.

## evidence cited

- **Linear issue:** THR-2098
- **Vision premises invoked:** non-negotiable #3 (mechanics through prose); taste profile (numbers in UI)
- **UL terms touched:** none new (Place, Mandate, Reach, Essence, relic used as existing words)
- **Canon pages consulted:** `Docs/design-system/laws.md` (Laws 3, 4, 5, 9, 13, 16, 25, 31, 33), `Docs/ubiquitous-language/README.md`, `Docs/canon/rulebook-quick-reference.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-31-art-led-ui-pass.md` (programme + slice 1)
- **Rejected approaches considered and dismissed:** setting the place landscape as `src` from the builder (rejected for Law 3 — the resolver's `location` branch already scores art given terrain); converting the Connections block's artifact chips to tiles (rejected — changes a shared block across all kinds; the aside gallery mirrors slice 1 instead); keeping single-ended meters (rejected — the word already carries the magnitude, Law 13).

## load-bearing decisions touched

- "The world graph is mutated in place" — not touched (render-time VM only).
- "Agent position is three-tier… sublocation tier is `type: 'location'` carrying `parentLocationId`" — the terrain read applies to a `location` WorldRef page; sublocations keep their category art (separate `sublocation` visual kind).

## high-impact files touched (from Codesight)

None ≥100 importers. Measured importer counts: detailPageTemplates 7, subjectPage 13, subjectTypes 18, SubjectHeader 3, placeRows 3, factionRows 1, pageResolvers 8, detailPageResolvers 11, subject-sheet-words 6.

## kill criteria

- Name or Act row below the fold at 1920×1080 on a faction or place page → cap hero height; else thumbnail at the 1920 tier.
- Christian finds a page "too busy" → drop section-heading icons first.

## explicit user sign-off

N/A (Reversible).

## author notes for the judge

This is an unattended design-lane run (THR-1611). Five decisions were made under delegation and are listed in the plan's "Decided by the design lane" section with a veto invitation. The one place the plan departs from the ticket's literal Done-when is decision 5: the ticket says "No Inspector page kind renders a tab or section heading without its carved icon", but shape picks are Christian's (THR-2104) and slice 1 set the precedent of "no fitting idea → no icon, listed". The plan's Done-when reads "icon or on the no-idea list". Measured facts: place header art gap (headless census output quoted in the plan), fifteen panel rows (grep), no section icons on non-person rows (registry read).
