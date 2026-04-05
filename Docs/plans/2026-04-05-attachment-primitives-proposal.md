# Attachment Primitives Proposal

## Context

Almost every attachment in the game is currently a flat `+X to reach domain` modifier (via `reachBonus` or `domainContributions`). Of ~104 reward items, 98 do nothing but nudge a number. The Generic Effect System defines 29 effect types with engine executors — but only 4 items in the entire catalog use `effects[]`. We need a vocabulary of **buildable, composable primitives** that content creators can stamp onto attachments to make them mechanically distinct.

This document proposes that vocabulary: what each primitive does, where it hooks into the engine, and example items that use it.

## Current state (what we have)

**The only primitive with real content coverage:**
- `domainContributions` / `reachBonus` — flat +/- to a reach domain score

**Primitives with engine code but almost zero content:**
- `conditional` — bonus only when predicate is true (2 instances)
- `test_shaper` — modify roll outcome after resolution (2 instances)
- `prevent_loss` — rescue mechanic on failure (1 instance)
- `trait_grant` — grants a named trait while held (1 use: `grantsTraitWhileHeld`)
- `consumable_charge` — limited uses (0 instances)
- `stacking` — accumulates per trigger (0 instances)
- `cooldown` — cycles active/dormant (0 instances)
- `decay` — weakens over time (0 instances)
- `aura` — affects nearby agents (0 instances)
- `reactive` — fires on event (0 instances)
- `transform` — replaces self on trigger (0 instances)
- `tradeoff` — multi-reach cost/benefit (0 instances)

**Primitives designed in types but with no engine code:**
- `teleport`, `reveal`, `spawn`, `dispel`, `alter_terrain`, `compel`, `modify_rules`, etc. (Tier 2/3 — all have executor stubs but no orchestrator wiring)

---

## Proposed Primitive Vocabulary

Organized by **what they do to gameplay**, not by implementation tier. Each primitive listed with: mechanical description, engine hook point, and 2-3 example items.

### Tier A — Resolution Shapers (change HOW checks resolve)

These are the highest-impact primitives because they change the feel of every encounter.

**A1. Conditional Modifier** (exists, needs content)
- **What:** Bonus/penalty that activates only when a predicate is true.
- **Hook:** `effectResolver.ts` — already evaluates 22 predicates.
- **Examples:**
  - *Nightwalker's Cloak* — +0.08 Shadow when `in_wilderness`
  - *Berserker's Torc* — +0.12 Iron when `health_low`, -0.05 Heart always
  - *Scholar's Lens* — +0.10 Eye when `in_exploration`, inert in combat

**A2. Test Shaper** (exists, needs content)
- **What:** After a roll resolves, shift the outcome band. `outcome_shift: +1` turns failure into partial success, `reroll` gives a second chance, `swap_reach` lets you substitute one domain for another.
- **Hook:** `resolutionService.ts` — `collectTestShapers()` already feeds into resolution.
- **Examples:**
  - *Cat's Eye Gem* — reroll on first failure per encounter (consumable_charge: 1)
  - *Warrior-Poet's Journal* — swap Heart for Iron in social encounters
  - *Hero's Cloak* — outcome_shift +1 on near-misses (cooldown: 5 ticks)

**A3. Threshold Modifier** (from research doc — blessings/curses)
- **What:** Expands or restricts the critical success / critical failure bands. Not the probability of success, but the probability of *exceptional* success or *catastrophic* failure.
- **Hook:** New — feeds into the crit calculation in `resolutionService.ts` (doubles-based crits).
- **Examples:**
  - *Blessing of the Star-Touched* — critical success on doubles AND triples (wider crit band)
  - *Curse of the Hollow King* — critical failure range doubled
  - *Fortune's Coin* — no critical failures, but no critical successes either (flattens extremes)

**A4. Difficulty Reduction** (new)
- **What:** Flat modifier to the encounter step's difficulty tier, not to the agent's capability. Effectively makes hard things easier rather than making the agent better.
- **Hook:** New — modifies `stepDifficulty` before sigmoid calculation in `computeCapability()`.
- **Examples:**
  - *Lockpick Set* — difficulty -1 for Shadow steps tagged `#lock` or `#trap`
  - *Ancient Map Fragment* — difficulty -2 for exploration encounters in ruins
  - *Battle Standard* — difficulty -1 for all Iron steps when leading 3+ allies

