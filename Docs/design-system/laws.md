# UI Laws — the Dark Tapestry constitution

> **Status:** binding once ratified. Authored 2026-08-06 at Christian's direction: *"reverse engineer our UI laws from the design system, and the prototypes for the aftermath, encounter prototypes and looking through our many discussions and brainstorms on the ux experience."*
>
> **What this file is:** the collated, numbered law book for every player-facing surface. The design-system files describe *how* (tokens, components, motion); this file states *what must always hold*. A law is checkable — a reviewer with a screenshot and this file can say "Law 4 violated" without re-deriving intent.
>
> **Provenance marks:** **[E]** = established — already stated in a binding source (cited). **[P]** = proposed — reverse-engineered from prototypes, precedents, or director corrections, awaiting Christian's ratification. A [P] law is followed until vetoed; a veto deletes or amends it here.
>
> **Loaded by:** the `frontend-ui` skill (mandatory for any UI-pillar work). Cited by ticket Done-whens as "the UI Laws hold on the changed surface" — laws do not need restating per ticket (THR-1004).

---

## I. Subject representation

1. **[E] Every game concept the player sees carries its presentation: image, tooltip, and link.** A concept named in text only is a pattern violation — same severity as a viewport-contract violation. Magnitudes render as words. (THR-637/639/1004; `entity-visual-header.md`, `artifact-representation.md`, `frontend-ui` §7.)
2. **[E] The surface never guesses which words are concepts — the producer declares them.** Data crossing engine→UI carries its concept references as structured fields (`EncounterAftermathChange.concepts` is the reference implementation), never as English to be parsed. (THR-1004; `frontend-ui` §8.)
3. **[E] One resolver per representation class.** Entity art resolves through `resolveEntityVisual`; tooltips through `resolveTooltip`; action faces through `ACTION_ART`/`ActionCard`. Never a second resolution path, never hand-plumbed lookups in a component. If a surface needs behavior the resolver lacks, extend the resolver. (`entity-visual-header.md` §Do-not.)
4. **[E] Fallbacks are designed states, never broken ones.** Missing art = authored glyph on an id-hashed gradient (stable per entity, `gradientIndexForId`, never random — NFP #3). A 404 swaps in place with no layout shift. If a fallback reads as "unfinished", that is a bug. (`entity-visual-header.md` §Fallback tiers.)

## II. Images

5. **[E] Three canonical sizes, three aspect ratios:** `hero` 16:9 (places, scenes, banners) · `portrait` 3:4 (people) · `chip` 40px square (secondary entities inline). New surfaces pick from these; a fourth size is a design decision, not an implementation choice. (`entity-visual-header.md`; `STYLE.md` §Aspect Ratios.)
6. **[E] Art is pre-baked and static** — generated ahead of time into registries, resolved at render; no runtime generation, no external fetches. Card art ships 1376×768 JPG q95 with letterbox bars cropped; map signifiers are 1:1 semi-transparent PNG. (`STYLE.md`; art-recipe precedent THR-740.)
7. **[P] In-card image bands are "small generic images", not heroes.** A card's picture band (nudge cards: 78px) identifies the *kind* of thing; the hero illustration belongs to the stage, not the card. Do not promote card bands into scene art.
8. **[E] Person imagery is knowledge-gated; places, items, and encounters never are.** Below `recognised`, a person renders the silhouette fallback even when art exists. Intel is additive, never subtractive. Fail-open when the gate is unwired. (`entity-visual-header.md` §Knowledge gating.)

## III. Icons

9. **[E] Every game-system element class has exactly one icon vocabulary**, and membership is enforced at build time: spheres → `SphereIcon`; reaches → `ReachIcon` (the icon set, not ad-hoc PNGs — THR-972 §2); card types → keyword chip glyphs keyed on the live type union, where *a new type without an icon is a build failure, not a blank chip* (THR-890); codex kinds → codex glyphs; rarity → `RarityBadge`.
10. **[E] Distinct meanings get visually distinct vocabularies.** Cost pips, odds pips, and forecast pips once shared one look and the director could not tell them apart at 13px (THR-972 §5): price now wears a framed badge; pips mean only "effect on the odds", everywhere. Never reuse a glyph row for an unrelated quantity.
11. **[E] Icon legibility is a constant, not a vibe.** Glyph sizes are named constants; the shipped floor after THR-972 is ~14px for meaning-bearing glyphs, and an icon carrying meaning *alone* (no text label beside it) sizes up (reach chip 34px). Shape is the accessibility channel, colour the secondary one; every glyph row carries an `aria-label` stating its reading in words ("Strong, 3 of 5"). (THR-890.)
12. **[P] An icon new to the player is introduced with a legend or tooltip at first contact.** The hand's glyph legend (THR-972) is the pattern: never require the player to infer a vocabulary from context alone.

## IV. Words, never numerals

13. **[E] No raw magnitudes on any mortal-facing surface.** Difficulty is `gentle/fair/steep/severe`; forecast is `doomed/perilous/uncertain/favorable/fated`; derived change sentences band their deltas the same way (`engine/aftermathWords.ts`). Numbers live in traces and the designer view only. No percentages anywhere player-facing. (Ruling 6, THR-772/868; THR-1004.)
14. **[E] No raw internal keys, ever.** `star.positive`, template ids, `snake_case` enums — all resolve through display vocabularies before render. A key the vocabulary cannot resolve renders as its best plain-English fallback and warns once, never as the key. (THR-1004; keyvalue precedent THR-608.)
15. **[E] Pips are the one sanctioned magnitude glyph language** — twenty ~5% steps in four tiers of five, shape changing per tier — and they annotate words, never replace them. (THR-890.)
16. **[E] Key:value labels bolted onto prose are unfinished UX.** Information reaches the player woven into sentences or as designed chips — never as a debug-style label strip. The factor line carries its source *in the sentence* (THR-820); the chip carries a kind tag *plus a sentence* (mockup chip anatomy). (THR-608 / THR-883 finding 2.)

## V. Tooltips

17. **[E] Every concept word carries a tooltip from the one registry** (`resolveTooltip`: `ui.*`, `sphere.*`, `reach.*`, `terrain.*`, `archetype.*`, `doom.*`, `agent.*`). New concepts register; components pass ids, never inline copy for game concepts. (THR-926 precedent; `tooltipResolver.ts`.)
18. **[E] Tooltip copy is plain-register what-and-why, ≤200 characters** (enforced by `tooltipValidation.test.ts`), explaining the concept from the game-system perspective without leaking numbers. (THR-926; ruling 6.)
19. **[E] Tooltips chain.** `{{concept.id}}` references inside a description render as nested hoverable links, to `TOOLTIP_MAX_CHAIN_DEPTH`. A concept mentioned inside a tooltip is itself a concept. (`Tooltip.tsx`.)
20. **[E] The tooltip is Tier 1 of a three-tier ladder, and it never dead-ends.** Hover = summary (tooltip); click = the entity's card/panel; deeper click = the profile/sheet. Where a deeper surface exists, the hover tier must lead to it. (`frontend-ui` progressive disclosure; `component-selection.md`.)

## VI. Navigation

21. **[E] Every named entity is clickable where a page exists — and the link routes by kind.** Agent → agent surface, faction → faction sheet, artifact → artifact sheet; a wrong-kind link that opens the wrong drawer is a dead link that looks live. No page yet = plain styled text, fail-open. (THR-971/1004.)
22. **[E] Map-located entities carry the zoom-to-map affordance** (the eye icon / "Show on map") wherever they are listed. (`Docs/ui-patterns.md` §1.)
23. **[E] Escape always closes the topmost overlay; backdrop and close affordances follow `Modal`'s contract; `:focus-visible` is never suppressed; interactive `<div>`s carry `role="button"` + keyboard handlers.** (`interactions.md`.)
24. **[P] Depth is always escapable and oriented.** Any surface deeper than two levels shows where you are (`DetailBreadcrumb`) and returns cleanly — closing a deep sheet returns to its parent surface, not to the void.
25. **[P] A control that does nothing does not render.** Disabled-with-reason is fine (dimmed card + why); silently inert is not (the notice-badge lesson, THR-935; the resolved-dots decision, THR-1003 — no-op replay dots render disabled, not clickable).

## VII. Components and reuse

26. **[E] Choose from the decision tree before building; never a new component when a primitive composes.** New modal features use `Modal`; the RevealCard/Modal/EventPopup family is chosen by *what the player must do* (decide / witness a gain / be informed), not by felt importance. (`component-selection.md`.)
27. **[E] Shared primitives are the only place presentation logic lives** — `EntityVisual`, `Tooltip`, `Medallion`, `ListRow`, `Card`, `EntityCard`, `OddsPips`, `StepDots`, `RarityBorderBox`, `Section`… A surface styling its own tooltip or entity tile is forking the design system. (`primitives.md`; Medallion rule in `artifact-representation.md`.)
28. **[E] The canonical-presentation registry decides how each artifact class renders** (agent = portrait header, action = its card face, location = hero landscape, …). A new surface whose subject is a registry row states which visual + info source it uses, in its plan's UI pillar. (`artifact-representation.md`.)
29. **[E] The styleguide is the living contract.** Every shared primitive renders at `?view=styleguide` with sample data; a new primitive lands with its styleguide entry in the same PR. (CLAUDE.md dev routes; THR-637.)

## VIII. Color

30. **[E] Tokens only — never hardcoded hex in components.** Sphere colors flow through `--sphere-color` from `sphereColors.ts`; gains/losses through `--positive`/`--negative`; rarity through its accent set. (`tokens.md`.)
31. **[E] Polarity coloring is consistent game-wide:** green = works for the mortal / gain; red = against / loss; gold = the god's attention, seeds, and the blessed; neutral warm text = context without pull. Factor lines, chips, and outcome bands all follow it. (`NudgePhaseShell` polarity map; mockup chip tones.)
32. **[E] Always dark.** No light mode; background never brighter than `--bg-surface`; art direction is neon-against-dark. (`INDEX.md` core constraints; `STYLE.md`.)

## IX. Layout, viewport, and modularization

33. **[E] The game fills exactly one viewport: 1920×1080 contract, nothing scrolls at page level, nothing renders below the fold.** Panels scroll internally (`flex-1 overflow-y-auto`); modals cap at 85vh; wide rows scroll on their own axis (the card row), never the page. (CLAUDE.md §Viewport Contract; THR-890.)
34. **[E] A scrollable centered column uses safe centering** — content centers when it fits and top-aligns scrollably when it does not; plain `justify-content: center` over a scroll zone strands the top unreachably. (THR-925.)
35. **[E] New elements land in a named layout zone and z-band** (`layout-zones.md`); z-index is taken from the stacking table, never invented.
36. **[P] Long lists are progressive, not exhaustive:** grouped sections with expand/collapse (`Section` + `ListRow`), counts on the group header, detail on demand. A panel that needs its own scrollbar within the first screenful of items should be collapsing groups instead. Expanded/collapsed state survives within a session.

## X. Flows, interrupts, and attention

37. **[E] A multi-beat flow wears one chrome.** Every surface of an encounter — each step *and* the aftermath — carries the same identity header: encounter title, subject context strip, step position with per-step outcome colors. The ending of a thing says what it is the ending of. (THR-1003.)
38. **[E] The canonical encounter flow is fixed:** *Why they're here → Scene → Test & Forecast → The Hand → Fate → Outcome → Aftermath (prizes · tolls · seeds — all clickable).* Surfaces may compress a beat, never reorder them. (2026-07-26 mockup, header line.)
39. **[E] At pause-tier attention, every beat interrupts on its own and pauses the sim** (registered in the interrupt registry); badges are the recovery route, never the primary one. Auto-resolve tier gets badges only. (THR-668/934/1005.)
40. **[E] A notification affordance never destroys what it counts.** Clicking a badge shows the things it counted before (or as) it clears; a target that fails to open leaves the badge standing. (THR-935; `handleOpenEncounterBadge` guard.)
41. **[E] Motion follows the motion inventory** — entrance staggers for ceremony (the veil's `watchedEntrance`), fades for information, nothing bouncing for its own sake; durations from `motion.md`'s table.

## XI. Language on surfaces

42. **[E] Game prose, not novel prose; plain register; no second person outside the god's own actions; the vagueness lexicon targets zero.** UI microcopy explains mechanism, not mood. (`Docs/canon/prose.md` rule zero; THR-868/883.)
43. **[E] Placeholders never leak.** Every player-facing string passes enrichment; a raw `{token}` reaching a screen is a released defect with a regression lock. (THR-923/933.)

---

## Enforcement — how laws bind (the part that failed before this file existed)

- **The skill loads this file.** `frontend-ui` is a mandatory load for UI-pillar work, and its §7 checklist + §8 anti-patterns cite these laws; the executor lane's prompt names that load as required, not suggested.
- **Done-when by reference:** a UI ticket's acceptance implicitly includes "the UI Laws hold on the changed surface *as composed*, not merely on the code added" (the THR-971 lesson: green on the parts, wrong on the whole). Browser-verify is a judgment against Laws 1, 13, 14, 21, 33, 37 — not just an evidence screenshot.
- **Machine gates where a machine can check:** tooltip length (`tooltipValidation.test.ts`), numerals/keys in derived player strings (`aftermathWords` tests; extend to any new producer), icon-per-type build failures (THR-890 pattern), viewport contract assertions. A law a machine can check should acquire its check in the same PR that first relies on it.
- **Change protocol:** amending a law follows `INDEX.md` §Change Protocol, plus one line in `Docs/changelog.md` naming the law number. Laws marked [P] are ratified or vetoed by Christian in chat; the mark then changes to [E] with the chat date as source.
