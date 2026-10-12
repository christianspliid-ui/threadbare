# Action proposal — THR-1811 god-card progression and the offering

## intent_quote

> "i go with B, and i would like a tier/progression system of actions, aswell as an assessment of which should be generic. this should all be metadata on the actions, as we will have to iterate on the distribution and potential add and remove actions, and create and delete some as we develop a working progression."
> — Christian, chat, 2026-10-09, recorded on THR-1770

Option B, as recorded on THR-1770: "the world offers, you choose and pay. Every few days three omens rise. The player takes up one, paid in essence earned through that card's sphere, or lets them pass. Rulebook §4 changes from *story moments, not from a menu* to *from what the world offers*. The 24 story cards stay gifts."

Ticket THR-1811 (filed by the attended THR-1794 session, widened 2026-10-11 by the map carve-up): build the `progression` schema, the 143-row first-pass data, the four rungs on the THR-1765 attunement marks, the market reading it, the `check:god-card-progression` gate, and a port of the iteration script; plus the omen market itself.

## scope (what this plan does)

Adds an optional `progression` block to `UnifiedActionTemplate` and fills it on all 143 god cards from the THR-1794 table. Adds a pure `godProgression.ts` that reads the shipped attunement marks into four rungs, prices cards, and lists what the world may offer. Puts the offering (three cards, take up one or let them pass, paid from essence earned) into the existing cadence beat draw; gifts each rung's key cards through the milestone path; retires the grant-bearing pool beats that caused the cookie cutter. Adds a spend ledger beside the run-long earned counter. Reuses the existing pill and beat modal with price words. Adds the content gate, the ported model, traces, a debug accessor, and the rulebook §4 edit.

## scope (what this plan does NOT do — explicit non-goals)

- Does not merge or delete the flagged cards (a later content pass reads `flags`).
- Does not author cards for the sphere × tier holes (the gate warns only).
- Does not let Dominion bands change the buy price.
- Does not change card faces, `rarityTier`, the Codex states, the opening spine or Beat 4's choice.
- Does not carry anything between runs (THR-1813).
- Does not change the sphere gate's meaning: a taken-up card does not open its sphere family.

## impact_class

Reversible — a gameplay change behind data and new state fields; all fields optional; the retired pool beats stay resolvable by id.

## evidence cited

- **Linear issue:** THR-1811 (inputs THR-1770, THR-1794, THR-1765, THR-1748, THR-1758 carve-up)
- **Vision premises invoked:** distinct gods; attention is the spend; prose carries mechanics; sphere-tinted cards
- **UL terms touched:** Omen (`Encounters.md:383`, clash avoided), Sphere Attunement (`Encounters.md:445`); new: Offering, Rung, Key card (UL proposal filed: THR-1838)
- **Canon pages consulted:** `Docs/canon/rulebook.md` §4, `rulebook-quick-reference.md`, `design-governance.md`, `interface-map.md`, `Docs/design-system/laws.md`, `Docs/ops/player-complaint-classes.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-11-thr-1748-dominion-core.md`, `Docs/plans/2026-10-10-thr-1805-gift-waits-its-turn.md`; audits `2026-10-08-thr-1770-…`, `2026-10-10-thr-1765-…`, `2026-10-11-thr-1794-…`
- **Rejected approaches considered and dismissed:** reusing `rarityTier`; a side table; a separate offering timer; decrementing the earned counter; offering cards outside the drawer's gates

## load-bearing decisions touched

- "Everything is a graph node/edge" — respected: no relational table; state is GameState fields and template data (the same as `unlockedActionIds`).
- "No inventing node types" — no new node or edge.
- "Engine caches are owned per session" — no cache added.

## high-impact files touched (from Codesight)

`src/types/unifiedAction.ts` (651 importers), `src/types/gameState.ts` (720), `src/data/unified-action-templates.ts` (176), `src/types/trace.ts` (127). All edits additive. Blast Radius section present.

## kill criteria

Offerings below 60% of post-spine cadence beats on seeds 42/99/7 to day 45 → raise the weight, else give the offering its own interval. Scripted Shepherd below 40 cards at day 90 with the gate → widen the off-sphere rule. A cold tester calling it "a shop" → rewrite the beat prose.

## explicit user sign-off

Not High-risk. Christian's ruling B is the human gate for the direction (human gate satisfied via chat review 2026-10-09, recorded on THR-1770).

## author notes for the judge

- Round 2. The first draft claimed the drawer hides off-sphere cards; it does not (`targetActions.ts:458-465` only counts). The plan now builds THR-1794 as decided (offer any market card the reach gate allows) and ships the in-sphere filter as a default-off switch, `OFFERING_IN_SPHERE_ONLY`, with its measurement. Only the reach gate is extracted; drawer behaviour is unchanged.
- Cadence: the ticket and both prototype models use 9 ticks (MARKET_EVERY), and every price is tuned on it. THR-1770 option text said "every few days", which was the lane's own loose wording for that 9-tick model. With TICKS_PER_DAY 12, the player-facing text now says "each day", which is true. PC-5 is answered in plan § Decided 4a.
- Expiry is now a day boundary, so the footer is literally true. No chronicle line on pass.
- Price phrases no longer reuse the Codex word "Within reach".
- UL proposal filed as THR-1838 before handoff.
- The screen word departs from the ruling text ("three omens rise"): that was the lane's option wording, and "omen" collides with a UL term, a card and a panel. Offered as a veto line.
