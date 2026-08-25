# Encounter Pipeline: The Toll of Blades — Pass 3b, the Package critic

> Slug: `toll-of-blades` | Batch: border-perils (THR-1221), row **1** | Date: 2026-08-24
> Judges `toll-of-blades-final.md` as one composed package: prose + chips + writes as the
> player meets them. Editorial verdict PASS WITH REVISIONS; systems verdict READY WITH CAVEATS.

```
templateId: encounter.border.toll_of_blades
packageVerdict: connected
packageLeaves: A favour the column's serjeant owes the agent that a real verb can call in, a place on the mercenary company's rolls that its quest, rank and member-work systems read, and detection pressure in the region that a rival god's strike is watching.
```

---

## 0 · The unreachable-chip fix — settled, and the director's lean is mechanically unavailable

The systems pass found it and proposed duplication. The orchestrator leaned toward option
**(b)** — give step 1 its own failure writes and re-point the `critical_failure` band's chips
at those. **(b) cannot work, and the reason is not taste.**

There are **three** paths to the `critical_failure` band, not two:

| Path | Step 1 rolls | Step 2 | Which `failureMetadata` fires |
|---|---|---|---|
| **(a)** | `critical_failure` | never runs (`advanceStep` forces immediate resolution) | step 1 only |
| **(b1)** | plain `failure` → `continue_weakened` | `critical_failure` | **both** |
| **(b2)** | `success` / `success_at_cost` / `near_miss` | `critical_failure` | step 2 only |

The systems pass's own table collapses (b1) and (b2) into one row, which is what hides the
problem. **(b2) is the common case** — three of step 1's six bands feed it, against one that
feeds (a). So a chip backed only by step 1's `failureMetadata` is unbacked on (b2), exactly
as today's chip is unbacked on (a), and (b2) is the *more* frequent hole. Option (b) swaps
which path is broken; it does not close one. `EffectPredicate` cannot discriminate, as the
systems pass correctly established, so there is no conditional escape.

That leaves exactly two moves per chip: **duplicate onto both steps** (backed everywhere,
double-counted on b1 only) or **fold the chip from this band**. I rule differently for the
two chips, because their stacking costs are not comparable.

### SCAR `a wound` — **fold from `critical_failure`**

**`apply_condition` shares `condition_attachment`'s non-idempotent path.** Read directly, not
assumed: the handler at `encounterAftermath.ts:2023-2135` resolves the template and goes
straight to `addEdge` — **no already-holds check** — with an edge id
`has_trait_${target}_${trait}_${tick}_${i}` that embeds the tick. Step-outcome effects
dispatch at each step's own resolution, so the two calls land on different ticks and mint
**two distinct `has_trait` edges**. Every consequence the sibling recorded reproduces here:

- `effects/effectWalker.ts:65-93` iterates `has_trait` edges with **no dedupe by node**, so
  the condition's modifier is pushed twice — `intensity: 0.35` becomes 0.70 in effect.
- Two rows on the sheet, two independent `ticksRemaining` timers over 48 ticks.
- `remove_condition` without `removeAll` removes only the **oldest** edge
  (`encounterAftermath.ts:2162-2167`, an `appliedAt` `reduce`) — a mercy that appears to work
  and leaves the mortal afflicted.

And the double lands on **(b1)**, the *most common* failure path — step 1's `failureMetadata`
fires on any step-1 failure, which `continue_weakened` then carries into step 2. So option (a)
on this chip would introduce a defect on the likelier bad ending to close a rarer one. It also
contradicts the row's own tone assignment (*"a critical failure is a battering and a robbery,
never a scripted death"*) by putting the agent one wound from an incapacitation check.

**Directly to the orchestrator's question: a doubled wound would be an accident, not intended
escalation.** Nothing in the design block, the brief or the batch row asks this encounter to
push an agent toward the overflow pipeline; its stakes are `standing`. I am not taking option
(a) here, so no `removeAll: true` and no accepted-stacking note is needed on the wound.

