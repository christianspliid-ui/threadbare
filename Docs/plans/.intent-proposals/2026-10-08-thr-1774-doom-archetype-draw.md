# Action proposal: every run draws its doom (THR-1774)

## intent_quote

There is no direct human ask on this ticket. It was filed by an agent from the research Christian asked for on 2026-10-06. Its originating intents, verbatim:

From the ticket (THR-1774, filed 2026-10-06 by the THR-1772 research on the Dominion map):

> `initializeGameState` picks the doom archetype as `doomArchetype ?? 'breach'` (`src/engine/gameInit.ts:326`). The optional parameter has **no non-test caller** on any creation path (bare start, showcase, Remembrance), so every run plays *Breach*.

> Design call for the plan doc (agent decides, veto invited): derive the archetype from the god's identity (the hunger's resonance tags or sphere pair are the obvious keys; `doom-identity-matrices.ts` already maps archetype × sphere) or draw it seeded from the World-Soul as the rulebook §8 implies, with the showcase pinned to Breach so `?seeded` evidence stays stable.

> Done when: across the twelve hungers at a fixed seed, at least four distinct archetypes occur; the showcase still boots on Breach; the archetype is named in the Chronicle's first doom line; a test asserts the selection is deterministic for a seed and identity.

From the rule of play the bug breaks (`Docs/canon/rulebook.md` §8):

> Every run starts with one of seven archetypes — Breach, Convergence, Changing, Sundering, Failing, Ascension, Reckoning — each named for the shape of its catastrophe

Christian's delegation (2026-09-25, design lane charter):

> I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map.

## scope (what this plan does)

- Adds one selection function that draws the doom archetype at world creation. The draw is seeded, at even odds, and keyed on the world seed and the god's hunger id. `initializeGameState` uses it whenever no explicit archetype is passed.
- Pins the dev showcase routes (`?seeded`, `?firstunmet`) to Breach and adds a `?doom=` review lever.
- Names the doom to the player: one sentence appended to the authored wake line, display names instead of raw keys in the stage pop-up and the doom bar label, and seven `doom.<archetype>` tooltips.
- Fixes the doom bar's sphere sigil, which disagrees with the engine's doom cards. One data table, guarded by a consistency test.
- Adds a trace and a debug accessor.
- Updates rulebook §8 to IMPL.

## scope (what this plan does NOT do — explicit non-goals)

- Does not tie the doom to the god's spheres or nature. A table was weighed and rejected; an identity tilt is deferred to the Dominion map's opposing-dominion ticket.
- Does not redraw the doom on "Begin Next Cycle". That is Twilight/World-Soul design.
- Does not read the World-Soul or resonance to tilt the draw. That is cross-run design; only a weights seam is left.
- Does not author new doom content (cards, omens, stage names, matrices). All seven are already authored.
- Does not let the player choose the doom.
- Does not change doom clock pacing, stages, the floor or the wake rule.

## impact_class

Reversible. One default changes; six authored doom identities now run in real games. The showcase is pinned, and the weights constant can restore always-Breach in one edit.

## evidence cited

- **Linear issue:** THR-1774
- **Vision premises invoked:** rulebook §8 ("every run starts with one of seven archetypes"; "the next world is a response"); Vision North Star via rulebook §8
- **UL terms touched:** Doom Clock (existing); the archetype names are the rulebook's own words. No new terms, no UL-proposal needed.
- **Canon pages consulted:** `Docs/canon/rulebook.md` §1 and §8, `Docs/canon/systems-inventory.md` (Doom Clock & Journey, ACTIVE), `Docs/canon/interface-map.md` (Doom/Journey UNAUDITED → audited on touch), `Docs/design-system/laws.md` (1, 4, 9, 12, 13, 14, 17, 18, 21, 33, 37, 56), `Docs/ops/player-complaint-classes.md` (PC-1, PC-3, PC-6)
- **Prior plan docs this builds on:** `Docs/plans/2026-04-15-doom-archetype-identity-pass-design.md`, `Docs/plans/2026-04-29-doom-identity-remaining-archetypes.md`, `Docs/plans/2026-03-04-vertical-slice-design.md` (line 168, "new archetype from world-soul state"), `Docs/audits/2026-10-06-thr-1772-starting-god-stats-and-cross-run-persistence-research.md` §1
- **Rejected approaches considered and dismissed:** a hunger → doom table (three archetypes have no sphere key, and the ticket's "matrix maps archetype × sphere" premise is false: 0 sphere fields); a pure seed draw (all gods on a seed share a doom); a player-chosen doom (a direction call, out of scope)

## load-bearing decisions touched

- **"Everything is a graph node/edge."** Respected: the archetype stays a GameState scalar, as it is today. No relational table, no new node type.
- **"Engine caches are owned per session."** Respected: there are no module-scope caches; the presentation tables are immutable constants.

## high-impact files touched (from Codesight)

`src/engine/gameInit.ts` is widely imported (fixtures, scripts, CLI). The signature change is additive, but the default behaviour changes for every caller that omits the doom argument. The plan has a Blast Radius section and executor notes on `test:heavy` baselines. `src/types/trace.ts` is a wide-blast file; the change is an additive union member and interface.

## kill criteria

- If the warm or cold playtest shows testers cannot tell one doom from another across runs, the matrices' tilts are too weak. That is a content follow-up, not a revert.
- If `test:heavy` shows a non-Breach archetype breaking a run (a crash, a stalled clock, an empty omen pool) under the drawn default, that archetype's authored data is defective. Set its weight to 0 (one constant), file the defect, and keep the other five live. Revert to always-Breach only if two or more archetypes fail.
- If Christian vetoes "drawn, not by the god", set the weights by identity (option 2) or reserve the table for him. The draw function stays.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- The ticket's own premise that `doom-identity-matrices.ts` "already maps archetype × sphere" is false (`grep -n sphere` returns 0 hits). The only archetype → sphere data is in the doom card blueprints, and covers four archetypes. That fact decided the call; please check it.
- The DoomBar sigil fix is scope beyond the ticket's text. I included it because the bug fix makes it player-visible the first time a non-Breach world runs (PC-6), and the fix is a data move plus a test.
- The seed-42 distribution numbers come from a scratch prototype mirroring the plan's exact function, so they depend on the stated offset. The plan tells the executor how to re-pin.
- The tooltip second clauses were each checked against the matrix values; the table is in the plan.
- The lane decided this under the 2026-09-11 delegation. The veto lines go to Christian through the lane report.
