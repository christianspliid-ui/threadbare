# AgentDetailPanel — v7 Visual Overhaul

**Date:** 2026-05-07
**Author:** Cowork
**Linear:** THR-177
**Project:** UI Visual Overhaul — Design System v1
**Status:** ready-for-dev
**Visual reference:** `Docs/plans/v7-design-pass/parts/encounter-shell.jsx` (Hero panel block, lines 124–178), `Docs/plans/v7-screenshots/03-eira-hero-panel.png`
**Related plans:** THR-176 TopBar, THR-178 RightRail, THR-179 InterventionModal (sibling overhauls)

---

## 1. Problem

`AgentDetailPanel.tsx` (the right-sidebar selection-triggered surface) carries the data the player needs for the portfolio-scan loop — backstory, attachments, reputation, relationships, capability profile, encounter history. The data is correct. The visual presentation predates v7 and reads as a generic Tailwind-styled panel:

- Mixed token usage (`bg-stone-900`, `bg-stone-800/90`, `text-amber-100`, hardcoded `border-amber-900/30`) instead of the design tokens documented in `tokens.css`.
- Section structure relies on Tailwind utility classes rather than the v7 section-label + value-tier pattern.
- Capability profile and attachment rows lack the v7 idioms (5-dot meters, sphere-tinted left accents on active items, `panel.gold` warm-gradient treatment for vows/active commitments).
- Header bar is functional but doesn't read as part of the dark parchment aesthetic.

**Pure visual + composition refactor.** Every existing data surface, click handler, tooltip, and prop is preserved.

## 2. Visual targets (extracted from v7)

From `encounter-shell.jsx:124–178` — the Hero panel:

### Section labels
- Every region is anchored by an ALLCAPS Cinzel 10–11px label (`--type-section-label`).
- Gold-tinted (`--accent-gold` via `.gold-label`) for the lead-in label of the panel ("THE PROTAGONIST").
- Tertiary-tinted (`--text-tertiary`) for sub-section labels ("CAPABILITY IN THIS SCENE", "SHE CARRIES INTO THIS SCENE").
- Sphere-tinted for active sphere callouts ("VOW · ACTIVE NOW" in `--sphere-spirit-bright`).

### Name & tier presentation
- Name: `--type-display-md`-equivalent (Cinzel 22px, weight 600).
- Below the name: small Cinzel ALLCAPS line with reach + bond + age in tertiary text — the "tier line" but rendered as the v7 tier-attributes row.
- Disposition pill: `<span>` with a colored dot (status-tier color) + italic body-small text ("steady, but reading the room").

### Capability profile (the 5-dot meter pattern)
For each reach:
- 46px-wide ALLCAPS Cinzel reach label, sphere-bright color
- 5 small dots (7×7px circles) — filled with sphere-bright color up to the agent's tier in that reach, `--bg-raised` for unfilled
- 4–6px gap, then a short italic body-small prose phrase (`--text-tertiary`) flavor-summarizing the capability ("a steady arm in a tight queue")

### Attachment rows
- A `panel`-class container per attachment row (`bg-surface`, `border-subtle`, 8px gap, 8px radius)
- Leading: a 14×14 circle (border-only by default; sphere-bright filled when active)
- Body: name (body-sm, primary) + short tertiary-text descriptor below
- "Active vow" / featured attachments use `panel.gold` (`--border-accent` + sphere-tinted `linear-gradient` warm wash from sphere color at 12% alpha)

## 3. Layout — preserve every surface

The panel keeps its current sections; each section adopts the v7 visual idioms.

```
┌──────────────────────────────────────┐
│ [portrait]  Eira of Bren        [✕] │  ← Header (display name)
│             IRON · DRAWN BOND · 28W  │  ← Tier-attributes row
│             ● steady, but reading…   │  ← Disposition pill
├──────────────────────────────────────┤
│ THE PROTAGONIST                      │  ← Gold label
│   [archetype banner: dotted Cinzel  ]│  ← Existing archetype block
│                                      │
│ CAPABILITY IN THIS SCENE             │  ← Tertiary label
│   IRON   ●●●○○  a steady arm…       │  ← 5-dot meter rows
│   EYE    ●●●○○  she misses little   │
│   HEART  ●●●●●  her deepest thread  │
│                                      │
│ FACTIONS & STANDING                  │  ← Tertiary label
│   [faction tag + reputation row]     │
│                                      │
│ SHE CARRIES INTO THIS SCENE          │  ← Tertiary label
│   ○ Captain's token                  │  ← Attachment rows
│     small favor · civic guard…       │
│   ◉ VOW · ACTIVE NOW                 │  ← Active vow (panel.gold + sphere wash)
│     Vow to the small folk            │
│     she will not crush a frightened…│
│                                      │
│ RELATIONSHIPS                        │  ← (existing block)
│ TRAITS                               │
│ LEVERAGE                             │
│ RECENT ACTIVITY                      │
└──────────────────────────────────────┘
```

