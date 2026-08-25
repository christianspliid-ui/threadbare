# Interaction Patterns

**Read this when:** implementing hover, focus, active, or disabled states; handling keyboard input; defining cursor behavior; or building any interactive element.

---

## State Definitions

Every interactive element has these states. All must be implemented:

| State | When | Visual treatment |
|-------|------|-----------------|
| **Rest** | Default, no interaction | `--bg-raised` background or transparent |
| **Hover** | Mouse over | `--bg-hover` background + `--border-subtle` border |
| **Active** (pressed) | Mouse down | `--bg-hover` + slight `scale(0.98)` |
| **Selected** | Chosen/active item | `--accent-gold-glow` background + `--border-accent` border + `--accent-gold` text |
| **Focus-visible** | Keyboard navigation | `outline: 2px solid var(--accent-gold-dim)`, `outline-offset: -2px` |
| **Disabled** | Cannot be activated | `opacity: 0.4`, `cursor: not-allowed`, no hover state |

**Rule:** Never suppress `:focus-visible` — keyboard players need it. Use `focus-visible` not `focus` to avoid showing outlines on mouse click.

---

## Hover State Implementation

Because many elements have dynamic base colors (sphere colors, tier colors), hover is applied via `onMouseEnter`/`onMouseLeave` style mutation rather than CSS classes. This is established pattern — follow it.

```tsx
onMouseEnter={(e) => {
  if (!isSelected) {
    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)';
    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
  }
}}
onMouseLeave={(e) => {
  if (!isSelected) {
    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-raised)';
    (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
  }
}}
```

**Exception:** Simple buttons (top bar, action buttons) can use Tailwind hover classes when there are no dynamic color overrides.

---

## Cursor Rules

| Element | Cursor |
|---------|--------|
| Clickable buttons | `pointer` (default for `<button>`) |
| Clickable rows/cards | `cursor-pointer` |
| Hex map (default) | `default` |
| Hex map (move mode) | `crosshair` |
| Hex map (hovered hex) | `pointer` |
| Disabled elements | `not-allowed` |
| Draggable elements | `grab` / `grabbing` |
| Text (chronicle, descriptions) | `text` (default) |

---

## Click Propagation Rules

- **Eye-icon buttons in rows:** `e.stopPropagation()` — prevents triggering parent row select
- **Panel close buttons:** no propagation stop needed (outermost interactive)
- **Backdrop click-catcher:** `onClick={() => setIsOpen(false)}` — always at `z-40`
- **Panel content:** `onClick={e => e.stopPropagation()}` — prevents backdrop close when clicking content

---

## Keyboard Patterns

### Global hotkeys (registered in `useTopBarHotkeys`)
| Key | Action |
|-----|--------|
| `Space` | Toggle simulation pause/run |
| `+` / `=` | Speed up |
| `-` | Slow down |
| `.` | Step one tick (when paused) |
| `` ` `` | Toggle debug panel |

### Overlay dismissal (all overlays)
| Key | Action |
|-----|--------|
| `Escape` | Close current overlay |

**Rule:** Escape always closes the topmost overlay. Implement with `useEffect` that adds listener only while overlay is open, removes on close. Never `preventDefault` on Escape globally.

### Accessibility minimum
- All `<button>` elements have either visible text or `aria-label`
- All icon-only buttons have `aria-label`; a `title` may duplicate it as an assistive-tech fallback, but any hover *explanation* routes through the shared `Tooltip`/`resolveTooltip` registry — the raw-`title` tooltip pattern is retired (UI Law 17, amended 2026-08-06)
- Interactive rows that are `<div>` elements must have `role="button"` and `tabIndex={0}` with keyboard handler for `Enter`/`Space`

---

## Minimum Touch / Click Targets

| Element | Minimum size |
|---------|-------------|
| Top bar buttons | 32×32px |
| List row items | Full width × 40px height |
| Close/dismiss buttons | 32×32px |
| Hex tiles (map) | Natural hex size (varies with zoom) |
| Action slots (ActionDrawer) | 48×48px minimum |

---

## Interactive Row Pattern

Used in: RetinuePanel, agent lists, attachment rows, location lists.

```tsx
<div
  className="interactive-row"
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
  aria-selected={isSelected}
>
```

The `.interactive-row` utility class in `src/index.css` handles padding, radius, border, and transition.

---

## Tooltip Pattern

Every icon-only button and truncated text element needs a tooltip. Use the `<Tooltip>` component (wrapper around portal-positioned div) rather than raw `title` attributes in game view — `title` doesn't render in the preview tool and has poor positioning.

- Tooltip appears after 600ms hover delay
- Dismissed immediately on mouse out
- Max width: 220px
- Never on elements that already have expanded labels visible

### Keyboard reachability (Laws 23/50; THR-1095)

**The trigger is a tab stop by default — you do not opt in.** Until THR-1095 the
trigger carried `onFocus`/`onBlur` and no `tabIndex`, so those handlers were dead
for any child that was not itself focusable: a tooltip over plain prose was
mouse-only, and Tier 1 of the disclosure ladder did not exist for a keyboard
player. A tooltip wrapping a `<button>` worked only by accident.

The default is bounded structurally rather than by caller memory, so it adds no
stop nobody could use. `Tooltip` makes its wrapper focusable when **all** of:

| Test | Why the stop is withheld otherwise |
|---|---|
| `as === 'span'` | `tabIndex` on SVG `<g>` is inconsistently honoured, and the `as="g"` callers are hex-map overlays — a stop per tile is the tab-order storm Law 46/50 warns about |
| `depth === 0` | A concept link *inside* an open popup is unreachable by construction: the popup portals to the end of `<body>`, and the trigger's own blur closes it. Hover still works |
| content resolves | A stop that opens no popup is a stop that does nothing (Law 21) |
| children own no stop | Otherwise the wrapper adds a second stop for the same word |

No `role` accompanies the stop. Law 23's `role="button"` clause governs elements
that *act* when pressed; a tooltip trigger only describes, and Enter/Space do
nothing on it. `aria-describedby` is the correct association.

**The one caller override.** Pass `focusable={false}` and put `tabIndex={0}` +
`className="focus-ring"` on a specific inner element when the wrapper's box is
the wrong thing to draw a ring around — an inline-flex chip with a leading glyph,
say. This is the sanctioned pattern, not legacy: `EncounterVeil.tsx`'s
consequence chips and legend use it so the ring hugs the word that carries the
meaning. The auto rule already stands down for it on its own, because the probe
sees the child's stop; `focusable={false}` is only needed to say so explicitly.
`focusable` (true) forces a stop the auto rule declines.

---

## Loading / Empty States

| State | Treatment |
|-------|-----------|
| Data loading | `.animate-breathe` placeholder at expected size, muted color |
| Empty list | Short italic explanation in `--text-muted`, `.animate-breathe` opacity pulse |
| Error | `--negative` color, icon + one-line message, no stack traces in UI |

---

## Feedback for Blocked Actions

When an action cannot be performed (insufficient essence, out of range, etc.):
1. Play `.anim-shake-no` on the element that was clicked
2. Show a toast with reason (if the reason is not obvious from context)
3. Do not open a confirmation dialog — fail fast, explain inline
