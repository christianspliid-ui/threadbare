---
title: The Repertoire — card communication format, pip vocabulary, and progression design
linear_issue: THR-883
author: Claude Fable 5 (live design session with Christian)
created: 2026-07-30
three_pillars: Engine (card library data model, unlock hooks, echo-card harvest) / Content (card families, 12 hunger uniques, generic art batch) / UI (card row, pip rendering — spec here, built under its own ticket)
---

# The Repertoire — Card Format, Pip Vocabulary, and Progression

**Origin:** THR-883 live design session, 2026-07-30 (continuation of `Docs/plans/2026-07-30-encounter-authoring-frameworks.md`). Every decision carries Christian's explicit chat approval (THR-608). This doc records the **communication pivot** (supersedes the per-card prose aspects of the frameworks doc's Decision 3) and the **Repertoire progression design** (all four verdicts blessed).

## Why this is load-bearing

The communication pivot changes what card *content* is (no per-card scene prose; generic reusable cards), and the Repertoire changes how many cards exist and when players see them. Both must be settled before the corpus is authored — which is the entire reason THR-883 paused content.

## Decision 4 — The communication pivot (Christian: "we have tried and failed enough to pivot")

**Prose does the scene; cards do the rules.** Scene opening (setting-variant), stake block, and post-roll outcome prose stay fully written under the narrator's checklist. The card itself carries **zero scene-bespoke prose**:

> *Superseded in part 2026-08-25, marked 2026-08-29 (THR-1324).* **The pivot itself stands — this doc is still the origin of "prose does the scene, cards do the rules."** Three details below it were overtaken by Prose Doctrine v2 (`Docs/canon/prose.md` § Narrator mode), and this page is linked without caveat from live canon while its engine ticket is unshipped, so an executor could read the retired shape as the contract:
> 1. **The flavor quote is retired.** The row previously read *"Flavor quote | One short generic line, serif voice — the card's only prose"*. A card's only prose is now its effect line.
> 2. **Titles are spell-style, not merely short.** The row previously read *"2–3 generic words, reusable everywhere"*; the shape is now imperative verb + noun ("Inspire Courage").
> 3. **The 14-question checklist is superseded** by the narrator's 12-question checklist in [`nudge-authoring-spec.md`](../../.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md) § Prose doctrine v2, which is authoritative over this page wherever the two disagree.

| Card element | Content |
|---|---|
| Picture | Small generic image, one per library card; manifest + fallback chain (type icon on tinted band until painted) |
| Keyword + icon | The card's type — player-facing vocabulary |
| Title | Spell-style: imperative verb + noun ("Inspire Courage"), reusable everywhere |
| Cost | Essence pips · `Free` · alternate-cost icons (detection, doom, obligation) |
| Effect | One or two plain mechanical sentences; odds in the pip vocabulary — **the card's only prose** |

## Decision 5 — The odds pip vocabulary (approved)

Magnitude to the nearest ~5%: five pips per color tier, colors matching the attachment-rarity ladder, **shape changing per tier** (colorblind-safe; shape escalation doubles as rarity feel). Green circles +5..+25 · blue squares +30..+50 · purple diamonds +55..+75 · gold stars +80..+100 · red down-triangles for penalties. Stored values are raw numbers — tiering is pure display (recorded on THR-885). The step's base forecast renders in the same vocabulary: one odds language for the whole surface.

## Decision 6 — Binding model (generic cards, specific in play)

Typed text slots (`{condition}`, `{host}`) resolved at deal time via the existing placeholder path; target *selectors* bound at deal time (binding failure = card not dealt, so dealing is self-grounding); ascendant scaling bends effective numbers and pips render the result. Spec'd on THR-885.

## Decision 7 — The Repertoire (progression), four verdicts