Every existing block stays — archetype banner, faction tag + reputation, attachments, traits, leverage, recent activity, intervention button. Only their *visual shell* changes.

## 4. Component changes

| Component | Change |
|-----------|--------|
| `AgentDetailPanel.tsx` | Replace `bg-stone-900` root with `var(--bg-surface)`. Replace header `bg-stone-800/90 border-b border-amber-900/30` with `var(--bg-deep)` + `1px solid var(--border-subtle)`. Replace all section h3/divs with `<SectionHeading>` from primitives. Wrap each major section in a small flex-col with `gap: var(--space-2)`. |
| Header section | Switch h2 from `text-amber-100 text-sm` to `--type-display-md`. Tier row becomes the ALLCAPS Cinzel attributes line (reach · bond · age) using `--text-tertiary`. Add a disposition pill below using `--positive` / `--warning` / `--negative` status dots — use existing disposition data, no new fields. |
| Archetype banner block (lines ~163–194) | Wrap in `panel` + `panel.gold` if archetype is sphere-aligned. Replace `bg-stone-800/50 border border-amber-900/30 rounded` with the existing `panel`/`panel.gold` classes (already in `index.css` if present, otherwise inline-styled per tokens). Reach affinity dots become sphere-bright dots from `tokens.css`. |
| Faction tag (lines ~196–214) | Keep the colored chip pattern but ensure colors come from `--sphere-*` or `--accent-gold` via the existing `factionThemeColor` prop. Add a `<SectionHeading>FACTIONS & STANDING</SectionHeading>` above it. |
| Capability profile section (existing — find by `DOMAINS_GRID`) | Rewrite layout: each reach renders as a flex row (label / 5-dot meter / italic prose). Sphere color resolved via existing reach→sphere mapping (already in code). Italic prose pulls from existing capability flavor strings; no new authoring required. |
| Attachment rows (existing `MAX_ATTACHMENT_ROWS = 5`) | Wrap each row in a `panel`-class container. Active vows / featured attachments (the existing "highlighted" flag, if present, or any attachment of `kind === 'vow'`) use `panel.gold` + sphere-tinted wash. Replace any inline `bg-stone-*` with tokens. |
| Trait, leverage, recent-activity sections | Same recipe: `<SectionHeading>` + token-based panel chrome. No data changes. |
| Intervene button (existing onIntervene CTA) | Adopt `<Button variant="primary">` from primitives. Position unchanged. |

No new data props. No GameState reads added. No new computations. The `useMemo(() => queryDigest(...))` for recent entries stays.

## 5. Constants (NFP #1)

All values via existing tokens — primary additions are sphere-color usage (already in `tokens.css`) and the section-label typography composite.

| Token | Used for |
|-------|----------|
| `--bg-surface` | Panel background |
| `--bg-deep` | Header strip |
| `--border-subtle` | Hairline borders, panel borders |
| `--border-accent` | `panel.gold` border |
| `--accent-gold`, `--accent-gold-glow` | Active states only |
| `--text-primary` | Name, attachment titles |
| `--text-secondary` | Body prose |
| `--text-tertiary` | Section labels, italic flavor |
| `--type-display-md` | Agent name |
| `--type-section-label` | All section headings |
| `--type-body`, `--type-body-small` | Attachment / row body text |
| `--sphere-{name}`, `--sphere-{name}-bright` | Reach meters, vow accent |
| `--positive`, `--warning`, `--negative` | Disposition pill status dot |
| `--anim-fast` | Hover transitions |

**Two existing literals stay as named constants in the file** (`MAX_ATTACHMENT_ROWS`, `MAX_TRAIT_ROWS`) — these are gameplay-tunable, not visual. No new magic numbers introduced.

## 6. Wiring (per `Docs/plans/wiring-checklist.md`)

