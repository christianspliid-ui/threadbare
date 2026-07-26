> **title:** `Ceremonial reveal surface — Civ-fidelity presentation tier for minor game elements — THR-799`
> **linear_issue:** THR-799
> **author:** `Claude Code`
> **created:** 2026-07-26
> **three_pillars:** Engine `N/A — consumes existing notification events; no tick-loop changes` · Content `done` · UI `done`

# Ceremonial reveal surface — THR-799

*Minor game elements (traits, attachments, action cards, small events) currently surface as flat text panels; this plan gives the design system a reusable ceremonial presentation tier at the fidelity of a Civilization VI unlock card.*

## Why this is load-bearing

Christian benchmarked a Civilization VI "Tech Unlocked" popup and asked for that level of fidelity and breathing room whenever the game presents a minor element. Today those moments run through `EventPopup` — a flat accent-strip + title + body + button modal — or through dense sidebar rows. The gap is not one component; it's a missing **presentation tier** between toast and full modal, plus three missing primitives (icon medallion, flavor-quote well, banner band). Without it, every future "you gained X" surface will keep being improvised flat, and the game's most emotionally rewarding beats (a trait revealed, an attachment gained, a new action learned) read like debug output. This plan adds the tier once, as shared primitives, so every current and future reveal moment inherits it.

### Design learnings extracted from the reference card

1. **Ceremonial frame** — the card is visibly framed (gold outer border, layered inner surfaces) and floats over the game world; the frame itself signals "a moment, not a message."
2. **Category title, not item name, at the top** — "TECH UNLOCKED" in centered letterspaced display caps names the *kind* of moment; the item name comes later.
3. **Hero medallion** — an oversized circular icon in a layered ring treatment (gold ring → dark gap → content disc), centered, straddling the section boundary.
4. **Banner band** — the item name ("AGRICULTURE") sits in its own full-width darker inset band, letterspaced caps.
5. **Consequence chips** — "UNLOCKED BY THIS TECH (2)" previews follow-on effects as small circular icon chips with the count in the label.
6. **Flavor-quote well** — an inset darker panel with an ornamental divider, italic quote, and attribution. Narrative before mechanics.
7. **Generous vertical rhythm** — every zone is padded; a single column; nothing competes.
8. **Single dismiss** — one full-width button; the moment ends cleanly.
9. **Three depth levels** — frame > card body > inset wells. Depth is done with surface layering, not drop shadows alone.

All nine map cleanly onto Threadbare's existing dark-tapestry language (Cinzel display, gold-means-important, `--type-flavor`, `.ornamental-rule`, `.quote-block`, layered `--bg-*` ladder). This is an extension, not a new visual identity.

## Engine pillar

Engine: N/A — the reveal surface consumes events that already exist (`PopupItem` notification queue, the Ascendant Beat unlock reveal from THR-639, attachment/trait acquisition already visible in panels). No graph nodes, tick phases, resolution logic, or PRNG. If playtesting later wants *new* reveal triggers (e.g. a popup on every attachment acquisition), that is an engine-side deferral — see Notes for the executor.

## Content pillar

### Encounter templates

N/A — no encounter content changes.

### Prose tables

Flavor quotes for the quote well come from **existing** prose fields first: action templates' flavor text (`action-template-content.ts`), condition/trait prose (`condition-trait-content.ts`), attachment template prose. New content is limited to one small table (below).

### Attachment content

N/A — existing attachment templates already carry the prose the quote well needs; missing prose falls back to omitting the well (fail-soft, never an empty panel).

### Data tables

New file `src/data/reveal-content.ts`:

- `REVEAL_CATEGORY_TITLES: Record<RevealKind, string>` — the ceremony line per element kind, e.g. `trait → "A NATURE REVEALED"`, `attachment → "A BOND FORMED"`, `action_card → "A NEW WORKING LEARNED"`, `event → "THE WORLD TURNS"`. Threadbare voice, player-as-god framing — **not** "TECH UNLOCKED" clones. Final wording is a creative call for Christian; ship with drafts and flag in the completion summary.
- `REVEAL_FALLBACK_FLAVOR: Record<RevealKind, string[]>` — 2–3 generic lines per kind used only when the element has no prose of its own (selection by stable index on element id — deterministic, no PRNG).
- Consequence-chip labels are **words, not numbers** (`domain-words.ts` scales where a magnitude is implied) — per the no-numeric-stats rule.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces — all of this is portaled DOM over the canvas; no WebGL surface is touched).*

