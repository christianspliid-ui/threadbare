# Brainstorm companion — Legibility 3, the Stage and the dialogs (THR-2124)

Companion to `Docs/plans/2026-11-03-thr-2124-legibility-stage-and-dialogs.md`. Records what was weighed and not taken.

## Alternatives considered

- **Define `--text-2xs` (11 or 12 px) instead of moving its uses to `--text-xs`.** Rejected. Type hierarchy § 3.1 keeps the six-step scale, and `--text-xs` is the floor every label already uses. The undefined token is a bug, not a missing step: half its uses render 11 px through a fallback, and half inherit whatever their parent is.
- **Keep Palatino as the Stage's "period" display face.** Rejected. It is outside the three-face system (census finding 4), resolves differently per machine (the veil's stack falls back to Book Antiqua or generic serif), and carries hierarchy by face instead of by the ladder (rule 13). Cinzel is the game's display face; the Story face (Alegreya) carries the period voice in prose.
- **Scene prose as `--type-flavor` (italic) instead of `--type-body-prose`.** Rejected for scene paragraphs. The type-hierarchy decision names `--type-body-prose`, and italic at length reads slower. The earlier step's answer line is a quoted recap, so it keeps italic as `--type-flavor`.
- **Draw the step column's frame away by making the Stage panel transparent.** Rejected. The panel is the surface; the column is the one that duplicates it. The in-place veil (outside the Stage) keeps its void because there it is the surface.
- **A new `DialogTitle` component.** Rejected. `Modal.Header` already serves six dialogs; adding an optional `kind` line is smaller and keeps "learned once" (Modules § 4).
- **Change `RevealCard` itself (left-align its Title, drop the Banner well).** Rejected. `RevealCard` serves the ceremonies (ThreadingRite, EventPopup), where centred single display lines are allowed (Text positions § 2). Only the choice dialog stops using those zones.
- **Card names as Text 700 `--text-sm` from the start.** Held as the kill-criterion fallback. Type hierarchy § 3.1 names the Headline for a card name on a full card face, so the plan tries that first and measures wrapping.

## Tensions

- **Bigger prose versus the fold.** Scene text grows from 16 to 20 px and the drop cap from 54 to 68 px. The census measured a 196 px empty band between the prose and the card row at 1920, and the UX review found short chapters filling only the top half of the panel, so it should fit. The kill criterion measures it with the new `anatomy.fold` reader rather than eyeballing a screenshot.
- **The court's centred gallery.** The court lays out portraits in centred groups. Text positions § 2 puts headings on the left edge. The plan moves only the headings; the portrait grids keep their centring, because they are pictures, not text.

## Vision premises

- Prose-first UI, no numbers visible (vault `Vision/taste-profile.md`): the story becomes larger and upright; nothing numeric is added.
- Art-led R1: the art column is untouched, so the art still leads by size on the left while the title leads by position on the right.
