# UI Primitives — Component Library Specification

**Read this when:** building new UI, adopting primitives in existing components, or deciding which primitive to use for a given UI need.

This file is the **spec** for the shared component library in `src/components/shared/`. Each primitive has a fixed API. Agents must use these primitives instead of writing one-off button/card/modal/list implementations.

---

## Inventory

| Primitive | File | Status | Purpose |
|-----------|------|--------|---------|
| `SectionHeading` | `SectionHeading.tsx` | Built | Panel/section label |
| `Button` | `Button.tsx` | Built | All interactive buttons |
| `IconButton` | `IconButton.tsx` | Built | 32×32 icon-only toolbar buttons |
| `ListRow` | `ListRow.tsx` | Built | Universal interactive list row |
| `Card` | `Card.tsx` | Built | Panel/card wrapper with header |
| `Modal` | `Modal.tsx` | Built | Overlay dialog with backdrop |
| `Dropdown` | `Dropdown.tsx` | Built | Portal-positioned popover menu |

Build order matters — later primitives depend on earlier ones:
```
SectionHeading → Button → IconButton → ListRow → Card → Modal → Dropdown
```

---

## Existing Shared Components (keep, do not replace)

| Component | File | Notes |
|-----------|------|-------|
| `Tooltip` | `Tooltip.tsx` | Excellent. 30+ consumers. No changes needed. |
| `ProgressBar` | `ProgressBar.tsx` | Good. Used by DoomBar, MandateTracker, AttachmentRow. |
| `EntityCard` | `EntityCard.tsx` | Good. Will adopt `Card` internally in future. |
| `AnimateMount` | `AnimateMount.tsx` | Good. Used by `Modal` internally. |
| `SphereIcon` | `SphereIcon.tsx` | Good. Used everywhere. |
| `GameErrorBoundary` | `GameErrorBoundary.tsx` | Fine. Root wrapper only. |

---

## 1. SectionHeading

**Replaces:** `.section-heading` CSS class used with raw `<div>` or `<h3>` elements across all panels.

### API

```tsx
interface SectionHeadingProps {
  children: React.ReactNode;       // Label text (e.g. "Retinue")
  count?: number;                  // Optional count badge (e.g. 3) → renders as "(3)"
  as?: 'h2' | 'h3' | 'h4' | 'div'; // HTML element, default 'h3'
}
```

### Render

```html
<h3 class="section-heading">RETINUE (3)</h3>
```

### Styling
- Font: `--font-display`
- Size: `--text-xs`
- Weight: 700
- Color: `--text-tertiary`
- Transform: uppercase
- Letter-spacing: 0.12em

### Rules
- Always renders uppercase — never pass pre-uppercased text
- Count renders in parentheses, same style as label
- No margin — parent controls spacing

---

## 2. Button

**Replaces:** 50+ one-off `<button>` implementations with inline styles and manual hover handlers.

### API

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';      // default 'md'
  icon?: React.ReactNode;           // Leading icon (SphereIcon, emoji span, etc.)
  loading?: boolean;                 // Shows breathe animation, disables click
  fullWidth?: boolean;               // width: 100%
}
```

### Variants

| Variant | Background | Border | Text | Use |
|---------|-----------|--------|------|-----|
| `primary` | `--accent-gold` | none | `--bg-abyss` | Confirm, primary actions |
| `secondary` | `--bg-raised` | `--border-subtle` | `--text-primary` | Cancel, navigation, default |
| `ghost` | transparent | transparent | `--text-muted` | Tertiary actions, close buttons |
| `danger` | `--negative` at 15% | `--negative` at 25% | `--negative` | Destructive actions |

### Sizes

| Size | Height | Padding (x) | Font size |
|------|--------|-------------|-----------|
| `sm` | 28px | 8px | `--text-xs` |
| `md` | 36px | 12px | `--text-sm` |
| `lg` | 44px | 16px | `--text-base` |

### States
- **Hover:** Brightness shift (primary: darken 10%, secondary: `--bg-hover`, ghost: `--bg-hover`)
- **Active:** `scale(0.98)` transform
- **Disabled:** `opacity: 0.4`, `cursor: not-allowed`, no hover
- **Focus-visible:** `outline: 2px solid var(--accent-gold-dim)`, `outline-offset: -2px`
- **Loading:** Content replaced with `.animate-breathe` opacity pulse, pointer-events disabled

### Render

```tsx
<Button variant="primary" size="lg" icon={<SphereIcon sphereName="force" />}>
  Confirm Intervention
