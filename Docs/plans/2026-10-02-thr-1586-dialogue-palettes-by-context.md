> **title:** `Dialogue palettes by context — THR-1586`
> **linear_issue:** THR-1586
> **author:** `Claude Code (attended design session, Opus)`
> **created:** 2026-10-02
> **three_pillars:** Engine `N/A — presentation only, no state is read or written that is not read or written today` · Content `N/A — no prose changes; the taxonomy maps existing surfaces to contexts` · UI `done`

# Dialogue palettes by context — THR-1586

*Each kind of moment gets its own colour family, so the colour of a dialog tells the player what kind of moment they are in before they read a word — and reference surfaces stay neutral so that signal keeps its meaning.*

## Why this is load-bearing

On 2026-09-25 Christian, looking at the compulsion-tier Premonition window: *"i love the colorfulness of the dialogue window"*, then *"it makes sense to have different color dialogue boxes for different contexts and dialogue types."* The starting taxonomy in the ticket was approved as written the same day (director verdict comment on THR-1586): keep the Premonition and Veil palettes, keep reference sheets neutral, give story beats, elder dilemmas and gains their own families, and decide whether the Premonition's per-option sphere tint spreads to other choice surfaces. This plan sets the colour values, the mechanism, the surface map and the Law amendment text.

Today two dialogs carry their own palette (the encounter veil's void-and-gold, the Premonition's violet / wine-plum) and every other dialog — story beats, meetings, receipts, the elder dilemma — wears the same charcoal-and-gold `Modal` panel as an entity sheet. A god opening "The God's Will" and a god opening a settlement's reference sheet see the same frame. Without this, colour on a dialog means nothing in particular; with it, colour means *this is a moment, and here is which kind*.

The measurement also turned up three Law defects on the very surfaces this ticket re-skins, which the implementation fixes in passing (§ UI pillar › Defects fixed in passing): an undefined `--bg-base` token painting button text at 1.7:1 on gold (Law 45), and literal hex golds and reds in two story-family modals (Law 30).

## Substrate inventory

The plan touches no engine subsystem in `Docs/canon/systems-inventory.md`. Every row it extends is a design-system substrate, listed here so nothing is green-fielded beside an existing piece:

| Existing substrate | Status | This plan |
|---|---|---|
| `Modal` primitive (`src/components/shared/Modal.tsx`) | 🟢 ACTIVE, ~24 importers | **extends**: an optional `context` prop, with neutral fallbacks |
| `RevealCard` (`src/components/shared/RevealCard.tsx`) | 🟢 ACTIVE | **extends**: pass-through `context` |
| Veil variant set (`--veil-*`, THR-1010) | 🟢 ACTIVE | **preserves**: listed in the registry only, untouched |
| Premonition variant set (`--premonition-*`, THR-1031) | 🟢 ACTIVE | **preserves**: tokens untouched; its tint recipe moves to a shared helper with identical output |
| Sphere tokens (`--sphere-*-bright`) | 🟢 ACTIVE | **reuses**: the card tint reads them |
| `CardFace` (`src/components/shared/CardFace.tsx`) | 🟢 ACTIVE, ~8 importers | **extends**: optional `sphereTint` on the model |
| THR-1607 essence-preview predicate (`sphere && essenceCost > 0`) | 🟢 ACTIVE | **reuses**: the same predicate decides the tint |
| `.frame-ceremonial` (THR-799) | 🟢 ACTIVE | **extends**: its border reads `--dlg-border`, falling back to today's gold |

## Engine pillar

Engine: N/A — presentation only. No `GameState` field, graph node, edge, tick phase, trace or PRNG call is added, read differently, or written. The dialogs are mounted by the same conditions as today; only their palette changes.

## Content pillar

Content: N/A — no prose changes. The "content" of this plan is the surface → context map (§ UI pillar), which is presentation data, not authored game content.

## Interface impact

N/A — no subsystem in `Docs/canon/interface-map.md` is touched. Every change is inside `src/components/`, `src/index.css`, the debug bridge's read-only UI accessor and `Docs/design-system/`. No cross-system read or write is added, extended or retired.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces — every dialog in scope is DOM; no WebGL).*

### The taxonomy (approved 2026-09-25)

| Context | What the player is doing | Surfaces | Palette |
|---|---|---|---|
| **Divine will** | the god steers a mortal | `PremonitionModal` | exists — `--premonition-whisper-*` (violet) / `--premonition-compulsion-*` (wine-plum). **Unchanged.** |
| **Encounter** | fate resolves a step | `EncounterVeil` | exists — `--veil-*` (void and ceremonial gold). **Unchanged.** |
| **Story** | a story beat unfolds | `StoryBeatModal`, `AscendantBeatModal`, `JourneyVignetteModal` | **new — hearth**: firelit umber ground, terracotta-amber accent |
| **Elder** | an elder power forces a choice | `EmergenceDilemmaModal` | **new — verdigris**: old-copper green-black ground, verdigris accent |
| **Gain** | the god's act lands; something is received | `DivineReceiptModal`, `MomentCard` (and any future `RevealCard` that reveals a gain — see below) | **new — gilt**: dark gilt ground, the one game gold as accent |
| **Information** | the player is consulting a reference | entity sheets, `EventPopup`, Omen / Mandate / Doom details, settings, every other `Modal` | **stays neutral** — the existing charcoal ramp, byte-identical |

