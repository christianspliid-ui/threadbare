# Attachment Detail Card — Implementation Plan

**Date:** 2026-03-16
**Status:** Ready for implementation
**Design doc:** `Docs/plans/2026-03-16-attachment-detail-card-design.md`
**Prerequisite:** `Docs/plans/2026-03-16-placeholder-attachments-plan.md` (seed agents need attachment edges first)

---

## Overview

8 tasks, TDD, building from data layer up to UI integration. Each task is independently testable. Tasks 1-5 are pure additions (no existing files modified). Tasks 6-8 modify existing files.

**Key design references before starting:**
- `Docs/plans/2026-03-16-attachment-detail-card-design.md` — full design with ASCII mockups
- `Docs/ui-patterns.md` — established component patterns (especially sections 2, 5, 10, 12, 14, Accessibility Baseline)
- `STYLE.md` — tier colors, target resolution (1920×1080)

**Accessibility rule (new):** All clickable text must be underlined per ui-patterns.md Accessibility Baseline. This applies to attachment names in both sidebar rows and character sheet vignettes.

---

## Task 1: Glyph Lookup Table + Tier Helpers

**New file:** `src/components/Game/attachmentGlyphs.ts`

Create a module-level `Record<string, string>` for subcategory → glyph mapping, following Pattern 10 (Glyph and Color Lookup Tables) from ui-patterns.md.

**Exports:**
```ts
export const SUBCATEGORY_GLYPHS: Record<string, string> = {
  // Possessions
  arms: '⚔',                    // U+2694
  mounts_beasts: '◈',           // U+25C8 (diamond with dot — simpler than emoji horse)
  vestments: '◇',               // U+25C7
  tomes_scrolls: '📜',          // U+1F4DC
  relics_talismans: '◆',        // U+25C6
  tools_instruments: '⚒',       // U+2692
  provisions: '⊕',              // U+2295
  // Conditions
  wound: '✕',                   // U+2715
  disease: '☠',                 // U+2620
  blessing: '✦',                // U+2726
  curse: '⊘',                   // U+2298
  magical: '✦',                 // U+2726 (same as blessing — differentiated by tier color)
  // Other
  bestowed: '⟡',               // U+27E1
  pact: '⛓',                   // U+26D3
  oath: '⛓',                   // U+26D3
  debt: '⚖',                   // U+2696
  favour: '⚖',                 // U+2696
  retainer: '♟',               // U+265F
};

const FALLBACK_GLYPH = '◈';     // U+25C8

export function getAttachmentGlyph(subcategory: string): string {
  return SUBCATEGORY_GLYPHS[subcategory] ?? FALLBACK_GLYPH;
}
```

Also re-export from this file for convenience:
```ts
export { ATTACHMENT_TIER_COLORS, ATTACHMENT_TIER_NAMES } from '../../types/attachments';
```

**Tests:** `src/components/Game/__tests__/attachmentGlyphs.test.ts`
- Every subcategory key returns a non-empty string
- Unknown subcategory returns fallback glyph
- `getAttachmentGlyph` function works for known and unknown keys
- All glyph values are single characters or single emoji

**Size:** ~40 lines source + ~25 lines tests

---

## Task 2: AttachmentRow Component (Inline Mode)

**New file:** `src/components/Game/AttachmentRow.tsx`

Compact row for the sidebar. Follows SoulCard layout pattern (left border accent, name + metadata in a raised box).

**Props:**
```ts
interface AttachmentRowProps {
  name: string;
  subcategory: string;
  tier: AttachmentTier;
  mechanicalSummary: string;
  ticksRemaining?: number | null;
  totalTicks?: number;
  durationLabel?: string;       // "permanent", "until dispelled"
  tooltipLabel?: string;        // for Tooltip component
  tooltipDesc?: string;         // for Tooltip component
  onClick?: () => void;
}
```