</Button>

<Button variant="secondary" onClick={onCancel}>Cancel</Button>

<Button variant="ghost" size="sm" icon={<span>×</span>} aria-label="Close" />
```

### Rules
- Icon-only buttons (no children) **must** have `aria-label`
- `primary` variant used maximum once per visible panel (it's the main CTA)
- Never set `style={{}}` on a Button — use variants. If a new variant is needed, add it to the component, don't inline styles.
- Transitions: `background-color`, `border-color`, `color`, `transform` — all at `--anim-fast`

---

## 3. IconButton

**Replaces:** Top bar icon buttons (⚔, ⚙), close buttons, eye icons, and any 32×32 tap target.

### API

```tsx
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;             // Emoji, SphereIcon, or SVG
  badge?: number | string;           // Superscript badge (e.g. rival count)
  active?: boolean;                  // Gold active state
  size?: 'sm' | 'md';               // 'sm' = 28px, 'md' = 32px (default)
  variant?: 'default' | 'close';    // 'close' = circular, muted
}
```

### Styling

**Default:**
- Size: 32×32 (md) or 28×28 (sm)
- Background: transparent
- Border: `1px solid var(--border-subtle)`
- Color: `--text-muted`
- Radius: 4px
- Hover: `--bg-hover`, `--text-primary`
- Active prop: `--accent-gold` color, `--accent-gold-glow` background, `--accent-gold-dim` border

**Close variant:**
- Circular (border-radius: 50%)
- Background: `rgba(10, 10, 14, 0.6)`
- No border
- Color: `--text-tertiary`
- Hover: `--text-primary`

**Badge:**
- Position: absolute top-right
- Font: monospace, 9px (exception to 16px min — badges are supplementary, not readable text)
- Color: inherits from icon state or `--negative` if icon has hostile context

### Rules
- Always provide `aria-label` or `title`
- Badge is decorative (aria-hidden), the `aria-label` should include the count (e.g. "3 Rival Gods")

---

## 4. ListRow

**Replaces:** RetinuePanel rows, AttachmentRows, LocationCard rows, RivalPanel rows, EncounterLog rows.

### API

```tsx
interface ListRowProps {
  accentColor?: string;              // 3px left border color (sphere/tier)
  selected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  trailing?: React.ReactNode;        // Right-side element (IconButton, badge, etc.)
  children: React.ReactNode;         // Row content
  className?: string;
}

// Compound components
ListRow.Title    // Primary text (--text-sm, --text-primary, truncate)
ListRow.Subtitle // Secondary text (--text-xs, --text-tertiary, truncate)
ListRow.Leading  // Left element (avatar pip, icon, sphere dot)
```

### Render

```tsx
<ListRow
  accentColor="#ff4444"
  selected={selectedId === agent.id}
  onClick={() => onSelect(agent.id)}
  trailing={<IconButton icon="👁" size="sm" onClick={() => onZoom(agent.locationId)} />}
>
  <ListRow.Leading>
    <div className="pip" style={{ background: '#ff4444' }}>Fe</div>
  </ListRow.Leading>
  <ListRow.Title>Fen</ListRow.Title>
  <ListRow.Subtitle>The Shattered Sanctum</ListRow.Subtitle>
