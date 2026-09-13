# Batch brief — the Realm's court (THR-1454)

**Slug:** `realm-court` · **Slots:** 3 · **Family tag:** `#crown_errand` (new — see § Vocabulary)
**Ticket:** [THR-1454](https://linear.app/threadbare/issue/THR-1454) · **Design:** `Docs/plans/2026-09-10-thr-1155-realms-and-areas.md` § Content pillar

## Portfolio — what the corpus needs, and why these three

THR-1155 shipped a Realm as a first-class faction: a definition minted per world, a
court ladder (`REALM_RANK_LADDER` — *stranger · subject · yeoman · sworn · thane ·
counsel*), two class-scoped rows in `FACTION_ENCOUNTER_META`, and the `$realm`
sentinel. It authored no prose on purpose. The result is a faction the player can
*see* on the map and can never *meet*: the red border moves when a town falls, and
nothing in the world ever asks the mortal anything on the Realm's behalf.

These three are the first content to spend `$realm`. They are chosen to cover the
three distinct relationships a mortal can have with a crown, so the family is a
family and not three variations:

| Slot | The relationship | Who initiates | Where |
|---|---|---|---|
| 1 `court_summons` | the Realm **calls** you — standing offered, standing at risk | the crown | its seat |
| 2 `border_levy` | the Realm **takes** from you at its edge | its armed men | the border |
| 3 `tithe_demanded` | the Realm **is owed** by you where you live | its collector | your town |

Each is a different door into the same ladder, so a mortal who meets all three has
been summoned, taxed on the road, and taxed at home — which is what belonging to a
realm actually feels like from underneath.

## Game design — fixed before any premise (director ruling 2026-08-24)

### The binding rows

| | slot 1 `court_summons` | slot 2 `border_levy` | slot 3 `tithe_demanded` |
|---|---|---|---|
| `reach` (binding) | `gold` | `iron` | `gold` |
| `rarityTier` (binding) | 2 | 2 | 2 |
| **Consequence hand** | `possession` + `movement` | `thread` + `drive` | `condition` + `drive` |
| settings | `urban`, `stronghold` | `wayside`, `rural` | `rural`, `urban` |
| shape | single_test → prize | danger → confrontation | query → prize |
| steps | gold 0.35 → heart 0.40 | gold 0.35 → iron 0.40 | gold 0.35 → heart 0.40 |

Consequence hands rolled with `npm run draw:consequences -- <id> --reach <r> --rarity 2`;
`check:encounter` recomputes each from id + reach + rarity, so reach and rarity are
frozen by the roll. No swaps taken.

### How each drawn family is wired in context

- **slot 1 `possession`** → `reward_draw` on step 1's `successMetadata`. A court that
  calls you and is satisfied hands you something: the prize is drawn, not authored, so
  the same summons pays differently in different worlds.
- **slot 1 `movement`** → `agent_relocation` (travel intent) on the success band. The
  court does not dismiss a useful subject; it sends them on with its word. This is the
  one consequence that makes a summons feel like *service* rather than an interview.
- **slot 2 `thread`** → `thread_strengthen` / `thread_weaken`, `$ascendant` + `$actor`.
  A road held against armed men with the god's hand plain on it is exactly when a thread
  tightens; a mortal beaten at a toll post while the god watched is when it frays.
- **slot 2 `drive`** → `plant_compulsion` on the failure side. A levy taken by force
  leaves a mortal leaning toward the duel and the quiet theft and away from the road.
  *(Authored first as `assign_ambition` with `ambition_seek_revenge`, which is the
  better fiction and does not exist as far as the gate is concerned: grievance
  ambitions live in `GRIEVANCE_AMBITION_TEMPLATES` and `validateNudgeGrantRefs` builds
  its set from `AMBITION_TEMPLATES` alone — impediment #1036. Same drawn family, so no
  `consequenceSwap` is owed.)*
- **slot 3 `condition`** → `apply_condition` (`trait.condition.shaken`) on the failure
  side. Publicly squeezed for a year's shortfall in front of the neighbours, and it
  shows. *(The design wanted `trait.condition.debt-laden` — a due met by borrowing is a
  debt the sheet carries — and that id is authored in `economic-trait-content.ts` but
  sits in neither the grantable condition catalog nor the attachment catalog, so
  nothing can apply it and no chip can anchor it: impediment #1035. `shaken` is live,
  sheet-visible, and the prose was rewritten toward it rather than around it.)*
- **slot 3 `drive`** → `plant_compulsion` on the success-at-cost side. A year paid to
  the last measure leaves the mortal leaning toward whatever pays.

### Payoffs, prizes, penalties — band by band

Every slot pays the ladder: **`faction_reputation_gain` with `factionId: '$realm'`** on
the success side, negative on the failure side. This is the family's spine — it is what
makes all three the *same* Realm's business, and it is what the ticket's third Done-when
reads (the faction sheet's court rank moves through `factionReputation`).

| Band | What it costs / pays, across all three |
|---|---|
| `critical_success` | the ladder moves, and the prize/thread/relief lands at its best |
| `success` | the ladder moves |
| `success_at_cost` | the ladder moves and the mortal carries something for it |
| `failure` | standing lost; the drawn penalty family fires |
| `critical_failure` | standing lost hard; the penalty fires and the extreme band narrates it |

**Cool failure.** None of the three kills, jails, or brands. A crown that is displeased
*withdraws* — the door is still there next year, it is simply colder. That is the
family's failure register, and it is what keeps a Realm reusable content rather than a
one-shot.

### Cost channels and grants

One authored `costs.detectionDelta` Heavy Hand across the batch (`levy.loosen_the_post`
— the god shifts the post the toll rope hangs on, and rival gods see the working), never
two in a hand. **No authored Bargain**: a plain doom-priced odds card is a library member
every god already holds, and the spec's § 3b is explicit that a special may not be a
plain odds boost or a rider — so the doom channel reaches these hands from the
Repertoire, not from an author. No card grants content — every drawn family lands
through the aftermath, where it can be band-keyed, rather than through a card that fires
regardless of how fate ruled.

### Hands

Each nudge-bearing step authors **0–2 specials** and declares a `deal` fill
(THR-1247/1248). The specials are the cards only a crown's business could offer — a
word that carries because the court's own herald said it, a name remembered from a
muster roll. Everything generic — plain boosts, riders — is dealt from the god's
Repertoire, so the player meets cards they already know.

## Vocabulary — one new family tag

`#crown_errand` — *Work set by a Realm's crown — the summons, the levy, the due.*

The family axis already carries **twelve** `#<body>_errand` tags, one per faction that
sets work (`#guild_errand` … `#court_errand`, the Underking's). A Realm is the
thirteenth body that sets work, and it is the only one whose faction is minted per
world — which is exactly why its content needs a stable *word* rather than an id
prefix (THR-1488: 41 of 51 id-prefix families matched nothing). `#court_errand` is
taken by the Underking's Court and cannot be reused.

Seating rule (`src/data/content-tags.ts`): *≥1 runtime reader **or** ≥3 bearers.*
These three encounters are three bearers, so it seats on the bearer arm on the day it
lands. Scoped to `encounter_template`, like its twelve siblings.

**This is an execution session seating a tag the canon says a design session normally
seats.** Recorded here and in `Docs/canon/content-objects.md` in the same PR, and
flagged on the ticket for veto — the alternative was reusing `#court`, which is
honest for slot 1 and wrong for slots 2 and 3, and a family whose word only fits a
third of the family is the failure mode the errand axis exists to avoid.

## Rolled constraints

```
npm run draw:packet -- realm-court --slots 3 --ids
slot 1:
  plotHookRolled: hook.environmental_gauntlet, hook.negotiation_under_pressure, hook.shifting_shape
  plotHookTaken:  hook.negotiation_under_pressure
  reach: heart   setting: arcane   shape: single_test   system: carryover
  p3Shape: opportunity   opposition: law (duty)   disposition: hostile
  agentRole: the_target   scale: company
slot 2:
  plotHookRolled: hook.gods_fall, hook.mentors_test, hook.crowd_and_purse
  plotHookTaken:  hook.crowd_and_purse
  reach: eye   setting: sacred   shape: danger_confrontation_aftermath   system: forks
  p3Shape: choice   opposition: own_trait   disposition: neutral
  agentRole: bystander_pulled_in   scale: personal
slot 3:
  plotHookRolled: hook.reconciliation, hook.haunt_resolution, hook.deck_reading_gone_wrong
  plotHookTaken:  hook.reconciliation
  reach: veil   setting: urban   shape: query_prize   system: items
  p3Shape: mystery   opposition: uncanny   disposition: hostile
  agentRole: trespasser   scale: region
```

### Overrides, each with its reason

The packet die is gap-weighted toward the corpus's thin cells and knows nothing about
this ticket. THR-1454 names its three premises in the ticket body, so the **premise is
a constraint, not a roll** here, and three rolled axes are overridden:

- **reach** — rolled `heart · eye · veil`; taken `gold · iron · gold`. A crown's
  business is influence and arms; the Realm's own `reachWeights`
  (`buildRealmDefinition`: iron 0.6, gold 0.5) say so in code. An `eye` levy is not a
  levy. *The override is recorded before the consequence roll, because reach seeds the
  binding hand — these are the reaches the gate will recompute against.*
- **setting** — rolled `arcane · sacred · urban`; taken as the table above. A court
  is not arcane and a border is not sacred. `urban` survives on slot 3 as rolled.
- **opposition / agentRole** — rolled `uncanny` and `trespasser` on slot 3; taken
  `law (duty)` and `the_target`. A tithe is the law arriving; nothing uncanny is in it.

Kept as rolled: **p3 stake shapes** (opportunity · choice · mystery — one each, no
repeat), **dispositions** (hostile · neutral · hostile, inside the ≤2-hostile floor),
**scale** (company · personal · region), and **shape** (single_test ·
danger_confrontation_aftermath · query_prize, the query-prize floor met by slot 3).

Hooks stay advisory by doctrine — nothing compares the finished encounter to the hook.
`hook.negotiation_under_pressure` genuinely drove slot 1; `hook.crowd_and_purse` gave
slot 2 the crowd at the toll post; `hook.reconciliation` gave slot 3 the collector who
would rather not be doing this. `usedBy` stamped at closeout.

## Registration

All three register class-scoped in `FACTION_ENCOUNTER_META` with
`factionClass: 'realm'` and `factionDefId: CLASS_SCOPED_META_DEF_ID` — the shape
THR-1155 shipped for `realm.join` / `realm.promotion`. That is the whole of realm spawn
scoping: the plan doc's § Content pillar ruled that realm content is faction content
and needs no new axis, and `metaBelongsToDefinitionId` already resolves a class-scoped
row against every per-world Realm.

`minRank` per the ladder: `subject` for the summons (the crown calls its own),
`stranger` for the levy and the tithe (they happen to anyone standing on the ground).
`questType: 'standard'` on all three, so the tier-restricted rank gate
(`RANK_GATED_QUEST_TYPES`) leaves them reachable — the family's job is to *start* a
mortal up the ladder, and gating the entry rung behind the ladder is a closed door.
