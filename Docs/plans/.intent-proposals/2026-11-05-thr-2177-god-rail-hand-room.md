# Action proposal: the god-rail hand gets room (THR-2177)

## intent_quote

> "It's a tiny window, about 3 cards tall … 12 cards in a slot that fits 3" (warm playtest round 3, the skimmer, quoted in THR-2177)

> THR-2177 Done when: "at 1920×1080, on a warm world with 12 cards in hand, at least 6 hand cards show without scrolling, nothing renders below the fold (Law 33), and the Essence block still reads every pool the god holds."

> Christian, chat 2026-11-01 (period focus for the design lane): "get the design lane to focus on UI and UX improvements for the next period. specifically legibility and usability of the different UI modules: are we using tried and true ux patterns for how humans read UI panels for how we organize the core UI panels and the information, including: relative text positions, font sizing, modularization and composition"

## scope (what this plan does)

Gives the god-rail hand the room to show at least six cards at 1920×1080. Each hand card becomes one line (name left, price right; the same words). The essence pool row stops its trend arrow from making the bar line taller (50 → about 42 px), keeping every part it has. The hand gets a floor of three card rows, and the folded rows at the rail's foot give way and scroll inside their own block instead of pushing the hand to 0 px. One line of canon is added to `layout-zones.md`. Layout only, in five UI files.

## scope (what this plan does NOT do — explicit non-goals)

- No change to any player-facing word, including the price "Mind · 10 essence".
- No essence pool is hidden, folded or compacted to an icon. Every pool keeps its icon, word, "N / M", bar, rung and arrow.
- No change to the hand's grouping-at-the-limit rule (`handFit` grouped mode), the folded rows' content, the identity strip or the Seat line.
- No engine, type or view-model change.
- No change to the rail's width or the type scale.

## impact_class

Reversible. UI layout in five files, no state, no data.

## evidence cited

- **Linear issue:** THR-2177 (also covers THR-2176, the one-card clip)
- **Vision premises invoked:** vault `Vision/taste-profile.md` (prose-first UI; no new numbers)
- **UL terms touched:** none new (hand, essence, pool, sphere)
- **Canon pages consulted:** `Docs/design-system/laws.md`, `Docs/design-system/layout-zones.md` § God rail, `Docs/canon/rulebook-quick-reference.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-11-03-thr-2125-legibility-rails-lists-hover.md` (rail density, balance size, the `--space-5` fallback); the THR-2119 text-positions decision (`Docs/audits/2026-11-01-ui-text-positions.md`); THR-2148 ("53 / 55" and the bar to the limit, Christian's choice)
- **Rejected approaches considered and dismissed:** icon-only compact pool cells (Law 11: 34 px); folding the unused pools (the Done-when and Law 53); dropping "essence" from the price (not needed); two-column folded rows (too narrow); removing the refill key (Law 12)

## load-bearing decisions touched

None. The rail is UI chrome; no graph, cache or position rule is involved.

## high-impact files touched (from Codesight)

None. Importer counts (grep of `from '…/<name>'` over `src`): `HandSection` 4, `handFit` 2, `AscendantBar` 4, `EssenceBlock` 4.

## kill criteria

- A card name in the warm-150 hand loses more than its last two letters at 1920: that row's price wraps to its own line, and the PR says so.
- The arrow overlaps the rung or the bar's end: revert the arrow change and drop the rail gap to `--space-5` instead.
- After the build, the hand region at 1920 (caption closed, no moment open) is shorter than six one-line rows: the plan was wrong about the budget. File the shortfall as a follow-up, with the measured numbers, rather than hiding pools.
