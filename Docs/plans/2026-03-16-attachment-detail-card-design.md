# Attachment Detail Card — UI Design

**Date:** 2026-03-16
**Status:** Design
**Scope:** Three-mode detail card for viewing attachments (possessions, conditions, powers, agreements, retainers). Composes existing components — no new UI primitives.
**Depends on:** Attachment system engine (complete), existing card/tooltip/panel components.

---

## Design Principle: Compose, Don't Create

The attachment detail card is **not** a new component family. It is a thin composition layer over existing UI building blocks with attachment-specific data renderers. Every display mode maps to an existing pattern.

| Display Mode | Reuses | What's New |
|-------------|--------|-----------|
| **Inline** (agent panel row) | SoulCard pattern (left border accent + name + metadata) | Tier color border, subcategory glyph, duration indicator |
| **Hover** (tooltip) | Tooltip component (portal-rendered, smart positioning) | Attachment-specific content resolver |
| **Expanded** (sidebar) | EntityCard (header/sections/footer) + ProgressBar | Attachment section renderers, tier-styled header |

---

## Tier Color System

Already defined in `src/types/attachments.ts`:

| Tier | Name | Hex | Visual |
|------|------|-----|--------|
| 1 | Mundane | `#b0b0b0` | Pale silver — fades into the UI, doesn't demand attention |
| 2 | Storied | `#c87533` | Warm copper — notable, but not rare |
| 3 | Mythic | `#4b0082` | Deep violet — stands out against the dark palette |
| 4 | Legendary | `#d4a017` | Gold/ember — unmistakable, uses the game's sacred gold accent |

**Usage rules:**
- Tier color appears on the **left border** (inline), **name text** (all modes), and **header accent** (expanded).
- Tier 4 (Legendary) gets a subtle `pulse-gold` animation on the inline left border — the only tier with animation. Reuse the existing `pulse-gold` keyframe from value feedback.
- Never fill large areas with tier color. It's an accent, not a background.

---

## Subcategory Glyphs

Unicode glyphs for each subcategory, following the existing glyph lookup pattern (Pattern 10 in ui-patterns.md). Readable at `--text-xs` (16px).

### Possessions (7)

| Subcategory | Glyph | Unicode | Notes |
|-------------|-------|---------|-------|
| Arms | ⚔ | U+2694 | Crossed swords |
| Mounts & Beasts | 🐎 | U+1F40E | Horse — or use ◈ (U+25C8) for a simpler silhouette feel |
| Vestments | 🧥 | U+1F9E5 | Coat — or use ◇ (U+25C7) |
| Tomes & Scrolls | 📜 | U+1F4DC | Scroll |
| Relics & Talismans | ◆ | U+25C6 | Filled diamond — simple, iconic |
| Tools & Instruments | ⚒ | U+2692 | Hammer and pick |
| Provisions | ⊕ | U+2295 | Circled plus — "consumable" feel |

### Conditions (4)

| Subcategory | Glyph | Unicode | Notes |
|-------------|-------|---------|-------|
| Wound / Injury | ✕ | U+2715 | Multiplication X — damage mark |
| Disease / Poison | ☠ | U+2620 | Skull and crossbones |
| Blessing | ✦ | U+2726 | Four-pointed star |
| Curse | ⊘ | U+2298 | Circled division slash — negation |

### Other Categories

| Category | Glyph | Unicode | Notes |
|----------|-------|---------|-------|
| Bestowed Power | ⟡ | U+27E1 | White concave-sided diamond |
| Agreement: Pact/Oath | ☍ | U+260D | Opposition — or use ⛓ (U+26D3) |
| Agreement: Debt/Favour | ⚖ | U+2696 | Scales |
| Retainer | ♟ | U+265F | Chess pawn |

**Fallback:** If a subcategory has no glyph mapping, use `◈` (U+25C8, diamond with inner dot).

**Implementation:** Module-level `Record<string, string>` lookup with fallback, same pattern as `TERRAIN_GLYPHS` in LocationCard.

---

## Mode 1: Inline (Agent Panel Row)

Shown in the agent detail sidebar wherever attachments are listed — retinue panel, agent info card, entity card sections.

### Layout

```
┌─────────────────────────────────────────┐
│▌ ⚔ Ashenmane's Fang          Storied  │
│▌   +Iron, cavalry charge      ████░░  │
└─────────────────────────────────────────┘
 ↑                                  ↑
 3px left border                    duration bar
 (tier color)                       (ProgressBar, only if transient)
```

### Structure (composes SoulCard pattern)