### Tier B — Lifecycle Primitives (change WHEN and HOW LONG effects last)

These make items feel alive — they change, break, grow, and decay.

**B1. Consumable Charges** (exists, needs content)
- **What:** Item has N charges. Each use (or each trigger) consumes one. At 0, item is destroyed or becomes inert.
- **Hook:** `effectTick.ts` — charge tracking exists.
- **Examples:**
  - *Healing Salve (3 charges)* — each use: +0.15 Flesh for one encounter, then consume charge
  - *Scroll of Warding* — 1 charge: auto-succeed one Veil check, then crumbles
  - *Poisoned Blade* — 3 charges of +0.05 Iron + inflict "Poisoned" condition on critical success

**B2. Cooldown** (exists, needs content)
- **What:** Effect cycles between active (N ticks) and dormant (M ticks). Powerful but intermittent.
- **Hook:** `effectTick.ts` — cooldown state machine exists.
- **Examples:**
  - *Moonstone Amulet* — +0.10 Veil for 3 ticks, then dormant 5 ticks
  - *War Drum* — +0.08 Iron to all allies on hex for 2 ticks, dormant 8 ticks
  - *Seer's Third Eye* — reveal encounters on adjacent hexes for 1 tick, dormant 10 ticks

**B3. Stacking** (exists, needs content)
- **What:** Effect accumulates stacks on trigger events (combat success, per-tick, etc.), up to a cap. Each stack increases the modifier.
- **Hook:** `effectTick.ts` — stack accumulation and cap logic exists.
- **Examples:**
  - *Bloodhound's Instinct* — +1 stack (up to 5) of Eye per exploration success. Decays 1/tick when idle.
  - *Battle-Hardened Shield* — +1 stack of Iron per combat encounter survived (max 3, permanent while held)
  - *Merchant's Ledger* — +1 stack of Gold per trade route visited (max 4)

**B4. Decay** (exists, needs content)
- **What:** Modifier starts strong and weakens each tick, eventually becoming inert or destroying itself.
- **Hook:** `effectTick.ts` — decay curve logic exists.
- **Examples:**
  - *Enchanted Whetstone* — starts at +0.12 Iron, decays by 0.01/tick to minimum +0.03
  - *Borrowed Strength (condition)* — starts at +0.15 Flesh, decays 0.03/tick, self-destructs at 0
  - *Fading Glamour (bestowed power)* — starts at +0.10 Heart, decays unless renewed by ritual

**B5. Transform** (designed, not built)
- **What:** On a trigger event (probability-gated), the attachment replaces itself with a different template. Sword becomes legendary, wound becomes scar, blessing becomes curse.
- **Hook:** New — needs executor in tick pipeline or post-encounter.
- **Examples:**
  - *Dormant Blade* → *Awakened Edge* on 3rd critical success in combat
  - *Leg Wound (condition)* → *Permanent Limp (scar)* if untreated for 20 ticks
  - *Dark Pact (agreement)* → *Devoured (curse)* if payment not met by deadline

### Tier C — Reactive/Triggered Primitives (respond to events)

These create emergent stories — items that do unexpected things at dramatic moments.

**C1. Reactive Effect** (designed, not built)
- **What:** When a specific event happens to the agent (attacked, healed, encounter_started, movement_completed, etc.), fire a nested effect.
- **Hook:** New — needs event subscription in encounter/tick pipeline.
- **Examples:**
  - *Thorned Armor* — when attacked: attacker takes -0.05 Iron penalty
  - *Phoenix Feather* — when health_low first triggered: restore to full (then consume self)
  - *Paranoia Curse (condition)* — when entering new location: -0.05 Heart for 3 ticks

**C2. On-Use Trigger Enhancement** (exists, needs richer content)
- **What:** After encounter resolution, fire effects based on outcome (critical_failure, success, etc.) with probability gating.
- **Hook:** `attachmentTriggers.ts` — exists and works.
- **Examples:**
  - *Glass Sword* — on critical_failure (50%): destroy self. On critical_success (25%): gain +1 tier.
  - *Lucky Coin* — on failure (30%): convert to success (test_shaper as trigger effect)
  - *Cursed Ring* — on any_use (10%): inflict random negative condition