Fold it, and the packet needs no new argument for doing so — it already wrote the rule, at
`success_at_cost`: *"A wound can still be present here… but 'sometimes true' is not a chip.
It shows in the automatic delta cluster instead."* The wound on `critical_failure` is exactly
"sometimes true": written on (b1) and (b2), absent on (a). Applying the packet's own rule to
its own band is the consistent move. The chip **stays on `failure`**, where it is provably
backed — plain `failure` is only reachable through step 2's own failure-side roll.

### SCAR `standing` — **duplicate onto step 1, and raise the delta**

**The whole class of defect above is inapplicable to this effect kind, which is why the two
chips rule differently.** `reputation_with` goes through `applyReputationWithDelta`, which
moves a **score on one edge**: no second edge, so no doubled modifier in `effectWalker`, no
second sheet row, no second decay timer, and nothing for a `remove_condition` reaction to
half-remove. It is a bounded scalar with a per-call clamp
(`REPUTATION_WITH_MAX_DELTA_PER_OUTCOME` ±0.15) and no cascade. The double-count on (b1) costs
nothing structural, and it is *narratively right*: the stand broke at the toll line and then
they went down under the column — the same company thinking twice as much less of them. Step 1's own `failureAfterimage` already puts an
injury-shaped event on screen (*"The spear-butts came up, and the agent was walked off the
road"*), so a standing loss authored there is promised by prose the player has already read.

But duplication alone is not enough, because **−0.10 does not move anything the player can
see.** `getReputationWith` returns a band word via `getReputationWord`, whose tiers are 0.2
wide (`REPUTATION_WORDS`: 0.4–0.6 `Accepted`, 0.2–0.4 `Unknown`). `REPUTATION_WITH_DEFAULT`
is 0.5, so 0.5 − 0.10 = **0.40 → still `Accepted`**. The chip reports a quantity that renders
identically before and after — a Law 13 visibility-parity failure, and per Law 4 there is no
numeral to fall back on. Raise both instances to **−0.15**, the channel's own cap: 0.5 − 0.15
= 0.35 → **`Unknown`**, a word that changes in one hit. On (b1) the pair stacks to −0.30 →
0.20 → `Distrusted`, which is a legible escalation rather than a silent one.

### Removal-reaction audit — clean, and it stays clean under this ruling

The orchestrator asked whether anything in the packet offers a `remove_condition` on an
affected band. Two do, and neither is exposed:

- **`toll.let_them_rest`** (fallback reaction, available on **every** band) lifts
  `trait.condition.exhausted`, with no `removeAll`.
- **`It Passes`** (step 2's Balm, `card.balm.signature.life`) lifts the same condition.

`exhausted` has exactly **one** minter — step 1's `failureMetadata` — which fires at most once
per run, so only one edge ever exists and the oldest-only removal is the whole removal. No
hazard today. `wounded` has no removal offered anywhere in the packet, which is why the
sibling's worst consequence never arises here.

**This is a property of the ruling, not a coincidence.** Under option (a) applied to the
wound, `wounded` would gain a second minter while remaining un-removable — and had a mercy
reaction ever been added later, it would have shipped silently broken. Folding keeps every
condition in this encounter single-minted, so no `removeAll: true` is required anywhere.

### And the overview is written for the wrong path

Independent of chips: the `critical_failure` overview opens *"The herd came through and they
were still in front of it."* The herd is **step 2's** fiction (spine 2: *"wagons, then a
driven herd, then more wagons"*). On path (a) the agent goes down at the toll line and the
column has not started moving — step 1's own afterimage says so. Rewrite the overview so it
is true whether the line broke at the stylus or under the tail. This is on the fix list.

---

## 1 · The finding that outranks it — the membership join silently falsifies the standing chip

This is a composition defect. Each write is correct alone; the two together make an authored
sentence false, on **every band the standing chip renders**. It is invisible to every
upstream pass because neither pass looks at two effects at once.

**The chain, read in source.**

1. Step 2's `successMetadata` writes `reputation_with` `+0.12` — the **edge leg**.
   `applyReputationWithDelta` mints/moves a `reputation_with` edge. 0.5 → 0.62.
2. The same `successMetadata` writes `membership_change` `op: 'join'` →
   `joinFaction` (`factionMembership.ts`), which mints `member_of` with
   `reputation: FACTION_JOIN_STARTING_REPUTATION` = **0.05** (`faction-constants.ts`).
3. Every surface then reads `getReputationWith`, whose dispatch is **priority, not
   fallback**, in its own doc comment: *"a member of a guild reads the membership leg even
   if an old `reputation_with` edge exists, because rank, access and expulsion all hang off
   that one."* Membership is leg 1; the edge leg is leg 2 and is never reached.
4. So the readout the player opens shows `bandOf(0.05)` = **`Distrusted`**, where before the
   encounter it showed the neutral default 0.5 = **`Accepted`**.

The `critical_success` stack therefore renders, side by side:

> **BOON · standing with the company** — *"…standing with the mercenary company went up. The
> company thinks better of them than it did before the column stopped."*
> **PATH · a company membership** — *"…on the company's member list now, at the lowest rank
> it keeps."*

…and the Standings row on `OverviewTab` moves **down four bands**, caused by the chip
standing next to it. The BOON chip is false as composed.

**The packet's ordering note is the specific error.** § 8 claims *"writing the pairwise
standing while the agent is still a non-member, then enrolling them, is the order that makes
both writes mean what they say."* Ordering is irrelevant — the dispatch is by priority, not
recency. Once the `member_of` edge exists, the pairwise edge is unreadable by every consumer
until decay deletes it.

**It is not confined to `critical_success`.** The packet's own open item 7 records that
`membership_change` fires on **every** success-side band. So `success` is masked identically,
and the BOON standing chip is false on both bands it appears on.

**No ordering or leg choice rescues the claim.** Writing the gain through the membership leg
instead (`faction_reputation_gain`, after the join) gives 0.05 + 0.12 = 0.17 → still
`Distrusted`. *The join itself is the demotion*: enrolling a non-member replaces a neutral
0.5 read with a 0.05 read, by construction, for every faction in the game. A chip claiming
standing rose cannot share a band with a chip that enrols the agent. That is the whole
finding, and it generalises past this encounter.

**Ruling: fold the BOON standing chip.** The membership is the true, concrete, downstream-read
consequence of the success side and it keeps its chip. The `reputation_with +0.12` **write
stays** — Law 56 is one-directional, and it is the read that survives in a world where
`resolveFactionNodeId` finds no chapter and the join no-ops (the packet's own fail-soft case).
Note the symmetry that settles it: the BOON chip is true only on the worlds where its own
stack-mate fails to render.

Folding it empties the `success` band of chips. **Move the PATH membership chip to fire on
`success` as well** — the write already fires there, so it is backed, and it gives the plain
success ending a real consequence instead of an overview alone. It needs a `success`-flavoured
`causeClause`/`detail` (the `critical_success` pair names the serjeant's recruiting question,
which the `success` overview does not promise) plus one clause in the `success` overview
naming the enrolment, so the chip is not unpromised.

The brief's *"faction standing #1 of 2"* target then lives entirely on the failure side —
where no join happens, the edge leg **is** read, and the −0.15 raised above makes it move a
word. The target survives; it just stops being claimed on a band where it is untrue.

---

## 2 · Half A — anchoring, with reachability

Six distinct chips across eight band-instances. Reachability column per the prompt: does the
backing write fire on **every** path to *this* band.

| Chip | Referent | In the catalog? | Prose names it? | Backing step · reachable on this band | Verdict |
|---|---|---|---|---|---|
| `critical_success` · **BOON** `toll.iron_tested` — iron capability | The actor's own capability score in the `iron` reach — a stat on an agent | ✓ Stats · *Reach* — `tooltipId: 'reach.<domain>'` **plus the bearer's `entityId`**; declared `{ text: 'the iron reach', entityId: '$actor', tooltipId: 'reach.iron' }` | ✓ *"{actor}'s capability in the iron reach moved"* — names the bearer and the one stat, not a category | `applyEncounterGrowth` at resolution · **YES** — fires on every step resolution, and `critical_success` requires both steps to have run | **anchored** |
| `critical_success` · **PATH** `toll.on_the_rolls` — a company membership | The `member_of` edge between the actor and the mercenary-company faction node | ✓ Actors · `faction` 🔗 linked, declared `$faction:mercenary_company` + `visualKind: 'faction'`; the edge row `member_of` 📍 named | ✓ *"on the company's member list now, at the lowest rank it keeps"* — and `joinFaction` really does seat `sellsword`, so the sentence is literally true | step 2 `successMetadata` `membership_change` · **YES** — a `critical_success` action band implies step 2 landed success-side | **anchored** |
| `critical_success` + `success` · **BOON** `toll.the_company_noticed` — standing with the company | The actor's standing with the mercenary company | ✓ Stats · *Standing* — `tooltipId: 'ui.standing'` plus the faction's `entityId`; declared correctly | ✓ form is right, **but the claim is false as composed** — see § 1 | step 2 `successMetadata` `reputation_with` · fires, **and is then unreadable**: the join in the same metadata makes `getReputationWith` return the membership leg | **fold** (both bands) |
| `success_at_cost` · **BOND** `toll.the_serjeants_debt` — a favour owed | The `owes_favor` edge, debtor the bound serjeant, creditor the actor | ✓ Actors · `individual` 🔗 linked via `$cast:serjeant`; edge row `owes_favor` 📍 named | ✓ *"The serjeant, {cast:serjeant}, owes {actor} a favour now"* — names **both** endpoints, and `concepts.text: 'The serjeant'` is a substring that survives enrichment | step 2 `successMetadata` `favor_creation` · **YES** — `success_at_cost` is only reachable through `computeFinalActionOutcome`, which requires step 2 | **anchored** — the packet's best chip |
| `failure` · **SCAR** `toll.what_the_column_left` — a wound | The `trait.condition.wounded` attachment template node | ✓ Attachments · `condition` 🔗 linked, `entityId` = the **template** node id + `visualKind: 'attachment'` | ✓ *"{actor} is carrying a wound"* — one template, named by its own noun | step 2 `failureMetadata` `apply_condition` · **YES** — plain `failure` requires step 2's own failure-side roll | **anchored** |
| `critical_failure` · **SCAR** `toll.what_the_column_left` — a wound | as above | ✓ | ✓ | step 2 `failureMetadata` · **NO on path (a)** — step 1's `critical_failure` forces immediate resolution and step 2 never runs | **fold** (this band only) |
| `critical_failure` · **SCAR** `toll.an_easy_row` — standing (loss) | The actor's standing with the mercenary company | ✓ Stats · *Standing*, mirror of the boon's form | ✓ — and unmasked here, because no join fires on the failure side | step 2 `failureMetadata` `reputation_with` · **NO on path (a)**; also **imperceptible** at −0.10 (0.5→0.40 stays `Accepted`) | **fix** — duplicate onto step 1 and raise to −0.15 |

**Half A fails: three chips need a fold or a write-side fix and the draft has applied none.**

### Two things Half A deliberately does *not* fold

- **The faction chips, for naming the company by kind.** `applyConceptDecorations`
  (`buildAftermathConsequences.ts`) does a plain first-occurrence substring match on the
  *enriched* sentence — it decorates the authored words, it does not replace them with the
  entity's name. So the player reads the literal phrase *"the mercenary company"*, carrying a
  live link to the resolved faction node. The referent exists, resolves and clicks; only the
  in-world chapter name is absent, and **no token can supply it** — `{faction}` resolves the
  *actor's own* faction (`proseEnrichment.ts:619`), which on `success` is the wrong body
  entirely and on `critical_success` depends on write ordering. A corpus-level limitation,
  not this encounter's defect. Recorded for the batch report; not a fold.
- **The wound and capability chips, for anchoring things that cannot be clicked from the
  chip's own tile.** Both are catalog members in good standing. The trap named in the prompt.

---

## 3 · Half B — what it leaves behind

> **What does this encounter leave behind that a later encounter or system can pick up, and
> would the player recognise it happening?**

It leaves a favour the serjeant owes, which a live action verb spends; a place on the
mercenary company's rolls, which five faction systems read and the agent's own card shows;
and detection pressure in the region, which a rival god's strike-seeder is counting toward a
threshold. Three real handles, and the player meets all three on surfaces outside the
encounter.

### What this encounter leaves behind

| What is written | Where it lands | What downstream reads it | Would the player notice? |
|---|---|---|---|
| **`favor_creation`** — an `owes_favor` edge, debtor the serjeant, creditor the actor | Both parties' graph neighbourhood; serjeant declared `must-persist` | **Spent by a live verb**: `action.secrets.call_in_favor` → graph op `call_in_favor` redeems the best unredeemed, unbroken edge. Also `phaseSecretsFavors` (tick phase), `socialLeverage`, and `threadDigest`, which ages an old favour into faction tension | **Yes** — `agentDetail` surfaces `favorsOwed` / `favorsOwedToMe` on both sheets, and the chip links straight to the serjeant. **The encounter's strongest connection.** |
| **`membership_change` (join)** — a `member_of` edge to the mercenary company, seated at `sellsword` | The faction's roster and the agent's own sheet | 86 non-test modules touch `member_of`. The live ones for a new member: `factionMemberWork` (routes off-screen guild work to members at the faction tier — the THR-810/814 fix), `factionQuestGeneration` (rank-gated quest access), `factionRankBonus` (`scoring_boost` into encounter scoring, `encounter_reward_multiplier`), `factionOutcome`, `factionNetwork`, expulsion | **Yes** — `AgentInfoCard` renders the faction row, and the sheet shows the rank name. **The batch's most concrete membership write, and it earns the PATH category.** |
| **`reputation_with` → `mercenary_company`** (success side, `+0.12`) | A `reputation_with` edge at 0.62 | Nothing, while the membership holds — `getReputationWith` dispatches to the membership leg by priority | **No — and worse, the readout moves the wrong way.** § 1. Fix: fold the chip; keep the write for the no-chapter world. |
| **`reputation_with` → `mercenary_company`** (failure side, `−0.10`) | Edge at 0.40 | `getReputationWith` → `OverviewTab` Standings, `LocationProfileModal`, `secretGeneration`, `socialLeverage` | **Not as authored** — 0.40 is still `Accepted`, the same word as the 0.5 default, and Law 4 forbids a numeral. At **−0.15** it reads `Unknown` and the chip becomes true. |
| **Capability `growth`** on `iron` | A synthetic `encounter_experience_iron_<agent>` trait feeding the raw-score walk | `computeCapability` → every reach gate, forecast and scoring path in the game | **Almost never.** See below. |
| **`detectionDelta` ×2** (0.15 step 1, 0.12 step 2) | `state.regionalDetectionPressure` via `applyRawDetectionDelta`, traced `nudge_cost_charged` | `phaseDetectionPressure` decays at 0.005/tick and, at `DETECTION_THRESHOLD_ENCOUNTER` = 1, plants a `shadow.rival_strike` encounter seed | **Yes, as a price** — see below. |
| **Card grants** — `wounded` → serjeant (Stumble), `remove_condition exhausted` (Balm), `inspired` → actor (Shared Watch) | Condition edges with `ticksRemaining` | `decayConditions`, reach modifiers, the bearer's Attachments tab | **Yes** — conditions are inspectable objects with their own detail view. The Stumble's grant is the notable one: it walks a wound out of the scene on a persisted NPC. |
| **No seed** | — | — | The batch's seed pair is #4→#5; this row plants nothing. Judged below. |

### Is capability `growth` perceptible? **No — same class as `quintessence_shift`, with one aggravation.**

Capability surfaces as a **word per tier**: `agentDetail` exposes
`{ domain, word, tier }`, and `computeTier = Math.min(10, Math.ceil(capability * 10))`, so
the displayed word only changes when capability crosses a 0.1-wide band. One `critical_success`
adds roughly `BASE_ENCOUNTER_GROWTH 0.5 × difficultyScaling(36) 0.5 × CRITICAL_SUCCESS 1.5` ≈
**0.375 raw points**, fed through a saturating sigmoid — a capability move of order 0.01–0.03.
It moves the word only when the agent happens to be sitting on a boundary, and when it does,
`handleTierPromotion` fires a loud promotion event with a trait grant that the chip is not
needed for.

The aggravation: `mergeAftermathChanges` **suppresses a derived change whose concepts an
authored change declares**. So authoring this chip does not add a report — it *replaces* the
engine's own derived growth entry with a bare *"moved"*. Not a fold (the referent is real, the
form is right, the write happens on every path), but the honest reading is that this chip is
decoration on almost every run, and the brief should not count `growth` as a demonstrated
capability surface on the strength of it.

### Is the detection cost perceptible? **Yes — the best-behaved of the debut channels.**

Two ways, both real. **At the point of choice**: `buildNudgePhaseModel` turns
`costs.detectionDelta` into a channel chip on the card face, rendered from
`NUDGE_COST_CHANNEL_DISPLAY` as **`👁 Someone will notice`** — a word, no numeral, before the
player commits. **In aggregate**: the charge is a genuine world write, and
`phaseDetectionPressure` plants a `shadow.rival_strike` seed at pressure 1. One 0.15 charge is
15% of that bar against a 0.005/tick decay — so a single play of Full Weight does not summon a
rival, but a god who keeps reaching for the heavy hand will meet one, which is exactly what a
budget channel should feel like. The effect lines carry it honestly
(*"Rival gods can hardly miss a hand this heavy"*). **The channels' debut is sound; ship it.**

### Solitariness

It plants no seed and it does not need to. A favour a verb can call in, a membership five
systems read, and a detection charge a seeder is counting are three forward connections, all
minted rather than borrowed, and none of them depend on another encounter in the batch
existing. **Not solitary.**

**Half B verdict: `connected`** — on the strength of the favour, the membership and the
detection channel. The standing writes are the weak leg and the fix list repairs them.

---

## 4 · Fix list — precise enough to apply without re-reading the packet

Content-only. No engine change. Apply all five.

1. **Fold `toll.the_company_noticed` (BOON standing) from `critical_success` and from
   `success`.** Keep the `reputation_with +0.12` on step 2's `successMetadata` unchanged —
   the write is legitimate and is the read in a world where no chapter spawned. Reason: the
   `membership_change` join in the same `successMetadata` fires on every success-side band and
   makes `getReputationWith` read the membership leg (0.05) instead of the edge leg (0.62), by
   priority dispatch, so the readout moves `Accepted` → `Distrusted` on the band whose chip
   says standing rose. Delete the packet's § 8 *"Ordering note"* — its premise is wrong.

2. **Add the PATH membership chip (`toll.on_the_rolls`) to the `success` band.** Same backing
   write, same anchor form, already fires there. Author a `success`-flavoured `causeClause`
   and `detail` — the `critical_success` pair names the serjeant's recruiting question, which
   the `success` overview does not promise — and add one clause to the `success` overview
   naming the enrolment, so the chip is promised by the prose above it. Without this, folding
   #1 leaves `success` with zero chips.

3. **Fold `toll.what_the_column_left` (SCAR a wound) from `critical_failure`.** It **stays on
   `failure`**, unchanged. Reason: step 1's `critical_failure` forces immediate action
   resolution (`advanceStep`), so step 2's `failureMetadata` never runs on that path.
   Duplicating instead is rejected: `apply_condition` mints a fresh edge per call with no
   dedupe, so the compound path would leave two live `wounded` edges at intensity 0.35 for 48
   ticks — a real escalation on the *most common* failure path, against a row whose tone is
   "hard, not grim".

4. **Back `toll.an_easy_row` (SCAR standing) on every path, and make it visible.** Raise step
   2's `failureMetadata` `reputation_with` from `−0.10` to **`−0.15`**, and add the identical
   effect to **step 1's own `failureMetadata`**, after the existing `exhausted` grant:

   ```
   // step 1 failureMetadata.effects
   { kind: 'apply_condition', conditionTraitId: 'trait.condition.exhausted',
     targetAgentId: '$actor', durationTicks: 36 },                       // already authored
   { kind: 'reputation_with', targetFactionId: 'mercenary_company',
     delta: -0.15 },                                                     // ADD
   ```

   Do **not** add the `wounded` effect here — that is fix #3's whole point. −0.15 takes 0.5 →
   0.35, crossing `Accepted` → `Unknown` (`REPUTATION_WORDS` tiers are 0.2 wide), so the chip
   moves a word in one hit; −0.10 left it at 0.40, still `Accepted`, reporting nothing the
   player can see. On the compound path the two calls stack to −0.30 → `Distrusted`; each call
   is inside `REPUTATION_WITH_MAX_DELTA_PER_OUTCOME`.

5. **Rewrite the `critical_failure` overview so it is true on path (a).** It currently opens
   *"The herd came through and they were still in front of it"* — the herd is step 2's fiction,
   and on a step-1 critical failure the column has not started moving. Drive the sentence off
   what is true either way: they went down and the column went past. Keep the pack theft, which
   the design block licenses on this band alone.

**Downstream of the fixes**, the chip ledger reads: `critical_success` — PATH membership +
BOON iron capability; `success` — PATH membership; `success_at_cost` — BOND favour owed;
`failure` — SCAR a wound; `critical_failure` — SCAR standing. Five bands, five chips, every one
backed on every path to its band.

## 5 · Carried to the batch report

- **`reputation_with` and `membership_change` cannot share a band** when either is chipped as
  a standing gain. This is not a Toll-of-Blades defect — `getReputationWith`'s priority
  dispatch makes any join mask any pairwise standing, for every faction in the game. Encounter
  #6 (`the_garrisons_price`, `gold` → `shadow`) should be checked for the same pairing before it
  ships, and the nudge-authoring spec's Consequences section wants a line about it.
- **A faction chip cannot name its chapter.** `{faction}` resolves the *actor's* faction, so an
  author naming a third-party faction can only write its kind noun and let the link carry the
  identity. Corpus-wide; worth a token if the corpus keeps minting faction chips.
- **Capability `growth` is not a demonstrated surface.** It is a real write behind a word that
  one encounter almost never moves, and authoring the chip suppresses the engine's own derived
  entry. Second sibling finding of this class after `quintessence_shift`.
- **The cost-channel debut is sound.** `detectionDelta` charges a real region store, renders as
  `👁 Someone will notice` on the card before commit, and feeds the `shadow.rival_strike`
  seeder. No changes wanted.
- **The duplication remedy is safe for scalar effect kinds and unsafe for condition kinds.**
  `reputation_with` moves a score on one edge; `apply_condition` and `condition_attachment`
  mint a fresh tick-keyed `has_trait` edge with no already-holds check, which `effectWalker`
  then counts twice and a non-`removeAll` mercy half-removes. The rule for the spec:
  *duplicate a scalar across two steps' metadata freely; never duplicate a condition —
  fold the chip instead.* Reproduced in source here (`encounterAftermath.ts:2023-2135`,
  `:2162-2167`; `effects/effectWalker.ts:65-93`) and independently on the sibling encounter.
- **`anchor-catalog.generated.md` is stale on `location`.** Rows 29/45 say a location anchor
  carries no `visualKind`, contradicted by the file's own line 22, by `unifiedAction.ts:237`
  and by `EncounterVeil.openEntity` routing `location` to `LocationProfileModal` (THR-1172) —
  a location chip with `visualKind: 'location'` is a **live click**, not merely a legal name.
  It changes no verdict in this encounter, which anchors no location and writes to none, but
  the catalog is the authority Half A reads and the generator needs re-running before #2 and
  #3 (which carry the batch's two location/sublocation anchor targets) reach this pass.
- The systems pass's reachability table collapses paths (b1) and (b2) into one row. Splitting
  them is what shows that "move the writes to step 1" cannot work. Worth correcting there so
  the next encounter does not re-derive it.

PACKAGE FIX
