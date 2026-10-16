# Action Proposal — Hunger and unrest (THR-1934)

## intent_quote

The ticket was filed by the design lane on 2026-10-15 as part of the carve-up of the Mortal economy wayfinder map (THR-1863), which Christian charted. The map's destination test is Christian's, 2026-10-14:

> "does this give factions something worth fighting over?"

Christian's ruling on the kingdom order (recorded on the map, quoted by the design lane's 2026-10-15b report): the faction purse, then the crown, then war aims; towns, hunger and the god's stake next; a mortal's own wealth last.

The ticket's ask, verbatim:

> Author one plan doc in `Docs/plans/` through `design-session` and hand it to Ready for Dev. The decisions are settled input; cite each decision ticket inline where it is used.
>
> **Order:** reads hunger from the settlement economy (starvation, happiness) and defection scoring from the crown; cite their plan docs once merged and say what ships if either lands later.
>
> **Draws on:** Hunger and unrest (THR-1869) — unrest is **pressure, not a spike**: drifts ≤4/day toward hunger + poverty + siege + sickness + bounded death-site haunting − contentment; the flat 1/tick decay retires. Bands: **30 Restless** (one person leaves every few days to a fed calm town ≤6 hexes; absorbs pressure-driven migration), **50 Lawless** (granary riot gets famine eligibility, town tax halved), **70 On the edge** (the town defects to a better neighbour ≤8 hexes; old holder gets a grievance), **90 Rising** (resident members split off as rebels taking `controls`; the town sacks its costliest building; unheld towns empty). Restless home = one Means band poorer. … What the player sees of the economy (THR-1870) — the place page's **Fortunes** row; prosperity keeps `getProsperityTier`'s five words everywhere (`deriveProsperityLabel` retires); **On the edge** as a condition chip (enter 70, release 55); Rising as an event; the Trouble lens **Hunger** mark and band words in the unrest hover; four chronicle triggers (on the edge, defects, rises, empties).
>
> **Ship first (bugs, already Ready for Dev):** one death keeps a town in unrest forever (must ship before the bands), scarcity arcs jam.
>
> **Done when:** plan doc merged, issue in Ready for Dev with a coordination block.

The two decision tickets (THR-1869, THR-1870) were decided by the design lane under delegation on 2026-10-14; both veto days closed with no veto. THR-1869's decision comment carries plan-doc predicates, which the plan's Done-when reuses.

## scope (what this plan does)

Designs the build of THR-1869 and the unrest-related parts of THR-1870 in two slices. S1: unrest becomes a drift toward a daily target of five inputs minus contentment; the scarcity arc's one-shot jumps retire; Restless moves people (once the settlement economy counts them), leans a resident mortal toward a fed calm town and can mint Flee the Ravaged Land; a Restless home makes mortal-wealth's want count one band poorer (hook); Lawless halves the purse's town tax and seeds the granary riot; the place page's Fortunes sentence; one prosperity ladder. S2 (filed at handoff): the On the edge trait and chip, daily defection using the crown's protection term, a revenge grudge, the rising (split by residence or founding, `controls` + `hostile_to`, sack), emptying, four chronicle triggers, the gated event popup and the Trouble lens lines.

## scope (what this plan does NOT do — explicit non-goals)

- No prayer, congregation or god's-card change — that is the god's stake (THR-1935).
- No receipts (`economy` change kind) — the god's stake plan carries them.
- No change to the settlement economy's food model, population or buildings; it reads them.
- No tithe or tax-rate input to unrest (the decision deferred it).
- No new node type, no new edge type, no "rebels" faction type.
- No Needs-you entry for a town on the edge (the visibility decision rejected it).
- No change to the one-off unrest pushes (Incite Unrest, doom cards, complications).
- No fix to the graph-op executor's missing-`populationHealth` default (noted for the executor, out of scope).
- No new map tint; the plain map stays quiet.

## impact_class

Reversible. A plan doc only; the build sits behind `UNREST_PRESSURE_ENABLED` with today's code kept. S2 moves `controls` edges and creates factions in a running world, which is behaviour-changing but rolled back by the same flag.

## evidence cited

- **Linear issue:** THR-1934 (decisions THR-1869, THR-1870; map THR-1863)
- **Vision premises invoked:** anomalies are the content; prose not numbers (non-negotiable 3); factions act without the god (Law 13); the god tilts
- **UL terms touched:** Unrest, Restless, Lawless (existing/planned); new: On the edge, Rising (S2 files the UL proposal); Fortunes (added to THR-1924's open proposal)
- **Canon pages consulted:** `Docs/ubiquitous-language/README.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/process.md` rule 4, `Docs/game-design/laws.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-14-thr-1923-settlement-economy.md`, `Docs/plans/2026-10-15-thr-1932-crown.md`, `Docs/plans/2026-10-15-thr-1933-war-aims.md`, `Docs/plans/2026-10-15-thr-1931-faction-purse.md`, `Docs/plans/2026-10-15-thr-1936-mortal-wealth.md`, `Docs/audits/2026-10-15-thr-1870-economy-visibility-decision.md`
- **Rejected approaches considered and dismissed:** none of CLAUDE.md's rejected list applies.

## load-bearing decisions touched

- **Everything is a graph node/edge; relationships are edges:** grudge and rising use `relates_to`, `hostile_to`, `controls` (existing). Settlement properties added are flat numbers about the settlement itself.
- **No inventing node types:** none invented.
- **Agent position three-tier / sublocation is `type:'location'` with parentLocationId:** the plan names `getLocationNodes` and `resolveToParentLocation` for every place read.
- **Graph mutated in place; never key on identity:** S2 calls `touchStructure()` for `controls` changes.

## high-impact files touched (from Codesight)

- `src/types/unifiedAction.ts` (≥100 importers) — S2 adds one union member. Blast Radius section present.

## kill criteria

In the plan: Lawless > ¼ of settlements on two of three seeds → lower `HUNGER_MAX`; poverty-led Lawless town → lower `POVERTY_MAX`; S2 no town on the edge in 100 days → lower `ON_THE_EDGE_ENTER`; a town defecting more than twice in 100 days → raise `DEFECTION_MARGIN`.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- The design lane authored this unattended; the ticket's decisions are settled and not re-opened. Every how-level choice is in the brainstorm companion with a veto line.
- Measured on main @ 54193f42 by a census subagent; key facts: no population number exists; `performFactionSplit` cannot select by residence; `foundFaction` writes no `controls`; the granary riot has no famine gate; the scarcity arc seeds `cg.quest`, not the riot; `townTaxOf` reads no unrest; siege is an actor node, not a settlement property.
- Uncertainty: the town's "view" weights (`DEFECT_W_*`) are not measured; S2's kill criteria and Done-when measure them. The crown's protection helper is planned, not built; S2 is blocked by the crown build and has a fallback.
- The settlement economy and this plan both edit `phaseUnrest.ts`; the plan defines the switch for either landing order.
- The ticket says "the town sacks its costliest building"; buildings exist only with the settlement economy, so the sack is skipped (traced) before it.
