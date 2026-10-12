> **Decision audit for THR-1832** (wayfinder map THR-1823, *The Map Is the Table*; project UI Visual Overhaul — Design System v1). Design lane run 2026-10-12a, unattended; decided by delegation (process.md rule 4) with a veto invited. The ticket says "decidable by delegation once the Inspector is settled"; the Inspector closed 2026-10-11 (THR-1827, Christian's "yes" to all 18 calls). Every substrate claim below was measured in this run against `origin/main` at `32daa48c`.

# THR-1832 — Find anything

## The decision in one paragraph

**Ctrl+K** (or **/**) opens a search box under the top bar. It finds **things the god has already seen**: places, people, factions, armies, artifacts, regions, the cards in your hand, and Codex entries. Picking a world result flies the camera there and opens it in the Inspector. Picking a card arms it, and picking a Codex entry opens the Codex at that page. An empty box shows your recent subjects and your own people. A search for something unseen answers *"Nothing you know of by that name."* It does not say whether the thing exists. Until Christian's knowledge gating arrives, a simple "seen" floor, built only from stores the game already keeps, stops search from naming the unseen. When gating lands, it replaces the floor in one place.

## What the game has today (measured)

| Fact | Evidence |
|---|---|
| No search library; every existing search is a plain lowercase `includes` | `package.json` has no cmdk/fuse/minisearch/flexsearch/match-sorter; `Codex.tsx:114-120`, `CMSHeader.tsx:21-37` |
| The in-game Codex already has a search box and an empty state | `Codex.tsx:189` placeholder "Search entries..."; empty state from `:339` |
| **Ctrl+K is free in the game.** It is bound only in the CMS dev tool | `CMSHeader.tsx:43` `if ((e.ctrlKey \|\| e.metaKey) && e.key === 'k')` |
| Game hotkeys: Space, `+`/`=`, `-`, `.`, `m`; nothing else. They are skipped while an input has focus | `useTopBarHotkeys.ts:23` `if (isInputActive()) return;`, cases at `:26-51` |
| `/`, `F`, `W`, `1`–`5` are unbound in `src` (THR-1831 reserved `1`–`5` for lenses; THR-1827 reserved `W` for widen) | grep for `e.key === '<c>'` and `case '<c>':` across `src`, tests excluded |
| Fog is per hex, three states; a remembered hex keeps the names last seen there | `types/visibility.ts:3` `'unexplored' \| 'remembered' \| 'visible'`; `StaleSnapshot` `:6-11` holds `locationNames`, `agentNames`, `lastSeenTick` |
| Familiarity covers people only, five tiers | `types/familiarity.ts:16-22` stranger 0.0 · recognised 0.2 · known 0.4 · intimate 0.6 · transparent 0.8 |
| What the god has learned about a person (possessions, bonds, …) is an additive overlay | `gameState.ts:339` `agentKnowledge`; `types/agentKnowledge.ts:26-58` |
| Hidden sublocations exist and stay invisible until found | `types/sublocation.ts:44` `hidden?: boolean` |
| **No "known" set exists for places, factions, armies or artifacts** | grep for `discoveredLocations\|knownLocations\|knownFactions\|metAgents\|discoveredArtifacts\|knownArtifacts\|discovered(Ids\|Set)`: no hits |
| The router opens world refs as `card`/`sheet`, and content refs in the Codex | `hooks/useRefRouter.ts:233-260, 281-283`; WorldRefKind `types/worldRef.ts:34-47` |
| The camera move exists | `HexMapV2.centerOn(x, y, scale?)` `HexMapV2.tsx:701` ("smoothly flies to target hex over 500ms", `:516`) |
| Notables lists everyone who sponsors an agenda, with no knowledge filter | `NotablesPanel.tsx:69-70`; it never reads `familiarityMap`/`visibilityMap`/`agentKnowledge` |

Laws that bind: 8 (person imagery knowledge-gated; fail-open when the gate is unwired), 12 (new icon gets a legend), 13 (no raw numbers), 21 (every name routes through the one router), 22 (map-located rows carry the eye), 23 (Esc closes the topmost overlay), 25 (no dead controls), 36 (long lists grouped and progressive), 50 (focus in, focus back).

## The calls

### 1. Scope: what it finds

| Group | Kinds | Opens |
|---|---|---|
| **Places** | location, sublocation, area/region | Inspector, docked; the camera flies |
| **People** | agent, companion | Inspector, docked; the camera flies |
| **Powers** | faction, army | faction **wide** (THR-1827 call 12), camera to its seat if the seat is findable; army docked, camera flies |
| **Things** | artifact | Inspector, docked; the camera flies to its holder or place if findable |
| **Your cards** | the cards in the god rail's hand | **arms the card**, the same as clicking it in the rail (THR-1827, card-first) |
| **Codex** | content entries the Codex already shows this run | the Codex at that entry (router `sheet` for a content ref, as today) |

**Out:** chronicle events, encounters, receipts and journeys. They are not named things you look up. You reach them through a subject's *story* row in Connections. Bare hexes are also out, because hexes have no names; regions and places cover land.

### 2. The "seen" floor — what search may name before gating exists

Christian deferred knowledge gating ("we can build the gating functionality later", 2026-10-11). This ticket, which he filed, also says *"An unknown entity must not leak through search."* Both hold, because search is the one surface that can name something from nowhere. Connections and *In this land* only list what hangs off a page you have already opened. So search ships with a floor built from stores that exist today. It adds no new state.

| Kind | Findable when |
|---|---|
| Place (location, area) | its hex is `visible` or `remembered` |
| Sublocation | its parent place is findable **and** it is not `hidden` |
| Region | any of its hexes is `visible` or `remembered` |
| Person | familiarity ≥ `recognised` (0.2), **or** threaded to the god, **or** standing on a `visible` hex now |
| Faction | something findable belongs to it (a findable member, or a findable place it controls) |
| Army | on a `visible` hex now |
| Artifact | held by the god's own people, **or** listed in a holder's revealed possessions (`agentKnowledge`), **or** at a findable, non-hidden place |
| Card / Codex | in hand / shown by the Codex's existing run-state filter |

- **Fail-open, as Law 8 says.** With no `visibilityMap` at all (fog-off debug views), everything is findable, matching what that map shows.
- **A remembered place shows its stale fact.** Its row reads "last seen …" instead of live occupants, from the hex's `StaleSnapshot`.
- **The floor lives in the THR-1822 view-model source**, the same one Connections and *In this land* read. Christian's later gating replaces the floor there, once, for all three surfaces.

### 3. Result behaviour

- **Enter** or click opens the result, closes the box, and returns focus to the subject's heading in the Inspector (Law 50).
- **World results** fly the camera to the one centring zoom THR-1831 decided (k = 10), then open in the Inspector. A search replaces the subject **even when the Inspector is pinned**: pin stops *map clicks*, and a search is a deliberate ask.
- **The eye** on a map-located row flies the camera without opening anything (Law 22).
- **Esc** closes the box first (Law 23), above the Inspector in the Esc order.
- **The clock keeps its state.** Opening search neither pauses nor resumes time. Space is already ignored while typing (`useTopBarHotkeys.ts:23`), and a moving result is located when you pick it, not when it was listed.

### 4. Matching, ranking and the empty box

- **Matching:** case- and accent-insensitive. A whole-name match ranks above a word-start match, which ranks above a match inside a word. No fuzzy library, in keeping with the Codex.
- **Ranking within a group:** match strength, then **yours** (the First, threaded people, your cards), then **recent** (this session's Inspector history), then name.
- **Grouping:** groups are ordered by their best match. Each group shows `FIND_RESULTS_PER_GROUP = 6` rows, then "Show all N" (Law 36).
- **A row:** kind icon (THR-1834's family; legend on first contact, Law 12), name, one plain fact ("Temple Quarter · in The Bone Coast", "Priest · Congregation of the Spheres"), the eye if map-located. No raw numbers (Law 13).
- **Empty box:** "Recent" (the last `FIND_RECENT_COUNT = 5` Inspector subjects) and "Your people" (the First and threaded agents), under the hint *"A place, a person, a power, a card…"*. An invitation, not a void.
- **No match:** *"Nothing you know of by that name."* The same words whether or not the thing exists, so the miss leaks nothing.

### 5. Entry points

- **Ctrl+K / Cmd+K**, and **/** when no input has focus (the same guard as the existing hotkeys).
- A labelled **Find** field in the top bar. THR-1828 places it; this decision only requires that it exists and carries a text label.
- The box drops from the top bar, centred, about 640 px wide at 2560 and 560 px at 1920, capped at 60vh. It does not dim the map.

### 6. Engine side

- **A `findIndex` view model in the THR-1822 seam.** Each entry is `{ ref, name, kindLabel, fact, mapLocated, hexKey?, yours }`, already filtered by the floor.
- **Built lazily** when the box opens, and rebuilt only when `worldVersion` has moved since the last build. Never per tick.
- **Read-only:** a pure function of `GameState`, and no new engine state.
- **Tunables:** `FIND_RESULTS_PER_GROUP = 6`, `FIND_RECENT_COUNT = 5`, `FIND_MIN_QUERY_CHARS = 1`, `FIND_BOX_MAX_VH = 60`.

## Options weighed

- **Ship ungated now and let gating fix it later.** Rejected: search would list every agent, faction and treasure in the world on day one. That is the leak the ticket forbids, and it spoils the fog the map is built on.
- **Wait for full knowledge gating.** Rejected: Christian deferred gating, and the floor costs no new state. It is a filter over four stores that already exist.
- **World objects only, no cards or Codex.** Rejected: the card-first hand already means "I know what I want to cast". Finding a card by name is the same intent, it reuses the arm path, and it costs one group. The Codex already has its own search, and including it makes Ctrl+K the one place to look.
- **Include chronicle events.** Rejected for now: events are not named, and Connections' *story* row already reaches them from their subject.
- **Fuzzy matching (a fuse-style library).** Rejected: generated names are distinctive, the Codex already uses plain matching, and fuzzy hits on unknown names raise the leak surface.
- **Pause time while searching.** Rejected: the box is open for seconds, and THR-1806's rule is that time never moves without the player's click. Holding it would be a second, hidden clock control.

## Would change the call

- **Christian says search should find anything in the world** (an "atlas" search): drop the floor; one filter line changes.
- **Christian says the god should not find people by name until they are known (familiarity ≥ known):** raise the person row of the floor; one constant.
- **Gating lands (deferred on the map):** it replaces the floor in the THR-1822 source; this decision needs no edit.
- **A measured build of `findIndex` costs more than a frame on a large world:** cache by `structuralCacheVersion` instead of `worldVersion`.

## Feeds

| Ticket | What it takes from this |
|---|---|
| THR-1828 (screen frame) | a labelled Find field in the top bar; Ctrl+K and `/` are taken |
| THR-1822 (view-model seam) | `findIndex` joins the subject view models; the "seen" floor lives in the shared source |
| THR-1834 (icon family) | one icon per result kind, with legends |
| THR-1830 (lenses) | none directly; search opens the land page's places, not lens filters |