</ListRow>
```

### Styling
- Base: `.interactive-row` CSS class (already exists in index.css)
- Padding: `0.625rem 0.75rem`
- Border-radius: `0.375rem`
- Left accent: `borderLeft: 3px solid ${accentColor}` when provided
- Selected: `--accent-gold-glow` background, `--border-accent` border
- Hover: `--bg-hover` via `onMouseEnter`/`onMouseLeave` (style mutation pattern, per `interactions.md`)
- Trailing element: opacity 0 at rest, opacity 1 on row hover
- Keyboard: `role="button"`, `tabIndex={0}`, Enter/Space fires onClick
- Click propagation: trailing element uses `e.stopPropagation()`

### Rules
- Title always truncates (never wraps)
- Subtitle always truncates
- Max one trailing element per row
- If row has `onClick`, it must have `role="button"` and keyboard handler

---

## 5. Card

**Replaces:** Scattered inline panel/card styling across sidebar panels, info cards, and floating panels.

### API

```tsx
interface CardProps {
  variant?: 'surface' | 'raised' | 'glass';  // default 'surface'
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

// Compound components
Card.Header   // { title: string; count?: number; onBack?: () => void; trailing?: ReactNode }
Card.Body     // { children: ReactNode; scroll?: boolean }  — scroll adds overflow-y-auto
Card.Footer   // { children: ReactNode }  — right-aligned button row
```

### Variants

| Variant | Background | Border | Use |
|---------|-----------|--------|-----|
| `surface` | `--bg-surface` | `--border-subtle` | Default cards, info panels |
| `raised` | `--bg-raised` | `--border-medium` | Elevated cards, selected panels |
| `glass` | `.panel-glass` class | `--border-subtle` + backdrop blur | Floating overlays, sidebar panels |

### Card.Header Render

```tsx
<Card.Header title="Agent Detail" onBack={handleBack} trailing={<IconButton icon="⚙" />} />
```

Renders:
```html
<div class="card-header">
  <button class="back-btn">← Back</button>
  <SectionHeading>Agent Detail</SectionHeading>
  <div class="trailing">⚙</div>
</div>
```

### Styling
- Padding: `--panel-padding`
- Radius: `--panel-radius`
- Card.Header: flex row, `border-bottom: 1px solid var(--border-subtle)`
- Card.Body: padding `--panel-padding`, optional `overflow-y: auto`
- Card.Footer: padding `--panel-padding`, flex row, `gap: var(--space-2)`, `justify-content: flex-end`

### Rules
- Card.Header is optional — not every card needs a header
- Card.Body scroll should only be true for sidebar-height panels
- Never nest Card inside Card

---

## 6. Modal

**Replaces:** Duplicate backdrop+panel+escape logic in AgendaPicker, InterventionConfirm, EventPopup, AgentProfileModal.

### API

```tsx
interface ModalProps {
  open: boolean;
  onClose: () => void;
  maxWidth?: number;                  // default 600, in px
  animation?: 'anim-fade' | 'anim-fade-up';  // default 'anim-fade-up'
  children: React.ReactNode;
}

// Compound components
Modal.Header  // { children: ReactNode }  — title bar with auto close button
Modal.Body    // { children: ReactNode }  — scrollable content area
Modal.Footer  // { children: ReactNode }  — button row
```

### Behavior
- Portals to `document.body`
- Backdrop: `position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 60`
- Panel: centered, `max-width` prop, `max-height: 85vh`, `overflow-y: auto` on Body
- Escape key closes (via `useEffect` listener)
- Backdrop click closes (with `e.stopPropagation()` on panel)
- Entry/exit via `AnimateMount`
- `aria-modal="true"`, `role="dialog"`
- Focus trap: first focusable element on open (stretch goal — add later)

### Render

```tsx
<Modal open={showConfirm} onClose={handleCancel} maxWidth={500}>
  <Modal.Header>Confirm Intervention</Modal.Header>
  <Modal.Body>
    <p>Spend 4.2 Force essence to inspire Fen?</p>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
    <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
  </Modal.Footer>
</Modal>
```

### Styling
- Panel background: `linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))`
- Panel border: `1px solid var(--border-subtle)`
- Panel radius: `var(--panel-radius)` (or `12px` for modals — slightly larger)
- Panel shadow: `0 8px 32px rgba(0,0,0,0.6)`
- Modal.Header: `--font-display`, `--text-lg`, border-bottom, close IconButton auto-appended
- Modal.Footer: flex row, `gap: var(--space-2)`, children right-aligned

### Rules
- Only one modal open at a time — opening a new one should close the previous
- `maxWidth` never exceeds 900px — wider modals lose focus
- Modal.Header always includes a close button (auto-rendered by Modal.Header)
- Buttons in footer: cancel on left, primary action on right

---

## 7. Dropdown

**Replaces:** Manual portal+positioning+outside-click logic in RivalsButton, MandateTracker popover.

### API

```tsx
interface DropdownProps {
  trigger: React.ReactElement;        // Usually an IconButton
  open: boolean;
  onOpenChange: (open: boolean) => void;
  align?: 'left' | 'right';         // default 'right' (aligned to right edge of trigger)
  children: React.ReactNode;
}

