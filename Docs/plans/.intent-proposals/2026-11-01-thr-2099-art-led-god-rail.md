# Action proposal — 2026-11-01-thr-2099-art-led-god-rail

## intent_quote

> "The UI layout of the menus, especially the character menus could use a pass to heighten the quality using icons, images, and so on." (Christian, chat 2026-10-31)

> "yes. and after that this type of treatment should be done to all the UI layers." (Christian, chat 2026-10-31, after approving the person-page mock)

Ticket THR-2099 (filed from that conversation): "The rail leads with the god's avatar. Every block heading carries its carved icon. Covenants and threaded mortals show as faces (medallions), not names. Persistent HUD is a budget (Law 53): this slice dresses what is already there. It adds no new always-on data."

## scope (what this plan does)

Dresses the god rail and the top bar with existing art: a carved icon on every rail heading that has a registry idea (from a new `icon` column on the rail's registry rows), a face chip on every mortal the rail names (The First, covenant targets, vow counterparties), the seat town's place shape, the doom shape on the doom bar, faces on Needs-you rows that point at a mortal, and the Reaches empty line in a quiet slot. View models gain optional presentation fields only.

## scope (what this plan does NOT do — explicit non-goals)

- Adds no new block, row, number or label to the rail or the top bar (Law 53).
- Does not enlarge the god's portrait.
- Does not add a bond strip or a gold highlight to the rail.
- Does not invent icons for Reaches or Covenants; they wait on Christian's pick (THR-2104).
- Does not change what the Seat line does when clicked (it centres the map).
- Does not touch the Attention gauge (hidden in most games; its wording is an open playtest complaint).
- Does not touch the Inspector pages (slices 1–2), the Stage moments, dialogs, ceremonies or lists (slices 4–7), or the map.
- No new art.

## impact_class

Reversible

## evidence cited

- **Linear issue:** THR-2099
- **Vision premises invoked:** north star (mortal as person); non-negotiable #1 (god, not protagonist); taste profile (one gold emphasis)
- **UL terms touched:** none new (Covenant, Mandate, Hooks, Signatures, Seat, The First — existing)
- **Canon pages consulted:** `Docs/design-system/laws.md` (Laws 8, 9, 21, 31, 33, 53, 58), `Docs/design-system/icons.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-31-art-led-ui-pass.md` (programme, rules R1–R8, S1.2 no-idea rule); `Docs/plans/2026-10-31-thr-2098-art-led-inspector-pages.md` (slice 2)
- **Rejected approaches considered and dismissed:** none from CLAUDE.md's list apply

## load-bearing decisions touched

None. No graph, node, edge, cache or position change.

## high-impact files touched (from Codesight)

None with ≥100 importers. Importer counts: `frame-registry.ts` 19, `godRail.ts` 11, `godSheet.ts` 9, `needsYou.ts` 8.

## kill criteria

- The hand's first card row drops by more than one line at 1920×1080, or anything renders below the fold: revert the Your First face chip to the link, then drop the Seat icon.
- The top bar starts giving way (§ F3) at 1920×1080 on the seeded medium world: drop the doom icon.
- Christian calls the rail busy: drop the folded-row heading icons, keep the faces.
