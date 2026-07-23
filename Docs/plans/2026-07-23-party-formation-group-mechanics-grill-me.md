# Grill-Me Synthesis — THR-74 Party Formation & Group Mechanics

**Date:** 2026-07-23
**Session type:** Design (grill-me pre-pass, conversational mode, 14 questions, 0 parked)
**Linear issue:** THR-74 (Todo, High, project: Social Systems Expansion)
**Source design doc:** `Docs/plans/2026-03-31-social-systems-expansion-design.md` → Expansion D (party section)
**This file is an input artifact for the THR-74 plan doc.**

## 1. Scope under interrogation

Party formation as a multi-step social encounter plus parties as group nodes with
shared movement, group encounter resolution, cohesion tracking, intra-party
dynamics, and dissolution. Three pillars (Engine, Content, UI) plus player-agency
hooks. Dependency THR-27 (taverns) is Done.

Substrate found before grilling:

- `group` already exists as an `ActorType` and `member_of` as an edge type in
  `src/types/graph.ts` — the "new node category vs reuse" open question has a
  standing candidate answer (reuse).
- The army system (TB-073, activated THR-614) already implements group node +
  commander + cohesion + shared movement + group battle resolution.
- Retinue (`src/engine/retinue.ts`) is a *different* concept (agents under the
  ascendant's influence), not a party.
- Tavern encounter templates (incl. Recruiting Drive) and culture-aware tavern
  name generation shipped with THR-27.

## 2. Confirmed decisions

| # | Question | Decision |
|---|----------|----------|
| Q1 | Parties vs army substrate | **Separate system.** New generic **group layer** with typed variants (party, squad, faction-band, …). Reads the same graph substrate (`member_of`, `group` actor type) but does not touch or refactor the army code path. Groups are dynamic (join/leave via events and agent decisions), soft cap ~10 members for player-threaded groups, and composition-agnostic by construction (NPC/monster groups possible later). Group types differ primarily in *how movement/decisions are made*. |
| Q2 | Agency inside a group | **Split agency (b).** The group decides movement and group-scale encounters (per its type's decision mode); members keep their personal decision loops for social/minor actions — intra-party romance/rivalry/trust emerges from existing agent behavior. Leaving the group is an *individual agent decision* shaped by cohesion, personality, events. |
| Q3 | Group encounter resolution | **Best member + capped assist bonus (b).** Best member is the primary check per step's required Reach; each other member with meaningful capability in that Reach adds a small capped bonus. Keeps a per-step protagonist for prose; makes composition matter. Assist cap is one tunable constant. |
| Q4 | Formation paths | **Systemic formation + authored spotlight (b), plus ascendant action.** Engine formation phase: colocated agents (tavern-boosted) with compatible goals and sufficient social ties can form a group. "Seeking Companions" is the authored spotlight version when a threaded agent is involved / stakes are high. Plus new ascendant action **Draw Together** (see Q9). |
| Q5 | Group-vs-group conflict | **Split out (b).** THR-74 delivers group layer + formation + shared movement + group-vs-*encounter* resolution. Group-vs-*group* conflict (e.g. adventurer company vs assassins-guild band) becomes its own follow-up ticket. v1 schema carries the seam: encounters can reference an `opposing_group` node from day one, with the deferred consumer cited as a Deferral-labeled issue per interface rules. |
| Q6 | Movement mechanics | **Aggregate member candidates (b) with dissent coupling.** Members keep generating movement candidates as today; a group-movement phase aggregates per decision mode — squad: leader's top candidate wins; party: weighted combination (weights from social roles/relationships); faction-band: faction objective injected as dominant candidate. When the group overrules a member's strong preference, the dissent is recorded: small cohesion hit + drama seed. Perf-neutral (per-member candidate generation already happens today). |
| Q7 | Cohesion | **Event-driven only, kept simple.** Inputs (+): successful group encounters, member-to-member social encounters, Bless this Company, shared victories, time together. Inputs (−): movement dissent, failed group encounters, intra-party incidents, member death/injury, hardship. Outputs: fray threshold → intra-party negative events likelier; dissolution threshold → dissolution; high cohesion → small resolution bonus + resistance to leave-decisions. No passive decay in v1. Pairwise relationships stay in existing social/disposition stores; cohesion is the group aggregate, not a replacement. |
| Q8 | Dissolution + afterlife | Triggers: cohesion floor, goal completion, leader/last-bond death, betrayal event. Threaded groups get an authored dissolution moment (farewell/betrayal); unthreaded resolve silently. **Group node persists inert after dissolution** (historical record, prose/chronicle fuel). **Re-formation is organic** — no cooldown/reunion mechanic; former members are strong formation candidates via existing relationship edges. |
| Q9 | Player actions in v1 | **Bless this Company + Draw Together (b).** Bless: essence → cohesion boost, suppresses internal disputes N ticks. Draw Together: essence → a chosen set of threaded agents converge via sphere-flavored visions/dreams/coincidence. **Reunite** (re-gather a disbanded company) and **Sunder** (crack a group apart) are deferred as one action-bundle backlog ticket. |
| Q10 | Position model | **Members remain sole source of truth (b).** Group position is derived (= leader's position, cached via version-counter pattern). Group-movement phase writes all members' `located_at` identically in one step. Three-tier model untouched; awareness/encounters/fog/rendering need zero changes; a desynced member is fail-soft by construction. |
| Q11 | NPC/monster groups | **Schema-only in v1 (a).** Group layer is composition-agnostic (any actor nodes via `member_of`), proven by a grep-honest note that nothing in v1 assumes threaded-agent members. No NPC-group spawner ships in THR-74 — that arrives with the conflict ticket (no wiring to dead pipelines). |
| Q12.1 | Group-encounter content | **Reuse + small signature family.** A subset of existing exploration/combat/ruins template families becomes group-eligible (membership predicate decided in the plan doc, not a snapshot list), resolved via best-member+assist. Plus a *small* new party-exclusive family (multi-step, multi-protagonist "dungeon crawl" encounters, min-members ≥ 2). |
| Q12.2 | Drama content scope | **Split.** THR-74 ships: Seeking Companions (formation spotlight, ~5 steps), dissolution encounter (farewell + betrayal variants), and 2 drama pieces (trust test, rivalry). Remaining drama catalog (leadership dispute, romance, betrayal, sacrifice) → follow-up content-sweep ticket, no engine changes needed. |
| Q13 | UI pillar | HexMapV2 cluster rendering (see visual spec below); "Company" section in agent detail panel with cohesion as **prose states, not numbers** (exact value debug-only); chronicle entries for formation/notable events/dissolution; `window.__DEBUG.getGroups()` + DebugPanel visibility (same pattern as `getArmies()`). **No** group-management modal or group list panel in v1. WebGL verification via Claude-in-Chrome. |
| Q14 | Naming & name generation | **Generated proper names are the primary display everywhere.** Seeded-PRNG group name generator with context inputs: formation circumstances, location/culture, goal, notable members, sphere (when Draw Together caused formation) — in the vein of THR-27's tavern name generator. Generic prose word is **"company"**; "party" is a design-doc term, never player-facing (user default, flag in doc review to change). New terms (group, company, cohesion, Draw Together, Bless this Company) go through a UL-proposal issue as part of this ticket. |

### Cluster visual spec (user-sketched, Q13/Q14 follow-ups)

Enclosing ring + member agent dots + central bond glyph:

- Center glyph carries meaning: gold/thread treatment when the ascendant has a
  thread into the group (≥1 threaded member); neutral glyph otherwise (for
  later NPC groups). Gold = "yours", consistent with existing thread language.
- Zoom-adaptive: close zoom = ring + dots + glyph; far zoom = ringed glyph only.
  **No member counts at any zoom** — details via click-through to the panel.
- Fog as usual: group renders when its hex is visible; no special reveal.
- No new WebGL layer type — reuse the agent layer.

## 3. Agent recommendations (⚡ items) and their outcomes

All ⚡ leans were accepted by the user, most verbatim: Q3 (best+assist), Q4
(systemic + spotlight), Q5 (split conflict), Q6 (aggregate + dissent), Q7
(cohesion shape, simplified per user), Q9 (Bless + Draw Together in v1), Q10
(members as position source of truth — strong lean), Q11 (schema-only NPC
support), Q12 (both splits), Q13 (UI set, cohesion-as-prose).

User corrections on top of leans:

- Q1: user rejected single-mode "leader decides" — group *types* with distinct
  decision modes are a core requirement, not flavor.
- Q4: user added the Draw Together ascendant action.
- Q8: user added Reunite/Sunder as backlog action candidates.
- Q13/Q14: user supplied the cluster sketch; removed member counts; required
  context-driven generated group names.

## 4. Parked-then-resolved questions

None parked. All 14 questions answered on first ask.

## 5. Unresolved grey zones

None hit the two-strike "I don't know" rule. Two defaults were set by the agent
and accepted implicitly (user should veto in doc review if wrong):

1. **Failure consequences in group encounters land on the acting member**
   individually (injury etc.), feeding the drama loop — not only on group-level
   cohesion. (Q3 rider, answered "b is fine for now".)
2. **"Company" as the player-facing generic term; "party" never shown.** (Q14 —
   user answered the name-generation half; generic-term half locked as default.)

## 6. Open risks and assumptions

- **Army-system divergence risk:** two group-shaped systems (armies, groups)
  now coexist reading similar substrate. Mitigation: plan doc must state the
  boundary explicitly (armies = faction-scale war machinery on its own code
  path; groups = small-scale social/adventuring layer) and the interface-impact
  table must show no shared mutable state beyond the graph itself.
- **Wiring constraint for new player actions:** non-beat-granted templates are
  unreachable forever (THR-613/THR-659). Bless this Company and Draw Together
  each need a named grant path in the plan (beat grant or starter), and the
  action-catalog-design skill gate applies when drafting them.
- **Social-scene sweep blind spot:** SOCIAL_SCENE_TEMPLATES are invisible to
  UNIFIED_ACTION_TEMPLATES sweeps (THR-573). If drama content lands as social
  scenes, Done-when evidence must use a sweep that actually sees them.
- **Group encounter eligibility predicate** (which existing template families
  become group-eligible) is deliberately left to the plan doc — must be written
  as a predicate, not a snapshot count (ticket-authoring rule A).
- **Assumption:** per-member movement-candidate generation for ≤10-member
  groups is perf-neutral because it already runs for every ungrouped agent
  today. Verify with a CLI 30-tick smoke during implementation.
- **Assumption:** `group` ActorType and `member_of` edge can be reused as-is
  (no new node category needed). Verify against `world-model.json` and existing
  `member_of` consumers (faction membership) before the plan doc asserts it —
  the load-bearing "no inventing node types without verification" rule.

## 7. Inputs for the upcoming design doc

- All confirmed decisions in §2 (the plan doc's Engine/Content/UI sections
  should map 1:1 onto them).
- Substrate inventory section: army system (separate, untouched), retinue
  (unrelated), `group`/`member_of` reuse (with verification greps), THR-27
  tavern substrate (formation accelerator + name-generator precedent).
- Interface impact: new group phase in orchestrator; `opposing_group` seam
  (deferred consumer → Deferral ticket); cohesion ↔ existing disposition/social
  stores (read-only both ways); group movement writes `located_at` via the
  existing touch API.
- Constants table candidates: soft member cap (~10), assist bonus cap, dissent
  threshold, fray threshold, dissolution threshold, Bless cohesion boost +
  duration, Draw Together essence cost + convergence strength, formation
  compatibility threshold, tavern formation multiplier.
- Deferral tickets to create at handoff (create first, then reference — never
  predict numbers): (1) group-vs-group conflict; (2) Reunite + Sunder action
  bundle; (3) drama-content sweep (leadership dispute, romance, betrayal,
  sacrifice); (4) NPC/monster group spawner (may fold into #1).
- UL-proposal issue for: group (layer), company (player-facing), cohesion
  (group-scoped sense), Draw Together, Bless this Company.
