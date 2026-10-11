# Action proposal — Dominion core (THR-1748)

Plan doc: `Docs/plans/2026-10-11-thr-1748-dominion-core.md`

## intent_quote

Christian, chat 2026-10-05, recorded on THR-1745 and the THR-1758 map Notes (the ruling the ticket implements):

> same-dominion objects are cheaper and more powerful to influence; you build threads to help you spread dominion through secondary actors — agents, factions, artifacts, armies, locations. You can use powers to help these become more effective at what they do, as they fight the opposing dominion. Spending through a sphere builds infrastructure that pays back.

> you buy sphere points in the beginning of the game, and you score based on your affinity to all spheres summed up and factored by your sphere score.

Christian's closing comment on the Dominion map (THR-1758), 2026-10-11:

> | 1 | **Dominion core** — THR-1748 | THR-1759 (writers), THR-1760 (formula and bands), THR-1761 (what the band buys), THR-1762 (frontier moves), THR-1763 (opposing dominion), THR-1764 (secondary actors), THR-1765 (the god's own power and the attunement ladder). Settled input: THR-1747, THR-1749, THR-1768. | **First.** Everything else reads the band or the attunement marks. |

> **Handoff:** one `design-session` per plan doc, in the order above. The design lane picks them up as agreed-but-undesigned work.

## scope (what this plan does)

Specifies the build of one pure Dominion read (match, power, band) over places, mortals, factions, armies, companies, artifacts and hexes; wires the band into god-card cost, the player cast's resolution odds, thread yield and source income; re-keys Claim Dominion and Shift Dominion to place targets that push the god's bought spheres; adds the tending writers (seat, threaded mortals, bestowed and anointed carriers), neglect, re-aimed rival raids, the seat floor, and the attunement ladder that grows the god's power (capped at 2.0 on the band read). Ships debug-bridge accessors, a DebugPanel row, chronicle lines, card text, the band words as data, a rulebook paragraph and a UL definition correction. Every number comes from the map's decision tickets.

## scope (what this plan does NOT do — explicit non-goals)

- No map overlay, sheet band box, card chip or layer control — THR-1750.
- No omen market, card tiers or progression data — THR-1811 (it only reads this plan's attunement accessor).
- No cross-run persistence — THR-1813.
- No band term in battle momentum (THR-1764, canon war section).
- No change to the nudge hand, the dice ladder or mortal fights (map Out of scope).
- No band on effect magnitude (THR-1761 one-channel rule).
- No new node or edge types; hexes are read, never written.
- Worship, Foundation spheres in the buy, Victory Mandates as dominion goals, relics that hold ground — carried fog, not designed here.

## impact_class

Reversible — every change is behind named constants and additive fields; no persistent save data exists to migrate.

## evidence cited

- **Linear issue:** THR-1748 (parent map THR-1758, closed)
- **Vision premises invoked:** `Vision/00-north-star.md` (the player hesitates and spends; losing a thread should hurt), `Vision/02-non-negotiables.md` §1 (divine remove)
- **UL terms touched:** Dominion, Dominion Band, Opposing Dominion (`Docs/ubiquitous-language/Cosmology.md`) — definition correction only, no new term
- **Canon pages consulted:** `Docs/canon/rulebook.md` §4, §5, §6, §9, §11; `Docs/canon/rulebook-quick-reference.md`; `Docs/ubiquitous-language/README.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-05-thr-1745-player-power-progression-models.md`, `2026-10-06-thr-1747-...`, `2026-10-06-thr-1749-buy-your-spheres.md`, `2026-10-06-thr-1768-sphere-score-seeding.md`; audits `Docs/audits/2026-10-06-thr-1759-*`, `2026-10-09-thr-1760..1763-*`, `2026-10-10-thr-1764-*`, `2026-10-10-thr-1765-*`, `2026-10-11-thr-1766-*`
- **Rejected approaches considered and dismissed:** literal per-sphere power product (THR-1760); Held gates on sources (THR-1761); band on magnitude (THR-1761); adjacency bonus (THR-1762); blanket erosion / seat loss (THR-1763); faction read from leader or held places (THR-1764); clash trials, turf feedback, uncapped power (THR-1765); seeding a third bought sphere (this plan)

## load-bearing decisions touched

- Everything is a graph node/edge — respected; no relational table.
- No inventing node types — respected; three optional properties on existing nodes.
- Relationships are edges — respected; carriers and secondary-actor reads walk existing edges.
- Reaches and Spheres are orthogonal — respected; Dominion is a sphere read, reaches untouched.
- The world graph is mutated in place — any memo keys on `worldVersion`.
- Engine caches per session — no module-scope cache.

## high-impact files touched (from Codesight)

`src/types/influence.ts` (166 — one optional field), `src/engine/orchestrator.ts` (157 — phase registration, probe target). `src/engine/cosmology.ts` (165) deliberately not edited. Blast Radius section present.

## kill criteria

Turf runs away (more than half of places Sovereign by day 60 in a browser run → Claim rate and power cap); turf never moves (a tended place shows no band change in 20 days → defect, fix before merge); the combined economy run lands outside 10.5–13.5 a tick at day 90 → the two named trip-wire levers, else a finding.

## explicit user sign-off

Not required (Reversible). The direction is Christian's 2026-10-05 ruling; the decisions are past their veto windows.

## author notes for the judge

- This is an unattended design-lane run. Twelve seams are decided by delegation (§ Decided by delegation) and carry a veto line at handoff.
- Two map decisions rested on substrate claims that turned out false on today's `main`: THR-1761 assumed god cards carry a flat sphere discount (they do not; it is nudge-only), and THR-1760 said the opposition weights are "written into cosmology.ts" (only as a comment). The plan corrects for both (§ Decided 10, 11) without changing the decided numbers.
- The ticket description's Done-when "lands a larger effect" conflicts with THR-1761's later decision; the plan rewrites the predicate onto odds (§ Decided 5).
- The plan is large because the map carved it as one doc ("the one engine read every consumer uses ... stays one doc"). I considered proposing a split (read + consumers / writers + erosion) and did not: the erosion tunables are only measurable with the consumers live, and the map closed with this seam.
