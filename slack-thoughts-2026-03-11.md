# Slack Thoughts from #threadbare — 2026-03-11

Documented from messages by Spliid. Ready to add to Notion backlog.

---

## Agent Systems

### Ambition Stat for Agents
**Time:** 13:32 CET | [Slack link](https://claudecoworke-stn3897.slack.com/archives/C0AKPCB5J05/p1773232365363039)

Agents need an **ambition stat** visible in their overview (when players pay for intel). Ambitions should tell players:
- What the agent will prioritize
- What their long-term goals are

This helps players understand agent behavior and decision-making patterns.

---

### Strong Bonds & Agreements Between Agents
**Time:** 13:40 CET | [Slack link](https://claudecoworke-stn3897.slack.com/archives/C0AKPCB5J05/p1773232844446029)

How can we create **bonds between agents, agent groups, and agent factions** as strong agreements that influence behaviors and decision-making?

Related to: faction mechanics, relationship networks, behavioral constraints.

---

### Leverage & Oaths in Relations
**Time:** 13:59 CET | [Slack link](https://claudecoworke-stn3897.slack.com/archives/C0AKPCB5J05/p1773233986358609)

Find a way to implement **leverage and oaths into relations** to:
- Drive politics
- Build strong networks of relationships

This connects to the bonds/agreements system above.

---

## Agent Personality & Behavior

### Integrate Ocean Model into Personality Traits
**Time:** 13:47 CET | [Slack link](https://claudecoworke-stn3897.slack.com/archives/C0AKPCB5J05/p1773233259430999)

Consider integrating the **ocean model** into the axiomatic personality trait list to get more behavior variants:
- Openness
- Closeness
- Extroversion
- Introversion

This could expand agent personality variety beyond current traits.

---

### Verify Cultural Morals & Laws
**Time:** 13:49 CET | [Slack link](https://claudecoworke-stn3897.slack.com/archives/C0AKPCB5J05/p1773233345789279)

Double-check if we have **cultural morals and laws** in our culture descriptions.

QA task: audit culture content packages for these fields.

---

## Frontend & Documentation

### Frontend Backlog: UI Overview in Paper
**Time:** 2026-03-10 22:56 CET | [Slack link](https://claudecoworke-stn3897.slack.com/archives/C0AKPCB5J05/p1773179794431929)

Create an **overview in Paper of all UIs** and what **expressions generate text for different fields**. This will:
- Let us easily iterate on generated prose algorithms
- Centralize UI field → prose generator mapping
- Support rapid A/B testing of prose

Depends on: Paper MCP setup.

---

## Technical Tasks

### Paper MCP Setup
**Time:** 08:17–08:18 CET | [Run command](https://claudecoworke-stn3897.slack.com/archives/C0AKPCB5J05/p1773213471004009)

```bash
claude mcp add paper --transport http http://127.0.0.1:29979/mcp --scope user
```

Status: Pending — check if paper MCP is available at that endpoint.

---

## Summary

**High Priority (Game Design):**
- Ambition stat system for agents
- Agent bonds & agreements mechanic
- Leverage & oaths in relations
- Ocean model for personality traits

**Mid Priority (QA):**
- Verify cultural morals & laws in cultures

**Frontend & Tools:**
- UI overview in Paper
- Paper MCP setup

---

*Extracted from Slack #threadbare on 2026-03-11 by Claude during scheduled task execution.*
