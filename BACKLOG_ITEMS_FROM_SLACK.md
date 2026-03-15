# Backlog Items from #threadbare (2026-03-11)

Extracted from your Slack messages in #threadbare. These are prioritized content/system ideas to document in Notion backlog.

## 1. Agent Ambition System
**Priority:** High | **Domain:** Agent Systems
**Date captured:** 2026-03-11 13:32 CET

Agents need an **ambition stat** in their overview that can be seen by players if they pay for it. Ambitions should tell the player about what the agent will prioritize and their long-term goals.

**Scope:**
- Add ambition property to agent data model
- Create player-visible UI for ambition (gated behind paywall/discovery)
- Generate contextual ambition prose based on agent axiology
- Integrate with decision-making and behavior prioritization

---

## 2. Agent Bonds & Agreements System
**Priority:** High | **Domain:** Agent Systems / Relational Mechanics
**Date captured:** 2026-03-11 13:40 CET

Create **strong bonds between agents, agent groups, and agent factions** as formal agreements that significantly influence behaviors and decision-making.

**Scope:**
- Design agreement/bond data structure (parties, terms, weight, influence)
- Implement agreement resolution in decision loops
- Create mechanics where breaking agreements has consequences
- Visualize bonds in relationship graph UI
- Generate agreement prose (treaties, pacts, sworn oaths)

---

## 3. Ocean Model Integration for Personality Traits
**Priority:** Medium | **Domain:** Agent Systems / Axiology
**Date captured:** 2026-03-11 13:47 CET

Integrate the **ocean model (Big Five personality traits)** into the axiomatic personality trait list to expand behavior variants, especially for:
- Openness / Closedness
- Extroversion / Introversion

**Scope:**
- Map ocean traits to existing personality generation
- Expand agent behavior variants using these dimensions
- Generate personality-coherent reactions based on trait combinations
- Test behavior coherence across edge cases

---

## 4. Cultural Morals & Laws Audit
**Priority:** Medium | **Domain:** Content / World Entities
**Date captured:** 2026-03-11 13:49 CET

**Double-check:** Verify that all culture descriptions include cultural morals and legal systems.

**Scope:**
- Audit all 18 culture entries in world-model.json
- Ensure each has defined moral framework
- Ensure each has legal/justice system description
- Document findings and gaps
- Add missing moral/legal context to sparse cultures

---

## 5. Leverage & Oaths in Relations
**Priority:** High | **Domain:** Political Systems / Relational Mechanics
**Date captured:** 2026-03-11 13:59 CET

Find a way of implementing **leverage and oaths into relations** to drive politics and build strong networks of relationships.

**Scope:**
- Design leverage mechanics (dirt, secrets, debt as relation weights)
- Implement oath system (binding commitments with enforcement)
- Create political pressure/coercion mechanics
- Model blackmail, intimidation, alliance-building
- Generate appropriate oath & leverage prose
- Test political complexity emergence

---

## 6. UI Field Expression Documentation (Paper)
**Priority:** Medium | **Domain:** Frontend / Content Generation
**Date captured:** 2026-03-10 22:56 CET

Create **overview in Paper** of all UIs and the expressions that generate text for different fields, so we can easily iterate on prose generation algorithms.

**Scope:**
- Catalog all UI pages/components
- Document which prose resolver expressions feed each field
- Link to live expression code
- Create reference table for quick iteration
- Use to identify prose generation bottlenecks/opportunities

---

## 7. Paper MCP Setup & Integration
**Priority:** Low | **Domain:** Tooling / Frontend
**Date captured:** 2026-03-11 08:17 CET

Set up the **Paper MCP** tool for UI documentation and inspection.

**Scope:**
- Run: `claude mcp add paper --transport http http://127.0.0.1:29979/mcp --scope user`
- Verify Paper MCP is accessible in Claude sessions
- Create initial Paper documents for UI catalog (see #6)
- Document Paper workflow in dev guide

---

## Summary

| Item | Type | Domain | Priority |
|------|------|--------|----------|
| Agent Ambition System | Feature | Agent Systems | High |
| Agent Bonds & Agreements | Feature | Agent Systems | High |
| Leverage & Oaths in Relations | Feature | Political Systems | High |
| Ocean Model Integration | Enhancement | Axiology | Medium |
| Cultural Morals & Laws Audit | Audit | Content | Medium |
| UI Field Expression Docs | Documentation | Frontend | Medium |
| Paper MCP Setup | Tooling | Tooling | Low |

**Next steps:**
1. Prioritize which of these aligns with current sprint
2. Move high-priority items to Notion backlog with full context
3. Create design docs for agent systems features (#1, #2, #5)
