# Action proposal — 2026-10-14-thr-1879-type-and-icons-rollout

## intent_quote

From the Linear issue THR-1879 (written from Christian's carve-up of the wayfinder map THR-1823, 2026-10-14):

> Author one plan doc in `Docs/plans/` through `design-session` and hand it to Ready for Dev. The decisions are settled input; cite each decision ticket inline where it is used. … Scope: the font files and tokens, the icon registry and its concept→shape table, the credits screen line, and the sweep order for legacy surfaces that are not retired by the Inspector. Bug THR-1874 (six broken effect escapes) lands first as its own ticket.

> **Added 2026-10-14 (Christian, chat):** places are carved too. Place shapes join the icon registry, and both the map's `LOCATION_ICON_REGISTRY` drawings and the place emoji retire. Our own drawings stay only for spheres, reaches and heraldry. Disease is `plague-doctor-profile`, Ambition is `holy-grail`, and Poison gets its own `poison-bottle`.

> **Binding (UI Law 58, Christian 2026-10-14):** the UI grows by adding entries, not by writing screens. The concept → shape table is the one icon list. A concept without a shape fails a test that names it, and an unknown concept shows a plain fallback mark, never an emoji. The table gets a row in `Docs/design-system/extending.md` that replaces today's "several places" row.

From the spawning session's brief (attended session, 2026-10-14, relaying Christian's chat):

> The plan doc must specify: the font files and tokens: ship Alegreya and retire Georgia as `--font-prose`, using THR-1819's type steps; the label sweep: sentence case, no tracking (the ratchet's `uppercase` row); tabular figures, and no monospace on player surfaces; the vendored carved subset: how the shapes are fetched once, stored as single-path data with licence metadata, and checked in; the concept → shape table as the one icon list. It covers all ~330 concepts from the inventory, grouped by class: picks for every class, with icons that read as fantasy-period objects (Christian rejected a bacteriophage and mountain summits), one shape per concept, and a uniqueness test; the place shapes; the credits-screen line (CC BY 3.0 authors, with the recolouring noted), plus a note on the DRM clause; retiring the emoji, symbol and PNG duplicate sets (Law 9); the sweep order for legacy surfaces the Inspector does not retire; the unknown-concept fallback mark (Law 58); the `extending.md` row that replaces the "several places" icon row.

> For the full concept table, propose the picks and mark low-confidence ones. If a class has no obvious period object, list two or three candidates for that class in a "for Christian's eye" appendix rather than deciding it. Christian likes to judge icons on a sheet: produce an HTML sheet of the proposed picks next to today's glyphs … Commit it under `Docs/audits/`.

## scope (what this plan does)

Specifies the type-and-icons rollout for the map-first screen: the Alegreya font files, licence and tokens (repointing `--font-prose`, the prose shorthands, the label token and classes, a tabular-figures token), the classification of every `--font-prose` site, the monospace removal, the label rule and its sweep order; the vendoring script that fetches game-icons.net shapes once from the upstream repository at a pinned commit with per-icon authors; the concept → shape table (219 ideas, one shape each, 285 game keys mapped across 15 classes, settled/proposed/unsure marked); five open classes (28 ideas) with three candidates each for Christian; the place shapes and their boundary with the map build (THR-1878); the unknown-concept fallback mark and resolver; the credits lines (icons, fonts) and the DRM note; the Law 9 retirements and dead-table deletions; the legacy sweep order and skip list; the new `extending.md` row. It carves the build into S1 (this ticket) plus four slice tickets and one ticket reserved for Christian's pick, and commits an HTML review sheet under `Docs/audits/`.

## scope (what this plan does NOT do — explicit non-goals)

- It does not decide the five open classes (doom kinds, strands, card verbs, places of power, rival tempers); they go to Christian.
- It does not build the `Icon` primitive, the registry format, the ratchet or the type steps (THR-1885, THR-1821, THR-1819).
- It does not switch the map's place textures, activity sprites, avatar sigil or map label weights (THR-1878).
- It does not migrate surfaces that the Inspector, the frame, the Stage or the dialog-tier builds retire or rebuild; those are built on the rules from day one by their own tickets.
- It does not fix THR-1874 (that bug lands first as its own ticket).
- It does not change any rule of play, engine system, graph shape or trace.
- It does not re-open THR-1833 or THR-1834; their settled picks are kept exactly.

## impact_class

