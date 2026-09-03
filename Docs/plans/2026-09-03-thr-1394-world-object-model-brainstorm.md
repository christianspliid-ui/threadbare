---
tags: [brainstorm, engine, world-model]
aliases: [World-object model Brainstorm]
status: active
created: 2026-09-03
updated: 2026-09-03
---

# The world-object model — Brainstorm Companion

> Companion to `Docs/plans/2026-09-03-thr-1394-world-object-model.md`. Alternatives considered, tensions surfaced, Vision premises invoked. Written alongside the plan.

## How this started

The verb × object undertaking grid (THR-1392, slices 1–3 on `main`) put seven "object types" in front of Christian, and two of them were not things the game had ever named: *room* (the code's sublocation tier) and *attachment* (a code umbrella over items, conditions, spells, favours, companions and freeholds). His reaction was not about undertakings: *"we have drifted away from the fundamental graph objects that define our world model."* The map that followed (*The World's Objects* artifact) counted the drift on a seeded world, and the decisions in this plan came out of one iteration in chat.

## First-pass framing I considered

Fix the undertaking registry's names and carry on. Wrong: the names were symptoms. Nothing in the repo lists the world's objects in game words, so every design that needs one re-derives it from the type unions and lands somewhere different. The plan had to be the catalogue plus the thing that keeps it true.

## Alternatives considered

**A. Hand-written canon page only.** Cheapest; the way canon drifted before (THR-614). Rejected as the sole mechanism; kept as the human half beside a generated half.

**B. Tags on every node as the taxonomy.** Christian asked whether traits are a tag taxonomy. They are not — tags live only on trait nodes. Making classes a general tag convention is right for *classes* (Location class, Place class) and wrong as a replacement for the discriminator properties that already exist (`locationSubtype`, `groupKind`). Chosen: classes are a registry-declared grouping of existing discriminator values, exposed as a tag helper, not a second discriminator.

**C. Resources as nodes again.** The dead `resource` type invites reviving it. Rejected: a stock is internal data of a place; the thing with identity — a mine, a seep — is already a Location subtype. Deposit becomes a Location class; stocks stay properties; the dead type retires.

**D. "Structure" for the inner tier.** Rejected by Christian: the inner tier is not always built (nature and borderlands classes). *Place* chosen; the code's "place tier" phrase (the outer tier, 28 files) renames to Location tier.

**E. A node per route.** Rejected: pathfinding and awareness walk edges, and a node between two locations doubles every hop. Chosen: routes are edges, with the trade route's identity-node pattern generalized for the moment a route becomes nameable or ownable; a portal is a route edge with an empty hex path.

**F. Throw on an unregistered subtype.** Rejected (NFP #4): the write-time check warns, the generator's `--check` and the contract test are where it fails, in CI, not in a tick.

## Trade-off Card

No pre-design debate was run: the direction was Christian's and the four open points were settled in one chat iteration (Area geographic only; Deposit as a Location class; conditions to edge state; Place for the inner tier).

## Tensions surfaced

*Legibility vs. realism* — the catalogue chooses legibility: thirteen kinds a player can point at, variants as subtypes. *Additive vs. destructive* — two union members retire and a helper family renames; both hedged (reader grep first; deprecated aliases for one release). *Generated vs. authored canon* — both, with a rule for which owns what: the registry and the census are generated truth; the hand page carries the decisions and the rule.

## Vision premises this plan leans on

- The world is a graph the player reads through mortals (`00-north-star.md`) — the catalogue is the list of things a mortal can point at. *This plan's version:* every kind has a game word and a UL entry before it has code.
- Mortal sovereignty (`02-non-negotiables.md`) — untouched; the model changes what is nameable, not who decides.

## Taste profile touchpoints

*Words, never numbers* — confirmed: kinds and classes are words; the census counts are the one place numerals appear, on a reference page. No new soft pattern.

## Branches not taken

- A `world_object_unregistered` trace category (the write already names it; the page is the record).
- Renaming `NodeType` members themselves (`artifact` → `item`): the unions are load-bearing across hundreds of importers; the registry maps game word to code word instead, and the rename is a later, measured ticket if the mapping ever costs more than it saves.
- Folding THR-1392 slice 4 into this plan: it resumes *on* the catalogue, as its own ticket.

## Open questions

- Whether `port` deserves a real subtype (coastal settlement) rather than a class tag — decided at slice 2 by counting coastal settlements on the census seeds.
- Whether Power gets its own node shape (today a cast spell mints a condition) — a later ticket; the catalogue records the family and the gap.

## Brainstorm Status

Complete enough to hand off.

---
*captured 2026-09-03 — design session, Claude Code*
