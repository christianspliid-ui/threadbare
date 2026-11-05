# Action proposal — Legibility 4, the god rail, the Ledger rail, lists and the hover tier (THR-2125)

## intent_quote

> "get the design lane to focus on UI and UX improvements for the next period. specifically legibility and usability of the different UI modules: are we using tried and true ux patterns for how humans read UI panels..."

(Christian, chat, 2026-11-01. The ticket [THR-2125](https://linear.app/threadbare/issue/THR-2125) is the last of four plan-doc tickets carved from the closed map THR-2114. Its body asks for: **God rail** — essence quantities at `--text-sm` 600, tabular and right-aligned; "Your cards" takes the one section heading with its count after the words; the "Your First:" and "Essence … Primary" label-beside lines become sentences or label-above (Law 16). **Ledger rail and lists** (Threads, Chronicle, Notables, Find, toasts) — one rail Title for "Threads" and "Chronicle", group heads as Labels; the thread row's name is Text 700 `--text-sm` instead of 17 px Cinzel and is never the part that truncates; the Threads panel loses its frame (depth 4 → ≤ 2); "Agents (1)" becomes the inline count. **Hover tier** — the tooltip heading becomes Text 700 (no Cinzel below 22 px); the hover card puts its name beside its picture with the kind above, and its second line becomes Now. The rails use the docked Inspector's density for every block they share.)

## scope (what this plan does)

God rail: the essence balance rises to `--text-sm` (600, tabular, right-aligned stay); the Essence heading becomes the shared `SectionLabel`; "Primary: Mind" becomes the sentence "Your primary sphere is Mind." under the heading; "Your First:" becomes "Your First is" before the chip; literal gaps go to tokens, `--space-6` between rail sections. Ledger rail: a local `RailTitle` gives "Threads" and "Chronicle" one title; the Threads panel's frame and the Chronicle's gold box go; the thread row's name becomes Alegreya Sans 700 `--text-sm`, sentence case, wrapping instead of truncating; 11 px badges rise to `--text-xs`; "Before you woke" becomes a plain label. Lists: `ListRow.Title` becomes 700. Hover tier: the tooltip heading becomes Alegreya Sans 700 at its current size and colour; the hover card's name becomes `--text-sm` 700; its subtitle joins the kind label on one line (Panel anatomy § 5); its Now line under the name is the page's one R5 highlighted headline (a mortal's strongest want, the god's Mandate), absent when the page has none, and the body section stops repeating it. (Revised after the first judge run: the first draft restyled the subtitle and called it Now.) `getListDressing()` reports the row name's face, size, weight and clipping, and the frame depth. Two canon pages record it.

Already shipped and **not** re-planned (measured): "Your cards" with inline count, the "Agents · 1" count format (both Legibility 1), the hover card's picture beside a kind-above-name block (art-led slice 7).

## scope (what this plan does NOT do — explicit non-goals)

- No engine or type change.
- No change to Notables, Find or toast layouts beyond `ListRow.Title`'s weight; measured, they already use ladder sizes.
- No change to the identity strip, the folded rows, the essence grid's shape (unless a kill criterion fires) or the hand.
- No tooltip size change; no tooltip placement change.
- No change to the Inspector (Legibility 2) or the Stage and dialogs (Legibility 3).

## impact_class

Reversible

## evidence cited

- **Linear issue:** THR-2125
- **Vision premises invoked:** vault `Vision/taste-profile.md` ("Prose-first UI, no numbers visible"); art-led rule R1 (`Docs/plans/2026-10-31-art-led-ui-pass.md`)
- **UL terms touched:** none new ("First", "sphere", "Threads", "Chronicle", "Before you woke" are existing)
- **Canon pages consulted:** `Docs/design-system/laws.md` (Laws 1, 13, 16, 17, 21, 31, 33, 36, 37, 57), `typography.md`, `layout-zones.md`; audits `2026-11-01-ui-panel-anatomy.md`, `-type-hierarchy.md`, `-text-positions.md`, `-modules-and-composition.md`, `-legibility-census.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-11-02-thr-2122-legibility-shared-blocks.md` (merged), `Docs/plans/2026-11-01-thr-2103-art-led-lists.md` (merged), `Docs/plans/2026-11-01-thr-2099-art-led-god-rail.md` (merged)
- **Rejected approaches considered and dismissed:** label-above for "Your First"; dropping "Primary"; raising tooltip sizes; keeping the Chronicle box; one-line clamp; a shared RailTitle primitive; a one-column essence grid now. All in the brainstorm companion.

## load-bearing decisions touched

None. Presentation only.

## high-impact files touched (from Codesight)

None with 100 or more importers. `shared/Tooltip.tsx` has 69; the change is one heading's face and weight.

## kill criteria

- Essence balance at `--text-sm` squeezes a pool bar under 24 px → one-column grid; if that pushes the hand under one card row → back to `--text-xs`.
- `--space-6` between rail sections leaves under one card row → `--space-5`.
- A thread name wrapping to three lines → two-line clamp with a `title`.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- The ticket lists "Your cards" and "Agents (1)". Measured, both shipped in Legibility 1; the plan says so and does not re-plan them. Likewise "the hover card puts its name beside its picture with the kind above" shipped in art-led slice 7; only its name size and second line are left.
- "Sentences or label-above (Law 16)": the plan picks sentences for both lines and names label-above as the veto fallback.
- Decision 2 (removing the Chronicle's box as well as the Threads frame) goes beyond the ticket's letter. It follows Modules § 3 and § 4. If you read the Chronicle's box as a pressable object, say so.
- Decision 4 keeps the tooltip at one size, so "Text 700" is applied as face and weight, not size. Flag it if you read "Text" as requiring `--text-sm`.
- "Notables, Find, toasts" are named in the ticket. Measured, they already use `--text-sm` / `--text-xs` and `SectionHeading`; the only change there is the bold row name through `ListRow`. Find and toasts do not use `ListRow` and are left unchanged.
- I did not run a browser this run. Fit claims are gated by the kill criteria and the Done-when's debug reader.