### Player-facing display

Three new shared primitives in `src/components/shared/`, all registered in the StyleGuide (`?view=styleguide`) with sample data:

1. **`Medallion`** — circular icon frame.
   - API: `{ size?: 'sm' | 'md' | 'lg'; accentColor?: string; children: ReactNode; title?: string }` — sm 40px (chip), md 64px, lg 96px (hero). Layered rings: outer 2px ring (`accentColor`, default `--accent-gold-dim`; lg uses `--accent-gold`), 3px gap of `--bg-abyss`, inner content disc (`--bg-deep`) clipping the child (SphereIcon, glyph, or art via `overflow: hidden; border-radius: 50%`).
   - Replaces ad-hoc circular icon treatments; used standalone in sidebars too.
2. **`FlavorQuote`** — inset quote well.
   - API: `{ children: ReactNode; attribution?: string; divider?: boolean }` (divider default true).
   - Render: `.inset-well` panel; centered ornamental divider glyph (`✦` flanked by hairlines — reuses `.ornamental-rule` construction) at top; quote in `--type-flavor`; attribution right-aligned in `--text-xs` / `--text-tertiary`.
   - Consolidates the existing `.quote-block` pattern into a primitive (the CSS class stays; adoption is additive).
3. **`RevealCard`** — the ceremonial compound surface, built **on the existing `Modal` primitive** (per the extend-don't-bypass rule; z-60, Escape/backdrop close, `AnimateMount` entry all inherited).
   - Compound API:
     - `RevealCard` — `{ open; onClose; accentColor?; children }`; fixed `maxWidth: REVEAL_CARD_MAX_WIDTH`; applies `.frame-ceremonial`.
     - `RevealCard.Title` — category line: centered, `--font-display`, `--text-lg`, letterspacing 0.18em, `--text-primary` (not gold — see gold-budget rule below); wrapped in ornamental rules.
     - `RevealCard.Medallion` — hero slot; renders `Medallion size="lg"` centered with negative bottom margin so it straddles the next zone boundary (reference-card behavior).
     - `RevealCard.Banner` — full-width `.inset-well` band; item name in letterspaced display caps, `--text-base`.
     - `RevealCard.Consequences` — `{ label: string; items: { icon: ReactNode; title: string; onClick?: () => void }[] }`; renders `SectionHeading` with count + a centered row of `Medallion size="sm"` chips, each with a `Tooltip` (progressive disclosure); caps at `REVEAL_CONSEQUENCE_CHIP_MAX`, overflow renders a `+N` chip.
     - `RevealCard.Quote` — thin wrapper over `FlavorQuote`.
     - `RevealCard.Dismiss` — `{ label?: string; onClick }` → full-width `Button variant="secondary" size="lg"` (secondary, not primary — dismissal is not a CTA; matches the reference card's quiet OK).
   - Vertical rhythm: every zone separated by `--space-ceremonial`; single column; no zone optional-but-empty (absent data → zone omitted entirely).

**Visual + info sources per RevealCard subject** (compliance with `Docs/design-system/artifact-representation.md` § Compliance rule — one row per registry subject this surface can carry):

| Subject | Canonical visual (registry/resolver) | Info source |
|---|---|---|
| Action (beat-unlock reveal) | the real focused `ActionCard` face — `ACTION_ART` registry via `templateToPreviewSlot` (ActionCard reused unmodified, exactly as THR-639 built it) | effects line, `src/data/actionEffectsProse.ts` |
| Smaller event (EventPopup ceremonial path) | `SphereIcon` from `PopupItem.sphere` inside `Medallion` (sphere is the event's canonical visual identity; no per-event art registry exists) | `PopupItem.body` prose |
| Attachment (`AttachmentDetailView`) | Codex glyph + tier (per registry row "Possession / Condition") inside `Medallion` | existing attachment prose fields; CodexCard technical effect line |
| Trait (inline, `NpcDetailView`) | inline `Medallion sm` chip with trait glyph — **inline only**, per registry row "Trait / Ambition / Relationship" | existing profile-section trait prose |

**`Medallion` consumes the existing resolution path — it introduces no second art-resolution path.** Where a subject resolves through `entityVisualResolver.ts` / `EntityVisual` (THR-637), Medallion's child *is* that resolved visual clipped to a disc; the sphere-glyph → gold `✦` chain in the fail-soft table is the tail of the existing THR-637 fallback chain, not a parallel one.

New CSS (in `src/index.css`, tokens + two utility classes):

- `--space-ceremonial: 20px` — the vertical rhythm unit for ceremonial surfaces.
- `.inset-well` — recessed panel: `background: rgba(10,10,14,0.55); border: 1px solid var(--border-subtle); border-radius: var(--panel-radius); box-shadow: inset 0 1px 3px rgba(0,0,0,0.4)`.
- `.frame-ceremonial` — double frame: `border: 1px solid var(--border-gold)` (dim, structural — not the emphasis) + inner hairline via `outline: 1px solid var(--border-subtle); outline-offset: -4px`; corner ornaments deferred to v2 (see Notes).

**Gold budget (taste-profile "one gold emphasis per panel"):** the hero medallion ring is RevealCard's single gold emphasis. Title text is `--text-primary`, the frame and ornamental rules are dim-gold structural hairlines, and the dismiss button is `secondary`. The reference card is gold-saturated; Threadbare's austerity rule wins — one bright gold element per surface.

Adoption pass (same PR, four surfaces):

| Surface | Change |
|---|---|
| `src/components/Game/EventPopup.tsx` | Popups carrying a sphere/category render through `RevealCard` zones (title → medallion from sphere → banner from popup title → body prose → dismiss); plain informational popups keep the current compact layout. Queue badge behavior unchanged. |
| `src/components/Game/AscendantBeatModal.tsx` (THR-639 surface) | Wrap the revealed `ActionCard` in `RevealCard` — category title + card as hero + single dismiss. The card itself is unchanged (still rendered via `templateToPreviewSlot`). |
| `src/components/Game/AttachmentDetailView.tsx` | Header adopts `Medallion` (md, Codex glyph + tier) + `.inset-well` banner; existing prose line moves into `FlavorQuote`. Layout-only; data unchanged. |
| `src/components/Game/NpcDetailView.tsx` (trait section, ~line 67) | Trait rows gain inline `Medallion sm` chips and the section's trait prose adopts `FlavorQuote` — **inline only**, per `artifact-representation.md` registry row for traits ("no independent card yet"); no free-standing trait card is created. Reveal-*moment* popups for traits are out of scope (no engine trigger exists — see Notes). |

Docs updated in the same PR: `Docs/design-system/primitives.md` (three new primitive specs), `component-selection.md` (decision rows: RevealCard vs Modal vs EventPopup), `tokens.md` (`--space-ceremonial`, `.inset-well`, `.frame-ceremonial`), and `artifact-representation.md` (RevealCard added alongside THR-639 as a conforming surface; no registry-row changes — traits stay inline-only).

### Event notifications

No new notification types. `EventPopup` remains the single popup queue; this plan changes its presentation tier only.

### Debug inspection (DebugPanel)

No new `__DEBUG` API. The StyleGuide registration is the inspection surface for the primitives (all variants with sample data). Existing notification traces continue to cover popup emission.

### Visual presence (HexMapV2)

N/A — portaled DOM over the canvas; no map layers touched.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `shared/Medallion` | N/A (pure UI) | self + StyleGuide | none | none | StyleGuide section |
| `shared/FlavorQuote` | N/A (pure UI) | self + StyleGuide | none | none | StyleGuide section |
| `shared/RevealCard` | N/A (pure UI) | self + StyleGuide | none | none | StyleGuide section |
| `data/reveal-content.ts` | N/A (static content) | RevealCard consumers | none | none | StyleGuide sample data |
| EventPopup adoption | N/A | `EventPopup` | existing `PopupItem` queue | existing notification traces | existing |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `REVEAL_CARD_MAX_WIDTH` | `520` | Ceremonial card width (px); single-column readability |
| `REVEAL_CONSEQUENCE_CHIP_MAX` | `4` | Max consequence chips before `+N` overflow chip |
| `MEDALLION_SIZE_SM` / `_MD` / `_LG` | `40` / `64` / `96` | Medallion diameters (px) |
| `--space-ceremonial` | `20px` | Vertical rhythm unit between ceremonial zones |

## Tracing

N/A — no new trace types; the surface is pure presentation over already-traced notification events. Inspectability is served by the StyleGuide registration (every primitive variant renderable with sample data) and the unchanged notification traces.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Element has no icon/art for the medallion | Sphere glyph → generic gold `✦` glyph; never an empty disc |
| No flavor prose on the element | `REVEAL_FALLBACK_FLAVOR` line by kind; if kind unknown, omit the quote well entirely |
| No consequence data | Omit the Consequences zone entirely (no empty "(0)" row) |
| Unknown sphere / no accent color | `--accent-gold` default |
| Popup lacks sphere/category (plain notification) | EventPopup keeps its current compact layout — RevealCard path not taken |
| Content overflow (long prose) | Modal's inherited `max-height: 85vh` + internal scroll on the body zone only; frame and dismiss stay fixed |

## Blast Radius

No ≥100-importer file is touched. (`src/index.css` and `src/components/shared/*` are wide *visual* surfaces but not in the high-impact importer list; all CSS additions are new classes/tokens, no existing rule is modified.)

## Three-pillar check

- [x] Engine pillar present (N/A with rationale — consumes existing events)
- [x] Content pillar present (`reveal-content.ts` + reuse of existing prose fields)
- [x] UI pillar present (three primitives + four-surface adoption pass)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise — it strengthens "narrative over mechanical" (quote well, word-scale chips) and the dark-tapestry identity.
- [x] If it did, the Vision edit would be part of this ticket's scope — not applicable; the one taste-profile tension found (gold budget) was resolved inside this plan (§ UI pillar "Gold budget").

## Rulebook impact

- [x] This plan does not change a rule of play — presentation tier only.
- [x] If it did, `Docs/canon/rulebook.md` would be updated in the same PR — not applicable.

## Interface impact

Step 0.7 check against `Docs/canon/interface-map.md`: this plan reads several mapped subsystems' data for display but changes **no cross-system read/write contract** — every touched surface keeps consuming the same fields it consumes today.

| Contract / surface | Subsystem(s) | Disposition |
|---|---|---|
| `PopupItem` queue → EventPopup | Notifications | **preserve** — same fields (`title`, `body`, `sphere`, `choices`); presentation-only split on existing `sphere?` |
| `templateToPreviewSlot` → ActionCard face | Unified actions | **preserve** — AscendantBeatModal keeps the same adapter; ActionCard unmodified |
| Attachment catalogs → Codex glyph/tier (`getAttachmentGlyph`) | Attachments, Items & Possessions | **preserve** — AttachmentDetailView keeps its existing glyph/prose reads |
| Agent traits → NpcDetailView trait section | Traits | **preserve** — same trait list read; inline presentation only |
| `entityVisualResolver` / THR-637 fallback chain | Entity visuals | **preserve** — Medallion consumes the resolver; no second art path |
| New: `reveal-content.ts` → RevealCard consumers | (new, UI-internal) | **add** — static content table read only by the new primitives; no engine writer, so no production read-site obligation beyond the UI itself |

No contract is extended or retired; no interface-map row changes.

> Brainstorm companion: `Docs/plans/2026-07-26-thr-799-ceremonial-reveal-surface-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | All dimensions/caps named constants (table above) |
| 2. Inspectability | PASS with note | No new traces needed — pure presentation; StyleGuide is the inspection surface |
| 3. Determinism | PASS | No PRNG; fallback flavor selection is stable-index on element id |
| 4. Fail-soft | PASS | Every missing-data case degrades to zone omission, never an empty frame (table above) |
| 5. Narrative over mechanical perfection | PASS | Quote well leads; consequence chips use words/icons, never numeric stats |
| 6. Additive over destructive | PASS | New primitives + new CSS classes; `.quote-block`, existing EventPopup compact path, and ActionCard all preserved |
| 7. Performance budget | PASS | Static DOM in a modal; no per-tick work |

## Done when

- [ ] `Medallion`, `FlavorQuote`, `RevealCard` exist in `src/components/shared/`, registered in StyleGuide with sample data for every variant
- [ ] EventPopup sphere-carrying popups render through RevealCard; plain popups unchanged (test asserts both paths)
- [ ] Ascendant Beat unlock reveal wrapped in RevealCard
- [ ] AttachmentDetailView header and NpcDetailView trait section (inline-only) adopt Medallion + inset-well + FlavorQuote
- [ ] Design-system docs updated (primitives.md, component-selection.md, tokens.md, artifact-representation.md)
- [ ] `npm test` and `npx vite build` pass; types verified via `tsc -b --force` net-new diff (not `tsc --noEmit` — no-op here, THR-686)
- [ ] Browser-verify: Playwright 1920×1080 screenshots of **all four adopted surfaces** — (a) StyleGuide RevealCard section, (b) a live sphere-carrying EventPopup over the game view, (c) the AscendantBeatModal unlock reveal, (d) AttachmentDetailView header + NpcDetailView trait section (one shot each); console output block; one `__DEBUG` state assertion for the popup queue
- [ ] Closing commit body includes `Fixes THR-799`

## Coordination block

**Suggested model:** sonnet — well-specified UI construction with fixed APIs; no engine reasoning (advisory; the automation runs Opus regardless).

**Parallel-safe with:** engine/content-only tickets (no shared files).

**Mutex with:** any ticket editing `src/index.css`, `src/components/Game/EventPopup.tsx`, or `src/components/StyleGuide/StyleGuide.tsx` (all three are edited here).

**Files to touch:**
- Create: `src/components/shared/Medallion.tsx`, `src/components/shared/FlavorQuote.tsx`, `src/components/shared/RevealCard.tsx`, `src/data/reveal-content.ts`, tests for each
- Edit: `src/index.css` (new tokens/classes only), `src/components/Game/EventPopup.tsx`, `src/components/Game/AscendantBeatModal.tsx`, `src/components/Game/AttachmentDetailView.tsx`, `src/components/Game/NpcDetailView.tsx` (trait section), `src/components/StyleGuide/StyleGuide.tsx`, `Docs/design-system/{primitives,component-selection,tokens,artifact-representation}.md`

## Notes for the executor

- **Build on `Modal`; do not fork it.** RevealCard composes Modal — if Modal needs a prop (e.g. suppressing default padding), extend Modal.
- **No nested modals.** Surfaces that are already modals (`AscendantBeatModal`) must adopt the *layout*, not a second Modal shell — expose the zone stack as an inner component (e.g. `RevealCard.Frame`, or an `inline` prop that skips the Modal wrapper) so existing modal shells embed it without double-portaling or double-backdrops.
- **NpcDetailView trait section palette** — the existing trait pills use legacy Tailwind zinc classes (`text-zinc-300`, `bg-zinc-800`, `border-zinc-700`) while the new primitives are token-based. Migrate that section's classes to the token ladder in the same pass (small, layout-neutral) so the section doesn't read as two palettes.
- **Zone omission, not empty zones.** The reference card's quality comes from every visible zone being full. Absent data removes the zone.
- **`RevealCard.Dismiss` is `secondary`, deliberately** — a reveal has no competing action, so the quiet button reads calm, like the reference card's OK.
- **Do not add engine triggers in this ticket.** If a reveal moment lacks an emitting event (e.g. trait-revealed popup, attachment-acquired popup), that is a follow-up `Deferral` issue on the engine side — file it, don't build it here.
- **Corner ornaments (v2)** — the reference card has drawn corner filigree; v1 ships the double-border `.frame-ceremonial` only. If v1 looks bare at review, a corner-ornament SVG pass is a small follow-up, not a blocker.
- **`REVEAL_CATEGORY_TITLES` wording is a creative call** — ship drafts, then surface the strings to Christian in the plain-language completion summary for a yes/no.
- **Wiki freshness:** check `public/wiki-manifest.json` globs — if any adopted surface is a wiki `sources` match, update the page in the same PR (blocking gate, THR-730).
- Blocking modals must register in GameView `interruptModalOpen` (THR-668) — RevealCard adoptions of *existing* surfaces inherit their registration; verify the beat-unlock surface still auto-pauses.

## Intent-judge verdict

**Allow** (2026-07-26, opus, cold-context; pass 1: Revise with 1 VIOLATION + 1 GAP — both closed and repo-verified on pass 2). Impact class judge-confirmed Reversible. All 11 dimensions PASS; two non-blocking nits folded into the plan (Done-when docs list, NpcDetailView zinc→token migration note). Proposal: `Docs/plans/.intent-proposals/2026-07-26-thr-799-ceremonial-reveal-surface.md`.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-07-26*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Constants table names every dimension: `REVEAL_CARD_MAX_WIDTH`, `REVEAL_CONSEQUENCE_CHIP_MAX`, `MEDALLION_SIZE_SM/_MD/_LG`, `--space-ceremonial` |
| 2. Inspectability | PASS-with-note | "No new trace types — pure presentation over already-traced notification events"; inspection surface is StyleGuide registration, not a trace — acceptable since this is presentation-only, not decision logic, but it's an assertion rather than a demonstrated fallback if StyleGuide coverage lapses |
| 3. Determinism | PASS | "No PRNG; fallback flavor selection is stable-index on element id" |
| 4. Fail-soft | PASS | Explicit six-row fail-soft table — missing art, missing prose, no consequence data, unknown sphere, popup w/o category, content overflow — each degrades to zone omission, never a crash or empty shell |
| 5. Narrative over mechanical | PASS | "Consequence-chip labels are words, not numbers... per the no-numeric-stats rule"; quote well explicitly placed "before mechanics" |
| 6. Additive over destructive | PASS | New primitives/classes only; explicitly preserves `.quote-block`, EventPopup's compact path, and unmodified `ActionCard`; "no existing rule is modified" for CSS |
| 7. Performance budget | PASS | "Static DOM in a modal; no per-tick work"; Blast Radius section confirms no ≥100-importer file touched |

NFP AUDIT: PASS-with-notes (see rows above)

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | N/A-with-rationale | Explicitly `N/A — consumes existing notification events; no tick-loop changes`, one-line reason given per header and body |
| Content | present-and-substantive | All four subsections filled (Encounter templates N/A, Prose tables reuse-first, Attachment content N/A-with-reason, Data tables — new `reveal-content.ts` spec with concrete type shapes) |
| UI | present-and-substantive | All four subsections filled with real spec: Player-facing display (3 new primitives, full API + adoption table across 4 surfaces), Event notifications, Debug inspection, Visual presence (N/A-with-reason) |

Missing-required-sections list: No missing required sections. Wiring section check: Yes — the Wiring table connects all three new primitives and the EventPopup adoption to StyleGuide inspection and the existing `PopupItem` queue, correctly marking orchestrator phase N/A for a pure-UI feature. Substrate-existence check: N/A (no Engine pillar).

PILLAR AUDIT: PASS

### Vision audit

Premises touched: `00-north-star.md` → "a story the player can tell in prose" — confirmed (ceremonial framing serves emotionally rewarding reveal moments). `02-non-negotiables.md` → "mechanics surface through prose, never numbers" (#3) — confirmed; "three pillars always present" (#7) — confirmed (Engine N/A with rationale per the exception clause). `taste-profile.md` → austere letterspaced register — confirmed; "one gold emphasis per panel" — **tension found**: the draft stacked three gold applications (frame border, gold title, medallion ring). Core loop / design tensions: not referenced (pure presentation layer; no rhythm change). Non-negotiables incl. god/protagonist separation: untouched.

VISION AUDIT: PASS-with-notes — gold-emphasis count in RevealCard (frame + title + medallion) sits in tension with the "one gold emphasis per panel" strong opinion; non-blocking.

**Author resolution (same pass):** gold budget collapsed to a single emphasis — the hero medallion ring keeps `--accent-gold`; `RevealCard.Title` demoted to `--text-primary`; `.frame-ceremonial` demoted to dim `--border-gold`. Recorded in § UI pillar "Gold budget" paragraph.
