# Brainstorm companion — Finish the component library and one UI-debt ratchet (THR-1821)

> Companion to [`2026-10-14-thr-1821-component-library-and-ui-debt-ratchet.md`](2026-10-14-thr-1821-component-library-and-ui-debt-ratchet.md). Records the alternatives weighed, the tensions, and the premises the plan rests on. Authored by a design session spawned from the attended groundwork session of 2026-10-14.

## Premises

- **The overhaul is a rebuild, so the cheapest moment to fix the library is before the rebuild starts.** The groundwork brief's build order (decision 10) says new surfaces use the new primitives from day one and nothing the Inspector retires is migrated. Everything below is shaped by that: primitives the new surfaces need, a gate that stops new debt, and as little legacy churn as possible.
- **A counter beats a rule.** `laws.md` already says "tokens only" (Law 30) and "choose from the tree" (Law 26); 680 colour literals and 203 raw buttons exist anyway. The rules were never wrong; nothing counted. The ratchet is what makes them hold.
- **One place per behaviour.** Escape order, backdrop, z-band, focus, chip anatomy and icon drawing each have exactly one implementation, so a fix lands once (THR-1816's lesson: the bug was a second Escape path).

## Decision 1 — How to count UI debt

| Option | Verdict |
|---|---|
| **A node script with per-row regex detectors over comment-stripped source, a committed per-row baseline, fail on any increase** | **Chosen.** Same shape as the two ratchets the repo already trusts (`check:typecheck`, the chip-referent ratchet); runs in a second; rows are data. |
| ESLint rules (`no-restricted-syntax`, a custom plugin) | Rejected for counting. ESLint reports violations; it does not ratchet a count, so it is red on arrival with 203 buttons, and `npm run lint` is not a CI step today. A rule per pattern could follow later for editor feedback, once counts are low. |
| One total across all patterns | Rejected. A drop in one row would hide a rise in another, and the failure message could not say what to write instead. |
| Per-file ceilings (fail when any file grows) | Rejected. Moving a block between files would fail the build and churn the baseline; the typecheck ratchet made the same call ("the gate is the TOTAL only"). |
| A full AST walk per pattern | Rejected as unnecessary. The compiler API is used only to drop comments robustly (re-print with `removeComments`); the patterns themselves are lexical. |

**Tension.** Regex detectors have false positives and negatives. The guards: fixtures per detector, the ±10 % re-measure check at landing, the suspect-drop verdict for a detector that silently stops matching, and the kill criterion (narrow the detector, never raise the baseline).

## Decision 2 — Which rows

- **Split colours into hex and function rows** rather than one row, because the fixes differ (a hex becomes a token; an `rgba` often becomes `rgb(var(--x-rgb) / a)`), and the two numbers were reported separately in the ticket.
- **Split glyphs into UI and data rows,** because the data tables (`sphereIcons.ts`, `nudge-card-display.ts`, `calling-content.ts` …) are where icon vocabularies are declared and migrate as concept-class maps, while the UI row is mostly inline use. One row would mix two burn-downs.
- **Add `escape-listener`,** though the brief did not list it: it is the precise detector for THR-1816's bug class, which the ticket names as the reason for Overlay. Counting `'Escape'` string literals was rejected — element-scoped handlers (a search box clearing on Escape) are legitimate and would make every new input fail.
- **Add `radius-literal` and `shadow-literal`,** so the new token sets are enforced from the day they exist. Counting Tailwind's default-scale `rounded*` classes was debated: they are "a scale", but not ours, and they duplicate our values through a parallel system. They count; `rounded-full` and `50%` do not, because a circle is a shape, not a radius choice.
- **Fold THR-1833's three type rows in here** because that decision assigned them to this ticket. `Georgia` alone measures 0 (it only arrives through `--font-prose`), so the row was widened to any face named outside the tokens — it catches the Palatino stacks in the encounter shells, which are the same problem.
- **Not a row: hand-built panel shells.** A shell is `--bg-surface` plus a border plus a radius; the detector cannot tell it from a row background. The radius and shadow rows catch shells indirectly.
- **WebGL colour data excluded from colour rows only.** Three.js materials take numbers; asking the palette to read CSS variables would be a renderer redesign, not debt repayment.

## Decision 3 — Radius and shadow levels

| Option | Verdict |
|---|---|
| **Four levels by hierarchy (page / panel / control / chip)** | **Chosen** — the ticket asked for exactly this, and it matches the measured clusters (12 / 8 / 4 / pill). |
| A size scale (`--radius-sm/md/lg`) | Rejected. A size scale says nothing about *which* to use, which is how 33 distinct values happened. A level name answers "what is this thing?". |
| px values | Rejected. The root step-up at 2560 scales rem by 1.125; px radii would look relatively smaller at 1440p than everything around them. Chips stay `999px` (a pill at any size). The same reasoning puts chip heights, chip padding and tab heights in rem. |
| Tokens in `:root` only | Rejected in favour of Tailwind `@theme static`, which yields the CSS variables (always, thanks to `static`, even when only inline `var()` reads them) **and** `rounded-panel` / `shadow-panel` utilities on first use, so Tailwind-written components get a sanctioned form too. Fallback if it misbehaves is in the plan's kill criteria. |

## Decision 4 — Overlay

| Option | Verdict |
|---|---|
| **A React primitive on the existing escape registry and `useDialogFocus`** | **Chosen.** Both already work and are tested; the registry's band-then-order rule is exactly the Inspector's Escape order. |
| Native `<dialog>` with `showModal()` | Rejected. It gives a top layer, an inert background and a `cancel` event only on the topmost dialog — attractive — but everything portaled to `body` (tooltips at 70 + depth, dropdown menus at 9999) renders *under* the top layer, breaking Law 35's table and every tooltip inside a dialog. The Stage's below-top-bar placement would also fight it. |
| A React context stack instead of the module registry | Rejected. The registry is UI input routing on one `document`; THR-1816 documented why module scope is right there. Non-overlay consumers (armed card, move mode) would need the provider anyway. |
| Overlay owns sizes | Rejected. THR-1820 owns dialog tiers; the Inspector and the Stage own their geometry (brief decision 7). |

## Decision 5 — Panel versus Card

- **Keep both names:** Panel is the shell; Card is the titled Panel. Merging Card into Panel (one primitive with optional slots) was considered — "card" collides with the god's playing cards everywhere else in the game — but renaming touches tests, the styleguide and the barrel for a word agents can be told about in one line. The decision tree states the split, and the collision is called out.
- **Card's `raised` variant changes background** (`--bg-raised` → `--bg-surface` + shadow) to fit the panel level. Accepted because no game screen uses `Card`.
- **A dev-only nesting warning** was preferred over a lint rule: nesting is visible only at runtime (composition across files).

## Decision 6 — Tabs

- **One primitive with `kind="tabs" | "toggle"`** instead of a separate `SegmentedControl`: the two look identical by ruling (the lens bar's underline), differ only in ARIA and in whether "none" is allowed. Two components would drift visually within a month.
- **Never gold.** THR-1830 ruled the lens bar's pressed state "an underline (never gold)". Applying it to all tab rows keeps one look, and keeps gold meaning the god's attention (Law 31). `interactions.md`'s gold *selected* state stays for selected list rows — selection of a world object, not navigation chrome.
- **No overflow scrolling.** A tab row that does not fit is a layout defect; with at most four lenses and three Chronicle tabs, no new surface needs scrolling tabs.

## Decision 7 — Chip

| Option | Verdict |
|---|---|
| **One `Chip` with a required `role`** | **Chosen.** The role decides what must be carried (identity: image + link; state: the word; count: number + spoken label; keyword: vocabulary word), so the type system enforces the laws per role. |
| Four components (`IdentityChip`, `StateChip`, …) sharing a base | Rejected. That is how twenty components happened; the ticket asked for one component with variants. |
| Free-form `variant` strings | Rejected. A variant without obligations repeats the drift. |
| Thread-row badges stay on `IconButton` | Considered. They are buttons with a glyph; but they *are* counts (Law 40, Law 49), and moving them onto `count` gives the needs-you pill, the strip and the rows one look. `IconButton`'s badge slot routes through the same chip. They move in THR-1879's sweep, once their carved icons exist. |
| Icon-only count at 1 | Rejected. THR-1834's label rule gives every icon in a chip or strip a word or a count; a count chip shows its number even at 1, and its words live in the tooltip, as the Ledger strip's do. |

**Name clash.** In the UL and Law 56, "chip" means a Consequence Chip. The component keeps the name `Chip` (the generic pill); the catalog row says a Consequence Chip is `Chip role="state"` with a kind tag. No UL change: the UL governs game terms, and a component name never reaches a player.

**Tension.** The consequence chip (SCAR / BOND / BOON / PATH) is the richest chip: a kind tag, a sentence and a delta cluster (Laws 15, 16, 56). It maps onto `state` with a keyword kind tag and the magnitude slot, but it moves with the Stage build, which is reshaping the aftermath anyway.

## Decision 8 — Icon

| Option | Verdict |
|---|---|
| **Registry of path data + one resolver + one `<Icon>`** | **Chosen.** THR-1834's Unity note: path data ports to an atlas or vector import; React components do not. |
| A React component per icon (lucide's model) | Rejected for the same reason, and because a per-icon component cannot be iterated for the registry tests (unique shapes, meanings). |
| SVG sprite sheet with `<use href>` | Rejected. It needs a served asset and a build step for the sheet; inline paths are ~1 KB each and render without a fetch (Law 54's waiting state never applies). |
| Icon font (RPG Awesome) | Rejected in THR-1826: frozen subset, no new icons, and a font-loading flash. |
| `label` optional on all icons | Rejected. Making the props a union (`decorative` or `label`) is what stops a meaning-bearing icon shipping silent — the THR-1826 finding that "many meaning-bearing glyphs … have no legend". |

**Where the line with THR-1879 falls.** The first draft had the Icon slice vendor the carved subset and put a credits section under Settings. THR-1879 (filed from the same map) already owns "the icon registry and its concept→shape table, the credits screen line, and the sweep order", and the intent judge caught the overlap. The split now: this plan owns how an icon is drawn (primitive, data format, resolver, uniqueness tests, `ICON_CREDITS` as a function, the ratchet rows); THR-1879 owns what the icons are (the shapes, the concept table, the credits line and its home, the sweep). S3 seeds only a `fallback` we draw, so it ships with no licence obligation; the credits line arrives with the first carved shape. (An earlier revision seeded our map place drawings as `place-*` names; Christian's amendment to THR-1834 the same day made places carved too, so the place shapes are THR-1879's like every other carved shape. The registry's `{ d, opacity }[]` shape still matches what the map's texture builder rasterises, which is why the map can read places from the registry.)

## Decision 9 — Slicing

- **The ratchet first, as this ticket,** because THR-1822 is mutex on it and blocked until it exists, and because it changes no surface (low risk, sonnet-sized).
- **Overlay + Panel together** (they share `Modal`'s re-base) and **Icon + Chip + Tabs together** (Chip and Tabs take `IconName`; once the carved subset moved to THR-1879, the Icon primitive alone was too small for its own ticket).
- **Each surface moves once.** The first draft moved Harvest, Warm Start, Scry and the Codex onto `Overlay backdrop="void"` as ceremonies; THR-1880 (THR-1820's slice 2) then tiers the same six as dialogs. THR-1829 puts the Divine Court among dialogs and only Meet the First, the Threading Rite and the Remembrance among ceremonies, so S2 now leaves THR-1880's six alone and moves only the true ceremonies; for the other hand-built dialogs it swaps the Escape listener and nothing else.
- **Rejected: one big ticket.** It would hold the ratchet hostage to the slowest primitive and produce a PR no review gate can read.

## Premises at risk

- If the frame or Inspector build starts before S2 and S3 land, the build order breaks and those surfaces will hand-roll. Mitigation: the slices are small and parallel where the files allow; the new-surface tickets should list the slice tickets as blockers when they are filed.
- If THR-1820's tier work and S2's `Modal` re-base run at the same time they conflict on one file. Mitigation: the mutex line on both.
