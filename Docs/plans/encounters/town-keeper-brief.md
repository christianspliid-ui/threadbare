# Batch brief — the town-keeper pair (THR-1448)

**Slug:** `town-keeper` · **Slots:** 2 · **Family tags:** `#crown_errand` + `#town_keeper` (new — see § Vocabulary)
**Ticket:** [THR-1448](https://linear.app/threadbare/issue/THR-1448) · **Design:** [`Docs/plans/2026-09-21-thr-1448-held-town-faction-position.md`](../2026-09-21-thr-1448-held-town-faction-position.md) § Content pillar

## Portfolio — what the corpus needs, and why these two

THR-1454 gave the Realm three doors into its court ladder — the summons, the levy, the
due — and every one of them reaches a mortal by **rank**: `encounterAccess` is `[]` at
*stranger*, so a Realm never asks anything of a mortal it does not already know.
THR-1448 opens a fourth relationship with a crown that rank cannot express: a mortal who
**keeps a town on the Realm's ground**. The crown knows that mortal by what they hold,
not by what they have done for it, and it asks them things it would not ask a stranger.

These two are the first content gated on the **hold** — `requiresHold: { ofRealm: true }`,
a template field, read by the filter's hold gate and offered by the supply arm past the
rank allowlist — so they reach a keeper at *stranger* and keep reaching them after the
court has stopped asking. They cover the two directions the relationship runs:

| Slot | The relationship | Who initiates | Where |
|---|---|---|---|
| 1 `keepers_petition` | the town's troubles arrive at the keeper's door **as the crown's business** | the town, through the crown's reeve | the kept town |
| 2 `crowns_reckoning` | the Realm **turns to its keeper** for what it would not ask a stranger | the crown's marshal | the kept town |

## Game design — fixed before any premise

### The binding rows

| | slot 1 `keepers_petition` | slot 2 `crowns_reckoning` |
|---|---|---|
| `reach` (binding) | `heart` | `iron` |
| `rarityTier` (binding) | 2 | 2 |
| **Consequence hand** | `condition` + `omen` | `membership` + `omen` → **one recorded swap** `membership` → `standing` |
| settings | `urban`, `rural` | `urban`, `stronghold` |
| shape | query → prize (the settled figure) | danger → query (the marshal's ask) |
| steps | heart 0.35 → gold 0.40 | iron 0.35 → heart 0.40 |
| gate | `requiresHold: { ofRealm: true }`, meta `minRank: 'stranger'` | same |

Hands rolled with `npm run draw:consequences -- <id> --reach <r> --rarity 2`.

### The swap, recorded (THR-1145)

Slot 2 drew `membership`. It fights this fiction **by construction**: a keeper is a
member of the Realm the day the standing opens (THR-1448 mints the `member_of` edge at
`2a.55`), so `join` no-ops on every mortal this can be offered to; `leave` would expel a
keeper the plan rules keeps receiving the town's business while the town is held; and
`rank_delta` writes the derived `rank` cache the plan forbids writing (THR-1211 —
reputation is the authority). The one swap goes to `standing`, which is what a crown's
reckoning actually moves, wired both ways.

### How each drawn family is wired in context

- **slot 1 `condition`** → `apply_condition` (`trait.condition.shaken`) on the failure
  side. A keeper who could not settle their own town's due leaves the yard shaken.
- **slot 1 `omen`** → `emit_omen` (cultural) on the success side. A kept town meeting
  the crown's levy without a fist raised is what a country tells about.
- **slot 2 `standing`** (swapped) → `faction_reputation_gain` on `$realm`, both ways.
- **slot 2 `omen`** → `emit_omen` (cultural) on the failure side. A kept town's granary
  refused to the crown with the border stirring is what a country asks about.

### Payoffs — band by band

Both slots pay the ladder: `faction_reputation_gain` with `factionId: '$realm'` on the
success side, negative on the failure side — the crown-errand family's spine. Every
chip anchors `court standing` to `$realm` (`visualKind: 'faction'`) so the tag links the
crown's own sheet (THR-1499). Slot 2's at-cost band is the keeper feeding the crown and
the town eating thin — standing up, the town's prosperity the price the prose names.

## Vocabulary

`#town_keeper` (family) is seated in `CONTENT_TAGS` beside `#crown_errand` rather than
folded into it, because the two are reached by different doors — the errand by court
rank, the keeper's work by the hold — and a query that names one should not draw the
other.

## The systems prompt

`requiresHold` joins the *Live primitives* list: an author may gate a template on the
actor keeping a town for the Realm whose ground it sits on. It is a template field,
not a meta column, and it fails open on an unresolvable template.
