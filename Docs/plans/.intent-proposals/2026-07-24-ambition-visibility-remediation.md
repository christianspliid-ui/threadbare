# Action Proposal — Ambition visibility remediation (THR-721)

## intent_quote

> lets prepare some more, as i will be away the entire day.

(Session directive 2026-07-24 — groom queued-but-unready work into Ready for Dev. The design content itself was verdicted by Christian in the 2026-07-23 interface-map chat review, recorded verbatim in THR-721's description:)

> 1. Lower the knowledge bar for a mortal's **primary** ambition — visible at first meaningful knowledge of the agent (playtest-check accrual rates as part of the ticket; the mechanism exists, it's tuned invisible).
> 2. Implement the `ChronicleTab` § Completed Ambitions list (currently a "will appear here" placeholder, `ChronicleTab.tsx:197–202`) from resolved `pursues` edges (`status: completed`, `resolvedTick`).
> 3. Keep **secondary** ambitions gated deeper (current thresholds fine).

## scope (what this plan does)

Grooms THR-721 into an executable three-pillar plan: retunes the primary-ambition gate (`AMBITION_PRIMARY_INTERACTIONS` 2→1; hardcoded `'known'` string promoted to new constant `AMBITION_PRIMARY_KNOWLEDGE = 'recognised'`), adds a pure `getCompletedAmbitions` read + optional card field in `agentDetail.ts`, and replaces the ChronicleTab placeholder with the real list in the tab's existing idiom. Re-badges the two audited interface rows (`ambition-player-visibility`, `ambition-completed-history`) LIVE with dated evidence. Design session only — no `src/` edits here; executor implements.

## scope (what this plan does NOT do — explicit non-goals)

- No changes to secondary-ambition gating (verdict 3)
- No new notification channel (completion milestones already emit events)
- No `__DEBUG` bridge additions (existing strands/eval suffice)
- No ambition-system engine changes (assignment, progress, boost, minting all untouched)
- No fixes to `AgentDetailPanel.tsx` (orphaned dead code — known trap)
- Failed/abandoned ambitions excluded from the list (agent default, flagged for review)

## impact_class

Reversible — plan doc + Linear transitions; downstream implementation is read-side UI/data plumbing plus two constant values, all additive.

## evidence cited

- **Linear issue:** THR-721 (High, Attention Tier Model), user verdicts recorded in description
- **Vision premises invoked:** motive legibility, earned intelligence, failure-is-plot — brainstorm companion §Vision premises
- **UL terms touched:** Ambition, Chronicle Entry, `pursues` edge — no new terms, no UL-proposal needed
- **Canon pages consulted:** `Docs/canon/interface-map.generated.md` (rows 39/41 name THR-721 as remediation), systems-inventory (Ambitions ACTIVE)
- **Prior plan docs this builds on:** `Docs/plans/2026-07-23-system-interface-map.md` § remediation (d) + § User verdicts
- **Rejected approaches considered and dismissed:** depth-only gate, ungated reveal, events-instead-of-list, failures-in-list, new debug bridge — brainstorm §Alternatives

## load-bearing decisions touched

- **Relationships are edges** — respected; completion data read from `pursues` edge properties (existing), no property side channels added
- **Graph mutated in place / version counters** — read-only paths; modal reads already ride `worldVersion`
- No node types, edge types, or GameState fields added — none of the load-bearing decisions are modified

## high-impact files touched (from Codesight)

None — `agentDetail.ts`, `agentKnowledge.ts`, `JourneyTab.tsx`, `ChronicleTab.tsx`, `scripts/interface-contracts.ts` are all below the 100-importer bar. Blast Radius section omitted per template rule.

## kill criteria

- If the playtest probe shows `interactionDepth` accrual so fast that *every* agent's primary ambition is visible within a few ticks of colocation, the gate has effectively vanished — raise `AMBITION_PRIMARY_KNOWLEDGE` back toward `'known'` before shipping (one constant).
- If completed `pursues` edges turn out to be GC'd/pruned anywhere (making the list permanently empty), stop and surface — that would be a new leak, not a display bug.
- If review wants failures in the biography list or a deeper gate on it, both are one-constant/one-filter changes — no redesign.

## explicit user sign-off

Not required (Reversible). The three design decisions are Christian's verbatim verdicts (2026-07-23 chat review, quoted above).

## author notes for the judge

- Two agent-set defaults flagged in-plan for review: Completed Ambitions shares the primary-ambition gate; failed/abandoned ambitions are excluded.
- The hardcoded `'known'` string in JourneyTab was an un-tunable gate inside the exact surface this ticket remediates — promoting it to a constant is the NFP #1 move that makes verdict 1 reviewable.
- "First meaningful knowledge" was interpreted as: depth ≥ 1 (one weighted exposure event) OR knowledge ≥ `'recognised'`. The playtest probe in Done-when is the check that this lands where the user intended.
