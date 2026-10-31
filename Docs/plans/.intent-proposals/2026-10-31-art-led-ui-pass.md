# Action proposal — Art-led UI pass (THR-2097 + programme THR-2098..2103)

## intent_quote

> The UI layout of the menus, especially the character menus could use a pass to heighten the quality using icons, images, and so on.

(Christian, chat, 2026-10-31. The session drew a before/after mock of Kael Thornweaver's wide person page: https://claude.ai/artifact/F7ShcxkK5VqvJErrDk9MNM.)

> yes. and after that this type of treatment should be done to all the UI layers

(Christian, chat, 2026-10-31, answering "Should this treatment go to every character page?")

## scope (what this plan does)

Turns the approved mock into eight dressing rules and builds the shared primitives those rules need: icons on tabs and section labels, a portrait-led aside, a relic art-tile gallery, a bond strip, a highlight line, two-pole temper bars, and a quiet empty Act slot. Slice 1 (THR-2097) builds them and applies them to the Inspector's person page. Because every Inspector page draws through one renderer, the icon-on-tab and icon-on-heading rule reaches every page kind at once. Slices 2–7 (THR-2098..2103) carry the rules to the rest of the UI layers: the other Inspector page kinds, the god rail and top bar, the Stage moments, the dialogs, the ceremonies and start page, and the lists and notices. Each is a scope card for the design lane, blocked on slice 1.

## scope (what this plan does NOT do — explicit non-goals)

- No new art. It shows art the game already ships. Missing art keeps today's designed fallbacks (Law 4).
- No engine, rule, odds or tick change. The view-model fields added are presentation reads of data the engine already holds.
- No change to the world map (HexMapV2). It is already art-led. Golden Hour stays; the dark map is parked (Christian, 2026-10-11).
- No new container or modal type. The Inspector / Stage / dialog / ceremony homes stay as ruled (THR-1823).
- No final icon pick for the one new tab idea (Prowess). It ships provisional; Christian picks in THR-2104.
- Slices 2–7 are not designed to build level here. The design lane authors each slice's plan.

## impact_class

Reversible. A UI-only change behind existing view models. Every rule can be reverted per surface.

## evidence cited

- **Linear issue:** THR-2097 (slice 1). Programme: THR-2098, THR-2099, THR-2100, THR-2101, THR-2102, THR-2103. Icon picks: THR-2104.
- **Vision premises invoked:** `Vision/02-non-negotiables.md` #3 (mechanics through prose), #6 (additive).
- **UL terms touched:** none new. Uses Inspector, page kind, section, Act row, The First, thread, Heartfire, as already defined.
- **Canon pages consulted:** `Docs/design-system/laws.md`, `Docs/design-system/icons.md`, `Docs/design-system/entity-visual-header.md`, `Docs/canon/interface-map.md`.
- **Prior plan docs this builds on:** `Docs/plans/2026-10-14-thr-1876-the-inspector.md`, `Docs/plans/2026-10-14-thr-1879-type-and-icons-rollout.md`.
- **Rejected approaches considered and dismissed:** one big restyle PR; a wayfinder map; per-surface hand styling. See the brainstorm companion.

## load-bearing decisions touched

- "The world graph is mutated in place — never key change detection on graph identity." The new VM fields are built inside the existing person-page builder and memoised on the same keys as today.
- The THR-1822 view-model seam: components read `SubjectPageVM`, never the graph. Every new field is added to the VM. Components never read the graph.

## high-impact files touched (from Codesight)

None at ≥100 importers (grep of import sites): `src/types/detailPage.ts` 39, `src/data/view-content.ts` 44, `src/data/icons/iconRegistry.ts` 37, `src/engine/views/subjects/subjectTypes.ts` 18, `src/components/shared/Section.tsx` 15. No Blast Radius section required.

## kill criteria

- At 1920×1080 the wide person page's name and Act row fall below the fold → shrink `--inspector-portrait-w` before anything else. If the floor still fails, the gallery moves to the main column.
- Christian reacts to the shipped page with "too busy" → drop the icons from section labels first (keep tab icons), then reassess.

## explicit user sign-off

Not required (Reversible). The direction sign-off is the second quote above.

## author notes for the judge

Christian is chat-only, so his approval is of a picture, not a spec. The plan's job is to keep the picture's look while honouring the laws the mock bent. The mock drew a landscape portrait crop; the plan uses Law 5's 3:4. "All the UI layers" is read as every player-facing home (Inspector, god rail, top bar, Stage, dialogs, ceremonies, lists and notices). Debug, CMS, the styleguide and the designer views are excluded as not player-facing.
