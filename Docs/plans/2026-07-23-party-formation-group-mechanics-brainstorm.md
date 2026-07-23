# Party Formation & Group Mechanics — Brainstorm Companion

> Companion to `Docs/plans/2026-07-23-party-formation-group-mechanics.md`. Alternatives considered,
> tensions surfaced, Vision premises invoked. Written alongside the plan. The full 14-question
> interrogation lives in `Docs/plans/2026-07-23-party-formation-group-mechanics-grill-me.md`.

## How this started

THR-74 was split from THR-27 (Tavern & Party System) in April because party mechanics needed
their own design pass — taverns shipped fast, parties raised open questions (node category,
movement interaction, group resolution, max size) that the original Expansion D doc left
unanswered. Christian opened this session with an explicit grill-me request. The grill widened
the concept meaningfully: not just "adventuring parties" but a generic **group layer** with
typed decision modes, dynamic membership, and (later) NPC/monster bands as conflict opponents.

## First-pass framing I considered

My initial instinct was that the just-activated army system (TB-073/THR-614) should simply be
parameterized — a party is structurally "a small army with social flavor." That framing was
too narrow: it would have inherited the abstract `size` model (armies have no unique members),
war-shaped objectives, and battle resolution — and killed the intra-party drama loop, which
depends on members being *unique agents with live decision loops*. The grill's Q1/Q2 verdicts
(separate system, split agency) are what make companionship dramatizable at all.

## Alternatives considered

**A. Reuse the army substrate directly.** Rejected (Q1) — armies are faction-scale machinery
with abstract membership; parameterizing them destabilizes a freshly activated dormant system
and forecloses per-member drama.

**B. Shared "group" abstraction extracted under both armies and parties.** Rejected (Q1) —
cleanest conceptually, but orchestrator surgery on the war path for zero player-visible gain;
classic refactor-risk-over-value. The plan mirrors the army *node/edge pattern* instead
(cheap consistency, no shared code).

**C. Full-suppression agency (group as the only decider).** Rejected (Q2) — makes members
passengers; all drama would need to be authored, violating the systemic-first content stance.

**D. Weighted-blend agency (group as mere bias).** Rejected (Q2) — groups that visibly drift
apart and never act as a unit; unreadable on the map.

**E. Best-member-only group resolution (original Expansion D).** Rejected (Q3) — one carry
makes composition irrelevant. Chosen: best-member + capped assist, which keeps a per-step
protagonist for prose while making veteran companies actually better.

**F. Authored-only formation (Seeking Companions or nothing).** Rejected (Q4) — rare,
player-visible-only; NPC groups would need a parallel spawner anyway. Chosen: systemic
formation with the authored encounter as the threaded-agent spotlight, plus the Draw
Together ascendant action.

**G. Group node owns `located_at`, members mirror.** Rejected (Q10) — dual sources of truth,
N+1 writes, a new drift bug class, and 40+ position-reading systems to audit. Members stay
the sole spatial truth; group position derives from the leader.

**H. New edge type for group membership.** Rejected in-plan — `member_of` is *documented*
as covering groups, armies already write non-individual `member_of` edges, and consumers
follow a skip-if-faction-properties-absent pattern. A consumer-audit action item is cheaper
and healthier than semantic fragmentation.

**I. Everything in one ticket (including group-vs-group conflict).** Rejected (Q5) — a third
adversarial resolution shape bolted onto an already three-pillar-deep ticket is how tickets
stall. Split to THR-731 with a typed seam (`opposingGroupId`) built now.

## Trade-off Card

Not run as a formal debate — the grill format resolved each fork with an explicit user verdict.

## Decision

All 14 grill verdicts are Christian's; see the synthesis §2. The two agent-set defaults
(step failures land on the acting member; "company" as the player-facing word) are flagged
for veto in doc review.

## Tensions surfaced

- **Emergence vs. legibility:** split agency threads it — the group is legible as one unit
  on the map (movement, encounters) while drama stays emergent from member loops. Dissent
  is the deliberate coupling point: a *mechanical* residue of suppressed individuality that
  feeds cohesion and drama.
- **Systemic vs. authored content:** systemic formation + authored spotlight; the engine
  proves the loop with 4 authored pieces, the catalog (THR-733) rides later with no engine
  changes.
- **New system vs. dormant substrate (the THR-614 scar):** resolved by the Substrate
  inventory section — armies exist and stay untouched; the genuinely-new claim is grep-backed.
- **Scope appetite vs. shippability:** three deferral tickets (THR-731/732/733) cut the
  fantasy into a shippable core without losing the seams.

## Vision premises this plan leans on

- **You shift probabilities; you never command.** This plan's version: Bless this Company and
  Draw Together tilt cohesion and convergence odds — mortals still choose to clasp hands.
- **Nomadic stories over static simulation.** This plan's version: companies are the vehicle
  for travelling narrative — formation in a tavern, a delve, a bitter parting, and a graph
  that remembers ("former companion of").
- **Failure is plot.** This plan's version: dissent, fray, betrayal, and dissolution are all
  producing states, not error states; the dissolution node persists as story material.
- **The world runs without you.** This plan's version: unthreaded groups form, travel, and
  dissolve silently; the player meets them through the world, not through a menu.

## Taste profile touchpoints

- **Prose over key-value.** Cohesion surfaces only as prose states (`bound`/`holding`/
  `frayed`/`breaking`); numbers live in the DebugPanel.
- **Named things carry story.** Generated company names from formation context/culture
  (tavern-name-generator lineage) rather than "Party #3".
- **Map readability.** The user-sketched cluster (ring + dots + bond glyph, gold when
  threaded, no counts at any zoom) — identity at a glance, details on click.
