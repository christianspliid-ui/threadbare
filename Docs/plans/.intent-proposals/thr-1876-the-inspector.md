# Action Proposal — The Inspector (THR-1876)

Plan doc: `Docs/plans/2026-10-14-thr-1876-the-inspector.md` (companion `…-brainstorm.md`).

---

## intent_quote

Christian, chat 2026-10-11 (recorded in `Docs/audits/2026-10-11-thr-1827-inspector-decision.md`):

> it makes sense on the surface to make one inspector to rule them all, i like that.

> i start in a city, i move to its sublocation the temple, i move to the priest, i move to his faction. i want to be able to navigate all information that is 'unlocked' for the player like that.

> the hexview should give an overview over the land area and describe it while also pointing out whats in it, so you can continue to navigate to those things (like a city in it or a monster lair).

> we can build the gating functionality later.

> yes

(the "yes" is to all 18 calls on the mock, after three passes.)

Christian, chat 2026-10-14, ratifying UI Law 58 (`Docs/design-system/laws.md` § XVI):

> it is important that the UI is simple and easy for agents to expand and change as we iterate on the game, add new actions, fields, and so on.

THR-1876's description, added 2026-10-14 in the attended session after Christian asked whether the Inspector has a system for quickly managing and iterating each object's page layout (the ticket records the ask in prose, not verbatim): one page-layout table for every subject (extend `DETAIL_PAGE_REGISTRY` to army, the land page, the god's sheet and content cards, with per-width visibility), and an Inspector lab `?view=inspector-lab` that renders every kind's page from a seeded world at docked, wide and Full and at 1080p and 1440p, and replaces the style guide's sample page.

## scope (what this plan does)

Specifies the Inspector: one docked panel beside the map that every link, card, search and map click opens, at three sizes (docked ~28vw, wide ~50vw, Full on request with time held); every subject page as rows in the extended `DETAIL_PAGE_REGISTRY` with per-width visibility and a shared section shape per field; the Connections block; three ways to play a card (the Act row, card counts with a tray, card-first arming from the god rail's hand with target lighting on the map and in the Inspector); the land page; Find anything; the `?view=inspector-lab` dev view; the retirement of nine legacy detail surfaces and how every caller re-routes through `useRefRouter`; the GameView host it builds into; the onboarding copy that points at retired surfaces; the Law 58 lists and their `extending.md` rows. It slices the build into S1 (this ticket) and seven filed tickets.

## scope (what this plan does NOT do — explicit non-goals)

- Knowledge gating (deferred by Christian). Connections and *In this land* are `OPEN`; only Find keeps the interim seen floor (THR-1832) and armed lighting respects fog.
- Changing any rule of play: card targets, prices, range and the one-target rule are unchanged. Whether people and place cards should need the god to be near is listed as an open question for Christian, not decided.
- The hand's place and size in the god rail, the Needs-you UI, the top-bar Find field (THR-1875); the map's lit/dim layer, lens routing, place icons on the map (THR-1878); icon shapes and credits (THR-1879); what the Stage does to the Inspector (THR-1877); the GameView split itself (THR-1881).
- Codex placement in Full view (out of scope on the map).
- New art: the plateau and lair hero images are filed as a deferral ticket.
- Re-authoring any prose: the land prose moves byte-for-byte.

## impact_class

External — it replaces every player-facing detail surface and the card-casting surface, and deletes about 11,000 lines in a later slice; reversible per slice, but player-visible.

## evidence cited

- **Linear issue:** THR-1876 (and its decision tickets THR-1827, THR-1832, THR-1833, THR-1834)
- **Vision premises invoked:** `TheFantasyWorldSimulator/Vision/02-non-negotiables.md` (#3, #4, #6), `TheFantasyWorldSimulator/Vision/01-core-loop.md`, `TheFantasyWorldSimulator/Vision/03-design-tensions.md` (legibility vs. mystery), `TheFantasyWorldSimulator/Vision/taste-profile.md`
- **UL terms touched:** Location / Place (outer / inner tier), Area, Dominion; surface nouns Inspector, land page, Connections, In this land, Find (proposed in UL-proposal THR-1882 — no new term beyond those)
- **Canon pages consulted:** `Docs/canon/design-governance.md`, `Docs/design-system/laws.md` (Laws 1–58, esp. 57, 58), `Docs/design-system/extending.md`, `Docs/canon/interface-map.md`
- **Prior plan docs this builds on:** `2026-10-14-thr-1819-1440p-layout-contract.md`, `2026-10-14-thr-1820-dialog-size-tiers.md`, `2026-10-14-thr-1821-component-library-and-ui-debt-ratchet.md`, `2026-10-14-thr-1822-view-model-seam.md`, `2026-09-12-thr-1482-one-card-one-router.md`; decision records `Docs/audits/2026-10-11-thr-1827-inspector-decision.md`, `2026-10-12-thr-1832-find-anything-decision.md`, `2026-10-12-thr-1828-screen-frame-decision.md`, `2026-10-14-thr-1834-icon-family-decision.md`, `2026-10-13-thr-1833-type-system-decision.md`
- **Rejected approaches considered and dismissed:** none of CLAUDE.md's rejected list is reintroduced. The plan explicitly retires the ActionDrawer subject hand (the AgentWheel's successor surface for a selected subject); the Act row is the "context-filtered cards via Generalized Action Targeting" the rejected-approaches list endorses.

## load-bearing decisions touched

- **Everything is a graph node/edge** — respected: the land page is a page kind, not a node; view models are not nodes.
- **No inventing node types** — none added; no WorldRefKind added (event nodes ride a `NodeRef` subject, cultures route through their Realm).
- **Agent position three-tier; sublocation tier asked through `sublocationShape.ts`** — every Location / Place read goes through it (THR-1822).
- **The world graph is mutated in place — never key on graph identity** — the pages are THR-1822 view models keyed on `worldVersion` / `structuralCacheVersion`.
- **Engine caches owned per session** — no module singleton; the lab reads uncached.
- **Encounter awareness hex-granular** — untouched.

## high-impact files touched (from Codesight)

- `src/types/trace.ts` — 119 importers (one new trace category, `ui_card_arm`). Blast Radius section present.
- Not edited: `src/types/gameState.ts` (Inspector state is React state), `src/engine/graph.ts`.

## kill criteria

Listed in the plan's Notes for the executor: a moved land-prose block that cannot reproduce HexChronicle's text; a docked tab row that cannot fit at 1080p even with per-width visibility (raise as a Tabs API question, no local overflow menu); a parity test that finds a sheet field with no lawful home (stop that sheet's deletion and file it); fit-then-fold layout thrash. Plan-level: if the lab shows that per-width visibility plus Connections leaves a docked person page unreadable, the plan is revised to carry wider default sizes for that kind through `opensAt`, never by letting the Inspector widen itself.

## explicit user sign-off

Not High-risk. Christian's "yes" to all 18 calls (2026-10-11) is the human gate for the design; today's Law 58 ratification and his request that the five carve-up plan docs be written now are recorded in the plan's settled input.

## author notes for the judge

- The plan makes twelve technical / information-architecture calls inside the agreed design; they are listed with "would change if" in the brainstorm and invite a veto in chat. The most visible is "a relation lives in one place: Connections" — the mock drew some relations twice (as a Full-view tab and as Connections); the plan keeps one.
- One measured fact contradicts an assumption in the approved mock: card range applies only to bare-land cards today. The plan keeps the engine's rule (call 14 says range is unchanged) and lists the question as an open creative fork rather than deciding it.
- The plan is large because the ticket asks for every subject's rows. Slices S2a/S2b port the sheet fields; the parity test (§ D7.11) is the guard that nothing is lost before S4 deletes anything.
- Player-facing text is quoted in § Player-facing text, including the new words this plan owns (Act-row empty line, banner, commit line, not-a-target line, "More when widened", "the full view").
