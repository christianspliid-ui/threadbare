# Phase 11: Agent Character Sheet Overhaul — Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Overhaul the agent character sheet (AgentProfileModal) from a long-scroll list of 15+ sections into a 5-tab layout (Overview, Prowess, Bonds, Journey, Chronicle). Replace scalar familiarity-gated visibility with a multi-faceted knowledge model (`AgentKnowledge`) where individual data points are revealed through narrative interactions rather than crossing a number threshold. Add action cards for deliberate discovery. Backward-compatible with existing familiarity system.

**In scope:**
- `AgentKnowledge` type — per-facet revelation tracking (values, domains, bonds, ambitions, backstory each revealed independently)
- `phaseInteractionDepth` orchestrator phase at position 4.6
- 5-tab modal UI replacing single-scroll AgentProfileModal
- Revelation notification events (toast + chronicle)
- 4 discovery action cards (Observe, Scry, Whisper Insight, Dream Sending)
- Passive revelation from encounters, co-location, gossip
- Backward compatibility layer with existing `familiarityMap`
- Debug panel knowledge state inspection

**Out of scope:**
- New agent data systems (NPCs, new trait categories) — this reorganizes what exists
- Major engine changes — the revelation system reads existing data, just changes when it's disclosed
- Social Fabric UI (separate feature, TB-070 shows bond data that exists)

</domain>

<decisions>
## Implementation Decisions

### Tab structure
- **Overview** — identity, portrait, location, archetype, primary sphere, culture, top values, key trait. "Who is this person at a glance?"
- **Prowess** — full 9-domain capability grid, influence tier, tier promotion traits, notable attachments (weapons, artifacts). "What can they do?"
- **Bonds** — all relationships with sentiment indicators, faction membership + role, cultural ties. "Who do they know?"
- **Journey** — ambition progress, backstory strata (revealed progressively), encounter history highlights. "Where have they been?"
- **Chronicle** — filtered event stream for this agent only. "What's happened to them?"

### Knowledge facets
- Each facet is an independent boolean or set: `{ valuesRevealed: Set<string>, domainsRevealed: Set<string>, bondsRevealed: Set<string>, ambitionRevealed: boolean, backstoryRevealed: Set<number> }`
- Facets earned through specific narrative triggers, not familiarity thresholds
- Familiarity still determines the *tab structure* shown (stranger sees fewer tabs), but individual data points within tabs use facet gates

### Revelation triggers
- **Witness encounter** → reveals encounter participants' relevant domain + bond facets
- **Divine action on agent** → reveals the agent's values and ambition
- **Co-location over time** → accumulates interactionDepth, eventually reveals surface facets
- **Gossip (agent talks about another)** → reveals bond facets about the subject
- **Discovery action cards** → player-initiated, targeted facet revelation

### Backward compatibility
- `familiarityMap` preserved as base layer — facet gates are additive
- If familiarity alone would reveal something (old behavior), it still does
- `AgentKnowledge` adds *additional* revelation on top of familiarity

### Claude's Discretion
- Tab switching animation/transition
- Exact layout within each tab (responsive at 1920–3440px)
- How revelation notifications integrate with existing notification system
- Action card cost/prerequisite balance for discovery cards
- interactionDepth accumulation rate tuning

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design specification
- `Docs/plans/2026-03-27-agent-character-sheet-overhaul-design.md` — Full 701-line design doc. 9 parts: information audit, tab structure, knowledge facets, action cards, UI/visibility, tracing, fail-soft, wiring, implementation phases. **This is the primary reference.**

### Current implementation
- `src/components/Game/AgentProfileModal.tsx` — Current modal, long-scroll, 15+ sections. This gets replaced.
- `src/engine/agentDetail.ts` — `AgentInfoCardData`, `AgentFullProfileData` types. Data pipeline that feeds the modal.
- `src/components/Game/hooks/useAgentInteraction.ts` — Current familiarity-based interaction hook
- `src/types/gameState.ts` — `familiarityMap` on GameState (line ~131 area)

### Systems that produce agent data
- `src/engine/phaseAgentDecision.ts` — axiological profiles, goals
- `src/engine/encounterScoring.ts` — encounter participation
- `src/engine/phaseFamiliarityGain.ts` — current familiarity accumulation
- `src/types/traits.ts` — `ReachDomain`, capability domains
- `src/types/attachments.ts` — equipment and artifact system

### UI infrastructure
- `src/components/shared/Modal.tsx` — Modal primitive (Header, Body, Footer composition)
- `src/components/shared/SectionHeading.tsx` — Existing section heading component
- `Docs/design-system/` — tokens, typography, interactions
- `Docs/ui-patterns.md` — IPK keywords (§19), existing UI patterns

### Project constraints
- `CLAUDE.md` — NFP priorities, viewport contract (1920×1080), pre-commit checklist
- `Docs/plans/wiring-checklist.md` — Integration surfaces

</canonical_refs>