1. **Sphere signatures — blessed.** Universal core for every god (Boost, Insurance, Mercy, trait cards). Each of the 12 spheres owns signature types: chaos → Gambit + Stumble · order → Favor + Insurance⁺ · light → Whisper · darkness → Veil + Undertow · force → Heavy Hand · matter → Cache · energy → Boost⁺ · life → Balm · mind → Compulsion · spirit → Kindled Ambition · time → Omen · entropy → Bargain. Primary sphere full strength, secondary discounted, off-sphere locked. First-cut mapping; iterated on the wiki page.
2. **Broad start; progression = variation, not power.** All sphere-unlocked types playable from turn one. Each type is a **family** that deepens over the run: milestones, god-earned traits (THR-791), and alignment add new *member cards* (same verb, different twist/cost channel) — almost nothing strictly stronger. Pip-deepening demoted to minor seasoning. Variation is the progression fantasy *and* the anti-boredom engine.
3. **Hunger uniques — blessed.** Each of the 12 hungers (witness, kindle, sever, bind, consume, gather, haunt, illuminate, preserve, reclaim, reshape, wander) contributes exactly one unique starting card no other god holds (e.g. Witness → *Seen*; Sever → the game's only mid-encounter bond-cutting card). 12 cards of content total.
4. **Echo card — blessed.** At twilight the harvest adds a fourth preserved thing: the run's defining card (most played or most storied) enters the World-Soul and joins the next run's starting repertoire regardless of sphere — full tier after a triumphant age, scarred (cheaper + penalty pip) after a somber one.

## Engine pillar

Card library data model (types → families → member cards, sphere/hunger keys, unlock conditions); unlock hooks riding the existing milestone card-grant machinery and THR-791 god-trait minting; echo-card selection in the twilight harvest + World-Soul carry; sphere gating (extends THR-885's discount filter to lock/unlock). All behind THR-884/THR-885 landing.

## Content pillar

Member cards per family (authored under THR-883 by Fable), 12 hunger uniques, generic card art batch (one image per library card, encounter-image-library pattern). No content before the frameworks land.

## UI pillar

Card row rendering (mockups from the 2026-07-30 session are the spec: picture band, keyword chip, title, cost, effect, quote), pip rendering per the approved vocabulary, replacement of the shipped test panel. Filed as its own UI ticket when the engine substrate exists — not part of this doc's implementation ticket.

## Wiring

Library data file (new, `src/data/nudge-card-library.ts`) → THR-885's filters/binders consume it; unlock state on the ascendant node (property bag, same pattern as progression milestones); echo card via the existing harvest pipeline (`cycleEnd`/`worldSoul`); wiki page `public/nudge-cards-reference.html` declares the library file as a freshness source (already registered).

## Constants table

| Constant | Initial | Purpose |
|---|---|---|
| `SPHERE_SIGNATURES` | table in Decision 7.1 | Sphere → signature types map |
| `HUNGER_UNIQUE_CARDS` | 12 ids | Hunger → unique card map |
| `SECONDARY_SPHERE_DISCOUNT` | 1 | Essence discount on secondary-sphere cards |
| `ECHO_CARD_SCAR_PENALTY` | 1 red pip | Somber-age echo card penalty |
| Pip tier bounds | 25/50/75/100 | Display tiering (UI-side) |

## Tracing

Card unlocks and echo-card harvest each emit one trace via the host system's existing categories (milestone grants, harvest). Player-driven volume — no aggregation needed.

## Fail-soft table

| Failure | Behavior |
|---|---|
| Sphere/hunger key resolves to no cards | God plays with universal core; warn once |
| Echo card references a retired card id | Echo dropped at world-seed with one warn, harvest otherwise intact |
| Unlock condition references missing milestone | Card stays locked; liveness test catches at build time first |

## Three-pillar check

All three addressed above; UI deliberately split to its own ticket with rationale.

## Vision audit

Deepens the roguelite loop (World-Soul carries a card), the sphere-governed direction (THR-870's first live surface), and generated-within-constraints content. No rejected approach reintroduced — the library is open-ended and data-driven, not a fixed action wheel; broad-start avoids the rejected capped-action-slots shape.

## Rulebook impact

Rulebook § encounters gains the card format, pip vocabulary, and Repertoire progression; quick-reference gains a card-anatomy line. Update rides the implementation ticket's closeout.

## NFP-compliance table

| NFP | Compliance |
|---|---|
| 1 Tunability | All maps/discounts/penalties are named constants |
| 2 Inspectability | Unlock + harvest traces; wiki catalog is the human surface |
| 3 Determinism | Unlocks and echo selection are pure over run state |
| 4 Fail-soft | Table above |
| 5 Narrative first | Scene/outcome prose untouched; cards carry an effect line only (*"cards get flavor quotes"* until the 2026-08-25 retirement — see the banner on Decision 4) |
| 6 Additive | New data + optional fields; existing hands unaffected until authored against |
| 7 Performance | Deal-time filtering only; no per-tick cost |

## Done when

The implementation ticket (filed as the Repertoire engine ticket, blocked by THR-884 + THR-885) ships the library data model, sphere/hunger keys, unlock hooks, echo-card harvest, and liveness tests; the wiki page's tables read from the live library; content authoring then proceeds under THR-883.

## Coordination block

Suggested model: opus.
Parallel-safe with: all non-content queue work.
Mutex with: THR-885 (both touch `src/engine/encounters/nudges.ts` filter surface) — sequenced by the Blocked-by instead.
Blocked by: THR-884, THR-885.
Files to touch: `src/data/nudge-card-library.ts` (new), `src/engine/encounters/nudges.ts`, `src/engine/worldSoul.ts` / `src/engine/cycleEnd.ts`, ascendant progression grant site, `public/nudge-cards-reference.html`.

## Notes for the executor

Ride the existing milestone card-grant machinery for unlocks and the existing harvest pipeline for the echo card — neither gets a parallel path. The wiki page is registered with the library file as a freshness source; updating it in the same PR is the gate, not a courtesy.

## Forked-audit verdicts

Not run — decisions made live by Christian in chat (THR-608 gate satisfied per decision); absence explicit rather than silent.
