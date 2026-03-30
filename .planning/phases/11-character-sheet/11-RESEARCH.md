# Phase 11: Agent Character Sheet Overhaul — Research

**Researched:** 2026-03-28
**Domain:** React modal redesign, knowledge facet system, progressive revelation, interaction tracking
**Confidence:** HIGH — all integration points verified against current codebase

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Tab structure**
- 5 tabs: Overview, Prowess, Bonds, Journey, Chronicle
- Replace single-scroll AgentProfileModal
- Familiarity determines which tabs are visible; knowledge facets gate individual data points within tabs

**Knowledge facets**
- Per-facet revelation: values, domains, bonds, ambitions, backstory tracked independently
- Earned through narrative triggers (encounters, divine actions, co-location, gossip, discovery action cards)
- Additive overlay on existing familiarity system — backward compatible

**New orchestrator phase**
- `phaseInteractionDepth` at position 4.6 (after phaseFamiliarityGain at 4.5)
- Accumulates interaction depth from co-location and event proximity

### Claude's Discretion
- Tab switching animation
- Layout within each tab
- Notification integration approach
- Action card balance tuning
- interactionDepth accumulation rate

### Deferred Ideas (OUT OF SCOPE)
- NPC system (TB-069)
- New trait categories
- Social Fabric UI (uses bond data from this, but is separate work)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CSHT-01 | `AgentKnowledge` type with per-facet boolean/set tracking | New type in `src/types/` |
| CSHT-02 | `knowledgeMap: Record<string, AgentKnowledge>` on GameState | Alongside existing `familiarityMap` |
| CSHT-03 | `phaseInteractionDepth` at orchestrator position 4.6 | After `phaseFamiliarityGain` (4.5) |
| CSHT-04 | 5-tab modal replacing current AgentProfileModal | Replaces `src/components/Game/AgentProfileModal.tsx` |
| CSHT-05 | Overview tab: identity, values, key trait, archetype | Uses existing `AgentInfoCardData` + `AgentFullProfileData` |
| CSHT-06 | Prowess tab: 9-domain grid, influence tier, attachments | Uses existing domain capability + attachment data |
| CSHT-07 | Bonds tab: relationships, faction membership, culture | Uses existing `relates_to` edges + faction membership |
| CSHT-08 | Journey tab: ambition, backstory strata, encounter highlights | Uses existing ambition + backstory + encounter data |
| CSHT-09 | Chronicle tab: filtered event stream for this agent | Uses existing trace/event system filtered by agent |
| CSHT-10 | Revelation from witnessing encounters | Hook into `phaseEncounterProgressionV2` or encounter visibility |
| CSHT-11 | Revelation from divine actions on agent | Hook into `phaseUnifiedActionProgress` |
| CSHT-12 | Passive revelation from co-location over time | `phaseInteractionDepth` accumulator |
| CSHT-13 | Revelation from gossip (agent mentions another) | Hook into narrative/vignette generation |
| CSHT-14 | 4 discovery action cards: Observe, Scry, Whisper Insight, Dream Sending | New entries in `unified-action-templates.ts` |
| CSHT-15 | Revelation notification events (toast + chronicle) | Uses existing notification + chronicle systems |
| CSHT-16 | Backward compatibility with `familiarityMap` | Familiarity gates tabs; facets gate data within tabs |
| CSHT-17 | Debug panel knowledge state inspection | New debug section or tab |
| CSHT-18 | `agent_knowledge_revealed` trace type | New trace category |
</phase_requirements>

---

## Technical Research

### Current AgentProfileModal

`src/components/Game/AgentProfileModal.tsx` — receives:
```typescript
interface AgentProfileModalProps {
  card: AgentInfoCardData;
  profile?: AgentFullProfileData;
  onClose: () => void;
  scrollToNewStrata?: boolean;
}
```

`AgentInfoCardData` and `AgentFullProfileData` from `src/engine/agentDetail.ts` provide the data pipeline. The modal currently renders 15+ sections in a single scrolling body. The data pipeline already extracts all the information — the overhaul is about *organizing and gating* it, not fetching new data.

### Existing Familiarity System

`GameState.familiarityMap: Record<string, number>` — maps agent ID to familiarity score (0–100). Current thresholds gate sections in the modal. `phaseFamiliarityGain` at position 4.5 increments familiarity based on proximity.

The new `AgentKnowledge` is **additive** — familiarity still controls which tabs appear, while knowledge facets control individual data points within tabs. Both systems run.

### Modal Primitive

`src/components/shared/Modal.tsx` — composition-based: `Modal.Header`, `Modal.Body`, `Modal.Footer`. Max-height 85vh (per viewport contract). The 5-tab layout needs tab buttons in the header area and tab content in the body.

### Orchestrator Insertion Point

Position 4.6 — after `phaseFamiliarityGain` (4.5), before `phaseRivalActions` (5). The interaction depth phase reads co-location data from the current tick and increments depth counters.

### Action Template Extension

`src/data/unified-action-templates.ts` already has the template structure. The 4 discovery cards need:
- `targetFilter: 'agent'` (targets individual agents)
- `sphereAffinity: 'mind'` or `'spirit'` (thematic fit)
- Reach: Silver (diplomacy/social) or Obsidian (investigation)
- Effect: populate specific `AgentKnowledge` facets on the target agent

### Implementation Wave Structure (Recommended)

| Wave | Steps | Focus | Autonomous? |
|------|-------|-------|-------------|
| 1 | Phase 1 from design doc | Knowledge facet infrastructure — types, GameState, orchestrator phase | Yes |
| 2 | Phase 2 from design doc | Tabbed modal UI — 5 tabs, gated content | Partially — needs visual verification |
| 3 | Phase 3 from design doc | Revelation notifications + polish | Yes |
| 4 | Phase 4 from design doc | Discovery action cards | Yes |

---

## Summary

Phase 11 is primarily a frontend reorganization with a lightweight engine addition (knowledge facets + interaction depth). The data already exists in the engine — this phase changes how it's organized, gated, and revealed. The main risk is UI complexity in the tabbed modal at 1920×1080 viewport. The knowledge facet system is a simple type overlay that reads from existing data, not a new engine pipeline.
