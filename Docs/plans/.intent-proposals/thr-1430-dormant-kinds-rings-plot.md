# Action Proposal — the dormant kinds II: rings and the plot (THR-1430)

## intent_quote

> the executor list is empty. lets continue

> we need to ensure that we spread out undertakings to interface with all the different systems, and not overcrowd certain parts of the game where we already have a lot of complexity.

> i think a living world has interaction between a variety of agents and systems, the dynamism of a living organic world is hyperconnectivity, so i think we are on the right track here. wouldn't you say?

(Christian in chat, 2026-09-07: the ask to keep the executor lane supplied from the wayfinder map, and the rulings that set the band order this plan is next in.)

## scope (what this plan does)

Builds the second half of the *dormant kinds* band from wayfinder map THR-1396: the four cells THR-1397 decided for Networks and Mortal. A ring is a group of the existing `network` kind that does not travel; founding, recruiting and running it reuse the group mint, the reinforce op, and the observe / mark readers THR-1428 shipped, so a ring does at a distance what one mortal does in person. The plot is a motive-gated (grudge or war only), three-stage undertaking that kills a mortal through one new `markMortalDead` helper with a `retain` / `remove` mode — honouring the `death_prevented` ward and the aspect echo; the plot retains the node, the two existing retaining writers keep retaining, the lifecycle's own death path keeps removing (behaviour preserved for every existing death) — registers the existing heaviest harm class, exposes the plotter on the at-cost and critical-failure bands, gives a followed target a `peril` moment with a grace window before the strike, and adds the succession read THR-1397 named (a dead seat-holder vacates the seat). Retires `action.shadow.assassinate` (a node deletion) and repoints `action.gold.commission-assassination`, the other deleting card, at the retained death. The group phase's enumeration is widened so a network is seen by upkeep, cohesion and dissolution while only movement is gated. Corrects the map's systems table: nothing here touches Stealth. Surfaces say *Network*, the catalogue's word.

## scope (what this plan does NOT do — explicit non-goals)

- No fight loop, no duel, no battle change (Physical Conflict map, THR-1258); duels stay encounters, slayings stay battles and delves.
- No new god verb: the peril moment points at existing levers (ward, blessing, thread actions).
- No mortal surveillance feeding the god's detection pressure or hidden marks (THR-1397: no).
- No steal-a-secret (`seize × Agreement`, the yield band); `run_ring` names it as a future third product.
- Does not build the Powers/Conditions cells (THR-1429) and does not flip `UNDERTAKING_MODEL` (THR-1403).
- Does not decide whether an unseen kill should ever breed a vendetta — THR-1383's seen-rule stands.

## impact_class

Reversible, with one flag: the plan retires a content card and consolidates three death writers into one helper. Both are additive-by-shape (the card's id goes on the retirement list; the helper preserves every event the writers emit) and one-commit revertible. Not High-risk: no node type, no load-bearing decision changed, no canon rewrite beyond the cells and one rulebook section.

## evidence cited

- **Linear issue:** THR-1430, off map THR-1396; decisions cited inline: THR-1397, THR-1261, THR-1259, THR-1383, THR-1428, THR-1399, THR-1241 (the ward override).
- **Vision premises invoked:** mortal sovereignty; the world remembers; hyperconnectivity (2026-09-07).
- **UL terms touched:** company, group, Network (the catalogue's word, `Docs/canon/world-objects.md:29`; *ring* is not a UL term and appears on no surface — only in this document's title as a gloss), undertaking, work, moment, follow. No new term proposed; no UL-proposal needed.
- **Canon pages consulted:** `Docs/canon/world-objects.md`, `undertakings.md`, `undertaking-grid.generated.md`, `systems-inventory.md`, `interface-map.generated.md`, `rulebook-quick-reference.md`, `design-governance.md`, `Docs/design-system/laws.md`.
- **Prior plan docs this builds on:** `2026-09-03-thr-1392-verb-object-undertakings.md`, `2026-09-02-thr-1383-grievance-supply.md`, `2026-08-27-thr-1296-the-binder.md` (remote anchors), `2026-09-07-thr-1428-owed-readers.md`.
- **Rejected approaches considered and dismissed:** a ring as a flagged company (every group reader would guess); a bespoke intelligence op for the ring (a second familiarity system); the standard motive gate for the plot (licenses opportunism); three chained cells for the stages (puts observe × Mortal on the grid, which it refuses); a new divine verb on the peril moment (fight-specific divine machinery, ruled out on the Physical Conflict charter). Detail in the brainstorm companion.

## load-bearing decisions touched

- **No inventing node types** — respected; `network` is an existing `GroupKind` value.
- **Relationships are edges** — `commanded_by`, `member_of`, `hostile_to`, `knows_secret_of`; `slainBy` is an internal record on the dead node beside `deceasedTick`, not a relationship the engine traverses (the grievance lane reads the outcome node's culprit, as it does today).
- **Everything is a graph node/edge** — the dead remain nodes.
- **Mortal sovereignty / god's seat unchanged** (Vision + the Physical Conflict charter) — the god gets a moment, not a verb.
- **The world graph is mutated in place** — the ring's reach is computed each proposal from live positions.

## high-impact files touched (from Codesight)

`src/engine/agentLifecycle.ts` (one helper; existing path repointed), `src/types/strategicAction.ts` (one moment class), `src/types/trace.ts` (two categories). Blast Radius section present.

## kill criteria

- No plot proposed on two seeds in 150 ticks → the motive set is right, grievance supply is the limit (map, not this plan).
- Rings never grow past founding → reach or recruit filter moves; the kind stays.
- A peril moment fires and no existing lever can avert the strike inside the grace → the grace is short or a ward is missing from the god's row; recorded on the Physical Conflict and Powers maps.

## explicit user sign-off

Not required (Reversible). The killing fork was Christian's to call and he called it on THR-1397 (*"killing = the plot"*); this plan implements that call, it does not reopen it.

## author notes for the judge

- The plan's own additions beyond the map's text: the `peril` moment class and grace window (the map said *a moment before it resolves*; the class and the constant are the how), the narrower `PLOT_MOTIVES` set (the map said *harder than any other cell … never opportunism*), the exposure bands, and `GROUP_KINDS_THAT_TRAVEL`. Each is marked as the plan's and is a constant or a one-line switch.
- The Stealth correction to the map is a design-session act recorded on THR-1399's row, not a change to any decision.
- Sequencing: THR-1429 lands first (shared files); the Physical Conflict fight framework calls the helper this plan extracts.
- After run 1: the death helper carries a mode and preserves every existing writer's behaviour (the lifecycle deletes today; two writers retain); the second deleting card is repointed; the group phase enumeration is widened by kind; there is no retirement list, absence is asserted by test; the succession read for a dead seat-holder is in scope; surfaces say Network.
