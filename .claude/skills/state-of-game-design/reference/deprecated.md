---
name: state-of-game-design/deprecated
description: >
  Rejected approaches for Threadbearer. Load this shard when
  proposing a pattern that might have been tried and rejected — check here first
  to avoid reintroducing a known anti-pattern.
validated_doctrine: rules-of-play@1
last_validated_against: 2026-08-28
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
| `EncounterTemplate` format | `UnifiedActionTemplate`, the single encounter format (THR-108 — the type no longer exists; do not author, import, or reference it) |
| Choosing between authored futures / `authoredChoices` (player picks the ending) | The nudge model (THR-772): essence-priced cards bend odds, fate rolls the band, the mortal decides forks (`decidedBy`). WS5 migration complete (THR-1086) |
| Fixed divine verb trio (whisper / nudge / vision) and the fixed 8-verb intervention menu | Retired 2026-05-04 → superseded again by the nudge-card hand (THR-772/883) |
| Percentages or raw numbers on mortal-facing surfaces | Five forecast words (doomed/perilous/uncertain/favorable/fated) + four difficulty words (gentle/fair/steep/severe); numbers live in the designer/debug view only |
| Intelligence/visibility-gating of encounter candidates | Closed design space (THR-138): intel *enriches* an encounter when present, never hides one |
| Retired archetype pole names — Shadow Saboteur/Deceiver, Veil Seer/Manipulator, Eye Witness/Judge, Stone "Dependable"; also the Mender/Magnate…Martyr/Survivor generation | The current registry (`src/types/axisRegistry.ts`; `Docs/canon/cosmology.md` §Cosmological Pattern, revisions 2026-06-29 + THR-1135) |
| The lyrical prose register + the 14-question scene-writer checklist | Prose Doctrine v2 (2026-08-25): narrator mode, 12-question checklist, plain descriptive register (`Docs/canon/prose.md`) |
| Static `ActionStep.factorLines` | Derived factor lines from `computeResolutionModifiers` (THR-892); trait + carryover lines are the surviving authored surfaces |
| Fiction-first authoring order (story written before the game design) | Game-design-decisions-first binding order (director ruling 2026-08-24; `nudge-authoring-spec.md` § Authoring order) |
| Player-as-character framing ("choose how the character responds") | The player is a god intervening at one remove; all player-facing options are god actions |

> **Canonical source:** CLAUDE.md § "Rejected Approaches (do not reintroduce)" is the primary ledger for the architectural rows; `Docs/canon/encounters.md` § Rejected approaches and `Docs/canon/cosmology.md` § Rejected approaches own the encounter/cosmology rows. This shard mirrors them for agent context economy; if they diverge, the canon page wins.
