# Brainstorm companion — THR-799 Ceremonial reveal surface

**Plan doc:** `Docs/plans/2026-07-26-thr-799-ceremonial-reveal-surface.md`

## The ask, verbatim (paraphrased)

Christian shared a Civilization VI "Tech Unlocked" card screenshot: "can you integrate design/UI learnings from this card into our game's design system? I would like us to get to this level of fidelity and space in our UI when we show minor game elements like attachments, action cards, traits, smaller events."

## Options considered

### A. One-off restyle of EventPopup (rejected)

Restyle the existing popup to look like the reference. Rejected: the ask is explicitly about the *design system* — a one-off restyle leaves attachments, traits, and action-card reveals improvised flat, and the next surface re-invents the pattern. The fidelity gap is systemic (missing primitives), not local.

### B. New standalone CeremonialModal component (rejected)

A parallel modal implementation with its own backdrop/escape/portal logic. Rejected by the design system's own anti-pattern rule ("don't create a new modal component when Modal with custom body works") and by NFP #6 — Modal already owns overlay behavior; duplicating it forks maintenance.

### C. Primitives + compound surface on Modal (chosen)

Extract the reference card's reusable atoms (medallion, quote well, inset band) as shared primitives, compose them into a `RevealCard` compound built on `Modal`, and run a same-PR adoption pass over the four existing minor-element surfaces. Chosen: matches how the design system already grew (SectionHeading ornamental, RarityBorderBox), keeps the tier reusable, and the primitives are independently useful in sidebars.

### D. Full presentation-tier redesign including sidebar rows (deferred)

Extending ceremonial fidelity into every sidebar row/list. Deferred: rows are density surfaces; the reference card's lesson is about *moments*, not lists. Medallion chips reach rows via the trait adoption, which is enough for v1.

## Key judgment calls

- **Category title vs item name at the top** — the reference puts the moment-kind first ("TECH UNLOCKED") and the item in a banner band below. Kept exactly; it is the single strongest hierarchy lesson in the card.
- **Threadbare voice for category titles** — "TECH UNLOCKED" is boardgame-utilitarian; Threadbare's register is mythic. Drafted as content table (`REVEAL_CATEGORY_TITLES`) so wording is tunable and Christian gets final say via chat review.
- **Dismiss is `secondary`, not `primary`** — the reference OK is visually quiet. A gold primary button would out-shout the medallion.
- **No new engine triggers** — the plan deliberately consumes only existing events; missing reveal moments become engine-side deferrals. Keeps the ticket single-pillar-deep and executor-safe.
- **Flavor quote sourcing** — reuse existing prose fields; fallback table only for elements with no prose. Avoids a content-authoring subproject inside a UI ticket.

## Open questions (carried into the handoff as grey zones)

1. Final wording of `REVEAL_CATEGORY_TITLES` — creative call for Christian post-implementation.
2. Whether the EventPopup "sphere-carrying" heuristic is the right split for which popups get the ceremonial path — executor may propose a `PopupItem.presentation?: 'ceremonial' | 'compact'` field if the heuristic misfires (additive, engine-adjacent but type-only).
3. Corner filigree v2 — assess after seeing v1 in the browser.
