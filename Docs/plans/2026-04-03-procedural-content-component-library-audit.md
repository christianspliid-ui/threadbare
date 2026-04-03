# Procedural Content Component Library Audit — Eldritch Horror Pattern Pass

**Date:** 2026-04-03  
**Status:** Research / design seed  
**Scope:** Extract reusable component patterns from Eldritch Horror and translate them into The Fantasy World Simulator's graph-native attachment / condition / spell / encounter ecosystem.

---

## What This Document Is

This is **not** a port plan for Eldritch Horror content.  
This is a pattern audit: what reusable effect shapes, trigger models, progress carriers, and risk/reward structures Eldritch Horror uses to generate variety, and whether our current simulator can already express them.

The goal is to build a **core library of reusable content components** that can later power:

- encounters
- traits
- attachments
- spells
- conditions
- items
- artifacts
- bonds
- achievements
- talents
- reputations

---

## Source Set

Primary inspiration source:

- [Eldritch Horror Wiki](https://eldritchhorror.fandom.com/wiki/Eldritch_Horror_Wiki)

Reference rules source used for rules translation:

- [Official Eldritch Horror Reference Guide PDF](https://www.fantasyflightgames.com/ffg_content/eldritch-horror/EH01%20Reference%20Guide.pdf)

Representative wiki pages reviewed in this pass:

- [Assets](https://eldritchhorror.fandom.com/wiki/Assets)
- [.18 Derringer](https://eldritchhorror.fandom.com/wiki/.18_Derringer)
- [.38 Revolver](https://eldritchhorror.fandom.com/wiki/.38_Revolver)
- [.45 Automatic](https://eldritchhorror.fandom.com/wiki/.45_Automatic)
- [Axe](https://eldritchhorror.fandom.com/wiki/Axe)
- [Ancient Tome](https://eldritchhorror.fandom.com/wiki/Ancient_Tome)
- [Bandages](https://eldritchhorror.fandom.com/wiki/Bandages)
- [Bull Whip](https://eldritchhorror.fandom.com/wiki/Bull_Whip)
- [Arcane Tome](https://eldritchhorror.fandom.com/wiki/Arcane_Tome)
- [Agency Quarantine](https://eldritchhorror.fandom.com/wiki/Agency_Quarantine)
- [Cat Burglar](https://eldritchhorror.fandom.com/wiki/Cat_Burglar)
- [Conditions](https://eldritchhorror.fandom.com/wiki/Conditions)
- [Blessed](https://eldritchhorror.fandom.com/wiki/Blessed)
- [Deal](https://eldritchhorror.fandom.com/wiki/Deal)
- [Dark Pact](https://eldritchhorror.fandom.com/wiki/Dark_Pact)
- [Funding](https://eldritchhorror.fandom.com/wiki/Funding)
- [Hypothermia](https://eldritchhorror.fandom.com/wiki/Hypothermia)
- [Item](https://eldritchhorror.fandom.com/wiki/Item)
- [Painkillers](https://eldritchhorror.fandom.com/wiki/Painkillers)
- [Promise of Power](https://eldritchhorror.fandom.com/wiki/Promise_of_Power)
- [Talents](https://eldritchhorror.fandom.com/wiki/Talents)
- [Composed](https://eldritchhorror.fandom.com/wiki/Composed)
- [Martial Prowess](https://eldritchhorror.fandom.com/wiki/Martial_Prowess)
- [Quick Study](https://eldritchhorror.fandom.com/wiki/Quick_Study)
- [Spells](https://eldritchhorror.fandom.com/wiki/Spells)
- [Shriveling](https://eldritchhorror.fandom.com/wiki/Shriveling)
- [Voice of Ra](https://eldritchhorror.fandom.com/wiki/Voice_of_Ra)
- [Alter Fate](https://eldritchhorror.fandom.com/wiki/Alter_Fate)
- [Artifacts](https://eldritchhorror.fandom.com/wiki/Artifacts)
- [Courier Run](https://eldritchhorror.fandom.com/wiki/Courier_Run)
- [Funding the Cause](https://eldritchhorror.fandom.com/wiki/Funding_the_Cause)
- [Tarot](https://eldritchhorror.fandom.com/wiki/Tarot)
- [Ally](https://eldritchhorror.fandom.com/wiki/Ally)
- [News Report](https://eldritchhorror.fandom.com/wiki/News_Report)
- [Police Assistance](https://eldritchhorror.fandom.com/wiki/Police_Assistance)
- [Service](https://eldritchhorror.fandom.com/wiki/Service)
- [Task](https://eldritchhorror.fandom.com/wiki/Task)
- [Training Regimen](https://eldritchhorror.fandom.com/wiki/Training_Regimen)

---

## Translation Rules — Eldritch Horror → FWS

Eldritch Horror and FWS do **not** share a resolution engine, so pattern translation matters more than literal wording.

### 1. Skill bonus → reach modifier or test shaper

EH uses dice pools built from a skill value.  
FWS uses reach-domain capability and effect modifiers inside a d100/sigmoid pipeline.

Therefore:

- flat EH skill bonuses usually translate to `conditional` or `passive` reach modifiers
- EH rerolls / extra dice / pip boosts usually translate to a **test-shaper** family, not raw numeric bonuses

### 2. Encounter type gating maps cleanly

EH's "during a Combat Encounter" ports naturally into our existing predicate system:

- `in_combat`
- `in_social`
- `in_exploration`
- `in_mystical`

This is already compatible with our effect resolver.

### 3. Double-sided cards are not just flavor

EH repeatedly uses:

- front-side passive or trigger
- flip on failure / use / reckoning / progress threshold
- back-side variant table with authored outcomes

This is not equivalent to a plain buff. It is a **stateful content machine**.

### 4. Hidden variance is load-bearing

EH creates surprise and combinatorics through:

- random back variants
- delayed reveal
- flip-only when triggered
- small authored tables instead of huge general systems

FWS currently has little support for this kind of hidden authored state.

### 5. One-shot services and progress tasks matter

Not every content component should be a permanent attachment. EH gets richness from:

- immediate services
- tasks that accumulate progress or attach to a target space
- talents that spike and then destabilize
- bargains that mature into consequences later

This strongly suggests we need more than "static modifier plus cooldown."

---

## Current FWS Capability Snapshot

Relevant repo surfaces:

- `src/types/effects.ts`
- `src/engine/effectResolver.ts`
- `src/engine/effectTick.ts`
- `src/engine/effectExecutors.ts`
- `src/engine/spellActivation.ts`
- `Docs/plans/2026-03-31-generic-effect-system-design.md`

### We already have good coverage for:

- passive bonuses and penalties
- conditional bonuses by encounter context
- duration, cooldown, stacking, decay
- trait grants
- aura effects
- teleport / spawn / dispel / transfer / compel
- rule overrides and scoped world effects
- activated abilities with costs and backlash

### We are noticeably thin or missing on:

- prevention / interception of incoming harm or loss
- explicit healing / restoration / cleansing effects
- immediate resource grants or conversions
- direct damage effects for services / offensive items
- action-specific triggers such as "on rest", "on acquire assets", "on trade"
- progress-track tasks with attached state and payout logic
- hidden flip tables / delayed reveal variants
- choice bundles ("choose one of these authored outcomes")
- test-shaping as a first-class family distinct from flat numeric modifiers

### Important architectural conclusion

The current 29-effect library is a **strong foundation**, but it is not yet a full content combinatorics library.

The next leap is not "more isolated effects."  
It is:

1. a **test-shaper family**
2. a **flip / reveal state model**
3. a **task-progress model**
4. a **recovery / prevention model**

---

## Initial Audit — Representative Patterns

The rows below are the real point of this document: what reusable patterns we should extract.

| EH source | EH pattern | FWS translation | Current support | Recommendation |
|---|---|---|---|---|
| `.18 Derringer` | Improve a single die by +1 during combat | Precision nudge on one combat resolution roll | No direct equivalent | Add `test_shaper` family with mode `pip_boost_one` or a generalized "near-miss uplift" |
| `.38 Revolver` | Flat combat strength bonus | `conditional { condition: 'in_combat', reach: 'iron' }` | Direct | Use existing `conditional` effect |
| `.45 Automatic` | Roll 1 extra die during combat | Increase test opportunity, not flat power | Approximate only | Add `test_shaper.extra_roll` |
| `Bull Whip` | Small combat bonus + reroll 1 die | Hybrid steady bonus plus tactical correction | Partial | Keep `conditional` for bonus, add `test_shaper.reroll_one` |
| `Axe` | Big combat bonus + pay sanity to reroll any dice | Costed spike effect during a specific test | Partial | Add costed test-shaper activation with `reroll_any` |
| `Bandages` | Discard to prevent up to 2 damage to ally on same space | Supportive interrupt that cancels incoming loss | Missing | Add `prevent_loss` / `intercept_harm` reaction family |
| `Arcane Tome` | Passive spellcasting bonus + special rest hook that can grant a spell | Domain bonus plus action-context trigger | Partial | Add `action_trigger` predicates like `on_rest`, `on_spell_cast`, `after_rest_success` |
| `Agency Quarantine` | On-gain immediate targeted area effect, then discard | One-shot service resolved immediately on acquisition | Partial | Add `on_gain` trigger plus direct damage / hostile suppression primitives |
| `Cat Burglar` | Ally action with test, reward on success, self-loss on bad roll | Attached actor/supporter with risky activated action | Partial | Reuse retainers/attachments, add authored success-table outcomes |
| `Blessed` | Global success-threshold rule change + decay/check + flip rewards | Strong temporary stance with eventual payout or collapse | Thin | Add `flip_table` support; `modify_rules` can cover threshold shift |
| `Funding` | Condition that can cancel another condition, later flips into reward event | Protective deal that matures into discrete back-side outcomes | Thin | Add delayed reveal condition / agreement templates with authored variant tables |
| `Dark Pact` | Hidden doom deal that triggers later into catastrophic authored outcomes | Agreement/curse with delayed trigger and reveal | Thin | Add `secret_obligation` / `reveal_on_trigger` model |
| `Composed` | Reroll engine while stable; failure flips into hard choice | Talent with front-side passive and back-side forked consequence | Missing | Add `flip_table` plus `choice_set` primitives |
| `Martial Prowess` | Opt-in spike buff that flips into consequence table keyed by performance | Risk-for-power talent | Missing | Add `escalation talent` shell around test-shapers plus reveal outcomes |
| `Quick Study` | Recursive talent acquisition with upkeep cost / discard fork | Meta-content amplifier with self-balancing downside | Missing | Add `gain_filtered_attachment`, `choice_set`, and talent-specific upkeep hooks |
| `Shriveling` | Spell front action, then variant back table keyed by test result band | Spell payload + authored result bands + self-risk | Partial | Current spell system handles costs/backlash, but not multi-band flip outcomes |
| `Voice of Ra` | Persistent spell front with paid extra action; back variants trade life/sanity/focus | Sustained stance spell with optional exchanges | Partial | Needs `extra_action` support plus better resource exchange effects |
| `Alter Fate` | Persistent spell that changes trade rules; back variants cleanse / improve / recover | Rule override plus reveal-table follow-up | Partial | `modify_rules` exists; add reveal table and authored band resolution |
| `Courier Run` | Task tied to a target city, flips when you complete a location-specific objective | Travel-linked progress carrier with payout table | Missing | Add `task_progress` attachments with bound targets and completion triggers |
| `Funding the Cause` | Excess action-test success becomes tokens on a task, later cashes out into scaled rewards | Progress accumulator with threshold-sensitive reward drafting | Missing | Add `progress_token_track` and `reward_by_progress` |
| `Tarot` | Small situational front effect, often with one elegant modifier | Lightweight, high-variety micro-attachments | Partial | Great fit for a curated `test_shaper + rule_override + once_per_round` micro-library |
| `Ally` page pattern | Smaller always-on support than items, often with actions | Best modeled as retainer/support attachment hybrid | Partial | Keep as attachment-or-retainer family with support verbs |
| `Service` page pattern | Immediate benefit, not inventory | One-shot service cards | Missing as explicit family | Add `service` acquisition templates resolved on gain, not stored |
| `Artifacts` page pattern | Big upside plus risk/cost; often narrative-changing | High-tier activated effects plus drawbacks | Strong partial | Existing artifact/spell framework is good; expand result-band and reveal support |

---

## Detailed Read On The User's Example — `.18 Derringer`

EH effect pattern:

- scoped to combat
- scoped to Strength tests
- does not add a flat stat
- does not add a reroll
- instead improves a single die's face result

### Does it already exist in FWS?

Not really.

We have:

- `conditional` reach bonuses
- `outcome_shift`
- `reroll`
- general modifiers

But `.18 Derringer` is not "be better at Iron all combat long."  
It is "make one result slightly better at the moment of resolution."

### Best FWS translation

The closest healthy port is **not** a raw Iron bonus.

Best translation: a reusable **test-shaper** primitive that nudges one resolution roll upward in a limited, tactical way.

In FWS terms this could become one of:

- `test_shaper: pip_boost_one`
- `test_shaper: near_miss_to_success`
- `test_shaper: +resolution_margin_once`

### Why not just use a flat conditional Iron bonus?

Because that collapses multiple distinct EH patterns into one bland pattern:

- flat bonus
- extra die
- reroll
- pip boost

All four create different texture.

If we flatten them all into `conditional +iron`, we lose one of the main reasons EH assets feel different from each other.

### Recommendation

Keep `.18 Derringer` in the library as a distinct pattern family entry:

`combat_precision_nudge`

This should be a reusable building block for:

- daggers
- sidearms
- lucky charms
- duelist talents
- reputation-based "steady hands" traits
- bonds like "trusted spotter"

---

## Saturated Pattern Sweep — What Repeats Across EH Content

The important result of the wider sweep is that Eldritch Horror does **not** get its variety from hundreds of wholly unique mechanics. It gets it from a manageable set of repeating shapes delivered through different card shells.

### Encounter grammar

From the research/location/combat encounter structure and the asset/task pages, the repeated encounter-side patterns are:

- a small authored prompt with **one test and two outcomes**
- multiple possible tests chasing the **same narrative goal**
- place-specific reward attractors such as clues, travel shortcuts, artifacts, spells, conditions, or task progress
- failure that usually scars, delays, taxes, or redirects rather than simply ending content
- optional resource spends or second checks nested inside a success branch
- location-bound objectives that later pay out through a task, clue, gate close, or condition change

For FWS this means our encounter generator wants more than "difficulty + reward tier." It wants reusable authored outcome shapes:

- `test -> reward / scar`
- `test -> choose one reward`
- `test -> partial success with cost`
- `test -> start or advance a bound task`
- `test -> reveal a hidden burden or boon`

### Asset grammar

Across [Assets](https://eldritchhorror.fandom.com/wiki/Assets), [Item](https://eldritchhorror.fandom.com/wiki/Item), [Ally](https://eldritchhorror.fandom.com/wiki/Ally), [Service](https://eldritchhorror.fandom.com/wiki/Service), and [Task](https://eldritchhorror.fandom.com/wiki/Task), the recurring shells are:

- **Items**: larger contextual bonuses, action payloads, discard spikes, or specific anti-condition / anti-monster utilities
- **Trinkets**: smaller or stranger utilities, especially rerolls, nudges, and indirect stacking
- **Allies**: modest always-on support plus rerolls or a narrow action proxy
- **Services**: immediate on-gain payloads, then discard
- **Tasks**: cheap delayed-value carriers that do nothing until a trigger, threshold, or destination is met

That shell split is valuable for us. It suggests that "effect primitive" and "content delivery shell" are separate design concerns.

### Spell grammar

Across [Spells](https://eldritchhorror.fandom.com/wiki/Spells), [Shriveling](https://eldritchhorror.fandom.com/wiki/Shriveling), [Voice of Ra](https://eldritchhorror.fandom.com/wiki/Voice_of_Ra), [Alter Fate](https://eldritchhorror.fandom.com/wiki/Alter_Fate), and related tome assets:

- spells often have a **front invocation** plus a **back outcome table**
- there are clear cadence shells: persistent aura/stance, active invocation, and triggered payoff
- spell power is commonly gated by a test, a resource payment, or both
- failure rarely means "nothing happens"; it often means a weaker outcome, backlash, or a flip
- some spells are really rule stances, not projectiles

This maps cleanly to FWS if we treat spells as:

- a delivery shell around normal effects
- plus a `result_band` table
- plus a `flip_table` or backlash path

### Condition grammar

Across [Conditions](https://eldritchhorror.fandom.com/wiki/Conditions), [Deal](https://eldritchhorror.fandom.com/wiki/Deal), [Blessed](https://eldritchhorror.fandom.com/wiki/Blessed), [Dark Pact](https://eldritchhorror.fandom.com/wiki/Dark_Pact), and [Hypothermia](https://eldritchhorror.fandom.com/wiki/Hypothermia):

- conditions are **state machines**, not merely debuffs
- each trait family has a different **clearance protocol**: rest, travel, action, reckoning survival, encounter completion
- many use **duplicate gain -> flip instead** escalation rather than duplicate stacking
- positive conditions are often temporary stances with reveal risk
- negative conditions frequently mix ongoing penalty, removal gate, and flip consequence

This is especially important for FWS because our current conditions / burdens can become much richer if they are treated as authored lifecycle shells.

### Talent grammar

From [Talents](https://eldritchhorror.fandom.com/wiki/Talents), [Composed](https://eldritchhorror.fandom.com/wiki/Composed), [Martial Prowess](https://eldritchhorror.fandom.com/wiki/Martial_Prowess), and [Quick Study](https://eldritchhorror.fandom.com/wiki/Quick_Study):

- talents are usually **unstable boons**
- they grant a front-side tactical edge
- invoking them often flips into a consequence table, upkeep fork, or self-balancing drawback
- they are closer to "combat stance" or "mental posture" than to passive skill nodes

For FWS, this strongly argues that talents should not mostly be static trait grants. They should be authored stances and risk engines.

### Artifact / unique-asset grammar

Across [Artifacts](https://eldritchhorror.fandom.com/wiki/Artifacts), [Courier Run](https://eldritchhorror.fandom.com/wiki/Courier_Run), [Funding the Cause](https://eldritchhorror.fandom.com/wiki/Funding_the_Cause), [Tarot](https://eldritchhorror.fandom.com/wiki/Tarot), and tome-style artifacts:

- artifacts usually deliver **big upside plus real risk or upkeep**
- tarot-style pieces are **micro modifiers** that gain value through being numerous and elegant
- unique tasks are often **progress carriers with location or objective binding**
- special allies and relics frequently act like **named support engines**, not simple stat sticks

This suggests that our high-tier content wants both macro pieces and lots of tiny elegant pieces.

---

## Pattern Families — Four Macro Clusters

The patterns sort naturally into four large families.

### 1. Resolution Shaping

These modify how a specific test or encounter step resolves.

- flat context bonus
- extra roll / extra chance
- reroll one / reroll any
- improve one result
- auto-succeed narrow case
- outcome band shift
- prevent incoming loss after the roll

### 2. Stateful Lifecycle Content

These are the shells that make content feel alive over time.

- action-trigger hooks
- reveal / flip tables
- duplicate-gain escalation
- clearance protocols
- unstable boon / bargain / curse / stance behaviors

### 3. Progress and Economy

These create delayed value and long arcs.

- resource gain / spend / convert
- grant drafted content
- one-shot services
- task carriers with bound targets
- reward-by-progress scaling

### 4. Delivery Shells

These determine how a primitive enters play and how the player experiences it.

- item / trinket
- ally / support retainer
- service
- task
- condition
- talent
- spell
- artifact
- encounter reward / encounter complication

This distinction matters for implementation. We do **not** need a brand-new effect primitive for every shell. We need a small primitive library and several reusable shells that package those primitives differently.

---

## Component Family Map

| Cluster | Family | EH evidence | Current FWS support | Recommendation |
|---|---|---|---|---|
| Resolution shaping | `context_modifier` | `.38 Revolver`, `Fine Clothes`, many standard allies/items | Strong via `passive`, `conditional`, `aura`, `tradeoff` | Keep using existing primitives |
| Resolution shaping | `test_shaper` | `.18 Derringer`, `.45 Automatic`, `Bull Whip`, `Painkillers`, `Promise of Power` | Partial via `reroll`, `auto_succeed`, `outcome_shift` but too narrow and not bundled as a family | Promote to first-class family with modes |
| Resolution shaping | `prevent_loss` | `Bandages`, `Bodyguard`, protective boons | Missing | Add intercept / rescue primitive |
| Resolution shaping | `result_band` | `Shriveling`, many spells/talents flip on quality band | Partial via outcome systems, but not attachment-authored | Add banded outcome tables reusable by spells, tasks, talents |
| Stateful lifecycle | `action_trigger` | `Arcane Tome`, rest/travel/removal hooks, services that fire on gain | Thin; current predicates are mostly encounter-context only | Add richer lifecycle hooks |
| Stateful lifecycle | `flip_table` | `Blessed`, `Dark Pact`, `Funding`, `Composed`, most talents/spells | Only weakly approximated by `transform` | Add hidden reveal tables with trigger + variant semantics |
| Stateful lifecycle | `clearance_gate` | Illness/Injury/Madness/Pursuit/Restriction families | Thin | Add authored removal protocols: rest, travel, spend, win-encounter, survive-reckoning |
| Stateful lifecycle | `duplicate_gain_behavior` | `Hypothermia`, `Blessed`, `Cursed` flip instead of stacking | Missing | Add duplicate policy per shell: stack, refresh, flip, worsen, ignore |
| Progress/economy | `resource_delta` | health/sanity/resource exchange, `Voice of Ra`, service payouts | Partial via costs/backlash and ad hoc systems | Add direct gain/lose/convert primitive over FWS resources |
| Progress/economy | `content_grant` | `Training Regimen`, `Ancient Tome`, task/spell/talent gainers | Partial via `trait_grant` only | Add grant/draft/gain-filtered-content primitive |
| Progress/economy | `service_payload` | `Agency Quarantine`, `Police Assistance`, `News Report`, `Training Regimen` | Missing as explicit shell | Add immediate-on-gain service template type |
| Progress/economy | `task_progress` | `Courier Run`, `Funding the Cause`, task assets generally | Missing | Add bound progress carriers and payout scaling |
| Delivery shell | `support_retainer` | Ally assets, named helpers, special assistants | Partial via attachments / retainers | Add a support shell with passive + action + rescue slots |
| Delivery shell | `unstable_condition` / `unstable_talent` / `unstable_spell` | Deal/Boon/Talent families and many spells | Missing as reusable shells | Add shell templates that wrap `flip_table`, `clearance_gate`, and `result_band` |
| Delivery shell | `micro_attachment` | Tarot, tiny trinkets, elegant one-line effects | Partial | Author as a curated library once primitives exist |
| Rules / balance | `test_shaper_limit_rule` | EH restriction on combining item boosts / shapers | Missing | Add explicit balance rule for one external shaper per resolution step |

---

## Recommended New Core Primitives

These are the additions that look most leverage-heavy for FWS.

### 1. `test_shaper`

This should be a **family**, not a dozen unrelated effects.

Suggested modes:

- `flat_bonus`
- `extra_roll`
- `reroll_one`
- `reroll_any`
- `pip_boost_one`
- `near_miss_to_success`
- `outcome_step_shift`
- `minimum_result_floor`

Why this matters:

- items
- talents
- conditions
- reputations
- bonds
- artifacts

can all use the same family while still feeling mechanically different.

### 2. `prevent_loss`

For effects like Bandages, guardian allies, blessings, wards, shields, rescue bonds.

Suggested parameters:

- `channel`: `health | sanity | quintessence | condition | doom | progress | all`
- `amount`
- `target`: `self | ally_same_hex | ally_radius | bond_partner`
- `timing`: `before_apply | after_roll_before_apply`
- `consumeOnUse`

### 3. `resource_delta`

We need a first-class way to:

- recover
- lose
- convert
- spend for effect
- gain delayed charges or progress

across our own resource vocabulary, not EH's.

Suggested directions:

- quintessence / doom / stress
- essence / influence / faction reputation
- attachment charges / progress tokens

### 4. `action_trigger`

Our current predicates are encounter-context heavy.  
We also need authored hooks like:

- `on_rest`
- `on_travel`
- `on_trade`
- `on_acquire`
- `on_spell_cast`
- `on_encounter_complete`
- `on_gain`
- `on_flip`
- `on_duplicate_gain`

This is how tomes, services, bargains, and lifestyle items become interesting.

### 5. `flip_table`

This is the biggest missing piece.

We need a generic way to say:

- front state is active
- when trigger X happens, reveal one of N authored backs
- resolve effect band or choice set
- optionally reset, persist, or discard

This one primitive unlocks:

- talents
- curses
- blessings
- unstable spells
- omen bargains
- achievements with reveal moments

### 6. `task_progress`

For content like:

- courier runs
- pilgrimages
- rival hunts
- artifact reconstruction
- reputation commissions
- oath fulfillment

Suggested fields:

- bound target
- progress source
- progress amount
- completion trigger
- payout table
- failure / expiry condition

### 7. `choice_set`

Many EH backs resolve as:

- choose one downside
- choose one reward
- discard this or pay a cost

This will matter a lot in FWS because choice is a strong story differentiator even when the base mechanics are simple.

### 8. `content_grant`

This is separate from `trait_grant`.

We need a first-class way to:

- gain a spell
- gain a task
- gain a talent
- draft one of several themed attachments
- gain from a filtered pool

This is how tomes, training packages, achievements, and revelation effects turn into future content rather than immediate numbers.

---

## Delivery Shells We Should Add

These are not effect primitives. They are content wrappers that make the same primitives feel different.

### 1. `service`

Immediate benefit on gain, then discard.

Needed for:

- emergency aid
- intel drops
- travel tickets
- training packages
- monster suppression calls

### 2. `task_carrier`

Persistent stateful content with:

- bound target or target set
- progress source
- completion effect
- expiry or corruption path

### 3. `unstable_condition`

A condition shell with:

- ongoing front state
- clearance gate
- flip trigger
- revealed consequence table

### 4. `unstable_talent`

A boon shell with:

- opt-in tactical edge
- invocation or upkeep trigger
- back-side cost / choice / downgrade

### 5. `unstable_spell`

A spell shell with:

- invocation cadence
- result band table
- optional sustain
- backlash or reveal path

### 6. `support_retainer`

For ally-like content with:

- modest passive
- one action or reaction
- optional rescue / assist behavior
- room for bond or faction reskinning

### 7. `micro_attachment`

Very small one-line modifiers for:

- tarot-like cards
- reputational tags
- bond perks
- achievement boons

These are a force multiplier once `test_shaper`, `action_trigger`, and `modify_rules` are mature.

---

## What This Suggests For FWS Content Families

### Encounters

Need more authored hooks for:

- task progress
- bargain offers
- reveal-on-failure
- choice bundles
- partial success payoffs
- place-specific reward attractors

### Traits / Reputations / Talents

Should lean less on static bonuses and more on:

- stance changes
- triggered upsides with costs
- reveal consequences
- limited-use rescue or spike effects
- duplicate-gain escalation

### Attachments / Items / Artifacts

Should use a layered library:

- micro: flat bonus, once-per-step nudge, reroll, rescue
- mid: action trigger, resource conversion, progress acceleration, content grants
- high: flip states, rule overrides, cascade / structure / faction consequences

### Spells

Should become a combination of:

- invocation shell
- result-band payload
- optional sustain
- backlash / flip path

not just "cast spell, apply static effect."

### Conditions

Need explicit families such as:

- wounds / afflictions with clearance gates
- bargains / debts / promises
- unstable boons
- travel or movement restrictions
- pursuit / harassment tags

### Bonds

Bonds should not just be relation numbers.  
They can become conditional support components:

- intercept harm
- assist rerolls
- unlock joint actions
- pay costs for each other
- create failure cascades if strained

### Reputations

Reputations can use micro-shells and unstable boons:

- situational stance modifiers
- city / faction access changes
- one-shot favors
- escalating grudges or obligations

### Achievements

Achievements likely want the `task_progress + reveal payout` pattern more than the static-trait pattern.

Good achievement shapes:

- complete N threshold -> reveal boon
- finish before doom threshold -> stronger boon
- fail / betray / break oath -> scar or reputation inversion

---

## How To Go Forward

The cleanest implementation path is to separate work into three layers.

### Layer A — Extend the primitive vocabulary

Add:

- `test_shaper`
- `prevent_loss`
- `resource_delta`
- `choice_set`
- `action_trigger`
- `content_grant`

This is the minimum needed to stop flattening everything into static modifiers.

### Layer B — Add authored stateful shells

Add:

- `flip_table`
- `clearance_gate`
- duplicate-gain policy
- `task_progress`
- `service` shell
- `support_retainer` shell

This is where most of the richness actually comes from.

### Layer C — Add balance rules and selectors

Add:

- one external `test_shaper` limit per resolution step
- richer target selectors such as nearest-valid-target or bonded-partner
- progress traces
- flip/reveal traces
- clearance / removal traces

This keeps the richer content understandable and tunable.

---

## Suggested Implementation Phases

### Phase 1 — Finish the effect vocabulary for authored content

Add:

- `test_shaper`
- `prevent_loss`
- `resource_delta`
- `choice_set`
- `action_trigger`
- `content_grant`

### Phase 2 — Add hidden authored state and clearance rules

Add:

- `flip_table`
- reveal triggers
- variant selection rules
- reset / discard / persist semantics
- duplicate-gain behavior
- clearance gates

### Phase 3 — Add progress carriers and service shells

Add:

- `task_progress`
- bound target/location/task state
- reward by progress threshold
- immediate-on-gain service templates
- support retainer shell

### Phase 4 — Author a first internal library

Build starter packs for:

- combat items
- rescue items
- talent stances
- bargains / pacts
- pilgrimages / courier tasks
- unstable spells
- bond assists
- reputation favors and grudges
- achievement tracks

### Phase 5 — Add content governance rules

Before large-scale authoring, define:

- which shells each content family may use
- maximum shaper stacking rules
- default trace payloads
- default clearance / expiry behaviors
- balance ranges for micro, mid, and high-tier content

---

## NFP Compliance Summary

| Priority | Verdict | Notes |
|---|---|---|
| Tunability | PASS | Proposed families are parameterized; no hardcoded one-off item logic required |
| Inspectability | PASS | Flip tables, task progress, services, and test-shapers should all emit dedicated traces |
| Determinism | PASS | Variant selection, reveal timing, and progress payout can remain seeded and table-driven |
| Fail-soft | PASS with note | Hidden-state content must degrade safely if a variant table or target binding is missing |
| Narrative over mechanical perfection | PASS | The whole point of this library is richer authored texture, surprise, and longer arcs |
| Additive over destructive | PASS | This extends the existing effect system and attachment ecosystem rather than replacing them |
| Performance budget | PASS with note | Task/progress carriers and reveal tables should stay lightweight, attachment-scoped, and traced |

---

## Bottom Line

The current FWS effect system is already strong enough to support a **first generation** of richer content, but the full Eldritch Horror sweep shows that the missing value is concentrated in a few reusable families:

1. **resolution shaping**
2. **prevention / rescue**
3. **hidden flip-state content**
4. **clearance / duplicate-gain condition logic**
5. **task and progress carriers**
6. **immediate services and support retainers**

If we add those as reusable primitives and shells instead of one-off content hacks, we will get far better combinatorics across encounters, items, talents, conditions, spells, bonds, reputations, and achievements.
