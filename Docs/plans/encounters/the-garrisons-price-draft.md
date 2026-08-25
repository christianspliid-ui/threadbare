# Encounter Pipeline: The Garrison's Price
> Scale: medium | Slug: the-garrisons-price | Pass: draft
> Date: 2026-08-24 | Pipeline version: 3.0 (Encounter Factory)
> templateId: `encounter.border.the_garrisons_price` | Batch: border-perils (THR-1221), row 6

**Binding inputs (not renegotiated here):**
[border-perils-brief.md](border-perils-brief.md) ·
[border-perils-batch-design.md](border-perils-batch-design.md) § *6 · The Garrison's Price* ·
[nudge-authoring-spec.md](../../../.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md) ·
[swollen-ford-exemplar.ts](../../../src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts)

---

## 0. Mechanical design block (spec step 1 — written before a word of prose)

**0. The crux, in one plain sentence.** A free company holds the only gate on the agent's
road, and every price in their book is paid out of what the agent cannot replace.

**0b. The title states the crux.** *The Garrison's Price* — a player reading the title
alone knows there is a garrison and it wants paying.

**0c. Catalogs** (one entry each, from [encounter-catalogs.md](../../canon/encounter-catalogs.md)):

| Axis | Pick |
|---|---|
| Shape | **Opt-in Complication** (gate + Test & Consequence) |
| Setting | `wayside` · `ruin` · `battlefield` · `stronghold` (all four, one opening each) |
| Pressure | `debt` (undertone `duty`) |
| Form | `bargain` |
| Objective | `negotiate` |
| Stakes | `passage` — *the road opens / opens early*; surface: movement, location gates |
| System | `movement` + `traits` (both **mature** tier) |

**0d. Hook.**
```
plotHookRolled: hook.impossible_bargain, hook.prophetic_investigation, hook.scarcity_crisis
plotHookTaken:  hook.impossible_bargain
```
Hook text: *"Every option on the table costs something irreplaceable, and the terms being
offered are honest."* **The word that binds the draft is `honest`.** The company is not a
villain and is not written as one: their contract lapsed two seasons ago, the pay stopped,
and they have held the post anyway because the road is what they have left. The prices are
real because the need is real. `usedBy` gets stamped on `hook.impossible_bargain` in
`src/data/content-eval/plotHooks.ts` at closeout.

**1. Whose problem is this?** The agent's, by construction. Their road runs through the
gate. The company and the quartermaster are where the solution lives, not the subject of
the scene. Protagonist, never bystander.

**2. Which reach does each step test, and why is that the theme?**
- Step 1 — **`gold`** (Patron ↔ Extractor). The step is *about* what a thing is worth and
  who sets the figure. Chosen first; the scene grew from it.
- Step 2 — **`shadow`** (Saboteur ↔ Deceiver). The step is *about* getting out from under
  a claim without it growing. Carryover from step 1's band.

**3. Why is the agent here?** All four motive routes are honest, because a gate is
whoever's road it interrupts:
- `chance` — the road they were already walking ends at a barrier.
- `mission` — they were sent through, and the far side is where the errand is.
- `choice` — their own business is past this post and the low track costs days.
- `divine` — the god steered them onto this road.

**4. Which mechanics and objects play?** Decided now, before prose:

| Mechanic / object | Where it plays | Fact classification (prose rule 7) |
|---|---|---|
| Cast: the quartermaster | `supportBundle` actor binding, `{cast:officer}` | state **write** (spawn) / **read** (reuse) |
| Faction: `mercenary_company` | `factionDefId` on the cast spec; `reputation_with` writes | state **write** |
| Condition `trait.condition.exhausted` | step 2 `failureMetadata`; lifted by a crit-fail reaction | state **write** |
| Agreement `agreement.debt.minor` | aftermath reaction `attachment_grant` | state **write** |
| Favor edge (`owes_favor`) | step-1 Favor card grant; step-2 Favor card `requiresFavor` gate | **write** then **read** |
| Doom clock | step-1 and step-2 Bargain cards `costs.doomDelta` | state **write** |
| Detection pressure | Heavy Hand cards `costs.detectionDelta` | state **write** |
| Intelligence record | step-1 Side-bet card grant | state **write** |
| Thread edge | `thread_strengthen` on step-2 success + the crit-fail reaction | state **write** |
| Trait `trait.core.core_hope.vice` | `traitVariants` (forecast + difficulty + factor line) | state **read** (gate) |
| Carryover | step 2 `carryoverFactorLines`, keyed on step 1's band | derived |

**No base-prose sentence asserts agent history the graph does not hold.** The agent has
never been here; the scene says so by never claiming otherwise. The only prior-relationship
fiction in the encounter sits on the step-2 Favor card, which is `requiresFavor`-gated and
therefore dealt only when a real `owes_favor` edge exists.

**5. What are the rewards, and where does the tension sit?**
- **Baseline reward is passage** — the road stays a road. This is a `passage`-stakes
  encounter, and penalty-avoidance is the reward shape: the failure penalty is the low
  track (days) plus a day of wall-work (`exhausted`), both game-legible.
- **Critical success** adds standing with the company on a faction surface — the mark
  that gets you through their posts cheaper next time.
- **Toll on failure**: `exhausted`, a standing shave with the company, and the quartermaster
  thinking less of them.
- **Tension sits on step 2.** Step 1 is where the price is *named* — cheap to walk away
  from. Step 2 is where it is *paid*, and where a bad set of terms becomes a real cost.
- **Quintessence stakes: light.** Nobody dies. Nobody is unmade. The erosion class this
  encounter can cost is time and kit.

**6. Does the mortal make a choice in this scene?** **Yes — one, and it is the opt-in
gate, decided by the mortal and never by the player.** See § 1 below, which writes it out
in full. It is *not* an `ActionStepBranch`: there is no authored second path to write,
because declining is the mortal declining to be in the encounter at all. No
`authoredChoices` anywhere in this template.

**7. Every promise pays off.** The opening promises a barrier, a book, and a price. Step 1
reads the price out of the book. Step 2 pays it. The aftermath says what the payment left
behind. Nothing is opened that the bands do not close — the quartermaster is a person with
a reason, not a mystery.

**8. Personalization + supporting content — the systems count.** Counted from the
*authored manifest*, not from prose:

| Connection | Authored where | Counts |
|---|---|---|
| `cast` | `supportBundle` actor spec `officer` | ✓ |
| `factions` | `factionDefId: 'mercenary_company'` on the cast spec | ✓ |
| `reputation` | `reputation_with` (faction and agent) in step-2 metadata and two reactions | ✓ |
| `conditions` | `condition_attachment` / `remove_condition` on `trait.condition.exhausted` | ✓ |
| `rewards` | `bond_change` + `thread_strengthen` (both `PERSISTENT_EFFECT_KINDS`) | ✓ |

**Five connections; the contract floor is three.** Personalized address is live: the
quartermaster reads the traveler's name out of the book (`{cast:agent}` on the
attributed line), never a generic address.

**Consequence draw (binding — `check:encounter` recomputes it from the template id):**
```
consequenceDraw: ['relationship', 'thread']
```
No `consequenceSwap`. Both families are wired **in context**, not bolted on:
- `relationship` → `bond_change` with `$cast:officer`. The quartermaster is the person who
  set the price and watched it paid; the tie is the encounter's own subject.
- `thread` → `thread_strengthen` between the ascendant and the acting mortal. The crux is
  **debt**, and the god's hand on the scales is a second debt the mortal cannot name. The
  encounter is literally about ties that do not close, so tightening the divine one is the
  same beat read one level up.

