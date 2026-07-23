# Action Proposal — Party Formation & Group Mechanics (THR-74)

## intent_quote

> lets start design of the thr-74 feature. grill-me

Grill verdicts (all verbatim, same session, 2026-07-23):

> parties differ in that they are small groups and so will be built to interface with encounters (like dungeon crawls or other party specific encounters) differently than the types of encounters armies seek out. i think they are a separate system. we could call this layer "group" and have party be a variant. but fundamentally this should consist of a way of showing and tracking 2+ unique agents travelling together and acting together. groups should be dynamic in that agents should be able to join and leave groups based on different events and actions. the concept should aim at keeping below 10 agents in a player threaded group, but the group concept could potentially be used to also handle groups of monsters or groups of NPCs that can conflict with groups of threaded agents [...] i dont think leader decides movement is enough to keep groups interesting. some groups can have leader decide (sub-type squad fx) but we should have a few different group types. a "party" type group should decide in a way that takes all members into consideration so more democratically or based on internal social roles. another group should move based on what faction they are part of (faction leader decides).

> b + a generic ascendant action that allows the ascendant to have a set of agents they have threaded attract each other via visions, dreams, coincidence, etc. depending on sphere.

> yeah i agree 1 shhould persist, and 2 they should be able to reform. influencing reforming and splitup is also great candidates for ascendant actions, get those noted and in the backlog alongside the connect threaded agents action we talked about above.

> we should have a way for the game to generate names for the different groups based on how they were created, the context and members,.

(Plus single-word/short accepts: Q2 "b", Q3 "b is fine for now", Q5 "b", Q6 "b is good", Q7 "no i think we are good. lets keep it simple to begin with.", Q9 "b", Q10 "b", Q11 "a", Q12 "agree with your lean" ×2, Q13 "lets go with that. the cluster should show clearly that they are threaded together [sketch]", "we dont need member counter on any zooms.")

## scope (what this plan does)

Designs the group layer for THR-74: `actorType:'group'` actor nodes with reused `member_of`/`commanded_by`/`pursues` edges; typed decision modes (party = consensus with dissent, squad = leader, faction_band = faction-directed); split agency (group owns movement + group-scale encounters, members keep personal loops); systemic formation + Seeking Companions spotlight; event-driven cohesion with fray/dissolution thresholds; dissolution with persistent inert nodes; best-member+capped-assist group resolution over group-eligible templates (`actorAffinities` includes `'group'`); seeded group-name generation; HexMapV2 cluster rendering (ring + dots + bond glyph, no counts); AgentProfileModal Company section with prose-state cohesion; `getGroups()` debug bridge + Companies tab + CLI command; two player actions (Bless this Company, Draw Together) with beat-grant paths. Hands off to the executor lane — this session writes no `src/`.

## scope (what this plan does NOT do — explicit non-goals)

- **No group-vs-group conflict resolution** — deferred to THR-731 (typed `opposingGroupId` seam ships now, written by nothing)
- **No NPC/monster group spawner** — folded into THR-731 (schema is composition-agnostic; nothing in v1 assumes threaded members)
- **No Reunite/Sunder actions** — deferred to THR-732
- **No full drama catalog** (leadership dispute, romance, slow-burn betrayal, sacrifice) — deferred to THR-733; v1 ships trust test + rivalry + formation + dissolution only
- **No army-system refactor or shared group abstraction** — armies untouched (user verdict Q1)
- **No avatar-joins-party mechanics** — the original Expansion D open question about the player's avatar is not addressed (flagged as grey zone in handoff)
- **No member counts on map clusters at any zoom** (user verdict)
- **No new GameState fields, node types, edge types, or ActorType values**

## impact_class

Reversible — plan doc + Linear transitions + four backlog issues; no code, no deploy. (The *implementation* it hands off is additive engine work gated by its own CI/DoD.)

## evidence cited