**Structure:**
```tsx
<Tooltip label={tooltipLabel} desc={tooltipDesc}>
  <div
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={handleKeyDown}     // Enter/Space → onClick
    onMouseEnter={handleHoverIn}  // bg-hover (Pattern 5)
    onMouseLeave={handleHoverOut} // bg-raised
    style={{
      backgroundColor: 'var(--bg-raised)',
      borderLeft: `3px solid ${ATTACHMENT_TIER_COLORS[tier]}`,
      borderRadius: '6px',
      padding: '0.5rem 0.75rem',
      cursor: 'pointer',
      transition: 'background-color 0.15s',
    }}
    aria-label={`${name}, ${ATTACHMENT_TIER_NAMES[tier]} ${subcategory}`}
  >
    {/* Row 1: glyph + name + tier label */}
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
      <span>{getAttachmentGlyph(subcategory)}</span>
      <span style={{
        color: ATTACHMENT_TIER_COLORS[tier],
        fontFamily: 'var(--font-display)',
        textDecoration: 'underline',           // accessibility: clickable text
      }}>
        {name}
      </span>
      <span style={{
        marginLeft: 'auto',
        color: 'var(--text-tertiary)',
        fontSize: 'var(--text-xs)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        {ATTACHMENT_TIER_NAMES[tier]}
      </span>
    </div>

    {/* Row 2: mechanical summary */}
    <div style={{
      color: 'var(--text-secondary)',
      fontStyle: 'italic',
      fontSize: 'var(--text-xs)',
      paddingLeft: '1.5rem',  // align under name, past glyph
    }}>
      {mechanicalSummary}
    </div>

    {/* Row 3: duration bar (conditional) */}
    {ticksRemaining != null && totalTicks != null && totalTicks > 0 ? (
      <div style={{ paddingLeft: '1.5rem', paddingTop: '0.25rem' }}>
        <ProgressBar
          progress={ticksRemaining / totalTicks}
          color={ATTACHMENT_TIER_COLORS[tier]}
          glow={false}
          className="h-1"
        />
      </div>
    ) : durationLabel ? (
      <div style={{
        paddingLeft: '1.5rem',
        color: 'var(--text-tertiary)',
        fontStyle: 'italic',
        fontSize: 'var(--text-xs)',
      }}>
        {durationLabel}
      </div>
    ) : null}
  </div>
</Tooltip>
```

**Special cases:**
- Tier 4 (Legendary): Add `className={tier === 4 ? 'pulse-gold' : ''}` to the left border element (or the container). Reuses existing `pulse-gold` keyframe.
- Wrap in `React.memo` (Pattern: Performance Conventions — component rendered inside a list).

**Tests:** `src/components/Game/__tests__/AttachmentRow.test.ts`
- Renders name, glyph for subcategory, tier label
- Left border color matches ATTACHMENT_TIER_COLORS[tier]
- Name text is underlined (accessibility)
- Duration bar appears when ticksRemaining + totalTicks provided
- Duration bar absent when ticksRemaining is null
- durationLabel text appears when provided (no bar)
- onClick fires on click
- onClick fires on Enter/Space keydown
- Tier 4 gets pulse-gold class
- aria-label includes name, tier name, subcategory
- Tooltip wraps the component (check for tooltip props)

**Size:** ~90 lines source + ~70 lines tests

---

## Task 3: Attachment Tooltip Resolver

**Modify:** `src/engine/tooltipResolver.ts` (or the file where tooltip concept resolution lives)

Add a branch that resolves attachment nodes (artifact, artifact_legendary, trait with category condition/bestowed) into tooltip label + description.

**Function:**
```ts
export function resolveAttachmentTooltip(
  graph: WorldGraph,
  nodeId: string
): { label: string; desc: string } | null {
  const node = graph.getNode(nodeId);
  if (!node) return null;

  const props = node.properties;
  const tierName = ATTACHMENT_TIER_NAMES[props.tier] ?? '';
  const label = `${getAttachmentGlyph(props.subcategory)} ${props.name}`;

  // Build description lines
  const lines: string[] = [];
  lines.push(props.mechanicalSummary);

  // Duration (for conditions)
  const edges = graph.getEdges(nodeId);
  const traitEdge = edges.find(e => e.type === 'has_trait');
  if (traitEdge?.properties?.ticksRemaining != null) {
    lines.push(`${traitEdge.properties.ticksRemaining} ticks remaining`);
  }

  // Loss condition (for possessions)
  if (props.lossCondition) {
    lines.push(`Loss: ${props.lossCondition}`);
  }

  // Most dramatic trigger (highest probability or most impactful)
  if (props.onUseTriggers?.length) {
    const trigger = props.onUseTriggers.reduce((best, t) =>
      t.probability > best.probability ? t : best
    );
    lines.push(`⚡ ${Math.round(trigger.probability * 100)}% chance: ${trigger.triggerCondition}`);
  }

  return { label, desc: lines.join('\n') };
}
```

