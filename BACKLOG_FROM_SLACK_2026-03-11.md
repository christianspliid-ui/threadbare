# Backlog Items from Slack #threadbare — 2026-03-11

Documented from messages in #threadbare channel. Add these to the Notion development backlog.

## Agent Relations & Politics System

**Implement leverage and oaths into relations to drive politics and build strong networks**
- Timestamp: 2026-03-11 13:59:46
- Consider how leverage (favors owed, secrets known) and oaths (sworn agreements) can drive agent political behavior
- Build relationship networks that influence decision-making and faction dynamics

## Culture System Audit

**Double check if we have cultural morals and laws in our culture description**
- Timestamp: 2026-03-11 13:49:05
- Review existing culture description structure
- Verify presence of cultural morals and laws as part of culture definitions
- May need to add these as required fields if missing

## Personality Traits Enhancement

**Integrate ocean model into axiomatic personality trait list**
- Timestamp: 2026-03-11 13:47:39
- Apply the Big Five / ocean model dimensions: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
- At minimum integrate: openness/closedness, extroversion/introversion
- Expand personality variant behaviors based on these traits

## Agent Bonds System

**Create bonds between agents, agent groups, and agent factions as strong agreements**
- Timestamp: 2026-03-11 13:40:44
- Design system where bonds/agreements are strong enough to influence agent behaviors and decision-making
- Consider how bonds can cascade effects across agent groups and factions
- Related to leverage/oaths work above

## Agent Ambition System

**Add ambition stat to agent overview (discoverable by players for a cost)**
- Timestamp: 2026-03-11 13:32:45
- Add ambition field to agent data model
- Display in agent overview UI (gated behind player payment/discovery cost)
- Ambition stat shows what agent prioritizes and long-term goals
- Provides player insights into agent motivations and decision-making

## Paper MCP Setup

**Run Paper MCP command and verify connection**
- Timestamp: 2026-03-11 08:17:51 & 08:18:05
- Run: `claude mcp add paper --transport http http://127.0.0.1:29979/mcp --scope user`
- Verify paper MCP is found and properly configured

## Frontend Documentation in Paper

**Create UI overview in Paper documenting all UIs and prose generation expressions**
- Timestamp: 2026-03-10 22:56:34
- Build comprehensive overview of all UI screens and fields
- Document the expressions that generate text for each field
- Goal: Enable easy iteration on prose generation algorithms
- This should be a living reference document for frontend QA and prose tuning

---

**Notes for later:**
- These items span multiple systems: agent behavior, culture, relations, UI documentation
- Several items are interconnected (bonds, leverage, oaths, ambitions all affect agent decision-making)
- Consider grouping into a "Agent Motivations Phase" or similar epic
