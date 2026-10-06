# Action proposal — 2026-10-06-thr-1644-threading-ceremony

## intent_quote

> "from a design perspective this is as close as you get to character creation on this game, and people LOOOOVE character creation. so in the near future the first is simply just your first threaded agent, that might start with some extra traits that mean they will have a larger chance of being a protagonist agent."
> — Christian, chat, 2026-09-27 (recorded on THR-1605 and in the THR-1644 description)

And from the THR-1605 ruling comment (2026-09-27): *"Meeting The First is the first instance of a broader feature: every time the player threads (onboards) an agent, a ceremony plays."* … *"with The First as its first and richest instance."*

THR-1644 Done-when: *"A design session (or a wayfinder map, if it proves multi-plan) hands off implementation tickets. Not before the round-2 cold playtest reports on the opening plan."* Round 2 reported 2026-10-03: 3/3 testers met and bonded The First and named the bonding scenes their best moment.

## scope (what this plan does)

Designs one "Rite of the Thread": the meeting's outcome writer is generalised to work on any existing mortal (one writer), every `bind_thread_agent` thread queues a rite that plays in a modal reusing the meeting's beat components, the rite scales down by how many mortals the god has threaded (full → one test + bond → bond only), the first mortal the god threads by any route becomes `the_first` (carrying every existing First perk), and The First gets one visible god-given trait (existing `GOD_GIVEN_TRAITS` data) adding capability in their spark's reach. Three slices (S1 engine, S2 UI+content, S3 mark).

## scope (what this plan does NOT do — explicit non-goals)

- Does not change the meeting's sensing beat or its three invented souls (does not pick real mortals for the meeting).
- Does not change any thread's essence cost, upkeep, tier, or the card's starting court position (`watched`) beyond the first-thread case. Upkeep is THR-1747's.
- Does not add a mark or trait to later threads.
- Does not add a cap on threads.
- Does not move First-only perks off `courtPosition` onto traits.
- Does not touch non-individual threads (location, faction, army, artifact).
- Does not change the god's own character creation (Remembrance / sphere point-buy — THR-1749).

## impact_class

Reversible — new module and optional fields; one behaviour change on the card path (first thread → `the_first`) behind ordinary code, a constant switch for the mark; the meeting refactor is pinned by a golden test.

## evidence cited

- **Linear issue:** THR-1644 (related THR-1605, THR-1643, THR-799, THR-1714, THR-1715, THR-1704)
- **Vision premises invoked:** `Vision/02-non-negotiables.md` §1 (god not protagonist; two-way thread), `Vision/taste-profile.md` (meeting prose is the quality bar; Stellaris clock; foundation spheres are elder magic)
- **UL terms touched:** The First (new sense: first mortal threaded — UL-proposal to be filed at handoff), Thread, Court Position, Spotlight tier (read only). New display term "Rite of the Thread" (player-facing title; UL-proposal includes it).
- **Canon pages consulted:** `Docs/canon/rulebook.md` § Meet The First, `rulebook-quick-reference.md`, `Docs/ubiquitous-language/Agents.md`, `Docs/canon/systems-inventory.md`, `Docs/ops/player-complaint-classes.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-09-27-thr-1605-the-opening.md` (S1 moved the meeting toward "the ceremony comes to where the mortal is"; its Notes name this ticket), `Docs/plans/2026-07-30-thr-868-meet-the-first-nudge-conversion.md`
- **Rejected approaches considered and dismissed:** real mortals as meeting candidates (loses the authored vignettes testers loved; D3 gives the real-mortal route); full rite on every thread (halting-clock pile-up, PC-5); a mark on every thread (dilutes "the first and richest"); moving First perks onto traits (rewires 22 sites for no player-visible gain).

## load-bearing decisions touched

- **Everything is a graph node/edge** — respected: the mark is a `has_trait` edge to a `trait` node; rite state on existing nodes/edges.
- **No inventing node types** — respected: no new node or edge types.
- **Relationships are edges, not properties** — respected: thread and trait are edges; `riteHistory` / `threadsBoundCount` are per-node bookkeeping, not relationships.
- **World graph mutated in place, use touchStructure** — respected explicitly (writer calls `touchStructure`).
- **Ascendants use the same prerequisite system** — untouched.

## high-impact files touched (from Codesight)

`src/types/gameState.ts` — 678 importers; the plan adds two optional fields (Blast Radius section added in the plan, revision 2 after the first judge run). Others: `graphOpExecutor.ts` 41, `meetingEncounter.ts` 43, `domainCapability.ts` 66 (read only). `traits.ts` reports 370 by filename match but is only called, not edited.

## kill criteria

- Cold playtest round 3+ testers who thread a second mortal call the rite an interruption or skip it every time → cut the short rite to bond-only (`RITE_SHORT_MAX_ORDINAL = 1`).
- Card-route Firsts appear in playtests and testers do not register them as their First → revisit D3 (Christian veto word "the meeting is the only way to get a First").
- The mark makes The First dominate their reach's encounters (forecast-window KPI shows The First out of window) → lower `FIRST_MARK_REACH_CONTRIBUTION` or switch `FIRST_MARK_ENABLED` off.
- Christian vetoes any of D2–D5 in chat → revert that decision on the ticket before the build claims it (Claimable-from hold gives 24 h).

## explicit user sign-off

Not required (Reversible). The outcome is Christian's 2026-09-27 direction; the how-decisions D1–D6 are taken under the 2026-09-11 delegation with veto words recorded.

## author notes for the judge

- This is an unattended design-lane run. D4 (keep invented souls) is the call I am least sure of: the ticket asks "does the meeting then pick from real mortals?" I answered no on evidence (playtest + prose quality bar) and because D3 already makes "your First can be a real mortal" true. I treated it as a how-decision, not a fork in meaning, because Christian's sentence is satisfied either way; flag it if you read it as a meaning fork.
- "Protagonist-leaning" has no engine flag: threaded mortals are already spotlight and never demoted (UL Spotlight tier). The lean is therefore competence (capability in their own reach) plus legibility; the existing First perks (journey engine, death immunity) already carry the rest and D3 hands them to a card-route First.
- The rite reuses the meeting's resolvers, which roll against a stand-in actor at fixed capability 0.42; for an existing mortal the rite therefore does not use their real capability. That matches the meeting (the rite is a ceremony, not a skill check) and is deliberate.