**Integration:** In the existing tooltip resolver's dispatch logic, add:
```ts
if (node.type === 'artifact' || node.type === 'artifact_legendary') {
  return resolveAttachmentTooltip(graph, nodeId);
}
if (node.type === 'trait' && (node.properties.category === 'condition' || node.properties.category === 'bestowed')) {
  return resolveAttachmentTooltip(graph, nodeId);
}
```

**Tests:** `src/engine/__tests__/attachmentTooltipResolver.test.ts`
- Resolves possession node → label has glyph + name, desc has mechanical summary + loss condition
- Resolves condition node → desc includes ticks remaining
- Resolves node with triggers → desc includes trigger summary line
- Returns null for unknown node ID
- Returns null for non-attachment node types
- Handles missing optional fields gracefully (no lossCondition, no triggers, no ticksRemaining)

**Size:** ~50 lines source + ~40 lines tests

---

## Task 4: Trigger Block Renderer for EntityCard

**Modify:** `src/components/shared/EntityCard.tsx`

Add a new structured block type `trigger` to the block renderer switch statement. Follows the existing block renderer pattern.

**Find** the block renderer function (likely a switch on `block.type` inside the structured section renderer). Add a case:

```tsx
case 'trigger': {
  const t = block.trigger as OnUseTrigger;
  return (
    <div key={idx} style={{ marginBottom: '0.5rem' }}>
      {/* Header: condition + probability */}
      <div style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
        ⚡ {t.triggerCondition.replace('_', ' ')} ({Math.round(t.probability * 100)}%)
      </div>
      {/* Narrative template */}
      {t.narrativeTemplate && (
        <div style={{
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
          fontSize: 'var(--text-xs)',
          paddingLeft: '1rem',
          marginTop: '0.15rem',
        }}>
          "{t.narrativeTemplate}"
        </div>
      )}
    </div>
  );
}
```

**Import:** `OnUseTrigger` from `src/types/attachments.ts`.

**Tests:** `src/components/shared/__tests__/EntityCard.trigger-block.test.ts`
- Trigger block renders condition name and probability
- Trigger block renders narrative template in italics
- Trigger block handles missing narrative template (no crash, no empty quotes)
- Probability displays as percentage (0.25 → "25%")
- Trigger condition underscores replaced with spaces

**Size:** ~25 lines source + ~25 lines tests

---

## Task 5: AttachmentDetailView (Expanded Sidebar Card)

**New file:** `src/components/Game/AttachmentDetailView.tsx`

Composes EntityCard with attachment-specific header and sections. This is the full detail view opened when clicking an AttachmentRow (sidebar) or a vignette (modal).

**Props:**
```ts
interface AttachmentDetailViewProps {
  attachment: AttachmentFullEntry;
  onBack: () => void;
  onViewCodex?: () => void;
}
```

**Implementation:** Map `AttachmentFullEntry` to EntityCard's `EntityHeader` + `EntitySection[]`. See the design doc's "Structure (composes EntityCard)" section for the full mapping. Key points:

- **Header:** `{ name, subtitle: '${tierName} · ${subcategoryLabel}', accentColor: ATTACHMENT_TIER_COLORS[tier] }`
- **Sections (in order, all conditional except Effect and Tags):**
  1. Art slot — image if present, else glyph at 3rem centered in `bg-deep` box
  2. Flavor text — prose section, italic
  3. Effect — mechanicalSummary + grants keyword cloud + loss condition
  4. Duration — ProgressBar + tick count (only if ticksRemaining != null)
  5. Tags — keyword_cloud block
  6. Triggers — trigger blocks (only if onUseTriggers.length > 0)
  7. Source — text block (only if source exists)
