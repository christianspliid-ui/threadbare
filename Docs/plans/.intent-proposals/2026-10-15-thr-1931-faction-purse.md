# Action Proposal — 2026-10-15-thr-1931-faction-purse

## intent_quote

> "make sure that we also connect faction control of locations on the map that provide resources to the factions resources. and ensure we have a way of connecting factions to control of hexes, using our border system" — Christian, chat 2026-10-14 (recorded on THR-1867)

> "find a way for faction types to connect to certain relevant resource producing locations. the king of a country has a faction of his own that owns armies and taxes everyone in the country." — Christian, chat 2026-10-14 (THR-1867)

> "the crown goes to those who can convince other factions of fealty and tax rights" — Christian, chat 2026-10-14 (THR-1867; this is the next plan doc, THR-1932, not this one)

> "a basic 'kingdom' economy so factions have something to fight over" — Christian's priority ruling on the Mortal economy map (THR-1863)

> "Keep all three calls as decided. The plan docs can go ahead." — Christian on THR-1863, 2026-10-15 08:29Z, releasing the carve-up (THR-1931..THR-1937) in the map's order; the purse is first.

The ticket (THR-1931): author one plan doc that builds the faction purse decision (THR-1867, attended, Christian present) plus the Purse panel from the visibility decision (THR-1870 § 4, design-lane call, veto window to 2026-10-15T22:29Z).

## scope (what this plan does)

Specifies one daily engine phase (`faction_purse`) that pays every faction from five sources (town tax to one tax holder per town, held-place yield, land rent through the existing realm border projection, tolls, guild work with a 20% landholder cut), charges army upkeep, makes raising an army cost 50, routes unpaid armies into the existing underfunded/desertion path, adds a bounded schism term for an empty purse, seeds an opening purse at worldgen, writes the Means word as days of upkeep in hand, and shows a Purse panel on the faction sheet with chronicle lines for going broke, desertion and recovery. Faction `wealth` stays the one store with a faction-specific clamp (0–1000).

## scope (what this plan does NOT do — explicit non-goals)

- No crown, oaths or fealty (THR-1932). The one-holder town-tax rule is the seam the crown replaces.
- No membership dues (realm membership churns, THR-1918).
- No draining or flow of stocks (THR-1866 / THR-1923).
- No monopoly logic or embargo (THR-1933); the monopoly chip slot renders empty.
- No mercenary hire system (filed as THR-1939); mercenaries get no exemption.
- No map change; no Needs-you entry; no player spending of faction coin.
- No mortal wealth changes (THR-1936); `FACTION_TREASURY_TRIBUTE_RATE` stays unread.

## impact_class

Reversible — every behaviour sits behind `FACTION_PURSE_ENABLED`; no schema removal; additive properties.

## evidence cited

- **Linear issue:** THR-1931 (decision inputs THR-1867, THR-1870; map THR-1863)
- **Vision premises invoked:** all mechanics surface through prose, never numbers (non-negotiable § 3); equilibrium is silence; the map's destination (factions need something to fight over)
- **UL terms touched:** Means (`Docs/ubiquitous-language/Agents.md` § Means) — reused for factions, no new term
- **Canon pages consulted:** `Docs/game-design/laws.md` (36, 42, 43, 45), `Docs/ubiquitous-language/README.md`, `Docs/canon/rulebook-quick-reference.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-14-thr-1923-settlement-economy.md`; `Docs/audits/2026-10-15-thr-1870-economy-visibility-decision.md`; `Docs/audits/2026-10-14-mortal-economy-audit.md`
- **Rejected approaches considered and dismissed:** folding faction income into holding income; a second `treasury` field; debt (negative purse); per-faction-type upkeep exemption (all in the brainstorm companion)

## load-bearing decisions touched

- Everything is a graph node/edge — respected: no new node or edge types; properties only.
- Relationships are edges, not properties — respected: the tax holder is derived from `controls` edges; `purseLastDay.paysTo` is a derived daily record, not a relationship store.
- Engine caches owned per session — respected: land rent reads `ensureRealmProjection` from the runtime.
- World graph mutated in place — property writes on factions/armies; the realm projection rebuilds on its existing fingerprint.

## high-impact files touched (from Codesight)

`src/engine/orchestrator.ts` (wide; one inline call added), `src/types/army.ts` (wide; one optional field). Plan doc has a Blast Radius section.

## kill criteria

- If the four measured predicates fail at the decision's numbers (big realm pace 7–12 days, small realm holds its host, losing land bankrupts within 25 days, merchants afford a warehouse in ~10 days), retune constants first; if no tuning passes, flip `FACTION_PURSE_ENABLED` off and reopen THR-1867.
- If worldgen armies desert in the first week on seed 42, the opening purse is wrong — retune `FACTION_STARTING_UPKEEP_DAYS`.
- If a warm playtest shows factions too poor to ever wage war (no army raised in 50 days by any realm), the purse throttles too hard — raise income, not remove the gate.

## explicit user sign-off

Not required (Reversible). For the record, the carve-up release above.

## author notes for the judge

- **Revision 3 (after a second Revise):** the Player-facing text table's Great Chronicle row now quotes the § Prose tables sample and names § Prose tables as the one source of the words; the desertion sample no longer implies arrears; `ArmiesTabContent.tsx` added to Files to touch.

- **Revision 2 (after a Revise verdict):** the Means chip now uses the shared purse ladder of THR-1870 § 1 (Destitute · Getting by · Comfortable · Wealthy · Magnate) with factions measured in days of upkeep; the `purse_broke` / `purse_recovered` samples no longer mention debt or arrears; a `## Kill criteria` section carries the criteria below; the UL Means entry gains two sentences in the build PR (no UL-proposal: the word and ladder are unchanged).

- This is an unattended design-lane run. The lane decides how-level questions the decision left open, and records them in the brainstorm companion: opening purse (20 days of fielded upkeep + 10), pay-what-you-can with floor 0 and no debt, mercenaries run dry (follow-up THR-1939), tax-holder tie by `influence` then `establishedTick` then id, warhosts raised by encounters are not charged the raise cost.
- The decision's predicate "a new army every 7–12 days while fielding one" collides with `MAX_ARMIES_PER_FACTION = 1`; the plan restates it as replacement pace (afford the next army within 7–12 days of paying for the last, while keeping it). Flag if you think this changes the decision's meaning.
- The THR-1870 veto window has not closed; the handoff writes `Claimable from: 2026-10-15T22:29:00Z` into the description so nothing is built on the Purse panel before it closes.
- Upkeep in the prototype was a 0.6 scale on `ARMY_MAINTENANCE_COST` (1.2/3/6); the decision flattened it to 1.5/2.5/3.5 — the plan uses the decision's table as a new constant.
