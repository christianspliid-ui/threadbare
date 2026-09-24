# Action Proposal — Reach on one scale (THR-1562)

## intent_quote

> go

(Christian, chat, 2026-09-24, answering the session's recommendation: *"I do the first two now on my own"*, the first being THR-1562.) The ticket (filed this morning by this session) states the scope: *"Choose the scale. Either normalize at the read sites … or re-author the thresholds in raw units … Check every other agent_reach_above / agent_reach_below author … Measure before and after … census:undertakings must stay PASS … Watch the interactions."* Its sibling-sites section adds the spell, `reach_drain` and `reach_above:` reads.

## scope (what this plan does)

- **One function,** `computeReachShare` = min(1, effective raw score / 40), read by every capability threshold outside fights and the dice. There are seven sites: ambition floors and choice (through the snapshot), milestones and abandonment, spell requirements and the `reach_drain` check, the `reach_above:` predicate, guild joins, strategic-pack floors, and the premonition bias.
- **Two content changes:** the 25 milestone thresholds raised by a quarter; the five guild join requirements rewritten on the share (÷ 40, which keeps their authored meaning).
- **Guards:** a corpus test keeps every authored threshold in 0–1, and a measurement script checks the result against kill criteria.

## scope (what this plan does NOT do — explicit non-goals)

- It does not recalibrate the dice (`computeCapability`): that is THR-1575, Christian's call.
- It does not fix the character sheet's saturated words, for the same reason.
- It does not move the raw-times-weight formula sites: that is THR-1576.
- It does not design the `reach_drain` payment: that is THR-1571.
- It does not touch fights, sieges or journeys, which are raw by design, or army spawning, which reads the dice curve's tier and moves with THR-1575.
- It does not re-author individual floors.

## impact_class

Reversible. One constant; read sites switch back by pointing at the old reads; the content changes are a documented multiplier and a documented division.

## evidence cited

- **Linear issue:** THR-1562 (and THR-1523, THR-1348's ruling, THR-1571).
- **Vision premises:** `Vision/00-north-star.md:15`; `Vision/02-non-negotiables.md:23`; `03-design-tensions.md:23`.
- **UL terms touched:** *Domain Capability*, *Prerequisite* (`Docs/ubiquitous-language/Cosmology.md:65-71`, `:98-103`).
- **Canon consulted:** `Docs/canon/rulebook.md:113`, the ambitions paragraphs; `Docs/canon/rulebook-quick-reference.md`.
- **Research** (seeds 42 and 99, ticks 0 and 150): the dice-curve arm, and the linear-share sweep over full points 15–50. The scripts are kept in `Brainstorms/2026-09-24-reach-scale-research/`.
- **Rejected approaches:**
  - reading the dice curve (it saturates for protagonists);
  - raw re-authoring (fragile to worldgen changes);
  - two full points (two scales for one concept);
  - milestones as growth (a redesign, deferred).

## load-bearing decisions touched

- "Ascendants use the same prerequisite system as agents": preserved. `computeRawScore` already includes the ascendant's practice, and the share reads it.
- No node, edge or cache.

## high-impact files touched (from Codesight)

None ≥ 100 importers (`domainCapability.ts` 47, `ambitionSelection.ts` 9, `graphConditions.ts` 6).

## kill criteria

- Fewer than 95% of mortals with capabilities keep at least one eligible ambition (any pool) at tick 150 on 42 or 99: lower the full point toward 30.
- `census:undertakings` fails: back to the ticket with the numbers.
- More than 60% of protagonist milestones met on first check: revisit the multiplier.
- More than 3% tick cost at medium: cache shares per evaluation.

## explicit user sign-off

Not required (Reversible; how to honour the authored thresholds' intent, with measurable outcomes). Presented to Christian in chat with a veto invited; the presentation and the UL delegated seating are recorded on THR-1562 at handoff, before the Ready-for-Dev transition.

## author notes for the judge

- The ticket offered two options. The research showed the first (the dice curve) fails for protagonists. The chosen linear share is mathematically the second option with one constant instead of hundreds of edits.
- **Deliberately different outcomes for different mortals:** under the plan, most ordinary mortals can no longer take up *builders'* (standard) ambitions. They keep minted and grievance wants (97–100% keep one). It follows the ticket's own premise that an ambition's reach decides who can take it up. It is the most visible change, so it is named in the chat veto.

## revision notes (second judge pass)

The first pass returned Revise with three GAPs, all applied:
- **Fail-soft:** a mock without the reader now computes a base-only share and fails closed. A test asserts a fail below threshold with the reader supplied.
- **Fixture scope:** only fixtures feeding the seven moved sites convert; the colocation and role-fit fixtures are left for THR-1576.
- **UL and rulebook:** the UL amendment is recorded as a delegated seating on THR-1562 at handoff. The rulebook sentence moves to the ambitions, guild and spell rules, away from `:113` (the action-targeting cascade).
- **Army spawning** is excluded because it reads the dice curve's tier (THR-1575), not because it is raw.
- **Advisories applied:**
  - the consequence is grounded in THR-1562's own premise rather than THR-1348's attention ruling;
  - the THR-1523 re-baseline is named as expected;
  - the ascendant's affinities stay outside the share by the THR-728 contract.