- **Footer:** "View Full Codex Entry" button (calls onViewCodex, or disabled placeholder if not provided)

**Art fallback:** When no image, render glyph in a centered box:
```tsx
<div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '120px',
  backgroundColor: 'var(--bg-deep)',
  borderRadius: '6px',
  border: '1px solid var(--border-subtle)',
}}>
  <span style={{
    fontSize: '3rem',
    color: ATTACHMENT_TIER_COLORS[tier],
    opacity: 0.4,
  }}>
    {getAttachmentGlyph(subcategory)}
  </span>
</div>
```

**Tests:** `src/components/Game/__tests__/AttachmentDetailView.test.ts`
- Renders header with name, tier name, subcategory
- Header accent color matches tier
- Renders flavor text when present, omits when absent
- Renders mechanical summary in Effect section
- Renders grants as keyword cloud when present
- Renders duration bar when ticksRemaining provided
- Omits duration section when ticksRemaining is null
- Renders tag pills
- Renders trigger blocks when triggers present
- Omits triggers section when no triggers
- Renders source when present
- Art fallback: shows glyph when no image
- Back button calls onBack
- Codex button calls onViewCodex when provided

**Size:** ~130 lines source + ~90 lines tests

---

## Task 6: Data Aggregator — getAgentAttachments()

**New file:** `src/engine/agentAttachments.ts`

Pure function that walks the graph and returns categorized, sorted attachment data for an agent.

**Exports:**
```ts
export interface AttachmentSummary {
  id: string;
  name: string;
  subcategory: string;
  tier: AttachmentTier;
  mechanicalSummary: string;
  ticksRemaining?: number | null;
  totalTicks?: number;
  durationLabel?: string;
}

export interface AttachmentFullEntry extends AttachmentSummary {
  flavorText?: string;
  tags: string[];
  source?: string;
  lossCondition?: string;
  grantedBy?: string;
  agreementType?: string;
  onUseTriggers?: OnUseTrigger[];
  image?: string;
}

export function getAgentAttachments(
  graph: WorldGraph,
  agentId: string
): {
  possessions: AttachmentFullEntry[];
  conditions: AttachmentFullEntry[];
  powers: AttachmentFullEntry[];
  agreements: AttachmentFullEntry[];
}
```

**Logic:**
1. Get all outgoing edges from agent node
2. Filter by edge type:
   - `possesses` / `bonded_to` → look up target node → possessions
   - `has_trait` where target node category is `condition` → conditions
   - `has_trait` where target node category is `bestowed` → powers
   - `relates_to` with `agreement` property → agreements
3. For each edge, build an `AttachmentFullEntry` from the target node properties + edge properties
4. Sort each array: tier descending, then name ascending
5. Return all four arrays

**Modify:** `src/engine/agentDetail.ts`
- Import `getAgentAttachments`
- In `getAgentInfoCard()`: call it, populate `possessions` (intimate+), `conditions` (recognised+), `powersAndAgreements` (intimate+) as `AttachmentSummary[]` (strip full entry down to summary)
- In `getAgentFullProfile()`: call it, populate `possessions`, `afflictions`, `giftsAndBurdens` as `AttachmentFullEntry[]` with the same knowledge gating

**Tests:** `src/engine/__tests__/agentAttachments.test.ts`
- Returns empty arrays for agent with no attachments
- Returns possessions from `possesses` edges
- Returns possessions from `bonded_to` edges
- Returns conditions from `has_trait` edges with condition category
- Returns powers from `has_trait` edges with bestowed category
- Does NOT return innate/mastery/reputation traits
- Returns agreements from `relates_to` edges with agreement property
- Sorts by tier descending, then name ascending
- Populates ticksRemaining from edge properties
- Populates flavorText from node properties
- Populates onUseTriggers from node properties