```
┌── 3px left border (ATTACHMENT_TIER_COLORS[tier]) ──────────────┐
│                                                                 │
│  [glyph]  [name]                          [tier name, muted]   │
│           [mechanicalSummary, --text-secondary, italic]        │
│           [ProgressBar if ticksRemaining, else duration text]  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Behavior
- **Background:** `var(--bg-raised)` with `var(--border-subtle)` border — matches SoulCard.
- **Hover:** Border color transitions to `var(--accent-gold-dim)` — matches LocationCard hover.
- **Click:** Opens expanded detail card in sidebar (replaces current sidebar content, same as agent click → AgentInfoCard).
- **Tier 4 special:** Left border pulses using existing `pulse-gold` class.
- **Duration indicator:** Only shown for conditions and time-limited agreements. Uses ProgressBar component (progress = ticksRemaining / totalTicks). For permanent attachments, no bar. For "until dispelled," show italic text "until dispelled" in `--text-tertiary`.
- **Keyboard:** `role="button"`, `tabIndex={0}`, Enter/Space opens expanded view.

### Component Name: `AttachmentRow`

**Props:**
```ts
interface AttachmentRowProps {
  name: string;
  subcategory: string;          // glyph lookup key
  tier: AttachmentTier;         // 1-4
  mechanicalSummary: string;
  ticksRemaining?: number | null;
  totalTicks?: number;
  durationLabel?: string;       // "permanent", "until dispelled", etc.
  onClick?: () => void;
}
```

**Reuses:** SoulCard layout pattern, ProgressBar, ATTACHMENT_TIER_COLORS lookup, glyph lookup table.

---

## Mode 2: Hover Tooltip

Shown on mouse hover over the inline row (with standard hover delay from Tooltip component).

### Layout

```
┌─────────────────────────────────────────────┐
│  ⚔ Ashenmane's Fang              [Storied] │
│  ─────────────────────────────────────────  │
│  +Iron in open terrain, grants cavalry      │
│  charge encounters, +movement range         │
│                                             │
│  ████████████░░░░░░  12 ticks remaining     │
│                                             │
│  ⚡ 10% chance: horse bolts on crit fail    │
└─────────────────────────────────────────────┘
         ▼ (arrow pointing to trigger row)
```

### Structure

```
┌── max-width: 280px ────────────────────────────────────────────┐
│                                                                 │
│  [glyph] [name, tier-colored]              [tier badge, muted] │
│  ──── thin separator (--border-subtle) ────                    │
│  [mechanicalSummary, --text-secondary]                         │
│                                                                 │
│  [ProgressBar + "N ticks remaining"]    ← only if transient    │
│                                                                 │
│  [⚡ trigger summary, --text-tertiary]  ← only if has triggers │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Behavior
- **Renders via existing Tooltip component.** The attachment row wraps its content in `<Tooltip>` with custom `label` and `desc` props.
- **No new positioning logic.** Tooltip already handles portal rendering, viewport clamping, above/below flip, and chained depth.
- **Tier badge:** Small inline text showing tier name in tier color, with 30% opacity background pill. Same pattern as archetype tags in SoulCard.
- **Trigger summary:** If the attachment has `onUseTriggers`, show a single-line summary: lightning bolt glyph (⚡) + probability + effect name + trigger condition. Only the *most dramatic* trigger is shown (highest probability or most impactful effect). Full trigger details go in the expanded card.
- **Duration bar:** Same ProgressBar as inline mode, but with explicit tick count text beside it.

### Implementation

No new component — this is the existing Tooltip with an `attachmentTooltipResolver` that formats the content from attachment data. Register it alongside the existing `tooltipResolver` system.

**Resolver signature:**
```ts
function resolveAttachmentTooltip(
  attachment: AttachmentData
): { label: string; desc: string }
```

---

## Mode 3: Expanded Detail Card (Sidebar)

Full detail view, shown in the right sidebar when the player clicks an attachment row. Replaces the current sidebar content (same pattern as clicking an agent → AgentInfoCard).

### Layout

