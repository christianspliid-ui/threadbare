# Domain Prowess Redesign

**Date:** 2026-04-07
**Status:** Design approved
**Scope:** Phase 1 — Ascendant + Actor detail sheets. Phase 2 (later) — Faction, Army, Settlement with entity-specific prose.

## Problem

The current Prowess tab displays domain capabilities as a tight 4x2 grid with small SVG icons and single-word descriptors ("Phantom", "Revered", "Cosmic"). These words are mechanical and context-free — "Phantom in Shadow" tells the player nothing about the character. The grid reads as a stat sheet, not a narrative experience.

## Solution

Replace the compact grid with **horizontal domain cards** featuring:
1. **Tier-specific art** — 40 pre-baked square PNGs (8 reaches x 5 tiers), symbolic/emblematic style escalating in intensity
2. **Narrator-voice prose** — 40 template sentences describing how a character at that tier expresses the reach, with `{name}/{they}/{them}/{their}` interpolation
3. **Shared `DomainCard` component** — reusable across all detail sheets

## Design Decisions

### Layout: Horizontal List (not grid)

Each domain renders as a horizontal card:
- 72px square art thumbnail on the left
- Text block on the right: reach name (gold small-caps) + tier word suffix ("· Fearsome") + italic prose description below
- Unknown/unrevealed domains: greyed-out art, "???" tier word, placeholder prose

Chosen over 2-column grid because: more domains visible without scrolling, art still present as a thumbnail anchor, prose has room to breathe.

### Prose Voice: Narrator/Observer

Third-person narrator describing the character warmly, as if the game knows them personally.

Example (Iron, tier 3 — Formidable):
> *Kael fights with a cold precision that unnerves even seasoned warriors. His blade finds openings others wouldn't dare reach for.*

Not rumor-voice ("They say...") or dossier-voice ("A phantom in the world."). The narrator voice matches the game's Threadbare aesthetic — literary, warm, specific.

### Art Style: Symbolic/Emblematic

