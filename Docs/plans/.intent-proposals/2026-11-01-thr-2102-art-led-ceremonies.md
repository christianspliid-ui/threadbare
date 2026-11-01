# Action proposal — art-led pass, slice 6 (THR-2102)

## intent_quote

> "The UI layout of the menus, especially the character menus could use a pass to heighten the quality using icons, images, and so on." (Christian, chat 2026-10-31)

> "yes. and after that this type of treatment should be done to all the UI layers." (Christian, chat 2026-10-31, after approving the person-page mock)

Ticket THR-2102 (filed by Christian's attended session): "These are full-screen moments. Each one: leads with large art of its subject (The First's portrait, the god's avatar, the age's scene); carries carved icons on its headings; shows what the age gathered as art tiles." Done when: "Every ceremony opens on its subject's art. Every heading that names a concept carries its carved icon. Every relic or follower the harvest lists shows its art or face."

## scope (what this plan does)

Applies the programme doc's dressing rules (R1–R8) to the five ceremony surfaces. The harvest gets the god's face, a harvest shape on its title, a picture on every preserved echo card and before every god's echo it names, sphere chips in place of raw keys, and one name per echo. The end of the age gets The First's face at a readable size and a mandate/doom shape on the ending title. The threading rite's face moves onto the shared resolver so unpainted mortals get the designed tile. A new presentation helper `src/engine/views/ceremonyVisuals.ts` resolves the descriptors in `CeremonyHost`. A DOM-reading debug accessor `getCeremonyDressing()` is added.

## scope (what this plan does NOT do — explicit non-goals)

- Does not change Meet The First or the start page (both already lead with art; measured).
- Does not add new art (no age-scene painting exists; programme doc rules out new art).
- Does not add the card echo to the harvest (not shown today; dress, add nothing).
- Does not invent icon shapes; three headings with no idea draw none and go to THR-2104.
- Does not draw doom-kind shapes (THR-1908, reserved for Christian's pick).
- Does not reorder the end-of-age ceremony.
- Does not change any sentence, rule, tick, graph or trace.

## impact_class

Reversible

## evidence cited

- **Linear issue:** THR-2102
- **Vision premises invoked:** north star (mortal as a person); non-negotiable #1 (god, not protagonist)
- **UL terms touched:** The First, echo, harvest, Twilight ("The age ends"), threading rite — existing terms only, no new ones
- **Canon pages consulted:** `Docs/design-system/laws.md` (Laws 3, 4, 5, 8, 14, 30, 33, 58), `Docs/design-system/icons.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-31-art-led-ui-pass.md` (programme, settled with Christian); `Docs/plans/2026-10-17-thr-1381-the-end-of-the-age.md` (ceremony order)
- **Rejected approaches considered and dismissed:** god face on the end of the age (repetition with the harvest); reorder the end of the age (meaning change); icons on the start menu (half the items have no idea); card echo on the harvest (adds content); passing graph to HarvestScreen (splits the knowledge gate)

## load-bearing decisions touched

- "Everything is a graph node/edge" — respected; reads nodes only.
- "Engine caches are owned per session" — respected; no module-scope cache.

## high-impact files touched (from Codesight)

None with ≥100 importers. `CeremonyHost.tsx`, `HarvestScreen.tsx`, `AgeTwilightScreen.tsx`, `ThreadingRite.tsx` are leaf UI. `debug-bridge.d.ts` and `view-content.ts` are widely imported, but the plan only adds optional exports to them.

## kill criteria

- At 1920×1080 the harvest's button falls below the fold with five echo cards: drop the god face to chip size; if still below, the echo picture becomes a 40px chip beside the name.
- Christian calls the harvest "busy": keep echo pictures, drop the leave-chip row and heading shapes.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- Unattended design lane run. The seven decisions are made under delegation with a veto invited; none draws on an earlier slice's lane decision (slices 3–5 decisions are under twelve hours old), so this plan is independent of them.
- The ticket says "every ceremony opens on its subject's art" — for the end of the age I read the subject as The First's fate beside the ending, and kept the ending first (THR-1381's designed order). For the harvest the subject is the god's age, so the god's face leads.
- Ticket says "the age's scene" — no such art exists; the plan says so rather than inventing one.
- The rite's change is the path, not the look; the existing test id `threading-rite-portrait` is kept.
