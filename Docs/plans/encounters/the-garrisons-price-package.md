# Encounter Pipeline: The Garrison's Price — Pass 3b, the Package critic

> Slug: `the-garrisons-price` | Batch: border-perils (THR-1221), row **6** | Date: 2026-08-24
> Judges `the-garrisons-price-final.md` as one composed package: prose + chips + writes as the
> player meets them. Editorial verdict *Fixed, 2 passes deep*; systems verdict
> *READY FOR IMPLEMENTATION*. Last of the six to reach this stage.

```
templateId: encounter.border.the_garrisons_price
packageVerdict: connected
packageLeaves: A named quartermaster who now holds an opinion of the traveler, standing with the mercenary company that on the good endings crosses into Respected — the band reputation-gated doors ask for — and, when the haggle goes badly, a 96-tick compulsion that visibly bends the traveler's next several encounters toward paying work.
```

---

## 0 · The faction-standing trap — half of it misses, half of it lands harder than on the sibling

The sibling (`toll_of_blades`) had to fold its BOON standing chip because the same
`successMetadata` that raised `reputation_with` also fired a `membership_change` join, and
`getReputationWith` (`src/engine/reputation.ts:157-184`) dispatches by **priority**: the
membership leg returns at `:171-177` before the edge leg at `:179-184` is consulted, so the
join's `FACTION_JOIN_STARTING_REPUTATION` = 0.05 masked the +0.12 and the readout *fell*.

**That half does not apply here, and I checked rather than assumed.** Grepped the whole packet
and the systems audit: **zero occurrences** of `membership_change`, `joinFaction` or
`faction_reputation_gain`. This encounter's only faction write is `reputation_with`, and § 17
of the packet gives the correct reason (`applyFactionReputationGain` no-ops with
`not_a_member` for a non-member). The traveler never joins the company. **The standing chips
are not masked, and the mask is not a risk this packet carries.**

**The other half — magnitude — lands, and it splits the two directions.**
`getReputationWord` (`src/data/domain-words.ts:110-126`) is
`tier = Math.min(4, Math.floor(clamped * 5))` over five 0.2-wide bands
(`Distrusted / Unknown / Accepted / Respected / Revered`), and `REPUTATION_WITH_DEFAULT` is
0.5 → `Accepted`. Law 13 forbids the numeral, so the word is the whole readout.

| Chip | Authored delta | Score after | Word after | Moved? |
|---|---|---|---|---|
| `gp.company_standing` (gain) | **+0.10** | 0.60 | **`Respected`** | **YES** — and `Respected` is the band `meetsReputationWithRequirement` gates ask for |
| `gp.company_standing_lost` (loss) | **−0.06** | 0.44 | `Accepted` | **NO** — identical to the pre-encounter default |

So the gain chip is the packet's **best** chip and the loss chip is its **weakest**, off the
same effect kind, and the difference is 0.04 of authored magnitude.

**The loss is worse than the sibling's −0.10, in a way the sibling did not have to name.**
`getNotableStandings` (`reputation.ts:398-419`) sorts by `|score − 0.5|` and slices to a row
limit. A 0.06 departure sorts **last** among every standing the agent holds, so on any
travelled agent the chip's referent may not appear on the profile at all — the chip does not
merely report an unchanged word, it can point at a row the surface never renders.

