# Artifact Representation Pattern

**Status:** binding UI pattern (THR-639)
**Source:** `Docs/plans/2026-07-05-action-unlock-reveal-and-artifact-representation.md`
**Generalizes:** THR-637 Entity Visual Header (image-only → image **+** information)

A core UX pattern for The Fantasy World Simulator. Loaded by the `frontend-ui` skill, so it is binding for future UI work.

## Statement

When a **core game artifact** is the subject of a surface — **introduced** (onboarding, unlock, beat), **granted** (reward, aftermath), or **detailed** (profile, codex, panel) — the surface must render all three of:

1. **Canonical visual.** The artifact's art via its registry/resolver (portrait, card art, concept art, sigil, or the styled fallback chain from THR-637). Never text-only.
2. **Identity block.** Name + kind (type line) in the artifact's canonical presentation — an action looks like its card; an agent like their portrait header; a location like its hero landscape.
3. **Player-relevant information.** What this artifact means to the player right now, in plain prose (an action's effects line; an agent's disposition; a location's character). Derived from live data, composition-first with authored overrides.

One pattern, two obligations: **art + information.** A surface that names an artifact in text only is a pattern violation — same severity as a viewport-contract violation.

## Canonical registry of core game artifacts

From the 2026-07-05 sweep of `src/types/graph.ts`, the UL shards, the Codex registry, and the IA surfaces — the definitional answer to "what qualifies as a game artifact":

| Artifact | Canonical visual today | Info source |
|---|---|---|
| Agent (incl. The First, NPC roles) | archetype/bespoke portrait + silhouette fallback | AgentInfoCard prose, knowledge-gated |
| Ascendant | avatar portrait (compositor) | identity panel |
| Faction | glyph → styled fallback (THR-637); sigil art (THR-638) | EntityCard sections |
| Location / Hex | `pickConceptArt` 16:9 landscape | LocationView |
| Sublocation | parent-location inheritance → styled fallback | EntityCard |
| Action (divine / mortal / target-scoped) | `ACTION_ART` registry via ActionCard | template + effects line (`actionEffectsProse`, THR-639) |
| Encounter | stage illustration | EncounterChoiceCard / Chronicle |
| Thread | ThreadsPanel edge visual | thread state prose |
| Possession / Condition / Agreement | Codex glyph + tier | CodexCard technical effect |
| Artifact (legendary) | glyph → styled fallback (THR-637/638) | trait graph |
| Trait / Ambition / Relationship | inline only (no independent card yet — acceptable; they are facets of agents, not free-standing artifacts) | profile sections |
| Omen | OmenBar | clock prose |

## Compliance rule for future designs

Any new surface whose subject is a registry row **must state, in its plan doc's UI pillar, which visual + info source it uses.** THR-637's plan doc should reference this pattern rather than restate it.

## Reference implementation

THR-639 (Action Unlock Reveal) is the first surface built to this pattern end-to-end:

- **Visual + identity:** `AscendantBeatModal` renders the real focused `ActionCard` face (art via `ACTION_ART`, spell name, type line) for every granted action — via the display-only `templateToPreviewSlot` adapter, so `ActionCard` is reused unmodified.
- **Information:** each focused card carries a plain-prose **effects line** (`src/data/actionEffectsProse.ts`) — one player-facing sentence saying what the action does, what it touches, and what it costs. The Action Drawer's focused card shares the same line (one component, both surfaces).

THR-799 (Ceremonial reveal surface) is the second, and generalises the pattern into
reusable primitives. **No registry row changed** — traits in particular stay
inline-only, with no independent card. One row per subject the surface can carry:

| Subject | Canonical visual (registry / resolver) | Info source |
|---|---|---|
| Action (beat-unlock reveal) | the real focused `ActionCard` face — `ACTION_ART` via `templateToPreviewSlot`, `ActionCard` reused unmodified | effects line, `src/data/actionEffectsProse.ts` |
| Smaller event (EventPopup ceremonial path) | `SphereIcon` from `PopupItem.sphere` inside `Medallion` — the sphere *is* the event's canonical visual identity; no per-event art registry exists | `PopupItem.body` prose |
| Attachment (`AttachmentDetailView`) | attachment art when present, else the codex glyph (registry row "Possession / Condition") inside `Medallion` | existing attachment prose fields; `reveal-content.ts` fallback only when absent |
| Trait (inline, `NpcDetailView`) | inline `Medallion sm` chip — **inline only**, per the "Trait / Ambition / Relationship" row | existing profile-section trait prose; `reveal-content.ts` fallback |

**`Medallion` adds no second art-resolution path.** Where a subject resolves through
`entityVisualResolver` / `EntityVisual` (THR-637), Medallion's child *is* that resolved
visual, clipped to a disc. Its `✦` default is the tail of the existing THR-637 fallback
chain, not a parallel one.
