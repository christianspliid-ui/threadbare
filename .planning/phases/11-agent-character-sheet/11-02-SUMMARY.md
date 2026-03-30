---
phase: 11-agent-character-sheet
plan: 02
subsystem: ui/agent-profile
tags: [ui, agent-profile, tabs, knowledge-gating, familiarity]
dependency_graph:
  requires: ["11-01"]
  provides: ["tabbed-agent-profile-modal", "tab-components"]
  affects: ["GameView.tsx", "AgentProfileModal.tsx"]
tech_stack:
  added: []
  patterns:
    - Conditional tab rendering with useState<TabId>
    - Facet-gated content via AgentKnowledge Set/Map checks
    - KnowledgeLevel fallback when knowledge prop is undefined
key_files:
  created:
    - src/components/Game/tabs/TabBar.tsx
    - src/components/Game/tabs/OverviewTab.tsx
    - src/components/Game/tabs/ProwessTab.tsx
    - src/components/Game/tabs/BondsTab.tsx
    - src/components/Game/tabs/JourneyTab.tsx
    - src/components/Game/tabs/ChronicleTab.tsx
  modified:
    - src/components/Game/AgentProfileModal.tsx
    - src/components/Game/__tests__/AgentProfileModal.test.tsx
    - src/components/Game/GameView.tsx
decisions:
  - AgentProfileModal modal shell uses useState<TabId> for active tab; scrollToNewStrata auto-selects Chronicle tab on mount
  - Knowledge gating: AgentKnowledge facets used when prop present; KnowledgeLevel-based fallback otherwise (backward compat)
  - ProwessTab handles possessions, conditions, and bestowed powers (all formerly in modal body)
  - BondsTab shows disposition using DISPOSITION_LABEL_MAP (human-readable strings) rather than raw strategy keys
  - ChronicleTab absorbs all backstory strata rendering including locked-tier placeholders and new-badge fade logic
  - GameView passes agentKnowledge.get(profileModalAgentId) to knowledge prop — no new state needed
metrics:
  duration: "11 minutes"
  completed: "2026-03-28"
  tasks_completed: 2
  files_modified: 9
---

# Phase 11 Plan 02: Agent Profile Modal — Tabbed Layout Summary

Rewrote `AgentProfileModal` from a single long-scroll layout to a 5-tab layout (Overview, Prowess, Bonds, Journey, Chronicle), with each tab reading from `AgentKnowledge` facets for section gating while remaining backward-compatible with the existing `KnowledgeLevel` system.

## What Was Built

### TabBar.tsx
Horizontal tab bar with 5 tabs using amber highlight for active tab and stone muted styling for inactive. Exports `TabId` union type.

### OverviewTab.tsx
- **Identity**: always shown — name, archetype, culture, sphere
- **Nature**: values filtered by `revealedValues` set (or KnowledgeLevel fallback)
- **Reputation**: shown when `interactionDepth >= OVERVIEW_GOSSIP_THRESHOLD`
- **Traits**: KnowledgeLevel intimate+ (existing behavior preserved)
- **Quotes**: one per `Math.floor(interactionDepth)` depth point, max all quotes
- **Origin**: backstory paragraph when `interactionDepth >= OVERVIEW_BACKSTORY_INTERACTIONS`

### ProwessTab.tsx
- **Domains**: 3x3 grid — revealed domains show descriptor, unrevealed show "???"
- **Possessions**: subcategory-visibility rules (arms/vestments always visible; tools by coLocationTicks; provisions by coLocationTicks; hidden items by revealedPossessions or KnowledgeLevel)
- **Conditions**: wounds/diseases always; blessings by KnowledgeLevel; curses by revealedConditions
- **Bestowed Powers**: bestowed_power subcategory items by revealedPowers set

### BondsTab.tsx
- **Guild/Faction**: existing display with reputation bar
- **Relationships**: bonds filtered by `revealedBonds` map with source badge (Witnessed/Hearsay/Divine/Faction)
- **Agreements**: placeholder (data not yet in card)
- **Disposition**: `DISPOSITION_LABEL_MAP` converts raw strategy keys to narrative labels

### JourneyTab.tsx
- **Current Activity**: location name + placeholder for future movement data
- **Ambitions**: intents filtered by `interactionDepth >= AMBITION_PRIMARY_INTERACTIONS` / `AMBITION_SECONDARY_INTERACTIONS`
- **Environment**: placeholder for future hex state data

### ChronicleTab.tsx
- **Their Story**: backstory strata with locked-tier placeholders and new-badge fade (moved from modal body)
- **Timeline**: history events filtered by `knownEvents` Set
- **Full Account + Interaction Record**: transparent-level only (existing behavior preserved)
- **Completed Ambitions**: placeholder

### AgentProfileModal.tsx (rewritten)
Thin shell (~145 lines): header zone (portrait + name + badge), TabBar, conditional tab renders, portrait lightbox, attachment overlay. Added `knowledge?: AgentKnowledge` prop. Auto-switches to Chronicle when `scrollToNewStrata=true`.

### Tests
32 tests pass. Updated tests route content assertions through tab clicks. Added: tab buttons rendering, default Overview tab, per-tab content checks (Prowess grid, Bonds faction, Chronicle sections).

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check

Files exist:
- src/components/Game/tabs/TabBar.tsx — FOUND
- src/components/Game/tabs/OverviewTab.tsx — FOUND
- src/components/Game/tabs/ProwessTab.tsx — FOUND
- src/components/Game/tabs/BondsTab.tsx — FOUND
- src/components/Game/tabs/JourneyTab.tsx — FOUND
- src/components/Game/tabs/ChronicleTab.tsx — FOUND
- src/components/Game/AgentProfileModal.tsx — FOUND (rewritten)

Commits:
- 227b18a: feat(11-02): create TabBar and 5 tab components with facet-gated content
- d244d76: feat(11-02): rewrite AgentProfileModal to tabbed layout and update tests

## Self-Check: PASSED