| Surface | Wired? | Notes |
|---------|--------|-------|
| Orchestrator phase | N/A | Pure UI panel |
| GameState fields read | Same as today | `detail`, `activity`, `digestBuffer`, `currentTick`, `lastViewedTick` (props from GameView) |
| Traces emitted | None | UI refactor only |
| Player controls connected | All preserved | `onBack`, `onViewPsyche`, `onIntervene`, `onLocationClick`, `onAttachmentClick` — every callback retained |
| Visible in DebugPanel | N/A | This panel IS the inspection surface for an agent |
| Tests | Update `__tests__/AgentDetailPanel.test.tsx` for the new render structure (snapshot or RTL queries by section heading text) |

## 7. Three-pillar coverage

- **Engine** — N/A. No engine changes. Justified: this is a re-skinning of an existing wired surface.
- **Content** — N/A. Capability flavor prose is read from existing fields; no new prose authored here.
- **UI** — full coverage above (§3, §4, §5).

## 8. NFP audit

| Priority | Status | Note |
|----------|--------|------|
| 1. Tunability | PASS | All values via tokens; existing gameplay constants unchanged |
| 2. Inspectability | PASS | No engine changes |
| 3. Determinism | PASS | No PRNG, no engine state |
| 4. Fail-soft | PASS | Conditional renders preserved (`detail.archetype && …`, `detail.factionName && …`); missing optional fields hide the block |
| 5. Narrative over mechanical | PASS | 5-dot meter + italic flavor reinforces narrative reading; no raw scores exposed |
| 6. Additive over destructive | PASS | Every section preserved; only the shell changes |
| 7. Performance budget | PASS | No new memos, no new computations; render structure equivalent |

## 9. Fail-soft table

| Failure | Fallback |
|---------|----------|
| `detail.archetype` undefined | Block hidden (existing guard) |
| `detail.factionName` undefined | Block hidden (existing guard) |
| `detail.portraitUrl` undefined | Existing fallback (no portrait shown) |
| Sphere color token resolution fails | Browser falls through to `--text-tertiary` for the label, dots fall through to `--bg-raised` |
| Capability flavor prose missing for a reach | Row renders without the italic suffix; meter still shows |

## 10. Open questions / executor judgment

- **Disposition pill source data** — the v7 example shows "steady, but reading the room". The current panel does not have an explicit disposition prose field; the executor should map from the existing `recentActivity` summary or the agent's emotional-state derived data (whichever is already available on `detail`/`activity`). If neither exists, the disposition pill is omitted in v1 and tracked as a minor follow-up.
- **Vow vs. attachment classification** — if there's no explicit `kind === 'vow'` flag on attachment data today, treat the highest-priority active attachment as the "active vow" for the gold-wash treatment. Document the choice in the closing commit.
- **Archetype banner gold-wash trigger** — apply `panel.gold` only when the archetype has a clear sphere alignment. Otherwise standard `panel`.

## 11. Definition of done

- [ ] Panel root and header use design tokens; no `bg-stone-*` / `text-amber-*` / `border-amber-*` classes remain
- [ ] All section headings use `<SectionHeading>` primitive
- [ ] Capability profile renders as 5-dot meter rows with sphere coloring
- [ ] At least one attachment row demonstrates the `panel.gold` + sphere-tinted wash treatment for active vows
- [ ] All existing data surfaces and click handlers preserved verbatim
- [ ] Tests pass: `npm test -- --run AgentDetailPanel`, `npx tsc --noEmit`, `npx vite build`
- [ ] Visual verified at 1920×1080 by selecting an agent in `?view=game&seeded` and capturing via Chrome MCP — matches v7 hero-panel idioms
- [ ] No regressions in panel scroll/overflow behavior
- [ ] No data-density reduction (the issue body explicitly forbids this — verify every prior section still renders)

## 12. Coordination block

**Suggested model:** sonnet (token migration + composition refactor; large-scope but mechanical)
**Parallel-safe with:** THR-176 (TopBar), THR-178 (RightRail), THR-179 (InterventionModal). All four touch different files.
**Mutex with:** any in-flight changes to `AgentDetailPanel.tsx` body, `TraitRow`, or `LeverageSection` (all in the same file).
**Files to touch:**
- `src/components/Game/AgentDetailPanel.tsx` (primary)
- `src/components/Game/__tests__/AgentDetailPanel.test.tsx` (update render assertions)
- `src/components/shared/SectionHeading.tsx` (verify primitive supports `as="div"` if not already)

**Done when:**
- [ ] Component refactor shipped and merged
- [ ] Visual matches v7 hero-panel pattern (Chrome MCP screenshot in PR or Linear comment)
- [ ] No data surfaces lost — verify by walking the section list above against current panel render
- [ ] All tests green; `npx tsc --noEmit` clean; `npx vite build` succeeds
- [ ] `Fixes THR-177` in the merge commit body
