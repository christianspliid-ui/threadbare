# Batch brief — deep-places (2 encounters)

**Drafted:** Claude Opus 5 (attended session), 2026-08-25 · **Approved:** pending — Christian, chat

**Why two and not six.** Ruling 1 sets the production batch at 6. This run is a **pipeline
judgement** at Christian's request ("entirely new encounters made from scratch using the
encounter factory to judge the pipeline"), so the batch is sized to be readable in one
sitting rather than to fill a portfolio row. Every stage of the line runs unchanged; only
the count is smaller, and the variance caps below are halved to match.

## Why this batch

Rank 2 on the portfolio's target mix — **Ruins and the delve** — has 23 legacy premises,
**zero nudge-native content and zero composition-complete content**, and the setting
classes it lives in are the emptiest in the game: `ruin` and `arcane` carry **one authored
opening each**, `sacred` carries two. The last batch (border-perils) fed `battlefield` and
`stronghold`; nothing has fed the ground *under* things. The player today can be
inconvenienced on a road and threatened on a border, but there is nowhere they can go
**down**. This batch builds the descent: places that were shut on purpose, and what it
costs to open them.

It also aims at two thin engine cells the corpus has never spent. The lead reaches are the
two thinnest in `encounter.*` — `star` (30 steps, half the next reach) and `shadow` (42) —
and the consequence hands drew `drive` and `movement`, families with near-zero users, in a
corpus whose reflex is condition + bond + reputation on every ending.

## Family and setting envelope

- **Family:** `encounter.delve.*`
- **Setting classes:** `ruin`, `arcane`, `sacred` — **all three, per encounter**, one
  opening each. Feeding three starving cells at once is the point, and a three-class
  envelope forces a genuinely setting-neutral spine, which is the part of the format most
  likely to be faked in a two-class one.
- **Excluded:** `wayside` and `rural` — the roadside skew this batch exists to correct
  (six of eight slice encounters open on a road). `urban` — civic ground, a later batch.
  `battlefield` and `stronghold` — border-perils fed both last batch.
- **Cast consequence:** a three-class envelope inherits no family default support bundle
  (THR-1044), so **both encounters declare their own**, class-honest at ruin, arcane and
  sacred alike — check `LOCATION_ROLE_ROSTERS` before picking `reuseNpcRoles`.

## Variance targets

Caps halved from the batch-of-6 defaults, since two encounters sharing an axis is the
same failure as six sharing three.

| Axis | Target across the batch |
|---|---|
| Reach spread | Two distinct lead reaches, both from the corpus's thinnest third (`star`, `shadow`); no reach appears as a lead twice; at most one reach repeats anywhere across all steps |
| Decision shapes | Two **different** shapes from the catalog — one carryover chain, one investigation chain |
| Tone | At most one resolves grim |
| Step counts | One 2-step, one 3-step. No 1-step encounter in this batch: a delve that resolves in a single roll is a road encounter with a roof |
| P3 stake shapes | Both distinct (rolled: contest / threat) |
| Opposition | Both distinct — see the slot-2 override below |
| Disposition | Not both hostile (rolled: hostile / neutral) |
| Agent's role | Both distinct (rolled: the competitor / bystander pulled in) |
| Scale | ≥1 settlement-or-larger (rolled: company / settlement — floor met by slot 2) |

## Rolled constraints (per slot)

**Ordering note (authoring order, step 2 before step 3).** The category, the shapes, the
step counts, the lead reaches, the payoff shapes and the cost channels below were fixed
*before* any roll, and the rolls were then taken with those reaches as their input. Two
earlier rolls exist under the slugs `monster-hunt-1` / `monster-hunt-2`; they were made
before the design was settled, against a category that was not chosen, and **nothing from
them is used**. Recorded here so the roll history is honest rather than tidy.

```
slot 1:  encounter.delve.the_broken_seal
  plotHookRolled: hook.civil_unrest, hook.descent_into_darkness, hook.betrayal_revealed
  plotHookTaken:  hook.descent_into_darkness
  p3Shape:     contest              opposition:  the law / custom of the place
                                                 (motive: precedent) · activity: fleeing
  disposition: hostile              agentRole:   the competitor
  scale:       company
  consequenceDraw: drive, movement  (rolled at reach star, rarity 2 — no swap)

slot 2:  encounter.delve.the_drowned_archive
  plotHookRolled: hook.mad_artificer, hook.dangerous_truth, hook.stranger_bargain
  plotHookTaken:  hook.dangerous_truth
  p3Shape:     threat               opposition:  OVERRIDDEN — the uncanny
                                                 (threads, relics, spirits; motive: its own law)
                                                 · activity: waiting
  disposition: neutral              agentRole:   bystander pulled in
  scale:       settlement
  consequenceDraw: relationship, knowledge  (rolled at reach shadow, rarity 2 — one swap)
  consequenceSwap: { from: 'movement', to: 'knowledge' }
```

**Two recorded deviations, both with their reason:**

1. **Slot 2's opposition is overridden** from the rolled `the law / custom of the place`
   to `the uncanny — its own law`. Both slots rolled the same opposition face. Die 2's cap
   is ≤2 per batch, which a two-slot batch satisfies trivially and pointlessly — the die
   exists to stop the corpus converging, and letting a two-encounter batch spend its whole
   opposition budget on one face is that convergence with the cap's blessing. Slot 1's
   premise (a way shut by decree, and the decree still enforced) is the one that needs
   `law/custom`; slot 2 keeps it. `the uncanny` has no user in the nudge-native corpus.