```
┌─────────────────────────────────────────────────┐
│  ← Back    Ashenmane's Fang           Codex →  │  ← header
│            STORIED · ARMS                       │     (EntityCard header)
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │                                            │ │  ← art slot (optional)
│  │        [ concept art 200×200 ]             │ │     bg-deep, centered
│  │        (or subcategory glyph              │ │     glyph fallback at 3rem
│  │         at 3rem if no art)                 │ │
│  │                                            │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  "Won in a border raid. Still bites             │  ← flavor text
│   strangers."                                   │     italic, --text-secondary
│                                                  │
│  ── EFFECT ─────────────────────────────────── │  ← section: mechanical
│  +Iron in open terrain                          │
│  Grants: cavalry_charge, rapid_retreat          │
│  Loss: stealable                                │
│                                                  │
│  ── DURATION ───────────────────────────────── │  ← section: duration
│  ████████████░░░░░░░  12 / 20 ticks            │     (only if transient)
│  Acquired: tick 45, Battle of the Ash Ford      │
│                                                  │
│  ── TAGS ───────────────────────────────────── │  ← section: tags
│  [#mount] [#beast] [#iron] [#flesh]             │     pill badges
│                                                  │
│  ── TRIGGERS ───────────────────────────────── │  ← section: on-use
│  ⚡ Critical failure (10%)                      │     (only if has triggers)
│  "Ashenmane rears in terror..."                 │     italic narrative template
│  Effect: lose possession, gain "Thrown" (5t)    │
│                                                  │
│  ── SOURCE ─────────────────────────────────── │  ← section: provenance
│  Acquired: Battle of the Ash Ford               │     (only if source data)
│  Location: The Western March                    │
│  Tick: 45                                        │
│                                                  │
├─────────────────────────────────────────────────┤
│  [ View Full Codex Entry ]                      │  ← footer button
└─────────────────────────────────────────────────┘     (future: links to Obsidian)
```

### Structure (composes EntityCard)

The expanded card is an **EntityCard** with attachment-specific section renderers. No new panel component needed.

**Header mapping:**
```ts
const header: EntityHeader = {
  name: attachment.name,
  subtitle: `${ATTACHMENT_TIER_NAMES[tier]} · ${subcategoryLabel}`,
  accentColor: ATTACHMENT_TIER_COLORS[tier],
  // icon: subcategory glyph (rendered in EntityCard's icon slot)
};
```

**Sections mapping:**
```ts
const sections: EntitySection[] = [
  // 1. Art slot (conditional)
  attachment.image
    ? { title: '', type: 'image', content: attachment.image }
    : null,

  // 2. Flavor text (conditional)
  attachment.flavorText
    ? { title: '', type: 'prose', content: attachment.flavorText }
    : null,

  // 3. Effect (always)
  {
    title: 'EFFECT',
    type: 'structured',
    blocks: [
      { type: 'text', content: attachment.mechanicalSummary },
      attachment.grants
        ? { type: 'keyword_cloud', items: attachment.grants }
        : null,
      { type: 'text', content: `Loss: ${attachment.lossCondition}` },
    ],
  },

  // 4. Duration (conditional — transient only)
  attachment.ticksRemaining != null
    ? {
        title: 'DURATION',
        type: 'structured',
        blocks: [
          { type: 'progress', progress: ticksRemaining / totalTicks, color: tierColor },
          { type: 'text', content: `${ticksRemaining} / ${totalTicks} ticks` },
        ],
      }
    : null,

  // 5. Tags (always)
  {
    title: 'TAGS',
    type: 'structured',
    blocks: [{ type: 'keyword_cloud', items: attachment.tags }],
  },

  // 6. Triggers (conditional)
  attachment.onUseTriggers?.length
    ? {
        title: 'TRIGGERS',
        type: 'structured',
        blocks: attachment.onUseTriggers.map(t => ({
          type: 'trigger',  // new block renderer
          trigger: t,
        })),
      }
    : null,

  // 7. Source (conditional)
  attachment.source
    ? {
        title: 'SOURCE',
        type: 'structured',
        blocks: [
          { type: 'text', content: attachment.source },
        ],
      }
    : null,
].filter(Boolean);
```

### New EntityCard Block Type: `trigger`

One new structured data block renderer for EntityCard. Follows the existing block renderer pattern (Pattern 7 in ui-patterns.md).

```
┌─────────────────────────────────────────────┐
│ ⚡ Critical failure (10%)                    │  ← condition + probability
│ "Ashenmane rears in terror. {actor} hits     │  ← narrative template
│  the ground hard..."                         │     italic, --text-tertiary
│ → Lose possession, gain "Thrown" (5 ticks)   │  ← mechanical effect summary
└─────────────────────────────────────────────┘     → prefix, --text-secondary
```

### Art Slot Behavior

- **If image exists:** Render as a `200×200` max image, centered in a `bg-deep` box with subtle border. `object-fit: contain`. Rounded corners match card radius.
- **If no image:** Render the subcategory glyph at `3rem` size, centered in the same box, in the tier color at 40% opacity. The card looks intentional either way — the glyph is the "icon" and the empty art slot doesn't feel broken.
- **Image loading:** Lazy load with `loading="lazy"`. Placeholder is the glyph fallback. No skeleton screen — the glyph-to-image transition uses a simple fade (existing `anim-fade` pattern).

### Tag Pills