**Additional tests in existing agentDetail test file:**
- `getAgentInfoCard` includes attachment fields at correct knowledge levels
- `getAgentInfoCard` omits attachment fields below knowledge threshold
- `getAgentFullProfile` includes attachment fields

**Size:** ~90 lines source + ~70 lines tests

---

## Task 7: AgentDetailPanel Integration (Tier 2 Sidebar)

**Modify:** `src/components/Game/AgentDetailPanel.tsx`

Add three attachment sections after Bonds (line ~261), before Disposition (line ~263).

**Section pattern (repeat for each):**
```tsx
{/* Possessions — intimate+ */}
{detail.knowledgeLevel >= KNOWLEDGE_LEVELS.intimate && (
  <div>
    <h3 style={{
      color: 'var(--text-tertiary)',
      fontSize: 'var(--text-xs)',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginBottom: '0.5rem',
    }}>
      Possessions
    </h3>
    {detail.possessions?.length ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {detail.possessions.slice(0, 5).map(att => (
          <AttachmentRow
            key={att.id}
            name={att.name}
            subcategory={att.subcategory}
            tier={att.tier}
            mechanicalSummary={att.mechanicalSummary}
            ticksRemaining={att.ticksRemaining}
            totalTicks={att.totalTicks}
            durationLabel={att.durationLabel}
            tooltipLabel={`${getAttachmentGlyph(att.subcategory)} ${att.name}`}
            tooltipDesc={att.mechanicalSummary}
            onClick={() => handleAttachmentClick(att.id)}
          />
        ))}
        {detail.possessions.length > 5 && (
          <p style={{
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-xs)',
            fontStyle: 'italic',
            textAlign: 'center',
          }}>
            and {detail.possessions.length - 5} more…
          </p>
        )}
      </div>
    ) : (
      <p className="italic animate-breathe" style={{
        color: 'var(--text-tertiary)',
        textAlign: 'center',
      }}>
        They carry nothing of note.
      </p>
    )}
  </div>
)}
```

Repeat for:
- **Conditions** (recognised+ knowledge) — empty: "Neither blessed nor cursed — for now."
- **Powers & Agreements** (intimate+ knowledge) — combine `powersAndAgreements` array — empty: "Unburdened by oath or gift."

**Sidebar navigation for click-through:**

Modify `useAgentInteraction.ts` (or the relevant sidebar state hook):
- Add state: `selectedAttachmentId: string | null`
- Add handler: `handleAttachmentClick(id: string)` → sets selectedAttachmentId
- Add handler: `handleAttachmentBack()` → clears selectedAttachmentId
- In sidebar rendering: when `selectedAttachmentId` is set, render `<AttachmentDetailView>` instead of `<AgentDetailPanel>`, with `onBack={handleAttachmentBack}`

Wrap transition in `<AnimateMount show={!!selectedAttachmentId} animation="anim-fade" duration={200}>`.

**Tests:** `src/components/Game/__tests__/AgentDetailPanel.attachments.test.ts`
- Possessions section renders after Bonds, before Disposition
- Conditions section renders at recognised+ knowledge
- Possessions section hidden below intimate knowledge
- Empty state text renders for each section when no attachments
- Max 5 rows shown, overflow text appears for 6+ items
- Clicking a row calls handleAttachmentClick with correct ID
- AttachmentDetailView renders when selectedAttachmentId is set
- Back button in detail view clears selectedAttachmentId

**Size:** ~100 lines modifications + ~70 lines tests

---

## Task 8: AgentProfileModal Integration (Tier 3 Character Sheet)

**Modify:** `src/components/Game/AgentProfileModal.tsx`

Add three attachment sections after Traits (line ~257), before Origin (line ~259). Use narrative section names: "Possessions", "Afflictions", "Gifts & Burdens".

**Vignette component (inline, not separate file — small enough):**

