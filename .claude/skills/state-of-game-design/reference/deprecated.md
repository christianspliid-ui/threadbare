---
name: state-of-game-design/deprecated
description: >
  Rejected approaches for The Fantasy World Simulator. Load this shard when
  proposing a pattern that might have been tried and rejected — check here first
  to avoid reintroducing a known anti-pattern.
last_validated_against: 2026-05-16
---

# Deprecated Concepts — Do Not Reintroduce

These approaches were tried and explicitly replaced. If you find yourself proposing
one of these, stop and reconsider — or raise it as a design question with rationale
for why the rejection no longer applies.

| Deprecated | Replaced By |
|-----------|-------------|
| Classical stats (STR/DEX/INT) | Domain Capability across Eight Reaches |
| Fixed rival pantheon | Generated rivals from World-Soul |
| Old 5-force cosmology | Foundation + Creation Sphere model |
| Pure template-based prose | Hybrid layered engine |
| Pure LLM-generated content | Generated-within-constraints with player iteration |
| Intervention wheel (AgentWheel) | ActionDrawer with context-filtered cards |
| Fixed action count / capped slots | Open-ended data-driven template pool |
| React Three Fiber (R3F) | Raw Three.js with canvas ref |
| V1 SVG hex map | HexMapV2 (Three.js InstancedMesh) |
| Spheres as fixed Reach pairings | Orthogonal axes that combine freely |
| 9 Reaches (including Flesh) | 8 Reaches + Quintessence meta-property |
| Utility-function AI | Maslow need hierarchy |
| Behaviour trees | Maslow need hierarchy |
| Location-hop awareness (distance matrix BFS via `adjacent` edges) | Hex-distance awareness (geometric, sublocation-agnostic) |

> **Canonical source:** CLAUDE.md § "Rejected Approaches (do not reintroduce)" is the primary ledger. This shard mirrors it for agent context economy; if they diverge, CLAUDE.md wins.