**C3. Condition Infliction** (new)
- **What:** On success/critical in certain encounter types, inflict a condition on the opposing agent.
- **Hook:** New — post-resolution effect application to encounter counterparty.
- **Examples:**
  - *Venomous Dagger* — on combat success (40%): inflict "Poisoned" (decay -0.02 Flesh/tick for 10 ticks)
  - *Crown of Dread* — on social success (30%): inflict "Intimidated" (-0.05 Iron, 5 ticks)
  - *Scholar's Rebuke (bestowed power)* — on Veil success (25%): inflict "Confused" (-0.05 Eye, 3 ticks)

### Tier D — Action & Economy Primitives (change WHAT you can do)

**D1. Action Unlock** (designed, not built)
- **What:** While held, grants access to action templates the agent couldn't otherwise use. The attachment IS the prerequisite.
- **Hook:** New — action candidate filtering checks agent's possessions for `unlocksAction` tags.
- **Examples:**
  - *Ritual Tome* — unlocks `action.veil.ritual_channeling` (Veil create action requiring the tome)
  - *Siege Engine* — unlocks `action.iron.siege_assault` (high-Iron action only available with equipment)
  - *Diplomatic Seal* — unlocks `action.heart.treaty_negotiation`

**D2. Cost Modifier** (new)
- **What:** Reduce or increase the essence/AP cost of certain action types.
- **Hook:** New — modifies cost at action execution time.
- **Examples:**
  - *Ley Crystal* — -1 essence cost for Veil actions
  - *War Leader's Sash* — -1 AP for Iron actions
  - *Cursed Phylactery* — +2 essence cost for all actions, but +0.15 to all reaches

**D3. Wealth/Prosperity Modifier** (new)
- **What:** Modifies economic outcomes — trade income, prosperity growth, wealth gain rates.
- **Hook:** `prosperityTick.ts` or trade resolution.
- **Examples:**
  - *Merchant's Signet* — +10% prosperity growth at agent's location
  - *Cursed Hoard* — +50 wealth on acquisition, -2 wealth/tick (decaying asset)
  - *Trade Charter* — +1 trade route capacity at agent's location

### Tier E — Spatial & Social Primitives (change WHERE and WHO)

**E1. Movement Modifier** (new)
- **What:** Changes movement cost multiplier for the agent.
- **Hook:** Movement cost calculation in `movement.ts`.
- **Examples:**
  - *Seven-League Boots* — -50% movement cost (cross terrain faster)
  - *Ball and Chain (condition)* — +100% movement cost
  - *Mountain Goat Mount* — mountain terrain cost reduced to 1.0x (normally 2.0x)

**E2. Awareness Modifier** (partially exists via LOS traits)
- **What:** Changes how far the agent can see encounters, agents, or locations.
- **Hook:** `encounterAwareness.ts` — hex distance calculation.
- **Examples:**
  - *Eagle's Eye Charm* — +1 awareness hex range
  - *Blindfold of the Seer (condition)* — -2 normal awareness, but can see hidden/mystical encounters
  - *Spyglass* — +2 awareness range but only for locations (not encounters)

**E3. Faction Standing Modifier** (new)
- **What:** Passive modifier to reputation/standing with specific factions.
- **Hook:** Faction relationship system.
- **Examples:**
  - *Guild Membership Token* — +reputation with associated guild
  - *Outlaw's Brand (scar)* — -reputation with all law-aligned factions
  - *Diplomat's Sash* — +reputation gain rate with all factions (slower to lose standing)

**E4. Aura** (designed, not built)
- **What:** Applies an effect to all agents within range (allies, enemies, or both).
- **Hook:** `effectResolver.ts` — aura collector code exists.
- **Examples:**
  - *Battle Standard* — all allies on same hex: +0.05 Iron
  - *Plague Carrier (condition)* — all agents on same hex: 20% chance/tick to contract "Diseased"
  - *Inspiring Presence (bestowed power)* — all allies within 2 hexes: +0.03 Heart

---

## Primitive Priority Matrix

