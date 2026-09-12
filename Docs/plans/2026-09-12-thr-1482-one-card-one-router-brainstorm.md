# One card, one router (THR-1482) — Brainstorm Companion

> Companion to `Docs/plans/2026-09-12-thr-1482-one-card-one-router.md`. Alternatives considered,
> tensions surfaced, Vision premises invoked. Written alongside the plan.

## How this started

Same sitting as the content-model design (2026-09-12). Christian: *"all content by default has a UI - a card or detail page - that can be shown easily from any UI that references it, via a link/tooltip. Again one solution for all content."* The assessment's UI sweep found no universal card, two unconverged section models, three routers covering three different kind sets, a complete detail-page stack mounted only in the style guide with a documented opener hook that does not exist, nine kinds with no page, and two unmounted agent components. It also found the standing decision point: THR-966 defers mount-versus-prune of the cluster, and `component-selection.md` forbids building on it until that is resolved.

## First-pass framing I considered

"Write a universal `EntityCard` and make every sheet use it." Wrong in two ways. First, the sheets are not the problem: `AgentProfileModal`, `FactionSheet`, `ArtifactSheet`, `ArmySheet` are the Tier-3 surfaces players use and they work; rewriting them is scope for its own sake. Second, the missing tier is the *middle* one — Law 20's ladder says hover = tooltip, click = card, deeper click = sheet, and the card tier exists for exactly zero kinds in production. The framing that survived is three tiers per kind, with the card universal and the sheet optional.

## Alternatives considered

**A. Prune the detail-page cluster (THR-966 option b) and build the card fresh on `EntityCard`.** Rejected: the cluster has the generator, resolvers for five kinds, fallback prose, a stack with breadcrumbs, and snapshot tests; `EntityCard` has one consumer and no generator. Pruning the more complete of two dead systems to revive the less complete one is backwards.

**B. Keep both section models and adapt between them.** Rejected: two section models with an adapter is the "seven kind vocabularies" shape THR-1212 removed at the reference layer. One model; `EntityCard` retires after its consumer migrates.

**C. Put `codex` back into `WorldRefKind` now that the overlay is known to exist.** Rejected: THR-1315's reasoning was that *world* references must not route to a reference page, and that still holds. What was wrong was only the premise about the overlay. Content gets its own ref type; world refs never route to the codex. Recorded as an absorbed ruling with a veto invitation on the content-sheet arm.

**D. Route by extending `NavigationTarget` with every kind.** Rejected: `NavigationTarget` is the notification wire shape and its consumers open *sheets*; a card tier needs a mode, and three routers already exist because each was extended for its own caller. A router that reads a registry is the only shape where a new kind cannot be forgotten.

**E. Hover card = bigger tooltip.** Rejected: tooltips are for concept words (Law 17, `resolveTooltip` prefixes) and are ≤200 characters by test; a thing's card has an image, sections and a route. `EntityLink` decides by ref type which tier to open.

**F. Make the surface a column on `world-objects.ts` only.** Partly adopted: the world-object registry gains `via` for kinds without a `WorldRefKind`, but the card/sheet map lives in its own module keyed on `WorldRefKind` and `ContentObjectKindId`, because those are the two vocabularies references actually carry; `world-objects.ts` rows project onto them.

## Trade-off Card

- **Path A — mount THR-301 and redraw `DetailPageKind` on the reference vocabularies.** Costs: touching `GameView`'s modal region; two new page kinds with resolvers. Buys: a card for every kind by construction, TTS on cards (THR-966's own Done-when), and the anchor catalog's routing column becomes derived.
- **Path B — extend the three routers in place, no card tier.** Costs: nothing structural now. Buys: nothing lasting; the next kind is forgotten by one of three routers again.
- Chosen: **A**.

## Tensions surfaced

- **Reuse vs sunset.** Laws 26/27 say never a new component when a primitive composes, and the sunset rule says delete what has not earned its keep. Navigated by sequencing: slice 1 reuses the cluster; slice 3 deletes what the reuse makes redundant, with the docs and sync test updated in the same PR.
- **Fail-open vs dead links.** Law 21 says "no page yet = plain styled text". With a universal card, "no page" can only mean "no id", never "no kind"; the amendment makes that explicit and is a joint decision.
- **Codex as sheet vs codex as reference.** The codex catalogs templates, not instances; making it the sheet for content refs keeps that distinction while giving content a Tier 3. Invites veto.

## Vision premises this plan leans on

- **Every game concept the player sees carries its image, tooltip and link** (Law 1, Christian twice from a screenshot). This plan's version: the link half is universal.
- **The tooltip never dead-ends** (Law 20). This plan's version: the card tier exists for every kind.
- **Rendering reads projections of canonical state** (THR-1156 distinction 4). This plan's version: the router reads the registry; no surface keeps its own kind switch.

## Taste profile touchpoints

- Strong opinion: **one resolver per representation class** (Law 3). The router is the resolver for navigation.
- Strong opinion: **fallbacks are designed states** (Law 4). The stub page and the silhouette are the fallbacks; no blank card.
- Anti-pattern: **a styleguide entry read as evidence of reachability** (`primitives.md`). The sync test is extended to the `Game/` sheets so this cannot recur.

## Open decisions deliberately left to the executor

- Section schemas for the `group` and `content` page kinds (what a company's card shows beyond members, commander, stance; what a template's card shows beyond name, kind, prose, tags).
- The hover-card anchoring behaviour at viewport edges (flip vs clamp) within the 1920×1080 contract.
- Which codex categories to charter as deferrals (encounter templates, companions, ambitions, omens) versus leaving card-only.
