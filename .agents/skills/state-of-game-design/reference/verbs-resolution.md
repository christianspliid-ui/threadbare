---
name: state-of-game-design/verbs-resolution
description: >
  Engine reference for The Fantasy World Simulator: the 5 action verbs,
  sigmoid → d100 resolution system, actor prerequisites (two-axis), generalized
  action targeting, and player influence. Load for engine code, tick loop work,
  resolution logic, or PRNG work.
last_validated_against: 2026-05-16
---

# Verbs, Resolution & Prerequisites

## The 5 Action Verbs

| Verb | CRUD | Character |
|------|------|-----------|
| **Create** | `create` | Bring something into existence |
| **Find** | `read` | Perceive, search, reveal hidden information |
| **Change** | `update` (one-time) | One-time modification for a one-time cost. Fire and forget. |
| **Destroy** | `delete` | Remove, corrupt, scatter, erase |
| **Control** | `update` (sustained) | Sustained commitment requiring continuous resources, focus, or stability |

**Change vs Control:** Change is a one-shot. Control is sustained — you don't just *do* things, you *hold* things. Control is the god-game signature verb.

**"You can't Update what you haven't Read"** — Find actions gate Change/Control actions. Natural chains: Find → Change/Create → Control.

---

## Resolution System

Unified sigmoid pool → d100:
1. Gather domain capability scores for the relevant Reach
2. Feed through sigmoid curve → probability (0–1)
3. Roll d100 against that probability
4. No alternative dice systems, no special-case resolution

---

## Actor Prerequisites (Two-Axis)

Actions are gated by two orthogonal checks:
- **Reach prerequisite** — Domain Capability tier (competence: "can you do this type of activity?")
- **Sphere prerequisite** — sphere alignment match (alignment: "does your cosmic energy resonate?")

Both optional per template. Some actions only need reach competence. Some only need sphere alignment. The interesting ones need both. Prerequisites also gate *visibility* — you don't see what you can't attempt.

---

## Generalized Action Targeting

Any graph node the player focuses on in a detail view becomes an action target. The ActionDrawer populates with contextually-filtered action cards.

Pipeline: `TargetContext` → `getTargetActionSlots()` → `ActionDrawer`

Filtering cascade: node-type → subtype → traits → sphere → essence → range.

Templates declare `targetCategories` (actor, location, sublocation, hex, artifact) and `targetSubtypes`. The system is open-ended — no fixed cap on action variety.

**Template inventory:** 119+ unified templates across CRUD (36), encounters (68), divine (8), location (4), attachment (4), sublocation (3), hex (4). ~40+ additional hex concepts across 5 verbs × 4 layers in design phase.

---

## Player Influence System

The Ascendant's core loop: influence mortal agents through tiers of connection.

- **Influence Tiers:** Unaware → Curious → Recognized → Devoted → Enthralled → Aspect
- **Influence Essence:** Sphere-typed divine currency. Regenerates from worshippers and places of power
- **Stealth:** Two-audience detection (mortals notice your meddling, rival gods detect your presence)
- Higher tiers = cheaper aligned nudges, but higher detection risk

---

## Agent Action Selection (Maslow Pipeline)

Six-layer need hierarchy: survival → safety → belonging → esteem → self-actualization → transcendence.

- Higher layers only activate when lower needs are met
- No utility-function AI, no behaviour trees (rejected approaches)
- Agents score candidates by goal alignment, divine overlay, disposition, personality weights
- Select top-N probabilistically via seeded PRNG

---

## Relevant References

| What | Where |
|------|-------|
| Generalized Action Targeting design | `Docs/plans/2026-03-17-generalized-action-targeting-design.md` |
| Domain Capability design | `Docs/plans/2026-03-04-disc13-domain-capability-and-resolution-design.md` |
| Original CRUD design | `Docs/plans/2026-03-03-actor-crud-action-system.md` |
| Engine architecture skill | `.claude/skills/engine-architecture/SKILL.md` |