- **Linear issue:** THR-74 (High, Social Systems Expansion; split from THR-27 which is Done)
- **Vision premises invoked:** probability-shifting god (soft power, never command); nomadic stories; failure is plot; world runs without the player — see brainstorm companion
- **UL terms touched:** Actor, ActorType (`group` existing value), Faction, Thread, Encounter, three-tier position model, located_at. New terms → **THR-734 (UL-proposal)**: Group, Company, Group Cohesion, Draw Together, Bless this Company
- **Canon pages consulted:** `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/systems-inventory.md`, `Docs/canon/interface-map.md` (Movement & Colocation + Encounters core = UNAUDITED → audit-on-touch rows written in the plan)
- **Prior plan docs this builds on:** `Docs/plans/2026-03-31-social-systems-expansion-design.md` (Expansion D), `Docs/plans/2026-07-23-party-formation-group-mechanics-grill-me.md`
- **Rejected approaches considered and dismissed:** army-substrate reuse, shared group abstraction, full-suppression agency, blend agency, best-member-only resolution, authored-only formation, group-owned `located_at`, new membership edge type, all-in-one-ticket — see brainstorm companion §Alternatives

## load-bearing decisions touched

- **Everything is a graph node/edge** — respected (groups are actor nodes; membership/leadership/goal are edges)
- **No inventing node types without verification** — respected (`group` ActorType pre-exists; grep evidence in plan §Substrate inventory)
- **Relationships are edges, not property fields** — respected with one *documented deviation*: `opposingGroupId` seam is a typed optional property because it has zero consumers until THR-731, which owns the `opposes`-edge decision. Deviation is explicit in the plan with the deferral cited.
- **Three-tier position model / single `located_at` edge** — respected and load-bearing for this plan: group nodes get NO position edge; members remain sole spatial truth
- **Graph mutated in place / version counters** — group movement + property writes go through `touchWorld()`
- **Rejected approach "fixed action count"** — new UATs are data-driven templates, consistent

## high-impact files touched (from Codesight)

- `src/types/unifiedAction.ts` (278 importers) — additive optional fields
- `src/engine/traceBuffer.ts` (232 importers) — additive trace union members
- Deliberately untouched: `src/engine/graph.ts` (531), `src/types/gameState.ts` (345), `src/types/graph.ts` (125)

Blast Radius section present in the plan.

## kill criteria

- Formation never fires in a 60-tick medium-map CLI run after tuning `GROUP_FORMATION_BASE_CHANCE` ±5× → the compatibility predicate is wrong; revisit `GROUP_FORMATION_COMPAT_MIN` inputs before shipping.
- Groups form but the map/chronicle shows no follow-on story (no group encounters, no drama seeds) in playtest → the eligibility predicate flagged too few templates; widen per the plan's family predicate before calling it done.
- `member_of` consumer sweep finds a consumer that cannot be guarded without behavior change → stop, surface to a design session; do not silently change faction semantics.
- Tick-time regression on medium map beyond noise in the 30-tick smoke → hex-bucketed formation scan is mis-implemented (it is threshold-gated by design).
- If the layer ships and Christian's playtest verdict is that companies feel like cargo (no drama) → THR-733 content is the first lever, not engine rework.

## explicit user sign-off

Not required (Reversible). All 14 design verdicts are quoted above verbatim from the same-session grill.

## author notes for the judge

- Two agent-set defaults were accepted implicitly, not verbatim: (1) step-failure consequences land on the acting member ("b is fine for now" covered the main mechanic); (2) "company" as the player-facing word (user answered the name-generation half of that question). Both are flagged in the plan and the grill synthesis for veto at doc review.
- The scope is large for one executor ticket; the plan keeps it as one issue (three-pillar completeness) but authorizes multi-PR landing with `Fixes THR-74` on the final PR only.
- The `member_of` reuse-vs-new-edge call is the riskiest engineering judgment: reuse is canon-aligned (documented purpose, army precedent) but requires a 30-file consumer sweep, which is an explicit Done-when item with evidence.
- Constants are proposals, not measurements — the executor tunes formation/dissent rates against the CLI smoke; the plan makes them all named constants precisely so tuning is data-only.
