# Group-vs-group conflict encounters — Brainstorm Companion

> Companion to `Docs/plans/2026-07-24-group-conflict-encounters.md`. Alternatives considered,
> tensions surfaced, Vision premises invoked. Written alongside the plan.

## How this started

The THR-74 grill (Q5) split conflict out deliberately: the group layer first, the adversarial
shape second, with a schema seam promised between them. Christian's founding image — a threaded
company toppling an assassins guild by fighting the guild's own band — is the ticket's north
star. Groomed during the 2026-07-24 evening queue prep, with THR-74's engine live on main.

## First-pass framing I considered

"Design an opposed-resolution system composing with the ladder." The substrate check ended that
framing: contested pairs (TB-044) already resolve attacker/defender action pairs with
`contested_won`/`contested_lost` outcomes in a dedicated phase. The third substrate flip of the
day (after action_trigger and the army collision) — the design extends contestation to groups
instead of inventing opposition.

## Alternatives considered

**A. Reuse the battle system (momentum nodes) for band conflict.** Rejected — army-scale,
hex-anchored, multi-tick war machinery with abstract sizes; the grill verdict explicitly frames
company conflict as "two sides of one encounter" on the sigmoid → d100 ladder. Wrong scale,
wrong fiction (a skirmish between nine named people is not a war).

**B. New `opposes` edge type for standing rivalry.** Rejected — groups are actor nodes and
`hostile_to` (inter-actor hostility) already exists. The ticket's own "if traversal is needed"
clause resolves to reuse.

**C. New `band` groupType.** Rejected — `faction_band` shipped in THR-74 PR 1 and is exactly
what an NPC band is (a group moving on its faction's objective). `bandRole` is a property, not
a type.

**D. Standalone band-spawner phase.** Rejected — lair escalation and faction actions are the
places band-spawning *means something*; two thin triggers into the shipped `createGroup` beat a
new phase with its own scheduling.

**E. Symmetric full-simulation (bands draw their own encounters continuously).** Deferred —
v1 bands act when paired (counter-templates) and otherwise just roam/guard via shipped group
movement. Full autonomous band agendas would be scope without a player-visible payoff yet.

**F. Casualties always lethal.** Rejected — The Standoff exists as the non-lethal rung, and
casualty rolls are gated to decisive losses; conflict that only kills flattens the drama.

## Trade-off Card

Not run — the grill verdicts frame the design; remaining calls were substrate-driven.

## Decision

Grill Q5/Q11 verdicts as recorded. Agent defaults flagged for review: two spawner triggers
(lair raiders + guild defenders) rather than one; casualty chance at decisive loss; The
Standoff as the scope-protected non-lethal template.

## Tensions surfaced

- **Conflict vs. cast size:** bands are real named agents, so every death is a graph death —
  deliberate (stakes) but tuned by `BAND_CASUALTY_CHANCE` and the band cap so the world isn't
  churned.
- **Two conflict systems in one game:** armies/battles vs company contestation. The boundary is
  scale and fiction (institutional war vs personal skirmish), stated in the plan's substrate
  section; neither touches the other's code.
- **Seam debt honesty:** the `opposingGroupId` seam THR-74 promised was never implemented — the
  plan says "add", not "populate", so the executor isn't sent hunting for a phantom field.

## Vision premises this plan leans on

- **One mortal in a crisis.** This plan's version: contested steps have named protagonists on
  both sides; the guild falls through the player's mortal's hands, not a progress bar.
- **The world runs without you.** This plan's version: lairs breed raiders and guilds defend
  themselves whether or not the player is watching.
- **Failure is plot.** This plan's version: `contested_lost` feeds cohesion damage, fray drama,
  injuries, and grudge edges — losing a fight starts a story.

## Taste profile touchpoints

- Neutral bond glyph for bands was pre-designed into the cluster spec (gold = yours) — no new
  visual language invented.
- Rivals surface as prose ("Blood between them and the Ashen Knives"), never a hostility meter.