| Priority | Primitive | Why | Effort |
|----------|-----------|-----|--------|
| **P1** | Conditional Modifier (A1) | Engine ready, just needs content. Immediately diversifies items. | Content only |
| **P1** | Consumable Charges (B1) | Engine ready. Creates one-shot dramatic items. | Content only |
| **P1** | Cooldown (B2) | Engine ready. Makes powerful effects balanced. | Content only |
| **P1** | Stacking (B3) | Engine ready. Rewards consistent behavior. | Content only |
| **P1** | Decay (B4) | Engine ready. Makes temporary buffs feel alive. | Content only |
| **P2** | Test Shaper (A2) | Engine ready. Rerolls and outcome shifts are exciting. | Content only |
| **P2** | Transform (B5) | High narrative value (dormant→awakened). | Small engine work |
| **P2** | Reactive (C1) | Thorned armor, phoenix feather — high drama. | Medium engine work |
| **P2** | Tradeoff | Multi-reach cost/benefit creates interesting choices. | Content only |
| **P2** | On-Use Trigger Enhancement (C2) | Already works, just needs richer trigger effects. | Content only |
| **P3** | Threshold Modifier (A3) | Crit band manipulation is subtle but impactful. | Small engine work |
| **P3** | Condition Infliction (C3) | PvE status effects (poison, stun, intimidate). | Medium engine work |
| **P3** | Action Unlock (D1) | Items as prerequisites for special actions. | Medium engine work |
| **P3** | Movement Modifier (E1) | Spatial gameplay variety. | Small engine work |
| **P3** | Aura (E4) | Group dynamics, leadership items. | Medium engine work |
| **P4** | Difficulty Reduction (A4) | Niche but interesting for specialist tools. | Small engine work |
| **P4** | Cost Modifier (D2) | Economy tuning per-agent. | Small engine work |
| **P4** | Wealth/Prosperity Modifier (D3) | Economic gameplay. | Small engine work |
| **P4** | Faction Standing (E3) | Social simulation depth. | Small engine work |
| **P4** | Awareness Modifier (E2) | Already partially exists via LOS traits. | Content + small wiring |

---

## Example Compositions

The real power is **composing** multiple primitives on a single attachment:

**Moonblade (Legendary Arms, T4)**
- `conditional` — +0.12 Iron when `in_combat`
- `stacking` — +0.02 Iron per combat victory (max 3 stacks, decays 1/tick idle)
- `reactive` — when health_low: +0.08 Iron for 3 ticks (berserker mode)
- `test_shaper` — reroll first Iron failure per encounter (cooldown 10 ticks)

**Plague Doctor's Mask (Rare Vestments, T3)**
- `conditional` — +0.10 Flesh when `biome:swamp` or `biome:ruins`
- `aura` — allies on same hex: immunity to "Diseased" condition
- `tradeoff` — +0.08 Flesh, -0.04 Heart (clinical detachment)
- `decay` — starts at +0.10, decays 0.005/tick (herbs run out)

**Dark Pact (Agreement)**
- `permanent` — +0.15 to all reaches (immediate power)
- `decay` — essence drain: -1 essence/tick
- `transform` — if essence reaches 0: become "Devoured" curse (cannot be removed, -0.10 all reaches)
- `consumeOnEvent` — fulfilled if agent controls 3+ locations (agreement completed, pact satisfied)

**Seer's Third Eye (Bestowed Power)**
- `cooldown` — active 2 ticks / dormant 8 ticks
- `conditional` (while active) — `reveal` encounters within 3 hex range
- `tradeoff` — while active: +0.12 Eye, -0.06 Iron (physically vulnerable while scrying)
- `reactive` — when attacked while active: force cancel (go dormant immediately)

---

## Verification

This is a design document — no code changes to verify.

**Next steps after approval:**
1. Migrate existing catalog items from `reachBonus`/`domainContributions` to `effects[]` format (P1 primitives are engine-ready)
2. Wire P2 primitives (transform, reactive) into the orchestrator
3. Build an **attachment authoring pipeline** (skill, like `/encounter-pipeline`) — a multi-pass agent workflow:
   - **Pass 1 — Draft:** Agent composes attachment templates using the primitive vocabulary, targeting variety across subcategories, tiers, and reaches
   - **Pass 2 — Editorial:** Review for narrative quality, Threadbare tone, flavor text, naming
   - **Pass 3 — Systems Audit:** Balance check — modifier caps respected, no broken compositions, correct predicate usage, tier-appropriate power level
   - **Pass 4 — Final Merge:** Stamp approved items into `reward-attachment-catalog.ts` / `starter-attachments.ts`
4. Run the pipeline to author 30-50 new items using P1+P2 primitives to validate the vocabulary
5. CMS shows the results — humans review and give feedback, pipeline iterates