Reversible. Docs-only in this PR (plan doc, companion, proposal, the review sheet, one `extending.md` status cell). The build it specifies changes presentation only; any pick is swappable as one entry.

## evidence cited

- **Linear issue:** THR-1879 (and its comments; THR-1833 and THR-1834 comments; THR-1826 inventory; THR-1885; THR-1874)
- **Vision premises invoked:** Dark Tapestry (dark world, gold as importance), NFP 5 narrative over mechanics, Law 13 words not numbers; vault `Vision/taste-profile.md` label entry corrected by Christian on THR-1833 (2026-10-14)
- **UL terms touched:** none new (icon, label, credits are not UL terms; "Inspector", "land page", "Needs you" are THR-1882's proposal and used as written there)
- **Canon pages consulted:** `Docs/design-system/laws.md` (Laws 9–12, 15, 57, 58), `Docs/design-system/extending.md`, `Docs/design-system/typography.md`, `Docs/canon/interface-map.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-14-thr-1819-1440p-layout-contract.md`, `Docs/plans/2026-10-14-thr-1821-component-library-and-ui-debt-ratchet.md`, `Docs/plans/2026-10-14-thr-1820-dialog-size-tiers.md`, `Docs/plans/2026-10-14-thr-1822-view-model-seam.md`; decision records `Docs/audits/2026-10-13-thr-1833-type-system-decision.md`, `Docs/audits/2026-10-14-thr-1834-icon-family-decision.md`, `Docs/audits/2026-10-12-thr-1828-screen-frame-decision.md`, `Docs/audits/2026-10-11-thr-1827-inspector-decision.md`, `Docs/audits/2026-10-14-thr-1830-map-lenses-decision.md`
- **Rejected approaches considered and dismissed:** vendoring from Iconify (no per-icon author); an icon font or npm icon package (THR-1834 ruled out); per-key shapes for all ~330 keys (one shape per idea instead); mapping dead tables; a root `text-transform: none` override (sentence case must be in the strings); lucide for chrome (THR-1834 ruled out)

## load-bearing decisions touched

None of CLAUDE.md's load-bearing architectural decisions (graph, reaches/spheres, ascendants, node types, edges, agent position, awareness, world mutation, caches, distance matrix) is touched. The rejected approach "❌ KayKit GLTF 3D models — replaced by flat hex grid with 2D signifier art" is respected: places stay flat 2D marks on the hex map.

## high-impact files touched (from Codesight)

None with ≥ 100 importers. `src/index.css` is imported once; `shared/Modal.tsx` has 24 importers (close glyph only, in S4a).

## kill criteria

- A carved shape is misnamed at 18 px in play → swap that one entry; if most of a class fails, the class becomes an open class for Christian.
- Alegreya makes prose harder to read at 1080p → fix through THR-1819's step first; only then raise the face with Christian.
- The ceremonies overflow at 1920×1080 after the prose step → narrow the prose column to `--measure-prose`; do not revert the step.
- The vendored path data passes its size budget → move it to a lazily loaded chunk; the registry API does not change.

## explicit user sign-off

Not required (Reversible). Christian asked in chat on 2026-10-14 for this plan to be written now; the decisions it builds on are THR-1833 (label rule confirmed by Christian in chat 2026-10-14) and THR-1834 (human gate satisfied via chat review 2026-10-14).

## author notes for the judge

- The concept table has two layers on purpose: ideas (one shape each, 219) and keys (285, many pointing at the same idea). "One shape per concept" is read as one shape per idea, which is how THR-1834 already grouped "Debt, bargain" under one shape.
- "Covers all ~330 concepts" is met by: 285 mapped keys, 28 open ideas, 40 own-drawn concepts (spheres, reaches, faction marks) and the dead tables, each with an explicit disposition. Retiring surfaces' marks are not mapped.
- Fifty-four picks are marked unsure. That is deliberate: the brief asked for low-confidence picks to be marked, and Christian reviews on the sheet; the build ships them unless he vetoes, and a swap is one entry.
- Uncertainties: the 18 px legibility of several unsure picks in the real UI; whether `public/the-game.html` still ships (it holds the sphere PNGs); the exact ratchet baseline for the new `display-face-small` row (measured at landing).
- An authoring-session waiver applies: Christian asked for the five carve-up plans in parallel today, which waives the lane's one-day veto window on THR-1828..1833; recorded in the plan.