**Two corrections to the ticket's surface list, measured on `main` @ `3b0a757f`:**
- **`MeetingEncounterModal` is not mounted anywhere.** The only reference outside its own file is a comment at `GameView.tsx:750`. The live Meet-The-First beat is `MeetTheFirstFlow`, a full-screen comic-panel flow that is not a `Modal`, which puts it out of this ticket's scope. `MeetingEncounterModal` is left untouched, because no player can see it.
- **`RevealCard`'s only standalone caller is `EventPopup`**, an information surface the taxonomy keeps neutral. Its other use is as embedded pieces inside `AscendantBeatModal`, which is already a story surface. So `RevealCard` does not hard-wire `gain`. Instead it gains a pass-through `context` prop (default neutral) that it hands to `Modal`. `EventPopup` passes none and renders exactly as today; a future reveal of a gain passes `context="gain"`. *To veto:* if event popups should read as gains, say so, and `EventPopup` passes `context="gain"`. That is a one-line change.

**Why gain takes gold, and story does not.** Law 31 already says gold is *the god's attention and the blessed*. A receipt is the god's own act landing and a reveal is a gift witnessed — gold is the polarity-free colour the law already reserves for exactly that. Story beats are mortal-scale, so they get a warm hue that is *not* gold, which keeps the two warm contexts apart at a glance.

