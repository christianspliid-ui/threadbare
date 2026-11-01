# Action proposal — 2026-11-01-thr-2100-art-led-stage

## intent_quote

> "The UI layout of the menus, especially the character menus could use a pass to heighten the quality using icons, images, and so on." (Christian, chat 2026-10-31)

> "yes. and after that this type of treatment should be done to all the UI layers." (Christian, chat 2026-10-31, after approving the person-page mock)

Ticket THR-2100 (filed from that conversation): "Each one: leads with its subject's face and the scene art it already has; carries carved icons on its step and section labels; shows relics and companions it names as art tiles or medallions, not words." Settled limits: Law 38 flow order fixed, Law 37 one chrome per flow, the veil's visual pair stays portrait + encounter illustration with no location art, consequence chips stay state-backed (Law 56).

## scope (what this plan does)

Dresses the six Stage moments with existing art: one face of the moment's mortal at one size on every moment (built once in the Stage view model with the knowledge gate), carved icons on the Stage labels that have a registry idea (from one data table), the existing but unused consequence shapes on aftermath chips in place of text glyphs, and a relic's painting on a chip that names a relic. View models gain optional presentation fields only.

## scope (what this plan does NOT do — explicit non-goals)

- Adds no beat, step, label, number or line to any moment; flow order unchanged (Laws 37, 38).
- No location or ruin art on any moment; the map window already lights the place.
- Does not change the scene illustrations.
- Does not invent shapes for *At stake*, the whisper header, *Let it be* or *Corrupt*; they wait on THR-2104.
- Does not change the moment card's gain/loss tone tiles.
- Does not touch dialogs, ceremonies, lists, the Inspector, the rail or the map (other slices).
- No new art, no new words.

## impact_class

Reversible

## evidence cited

- **Linear issue:** THR-2100
- **Vision premises invoked:** north star (mortal as person); non-negotiable #3 (mechanics through prose); taste profile (one gold emphasis)
- **UL terms touched:** none new
- **Canon pages consulted:** `Docs/design-system/laws.md` (Laws 3, 5, 8, 9, 29, 33, 37, 38, 56, 58), `Docs/design-system/icons.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-31-art-led-ui-pass.md` (programme, rules R1–R8, S1.2 no-idea rule); `Docs/plans/2026-11-01-thr-2099-art-led-god-rail.md` (slice 3, face-chip precedent); `Docs/plans/2026-10-14-thr-1877-encounter-stage.md` (the Stage)
- **Rejected approaches considered and dismissed:** none from CLAUDE.md's list apply

## load-bearing decisions touched

None. No graph, node, edge, cache or position change.

## high-impact files touched (from Codesight)

None with ≥100 importers. `stageView.ts`, `chipCollaborators.ts`, `EncounterVeil.tsx` and the five surfaces are Stage-local.

## kill criteria

- At 1920×1080, *At stake* or the hand falls below the fold on encounter step one: lower the face token to 6rem at the 1920 tier; if still below, draw the face only on steps with no scene picture.
- Christian calls the Stage busy: keep faces and consequence shapes, drop the label icons.