Reuse the existing keyword_cloud block renderer from EntityCard. Tags display as inline pills with:
- Background: tier color at 15% opacity
- Border: tier color at 30% opacity
- Text: tier color at full brightness
- Font: `--text-xs`, uppercase, `letter-spacing: 0.06em`

This matches the existing pill pattern in ArchetypeCard domain affinity badges.

---

## Integration Into Agent Views

Attachments appear in both the single-click sidebar detail (Tier 2) and the double-click full character sheet modal (Tier 3). Each view shows attachments differently — the sidebar is compact and actionable, the modal is narrative and contemplative.

### AgentDetailPanel (Tier 2 — Sidebar, Single Click)

**Insertion point:** After Bonds section, before Disposition. This groups "what they have" (possessions, conditions, powers) between "who they know" (bonds) and "how they act" (disposition/strategy).

**Current section order with attachment sections inserted:**

```
1.  Archetype Banner
2.  Faction Tag
3.  Domain Grid
4.  Character Values
5.  Bonds
6.  ── POSSESSIONS ──────────   ← NEW (intimate+ knowledge)
7.  ── CONDITIONS ───────────   ← NEW (recognised+ knowledge)
8.  ── POWERS & AGREEMENTS ──   ← NEW (intimate+ knowledge)
9.  Disposition
10. Location Link
    ─── footer ───
    Activity
    Action buttons
```

**Knowledge gating per section:**

| Section | Knowledge Level | Rationale |
|---------|----------------|-----------|
| Conditions | `recognised+` | Visible afflictions are public knowledge — you can *see* someone is plague-touched or wounded |
| Possessions | `intimate+` | You need to know someone well to know what they carry. Named weapons might be `known+` in future, but `intimate` is the safe default |
| Powers & Agreements | `intimate+` | Divine gifts and binding pacts are deeply personal knowledge |

**Section rendering — Possessions:**

```
── POSSESSIONS ──────────────────────────────────
┌─────────────────────────────────────────────┐
│▌ ⚔ Ashenmane's Fang               Storied  │
│▌   +Iron, cavalry charge                    │
├─────────────────────────────────────────────┤
│▌ 🐎 Road-Worn Mule                Mundane  │
│▌   +movement range                          │
└─────────────────────────────────────────────┘

Empty: "They carry nothing of note."
```

Each row is an `AttachmentRow`. Rows are sorted: tier descending, then name ascending (same sort logic as retinue agents in `retinue.ts`). Maximum **5 rows** shown in the sidebar; if more exist, a muted "and N more…" link expands to full list or navigates to the character sheet.

**Section rendering — Conditions:**

```
── CONDITIONS ───────────────────────────────────
┌─────────────────────────────────────────────┐
│▌ ✕ Bruised Ribs                   Mundane  │
│▌   -Iron (minor)            ████████░░░░░  │
├─────────────────────────────────────────────┤
│▌ ✦ Sun-Touched                    Mundane  │
│▌   +Star (minor)            ██████░░░░░░░  │
└─────────────────────────────────────────────┘

Empty: "Neither blessed nor cursed — for now."
```

Conditions always show their duration bar (ProgressBar). Permanent conditions ("until dispelled") show italic text instead of a bar.

**Section rendering — Powers & Agreements (combined):**

Bestowed powers, retainer bonds, and agreements are combined into one section to avoid three potentially-empty sections cluttering the sidebar.

```
── POWERS & AGREEMENTS ──────────────────────────
┌─────────────────────────────────────────────┐
│▌ ⟡ Turn Undead                    Storied  │
│▌   +Star, sense undead                      │
├─────────────────────────────────────────────┤
│▌ ⚖ The Seven-Task Bargain          Mythic  │
│▌   +Veil, -Star · pact                     │
└─────────────────────────────────────────────┘

Empty: "Unburdened by oath or gift."
```

**Click behavior:** Clicking any AttachmentRow pushes the AttachmentDetailView (expanded mode) onto the sidebar stack. Back button returns to AgentDetailPanel.

---

### AgentProfileModal (Tier 3 — Character Sheet, Double Click)

**Insertion point:** After Traits section, before Origin. This keeps "intimate-level" knowledge grouped together: traits tell you *who* someone is, attachments tell you *what marks them*, and origin tells you *where they came from*.

**Current section order with attachment sections inserted:**

```
1.  Quotes                    (known+)
2.  Nature (Values)           (recognised+)
3.  Prowess (Domains)         (recognised+)
4.  Bonds                     (known+)
5.  Traits                    (intimate+)
6.  ── POSSESSIONS ────────   ← NEW (intimate+)
7.  ── AFFLICTIONS ────────   ← NEW (recognised+)
8.  ── GIFTS & BURDENS ───   ← NEW (intimate+)
9.  Origin                    (intimate+)
10. Full Account              (transparent)
11. Disposition               (intimate+)
12. History                   (transparent)
13. Interaction Record        (transparent)
```