**Gain is not polarity.** A receipt can report a failure. The gilt ground says *the god acted*, not *it went well*; the outcome word and band accent inside the receipt carry polarity exactly as today (Law 31's category-vs-polarity clarification, THR-1082). The palette never tints outcome text.

### The tokens (Law 30 variant sets)

Added to the `:root` block of `src/index.css`, directly after the Premonition block, with the same channel pattern (`-rgb` channels so one hue serves many alphas). Background gradients run top → bottom.

```css
/* ── Dialogue contexts — story · elder · gain (Law 30/45, THR-1586) ───────── */
--dialog-story-bg: linear-gradient(180deg, #1c1613 0%, #2a201a 100%);
--dialog-story-accent-rgb: 222 164 120;   /* terracotta-amber */
--dialog-story-text-rgb: 236 220 204;

--dialog-elder-bg: linear-gradient(180deg, #0f1816 0%, #172522 100%);
--dialog-elder-accent-rgb: 112 196 170;   /* verdigris */
--dialog-elder-text-rgb: 206 228 218;

--dialog-gain-bg: linear-gradient(180deg, #19160f 0%, #262012 100%);
--dialog-gain-accent-rgb: var(--veil-gold-rgb);   /* the one gold, never a second */
--dialog-gain-text-rgb: 236 224 196;

/* Shared alphas — the Premonition's measured steps, reused rather than re-derived. */
--dialog-text-dim-alpha: 0.75;
--dialog-accent-text-alpha: 0.8;
--dialog-accent-rule-alpha: 0.35;
--dialog-accent-border-alpha: 0.4;
/* Inset boxes inside a context dialog darken the ground; they never lighten it (Law 32). */
--dialog-inset: rgb(0 0 0 / 0.22);
```

**Measured contrast (WCAG, composited, worst of top stop / bottom stop):**

| Tone | Story | Elder | Gain | Floor |
|---|---|---|---|---|
| context text 1.0 | 11.9 | 11.9 | 12.3 | 4.5 |
| context text × 0.75 (dim) | 7.3 | 7.3 | 7.5 | 4.5 |
| accent × 0.8 (accent text) | 5.2 | 5.4 | 4.9 | 4.5 |
| accent 1.0 | 7.3 | 7.7 | 6.9 | 4.5 |
| `--text-primary` | 11.7 | 11.7 | 11.9 | 4.5 |
| `--text-secondary` | 8.2 | 8.1 | 8.3 | 4.5 |
| `--text-tertiary` | 5.7 | 5.6 | 5.8 | 4.5 |
| `--text-muted` | 5.0 | 4.9 | 5.0 | 4.5 |
| `--accent-gold` | 6.7 | 6.7 | 6.9 | 4.5 |

Every tone clears AA on every stop. The neutral `--text-*` and `--accent-gold` rows matter as much as the context's own tones: the surfaces' children keep using the neutral text tokens, and this table proves they stay legal on the new grounds, so no child text needs re-tokening. Method check: the same script reproduces the Premonition's recorded 5.7:1 (compulsion dim) exactly. The ratios ride in the `index.css` comments next to each token, as the `--veil-*` block does, and are locked by a test (§ Done when).

**Brightness (Law 32).** The new grounds are as dark as the shipped Premonition gradient, which is the surface Christian reacted to: relative luminance of the lighter (bottom) stop is 0.016 / 0.016 / 0.015 against the Premonition compulsion's 0.018. Both are a shade above `--bg-surface` (0.011). Law 32 reads *"background never brighter than `--bg-surface`"*, which the Premonition already exceeds. See § Law amendments — this is put to Christian rather than silently assumed.

### The mechanism — one `context` prop on `Modal` (Law 26)

The family is still chosen by what the player must do (Modal / RevealCard / EventPopup — Law 26); the palette is chosen by context, on top of the family. `Modal` composes, it is not forked:

1. **`src/components/shared/dialogContext.ts`** (new) — the single source:
   - `export type DialogContext = 'neutral' | 'story' | 'elder' | 'gain'`
   - `DIALOG_CONTEXT_CLASS: Record<Exclude<DialogContext,'neutral'>, string>` → `dialog-ctx-story` / `-elder` / `-gain`
   - `DIALOG_CONTEXT_SURFACES` — the surface → context map from the taxonomy table above, as data, **including** the two palette-owning contexts (`divine` → `PremonitionModal`, `encounter` → `EncounterVeil`) flagged `ownsPalette: true` so the styleguide and the debug accessor list all six without the Modal prop having to know about them.
2. **`src/index.css`** — three classes in `@layer components`, each setting *local* custom properties that the panel reads:

   ```css
   .dialog-ctx-story {
     --dlg-bg: var(--dialog-story-bg);
     --dlg-text: rgb(var(--dialog-story-text-rgb));
     --dlg-text-dim: rgb(var(--dialog-story-text-rgb) / var(--dialog-text-dim-alpha));
     --dlg-accent: rgb(var(--dialog-story-accent-rgb));
     --dlg-accent-text: rgb(var(--dialog-story-accent-rgb) / var(--dialog-accent-text-alpha));
     --dlg-rule: rgb(var(--dialog-story-accent-rgb) / var(--dialog-accent-rule-alpha));
     --dlg-border: rgb(var(--dialog-story-accent-rgb) / var(--dialog-accent-border-alpha));
     --dlg-inset: var(--dialog-inset);
   }
   /* .dialog-ctx-elder, .dialog-ctx-gain — same shape, own tokens */
   ```
3. **`Modal.tsx`** — new optional prop `context?: DialogContext` (default `'neutral'`). The panel's class list becomes `[contextClass, panelClassName]`; its inline style reads the local properties **with the current neutral values as fallbacks**:
   - `background: var(--dlg-bg, linear-gradient(180deg, var(--bg-deep), var(--bg-abyss)))`
   - `border: 1px solid var(--dlg-border, var(--border-gold))`
   - `Modal.Header` border-bottom `var(--dlg-rule, var(--border-gold))`, title colour `var(--dlg-text, var(--text-primary))`
   - the panel carries `data-dialog-context={context}` (the debug and test hook).
   
   **A modal with no `context` renders exactly as today** — no class, every `var()` falls back to the value it has now. That is the additive guarantee (NFP #6) for the ~20 neutral modals that are not touched.
4. **`.frame-ceremonial`** (used by `AscendantBeatModal` and `RevealCard` through `panelClassName`) changes its border to `var(--dlg-border, var(--border-gold))`, so the double frame takes its context's edge instead of fighting it. Neutral surfaces using the frame are unchanged by the fallback.

**Why a prop and not a wrapper.** A wrapper component would have to re-implement or reach into the panel to change its ground and border — a fork by another name (Law 26/27). A prop that maps to a class keeps all presentation in the primitive and the stylesheet, and the palette lives only in `index.css` (Law 30).

**Why the Premonition is not migrated onto the prop.** Its two tones (whisper / compulsion) and its own gradient are already a sanctioned, AA-locked variant set; moving it under `context` would re-derive values that are measured and loved, for no player-visible gain. "Do not flatten the existing palettes" (ticket guardrail). It stays on its own tokens and is listed in the registry with `ownsPalette: true`. The veil likewise — it is not a `Modal` at all.

### Surface adoption — what each surface changes

Minimal by design: pass `context`, and point the few accent elements that today hard-wire gold at the context accent.

| Surface | `context` | Accent adoption | Inset boxes |
|---|---|---|---|
| `StoryBeatModal` | `story` | eyebrow/label gold → `var(--dlg-accent-text)` | `var(--bg-surface)` boxes (:27, :117) → `var(--dlg-inset, var(--bg-surface))` |
| `AscendantBeatModal` | `story` | same; `.frame-ceremonial` follows automatically | :204 → `var(--dlg-inset, var(--bg-surface))`; the inner gradient at :409 is removed (the panel now owns the ground) |
| `JourneyVignetteModal` | `story` | ordeal accents → tokens (see defects) | :40, :87 → `var(--dlg-inset, var(--bg-surface))` |
| `EmergenceDilemmaModal` | `elder` | gold labels (:63, :100) → `var(--dlg-accent-text)` — on this surface the uncanny colour *is* the point | — |
| `DivineReceiptModal` | `gain` | band accent unchanged (polarity); header fallback gradient (:88) → `var(--dlg-bg)` when no art | — |
| `RevealCard` | pass-through `context` prop (default neutral); `EventPopup` passes none | `.frame-ceremonial` follows the caller's context; medallion ring stays the single bright gold (THR-799 gold budget) | — |
| `MomentCard` | `gain` | header fallback (:170) → `var(--dlg-bg)` | — |
| `EventPopup`, all sheets, Omen / Mandate / Doom, settings | *(none)* | none | none |

### Defects fixed in passing (found while measuring)

- **Undefined `--bg-base` (Law 45).** `StoryBeatModal.tsx:134` and `AscendantBeatModal.tsx:278` set `color: var(--bg-base)` on the gold primary button. `--bg-base` is defined nowhere in `index.css`, so the declaration is invalid and the label inherits the light parchment text: 1.7:1 on `--accent-gold`. Fix: `var(--bg-deep)` (8.0:1 on `--accent-gold`), the dark-on-gold pairing the codebase already uses elsewhere.
- **Literal hex in `JourneyVignetteModal` (Law 30).** `#ffd700` ×3, `#a44`, `rgba(255, 215, 0, 0.08)` — a second gold and an off-token red. Map: triumph `#ffd700` → `var(--accent-gold)`; broken `#a44` → `var(--negative)`; hover `rgba(255,215,0,0.08)` → `rgb(var(--veil-gold-rgb) / 0.08)`. The ordeal still reads distinct through its border weight and label, not through a second gold.
- **Hex fallbacks in `EmergenceDilemmaModal` (Law 30).** `var(--accent-gold, #c9a227)`, `var(--text-muted, #8a7d6b)`, `var(--text-primary, #e8dcc8)` carry hex fallbacks that differ from the tokens they back (a third gold). Remove the fallbacks — the tokens are always defined.

### The sphere tint — decided: it spreads to the card face

**Decision (veto invited):** the Premonition's per-option sphere tint becomes a shared treatment, and the shared card face adopts it for any card that draws essence from a named sphere. Christian's reaction was to exactly this colour-that-means-something; the card face is the one primitive both encounter nudge cards and action cards render through (`CardFace`), so one adoption reaches both candidate surfaces.

- **`src/components/shared/sphereTint.ts`** (new) — the recipe, extracted verbatim from `PremonitionModal.tsx:72-81`: `sphereTint(color, part)` with `part ∈ 'border' | 'bg' | 'text'` mapping to the named percentages below, via `color-mix(in srgb, <color> N%, transparent)`.
- **`PremonitionModal`** imports the helper and keeps passing its own `SPHERE_COLORS` → **zero visual change** (a test pins the three emitted strings).
- **`CardFace`** gets an optional `model.sphereTint?: SphereName`. `actionCardModel` (action cards) and the nudge-card model builder in `NudgePhaseShell` set it when `sphere && essenceCost > 0` — the same predicate THR-1607's essence-row preview already uses (`ActionCard.tsx:100`). When set: border `sphereTint(var(--sphere-<s>-bright), 'border')`, background `sphereTint(…, 'bg')`.
- **State wins over tint.** Selected, playing, resolved-band and disabled borders keep priority exactly as today; the tint is the *resting* edge only. The price text is **not** tinted on cards — its colour carries affordability, and Law 31 keeps a state signal off a category hue.
- **Tokens, not the Premonition's hex table.** Cards read `--sphere-<name>-bright` (Law 30: sphere colours flow from the sphere tokens). `SPHERE_COLORS` in `premonition-constants.ts` matches those tokens for eleven of twelve spheres; Order is `#fbbf24` there vs `--sphere-order-bright #e8c860`. The Premonition keeps its table untouched in this ticket (no flattening); the cards use the tokens.

### StyleGuide — every context side by side

New section `section-dialog-contexts` in `StyleGuide.tsx` (+ its nav entry): six static panel previews in one row — Information (neutral), Story, Elder, Gain, plus the Premonition's whisper and compulsion grounds and a veil swatch — each with a header, a body line in `--text-primary`, a dim line, an accent eyebrow and a rule, labelled with its token prefix and its worst-case contrast ratio. Panels are rendered with the same panel style `Modal` uses (extract `modalPanelStyle()` from `Modal.tsx` and use it in both — no second copy of the panel look, Law 27) and the context class, *not* via portals, so all six sit on one screen. A second row shows three `CardFace` samples with and without `sphereTint`. Law 29: this section lands in the same PR as the prop.

### Debug inspection

`window.__DEBUG.getDialogContexts()` (new, async, read-only — the `getSurfaceRegistry` pattern): returns `{ surfaces: DIALOG_CONTEXT_SURFACES, open: string[] }`, where `open` lists the `data-dialog-context` value of every mounted dialog panel. This is the state assertion for browser-verify: it proves which context the on-screen dialog *declared*, which a screenshot cannot. JSDoc in `src/debug-bridge.d.ts`.

### Event notifications / HexMapV2

N/A — no notifications, toasts or chronicle entries change; no map layer or signifier changes.

### UI Laws engaged

1 (subject carries its image — unchanged, verified on each re-skinned surface), 13/14 (no numerals or raw stance labels introduced), 17 (tooltips unchanged), 21 (links unchanged), 26 (family by what the player does, palette by context — the composition rule this plan is built on), 27 (presentation stays in the primitive), 29 (styleguide in the same PR), 30 (amended — new variant sets as named tokens), 31 (gold = the god's act; polarity stays separate from the gilt ground), 32 (see amendment), 33 (no layout change; modals still cap at 85vh), 37 (multi-beat chrome unchanged), 45 (every tone measured and locked).

## Law amendments (joint decision — Christian)

Laws change together with Christian (laws.md § Enforcement). Two amendments ride this plan; the implementing PR lands the text **only after** a `human gate satisfied via chat review <date>` comment is on THR-1586.

**Law 30 — append after the veil sentence:**

> The sanctioned variant sets are, by name: the encounter veil (`--veil-*`), the Premonition's two dream tones (`--premonition-whisper-*`, `--premonition-compulsion-*`), and the dialogue contexts story, elder and gain (`--dialog-story-*`, `--dialog-elder-*`, `--dialog-gain-*`), applied through `Modal`'s `context` prop. Each lives in `index.css` with its measured contrast next to it. Reference surfaces — sheets, popups, settings — stay on the neutral ramp, so colour on a dialog keeps meaning *this is a moment*. A new context is an amendment to this law, not a new token (amended 2026-10-02, THR-1586).

**Law 32 — clarify, so the Premonition and the contexts are legal rather than tolerated:**

> Neutral and reference surfaces never sit brighter than `--bg-surface`. A sanctioned variant set (Law 30) may lift its ground to the Premonition's level — relative luminance ≤ 0.02 on its lightest stop, roughly twice `--bg-surface` and still near-black — because a coloured moment needs a ground its hue can be seen on (clarified 2026-10-02, THR-1586).

If Christian declines the Law 32 clarification, the fallback is mechanical and already measured. Darken each context's bottom stop to `--bg-surface` luminance:

| | Story | Elder | Gain |
|---|---|---|---|
| Bottom stop | `#211a16` | `#121c1a` | `#1e1a10` |
| Luminance (L) | 0.0112 | 0.0103 | 0.0105 |
| `--text-muted` (worst row) | 5.35 | 5.42 | 5.41 |
| Accent text | 5.5 | 5.8 | 5.2 |

Every AA row stays ≥ 4.5 on those stops. The colour gets quieter; nothing else changes.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `dialogContext.ts` (registry) | none — presentation | `Modal`, `RevealCard`, `StyleGuide`, the 5 adopting surfaces | none | none — no game event | `__DEBUG.getDialogContexts().surfaces` |
| `Modal` `context` prop | none | `Modal` (+ `Header`) | none | none | `data-dialog-context` → `__DEBUG.getDialogContexts().open` |
| `.dialog-ctx-*` classes + tokens | none | `index.css` | none | none | StyleGuide `section-dialog-contexts` |
| `sphereTint.ts` | none | `PremonitionModal`, `CardFace` | none | none | StyleGuide card row |

Player controls: none added. Prose pipeline: not involved.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `--dialog-story-bg` | `#1c1613 → #2a201a` | story ground (hearth umber) |
| `--dialog-story-accent-rgb` | `222 164 120` | story accent (terracotta-amber) |
| `--dialog-story-text-rgb` | `236 220 204` | story text |
| `--dialog-elder-bg` | `#0f1816 → #172522` | elder ground (verdigris black) |
| `--dialog-elder-accent-rgb` | `112 196 170` | elder accent (verdigris) |
| `--dialog-elder-text-rgb` | `206 228 218` | elder text |
| `--dialog-gain-bg` | `#19160f → #262012` | gain ground (dark gilt) |
| `--dialog-gain-accent-rgb` | `var(--veil-gold-rgb)` | gain accent = the one game gold |
| `--dialog-gain-text-rgb` | `236 224 196` | gain text |
| `--dialog-text-dim-alpha` | `0.75` | dim tone; first AA step on the lighter stop (Premonition precedent) |
| `--dialog-accent-text-alpha` | `0.8` | accent carrying words |
| `--dialog-accent-rule-alpha` | `0.35` | header rule / vignette rule |
| `--dialog-accent-border-alpha` | `0.4` | panel edge |
| `--dialog-inset` | `rgb(0 0 0 / 0.22)` | inset boxes darken the ground |
| `SPHERE_TINT_BORDER_PCT` | `25` | card / option edge in sphere colour (Premonition recipe) |
| `SPHERE_TINT_BG_PCT` | `3` | card / option ground wash |
| `SPHERE_TINT_TEXT_PCT` | `87` | option cost text (Premonition only; not used on cards) |
| `DIALOG_CONTRAST_FLOOR` (test) | `4.5` | Law 45 floor the lock test asserts |

## Tracing

No game trace types are emitted — the change is presentation only and touches no engine path (NFP #2 is served by the debug accessor and the `data-dialog-context` attribute instead).

```ts
// Not a trace — the debug accessor's return shape (src/debug-bridge.d.ts).
interface DebugDialogContexts {
  /** The surface → context registry, as shipped in this build. */
  surfaces: ReadonlyArray<{
    surface: string;                 // component name, e.g. 'StoryBeatModal'
    context: 'neutral' | 'story' | 'elder' | 'gain' | 'divine' | 'encounter';
    ownsPalette: boolean;            // true for PremonitionModal / EncounterVeil
  }>;
  /** `data-dialog-context` of every dialog panel mounted right now. */
  open: string[];
}
```

## Fail-soft table

| Failure case | Fallback |
|---|---|
| A surface passes no `context` | Neutral — no class, every `var(--dlg-*)` falls back to today's value. Byte-identical rendering. |
| A context class is missing from the stylesheet (bad build, typo) | The `--dlg-*` properties are undefined, so the panel falls back to neutral. Never unstyled. The lock test fails the build first. |
| A card's sphere has no `--sphere-<name>-bright` token | `color-mix` with an invalid colour is dropped by the browser → the card keeps its neutral edge. `sphereTint` is only called with `SphereName`, so this is type-prevented. |
| `color-mix` unsupported (very old browser) | The declaration is ignored; the card or option keeps its untinted style. Information never rides on the tint alone (the sphere icon remains). |
| `getDialogContexts()` called with no dialog open | `open: []`. |

## Three-pillar check

- [x] Engine pillar present (or N/A with rationale) — N/A: presentation only
- [x] Content pillar present (or N/A with rationale) — N/A: no prose
- [x] UI pillar present (or N/A with rationale) — the whole feature
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It serves "the player is a god reading the world": colour that tells the god *what kind of moment* this is, while reference surfaces stay quiet.
- [x] No Vision edit needed. The two Law amendments are design-system edits, decided with Christian (§ Law amendments).

## Rulebook impact

- [x] This plan does not change a rule of play (turn structure, action verb, prerequisite, resource, encounter, clock, win/loss)
- [ ] N/A — `Docs/canon/rulebook.md` is not edited

> Brainstorm companion: `Docs/plans/2026-10-02-thr-1586-dialogue-palettes-by-context-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every colour and alpha is a named token in `index.css`; the tint percentages are named constants. Retuning a context is a one-block edit. |
| 2. Inspectability | PASS with note | No game traces (presentation only); inspectability is the `data-dialog-context` attribute, `__DEBUG.getDialogContexts()`, and the styleguide section showing every context with its ratios. |
| 3. Determinism | PASS | No randomness anywhere in the change. |
| 4. Fail-soft | PASS | Every `var(--dlg-*)` carries today's value as fallback; see fail-soft table. |
| 5. Narrative over mechanical perfection | PASS | The palette exists to make the moment legible as a story beat, a gift or an elder intrusion. |
| 6. Additive over destructive | PASS | New optional prop, new tokens, new classes; neutral modals untouched. The only removals are three Law 30/45 defects. |
| 7. Performance budget | N/A | CSS custom properties and one class per mounted dialog; no per-tick cost. |

## Kill criteria

- **A neutral modal's snapshot or screenshot changes.** A fallback is wrong. Fix the fallback, never the snapshot.
- **Story and gain read as the same at a glance** in the styleguide row. The warm pair has failed. Push story further toward terracotta, re-measure, then ship.
- **Christian says a context "doesn't feel like" its moment** after seeing the styleguide. Retune that context's three tokens. The mechanism stays.
- **The card tint makes the hand read as noise** in the encounter veil. Stop setting `sphereTint` on the card models. The helper and the Premonition stay.

## Done when

- [ ] The tokens, classes, `dialogContext.ts`, the `Modal` `context` prop and `sphereTint.ts` exist as specified; all five adopting surfaces in the map pass their context and `RevealCard` forwards one; neutral modals pass none.
- [ ] **Lock test** `src/components/shared/__tests__/dialogContextTokens.test.ts` parses `index.css` and asserts, for story / elder / gain on both gradient stops: context text 1.0 and × dim alpha, accent × accent-text alpha, and `--text-primary/-secondary/-tertiary/-muted` + `--accent-gold` all ≥ `DIALOG_CONTRAST_FLOOR` (the `encounterVeilLaws.test.ts` method).
- [ ] **Registry test:** each surface in `DIALOG_CONTEXT_SURFACES` without `ownsPalette` renders a `Modal` whose panel carries the matching `data-dialog-context`; a `Modal` rendered with no `context` has no `dialog-ctx-*` class and the neutral inline background (render tests, jsdom).
- [ ] **Premonition unchanged:** a test pins `sphereTint` output for the three parts against the strings `PremonitionModal` emitted before extraction.
- [ ] **Card tint:** a `CardFace` test — tinted when `sphereTint` is set, untinted otherwise, and a selected card's border is the selected border, not the tint.
- [ ] The three defects in § Defects fixed in passing are fixed (grep: no `--bg-base`, no hex in `JourneyVignetteModal`, no hex fallbacks in `EmergenceDilemmaModal`).
- [ ] `Docs/design-system/tokens.md` gains a § Dialogue contexts section (the taxonomy table + token prefixes); `component-selection.md` notes the `context` prop on the Modal row.
- [ ] Law text: the Law 30 amendment (and the Law 32 clarification, if accepted) land in `Docs/design-system/laws.md` **only after** the chat-review gate comment is on THR-1586.
- [ ] Browser-verify at 1920×1080 (Playwright), four-part evidence (`Docs/canon/verification-gates.md` § Browser-verify): (1) screenshots of `?view=styleguide` § dialog contexts (all six side by side + card row), and one live surface per new context where the run reaches it on `?view=game&seeded&size=medium`:
  - **Story:** whichever of `StoryBeatModal` / `AscendantBeatModal` / `JourneyVignetteModal` opens within `__DEBUG.tick(200)`. Do not `suppressBeats`.
  - **Gain:** the `DivineReceiptModal` of a divine act with a modal-tier receipt.
  - **Neutral:** one sheet, to show it is unchanged.

  A context the run does not reach is recorded as `Browser-verify substitution: styleguide § dialog contexts — <reason>`. Elder is always recorded this way, because no URL summons `EmergenceDilemmaModal`. (2) Console output. (3) `await window.__DEBUG.getDialogContexts()` showing the open dialog's context. (4) UI-Laws line citing the Laws in § UI Laws engaged.
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build`, `check:generated-freshness`, `check:wiki-freshness:blocking` green; closing commit body carries the close keyword for THR-1586 on its own line.

## Coordination block

**Suggested model:** opus — shared primitives (`Modal`, `RevealCard`, `CardFace`) touched across five surfaces with a contrast lock; low algorithmic risk, high consistency burden.

**Parallel-safe with:** THR-1572 (spell generator — engine/data), THR-1686 / THR-1687 (engine), THR-1660 (pilgrim way — location/congregation pages, no `Modal`/`CardFace`/`index.css :root` edit), THR-1683, THR-1522, THR-1294, THR-964, THR-984, THR-912, THR-662 (no shared files).

**Mutex with:** THR-893 — both edit `src/debug-bridge.ts` and `src/debug-bridge.d.ts` (this adds `getDialogContexts`). THR-829 — only if its overlay work touches `CardFace` or `index.css`; check at claim time. Any ticket editing the `:root` token block of `src/index.css`, `src/components/shared/Modal.tsx`, `src/components/shared/CardFace.tsx` or `PremonitionModal.tsx`.

**Files to touch:**
- Create: `src/components/shared/dialogContext.ts` (type, class map, surface registry)
- Create: `src/components/shared/sphereTint.ts` (the extracted recipe + constants)
- Create: `src/components/shared/__tests__/dialogContextTokens.test.ts`, `dialogContextRegistry.test.tsx`, `sphereTint.test.ts`
- Edit: `src/index.css` (tokens after the Premonition block; `.dialog-ctx-*` classes; `.frame-ceremonial` border)
- Edit: `src/components/shared/Modal.tsx` (`context` prop, `data-dialog-context`, `--dlg-*` reads with fallbacks, export `modalPanelStyle()`)
- Edit: `src/components/shared/CardFace.tsx` (optional `sphereTint` on the model; resting border/bg only)
- Edit: `src/components/Game/ActionCard.tsx`, `src/components/Game/encounter-stage/shells/NudgePhaseShell.tsx` (set `sphereTint` on the model when `sphere && essenceCost > 0`)
- Edit: `src/components/Game/PremonitionModal.tsx` (import `sphereTint`; no visual change)
- Edit: `StoryBeatModal.tsx`, `AscendantBeatModal.tsx`, `JourneyVignetteModal.tsx`, `src/components/ruins/EmergenceDilemmaModal.tsx`, `DivineReceiptModal.tsx`, `MomentCard.tsx` (context + accent/inset adoption + defects)
- Edit: `src/components/shared/RevealCard.tsx` (pass-through `context` prop to `Modal`; default neutral)
- Edit: `src/components/StyleGuide/StyleGuide.tsx` (`section-dialog-contexts` + nav)
- Edit: `src/debug-bridge.ts`, `src/debug-bridge.d.ts` (`getDialogContexts`)
- Edit: `Docs/design-system/tokens.md`, `Docs/design-system/component-selection.md`, `Docs/design-system/laws.md` (after the gate)

## Notes for the executor

- **Do not touch the Premonition's or the veil's tokens.** They are listed in the registry for the styleguide only. The Premonition's change is an import, nothing else.
- **Neutral is the default and stays byte-identical.** If a screenshot of a reference sheet changes, something leaked — the fallbacks are the contract.
- **State colours inside a context dialog keep their meaning.** Step dots, selected options and outcome-band accents stay `--accent-gold` / polarity tokens even on a story or gain ground; only decoration (eyebrows, rules, the edge, the ground) takes the context hue.
- **The gold budget on gain surfaces.** The taste profile allows one gold emphasis per panel.
  - The gain accent is gold, so on a gain ground it appears only at the rule, edge and accent-text alphas (0.35 / 0.4 / 0.8), never as a full-strength fill.
  - The single full-gold element stays whatever it is today: the medallion ring, or the primary button where there is no medallion.
  - If a gain surface ends up with two full-gold elements, dim the decorative one, never the state one.
- **The tint is the resting edge only.** `CardFace` also writes `data-sphere-tint="<sphere>"` on a tinted card, so a browser-verify run can assert which cards are tinted without reading computed colours. Never let it override a selected, playing, resolved or disabled card border, and never tint the price.
- **`MeetingEncounterModal` and `MeetTheFirstFlow` are out of scope.** The first is unmounted, and the second is a full-screen flow, not a `Modal`. Do not adopt either.
- **Blast radius is moderate, not high:** `Modal` has ~24 importers and `CardFace` ~8 — below the ≥100 threshold, so no Blast Radius section, but run the full suite: snapshot tests of neutral modals must not change (if one does, a fallback is wrong).
- **Law text waits for the gate.** Ship tokens, prop and adoption whether or not Law 32 is accepted; the fallback in § Law amendments is the alternative values, already measured.

## Intent-judge verdict

**Allow** (2026-10-02, `fable`, cold context; impact class Reversible confirmed). Ten of eleven dimensions passed. The judge re-verified the plan's factual claims by grep:
- `MeetingEncounterModal` appears only in a comment.
- `--bg-base` is defined nowhere.
- `EventPopup` is `RevealCard`'s sole standalone caller.
- `Modal` and `CardFace` have 24 and 8 importers. The plan said 26 and 9; this is now corrected.

It judged the surface-list corrections as fidelity. The ticket lists `RevealCard` under Gain and `EventPopup` under the bolded "stays neutral", and the plan resolves that contradiction toward the bolded verdict.

One gap was fixed before commit: kill criteria existed only in the action proposal, and now have their own section. Advisory items were also folded in: a veto line on the `RevealCard` correction.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-02*

### NFP audit

**PASS-with-notes.**

| NFP | Verdict | Reason |
|---|---|---|
| 1. Tunability | PASS | Every colour, alpha and tint percentage is named. |
| 2. Inspectability | PASS-with-note | No game traces, correctly so; `data-dialog-context`, `getDialogContexts()` and the styleguide stand in for them. Note: tinted cards had no readout. Fixed: `CardFace` writes `data-sphere-tint`. |
| 3. Determinism | PASS | No randomness. |
| 4. Fail-soft | PASS | Every `var(--dlg-*)` falls back to today's value. |
| 5. Narrative | PASS | Polarity stays off the gilt ground. |
| 6. Additive | PASS-with-note | `.frame-ceremonial` and the `AscendantBeatModal` inner gradient change. Both are guarded by fallbacks and the kill criteria. |
| 7. Performance | N/A | |

Law 32 is gated, with a measured fallback.

### Three-pillar audit

**PASS.**
- **Engine and Content:** N/A, with rationale.
- **UI:** present and substantive. Taxonomy, tokens with measured contrast, mechanism, per-surface adoption, defects, sphere-tint decision, styleguide, debug accessor, Laws engaged, amendments. HexMapV2 and notifications are N/A with reason, and the screenshot tool is named.
- **Required sections:** none missing. Blast Radius is correctly omitted (below 100 importers).
- **Wiring:** maps all four modules to UI component and debug visibility, with "none" plus rationale for phase, state and trace.

### Vision audit

**PASS-with-notes.**
- **North star** (moments witnessed by a god): extended.
- **Core loop** (time stops for every moment): confirmed. Clock and order untouched; the Veil and Premonition are not flattened.
- **Non-negotiables:** #2, #3, #6 and #7 confirmed. No numerals are added for the player.
- **Tensions:** not leaned on. Neutral reference surfaces keep a counter-pull against over-decoration.
- **Taste note, gold budget:** a gain ground with a gold accent could stack a second or third gold emphasis beside the state golds. Fixed: § Notes for the executor › gold budget keeps the gain accent at rule, edge and text alphas, with one full-gold element per panel.
- **Taste note, always dark:** the new bottom stops sit within the `--bg-abyss`…`--bg-raised` range. The Law 32 lift is flagged for Christian.
