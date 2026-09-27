# Action Proposal — What your hand did (THR-1606, THR-1607)

## intent_quote

> i would like to have the remaining onboarding & first run experience project tickets into ready for dev. is it feasible to to do that in one session?

(Christian, attended chat, 2026-09-27. The ticket-level intent is the cold-playtest findings recorded on THR-1606 and THR-1607. The veteran tester's message quoted there: "Put a number and a tooltip on everything I spend or risk (Essence, card cost, fated/doomed), and after every cast show me what changed." Fixed-when tests from the tickets: "a round-2 cold tester can name a consequence of their own cast"; "round-2 testers can say what their essence is and what 'doomed' means on a card".)

## scope (what this plan does)

Four build slices:

- **B2:** the two starter soul-casts (Oneiric Sending, Divine Compulsion) get real, bounded value-drift effects through the existing influence pipeline. Today they write an empty payload.
- **B1:** a cast's receipt names the target and what changed; the target's Story So Far records it; the mortal's sheet shows active influences as chips; spine gifts announce where they landed.
- **B3:** the "A Vision — Witness" delivery beat plays its encounter in the existing veil with The First as subject, and stops running the template's aftermath silently against the god.
- **B4:** essence bars move on a spend (fixed scale), show the whole-number balance (the Law 13 ratified exception), keep a fixed order and fold the Foundation spheres. Card cost, cast forecast words, reach tier words, Quintessence and doom/mandate labels get registry tooltips.

## scope (what this plan does NOT do — explicit non-goals)

- It does **not** put numbers on anything except the essence pool balance. Costs stay pips, forecasts stay words, deltas stay the delta cluster (UI Law 13 / Vision non-negotiable §3).
- It does **not** rename the five forecast-tier words (a seated UL term).
- It does **not** add new effect types, a pole picker, or dreams-as-encounter-seeds.
- It does **not** unify the two essence stores (filed as THR-1645).
- It does **not** hide HUD elements; the first-screen reveal is the sibling opening plan's S5.
- It does **not** change mortal-encounter forecasts or tooltips.

## impact_class

Reversible. B2 changes two template payloads (tunable magnitudes); B1 and B4 are presentation plus one additive digest write; B3 retires one silent aftermath run that wrote untrue consequences, which is the only removal.

## evidence cited

- **Linear issue:** THR-1606, THR-1607.
- **Vision premises invoked:** `Vision/00-north-star.md` ("the intervention has to feel consequential in both directions"), `Vision/02-non-negotiables.md` §3, `Vision/03-design-tensions.md` (essence legibility), `Vision/taste-profile.md` (elder magic; prose-first UI; sphere-tinted cards).
- **UL terms touched:** cast (verb), Forecast tier, Consequence Chip, Nudge (none redefined; no new terms).
- **Canon pages consulted:** `Docs/design-system/laws.md` (1, 10, 13 with its exceptions, 15, 17–20, 47, 53, 56), `Docs/canon/rulebook.md` §4, `interface-map.md`, `systems-inventory.md`.
- **Prior plan docs this builds on:** `2026-07-23-thr-727-divine-receipt.md`, `2026-07-24-thr-728-player-cast-variance.md`, `2026-09-09-thr-1002-card-grammar.md`, `2026-04-18-ascendant-bar.md`, `2026-08-12-thr-1082-consequence-language.md`, `2026-09-24-thr-1526-seed-only-encounters.md`.
- **Rejected approaches considered and dismissed:** numbers on everything; new effect types; dreams as seeds (deferred); withdrawing Witness; renaming forecast tiers for casts; hiding forecasts on casts.

## load-bearing decisions touched

- **Relationships as edges:** influences stay in the existing `divineInfluences` payload (the established pattern); no relationship moved into a property. Respected.
- **Graph mutated in place / versioning:** B1 adds `touchWorld()` after spine seeding, fixing a missed bump. Respected.

## high-impact files touched (from Codesight)

`src/data/unified-action-templates.ts` (189 importers). Two rows' params only; covered by a Blast Radius section.

## kill criteria

- If the drift magnitudes produce no observable behaviour change in a 30-tick headless comparison (B2 Done-when), raise them. If they still move nothing, the value overlay is not the live steering path, and B2 must be re-scoped to a scoring term before B1 ships chips (Law 56).
- Round 2: fixed when testers can name a consequence of their own cast, and can say what their essence is and what "doomed" means.

## explicit user sign-off

Not High-risk.

## author notes for the judge

- The ticket framed THR-1606 as visibility. Tracing showed the two casts every tester used do nothing, so a visibility-only fix would violate Law 56. That is why B2 exists and B1 is soft-blocked on it. I think this is faithful to the ticket's fixed-when ("name a consequence of their own cast"), not scope creep.
- The compulsion pole rule depends on a pole-ordering table I did not find in data. I specified a fallback (both verbs use "own lean", compulsion stronger) rather than inventing the table.
- The veteran literally asked for numbers on everything. The plan answers the need inside Law 13 rather than the letter; the brainstorm records why, so it is not reopened from the same quote.