**Ruling: the standing chip survives — it is not folded — but its write must be raised.**
Fold is the wrong instrument: the referent exists, the anchor form is right, the prose names
it, and the write is real and reachable on every path. What is wrong is a number. Raise both
instances to **−0.15** (`REPUTATION_WITH_MAX_DELTA_PER_OUTCOME`, the channel's own cap):
0.5 − 0.15 = 0.35 → **`Unknown`**, a word that changes in one hit. −0.11 is the arithmetic
minimum; −0.15 matches the ruling already applied to the sibling one row earlier in this batch,
and — unlike the sibling — **nothing here can stack it**, because `fail_action` on step 1 means
the two `failureMetadata` blocks are mutually exclusive (§ 1). Exactly one −0.15 ever fires.

The gain side needs no change. Leave `+0.10` alone: it crosses `Accepted → Respected` cleanly
and putting it at the cap would overshoot a single road toll into `Revered` territory on a
second pass.

---

## 1 · The non-idempotent write class — the double does not occur here, and `removeAll` is not needed

The prompt's premise is that step 1's `failureMetadata` fires on any step-1 failure, so a
failure→failure run fires both blocks and doubles the `condition_attachment`. **On this
template that run does not exist**, and the reason is structural rather than lucky.

**Traced, not assumed.** `advanceStep` (`unifiedActionLifecycle.ts:179-190`): when
`isStepFailure(outcome)` and (`failBehavior === 'fail_action'` or the outcome is
`critical_failure`), the function returns `resolved: true` immediately and never reaches the
advance branch. **Both** of this template's steps declare `failBehavior: 'fail_action'`. So:

| Path | Step 1 | Step 2 | Which `failureMetadata` fires |
|---|---|---|---|
| (a) | `failure` / `critical_failure` | **never runs** | step 1 only |
| (b) | any success-shaped outcome | `failure` / `critical_failure` | step 2 only |

There is no (b1) — the sibling's compound row exists only because *its* step 1 was
`continue_weakened`. Here the two blocks are **mutually exclusive by construction**.

Consequences, each checked against the source the prompt named:

- **`condition_attachment` of `trait.condition.exhausted` is single-minted per run.** It is
  authored **only** on step 2 anyway, so even the (a)/(b) split cannot double it. No second
  `has_trait` edge, so `effectWalker.ts:66-93`'s dedupe-free walk cannot double the modifier,
  and there is one sheet row and one decay timer.
- **`remove_condition` in `gp.walk_it_off` needs no `removeAll`.** Confirmed the oldest-only
  behaviour at `encounterAftermath.ts:2160-2167` (an `appliedAt` `reduce` when `removeAll` is
  falsy). With exactly one minter, the oldest edge *is* the only edge, so the removal is
  complete. **Do not add `removeAll: true`** — it would be inert here and would quietly widen
  the reaction into removing an exhaustion the agent brought in from somewhere else.
- **`reputation_with`, `bond_change` and `plant_compulsion` are immune anyway**, as the prompt
  anticipated: the first moves a score on one edge (`applyReputationWithDelta`), the second
  mutates one `relates_to` edge in place (`applyBondEdge`, `encounterAftermath.ts:889-919`),
  and the third appends one `PlantedCompulsion` to a `GameState` array with its own cap and
  decay phase. None mints a per-tick-keyed edge.

**One residual, corpus-level and not this encounter's to fix.** If the agent walks in already
carrying `exhausted` from another source, `condition_attachment` adds a second edge (no
already-holds check at `:2345-2364`) and `gp.walk_it_off` then removes the *older*, foreign
one. That is the general non-idempotency the sibling documented; it is not created here and no
content-side change closes it. Recorded for the batch report.

---

## 2 · The opt-in gate — the graded mechanic, and it is now genuinely graded

**Is the exit strictly cheaper than the worst engagement?** Yes, and by set inclusion rather
than by argument. Declining writes the **empty set** — the mortal simply does not select the
encounter, so no metadata block runs at all. Every engagement ending writes a non-empty
superset:

| Path | What the engine writes |
|---|---|
| Decline | ∅ — cost is a movement delay (three days east, stated in figures in the `initiation`) |
| Fail step 1 (path a) | `reputation_with` −, `bond_change` −, `plant_compulsion` — *plus* the same low track |
| Fail step 2 (path b) | all of the above **plus** `condition_attachment` `exhausted` |

∅ ⊊ both. The exit is strictly cheaper, and the editorial repair is what made that true of the
*prose's own claim*: before it, step 1 wrote nothing, so failing the haggle cost exactly what
declining cost and § 1's "one honest asymmetry" was fiction. It is now three real writes.

**But the asymmetry is only half legible today, and that is the standing chip's fault.** Of
the three step-1 failure writes, one is invisible at its authored magnitude (`−0.06`, § 0),
one is a bond row appearing at 15% red on a first meeting, and one — the compulsion — puts a
line in the chronicle. Raising the standing delta is therefore not cosmetic tidying: it is
what makes the graded exit visibly graded, which is precisely what the `Opt-in Complication`
row asks for (*"a cheap, legible exit"*).

**Does any card lobby the gate?** No — checked card by card, and the structural argument is
stronger than the enumeration. The hand is dealt at step 1, i.e. **after** the mortal has
already selected the encounter, so no card can reach the decision. On content: step 1's six
act on the mortal's nerve at the table, the officer's sense of obligation, the doom clock, the
shape of the terms, the company's arithmetic, and what is worth noticing; step 2's five act on
attention during the count, strength in the work, the doom clock, a debtor turning up, and the
body's last hour. None argues *approach* or *walk away*. Neither hand contains an Undertow, a
Compulsion or a Kindled Ambition. There is no `authoredChoices` layer anywhere.

**One thing that looks like a gate-lobby and is not.** `plant_compulsion` biases the mortal's
*encounter selection* toward `trade`/`acquire`/`hire` — the same pipeline the opt-in gate runs
through. But it biases **future** encounters, not this one, it fires only after this encounter
has already resolved, and it is the drawn `drive` consequence doing exactly what a drive
should. It is the encounter's forward connection, not a breach of the gate rule.

---

## 3 · Half A — anchoring, with reachability

Five distinct chips across eight band-instances. Reachability asks whether the backing write
fires on **every** path to *that* band.

| Chip (bands) | Referent | In the catalog? | Prose names it? | Backing step · reachable on this band | Verdict |
|---|---|---|---|---|---|
| `gp.company_standing` — *Counted a payer* (`critical_success`, `success_at_cost`) | The actor's standing with the mercenary company | ✓ Stats · *Standing* — `tooltipId: 'ui.standing'` on the concept **plus** the faction's `entityId`; declared `$faction:mercenary_company` + `visualKind: 'faction'` (Actors · `faction` 🔗 linked; `$faction:` is the sanctioned def-id sentinel, `chipAnchorDeclarations.ts:56-57`) | ✓ *"The company's book has them down as a payer now — standing that carries at their other posts"* — names the one company it dealt with; the chapter name is unreachable corpus-wide, not a defect here | step 2 `successMetadata` `reputation_with +0.10` · **YES** — both bands require step 2 to have resolved success-side (`fail_action` on both steps means no failing step can ever aggregate) | **anchored** — and the only chip in the batch whose write crosses into `Respected`, the band gates read |
| `gp.quartermaster_bond` — *The book-keeper's own word* (`critical_success`, `success`) | The `relates_to` bond between the actor and the bound quartermaster | ✓ Actors · `individual` 🔗 linked via `$cast:officer` + `visualKind: 'agent'`; the `relates_to` edge row is 📍 named | ✓ *"{cast:officer} trusts them further than the company does"* — names the person, and `must-persist` guarantees the token resolves | step 2 `successMetadata` `bond_change` `sentimentDelta 0.20, trustDelta 0.15` · **YES**, same mechanism | **anchored** |
| `gp.company_standing_lost` — *Down in their book* (`failure`, `critical_failure`) | Same standing, downward | ✓ same form | ✓ *"The company has them down as a haggler"* | **both** steps' `failureMetadata` `reputation_with −0.06` · **YES on every path** — this is the editorial repair and it holds; but **imperceptible**: 0.44 still reads `Accepted`, and a 0.06 departure sorts last in `getNotableStandings` | **fix** — raise to `−0.15` (§ 0). Not a fold: real write, real anchor, wrong number |
| `gp.quartermaster_cooled` — *Cooler across the table* (`failure`, `critical_failure`) | The same bond, downward | ✓ same form | ✓ *"{cast:officer} thinks less of them than before"* | **both** steps' `failureMetadata` `bond_change` `sentimentDelta −0.15` (**no `trustDelta`**) · **YES on every path** | **fix (wording)** — the `detail` is true, the `stateNoun.text` is not. See below |
| `gp.the_figure_follows` — *The figure follows them* (`failure`, `critical_failure`) | The planted compulsion riding the actor | ✓ anchored on its **bearer**: Actors · `individual`/`ascendant` 🔗 via `$actor` + `visualKind: 'agent'`. The compulsion itself is `GameState.plantedCompulsions`, not a graph node — the bearer is the anchor, exactly as a seed anchors through its carrier (catalog clarification 2) | ✓ *"{actor} cannot put the number down. For a while now they will take paying work ahead of the road, the errand or the rest"* — names the bearer and the specific bias | **both** steps' `failureMetadata` `plant_compulsion` · **YES on every path** | **anchored** — see the parity note in Half B |

### The `stateNoun` / write mismatch on `gp.quartermaster_cooled`

Small, real, and only visible when the two chips are read against each other. The **boon** side
writes `sentimentDelta: 0.20, trustDelta: 0.15`, so its `stateNoun: 'trust with the
quartermaster'` is accurate. The **loss** side writes `sentimentDelta: -0.15` and **no
`trustDelta`** — and `applyBondEdge` touches `trust` only `if (trustDelta !== undefined)`
(`encounterAftermath.ts:916-919`). So trust is the one quantity the failure band does not
move, and the chip names it as its state noun.

The `detail` (*"thinks less of them"*) is sentiment, which *is* written, so this is a
`stateNoun` precision fault rather than a dead chip. **Fix by renaming the state noun, not by
adding a `trustDelta`** — the asymmetry is good design: dealing straight earns trust, haggling
badly costs warmth. `'the quartermaster's regard'` says what moved. The `concepts` entry
(`text: 'thinks less of them'`) is a substring of the `detail` and is unaffected.

### Three things Half A deliberately does *not* fold

- **The compulsion chip, for anchoring something with no page.** The prompt's trap, one step
  further out than the sibling's: the referent is not a graph node at all, but it is a real
  engine write (`encounterAftermath.ts:2752-2814`) with a live reader
  (`phaseAgentDecision.ts:628` → `derivePlantedCompulsionEncounterBias`) and its own decay
  phase. Anchoring is about whether the referent exists; the chip anchors through the bearer,
  which is linked and named.
- **The faction chips, for naming the company by its kind noun.** `applyConceptDecorations`
  substring-matches the authored words and hangs the live link on them; the chapter name is
  unreachable because `{faction}` resolves the *actor's own* faction. Corpus limitation,
  recorded by the sibling, unchanged here.
- **The bond chips, for reading off a bar rather than a word.** `AgentDetailPanel:600-630`
  renders bond sentiment as a signed, coloured bar (`|sentiment| × 100`) and `AgentInfoCard`
  as a signed line. There is no band word to cross — but the edge is *created* by this
  encounter (`BOND_CREATE_INITIAL_SENTIMENT` is 0, `effect-constants.ts:181`), so a row that
  did not exist appears, green at 20% or red at 15%. That is a strong parity result, not a
  weak one.

**Half A does not pass clean: two chips need a write- or wording-side fix, and the draft has
applied neither.** No chip needs a `fold` and no chip needs a `bind`.

---

## 4 · Half B — what it leaves behind

> **What does this encounter leave behind that a later encounter or system can pick up, and
> would the player recognise it happening?**

It leaves a quartermaster who is now a persisted person with a bond edge and an opinion; a
standing with the mercenary company that on the good endings crosses into `Respected`, the
band reputation gates actually ask for; and, on every bad ending, a 96-tick compulsion that
the tick loop reads into the agent's next several encounter choices and that announces itself
in the chronicle when it lands. Three handles, all minted here, none borrowed from another
encounter in the batch.

### What this encounter leaves behind

| What is written | Where it lands | What downstream reads it | Would the player notice? |
|---|---|---|---|
| **`reputation_with` → `mercenary_company`, `+0.10`** (success side, step-2 metadata) | A `reputation_with` edge at 0.60 | `getReputationWith` → `meetsReputationWithRequirement` (**band gates**), `reputationLeverageTerm` (social-scene opening leverage), `secretGeneration`, `getNotableStandings`, `LocationProfileModal`, the agent Standings rows | **Yes, and it is the strongest single write in the packet.** 0.5 → 0.60 crosses `Accepted` → **`Respected`** — the band gated content asks for, so the encounter does not just report a number, it opens doors |
| **`reputation_with` → `mercenary_company`, `−0.06`** (failure side, **both** steps) | Edge at 0.44 | Same consumers | **No, as authored.** Still `Accepted`; Law 13 forbids the numeral; and it sorts last in `getNotableStandings`, so it may not even be listed. At **−0.15** it reads `Unknown` and the chip becomes true |
| **`bond_change` → `$cast:officer`** (both directions, step metadata) | A `relates_to` edge, minted from 0/0 | `disposition`, social leverage, `getReputationWith`'s bond leg, the agent drawer's bond rows | **Yes** — a bond row appears on a person who had none, coloured by sign. The quartermaster is `must-persist`, so he is still there to meet again |
| **`plant_compulsion`, 96 ticks** (both steps' `failureMetadata`) | `GameState.plantedCompulsions` | `phaseAgentDecision:628` sums it into the decision bias at `COMPULSION_BIAS_WEIGHT` 0.5 → `trade 0.30 / acquire 0.25 / hire 0.20`, all under `COMPULSION_BIAS_CAP` so nothing is silently clamped; `phasePlantedCompulsionDecay` expires it | **Yes, at the moment it lands** — the authored `narrativeHook` becomes a `narrative` `TickEvent` at significance 0.4 stamped with the agent, and `Object.assign(state, next)` in `applyStepOutcomeEffects` carries `tickEvents`/`recentEvents` back, so the step-metadata path keeps it. **But see the parity gap below** |
| **`condition_attachment` `trait.condition.exhausted`** (step 2 only, deliberately unchipped) | One `has_trait` edge with a decay timer | `decayConditions`, reach modifiers via `effectWalker`, the bearer's Attachments tab | **Yes** — a condition is an inspectable object with its own detail view. Correctly unchipped: it is absent on path (a) |
| **`attachment_grant` → `agreement.debt.minor`** (failure-band reactions, 96/144 ticks) | A real agreement attachment | `effectWalker` walks its `social_modifier` (`cooperationBias: 0.05`, `targetFilter: 'any'`); `agentAttachments` / `agentDetail` surface it | **Yes as an object, no as a plot thread.** **Nothing collects on it.** There is no verb that redeems an agreement the way `call_in_favor` redeems an `owes_favor` edge — it is a standing cooperation modifier that lapses on its timer. Honest, and worth saying plainly |
| **`attachment_grant` → `agreement.favour.earned`** (fallback R1, 72 ticks) | Same shape | Same; `cooperationBias: 0.10`, `targetFilter: 'same_faction'` | Same — inspectable, uncollected. Note the `same_faction` filter means its modifier is inert unless the actor shares the counterparty's faction, which a traveler does not |
| **`favor_creation`** — `owes_favor`, debtor `$cast:officer` (step-1 Favor **card grant**) | Both parties' graph neighbourhood | **Spent by a live verb**: `action.secrets.call_in_favor` → graph op `call_in_favor` (`graphOpExecutor.ts:223`) marks the best `owes_favor`→actor redeemed. Also `phaseSecretsFavors`, `socialLeverage`, `threadDigest` | **Yes** — surfaced as `favorsOwed`/`favorsOwedToMe` on both sheets, and this template's own step-2 `requiresFavor` card reads it back within the same encounter. **Conditional**: it exists only if the god played that card, which is why the packet correctly refuses to rest the Rewards quota on it |
| **`intelligence`** record, `military_position` (step-1 Side-bet **card grant**) | `GameState.intelligenceRecords` | `encounterScoring`, `phaseAgentDecision`, `phaseIntelligenceDecay`; surfaced in `GameView` / `ThreadDetailView` | **Yes**, and conditional in the same way |
| **`doomDelta`** 0.05 (step 1) + 0.06 (step 2) | `doomClock.tickModifier` via `accelerateDoomClock` | `phaseDoom`, `rival`, `cycleEnd`, `chronicle`; rendered by `DoomBar`, `DoomClockDetail`, `WorldPulse` | **Yes — but as a numeral, and it never wears off.** See below |
| **`detectionDelta`** 0.15 ×2 | `state.regionalDetectionPressure` | `phaseDetectionPressure` decays 0.005/tick and plants a `shadow.rival_strike` seed at pressure 1 | **Yes** — `👁 Someone will notice` before commit, then a rival's strike if the god keeps reaching for it. Sibling's verdict stands |
| **No encounter seed** | — | — | The batch's seed pair is #4→#5; this row plants nothing. Judged below |

### Is the compulsion perceptible? **Yes at the moment it lands; no as an inspectable state.**

The honest answer has two halves and the brief deserves both. **Yes**: the authored
`narrativeHook` — *"The figure the gate quoted keeps coming back to them, and they start taking
the work that pays"* — is minted as a chronicle `narrative` event stamped with the agent, so
the player reads the compulsion being planted in the same beat as the chip. And the bias is
genuinely read: 96 ticks is eight game days at 12 ticks/day, long enough that the agent
visibly starts taking trade and hire encounters. **No**: nothing in `src/components` reads
`plantedCompulsions`. There is no row on the agent sheet, no attachment tile, no "driven by"
readout — the chip and the chronicle line are the only two places the compulsion is ever
named, and both are one-shot. A player who scrolls past the event and later wonders why this
agent keeps chasing paying work has no surface to check.

That is a Law 13 parity weakness, not a Law 56 defect: the write is real, its reader is live,
and the referent exists. It is the same class as the sibling's capability-`growth` finding —
keep the chip, and do not let the batch report claim `drive` as a *demonstrated inspectable*
consequence family on this evidence. **The gap is an engine/UI ticket, not a content fix**, and
it is the one thing standing between this encounter and an unqualified `connected`.

### Is `doomDelta` perceptible? **Yes, but it is the worse-behaved of the two debut channels.**

**Before commit it is the equal of detection.** `buildNudgePhaseModel:217-223` turns
`costs.doomDelta` into a channel chip on the card face from `NUDGE_COST_CHANNEL_DISPLAY`
(`nudge-card-display.ts:154-157`) — **`⧖ The hour comes sooner`**, a word, no numeral, on the
face before the player spends anything. Both Bargains carry it. That half is sound and the
brief can say so.

**After commit it is weaker, in two specific ways.** First, its only readout is a **numeral**:
`accelerateDoomClock` (`doomClock.ts:711-716`) just adds to `tickModifier`, and
`DoomClockDetail.tsx:205-209` renders `×1.05` in red — a raw multiplier behind a detail panel,
against detection's named threshold and the `shadow.rival_strike` encounter the player actually
*meets*. Second, and this is the real asymmetry: **detection decays at 0.005/tick and doom does
not decay at all.** `accelerateDoomClock` has no counterpart in any tick phase; only a
deliberate `decelerateDoomClock` ever lowers it. So the cheaper-looking channel is the
permanent one — a god who reaches for The Bargain repeatedly accumulates a world-clock
acceleration that never lapses and never produces an event to meet.

**Verdict for the batch report: the channels' debut is worth shipping, and the two are not
equals.** `detectionDelta` is the model — pre-commit word, decaying store, discrete downstream
event. `doomDelta` is legible at the point of choice and thin afterwards. Nothing in this
packet needs changing for it; the finding belongs upstream, and the honest line for the
director is *"detection you can feel arriving; doom you can only read off a number."*

### Solitariness

It plants no encounter seed and does not need to. A `Respected` standing that opens band-gated
content, a persisted named person carrying a live bond edge, a compulsion the decision phase
reads for eight game days, and — when the god spends the cards — a favour a live verb redeems
and an intelligence record the scorer reads. Four forward connections on the success side and
the failure side alike, none dependent on another encounter in the batch existing.

**Half B verdict: `connected`.**

---

## 5 · Fix list — precise enough to apply without re-reading the packet

Content-only. No engine change. Three items; the first is the only one that changes behaviour.

1. **Raise the failure-side faction standing from `−0.06` to `−0.15`, in BOTH steps'
   `failureMetadata`.** The two blocks are mutually exclusive (`fail_action` on both steps), so
   exactly one fires per run and there is no stacking to price in.

   ```ts
   // step 1 failureMetadata.effects AND step 2 failureMetadata.effects — both
   { kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: -0.15 },  // was -0.06
   ```

   Reason: `getReputationWord` tiers are 0.2 wide, so 0.5 − 0.06 = 0.44 still reads `Accepted`
   — the same word as the untouched default — and Law 13 forbids falling back on a numeral.
   `getNotableStandings` additionally sorts by `|score − 0.5|`, so a 0.06 departure sorts last
   and may be cut by the profile's row limit. −0.15 takes it to 0.35 → **`Unknown`**, at the
   `REPUTATION_WITH_MAX_DELTA_PER_OUTCOME` cap. **Leave the success-side `+0.10` exactly as
   authored** — it already crosses `Accepted` → `Respected`. Add a one-line code comment naming
   the band crossing, as `toll-of-blades.ts:760` does, so a later tuner does not shave it back.

2. **Rename `gp.quartermaster_cooled`'s state noun.** `stateNoun.text: 'trust with the
   quartermaster'` → **`'the quartermaster's regard'`**. Reason: the failure `bond_change`
   authors `sentimentDelta: -0.15` and **no** `trustDelta`, and `applyBondEdge` writes trust
   only when a delta is supplied, so trust is the one quantity that band does not move. Do
   **not** add a `trustDelta` to fix it — the asymmetry is correct design (dealing straight
   earns trust; haggling badly costs warmth), and the boon chip's `'trust with the
   quartermaster'` stays right because its write moves both. The `detail` and the `concepts`
   entry are unchanged and remain a valid substring pair.

3. **Correct § 14's aggregation note.** The packet states *"a step-2 near miss aggregates into
   `success` at the action level."* It does not: `computeFinalActionOutcome`
   (`unifiedActionLifecycle.ts:300-317`) sets `hasAnyCost` from `success_at_cost` **or**
   `near_miss` and returns **`success_at_cost`**. No chip is mis-backed by this — `success_at_cost`
   carries `gp.company_standing`, backed by step-2 `successMetadata`, which fires on `near_miss`
   because `near_miss` is `isStepSuccess` — so it is a documentation error, not a shipped
   defect. Fix it anyway: it is the kind of sentence a later author builds a band on.

**Not on the fix list, checked and cleared:**

- **No `removeAll: true` anywhere.** Single-minted condition; adding it would be inert and
  would widen the mercy into removing a foreign exhaustion (§ 1).
- **No fold of `gp.the_figure_follows`.** Real write, live reader, bearer-anchored, named in
  prose (§ 3, § 4).
- **The officer's two standing stores do not collide.** R2 and `gp.shave_it_on_the_road` write
  `reputation_with` on `$cast:officer` while the chips read a `relates_to` bond — so after
  either reaction `getReputationWith` switches from the bond leg (leg 3) to the edge leg
  (leg 2) for that pair, the same priority-dispatch shape as the sibling's finding one leg
  down. Computed it out: `BOND_CREATE_INITIAL_TRUST` is 0, so the bond leg reads
  `(0 + 0.15 + 1)/2 = 0.575` → `Accepted` on the success side and `(0 + 1)/2 = 0.5` →
  `Accepted` on the failure side, against edge-leg readings of 0.56 and 0.55 → `Accepted`
  either way. **Band-neutral in every case this encounter can produce.** No chip is falsified.
  Worth recording because the *shape* is live and a larger `trustDelta` would make it bite.

---

## 6 · Carried to the batch report

- **The membership-mask finding does not generalise to this row, and the check was cheap.**
  `the_garrisons_price` authors no `membership_change`, so its faction chips are read off the
  edge leg as intended. The sibling's cross-reference request is discharged: **checked, clear.**
  The residual form of the risk is that any pairwise-standing chip is masked for an agent who
  is *already* a member of the anchored faction from any prior source — unfixable at content
  level, worth one line in the spec's Consequences section alongside the sibling's.
- **The magnitude half of the finding is the one that generalises, and it now has two data
  points in one batch.** A `reputation_with` delta below ~0.11 off the 0.5 default cannot move
  a `REPUTATION_WORDS` band, and Law 13 leaves no numeral to fall back on. **The spec should
  state a floor**: a chipped `reputation_with` delta is authored to cross a band from the
  neutral default, or it is not chipped. Both encounters in this batch that carried one shipped
  under the floor in their drafts (−0.10 and −0.06).
- **`getNotableStandings` sorts by departure from neutral and slices.** A small standing move is
  not merely word-identical — it can fail to render a row at all. Worth adding to the same spec
  line; it is a second, independent reason the floor exists.
- **The duplication rule the sibling proposed holds, and this row shows its cheap case.**
  *Duplicate a scalar across two steps' metadata freely; never duplicate a condition.* Here the
  duplication was free in a stronger sense: `fail_action` on **both** steps makes the two
  `failureMetadata` blocks mutually exclusive, so scalars do not even double. **A template whose
  steps all declare `fail_action` can duplicate anything, conditions included** — that is a
  useful third clause, and it is what let this encounter close its backing hole by duplication
  where the sibling had to fold.
- **`doomDelta` and `detectionDelta` are not equals, and the brief should say so.** Both render a
  word on the card face before commit (`⧖ The hour comes sooner` / `👁 Someone will notice`).
  After commit, detection charges a decaying regional store that plants a `shadow.rival_strike`
  encounter at threshold; doom adds to `doomClock.tickModifier`, whose only readout is a red
  `×1.05` numeral in `DoomClockDetail` and which **has no decay path at all**. Detection is the
  model debut; doom is legible at the point of choice and thin afterwards, and permanent.
- **A planted compulsion has no inspectable surface.** Real write, live reader
  (`phaseAgentDecision`), 96-tick lifetime, and **zero** components read `plantedCompulsions`.
  Its only player-facing moments are the chip and the one-shot chronicle event the
  `narrativeHook` mints — so authoring a `narrativeHook` is effectively mandatory, not optional,
  for any chipped `plant_compulsion`. Worth a spec line and worth a small UI ticket (a row on
  the agent sheet beside conditions). Third finding of this class after `quintessence_shift` and
  capability `growth`.
- **Agreements are inspectable but uncollectable.** `agreement.debt.minor` and
  `agreement.favour.earned` are real attachment nodes whose `social_modifier` effects
  `effectWalker` walks, but **no verb redeems an agreement** the way
  `action.secrets.call_in_favor` redeems an `owes_favor` edge. Note also that
  `agreement.favour.earned` carries `targetFilter: 'same_faction'`, so its `cooperationBias`
  is inert for a traveler who shares no faction with the counterparty — an author granting it
  cross-faction is granting a decorative modifier. Both worth recording before the corpus mints
  more of them.
- **`anchor-catalog.generated.md` was regenerated for this batch and the `location` row is now
  correct** (`linked`, `visualKind: 'location'`). This encounter anchors no location and writes
  to none, so the correction changes no verdict here — confirming it landed before the last row
  of the batch reached this pass.

PACKAGE FIX
