# Action Proposal — one card grammar (THR-1002)

## intent_quote

> "lets get some more design ready for development" — Christian, attended chat, 2026-09-09.

> The ticket's director directive (Christian, chat, 2026-08-06), verbatim: *"i think one line flavour on action cards is fine"* · *"the action cards are too verbose and their actual action in the game is very hard to understand"* · *"probably also because when you play one you don't really get feedback. we designed some feedback a while ago, but i am not seeing it work in the interface when i use them."* · *"players would expect the same type of syntax and rough layout and language for all 'cards' in the game, despite them working in different contexts and having different functions."*

> Prose Doctrine v2 (Christian, 2026-08-25), as recorded in `Vision/taste-profile.md` and `Docs/canon/prose.md` § Narrator mode: the card flavour quote is retired by name; *prose does the scene, cards do the rules*.

## scope (what this plan does)

States the shared card grammar as ten rules; extracts the nudge card's zone stack into a `CardFace` primitive that the nudge card renders through unchanged (pinned by a snapshot written first); rewrites the action card and the drawer onto it — one size, one row, a Cast button, verb and scale chips, framed price pips, an upkeep word, an effect line, the forecast tier word as the odds reading, a reason when dimmed, the fate word when resolved; adds three derived slot fields and a `castForecastProbability` helper that runs the resolver's arithmetic; retires detection risk and the drawer's three effect surfaces; authors effect lines for every card the player can hold; makes the receipt toast carry the overview; applies the technical-effect overlay to the agent hand. Hands off to Ready for Dev.

## scope (what this plan does NOT do — explicit non-goals)

- No flavour line on the action card and no new template field — Doctrine v2 overrides the 08-06 permission, stated with an invitation to veto.
- No change to the nudge card's rendering (extraction only, snapshot-pinned).
- No change to the receipt modal, its gate or its three constants.
- No template re-pricing; no change to resolution, cost, floor or ladder.
- No `OddsPips` on a cast (Law 10).
- No node, edge or trace type added.

## impact_class

Reversible — UI rewrite behind an extracted primitive; three additive slot fields; one toast sentence; one field removed from `WheelSlot` after every read and write is gone; constants and tests retired with the surfaces they served.

## evidence cited

- **Linear issue:** THR-1002 (blocks nothing now — THR-998 shipped 2026-08-12; related THR-1114 for the two non-Sphere affinities)
- **Vision premises invoked:** `Vision/02-non-negotiables.md` #3 (prose, never numbers), `Vision/00-north-star.md` (the intervention feels consequential), `Vision/01-core-loop.md` (the aftermath is a breath — the modal gate stays), `Vision/taste-profile.md` (prose-first UI; austere voice; *Encounter-specific intervention verbs* reconciled entry — card faces carry a generic vocabulary)
- **UL terms touched:** Reach, Sphere (existing). Two terms the plan uses have no UL headword and are filed as a `UL-proposal` (see the plan's executor notes for the issue link): **cast** in the verb sense — a god playing a divine action card (the engine's `playerCastDispatch` / THR-728 sense), distinct from the existing `Cast` noun in `Encounters.md` (an encounter's support-bundle bindings viewed as characters); and **Forecast tier**, which exists in canon and code but not in the glossary
- **Canon pages consulted:** `Docs/canon/prose.md` (Doctrine v2), `Docs/canon/rulebook-quick-reference.md` (five verbs; forecast), `Docs/design-system/laws.md` (1, 7, 9–17, 21, 23, 25–28, 33, 37, 47, 48), `Docs/canon/interface-map.md`, `Docs/canon/design-governance.md`
- **Prior plan docs this builds on:** `2026-03-08-action-card-redesign-design.md` (superseded on the face), `2026-07-27-nudge-encounter-experience-ws1-ws2.md` (the grammar), `2026-07-24-thr-728-player-cast-variance.md`, `2026-07-23-thr-727-divine-receipt.md`
- **Rejected approaches considered and dismissed:** a template flavour field (464 importers, doctrine); pips on a cast (Law 10); bucketing the risk words on P (THR-998 measured collapse); keeping the fan and focused frame; a focused size; lowering the modal gate; a third feedback tier; re-implementing the zones instead of extracting them

## load-bearing decisions touched

- *Fixed action count / capped action slots — rejected* — respected: the row is uncapped and data-driven; `HAND_MAX_HEIGHT_PX` bounds the row's height, not its count.
- *Ascendants use the same prerequisite system as agents* — respected: the tier is computed from the ascendant's capability through the shared resolver arithmetic.
- *Additive over destructive (NFP #6)* — noted: several surfaces are removed; each is the named defect or a dead read, and the nudge card is pinned.

## high-impact files touched (from Codesight)

Two: `src/data/unified-action-templates.ts` (141 importers — the technical-effect overlay applied to the agent-hand assembly, export shape unchanged) and `src/types/trace.ts` (120 — one optional field on an existing interface). Both carried in the plan's `## Blast Radius` table. `src/types/unifiedAction.ts` (464) is deliberately untouched — no new field.

## kill criteria

- The nudge snapshot fails after the extraction → fix the primitive, never the snapshot.
- A fresh-god drawer's tier words do not let Christian tell a soul-verb from a working → the legend at first contact, before any threshold moves.
- The toast's first sentence is a fragment or a placeholder on more than a handful of casts → frame line for that template; file the overview authoring.
- Anyone proposes a flavour field → Doctrine v2; the codex page is the answer.

## explicit user sign-off

Not required (Reversible). One director ruling (08-06 flavour line) is overridden by a later director doctrine (08-25); the plan presents this as decided-with-veto in the handoff rather than as an open question.

## author notes for the judge

- The ticket's *"first thing the plan doc must settle"* (what the pips measure) is settled by Law 10 rather than by invention: pips are a delta language, a cast has none, and the forecast tier word is the existing honest reading. I considered this the strongest single finding.
- The receipt half was measured against the deck a player can actually hold (30 beat-grantable ids; the unlock gate admits nothing else), not the 586-template slot list the earlier tickets used — the 77% modal share over the wide list is a mirage made of multi-step mortal encounters the drawer never shows.
- The extraction of `CardFace` from the nudge card is the one place this plan touches the nudge card's file; the snapshot-first rule is how the ticket's *out of scope* line is honoured.
- The doctrine-over-ruling call is the one thing Christian might want to veto; it is flagged in the load-bearing section, the notes, and the handoff.
