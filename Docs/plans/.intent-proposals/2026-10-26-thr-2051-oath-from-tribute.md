# Action proposal — an oath from tribute (THR-2051)

## intent_quote

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map."
> — Christian, chat, 2026-09-25 (the design lane's mandate, THR-1611)

The agreed work is the money-encounter outcome table's row for *The Tribute Exchange*, from the research ticket THR-1872 (Christian filed it: *"Produce a table with one row per money encounter: the economic write each outcome band should make … a holding gained or lost, a debt"*). Its row: *"tribute_exchange | S Means−− + protection oath; F Means−− | none → held town | yes | U + NEW (`sworn_to`)"*. The mortal-wealth plan (THR-1936) deferred the oath half to THR-1954 *"`sworn_to` from tribute exchange (the crown's)"*, blocked by the crown (THR-1932, shipped). The Mortal economy wayfinder map (THR-1863, Christian charted) set the destination: *"making wealth and want drive what agents, factions and towns do."*

## scope (what this plan does)

Adds one optional field (`liegeFrom: 'scene_town'`) to the shipped `faction_broker_fealty` aftermath effect so its liege can be the realm the scene's town answers to (its holder if a realm, else its holder's liege). Authors *The Tribute Exchange*'s critical-success, success and success-at-cost rows to swear the actor's own house (top swearable non-realm faction) to that realm as a `persuaded` oath, through the crown's existing writer and every crown rule. Includes a census on three worlds that measures how often it can fire.

## scope (what this plan does NOT do — explicit non-goals)

- No draw change: the table's *likelier when: held town* column is not built (Decision 4).
- No new oath kind, no new chronicle or sheet words, no new UI component.
- No oath on failure bands; no refund when no oath is possible.
- No change to any crown rule, to *faction unification* or to *the Warlord's Tribute*.
- No person-level protection for a mortal with no house.
- The other later rows (bounty collection, the missing `salt` good) stay on THR-1954.

## impact_class

Reversible — one optional field defaulting to today's behaviour, and one content table row set.

## evidence cited

- **Linear issue:** THR-2051 (split from THR-1954; row from THR-1872)
- **Vision premises invoked:** `Vision/00-north-star.md`, `Vision/01-core-loop.md`, `Vision/02-non-negotiables.md`, `Vision/03-design-tensions.md` #2 and #4
- **UL terms touched:** Fealty, oath, liege, vassal, Crown (as in the rulebook's crown paragraph); no new term
- **Canon pages consulted:** `Docs/canon/rulebook.md` (Realms win fealty, `:452`), `Docs/canon/rulebook-quick-reference.md`, `Docs/game-design/laws.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-15-thr-1932-crown.md`, `Docs/plans/2026-10-15-thr-1936-mortal-wealth.md`; THR-1944's spec (design-lane comment, 2026-10-18b)
- **Rejected approaches considered and dismissed:** the actor's realm swears (one mortal would swear a nation; THR-1944 rules it out); a present faction swears (the tribute is the actor's own); a person-level protection mark (a new primitive); a new `tribute` oath kind (new words on every crown surface for one scene)

## load-bearing decisions touched

- **Relationships between entities are graph edges** — the oath is the crown's `sworn_to` edge.
- **No inventing node types** — none added.
- **Agent position is three-tier** — the town is resolved with `resolveSceneHere` + `resolveToParentLocation`, so a scene in a Place reads its town.

## high-impact files touched (from Codesight)

`src/types/unifiedAction.ts` (wide-blast; one optional field). The plan has a Blast Radius section.

## kill criteria

If the build's re-run census shows tribute oaths are more than a third of the oaths sworn in a world, restrict the oath to critical success and re-measure.