**Note on naming:** The modal uses more narrative section names than the sidebar — "Afflictions" instead of "Conditions," "Gifts & Burdens" instead of "Powers & Agreements." This matches the modal's character-sheet-as-story-document tone (see how it already uses "Nature" instead of "Values" and "Prowess" instead of "Domains").

**Modal rendering style — prose vignettes, interactive:**

Attachments in the modal render as **prose vignettes** — richer than the sidebar's compact rows, with flavor text and source info visible inline. This matches the modal's existing pattern where domains are inline prose ("Formidable in Iron · Capable in Gold") rather than grid cells.

But unlike static prose, every vignette is **interactive**:
- **Hover** → Tooltip with mechanical effect summary (same attachment tooltip resolver used by the sidebar)
- **Click** → Opens the AttachmentDetailView as a nested overlay within the modal (not the sidebar — the modal owns its own navigation)

This gives the character sheet the read-through quality of a story document while letting players drill into any attachment for full details, triggers, and tags.

**Possessions section:**

```
── POSSESSIONS ──────────────────────────────────

  ⚔ Ashenmane's Fang                    STORIED    ← clickable, hover tooltip
  "The blade remembers every hand that held
   it. Yours is the coldest yet."
  +Iron · arms · breakable

  🐎 Road-Worn Mule                     MUNDANE    ← clickable, hover tooltip
  +movement range · mount · stealable
```

Each possession shows: glyph + name (tier-colored, clickable) + tier label, then flavor text (italic, if present), then mechanical summary + key tags + loss condition on one line. No border boxes — just spaced entries with a thin separator between them. Hover over the name shows the tooltip; click opens the detail view.

**Hover behavior:** Wrapping the name in the existing `<Tooltip>` component with attachment resolver. Shows mechanical summary + duration + most dramatic trigger — same content as the sidebar tooltip. Quick glance without leaving the character sheet.

```
┌─────────────────────────────────────────────┐
│  ⚔ Ashenmane's Fang              [Storied] │
│  ─────────────────────────────────────────  │
│  +Iron in open terrain, grants cavalry      │
│  charge encounters, +movement range         │
│  Loss: breakable                            │
│  ⚡ 25% chance: shatters on crit fail       │
└─────────────────────────────────────────────┘
```

**Click behavior:** Opens an AttachmentDetailView overlay *within* the modal. This is a slide-in panel (not a new modal on top of the modal — no modal stacking). Uses AnimateMount with `anim-fade` for transition.

```
┌─── AgentProfileModal ───────────────────────────────┐
│                                                      │
│  ┌─── AttachmentDetailView (slide-in) ────────────┐ │
│  │  ← Back    Ashenmane's Fang          Codex →   │ │
│  │            STORIED · ARMS                       │ │
│  │                                                 │ │
│  │  [art or glyph fallback]                        │ │
│  │                                                 │ │
│  │  "The blade remembers every hand..."            │ │
│  │                                                 │ │
│  │  ── EFFECT ──────────────────                   │ │
│  │  +Iron in open terrain                          │ │
│  │  Grants: cavalry_charge, rapid_retreat          │ │
│  │  Loss: breakable                                │ │
│  │                                                 │ │
│  │  ── TRIGGERS ────────────────                   │ │
│  │  ⚡ Critical failure (25%)                      │ │
│  │  "The blade shatters against..."                │ │
│  │                                                 │ │
│  │  ── TAGS ────────────────────                   │ │
│  │  [#weapon] [#iron] [#cursed]                    │ │
│  │                                                 │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

Back button (or Escape) returns to the character sheet scroll position. The modal tracks which attachment is open via local state (`selectedAttachmentId`).

**Afflictions section:**

```
── AFFLICTIONS ──────────────────────────────────

  ✕ Bruised Ribs                        MUNDANE    ← clickable, hover tooltip
  -Iron (minor) · wound
  ████████░░░░░░  8 ticks remaining

  ✦ Sun-Touched                         MUNDANE    ← clickable, hover tooltip
  +Star (minor) · blessing
  ██████░░░░░░░░  6 ticks remaining
```

Same layout as possessions, with duration bar added. The bar uses ProgressBar at a slightly wider width than the sidebar version (~200px). Click and hover behavior identical.

**Gifts & Burdens section:**

```
── GIFTS & BURDENS ──────────────────────────────

  ⟡ Turn Undead                         STORIED    ← clickable, hover tooltip
  "The god's light burns in your palms."
  Granted by Solhaven, the Undying Flame
  +Star · divine · spirit

  ⚖ The Seven-Task Bargain               MYTHIC    ← clickable, hover tooltip
  "Service in exchange for power."
  Bound to Ixaroth, Keeper of Debts
  +Veil, -Star · dark pact · binding