// Compound component
Dropdown.Item  // { children: ReactNode; onClick?: () => void }
```

### Behavior
- Portals to `document.body`
- Position: `fixed`, calculated from trigger `getBoundingClientRect()`
- Appears below trigger with 4px gap
- Align: right edge of dropdown aligns with right edge of trigger (default)
- Outside-click closes (event listener on `document`)
- Escape closes
- z-index: 9999 (portal, above everything)
- Entry animation: `anim-fade-down`

### Render

```tsx
<Dropdown
  trigger={<IconButton icon="⚔" badge={3} />}
  open={rivalsOpen}
  onOpenChange={setRivalsOpen}
>
  <SectionHeading>Rival Gods</SectionHeading>
  <Dropdown.Item onClick={() => selectRival('veiled')}>
    <ListRow accentColor="#aa44dd">
      <ListRow.Title>The Veiled Prophet</ListRow.Title>
      <ListRow.Subtitle>expansionist</ListRow.Subtitle>
    </ListRow>
  </Dropdown.Item>
</Dropdown>
```

### Styling
- Panel: `width: 260px` (or auto based on content, min 200px, max 320px)
- Background: `linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))`
- Border: `1px solid var(--border-subtle)`
- Radius: `var(--panel-radius)`
- Shadow: `0 8px 32px rgba(0,0,0,0.6)`
- Padding: `var(--panel-padding)`

### Dropdown.Item
- Extends `.interactive-row` styling
- Hover: `--bg-hover`
- Padding: `0.5rem 0.75rem`
- Can contain any content (text, ListRow, custom layout)

### Rules
- Trigger must be a single element (usually IconButton)
- Dropdown never exceeds viewport — clamp position if near edges
- Close on item click by default (Dropdown.Item calls `onOpenChange(false)` after onClick)
- Outside-click listener attached only while open, cleaned up on close

---

## Usage Decision Tree

```
Need a clickable element?
├── Is it a primary/secondary/cancel action? → Button
├── Is it a small icon in a toolbar or header? → IconButton
├── Is it a row in a list? → ListRow (with onClick)
└── Is it a menu trigger? → IconButton + Dropdown

Need to display content?
├── Is it a titled panel with header? → Card
├── Is it a row in a list? → ListRow
├── Is it a section label? → SectionHeading
└── Is it a floating overlay? → Modal or Dropdown

Need to show/hide content?
├── Is it a dialog requiring a decision? → Modal
├── Is it a menu appearing below a trigger? → Dropdown
└── Is it a slide-in panel? → AnimateMount (existing)
```

---

## Adoption Protocol

When replacing a one-off implementation with a primitive:

1. Read the existing component's props and behavior
2. Map to the primitive's API — if something doesn't fit, consider whether the primitive needs extending or the component has unnecessary complexity
3. Swap the implementation
4. Verify: visually identical before and after (use preview tool or manual check)
5. Run relevant tests — `npm test -- --run ComponentName`
6. If no tests exist for the component, add a basic render test

**Do not** change behavior during adoption. Adoption is a pure refactor — visual and functional parity.
