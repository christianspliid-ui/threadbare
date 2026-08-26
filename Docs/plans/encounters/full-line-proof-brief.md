# Batch brief — full-line-proof (1 encounter)

**Drafted:** Claude Fable 5 (attended session), 2026-08-26 · **Approved:** Christian, chat, 2026-08-26 ("lets run")

**Ruling-1 deviation, stated:** this batch is **1**, not 6 — director's direction,
2026-08-26 ("a full batch of 6 is premature; I can judge quality on 1"). This is the
first run to exercise the *complete* expanded line in one pass: `draw:packet` rolled
constraints → dealt-hand drafting → `compile:encounter` → gates → live proof → report.
Deep-places (2026-08-25) ran a two-slot judgement under the same deviation clause.

## Why this batch

Nowhere in the game can a mortal face a beast. **Monsters and the hunt** is rank 3 on
the [portfolio's target mix](../../audits/2026-08-24-encounter-portfolio-assessment.md)
and the emptiest genre band — zero nudge-native content, zero composition-complete
content — riding only mature systems (conditions, items, cards, forks). The player gets
the game's first hunt: something hungry has denned where people need to go, and the god
watches a mortal decide what that is worth. Rank 1 (siege) is deliberately reserved for
the first full production 6-batch — the largest gap deserves the full spread, not a
lone scout.

Secondary, stated honestly: this run is also the pipeline judgement for the expanded
factory line, and it is sized for that reading.

## Family and setting envelope

- **Family:** `encounter.hunt.*` — new family; no family default support bundle exists,
  so the encounter **declares its own**, class-honest per envelope class (check
  `LOCATION_ROLE_ROSTERS` before picking `reuseNpcRoles`).
- **Setting classes:** `rural`, `wayside`, `stronghold` — three per the deep-places
  precedent (a three-class envelope forces a genuinely setting-neutral spine). A stored
  hoard and a denned beast read at a village granary, a waystation store, and a fort's
  storehouse alike.
- **Excluded:** `ruin` / `arcane` / `sacred` — deep-places just fed all three. `urban` —
  civic ground, a later batch. `battlefield` — border-perils fed it.

## Variance targets

Single slot, so the batch-level caps bind trivially; what still binds is the hand and
the step structure:

| Axis | Target |
|---|---|
| Steps | 2–3 (medium). No 1-step: a hunt that resolves in one roll is a road encounter with teeth |
| Decision shape | Personality Fork (rolled) — a test, then an **agent-decided** branch on a named value axis (THR-894), pole-specific continuations, both poles viable |
| The hand | **Composed, mandatory** — 0–2 authored specials + a declared `deal` fill (dealt 4–6). This is the third `deal` user and the machinery under proof. All composed-hand rules bind: ≥4 spheres, ≥1 ungated common, ≤1 rider, ≤2 Boosts, ≥3 distinct card types |
| Specials | Neither authored special from the over-exposed table below |
| Tone | Fear is allowed; grim resolution is not required. The beast is an animal with a motive (hunger), not a villain |

## Rolled constraints (slot 1)

Rolled by `npm run draw:packet -- full-line-proof --slots 1` (deterministic — anyone can
recompute). **Ordering note, recorded honestly:** the packet was rolled before the
category was fixed; the category was then taken from the portfolio's standing ranked mix
(rank 3, with rank 1 reserved as above), and the rolled faces fit it without a single
override. The consequence hand was rolled at the template id after titling, per the
deep-places precedent.

```
slot 1:  encounter.hunt.the_beast_in_the_granary
  plotHookRolled: hook.impossible_heist, hook.ritual_of_undeath, hook.masterwork_completion
  plotHookTaken:  hook.impossible_heist
  reach: shadow                    setting: rural
  shape: personality_fork         system: cards
  p3Shape: choice                  opposition: beast (hunger) · activity: sleeping
  disposition: wary                agentRole: the client who is owed
  scale: settlement
  consequenceDraw: possession, membership  (rolled at reach shadow, rarity 2 — no swap)
```

**Premise line from the taken hook** (fiction stays out of the brief beyond this): what
the agent is owed sits inside a settlement's sealed store, and something hungry has
denned on top of it. The two costly courses (P3 `choice`): rouse the settlement and lose
the store, or go in quiet past a sleeping thing. `shadow` is the lead reach; the fork
lands at the moment the mortal stands over what they came for.

## Systems quota targets

Contract floor is 3 (`COMPOSITION_SYSTEMS_QUOTA_MIN`); this encounter targets **4+**,
counted from the authored manifest.

- **Reach for:**
  - `possession` — drawn family: wire one of `spawn_artifact` / `attachment_grant` /
    `reward_draw`. What is owed, reclaimed — or lost for good.
  - `membership` — drawn family: wire `membership_change`. A **zero-user family** in the
    corpus (`groups` counted 0 in the portfolio census); an ending where the settlement
    takes the agent in — or closes to them — is the first membership consequence in the
    game.
  - `conditions` — the portfolio names this band "the first real use of `conditions`":
    a hunt that goes wrong wounds (`condition_attachment`, `trait.condition.wounded` —
    tier promotion fires automatically).
  - **Card cost channels and grants** (THR-885) — the rolled system target is `cards`:
    ≥1 card priced on a non-essence channel (`costs.doomDelta` / `costs.detectionDelta`)
    and ≥1 card carrying a real `grants` entry against built content.
- **Avoid defaulting to:** the `condition_attachment` + `bond_change` + `reputation_*`
  stack as the quota. The wound may count; the quota is not met on that stack alone.
  No `reputation_tally` chip (Law 13 parity — `check:encounter` fails it).

## Anchors this batch intends to touch

| Anchor kind | Target |
|---|---|
| `location` / `sublocation` (🔗 linked) | ≥1 chip anchored at the store/place itself, `visualKind: 'location'` so it carries the click (THR-1172) |
| the group of the `membership_change` | its chip anchors the group joined or refused, not a person |
| `attachment` (possession / condition) | ≥1, `entityId` = the **template** node id |
| `individual` (🔗 linked) | **at most one chip** — the corpus's habit is to make every chip about a person |

**Avoid defaulting to:** `individual` as the only anchor kind; `faction` standing —
border-perils spent it, and a beast holds no banner.

## Over-exposed cards

Census re-taken 2026-08-26 from `libraryCardId` across all shipped encounters + the
golden exemplar (the deep-places census plus the three encounters shipped since):

| Card | Times authored | Instruction |
|---|---|---|
| `card.boost.core` | 11 | not at all |
| `card.boost.signature.energy` | 8 | not at all |
| `card.undertow.signature.darkness` | 7 | not at all |
| `card.kindled_ambition.signature.spirit` · `card.heavy_hand.signature.force` | 6 each | not as specials; dealt is fine |
| `card.mercy.core` · `card.compulsion.signature.mind` | 5 each | not as specials; dealt is fine |

The `deal` fill is the diversity mechanism — the dealt cards come from the Repertoire
and are not the author's to converge. The instruction column binds the **authored
specials**; a `deal` exclude list may additionally be used to keep the table's top three
out of the dealt fill.

**Every card matching a library member sets `libraryCardId`** so `cardPlayTally` keeps
receiving data; a genuine one-off states the choice in its code comment.

## Out of scope

- **Army, war, siege.** Rank 1's ground; not this run.
- **Agent-magic as mechanic.** Deferred system; flavor at most.
- **New engine primitives.** Mature systems only: conditions, items, cards, forks,
  movement, carryover, seeds.
- **`authoredChoices`.** Retired. The fork is `ActionStepBranch.decidedBy`; a fork the
  player picks does not exist.
- **A new trait continuum.** Live traits only; a genuinely missing continuum is a
  finding, not a mint.
- **A bestiary system.** The beast is cast + conditions + prose, not a new node type.
  If the drafting agent finds itself wanting one, that is a finding for the batch
  report.
