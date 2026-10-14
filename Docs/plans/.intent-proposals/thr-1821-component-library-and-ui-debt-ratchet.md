# Action Proposal — THR-1821 component library and UI-debt ratchet

Plan doc: `Docs/plans/2026-10-14-thr-1821-component-library-and-ui-debt-ratchet.md`

---

## intent_quote

> "do we have an easy to expand UI component library still or have we started to do one-off implementations"

(Christian, 2026-10-11 UI review, quoted in the THR-1821 description.)

The issue's own design-output list (Christian's ticket, 2026-10-11):

> 1. Specs for Tabs, Chip (one component, variants by role: identity / state / count / keyword), Overlay (backdrop + z-band + escape stack, which also fixes the class of bug in THR-1816), Panel (surface shell with radius/border by hierarchy level), and Card adoption.
> 2. Radius + shadow token sets by hierarchy (page / panel / control / chip), not one radius for everything.
> 3. A ratchet script (like `check:typecheck`) counting raw `<button>`, hex/rgba literals, literal font sizes, emoji in components, hand-built `fixed inset-0` overlays — counts may only go down. Wire into `npm run gate`.
> 4. Styleguide sections for each new primitive (Law 29).
>
> **Done when:** plan doc specifies each primitive's API and variants, the ratchet's counted patterns and baseline numbers, and a migration order (highest-traffic surfaces first).

Settled input from the attended groundwork session of 2026-10-14 (Christian present; decisions made under process.md rule 4 with veto invited): THR-1821 owns the single UI-debt ratchet all four foundation tickets feed, and specs a family-agnostic `Icon` primitive. THR-1834's icon family was then decided by Christian in chat the same day (human gate satisfied via chat review): a curated game-icons.net subset for all content concepts and UI chrome, lucide-react retired from player surfaces and counted by the ratchet. Places were first kept on our own map drawings; Christian then amended that the same day — **places are carved too**, on the map and in every panel, and our own drawings stay only for spheres, reaches and heraldry. Recorded verbatim on THR-1834 (comment "Places carved (Christian, chat 2026-10-14)", 08:50 UTC: he found the map's place drawings "very alike at a glance and a bit too abstract" and "chose **carved everywhere**, on the map and in every panel"), with the 11 place shapes, and as decision-record call 2b in PR #2379 (auto-merge queued).

## scope (what this plan does)

Specifies the APIs and variants of six shared UI primitives (Overlay, Panel with Card re-based on it, Tabs, Chip, Icon) and the radius / shadow / scrim / glass tokens they use; specifies the `check:ui-debt` ratchet (13 rows with measured baselines, detection rules, verdicts, baseline file, gate and CI wiring) and records reference counts for the three rows the sister tickets register; specifies the styleguide sections; and sets a migration order that builds new surfaces on the primitives, moves each surface once, and leaves surfaces the Inspector retires alone. Execution is split into three slices: this ticket (S1) ships the ratchet and the tokens only; two slice tickets ship Overlay + Panel (S2) and Icon + Chip + Tabs (S3).

Boundaries with two tickets filed from the same map: THR-1879 owns the icon registry's content (vendored carved shapes, concept → shape table, credits line, legacy sweep order) — this plan owns the primitive, data format, resolver and ratchet rows. THR-1880 owns moving six hand-built dialogs (Settings, effect choice set, Divine Court, Codex, harvest, warm start) onto their tiers — this plan's S2 does not move them, and THR-1880's blocker moves from THR-1821 to S2.

## scope (what this plan does NOT do — explicit non-goals)

