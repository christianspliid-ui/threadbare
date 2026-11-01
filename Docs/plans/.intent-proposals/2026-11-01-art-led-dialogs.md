# Action proposal — 2026-11-01-art-led-dialogs

## intent_quote

> "The UI layout of the menus, especially the character menus could use a pass to heighten the quality using icons, images, and so on." (Christian, chat 2026-10-31)

> "yes. and after that this type of treatment should be done to all the UI layers." (Christian, chat 2026-10-31, after approving the person-page mock)

Ticket THR-2101 (filed from that conversation): "Each one: leads with the art of what it is about; carries carved icons on its headings; shows gains (relics, followers, places) as art tiles or medallions; turns label-and-value rows into sentences or chips (Law 16). Reference surfaces, such as settings, stay on the neutral ramp (Law 30)." Done-when: every dialog heading that names a concept carries its carved icon; every gain a dialog reports that has art shows that art; no dialog renders a bare label-and-value strip; every dialog fits 85vh at 1920×1080.

## scope (what this plan does)

Dresses the eight dialogs with existing art: the mortal's face (through the one knowledge-gated resolver) on the Chapter Ledger, a choice, a beat and the court's seats; the target's medallion on what your act bought; carved shapes on the headings that have a registry idea, from one data table and an optional `Modal.Header` icon; carved consequence shapes and relic paintings on the receipt's changes; the court's label-and-value lines rewritten as sentences and chips; two empty "Coming Soon" rows as quiet slots; a season shape on the warm-start wait; settings' two emoji replaced by carved shapes. It also fixes one raw action id that leaks on a beat (Law 14) and adds real debug levers for four dialogs.

## scope (what this plan does NOT do — explicit non-goals)

- No new art, no new icon shapes; headings with no idea wait on THR-2104.
- World messages (doom stages, failed Mandate) are untouched; no producer sends them a picture.
- Settings stays on the neutral ramp; its six section headings get no icon.
- No change to what any dialog decides, offers or costs; only how it is shown.
- Does not remove the court's Sacred Sites / Divine Artifacts rows.
- Does not touch the Stage, Inspector, rail, ceremonies, lists or the map (other slices).

## impact_class

Reversible

## evidence cited

- **Linear issue:** THR-2101
- **Vision premises invoked:** north star (the mortal feels like a person); non-negotiable #3 (mechanics through prose); taste profile (prose first, one gold).
- **UL terms touched:** none new. Existing: The First, Chapter Ledger, court, essence, Mandate.
- **Canon pages consulted:** `Docs/design-system/laws.md` (Laws 14, 16, 30, 31, 33, 58), `Docs/design-system/icons.md`.
- **Prior plan docs this builds on:** `Docs/plans/2026-10-31-art-led-ui-pass.md` (programme, rules R1–R8), `Docs/plans/2026-11-01-thr-2100-art-led-stage.md` (slice 4: face path, consequence shapes, relic chips; lane decisions at 02:15 UTC today, veto window to 14:30 UTC).
- **Rejected approaches considered and dismissed:** see the brainstorm companion — replacing the act's painting with the target, invented seat shapes, painting world messages, icons on settings sections.

## load-bearing decisions touched

- "No inventing node types": respected; no graph change.
- "Engine caches are owned per session": respected; no new cache.
- Rejected approach "Pure LLM-generated content": not touched.

## high-impact files touched (from Codesight)

None with ≥100 importers. Measured with grep: `shared/Modal` 19 importers, `data/view-content` 43, `data/ui-content` 37, `threadedChapters` 3, `debug-bridge` 19.

## kill criteria

- At 1920×1080 the court's seats or ChapterView's prose fall below the fold inside the 85vh cap → shrink `--dialog-subject-portrait-w` to 5rem; then ChapterView keeps only the chip face.
- Christian calls the dialogs "busy" → keep faces and court sentences, set `DIALOG_HEADING_ICONS` to `null`.
- Christian vetoes slice 4's consequence shapes or relic chips → S5.3 drops with them.