Each image depicts a single iconic object or scene representing the reach at that tier. Clean digital painting in the Remembrance style (the project's established art direction for catalog art). Not character vignettes (too identity-specific) or abstract textures (too vague).

Tier escalation example for Iron:
- Tier 1 (Meek): A dented wooden shield resting against a mud wall
- Tier 2 (Trained): A well-kept sword on a training rack
- Tier 3 (Formidable): A battle-scarred greatsword planted in scorched earth
- Tier 4 (Fearsome): A legendary blade wreathed in heat-shimmer, cracks of ember
- Tier 5 (Legendary): A molten greatsword cleaving through a shattered fortress gate

### Tier System: 5-Tier UI Scale (Unchanged)

The existing `DOMAIN_WORD_SCALES` (5-tier) drives the UI. The existing `NARRATIVE_LEXICON` (10-tier) stays engine-internal. The new prose layer maps 1:1 to the 5-tier scale — one prose template per tier per reach (40 total).

### Pronoun System: Reuse Existing

The project already has `{they}/{them}/{their}` interpolation via `proseEnrichment.ts`, with gender derived from agent node properties. The domain prose templates use the same placeholder syntax.

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/data/domain-prose.ts` | 40 narrator-voice prose templates (8 reaches x 5 tiers). Exports `DOMAIN_PROSE: Record<ReachDomain, [string, string, string, string, string]>` and `getDomainProse(reach, tier, name, pronouns)` |
| `src/components/shared/DomainCard.tsx` | Shared horizontal card component |
| `public/assets/reaches/{reach}-{tier}.png` | 40 square art PNGs (512x512 source, displayed at 72px with retina support) |

### Modified Files

| File | Change |
|------|--------|
| `src/components/Game/tabs/ProwessTab.tsx` | Replace 4x2 grid with vertical `DomainCard` list |
| `src/components/Game/AscendantSheet.tsx` | Replace domain grid with `DomainCard` list |
| `src/engine/agentDetail.ts` | Add tier number to `AgentInfoCardData.domains` entries (currently only exposes word, not tier index) |

### Unchanged

| File | Why unchanged |
|------|---------------|
| `src/data/domain-words.ts` | 5-tier word scales kept as compact labels (sidebar, card suffix) |
| `src/types/traits.ts` | 10-tier NARRATIVE_LEXICON stays engine-internal |
| `src/components/Game/AgentInfoCard.tsx` | Sidebar keeps "Formidable in Iron" compact format |
| `src/engine/domainCapability.ts` | Engine scoring untouched |
| Knowledge gating logic | Same `revealedDomains` + knowledge level thresholds |
| `src/engine/tooltipResolver.ts` | Reach tooltips still explain what the reach *is* |

### DomainCard Component Interface

```typescript
interface DomainCardProps {
  reach: ReachDomain;
  tier: number;          // 0-4 (indexes into DOMAIN_WORD_SCALES and DOMAIN_PROSE)
  agentName: string;     // for prose {name} interpolation
  gender?: string;       // for pronoun resolution; defaults to neutral "they/them"
  revealed: boolean;     // false = greyed out unknown state
}
```

### Domain Prose Data Shape

```typescript
// Each reach has 5 prose templates, indexed by tier (0-4)
export const DOMAIN_PROSE: Record<ReachDomain, [string, string, string, string, string]> = {
  iron: [
    "{name} flinches at the sound of drawn steel. {They} are no fighter, and know it.",
    "{name} holds a blade correctly and knows when to raise a shield. Drilled, not tested.",
    "{name} fights with a cold precision that unnerves even seasoned warriors. {Their} blade finds openings others wouldn't dare reach for.",
    "Soldiers who've faced {name} don't speak of it willingly. {They} move through battle like a scythe through wheat.",
    "Songs are sung of {name}'s blade-work, though the songs get the details wrong. The truth is worse.",
  ],
  // ... remaining 7 reaches authored during implementation
};
```

### Art Asset Pipeline

- **Location:** `public/assets/reaches/{reach}-{tier}.png` (e.g. `iron-1.png` through `iron-5.png`, `gold-1.png` through `gold-5.png`)
- **Dimensions:** 512x512 source PNGs (displayed at 72px CSS, crisp on 2x retina)
- **Style:** Symbolic/emblematic, clean digital painting (Remembrance style), single iconic object/scene per image
- **Generation:** Pre-baked via image generation with art direction prompts per image (40 total)
- **Tier naming:** 1-indexed to match player-visible tier numbering (tier 1 = lowest, tier 5 = highest)

### Art Direction Per Reach (Summary)

| Reach | Tier 1 | Tier 5 |
|-------|--------|--------|
| Iron | Dented shield against a mud wall | Molten greatsword cleaving a fortress gate |
| Gold | A few tarnished coins on a rough cloth | A treasury vault overflowing, golden light |
| Shadow | A candle casting a nervous shadow | Empty room, no shadow, no trace — only absence |
| Veil | A cracked mirror with a faint shimmer | Reality tearing open, raw magical energy pouring through |
| Heart | A hand reaching out, ignored | A figure at the center of a crowd, all eyes drawn to them |
| Eye | A shuttered window, darkness | An eye reflecting an entire city in its iris, seeing everything |
| Stone | A crooked fence post in soft ground | A cathedral carved from living mountain, eternal |
| Star | A clouded night sky, no stars visible | The heavens ablaze, constellations rearranging into a pattern |

Full art direction prompts will be authored during the implementation phase using the `art-direction` skill.

## Phase Scope

### Phase 1 (This Work)

- `DomainCard` shared component
- `domain-prose.ts` data file (40 prose templates for individual characters)
- 40 reach art assets
- ProwessTab.tsx refactored to use DomainCard
- AscendantSheet.tsx refactored to use DomainCard
- agentDetail.ts updated to expose tier index

### Phase 2 (Future)

- FactionSheet.tsx — different prose voice (institutional: "The faction's Iron doctrine emphasizes...")
- ArmySheet.tsx — different prose voice (military: "This army's Iron strength comes from...")
- SettlementSheet.tsx — different prose voice (civic: "The settlement's Stone works include...")
- Each entity type needs its own 40-entry prose table with appropriate voice

## What This Replaces

- The 4x2 compact domain grid in ProwessTab (deleted)
- The duplicated domain grid in AscendantSheet (deleted)
- Small SVG `ReachIcon` in these contexts (replaced by art thumbnails; ReachIcon remains available for other uses like sidebar, tooltips)
