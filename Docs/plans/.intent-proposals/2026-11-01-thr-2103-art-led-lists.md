# Action proposal — art-led pass, slice 7 (THR-2103)

## intent_quote

> "The UI layout of the menus, especially the character menus could use a pass to heighten the quality using icons, images, and so on." (Christian, chat 2026-10-31)

> "yes. and after that this type of treatment should be done to all the UI layers." (Christian, chat 2026-10-31, after approving the person-page mock)

Ticket THR-2103 (filed by Christian's attended session): scope is ChroniclePanel / ChronicleEntryCard, NotablesPanel, RivalPanel, ThreadsPanel / ReadTheThreadsPanel, MandateTracker / MandateDetail, DoomBar / DoomClockDetail, the omen indicator and detail, ToastStack, Find (Ctrl K), the hover card. "Each row leads with its subject's face, art or carved icon; uses group headers that carry their icons. Settled limit: long lists stay progressive (Laws 36 and 57)." Done when: "No list row that names a person, place, faction or relic renders without that subject's face, art or icon. Every group header carries its carved icon. Browser evidence at 1920×1080."

## scope (what this plan does)

Applies the programme doc's dressing rules (R1–R8) to the ten list and notice surfaces. Rows naming a person, place, faction, army or relic lead with a 40px picture (Chronicle entries and Ledger rows, Notables, Threads, Read the Threads, toasts, Find), and the hover card gains its subject's picture. Threads' initials medallion is replaced by the shared resolver. Headings draw a carved shape from one new table `LIST_HEADING_ICONS` where an existing idea fits. Omen history rows gain the omen mark. The doom detail's duplicate glyph table is folded onto the shared one. A new presentation helper `src/engine/views/rowVisual.ts` resolves pictures through the knowledge gate in the hosts and view models. Two debug levers: `getListDressing()` (DOM reader) and `pushToastFixture()`.

## scope (what this plan does NOT do — explicit non-goals)

- Does not draw shapes for rival tempers or doom kinds (THR-1908, reserved for Christian's pick).
- Does not invent shapes; headings with no idea draw none and go to THR-2104.
- Does not add a picture per witness-line name in Chronicle entries.
- Does not change any word, rule, tick, graph or trace.
- Does not add caps, folds or scrolls to any list (Laws 36, 57).
- Does not move NotablesPanel's row builder into src/engine/views/.
- Does not add new art.

## impact_class

Reversible

## evidence cited

- **Linear issue:** THR-2103
- **Vision premises invoked:** north star (mortal as a person); non-negotiable #3 (mechanics through prose)
- **UL terms touched:** Chronicle, Notables, Threads, Mandate, doom, omen, The First — existing terms only
- **Canon pages consulted:** `Docs/design-system/laws.md` (Laws 3, 4, 5, 8, 27, 29, 33, 36, 57, 58), `Docs/design-system/icons.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-31-art-led-ui-pass.md` (programme, settled with Christian); `Docs/plans/2026-11-01-thr-2102-art-led-ceremonies.md` (host-resolves pattern; its `echoVisual` folds onto `rowVisual`)
- **Rejected approaches considered and dismissed:** 3:4 faces in lists (Law 57 scroll); a picture per Chronicle name (buries prose); dropping the toast's trailing icon (it is the click affordance); THR-1908 shapes now (reserved); moving the Notables builder (refactor, not dressing); components calling the resolver with graph (splits the knowledge gate)

## load-bearing decisions touched

- "Everything is a graph node/edge" — respected; reads nodes only.
- "Engine caches are owned per session" — respected; no module-scope cache.

## high-impact files touched (from Codesight)

`GameView.tsx` is large but edited only at the toast and hover-card mounts. `debug-bridge.d.ts` and `view-content.ts` are widely imported; the plan only adds exports. No other touched file is a hot file.

## kill criteria

- A rail list scrolls earlier at 1920×1080 because rows grew: align the picture to the first line; if still, stop and raise it with Christian in chat with before/after screenshots (dropping pictures would break the ticket's Done-when).
- Christian calls the lists "busy": keep pictures, null every heading icon.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- Unattended design-lane run. Eight decisions made under delegation with a veto invited. None draws on an earlier slice's lane decision (slices 3–6 decisions are under twelve hours old).
- The ticket's Done-when says "every group header carries its carved icon". The plan reads that through the programme doc's S1.2 rule: a header with no fitting idea draws none and is listed for THR-2104, never given an invented shape. Decision 7 names each such header. This is the same reading slices 1–6 used.
- "No list row that names a person, place, faction or relic renders without … face, art or icon": for Rivals, Doom, Mandate and Omens the rows name no entity; they keep their existing lead marks.
- The ten surfaces' facts were measured by a survey subagent and spot-checked against source (RivalPanel:84-89, ToastStack:195, NotablesPanel:213-224, HoverCard:96-116, conceptIcons:41-55, FindBox:250, ThreadsPanel:241).