- No big-bang migration of legacy surfaces; nothing THR-1827 or THR-1828 retires is migrated.
- Does not define dialog size tiers or the 85vh rule (THR-1820), layout widths, breakpoints or the type step-up (THR-1819), or view models (THR-1822). It does not register their ratchet rows — they do, after S1.
- Does not build any new surface of the map-first screen (frame, Inspector, Stage, lenses, Find anything).
- Does not choose the icon family (THR-1834 did), draw icons, vendor carved shapes, write the credits line or set the legacy icon sweep order (THR-1879).
- Does not move the six dialogs THR-1880 owns, and does not edit `GameView.tsx` (THR-1881 splits it).
- Does not change any engine code, graph type, rule of play or game text (the credits line is THR-1879's).
- Does not rename `Card` or remove any existing primitive export.

## impact_class

External (corrected from Reversible on the judge's first pass) — S1 adds a blocking step to the required CI check `Test · Typecheck · Build` and a gate to `npm run gate`, which changes every executor's and content lane's gate (the `glyph-icon-data` row scans `src/data/**`). Not High-risk: no ruleset change, no CLAUDE.md edit, no canon rewrite; removing the ratchet is one script, one step and one gate line.

## evidence cited

- **Linear issue:** THR-1821 (and THR-1816, THR-1826, THR-1834, THR-1874)
- **Vision premises invoked:** none changed; "always dark", "gold means important" kept (`Docs/design-system/INDEX.md`, `laws.md` 31–32)
- **UL terms touched:** "Chip" — `Docs/ubiquitous-language/Encounters.md` § Consequence Chip lists "Chip" as an alias. The plan's `Chip` component is the generic pill; a Consequence Chip renders as `Chip role="state"`. The clash is noted in the plan and in the catalog row; no UL change (the UL governs game terms and the component name never reaches a player), so no UL-proposal. The "card" collision (`Card` primitive vs the god's cards) is noted the same way.
- **Canon pages consulted:** `Docs/design-system/laws.md`, `INDEX.md`, `component-selection.md`, `layout-zones.md` (via frontend-ui), `Docs/canon/verification-gates.md`; `scripts/check-typecheck-ratchet.ts`, `scripts/chip-referent-ratchet.ts`, `scripts/gate.ts`, `.github/workflows/ci.yml`
- **Prior plan docs / decision records this builds on:** `Docs/audits/2026-10-11-thr-1827-inspector-decision.md`, `2026-10-12-thr-1828-screen-frame-decision.md`, `2026-10-14-thr-1829-encounter-stage-decision.md`, `2026-10-14-thr-1830-map-lenses-decision.md`, `2026-10-13-thr-1833-type-system-decision.md`, `2026-10-14-thr-1834-icon-family-decision.md`; the groundwork brief
- **Rejected approaches considered and dismissed:** ESLint for counting; native `<dialog>`; one total count; per-file ceilings; size-scale radius tokens; React-component-per-icon; icon font; four separate chip components (all in the brainstorm companion)

## load-bearing decisions touched

- "Engine caches are owned per session … never module-scope singletons" — the escape registry is module scope; it is UI input routing on one `document`, not an engine cache, as its THR-1816 header records. The plan extends it without changing that.
- No graph, sublocation, awareness or distance-matrix decision is touched.

## high-impact files touched (from Codesight)

None with ≥ 100 importers. Widest: `src/components/shared/Tooltip.tsx` (71 importers; only its Escape listener changes, in S2), `src/components/shared/Modal.tsx` (24; re-based with unchanged props, in S2).

## kill criteria

- More than one PR in the ratchet's first two weeks blocked by a detector false positive → narrow the detector with a fixture; never raise the baseline to make it pass.
- `Modal`'s re-base changes behaviour (not markup) in its tests or THR-1816's regression → S2 stops; `Modal` keeps its own backdrop until understood.
- Tailwind v4 `@theme static` does not emit the variables, or a fixture `rounded-panel` produces no rule → tokens move to plain `:root` variables, rows accept `var()` alone. (An unused utility producing no rule is normal and is not this criterion.)
- A new surface needs a fifth chip shape → raised as a Chip API change before any local chip is written.

## explicit user sign-off

Not required (External, not High-risk).

## author notes for the judge

- The brief lists the ratchet patterns per ticket; the plan adds rows the brief did not list (Escape listeners, radius, shadow, the THR-1833 type rows, lucide per THR-1834). Each addition is justified in the brainstorm (Decision 2). THR-1833's decision record explicitly assigned its three type rows to THR-1821.
- "Card adoption" is delivered by re-basing `Card` on `Panel` and defining the decision tree (Panel = shell, Card = titled panel). No game screen uses `Card` today; adoption then happens through the new surfaces and the touched-surface rule, not a sweep — the brief's build order forbids a sweep of retiring surfaces.
- "Highest-traffic surfaces first" is honoured by the order itself: the highest-traffic surfaces of all (top bar, rails, Inspector, Stage, lenses) are rebuilt by the new-surface tickets on the primitives from day one; inside S2 the shared primitives (`Tooltip`, `Dropdown`) go first because every surface uses them; S3's one live migration is the top bar's count badges; the legacy "when touched" order and THR-1879's sweep input are ranked by traffic and measured debt.
- Revision 5 (after Allow on revision 4): folds in the judge's four recommendations (a badge form of the count chip that leaves name and tooltip to its control; `getCountChips()` declared in Debug inspection, Tracing and Interface impact; a stub `RefRouterProvider` in the styleguide Chip section; the THR-1881 note at handoff) and a correction to settled input from the parent session: Christian amended THR-1834 on 2026-10-14 after a glance test on the map colours — **places are carved too**, the map's `LOCATION_ICON_REGISTRY` retires for places on the map and in panels, and our own drawings win only spheres, reaches and heraldry. So S3 seeds only `fallback` (no `place-*` names from our drawings), the registry is the single source of place shapes, and its `{ d, opacity }[]` shape is what the map's texture builder already rasterises; vendoring the place shapes and switching the map is THR-1879's.
- Revision 4 (after the third Revise): `IdentityChip` is dead code (superseded by `AscendantBar`, THR-184), so it is not a migration target; S3's identity / state / keyword roles and Tabs are proven in the styleguide and first used live by the new surfaces; S3's one live migration is `IconButton`'s numeric badge (Notables, Rivals). `IdentityChip`'s deletion is noted on THR-1881.
- Baselines were measured on `main` @ `3cf81086` with a scratch scan implementing the specified detectors; the executor re-measures at landing with a ±10 % tolerance.
- The S2 and S3 tickets are filed at handoff and cite this doc; this ticket's own scope is S1.
- Revision 3 (after the second Revise): S3 migrates only chips that draw no glyph today (`IdentityChip`, `IconButton`'s numeric badge); `ChipPill` waits for THR-1879's sweep, `contentTagChips` retires with its builders, the hook chips are rebuilt by the frame build, `RarityBadge` moves when a card-face ticket touches it; the keyword role's icon is optional until its vocabulary has an `IconName` map; the identity role's tile follows the THR-1120 attachment ruling; `modal-maxwidth` reference uses THR-1820's definition (17); S1 blocks THR-1820.
- Revision 2 (after the judge's first Revise): reconciled with THR-1880 (S2 no longer moves its six dialogs; Scry and the Codex are dialogs; S2 swaps Escape listeners only on other hand-built dialogs), split with THR-1879 (S3 vendors no carved shape and writes no credits line), chip / tab geometry in rem, `@theme static` with a variable-level build check, the Consequence Chip name clash noted, player-facing text rows per changed surface.