```tsx
function AttachmentVignette({
  attachment,
  onClick,
}: {
  attachment: AttachmentFullEntry;
  onClick: () => void;
}) {
  return (
    <Tooltip
      label={`${getAttachmentGlyph(attachment.subcategory)} ${attachment.name}`}
      desc={[
        attachment.mechanicalSummary,
        attachment.lossCondition ? `Loss: ${attachment.lossCondition}` : '',
        attachment.onUseTriggers?.length
          ? `⚡ ${Math.round(attachment.onUseTriggers[0].probability * 100)}% chance: ${attachment.onUseTriggers[0].triggerCondition.replace('_', ' ')}`
          : '',
      ].filter(Boolean).join('\n')}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
        style={{ cursor: 'pointer', marginBottom: '0.75rem' }}
        aria-label={`${attachment.name}, ${ATTACHMENT_TIER_NAMES[attachment.tier]} ${attachment.subcategory}`}
      >
        {/* Header: glyph + name (underlined) + tier */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span>{getAttachmentGlyph(attachment.subcategory)}</span>
          <span style={{
            color: ATTACHMENT_TIER_COLORS[attachment.tier],
            fontFamily: 'var(--font-display)',
            textDecoration: 'underline',
          }}>
            {attachment.name}
          </span>
          <span style={{
            marginLeft: 'auto',
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            {ATTACHMENT_TIER_NAMES[attachment.tier]}
          </span>
        </div>

        {/* Flavor text (optional) */}
        {attachment.flavorText && (
          <div style={{
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
            fontSize: 'var(--text-xs)',
            paddingLeft: '1.5rem',
            marginTop: '0.15rem',
          }}>
            "{attachment.flavorText}"
          </div>
        )}

        {/* Granted by / bound to (for powers and agreements) */}
        {attachment.grantedBy && (
          <div style={{
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-xs)',
            paddingLeft: '1.5rem',
          }}>
            {attachment.agreementType
              ? `Bound to ${attachment.grantedBy}`
              : `Granted by ${attachment.grantedBy}`}
          </div>
        )}

        {/* Mechanical line: summary · tags · loss */}
        <div style={{
          color: 'var(--text-tertiary)',
          fontSize: 'var(--text-xs)',
          paddingLeft: '1.5rem',
          marginTop: '0.15rem',
        }}>
          {[
            attachment.mechanicalSummary,
            attachment.subcategory,
            attachment.lossCondition,
          ].filter(Boolean).join(' · ')}
        </div>

        {/* Duration bar (conditions only) */}
        {attachment.ticksRemaining != null && attachment.totalTicks != null && attachment.totalTicks > 0 && (
          <div style={{ paddingLeft: '1.5rem', paddingTop: '0.25rem', maxWidth: '200px' }}>
            <ProgressBar
              progress={attachment.ticksRemaining / attachment.totalTicks}
              color={ATTACHMENT_TIER_COLORS[attachment.tier]}
              glow={false}
              className="h-1"
            />
            <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
              {attachment.ticksRemaining} ticks remaining
            </span>
          </div>
        )}
      </div>
    </Tooltip>
  );
}
```

**Click-through overlay within the modal:**

Add local state to AgentProfileModal:
```ts
const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | null>(null);
const selectedAttachment = selectedAttachmentId
  ? [...(profile.possessions ?? []), ...(profile.afflictions ?? []), ...(profile.giftsAndBurdens ?? [])]
      .find(a => a.id === selectedAttachmentId)
  : null;
```

Render the detail overlay at the end of the modal's scroll container:
```tsx
<AnimateMount show={!!selectedAttachment} animation="anim-fade" duration={200}>
  {selectedAttachment && (
    <div style={{
      position: 'absolute',
      inset: 0,
      backgroundColor: 'var(--bg-surface)',
      zIndex: 10,
      overflow: 'auto',
    }}>
      <AttachmentDetailView
        attachment={selectedAttachment}
        onBack={() => setSelectedAttachmentId(null)}
      />
    </div>
  )}
</AnimateMount>
```

The detail view covers the modal content with `position: absolute; inset: 0`. Back button or Escape clears `selectedAttachmentId`, AnimateMount fades the overlay out, and the modal content beneath is still there at the same scroll position (never unmounted).