**Reachability (THR-821).** Open-draw ambient content (`intrinsicTier: 'background'`), so
both steps sit under `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45): **0.40** and **0.38**, both
rendering as `fair`. This is the open-draw branch of the reachability rule.

**Scene tag:** `border.gate.tollpost` (WS4 vocabulary; until the manifest exists the
fallback chain ends at EntityVisual).

**Tone:** not grim. Two people at a plank table, both of them right.

### Scale justification

Medium. Two beats, one named cast member, one faction surface touched, one condition, one
agreement — a road complication with teeth, not a saga. A third step would be a second
payment beat and would say the same thing twice; a single step would collapse *naming the
price* into *paying it*, which is precisely the seam the crux lives on. The reward weight
is passage plus a standing nudge, which is medium-scale by the batch's own stakes table.

---

## 1. THE OPT-IN GATE, written out

The shape catalog's `Opt-in Complication` row: *"The agent can decline: waiting/walking away
is a cheap, legible exit (a delay, a toll), and engaging opens one of the shapes above. The
engage/decline gate is itself agent-decided (personality)."*

**Who decides.** The mortal, through the ordinary encounter-selection pipeline — their own
scoring, their own values, their own read of what a day costs them. **The player never
decides whether to approach the gate.** The hand only leans the *terms* once the mortal is
already at the table. There is no card in either hand that argues for or against engaging,
and no `authoredChoices` layer anywhere in the template.

**The engage path.** The mortal walks up, the quartermaster opens the book, and the
encounter runs: step 1 (`gold`) settles what the price is, step 2 (`shadow`) settles what
paying it actually costs. Best case, the road opens early and the company's banner counts
them a payer. Worst case, they lose a day to the wall and carry an open line in a ledger.

**The decline path.** They do not stop. They take the low track east. The template is never
drawn for that agent on that pass, which is what "agent-decided" means mechanically —
declining is not a branch inside the encounter, it is the mortal not selecting the
encounter.

**What declining costs, concretely.** Three days east by the low track — a movement delay
and nothing else. Specifically, declining writes:

- **no condition** (nobody works the wall),
- **no standing change** with the company or the quartermaster (they never dealt),
- **no agreement, no favor, no mark**, and
- **no penalty of any kind on the agent.**

The delay is real and it is the *whole* cost. The prose states the alternative in plain
figures — "three days east by the low track" — in the `initiation`, so a player reading the
scene can price the exit without doing arithmetic. **This is the clause that makes it an
opt-in and not a toll**, and it is checkable: the failure-side of this encounter writes
strictly *more* than declining does, never less.

**The one honest asymmetry, stated so nobody mistakes it for a hidden cost.** Failing the
*negotiation* is not the same as declining. A mortal who opens their mouth and haggles badly
loses a little standing with the company, because the company watched them try to shave the
price. That cost belongs to engaging, not to declining — it is the bounded risk the mortal
accepted by walking up to the table, and the exit stayed free right up to that moment. Below
the table, the exit is still there: step 1's `failBehavior` is `fail_action`, so a failed
negotiation *ends the encounter on the low track* — the same road declining takes, plus the
small standing shave.

---

## 2. The scene-writer's checklist, answered in writing

Answers cover all four openings and the shared spine.

| # | Question | Answer |
|---|---|---|
| A1 | Where are we? | Four grounded places, one per class — a fort gatehouse, a broken keep the road runs through, a dug-in earthwork on old battle ground, a barrier pole on an open track. Each is sketchable before anyone speaks. |
| A2 | How does it feel? | Cold iron and wet rope under the hand; woodsmoke; the noise of a picket eating; failing afternoon light. At least two senses beyond sight in every opening. |
| A3 | Who is here? | Soldiers, named as a company, shown before they act. The quartermaster arrives in the spine, at the table, before any card or band refers to them. Nothing acts unannounced. |
| A4 | What must we know? | The road runs through here; the company holds it; nobody passes unpaid; the book is where the prices live. All stated before step 1 is asked for. |
| A5 | Complication last? | Yes. Each opening builds the place and the company; the spine lands the book on top of it. |
| B6 | Nothing unintroduced? | Barrier, book, plank table, quartermaster, picket and low track all appear in prose before any card, factor or band names them. The **low track** is named in the `initiation`, which every class reads. |
| B7 | Visible causes? | The lapsed contract explains the toll; the open ledger line explains why step 2 is work; the wall-work explains the exhaustion. |
| B8 | No contradictions? | One road, one barrier, one book, one quartermaster. The openings own their scenery; the spine owns the table. The hour is left open in three openings and set as late afternoon in the battlefield one, which nothing later contradicts. |
| C9 | Would a real person? | Yes — travelers do not charge barriers, they talk to whoever keeps them. The low track exists and is priced, so stopping is a choice rather than a corner. |
| C10 | People as people? | The quartermaster reads the book rather than inventing a figure; the picket watches without interfering; the company is short of pay and says so once, flatly. |
| C11 | True costs? | Time, kit, a day's labour, a name given away. Carried in the bands, the afterimages and the condition, never waved at. |
| D12 | Stake in one sentence? | *Do they get through this gate today on terms they can actually pay, or do they lose three days east and a day on somebody's wall?* Good outcome: the barrier lifts, the line is struck through, the company counts them a payer. Bad outcome: the low track, a spent body, and a mark still open in a ledger they will pass again. |
| D13 | Cards grounded? | Every card acts on what the scene put on the table — the book, the figure, the picket watching, the debt. Delete the ledger from the prose and the whole hand is senseless here. |
| D14 | Mechanism, not mood? | Every `effectLine` states what the god does and why that moves the odds, plainly, no digits. |
| D15 | Openings cover the envelope? | `settings: ['stronghold','ruin','wayside','battlefield']`, four openings, enforced by `validateSettingEnvelope`. |

---

## 3. Pressure knot — what is already in motion

A free company took a contract to hold this post two seasons ago. The contract lapsed. The
pay stopped. Nobody came to relieve them and nobody sent word, so they stayed, because the
post is the one asset they still hold and a held road pays. They are not raiders — they
keep a book, they read the prices out of it, and they take the same from everybody. That is
what makes the price honest and what makes it heavy: the figures are not a shakedown, they
are the arithmetic of a company feeding itself off a road.

## 4. Intervention fantasy

The god is at the table without being at the table. A traveler is being quoted a price
they cannot really afford, by people who cannot really lower it, and the god's whole
repertoire here is **weight on a scale**: steady the nerve, put an old obligation in the
quartermaster's mind, lean on the company's own ledger, take the price out of the world's
clock instead of the traveler's pack. The fantasy is not rescue. It is being the reason a
figure came out one line cheaper — and then, on the second step, the reason getting clear
of it did not cost a day.

## 5. Cast and world objects

| Object | Kind | Id / spec | Persistence |
|---|---|---|---|
| The quartermaster | cast actor | `supportBundle` key `officer`, `factionDefId: 'mercenary_company'` | must-persist |
| The free company | faction | `mercenary_company` (`FACTION_DEFINITIONS`) | world-owned |
| The book / the open line | agreement | `agreement.debt.minor` (`AGREEMENT_REWARD_TEMPLATES`) | granted by reaction |
| A day on the wall | condition | `trait.condition.exhausted` (`CONDITION_TRAIT_DEFINITIONS`) | granted on failure |
| Standing with the company | reputation surface | `reputation_with` → `targetFactionId` | edge |
| Standing with the quartermaster | reputation surface | `reputation_with` → `$cast:officer` | edge |
| The tie to the god | thread edge | `thread_strengthen` | edge |
| What the company is short of | intelligence | `intelligence`, category `military_position` | record |
| A turn owed | favor edge | `favor_creation`, debtor `$cast:officer` | edge |

## 6. Beat structure

- **Beat 1 — `gold`, "Hear the terms"** (difficulty 0.40 → `fair`, `failBehavior: 'fail_action'`).
  The book is open and a figure gets named. Six cards.
- **Beat 2 — `shadow`, "Get out from under"** (difficulty 0.38 → `fair`,
  `failBehavior: 'fail_action'`, carryover from beat 1). The figure gets paid, in public,
  without the ledger growing a second line. Five cards.

## 7. Branching profile

- Branch depth: **linear**
- Branch count: **0**
- Linear — no branching. The one decision in this encounter is the engage/decline gate,
  which is resolved *outside* the template by the mortal's own selection (§ 1). No
  `ActionStepBranch`, no `decidedBy`, no `poleLean`, no `authoredChoices`.

## 8. Branching map

N/A — linear encounter.

---

## 9. Setting envelope and the four openings

```ts
settings: ['stronghold', 'ruin', 'wayside', 'battlefield'],
locationSubtypes: expandSettings(['stronghold', 'ruin', 'wayside', 'battlefield']),
```

Excluded batch-wide: `urban`, `rural`, `sacred`, `arcane`.

**stronghold** (≈58 words)
> The road ends at a gatehouse, and the gatehouse is shut. A company banner hangs over the
> arch where somebody else's arms used to be, wet through and left up anyway. Two soldiers
> stand the wicket with the bored patience of people who do this all day. Inside the arch,
> a plank table has been set across the passage.

**ruin** (≈57 words)
> The road runs straight through what is left of a keep and the company has made a gate of
> the gap. Fallen stone is stacked shoulder-high on both sides of the opening, and a beam
> has been dropped across it on two forked posts. Somebody is cooking behind the wall.
> The smoke comes out through the roofless top.

**wayside** (≈56 words)
> A pole lies across the track on two crutches, and a rope runs from it to a tent peg so it
> can be lifted from a seat. Six tents stand back from the road in a line, and a picket line
> of horses behind them. Nobody is hurrying. The barrier is enough, and everybody here knows
> it.

**battlefield** (≈59 words)
> The old earthworks still run across the valley, and the road crosses them at the one cut
> anybody ever kept clear. The company has dug into the bank on both sides of the cut and
> filled the gap with what the fighting left — cart beds, a broken door, a wagon wheel
> laid flat. The afternoon light is going yellow and low.

**Setting-neutral spine** — this is step 1's `narrativeTemplate`, and it may not name a
gatehouse, a wall, a tent or an earthwork:

> The road stops at a barrier the company put across it. Their quartermaster keeps a ledger
> on a plank table and reads the prices out of it — a day of work, a piece of kit, a name,
> an errand carried on. Nobody goes past unpaid. The price has to be settled before the
> barrier lifts.

**Opening → spine seam check.** Each opening ends on the barrier or on the table and hands
straight to the spine's first sentence, which names the barrier once and then leaves the
scenery alone. No opening uses the word *ledger*, *quartermaster* or *price*, so the spine
introduces all three rather than echoing them. No two openings share a sentence shape: the
stronghold one closes on an object placed, the ruin one on smoke, the wayside one on a flat
statement, the battlefield one on light.

### `narrativeTemplates`

```ts
initiation:
  'A company holds the only gate on this road, and their book has a price in it for every '
  + 'traveler. Pay one and the road stays a road. Turn back, and it is three days east by '
  + 'the low track.',
