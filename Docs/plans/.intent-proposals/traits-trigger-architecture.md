# Action proposal — Traits as the universal trigger layer

**Plan doc:** `Docs/plans/2026-07-26-traits-trigger-architecture.md`
**Issues:** THR-789 (epic) · THR-786 (floor, this doc's buildable engine slice) · THR-787 · THR-788 · THR-790 · THR-791
**Impact class:** External (game-wide architecture; co-designed live with the user this session)

## Originating intent (verbatim anchors, Christian, 2026-07-26 chat)

- "lets do some architecture and design work on the 'traits' function … this is designed to be the main flexible trigger in the game for 'custom' variant events in our systems" (pasted from prior session, re-anchored here).
- "the game-wide reactivity is what i want to support … a system you can use for all game objects (agents, attachments, locations, actions, etc.) that allow these systems to react in particular ways if they connect with another object with a certain trait."
- "we should have an overview of all gameplay world objects and ask ourselves, what would a trait for this object be? and maybe create a generic list."
- "I like your canon rule, and i would expand that traits on objects should always be visible in the interface."
- God traits: "this works well with the roguelike idea, that you can earn and unlock traits as you play based on how you play, and this can actually impact the game." Relationship traits: "a very cool variant … lets explore this also." Destiny: "sure lets try this."
- EH research: "look through the eldritch horror cards on the eldritch wiki, and see how that game uses traits to connect different object types … an example can be to use a #relic trait on an attachment." Then: "go ahead" (consolidate in the proposed shape).

## What the plan proposes

Game-wide trait architecture: object×trait map grounded in the verified NodeType/ActorType/edge-schema reality; six connectivity verbs (EH-derived, verbatim-sourced); category-as-lifecycle-contract table; starter generics vocabulary; staged waves keyed to the Nudge Model program. Buildable slice: THR-786 predicate unification (four vocabularies → one resolver + load-time index, sugar preserved, behavior-identical).

## What it deliberately does NOT do

No central trait rules engine (rejected in brainstorm); no wave-2/3 implementation detail (own design passes); no template-field edits in THR-786 (rides the WS0 PR — one editor on the 278-importer file); no content authoring.

## Risks the judge should weigh

Whether the six-verb framing faithfully covers "react in particular ways if they connect with another object"; whether staging god/relationship/destiny to wave 3 under-delivers the user's enthusiasm; whether the floor ticket is genuinely buildable without the wave designs.
