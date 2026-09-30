# Encounter Pipeline: Called to End a Feud
> Scale: medium (3 steps, `scale: 'local'`) | Slug: feud-mediation | Pass: final
> Date: 2026-09-30 | Pipeline version: 2.0 | Batch: expert-everyday-1, slot 2 (THR-1678)
> Status: **READY WITH CAVEATS**

---

## Pipeline Summary

| Pass | Verdict | Notes |
|---|---|---|
| Draft | Complete | Three-step heart investigation → resolution (eye 0.55 → heart 0.62 → heart 0.68). Two house heads, a purse from each, one meeting at sundown. Wired hand: `companion` + `secret`. |
| Editorial | PASS WITH REVISIONS | Every change was prose: the rural opening brought under 80 words, the standing stake moved into P3, card faces made generic, class scenery removed, seams and repetitions fixed on all five bands, "Stay a week" removed. No ids, effects or numbers changed. |
| Systems | READY WITH CAVEATS | Every id and shape was verified in `src/`, and the draw was confirmed by `draw:consequences`. Three wiring fixes were applied inline (F1 disjoint cast reuse, F2 Whisper → Boost, F3 required `factorLine`s). Four implementer checks remain (C1–C4). |

### Caveats / Blockers

- **C1.** Run `check:encounter` and let `checkComposedHand` confirm the composed hands at the live deal: ≥4 spheres, ≥1 common card, and the s_a_c / critical_failure fragments covered by dealt members. The authored specials cover crit / success / near_miss / failure only. If a step falls short, raise its `deal.count`. Never add `card.boost.core` as a special.
- **C2.** Take live proof from a seed sweep plus a pinned band (`&spawn=encounter.town.feud_mediation&outcome=success`, then read `getOutcomePinVerdict()`). Run both the dry-run compile and `check:encounter` (#1111, #1113, #1114).
- **C3.** The hidden mark on `$cast:accused` is revealed only when its bearer (normally an ambient walk-on) resolves an investigation-family encounter. It is real concealed state but seldom revealed, which is shipped precedent (`company-drama`). `secret` is independently satisfied by `favor_creation`.
- **C4.** On an s_a_c run where step 0 failed, no hidden mark is written, though the overview's private admission still plays. This is narratively covered; no change.

No blockers.

### Systems fixes applied inline (marked `*(systems F#)*` in the packet)

- **F1: the two heads could bind to the same NPC.** `findExistingActorSupport` never excludes nodes the bundle already bound, and both specs reused `[merchant, noble, elder]`. Now:
  - `accused` reuses `noble`/`elder` and spawns `elder`, with `supportRole: 'feud_accused_head'`.
  - `aggrieved` reuses `merchant` and spawns `merchant`, with `supportRole: 'feud_aggrieved_head'`.
  - `supportRole` is a required field the packet had not authored.
- **F2: Loosen A Tongue re-typed Whisper → Boost (witness).** A Whisper's only mechanism is `reveals: 'next_step_demand'`, and this card's effect line promises talking witnesses. Author it with no `reveals` and no whisper `libraryCardId`. Its prose is unchanged.
- **F3: `TraitVariant.factorLine` is required and was missing.** Added below, together with `addNudgeIds: ['feud.lay_grudges_down']` on the Forgiving variant (the `the-broken-seal` precedent). These two factor lines are the **only new prose** in this document:
  - Forgiving: "Being Forgiving, they know how an old wrong is set down." (11 words)
  - Vengeful: "Being Vengeful, they feel the insult as if it were their own." (12 words, at the `factorLine` budget of 12)

Every other string in the packet below is verbatim from `feud-mediation-revised.md`.

### Editorial Notes Summary

The editorial pass cut the rural opening from 81 to 78 words (urban 79). It moved the standing stake into P3 ("If the feud outlasts that meeting, {location} will think less of {actor}.") and cut its repeat from the step-2 spine. It rewrote all five card effect lines so none shares a word with its title, and removed "thread", "servant" and the trait card's meta line. It dropped "council's fee" (class scenery) and fixed seam echoes (step-2 spine, failure overview, s_a_c afterimage). It resolved the house-scribe/guild-scribe confusion by telling the scribe once, on the companion chip. It removed "Stay a week" and "whatever" from the reactions.

### Implementation File Map

| File | Action |
|---|---|
| `Docs/plans/encounters/feud-mediation.package.json` | **Create.** Fill it from this document: prose verbatim, wiring per § Systems wiring spec below. |
| `src/data/encounters/feud-mediation.ts`, `src/data/encounters/__tests__/feud-mediation.test.ts`, registrations | Emitted by `npm run compile:encounter` (THR-1246). Do not hand-author. |
| `src/data/content-eval/plotHooks.ts` | Stamp `hook.unlikely_alliance` `usedBy` at batch closeout. |
| Concept art | Per § 18. |

No engine, type or primitive changes.

### Systems wiring spec (for the package)

**Template fields the packet leaves implicit:**
- `crudType: 'read'`, `apCost: 1`, `actorAffinities: ['individual']`.
- `settings: ['urban', 'rural']`, with one opening each. Do **not** author `locationSubtypes` or `consequenceDraw`; both are derived.
- `narrativeTemplates` (`initiation` / `success` / `failure`) and `description` are for the implementer to write in the packet's register.

**`supportBundle`:**

```jsonc
[
  { "kind": "actor", "key": "accused", "delivery": "lazy-materialize-on-trigger", "persistence": "must-persist",
    "reuseNpcRoles": ["noble", "elder"], "supportRole": "feud_accused_head", "spawnNpcRole": "elder", "spawnName": "Osric Venn" },
  { "kind": "actor", "key": "aggrieved", "delivery": "lazy-materialize-on-trigger", "persistence": "must-persist",
    "reuseNpcRoles": ["merchant"], "supportRole": "feud_aggrieved_head", "spawnNpcRole": "merchant", "spawnName": "Maud Carrow" }
]
```

**`traitVariants`:**

```jsonc
[
  { "traitId": "trait.core.core_forgiveness.virtue", "forecastDelta": 0.04,
    "factorLine": "Being Forgiving, they know how an old wrong is set down.", "addNudgeIds": ["feud.lay_grudges_down"] },
  { "traitId": "trait.core.core_forgiveness.vice", "forecastDelta": -0.04,
    "factorLine": "Being Vengeful, they feel the insult as if it were their own." }
]
```

**Cards.**
- Specials carry `essenceCost`, `forecastDelta`, `effectLine`, `bandProse` and `imageTag` as tabled in the packet.
- `feud.dull_a_suspicion` carries `opposes: 'aggrieved'`. It may carry `libraryCardId: 'card.stumble.signature.chaos'`.
- `feud.lay_grudges_down` carries `requiredTrait: 'trait.core.core_forgiveness.virtue'`, `essenceCost: 0`, no `sphere`, and may carry `libraryCardId: 'card.trait_card.core'`.
- `feud.loosen_a_tongue` carries **no** `reveals` (F2).
- Each step declares `deal: { count, tags }` as tabled.
- The "Δ" column of the carryover tables is `forecastDelta`.

**Effects.**
- Step 0 `successMetadata.effects`: `{ kind: 'hidden_mark', category: 'concealed_action', severity: 0.4, label: '…', targetAgentId: '$cast:accused', revealFamilies: ['investigation'] }`.
- Step 2 `successMetadata.effects`:
  - `{ kind: 'grant_companion', companionTemplateId: 'companion.guild-scribe', targetAgentId: '$actor' }`
  - `{ kind: 'favor_creation', magnitudeRange: [0.2, 0.35], context: '…', debtorAgentId: '$cast:accused' }`
  - `{ kind: 'reputation_with', targetLocationId: '$here', delta: 0.06 }`
- Step 2 `failureMetadata.effects`: `{ kind: 'reputation_with', targetLocationId: '$here', delta: -0.06 }`.
- Steps 0 and 1 are `failBehavior: 'continue_weakened'`, and step 2 is `'fail_action'`.

**Reactions.**
- The failure pair's `bond_change`s: `{ kind: 'bond_change', withAgentId: '$cast:aggrieved', sentimentDelta: 0.12 }` and `{ kind: 'bond_change', withAgentId: '$cast:accused', sentimentDelta: -0.12 }`.
- Reaction `reputation_with`: `{ targetLocationId: '$here', delta: 0.03 }`.
- `intelligence`: `{ category: 'political_secret', label, detail }` as tabled.
- Base `reactions` carry the success pair. `failure` and `critical_failure` **must override `reactions`** with the failure pair; otherwise they inherit the success pair.

**`aftermathConfig`.** `{ branchOnStep: 0, variants: {}, fallback: { overview: <base>, changes: [], reactions: <success pair>, byOutcome: { five bands } } }`. This is the precedented fallback-only shape.

**Chip declarations** (the `fair-bout` / `cunning-fair` precedents):
- **Reputation**: `kind: 'reputation'`, `category: 'bond'` on success bands and `'scar'` on failure bands. The `stateNoun` is `{ text: 'reputation with {location}', entityId: '$here', visualKind: 'location', tooltipId: 'ui.reputation_with' }`, and `concepts` is `[{ text: 'thinks well of' | 'thinks less of', tooltipId: 'ui.standing' }]`.
- **A favour owed**: `kind: 'shell_state'`, `category: 'bond'`. The `stateNoun` is `{ text: 'a favour owed', tooltipId: 'ui.favour_owed' }`, and `concepts` is `[{ text: '{cast:accused}', entityId: '$cast:accused', visualKind: 'agent' }]`.
- **Companion**: `kind: 'shell_state'`, `category: 'bond'`. The `stateNoun` is `{ text: 'companion', tooltipId: 'ui.companions' }`, and `concepts` is `[{ text: 'house scribe', tooltipId: 'ui.companions' }]`. There is no `$companion` sentinel (#1115).
- Every chip is authored as `causeClause` + `detail`, split on the em dash of the packet's chip lines. The `title` is the implementer's, short and in sheet words.

---

## Encounter Packet

Template id (binding, from the brief): `encounter.town.feud_mediation`

## 0. Mechanical design block (fixed before any prose)

| Row | Decision |
|---|---|
| Crux | Two powerful households of the town are in a feud, and the town has sent for the mortal to end it before the heads' one and only meeting at sundown. |
| Title | **Called to End a Feud** — the objective and why the mortal is here, in five words. |
| Reach | heart (primary, `primaryReachOf`: one Eye step against two Heart). |
| Steps | eye 0.55 "Find who sent it" → heart 0.62 "Win both heads' trust" → heart 0.68 "Make the peace". Mean 0.617, window fit 0.757 (expert). |
| Shape | **Puzzle – Investigation – Resolution** (catalog). The Eye step reveals the clue behind the test; the resolution step uses it, or does without it, through carryover lines keyed on the step before. |
| Tier / rarity / scale | `intrinsicTier: 'shaping'`, `rarityTier: 2`, `scale: 'local'` (brief § binding rows). |
| Settings | `urban`, `rural` — one opening each. |
| Seed Dice | p3 **mystery** (who sent the letter) · opposition **time** (the heads meet once, at sundown, and never again) · disposition n/a · agentRole **the target** (both houses have sent the mortal a purse to take their side) · scale **company** (two households). |
| Hook | plotHookRolled: hook.rebuilding_trust, hook.compassionate_liberation, hook.unlikely_alliance. **plotHookTaken: hook.unlikely_alliance**, blended with hook.rebuilding_trust. Two houses that hurt each other must sign one contract; the house that was insulted is at the table again, willing to hear. compassionate_liberation survives only as an echo (the house scribe who sent the letter leaves the house's service); dropped as the lead because nothing in the scene is imprisoned. |
| Whose problem? | The mortal's. They were sent for by name, both houses are trying to buy them, and the town will judge them by the result (agentRole: the target). |
| Reach = theme? | Step 0 tests Eye and is *about* finding who sent the letter. Steps 1 and 2 test Heart and are *about* trust: winning it from two proud heads, then holding it at one table. |
| Mortal choice? | None. This is a test. `motivations: ['loyalty_ambition', 'revelation_discretion']` — the scene is about loyalty to a peace and about keeping a secret; it draws mortals who lean hard either way. No fork, so no pin. |
| Consequence hand (binding, THR-1145) | `companion` + `secret`. No swap. |
| `companion` | `grant_companion` `companion.guild-scribe` → `$actor`, final step `successMetadata`. The house scribe who sent the letter in error leaves the house's service with the mortal who ended the feud. |
| `secret` | (a) `hidden_mark` on `$cast:accused`, category `concealed_action`, step 0 `successMetadata`: the investigation finds that the insulting letter was the head's own angry draft. Concealed by design, not chipped. (b) `favor_creation`, debtor `$cast:accused`, final step `successMetadata`: the head owes the mortal for a peace that left the letter's author unnamed. |
| Standing (expert failure) | `reputation_with` `$here`, +0.06 on the success side, −0.06 on the failure side. The town sent for the mortal and the town judges. Chip noun `reputation with {location}` anchored on `$here` (the town is what the prose means, so THR-1685 does not bite). No person-anchored reputation chip. |
| Cool failure? | Nobody dies, is jailed or branded. The feud goes on and the town thinks less of its peacemaker. Critical failure: both houses say the mortal was bought. Reputation before money. |
| Payoffs by band | crit: contract signed, thanks before the hall, favour + scribe + town standing. success: same writes. success_at_cost: same writes, the mortal turns down the fee for the work (prose only). failure: town standing falls. crit failure: town standing falls; both heads call the mortal bought. |
| Systems quota | cast (two heads) + rewards (`grant_companion`, `favor_creation`, `hidden_mark` persist) + reputation (`reputation_with`) = 3. |
| Heavy Hand | none. Batch allowance left for other slots. |
| Trait hooks (system target: traits) | Gate: no (no rule gates in this batch). Variant: **Forgiving** (`trait.core.core_forgiveness.virtue`) +0.04, unlocks the trait card; **Vengeful** (`trait.core.core_forgiveness.vice`) −0.04. *(systems F3 — required `factorLine`s: Forgiving "Being Forgiving, they know how an old wrong is set down."; Vengeful "Being Vengeful, they feel the insult as if it were their own."; Forgiving also carries `addNudgeIds: ['feud.lay_grudges_down']`.)* Trait-only card: yes, `feud.lay_grudges_down` on step 2, cost 0. Trait fragment: the trait card's own band fragments. |
| Promises that pay off | "No one will say who did" (the mystery): paid off by step 0's afterimages when found, by every success-band overview (the head admits it in private), and by the companion chip (the scribe sent it). The clock (one meeting at sundown): paid off by step 2 happening at sundown and by the failure overviews. The P3 stake ("{location} will think less of {actor}"): enacted by step 2's `failureMetadata` `reputation_with −0.06`. |
| State classification | Scene-local: the feud, the letter, the mill contract, the purses, the council's/elders' request, the fee. State read: `{cast:*}` bindings, `{location}`, the Forgiving/Vengeful traits. State written: hidden mark, favour, companion, town standing. No agent history asserted. |

## 1. Inspiration Anchors

- **Unlikely Alliance (Event archetype, via the rolled hook).** Supplied the table: two parties who hurt each other must cooperate, and the cooperation is tactical. The mill contract is the tactical thing; forgiveness is optional and lives on the trait card only.
- **Betrayal & Redemption (Ordeal archetype, via hook.rebuilding_trust).** Supplied step 1: the insulted house is willing to hear, but only from a peacemaker it believes is unbought.
- **Anti-patterns avoided:** the helpful passerby (the mortal is the target of both houses' purses), the mystery with no designed payoff (the truth is designed and paid off in every success band), the reputation chip that reads as the wrong party (THR-1685: only the town is chipped).

## 2. Scale Justification

Medium. Three beats is what an investigation-then-resolution shape needs to let the resolution use or do without what was found. The reward weight is an expert's: a companion, a powerful household's favour, and the town's regard, or the loss of it. The encounter is a local story about a peacemaker's name; it does not need a fork.

## 3. Pressure Knot

Last spring an insulting letter from one house broke off a mill contract the two houses shared. The feud has run since. The council (urban) or the elders (rural) have sent for the mortal. The heads have agreed to one meeting, in the hall at sundown, and will not agree to another. Both houses have already sent the mortal a purse to take their side.

## 4. Intervention Fantasy

The god works on the people around the table, never on the mortal's choices: a frightened servant who wants to be rid of what they know, an old morning brought back clear in a steward's mind, a proud head who loses the train of an accusation, a promise that weighs on whoever spoke it. The player watches the best peacemaker in the country do the job, and tilts the room.

## 5. Cast and World Objects

| Object | What it is | Binding |
|---|---|---|
| `{cast:accused}` | Head of the house the letter came from. Swears the house never sent it. Wrote it in anger and ordered it burned. | supportBundle actor, must-persist, reuse `noble`/`elder`, spawn `elder`, spawnName **Osric Venn**, supportRole `feud_accused_head` *(systems F1)* |
| `{cast:aggrieved}` | Head of the house that received the letter. Wants an apology. Says a peacemaker who keeps either purse is bought. | supportBundle actor, must-persist, reuse `merchant`, spawn `merchant`, spawnName **Maud Carrow**, supportRole `feud_aggrieved_head` *(systems F1)* |
| the house scribe | Sent the draft by mistake. Role-voiced, never cast (the minted companion is a new person, told in the fiction as the scribe). | `grant_companion` `companion.guild-scribe` |
| `{location}` | The town. It sent for the mortal and it judges. | `$here`, `reputation_with` |
| the letter, the mill contract, the purses, the hall, the fee | Scene-local. | prose only |

## 6. Beat Structure

1. **Find who sent it** (eye 0.55). The mortal asks through both houses before sundown. Success finds the house scribe who sent the head's angry draft in error.
2. **Win both heads' trust** (heart 0.62). Both houses have sent a purse. The mortal goes between them and must be believed unbought.
3. **Make the peace** (heart 0.68). One table, sundown, half the town at the doors. The mortal ends the feud or the heads walk out.

## 7. Branching Profile

Linear — no branching. Branch count 0. Shape: Puzzle – Investigation – Resolution; carryover lines on steps 1 and 2 carry what the step before found or failed to find.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | New burden / opening |
|---|---|---|---|
| critical_success | Contract signed in one sitting; both heads thank the mortal in front of the hall. | Nothing past the day. | `{cast:accused}` owes a favour; the house scribe travels with the mortal; the town thinks well of them. |
| success | Contract signed. | The day. | Same three. |
| success_at_cost | Contract signed. | The fee for the work, turned down to show no house paid for the peace. | Same three. |
| failure | The feud goes on; the mill stands idle. | The town's trust. | The town thinks less of them. |
| critical_failure | Both heads tell their houses the mortal took the other side. | The town's trust, and the name of an unbought peacemaker. | The town thinks less of them. |

## 10. Sample Opening (urban, as the player meets it: opening + step-0 spine)

{actor} arrives in {location} at the council's request, to end a feud between two of its great houses.

The feud began last spring with an insulting letter from the house of {cast:accused}. It broke off the mill contract the two houses shared. {cast:accused} swears the house never sent it, and no one will say who did.

The heads will meet only once, at sundown in the hall. If the feud outlasts that meeting, {location} will think less of {actor}.

*(79 words urban, 78 rural.)*

## Openings (per class, P1)

- **urban:** `{actor} arrives in {location} at the council's request, to end a feud between two of its great houses.`
- **rural:** `{actor} comes to {location} at the elders' request, to end a feud between its two landowning households.`

## Steps (full prose)

### Step 0 — eye 0.55 · purposeLine "Find who sent it" · failBehavior continue_weakened

**narrativeTemplate:** The feud began last spring with an insulting letter from the house of {cast:accused}. It broke off the mill contract the two houses shared. {cast:accused} swears the house never sent it, and no one will say who did. The heads will meet only once, at sundown in the hall. If the feud outlasts that meeting, {location} will think less of {actor}.

| Afterimage | Text |
|---|---|
| critical_success | They found the draft of the letter in {cast:accused}'s own hand, and the house scribe who sent it in error. |
| success | They found that the house scribe sent the letter in error, copied from a draft that was meant to be burned. |
| success_at_cost | They found the house scribe who sent the letter, and the whole house heard them asking. |
| failure | They asked in both houses until noon and learned only that the letter was real. |
| critical_failure | They named the wrong servant as the sender, and both houses heard of it by noon. |

**successMetadata:** `hidden_mark` { category `concealed_action`, severity 0.4, label "Wrote the letter that began the feud, then swore it was never sent", targetAgentId `$cast:accused`, revealFamilies [`investigation`] }

**deal:** { count 3, tags [`insight`, `social`] }

**Specials:**

1. `feud.loosen_a_tongue` — **Loosen A Tongue** · type Boost (witness) *(systems F2: was Whisper; author with no `reveals`)* · sphere mind · essence 2 · Δ 0.10 · image `generic.rumor`
   - effectLine: Fill frightened witnesses with longing to be rid of what they know, so they tell whoever asks kindly.
   - critical_success: The house scribe came to {actor} unasked and told the whole of it.
   - success: A maid in {cast:accused}'s house told {actor} who had given the letter to the carrier.
   - failure: A groom began to talk, and the steward sent him back to the stables.
2. `feud.wake_old_memory` — **Wake Old Memory** · type Boost (memory) · sphere time · essence 2 · Δ 0.09 · image `generic.memory`
   - effectLine: Bring a past day back clear in the minds of those who were there, so they recall who did what.
   - success: The steward remembered the morning the letter went out, and whose desk it left from.
   - near_miss: The steward remembered the morning clearly, but not until late in the day.
   - failure: Every servant remembered the day the letter came, and none remembered it leaving.

### Step 1 — heart 0.62 · purposeLine "Win both heads' trust" · failBehavior continue_weakened

**narrativeTemplate:** Each house has sent {actor} a purse to take its side. {cast:aggrieved}, head of the other house, says a peacemaker who keeps either purse has been bought. {actor} has until sundown to go between the two houses and win the trust of both heads.

| Afterimage | Text |
|---|---|
| critical_success | They sent both purses back, and both heads trusted them the more for it. |
| success | They sent both purses back, and both heads agreed to hear them out. |
| success_at_cost | Both heads agreed to hear them out, and one still has them followed. |
| failure | One head still believes they were bought, and will say so in the hall. |
| critical_failure | Word went round that they kept a purse, and both heads believe it. |

**carryoverFactorLines** (keyed on step 0):

| Band | Text | Polarity | Δ |
|---|---|---|---|
| critical_success | They know who wrote the letter, and who sent it. | for | +0.06 |
| success | They know the letter was sent in error. | for | +0.04 |
| success_at_cost | The whole house heard them asking questions. | against | −0.02 |
| near_miss | They learned who sent it late in the day. | against | −0.03 |
| failure | They still do not know who sent the letter. | against | −0.05 |
| critical_failure | Both houses heard them name the wrong servant. | against | −0.07 |

**deal:** { count 4, tags [`presence`, `social`] }

**Special:**

3. `feud.dull_a_suspicion` — **Dull A Suspicion** · type Stumble (opposes `aggrieved`) · sphere chaos · essence 2 · Δ 0.10 · image `generic.luck`
   - effectLine: Make doubters lose their train of thought mid-accusation, so their charge comes out weaker than they meant.
   - success: {cast:aggrieved} began the charge of a bought peacemaker and could not finish it.
   - failure: {cast:aggrieved} faltered, then started the charge again louder.

### Step 2 — heart 0.68 · purposeLine "Make the peace" · failBehavior fail_action

**narrativeTemplate:** At sundown the two heads take their seats at one table in the hall, and half of {location} crowds the doors. {cast:aggrieved} wants an apology for the letter. The other head will not apologise for a letter the house swears it never sent. {actor} must end the feud before either head walks out.

| Afterimage | Text |
|---|---|
| critical_success | The heads agreed terms before the candles were lit, and shook hands on them. |
| success | The heads agreed terms and called for a clerk to write them down. |
| success_at_cost | The heads agreed terms, but only after each had called {actor} bought before the whole hall. |
| failure | The heads walked out of the hall, and the feud goes on. |
| critical_failure | The hall broke up in shouting, and both heads left by separate doors. |

**carryoverFactorLines** (keyed on step 1):

| Band | Text | Polarity | Δ |
|---|---|---|---|
| critical_success | Both heads trust them, and said so to their houses. | for | +0.06 |
| success | Both heads have agreed to hear them out. | for | +0.04 |
| success_at_cost | One head still has them followed. | against | −0.02 |
| near_miss | One head agreed to come only at the last hour. | against | −0.03 |
| failure | One head still believes they were bought. | against | −0.05 |
| critical_failure | Both heads believe they kept a purse. | against | −0.07 |

**successMetadata:** `grant_companion` { `companion.guild-scribe`, target `$actor` } · `favor_creation` { magnitudeRange [0.2, 0.35], context "Kept quiet that the head's own angry draft began the feud", debtor `$cast:accused` } · `reputation_with` { `$here`, +0.06 }

**failureMetadata:** `reputation_with` { `$here`, −0.06 }

**deal:** { count 3, tags [`presence`, `social`] }

**Specials:**

4. `feud.seal_the_handshake` — **Seal The Handshake** · type Boost (oath) · sphere order · essence 2 · Δ 0.10 · image `generic.oath`
   - effectLine: Make any promise spoken aloud weigh on its speaker, so taking it back comes hard.
   - critical_success: Both heads said the terms aloud, and neither would be the first to break them.
   - success: {cast:aggrieved} gave a word in front of the hall and would not take it back.
   - failure: {cast:aggrieved} gave a word, and took it back before the ink was dry.
5. `feud.lay_grudges_down` — **Lay Grudges Down** · type Trait card · requiredTrait `trait.core.core_forgiveness.virtue` · essence 0 · Δ 0.08 · image `generic.mercy`
   - effectLine: Wake their forgiving nature, so those around them see an old wrong set aside, and follow.
   - success: {actor} set the letter aside as an old wrong, and asked the heads to do the same.
   - failure: {actor} asked the heads to set the letter aside, and {cast:aggrieved} would not.

## 11. The Hand Per Step (summary)

| Step | Specials (type · sphere) | Deal | Composed size |
|---|---|---|---|
| 0 eye | Boost (witness) · mind *(systems F2)*; Boost (memory) · time | 3 · insight, social | 5 |
| 1 heart | Stumble · chaos (opposes aggrieved) | 4 · presence, social | 5 |
| 2 heart | Boost (oath) · order; Trait card · — (Forgiving only) | 3 · presence, social | 4 (5 for a Forgiving mortal) |

No rider, no Heavy Hand, no card grants content. Every special carries a `failure` fragment. No Δ reaches 0.15. Step 2's authored hand sums 0.18 against difficulty 0.68 (0.86, inside the ceiling).

## 12. Linear continuation

Step 2's spine above: one table, sundown, the town at the doors, and what is asked now. The stake itself was stated once, in the opening's P3.

## 13. Aftermath (the page, per band)

`aftermathConfig`: `branchOnStep: 0`, `variants: {}`, `fallback` carries the base overview, the success-side reactions, and `byOutcome` for five bands.

**Base overview:** The hall empties, and {location} goes home to talk about the two houses.

**critical_success**
- Overview: Both houses sign a new mill contract, and both heads thank {actor} before the whole hall. In private, {cast:accused} admits writing the letter in anger and ordering it burned.
- BOND · reputation with {location} — Ended the feud in one sitting — {location} thinks well of {actor} now.
- BOND · a favour owed — Kept the letter's author a secret — {cast:accused} owes {actor} a favour.
- BOND · companion — Sent the letter by mistake and left service — the house scribe travels with {actor} now.
- Reactions (base pair, below).

**success**
- Overview: The two houses sign a new mill contract before the hall empties. In private, {cast:accused} admits writing the letter in anger and ordering it burned.
- BOND · reputation with {location} — Ended the feud at the table — {location} thinks well of {actor} now.
- BOND · a favour owed — Kept the letter's author a secret — {cast:accused} owes {actor} a favour.
- BOND · companion — Sent the letter by mistake and left service — the house scribe travels with {actor} now.
- Reactions (base pair, below).

**success_at_cost**
- Overview: The houses sign a new mill contract. To show that no house paid for the peace, {actor} turns down any fee for the work. In private, {cast:accused} admits writing the letter in anger and ordering it burned.
- BOND · reputation with {location} — Ended the feud at sundown — {location} thinks well of {actor} now.
- BOND · a favour owed — Kept the letter's author a secret — {cast:accused} owes {actor} a favour.
- BOND · companion — Sent the letter by mistake and left service — the house scribe travels with {actor} now.
- Reactions (base pair, below).

**failure**
- Overview: The mill stands idle between the two houses for another season. {location} sent for {actor} because other peacemakers had already failed.
- SCAR · reputation with {location} — Could not make the peace — {location} thinks less of {actor} now.
- Reactions (failure pair, below).

**critical_failure**
- Overview: Each head tells their own house that {actor} took the other side. A peacemaker both sides call bought has lost the name that got them sent for.
- SCAR · reputation with {location} — Lost the one meeting — {location} thinks less of {actor} now.
- Reactions (failure pair, below).

## 14. Aftermath Reaction Choices

**Base pair (all success bands):**
- **See the contract kept** — intent: The mortal stays where both houses can see the terms kept, and the town marks who stayed. Effect `reputation_with` `$here` +0.03.
- **Write down how the feud began** — intent: The truth about the letter stays with the mortal, written down, however either house tells it later. Effect `intelligence` { category `political_secret`, label "The Letter That Began The Feud", detail "An angry draft by the head of one house, sent in error by the house scribe." }

**Failure pair (failure, critical_failure):**
- **Stay on in town, taking no side** — intent: The mortal stays where both houses can see them, still unbought, and the town marks it. Effect `reputation_with` `$here` +0.03.
- **Side with the house that was insulted** — intent: With the peace lost, the mortal backs the house that received the letter, and the other house will remember it. Effects `bond_change` `$cast:aggrieved` +0.12; `bond_change` `$cast:accused` −0.12.

The two pairs are two stances each: be seen to keep the peace vs. keep the truth (success); stay neutral in public vs. take a side (failure).

## 15. Aftermath Kit Summary

- Visible: town standing up or down; a favour owed by `{cast:accused}`; the house scribe as a companion (`companion.guild-scribe`).
- Concealed: the hidden mark on `{cast:accused}` (the letter was the head's own draft), revealable by `investigation` families.
- The world remembers: who ended the feud, or who failed to.

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `accused` (house head) | lazy-materialize-on-trigger | reuse noble/elder, else spawn elder "Osric Venn" (supportRole `feud_accused_head`; systems F1) | must-persist | favour debtor; hidden-mark bearer; bond target | ready |
| `aggrieved` (house head) | lazy-materialize-on-trigger | reuse merchant, else spawn merchant "Maud Carrow" (supportRole `feud_aggrieved_head`; systems F1) | must-persist | Stumble target; bond target | ready |
| guild scribe companion | minted by `grant_companion` | `companion.guild-scribe` | companion edge | Companions row | ready |
| town standing | `reputation_with` `$here` | engine | edge | Location Profile standing row | ready |

## 17. Self-Audit

| Check | Verdict |
|---|---|
| Envelope: urban + rural, both openings | PASS |
| ≤80 words opening + spine | PASS (79 / 78, recounted in editorial) |
| One stake shape (mystery) in P3, plus the standing stake stated plainly | PASS |
| Hands 4–8 composed, ≤2 specials per step | PASS |
| Every special has a failure fragment; no big-delta card | PASS |
| Six StepOutcomes covered per step | PASS by the base afterimages + fragments + dealt members' `BAND_FRAGMENTS` (confirm with `checkComposedHand`) |
| Trait hooks, four answers | PASS (variant ×2, trait card, fragments on the trait card) |
| Consequence hand wired: companion + secret | PASS |
| Every chip backed by a write on its band | PASS |
| Chip nouns are sheet words | PASS (`reputation with {location}`, `a favour owed`, `companion`) |
| Chip sentences ≤15 words, no four-word run with the overview | PASS (10–15 words) |
| No word shared between a card's name and its effect line | PASS |
| No class scenery in bands (no "council" outside the urban opening) | PASS |
| No invented agent history | PASS |
| No placeless promise (7b) | PASS — "will think less of" is the `reputation_with` write; "Stay a week" removed |
| Systems ≥3 | PASS (cast, rewards, reputation) |
| One named person per beat | PASS (`accused` step 0, `aggrieved` steps 1 and 2) |

## 18. Concept Art Direction

1. *Emotions:* a long grudge between proud people; a peace that is a contract, not a friendship; one secret kept.
2. *Image:* a long table in an empty town hall after dark, two chairs pushed back at opposite ends, a signed contract between them under a single candle, and a folded letter with a broken wax seal set face down beside it. No people.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES · 4b YES (after the editorial fixes) · 5 YES (after the editorial fixes) · 6 YES · 7 YES · 8 YES · 9 YES · 9b YES · 10 YES · 11 YES · 11b YES (after the editorial fixes) · 12 YES · 13 YES · 14 YES
