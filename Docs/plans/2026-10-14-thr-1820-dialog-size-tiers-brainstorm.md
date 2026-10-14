# Brainstorm companion — Dialogs grow before they scroll (THR-1820)

> Companion to [`2026-10-14-thr-1820-dialog-size-tiers.md`](2026-10-14-thr-1820-dialog-size-tiers.md). Written alongside the plan in the design session of 2026-10-14. The law itself and the cross-cutting numbers (screens, breakpoints, root step-up, 85vh, one ratchet, containers are not tiers) were settled in the attended groundwork session that morning; this file records the *how* choices this plan made on top of them.

## The problem in one line

Every dialog picks its own width from a free number that does not change at 2560, and no rule says a panel must use the room it has before it scrolls or cuts a list.

## Paths considered

### A. Fixed widths per screen, four named tiers, a law, a counted debt (chosen)

Four sizes (S 600 / M 960 / L 1280 / XL 1760 at 1080p; 675 / 1080 / 1600 / 2240 at 1440p; XL 2880 at 3440), declared in THR-1819's tier blocks: S and M as rem text containers declared once, L and XL as px frame values per tier. `Modal` and `RevealCard` take `size`; `Modal`'s `maxWidth` stays, deprecated and counted (row `modal-maxwidth`). Law 57 says when a panel may scroll. A debug report makes the law checkable in the browser.