```

Powers show their divine source. Agreements show the counterparty name and agreement type. Click opens the full detail view with trigger descriptions, full tag list, and source provenance.

**Visual affordances for clickability:**

Vignette names use tier-colored text with a subtle underline-on-hover (not permanent underline — only on hover). Cursor changes to pointer. This is consistent with how bond names in the existing Bonds section are interactive. The entire vignette block is the click target, not just the name — prevents missed clicks on small text.

**Interaction with existing Traits section:**

Condition traits (category: `condition`) and bestowed traits (category: `bestowed`) should be **excluded from the existing Traits section** to avoid duplication. The Traits section continues to show innate, mastery, reputation, scar, destiny, and cultural traits. Conditions and bestowed powers render in their dedicated attachment sections instead.

```ts
// In getAgentFullProfile() — filter traits for Traits section:
const displayTraits = allTraits.filter(
  t => t.category !== 'condition' && t.category !== 'bestowed'
);
```

---

### Data Aggregator Changes

Both views need attachment data from the engine. Add to the existing data aggregators:

**AgentInfoCardData (Tier 2):**
```ts
// Add these fields:
possessions?: AttachmentSummary[];      // intimate+
conditions?: AttachmentSummary[];       // recognised+
powersAndAgreements?: AttachmentSummary[];  // intimate+
```

**AgentFullProfileData (Tier 3):**
```ts
// Add these fields:
possessions?: AttachmentFullEntry[];     // intimate+
afflictions?: AttachmentFullEntry[];     // recognised+
giftsAndBurdens?: AttachmentFullEntry[]; // intimate+
```

**Type definitions:**
```ts
interface AttachmentSummary {
  id: string;
  name: string;
  subcategory: string;
  tier: AttachmentTier;
  mechanicalSummary: string;
  ticksRemaining?: number | null;
  totalTicks?: number;
  durationLabel?: string;
}

interface AttachmentFullEntry extends AttachmentSummary {
  flavorText?: string;
  tags: string[];
  source?: string;
  lossCondition?: string;
  grantedBy?: string;        // divine source (powers) or counterparty (agreements)
  agreementType?: string;     // pact, debt, oath, etc.
  onUseTriggers?: OnUseTrigger[];
  image?: string;
}
```

**Graph walk for attachments:**
```ts
function getAgentAttachments(graph: WorldGraph, agentId: string): {
  possessions: AttachmentFullEntry[];
  conditions: AttachmentFullEntry[];
  powers: AttachmentFullEntry[];
  agreements: AttachmentFullEntry[];
} {
  // Walk possesses/bonded_to edges → possessions
  // Walk has_trait edges where category='condition' → conditions
  // Walk has_trait edges where category='bestowed' → powers
  // Walk relates_to edges with agreement property → agreements
  // Sort each: tier desc, name asc
}
```

---

### Where Inline Rows Appear (Summary)

| Location | What's shown | Display style | Knowledge gate |
|----------|-------------|---------------|----------------|
| AgentDetailPanel (Tier 2) — Possessions | Agent's possessions | AttachmentRow (compact) | intimate+ |
| AgentDetailPanel (Tier 2) — Conditions | Active conditions/blessings/curses | AttachmentRow with duration bar | recognised+ |
| AgentDetailPanel (Tier 2) — Powers & Agreements | Bestowed powers + agreements | AttachmentRow (compact) | intimate+ |
| AgentProfileModal (Tier 3) — Possessions | Agent's possessions | Prose vignette with flavor text | intimate+ |
| AgentProfileModal (Tier 3) — Afflictions | Active conditions | Prose vignette with duration bar | recognised+ |
| AgentProfileModal (Tier 3) — Gifts & Burdens | Powers + agreements with sources | Prose vignette with source/counterparty | intimate+ |
| EntityCard (faction) | Faction-level agreements | AttachmentRow | N/A (faction view) |
| HexChronicle "The People" | Notable items on spotlight agents | Inline mention in prose | N/A (location view) |

### Sidebar Navigation

Clicking an attachment row → push "attachment detail" onto the sidebar stack. Back button → pop back to previous view (agent detail, entity card, etc.). This follows the existing Tier 1 → Tier 2 → Tier 3 progressive disclosure pattern.

**Sidebar stack becomes:**
```
RetinuePanel → AgentDetailPanel → AttachmentDetail (EntityCard)
    or