**Escape handling:** Add Escape listener when detail is open (same pattern as Pattern 4 — Popover Panels):
```ts
useEffect(() => {
  if (!selectedAttachmentId) return;
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();  // prevent closing the entire modal
      setSelectedAttachmentId(null);
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [selectedAttachmentId]);
```

**Filter existing Traits section:** In the traits rendering block, filter out conditions and bestowed:
```ts
const displayTraits = (profile.allTraits ?? []).filter(
  t => t.category !== 'condition' && t.category !== 'bestowed'
);
```

**Section rendering pattern:** Same for all three sections. Example for Possessions (intimate+):
```tsx
{knowledgeLevel >= KNOWLEDGE_LEVELS.intimate && (
  <section>
    <h3 style={{ /* section header style */ }}>Possessions</h3>
    {profile.possessions?.length ? (
      profile.possessions.map(att => (
        <AttachmentVignette
          key={att.id}
          attachment={att}
          onClick={() => setSelectedAttachmentId(att.id)}
        />
      ))
    ) : (
      <p className="italic animate-breathe" style={{ color: 'var(--text-tertiary)' }}>
        They carry nothing of note.
      </p>
    )}
  </section>
)}
```

Repeat for:
- **Afflictions** (recognised+) — empty: "Neither blessed nor cursed — for now."
- **Gifts & Burdens** (intimate+) — empty: "Unburdened by oath or gift."

**Tests:** `src/components/Game/__tests__/AgentProfileModal.attachments.test.ts`
- Possessions section renders after Traits, before Origin
- Afflictions section renders at recognised+ knowledge
- Gifts & Burdens section renders at intimate+ knowledge
- Sections hidden below knowledge threshold
- Vignettes render name (underlined), glyph, tier label
- Vignettes render flavor text when present, omit when absent
- Vignettes render grantedBy for powers
- Vignettes render duration bar for conditions
- Hover shows tooltip (Tooltip component wraps vignette)
- Click on vignette sets selectedAttachmentId
- AttachmentDetailView overlay renders when selectedAttachmentId set
- Back button clears selectedAttachmentId
- Escape clears selectedAttachmentId (without closing modal)
- Existing Traits section excludes condition and bestowed categories
- Empty state text renders for each section

**Size:** ~150 lines modifications + ~90 lines tests

---

## Task Dependency Order

```
Task 1 (glyphs)
  ↓
Task 2 (AttachmentRow)  ←  Task 3 (tooltip resolver)
  ↓                          ↓
Task 4 (trigger block)  Task 6 (data aggregator)
  ↓                          ↓
Task 5 (detail view)    Task 7 (sidebar integration)
  ↓                          ↓
  └──── Task 8 (modal integration) ────┘
```

Tasks 1-4 can be done in parallel after Task 1. Tasks 5-6 can be done in parallel. Tasks 7-8 depend on 2, 3, 5, 6 all being complete.

---

## Total Estimate

- **New files:** 4 (`attachmentGlyphs.ts`, `AttachmentRow.tsx`, `agentAttachments.ts`, `AttachmentDetailView.tsx`)
- **Modified files:** 5 (`tooltipResolver.ts`, `EntityCard.tsx`, `agentDetail.ts`, `AgentDetailPanel.tsx`, `AgentProfileModal.tsx`)
- **New code:** ~400 lines
- **Modified code:** ~300 lines
- **Tests:** ~480 lines across 8 test files
- **New CSS:** 0 lines

---

## Verification Checklist (after all tasks complete)

1. Run `npm test` — all existing + new tests pass
2. Run `npx tsc --noEmit` — no type errors
3. Run `npx vite build` — production build succeeds
4. Manual check at 1920×1080:
   - Click agent in retinue → sidebar shows attachment sections
   - Hover attachment row → tooltip with effect summary
   - Click attachment row → detail view slides in with back navigation
   - Double-click agent → character sheet shows attachment vignettes
   - Hover vignette name → tooltip
   - Click vignette → detail overlay within modal
   - Escape closes detail overlay (not the modal)
   - Back button returns to character sheet at correct scroll position
   - Empty states display for agents with no attachments
   - Tier 4 items pulse gold
   - All clickable attachment names are underlined