2. **Slot 2 takes its one consequence swap**, `movement` → `knowledge` (weight 7 in
   `shadow`, comfortably over the ≥2 floor). Both slots drew `movement`, and the same
   reasoning applies: two encounters cannot spend their only variance axis on one family.
   Slot 1 is the honest home for `movement` — its failure bands *are* being driven back
   out of the ground. Slot 2's prize is the record itself, so `knowledge`
   (`intelligence` / `spawn_clue`) is what that scene was already about. Slot 1 takes no
   swap.

## Systems quota targets

Contract floor is 3 (`COMPOSITION_SYSTEMS_QUOTA_MIN`); this batch targets **4+ per
encounter**, counted from the authored manifest, not from prose.

- **Reach for:**
  - `drive` — `assign_ambition` / `plant_compulsion`. Slot 1's drawn family, and a
    near-zero-user cell: what going down there leaves a person *wanting*.
  - `movement` — `agent_relocation`. Slot 1's other drawn family. A delve that goes wrong
    puts you somewhere else, and the map should show it.
  - `knowledge` — `intelligence` / `spawn_clue`. Slot 2's swapped-in family; 15 templates
    touch `intelligence` and none of them are a delve.
  - `place` — a condition kind carrying `targetLocationId`. The subject of both encounters
    is a **location**; at least one ending per encounter should change what is true of it.
  - **Card cost channels and grants** (THR-885) — still the thinnest content layer in the
    game. Each encounter authors **≥1 card priced on a non-essence channel**
    (`costs.doomDelta` / `costs.detectionDelta`) and **≥1 card carrying a real `grants`
    entry** against built content.
- **Avoid defaulting to:** the `condition_attachment` + `bond_change` + `reputation_*`
  stack. Border-perils ran it on all six of its encounters and it is now the corpus's
  reflex. Conditions and bonds may appear — slot 2 *drew* `relationship` — but neither
  encounter may reach its systems quota on that stack alone. `hidden_mark` only where the
  fiction earns it. **No `reputation_tally` chip** (Law 13 parity — `check:encounter`
  fails it).

## Anchors this batch intends to touch

| Anchor kind | Target across the batch |
|---|---|
| `location` / `sublocation` (🔗 linked) | **Both** encounters anchor ≥1 chip at the place itself, declared `visualKind: 'location'` so it carries the click (THR-1172 — the catalog's own text was wrong about this until 2026-08-24; do not omit `visualKind`) |
| `attachment` (condition / possession) | ≥1 across the batch, `entityId` = the **template** node id |
| `ambition` (📍 named) | ≥1 — where slot 1's `drive` family lands; `entityId` = the ambition node id, no `visualKind` |
| `artifact` (🔗 linked) | ≥1 spawn or grant across the batch |
| `individual` (🔗 linked) | **At most one chip per encounter.** The corpus's habit is to make every chip about a person |

**Avoid defaulting to:** `individual` as the only anchor kind, and `faction` — border-perils
spent the faction anchor twice and the ground under a ruin is not held by anybody.

## Over-exposed cards

Census taken 2026-08-25 from `libraryCardId` across all shipped encounters plus the golden
exemplar (37 tagged cards) and from `// Type:` authoring comments (the border batch is the
first content to set `libraryCardId`, so the tally has real data for the first time).

| Card | Times authored | Instruction |
|---|---|---|
| `card.boost.core` | 10 | **at most once** across the batch |
| `card.boost.signature.energy` | 8 | **not at all** |
| `card.undertow.signature.darkness` | 5 | at most once |
| `card.mercy.core` · `card.kindled_ambition.signature.spirit` · `card.heavy_hand.signature.force` | 4 each | at most once each |
| `card.omen.signature.time` · `card.compulsion.signature.mind` | 3 each | at most once each |

**Type-level:** `boost` is 86 of the 133 annotated authored cards (~65%). **≤2 Boosts per
hand, ≥3 distinct card types per hand.**

**Reach for the unspent members.** Fourteen library members have **zero** authorings:
`card.insurance.core`, `card.long_game.hunger.sever`, `card.balm.hunger.reclaim`,
`card.cache.hunger.gather`, `card.omen.hunger.wander`, `card.whisper.hunger.witness`,
`card.favor.hunger.bind`, `card.compulsion.hunger.haunt`, `card.stumble.hunger.reshape`,
`card.undertow.hunger.consume`, `card.heavy_hand.hunger.illuminate`,
`card.gambit.attunement.chaos`, `card.insurance.variation.shared`,
`card.mercy.variation.witnessed`. **≥6 of the batch's cards must be members from that
list.** The `side_bet` and `fellowship` types have no library member at all — a one-off is
legal there and worth doing once.

**Every card that matches a library member sets `libraryCardId`**, so `cardPlayTally`,
twilight harvest and the echo card keep receiving data. A card genuinely outside the
library stays a one-off, stated as a choice in its code comment.

## Out of scope

- **Army, war and siege mechanics.** Adjacent ground, and border-perils owns it.
- **Agent-magic as a mechanic.** `arcane` is a *setting class* here — the scene may be a
  wardhouse or a sunken orrery, but nothing in either encounter may be built on the
  agent-magic system, which the catalog marks deferred. Flavor at most.
- **New engine primitives.** Both encounters ship on mature systems only: movement,
  conditions, carryover, items, traits, seeds, intelligence.
- **`authoredChoices`.** Retired. A fork the mortal picks is `ActionStepBranch.decidedBy`;
  a fork the player picks does not exist.
- **A new trait continuum.** Minting one is pre-authorized (Christian, 2026-08-12) but it
  is a design ticket's worth of work, and this batch is a pipeline judgement. Hook onto
  live traits only; if a slot genuinely needs a continuum that does not exist, note it as
  a finding rather than minting it here.