HexChronicle → AgentDetailPanel → AttachmentDetail (EntityCard)
```

### Tooltip Registration

Add attachment tooltip resolution to the existing tooltip concept system. When an attachment node ID is referenced in prose or UI, the Tooltip component resolves it through the attachment resolver.

```ts
// In tooltipResolver.ts — add a branch:
if (nodeType === 'artifact' || nodeType === 'artifact_legendary') {
  return resolveAttachmentTooltip(graph, nodeId);
}
```

---

## Animations

| Trigger | Animation | Existing? |
|---------|-----------|-----------|
| Attachment row appears in list | `anim-fade-up` staggered | Yes (chronicle layers) |
| Expanded card opens | `anim-fade` via AnimateMount | Yes |
| Tier 4 left border pulse | `pulse-gold` | Yes |
| Condition expires (duration → 0) | `anim-fade` exit + row removal | Yes |
| New attachment acquired | `pulse-gold` on the new row | Yes |
| Hover tooltip | Tooltip's existing delay + fade | Yes |

**No new CSS keyframes needed.** All animations reuse existing patterns from ui-patterns.md sections 12-13.

---

## Accessibility

- **Inline rows:** `role="button"`, `tabIndex={0}`, `aria-label` includes name + tier + category.
- **Tooltip:** Existing Tooltip accessibility (role="tooltip", aria-describedby, Escape dismisses).
- **Expanded card:** EntityCard's existing keyboard navigation (Back button, Escape to close).
- **Duration bar:** ProgressBar's existing `aria-valuenow`/`aria-valuemin`/`aria-valuemax`.
- **Tier announcement:** When a Legendary (tier 4) attachment is acquired, the ARIA live region in the narrative log announces it.
- **Tag pills:** Not interactive — decorative only. No `role="button"` or `tabIndex`.

---

## Empty States

Following Pattern 14 from ui-patterns.md:

| Context | Empty text |
|---------|-----------|
| Agent has no possessions | "They carry nothing of note." |
| Agent has no conditions | "Neither blessed nor cursed — for now." |
| Agent has no bestowed powers | "No divine gifts mark this soul." |
| Agent has no agreements | "Unburdened by oath or debt." |

Styled: `--text-tertiary`, italic, `animate-breathe`.

---

## Implementation Plan

### Task Breakdown (TDD, 6 tasks)

**Task 1: Glyph Lookup Table + Tier Color Helpers**
- New file: `src/components/Game/attachmentGlyphs.ts`
- Exports: `SUBCATEGORY_GLYPHS: Record<string, string>`, `getAttachmentGlyph(subcategory: string): string`
- Reuses: `ATTACHMENT_TIER_COLORS`, `ATTACHMENT_TIER_NAMES` from `src/types/attachments.ts`
- Tests: glyph lookup for each subcategory, fallback for unknown subcategory
- **Size:** ~30 lines + ~20 lines tests

**Task 2: AttachmentRow Component (Inline Mode)**
- New file: `src/components/Game/AttachmentRow.tsx`
- Composes: SoulCard layout pattern, ProgressBar, glyph lookup, tier color lookup
- Props: see AttachmentRowProps above
- Tests: renders name, glyph, tier border color, duration bar presence/absence, click handler, tier 4 pulse class, keyboard interaction
- **Size:** ~80 lines + ~60 lines tests

**Task 3: Attachment Tooltip Resolver**
- Modify: `src/engine/tooltipResolver.ts` (or wherever tooltip resolution lives)
- Add: `resolveAttachmentTooltip(graph, nodeId)` branch for artifact/trait nodes
- Returns: `{ label, desc }` with formatted mechanical summary + trigger summary
- Tests: format output for possession, condition, agreement; trigger summary formatting; missing data fallbacks
- **Size:** ~40 lines + ~30 lines tests

**Task 4: Trigger Block Renderer for EntityCard**
- Modify: `src/components/shared/EntityCard.tsx` — add `trigger` block type to structured data renderer
- Renders: condition + probability header, italic narrative template, mechanical effect summary
- Tests: renders trigger block correctly, handles missing narrative template
- **Size:** ~25 lines + ~20 lines tests

**Task 5: AttachmentDetailView (Expanded Mode)**
- New file: `src/components/Game/AttachmentDetailView.tsx`
- Composes: EntityCard with attachment-specific header + sections mapping
- Includes: art slot (image or glyph fallback), all section renderers, empty state handling
- Props: `attachment: AttachmentData`, `onBack`, `onViewCodex?`
- Tests: renders all sections, art fallback, conditional sections (duration, triggers, source), empty sections omitted
- **Size:** ~120 lines + ~80 lines tests

**Task 6: Data Aggregator — getAgentAttachments()**
- New file: `src/engine/agentAttachments.ts`
- Exports: `getAgentAttachments(graph, agentId)` — walks edges, returns sorted `{ possessions, conditions, powers, agreements }`
- Exports: `AttachmentSummary`, `AttachmentFullEntry` types (or add to `src/types/attachments.ts`)
- Modify: `src/engine/agentDetail.ts` — call `getAgentAttachments()` and populate new fields on `AgentInfoCardData` and `AgentFullProfileData`, gated by knowledge level
- Tests: returns correct attachments for each category, sorts by tier desc + name asc, respects knowledge gating, handles agents with no attachments
- **Size:** ~80 lines + ~50 lines tests

**Task 7: AgentDetailPanel Integration (Tier 2 Sidebar)**
- Modify: `src/components/Game/AgentDetailPanel.tsx` — add three attachment sections (Possessions, Conditions, Powers & Agreements) after Bonds, before Disposition
- Each section: header + list of AttachmentRow components + empty state
- Max 5 rows per section with "and N more…" overflow link
- Modify: `useAgentInteraction.ts` — add attachment detail state to sidebar navigation stack
- Tests: attachment sections render in correct position, knowledge gating hides sections appropriately, empty states display, overflow "and N more" link, clicking row opens detail view
- **Size:** ~80 lines modifications + ~60 lines tests

**Task 8: AgentProfileModal Integration (Tier 3 Character Sheet)**
- Modify: `src/components/Game/AgentProfileModal.tsx` — add three attachment sections (Possessions, Afflictions, Gifts & Burdens) after Traits, before Origin
- Each section: prose vignette style (glyph + name + flavor text + mechanical summary) with interactive behavior:
  - Hover: Tooltip on each vignette name (uses attachment tooltip resolver from Task 3)
  - Click: Opens AttachmentDetailView as slide-in overlay within modal (not sidebar)
  - Back/Escape: Returns to character sheet, preserving scroll position
- Add local state: `selectedAttachmentId` to track which detail view is open
- Wrap vignette names in `<Tooltip>` with attachment resolver
- Use AnimateMount (`anim-fade`) for detail view slide-in/out transition
- Modify: existing Traits section — filter out `condition` and `bestowed` traits to avoid duplication
- Tests: attachment sections render in correct position with prose style, clicking vignette opens detail overlay, back button returns to sheet, hover shows tooltip, traits section excludes condition/bestowed, knowledge gating, empty states, flavor text presence/absence, Escape closes detail view
- **Size:** ~130 lines modifications + ~80 lines tests

### Total Estimate
- **New code:** ~375 lines across 4 new files
- **Modified code:** ~295 lines across 5 existing files
- **Tests:** ~440 lines across 8 test files
- **New CSS:** 0 lines (all animations/styles reuse existing patterns)

---

## What This Design Does NOT Cover

Deferred to separate design passes:
- **Subcategory SVG icons** — the glyph system is the MVP. SVG silhouette icons can replace glyphs later without changing any component structure.
- **Reward pool UI** (god nudge panel) — separate design, separate interaction model.
- **Image generation pipeline** — art is optional; cards work without it.
- **Orchestrator wiring** — connecting `conditionDecay` and `assembleRewardPool` to the tick loop is engine work, not UI.
- **Codex entry view** — the "View Full Codex Entry" footer button is a placeholder; linking to Obsidian vault entries is a future integration.

---

## Rejected Alternatives

- ❌ **New card component from scratch** — EntityCard already handles the expanded view pattern perfectly. Building a parallel card system fragments the codebase.
- ❌ **Modal instead of sidebar** — attachments are contextual to the agent you're looking at. A modal breaks the spatial relationship. Sidebar push (like agent detail) keeps context.
- ❌ **Emoji icons** — emoji render inconsistently across platforms and look jarring in the Threadbare aesthetic. Unicode geometric/symbol glyphs are more controlled. SVG icons will replace them later.
- ❌ **Separate tooltip component** — the existing Tooltip already handles everything we need. A parallel "attachment tooltip" would duplicate positioning logic.
- ❌ **Separate duration component** — ProgressBar already exists and works. Wrapping it with tick-count text is sufficient.

---

## Change Audit

| Date | Where | What Changed | Why |
|------|-------|-------------|-----|
| 2026-03-16 | Docs/plans/ | Created attachment detail card UI design | Design session for attachment display across three progressive disclosure modes |
| 2026-03-16 | Docs/plans/ | Added agent view integration sections + tasks 6-8 | Specifying how attachments appear in AgentDetailPanel (Tier 2 sidebar) and AgentProfileModal (Tier 3 character sheet) |
| 2026-03-16 | Docs/plans/ | Made Tier 3 modal vignettes interactive | Added tooltip on hover + click-through to AttachmentDetailView overlay within modal, with back navigation and scroll preservation |
