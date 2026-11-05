# Brainstorm companion — Legibility 4, the rails, lists and the hover tier (THR-2125)

Companion to `Docs/plans/2026-11-03-thr-2125-legibility-rails-lists-hover.md`. The considered alternatives, in one line each.

## Considered and not taken

- **Re-plan "Your cards" and "Agents (1)".** Measured as shipped by Legibility 1 (`HandSection.tsx:233`, `SectionHeading.tsx:20`). Re-planning them would duplicate work already merged.
- **"Your First" as a label above the chip.** Keeps the words but costs a rail line, and it is still a label for a single value (Law 16's case). A sentence reads in one pass. Left as the veto fallback.
- **Drop "Primary: Mind" altogether.** The primary pool already reads brighter in the grid, but colour alone is not a word, and a new player asks which pool is "theirs". Kept as a sentence.
- **Raise the tooltip heading and body to `--text-sm`.** Text role at rail density, but the doom tooltip's heading already wraps to two lines at 16 px in a 280 px box. Kept at one size; weight and gold carry the heading.
- **Keep the Chronicle's gold box and remove only the Threads frame.** It follows the ticket's letter, but the two rail sections would then be drawn two ways (Modules § 4). Both go; a divider rule is the fallback.
- **Clamp thread names to one line with a tooltip.** That is truncation by another name, and the anatomy says a row's name is never the part that is cut. Wrap first; clamp at two lines only as a kill-criterion fallback.
- **A new shared `RailTitle` primitive in `shared/`.** Two callers, both in the Ledger rail. A local `frame/RailTitle.tsx` is enough. `ledgerComponents.tsx` is ruled out because it imports both panels (a cycle).
- **Make the essence grid one column now.** It gives the larger numbers room but doubles the block's height. Kept as a kill criterion, measured after THR-2148's "53 / 55".

## Tensions

- The rail gets taller (`--space-6` between sections, one more line under Essence). The hand absorbs it because it fills the free height (`AscendantBar.tsx:243–247`). The kill criterion guards one full card row.
- Bold list-row names across Chronicle, Notables and Rivals change three surfaces through one line in `ListRow.tsx`. That is the point of the shared block (Law 58), and the cost is that a single veto reverts all three.

## Vision premises

Prose-first UI (`Vision/taste-profile.md`): two label strips become sentences, and no new number appears.