success:
  'The line went into the ledger and came back out again struck through. The barrier lifted '
  + 'and the road on the far side is theirs to walk.',
failure:
  'The barrier stayed down. It is three days east by the low track now, on a body that has '
  + 'already spent the afternoon.',
```

`initiation` is the only surface that states the alternative in figures, and it states it
before the player has spent anything — that is what makes the exit legible rather than
discoverable.

---

## 10. Per-step test panel data

### Step 1 — `gold`

| Field | Value |
|---|---|
| `reach` | `gold` |
| `purposeLine` | **"Settle the price"** (3 words, ≤4) |
| `difficulty` | `0.40` → renders `fair` |
| `duration` | `{ min: 1, max: 2 }` |
| `failBehavior` | `'fail_action'` — a failed negotiation *is* the exit (§ 1) |
| `factorLines` | **none authored** (the variance rule, THR-892) |
| `carryoverFactorLines` | none — first step |

**Why no static factor lines.** "The company is short of pay", "the book sets the figure"
and "the picket is watching" read identically on every run, so they are priced into
`difficulty: 0.40` and carried by the prose. The panel's variance lines — the actor's `gold`
capability, the trait-variant line below, any equipment or condition modifiers — are derived
by `computeResolutionModifiers`, not authored here.

### Step 2 — `shadow`

| Field | Value |
|---|---|
| `reach` | `shadow` |
| `purposeLine` | **"Get out from under"** (4 words) |
| `difficulty` | `0.38` → renders `fair` |
| `duration` | `{ min: 1, max: 2 }` |
| `failBehavior` | `'fail_action'` |
| `factorLines` | none authored |

**`carryoverFactorLines`** — the surviving authored factor surface, variant by construction,
keyed on the band step 1 rolled:

```ts
carryoverFactorLines: {
  critical_success: { text: 'They owe the cheapest line in the book.',        polarity: 'for',     forecastDelta:  0.05 },
  success:          { text: 'The figure they agreed is one they can carry.',  polarity: 'for',     forecastDelta:  0.03 },
  success_at_cost:  { text: 'They agreed to more than the book asked for.',   polarity: 'against', forecastDelta: -0.03 },
  near_miss:        { text: 'The ledger says more than they remember saying.',polarity: 'against', forecastDelta: -0.05 },
},
```

`failure` and `critical_failure` are deliberately absent: step 1's `fail_action` ends the
encounter there, so step 2 is unreachable from those bands and a line for them would be
authored prose nothing can render. Every line names its own source inside the sentence
(canon rule 1) — no label beside it. Each is ≤12 words.

---

## 11. Trait hooks (all four answered)

1. **Gate?** — **No.** A barrier stops everyone the same. `requiredTraits` and
   `blockedByTraits` stay unset.
2. **Variant?** — **Yes.** `trait.core.core_hope.vice` (the "Reads each good turn as the
   bait before the trap" pole of Core hope — a seeded definition, live under
   `validateTraitRefs()`). A traveler who assumes every offer hides a hook haggles harder
   and reads the book's fine print, which is exactly the `gold` step's action.
   ```ts
   traitVariants: [{
     traitId: 'trait.core.core_hope.vice',
     forecastDelta: 0.04,
     difficultyDelta: -0.02,
     factorLine: 'Reading the offer for its trap, they ask what the line means.',
   }],
   ```
3. **Trait-only nudge?** — **No, and this is a batch-budget decision, not an omission.**
   The batch's card-type allocation assigns `trait_card` to encounters 2 and 5; #6's budget
   is `bargain / favor / side_bet / boost (≤2) / gambit / heavy_hand`. Adding a trait card
   here would spend a type this encounter was not allocated and weaken the batch's
   anti-convergence spread. `addNudgeIds` is therefore absent from the variant.
4. **Trait fragment?** — **No.** The variant's `factorLine` carries the trait, and a
   band fragment would say the same thing a second time.

---

## 12. The hand per step

**Card faces are library-generic.** Every card matching a library member sets
`libraryCardId` and takes its `name` and `fiction` **verbatim from `CARD_CONTENT`** in
`src/data/nudge-card-library.ts` — that is what makes it the same card rather than a
lookalike, and it is what finally gives `cardPlayTally`, the twilight harvest and the echo
card real data (the brief's standing instruction: zero authored templates set
`libraryCardId` today).

**One card is deliberately outside the library** and carries no `libraryCardId`: the
**Side-bet** on step 1. `side_bet` is one of the 21 types and has **zero members** in
`NUDGE_CARD_LIBRARY` — no core, no signature, no hunger unique — so an id would name
nothing. Recorded as a choice, in a code comment on the card, per the brief.

### Step 1 hand — six cards, six types

| # | Type | `libraryCardId` | Sphere | Essence | Δ | Rider | Cost channel | Grant |
|---|---|---|---|---|---|---|---|---|
| 1 | Boost | `card.boost.core` | — (common) | 1 | 0.06 | — | — | — |
| 2 | Favor | `card.favor.signature.order` | order | 2 | 0.10 | — | — | `favor_creation` |
| 3 | Bargain | `card.bargain.signature.entropy` | entropy | **0** | 0.12 | — | `doomDelta 0.05` | — |
| 4 | Gambit | `card.gambit.signature.chaos` | chaos | 1 | 0.03 | `all_or_nothing` | — | — |
| 5 | Heavy hand | `card.heavy_hand.signature.force` | force | 2 | **0.16** | — | `detectionDelta 0.15` | — |
| 6 | Side-bet | *(one-off — no library member)* | — (common) | 2 | 0.07 | — | — | `intelligence` |

**Guardrails.** 6 cards (4–8 ✓) · 4 distinct spheres — order, entropy, chaos, force (≥4 ✓)
· 2 ungated common options (≥1 ✓) · **1 rider** (≤1 ✓) · 1 Boost (≤2 ✓) · 6 distinct types
(≥3 ✓) · hand total Δ **0.54** (≤0.70 ✓) · difficulty + hand = 0.40 + 0.54 = **0.94**,
inside [0,1] ✓.

**No two cards answer the same question:** *can they hold their nerve at the table* (1),
*does the quartermaster owe anybody* (2), *can the price be paid out of the world instead of
the pack* (3), *does the middle drop out of this* (4), *can the company's own arithmetic be
leaned on* (5), *is there value here beyond today's figure* (6).

---

**1 · `card.boost.core` — "A Little More"** · common · 1 essence · Δ 0.06 ·
`imageTag: 'generic.focus'`

- `fiction`: *"Most things fail by a margin."*
- `effectLine`: **"You hold their nerve steady while the figure is read out, so they do not take the first number to end the silence. A small help."**
- `bandProse`:
  - `success`: "They let the silence sit after the figure, and the figure came down."
  - `failure`: "Steady all the way through, and the book still did not move."

**2 · `card.favor.signature.order` — "The Ledger Opens"** · order · 2 essence · Δ 0.10 ·
`imageTag: 'generic.oath'`

- `fiction`: *"Order is only debt everyone agreed to honor."*
- `effectLine`: **"You put an old obligation in front of the one holding the book, and they deal like a person who owes a turn. A real help — and a turn is owed back afterwards."**
- `grants`:
  ```ts
  [{ kind: 'favor_creation', magnitudeRange: [0.15, 0.3],
     context: 'Dealt fairly at the gate when the book said otherwise',
     debtorAgentId: '$cast:officer' }]
  ```
  *(`favor_creation` mints `owes_favor` with debtor = the named party, creditor = the actor.
  Playing this card on step 1 can therefore open the step-2 Favor card's `requiresFavor`
  gate — grants fire after the step resolves, before the next step deals.)*
- `bandProse`:
  - `success_at_cost`: "The quartermaster dealt like a debtor and priced like one too — high, and honest about it."
  - `failure`: "An obligation went across the table and came back unrecognised."

**3 · `card.bargain.signature.entropy` — "Pay It Elsewhere"** · entropy · **0 essence** ·
Δ 0.12 · `costs: { doomDelta: 0.05 }` · `imageTag: 'generic.decay'`

- `fiction`: *"Nothing is free. Some prices are only slower."*
- `effectLine`: **"No essence changes hands: the world's doom clock runs a shade faster instead. A strong help."**
- `bandProse`:
  - `success`: "The figure came out light and nobody at the table could say why. The clock ran on."
  - `critical_failure`: "The debt was taken on somewhere else, and the table still closed against them."

*(Zero essence is legal here because a named channel carries the price — spec § hand-building.)*

**4 · `card.gambit.signature.chaos` — "No Middle Ground"** · chaos · 1 essence · Δ 0.03 ·
`rider: 'all_or_nothing'` · `imageTag: 'generic.luck'`

- `fiction`: *"Chaos has no use for the adequate."*
- `effectLine`: **"The middling terms wash out: they walk away with the best line in the book or with none of it. The middle drops away."**
- `bandProse`:
  - `critical_success`: "The quartermaster went straight to the bottom of the page and read the smallest line on it."
  - `failure`: "No middling figure survived to be agreed to."
  - `critical_failure`: "There was one price left on the table by the end, and it was the worst one."

**The hand's one rider, justified.** Chaos's signature reshapes the ladder instead of
climbing it, and it is priced cheap because the widened downside *is* the price. A second
rider would answer the same question — what shape does the outcome take — twice. Its
fragments sit on the three bands `all_or_nothing` leaves reachable.

**5 · `card.heavy_hand.signature.force` — "Full Weight"** · force · 2 essence · Δ **0.16** ·
`costs: { detectionDelta: 0.15 }` · `imageTag: 'generic.strength'`

- `fiction`: *"Subtlety is a choice. This is not it."*
- `effectLine`: **"You press on the whole table at once and the company's own arithmetic comes out in the traveler's favour. Rival gods can hardly miss the hand that did it."**
- `bandProse`:
  - `critical_success`: "The figures on the page stopped agreeing with the company and started agreeing with the traveler."
  - `failure`: "The weight went on, the book bent under it, and the price came out unchanged."
  - `critical_failure`: "The pressure was plain enough that the picket stopped eating to watch, and the quartermaster closed the book."

*Big delta (≥ `NUDGE_BIG_DELTA` 0.15) ⇒ both `failure` and `critical_failure` fragments, per spec § 4.*

**6 · Side-bet — "Worth Keeping"** · one-off, no `libraryCardId` · common · 2 essence ·
Δ 0.07 · `imageTag: 'generic.matter'`

- `fiction`: *"Every table tells you more than it means to."*
- `effectLine`: **"A modest help now, and win or lose the traveler leaves knowing what this company is short of. The knowledge keeps."**
- `grants`:
  ```ts
  [{ kind: 'intelligence', category: 'military_position',
     label: 'What the gate company is short of',
     detail: 'The post is held on a lapsed contract. They are short of pay, salt and boots, '
           + 'and their book prices all three above coin.',
     reliability: 0.8 }]
  ```
- `bandProse`:
  - `near_miss`: "The figure was never agreed, and the shortages behind it were counted anyway."
  - `failure`: "The table went nowhere. The reading of it did not."

*Type note (goes in a code comment): `side_bet` has no member in `NUDGE_CARD_LIBRARY` — no
core, no sphere signature, no hunger unique — so this face stays a one-off rather than
naming an id that resolves against nothing. It is one of the eight zero-use types the batch
was cut to exercise.*

### Step 2 hand — five cards, four types

| # | Type | `libraryCardId` | Sphere | Essence | Δ | Rider | Cost channel | Gate |
|---|---|---|---|---|---|---|---|---|
| 1 | Boost | `card.boost.core` | — (common) | 1 | 0.08 | — | — | — |
| 2 | Heavy hand | `card.heavy_hand.signature.force` | force | 2 | **0.15** | — | `detectionDelta 0.15` | — |
| 3 | Bargain | `card.bargain.signature.entropy` | entropy | **0** | 0.12 | — | `doomDelta 0.06` | — |
| 4 | Favor (call) | *(one-off — no library member)* | order | 1 | 0.10 | — | — | `requiresFavor` |
| 5 | Boost | `card.boost.signature.energy` | energy | 2 | 0.08 | — | — | — |

**Guardrails.** 5 cards (4–8 ✓) · 4 distinct spheres — force, entropy, order, energy (≥4 ✓)
· 1 ungated common option (≥1 ✓) · **0 riders** (≤1 ✓) · 2 Boosts (≤2 ✓, and they buy
different certainties: attention vs body) · 4 distinct types (≥3 ✓) · hand total Δ **0.53**
(≤0.70 ✓) · difficulty + hand = 0.38 + 0.53 = **0.91**, inside [0,1] ✓.

**Repeats across the two hands are deliberate and re-angled.** Boost, Heavy hand and
Bargain each deal in both hands with a different job — nerve at a table versus attention
during a payment, arithmetic versus manpower, a cheaper figure versus a shorter day. The
`libraryCardId` is the same because it is the same card; the `id`, the `effectLine`'s
subject and every fragment are the step's own.

---

**1 · `card.boost.core` — "A Little More"** · common · 1 essence · Δ 0.08 ·
`imageTag: 'generic.focus'`

- `fiction`: *"Most things fail by a margin."*
- `effectLine`: **"You keep their attention on the count while it is made, so nothing is added to the tally behind them. A real help."**
- `bandProse`:
  - `success`: "They watched the count all the way to the end, and the count ended where it should have."
  - `near_miss`: "They caught the extra line going in. Catching it did not stop it."

**2 · `card.heavy_hand.signature.force` — "Full Weight"** · force · 2 essence · Δ **0.15** ·
`costs: { detectionDelta: 0.15 }` · `imageTag: 'generic.strength'`

- `fiction`: *"Subtlety is a choice. This is not it."*
- `effectLine`: **"You put strength into the work itself and the day's labour goes in a third of the day. Rival gods can hardly miss the hand that did it."**
- `bandProse`:
  - `critical_success`: "The work went down so fast the company came out to look, and let them go early."
  - `failure`: "The strength was there and the tally still ran past what the strength could finish."
  - `critical_failure`: "They worked like three people in front of a company that counts, and the company found more work."

*Big delta ⇒ both failure bands covered.*

**3 · `card.bargain.signature.entropy` — "Pay It Elsewhere"** · entropy · **0 essence** ·
Δ 0.12 · `costs: { doomDelta: 0.06 }` · `imageTag: 'generic.decay'`

- `fiction`: *"Nothing is free. Some prices are only slower."*
- `effectLine`: **"No essence changes hands: the world's doom clock runs a shade faster instead. A strong help."**
- `bandProse`:
  - `success_at_cost`: "The tally closed, at a figure the world will be paying on for a while."
  - `failure`: "The debt went out to the world, and the ledger in front of them stayed open."

**4 · Favor (call) — "A Turn Called In"** · one-off, no `libraryCardId` · order · 1 essence ·
Δ 0.10 · `requiresFavor: true` · `imageTag: 'generic.oath'`

- `fiction`: *"A debt is only useful on the day you name it."*
- `effectLine`: **"Only when the traveler is owed: you bring the debt to mind at the gate, and the one who owes it turns up to stand the work. A real help."**
- `bandProse`:
  - `success`: "Two pairs of hands finished a tally written for one, and the ledger closed on time."
  - `critical_failure`: "The debt was called, and answered, and the company counted both of them as owing now."

*Type note (code comment): the **call** variant of the Favor has no library member — the two
that exist (`card.favor.signature.order`, `card.favor.hunger.bind`) are both mint-side. This
face stays a one-off and exercises `requiresFavor`, the runtime gate with no content users.
Priced at 1 essence rather than 0 deliberately: the card does **not** redeem the favor edge,
so pricing it on an obligation channel would claim a write nothing performs.*

**5 · `card.boost.signature.energy` — "A Sudden Surge"** · energy · 2 essence · Δ 0.08 ·
`imageTag: 'generic.energy'`

- `fiction`: *"Bodies hold more than they admit."*
- `effectLine`: **"When the work outlasts them, the body finds the last hour of it. A real help."**
- `bandProse`:
  - `success`: "The last hour came out of a reserve they had not budgeted for."
  - `failure`: "There was one more hour in them. The tally asked for three."

### Band coverage — all six `StepOutcome`s, both steps

| Band | Step 1 covered by | Step 2 covered by |
|---|---|---|
| `critical_success` | Gambit, Heavy hand | Heavy hand |
| `success` | Boost, Bargain | Boost, Favor(call), Boost(energy) |
| `success_at_cost` | Favor | Bargain |
| `near_miss` | Side-bet | Boost |
| `failure` | Boost, Favor, Gambit, Heavy hand, Side-bet | Heavy hand, Bargain, Boost(energy) |
| `critical_failure` | Bargain, Gambit, Heavy hand | Heavy hand, Favor(call) |

**Every card carries at least one failure-texture fragment** (`near_miss` counts as failure
texture for authoring). **Every big-delta card covers both failure bands.** No fragment
appears in base band text — the afterimages below are what happens when the god did nothing.

---

## 13. Band base prose — the afterimages

`ActionStep` carries five afterimage fields, not six: there is no near-miss afterimage, and
near-miss is paid off through fragments alone.

### Step 1 (`gold`)

| Field | Text |
|---|---|
| `successAfterimage` | "They settled on a figure and watched it go into the ledger in front of them." |
| `failureAfterimage` | "The book closed. The barrier stayed down." |
| `successAtCostAfterimage` | "The figure went into the ledger heavier than the book's own line for it." |
| `criticalSuccessAfterimage` | "The quartermaster read them the smallest price on the page and wrote it down." |
| `criticalFailureAfterimage` | "The haggling ran long, and the company stopped pretending it was a negotiation." |

### Step 2 (`shadow`)

| Field | Text |
|---|---|
| `successAfterimage` | "They paid the line out in full and walked through the barrier with the road ahead of them." |
| `failureAfterimage` | "The barrier lifted. The mark in the ledger did not close." |
| `successAtCostAfterimage` | "The ledger closed, and a second line went in beside the first before it did." |
| `criticalSuccessAfterimage` | "They paid, the quartermaster struck the line through, and the company let them go early." |
| `criticalFailureAfterimage` | "The company kept them a full day, and the day went into the book as well." |

**Step → step seam check.** Step 1's afterimages all end on the *book* (a figure written, a
book closed). Step 2's spine opens on the *paying*, not on the writing, so nothing is
restated. No sentence shape repeats across the ten: three end on a person's action, three on
an object's state, four on a plain declarative.

**Step 2's spine** (`narrativeTemplate`):

> Saying the price was quick. Paying it is not. The company wants the full measure counted
> in front of everyone, and a ledger with a mark still open on it is a ledger that grows.
> Getting clear of it before the company finds a second line to add is the work now.

---

## 14. Outcome ladder

| Band | Progress made | What was spent | New burden or opening |
|---|---|---|---|
| `critical_success` | Through the gate early, on the smallest price in the book. | An afternoon. | The company's banner counts them a payer — standing that carries at their other posts. |
| `success` | Through the gate on terms they could pay. | The price, whatever it was. | The quartermaster knows their face and thinks well of it. |
| `success_at_cost` | Through the gate. | The price, and one more line beside it. | The company's standing is earned and the traveler is lighter than they should be. |
| `near_miss` | Through the gate. | The price, plus what they did not catch going into the tally. | A mark in the ledger that has not been struck through. |
| `failure` | Not through. Three days east by the low track. | An afternoon and a day of the company's work. | `exhausted`, a shaved standing, an open line in a book on a road they will pass again. |
| `critical_failure` | Not through, and a full extra day held. | Two days and a body. | `exhausted`, a worse standing, and a tie to the god that pulled harder than they can name. |

**The ladder against the exit.** Declining costs three days east and nothing else. The
worst band costs three days east **plus** a day held and a spent body. The exit is
therefore strictly cheaper than the worst engagement, which is the arithmetic that makes
this an opt-in rather than a toll.

---

## 15. Sample opening paragraph (the `wayside` class, full prose)

> A pole lies across the track on two crutches, and a rope runs from it to a tent peg so it
> can be lifted from a seat. Six tents stand back from the road in a line, and a picket line
> of horses behind them. Nobody is hurrying. The barrier is enough, and everybody here knows it.
>
> The road stops at a barrier the company put across it. Their quartermaster keeps a ledger
> on a plank table and reads the prices out of it — a day of work, a piece of kit, a name,
> an errand carried on. Nobody goes past unpaid. The price has to be settled before the
> barrier lifts.

## 16. Linear continuation (the later paragraph)

> Saying the price was quick. Paying it is not. The company wants the full measure counted
> in front of everyone, and a ledger with a mark still open on it is a ledger that grows.
> Getting clear of it before the company finds a second line to add is the work now.

---

## 17. Aftermath

```ts
aftermathConfig: {
  branchOnStep: 0,
  variants: {},
  fallback: { overview: …, changes: [], reactions: [R1, R2], byOutcome: { … } },
}
```

Choice-less, so the bands hang off `fallback` — which is why `byOutcome` lives *on* the
variant. `fallback.changes` is deliberately **empty**: every chip this encounter authors is
backed by a write that fires on a specific band, so every chip lives on its band. Five
bands authored against a floor of three (`critical_success`, `success`, `success_at_cost`,
`failure`, `critical_failure`) — one success-side, one failure-side, and both extremes.

**`fallback.overview`** (the aftermath paragraph — reflective landing, claims no state):

> The book is the company's whole argument and it is not a dishonest one. A figure was
> written down, and it was paid or it was not, and the road on the far side is still the
> road.

*(Outcome-class field. Deliberately avoids `thing`, `way` and `somebody` — the whole
encounter's outcome prose calls the exit "the low track", never "the long way round".)*

### The effects, and where they fire

**Step 2 `successMetadata.effects`** (fires on `isStepSuccess`, which includes `near_miss`):

```ts
[
  { kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: 0.10 },
  { kind: 'bond_change', withAgentId: '$cast:officer', sentimentDelta: 0.20, trustDelta: 0.15 },
  { kind: 'thread_strengthen', ascendantId: '$ascendant', mortalId: '$actor',
    delta: 0.06, reason: 'Carried a debt the god leaned on' },   // ← see § 20, blocker B1
]
```

**Step 2 `failureMetadata.effects`**:

```ts
[
  { kind: 'condition_attachment', templateId: 'trait.condition.exhausted' },
  { kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: -0.06 },
  { kind: 'bond_change', withAgentId: '$cast:officer', sentimentDelta: -0.15 },
]
```

`reputation_with` is the correct leg here rather than `faction_reputation_gain`: the
traveler is **not** a member of the company, and `applyFactionReputationGain` no-ops with
`not_a_member` for a non-member. `targetFactionId` is authored as the **definition** id, which
`bindFactionDefinitionIds` rewrites to the live node id before dispatch. Both deltas are well
inside `REPUTATION_WITH_MAX_DELTA_PER_OUTCOME` (0.15).

**The maturity gate is respected.** Factions are a deferred-tier system, so the faction
standing here is a real write and **not** load-bearing structure: an agent with no faction
history plays the identical encounter, because `reputation_with` mints the edge from
nothing and no card, gate or band reads a prior standing. If the world happened to seed no
chapter of `mercenary_company`, the effect no-ops with a trace and the encounter still
resolves — passage, the quartermaster, the condition and the thread are all untouched.

### Aftermath reaction choices (two stances, on `fallback`)

**R1 · "Keep the line open between them"**
```ts
{ id: 'gp.keep_the_line', label: 'Keep the line open between them', effects: [
    { kind: 'attachment_grant', templateId: 'agreement.debt.minor',
      targetAgentId: '$actor', counterpartyId: '$cast:officer', durationOverride: 48 },
]}
```
The stance: *a debt is a relationship, and a relationship is worth more than a closed
account.* The god lets the ledger stay live between two named people, so the road has a
reason to bring them together again.

**R2 · "Let the road hear it"**
```ts
{ id: 'gp.let_the_road_hear', label: 'Let the road hear it', effects: [
    { kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: 0.10 },
    { kind: 'reputation_with', targetAgentId: '$cast:officer', delta: 0.06 },
]}
```
The stance: *settle it publicly and be free of it.* The god spends the moment on standing
rather than on a tie — cheaper later, and colder.

**Band overrides where the fallback pair would be dishonest.** `applyAftermathOutcomeBand`
replaces `reactions` wholesale, which is exactly what is wanted here — "let the road hear
it" is a lie on a band where nothing was paid.

`byOutcome.failure.reactions`:
```ts
[
  { id: 'gp.let_the_mark_stand', label: 'Let the mark stand', effects: [
      { kind: 'attachment_grant', templateId: 'agreement.debt.minor',
        targetAgentId: '$actor', counterpartyId: '$cast:officer', durationOverride: 96 } ]},
  { id: 'gp.shave_it_on_the_road', label: 'Let the road price the company', effects: [
      { kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: -0.08 },
      { kind: 'reputation_with', targetAgentId: '$cast:officer', delta: 0.05 } ]},
]
```

`byOutcome.critical_failure.reactions`:
```ts
[
  { id: 'gp.the_day_counts', label: 'Let the day count for the tie', effects: [
      { kind: 'thread_strengthen', ascendantId: '$ascendant', mortalId: '$actor',
        delta: 0.08, reason: 'Held a day at a gate with a god watching' } ]},   // ← blocker B1
  { id: 'gp.walk_it_off', label: 'Let them walk it off', effects: [
      { kind: 'remove_condition', conditionTraitId: 'trait.condition.exhausted' } ]},
]
```

### Band overviews and chips

Every chip below points at an effect above that fires on that band (Law 56 rule 0), names a
referent in the anchor catalog (rule 0b), and leads with the mechanic and the endpoints
before any fiction (rule 0c). No chip's `kind` is `reputation_tally` (rule 0d).

**`critical_success`**
> overview: "The smallest price on the page, and the barrier up before the light went.
> The quartermaster wrote the line, struck it, and turned the book around so it could be read."

```ts
changes: [
  { id: 'gp.company_standing', kind: 'faction_reputation',
    category: 'boon', direction: 'gain',
    stateNoun: { text: 'standing with the company',
                 entityId: '$faction:mercenary_company', visualKind: 'faction' },
    title: 'Counted a payer',
    causeClause: 'Paid the line in full where the whole picket could count it',
    detail: 'The company’s book has them down as a payer now — standing that carries at their other posts.',
    polarity: 'gain',
    concepts: [{ text: 'standing', tooltipId: 'ui.standing' }] },

  { id: 'gp.quartermaster_bond', kind: 'reputation',
    category: 'bond', direction: 'gain',
    stateNoun: { text: 'trust with the quartermaster',
                 entityId: '$cast:officer', visualKind: 'agent' },
    title: 'The book-keeper’s own word',
    causeClause: 'Dealt straight over a book that did not have to be shown',
    detail: '{cast:officer} trusts them further than the company does — the quartermaster’s own read, not the ledger’s.',
    polarity: 'gain',
    concepts: [{ text: 'trusts', tooltipId: 'ui.standing' }] },
]
```
*Backed by:* step-2 `successMetadata` `reputation_with` (faction) and `bond_change` (officer).

**`success`**
> overview: "The figure was payable and it got paid. The barrier went up, and the road on
> the far side is the same road it was before the company got here."

```ts
changes: [ gp.quartermaster_bond ]   // same chip, same backing write
```

**`success_at_cost`**
> overview: "The line closed, and it closed heavy. They are through, and the pack is lighter
> than the book's own figure said it needed to be."

```ts
changes: [ gp.company_standing ]   // the standing move fires; the overage is prose, not a chip
```
*Note: nothing writes "they overpaid", so there is no SCAR chip for it. The overage lives in
the overview, which is prose and claims no state.*

**`failure`**
> overview: "The barrier stayed down and the afternoon went on the company's wall instead.
> Three days east by the low track now, and the ledger keeps its line."

```ts
changes: [
  { id: 'gp.a_day_on_the_wall', kind: 'trait',
    category: 'scar', direction: 'loss',
    stateNoun: { text: 'exhaustion',
                 entityId: 'trait.condition.exhausted', visualKind: 'attachment' },
    title: 'A day on their wall',
    causeClause: 'Worked the price out on a wall that was not theirs',
    detail: 'The day’s labour left an exhaustion that will not walk off by morning.',
    polarity: 'loss',
    concepts: [{ text: 'exhaustion', entityId: 'trait.condition.exhausted', visualKind: 'attachment' }] },

  { id: 'gp.company_standing_lost', kind: 'faction_reputation',
    category: 'scar', direction: 'loss',
    stateNoun: { text: 'standing with the company',
                 entityId: '$faction:mercenary_company', visualKind: 'faction' },
    title: 'Down in their book',
    causeClause: 'Argued the figure and left without paying it',
    detail: 'The company has them down as a haggler — standing that will cost them at the next post.',
    polarity: 'loss',
    concepts: [{ text: 'standing', tooltipId: 'ui.standing' }] },
]
```
*Backed by:* step-2 `failureMetadata` `condition_attachment` and `reputation_with`.

**`critical_failure`**
> overview: "The company kept them a full day and wrote the day down. They came off the wall
> at dusk with the ledger still open and the road still shut."

```ts
changes: [
  gp.a_day_on_the_wall,
  gp.company_standing_lost,
  { id: 'gp.the_thread_pulled', kind: 'shell_state',
    category: 'bond', direction: 'gain',
    stateNoun: { text: 'the thread between you',
                 entityId: '$actor', visualKind: 'agent' },
    title: 'A weight on the scale',
    causeClause: 'Felt a hand on a scale they could not see',
    detail: 'The thread to {actor} runs stronger for the day — they cannot name what leaned on it, and they felt it.',
    polarity: 'gain',
    concepts: [{ text: 'thread', tooltipId: 'ui.thread' }] },
]
```
*Backed by:* the `gp.the_day_counts` reaction's `thread_strengthen` (a reaction effect is
lawful backing per Law 56 rule 0). The thread edge is a `named` anchor in the catalog,
visible in the thread row and the thread detail view, so the chip reports a quantity the
player can look up (rule 0d).

*On `kind: 'shell_state'`.* It is the right wire kind — a thread strength is not growth, a
trait, an item or a reputation surface — and Law 56 bans it only over **empty** `effects`
("a `shell_state` chip over empty `effects` is a defect"). Here it names a live write, and
the anchor is the actor, the reachable end of the edge. Both endpoints are named in the
sentence (the thread *to* the mortal, and what leaned on it), per the catalog's edge rule.

### Aftermath kit summary — what the world remembers

- **A named person** who took payment and formed an opinion (`bond_change`, both directions).
- **A banner's standing** with the traveler, up or down (`reputation_with` → faction).
- **A body that spent a day** (`trait.condition.exhausted`, on the failure side).
- **An open account between two people** (`agreement.debt.minor`, if R1 or the failure-band
  override is picked).
- **A tie to the god that pulled harder** (`thread_strengthen`).
- **A turn owed by the quartermaster** (`favor_creation`, if the step-1 Favor card was played).
- **A record of what a company on this road is short of** (`intelligence`, if the Side-bet
  was played).

---

## 18. Cast — the support bundle

```ts
supportBundle: [
  {
    kind: 'actor',
    key: 'officer',
    delivery: 'lazy-materialize-on-trigger',
    persistence: 'must-persist',
    reuseNpcRoles: ['quartermaster', 'commander', 'guard_captain'],
    supportRole: 'gate_quartermaster',
    spawnNpcRole: 'quartermaster',
    spawnName: 'Soren Vail',
    factionDefId: 'mercenary_company',
  },
],
```

**Why an explicit bundle.** The envelope declares four classes, so no THR-1044 family
default applies (those reach single-class envelopes only) and this template must declare
its own.

**Class-honesty across all four classes.** `quartermaster` is the person who names a price —
`{ primary: 'gold', secondary: 'stone' }` in the role reach map, which is exactly step 1's
reach. It is seeded at `military_outpost` (0.9) and by the `military_order` faction roster
(0.7); `guard_captain` is seeded at `castle` (1.0), covering the `stronghold` class's
reuse path. The `ruin`, `battlefield` and `camp`/`oasis` subtypes carry **no location
roster at all**, so reuse simply does not fire there and the spec materialises — which is
why `spawnNpcRole` had to be a role that reads at every class. A company's quartermaster
reads at a fort, in a broken keep, on an earthwork and at a tent line equally; a `steward`
or a `noble` would have been stronghold-honest and placeless everywhere else, the failure
the exemplar's "miller's boy" is the named counter-example of.

**`spawnName` is a real name, not a role phrase** — a declared key always resolves, so this
string is what `{cast:officer}` renders whenever no live NPC was reused.

**The prose never genders the quartermaster.** Reuse binds whoever is standing there, so
every sentence uses the role noun or is restructured around it. Grep target for the critic:
no `he`, `she`, `his`, `her` anywhere in this template's prose.

**Where the token earns its place.** Role-voiced inline is the default — the spine writes
"their quartermaster", with no token, because no sentence there earns the generated name.
`{cast:officer}` lands twice, both times where the name buys something: the
`critical_success` bond chip (the reveal — the person becomes clickable at the moment their
opinion matters) and the attributed line at the table. `{cast:agent}` carries the
personalized address so the engine, not the prose, supplies the traveler's name.

---

## 19. Images

**Card `imageTag`s — every one resolves to a live `ENCOUNTER_IMAGE_LIBRARY` row:**

| Card | `imageTag` | Genericity test — three unrelated encounters it also reads in |
|---|---|---|
| Boost (both steps) | `generic.focus` | a lock being picked, a first shot held, a name being recalled under pressure |
| Favor (mint), Favor (call) | `generic.oath` | a guild vouching, a marriage promise, a truce kept |
| Bargain (both steps) | `generic.decay` | a rope fraying, a seal corroding, a lie aging badly |
| Gambit | `generic.luck` | a wager, a leap, a single throw at a locked door |
| Heavy hand (both steps) | `generic.strength` | a beam held up, a door forced, a current pushed against |
| Side-bet | `generic.matter` | a stone read for its grain, a coin weighed, a tool tested before use |
| Boost (energy) | `generic.energy` | a last sprint, a forge brought to heat, a storm building |

All seven are library rows with `genericity` already asserting the three-unrelated-encounter
bar. None names an entity or shows agent-identifying detail. **No card here needs
`fictionBySetting`** — no flavor quote names class scenery, which post-pivot is the normal case.

**`illustrationUrl`:** not declared. Scene art is `border.gate.tollpost` in the WS4
vocabulary; until the manifest exists the fallback chain ends at EntityVisual.

## 20. Concept art direction

**Question 1 — what emotions does this story convey?** The dignity of people who have run
out of options and are still keeping their books straight. The particular tiredness of being
charged fairly. The weight of a small figure written down where you cannot argue with it.

**Question 2 — what image evokes those, inside this world, without illustrating the scene?**

> **A plank table with nobody at it.** An open ledger, weighted flat at one corner by a
> stone. The page is ruled in a careful hand and half the lines are struck through. Beside
> the book: a tin cup, a stub of chalk, and a single boot — good, worn, plainly somebody's
> only pair, set down where the payer left it. Behind and out of focus, the bottom of a
> lifted barrier and open road beyond, going white in the light.

Residue, not events: the transaction is over, the people are gone, and what is left is a
neat page and a boot that used to be worn. No faces, no soldiers, no argument. **No people
at all** — their absence is the point, since the story is about the price rather than the
fight over it. The boot does the work the prose deliberately never says out loud: that the
prices are honest and they are still paid out of your own body.

---

## 21. Support bundle contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `officer` (quartermaster) | lazy-materialize-on-trigger | `LOCATION_ROLE_ROSTERS` reuse, else spawn as `quartermaster` in `mercenary_company` | **must-persist** | `bond_change`, `reputation_with`, `favor_creation` debtor, `attachment_grant` counterparty, `{cast:officer}` chips | ✅ authored |
| `mercenary_company` | world-owned | `FACTION_DEFINITIONS` | world | `reputation_with` targets, `$faction:` chip anchor | ✅ exists |
| `agreement.debt.minor` | granted on pick | `AGREEMENT_REWARD_TEMPLATES` | must-persist (48–96 ticks) | R1, failure-band override | ✅ exists |
| `trait.condition.exhausted` | granted on failure | `CONDITION_TRAIT_DEFINITIONS` | duration edge | failure chips, crit-fail lift reaction | ✅ exists |
| `favor_creation` edge | card grant | secrets & favors | must-persist | step-2 `requiresFavor` gate | ✅ exists |
| `intelligence` record | card grant | intelligence system | must-persist | future `intel_referenced_prose` | ✅ exists |
| Thread edge | already exists | thread system | world | `thread_strengthen` | ⚠️ **blocked — see B1** |
| Scene art `border.gate.tollpost` | pending | image plan | scene-only | — | ⏳ plan slot |

### Blockers and deferrals to file

**B1 — `thread_*` effects cannot bind their endpoints, and no shipped content wires them.**
`thread_strengthen`/`thread_weaken`/`thread_break`/`thread_branch` take literal
`ascendantId` and `mortalId`. Neither field is registered in `SCENE_SENTINEL_FIELDS`
(`src/engine/encounterAftermath.ts`), so `bindAftermathSceneTargets` cannot resolve
`$actor`, `$target` or `$cast:` on them — and the ascendant node id is `asc.<archetypeId>`,
minted per run, so there is no literal an author could ever write. `getOutgoingEdges` then
finds no thread edge and the effect no-ops with a `thread_mutation_skipped` /
`edge_missing` trace. Verified corpus-wide: **zero shipped templates use any `thread_*`
effect**; the only example is
`src/data/encounters/examples/example.thread_bond_tested.ts`, which is `@ts-ignore`'d,
registered nowhere, and writes `ascendantId: 'self', mortalId: 'actor'` — strings nothing
resolves.

- **Impact:** the `thread` consequence family is **unwirable by any encounter today**. It is
  in this encounter's binding draw and in encounter 5's (`one_body_short`), so it blocks two
  of the batch's six.
- **Ask:** register `mortalId: 'agent'` in `SCENE_SENTINEL_FIELDS` and add an `$ascendant`
  sentinel bound to `GameState.ascendantId` for `ascendantId`. Small, additive, and the only
  route by which the `thread` family can ever satisfy Law 56.
- **This draft authors the effects in the shape that works once the binding lands**
  (`ascendantId: '$ascendant'`, `mortalId: '$actor'`), so the fix is a one-line engine change
  and no content edit. Until it lands, `check:encounter` will pass the `thread` family (it
  checks effect kinds, not resolvability) while the write is dead at runtime — which is
  exactly the Law 56 pathology, so **the `gp.the_thread_pulled` chip must not ship before B1
  does.** Recommendation: land B1 first, or hold that one chip.

**B2 — advisory.** `side_bet` and the *call* variant of `favor` have no `NUDGE_CARD_LIBRARY`
members. Both are authored here as one-offs, which is legal and recorded. If the Repertoire
should carry them, that is a library change with a reviewer, out of this batch's scope by
the brief's own "out of scope" line.

---

## 22. Self-audit against the Composition Contract

| Block | Verdict | Note |
|---|---|---|
| **Steps** | ✅ PASS | 2 plain steps, each with reach, numeric difficulty, `narrativeTemplate`. |
| **Hand** | ✅ PASS | Both steps nudge-bearing; 6 and 5 cards; guardrails tabulated in § 12. |
| **Setting** | ✅ PASS | 4 classes declared, 4 openings, `locationSubtypes` derived by `expandSettings`. |
| **Cast** | ✅ PASS | Explicit bundle, class-honest at all four; every `{cast:*}` token names a declared key. |
| **Rewards** | ✅ PASS | `bond_change` and `thread_strengthen` are both `PERSISTENT_EFFECT_KINDS`; `attachment_grant` and `condition_attachment` add more. |
| **Aftermath** | ✅ PASS | `aftermathConfig` present; 5 `byOutcome` bands against a floor of 3; every variant carries `overview`; every change declares `concepts`. |
| **Systems** | ✅ PASS | 5 connections (cast, factions, reputation, conditions, rewards) against a floor of 3. |
| **Images** | ✅ PASS | All 7 `imageTag`s resolve to live library rows; no `illustrationUrl`. |
| **Register** | ✅ PASS | Baseline throughout; no peak surface declared. Card names/effect/factor lines interactive-plain. |
| **Vagueness** | ⚠️ CHECK AT GATE | Written to target zero within field class; `way` deliberately avoided in every outcome-class field (the exit is "the low track", never "the long way round"). Verify with `check:encounter`. |
| **Annotation clauses** | ✅ PASS | Zero not-X-but-Y and zero em-dash-not constructions across the encounter (budget is 1). |
| **Divine outcome-authorship** | ✅ PASS | No decision verb takes a world clause. Every `effectLine` says what the god *does*. |
| **Digits in `effectLine`** | ✅ PASS | Zero digits, zero `%`. Magnitude is rendered by the pip row. |
| **No `authoredChoices`** | ✅ PASS | Absent. The one decision is the mortal's opt-in gate, outside the template. |
| **No static `factorLines`** | ✅ PASS | Zero authored; the two derived surfaces used are `TraitVariant.factorLine` and `carryoverFactorLines`. |
| **Law 56 (chips)** | ⚠️ **ONE FLAG** | Six of seven chips are backed by writes that fire on their band. `gp.the_thread_pulled` is backed by an effect that cannot bind today — **blocker B1**. |
| **Consequence draw** | ✅ PASS | `['relationship','thread']` recorded, both wired in context, no swap. |
| **Plot hook** | ✅ PASS | Both `plotHookRolled` and `plotHookTaken` recorded; `usedBy` stamp is a closeout action. |
| **Card budget** | ✅ PASS | `bargain`, `favor`, `side_bet`, `boost` (2 max per hand), `gambit`, `heavy_hand`; no type outside the row. |
| **`libraryCardId`** | ✅ PASS | Set on all 9 library-matching cards; 2 recorded one-offs with reasons. |
| **Forecast arithmetic** | ✅ PASS | 0.94 and 0.91, both inside [0,1]. |
| **Maturity gate** | ✅ PASS | Primary system is `movement` + `traits` (mature). Factions are flavor-plus-a-real-write, never load-bearing. |
| **Tone** | ✅ PASS | Not grim. Nobody dies, nobody is unmade, and both parties are right. |

---

## 23. Experience Differentiator Gate — 14 answers

**Scene & prose**

1. **Opening places the player inside a moment already in motion?** **YES.** The barrier is
   already down, the tents are already up, the picket is already eating. Nothing is
   explained; a place is shown with a company sitting in it.
2. **Prose has its own voice — cadence, rhythm, sentence variety?** **YES.** Sentence
   lengths run short-long-short across each opening; three of the four close on a flat
   declarative and one on light. No two openings share a shape.
3. **Scene prose names the elements that later become choices?** **YES.** The barrier, the
   plank table, the ledger, the quartermaster, the picket and the low track are all in the
   opening or the spine, before any card, factor or band refers to them. Delete the ledger
   and the entire hand is senseless.
4. **Would a reader feel something from the prose alone?** **YES.** The lapsed contract is
   never stated as backstory — it arrives as a banner left up in the rain over somebody
   else's arms, and as a book kept carefully by people nobody is paying.
5. **Every card states mechanism in `effectLine`, 2–4 word generic title, one flavor quote,
   zero scene-bespoke prose on the face?** **YES.** Nine faces are the library's own,
   verbatim; two one-offs are written to the same bar. No face names a gate, a book, or a
   company.
6. **Every card's price real and legible?** **YES.** Two Bargains at zero essence priced on
   the doom clock; two Heavy Hands priced on detection; one Favor gated on being owed; the
   rest priced in essence. The `effectLine` says where the price lands in every case.
7. **Every card pays off in failure?** **YES** — every card carries at least one
   failure-texture fragment, and both big-delta cards (Δ 0.16, Δ 0.15) cover `failure` and
   `critical_failure`.
8. **Hand grounded — deleting the target from the prose makes the card senseless?** **YES.**
   Every card acts on the book, the figure, the counting, the picket watching, or a debt.
9. **Cards answer different questions?** **YES** — the six questions are enumerated in § 12,
   and the two Boosts in step 2 buy attention and body respectively.
   **9b. Every nudge-bearing step carries a full authored hand, and no step asks the player
   to pick a branch or an ending?** **YES.** Six and five cards; no `authoredChoices`, no
   `poleLean`, no branch anywhere.

**Aftermath & consequence**

10. **Aftermath has its own prose — a reflective landing before the mechanics?** **YES.**
    The `fallback.overview` lands the whole encounter, and every one of the five bands has
    an `overview` of its own that says only what that band can say.
11. **Consequence outcomes actor-centered, with names and faces?** **YES.** The chips name
    the quartermaster (`{cast:officer}`, clickable), the company (`$faction:`), and the
    traveler's own body. No anonymous stat delta is authored.
12. **Medium+ scale: reaction choices where the player picks which thread to carry?**
    **YES.** Two on the fallback, two more on `failure`, two more on `critical_failure`.
13. **Do the reaction choices represent different philosophical stances?** **YES.** R1 keeps
    a debt alive because a debt is a relationship; R2 settles it publicly and is free of it —
    warm and unresolved against clean and cold. The failure pair is the same axis read
    downward: carry the mark, or spend the company's name to be rid of it.

**Presentation**

14. **Concept art uses the two-question method — residue, not illustration?** **YES.** An
    empty table, a half-struck page, and one good boot nobody is wearing. No people, no
    argument, no gate in focus.

**All fourteen YES.** The one open item in this packet is **blocker B1**, which is an engine
prerequisite rather than a packet defect — it is named in § 21, flagged in the self-audit,
and carries a concrete one-line fix.
