# Action Proposal — 2026-07-04-encounter-density-and-chapter-ledger (THR-603)

## intent_quote

> "this is not the right amount. a game that will last easily 200 ticks if not more, should not only have 3 encounters. the encounters is what fleshes out the world, and also the consequence of the actions of the player, so they are the pay off."

> "We dont want a player to manage too many branching encounters during the same ticks regularly. sometimes they will have to though just because of RNG or because they have decided to play that way by managing many threads and manipulating threads to create encounters.. Optimally we aim for starting with longer between encounters and events, and ending with more encounters/tick as we reach the end of the game."

> "again dont take this too literally. the player can to a large extent choose encounter density by creating many threads and doing many things to manipulate the play. actually i would rather that we figure out a way to help the play manage many encounters, and the cognitive load that comes with it. my idea would be that all encounters (and all their already done or active steps) are always fully available to read and easily navigable. can you look into this. and add this to the cannonized encoutner density vision"

> Manual fix verdict: "ramp + what i wrote before about UX support for player choice" · Handoff verdict: "Yes, full handoff (Recommended)"

## scope (what this plan does)

Settles the encounter-density canon (player-authored density, gentle doom-phase lean, "three to six" retired as doctrine) and edits Vision/rulebook/manual accordingly. Builds the load-management centerpiece the user asked for: a persistent chapter archive (engine — resolved encounters currently pruned after 20 ticks) plus a Chapter Ledger UI where every encounter, active or resolved, is fully readable (steps, choices, complications, aftermath) and navigable. Adds one gentle curation-generosity multiplier table keyed to journey phase.

## scope (what this plan does NOT do — explicit non-goals)

- No hard encounter quotas, budgets, or caps — user explicitly rejected literal rationing/ramping.
- No new encounter templates (supply confirmed healthy; July-3 KPI green on distribution).
- No journey-beat redistribution — belongs to Ascendant Beats — Divine Cadence; observation handed to that project.
- No change to `RESOLVED_ACTION_RETENTION_TICKS` or resolution/outcome logic.
- No session stopping-point signaling (rulebook open question stays open).
- No HexMapV2 changes.

## impact_class

Reversible — additive state field, new UI surface, one multiplier at one call site (disable = 1.0), doc edits revertable by git.

## evidence cited

- **Linear issue:** THR-603
- **Vision premises invoked:** `TheFantasyWorldSimulator/Vision/01-core-loop.md` (edited deliberately — density open question settled, cadence scoped); `feedback_prose_first_ui`; `feedback_god_not_protagonist`
- **UL terms touched:** Encounter, Aftermath, Reaction (existing); NEW: Chapter Ledger, Chapter Record → executor files `UL-proposal` if absent
- **Canon pages consulted:** `Docs/canon/encounters.md`, `Docs/canon/rulebook.md` (+quick-reference), `Docs/canon/process.md` conventions via CLAUDE.md
- **Prior plan docs this builds on:** `2026-05-04-encounter-experience-design-plan.md`; `Docs/audits/2026-06-22-encounter-content-and-delivery-assessment.md`; `2026-07-03-game-manual-wiki.md` (W3/W7 pages edited)
- **Rejected approaches considered and dismissed:** retention-∞, event-node reconstruction, hard quotas, ChapterNode node type, beat redistribution (see brainstorm companion)

## load-bearing decisions touched

- "Everything is a graph node/edge" — respected: archive follows the chronicleEntries/digestBuffer state-array precedent for narrative records; no relationships encoded as properties; `eventNodeId` bridges to existing event nodes. No new node/edge types.
- "No inventing node types without verification" — respected (explicitly rejected ChapterNode).
- "World graph mutated in place / version counters" — respected: ledger memos keyed on `worldVersion`/array length, noted for executor.
- Three-tier position model, hex-granular awareness — untouched.
- Rejected approach "intelligence/visibility gating" — extended in spirit: records, like candidates, are never hidden.

## high-impact files touched (from Codesight)

- `src/types/gameState.ts` — 345 importers (additive optional field). Blast Radius section present in plan doc.
- `src/types/unifiedAction.ts` (278) deliberately NOT touched — new type lives in own file.

## kill criteria

- If playtest shows the ledger becomes a dashboard the player lives in (scan bypassed, chapters skimmed as status rows), the surface is wrong — revisit toward stronger reading framing or entry-point gating.
- If archive memory/serialization costs exceed a few MB in normal runs or save/load degrades, cut `CHAPTER_ARCHIVE_CAP` or move records to summary-only.
- If the phase multipliers measurably distort template distribution (KPI top-share/entropy regress), ship at 1.0 and re-tune with `npm run gameplay-report` evidence.

## explicit user sign-off

Not required (Reversible). User's "Yes, full handoff (Recommended)" (2026-07-04 chat) covers the handoff itself.

## author notes for the judge

The user's ask evolved mid-conversation: ramp first, then softened to "don't take it literally" with the ledger as the real centerpiece. The plan mirrors that weighting — ledger is primary, ramp is a gentle secondary lever with an explicit ship-at-neutral escape hatch. Biggest judgment call: state-array archive vs graph nodes; decided on the chronicle precedent plus eventNodeId bridge, argued inline in the plan to pre-empt the graph-purist reading. Second call: folding the shipped manual pages (THR-592/588, Done) into this ticket's scope rather than reopening them — cheaper and the density canon is this ticket's subject; mutex noted.