- **For:** two exact designs to verify, at the two screens the verify contract captures; every number named (NFP #1); retiring surfaces need no edit.
- **Against:** between 1920 and 2559 wide the dialog does not grow at all. Accepted: those screens are not targets (brief rule 1), and the clamp keeps them safe.

### B. Fluid tiers, `min(cap, N vw)` (the issue's example)

`M = min(960px, 55vw)`, `L = min(1400px, 72vw)`.

- **For:** grows smoothly on every screen width.
- **Against:** every width between breakpoints is a different layout, so the 1080p and 1440p screenshots stop being the whole story; at 1920 the issue's M is already 960 and at 2560 it is still 960, so the 1440p screen gains nothing at M. Rejected; the fluid part survives only as the safety clamp (`100vw - 2 × gutter`).

### C. Five tiers including "Stage"

The issue listed Stage as a tier. **Rejected by the brief** (rule 7): the Stage and the Inspector are containers with their own geometry from THR-1827 / THR-1829. The law still binds them, through "the limit is the container's own".

### D. Automatic growth — the panel measures its content and steps up a tier

- **For:** no author ever picks the wrong tier.
- **Against:** a dialog that changes width while it is open jumps under the reader's eye; the result depends on content measured at run time, so two players see different shapes of the same dialog; jsdom cannot test it. Rejected. The rule "step up before you fold" puts the same judgement on the author at design time, and the debug report's `atCap` flag is the evidence.

### E. Rem-based tiers for all four (scale with the root step only)

S = 37.5rem → 600 / 675. Right for S and M: they hold text and cards, so their measure should step exactly with the type, and on a 2560 × 1080 screen (where THR-1819's height guard keeps the root at 16 px) they should stay at their 1080p size. Wrong for L and XL: a 1440p screen has a third more width, and L / XL exist to use it, so they should take more than the ×1.125 type step. **Taken in part:** S and M are rem (THR-1819's text-container family), L and XL are px per tier (its frame family). The first draft of this plan used px for all four (S 680 at 2560); THR-1819's draft, which appeared mid-session, made the two-family split the house convention, and this plan follows it.

### F. Two-column layout by container query instead of a context

`@container (min-width: …)` on the panel. Rejected: container queries cannot read custom properties either, so the threshold would be a hidden literal; a context makes the column count a plain value the container states and a jsdom test can assert. The Inspector then states its own mode per size.

### G. Keep the RevealCard `+N` chip as ceremonial calm

THR-799 capped consequence chips at four. Under Law 57 that cap is exactly a fixed-count cut while the panel has room. The chips already wrap, and today only the styleguide renders the row. Removed.

### H. Migrate the hand-built overlays in this ticket

The six dialogs that keep a dialog home but are hand-built (`SettingsPanel`, `ChoiceSetModal`, `ScryOverlay`, the Codex overlay, `HarvestScreen`, `WarmStartOverlay`) could move onto `Modal` now. Rejected for slice 1: THR-1821's Overlay slice moves most of them onto its new `Overlay` (and `ChoiceSetModal` onto `Modal`), and counts the hand-built overlays. Moving them here too would make two executors rebuild the same files. They become THR-1880, blocked by both, which only applies the tier once THR-1821 has given them their backdrop.

### I. Tiers on `Overlay` as well as `Modal`

The first draft let THR-1821's `Overlay` take a `size` too. THR-1821's draft rules that `Overlay` sizes nothing ("Sizes belong to `Modal`'s tiers … and the owner"). Taken: the tiers live on `Modal`; an owner that draws its own panel on an `Overlay` sizes it with `dialogSizeStyle(<tier>)`. One sizing vocabulary, one primitive that owns it.

## Trade-off card

| Choice | Gain | Cost |
|---|---|---|
| S = 600 at 1080p (not 560) | every default caller unchanged at 1080p | the 420 px popup grows to 600 — a short notice in a wider box |
| M = 960 (not 1040) | clear step from S and to L; four cards fit with the hand's 12 px gap | the gift modal's 24 px card gap must narrow |
| L matches the Stage panel | a dialog and a moment read at one scale | L at 1440p is only 1.25× L at 1080p while the screen is 1.33× |
| XL fixed height | multi-pane surfaces do not jump as content changes | a short Codex filter leaves empty height (acceptable for a work surface) |
| S / M / L stop at 2560 values on 3440 | prose keeps its measure | 3440 shows the same dialog with more dimmed screen around it |
| Chapter Ledger page 25 → 40 | the index fills its column before paging | one engine-file constant changes (UI-consumed, no tick reader) |

## Tensions surfaced

- **Law 36's "first screenful" vs Law 57.** Law 36 says a panel that needs a scrollbar in its first screenful should fold. Law 57 says grow first. Read together: the screenful is the panel at its limit. Recorded as a cross-reference line under Law 36 rather than an edit of its ratified text.
- **THR-1828's `NEEDS_YOU_NEWS_MAX = 12`.** Decided before the law. At 2560 the 60vh drop-down holds about 20 rows, so a cut at 12 would break Law 57. The plan states the consequence for the frame build; it does not re-decide the drop-down.
- **The harvest: dialog or ceremony?** The cycle-end harvest is about what the god carries into the next cycle, which is close to the Stage decision's ceremony test ("who the god is becoming"). Today it is a centred panel on a dark backdrop, so the plan keeps that shape and tiers it M. Making it full-screen ceremony would be a creative call for Christian, not a sizing one.
- **The Divine Court leaves full screen.** The Stage decision lists it as a dialog; the court's sphere art moves from a full-screen wash to the L dialog's left column. The art is kept, only its frame changes. THR-1821's draft instead groups the court and the Codex layer with the "full-screen ceremonies" on a void backdrop; that conflicts with THR-1829's three homes and the brief's rule 7, and is reported back rather than settled here.
- **A four-card gift narrows.** M (960) is below the gift modal's computed 1008 px for four cards; the row closes to the hand's 12 px gap. The cards keep their size; only the gaps shrink.

## Vision premises this plan leans on

- **The Map Is the Table** (map THR-1823): the map stays the subject; dialogs are the god's own business and stay centred over it, sized to their content rather than to a 1080p habit.
- **Law 26:** the surface is chosen by what the player must do; the tier is then chosen by what the content needs — weight never buys width.
- **Law 55:** a story's record is one click away — the Chapter Ledger reading beside its index keeps both on one screen.
